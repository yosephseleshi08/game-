import React, { useState, useEffect } from 'react';
import { GameMode, FlashSpeed, UserStats, DailyPQRecord } from './types';
import {
  loadUserStats,
  saveUserStats,
  loadSavedFlashSpeed,
  saveFlashSpeed,
  getRankForXp,
} from './utils/storage';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { EideticMatrixGame } from './components/EideticMatrixGame';
import { AyumuChimpGame } from './components/AyumuChimpGame';
import { DualNBackGame } from './components/DualNBackGame';
import { MnemonicSpeedGame } from './components/MnemonicSpeedGame';
import { SymbolDetectiveGame } from './components/SymbolDetectiveGame';
import { DailyWorkoutGame } from './components/DailyWorkoutGame';
import { StatsDashboard } from './components/StatsDashboard';
import { TrainingTipsModal } from './components/TrainingTipsModal';
import { Award, Sparkles, X } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [currentSpeed, setCurrentSpeed] = useState<FlashSpeed>(() => loadSavedFlashSpeed());
  const [activeMode, setActiveMode] = useState<GameMode>('eidetic-matrix');
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(sound.isMuted);

  // Level Up Toast
  const [levelUpAlert, setLevelUpAlert] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);

  // Auto-sync stats to localStorage
  useEffect(() => {
    saveUserStats(stats);
  }, [stats]);

  const handleSpeedChange = (newSpeed: FlashSpeed) => {
    setCurrentSpeed(newSpeed);
    saveFlashSpeed(newSpeed);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsSoundMuted(muted);
  };

  const handleAddXp = (amount: number) => {
    setStats((prev) => {
      const oldRank = getRankForXp(prev.xp).currentRank;
      const newXp = prev.xp + amount;
      const newRank = getRankForXp(newXp).currentRank;

      if (newRank.level > oldRank.level) {
        sound.playLevelUp();
        setLevelUpAlert({
          oldLevel: oldRank.level,
          newLevel: newRank.level,
          title: newRank.title,
        });
      }

      return {
        ...prev,
        xp: newXp,
        level: newRank.level,
      };
    });
  };

  const handleRecordMatrixResult = (isSuccess: boolean, level: number) => {
    setStats((prev) => {
      const newStreak = isSuccess ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newMaxLevel = isSuccess ? Math.max(prev.matrixMaxLevel, level) : prev.matrixMaxLevel;
      const newFastest = isSuccess ? Math.min(prev.fastestFlashMs, currentSpeed) : prev.fastestFlashMs;

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        matrixMaxLevel: newMaxLevel,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        fastestFlashMs: newFastest,
      };
    });
  };

  const handleRecordAyumuResult = (isSuccess: boolean, digitsCount: number) => {
    setStats((prev) => {
      const newStreak = isSuccess ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newMaxDigits = isSuccess ? Math.max(prev.ayumuMaxNumbers, digitsCount) : prev.ayumuMaxNumbers;
      const newFastest = isSuccess ? Math.min(prev.fastestFlashMs, currentSpeed) : prev.fastestFlashMs;

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        ayumuMaxNumbers: newMaxDigits,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        fastestFlashMs: newFastest,
      };
    });
  };

  const handleRecordDetectiveResult = (isSuccess: boolean, score: number) => {
    setStats((prev) => {
      const newStreak = isSuccess ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newHighScore = Math.max(prev.detectiveHighScore, score);

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        detectiveHighScore: newHighScore,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
      };
    });
  };

  const handleRecordNBackMax = (level: number) => {
    setStats((prev) => ({
      ...prev,
      dualNBackMaxN: Math.max(prev.dualNBackMaxN, level),
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const handleRecordMnemonicConversion = () => {
    setStats((prev) => ({
      ...prev,
      mnemonicConversionCount: prev.mnemonicConversionCount + 1,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const handleSavePQRecord = (record: DailyPQRecord) => {
    setStats((prev) => ({
      ...prev,
      pqHistory: [record, ...prev.pqHistory.slice(0, 19)],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        stats={stats}
        currentSpeed={currentSpeed}
        onSpeedChange={handleSpeedChange}
        onOpenTips={() => setIsTipsModalOpen(true)}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Mode Navigation Tabs */}
      <ModeSelector activeMode={activeMode} onSelectMode={setActiveMode} />

      {/* Level Up Banner Alert */}
      {levelUpAlert && (
        <div className="max-w-xl mx-auto px-4 mt-3 w-full animate-bounce">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-slate-950/20 text-white">
                <Award className="w-5 h-5 fill-amber-300 text-amber-200" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block font-extrabold text-slate-950">
                  Mastery Rank Ascended!
                </span>
                <span className="text-sm font-black text-white">
                  Level {levelUpAlert.newLevel}: {levelUpAlert.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setLevelUpAlert(null)}
              className="p-1.5 rounded-lg bg-slate-950/10 hover:bg-slate-950/20 text-slate-950"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Dynamic View */}
      <main className="flex-1 w-full pb-12">
        {activeMode === 'eidetic-matrix' && (
          <EideticMatrixGame
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordMatrixResult}
          />
        )}

        {activeMode === 'ayumu-chimp' && (
          <AyumuChimpGame
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordAyumuResult}
          />
        )}

        {activeMode === 'dual-nback' && (
          <DualNBackGame
            onAddXp={handleAddXp}
            onRecordNBackMax={handleRecordNBackMax}
          />
        )}

        {activeMode === 'mnemonic-speed' && (
          <MnemonicSpeedGame
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
          />
        )}

        {activeMode === 'symbol-detective' && (
          <SymbolDetectiveGame
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordDetectiveResult}
          />
        )}

        {activeMode === 'daily-workout' && (
          <DailyWorkoutGame
            stats={stats}
            onAddXp={handleAddXp}
            onSavePQRecord={handleSavePQRecord}
          />
        )}

        {activeMode === 'stats' && <StatsDashboard stats={stats} />}
      </main>

      {/* Scientific Technique Guide Modal */}
      <TrainingTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Photographic Memory Master • Eidetic & Iconic Memory Cognitive Training Laboratory
        </p>
      </footer>
    </div>
  );
}
