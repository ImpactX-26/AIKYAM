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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
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

        {/* Action Button & Consent */}
        <div className="space-y-4 max-w-md w-full">
          <button
            onClick={() => startJourney(selectedPathway)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Begin Guided Journey as Guest</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

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
