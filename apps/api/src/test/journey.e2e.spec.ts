import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '../../.env' });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ApplicantGoal, Provenance } from '@prisma/client';
import { computeCompleteness } from '../deterministic/completeness';
import { runDeterministicValidation } from '../deterministic/validation';
import { evaluateQualification, simulateWhatIf } from '../deterministic/qualification';
import { generateRecommendations } from '../deterministic/recommendation-engine';
import { MockProvider } from '../llm/mock.provider';

describe('Educaro Compass - End-to-End Journey (Deterministic & MockProvider)', () => {
  const prisma = new PrismaClient();
  const mockLlm = new MockProvider();
  let testApplicantId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test applicant
    const user = await prisma.user.create({
      data: {
        email: `test_e2e_${Date.now()}@educaro.demo`,
        isGuest: true,
      },
    });
    testUserId = user.id;

    const applicant = await prisma.applicant.create({
      data: {
        userId: user.id,
        goal: ApplicantGoal.STUDY,
      },
    });
    testApplicantId = applicant.id;

    await prisma.profilePersonal.create({
      data: {
        applicantId: testApplicantId,
        name: 'Aarav Sharma',
        cityIndia: 'Pune',
      },
    });

    await prisma.education.create({
      data: {
        applicantId: testApplicantId,
        institution: 'SPPU Pune',
        degree: 'B.Tech Computer Science',
        fieldOfStudy: 'Computer Engineering',
        startDate: new Date('2020-08-01'),
        endDate: new Date('2024-06-30'),
        grade: '8.4 CGPA',
      },
    });
  });

  afterAll(async () => {
    if (testApplicantId) {
      await prisma.applicant.delete({ where: { id: testApplicantId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('Step 1: Provenance Fact Audit Trail - records facts with evidence without inventing data', async () => {
    const fact = await prisma.profileFact.create({
      data: {
        applicantId: testApplicantId,
        fieldPath: 'personal.name',
        value: 'Aarav Sharma',
        provenance: Provenance.VERIFIED,
        confidence: 0.99,
        evidenceType: 'DOCUMENT',
        evidenceRef: { document: 'btech_degree.pdf', page: 1 },
      },
    });

    expect(fact.id).toBeDefined();
    expect(fact.provenance).toBe('VERIFIED');
    expect(fact.confidence).toBe(0.99);
  });

  it('Step 2: Deterministic Completeness - computes gap list and score', async () => {
    const applicant = await prisma.applicant.findUnique({
      where: { id: testApplicantId },
      include: {
        personal: true,
        educations: true,
        employments: true,
        languages: true,
        documents: true,
      },
    });

    const completeness = computeCompleteness(applicant!);
    expect(completeness.score).toBeGreaterThan(30);
    expect(completeness.gaps.length).toBeGreaterThan(0);
    // German language gap identified
    expect(completeness.gaps.some((g) => g.field === 'german' || g.field === 'languages')).toBe(true);
  });

  it('Step 3: Deterministic Validation - identifies missing Indian APS certificate for Study pathway', () => {
    const issues = runDeterministicValidation({
      goal: 'STUDY',
      educations: [{ degree: 'B.Tech' }],
      documents: [],
    });

    expect(issues.some((i) => i.fieldPaths.includes('documents.aps_certificate'))).toBe(true);
  });

  it('Step 4: Deterministic Qualification & What-If Simulation', async () => {
    const ruleSet = await prisma.qualificationRuleSet.findFirst({
      where: { pathway: 'STUDY', isActive: true },
    });

    expect(ruleSet).toBeDefined();

    const baseProfile = {
      educations: [{ degree: 'B.Tech' }],
      languages: [{ language: 'German', cefrLevel: 'A2' }],
      documents: [],
    };

    const outcome = evaluateQualification('STUDY', ruleSet!.rulesJson, baseProfile);
    expect(outcome.status).toBe('NOT_YET_ELIGIBLE');
    expect(outcome.score).toBe(30);

    // Simulate German level upgrade to B2 + APS certificate
    const sim = simulateWhatIf('STUDY', ruleSet!.rulesJson, baseProfile, {
      germanLevel: 'B2',
      hasAps: true,
    });

    expect(sim.simulatedOutcome.score).toBeGreaterThan(outcome.score);
    expect(sim.deltaScore).toBeGreaterThan(0);
  });

  it('Step 5: Recommendation Engine - maps gaps to Educaro service catalogue', () => {
    const recs = generateRecommendations('STUDY', { status: 'CONDITIONALLY_ELIGIBLE' }, [
      { fieldPaths: ['documents.aps_certificate'] },
      { fieldPaths: ['languages[0].cefrLevel'] },
    ]);

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.serviceCode === 'EDU-APS-GUIDE')).toBe(true);
    expect(recs.some((r) => r.serviceCode === 'EDU-GER-A1B1')).toBe(true);
  });

  it('Step 6: MockProvider AI Speech-to-Text & Insights', async () => {
    const dummyBuffer = Buffer.from('RIFF....WAVEfmt ');
    const transcription = await mockLlm.transcribe(dummyBuffer, 'audio/webm');

    expect(transcription.transcript).toContain('Aarav');
    expect(transcription.segments.length).toBeGreaterThan(0);
  });
});
