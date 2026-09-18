import React, { useState, useEffect } from 'react';
import { MajorPeg, GameMode } from '../types';
import { MAJOR_SYSTEM_PEGS } from '../utils/storage';
import { sound } from '../utils/audio';
import { getPegTargetForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import {
  Zap,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Flame,
  CheckCircle2,
  Lock,
  Trophy,
} from 'lucide-react';

interface MnemonicPegsGameProps {
  curriculumDay: number;
  isLockedOut?: boolean;
  isFreeTraining?: boolean;
  onAddXp: (amount: number) => void;
  onRecordMnemonicConversion: () => void;
  onCompletePegLevel?: () => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
  completedLevelsToday?: number;
}

export const MnemonicPegsGame: React.FC<MnemonicPegsGameProps> = ({
  curriculumDay,
  isLockedOut = false,
  isFreeTraining = false,
  onAddXp,
  onRecordMnemonicConversion,
  onCompletePegLevel,
  onNavigateMode,
  isTaskCompleteToday = false,
  completedLevelsToday = 0,
}) => {
  const pegConfig = getPegTargetForDay(curriculumDay);
  const [freePracticeActive, setFreePracticeActive] = useState(isFreeTraining);
  const [freeRange, setFreeRange] = useState<'day' | '0-9' | '0-19' | '0-49' | 'all'>('day');

  // Filter available pegs based on today's curriculum day max number or free range
  const eligiblePegs = MAJOR_SYSTEM_PEGS.filter((p) => {
    const num = parseInt(p.number, 10);
    if (isNaN(num)) return true;
    if (freePracticeActive && freeRange !== 'day') {
      if (freeRange === '0-9') return num <= 9;
      if (freeRange === '0-19') return num <= 19;
      if (freeRange === '0-49') return num <= 49;
      if (freeRange === 'all') return true;
    }
    return num <= pegConfig.maxNumber;
  });

  const [currentPeg, setCurrentPeg] = useState<MajorPeg | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [pegStartTime, setPegStartTime] = useState<number>(0);
  const [pegReactionMs, setPegReactionMs] = useState<number | null>(null);
  const [pegStreak, setPegStreak] = useState<number>(0);
  const [strikeBroken, setStrikeBroken] = useState<boolean>(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // If user or day is fully locked out
  if (isLockedOut && !freePracticeActive) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Mnemonic Peg Drills"
        onNavigateMode={onNavigateMode}
        onUnlockFreeTraining={() => setFreePracticeActive(true)}
      />
    );
  }

  const nextPegDrill = () => {
    const pool = eligiblePegs.length > 0 ? eligiblePegs : MAJOR_SYSTEM_PEGS;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const otherWords = pool.filter((p) => p.word !== target.word).map((p) => p.word);
    const shuffledChoices = [target.word, ...otherWords.slice(0, 3)].sort(() => 0.5 - Math.random());

    setCurrentPeg(target);
    setOptions(shuffledChoices);
    setPegStartTime(Date.now());
    setPegReactionMs(null);
  };

  useEffect(() => {
    nextPegDrill();
  }, [curriculumDay]);

  const handleSelectPegAnswer = (word: string) => {
    if (!currentPeg) return;
    const elapsed = Date.now() - pegStartTime;
    setPegReactionMs(elapsed);

    if (word === currentPeg.word) {
      sound.playSuccess();
      const speedBonus = elapsed < 1200 ? 15 : 5;
      onAddXp(20 + speedBonus);
      setStrikeBroken(false);
      onRecordMnemonicConversion();

      const nextStreak = pegStreak + 1;
      setPegStreak(nextStreak);

      // Check if current level is cleared with 100% perfect unbroken strike
      if (nextStreak >= pegConfig.targetCount) {
        sound.playLevelUp();
        setPegStreak(0);
        if (onCompletePegLevel) {
          onCompletePegLevel();
        }
      }

      setTimeout(nextPegDrill, 450);
    } else {
      sound.playError();
      setPegStreak(0);
      setStrikeBroken(true);
      setTimeout(nextPegDrill, 900);
    }
  };

  const isQuotaReached = completedLevelsToday >= 2 || isTaskCompleteToday;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Game Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {freePracticeActive ? (
                <span className="text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  Free Training Session • Unlimited Practice
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Step 4 of 6 • Major System Drills
                </span>
              )}
              <span className="text-[10px] bg-amber-950/70 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-700/60">
                100% Perfect Strike Required
              </span>
              {!freePracticeActive && (
                <span className="text-[10px] bg-cyan-950/70 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-700/60">
                  2 Levels Required ({completedLevelsToday}/2 Cleared)
                </span>
              )}
              {!freePracticeActive ? (
                <span className="text-xs text-slate-400 font-mono">
                  Day {curriculumDay} Cap: {pegConfig.label}
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-700">
                  All Pegs Unlocked
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Mnemonic Peg Speed Conversions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Rapidly transform digits into vivid phonetically-encoded objects. Level requirement: 
              <strong className="text-amber-300 ml-1">{pegConfig.targetCount} unbroken conversions</strong> with 100% precision. Any mistake resets the level streak.
            </p>

            {/* Range selection in Free Practice */}
            {freePracticeActive && (
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Peg Pool:
                </span>
                {[
                  { key: 'day', label: `Day ${curriculumDay} (${pegConfig.label})` },
                  { key: '0-9', label: 'Single 0-9' },
                  { key: '0-19', label: 'Teens 0-19' },
                  { key: '0-49', label: 'Mid 0-49' },
                  { key: 'all', label: 'All 00-99 (100 Pegs)' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      sound.playClick();
                      setFreeRange(opt.key as any);
                      nextPegDrill();
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      freeRange === opt.key
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's Quota Progress */}
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Daily Progress
              </div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {completedLevelsToday} / 2 Levels
              </div>
            </div>
            {isQuotaReached && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Drill Body */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
          {/* Status bar */}
          <div className="w-full flex justify-between items-center mb-4 text-xs">
            <span className="text-slate-300">
              Level {Math.min(2, completedLevelsToday + 1)} Strike:{' '}
              <strong className="text-amber-400 font-black text-sm">{pegStreak}</strong>
              <span className="text-slate-400 font-mono"> / {pegConfig.targetCount} in a row</span>
            </span>
            <button
              onClick={() => setIsCheatSheetOpen(!isCheatSheetOpen)}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {isCheatSheetOpen ? 'Hide Major Code' : 'Phonetic Code Guide'}
            </button>
          </div>

          {/* Strike Broken Alert */}
          {strikeBroken && (
            <div className="w-full mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-300 text-xs text-center font-bold animate-pulse">
              Strike Broken! 100% Perfect Strike Required (0 mistakes). Level streak reset to 0.
            </div>
          )}

          {/* Quota Cleared Notice */}
          {isQuotaReached && (
            <div className="w-full mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                Day {curriculumDay} Peg Quota Mastered!
              </div>
              <p className="text-[11px] text-slate-300">
                You completed both deliberate practice levels ({pegConfig.targetCount} conversions each) with 100% flawless strikes!
              </p>
            </div>
          )}

          {/* Cheat sheet drawer */}
          {isCheatSheetOpen && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-slate-950/90 border border-cyan-800/60 text-xs text-slate-300 animate-scale">
              <span className="font-bold text-cyan-300 block mb-2">
                The Major System Consonant Code:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">0:</strong> S, Z, soft C
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">1:</strong> T, D
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">2:</strong> N
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">3:</strong> M
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">4:</strong> R
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">5:</strong> L
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">6:</strong> J, SH, CH
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">7:</strong> K, Hard G
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">8:</strong> F, V
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong className="text-amber-400">9:</strong> P, B
                </div>
              </div>
            </div>
          )}

          {/* Target Prompt Card - Number Only (Phonetic letters hidden as requested) */}
          {currentPeg && (
            <div className="w-full flex flex-col items-center mb-6">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">
                Translate Number to Mental Object
              </span>
              <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-2 border-amber-500/80 flex flex-col items-center justify-center shadow-xl shadow-amber-500/10">
                <span className="text-6xl font-black text-amber-400 font-mono tracking-tight">
                  {currentPeg.number}
                </span>
              </div>
            </div>
          )}

          {/* 4 Choices */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectPegAnswer(opt)}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white font-bold text-sm transition-all hover:border-amber-400 shadow-sm active:scale-98 cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Reaction Speed Indicator */}
          {pegReactionMs !== null && (
            <div className="text-xs font-mono text-cyan-300">
              Retrieval Speed: <strong>{pegReactionMs}ms</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
