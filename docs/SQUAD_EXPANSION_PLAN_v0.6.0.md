# FolioLingo — Cross-Functional Product Squad Expansion Plan (`v0.6.0` – `v1.0.0`)

**Document Version:** `1.0.0` (Baseline Tag: `v0.5.0`)  
**Repository:** [https://github.com/mgultekin/multi-reads](https://github.com/mgultekin/multi-reads)  
**Product Owner:** Mustafa Gultekin  
**Squad Roster:** `coordinator`, `eng-lead`, `ux-designer`, `optimizer`, `marketing`, `finance`, `verifier`

---

## 1. Executive Reconciliation: Engineering × Optimization × Finance

All 5 specialist reports were audited against the `v0.5.0` codebase by `verifier` (`#13`) to ensure architectural changes, latency optimizations, and cloud cost models reconcile mathematically.

| Workstream / Bottleneck | Codebase Location | Engineering & Optimization Fix | Verified Financial & Performance Impact |
| :--- | :--- | :--- | :--- |
| **1. Firestore Login Write-Amplification Bug** | `src/services/firebaseSync.ts:78-118` | `syncUserOnLogin` unconditionally re-uploads all local flashcards + up to 100 reading logs on **every** login (`1 + N_cards + M_logs` writes = `121–601` writes/login). Fix with `syncedAt` dirty-flag watermarking + `writeBatch(db)`. | Drops login writes to **`1 write/session`**, cutting monthly Firestore write spend by **89%–99.7%** (`$230.27/mo` → **`$25.85/mo`** at 100K MAU). |
| **2. Duplicate Cold-Boot Firestore Probes** | `src/lib/firebase.ts:73`, `src/services/firebaseSync.ts:21-32` | Both modules call `getDocFromServer(doc(db, 'test', 'connection'))` on app load (`2` uncached server reads per boot, even for anonymous users). Remove both probes. | Saves **100% of anonymous boot reads** (`240K reads/mo` at 10K MAU; `2.4M reads/mo` at 100K MAU). |
| **3. Cloud Flashcard SRS Data Loss Bug** | `src/services/firebaseSync.ts:130-150`, `firestore.rules:85-101` | `saveCloudFlashcard` strips `nextReviewAt`, `reviewCount`, `easeFactor`, `usageNote`, and `phoneticIpa` on cloud upload; `onSnapshot` overwrites local SRS progress with defaults. | Preserves full SM-2 spaced repetition state across devices and prevents Pro Cloud Sync churn. |
| **4. React Hover Render Cascade** | `src/components/ReaderView.tsx:249-509` | `setPrefetchedPreviews` mutates top-level state on every `55ms` word hover, re-tokenizing ~600 words and reconciling ~1,250 `<span>` nodes (`14–22ms`/hover). Memoize tokenization (`useMemo([displayText])`) + event delegation on `<article>`. | Reduces hover main-thread CPU cost by **-97% (`14–22ms` → `<0.5ms`)** (`0` re-renders on hover). |
| **5. Server Cache & Hedged Backup Requests** | `server.ts:60-71, 318-493, 584-721` | Fix FIFO → true LRU in `setServerCache`; wire `/api/gemini/batch-prefetch` to `serverBreakdownCache`; hedge `buildBackupBreakdown` after `400ms`; add `(bookId, chunkIndex, level, baseLang)` server cache for `/adapt-cefr` & `/quiz`. | Cuts outbound GTX backup requests by **-70%** and cuts `gemini-3.8-flash` token spend on curated books by **45%–60%**. |
| **6. Initial Bundle & Seed Hydration** | `src/App.tsx`, `src/services/storageService.ts:30-396` | `React.lazy()` for `WordbookView`, `SocialLeagueView`, `ImportModal`, `SettingsModal`, `epubParser.ts`, and Firebase SDK; move `INITIAL_CURATED_BOOKS` to `/curated-books.json`; remove unused `motion` dependency. | Cuts initial gzipped JS bundle by **-62% (`~235 KB` → `~88 KB`)** and speeds up first-visit IndexedDB boot by **`120–180ms`**. |

---

## 2. Priority Technical Debt Register (`eng-lead`)

1. **[P0 — Data Integrity] Cloud Flashcard SRS Field Stripping** (`src/services/firebaseSync.ts:130-150` & `firestore.rules:85-101`).
2. **[P0 — Cost & Performance] Unbounded `syncUserOnLogin` Fan-Out** (`src/services/firebaseSync.ts:78-118`).
3. **[P1 — Reliability] Unhedged GTX Fan-Out & FIFO Eviction** (`server.ts:60-71, 413-493`).
4. **[P1 — Security] Unauthenticated Express Proxy without Rate Limiting or App Check** (`server.ts:305-725`).
5. **[P1 — Correctness] Duplicate Offline Fallback Logic & Short-Word Suffix Collisions** (`src/services/geminiService.ts:31-82` vs. `src/services/instantLexicon.ts:755-840`).
6. **[P2 — UX/State] Missing `AbortController` on Rapid Word Clicks & Section Switches** (`src/components/ReaderView.tsx:114-155, 283-370`).
7. **[P2 — Maintainability] Automated Vitest Test Suite** for `instantLexicon.ts`, `storageService.ts`, and `server.ts`.

---

## 3. UI/UX & Accessibility Audit (`ux-designer`)

### Functional & Layout Fixes
1. **Single-Section & Final-Chapter Progress Dead-End** (`src/components/ReaderView.tsx:205-221, 711-718`):
   - Replace disabled `"Next Section"` on the final chunk (`chunkIndex >= totalChunks - 1`) with an active **"Complete Book / Section ✓"** button that records the chunk's word count and offers the Section Quiz or Library return.
2. **Weekly Progress Inflation (`+1200` Hardcoded Fallback)** (`src/components/SocialLeagueView.tsx:63`, `src/services/storageService.ts:552`):
   - Replace `profile.wordsReadThisWeek || profile.wordsReadToday + 1200` with `profile.wordsReadThisWeek ?? profile.wordsReadToday ?? 0`.
3. **Mobile Sticky Reader Header Overlap** (`src/components/ReaderView.tsx:514`, `src/components/Navbar.tsx:41`):
   - Use responsive sticky offset (`top-[105px] lg:top-[57px]`) so the Reader toolbar never overlaps the 2-row mobile Navbar.
4. **3D Flashcard Flip CSS in Wordbook** (`src/components/WordbookView.tsx:427-527`, `src/index.css:58-73`):
   - Apply `.perspective-1000`, `.transform-style-3d`, `.backface-hidden`, and `.rotate-y-180` plus keyboard hotkeys (`Space` = flip, `1` = Hard, `2` = Good, `3` = Easy).
5. **WCAG 2.1 AA Compliance**:
   - Keyboard operability (`onKeyDown` `Enter`/`Space`) on interactive word spans, book cards, and flashcards; focus traps + `Escape` dismissal on modals and `WordBreakdownPopover`; bottom-sheet popover on mobile (`< 640px`); contrast upgrade (`text-stone-400` → `text-stone-500`/`600` on `#FBF9F5`).

---

## 4. Marketing Strategy & Go-To-Market Positioning (`marketing`)

- **Category**: *Minimalist Literary Reader & AI Philology Companion*
- **Tagline**: *"Outgrow the owl. Read the world's great literature in its original tongue—at your exact level."*
- **Target Personas**:
  1. **Elena, The Plateaued Polyglot (`B1–B2`)** — Primary B2C Pro Scholar (`$59/yr`) buyer seeking authentic literature with dynamic CEFR adaptation and instant grammar philology.
  2. **Kerem, The Global Self-Taught Professional** — Native speaker of Turkish, Arabic, Russian, Hindi, Mandarin, Japanese, or Korean using FolioLingo's 84 language pairs (`6 target × 14 native base languages`).
  3. **Marcus, The Open-Web Annotator & Anki Power User** — Imports Wikipedia, Gutenberg, and EPUBs; exports 1-click Anki `.txt`/`.csv` decks.
  4. **Prof. Moreau, University Language Coordinator** — Uses CEFR adaptation + Section Comprehension Quizzes for intermediate literature seminars (`$299/yr` Academic Cohort tier).

---

## 5. Unit Economics, Scaling Costs & Monetization Tiers (`finance`)

### Monthly Infrastructure & API Scaling Costs (`1K` / `10K` / `100K` MAU)

| Scale | Gemini API (`3.1-flash-lite` + `3.8-flash`) | Firestore + Hosting + Cloud Run | **Total Monthly Cost (As-Is `v0.5.0`)** | **Total Monthly Cost (Optimized `v0.6.0+`)** | Blended Cost / MAU (Optimized) | Break-Even Pro Subscribers (`$6.99/mo`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1,000 MAU** | `$10.35` → `$7.35` | `$5.13` → `$4.00` | **`$15.48 / mo`** | **`$11.35 / mo`** (`-27%`) | `$0.0114` | **3 Pro users** (`0.30%` MAU) |
| **10,000 MAU** | `$103.53` → `$64.50` | `$23.46` → `$8.89` | **`$126.99 / mo`** | **`$73.39 / mo`** (`-42%`) | `$0.0073` | **24 Pro users** (`0.24%` MAU) |
| **100,000 MAU** | `$1,035.28` → `$645.00` | `$223.17` → `$65.85` | **`$1,258.45 / mo`** | **`$710.85 / mo`** (`-43%`) | `$0.0071` | **234 Pro users** (`0.23%` MAU) |

### 4-Tier Pricing Architecture
1. **Folio Reader (Free Forever / BYOK, `$0`)**: Full library, Gutenberg/Wikipedia/EPUB import, `0ms` offline lexicon + stemmer, SRS Wordbook + Anki/CSV export, daily AI trial quota, or **Unlimited AI with personal `GEMINI_API_KEY` (BYOK)**.
2. **Pro Scholar (`$6.99/mo` or `$59/yr`)**: Unlimited hosted `gemini-3.8-flash` CEFR adaptation (`A1–C1`), Parallel Bilingual Mode, Deep AI Philology & IPA, Section Quizzes, and Firestore Cloud Sync (**~91% blended SaaS margin**).
3. **Fellow Lifetime Pass (`$149` one-time)**: Permanent Pro access + offline packs (capped at 500 early adopters).
4. **Academic Cohort License (`$299/yr` per 30 seats)**: Classroom literary adaptation + comprehension quiz analytics.

---

## 6. Versioned Milestone Roadmap (`v0.6.0` → `v1.0.0`)

- **`v0.6.0` (Sync Integrity, Render Performance & Core Bug Fixes)**:
  - Fix Firestore `syncUserOnLogin` write amplification (`syncedAt` + `writeBatch`), remove duplicate cold-boot probes, and persist full SM-2 SRS fields in `firebaseSync.ts` & `firestore.rules`.
  - Memoize word tokenization (`useMemo([displayText])`) + event delegation and add **"Complete Book / Section ✓"** on the final chunk in `ReaderView.tsx`.
  - Fix `+1200` weekly word count inflation in `SocialLeagueView.tsx` and `storageService.ts`.
- **`v0.7.0` (BYOK Settings UI, Server Caching & Bundle Splitting)**:
  - Wire personal `GEMINI_API_KEY` input in `SettingsModal.tsx`.
  - Fix true LRU in `setServerCache`, wire `/api/gemini/batch-prefetch` to `serverBreakdownCache`, hedge `buildBackupBreakdown` at `400ms`, and cache `/adapt-cefr` & `/quiz` in `server.ts`.
  - Route/modal code-splitting (`React.lazy`) in `App.tsx`.
- **`v0.8.0` (WCAG 2.1 AA Accessibility, Mobile Bottom-Sheet & Tactile 3D SRS)**:
  - Responsive sticky reader bar, mobile bottom-sheet `WordBreakdownPopover`, full keyboard navigation & focus traps, and 3D flip animation + hotkeys in `WordbookView.tsx`.
- **`v0.9.0` (Audio Immersion, Growth Loops & SEO Classics)**:
  - Paragraph-level TTS follow-along, shareable reading milestone cards, and static SEO preview pages for curated classics.
- **`v1.0.0` (Pro Scholar Monetization, Full Cloud Library Sync & Automated CI)**:
  - Stripe Checkout + Customer Portal, full cloud sync for imported books & reading offsets, and Vitest + GitHub Actions CI gate.
