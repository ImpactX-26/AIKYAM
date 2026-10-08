import React, { useState } from 'react';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { ChatPanel } from '../chat/ChatPanel';
import { LiveProfilePanel } from '../profile/LiveProfilePanel';
import { AgentActivityPanel } from '../agent-activity/AgentActivityPanel';
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
  Video,
  Award,
  Briefcase,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const JourneyWorkspace: React.FC = () => {
  const { setStage } = useJourneyStore();
  const { completeness } = useProfileStore();
  const [rightTab, setRightTab] = useState<'profile' | 'agent'>('profile');

  const steps = [
    { id: 'GOAL', label: '1. Goal Discovery', status: 'done' },
    { id: 'PROFILE', label: '2. Profile Building', status: completeness.score > 30 ? 'done' : 'current' },
    { id: 'DOCUMENTS', label: '3. Official Documents', status: completeness.score > 60 ? 'done' : 'current' },
    { id: 'VIDEO', label: '4. Video Introduction', status: completeness.score > 75 ? 'done' : 'pending' },
    { id: 'REVIEW', label: '5. Clarifications & Review', status: completeness.score > 80 ? 'done' : 'pending' },
    { id: 'QUALIFICATION', label: '6. Qualification Outcome', status: completeness.score >= 80 ? 'done' : 'pending' },
    { id: 'NEXT_STEP', label: '7. Recommended Ecosystem Step', status: 'pending' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* LEFT PANEL: Stepper & Completeness Ring (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Completeness Ring Card */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Profile Readiness</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {completeness.score}%
              </span>
            </div>

            {/* Circular Progress Bar Simulation */}
            <div className="relative w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(5, completeness.score)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {completeness.score >= 80
                ? '🌟 Excellent! Ready for qualification determination.'
                : 'Complete key verification gaps to unlock official eligibility evaluation.'}
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-2.5">
            <span className="text-xs font-bold text-slate-200 block mb-2">
              Journey Roadmap
            </span>
            <div className="space-y-1.5 text-xs">
              {steps.map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    if (st.id === 'DOCUMENTS') setStage('DOCUMENTS');
                    else if (st.id === 'VIDEO') setStage('VIDEO');
                    else if (st.id === 'REVIEW') setStage('REVIEW');
                    else if (st.id === 'QUALIFICATION') setStage('QUALIFICATION');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <span className="text-slate-300 font-medium">{st.label}</span>
                  {st.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* "What's Missing" Checklist */}
          {completeness.gaps && completeness.gaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-amber-500/20 shadow-xl space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Gaps to Complete</span>
              </span>
              <div className="space-y-1.5 text-xs">
                {completeness.gaps.slice(0, 3).map((gap, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] space-y-0.5"
                  >
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>{gap.description}</span>
                      <span className="text-amber-400 font-mono text-[10px]">
                        +{gap.weight}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{gap.suggestedAction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER PANEL: AI Guide Chat (5 cols) */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col">
          <ChatPanel />
        </div>

        {/* RIGHT PANEL: Live Profile & Agent Activity (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Tabs Switcher */}
          <div className="p-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setRightTab('profile')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === 'profile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Live Profile</span>
            </button>
            <button
              onClick={() => setRightTab('agent')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === 'agent'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agent Activity</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'profile' ? <LiveProfilePanel /> : <AgentActivityPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};
