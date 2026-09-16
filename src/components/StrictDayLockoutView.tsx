import React, { useState, useEffect } from 'react';
import { getTimeUntilNext12AM } from '../utils/protocol';
import { Lock, ShieldCheck, Clock, CalendarCheck, BarChart3, Users } from 'lucide-react';
import { GameMode } from '../types';

interface StrictDayLockoutViewProps {
  curriculumDay: number;
  gameTitle: string;
  onNavigateMode: (mode: GameMode) => void;
}

export const StrictDayLockoutView: React.FC<StrictDayLockoutViewProps> = ({
  curriculumDay,
  gameTitle,
  onNavigateMode,
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
          <Lock className="w-3.5 h-3.5" /> Day {curriculumDay} Quota Completed
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          {gameTitle} is Strictly Locked
        </h2>
        
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
          You have already completed your daily deliberate practice levels for today. 
          Other levels and higher difficulty tiers are <strong className="text-emerald-300">strictly locked for the next day</strong> to allow neural consolidation during sleep.
        </p>

        {/* 12:00 AM Countdown Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 max-w-md mx-auto mb-7 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Day {curriculumDay + 1} Training Unlocks In
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-400 tracking-wider">
            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
          </div>
          <span className="text-[10px] text-slate-500 block mt-1.5 font-medium">
            Next levels unlock automatically at 12:00 AM (Midnight)
          </span>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateMode('daily-protocol')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <CalendarCheck className="w-4 h-4" />
            View 6-Step Daily Protocol
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
