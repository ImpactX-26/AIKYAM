import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setStage, setSession, setActivePersona } = useJourneyStore();
  const { setFullProfile, setLoading: setProfileLoading } = useProfileStore();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  // Auto-fill Google custom fields when opening modal
  useEffect(() => {
    if (!googleCustomEmail) {
      setGoogleCustomEmail('amarnathkrishnamurthy82@gmail.com');
      setGoogleCustomName('Amarnath K');
    }
  }, []);

  const handleSuccessfulAuth = async (authRes: any, personaKey: any = null) => {
    setSession({
      token: authRes.token,
      applicantId: authRes.user.applicantId,
      conversationId: authRes.user.conversationId,
      email: authRes.user.email,
      role: authRes.user.role,
      isGuest: Boolean(authRes.user.isGuest),
    });
    if (personaKey) {
      setActivePersona(personaKey);
    }

    try {
      setProfileLoading(true);
      const prof = await api.profile.get();
      setFullProfile(prof);
    } catch (e) {
      console.warn('Profile fetch warning after login:', e);
    } finally {
      setProfileLoading(false);
      setStage('WORKSPACE');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === 'LOGIN') {
        res = await api.auth.login(email, password || undefined);
      } else {
        res = await api.auth.register(email, password || undefined, 'APPLICANT');
      }
      await handleSuccessfulAuth(res);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (selectedEmail: string, selectedName: string) => {
    setError(null);
    setLoading(true);
    setShowGoogleModal(false);

    try {
      const res = await api.auth.google({
        email: selectedEmail,
        name: selectedName,
        googleId: `google_${encodeURIComponent(selectedEmail)}`,
      });
      await handleSuccessfulAuth(res);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersona = async (email: string, personaKey: 'AARAV' | 'PRIYA' | 'VIKRAM') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email);
      await handleSuccessfulAuth(res, personaKey);
    } catch (err: any) {
      setError('Failed to log in as demo persona.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.guest('UNDECIDED');
      await handleSuccessfulAuth(res);
    } catch (err: any) {
      setError('Failed to initialize guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 z-10">
        <button
          onClick={() => setStage('LANDING')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = i18n.language === 'en' ? 'de' : i18n.language === 'de' ? 'hi' : 'en';
              i18n.changeLanguage(next);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors uppercase font-mono font-bold flex items-center gap-1"
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{i18n.language}</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl z-10 relative">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-navy-900 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
            <Compass className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Educaro <span className="text-amber-400">Compass</span>
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'LOGIN'
              ? 'Sign in to access your guided pathway to Germany'
              : 'Create your account to start your applicant journey'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Official Google Sign-In Button */}
        <div className="space-y-3 mb-6">
          <button
            id="google-signin-btn"
            type="button"
            onClick={() => setShowGoogleModal(true)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 border border-slate-200 active:scale-[0.99] disabled:opacity-60"
          >
            {/* High-res official Google 'G' icon */}
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

          <div className="flex items-center gap-3 my-4">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Or with email
            </span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amarnath Krishnamurthy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              {mode === 'LOGIN' && (
                <span className="text-[10px] text-amber-400 hover:underline cursor-pointer">
                  Demo without password
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'LOGIN' ? '•••••••• (optional in demo)' : '••••••••'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
            <span>{mode === 'LOGIN' ? 'Sign In to Journey' : 'Create Account'}</span>
          </button>
        </form>

        {/* Switch Between Login & Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {mode === 'LOGIN' ? (
              <>
                Don't have an account? <span className="text-amber-400 font-semibold">Sign up</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-amber-400 font-semibold">Sign in</span>
              </>
            )}
          </button>
        </div>

        {/* Fast-Track Demo Personas for Judges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Hackathon Judge Fast-Track (1-Click)</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoPersona('aarav.sharma@example.in', 'AARAV')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-amber-400">Aarav</div>
              <div className="text-[9px] text-slate-400">Study (TUM)</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoPersona('priya.patel@example.in', 'PRIYA')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-amber-400">Priya</div>
              <div className="text-[9px] text-slate-400">Ausbildung</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoPersona('vikram.malhotra@example.in', 'VIKRAM')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-amber-400">Vikram</div>
              <div className="text-[9px] text-slate-400">Skilled Work</div>
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              Or explore as anonymous guest
            </button>
          </div>
        </div>
      </div>

      {/* Google Account Chooser Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
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
                <span className="font-bold text-sm text-white">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Choose an active Google account to securely link with your Educaro Compass journey:
            </p>

            {/* Quick Saved Google Accounts */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleGoogleLogin(
                    'amarnathkrishnamurthy82@gmail.com',
                    'Amarnath K'
                  )
                }
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    AK
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400">
                      Amarnath K
                    </div>
                    <div className="text-[10px] text-slate-400">
                      amarnathkrishnamurthy82@gmail.com
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleGoogleLogin(
                    'aarav.sharma@example.in',
                    'Aarav Sharma'
                  )
                }
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    AS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400">
                      Aarav Sharma
                    </div>
                    <div className="text-[10px] text-slate-400">
                      aarav.sharma@example.in
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>

            {/* Custom Google Account Option */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Or use another Google account:
              </span>
              <div className="space-y-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={googleCustomName}
                  onChange={(e) => setGoogleCustomName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleLogin(
                      googleCustomEmail,
                      googleCustomName || googleCustomEmail.split('@')[0]
                    )
                  }
                  disabled={!googleCustomEmail}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  Sign In with this Google Account
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Educaro Deutschland GmbH uses verified Google OAuth 2.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-500 z-10">
        Educaro Compass • Sponsor: Educaro Deutschland GmbH • ImpactX'26
      </div>
    </div>
  );
};
