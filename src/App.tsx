import React, { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { Navbar } from './components/Navbar.tsx';
import { LibraryView } from './components/LibraryView.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { WordbookView } from './components/WordbookView.tsx';
import { SocialLeagueView } from './components/SocialLeagueView.tsx';
import { ImportModal } from './components/ImportModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ContentItem, LanguageCode, UserProfile } from './types/index.ts';
import { storageService } from './services/storageService.ts';
import { socialService } from './services/socialService.ts';
import { auth, googleProvider, isFirebaseConfigured } from './lib/firebase.ts';
import { firebaseSyncService } from './services/firebaseSync.ts';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [activeTab, setActiveTab] = useState<'library' | 'reader' | 'wordbook' | 'social'>('library');
  const [targetLang, setTargetLang] = useState<LanguageCode>(profile.targetLanguage || 'es');
  const [currentBook, setCurrentBook] = useState<ContentItem | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(profile.theme || 'light');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const syncedProfile = await firebaseSyncService.syncUserOnLogin(user);
          setProfile(syncedProfile);
        } catch (err) {
          console.warn('Firebase user sync error', err);
        }
      } else {
        firebaseSyncService.stopListeners();
      }
    });

    return () => {
      unsubscribe();
      firebaseSyncService.stopListeners();
    };
  }, []);

  // Load initial book for target language (preferring most recently read)
  useEffect(() => {
    loadDefaultBookForLang(targetLang);
  }, [targetLang]);

  const loadDefaultBookForLang = async (lang: LanguageCode) => {
    const allBooks = await storageService.getBooks();
    const langBooks = allBooks.filter((b) => b.language === lang);
    if (langBooks.length > 0) {
      const sorted = [...langBooks].sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
      setCurrentBook(sorted[0]);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const updated: UserProfile = { ...profile, theme: nextTheme };
    setProfile(updated);
    storageService.saveUserProfile(updated);
  };

  const handleTargetLangChange = (lang: LanguageCode) => {
    setTargetLang(lang);
    const updated: UserProfile = { ...profile, targetLanguage: lang };
    setProfile(updated);
    storageService.saveUserProfile(updated);
  };

  const handleNativeLangChange = (lang: string) => {
    const updated: UserProfile = { ...profile, nativeLanguage: lang };
    setProfile(updated);
    storageService.saveUserProfile(updated);
  };

  const handleSelectBook = (book: ContentItem) => {
    setCurrentBook(book);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordWords = async (
    wordsCount: number,
    bookMeta?: { bookId?: string; bookTitle?: string; language?: LanguageCode }
  ) => {
    const updated = await socialService.recordReadingProgress(wordsCount, bookMeta);
    setProfile(updated);

    if (currentUser) {
      firebaseSyncService.syncReadingProgress(currentUser.uid, updated);
    }
  };

  const handleAwardXP = async (xpAmount: number) => {
    const updated = await socialService.awardXP(xpAmount);
    setProfile(updated);

    if (currentUser) {
      firebaseSyncService.syncReadingProgress(currentUser.uid, updated);
    }
  };

  const handleImportComplete = (newBook: ContentItem) => {
    setCurrentBook(newBook);
    setTargetLang(newBook.language);
    setActiveTab('reader');
  };

  const handleSignInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In failed', err);
    }
  };

  const handleSignOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#141312] text-[#1C1917] dark:text-[#F5F2EB] flex flex-col font-sans transition-colors selection:bg-amber-200 selection:text-amber-900">
      {/* 3-Zone Top Navigation Bar with Dual Language Selectors & Firebase Auth */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        targetLang={targetLang}
        setTargetLang={handleTargetLangChange}
        nativeLang={profile.nativeLanguage}
        setNativeLang={handleNativeLangChange}
        streakDays={profile.streakDays}
        xp={profile.xp}
        theme={theme}
        toggleTheme={handleToggleTheme}
        openSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        isFirebaseConfigured={isFirebaseConfigured}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
      />

      {/* Primary Dynamic View Content */}
      <div className="flex-1">
        {activeTab === 'library' && (
          <LibraryView
            targetLang={targetLang}
            onSelectBook={handleSelectBook}
            onOpenImporter={() => setIsImporterOpen(true)}
          />
        )}

        {activeTab === 'reader' && (
          <ReaderView
            currentBook={currentBook}
            targetLang={targetLang}
            onSelectBook={handleSelectBook}
            onOpenLibrary={() => setActiveTab('library')}
            onRecordWords={handleRecordWords}
            onAwardXP={handleAwardXP}
            nativeLang={profile.nativeLanguage}
            onChangeNativeLang={handleNativeLangChange}
            readerFontSize={profile.readerFontSize}
            onChangeFontSize={(size) => {
              const updated: UserProfile = { ...profile, readerFontSize: size };
              setProfile(updated);
              storageService.saveUserProfile(updated);
            }}
          />
        )}

        {activeTab === 'wordbook' && (
          <WordbookView
            targetLang={targetLang}
            onAwardXP={handleAwardXP}
            onOpenReader={() => setActiveTab('reader')}
          />
        )}

        {activeTab === 'social' && (
          <SocialLeagueView
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenReader={() => setActiveTab('reader')}
          />
        )}
      </div>

      {/* Custom Content Importer Modal */}
      <ImportModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        targetLang={targetLang}
        onImportComplete={handleImportComplete}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => setProfile(updated)}
      />
    </div>
  );
}
