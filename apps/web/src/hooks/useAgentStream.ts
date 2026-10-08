import { useEffect, useRef } from 'react';
import { useAgentStore } from '../stores/useAgentStore';
import { useProfileStore } from '../stores/useProfileStore';
import confetti from 'canvas-confetti';

export function useAgentStream(conversationId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    addMessage,
    addActivityStep,
    setAgentState,
    setCurrentThought,
    setIsStreaming,
  } = useAgentStore();

  const { updateFactLocally, setQualification, setRecommendations } = useProfileStore();

  useEffect(() => {
    if (!conversationId) return;

    // Connect to backend SSE endpoint
    const url = `/api/v1/conversations/${conversationId}/stream`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      // Connected
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data, timestamp } = payload;

        switch (type) {
          case 'agent.thinking':
            setAgentState('thinking');
            setCurrentThought(data.thought);
            addActivityStep({
              id: `${Date.now()}-${Math.random()}`,
              agentName: 'Orchestrator',
              kind: 'THOUGHT_SUMMARY',
              thought: data.thought,
              timestamp: timestamp || new Date().toISOString(),
            });
            break;

          case 'agent.tool_call':
            setAgentState('reading');
            addActivityStep({
              id: `${Date.now()}-${Math.random()}`,
              agentName: 'Orchestrator',
              kind: 'TOOL_CALL',
              toolName: data.toolName,
              input: data.input,
              timestamp: timestamp || new Date().toISOString(),
            });
            break;

          case 'agent.tool_result':
            addActivityStep({
              id: `${Date.now()}-${Math.random()}`,
              agentName: 'Orchestrator',
              kind: 'TOOL_RESULT',
              toolName: data.toolName,
              output: data.output,
              latencyMs: data.latencyMs,
              timestamp: timestamp || new Date().toISOString(),
            });
            break;

          case 'agent.ui_directive':
            addMessage({
              id: `${Date.now()}-${Math.random()}`,
              role: 'AGENT',
              content: data.question,
              uiHints: data,
              createdAt: timestamp || new Date().toISOString(),
            });
            break;

          case 'profile.updated':
            updateFactLocally({
              id: data.factId || `${Date.now()}`,
              applicantId: data.applicantId || '',
              fieldPath: data.fieldPath,
              value: data.value,
              provenance: data.provenance,
              confidence: data.confidence || 1.0,
              evidenceType: 'CHAT',
              version: 1,
              createdAt: timestamp || new Date().toISOString(),
            });
            break;

          case 'qualification.updated':
            setQualification(data);
            if (data.status === 'ELIGIBLE' || data.score >= 80) {
              // Milestone celebration
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
              });
            }
            break;

          case 'recommendation.ready':
            setRecommendations(data);
            break;

          case 'run.completed':
            setIsStreaming(false);
            setAgentState('idle');
            setCurrentThought(null);
            break;

          default:
            break;
        }
      } catch (err) {
        // Ignored keep-alive or raw string
      }
    };

    es.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [
    conversationId,
    addMessage,
    addActivityStep,
    setAgentState,
    setCurrentThought,
    setIsStreaming,
    updateFactLocally,
    setQualification,
    setRecommendations,
  ]);
}
