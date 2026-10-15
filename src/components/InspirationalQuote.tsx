import React, { useState, useMemo, useEffect } from 'react';
import { sound } from '../utils/audio';
import { Quote, RefreshCw, Copy, Check, Brain, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export interface CognitiveQuote {
  quote: string;
  author: string;
  role: string;
  discipline: string;
}

export const COGNITIVE_QUOTES: CognitiveQuote[] = [
  {
    quote: "Every human being, if he so desires, can become the sculptor of his own brain.",
    author: "Santiago Ramón y Cajal",
    role: "Nobel Laureate & Father of Modern Neuroscience",
    discipline: "Neuroplasticity",
  },
  {
    quote: "Memory is the treasury and guardian of all things.",
    author: "Marcus Tullius Cicero",
    role: "Roman Statesman & Mnemonic Pioneer",
    discipline: "Method of Loci",
  },
  {
    quote: "Neurons that fire together, wire together. Deliberate repetition transforms fleeting signals into permanent architecture.",
    author: "Donald Hebb",
    role: "Pioneering Neuropsychologist",
    discipline: "Synaptic Plasticity",
  },
  {
    quote: "Monotony collapses time; novelty unfolds it. Creating vivid memory is creating conscious life.",
    author: "Joshua Foer",
    role: "US Memory Champion & Journalist",
    discipline: "Eidetic Encoding",
  },
  {
    quote: "The brain is an organic, adaptive engine of limitless configuration. Expand its working buffer and you expand your world.",
    author: "John von Neumann",
    role: "Mathematician & Polymath",
    discipline: "Working Memory Capacity",
  },
  {
    quote: "The art of remembering is the art of thinking. What is deeply understood is effortlessly retained.",
    author: "William James",
    role: "Father of Modern Psychology",
    discipline: "Cognitive Psychology",
  },
  {
    quote: "Memory is the glue that binds our mental life, the scaffolding of consciousness itself.",
    author: "Eric Kandel",
    role: "Nobel Laureate in Physiology",
    discipline: "Synaptic Storage",
  },
  {
    quote: "The secret of a super memory is transforming abstract symbols into vivid, multisensory spatial journeys.",
    author: "Dominic O'Brien",
    role: "8-Time World Memory Champion",
    discipline: "Mnemonic Peg Systems",
  },
  {
    quote: "Just as iron rusts from disuse, even so does inaction spoil the intellect.",
    author: "Leonardo da Vinci",
    role: "Renaissance Polymath & Artist",
    discipline: "Cognitive Agility",
  },
  {
    quote: "Testing and retrieving memory does not merely measure what you know; it fundamentally alters and strengthens the neural trace.",
    author: "Henry Roediger",
    role: "Cognitive Memory Scientist",
    discipline: "Active Retrieval Practice",
  },
  {
    quote: "It is frequent deliberate repetition that produces a natural tendency in memory. Habit is a second nature.",
    author: "Aristotle",
    role: "Classical Philosopher",
    discipline: "Deliberate Practice",
  },
  {
    quote: "The photographic gaze is not a passive mirror; it is an active, focused aperture of intense attention.",
    author: "Alexander Luria",
    role: "Neuropsychologist & Synesthesia Pioneer",
    discipline: "Eidetic Trace",
  },
  {
    quote: "Working memory is the workbench of the human mind. The larger the buffer, the more complex the problems you can solve effortlessly.",
    author: "Alan Baddeley",
    role: "Architect of the Working Memory Model",
    discipline: "Executive Function",
  },
  {
    quote: "Attention is the doorway to memory. Whatever you attend to deeply is etched forever into the bedrock of the mind.",
    author: "Matthew Walker",
    role: "Neuroscientist & Sleep Researcher",
    discipline: "Neural Consolidation",
  },
  {
    quote: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    role: "Philosopher & Teacher",
    discipline: "Incremental Mastery",
  },
  {
    quote: "In the palace of memory, there are no lost objects—only those placed in rooms we have not yet revisited.",
    author: "Matteo Ricci",
    role: "Scholar & Mnemonic Architect",
    discipline: "The Memory Palace",
  },
  {
    quote: "Speed in cognition is not haste; it is the total absence of unnecessary friction.",
    author: "Garry Kasparov",
    role: "World Chess Champion",
    discipline: "Pattern Recognition",
  },
  {
    quote: "We don't rise to the level of our expectations, we fall to the level of our training.",
    author: "Archilochus",
    role: "Greek Poet & Philosopher",
    discipline: "Cognitive Stamina",
  },
  {
    quote: "Visual memory is the most powerful memory humans possess. When you anchor ideas to space and image, retention becomes automatic.",
    author: "Frances Yates",
    role: "Historian of The Art of Memory",
    discipline: "Spatial Mnemonic Systems",
  },
  {
    quote: "Concentration is the secret of strength in politics, in war, in trade, in short in all management of human affairs.",
    author: "Ralph Waldo Emerson",
    role: "Philosopher & Essayist",
    discipline: "Focused Attention",
  },
  {
    quote: "The limits of your working memory are not fixed by biology; they are shaped by the richness of your chunking strategies.",
    author: "Herbert A. Simon",
    role: "Nobel Laureate & Cognitive Scientist",
    discipline: "Information Chunking",
  },
  {
    quote: "Our brain possesses the remarkable ability to rewire its circuitry in response to focused training throughout our entire lifetime.",
    author: "Michael Merzenich",
    role: "Pioneer in Brain Plasticity",
    discipline: "Neuroplasticity",
  },
  {
    quote: "Mental toughness is many things and rather difficult to explain. Its qualities are sacrifice and self-denial. Also, most importantly, it is combined with a perfectly disciplined will that refuses to give in.",
    author: "Vince Lombardi",
    role: "Legendary Coach",
    discipline: "Athletic Grit",
  },
  {
    quote: "The ability to hold multiple representations in mind and manipulate them simultaneously is the hallmark of human genius.",
    author: "Stanislas Dehaene",
    role: "Cognitive Neuroscientist",
    discipline: "Dual N-Back Processing",
  },
];

interface InspirationalQuoteProps {
  curriculumDay?: number;
}

export const InspirationalQuote: React.FC<InspirationalQuoteProps> = ({
  curriculumDay = 1,
}) => {
  // Deterministic daily index based on today's calendar date and curriculum day
  const defaultIndex = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.abs((dayOfYear * 7 + curriculumDay) % COGNITIVE_QUOTES.length);
  }, [curriculumDay]);

  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inspirational_quote_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Keep in sync with day change
  useEffect(() => {
    setCurrentIndex(defaultIndex);
  }, [defaultIndex]);

  const activeQuote = COGNITIVE_QUOTES[currentIndex % COGNITIVE_QUOTES.length];

  const handleNextQuote = () => {
    sound.playClick();
    setCurrentIndex((prev) => (prev + 1) % COGNITIVE_QUOTES.length);
  };

  const handleCopyQuote = () => {
    sound.playClick();
    const text = `"${activeQuote.quote}" — ${activeQuote.author} (${activeQuote.discipline})`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleCollapse = () => {
    sound.playClick();
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('inspirational_quote_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <section
      aria-label="Daily Inspirational Quote"
      className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-2.5 pb-1"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800/90 hover:border-cyan-500/30 transition-all p-3 sm:p-4 shadow-sm group">
        {/* Subtle ambient gradient flare */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-2.5 sm:gap-3">
          {/* Quote Icon Badge */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm">
            <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header Metadata Bar */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono uppercase tracking-wider truncate">
                <span className="text-cyan-400 font-bold flex items-center gap-1 shrink-0">
                  <Brain className="w-3 h-3 text-cyan-400" /> Focus
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300 font-medium truncate">{activeQuote.discipline}</span>
                <span aria-hidden="true" className="text-slate-600 hidden xs:inline">·</span>
                <span className="text-slate-500 hidden xs:inline shrink-0">Day {curriculumDay}</span>
              </div>

              {/* Top Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleNextQuote}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                  title="Next cognitive quote"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                  title="Copy quote"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="p-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center"
                  title={isCollapsed ? "Expand quote" : "Collapse quote"}
                >
                  {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Expanded vs Collapsed Quote View */}
            {!isCollapsed ? (
              <div className="space-y-1.5 mt-0.5">
                <p className="text-xs sm:text-sm text-slate-100 font-medium italic leading-relaxed tracking-tight text-balance">
                  "{activeQuote.quote}"
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap pt-0.5">
                  <span className="font-semibold text-white not-italic">{activeQuote.author}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                    {activeQuote.role}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic truncate cursor-pointer" onClick={handleToggleCollapse}>
                "{activeQuote.quote}" — <span className="text-slate-300 font-medium not-italic">{activeQuote.author}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const DailyInspirationalQuote = InspirationalQuote;
export default InspirationalQuote;
