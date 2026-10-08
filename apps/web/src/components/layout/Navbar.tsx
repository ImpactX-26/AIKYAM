import React, { useState } from 'react';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  FileText,
  Video,
  AlertCircle,
  Award,
  Briefcase,
  Users,
  Languages,
  Info,
  LogOut,
  ChevronRight,
  X,
  Cpu,
  Activity,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { stage, setStage, logout, userRole, isGuest } = useJourneyStore();
  const { clarifications, qualification } = useProfileStore();
  const { t, i18n } = useTranslation();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const openIssuesCount = clarifications.filter((c) => c.status === 'OPEN').length;

  const cycleLanguage = () => {
    const current = i18n.language;
    const next = current === 'en' ? 'de' : current === 'de' ? 'hi' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setStage('WORKSPACE')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-navy-900 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  Educaro <span className="text-amber-400">Compass</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                  ImpactX'26
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">
                Sponsor: Educaro Deutschland GmbH
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setStage('WORKSPACE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'WORKSPACE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>

            <button
              onClick={() => setStage('DOCUMENTS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'DOCUMENTS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
            </button>

            <button
              onClick={() => setStage('VIDEO')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'VIDEO'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            <button
              onClick={() => setStage('REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative ${
                stage === 'REVIEW'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Clarifications</span>
              {openIssuesCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {openIssuesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStage('QUALIFICATION')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'QUALIFICATION'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Qualification</span>
              {qualification && (
                <span className="ml-1 text-[10px] font-mono text-emerald-400">
                  {qualification.score}%
                </span>
              )}
            </button>

            <button
              onClick={() => setStage('CV_STUDIO')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'CV_STUDIO'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>CV Studio</span>
            </button>

            <button
              onClick={() => setStage('CONSULTANT_DASHBOARD')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                stage === 'CONSULTANT_DASHBOARD'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Consultant</span>
            </button>
          </nav>

          {/* Right Tools (Language Switcher, How It Works, Health, Logout) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStage('HEALTH')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                stage === 'HEALTH'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40'
              }`}
              title="System Diagnostics & API Health"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Health</span>
            </button>

            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 transition-colors flex items-center gap-1.5"
              title="Explain agentic design & supervisor loop to judges"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            <button
              onClick={cycleLanguage}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 font-medium transition-colors flex items-center gap-1"
              title="Switch language: English / Deutsch / हिन्दी"
            >
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase font-mono text-[11px] font-bold">
                {i18n.language}
              </span>
            </button>

            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 p-2 rounded-lg transition-colors"
              title="Exit Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* "How It Works" Slide-Over Drawer for Judges */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Agentic Architecture Guide</h3>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-1.5">
                <h4 className="font-semibold text-amber-400 text-sm">Supervisor Pattern</h4>
                <p>
                  The <strong>Orchestrator Agent</strong> continuously reads the current profile state, computes gaps deterministically, and invokes specialized sub-agents (Intake, Document Intelligence, Video, Validation, Qualification, and CV Generator).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-emerald-400 text-sm">Deterministic Guardrails</h4>
                <p>
                  The system <strong>NEVER invents applicant information</strong>. Eligibility rules, credit calculations, date math, and overlap detections are pure deterministic code. The LLM only explains and formulates human communication.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-sky-400 text-sm">4-Tier Provenance System</h4>
                <p>
                  Every atomic fact carries one of four provenance levels:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 pt-1">
                  <li><strong className="text-emerald-400">VERIFIED:</strong> Backed by certified official documents.</li>
                  <li><strong className="text-sky-400">APPLICANT_PROVIDED:</strong> Direct applicant manual entry or confirmed extraction.</li>
                  <li><strong className="text-amber-400">AI_EXTRACTED:</strong> Parsed by OCR / multimodal model awaiting user confirmation.</li>
                  <li><strong className="text-purple-400">AI_GENERATED:</strong> AI-drafted summary, strictly editable.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-semibold text-purple-400 text-sm">What-If Simulation</h4>
                <p>
                  Instead of a dead-end rejection, candidates can test hypothetical scenarios (e.g., reaching German B2 or completing Indian APS) to see the live score delta.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Close & Return to Workspace
            </button>
          </div>
        </div>
      )}
    </>
  );
};
