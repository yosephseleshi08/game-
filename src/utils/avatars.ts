// Preset avatar styles for solo memory athlete profiles
export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  textColor: string;
  tag: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'yosi-prime', name: 'Yosi (The Architect)', emoji: '👑', bgGradient: 'from-cyan-500 to-indigo-600', textColor: 'text-cyan-300', tag: 'Created for Yoseph' },
  { id: 'yosi-pegs', name: 'Yosi (Major Pegs Master)', emoji: '🔑', bgGradient: 'from-amber-500 to-orange-600', textColor: 'text-amber-300', tag: 'Data Keys (20m)' },
  { id: 'yosi-nback', name: 'Yosi (Dual N-Back Buffer)', emoji: '🧠', bgGradient: 'from-sky-500 to-blue-700', textColor: 'text-sky-300', tag: 'Speaking Focus (20m)' },
  { id: 'yosi-detective', name: 'Yosi (Symbol Detective)', emoji: '⚡', bgGradient: 'from-purple-500 to-pink-600', textColor: 'text-purple-300', tag: 'Script Speed (20m)' },
  { id: 'yosi-eidetic', name: 'Yosi (Photographic Trace)', emoji: '👁️', bgGradient: 'from-emerald-500 to-teal-700', textColor: 'text-emerald-300', tag: 'Eidetic Grandmaster' },
  { id: 'ayumu', name: 'Yosi (Ayumu Flash)', emoji: '🐵', bgGradient: 'from-amber-500 to-orange-600', textColor: 'text-amber-300', tag: 'Chimp Benchmark' },
  { id: 'palace', name: 'Yosi (Loci Architect)', emoji: '🏛️', bgGradient: 'from-indigo-500 to-purple-700', textColor: 'text-indigo-300', tag: 'Method of Loci' },
  { id: 'zen', name: 'Yosi (Alpha Wave)', emoji: '🧘', bgGradient: 'from-teal-500 to-emerald-700', textColor: 'text-teal-300', tag: 'Deep Focus' },
];

export function getAvatarPreset(presetId?: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === presetId) || AVATAR_PRESETS[0];
}
