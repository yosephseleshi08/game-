/**
 * Daily Cognitive Level Restriction Matrix
 * Ensures users strictly train within the scientific dosage prescribed for their current curriculum day.
 * Higher levels are strictly locked until future curriculum days.
 */

export function getMaxMatrixLevelForDay(day: number): { maxLevel: number; nextUnlockDay: number | null } {
  if (day < 3) return { maxLevel: 4, nextUnlockDay: 3 };
  if (day < 8) return { maxLevel: 5, nextUnlockDay: 8 };
  if (day < 16) return { maxLevel: 6, nextUnlockDay: 16 };
  if (day < 31) return { maxLevel: 7, nextUnlockDay: 31 };
  if (day < 61) return { maxLevel: 8, nextUnlockDay: 61 };
  if (day < 121) return { maxLevel: 9, nextUnlockDay: 121 };
  return { maxLevel: 10, nextUnlockDay: null };
}

export function getMaxAyumuDigitsForDay(day: number): {
  maxDigits: number;
  nextUnlockDay: number | null;
  allowedOptions: number[];
} {
  if (day < 8) {
    return { maxDigits: 5, nextUnlockDay: 8, allowedOptions: [4, 5] };
  }
  if (day < 21) {
    return { maxDigits: 7, nextUnlockDay: 21, allowedOptions: [4, 5, 7] };
  }
  if (day < 46) {
    return { maxDigits: 9, nextUnlockDay: 46, allowedOptions: [4, 5, 7, 9] };
  }
  return { maxDigits: 11, nextUnlockDay: null, allowedOptions: [4, 5, 7, 9, 11] };
}

export function getMaxDualNBackForDay(day: number): {
  targetN: number;
  maxN: number;
  nextUnlockDay: number | null;
  allowedN: number[];
  defaultN: number;
} {
  if (day < 4) {
    return { targetN: 1, maxN: 1, nextUnlockDay: 4, allowedN: [1], defaultN: 1 };
  }
  if (day < 21) {
    return { targetN: 2, maxN: 2, nextUnlockDay: 21, allowedN: [1, 2], defaultN: 2 };
  }
  if (day < 61) {
    return { targetN: 3, maxN: 3, nextUnlockDay: 61, allowedN: [1, 2, 3], defaultN: 3 };
  }
  if (day < 121) {
    return { targetN: 4, maxN: 4, nextUnlockDay: 121, allowedN: [1, 2, 3, 4], defaultN: 4 };
  }
  return { targetN: 5, maxN: 5, nextUnlockDay: null, allowedN: [1, 2, 3, 4, 5], defaultN: 5 };
}

export function getPegTargetForDay(day: number): {
  targetCount: number;
  maxNumber: number;
  label: string;
} {
  if (day < 11) {
    return { targetCount: 10, maxNumber: 9, label: 'Single Digits (0–9)' };
  }
  if (day < 31) {
    return { targetCount: 15, maxNumber: 30, label: 'Teens & Decades (00–30)' };
  }
  if (day < 91) {
    return { targetCount: 20, maxNumber: 70, label: 'Mid Major Pegs (00–70)' };
  }
  return { targetCount: 25, maxNumber: 99, label: 'Grandmaster Major Pegs (00–99)' };
}

export function getPalaceConfigForDay(day: number): {
  lociCount: number;
  label: string;
} {
  if (day < 16) {
    return { lociCount: 4, label: 'Courtyard & Foyer (4 Stations)' };
  }
  if (day < 46) {
    return { lociCount: 6, label: 'Grand Villa Wing (6 Stations)' };
  }
  return { lociCount: 8, label: 'Full Palace Grounds (8 Stations)' };
}

export function getSpacedCardQuotaForDay(day: number): {
  targetCards: number;
  label: string;
} {
  if (day < 11) {
    return { targetCards: 5, label: 'Foundation SM-2 (5 Cards)' };
  }
  if (day < 31) {
    return { targetCards: 8, label: 'Intermediate SM-2 (8 Cards)' };
  }
  return { targetCards: 12, label: 'Deep Recall SM-2 (12 Cards)' };
}

export interface DetectiveAdaptiveConfig {
  tierName: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  tierColor: string;
  flashTimeMs: number;
  availableSpeeds: { label: string; value: number }[];
  description: string;
}

export function getDetectiveAdaptiveConfig(day: number, level: number = 1): DetectiveAdaptiveConfig {
  if (day <= 4 || level <= 2) {
    return {
      tierName: 'Beginner',
      tierColor: 'emerald',
      flashTimeMs: 3800,
      availableSpeeds: [
        { label: 'Extended Relaxed (4.5s)', value: 4500 },
        { label: 'Adaptive Beginner (3.8s)', value: 3800 },
        { label: 'Challenging (2.8s)', value: 2800 },
      ],
      description: 'Adaptive Beginner Timing: 3.8s exposure to comfortably absorb both shape and color channels without panic.',
    };
  }
  if (day <= 14 || level <= 5) {
    return {
      tierName: 'Intermediate',
      tierColor: 'cyan',
      flashTimeMs: 2500,
      availableSpeeds: [
        { label: 'Comfortable (3.2s)', value: 3200 },
        { label: 'Adaptive Intermediate (2.5s)', value: 2500 },
        { label: 'Brisk (1.8s)', value: 1800 },
      ],
      description: 'Adaptive Intermediate Timing: 2.5s exposure to sharpen rapid dual-channel recognition.',
    };
  }
  if (day <= 30 || level <= 9) {
    return {
      tierName: 'Advanced',
      tierColor: 'amber',
      flashTimeMs: 1600,
      availableSpeeds: [
        { label: 'Standard Advanced (1.6s)', value: 1600 },
        { label: 'Rapid (1.2s)', value: 1200 },
        { label: 'Sub-second (900ms)', value: 900 },
      ],
      description: 'Adaptive Advanced Timing: 1.6s exposure for swift mental snapshot photography.',
    };
  }
  return {
    tierName: 'Master',
    tierColor: 'purple',
    flashTimeMs: 1000,
    availableSpeeds: [
      { label: 'Master (1.0s)', value: 1000 },
      { label: 'Grandmaster (700ms)', value: 700 },
      { label: 'Eidetic Flash (400ms)', value: 400 },
    ],
    description: 'Master Tier Timing: 1.0s instantaneous whole-grid photographic snapshot.',
  };
}

export interface DailyPQAdaptiveConfig {
  tierName: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  tierBadgeColor: string;
  matrixTargets: number;
  matrixFlashMs: number;
  ayumuDigits: number;
  ayumuFlashMs: number;
  detectiveFlashMs: number;
  tierSummary: string;
}

export function getDailyPQAdaptiveConfig(day: number, level: number = 1): DailyPQAdaptiveConfig {
  if (day <= 4 || level <= 2) {
    return {
      tierName: 'Beginner',
      tierBadgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70',
      matrixTargets: 4,
      matrixFlashMs: 1800,
      ayumuDigits: 4,
      ayumuFlashMs: 2400,
      detectiveFlashMs: 3000,
      tierSummary: 'Beginner Status: Scaled down to 4 matrix targets (1.8s), 4 Ayumu digits (2.4s), and 3.0s color snapshot so you can learn without time panic.',
    };
  }
  if (day <= 14 || level <= 5) {
    return {
      tierName: 'Intermediate',
      tierBadgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/70',
      matrixTargets: 4,
      matrixFlashMs: 1200,
      ayumuDigits: 5,
      ayumuFlashMs: 1600,
      detectiveFlashMs: 2000,
      tierSummary: 'Intermediate Status: 4 matrix targets (1.2s), 5 Ayumu digits (1.6s), and 2.0s color snapshot.',
    };
  }
  if (day <= 30 || level <= 9) {
    return {
      tierName: 'Advanced',
      tierBadgeColor: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
      matrixTargets: 5,
      matrixFlashMs: 900,
      ayumuDigits: 6,
      ayumuFlashMs: 1200,
      detectiveFlashMs: 1400,
      tierSummary: 'Advanced Status: 5 matrix targets (900ms), 6 Ayumu digits (1.2s), and 1.4s color snapshot.',
    };
  }
  return {
    tierName: 'Master',
    tierBadgeColor: 'bg-purple-950/80 text-purple-300 border-purple-600/70',
    matrixTargets: 5,
    matrixFlashMs: 700,
    ayumuDigits: 7,
    ayumuFlashMs: 900,
    detectiveFlashMs: 1000,
    tierSummary: 'Master Status: 5 matrix targets (700ms), 7 Ayumu digits (900ms), and 1.0s color snapshot.',
  };
}
