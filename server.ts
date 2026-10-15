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
        maxAllowedLevel: 'Adaptive Speed',
        isCompleted: false,
        gameMode: 'symbol-detective',
      },
    ],
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

    // Merge protocol: keep higher curriculum day and combine history
    const mergedHistory = {
      ...(currentProtocol.history || {}),
      ...(incomingProtocol.history || {}),
    };

    const higherDay = Math.max(currentProtocol.curriculumDay || 1, incomingProtocol.curriculumDay || 1);

    let mergedTasks = incomingProtocol.tasks;
    if (currentProtocol.curriculumDay === incomingProtocol.curriculumDay && currentProtocol.tasks) {
      mergedTasks = currentProtocol.tasks.map((ct: any) => {
        const it = incomingProtocol.tasks?.find((t: any) => t.id === ct.id);
        if (!it) return ct;
        return {
          ...ct,
          ...it,
          isCompleted: ct.isCompleted || it.isCompleted,
          currentCount: Math.max(ct.currentCount || 0, it.currentCount || 0),
        };
      });
    }

    const mergedProtocol = {
      ...incomingProtocol,
      curriculumDay: higherDay,
      tasks: mergedTasks,
      isLockedOut: currentProtocol.isLockedOut || incomingProtocol.isLockedOut,
      history: mergedHistory,
    };

    // Merge free training stats
    const currentFree = masterData.freeTrainingStats || DEFAULT_YOSEPH_STATE.freeTrainingStats;
    const incomingFree = incoming.freeTrainingStats || {};
    const mergedFree = {
      ...currentFree,
      ...incomingFree,
      totalSecondsPracticed: Math.max(currentFree.totalSecondsPracticed || 0, incomingFree.totalSecondsPracticed || 0),
      totalMinutesPracticed: Math.max(currentFree.totalMinutesPracticed || 0, incomingFree.totalMinutesPracticed || 0),
      totalRepsCompleted: Math.max(currentFree.totalRepsCompleted || 0, incomingFree.totalRepsCompleted || 0),
      todaySeconds: Math.max(currentFree.todaySeconds || 0, incomingFree.todaySeconds || 0),
      todayGamesBreakdown: {
        ...(currentFree.todayGamesBreakdown || {}),
        ...(incomingFree.todayGamesBreakdown || {}),
      },
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
