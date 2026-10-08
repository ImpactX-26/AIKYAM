import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  Award,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ConsultantDashboard: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPathway, setFilterPathway] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apps = await api.consultant.getApplicants();
        setApplicants(apps);
      } catch {
        // In demo mode, automatically acquire consultant token if browsing consultant view
        try {
          const auth = await api.auth.login('consultant@educaro.de');
          if (auth.token) {
            localStorage.setItem('educaro_consultant_token', auth.token);
            // Re-fetch using consultant token
            const res = await fetch('/api/v1/consultant/applicants', {
              headers: { Authorization: `Bearer ${auth.token}` },
            });
            const data = await res.json();
            if (Array.isArray(data)) setApplicants(data);
          }
        } catch (e) {
          console.error('Failed to auto-auth consultant in demo mode', e);
        }
      }

      api.consultant.getFunnel().then(setFunnel).catch(console.error);
    };

    fetchData();
  }, []);

  const openApplicantDetail = async (id: string) => {
    try {
      const detail = await api.consultant.getApplicantDetail(id);
      setSelectedApplicant(detail);
    } catch {
      const consultantToken = localStorage.getItem('educaro_consultant_token');
      if (consultantToken) {
        const res = await fetch(`/api/v1/consultant/applicants/${id}`, {
          headers: { Authorization: `Bearer ${consultantToken}` },
        });
        const detail = await res.json();
        setSelectedApplicant(detail);
      }
    }
  };

  const filtered = applicants.filter((a) => {
    const nameMatch = (a.personal?.name || a.user?.email || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const pathwayMatch = filterPathway === 'ALL' || a.goal === filterPathway;
    return nameMatch && pathwayMatch;
  });

  const pieColors = ['#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-400" />
          <span>Educaro Deutschland • Consultant Portal</span>
        </h1>
        <p className="text-xs text-slate-400">
          Review Indian applicant pipelines, audit evidence provenance trails, and manage high-value handoffs.
        </p>
      </div>

      {/* Analytics Charts Funnel */}
      {funnel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Funnel Metric Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400">Total Applicants</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {funnel.totalApplicants}
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% Provenance Tracked</span>
            </p>
          </div>

          {/* Goal Distribution Bar Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400">Pathway Distribution</span>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel.byGoal}>
                  <XAxis dataKey="goal" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Qualification Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400">Eligibility Status</span>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnel.qualificationDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                  >
                    {funnel.qualificationDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Table & Filters */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            {['ALL', 'STUDY', 'VOCATIONAL', 'WORK'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPathway(p)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPathway === p
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3 font-semibold">Candidate</th>
                <th className="py-3 px-3 font-semibold">Pathway</th>
                <th className="py-3 px-3 font-semibold">Completeness</th>
                <th className="py-3 px-3 font-semibold">Outcome</th>
                <th className="py-3 px-3 font-semibold">Open Clarifications</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((app) => {
                const latestQual = app.qualificationResults?.[0];
                const issuesCount = app.clarificationTasks?.length || 0;

                return (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">
                        {app.personal?.name || 'Unnamed Applicant'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.user?.email}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {app.goal}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-amber-400 font-bold">
                        {app.completenessScore}%
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          latestQual?.status === 'ELIGIBLE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {latestQual?.status || 'IN_PROGRESS'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {issuesCount > 0 ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {issuesCount} detected
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">None (Clean)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openApplicantDetail(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-slate-200 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Audit Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applicant Detail 360-degree Drawer */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedApplicant.personal?.name || 'Applicant Detail'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedApplicant.user?.email} • {selectedApplicant.goal}
                </p>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Consultant Handoff Summary */}
            {selectedApplicant.consultantReferrals?.[0]?.handoffSummary && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Executive Handoff Summary
                </span>
                <p className="leading-relaxed">
                  {selectedApplicant.consultantReferrals[0].handoffSummary}
                </p>
              </div>
            )}

            {/* Provenance Fact Audit Trail */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Provenance Audit Trail ({selectedApplicant.profileFacts?.length || 0} facts)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedApplicant.profileFacts?.map((fact: any) => (
                  <div
                    key={fact.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-amber-400 font-semibold block text-[11px]">
                        {fact.fieldPath}
                      </span>
                      <span className="text-slate-300">
                        {typeof fact.value === 'object' ? JSON.stringify(fact.value) : String(fact.value)}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                      {fact.provenance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Run Decision Trace */}
            {selectedApplicant.agentRuns?.[0] && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Latest Agent Run Trace
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                  {selectedApplicant.agentRuns[0].steps?.map((step: any) => (
                    <div
                      key={step.id}
                      className="p-2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      <span className="text-amber-400 font-bold block">
                        [{step.kind}] {step.toolName || step.agentName}
                      </span>
                      {step.input && <span>{JSON.stringify(step.input)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
