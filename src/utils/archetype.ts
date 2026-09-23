import { AthleteArchetype, FreeTrainingSessionStats, FourHourPlanState, UserStats, DailyProtocolState, FlashSpeed } from '../types';

export interface ArchetypeInput {
  freeStats?: FreeTrainingSessionStats;
  fourHourPlan?: FourHourPlanState;
  userStats: UserStats;
  protocol?: DailyProtocolState;
  currentSpeed?: FlashSpeed;
}

export interface ArchetypeCatalogItem {
  id: string;
  title: string;
  badge: string;
  emoji: string;
  description: string;
  unlockCondition: string;
  quote: string;
}

export const ALL_ARCHETYPES_CATALOG: ArchetypeCatalogItem[] = [
  {
    id: 'subsecond-demon',
    title: 'The 150ms Sub-Second Twitch Demon',
    badge: '⚡ Retinal Shutter',
    emoji: '⚡',
    description: 'You do not process scenes serially; you capture whole visual fields in sub-conscious 150ms micro-bursts.',
    unlockCondition: 'Flash exposure calibrated to <= 300ms or 30+ minutes of sub-second training.',
    quote: '"If an exposure takes longer than 200 milliseconds, it might as well be a feature film."',
  },
  {
    id: 'ultra-grinder',
    title: 'The 4-Hour Marathon Ultra-Monk',
    badge: '🧘 Deep Grind',
    emoji: '🏔️',
    description: 'Relentless cognitive stamina. You balance the 30/70 digital-physical split and treat working memory like an Ironman triathlon.',
    unlockCondition: 'Over 60 minutes of total all-time training or high 4-Hour Protocol completion.',
    quote: '"Fatigue is just an uncalibrated sensory signal. Focus is forever."',
  },
  {
    id: 'forensic-detective',
    title: 'The Sherlock Holmes Forensic Sleuth',
    badge: '🔍 Visual Binder',
    emoji: '🕵️‍♂️',
    description: 'Obsessed with chromatic feature binding and micro-anomalies. You spot spatial shifts before anyone else registers a change.',
    unlockCondition: 'Heavy practice in Symbol Detective Lab or Eidetic Matrix.',
    quote: '"You see, but you do not observe. I, however, noticed the red zap at row 2 col 3."',
  },
  {
    id: 'nback-overclocker',
    title: 'The Dual N-Back Working Memory Overclocker',
    badge: '🧠 DLPFC Overdrive',
    emoji: '🧬',
    description: 'Massive fluid intelligence. You track parallel audio phonemes and spatial grids simultaneously without dropping a byte.',
    unlockCondition: 'High Dual N-Back practice time or N-Back level >= 3.',
    quote: '"My brain has 16 threads open and zero swapped memory."',
  },
  {
    id: 'palace-architect',
    title: 'The Ancient Cathedral Loci Architect',
    badge: '🏛️ Method of Loci',
    emoji: '🏛️',
    description: 'Spatial cartographer who stores entire encyclopedias across imaginary marble corridors, statues, and chambers.',
    unlockCondition: 'High Memory Palace and Mnemonic Pegs practice time.',
    quote: '"Why take notes when you have a 40-room Victorian manor inside your hippocampus?"',
  },
  {
    id: 'primate-purist',
    title: 'The Primate RAM Purist (Ayumu Rival)',
    badge: '🐵 Iconic Primate',
    emoji: '🐵',
    description: 'You hold a personal grudge against Kyoto University chimpanzees and refuse to rest until human iconic memory reigns supreme.',
    unlockCondition: 'Primary time invested in Ayumu Chimp sequence flash.',
    quote: '"Ayumu did it in 210ms. I will do it in 180ms. Humans will not be humiliated."',
  },
  {
    id: 'iron-disciplinarian',
    title: 'The Iron Streak Disciplinarian',
    badge: '🔥 Unbroken Will',
    emoji: '🔥',
    description: 'Consistency incarnate. Missing a daily 12 AM cycle is a biological impossibility in your universe.',
    unlockCondition: 'Active streak of 7+ days or 100% daily protocol consistency.',
    quote: '"Motivation is cheap. My streak is forged in adamantium."',
  },
  {
    id: 'surgical-microdoser',
    title: 'The Surgical Micro-Doser',
    badge: '⏱️ High Frequency',
    emoji: '🎯',
    description: 'You squeeze 3 high-intensity flash rounds while waiting for an elevator. Maximum neuroplastic yield per second.',
    unlockCondition: 'High session count relative to total time (short, frequent high-intensity reps).',
    quote: '"Two minutes of high-density focus beats two hours of distracted scrolling."',
  },
  {
    id: 'awakening-neophyte',
    title: 'The Latent Neural Spark',
    badge: '✨ Awakening',
    emoji: '🌱',
    description: 'The dojo doors have opened. Your visual cortex is stretching its dormant synaptic wings, preparing for the master evolution.',
    unlockCondition: 'Initial training period (< 10 minutes total all-time).',
    quote: '"Every grandmaster was once an apprentice who refused to look away."',
  },
];

/**
 * Calculates absolute all-time training minutes across free training, 4-hour logs, and games
 */
export function calculateAllTimeStats(
  freeStats?: FreeTrainingSessionStats,
  fourHourPlan?: FourHourPlanState,
  userStats?: UserStats
): {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  gameBreakdown: Record<string, number>;
} {
  const freeSecs = freeStats?.totalSecondsPracticed || 0;
  const freeSessions = freeStats?.sessionsCount || 0;

  // Aggregate breakdown
  const gameBreakdown: Record<string, number> = { ...(freeStats?.todayGamesBreakdown || {}) };

  // Add historical free training logs
  if (freeStats?.dailyHistory) {
    Object.values(freeStats.dailyHistory).forEach((log) => {
      if (log.gamesBreakdown) {
        Object.entries(log.gamesBreakdown).forEach(([game, secs]) => {
          gameBreakdown[game] = (gameBreakdown[game] || 0) + (secs || 0);
        });
      }
    });
  }

  // Add 4-hour plan task elapsed seconds
  let planSecs = 0;
  if (fourHourPlan?.tasks) {
    fourHourPlan.tasks.forEach((t) => {
      planSecs += t.elapsedSeconds || 0;
      if (t.gameMode) {
        gameBreakdown[t.gameMode] = (gameBreakdown[t.gameMode] || 0) + (t.elapsedSeconds || 0);
      }
    });
  }
  if (fourHourPlan?.history) {
    Object.values(fourHourPlan.history).forEach((h) => {
      planSecs += (h.totalTrainingMinutes || 0) * 60;
    });
  }

  // Fallback game plays into approximate seconds if no timer records exist yet
  const gameCountSecs = (userStats?.totalGamesPlayed || 0) * 45; // ~45s per game
  const totalSeconds = Math.max(freeSecs + planSecs, gameCountSecs);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Number((totalMinutes / 60).toFixed(1));
  const totalSessions = Math.max(
    freeSessions,
    fourHourPlan?.totalSessionsCompleted || 0,
    Math.ceil((userStats?.totalGamesPlayed || 0) / 4)
  );

  return {
    totalSeconds,
    totalMinutes,
    totalHours,
    totalSessions: Math.max(1, totalSessions),
    gameBreakdown,
  };
}

/**
 * Determines the user's specific "Type of Guy" persona based on all-time training data
 */
export function getAthleteArchetype(input: ArchetypeInput): AthleteArchetype {
  const { freeStats, fourHourPlan, userStats, protocol, currentSpeed } = input;
  const { totalSeconds, totalMinutes, totalHours, totalSessions, gameBreakdown } = calculateAllTimeStats(
    freeStats,
    fourHourPlan,
    userStats
  );

  // Find most practiced game mode
  let topGame = '';
  let topGameSecs = 0;
  Object.entries(gameBreakdown).forEach(([game, secs]) => {
    if (secs > topGameSecs) {
      topGameSecs = secs;
      topGame = game;
    }
  });

  const streak = Math.max(userStats.currentStreak || 0, userStats.bestStreak || 0);
  const fastestMs = Math.min(userStats.fastestFlashMs || 2000, currentSpeed || 2000);
  const nBackMax = userStats.dualNBackMaxN || 2;
  const detectiveScore = userStats.detectiveHighScore || 0;
  const accuracy = userStats.accuracyRate || 100;

  // Determine Tier Level (1 to 5)
  let tierLevel = 1;
  let tierName = 'Neophyte Spark';
  if (totalMinutes >= 240) {
    tierLevel = 5;
    tierName = 'Mythic Transcendent';
  } else if (totalMinutes >= 120) {
    tierLevel = 4;
    tierName = 'Grandmaster Operative';
  } else if (totalMinutes >= 45) {
    tierLevel = 3;
    tierName = 'Elite Specialist';
  } else if (totalMinutes >= 15) {
    tierLevel = 2;
    tierName = 'Calibrated Adept';
  }

  // Calculate Next Milestone
  const MILESTONES = [
    { label: '15 Minutes (Adept Awakening)', minutes: 15 },
    { label: '45 Minutes (Elite Specialist)', minutes: 45 },
    { label: '2 Hours (Grandmaster Operative)', minutes: 120 },
    { label: '4 Hours (Cognitive Marathon)', minutes: 240 },
    { label: '10 Hours (Visual Overlord)', minutes: 600 },
    { label: '25 Hours (Living Supercomputer)', minutes: 1500 },
    { label: '50 Hours (Eidetic Immortal)', minutes: 3000 },
  ];

  const nextMilestoneItem = MILESTONES.find((m) => m.minutes > totalMinutes) || MILESTONES[MILESTONES.length - 1];
  const prevMilestoneMin = MILESTONES.slice().reverse().find((m) => m.minutes <= totalMinutes)?.minutes || 0;
  const remaining = Math.max(0, nextMilestoneItem.minutes - totalMinutes);
  const span = nextMilestoneItem.minutes - prevMilestoneMin;
  const progressPercent = span > 0 ? Math.min(100, Math.round(((totalMinutes - prevMilestoneMin) / span) * 100)) : 100;

  // Persona Classification Logic
  let archetypeId = 'awakening-neophyte';

  if (totalMinutes < 5 && userStats.totalGamesPlayed < 5) {
    archetypeId = 'awakening-neophyte';
  } else if (fastestMs <= 300 || topGame === 'ayumu-chimp' && fastestMs <= 600) {
    archetypeId = 'subsecond-demon';
  } else if (topGame === 'symbol-detective' || detectiveScore >= 8 || topGame === 'eidetic-matrix') {
    archetypeId = 'forensic-detective';
  } else if (topGame === 'dual-nback' || nBackMax >= 3) {
    archetypeId = 'nback-overclocker';
  } else if (topGame === 'memory-palace' || topGame === 'mnemonic-pegs' || (userStats.mnemonicConversionCount || 0) >= 10) {
    archetypeId = 'palace-architect';
  } else if (topGame === 'ayumu-chimp') {
    archetypeId = 'primate-purist';
  } else if (totalMinutes >= 60 || (fourHourPlan?.totalSessionsCompleted || 0) >= 3) {
    archetypeId = 'ultra-grinder';
  } else if (streak >= 5) {
    archetypeId = 'iron-disciplinarian';
  } else if (totalSessions >= 5 && totalMinutes / totalSessions <= 6) {
    archetypeId = 'surgical-microdoser';
  } else {
    archetypeId = 'subsecond-demon';
  }

  // Base archetype configurations
  switch (archetypeId) {
    case 'subsecond-demon':
      return {
        id: 'subsecond-demon',
        title: 'The 150ms Sub-Second Twitch Demon',
        subtitle: 'Ventral Stream Overclocker & Retinal Shutter Master',
        badge: '⚡ 150ms Shutter Demon',
        emoji: '⚡',
        auraGradient: 'from-amber-500 via-rose-600 to-purple-700',
        borderAccent: 'border-amber-400/80',
        textAccent: 'text-amber-300',
        bgGlow: 'bg-amber-500/10 shadow-amber-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Iconic Sensory Register & Saccadic Speed',
        radarScores: {
          focusStamina: Math.min(100, 50 + tierLevel * 10),
          shutterSpeed: Math.min(100, 85 + Math.round((2000 - fastestMs) / 100)),
          ramBuffer: Math.min(100, 60 + nBackMax * 8),
          spatialMapping: Math.min(100, 65 + (userStats.matrixMaxLevel || 1) * 6),
          ironDiscipline: Math.min(100, 50 + streak * 6),
        },
        traits: {
          naturalHabitat: 'A dark room with a 240Hz OLED monitor at 1:45 AM, drinking black tea.',
          cognitiveSuperpower: 'Extracting 9 digits of information before the conscious prefrontal cortex even registers the flash.',
          redFlag: 'Gets physically antsy when an elevator screen or website animation takes longer than 300ms.',
          lifeMotto: '"If you need more than 200 milliseconds to memorize it, it belongs in a museum."',
          quirkyFact: 'Claims to read billboards at 75 MPH on the highway with a single peripheral glance.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `⚡ Cognitive Archetype: The 150ms Sub-Second Twitch Demon\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs) across ${totalSessions} sessions\n🎯 Shutter Speed: ${fastestMs}ms | Streak: ${streak} days\n"If you need more than 200ms, it belongs in a museum." #PhotographicMemoryMaster`,
      };

    case 'forensic-detective':
      return {
        id: 'forensic-detective',
        title: 'The Sherlock Holmes Forensic Sleuth',
        subtitle: 'Master of Chromatic Feature Binding & Spatial Anomaly Detection',
        badge: '🕵️‍♂️ Forensic Sleuth',
        emoji: '🔍',
        auraGradient: 'from-purple-500 via-indigo-600 to-cyan-600',
        borderAccent: 'border-purple-400/80',
        textAccent: 'text-purple-300',
        bgGlow: 'bg-purple-500/10 shadow-purple-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'V4 Color-Shape Conjunction & Anomaly Search',
        radarScores: {
          focusStamina: Math.min(100, 65 + tierLevel * 8),
          shutterSpeed: Math.min(100, 75 + Math.round((2000 - fastestMs) / 120)),
          ramBuffer: Math.min(100, 70 + (detectiveScore || 1) * 3),
          spatialMapping: Math.min(100, 92),
          ironDiscipline: Math.min(100, 55 + streak * 6),
        },
        traits: {
          naturalHabitat: 'Pausing thriller movies at 0.5x speed to cross-reference continuity errors in the background wallpaper.',
          cognitiveSuperpower: 'Instantaneous feature binding: remembering not just that a car passed, but its exact color, shape, and dent coordinate.',
          redFlag: 'Accidentally solves everyone else’s puzzles at escape rooms before they finish reading the instructions.',
          lifeMotto: '"You merely look; I decompose the retinal array into chromatic feature vectors."',
          quirkyFact: 'Remembers the seating arrangement of a dinner party from 6 months ago in exact coordinate order.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🔍 Cognitive Archetype: The Sherlock Holmes Forensic Sleuth\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs) across ${totalSessions} sessions\n👁️ High Score: ${detectiveScore} Solves | Accuracy: ${accuracy}%\n"You merely look; I decompose the retinal array." #PhotographicMemoryMaster`,
      };

    case 'nback-overclocker':
      return {
        id: 'nback-overclocker',
        title: 'The Dual N-Back Working Memory Overclocker',
        subtitle: 'Dorsolateral Prefrontal Cortex Fluid Intelligence Engine',
        badge: '🧠 DLPFC Overclocker',
        emoji: '🧬',
        auraGradient: 'from-cyan-500 via-sky-600 to-indigo-700',
        borderAccent: 'border-cyan-400/80',
        textAccent: 'text-cyan-300',
        bgGlow: 'bg-cyan-500/10 shadow-cyan-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Phonological Loop & Visuospatial Sketchpad Multi-threading',
        radarScores: {
          focusStamina: Math.min(100, 80 + tierLevel * 5),
          shutterSpeed: Math.min(100, 65 + Math.round((2000 - fastestMs) / 130)),
          ramBuffer: Math.min(100, 85 + nBackMax * 5),
          spatialMapping: Math.min(100, 75 + nBackMax * 5),
          ironDiscipline: Math.min(100, 60 + streak * 5),
        },
        traits: {
          naturalHabitat: 'Listening to an audiobook in one ear while doing spreadsheet formulas and listening for their order number at a cafe.',
          cognitiveSuperpower: 'Holding 8 distinct chronological states in active RAM without confusing 2 trials ago with 3 trials ago.',
          redFlag: 'Explains everyday situations using Gf (fluid intelligence) covariance models and neural degradation curves.',
          lifeMotto: '"Dual N-Back is the deadlift of the prefrontal cortex."',
          quirkyFact: 'Has never used a shopping cart app; stores entire ingredient matrices directly in working memory.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🧬 Cognitive Archetype: The Dual N-Back Working Memory Overclocker\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs)\n🧠 Working Memory Buffer: N=${nBackMax} | Accuracy: ${accuracy}%\n"Dual N-Back is the deadlift of the prefrontal cortex." #PhotographicMemoryMaster`,
      };

    case 'palace-architect':
      return {
        id: 'palace-architect',
        title: 'The Ancient Cathedral Loci Architect',
        subtitle: 'Hippocampal Spatial Navigator & Memory Palace Maestro',
        badge: '🏛️ Loci Architect',
        emoji: '🏛️',
        auraGradient: 'from-emerald-500 via-teal-600 to-indigo-800',
        borderAccent: 'border-emerald-400/80',
        textAccent: 'text-emerald-300',
        bgGlow: 'bg-emerald-500/10 shadow-emerald-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Parieto-Occipital Spatial Mapping & Visual Pegs',
        radarScores: {
          focusStamina: Math.min(100, 75 + tierLevel * 6),
          shutterSpeed: Math.min(100, 60 + Math.round((2000 - fastestMs) / 140)),
          ramBuffer: Math.min(100, 80 + tierLevel * 4),
          spatialMapping: 98,
          ironDiscipline: Math.min(100, 60 + streak * 5),
        },
        traits: {
          naturalHabitat: 'Mentally walking through a 24-room Mediterranean villa while standing in line at the grocery store.',
          cognitiveSuperpower: 'Associating dry numerical abstractions with bizarre, unforgettable 4K mental sculptures.',
          redFlag: 'Refers to rooms in their childhood home by the phonetic Major System peg code stored in each corner.',
          lifeMotto: '"Build your mind palace tall enough to withstand the tide of forgetfulness."',
          quirkyFact: 'Has their credit card number encoded as a giant flaming giraffe sitting on a velvet armchair.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🏛️ Cognitive Archetype: The Ancient Cathedral Loci Architect\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs) | Tier: ${tierName}\n🏰 Spatial Mapping: 98/100 | Method of Loci Mastery\n#PhotographicMemoryMaster`,
      };

    case 'primate-purist':
      return {
        id: 'primate-purist',
        title: 'The Primate RAM Purist (Ayumu Rival)',
        subtitle: 'Subitizing Demon on a Personal Mission to Out-Recall Kyoto Primates',
        badge: '🐵 Ayumu Rival',
        emoji: '🐵',
        auraGradient: 'from-amber-400 via-orange-600 to-red-700',
        borderAccent: 'border-amber-400/80',
        textAccent: 'text-amber-300',
        bgGlow: 'bg-amber-500/10 shadow-amber-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Iconic Memory Persistence & Instant Parallel Subitizing',
        radarScores: {
          focusStamina: Math.min(100, 65 + tierLevel * 7),
          shutterSpeed: Math.min(100, 90 + Math.round((2000 - fastestMs) / 100)),
          ramBuffer: Math.min(100, 70 + (userStats.ayumuMaxNumbers || 4) * 4),
          spatialMapping: Math.min(100, 80 + (userStats.ayumuMaxNumbers || 4) * 3),
          ironDiscipline: Math.min(100, 55 + streak * 5),
        },
        traits: {
          naturalHabitat: 'Rapidly tapping numbered tiles with an intensity that threatens the structural integrity of the smartphone screen.',
          cognitiveSuperpower: 'Subitizing up to 9 random coordinates in under 400 milliseconds without counting 1, 2, 3.',
          redFlag: 'Gets deeply, personally offended when scientific papers praise chimpanzee working memory.',
          lifeMotto: '"Ayumu had 30 years of sweet potato treats; I have raw human willpower."',
          quirkyFact: 'Refuses to look at a keyboard because finger muscle memory is 12 milliseconds faster.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🐵 Cognitive Archetype: The Primate RAM Purist (Ayumu Rival)\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs) | Max Digits: ${userStats.ayumuMaxNumbers || 5}\n⚡ Subitizing Shutter: ${fastestMs}ms\n"Ayumu had sweet potatoes; I have raw willpower." #PhotographicMemoryMaster`,
      };

    case 'ultra-grinder':
      return {
        id: 'ultra-grinder',
        title: 'The 4-Hour Marathon Ultra-Monk',
        subtitle: 'Peak Cognitive Endurance & 30/70 Protocol Disciplinarian',
        badge: '🏔️ Ultra-Grinder',
        emoji: '🏔️',
        auraGradient: 'from-amber-500 via-emerald-600 to-teal-700',
        borderAccent: 'border-amber-500/80',
        textAccent: 'text-amber-300',
        bgGlow: 'bg-amber-500/10 shadow-amber-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'High-Dosage Synaptic Consolidation & NSDR Stamina',
        radarScores: {
          focusStamina: 96,
          shutterSpeed: Math.min(100, 70 + Math.round((2000 - fastestMs) / 120)),
          ramBuffer: Math.min(100, 75 + nBackMax * 5),
          spatialMapping: Math.min(100, 75 + tierLevel * 5),
          ironDiscipline: 98,
        },
        traits: {
          naturalHabitat: 'Doing Non-Sleep Deep Rest (NSDR) on a yoga mat with earplugs after completing an 84-minute digital protocol.',
          cognitiveSuperpower: 'Zero attentional decay over extended 90-minute ultradian focus cycles.',
          redFlag: 'Has a structured daily timetable that makes military submarine schedules look relaxed.',
          lifeMotto: '"Consistency eats inspiration for breakfast, lunch, and late-night flash reps."',
          quirkyFact: 'Tracks their REM sleep percentage to the second to ensure optimal hippocampal replay.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🏔️ Cognitive Archetype: The 4-Hour Marathon Ultra-Monk\n⏱️ Total Training: ${totalMinutes}m (${totalHours} hrs) across ${totalSessions} sessions\n🔥 Focus Stamina: 96/100 | Iron Discipline: 98/100\n"Consistency eats inspiration for breakfast." #PhotographicMemoryMaster`,
      };

    case 'iron-disciplinarian':
      return {
        id: 'iron-disciplinarian',
        title: 'The Iron Streak Disciplinarian',
        badge: '🔥 Unbroken Will',
        subtitle: '12 AM Midnight Cycle Champion & Habit Titan',
        emoji: '🔥',
        auraGradient: 'from-rose-500 via-orange-600 to-amber-600',
        borderAccent: 'border-rose-500/80',
        textAccent: 'text-rose-300',
        bgGlow: 'bg-rose-500/10 shadow-rose-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Habit Automaticity & Dopamine Baseline Resilience',
        radarScores: {
          focusStamina: Math.min(100, 70 + streak * 4),
          shutterSpeed: Math.min(100, 65 + Math.round((2000 - fastestMs) / 130)),
          ramBuffer: Math.min(100, 70 + nBackMax * 5),
          spatialMapping: Math.min(100, 70 + tierLevel * 5),
          ironDiscipline: 99,
        },
        traits: {
          naturalHabitat: 'Opening the app at 12:01 AM like clockwork to secure the new day’s protocol lock.',
          cognitiveSuperpower: 'Unshakable behavioral momentum that laughs in the face of procrastination.',
          redFlag: 'Declines parties if staying out late threatens their 12 AM brain training window.',
          lifeMotto: '"A day without calibration is a day of cognitive entropy."',
          quirkyFact: 'Has never used the snooze button on an alarm in the past 5 years.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🔥 Cognitive Archetype: The Iron Streak Disciplinarian\n⏱️ Total Training: ${totalMinutes}m | Active Streak: ${streak} Days 🔥\n🛡️ Iron Discipline: 99/100\n"A day without calibration is a day of cognitive entropy." #PhotographicMemoryMaster`,
      };

    case 'surgical-microdoser':
      return {
        id: 'surgical-microdoser',
        title: 'The Surgical Micro-Doser',
        badge: '⏱️ High Frequency',
        subtitle: 'High-Density Micro-Burst Cognitive Strategist',
        emoji: '🎯',
        auraGradient: 'from-blue-500 via-cyan-600 to-emerald-600',
        borderAccent: 'border-blue-400/80',
        textAccent: 'text-blue-300',
        bgGlow: 'bg-blue-500/10 shadow-blue-500/20',
        tierName,
        tierLevel,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Rapid Attentional Switching & Acute Burst Plasticity',
        radarScores: {
          focusStamina: Math.min(100, 55 + tierLevel * 8),
          shutterSpeed: Math.min(100, 80 + Math.round((2000 - fastestMs) / 120)),
          ramBuffer: Math.min(100, 75 + nBackMax * 4),
          spatialMapping: Math.min(100, 70 + tierLevel * 5),
          ironDiscipline: Math.min(100, 70 + streak * 4),
        },
        traits: {
          naturalHabitat: 'Completing 4 flash rounds while their coffee brews or while riding the subway escalator.',
          cognitiveSuperpower: 'Going from 0 to 100% focused presence in under 1.5 seconds without warm-up.',
          redFlag: 'Measures travel times in units of "Dual N-Back blocks".',
          lifeMotto: '"Tiny frequent drops of water carve through solid granite."',
          quirkyFact: 'Has replaced social media doomscrolling entirely with sub-second visual matrix solves.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🎯 Cognitive Archetype: The Surgical Micro-Doser\n⏱️ Total Training: ${totalMinutes}m across ${totalSessions} surgical micro-sessions\n⚡ Average Session: ~${Math.round(totalMinutes / Math.max(1, totalSessions))} mins | Accuracy: ${accuracy}%\n#PhotographicMemoryMaster`,
      };

    case 'awakening-neophyte':
    default:
      return {
        id: 'awakening-neophyte',
        title: 'The Latent Neural Spark',
        badge: '🌱 Awakening',
        subtitle: 'Dormant Eidetic Circuitry in Early Calibration',
        emoji: '🌱',
        auraGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        borderAccent: 'border-emerald-400/80',
        textAccent: 'text-emerald-300',
        bgGlow: 'bg-emerald-500/10 shadow-emerald-500/20',
        tierName: 'Neophyte Spark',
        tierLevel: 1,
        allTimeHours: totalHours,
        allTimeMinutes: totalMinutes,
        allTimeSeconds: totalSeconds,
        sessionsCount: totalSessions,
        primaryDominance: 'Initial Sensory Register Activation',
        radarScores: {
          focusStamina: 45,
          shutterSpeed: Math.min(100, 50 + Math.round((2000 - fastestMs) / 150)),
          ramBuffer: 50,
          spatialMapping: 50,
          ironDiscipline: Math.min(100, 40 + streak * 10),
        },
        traits: {
          naturalHabitat: 'Just beginning the 365-day journey, realizing how fast 150 milliseconds actually is.',
          cognitiveSuperpower: 'Massive untapped neuroplastic headroom waiting to be sculpted.',
          redFlag: 'Blinks right as the 600ms matrix flashes and wonders where the numbers went.',
          lifeMotto: '"Every memory grandmaster started by staring blankly at a flashing grid."',
          quirkyFact: 'Your brain is currently growing fresh synaptic dendritic spines in the occipital lobe.',
        },
        nextMilestone: {
          targetLabel: nextMilestoneItem.label,
          targetMinutes: nextMilestoneItem.minutes,
          minutesRemaining: remaining,
          progressPercent,
        },
        shareText: `🌱 Cognitive Archetype: The Latent Neural Spark\n⏱️ Total Training: ${totalMinutes}m | Day ${protocol?.curriculumDay || 1}\nAwakening dormant photographic memory circuitry! #PhotographicMemoryMaster`,
      };
  }
}
