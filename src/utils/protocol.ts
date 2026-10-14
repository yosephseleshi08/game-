import { DailyProtocolState, ProtocolTask, DayHistoryRecord, MemoryPalaceTimerState } from '../types';
import {
  getMaxDualNBackForDay,
  getPegTargetForDay,
} from './dayRestrictions';

const PROTOCOL_STORAGE_KEY = 'pmm_daily_protocol_v1';

/**
 * Returns YYYY-MM-DD in local time
 */
export function getLocalDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates current 24-hour cycle info based on 12:00 AM (Midnight) reset.
 */
export function getCurrentCycleInfo(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const cycleStartDate = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);
  const nextUnlockDate = new Date(currentYear, currentMonth, currentDate + 1, 0, 0, 0, 0);
  const dateString = getLocalDateString(now);
  const cycleKey = dateString;

  return {
    cycleKey,
    dateString,
    cycleStartDate,
    nextUnlockDate,
  };
}

/**
 * Generates Yoseph's 4 designated daily disciplines:
 * Part 1 (Interactive Games = 1 Hour total):
 * 1. Mnemonic Major Pegs: 20 Minutes (1200s target)
 * 2. Dual N-Back Buffer: 20 Minutes (1200s target)
 * 3. Symbol Detective Lab: 20 Minutes (1200s target)
 *
 * Part 2 (Manual Offline Training = 1 Hour total):
 * 4. Manual Memory Palace Training: 60 Minutes (3600s countdown timer)
 *
 * Both Part 1 and Part 2 are required before midnight for the day to be marked Green / Completed.
 */
export function generateTasksForDay(day: number): ProtocolTask[] {
  const pegConfig = getPegTargetForDay(day);
  const nBackConfig = getMaxDualNBackForDay(day);

  return [
    {
      id: 'mnemonic-pegs',
      title: 'Mnemonic Major Pegs (20 Min)',
      discipline: 'Number-to-Image Data Keys',
      targetDescription: `Master 20 minutes of number-to-image phonetic peg conversions (${pegConfig.label}; strictly locks at 20m)`,
      targetCount: 20,
      currentCount: 0,
      targetSeconds: 1200,
      secondsElapsed: 0,
      maxAllowedLevel: pegConfig.label,
      isCompleted: false,
      gameMode: 'mnemonic-pegs',
    },
    {
      id: 'dual-nback',
      title: 'Dual N-Back Buffer (20 Min)',
      discipline: 'Working Memory Capacity & Speaking Focus',
      targetDescription: `Train 20 minutes of dual auditory + spatial working memory RAM buffer at N=${nBackConfig.targetN} (strictly locks at 20m)`,
      targetCount: 20,
      currentCount: 0,
      targetSeconds: 1200,
      secondsElapsed: 0,
      maxAllowedLevel: nBackConfig.maxN,
      isCompleted: false,
      gameMode: 'dual-nback',
    },
    {
      id: 'symbol-detective',
      title: 'Symbol Detective Lab (20 Min)',
      discipline: 'Abstract Symbol Processing & Script Speed',
      targetDescription: 'Train 20 minutes of high-speed glyph discrimination and visual feature-binding (strictly locks at 20m)',
      targetCount: 20,
      currentCount: 0,
      targetSeconds: 1200,
      secondsElapsed: 0,
      maxAllowedLevel: 'Adaptive Speed',
      isCompleted: false,
      gameMode: 'symbol-detective',
    },
    {
      id: 'memory-palace',
      title: 'Manual Memory Palace Training (1 Hour)',
      discipline: 'Offline Deep Loci Visualization',
      targetDescription: 'Sit down and practice your memory palace loci manually with the 60-minute focus countdown timer (mandatory for daily streak)',
      targetCount: 60,
      currentCount: 0,
      targetSeconds: 3600,
      secondsElapsed: 0,
      maxAllowedLevel: '60 Min Offline Immersion',
      isCompleted: false,
      gameMode: 'memory-palace',
    },
  ];
}

export function generateSixDayStreakHistory(): Record<string, DayHistoryRecord> {
  return {};
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings
 */
export function getCalendarDayDifference(fromDateStr: string, toDateStr: string): number {
  try {
    const fromParts = fromDateStr.split('-').map(Number);
    const toParts = toDateStr.split('-').map(Number);
    const fromDate = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
    const toDate = new Date(toParts[0], toParts[1] - 1, toParts[2]);
    const diffMs = toDate.getTime() - fromDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Adds N days to a YYYY-MM-DD date string
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + daysToAdd);
    return getLocalDateString(d);
  } catch {
    return dateStr;
  }
}

/**
 * Checks whether all 4 designated disciplines are 100% complete:
 * 1. Mnemonic Pegs: 20m (1200s)
 * 2. Dual N-Back: 20m (1200s)
 * 3. Symbol Detective: 20m (1200s)
 * 4. Manual Memory Palace: 60m (3600s)
 */
export function checkIsDailyProtocolFullyDone(
  tasks: ProtocolTask[],
  todayGamesBreakdown?: Record<string, number>,
  memoryPalaceTimer?: MemoryPalaceTimerState
): boolean {
  if (!tasks || tasks.length < 4) return false;

  const pegsDone =
    tasks.find((t) => t.id === 'mnemonic-pegs')?.isCompleted ||
    (todayGamesBreakdown?.['mnemonic-pegs'] || 0) >= 1200;

  const nbackDone =
    tasks.find((t) => t.id === 'dual-nback')?.isCompleted ||
    (todayGamesBreakdown?.['dual-nback'] || 0) >= 1200;

  const detectiveDone =
    tasks.find((t) => t.id === 'symbol-detective')?.isCompleted ||
    (todayGamesBreakdown?.['symbol-detective'] || 0) >= 1200;

  const palaceDone =
    tasks.find((t) => t.id === 'memory-palace')?.isCompleted ||
    memoryPalaceTimer?.isCompleted ||
    (todayGamesBreakdown?.['memory-palace'] || 0) >= 3600;

  return Boolean(pegsDone && nbackDone && detectiveDone && palaceDone);
}

/**
 * Loads daily protocol state and handles automatic calendar day progression.
 * If user skips or misses days, every missed day is explicitly recorded as Red (Failed)
 * and day counting always moves forward with real calendar time.
 */
export function loadDailyProtocol(): DailyProtocolState {
  const { dateString } = getCurrentCycleInfo();

  try {
    const raw = localStorage.getItem(PROTOCOL_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialProtocol(dateString, 1);
      saveDailyProtocol(initial);
      return initial;
    }

    const parsed: DailyProtocolState = JSON.parse(raw);

    // Ensure valid start date exists
    if (!parsed.startDate) {
      parsed.startDate = (parsed.currentCycleDate || dateString).slice(0, 10);
    }

    // Always compute current calendar day based on real elapsed days from startDate
    const daysSinceStart = Math.max(0, getCalendarDayDifference(parsed.startDate, dateString));
    const realCalendarDay = daysSinceStart + 1;
    const currentPhase = realCalendarDay <= 30 ? 1 : realCalendarDay <= 90 ? 2 : realCalendarDay <= 180 ? 3 : 4;

    const lastRecordedDate = (parsed.currentCycleDate || '').slice(0, 10);

    // Check if midnight or multiple days have passed
    if (lastRecordedDate && lastRecordedDate !== dateString) {
      const dayDiff = getCalendarDayDifference(lastRecordedDate, dateString);

      if (dayDiff > 0) {
        // Evaluate the previous recorded day
        const wasLastDayComplete = checkIsDailyProtocolFullyDone(
          parsed.tasks,
          undefined,
          parsed.memoryPalaceTimer
        );

        parsed.history = parsed.history || {};
        parsed.history[lastRecordedDate] = {
          date: lastRecordedDate,
          cycleKey: lastRecordedDate,
          curriculumDay: parsed.curriculumDay || 1,
          completed: wasLastDayComplete,
          failed: !wasLastDayComplete,
          score: wasLastDayComplete ? 100 : 0,
          completedAt: wasLastDayComplete ? (parsed.completedAt || new Date().toISOString()) : undefined,
          memoryPalaceCompleted: parsed.memoryPalaceTimer?.isCompleted ?? false,
          totalSeconds: wasLastDayComplete ? 7200 : 0,
        };

        // If user missed multiple intermediate days, record EVERY skipped day as FAILED (RED)
        for (let i = 1; i < dayDiff; i++) {
          const skippedDate = addDaysToDateString(lastRecordedDate, i);
          const skippedDayNumber = Math.max(1, getCalendarDayDifference(parsed.startDate, skippedDate) + 1);
          parsed.history[skippedDate] = {
            date: skippedDate,
            cycleKey: skippedDate,
            curriculumDay: skippedDayNumber,
            completed: false,
            failed: true,
            score: 0,
            memoryPalaceCompleted: false,
            totalSeconds: 0,
          };
        }

        // Reset for today's new cycle
        parsed.currentCycleDate = dateString;
        parsed.isLockedOut = false;
        parsed.completedAt = undefined;
        parsed.curriculumDay = realCalendarDay;
        parsed.currentPhase = currentPhase;
        parsed.tasks = generateTasksForDay(realCalendarDay);
        parsed.memoryPalaceTimer = {
          remainingSeconds: 3600,
          elapsedSeconds: 0,
          isRunning: false,
          isCompleted: false,
        };

        saveDailyProtocol(parsed);
        return parsed;
      }
    }

    // Upgrade migration: ensure today's tasks contain all 4 disciplines
    if (!parsed.tasks || parsed.tasks.length !== 4 || !parsed.tasks.some((t) => t.id === 'memory-palace')) {
      const freshTasks = generateTasksForDay(realCalendarDay);
      const upgradedTasks = freshTasks.map((fresh) => {
        const existing = parsed.tasks?.find((t) => t.id === fresh.id);
        if (existing) {
          return {
            ...fresh,
            currentCount: existing.currentCount || 0,
            secondsElapsed: existing.secondsElapsed || 0,
            isCompleted: existing.isCompleted || false,
          };
        }
        return fresh;
      });
      parsed.tasks = upgradedTasks;
    }

    // Ensure memoryPalaceTimer exists
    if (!parsed.memoryPalaceTimer) {
      const palaceTask = parsed.tasks.find((t) => t.id === 'memory-palace');
      parsed.memoryPalaceTimer = {
        remainingSeconds: palaceTask?.isCompleted ? 0 : 3600,
        elapsedSeconds: palaceTask?.isCompleted ? 3600 : 0,
        isRunning: false,
        isCompleted: palaceTask?.isCompleted || false,
      };
    }

    parsed.curriculumDay = realCalendarDay;
    parsed.currentPhase = currentPhase;
    saveDailyProtocol(parsed);
    return parsed;
  } catch {
    return createInitialProtocol(dateString, 1);
  }
}

export function createInitialProtocol(dateString: string, day = 1): DailyProtocolState {
  return {
    currentCycleDate: dateString,
    startDate: dateString,
    isLockedOut: false,
    curriculumDay: day,
    currentPhase: 1,
    tasks: generateTasksForDay(day),
    history: {},
    memoryPalaceTimer: {
      remainingSeconds: 3600,
      elapsedSeconds: 0,
      isRunning: false,
      isCompleted: false,
    },
  };
}

export function saveDailyProtocol(state: DailyProtocolState): void {
  try {
    localStorage.setItem(PROTOCOL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // LocalStorage fallback
  }
}

/**
 * Calculates streaks from history:
 * Consecutive past days must be completed (green) without failure (red).
 * If a past day was missed or failed, current streak breaks to 0.
 */
export function computeStreaksFromHistory(
  history: Record<string, DayHistoryRecord>,
  todayStr: string,
  isTodayDone: boolean
): { currentStreak: number; bestStreak: number } {
  const dates = Object.keys(history || {}).sort();
  let bestStreak = 0;
  let runningStreak = 0;

  for (const d of dates) {
    if (d === todayStr) continue; // handle today separately
    const record = history[d];
    if (record && record.completed && !record.failed) {
      runningStreak += 1;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = runningStreak;
  if (isTodayDone) {
    currentStreak += 1;
    if (currentStreak > bestStreak) bestStreak = currentStreak;
  }

  return { currentStreak, bestStreak };
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
