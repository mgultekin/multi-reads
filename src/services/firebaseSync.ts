import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { Flashcard, ReadingLogEntry, UserProfile } from '../types/index.ts';
import { storageService } from './storageService.ts';

class FirebaseSyncService {
  private unsubscribeWordbook: (() => void) | null = null;
  private unsubscribeReadingLogs: (() => void) | null = null;
  private unsubscribeProfile: (() => void) | null = null;

  constructor() {
    this.testConnection();
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }

  /**
   * Sync profile with Firestore upon user login
   */
  async syncUserOnLogin(user: User): Promise<UserProfile> {
    const localProfile = storageService.getUserProfile();
    const userDocRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;

    try {
      const snap = await getDoc(userDocRef);

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
        await setDoc(userDocRef, {
          id: user.uid,
          name: merged.name,
          email: user.email || '',
          avatar: merged.avatar,
          streakDays: merged.streakDays,
          totalWordsRead: merged.totalWordsRead,
          xp: merged.xp,
          leagueTier: merged.leagueTier,
          targetLanguage: merged.targetLanguage,
          nativeLanguage: merged.nativeLanguage,
          updatedAt: new Date().toISOString(),
        });

        this.startListeners(user.uid);

        // Upload any pre-existing local flashcards & reading logs to the cloud
        storageService.getFlashcards().then((cards) => {
          cards.forEach((c) => this.saveCloudFlashcard(user.uid, c).catch(() => {}));
        }).catch(() => {});

        storageService.getReadingLogs().forEach((log) => {
          this.saveCloudReadingLog(user.uid, log).catch(() => {});
        });

        return merged;
      } else {
        const initialProfile: UserProfile = {
          ...localProfile,
          id: user.uid,
          name: user.displayName || localProfile.name,
          avatar: user.photoURL || localProfile.avatar,
        };

        await setDoc(userDocRef, {
          id: user.uid,
          name: initialProfile.name,
          email: user.email || '',
          avatar: initialProfile.avatar,
          streakDays: initialProfile.streakDays,
          totalWordsRead: initialProfile.totalWordsRead,
          xp: initialProfile.xp,
          leagueTier: initialProfile.leagueTier,
          targetLanguage: initialProfile.targetLanguage,
          nativeLanguage: initialProfile.nativeLanguage,
          updatedAt: new Date().toISOString(),
        });

        storageService.saveUserProfile(initialProfile);
        this.startListeners(user.uid);

        storageService.getFlashcards().then((cards) => {
          cards.forEach((c) => this.saveCloudFlashcard(user.uid, c).catch(() => {}));
        }).catch(() => {});

        storageService.getReadingLogs().forEach((log) => {
          this.saveCloudReadingLog(user.uid, log).catch(() => {});
        });

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
    const cleanId = card.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `users/${userId}/wordbook/${cleanId}`;

    try {
      await setDoc(doc(db, 'users', userId, 'wordbook', cleanId), {
        id: cleanId,
        userId,
        word: card.word,
        contextSentence: card.contextSentence || '',
        translation: card.translation,
        lemma: card.lemma || card.word,
        partOfSpeech: card.partOfSpeech || 'Word',
        morphology: card.morphology || '',
        sentenceTranslation: card.sentenceTranslation || '',
        language: card.language,
        genre: card.genre || 'fiction',
        bookTitle: card.bookTitle || '',
        masteryLevel: card.masteryLevel || 0,
        createdAt: card.createdAt || Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Delete flashcard from Firestore
   */
  async deleteCloudFlashcard(userId: string, cardId: string): Promise<void> {
    const cleanId = cardId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `users/${userId}/wordbook/${cleanId}`;

    try {
      await deleteDoc(doc(db, 'users', userId, 'wordbook', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  /**
   * Save reading session log to Firestore subcollection /users/{uid}/reading_logs
   */
  async saveCloudReadingLog(userId: string, log: ReadingLogEntry): Promise<void> {
    const cleanId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `users/${userId}/reading_logs/${cleanId}`;

    try {
      await setDoc(doc(db, 'users', userId, 'reading_logs', cleanId), {
        id: cleanId,
        userId,
        wordsCount: Math.max(1, Math.min(100000, Math.round(log.wordsCount))),
        timestamp: log.timestamp || new Date().toISOString(),
        ...(log.bookId ? { bookId: log.bookId } : {}),
        ...(log.bookTitle ? { bookTitle: log.bookTitle.slice(0, 200) } : {}),
        ...(log.language ? { language: log.language } : {}),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Sync reading progress to Firestore
   */
  async syncReadingProgress(userId: string, profile: UserProfile): Promise<void> {
    const path = `users/${userId}`;
    try {
      await setDoc(
        doc(db, 'users', userId),
        {
          totalWordsRead: profile.totalWordsRead,
          streakDays: profile.streakDays,
          xp: profile.xp,
          leagueTier: profile.leagueTier,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  /**
   * Listen for real-time cloud updates
   */
  private startListeners(userId: string) {
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
      collection(db, 'users', userId, 'wordbook'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const card = change.doc.data() as Flashcard;
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
      collection(db, 'users', userId, 'reading_logs'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const log = change.doc.data() as ReadingLogEntry;
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
