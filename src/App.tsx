import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FlashSpeed, UserStats, DailyPQRecord, UserProfile, DailyProtocolState } from './types';
import {
  loadUserStats,
  saveUserStats,
  loadSavedFlashSpeed,
  saveFlashSpeed,
  getRankForXp,
  loadLocalProfile,
  createLocalAthleteProfile,
} from './utils/storage';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { EideticMatrixGame } from './components/EideticMatrixGame';
import { AyumuChimpGame } from './components/AyumuChimpGame';
import { DualNBackGame } from './components/DualNBackGame';
import { MnemonicPegsGame } from './components/MnemonicPegsGame';
import { MemoryPalaceGame } from './components/MemoryPalaceGame';
import { SpacedRepetitionGame } from './components/SpacedRepetitionGame';
import { MnemonicSpeedGame } from './components/MnemonicSpeedGame';
import { SymbolDetectiveGame } from './components/SymbolDetectiveGame';
import { DailyWorkoutGame } from './components/DailyWorkoutGame';
import { DailyProtocolTracker } from './components/DailyProtocolTracker';
import { StatsDashboard } from './components/StatsDashboard';
import { TrainingTipsModal } from './components/TrainingTipsModal';
import { GeniusRoadmapModal } from './components/GeniusRoadmapModal';
import { FlashTimePlanModal } from './components/FlashTimePlanModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DailyMilestoneModal } from './components/DailyMilestoneModal';
import { FreeTrainingView } from './components/FreeTrainingView';
import { loadDailyProtocol, saveDailyProtocol } from './utils/protocol';
import { getPlanSpeedForDay } from './utils/flashPlan';
import { Award, Sparkles, X } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [protocol, setProtocol] = useState(() => loadDailyProtocol());

  // 365-Day Flash Speed Lock State
  const [isSpeedLockedToPlan, setIsSpeedLockedToPlan] = useState<boolean>(() => {
    const savedLock = localStorage.getItem('eidetic_speed_locked_plan');
    return savedLock !== null ? savedLock === 'true' : true;
  });

  const [currentSpeed, setCurrentSpeed] = useState<FlashSpeed>(() => {
    const savedSpeed = loadSavedFlashSpeed();
    return savedSpeed;
  });

  const [activeMode, setActiveMode] = useState<GameMode>('daily-protocol');

  // Free Training State & Level Overrides
  const [freeTrainingConfig, setFreeTrainingConfig] = useState<{
    isFree: boolean;
    level?: number;
    digits?: number;
    nBack?: number;
    loci?: number;
  } | null>(null);

  const handleStartStepWithConfig = (
    mode: GameMode,
    config?: { level?: number; digits?: number; nBack?: number; loci?: number }
  ) => {
    setFreeTrainingConfig({ isFree: true, ...config });
    setActiveMode(mode);
  };

  // Modals
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isFlashPlanOpen, setIsFlashPlanOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Audio State
  const [isSoundMuted, setIsSoundMuted] = useState(sound.isMuted);

  // Level Up Toast
  const [levelUpAlert, setLevelUpAlert] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);

  // Solo Athlete Profile (100% Offline)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    return loadLocalProfile() || createLocalAthleteProfile('Solo Athlete', 'ayumu');
  });

  // Auto-sync stats to local storage
  useEffect(() => {
    saveUserStats(stats);
  }, [stats]);

  // Auto-sync protocol state to local storage
  useEffect(() => {
    saveDailyProtocol(protocol);
  }, [protocol]);

  // 3. Keep speed locked to curriculum day if lock is enabled
  useEffect(() => {
    if (isSpeedLockedToPlan) {
      const planSpeed = getPlanSpeedForDay(protocol.curriculumDay);
      if (currentSpeed !== planSpeed) {
        setCurrentSpeed(planSpeed);
        saveFlashSpeed(planSpeed);
      }
    }
  }, [protocol.curriculumDay, isSpeedLockedToPlan]);

  const handleSpeedChange = (newSpeed: FlashSpeed) => {
    setCurrentSpeed(newSpeed);
    saveFlashSpeed(newSpeed);
  };

  const handleToggleLockToPlan = (locked: boolean) => {
    setIsSpeedLockedToPlan(locked);
    localStorage.setItem('eidetic_speed_locked_plan', String(locked));
    if (locked) {
      const planSpeed = getPlanSpeedForDay(protocol.curriculumDay);
      setCurrentSpeed(planSpeed);
      saveFlashSpeed(planSpeed);
    }
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

  const handleRecordAyumuResult = (isSuccess: boolean, digitsCount: number) => {
    setStats((prev) => {
      const newStreak = isSuccess ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newMaxDigits = isSuccess ? Math.max(prev.ayumuMaxNumbers, digitsCount) : prev.ayumuMaxNumbers;
      const newFastest = isSuccess ? Math.min(prev.fastestFlashMs, currentSpeed) : prev.fastestFlashMs;

      const updatedHistory = [...(prev.progressHistory || [])];
      if (isSuccess && digitsCount > prev.ayumuMaxNumbers) {
        const now = new Date();
        const displayDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        updatedHistory.push({
          id: 'ayumu-' + Date.now(),
          timestamp: now.toISOString(),
          displayDate,
          ayumuMax: newMaxDigits,
          dualNBackMaxN: prev.dualNBackMaxN,
          matrixLevel: prev.matrixMaxLevel,
          notes: `New Ayumu Peak: ${digitsCount} digits`,
        });
      }

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        ayumuMaxNumbers: newMaxDigits,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        fastestFlashMs: newFastest,
        progressHistory: updatedHistory,
      };
    });

    if (isSuccess) {
      setProtocol((prev) => {
        if (prev.isLockedOut) return prev;
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id === 'ayumu-chimp') {
            const nextCount = t.currentCount + 1;
            const target = t.targetCount || 2;
            return {
              ...t,
              currentCount: nextCount,
              isCompleted: nextCount >= target,
            };
          }
          return t;
        });
        const updated = { ...prev, tasks: updatedTasks };
        saveDailyProtocol(updated);
        return updated;
      });
    }
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
    setStats((prev) => {
      const updatedHistory = [...(prev.progressHistory || [])];
      if (level > prev.dualNBackMaxN) {
        const now = new Date();
        const displayDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        updatedHistory.push({
          id: 'nback-' + Date.now(),
          timestamp: now.toISOString(),
          displayDate,
          ayumuMax: prev.ayumuMaxNumbers,
          dualNBackMaxN: level,
          matrixLevel: prev.matrixMaxLevel,
          notes: `New Dual N-Back Peak: N=${level}`,
        });
      }

      return {
        ...prev,
        dualNBackMaxN: Math.max(prev.dualNBackMaxN, level),
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        progressHistory: updatedHistory,
      };
    });
    // Auto-advance daily protocol Dual N-Back task (2 perfect rounds required)
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === 'dual-nback') {
          const nextCount = t.currentCount + 1;
          return { ...t, currentCount: nextCount, isCompleted: nextCount >= t.targetCount };
        }
        return t;
      });
      const updated = { ...prev, tasks: updatedTasks };
      saveDailyProtocol(updated);
      return updated;
    });
  };

  const handleRecordMnemonicConversion = () => {
    setStats((prev) => ({
      ...prev,
      mnemonicConversionCount: prev.mnemonicConversionCount + 1,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const handleCompletePegLevel = () => {
    setStats((prev) => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
    // Auto-advance daily protocol Mnemonic Pegs task (2 levels required)
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === 'mnemonic-pegs') {
          const nextCount = t.currentCount + 1;
          return { ...t, currentCount: nextCount, isCompleted: nextCount >= t.targetCount };
        }
        return t;
      });
      const updated = { ...prev, tasks: updatedTasks };
      saveDailyProtocol(updated);
      return updated;
    });
  };

  const handleCompletePalaceStep = () => {
    setStats((prev) => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
    // Auto-advance daily protocol Memory Palace task (2 levels required)
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === 'memory-palace') {
          const nextCount = t.currentCount + 1;
          return { ...t, currentCount: nextCount, isCompleted: nextCount >= t.targetCount };
        }
        return t;
      });
      const updated = { ...prev, tasks: updatedTasks };
      saveDailyProtocol(updated);
      return updated;
    });
  };

  const handleCardReviewed = () => {
    setStats((prev) => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const handleCompleteSpacedLevel = () => {
    setStats((prev) => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
    // Auto-advance daily protocol Spaced Repetition task (2 levels required)
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === 'spaced-repetition') {
          const nextCount = t.currentCount + 1;
          return { ...t, currentCount: nextCount, isCompleted: nextCount >= t.targetCount };
        }
        return t;
      });
      const updated = { ...prev, tasks: updatedTasks };
      saveDailyProtocol(updated);
      return updated;
    });
  };

  const handleRecordMatrixResult = (isSuccess: boolean, level: number) => {
    if (isSuccess) {
      setProtocol((prev) => {
        if (prev.isLockedOut) return prev;
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id === 'eidetic-matrix') {
            const nextCount = t.currentCount + 1;
            const target = t.targetCount || 2;
            return {
              ...t,
              currentCount: nextCount,
              isCompleted: nextCount >= target,
            };
          }
          return t;
        });
        const updated = { ...prev, tasks: updatedTasks };
        saveDailyProtocol(updated);
        return updated;
      });
    }
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

  const handleSavePQRecord = (record: DailyPQRecord) => {
    setStats((prev) => ({
      ...prev,
      pqHistory: [record, ...prev.pqHistory.slice(0, 19)],
    }));
  };

  // Check if all 6 mandatory tasks in the daily protocol are completed
  const isMilestoneReady = protocol.tasks.length > 0 && protocol.tasks.every((t) => t.isCompleted);
  const prevCompletedCountRef = useRef(protocol.tasks.filter((t) => t.isCompleted).length);

  useEffect(() => {
    const completedCount = protocol.tasks.filter((t) => t.isCompleted).length;
    const isAllComplete = completedCount === protocol.tasks.length && protocol.tasks.length > 0;

    // Trigger milestone celebration modal when 6th task is completed
    if (isAllComplete && prevCompletedCountRef.current < protocol.tasks.length && !protocol.isLockedOut) {
      setIsMilestoneModalOpen(true);
    }
    prevCompletedCountRef.current = completedCount;
  }, [protocol.tasks, protocol.isLockedOut]);

  const handleFinalizeDailyProtocol = () => {
    sound.playMilestoneFanfare();
    const updated: DailyProtocolState = {
      ...protocol,
      isLockedOut: true,
      completedAt: new Date().toISOString(),
      history: {
        ...protocol.history,
        [protocol.currentCycleDate]: {
          completed: true,
          score: 100,
          completedAt: new Date().toISOString(),
        },
      },
    };
    setProtocol(updated);
    saveDailyProtocol(updated);
    handleAddXp(250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        stats={stats}
        currentSpeed={currentSpeed}
        isSpeedLockedToPlan={isSpeedLockedToPlan}
        onSpeedChange={handleSpeedChange}
        onOpenFlashPlan={() => setIsFlashPlanOpen(true)}
        onOpenTips={() => setIsTipsModalOpen(true)}
        onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        curriculumDay={protocol.curriculumDay}
        isLockedOut={protocol.isLockedOut}
        isMilestoneReady={isMilestoneReady}
        onOpenMilestone={() => setIsMilestoneModalOpen(true)}
        currentProfile={currentProfile}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Mode Navigation Tabs */}
      <ModeSelector
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        isLockedOut={protocol.isLockedOut}
      />

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
              className="p-1.5 rounded-lg bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Dynamic View */}
      <main className="flex-1 w-full pb-12">
        {/* Free Practice Active Banner */}
        {freeTrainingConfig?.isFree &&
          !['daily-protocol', 'free-training', 'stats'].includes(activeMode) && (
            <div className="max-w-4xl mx-auto px-4 pt-3 pb-1">
              <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      Free Training Mode Active
                      <span className="text-[10px] bg-cyan-900/80 text-cyan-200 px-2 py-0.5 rounded font-mono font-bold">
                        12 AM Lockout Bypassed
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Unlimited attempts & unlocked level caps. Train deliberate memory instead of doom scrolling.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveMode('free-training');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1"
                  >
                    Training Hub
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setFreeTrainingConfig(null);
                      setActiveMode('daily-protocol');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Back to Daily
                  </button>
                </div>
              </div>
            </div>
          )}

        {activeMode === 'daily-protocol' && (
          <DailyProtocolTracker
            protocol={protocol}
            onUpdateProtocol={setProtocol}
            onNavigateMode={(mode) => {
              if (mode === 'free-training') {
                setFreeTrainingConfig({ isFree: true });
              }
              setActiveMode(mode);
            }}
            onAddXp={handleAddXp}
            onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
            onOpenFlashPlan={() => setIsFlashPlanOpen(true)}
            onOpenMilestone={() => setIsMilestoneModalOpen(true)}
            currentSpeed={currentSpeed}
            isSpeedLockedToPlan={isSpeedLockedToPlan}
          />
        )}

        {activeMode === 'free-training' && (
          <FreeTrainingView
            curriculumDay={protocol.curriculumDay}
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onNavigateMode={(mode) => {
              setFreeTrainingConfig({ isFree: true });
              setActiveMode(mode);
            }}
            onStartStepWithConfig={handleStartStepWithConfig}
            onAddXp={handleAddXp}
          />
        )}

        {activeMode === 'eidetic-matrix' && (
          <EideticMatrixGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            initialLevel={freeTrainingConfig?.level}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordMatrixResult}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'eidetic-matrix')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'eidetic-matrix')?.currentCount || 0}
          />
        )}

        {activeMode === 'ayumu-chimp' && (
          <AyumuChimpGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            initialDigits={freeTrainingConfig?.digits}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordAyumuResult}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'ayumu-chimp')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'ayumu-chimp')?.currentCount || 0}
          />
        )}

        {activeMode === 'dual-nback' && (
          <DualNBackGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            initialN={freeTrainingConfig?.nBack}
            onAddXp={handleAddXp}
            onRecordNBackMax={handleRecordNBackMax}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'dual-nback')?.isCompleted}
            completedRoundsToday={protocol.tasks.find((t) => t.id === 'dual-nback')?.currentCount || 0}
          />
        )}

        {activeMode === 'mnemonic-pegs' && (
          <MnemonicPegsGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
            onCompletePegLevel={handleCompletePegLevel}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.currentCount || 0}
          />
        )}

        {activeMode === 'memory-palace' && (
          <MemoryPalaceGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            initialLoci={freeTrainingConfig?.loci}
            onAddXp={handleAddXp}
            onCompletePalaceStep={handleCompletePalaceStep}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'memory-palace')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'memory-palace')?.currentCount || 0}
          />
        )}

        {activeMode === 'spaced-repetition' && (
          <SpacedRepetitionGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={freeTrainingConfig?.isFree}
            onAddXp={handleAddXp}
            onCardReviewed={handleCardReviewed}
            onCompleteSpacedLevel={handleCompleteSpacedLevel}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'spaced-repetition')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'spaced-repetition')?.currentCount || 0}
          />
        )}

        {activeMode === 'mnemonic-speed' && (
          <MnemonicPegsGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
            onCompletePegLevel={handleCompletePegLevel}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted}
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.currentCount || 0}
          />
        )}

        {activeMode === 'symbol-detective' && (
          <SymbolDetectiveGame
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordDetectiveResult}
            curriculumDay={protocol.curriculumDay}
            playerLevel={stats.level}
          />
        )}

        {activeMode === 'daily-workout' && (
          <DailyWorkoutGame
            stats={stats}
            curriculumDay={protocol.curriculumDay}
            onAddXp={handleAddXp}
            onSavePQRecord={handleSavePQRecord}
          />
        )}

        {activeMode === 'stats' && <StatsDashboard stats={stats} />}
      </main>

      {/* 365-Day Flash Time Plan & Speed Lock Modal */}
      <FlashTimePlanModal
        isOpen={isFlashPlanOpen}
        onClose={() => setIsFlashPlanOpen(false)}
        currentDay={protocol.curriculumDay}
        currentSpeed={currentSpeed}
        isSpeedLockedToPlan={isSpeedLockedToPlan}
        onToggleLockToPlan={handleToggleLockToPlan}
        onSetSpeed={handleSpeedChange}
      />

      {/* Solo Athlete Profile & Offline Settings Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={currentProfile}
        stats={stats}
        currentSpeed={currentSpeed}
        isSpeedLockedToPlan={isSpeedLockedToPlan}
        curriculumDay={protocol.curriculumDay}
        onUpdateProfile={(updated) => setCurrentProfile(updated)}
      />

      {/* Scientific Technique Guide Modal */}
      <TrainingTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />

      {/* 365-Day Genius Roadmap & Milestone Modal */}
      <GeniusRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
        currentDay={protocol.curriculumDay}
      />

      {/* Daily Milestone Celebration Modal with Confetti */}
      <DailyMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        curriculumDay={protocol.curriculumDay}
        currentStreak={stats.currentStreak || protocol.curriculumDay}
        tasks={protocol.tasks}
        isLockedOut={protocol.isLockedOut}
        onFinalizeProtocol={handleFinalizeDailyProtocol}
        onOpenFreeTraining={() => {
          setIsMilestoneModalOpen(false);
          setFreeTrainingConfig({ isFree: true });
          setActiveMode('free-training');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500 safe-bottom">
        <p>
          Photographic Memory Master • 365-Day Retinal Snapshot & Iconic Flash Laboratory
        </p>
      </footer>
    </div>
  );
}
