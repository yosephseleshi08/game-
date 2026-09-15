import React, { useState } from 'react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  FIREBASE_PROJECT_ID,
  AVATAR_PRESETS,
  AvatarPreset,
} from '../utils/firebase';
import { createLocalAthleteProfile } from '../utils/storage';
import { sound } from '../utils/audio';
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Users,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  HelpCircle,
  Globe,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile?: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ayumu');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    sound.playClick();
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hostname);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2500);
    }
  };

  const handleContinueAsGuest = () => {
    sound.playLevelUp();
    const guestUsername = tab === 'signup' && username.trim() ? username.trim() : 'Local Athlete';
    const profile = createLocalAthleteProfile(guestUsername, selectedPresetId);
    setSuccessMsg('Initialized Local Athlete profile! You can train instantly.');
    setTimeout(() => {
      onAuthSuccess(profile);
      onClose();
    }, 600);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      sound.playClick();
      const { profile } = await loginWithGoogle();
      sound.playLevelUp();
      setSuccessMsg('Signed in with Google successfully!');
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 700);
    } catch (err: unknown) {
      sound.playError();
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing.');
      } else if (code === 'auth/cancelled-popup-request') {
        // user initiated another action
      } else if (code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMsg(`Domain "${window.location.hostname}" is not yet authorized in Firebase.`);
      } else if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('Authentication provider is not yet enabled in Firebase Console.');
      } else {
        setErrorMsg((err as Error).message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      sound.playClick();
      await loginWithEmailPassword(email.trim(), password);
      sound.playSuccess();
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      sound.playError();
      const code = (err as { code?: string })?.code;
      if (code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMsg(`Domain "${window.location.hostname}" is not authorized in Firebase.`);
      } else if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('Email/Password sign-in is disabled in your Firebase Console.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please try again in a few moments.');
      } else {
        setErrorMsg((err as Error).message || 'Unable to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please choose a username for your memory athlete profile.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      sound.playClick();
      const { profile } = await registerWithEmailPassword(
        email.trim(),
        password,
        username.trim(),
        selectedPresetId,
        useCustomPhoto ? customPhotoUrl : undefined
      );
      sound.playLevelUp();
      setSuccessMsg('Account created successfully! Your profile is ready.');
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 700);
    } catch (err: unknown) {
      sound.playError();
      const code = (err as { code?: string })?.code;
      if (code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMsg(`Domain "${window.location.hostname}" is not authorized in Firebase.`);
      } else if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('Email/Password provider is disabled in your Firebase Console.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Try signing in.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please provide a valid email format.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please use at least 6 characters.');
      } else {
        setErrorMsg((err as Error).message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {tab === 'signin' ? 'Sign In to Your Account' : 'Create Individual Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {tab === 'signin'
                ? 'Resume your 365-day progress and cloud telemetry'
                : 'Save your own progress, profile photo & compete with friends'}
            </p>
          </div>
        </div>

        {/* Quick Google Sign-In */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-white/10 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
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
            <span>Continue with Google (1-Click)</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">or with email</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('signin');
              setErrorMsg(null);
              setIsOperationNotAllowed(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In with Password
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('signup');
              setErrorMsg(null);
              setIsOperationNotAllowed(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Player Account
          </button>
        </div>

        {/* Unauthorized Domain Guidance Box */}
        {isUnauthorizedDomain && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs space-y-3 animate-fade-in shadow-xl">
            <div className="font-bold flex items-center gap-2 text-rose-300">
              <Globe className="w-4 h-4 text-rose-400 shrink-0" />
              Firebase Setup: Domain Not Authorized (auth/unauthorized-domain)
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Firebase Authentication requires Cloud Run domains to be added to <strong>Authorized Domains</strong> in Firebase Console before Google or email login is permitted.
            </p>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current App Domain to Whitelist:</div>
              <div className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : 'run.app'}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer shrink-0 transition-colors"
                >
                  {domainCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{domainCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <li>Open <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
              <li>Under <strong>Authorized domains</strong>, click <strong>Add domain</strong></li>
              <li>Paste the domain above (or enter <code className="text-cyan-300 font-mono">run.app</code> to cover all container previews) and click <strong>Done</strong></li>
            </ol>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <a
                href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Open Authorized Domains in Console <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" /> Skip & Play in Local Mode
              </button>
            </div>
          </div>
        )}

        {/* Operation Not Allowed Guidance Box */}
        {isOperationNotAllowed && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs space-y-2.5 animate-fade-in shadow-xl">
            <div className="font-bold flex items-center gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              Firebase Setup: Enable Email/Password Provider
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Firebase Authentication requires Email/Password sign-in to be enabled in your Firebase Console:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <li>Open your Firebase Authentication console</li>
              <li>Select the <strong>Sign-in method</strong> tab</li>
              <li>Click <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong></li>
            </ol>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <a
                href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Open Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Sign in with Google Instead
              </button>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Sign In with Password
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400">
                Playing with friends? Each friend gets their own isolated login and photo so no one overwrites each other's score.
              </p>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Choose Username
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. MemoryKing, EideticMaster"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Profile Photo / Avatar Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Choose Profile Photo
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomPhoto(!useCustomPhoto)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {useCustomPhoto ? 'Use Preset Avatars' : 'Paste Custom Photo URL'}
                </button>
              </div>

              {!useCustomPhoto ? (
                <div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {AVATAR_PRESETS.map((p) => {
                      const isSelected = selectedPresetId === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            sound.playClick();
                            setSelectedPresetId(p.id);
                          }}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 shadow-md'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${p.bgGradient} flex items-center justify-center text-lg shadow-sm`}
                          >
                            {p.emoji}
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                            {p.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Selected avatar appears on the community leaderboard and player directory.
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  {customPhotoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={customPhotoUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-cyan-400"
                        onError={() => setErrorMsg('Could not load image preview. Check the URL.')}
                      />
                      <span className="text-[10px] text-slate-400">Image preview valid</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Create Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Creating profile...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Create Account & Lock Flash Plan
                </>
              )}
            </button>
          </form>
        )}

        {/* Instant Local Play Option */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-700/70 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Continue as Local Athlete (Play Instantly Without Firebase)</span>
          </button>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Full access to 365-Day Protocol, XP, and Customization. Saves directly to your browser.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Firebase Auth Cloud Sync
          </span>
          <span>Individual Data Isolation</span>
        </div>
      </div>
    </div>
  );
};
