export type ProvenanceType =
  | 'VERIFIED'
  | 'APPLICANT_PROVIDED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED';

export type PathwayType = 'STUDY' | 'VOCATIONAL' | 'WORK' | 'UNDECIDED';

export type JourneyStage =
  | 'LANDING'
  | 'WORKSPACE'
  | 'GOAL'
  | 'PROFILE'
  | 'DOCUMENTS'
  | 'VIDEO'
  | 'REVIEW'
  | 'QUALIFICATION'
  | 'NEXT_STEP'
  | 'CV_STUDIO'
  | 'CONSULTANT_DASHBOARD'
  | 'HEALTH';

export interface ProfileFactItem {
  id: string;
  applicantId: string;
  fieldPath: string;
  value: any;
  provenance: ProvenanceType;
  confidence: number;
  evidenceType: 'DOCUMENT' | 'VIDEO' | 'CHAT' | 'MANUAL';
  evidenceRef?: any;
  version: number;
  confirmedAt?: string;
  createdAt: string;
}

export interface ClarificationTaskItem {
  id: string;
  applicantId: string;
  type: 'MISSING' | 'INCOMPLETE' | 'INCONSISTENT';
  severity: 'INFO' | 'WARN' | 'BLOCKER';
  fieldPaths: string[];
  message: string;
  suggestedAction?: string;
  status: 'OPEN' | 'ANSWERED' | 'DISMISSED';
  raisedBy: 'RULE' | 'AGENT';
  resolution?: any;
}

export interface QualificationResultItem {
  id: string;
  pathway: PathwayType;
  status: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_YET_ELIGIBLE' | 'NEEDS_REVIEW';
  score: number;
  breakdown: Array<{
    ruleId: string;
    label: string;
    passed: boolean;
    weight: number;
  }>;
  missingRequirements: Array<{
    ruleId: string;
    description: string;
    estimatedEffort: string;
    recommendationCode?: string;
  }>;
  explanation: string;
  computedAt: string;
}

export interface RecommendationItem {
  id: string;
  serviceCode?: string;
  type: 'SERVICE' | 'CONSULTANT_REFERRAL' | 'APPLICANT_ACTION';
  title: string;
  reasoning: string;
  priority: number;
  nextActions: string[];
  status: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'AGENT' | 'SYSTEM';
  content: string;
  uiHints?: {
    question?: string;
    explanation?: string;
    quickReplies?: string[];
    uiDirective?: {
      type:
        | 'CHOICE_CHIPS'
        | 'CEFR_SELECTOR'
        | 'DATE_PICKER'
        | 'FILE_DROPZONE'
        | 'CONFIRM_CARD'
        | 'MINI_FORM';
      targetField?: string;
      options?: string[];
    };
  };
  createdAt: string;
}

export interface AgentActivityStep {
  id: string;
  agentName: string;
  kind: 'THOUGHT_SUMMARY' | 'TOOL_CALL' | 'TOOL_RESULT' | 'DECISION' | 'ERROR';
  toolName?: string;
  input?: any;
  output?: any;
  thought?: string;
  latencyMs?: number;
  timestamp: string;
}

export interface CompletenessData {
  score: number;
  breakdown: {
    personal: number;
    education: number;
    employment: number;
    languages: number;
    documents: number;
    media: number;
  };
  gaps: Array<{
    category: string;
    field: string;
    description: string;
    weight: number;
    suggestedAction: string;
  }>;
}

export interface ApplicantProfile {
  id: string;
  userId: string;
  goal: PathwayType;
  currentStage: string;
  completenessScore: number;
  consentGivenAt?: string;
  personal?: {
    name?: string;
    dob?: string;
    nationality?: string;
    email?: string;
    phone?: string;
    cityIndia?: string;
    targetCityGermany?: string;
    availabilityDate?: string;
  };
  educations?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    grade?: string;
    country: string;
  }>;
  employments?: Array<{
    id: string;
    employer: string;
    role: string;
    responsibilities?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  skills?: Array<{
    id: string;
    name: string;
    category: string;
    level?: string;
  }>;
  languages?: Array<{
    id: string;
    language: string;
    cefrLevel: string;
    source: string;
    certificateName?: string;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    storageKey: string;
    processingStatus: string;
    classifiedConfidence?: number;
    extractions?: any[];
  }>;
  motivation?: {
    reasonForGermany?: string;
    preferredPathway?: string;
    longTermGoals?: string;
    targetField?: string;
  };
  media?: Array<{
    id: string;
    type: string;
    storageKey: string;
    durationSec?: number;
    transcript?: string;
    transcriptSegments?: Array<{ start: number; end: number; text: string }>;
    extractedInsights?: any;
  }>;
}
