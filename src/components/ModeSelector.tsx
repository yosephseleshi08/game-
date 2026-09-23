import React from 'react';
import { GameMode } from '../types';
import { sound } from '../utils/audio';
import {
  Grid3X3,
  Hash,
  Sparkles,
  Award,
  BarChart3,
  Brain,
  Flame,
  CalendarCheck,
  Castle,
  Layers,
  Zap,
  Infinity,
  Clock,
  Search,
} from 'lucide-react';

interface ModeSelectorProps {
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isLockedOut?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelectMode, isLockedOut }) => {
  const modes: { id: GameMode; label: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'four-hour-plan',
      label: '4-Hour Master Plan',
      desc: '30/70 Digital + Physical',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      badge: '4h Elite',
    },
    {
      id: 'daily-protocol',
      label: 'Daily Protocol',
      desc: '3-Pillar 12 AM Lockout',
      icon: <CalendarCheck className="w-4 h-4 text-emerald-400" />,
      badge: isLockedOut ? 'Mastered' : 'Daily',
    },
    {
      id: 'free-training',
      label: 'Focused Brain Gym',
      desc: 'Ayumu, N-Back & Palace',
      icon: <Infinity className="w-4 h-4 text-cyan-400" />,
      badge: '30/70 Gym',
    },
    {
      id: 'ayumu-chimp',
      label: 'Ayumu Sequence',
      desc: 'Iconic flash & subitizing',
      icon: <Hash className="w-4 h-4 text-amber-400" />,
      badge: 'RAM (18m)',
    },
    {
      id: 'dual-nback',
      label: 'Dual N-Back',
      desc: 'Working memory buffer (Gf)',
      icon: <Brain className="w-4 h-4 text-sky-400" />,
      badge: 'RAM (18m)',
    },
    {
      id: 'memory-palace',
      label: 'Memory Palace',
      desc: 'Method of loci architecture',
      icon: <Castle className="w-4 h-4 text-amber-300" />,
      badge: 'Loci (84m)',
    },
    {
      id: 'symbol-detective',
      label: 'Symbol Detective Lab',
      desc: 'Visual binding & anomaly search',
      icon: <Search className="w-4 h-4 text-purple-400" />,
      badge: 'Lab (15m)',
    },
    {
      id: 'stats',
      label: 'Mastery & Stats',
      desc: 'Neural telemetry & history',
      icon: <BarChart3 className="w-4 h-4 text-indigo-400" />,
    },
  ];

  return (
    <nav aria-label="Game Modes" className="w-full max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-1">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x snap-x">
        {modes.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                sound.playClick();
                onSelectMode(m.id);
              }}
              className={`flex-1 min-w-[150px] sm:min-w-[170px] min-h-[48px] text-left p-2.5 rounded-xl border snap-start transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                isActive
                  ? 'bg-slate-800 border-cyan-500/80 shadow-md shadow-cyan-500/10 text-white ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200 truncate">
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </div>
                {m.badge && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{m.desc}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
