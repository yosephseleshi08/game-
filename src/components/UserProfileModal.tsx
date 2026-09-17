import React, { useState } from 'react';
import { UserProfile, UserStats, FlashSpeed } from '../types';
import {
  AVATAR_PRESETS,
  getAvatarPreset,
} from '../utils/avatars';
import { saveLocalProfile } from '../utils/storage';
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
}) => {
  const [username, setUsername] = useState(profile?.username || 'Memory Athlete');
  const [selectedPresetId, setSelectedPresetId] = useState(profile?.avatarPresetId || 'ayumu');
  const [customPhotoUrl, setCustomPhotoUrl] = useState(
    profile?.photoUrl && profile.photoUrl.startsWith('http') ? profile.photoUrl : ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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

        {/* Offline Solo Storage Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 mb-5 flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-200 font-semibold block">100% Offline & Private</span>
            Your daily protocol completions, streaks, and progress records are saved directly to this device's local storage. No logins, accounts, or internet connection required.
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
