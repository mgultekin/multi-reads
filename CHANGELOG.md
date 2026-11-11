# Changelog & Release History

All notable architectural milestones, performance engineering updates, and Product Owner audits for **FolioLingo** are documented in this file and archived in [`docs/artifacts/`](docs/artifacts/).

---

## [`v0.5.0`] — Product Owner Audit, End-to-End Use-Case Catalog & Full-Text Gutenberg Proxy
📄 **Artifact**: [`docs/artifacts/v0.5.0_product_owner_use_cases.md`](docs/artifacts/v0.5.0_product_owner_use_cases.md)

### Added
- **Server-Side Project Gutenberg Full-Text Proxy (`GET /api/gutenberg/:id`)**: Fetches complete UTF-8 public-domain manuscripts from Gutenberg mirrors, strips header/footer boilerplate, and automatically hydrates search cards into multi-section readings without browser CORS blocks (`UC-02`).
- **"Continue Reading" Library Shelf**: Automatically tracks `currentChunkIndex` and `lastReadAt` per book and displays a prominent resume banner at the top of `LibraryView` (`UC-03`).
- **Bilingual Parallel Reading Mode & Typeface Scale**: Added a `Parallel` toggle in `ReaderView` to display aligned native-language paragraph translations beneath the original prose, alongside a persistent `Aa·SM` / `Aa·MD` / `Aa·LG` font size switcher (`UC-05`).
- **SRS Queue Filters & CSV/Anki Export**: Added `All Cards | Due for Review | Mastered` filter tabs and one-click CSV and Anki TSV deck exports in `WordbookView` (`UC-08`, `UC-10`).
- **Offline Heuristic Dictionary & IndexedDB Lemmatizer**: Added an IndexedDB `offline_dictionary` object store seeded with `INSTANT_LEXICON` that automatically indexes newly encountered word breakdowns and performs rule-based offline morphological lemmatization (`analyzeOfflineMorphology`) across Spanish, French, German, Italian, Turkish, and English.
- **Personal Analytics & Firestore Reading Log**: Replaced the redundant Supabase tab in `SocialLeagueView` with an **Analytics & Log** view synced with Firestore `/users/{uid}/reading_logs` (`UC-11`).
- **Formal Use-Case Catalog (`UC-01` – `UC-12`)**: Added comprehensive Product Owner requirements and acceptance criteria in `docs/artifacts/v0.5.0_product_owner_use_cases.md`.

### Fixed
- **Decoupled Reading Volume vs. Bonus XP**: Separated `recordWordsRead(words, bookMeta)` from `awardXP(xpAmount)` so quiz (`+25 XP`) and flashcard (`+10`/`+15 XP`) rewards no longer inflate `wordsReadToday` (`UC-07`, `UC-11`).
- **Unicode-Safe Cloze Recall**: Replaced ASCII `\b` regexes with Unicode property escapes (`(?<![\p{L}])...(?![\p{L}])` with `giu` flags) and diacritic-tolerant matching so words with non-ASCII characters (`ñ`, `é`, `ü`, `ş`, `ğ`, `ç`) blank out and verify accurately (`UC-09`).
- **Live SRS Mastery Sync**: Scoring flashcards now updates React state immediately without requiring a tab switch (`UC-08`).
- **Settings & Iframe Safety**: Synced all 14 `BASE_LANGUAGES` in `SettingsModal`, removed client-side API key inputs, and replaced `window.confirm` / `window.alert` with inline two-step confirmation (`UC-12`).

---

## [`v0.4.0`] — Hybrid Zero-Latency Translation & Prefetch Engine
📄 **Artifact**: [`docs/artifacts/v0.4.0_translation_speed_engine.md`](docs/artifacts/v0.4.0_translation_speed_engine.md)

### Added
- **Proactive Section Batch Pre-Caching (`POST /api/gemini/batch-prefetch`)**: Translates sentences and high-value vocabulary in the background as soon as a section opens so subsequent clicks resolve in `0ms`.
- **80ms Hover Intent Prefetching**: Warms the word breakdown cache while the user's cursor hovers over a token prior to click completion.
- **Ultra-Fast `gemini-3.1-flash-lite-preview` (`ThinkingLevel.MINIMAL`)**: Upgraded live word breakdown and batch endpoints for sub-250ms first-byte responses.
- **Multi-Provider Server-Side Backup Translator**: Added automatic fallback translation on the server so word and sentence lookups never fail or return untranslated echoes during rate limits.
- **Persistent L1/L2 Translation Cache**: Added localStorage-backed word and sentence caches with request deduplication.

---

## [`v0.3.1`] — Portfolio Documentation, System Diagrams & Artifacts Archive
📄 **Artifact**: [`docs/artifacts/v0.3.1_github_portfolio_plan.md`](docs/artifacts/v0.3.1_github_portfolio_plan.md)

### Added
- Comprehensive portfolio `README.md` with ASCII system architecture diagrams, tech stack badges, and setup instructions.
- Structured `docs/artifacts/` directory containing architectural decision records (`architecture_decisions.md`) and versioned engineering plans.
- Multi-stage semantic Git commit history and annotated version tags (`v0.1.0` through `v0.5.0`).

---

## [`v0.3.0`] — Two-Tier Low-Latency Philology Engine & Section Comprehension Quizzes
📄 **Artifact**: [`docs/artifacts/v0.3.0_performance_and_quizzes.md`](docs/artifacts/v0.3.0_performance_and_quizzes.md)

### Added
- Two-tier progressive word breakdown popover (`WordBreakdownPopover.tsx`) with instant translation/lemma and expandable deep grammar drawer.
- 3-question interactive end-of-section comprehension quizzes (`SectionQuizModal.tsx`).
- Global native language selector in `Navbar.tsx` and `WordBreakdownPopover.tsx`.

---

## [`v0.2.0`] — Firebase Firestore Cloud Sync, Wordbook SRS & Scholar League
### Added
- Real-time Firebase Authentication & Firestore cloud synchronization (`firebaseSync.ts`, `firestore.rules`, `firebase-blueprint.json`).
- Spaced-repetition vocabulary deck (`WordbookView.tsx`) with 3D flip cards and Cloze challenges.
- Weekly Scholar League leaderboard and streak habit engine (`SocialLeagueView.tsx`).

---

## [`v0.1.0`] — Core Reader Canvas, Public Domain Library & Instant Lexicon
### Added
- Tokenized literary reading canvas (`ReaderView.tsx`) with CEFR level adaptation (`A2`, `B1`, `B2`, `C1`) and Web Speech API read-aloud.
- Multi-language Public Domain Library (`LibraryView.tsx`) with curated classics, Gutendex search, Wikipedia portals, and custom text importer (`ImportModal.tsx`).
- Instant client-side lexicon (`instantLexicon.ts`) for high-frequency vocabulary.
