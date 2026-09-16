import React, { useState, useEffect } from 'react';
import { GameMode, FlashSpeed } from '../types';
import { sound } from '../utils/audio';
import {
  loadFreeTrainingStats,
  recordFreeTrainingSession,
  FLASH_SPEED_OPTIONS,
} from '../utils/storage';
import {
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Brain,
  Grid3X3,
  Hash,
  Castle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Infinity,
  Sliders,
} from 'lucide-react';

interface FreeTrainingViewProps {
  curriculumDay: number;
  currentSpeed: FlashSpeed;
  onSpeedChange: (speed: FlashSpeed) => void;
  onNavigateMode: (mode: GameMode) => void;
  onStartStepWithConfig?: (mode: GameMode, config?: { level?: number; digits?: number; nBack?: number }) => void;
  onAddXp: (amount: number) => void;
}

export const FreeTrainingView: React.FC<FreeTrainingViewProps> = ({
  curriculumDay,
  currentSpeed,
  onSpeedChange,
  onNavigateMode,
  onStartStepWithConfig,
  onAddXp,
}) => {
  const [stats, setStats] = useState(() => loadFreeTrainingStats());
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [doomScrollDailyMinutes, setDoomScrollDailyMinutes] = useState(30);
  const [selectedCircuit, setSelectedCircuit] = useState<'sprint' | 'prefrontal' | 'full' | null>(null);
  const [circuitStepIndex, setCircuitStepIndex] = useState(0);

  // Custom step level selections for free training
  const [matrixLevelChoice, setMatrixLevelChoice] = useState(4);
  const [ayumuDigitsChoice, setAyumuDigitsChoice] = useState(7);
  const [nBackChoice, setNBackChoice] = useState(2);
  const [pegRangeChoice, setPegRangeChoice] = useState<'0-9' | '00-30' | '00-70' | '00-99'>('00-99');
  const [palaceLociChoice, setPalaceLociChoice] = useState(8);

  // Timer loop for free practice session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Periodic persistence of minutes practiced
  useEffect(() => {
    if (sessionSeconds > 0 && sessionSeconds % 60 === 0) {
      const updated = recordFreeTrainingSession(1, 1);
      setStats(updated);
      onAddXp(15); // Continuous training bonus XP
    }
  }, [sessionSeconds, onAddXp]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLaunchStep = (mode: GameMode, config?: { level?: number; digits?: number; nBack?: number }) => {
    sound.playClick();
    recordFreeTrainingSession(0, 1);
    if (onStartStepWithConfig) {
      onStartStepWithConfig(mode, config);
    } else {
      onNavigateMode(mode);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Hero Header: Free Training & Anti-Doom Scrolling Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/90 px-3 py-1 rounded-full border border-cyan-500/60 flex items-center gap-1.5 shadow-sm">
                <Infinity className="w-3.5 h-3.5 text-cyan-400" />
                Unrestricted Brain Gym
              </span>
              <span className="text-xs font-bold bg-amber-950/80 text-amber-300 px-3 py-1 rounded-full border border-amber-600/60 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                Anti-Doom Scrolling Dopamine Swap
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Train All Steps Freely in Your Downtime
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Don't let rigid 2-minute daily locks hold you back, and never surrender your free hours to mindless TikTok or Reels doom scrolling! 
              Train any of the 6 steps at any difficulty with unlimited repetitions whenever you have free time.
            </p>
          </div>

          {/* Active Live Session Counter */}
          <div className="bg-slate-950/90 border border-slate-800/90 p-4 sm:p-5 rounded-2xl flex flex-col items-center min-w-[220px] shadow-xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Active Free Practice Timer
            </span>
            <div className="text-3xl font-mono font-black text-cyan-400 tracking-wider my-1">
              {formatTimer(sessionSeconds)}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3" /> +15 XP Every Active Minute
            </div>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isTimerRunning
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? 'Pause Session' : 'Resume Session'}
              </button>
              <button
                onClick={() => setSessionSeconds(0)}
                title="Reset Session Timer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Practice Time</span>
            <span className="text-lg font-mono font-black text-white">
              {stats.totalMinutesPracticed + Math.floor(sessionSeconds / 60)} min
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Doom Scroll Time Saved</span>
            <span className="text-lg font-mono font-black text-emerald-400">
              ~{stats.doomScrollMinutesSaved + Math.round((sessionSeconds / 60) * 1.5)} min
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Free Reps</span>
            <span className="text-lg font-mono font-black text-cyan-300">
              {stats.totalRepsCompleted} Reps
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dopamine Balance</span>
            <span className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              High Focus
            </span>
          </div>
        </div>
      </div>

      {/* Neuroscience Insight: Why 1 Daily Level is NOT enough */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5 border border-indigo-500/40">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              Can You Build Super-Memory With Only 1 Daily Level?
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Cognitive Science Verdict
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              <strong>Short answer: No, you need deliberate free practice in your downtime.</strong> While the Daily Protocol acts as a structured daily test/checkpoint to maintain streaks, 
              true cognitive neuroplasticity requires <em>frequent, distributed stimulus</em>. Memory champions, speed-readers, and Grandmasters of Memory train across dozens of rounds per day in their spare moments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2 text-rose-300">
                <span className="text-base">❌</span>
                <div>
                  <strong className="text-white block">TikTok Doom Scrolling:</strong>
                  Passive, 10-second rapid context switching floods the brain with cheap dopamine, reducing working memory retention by up to 25% and degrading focus.
                </div>
              </div>

              <div className="flex items-start gap-2 text-emerald-300">
                <span className="text-base">✅</span>
                <div>
                  <strong className="text-white block">Free Memory Training:</strong>
                  Active flash drills (Matrix, Ayumu, Dual N-Back) force the visual cortex to generate real neural myelin, expanding iconic memory trace and fluid IQ.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Start Downtime Circuits (Perfect for 3-12 minute breaks) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              Quick-Start Downtime Circuits
            </h3>
            <p className="text-xs text-slate-400">
              Curated micro-workouts calibrated for when you have a 3, 7, or 12-minute break:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Circuit 1: 3-Min Sprint */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚡ 3 Minutes
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+100 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Anti-Scroll Micro Sprint</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Rapid neural reboot: 1 round Eidetic Matrix + 1 round Ayumu sequence + 1 round Major Pegs.
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Step 1: Matrix Flash (4x4)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Step 2: Ayumu Chimp (5 Digits)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" /> Step 4: Peg Conversions (10x)
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('eidetic-matrix', { level: 4 })}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> Start 3-Min Sprint
            </button>
          </div>

          {/* Circuit 2: 7-Min Prefrontal Gym */}
          <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  🧠 7 Minutes
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+200 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Prefrontal & Fluid IQ Gym</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Deep working memory boost: Dual N-Back (N=2/3) + Memory Palace Walkthrough + Spaced SM-2.
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Step 3: Dual N-Back (N=2 / 16 trials)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Step 5: Palace Villa (6 Loci)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Step 6: Spaced SM-2 Active Drill
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('dual-nback', { nBack: 2 })}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Start 7-Min Workout
            </button>
          </div>

          {/* Circuit 3: 12-Min Full Circuit */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  🏆 12 Minutes
                </span>
                <span className="text-[11px] text-slate-400 font-bold">+350 XP</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Grandmaster 6-Step Circuit</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                The ultimate full-brain circuit: Complete all 6 disciplines sequentially with uninterrupted focus.
              </p>
              <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> All 6 Steps In Sequence
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Unrestricted Level Progression
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Maximum Neuroplasticity ROI
                </div>
              </div>
            </div>
            <button
              onClick={() => handleLaunchStep('eidetic-matrix')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> Start Full 6-Step Circuit
            </button>
          </div>
        </div>
      </div>

      {/* ALL 6 COGNITIVE STEPS: FREE TRAINING LABORATORY */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Train All 6 Steps Freely • Custom Level Selectors
            </h3>
            <p className="text-xs text-slate-400">
              Pick your exact target difficulty and practice with zero daily lockout:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Eidetic Matrix */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Grid3X3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Step 1 of 6</span>
                    <h4 className="text-base font-bold text-white">Eidetic Matrix Recall</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                  Spatial Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Train your retinal after-image on 3x3 to 6x6 grids with customizable target numbers.
              </p>

              {/* Free Level Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Training Level (Unlocked):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 3, 5, 7, 9, 11, 14].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setMatrixLevelChoice(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        matrixLevelChoice === lvl
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Lvl {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('eidetic-matrix', { level: matrixLevelChoice })}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Train Matrix at Level {matrixLevelChoice}
            </button>
          </div>

          {/* Step 2: Ayumu Chimp Test */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Step 2 of 6</span>
                    <h4 className="text-base font-bold text-white">Ayumu Iconic Sequence</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                  Iconic Span
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Chimpanzee iconic memory speed test. Flash numbers across 40 cells and tap in ascending order.
              </p>

              {/* Free Digit Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Digits Count (Unlocked):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[4, 5, 6, 7, 8, 9, 10, 11].map((digits) => (
                    <button
                      key={digits}
                      onClick={() => setAyumuDigitsChoice(digits)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        ayumuDigitsChoice === digits
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {digits} Digits
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('ayumu-chimp', { digits: ayumuDigitsChoice })}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Train Ayumu at {ayumuDigitsChoice} Digits
            </button>
          </div>

          {/* Step 3: Dual N-Back */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Step 3 of 6</span>
                    <h4 className="text-base font-bold text-white">Dual N-Back Working Memory</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                  Fluid IQ
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Auditory + spatial simultaneous working memory. Proven by Jaeggi et al. to expand fluid intelligence.
              </p>

              {/* Free N Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select N-Back Depth (Unlocked):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((nVal) => (
                    <button
                      key={nVal}
                      onClick={() => setNBackChoice(nVal)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        nBackChoice === nVal
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      N = {nVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('dual-nback', { nBack: nBackChoice })}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Train Dual N-Back at N={nBackChoice}
            </button>
          </div>

          {/* Step 4: Major Pegs */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Step 4 of 6</span>
                    <h4 className="text-base font-bold text-white">Mnemonic Major Pegs</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-orange-300 font-mono">
                  Major System
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Convert numbers to vivid phonetic mental imagery (1=T/D, 4=R, 0=S/Z) at lightning reflex speed.
              </p>

              {/* Free Peg Range Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Peg Library Range:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '0-9', label: 'Single (0–9)' },
                    { id: '00-30', label: 'Teens (00–30)' },
                    { id: '00-70', label: 'Mid (00–70)' },
                    { id: '00-99', label: 'All 00–99' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPegRangeChoice(item.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        pegRangeChoice === item.id
                          ? 'bg-orange-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('mnemonic-pegs')}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Train Major Pegs Speed Drills
            </button>
          </div>

          {/* Step 5: Memory Palace */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Castle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Step 5 of 6</span>
                    <h4 className="text-base font-bold text-white">Memory Palace Villa</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                  Method of Loci
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Ancient Greek spatial encoding. Anchor high-dimensional items along architectural journeys.
              </p>

              {/* Free Loci Picker */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Loci Stations Count:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[4, 6, 8].map((loci) => (
                    <button
                      key={loci}
                      onClick={() => setPalaceLociChoice(loci)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        palaceLociChoice === loci
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {loci} Stations
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('memory-palace')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Train Memory Palace ({palaceLociChoice} Loci)
            </button>
          </div>

          {/* Step 6: Spaced Repetition SM-2 */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Step 6 of 6</span>
                    <h4 className="text-base font-bold text-white">Spaced Repetition SM-2</h4>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                  SuperMemo
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Active recall algorithms calculating optimal review intervals to guarantee permanent memory consolidation.
              </p>

              {/* Free Card Review Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Card Library Mode:
                </span>
                <span className="text-xs text-purple-300 font-medium">
                  Unlimited Continuous Flashcards Review
                </span>
              </div>
            </div>

            <button
              onClick={() => handleLaunchStep('spaced-repetition')}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Train Spaced SM-2 Cards
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Labs: Symbol Detective & Daily PQ Test */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Bonus Vision Lab</span>
            <h4 className="text-sm font-bold text-white">Symbol Detective Snapshot</h4>
            <p className="text-xs text-slate-400 mt-0.5">Rapid dual-channel shape & color extraction</p>
          </div>
          <button
            onClick={() => handleLaunchStep('symbol-detective')}
            className="py-2 px-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
          >
            Launch Lab
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Comprehensive Test</span>
            <h4 className="text-sm font-bold text-white">Full Photographic Quotient (PQ)</h4>
            <p className="text-xs text-slate-400 mt-0.5">Benchmark your overall mental quotient</p>
          </div>
          <button
            onClick={() => handleLaunchStep('daily-workout')}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm transition-all"
          >
            Take Test
          </button>
        </div>
      </div>

      {/* Doom Scrolling Screen Time Impact Calculator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold mb-3">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            Doom Scrolling Swap Calculator
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            If You Replace {doomScrollDailyMinutes} Minutes of Daily Scrolling With Free Training:
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Adjust the slider below to see how much cognitive myelination you forge over 30 days:
          </p>

          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={doomScrollDailyMinutes}
            onChange={(e) => setDoomScrollDailyMinutes(Number(e.target.value))}
            className="w-full max-w-md mx-auto h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-6"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">In 30 Days</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {doomScrollDailyMinutes * 30} Min
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">of Active Focus</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Visual Retinal Flashes</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ~{(doomScrollDailyMinutes * 30 * 2.5).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Eidetic Snaps</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">XP Progression</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                +{(doomScrollDailyMinutes * 30 * 25).toLocaleString()} XP
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Grandmaster Rank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
