import { describe, it, expect } from 'vitest';
import { computeCompleteness } from './completeness';
import { runDeterministicValidation } from './validation';
import { evaluateQualification, simulateWhatIf } from './qualification';

describe('Deterministic Engines', () => {
  describe('Completeness Engine', () => {
    it('should compute zero score for empty profile and list high priority gaps', () => {
      const res = computeCompleteness({});
      expect(res.score).toBe(0);
      expect(res.gaps.length).toBeGreaterThan(0);
      expect(res.gaps[0].weight).toBeGreaterThanOrEqual(10);
    });

    it('should compute higher score when personal, education, and language are provided', () => {
      const res = computeCompleteness({
        personal: { name: 'Aarav Sharma', dob: '2001-08-14', cityIndia: 'Pune' },
        educations: [{ degree: 'B.Tech', institution: 'SPPU', grade: '8.4' }],
        languages: [{ language: 'German', cefrLevel: 'B1' }, { language: 'English' }],
        documents: [{ type: 'DEGREE' }],
      });
      expect(res.score).toBeGreaterThan(60);
      expect(res.breakdown.personal).toBeGreaterThan(10);
      expect(res.breakdown.education).toBe(25);
    });
  });

  describe('Validation Engine', () => {
    it('should catch future date of birth', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 2);
      const issues = runDeterministicValidation({
        personal: { dob: future.toISOString() },
      });
      expect(issues.some((i) => i.message.includes('future'))).toBe(true);
    });

    it('should catch overlapping employment dates', () => {
      const issues = runDeterministicValidation({
        employments: [
          { employer: 'Infosys', startDate: '2020-01-01', endDate: '2022-06-30' },
          { employer: 'TCS', startDate: '2021-01-01', endDate: '2023-01-01' },
        ],
      });
      expect(issues.some((i) => i.message.includes('Concurrent Employment Overlap'))).toBe(true);
    });

    it('should catch language declared vs certificate mismatch', () => {
      const issues = runDeterministicValidation({
        languages: [
          {
            language: 'German',
            cefrLevel: 'B2',
            certificateName: 'Goethe-Zertifikat A2',
          },
        ],
      });
      expect(issues.some((i) => i.message.includes('Language Level Discrepancy'))).toBe(true);
    });
  });

  describe('Qualification Engine & What-If Simulator', () => {
    const studyRules = {
      passingScore: 70,
      rules: [
        {
          id: 'APS',
          label: 'APS Certificate',
          weight: 30,
          required: true,
          ruleType: 'DOCUMENT_EXISTS',
          targetDocType: 'CERTIFICATE',
          subType: 'aps',
        },
        {
          id: 'DEGREE',
          label: 'Recognized Bachelor',
          weight: 40,
          required: true,
          ruleType: 'FIELD_MATCH',
          field: 'education.degree',
        },
        {
          id: 'LANG',
          label: 'Language',
          weight: 30,
          required: false,
          ruleType: 'LANGUAGE_THRESHOLD',
          germanMin: 'B2',
        },
      ],
    };

    it('should correctly mark missing requirements and compute score', () => {
      const outcome = evaluateQualification('STUDY', studyRules, {
        educations: [{ degree: 'B.Tech' }],
        languages: [{ language: 'German', cefrLevel: 'A2' }],
      });

      expect(outcome.score).toBe(40);
      expect(outcome.status).toBe('NOT_YET_ELIGIBLE');
      expect(outcome.missingRequirements.length).toBe(2);
    });

    it('should simulate what-if when German level is upgraded and APS is added', () => {
      const baseProfile = {
        educations: [{ degree: 'B.Tech' }],
        languages: [{ language: 'German', cefrLevel: 'A2' }],
      };

      const sim = simulateWhatIf('STUDY', studyRules, baseProfile, {
        germanLevel: 'B2',
        hasAps: true,
      });

      expect(sim.simulatedOutcome.score).toBe(100);
      expect(sim.simulatedOutcome.status).toBe('ELIGIBLE');
      expect(sim.deltaScore).toBe(60);
      expect(sim.statusChanged).toBe(true);
    });
  });
});
