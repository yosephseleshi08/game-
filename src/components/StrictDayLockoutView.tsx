import React, { useState, useEffect } from 'react';
import { getTimeUntilNext12AM } from '../utils/protocol';
import { Lock, ShieldCheck, Clock, CalendarCheck, BarChart3, Users, Zap, Infinity, Smartphone } from 'lucide-react';
import { GameMode } from '../types';

interface StrictDayLockoutViewProps {
  curriculumDay: number;
  gameTitle: string;
  onNavigateMode: (mode: GameMode) => void;
  onUnlockFreeTraining?: () => void;
}

export const StrictDayLockoutView: React.FC<StrictDayLockoutViewProps> = ({
  curriculumDay,
  gameTitle,
  onNavigateMode,
  onUnlockFreeTraining,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNext12AM());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNext12AM());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden backdrop-blur">
        {/* Glowing Badge */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-5 text-emerald-400 shadow-xl shadow-emerald-500/10 animate-pulse">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5" /> Day {curriculumDay} Protocol Complete
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          {gameTitle} Daily Quota Banked
        </h2>
        
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
          Your daily curriculum quota for Day {curriculumDay} is officially saved! In your free time, instead of social media doom scrolling, you can train this step with <strong className="text-cyan-300">unlimited attempts and custom unlocked levels</strong> in Free Training mode.
        </p>

        {/* Free Training Callout Box */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/50 rounded-2xl p-5 max-w-lg mx-auto mb-6 text-left shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Infinity className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              Free Training Available: No Level Limits
            </h3>
          </div>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Want to keep training your memory right now? Free practice allows unlimited reps, custom difficulty levels, and keeps earning you XP.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            {onUnlockFreeTraining && (
              <button
                id="unlock-free-practice-btn"
                onClick={onUnlockFreeTraining}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                Train This Game Freely (Bypass Lock)
              </button>
            )}
            <button
              id="open-free-training-hub-btn"
              onClick={() => onNavigateMode('free-training')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              All-Steps Free Training Hub
            </button>
          </div>
        </div>

        {/* 12:00 AM Countdown Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto mb-7 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Day {curriculumDay + 1} Official Protocol In
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-wider">
            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
          </div>
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">
            Next official curriculum streak unlocks automatically at midnight
          </span>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateMode('daily-protocol')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            View Daily Protocol
          </button>

          <button
            onClick={() => onNavigateMode('community')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Users className="w-4 h-4 text-teal-400" />
            Leaderboard & Athletes
          </button>

          <button
            onClick={() => onNavigateMode('stats')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Mastery & Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};

