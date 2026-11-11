import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { Flashcard, ReadingLogEntry, UserProfile } from '../types/index.ts';
import { storageService } from './storageService.ts';
import { costTelemetry } from './costTelemetry.ts';

const SYNCED_CLOUD_IDS_KEY = 'foliolingo_synced_cloud_ids_v1';

class FirebaseSyncService {
  private unsubscribeWordbook: (() => void) | null = null;
  private unsubscribeReadingLogs: (() => void) | null = null;
  private unsubscribeProfile: (() => void) | null = null;
  private syncedIds = new Set<string>();

  constructor() {
    this.loadSyncedIds();
  }

  private loadSyncedIds() {
    try {
      const raw = localStorage.getItem(SYNCED_CLOUD_IDS_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach((id) => this.syncedIds.add(id));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private markSynced(id: string) {
    this.syncedIds.add(id);
    try {
      const recent = Array.from(this.syncedIds).slice(-2000);
      localStorage.setItem(SYNCED_CLOUD_IDS_KEY, JSON.stringify(recent));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Batch-sync only unsynced local flashcards and reading logs on login
   * (eliminates the 121x login write-amplification loop and stays strictly within $0 Free Tier)
   */
  private async syncUnsyncedLocalData(userId: string) {
    const firestore = db;
    if (!firestore) return;
    try {
      const cards = await storageService.getFlashcards();
      const logs = storageService.getReadingLogs();

      const unsyncedCards = cards.filter((c) => {
        const cleanId = c.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
        return !this.syncedIds.has(`card:${cleanId}`);
      });

      const unsyncedLogs = logs.filter((l) => {
        const cleanId = l.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
        return !this.syncedIds.has(`log:${cleanId}`);
      });

      const totalOps = unsyncedCards.length + unsyncedLogs.length;
      if (totalOps === 0 || !costTelemetry.canPerformFirestoreWrite(totalOps)) {
        return;
      }

      const batch = writeBatch(firestore);
      let batchCount = 0;

      for (const card of unsyncedCards.slice(0, 200)) {
        const cleanId = card.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
        batch.set(doc(firestore, 'users', userId, 'wordbook', cleanId), {
          id: cleanId,
          userId,
          word: String(card.word || 'word').slice(0, 100),
          contextSentence: String(card.contextSentence || '').slice(0, 2000),
          translation: String(card.translation || '').slice(0, 500),
          lemma: String(card.lemma || card.word || '').slice(0, 100),
          partOfSpeech: String(card.partOfSpeech || 'Word').slice(0, 100),
          morphology: String(card.morphology || '').slice(0, 200),
          sentenceTranslation: String(card.sentenceTranslation || '').slice(0, 2000),
          language: String(card.language || 'es').slice(0, 10),
          genre: String(card.genre || 'fiction').slice(0, 50),
          bookTitle: String(card.bookTitle || '').slice(0, 200),
          masteryLevel: Math.max(0, Math.min(5, Number(card.masteryLevel) || 0)),
          createdAt: typeof card.createdAt === 'number' ? card.createdAt : Date.now(),
        });
        this.markSynced(`card:${cleanId}`);
        batchCount += 1;
      }

      for (const log of unsyncedLogs.slice(0, 100)) {
        const cleanId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
        batch.set(doc(firestore, 'users', userId, 'reading_logs', cleanId), {
          id: cleanId,
          userId,
          wordsCount: Math.max(1, Math.min(100000, Math.round(Number(log.wordsCount) || 1))),
          timestamp:
            typeof log.timestamp === 'string' && log.timestamp
              ? log.timestamp.slice(0, 100)
              : new Date().toISOString(),
          ...(log.bookId ? { bookId: String(log.bookId).slice(0, 128) } : {}),
          ...(log.bookTitle ? { bookTitle: String(log.bookTitle).slice(0, 200) } : {}),
          ...(log.language ? { language: String(log.language).slice(0, 10) } : {}),
        });
        this.markSynced(`log:${cleanId}`);
        batchCount += 1;
      }

      if (batchCount > 0) {
        await batch.commit();
        costTelemetry.recordFirestoreWrite(batchCount);
      }
    } catch {
      // Non-blocking background sync
    }
  }

  /**
   * Sync profile with Firestore upon user login
   */
  async syncUserOnLogin(user: User): Promise<UserProfile> {
    const localProfile = storageService.getUserProfile();
    const firestore = db;
    if (!firestore) return localProfile;
    const userDocRef = doc(firestore, 'users', user.uid);
    const path = `users/${user.uid}`;

    try {
      const snap = await getDoc(userDocRef);
      costTelemetry.recordFirestoreRead(1);

      if (snap.exists()) {
        const cloudData = snap.data() as Partial<UserProfile>;
        const merged: UserProfile = {
          ...localProfile,
          id: user.uid,
          name: user.displayName || localProfile.name,
          avatar: user.photoURL || localProfile.avatar,
          totalWordsRead: Math.max(localProfile.totalWordsRead, cloudData.totalWordsRead || 0),
          streakDays: Math.max(localProfile.streakDays, cloudData.streakDays || 1),
          xp: Math.max(localProfile.xp, cloudData.xp || 0),
          leagueTier: cloudData.leagueTier || localProfile.leagueTier,
          targetLanguage: (cloudData.targetLanguage as any) || localProfile.targetLanguage,
          nativeLanguage: cloudData.nativeLanguage || localProfile.nativeLanguage,
        };

        storageService.saveUserProfile(merged);
        if (costTelemetry.canPerformFirestoreWrite(1)) {
          await setDoc(userDocRef, {
            id: user.uid,
            name: String(merged.name || 'Scholar').slice(0, 100),
            email: String(user.email || '').slice(0, 200),
            avatar: String(merged.avatar || '').slice(0, 500),
            streakDays: Math.max(0, Number(merged.streakDays) || 0),
            totalWordsRead: Math.max(0, Number(merged.totalWordsRead) || 0),
            xp: Math.max(0, Number(merged.xp) || 0),
            leagueTier: merged.leagueTier || 'Bronze',
            targetLanguage: String(merged.targetLanguage || 'es').slice(0, 10),
            nativeLanguage: String(merged.nativeLanguage || 'English').slice(0, 50),
            updatedAt: new Date().toISOString(),
          });
          costTelemetry.recordFirestoreWrite(1);
        }

        this.startListeners(user.uid);
        this.syncUnsyncedLocalData(user.uid);

        return merged;
      } else {
        const initialProfile: UserProfile = {
          ...localProfile,
          id: user.uid,
          name: user.displayName || localProfile.name,
          avatar: user.photoURL || localProfile.avatar,
        };

        if (costTelemetry.canPerformFirestoreWrite(1)) {
          await setDoc(userDocRef, {
            id: user.uid,
            name: String(initialProfile.name || 'Scholar').slice(0, 100),
            email: String(user.email || '').slice(0, 200),
            avatar: String(initialProfile.avatar || '').slice(0, 500),
            streakDays: Math.max(0, Number(initialProfile.streakDays) || 0),
            totalWordsRead: Math.max(0, Number(initialProfile.totalWordsRead) || 0),
            xp: Math.max(0, Number(initialProfile.xp) || 0),
            leagueTier: initialProfile.leagueTier || 'Bronze',
            targetLanguage: String(initialProfile.targetLanguage || 'es').slice(0, 10),
            nativeLanguage: String(initialProfile.nativeLanguage || 'English').slice(0, 50),
            updatedAt: new Date().toISOString(),
          });
          costTelemetry.recordFirestoreWrite(1);
        }

        storageService.saveUserProfile(initialProfile);
        this.startListeners(user.uid);
        this.syncUnsyncedLocalData(user.uid);

        return initialProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Save flashcard to Firestore subcollection /users/{uid}/wordbook
   */
  async saveCloudFlashcard(userId: string, card: Flashcard): Promise<void> {
    const firestore = db;
    if (!firestore || !costTelemetry.canPerformFirestoreWrite(1)) return;
    const cleanId = card.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const path = `users/${userId}/wordbook/${cleanId}`;

    try {
      await setDoc(doc(firestore, 'users', userId, 'wordbook', cleanId), {
        id: cleanId,
        userId,
        word: String(card.word || 'word').slice(0, 100),
        contextSentence: String(card.contextSentence || '').slice(0, 2000),
        translation: String(card.translation || '').slice(0, 500),
        lemma: String(card.lemma || card.word || '').slice(0, 100),
        partOfSpeech: String(card.partOfSpeech || 'Word').slice(0, 100),
        morphology: String(card.morphology || '').slice(0, 200),
        sentenceTranslation: String(card.sentenceTranslation || '').slice(0, 2000),
        language: String(card.language || 'es').slice(0, 10),
        genre: String(card.genre || 'fiction').slice(0, 50),
        bookTitle: String(card.bookTitle || '').slice(0, 200),
        masteryLevel: Math.max(0, Math.min(5, Number(card.masteryLevel) || 0)),
        createdAt: typeof card.createdAt === 'number' ? card.createdAt : Date.now(),
      });
      this.markSynced(`card:${cleanId}`);
      costTelemetry.recordFirestoreWrite(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Delete flashcard from Firestore
   */
  async deleteCloudFlashcard(userId: string, cardId: string): Promise<void> {
    const firestore = db;
    if (!firestore) return;
    const cleanId = cardId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const path = `users/${userId}/wordbook/${cleanId}`;

    try {
      await deleteDoc(doc(firestore, 'users', userId, 'wordbook', cleanId));
      costTelemetry.recordFirestoreDelete(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  /**
   * Save reading session log to Firestore subcollection /users/{uid}/reading_logs
   */
  async saveCloudReadingLog(userId: string, log: ReadingLogEntry): Promise<void> {
    const firestore = db;
    if (!firestore || !costTelemetry.canPerformFirestoreWrite(1)) return;
    const cleanId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const path = `users/${userId}/reading_logs/${cleanId}`;

    try {
      await setDoc(doc(firestore, 'users', userId, 'reading_logs', cleanId), {
        id: cleanId,
        userId,
        wordsCount: Math.max(1, Math.min(100000, Math.round(Number(log.wordsCount) || 1))),
        timestamp: typeof log.timestamp === 'string' && log.timestamp
          ? log.timestamp.slice(0, 100)
          : new Date().toISOString(),
        ...(log.bookId ? { bookId: String(log.bookId).slice(0, 128) } : {}),
        ...(log.bookTitle ? { bookTitle: String(log.bookTitle).slice(0, 200) } : {}),
        ...(log.language ? { language: String(log.language).slice(0, 10) } : {}),
      });
      this.markSynced(`log:${cleanId}`);
      costTelemetry.recordFirestoreWrite(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Sync reading progress to Firestore
   */
  async syncReadingProgress(userId: string, profile: UserProfile): Promise<void> {
    const firestore = db;
    if (!firestore || !costTelemetry.canPerformFirestoreWrite(1)) return;
    const path = `users/${userId}`;
    try {
      await setDoc(
        doc(firestore, 'users', userId),
        {
          id: userId,
          name: String(profile.name || 'Scholar').slice(0, 100),
          totalWordsRead: Math.max(0, Number(profile.totalWordsRead) || 0),
          streakDays: Math.max(0, Number(profile.streakDays) || 0),
          xp: Math.max(0, Number(profile.xp) || 0),
          leagueTier: profile.leagueTier || 'Bronze',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      costTelemetry.recordFirestoreWrite(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  /**
   * Listen for real-time cloud updates
   */
  private startListeners(userId: string) {
    const firestore = db;
    if (!firestore) return;
    this.stopListeners();

    storageService.setCloudSyncHandler({
      onSave: (card) => {
        this.saveCloudFlashcard(userId, card).catch((e) => console.warn('Failed cloud card save', e));
      },
      onDelete: (id) => {
        this.deleteCloudFlashcard(userId, id).catch((e) => console.warn('Failed cloud card delete', e));
      },
      onSaveReadingLog: (log) => {
        this.saveCloudReadingLog(userId, log).catch((e) => console.warn('Failed cloud reading log save', e));
      },
    });

    // Wordbook real-time listener
    const wordbookPath = `users/${userId}/wordbook`;
    this.unsubscribeWordbook = onSnapshot(
      collection(firestore, 'users', userId, 'wordbook'),
      (snapshot) => {
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          costTelemetry.recordFirestoreRead(changes.length);
        }
        changes.forEach((change) => {
          const card = change.doc.data() as Flashcard;
          const cleanId = (card.id || change.doc.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
          this.markSynced(`card:${cleanId}`);
          if (change.type === 'added' || change.type === 'modified') {
            storageService.saveFlashcard(card, true);
          } else if (change.type === 'removed') {
            storageService.deleteFlashcard(card.id, true);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, wordbookPath);
      }
    );

    // Reading logs real-time listener
    const readingLogsPath = `users/${userId}/reading_logs`;
    this.unsubscribeReadingLogs = onSnapshot(
      collection(firestore, 'users', userId, 'reading_logs'),
      (snapshot) => {
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          costTelemetry.recordFirestoreRead(changes.length);
        }
        changes.forEach((change) => {
          const log = change.doc.data() as ReadingLogEntry;
          const cleanId = (log.id || change.doc.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
          this.markSynced(`log:${cleanId}`);
          if (change.type === 'added' || change.type === 'modified') {
            storageService.saveReadingLog(log, true);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, readingLogsPath);
      }
    );
  }

  stopListeners() {
    storageService.setCloudSyncHandler(null);
    if (this.unsubscribeWordbook) {
      this.unsubscribeWordbook();
      this.unsubscribeWordbook = null;
    }
    if (this.unsubscribeReadingLogs) {
      this.unsubscribeReadingLogs();
      this.unsubscribeReadingLogs = null;
    }
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
      this.unsubscribeProfile = null;
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
