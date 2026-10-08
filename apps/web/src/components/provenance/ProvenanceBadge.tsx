import React, { useState } from 'react';
import { ProvenanceType } from '../../types';
import { ShieldCheck, User, Bot, Sparkles, ExternalLink, Check, Edit2, X } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  confidence?: number;
  evidenceRef?: any;
  evidenceType?: string;
  fieldLabel?: string;
  onConfirm?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  confidence = 1.0,
  evidenceRef,
  evidenceType = 'MANUAL',
  fieldLabel,
  onConfirm,
  onEdit,
  onReject,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const config = {
    VERIFIED: {
      label: 'Verified',
      icon: ShieldCheck,
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
      description: 'Confirmed against official document or consultant sign-off.',
    },
    APPLICANT_PROVIDED: {
      label: 'You provided',
      icon: User,
      classes: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
      description: 'Entered directly by you or explicitly verified.',
    },
    AI_EXTRACTED: {
      label: 'AI-extracted',
      icon: Bot,
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
      description: 'Extracted automatically from document/video. Awaiting your confirmation.',
    },
    AI_GENERATED: {
      label: 'AI-generated',
      icon: Sparkles,
      classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
      description: 'Synthesized by AI (summary or explanation). Always editable.',
    },
  }[provenance] || {
    label: provenance,
    icon: Bot,
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    description: '',
  };

  const Icon = config.icon;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowEvidence(!showEvidence)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${config.classes}`}
        title="Click to view provenance and evidence"
      >
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
        {confidence < 1 && (
          <span className="text-[10px] opacity-75 font-mono">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </button>

      {showEvidence && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-slate-200">Fact Provenance Details</span>
            <button
              onClick={() => setShowEvidence(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="font-medium text-slate-200">{config.label}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Source Type:</span>
              <span className="font-medium text-slate-200">{evidenceType}</span>
            </div>
            {confidence && (
              <div className="flex justify-between text-slate-400">
                <span>Confidence:</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg">
            {config.description}
          </p>

          {evidenceRef && (
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono overflow-hidden text-ellipsis">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">
                Evidence Reference
              </span>
              {JSON.stringify(evidenceRef, null, 1)}
            </div>
          )}

          {provenance === 'AI_EXTRACTED' && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              {onConfirm && (
                <button
                  onClick={() => {
                    onConfirm();
                    setShowEvidence(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  <Check className="w-3 h-3" />
                  Confirm
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setShowEvidence(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Edit Fact"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => {
                    onReject();
                    setShowEvidence(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-900/40 text-rose-300 hover:bg-rose-900/60"
                  title="Reject Fact"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
