import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'yoseph_master_progress.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial state for Yoseph
const DEFAULT_YOSEPH_STATE = {
  stats: {
    xp: 0,
    level: 1,
    totalGamesPlayed: 0,
    matrixMaxLevel: 1,
    ayumuMaxNumbers: 3,
    detectiveHighScore: 0,
    fastestFlashMs: 2000,
    currentStreak: 0,
    bestStreak: 0,
    accuracyRate: 0,
    totalAttempts: 0,
    totalCorrectAttempts: 0,
    dualNBackMaxN: 1,
    mnemonicConversionCount: 0,
    cardsMastered: 0,
    pqHistory: [],
    progressHistory: [],
  },
  protocol: {
    curriculumDay: 1,
    currentPhase: 1,
    isLockedOut: false,
    tasks: [
      {
        id: 'mnemonic-pegs',
        title: 'Mnemonic Major Pegs (20 Min)',
        discipline: 'Number-to-Image Data Keys',
        targetDescription: 'Master 20 minutes of number-to-image phonetic peg conversions (0-9 Foundation; 20m goal)',
        targetCount: 20,
        currentCount: 0,
        maxAllowedLevel: '0-9 Foundation',
        isCompleted: false,
        gameMode: 'mnemonic-pegs',
      },
      {
        id: 'dual-nback',
        title: 'Dual N-Back Buffer (20 Min)',
        discipline: 'Working Memory Capacity & Speaking Focus',
        targetDescription: 'Train 20 minutes of dual auditory + spatial working memory RAM buffer at N=1 (20m goal)',
        targetCount: 20,
        currentCount: 0,
        maxAllowedLevel: 1,
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
    ],
    memoryPalaceTimer: {
      remainingSeconds: 3600,
      elapsedSeconds: 0,
      isRunning: false,
      isCompleted: false,
    },
    history: {},
  },
  freeTrainingStats: {
    totalMinutesPracticed: 0,
    totalSecondsPracticed: 0,
    totalRepsCompleted: 0,
    doomScrollMinutesSaved: 0,
    sessionsCount: 0,
    lastSessionDate: new Date().toISOString(),
    todayCurriculumDay: 1,
    todaySeconds: 0,
    todayReps: 0,
    todayGamesBreakdown: {},
    dailyHistory: {},
  },
  profile: {
    id: 'yoseph-master',
    email: 'yoseph@game.app',
    username: 'Yoseph (Yosi)',
    photoUrl: 'yosi-prime',
    avatarPresetId: 'yosi-prime',
    level: 1,
    xp: 0,
    rankTitle: 'Novice Observer',
    curriculumDay: 1,
    currentStreak: 0,
    bestStreak: 0,
    ayumuMaxNumbers: 3,
    matrixMaxLevel: 1,
    dualNBackMaxN: 1,
    fastestFlashMs: 2000,
    detectiveHighScore: 0,
    lockedFlashSpeed: 1200,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  lastSyncedAt: new Date().toISOString(),
};

function readMasterData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading master progress file:', err);
  }
  return DEFAULT_YOSEPH_STATE;
}

function writeMasterData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing master progress file:', err);
  }
}

// In-memory cache backed by file
let masterData = readMasterData();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API 1: Verify Yoseph's Password
  app.post('/api/yoseph/verify-password', (req, res) => {
    const { password } = req.body;
    if (password && String(password).trim().toLowerCase() === 'yoseph535') {
      res.json({
        success: true,
        message: 'Welcome back Yoseph!',
        athlete: 'Yoseph (Yosi)',
      });
    } else {
      res.status(401).json({
        success: false,
        message: "This game is only for Yoseph. If you don't know the password, you can't play or see Yoseph's progress.",
      });
    }
  });

  function getUtcOrLocalDateStr(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Roll over masterData if day has passed (strictly requires client's local date to avoid server UTC resets)
  function ensureMasterDataUpToDate(clientDateStr?: string) {
    if (!clientDateStr) return; // Prevent server UTC clock from wiping user's in-progress day
    const todayStr = clientDateStr;
    const currentProtocol = masterData.protocol;
    if (!currentProtocol) return;

    const recordedDate = (currentProtocol.currentCycleDate || '').slice(0, 10);
    if (recordedDate && recordedDate < todayStr) {
      // Evaluate previous day: primary criterion is completing the 3 games (20 min each)
      const were3GamesDone = ['mnemonic-pegs', 'dual-nback', 'symbol-detective'].every((id) => {
        const t = (currentProtocol.tasks || []).find((task: any) => task.id === id);
        return t && (t.isCompleted || (t.secondsElapsed || 0) >= 1200);
      });
      const wasPalaceDone = Boolean(
        currentProtocol.memoryPalaceTimer?.isCompleted ||
        (currentProtocol.memoryPalaceTimer?.elapsedSeconds || 0) >= 3600
      );
      const isDayComplete = were3GamesDone;

      masterData.protocol.history = masterData.protocol.history || {};
      masterData.protocol.history[recordedDate] = {
        date: recordedDate,
        cycleKey: recordedDate,
        curriculumDay: currentProtocol.curriculumDay || 1,
        completed: isDayComplete,
        failed: !isDayComplete,
        score: isDayComplete ? 100 : 0,
        memoryPalaceCompleted: wasPalaceDone,
        totalSeconds: isDayComplete ? 7200 : (currentProtocol.memoryPalaceTimer?.elapsedSeconds || 0),
      };

      // Reset today for fresh 60 minutes memory palace and 0 elapsed on games
      masterData.protocol.currentCycleDate = todayStr;
      masterData.protocol.isLockedOut = false;
      masterData.protocol.curriculumDay = (currentProtocol.curriculumDay || 1) + 1;
      masterData.protocol.memoryPalaceTimer = {
        remainingSeconds: 3600,
        elapsedSeconds: 0,
        isRunning: false,
        isCompleted: false,
      };
      if (masterData.protocol.tasks) {
        masterData.protocol.tasks = masterData.protocol.tasks.map((t: any) => ({
          ...t,
          currentCount: 0,
          secondsElapsed: 0,
          isCompleted: false,
        }));
      }

      // Reset free training today's seconds & breakdown
      if (masterData.freeTrainingStats) {
        if (masterData.freeTrainingStats.todaySeconds > 0) {
          masterData.freeTrainingStats.dailyHistory = masterData.freeTrainingStats.dailyHistory || {};
          masterData.freeTrainingStats.dailyHistory[recordedDate] = {
            date: recordedDate,
            cycleKey: recordedDate,
            curriculumDay: currentProtocol.curriculumDay || 1,
            seconds: masterData.freeTrainingStats.todaySeconds,
            reps: masterData.freeTrainingStats.todayReps || 0,
            gamesBreakdown: { ...(masterData.freeTrainingStats.todayGamesBreakdown || {}) },
          };
        }
        masterData.freeTrainingStats.todaySeconds = 0;
        masterData.freeTrainingStats.todayReps = 0;
        masterData.freeTrainingStats.todayGamesBreakdown = {};
        masterData.freeTrainingStats.currentDayCycle = todayStr;
      }

      writeMasterData(masterData);
    }
  }

  // API 2: Fetch Yoseph's Synchronized Master Progress
  app.get('/api/yoseph/progress', (req, res) => {
    const clientDate = typeof req.query.date === 'string' ? req.query.date : undefined;
    ensureMasterDataUpToDate(clientDate);
    res.json(masterData);
  });

  // API 3: Update and Merge Yoseph's Master Progress from any device
  app.post('/api/yoseph/progress', (req, res) => {
    const incoming = req.body;
    if (!incoming || !incoming.stats || !incoming.protocol) {
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const currentStats = masterData.stats || DEFAULT_YOSEPH_STATE.stats;
    const incomingStats = incoming.stats;

    const currentProtocol = masterData.protocol || DEFAULT_YOSEPH_STATE.protocol;
    const incomingProtocol = incoming.protocol;

    const currentDateStr = (currentProtocol.currentCycleDate || '').slice(0, 10);
    const incomingDateStr = (incomingProtocol.currentCycleDate || '').slice(0, 10);

    // Merge stats: keep highest XP, level, streaks, and best game scores
    const mergedXp = Math.max(currentStats.xp || 0, incomingStats.xp || 0);
    const mergedCurrentStreak = Math.max(currentStats.currentStreak || 0, incomingStats.currentStreak || 0);
    const mergedBestStreak = Math.max(
      currentStats.bestStreak || 0,
      incomingStats.bestStreak || 0,
      mergedCurrentStreak
    );

    const mergedStats = {
      ...currentStats,
      ...incomingStats,
      xp: mergedXp,
      level: Math.max(currentStats.level || 1, incomingStats.level || 1),
      totalGamesPlayed: Math.max(currentStats.totalGamesPlayed || 0, incomingStats.totalGamesPlayed || 0),
      currentStreak: mergedCurrentStreak,
      bestStreak: mergedBestStreak,
      ayumuMaxNumbers: Math.max(currentStats.ayumuMaxNumbers || 3, incomingStats.ayumuMaxNumbers || 3),
      matrixMaxLevel: Math.max(currentStats.matrixMaxLevel || 1, incomingStats.matrixMaxLevel || 1),
      dualNBackMaxN: Math.max(currentStats.dualNBackMaxN || 1, incomingStats.dualNBackMaxN || 1),
      detectiveHighScore: Math.max(currentStats.detectiveHighScore || 0, incomingStats.detectiveHighScore || 0),
      fastestFlashMs: Math.min(
        currentStats.fastestFlashMs > 0 ? currentStats.fastestFlashMs : 2000,
        incomingStats.fastestFlashMs > 0 ? incomingStats.fastestFlashMs : 2000
      ),
    };

    // Combine history first
    const mergedHistory = {
      ...(currentProtocol.history || {}),
      ...(incomingProtocol.history || {}),
    };

    const isSameDate = currentDateStr === incomingDateStr;
    const isIncomingNewer = incomingDateStr > currentDateStr;
    const isCurrentNewer = currentDateStr > incomingDateStr;

    // If day rolled over from server to incoming (incoming is today, server was yesterday)
    if (isIncomingNewer && currentDateStr) {
      const wasServerPalaceDone = Boolean(
        currentProtocol.memoryPalaceTimer?.isCompleted ||
        (currentProtocol.memoryPalaceTimer?.elapsedSeconds || 0) >= 3600
      );
      const wereServerTasksDone = (currentProtocol.tasks || []).length >= 4 &&
        (currentProtocol.tasks || []).every((t: any) => t.isCompleted);
      const isPastDayComplete = Boolean(wasServerPalaceDone && wereServerTasksDone);

      mergedHistory[currentDateStr] = {
        date: currentDateStr,
        cycleKey: currentDateStr,
        curriculumDay: currentProtocol.curriculumDay || 1,
        completed: isPastDayComplete,
        failed: !isPastDayComplete,
        score: isPastDayComplete ? 100 : 0,
        memoryPalaceCompleted: wasServerPalaceDone,
        totalSeconds: isPastDayComplete ? 7200 : (currentProtocol.memoryPalaceTimer?.elapsedSeconds || 0),
      };
    } else if (isCurrentNewer && incomingDateStr) {
      const wasIncomingPalaceDone = Boolean(
        incomingProtocol.memoryPalaceTimer?.isCompleted ||
        (incomingProtocol.memoryPalaceTimer?.elapsedSeconds || 0) >= 3600
      );
      const wereIncomingTasksDone = (incomingProtocol.tasks || []).length >= 4 &&
        (incomingProtocol.tasks || []).every((t: any) => t.isCompleted);
      const isPastDayComplete = Boolean(wasIncomingPalaceDone && wereIncomingTasksDone);

      mergedHistory[incomingDateStr] = {
        date: incomingDateStr,
        cycleKey: incomingDateStr,
        curriculumDay: incomingProtocol.curriculumDay || 1,
        completed: isPastDayComplete,
        failed: !isPastDayComplete,
        score: isPastDayComplete ? 100 : 0,
        memoryPalaceCompleted: wasIncomingPalaceDone,
        totalSeconds: isPastDayComplete ? 7200 : (incomingProtocol.memoryPalaceTimer?.elapsedSeconds || 0),
      };
    }

    // Determine target day and active memory palace timer
    let activeDateStr = isSameDate ? currentDateStr : (isIncomingNewer ? incomingDateStr : currentDateStr);
    let higherDay = Math.max(currentProtocol.curriculumDay || 1, incomingProtocol.curriculumDay || 1);

    let mergedMemoryPalaceTimer: any;
    if (isSameDate) {
      // Both devices are on the SAME day: merge elapsed seconds so progress syncs across PC and phone!
      const currentTimer = currentProtocol.memoryPalaceTimer;
      const incomingTimer = incomingProtocol.memoryPalaceTimer;
      const currentElapsed = currentTimer?.elapsedSeconds || 0;
      const incomingElapsed = incomingTimer?.elapsedSeconds || 0;
      const bestElapsed = Math.max(currentElapsed, incomingElapsed);
      const isPalaceDone = Boolean(currentTimer?.isCompleted || incomingTimer?.isCompleted || bestElapsed >= 3600);
      const bestRemaining = isPalaceDone ? 0 : Math.max(0, 3600 - bestElapsed);

      mergedMemoryPalaceTimer = {
        elapsedSeconds: bestElapsed,
        remainingSeconds: bestRemaining,
        isRunning: false,
        isCompleted: isPalaceDone,
        lastTickDate: incomingTimer?.lastTickDate || currentTimer?.lastTickDate,
      };
    } else if (isIncomingNewer) {
      // Incoming device is on the new day -> take incoming timer (fresh 60m if starting today)
      mergedMemoryPalaceTimer = incomingProtocol.memoryPalaceTimer || {
        elapsedSeconds: 0,
        remainingSeconds: 3600,
        isRunning: false,
        isCompleted: false,
      };
    } else {
      // Current server is already on the newer day
      mergedMemoryPalaceTimer = currentProtocol.memoryPalaceTimer || {
        elapsedSeconds: 0,
        remainingSeconds: 3600,
        isRunning: false,
        isCompleted: false,
      };
    }

    // Free training stats merge
    const currentFree = masterData.freeTrainingStats || DEFAULT_YOSEPH_STATE.freeTrainingStats;
    const incomingFree = incoming.freeTrainingStats || {};

    let mergedBreakdown: Record<string, number> = {};
    if (isSameDate) {
      const allGameModes = Array.from(new Set([
        ...Object.keys(currentFree.todayGamesBreakdown || {}),
        ...Object.keys(incomingFree.todayGamesBreakdown || {}),
        'memory-palace',
        'mnemonic-pegs',
        'dual-nback',
        'symbol-detective',
      ]));

      for (const gm of allGameModes) {
        mergedBreakdown[gm] = Math.max(
          currentFree.todayGamesBreakdown?.[gm] || 0,
          incomingFree.todayGamesBreakdown?.[gm] || 0,
          gm === 'memory-palace' ? (mergedMemoryPalaceTimer?.elapsedSeconds || 0) : 0
        );
      }
    } else if (isIncomingNewer) {
      mergedBreakdown = { ...(incomingFree.todayGamesBreakdown || {}) };
    } else {
      mergedBreakdown = { ...(currentFree.todayGamesBreakdown || {}) };
    }

    // Guarantee all 4 core tasks exist and merge elapsed seconds
    const standardTaskIds = ['mnemonic-pegs', 'dual-nback', 'symbol-detective', 'memory-palace'];
    const allKnownTasks = [...(currentProtocol.tasks || []), ...(incomingProtocol.tasks || [])];
    const mergedTasks = standardTaskIds.map((id) => {
      const ct = currentProtocol.tasks?.find((t: any) => t.id === id);
      const it = incomingProtocol.tasks?.find((t: any) => t.id === id);
      const template = (isIncomingNewer ? it : (isCurrentNewer ? ct : (it || ct))) || allKnownTasks.find((t: any) => t.id === id) || {
        id,
        title: id === 'memory-palace' ? 'Manual Memory Palace Training (1 Hour)' : id,
        discipline: id === 'memory-palace' ? 'Offline Deep Loci Visualization' : id,
        targetDescription: '',
        targetCount: id === 'memory-palace' ? 60 : 20,
        currentCount: 0,
        targetSeconds: id === 'memory-palace' ? 3600 : 1200,
        secondsElapsed: 0,
        isCompleted: false,
        gameMode: id,
      };

      let maxSecs = 0;
      if (isSameDate) {
        maxSecs = Math.max(
          ct?.secondsElapsed || 0,
          it?.secondsElapsed || 0,
          mergedBreakdown[id] || 0,
          id === 'memory-palace' ? (mergedMemoryPalaceTimer?.elapsedSeconds || 0) : 0
        );
      } else if (isIncomingNewer) {
        maxSecs = Math.max(
          it?.secondsElapsed || 0,
          mergedBreakdown[id] || 0,
          id === 'memory-palace' ? (mergedMemoryPalaceTimer?.elapsedSeconds || 0) : 0
        );
      } else {
        maxSecs = Math.max(
          ct?.secondsElapsed || 0,
          mergedBreakdown[id] || 0,
          id === 'memory-palace' ? (mergedMemoryPalaceTimer?.elapsedSeconds || 0) : 0
        );
      }

      const maxCount = Math.max(
        Math.floor(maxSecs / 60),
        isSameDate ? Math.max(ct?.currentCount || 0, it?.currentCount || 0) : (isIncomingNewer ? (it?.currentCount || 0) : (ct?.currentCount || 0))
      );
      const isTaskDone = Boolean(
        (template.targetCount && maxCount >= template.targetCount) ||
        (template.targetSeconds && maxSecs >= template.targetSeconds) ||
        (id === 'memory-palace' && mergedMemoryPalaceTimer?.isCompleted) ||
        (isSameDate && (ct?.isCompleted || it?.isCompleted)) ||
        (isIncomingNewer && it?.isCompleted) ||
        (isCurrentNewer && ct?.isCompleted)
      );

      return {
        ...template,
        currentCount: maxCount,
        secondsElapsed: maxSecs,
        isCompleted: isTaskDone,
      };
    });

    const isAllThreeGamesDone = ['mnemonic-pegs', 'dual-nback', 'symbol-detective'].every((id) => {
      const task = mergedTasks.find((t) => t.id === id);
      return task && (task.isCompleted || (task.secondsElapsed || 0) >= 1200);
    });

    const mergedProtocol = {
      ...(isIncomingNewer ? incomingProtocol : (isCurrentNewer ? currentProtocol : incomingProtocol)),
      currentCycleDate: activeDateStr,
      curriculumDay: higherDay,
      tasks: mergedTasks,
      memoryPalaceTimer: mergedMemoryPalaceTimer,
      isLockedOut: Boolean(isSameDate ? (currentProtocol.isLockedOut || incomingProtocol.isLockedOut || isAllThreeGamesDone) : isAllThreeGamesDone),
      history: mergedHistory,
    };

    const calculatedTodaySeconds = Object.values(mergedBreakdown).reduce((a, b) => a + b, 0);

    const mergedFree = {
      ...currentFree,
      ...(isIncomingNewer ? incomingFree : (isCurrentNewer ? currentFree : incomingFree)),
      currentDayCycle: activeDateStr,
      totalSecondsPracticed: Math.max(
        currentFree.totalSecondsPracticed || 0,
        incomingFree.totalSecondsPracticed || 0,
        calculatedTodaySeconds
      ),
      totalMinutesPracticed: Math.max(
        currentFree.totalMinutesPracticed || 0,
        incomingFree.totalMinutesPracticed || 0,
        Math.floor(Math.max(currentFree.totalSecondsPracticed || 0, incomingFree.totalSecondsPracticed || 0, calculatedTodaySeconds) / 60)
      ),
      totalRepsCompleted: Math.max(currentFree.totalRepsCompleted || 0, incomingFree.totalRepsCompleted || 0),
      todaySeconds: calculatedTodaySeconds,
      todayGamesBreakdown: mergedBreakdown,
      dailyHistory: {
        ...(currentFree.dailyHistory || {}),
        ...(incomingFree.dailyHistory || {}),
      },
    };

    // Merge 4-hour plan
    const currentFourHour = masterData.fourHourPlan;
    const incomingFourHour = incoming.fourHourPlan;
    let mergedFourHour = incomingFourHour || currentFourHour;
    if (currentFourHour && incomingFourHour) {
      const isPlanIncomingNewer = (incomingFourHour.currentDate || '') > (currentFourHour.currentDate || '');
      const isPlanSameDate = (incomingFourHour.currentDate || '') === (currentFourHour.currentDate || '');

      let planTasks = incomingFourHour.tasks;
      if (isPlanSameDate) {
        planTasks = incomingFourHour.tasks?.map((it: any) => {
          const ct = currentFourHour.tasks?.find((t: any) => t.id === it.id);
          const elapsed = Math.max(it.elapsedSeconds || 0, ct?.elapsedSeconds || 0, mergedBreakdown[it.gameMode] || 0);
          return {
            ...it,
            elapsedSeconds: elapsed,
            isCompleted: Boolean(it.isCompleted || ct?.isCompleted || elapsed >= it.targetMinutes * 60),
          };
        });
      } else if (!isPlanIncomingNewer) {
        planTasks = currentFourHour.tasks;
      }

      mergedFourHour = {
        ...(isPlanIncomingNewer ? incomingFourHour : currentFourHour),
        currentDate: isPlanIncomingNewer ? incomingFourHour.currentDate : currentFourHour.currentDate,
        tasks: planTasks,
        currentStreak: Math.max(currentFourHour.currentStreak || 0, incomingFourHour.currentStreak || 0),
        bestStreak: Math.max(currentFourHour.bestStreak || 0, incomingFourHour.bestStreak || 0),
        history: {
          ...(currentFourHour.history || {}),
          ...(incomingFourHour.history || {}),
        },
      };
    }

    const mergedProfile = {
      ...(masterData.profile || DEFAULT_YOSEPH_STATE.profile),
      ...(incoming.profile || {}),
      level: mergedStats.level,
      xp: mergedStats.xp,
      curriculumDay: mergedProtocol.curriculumDay,
      currentStreak: mergedStats.currentStreak,
      bestStreak: mergedStats.bestStreak,
      updatedAt: new Date().toISOString(),
    };

    masterData = {
      stats: mergedStats,
      protocol: mergedProtocol,
      freeTrainingStats: mergedFree,
      fourHourPlan: mergedFourHour,
      profile: mergedProfile,
      lastSyncedAt: new Date().toISOString(),
    };

    writeMasterData(masterData);
    res.json(masterData);
  });

  // API 4: Reset all progress to fresh Day 1 / 0 XP
  app.post('/api/yoseph/reset', (_req, res) => {
    masterData = {
      ...DEFAULT_YOSEPH_STATE,
      lastSyncedAt: new Date().toISOString(),
    };
    writeMasterData(masterData);
    res.json({ success: true, message: 'Progress reset to Day 1 / 0 XP for Yoseph.' });
  });

  const httpServer = http.createServer(app);

  // Serve static in production or attach Vite middleware in development
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: {
          server: httpServer,
        },
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yosi Game Engine] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
