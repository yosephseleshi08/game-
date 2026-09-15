import { FlashSpeed, FlashTimePlanPhase } from '../types';

export const FLASH_TIME_PLAN_PHASES: FlashTimePlanPhase[] = [
  {
    phase: 1,
    phaseName: 'Phase 1: Retinal Scaffolding',
    daysRange: 'Days 1 – 30',
    minDay: 1,
    maxDay: 30,
    targetSpeedMs: 1200,
    speedLabel: '1.2s Exposure',
    tag: 'Beginner / Foundation',
    title: 'Saccadic Calibration & Iconic Trace Priming',
    scientificGoal:
      'Train the visual cortex to stabilize ocular saccades and retain an iconic after-image longer than 1,000 milliseconds without blinking.',
    neuroFocus: 'Occipital lobe V1/V2 activation and suppression of premature vocal subvocalization.',
    dailyProtocolBenchmark: 'Capture 4-digit Ayumu strings & 5-cell Eidetic Matrix grids reliably.',
    ayumuExpectation: '4 – 5 Digits comfortably recalled',
  },
  {
    phase: 2,
    phaseName: 'Phase 2: The Subconscious Shift',
    daysRange: 'Days 31 – 90',
    minDay: 31,
    maxDay: 90,
    targetSpeedMs: 600,
    speedLabel: '600ms Exposure',
    tag: 'Pro Gaze',
    title: 'Visual Chunking & Spatial Gestalt Recognition',
    scientificGoal:
      'Cut exposure time below conscious inner-speech reading speed (~800ms). Forces the visual sensory register to chunk numbers and coordinates into holistic visual shapes.',
    neuroFocus: 'Posterior parietal cortex spatial mapping and rapid Dorsal stream processing.',
    dailyProtocolBenchmark: 'Capture 6-digit Ayumu strings & 6-cell Eidetic Matrix patterns under 600ms.',
    ayumuExpectation: '6 – 7 Digits within half a second',
  },
  {
    phase: 3,
    phaseName: 'Phase 3: High-Density RAM',
    daysRange: 'Days 91 – 180',
    minDay: 91,
    maxDay: 180,
    targetSpeedMs: 300,
    speedLabel: '300ms Exposure',
    tag: 'Photographic',
    title: 'Sub-Saccadic Instantaneous Snapshot',
    scientificGoal:
      'Exposure duration matches a single human eye fixation. You no longer move your eyes across the grid; you absorb the entire matrix in one retinal snapshot.',
    neuroFocus: 'Dorsolateral prefrontal cortex (DLPFC) buffer holding high-bandwidth iconic trace.',
    dailyProtocolBenchmark: 'Capture 7–8 digit Ayumu sequences & Level 7 Eidetic Matrix grids in 300ms.',
    ayumuExpectation: '7 – 8 Digits in a single blink',
  },
  {
    phase: 4,
    phaseName: 'Phase 4: Sub-Second Eidetic Threshold',
    daysRange: 'Days 181 – 270',
    minDay: 181,
    maxDay: 270,
    targetSpeedMs: 150,
    speedLabel: '150ms Exposure',
    tag: 'Chimp / Ayumu',
    title: 'The Ayumu Benchmark (Faster than Conscious Thought)',
    scientificGoal:
      '150ms is faster than the minimum latency of a voluntary eye saccade (~200ms). The conscious analytical mind is physically bypassed; recall relies 100% on genuine photographic after-image.',
    neuroFocus: 'Direct retinal-pulvinar-collicular pathway and ultra-rapid iconic sensory buffer.',
    dailyProtocolBenchmark: 'Capture 8–9 digit Ayumu sequences in 150ms and reproduce the exact order from iconic memory.',
    ayumuExpectation: '8 – 9 Digits rivaling Kyoto University chimpanzees',
  },
  {
    phase: 5,
    phaseName: 'Phase 5: Cognitive Transcendence',
    daysRange: 'Days 271 – 365',
    minDay: 271,
    maxDay: 365,
    targetSpeedMs: 150,
    speedLabel: '150ms Extreme Flash',
    tag: 'Grandmaster Recall',
    title: 'Universal Eidetic Synthesis & Permanent Palace Storage',
    scientificGoal:
      'Synthesizing instant 150ms flash capture directly with the Method of Loci and Major System. You can flash-read a page of numbers or a complex board and encode it indefinitely into spatial palaces.',
    neuroFocus: 'Hippocampal sharp-wave ripple consolidation and frontal-temporal long-term indexing.',
    dailyProtocolBenchmark: 'Consistently clear Ayumu 9 digits in 150ms flash, Dual N-Back N=4, and 25+ rapid peg conversions.',
    ayumuExpectation: '9+ Digits (Top 0.01% of human memory athletes)',
  },
];

/**
 * Returns the recommended target flash speed for any day in the 365-day curriculum.
 */
export function getPlanSpeedForDay(day: number): FlashSpeed {
  if (day <= 30) return 1200;
  if (day <= 90) return 600;
  if (day <= 180) return 300;
  return 150;
}

/**
 * Returns the full phase details for a given day in the 365-day curriculum.
 */
export function getFlashPlanForDay(day: number): FlashTimePlanPhase {
  const clampedDay = Math.max(1, Math.min(365, day));
  const phase = FLASH_TIME_PLAN_PHASES.find(
    (p) => clampedDay >= p.minDay && clampedDay <= p.maxDay
  );
  return phase || FLASH_TIME_PLAN_PHASES[0];
}
