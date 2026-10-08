import React, { useState } from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import { ProvenanceBadge } from '../../components/provenance/ProvenanceBadge';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const QualificationView: React.FC = () => {
  const { qualification, profile } = useProfileStore();
  const [simGerman, setSimGerman] = useState('B2');
  const [simAps, setSimAps] = useState(true);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const qual = simResult ? simResult.simulatedOutcome : qualification;
  const isSimulated = Boolean(simResult);

  const runSimulation = async () => {
    try {
      setIsSimulating(true);
      const res = await api.qualification.whatIf({
        germanLevel: simGerman,
        hasAps: simAps,
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setSimResult(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return {
          label: 'Officially Eligible',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'CONDITIONALLY_ELIGIBLE':
        return {
          label: 'Conditionally Eligible',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          label: 'Not Yet Eligible',
          classes: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
    }
  };

  const statusBadge = getStatusBadge(qual?.status || 'NEEDS_REVIEW');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Qualification Determination</span>
          </h1>
          <p className="text-xs text-slate-400">
            Evaluated by the deterministic rule engine based on official German university & visa criteria.
          </p>
        </div>

        {isSimulated && (
          <button
            onClick={resetSimulation}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            Reset Simulation
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Outcome Badge & Rule Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Outcome Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-navy-950 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${statusBadge.classes}`}>
                {statusBadge.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Pathway: {qual?.pathway || profile?.goal || 'STUDY'}
              </span>
            </div>

            {/* Score Gauge */}
            <div className="flex items-center gap-6 py-2">
              <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-950/80">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  {qual?.score || 0}
                </span>
                <span className="text-[10px] text-slate-500 absolute bottom-3">/ 100</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {qual?.score >= 75
                    ? 'Outstanding Profile Readiness'
                    : qual?.score >= 50
                    ? 'Encouraging Standing (Conditions Apply)'
                    : 'Actionable Prerequisites Required'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculated using legal thresholds for Indian degree recognition and visa compliance.
                </p>
              </div>
            </div>

            {/* AI Explanation */}
            {qual?.explanation && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Plain-Language Summary</span>
                  </span>
                  <ProvenanceBadge provenance="AI_GENERATED" />
                </div>
                <p className="leading-relaxed text-slate-300 font-sans">
                  {qual.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Rule Breakdown Checklist */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">Requirement Checklist Breakdown</h3>
            <div className="space-y-2 text-xs">
              {qual?.breakdown?.map((rule: any) => (
                <div
                  key={rule.ruleId}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {rule.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-slate-200 font-medium">{rule.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    Weight: {rule.weight} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: "What-If" Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-amber-500/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">"What-If" Pathway Simulator</h3>
                <p className="text-[11px] text-slate-400">
                  Test hypothetical upgrades to preview live score and eligibility changes.
                </p>
              </div>
            </div>

            {/* Simulated Inputs */}
            <div className="space-y-4 text-xs">
              {/* German Level Simulator */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Simulate German CEFR Level:
                </label>
                <div className="grid grid-cols-5 gap-1 font-mono text-center">
                  {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSimGerman(lvl)}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        simGerman === lvl
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* APS Certificate Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    Assume APS Certificate Acquired
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Mandatory Indian verification
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={simAps}
                  onChange={(e) => setSimAps(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Run Simulation Button */}
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{isSimulating ? 'Evaluating...' : 'Simulate Live Outcome'}</span>
              </button>
            </div>

            {/* Simulation Delta Banner */}
            {simResult && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between font-bold">
                  <span>Simulated Outcome Delta:</span>
                  <span className="text-base font-mono">
                    +{simResult.deltaScore} pts
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  Achieving {simGerman} German and clearing the APS test elevates your eligibility from{' '}
                  <span className="font-bold underline">
                    {simResult.baseOutcome.status}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold underline">
                    {simResult.simulatedOutcome.status}
                  </span>
                  !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
