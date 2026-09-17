export type GameMode =
  | 'daily-protocol'
  | 'free-training'
  | 'eidetic-matrix'
  | 'ayumu-chimp'
  | 'dual-nback'
  | 'mnemonic-pegs'
  | 'memory-palace'
  | 'spaced-repetition'
  | 'symbol-detective'
  | 'daily-workout'
  | 'community'
  | 'stats';

export interface DailyTrainingLog {
  date: string;
  cycleKey: string;
  curriculumDay?: number;
  seconds: number;
  reps: number;
  gamesBreakdown: Record<string, number>; // gameMode -> seconds spent
}

export interface FreeTrainingSessionStats {
  totalMinutesPracticed: number;
  totalSecondsPracticed: number;
  totalRepsCompleted: number;
  doomScrollMinutesSaved: number;
  sessionsCount: number;
  lastSessionDate: string;
  currentDayCycle: string;
  todayCurriculumDay?: number;
  todaySeconds: number;
  todayReps: number;
  todayGamesBreakdown: Record<string, number>;
  dailyHistory: Record<string, DailyTrainingLog>;
}

export type FlashSpeed = 2000 | 1200 | 600 | 300 | 150;

export interface FlashSpeedOption {
  value: FlashSpeed;
  label: string;
  tag: string;
  xpMultiplier: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  photoUrl: string;
  avatarPresetId?: string;
  level: number;
  xp: number;
  rankTitle: string;
  curriculumDay: number;
  currentStreak: number;
  bestStreak: number;
  ayumuMaxNumbers: number;
  matrixMaxLevel: number;
  dualNBackMaxN: number;
  fastestFlashMs: number;
  detectiveHighScore: number;
  lockedFlashSpeed?: FlashSpeed | null;
  isSpeedLockedToPlan?: boolean;
  updatedAt: string;
  createdAt?: string;
}

export interface FlashTimePlanPhase {
  phase: number;
  phaseName: string;
  daysRange: string;
  minDay: number;
  maxDay: number;
  targetSpeedMs: FlashSpeed;
  speedLabel: string;
  tag: string;
  title: string;
  scientificGoal: string;
  neuroFocus: string;
  dailyProtocolBenchmark: string;
  ayumuExpectation: string;
}

export interface UserStats {
  xp: number;
  level: number;
  totalGamesPlayed: number;
  matrixMaxLevel: number;
  ayumuMaxNumbers: number;
  detectiveHighScore: number;
  fastestFlashMs: number;
  currentStreak: number;
  bestStreak: number;
  accuracyRate: number; // percentage 0-100
  totalAttempts: number;
  totalCorrectAttempts: number;
  // Dual N-Back & Mnemonic metrics
  dualNBackMaxN: number;
  mnemonicConversionCount: number;
  cardsMastered: number;
  pqHistory: DailyPQRecord[];
  progressHistory?: ProgressHistoryEntry[];
}

export interface ProgressHistoryEntry {
  id: string;
  timestamp: string; // ISO string
  displayDate: string; // formatted e.g. "Sep 15" or "Day 1"
  ayumuMax: number;
  dualNBackMaxN: number;
  matrixLevel?: number;
  notes?: string;
}

export interface DailyPQRecord {
  id: string;
  date: string;
  score: number; // 50 - 180+
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    matrixScore: number;
    ayumuScore: number;
    detectiveScore: number;
    nbackScore?: number;
  };
}

export type MasterRank = {
  level: number;
  title: string;
  minXp: number;
  badgeColor: string;
  description: string;
};

// Eidetic Matrix State
export interface MatrixCell {
  row: number;
  col: number;
  isTarget: boolean;
  isSelected?: boolean;
  isRevealed?: boolean;
  isError?: boolean;
}

// Ayumu Chimp Test State
export interface ChimpTile {
  id: number;
  num: number; // 1 to N
  row: number; // grid row 0..4
  col: number; // grid col 0..7
  status: 'hidden' | 'visible' | 'blanked' | 'cleared' | 'failed';
}

// Dual N-Back State
export interface NBackTrial {
  step: number;
  position: number; // 0 to 8 (in 3x3 grid)
  letter: string; // e.g. 'C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'
  isPositionMatch: boolean;
  isAudioMatch: boolean;
  userClaimedPos?: boolean;
  userClaimedAudio?: boolean;
}

export interface NBackResult {
  n: number;
  totalTrials: number;
  positionAccuracy: number; // 0-100
  audioAccuracy: number; // 0-100
  overallScore: number;
  recommendedAction: 'level-up' | 'maintain' | 'level-down';
}

// Mnemonic & Memory Palace
export interface MajorPeg {
  number: string; // e.g. "01", "14", "99"
  phoneticRule: string; // e.g. "1 = T/D, 4 = R"
  word: string; // e.g. "TIRE"
  visualImage: string; // description for palace
  category: 'Single Digit' | 'Teens' | 'Decades' | 'Code/Tech';
}

export interface PalaceLocus {
  id: number;
  name: string;
  room: string;
  defaultIcon: string;
  itemPlaced?: string;
  itemColor?: string;
}

// Active Spaced Repetition (SuperMemo SM-2)
export interface SpacedCard {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  category: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // ISO string
  lastReviewedDate?: string;
}

// Symbol Detective State
export type SymbolShape = 'star' | 'circle' | 'square' | 'triangle' | 'heart' | 'diamond' | 'shield' | 'zap';
export type SymbolColor = 'red' | 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan';

export interface DetectiveItem {
  id: number;
  row: number;
  col: number;
  shape: SymbolShape;
  color: SymbolColor;
  label?: string;
}

export interface DetectiveQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  targetRow?: number;
  targetCol?: number;
  questionType: 'color' | 'shape' | 'count' | 'position';
}

// Daily Protocol & 12 AM (Midnight) Lockout Tracker
export interface ProtocolTask {
  id:
    | 'eidetic-matrix'
    | 'ayumu-chimp'
    | 'dual-nback'
    | 'mnemonic-pegs'
    | 'memory-palace'
    | 'spaced-repetition';
  title: string;
  discipline: string;
  targetDescription: string;
  targetCount: number;
  currentCount: number;
  maxAllowedLevel?: number | string;
  isCompleted: boolean;
  gameMode: GameMode;
}

export interface DailyProtocolState {
  currentCycleDate: string; // The cycle key (e.g. '2026-09-15-12AM')
  isLockedOut: boolean;
  completedAt?: string;
  curriculumDay: number; // 1 to 365
  currentPhase: number; // 1 to 4
  tasks: ProtocolTask[];
  history: Record<string, { completed: boolean; score: number; completedAt: string }>;
}

