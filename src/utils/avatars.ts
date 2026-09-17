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
