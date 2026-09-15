import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats, FlashSpeed } from '../types';
import { fetchAllCommunityPlayers, getAvatarPreset } from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  Users,
  Trophy,
  Award,
  Calendar,
  Flame,
  Clock,
  Search,
  Sparkles,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Lock,
  Zap,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface CommunityPlayersViewProps {
  currentUser: User | null;
  currentProfile: UserProfile | null;
  currentStats: UserStats;
  currentSpeed: FlashSpeed;
  isSpeedLockedToPlan: boolean;
  curriculumDay: number;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenProfile: () => void;
}

// Initial community benchmarks to display alongside live registered users
const SEED_ATHLETES: UserProfile[] = [
  {
    id: 'seed-ayumu-lab',
    username: 'Ayumu (Kyoto Primate Inst.)',
    photoUrl: 'ayumu',
    avatarPresetId: 'ayumu',
    level: 7,
    xp: 9800,
    rankTitle: 'Grandmaster of Recall',
    curriculumDay: 365,
    currentStreak: 120,
    bestStreak: 120,
    ayumuMaxNumbers: 9,
    matrixMaxLevel: 10,
    dualNBackMaxN: 5,
    fastestFlashMs: 150,
    detectiveHighScore: 950,
    lockedFlashSpeed: 150,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-alex-mullen',
    username: 'Alex_MnemonicMD',
    photoUrl: 'palace',
    avatarPresetId: 'palace',
    level: 6,
    xp: 5400,
    rankTitle: 'Photographic Master',
    curriculumDay: 210,
    currentStreak: 45,
    bestStreak: 68,
    ayumuMaxNumbers: 8,
    matrixMaxLevel: 9,
    dualNBackMaxN: 4,
    fastestFlashMs: 300,
    detectiveHighScore: 820,
    lockedFlashSpeed: 300,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-eidetic-kai',
    username: 'Kai_RetinalFocus',
    photoUrl: 'visionary',
    avatarPresetId: 'visionary',
    level: 4,
    xp: 2100,
    rankTitle: 'Flash Prodigy',
    curriculumDay: 88,
    currentStreak: 21,
    bestStreak: 21,
    ayumuMaxNumbers: 7,
    matrixMaxLevel: 7,
    dualNBackMaxN: 3,
    fastestFlashMs: 600,
    detectiveHighScore: 640,
    lockedFlashSpeed: 600,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-sarah-matrix',
    username: 'Sarah_Synapse',
    photoUrl: 'eidetic',
    avatarPresetId: 'eidetic',
    level: 3,
    xp: 950,
    rankTitle: 'Retinal Snapshotter',
    curriculumDay: 35,
    currentStreak: 14,
    bestStreak: 19,
    ayumuMaxNumbers: 6,
    matrixMaxLevel: 6,
    dualNBackMaxN: 3,
    fastestFlashMs: 600,
    detectiveHighScore: 510,
    lockedFlashSpeed: 600,
    isSpeedLockedToPlan: true,
    updatedAt: new Date().toISOString(),
  },
];

type SortKey = 'xp' | 'curriculumDay' | 'ayumuMaxNumbers' | 'streak';

export const CommunityPlayersView: React.FC<CommunityPlayersViewProps> = ({
  currentUser,
  currentProfile,
  currentStats,
  currentSpeed,
  isSpeedLockedToPlan,
  curriculumDay,
  onOpenAuth,
  onOpenProfile,
}) => {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('xp');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const livePlayers = await fetchAllCommunityPlayers();
      // Combine live players from Firestore
      const playerMap = new Map<string, UserProfile>();

      // Put seed athletes first
      SEED_ATHLETES.forEach((p) => playerMap.set(p.id, p));

      // Overlay live registered players
      livePlayers.forEach((p) => playerMap.set(p.id, p));

      // If current user is logged in, ensure their most up-to-date state is displayed
      if (currentUser) {
        playerMap.set(currentUser.uid, {
          id: currentUser.uid,
          username: currentProfile?.username || currentUser.displayName || 'You (Memory Athlete)',
          photoUrl: currentProfile?.photoUrl || currentProfile?.avatarPresetId || 'ayumu',
          avatarPresetId: currentProfile?.avatarPresetId || 'ayumu',
          level: currentStats.level,
          xp: currentStats.xp,
          rankTitle: currentProfile?.rankTitle || 'Novice Observer',
          curriculumDay,
          currentStreak: currentStats.currentStreak,
          bestStreak: currentStats.bestStreak,
          ayumuMaxNumbers: currentStats.ayumuMaxNumbers,
          matrixMaxLevel: currentStats.matrixMaxLevel,
          dualNBackMaxN: currentStats.dualNBackMaxN,
          fastestFlashMs: currentStats.fastestFlashMs,
          detectiveHighScore: currentStats.detectiveHighScore,
          lockedFlashSpeed: currentSpeed,
          isSpeedLockedToPlan,
          updatedAt: new Date().toISOString(),
        });
      }

      setPlayers(Array.from(playerMap.values()));
    } catch (err) {
      console.error('Error loading community players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [currentUser, currentProfile, currentStats.xp]);

  const handleShare = () => {
    sound.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filter & Sort
  const filtered = players
    .filter((p) => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'xp') return b.xp - a.xp;
      if (sortKey === 'curriculumDay') return b.curriculumDay - a.curriculumDay;
      if (sortKey === 'ayumuMaxNumbers') return b.ayumuMaxNumbers - a.ayumuMaxNumbers;
      if (sortKey === 'streak') return (b.currentStreak || 0) - (a.currentStreak || 0);
      return 0;
    });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Community Directory
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {players.length} Registered Athletes
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              All Community Players & Memory Athletes
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Explore other players mastering the 365-day flash curriculum. Each friend gets their own account, profile photo, and password sign-in to preserve individual stats.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              {copiedLink ? 'Link Copied!' : 'Share with Friends'}
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenProfile();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                My Profile Photo & Stats
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('signup');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account & Join
              </button>
            )}
          </div>
        </div>

        {/* Guest prompt if not signed in */}
        {!currentUser && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  You are currently training in Guest Mode
                </span>
                <span className="text-slate-300 text-[11px]">
                  Sign in with your password to choose your profile photo, username, and lock your 365-day plan across devices.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('signin');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('signup');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-400 font-semibold px-1">Sort:</span>
          {(
            [
              { key: 'xp', label: 'Top Level / XP' },
              { key: 'curriculumDay', label: '365 Plan Day' },
              { key: 'ayumuMaxNumbers', label: 'Ayumu Peak' },
              { key: 'streak', label: 'Streak' },
            ] as { key: SortKey; label: string }[]
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => {
                sound.playClick();
                setSortKey(s.key);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortKey === s.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}

          <button
            onClick={() => {
              sound.playClick();
              loadPlayers();
            }}
            title="Refresh players"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Players Directory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((player, idx) => {
          const isMe = currentUser && player.id === currentUser.uid;
          const preset = getAvatarPreset(player.avatarPresetId);

          return (
            <div
              key={player.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                isMe
                  ? 'bg-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Rank Position Number */}
              <div className="text-slate-500 font-mono font-bold text-xs pt-1 w-5 text-center shrink-0">
                #{idx + 1}
              </div>

              {/* Profile Photo / Avatar */}
              <div className="relative shrink-0">
                {player.photoUrl && player.photoUrl.startsWith('http') ? (
                  <img
                    src={player.photoUrl}
                    alt={player.username}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover ring-1 ring-cyan-400/40 shadow-md"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${preset.bgGradient} flex items-center justify-center text-2xl shadow-md`}
                  >
                    {preset.emoji}
                  </div>
                )}
                {isMe && (
                  <span className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full shadow">
                    YOU
                  </span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {player.username}
                    {player.id.startsWith('seed-ayumu') && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded border border-amber-500/30">
                        Benchmark
                      </span>
                    )}
                  </h4>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Lvl {player.level}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                  <span>{player.rankTitle}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-300">{player.xp} XP</span>
                </div>

                {/* Badges and Metrics */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">Day {player.curriculumDay || 1}/365</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">Ayumu: {player.ayumuMaxNumbers || 4}d</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                    <span className="truncate">Streak: {player.currentStreak || 0}d</span>
                  </div>
                </div>

                {player.lockedFlashSpeed && (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Plan Flash: <strong className="text-slate-300">{player.lockedFlashSpeed}ms</strong>
                    </span>
                    {player.isSpeedLockedToPlan && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No players match the search query "{searchQuery}".
        </div>
      )}
    </div>
  );
};
