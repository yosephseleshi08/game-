# Photographic Memory Master

An interactive cognitive training suite designed to develop eidetic and photographic recall through scientific visual flash exercises, primate-level sequence memory, working memory expansion, and mnemonic encoding systems.

---

## 🌟 Key Features

### 1. 365-Day Daily Protocol & Anti-Burnout Lockout
- **Structured Daily Quota**: 4 daily disciplines curated to build neural scaffolding without cognitive fatigue:
  - **Dual N-Back**: Prefrontal cortex working memory expansion.
  - **Mnemonic Peg Conversions**: Sub-second Major System number-to-image encoding.
  - **Memory Palace (Method of Loci)**: Spatial route navigation and SM-2 spaced repetition.
  - **Eidetic Matrix**: Iconic retinal persistence and sub-second chunking.
- **12:00 AM (Midnight) Reset**: Daily cycles refresh at midnight local time with a live countdown clock. Completing the daily quota engages the anti-burnout lockout to ensure adequate rest and memory consolidation during sleep.
- **365-Day Genius Roadmap**: Clear milestones tracking progression from *Novice Observer* to *Top 0.1% Memory Athlete*.

### 2. Flash Time Masterplan & Millisecond Lock
- **Scientific Speed Progression**:
  - **Phase 1 (Days 1–30)**: `1200ms` (Visual chunking & saccadic anchoring)
  - **Phase 2 (Days 31–90)**: `600ms` (Subvocalization suppression)
  - **Phase 3 (Days 91–180)**: `300ms` (Iconic trace phosphor persistence)
  - **Phase 4 (Days 181–270)**: `150ms` (Kyoto Ayumu primate threshold)
  - **Phase 5 (Days 271–365)**: `150ms Extreme` (High-density multi-feature binding)
- **Speed Lock System**: Lock training sessions to your curriculum's exact target speed for up to 4.0x XP multipliers.

### 3. Cognitive Training Labs
- **Eidetic Matrix**: Rapid grid snapshot training with configurable dimensions (3x3 to 6x6) and exposure durations down to 150ms.
- **Ayumu Sequence (Chimpanzee Test)**: Replicates the Kyoto University primate memory benchmark. Numbers appear across the screen and instantly mask into white squares. Tap in numerical order from pure sensory memory.
- **Dual N-Back**: Simultaneous auditory (spoken letters) and spatial (grid positions) matching at N=1, 2, 3, or 4 back.
- **Mnemonic Speed Lab**: Rapid-fire digit-to-peg mental translations to build instant associative encoding reflexes.
- **Memory Palace Route**: Interactive 3D/isometric room traversal with spaced repetition (SM-2) memory cards.

### 4. Player Profiles & Cloud Synchronization
- **Firebase Authentication**: Individual accounts with email and password.
- **Custom Avatars & Profile Photos**: Choose from 8 cognitive archetype avatars or provide custom profile photo URLs.
- **Cloud State Sync**: Seamlessly backs up XP, levels, unlocked titles, daily protocol progress, and personal bests.
- **Community Players Directory**: View community members, rank by level, 365-day plan day, Ayumu peak, and streak.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Visualizations**: Recharts (cognitive radar charts and progress tracking)
- **Backend / Services**: Express, Firebase Firestore & Firebase Authentication
- **Audio Synthesis**: Web Audio API synthesized procedural tones and sound effects
- **Build Tool**: Vite

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

### Code Quality
```bash
# Run TypeScript validation
npm run lint
```

---

## 🔐 Firebase Authentication Setup & Domain Authorization

If you deploy this app or run it on Google Cloud Run, Firebase Authentication requires your domain to be whitelisted before users can sign in with Google or Email/Password.

### Resolving `Firebase: Error (auth/unauthorized-domain)`
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `ai-studio-game-05100fdb-36e9-4559-910e-6e73535f5b21`.
3. In the left sidebar, navigate to **Build** > **Authentication** > **Settings** tab.
4. Scroll down to **Authorized domains**.
5. Click **Add domain**.
6. Enter your domain:
   - For specific Cloud Run deployments: paste your full hostname (e.g. `ais-dev-olaxzidg2rlblj6lu5wtf3-260784122245.europe-west1.run.app`).
   - Or to authorize all Cloud Run preview containers, simply add `run.app`.
7. Click **Save**.

### Resolving `Firebase: Error (auth/operation-not-allowed)`
1. Navigate to **Authentication** > **Sign-in method** tab in Firebase Console.
2. Ensure **Google** and **Email/Password** providers are toggled to **Enabled**.
3. Click **Save**.

### ⚡ Instant Local Mode (Zero Configuration)
If you do not want to configure Firebase Console, click **"Continue as Local Athlete"** directly in the Sign-In modal or User Profile modal. All training data, XP, levels, custom usernames, and 365-day curriculum progress are preserved in local storage with full functionality.

---

## 🧠 Cognitive Science Principles

1. **Iconic Memory Persistence (Sperling Paradigm)**: Visual information remains in iconic sensory storage for 200–500ms before decaying. Training with sub-second flash rates forces the brain to encode patterns directly into visual short-term memory (VSTM).
2. **Kyoto Primate Threshold**: Research on chimpanzee *Ayumu* demonstrated near-photographic recall of masked digits within 210ms. Humans can train toward this benchmark through repeated saccadic suppression.
3. **Prefrontal Neuroplasticity (Dual N-Back)**: Dual visual-auditory stimuli increase prefrontal dopamine receptor density and fluid intelligence ($G_f$).
4. **Method of Loci & Spaced Repetition**: Combines ancient spatial navigation architecture with the SuperMemo SM-2 interval algorithm for long-term retention.
