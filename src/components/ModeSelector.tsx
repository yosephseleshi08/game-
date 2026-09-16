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
  Users,
  Castle,
  Layers,
  Zap,
  Infinity,
} from 'lucide-react';

interface ModeSelectorProps {
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isLockedOut?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelectMode, isLockedOut }) => {
  const modes: { id: GameMode; label: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'daily-protocol',
      label: 'Daily Protocol',
      desc: '6-Step 12 AM Lockout Plan',
      icon: <CalendarCheck className="w-4 h-4 text-emerald-400" />,
      badge: isLockedOut ? 'Mastered' : 'Daily',
    },
    {
      id: 'free-training',
      label: 'Free Training Hub',
      desc: 'All 6 Steps Unrestricted',
      icon: <Infinity className="w-4 h-4 text-cyan-400" />,
      badge: 'Brain Gym',
    },
    {
      id: 'eidetic-matrix',
      label: 'Eidetic Matrix',
      desc: 'Step 1: Spatial flash recall',
      icon: <Grid3X3 className="w-4 h-4 text-cyan-400" />,
      badge: 'Step 1',
    },
    {
      id: 'ayumu-chimp',
      label: 'Ayumu Sequence',
      desc: 'Step 2: Iconic number flash',
      icon: <Hash className="w-4 h-4 text-amber-400" />,
      badge: 'Step 2',
    },
    {
      id: 'dual-nback',
      label: 'Dual N-Back',
      desc: 'Step 3: Working memory focus',
      icon: <Brain className="w-4 h-4 text-sky-400" />,
      badge: 'Step 3',
    },
    {
      id: 'mnemonic-pegs',
      label: 'Major Pegs',
      desc: 'Step 4: Phonetic peg conversion',
      icon: <Zap className="w-4 h-4 text-orange-400" />,
      badge: 'Step 4',
    },
    {
      id: 'memory-palace',
      label: 'Memory Palace',
      desc: 'Step 5: Method of loci route',
      icon: <Castle className="w-4 h-4 text-amber-400" />,
      badge: 'Step 5',
    },
    {
      id: 'spaced-repetition',
      label: 'Spaced SM-2',
      desc: 'Step 6: SuperMemo recall',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      badge: 'Step 6',
    },
    {
      id: 'symbol-detective',
      label: 'Symbol Detective',
      desc: 'Chromatic feature extraction',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      badge: 'Lab',
    },
    {
      id: 'daily-workout',
      label: 'Daily PQ Test',
      desc: 'Full photographic quotient',
      icon: <Award className="w-4 h-4 text-emerald-400" />,
      badge: 'Test',
    },
    {
      id: 'community',
      label: 'All Players',
      desc: 'Athletes & global rank',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      badge: 'Global',
    },
    {
      id: 'stats',
      label: 'Mastery & Stats',
      desc: 'Neural telemetry & ranks',
      icon: <BarChart3 className="w-4 h-4 text-indigo-400" />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-4 pb-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {modes.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                sound.playClick();
                onSelectMode(m.id);
              }}
              className={`flex-1 min-w-[170px] text-left p-2.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 border-cyan-500/80 shadow-md shadow-cyan-500/10 text-white'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
                  {m.icon}
                  <span>{m.label}</span>
                </div>
                {m.badge && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
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
    </div>
  );
};
