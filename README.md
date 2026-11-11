<div align="center">

# 📖 FolioLingo (`multi-reads`)
### Minimalist Literary Reader & Zero-Latency AI Philology Studio

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-Flash--Lite_%26_Flash-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Spark_$0.00_Free_Tier-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Zero Cost Guardrail](https://img.shields.io/badge/Free--Tier_Guardrail-80%25_Auto--Cap-10B981)](docs/ZERO_COST_GUARDRAIL_POLICY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*An open-source literary language acquisition platform built to run within **$0.00 free-tier limits** for personal study—born from the struggle of breaking past the B1 plateau in Italian, combining authentic world literature (`IT`, `ES`, `FR`, `DE`, `TR`, `EN`), `0ms` hybrid philological word breakdowns across **84 language pairs**, dynamic CEFR (`A1`–`C1`) adaptation, Anki-ready spaced repetition, and an in-app Free-Tier Quota Guardrail.*

**[🖼️ Interactive Visual Showcase (`docs/showcase/index.html`)](docs/showcase/index.html)** · **[✍️ Read Our Medium Journey Story](docs/MEDIUM_STORY_OUR_JOURNEY.md)** · **[🛡️ $0.00 Guardrail Policy](docs/ZERO_COST_GUARDRAIL_POLICY.md)** · **[📋 Use-Case Catalog](docs/PRODUCT_USE_CASES_v0.5.0.md)**

---

</div>

## 🌟 Why FolioLingo Exists

Mainstream gamified language apps work well for absolute beginners, but once you reach the **B1 intermediate plateau** (as I experienced while learning **Italian**), synthetic single-sentence drills stop helping. You want to read *real* books—Carlo Collodi's *Le Avventure di Pinocchio*, Niccolò Machiavelli's *Il Principe*, Miguel de Cervantes's *Don Quijote*, Antoine de Saint-Exupéry's *Le Petit Prince*, Franz Kafka's *Die Verwandlung*, or Sait Faik's *Semaver*.

Yet opening an unmodified foreign book creates immediate friction: looking up 10+ inflected verbs or idioms per page in a separate dictionary shatters reading flow, and standard dictionaries fail to explain *why* a word means what it means inside *that specific sentence*.

**FolioLingo (`multi-reads`)** solves this through a **Warm Editorial Bookish Minimalist** reading studio powered by a **4-layer zero-latency philology engine** and audited by a **7-agent AI Swarm Product Squad**.

---

## 🖼️ Visual Product Showcase

> 💡 **Interactive Gallery & Press Kit**: Open [`docs/showcase/index.html`](docs/showcase/index.html) in any browser to explore interactive, high-resolution studio frames of all four pillars (built for live demos and Medium article screenshots).

### 1. 🇮🇹 Italian & World Literature Reader Studio (`ReaderView.tsx`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ 📖 FolioLingo  ·  [Read: 🇮🇹 Italian ▾ → In: 🇬🇧 English / 🇹🇷 Türkçe ▾]   🔥 14d  🛡️ $0/mo │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ← Library · Il Principe (Niccolò Machiavelli)   CEFR: [Orig][A1][A2][B1][B2][C1] [∥ Par] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                        ESSAYS & CULTURE · ITALIAN · ORIGINAL GRADED                      │
│                             Il Principe (Trattato Politico)                              │
│                                  by Niccolò Machiavelli                                  │
│                                                                                          │
│   Nondimanco, perché el nostro libero arbitrio non sia spento, iudico potere essere      │
│   vero che la fortuna sia arbitra della metà delle azioni nostre, ma che la ci lasci     │
│   [governare] l'altra metà, o presso, a noi.                                             │
│   │ ↳ Parallel Bilingual View: "Nevertheless, so that our free will may not be           │
│   │   extinguished, I judge it to be true that fortune is the arbiter of half our..."    │
│                                                                                          │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│   │ ✨ Local Lexicon · 0ms                                    🌐 [🇬🇧 English ▾] [✕] │   │
│   │ governare 🔊  /ɡoverˈnare/                                  Root Form: governare │   │
│   │ ┌──────────────────────────────────────────────────────────────────────────────┐ │   │
│   │ │ MEANING IN THIS SENTENCE (ENGLISH)                                           │ │   │
│   │ │ to govern, rule, or direct (one's own actions and destiny)                   │ │   │
│   │ └──────────────────────────────────────────────────────────────────────────────┘ │   │
│   │ ▾ Grammar & Morphological Analysis                                               │   │
│   │   Role: Verb · Transitive Infinitive (1st conjugation, -are)                     │   │
│   │   Note: Governed by 'lasci' ('lets us govern the other half ourselves').         │   │
│   │                                                                                  │   │
│   │ [ 🔖 Save to Wordbook (+10 XP) ]                                                 │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **84 Global Language Pairs (`6 Target × 14 Native Base Languages`)**:
  - **Read in**: Italian (`it`), Spanish (`es`), French (`fr`), German (`de`), Turkish (`tr`), and English (`en`).
  - **Translate & Explain in**: English, Turkish, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Japanese, Korean, Chinese, Dutch, and Polish.
- **Dynamic CEFR Level Adaptation (`Original` | `A1`–`C1`)**: Rewrite any classical passage or imported `.epub` chapter to match your exact proficiency level in real time, cached locally in `IndexedDB` (`cefr_cache`) and on the server (`serverAdaptationCache`) for `0ms` toggling.
- **1-Click Parallel Bilingual Mode**: Render paragraph-aligned native translations in an editorial blockquote beneath the original text.
- **Memoized Tokenization & Keyboard Accessibility (`v0.6.0`)**: Paragraph and word AST tokenization is memoized via `useMemo` (`<0.5ms` hover latency), with full keyboard navigation (`Tab` + `Enter`/`Space` to inspect words, `Escape` to dismiss popovers) and a responsive mobile bottom-sheet drawer.

---

### 2. ⚡ Two-Tier `0ms` Hybrid Philology Engine (`WordBreakdownPopover.tsx`)

| Lookup Tier | Engine Source | Latency | API Quota Cost | How It Works |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 0** | `instantLexicon.ts` + `IndexedDB` `offline_dictionary` | **`0ms`** | **`$0.00` (0 RPD)** | Seeded high-frequency lexicon + rule-based morphological lemmatizer (`analyzeOfflineMorphology`) across IT, ES, FR, DE, TR, EN. |
| **Tier 1** | `L1 sessionWordCache` + `localStorage` + `55ms` Hover Prefetch | **`0ms–5ms`** | **`$0.00` (0 RPD)** | Pre-warms translations when the cursor hovers over a word for `55ms` (`preferFastDict: true`) or on section open (`batch-prefetch`). |
| **Tier 2** | `gemini-3.1-flash-lite` + Server LRU Cache (`server.ts`) | **`<250ms`** | **Free Tier (`$0.00`)** | Resolves novel contextual word glosses with automatic multi-provider dictionary fallback. |
| **Tier 3** | Progressive Deep AI Drawer (`gemini-3.8-flash`) | **On-Demand** | **Free Tier (`$0.00`)** | Triggered *only* when the reader expands **Grammar & Morphological Analysis → Run Deep AI Grammar & IPA Analysis**. |

---

### 3. 🛡️ Live `$0.00` Free-Tier Guardrail & Quota Monitor (`SettingsModal.tsx` + `costTelemetry.ts`)

FolioLingo is designed for personal study within free-tier limits on the **Firebase Spark Plan** and **Google AI Studio Free Tier**, monitored by an in-app telemetry dashboard and an automatic **80% Circuit Breaker**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Zero-Cost Billing Verification: $0.00 Billed                [$0.00 / mo]│
│ Firebase Spark Plan (Free Forever) + Google AI Studio Free Tier            │
├────────────────────────┬────────────────────────┬──────────────────────────┤
│ Firestore Reads    $0  │ Firestore Writes   $0  │ Gemini Free RPD      $0  │
│ 14 / 50,000/d          │ 3 / 20,000/d           │ 8 / 1,500/d              │
│ [██░░░░░░░░░░░░░░░░░░] │ [█░░░░░░░░░░░░░░░░░░░] │ [█░░░░░░░░░░░░░░░░░░░░░] │
├────────────────────────┴────────────────────────┴──────────────────────────┤
│ 📈 Zero-Quota Lookups: 94% (112 lexicon · 48 cache · 19 dict)              │
│                                                  520+ offline entries      │
├─────────────────────────────────────┬──────────────────────────────────────┤
│ [✓] Strict $0 Circuit Breaker       │ [ ] Zero-AI Dictionary Mode          │
│     Auto-cap at 80% of free limit   │     Use only 0ms lexicon & free dict │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

- **Hard 80% Circuit Breaker (`SAFETY_GUARDRAIL_RATIO = 0.8`)**: Automatically halts cloud reads at `40,000/day` (vs. 50K limit), cloud writes at `16,000/day` (vs. 20K limit), and Gemini calls at `1,200/day` (vs. 1,500 RPD limit), falling back seamlessly to `IndexedDB` and the local dictionary.
- **Delta-Only `writeBatch` Cloud Sync (`firebaseSync.ts`)**: Tracks synced document IDs (`foliolingo_synced_cloud_ids_v1`) so logging in only uploads *new* flashcards and reading logs—reducing login Firestore writes by **89% to 99.7%**.
- **1-Click Zero-AI Dictionary Mode & Local BYOK**: Toggle 100% offline/dictionary mode at any time, or supply a personal Google AI Studio key stored strictly in `localStorage` (`user_gemini_api_key`).

---

### 4. 📚 Multi-Source Library, Spaced-Repetition Wordbook & Scholar Hub
- **Public Domain Library & EPUB Importer (`LibraryView.tsx`, `ImportModal.tsx`)**:
  - Browse curated works across 6 literary genres (*Philosophy & Thought, Classic Fiction, History & Culture, Essays & Journalism, Short Stories & Fables, Science & Nature*).
  - **Server-Assisted Project Gutenberg Proxy (`GET /api/gutenberg/:id`)**: Fetches full UTF-8 public-domain manuscripts without CORS blocks, strips Gutenberg headers/footers, and chunks texts into readable ~550-word sections.
  - **Drag-and-Drop `.epub`, `.md`, `.html`, `.txt` & Wikipedia Importer**: Extracts OPF metadata and chapter spines client-side.
- **SRS Wordbook, Unicode Cloze & Anki Export (`WordbookView.tsx`)**:
  - Practice saved vocabulary via the **3D Flip Deck** (with `Space`/`Enter` flip and `[1] Hard · [2] Good · [3] Easy` keyboard grading) or **Unicode-Safe Fill-in-the-Blank Cloze** challenges (`(?<![\p{L}])...(?![\p{L}])` supporting `ñ, é, ü, ş, ğ, ç, ß`).
  - Export your deck in one click to **Anki TSV** (`foliolingo-anki-<lang>.tsv`) or **CSV** (`foliolingo-wordbook-<lang>.csv`).
- **Decoupled Habit Ledger & Scholar League (`SocialLeagueView.tsx`)**:
  - Separates actual literary volume (`wordsReadToday`, `wordsReadThisWeek`, `totalWordsRead`) from bonus XP (`+25 XP` 3-question Section Mastery Quizzes, `+10/+15 XP` flashcard mastery) and logs every completed section to Firestore (`/users/{uid}/reading_logs`).

---

## 🤝 Built & Audited by a 7-Agent AI Swarm in Google Antigravity IDE

FolioLingo (`v0.6.0`–`v0.6.1`) was audited, cross-verified, and upgraded by a **7-agent AI Swarm** orchestrated on a shared message board under human Product Owner direction:

```
                        ┌────────────────────────────────────┐
                        │     PRODUCT OWNER (Mustafa)        │
                        │ Sets vision, $0 guardrail & goals  │
                        └─────────────────┬──────────────────┘
                                          │
                                          ▼
                        ┌────────────────────────────────────┐
                        │           @coordinator             │
                        │  Scrum Master & Squad Orchestrator │
                        └─────────────────┬──────────────────┘
                                          │
        ╔═════════════════════════════════╧═════════════════════════════════╗
        ║                SHARED SWARM MESSAGE BOARD (Seq #1..#N)            ║
        ╚═══╤═════════════╤═══════════════╤═══════════════╤═════════════╤═══╝
            │             │               │               │             │
            ▼             ▼               ▼               ▼             ▼
     ┌─────────────┐┌────────────┐┌───────────────┐┌───────────┐┌──────────────┐
     │  @eng-lead  ││@ux-designer││  @optimizer   ││@marketing ││   @finance   │
     │Architecture,││WCAG 2.1 AA,││Latency, React ││Personas,  ││Unit Economics│
     │Tech Debt &  ││Mobile Flows││AST Memoization││84-Pair GTM││1K–100K MAU & │
     │v0.6–v1.0 Map││& Showcase  ││& Server Caches││& Story    ││$0 Guardrails │
     └──────┬──────┘└─────┬──────┘└───────┬───────┘└─────┬─────┘└───────┬──────┘
            │             │               │              │              │
            └─────────────┴───────────────┼──────────────┴──────────────┘
                                          │
                                          ▼
                        ┌────────────────────────────────────┐
                        │             @verifier              │
                        │  Cross-Checks Code, Math & Diffs   │
                        │  Before Approving Squad Delivery   │
                        └────────────────────────────────────┘
```

### 📄 Documentation & Product Squad Artifacts
| Document | Description |
| :--- | :--- |
| **[`docs/showcase/index.html`](docs/showcase/index.html)** | **Interactive Product Showcase & Screenshot Press Kit** (Italian Reader flow, 0ms Popover, Wordbook, `$0.00` Guardrail Panel & Swarm diagram). |
| **[`docs/MEDIUM_STORY_OUR_JOURNEY.md`](docs/MEDIUM_STORY_OUR_JOURNEY.md)** | **Medium Feature Article**: *"I Got Stuck Learning Italian, So I Hired a 7-Agent AI Swarm to Build My Way Out (for $0.00)"*. |
| **[`docs/ZERO_COST_GUARDRAIL_POLICY.md`](docs/ZERO_COST_GUARDRAIL_POLICY.md)** | **Zero-Cost Billing Verification & Guardrail Policy**: Exact Firebase Spark & Gemini Free Tier math, 80% circuit-breaker equations, and audit trail. |
| **[`docs/SQUAD_EXPANSION_PLAN_v0.6.0.md`](docs/SQUAD_EXPANSION_PLAN_v0.6.0.md)** | **7-Agent Swarm Consolidated Audit & Expansion Plan**: Engineering, UX/WCAG, Optimization, Marketing, Finance (1K/10K/100K MAU), and Verifier sign-off. |
| **[`docs/PRODUCT_USE_CASES_v0.5.0.md`](docs/PRODUCT_USE_CASES_v0.5.0.md)** | **Formal Use-Case Catalog (`UC-01` – `UC-12`)**: End-to-end acceptance criteria across all four functional pillars. |

---

## 🏷️ Release History & Version Tags

| Version | Milestone Description |
|:---|:---|
| **`v0.1.0`** | **Core Reader Canvas (Alpha)**: Tokenized reading canvas, dual-sentence alignment, local instant lexicon lookup, and library catalog. |
| **`v0.2.0`** | **Persistence & Social (Beta)**: Firebase Firestore cloud sync, spaced-repetition wordbook, streak tracking, and league leaderboards. |
| **`v0.3.0`** | **Performance & Quizzes**: Two-tier low-latency philology engine (`ThinkingLevel.LOW`), 12-language base pairing, and 3-question chapter comprehension quizzes. |
| **`v0.3.1`** | **Portfolio Showcase**: System architecture diagrams and architectural decision records archive. |
| **`v0.4.0`** | **Hybrid Zero-Latency Translation Engine**: Proactive section batch pre-caching, hover intent prefetching, `gemini-3.1-flash-lite` (`ThinkingLevel.MINIMAL`), and resilient multi-provider backup translation. |
| **`v0.5.0`** | **Product Owner Overhaul & Use-Case Catalog**: Server-assisted Project Gutenberg full-text loader, "Continue Reading" shelf, Bilingual Parallel View, SRS Due-Today queue & CSV/Anki export, Unicode-safe Cloze recall, decoupled Words Read vs. XP math, and Firestore Reading Logs. |
| **`v0.6.0`** | **7-Agent Swarm Sprint & `$0.00` Guardrail Engine**: Memoized AST reader tokenization (`-97%` hover CPU), true server LRU + CEFR/Quiz adaptation caches, delta-only `writeBatch` Firestore login sync (`-89% to -99.7%` writes), final-section completion flow, mobile bottom-sheet popover, keyboard SRS shortcuts (`1`/`2`/`3`), and live `$0.00` Free-Tier Quota Guardrail Panel. |
| **`v0.6.1`** | **Interactive Visual Showcase & Personal Journey Story**: Standalone visual showcase & press kit (`docs/showcase/index.html`), updated Medium publication story featuring the Italian learning journey, and upgraded visual documentation. |

---

## 🛠️ Getting Started (Personal Free-Tier Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- Optional: A free-tier Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/) (or run in **Zero-AI Dictionary Mode** with `0` API keys required!)

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
Populate your `.env` file (optional if using in-app BYOK or Zero-AI Dictionary Mode):
```env
GEMINI_API_KEY=your_free_tier_gemini_api_key_here
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to launch FolioLingo, or open `docs/showcase/index.html` directly to view the interactive visual press kit.

### Self-Hosting & Security Note
- `server.ts` is intended for **local or personal use** (enforcing a `100kb` JSON request body cap and per-IP rate limits on `/api/gemini/*` and `/api/gutenberg/*`).
- If deploying to a public multi-user server, leave `GEMINI_API_KEY` unset on the server so readers run in **Zero-AI Dictionary Mode** or supply their own browser-local **BYOK** key, or place authentication/reverse-proxy protection in front of your API routes.

---

## 👤 Author & Product Owner

**Mustafa Gültekin**  
- GitHub: [@mgultekin](https://github.com/mgultekin)
- Repository: [https://github.com/mgultekin/multi-reads](https://github.com/mgultekin/multi-reads)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
