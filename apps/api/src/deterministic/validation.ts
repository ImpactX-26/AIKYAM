export interface ValidationIssue {
  type: 'MISSING' | 'INCOMPLETE' | 'INCONSISTENT';
  severity: 'INFO' | 'WARN' | 'BLOCKER';
  fieldPaths: string[];
  message: string;
  suggestedAction: string;
  raisedBy: 'RULE';
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function cefrRank(level?: string): number {
  if (!level) return -1;
  const cleaned = level.toUpperCase().trim().slice(0, 2);
  return CEFR_LEVELS.indexOf(cleaned);
}

export function runDeterministicValidation(data: {
  goal?: string;
  personal?: any;
  educations?: any[];
  employments?: any[];
  languages?: any[];
  documents?: any[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const now = new Date();

  // 1. Date of Birth checks
  if (data.personal?.dob) {
    const dob = new Date(data.personal.dob);
    if (dob > now) {
      issues.push({
        type: 'INCONSISTENT',
        severity: 'BLOCKER',
        fieldPaths: ['personal.dob'],
        message: 'Date of birth cannot be in the future.',
        suggestedAction: 'Please enter your actual birth date.',
        raisedBy: 'RULE',
      });
    }

    // Check graduation age (< DOB + 16 years)
    if (data.educations && data.educations.length > 0) {
      for (let i = 0; i < data.educations.length; i++) {
        const edu = data.educations[i];
        if (edu.endDate) {
          const gradDate = new Date(edu.endDate);
          const minGradDate = new Date(dob);
          minGradDate.setFullYear(minGradDate.getFullYear() + 16);

          if (gradDate < minGradDate) {
            issues.push({
              type: 'INCONSISTENT',
              severity: 'WARN',
              fieldPaths: ['personal.dob', `education[${i}].endDate`],
              message: `Graduation date (${gradDate.getFullYear()}) occurs prior to age 16 for ${edu.degree}.`,
              suggestedAction: 'Verify birth date or graduation completion year.',
              raisedBy: 'RULE',
            });
          }
        }
      }
    }
  }

  // 2. Education date range check
  if (data.educations && data.educations.length > 0) {
    data.educations.forEach((edu, i) => {
      if (edu.startDate && edu.endDate) {
        const start = new Date(edu.startDate);
        const end = new Date(edu.endDate);
        if (start > end) {
          issues.push({
            type: 'INCONSISTENT',
            severity: 'BLOCKER',
            fieldPaths: [`education[${i}].startDate`, `education[${i}].endDate`],
            message: `Education start date cannot be later than completion date for ${edu.institution}.`,
            suggestedAction: 'Correct the enrollment or graduation dates.',
            raisedBy: 'RULE',
          });
        }
      }
    });
  }

  // 3. Employment overlap checks
  if (data.employments && data.employments.length > 1) {
    for (let i = 0; i < data.employments.length; i++) {
      for (let j = i + 1; j < data.employments.length; j++) {
        const empA = data.employments[i];
        const empB = data.employments[j];

        const startA = new Date(empA.startDate);
        const endA = empA.endDate ? new Date(empA.endDate) : now;
        const startB = new Date(empB.startDate);
        const endB = empB.endDate ? new Date(empB.endDate) : now;

        // Check if [startA, endA] and [startB, endB] overlap by more than 90 days
        const latestStart = startA > startB ? startA : startB;
        const earliestEnd = endA < endB ? endA : endB;

        if (latestStart < earliestEnd) {
          const overlapDays = (earliestEnd.getTime() - latestStart.getTime()) / (1000 * 3600 * 24);
          if (overlapDays > 90) {
            issues.push({
              type: 'INCONSISTENT',
              severity: 'WARN',
              fieldPaths: [`employment[${i}].dates`, `employment[${j}].dates`],
              message: `Concurrent Employment Overlap: ${empA.employer} and ${empB.employer} overlap by approx. ${Math.round(overlapDays / 30)} months.`,
              suggestedAction: 'Clarify if one role was part-time consulting or correct the relieving letter dates.',
              raisedBy: 'RULE',
            });
          }
        }
      }
    }
  }

  // 4. Document-level mismatches (e.g. Passport vs Marksheet DOB or Name)
  if (data.documents && data.documents.length > 0) {
    const passportDoc = data.documents.find((d) => d.type === 'PASSPORT');
    const certDocs = data.documents.filter((d) => d.type === 'CERTIFICATE' || d.type === 'DEGREE');

    if (passportDoc && certDocs.length > 0 && passportDoc.ocrText) {
      certDocs.forEach((cert) => {
        if (cert.ocrText) {
          // Look for DOB mismatch patterns if both contain OCR date tokens
          const dobMatch1 = passportDoc.ocrText.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
          const dobMatch2 = cert.ocrText.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);

          if (dobMatch1 && dobMatch2 && dobMatch1[0] !== dobMatch2[0]) {
            issues.push({
              type: 'INCONSISTENT',
              severity: 'BLOCKER',
              fieldPaths: ['personal.dob', 'documents.passport', `documents.${cert.fileName}`],
              message: `Date of Birth Mismatch: Passport OCR lists ${dobMatch1[0]}, while ${cert.fileName} lists ${dobMatch2[0]}.`,
              suggestedAction: 'German visa authorities require exact matching dates. Provide an official DOB affidavit.',
              raisedBy: 'RULE',
            });
          }
        }
      });
    }
  }

  // 5. Language proficiency claimed vs certificate check
  if (data.languages && data.languages.length > 0) {
    data.languages.forEach((lang, i) => {
      if (lang.language?.toLowerCase().includes('german')) {
        const declaredRank = cefrRank(lang.cefrLevel);

        if (lang.certificateName) {
          // If certificate name indicates lower level than declared
          const certLevelMatch = lang.certificateName.match(/\b([A-C][1-2])\b/i);
          if (certLevelMatch) {
            const certRank = cefrRank(certLevelMatch[1]);
            if (certRank >= 0 && declaredRank > certRank) {
              issues.push({
                type: 'INCONSISTENT',
                severity: 'WARN',
                fieldPaths: [`languages[${i}].cefrLevel`, `languages[${i}].certificateName`],
                message: `Language Level Discrepancy: You indicated ${lang.cefrLevel} German, but your certificate confirms ${certLevelMatch[1].toUpperCase()}.`,
                suggestedAction: 'Confirm current learning status or enroll in German language booster.',
                raisedBy: 'RULE',
              });
            }
          }
        }
      }
    });
  }

  // 6. Mandatory Pathway Documents Check
  const docs = data.documents || [];
  if (data.goal === 'STUDY') {
    const hasAps = docs.some(
      (d) =>
        d.type === 'CERTIFICATE' &&
        (d.fileName?.toLowerCase().includes('aps') || d.ocrText?.toLowerCase().includes('aps')),
    );
    if (!hasAps) {
      issues.push({
        type: 'MISSING',
        severity: 'BLOCKER',
        fieldPaths: ['documents.aps_certificate'],
        message: 'Mandatory Document Missing: Indian students require an APS Certificate (Akademische Prüfstelle) for German university admissions.',
        suggestedAction: 'Start Educaro APS Fast-Track Guidance or upload existing APS certificate.',
        raisedBy: 'RULE',
      });
    }
  }

  return issues;
}
