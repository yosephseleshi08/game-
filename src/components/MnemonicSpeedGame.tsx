import React, { useState, useEffect, useRef } from 'react';
import {
  MajorPeg,
  PalaceLocus,
  SpacedCard,
} from '../types';
import {
  MAJOR_SYSTEM_PEGS,
  DEFAULT_PALACE_LOCI,
  loadSpacedCards,
  saveSpacedCards,
  calculateSM2,
} from '../utils/storage';
import { sound } from '../utils/audio';
import {
  Zap,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
  Flame,
  Castle,
  Layers,
  ArrowRight,
  Eye,
  HelpCircle,
} from 'lucide-react';

interface MnemonicSpeedGameProps {
  onAddXp: (amount: number) => void;
  onRecordMnemonicConversion: () => void;
}

export const MnemonicSpeedGame: React.FC<MnemonicSpeedGameProps> = ({
  onAddXp,
  onRecordMnemonicConversion,
}) => {
  const [subTab, setSubTab] = useState<'peg-drill' | 'palace-walk' | 'spaced-repetition'>('peg-drill');

  // --- Peg Speed Drill State ---
  const [currentPeg, setCurrentPeg] = useState<MajorPeg | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [pegStartTime, setPegStartTime] = useState<number>(0);
  const [pegReactionMs, setPegReactionMs] = useState<number | null>(null);
  const [pegStreak, setPegStreak] = useState<number>(0);
  const [drillScore, setDrillScore] = useState<number>(0);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // --- Memory Palace State ---
  const [palaceLoci, setPalaceLoci] = useState<PalaceLocus[]>(DEFAULT_PALACE_LOCI);
  const [palaceStage, setPalaceStage] = useState<'setup' | 'flashing' | 'recalling' | 'review'>('setup');
  const [currentLocusIndex, setCurrentLocusIndex] = useState<number>(0);
  const [assignedItems, setAssignedItems] = useState<{ locusId: number; item: string; color: string }[]>([]);
  const [userRecalls, setUserRecalls] = useState<Record<number, string>>({});
  const [palaceScore, setPalaceScore] = useState<number | null>(null);

  // --- Spaced Repetition (SM-2) State ---
  const [cards, setCards] = useState<SpacedCard[]>(() => loadSpacedCards());
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Filter cards due for review (or show all for training)
  const dueCards = cards; // Keep all accessible for deliberate training

  // --- Peg Drill Engine ---
  const nextPegDrill = () => {
    const target = MAJOR_SYSTEM_PEGS[Math.floor(Math.random() * MAJOR_SYSTEM_PEGS.length)];
    const otherWords = MAJOR_SYSTEM_PEGS.filter((p) => p.word !== target.word).map((p) => p.word);
    const shuffledChoices = [target.word, ...otherWords.slice(0, 3)].sort(() => 0.5 - Math.random());

    setCurrentPeg(target);
    setOptions(shuffledChoices);
    setPegStartTime(Date.now());
    setPegReactionMs(null);
  };

  useEffect(() => {
    if (subTab === 'peg-drill') {
      nextPegDrill();
    }
  }, [subTab]);

  const handleSelectPegAnswer = (word: string) => {
    if (!currentPeg) return;
    const elapsed = Date.now() - pegStartTime;
    setPegReactionMs(elapsed);

    if (word === currentPeg.word) {
      sound.playSuccess();
      const speedBonus = elapsed < 1200 ? 15 : 5;
      onAddXp(20 + speedBonus);
      setPegStreak((s) => s + 1);
      setDrillScore((s) => s + 1);
      onRecordMnemonicConversion();
      setTimeout(nextPegDrill, 450);
    } else {
      sound.playError();
      setPegStreak(0);
      setTimeout(nextPegDrill, 900);
    }
  };

  // --- Memory Palace Engine (Randomized Villa Walkthrough)
  const PALACE_ITEMS_POOL = [
    { item: 'Flaming Monster Tire', color: 'text-amber-400' },
    { item: 'Golden Antigravity Key', color: 'text-yellow-400' },
    { item: 'Colossal Roaring Lion', color: 'text-orange-400' },
    { item: 'Neon Crescent Moon', color: 'text-cyan-400' },
    { item: 'Steaming Blackberry Pie', color: 'text-rose-400' },
    { item: 'Giant Silk Red Tie', color: 'text-red-500' },
    { item: 'Diamond Lightning Spear', color: 'text-sky-400' },
    { item: 'Crystal Hourglass of Time', color: 'text-purple-400' },
    { item: 'Levitating Grand Clock', color: 'text-emerald-400' },
    { item: 'Obsidian Flying Eagle', color: 'text-slate-300' },
    { item: 'Glowing Plasma Torch', color: 'text-cyan-300' },
    { item: 'Ancient Golden Chalice', color: 'text-yellow-300' },
  ];

  const [activeTourLoci, setActiveTourLoci] = useState<PalaceLocus[]>([]);
  const [currentRecallOptions, setCurrentRecallOptions] = useState<string[]>([]);

  const startPalaceTour = () => {
    // Randomly sample 6 distinct loci from the villa and shuffle their order
    const shuffledLoci = [...DEFAULT_PALACE_LOCI].sort(() => 0.5 - Math.random()).slice(0, 6);
    const shuffledPool = [...PALACE_ITEMS_POOL].sort(() => 0.5 - Math.random());

    const assignments = shuffledLoci.map((locus, i) => ({
      locusId: locus.id,
      item: shuffledPool[i % shuffledPool.length].item,
      color: shuffledPool[i % shuffledPool.length].color,
    }));

    setActiveTourLoci(shuffledLoci);
    setAssignedItems(assignments);
    setUserRecalls({});
    setPalaceScore(null);
    setCurrentLocusIndex(0);
    setPalaceStage('flashing');
    sound.playFlash();
  };

  const advancePalaceLocus = () => {
    if (currentLocusIndex < assignedItems.length - 1) {
      sound.playClick();
      setCurrentLocusIndex((i) => i + 1);
    } else {
      // Completed viewing tour, switch to recall mode with randomized options
      sound.playSuccess();
      setPalaceStage('recalling');
      setCurrentLocusIndex(0);
      setupRecallOptions(0, assignedItems);
    }
  };

  const setupRecallOptions = (index: number, items: { locusId: number; item: string; color: string }[]) => {
    if (!items[index]) return;
    const correct = items[index].item;
    const otherAssigned = items.filter((_, i) => i !== index).map((it) => it.item);
    const distractors = PALACE_ITEMS_POOL.filter((p) => p.item !== correct && !otherAssigned.includes(p.item)).map((p) => p.item);
    const poolChoices = [...otherAssigned, ...distractors];
    const shuffledPoolChoices = poolChoices.sort(() => 0.5 - Math.random()).slice(0, 3);
    const fourChoices = [correct, ...shuffledPoolChoices].sort(() => 0.5 - Math.random());
    setCurrentRecallOptions(fourChoices);
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
      const nextIdx = currentLocusIndex + 1;
      setCurrentLocusIndex(nextIdx);
      setupRecallOptions(nextIdx, assignedItems);
    } else {
      // Finished all loci recall, calculate score
      let correct = 0;
      assignedItems.forEach((item) => {
        if (updatedRecalls[item.locusId] === item.item) correct++;
      });
      setPalaceScore(correct);
      setPalaceStage('review');
      if (correct >= 5) {
        sound.playLevelUp();
        onAddXp(100);
      } else {
        sound.playSuccess();
        onAddXp(correct * 15);
      }
    }
  };

  // --- Spaced Repetition (SM-2) Engine ---
  const currentCard = dueCards[currentCardIndex % dueCards.length];

  const handleSM2Rating = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;
    sound.playClick();

    const updatedCard = calculateSM2(currentCard, quality);
    const newCards = cards.map((c) => (c.id === currentCard.id ? updatedCard : c));
    setCards(newCards);
    saveSpacedCards(newCards);

    if (quality >= 3) {
      onAddXp(25);
    }

    setIsAnswerRevealed(false);
    setCurrentCardIndex((i) => (i + 1) % dueCards.length);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Sub-navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> High-Speed Mnemonic Engine
              </span>
              <span className="text-xs text-slate-400">
                Visual Conversion Automation
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Mnemonic Palace & Peg Speed Drills
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Eliminate conversion latency between abstract numbers, code symbols, and vivid mental images.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                sound.playClick();
                setSubTab('peg-drill');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'peg-drill'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Peg Drill
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSubTab('palace-walk');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'palace-walk'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Castle className="w-3.5 h-3.5" />
              Memory Palace
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSubTab('spaced-repetition');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'spaced-repetition'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Spaced SM-2
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: Peg Speed Conversion Drill */}
      {subTab === 'peg-drill' && (
        <div className="flex flex-col items-center">
          <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
            {/* Status bar */}
            <div className="w-full flex justify-between items-center mb-6 text-xs">
              <span className="text-slate-400">
                Streak: <strong className="text-amber-400 font-bold">{pegStreak}</strong>
              </span>
              <button
                onClick={() => setIsCheatSheetOpen(!isCheatSheetOpen)}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {isCheatSheetOpen ? 'Hide Phonetic Rules' : 'Phonetic Cheat Sheet'}
              </button>
            </div>

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
                  className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white font-bold text-sm transition-all hover:border-amber-400 shadow-sm active:scale-98"
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
      )}

      {/* SUB-TAB 2: Digital Memory Palace Architect */}
      {subTab === 'palace-walk' && (
        <div className="flex flex-col items-center">
          <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[620px]">
            {palaceStage === 'setup' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                  <Castle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  The Cognitive Villa: 6-Loci Walkthrough
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                  You will journey through 6 distinct stations in the villa. At each locus, a vivid visual item will be anchored. Stroll through the palace and recall each item!
                </p>
                <button
                  onClick={startPalaceTour}
                  className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-98"
                >
                  Start Palace Tour
                </button>
              </div>
            )}

            {/* Flashing / Tour Phase */}
            {palaceStage === 'flashing' && assignedItems[currentLocusIndex] && (
              <div className="w-full text-center animate-fade-in">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-4 font-mono">
                  <span>Locus Station {currentLocusIndex + 1} of {assignedItems.length}</span>
                  <span className="text-amber-400 font-bold">{(activeTourLoci[currentLocusIndex] || DEFAULT_PALACE_LOCI[0]).room}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl mb-6">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                    Anchoring at:
                  </span>
                  <h4 className="text-lg font-bold text-white mb-4">
                    {(activeTourLoci[currentLocusIndex] || DEFAULT_PALACE_LOCI[0]).name}
                  </h4>

                  <div className="w-28 h-28 rounded-2xl bg-slate-900 border-2 border-amber-500/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                  </div>

                  <span className="text-base font-extrabold text-amber-300 block">
                    {assignedItems[currentLocusIndex].item}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Mentally visualize this item sitting directly on the {(activeTourLoci[currentLocusIndex] || DEFAULT_PALACE_LOCI[0]).name.toLowerCase()}!
                  </p>
                </div>

                <button
                  onClick={advancePalaceLocus}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
            {palaceStage === 'recalling' && assignedItems[currentLocusIndex] && (
              <div className="w-full text-center animate-fade-in">
                <div className="text-xs text-slate-400 mb-2 font-mono">
                  Station {currentLocusIndex + 1} of {assignedItems.length}
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {(activeTourLoci[currentLocusIndex] || DEFAULT_PALACE_LOCI[0]).name}
                </h4>
                <p className="text-xs text-slate-400 mb-6">
                  What item did you anchor here in the {(activeTourLoci[currentLocusIndex] || DEFAULT_PALACE_LOCI[0]).room}?
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(currentRecallOptions.length > 0 ? currentRecallOptions : assignedItems.map((a) => a.item)).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => submitPalaceRecall(opt)}
                      className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all hover:border-amber-400 cursor-pointer active:scale-98"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Review Phase */}
            {palaceStage === 'review' && palaceScore !== null && (
              <div className="w-full text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-3 text-emerald-400 font-black text-2xl">
                  {palaceScore}/{assignedItems.length}
                </div>
                <h4 className="text-xl font-bold text-white mb-1">
                  Palace Walkthrough Complete!
                </h4>
                <p className="text-xs text-slate-300 mb-6">
                  You successfully retrieved {palaceScore} out of {assignedItems.length} spatial anchors.
                </p>

                <button
                  onClick={() => setPalaceStage('setup')}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                >
                  Train Another Palace Route
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Active Spaced Repetition (SuperMemo SM-2) */}
      {subTab === 'spaced-repetition' && currentCard && (
        <div className="flex flex-col items-center">
          <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
            <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-4">
              <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-semibold">
                {currentCard.category}
              </span>
              <span className="font-mono">
                Card {currentCardIndex + 1} of {dueCards.length}
              </span>
            </div>

            {/* Flashcard Body */}
            <div className="w-full p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center mb-6 min-h-[160px] flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">Prompt</span>
              <h4 className="text-base font-bold text-white mb-3 leading-snug">
                {currentCard.prompt}
              </h4>

              {isAnswerRevealed && (
                <div className="border-t border-slate-800 pt-4 mt-2 animate-fade-in">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 mb-1 block">Answer</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {currentCard.answer}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isAnswerRevealed ? (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsAnswerRevealed(true);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Reveal Answer & Self-Rate
              </button>
            ) : (
              <div className="w-full">
                <span className="text-[10px] text-slate-400 block text-center mb-2 uppercase font-bold">
                  Rate Recall Effort (SuperMemo SM-2 Interval Calculation)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSM2Rating(1)}
                    className="py-2.5 px-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-all text-center"
                  >
                    Again
                    <span className="text-[9px] block text-rose-400/80 font-normal">1 Day</span>
                  </button>
                  <button
                    onClick={() => handleSM2Rating(3)}
                    className="py-2.5 px-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs transition-all text-center"
                  >
                    Hard
                    <span className="text-[9px] block text-amber-400/80 font-normal">3 Days</span>
                  </button>
                  <button
                    onClick={() => handleSM2Rating(4)}
                    className="py-2.5 px-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition-all text-center"
                  >
                    Good
                    <span className="text-[9px] block text-emerald-400/80 font-normal">7 Days</span>
                  </button>
                  <button
                    onClick={() => handleSM2Rating(5)}
                    className="py-2.5 px-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-xs transition-all text-center"
                  >
                    Easy
                    <span className="text-[9px] block text-cyan-400/80 font-normal">14+ Days</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
