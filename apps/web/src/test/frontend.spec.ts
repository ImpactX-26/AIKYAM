import { describe, it, expect } from 'vitest';
import { useProfileStore } from '../stores/useProfileStore';
import { useJourneyStore } from '../stores/useJourneyStore';

describe('Frontend Logic & Stores', () => {
  describe('ProfileStore Reducer', () => {
    it('should set full profile and calculate readiness', () => {
      const store = useProfileStore.getState();

      store.setFullProfile({
        applicant: {
          id: 'test-app-1',
          userId: 'test-user-1',
          goal: 'STUDY',
          currentStage: 'REVIEW',
          completenessScore: 85,
          personal: { name: 'Aarav Sharma' },
        },
        completeness: {
          score: 85,
          breakdown: { personal: 20, education: 25, employment: 10, languages: 20, documents: 10, media: 0 },
          gaps: [],
        },
        provenanceFacts: [
          {
            id: 'fact-1',
            applicantId: 'test-app-1',
            fieldPath: 'personal.name',
            value: 'Aarav Sharma',
            provenance: 'VERIFIED',
            confidence: 0.99,
            evidenceType: 'DOCUMENT',
            version: 1,
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const updated = useProfileStore.getState();
      expect(updated.profile?.id).toBe('test-app-1');
      expect(updated.completeness.score).toBe(85);
      expect(updated.facts.length).toBe(1);
      expect(updated.facts[0].provenance).toBe('VERIFIED');
    });

    it('should update fact locally and trigger field highlight', () => {
      const store = useProfileStore.getState();

      store.updateFactLocally({
        id: 'fact-2',
        applicantId: 'test-app-1',
        fieldPath: 'languages.cefrLevel',
        value: 'B2',
        provenance: 'APPLICANT_PROVIDED',
        confidence: 1.0,
        evidenceType: 'CHAT',
        version: 1,
        createdAt: new Date().toISOString(),
      });

      const updated = useProfileStore.getState();
      expect(updated.lastUpdatedField).toBe('languages.cefrLevel');
      expect(updated.facts.some((f) => f.fieldPath === 'languages.cefrLevel')).toBe(true);
    });
  });

  describe('JourneyStore Reducer', () => {
    it('should switch stages cleanly', () => {
      const store = useJourneyStore.getState();
      store.setStage('QUALIFICATION');
      expect(useJourneyStore.getState().stage).toBe('QUALIFICATION');

      store.setStage('WORKSPACE');
      expect(useJourneyStore.getState().stage).toBe('WORKSPACE');
    });

    it('should set active demo persona', () => {
      const store = useJourneyStore.getState();
      store.setActivePersona('AARAV');
      expect(useJourneyStore.getState().activePersona).toBe('AARAV');
    });
  });
});
