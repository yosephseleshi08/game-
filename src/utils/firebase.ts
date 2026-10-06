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
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserStats, DailyProtocolState, FreeTrainingSessionStats, FourHourPlanState } from '../types';
import { getRankForXp } from './storage';
import { generateSixDayStreakHistory } from './protocol';

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
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Silence verbose internal connection warnings
setLogLevel('error');

// Initialize Firestore with specific database ID and auto-detecting transport for optimal reliability across devices
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

// Validate Connection to Firestore on boot as required by Firebase skill
async function testConnection() {
  try {
    // Non-blocking background connectivity verification
    await getDocFromServer(doc(db, 'users', 'connection_check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or connecting...');
    }
  }
}
testConnection();

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
    const defaultPreset = 'yosi-prime';
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
      ayumuMaxNumbers: 3,
      matrixMaxLevel: 1,
      dualNBackMaxN: 1,
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
  isCleanSlate?: boolean;
}

/**
 * Hard reset all user data in Firestore (private telemetry and public profile)
 * Overwrites documents with pristine Day 1, 0 XP, 0 streak values.
 */
export async function resetUserCloudData(userId: string): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    const cleanStats: UserStats = {
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
    };

    const cycleKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-12AM`;

    const cleanProtocol: DailyProtocolState = {
      currentCycleDate: cycleKey,
      isLockedOut: false,
      curriculumDay: 1,
      currentPhase: 1,
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
    };

    const cleanFreeTraining: FreeTrainingSessionStats = {
      totalMinutesPracticed: 0,
      totalSecondsPracticed: 0,
      totalRepsCompleted: 0,
      doomScrollMinutesSaved: 0,
      sessionsCount: 0,
      lastSessionDate: nowIso,
      currentDayCycle: cycleKey,
      todayCurriculumDay: 1,
      todaySeconds: 0,
      todayReps: 0,
      todayGamesBreakdown: {},
      dailyHistory: {},
    };

    const todayDateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const cleanFourHour: FourHourPlanState = {
      currentDate: todayDateStr,
      tasks: [
        {
          id: 'mnemonic-pegs-hour',
          title: 'Mnemonic Major Pegs (20 Min)',
          category: 'morning',
          targetMinutes: 20,
          gameMode: 'mnemonic-pegs',
          description: 'Number-to-image data keys',
          neuroImpact: 'Phonetic-to-visual associative binding and left-hemisphere symbolic transcription keys.',
          isCompleted: false,
          elapsedSeconds: 0,
        },
        {
          id: 'dual-nback-hour',
          title: 'Dual N-Back Buffer (20 Min)',
          category: 'midday',
          targetMinutes: 20,
          gameMode: 'dual-nback',
          description: 'Working memory capacity and speaking focus',
          neuroImpact: 'Dorsolateral Prefrontal Cortex (DLPFC) fluid executive buffer and speech articulation focus.',
          isCompleted: false,
          elapsedSeconds: 0,
        },
        {
          id: 'symbol-detective-hour',
          title: 'Symbol Detective Lab (20 Min)',
          category: 'evening',
          targetMinutes: 20,
          gameMode: 'symbol-detective',
          description: 'Abstract symbol processing and script speed',
          neuroImpact: 'Occipito-temporal visual word form area (VWFA) and high-speed glyph discrimination.',
          isCompleted: false,
          elapsedSeconds: 0,
        },
      ],
      currentStreak: 0,
      bestStreak: 0,
      totalSessionsCompleted: 0,
      history: {},
      nsdrElapsedSeconds: 0,
    };

    const cleanProfile: UserProfile = {
      id: userId,
      email: auth.currentUser?.email || '',
      username: auth.currentUser?.displayName || 'Yoseph (Yosi)',
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
      updatedAt: nowIso,
      createdAt: nowIso,
    };

    const privateDocRef = doc(db, 'users', userId, 'private', 'data');
    await setDoc(privateDocRef, {
      userId,
      statsJson: JSON.stringify(cleanStats),
      protocolJson: JSON.stringify(cleanProtocol),
      freeTrainingJson: JSON.stringify(cleanFreeTraining),
      fourHourPlanJson: JSON.stringify(cleanFourHour),
      profileJson: JSON.stringify(cleanProfile),
      updatedAt: nowIso,
      isCleanSlate: true,
      cleanSlateVersion: 12,
    });

    const publicUserRef = doc(db, 'users', userId);
    await setDoc(publicUserRef, {
      id: userId,
      username: cleanProfile.username,
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
      updatedAt: nowIso,
      isCleanSlate: true,
      cleanSlateVersion: 12,
    });
  } catch (err) {
    console.error('Error resetting user cloud data:', err);
  }
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
        isCleanSlate: true,
        cleanSlateVersion: 12,
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
        photoUrl: profile?.photoUrl || profile?.avatarPresetId || 'yosi-prime',
        avatarPresetId: profile?.avatarPresetId || 'yosi-prime',
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
        isCleanSlate: true,
        cleanSlateVersion: 12,
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

    // Detect legacy un-reset state (19-day streak, 33095 XP, old Day 7)
    const isLegacy =
      data.cleanSlateVersion !== 12 &&
      (stats.currentStreak === 19 ||
        stats.bestStreak === 19 ||
        (stats.xp && stats.xp >= 30000) ||
        protocol.curriculumDay === 7 ||
        Object.keys(protocol.history || {}).length >= 10);

    if (isLegacy) {
      console.log('[AI Studio] Cleansing legacy 19-day/33095XP cloud state to Day 1...');
      await resetUserCloudData(userId);
      return null;
    }

    return {
      stats,
      protocol,
      freeTrainingStats,
      fourHourPlan,
      profile,
      lastSyncedAt: data.updatedAt || new Date().toISOString(),
      isCleanSlate: data.isCleanSlate,
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
  const isCloudLegacy =
    cloudStats.currentStreak === 19 ||
    cloudStats.bestStreak === 19 ||
    (cloudStats.xp && cloudStats.xp >= 30000) ||
    cloudProtocol.curriculumDay === 7 ||
    Object.keys(cloudProtocol.history || {}).length >= 10;

  const isLocalLegacy =
    localStats.currentStreak === 19 ||
    localStats.bestStreak === 19 ||
    (localStats.xp && localStats.xp >= 30000) ||
    localProtocol.curriculumDay === 7 ||
    Object.keys(localProtocol.history || {}).length >= 10;

  const sCloud = isCloudLegacy ? localStats : cloudStats;
  const pCloud = isCloudLegacy ? localProtocol : cloudProtocol;
  const sLocal = isLocalLegacy ? sCloud : localStats;
  const pLocal = isLocalLegacy ? pCloud : localProtocol;

  const mergedXp = Math.max(sLocal.xp || 0, sCloud.xp || 0);
  const rank = getRankForXp(mergedXp);

  const calculatedStreak = Math.max(
    sLocal.currentStreak || 0,
    sCloud.currentStreak || 0,
    Object.values(pLocal?.history || {}).filter((h) => h?.completed).length,
    Object.values(pCloud?.history || {}).filter((h) => h?.completed).length,
    pLocal?.curriculumDay && pLocal.curriculumDay > 1 ? pLocal.curriculumDay - 1 : 0,
    pCloud?.curriculumDay && pCloud.curriculumDay > 1 ? pCloud.curriculumDay - 1 : 0
  );

  const mergedStats: UserStats = {
    xp: mergedXp,
    level: Math.max(rank.currentRank.level, sLocal.level || 1, sCloud.level || 1),
    totalGamesPlayed: Math.max(sLocal.totalGamesPlayed || 0, sCloud.totalGamesPlayed || 0),
    matrixMaxLevel: Math.max(sLocal.matrixMaxLevel || 1, sCloud.matrixMaxLevel || 1),
    ayumuMaxNumbers: Math.max(sLocal.ayumuMaxNumbers || 3, sCloud.ayumuMaxNumbers || 3),
    detectiveHighScore: Math.max(sLocal.detectiveHighScore || 0, sCloud.detectiveHighScore || 0),
    fastestFlashMs: Math.min(
      sLocal.fastestFlashMs > 0 ? sLocal.fastestFlashMs : 2000,
      sCloud.fastestFlashMs > 0 ? sCloud.fastestFlashMs : 2000
    ),
    currentStreak: calculatedStreak,
    bestStreak: Math.max(sLocal.bestStreak || 0, sCloud.bestStreak || 0, calculatedStreak),
    accuracyRate: Math.max(sLocal.accuracyRate || 0, sCloud.accuracyRate || 0),
    totalAttempts: Math.max(sLocal.totalAttempts || 0, sCloud.totalAttempts || 0),
    totalCorrectAttempts: Math.max(sLocal.totalCorrectAttempts || 0, sCloud.totalCorrectAttempts || 0),
    dualNBackMaxN: Math.max(sLocal.dualNBackMaxN || 1, sCloud.dualNBackMaxN || 1),
    mnemonicConversionCount: Math.max(
      sLocal.mnemonicConversionCount || 0,
      sCloud.mnemonicConversionCount || 0
    ),
    cardsMastered: Math.max(sLocal.cardsMastered || 0, sCloud.cardsMastered || 0),
    pqHistory: (sCloud.pqHistory?.length || 0) >= (sLocal.pqHistory?.length || 0)
      ? sCloud.pqHistory
      : sLocal.pqHistory,
    progressHistory: (sCloud.progressHistory?.length || 0) >= (sLocal.progressHistory?.length || 0)
      ? sCloud.progressHistory
      : sLocal.progressHistory,
  };

  // Merge protocol: choose the higher curriculum day, and ALWAYS merge history!
  const combinedHistory = {
    ...(pLocal.history || {}),
    ...(pCloud.history || {}),
  };

  const highestDay = Math.max(pCloud.curriculumDay || 1, pLocal.curriculumDay || 1);

  let mergedProtocol: DailyProtocolState;
  if (pCloud.curriculumDay > pLocal.curriculumDay) {
    mergedProtocol = {
      ...pCloud,
      curriculumDay: highestDay,
      history: combinedHistory,
    };
  } else if (pLocal.curriculumDay > pCloud.curriculumDay) {
    mergedProtocol = {
      ...pLocal,
      curriculumDay: highestDay,
      history: combinedHistory,
    };
  } else {
    // Same day: merge task completions
    const mergedTasks = pLocal.tasks.map((localTask) => {
      const cloudTask = pCloud.tasks.find((ct) => ct.id === localTask.id);
      if (!cloudTask) return localTask;
      return {
        ...localTask,
        isCompleted: localTask.isCompleted || cloudTask.isCompleted,
        currentCount: Math.max(localTask.currentCount, cloudTask.currentCount),
      };
    });

    mergedProtocol = {
      ...pCloud,
      curriculumDay: pLocal.curriculumDay,
      tasks: mergedTasks,
      isLockedOut: pLocal.isLockedOut || pCloud.isLockedOut,
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

