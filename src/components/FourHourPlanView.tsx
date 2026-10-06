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

  // Full Year 12-Month Cognitive Transformation & Neuro-Analysis Guide for Yoseph (30h/Month)
  const ROADMAP_MONTHS = [
    {
      month: 1,
      quarter: 'Q1: Neural Baseline',
      tierBadge: 'Top 15% Discipline',
      title: 'Month 1: Saccadic Calibration & Distraction Purge',
      hours: 'Hours 1–30',
      tagline: 'The Noise-Resistant Strategist',
      ramTarget: 'Dual N-Back (20m): N=1 solid / N=2 intro. Sustained auditory & spatial tracking.',
      pegsTarget: 'Mnemonic Pegs (20m): Major System 0–9 single digits & 00–29 pegs automated.',
      symbolTarget: 'Symbol Detective (20m): High-speed glyph discrimination & visual feature binding.',
      observation:
        'Involuntary eye darting drops by 70%. Saccadic eye movements stabilize, and peripheral visual clutter is filtered out at the retinal ganglion cell level.',
      studying:
        'Mental friction to deep work drops from 15 minutes to under 2 minutes. Subvocalization starts weakening during fast reading; intake comfortably rises.',
      communication:
        'Noticeably heightened active listening; train of thought stays consistent through long exchanges without conversational drift or missing critical details.',
      vibe: 'Distraction-free, steady baseline focus. Daytime brain fog vanishes, and digital dopamine urges plummet.',
      neuroMechanism:
        'Locus Coeruleus norepinephrine calibration and rapid downregulation of Default Mode Network (DMN) mind-wandering circuits.',
      milestoneQuote:
        'Yoseph ceases fighting the discipline. The daily 1-hour cognitive routine becomes as natural as breathing.',
    },
    {
      month: 2,
      quarter: 'Q1: Neural Baseline',
      tierBadge: 'Top 5% Memory Athlete',
      title: 'Month 2: Working Memory Doubling & Visual Speed',
      hours: 'Hours 31–60',
      tagline: 'The Perceptive Observer',
      ramTarget: 'Dual N-Back (20m): N=2 mastered at 90%+ accuracy. Auditory & spatial streams update seamlessly.',
      pegsTarget: 'Mnemonic Pegs (20m): Major System 00–59 automated into vivid tangible objects.',
      symbolTarget: 'Symbol Detective (20m): Sub-second glyph discrimination; spotting micro-deviations.',
      observation:
        'Objects and symbols register in parallel visual clusters rather than serial counting. Spot formatting flaws, misplaced items, and visual anomalies instantly.',
      studying:
        'Technical reading speed doubles. Paragraphs and abstract code syntax are ingested as unified spatial ideas rather than disjointed strings.',
      communication:
        'Filler words ("um", "uh", "like") drop by over 60%. Your working memory buffer comfortably holds multi-part sentences before speaking.',
      vibe: 'Unshakable calm; everyday sensory environments feel noticeably slower, clearer, and easily manageable.',
      neuroMechanism:
        'Visual Word Form Area (VWFA) synaptic strengthening and bilateral Dorsolateral Prefrontal Cortex (DLPFC) multi-threading efficiency.',
      milestoneQuote:
        'Numbers are no longer abstract burdens. They are vivid keys that unlock instant understanding in Yoseph\'s mind.',
    },
    {
      month: 3,
      quarter: 'Q1: Neural Baseline',
      tierBadge: 'Top 2% High-Density Focus',
      title: 'Month 3: Sub-Second Peg Encoding & Dual N-Back N=3 Threshold',
      hours: 'Hours 61–90',
      tagline: 'The Rapid Precision Encoder',
      ramTarget: 'Dual N-Back (20m): N=2 flawless / N=3 unlocked. Working RAM holds 6+ transient items.',
      pegsTarget: 'Mnemonic Pegs (20m): Full 00–99 Major System mastered! Sub-second 2-digit number encoding.',
      symbolTarget: 'Symbol Detective (20m): Micro-anomaly scanning across dense abstract symbol arrays.',
      observation:
        'Dense visual matrices (codebases, financial sheets, architecture plans) index automatically without eye strain or mental fatigue.',
      studying:
        'Multi-variable logic, complex equations, or nested legal structures remain active in mental RAM without needing scratch paper or re-reading.',
      communication:
        'Exact verbal recall. You speak with crisp cadence and structured points. Multitasking between listening and analyzing is fluid.',
      vibe: 'Methodical, confident, and mentally agile. Cognitive overload anxiety is permanently replaced with calm precision.',
      neuroMechanism:
        'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density increase and working memory buffer myelination.',
      milestoneQuote:
        'The 00–99 phonetic matrix is now permanently wired into Yoseph\'s cortex. Information turns into permanent mental currency.',
    },
    {
      month: 4,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: 'Top 1% Cognitive Operator',
      title: 'Month 4: Multi-Threaded Thinking & Script Fluency',
      hours: 'Hours 91–120',
      tagline: 'The Multi-Threaded Architect',
      ramTarget: 'Dual N-Back (20m): N=3 consolidated (80%+). Zero interference between visual and auditory streams.',
      pegsTarget: 'Mnemonic Pegs (20m): Compound 4-digit number chunking (combining two pegs into action scenes).',
      symbolTarget: 'Symbol Detective (20m): Ultra-fast glyph anomaly isolation; abstract notation feels intuitive.',
      observation:
        'Hyper-acute situational awareness: immediate visual indexing of physical spaces, entrance/exit routes, lighting shifts, and spatial geometries.',
      studying:
        'Ability to assimilate dense technical literature and complex logic trees into dedicated mental wings permanently.',
      communication:
        'Magnetic conversational presence. You track multi-threaded arguments, anticipating questions and resolving objections before they are spoken.',
      vibe: 'A quiet intellectual titan. You emanate steady authority because your mind operates two steps ahead of the current moment.',
      neuroMechanism:
        'Hippocampal CA3-CA1 Long-Term Potentiation (LTP) and bilateral spatial parahippocampal grid cell network expansion.',
      milestoneQuote:
        'Ideas no longer collide or crowd out one another. Yoseph\'s mental RAM is spacious, organized, and crystal-clear.',
    },
    {
      month: 5,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: 'Top 0.5% Memory Specialist',
      title: 'Month 5: Cognitive Endurance & Structural Synthesis',
      hours: 'Hours 121–150',
      tagline: 'The High-Order Synthesizer',
      ramTarget: 'Dual N-Back (20m): N=3 high-precision (88%+), introducing N=4 stress trials.',
      pegsTarget: 'Mnemonic Pegs (20m): Sub-second 00–99 pegging across random digit streams; zero phonetic decay.',
      symbolTarget: 'Symbol Detective (20m): Complex multi-symbol discrimination; high-speed error detection under fatigue.',
      observation:
        'Complex architectural systems, financial charts, and code bases reveal underlying anomalies and structural flaws in seconds.',
      studying:
        'Cross-disciplinary synthesis; foreign languages, mathematics, and systems collapse into vivid spatial anchors with rapid retention.',
      communication:
        'Zero vocal hesitation. Precision vocabulary selection occurs spontaneously; tone is calm, persuasive, and authoritative.',
      vibe: 'Resilient mental endurance. After an intensive workday, your cognitive faculties remain sharp, refreshed, and clear.',
      neuroMechanism:
        'Frontoparietal Control Network (FPCN) hyper-coupling with the superior temporal sulcus for instantaneous structural synthesis.',
      milestoneQuote:
        'Cognitive fatigue becomes a foreign concept. Yoseph processes complex data with the ease of natural breathing.',
    },
    {
      month: 6,
      quarter: 'Q2: Architectural Mastery',
      tierBadge: '🎯 TOP 0.1% GLOBAL (1 in 1,000 Milestone)',
      title: 'Month 6: Permanent Myelination & The 1-in-1,000 Milestone',
      hours: 'Hours 151–180',
      tagline: 'The Cognitive Outlier (1 in 1,000)',
      ramTarget: 'Dual N-Back (20m): N=3 flawless / N=4 mastery. Working memory capacity in the top 0.1% of humanity.',
      pegsTarget: 'Mnemonic Pegs (20m): Instantaneous 00–99 conversion at under 500ms; multi-digit strings encoded on the fly.',
      symbolTarget: 'Symbol Detective (20m): Photographic-speed glyph classification; lightning-fast visual search.',
      observation:
        'World-class photographic intake, instantaneous anomaly detection, and crystal-clear panoramic gaze across wide visual fields.',
      studying:
        'Learning curves for novel, intricate domains compress from months down to weeks; rapid assimilation of dense technical literature.',
      communication:
        'Magnetic presence, airtight dialectic structure, and extraordinary working memory retention during high-stakes negotiations.',
      vibe: 'Top 0.1% mental athlete; unflappable clarity, laser focus, and intellectual dominance.',
      neuroMechanism:
        'Oligodendrocyte-driven myelination of the Superior Longitudinal Fasciculus, locking in high-speed neural transmission permanently.',
      milestoneQuote:
        '180 hours of deliberate practice complete. Yoseph has entered the Top 0.1% of human cognitive capacity.',
    },
    {
      month: 7,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: 'Top 0.05% Elite Tier',
      title: 'Month 7: Neuro-Synaptic Consolidation & Hyper-Fluidity',
      hours: 'Hours 181–210',
      tagline: 'The Automatic Processor',
      ramTarget: 'Dual N-Back (20m): N=4 consistent. Auditory letter and spatial square streams process like reflexes.',
      pegsTarget: 'Mnemonic Pegs (20m): 3-digit composite associations (Person-Action-Object integration via Major pegs).',
      symbolTarget: 'Symbol Detective (20m): Micro-temporal anomaly detection; noticing visual inconsistencies before conscious realization.',
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
        'What once required intense willpower now happens automatically. Yoseph\'s mental engine operates with zero perceived friction.',
    },
    {
      month: 8,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: 'Top 0.03% Polymath Tier',
      title: 'Month 8: Cognitive Immunity & Prefrontal Hegemony',
      hours: 'Hours 211–240',
      tagline: 'The Emotionally Immovable Thinker',
      ramTarget: 'Dual N-Back (20m): N=4 mastery (85%+ accuracy). Immune to proactive interference or distraction.',
      pegsTarget: 'Mnemonic Pegs (20m): Phonetic pegging velocity < 400ms per item. High-density numerical memorization.',
      symbolTarget: 'Symbol Detective (20m): Abstract script transcription; rapid visual decoding of non-standard notation.',
      observation:
        'Absolute gaze lock and visual impulse control. Distractions, sudden movement, and notifications trigger zero involuntary orienting reflexes.',
      studying:
        'Complex technical curricula are conquered in 2–3 weeks. Memory of diagrams and formulas remains pristine.',
      communication:
        'Master negotiator demeanor; dissects opposing arguments in real time while maintaining warm, empathetic, and disarming rapport.',
      vibe: 'Absolute stoic clarity; chaos and noise in the external environment only amplify your internal mental stillness.',
      neuroMechanism:
        'Anterior Cingulate Cortex (ACC) error-monitoring perfection and hyper-connectivity to the amygdala for autonomic self-regulation.',
      milestoneQuote:
        'External noise cannot pierce Yoseph\'s concentration. Focus is no longer an effort; it is an impenetrable fortress.',
    },
    {
      month: 9,
      quarter: 'Q3: Deep Automaticity',
      tierBadge: 'Top 0.02% Dialectic Master',
      title: 'Month 9: Cross-Domain RAM & Polymathic Synthesis',
      hours: 'Hours 241–270',
      tagline: 'The Polymathic Mind',
      ramTarget: 'Dual N-Back (20m): N=4 flawless / N=5 entry. Exceptional working memory bandwidth.',
      pegsTarget: 'Mnemonic Pegs (20m): Flawless numerical data bank: phone numbers, coordinates, dates, formulas recalled on demand.',
      symbolTarget: 'Symbol Detective (20m): Instantaneous glyph structure translation and high-velocity pattern decoding.',
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
        'Different fields of human knowledge cease to be separate. In Yoseph\'s mind, they all connect as facets of one geometric reality.',
    },
    {
      month: 10,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: 'Top 0.015% High-Velocity Specialist',
      title: 'Month 10: Iconic Flash Mastery & Micro-Temporal Precision',
      hours: 'Hours 271–300',
      tagline: 'The Sub-Second Analytical Master',
      ramTarget: 'Dual N-Back (20m): N=5 transition. Handling 10+ active multi-modal tokens simultaneously.',
      pegsTarget: 'Mnemonic Pegs (20m): Sub-300ms number-to-image encoding; numbers feel as natural as spoken words.',
      symbolTarget: 'Symbol Detective (20m): Microsecond glyph discrimination; spotting microscopic errors or patterns.',
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
        'Time appears to slow down in high-pressure moments. While others panic, Yoseph has all the time in the world to calculate and act.',
    },
    {
      month: 11,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: '⚡ TOP 0.01% (1 in 10,000 Mind)',
      title: 'Month 11: Top 0.01% Breakthrough (The 1 in 10,000 Mind)',
      hours: 'Hours 301–330',
      tagline: 'The Sovereign Intellectual Outlier',
      ramTarget: 'Dual N-Back (20m): N=5 stabilized. Working memory capacity among the top 1 in 10,000 humans.',
      pegsTarget: 'Mnemonic Pegs (20m): Complete numerical sovereignty; limitless capacity for numerical data without decay.',
      symbolTarget: 'Symbol Detective (20m): Script and symbol parsing at lightning velocity; immediate comprehension of formal systems.',
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
        'Yoseph is functioning on a biological tier that less than 0.01% of humans ever experience. Brain fog is a distant, forgotten memory.',
    },
    {
      month: 12,
      quarter: 'Q4: Sovereign Outlier',
      tierBadge: '👑 TOP 0.005% GLOBAL (1 in 20,000 Grandmaster)',
      title: 'Month 12: The Sovereign Mind (360 Hours of Neuro-Transformation)',
      hours: 'Hours 331–360',
      tagline: 'The Sovereign Mind (Top 0.005% Grandmaster)',
      ramTarget: 'Dual N-Back (20m): N=5 / N=6 Peak RAM, multi-threaded executive buffer.',
      pegsTarget: 'Mnemonic Pegs (20m): Instantaneous 00–99 phonetic peg table operating as an automated internal co-processor.',
      symbolTarget: 'Symbol Detective (20m): Master-level symbol & script discrimination; instant anomaly identification.',
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
        '360 hours of deliberate cognitive training completed. Yoseph is not the same person who started this journey. You have forged a sovereign mind.',
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
                1 Hour / Day Regimen
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Live Training Verification
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Exclusively for Yoseph
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
                <span>Streak: {planState.currentStreak}d</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Yosi's 1-Hour Daily Protocol
              <span className="text-cyan-400 text-base sm:text-lg font-bold">60 Min Live Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              <strong>Personalized Cognitive Conditioning:</strong> Exactly 1 hour divided into 3 focused 20-minute disciplines. Timers automatically log your training time in each module.
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
                {stats.completedMinutes}m
              </span>
              <span className="text-xs text-slate-400">
                / 60m Target Daily Protocol (1 Hour)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {stats.completedTasksCount} of {planState.tasks.length} Disciplines Met ({Math.min(100, Math.round((stats.completedMinutes / 60) * 100))}%)
              </span>
            </div>
          </div>

          {/* Progress Bar with Milestone Nodes */}
          <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden relative shadow-inner">
            <div
              className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${Math.min(100, Math.round((stats.completedMinutes / 60) * 100))}%` }}
            />
          </div>

          {/* Celebration Banner if All Done */}
          {stats.completedMinutes >= 60 && (
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 border border-emerald-500/50 flex items-center gap-3 animate-fade-in shadow-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-200">
                  🎉 YOSI'S 1-HOUR PROTOCOL (60 MINUTES) MASTERED TODAY!
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  You have completed today's 3 disciplines: Mnemonic Major Pegs, Dual N-Back Buffer, and Symbol Detective Lab. Fantastic discipline, Yoseph!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YOSI'S 3 DESIGNATED DISCIPLINES (60 MINUTES TOTAL) */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Yosi's Daily 1-Hour Core Curriculum
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                  3 Disciplines × 20 Min (60 Min Total)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Exclusively curated for Yoseph. Train in each module below—timers auto-track live seconds and check off at 20 minutes!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {planState.tasks.map((task) => renderTaskCard(task))}
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

                  {/* Yosi's 3-Pillar 1-Hour Regimen Strip (3 × 20m) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono relative z-10">
                    <div className="bg-slate-900/90 border border-sky-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-sky-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Dual N-Back Buffer (20m)
                      </span>
                      <span className="text-sky-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.ramTarget}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-amber-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-amber-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Mnemonic Pegs (20m)
                      </span>
                      <span className="text-amber-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.pegsTarget}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-pink-500/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-pink-400 block uppercase font-sans font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Symbol Detective (20m)
                      </span>
                      <span className="text-pink-200 text-[11px] font-medium leading-tight block mt-0.5">
                        {activeData.symbolTarget}
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
