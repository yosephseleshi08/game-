import React, { useState, useEffect } from 'react';
import { DailyProtocolState, GameMode, ProtocolTask } from '../types';
import { getTimeUntilNext12AM, saveDailyProtocol, generateTasksForDay } from '../utils/protocol';
import { sound } from '../utils/audio';
import { DailyMilestoneModal } from './DailyMilestoneModal';
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
  RotateCcw,
  Sparkles,
  Info,
  Trophy,
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
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNext12AM());
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Countdown loop for 12:00 AM (Midnight) reset timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilNext12AM();
      setTimeLeft(remaining);
      if (remaining.totalSeconds <= 0 && protocol.isLockedOut) {
        // Automatically unlock when clock hits 12:00 AM!
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [protocol.isLockedOut]);

  const completedTasksCount = protocol.tasks.filter((t) => t.isCompleted).length;
  const progressPercent = Math.round((completedTasksCount / protocol.tasks.length) * 100);
  const isFullyComplete = completedTasksCount === protocol.tasks.length;

  // Complete protocol and trigger lockout
  const handleFinalizeDailyProtocol = () => {
    if (!isFullyComplete || protocol.isLockedOut) return;
    sound.playMilestoneFanfare();
    const updated: DailyProtocolState = {
      ...protocol,
      isLockedOut: true,
      completedAt: new Date().toISOString(),
      history: {
        ...protocol.history,
        [protocol.currentCycleDate]: {
          completed: true,
          score: 100,
          completedAt: new Date().toISOString(),
        },
      },
    };
    onUpdateProtocol(updated);
    saveDailyProtocol(updated);
    onAddXp(250); // Big daily protocol bonus
    if (onOpenMilestone) {
      onOpenMilestone();
    } else {
      setIsMilestoneModalOpen(true);
    }
  };

  // Reset today's unfinalized progress if user wants to start today's regimen from scratch
  const handleResetTodayTasks = () => {
    if (protocol.isLockedOut) return;
    sound.playClick();
    const freshTasks = generateTasksForDay(protocol.curriculumDay);
    const updated: DailyProtocolState = {
      ...protocol,
      tasks: freshTasks,
    };
    onUpdateProtocol(updated);
    saveDailyProtocol(updated);
  };

  // Phase Title Map
  const PHASE_NAMES: Record<number, string> = {
    1: 'Phase 1: Neural Scaffolding (Days 1–30)',
    2: 'Phase 2: The Subconscious Shift (Days 31–90)',
    3: 'Phase 3: High-Density Encoding (Days 91–180)',
    4: 'Phase 4: Cognitive Mastery (Days 181–365)',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Banner with Curriculum Day & 12 AM Reset Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 365-Day Cognitive Masterplan
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {PHASE_NAMES[protocol.currentPhase] || 'Neural Training'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              Day {protocol.curriculumDay} of 365 Protocol
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Automated daily mental regimen. Complete today's quota to trigger the anti-burnout lockout.
              Your next level unlocks cleanly at <strong className="text-emerald-300">12:00 AM (Midnight)</strong> daily.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                id="protocol-to-four-hour-plan-btn"
                onClick={() => {
                  sound.playClick();
                  onNavigateMode('four-hour-plan');
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                4-Hour Master Plan Checklist
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-mono">
                  240m Daily
                </span>
              </button>

              {onOpenFlashPlan && (
                <button
                  onClick={onOpenFlashPlan}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Flash Time Plan & Lock
                  {currentSpeed && (
                    <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-200 font-mono">
                      {isSpeedLockedToPlan ? `🔒 ${currentSpeed}ms Locked` : `${currentSpeed}ms`}
                    </span>
                  )}
                </button>
              )}

              {onOpenRoadmap && (
                <button
                  onClick={onOpenRoadmap}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  View 365-Day Genius Roadmap
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                    Top 0.1%
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 12 AM Reset Countdown Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col items-center min-w-[170px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Next 12:00 AM Reset
            </span>
            <div className="text-xl font-mono font-black text-cyan-400 tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">
              {protocol.isLockedOut ? 'Locked until 12:00 AM' : 'Unlocks new day at 12 AM'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-2">
          <div
            className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>
            {completedTasksCount} of {protocol.tasks.length} Disciplines Met ({progressPercent}%)
          </span>
          <span className={protocol.isLockedOut ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-emerald-400 font-bold flex items-center gap-1'}>
            {protocol.isLockedOut ? (
              <>
                <Lock className="w-3.5 h-3.5" /> Quota Completed & Locked
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" /> Active Daily Session
              </>
            )}
          </span>
        </div>
      </div>

      {/* LOCKOUT STATE SCREEN (Shown when user has finished today's daily protocol) */}
      {protocol.isLockedOut ? (
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl mb-8 relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-xl shadow-emerald-500/10 animate-pulse">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" /> Anti-Burnout Lockout Engaged
          </div>

          <h3 className="text-2xl font-black text-white mb-2">
            Day {protocol.curriculumDay} Protocol Fully Mastered!
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Your brain has completed its deliberate practice quota. In cognitive science, neuroplastic consolidation occurs during sleep and recovery—playing past this point produces diminishing returns.
          </p>

          {/* Countdown Clock Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 max-w-sm mx-auto mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Day {protocol.curriculumDay + 1} Unlocks In
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-wider">
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Guaranteed exact unlock: Tomorrow at 12:00 AM (Midnight)
            </span>
          </div>

          {/* Accomplished Today Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6">
            {protocol.tasks.map((task, idx) => (
              <div key={task.id} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-left">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pillar {idx + 1}</span>
                </div>
                <p className="text-[11px] text-slate-200 font-semibold truncate">{task.title}</p>
                <p className="text-[9px] text-slate-400 truncate">{task.discipline}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Enjoy your day knowing you made permanent progress toward photographic recall and working memory mastery!
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              id="goto-free-training-from-protocol-btn"
              onClick={() => onNavigateMode('free-training')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Have Free Time? Train All Steps Freely (Brain Gym)
            </button>

            <button
              id="view-locked-milestone-btn"
              onClick={() => {
                if (onOpenMilestone) onOpenMilestone();
                else setIsMilestoneModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Day {protocol.curriculumDay} Milestone & 60-Day Map 🎊
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE DAILY PROTOCOL CHECKLIST */
        <div className="space-y-4 mb-8">
          {/* Integrity & anti-cheat callout */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong className="font-bold text-white">Tamper-Proof Progression:</strong> Steps cannot be manually clicked off. Each step is automatically verified and marked complete only when you achieve the required score in its dedicated lab!
              </span>
            </div>
            <span className="shrink-0 bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-emerald-500/40">
              Lab-Verified
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Today's Prescribed Quota (3 Core Pillars)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete each lab below to unlock Day {protocol.curriculumDay} milestone & anti-burnout lockout
              </p>
            </div>
            {!protocol.isLockedOut && completedTasksCount > 0 && (
              <button
                onClick={handleResetTodayTasks}
                title="Reset today's in-progress tasks to start today's protocol fresh"
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-500/40 bg-slate-950/80 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Today's Progress
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {protocol.tasks.map((task, idx) => (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 opacity-90'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Tamper-proof Step Indicator (Navigates to lab on click if not completed) */}
                  <button
                    type="button"
                    onClick={() => onNavigateMode(task.gameMode)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      task.isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'border-2 border-slate-700 bg-slate-950/80 text-slate-400 hover:border-cyan-400 hover:text-cyan-300'
                    }`}
                    title={
                      task.isCompleted
                        ? 'Verified Complete: Quota achieved in training lab'
                        : `Step ${idx + 1}: Click to launch ${task.title}`
                    }
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    ) : (
                      <span className="font-mono text-xs font-black">{idx + 1}</span>
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Step {idx + 1}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {task.discipline}
                      </span>
                      {task.isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Cleared in Lab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                          Must be earned in Lab
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm sm:text-base font-bold ${task.isCompleted ? 'text-slate-300' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.targetDescription}
                    </p>
                    {task.targetCount > 1 && !task.isCompleted && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-28 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.round((task.currentCount / task.targetCount) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">
                          {task.currentCount} / {task.targetCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onNavigateMode(task.gameMode)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer ${
                      task.isCompleted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
                        : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20'
                    }`}
                  >
                    {task.isCompleted ? (
                      <>Replay Lab <ArrowRight className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Launch Lab <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action to complete day */}
          {isFullyComplete && (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <Trophy className="w-5 h-5 fill-emerald-400/20" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Day {protocol.curriculumDay} All 3 Core Pillars Mastered!
                    </div>
                    <div className="text-xs text-slate-300">
                      Your Daily Milestone celebration is ready with +250 XP bonus.
                    </div>
                  </div>
                </div>
                <button
                  id="open-milestone-preview-btn"
                  onClick={() => {
                    if (onOpenMilestone) onOpenMilestone();
                    else setIsMilestoneModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Celebrate Milestone 🎉
                </button>
              </div>

              <button
                id="finalize-protocol-lockout-btn"
                onClick={handleFinalizeDailyProtocol}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-98 animate-bounce-short cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Complete Day {protocol.curriculumDay} Protocol & Lock In Gains (+250 XP)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 365-Day Streak & RoadMap Heatmap preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Yearly Protocol Consistency
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {Object.keys(protocol.history).length} Days Mastered
          </span>
        </div>

        {/* 30-Day Mini Heatmap Grid */}
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 mb-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const dayNum = i + 1;
            const isDone = dayNum < protocol.curriculumDay || (dayNum === protocol.curriculumDay && protocol.isLockedOut);
            const isToday = dayNum === protocol.curriculumDay;

            return (
              <div
                key={dayNum}
                title={`Day ${dayNum}`}
                className={`h-6 rounded-md flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : isToday
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 animate-pulse'
                    : 'bg-slate-950 text-slate-600 border border-slate-800/60'
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Day 1 (Neural Scaffolding)</span>
          <span>Day 30 (Subconscious Automation)</span>
        </div>
      </div>

      {/* Daily Milestone Celebration Modal with Confetti */}
      <DailyMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        curriculumDay={protocol.curriculumDay}
        currentStreak={protocol.curriculumDay}
        tasks={protocol.tasks}
        isLockedOut={protocol.isLockedOut}
        onFinalizeProtocol={handleFinalizeDailyProtocol}
      />
    </div>
  );
};
