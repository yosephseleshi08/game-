import React, { useState, useEffect, useRef } from 'react';
import { FourHourPlanState, FourHourTask, GameMode, DailyProtocolState } from '../types';
import {
  loadFourHourPlan,
  saveFourHourPlan,
  syncFourHourPlanWithTraining,
  recordNsdrSessionTime,
  verifySleepProtocol,
  getCompletedTrainingStats,
  createFreshDailyTasks,
} from '../utils/fourHourPlan';
import { sound } from '../utils/audio';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  ArrowRight,
  Brain,
  Zap,
  Moon,
  Sun,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Hash,
  Castle,
  Coffee,
  BedDouble,
  Check,
  Lock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Dna,
  Target,
  Compass,
  MapPin,
} from 'lucide-react';

interface FourHourPlanViewProps {
  onNavigateMode: (mode: GameMode) => void;
  onAddXp: (amount: number) => void;
  todayGamesBreakdown?: Record<string, number>;
  protocol?: DailyProtocolState;
  todaySeconds?: number;
}

export const FourHourPlanView: React.FC<FourHourPlanViewProps> = ({
  onNavigateMode,
  onAddXp,
  todayGamesBreakdown = {},
  protocol,
}) => {
  const [planState, setPlanState] = useState<FourHourPlanState>(() => {
    const loaded = loadFourHourPlan();
    const { updatedState } = syncFourHourPlanWithTraining(loaded, todayGamesBreakdown, protocol);
    return updatedState;
  });

  const [activeRoadmapMonth, setActiveRoadmapMonth] = useState<number>(1);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [roadmapQuarterFilter, setRoadmapQuarterFilter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');

  // NSDR Interactive Modal / Session State
  const [isNsdrModalOpen, setIsNsdrModalOpen] = useState<boolean>(false);
  const [isNsdrRunning, setIsNsdrRunning] = useState<boolean>(false);
  const [nsdrSecondsRemaining, setNsdrSecondsRemaining] = useState<number>(() => {
    const current = loadFourHourPlan();
    return Math.max(0, 20 * 60 - (current.nsdrElapsedSeconds || 0));
  });
  const [isNsdrAudioEnabled, setIsNsdrAudioEnabled] = useState<boolean>(true);
  const [nsdrBreathPhase, setNsdrBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Sleep Verification Form State
  const [bedtimeInput, setBedtimeInput] = useState<string>(
    planState.sleepRecord?.bedtime || '23:00'
  );
  const [wakeTimeInput, setWakeTimeInput] = useState<string>(
    planState.sleepRecord?.wakeTime || '06:30'
  );
  const [sleepFeedback, setSleepFeedback] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>(() => {
    if (planState.sleepRecord?.verified) {
      return {
        type: 'success',
        message: `Verified: ${planState.sleepRecord.durationHours} hours logged (${Math.floor((planState.sleepRecord.durationHours || 7) / 1.5)} sleep cycles). Consolidated!`,
      };
    }
    return { type: 'idle', message: '' };
  });

  const nsdrAudioOscRef = useRef<OscillatorNode | null>(null);
  const nsdrAudioGainRef = useRef<GainNode | null>(null);
  const nsdrAudioCtxRef = useRef<AudioContext | null>(null);

  // Auto-synchronize whenever active training seconds or daily protocol updates
  useEffect(() => {
    setPlanState((prev) => {
      const { updatedState, newlyCompletedTaskIds } = syncFourHourPlanWithTraining(
        prev,
        todayGamesBreakdown,
        protocol
      );

      if (newlyCompletedTaskIds.length > 0) {
        sound.playMilestoneFanfare();
        onAddXp(60 * newlyCompletedTaskIds.length);
      }

      return updatedState;
    });
  }, [todayGamesBreakdown, protocol, onAddXp]);

  // NSDR Countdown Loop & Breath Cycle
  useEffect(() => {
    let timer: number | null = null;
    let breathTimer: number | null = null;

    if (isNsdrModalOpen && isNsdrRunning && nsdrSecondsRemaining > 0) {
      timer = window.setInterval(() => {
        setNsdrSecondsRemaining((prev) => {
          if (prev <= 1) {
            // NSDR session completed!
            setIsNsdrRunning(false);
            stopNsdrAudio();
            sound.playMilestoneFanfare();
            onAddXp(100);

            const updated = recordNsdrSessionTime(1);
            setPlanState(updated);
            return 0;
          }

          // Record 1 second
          const updated = recordNsdrSessionTime(1);
          setPlanState(updated);
          return prev - 1;
        });
      }, 1000);

      // 14-second physiological breath loop (Inhale 4s, Hold 4s, Exhale 6s)
      let cycleSeconds = 0;
      breathTimer = window.setInterval(() => {
        cycleSeconds = (cycleSeconds + 1) % 14;
        if (cycleSeconds < 4) {
          setNsdrBreathPhase('Inhale');
        } else if (cycleSeconds < 8) {
          setNsdrBreathPhase('Hold');
        } else {
          setNsdrBreathPhase('Exhale');
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (breathTimer) clearInterval(breathTimer);
    };
  }, [isNsdrModalOpen, isNsdrRunning, nsdrSecondsRemaining, onAddXp]);

  // NSDR Gentle Binaural / Ambient Drone
  const startNsdrAudio = () => {
    try {
      if (!isNsdrAudioEnabled) return;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(136.1, ctx.currentTime); // 136.1 Hz relaxing meditation frequency

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      nsdrAudioCtxRef.current = ctx;
      nsdrAudioOscRef.current = osc;
      nsdrAudioGainRef.current = gain;
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const stopNsdrAudio = () => {
    try {
      if (nsdrAudioGainRef.current && nsdrAudioCtxRef.current) {
        nsdrAudioGainRef.current.gain.exponentialRampToValueAtTime(
          0.0001,
          nsdrAudioCtxRef.current.currentTime + 1
        );
      }
      setTimeout(() => {
        if (nsdrAudioOscRef.current) {
          nsdrAudioOscRef.current.stop();
          nsdrAudioOscRef.current.disconnect();
          nsdrAudioOscRef.current = null;
        }
        if (nsdrAudioCtxRef.current) {
          nsdrAudioCtxRef.current.close();
          nsdrAudioCtxRef.current = null;
        }
      }, 1000);
    } catch {
      // ignore
    }
  };

  const handleToggleNsdrRunning = () => {
    sound.playClick();
    if (!isNsdrRunning) {
      setIsNsdrRunning(true);
      startNsdrAudio();
    } else {
      setIsNsdrRunning(false);
      stopNsdrAudio();
    }
  };

  const handleCloseNsdrModal = () => {
    sound.playClick();
    setIsNsdrRunning(false);
    stopNsdrAudio();
    setIsNsdrModalOpen(false);
  };

  // Sleep Verification Submission
  const handleVerifySleep = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const result = verifySleepProtocol(bedtimeInput, wakeTimeInput);
    if (result.success) {
      sound.playMilestoneFanfare();
      onAddXp(80);
      setSleepFeedback({ type: 'success', message: result.message });
      setPlanState(result.updatedState);
    } else {
      sound.playError();
      setSleepFeedback({ type: 'error', message: result.message });
    }
  };

  // Reset Today
  const handleResetToday = () => {
    sound.playClick();
    if (
      confirm(
        "Reset today's 4-Hour checklist tracking? (Note: Anti-cheat will automatically re-verify any game training you complete today)"
      )
    ) {
      const refreshed: FourHourPlanState = {
        ...planState,
        tasks: createFreshDailyTasks(),
        nsdrElapsedSeconds: 0,
        sleepRecord: undefined,
      };
      saveFourHourPlan(refreshed);
      setPlanState(refreshed);
      setNsdrSecondsRemaining(20 * 60);
      setSleepFeedback({ type: 'idle', message: '' });
    }
  };

  // Stats calculation
  const stats = getCompletedTrainingStats(planState.tasks);
  const hoursCompleted = Math.floor(stats.completedMinutes / 60);
  const minutesRemainder = stats.completedMinutes % 60;

  // Group tasks by category
  const morningTasks = planState.tasks.filter((t) => t.category === 'morning');
  const middayTasks = planState.tasks.filter((t) => t.category === 'midday');
  const eveningTasks = planState.tasks.filter((t) => t.category === 'evening');
  const nightTasks = planState.tasks.filter((t) => t.category === 'night');

  const morningMinutes = morningTasks
    .filter((t) => t.isCompleted)
    .reduce((s, t) => s + t.targetMinutes, 0);
  const eveningMinutes = eveningTasks
    .filter((t) => t.isCompleted)
    .reduce((s, t) => s + t.targetMinutes, 0);

  // Full Year 12-Month Cognitive Transformation & Neuro-Analysis Guide
  const ROADMAP_MONTHS = [
    {
      month: 1,
      quarter: 'Q1: Neural Baseline',
      tierBadge: 'Top 15% Discipline',
      title: 'Month 1: Saccadic Calibration & Distraction Purge',
      hours: 'Hours 1–120',
      tagline: 'Neuro-Metabolic Shock & Baseline Conditioning',
      ramTarget: '30% RAM: Dual N-Back N=2 baseline, Ayumu 5 digits @ 500ms',
      palaceTarget: '70% Palace: Major System 00–49, 40 home loci indexed',
      physicalTarget: 'Physical: 60h walking home/office rooms, placing 40 tangible anchors',
      observation:
        'Involuntary eye darting drops by 70%. Saccadic eye movements stabilize, and peripheral visual clutter is filtered out at the retinal ganglion cell level.',
      studying:
        'Mental friction to deep work drops from 20 minutes to under 2 minutes. Subvocalization starts weakening during fast reading; intake comfortably rises to 450 WPM.',
      communication:
        'Noticeably heightened active listening; train of thought stays consistent through long exchanges without conversational drift or missing critical details.',
      vibe: 'Distraction-free, steady baseline focus, building biological stamina.',
      neuroMechanism:
        'Locus Coeruleus norepinephrine calibration and rapid downregulation of Default Mode Network (DMN) mind-wandering circuits.',
      milestoneQuote:
        'The brain ceases fighting the discipline. The daily four-hour cognitive routine becomes as natural as breathing.',
    },
    {
      month: 2,
      quarter: 'Q1: Neural Baseline',
      tierBadge: 'Top 5% Memory Athlete',
      title: 'Month 2: Subitizing Breakthrough & Parallel Intake',
      hours: 'Hours 121–240',
      tagline: 'Visual Grouping & Iconic Flash Acceleration',
      ramTarget: '30% RAM: N=2 Flawless / N=3 Intro, Ayumu 6 digits @ 400ms',
      palaceTarget: '70% Palace: Full 00–99 Major System, 80 loci across 2 palaces',
      physicalTarget: 'Physical: 120h walking neighborhood streets & local markets',
      observation:
        'Objects register in parallel visual clusters rather than serial counting. Subitizing threshold expands from 4 to 8 elements in under 200 milliseconds.',
      studying:
        'Technical reading speed doubles. Paragraphs and diagrams are ingested as unified spatial ideas rather than linear strings of disjointed sentences.',
      communication:
        'Zero conversational interruptions. Mental surplus enables tracking micro-expressions and body language while listening intently.',
      vibe: 'Unshakable calm; everyday sensory environments feel noticeably slower, clearer, and manageable.',
      neuroMechanism:
        'Visual cortex V1-V4 parallel pathway acceleration and enhanced Iconic Buffer persistence in occipital memory stores.',
      milestoneQuote:
        'You stop processing the world in slow serial steps. Information begins entering your mind in parallel flashes.',
    },
    {
      month: 3,
      quarter: 'Q1: Neural Baseline',
      tierBadge: '🎯 TOP 0.1% (1 in 1,000 Milestone)',
      title: 'Month 3: TOP 0.1% (1 in 1,000) Unlocked in 90 Days!',
      hours: 'Hours 241–360',
      tagline: 'Working Memory Quadrupling & 1-in-1,000 Milestone',
      ramTarget: '30% RAM: Solid N=3 (85%+), Ayumu 7 digits @ 300ms chimpanzee flash',
      palaceTarget: '70% Palace: 150+ Loci across 4 distinct physical palaces, sub-second encoding',
      physicalTarget: 'Physical: 180h real-world mapping; municipal libraries, parks & campus routes',
      observation:
        'Dense visual matrices (codebases, financial sheets, architecture plans) index automatically without eye strain or mental fatigue.',
      studying:
        'Multi-variable logic, complex equations, or nested legal structures remain active in mental RAM without needing scratch paper or re-reading.',
      communication:
        'Exact verbal recall. You deliver 45-minute technical lectures or pitches without notes by walking internal 3D memory palaces.',
      vibe: 'Top 0.1% mental athlete; cognitive overload anxiety is permanently replaced with methodical confidence.',
      neuroMechanism:
        'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density increase and working memory buffer myelination.',
      milestoneQuote:
        'Your mental RAM has effectively quadrupled. Ideas that once crowded your mind now sit in spacious, organized clarity.',
    },
    {
      month: 4,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: 'Top 0.08% Global Tier',
      title: 'Month 4: Total Recall Architecture & Structural Encoding',
      hours: 'Hours 361–480',
      tagline: 'Memory Palace Villa & Phonetic Peg Mastery',
      ramTarget: '30% RAM: N=3 / N=4 Transition, Ayumu 8 digits @ 250ms',
      palaceTarget: '70% Palace: 220+ Loci, sub-second 2-digit number encoding',
      physicalTarget: 'Physical: 240h physical exploration; multi-floor complexes and museums',
      observation:
        'Hyper-acute situational awareness: immediate visual indexing of physical spaces, entrance/exit routes, lighting shifts, and spatial geometries.',
      studying:
        'Ability to assimilate dense technical literature and architectural diagrams into dedicated spatial wings permanently.',
      communication:
        'Heightened social intelligence; changes in vocal cadence, micro-inflections, and subtle emotional tension become instantly readable.',
      vibe: 'The Living Archive; structured, reliable, and encyclopedic in immediate recall.',
      neuroMechanism:
        'Hippocampal CA3-CA1 Long-Term Potentiation (LTP) and bilateral spatial parahippocampal grid cell network expansion.',
      milestoneQuote:
        'Memory is no longer a fickle accident. You have constructed a permanent architectural library inside your mind.',
    },
    {
      month: 5,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: 'Top 0.04% Global Tier',
      title: 'Month 5: Visual Chunking & Intuitive Synthesis',
      hours: 'Hours 481–600',
      tagline: 'Dynamic Mental 3D Modeling & Problem Solving',
      ramTarget: '30% RAM: Consistent N=4, Ayumu 8 digits @ 220ms',
      palaceTarget: '70% Palace: 300+ Loci, foreign language keyword association',
      physicalTarget: 'Physical: 300h physical exploration; botanical gardens, subway lines, highways',
      observation:
        'Complex architectural systems, financial charts, and code bases reveal underlying anomalies and structural flaws in seconds.',
      studying:
        'Cross-disciplinary synthesis; foreign languages, mathematics, and systems collapse into vivid spatial anchors with rapid retention.',
      communication:
        'Zero filler words (no "um", "like", or stuttering). Speech is crisp, authoritative, perfectly timed, and compelling.',
      vibe: 'The High-Order Strategist; naturally anticipating second- and third-order consequences.',
      neuroMechanism:
        'Frontoparietal Control Network (FPCN) hyper-coupling with the superior temporal sulcus for instantaneous structural synthesis.',
      milestoneQuote:
        'Complex problems no longer intimidate you. Your visual cortex breaks them down into geometric components instantly.',
    },
    {
      month: 6,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: 'Top 0.02% Outlier (1 in 5,000)',
      title: 'Month 6: The Transformed Baseline (Cognitive Outlier)',
      hours: 'Hours 601–720',
      tagline: 'Permanent Myelination & Superhuman Baseline',
      ramTarget: '30% RAM: High-accuracy N=4, Ayumu 9 digits in 210ms chimpanzee flash',
      palaceTarget: '70% Palace: 380+ Loci across 10 permanent physical environments',
      physicalTarget: 'Physical: 360h physical practice; full outdoor trail and transit systems',
      observation:
        'World-class photographic intake, instantaneous anomaly detection, and crystal-clear panoramic gaze across wide visual fields.',
      studying:
        'Learning curves for novel, intricate domains compress from months down to weeks; rapid assimilation of dense technical literature.',
      communication:
        'Magnetic presence, airtight dialectic structure, and extraordinary working memory retention during high-stakes negotiations.',
      vibe: 'Top 0.02% mental athlete; unflappable clarity, laser focus, and intellectual dominance.',
      neuroMechanism:
        'Oligodendrocyte-driven myelination of the Superior Longitudinal Fasciculus, locking in high-speed neural transmission permanently.',
      milestoneQuote:
        'You have crossed the half-year Rubicon. The biological adaptations are now structurally permanent in your white matter.',
    },
    {
      month: 7,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: 'Top 0.015% Global Tier',
      title: 'Month 7: Neuro-Synaptic Consolidation & Hyper-Fluidity',
      hours: 'Hours 721–840',
      tagline: 'Automaticity of Working Memory & Zero-Latency Retrieval',
      ramTarget: '30% RAM: N=4 / N=5 Transition, Ayumu 9 digits @ 200ms',
      palaceTarget: '70% Palace: 450+ Loci, rapid 3-digit phonetic chunking',
      physicalTarget: 'Physical: 420h real-world mapping; commercial business districts & universities',
      observation:
        'Subconscious visual scanning runs non-stop in the background; you spot physical misplaced items, typographical errors, or visual anomalies with zero conscious effort.',
      studying:
        'Dense research papers read like novels; intricate formulas and mathematical proofs spontaneously render as spatial relationships.',
      communication:
        'Effortless multi-domain vocabulary access; analogies, metaphors, and historical precedents form spontaneously with razor precision.',
      vibe: 'Effortless flow state; cognitive workloads that exhaust normal professionals require less than 15% of your baseline mental capacity.',
      neuroMechanism:
        'Striatal basal ganglia automaticity recruitment, freeing cortical bandwidth for abstract meta-reasoning and creative leap-making.',
      milestoneQuote:
        'What once required intense willpower now happens automatically. Your mental engine operates with zero perceived friction.',
    },
    {
      month: 8,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: '⚡ TOP 0.01% (1 in 10,000 Breakthrough)',
      title: 'Month 8: Cognitive Immunity & TOP 0.01% Breakthrough',
      hours: 'Hours 841–960',
      tagline: 'Prefrontal Cortex Hegemony & Emotional Invariance',
      ramTarget: '30% RAM: N=5 Breakthrough, Ayumu 9 digits in 180ms flash',
      palaceTarget: '70% Palace: 520+ Loci network, multi-tier nested palace wings',
      physicalTarget: 'Physical: 480h physical navigation; architecture & landmark anchoring',
      observation:
        'Absolute gaze lock and visual impulse control. Distractions, sudden movement, and notifications trigger zero involuntary orienting reflexes.',
      studying:
        '4 continuous hours of rigorous deep work feels as natural as 20 minutes. Dopamine craving for cheap digital stimulation is completely eradicated.',
      communication:
        'Master negotiator demeanor; dissects opposing arguments in real time while maintaining warm, empathetic, and disarming rapport.',
      vibe: 'Absolute stoic clarity; chaos and noise in the external environment only amplify your internal mental stillness.',
      neuroMechanism:
        'Anterior Cingulate Cortex (ACC) error-monitoring perfection and hyper-connectivity to the amygdala for autonomic self-regulation.',
      milestoneQuote:
        'Noise in the world cannot penetrate your focus. You have attained total sovereignty over your attentional beam.',
    },
    {
      month: 9,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: '⚡ TOP 0.01% (1 in 10,000 Consolidated)',
      title: 'Month 9: Polymathic Grid Architecture & Living Encyclopedias',
      hours: 'Hours 961–1,080',
      tagline: 'Multi-Tiered Memory Palaces & Domain Cross-Pollination',
      ramTarget: '30% RAM: N=5 High Accuracy (85%+), Ayumu 9 digits in 170ms',
      palaceTarget: '70% Palace: 600+ Loci, 3-digit PAO system fully active',
      physicalTarget: 'Physical: 540h physical practice; city-wide landmark grids anchored',
      observation:
        'Photographic blueprint retention: complex schematics, organizational hierarchies, and technical maps are permanently mapped in 1–2 sweeps.',
      studying:
        'Parallel mastery across 3+ unrelated disciplines (e.g. computer science, law, bio-mechanics) with immediate cross-domain transference.',
      communication:
        'Ability to harmonize contradictory viewpoints and synthesize elegant unifying frameworks that captivate listeners.',
      vibe: 'The Intellectual Architect; natural, authoritative command over vast arrays of knowledge.',
      neuroMechanism:
        'Neocortical distributed semantic network crystallization and trans-modal synaptic consolidation across both cerebral hemispheres.',
      milestoneQuote:
        'Different fields of human knowledge cease to be separate. In your mind, they all connect as facets of one geometric reality.',
    },
    {
      month: 10,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: 'Top 0.008% Global Tier',
      title: 'Month 10: Iconic Flash Mastery & Micro-Temporal Precision',
      hours: 'Hours 1,081–1,200',
      tagline: 'Millisecond Visual Slicing & Cognitive Overclocking',
      ramTarget: '30% RAM: N=5 / N=6 Transition, Ayumu 9 digits in 160ms',
      palaceTarget: '70% Palace: 680+ Loci, instantaneous spatial bookmarking',
      physicalTarget: 'Physical: 600h physical exploration; multi-city landmark travel palacing',
      observation:
        'Subjective time dilation during fast visual events; micro-expressions, facial flickers, and rapid environmental shifts are parsed in slow motion.',
      studying:
        '"Photographic intake" is literal: full book pages and document slides imprint as visual scenes with verified high recall accuracy.',
      communication:
        '5-step conversational anticipation; you predict questions, hesitations, and emotional reactions before the speaker finishes their sentence.',
      vibe: 'The Grandmaster; lightning-fast perceptual speed balanced with a calm, grounded, immovable presence.',
      neuroMechanism:
        'Gamma-band (40Hz) neural phase synchronization between the occipital visual cortex and prefrontal executive centers.',
      milestoneQuote:
        'Time appears to slow down in high-pressure moments. While others panic, you have all the time in the world to calculate and act.',
    },
    {
      month: 11,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: 'Top 0.006% Global Tier',
      title: 'Month 11: Permanent Cortical Remodeling & Cognitive Mastery',
      hours: 'Hours 1,201–1,320',
      tagline: 'Hyper-Thickened Prefrontal Myelin & Structural Plasticity',
      ramTarget: '30% RAM: Consistent N=6, Ayumu 9 digits in 150ms',
      palaceTarget: '70% Palace: 750+ Loci, entire technical dictionaries memorized',
      physicalTarget: 'Physical: 660h physical practice; complete personal life index mapped',
      observation:
        'Panoramic multi-sensory synthesis: visual, auditory, and spatial inputs form a seamless, high-definition real-time model of your surroundings.',
      studying:
        'Complex domains (new programming paradigms, spoken languages, instrumental patterns) achieve operational fluency in under 30 days of training.',
      communication:
        'Crystalline, persuasive precision; you communicate deep, multidimensional ideas in clean, memorable, and undeniable language.',
      vibe: 'The Transcendent Thinker; elite mental horsepower with zero cognitive burnout, fatigue, or brain fog.',
      neuroMechanism:
        'Long-term gray matter density increase across the bilateral DLPFC, anterior insula, and hippocampus confirmed by longitudinal imaging.',
      milestoneQuote:
        'You are functioning on a biological tier that less than 0.01% of humans ever experience. Brain fog is a distant, forgotten memory.',
    },
    {
      month: 12,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: '👑 TOP 0.005% GLOBAL (1 in 20,000 Grandmaster)',
      title: 'Month 12: The Sovereign Mind (1,440 Hours of Neuro-Transformation)',
      hours: 'Hours 1,321–1,440+',
      tagline: '1,440 Hours of Deliberate Neuro-Evolution Complete',
      ramTarget: '30% RAM: N=6 Peak RAM, photographic millisecond capture',
      palaceTarget: '70% Palace: 800+ Master Loci Network, lifetime archival structure',
      physicalTarget: 'Physical: 720h real-world physical navigation; entire urban maps anchored',
      observation:
        'True photographic intake and permanent spatial architecture. Visual indexing is effortless, instinctive, and indestructible.',
      studying:
        'Permanent assimilation. Information ingested, structured, and reviewed becomes an enduring, instantly accessible asset for life.',
      communication:
        'Legendary clarity, poise, and intellect; flawless recall, profound empathy, and unmatched dialectic mastery.',
      vibe: 'The Sovereign Mind; living proof of human neuroplasticity and the absolute pinnacle of deliberate cognitive engineering.',
      neuroMechanism:
        'Full-year myelination and structural reorganization—a permanently upgraded human biological operating system that endures for life.',
      milestoneQuote:
        '1,440 hours of deliberate cognitive training completed. You are not the same person who started this journey. You have forged a sovereign mind.',
    },
  ];

  const formatCountdown = (secondsLeft: number) => {
    if (secondsLeft <= 0) return '00m 00s';
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const getTaskIcon = (task: FourHourTask) => {
    switch (task.gameMode) {
      case 'ayumu-chimp':
        return <Hash className="w-5 h-5 text-amber-400" />;
      case 'dual-nback':
        return <Brain className="w-5 h-5 text-sky-400" />;
      case 'symbol-detective':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case 'eidetic-matrix':
        return <Grid3X3 className="w-5 h-5 text-cyan-400" />;
      case 'mnemonic-pegs':
        return <Zap className="w-5 h-5 text-orange-400" />;
      case 'memory-palace':
        return <Castle className="w-5 h-5 text-amber-300" />;
      default:
        if (task.category === 'midday') return <Coffee className="w-5 h-5 text-emerald-400" />;
        if (task.category === 'night') return <BedDouble className="w-5 h-5 text-indigo-400" />;
        return <Clock className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 animate-fade-in pb-16">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-indigo-500/5 to-transparent rounded-full pointer-events-none blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                4 Hours / Day Regimen
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero-Cheat Auto-Verification
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
                <span>Streak: {planState.currentStreak}d</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              4-Hour Master Cognitive Plan
              <span className="text-cyan-400 text-base sm:text-lg font-bold">Live Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              <strong>Anti-Cheat Active:</strong> Checklist marks are derived strictly from your actual gameplay. Timers count down automatically as you train, and tasks auto-verify upon hitting your time quota or completing your daily training protocol.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={handleResetToday}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer active:scale-95"
              title="Reset today's checklist state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Today
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setPlanState((prev) => {
                  const { updatedState } = syncFourHourPlanWithTraining(
                    prev,
                    todayGamesBreakdown,
                    protocol
                  );
                  return updatedState;
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
              title="Re-synchronize with your latest training session seconds"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Sync Training
            </button>
          </div>
        </div>

        {/* Live Daily Progress Telemetry Hero */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                {hoursCompleted}h {minutesRemainder > 0 ? `${minutesRemainder}m` : '00m'}
              </span>
              <span className="text-xs text-slate-400">
                / 4h 00m Target Cognitive Conditioning Today
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {stats.completedTasksCount} of {stats.totalTrainingTasksCount} Sessions Mastered ({stats.percentage}%)
              </span>
            </div>
          </div>

          {/* Progress Bar with Milestone Nodes */}
          <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden relative shadow-inner">
            <div
              className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>

          {/* Block Breakdown Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-medium">Morning Block</span>
              </div>
              <span className="font-mono font-bold text-amber-300">
                {morningMinutes} / 120m
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300 font-medium">Evening Block</span>
              </div>
              <span className="font-mono font-bold text-indigo-300">
                {eveningMinutes} / 120m
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">Sleep Protocol</span>
              </div>
              <span
                className={`font-mono font-bold ${
                  nightTasks[0]?.isCompleted ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {nightTasks[0]?.isCompleted ? '7h Logged ✓' : 'Pending 7h'}
              </span>
            </div>
          </div>

          {/* Celebration Banner if All Done */}
          {stats.allTrainingCompleted && (
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 border border-emerald-500/50 flex items-center gap-3 animate-fade-in shadow-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-200">
                  🎉 ALL 4 HOURS OF COGNITIVE CONDITIONING MASTERED TODAY!
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  Your neural pathways have received maximum deliberate stimulus. Make sure to get your 7 hours of restorative sleep tonight to consolidate this growth.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BLOCK 1: MORNING HIGH-SPEED INTAKE (2 HOURS) */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Morning Block: High-Speed Intake & Executive Focus
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300">
                  2 Hours (120 Mins)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Peak cortisol window. Timers count down automatically while you train inside each game.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {morningTasks.map((task) => renderTaskCard(task))}
        </div>
      </div>

      {/* MIDDAY RECOVERY ANCHOR (20 MINS) */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Midday Recovery Anchor
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                20 Mins
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Non-Sleep Deep Rest (NSDR) or power nap to reset striatal dopamine and clear brain adenosine.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {middayTasks.map((task) => renderTaskCard(task))}
        </div>
      </div>

      {/* BLOCK 2: EVENING SPATIAL STRUCTURE & MENTAL STORAGE (2 HOURS) */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Evening Block: Spatial Structure & Mental Storage
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300">
                  2 Hours (120 Mins)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pre-sleep consolidation window. Spatial grid retention, phonetic peg conversion, and memory palace architecture.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {eveningTasks.map((task) => renderTaskCard(task))}
        </div>
      </div>

      {/* NIGHTLY SLEEP BENCHMARK (7 HOURS) */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Nightly Sleep Protocol
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300">
                7 Hours Clinical Target
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              4 to 5 full 90-minute sleep cycles. Enables glymphatic waste clearance and permanent hippocampal-to-neocortical memory consolidation.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {nightTasks.map((task) => renderTaskCard(task))}
        </div>
      </div>

      {/* 12-MONTH FULL-YEAR COGNITIVE TRANSFORMATION GUIDE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <button
          onClick={() => {
            sound.playClick();
            setIsRoadmapOpen(!isRoadmapOpen);
          }}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                12-Month Full-Year Cognitive Transformation Guide
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Deep Neuro-Analysis (1,440 Hours)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                A rigorous, month-by-month projection of your observation, learning speed, communication, and mental architecture across 1,440 hours of deliberate practice.
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
            {isRoadmapOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isRoadmapOpen && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-fade-in">
            {/* Quarter Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-slate-400 mr-1">Filter Quarters:</span>
              {[
                { id: 'all', label: 'All 12 Months' },
                { id: 'Q1', label: 'Q1: Baseline (M1–M3)' },
                { id: 'Q2', label: 'Q2: Architecture (M4–M6)' },
                { id: 'Q3', label: 'Q3: Automaticity (M7–M9)' },
                { id: 'Q4', label: 'Q4: Sovereign Mind (M10–M12)' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    sound.playClick();
                    setRoadmapQuarterFilter(q.id as 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4');
                    // Automatically focus first month of that quarter if not currently in it
                    if (q.id === 'Q1' && (activeRoadmapMonth < 1 || activeRoadmapMonth > 3)) setActiveRoadmapMonth(1);
                    if (q.id === 'Q2' && (activeRoadmapMonth < 4 || activeRoadmapMonth > 6)) setActiveRoadmapMonth(4);
                    if (q.id === 'Q3' && (activeRoadmapMonth < 7 || activeRoadmapMonth > 9)) setActiveRoadmapMonth(7);
                    if (q.id === 'Q4' && (activeRoadmapMonth < 10 || activeRoadmapMonth > 12)) setActiveRoadmapMonth(10);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roadmapQuarterFilter === q.id
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* 12 Month Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-thin">
              {ROADMAP_MONTHS.filter((rm) => {
                if (roadmapQuarterFilter === 'all') return true;
                if (roadmapQuarterFilter === 'Q1') return rm.month >= 1 && rm.month <= 3;
                if (roadmapQuarterFilter === 'Q2') return rm.month >= 4 && rm.month <= 6;
                if (roadmapQuarterFilter === 'Q3') return rm.month >= 7 && rm.month <= 9;
                if (roadmapQuarterFilter === 'Q4') return rm.month >= 10 && rm.month <= 12;
                return true;
              }).map((rm) => (
                <button
                  key={rm.month}
                  onClick={() => {
                    sound.playClick();
                    setActiveRoadmapMonth(rm.month);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    activeRoadmapMonth === rm.month
                      ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/80'
                  }`}
                >
                  Month {rm.month}
                  <span className="opacity-75 font-normal ml-1 text-[11px]">({rm.hours})</span>
                </button>
              ))}
            </div>

            {/* Selected Month Detail Card */}
            {(() => {
              const activeData =
                ROADMAP_MONTHS.find((m) => m.month === activeRoadmapMonth) || ROADMAP_MONTHS[0];
              return (
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {activeData.quarter}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {activeData.hours} Cumulative
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {activeData.tierBadge}
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-white">
                        {activeData.title}
                      </h4>
                    </div>

                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-xl shadow">
                      🎯 {activeData.tagline}
                    </span>
                  </div>

                  {/* 30/70 Plan & Physical Real-Life Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono relative z-10">
                    <div className="bg-slate-900/90 border border-sky-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-sky-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <Brain className="w-3 h-3" /> 30% Working RAM
                      </span>
                      <span className="text-sky-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.ramTarget}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-amber-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-amber-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <Compass className="w-3 h-3" /> 70% Palace Storage
                      </span>
                      <span className="text-amber-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.palaceTarget}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-emerald-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> 2h Physical Real-Life
                      </span>
                      <span className="text-emerald-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.physicalTarget}
                      </span>
                    </div>
                  </div>

                  {/* 4 Core Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs relative z-10">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5 text-sm">
                        👁️ Visual Observation & Panoramic Gaze
                      </span>
                      <p className="text-slate-300 leading-relaxed">{activeData.observation}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5 text-sm">
                        📚 Studying & Information Intake Acceleration
                      </span>
                      <p className="text-slate-300 leading-relaxed">{activeData.studying}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-colors">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5 text-sm">
                        🗣️ Communication, Eloquence & Working Recall
                      </span>
                      <p className="text-slate-300 leading-relaxed">{activeData.communication}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5 text-sm">
                        🧘 Mental Demeanor, Vibe & Identity Shift
                      </span>
                      <p className="text-slate-300 leading-relaxed">{activeData.vibe}</p>
                    </div>
                  </div>

                  {/* Deep Neurological Mechanism Card */}
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 text-xs relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Dna className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-cyan-200 uppercase tracking-wider text-[11px]">
                        Neurological Mechanism & Plasticity
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {activeData.neuroMechanism}
                    </p>
                  </div>

                  {/* Motivational Milestone Banner */}
                  <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900 border border-purple-500/30 text-xs relative z-10 flex items-start gap-2.5">
                    <Target className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-200 block text-[11px] uppercase tracking-wider mb-0.5">
                        Transformation Reality:
                      </span>
                      <p className="text-slate-300 italic">
                        "{activeData.milestoneQuote}"
                      </p>
                    </div>
                  </div>

                  {/* Previous / Next Month Navigation */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800/80 relative z-10">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveRoadmapMonth(Math.max(1, activeRoadmapMonth - 1));
                      }}
                      disabled={activeRoadmapMonth === 1}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeRoadmapMonth === 1
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Month {Math.max(1, activeRoadmapMonth - 1)}
                    </button>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      Month {activeRoadmapMonth} of 12
                    </span>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveRoadmapMonth(Math.min(12, activeRoadmapMonth + 1));
                      }}
                      disabled={activeRoadmapMonth === 12}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeRoadmapMonth === 12
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      Month {Math.min(12, activeRoadmapMonth + 1)}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* DEDICATED 20-MIN NSDR GUIDED SESSION MODAL */}
      {isNsdrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Coffee className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Non-Sleep Deep Rest Anchor
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              Midday 20-Min Dopamine Reset
            </h3>
            <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto">
              Lie down or recline, close your eyes, and allow cortical activity to decelerate. This clears cognitive adenosine and recharges striatal dopamine reserves.
            </p>

            {/* Breathing Visualizer Orb */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-40 h-40">
                <div
                  className={`absolute rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 transition-all duration-1000 ${
                    nsdrBreathPhase === 'Inhale'
                      ? 'w-36 h-36 scale-110 shadow-lg shadow-emerald-500/30'
                      : nsdrBreathPhase === 'Hold'
                      ? 'w-36 h-36 scale-105'
                      : 'w-24 h-24 scale-90'
                  }`}
                />
                <div className="relative z-10 text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 block mb-1">
                    {nsdrBreathPhase}
                  </span>
                  <span className="text-3xl font-mono font-black text-white">
                    {formatCountdown(nsdrSecondsRemaining)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">
                {isNsdrRunning ? 'Physiological cycle: Inhale 4s • Hold 4s • Exhale 6s' : 'Session paused'}
              </span>
            </div>

            {/* Audio Ambient Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => {
                  sound.playClick();
                  if (isNsdrAudioEnabled) {
                    setIsNsdrAudioEnabled(false);
                    stopNsdrAudio();
                  } else {
                    setIsNsdrAudioEnabled(true);
                    if (isNsdrRunning) startNsdrAudio();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isNsdrAudioEnabled
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isNsdrAudioEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> 136Hz Rest Frequency Active
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" /> Ambient Muted
                  </>
                )}
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleToggleNsdrRunning}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black shadow-lg transition-all cursor-pointer active:scale-95 ${
                  isNsdrRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/50'
                }`}
              >
                {isNsdrRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Rest
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" /> Start 20-Min Rest
                  </>
                )}
              </button>

              <button
                onClick={handleCloseNsdrModal}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                Done / Minimize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render individual task card with ZERO-CHEAT automated countdown & verification
  function renderTaskCard(task: FourHourTask) {
    const isCompleted = task.isCompleted;

    // Calculate actual elapsed seconds & remaining seconds
    const targetSeconds = task.targetMinutes * 60;
    const elapsedSeconds = task.elapsedSeconds || 0;
    const secondsRemaining = Math.max(0, targetSeconds - elapsedSeconds);
    const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));

    // Daily protocol step check
    const protocolTask = protocol?.tasks?.find((pt) => pt.id === task.gameMode);
    const isProtocolMastered = protocolTask?.isCompleted || protocol?.isLockedOut;

    return (
      <div
        key={task.id}
        id={`task-card-${task.id}`}
        className={`rounded-2xl border transition-all duration-300 p-4 sm:p-5 relative ${
          isCompleted
            ? 'bg-slate-900/70 border-emerald-500/50 shadow-md shadow-emerald-950/20'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700/80 shadow-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Anti-Cheat Status Badge & Details */}
          <div className="flex items-start gap-3.5">
            {/* Autonomous Verification Badge (NON-CLICKABLE TO PREVENT CHEATING) */}
            <div
              className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800/90 text-slate-500 border border-slate-700'
              }`}
              title={
                isCompleted
                  ? 'Verified Mastered via Deliberate Practice'
                  : 'Anti-Cheat: Auto-verifies upon completing practice time or daily training'
              }
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 fill-current" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1 rounded-lg bg-slate-800 border border-slate-700">
                  {getTaskIcon(task)}
                </div>
                <h3
                  className={`text-sm sm:text-base font-bold tracking-tight ${
                    isCompleted ? 'text-slate-200' : 'text-white'
                  }`}
                >
                  {task.title}
                </h3>

                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {task.targetMinutes >= 60
                    ? `${task.targetMinutes / 60} Hours`
                    : `${task.targetMinutes} Mins`}
                </span>

                {isCompleted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {isProtocolMastered ? 'Daily Protocol Mastered' : 'Quota Complete'}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    {formatCountdown(secondsRemaining)} remaining
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {task.description}
              </p>
              <p className="text-[11px] text-slate-400 italic">
                🧠 {task.neuroImpact}
              </p>

              {/* Live In-Card Progress Bar for Game Modules */}
              {task.category !== 'night' && (
                <div className="pt-2 max-w-md">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <span>
                      Trained Today: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s / {task.targetMinutes}m
                    </span>
                    <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                      {isCompleted ? '100% Verified' : `${progressPercent}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-col sm:flex-row items-end lg:items-center gap-2.5 shrink-0 self-end lg:self-center">
            {/* Case A: Game Module Launch Button */}
            {task.gameMode && (
              <button
                id={`launch-game-${task.id}`}
                onClick={() => {
                  sound.playClick();
                  onNavigateMode(task.gameMode!);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isCompleted
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-950/40'
                }`}
                title={`Launch into ${task.title} training. Timer ticks down automatically as you train!`}
              >
                <span>{isCompleted ? 'Train Again' : 'Launch & Train'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Case B: Midday NSDR Session Trigger */}
            {task.id === 'midday-nsdr' && (
              <button
                id="launch-nsdr-session-btn"
                onClick={() => {
                  sound.playClick();
                  setIsNsdrModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Re-open NSDR Player' : 'Launch 20m NSDR Session'}</span>
              </button>
            )}

            {/* Case C: Nightly Sleep Verification Form */}
            {task.id === 'nightly-sleep' && (
              <form onSubmit={handleVerifySleep} className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-mono pl-1">Bedtime</span>
                    <input
                      type="time"
                      value={bedtimeInput}
                      onChange={(e) => setBedtimeInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <span className="text-slate-500 text-xs self-center mt-2">→</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-mono pl-1">Wake Time</span>
                    <input
                      type="time"
                      value={wakeTimeInput}
                      onChange={(e) => setWakeTimeInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow"
                    title="Calculate sleep hours and verify against 7-hour threshold"
                  >
                    Verify 7h
                  </button>
                </div>

                {sleepFeedback.message && (
                  <div
                    className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                      sleepFeedback.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {sleepFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    )}
                    <span>{sleepFeedback.message}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }
};
