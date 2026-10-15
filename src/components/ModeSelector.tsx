import React from 'react';
import { GameMode } from '../types';
import { sound } from '../utils/audio';
import {
  CalendarCheck,
  BarChart3,
  CheckCircle2,
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
    <nav aria-label="Main Navigation" className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-1">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Tab 1: Daily Protocol */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSelectMode('daily-protocol');
          }}
          className={`text-left p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden min-w-0 ${
            isProtocolActive
              ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 text-white ring-1 ring-cyan-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm text-slate-100 min-w-0">
              <div
                className={`p-1 sm:p-1.5 rounded-xl shrink-0 ${
                  isProtocolActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-white">Daily Protocol</span>
            </div>
            {isLockedOut ? (
              <span className="text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                Done ✓
              </span>
            ) : (
              <span
                className={`text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  isProtocolActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                1h + 1h
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate pl-0 sm:pl-7">
            3×20m Games + 1h Palace
          </p>
        </button>

        {/* Tab 2: Telemetry & Stats */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSelectMode('stats');
          }}
          className={`text-left p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden min-w-0 ${
            isStatsActive
              ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white ring-1 ring-indigo-500/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm text-slate-100 min-w-0">
              <div
                className={`p-1 sm:p-1.5 rounded-xl shrink-0 ${
                  isStatsActive
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-white">Telemetry & Stats</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0 ${
                isStatsActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Records
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate pl-0 sm:pl-7">
            Calendar, Streaks & Trends
          </p>
        </button>
      </div>
    </nav>
  );
};
