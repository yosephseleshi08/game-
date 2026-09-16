import React, { useState } from 'react';
import { SpacedCard, GameMode } from '../types';
import { loadSpacedCards, saveSpacedCards, calculateSM2 } from '../utils/storage';
import { sound } from '../utils/audio';
import { getSpacedCardQuotaForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import {
  Layers,
  CheckCircle2,
  Eye,
  Sparkles,
  Trophy,
  RotateCcw,
  Clock,
  Flame,
} from 'lucide-react';

interface SpacedRepetitionGameProps {
  curriculumDay: number;
  isLockedOut?: boolean;
  onAddXp: (amount: number) => void;
  onCardReviewed: () => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
}

export const SpacedRepetitionGame: React.FC<SpacedRepetitionGameProps> = ({
  curriculumDay,
  isLockedOut = false,
  onAddXp,
  onCardReviewed,
  onNavigateMode,
  isTaskCompleteToday = false,
}) => {
  const spacedConfig = getSpacedCardQuotaForDay(curriculumDay);

  const [cards, setCards] = useState<SpacedCard[]>(() => loadSpacedCards());
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [reviewedCountToday, setReviewedCountToday] = useState<number>(0);

  if (isLockedOut) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Spaced Repetition SM-2"
        onNavigateMode={onNavigateMode}
      />
    );
  }

  const dueCards = cards.length > 0 ? cards : [];
  const currentCard = dueCards[currentCardIndex % (dueCards.length || 1)];

  const handleSM2Rating = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;
    sound.playClick();

    const updatedCard = calculateSM2(currentCard, quality);
    const newCards = cards.map((c) => (c.id === currentCard.id ? updatedCard : c));
    setCards(newCards);
    saveSpacedCards(newCards);

    const nextReviewed = reviewedCountToday + 1;
    setReviewedCountToday(nextReviewed);
    onCardReviewed();

    if (quality >= 3) {
      onAddXp(25);
    }

    if (nextReviewed === spacedConfig.targetCards) {
      sound.playLevelUp();
    }

    setIsAnswerRevealed(false);
    setCurrentCardIndex((i) => (i + 1) % dueCards.length);
  };

  const isQuotaReached = reviewedCountToday >= spacedConfig.targetCards || isTaskCompleteToday;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Step 6 of 6 • Active Recall
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Day {curriculumDay} Quota: {spacedConfig.label}
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-800/60">
                Unlimited Practice
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Spaced Repetition SM-2 Flashcards
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Scientific SuperMemo algorithm calculated review intervals. Today's prescribed review dosage: 
              <strong className="text-purple-300 ml-1">{spacedConfig.targetCards} memory cards</strong>.
              Reviewing beyond today's quota yields diminishing returns; sleep consolidates memory.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Today's Cards Reviewed
              </div>
              <div className="text-lg font-black text-purple-400 font-mono">
                {reviewedCountToday} / {spacedConfig.targetCards}
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

      {/* Flashcard Area */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
          {isQuotaReached && (
            <div className="w-full mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                Day {curriculumDay} SM-2 Quota Mastered!
              </div>
              <p className="text-[11px] text-slate-300">
                You met today's memory review requirement ({spacedConfig.targetCards} cards). Additional cards and interval updates are strictly scheduled for tomorrow.
              </p>
            </div>
          )}

          {currentCard && (
            <>
              <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-4">
                <span className="bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-800 font-semibold text-[11px]">
                  {currentCard.category}
                </span>
                <span className="font-mono text-slate-400">
                  Card {(currentCardIndex % dueCards.length) + 1} of {dueCards.length}
                </span>
              </div>

              {/* Flashcard Body */}
              <div className="w-full p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center mb-6 min-h-[170px] flex flex-col justify-center shadow-inner">
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
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
                      className="py-2.5 px-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-all text-center cursor-pointer active:scale-98"
                    >
                      Again
                      <span className="text-[9px] block text-rose-400/80 font-normal">1 Day</span>
                    </button>
                    <button
                      onClick={() => handleSM2Rating(3)}
                      className="py-2.5 px-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs transition-all text-center cursor-pointer active:scale-98"
                    >
                      Hard
                      <span className="text-[9px] block text-amber-400/80 font-normal">3 Days</span>
                    </button>
                    <button
                      onClick={() => handleSM2Rating(4)}
                      className="py-2.5 px-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition-all text-center cursor-pointer active:scale-98"
                    >
                      Good
                      <span className="text-[9px] block text-emerald-400/80 font-normal">7 Days</span>
                    </button>
                    <button
                      onClick={() => handleSM2Rating(5)}
                      className="py-2.5 px-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-xs transition-all text-center cursor-pointer active:scale-98"
                    >
                      Easy
                      <span className="text-[9px] block text-cyan-400/80 font-normal">14+ Days</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
