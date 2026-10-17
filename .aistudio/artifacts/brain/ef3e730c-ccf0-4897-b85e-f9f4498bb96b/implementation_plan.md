# Implementation Plan: Fix Timer Counting & Daily Protocol Continuous Progress

## Problem Statement
The user reported:
1. The game timer is broken and does not count accurately.
2. The dashboard displays `0%` and `0m 00s` even after playing games for several seconds.
3. User specified requirements via clarification:
   - **Progress Calculation**: Continuous percentage based on actual seconds trained across protocol modules (rather than coarse all-or-nothing milestone increments).
   - **Game Time Tracking**: All game modes (including Eidetic Matrix, Ayumu Chimp, Spaced Repetition, Speed Cards, Palace, Numbers, Cards, Words, Faces, Names, etc.) must actively track live seconds and auto-save reliably.

## Root Cause Analysis
1. **Server & Cloud Sync Reset Bug (`server.ts` & `firebase.ts`)**:
   - `DEFAULT_YOSEPH_STATE` in `server.ts` had an empty `currentCycleDate: ""` and `lastTrainedDate: ""`.
   - On master progress fetch / auto-sync, `server.ts` checked `userState.protocol.currentCycleDate !== todayStr`. If empty, it treated it as a day rollover and reset all module seconds to `0`, overwriting active local gameplay progress with 0s.
   - In `firebase.ts` (`mergeUserProgress`), if `cloudDateStr` was blank or uninitialized, it did not recognize today's date properly and favored empty zeroed states.
2. **Missing Game Modes in Session Tracking (`App.tsx`)**:
   - `PLAYABLE_GAME_MODES` only contained 8 legacy modes. Modes like `eidetic-matrix`, `ayumu-chimp`, `spaced-repetition`, and `daily-workout` were excluded from the active timer and module mapping.
   - When users played unmapped games, `activeModuleTarget` was `null`, so protocol task time was never updated.
3. **Coarse Progress Math in `DailyProtocolTracker.tsx`**:
   - `DailyProtocolTracker` calculated progress percentage as `(completedTasksCount / 3) * 100`, where `isPegsDone`, `isNBackDone`, and `isDetectiveDone` were boolean flags that stayed `false` until reaching 600–900 seconds. Playing for seconds or minutes always rendered `0%`.
   - Formatted time display in the header and cards did not reflect live accumulated seconds continuously.

---

## Proposed Changes

### 1. Backend & Synchronization Reliability (`server.ts` & `src/utils/firebase.ts` & `src/utils/yosephSync.ts`)
- Initialize `currentCycleDate` and `lastTrainedDate` with current ISO date strings rather than empty strings in `DEFAULT_YOSEPH_STATE`.
- In `server.ts` rollover detection: ensure rollover only triggers if `currentCycleDate` exists, is valid, and is strictly a prior calendar day (not empty/uninitialized). Preserve any existing accumulated time when syncing within the same day.
- In `src/utils/firebase.ts`: ensure `mergeUserProgress` safely compares today's dates, always taking the maximum `timeSpentSeconds` between local and cloud to prevent rollback or wiping during live gameplay.

### 2. Comprehensive Game Timer & Live Tracking (`src/App.tsx`)
- Expand `PLAYABLE_GAME_MODES` to encompass all games:
  `'cards' | 'words' | 'faces' | 'numbers' | 'names' | 'palace' | 'speed-cards' | 'free-training' | 'eidetic-matrix' | 'ayumu-chimp' | 'spaced-repetition' | 'daily-workout'`.
- Map game modes intelligently to protocol modules so every game contributes to daily training time:
  - **Module 1 (Systems & Working Memory)**: `cards`, `numbers`, `ayumu-chimp`, `spaced-repetition`.
  - **Module 2 (Speed & Spatial Visualization)**: `speed-cards`, `palace`, `eidetic-matrix`.
  - **Module 3 (Associative & Pattern Memory)**: `faces`, `words`, `names`, `daily-workout`, `free-training`.
- Decouple live local timer state from aggressive cloud re-fetching so background sync polls never reset active seconds or interrupt the running stopwatch.
- Ensure the header stopwatch displays seconds smoothly (`MM:SS` or `Xm Ys`).

### 3. Continuous Dashboard Progress Calculation (`src/components/DailyProtocolTracker.tsx` & `src/components/StatsDashboard.tsx`)
- Update `DailyProtocolTracker.tsx` to calculate continuous percentage:
  - `totalTargetSeconds = module1.targetSeconds + module2.targetSeconds + module3.targetSeconds` (typically 2400s / 40 mins).
  - `totalSpentSeconds = module1.timeSpentSeconds + module2.timeSpentSeconds + module3.timeSpentSeconds`.
  - `progressPercent = Math.min(100, Math.round((totalSpentSeconds / totalTargetSeconds) * 100))`.
  - Display continuous progress both in the main summary card and circular/linear gauges.
  - When playing, dynamic updates reflect every single second trained.
- Update `StatsDashboard.tsx` and `FreeTrainingView.tsx` to display live updated seconds and minutes without requiring page reloads.

---

## Verification Plan
1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript errors or missing imports.
2. **Timer Accuracy**: Verify the live session timer increments 1 second every second across all game modes (including Eidetic Matrix, Ayumu Chimp, Palace, Cards, etc.).
3. **Continuous Progress**: Verify playing for 30 seconds immediately reflects `30s` in total time trained and increments the dashboard percentage from `0%` upward continuously.
4. **Auto-Save & Sync Persistence**: Verify data persists in local storage and syncs without any 0-value regression or reset.
