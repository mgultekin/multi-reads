# FolioLingo v0.5.0: Product Owner Audit & End-to-End Use-Case Overhaul

A comprehensive product engineering overhaul resolving functional gaps across all four application pillars—Reader Studio, Public Domain Library, Spaced-Repetition Wordbook, and Scholar Hub—backed by a formal Product Owner Use-Case Catalog and tagged as release **`v0.5.0`**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All four audited product pillars and documentation deliverables have been confirmed:
> - **Pillar 1 — Reader Studio & Library Completeness**:
>   * **Real Gutenberg Full-Text Loader**: Books discovered via Project Gutenberg search now automatically fetch, clean, and chunk their authentic full text instead of remaining stuck on a placeholder paragraph.
>   * **Persistent Reading Progress & "Continue Reading" Shelf**: Navigating sections automatically persists `currentChunkIndex` and `lastReadAt`, surfacing an active "Continue Reading" callout in the Library.
>   * **Parallel Bilingual Sentence View & Typography Controls**: Adds a one-click Bilingual Parallel Mode in the Reader ribbon (displaying pre-cached native sentence translations directly beneath each paragraph/sentence) alongside adjustable reader font size.
>   * **Source Filter & Custom Item Management**: Adds the missing `Imported / Custom` filter tab and allows deleting custom or fetched works.
> - **Pillar 2 — Spaced-Repetition Wordbook & Practice Studio**:
>   * **Due-Today SRS Queue Filter**: Filter flashcards by `All Cards`, `Due for Review`, or `Mastered (5/5)`.
>   * **Unicode-Aware Cloze Engine & Skip Controls**: Fixes the JavaScript `\b` regex failure on non-ASCII characters (`ñ`, `é`, `ü`, `ş`, `ğ`, `ç`, `ı`, `ö`, `ß`), supports accent-tolerant matching, updates card mastery state live in memory, and adds a Skip/Next button.
>   * **Vocabulary Export (CSV / Anki TSV)**: One-click export of the user's saved vocabulary deck.
> - **Pillar 3 — Accurate Habit Math, Live Reading Log & Firestore Sync**:
>   * **Decoupled Words-Read vs. XP Ledger**: Separates `recordWordsRead(words, bookMeta)` from `awardXP(xpAmount, reason)` so quiz and flashcard XP bonuses no longer corrupt daily word-count metrics.
>   * **Personal Analytics & Live Reading Log (Replacing Legacy Supabase Tab)**: Replaces the redundant Supabase configuration tab in Scholar Hub with a live **Personal Analytics & Reading Log** backed by local storage and the provisioned Firestore `/users/{uid}/reading_logs` subcollection.
> - **Pillar 4 — Settings & Compliance Polish**:
>   * **Full 14-Language Synchronization**: Syncs all 14 supported base languages across the Navbar, Popover, and Settings modal.
>   * **Zero API-Key UI & Iframe-Safe Confirmations**: Removes legacy API key input fields and replaces blocked `window.confirm` / `window.alert` dialogs with inline confirmation states.
> - **Portfolio Deliverable (`v0.5.0`)**:
>   * Formal **Product Owner Use-Case Catalog & Acceptance Criteria** (`v0.5.0`) committed to the repository artifacts and tagged as **`v0.5.0`**.

---

## 1. Overview & Core Concept

- **What It Does**: Elevates FolioLingo from a feature prototype to a cohesive, production-grade language acquisition platform where every user journey—from discovering a book on Project Gutenberg to reading in bilingual mode, practicing due SRS cards, exporting decks, and auditing personal reading logs—is end-to-end functional.
- **Target Audience / Persona**: Self-directed polyglots, literature enthusiasts, and technical hiring managers evaluating product thinking, edge-case handling, and full-stack state consistency.
- **Key Value**: Eliminates every dead-end flow, mathematical discrepancy, and state desynchronization across the application.

---

## 2. User Experience & Visual Design

### End-to-End User Journey & Use-Case Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│UC-01: Library Discovery & Continue Reading                                        │
│ • Resume active book at exact section (%) OR fetch full Gutenberg/Wiki manuscript │
│ • Filter by All | Curated | Wikipedia | Imported & manage custom texts            │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│UC-02: Immersive & Bilingual Parallel Reader Studio                                │
│ • Toggle Parallel Bilingual View (inline sentence translations in native tongue)  │
│ • Adjust Reader Font Size (Sm / Md / Lg) & auto-save section progress             │
│ • Click/Hover words for 0ms Breakdown OR complete 3-question Section Mastery Quiz │
└───────────────────┬───────────────────────────────────────────┬───────────────────┘
                    │ (+5 XP / Save Card)                       │ (+Words & XP Log)
                    ▼                                           ▼
┌─────────────────────────────────────────┐ ┌───────────────────────────────────────┐
│UC-03: SRS Wordbook & Cloze Studio       │ │UC-04: Scholar Hub & Reading Analytics │
│ • Filter: All | Due Now | Mastered      │ │ • Accurate Daily/Weekly Words vs XP   │
│ • Unicode-safe Cloze & 3D Flip Deck     │ │ • Live Reading Session History Log    │
│ • One-click Export to CSV / Anki        │ │ • Cloud Sync via Firebase Firestore   │
└─────────────────────────────────────────┘ └───────────────────────────────────────┘
```

### Visual Identity & Theme
- **Aesthetic Direction**: Warm Editorial Bookish Minimalism (`Playfair Display` headings, `Source Serif 4` literary prose, `Plus Jakarta Sans` UI controls, `JetBrains Mono` tabular metrics).
- **60-30-10 Color & Contrast Discipline**:
  - *60% Canvas*: Warm paper `#FBF9F5` (light) / Deep charcoal `#141312` (dark).
  - *30% Structural Surfaces*: Crisp card surfaces `#FFFFFF` / `#1C1A18` with hairline borders `#E7E2D7` / `#2C2926`.
  - *10% Semantic Focal Accents*: Amber ink `#B45309` / `#F59E0B` for active states and emerald `#059669` for verified mastery.
- **Interactive Feedback & Motion**:
  - Inline two-step confirmation buttons (`"Clear Cache?" -> "Confirm Clear"`) replacing browser-blocking alerts.
  - Smooth parallel translation reveal below each paragraph when Bilingual Mode is toggled in the Reader.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Decoupling Reading Volume (`wordsRead`) from Gamified Rewards (`xp`)**
  - *Chosen Approach*: Introduce two distinct domain actions—`recordWordsRead(words, bookMeta)` for literary progress and `awardXP(xpAmount, activityLabel)` for quizzes, flashcards, and milestones—while logging structured `ReadingLog` entries.
  - *Why*: Previously, awarding `+25 XP` for a quiz passed `25` into `recordWordsRead`, falsely adding 25 "words read" and miscalculating XP as `25 * 0.1 + 5 = 8 XP`. Separating them guarantees 100% accurate analytics.
- **Decision 2: Replacing the Legacy Supabase Tab with Personal Analytics & Firestore Reading Logs**
  - *Chosen Approach*: Remove the unused Supabase credential form and replace that tab with a live **Personal Analytics & Reading Log** view synced with the existing Firestore `/users/{uid}/reading_logs` subcollection.
  - *Why*: The application already uses Firebase Auth and Firestore for cloud persistence; surfacing real reading session logs, language breakdowns, and daily goal completion delivers genuine learner value.
- **Decision 3: Server-Assisted Gutenberg Full-Text Proxy**
  - *Chosen Approach*: Add a clean server endpoint (`GET /api/gutenberg/:id`) that fetches, strips boilerplate headers/footers, and chunks Project Gutenberg texts reliably without third-party CORS proxy failures.
  - *Why*: Client-side CORS proxies (`allorigins.win`) frequently rate-limit or fail in browser sandboxes. Fetching via the Express backend is fast, reliable, and CORS-free.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### System & State Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              Application State (App)                              │
│  • handleRecordWords(words, book) ──> Updates wordsReadToday, totalWordsRead, XP  │
│  • handleAwardXP(xp, label)       ──> Updates exact XP & League Tier              │
└───────────┬─────────────────────────────┬─────────────────────────────┬───────────┘
            │                             │                             │
            ▼                             ▼                             ▼
┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│   Reader & Library    │     │   Wordbook & Cloze    │     │  Scholar Hub & Sync   │
│ • Auto-persist chunk  │     │ • Unicode RegExp fix  │     │ • Real ReadingLog[]   │
│ • /api/gutenberg/:id  │     │ • Due-Today SRS filter│     │ • Dynamic Activity    │
│ • Parallel Bilingual  │     │ • CSV / Anki exporter │     │ • Firestore Cloud Sync│
└───────────────────────┘     └───────────────────────┘     └───────────────────────┘
```

### Interactive Component & State Mapping
1. **Product Owner Use-Case Catalog Artifact**:
   - Author a comprehensive Product Owner specification in the repository's artifacts archive detailing personas, 12 core use cases (`UC-01` to `UC-12`), preconditions, postconditions, and verification criteria.
2. **Server Gutenberg Full-Text Route**:
   - Add `GET /api/gutenberg/:id` on the Express server to fetch Project Gutenberg UTF-8 plain text directly, strip boilerplate, and return structured paragraphs.
   - Wire automatic full-text loading in the Reader when opening a Gutenberg search result.
3. **Reader Studio Upgrades**:
   - Persist `currentChunkIndex` and `lastReadAt` to storage on every section change.
   - Add a **Bilingual Parallel Mode** toggle in the Reader toolbar that displays pre-cached native sentence translations beneath each paragraph, plus a **Text Size (`A-` / `A+`)** control.
4. **Library View Upgrades**:
   - Add a **"Continue Reading"** banner at the top of the library when a book is in progress.
   - Fix source filter tabs (`All Sources`, `Curated Classics`, `Project Gutenberg`, `Wikipedia Portals`, `Imported`) and allow deleting imported/fetched items.
5. **Wordbook & SRS Studio Upgrades**:
   - Add filter pills (`All Cards`, `Due for Review`, `Mastered`).
   - Fix Unicode word boundary matching in Cloze mode using Unicode property escapes (`new RegExp(..., 'giu')`) and accent-insensitive normalization.
   - Synchronize `cards` state immediately upon rating a card and add a **Download CSV** button.
6. **Habit Engine, Scholar Hub & Settings**:
   - Separate `recordWordsRead` and `awardXP`, log real `ReadingLog` entries locally and to Firestore `/users/{uid}/reading_logs`, and render the **Analytics & Reading Log** tab in Scholar Hub.
   - Update Settings to include all 14 `BASE_LANGUAGES`, remove the API key input field, and use inline state confirmations instead of `window.confirm`/`alert`.
   - Commit and tag **`v0.5.0`**.
