import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NBackTrial, NBackResult, GameMode } from '../types';
import { sound } from '../utils/audio';
import { getMaxDualNBackForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import { Play, RotateCcw, Brain, Check, X, Award, ChevronUp, ChevronDown, Volume2, Sparkles, Lock } from 'lucide-react';

interface DualNBackGameProps {
  curriculumDay: number;
  isLockedOut?: boolean;
  onAddXp: (amount: number) => void;
  onRecordNBackMax: (level: number) => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
}

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
const TRIALS_PER_ROUND = 16;
const STIMULUS_DURATION_MS = 1000;
const INTER_TRIAL_INTERVAL_MS = 2200;

export const DualNBackGame: React.FC<DualNBackGameProps> = ({
  curriculumDay,
  isLockedOut = false,
  onAddXp,
  onRecordNBackMax,
  onNavigateMode,
  isTaskCompleteToday = false,
}) => {
  const dayLimit = getMaxDualNBackForDay(curriculumDay);

  if (isLockedOut) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Dual N-Back Laboratory"
        onNavigateMode={onNavigateMode}
      />
    );
  }

  const [n, setN] = useState<number>(() => dayLimit.defaultN || 1); // Default to prescribed day target (N=1 for Days 1-3)
  const [stage, setStage] = useState<'idle' | 'countdown' | 'running' | 'summary'>('idle');
  const [currentTrialIdx, setCurrentTrialIdx] = useState<number>(-1);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // User input states for current trial
  const [posPressed, setPosPressed] = useState<boolean>(false);
  const [audioPressed, setAudioPressed] = useState<boolean>(false);

  // History of trials generated
  const [trials, setTrials] = useState<NBackTrial[]>([]);
  const [userInputs, setUserInputs] = useState<{ claimedPos: boolean; claimedAudio: boolean }[]>([]);

  // Telemetry results
  const [result, setResult] = useState<NBackResult | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate the sequence with guaranteed ~30% match rate for both position and audio
  const generateSequence = useCallback((nVal: number, total: number): NBackTrial[] => {
    const seq: NBackTrial[] = [];

    for (let i = 0; i < total; i++) {
      let pos = Math.floor(Math.random() * 9);
      let letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

      let isPosMatch = false;
      let isAudMatch = false;

      if (i >= nVal) {
        const matchPosChance = Math.random() < 0.35;
        const matchAudChance = Math.random() < 0.35;

        if (matchPosChance) {
          pos = seq[i - nVal].position;
          isPosMatch = true;
        } else {
          // Avoid accidental match
          if (pos === seq[i - nVal].position) {
            pos = (pos + 1 + Math.floor(Math.random() * 8)) % 9;
          }
          isPosMatch = false;
        }

        if (matchAudChance) {
          letter = seq[i - nVal].letter;
          isAudMatch = true;
        } else {
          if (letter === seq[i - nVal].letter) {
            const others = LETTERS.filter((l) => l !== letter);
            letter = others[Math.floor(Math.random() * others.length)];
          }
          isAudMatch = false;
        }
      }

      seq.push({
        step: i,
        position: pos,
        letter,
        isPositionMatch: isPosMatch,
        isAudioMatch: isAudMatch,
      });
    }

    return seq;
  }, []);

  const startRound = () => {
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);

    const newTrials = generateSequence(n, TRIALS_PER_ROUND);
    setTrials(newTrials);
    setUserInputs([]);
    setCurrentTrialIdx(-1);
    setActiveCell(null);
    setActiveLetter(null);
    setResult(null);

    setStage('countdown');
    setCountdown(3);
    sound.playTick();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else {
        clearInterval(interval);
        runSequence(newTrials, 0, []);
      }
    }, 550);
  };

  const runSequence = (
    allTrials: NBackTrial[],
    idx: number,
    accumulatedInputs: { claimedPos: boolean; claimedAudio: boolean }[]
  ) => {
    if (idx >= allTrials.length) {
      // Completed round, calculate scores
      evaluateRound(allTrials, accumulatedInputs);
      return;
    }

    setStage('running');
    setCurrentTrialIdx(idx);
    setPosPressed(false);
    setAudioPressed(false);

    const trial = allTrials[idx];
    setActiveCell(trial.position);
    setActiveLetter(trial.letter);

    // Play letter speech & audio frequency
    sound.playLetterStimulus(trial.letter);

    // Hide stimulus after STIMULUS_DURATION_MS, keep listening for response
    stimulusTimerRef.current = setTimeout(() => {
      setActiveCell(null);
      setActiveLetter(null);
    }, STIMULUS_DURATION_MS);

    // Advance to next trial after INTER_TRIAL_INTERVAL_MS
    trialTimerRef.current = setTimeout(() => {
      // Read current pressed states using ref/closure
      setPosPressed((currentPos) => {
        setAudioPressed((currentAud) => {
          const nextInputs = [
            ...accumulatedInputs,
            { claimedPos: currentPos, claimedAudio: currentAud },
          ];
          setUserInputs(nextInputs);
          runSequence(allTrials, idx + 1, nextInputs);
          return false;
        });
        return false;
      });
    }, INTER_TRIAL_INTERVAL_MS);
  };

  const handleClaimPosition = () => {
    if (stage !== 'running' || currentTrialIdx < 0) return;
    sound.playClick();
    setPosPressed(true);
  };

  const handleClaimAudio = () => {
    if (stage !== 'running' || currentTrialIdx < 0) return;
    sound.playClick();
    setAudioPressed(true);
  };

  // Keyboard shortcut listener for A (Position) and L (Sound)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'running') return;
      if (e.key === 'a' || e.key === 'A') {
        handleClaimPosition();
      } else if (e.key === 'l' || e.key === 'L') {
        handleClaimAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentTrialIdx]);

  const evaluateRound = (
    allTrials: NBackTrial[],
    inputs: { claimedPos: boolean; claimedAudio: boolean }[]
  ) => {
    let posHits = 0;
    let posMisses = 0;
    let posFalseAlarms = 0;
    let posCorrectRejections = 0;

    let audHits = 0;
    let audMisses = 0;
    let audFalseAlarms = 0;
    let audCorrectRejections = 0;

    const validTrialsCount = allTrials.length - n;

    for (let i = n; i < allTrials.length; i++) {
      const trial = allTrials[i];
      const input = inputs[i] || { claimedPos: false, claimedAudio: false };

      // Position scoring
      if (trial.isPositionMatch) {
        if (input.claimedPos) posHits++;
        else posMisses++;
      } else {
        if (input.claimedPos) posFalseAlarms++;
        else posCorrectRejections++;
      }

      // Audio scoring
      if (trial.isAudioMatch) {
        if (input.claimedAudio) audHits++;
        else audMisses++;
      } else {
        if (input.claimedAudio) audFalseAlarms++;
        else audCorrectRejections++;
      }
    }

    const posAccuracy = Math.round(
      ((posHits + posCorrectRejections) / (validTrialsCount || 1)) * 100
    );
    const audAccuracy = Math.round(
      ((audHits + audCorrectRejections) / (validTrialsCount || 1)) * 100
    );
    const overallScore = Math.round((posAccuracy + audAccuracy) / 2);

    let recommendedAction: 'level-up' | 'maintain' | 'level-down' = 'maintain';
    if (overallScore >= 80) recommendedAction = 'level-up';
    else if (overallScore < 55 && n > 1) recommendedAction = 'level-down';

    const res: NBackResult = {
      n,
      totalTrials: allTrials.length,
      positionAccuracy: Math.min(100, Math.max(0, posAccuracy)),
      audioAccuracy: Math.min(100, Math.max(0, audAccuracy)),
      overallScore: Math.min(100, Math.max(0, overallScore)),
      recommendedAction,
    };

    setResult(res);
    setStage('summary');

    // Reward XP based on N level
    const xpReward = Math.round(overallScore * n * 0.85);
    onAddXp(xpReward);

    // N=1 calibration clears at 60% accuracy; higher N requires 70%
    const passThreshold = n === 1 ? 60 : 70;
    if (overallScore >= passThreshold) {
      sound.playSuccess();
      onRecordNBackMax(n);
    } else {
      sound.playError();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> Step 3 of 6 • Dual N-Back
              </span>
              <span className="text-xs text-slate-400">
                Scientific Jaeggi Protocol
              </span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {curriculumDay < 4 ? `Day ${curriculumDay} Target: N=1 (Calibration)` : `Day ${curriculumDay} Target: N=${dayLimit.targetN}`}
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-800/60">
                Unlimited Attempts
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Dual N-Back Laboratory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simultaneously track spatial grid positions and auditory letters from{' '}
              <strong className="text-cyan-300 font-bold">
                {n === 1 ? '1 step back (immediate consecutive repeat)' : `${n} steps back`}
              </strong>.
            </p>
          </div>

          {/* Level Selector N=1..4 */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 p-1.5 rounded-xl">
            <span className="text-xs text-slate-400 pl-2 font-medium">N-Level:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((level) => {
                const isLocked = level > dayLimit.maxN;
                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (isLocked) return;
                      sound.playClick();
                      setN(level);
                      setStage('idle');
                    }}
                    disabled={stage === 'running' || isLocked}
                    title={isLocked ? `Strictly locked for Day ${curriculumDay}. Unlocks Day ${dayLimit.nextUnlockDay}.` : undefined}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                      isLocked
                        ? 'text-slate-600 bg-slate-900/50 cursor-not-allowed border border-slate-800'
                        : n === level
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 cursor-pointer'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    {isLocked ? <Lock className="w-2.5 h-2.5 text-slate-500" /> : null}
                    N={level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
          {/* Countdown */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 bg-slate-950/85 z-20 rounded-3xl flex flex-col items-center justify-center backdrop-blur-xs">
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
                Engaging Executive Attention
              </span>
              <div className="text-6xl font-black text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Trial Progress Bar */}
          {stage === 'running' && (
            <div className="w-full mb-4">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-mono">
                <span>
                  Trial {currentTrialIdx + 1} of {TRIALS_PER_ROUND}
                </span>
                <span className="text-cyan-300 font-bold">Matching N={n} back</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentTrialIdx + 1) / TRIALS_PER_ROUND) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 3x3 Spatial Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/90 w-full aspect-square max-w-[340px] mb-6">
            {Array.from({ length: 9 }).map((_, cellIdx) => {
              const isActive = activeCell === cellIdx;

              return (
                <div
                  key={cellIdx}
                  className={`rounded-2xl border transition-all duration-150 flex items-center justify-center relative ${
                    isActive
                      ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border-cyan-200 shadow-xl shadow-cyan-500/50 scale-95 ring-4 ring-cyan-400/30'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  {/* Subtle Auditory Letter Pill inside active cell */}
                  {isActive && activeLetter && (
                    <span className="text-2xl font-black text-slate-950 animate-scale">
                      {activeLetter}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dual Action Response Buttons */}
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            {/* Position Match Button (Key A) */}
            <button
              onClick={handleClaimPosition}
              disabled={stage !== 'running'}
              className={`py-4 px-4 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer ${
                posPressed
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/40 scale-98'
                  : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-white active:scale-98'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-extrabold">Position Match</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Press key <kbd className="px-1 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700">A</kbd>
              </span>
            </button>

            {/* Audio Match Button (Key L) */}
            <button
              onClick={handleClaimAudio}
              disabled={stage !== 'running'}
              className={`py-4 px-4 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer ${
                audioPressed
                  ? 'bg-indigo-500 text-white border-indigo-300 shadow-lg shadow-indigo-500/40 scale-98'
                  : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-white active:scale-98'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-extrabold">Audio Match</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Press key <kbd className="px-1 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-700">L</kbd>
              </span>
            </button>
          </div>

          {/* Action / Launch Controls */}
          {stage === 'idle' && (
            <div className="w-full space-y-3">
              {n === 1 && (
                <div className="w-full bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-3.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Day {curriculumDay} Beginner Calibration Guide (N=1)
                  </div>
                  <p className="leading-relaxed text-slate-300 text-[11px]">
                    Press <strong className="text-cyan-300 font-semibold">Position Match (A)</strong> whenever the blue square is in the exact same cell as the immediately preceding trial. Press <strong className="text-indigo-300 font-semibold">Audio Match (L)</strong> if you hear the exact same letter twice in a row. Achieving 60%+ accuracy completes today&apos;s working memory quota!
                  </p>
                </div>
              )}
              <button
                onClick={startRound}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                Begin Dual N-{n} Test (16 Trials)
              </button>
            </div>
          )}

          {stage === 'running' && (
            <p className="text-xs text-slate-300 text-center animate-pulse font-medium">
              {n === 1
                ? 'Did the position or letter just repeat from the immediate previous trial?'
                : `Does current position or sound match ${n} steps ago?`}
            </p>
          )}

          {stage === 'summary' && result && (
            <div className="w-full text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 font-black text-lg text-white mb-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Dual N-{n} Evaluation Complete
              </div>

              {/* Accuracy Pills */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="bg-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">Position</span>
                  <span className="text-base font-black text-cyan-400">
                    {result.positionAccuracy}%
                  </span>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">Audio</span>
                  <span className="text-base font-black text-indigo-400">
                    {result.audioAccuracy}%
                  </span>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">Combined</span>
                  <span className="text-base font-black text-emerald-400">
                    {result.overallScore}%
                  </span>
                </div>
              </div>

              {/* Recommended Adaptive Action */}
              <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl mb-4 text-xs text-slate-300">
                {result.recommendedAction === 'level-up' && (
                  <p className="text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <ChevronUp className="w-4 h-4" /> Mastery threshold reached! Ready for N={n + 1}.
                  </p>
                )}
                {result.recommendedAction === 'maintain' && (
                  <p className="text-cyan-300 font-bold">
                    Solid performance. Keep drilling N={n} to stabilize neural plasticity.
                  </p>
                )}
                {result.recommendedAction === 'level-down' && (
                  <p className="text-amber-300 font-bold flex items-center justify-center gap-1">
                    <ChevronDown className="w-4 h-4" /> Recommend stepping to N={n - 1} to consolidate accuracy.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startRound}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry N={n} (Unlimited Attempts)
                </button>
                {result.recommendedAction === 'level-up' && n < dayLimit.maxN && (
                  <button
                    onClick={() => {
                      setN((prev) => prev + 1);
                      setTimeout(startRound, 50);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Advance to N={n + 1} <ChevronUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cognitive Science Note */}
        <div className="max-w-[540px] w-full mt-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-slate-300 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Why Dual N-Back is the "Mental Squat"</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Unlike static memorization, Dual N-Back forces the dorsolateral prefrontal cortex to simultaneously maintain, update, and discard items in two separate sensory channels (visuospatial scratchpad and phonological loop). It is the premier protocol for expanding working memory capacity in software engineers and cognitive athletes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
