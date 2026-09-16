import { DailyProtocolState, ProtocolTask } from '../types';
import {
  getMaxMatrixLevelForDay,
  getMaxAyumuDigitsForDay,
  getMaxDualNBackForDay,
  getPegTargetForDay,
  getPalaceConfigForDay,
  getSpacedCardQuotaForDay,
} from './dayRestrictions';

const PROTOCOL_STORAGE_KEY = 'pmm_daily_protocol_v1';

/**
 * Calculates the current 24-hour cycle identifier based on 12:00 AM (Midnight) reset.
 * For example:
 * Current cycle begins at 12:00 AM (00:00:00) of today.
 * The next unlock always occurs at 12:00 AM (00:00:00) of tomorrow.
 */
export function getCurrentCycleInfo(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const cycleStartDate = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);
  const nextUnlockDate = new Date(currentYear, currentMonth, currentDate + 1, 0, 0, 0, 0);

  const cycleKey = `${cycleStartDate.getFullYear()}-${String(cycleStartDate.getMonth() + 1).padStart(2, '0')}-${String(cycleStartDate.getDate()).padStart(2, '0')}-12AM`;

  return {
    cycleKey,
    cycleStartDate,
    nextUnlockDate,
  };
}

/**
 * Generates the prescribed 6-stage daily tasks for a given curriculum day.
 */
export function generateTasksForDay(day: number): ProtocolTask[] {
  const matrixConfig = getMaxMatrixLevelForDay(day);
  const ayumuConfig = getMaxAyumuDigitsForDay(day);
  const nBackConfig = getMaxDualNBackForDay(day);
  const pegConfig = getPegTargetForDay(day);
  const palaceConfig = getPalaceConfigForDay(day);
  const spacedConfig = getSpacedCardQuotaForDay(day);

  return [
    {
      id: 'eidetic-matrix',
      title: 'Eidetic Matrix Visual Snapshot',
      discipline: 'Retinal Trace & Visual Chunking',
      targetDescription: `Reach Level ${matrixConfig.maxLevel} (Day ${day} cap; higher levels locked)`,
      targetCount: matrixConfig.maxLevel,
      currentCount: 0,
      maxAllowedLevel: matrixConfig.maxLevel,
      isCompleted: false,
      gameMode: 'eidetic-matrix',
    },
    {
      id: 'ayumu-chimp',
      title: 'Ayumu Iconic Sequence Benchmark',
      discipline: 'Iconic Memory Span & Spatial Gaze',
      targetDescription: `Master ${ayumuConfig.maxDigits} digits sequence (Day ${day} cap)`,
      targetCount: ayumuConfig.maxDigits,
      currentCount: 0,
      maxAllowedLevel: ayumuConfig.maxDigits,
      isCompleted: false,
      gameMode: 'ayumu-chimp',
    },
    {
      id: 'dual-nback',
      title: 'Dual N-Back Working Memory',
      discipline: 'Fluid Focus & Prefrontal Cortex',
      targetDescription: `Complete 1 test round (16 trials) at N=${nBackConfig.maxN} (Day ${day} cap)`,
      targetCount: 1,
      currentCount: 0,
      maxAllowedLevel: nBackConfig.maxN,
      isCompleted: false,
      gameMode: 'dual-nback',
    },
    {
      id: 'mnemonic-pegs',
      title: 'Mnemonic Peg Speed Conversions',
      discipline: 'Major System Encoding Reflex',
      targetDescription: `Achieve ${pegConfig.targetCount} rapid conversions (${pegConfig.label})`,
      targetCount: pegConfig.targetCount,
      currentCount: 0,
      maxAllowedLevel: pegConfig.label,
      isCompleted: false,
      gameMode: 'mnemonic-pegs',
    },
    {
      id: 'memory-palace',
      title: 'Memory Palace Villa Walkthrough',
      discipline: 'Method of Loci Spatial Encoding',
      targetDescription: `Anchor and recall ${palaceConfig.lociCount} stations in the Mental Villa`,
      targetCount: 1,
      currentCount: 0,
      maxAllowedLevel: palaceConfig.label,
      isCompleted: false,
      gameMode: 'memory-palace',
    },
    {
      id: 'spaced-repetition',
      title: 'Spaced Repetition SM-2 Mastery',
      discipline: 'SuperMemo Active Retrieval Cards',
      targetDescription: `Review ${spacedConfig.targetCards} spaced memory cards for consolidation`,
      targetCount: spacedConfig.targetCards,
      currentCount: 0,
      maxAllowedLevel: spacedConfig.targetCards,
      isCompleted: false,
      gameMode: 'spaced-repetition',
    },
  ];
}

export function loadDailyProtocol(): DailyProtocolState {
  const { cycleKey } = getCurrentCycleInfo();

  try {
    const raw = localStorage.getItem(PROTOCOL_STORAGE_KEY);
    if (!raw) {
      return createInitialProtocol(cycleKey, 1);
    }
    const parsed: DailyProtocolState = JSON.parse(raw);

    // If the cycle has rolled over past 12:00 AM (Midnight), start a new day's protocol!
    if (parsed.currentCycleDate !== cycleKey) {
      const wasCompleted = parsed.isLockedOut || (parsed.tasks && parsed.tasks.every((t) => t.isCompleted));
      const nextDay = wasCompleted ? (parsed.curriculumDay || 1) + 1 : parsed.curriculumDay || 1;
      const nextPhase = nextDay <= 30 ? 1 : nextDay <= 90 ? 2 : nextDay <= 180 ? 3 : 4;

      const newProtocol: DailyProtocolState = {
        currentCycleDate: cycleKey,
        isLockedOut: false,
        curriculumDay: Math.min(365, nextDay),
        currentPhase: nextPhase,
        tasks: generateTasksForDay(nextDay),
        history: {
          ...parsed.history,
          ...(wasCompleted
            ? {
                [parsed.currentCycleDate]: {
                  completed: true,
                  score: 100,
                  completedAt: parsed.completedAt || new Date().toISOString(),
                },
              }
            : {}),
        },
      };
      saveDailyProtocol(newProtocol);
      return newProtocol;
    }

    // Upgrade migration: If current cycle has older tasks layout (< 6 tasks), seamlessly upgrade to 6 steps
    if (!parsed.tasks || parsed.tasks.length < 6) {
      const freshTasks = generateTasksForDay(parsed.curriculumDay || 1);
      // Retain completion state for tasks that were already completed
      const upgradedTasks = freshTasks.map((newTask) => {
        const matchingOld = parsed.tasks?.find((old) => old.id === (newTask.id as any));
        if (matchingOld) {
          return {
            ...newTask,
            currentCount: matchingOld.currentCount,
            isCompleted: matchingOld.isCompleted,
          };
        }
        return newTask;
      });

      const upgradedProtocol: DailyProtocolState = {
        ...parsed,
        tasks: upgradedTasks,
      };
      saveDailyProtocol(upgradedProtocol);
      return upgradedProtocol;
    }

    return parsed;
  } catch {
    return createInitialProtocol(cycleKey, 1);
  }
}

function createInitialProtocol(cycleKey: string, day: number): DailyProtocolState {
  return {
    currentCycleDate: cycleKey,
    isLockedOut: false,
    curriculumDay: day,
    currentPhase: 1,
    tasks: generateTasksForDay(day),
    history: {},
  };
}

export function saveDailyProtocol(state: DailyProtocolState): void {
  try {
    localStorage.setItem(PROTOCOL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // LocalStorage failure handling
  }
}

/**
 * Calculates remaining time until next 12:00 AM (Midnight) reset in formatted hours, minutes, seconds.
 */
export function getTimeUntilNext12AM(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const { nextUnlockDate } = getCurrentCycleInfo(now);

  const diffMs = nextUnlockDate.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

// Backward-compatible alias
export const getTimeUntilNext12PM = getTimeUntilNext12AM;
