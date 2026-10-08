import { create } from 'zustand';
import { ChatMessage, AgentActivityStep } from '../types';

interface AgentState {
  messages: ChatMessage[];
  activitySteps: AgentActivityStep[];
  agentState: 'idle' | 'thinking' | 'reading' | 'speaking' | 'done';
  currentThought: string | null;
  isStreaming: boolean;

  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addActivityStep: (step: AgentActivityStep) => void;
  setAgentState: (state: 'idle' | 'thinking' | 'reading' | 'speaking' | 'done') => void;
  setCurrentThought: (thought: string | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  clearTrace: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  activitySteps: [],
  agentState: 'idle',
  currentThought: null,
  isStreaming: false,

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (messages) => set({ messages }),

  addActivityStep: (step) =>
    set((state) => ({
      activitySteps: [step, ...state.activitySteps],
    })),

  setAgentState: (agentState) => set({ agentState }),

  setCurrentThought: (currentThought) => set({ currentThought }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  clearTrace: () => set({ activitySteps: [], currentThought: null }),
}));
