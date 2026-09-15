import { DailyProtocolState, ProtocolTask } from '../types';

const PROTOCOL_STORAGE_KEY = 'pmm_daily_protocol_v1';

/**
 * Calculates the current 24-hour cycle identifier based on 12:00 PM (Noon) reset.
 * For example:
 * If current time is Sept 15, 10:30 AM (before 12 PM), the current cycle began on Sept 14 at 12:00 PM.
 * If current time is Sept 15, 1:00 PM (after 12 PM), the current cycle began on Sept 15 at 12:00 PM.
 * The next unlock always occurs on the next 12:00 PM.
 */
export function getCurrentCycleInfo(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const todayNoon = new Date(currentYear, currentMonth, currentDate, 12, 0, 0, 0);

  let cycleStartDate: Date;
  let nextUnlockDate: Date;

  if (now.getTime() >= todayNoon.getTime()) {
    // We are past today's 12:00 PM
    cycleStartDate = todayNoon;
    // Next unlock is tomorrow at 12:00 PM
    nextUnlockDate = new Date(currentYear, currentMonth, currentDate + 1, 12, 0, 0, 0);
  } else {
    // We are before today's 12:00 PM
    // The current cycle started yesterday at 12:00 PM
    cycleStartDate = new Date(currentYear, currentMonth, currentDate - 1, 12, 0, 0, 0);
    // Next unlock is today at 12:00 PM
    nextUnlockDate = todayNoon;
  }

  const cycleKey = `${cycleStartDate.getFullYear()}-${String(cycleStartDate.getMonth() + 1).padStart(2, '0')}-${String(cycleStartDate.getDate()).padStart(2, '0')}-12PM`;

  return {
    cycleKey,
    cycleStartDate,
    nextUnlockDate,
  };
}

/**
 * Generates the prescribed 4-stage daily tasks for a given curriculum day.
 */
export function generateTasksForDay(day: number): ProtocolTask[] {
  // Adaptive targets based on day
  const nBackLevel = day < 20 ? 2 : day < 60 ? 3 : 4;
  const pegTarget = day < 30 ? 15 : 25;
  const matrixTargetLevel = day < 15 ? 4 : day < 45 ? 6 : 8;

  return [
    {
      id: 'dual-nback',
      title: 'Dual N-Back Working Memory',
      discipline: 'Fluid Focus & Prefrontal Cortex',
      targetDescription: `Complete 1 full test round (16 trials) at N=${nBackLevel} or higher`,
      targetCount: 1,
      currentCount: 0,
      isCompleted: false,
      gameMode: 'dual-nback',
    },
    {
      id: 'mnemonic-pegs',
      title: 'Mnemonic Peg Speed Conversions',
      discipline: 'Major System Encoding Reflex',
      targetDescription: `Achieve ${pegTarget} rapid number-to-image conversions (<1.5s)`,
      targetCount: pegTarget,
      currentCount: 0,
      isCompleted: false,
      gameMode: 'mnemonic-speed',
    },
    {
      id: 'memory-palace',
      title: 'Spatial Locus Walkthrough / SM-2',
      discipline: 'Method of Loci Consolidation',
      targetDescription: 'Complete 1 palace route or review 5 Spaced Repetition cards',
      targetCount: 1,
      currentCount: 0,
      isCompleted: false,
      gameMode: 'mnemonic-speed',
    },
    {
      id: 'eidetic-matrix',
      title: 'Eidetic Matrix Visual Snapshot',
      discipline: 'Iconic Trace & Visual Chunking',
      targetDescription: `Reach Level ${matrixTargetLevel} with sub-second flash exposure`,
      targetCount: 1,
      currentCount: 0,
      isCompleted: false,
      gameMode: 'eidetic-matrix',
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

    // If the cycle has rolled over past 12:00 PM, start a new day's protocol!
    if (parsed.currentCycleDate !== cycleKey) {
      const wasCompleted = parsed.isLockedOut || parsed.tasks.every((t) => t.isCompleted);
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
 * Calculates remaining time until next 12:00 PM reset in formatted hours, minutes, seconds.
 */
export function getTimeUntilNext12PM(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const { nextUnlockDate } = getCurrentCycleInfo(now);

  const diffMs = nextUnlockDate.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}
