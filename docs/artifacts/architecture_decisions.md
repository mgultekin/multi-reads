# Architecture Decision Records (ADRs) - FolioLingo

This document captures the principal architectural decisions made in the development of FolioLingo.

---

### ADR-001: Hybrid Local-First & Firestore Cloud Sync
- **Status**: Accepted
- **Context**: Language learners frequently read during commutes or on poor connections. An app that fails to load text or save words without continuous connectivity leads to high churn.
- **Decision**: Store library state, settings, and personal wordbook in browser `localStorage` first, and asynchronously reconcile with Firebase Firestore whenever an active session / network connection is detected (`src/services/firebaseSync.ts`).
- **Consequences**: Zero latency on reader interactions; automatic cloud backup and cross-device sync when connected; graceful degradation offline.

---

### ADR-002: Two-Tier Latency Split for Philological Analysis
- **Status**: Accepted
- **Context**: Full linguistic morphology (tense, mood, person, case, etymological root, cultural context) requires detailed inference that takes 1.5s–3.0s, interrupting reading cadence.
- **Decision**: Separate the lookup into two stages:
  1. **Tier 1 (Instant)**: Sub-300ms return of contextual translation and dictionary lemma using `ThinkingLevel.LOW`.
  2. **Tier 2 (Progressive)**: Collapsible "Deep Philology" drawer loaded on demand or cached for deep inspection.
- **Consequences**: Immediate visual feedback for the user; preserved reading immersion; philological depth available without performance cost.

---

### ADR-003: On-the-Fly Multilingual Projection
- **Status**: Accepted
- **Context**: Traditional language apps hard-code target-to-English pairs. Global learners whose native language is Turkish, French, German, or Japanese had no natural way to read authentic literature with native translations.
- **Decision**: Decouple the reading text from the translation engine. Expose a 12-language selector in both the main navigation bar and within the active popover so learners can project any target language into their mother tongue at any moment.
- **Consequences**: Expands the user base globally without needing separate book editions for every language pair.

---

### ADR-004: Interactive Section Comprehension Checks
- **Status**: Accepted
- **Context**: Extensive reading without comprehension validation allows readers to skim without building active recall.
- **Decision**: Generate bite-sized 3-question comprehension tests at the end of each reading section, testing event chronology, cloze vocabulary in context, and idiomatic phrases, rewarded with +25 XP.
- **Consequences**: Increases vocabulary retention, gamifies daily habit streaks, and provides immediate feedback.
