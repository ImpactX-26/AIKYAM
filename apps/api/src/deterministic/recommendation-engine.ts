export interface RecommendationItem {
  serviceCode: string;
  type: 'SERVICE' | 'CONSULTANT_REFERRAL' | 'APPLICANT_ACTION';
  title: string;
  reasoning: string;
  priority: number;
  nextActions: string[];
}

export function generateRecommendations(
  pathway: 'STUDY' | 'VOCATIONAL' | 'WORK' | 'UNDECIDED',
  qualification: any,
  issues: any[],
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  // 1. Mandatory APS check for Study in India
  if (pathway === 'STUDY') {
    const missingAps = issues.some((i) => i.fieldPaths.includes('documents.aps_certificate'));
    if (missingAps) {
      recommendations.push({
        serviceCode: 'EDU-APS-GUIDE',
        type: 'SERVICE',
        title: 'APS Certificate Fast-Track Guidance',
        reasoning:
          'Mandatory for all Indian applicants submitting to German universities. Starting APS processing now avoids missing the semester intake.',
        priority: 1,
        nextActions: [
          'Collect university transcripts',
          'Verify DigiLocker documents',
          'Book Educaro document audit',
        ],
      });
    }
  }

  // 2. Language Level Boost
  const langIssue = issues.find((i) =>
    i.fieldPaths.some((p: string) => p.includes('languages') || p.includes('cefrLevel')),
  );
  if (langIssue || qualification?.status === 'CONDITIONALLY_ELIGIBLE') {
    recommendations.push({
      serviceCode: 'EDU-GER-A1B1',
      type: 'SERVICE',
      title: 'German Intensive Language Pathway (A1–B1)',
      reasoning:
        'Fluency accelerates admission approvals, employer matching in Ausbildung, and permanent settlement under the German Skilled Immigration Act.',
      priority: 2,
      nextActions: [
        'Take online diagnostic placement test',
        'Enroll in live evening batch with native tutors',
      ],
    });
  }

  // 3. Ausbildung Matching
  if (pathway === 'VOCATIONAL') {
    recommendations.push({
      serviceCode: 'EDU-AUSB-MATCH',
      type: 'SERVICE',
      title: 'Ausbildung Employer Matching & Apprenticeship Contract',
      reasoning:
        'Educaro partners with over 80 German hospitals and industrial firms offering paid dual apprenticeships with guaranteed training contracts.',
      priority: 1,
      nextActions: [
        'Complete German video profile',
        'Select preferred federal state (e.g., Baden-Württemberg, Bavaria)',
        'Schedule preliminary interview',
      ],
    });
  }

  // 4. Degree Recognition & Blue Card for Work
  if (pathway === 'WORK') {
    recommendations.push({
      serviceCode: 'EDU-DEG-RECOG',
      type: 'SERVICE',
      title: 'ZAB & Anabin Degree Equivalence Verification',
      reasoning:
        'Official Statement of Comparability from ZAB is essential for the German EU Blue Card and Chancenkarte visa applications.',
      priority: 1,
      nextActions: [
        'Review Anabin university H+ status',
        'Prepare certified translations',
        'Submit for formal statement',
      ],
    });
  }

  // 5. Eligible / Consultant Handoff
  if (qualification?.status === 'ELIGIBLE' || qualification?.score >= 80) {
    recommendations.push({
      serviceCode: 'EDU-CV-COACH',
      type: 'CONSULTANT_REFERRAL',
      title: 'Senior German Consultant 1-on-1 Handoff & CV Polish',
      reasoning:
        'Your profile is strongly positioned! A dedicated Educaro consultant will review your verified profile and orchestrate your direct applications.',
      priority: 1,
      nextActions: [
        'Review generated German-format CV',
        'Select 30-minute consultation slot',
        'Prepare specific university or employer preferences',
      ],
    });
  }

  return recommendations;
}
