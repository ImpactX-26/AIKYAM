import { PrismaClient, UserRole, ApplicantGoal, SkillCategory, LanguageSource, DocumentType, DocumentProcessingStatus, ExtractionStatus, Provenance, EvidenceType, ClarificationType, ClarificationSeverity, ClarificationRaisedBy, ClarificationStatus, Pathway, QualificationStatus, CtaType, RecommendationType, CvLanguage } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Educaro Compass...\n');

  // 1. Clean existing seed data (idempotent reset)
  console.log('🧹 Cleaning existing tables...');
  await prisma.auditLog.deleteMany();
  await prisma.agentStep.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.consultantReferral.deleteMany();
  await prisma.cvDocument.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.qualificationResult.deleteMany();
  await prisma.qualificationRuleSet.deleteMany();
  await prisma.clarificationTask.deleteMany();
  await prisma.profileFact.deleteMany();
  await prisma.media.deleteMany();
  await prisma.motivation.deleteMany();
  await prisma.documentExtraction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.languageProficiency.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.education.deleteMany();
  await prisma.profilePersonal.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.educaroService.deleteMany();

  // 2. Create Consultant User
  console.log('👤 Seeding Consultant User...');
  const consultantUser = await prisma.user.create({
    data: {
      email: 'consultant@educaro.de',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.1k1F6m0u7LKGm0pY1b5S3eYv9hP0.exampleHash', // Demo hash
      role: UserRole.CONSULTANT,
      locale: 'de',
      isGuest: false,
    },
  });
  console.log(`   -> Created Consultant: ${consultantUser.email} (${consultantUser.id})`);

  // 3. Seed Educaro Services Catalogue (8-10 services)
  console.log('📦 Seeding Educaro Service Catalogue...');
  const services = [
    {
      code: 'EDU-APS-GUIDE',
      name: 'APS Certificate Fast-Track Guidance',
      description: 'End-to-end support for Indian applicants to clear the mandatory Akademische Prüfstelle (APS) verification and document submission.',
      pathway: 'STUDY',
      prerequisites: { requiredDocs: ['DEGREE', 'TRANSCRIPT'] },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-GER-A1B1',
      name: 'German Intensive Language Pathway (A1 to B1)',
      description: 'Interactive Goethe/Telc-certified curriculum with native German tutors tailored for Indian students and trainees.',
      pathway: 'ALL',
      prerequisites: { targetCefr: 'B1' },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-GER-B2C1',
      name: 'Advanced German Professional (B2/C1)',
      description: 'Medical & technical terminology courses required for healthcare Ausbildung and direct German university admissions.',
      pathway: 'ALL',
      prerequisites: { currentCefr: 'B1', targetCefr: 'B2' },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-STK-PREP',
      name: 'Studienkolleg & FSP Foundation Prep',
      description: 'Preparation program for Indian 12th standard graduates needing the 1-year preparatory college before German university entry.',
      pathway: 'STUDY',
      prerequisites: { schoolingYears: 12 },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-AUSB-MATCH',
      name: 'Ausbildung Employer Matching & Apprenticeship Contract',
      description: 'Guaranteed matching with certified German partner companies in nursing, IT, logistics, and hospitality with a paid monthly stipend.',
      pathway: 'VOCATIONAL',
      prerequisites: { minGerman: 'B1', minEducation: '12th Standard' },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-DEG-RECOG',
      name: 'ZAB & Anabin Degree Recognition Support',
      description: 'Official assessment and statement of comparability for foreign higher education qualifications via the Central Office for Foreign Education (ZAB).',
      pathway: 'WORK',
      prerequisites: { requiredDocs: ['DEGREE', 'TRANSCRIPT'] },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-CHANCE-CARD',
      name: 'Chancenkarte (Opportunity Card) Strategy & Points Filing',
      description: 'Calculation, documentation, and filing under the German points-based Opportunity Card to seek employment on-site in Germany.',
      pathway: 'WORK',
      prerequisites: { minPoints: 6 },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-VISA-FAST',
      name: 'German National Visa (Type D) & Blocked Account Package',
      description: 'Appointment slot coordination, checklist verification, Sperrkonto guidance, and incoming health insurance arrangement.',
      pathway: 'ALL',
      prerequisites: { admissionOfferOrContract: true },
      ctaType: CtaType.SERVICE,
    },
    {
      code: 'EDU-CV-COACH',
      name: 'German Lebenslauf & Technical Interview Coaching',
      description: 'Transformation of Indian format CVs to DIN 5008 German standards, cover letter tailoring, and simulated German HR interviews.',
      pathway: 'ALL',
      prerequisites: {},
      ctaType: CtaType.CONSULTANT,
    },
  ];

  for (const s of services) {
    await prisma.educaroService.create({ data: s });
  }
  console.log(`   -> Seeded ${services.length} Educaro services.`);

  // 4. Seed Qualification Rule Sets (STUDY, VOCATIONAL, WORK)
  console.log('⚖️  Seeding Qualification Rule Sets (Rules-as-Data)...');
  const ruleSets = [
    {
      pathway: Pathway.STUDY,
      version: '2026.1',
      rulesJson: {
        disclaimer: 'EXAMPLE, confirm with Educaro consultant',
        pathway: 'STUDY',
        passingScore: 75,
        rules: [
          {
            id: 'APS_CERT_MANDATORY',
            label: 'Mandatory Indian APS Certificate',
            weight: 30,
            required: true,
            ruleType: 'DOCUMENT_EXISTS',
            targetDocType: 'CERTIFICATE',
            subType: 'APS',
            estimatedEffort: '3-4 weeks',
            remediationService: 'EDU-APS-GUIDE',
          },
          {
            id: 'RECOGNIZED_BACHELOR',
            label: 'Recognized 3 or 4-Year Bachelor Degree (Anabin H+)',
            weight: 30,
            required: true,
            ruleType: 'FIELD_MATCH',
            field: 'education.degree',
            estimatedEffort: 'Requires completed undergraduate',
            remediationService: 'EDU-DEG-RECOG',
          },
          {
            id: 'GERMAN_OR_ENGLISH_PROFICIENCY',
            label: 'Language Proficiency (Min. B2 German or IELTS 6.5)',
            weight: 25,
            required: true,
            ruleType: 'LANGUAGE_THRESHOLD',
            germanMin: 'B2',
            englishIeltsMin: 6.5,
            estimatedEffort: '2-4 months language training',
            remediationService: 'EDU-GER-A1B1',
          },
          {
            id: 'BLOCKED_ACCOUNT_READINESS',
            label: 'Financial Proof (€11,904/year Blocked Account or Scholarship)',
            weight: 15,
            required: false,
            ruleType: 'FINANCIAL_READINESS',
            estimatedEffort: 'Financial preparation',
            remediationService: 'EDU-VISA-FAST',
          },
        ],
      },
    },
    {
      pathway: Pathway.VOCATIONAL,
      version: '2026.1',
      rulesJson: {
        disclaimer: 'EXAMPLE, confirm with Educaro consultant',
        pathway: 'VOCATIONAL',
        passingScore: 70,
        rules: [
          {
            id: 'SECONDARY_SCHOOL_12TH',
            label: '12th Standard Higher Secondary Completion (Indian Board)',
            weight: 30,
            required: true,
            ruleType: 'MIN_EDUCATION',
            minYears: 12,
            estimatedEffort: 'School certificate verification',
            remediationService: null,
          },
          {
            id: 'GERMAN_B1_MINIMUM',
            label: 'German Language Level (Min. B1, B2 Recommended for Nursing)',
            weight: 40,
            required: true,
            ruleType: 'LANGUAGE_THRESHOLD',
            germanMin: 'B1',
            preferred: 'B2',
            estimatedEffort: '3-5 months intensive language study',
            remediationService: 'EDU-GER-A1B1',
          },
          {
            id: 'AGE_CRITERIA',
            label: 'Eligible Age Range (Typical 18–30 years for Visa Approval)',
            weight: 15,
            required: false,
            ruleType: 'AGE_CHECK',
            minAge: 18,
            maxAge: 32,
            estimatedEffort: 'N/A',
            remediationService: null,
          },
          {
            id: 'AUSBILDUNG_PARTNER_CONTRACT',
            label: 'Secured Apprenticeship Training Contract from German Employer',
            weight: 15,
            required: false,
            ruleType: 'EMPLOYER_SPONSORSHIP',
            estimatedEffort: '1-2 months matching process',
            remediationService: 'EDU-AUSB-MATCH',
          },
        ],
      },
    },
    {
      pathway: Pathway.WORK,
      version: '2026.1',
      rulesJson: {
        disclaimer: 'EXAMPLE, confirm with Educaro consultant',
        pathway: 'WORK',
        passingScore: 70,
        rules: [
          {
            id: 'HIGHER_DEGREE_EQUIVALENCE',
            label: 'Formal Degree Equivalence in Germany (Anabin H+ or ZAB)',
            weight: 35,
            required: true,
            ruleType: 'DEGREE_RECOGNITION',
            estimatedEffort: '4-8 weeks via ZAB',
            remediationService: 'EDU-DEG-RECOG',
          },
          {
            id: 'MIN_WORK_EXPERIENCE',
            label: 'Relevant Professional Experience (At least 2 years)',
            weight: 25,
            required: true,
            ruleType: 'EXPERIENCE_YEARS',
            minYears: 2,
            estimatedEffort: 'Documentation of verified experience letters',
            remediationService: 'EDU-CV-COACH',
          },
          {
            id: 'CHANCENKARTE_OR_JOB_OFFER',
            label: 'Valid German Job Offer (Blue Card salary) OR 6+ Chancenkarte Points',
            weight: 25,
            required: true,
            ruleType: 'CHANCENKARTE_POINTS',
            minPoints: 6,
            estimatedEffort: 'Points optimization & submission',
            remediationService: 'EDU-CHANCE-CARD',
          },
          {
            id: 'GERMAN_A1_OR_ENGLISH_B2',
            label: 'Language Proficiency for Workplace Integration (A1 German or B2 English)',
            weight: 15,
            required: false,
            ruleType: 'LANGUAGE_THRESHOLD',
            germanMin: 'A1',
            englishMin: 'B2',
            estimatedEffort: '1-2 months language brush-up',
            remediationService: 'EDU-GER-A1B1',
          },
        ],
      },
    },
  ];

  const createdRuleSets: Record<string, string> = {};
  for (const r of ruleSets) {
    const created = await prisma.qualificationRuleSet.create({
      data: {
        pathway: r.pathway,
        version: r.version,
        rulesJson: r.rulesJson,
        isActive: true,
      },
    });
    createdRuleSets[r.pathway] = created.id;
  }
  console.log('   -> Seeded rule sets for STUDY, VOCATIONAL, and WORK pathways.');

  // ----------------------------------------------------------------------------
  // 5. Seed 3 Demo Applicant Personas (with planted inconsistencies)
  // ----------------------------------------------------------------------------
  console.log('\n🎭 Seeding 3 Demo Personas with planted real-world inconsistencies...');

  // ----------------------------------------------------------------------------
  // PERSONA 1: Aarav Sharma (Master's in Engineering Aspirant)
  // Goal: STUDY
  // Planted Inconsistency: Claims B2 German in chat/profile, but document is only A2! Missing APS certificate.
  // ----------------------------------------------------------------------------
  console.log('   [1/3] Persona 1: Aarav Sharma (Study - B.Tech Grad -> Master in Germany)');
  const u1 = await prisma.user.create({
    data: {
      email: 'aarav.sharma@example.in',
      role: UserRole.APPLICANT,
      locale: 'en',
      isGuest: false,
    },
  });

  const app1 = await prisma.applicant.create({
    data: {
      userId: u1.id,
      goal: ApplicantGoal.STUDY,
      currentStage: 'REVIEW',
      completenessScore: 78,
      consentGivenAt: new Date('2026-03-01T10:00:00Z'),
      consentVersion: 'v1.0-impactx26',
    },
  });

  await prisma.profilePersonal.create({
    data: {
      applicantId: app1.id,
      name: 'Aarav Sharma',
      dob: new Date('2001-08-14T00:00:00Z'),
      nationality: 'Indian',
      email: 'aarav.sharma@example.in',
      phone: '+91 98765 43210',
      cityIndia: 'Pune, Maharashtra',
      targetCityGermany: 'Munich (TUM / LMU)',
      availabilityDate: new Date('2026-10-01T00:00:00Z'),
    },
  });

  await prisma.education.create({
    data: {
      applicantId: app1.id,
      institution: 'Savitribai Phule Pune University',
      degree: 'Bachelor of Technology (B.Tech)',
      fieldOfStudy: 'Computer Engineering',
      startDate: new Date('2020-08-01T00:00:00Z'),
      endDate: new Date('2024-06-30T00:00:00Z'),
      grade: '8.4 / 10 CGPA',
      gradeScale: '10.0',
      country: 'India',
    },
  });

  await prisma.employment.create({
    data: {
      applicantId: app1.id,
      employer: 'Tech Mahindra Ltd.',
      role: 'Junior Software Engineer Intern',
      responsibilities: 'Developed REST APIs in Node.js and automated unit testing pipelines.',
      startDate: new Date('2024-01-10T00:00:00Z'),
      endDate: new Date('2024-06-20T00:00:00Z'),
      isCurrent: false,
      country: 'India',
      industry: 'Information Technology',
    },
  });

  await prisma.skill.createMany({
    data: [
      { applicantId: app1.id, name: 'TypeScript', category: SkillCategory.TECHNICAL, level: 'Advanced' },
      { applicantId: app1.id, name: 'PostgreSQL', category: SkillCategory.TECHNICAL, level: 'Intermediate' },
      { applicantId: app1.id, name: 'Python', category: SkillCategory.TECHNICAL, level: 'Intermediate' },
    ],
  });

  // Language claimed vs certificate mismatch
  await prisma.languageProficiency.create({
    data: {
      applicantId: app1.id,
      language: 'German',
      cefrLevel: 'B2', // Claimed
      source: LanguageSource.SELF_DECLARED,
      certificateName: 'Goethe-Zertifikat A2 (Uploaded certificate is only A2)',
      scoreRaw: 'A2 passed with 82%',
    },
  });

  await prisma.languageProficiency.create({
    data: {
      applicantId: app1.id,
      language: 'English',
      cefrLevel: 'C1',
      source: LanguageSource.CERTIFICATE,
      certificateName: 'IELTS Academic',
      scoreRaw: 'Overall 7.5 (L:8, R:7.5, W:7, S:7)',
      testDate: new Date('2024-09-15T00:00:00Z'),
    },
  });

  await prisma.motivation.create({
    data: {
      applicantId: app1.id,
      reasonForGermany: 'Germany offers world-class tuition-free engineering education and cutting-edge research opportunities in AI and Robotics.',
      preferredPathway: 'Master of Science in Informatics / Robotics',
      longTermGoals: 'Work in German industry R&D and lead cross-border tech innovations.',
      targetField: 'Computer Science & AI',
    },
  });

  const doc1A = await prisma.document.create({
    data: {
      applicantId: app1.id,
      type: DocumentType.DEGREE,
      fileName: 'aarav_sharma_btech_degree.pdf',
      mimeType: 'application/pdf',
      storageKey: 'uploads/demo/aarav_degree.pdf',
      pages: 1,
      processingStatus: DocumentProcessingStatus.DONE,
      ocrText: 'SAVITRIBAI PHULE PUNE UNIVERSITY - Degree of Bachelor of Technology in Computer Engineering conferred on Aarav Sharma, June 2024.',
      classifiedConfidence: 0.98,
    },
  });

  const doc1B = await prisma.document.create({
    data: {
      applicantId: app1.id,
      type: DocumentType.LANGUAGE_CERT,
      fileName: 'goethe_a2_certificate.pdf',
      mimeType: 'application/pdf',
      storageKey: 'uploads/demo/aarav_german_a2.pdf',
      pages: 1,
      processingStatus: DocumentProcessingStatus.DONE,
      ocrText: 'GOETHE-INSTITUT - ZERTIFIKAT A2 - Aarav Sharma hat die Prüfung bestanden mit 82 Punkten.',
      classifiedConfidence: 0.99,
    },
  });

  await prisma.documentExtraction.create({
    data: {
      documentId: doc1B.id,
      fieldPath: 'languages[0].cefrLevel',
      value: { level: 'A2', exam: 'Goethe-Zertifikat A2' },
      confidence: 0.99,
      pageNumber: 1,
      status: ExtractionStatus.CONFIRMED,
    },
  });

  // Provenance-tracked Profile Facts
  await prisma.profileFact.createMany({
    data: [
      {
        applicantId: app1.id,
        fieldPath: 'personal.name',
        value: 'Aarav Sharma',
        provenance: Provenance.VERIFIED,
        confidence: 0.99,
        evidenceType: EvidenceType.DOCUMENT,
        evidenceRef: { documentId: doc1A.id, page: 1, text: 'Aarav Sharma' },
        confirmedAt: new Date(),
        version: 1,
      },
      {
        applicantId: app1.id,
        fieldPath: 'education[0].degree',
        value: 'Bachelor of Technology (B.Tech)',
        provenance: Provenance.VERIFIED,
        confidence: 0.98,
        evidenceType: EvidenceType.DOCUMENT,
        evidenceRef: { documentId: doc1A.id, page: 1 },
        confirmedAt: new Date(),
        version: 1,
      },
      {
        applicantId: app1.id,
        fieldPath: 'languages[0].cefrLevel',
        value: 'B2',
        provenance: Provenance.APPLICANT_PROVIDED,
        confidence: 0.8,
        evidenceType: EvidenceType.CHAT,
        evidenceRef: { message: 'I have prepared up to B2 level in German' },
        version: 1,
      },
    ],
  });

  // Planted Inconsistency 1: Language level discrepancy
  await prisma.clarificationTask.create({
    data: {
      applicantId: app1.id,
      type: ClarificationType.INCONSISTENT,
      severity: ClarificationSeverity.WARN,
      fieldPaths: ['languages[0].cefrLevel', 'documents.goethe_a2_certificate'],
      message: 'Language Level Discrepancy: You indicated B2 German in your profile, but the uploaded Goethe certificate confirms A2.',
      suggestedAction: 'Please confirm if you are currently taking B2 classes, or enroll in Educaro German B1-B2 fast track.',
      status: ClarificationStatus.OPEN,
      raisedBy: ClarificationRaisedBy.RULE,
    },
  });

  // Planted Missing Requirement: APS certificate
  await prisma.clarificationTask.create({
    data: {
      applicantId: app1.id,
      type: ClarificationType.MISSING,
      severity: ClarificationSeverity.BLOCKER,
      fieldPaths: ['documents.aps_certificate'],
      message: 'Mandatory Document Missing: Indian candidates require an APS certificate (Akademische Prüfstelle) for German student visa & university admissions.',
      suggestedAction: 'Start Educaro APS Guidance or upload an existing APS verification document.',
      status: ClarificationStatus.OPEN,
      raisedBy: ClarificationRaisedBy.RULE,
    },
  });

  // Qualification Result
  await prisma.qualificationResult.create({
    data: {
      applicantId: app1.id,
      ruleSetId: createdRuleSets[Pathway.STUDY],
      pathway: Pathway.STUDY,
      status: QualificationStatus.CONDITIONALLY_ELIGIBLE,
      score: 65,
      breakdown: [
        { ruleId: 'APS_CERT_MANDATORY', label: 'Mandatory Indian APS Certificate', passed: false, weight: 30 },
        { ruleId: 'RECOGNIZED_BACHELOR', label: 'Recognized Bachelor Degree (Anabin H+)', passed: true, weight: 30 },
        { ruleId: 'GERMAN_OR_ENGLISH_PROFICIENCY', label: 'Language Proficiency (English C1 passed, German only A2)', passed: true, weight: 25 },
        { ruleId: 'BLOCKED_ACCOUNT_READINESS', label: 'Financial Proof', passed: false, weight: 15 },
      ],
      missingRequirements: [
        { ruleId: 'APS_CERT_MANDATORY', description: 'APS Certificate verification required before visa filing', estimatedEffort: '3-4 weeks', recommendationCode: 'EDU-APS-GUIDE' },
        { ruleId: 'GERMAN_OR_ENGLISH_PROFICIENCY', description: 'Advance German from A2 to B2 for broad public university choices', estimatedEffort: '3 months', recommendationCode: 'EDU-GER-A1B1' },
      ],
      explanation: 'Aarav has a solid academic background (8.4 CGPA in B.Tech CS) from a recognized university. He qualifies for English-taught Master programs, but must obtain the mandatory Indian APS certificate immediately and advance German to B2 to expand post-study job opportunities.',
    },
  });

  // Recommendations
  await prisma.recommendation.create({
    data: {
      applicantId: app1.id,
      serviceCode: 'EDU-APS-GUIDE',
      type: RecommendationType.SERVICE,
      title: 'Initiate Educaro APS Fast-Track Guidance',
      reasoning: 'APS verification in India currently has a 4-week turnaround. Starting today prevents missing the upcoming German semester deadline.',
      priority: 1,
      nextActions: ['Collect university transcripts', 'Submit Digilocker degree verification', 'Book Educaro consultant review'],
    },
  });

  // ----------------------------------------------------------------------------
  // PERSONA 2: Priya Patel (Vocational Training / Ausbildung Healthcare)
  // Goal: VOCATIONAL
  // Planted Inconsistency: Date of Birth mismatch between Passport and 12th Certificate!
  // ----------------------------------------------------------------------------
  console.log('   [2/3] Persona 2: Priya Patel (Ausbildung - 12th Pass -> Healthcare Nursing in Germany)');
  const u2 = await prisma.user.create({
    data: {
      email: 'priya.patel@example.in',
      role: UserRole.APPLICANT,
      locale: 'en',
      isGuest: false,
    },
  });

  const app2 = await prisma.applicant.create({
    data: {
      userId: u2.id,
      goal: ApplicantGoal.VOCATIONAL,
      currentStage: 'REVIEW',
      completenessScore: 82,
      consentGivenAt: new Date('2026-03-02T11:30:00Z'),
      consentVersion: 'v1.0-impactx26',
    },
  });

  await prisma.profilePersonal.create({
    data: {
      applicantId: app2.id,
      name: 'Priya Patel',
      dob: new Date('2005-04-12T00:00:00Z'), // Passport DOB: 12 April 2005
      nationality: 'Indian',
      email: 'priya.patel@example.in',
      phone: '+91 91234 56789',
      cityIndia: 'Ahmedabad, Gujarat',
      targetCityGermany: 'Stuttgart / Baden-Württemberg',
      availabilityDate: new Date('2026-09-01T00:00:00Z'),
    },
  });

  await prisma.education.create({
    data: {
      applicantId: app2.id,
      institution: 'Gujarat Secondary and Higher Secondary Education Board (GSEB)',
      degree: 'Higher Secondary Certificate (12th Standard)',
      fieldOfStudy: 'Science (PCB - Physics, Chemistry, Biology)',
      startDate: new Date('2021-06-01T00:00:00Z'),
      endDate: new Date('2023-05-15T00:00:00Z'),
      grade: '81.5%',
      country: 'India',
    },
  });

  await prisma.languageProficiency.create({
    data: {
      applicantId: app2.id,
      language: 'German',
      cefrLevel: 'B1',
      source: LanguageSource.CERTIFICATE,
      certificateName: 'Goethe-Zertifikat B1',
      scoreRaw: 'Passed (S:75, H:80, L:78, S:82)',
      testDate: new Date('2025-11-20T00:00:00Z'),
    },
  });

  await prisma.motivation.create({
    data: {
      applicantId: app2.id,
      reasonForGermany: 'Germany offers dual vocational training (Ausbildung) with practical hospital experience, a monthly stipend, and direct pathway to German nursing licensure.',
      preferredPathway: 'General Healthcare & Nursing Apprenticeship (Pflegefachfrau)',
      longTermGoals: 'Become a specialized ICU nurse in Germany and pursue advanced healthcare leadership.',
      targetField: 'Healthcare & Nursing',
    },
  });

  const doc2Passport = await prisma.document.create({
    data: {
      applicantId: app2.id,
      type: DocumentType.PASSPORT,
      fileName: 'priya_patel_passport.pdf',
      mimeType: 'application/pdf',
      storageKey: 'uploads/demo/priya_passport.pdf',
      pages: 2,
      processingStatus: DocumentProcessingStatus.DONE,
      ocrText: 'REPUBLIC OF INDIA PASSPORT - Given Name: PRIYA, Surname: PATEL, Date of Birth: 12/04/2005 (12 April 2005)',
      classifiedConfidence: 0.99,
    },
  });

  const doc2HSC = await prisma.document.create({
    data: {
      applicantId: app2.id,
      type: DocumentType.CERTIFICATE,
      fileName: 'priya_patel_12th_marksheet.pdf',
      mimeType: 'application/pdf',
      storageKey: 'uploads/demo/priya_12th.pdf',
      pages: 1,
      processingStatus: DocumentProcessingStatus.DONE,
      ocrText: 'GUJARAT SECONDARY EDUCATION BOARD - Candidate: Priya Patel, Date of Birth: 12/06/2005 (12 June 2005)',
      classifiedConfidence: 0.97,
    },
  });

  // Planted Inconsistency 2: Deterministic Date of Birth mismatch
  await prisma.clarificationTask.create({
    data: {
      applicantId: app2.id,
      type: ClarificationType.INCONSISTENT,
      severity: ClarificationSeverity.BLOCKER,
      fieldPaths: ['personal.dob', 'documents.passport', 'documents.hsc_certificate'],
      message: 'Date of Birth Mismatch: Passport lists DOB as 12-Apr-2005, whereas your 12th Board marksheet lists 12-Jun-2005.',
      suggestedAction: 'German visa authorities require exact matching dates. Please provide an official DOB affidavit or corrected board certificate.',
      status: ClarificationStatus.OPEN,
      raisedBy: ClarificationRaisedBy.RULE,
    },
  });

  await prisma.qualificationResult.create({
    data: {
      applicantId: app2.id,
      ruleSetId: createdRuleSets[Pathway.VOCATIONAL],
      pathway: Pathway.VOCATIONAL,
      status: QualificationStatus.ELIGIBLE,
      score: 85,
      breakdown: [
        { ruleId: 'SECONDARY_SCHOOL_12TH', label: '12th Standard Higher Secondary Completion', passed: true, weight: 30 },
        { ruleId: 'GERMAN_B1_MINIMUM', label: 'German Language Level (B1 certified)', passed: true, weight: 40 },
        { ruleId: 'AGE_CRITERIA', label: 'Age Criteria (20 years old, highly eligible)', passed: true, weight: 15 },
        { ruleId: 'AUSBILDUNG_PARTNER_CONTRACT', label: 'Apprenticeship Contract', passed: false, weight: 15 },
      ],
      missingRequirements: [
        { ruleId: 'AUSBILDUNG_PARTNER_CONTRACT', description: 'Partner hospital contract matching required for visa', estimatedEffort: '1 month matching', recommendationCode: 'EDU-AUSB-MATCH' },
        { ruleId: 'GERMAN_B1_MINIMUM', description: 'Begin B2 Medical German for clinical hospital environment', estimatedEffort: '2 months', recommendationCode: 'EDU-GER-B2C1' },
      ],
      explanation: 'Priya satisfies the 12th standard and German B1 threshold for dual nursing Ausbildung. Once the DOB document mismatch is resolved with an affidavit, she is primed for hospital matching through Educaro partner clinics in Baden-Württemberg.',
    },
  });

  await prisma.recommendation.create({
    data: {
      applicantId: app2.id,
      serviceCode: 'EDU-AUSB-MATCH',
      type: RecommendationType.SERVICE,
      title: 'Ausbildung Hospital Matching Program',
      reasoning: 'With B1 German and PCB 12th standard, Priya is in high demand by German healthcare employers who sponsor full training with stipend.',
      priority: 1,
      nextActions: ['Provide DOB affidavit', 'Record short German self-intro video', 'Schedule partner clinic interview'],
    },
  });

  // ----------------------------------------------------------------------------
  // PERSONA 3: Vikram Malhotra (Senior Cloud Engineer - Skilled Work / Blue Card)
  // Goal: WORK
  // Planted Inconsistency: Overlapping employment dates (TCS & Infosys overlap by 1.5 years)!
  // ----------------------------------------------------------------------------
  console.log('   [3/3] Persona 3: Vikram Malhotra (Skilled Work - Cloud/DevOps -> German Blue Card)');
  const u3 = await prisma.user.create({
    data: {
      email: 'vikram.malhotra@example.in',
      role: UserRole.APPLICANT,
      locale: 'en',
      isGuest: false,
    },
  });

  const app3 = await prisma.applicant.create({
    data: {
      userId: u3.id,
      goal: ApplicantGoal.WORK,
      currentStage: 'REVIEW',
      completenessScore: 88,
      consentGivenAt: new Date('2026-03-03T09:15:00Z'),
      consentVersion: 'v1.0-impactx26',
    },
  });

  await prisma.profilePersonal.create({
    data: {
      applicantId: app3.id,
      name: 'Vikram Malhotra',
      dob: new Date('1997-11-23T00:00:00Z'),
      nationality: 'Indian',
      email: 'vikram.malhotra@example.in',
      phone: '+91 99887 76655',
      cityIndia: 'Bengaluru, Karnataka',
      targetCityGermany: 'Berlin / Frankfurt',
      availabilityDate: new Date('2026-08-01T00:00:00Z'),
    },
  });

  await prisma.education.create({
    data: {
      applicantId: app3.id,
      institution: 'Visvesvaraya Technological University (VTU)',
      degree: 'Bachelor of Engineering (B.E.)',
      fieldOfStudy: 'Information Science & Engineering',
      startDate: new Date('2015-08-01T00:00:00Z'),
      endDate: new Date('2019-06-25T00:00:00Z'),
      grade: 'First Class with Distinction (74%)',
      country: 'India',
    },
  });

  // Planted Overlap: Infosys (2019-07 to 2022-06) vs TCS (2021-01 to 2024-03) -> 17 months concurrent overlap!
  await prisma.employment.create({
    data: {
      applicantId: app3.id,
      employer: 'Infosys Limited',
      role: 'Systems Engineer -> Senior Systems Engineer',
      responsibilities: 'Maintained AWS cloud infrastructure, Kubernetes clusters, and Terraform deployments.',
      startDate: new Date('2019-07-15T00:00:00Z'),
      endDate: new Date('2022-06-30T00:00:00Z'),
      isCurrent: false,
      country: 'India',
      industry: 'Cloud Infrastructure',
    },
  });

  await prisma.employment.create({
    data: {
      applicantId: app3.id,
      employer: 'Tata Consultancy Services (TCS)',
      role: 'Cloud Architect',
      responsibilities: 'Led multi-region hybrid cloud migration for European enterprise banking clients.',
      startDate: new Date('2021-01-10T00:00:00Z'), // Conflict with Infosys end date!
      endDate: new Date('2024-03-31T00:00:00Z'),
      isCurrent: false,
      country: 'India',
      industry: 'Enterprise Software',
    },
  });

  await prisma.skill.createMany({
    data: [
      { applicantId: app3.id, name: 'AWS & Cloud Architecture', category: SkillCategory.TECHNICAL, level: 'Expert' },
      { applicantId: app3.id, name: 'Kubernetes & Docker', category: SkillCategory.TECHNICAL, level: 'Expert' },
      { applicantId: app3.id, name: 'Terraform & CI/CD', category: SkillCategory.TECHNICAL, level: 'Advanced' },
      { applicantId: app3.id, name: 'AWS Certified Solutions Architect', category: SkillCategory.CERTIFICATION, issuer: 'Amazon Web Services', issuedAt: new Date('2023-04-10T00:00:00Z') },
    ],
  });

  await prisma.languageProficiency.createMany({
    data: [
      {
        applicantId: app3.id,
        language: 'English',
        cefrLevel: 'C1',
        source: LanguageSource.SELF_DECLARED,
        scoreRaw: 'Professional working proficiency',
      },
      {
        applicantId: app3.id,
        language: 'German',
        cefrLevel: 'A1',
        source: LanguageSource.SELF_DECLARED,
        scoreRaw: 'Currently learning basics on Duolingo / A1 course',
      },
    ],
  });

  // Planted Inconsistency 3: Employment Timeline Overlap
  await prisma.clarificationTask.create({
    data: {
      applicantId: app3.id,
      type: ClarificationType.INCONSISTENT,
      severity: ClarificationSeverity.WARN,
      fieldPaths: ['employment[0].dates', 'employment[1].dates'],
      message: 'Concurrent Employment Overlap: Your role at Infosys (ended June 2022) overlaps with TCS (started January 2021) by 17 months.',
      suggestedAction: 'Clarify if one position was part-time/contract consulting, or update the start and release dates to match your relieving letters.',
      status: ClarificationStatus.OPEN,
      raisedBy: ClarificationRaisedBy.RULE,
    },
  });

  await prisma.qualificationResult.create({
    data: {
      applicantId: app3.id,
      ruleSetId: createdRuleSets[Pathway.WORK],
      pathway: Pathway.WORK,
      status: QualificationStatus.ELIGIBLE,
      score: 92,
      breakdown: [
        { ruleId: 'HIGHER_DEGREE_EQUIVALENCE', label: 'Formal Degree Equivalence (VTU is Anabin H+)', passed: true, weight: 35 },
        { ruleId: 'MIN_WORK_EXPERIENCE', label: 'Relevant Experience (5+ years in Cloud/DevOps)', passed: true, weight: 25 },
        { ruleId: 'CHANCENKARTE_OR_JOB_OFFER', label: 'Eligible for EU Blue Card IT threshold & 9 Chancenkarte points', passed: true, weight: 25 },
        { ruleId: 'GERMAN_A1_OR_ENGLISH_B2', label: 'English C1 satisfies IT requirements', passed: true, weight: 15 },
      ],
      missingRequirements: [
        { ruleId: 'MIN_WORK_EXPERIENCE', description: 'Reconcile overlapping service certificates for visa officer audit', estimatedEffort: '1 week', recommendationCode: 'EDU-CV-COACH' },
        { ruleId: 'GERMAN_A1_OR_ENGLISH_B2', description: 'Learn A1/A2 German for social integration and permanent residency fast-track', estimatedEffort: '2 months', recommendationCode: 'EDU-GER-A1B1' },
      ],
      explanation: 'Vikram is strongly qualified for an EU Blue Card in the shortage occupation of IT & Cloud Engineering (minimum salary threshold €45,300). Resolving his employment certificate timeline overlap is the only clerical item needed before job matching.',
    },
  });

  await prisma.recommendation.create({
    data: {
      applicantId: app3.id,
      serviceCode: 'EDU-CV-COACH',
      type: RecommendationType.CONSULTANT_REFERRAL,
      title: 'Consultant Handoff: German Blue Card IT Job Fast-Track',
      reasoning: 'High-demand DevOps engineer with recognized B.E. degree. Ready for direct introduction to German tech employers upon CV alignment to DIN standards.',
      priority: 1,
      nextActions: ['Format experience letters', 'Convert CV to German DIN 5008 layout', 'Book 1-on-1 Educaro senior consultant review'],
    },
  });

  console.log('\n✅ Database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
