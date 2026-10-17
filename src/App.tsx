import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FlashSpeed, UserStats, DailyPQRecord, UserProfile, DailyProtocolState, FreeTrainingSessionStats } from './types';
import {
  loadUserStats,
  saveUserStats,
  loadSavedFlashSpeed,
  saveFlashSpeed,
  getRankForXp,
  loadLocalProfile,
  saveLocalProfile,
  createLocalAthleteProfile,
  loadFreeTrainingStats,
  saveFreeTrainingStats,
  recordFreeTrainingTime,
  cleanEverySingleThing,
} from './utils/storage';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { InspirationalQuote } from './components/InspirationalQuote';
import { ModeSelector } from './components/ModeSelector';
import { DualNBackGame } from './components/DualNBackGame';
import { MnemonicPegsGame } from './components/MnemonicPegsGame';
import { SymbolDetectiveGame } from './components/SymbolDetectiveGame';
import { DailyProtocolTracker } from './components/DailyProtocolTracker';
import { StatsDashboard } from './components/StatsDashboard';
import { TrainingTipsModal } from './components/TrainingTipsModal';
import { GeniusRoadmapModal } from './components/GeniusRoadmapModal';
import { FlashTimePlanModal } from './components/FlashTimePlanModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DailyMilestoneModal } from './components/DailyMilestoneModal';
import { FreeTrainingView } from './components/FreeTrainingView';
import { FourHourPlanView } from './components/FourHourPlanView';
import { EideticMatrixGame } from './components/EideticMatrixGame';
import { AyumuChimpGame } from './components/AyumuChimpGame';
import { MemoryPalaceGame } from './components/MemoryPalaceGame';
import { SpacedRepetitionGame } from './components/SpacedRepetitionGame';
import { DailyWorkoutGame } from './components/DailyWorkoutGame';
import { YosephSecurityGate } from './components/YosephSecurityGate';
import { TypeOfGuyModal } from './components/TypeOfGuyModal';
import { getAthleteArchetype } from './utils/archetype';
import {
  mergeUserProgress,
  mergeFourHourPlans,
} from './utils/firebase';
import {
  isDeviceUnlocked,
  setDeviceUnlocked,
  fetchServerMasterProgress,
  pushServerMasterProgress,
  resetServerMasterProgress,
  subscribeToMasterCloudProgress,
} from './utils/yosephSync';
import { loadFourHourPlan, saveFourHourPlan, resetFourHourPlanToZero } from './utils/fourHourPlan';
import {
  loadDailyProtocol,
  saveDailyProtocol,
  computeStreaksFromHistory,
  getLocalDateString,
  checkIsDailyProtocolFullyDone,
} from './utils/protocol';
import { getPlanSpeedForDay } from './utils/flashPlan';
import { Award, Sparkles, X, Clock, Play, Pause, RotateCcw, Flame, Smartphone, Laptop, Cloud, RefreshCw, Lock } from 'lucide-react';

export default function App() {
  const [protocol, setProtocol] = useState(() => loadDailyProtocol());
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());

  // Yoseph Security Vault & Password Lock (Defaults to true so user can train immediately without password blockage)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);

  // Cross-Device Synchronization (2 Phones & 1 PC)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const isSyncingFromRemoteRef = useRef(false);
  const hasCompletedInitialSyncRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [isArchetypeModalOpen, setIsArchetypeModalOpen] = useState(false);

  // Audio State
  const [isSoundMuted, setIsSoundMuted] = useState(sound.isMuted);

  // Level Up Toast
  const [levelUpAlert, setLevelUpAlert] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);

  // Reset Notification
  const [streakRestoreNotice, setStreakRestoreNotice] = useState<string | null>(null);

  // Solo Athlete Profile (100% Offline)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    return loadLocalProfile() || createLocalAthleteProfile('Yoseph (Yosi)', 'yosi-prime');
  });

  const handleLockApp = () => {
    sound.playClick();
    setDeviceUnlocked(false);
    setIsUnlocked(false);
  };

  const handleUpdateProfilePhoto = (newPhotoUrl: string) => {
    sound.playSuccess();
    const updated: UserProfile = {
      ...currentProfile,
      photoUrl: newPhotoUrl,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProfile(updated);
    saveLocalProfile(updated);
    if (isUnlocked) {
      pushServerMasterProgress({
        stats,
        protocol,
        freeTrainingStats,
        fourHourPlan: loadFourHourPlan(),
        profile: updated,
      }).catch(console.error);
    }
  };

  const handleResetAllProgress = async () => {
    sound.playClick();
    isSyncingFromRemoteRef.current = true;
    const result = cleanEverySingleThing();
    setStats(result.stats);
    setProtocol(result.protocol);
    setCurrentProfile(result.profile);
    setFreeTrainingStats(result.freeTrainingStats);
    setCurrentGameSeconds(0);
    unflushedSecondsRef.current = 0;

    setCloudSyncStatus('syncing');
    try {
      await resetServerMasterProgress();
      setLastSyncedTime(new Date());
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Failed to reset master cloud data:', err);
    }
    setStreakRestoreNotice('All progress cleaned & reset to 0! Starting fresh on Day 1 for Yoseph.');
    setTimeout(() => {
      isSyncingFromRemoteRef.current = false;
    }, 2500);
    setTimeout(() => setStreakRestoreNotice(null), 5000);
  };



  // Free Training & Live Game Session Timer (Daily 12 AM Tracking)
  const [freeTrainingStats, setFreeTrainingStats] = useState<FreeTrainingSessionStats>(() => loadFreeTrainingStats());
  const [currentGameSeconds, setCurrentGameSeconds] = useState(0);
  const [isGameTimerPaused, setIsGameTimerPaused] = useState(false);
  const unflushedSecondsRef = useRef(0);

  const ALL_INTERACTIVE_GAMES: GameMode[] = [
    'mnemonic-pegs',
    'dual-nback',
    'symbol-detective',
    'eidetic-matrix',
    'ayumu-chimp',
    'memory-palace',
    'spaced-repetition',
    'daily-workout',
  ];

  // Yoseph's Cognitive Protocol & Laboratory Goals
  const GAME_TARGETS: Record<GameMode, { title: string; minutes: number }> = {
    'mnemonic-pegs': { title: 'Mnemonic Major Pegs (Number-to-Image)', minutes: 20 },
    'dual-nback': { title: 'Dual N-Back Buffer (Working Memory RAM)', minutes: 20 },
    'symbol-detective': { title: 'Symbol Detective Lab (Script Speed)', minutes: 20 },
    'memory-palace': { title: 'Manual Memory Palace Training (1 Hour)', minutes: 60 },
    'eidetic-matrix': { title: 'Eidetic Matrix (Visual RAM)', minutes: 15 },
    'ayumu-chimp': { title: 'Ayumu Chimp Test (Flash Working Memory)', minutes: 15 },
    'spaced-repetition': { title: 'Spaced Repetition Review', minutes: 15 },
    'daily-workout': { title: 'Daily Cognitive Workout (PQ Evaluation)', minutes: 20 },
    'daily-protocol': { title: 'Daily Protocol', minutes: 60 },
    'four-hour-plan': { title: '4-Hour Plan', minutes: 240 },
    'free-training': { title: 'Free Training Hub', minutes: 60 },
    'community': { title: 'Community Hub', minutes: 0 },
    'stats': { title: 'Performance Telemetry', minutes: 0 },
  };

  const isPlayingGame = ALL_INTERACTIVE_GAMES.includes(activeMode);
  const activeModuleTarget = GAME_TARGETS[activeMode];
  const targetSeconds = activeModuleTarget ? activeModuleTarget.minutes * 60 : 0;

  const existingTaskSeconds = protocol.tasks?.find((t) => t.id === activeMode)?.secondsElapsed || 0;
  const palaceTimerSeconds = activeMode === 'memory-palace' ? (protocol.memoryPalaceTimer?.elapsedSeconds || 0) : 0;
  const breakdownSeconds = freeTrainingStats.todayGamesBreakdown?.[activeMode] || 0;
  const activeModeSeconds = Math.max(existingTaskSeconds, palaceTimerSeconds, breakdownSeconds);
  const moduleRemainingSecs = Math.max(0, targetSeconds - activeModeSeconds);
  const isModuleGoalMet = activeModuleTarget && targetSeconds > 0 && (
    activeModeSeconds >= targetSeconds ||
    protocol.tasks.find((t) => t.id === activeMode)?.isCompleted ||
    protocol.isLockedOut
  );

  const activeModeSecondsRef = useRef(activeModeSeconds);
  useEffect(() => {
    activeModeSecondsRef.current = activeModeSeconds;
  }, [activeModeSeconds]);

  // Initialize session seconds when entering any game to the already accumulated time so it never resets to 0!
  useEffect(() => {
    if (isPlayingGame) {
      const taskSecs = protocol.tasks?.find((t) => t.id === activeMode)?.secondsElapsed || 0;
      const palaceSecs = activeMode === 'memory-palace' ? (protocol.memoryPalaceTimer?.elapsedSeconds || 0) : 0;
      const breakdownSecs = freeTrainingStats.todayGamesBreakdown?.[activeMode] || 0;
      const initialSecs = Math.max(taskSecs, palaceSecs, breakdownSecs);
      activeModeSecondsRef.current = initialSecs;
      setCurrentGameSeconds(initialSecs);
      setIsGameTimerPaused(false);
    }
  }, [activeMode, isPlayingGame]);

  // Active game timer loop - tracks exact playing time and auto-saves every second to storage
  useEffect(() => {
    if (!isPlayingGame || isGameTimerPaused) return;

    const interval = setInterval(() => {
      activeModeSecondsRef.current += 1;
      const nextSecs = activeModeSecondsRef.current;
      setCurrentGameSeconds(nextSecs);

      // Record exact 1 second to freeTrainingStats and flush immediately to disk
      const updatedFree = recordFreeTrainingTime(1, 0, activeMode, protocol.curriculumDay);
      if ((updatedFree.todayGamesBreakdown?.[activeMode] || 0) < nextSecs) {
        updatedFree.todayGamesBreakdown[activeMode] = nextSecs;
        saveFreeTrainingStats(updatedFree);
      }
      setFreeTrainingStats(updatedFree);

      // Update protocol tasks so protocol.tasks always has the exact elapsed seconds
      setProtocol((prevP) => {
        let modified = false;
        const targetSecs = (GAME_TARGETS[activeMode]?.minutes || 20) * 60;
        const isCompleted = nextSecs >= targetSecs;

        const updatedTasks = prevP.tasks.map((t) => {
          if (t.id === activeMode) {
            modified = true;
            return {
              ...t,
              secondsElapsed: nextSecs,
              currentCount: Math.floor(nextSecs / 60),
              isCompleted: Boolean(t.isCompleted || isCompleted),
            };
          }
          return t;
        });

        let updatedPalaceTimer = prevP.memoryPalaceTimer;
        if (activeMode === 'memory-palace' && prevP.memoryPalaceTimer) {
          modified = true;
          const palaceDone = nextSecs >= 3600;
          updatedPalaceTimer = {
            ...prevP.memoryPalaceTimer,
            elapsedSeconds: nextSecs,
            remainingSeconds: Math.max(0, 3600 - nextSecs),
            isCompleted: Boolean(prevP.memoryPalaceTimer.isCompleted || palaceDone),
          };
        }

        if (!modified) return prevP;

        const updatedProto = {
          ...prevP,
          tasks: updatedTasks,
          memoryPalaceTimer: updatedPalaceTimer,
        };
        saveDailyProtocol(updatedProto);
        return updatedProto;
      });

      // Synchronize 4-hour plan tasks
      const currentPlan = loadFourHourPlan();
      const updatedPlanTasks = currentPlan.tasks.map((pt) => {
        if (pt.gameMode === activeMode) {
          return {
            ...pt,
            elapsedSeconds: nextSecs,
            isCompleted: Boolean(pt.isCompleted || nextSecs >= pt.targetMinutes * 60),
          };
        }
        return pt;
      });
      saveFourHourPlan({ ...currentPlan, tasks: updatedPlanTasks });

      // Check if strict 20-minute (1200 seconds) quota is completed for 3 primary disciplines!
      if (['mnemonic-pegs', 'dual-nback', 'symbol-detective'].includes(activeMode) && nextSecs === 1200) {
        sound.playMilestoneFanfare();
        handleAddXp(250);
        setStreakRestoreNotice(
          `🎉 20-Minute Protocol Achieved! ${activeMode} is strictly locked until tomorrow at 12:00 AM.`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayingGame, isGameTimerPaused, activeMode, protocol.curriculumDay]);

  // Background tab-close and visibility beacon to ensure zero seconds are ever lost
  useEffect(() => {
    const handleSaveOnUnload = () => {
      if (!isPlayingGame || !activeMode) return;
      const statsToSave = loadUserStats();
      const protoToSave = loadDailyProtocol();
      const planToSave = loadFourHourPlan();
      const freeToSave = loadFreeTrainingStats(protoToSave.curriculumDay);

      try {
        const payload = JSON.stringify({
          stats: statsToSave,
          protocol: protoToSave,
          freeTrainingStats: freeToSave,
          fourHourPlan: planToSave,
          profile: currentProfile,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/yoseph/progress', new Blob([payload], { type: 'application/json' }));
        }
      } catch {
        // Fallback
      }
    };

    window.addEventListener('beforeunload', handleSaveOnUnload);
    window.addEventListener('pagehide', handleSaveOnUnload);
    return () => {
      window.removeEventListener('beforeunload', handleSaveOnUnload);
      window.removeEventListener('pagehide', handleSaveOnUnload);
    };
  }, [isPlayingGame, activeMode, currentProfile]);

  // Periodic cloud sync during active gameplay (every 10 seconds)
  useEffect(() => {
    if (!isPlayingGame || isGameTimerPaused) return;

    const syncInterval = setInterval(() => {
      const plan = loadFourHourPlan();
      pushServerMasterProgress({
        stats,
        protocol,
        freeTrainingStats,
        profile: currentProfile,
        fourHourPlan: plan,
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [isPlayingGame, isGameTimerPaused, stats, protocol, freeTrainingStats, currentProfile]);

  // Continuous training reward: +15 XP every active minute
  useEffect(() => {
    if (currentGameSeconds > 0 && currentGameSeconds % 60 === 0 && !isGameTimerPaused) {
      handleAddXp(15);
    }
  }, [currentGameSeconds, isGameTimerPaused]);

  const formatTimerClock = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m 00s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  // Auto-sync stats to local storage
  useEffect(() => {
    saveUserStats(stats);
  }, [stats]);

  // Auto-sync protocol state to local storage
  useEffect(() => {
    saveDailyProtocol(protocol);
  }, [protocol]);

  // Synchronize streaks strictly from real calendar history (red days reset streak to 0)
  useEffect(() => {
    const todayStr = getLocalDateString();
    const isTodayDone = checkIsDailyProtocolFullyDone(
      protocol.tasks,
      freeTrainingStats.todayGamesBreakdown,
      protocol.memoryPalaceTimer
    );
    const { currentStreak, bestStreak } = computeStreaksFromHistory(
      protocol.history,
      todayStr,
      isTodayDone
    );

    if (stats.currentStreak !== currentStreak || stats.bestStreak !== bestStreak) {
      setStats((prev) => ({
        ...prev,
        currentStreak,
        bestStreak: Math.max(prev.bestStreak, bestStreak),
      }));
    }
  }, [protocol.history, protocol.tasks, freeTrainingStats.todayGamesBreakdown, protocol.memoryPalaceTimer]);

  // ----------------------------------------------------
  // Yoseph Unified Multi-Device Sync Engine (2 Phones & 1 PC)
  // ----------------------------------------------------
  const handleForceSync = async () => {
    setCloudSyncStatus('syncing');
    isSyncingFromRemoteRef.current = true;
    try {
      const serverData = await fetchServerMasterProgress();
      const localPlan = loadFourHourPlan();

      if (serverData) {
        const merged = mergeUserProgress(
          stats,
          serverData.stats,
          protocol,
          serverData.protocol,
          freeTrainingStats,
          serverData.freeTrainingStats
        );
        const mergedPlan = mergeFourHourPlans(localPlan, serverData.fourHourPlan);
        if (mergedPlan) {
          saveFourHourPlan(mergedPlan);
        }

        setStats(merged.mergedStats);
        saveUserStats(merged.mergedStats);
        setProtocol(merged.mergedProtocol);
        saveDailyProtocol(merged.mergedProtocol);
        if (merged.mergedFreeStats) {
          setFreeTrainingStats(merged.mergedFreeStats);
          saveFreeTrainingStats(merged.mergedFreeStats);
        }

        let updatedProfile = currentProfile;
        if (serverData.profile) {
          updatedProfile = {
            ...currentProfile,
            ...serverData.profile,
            level: merged.mergedStats.level,
            xp: merged.mergedStats.xp,
            curriculumDay: merged.mergedProtocol.curriculumDay,
            currentStreak: merged.mergedStats.currentStreak,
            bestStreak: merged.mergedStats.bestStreak,
          };
          setCurrentProfile(updatedProfile);
          saveLocalProfile(updatedProfile);
        }

        // Push combined highest watermark back to server
        await pushServerMasterProgress({
          stats: merged.mergedStats,
          protocol: merged.mergedProtocol,
          freeTrainingStats: merged.mergedFreeStats || freeTrainingStats,
          fourHourPlan: mergedPlan || localPlan,
          profile: updatedProfile,
        });
      } else {
        await pushServerMasterProgress({
          stats,
          protocol,
          freeTrainingStats,
          fourHourPlan: localPlan,
          profile: currentProfile,
        });
      }
      setCloudSyncStatus('synced');
      setLastSyncedTime(new Date());
    } catch (err) {
      console.warn('Sync error:', err);
      setCloudSyncStatus('error');
    } finally {
      hasCompletedInitialSyncRef.current = true;
      setTimeout(() => {
        isSyncingFromRemoteRef.current = false;
      }, 800);
    }
  };

  // Live real-time Firestore listener for all 3 devices (PC, Phone 1, Phone 2)
  useEffect(() => {
    const unsub = subscribeToMasterCloudProgress((remoteData) => {
      if (isSyncingFromRemoteRef.current) return;
      isSyncingFromRemoteRef.current = true;
      try {
        const localPlan = loadFourHourPlan();
        const merged = mergeUserProgress(
          stats,
          remoteData.stats,
          protocol,
          remoteData.protocol,
          freeTrainingStats,
          remoteData.freeTrainingStats
        );
        const mergedPlan = mergeFourHourPlans(localPlan, remoteData.fourHourPlan);
        if (mergedPlan) saveFourHourPlan(mergedPlan);

        setStats(merged.mergedStats);
        saveUserStats(merged.mergedStats);
        setProtocol(merged.mergedProtocol);
        saveDailyProtocol(merged.mergedProtocol);
        if (merged.mergedFreeStats) {
          setFreeTrainingStats(merged.mergedFreeStats);
          saveFreeTrainingStats(merged.mergedFreeStats);
        }
        if (remoteData.profile) {
          setCurrentProfile((prevProf) => {
            const upProf = {
              ...prevProf,
              ...remoteData.profile,
              level: merged.mergedStats.level,
              xp: merged.mergedStats.xp,
              curriculumDay: merged.mergedProtocol.curriculumDay,
              currentStreak: merged.mergedStats.currentStreak,
              bestStreak: merged.mergedStats.bestStreak,
            };
            saveLocalProfile(upProf);
            return upProf;
          });
        }
        setCloudSyncStatus('synced');
        setLastSyncedTime(new Date());
      } finally {
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 600);
      }
    });

    return () => unsub();
  }, [stats, protocol, freeTrainingStats]);

  // Sync on startup and poll every 15s so any other phone or PC updates immediately appear
  useEffect(() => {
    handleForceSync();
    const interval = setInterval(() => {
      if (!isSyncingFromRemoteRef.current) {
        handleForceSync();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync immediately when switching tabs or reopening the app on phone / PC
  useEffect(() => {
    const handleSyncOnForeground = async () => {
      if (document.visibilityState === 'visible' && !isSyncingFromRemoteRef.current) {
        await handleForceSync();
      }
    };

    window.addEventListener('focus', handleSyncOnForeground);
    document.addEventListener('visibilitychange', handleSyncOnForeground);
    return () => {
      window.removeEventListener('focus', handleSyncOnForeground);
      document.removeEventListener('visibilitychange', handleSyncOnForeground);
    };
  }, [stats, protocol, freeTrainingStats]);

  // Debounced auto-save to server when user completes training on this device
  useEffect(() => {
    if (isSyncingFromRemoteRef.current) return;
    if (!hasCompletedInitialSyncRef.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        const plan = loadFourHourPlan();
        await pushServerMasterProgress({
          stats,
          protocol,
          freeTrainingStats,
          profile: currentProfile,
          fourHourPlan: plan,
        });
        setCloudSyncStatus('synced');
        setLastSyncedTime(new Date());
      } catch (err) {
        console.warn('Failed to push progress to master sync:', err);
        setCloudSyncStatus('error');
      }
    }, 800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [stats, protocol, freeTrainingStats, currentProfile]);

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
      const newHighScore = Math.max(prev.detectiveHighScore, score);

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        detectiveHighScore: newHighScore,
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
      const newMaxLevel = isSuccess ? Math.max(prev.matrixMaxLevel, level) : prev.matrixMaxLevel;
      const newFastest = isSuccess ? Math.min(prev.fastestFlashMs, currentSpeed) : prev.fastestFlashMs;

      return {
        ...prev,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrectAttempts: prev.totalCorrectAttempts + (isSuccess ? 1 : 0),
        matrixMaxLevel: newMaxLevel,
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
    const historyCount = Object.values(protocol.history || {}).filter((h: any) => h?.completed).length;
    const nextStreak = Math.max((stats.currentStreak || 0) + 1, protocol.curriculumDay, historyCount + 1);

    setStats((prev) => ({
      ...prev,
      currentStreak: nextStreak,
      bestStreak: Math.max(prev.bestStreak, nextStreak),
    }));

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

  const athleteArchetype = getAthleteArchetype({
    userStats: stats,
    freeStats: freeTrainingStats,
    fourHourPlan: loadFourHourPlan(),
    protocol,
    currentSpeed,
  });

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      <div
        className={`flex-1 flex flex-col w-full transition-all duration-300 ${
          !isUnlocked
            ? 'filter blur-xl pointer-events-none select-none max-h-screen overflow-hidden opacity-25'
            : 'opacity-100'
        }`}
      >
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
        cloudSyncStatus={cloudSyncStatus}
        onForceSync={handleForceSync}
        onLockApp={handleLockApp}
        archetype={athleteArchetype}
        onOpenArchetype={() => setIsArchetypeModalOpen(true)}
        onRestoreStreak={handleResetAllProgress}
        onUpdatePhoto={handleUpdateProfilePhoto}
      />

      {/* Daily Cognitive Inspirational Quote */}
      <InspirationalQuote curriculumDay={protocol.curriculumDay} />

      {/* Mode Navigation Tabs */}
      <ModeSelector
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        isLockedOut={protocol.isLockedOut}
      />

      {/* 6-Day Streak Restored Notification Banner */}
      {streakRestoreNotice && (
        <div className="max-w-xl mx-auto px-4 mt-3 w-full animate-bounce">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-slate-950/20 text-white">
                <Flame className="w-5 h-5 fill-amber-300 text-amber-200" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block font-extrabold text-slate-950">
                  Clean Slate Active!
                </span>
                <span className="text-sm font-black text-white">
                  {streakRestoreNotice}
                </span>
              </div>
            </div>
            <button
              onClick={() => setStreakRestoreNotice(null)}
              className="p-1.5 rounded-lg bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
      <main className="flex-1 w-full pb-16">
        {/* Active Game Session & Daily 12 AM Timer Bar */}
        {isPlayingGame && (
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-1">
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl backdrop-blur">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all ${
                      isGameTimerPaused
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  {!isGameTimerPaused && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                      Session:
                      <span className="text-emerald-400 font-extrabold text-xs sm:text-sm">
                        {formatTimerClock(currentGameSeconds)} / {activeModuleTarget?.minutes || 20}m
                      </span>
                    </span>
                    {activeModuleTarget && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          currentGameSeconds >= targetSeconds || isModuleGoalMet
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 font-bold'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse font-bold'
                        }`}
                        title="Session discipline goal auto-verifies when completed"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {currentGameSeconds >= targetSeconds || isModuleGoalMet ? (
                          <span className="text-emerald-300 font-bold">✓ {activeModuleTarget.minutes}m Completed & Saved</span>
                        ) : (
                          <span>
                            {Math.floor(Math.max(0, targetSeconds - currentGameSeconds) / 60)}m {String(Math.max(0, targetSeconds - currentGameSeconds) % 60).padStart(2, '0')}s remaining
                          </span>
                        )}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isGameTimerPaused
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                    }`}>
                      {isGameTimerPaused ? '❚❚ Paused' : '● Live Saving'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                    {isGameTimerPaused ? (
                      <span className="text-amber-300 font-bold">Session paused</span>
                    ) : (
                      <>
                        Auto-recording • Resets at 12:00 AM •{' '}
                        <span className="text-emerald-400 font-medium">
                          ~{Math.round((freeTrainingStats.todaySeconds / 60) * 1.5)}m saved
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end shrink-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsGameTimerPaused(!isGameTimerPaused);
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isGameTimerPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                  }`}
                  title={isGameTimerPaused ? 'Resume game practice timer' : 'Pause game practice timer'}
                >
                  {isGameTimerPaused ? (
                    <>
                      <Play className="w-3 h-3 fill-white" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setFreeTrainingConfig(null);
                    setActiveMode('daily-protocol');
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  ← Protocol
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
              setActiveMode(mode);
            }}
            onAddXp={handleAddXp}
            onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
            onOpenFlashPlan={() => setIsFlashPlanOpen(true)}
            onOpenMilestone={() => setIsMilestoneModalOpen(true)}
            currentSpeed={currentSpeed}
            isSpeedLockedToPlan={isSpeedLockedToPlan}
            todayGamesBreakdown={freeTrainingStats.todayGamesBreakdown}
            currentStreak={stats.currentStreak}
          />
        )}

        {activeMode === 'four-hour-plan' && (
          <FourHourPlanView
            onNavigateMode={setActiveMode}
            onAddXp={handleAddXp}
            todayGamesBreakdown={freeTrainingStats.todayGamesBreakdown}
            protocol={protocol}
            todaySeconds={freeTrainingStats.todaySeconds}
          />
        )}

        {activeMode === 'free-training' && (
          <FreeTrainingView
            curriculumDay={protocol.curriculumDay}
            currentSpeed={currentSpeed}
            onSpeedChange={handleSpeedChange}
            onNavigateMode={setActiveMode}
            onStartStepWithConfig={(mode, config) => {
              setFreeTrainingConfig(config || null);
              setActiveMode(mode);
            }}
            onAddXp={handleAddXp}
            stats={freeTrainingStats}
            onUpdateStats={setFreeTrainingStats}
          />
        )}

        {activeMode === 'mnemonic-pegs' && (
          <MnemonicPegsGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={
              protocol.isLockedOut ||
              (freeTrainingStats.todayGamesBreakdown?.['mnemonic-pegs'] || 0) >= 1200
            }
            onAddXp={handleAddXp}
            onRecordMnemonicConversion={handleRecordMnemonicConversion}
            onCompletePegLevel={handleCompletePegLevel}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={
              protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted ||
              (freeTrainingStats.todayGamesBreakdown?.['mnemonic-pegs'] || 0) >= 1200
            }
            completedLevelsToday={protocol.tasks.find((t) => t.id === 'mnemonic-pegs')?.currentCount || 0}
          />
        )}

        {activeMode === 'dual-nback' && (
          <DualNBackGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={
              protocol.isLockedOut ||
              (freeTrainingStats.todayGamesBreakdown?.['dual-nback'] || 0) >= 1200
            }
            initialN={freeTrainingConfig?.nBack}
            onAddXp={handleAddXp}
            onRecordNBackMax={handleRecordNBackMax}
            onNavigateMode={setActiveMode}
            isTaskCompleteToday={
              protocol.tasks.find((t) => t.id === 'dual-nback')?.isCompleted ||
              (freeTrainingStats.todayGamesBreakdown?.['dual-nback'] || 0) >= 1200
            }
            completedRoundsToday={protocol.tasks.find((t) => t.id === 'dual-nback')?.currentCount || 0}
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
            isLockedOut={
              protocol.isLockedOut ||
              (freeTrainingStats.todayGamesBreakdown?.['symbol-detective'] || 0) >= 1200
            }
            onNavigateMode={setActiveMode}
          />
        )}

        {activeMode === 'eidetic-matrix' && (
          <EideticMatrixGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={false}
            isFreeTraining={true}
            initialLevel={freeTrainingConfig?.level}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={(success, level) => {
              if (success && level > stats.matrixMaxLevel) {
                setStats((prev) => ({ ...prev, matrixMaxLevel: level }));
              }
            }}
            onNavigateMode={setActiveMode}
          />
        )}

        {activeMode === 'ayumu-chimp' && (
          <AyumuChimpGame
            currentSpeed={currentSpeed}
            curriculumDay={protocol.curriculumDay}
            isLockedOut={false}
            isFreeTraining={true}
            initialDigits={freeTrainingConfig?.digits}
            onSpeedChange={handleSpeedChange}
            onAddXp={handleAddXp}
            onRecordResult={(success, numbersCount) => {
              if (success && numbersCount > stats.ayumuMaxNumbers) {
                setStats((prev) => ({ ...prev, ayumuMaxNumbers: numbersCount }));
              }
            }}
            onNavigateMode={setActiveMode}
          />
        )}

        {activeMode === 'memory-palace' && (
          <MemoryPalaceGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={protocol.isLockedOut}
            isFreeTraining={true}
            onAddXp={handleAddXp}
            onCompletePalaceStep={() => {
              handleAddXp(50);
            }}
            onNavigateMode={setActiveMode}
          />
        )}

        {activeMode === 'spaced-repetition' && (
          <SpacedRepetitionGame
            curriculumDay={protocol.curriculumDay}
            isLockedOut={false}
            isFreeTraining={true}
            onAddXp={handleAddXp}
            onCardReviewed={() => handleAddXp(5)}
            onNavigateMode={setActiveMode}
          />
        )}

        {activeMode === 'daily-workout' && (
          <DailyWorkoutGame
            stats={stats}
            curriculumDay={protocol.curriculumDay}
            onAddXp={handleAddXp}
            onSavePQRecord={(record) => {
              setStats((prev) => ({
                ...prev,
                pqHistory: [record, ...(prev.pqHistory || [])].slice(0, 30),
              }));
            }}
          />
        )}

        {activeMode === 'stats' && (
          <StatsDashboard
            stats={stats}
            fourHourPlan={loadFourHourPlan()}
            freeTrainingStats={freeTrainingStats}
            protocol={protocol}
            cloudSyncStatus={cloudSyncStatus}
            lastSyncedTime={lastSyncedTime}
            onTriggerSync={handleForceSync}
            onOpenArchetype={() => setIsArchetypeModalOpen(true)}
            onRestoreStreak={handleResetAllProgress}
          />
        )}
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

      {/* Athlete Profile & Cross-Device Sync Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={currentProfile}
        stats={stats}
        currentSpeed={currentSpeed}
        isSpeedLockedToPlan={isSpeedLockedToPlan}
        curriculumDay={protocol.curriculumDay}
        onUpdateProfile={(updated) => {
          setCurrentProfile(updated);
          saveLocalProfile(updated);
          handleForceSync();
        }}
        cloudSyncStatus={cloudSyncStatus}
        lastSyncedAt={lastSyncedTime}
        onForceSync={handleForceSync}
        onLockApp={handleLockApp}
        onRestoreStreak={handleResetAllProgress}
        onDataRestored={(restoredStats) => {
          setStats(restoredStats);
          const freshProtocol = loadDailyProtocol();
          setProtocol(freshProtocol);
          const freshProfile = loadLocalProfile();
          if (freshProfile) setCurrentProfile(freshProfile);
          handleForceSync();
          setStreakRestoreNotice('🔥 Save file loaded: 6-Day Streak and Progress Restored!');
          setTimeout(() => setStreakRestoreNotice(null), 5000);
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
        onOpenFreeTraining={() => {
          setIsMilestoneModalOpen(false);
          setFreeTrainingConfig({ isFree: true });
          setActiveMode('free-training');
        }}
      />

      {/* What Type of Guy Are You? Cognitive Persona Diagnostic Modal */}
      <TypeOfGuyModal
        isOpen={isArchetypeModalOpen}
        onClose={() => setIsArchetypeModalOpen(false)}
        archetype={athleteArchetype}
      />

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500 safe-bottom">
          <p>
            Yosi Game • Created Exclusively for Yoseph • 1-Hour Daily Cognitive Mastery Engine
          </p>
        </footer>
      </div>

      {/* Mandatory Yoseph Security Gate (Password: yoseph535) */}
      <YosephSecurityGate
        isOpen={!isUnlocked}
        onUnlockSuccess={() => {
          setIsUnlocked(true);
          handleForceSync();
        }}
      />
    </div>
  );
}
