import React, { useState } from 'react';
import { PalaceLocus, GameMode } from '../types';
import { DEFAULT_PALACE_LOCI } from '../utils/storage';
import { sound } from '../utils/audio';
import { getPalaceConfigForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import {
  Castle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface MemoryPalaceGameProps {
  curriculumDay: number;
  isLockedOut?: boolean;
  onAddXp: (amount: number) => void;
  onCompletePalaceStep: () => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
  completedLevelsToday?: number;
}

const MEMORY_ITEMS_POOL = [
  { item: 'Flaming Monster Tire', color: 'text-amber-400' },
  { item: 'Golden Antigravity Key', color: 'text-yellow-400' },
  { item: 'Colossal Roaring Lion', color: 'text-orange-400' },
  { item: 'Neon Crescent Moon', color: 'text-cyan-400' },
  { item: 'Steaming Blackberry Pie', color: 'text-rose-400' },
  { item: 'Giant Silk Red Tie', color: 'text-red-500' },
  { item: 'Diamond Lightning Spear', color: 'text-sky-400' },
  { item: 'Crystal Hourglass of Time', color: 'text-purple-400' },
];

export const MemoryPalaceGame: React.FC<MemoryPalaceGameProps> = ({
  curriculumDay,
  isLockedOut = false,
  onAddXp,
  onCompletePalaceStep,
  onNavigateMode,
  isTaskCompleteToday = false,
  completedLevelsToday = 0,
}) => {
  const palaceConfig = getPalaceConfigForDay(curriculumDay);

  const [palaceLoci] = useState<PalaceLocus[]>(DEFAULT_PALACE_LOCI);
  const [stage, setStage] = useState<'setup' | 'flashing' | 'recalling' | 'review'>('setup');
  const [currentLocusIndex, setCurrentLocusIndex] = useState<number>(0);
  const [assignedItems, setAssignedItems] = useState<{ locusId: number; item: string; color: string }[]>([]);
  const [userRecalls, setUserRecalls] = useState<Record<number, string>>({});
  const [palaceScore, setPalaceScore] = useState<number | null>(null);

  if (isLockedOut) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Memory Palace Locus Walkthrough"
        onNavigateMode={onNavigateMode}
      />
    );
  }

  const startPalaceTour = () => {
    // Take lociCount stations based on today's curriculum day
    const activeLoci = palaceLoci.slice(0, palaceConfig.lociCount);
    // Shuffle pool items
    const shuffledPool = [...MEMORY_ITEMS_POOL].sort(() => 0.5 - Math.random());

    const assignments = activeLoci.map((locus, i) => ({
      locusId: locus.id,
      item: shuffledPool[i % shuffledPool.length].item,
      color: shuffledPool[i % shuffledPool.length].color,
    }));

    setAssignedItems(assignments);
    setUserRecalls({});
    setPalaceScore(null);
    setCurrentLocusIndex(0);
    setStage('flashing');
    sound.playFlash();
  };

  const advancePalaceLocus = () => {
    if (currentLocusIndex < assignedItems.length - 1) {
      sound.playClick();
      setCurrentLocusIndex((i) => i + 1);
    } else {
      sound.playSuccess();
      setStage('recalling');
      setCurrentLocusIndex(0);
    }
  };

  const submitPalaceRecall = (chosenItem: string) => {
    const currentAssigned = assignedItems[currentLocusIndex];
    sound.playClick();

    const updatedRecalls = {
      ...userRecalls,
      [currentAssigned.locusId]: chosenItem,
    };
    setUserRecalls(updatedRecalls);

    if (currentLocusIndex < assignedItems.length - 1) {
      setCurrentLocusIndex((i) => i + 1);
    } else {
      let correct = 0;
      assignedItems.forEach((item) => {
        if (updatedRecalls[item.locusId] === item.item) correct++;
      });
      setPalaceScore(correct);
      setStage('review');

      // 100% PERFECT STRIKE REQUIREMENT:
      // "if i don't make it 100% or perfect strike i will not pass"
      const isPerfectRecall = correct === assignedItems.length;
      if (isPerfectRecall) {
        sound.playLevelUp();
        onAddXp(150);
        onCompletePalaceStep();
      } else {
        sound.playError();
        onAddXp(correct * 15);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Game Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                <Castle className="w-3.5 h-3.5" /> Step 5 of 6 • Method of Loci
              </span>
              <span className="text-[10px] bg-amber-950/70 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-700/60">
                100% Perfect Strike Required
              </span>
              <span className="text-[10px] bg-cyan-950/70 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-700/60">
                2 Levels Required ({completedLevelsToday}/2 Cleared)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Day {curriculumDay} Scope: {palaceConfig.label}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Digital Memory Palace Walkthrough
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Anchor high-contrast visual cues to physical loci in the mental villa. Today&apos;s route: 
              <strong className="text-amber-300 ml-1">{palaceConfig.lociCount} stations</strong>. 100% recall across 2 complete levels required to pass.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Day {curriculumDay} Target
              </div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {palaceConfig.lociCount} Loci
              </div>
            </div>
            {isTaskCompleteToday && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Palace Body */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[620px]">
          {stage === 'setup' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Castle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                The Cognitive Villa: {palaceConfig.lociCount}-Loci Walkthrough
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                You will journey through {palaceConfig.lociCount} sequential rooms in the mental villa. At each locus, a vivid visual anchor will be illuminated. Stroll through the palace and then test your spatial retrieval!
              </p>
              <button
                onClick={startPalaceTour}
                className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer transition-all"
              >
                Start Today's Palace Walk
              </button>
            </div>
          )}

          {/* Tour / Anchoring Phase */}
          {stage === 'flashing' && assignedItems[currentLocusIndex] && (
            <div className="w-full text-center animate-fade-in">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-4 font-mono">
                <span>Locus Station {currentLocusIndex + 1} of {assignedItems.length}</span>
                <span className="text-amber-400 font-bold">{palaceLoci[currentLocusIndex].room}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl mb-6 shadow-inner">
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                  Anchoring at:
                </span>
                <h4 className="text-lg font-bold text-white mb-4">
                  {palaceLoci[currentLocusIndex].name}
                </h4>

                <div className="w-28 h-28 rounded-2xl bg-slate-900 border-2 border-amber-500/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>

                <span className="text-lg font-extrabold text-amber-300 block">
                  {assignedItems[currentLocusIndex].item}
                </span>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Mentally attach this item interacting intensely with the {palaceLoci[currentLocusIndex].name.toLowerCase()}!
                </p>
              </div>

              <button
                onClick={advancePalaceLocus}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                {currentLocusIndex < assignedItems.length - 1 ? (
                  <>Advance to Next Station <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Complete Tour & Test Recall <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          {/* Recalling Phase */}
          {stage === 'recalling' && assignedItems[currentLocusIndex] && (
            <div className="w-full text-center animate-fade-in">
              <div className="text-xs text-slate-400 mb-2 font-mono">
                Station {currentLocusIndex + 1} of {assignedItems.length}
              </div>
              <h4 className="text-lg font-bold text-white mb-1">
                {palaceLoci[currentLocusIndex].name}
              </h4>
              <p className="text-xs text-slate-400 mb-6">
                What item did you anchor here in the {palaceLoci[currentLocusIndex].room}?
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {assignedItems.map((ai) => (
                  <button
                    key={ai.item}
                    onClick={() => submitPalaceRecall(ai.item)}
                    className="py-3.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all hover:border-amber-400 cursor-pointer active:scale-98"
                  >
                    {ai.item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Phase */}
          {stage === 'review' && palaceScore !== null && (
            <div className="w-full text-center animate-fade-in">
              <div className={`w-16 h-16 rounded-full ${palaceScore === assignedItems.length ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'} flex items-center justify-center mx-auto mb-3 font-black text-2xl`}>
                {palaceScore}/{assignedItems.length}
              </div>
              <h4 className="text-xl font-bold text-white mb-1">
                {palaceScore === assignedItems.length ? '100% Flawless Recall Achieved!' : 'Recall Incomplete — Strike Broken'}
              </h4>
              <p className="text-xs text-slate-300 mb-4">
                You successfully retrieved {palaceScore} out of {assignedItems.length} spatial anchors.
              </p>

              {palaceScore === assignedItems.length ? (
                <div className="bg-emerald-950/80 border border-emerald-500/70 p-3 rounded-xl mb-5 text-xs text-emerald-200">
                  <span className="font-bold block text-emerald-300 mb-0.5">
                    ✓ 100% Perfect Recall! Level Passed ({Math.min(2, completedLevelsToday + 1)}/2 Completed)
                  </span>
                  {completedLevelsToday + 1 >= 2
                    ? 'Day protocol requirement satisfied! Both walkthrough levels mastered with zero errors.'
                    : 'Level 1 of 2 cleared! Walk through 1 more level with 100% accuracy to fulfill today’s protocol.'}
                </div>
              ) : (
                <div className="bg-rose-950/80 border border-rose-500/70 p-3 rounded-xl mb-5 text-xs text-rose-200">
                  <span className="font-bold block text-rose-300 mb-0.5">
                    ✗ Level Not Passed — 100% Perfect Strike Required
                  </span>
                  Missed {assignedItems.length - palaceScore} item{assignedItems.length - palaceScore > 1 ? 's' : ''}. Every single locus must be correctly identified to pass. Unlimited retries available!
                </div>
              )}

              <button
                onClick={() => setStage('setup')}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Retrain Palace Route (Unlimited Attempts)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
