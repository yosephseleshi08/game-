import React from 'react';
import { UserStats, FlashSpeed, GameMode, UserProfile, AthleteArchetype } from '../types';
import { getRankForXp } from '../utils/storage';
import { getAvatarPreset } from '../utils/avatars';
import { sound } from '../utils/audio';
import {
  Camera,
  Volume2,
  VolumeX,
  BookOpen,
  Flame,
  Award,
  Clock,
  CalendarCheck,
  Lock,
  Sparkles,
  Cloud,
  RefreshCw,
  Smartphone,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { AmbientSoundscapePlayer } from './AmbientSoundscapePlayer';
import { PWAInstallButton } from './PWAInstallPrompt';

interface HeaderProps {
  stats: UserStats;
  currentSpeed: FlashSpeed;
  isSpeedLockedToPlan: boolean;
  onSpeedChange: (speed: FlashSpeed) => void;
  onOpenFlashPlan: () => void;
  onOpenTips: () => void;
  onOpenRoadmap?: () => void;
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  curriculumDay?: number;
  isLockedOut?: boolean;
  isMilestoneReady?: boolean;
  onOpenMilestone?: () => void;
  currentProfile: UserProfile | null;
  onOpenProfile: () => void;
  currentUser?: { email?: string | null; displayName?: string | null } | null;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  onForceSync?: () => void;
  onLockApp?: () => void;
  archetype?: AthleteArchetype;
  onOpenArchetype?: () => void;
  onRestoreStreak?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentSpeed,
  isSpeedLockedToPlan,
  onSpeedChange,
  onOpenFlashPlan,
  onOpenTips,
  onOpenRoadmap,
  activeMode,
  onSelectMode,
  isSoundMuted,
  onToggleSound,
  curriculumDay = 1,
  isLockedOut = false,
  isMilestoneReady = false,
  onOpenMilestone,
  currentProfile,
  onOpenProfile,
  currentUser,
  cloudSyncStatus = 'synced',
  onForceSync,
  onLockApp,
  archetype,
  onOpenArchetype,
  onRestoreStreak,
}) => {
  const { currentRank, nextRank, progressPercent } = getRankForXp(stats.xp);
  const avatarPreset = getAvatarPreset(currentProfile?.avatarPresetId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-lg safe-top w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <div
            onClick={() => onSelectMode('daily-protocol')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/30 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white flex items-center gap-1 truncate">
                Yosi <span className="text-cyan-400 font-extrabold">Game</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden xs:inline shrink-0">
                For Yoseph
              </span>
              {isMilestoneReady && !isLockedOut ? (
                <button
                  id="header-milestone-ready-btn"
                  onClick={() => {
                    if (onOpenMilestone) onOpenMilestone();
                    else onSelectMode('daily-protocol');
                  }}
                  className="text-[9px] sm:text-[10px] uppercase font-black px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-amber-400/80 text-amber-300 shadow-sm animate-pulse shrink-0"
                  title="Daily protocol complete! View milestone celebration & claim XP"
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                  Day {curriculumDay} Done!
                </button>
              ) : isLockedOut ? (
                <button
                  id="header-milestone-locked-btn"
                  onClick={() => {
                    if (onOpenMilestone) onOpenMilestone();
                    else onSelectMode('daily-protocol');
                  }}
                  className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shrink-0"
                  title="Daily protocol complete! Click to view milestone progress"
                >
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                  Day {curriculumDay} ✓
                </button>
              ) : (
                <button
                  id="header-protocol-btn"
                  onClick={() => onSelectMode('daily-protocol')}
                  className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shrink-0"
                >
                  <CalendarCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Day {curriculumDay}
                </button>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block">
              Exclusively created for Yoseph • Daily 1-Hour Cognitive Engine
            </p>
          </div>
        </div>

        {/* Player Rank & XP Bar (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-1.5 min-w-[210px] shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {currentRank.title}
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                {stats.xp} XP
              </span>
            </div>

            {/* XP Progress Bar */}
            <div className="w-32 bg-slate-700/60 rounded-full h-1.5 overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-0.5">
              <span>Lvl {currentRank.level}</span>
              <span>{nextRank ? `${nextRank.minXp - stats.xp} XP to Lvl ${nextRank.level}` : 'Max'}</span>
            </div>
          </div>

          {/* Streak Badge */}
          <div
            onClick={() => {
              sound.playClick();
              if (onRestoreStreak) onRestoreStreak();
            }}
            className="flex flex-col items-center justify-center pl-2.5 border-l border-slate-700/70 cursor-pointer hover:opacity-85 transition-opacity"
            title={`Active Streak: ${stats.currentStreak} Days. Tap to reset/manage progress.`}
          >
            <div className="flex items-center text-amber-400 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-bounce" />
              <span>{stats.currentStreak}</span>
            </div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider hover:text-amber-300">Streak</span>
          </div>
        </div>

        {/* Global Controls & Athlete Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* PWA Install & Offline Status */}
          <PWAInstallButton />

          {/* Clean Reset Button (Tablet / Desktop) */}
          <button
            onClick={() => {
              sound.playClick();
              if (onRestoreStreak) onRestoreStreak();
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Clean every single thing and reset progress to Day 1"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset</span>
          </button>

          {/* Type of Guy Archetype Badge Trigger */}
          {archetype && (
            <button
              id="header-type-of-guy-btn"
              onClick={() => {
                sound.playClick();
                if (onOpenArchetype) onOpenArchetype();
              }}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-sm bg-slate-800/90 ${archetype.borderAccent} ${archetype.textAccent} hover:bg-slate-700 active:scale-95`}
              title={`Type of Guy: ${archetype.title} (${archetype.allTimeMinutes}m total training) - Click for diagnostic`}
            >
              <span>{archetype.emoji}</span>
              <span className="hidden lg:inline">{archetype.title.split(' ')[1] || 'Archetype'}</span>
            </button>
          )}

          {/* 365 Flash Time Plan & Speed Lock Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenFlashPlan();
            }}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isSpeedLockedToPlan
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
            }`}
            title="Inspect 365-Day Flash Time Progression & Lock Speed"
          >
            {isSpeedLockedToPlan ? (
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            ) : (
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            )}
            <span className="font-mono text-[11px] sm:text-xs">{currentSpeed}ms</span>
          </button>

          {/* Yoseph Unified Cross-Device Cloud Sync Button (2 Phones & 1 PC) */}
          <button
            id="header-cloud-synced-btn"
            onClick={() => {
              sound.playClick();
              if (onForceSync) onForceSync();
              else onOpenProfile();
            }}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer transition-all shadow-sm group active:scale-95"
            title="All devices auto-sync to Yoseph's unified record. Click to sync now."
          >
            <Cloud className={`w-3.5 h-3.5 text-cyan-400 ${cloudSyncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline text-[11px] font-mono">
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
            </span>
          </button>

          {/* Lock App / Yoseph's Vault Button */}
          {onLockApp && (
            <button
              id="header-lock-app-btn"
              onClick={() => {
                sound.playClick();
                onLockApp();
              }}
              className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
              title="Lock game with password yoseph535"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
              <span className="hidden md:inline text-[11px]">Lock</span>
            </button>
          )}

          {/* Solo Athlete Profile Badge */}
          <button
            id="header-athlete-profile-btn"
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/90 text-left transition-all cursor-pointer shadow-sm group active:scale-95 shrink-0"
            title="Customize your athlete nickname and avatar"
          >
            <div className="relative">
              {currentProfile?.photoUrl && currentProfile.photoUrl.startsWith('http') ? (
                <img
                  src={currentProfile.photoUrl}
                  alt={currentProfile.username}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover ring-1 ring-cyan-400"
                />
              ) : (
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr ${avatarPreset.bgGradient} flex items-center justify-center text-xs sm:text-sm ring-1 ring-cyan-400/40`}
                >
                  {avatarPreset.emoji}
                </div>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-900" title="Offline Player Active" />
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[90px]">
                {currentProfile?.username || 'Yosi'}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono">
                Day {curriculumDay} • Lvl {stats.level}
              </span>
            </div>
          </button>

          {/* Ambient Soundscape Player */}
          <AmbientSoundscapePlayer />

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              onToggleSound();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSoundMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isSoundMuted ? 'Unmute Audio Synthesizer' : 'Mute Sound'}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Techniques Guide Modal (Desktop) */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTips();
            }}
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 font-medium text-xs transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Techniques</span>
          </button>
        </div>
      </div>
    </header>
  );
};

