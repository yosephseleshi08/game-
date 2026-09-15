import React from 'react';
import { FlashSpeed } from '../types';
import { FLASH_TIME_PLAN_PHASES, getFlashPlanForDay, getPlanSpeedForDay } from '../utils/flashPlan';
import { sound } from '../utils/audio';
import {
  X,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  Brain,
  Zap,
  Target,
  ShieldCheck,
  Flame,
  Award,
  Calendar,
  Sparkles,
  Eye,
} from 'lucide-react';

interface FlashTimePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
  currentSpeed: FlashSpeed;
  isSpeedLockedToPlan: boolean;
  onToggleLockToPlan: (locked: boolean) => void;
  onSetSpeed: (speed: FlashSpeed) => void;
}

export const FlashTimePlanModal: React.FC<FlashTimePlanModalProps> = ({
  isOpen,
  onClose,
  currentDay,
  currentSpeed,
  isSpeedLockedToPlan,
  onToggleLockToPlan,
  onSetSpeed,
}) => {
  if (!isOpen) return null;

  const currentPlanPhase = getFlashPlanForDay(currentDay);
  const recommendedSpeed = getPlanSpeedForDay(currentDay);

  const handleEnforceCurrentDayPlan = () => {
    sound.playLevelUp();
    onSetSpeed(recommendedSpeed);
    onToggleLockToPlan(true);
  };

  const handleManualLockToggle = () => {
    sound.playClick();
    if (!isSpeedLockedToPlan) {
      onSetSpeed(recommendedSpeed);
      onToggleLockToPlan(true);
    } else {
      onToggleLockToPlan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                365-Day Flash Time Masterplan
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Scientific Calibration
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Systematic millisecond exposure protocol engineered for true retinal iconic trace formation.
            </p>
          </div>
        </div>

        {/* Current Day Status & Quick Lock Hero Card */}
        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Day {currentDay} of 365
                </span>
                <span className="text-[11px] text-slate-400">• {currentPlanPhase.phaseName}</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Prescribed Speed: <span className="text-cyan-300">{currentPlanPhase.speedLabel}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                {currentPlanPhase.scientificGoal}
              </p>
            </div>

            {/* Lock Control Action */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleEnforceCurrentDayPlan}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isSpeedLockedToPlan && currentSpeed === recommendedSpeed
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
                }`}
              >
                {isSpeedLockedToPlan && currentSpeed === recommendedSpeed ? (
                  <>
                    <Lock className="w-4 h-4" /> Locked to Day {currentDay} ({recommendedSpeed}ms)
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Lock In Day {currentDay} ({recommendedSpeed}ms)
                  </>
                )}
              </button>

              <button
                onClick={handleManualLockToggle}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isSpeedLockedToPlan ? (
                  <>
                    <Unlock className="w-3 h-3 text-amber-400" /> Unlock for free play
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-500" /> Enable strict plan locking
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active status indicator */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              Current Game Speed: <strong className="text-white font-mono">{currentSpeed}ms</strong>
              {isSpeedLockedToPlan ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  🔒 Locked to Curriculum
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Manual Setting
                </span>
              )}
            </span>
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Locked training yields up to 4.0x XP multiplier
            </span>
          </div>
        </div>

        {/* The 5 Phases Timeline */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> The 365-Day Millisecond Calibration Progression
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {FLASH_TIME_PLAN_PHASES.map((phase) => {
              const isCurrentPhase = currentDay >= phase.minDay && currentDay <= phase.maxDay;
              const isPassed = currentDay > phase.maxDay;

              return (
                <div
                  key={phase.phase}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrentPhase
                      ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                      : isPassed
                      ? 'bg-slate-900/50 border-slate-800 opacity-80'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          isCurrentPhase
                            ? 'bg-cyan-500 text-slate-950'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {phase.phase}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{phase.phaseName}</span>
                          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                            {phase.daysRange}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{phase.title}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white block">
                          {phase.speedLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">{phase.tag}</span>
                      </div>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onSetSpeed(phase.targetSpeedMs);
                          onToggleLockToPlan(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          currentSpeed === phase.targetSpeedMs && isSpeedLockedToPlan
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                      >
                        {currentSpeed === phase.targetSpeedMs && isSpeedLockedToPlan
                          ? 'Locked'
                          : 'Lock Speed'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{phase.scientificGoal}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                    <div className="text-slate-400">
                      <strong className="text-slate-300">Neurological Focus:</strong> {phase.neuroFocus}
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-slate-300">Ayumu Target:</strong> {phase.ayumuExpectation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Millisecond Training Works */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs leading-relaxed">
          <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-indigo-400" /> The Neurobiology of Flash Memory Thresholds
          </h4>
          <p>
            When visual stimuli exceed 800ms, the human brain default-routes information into the phonological loop (internal vocal reading). By progressively stepping down exposure through this 365-day plan to sub-200ms levels, inner speech is bypassed and the visual cortex is forced to store high-density iconic phosphor traces.
          </p>
        </div>
      </div>
    </div>
  );
};
