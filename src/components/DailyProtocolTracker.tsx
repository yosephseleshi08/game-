import React, { useState, useEffect } from 'react';
import { DailyProtocolState, GameMode, ProtocolTask, MemoryPalaceTimerState } from '../types';
import {
  getTimeUntilNext12AM,
  saveDailyProtocol,
  checkIsDailyProtocolFullyDone,
  addDaysToDateString,
  getLocalDateString,
} from '../utils/protocol';
import { sound } from '../utils/audio';
import { ManualMemoryPalaceTimer } from './ManualMemoryPalaceTimer';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ArrowRight,
  ShieldCheck,
  Brain,
  Zap,
  Sparkles,
  Trophy,
  Castle,
  XCircle,
  AlertCircle,
  Hourglass,
  Layers,
} from 'lucide-react';
import { FlashSpeed } from '../types';

interface DailyProtocolTrackerProps {
  protocol: DailyProtocolState;
  onUpdateProtocol: (updated: DailyProtocolState) => void;
  onNavigateMode: (mode: GameMode) => void;
  onAddXp: (amount: number) => void;
  onOpenRoadmap?: () => void;
  onOpenFlashPlan?: () => void;
  onOpenMilestone?: () => void;
  currentSpeed?: FlashSpeed;
  isSpeedLockedToPlan?: boolean;
  todayGamesBreakdown?: Record<string, number>;
  currentStreak?: number;
}

export const DailyProtocolTracker: React.FC<DailyProtocolTrackerProps> = ({
  protocol,
  onUpdateProtocol,
  onNavigateMode,
  onAddXp,
  onOpenRoadmap,
  onOpenFlashPlan,
  onOpenMilestone,
  currentSpeed,
  isSpeedLockedToPlan,
  todayGamesBreakdown = {},
  currentStreak = 0,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNext12AM());
  const todayStr = getLocalDateString();

  // Countdown loop for 12:00 AM (Midnight) reset timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilNext12AM();
      setTimeLeft(remaining);
      if (remaining.totalSeconds <= 0) {
        // Automatically reload when clock hits 12:00 AM to roll over into next calendar day
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if each discipline has reached its required duration today
  const isPegsDone =
    protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted ||
    (todayGamesBreakdown['mnemonic-pegs'] || 0) >= 1200;

  const isNBackDone =
    protocol.tasks.find((t) => t.id === 'dual-nback')?.isCompleted ||
    (todayGamesBreakdown['dual-nback'] || 0) >= 1200;

  const isDetectiveDone =
    protocol.tasks.find((t) => t.id === 'symbol-detective')?.isCompleted ||
    (todayGamesBreakdown['symbol-detective'] || 0) >= 1200;

  const isMemoryPalaceDone =
    protocol.tasks.find((t) => t.id === 'memory-palace')?.isCompleted ||
    protocol.memoryPalaceTimer?.isCompleted ||
    (todayGamesBreakdown['memory-palace'] || 0) >= 3600;

  const isAllFourDone = Boolean(isPegsDone && isNBackDone && isDetectiveDone && isMemoryPalaceDone);

  const completedTasksCount =
    (isPegsDone ? 1 : 0) +
    (isNBackDone ? 1 : 0) +
    (isDetectiveDone ? 1 : 0) +
    (isMemoryPalaceDone ? 1 : 0);

  const progressPercent = Math.round((completedTasksCount / 4) * 100);

  // Auto-complete day and lock out when all 4 tasks are achieved
  useEffect(() => {
    if (isAllFourDone && !protocol.isLockedOut) {
      sound.playMilestoneFanfare();
      const updated: DailyProtocolState = {
        ...protocol,
        isLockedOut: true,
        completedAt: new Date().toISOString(),
        tasks: protocol.tasks.map((t) => ({ ...t, isCompleted: true })),
        history: {
          ...protocol.history,
          [todayStr]: {
            date: todayStr,
            cycleKey: todayStr,
            curriculumDay: protocol.curriculumDay,
            completed: true,
            failed: false,
            score: 100,
            completedAt: new Date().toISOString(),
            totalSeconds: 7200,
            memoryPalaceCompleted: true,
          },
        },
      };
      onUpdateProtocol(updated);
      saveDailyProtocol(updated);
      onAddXp(350); // Daily completion XP
    }
  }, [isAllFourDone, protocol.isLockedOut]);

  // Handler for memory palace timer update
  const handleUpdateMemoryPalaceTimer = (timer: MemoryPalaceTimerState) => {
    const isPalaceFinished = timer.isCompleted || timer.remainingSeconds <= 0;
    const updatedTasks = protocol.tasks.map((t) => {
      if (t.id === 'memory-palace') {
        return {
          ...t,
          isCompleted: isPalaceFinished,
          currentCount: Math.floor(timer.elapsedSeconds / 60),
          secondsElapsed: timer.elapsedSeconds,
        };
      }
      return t;
    });

    const updatedProtocol: DailyProtocolState = {
      ...protocol,
      memoryPalaceTimer: timer,
      tasks: updatedTasks,
    };
    onUpdateProtocol(updatedProtocol);
    saveDailyProtocol(updatedProtocol);
  };

  const handleFinishPalaceTimer = () => {
    handleUpdateMemoryPalaceTimer({
      remainingSeconds: 0,
      elapsedSeconds: 3600,
      isRunning: false,
      isCompleted: true,
    });
  };

  const formatSecsToMins = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  // Generate 7-day mini calendar strip (last 6 days + today)
  const recentDays = [-6, -5, -4, -3, -2, -1, 0].map((offset) => {
    const dateStr = addDaysToDateString(todayStr, offset);
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = dateObj.getDate();
    const isToday = offset === 0;
    const historyRecord = protocol.history?.[dateStr];

    let status: 'completed' | 'failed' | 'today' | 'upcoming' = 'upcoming';
    if (isToday) {
      status = isAllFourDone ? 'completed' : 'today';
    } else if (historyRecord) {
      status = historyRecord.completed ? 'completed' : 'failed';
    } else {
      // Prior day with no completed record is failed
      status = 'failed';
    }

    return {
      dateStr,
      dayLabel,
      dayNum,
      isToday,
      status,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Protocol Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 365-Day Real Calendar Training
              </span>
              <span className="text-xs text-cyan-300 font-mono font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              Yosi's Day {protocol.curriculumDay} Protocol
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Exclusively designed for Yoseph: <strong className="text-cyan-300">1 Hour 3-Game Practice (20m each)</strong> + <strong className="text-amber-300">1 Hour Manual Memory Palace Focus</strong> = 2 Hours Total.
              Each game strictly locks for tomorrow once 20 minutes is reached.
            </p>
          </div>

          {/* 12 AM Reset Countdown Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col items-center min-w-[170px] shadow-inner">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              12:00 AM Midnight Reset
            </span>
            <div className="text-xl font-mono font-black text-cyan-400 tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 font-medium">
              {protocol.isLockedOut ? 'Locked until 12:00 AM' : 'Daily deadline resets at midnight'}
            </span>
          </div>
        </div>

        {/* Real Calendar 7-Day Streak & History Strip */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-xs font-bold text-white">
                Active Calendar Streak: <span className="text-amber-300 font-mono font-black">{currentStreak} Days</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Green = Done</span>
              <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> Red = Missed</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {recentDays.map((day) => (
              <div
                key={day.dateStr}
                className={`p-2 rounded-xl border text-center transition-all ${
                  day.isToday
                    ? day.status === 'completed'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40'
                      : 'bg-amber-500/10 border-amber-500/60 text-amber-200 ring-2 ring-amber-500/30 animate-pulse'
                    : day.status === 'completed'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-600/40 text-rose-300'
                }`}
              >
                <span className="text-[10px] block uppercase font-mono font-bold opacity-80">
                  {day.dayLabel}
                </span>
                <span className="text-xs font-black block my-0.5">
                  {day.dayNum}
                </span>
                <span className="text-[9px] font-bold block">
                  {day.status === 'completed' ? (
                    <span className="text-emerald-400">PASSED</span>
                  ) : day.isToday ? (
                    <span className="text-amber-300">TODAY</span>
                  ) : (
                    <span className="text-rose-400">FAILED</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 mb-2">
          <div
            className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>
            {completedTasksCount} of 4 Mandatory Daily Pillars Completed ({progressPercent}%)
          </span>
          <span className={isAllFourDone ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-bold flex items-center gap-1'}>
            {isAllFourDone ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Day {protocol.curriculumDay} Mastered (Banked as Green Day)
              </>
            ) : (
              <>
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
                All 4 Pillars Required Before Midnight
              </>
            )}
          </span>
        </div>
      </div>

      {/* Lockout Screen when all 4 tasks are complete */}
      {protocol.isLockedOut && (
        <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl mb-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-xl shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" /> Day {protocol.curriculumDay} Protocol Fully Banked
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            2 Hours Complete — Mastered & Locked for Tomorrow!
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-5 leading-relaxed">
            You completed all 3 games (20 min each) AND your 1-Hour manual memory palace training. This day is officially recorded as <strong className="text-emerald-400 font-bold">GREEN (Mastered)</strong> in your telemetry history.
            Your next protocol opens automatically at <strong className="text-cyan-300">12:00 AM Midnight</strong>.
          </p>
          <button
            onClick={() => onNavigateMode('stats')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
          >
            Inspect Yoseph's Personal Telemetry →
          </button>
        </div>
      )}

      {/* PART 1: 1-HOUR 3-GAME PRACTICE (20 MIN EACH) */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Part 1: 1-Hour Interactive Games (3 × 20 Min)
            </h3>
            <p className="text-xs text-slate-400">
              Each discipline strictly locks for tomorrow once you achieve its 20-minute daily practice
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800">
            Target: 60m Total
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {/* Game 1: Mnemonic Pegs */}
          {(() => {
            const playedSecs = todayGamesBreakdown['mnemonic-pegs'] || 0;
            const isLocked = playedSecs >= 1200 || isPegsDone;
            const remaining = Math.max(0, 1200 - playedSecs);
            return (
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-slate-900/80 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isLocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Discipline 1 (20 Min)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          Number-to-Image Data Keys
                        </span>
                        {isLocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-700">
                            🔒 Locked for Tomorrow
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Mnemonic Major Pegs
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Phonetic peg conversion drills translating 2-digit numbers into instant multi-sensory mental objects.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${isLocked ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min(100, Math.round((playedSecs / 1200) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 font-bold">
                          {formatSecsToMins(playedSecs)} / 20m ({Math.min(100, Math.round((playedSecs / 1200) * 100))}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {isLocked ? (
                      <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('mnemonic-pegs');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Start 20m Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Game 2: Dual N-Back Buffer */}
          {(() => {
            const playedSecs = todayGamesBreakdown['dual-nback'] || 0;
            const isLocked = playedSecs >= 1200 || isNBackDone;
            const remaining = Math.max(0, 1200 - playedSecs);
            return (
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-slate-900/80 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isLocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Discipline 2 (20 Min)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          Working Memory RAM & Speech Focus
                        </span>
                        {isLocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-700">
                            🔒 Locked for Tomorrow
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Dual N-Back Buffer
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Simultaneous spatial and auditory working memory buffering expanding DLPFC RAM capacity.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${isLocked ? 'bg-emerald-400' : 'bg-sky-400'}`}
                            style={{ width: `${Math.min(100, Math.round((playedSecs / 1200) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 font-bold">
                          {formatSecsToMins(playedSecs)} / 20m ({Math.min(100, Math.round((playedSecs / 1200) * 100))}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {isLocked ? (
                      <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('dual-nback');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Start 20m Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Game 3: Symbol Detective Lab */}
          {(() => {
            const playedSecs = todayGamesBreakdown['symbol-detective'] || 0;
            const isLocked = playedSecs >= 1200 || isDetectiveDone;
            const remaining = Math.max(0, 1200 - playedSecs);
            return (
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-slate-900/80 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isLocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Discipline 3 (20 Min)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          Symbol Processing & Script Speed
                        </span>
                        {isLocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-700">
                            🔒 Locked for Tomorrow
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Symbol Detective Lab
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        High-speed abstract symbol discrimination and feature binding training occipital shutter velocity.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${isLocked ? 'bg-emerald-400' : 'bg-purple-400'}`}
                            style={{ width: `${Math.min(100, Math.round((playedSecs / 1200) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 font-bold">
                          {formatSecsToMins(playedSecs)} / 20m ({Math.min(100, Math.round((playedSecs / 1200) * 100))}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {isLocked ? (
                      <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('symbol-detective');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-black text-xs transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Start 20m Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* PART 2: 1-HOUR MANUAL MEMORY PALACE OFFLINE TRAINING */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Castle className="w-4 h-4 text-amber-400" />
              Part 2: 1-Hour Manual Memory Palace Practice
            </h3>
            <p className="text-xs text-slate-400">
              Sit down by yourself and traverse your loci manually with this 60-minute focus countdown timer
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-800">
            Mandatory for Streak
          </span>
        </div>

        <ManualMemoryPalaceTimer
          timerState={protocol.memoryPalaceTimer}
          onUpdateTimer={handleUpdateMemoryPalaceTimer}
          onComplete={handleFinishPalaceTimer}
          onAddXp={onAddXp}
          curriculumDay={protocol.curriculumDay}
        />
      </div>

      {/* Daily Goal Policy Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200 block mb-0.5 font-bold">Strict Daily Goal Policy:</strong>
          Without completing both the 1-Hour 3-game practice AND the 1-Hour Memory Palace manual countdown, your daily protocol does not complete. Incomplete days are marked as <span className="text-rose-400 font-bold">RED (Failed)</span> and reset your active streak. The calendar always advances with each passing day.
        </div>
      </div>
    </div>
  );
};
