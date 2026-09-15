import React, { useState } from 'react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  AVATAR_PRESETS,
  AvatarPreset,
} from '../utils/firebase';
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

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }
    setErrorMsg(null);
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
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
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
      if (code === 'auth/email-already-in-use') {
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('signin');
              setErrorMsg(null);
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

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Firebase Auth Cloud Sync
          </span>
          <span>Individual Data Isolation</span>
        </div>
      </div>
    </div>
  );
};
