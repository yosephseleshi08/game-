import React, { useState, useEffect, useRef } from 'react';
import { verifyYosephPassword, setDeviceUnlocked } from '../utils/yosephSync';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface YosephSecurityGateProps {
  isOpen: boolean;
  onUnlockSuccess: () => void;
}

export const YosephSecurityGate: React.FC<YosephSecurityGateProps> = ({
  isOpen,
  onUnlockSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Please enter the password to unlock Yoseph's progress.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    sound.playClick();

    try {
      const result = await verifyYosephPassword(password);
      if (result.success) {
        setSuccessMsg('Welcome back Yoseph!');
        sound.playLevelUp();
        setDeviceUnlocked(true);

        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#10b981', '#6366f1'],
          });
        } catch {
          // ignore confetti if blocked
        }

        setTimeout(() => {
          onUnlockSuccess();
        }, 700);
      } else {
        sound.playError();
        setErrorMsg(
          result.message ||
            "This game is only for Yoseph. If you don't know the password, you can't play or see Yoseph's progress."
        );
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      // Fallback local check
      if (password.trim().toLowerCase() === 'yoseph535') {
        setSuccessMsg('Welcome back Yoseph!');
        sound.playLevelUp();
        setDeviceUnlocked(true);
        setTimeout(() => onUnlockSuccess(), 700);
      } else {
        sound.playError();
        setErrorMsg(
          "This game is only for Yoseph. If you don't know the password, you can't play or see Yoseph's progress."
        );
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-md bg-slate-900/90 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
        style={{
          boxShadow: '0 0 50px -10px rgba(6, 182, 212, 0.25)',
        }}
      >
        {/* Glow Ambient */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Security Badge */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Yoseph's Private Cognitive Vault</span>
          </div>

          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            {successMsg ? (
              <Unlock className="w-8 h-8 text-emerald-300 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            This game is only for Yoseph
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-sm mx-auto font-medium">
            If you don't know the password, you can't play or see Yoseph's progress.
          </p>
        </div>

        {/* 3 Devices Synced Notice */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Phone 1
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Phone 2
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-indigo-400" /> PC
            </span>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-1.5">
            All devices connect to the same unified cloud save.
          </p>
        </div>

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/50 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-tight">{errorMsg}</div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Enter Password
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter password..."
                required
                autoComplete="current-password"
                disabled={isVerifying || Boolean(successMsg)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-white text-sm placeholder-slate-500 outline-none transition-all shadow-inner font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || Boolean(successMsg)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-cyan-950/50 active:scale-98 disabled:opacity-50"
          >
            {isVerifying ? (
              <span>Verifying...</span>
            ) : successMsg ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Welcome Yoseph!
              </>
            ) : (
              <>
                <span>Unlock Game</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400">
            Protected system • Exclusively built for Yoseph
          </p>
        </div>
      </div>
    </div>
  );
};
