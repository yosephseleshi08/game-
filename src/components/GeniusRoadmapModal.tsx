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
  ramTarget: string; // Dual N-Back (20m)
  pegsTarget: string; // Mnemonic Major Pegs (20m)
  symbolTarget: string; // Symbol Detective Lab (20m)
  superpowerUnlocked: string;
  neuroDescription: string;
  skills: string[];
}

const MILESTONES: Milestone[] = [
  {
    day: 7,
    monthEquivalent: 'Week 1',
    cumulativeHours: '7 Hours',
    phase: 'Phase 1: Neural Scaffolding',
    title: 'The Neural Awakening & Anti-Distraction Grounding',
    populationTier: 'Top 30% Focus Discipline',
    ramTarget: 'Dual N-Back (20m): N=1 consolidation, introductory N=2 spatial + letter tracking',
    pegsTarget: 'Mnemonic Pegs (20m): Major System single digits 0–9 automated into vivid imagery',
    symbolTarget: 'Symbol Detective (20m): Visual glyph discrimination and high-speed feature binding',
    superpowerUnlocked: 'Elimination of Daytime Brain Fog & 70% Drop in Digital Distraction Urges',
    neuroDescription:
      'Dorsolateral prefrontal cortex (DLPFC) adapts to dual-stream cognitive load. Locus coeruleus stabilizes norepinephrine firing, cutting phantom phone-checking reflex.',
    skills: [
      'Eliminated all filler games; 100% focused on Yoseph\'s 3 core 20-minute disciplines',
      'Dual N-Back: simultaneous auditory letters and spatial grid tracking locked in',
      'Subvocal audio loop suppressed during visual flashes',
    ],
  },
  {
    day: 30,
    monthEquivalent: 'Month 1',
    cumulativeHours: '30 Hours',
    phase: 'Phase 1: Foundation Complete',
    title: 'The Saccadic Calibration & Distraction Purge',
    populationTier: 'Top 15% Focus Discipline',
    ramTarget: 'Dual N-Back (20m): N=1 solid / N=2 intro. 20m sustained auditory + spatial tracking',
    pegsTarget: 'Mnemonic Pegs (20m): Major System 0–9 single digits & 00–29 pegs automated',
    symbolTarget: 'Symbol Detective (20m): High-speed glyph discrimination & visual feature binding',
    superpowerUnlocked: 'Noise-Resistant Focus, Zero Subvocalization Friction & Rapid Deep Work Entry',
    neuroDescription:
      'Locus Coeruleus norepinephrine calibration and rapid downregulation of Default Mode Network (DMN) mind-wandering circuits.',
    skills: [
      'Involuntary eye darting drops by 70%; saccadic eye movements stabilize',
      'Mental friction to deep work drops from 15 minutes to under 2 minutes',
      'Active listening: conversational train of thought remains airtight without drift',
    ],
  },
  {
    day: 60,
    monthEquivalent: 'Month 2',
    cumulativeHours: '60 Hours',
    phase: 'Phase 2: Working RAM & Visual Speed',
    title: 'Working Memory Doubling & Visual Speed',
    populationTier: 'Top 5% Memory Athlete Tier',
    ramTarget: 'Dual N-Back (20m): N=2 mastered at 90%+ accuracy without proactive interference',
    pegsTarget: 'Mnemonic Pegs (20m): Major System 00–59 automated into vivid tangible objects',
    symbolTarget: 'Symbol Detective (20m): Sub-second glyph discrimination; spotting micro-deviations',
    superpowerUnlocked: 'Instantaneous Numerical Key Conversion & Eradication of Conversational Filler Words',
    neuroDescription:
      'Visual Word Form Area (VWFA) synaptic strengthening and bilateral Dorsolateral Prefrontal Cortex (DLPFC) multi-threading efficiency.',
    skills: [
      'Filler words ("um", "uh", "like") drop by over 60%; working memory holds sentences before speaking',
      'Numbers and passwords transform into immediate 3D tangible visual objects in seconds',
      'High-speed visual recognition catches typographical and formatting anomalies in a single glance',
    ],
  },
  {
    day: 90,
    monthEquivalent: 'Month 3',
    cumulativeHours: '90 Hours',
    phase: 'Phase 2: Milestone Horizon',
    title: 'Sub-Second Peg Encoding & Dual N-Back N=3 Threshold',
    populationTier: 'Top 2% High-Density Focus Tier',
    isTierMilestone: true,
    tierHighlight: '🎯 90 Hours of Deliberate Focus: Top 2% Working Memory & Encoding!',
    ramTarget: 'Dual N-Back (20m): N=2 flawless / N=3 unlocked. Working RAM holds 6+ transient items',
    pegsTarget: 'Mnemonic Pegs (20m): Full 00–99 Major System mastered! Sub-second 2-digit number encoding',
    symbolTarget: 'Symbol Detective (20m): Micro-anomaly scanning across dense abstract symbol arrays',
    superpowerUnlocked: 'Total Numerical Sovereignty & Multi-Variable Logic Active in Mental RAM',
    neuroDescription:
      'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density increase and working memory buffer myelination.',
    skills: [
      'Complete 00–99 phonetic peg table automated: any number from 00 to 99 encodes in < 1 second',
      'Multi-variable logic, complex equations, and code trees held in mental RAM without scratch paper',
      'Crisp cadence and structured verbal delivery: you speak with natural, persuasive authority',
    ],
  },
  {
    day: 180,
    monthEquivalent: 'Month 6 (The 1-in-1,000 Horizon)',
    cumulativeHours: '180 Hours',
    phase: 'Phase 3: High-Density Synaptic Architecture',
    title: 'TOP 0.1% REACHED: The 1 in 1,000 Memory Athlete',
    populationTier: 'TOP 0.1% GLOBAL TIER (1 in 1,000)',
    isTierMilestone: true,
    tierHighlight: '🎯 1 in 1,000 Global Tier Achieved via 180 Hours of Deliberate Practice!',
    ramTarget: 'Dual N-Back (20m): N=3 flawless / N=4 mastery. Working memory in top 0.1% of humanity',
    pegsTarget: 'Mnemonic Pegs (20m): Instantaneous 00–99 conversion at under 500ms; multi-digit streams',
    symbolTarget: 'Symbol Detective (20m): Photographic-speed glyph classification; lightning visual search',
    superpowerUnlocked: 'Photographic-Speed Information Intake & Verbatim Conversational Memory',
    neuroDescription:
      'Oligodendrocyte-driven myelination of the Superior Longitudinal Fasciculus, making structural cognitive gains permanent.',
    skills: [
      'Assimilation curves compress from months to days; technical books indexed into mental schemas',
      'Dialectic dominance: flawless recall of facts, numbers, dates, and verbatim quotations in meetings',
      'Unshakeable intellectual sovereignty: immune to stress, cognitive fatigue, or panic under pressure',
    ],
  },
  {
    day: 270,
    monthEquivalent: 'Month 9 (Polymathic Synthesis)',
    cumulativeHours: '270 Hours',
    phase: 'Phase 3: Sovereign Automaticity',
    title: 'Cross-Domain RAM & Polymathic Synthesis',
    populationTier: 'Top 0.02% Dialectic Master Tier',
    ramTarget: 'Dual N-Back (20m): N=4 flawless / N=5 entry. Exceptional multi-modal working RAM',
    pegsTarget: 'Mnemonic Pegs (20m): Flawless numerical data bank: phone numbers, coordinates, dates recalled',
    symbolTarget: 'Symbol Detective (20m): Instantaneous glyph translation and high-velocity pattern decoding',
    superpowerUnlocked: 'Living Encyclopedic RAM & Parallel Fluency Across 3+ Divergent Technical Domains',
    neuroDescription:
      'Neocortical distributed semantic network crystallization across both cerebral hemispheres.',
    skills: [
      'Photographic blueprint retention: complex schematics and code architectures mapped in 1–2 sweeps',
      'Rapid cross-pollination between completely separate fields (technology, linguistics, finance)',
      'Luminous spoken rhetoric: multi-step arguments woven effortlessly with memorable, vivid clarity',
    ],
  },
  {
    day: 330,
    monthEquivalent: 'Month 11 (The 0.01% Breakthrough)',
    cumulativeHours: '330 Hours',
    phase: 'Phase 4: Sovereign Outlier',
    title: 'TOP 0.01% UNLOCKED: The 1 in 10,000 Mind',
    populationTier: 'TOP 0.01% GLOBAL TIER (1 in 10,000)',
    isTierMilestone: true,
    tierHighlight: '⚡ Top 0.01% Breakthrough Horizon (1 in 10,000 Human Beings)',
    ramTarget: 'Dual N-Back (20m): N=5 stabilized. Working memory capacity among top 1 in 10,000 humans',
    pegsTarget: 'Mnemonic Pegs (20m): Complete numerical sovereignty; limitless capacity without decay',
    symbolTarget: 'Symbol Detective (20m): Script & symbol parsing at lightning velocity; formal system fluency',
    superpowerUnlocked: 'Instantaneous Complex System Comprehension & Total Attentional Immunity',
    neuroDescription:
      'Long-term gray matter density increase across the bilateral DLPFC, anterior insula, and hippocampus.',
    skills: [
      'Master complete programming stacks or technical curricula in weekends with verified high retention',
      'Panoramic multi-sensory synthesis: visual, auditory, and spatial inputs form a seamless real-time model',
      'Transcendent mental horsepower with zero cognitive burnout, fatigue, or brain fog',
    ],
  },
  {
    day: 365,
    monthEquivalent: 'Month 12 (Full-Year Completion)',
    cumulativeHours: '365 Hours',
    phase: 'Phase 4: Sovereign Grandmaster',
    title: 'The Sovereign Mind: Top 0.005% Memory Grandmaster',
    populationTier: 'TOP 0.005% GLOBAL TIER (1 in 20,000 Sovereign)',
    isTierMilestone: true,
    tierHighlight: '👑 360+ Hours Complete: Irreversible Biological Operating System Upgrade',
    ramTarget: 'Dual N-Back (20m): N=5 / N=6 Peak RAM, multi-threaded executive buffer',
    pegsTarget: 'Mnemonic Pegs (20m): Instantaneous 00–99 phonetic peg table as automated internal co-processor',
    symbolTarget: 'Symbol Detective (20m): Master-level symbol discrimination; instant anomaly identification',
    superpowerUnlocked: 'Permanent Biological Co-Processor, Photographic-Speed Mastery & Lifetime Sovereign Mind',
    neuroDescription:
      'Permanent neurostructural consolidation. Longitudinal gray matter density and white-matter tract integrity are physically and permanently enhanced for life.',
    skills: [
      'World-class cognitive grandmaster baseline: competitive speed card & number feats on demand',
      'Absorb, index, and permanently retain full domains of human knowledge at will',
      'Zero brain fog for life: optimized circadian rhythm, laser focus, and attentional sovereignty',
    ],
  },
];

interface MonthlyDetail {
  month: number;
  quarter: string;
  hours: string;
  tier: string;
  headline: string;
  personType: string;
  ramGoal: string;
  pegsGoal: string;
  symbolGoal: string;
  cognitiveShift: string;
  neuroScience: string;
}

const MONTH_BY_MONTH: MonthlyDetail[] = [
  {
    month: 1,
    quarter: 'Q1: Foundation',
    hours: '30 Hours',
    tier: 'Top 15% Discipline',
    headline: 'Saccadic Calibration & Distraction Purge',
    personType: 'The Noise-Resistant Strategist',
    ramGoal: 'Dual N-Back (20m): N=1 solid / N=2 intro. Sustained auditory & spatial tracking.',
    pegsGoal: 'Mnemonic Pegs (20m): Major System 0–9 single digits & 00–29 pegs automated.',
    symbolGoal: 'Symbol Detective (20m): High-speed glyph discrimination & visual feature binding.',
    cognitiveShift: 'Involuntary phone-checking impulses collapse. Reading focus steadies; brain fog clears.',
    neuroScience: 'Downregulation of Default Mode Network (DMN) mind-wandering circuits.',
  },
  {
    month: 2,
    quarter: 'Q1: Foundation',
    hours: '60 Hours',
    tier: 'Top 5% Memory Athlete',
    headline: 'Working Memory Doubling & Visual Speed',
    personType: 'The Perceptive Observer',
    ramGoal: 'Dual N-Back (20m): N=2 mastered at 90%+ accuracy without proactive interference.',
    pegsGoal: 'Mnemonic Pegs (20m): Major System 00–59 automated into vivid tangible objects.',
    symbolGoal: 'Symbol Detective (20m): Sub-second glyph discrimination; spotting micro-deviations.',
    cognitiveShift: 'Formatting flaws and visual anomalies spotted instantly. Filler words drop by 60%.',
    neuroScience: 'Visual Word Form Area (VWFA) synaptic strengthening and bilateral DLPFC efficiency.',
  },
  {
    month: 3,
    quarter: 'Q1: Foundation',
    hours: '90 Hours',
    tier: 'Top 2% High-Density Focus',
    headline: 'Sub-Second Peg Encoding & Dual N-Back N=3 Threshold',
    personType: 'The Rapid Precision Encoder',
    ramGoal: 'Dual N-Back (20m): N=2 flawless / N=3 unlocked. Working RAM holds 6+ transient items.',
    pegsGoal: 'Mnemonic Pegs (20m): Full 00–99 Major System mastered! Sub-second 2-digit number encoding.',
    symbolGoal: 'Symbol Detective (20m): Micro-anomaly scanning across dense abstract symbol arrays.',
    cognitiveShift: 'Deliver structured technical arguments without notes. Multi-variable logic held in mental RAM.',
    neuroScience: 'Dorsolateral Prefrontal Cortex (DLPFC) dopamine D1 receptor density surge.',
  },
  {
    month: 4,
    quarter: 'Q2: Acceleration',
    hours: '120 Hours',
    tier: 'Top 1% Cognitive Operator',
    headline: 'Multi-Threaded Thinking & Script Fluency',
    personType: 'The Multi-Threaded Architect',
    ramGoal: 'Dual N-Back (20m): N=3 consolidated (80%+). Zero interference between visual & auditory streams.',
    pegsGoal: 'Mnemonic Pegs (20m): Compound 4-digit number chunking (combining two pegs into action scenes).',
    symbolGoal: 'Symbol Detective (20m): Ultra-fast glyph anomaly isolation; abstract notation feels intuitive.',
    cognitiveShift: 'Hyper-acute situational awareness; complex programming and logic trees organized in mental workspace.',
    neuroScience: 'Hippocampal CA3-CA1 Long-Term Potentiation (LTP) and bilateral spatial network expansion.',
  },
  {
    month: 5,
    quarter: 'Q2: Acceleration',
    hours: '150 Hours',
    tier: 'Top 0.5% Memory Specialist',
    headline: 'Cognitive Endurance & Structural Synthesis',
    personType: 'The High-Order Synthesizer',
    ramGoal: 'Dual N-Back (20m): N=3 high-precision (88%+), introducing N=4 stress trials.',
    pegsGoal: 'Mnemonic Pegs (20m): Sub-second 00–99 pegging across random digit streams; zero phonetic decay.',
    symbolGoal: 'Symbol Detective (20m): Complex multi-symbol discrimination; high-speed error detection under fatigue.',
    cognitiveShift: 'Cross-disciplinary synthesis accelerates; speech is crisp, authoritative, perfectly timed, and persuasive.',
    neuroScience: 'Frontoparietal Control Network (FPCN) hyper-coupling for instantaneous structural synthesis.',
  },
  {
    month: 6,
    quarter: 'Q2: Acceleration',
    hours: '180 Hours',
    tier: '🎯 TOP 0.1% GLOBAL (1 in 1,000 Milestone)',
    headline: 'Permanent Myelination & The 1-in-1,000 Milestone',
    personType: 'The Cognitive Outlier (1 in 1,000)',
    ramGoal: 'Dual N-Back (20m): N=3 flawless / N=4 mastery. Working memory in top 0.1% of humanity.',
    pegsGoal: 'Mnemonic Pegs (20m): Instantaneous 00–99 conversion at under 500ms; multi-digit strings encoded on the fly.',
    symbolGoal: 'Symbol Detective (20m): Photographic-speed glyph classification; lightning-fast visual search.',
    cognitiveShift: 'Magnetic presence, airtight dialectic structure, and extraordinary working memory retention.',
    neuroScience: 'Oligodendrocyte-driven myelination of the Superior Longitudinal Fasciculus.',
  },
  {
    month: 7,
    quarter: 'Q3: Elite Mastery',
    hours: '210 Hours',
    tier: 'Top 0.05% Elite Tier',
    headline: 'Neuro-Synaptic Consolidation & Hyper-Fluidity',
    personType: 'The Automatic Processor',
    ramGoal: 'Dual N-Back (20m): N=4 consistent. Auditory letter and spatial square streams process like reflexes.',
    pegsGoal: 'Mnemonic Pegs (20m): 3-digit composite associations (Person-Action-Object integration via Major pegs).',
    symbolGoal: 'Symbol Detective (20m): Micro-temporal anomaly detection; noticing visual inconsistencies before realization.',
    cognitiveShift: 'Effortless multi-domain vocabulary access; dense technical papers read like novels with zero strain.',
    neuroScience: 'Striatal basal ganglia automaticity recruitment, freeing cortical bandwidth for meta-reasoning.',
  },
  {
    month: 8,
    quarter: 'Q3: Elite Mastery',
    hours: '240 Hours',
    tier: 'Top 0.03% Polymath Tier',
    headline: 'Cognitive Immunity & Prefrontal Hegemony',
    personType: 'The Emotionally Immovable Thinker',
    ramGoal: 'Dual N-Back (20m): N=4 mastery (85%+ accuracy). Immune to proactive interference or distraction.',
    pegsGoal: 'Mnemonic Pegs (20m): Phonetic pegging velocity < 400ms per item. High-density numerical memorization.',
    symbolGoal: 'Symbol Detective (20m): Abstract script transcription; rapid visual decoding of non-standard notation.',
    cognitiveShift: 'Absolute gaze lock and visual impulse control; external chaos only amplifies your internal stillness.',
    neuroScience: 'Anterior Cingulate Cortex (ACC) error-monitoring perfection and hyper-coupling to amygdala.',
  },
  {
    month: 9,
    quarter: 'Q3: Elite Mastery',
    hours: '270 Hours',
    tier: 'Top 0.02% Dialectic Master',
    headline: 'Cross-Domain RAM & Polymathic Synthesis',
    personType: 'The Polymathic Mind',
    ramGoal: 'Dual N-Back (20m): N=4 flawless / N=5 entry. Exceptional working memory bandwidth.',
    pegsGoal: 'Mnemonic Pegs (20m): Flawless numerical data bank: phone numbers, coordinates, dates recalled on demand.',
    symbolGoal: 'Symbol Detective (20m): Instantaneous glyph structure translation and high-velocity pattern decoding.',
    cognitiveShift: 'Parallel mastery across 3+ unrelated disciplines (coding, finance, linguistics) with instant transfer.',
    neuroScience: 'Neocortical distributed semantic network crystallization across both cerebral hemispheres.',
  },
  {
    month: 10,
    quarter: 'Q4: Sovereign Tier',
    hours: '300 Hours',
    tier: 'Top 0.015% High-Velocity Specialist',
    headline: 'Iconic Flash Mastery & Micro-Temporal Precision',
    personType: 'The Sub-Second Analytical Master',
    ramGoal: 'Dual N-Back (20m): N=5 transition. Handling 10+ active multi-modal tokens simultaneously.',
    pegsGoal: 'Mnemonic Pegs (20m): Sub-300ms number-to-image encoding; numbers feel as natural as spoken words.',
    symbolGoal: 'Symbol Detective (20m): Microsecond glyph discrimination; spotting microscopic errors across massive blocks.',
    cognitiveShift: 'Conversational anticipation: predict questions, hesitations, and objections seconds in advance.',
    neuroScience: 'Gamma-band (40Hz) neural phase synchronization between visual and executive hubs.',
  },
  {
    month: 11,
    quarter: 'Q4: Sovereign Tier',
    hours: '330 Hours',
    tier: '⚡ TOP 0.01% (1 in 10,000 Mind)',
    headline: 'Top 0.01% Breakthrough (The 1 in 10,000 Mind)',
    personType: 'The Sovereign Intellectual Outlier',
    ramGoal: 'Dual N-Back (20m): N=5 stabilized. Working memory capacity among top 1 in 10,000 humans.',
    pegsGoal: 'Mnemonic Pegs (20m): Complete numerical sovereignty; limitless capacity for numerical data without decay.',
    symbolGoal: 'Symbol Detective (20m): Script & symbol parsing at lightning velocity; formal system fluency.',
    cognitiveShift: 'Master complex domains in 30 days; articulate complex abstractions with effortless simplicity.',
    neuroScience: 'Long-term bilateral DLPFC and hippocampal gray-matter volume expansion.',
  },
  {
    month: 12,
    quarter: 'Q4: Sovereign Tier',
    hours: '360 Hours',
    tier: '👑 TOP 0.005% GLOBAL (1 in 20,000 Grandmaster)',
    headline: 'The Sovereign Mind (360 Hours of Neuro-Transformation)',
    personType: 'The Sovereign Mind (Top 0.005% Grandmaster)',
    ramGoal: 'Dual N-Back (20m): N=5 / N=6 Peak RAM, multi-threaded executive buffer.',
    pegsGoal: 'Mnemonic Pegs (20m): Instantaneous 00–99 phonetic peg table as automated internal co-processor.',
    symbolGoal: 'Symbol Detective (20m): Master-level symbol discrimination; instant anomaly identification.',
    cognitiveShift: 'A permanent second biological processor. Flawless recall, deep empathy, and razor-sharp intellect for life.',
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
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  Yosi's 1h Daily Protocol (3 × 20m)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  Created for Yoseph
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact roadmap from baseline to <strong>Top 0.1% (Month 6)</strong> and <strong>Top 0.01% (Month 11)</strong> via Mnemonic Pegs, Dual N-Back & Symbol Detective
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M3
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Top 2% Focus
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  <strong>Month 3 (Day 90)</strong> at 90h
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M6
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Top 0.1% (1 in 1,000)
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  <strong>Month 6 (Day 180)</strong> at 180h
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold font-mono">
                M11
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Top 0.01% (1 in 10,000)
                </span>
                <span className="text-slate-200 font-semibold text-[11px]">
                  <strong>Month 11 (Day 330)</strong> at 330h
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
                  Permanent Sovereign at <strong>360h</strong>
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

                      {/* 1-Hour 3-Discipline Breakdown (3 × 20m) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
                        <div className="bg-slate-950/90 border border-sky-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-sky-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <Brain className="w-3 h-3" /> Dual N-Back Buffer (20m)
                          </span>
                          <span className="text-sky-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.ramTarget}
                          </span>
                        </div>

                        <div className="bg-slate-950/90 border border-amber-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-amber-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Mnemonic Pegs (20m)
                          </span>
                          <span className="text-amber-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.pegsTarget}
                          </span>
                        </div>

                        <div className="bg-slate-950/90 border border-pink-500/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-pink-400 block uppercase font-sans font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Symbol Detective (20m)
                          </span>
                          <span className="text-pink-200 text-[11px] font-medium leading-tight block mt-0.5">
                            {m.symbolTarget}
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

                  {/* Type of Person Yoseph Becomes This Month */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-cyan-500/20 border border-amber-500/40 mb-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        Type of Person Yoseph Becomes in Month {currentMonth.month}:
                      </span>
                      <strong className="text-white text-base font-black tracking-tight">
                        {currentMonth.personType}
                      </strong>
                    </div>
                  </div>

                  {/* 3 Pillars for the Month */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs mb-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30">
                      <span className="font-bold text-sky-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" /> Dual N-Back Buffer (20m)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.ramGoal}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                      <span className="font-bold text-amber-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Mnemonic Pegs (20m)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.pegsGoal}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-pink-500/30">
                      <span className="font-bold text-pink-400 block text-xs uppercase mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Symbol Detective (20m)
                      </span>
                      <p className="text-slate-300 leading-relaxed">{currentMonth.symbolGoal}</p>
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

        {/* Tab 3: The 1-Hour Cognitive Engine Architecture */}
        {activeTab === 'architecture' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
            
            {/* The 1-Hour Tri-Discipline Formula */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Why Yoseph's 3 Disciplines (20m + 20m + 20m) Form the Ultimate Cognitive Engine
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Rather than sprawling over dozens of superficial memory games or exhaustive 4-hour fatigue, Yoseph's 60-minute daily regimen focuses 100% of conscious metabolic energy on the three foundational pillars of human high intelligence:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Mnemonic Major Pegs (20m)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 block mb-1">
                    Number-to-Image Data Keys
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Transforms abstract numbers, codes, dates, and passwords into instant 3D sensory images. Builds the phonetic consonant-to-digit neurological transcription bridge in the left hemisphere.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/30">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-1.5">
                    <Brain className="w-4 h-4 text-sky-400" />
                    <span>Dual N-Back Buffer (20m)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-sky-400/80 block mb-1">
                    Working Memory & Speaking Focus
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Expands the Dorsolateral Prefrontal Cortex (DLPFC) multi-threaded executive RAM buffer. Directly eliminates verbal filler words, eradicates proactive interference, and grounds conversational fluency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-pink-500/30">
                  <div className="flex items-center gap-2 text-pink-300 font-bold text-sm mb-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Symbol Detective Lab (20m)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-pink-400/80 block mb-1">
                    Abstract Symbol Speed & Script
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Calibrates the Occipito-temporal Visual Word Form Area (VWFA). Trains micro-temporal glyph discrimination, rapid script scanning, and instant anomaly isolation across complex technical documents.
                  </p>
                </div>
              </div>
            </div>

            {/* Neuroplastic Consolidation & Consistency */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  The Power of 60 Minutes Daily: The Neurobiology of Habit Compounding
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                In cognitive neuroscience, one hour of ultra-dense deliberate practice per day produces significantly higher long-term neuroplastic adaptation than sporadic long sessions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider block mb-1">
                    ⚡ 30 Hours Per Month (360 Hours / Year)
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li>• Zero cognitive burnout: 20 minutes per discipline preserves peak attentional vigilance.</li>
                    <li>• Nightly synaptic homeostasis: slow-wave sleep consolidates each day's gains permanently.</li>
                    <li>• 12 AM reset lockout guarantees adequate biological recovery.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
                  <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider block mb-1">
                    🛡️ Seamless Cross-Device Sync
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li>• Synchronized in real time across Yoseph's 2 mobile phones and PC.</li>
                    <li>• Practice Mnemonic Pegs on mobile during commute, Dual N-Back on desktop at desk, and Symbol Detective anytime.</li>
                    <li>• Cloud synchronization preserves streaks and XP across every device.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            1h/day deliberate protocol reaches <strong>Top 0.1% in Month 6</strong> and breaks into <strong>Top 0.01% by Month 11</strong>.
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
