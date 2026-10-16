import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import {
  Quote,
  RefreshCw,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Shield,
  Hammer,
  Mountain,
  Compass,
  Brain,
  Zap,
  Calendar,
} from 'lucide-react';

export type QuoteCategory =
  | 'all'
  | 'discipline'
  | 'hard-work'
  | 'never-give-up'
  | 'struggle'
  | 'motivation'
  | 'life'
  | 'mind';

export interface MotivationalQuote {
  quote: string;
  author: string;
  role: string;
  category: Exclude<QuoteCategory, 'all'>;
  tag: string;
}

// Backward-compatibility alias
export type CognitiveQuote = MotivationalQuote;

export const ALL_QUOTES: MotivationalQuote[] = [
  // ================= DISCIPLINE =================
  {
    quote: "Discipline equals freedom. The more discipline you have in your daily routine, the more freedom you create in your life.",
    author: "Jocko Willink",
    role: "Retired Navy SEAL Commander & Author",
    category: "discipline",
    tag: "Iron Discipline",
  },
  {
    quote: "We must all suffer one of two things: the pain of discipline or the pain of regret. Discipline weighs ounces while regret weighs tons.",
    author: "Jim Rohn",
    role: "Philosopher & Personal Growth Pioneer",
    category: "discipline",
    tag: "Choice of Pain",
  },
  {
    quote: "No man is free who is not master of himself. True freedom begins with governing your own impulses.",
    author: "Epictetus",
    role: "Stoic Philosopher",
    category: "discipline",
    tag: "Self-Mastery",
  },
  {
    quote: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.",
    author: "John C. Maxwell",
    role: "Leadership Author & Speaker",
    category: "discipline",
    tag: "Daily Execution",
  },
  {
    quote: "Once you have perceived the Way you will see it in everything. In battle and in training, do nothing that is of no use.",
    author: "Miyamoto Musashi",
    role: "Legendary Samurai & Author of The Book of Five Rings",
    category: "discipline",
    tag: "Way of the Warrior",
  },
  {
    quote: "Rule your mind or it will rule you. The first and greatest victory is to conquer yourself.",
    author: "Horace",
    role: "Roman Lyric Poet",
    category: "discipline",
    tag: "Mental Sovereignty",
  },
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find immense strength.",
    author: "Marcus Aurelius",
    role: "Roman Emperor & Stoic Philosopher",
    category: "discipline",
    tag: "Inner Citadel",
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
    role: "16th U.S. President",
    category: "discipline",
    tag: "Long-Term Vision",
  },
  {
    quote: "You do not rise to the level of your goals. You fall to the level of your systems and your habits.",
    author: "James Clear",
    role: "Author of Atomic Habits",
    category: "discipline",
    tag: "Atomic Systems",
  },
  {
    quote: "Self-discipline is the magic power that makes you virtually unstoppable in any domain of life.",
    author: "Dan Millman",
    role: "World Champion Athlete & Author",
    category: "discipline",
    tag: "Unstoppable Will",
  },

  // ================= HARD WORK =================
  {
    quote: "Great things come from hard work and perseverance. No excuses. If you want it, outwork everyone in the gym and in the mind.",
    author: "Kobe Bryant",
    role: "5-Time NBA Champion & Mamba Mentality Creator",
    category: "hard-work",
    tag: "Mamba Mentality",
  },
  {
    quote: "Genius is one percent inspiration and ninety-nine percent perspiration. There is no substitute for tireless labor.",
    author: "Thomas Edison",
    role: "Prolific Inventor",
    category: "hard-work",
    tag: "Relentless Sweat",
  },
  {
    quote: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: "Muhammad Ali",
    role: "World Heavyweight Boxing Champion",
    category: "hard-work",
    tag: "Champion's Toll",
  },
  {
    quote: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.",
    author: "Colin Powell",
    role: "U.S. General & Statesman",
    category: "hard-work",
    tag: "Prepared Execution",
  },
  {
    quote: "Men give me credit for some genius. All the genius I have lies in this: when I have a subject in hand, I study it profoundly.",
    author: "Alexander Hamilton",
    role: "Founding Father & Polymath",
    category: "hard-work",
    tag: "Deep Obsession",
  },
  {
    quote: "Hard work beats talent when talent fails to work hard. Everyday effort closes any genetic gap.",
    author: "Tim Notke",
    role: "Basketball Coach",
    category: "hard-work",
    tag: "Outworking Talent",
  },
  {
    quote: "If you want to be the best, you have to do things that other people aren't willing to do.",
    author: "Michael Phelps",
    role: "28-Time Olympic Medalist",
    category: "hard-work",
    tag: "Unmatched Standards",
  },
  {
    quote: "Without labor, neither knowledge nor wisdom can bear fruit. Effort is the currency that buys mastery.",
    author: "Sophocles",
    role: "Ancient Greek Playwright",
    category: "hard-work",
    tag: "Price of Mastery",
  },
  {
    quote: "The dictionary is the only place where success comes before work. Put in the reps when nobody is watching.",
    author: "Vidal Sassoon",
    role: "Visionary Entrepreneur",
    category: "hard-work",
    tag: "The Dark Reps",
  },
  {
    quote: "Don't count the days; make the days count. Every training session is an irreversible deposit into your legacy.",
    author: "Muhammad Ali",
    role: "Legendary Boxer",
    category: "hard-work",
    tag: "Make Days Count",
  },

  // ================= NEVER GIVING UP =================
  {
    quote: "Never give in. Never give in. Never, never, never, never—in nothing, great or small, large or petty—never give in, except to convictions of honor and good sense.",
    author: "Winston Churchill",
    role: "British Prime Minister",
    category: "never-give-up",
    tag: "Never Surrender",
  },
  {
    quote: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. 26 times, I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.",
    author: "Michael Jordan",
    role: "6-Time NBA Champion & Icon",
    category: "never-give-up",
    tag: "Relentless Persistence",
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    role: "Philosopher & Teacher",
    category: "never-give-up",
    tag: "Unbroken Momentum",
  },
  {
    quote: "Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway.",
    author: "Earl Nightingale",
    role: "Pioneering Author & Speaker",
    category: "never-give-up",
    tag: "Time & Tenacity",
  },
  {
    quote: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
    author: "Thomas Edison",
    role: "American Inventor",
    category: "never-give-up",
    tag: "One More Rep",
  },
  {
    quote: "It always seems impossible until it's done. Stand your ground until the impossible yields.",
    author: "Nelson Mandela",
    role: "Anti-Apartheid Leader & Nobel Laureate",
    category: "never-give-up",
    tag: "Defying the Impossible",
  },
  {
    quote: "You just can't beat the person who never gives up.",
    author: "Babe Ruth",
    role: "Baseball Hall of Famer",
    category: "never-give-up",
    tag: "Unbeatable Spirit",
  },
  {
    quote: "Fall seven times, stand up eight. The ground has nothing for you; rise every single time.",
    author: "Japanese Proverb",
    role: "Timeless Eastern Wisdom",
    category: "never-give-up",
    tag: "Seven Falls, Eight Rises",
  },
  {
    quote: "When you feel like quitting, remember why you started. Push past the barrier that turns ordinary people around.",
    author: "Rich Froning Jr.",
    role: "4-Time Fittest Man on Earth",
    category: "never-give-up",
    tag: "The Quit Line",
  },
  {
    quote: "Energy and persistence conquer all things. What cannot be breached by force will yield to continuous pressure.",
    author: "Benjamin Franklin",
    role: "Founding Father & Polymath",
    category: "never-give-up",
    tag: "Persistent Pressure",
  },

  // ================= STRUGGLE & RESILIENCE =================
  {
    quote: "What does not kill me makes me stronger. The greatest spirits are forged in the hottest furnaces.",
    author: "Friedrich Nietzsche",
    role: "Philosopher & Polymath",
    category: "struggle",
    tag: "Forged in Fire",
  },
  {
    quote: "When we are no longer able to change a situation, we are challenged to change ourselves. In struggle lies ultimate dignity.",
    author: "Viktor E. Frankl",
    role: "Neurologist, Psychiatrist & Holocaust Survivor",
    category: "struggle",
    tag: "Search for Meaning",
  },
  {
    quote: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.",
    author: "Marcus Aurelius",
    role: "Roman Emperor & Philosopher",
    category: "struggle",
    tag: "Obstacle is the Way",
  },
  {
    quote: "You may encounter many defeats, but you must not be defeated. In fact, it may be necessary to encounter defeats, so you can know who you are and that you can rise.",
    author: "Maya Angelou",
    role: "Poet, Memoirist & Civil Rights Activist",
    category: "struggle",
    tag: "Unyielding Soul",
  },
  {
    quote: "Difficulty shows what men are. Therefore, when a difficulty falls upon you, remember that God, like a trainer of wrestlers, has matched you with a rough young man.",
    author: "Epictetus",
    role: "Stoic Sage",
    category: "struggle",
    tag: "Divine Sparring",
  },
  {
    quote: "Strength does not come from winning. Your struggles develop your strengths. When you go through hardships and decide not to surrender, that is strength.",
    author: "Arnold Schwarzenegger",
    role: "7-Time Mr. Olympia & Statesman",
    category: "struggle",
    tag: "Muscles of Adversity",
  },
  {
    quote: "A smooth sea never made a skilled sailor. Welcome the storm for the master mariner it will create.",
    author: "Franklin D. Roosevelt",
    role: "32nd U.S. President",
    category: "struggle",
    tag: "Rough Waters",
  },
  {
    quote: "Fire is the test of gold; adversity, of strong men. Stand firm when everything around you shakes.",
    author: "Seneca",
    role: "Roman Stoic Statesman",
    category: "struggle",
    tag: "Tested by Fire",
  },
  {
    quote: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.",
    author: "Kahlil Gibran",
    role: "Philosopher & Poet",
    category: "struggle",
    tag: "Noble Scars",
  },
  {
    quote: "The human capacity for burden is like bamboo—far more flexible than you'd ever believe at first glance.",
    author: "Jodi Picoult",
    role: "Author",
    category: "struggle",
    tag: "Incredible Resilience",
  },

  // ================= MOTIVATION & DRIVE =================
  {
    quote: "Don't stop when you're tired. Stop when you're done. Your mind will quit a thousand times before your body does.",
    author: "David Goggins",
    role: "Retired Navy SEAL & Ultra-Endurance Athlete",
    category: "motivation",
    tag: "Unstoppable Drive",
  },
  {
    quote: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
    author: "Bruce Lee",
    role: "Martial Artist & Philosopher",
    category: "motivation",
    tag: "Endurance & Power",
  },
  {
    quote: "It is not the critic who counts; not the man who points out how the strong man stumbles. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
    author: "Theodore Roosevelt",
    role: "26th U.S. President",
    category: "motivation",
    tag: "Man in the Arena",
  },
  {
    quote: "The only limit to our realization of tomorrow will be our doubts of today. Move forward with strong and active faith.",
    author: "Franklin D. Roosevelt",
    role: "32nd U.S. President",
    category: "motivation",
    tag: "Limitless Horizon",
  },
  {
    quote: "Champions aren't made in gyms. Champions are made from something they have deep inside them: a desire, a dream, a vision.",
    author: "Muhammad Ali",
    role: "Heavyweight World Champion",
    category: "motivation",
    tag: "Inner Vision",
  },
  {
    quote: "If you don't find the time to do it right today, when will you find the time to fix what you neglected?",
    author: "John Wooden",
    role: "10-Time NCAA Champion Coach",
    category: "motivation",
    tag: "Flawless Execution",
  },
  {
    quote: "Be hungry. Be humble. And always be the hardest worker in the room.",
    author: "Dwayne Johnson",
    role: "Athlete & Producer",
    category: "motivation",
    tag: "Hardest Worker",
  },
  {
    quote: "Your time is limited, so don't waste it living someone else's life. Have the courage to follow your heart and intuition.",
    author: "Steve Jobs",
    role: "Co-Founder of Apple",
    category: "motivation",
    tag: "Fierce Authenticity",
  },
  {
    quote: "Action is the foundational key to all success. Stop deliberating; step forward and claim your standard.",
    author: "Pablo Picasso",
    role: "Master Artist & Innovator",
    category: "motivation",
    tag: "Decisive Action",
  },
  {
    quote: "He who has a why to live can bear almost any how. Find your burning reason and the grind becomes effortless.",
    author: "Friedrich Nietzsche",
    role: "Philosopher",
    category: "motivation",
    tag: "The Burning Why",
  },

  // ================= LIFE & WISDOM =================
  {
    quote: "Life is very short and anxious for those who forget the past, neglect the present, and fear the future.",
    author: "Seneca",
    role: "Roman Stoic Philosopher",
    category: "life",
    tag: "On the Shortness of Life",
  },
  {
    quote: "The unexamined life is not worth living. Dare to know yourself and question your assumptions.",
    author: "Socrates",
    role: "Classical Greek Philosopher",
    category: "life",
    tag: "Know Thyself",
  },
  {
    quote: "In the end, it's not the years in your life that count. It's the life in your years.",
    author: "Abraham Lincoln",
    role: "16th U.S. President",
    category: "life",
    tag: "Living Fully",
  },
  {
    quote: "Do what you can, with what you have, where you are. Never wait for perfect conditions to begin living.",
    author: "Theodore Roosevelt",
    role: "26th U.S. President",
    category: "life",
    tag: "Present Power",
  },
  {
    quote: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    role: "Stoic Emperor",
    category: "life",
    tag: "Pure Action",
  },
  {
    quote: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.",
    author: "Marcus Aurelius",
    role: "Roman Philosopher",
    category: "life",
    tag: "Cosmic Wonder",
  },
  {
    quote: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.",
    author: "Ralph Waldo Emerson",
    role: "Essayist & Philosopher",
    category: "life",
    tag: "Noble Purpose",
  },
  {
    quote: "He who fears death will never do anything worthy of a man who is alive.",
    author: "Seneca",
    role: "Stoic Philosopher",
    category: "life",
    tag: "Fearless Living",
  },
  {
    quote: "Life is 10% what happens to you and 90% how you react to it. Your response is the only thing you truly own.",
    author: "Charles R. Swindoll",
    role: "Educator & Author",
    category: "life",
    tag: "Mastery of Response",
  },
  {
    quote: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.",
    author: "Socrates",
    role: "Philosopher",
    category: "life",
    tag: "Architect of Tomorrow",
  },

  // ================= MIND & COGNITIVE MASTERY =================
  {
    quote: "Every human being, if he so desires, can become the sculptor of his own brain.",
    author: "Santiago Ramón y Cajal",
    role: "Nobel Laureate & Father of Modern Neuroscience",
    category: "mind",
    tag: "Neuroplasticity",
  },
  {
    quote: "Memory is the treasury and guardian of all things.",
    author: "Marcus Tullius Cicero",
    role: "Roman Statesman & Mnemonic Pioneer",
    category: "mind",
    tag: "Method of Loci",
  },
  {
    quote: "Neurons that fire together, wire together. Deliberate repetition transforms fleeting signals into permanent architecture.",
    author: "Donald Hebb",
    role: "Pioneering Neuropsychologist",
    category: "mind",
    tag: "Synaptic Plasticity",
  },
  {
    quote: "Monotony collapses time; novelty unfolds it. Creating vivid memory is creating conscious life.",
    author: "Joshua Foer",
    role: "US Memory Champion & Author",
    category: "mind",
    tag: "Eidetic Encoding",
  },
  {
    quote: "The brain is an organic, adaptive engine of limitless configuration. Expand its working buffer and you expand your world.",
    author: "John von Neumann",
    role: "Mathematician & Polymath",
    category: "mind",
    tag: "Working Memory",
  },
  {
    quote: "The art of remembering is the art of thinking. What is deeply understood is effortlessly retained.",
    author: "William James",
    role: "Father of Modern Psychology",
    category: "mind",
    tag: "Deep Retention",
  },
  {
    quote: "The secret of a super memory is transforming abstract symbols into vivid, multisensory spatial journeys.",
    author: "Dominic O'Brien",
    role: "8-Time World Memory Champion",
    category: "mind",
    tag: "Spatial Mnemonics",
  },
  {
    quote: "Just as iron rusts from disuse, even so does inaction spoil the intellect.",
    author: "Leonardo da Vinci",
    role: "Renaissance Polymath & Artist",
    category: "mind",
    tag: "Active Intellect",
  },
  {
    quote: "Speed in cognition is not haste; it is the total absence of unnecessary friction.",
    author: "Garry Kasparov",
    role: "World Chess Champion",
    category: "mind",
    tag: "Cognitive Speed",
  },
  {
    quote: "We don't rise to the level of our expectations, we fall to the level of our training.",
    author: "Archilochus",
    role: "Greek Poet & Philosopher",
    category: "mind",
    tag: "Cognitive Stamina",
  },
  {
    quote: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    role: "Philosopher & Teacher",
    category: "mind",
    tag: "Incremental Mastery",
  },
  {
    quote: "Mental toughness is a perfectly disciplined will that refuses to give in, combined with the sacrifice of the immediate for the eternal.",
    author: "Vince Lombardi",
    role: "Legendary Coach",
    category: "discipline",
    tag: "Disciplined Will",
  },
];

// Backward compatibility export
export const COGNITIVE_QUOTES = ALL_QUOTES;

const CATEGORY_META: Record<
  QuoteCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    border: string;
  }
> = {
  all: {
    label: "All Quotes",
    icon: Sparkles,
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  discipline: {
    label: "Discipline",
    icon: Shield,
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  "hard-work": {
    label: "Hard Work",
    icon: Hammer,
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    border: "border-amber-500/30",
  },
  "never-give-up": {
    label: "Never Give Up",
    icon: Flame,
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    border: "border-rose-500/30",
  },
  struggle: {
    label: "Struggle & Grit",
    icon: Mountain,
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    border: "border-purple-500/30",
  },
  motivation: {
    label: "Motivation",
    icon: Zap,
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    border: "border-blue-500/30",
  },
  life: {
    label: "Life & Wisdom",
    icon: Compass,
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  mind: {
    label: "Memory & Mind",
    icon: Brain,
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-400",
    border: "border-teal-500/30",
  },
};

interface InspirationalQuoteProps {
  curriculumDay?: number;
}

export const InspirationalQuote: React.FC<InspirationalQuoteProps> = ({
  curriculumDay = 1,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory>('all');
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inspirational_quote_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Filtered pool of quotes
  const pool = useMemo(() => {
    if (selectedCategory === 'all') return ALL_QUOTES;
    return ALL_QUOTES.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  // Deterministic daily index based on today's calendar date and curriculum day
  const dailyGlobalIndex = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.abs((dayOfYear * 7 + curriculumDay) % ALL_QUOTES.length);
  }, [curriculumDay]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    return dailyGlobalIndex % pool.length;
  });

  // When pool or curriculumDay changes, adjust index safely
  useEffect(() => {
    setCurrentIndex((prev) => (prev >= pool.length ? 0 : prev));
  }, [pool.length]);

  const activeQuote = pool[currentIndex % pool.length] || ALL_QUOTES[0];
  const isDailyQuote =
    selectedCategory === 'all' && currentIndex === dailyGlobalIndex;

  const currentCategoryMeta =
    CATEGORY_META[activeQuote.category] || CATEGORY_META.all;
  const CategoryIcon = currentCategoryMeta.icon;

  const handleNextQuote = () => {
    sound.playClick();
    setCurrentIndex((prev) => (prev + 1) % pool.length);
  };

  const handlePrevQuote = () => {
    sound.playClick();
    setCurrentIndex((prev) => (prev - 1 + pool.length) % pool.length);
  };

  const handleShuffle = () => {
    sound.playClick();
    if (pool.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * pool.length);
    if (nextIdx === currentIndex) {
      nextIdx = (currentIndex + 1) % pool.length;
    }
    setCurrentIndex(nextIdx);
  };

  const handleResetToDaily = () => {
    sound.playClick();
    setSelectedCategory('all');
    setCurrentIndex(dailyGlobalIndex);
  };

  const handleSelectCategory = (cat: QuoteCategory) => {
    sound.playClick();
    setSelectedCategory(cat);
    setCurrentIndex(0);
  };

  const handleCopyQuote = () => {
    sound.playClick();
    const text = `"${activeQuote.quote}" — ${activeQuote.author} (${activeQuote.tag})`;
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

  const categories: QuoteCategory[] = [
    'all',
    'discipline',
    'hard-work',
    'never-give-up',
    'struggle',
    'motivation',
    'life',
    'mind',
  ];

  return (
    <section
      aria-label="Daily Inspirational and Motivational Quotes"
      className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-2.5 pb-1"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-950/95 border border-slate-800/90 hover:border-slate-700/80 transition-all p-3 sm:p-4 shadow-sm group">
        {/* Subtle ambient dynamic glow based on active category */}
        <div
          className={`absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 ${
            activeQuote.category === 'never-give-up'
              ? 'bg-rose-500'
              : activeQuote.category === 'hard-work'
              ? 'bg-amber-500'
              : activeQuote.category === 'discipline'
              ? 'bg-emerald-500'
              : activeQuote.category === 'struggle'
              ? 'bg-purple-500'
              : activeQuote.category === 'motivation'
              ? 'bg-blue-500'
              : activeQuote.category === 'life'
              ? 'bg-indigo-500'
              : 'bg-cyan-500'
          }`}
        />

        <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
          {/* Dynamic Theme Icon Badge */}
          <div
            className={`w-8 h-8 rounded-xl ${currentCategoryMeta.badgeBg} border ${currentCategoryMeta.border} flex items-center justify-center ${currentCategoryMeta.badgeText} shrink-0 mt-0.5 shadow-sm transition-all duration-300`}
            title={currentCategoryMeta.label}
          >
            <CategoryIcon className="w-4 h-4" />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header Metadata Bar */}
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono uppercase tracking-wider truncate">
                <span
                  className={`font-bold flex items-center gap-1 shrink-0 ${currentCategoryMeta.badgeText}`}
                >
                  {currentCategoryMeta.label}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300 font-medium truncate">
                  {activeQuote.tag}
                </span>

                {isDailyQuote && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold lowercase tracking-normal">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-300" /> daily pick
                    </span>
                  </>
                )}
              </div>

              {/* Navigation and Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Back to daily if shuffled away */}
                {!isDailyQuote && (
                  <button
                    type="button"
                    onClick={handleResetToDaily}
                    className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                    title="Jump to today's daily quote"
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">Today</span>
                  </button>
                )}

                {/* Prev quote */}
                <button
                  type="button"
                  onClick={handlePrevQuote}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                  title="Previous quote"
                  aria-label="Previous quote"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Counter indicator */}
                <span className="text-[10px] font-mono text-slate-400 px-1 min-w-[36px] text-center select-none">
                  {(currentIndex % pool.length) + 1}/{pool.length}
                </span>

                {/* Next quote */}
                <button
                  type="button"
                  onClick={handleNextQuote}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                  title="Next quote"
                  aria-label="Next quote"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Shuffle button */}
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium ml-0.5"
                  title="Shuffle quote"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>

                {/* Copy quote */}
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                  title="Copy quote"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Collapse / Expand toggle */}
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center ml-0.5"
                  title={isCollapsed ? 'Expand quote view' : 'Collapse quote view'}
                  aria-label={isCollapsed ? 'Expand quote' : 'Collapse quote'}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Category filter pills - smooth touch horizontal scroll */}
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none text-[10px] font-medium select-none -mx-1 px-1">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta.icon;
                  const isSelected = selectedCategory === cat;
                  const count =
                    cat === 'all'
                      ? ALL_QUOTES.length
                      : ALL_QUOTES.filter((q) => q.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? `${meta.badgeBg} ${meta.badgeText} border ${meta.border} font-semibold shadow-xs`
                          : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span>{meta.label}</span>
                      <span className="opacity-60 text-[9px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Expanded vs Collapsed Quote View */}
            {!isCollapsed ? (
              <div className="space-y-1.5 mt-1">
                <p className="text-xs sm:text-[13px] text-slate-100 font-medium italic leading-relaxed tracking-tight text-balance">
                  "{activeQuote.quote}"
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap pt-0.5">
                  <span className="font-semibold text-white not-italic">
                    {activeQuote.author}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none">
                    {activeQuote.role}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-between gap-2 cursor-pointer mt-0.5"
                onClick={handleToggleCollapse}
              >
                <p className="text-xs text-slate-300 italic truncate flex-1">
                  "{activeQuote.quote}" —{' '}
                  <span className="text-white font-medium not-italic">
                    {activeQuote.author}
                  </span>
                </p>
                <span className="text-[10px] text-cyan-400 font-mono shrink-0 font-medium">
                  Click to expand
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const DailyInspirationalQuote = InspirationalQuote;
export default InspirationalQuote;
