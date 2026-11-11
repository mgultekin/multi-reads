# FolioLingo `v0.5.0` — Product Owner Use-Case Catalog & Acceptance Criteria

## 1. Executive Summary & Product Vision
**FolioLingo** is an open-source, zero-cost language acquisition platform designed around authentic literary immersion, instant context-aware philological breakdowns, spaced-repetition active recall, and minimalist scholarly habit tracking.

Version **`v0.5.0`** completes the end-to-end Product Owner audit across all four functional pillars:
1. **Public Domain Library & Content Ingestion**
2. **Immersive & Bilingual Parallel Reader Studio**
3. **Spaced-Repetition Wordbook & Unicode Cloze Studio**
4. **Habit Engine, Scholar League & Cloud Firestore Sync**

---

## 2. Target Personas

| Persona | Profile | Primary Goals |
| :--- | :--- | :--- |
| **The Autonomous Polyglot** | Reads across multiple target languages (`ES`, `FR`, `DE`, `IT`, `TR`, `EN`) paired with any of 14 native base languages. | Zero-latency word lookups in authentic context, parallel bilingual verification, and portable Anki/CSV vocabulary decks. |
| **The Literary Learner** | Transitioning from graded learners' texts (`A1`–`B1`) to original public-domain philosophy, history, and fiction (`B2`–`Original`). | Dynamic CEFR level adaptation on any classical text or imported `.epub` without losing narrative flow. |
| **The Consistent Scholar** | Motivated by daily reading volume goals, streaks, and non-childish peer accountability. | Accurate tracking of words read vs. XP earned, chronological reading session logs, and cross-device cloud backup. |

---

## 3. Core Use-Case Catalog (`UC-01` – `UC-12`)

### Pillar 1 — Library Discovery & Content Ingestion

#### `UC-01`: Genre-Filtered Library & Source Navigation
- **Actor**: Learner
- **Preconditions**: Application is loaded with a selected target language (`es`, `fr`, `de`, `it`, `tr`, `en`).
- **Flow**:
  1. Learner selects a literary genre pill (*Philosophy, Fiction, History, Essays, Short Stories, Science & Nature*) and/or source tab (*All Sources, Curated Classics, Gutenberg, Wikipedia, Imported*).
  2. Library dynamically updates work counts per genre and displays matching works.
- **Acceptance Criteria**:
  - Genre badges display exact item counts for the active target language.
  - Selecting *Curated Classics* vs. *Gutenberg* vs. *Wikipedia* vs. *Imported* accurately isolates works by origin.

#### `UC-02`: Resume Active Reading ("Continue Reading" Shelf)
- **Actor**: Returning Learner
- **Preconditions**: Learner has previously opened a book or advanced to Section $N > 1$ in the active target language.
- **Flow**:
  1. Library surfaces a top **Continue Reading** callout displaying the book title, author, and current section (`Section X of Y`).
  2. Clicking **Resume Section X** opens the Reader Studio directly at the saved chunk index.
- **Acceptance Criteria**:
  - `currentChunkIndex` and `lastReadAt` persist in `IndexedDB` / `localStorage` across page reloads.

#### `UC-03`: Live Project Gutenberg Full-Text Hydration
- **Actor**: Learner
- **Preconditions**: Learner searches Project Gutenberg via the Library search bar or clicks *Fetch More [Genre] from Gutenberg*.
- **Flow**:
  1. Gutendex metadata results are saved to the library.
  2. When opened in the Reader Studio, the app automatically queries `GET /api/gutenberg/:id`, strips Project Gutenberg boilerplate headers/footers, and chunks the authentic manuscript into ~550-word sections.
- **Acceptance Criteria**:
  - No CORS failures occur; the Express proxy fetches and cleans UTF-8 plain text with automatic graceful fallback.

#### `UC-04`: Custom EPUB, Markdown, Plain-Text & Wikipedia Importer
- **Actor**: Learner
- **Preconditions**: Learner opens the **Import EPUB / Book** modal.
- **Flow**:
  1. Learner drops an `.epub`, `.md`, `.html`, or `.txt` file, pastes text, or fetches a Wikipedia topic extract.
  2. EPUB parser extracts OPF metadata (`Title`, `Author`, `Language`) and Spine chapters, saving the work under the `Imported` source category.
- **Acceptance Criteria**:
  - Imported and dynamically fetched items can be read, adapted by CEFR level, and deleted from the Library via the card trash action.

---

### Pillar 2 — Reader Studio & Linguistic Engine

#### `UC-05`: Zero-Latency Context-Aware Word Breakdown
- **Actor**: Learner in Reader Studio
- **Preconditions**: A reading section is displayed.
- **Flow**:
  1. Learner hovers over or clicks any word in the passage.
  2. Hover prefetcher (`55ms` intent) and L1/Local Lexicon resolve the contextual translation in `<5ms`.
  3. Floating popover displays the word, pronunciation audio trigger, root lemma, contextual meaning in the user's native language, expandable morphological breakdown, and full sentence translation.
- **Acceptance Criteria**:
  - Switching the native language selector in either the Navbar or inside the Popover immediately re-translates the active word and sentence across all 14 supported base languages.

#### `UC-06`: Parallel Bilingual Sentence View & Typography Controls
- **Actor**: Learner in Reader Studio
- **Preconditions**: Learner is reading a chapter section.
- **Flow**:
  1. Learner clicks the **Parallel** toggle in the sticky Reader utility ribbon.
  2. Pre-cached native translations appear beneath each paragraph in an editorial blockquote style.
  3. Learner cycles font scale (`Aa·SM`, `Aa·MD`, `Aa·LG`) or updates it in Settings.
- **Acceptance Criteria**:
  - Parallel translations update automatically when the section or native base language changes.
  - Font size preference persists in `UserProfile.readerFontSize` and synchronizes between the Reader ribbon and Settings modal.

#### `UC-07`: Dynamic CEFR Level Adaptation (`Original` | `A1`–`C1`)
- **Actor**: Learner in Reader Studio
- **Preconditions**: A reading section is open.
- **Flow**:
  1. Learner selects a target CEFR level (`A1`, `A2`, `B1`, `B2`, `C1`).
  2. If cached in `IndexedDB` (`cefr_cache`), the adapted text renders in `0ms`; otherwise `/api/gemini/adapt-cefr` rewrites the passage to match the target grammar and lexical complexity and caches the result locally.
- **Acceptance Criteria**:
  - Switching back and forth between visited CEFR levels incurs zero network requests.

#### `UC-08`: Interactive End-of-Section Mastery Quiz
- **Actor**: Learner completing a reading section
- **Preconditions**: Learner clicks **Start Section Test** at the bottom of a passage.
- **Flow**:
  1. Modal generates a 3-question test (*Comprehension*, *Vocabulary*, *Nuance*) in the user's native language referencing the passage.
  2. Learner submits answers, reviews linguistic explanations, and earns `+15` to `+45 XP` upon completion.
- **Acceptance Criteria**:
  - Quiz XP is awarded via `awardXP()` without artificially inflating `wordsReadToday`.

---

### Pillar 3 — Spaced-Repetition Wordbook & Practice Studio

#### `UC-09`: SRS Queue Filtering & Live Mastery Progression
- **Actor**: Learner in Wordbook & Practice view
- **Preconditions**: Learner has saved vocabulary cards from the Reader Studio.
- **Flow**:
  1. Learner filters deck by `All Cards`, `Due for Review`, or `Mastered`.
  2. Learner practices via the **3D Flip Deck** and rates cards as *Needs Practice (+0 XP)* or *Mastered (+10 XP)*.
- **Acceptance Criteria**:
  - Rating a card immediately updates `masteryLevel` (`0`–`5`) and `nextReviewAt` in both React state, `IndexedDB`, and Cloud Firestore.

#### `UC-10`: Unicode-Aware Contextual Cloze Challenge & Deck Export
- **Actor**: Learner in Fill-in-the-Blank mode
- **Preconditions**: Learner switches to **Fill-in-the-Blank** tab or clicks **Export CSV / Anki TSV**.
- **Flow**:
  1. Cloze engine replaces the target word inside its authentic literary sentence using Unicode property escapes (`(?<![\p{L}])...(?![\p{L}])` with `giu` flags).
  2. Learner types the missing word (accent-tolerant matching), uses **Letter Hint**, or clicks **Skip**.
  3. Learner exports their deck via **Export CSV** or **Anki TSV**.
- **Acceptance Criteria**:
  - Words containing non-ASCII characters (`ñ`, `é`, `ü`, `ş`, `ğ`, `ç`, `ı`, `ö`, `ß`) are blanked and matched accurately.
  - Export generates valid UTF-8 `.csv` and Anki `.tsv` downloads.

---

### Pillar 4 — Habit Engine, Scholar Hub & Cloud Sync

#### `UC-11`: Decoupled Habit Ledger & Verified Reading Session Logs
- **Actor**: Learner advancing through chapters
- **Preconditions**: Learner clicks **Next Section** in the Reader Studio.
- **Flow**:
  1. `recordWordsRead(chunkWords, bookMeta)` increments `wordsReadToday`, `wordsReadThisWeek`, and `totalWordsRead` by the exact word count of the completed section, awards proportional reading XP, and appends a `ReadingLogEntry`.
  2. Opening **Scholar Hub → Analytics & Log** displays daily goal progress, SRS deck breakdown, and the chronological **Verified Reading Session Log**.
- **Acceptance Criteria**:
  - `wordsReadToday` reflects only actual literary words read; standalone XP bonuses (`awardXP`) never corrupt word volume metrics.

#### `UC-12`: Google Sign-In & Real-Time Firestore Persistence
- **Actor**: Authenticated Learner
- **Preconditions**: Learner signs in via Google Sign-In in the Navbar.
- **Flow**:
  1. `firebaseSyncService.syncUserOnLogin` merges local and cloud `UserProfile` stats (retaining highest progress) and uploads existing local flashcards and reading logs.
  2. Real-time `onSnapshot` listeners synchronize `/users/{uid}/wordbook` and `/users/{uid}/reading_logs` across devices without echo loops.
- **Acceptance Criteria**:
  - All Firestore writes adhere strictly to `firestore.rules` schema validation and owner-only access controls.
