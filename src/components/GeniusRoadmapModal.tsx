import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Brain,
  Zap,
  Target,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Award,
  Layers,
  Globe,
  BookOpen,
  X,
  Smartphone,
  Check,
  Compass,
  Eye,
  MapPin,
  Coffee,
  BedDouble,
  Activity,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Milestone {
  day: number;
  monthEquivalent: string;
  cumulativeHours: string;
  phase: string;
  title: string;
  populationTier: string;
  isTierMilestone?: boolean;
  tierHighlight?: string;
  ramTarget: string; // 30% focus
  palaceTarget: string; // 70% focus
  physicalPracticeTarget: string; // 2h physical practice
  superpowerUnlocked: string;
  neuroDescription: string;
  skills: string[];
}

const MILESTONES: Milestone[] = [
  {
    day: 7,
    monthEquivalent: 'Week 1',
    cumulativeHours: '28 Hours',
    phase: 'Phase 1: Neural Scaffolding',
    title: 'The Neural Awakening & Anti-Distraction Purge',
    populationTier: 'Top 30% Focus Discipline',
    ramTarget: '30% RAM: Dual N-Back N=2 consolidation, Ayumu 5 digits @ 800ms',
    palaceTarget: '70% Palace: Major System single digits 0–9, first 10 home loci',
    physicalPracticeTarget: 'Real-Life: 14h walking home & office rooms, placing tactile anchors',
    superpowerUnlocked: 'Elimination of Daytime Brain Fog & 70% Drop in Digital Distraction Urges',
    neuroDescription:
      'Dorsolateral prefrontal cortex (DLPFC) adapts to dual-stream cognitive load. Locus coeruleus stabilizes norepinephrine firing, cutting phantom phone-checking reflex.',
    skills: [
      'Eliminated all filler games; 100% focused on 30% RAM and 70% Memory Palace',
      'Dual N-Back: simultaneous auditory letters and spatial grid tracking locked in',
      'Subvocal audio loop suppressed during visual flashes',
    ],
  },
  {
    day: 30,
    monthEquivalent: 'Month 1',
    cumulativeHours: '120 Hours',
    phase: 'Phase 1: Foundation Complete',
    title: 'The Subvocalization Breaker & 50-Loci Foundation',
    populationTier: 'Top 10% Memory Competence',
    ramTarget: '30% RAM: N=2 Flawless (95%+), Ayumu 6 digits @ 500ms flash',
    palaceTarget: '70% Palace: 00–49 Major System reflex, 40 permanently indexed loci',
    physicalPracticeTarget: 'Real-Life: 60h physical route walks (neighborhood, grocery market, local park)',
    superpowerUnlocked: 'Instantaneous 30-Item Recall on a Single Real-World Walkthrough',
    neuroDescription:
      'Occipital-parietal visual cortex bypasses Broca’s speech area. Numbers and abstract concepts transform into rich spatial imagery with zero internal auditory chatter.',
    skills: [
      '4 hours daily training feels natural and effortless; dopamine baseline fully reset',
      'Childhood home & daily walking route transformed into high-fidelity loci networks',
      'Technical reading speed rises 2x with zero loss of comprehension',
    ],
  },
  {
    day: 60,
    monthEquivalent: 'Month 2',
    cumulativeHours: '240 Hours',
    phase: 'Phase 2: Working RAM & Spatial Mastery',
    title: 'Parallel Processing & 100-Peg Subconscious System',
    populationTier: 'Top 2% Memory Athlete Tier',
    ramTarget: '30% RAM: Consistent N=3, Ayumu 7 digits @ 350ms flash',
    palaceTarget: '70% Palace: Full 00–99 Major System automated, 100 loci across 3 palaces',
    physicalPracticeTarget: 'Real-Life: 120h physical exploration mapping 2 new physical building complexes',
    superpowerUnlocked: 'Simultaneous Multi-Threaded Complex Problem Solving & Total Digit Immunity',
    neuroDescription:
      'Frontoparietal attentional networks thicken with dense myelin. Working memory RAM comfortably handles 6–7 interdependent variables without cognitive spillover.',
    skills: [
      '00–99 phonetic numbers encode at under 1.2 seconds per item instinctively',
      'Flawless real-time capture of multi-digit codes, cards, and complex passwords',
      '20-minute midday NSDR clears mental adenosine for crisp afternoon focus',
    ],
  },
  {
    day: 90,
    monthEquivalent: 'Month 3 (The 1-in-1,000 Horizon)',
    cumulativeHours: '360 Hours',
    phase: 'Phase 2: Milestone Horizon',
    title: 'TOP 0.1% REACHED: The 1 in 1,000 Memory Athlete',
    populationTier: 'TOP 0.1% GLOBAL TIER (1 in 1,000)',
    isTierMilestone: true,
    tierHighlight: '🎯 1 in 1,000 Achieved in Month 3 via 4h/day Immersion!',
    ramTarget: '30% RAM: N=3 Mastery (90%+), Ayumu 8 digits @ 250ms chimpanzee flash',
    palaceTarget: '70% Palace: 180+ Solidified Loci across 5 physical routes, sub-second peg speed',
    physicalPracticeTarget: 'Real-Life: 180h real-world physical mapping; library, university, & city routes',
    superpowerUnlocked: '45-Minute Technical Presentations Delivered with Zero Notes & Polyglot Engine',
    neuroDescription:
      'High hippocampal-prefrontal theta phase-locking. What takes casual trainers a full year (365 days) is achieved in 90 days due to 360 hours of concentrated 30/70 deliberate practice.',
    skills: [
      'Top 0.1% baseline certified: memorizes a shuffled 52-card deck in under 3.5 minutes',
      'Acquire 40–50 foreign language vocabulary words daily using keyword loci links',
      'Hold complete programming architecture or complex legal trees active in mental RAM',
    ],
  },
  {
    day: 180,
    monthEquivalent: 'Month 6',
    cumulativeHours: '720 Hours',
    phase: 'Phase 3: High-Density Synaptic Architecture',
    title: 'The Cognitive Outlier & Dynamic 3D Mental Modeling',
    populationTier: 'Top 0.05% Elite Memory Specialist (1 in 2,000)',
    ramTarget: '30% RAM: Dual N-Back N=4 breakthrough, Ayumu 9 digits in 210ms',
    palaceTarget: '70% Palace: 300+ Master Loci across 8 real-world environments, 500ms peg velocity',
    physicalPracticeTarget: 'Real-Life: 360h physical navigation; outdoor trails, art galleries, architecture',
    superpowerUnlocked: 'Photographic Multi-Page Technical Absorption & Dialectic Dominance',
    neuroDescription:
      'Myelination of the Superior Longitudinal Fasciculus is permanently altered. Information is synthesized directly across visual and semantic association cortices with near-zero latency.',
    skills: [
      'Complex multi-volume textbooks mapped into dedicated spatial wings permanently',
      'Airtight spoken communication: zero filler words, flawless real-time quotation',
      'Cloud synchronized training across 2 phones and PC enables continuous lifestyle immersion',
    ],
  },
  {
    day: 270,
    monthEquivalent: 'Month 8–9 (The 0.01% Breakthrough)',
    cumulativeHours: '1,080 Hours',
    phase: 'Phase 3: Sovereign Automaticity',
    title: 'TOP 0.01% UNLOCKED: The 1 in 10,000 Polymath Tier',
    populationTier: 'TOP 0.01% GLOBAL TIER (1 in 10,000)',
    isTierMilestone: true,
    tierHighlight: '⚡ Top 0.01% Breakthrough Horizon (1 in 10,000 Human Beings)',
    ramTarget: '30% RAM: N=5 Working RAM mastery, Ayumu 9 digits in 180ms primate reflex',
    palaceTarget: '70% Palace: 500+ Permanent Physical Loci, 3-digit PAO system integration',
    physicalPracticeTarget: 'Real-Life: 540h physical world mapping; entire city blocks & multi-floor complexes',
    superpowerUnlocked: 'Living Encyclopedic RAM: Parallel Fluency Across 3+ Divergent Technical Domains',
    neuroDescription:
      'Striatal basal ganglia automaticity and prefrontal cortical hyper-synchronization. You operate on an intellectual and attentional plane that less than 1 in 10,000 humans ever reach.',
    skills: [
      'Official 1 in 10,000 cognitive percentile: instantaneous complex system comprehension',
      'Learn complete programming stacks or medical curricula in 30–45 days with high retention',
      'Absolute emotional stoicism: distractions and stress trigger zero cognitive degradation',
    ],
  },
  {
    day: 365,
    monthEquivalent: 'Month 12 (Full-Year Completion)',
    cumulativeHours: '1,440+ Hours',
    phase: 'Phase 4: Sovereign Grandmaster',
    title: 'The Sovereign Mind: Top 0.005% Memory Grandmaster',
    populationTier: 'TOP 0.005% GLOBAL TIER (1 in 20,000 Sovereign)',
    isTierMilestone: true,
    tierHighlight: '👑 1,440 Hours Complete: Irreversible Biological Operating System Upgrade',
    ramTarget: '30% RAM: N=5 / N=6 Working RAM, < 150ms instantaneous visual capture',
    palaceTarget: '70% Palace: 700+ Master Physical Loci Network, instantaneous spatial indexing',
    physicalPracticeTarget: 'Real-Life: 720h real-world physical mapping; complete cities & libraries anchored',
    superpowerUnlocked: 'Photographic-Speed Information Mastery, Total Polyglot Engine, & Lifetime Sovereign Mind',
    neuroDescription:
      'Permanent neurostructural consolidation. Longitudinal gray matter density and white-matter tract integrity are physically and permanently enhanced. A lifetime biological second processor.',
    skills: [
      'World Memory Championship Grandmaster baseline: competitive speed card & number feats',
      'Absorb, index, and permanently retain full domains of human knowledge at will',
      'Zero brain fog for life: optimized circadian rhythm, NSDR restoration, and attentional sovereignty',
    ],
  },
];

interface MonthlyDetail {
  month: number;
  quarter: string;
  hours: string;
  tier: string;
  headline: string;
  ramGoal: string;
  palaceGoal: string;
  physicalGoal: string;
  cognitiveShift: string;
  neuroScience: string;
}

const MONTH_BY_MONTH: MonthlyDetail[] = [
  {
    month: 1,
    quarter: 'Q1: Foundation',
    hours: '120 Hours',
    tier: 'Top 15% Discipline',
    headline: 'Saccadic Calibration & Distraction Purge',
    ramGoal: '30% RAM: Dual N-Back N=2 stability, Ayumu 5 digits @ 500ms',
    palaceGoal: '70% Palace: Major System 00–49, 40 home loci indexed',
    physicalGoal: 'Physical: 60h walking personal rooms, placing 40 tangible anchors',
    cognitiveShift: 'Involuntary phone-checking impulses collapse. Reading speed doubles to 450 WPM.',
    neuroScience: 'Downregulation of Default Mode Network (DMN) mind-wandering circuits.',
  },
  {
    month: 2,
    quarter: 'Q1: Foundation',
    hours: '240 Hours',
    tier: 'Top 5% Memory Athlete',
    headline: 'Subitizing Breakthrough & Parallel Intake',
    ramGoal: '30% RAM: N=2 Flawless / N=3 Intro, Ayumu 6 digits @ 400ms',
    palaceGoal: '70% Palace: Major System 00–99 complete, 80 loci across 2 palaces',
    physicalGoal: 'Physical: 120h walking neighborhood streets & local markets',
    cognitiveShift: 'Visual clusters register in parallel rather than slow serial counting.',
    neuroScience: 'Visual cortex V1-V4 parallel pathway acceleration and iconic buffer expansion.',
  },
  {
    month: 3,
    quarter: 'Q1: Foundation',
    hours: '360 Hours',
    tier: '🎯 TOP 0.1% (1 in 1,000 Milestone)',
    headline: 'Top 0.1% Threshold Unlocked in 90 Days!',
    ramGoal: '30% RAM: Solid N=3 (85%+), Ayumu 7 digits @ 300ms',
    palaceGoal: '70% Palace: 150+ Loci across 4 distinct physical palaces',
    physicalGoal: 'Physical: 180h real-world mapping; municipal libraries, parks & campus',
    cognitiveShift: 'Deliver 45-minute technical talks with zero notes by walking mental corridors.',
    neuroScience: 'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density surge.',
  },
  {
    month: 4,
    quarter: 'Q2: Acceleration',
    hours: '480 Hours',
    tier: 'Top 0.08% Global Tier',
    headline: 'Memory Palace Villa & Phonetic Peg Fluidity',
    ramGoal: '30% RAM: N=3 / N=4 Transition, Ayumu 8 digits @ 250ms',
    palaceGoal: '70% Palace: 220+ Loci, sub-second 2-digit number encoding',
    physicalGoal: 'Physical: 240h physical exploration; multi-floor complexes and museums',
    cognitiveShift: 'Hyper-acute situational awareness; instantly noticing structural shifts in rooms.',
    neuroScience: 'Hippocampal CA3-CA1 Long-Term Potentiation (LTP) and bilateral grid cell expansion.',
  },
  {
    month: 5,
    quarter: 'Q2: Acceleration',
    hours: '600 Hours',
    tier: 'Top 0.04% Global Tier',
    headline: 'Visual Chunking & Dynamic 3D Synthesis',
    ramGoal: '30% RAM: Consistent N=4, Ayumu 8 digits @ 220ms',
    palaceGoal: '70% Palace: 300+ Loci, foreign language keyword association',
    physicalGoal: 'Physical: 300h physical exploration; botanical gardens, subway lines, highways',
    cognitiveShift: 'Cross-disciplinary synthesis; codebases and law collapse into geometric shapes.',
    neuroScience: 'Frontoparietal Control Network (FPCN) hyper-coupling for instantaneous synthesis.',
  },
  {
    month: 6,
    quarter: 'Q2: Acceleration',
    hours: '720 Hours',
    tier: 'Top 0.02% Cognitive Outlier (1 in 5,000)',
    headline: 'Permanent Myelination & Outlier Baseline',
    ramGoal: '30% RAM: High-accuracy N=4, Ayumu 9 digits in 210ms chimpanzee flash',
    palaceGoal: '70% Palace: 380+ Loci across 10 permanent physical environments',
    physicalGoal: 'Physical: 360h physical practice; full outdoor trail and transit systems',
    cognitiveShift: 'Magnetic conversational poise, zero filler words, flawless memory recall.',
    neuroScience: 'Oligodendrocyte-driven myelination of the Superior Longitudinal Fasciculus.',
  },
  {
    month: 7,
    quarter: 'Q3: Elite Mastery',
    hours: '840 Hours',
    tier: 'Top 0.015% Global Tier',
    headline: 'Neuro-Synaptic Consolidation & Zero-Latency Retrieval',
    ramGoal: '30% RAM: N=4 / N=5 Transition, Ayumu 9 digits @ 200ms',
    palaceGoal: '70% Palace: 450+ Loci, rapid 3-digit phonetic chunking',
    physicalGoal: 'Physical: 420h real-world mapping; commercial business districts & universities',
    cognitiveShift: 'Dense technical papers read like novels; intricate proofs render as spatial rooms.',
    neuroScience: 'Striatal basal ganglia automaticity recruitment, freeing conscious bandwidth.',
  },
  {
    month: 8,
    quarter: 'Q3: Elite Mastery',
    hours: '960 Hours',
    tier: '⚡ TOP 0.01% BREAKTHROUGH (1 in 10,000)',
    headline: 'Top 0.01% Breakthrough: The 1 in 10,000 Mind',
    ramGoal: '30% RAM: N=5 Breakthrough, Ayumu 9 digits in 180ms flash',
    palaceGoal: '70% Palace: 520+ Loci network, multi-tier nested palace wings',
    physicalGoal: 'Physical: 480h physical navigation; architecture & landmark anchoring',
    cognitiveShift: 'Complete cognitive immunity: noise and high-pressure chaos cannot pierce focus.',
    neuroScience: 'Anterior Cingulate Cortex (ACC) error-monitoring perfection and amygdalar calm.',
  },
  {
    month: 9,
    quarter: 'Q3: Elite Mastery',
    hours: '1,080 Hours',
    tier: '⚡ TOP 0.01% CONSOLIDATED (1 in 10,000)',
    headline: 'Polymathic Grid Architecture & Multi-Domain RAM',
    ramGoal: '30% RAM: N=5 High Accuracy (85%+), Ayumu 9 digits in 170ms',
    palaceGoal: '70% Palace: 600+ Loci, 3-digit PAO system fully active',
    physicalGoal: 'Physical: 540h physical practice; city-wide landmark grids anchored',
    cognitiveShift: 'Parallel mastery across 3+ unrelated disciplines (coding, finance, linguistics).',
    neuroScience: 'Neocortical distributed semantic network crystallization across both hemispheres.',
  },
  {
    month: 10,
    quarter: 'Q4: Sovereign Tier',
    hours: '1,200 Hours',
    tier: 'Top 0.008% Global Tier',
    headline: 'Micro-Temporal Precision & Subjective Time Dilation',
    ramGoal: '30% RAM: N=5 / N=6 Transition, Ayumu 9 digits in 160ms',
    palaceGoal: '70% Palace: 680+ Loci, instantaneous spatial bookmarking',
    physicalGoal: 'Physical: 600h physical exploration; multi-city landmark travel palacing',
    cognitiveShift: 'Conversational anticipation: you see questions and objections seconds in advance.',
    neuroScience: 'Gamma-band (40Hz) neural phase synchronization between visual and executive hubs.',
  },
  {
    month: 11,
    quarter: 'Q4: Sovereign Tier',
    hours: '1,320 Hours',
    tier: 'Top 0.006% Global Tier',
    headline: 'Permanent Cortical Remodeling & Polyglot Engine',
    ramGoal: '30% RAM: Consistent N=6, Ayumu 9 digits in 150ms',
    palaceGoal: '70% Palace: 750+ Loci, entire technical dictionaries memorized',
    physicalGoal: 'Physical: 660h physical practice; complete personal life index mapped',
    cognitiveShift: 'Operational fluency in new complex skills achieved in under 30 days of study.',
    neuroScience: 'Long-term bilateral DLPFC and hippocampal gray-matter volume expansion.',
  },
  {
    month: 12,
    quarter: 'Q4: Sovereign Tier',
    hours: '1,440+ Hours',
    tier: '👑 TOP 0.005% GLOBAL (1 in 20,000 Grandmaster)',
    headline: 'The Sovereign Mind: 1,440 Hours of Neuro-Transformation',
    ramGoal: '30% RAM: N=6 Peak RAM, photographic millisecond capture',
    palaceGoal: '70% Palace: 800+ Master Loci Network, lifetime archival structure',
    physicalGoal: 'Physical: 720h real-world physical navigation; entire urban maps anchored',
    cognitiveShift: 'A permanent second biological processor. Brain fog is a distant, forgotten memory.',
    neuroScience: 'Full-year myelination and permanent structural consolidation that endures for life.',
  },
];

interface GeniusRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
}

export const GeniusRoadmapModal: React.FC<GeniusRoadmapModalProps> = ({
  isOpen,
  onClose,
  currentDay,
}) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'months' | 'architecture'>('milestones');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-cyan-500/20">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  12-Month Full-Year Cognitive Transformation Guide
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  4h Daily Immersion
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact roadmap from baseline to <strong>Top 0.1% (Month 3)</strong> and <strong>Top 0.01% (Month 8–9)</strong> via the 30/70 Plan & Physical Real-Life Practice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rapid Executive Answer Callout Strip: 1 in 1000 vs 0.01% */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-950 to-indigo-950/80 border-b border-cyan-500/30 px-4 sm:px-6 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M3
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Top 0.1% (1 in 1,000)
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  Achieved in <strong>Month 3 (Day 90)</strong> at 360 Hours
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M8
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Top 0.01% (1 in 10,000)
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  Unlocked in <strong>Month 8–9</strong> at 960–1,080 Hours
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M12
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                  Top 0.005% Grandmaster
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  Permanent Sovereign Mind at <strong>1,440+ Hours</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('milestones');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'milestones'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Milestone Horizons</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('months');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'months'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>12 Months Progression</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('architecture');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>30/70 & Physical Architecture</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Current Progress:</span>
            <span className="text-cyan-400 font-mono font-bold">Day {currentDay} of 365</span>
          </div>
        </div>

        {/* Tab 1: Milestone Horizons */}
        {activeTab === 'milestones' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
              {MILESTONES.map((m, idx) => {
                const isPast = currentDay >= m.day;
                const isCurrent = currentDay < m.day && (idx === 0 || currentDay >= MILESTONES[idx - 1].day);

                return (
                  <div key={m.day} className="relative group">
                    {/* Timeline dot / badge */}
                    <div
                      className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                        m.isTierMilestone
                          ? 'ring-4 ring-amber-400/20 bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/40'
                          : isPast
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                          : isCurrent
                          ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-md shadow-cyan-500/40 animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div
                      className={`rounded-2xl border p-5 transition-all ${
                        m.isTierMilestone
                          ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 border-amber-500/60 shadow-xl shadow-amber-950/20 ring-1 ring-amber-400/30'
                          : isPast
                          ? 'bg-slate-900/60 border-emerald-500/30'
                          : isCurrent
                          ? 'bg-slate-850/90 border-cyan-500/50 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full ${
                              m.isTierMilestone
                                ? 'bg-amber-500 text-slate-950 font-extrabold'
                                : isPast
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                : isCurrent
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            DAY {m.day} • {m.monthEquivalent}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{m.phase}</span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {m.cumulativeHours}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            m.isTierMilestone
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-black'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {m.populationTier}
                        </span>
                      </div>

                      {m.tierHighlight && (
                        <div className="mb-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{m.tierHighlight}</span>
                        </div>
                      )}

                      <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        {m.neuroDescription}
                      </p>

                      {/* 30/70 Plan & Physical Practice Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
                        <div className="bg-slate-950/90 border border-sky-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-sky-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <Brain className="w-3 h-3" /> 30% Working RAM
                          </span>
                          <span className="text-sky-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.ramTarget}
                          </span>
                        </div>

                        <div className="bg-slate-950/90 border border-amber-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-amber-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <Compass className="w-3 h-3" /> 70% Palace Storage
                          </span>
                          <span className="text-amber-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.palaceTarget}
                          </span>
                        </div>

                        <div className="bg-slate-950/90 border border-emerald-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-emerald-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> 2h Physical Real-Life
                          </span>
                          <span className="text-emerald-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.physicalPracticeTarget}
                          </span>
                        </div>
                      </div>

                      {/* Superpower Highlight */}
                      <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-950 border border-cyan-500/20 p-3 rounded-xl mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Superpower Unlocked
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{m.superpowerUnlocked}</p>
                      </div>

                      {/* Checkable Skill Bullet Points */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Concrete Neuro-Capabilities:
                        </span>
                        {m.skills.map((skill, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: 12 Months Progression */}
        {activeTab === 'months' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Month Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {MONTH_BY_MONTH.map((m, idx) => (
                <button
                  key={m.month}
                  onClick={() => {
                    sound.playClick();
                    setSelectedMonthIndex(idx);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedMonthIndex === idx
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black ring-2 ring-cyan-400/50'
                      : m.month === 3 || m.month === 8 || m.month === 12
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  Month {m.month}
                  {m.month === 3 && ' 🎯 (0.1%)'}
                  {m.month === 8 && ' ⚡ (0.01%)'}
                  {m.month === 12 && ' 👑'}
                </button>
              ))}
            </div>

            {/* Selected Month Detail Card */}
            {(() => {
              const currentMonth = MONTH_BY_MONTH[selectedMonthIndex];
              return (
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {currentMonth.quarter}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {currentMonth.hours} Cumulative
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {currentMonth.tier}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">
                        Month {currentMonth.month}: {currentMonth.headline}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1));
                        }}
                        disabled={selectedMonthIndex === 0}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Prev Month
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedMonthIndex(Math.min(MONTH_BY_MONTH.length - 1, selectedMonthIndex + 1));
                        }}
                        disabled={selectedMonthIndex === MONTH_BY_MONTH.length - 1}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Next Month
                      </button>
                    </div>
                  </div>

                  {/* 3 Pillars for the Month */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs mb-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30">
                      <span className="font-bold text-sky-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" /> 30% RAM (Screen)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.ramGoal}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                      <span className="font-bold text-amber-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" /> 70% Palace (Spatial)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.palaceGoal}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                      <span className="font-bold text-emerald-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> 2h Physical Practice
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.physicalGoal}</p>
                    </div>
                  </div>

                  {/* Psychological & Cognitive Transformation */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Psychological & Cognitive Shift in Daily Life:</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {currentMonth.cognitiveShift}
                    </p>
                  </div>

                  {/* Neuro-Scientific Plasticity Mechanism */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30 text-xs">
                    <span className="text-indigo-300 font-bold uppercase tracking-wider block text-[10px] mb-1">
                      Neurological Mechanism Under the Hood:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentMonth.neuroScience}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 3: The 30/70 & Physical Practice Architecture */}
        {activeTab === 'architecture' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
            
            {/* The 30/70 Ratio Explanation */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Why 30% RAM / 70% Memory Palace is the Optimal Genius Formula
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Other memory games were intentionally pruned because training too many varied formats creates cognitive interference. Human memory operates through two distinct biological mechanisms:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/30">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>30% Working Memory RAM (Dual N-Back & Ayumu)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Acts as your brain’s CPU bus speed. Dual N-Back trains interference resistance in the Dorsolateral Prefrontal Cortex; Ayumu trains the retinal iconic flash buffer. This ensures you can capture high-bandwidth information in milliseconds without choking.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-1.5">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>70% Spatial Storage (Memory Palace & Major System)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Acts as your permanent biological hard drive. Human evolution did not develop brain regions for abstract symbols, but has 200,000 years of survival circuitry dedicated to spatial navigation (place cells & grid cells). 70% investment in physical loci ensures that once information is captured, it is permanently indexed for life.
                  </p>
                </div>
              </div>
            </div>

            {/* The 2 Hours Screen + 2 Hours Physical Practice */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  The 2h Digital Screen + 2h Physical Real-Life Practice Protocol
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Sitting in front of a screen for 4 hours degrades visual accommodation and causes digital eye strain. Your daily 4 hours is strategically divided into:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider block mb-1">
                    💻 2 Hours Screen Practice (Calibration)
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li>• <strong>Ayumu Chimp Flash</strong>: Millisecond iconic buffer calibration.</li>
                    <li>• <strong>Dual N-Back</strong>: Executive working memory expansion under strict auditory & spatial loads.</li>
                    <li>• <strong>Mnemonic Pegs / Virtual Palace</strong>: Speed verification and rapid digit/card conversions.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
                  <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider block mb-1">
                    🚶 2 Hours Real-Life Physical Practice (Permanent Anchoring)
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li>• <strong>Physical Loci Walking (60 mins)</strong>: Walk physical streets, parks, bookstores, and libraries while mentally establishing 10–20 fresh loci.</li>
                    <li>• <strong>Real-World Book / Concept Mapping (40 mins)</strong>: Take a physical book or textbook and place its core chapters along your walking route.</li>
                    <li>• <strong>NSDR Dopamine Reset (20 mins)</strong>: Midday Non-Sleep Deep Rest to recharge striatal dopamine and clear cognitive adenosine.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Multi-Device Cloud Continuity */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-200 block text-xs uppercase tracking-wider mb-0.5">
                  Multi-Device Ecosystem (2 Phones & PC)
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your training data, 4-hour countdown timers, and curriculum day are synchronized in real-time across your PC and both mobile phones. Conduct your morning Dual N-Back and Ayumu calibration on your PC desktop, take Phone 1 on your midday physical loci walk to check off outdoor anchors, and use Phone 2 for evening review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            4h/day immersion reaches <strong>Top 0.1% in Month 3</strong> and breaks into <strong>Top 0.01% by Month 8–9</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
          >
            Return to Training
          </button>
        </div>
      </div>
    </div>
  );
};
