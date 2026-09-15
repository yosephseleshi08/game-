import React from 'react';
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
} from 'lucide-react';

interface Milestone {
  day: number;
  phase: string;
  title: string;
  populationTier: string;
  dualNBackTarget: string;
  encodingSpeed: string;
  lociCapacity: string;
  superpowerUnlocked: string;
  neuroDescription: string;
  skills: string[];
}

const MILESTONES: Milestone[] = [
  {
    day: 7,
    phase: 'Phase 1: Initial Scaffolding',
    title: 'The Neural Awakening',
    populationTier: 'Top 30% Cognitive Discipline',
    dualNBackTarget: 'N=2 Consolidation',
    encodingSpeed: '3.0s per peg',
    lociCapacity: '5 Anchor Loci',
    superpowerUnlocked: 'Elimination of Daytime Brain Fog & Enhanced Initial Focus',
    neuroDescription:
      'Dorsolateral prefrontal cortex (DLPFC) begins adapting to dual-stream cognitive load. You overcome initial mental fatigue.',
    skills: [
      'Automatic Major System 0–9 single digit mapping',
      'Holding simultaneous audio & visual tracks without dropping context',
      'Short-term visual trace retention extended to 800ms',
    ],
  },
  {
    day: 30,
    phase: 'Phase 1: Foundation Complete',
    title: 'The Subvocalization Breaker',
    populationTier: 'Top 10% Memory Competence',
    dualNBackTarget: 'N=2 Flawless / N=3 Intro',
    encodingSpeed: '1.5s per peg',
    lociCapacity: '20 Solidified Loci',
    superpowerUnlocked: 'Memorize 20-Item Lists on a Single Pass',
    neuroDescription:
      'Subvocal speech centers are bypassed. Numbers and concepts trigger direct visual images rather than internal audio self-talk.',
    skills: [
      '00–49 Major System reflex locked into subconscious',
      '1st complete Memory Palace (e.g. childhood home) permanently indexed',
      'Ability to study technical material with 2x fewer re-reads',
    ],
  },
  {
    day: 60,
    phase: 'Phase 2: The Subconscious Shift',
    title: 'High-Bandwidth Working RAM',
    populationTier: 'Top 3% Working Memory Capacity',
    dualNBackTarget: 'Consistent N=3',
    encodingSpeed: '1.0s per peg',
    lociCapacity: '40 Loci (2 Distinct Palaces)',
    superpowerUnlocked: 'Simultaneous Multi-Threaded Problem Solving',
    neuroDescription:
      'Frontoparietal attentional networks physically thicken. Working memory RAM handles 5–6 interdependent conceptual abstractions.',
    skills: [
      '00–99 Full 2-digit Major System completely automated',
      'Effortless recall of 16-digit credit cards, pins, and complex passphrases',
      'Chimp test speed: capturing 7 random spatial digits in 400ms flash',
    ],
  },
  {
    day: 90,
    phase: 'Phase 2: Milestone Horizon',
    title: 'The Mnemonic Dynamo',
    populationTier: 'Top 1% Memorization Velocity',
    dualNBackTarget: 'N=3 High Accuracy (85%+)',
    encodingSpeed: '750ms per peg',
    lociCapacity: '60 Loci across 3 Palaces',
    superpowerUnlocked: 'Accelerated Foreign Language Vocabulary (30 words/day)',
    neuroDescription:
      'Instantaneous Keyword Mnemonic Association: foreign sounds link to visual anchors on a single exposure without rote drilling.',
    skills: [
      'Keyword method enables conversational language basics in weeks',
      'Holding full programming architecture or algorithmic tree in mental RAM',
      'Spaced repetition retention rate surges past 92% on SM-2 reviews',
    ],
  },
  {
    day: 180,
    phase: 'Phase 3: High-Density Encoding',
    title: 'The Cognitive Athlete',
    populationTier: 'Top 0.2% Cognitive Capability',
    dualNBackTarget: 'N=4 Initial Breakthrough',
    encodingSpeed: '500ms per peg',
    lociCapacity: '100+ Loci across 5 Palaces',
    superpowerUnlocked: 'Total Lecture or Presentation Recall Without Notes',
    neuroDescription:
      'Extreme synaptic efficiency. High hippocampal-prefrontal synchronization allows structural encoding of hours of information.',
    skills: [
      'Deliver 45-minute presentations seamlessly by walking mental rooms',
      'Memorize a full 52-card shuffled deck in under 3 minutes',
      'Ayumu flash test: snapshotting 8–9 spatial positions in 210ms',
    ],
  },
  {
    day: 365,
    phase: 'Phase 4: Grandmaster Mastery',
    title: 'The Top 0.1% Memory Genius',
    populationTier: 'Top 0.1% Global Tier (1 in 1,000)',
    dualNBackTarget: 'N=4 / N=5 Mastery',
    encodingSpeed: '< 350ms (Near-Zero Latency)',
    lociCapacity: '200+ Master Loci Network',
    superpowerUnlocked: 'Photographic-Speed Information Absorption & Polyglot Engine',
    neuroDescription:
      'Permanent neurostructural consolidation. Deep spatial mapping and working memory operate as a biological second processor.',
    skills: [
      'Learn complex professional domains (coding, medicine, law) at 5x normal human speed',
      'Master 2,000–3,000 foreign language words in months with high retention',
      'Unshakable working memory: zero mental fog under high cognitive stress',
      'World Memory Championship candidate-level baseline',
    ],
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-cyan-500/20">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  The 365-Day Genius Roadmap
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  Top 0.1% Blueprint
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact milestone skills and neurological adaptations unlocked through your daily protocol
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Progress Pill Indicator */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white">Current Journey:</span>
            <span className="text-cyan-400 font-mono font-bold">Day {currentDay} of 365</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Target: <strong className="text-emerald-400">12:00 PM Daily Protocol</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">
              Destination: <strong className="text-amber-300">Top 0.1% Memory Athlete</strong>
            </span>
          </div>
        </div>

        {/* Milestone Timeline Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
            {MILESTONES.map((m, idx) => {
              const isPast = currentDay >= m.day;
              const isCurrent = currentDay < m.day && (idx === 0 || currentDay >= MILESTONES[idx - 1].day);

              return (
                <div key={m.day} className="relative group">
                  {/* Timeline dot / badge */}
                  <div
                    className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      isPast
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
                      isPast
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
                            isPast
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              : isCurrent
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          DAY {m.day}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{m.phase}</span>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {m.populationTier}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {m.neuroDescription}
                    </p>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
                      <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">
                          Working Memory RAM
                        </span>
                        <span className="text-cyan-400 font-bold">{m.dualNBackTarget}</span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">
                          Major System Speed
                        </span>
                        <span className="text-emerald-400 font-bold">{m.encodingSpeed}</span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">
                          Palace Infrastructure
                        </span>
                        <span className="text-indigo-400 font-bold">{m.lociCapacity}</span>
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
                        Concrete Cognitive Milestones:
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Consistently completing your 12:00 PM protocol ensures every milestone is achieved.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
          >
            Back to Training
          </button>
        </div>
      </div>
    </div>
  );
};
