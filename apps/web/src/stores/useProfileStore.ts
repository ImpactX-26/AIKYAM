import { create } from 'zustand';
import {
  ApplicantProfile,
  CompletenessData,
  ProfileFactItem,
  ClarificationTaskItem,
  QualificationResultItem,
  RecommendationItem,
} from '../types';

interface ProfileState {
  profile: ApplicantProfile | null;
  completeness: CompletenessData;
  facts: ProfileFactItem[];
  clarifications: ClarificationTaskItem[];
  qualification: QualificationResultItem | null;
  recommendations: RecommendationItem[];
  lastUpdatedField: string | null;
  isLoading: boolean;

  setFullProfile: (data: {
    applicant: ApplicantProfile;
    completeness: CompletenessData;
    provenanceFacts: ProfileFactItem[];
  }) => void;
  updateFactLocally: (fact: ProfileFactItem) => void;
  setClarifications: (clarifications: ClarificationTaskItem[]) => void;
  setQualification: (qualification: QualificationResultItem) => void;
  setRecommendations: (recommendations: RecommendationItem[]) => void;
  setLastUpdatedField: (field: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const defaultCompleteness: CompletenessData = {
  score: 0,
  breakdown: {
    personal: 0,
    education: 0,
    employment: 0,
    languages: 0,
    documents: 0,
    media: 0,
  },
  gaps: [],
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  completeness: defaultCompleteness,
  facts: [],
  clarifications: [],
  qualification: null,
  recommendations: [],
  lastUpdatedField: null,
  isLoading: false,

  setFullProfile: (data) =>
    set({
      profile: data.applicant,
      completeness: data.completeness || defaultCompleteness,
      facts: data.provenanceFacts || [],
      clarifications: (data.applicant as any).clarificationTasks || [],
      qualification: (data.applicant as any).qualificationResults?.[0] || null,
      recommendations: (data.applicant as any).recommendations || [],
      isLoading: false,
    }),

  updateFactLocally: (fact) =>
    set((state) => {
      const existingIdx = state.facts.findIndex((f) => f.fieldPath === fact.fieldPath);
      const newFacts = [...state.facts];
      if (existingIdx >= 0) {
        newFacts[existingIdx] = fact;
      } else {
        newFacts.unshift(fact);
      }
      return {
        facts: newFacts,
        lastUpdatedField: fact.fieldPath,
      };
    }),

  setClarifications: (clarifications) => set({ clarifications }),
  setQualification: (qualification) => set({ qualification }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setLastUpdatedField: (lastUpdatedField) => set({ lastUpdatedField }),
  setLoading: (isLoading) => set({ isLoading }),
}));
