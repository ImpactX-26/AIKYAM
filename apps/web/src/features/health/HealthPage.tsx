import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, HardDrive, RefreshCw } from 'lucide-react';

export const HealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealthData(data))
      .catch((err) => setHealthData({ status: 'unreachable', error: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Educaro Compass System Health</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time status of backend services, PostgreSQL database, and AI providers.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Backend & API Service */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">API Gateway</span>
            <span
              className={`w-3 h-3 rounded-full ${
                healthData?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {healthData?.status === 'ok' ? 'Online' : 'Degraded'}
          </div>
          <p className="text-[11px] text-slate-400">NestJS 10 on port 3001 with SSE streaming</p>
        </div>

        {/* PostgreSQL Database */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">PostgreSQL (Prisma)</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono capitalize">
            {healthData?.database || 'Checking...'}
          </div>
          <p className="text-[11px] text-slate-400">
            PostgreSQL instance (22 models, 4-tier provenance facts)
          </p>
        </div>

        {/* AI Provider */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Provider Layer</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {healthData?.llmProvider || 'MockProvider'}
          </div>
          <p className="text-[11px] text-slate-400">
            {healthData?.demoMode
              ? 'Demo Mode Active (Fast deterministic fixtures)'
              : 'Google Gemini Multimodal'}
          </p>
        </div>
      </div>

      {healthData && (
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 font-mono text-xs text-slate-400">
          <div className="font-semibold text-slate-200">Raw Diagnostic Response:</div>
          <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 overflow-x-auto text-[11px]">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
