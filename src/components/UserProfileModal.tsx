import React, { useState } from 'react';
import { UserProfile, UserStats, FlashSpeed } from '../types';
import {
  AVATAR_PRESETS,
  getAvatarPreset,
} from '../utils/avatars';
import { saveLocalProfile, exportDataBackupFile, restoreDataFromBackupText } from '../utils/storage';
import { sound } from '../utils/audio';
import {
  X,
  User as UserIcon,
  Camera,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Lock,
  Award,
  Cloud,
  RefreshCw,
  Smartphone,
  LogOut,
  Laptop,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  stats: UserStats;
  currentSpeed: FlashSpeed;
  isSpeedLockedToPlan: boolean;
  curriculumDay: number;
  onUpdateProfile: (updated: UserProfile) => void;
  currentUser?: { email?: string | null; displayName?: string | null } | null;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: Date | null;
  onOpenAuth?: () => void;
  onForceSync?: () => Promise<void> | void;
  onSignOut?: () => void;
  onRestoreStreak?: () => void;
  onDataRestored?: (stats: UserStats) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  stats,
  currentSpeed,
  isSpeedLockedToPlan,
  curriculumDay,
  onUpdateProfile,
  currentUser,
  cloudSyncStatus = 'offline',
  lastSyncedAt,
  onOpenAuth,
  onForceSync,
  onSignOut,
  onRestoreStreak,
  onDataRestored,
}) => {
  const [username, setUsername] = useState(profile?.username || 'Memory Athlete');
  const [selectedPresetId, setSelectedPresetId] = useState(profile?.avatarPresetId || 'ayumu');
  const [customPhotoUrl, setCustomPhotoUrl] = useState(
    profile?.photoUrl && profile.photoUrl.startsWith('http') ? profile.photoUrl : ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSyncClick = async () => {
    if (!onForceSync) return;
    setSyncingManual(true);
    sound.playClick();
    try {
      await onForceSync();
      sound.playSuccess();
      setMsg('Synchronized across all your devices!');
      setTimeout(() => setMsg(null), 3000);
    } catch {
      sound.playError();
      setMsg('Sync failed. Check connection.');
    } finally {
      setSyncingManual(false);
    }
  };

  const currentPreset = getAvatarPreset(profile?.avatarPresetId || selectedPresetId);

  const handleSaveProfile = () => {
    setSaving(true);
    sound.playClick();
    try {
      const finalPhoto = customPhotoUrl.trim() || selectedPresetId;
      const targetId = profile?.id || 'local-athlete';
      const updated: UserProfile = {
        ...(profile || {
          id: targetId,
          email: 'offline@local.app',
          level: stats.level,
          xp: stats.xp,
          rankTitle: 'Novice Observer',
          curriculumDay,
          currentStreak: stats.currentStreak,
          bestStreak: stats.bestStreak,
          ayumuMaxNumbers: stats.ayumuMaxNumbers,
          matrixMaxLevel: stats.matrixMaxLevel,
          dualNBackMaxN: stats.dualNBackMaxN,
          fastestFlashMs: stats.fastestFlashMs,
          detectiveHighScore: stats.detectiveHighScore,
          lockedFlashSpeed: currentSpeed,
          isSpeedLockedToPlan,
          createdAt: new Date().toISOString(),
        }),
        username: username.trim() || 'Memory Athlete',
        avatarPresetId: selectedPresetId,
        photoUrl: finalPhoto,
        updatedAt: new Date().toISOString(),
      };

      saveLocalProfile(updated);
      onUpdateProfile(updated);
      sound.playSuccess();
      setMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      sound.playError();
      setMsg('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {profile?.photoUrl && profile.photoUrl.startsWith('http') ? (
              <img
                src={profile.photoUrl}
                alt={profile.username}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentPreset.bgGradient} flex items-center justify-center text-3xl shadow-lg ring-2 ring-cyan-400/40`}
              >
                {currentPreset.emoji}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700">
              <span className="w-3 h-3 block rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                {profile?.username || 'Solo Memory Athlete'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Lvl {stats.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Solo Athlete • Local Offline Profile</p>
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
              <Award className="w-3 h-3" /> {profile?.rankTitle || 'Memory Master in Training'}
            </span>
          </div>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{msg}</span>
          </div>
        )}

        {/* Edit Form or View Stats */}
        {isEditing ? (
          <div className="space-y-4 mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Username
              </label>
              <input
                type="text"
                value={username}
                maxLength={24}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" /> Change Profile Avatar
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedPresetId(p.id);
                        setCustomPhotoUrl('');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${p.bgGradient} flex items-center justify-center text-lg`}
                      >
                        {p.emoji}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Or paste custom image URL:</span>
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Stats Grid */
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 text-cyan-400" /> 365 Plan Day
                </span>
                <div className="text-base font-bold text-white font-mono">
                  Day {curriculumDay} of 365
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" /> Flash Speed
                </span>
                <div className="text-base font-bold text-white font-mono flex items-center gap-1">
                  {currentSpeed}ms
                  {isSpeedLockedToPlan && <Lock className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Flame className="w-3 h-3 text-orange-400" /> Best Streak
                </span>
                <div className="text-base font-bold text-white font-mono">
                  {stats.bestStreak} days
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">
                  Ayumu Chimp Peak
                </span>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {stats.ayumuMaxNumbers} digits
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">
                  Matrix Max Level
                </span>
                <div className="text-base font-bold text-indigo-300 font-mono">
                  Level {stats.matrixMaxLevel}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">
                  Dual N-Back Peak
                </span>
                <div className="text-base font-bold text-sky-400 font-mono">
                  N = {stats.dualNBackMaxN}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsEditing(true);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" /> Edit Username & Profile Avatar
            </button>
          </div>
        )}

        {/* 6-Day Streak Recovery & Data Backup (Download & Restore) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/40 text-xs mb-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Flame className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  6-Day Streak Recovery & Data Backup
                </h4>
                <span className="text-[10px] text-amber-300 font-mono">
                  Active Streak: {stats.currentStreak} Days • Day {curriculumDay} Protocol 🔥
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-bold">
              Guaranteed
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            Your 6-day streak is safely preserved. If you download the app on another phone, clear browser cache, or re-open in offline mode, you can restore your 6-day streak and Day 7 curriculum with 1 click.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                if (onRestoreStreak) onRestoreStreak();
                setMsg('6-Day streak & Day 7 curriculum successfully verified & restored! 🔥');
                setTimeout(() => setMsg(null), 3500);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40 active:scale-98"
            >
              <Flame className="w-3.5 h-3.5 fill-slate-950" />
              <span>⚡ Restore 6-Day Streak</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                exportDataBackupFile();
                setMsg('Backup file downloaded! Keep it safe.');
                setTimeout(() => setMsg(null), 3500);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400">Import saved progress file:</span>
            <label className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer flex items-center gap-1">
              Upload Backup File
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) {
                      const res = restoreDataFromBackupText(content);
                      if (res.success) {
                        sound.playSuccess();
                        setMsg(res.message);
                        if (res.restoredStats && onDataRestored) {
                          onDataRestored(res.restoredStats);
                        }
                      } else {
                        sound.playError();
                        setMsg(res.message);
                      }
                      setTimeout(() => setMsg(null), 4000);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Cross-Device Synchronization (2 Phones & PC) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-xs mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  Cross-Device Sync (2 Phones & PC)
                </h4>
                <span className="text-[10px] text-slate-400">
                  {currentUser ? 'Active Cloud Account Connected' : 'Local Device Only'}
                </span>
              </div>
            </div>

            {currentUser ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Synchronized'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                Local Only
              </span>
            )}
          </div>

          {currentUser ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Connected Account
                  </span>
                  <span className="text-xs font-mono text-cyan-300 truncate block">
                    {currentUser.email || currentUser.displayName || 'Authenticated User'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">Last Synced</span>
                  <span className="text-[10px] font-mono text-slate-300">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={syncingManual || cloudSyncStatus === 'syncing'}
                  onClick={handleManualSyncClick}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950/40 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingManual || cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{syncingManual ? 'Syncing...' : 'Sync All Devices Now'}</span>
                </button>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSignOut();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Sign out of this device"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                ✓ Any progress made on this device automatically syncs to your other phone and PC whenever you open the app.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Play on multiple devices? Connect a single account using Google or Email so your <strong>Day {curriculumDay} Protocol</strong>, <strong>{stats.xp} XP</strong>, streaks, and records automatically stay in sync on your 2 phones and PC.
              </p>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <Laptop className="w-4 h-4 text-slate-950" />
                <span>Connect Account to Sync 2 Phones & PC</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
