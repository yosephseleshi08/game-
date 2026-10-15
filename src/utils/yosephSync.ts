import { UserStats, DailyProtocolState, FreeTrainingSessionStats, UserProfile, FourHourPlanState } from '../types';

export interface YosephMasterPayload {
  stats: UserStats;
  protocol: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  profile?: UserProfile;
  lastSyncedAt: string;
}

const MASTER_PASSWORD = 'yoseph535';
const UNLOCK_STORAGE_KEY = 'yoseph_vault_unlocked';
const UNLOCKED_TIMESTAMP_KEY = 'yoseph_vault_unlocked_at';

export function isDeviceUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  // Unlocked by default so Yoseph can open the app on mobile and PC immediately without password interruptions.
  const stored = localStorage.getItem(UNLOCK_STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
    return true;
  }
  return stored !== 'false';
}

export function setDeviceUnlocked(unlocked: boolean): void {
  if (typeof window === 'undefined') return;
  if (unlocked) {
    localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
    localStorage.setItem(UNLOCKED_TIMESTAMP_KEY, new Date().toISOString());
  } else {
    localStorage.setItem(UNLOCK_STORAGE_KEY, 'false');
    localStorage.removeItem(UNLOCKED_TIMESTAMP_KEY);
  }
}

export async function verifyYosephPassword(password: string): Promise<{ success: boolean; message: string }> {
  const trimmed = password.trim();
  const isMatch = trimmed.toLowerCase() === MASTER_PASSWORD.toLowerCase();

  // Try verifying with backend server if accessible
  try {
    const res = await fetch('/api/yoseph/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || 'Welcome back Yoseph!' };
    }
  } catch (err) {
    console.warn('Backend password verification offline, falling back to local vault logic:', err);
  }

  // Local fallback (e.g. offline PWA mode on phones)
  if (isMatch) {
    return { success: true, message: 'Welcome back Yoseph!' };
  } else {
    return {
      success: false,
      message: "This game is only for Yoseph. If you don't know the password, you can't play or see Yoseph's progress.",
    };
  }
}

/**
 * Fetch unified master progress from the central backend server
 */
export async function fetchServerMasterProgress(): Promise<YosephMasterPayload | null> {
  try {
    const res = await fetch('/api/yoseph/progress', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      return data as YosephMasterPayload;
    }
  } catch (err) {
    console.warn('Could not reach backend master progress endpoint:', err);
  }
  return null;
}

/**
 * Push unified master progress from any device (Phone 1, Phone 2, PC) to central backend server
 */
export async function pushServerMasterProgress(payload: {
  stats: UserStats;
  protocol: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  profile?: UserProfile;
}): Promise<YosephMasterPayload | null> {
  try {
    const res = await fetch('/api/yoseph/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data as YosephMasterPayload;
    }
  } catch (err) {
    console.warn('Failed to push progress to backend server:', err);
  }
  return null;
}

/**
 * Reset central master server progress to pristine Day 1 / 0 XP
 */
export async function resetServerMasterProgress(): Promise<boolean> {
  try {
    const res = await fetch('/api/yoseph/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to reset backend master progress:', err);
    return false;
  }
}
