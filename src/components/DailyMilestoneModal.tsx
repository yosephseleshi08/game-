import React, { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ProtocolTask } from '../types';
import { sound } from '../utils/audio';
import {
  Trophy,
  CheckCircle2,
  Flame,
  Sparkles,
  Lock,
  Moon,
  ShieldCheck,
  Brain,
  Zap,
  ArrowRight,
  X,
  RefreshCw,
  Award,
  Clock,
} from 'lucide-react';

interface DailyMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumDay: number;
  currentStreak: number;
  tasks: ProtocolTask[];
  isLockedOut: boolean;
  onFinalizeProtocol?: () => void;
  onOpenFreeTraining?: () => void;
}

export const DailyMilestoneModal: React.FC<DailyMilestoneModalProps> = ({
  isOpen,
  onClose,
  curriculumDay,
  currentStreak,
  tasks,
  isLockedOut,
  onFinalizeProtocol,
  onOpenFreeTraining,
}) => {
  const triggerConfettiExplosion = useCallback(() => {
    // Sound fanfare
    sound.playMilestoneFanfare();

    // Central high-density burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#ffffff'],
    });

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.65 },
        colors: ['#10b981', '#34d399', '#06b6d4', '#fbbf24'],
      });
    }, 200);

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.65 },
        colors: ['#6366f1', '#818cf8', '#06b6d4', '#f59e0b'],
      });
    }, 400);

    // Stars floating downward
    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 100,
        shapes: ['star'],
        origin: { y: 0.5 },
        colors: ['#ffd700', '#f59e0b', '#38bdf8', '#34d399'],
        scalar: 1.2,
      });
    }, 600);
  }, []);

  // Trigger automatically when opened
  useEffect(() => {
    if (isOpen) {
      triggerConfettiExplosion();
    }
  }, [isOpen, triggerConfettiExplosion]);

  if (!isOpen) return null;

  // 60-day Curriculum Progress Calculations
  const targetTotalDays = 60;
  const clampedDay = Math.min(curriculumDay, targetTotalDays);
  const progressPercent = Math.min(100, Math.round((curriculumDay / targetTotalDays) * 100));

  // 4 Major Milestones in the 60-Day Habit Transformation
  const MILESTONES = [
    {
      day: 7,
      label: 'Day 7: Synaptic Awakening',
      description: 'Iconic buffer stabilization; Ayumu reaction latency drops by 30%.',
      icon: Zap,
    },
    {
      day: 14,
      label: 'Day 14: Working Memory Double Buffer',
      description: 'DLPFC prefrontal circuits handle simultaneous audio/visual streams effortlessly.',
      icon: Brain,
    },
    {
      day: 30,
      label: 'Day 30: 1-Month Mental Clarity & High Bandwidth',
      description: 'Subconscious peg translation, laser focus under distraction, and 8-digit instant recall.',
      icon: Award,
    },
    {
      day: 60,
      label: 'Day 60: 2-Month Photographic Architecture',
      description: 'Permanent spatial palace memory & automatic photographic mental indexing.',
      icon: Trophy,
    },
  ];

  // Next milestone calculation
  const nextMilestone = MILESTONES.find((m) => m.day > curriculumDay) || MILESTONES[MILESTONES.length - 1];
  const daysUntilNext = Math.max(0, nextMilestone.day - curriculumDay);

  return (
    <div
      id="daily-milestone-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white my-6 max-h-[92vh] overflow-y-auto">
        {/* Glowing background highlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-40 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-daily-milestone-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer z-10"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Triumphant Header with Pulsing Trophy */}
        <div className="text-center relative mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-amber-400/50 text-amber-400 shadow-xl shadow-amber-500/15 mb-3 animate-pulse">
            <Trophy className="w-10 h-10 fill-amber-400/20 text-amber-400" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Daily Milestone Achieved!
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {currentStreak} Day Habit Streak
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Day {curriculumDay} of 60 Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
            All 6 mandatory cognitive disciplines successfully passed today. Your daily neural conditioning quota is complete!
          </p>
        </div>

        {/* 60-Day Habit & Neuroplasticity Roadmap Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                60-Day Transformation Tracker
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              {progressPercent}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 mb-2">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-md shadow-cyan-500/30"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mb-4">
            <span>Day 1: Scaffolding</span>
            <span className="text-emerald-400 font-bold">
              {curriculumDay >= 60 ? 'Day 60 Reached!' : `Day ${clampedDay} of 60`}
            </span>
            <span>Day 60: Mastery</span>
          </div>

          {/* 4 Major Milestones Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MILESTONES.map((m) => {
              const IconComp = m.icon;
              const isPast = curriculumDay >= m.day;
              const isCurrentTarget = !isPast && (m === nextMilestone);

              return (
                <div
                  key={m.day}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                      : isCurrentTarget
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <IconComp
                        className={`w-3.5 h-3.5 ${
                          isPast ? 'text-emerald-400' : isCurrentTarget ? 'text-cyan-400' : 'text-slate-500'
                        }`}
                      />
                      <span className={isPast ? 'text-emerald-300' : isCurrentTarget ? 'text-cyan-300 font-bold' : ''}>
                        {m.label}
                      </span>
                    </div>
                    {isPast ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                        ✓ Mastered
                      </span>
                    ) : isCurrentTarget ? (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                        Next ({daysUntilNext}d left)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Upcoming</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{m.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's 6 Disciplines Mastered */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 6 Mandatory Disciplines Cleared Today
            </span>
            <span className="text-emerald-400 font-bold font-mono">6 / 6 Complete</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl text-left flex items-start gap-2 shadow-sm"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Step {idx + 1}
                  </div>
                  <div className="text-[11px] font-bold text-white truncate">{task.title}</div>
                  <div className="text-[9px] text-slate-400 truncate">{task.discipline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit-Forming Neuroscience Callout */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/40">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-300 text-sm mb-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Consolidation In Progress
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              You have stimulated all primary neural pathways today (visual iconic buffer, DLPFC working memory, and hippocampal spatial anchors). 
              Physical synaptic consolidation happens <strong>tonight during slow-wave sleep</strong>. Repeating this daily for 60 days is what turns conscious effort into automatic photographic recall.
            </p>
          </div>
        </div>

        {/* Milestone Rewards & Bonus */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Daily Quota Bonus</div>
              <div className="text-[10px] text-slate-400">Level progression & leaderboard rank credited</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-mono font-black text-amber-400">+250 XP</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Confetti Replay button */}
          <button
            id="replay-milestone-confetti-btn"
            onClick={triggerConfettiExplosion}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Burst Confetti 🎊
          </button>

          {!isLockedOut && onFinalizeProtocol ? (
            <button
              id="finalize-milestone-protocol-btn"
              onClick={() => {
                onFinalizeProtocol();
                onClose();
              }}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Lock className="w-4 h-4" />
              Lock In Day {curriculumDay} & Begin Recovery (+250 XP)
            </button>
          ) : (
            <button
              id="close-milestone-recovery-btn"
              onClick={onClose}
              className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              Gains Saved! Close & Rest Until 12:00 AM
            </button>
          )}
        </div>

        {/* Free Training Alternative to Doom Scrolling */}
        {onOpenFreeTraining && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              id="milestone-to-free-training-btn"
              onClick={() => {
                onClose();
                onOpenFreeTraining();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Don't Doom Scroll TikTok! Train All Steps Freely in the Brain Gym ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
