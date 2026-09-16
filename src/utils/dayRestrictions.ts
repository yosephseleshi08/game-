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
  maxN: number;
  nextUnlockDay: number | null;
  allowedN: number[];
} {
  if (day < 21) {
    return { maxN: 2, nextUnlockDay: 21, allowedN: [1, 2] };
  }
  if (day < 61) {
    return { maxN: 3, nextUnlockDay: 61, allowedN: [1, 2, 3] };
  }
  if (day < 121) {
    return { maxN: 4, nextUnlockDay: 121, allowedN: [1, 2, 3, 4] };
  }
  return { maxN: 5, nextUnlockDay: null, allowedN: [1, 2, 3, 4, 5] };
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
