# Resilient 20-Minute Game Session Resumption & Bonus Loci Architecture

An architectural blueprint to ensure that the three 20-minute daily cognitive games seamlessly resume from where the user stops, prevent premature midday timezone resets, establish the 3x20-minute games (60 minutes total) as the primary daily completion standard, and elevate the 1-hour Memory Palace (Loci) training into a dedicated high-value bonus immersion section.

## User Review & Critical Decisions

> [!IMPORTANT]
> All key design and product decisions have been confirmed through Phase 1 user input:
> - **Game Session Continuation**: When exiting a 20-minute game mid-way and reopening it on any device (PC, Phone 1, Phone 2), the game automatically resumes from accumulated minutes (e.g., 8 minutes played, 12 minutes remaining) until the 20-minute target is fulfilled.
> - **Primary Daily Protocol Standard**: Completing all three 20-minute games (60 minutes total) officially marks the daily protocol as Complete (Green day status in calendar history, streak incremented, +350 XP).
> - **Memory Palace (Loci) 1-Hour Session**: Decoupled from the mandatory daily gate and reorganized into a **Dedicated Bonus Training Section** with independent rewards (+500 Bonus XP, "Grand Loci Architect" badge, and separate tracking).
> - **Timezone-Safe Cloud Persistence**: Fixed the server UTC midnight rollover bug that was prematurely resetting in-progress training to 0 in the afternoon.

---

## 1. Overview & Core Concept

- **What It Does**: Provides Yoseph with uninterrupted cognitive training across three devices (PC, Phone 1, Phone 2). If a session is interrupted after 8 minutes, reopening the app immediately reflects 8 minutes completed and 12 minutes remaining. Achieving 20 minutes across all three primary games completes the day's curriculum. The 1-hour Memory Palace focus timer remains accessible at any time as an optional, high-yield bonus training module.
- **Target Persona**: Yoseph (Yosi), an athlete training cognitive working memory, phonetic peg transcoding, and visual pattern recognition daily without losing seconds when switching between devices.
- **Key Value Delivered**: Zero data loss upon closing/switching devices, clear demarcation between required daily dosage (60m games) and optional deep immersion (60m Loci), and reliable cross-device synchronization via Cloud Firestore and backend caching.

---

## 2. User Experience & Visual Design

### A. Game Session Resumption & HUD Experience
- **Active Game HUD (In-Game Top Bar)**:
  - Clean, unboxed text indicators: `Elapsed: 08:24` · `Remaining: 11:36` · `Target: 20:00`.
  - Dynamic progress indicator: Slim accent bar showing exact percentage towards the 20-minute milestone.
  - State pill buttons for controls only: Functional `Pause` / `Resume` toggle and `← Protocol` exit button.
  - Auto-Save Beacon: Unobtrusive text indicator (`● Auto-saved to cloud`) updating without distracting gameplay.

### B. Daily Protocol Tracker Restructuring
- **Primary 1-Hour Core Protocol Card (3 Disciplines x 20m)**:
  - Displays the 3 active disciplines:
    1. **Mnemonic Major Pegs** (20 Min) · Number-to-Image Data Keys
    2. **Dual N-Back Buffer** (20 Min) · Working Memory RAM
    3. **Symbol Detective Lab** (20 Min) · Script & Feature Binding Speed
  - Progress Meter: Displays `X / 3 Completed (XXm / 60m)` with a distinct completion state when all 3 reach 20 minutes.
  - Clear Status Feedback: If a game was paused at 7m 30s, the card shows `7m 30s / 20m (38%) · 12m 30s remaining` and a direct `Resume Game →` button.
- **Separate Bonus Immersion Section ("Deep Loci Memory Palace")**:
  - Positioned directly below the primary protocol in an elevated, dark-indigo slate card.
  - Distinct gold/amber accent scheme denoting bonus prestige.
  - Displays independent 60-minute focus countdown timer, progress wheel, and bonus badge: `Bonus Immersion (+500 XP)`.
  - Does NOT block daily completion or green streak markings.

### C. Visual Identity & Anti-Slop Discipline
- **Color Budget (60-30-10)**:
  - 60% Slate Dark Foundation (`bg-slate-950`, `bg-slate-900/80`)
  - 30% Structural Borders & Subtle Typography (`border-slate-800`, `text-slate-400`, `text-white`)
  - 10% Intentional Functional Accents: Cyan (`text-cyan-400`) for active game telemetry, Emerald (`text-emerald-400`) for completed criteria, Amber (`text-amber-400`) for bonus loci immersion.
- **Metadata Layout**: No static capsule pills around times or dates; clean typographic separation (`·`, `/`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Resolving the Midday / Afternoon Timezone Reset
- **The Issue**: The backend server was using `new Date().getFullYear()...` in UTC time. In the afternoon (local time), UTC crossed midnight into the next calendar day, triggering `ensureMasterDataUpToDate()` to archive the previous day and reset `todayGamesBreakdown` and `tasks` to 0.
- **Chosen Approach**: Make the user's client cycle date (local date string) authoritative. The server will only advance days when the client's local date explicitly exceeds the stored date. Additionally, the client will pass `?date=YYYY-MM-DD` in sync requests and prevent any destructive rollover during an active day.

### Decision 2: Mid-Session Continuation Engine
- **The Issue**: When closing or leaving a game, state variables were resetting because `currentGameSeconds` was bound to an interval that re-initialized from a fluctuating dependency array, and game components did not mount directly into active trial states.
- **Chosen Approach**:
  1. Store the exact cumulative seconds in `protocol.tasks[i].secondsElapsed` and `freeTrainingStats.todayGamesBreakdown[mode]`.
  2. In `App.tsx`, compute the true elapsed baseline from the max of local storage, task progress, and cloud sync.
  3. Keep the active game timer robust against tab closures using `visibilitychange`, `pagehide`, and `beforeunload` beacon flushes.
  4. In the individual game components (`DualNBackGame`, `MnemonicPegsGame`, `SymbolDetectiveGame`), render an immediate "Resume Session" state with the exact remaining time prominently displayed, allowing the user to pick up immediately without restarting trial counts or losing their place.

### Decision 3: Decoupling Memory Palace from Daily Streak Requirement
- **The Issue**: The user requested that the 3x20m games represent the daily requirement, while the 1-hour Memory Palace session is a bonus. Previously, all 4 tasks were required for daily completion.
- **Chosen Approach**:
  - Update `checkIsDailyProtocolFullyDone` in `protocol.ts`, `DailyProtocolTracker.tsx`, `firebase.ts`, and `server.ts` to evaluate `pegsDone && nbackDone && detectiveDone`.
  - When all 3 are completed, set `isCompleted: true`, increment streak, award +350 XP, and mark the day green.
  - Treat Memory Palace as an independent bonus task: completing it awards +500 XP and marks the bonus immersion achievement.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       YOSEPH CROSS-DEVICE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PC Browser (Chrome)      Phone 1 (PWA)          Phone 2 (Mobile Web)      │
│   ┌──────────────────┐    ┌──────────────────┐   ┌──────────────────┐       │
│   │  Active Session  │    │  Active Session  │   │  Active Session  │       │
│   │  (e.g., 8m Pegs) │    │  (Resumes at 8m) │   │  (Resumes at 8m) │       │
│   └─────────┬────────┘    └─────────┬────────┘   └─────────┬────────┘       │
│             │                       │                      │                │
│             ▼                       ▼                      ▼                │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                    Client Unified Sync Layer                    │       │
│   │   - LocalStorage Caching (Pristine Immediate Saves)             │       │
│   │   - Authoritative Local Cycle Date (No UTC Drift)               │       │
│   │   - 1-Second Precision Timer Loop (Non-fluctuating)             │       │
│   └──────────────────────────────┬──────────────────────────────────┘       │
│                                  │                                          │
│                 ┌────────────────┴────────────────┐                         │
│                 ▼                                 ▼                         │
│   ┌───────────────────────────┐     ┌───────────────────────────┐           │
│   │  Cloud Firestore Database │     │      Backend Server       │           │
│   │  `yoseph_cloud_sync/`     │     │  `/api/yoseph/progress`   │           │
│   │  Real-Time Subscription   │     │  Local-Date-Guarded       │           │
│   │  Document Snapshot        │     │  Data Redundancy Cache    │           │
│   └───────────────────────────┘     └───────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key State & Logic Changes
1. **`src/utils/protocol.ts`**:
   - Update `checkIsDailyProtocolFullyDone` to evaluate exclusively the 3 core games (20 min each).
   - Update `ProtocolTask` definitions to clarify the 3 mandatory daily tasks vs. the 1 bonus task.
2. **`server.ts`**:
   - Fix `ensureMasterDataUpToDate` to never compare against server UTC date; honor client local date passed in query / payload.
   - Adjust day completion check to check the 3 core games.
3. **`src/utils/firebase.ts`**:
   - Synchronize merge logic so `isDailyDone` checks the 3 core games, while preserving the independent 60m Memory Palace timer state.
4. **`src/App.tsx`**:
   - Stabilize the 1-second timer loop and ensure `currentGameSeconds` seamlessly loads and displays accumulated time.
   - Ensure clean sync debouncing that never overwrites higher elapsed seconds with stale zero values.
5. **`src/components/DailyProtocolTracker.tsx`**:
   - Reorganize UI into **Primary Daily Protocol (3 Games x 20m)** and **Dedicated Bonus Training (1-Hour Memory Palace)**.
   - Update progress calculation to reflect 100% upon completing the 3 games.
