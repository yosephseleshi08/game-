import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FlashSpeed, UserStats, DailyPQRecord, UserProfile, DailyProtocolState } from './types';
import {
  loadUserStats,
  saveUserStats,
  loadSavedFlashSpeed,
  saveFlashSpeed,
  getRankForXp,
  loadLocalProfile,
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
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CommunityPlayersView } from './components/CommunityPlayersView';
import { DailyMilestoneModal } from './components/DailyMilestoneModal';
import { loadDailyProtocol, saveDailyProtocol } from './utils/protocol';
import { getPlanSpeedForDay } from './utils/flashPlan';
import {
  subscribeToAuth,
  getUserProfile,
  saveUserProfile,
  loadUserCloudData,
  saveUserCloudData,
} from './utils/firebase';
import { User } from 'firebase/auth';
import { Award, Sparkles, X, ShieldCheck } from 'lucide-react';

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

  // Modals
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isFlashPlanOpen, setIsFlashPlanOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Audio State
  const [isSoundMuted, setIsSoundMuted] = useState(sound.isMuted);

  // Level Up Toast
  const [levelUpAlert, setLevelUpAlert] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(() => loadLocalProfile());
  const [authInitialized, setAuthInitialized] = useState(false);

  // Ref to prevent initial overwrite loops
  const isSyncingFromCloud = useRef(false);

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);

      if (user) {
        try {
          // Fetch public profile
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setCurrentProfile(profile);
            if (profile.lockedFlashSpeed) {
              setCurrentSpeed(profile.lockedFlashSpeed);
              saveFlashSpeed(profile.lockedFlashSpeed);
            }
            if (typeof profile.isSpeedLockedToPlan === 'boolean') {
              setIsSpeedLockedToPlan(profile.isSpeedLockedToPlan);
              localStorage.setItem('eidetic_speed_locked_plan', String(profile.isSpeedLockedToPlan));
            }
          }

          // Fetch private cloud data (stats, protocol)
          const cloudData = await loadUserCloudData(user.uid);
          if (cloudData) {
            isSyncingFromCloud.current = true;
            if (cloudData.stats) {
              setStats((prev) => ({
                ...prev,
                ...cloudData.stats,
                // keep the higher of local or cloud xp to avoid any regression
                xp: Math.max(prev.xp, cloudData.stats?.xp || 0),
                level: Math.max(prev.level, cloudData.stats?.level || 1),
                bestStreak: Math.max(prev.bestStreak, cloudData.stats?.bestStreak || 0),
                ayumuMaxNumbers: Math.max(prev.ayumuMaxNumbers, cloudData.stats?.ayumuMaxNumbers || 4),
                matrixMaxLevel: Math.max(prev.matrixMaxLevel, cloudData.stats?.matrixMaxLevel || 4),
              }));
            }
            if (cloudData.protocol) {
              setProtocol((prev) => ({
                ...prev,
                ...cloudData.protocol,
                curriculumDay: Math.max(prev.curriculumDay, cloudData.protocol?.curriculumDay || 1),
              }));
            }
            setTimeout(() => {
              isSyncingFromCloud.current = false;
            }, 500);
          }
        } catch (err) {
          console.error('Error fetching cloud profile:', err);
        }
      } else {
        const local = loadLocalProfile();
        setCurrentProfile(local);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Auto-sync stats to local storage & cloud
  useEffect(() => {
    saveUserStats(stats);

    if (currentUser && !isSyncingFromCloud.current) {
      const syncTimeout = setTimeout(() => {
        saveUserCloudData(currentUser.uid, stats, protocol).catch(console.error);

        // Also keep public profile updated with key leaderboard stats
        if (currentProfile) {
          const rank = getRankForXp(stats.xp).currentRank;
          const updatedProfile: UserProfile = {
            ...currentProfile,
            level: stats.level,
            xp: stats.xp,
            rankTitle: rank.title,
            curriculumDay: protocol.curriculumDay,
            currentStreak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            ayumuMaxNumbers: stats.ayumuMaxNumbers,
            matrixMaxLevel: stats.matrixMaxLevel,
            dualNBackMaxN: stats.dualNBackMaxN,
            fastestFlashMs: stats.fastestFlashMs,
            detectiveHighScore: stats.detectiveHighScore,
            lockedFlashSpeed: currentSpeed,
            isSpeedLockedToPlan,
            updatedAt: new Date().toISOString(),
          };
          saveUserProfile(currentUser.uid, updatedProfile).catch(console.error);
        }
      }, 1500);

      return () => clearTimeout(syncTimeout);
    }
  }, [stats, protocol, currentUser, currentSpeed, isSpeedLockedToPlan]);

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
            const nextDigits = Math.max(t.currentCount, digitsCount);
            const target = t.targetCount || 4;
            return {
              ...t,
              currentCount: nextDigits,
              isCompleted: nextDigits >= target,
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
    // Auto-advance daily protocol Dual N-Back task
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === 'dual-nback' ? { ...t, currentCount: t.currentCount + 1, isCompleted: true } : t
      );
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
    // Auto-advance daily protocol Mnemonic Pegs task
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
    // Auto-advance daily protocol Memory Palace task
    setProtocol((prev) => {
      if (prev.isLockedOut) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === 'memory-palace' ? { ...t, currentCount: t.targetCount, isCompleted: true } : t
      );
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
    // Auto-advance daily protocol Spaced Repetition task
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
            const nextLevel = Math.max(t.currentCount, level);
            const target = t.targetCount || 4;
            return {
              ...t,
              currentCount: nextLevel,
              isCompleted: nextLevel >= target,
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

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
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
        currentUser={currentUser}
        currentProfile={currentProfile}
        onOpenAuth={openAuth}
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
        {activeMode === 'daily-protocol' && (
          <DailyProtocolTracker
            protocol={protocol}
            onUpdateProtocol={setProtocol}
            onNavigateMode={setActiveMode}
            onAddXp={handleAddXp}
            onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
            onOpenFlashPlan={() => setIsFlashPlanOpen(true)}
            onOpenMilestone={() => setIsMilestoneModalOpen(true)}
            currentSpeed={currentSpeed}
            isSpeedLockedToPlan={isSpeedLockedToPlan}
          />
        )}

        {activeMode === 'eidetic-matrix' && (
          <EideticMatrixGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordMatrixResult}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'eidetic-matrix')?.isCompleted}
          />
        )}

        {activeMode === 'ayumu-chimp' && (
          <AyumuChimpGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={handleRecordAyumuResult}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'ayumu-chimp')?.isCompleted}
          />
        )}

        {activeMode === 'dual-nback' && (
          <DualNBackGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onRecordNBackMax={handleRecordNBackMax}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'dual-nback')?.isCompleted}
          />
        )}

        {activeMode === 'mnemonic-pegs' && (
          <MnemonicPegsGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted}
          />
        )}

        {activeMode === 'memory-palace' && (
          <MemoryPalaceGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onCompletePalaceStep={handleCompletePalaceStep}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'memory-palace')?.isCompleted}
          />
        )}

        {activeMode === 'spaced-repetition' && (
          <SpacedRepetitionGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onCardReviewed={handleCardReviewed}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'spaced-repetition')?.isCompleted}
          />
        )}

        {activeMode === 'mnemonic-speed' && (
          <MnemonicPegsGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted}
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

        {activeMode === 'community' && (
          <CommunityPlayersView
            currentUser={currentUser}
            currentProfile={currentProfile}
            currentStats={stats}
            currentSpeed={currentSpeed}
            isSpeedLockedToPlan={isSpeedLockedToPlan}
            curriculumDay={protocol.curriculumDay}
            onOpenAuth={openAuth}
            onOpenProfile={() => setIsProfileOpen(true)}
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

      {/* Sign In & Create Account Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={(profile) => {
          if (profile) setCurrentProfile(profile);
        }}
      />

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        profile={currentProfile}
        stats={stats}
        currentSpeed={currentSpeed}
        isSpeedLockedToPlan={isSpeedLockedToPlan}
        curriculumDay={protocol.curriculumDay}
        onUpdateProfile={(updated) => setCurrentProfile(updated)}
        onSignOut={() => {
          setCurrentUser(null);
          setCurrentProfile(null);
        }}
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
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Photographic Memory Master • 365-Day Retinal Snapshot & Iconic Flash Laboratory
        </p>
      </footer>
    </div>
  );
}
