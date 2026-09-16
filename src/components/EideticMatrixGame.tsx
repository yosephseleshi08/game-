import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FlashSpeed, GameMode } from '../types';
import { sound } from '../utils/audio';
import { FLASH_SPEED_OPTIONS } from '../utils/storage';
import { getMaxMatrixLevelForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import {
  Play,
  RotateCcw,
  Zap,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  Lock,
} from 'lucide-react';

interface EideticMatrixGameProps {
  currentSpeed: FlashSpeed;
  curriculumDay: number;
  isLockedOut?: boolean;
  onSpeedChange: (speed: FlashSpeed) => void;
  onAddXp: (amount: number) => void;
  onRecordResult: (isSuccess: boolean, level: number) => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
}

type Stage = 'idle' | 'countdown' | 'flashing' | 'recalling' | 'success' | 'failure';

interface MatrixConfig {
  size: number;
  targetsCount: number;
}

function getConfigForLevel(level: number): MatrixConfig {
  if (level <= 2) return { size: 3, targetsCount: 3 };
  if (level <= 4) return { size: 3, targetsCount: 4 };
  if (level <= 6) return { size: 4, targetsCount: 5 };
  if (level <= 8) return { size: 4, targetsCount: 6 };
  if (level <= 10) return { size: 5, targetsCount: 7 };
  if (level <= 12) return { size: 5, targetsCount: 8 };
  if (level <= 14) return { size: 5, targetsCount: 9 };
  return { size: 6, targetsCount: 10 + Math.min(5, level - 15) };
}

export const EideticMatrixGame: React.FC<EideticMatrixGameProps> = ({
  currentSpeed,
  curriculumDay,
  isLockedOut = false,
  onSpeedChange,
  onAddXp,
  onRecordResult,
  onNavigateMode,
  isTaskCompleteToday = false,
}) => {
  const dayLimit = getMaxMatrixLevelForDay(curriculumDay);

  if (isLockedOut) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Eidetic Matrix Recall"
        onNavigateMode={onNavigateMode}
      />
    );
  }

  const [level, setLevel] = useState(1);
  const [stage, setStage] = useState<Stage>('idle');
  const [countdown, setCountdown] = useState(3);
  const [targetCells, setTargetCells] = useState<Set<number>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [isShutterActive, setIsShutterActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const config = useMemo(() => getConfigForLevel(level), [level]);
  const totalCells = config.size * config.size;

  const currentOption = FLASH_SPEED_OPTIONS.find((o) => o.value === currentSpeed) || FLASH_SPEED_OPTIONS[1];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const generateTargets = () => {
    const targets = new Set<number>();
    while (targets.size < config.targetsCount) {
      const idx = Math.floor(Math.random() * totalCells);
      targets.add(idx);
    }
    return targets;
  };

  const startRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const newTargets = generateTargets();
    setTargetCells(newTargets);
    setSelectedCells(new Set());
    setWrongCell(null);
    setStage('countdown');
    setCountdown(3);
    sound.playTick();

    // 3, 2, 1 countdown
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else {
        clearInterval(interval);
        triggerFlash();
      }
    }, 600);
  };

  const triggerFlash = () => {
    setStage('flashing');
    setIsShutterActive(true);
    sound.playFlash();

    // Shutter flare animation duration
    setTimeout(() => {
      setIsShutterActive(false);
    }, 120);

    // Keep targets visible for flash duration
    timerRef.current = setTimeout(() => {
      setStage('recalling');
    }, currentSpeed);
  };

  const handleCellClick = (index: number) => {
    if (stage !== 'recalling') return;
    if (selectedCells.has(index)) return;

    sound.playClick();

    if (targetCells.has(index)) {
      const nextSelected = new Set(selectedCells);
      nextSelected.add(index);
      setSelectedCells(nextSelected);

      // Check win condition
      if (nextSelected.size === targetCells.size) {
        sound.playSuccess();
        const baseEarned = 35 + config.targetsCount * 5;
        const totalXp = Math.round(baseEarned * currentOption.xpMultiplier);
        onAddXp(totalXp);
        setStreak((prev) => prev + 1);
        onRecordResult(true, level);
        setStage('success');
      }
    } else {
      // Wrong cell clicked
      sound.playError();
      setWrongCell(index);
      setStreak(0);
      onRecordResult(false, level);
      setStage('failure');
    }
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
    startRound();
  };

  const retryRound = () => {
    startRound();
  };

  const repeatPatternView = () => {
    triggerFlash();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Game Header / Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden backdrop-blur">
        {/* Shutter Visual Flare */}
        {isShutterActive && (
          <div className="absolute inset-0 bg-cyan-200/40 z-50 pointer-events-none animate-ping" />
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                Step 1 of 6 • Spatial Flash
              </span>
              <span className="text-xs text-slate-400">
                Level <strong className="text-white">{level}</strong>
              </span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                Day {curriculumDay} Max: Level {dayLimit.maxLevel}
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-800/60">
                Unlimited Attempts
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Eidetic Matrix Recall
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Snapshot <strong className="text-cyan-300">{config.targetsCount}</strong> glowing tiles in the {config.size}x{config.size} matrix after the flash.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Targets Remaining Indicator */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-xs text-slate-400">Remaining</div>
              <div className="text-lg font-black text-cyan-300">
                {stage === 'recalling'
                  ? config.targetsCount - selectedCells.size
                  : config.targetsCount}
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-xl text-center min-w-[90px]">
              <div className="text-xs text-slate-400">Streak</div>
              <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />
                {streak}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex flex-col items-center justify-center">
        {/* Shutter Canvas / Interactive Grid */}
        <div className="relative p-6 bg-slate-900 border border-slate-800/90 rounded-3xl shadow-2xl flex flex-col items-center min-w-[320px] max-w-[540px] w-full">
          {/* Overlay Status Prompts */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 bg-slate-950/80 z-20 rounded-3xl flex flex-col items-center justify-center backdrop-blur-xs">
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
                Prepare Visual Cortex
              </span>
              <div className="text-6xl font-black text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {stage === 'flashing' && (
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-600/50 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 animate-spin" /> Retinal Snapshot Flash
              </span>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {currentSpeed}ms
              </span>
            </div>
          )}

          {/* Grid View */}
          <div
            className="grid gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 w-full max-w-[420px] aspect-square transition-all"
            style={{
              gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${config.size}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: totalCells }).map((_, idx) => {
              const isTarget = targetCells.has(idx);
              const isSelected = selectedCells.has(idx);
              const isWrong = wrongCell === idx;

              // Visual appearance based on stage
              let cellStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/70 text-transparent';

              if (stage === 'flashing') {
                if (isTarget) {
                  cellStyle =
                    'bg-gradient-to-tr from-cyan-400 to-blue-500 border-cyan-200 shadow-lg shadow-cyan-500/50 ring-2 ring-cyan-300 scale-95 transition-transform duration-100';
                } else {
                  cellStyle = 'bg-slate-800/40 border-slate-800 opacity-60';
                }
              } else if (stage === 'recalling') {
                if (isSelected) {
                  cellStyle =
                    'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300';
                }
              } else if (stage === 'success') {
                if (isTarget) {
                  cellStyle =
                    'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/40';
                }
              } else if (stage === 'failure') {
                if (isWrong) {
                  cellStyle =
                    'bg-rose-600 border-rose-400 shadow-md shadow-rose-600/50 ring-2 ring-rose-400';
                } else if (isTarget && isSelected) {
                  cellStyle = 'bg-emerald-500 border-emerald-300';
                } else if (isTarget && !isSelected) {
                  // Reveal missed target in ghost dashed border for feedback
                  cellStyle =
                    'bg-cyan-950/40 border-2 border-dashed border-cyan-400/80 shadow-inner';
                } else {
                  cellStyle = 'bg-slate-800/30 border-slate-800 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={stage !== 'recalling' || isSelected}
                  className={`rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer disabled:cursor-default relative ${cellStyle}`}
                >
                  {/* Subtle inner indicator when selected */}
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-white animate-scale" />
                  )}
                  {isWrong && (
                    <AlertCircle className="w-5 h-5 text-white animate-bounce" />
                  )}
                  {stage === 'failure' && isTarget && !isSelected && (
                    <span className="text-[10px] font-bold text-cyan-300 tracking-wider">
                      MISSED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action / Result Bar below grid */}
          <div className="w-full mt-6 flex flex-col items-center">
            {stage === 'idle' && (
              <button
                onClick={startRound}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Level {level} Flash
              </button>
            )}

            {stage === 'recalling' && (
              <div className="text-center">
                <p className="text-xs text-slate-300 font-medium animate-pulse">
                  Recall the mental snapshot: tap all <span className="text-cyan-400 font-bold">{config.targetsCount}</span> tiles
                </p>
              </div>
            )}

            {stage === 'success' && (
              <div className="w-full text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base mb-1">
                  <Sparkles className="w-5 h-5" />
                  Visual Snapshot Perfect!
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Retained {config.targetsCount} tiles in {currentSpeed}ms exposure (+{Math.round((35 + config.targetsCount * 5) * currentOption.xpMultiplier)} XP)
                </p>
                {level >= dayLimit.maxLevel ? (
                  <div className="mb-4 p-3 rounded-xl bg-amber-950/70 border border-amber-800/80 text-center">
                    <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5" /> Day {curriculumDay} Matrix Level Cap Reached ({level})
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Level {level + 1} is strictly locked until Day {dayLimit.nextUnlockDay || 'tomorrow'} to maintain optimal cognitive recovery.
                    </p>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={repeatPatternView}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Review Flash
                  </button>

                  {level >= dayLimit.maxLevel ? (
                    <button
                      onClick={retryRound}
                      className="flex-2 py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Replay Level {level}
                    </button>
                  ) : (
                    <button
                      onClick={nextLevel}
                      className="flex-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Trophy className="w-4 h-4" />
                      Advance to Level {level + 1}
                    </button>
                  )}
                </div>
              </div>
            )}

            {stage === 'failure' && (
              <div className="w-full text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-base mb-1">
                  <AlertCircle className="w-5 h-5" />
                  Snapshot Divergence
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Compare your mental after-image with the revealed dashed blue outline. You have unlimited attempts—take your time to recalibrate.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={repeatPatternView}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Re-Flash Pattern
                  </button>
                  <button
                    onClick={retryRound}
                    className="flex-2 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again (Unlimited Attempts)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cognitive Training Tip Footer */}
        <div className="max-w-[540px] w-full mt-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-slate-300 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Eidetic Technique: Geometric Chunking</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Do not memorize individual squares. When the shutter snaps, link the illuminated tiles into a constellation shape (a polygon, an L-shape, or triangular ray). Your visual cortex stores geometric forms with 4x higher retention than isolated coordinates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
