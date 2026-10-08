import React, { useState } from 'react';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import { PathwayType } from '../../types';
import {
  GraduationCap,
  Wrench,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Lock,
  Compass,
  User,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setSession, setGoal, setStage } = useJourneyStore();
  const { setFullProfile, setLoading } = useProfileStore();
  const [selectedPathway, setSelectedPathway] = useState<PathwayType>('STUDY');
  const [consentChecked, setConsentChecked] = useState(true);

  const startJourney = async (pathway: PathwayType) => {
    try {
      setLoading(true);
      const res = await api.auth.guest(pathway);
      setSession({
        token: res.token,
        applicantId: res.user.applicantId,
        conversationId: res.user.conversationId,
        email: res.user.email,
        isGuest: true,
      });
      setGoal(pathway);

      // Record consent
      if (consentChecked) {
        await api.profile.consent('v1.0-impactx26');
      }

      // Initialize profile
      const prof = await api.profile.get();
      setFullProfile(prof);
      setStage('WORKSPACE');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-900 bg-slate-950/70 backdrop-blur-md z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Educaro <span className="text-amber-400">Compass</span>
              </span>
              <span className="hidden sm:inline ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                ImpactX'26
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStage('LOGIN')}
              className="text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold transition-all flex items-center gap-2 shadow-sm border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-navy-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-12">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-medium shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ImpactX'26 Agentic AI Track • Educaro Deutschland GmbH</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Your path to Germany,{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              guided.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Talk to an interactive AI guide, verify your qualifications, detect profile inconsistencies, and discover your personalized pathway to study, work, or vocational training in Germany.
          </p>
        </div>

        {/* Pathway Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-left">
          {/* Card 1: Study */}
          <div
            onClick={() => setSelectedPathway('STUDY')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border ${
              selectedPathway === 'STUDY'
                ? 'bg-gradient-to-b from-slate-900 to-navy-950 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Higher Education (Study)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Bachelor's & Master's degrees at tuition-free German public universities. Includes mandatory Indian APS certificate guidance.
            </p>
            <div className="text-[11px] font-mono text-amber-400/90 font-medium flex items-center gap-1">
              <span>APS • Anabin H+ • English/German B2</span>
            </div>
          </div>

          {/* Card 2: Ausbildung */}
          <div
            onClick={() => setSelectedPathway('VOCATIONAL')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border ${
              selectedPathway === 'VOCATIONAL'
                ? 'bg-gradient-to-b from-slate-900 to-navy-950 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Ausbildung (Vocational)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Paid dual vocational training in Healthcare, Nursing, IT, or Logistics with monthly stipends (€1,100–€1,400/mo) and full job security.
            </p>
            <div className="text-[11px] font-mono text-emerald-400/90 font-medium flex items-center gap-1">
              <span>12th Pass • B1/B2 German • Employer Match</span>
            </div>
          </div>

          {/* Card 3: Skilled Work */}
          <div
            onClick={() => setSelectedPathway('WORK')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border ${
              selectedPathway === 'WORK'
                ? 'bg-gradient-to-b from-slate-900 to-navy-950 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Skilled Work & Blue Card</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Direct recruitment for IT, engineering, and healthcare professionals under the German Opportunity Card (Chancenkarte) and EU Blue Card.
            </p>
            <div className="text-[11px] font-mono text-sky-400/90 font-medium flex items-center gap-1">
              <span>Degree Recognition • 2+ Yrs Exp • DIN CV</span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Consent */}
        <div className="space-y-4 max-w-md w-full">
          <div className="space-y-2.5">
            <button
              onClick={() => setStage('LOGIN')}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 border border-slate-200 active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => startJourney(selectedPathway)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explore as Guest (Instant Access)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStage('LOGIN')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Already registered? <span className="text-amber-400 font-semibold underline">Sign In with Email</span>
            </button>
          </div>

          {/* Privacy & Consent Banner */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-400 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="consent"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="consent" className="cursor-pointer text-[11px] leading-relaxed">
              <span className="text-slate-200 font-semibold block mb-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Transparent Data & Responsible AI Notice
              </span>
              I agree to process my profile and document extractions for eligibility checks under GDPR standards. Facts are never fabricated and every AI extraction requires your explicit confirmation.
            </label>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Educaro Compass • Built with Next-Gen Agentic Architecture for Educaro Deutschland GmbH
      </footer>
    </div>
  );
};
