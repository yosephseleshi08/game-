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
 * Generates Yoseph's prescribed 3-discipline daily tasks (1 Hour total = 3 × 20 mins):
 * 1. Mnemonic Major Pegs: 20 Minutes (Number-to-image data keys)
 * 2. Dual N-Back Buffer: 20 Minutes (Working memory capacity and speaking focus)
 * 3. Symbol Detective Lab: 20 Minutes (Abstract symbol processing and script speed)
 */
export function generateTasksForDay(day: number): ProtocolTask[] {
  const pegConfig = getPegTargetForDay(day);
  const nBackConfig = getMaxDualNBackForDay(day);

  return [
    {
      id: 'mnemonic-pegs',
      title: 'Mnemonic Major Pegs (20 Min)',
      discipline: 'Number-to-Image Data Keys',
      targetDescription: `Master 20 minutes of number-to-image phonetic peg conversions (${pegConfig.label}; 20m goal)`,
      targetCount: 20,
      currentCount: 0,
      maxAllowedLevel: pegConfig.label,
      isCompleted: false,
      gameMode: 'mnemonic-pegs',
    },
    {
      id: 'dual-nback',
      title: 'Dual N-Back Buffer (20 Min)',
      discipline: 'Working Memory Capacity & Speaking Focus',
      targetDescription: `Train 20 minutes of dual auditory + spatial working memory RAM buffer at N=${nBackConfig.targetN} (20m goal)`,
      targetCount: 20,
      currentCount: 0,
      maxAllowedLevel: nBackConfig.maxN,
      isCompleted: false,
      gameMode: 'dual-nback',
    },
    {
      id: 'symbol-detective',
      title: 'Symbol Detective Lab (20 Min)',
      discipline: 'Abstract Symbol Processing & Script Speed',
      targetDescription: 'Train 20 minutes of high-speed glyph discrimination and visual feature-binding (20m goal)',
      targetCount: 20,
      currentCount: 0,
      maxAllowedLevel: 'Adaptive Speed',
      isCompleted: false,
      gameMode: 'symbol-detective',
    },
  ];
}

export function generateSixDayStreakHistory(): Record<string, { completed: boolean; score: number; completedAt: string }> {
  return {};
}

export function loadDailyProtocol(): DailyProtocolState {
  const { cycleKey } = getCurrentCycleInfo();

  try {
    const raw = localStorage.getItem(PROTOCOL_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialProtocol(cycleKey, 1);
      saveDailyProtocol(initial);
      return initial;
    }
    const parsed: DailyProtocolState = JSON.parse(raw);

    // Ensure the tasks match Yoseph's 3 designated disciplines
    const hasCorrectTasks =
      parsed.tasks &&
      parsed.tasks.length === 3 &&
      parsed.tasks.some((t) => t.id === 'mnemonic-pegs') &&
      parsed.tasks.some((t) => t.id === 'dual-nback') &&
      parsed.tasks.some((t) => t.id === 'symbol-detective');

    if (!hasCorrectTasks) {
      parsed.tasks = generateTasksForDay(parsed.curriculumDay || 1);
      saveDailyProtocol(parsed);
    }

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

    // Upgrade migration: If current cycle has older tasks layout (distraction games or !== 3 tasks), seamlessly upgrade to the 3 core pillars
    if (!parsed.tasks || parsed.tasks.length !== 3 || parsed.tasks.some((t) => ['eidetic-matrix', 'mnemonic-pegs', 'spaced-repetition'].includes(t.id))) {
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

    // Upgrade migration: Upgrade tasks to 2-level dosage and 100% perfect strike policy
    if (parsed.tasks && parsed.tasks.some((t) => t.targetCount !== 2)) {
      const freshTasks = generateTasksForDay(parsed.curriculumDay || 1);
      const upgradedTasks = freshTasks.map((fresh) => {
        const existing = parsed.tasks.find((t) => t.id === fresh.id);
        if (existing) {
          const clampedCount = Math.min(2, Math.max(0, existing.isCompleted ? 2 : (existing.currentCount > 2 ? 0 : existing.currentCount)));
          return {
            ...fresh,
            currentCount: clampedCount,
            isCompleted: clampedCount >= 2,
          };
        }
        return fresh;
      });
      parsed.tasks = upgradedTasks;
      saveDailyProtocol(parsed);
    }

    // Upgrade Day 1–3 Dual N-Back target if it was generated with older N=2 text
    if ((parsed.curriculumDay || 1) < 4 && parsed.tasks) {
      let modified = false;
      const updatedTasks = parsed.tasks.map((task) => {
        if (task.id === 'dual-nback' && !task.targetDescription?.includes('N=2 strictly locked until Day 4')) {
          modified = true;
          return {
            ...task,
            targetDescription: `Complete 2 perfect rounds (16 trials each) at N=1 with 100% accuracy (N=2 strictly locked until Day 4)`,
            maxAllowedLevel: 1,
          };
        }
        return task;
      });
      if (modified) {
        parsed.tasks = updatedTasks;
        saveDailyProtocol(parsed);
      }
    }

    return parsed;
  } catch {
    return createInitialProtocol(cycleKey, 7);
  }
}

function createInitialProtocol(cycleKey: string, day = 7): DailyProtocolState {
  const targetDay = Math.max(day, 7);
  return {
    currentCycleDate: cycleKey,
    isLockedOut: false,
    curriculumDay: targetDay,
    currentPhase: 1,
    tasks: generateTasksForDay(targetDay),
    history: generateSixDayStreakHistory(),
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
