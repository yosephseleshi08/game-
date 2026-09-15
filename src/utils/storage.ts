import {
  UserStats,
  UserProfile,
  MasterRank,
  FlashSpeedOption,
  FlashSpeed,
  MajorPeg,
  PalaceLocus,
  SpacedCard,
} from '../types';

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

const STATS_STORAGE_KEY = 'pmm_user_stats_v2';
const SPEED_STORAGE_KEY = 'pmm_flash_speed_v1';
const CARDS_STORAGE_KEY = 'pmm_spaced_cards_v1';

const defaultStats: UserStats = {
  xp: 140,
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
  dualNBackMaxN: 2,
  mnemonicConversionCount: 0,
  cardsMastered: 0,
  pqHistory: [],
  progressHistory: [
    { id: 'baseline-1', timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), displayDate: 'Day 1', ayumuMax: 4, dualNBackMaxN: 2, matrixLevel: 1 },
    { id: 'baseline-2', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), displayDate: 'Day 3', ayumuMax: 5, dualNBackMaxN: 2, matrixLevel: 2 },
    { id: 'baseline-3', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), displayDate: 'Day 5', ayumuMax: 6, dualNBackMaxN: 3, matrixLevel: 3 },
    { id: 'baseline-4', timestamp: new Date().toISOString(), displayDate: 'Today', ayumuMax: 6, dualNBackMaxN: 3, matrixLevel: 4 },
  ],
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

const LOCAL_PROFILE_KEY = 'pmm_local_athlete_profile_v1';

export function loadLocalProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function createLocalAthleteProfile(username?: string, avatarPresetId = 'ayumu'): UserProfile {
  const currentStats = loadUserStats();
  const profile: UserProfile = {
    id: `local-${Date.now()}`,
    email: 'local@device.offline',
    username: username && username.trim() ? username.trim() : 'Local Athlete',
    photoUrl: avatarPresetId,
    avatarPresetId: avatarPresetId,
    level: currentStats.level || 1,
    xp: currentStats.xp || 140,
    rankTitle: getRankForXp(currentStats.xp || 140).currentRank.title,
    curriculumDay: 1,
    currentStreak: currentStats.currentStreak || 0,
    bestStreak: currentStats.bestStreak || 0,
    ayumuMaxNumbers: currentStats.ayumuMaxNumbers || 4,
    matrixMaxLevel: currentStats.matrixMaxLevel || 1,
    dualNBackMaxN: currentStats.dualNBackMaxN || 2,
    fastestFlashMs: currentStats.fastestFlashMs || 2000,
    detectiveHighScore: currentStats.detectiveHighScore || 0,
    lockedFlashSpeed: 1200,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  saveLocalProfile(profile);
  return profile;
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

// Major System Pegs Reference & Drills (0-9 and top pegs)
export const MAJOR_SYSTEM_PEGS: MajorPeg[] = [
  { number: '0', phoneticRule: 'S / Z / soft C', word: 'SOAP', visualImage: 'A glowing bar of fragrant pink soap slipping between fingers', category: 'Single Digit' },
  { number: '1', phoneticRule: 'T / D (1 downstroke)', word: 'TIE', visualImage: 'A giant silk red necktie wrapped around a marble pillar', category: 'Single Digit' },
  { number: '2', phoneticRule: 'N (2 downstrokes)', word: 'NOAH', visualImage: 'Noah on the wooden ark with animals looking over the bow', category: 'Single Digit' },
  { number: '3', phoneticRule: 'M (3 downstrokes)', word: 'MA', visualImage: 'A motherly figure holding a warm golden pie', category: 'Single Digit' },
  { number: '4', phoneticRule: 'R (last letter of four)', word: 'RAY', visualImage: 'An intense laser beam ray burning through crystal', category: 'Single Digit' },
  { number: '5', phoneticRule: 'L (L is 50 in Roman)', word: 'LAW', visualImage: 'A heavy brass courthouse gavel banging onto wood', category: 'Single Digit' },
  { number: '6', phoneticRule: 'J / SH / CH / soft G', word: 'JAW', visualImage: 'A mechanical shark jaw clamping down with metallic spark', category: 'Single Digit' },
  { number: '7', phoneticRule: 'K / Hard C / G', word: 'KEY', visualImage: 'An ornate golden antique key shining in darkness', category: 'Single Digit' },
  { number: '8', phoneticRule: 'F / V (cursive f has 2 loops)', word: 'FOE', visualImage: 'A dark cloaked fencing rival waving an electric foil', category: 'Single Digit' },
  { number: '9', phoneticRule: 'P / B (9 is reverse P/b)', word: 'PIE', visualImage: 'A steaming hot blackberry pie with bubbling syrup', category: 'Single Digit' },
  // Double digits
  { number: '10', phoneticRule: 'T + S', word: 'TOES', visualImage: 'Giant neon toes squishing through emerald jelly', category: 'Teens' },
  { number: '14', phoneticRule: 'T + R', word: 'TIRE', visualImage: 'A flaming monster truck tire rolling through the hall', category: 'Teens' },
  { number: '21', phoneticRule: 'N + T', word: 'NUT', visualImage: 'A colossal bronze acorn cracking open with lightning', category: 'Decades' },
  { number: '32', phoneticRule: 'M + N', word: 'MOON', visualImage: 'A glowing crescent moon floating like a neon lamp', category: 'Decades' },
  { number: '40', phoneticRule: 'R + S', word: 'ROSE', visualImage: 'A blooming blood-red rose dripping with liquid glass', category: 'Decades' },
  { number: '52', phoneticRule: 'L + N', word: 'LION', visualImage: 'A majestic golden lion roaring with fire sparks', category: 'Decades' },
  { number: '73', phoneticRule: 'K + M', word: 'CAMEL', visualImage: 'A desert camel wearing futuristic sunglasses', category: 'Decades' },
  { number: '84', phoneticRule: 'F + R', word: 'FIRE', visualImage: 'A roaring campfire dancing to rhythmic beats', category: 'Decades' },
  { number: '99', phoneticRule: 'P + P', word: 'PIPE', visualImage: 'A polished brass bubble pipe blowing giant iridescent orbs', category: 'Decades' },
];

// Pre-configured Memory Palace Loci
export const DEFAULT_PALACE_LOCI: PalaceLocus[] = [
  { id: 1, name: 'Palace Grand Entrance', room: 'Foyer', defaultIcon: 'DoorClosed' },
  { id: 2, name: 'Crystal Chandelier', room: 'Foyer', defaultIcon: 'Lamp' },
  { id: 3, name: 'Carved Oak Bookshelf', room: 'Study', defaultIcon: 'Book' },
  { id: 4, name: 'Velvet Recliner Couch', room: 'Living Room', defaultIcon: 'Armchair' },
  { id: 5, name: 'Granite Cooking Island', room: 'Kitchen', defaultIcon: 'Flame' },
  { id: 6, name: 'Sprawling Marble Balcony', room: 'Terrace', defaultIcon: 'Sun' },
  { id: 7, name: 'Observation Telescope', room: 'Observatory', defaultIcon: 'Telescope' },
  { id: 8, name: 'Steaming Roman Bath', room: 'Spa', defaultIcon: 'Bath' },
];

// SuperMemo SM-2 Spaced Repetition Initial Decks
export const DEFAULT_SPACED_CARDS: SpacedCard[] = [
  {
    id: 'sm-1',
    prompt: 'Major System: What phonetic sound represents 0?',
    answer: 'S, Z, or soft C (e.g. Zero starts with Z; S has zero downstrokes)',
    hint: 'Think of SOAP or SEW',
    category: 'Mnemonic Pegs',
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
  },
  {
    id: 'sm-2',
    prompt: 'Major System: What phonetic sound represents 1?',
    answer: 'T or D (Both have 1 vertical downstroke: T, d)',
    hint: 'Think of TIE or TEA',
    category: 'Mnemonic Pegs',
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
  },
  {
    id: 'sm-3',
    prompt: 'Major System: What phonetic sound represents 2 and 3?',
    answer: '2 = N (2 downstrokes), 3 = M (3 downstrokes)',
    hint: 'Count the downstrokes of lowercase n and m',
    category: 'Mnemonic Pegs',
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
  },
  {
    id: 'sm-4',
    prompt: 'Chimp Ayumu Advantage: Why did young chimps beat humans at 210ms flash?',
    answer: 'Humans bottleneck visual memory by subvocalizing (saying numbers internally), whereas chimps retain a direct iconic sensory image without linguistic translation.',
    hint: 'Subvocal suppression vs raw iconic storage',
    category: 'Cognitive Science',
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
  },
  {
    id: 'sm-5',
    prompt: 'Visual Chunking: How many random coordinates can working memory hold vs geometric shapes?',
    answer: '4–7 isolated coordinates vs 15+ coordinates if bounded into 1–2 geometric polygons or constellations.',
    hint: 'Gestalt enclosure principle',
    category: 'Cognitive Science',
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
  },
];

export function loadSpacedCards(): SpacedCard[] {
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return DEFAULT_SPACED_CARDS;
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_SPACED_CARDS;
  } catch {
    return DEFAULT_SPACED_CARDS;
  }
}

export function saveSpacedCards(cards: SpacedCard[]): void {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Ignored
  }
}

// SM-2 Spaced Repetition Algorithm Implementation
// Quality rating: 0 = blackout, 1 = wrong, 2 = serious difficulty, 3 = pass with effort, 4 = good, 5 = perfect instant
export function calculateSM2(
  card: SpacedCard,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): SpacedCard {
  let { repetitions, intervalDays, easeFactor } = card;

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  return {
    ...card,
    repetitions,
    intervalDays,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: nextDate.toISOString(),
    lastReviewedDate: new Date().toISOString(),
  };
}
