import React, { useState, useEffect } from 'react';
import { UserStats, DailyPQRecord } from '../types';
import { sound } from '../utils/audio';
import { Award, CheckCircle, Sparkles, Play, Flame, Shield, ArrowRight, RotateCcw } from 'lucide-react';

interface DailyWorkoutGameProps {
  stats: UserStats;
  onAddXp: (amount: number) => void;
  onSavePQRecord: (record: DailyPQRecord) => void;
}

type Stage = 'intro' | 'round-1-matrix' | 'round-2-ayumu' | 'round-3-detective' | 'certificate';

export const DailyWorkoutGame: React.FC<DailyWorkoutGameProps> = ({
  stats,
  onAddXp,
  onSavePQRecord,
}) => {
  const [stage, setStage] = useState<Stage>('intro');
  const [subStage, setSubStage] = useState<'countdown' | 'flashing' | 'input' | 'scored'>('countdown');
  const [countdown, setCountdown] = useState(3);

  // Round 1 (Matrix 4x4, 5 targets)
  const [matrixTargets, setMatrixTargets] = useState<number[]>([]);
  const [matrixSelected, setMatrixSelected] = useState<number[]>([]);
  const [matrixScore, setMatrixScore] = useState(0);

  // Round 2 (Ayumu 7 digits)
  const [ayumuTiles, setAyumuTiles] = useState<{ id: number; val: number; cell: number; status: 'revealed' | 'blanked' | 'cleared' | 'failed' }[]>([]);
  const [ayumuExpected, setAyumuExpected] = useState(1);
  const [ayumuScore, setAyumuScore] = useState(0);

  // Round 3 (Symbol snapshot)
  const [detectiveQuestion, setDetectiveQuestion] = useState<{ prompt: string; options: string[]; answer: string; chosen?: string } | null>(null);
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
    while (targets.length < 5) {
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
      }, 700);
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
      if (hits >= 4) sound.playSuccess();
      else sound.playError();
    }
  };

  // Start Stage 2: Ayumu
  const initRound2 = () => {
    setStage('round-2-ayumu');
    const chosenCells: number[] = [];
    while (chosenCells.length < 7) {
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
      }, 900);
    });
  };

  const handleAyumuCell = (tileId: number) => {
    if (subStage !== 'input') return;
    const tile = ayumuTiles.find((t) => t.id === tileId);
    if (!tile || tile.status === 'cleared') return;

    if (tile.val === ayumuExpected) {
      sound.playChimpStep(tile.val, 7);
      const next = ayumuExpected + 1;
      setAyumuExpected(next);
      setAyumuTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, status: 'cleared' } : t))
      );

      if (next > 7) {
        sound.playSuccess();
        setAyumuScore(60);
        setSubStage('scored');
      }
    } else {
      sound.playError();
      const scoredVal = Math.round(((ayumuExpected - 1) / 7) * 60);
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
    const shapes = ['STAR', 'SHIELD', 'DIAMOND', 'ZAP', 'HEART'];
    const colors = ['EMERALD', 'AMBER', 'CYAN', 'ROSE', 'PURPLE'];

    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];

    const options = [targetColor, ...colors.filter((c) => c !== targetColor).slice(0, 3)].sort(() => 0.5 - Math.random());

    setDetectiveQuestion({
      prompt: `In the center of the snapshot, what color was the ${targetShape}?`,
      options,
      answer: targetColor,
    });

    startCountdownThen(() => {
      setSubStage('flashing');
      sound.playFlash();
      setTimeout(() => {
        setSubStage('input');
      }, 1000);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Introduction Card */}
      {stage === 'intro' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <Award className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            Daily Photographic Quotient (PQ) Assessment
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
            Take the standardized 3-discipline evaluation: Flash Matrix, Ayumu Sequential Recall, and Chromatic Detail to compute your certified Photographic Quotient.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 text-left">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Part 1</span>
              <span className="text-xs font-semibold text-white block">Spatial Matrix</span>
              <span className="text-[11px] text-slate-400">700ms flash</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Part 2</span>
              <span className="text-xs font-semibold text-white block">Ayumu Sequence</span>
              <span className="text-[11px] text-slate-400">7 digits recall</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Part 3</span>
              <span className="text-xs font-semibold text-white block">Color Snapshot</span>
              <span className="text-[11px] text-slate-400">Feature binding</span>
            </div>
          </div>

          <button
            onClick={initRound1}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Begin Certified Assessment (+150 XP)
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
            <span className="text-slate-400">5 Targets</span>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
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

              {subStage === 'input' && (
                <p className="text-xs text-slate-300 mb-2">
                  Select the 5 locations from your mental image ({5 - matrixSelected.length} remaining)
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

      {/* Round 2: Ayumu 7 Digits */}
      {stage === 'round-2-ayumu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl mx-auto text-center relative">
          <div className="flex justify-between items-center mb-4 text-xs">
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Stage 2 of 3: Ayumu Sequence
            </span>
            <span className="text-slate-400">7 Digits (1 to 7)</span>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
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

              {subStage === 'input' && (
                <p className="text-xs text-slate-300 mb-2">
                  Tap number <strong className="text-amber-400 text-sm font-black">{ayumuExpected}</strong> of 7
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
            <span className="text-slate-400">Feature Recall</span>
          </div>

          {subStage === 'countdown' && (
            <div className="py-16">
              <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
            </div>
          )}

          {subStage === 'flashing' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex flex-col items-center justify-center animate-pulse">
                <Shield className="w-10 h-10 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-300 mt-1">AMBER SHIELD</span>
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
            Measured against standard adult eidetic & iconic memory distributions
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
              ? 'Outstanding! Your iconic memory retention ranks in the top 3% percentile, capturing high visual density with minimal saccadic distortion.'
              : finalPQ >= 115
              ? 'Strong visual capture! Your retinal snapshot preservation is above average. Push exposure speeds to 300ms to train true eidetic flash.'
              : 'Solid baseline. Focus on suppressing internal subvocal counting to let raw visual sensory data flow directly to motor memory.'}
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
