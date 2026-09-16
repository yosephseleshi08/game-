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
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserStats, DailyProtocolState } from '../types';

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
 * Save private game save & deep telemetry under users/{userId}/private/data
 */
export async function saveUserCloudData(
  userId: string,
  stats: UserStats,
  protocol: DailyProtocolState
): Promise<void> {
  try {
    const privateDocRef = doc(db, 'users', userId, 'private', 'data');
    await setDoc(
      privateDocRef,
      {
        userId,
        statsJson: JSON.stringify(stats),
        protocolJson: JSON.stringify(protocol),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving private cloud data:', err);
  }
}

/**
 * Load private game save & deep telemetry under users/{userId}/private/data
 */
export async function loadUserCloudData(
  userId: string
): Promise<{ stats?: UserStats; protocol?: DailyProtocolState } | null> {
  try {
    const privateDocRef = doc(db, 'users', userId, 'private', 'data');
    const snap = await getDoc(privateDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    let stats: UserStats | undefined;
    let protocol: DailyProtocolState | undefined;

    if (data.statsJson) {
      stats = JSON.parse(data.statsJson);
    }
    if (data.protocolJson) {
      protocol = JSON.parse(data.protocolJson);
    }

    return { stats, protocol };
  } catch (err) {
    console.error('Error loading private cloud data:', err);
    return null;
  }
}
