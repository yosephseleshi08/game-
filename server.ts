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

  // API 2: Fetch Yoseph's Synchronized Master Progress
  app.get('/api/yoseph/progress', (_req, res) => {
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

    // Merge memory palace timer (Loci 60m focus timer) across devices
    const currentTimer = currentProtocol.memoryPalaceTimer;
    const incomingTimer = incomingProtocol.memoryPalaceTimer;
    const currentElapsed = currentTimer?.elapsedSeconds || 0;
    const incomingElapsed = incomingTimer?.elapsedSeconds || 0;
    const bestElapsed = Math.max(currentElapsed, incomingElapsed);
    const isPalaceDone = Boolean(currentTimer?.isCompleted || incomingTimer?.isCompleted || bestElapsed >= 3600);
    const bestRemaining = isPalaceDone ? 0 : Math.max(0, 3600 - bestElapsed);

    const mergedMemoryPalaceTimer = {
      elapsedSeconds: bestElapsed,
      remainingSeconds: bestRemaining,
      isRunning: false,
      isCompleted: isPalaceDone,
      lastTickDate: incomingTimer?.lastTickDate || currentTimer?.lastTickDate,
    };

    // Merge protocol: keep higher curriculum day and combine history
    const mergedHistory = {
      ...(currentProtocol.history || {}),
      ...(incomingProtocol.history || {}),
    };

    const higherDay = Math.max(currentProtocol.curriculumDay || 1, incomingProtocol.curriculumDay || 1);

    // Guarantee all 4 core tasks exist and merge elapsed seconds
    const standardTaskIds = ['mnemonic-pegs', 'dual-nback', 'symbol-detective', 'memory-palace'];
    const allKnownTasks = [...(currentProtocol.tasks || []), ...(incomingProtocol.tasks || [])];
    const mergedTasks = standardTaskIds.map((id) => {
      const ct = currentProtocol.tasks?.find((t: any) => t.id === id);
      const it = incomingProtocol.tasks?.find((t: any) => t.id === id);
      const template = it || ct || allKnownTasks.find((t: any) => t.id === id) || {
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

      const maxSecs = Math.max(
        ct?.secondsElapsed || 0,
        it?.secondsElapsed || 0,
        id === 'memory-palace' ? bestElapsed : 0
      );
      const maxCount = Math.max(
        ct?.currentCount || 0,
        it?.currentCount || 0,
        Math.floor(maxSecs / 60)
      );
      const isTaskDone = Boolean(
        ct?.isCompleted ||
        it?.isCompleted ||
        (template.targetCount && maxCount >= template.targetCount) ||
        (template.targetSeconds && maxSecs >= template.targetSeconds) ||
        (id === 'memory-palace' && isPalaceDone)
      );

      return {
        ...template,
        currentCount: maxCount,
        secondsElapsed: maxSecs,
        isCompleted: isTaskDone,
      };
    });

    const mergedProtocol = {
      ...(incomingProtocol.curriculumDay >= currentProtocol.curriculumDay ? incomingProtocol : currentProtocol),
      curriculumDay: higherDay,
      tasks: mergedTasks,
      memoryPalaceTimer: mergedMemoryPalaceTimer,
      isLockedOut: Boolean(currentProtocol.isLockedOut || incomingProtocol.isLockedOut),
      history: mergedHistory,
    };

    // Merge free training stats with Math.max on per-game breakdowns
    const currentFree = masterData.freeTrainingStats || DEFAULT_YOSEPH_STATE.freeTrainingStats;
    const incomingFree = incoming.freeTrainingStats || {};

    const allGameModes = Array.from(new Set([
      ...Object.keys(currentFree.todayGamesBreakdown || {}),
      ...Object.keys(incomingFree.todayGamesBreakdown || {}),
      'memory-palace',
      'mnemonic-pegs',
      'dual-nback',
      'symbol-detective',
    ]));

    const mergedBreakdown: Record<string, number> = {};
    for (const gm of allGameModes) {
      mergedBreakdown[gm] = Math.max(
        currentFree.todayGamesBreakdown?.[gm] || 0,
        incomingFree.todayGamesBreakdown?.[gm] || 0,
        gm === 'memory-palace' ? bestElapsed : 0
      );
    }

    const calculatedTodaySeconds = Object.values(mergedBreakdown).reduce((a, b) => a + b, 0);

    const mergedFree = {
      ...currentFree,
      ...incomingFree,
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
      todaySeconds: Math.max(
        currentFree.todaySeconds || 0,
        incomingFree.todaySeconds || 0,
        calculatedTodaySeconds
      ),
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
      mergedFourHour = {
        ...incomingFourHour,
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
        hmr: false, // Explicitly disable WebSocket HMR in AI Studio
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
