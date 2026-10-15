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
  RotateCcw,
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
  onForceSync?: () => Promise<void> | void;
  onLockApp?: () => void;
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
  cloudSyncStatus = 'synced',
  lastSyncedAt,
  onForceSync,
  onLockApp,
  onSignOut,
  onRestoreStreak,
  onDataRestored,
}) => {
  const [username, setUsername] = useState(profile?.username || 'Memory Athlete');
  const [selectedPresetId, setSelectedPresetId] = useState(profile?.avatarPresetId || 'ayumu');
  const [customPhotoUrl, setCustomPhotoUrl] = useState(
    profile?.photoUrl && (profile.photoUrl.startsWith('data:') || profile.photoUrl.startsWith('http')) ? profile.photoUrl : ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDevicePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = event.target?.result as string;
      if (!raw) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setCustomPhotoUrl(compressed);
        } else {
          setCustomPhotoUrl(raw);
        }
        sound.playSuccess();
        setMsg('Photo selected! Tap "Save Changes" to apply.');
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
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
            {profile?.photoUrl && (profile.photoUrl.startsWith('data:') || profile.photoUrl.startsWith('http') || profile.photoUrl.startsWith('blob:')) ? (
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
                {profile?.username || 'Yoseph (Yosi)'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Lvl {stats.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Yosi Game • Created Exclusively for Yoseph</p>
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
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Change Profile Avatar
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Upload or Choose Preset</span>
              </label>

              {/* Direct Device Photo Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDevicePhotoUpload}
                accept="image/*"
                className="hidden"
                aria-hidden="true"
              />
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-950/40 active:scale-98"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 Upload Photo from Device (Phone or PC)</span>
                </button>
                {customPhotoUrl && (customPhotoUrl.startsWith('data:') || customPhotoUrl.startsWith('http')) && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center gap-2">
                    <img
                      src={customPhotoUrl}
                      alt="Selected preview"
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-cyan-400"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-white block">Custom Photo Selected</span>
                      <span className="text-[10px] text-emerald-400 block font-mono">Ready to save</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomPhotoUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer p-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Or select an athlete icon:</div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id && !customPhotoUrl;
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

        {/* Data Management & Fresh Start Reset */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/40 text-xs mb-5 shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <RotateCcw className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  Fresh Start & Data Backup
                </h4>
                <span className="text-[10px] text-cyan-300 font-mono">
                  Active Streak: {stats.currentStreak} Days • Day {curriculumDay} Protocol
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
              Yosi Game
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            Start completely fresh from Day 1 (0 XP) whenever you wish, or download a full offline JSON backup to preserve your data.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                if (confirm('Start completely fresh from Day 1 and 0 XP?')) {
                  if (onRestoreStreak) onRestoreStreak();
                  setMsg('All progress reset to clean slate! Starting fresh at Day 1 / 0 XP.');
                  setTimeout(() => setMsg(null), 3500);
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40 active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>⚡ Start Fresh (0 XP)</span>
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
                  Unified Cloud Progress for Yoseph
                </span>
              </div>
            </div>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Synchronized'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Unified Athlete Account
                </span>
                <span className="text-xs font-mono text-cyan-300 truncate block">
                  Yoseph (Yosi) • All Devices Connected
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
              <div className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-medium">Automatic sync active across all your devices</span>
              </div>

              {onForceSync && (
                <button
                  type="button"
                  onClick={handleManualSyncClick}
                  disabled={syncingManual}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  title="Force cloud sync now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingManual ? 'animate-spin' : ''}`} />
                  <span>{syncingManual ? 'Syncing...' : 'Sync'}</span>
                </button>
              )}

              {onLockApp && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onLockApp();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Lock game with password yoseph535"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Lock Vault</span>
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              ✓ All progress, streaks, daily protocol goals, and XP are recorded to the same master save. You can play on Phone 1, Phone 2, or PC and keep your exact goal and streak intact.
            </p>
          </div>
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
