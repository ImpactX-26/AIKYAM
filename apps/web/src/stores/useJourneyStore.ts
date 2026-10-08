import { create } from 'zustand';
import { JourneyStage, PathwayType } from '../types';

interface JourneyState {
  stage: JourneyStage;
  token: string | null;
  applicantId: string | null;
  conversationId: string | null;
  userEmail: string | null;
  userRole: 'APPLICANT' | 'CONSULTANT';
  isGuest: boolean;
  selectedGoal: PathwayType;
  activePersona: 'AARAV' | 'PRIYA' | 'VIKRAM' | null;

  setStage: (stage: JourneyStage) => void;
  setSession: (data: {
    token: string;
    applicantId: string;
    conversationId: string;
    email: string;
    role?: 'APPLICANT' | 'CONSULTANT';
    isGuest?: boolean;
  }) => void;
  setGoal: (goal: PathwayType) => void;
  setActivePersona: (persona: 'AARAV' | 'PRIYA' | 'VIKRAM' | null) => void;
  logout: () => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  stage: 'LANDING',
  token: typeof window !== 'undefined' ? localStorage.getItem('educaro_token') : null,
  applicantId: typeof window !== 'undefined' ? localStorage.getItem('educaro_applicant_id') : null,
  conversationId: typeof window !== 'undefined' ? localStorage.getItem('educaro_conversation_id') : null,
  userEmail: null,
  userRole: 'APPLICANT',
  isGuest: true,
  selectedGoal: 'UNDECIDED',
  activePersona: null,

  setStage: (stage) => set({ stage }),

  setSession: (data) => {
    localStorage.setItem('educaro_token', data.token);
    localStorage.setItem('educaro_applicant_id', data.applicantId);
    localStorage.setItem('educaro_conversation_id', data.conversationId);
    set({
      token: data.token,
      applicantId: data.applicantId,
      conversationId: data.conversationId,
      userEmail: data.email,
      userRole: data.role || 'APPLICANT',
      isGuest: Boolean(data.isGuest),
      stage: 'WORKSPACE',
    });
  },

  setGoal: (selectedGoal) => set({ selectedGoal }),

  setActivePersona: (activePersona) => set({ activePersona }),

  logout: () => {
    localStorage.removeItem('educaro_token');
    localStorage.removeItem('educaro_applicant_id');
    localStorage.removeItem('educaro_conversation_id');
    set({
      stage: 'LANDING',
      token: null,
      applicantId: null,
      conversationId: null,
      userEmail: null,
      activePersona: null,
    });
  },
}));
