import React, { useRef } from 'react';
import { UserStats, FlashSpeed, GameMode, UserProfile, AthleteArchetype } from '../types';
import { getRankForXp } from '../utils/storage';
import { getAvatarPreset } from '../utils/avatars';
import { sound } from '../utils/audio';
import {
  Camera,
  Volume2,
  VolumeX,
  Flame,
  Award,
  Clock,
  Lock,
  Sparkles,
  RotateCcw,
  Upload,
  Brain,
  Cloud,
  RefreshCw,
  Download,
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
  onUpdatePhoto?: (photoUrl: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentSpeed,
  isSpeedLockedToPlan,
  onSpeedChange,
  onOpenFlashPlan,
  onOpenTips,
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
  cloudSyncStatus = 'synced',
  onForceSync,
  onLockApp,
  archetype,
  onOpenArchetype,
  onRestoreStreak,
  onUpdatePhoto,
}) => {
  const { currentRank, nextRank, progressPercent } = getRankForXp(stats.xp);
  const avatarPreset = getAvatarPreset(currentProfile?.avatarPresetId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if profile has a valid custom photo (data URL, HTTP, or blob)
  const hasCustomPhoto =
    currentProfile?.photoUrl &&
    (currentProfile.photoUrl.startsWith('data:image/') ||
      currentProfile.photoUrl.startsWith('http') ||
      currentProfile.photoUrl.startsWith('blob:'));

  const handleTriggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) return;

      // Compress image to 256x256 max so it stores cleanly in localStorage and syncs fast
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          if (onUpdatePhoto) {
            onUpdatePhoto(compressed);
          }
        } else if (onUpdatePhoto) {
          onUpdatePhoto(rawData);
        }
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be re-selected if desired
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md safe-top w-full">
      {/* Hidden file input for native device photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity & Photo Avatar Upload */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Avatar with Camera Upload Badge */}
          <div
            onClick={handleTriggerUpload}
            className="relative cursor-pointer group active:scale-95 transition-transform"
            title="Click to upload your custom photo from this device"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden ring-2 ring-cyan-500/50 group-hover:ring-cyan-400 bg-slate-800 flex items-center justify-center shadow-md">
              {hasCustomPhoto ? (
                <img
                  src={currentProfile!.photoUrl}
                  alt={currentProfile?.username || 'Yosi'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-tr ${avatarPreset.bgGradient} flex items-center justify-center text-lg sm:text-xl`}
                >
                  {avatarPreset.emoji}
                </div>
              )}
            </div>

            {/* Camera Upload Badge */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center ring-2 ring-slate-900 shadow-sm transition-colors"
              title="Upload Photo"
            >
              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            </div>
          </div>

          {/* Title & Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onSelectMode('daily-protocol')}
                className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Yosi <span className="text-cyan-400">Game</span>
              </button>

              {/* Day Badge */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onOpenMilestone) onOpenMilestone();
                  else onSelectMode('daily-protocol');
                }}
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all ${
                  isMilestoneReady
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/70 animate-pulse'
                    : isLockedOut
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800/80 text-cyan-300 border-slate-700 hover:border-cyan-500/50'
                }`}
                title="Protocol Day"
              >
                {isMilestoneReady ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    Day {curriculumDay} Done
                  </>
                ) : (
                  <>Day {curriculumDay}</>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
              Exclusively created for Yoseph • Daily 1-Hour Cognitive Engine
            </p>
          </div>
        </div>

        {/* Center: Player Rank & XP Progress (Tablet / PC only) */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3 py-1.5 shrink-0">
          <div className="flex flex-col min-w-[140px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {currentRank.title}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {stats.xp} XP
              </span>
            </div>

            {/* XP Progress Bar */}
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-0.5">
              <span>Lvl {currentRank.level}</span>
              <span>{nextRank ? `${nextRank.minXp - stats.xp} XP left` : 'Max'}</span>
            </div>
          </div>

          {/* Streak Flame */}
          <div
            onClick={() => {
              sound.playClick();
              if (onRestoreStreak) onRestoreStreak();
            }}
            className="flex flex-col items-center justify-center pl-2.5 border-l border-slate-700/70 cursor-pointer hover:opacity-85 transition-opacity"
            title={`Active Streak: ${stats.currentStreak} Days`}
          >
            <div className="flex items-center text-amber-400 font-bold text-xs gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{stats.currentStreak}</span>
            </div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Streak</span>
          </div>
        </div>

        {/* Right: Key Controls (Responsive & Compact) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Download / Install App on Any Device */}
          <PWAInstallButton />

          {/* Unified Cross-Device Cloud Sync Button (PC & Phones) */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              if (onForceSync) onForceSync();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyan-500/30 bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
            title="Cross-device cloud sync (PC & Phones) - Click to manually refresh sync"
          >
            <Cloud className={`w-3.5 h-3.5 text-cyan-400 ${cloudSyncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden md:inline text-[11px] font-mono">
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
            </span>
          </button>

          {/* Archetype Badge (Desktop) */}
          {archetype && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                if (onOpenArchetype) onOpenArchetype();
              }}
              className={`hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer bg-slate-800/90 ${archetype.borderAccent} ${archetype.textAccent} hover:bg-slate-700`}
              title={`Type of Guy: ${archetype.title}`}
            >
              <span>{archetype.emoji}</span>
              <span className="hidden xl:inline">{archetype.title.split(' ')[1] || 'Archetype'}</span>
            </button>
          )}

          {/* Flash Speed Indicator */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenFlashPlan();
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              isSpeedLockedToPlan
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
            }`}
            title="365-Day Flash Speed Progression"
          >
            {isSpeedLockedToPlan ? (
              <Lock className="w-3 h-3 text-emerald-400" />
            ) : (
              <Clock className="w-3 h-3 text-cyan-400" />
            )}
            <span className="font-mono text-[11px]">{currentSpeed}ms</span>
          </button>

          {/* Ambient Sound Player */}
          <AmbientSoundscapePlayer />

          {/* Sound Synthesizer Mute Toggle */}
          <button
            type="button"
            onClick={() => onToggleSound()}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              isSoundMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Lock App / Password Gate Button */}
          {onLockApp && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onLockApp();
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
              title="Lock game with password yoseph535"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-[11px]">Lock</span>
            </button>
          )}

          {/* Profile Details Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer transition-all"
            title="Profile & Settings"
          >
            <span className="text-[11px] font-bold text-white max-w-[70px] truncate">
              {currentProfile?.username || 'Yosi'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
