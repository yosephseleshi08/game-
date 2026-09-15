import React, { useState, useEffect, useRef } from 'react';
import { ambientAudio } from '../utils/ambientAudio';
import { Headphones, Volume2, VolumeX, Play, Pause, Waves, Sparkles, ChevronDown } from 'lucide-react';

type SoundscapeOption = {
  id: 'brown-noise' | 'alpha-10hz' | 'theta-6hz' | 'gamma-40hz';
  name: string;
  category: 'Noise' | 'Binaural Beat';
  frequency?: string;
  description: string;
  bestFor: string;
};

const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: 'brown-noise',
    name: 'Deep Brown Noise',
    category: 'Noise',
    description: 'Deep, warm low-pass acoustic waterfall',
    bestFor: 'Silences inner chatter & suppresses subvocalization',
  },
  {
    id: 'alpha-10hz',
    name: 'Alpha Flow (10 Hz)',
    category: 'Binaural Beat',
    frequency: '10 Hz (200Hz L / 210Hz R)',
    description: 'Calm, effortless alertness & relaxed focus',
    bestFor: 'Extended Dual N-Back & Matrix Flash sessions',
  },
  {
    id: 'theta-6hz',
    name: 'Theta Consolidation (6 Hz)',
    category: 'Binaural Beat',
    frequency: '6 Hz (150Hz L / 156Hz R)',
    description: 'Deep associative memory & spatial immersion',
    bestFor: 'Memory Palace walkthroughs & Major System pegs',
  },
  {
    id: 'gamma-40hz',
    name: 'Gamma Peak Focus (40 Hz)',
    category: 'Binaural Beat',
    frequency: '40 Hz (200Hz L / 240Hz R)',
    description: 'High-speed cognitive binding & acute problem solving',
    bestFor: 'Rapid-fire Chimp & speed recall tests',
  },
];

export const AmbientSoundscapePlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggleSoundscape = (option: SoundscapeOption) => {
    if (activeSoundscape === option.id) {
      ambientAudio.stop();
      setActiveSoundscape(null);
    } else {
      if (option.id === 'brown-noise') {
        ambientAudio.playBrownNoise();
      } else if (option.id === 'alpha-10hz') {
        ambientAudio.playBinauralBeat(200, 10, 'alpha-10hz');
      } else if (option.id === 'theta-6hz') {
        ambientAudio.playBinauralBeat(150, 6, 'theta-6hz');
      } else if (option.id === 'gamma-40hz') {
        ambientAudio.playBinauralBeat(200, 40, 'gamma-40hz');
      }
      ambientAudio.setVolume(volume);
      setActiveSoundscape(option.id);
    }
  };

  const handleStop = () => {
    ambientAudio.stop();
    setActiveSoundscape(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    ambientAudio.setVolume(newVol);
  };

  const currentOption = SOUNDSCAPE_OPTIONS.find((s) => s.id === activeSoundscape);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-sm ${
          activeSoundscape
            ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 ring-1 ring-cyan-400/30'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
        title="Ambient Soundscapes (Brown Noise & Binaural Beats for Flow State)"
      >
        <Headphones className={`w-3.5 h-3.5 ${activeSoundscape ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">
          {activeSoundscape ? currentOption?.name.split(' ')[0] : 'Flow Audio'}
        </span>
        {activeSoundscape && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 text-slate-100 ring-1 ring-cyan-500/20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Flow State Soundscapes
              </span>
            </div>
            {activeSoundscape && (
              <button
                onClick={handleStop}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Pause className="w-3 h-3" /> Stop
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Use headphones for Binaural Beats. Generates continuous acoustic frequencies designed to drown out distractions and lock in deep cognitive flow.
          </p>

          {/* Soundscape List */}
          <div className="space-y-2 mb-4">
            {SOUNDSCAPE_OPTIONS.map((opt) => {
              const isSelected = activeSoundscape === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggleSoundscape(opt)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {opt.name}
                      </span>
                      {opt.frequency && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                          {opt.frequency}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{opt.description}</p>
                    <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      {opt.bestFor}
                    </p>
                  </div>

                  <button
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
