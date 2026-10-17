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

  // Exact seconds trained per discipline today:
  const pegsSecs = Math.max(
    protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.secondsElapsed || 0,
    todayGamesBreakdown['mnemonic-pegs'] || 0
  );
  const nbackSecs = Math.max(
    protocol.tasks.find((t) => t.id === 'dual-nback')?.secondsElapsed || 0,
    todayGamesBreakdown['dual-nback'] || 0
  );
  const detectiveSecs = Math.max(
    protocol.tasks.find((t) => t.id === 'symbol-detective')?.secondsElapsed || 0,
    todayGamesBreakdown['symbol-detective'] || 0
  );

  // Check if each discipline has reached its required duration today
  const isPegsDone =
    protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted ||
    pegsSecs >= 1200;

  const isNBackDone =
    protocol.tasks.find((t) => t.id === 'dual-nback')?.isCompleted ||
    nbackSecs >= 1200;

  const isDetectiveDone =
    protocol.tasks.find((t) => t.id === 'symbol-detective')?.isCompleted ||
    detectiveSecs >= 1200;

  const isMemoryPalaceDone =
    protocol.tasks.find((t) => t.id === 'memory-palace')?.isCompleted ||
    protocol.memoryPalaceTimer?.isCompleted ||
    (protocol.memoryPalaceTimer?.elapsedSeconds || 0) >= 3600 ||
    (todayGamesBreakdown['memory-palace'] || 0) >= 3600;

  const isAllThreeGamesDone = Boolean(isPegsDone && isNBackDone && isDetectiveDone);

  const completedTasksCount =
    (isPegsDone ? 1 : 0) +
    (isNBackDone ? 1 : 0) +
    (isDetectiveDone ? 1 : 0);

  // Continuous percentage based on actual seconds trained (user preference)
  const totalCoreTrainedSeconds =
    Math.min(1200, pegsSecs) +
    Math.min(1200, nbackSecs) +
    Math.min(1200, detectiveSecs);

  let allTrainingSeconds = 0;
  for (const key of Object.keys(todayGamesBreakdown)) {
    allTrainingSeconds += Number(todayGamesBreakdown[key]) || 0;
  }

  // Either core disciplines or any interactive games trained today
  const displaySeconds = Math.max(totalCoreTrainedSeconds, Math.min(3600, allTrainingSeconds));
  // 3 disciplines x 20 min = 60 min = 3600s quota
  const progressPercent = Math.min(100, Math.round((displaySeconds / 3600) * 100));

  // Auto-complete day and lock out when all 3 primary 20-minute games are achieved
  useEffect(() => {
    if (isAllThreeGamesDone && !protocol.isLockedOut) {
      sound.playMilestoneFanfare();
      const updated: DailyProtocolState = {
        ...protocol,
        isLockedOut: true,
        completedAt: new Date().toISOString(),
        tasks: protocol.tasks.map((t) =>
          t.id !== 'memory-palace' ? { ...t, isCompleted: true } : t
        ),
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
            totalSeconds: 3600,
            memoryPalaceCompleted: Boolean(isMemoryPalaceDone),
          },
        },
      };
      onUpdateProtocol(updated);
      saveDailyProtocol(updated);
      onAddXp(350); // Daily completion XP for completing the 1-hour 3-game protocol
    }
  }, [isAllThreeGamesDone, protocol.isLockedOut]);

  // Handler for memory palace timer update
  const handleUpdateMemoryPalaceTimer = (timer: MemoryPalaceTimerState) => {
    // Safeguard: If another device has already accumulated elapsed seconds (e.g. 15 minutes on PC),
    // do not allow a passive non-running 0-elapsed update to wipe it out.
    const currentRecorded = protocol.memoryPalaceTimer?.elapsedSeconds || 0;
    if (!timer.isRunning && timer.elapsedSeconds < currentRecorded && timer.elapsedSeconds === 0 && !timer.isCompleted) {
      return;
    }

    const isPalaceFinished = timer.isCompleted || timer.remainingSeconds <= 0 || timer.elapsedSeconds >= 3600;
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
      status = (isAllThreeGamesDone || protocol.isLockedOut) ? 'completed' : 'today';
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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-24">
      {/* Top Protocol Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 mb-4 sm:mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> 365 Calendar
              </span>
              <span className="text-[10px] sm:text-xs text-cyan-300 font-mono font-bold bg-cyan-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2 truncate">
              Yosi's Day {protocol.curriculumDay} Protocol
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 sm:mt-1 max-w-xl leading-relaxed">
              Exclusively designed for Yoseph: <strong className="text-cyan-300 font-bold">1h 3-Game Practice</strong> (20m each) + <strong className="text-amber-300 font-bold">1h Memory Palace Focus</strong> = 2 Hours Total.
            </p>
          </div>

          {/* 12 AM Reset Countdown Card */}
          <div className="bg-slate-950/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-auto sm:min-w-[150px] shadow-inner shrink-0 gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Midnight Reset
            </span>
            <div className="text-base sm:text-lg font-mono font-black text-cyan-400 tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-slate-500 font-medium hidden sm:block">
              {protocol.isLockedOut ? 'Locked until 12 AM' : 'Resets at 12:00 AM'}
            </span>
          </div>
        </div>

        {/* Real Calendar 7-Day Streak & History Strip */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3.5 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="text-xs font-bold text-white">
                Active Streak: <span className="text-amber-300 font-mono font-black">{currentStreak} Days</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Done</span>
              <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> Missed</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {recentDays.map((day) => (
              <div
                key={day.dateStr}
                className={`p-1 sm:p-2 rounded-xl border text-center transition-all min-w-0 ${
                  day.isToday
                    ? day.status === 'completed'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40'
                      : 'bg-amber-500/10 border-amber-500/60 text-amber-200 ring-2 ring-amber-500/30 animate-pulse'
                    : day.status === 'completed'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-600/40 text-rose-300'
                }`}
              >
                <span className="text-[8px] sm:text-[10px] block uppercase font-mono font-bold opacity-80 truncate">
                  {day.dayLabel}
                </span>
                <span className="text-[11px] sm:text-xs font-black block my-0.5">
                  {day.dayNum}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold block truncate">
                  {day.status === 'completed' ? (
                    <span className="text-emerald-400">PASSED</span>
                  ) : day.isToday ? (
                    <span className="text-amber-300">TODAY</span>
                  ) : (
                    <span className="text-rose-400">MISSED</span>
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
            {formatSecsToMins(displaySeconds)} of 60m Trained ({progressPercent}%) • {completedTasksCount} of 3 Mastered
          </span>
          <span className={(isAllThreeGamesDone || protocol.isLockedOut) ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-bold flex items-center gap-1'}>
            {(isAllThreeGamesDone || protocol.isLockedOut) ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Day {protocol.curriculumDay} Mastered (Banked as Green Day)
              </>
            ) : (
              <>
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
                Live Training Active ({formatSecsToMins(displaySeconds)} / 60m)
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
            const playedSecs = pegsSecs;
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
                          {!isLocked && playedSecs > 0 && (
                            <span className="text-amber-300 ml-1.5">• {formatSecsToMins(remaining)} remaining</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto self-stretch sm:self-center shrink-0 mt-2 sm:mt-0">
                    {isLocked ? (
                      <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('mnemonic-pegs');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>{playedSecs > 0 ? `Resume (${Math.ceil(remaining / 60)}m left)` : 'Start 20m Session'}</span>
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
            const playedSecs = nbackSecs;
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
                          {!isLocked && playedSecs > 0 && (
                            <span className="text-sky-300 ml-1.5">• {formatSecsToMins(remaining)} remaining</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto self-stretch sm:self-center shrink-0 mt-2 sm:mt-0">
                    {isLocked ? (
                      <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('dual-nback');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>{playedSecs > 0 ? `Resume (${Math.ceil(remaining / 60)}m left)` : 'Start 20m Session'}</span>
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
            const playedSecs = detectiveSecs;
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
                          {!isLocked && playedSecs > 0 && (
                            <span className="text-purple-300 ml-1.5">• {formatSecsToMins(remaining)} remaining</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto self-stretch sm:self-center shrink-0 mt-2 sm:mt-0">
                    {isLocked ? (
                      <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Completed & Locked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigateMode('symbol-detective');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-black text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>{playedSecs > 0 ? `Resume (${Math.ceil(remaining / 60)}m left)` : 'Start 20m Session'}</span>
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

      {/* PART 2: DEDICATED BONUS IMMERSION - 1-HOUR MEMORY PALACE */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Castle className="w-4 h-4 text-amber-400" />
              Bonus Immersion: 1-Hour Manual Memory Palace Practice
            </h3>
            <p className="text-xs text-slate-400">
              Sit down by yourself and traverse your loci manually with this 60-minute focus countdown timer (Optional Bonus Training)
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-800">
            Bonus (+500 XP)
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
        <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200 block mb-0.5 font-bold">Yoseph's Daily Goal Policy:</strong>
          Completing the 3 interactive games (20 minutes each = 60 minutes total) satisfies your primary daily training protocol and advances your green streak. The 1-Hour Memory Palace practice serves as a separate bonus training module with independent rewards (+500 Bonus XP).
        </div>
      </div>
    </div>
  );
};
