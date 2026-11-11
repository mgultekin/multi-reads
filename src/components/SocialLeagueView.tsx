import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trophy,
  BookOpen,
  BarChart3,
  Clock,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { Flashcard, ReadingLogEntry, SocialUser, UserProfile } from '../types/index.ts';
import { SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { socialService } from '../services/socialService.ts';
import { storageService } from '../services/storageService.ts';

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
  const [activeTab, setActiveTab] = useState<'league' | 'feed' | 'analytics'>('league');
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
  const currentWeeklyProgress = profile.wordsReadThisWeek || profile.wordsReadToday + 1200;
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
      {/* Top Header */}
      <div className="mb-8 pb-6 border-b border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-1">
            <span>Scholarship & Daily Ritual</span>
            <span aria-hidden="true">·</span>
            <span>{profile.leagueTier} Division</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            Habit Engine & Scholar League
          </h1>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('league')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'league'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Weekly League
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Reading Feed
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Analytics & Log
          </button>
        </div>
      </div>

      {/* Habit Metrics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {/* Streak card */}
        <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
              Active Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-bold text-amber-700 dark:text-amber-400">
                {profile.streakDays}
              </span>
              <span className="text-xs font-medium text-stone-500">consecutive days</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-700 dark:text-amber-400">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
        </div>

        {/* Daily Goal Progress */}
        <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-stone-400">
              Daily Reading Goal
            </span>
            <span className="text-xs font-mono text-stone-500">{dailyPercent}%</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
              {profile.wordsReadToday || 0}
            </span>
            <span className="text-xs text-stone-400">/ {dailyGoal} words today</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        {/* Division & Standing */}
        <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
              Scholarly League
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                {profile.leagueTier}
              </span>
              <span className="text-xs text-stone-400">· {profile.xp} XP</span>
            </div>
          </div>
          <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-xl text-stone-700 dark:text-stone-300">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      {activeTab === 'league' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Ranks reset every Sunday at midnight · Weekly goal: {weeklyPercent}% ({currentWeeklyProgress}/{weeklyTarget}w)</span>
            <span className="text-amber-800 dark:text-amber-400 font-medium">Top 3 advance to next tier</span>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 overflow-hidden shadow-xs">
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {isLoading ? (
                <div className="p-8 text-center text-xs font-serif italic text-stone-400">
                  Loading Scholar League standings...
                </div>
              ) : (
                leaderboard.map((user, idx) => {
                  const isCurrentUser = user.id === profile.id;

                  return (
                    <React.Fragment key={user.id}>
                      {idx === 3 && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/20 px-6 py-2 border-y border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                          <span>▲ PROMOTION ZONE (Advance to Next League Tier)</span>
                          <span className="font-mono">Top 3 Cutoff</span>
                        </div>
                      )}

                      <div
                        className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                          isCurrentUser
                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                            : 'hover:bg-stone-50/60 dark:hover:bg-stone-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span
                            className={`font-mono text-sm font-bold w-6 text-center ${
                              idx === 0
                                ? 'text-amber-600'
                                : idx === 1
                                ? 'text-stone-400'
                                : idx === 2
                                ? 'text-amber-800 dark:text-amber-600'
                                : 'text-stone-400'
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
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-stone-400 truncate block">
                              {user.handle} · {user.streakDays}d streak
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">
                              {user.wordsReadThisWeek.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-stone-400 block">words this week</span>
                          </div>

                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleFollow(user.id)}
                              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                                user.isFollowing
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                                  : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 hover:border-amber-600'
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
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 p-6 divide-y divide-stone-100 dark:divide-stone-800">
            {/* Prepend real user reading log entries */}
            {readingLogs.slice(0, 5).map((log) => {
              const langName = SUPPORTED_LANGUAGES.find((l) => l.code === log.language)?.name || 'Literature';
              return (
                <div key={log.id} className="py-4 first:pt-0">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-mono">
                    {formatRelativeTime(log.timestamp)} · Your Reading Session
                  </span>
                  <p className="text-sm text-stone-900 dark:text-stone-100 font-medium mt-1">
                    <strong>{profile.name} (You)</strong> completed a section of{' '}
                    <em>{log.bookTitle || 'Literary Manuscript'}</em> in {langName}.
                  </p>
                  <span className="text-xs text-amber-800 dark:text-amber-400 font-mono mt-1 inline-block">
                    +{log.wordsCount} words read · Synced to Reading Log
                  </span>
                </div>
              );
            })}

            <div className="py-4 first:pt-0">
              <span className="text-xs text-stone-400 font-mono">15 minutes ago</span>
              <p className="text-sm text-stone-800 dark:text-stone-200 font-medium mt-1">
                <strong>Elena Rostova</strong> completed Section 2 of <em>Don Quijote de la Mancha</em> in Spanish.
              </p>
              <span className="text-xs text-amber-800 dark:text-amber-400 font-mono mt-1 inline-block">
                +450 words read · Level B2
              </span>
            </div>

            <div className="py-4">
              <span className="text-xs text-stone-400 font-mono">2 hours ago</span>
              <p className="text-sm text-stone-800 dark:text-stone-200 font-medium mt-1">
                <strong>Julian Moreau</strong> practiced 12 vocabulary cards in <em>Le Petit Prince</em>.
              </p>
              <span className="text-xs text-stone-500 font-mono mt-1 inline-block">
                Mastered: "apprivoiser", "graine", "éclipse"
              </span>
            </div>

            <div className="py-4">
              <span className="text-xs text-stone-400 font-mono">Yesterday</span>
              <p className="text-sm text-stone-800 dark:text-stone-200 font-medium mt-1">
                <strong>Clara Weber</strong> reached a 19-day reading streak with Kafka's <em>Die Verwandlung</em>.
              </p>
            </div>

            <div className="pt-4">
              <span className="text-xs text-stone-400 font-mono">2 days ago</span>
              <p className="text-sm text-stone-800 dark:text-stone-200 font-medium mt-1">
                <strong>Arthur Sterling</strong> adapted Henry David Thoreau's <em>Walden</em> to CEFR A2 level.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Vocabulary & Reading Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
                Lifetime Volume
              </span>
              <span className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
                {profile.totalWordsRead.toLocaleString()}
              </span>
              <span className="text-xs text-stone-500 block mt-0.5">total words read</span>
            </div>

            <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
                Wordbook SRS Deck
              </span>
              <span className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
                {allFlashcards.length}
              </span>
              <span className="text-xs text-stone-500 block mt-0.5">
                {dueCount} due today · {masteredCount} mastered
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
                  Habit Target
                </span>
                <span className="font-mono text-xl font-bold text-amber-800 dark:text-amber-400">
                  {dailyGoal} words / day
                </span>
              </div>
              <button
                onClick={onOpenSettings}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                Adjust Daily Goal
              </button>
            </div>
          </div>

          {/* Chronological Reading Session Log */}
          <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-700" />
                <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  Verified Reading Session Log
                </h3>
              </div>
              <span className="text-xs font-mono text-stone-400">
                Synced with Firestore (/reading_logs)
              </span>
            </div>

            {readingLogs.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-8 h-8 mx-auto text-stone-400 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
                  No completed reading sections logged yet
                </p>
                <p className="text-xs text-stone-500 font-serif max-w-sm mx-auto mb-4">
                  Advance through any chapter section in the Reader Studio to automatically log your reading volume and sync with Firestore.
                </p>
                <button
                  onClick={onOpenReader}
                  className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Open Reader Studio
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {readingLogs.map((entry) => {
                  const langLabel =
                    SUPPORTED_LANGUAGES.find((l) => l.code === entry.language)?.name || 'Literature';
                  return (
                    <div
                      key={entry.id}
                      className="py-3.5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                            {entry.bookTitle || 'Literary Section'}
                          </p>
                          <span className="text-stone-400 font-mono">
                            {langLabel} · {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="font-bold text-amber-800 dark:text-amber-400">
                          +{entry.wordsCount} words
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
