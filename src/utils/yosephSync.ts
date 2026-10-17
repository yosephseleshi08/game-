import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  UserStats,
  DailyProtocolState,
  FreeTrainingSessionStats,
  UserProfile,
  FourHourPlanState,
} from '../types';

export interface YosephMasterPayload {
  stats: UserStats;
  protocol: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  profile?: UserProfile;
  lastSyncedAt: string;
}

const MASTER_PASSWORD = 'yoseph535';
const MASTER_FIRESTORE_COLLECTION = 'yoseph_cloud_sync';
const MASTER_FIRESTORE_DOC = 'master_progress';

export function isDeviceUnlocked(): boolean {
  // Always unlocked by default so Yoseph can immediately open and play the game on mobile and PC without password interruptions.
  return true;
}

export function setDeviceUnlocked(_unlocked: boolean): void {
  // Kept for backward compatibility
}

export async function verifyYosephPassword(password: string): Promise<{ success: boolean; message: string }> {
  const trimmed = password.trim();
  const isMatch = trimmed.toLowerCase() === MASTER_PASSWORD.toLowerCase();

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
  } catch {
    // Fallback to local check
  }

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
 * Fetch unified master progress directly from persistent Cloud Firestore.
 * This guarantees the exact same progress is shared between PC, Phone 1, and Phone 2.
 */
export async function fetchServerMasterProgress(): Promise<YosephMasterPayload | null> {
  // 1. Try Cloud Firestore (Primary globally persistent store)
  try {
    const docRef = doc(db, MASTER_FIRESTORE_COLLECTION, MASTER_FIRESTORE_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.statsJson && data.protocolJson) {
        return {
          stats: JSON.parse(data.statsJson),
          protocol: JSON.parse(data.protocolJson),
          freeTrainingStats: data.freeTrainingJson ? JSON.parse(data.freeTrainingJson) : undefined,
          fourHourPlan: data.fourHourPlanJson ? JSON.parse(data.fourHourPlanJson) : undefined,
          profile: data.profileJson ? JSON.parse(data.profileJson) : undefined,
          lastSyncedAt: data.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Firestore fetch fallback to backend API:', err);
  }

  // 2. Fallback to server endpoint
  try {
    const now = new Date();
    const clientDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const res = await fetch(`/api/yoseph/progress?date=${clientDateStr}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      return data as YosephMasterPayload;
    }
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Could not reach backend master progress endpoint:', err);
  }
  return null;
}

/**
 * Push unified master progress from any device (PC, Phone 1, Phone 2) directly to Cloud Firestore.
 * Also syncs with backend server as redundancy.
 */
export async function pushServerMasterProgress(payload: {
  stats: UserStats;
  protocol: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  profile?: UserProfile;
}): Promise<YosephMasterPayload | null> {
  const nowIso = new Date().toISOString();

  // 1. Write to persistent Cloud Firestore
  try {
    const docRef = doc(db, MASTER_FIRESTORE_COLLECTION, MASTER_FIRESTORE_DOC);
    await setDoc(
      docRef,
      {
        statsJson: JSON.stringify(payload.stats),
        protocolJson: JSON.stringify(payload.protocol),
        freeTrainingJson: payload.freeTrainingStats ? JSON.stringify(payload.freeTrainingStats) : null,
        fourHourPlanJson: payload.fourHourPlan ? JSON.stringify(payload.fourHourPlan) : null,
        profileJson: payload.profile ? JSON.stringify(payload.profile) : null,
        updatedAt: nowIso,
        lastDevice: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'PC') : 'Unknown',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Failed to write to Cloud Firestore:', err);
  }

  // 2. Write to backend server endpoint for dual redundancy
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
    console.warn('[Yosi Cloud Sync] Failed to push progress to backend server:', err);
  }

  return {
    ...payload,
    lastSyncedAt: nowIso,
  };
}

/**
 * Real-time listener for multi-device sync (instant updates when PC or mobile changes state)
 */
export function subscribeToMasterCloudProgress(
  onUpdate: (payload: YosephMasterPayload) => void
): () => void {
  try {
    const docRef = doc(db, MASTER_FIRESTORE_COLLECTION, MASTER_FIRESTORE_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.statsJson && data.protocolJson) {
          try {
            onUpdate({
              stats: JSON.parse(data.statsJson),
              protocol: JSON.parse(data.protocolJson),
              freeTrainingStats: data.freeTrainingJson ? JSON.parse(data.freeTrainingJson) : undefined,
              fourHourPlan: data.fourHourPlanJson ? JSON.parse(data.fourHourPlanJson) : undefined,
              profile: data.profileJson ? JSON.parse(data.profileJson) : undefined,
              lastSyncedAt: data.updatedAt || new Date().toISOString(),
            });
          } catch (e) {
            console.error('[Yosi Cloud Sync] Error parsing live snapshot:', e);
          }
        }
      },
      (err) => {
        console.warn('[Yosi Cloud Sync] Snapshot listener error:', err);
      }
    );
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Unable to attach onSnapshot listener:', err);
    return () => {};
  }
}

/**
 * Reset central master progress to pristine Day 1 / 0 XP
 */
export async function resetServerMasterProgress(): Promise<boolean> {
  try {
    const docRef = doc(db, MASTER_FIRESTORE_COLLECTION, MASTER_FIRESTORE_DOC);
    await setDoc(docRef, {
      statsJson: null,
      protocolJson: null,
      freeTrainingJson: null,
      fourHourPlanJson: null,
      profileJson: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Failed to reset Firestore doc:', err);
  }

  try {
    const res = await fetch('/api/yoseph/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.warn('[Yosi Cloud Sync] Failed to reset backend master progress:', err);
    return false;
  }
}
