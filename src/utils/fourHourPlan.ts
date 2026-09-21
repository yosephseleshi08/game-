import { FourHourPlanState, FourHourTask, DailyProtocolState } from '../types';

export const FOUR_HOUR_PLAN_STORAGE_KEY = 'pmm_four_hour_plan_state';

export const DEFAULT_FOUR_HOUR_TASKS: Omit<FourHourTask, 'isCompleted' | 'completedAt' | 'elapsedSeconds'>[] = [
  // 1. Digital In-App Training Block (2 Hours = 120 Mins | Strict 30% / 70% Balance)
  // Part A: 30% Processor & Working Memory RAM (36 Minutes)
  {
    id: 'ayumu-digital',
    title: 'Ayumu Chimp Test (Flash Intake & Subitizing)',
    category: 'morning',
    targetMinutes: 18,
    gameMode: 'ayumu-chimp',
    description: 'Sub-second visual flash capture & parallel number subitizing without subvocalization',
    neuroImpact: 'Retinal iconic trace formation, subitizing threshold expansion, and rapid parallel visual intake.',
  },
  {
    id: 'dual-nback-digital',
    title: 'Dual N-Back (Working Memory RAM Buffer)',
    category: 'morning',
    targetMinutes: 18,
    gameMode: 'dual-nback',
    description: 'Fluid intelligence (Gf) & multi-stream working memory buffer scaling',
    neuroImpact: 'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density and executive RAM buffer expansion.',
  },
  // Part B: 70% Memory Palace Digital Architecture (84 Minutes)
  {
    id: 'palace-encoding-digital',
    title: 'Digital Palace: Loci Blueprinting & Fast Encoding',
    category: 'morning',
    targetMinutes: 42,
    gameMode: 'memory-palace',
    description: 'Constructing digital loci routes & high-speed multi-sensory item anchoring',
    neuroImpact: 'Bilateral parahippocampal cortex and spatial grid cell recruitment for rapid associative binding.',
  },
  {
    id: 'palace-retrieval-digital',
    title: 'Digital Palace: Reverse-Walk & Stress-Test Retrieval',
    category: 'morning',
    targetMinutes: 42,
    gameMode: 'memory-palace',
    description: 'Reverse traversal, random-access testing, and clearing ghostly residual images',
    neuroImpact: 'Hippocampal CA3-CA1 Long-Term Potentiation (LTP), spatial pathway consolidation, and ghosting elimination.',
  },

  // 2. Midday Recovery Anchor (20 Minutes)
  {
    id: 'midday-nsdr',
    title: 'NSDR / Power Nap & Hydration',
    category: 'midday',
    targetMinutes: 20,
    description: '20-min Non-Sleep Deep Rest or power nap + 500ml electrolyte hydration',
    neuroImpact: 'Resets striatal dopamine reserves, dissipates cognitive adenosine, and restores afternoon mental stamina.',
  },

  // 3. Real-Life Physical Practice Block (2 Hours = 120 Minutes)
  {
    id: 'physical-loci-scouting',
    title: 'Real-World Loci Scouting & Physical Anchoring',
    category: 'evening',
    targetMinutes: 60,
    isPhysical: true,
    description: 'Physically walk through real locations (home, neighborhood, campus, library, city streets). Scout, touch, and number 25–50 crisp permanent physical loci per location with a strict clockwise, non-crossing route.',
    neuroImpact: 'Retrosplenial cortex and posterior parietal coordinate mapping grounded in true proprioception, physical navigation, and vestibular-ocular stabilization.',
  },
  {
    id: 'physical-loci-retrieval',
    title: 'Physical Loci Live Encoding & Walking Retrieval',
    category: 'evening',
    targetMinutes: 60,
    isPhysical: true,
    description: 'Physically walk your real-world route while depositing complex real-world data; execute physical retrieval walks with eyes open under real-world movement and sensory load.',
    neuroImpact: 'High-order spatial-cognitive binding, stress-resilient recall under physical motion, and permanent biological memory consolidation.',
  },

  // 4. Nightly Sleep Protocol (7 Hours)
  {
    id: 'nightly-sleep',
    title: '7-Hour Restorative Sleep Protocol',
    category: 'night',
    targetMinutes: 420, // 7 Hours
    description: '4–5 complete 90-minute sleep cycles (pitch dark, cool room, zero food 3h before bed)',
    neuroImpact: 'Glymphatic clearance of metabolic toxins and deep slow-wave / REM synaptic consolidation.',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createFreshDailyTasks(): FourHourTask[] {
  return DEFAULT_FOUR_HOUR_TASKS.map((t) => ({
    ...t,
    isCompleted: false,
    elapsedSeconds: 0,
  }));
}

export function loadFourHourPlan(): FourHourPlanState {
  const todayStr = getTodayDateString();

  try {
    const raw = localStorage.getItem(FOUR_HOUR_PLAN_STORAGE_KEY);
    if (!raw) {
      const initial: FourHourPlanState = {
        currentDate: todayStr,
        tasks: createFreshDailyTasks(),
        currentStreak: 0,
        bestStreak: 0,
        totalSessionsCompleted: 0,
        history: {},
        nsdrElapsedSeconds: 0,
      };
      saveFourHourPlan(initial);
      return initial;
    }

    const parsed: FourHourPlanState = JSON.parse(raw);

    // If day rolled over
    if (parsed.currentDate !== todayStr) {
      const prevTrainingTasks = (parsed.tasks || []).filter((t) => t.category === 'morning' || t.category === 'evening');
      const allDone = prevTrainingTasks.length > 0 && prevTrainingTasks.every((t) => t.isCompleted);
      const totalMinutes = (parsed.tasks || []).filter((t) => t.isCompleted).reduce((sum, t) => sum + (t.category !== 'night' ? t.targetMinutes : 0), 0);

      const updatedHistory = {
        ...(parsed.history || {}),
        [parsed.currentDate]: {
          date: parsed.currentDate,
          tasks: parsed.tasks,
          allTrainingCompleted: allDone,
          totalTrainingMinutes: totalMinutes,
          completedAt: allDone ? new Date().toISOString() : undefined,
        },
      };

      const newStreak = allDone ? (parsed.currentStreak || 0) : (parsed.currentStreak || 0);

      const refreshed: FourHourPlanState = {
        ...parsed,
        currentDate: todayStr,
        tasks: createFreshDailyTasks(),
        currentStreak: newStreak,
        bestStreak: Math.max(parsed.bestStreak || 0, newStreak),
        history: updatedHistory,
        nsdrElapsedSeconds: 0,
        sleepRecord: undefined,
      };

      saveFourHourPlan(refreshed);
      return refreshed;
    }

    // Ensure the tasks strictly reflect the new 30/70 digital (2h) + physical (2h) schema
    const hasObsoleteTask = parsed.tasks.some((t) =>
      ['matrix-evening', 'pegs-evening', 'symbol-morning', 'ayumu-morning', 'dual-nback-morning', 'palace-evening'].includes(t.id)
    );
    if (hasObsoleteTask || parsed.tasks.length !== DEFAULT_FOUR_HOUR_TASKS.length) {
      parsed.tasks = createFreshDailyTasks();
      saveFourHourPlan(parsed);
      return parsed;
    }

    // Ensure all default tasks exist in case of schema update
    const existingTaskIds = new Set(parsed.tasks.map((t) => t.id));
    const mergedTasks = [...parsed.tasks];
    for (const def of DEFAULT_FOUR_HOUR_TASKS) {
      if (!existingTaskIds.has(def.id)) {
        mergedTasks.push({
          ...def,
          isCompleted: false,
          elapsedSeconds: 0,
        });
      }
    }

    return {
      ...parsed,
      tasks: mergedTasks,
    };
  } catch (err) {
    console.error('Error loading four hour plan state:', err);
    return {
      currentDate: todayStr,
      tasks: createFreshDailyTasks(),
      currentStreak: 0,
      bestStreak: 0,
      totalSessionsCompleted: 0,
      history: {},
      nsdrElapsedSeconds: 0,
    };
  }
}

export function saveFourHourPlan(state: FourHourPlanState): void {
  try {
    localStorage.setItem(FOUR_HOUR_PLAN_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving four hour plan state:', err);
  }
}

/**
 * Automatically synchronizes the 4-Hour Plan tasks with actual training time
 * and daily protocol completion. Prevents cheating by strictly deriving completion
 * from recorded gameplay seconds or verified daily protocol completion.
 */
export function syncFourHourPlanWithTraining(
  currentState: FourHourPlanState,
  todayGamesBreakdown: Record<string, number> = {},
  protocolState?: DailyProtocolState
): { updatedState: FourHourPlanState; newlyCompletedTaskIds: string[] } {
  const newlyCompletedTaskIds: string[] = [];

  const updatedTasks = currentState.tasks.map((task) => {
    // 1. If already completed, preserve status and update elapsed seconds if higher
    let elapsedSeconds = task.elapsedSeconds || 0;

    // Memory Palace split handling:
    // palace-encoding-digital uses the first 42 mins (2520s)
    // palace-retrieval-digital uses the second 42 mins (seconds from 2520 to 5040)
    if (task.gameMode === 'memory-palace') {
      const palaceTotalSeconds = todayGamesBreakdown['memory-palace'] || 0;
      if (task.id === 'palace-encoding-digital') {
        elapsedSeconds = Math.max(elapsedSeconds, Math.min(2520, palaceTotalSeconds));
      } else if (task.id === 'palace-retrieval-digital') {
        elapsedSeconds = Math.max(elapsedSeconds, Math.max(0, Math.min(2520, palaceTotalSeconds - 2520)));
      } else {
        elapsedSeconds = Math.max(elapsedSeconds, palaceTotalSeconds);
      }

      const targetSeconds = task.targetMinutes * 60;
      const protocolTaskDone = protocolState?.tasks?.find((pt) => pt.id === 'memory-palace')?.isCompleted;
      const fullProtocolLocked = protocolState?.isLockedOut;
      const isMet = elapsedSeconds >= targetSeconds || protocolTaskDone || fullProtocolLocked;

      if (isMet && !task.isCompleted) {
        newlyCompletedTaskIds.push(task.id);
        return {
          ...task,
          elapsedSeconds,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...task,
        elapsedSeconds,
      };
    }

    if (task.gameMode) {
      const modeSeconds = todayGamesBreakdown[task.gameMode] || 0;
      elapsedSeconds = Math.max(elapsedSeconds, modeSeconds);

      const targetSeconds = task.targetMinutes * 60;
      const protocolTaskDone = protocolState?.tasks?.find((pt) => pt.id === task.gameMode)?.isCompleted;
      const fullProtocolLocked = protocolState?.isLockedOut;

      const isMet = elapsedSeconds >= targetSeconds || protocolTaskDone || fullProtocolLocked;

      if (isMet && !task.isCompleted) {
        newlyCompletedTaskIds.push(task.id);
        return {
          ...task,
          elapsedSeconds,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...task,
        elapsedSeconds,
      };
    }

    // Physical tasks auto-check
    if (task.isPhysical) {
      const targetSeconds = task.targetMinutes * 60;
      if (elapsedSeconds >= targetSeconds && !task.isCompleted) {
        newlyCompletedTaskIds.push(task.id);
        return {
          ...task,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }
      return task;
    }

    // 2. Midday NSDR Task auto-verification
    if (task.id === 'midday-nsdr') {
      const nsdrSeconds = currentState.nsdrElapsedSeconds || 0;
      const targetSeconds = task.targetMinutes * 60; // 1200 seconds

      if (nsdrSeconds >= targetSeconds && !task.isCompleted) {
        newlyCompletedTaskIds.push(task.id);
        return {
          ...task,
          elapsedSeconds: nsdrSeconds,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...task,
        elapsedSeconds: nsdrSeconds,
      };
    }

    // 3. Nightly Sleep Task auto-verification
    if (task.id === 'nightly-sleep') {
      if (currentState.sleepRecord?.verified && !task.isCompleted) {
        newlyCompletedTaskIds.push(task.id);
        return {
          ...task,
          elapsedSeconds: Math.round((currentState.sleepRecord.durationHours || 7) * 3600),
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }
    }

    return task;
  });

  // Calculate streak progression if all 6 core cognitive training tasks are finished
  const coreTasks = updatedTasks.filter((t) => t.category === 'morning' || t.category === 'evening');
  const allCoreDone = coreTasks.length > 0 && coreTasks.every((t) => t.isCompleted);
  const wasAllCoreDone = currentState.tasks.filter((t) => t.category === 'morning' || t.category === 'evening').every((t) => t.isCompleted);

  let updatedStreak = currentState.currentStreak || 0;
  if (allCoreDone && !wasAllCoreDone) {
    updatedStreak += 1;
  }

  const updatedState: FourHourPlanState = {
    ...currentState,
    tasks: updatedTasks,
    currentStreak: updatedStreak,
    bestStreak: Math.max(currentState.bestStreak || 0, updatedStreak),
    totalSessionsCompleted: (currentState.totalSessionsCompleted || 0) + newlyCompletedTaskIds.length,
  };

  saveFourHourPlan(updatedState);
  return { updatedState, newlyCompletedTaskIds };
}

/**
 * Records physical training seconds and notes for real-world loci practice
 */
export function recordPhysicalPracticeTime(
  taskId: string,
  secondsToAdd: number,
  notes?: string
): FourHourPlanState {
  const current = loadFourHourPlan();
  const updatedTasks = current.tasks.map((t) => {
    if (t.id === taskId) {
      const nextSeconds = (t.elapsedSeconds || 0) + secondsToAdd;
      const targetSeconds = t.targetMinutes * 60;
      const isCompleted = nextSeconds >= targetSeconds || t.isCompleted;
      return {
        ...t,
        elapsedSeconds: nextSeconds,
        isCompleted,
        completedAt: isCompleted && !t.isCompleted ? new Date().toISOString() : t.completedAt,
        physicalNotes: notes !== undefined ? notes : t.physicalNotes,
      };
    }
    return t;
  });

  const updated: FourHourPlanState = {
    ...current,
    tasks: updatedTasks,
  };

  saveFourHourPlan(updated);
  return updated;
}

/**
 * Toggles manual completion for real-world physical practice (e.g. if completed outdoors away from device)
 */
export function togglePhysicalTaskManualCompletion(
  taskId: string,
  isDone: boolean,
  notes?: string
): FourHourPlanState {
  const current = loadFourHourPlan();
  const updatedTasks = current.tasks.map((t) => {
    if (t.id === taskId) {
      const targetSeconds = t.targetMinutes * 60;
      return {
        ...t,
        isCompleted: isDone,
        elapsedSeconds: isDone ? Math.max(t.elapsedSeconds || 0, targetSeconds) : 0,
        completedAt: isDone ? new Date().toISOString() : undefined,
        physicalNotes: notes !== undefined ? notes : t.physicalNotes,
      };
    }
    return t;
  });

  const updated: FourHourPlanState = {
    ...current,
    tasks: updatedTasks,
  };

  saveFourHourPlan(updated);
  return updated;
}

/**
 * Records time spent in the dedicated 20-min NSDR rest player
 */
export function recordNsdrSessionTime(secondsToAdd: number): FourHourPlanState {
  const current = loadFourHourPlan();
  const nextSeconds = (current.nsdrElapsedSeconds || 0) + secondsToAdd;
  const isCompleted = nextSeconds >= 20 * 60;

  const updatedTasks = current.tasks.map((t) => {
    if (t.id === 'midday-nsdr') {
      return {
        ...t,
        elapsedSeconds: nextSeconds,
        isCompleted: isCompleted || t.isCompleted,
        completedAt: isCompleted && !t.isCompleted ? new Date().toISOString() : t.completedAt,
      };
    }
    return t;
  });

  const updated: FourHourPlanState = {
    ...current,
    nsdrElapsedSeconds: nextSeconds,
    tasks: updatedTasks,
  };

  saveFourHourPlan(updated);
  return updated;
}

/**
 * Verifies sleep record against 7-hour clinical threshold
 */
export function verifySleepProtocol(
  bedtime: string,
  wakeTime: string
): { success: boolean; durationHours: number; message: string; updatedState: FourHourPlanState } {
  const current = loadFourHourPlan();

  if (!bedtime || !wakeTime) {
    return {
      success: false,
      durationHours: 0,
      message: 'Please provide both bedtime and wake time to verify sleep duration.',
      updatedState: current,
    };
  }

  const [bHours, bMins] = bedtime.split(':').map(Number);
  const [wHours, wMins] = wakeTime.split(':').map(Number);

  let bTotalMinutes = bHours * 60 + bMins;
  let wTotalMinutes = wHours * 60 + wMins;

  if (wTotalMinutes < bTotalMinutes) {
    // Crossed midnight
    wTotalMinutes += 24 * 60;
  }

  const durationMinutes = wTotalMinutes - bTotalMinutes;
  const durationHours = Math.round((durationMinutes / 60) * 10) / 10;

  if (durationHours >= 7.0) {
    const updatedTasks = current.tasks.map((t) => {
      if (t.id === 'nightly-sleep') {
        return {
          ...t,
          elapsedSeconds: durationMinutes * 60,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    const updated: FourHourPlanState = {
      ...current,
      sleepRecord: {
        bedtime,
        wakeTime,
        durationHours,
        verified: true,
      },
      tasks: updatedTasks,
    };

    saveFourHourPlan(updated);
    return {
      success: true,
      durationHours,
      message: `Verified: ${durationHours} hours of sleep logged (${Math.floor(durationHours / 1.5)} full 90-min cycles). Glymphatic recovery achieved!`,
      updatedState: updated,
    };
  } else {
    return {
      success: false,
      durationHours,
      message: `Logged duration is ${durationHours}h. Minimum 7.0h (420m) required to activate full slow-wave synaptic consolidation.`,
      updatedState: current,
    };
  }
}

export function getCompletedTrainingStats(tasks: FourHourTask[]): {
  completedMinutes: number;
  totalTargetMinutes: number;
  percentage: number;
  completedTasksCount: number;
  totalTrainingTasksCount: number;
  allTrainingCompleted: boolean;
} {
  const trainingTasks = tasks.filter((t) => t.category === 'morning' || t.category === 'evening');
  const completedTrainingTasks = trainingTasks.filter((t) => t.isCompleted);

  // Sum actual practice minutes (capped at target per task for percentage calculation)
  const completedMinutes = trainingTasks.reduce((acc, t) => {
    if (t.isCompleted) return acc + t.targetMinutes;
    const elapsedMins = Math.floor((t.elapsedSeconds || 0) / 60);
    return acc + Math.min(t.targetMinutes, elapsedMins);
  }, 0);

  const totalTargetMinutes = 240; // 4 Hours (120 min morning + 120 min evening)
  const percentage = Math.min(100, Math.round((completedMinutes / totalTargetMinutes) * 100));
  const allTrainingCompleted = completedTrainingTasks.length === trainingTasks.length;

  return {
    completedMinutes,
    totalTargetMinutes,
    percentage,
    completedTasksCount: completedTrainingTasks.length,
    totalTrainingTasksCount: trainingTasks.length,
    allTrainingCompleted,
  };
}
