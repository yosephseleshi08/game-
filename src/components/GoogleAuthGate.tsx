import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmailPassword, registerWithEmailPassword } from '../utils/firebase';
import { sound } from '../utils/audio';
import { UserProfile } from '../types';
import {
  Smartphone,
  Laptop,
  Flame,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface GoogleAuthGateProps {
  isOpen: boolean;
  onSuccess: (profile?: UserProfile) => void;
  onDismissOffline?: () => void;
  curriculumDay?: number;
  currentStreak?: number;
}

export const GoogleAuthGate: React.FC<GoogleAuthGateProps> = ({
  isOpen,
  onSuccess,
  onDismissOffline,
  curriculumDay = 7,
  currentStreak = 6,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('chessking535@gmail.com');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('Memory Athlete');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      sound.playClick();
      const { profile } = await loginWithGoogle();
      sound.playLevelUp();
      setSuccessMsg('Signed in with Google! Syncing all 3 devices now...');
      setTimeout(() => {
        onSuccess(profile);
      }, 700);
    } catch (err: unknown) {
      sound.playError();
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in popup was closed before finishing.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or use email sign-in below.');
        setShowEmailAuth(true);
      } else {
        setErrorMsg((err as Error).message || 'Failed to sign in with Google. You can also use email sign-in below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      sound.playClick();
      if (emailMode === 'signin') {
        await loginWithEmailPassword(email.trim(), password);
        sound.playSuccess();
        setSuccessMsg('Signed in successfully! Syncing your data...');
        setTimeout(() => onSuccess(), 700);
      } else {
        const { profile } = await registerWithEmailPassword(
          email.trim(),
          password,
          username.trim() || 'Athlete',
          'ayumu'
        );
        sound.playLevelUp();
        setSuccessMsg('Account created & linked! Syncing...');
        setTimeout(() => onSuccess(profile), 700);
      }
    } catch (err: unknown) {
      sound.playError();
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Incorrect password or account not found. If this is your first time, switch to "Create Password" below.');
      } else {
        setErrorMsg((err as Error).message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto">
        {/* Glow Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>3-Device Real-Time Sync</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Sign In with Google Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            Use the <strong className="text-cyan-400">same Google Gmail account</strong> on your 2 phones and PC so all 3 devices automatically sync your 6-day streak and live progress.
          </p>
        </div>

        {/* Guaranteed 6-Day Streak Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/50 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">6-Day Streak Guaranteed</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 font-bold border border-amber-700/60 font-mono">
                {currentStreak} Days • Day {curriculumDay}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Signing in instantly links and restores your active 6-day streak on this device.
            </p>
          </div>
        </div>

        {/* 3 Devices Sync Visual Diagram */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
            Connected Device Architecture:
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
              <Smartphone className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <div className="font-bold text-white text-[11px]">Phone 1</div>
              <div className="text-[9px] text-emerald-400 font-medium">Auto-Sync</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
              <Smartphone className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <div className="font-bold text-white text-[11px]">Phone 2</div>
              <div className="text-[9px] text-emerald-400 font-medium">Auto-Sync</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30">
              <Laptop className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
              <div className="font-bold text-white text-[11px]">PC / Laptop</div>
              <div className="text-[9px] text-emerald-400 font-medium">Auto-Sync</div>
            </div>
          </div>
          <div className="text-center mt-2.5 text-[10px] text-slate-400">
            Sign in with <span className="font-mono text-cyan-300 font-bold">chessking535@gmail.com</span> on all three devices.
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Action: Sign In With Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-cyan-500/10 active:scale-98 disabled:opacity-50 mb-3"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          )}
          <span>Continue with Google Account</span>
        </button>

        {/* Secondary: Email / Password Option for Mobile browsers or popup restrictions */}
        <div className="pt-2 border-t border-slate-800 text-center">
          {!showEmailAuth ? (
            <button
              type="button"
              onClick={() => setShowEmailAuth(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
            >
              Mobile popup blocked? Sign in / create password with Gmail instead →
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="mt-3 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {emailMode === 'signin' ? 'Sign In with Gmail' : 'Create Account with Gmail'}
                </span>
                <button
                  type="button"
                  onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  {emailMode === 'signin' ? 'Need a password? Click here' : 'Already have password? Sign in'}
                </button>
              </div>

              {emailMode === 'signup' && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Athlete Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Memory Athlete"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Gmail Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chessking535@gmail.com"
                    required
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : emailMode === 'signin' ? 'Sign In & Sync' : 'Register & Sync'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailAuth(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Back to Google
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Offline Preview Fallback with notice */}
        {onDismissOffline && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onDismissOffline}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Continue in Local Offline Mode <span className="text-slate-400">(will not sync to other devices)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
