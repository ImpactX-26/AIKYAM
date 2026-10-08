import React from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const ReviewClarifications: React.FC = () => {
  const { clarifications, setClarifications, setFullProfile } = useProfileStore();

  const blockers = clarifications.filter((c) => c.severity === 'BLOCKER');
  const warnings = clarifications.filter((c) => c.severity === 'WARN');
  const infos = clarifications.filter((c) => c.severity === 'INFO');

  const handleResolve = async (id: string, actionChosen: string) => {
    await api.validation.resolveTask(id, { action: actionChosen, resolvedAt: new Date() });
    const prof = await api.profile.get();
    setFullProfile(prof);
  };

  const renderTaskCard = (task: any) => {
    const isBlocker = task.severity === 'BLOCKER';
    const isWarn = task.severity === 'WARN';

    return (
      <div
        key={task.id}
        className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
          isBlocker
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
            : isWarn
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBlocker ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : isWarn ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span
              className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                isBlocker
                  ? 'bg-rose-500/20 text-rose-300'
                  : isWarn
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {task.severity} • {task.type}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            Status: {task.status}
          </span>
        </div>

        <p className="text-slate-100 font-medium text-xs leading-relaxed">
          {task.message}
        </p>

        {task.suggestedAction && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Recommended Resolution:
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {task.suggestedAction}
            </p>
          </div>
        )}

        {task.status === 'OPEN' && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleResolve(task.id, 'ACCEPTED_RECOMMENDATION')}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Recommended Action</span>
            </button>
            <button
              onClick={() => handleResolve(task.id, 'DISMISSED')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-amber-400" />
          <span>Review & Inconsistency Clarifications</span>
        </h1>
        <p className="text-xs text-slate-400">
          The deterministic validation engine audits date overlaps, document DOB mismatches, and language claims to ensure zero visa rejection risks.
        </p>
      </div>

      {clarifications.length > 0 ? (
        <div className="space-y-6">
          {blockers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Critical Blockers ({blockers.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blockers.map(renderTaskCard)}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Warnings & Discrepancies ({warnings.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warnings.map(renderTaskCard)}
              </div>
            </div>
          )}

          {infos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Advisory Items ({infos.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {infos.map(renderTaskCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No active inconsistencies</h3>
          <p className="text-xs text-slate-400">
            All profile dates, document records, and language declarations are consistent.
          </p>
        </div>
      )}
    </div>
  );
};
