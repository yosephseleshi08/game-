import React from 'react';
import { GameMode } from '../types';
import { sound } from '../utils/audio';
import {
  CalendarCheck,
  BarChart3,
  ShieldCheck,
  Activity,
  Award,
} from 'lucide-react';

interface ModeSelectorProps {
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isLockedOut?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelectMode, isLockedOut }) => {
  const isProtocolActive = activeMode === 'daily-protocol';
  const isStatsActive = activeMode === 'stats';

  return (
    <nav aria-label="Main Navigation" className="w-full max-w-4xl mx-auto px-4 pt-3 pb-1">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Tab 1: Yosi's 1-Hour Daily Protocol */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectMode('daily-protocol');
          }}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden ${
            isProtocolActive
              ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 text-white ring-1 ring-cyan-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-100 truncate">
              <div
                className={`p-1.5 rounded-xl ${
                  isProtocolActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="truncate">Yosi's Daily Protocol</span>
            </div>
            {isLockedOut ? (
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Mastered
              </span>
            ) : (
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                  isProtocolActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                1h + 1h
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate pl-8">
            3 × 20m Games + 1h Manual Palace
          </p>
        </button>

        {/* Tab 2: Yoseph's Personal Telemetry / Yosi's Cognitive Index & Telemetry */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectMode('stats');
          }}
          className={`text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden ${
            isStatsActive
              ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white ring-1 ring-indigo-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-100 truncate">
              <div
                className={`p-1.5 rounded-xl ${
                  isStatsActive
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="truncate">Yoseph's Personal Telemetry</span>
            </div>
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                isStatsActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Cognitive Index
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate pl-8">
            Green/Red Calendar & Mastery Stats
          </p>
        </button>
      </div>
    </nav>
  );
};
