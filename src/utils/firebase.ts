import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserStats, DailyProtocolState, FreeTrainingSessionStats, FourHourPlanState } from '../types';
import { getRankForXp } from './storage';

// Preset avatar styles for user profiles
export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  textColor: string;
  tag: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'ayumu', name: 'Ayumu Prodigy', emoji: '🐵', bgGradient: 'from-amber-500 to-orange-600', textColor: 'text-amber-300', tag: 'Chimp Benchmark' },
  { id: 'visionary', name: 'Neural Visionary', emoji: '🧠', bgGradient: 'from-cyan-500 to-blue-600', textColor: 'text-cyan-300', tag: 'Occipital Focus' },
  { id: 'eidetic', name: 'Eidetic Grandmaster', emoji: '👁️', bgGradient: 'from-emerald-500 to-teal-700', textColor: 'text-emerald-300', tag: 'Photographic Trace' },
  { id: 'palace', name: 'Palace Architect', emoji: '🏛️', bgGradient: 'from-indigo-500 to-purple-700', textColor: 'text-indigo-300', tag: 'Method of Loci' },
  { id: 'synapse', name: 'Quantum Synapse', emoji: '⚡', bgGradient: 'from-purple-500 to-pink-600', textColor: 'text-purple-300', tag: 'DLPFC Dual N-Back' },
  { id: 'cosmic', name: 'Cosmic Observer', emoji: '✨', bgGradient: 'from-rose-500 to-pink-700', textColor: 'text-rose-300', tag: 'Sub-second Gaze' },
  { id: 'matrix', name: 'Matrix Breaker', emoji: '🔮', bgGradient: 'from-sky-500 to-indigo-700', textColor: 'text-sky-300', tag: 'Spatial Chunker' },
  { id: 'zen', name: 'Zen Memory Sage', emoji: '🧘', bgGradient: 'from-teal-500 to-emerald-700', textColor: 'text-teal-300', tag: 'Alpha Wave Stillness' },
];

export function getAvatarPreset(presetId?: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === presetId) || AVATAR_PRESETS[0];
}

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID and force long-polling for reverse-proxy & iframe compatibility
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

/**
 * Register a new user with Email & Password, creating their initial public profile document
 */
export async function registerWithEmailPassword(
  email: string,
  pass: string,
  username: string,
  avatarPresetId: string,
  customPhotoUrl?: string
): Promise<{ user: User; profile: UserProfile }> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const photoUrl = customPhotoUrl && customPhotoUrl.trim().length > 0 ? customPhotoUrl.trim() : avatarPresetId;

  await updateProfile(user, {
    displayName: username,
    photoURL: photoUrl,
  });

  const newProfile: UserProfile = {
    id: user.uid,
    email: user.email || email,
    username: username.trim() || `Athlete-${user.uid.slice(0, 5)}`,
    photoUrl,
    avatarPresetId,
    level: 1,
    xp: 0,
    rankTitle: 'Novice Observer',
    curriculumDay: 1,
    currentStreak: 0,
    bestStreak: 0,
    ayumuMaxNumbers: 4,
    matrixMaxLevel: 1,
    dualNBackMaxN: 2,
    fastestFlashMs: 2000,
    detectiveHighScore: 0,
    lockedFlashSpeed: 1200,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), newProfile);

  return { user, profile: newProfile };
}

/**
 * Sign in an existing user with Email & Password
 */
export async function loginWithEmailPassword(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

/**
 * Sign in with Google Popup (standard provider pre-configured for this project)
 */
export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  // Retrieve existing profile or bootstrap a new one
  let profile = await getUserProfile(user.uid);
  if (!profile) {
    const defaultPreset = 'ayumu';
    profile = {
      id: user.uid,
      email: user.email || '',
      username: user.displayName || `Athlete-${user.uid.slice(0, 5)}`,
      photoUrl: user.photoURL || defaultPreset,
      avatarPresetId: defaultPreset,
      level: 1,
      xp: 0,
      rankTitle: 'Novice Observer',
      curriculumDay: 1,
      currentStreak: 0,
      bestStreak: 0,
      ayumuMaxNumbers: 4,
      matrixMaxLevel: 1,
      dualNBackMaxN: 2,
      fastestFlashMs: 2000,
      detectiveHighScore: 0,
      lockedFlashSpeed: 1200,
      isSpeedLockedToPlan: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
  }

  return { user, profile };
}

/**
 * Log out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to Auth State Changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch a user's public profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Save / Update public gaming profile
 */
export async function saveUserProfile(userId: string, partialProfile: Partial<UserProfile>): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(
      docRef,
      {
        ...partialProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user profile:', err);
  }
}

/**
 * Fetch all registered players from Firestore for the community directory & leaderboard
 */
export async function fetchAllCommunityPlayers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy('xp', 'desc'), limit(50));
    const snap = await getDocs(q);
    const players: UserProfile[] = [];
    snap.forEach((docSnap) => {
      players.push(docSnap.data() as UserProfile);
    });
    return players;
  } catch (err) {
    console.error('Error fetching community players:', err);
    return [];
  }
}

/**
 * Full Cloud Data payload containing all athlete telemetry
 */
export interface UserCloudSyncPayload {
  stats: UserStats;
  protocol: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  profile?: UserProfile;
  lastSyncedAt: string;
}

/**
 * Save game save, daily protocol, and free training telemetry under users/{userId}/private/data
 * Also updates public player profile for leaderboard and community synchronization.
 */
export async function saveUserCloudData(
  userId: string,
  stats: UserStats,
  protocol: DailyProtocolState,
  freeTrainingStats?: FreeTrainingSessionStats,
  profile?: UserProfile,
  fourHourPlan?: FourHourPlanState
): Promise<void> {
  try {
    const privateDocRef = doc(db, 'users', userId, 'private', 'data');
    const nowIso = new Date().toISOString();

    await setDoc(
      privateDocRef,
      {
        userId,
        statsJson: JSON.stringify(stats),
        protocolJson: JSON.stringify(protocol),
        freeTrainingJson: freeTrainingStats ? JSON.stringify(freeTrainingStats) : null,
        fourHourPlanJson: fourHourPlan ? JSON.stringify(fourHourPlan) : null,
        profileJson: profile ? JSON.stringify(profile) : null,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // Keep public user document in sync with the latest progress
    const publicUserRef = doc(db, 'users', userId);
    await setDoc(
      publicUserRef,
      {
        id: userId,
        username: profile?.username || `Athlete-${userId.slice(0, 5)}`,
        photoUrl: profile?.photoUrl || profile?.avatarPresetId || 'ayumu',
        avatarPresetId: profile?.avatarPresetId || 'ayumu',
        level: stats.level,
        xp: stats.xp,
        rankTitle: getRankForXp(stats.xp).currentRank.title,
        curriculumDay: protocol.curriculumDay,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        ayumuMaxNumbers: stats.ayumuMaxNumbers,
        matrixMaxLevel: stats.matrixMaxLevel,
        dualNBackMaxN: stats.dualNBackMaxN,
        fastestFlashMs: stats.fastestFlashMs,
        detectiveHighScore: stats.detectiveHighScore,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user cloud data to Firestore:', err);
  }
}

/**
 * Load complete private game save & deep telemetry under users/{userId}/private/data
 */
export async function loadUserCloudData(
  userId: string
): Promise<UserCloudSyncPayload | null> {
  try {
    const privateDocRef = doc(db, 'users', userId, 'private', 'data');
    const snap = await getDoc(privateDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    let stats: UserStats | undefined;
    let protocol: DailyProtocolState | undefined;
    let freeTrainingStats: FreeTrainingSessionStats | undefined;
    let fourHourPlan: FourHourPlanState | undefined;
    let profile: UserProfile | undefined;

    if (data.statsJson) {
      stats = JSON.parse(data.statsJson);
    }
    if (data.protocolJson) {
      protocol = JSON.parse(data.protocolJson);
    }
    if (data.freeTrainingJson) {
      freeTrainingStats = JSON.parse(data.freeTrainingJson);
    }
    if (data.fourHourPlanJson) {
      fourHourPlan = JSON.parse(data.fourHourPlanJson);
    }
    if (data.profileJson) {
      profile = JSON.parse(data.profileJson);
    }

    if (!stats || !protocol) return null;

    return {
      stats,
      protocol,
      freeTrainingStats,
      fourHourPlan,
      profile,
      lastSyncedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error loading private cloud data:', err);
    return null;
  }
}

/**
 * Real-time subscription to cloud data changes on other connected devices (Phones & PC)
 */
export function subscribeToUserCloudData(
  userId: string,
  onRemoteChange: (cloudData: UserCloudSyncPayload) => void
) {
  const privateDocRef = doc(db, 'users', userId, 'private', 'data');
  return onSnapshot(
    privateDocRef,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      try {
        if (!data.statsJson || !data.protocolJson) return;
        const stats: UserStats = JSON.parse(data.statsJson);
        const protocol: DailyProtocolState = JSON.parse(data.protocolJson);
        const freeTrainingStats: FreeTrainingSessionStats | undefined = data.freeTrainingJson
          ? JSON.parse(data.freeTrainingJson)
          : undefined;
        const fourHourPlan: FourHourPlanState | undefined = data.fourHourPlanJson
          ? JSON.parse(data.fourHourPlanJson)
          : undefined;
        const profile: UserProfile | undefined = data.profileJson
          ? JSON.parse(data.profileJson)
          : undefined;

        onRemoteChange({
          stats,
          protocol,
          freeTrainingStats,
          fourHourPlan,
          profile,
          lastSyncedAt: data.updatedAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error parsing remote cloud sync update:', err);
      }
    },
    (err) => {
      console.warn('Firestore real-time subscription error:', err);
    }
  );
}

/**
 * Intelligently merge local device state with incoming cloud state so the user NEVER loses progress.
 * Takes the highest XP, highest level, most advanced curriculum day, best streaks, and records.
 */
export function mergeUserProgress(
  localStats: UserStats,
  cloudStats: UserStats,
  localProtocol: DailyProtocolState,
  cloudProtocol: DailyProtocolState,
  localFreeStats?: FreeTrainingSessionStats,
  cloudFreeStats?: FreeTrainingSessionStats
): {
  mergedStats: UserStats;
  mergedProtocol: DailyProtocolState;
  mergedFreeStats?: FreeTrainingSessionStats;
} {
  const mergedXp = Math.max(localStats.xp || 0, cloudStats.xp || 0);
  const rank = getRankForXp(mergedXp);

  const calculatedStreak = Math.max(
    localStats.currentStreak || 0,
    cloudStats.currentStreak || 0,
    Object.values(localProtocol?.history || {}).filter((h) => h?.completed).length,
    Object.values(cloudProtocol?.history || {}).filter((h) => h?.completed).length,
    localProtocol?.curriculumDay && localProtocol.curriculumDay > 1 ? localProtocol.curriculumDay - 1 : 0,
    cloudProtocol?.curriculumDay && cloudProtocol.curriculumDay > 1 ? cloudProtocol.curriculumDay - 1 : 0
  );

  const mergedStats: UserStats = {
    xp: mergedXp,
    level: rank.currentRank.level,
    totalGamesPlayed: Math.max(localStats.totalGamesPlayed || 0, cloudStats.totalGamesPlayed || 0),
    matrixMaxLevel: Math.max(localStats.matrixMaxLevel || 1, cloudStats.matrixMaxLevel || 1),
    ayumuMaxNumbers: Math.max(localStats.ayumuMaxNumbers || 4, cloudStats.ayumuMaxNumbers || 4),
    detectiveHighScore: Math.max(localStats.detectiveHighScore || 0, cloudStats.detectiveHighScore || 0),
    fastestFlashMs: Math.min(
      localStats.fastestFlashMs > 0 ? localStats.fastestFlashMs : 2000,
      cloudStats.fastestFlashMs > 0 ? cloudStats.fastestFlashMs : 2000
    ),
    currentStreak: calculatedStreak,
    bestStreak: Math.max(localStats.bestStreak || 0, cloudStats.bestStreak || 0, calculatedStreak),
    accuracyRate: Math.max(localStats.accuracyRate || 0, cloudStats.accuracyRate || 0),
    totalAttempts: Math.max(localStats.totalAttempts || 0, cloudStats.totalAttempts || 0),
    totalCorrectAttempts: Math.max(localStats.totalCorrectAttempts || 0, cloudStats.totalCorrectAttempts || 0),
    dualNBackMaxN: Math.max(localStats.dualNBackMaxN || 2, cloudStats.dualNBackMaxN || 2),
    mnemonicConversionCount: Math.max(
      localStats.mnemonicConversionCount || 0,
      cloudStats.mnemonicConversionCount || 0
    ),
    cardsMastered: Math.max(localStats.cardsMastered || 0, cloudStats.cardsMastered || 0),
    pqHistory: (cloudStats.pqHistory?.length || 0) >= (localStats.pqHistory?.length || 0)
      ? cloudStats.pqHistory
      : localStats.pqHistory,
    progressHistory: (cloudStats.progressHistory?.length || 0) >= (localStats.progressHistory?.length || 0)
      ? cloudStats.progressHistory
      : localStats.progressHistory,
  };

  // Merge protocol: choose the higher curriculum day, and ALWAYS merge history!
  const combinedHistory = {
    ...(localProtocol.history || {}),
    ...(cloudProtocol.history || {}),
  };

  let mergedProtocol: DailyProtocolState;
  if (cloudProtocol.curriculumDay > localProtocol.curriculumDay) {
    mergedProtocol = {
      ...cloudProtocol,
      history: combinedHistory,
    };
  } else if (localProtocol.curriculumDay > cloudProtocol.curriculumDay) {
    mergedProtocol = {
      ...localProtocol,
      history: combinedHistory,
    };
  } else {
    // Same day: merge task completions
    const mergedTasks = localProtocol.tasks.map((localTask) => {
      const cloudTask = cloudProtocol.tasks.find((ct) => ct.id === localTask.id);
      if (!cloudTask) return localTask;
      return {
        ...localTask,
        isCompleted: localTask.isCompleted || cloudTask.isCompleted,
        currentCount: Math.max(localTask.currentCount, cloudTask.currentCount),
      };
    });

    mergedProtocol = {
      ...cloudProtocol,
      curriculumDay: localProtocol.curriculumDay,
      tasks: mergedTasks,
      isLockedOut: localProtocol.isLockedOut || cloudProtocol.isLockedOut,
      history: combinedHistory,
    };
  }

  // Merge free training stats
  let mergedFreeStats: FreeTrainingSessionStats | undefined;
  if (localFreeStats && cloudFreeStats) {
    mergedFreeStats = {
      ...cloudFreeStats,
      totalSecondsPracticed: Math.max(localFreeStats.totalSecondsPracticed, cloudFreeStats.totalSecondsPracticed),
      totalMinutesPracticed: Math.max(localFreeStats.totalMinutesPracticed, cloudFreeStats.totalMinutesPracticed),
      totalRepsCompleted: Math.max(localFreeStats.totalRepsCompleted, cloudFreeStats.totalRepsCompleted),
      sessionsCount: Math.max(localFreeStats.sessionsCount, cloudFreeStats.sessionsCount),
      dailyHistory: {
        ...(localFreeStats.dailyHistory || {}),
        ...(cloudFreeStats.dailyHistory || {}),
      },
    };
  } else {
    mergedFreeStats = cloudFreeStats || localFreeStats;
  }

  return { mergedStats, mergedProtocol, mergedFreeStats };
}

/**
 * Merge 4-Hour Daily Plan and Physical Training logs across connected devices.
 */
export function mergeFourHourPlans(
  localPlan?: FourHourPlanState,
  cloudPlan?: FourHourPlanState
): FourHourPlanState | undefined {
  if (!localPlan && !cloudPlan) return undefined;
  if (!localPlan) return cloudPlan;
  if (!cloudPlan) return localPlan;

  const combinedHistory = {
    ...(localPlan.history || {}),
    ...(cloudPlan.history || {}),
  };

  const isLocalNewer = localPlan.currentDate > cloudPlan.currentDate;
  const isCloudNewer = cloudPlan.currentDate > localPlan.currentDate;

  let mergedTasks = localPlan.tasks;
  if (!isLocalNewer && !isCloudNewer) {
    // Same calendar day: combine completed tasks and elapsed seconds
    mergedTasks = localPlan.tasks.map((lt) => {
      const ct = cloudPlan.tasks.find((t) => t.id === lt.id);
      if (!ct) return lt;
      return {
        ...lt,
        isCompleted: lt.isCompleted || ct.isCompleted,
        elapsedSeconds: Math.max(lt.elapsedSeconds || 0, ct.elapsedSeconds || 0),
        completedAt: lt.completedAt || ct.completedAt,
      };
    });
  } else if (isCloudNewer) {
    mergedTasks = cloudPlan.tasks;
  }

  return {
    currentDate: isCloudNewer ? cloudPlan.currentDate : localPlan.currentDate,
    tasks: mergedTasks,
    currentStreak: Math.max(localPlan.currentStreak || 0, cloudPlan.currentStreak || 0),
    bestStreak: Math.max(localPlan.bestStreak || 0, cloudPlan.bestStreak || 0),
    totalSessionsCompleted: Math.max(localPlan.totalSessionsCompleted || 0, cloudPlan.totalSessionsCompleted || 0),
    history: combinedHistory,
    nsdrElapsedSeconds: Math.max(localPlan.nsdrElapsedSeconds || 0, cloudPlan.nsdrElapsedSeconds || 0),
  };
}

