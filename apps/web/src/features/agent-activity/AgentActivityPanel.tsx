import React, { useState } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import {
  Brain,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const AgentActivityPanel: React.FC = () => {
  const { activitySteps, currentThought } = useAgentStore();
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  return (
    <div className="space-y-3 text-xs">
      {/* Current Real-time Thinking */}
      {currentThought && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1 animate-pulse">
          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Agent Reasoning</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
            {currentThought}
          </p>
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="space-y-2">
        {activitySteps.map((step) => {
          const isExpanded = expandedStepId === step.id;
          const isTool = step.kind === 'TOOL_CALL' || step.kind === 'TOOL_RESULT';

          return (
            <div
              key={step.id}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-1.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium">
                  {step.kind === 'THOUGHT_SUMMARY' && (
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  {step.kind === 'TOOL_CALL' && (
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {step.kind === 'TOOL_RESULT' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}

                  <span className="text-[11px] font-semibold text-slate-200">
                    {step.toolName ? `Tool: ${step.toolName}` : 'Orchestrator Thought'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  {step.latencyMs !== undefined && (
                    <span className="text-amber-400/90">{step.latencyMs}ms</span>
                  )}
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(step.timestamp).toLocaleTimeString([], {
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {step.thought && (
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {step.thought}
                </p>
              )}

              {/* Tool Inputs & Outputs accordion */}
              {isTool && (
                <div>
                  <button
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Inspect Tool Payload</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-800 overflow-x-auto max-h-40">
                      {step.input && (
                        <div className="mb-1">
                          <span className="text-amber-400 block font-bold">Input:</span>
                          <pre>{JSON.stringify(step.input, null, 2)}</pre>
                        </div>
                      )}
                      {step.output && (
                        <div>
                          <span className="text-emerald-400 block font-bold">Output:</span>
                          <pre>{JSON.stringify(step.output, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activitySteps.length === 0 && !currentThought && (
          <div className="p-8 text-center text-slate-500 italic">
            Agent trace will stream in real-time as you interact with the AI guide.
          </div>
        )}
      </div>
    </div>
  );
};
