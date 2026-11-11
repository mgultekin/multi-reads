<div align="center">

# 📖 FolioLingo
### Minimalist Reader & Context-Aware Philological Learning Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_&_Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*An open-source, zero-cost language learning application combining authentic literature reading, instant philological word breakdown, 12-language global pairing, chapter mastery quizzes, and minimalist habit tracking.*

---

</div>

## 🌟 Overview

**FolioLingo** bridges the gap between passive reading and active language acquisition. Traditional flashcard apps suffer from lack of authentic context, while standard e-readers break reading immersion whenever a reader encounters unfamiliar vocabulary.

FolioLingo solves this through an **interactive parallel reading canvas** powered by a **two-tier low-latency AI philology engine**. Readers can read classic world literature (Spanish, French, German, Italian, English), tap any word for an instant contextual translation in their chosen native language (Turkish, English, Spanish, Japanese, and 8 more), inspect deep grammatical morphology on demand, and validate their comprehension with interactive end-of-chapter quizzes.

---

## 🚀 Key Features

### 1. ⚡ Two-Tier Low-Latency Philological Engine
- **Tier 1 (Instant <300ms)**: Returns immediate contextual translation and base dictionary lemma using Google Gemini 2.5 Flash with streamlined low-thinking latency. Repeated word clicks resolve in **0ms** via client-side caching.
- **Tier 2 (Progressive Philology)**: An expandable deep-grammar drawer provides part of speech, grammatical case/gender/number, verb tense/mood/aspect, etymology, and cultural nuances without stalling the reader.

### 2. 🌍 14-Language Global Native Pairing & Parallel Bilingual Mode
- Read in any target language while translating into your own mother tongue.
- Supported base translation languages: **English, Turkish, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Japanese, Korean, Chinese, Dutch, and Polish**.
- Toggle **Parallel Bilingual Mode** in the Reader ribbon to view aligned paragraph translations beneath the original prose, or switch your native language on the fly from the top navigation bar or word popover.

### 3. 🎯 Interactive Chapter Comprehension Quizzes
- Every finished section offers an end-of-chapter comprehension test:
  1. **Narrative Comprehension**: Verifies understanding of the key story events.
  2. **Contextual Vocabulary**: Cloze-style test targeting new words in context.
  3. **Idiomatic / Phrase Insight**: Tests nuanced phrases from the passage.
- Instant scoring, celebratory animations, and **+25 XP** progression rewards.

### 4. 📚 Spaced-Repetition Personal Wordbook
- Star and save any encountered word directly from the reading canvas.
- Automatic tracking of word mastery levels (Learning, Familiar, Mastered), review intervals, and original book context sentences.

### 5. 🏆 Social League & Habit Engine
- Minimalist daily reading streaks, weekly XP graphs, and an active league leaderboard with tiered divisions (Bronze, Silver, Gold, Obsidian).

### 6. 🔄 Local-First & Firestore Cloud Sync
- Operates offline with local browser storage.
- Synchronizes book progress, saved vocabulary, and user statistics to **Firebase Firestore** whenever connected.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FolioLingo Client                                     │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │   Parallel Reader     │   │   Instant Lexicon     │   │   Section Quiz Modal     │  │
│  │   (Tokenized Canvas)  │   │   (Client Memory Map) │   │   (3-Question Retention) │  │
│  └───────────┬───────────┘   └───────────┬───────────┘   └────────────┬─────────────┘  │
│              │                           │                            │                │
│              ▼                           ▼                            ▼                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                 Dual-Language State & Wordbook Storage Engine                    │  │
│  │             (Local-First Cache  <──>  Firebase Firestore Cloud Sync)             │  │
│  └───────────────────────────────────────┬──────────────────────────────────────────┘  │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │
                                           ▼ HTTP Proxy (/api/gemini/*)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Node.js / Express Server                                │
│                                                                                        │
│  ┌───────────────────────────────────┐    ┌─────────────────────────────────────────┐  │
│  │  POST /api/gemini/breakdown       │    │  POST /api/gemini/quiz                  │  │
│  │  • ThinkingLevel.LOW (~300ms)     │    │  • Structured JSON Quiz Schema          │  │
│  │  • Contextual Translation & Lemma │    │  • 3 Contextual Comprehension Questions │  │
│  └─────────────────┬─────────────────┘    └────────────────────┬────────────────────┘  │
└────────────────────┼───────────────────────────────────────────┼───────────────────────┘
                     │                                           │
                     ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     Google Gemini 2.5 Flash (`@google/genai`)                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
├── docs/
│   └── artifacts/                    # Architectural decision records & blueprints
│       ├── v0.3.0_performance_and_quizzes.md
│       ├── v0.3.1_github_portfolio_plan.md
│       ├── v0.4.0_translation_speed_engine.md
│       ├── v0.5.0_product_owner_use_cases.md
│       └── architecture_decisions.md
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Dual-language selector, streaks, and view tabs
│   │   ├── ReaderView.tsx            # Sentence-aligned tokenized canvas & quiz trigger
│   │   ├── WordBreakdownPopover.tsx  # Two-tier instant translation & deep grammar
│   │   ├── SectionQuizModal.tsx      # 3-question interactive comprehension check
│   │   ├── WordbookView.tsx          # Spaced-repetition saved vocabulary manager
│   │   ├── SocialLeagueView.tsx      # Weekly leaderboards & XP division tiers
│   │   ├── LibraryView.tsx           # Multi-language open-source literature catalog
│   │   ├── SettingsModal.tsx         # User preferences, themes, & font typography
│   │   └── ImportModal.tsx           # Custom text/book importer
│   ├── data/
│   │   └── constants.ts              # Books library, default seeds, 12 base languages
│   ├── lib/
│   │   └── firebase.ts               # Firestore & Firebase Auth initialization
│   ├── services/
│   │   ├── contentService.ts         # Book parsing, chapter segmentation, and tokens
│   │   ├── firebaseSync.ts           # Bidirectional cloud persistence reconcile
│   │   ├── storageService.ts         # LocalStorage fallback & reactive subscribers
│   │   ├── instantLexicon.ts         # In-memory O(1) dictionary lookup cache
│   │   └── socialService.ts          # XP computation and league standings
│   ├── types/
│   │   └── index.ts                  # Domain models, quiz schemas, and user profiles
│   ├── App.tsx                       # Main application state & navigation router
│   ├── main.tsx                      # React root entry
│   └── index.css                     # Tailwind CSS v4 styling & typography
├── server.ts                         # Express server with Vite middleware & Gemini API proxy
├── firestore.rules                   # Granular Firestore security rules
├── firebase-blueprint.json           # Schema blueprint for user profiles and wordbooks
├── package.json                      # Scripts & dependencies
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🏷️ Release History & Version Tags

| Version | Milestone Description |
|:---|:---|
| **`v0.1.0`** | **Core Reader Canvas (Alpha)**: Tokenized reading canvas, dual-sentence alignment, local instant lexicon lookup, and library catalog. |
| **`v0.2.0`** | **Persistence & Social (Beta)**: Firebase Firestore cloud sync, spaced-repetition wordbook, streak tracking, and league leaderboards. |
| **`v0.3.0`** | **Performance & Quizzes**: Two-tier low-latency philology engine (`ThinkingLevel.LOW`), 12-language base pairing, chapter quizzes, and trademark elimination. |
| **`v0.3.1`** | **Portfolio Showcase**: Comprehensive portfolio documentation, system architecture diagrams, and process artifacts archive. |
| **`v0.4.0`** | **Hybrid Zero-Latency Translation Engine**: Proactive section batch pre-caching, 80ms pointer hover prefetching, `gemini-3.1-flash-lite` (`ThinkingLevel.MINIMAL`), and resilient multi-provider backup translation. |
| **`v0.5.0`** | **Product Owner Overhaul & Use-Case Catalog**: Server-assisted Project Gutenberg full-text loader, persistent section progress & "Continue Reading" shelf, Bilingual Parallel View, SRS Due-Today queue & CSV/Anki export, Unicode-safe Cloze recall, decoupled Words Read vs. XP math, and Firestore-synced Personal Analytics & Reading Log. |

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mgultekin/multi-reads.git
cd multi-reads
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🗺️ Upcoming Roadmap

- [x] Two-tier word latency split (sub-300ms lookups).
- [x] Global 12-language on-the-fly translation pairing.
- [x] Interactive chapter comprehension quizzes.
- [x] **Proactive Section Batch Pre-fetching & 80ms Hover Intent Cache (`v0.4.0`)**.
- [x] **Resilient Server-Side Multi-Provider Backup Translator (`v0.4.0`)**.
- [x] **Product Owner Audit, 12 Formal Use Cases, Bilingual Parallel Reader, SRS Queue & CSV/Anki Export, and Firestore Reading Logs (`v0.5.0`)**.
- [x] **Offline Heuristic Dictionary**: Bundled IndexedDB dictionary (`offline_dictionary`) & rule-based morphological lemmatizer across ES, FR, DE, IT, TR, and EN (`v0.6.0`).

---

## 👤 Author

**Mustafa Gültekin**  
- Email: [mustafagultekinn01@gmail.com](mailto:mustafagultekinn01@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
