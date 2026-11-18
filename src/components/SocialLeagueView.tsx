import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { Flashcard, ReadingLogEntry, SocialUser, UserProfile } from '../types/index.ts';
import { SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { socialService } from '../services/socialService.ts';
import { storageService } from '../services/storageService.ts';
import { isFirebaseConfigured } from '../lib/firebase.ts';

interface SocialLeagueViewProps {
  onOpenSettings: () => void;
  onOpenReader: () => void;
}

export const SocialLeagueView: React.FC<SocialLeagueViewProps> = ({
  onOpenSettings,
  onOpenReader,
}) => {
  const [leaderboard, setLeaderboard] = useState<SocialUser[]>([]);
  const [profile, setProfile] = useState<UserProfile>(storageService.getUserProfile());
  const [readingLogs, setReadingLogs] = useState<ReadingLogEntry[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'league' | 'feed'>('analytics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    setIsLoading(true);
    try {
      const [data, cards] = await Promise.all([
        socialService.getLeaderboard(),
        storageService.getFlashcards(),
      ]);
      setLeaderboard(data);
      setAllFlashcards(cards);
      setProfile(storageService.getUserProfile());
      setReadingLogs(storageService.getReadingLogs());
    } catch (e) {
      console.warn('Failed to load leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async (userId: string) => {
    const isNow = await socialService.toggleFollow(userId);
    setLeaderboard((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: isNow } : u))
    );
    setProfile(storageService.getUserProfile());
  };

  const weeklyTarget = Math.max(1000, (profile.dailyWordGoal || 500) * 7);
  const currentWeeklyProgress = profile.wordsReadThisWeek || profile.wordsReadToday || 0;
  const weeklyPercent = Math.min(100, Math.round((currentWeeklyProgress / weeklyTarget) * 100));

  const dailyGoal = profile.dailyWordGoal || 500;
  const dailyPercent = Math.min(100, Math.round(((profile.wordsReadToday || 0) / dailyGoal) * 100));

  const masteredCount = allFlashcards.filter((c) => c.masteryLevel >= 5).length;
  const dueCount = allFlashcards.filter((c) => (c.nextReviewAt || 0) <= Date.now() && c.masteryLevel < 5).length;

  const formatRelativeTime = (isoTimestamp: string) => {
    const diffMs = Date.now() - new Date(isoTimestamp).getTime();
    const mins = Math.max(1, Math.round(diffMs / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Top Editorial Header */}
      <div className="mb-8 pb-5 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 block mb-1.5">
            Scholarship & Daily Ritual
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Reading Journal
          </h1>
        </div>

        {/* Quiet Underlined Sub-Tabs (Chronological Reading Log primary, AI Peer League secondary) */}
        <div className="flex items-center gap-6 self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-1.5 transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-amber-800 dark:border-amber-400'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Reading Log
          </button>
          <button
            onClick={() => setActiveTab('league')}
            className={`pb-1.5 transition-colors cursor-pointer ${
              activeTab === 'league'
                ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-amber-800 dark:border-amber-400'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Peer League
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-1.5 transition-colors cursor-pointer ${
              activeTab === 'feed'
                ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-amber-800 dark:border-amber-400'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Clean 3-Stat Typographic Strip (1px vertical hairlines, zero KPI boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-stone-800 border-b border-stone-200 dark:border-stone-800 pb-8 mb-10">
        {/* 1. Words Read */}
        <div className="py-3 sm:py-0 sm:pr-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Words Read
            </span>
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
              title="Adjust Daily Word Goal"
            >
              <Settings className="w-3 h-3" />
              <span>Goal: {dailyGoal}w</span>
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
              {profile.totalWordsRead.toLocaleString()}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              ({profile.wordsReadToday || 0} today · {dailyPercent}%)
            </span>
          </div>
          <div className="mt-2.5 w-full h-[1px] bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full bg-amber-800 dark:bg-amber-400 transition-all duration-500"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        {/* 2. Day Streak */}
        <div className="py-3 sm:py-0 sm:px-6">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">
            Day Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-amber-800 dark:text-amber-400">
              {profile.streakDays}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              consecutive days
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 dark:text-stone-500">
            Weekly pace: {currentWeeklyProgress.toLocaleString()} / {weeklyTarget.toLocaleString()}w
          </p>
        </div>

        {/* 3. Mastered */}
        <div className="py-3 sm:py-0 sm:pl-6">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">
            Mastered
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
              {masteredCount}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              of {allFlashcards.length} words
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 dark:text-stone-500">
            {dueCount} due for review today
          </p>
        </div>
      </div>

      {activeTab === 'league' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 pb-3 border-b border-stone-200 dark:border-stone-800">
            <span>
              {profile.leagueTier} Division · Weekly pace {weeklyPercent}% ({currentWeeklyProgress}/{weeklyTarget}w)
            </span>
            <span className="text-amber-800 dark:text-amber-400 font-medium">
              Top 3 advance each Sunday
            </span>
          </div>

          <div className="divide-y divide-stone-200/80 dark:divide-stone-800/80 border-b border-stone-200 dark:border-stone-800">
            {isLoading ? (
              <div className="py-10 text-center text-xs font-serif italic text-stone-400">
                Loading Peer League standings...
              </div>
            ) : (
              leaderboard.map((user, idx) => {
                const isCurrentUser = user.id === profile.id;

                return (
                  <React.Fragment key={user.id}>
                    {idx === 3 && (
                      <div className="py-2 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-400 font-medium tracking-wide uppercase">
                        <span>▲ Promotion Cutoff</span>
                        <span className="font-mono">Top 3</span>
                      </div>
                    )}

                    <div
                      className={`py-3.5 flex items-center justify-between gap-4 transition-colors ${
                        isCurrentUser ? 'bg-amber-900/[0.03] dark:bg-amber-400/[0.04] -mx-2 px-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`font-mono text-xs font-semibold w-5 text-center ${
                            idx < 3
                              ? 'text-amber-800 dark:text-amber-400'
                              : 'text-stone-400 dark:text-stone-500'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                              {user.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-400 font-semibold">
                                · You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 truncate block">
                            {user.handle} · {user.streakDays}d streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {user.wordsReadThisWeek.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-stone-400 block">words / wk</span>
                        </div>

                        {!isCurrentUser && (
                          <button
                            onClick={() => handleToggleFollow(user.id)}
                            className={`text-xs font-medium transition-colors cursor-pointer ${
                              user.isFollowing
                                ? 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                                : 'text-amber-800 dark:text-amber-400 hover:underline'
                            }`}
                          >
                            {user.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="divide-y divide-stone-200/80 dark:divide-stone-800/80 border-b border-stone-200 dark:border-stone-800">
          {readingLogs.slice(0, 5).map((log) => {
            const langName = SUPPORTED_LANGUAGES.find((l) => l.code === log.language)?.name || 'Literature';
            return (
              <div key={log.id} className="py-4 first:pt-0">
                <span className="text-[11px] text-amber-800 dark:text-amber-400 font-mono">
                  {formatRelativeTime(log.timestamp)} · Your Reading Session
                </span>
                <p className="text-sm text-stone-900 dark:text-stone-100 mt-1">
                  <strong>{profile.name} (You)</strong> completed a section of{' '}
                  <em className="font-serif">{log.bookTitle || 'Literary Manuscript'}</em> in {langName}.
                </p>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1 inline-block">
                  +{log.wordsCount} words read
                </span>
              </div>
            );
          })}

          <div className="py-4 first:pt-0">
            <span className="text-[11px] text-stone-400 font-mono">15 minutes ago</span>
            <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">
              <strong>Elena Rostova</strong> completed Section 2 of <em className="font-serif">Don Quijote de la Mancha</em> in Spanish.
            </p>
            <span className="text-xs text-stone-500 font-mono mt-1 inline-block">
              +450 words read · Level B2
            </span>
          </div>

          <div className="py-4">
            <span className="text-[11px] text-stone-400 font-mono">2 hours ago</span>
            <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">
              <strong>Julian Moreau</strong> practiced 12 vocabulary cards in <em className="font-serif">Le Petit Prince</em>.
            </p>
            <span className="text-xs text-stone-500 font-mono mt-1 inline-block">
              Mastered: "apprivoiser", "graine", "éclipse"
            </span>
          </div>

          <div className="py-4">
            <span className="text-[11px] text-stone-400 font-mono">Yesterday</span>
            <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">
              <strong>Clara Weber</strong> reached a 19-day reading streak with Kafka's <em className="font-serif">Die Verwandlung</em>.
            </p>
          </div>

          <div className="py-4">
            <span className="text-[11px] text-stone-400 font-mono">2 days ago</span>
            <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">
              <strong>Arthur Sterling</strong> adapted Henry David Thoreau's <em className="font-serif">Walden</em> to CEFR A2 level.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Chronological Reading Log
            </h2>
            <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
              {isFirebaseConfigured ? 'Synced with Firestore' : 'Stored Locally in Browser'}
            </span>
          </div>

          {readingLogs.length === 0 ? (
            <div className="py-12 text-center border-b border-stone-200 dark:border-stone-800">
              <Clock className="w-7 h-7 mx-auto text-stone-400 mb-2.5 stroke-[1.25]" />
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
                No completed reading sections logged yet
              </p>
              <p className="text-xs text-stone-500 font-serif max-w-sm mx-auto mb-5">
                Advance through any chapter section in the Reader Studio to log your reading volume automatically.
              </p>
              <button
                onClick={onOpenReader}
                className="px-4 py-2 border border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 hover:bg-stone-900 hover:text-[#FAF8F4] dark:hover:bg-stone-100 dark:hover:text-stone-900 text-xs font-medium transition-colors cursor-pointer"
              >
                Open Reader Studio
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200/80 dark:divide-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              {readingLogs.map((entry) => {
                const langLabel =
                  SUPPORTED_LANGUAGES.find((l) => l.code === entry.language)?.name || 'Literature';
                return (
                  <div
                    key={entry.id}
                    className="py-3.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                          {entry.bookTitle || 'Literary Section'}
                        </p>
                        <span className="text-stone-400 font-mono text-[11px]">
                          {langLabel} · {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-semibold text-amber-800 dark:text-amber-400">
                        +{entry.wordsCount} words
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
