import { UserStats, MasterRank, FlashSpeedOption, FlashSpeed } from '../types';

export const FLASH_SPEED_OPTIONS: FlashSpeedOption[] = [
  { value: 2000, label: '2.0s', tag: 'Beginner', xpMultiplier: 1.0 },
  { value: 1200, label: '1.2s', tag: 'Standard', xpMultiplier: 1.3 },
  { value: 600, label: '600ms', tag: 'Pro Gaze', xpMultiplier: 1.8 },
  { value: 300, label: '300ms', tag: 'Photographic', xpMultiplier: 2.5 },
  { value: 150, label: '150ms', tag: 'Chimp / Ayumu', xpMultiplier: 4.0 },
];

export const MASTER_RANKS: MasterRank[] = [
  {
    level: 1,
    title: 'Novice Observer',
    minXp: 0,
    badgeColor: 'from-slate-500 to-slate-700',
    description: 'Starting to train the visual sensory register and after-image retention.',
  },
  {
    level: 2,
    title: 'Visual Apprentice',
    minXp: 250,
    badgeColor: 'from-emerald-500 to-teal-700',
    description: 'Recognizing geometric patterns and clustering visual chunks effortlessly.',
  },
  {
    level: 3,
    title: 'Retinal Snapshotter',
    minXp: 650,
    badgeColor: 'from-sky-500 to-blue-700',
    description: 'Developing consistent iconic memory trace preservation past 1 second.',
  },
  {
    level: 4,
    title: 'Flash Prodigy',
    minXp: 1300,
    badgeColor: 'from-indigo-500 to-violet-700',
    description: 'Mastering sub-second exposures and rapid sequence indexation.',
  },
  {
    level: 5,
    title: 'Eidetic Adept',
    minXp: 2400,
    badgeColor: 'from-amber-500 to-orange-700',
    description: 'Instant peripheral scene capture with minimal saccadic movement.',
  },
  {
    level: 6,
    title: 'Photographic Master',
    minXp: 4000,
    badgeColor: 'from-rose-500 to-pink-700',
    description: 'High-density visual retrieval rivaling world-class memory athletes.',
  },
  {
    level: 7,
    title: 'Grandmaster of Recall',
    minXp: 6500,
    badgeColor: 'from-amber-400 via-purple-500 to-cyan-400',
    description: 'True eidetic instant capture across all spatial and sequential benchmarks.',
  },
];

const STATS_STORAGE_KEY = 'pmm_user_stats_v1';
const SPEED_STORAGE_KEY = 'pmm_flash_speed_v1';

const defaultStats: UserStats = {
  xp: 120,
  level: 1,
  totalGamesPlayed: 0,
  matrixMaxLevel: 1,
  ayumuMaxNumbers: 4,
  detectiveHighScore: 0,
  fastestFlashMs: 2000,
  currentStreak: 0,
  bestStreak: 0,
  accuracyRate: 100,
  totalAttempts: 0,
  totalCorrectAttempts: 0,
  pqHistory: [],
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    return { ...defaultStats, ...parsed };
  } catch {
    return defaultStats;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // LocalStorage failure handling
  }
}

export function getRankForXp(xp: number): { currentRank: MasterRank; nextRank: MasterRank | null; progressPercent: number } {
  let currentRank = MASTER_RANKS[0];
  for (let i = MASTER_RANKS.length - 1; i >= 0; i--) {
    if (xp >= MASTER_RANKS[i].minXp) {
      currentRank = MASTER_RANKS[i];
      break;
    }
  }

  const currentIndex = MASTER_RANKS.findIndex((r) => r.level === currentRank.level);
  const nextRank = currentIndex < MASTER_RANKS.length - 1 ? MASTER_RANKS[currentIndex + 1] : null;

  if (!nextRank) {
    return { currentRank, nextRank: null, progressPercent: 100 };
  }

  const range = nextRank.minXp - currentRank.minXp;
  const earned = xp - currentRank.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));

  return { currentRank, nextRank, progressPercent };
}

export function loadSavedFlashSpeed(): FlashSpeed {
  try {
    const raw = localStorage.getItem(SPEED_STORAGE_KEY);
    if (!raw) return 1200;
    const val = parseInt(raw, 10);
    if ([2000, 1200, 600, 300, 150].includes(val)) {
      return val as FlashSpeed;
    }
    return 1200;
  } catch {
    return 1200;
  }
}

export function saveFlashSpeed(speed: FlashSpeed): void {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
  } catch {
    // Ignored
  }
}
