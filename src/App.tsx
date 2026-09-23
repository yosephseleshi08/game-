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
  restoreSixDayStreak,
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
import { FourHourPlanView } from './components/FourHourPlanView';
import { AuthModal } from './components/AuthModal';
import { GoogleAuthGate } from './components/GoogleAuthGate';
import { TypeOfGuyModal } from './components/TypeOfGuyModal';
import { getAthleteArchetype } from './utils/archetype';
import {
  subscribeToAuth,
  saveUserCloudData,
  loadUserCloudData,
  subscribeToUserCloudData,
  mergeUserProgress,
  mergeFourHourPlans,
  logoutUser,
} from './utils/firebase';
import { loadFourHourPlan, saveFourHourPlan } from './utils/fourHourPlan';
import type { User } from 'firebase/auth';
import { loadDailyProtocol, saveDailyProtocol } from './utils/protocol';
import { getPlanSpeedForDay } from './utils/flashPlan';
import { Award, Sparkles, X, Clock, Play, Pause, RotateCcw, Flame, Smartphone, Cloud, RefreshCw } from 'lucide-react';

export default function App() {
  const [protocol, setProtocol] = useState(() => loadDailyProtocol());
  const [stats, setStats] = useState<UserStats>(() => {
    const loaded = loadUserStats();
    const proto = loadDailyProtocol();
    const historyDays = Object.values(proto.history || {}).filter((h: any) => h?.completed).length;
    const safeStreak = Math.max(
      loaded.currentStreak || 0,
      historyDays,
      proto.curriculumDay && proto.curriculumDay > 1 ? proto.curriculumDay - 1 : 0,
      6
    );
    return {
      ...loaded,
      currentStreak: safeStreak,
      bestStreak: Math.max(loaded.bestStreak || 0, safeStreak, 6),
      xp: Math.max(loaded.xp || 0, 1650),
    };
  });

  // Cross-Device Authentication & Cloud Synchronization (2 Phones & 1 PC)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthGateDismissed, setIsAuthGateDismissed] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isSyncingFromRemoteRef = useRef(false);
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

  // 6-Day Streak Restoration Toast Notice
  const [streakRestoreNotice, setStreakRestoreNotice] = useState<string | null>(null);

  // Solo Athlete Profile (100% Offline)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => {
    return loadLocalProfile() || createLocalAthleteProfile('Solo Athlete', 'ayumu');
  });

  const handleRestoreSixDayStreak = () => {
    sound.playLevelUp();
    const result = restoreSixDayStreak();
    setStats(result.stats);
    setProtocol(result.protocol);
    setCurrentProfile(result.profile);
    if (currentUser) {
      saveUserCloudData(currentUser.uid, result.stats, result.protocol, freeTrainingStats, result.profile);
    }
    setStreakRestoreNotice('🔥 6-Day Streak & Day 7 Protocol Successfully Restored!');
    setTimeout(() => setStreakRestoreNotice(null), 5000);
  };

  // Free Training & Live Game Session Timer (Daily 12 AM Tracking)
  const [freeTrainingStats, setFreeTrainingStats] = useState<FreeTrainingSessionStats>(() => loadFreeTrainingStats());
  const [currentGameSeconds, setCurrentGameSeconds] = useState(0);
  const [isGameTimerPaused, setIsGameTimerPaused] = useState(false);
  const unflushedSecondsRef = useRef(0);

  const PLAYABLE_GAME_MODES: GameMode[] = [
    'ayumu-chimp',
    'dual-nback',
    'memory-palace',
    'symbol-detective',
  ];

  const FOUR_HOUR_MODULE_TARGETS: Partial<Record<GameMode, { title: string; minutes: number }>> = {
    'ayumu-chimp': { title: 'Ayumu Chimp (Flash RAM)', minutes: 18 },
    'dual-nback': { title: 'Dual N-Back (Working Memory RAM)', minutes: 18 },
    'memory-palace': { title: 'Memory Palace (Digital Loci)', minutes: 84 },
    'symbol-detective': { title: 'Symbol Detective Lab (Visual Binding)', minutes: 15 },
  };

  const isPlayingGame = PLAYABLE_GAME_MODES.includes(activeMode);

  const activeFourHourTarget = FOUR_HOUR_MODULE_TARGETS[activeMode];
  const activeModeSeconds = activeFourHourTarget ? (freeTrainingStats.todayGamesBreakdown?.[activeMode] || 0) : 0;
  const targetSeconds = activeFourHourTarget ? activeFourHourTarget.minutes * 60 : 0;
  const fourHourRemainingSecs = Math.max(0, targetSeconds - activeModeSeconds);
  const isFourHourGoalMet = activeFourHourTarget && (
    fourHourRemainingSecs === 0 ||
    protocol.tasks.find((t) => t.id === activeMode)?.isCompleted ||
    protocol.isLockedOut
  );

  // Reset session seconds when entering any game
  useEffect(() => {
    if (isPlayingGame) {
      setCurrentGameSeconds(0);
      setIsGameTimerPaused(false);
      setFreeTrainingStats(loadFreeTrainingStats(protocol.curriculumDay));
    }
  }, [activeMode, isPlayingGame, protocol.curriculumDay]);

  // Active game timer loop - tracks exact playing time and auto-saves to daily 12 AM cycle
  useEffect(() => {
    if (!isPlayingGame || isGameTimerPaused) return;

    const interval = setInterval(() => {
      setCurrentGameSeconds((prev) => prev + 1);
      unflushedSecondsRef.current += 1;

      // Optimistically increment todaySeconds and todayGamesBreakdown for real-time responsiveness
      setFreeTrainingStats((prev) => ({
        ...prev,
        todaySeconds: prev.todaySeconds + 1,
        totalSecondsPracticed: (prev.totalSecondsPracticed || 0) + 1,
        totalMinutesPracticed: Math.floor(((prev.totalSecondsPracticed || 0) + 1) / 60),
        todayGamesBreakdown: activeMode
          ? {
              ...(prev.todayGamesBreakdown || {}),
              [activeMode]: ((prev.todayGamesBreakdown || {})[activeMode] || 0) + 1,
            }
          : prev.todayGamesBreakdown,
      }));

      // Flush to disk every 5 seconds
      if (unflushedSecondsRef.current >= 5) {
        const secs = unflushedSecondsRef.current;
        unflushedSecondsRef.current = 0;
        const updated = recordFreeTrainingTime(secs, 0, activeMode, protocol.curriculumDay);
        setFreeTrainingStats(updated);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (unflushedSecondsRef.current > 0) {
        const secs = unflushedSecondsRef.current;
        unflushedSecondsRef.current = 0;
        const updated = recordFreeTrainingTime(secs, 0, activeMode, protocol.curriculumDay);
        setFreeTrainingStats(updated);
      }
    };
  }, [isPlayingGame, isGameTimerPaused, activeMode, protocol.curriculumDay]);

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

  // ----------------------------------------------------
  // Cross-Device Cloud Sync Engine (2 Phones & 1 PC)
  // ----------------------------------------------------
  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (!user) {
        setCloudSyncStatus('offline');
        return;
      }

      // User logged in: pull cloud data and merge with current device
      setCloudSyncStatus('syncing');
      try {
        const cloudData = await loadUserCloudData(user.uid);
        const localFourHour = loadFourHourPlan();

        if (cloudData) {
          // Merge local device state with cloud state (takes highest XP, level, curriculum day, streak)
          const merged = mergeUserProgress(
            stats,
            cloudData.stats,
            protocol,
            cloudData.protocol,
            freeTrainingStats,
            cloudData.freeTrainingStats
          );

          // Merge 4-hour plan across devices
          const mergedFourHour = mergeFourHourPlans(localFourHour, cloudData.fourHourPlan);
          if (mergedFourHour) {
            saveFourHourPlan(mergedFourHour);
          }

          isSyncingFromRemoteRef.current = true;
          setStats(merged.mergedStats);
          saveUserStats(merged.mergedStats);

          setProtocol(merged.mergedProtocol);
          saveDailyProtocol(merged.mergedProtocol);

          if (merged.mergedFreeStats) {
            setFreeTrainingStats(merged.mergedFreeStats);
            saveFreeTrainingStats(merged.mergedFreeStats);
          }

          let updatedProfile = currentProfile;
          if (cloudData.profile) {
            updatedProfile = {
              ...currentProfile,
              ...cloudData.profile,
              level: merged.mergedStats.level,
              xp: merged.mergedStats.xp,
              curriculumDay: merged.mergedProtocol.curriculumDay,
              currentStreak: merged.mergedStats.currentStreak,
              bestStreak: merged.mergedStats.bestStreak,
            };
            setCurrentProfile(updatedProfile);
            saveLocalProfile(updatedProfile);
          }

          // Push merged highest-watermark state back to cloud so both device and cloud are completely unified
          await saveUserCloudData(
            user.uid,
            merged.mergedStats,
            merged.mergedProtocol,
            merged.mergedFreeStats || freeTrainingStats,
            updatedProfile,
            mergedFourHour || localFourHour
          );
          setLastSyncedTime(new Date());
          setCloudSyncStatus('synced');

          setTimeout(() => {
            isSyncingFromRemoteRef.current = false;
          }, 1000);
        } else {
          // First time this account is seen on cloud: push local device records to cloud
          await saveUserCloudData(
            user.uid,
            stats,
            protocol,
            freeTrainingStats,
            currentProfile,
            localFourHour
          );
          setLastSyncedTime(new Date());
          setCloudSyncStatus('synced');
        }

        // Live real-time listener for multi-device synchronization (Phone 1, Phone 2, and PC)
        unsubSnapshot = subscribeToUserCloudData(user.uid, (remoteData) => {
          if (!remoteData || isSyncingFromRemoteRef.current) return;

          if (remoteData.fourHourPlan) {
            const currentPlan = loadFourHourPlan();
            const merged = mergeFourHourPlans(currentPlan, remoteData.fourHourPlan);
            if (merged) {
              saveFourHourPlan(merged);
            }
          }

          isSyncingFromRemoteRef.current = true;
          setStats((prevStats) => {
            const merged = mergeUserProgress(
              prevStats,
              remoteData.stats,
              protocol,
              remoteData.protocol,
              freeTrainingStats,
              remoteData.freeTrainingStats
            );
            saveUserStats(merged.mergedStats);
            saveDailyProtocol(merged.mergedProtocol);
            setProtocol(merged.mergedProtocol);

            if (merged.mergedFreeStats) {
              saveFreeTrainingStats(merged.mergedFreeStats);
              setFreeTrainingStats(merged.mergedFreeStats);
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

            setTimeout(() => {
              isSyncingFromRemoteRef.current = false;
            }, 800);

            return merged.mergedStats;
          });

          setLastSyncedTime(new Date());
          setCloudSyncStatus('synced');
        });
      } catch (err) {
        console.error('Error in cross-device cloud sync:', err);
        setCloudSyncStatus('error');
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // Instant foreground / window-focus auto-sync when picking up Phone 1, Phone 2, or PC
  useEffect(() => {
    if (!currentUser) return;

    const handleSyncOnForeground = async () => {
      if (document.visibilityState === 'visible' && !isSyncingFromRemoteRef.current) {
        try {
          setCloudSyncStatus('syncing');
          const remoteData = await loadUserCloudData(currentUser.uid);
          const currentPlan = loadFourHourPlan();
          if (remoteData) {
            if (remoteData.fourHourPlan) {
              const mergedPlan = mergeFourHourPlans(currentPlan, remoteData.fourHourPlan);
              if (mergedPlan) saveFourHourPlan(mergedPlan);
            }
            isSyncingFromRemoteRef.current = true;
            setStats((prevStats) => {
              const merged = mergeUserProgress(
                prevStats,
                remoteData.stats,
                protocol,
                remoteData.protocol,
                freeTrainingStats,
                remoteData.freeTrainingStats
              );
              saveUserStats(merged.mergedStats);
              saveDailyProtocol(merged.mergedProtocol);
              setProtocol(merged.mergedProtocol);

              if (merged.mergedFreeStats) {
                saveFreeTrainingStats(merged.mergedFreeStats);
                setFreeTrainingStats(merged.mergedFreeStats);
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

              setTimeout(() => {
                isSyncingFromRemoteRef.current = false;
              }, 800);

              return merged.mergedStats;
            });
            setLastSyncedTime(new Date());
            setCloudSyncStatus('synced');
          }
        } catch (e) {
          console.warn('Foreground sync error:', e);
        }
      }
    };

    window.addEventListener('focus', handleSyncOnForeground);
    document.addEventListener('visibilitychange', handleSyncOnForeground);
    return () => {
      window.removeEventListener('focus', handleSyncOnForeground);
      document.removeEventListener('visibilitychange', handleSyncOnForeground);
    };
  }, [currentUser, protocol, freeTrainingStats]);

  // Debounced auto-save to cloud when user completes training on this device
  useEffect(() => {
    if (!currentUser || isSyncingFromRemoteRef.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        const plan = loadFourHourPlan();
        await saveUserCloudData(
          currentUser.uid,
          stats,
          protocol,
          freeTrainingStats,
          currentProfile,
          plan
        );
        setCloudSyncStatus('synced');
        setLastSyncedTime(new Date());
      } catch (err) {
        console.error('Failed to sync to cloud:', err);
        setCloudSyncStatus('error');
      }
    }, 600);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [stats, protocol, freeTrainingStats, currentProfile, currentUser]);

  const handleForceSync = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setCloudSyncStatus('syncing');
    try {
      const cloudData = await loadUserCloudData(currentUser.uid);
      const localPlan = loadFourHourPlan();

      if (cloudData) {
        const merged = mergeUserProgress(
          stats,
          cloudData.stats,
          protocol,
          cloudData.protocol,
          freeTrainingStats,
          cloudData.freeTrainingStats
        );
        const mergedPlan = mergeFourHourPlans(localPlan, cloudData.fourHourPlan);
        if (mergedPlan) {
          saveFourHourPlan(mergedPlan);
        }

        isSyncingFromRemoteRef.current = true;
        setStats(merged.mergedStats);
        saveUserStats(merged.mergedStats);
        setProtocol(merged.mergedProtocol);
        saveDailyProtocol(merged.mergedProtocol);
        if (merged.mergedFreeStats) {
          setFreeTrainingStats(merged.mergedFreeStats);
          saveFreeTrainingStats(merged.mergedFreeStats);
        }

        await saveUserCloudData(
          currentUser.uid,
          merged.mergedStats,
          merged.mergedProtocol,
          merged.mergedFreeStats || freeTrainingStats,
          currentProfile,
          mergedPlan || localPlan
        );
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 800);
      } else {
        await saveUserCloudData(
          currentUser.uid,
          stats,
          protocol,
          freeTrainingStats,
          currentProfile,
          localPlan
        );
      }
      setCloudSyncStatus('synced');
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Force sync error:', err);
      setCloudSyncStatus('error');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setCloudSyncStatus('offline');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

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
        currentUser={currentUser}
        cloudSyncStatus={cloudSyncStatus}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onForceSync={handleForceSync}
        archetype={athleteArchetype}
        onOpenArchetype={() => setIsArchetypeModalOpen(true)}
        onRestoreStreak={handleRestoreSixDayStreak}
      />

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
                  Streak Restored!
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
      <main className="flex-1 w-full pb-12">
        {/* Multi-Device Cloud Sync Notice (Phones & PC) */}
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-1">
          {!currentUser ? (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/50 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5 sm:mt-0 ring-1 ring-cyan-400/30">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Training on 2 Phones & PC?
                    </h3>
                    <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Local Offline Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Each device saves progress in its own local browser by default. To sync all 3 devices, <strong>sign in with the same account (Google or Email)</strong> on each phone and your PC!
                  </p>
                </div>
              </div>
              <button
                id="banner-sync-devices-btn"
                onClick={() => {
                  sound.playClick();
                  setIsAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer active:scale-95 transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Sync All 3 Devices</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] text-emerald-300 font-semibold truncate">
                  Cloud Synced across devices: <span className="font-mono text-cyan-200">{currentUser.email || currentUser.displayName || 'Connected Account'}</span>
                </span>
              </div>
              <button
                onClick={handleForceSync}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                title="Force instant synchronization across all devices"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Game Session & Daily 12 AM Timer Bar */}
        {isPlayingGame && (
          <div className="max-w-4xl mx-auto px-4 pt-3 pb-1">
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
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

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      Session Time:
                      <span className="text-cyan-400 font-extrabold text-sm">
                        {formatTimerClock(currentGameSeconds)}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      📅 Today: {formatTimerClock(freeTrainingStats.todaySeconds)}
                    </span>
                    {activeFourHourTarget && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isFourHourGoalMet
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                        }`}
                        title="4-Hour Cognitive Plan Live Countdown: Auto-verifies when completed"
                      >
                        <Clock className="w-3 h-3" />
                        4h Plan: {isFourHourGoalMet ? (
                          <span className="text-emerald-300 font-bold">✓ Mastered</span>
                        ) : (
                          <span>
                            {Math.floor(fourHourRemainingSecs / 60)}m {fourHourRemainingSecs % 60}s left
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isGameTimerPaused ? (
                      <span className="text-amber-300 font-bold">Session paused</span>
                    ) : (
                      <>
                        Auto-recording active play • Resets at 12:00 AM •{' '}
                        <span className="text-emerald-400 font-medium">
                          ~{Math.round((freeTrainingStats.todaySeconds / 60) * 1.5)}m doom scrolling saved
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsGameTimerPaused(!isGameTimerPaused);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
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
                  Daily
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
            onNavigateMode={(mode) => {
              setFreeTrainingConfig({ isFree: true });
              setActiveMode(mode);
            }}
            onStartStepWithConfig={handleStartStepWithConfig}
            onAddXp={handleAddXp}
            stats={freeTrainingStats}
            onUpdateStats={setFreeTrainingStats}
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
            onRestoreStreak={handleRestoreSixDayStreak}
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
          if (currentUser) {
            saveUserCloudData(currentUser.uid, stats, protocol, freeTrainingStats, updated);
          }
        }}
        currentUser={currentUser}
        cloudSyncStatus={cloudSyncStatus}
        lastSyncedAt={lastSyncedTime}
        onOpenAuth={() => {
          setIsProfileOpen(false);
          setIsAuthModalOpen(true);
        }}
        onForceSync={handleForceSync}
        onSignOut={handleSignOut}
        onRestoreStreak={handleRestoreSixDayStreak}
        onDataRestored={(restoredStats) => {
          setStats(restoredStats);
          const freshProtocol = loadDailyProtocol();
          setProtocol(freshProtocol);
          const freshProfile = loadLocalProfile();
          if (freshProfile) setCurrentProfile(freshProfile);
          if (currentUser) {
            saveUserCloudData(currentUser.uid, restoredStats, freshProtocol, freeTrainingStats, freshProfile || currentProfile);
          }
          setStreakRestoreNotice('🔥 Save file loaded: 6-Day Streak and Progress Restored!');
          setTimeout(() => setStreakRestoreNotice(null), 5000);
        }}
      />

      {/* Cross-Device Unified Account Sign-In / Sign-Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={async () => {
          setIsAuthModalOpen(false);
          if (currentUser) {
            await handleForceSync();
          }
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

      {/* Required Google Sign-In Gate to Sync All 3 Devices */}
      {!currentUser && !isAuthGateDismissed && !isAuthLoading && (
        <GoogleAuthGate
          isOpen={true}
          currentStreak={stats.currentStreak}
          curriculumDay={protocol.curriculumDay}
          onSuccess={(profile) => {
            if (profile) setCurrentProfile(profile);
            setIsAuthGateDismissed(true);
            setStreakRestoreNotice('🔥 Google account connected! All 3 devices are now synced.');
            setTimeout(() => setStreakRestoreNotice(null), 5000);
          }}
          onDismissOffline={() => {
            setIsAuthGateDismissed(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500 safe-bottom">
        <p>
          Photographic Memory Master • 365-Day Retinal Snapshot & Iconic Flash Laboratory
        </p>
      </footer>
    </div>
  );
}
