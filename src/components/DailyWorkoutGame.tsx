import React, { useState, useEffect } from 'react';
import { UserStats, DailyPQRecord } from '../types';
import { sound } from '../utils/audio';
import { getDailyPQAdaptiveConfig } from '../utils/dayRestrictions';
import {
  Award,
  CheckCircle,
  Sparkles,
  Play,
  Flame,
  Shield,
  Star,
  Heart,
  Zap,
  Diamond,
  ArrowRight,
  RotateCcw,
  Clock,
  Sliders,
} from 'lucide-react';

interface DailyWorkoutGameProps {
  stats: UserStats;
  curriculumDay?: number;
  onAddXp: (amount: number) => void;
  onSavePQRecord: (record: DailyPQRecord) => void;
}

type Stage = 'intro' | 'round-1-matrix' | 'round-2-ayumu' | 'round-3-detective' | 'certificate';

interface DetectiveQuestionData {
  prompt: string;
  options: string[];
  answer: string;
  chosen?: string;
  shape: string;
  color: string;
  shapeIcon: 'star' | 'shield' | 'diamond' | 'zap' | 'heart';
  colorObj: { name: string; bg: string; text: string; border: string; hex: string };
}

export const DailyWorkoutGame: React.FC<DailyWorkoutGameProps> = ({
  stats,
  curriculumDay = 1,
  onAddXp,
  onSavePQRecord,
}) => {
  const pqConfig = getDailyPQAdaptiveConfig(curriculumDay, stats.level);

  const [stage, setStage] = useState<Stage>('intro');
  const [subStage, setSubStage] = useState<'countdown' | 'flashing' | 'input' | 'scored'>('countdown');
  const [countdown, setCountdown] = useState(3);

  // Round 1 (Matrix 4x4, adaptive targets)
  const [matrixTargets, setMatrixTargets] = useState<number[]>([]);
  const [matrixSelected, setMatrixSelected] = useState<number[]>([]);
  const [matrixScore, setMatrixScore] = useState(0);

  // Round 2 (Ayumu adaptive digits)
  const [ayumuTiles, setAyumuTiles] = useState<
    { id: number; val: number; cell: number; status: 'revealed' | 'blanked' | 'cleared' | 'failed' }[]
  >([]);
  const [ayumuExpected, setAyumuExpected] = useState(1);
  const [ayumuScore, setAyumuScore] = useState(0);

  // Round 3 (Symbol snapshot)
  const [detectiveQuestion, setDetectiveQuestion] = useState<DetectiveQuestionData | null>(null);
  const [detectiveScore, setDetectiveScore] = useState(0);

  const [finalPQ, setFinalPQ] = useState<number | null>(null);
  const [finalGrade, setFinalGrade] = useState<'A+' | 'A' | 'B' | 'C' | 'D'>('B');

  const startCountdownThen = (onDone: () => void) => {
    setSubStage('countdown');
    setCountdown(3);
    sound.playTick();
    let c = 3;
    const interval = setInterval(() => {
      c -= 1;
      if (c > 0) {
        setCountdown(c);
        sound.playTick();
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 550);
  };

  // Start Stage 1: Matrix
  const initRound1 = () => {
    setStage('round-1-matrix');
    const targets: number[] = [];
    while (targets.length < pqConfig.matrixTargets) {
      const r = Math.floor(Math.random() * 16);
      if (!targets.includes(r)) targets.push(r);
    }
    setMatrixTargets(targets);
    setMatrixSelected([]);

    startCountdownThen(() => {
      setSubStage('flashing');
      sound.playFlash();
      setTimeout(() => {
        setSubStage('input');
      }, pqConfig.matrixFlashMs);
    });
  };

  const handleMatrixCell = (idx: number) => {
    if (subStage !== 'input' || matrixSelected.includes(idx)) return;
    sound.playClick();
    const updated = [...matrixSelected, idx];
    setMatrixSelected(updated);

    if (updated.length === matrixTargets.length) {
      // Score calculation
      const hits = updated.filter((x) => matrixTargets.includes(x)).length;
      const pts = Math.round((hits / matrixTargets.length) * 50);
      setMatrixScore(pts);
      setSubStage('scored');
      if (hits >= matrixTargets.length - 1) sound.playSuccess();
      else sound.playError();
    }
  };

  // Start Stage 2: Ayumu
  const initRound2 = () => {
    setStage('round-2-ayumu');
    const chosenCells: number[] = [];
    while (chosenCells.length < pqConfig.ayumuDigits) {
      const c = Math.floor(Math.random() * 24); // 6x4 = 24 cells
      if (!chosenCells.includes(c)) chosenCells.push(c);
    }
    const tiles = chosenCells.map((cell, i) => ({
      id: i,
      val: i + 1,
      cell,
      status: 'revealed' as const,
    }));
    setAyumuTiles(tiles);
    setAyumuExpected(1);

    startCountdownThen(() => {
      setSubStage('flashing');
      sound.playFlash();
      setTimeout(() => {
        setAyumuTiles((prev) => prev.map((t) => ({ ...t, status: 'blanked' })));
        setSubStage('input');
      }, pqConfig.ayumuFlashMs);
    });
  };

  const handleAyumuCell = (tileId: number) => {
    if (subStage !== 'input') return;
    const tile = ayumuTiles.find((t) => t.id === tileId);
    if (!tile || tile.status === 'cleared') return;

    if (tile.val === ayumuExpected) {
      sound.playChimpStep(tile.val, pqConfig.ayumuDigits);
      const next = ayumuExpected + 1;
      setAyumuExpected(next);
      setAyumuTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, status: 'cleared' } : t))
      );

      if (next > pqConfig.ayumuDigits) {
        sound.playSuccess();
        setAyumuScore(60);
        setSubStage('scored');
      }
    } else {
      sound.playError();
      const scoredVal = Math.round(((ayumuExpected - 1) / pqConfig.ayumuDigits) * 60);
      setAyumuScore(scoredVal);
      setAyumuTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, status: 'failed' } : { ...t, status: 'revealed' }))
      );
      setSubStage('scored');
    }
  };

  // Start Stage 3: Detective
  const initRound3 = () => {
    setStage('round-3-detective');
    const shapes: { name: string; icon: 'star' | 'shield' | 'diamond' | 'zap' | 'heart' }[] = [
      { name: 'STAR', icon: 'star' },
      { name: 'SHIELD', icon: 'shield' },
      { name: 'DIAMOND', icon: 'diamond' },
      { name: 'ZAP', icon: 'zap' },
      { name: 'HEART', icon: 'heart' },
    ];
    const colors: { name: string; bg: string; text: string; border: string; hex: string }[] = [
      { name: 'EMERALD', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500', hex: '#10b981' },
      { name: 'AMBER', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500', hex: '#f59e0b' },
      { name: 'CYAN', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500', hex: '#06b6d4' },
      { name: 'ROSE', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500', hex: '#f43f5e' },
      { name: 'PURPLE', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
    ];

    const targetShapeObj = shapes[Math.floor(Math.random() * shapes.length)];
    const targetColorObj = colors[Math.floor(Math.random() * colors.length)];

    const options = [
      targetColorObj.name,
      ...colors.filter((c) => c.name !== targetColorObj.name).map((c) => c.name).slice(0, 3),
    ].sort(() => 0.5 - Math.random());

    setDetectiveQuestion({
      prompt: `In the center of the snapshot, what color was the ${targetShapeObj.name}?`,
      options,
      answer: targetColorObj.name,
      shape: targetShapeObj.name,
      color: targetColorObj.name,
      shapeIcon: targetShapeObj.icon,
      colorObj: targetColorObj,
    });

    startCountdownThen(() => {
      setSubStage('flashing');
      sound.playFlash();
      setTimeout(() => {
        setSubStage('input');
      }, pqConfig.detectiveFlashMs);
    });
  };

  const handleDetectiveChoice = (choice: string) => {
    if (subStage !== 'input' || !detectiveQuestion) return;
    const correct = choice === detectiveQuestion.answer;
    setDetectiveQuestion({ ...detectiveQuestion, chosen: choice });

    if (correct) {
      sound.playSuccess();
      setDetectiveScore(50);
    } else {
      sound.playError();
      setDetectiveScore(15);
    }
    setSubStage('scored');
  };

  // Finish Workout & Calculate PQ
  const finalizeWorkout = () => {
    const rawTotal = matrixScore + ayumuScore + detectiveScore; // Max 50 + 60 + 50 = 160
    // Standard PQ scale from 70 to 165
    const pq = Math.round(75 + (rawTotal / 160) * 85);
    setFinalPQ(pq);

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
    if (pq >= 145) grade = 'A+';
    else if (pq >= 130) grade = 'A';
    else if (pq >= 110) grade = 'B';
    else if (pq >= 90) grade = 'C';
    else grade = 'D';

    setFinalGrade(grade);

    const record: DailyPQRecord = {
      id: 'pq-' + Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: pq,
      grade,
      breakdown: {
        matrixScore,
        ayumuScore,
        detectiveScore,
      },
    };

    onSavePQRecord(record);
    onAddXp(150); // Daily completion bonus!
    sound.playLevelUp();
    setStage('certificate');
  };

  const renderDetectiveIcon = (
    icon: 'star' | 'shield' | 'diamond' | 'zap' | 'heart',
    textColor = 'text-amber-400'
  ) => {
    switch (icon) {
      case 'star':
        return <Star className={`w-12 h-12 ${textColor} fill-current`} />;
      case 'shield':
        return <Shield className={`w-12 h-12 ${textColor} fill-current`} />;
      case 'diamond':
        return <Diamond className={`w-12 h-12 ${textColor} fill-current`} />;
      case 'zap':
        return <Zap className={`w-12 h-12 ${textColor} fill-current`} />;
      case 'heart':
        return <Heart className={`w-12 h-12 ${textColor} fill-current`} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Introduction Card */}
      {stage === 'intro' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-w-2xl mx-auto">
          {/* Status Tier Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${pqConfig.tierBadgeColor} flex items-center gap-1.5`}>
              <Sliders className="w-3.5 h-3.5" />
              {pqConfig.tierName} Status Tier (Day {curriculumDay} • Lv {stats.level})
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              Player-Adaptive Timing
            </span>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <Award className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            Daily Photographic Quotient (PQ) Assessment
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-3 leading-relaxed">
            Take the calibrated 3-discipline evaluation: Flash Matrix, Ayumu Sequential Recall, and Chromatic Detail to compute your certified Photographic Quotient.
          </p>

          {/* Adaptive Notice */}
          <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-3.5 mb-6 text-xs text-emerald-300/90 text-left flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-200 block mb-0.5 font-bold">
                Auto-Calibrated for Your Current Status:
              </strong>
              {pqConfig.tierSummary} Timings will naturally scale up as you progress through future curriculum days.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 text-left">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Part 1</span>
              <span className="text-xs font-semibold text-white block">Spatial Matrix</span>
              <span className="text-[11px] text-cyan-300 font-mono font-bold">
                {(pqConfig.matrixFlashMs / 1000).toFixed(1)}s flash • {pqConfig.matrixTargets} targets
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Part 2</span>
              <span className="text-xs font-semibold text-white block">Ayumu Sequence</span>
              <span className="text-[11px] text-amber-300 font-mono font-bold">
                {pqConfig.ayumuDigits} digits • {(pqConfig.ayumuFlashMs / 1000).toFixed(1)}s flash
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Part 3</span>
              <span className="text-xs font-semibold text-white block">Color Snapshot</span>
              <span className="text-[11px] text-purple-300 font-mono font-bold">
                {(pqConfig.detectiveFlashMs / 1000).toFixed(1)}s feature snapshot
              </span>
            </div>
          </div>

          <button
            onClick={initRound1}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Begin Calibrated Assessment (+150 XP)
          </button>
        </div>
      )}

      {/* Round 1: Spatial Matrix */}
      {stage === 'round-1-matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg mx-auto text-center relative">
          <div className="flex justify-between items-center mb-4 text-xs">
            <span className="font-bold text-cyan-400 uppercase tracking-wider">
              Stage 1 of 3: Spatial Matrix
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-cyan-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {(pqConfig.matrixFlashMs / 1000).toFixed(1)}s Exposure
              </span>
              <span className="text-slate-400 font-mono">{pqConfig.matrixTargets} Targets</span>
            </div>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
              <p className="text-xs text-slate-400 mt-2">Prepare for spatial matrix snapshot...</p>
            </div>
          )}

          {subStage !== 'countdown' && (
            <div>
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 aspect-square max-w-[320px] mx-auto mb-4">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const isTarget = matrixTargets.includes(idx);
                  const isSelected = matrixSelected.includes(idx);

                  let cellClass = 'bg-slate-800 border-slate-700';
                  if (subStage === 'flashing' && isTarget) {
                    cellClass = 'bg-cyan-400 border-cyan-200 shadow-lg shadow-cyan-500/50 scale-95';
                  } else if (subStage === 'input' && isSelected) {
                    cellClass = 'bg-emerald-500 border-emerald-300';
                  } else if (subStage === 'scored') {
                    if (isTarget && isSelected) cellClass = 'bg-emerald-500 border-emerald-300';
                    else if (isSelected && !isTarget) cellClass = 'bg-rose-500 border-rose-300';
                    else if (isTarget) cellClass = 'border-2 border-dashed border-cyan-400 bg-cyan-950/40';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMatrixCell(idx)}
                      disabled={subStage !== 'input'}
                      className={`rounded-xl border transition-all ${cellClass}`}
                    />
                  );
                })}
              </div>

              {subStage === 'flashing' && (
                <div className="text-xs text-cyan-300 font-bold animate-pulse">
                  Absorbing {pqConfig.matrixTargets} locations...
                </div>
              )}

              {subStage === 'input' && (
                <p className="text-xs text-slate-300 mb-2">
                  Select the {pqConfig.matrixTargets} locations from your mental image ({pqConfig.matrixTargets - matrixSelected.length} remaining)
                </p>
              )}

              {subStage === 'scored' && (
                <div className="mt-4 animate-fade-in">
                  <p className="text-sm font-bold text-white mb-3">
                    Stage 1 Score: <span className="text-cyan-400">{matrixScore} / 50 pts</span>
                  </p>
                  <button
                    onClick={initRound2}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    Proceed to Stage 2: Ayumu Sequence <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Round 2: Ayumu Sequence */}
      {stage === 'round-2-ayumu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl mx-auto text-center relative">
          <div className="flex justify-between items-center mb-4 text-xs">
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Stage 2 of 3: Ayumu Sequence
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {(pqConfig.ayumuFlashMs / 1000).toFixed(1)}s Exposure
              </span>
              <span className="text-slate-400 font-mono">{pqConfig.ayumuDigits} Digits (1 to {pqConfig.ayumuDigits})</span>
            </div>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
              <p className="text-xs text-slate-400 mt-2">Locate numbers 1 through {pqConfig.ayumuDigits}...</p>
            </div>
          )}

          {subStage !== 'countdown' && (
            <div>
              <div className="grid grid-cols-6 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 aspect-[6/4] max-w-[420px] mx-auto mb-4">
                {Array.from({ length: 24 }).map((_, cIdx) => {
                  const t = ayumuTiles.find((tile) => tile.cell === cIdx);
                  if (!t) {
                    return <div key={cIdx} className="rounded-xl bg-slate-900/40 border border-slate-800/40" />;
                  }

                  let bgClass = 'bg-white text-slate-950 font-black text-lg';
                  let txt: React.ReactNode = t.val;

                  if (t.status === 'blanked') {
                    bgClass = 'bg-slate-100 hover:bg-slate-200 cursor-pointer shadow-sm';
                    txt = null;
                  } else if (t.status === 'cleared') {
                    bgClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-600/40';
                    txt = '✓';
                  } else if (t.status === 'failed') {
                    bgClass = 'bg-rose-600 text-white font-black';
                  }

                  return (
                    <button
                      key={cIdx}
                      onClick={() => handleAyumuCell(t.id)}
                      disabled={subStage !== 'input' || t.status === 'cleared'}
                      className={`rounded-xl border flex items-center justify-center select-none ${bgClass}`}
                    >
                      {txt}
                    </button>
                  );
                })}
              </div>

              {subStage === 'flashing' && (
                <div className="text-xs text-amber-300 font-bold animate-pulse">
                  Memorizing locations 1 through {pqConfig.ayumuDigits}...
                </div>
              )}

              {subStage === 'input' && (
                <p className="text-xs text-slate-300 mb-2">
                  Tap number <strong className="text-amber-400 text-sm font-black">{ayumuExpected}</strong> of {pqConfig.ayumuDigits}
                </p>
              )}

              {subStage === 'scored' && (
                <div className="mt-4 animate-fade-in">
                  <p className="text-sm font-bold text-white mb-3">
                    Stage 2 Score: <span className="text-amber-400">{ayumuScore} / 60 pts</span>
                  </p>
                  <button
                    onClick={initRound3}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    Proceed to Stage 3: Color Snapshot <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Round 3: Detective */}
      {stage === 'round-3-detective' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg mx-auto text-center relative">
          <div className="flex justify-between items-center mb-4 text-xs">
            <span className="font-bold text-purple-400 uppercase tracking-wider">
              Stage 3 of 3: Chromatic Detail
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-purple-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {(pqConfig.detectiveFlashMs / 1000).toFixed(1)}s Snapshot
              </span>
              <span className="text-slate-400">Feature Recall</span>
            </div>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
              <p className="text-xs text-slate-400 mt-2">Observe the symbol and color...</p>
            </div>
          )}

          {subStage === 'flashing' && detectiveQuestion && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div
                className={`w-28 h-28 rounded-2xl ${detectiveQuestion.colorObj?.bg || 'bg-amber-500/20'} border-2 ${
                  detectiveQuestion.colorObj?.border || 'border-amber-500'
                } flex flex-col items-center justify-center animate-pulse shadow-xl shadow-purple-500/10`}
              >
                {renderDetectiveIcon(detectiveQuestion.shapeIcon, detectiveQuestion.colorObj?.text)}
                <span
                  className={`text-[11px] font-black tracking-wider uppercase mt-2 ${
                    detectiveQuestion.colorObj?.text || 'text-amber-300'
                  }`}
                >
                  {detectiveQuestion.color} {detectiveQuestion.shape}
                </span>
              </div>
            </div>
          )}

          {subStage === 'input' && detectiveQuestion && (
            <div className="animate-fade-in">
              <div className="bg-slate-800 p-4 rounded-2xl mb-4">
                <p className="text-sm font-bold text-white">{detectiveQuestion.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {detectiveQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleDetectiveChoice(opt)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all hover:border-purple-400"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subStage === 'scored' && (
            <div className="mt-4 animate-fade-in">
              <p className="text-sm font-bold text-white mb-3">
                Stage 3 Score: <span className="text-purple-400">{detectiveScore} / 50 pts</span>
              </p>
              <button
                onClick={finalizeWorkout}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                Compute Final Photographic Quotient <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Certificate / Summary View */}
      {stage === 'certificate' && finalPQ !== null && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto text-center relative overflow-hidden animate-scale">
          {/* Certificate Header Stamp */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Official PQ Certification
          </div>

          <h2 className="text-3xl font-black text-white mb-1">
            Photographic Quotient
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Measured against calibrated eidetic & iconic memory benchmarks for {pqConfig.tierName} status
          </p>

          {/* Big Score Gauge */}
          <div className="w-36 h-36 rounded-full bg-slate-800 border-4 border-emerald-500 flex flex-col items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20">
            <span className="text-4xl font-black text-emerald-300 font-mono tracking-tight">
              {finalPQ}
            </span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Grade {finalGrade}
            </span>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-left">
            <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Spatial Span</span>
              <span className="text-sm font-bold text-cyan-300">{matrixScore}/50</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Ayumu Index</span>
              <span className="text-sm font-bold text-amber-300">{ayumuScore}/60</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Chromatic Bind</span>
              <span className="text-sm font-bold text-purple-300">{detectiveScore}/50</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-6 bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl leading-relaxed">
            {finalPQ >= 140
              ? 'Outstanding! Your iconic memory retention ranks in the top tier, capturing high visual density with minimal saccadic distortion.'
              : finalPQ >= 115
              ? 'Strong visual capture! Your retinal snapshot preservation is excellent. You are mastering your current tier.'
              : 'Solid baseline. Focus on taking a full-frame mental photo before the tiles fade.'}
          </p>

          <button
            onClick={() => setStage('intro')}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Assessment
          </button>
        </div>
      )}
    </div>
  );
};
