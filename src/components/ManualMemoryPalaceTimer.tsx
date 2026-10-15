import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Castle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Brain,
  Compass,
  Maximize2,
  Minimize2,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';
import { MemoryPalaceTimerState } from '../types';

interface ManualMemoryPalaceTimerProps {
  timerState?: MemoryPalaceTimerState;
  onUpdateTimer: (updated: MemoryPalaceTimerState) => void;
  onComplete: () => void;
  onAddXp: (amount: number) => void;
  curriculumDay: number;
}

export const ManualMemoryPalaceTimer: React.FC<ManualMemoryPalaceTimerProps> = ({
  timerState,
  onUpdateTimer,
  onComplete,
  onAddXp,
  curriculumDay,
}) => {
  const TOTAL_TARGET_SECONDS = 3600; // 60 Minutes

  const [remainingSeconds, setRemainingSeconds] = useState(
    timerState?.remainingSeconds !== undefined ? timerState.remainingSeconds : TOTAL_TARGET_SECONDS
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(
    timerState?.elapsedSeconds !== undefined ? timerState.elapsedSeconds : 0
  );
  // Always initialize isRunning to false so the countdown never starts on its own
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(timerState?.isCompleted));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState<'walk' | 'sensory' | 'reverse' | 'speed'>('walk');

  // Ambient sound synthesizer
  const [isAlphaSoundOn, setIsAlphaSoundOn] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Sync state if prop changes from parent (e.g. cloud sync)
  useEffect(() => {
    if (timerState) {
      if (timerState.remainingSeconds !== undefined && Math.abs(timerState.remainingSeconds - remainingSeconds) > 3) {
        setRemainingSeconds(timerState.remainingSeconds);
      }
      if (timerState.elapsedSeconds !== undefined && Math.abs(timerState.elapsedSeconds - elapsedSeconds) > 3) {
        setElapsedSeconds(timerState.elapsedSeconds);
      }
      if (timerState.isCompleted !== undefined && timerState.isCompleted !== isCompleted) {
        setIsCompleted(timerState.isCompleted);
      }
    }
  }, [timerState]);

  // Main countdown timer interval
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prevRem) => {
        if (prevRem <= 1) {
          // Timer finished!
          clearInterval(interval);
          handleFinish60Minutes();
          return 0;
        }
        return prevRem - 1;
      });

      setElapsedSeconds((prevEl) => {
        const nextElapsed = prevEl + 1;
        // Award +10 XP every 5 minutes (300 seconds)
        if (nextElapsed % 300 === 0) {
          onAddXp(15);
        }
        return nextElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isCompleted]);

  // Periodically save state up to parent
  useEffect(() => {
    onUpdateTimer({
      remainingSeconds,
      elapsedSeconds,
      isRunning,
      isCompleted,
    });
  }, [remainingSeconds, elapsedSeconds, isRunning, isCompleted]);

  const handleFinish60Minutes = () => {
    setIsRunning(false);
    setIsCompleted(true);
    setRemainingSeconds(0);
    setElapsedSeconds(TOTAL_TARGET_SECONDS);

    sound.playMilestoneFanfare();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }

    onAddXp(500); // 500 XP Milestone reward
    onComplete();
    stopAlphaDrone();
  };

  const toggleTimer = () => {
    sound.playClick();
    if (isCompleted) return;
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (nextRunning && isAlphaSoundOn) {
      startAlphaDrone();
    } else {
      stopAlphaDrone();
    }
  };

  const handleConfirmReset = () => {
    sound.playClick();
    setIsRunning(false);
    setIsCompleted(false);
    setRemainingSeconds(TOTAL_TARGET_SECONDS);
    setElapsedSeconds(0);
    setShowResetConfirm(false);
    stopAlphaDrone();
  };

  // Gentle procedural Alpha wave binaural / drone (10Hz alpha pulse on 136.1Hz Om carrier)
  const startAlphaDrone = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      stopAlphaDrone();

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(136.1, ctx.currentTime); // Earth / Om resonance

      // Gentle pulsating amplitude at 10Hz (Alpha brainwave frequency for eidetic recall)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(10, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
      lfo.connect(lfoGain.gain);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      // Audio fallback
    }
  };

  const stopAlphaDrone = () => {
    try {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const toggleAlphaSound = () => {
    sound.playClick();
    const next = !isAlphaSoundOn;
    setIsAlphaSoundOn(next);
    if (next && isRunning) {
      startAlphaDrone();
    } else {
      stopAlphaDrone();
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAlphaDrone();
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((elapsedSeconds / TOTAL_TARGET_SECONDS) * 100));

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur w-full max-w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto'
          : 'bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-900/90 border-amber-500/30 p-4 sm:p-6 shadow-2xl'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Castle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Mandatory Step 4
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                1 Hour (60 Min)
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-white mt-0.5 truncate">
              Manual Memory Palace Focus Timer
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Alpha Soundscape Button */}
          <button
            onClick={toggleAlphaSound}
            className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isAlphaSoundOn
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 10Hz Alpha Brainwave Ambiance Drone"
          >
            {isAlphaSoundOn ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] sm:text-xs">Alpha Tone</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Zen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Digital Clock & Circular Gauge */}
      <div className="flex flex-col items-center justify-center my-2 sm:my-4 relative z-10 w-full">
        <div
          onClick={toggleTimer}
          className={`relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 group ${
            !isCompleted ? 'hover:scale-[1.02]' : ''
          }`}
          title={isCompleted ? '60-Minute Focus Completed' : isRunning ? 'Click to Pause' : 'Click to Start 1h Countdown'}
        >
          {/* Circular SVG Progress Ring */}
          <svg className="w-44 h-44 sm:w-60 sm:h-60 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              className="stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              className={`transition-all duration-500 ${
                isCompleted
                  ? 'stroke-emerald-400'
                  : isRunning
                  ? 'stroke-amber-400'
                  : 'stroke-amber-500/60'
              }`}
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 95}
              strokeDashoffset={2 * Math.PI * 95 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time text centered inside gauge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            {isCompleted ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-1.5 sm:mb-2">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="text-[10px] sm:text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                  60m Done
                </span>
                <span className="text-base sm:text-xl font-black text-white mt-0.5">Mastered</span>
              </div>
            ) : (
              <>
                <span className="text-[9px] sm:text-xs uppercase font-mono tracking-widest text-slate-400 mb-0.5 sm:mb-1 group-hover:text-amber-300 transition-colors">
                  {isRunning ? '⏳ Click to Pause' : '▶️ Click to Start'}
                </span>
                <span className="text-3xl sm:text-5xl font-mono font-black text-white tracking-tight drop-shadow-md group-hover:text-amber-200 transition-colors">
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-300/80 font-mono mt-0.5 sm:mt-1 font-bold">
                  {formatTime(elapsedSeconds)} / 60:00 ({progressPercent}%)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 w-full max-w-xs justify-center">
          {!isCompleted ? (
            <>
              <button
                id="memory-palace-play-pause-btn"
                onClick={toggleTimer}
                className={`flex-1 px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-all ${
                  isRunning
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
                    <span>{elapsedSeconds > 0 ? 'Resume' : 'Start 1h Timer'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={elapsedSeconds === 0}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Reset timer to 60:00"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          ) : (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1-Hour Palace Mastered for Day {curriculumDay}!</span>
            </div>
          )}
        </div>
      </div>

      {/* Offline Mental Practice Guidance Tabs */}
      <div className="mt-8 border-t border-slate-800/80 pt-5 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            Sit-Down Mental Guidance
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Close eyes & traverse loci
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <button
            onClick={() => setActivePromptTab('walk')}
            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
              activePromptTab === 'walk'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            🏛️ 1. Loci Route
          </button>
          <button
            onClick={() => setActivePromptTab('sensory')}
            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
              activePromptTab === 'sensory'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            🎨 2. Multi-Sensory
          </button>
          <button
            onClick={() => setActivePromptTab('reverse')}
            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
              activePromptTab === 'reverse'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            🔄 3. Reverse Walk
          </button>
          <button
            onClick={() => setActivePromptTab('speed')}
            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
              activePromptTab === 'speed'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            ⚡ 4. Random Index
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          {activePromptTab === 'walk' && (
            <p>
              <strong>Sequential Route Traversal:</strong> Mentally walk through your primary memory palace (your home, school, or favorite park). Visit every locus one by one in fixed order. Check that each locus has sharp boundaries and unmistakable identity.
            </p>
          )}
          {activePromptTab === 'sensory' && (
            <p>
              <strong>Multi-Sensory Peg Binding:</strong> Attach your Major System peg objects (e.g. 01=Tea, 14=Tire, 21=Net) to the loci. Do not just see them: feel their temperature, hear the friction, smell the rubber or smoke, and make interactions absurdly large.
            </p>
          )}
          {activePromptTab === 'reverse' && (
            <p>
              <strong>Reverse Traversal (Bidirectional RAM):</strong> Start from the final locus (e.g. Locus 20 or 50) and walk backwards to Locus 1. True photographic retrieval must never be a one-way conveyor belt; reverse walking verifies synaptic permanence.
            </p>
          )}
          {activePromptTab === 'speed' && (
            <p>
              <strong>Random Loci Indexing:</strong> Pick random peg numbers (e.g. 7, 18, 33) and instantly flash your mind's eye to that exact room without sequential walking. This transforms working memory into high-speed indexed RAM.
            </p>
          )}
        </div>
      </div>

      {/* Safety Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h4 className="text-base font-bold text-white mb-2">
              Reset Memory Palace Timer?
            </h4>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              You have completed {formatTime(elapsedSeconds)} of your 1-Hour manual focus session today. Resetting will set the clock back to 60:00.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Reset to 60:00
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
