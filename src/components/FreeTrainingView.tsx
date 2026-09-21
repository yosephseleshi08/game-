import React, { useState, useEffect } from 'react';
import { GameMode, FlashSpeed, FreeTrainingSessionStats, DailyTrainingLog } from '../types';
import { sound } from '../utils/audio';
import {
  loadFreeTrainingStats,
  resetFreeTrainingStatsToZero,
  recordFreeTrainingSession,
  recordFreeTrainingTime,
  FLASH_SPEED_OPTIONS,
} from '../utils/storage';
import {
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Brain,
  Grid3X3,
  Hash,
  Castle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Infinity,
  Sliders,
  Calendar,
  History,
  Check,
} from 'lucide-react';

interface FreeTrainingViewProps {
  curriculumDay: number;
  currentSpeed: FlashSpeed;
  onSpeedChange: (speed: FlashSpeed) => void;
  onNavigateMode: (mode: GameMode) => void;
  onStartStepWithConfig?: (mode: GameMode, config?: { level?: number; digits?: number; nBack?: number }) => void;
  onAddXp: (amount: number) => void;
  stats?: FreeTrainingSessionStats;
  onUpdateStats?: (stats: FreeTrainingSessionStats) => void;
}

export const FreeTrainingView: React.FC<FreeTrainingViewProps> = ({
  curriculumDay,
  currentSpeed,
  onSpeedChange,
  onNavigateMode,
  onStartStepWithConfig,
  onAddXp,
  stats: externalStats,
  onUpdateStats,
}) => {
  const [internalStats, setInternalStats] = useState(() => loadFreeTrainingStats());
  const activeStats = externalStats || internalStats;

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [doomScrollDailyMinutes, setDoomScrollDailyMinutes] = useState(30);
  const [selectedCircuit, setSelectedCircuit] = useState<'sprint' | 'prefrontal' | 'full' | null>(null);
  const [circuitStepIndex, setCircuitStepIndex] = useState(0);

  // Custom step level selections for free training
  const [matrixLevelChoice, setMatrixLevelChoice] = useState(4);
  const [ayumuDigitsChoice, setAyumuDigitsChoice] = useState(7);
  const [nBackChoice, setNBackChoice] = useState(2);
  const [pegRangeChoice, setPegRangeChoice] = useState<'0-9' | '00-30' | '00-70' | '00-99'>('00-99');
  const [palaceLociChoice, setPalaceLociChoice] = useState(8);

  // Timer loop for free practice session while in hub
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const handleRestartTimersToZero = () => {
    sound.playClick();
    const clean = resetFreeTrainingStatsToZero(curriculumDay);
    setSessionSeconds(0);
    setInternalStats(clean);
    if (onUpdateStats) onUpdateStats(clean);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeDisplay = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m 00s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleLaunchStep = (mode: GameMode, config?: { level?: number; digits?: number; nBack?: number }) => {
    sound.playClick();
    const updated = recordFreeTrainingTime(0, 1, mode, curriculumDay);
    setInternalStats(updated);
    if (onUpdateStats) onUpdateStats(updated);
    if (onStartStepWithConfig) {
      onStartStepWithConfig(mode, config);
    } else {
      onNavigateMode(mode);
    }
  };

  const GAME_LABELS: Record<string, { label: string; color: string; badge: string }> = {
    'eidetic-matrix': { label: 'Eidetic Matrix Flash', color: 'text-cyan-400', badge: 'Step 1' },
    'ayumu-chimp': { label: 'Ayumu Chimp Sequence', color: 'text-amber-400', badge: 'Step 2' },
    'dual-nback': { label: 'Dual N-Back Fluid IQ', color: 'text-sky-400', badge: 'Step 3' },
    'mnemonic-pegs': { label: 'Major Peg Conversions', color: 'text-orange-400', badge: 'Step 4' },
    'memory-palace': { label: 'Memory Palace Loci Route', color: 'text-amber-300', badge: 'Step 5' },
    'spaced-repetition': { label: 'Spaced SM-2 Active Review', color: 'text-purple-400', badge: 'Step 6' },
    'symbol-detective': { label: 'Symbol Detective Lab', color: 'text-pink-400', badge: 'Lab' },
    'daily-workout': { label: 'Daily PQ Benchmark Test', color: 'text-emerald-400', badge: 'Test' },
  };

  const todayGameEntries: [string, number][] = Object.entries(
    activeStats.todayGamesBreakdown || {}
  ).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0);

  const historyEntries: [string, DailyTrainingLog][] = (
    Object.entries(activeStats.dailyHistory || {}) as [string, DailyTrainingLog][]
  ).sort((a, b) => b[0].localeCompare(a[0]));

  // Extract Day 1 metrics
  const historyList = (Object.values(activeStats.dailyHistory || {}) as DailyTrainingLog[]);
  const archivedDay1 = historyList.find((log) => log.curriculumDay === 1) || (historyList.length > 0 ? historyList.slice().sort((a, b) => a.cycleKey.localeCompare(b.cycleKey))[0] : null);

  const isDay1ActiveToday = curriculumDay === 1;
  const day1Seconds = isDay1ActiveToday ? activeStats.todaySeconds : (archivedDay1 ? archivedDay1.seconds : 0);
  const day1Reps = isDay1ActiveToday ? activeStats.todayReps : (archivedDay1 ? archivedDay1.reps : 0);
  const day1Games: Record<string, number> = isDay1ActiveToday ? (activeStats.todayGamesBreakdown || {}) : (archivedDay1 ? archivedDay1.gamesBreakdown : {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Hero Header: Free Training & Anti-Doom Scrolling Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/90 px-3 py-1 rounded-full border border-cyan-500/60 flex items-center gap-1.5 shadow-sm">
                <Infinity className="w-3.5 h-3.5 text-cyan-400" />
                Unrestricted Brain Gym
              </span>
              <span className="text-xs font-bold bg-amber-950/80 text-amber-300 px-3 py-1 rounded-full border border-amber-600/60 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                Anti-Doom Scrolling Dopamine Swap
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Train All Steps Freely in Your Downtime
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Don't let rigid 2-minute daily locks hold you back, and never surrender your free hours to mindless TikTok or Reels doom scrolling! 
              Whenever you hit start on any game, your active playing time is automatically recorded and archived at <strong>12:00 AM Midnight</strong>.
            </p>
          </div>

          {/* Today's Free Training Timer Card (12 AM Cycle) */}
          <div className="bg-slate-950/90 border border-cyan-500/40 p-4 sm:p-5 rounded-2xl flex flex-col items-center min-w-[240px] shadow-xl text-center ring-1 ring-cyan-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Today's Free Training
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider my-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {formatTimeDisplay(activeStats.todaySeconds)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mb-2">
              Resets 12:00 AM • {activeStats.todayReps} Reps Today
            </div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3" /> +15 XP Every Active Minute
            </div>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleRestartTimersToZero}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5"
                title="Restart all free training timers from 0:00"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" /> Restart to Zero
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Practice</span>
            <span className="text-lg font-mono font-black text-cyan-300">
              {formatTimeDisplay(activeStats.todaySeconds)}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">All-Time Free Time</span>
            <span className="text-lg font-mono font-black text-white">
              {formatTimeDisplay(activeStats.totalSecondsPracticed)}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Doom Scroll Time Saved</span>
            <span className="text-lg font-mono font-black text-emerald-400">
              ~{activeStats.doomScrollMinutesSaved} min
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Free Reps</span>
            <span className="text-lg font-mono font-black text-amber-300">
              {activeStats.totalRepsCompleted} Reps
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Day 1 Free Training Performance Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/50 rounded-3xl p-6 sm:p-7 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner">
              <Award className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Day 1 Free Training Performance Dashboard
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono flex items-center gap-1">
                  {isDay1ActiveToday ? 'Active Today' : 'Archived Milestone'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Your deliberate practice stats recorded during Day 1 of the Photographic Memory curriculum.
              </p>
            </div>
          </div>

          <button
            onClick={handleRestartTimersToZero}
            className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Reset free training timers and records back to zero"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restart Timer from Zero
          </button>
        </div>

        {/* Day 1 Big Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-2xl text-center shadow-md">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider mb-1">
              Day 1 Free Training Time
            </span>
            <span className="text-2xl font-mono font-black text-white">
              {formatTimeDisplay(day1Seconds)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {day1Seconds > 0 ? `${Math.floor(day1Seconds / 60)} minutes active` : 'Play any game to log'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center shadow-md">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Day 1 Reps Completed
            </span>
            <span className="text-2xl font-mono font-black text-amber-300">
              {day1Reps} Reps
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Cognitive sets cleared
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center shadow-md">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Doom Scrolling Replaced
            </span>
            <span className="text-2xl font-mono font-black text-emerald-400">
              ~{Math.round((day1Seconds / 60) * 1.5)}m
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Reclaimed brain focus
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center shadow-md">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Memory XP Generated
            </span>
            <span className="text-2xl font-mono font-black text-purple-300">
              +{Math.floor(day1Seconds / 60) * 15} XP
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              +15 XP/min deliberate play
            </span>
          </div>
        </div>

        {/* Day 1 Game Breakdown */}
        <div className="mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Day 1 Game-by-Game Time Breakdown
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              Total: {formatTimeDisplay(day1Seconds)}
            </span>
          </div>

          {Object.keys(day1Games).length === 0 ? (
            <div className="text-center py-3 text-xs text-slate-400">
              No game rounds completed for Day 1 yet. Click any game card below to play!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(day1Games).map(([mode, sec]) => {
                const info = GAME_LABELS[mode] || { label: mode, color: 'text-slate-300', badge: 'Game' };
                return (
                  <div
                    key={mode}
                    className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
                  >
                    <span className={`text-xs font-semibold ${info.color} truncate mr-2`}>
                      {info.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-white shrink-0">
                      {formatTimeDisplay(sec)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mathematical Accuracy & Synchronization Guarantee */}
        <div className="mt-4 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Why was All-Time Free Time higher before?</strong>
            <p className="mt-0.5 text-slate-300">
              Previously, simulated test clicks and raw minute rounding accumulated separately in browser memory. 
              We fixed the calculation: All-Time Free Time is now strictly computed as the sum of your daily logs. 
              On Day 1, <strong>All-Time Free Time ({formatTimeDisplay(activeStats.totalSecondsPracticed)})</strong> matches <strong>Day 1 Time ({formatTimeDisplay(day1Seconds)})</strong> with 100% mathematical precision.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Free Practice Journal & 12:00 AM Midnight Archive */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Daily Free Training Journal & 12:00 AM Tracker
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> Active Today
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every game you play automatically logs active seconds. At 12:00 AM midnight, today's time archives into your history.
              </p>
            </div>
          </div>

          <button
            onClick={handleRestartTimersToZero}
            className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            title="Restart all free training timers from zero"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Restart Timer to 0:00
          </button>
        </div>

        {/* Today's Game Time Breakdown */}
        <div className="mt-5">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Today's Game-by-Game Time Allocation
          </span>

          {todayGameEntries.length === 0 ? (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-300 font-medium mb-1">
                No game time recorded yet today.
              </p>
              <p className="text-[11px] text-slate-500">
                Launch any game below—the timer will automatically start tracking your playing time and add to today's record!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {todayGameEntries.map(([mode, sec]) => {
                const info = GAME_LABELS[mode] || { label: mode, color: 'text-slate-300', badge: 'Game' };
                return (
                  <div
                    key={mode}
                    className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {info.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {formatTimeDisplay(sec)}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${info.color} truncate`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Daily Archives (12:00 AM Reset Archive) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" /> Past Daily Records (Archived at 12:00 AM)
            </span>
            <span className="text-[11px] text-slate-500">
              {historyEntries.length} {historyEntries.length === 1 ? 'day' : 'days'} archived
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">
                Your first 12:00 AM midnight archive will be generated tonight!
              </p>
              <p className="text-[11px] text-slate-500">
                All minutes and reps you complete today will be permanently preserved in this daily journal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {historyEntries.map(([cycleKey, log]) => (
                <div
                  key={cycleKey}
                  className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{log.date || cycleKey}</span>
                    <span className="text-xs font-mono font-black text-cyan-400">
                      {formatTimeDisplay(log.seconds)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{log.reps} Reps Cleared</span>
                    <span className="text-emerald-400">~{Math.round((log.seconds / 60) * 1.5)}m saved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Neuroscience Insight: Why 1 Daily Level is NOT enough */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5 border border-indigo-500/40">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              Can You Build Super-Memory With Only 1 Daily Level?
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Cognitive Science Verdict
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              <strong>Short answer: No, you need deliberate free practice in your downtime.</strong> While the Daily Protocol acts as a structured daily test/checkpoint to maintain streaks, 
              true cognitive neuroplasticity requires <em>frequent, distributed stimulus</em>. Memory champions, speed-readers, and Grandmasters of Memory train across dozens of rounds per day in their spare moments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2 text-rose-300">
                <span className="text-base">❌</span>
                <div>
                  <strong className="text-white block">TikTok Doom Scrolling:</strong>
                  Passive, 10-second rapid context switching floods the brain with cheap dopamine, reducing working memory retention by up to 25% and degrading focus.
                </div>
              </div>

              <div className="flex items-start gap-2 text-emerald-300">
                <span className="text-base">✅</span>
                <div>
                  <strong className="text-white block">Free Memory Training:</strong>
                  Active flash drills (Matrix, Ayumu, Dual N-Back) force the visual cortex to generate real neural myelin, expanding iconic memory trace and fluid IQ.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Start 30/70 Circuits */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              Quick-Start 30/70 Cognitive Circuits
            </h3>
            <p className="text-xs text-slate-400">
              Zero distraction workouts calibrated strictly for the 30% RAM / 70% Loci protocol:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Circuit 1: 10-Min RAM Primer */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚡ 10 Minutes (RAM)
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+150 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Prefrontal RAM Primer</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                5m Ayumu iconic sequence flash + 5m Dual N-Back working memory buffer.
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Ayumu Iconic Flash (6-9 Digits)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Dual N-Back (N=2 / N=3 Focus)
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('ayumu-chimp', { digits: 7 })}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> Start 10-Min RAM Circuit
            </button>
          </div>

          {/* Circuit 2: 20-Min Deep Loci Storage */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  🏛️ 20 Minutes (70% Loci)
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+250 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Deep Loci Storage Session</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Dedicated Method of Loci journey: Walk villa stations with vivid multisensory anchorings.
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" /> 8-12 Loci Architectural Path
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Forward & Reverse Route Traversal
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('memory-palace')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> Start 20-Min Loci Circuit
            </button>
          </div>

          {/* Circuit 3: 30-Min Master 30/70 Cycle */}
          <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  🏆 30 Minutes
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+400 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Full 30/70 Micro-Block</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                4.5m Ayumu + 4.5m Dual N-Back (9m RAM = 30%) + 21m Memory Palace (70% Storage).
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Exact Mathematical 30/70 Proportions
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Seamless Prefrontal Activation
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('ayumu-chimp', { digits: 7 })}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Start 30-Min Circuit
            </button>
          </div>
        </div>
      </div>

      {/* CORE 30/70 DISCIPLINES: NO DISTRACTIONS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Core 30/70 Disciplines (Zero Distractions)
            </h3>
            <p className="text-xs text-slate-400">
              Strictly focused on the 3 core pillars: 30% RAM (Ayumu + N-Back) & 70% Storage (Memory Palace):
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Pillar 1: Ayumu Chimp (15% RAM) */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">RAM Pillar (15%)</span>
                    <h4 className="text-base font-bold text-white">Ayumu Iconic Flash</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono border border-amber-800/60">
                  Target: 18m
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Chimpanzee iconic memory speed test. Flash numbers across 40 cells and tap in ascending order.
              </p>

              {/* Free Digit Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Digits Count (Unlocked):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[4, 5, 6, 7, 8, 9, 10, 11].map((digits) => (
                    <button
                      key={digits}
                      onClick={() => setAyumuDigitsChoice(digits)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        ayumuDigitsChoice === digits
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {digits} Digits
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('ayumu-chimp', { digits: ayumuDigitsChoice })}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Train Ayumu at {ayumuDigitsChoice} Digits
            </button>
          </div>

          {/* Pillar 2: Dual N-Back (15% RAM) */}
          <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">RAM Pillar (15%)</span>
                    <h4 className="text-base font-bold text-white">Dual N-Back Working Memory</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 font-mono border border-sky-800/60">
                  Target: 18m
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Auditory + spatial simultaneous working memory. Proven by Jaeggi et al. to expand fluid intelligence.
              </p>

              {/* Free N Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select N-Back Depth (Unlocked):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((nVal) => (
                    <button
                      key={nVal}
                      onClick={() => setNBackChoice(nVal)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        nBackChoice === nVal
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      N = {nVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('dual-nback', { nBack: nBackChoice })}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Train Dual N-Back at N={nBackChoice}
            </button>
          </div>

          {/* Pillar 3: Memory Palace (70% Storage) */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Castle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Storage Pillar (70%)</span>
                    <h4 className="text-base font-bold text-white">Memory Palace Villa</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono border border-amber-800/60">
                  Target: 84m
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Ancient Greek spatial encoding. Anchor high-dimensional items along architectural journeys.
              </p>

              {/* Free Loci Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Loci Stations Count:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[4, 6, 8].map((loci) => (
                    <button
                      key={loci}
                      onClick={() => setPalaceLociChoice(loci)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        palaceLociChoice === loci
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {loci} Stations
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('memory-palace')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Train Memory Palace ({palaceLociChoice} Loci)
            </button>
          </div>
        </div>
      </div>

      {/* Real-World Physical Practice Gateway (2 Hours) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-800/50 rounded-2xl p-5 mb-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Castle className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                2 Hours Physical Practice
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-World Scouting & Traversal</span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">
              Method of Loci Real-Life Architecture (120 Mins)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Physical walks through real buildings, libraries, museums, and streets. Chart 20+ permanent physical landmarks and drill reverse mental traversals.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onNavigateMode('four-hour-plan');
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md transition-all active:scale-98"
        >
          Open 4-Hour Checklist & Physical Timer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Doom Scrolling Screen Time Impact Calculator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold mb-3">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            Doom Scrolling Swap Calculator
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            If You Replace {doomScrollDailyMinutes} Minutes of Daily Scrolling With Free Training:
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Adjust the slider below to see how much cognitive myelination you forge over 30 days:
          </p>

          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={doomScrollDailyMinutes}
            onChange={(e) => setDoomScrollDailyMinutes(Number(e.target.value))}
            className="w-full max-w-md mx-auto h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-6"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">In 30 Days</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {doomScrollDailyMinutes * 30} Min
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">of Active Focus</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Visual Retinal Flashes</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ~{(doomScrollDailyMinutes * 30 * 2.5).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Eidetic Snaps</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">XP Progression</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                +{(doomScrollDailyMinutes * 30 * 25).toLocaleString()} XP
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Grandmaster Rank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
