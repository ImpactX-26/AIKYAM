import React from 'react';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import { Sparkles, RefreshCw, UserCheck, Zap } from 'lucide-react';

export const DemoToolbar: React.FC = () => {
  const { setSession, setActivePersona, setStage } = useJourneyStore();
  const { setFullProfile, setLoading } = useProfileStore();

  const loadPersona = async (email: string, personaKey: 'AARAV' | 'PRIYA' | 'VIKRAM') => {
    try {
      setLoading(true);
      // Login as demo persona
      const authRes = await api.auth.login(email);
      setSession({
        token: authRes.token,
        applicantId: authRes.user.applicantId,
        conversationId: authRes.user.conversationId,
        email: authRes.user.email,
        role: authRes.user.role,
        isGuest: false,
      });
      setActivePersona(personaKey);

      // Load full profile
      const profData = await api.profile.get();
      setFullProfile(profData);
      setStage('WORKSPACE');
    } catch (e: any) {
      console.error('Failed to load demo persona:', e);
    } finally {
      setLoading(false);
    }
  };

  const createFreshGuest = async () => {
    try {
      setLoading(true);
      const guestRes = await api.auth.guest('UNDECIDED');
      setSession({
        token: guestRes.token,
        applicantId: guestRes.user.applicantId,
        conversationId: guestRes.user.conversationId,
        email: guestRes.user.email,
        isGuest: true,
      });
      setActivePersona(null);
      const profData = await api.profile.get();
      setFullProfile(profData);
      setStage('WORKSPACE');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside aria-label="Demo Persona Switcher" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-panel px-4 py-2.5 rounded-full shadow-2xl border border-amber-500/30 flex items-center gap-3 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border-r border-slate-700 pr-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Demo Controls</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => loadPersona('aarav.sharma@example.in', 'AARAV')}
          className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          title="Master's Candidate with Goethe A2 vs B2 inconsistency & missing APS"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          Aarav (Study)
        </button>

        <button
          onClick={() => loadPersona('priya.patel@example.in', 'PRIYA')}
          className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          title="Ausbildung Nursing with Passport vs 12th Board DOB mismatch"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Priya (Ausbildung)
        </button>

        <button
          onClick={() => loadPersona('vikram.malhotra@example.in', 'VIKRAM')}
          className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          title="Senior Cloud Engineer with TCS & Infosys employment overlap"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Vikram (Work)
        </button>
      </div>

      <div className="border-l border-slate-700 pl-3 flex items-center gap-2">
        <button
          onClick={createFreshGuest}
          className="text-xs px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
          title="Create a fresh live interactive guest session"
        >
          <RefreshCw className="w-3 h-3" />
          Fresh Session
        </button>
      </div>
    </aside>
  );
};
