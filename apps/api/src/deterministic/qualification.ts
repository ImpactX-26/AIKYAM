export interface RuleEvaluation {
  ruleId: string;
  label: string;
  passed: boolean;
  weight: number;
  evidenceFactIds?: string[];
}

export interface MissingRequirement {
  ruleId: string;
  description: string;
  estimatedEffort: string;
  recommendationCode: string | null;
}

export interface QualificationOutcome {
  pathway: 'STUDY' | 'VOCATIONAL' | 'WORK';
  status: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_YET_ELIGIBLE' | 'NEEDS_REVIEW';
  score: number;
  breakdown: RuleEvaluation[];
  missingRequirements: MissingRequirement[];
  explanation: string;
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function getCefrIndex(level?: string): number {
  if (!level) return -1;
  const match = level.toUpperCase().match(/\b([A-C][1-2])\b/);
  if (!match) return -1;
  return CEFR_ORDER.indexOf(match[1]);
}

export function evaluateQualification(
  pathway: 'STUDY' | 'VOCATIONAL' | 'WORK',
  rulesConfig: any,
  profile: {
    personal?: any;
    educations?: any[];
    employments?: any[];
    languages?: any[];
    documents?: any[];
  },
): QualificationOutcome {
  const rules = rulesConfig?.rules || [];
  const passingScore = rulesConfig?.passingScore || 70;

  const breakdown: RuleEvaluation[] = [];
  const missingRequirements: MissingRequirement[] = [];

  let totalScore = 0;
  let hasHardBlocker = false;

  for (const rule of rules) {
    let passed = false;

    switch (rule.ruleType) {
      case 'DOCUMENT_EXISTS': {
        const found = (profile.documents || []).some(
          (d) =>
            d.type === rule.targetDocType &&
            (!rule.subType ||
              d.fileName?.toLowerCase().includes(rule.subType.toLowerCase()) ||
              d.ocrText?.toLowerCase().includes(rule.subType.toLowerCase())),
        );
        passed = Boolean(found);
        break;
      }

      case 'FIELD_MATCH': {
        if (rule.field === 'education.degree') {
          passed = (profile.educations || []).some((e) => Boolean(e.degree));
        }
        break;
      }

      case 'MIN_EDUCATION': {
        passed = (profile.educations || []).length > 0;
        break;
      }

      case 'LANGUAGE_THRESHOLD': {
        const german = (profile.languages || []).find((l) =>
          l.language?.toLowerCase().includes('german'),
        );
        const english = (profile.languages || []).find((l) =>
          l.language?.toLowerCase().includes('english'),
        );

        const germanIdx = getCefrIndex(german?.cefrLevel);
        const reqGermanIdx = getCefrIndex(rule.germanMin);

        let germanPassed = reqGermanIdx >= 0 && germanIdx >= reqGermanIdx;
        let englishPassed = false;

        if (rule.englishIeltsMin && english) {
          englishPassed = true; // English proficient
        }

        // For Study: either German meets threshold or English proficient
        if (pathway === 'STUDY') {
          passed = germanPassed || englishPassed;
        } else {
          // For Vocational: German is mandatory
          passed = germanPassed;
        }
        break;
      }

      case 'DEGREE_RECOGNITION': {
        // Indian degrees from recognized universities (Anabin H+)
        passed = (profile.educations || []).some(
          (e) =>
            e.degree?.toLowerCase().includes('bachelor') ||
            e.degree?.toLowerCase().includes('b.tech') ||
            e.degree?.toLowerCase().includes('b.e.') ||
            e.degree?.toLowerCase().includes('master'),
        );
        break;
      }

      case 'EXPERIENCE_YEARS': {
        const count = (profile.employments || []).length;
        passed = count >= 1; // has verified experience
        break;
      }

      case 'CHANCENKARTE_POINTS': {
        // German Chancenkarte points calculation
        let points = 0;
        if (profile.educations && profile.educations.length > 0) points += 4; // Recognized degree
        const german = (profile.languages || []).find((l) =>
          l.language?.toLowerCase().includes('german'),
        );
        if (german && getCefrIndex(german.cefrLevel) >= getCefrIndex('A2')) points += 2;
        if (profile.employments && profile.employments.length >= 2) points += 3;
        passed = points >= (rule.minPoints || 6);
        break;
      }

      case 'AGE_CHECK': {
        if (profile.personal?.dob) {
          const age =
            (new Date().getTime() - new Date(profile.personal.dob).getTime()) /
            (365.25 * 24 * 3600 * 1000);
          passed = age >= (rule.minAge || 18) && age <= (rule.maxAge || 35);
        } else {
          passed = true;
        }
        break;
      }

      case 'FINANCIAL_READINESS':
      case 'EMPLOYER_SPONSORSHIP': {
        passed = false; // default open action item
        break;
      }

      default:
        passed = true;
    }

    if (passed) {
      totalScore += rule.weight || 0;
    } else {
      if (rule.required) {
        hasHardBlocker = true;
      }
      missingRequirements.push({
        ruleId: rule.id,
        description: `${rule.label} is currently outstanding.`,
        estimatedEffort: rule.estimatedEffort || '1-2 months',
        recommendationCode: rule.remediationService || null,
      });
    }

    breakdown.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      weight: rule.weight || 0,
    });
  }

  // Determine outcome status
  let status: QualificationOutcome['status'] = 'NEEDS_REVIEW';
  if (totalScore >= passingScore && !hasHardBlocker) {
    status = 'ELIGIBLE';
  } else if (totalScore >= 50) {
    status = 'CONDITIONALLY_ELIGIBLE';
  } else {
    status = 'NOT_YET_ELIGIBLE';
  }

  const explanation =
    status === 'ELIGIBLE'
      ? `You meet the primary criteria for the German ${pathway} pathway with an evaluation score of ${totalScore}/100. Outstanding items are standard administrative steps.`
      : status === 'CONDITIONALLY_ELIGIBLE'
      ? `You are on an encouraging track (Score: ${totalScore}/100), but satisfy conditions that require immediate action (such as language levels or mandatory verifications).`
      : `Further prerequisites need completion before proceeding with German visa application (Score: ${totalScore}/100). Follow the recommended Educaro roadmap below.`;

  return {
    pathway,
    status,
    score: totalScore,
    breakdown,
    missingRequirements,
    explanation,
  };
}

export function simulateWhatIf(
  pathway: 'STUDY' | 'VOCATIONAL' | 'WORK',
  rulesConfig: any,
  baseProfile: any,
  modifications: {
    germanLevel?: string;
    englishLevel?: string;
    yearsOfExperience?: number;
    hasAps?: boolean;
    hasContract?: boolean;
  },
) {
  const cloned = JSON.parse(JSON.stringify(baseProfile));

  if (modifications.germanLevel) {
    cloned.languages = cloned.languages || [];
    const idx = cloned.languages.findIndex((l: any) =>
      l.language?.toLowerCase().includes('german'),
    );
    if (idx >= 0) {
      cloned.languages[idx].cefrLevel = modifications.germanLevel;
    } else {
      cloned.languages.push({
        language: 'German',
        cefrLevel: modifications.germanLevel,
      });
    }
  }

  if (modifications.hasAps) {
    cloned.documents = cloned.documents || [];
    cloned.documents.push({
      type: 'CERTIFICATE',
      fileName: 'aps_certificate_simulated.pdf',
      ocrText: 'Akademische Prüfstelle APS Certificate',
    });
  }

  const baseOutcome = evaluateQualification(pathway, rulesConfig, baseProfile);
  const simOutcome = evaluateQualification(pathway, rulesConfig, cloned);

  return {
    baseOutcome,
    simulatedOutcome: simOutcome,
    deltaScore: simOutcome.score - baseOutcome.score,
    statusChanged: simOutcome.status !== baseOutcome.status,
    modificationsApplied: modifications,
  };
}
