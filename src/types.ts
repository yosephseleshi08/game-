export type GameMode = 'eidetic-matrix' | 'ayumu-chimp' | 'symbol-detective' | 'daily-workout' | 'stats';

export type FlashSpeed = 2000 | 1200 | 600 | 300 | 150;

export interface FlashSpeedOption {
  value: FlashSpeed;
  label: string;
  tag: string;
  xpMultiplier: number;
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
  pqHistory: DailyPQRecord[];
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
