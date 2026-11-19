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

  const dailyGoal = Math.max(50, profile.dailyWordGoal || 500);
  const wordsToday = profile.wordsReadToday || 0;
  const dailyRatio = Math.min(1, wordsToday / dailyGoal);
  const dailyPercent = Math.min(100, Math.round(dailyRatio * 100));

  // Apple Daily Goal Progress Ring SVG math
  const ringRadius = 17;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - dailyRatio);

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Apple Editorial Header + Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#6E6E73] dark:text-[#98989D] block mb-1">
            Scholarship & Daily Ritual
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Reading Journal
          </h1>
        </div>

        {/* Apple Segmented Control */}
        <div
          role="tablist"
          aria-label="Journal views"
          className="inline-flex items-center p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] self-start sm:self-auto text-xs"
        >
          {(
            [
              { id: 'analytics', label: 'Reading Log' },
              { id: 'league', label: 'Peer League' },
              { id: 'feed', label: 'Activity' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white font-medium'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apple Glass 3-Metric Card with Daily Goal Progress Ring */}
      <div className="apple-glass-card rounded-3xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] dark:divide-white/[0.08]">
          {/* 1. Words Read + Daily Goal Ring */}
          <div className="pb-4 sm:pb-0 sm:pr-5 flex items-center gap-3.5">
            <div className="relative flex items-center justify-center shrink-0" title={`${dailyPercent}% of ${dailyGoal}w daily goal`}>
              <svg width="46" height="46" viewBox="0 0 46 46" className="-rotate-90">
                <circle
                  cx="23"
                  cy="23"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-black/[0.08] dark:text-white/[0.1]"
                />
                <circle
                  cx="23"
                  cy="23"
                  r={ringRadius}
                  fill="none"
                  stroke={dailyRatio >= 1 ? '#34C759' : 'var(--accent-apple)'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {dailyPercent}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D]">
                  Words Read
                </span>
                <button
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 text-[11px] text-[#0071E3] dark:text-[#0A84FF] hover:underline transition-colors cursor-pointer"
                  title="Adjust Daily Word Goal"
                >
                  <Settings className="w-3 h-3" />
                  <span>{dailyGoal}w</span>
                </button>
              </div>
              <div className="font-mono text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {profile.totalWordsRead.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] truncate">
                {wordsToday.toLocaleString()} today · {dailyPercent}% of goal
              </p>
            </div>
          </div>

          {/* 2. Day Streak */}
          <div className="py-4 sm:py-0 sm:px-5">
            <span className="text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D] block mb-1">
              Day Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-[#0071E3] dark:text-[#0A84FF]">
                {profile.streakDays}
              </span>
              <span className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                consecutive days
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#98989D]">
              Weekly pace: {currentWeeklyProgress.toLocaleString()} / {weeklyTarget.toLocaleString()}w
            </p>
          </div>

          {/* 3. Mastered */}
          <div className="pt-4 sm:pt-0 sm:pl-5">
            <span className="text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D] block mb-1">
              Mastered
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {masteredCount}
              </span>
              <span className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                of {allFlashcards.length} words
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#98989D]">
              {dueCount} due for review today
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'league' && (
        <div className="apple-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6E73] dark:text-[#98989D] pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-black/[0.045] dark:bg-white/[0.08] text-[10px] font-semibold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7]">
                Simulated Study Circle
              </span>
              <span>
                {profile.leagueTier} Division · Weekly pace {weeklyPercent}% ({currentWeeklyProgress}/{weeklyTarget}w)
              </span>
            </div>
            <span className="text-[#0071E3] dark:text-[#0A84FF] font-medium">
              Top 3 advance each Sunday
            </span>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {isLoading ? (
              <div className="py-10 text-center text-xs font-reader italic text-[#6E6E73] dark:text-[#98989D]">
                Loading Simulated Study Circle standings...
              </div>
            ) : (
              leaderboard.map((user, idx) => {
                const isCurrentUser = user.id === profile.id;

                return (
                  <React.Fragment key={user.id}>
                    {idx === 3 && (
                      <div className="py-2 flex items-center justify-between text-[11px] text-[#0071E3] dark:text-[#0A84FF] font-semibold tracking-wide uppercase">
                        <span>▲ Promotion Cutoff</span>
                        <span className="font-mono">Top 3</span>
                      </div>
                    )}

                    <div
                      className={`py-3.5 flex items-center justify-between gap-4 transition-colors rounded-xl ${
                        isCurrentUser ? 'bg-[#0071E3]/[0.05] dark:bg-[#0A84FF]/[0.08] px-3 -mx-1' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`font-mono text-xs font-semibold w-5 text-center ${
                            idx < 3
                              ? 'text-[#0071E3] dark:text-[#0A84FF]'
                              : 'text-[#6E6E73] dark:text-[#98989D]'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                              {user.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#0071E3] dark:text-[#0A84FF] font-semibold">
                                · You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#6E6E73] dark:text-[#98989D] truncate block">
                            {user.handle} · {user.streakDays}d streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {user.wordsReadThisWeek.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] block">words / wk</span>
                        </div>

                        {!isCurrentUser && (
                          <button
                            onClick={() => handleToggleFollow(user.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                              user.isFollowing
                                ? 'bg-black/[0.045] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
                                : 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/15 text-[#0071E3] dark:text-[#0A84FF] hover:bg-[#0071E3]/15'
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
        <div className="apple-glass-card rounded-3xl p-5 sm:p-6 divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {readingLogs.slice(0, 5).map((log) => {
            const langName = SUPPORTED_LANGUAGES.find((l) => l.code === log.language)?.name || 'Literature';
            return (
              <div key={log.id} className="py-4 first:pt-0">
                <span className="text-[11px] text-[#0071E3] dark:text-[#0A84FF] font-mono">
                  {formatRelativeTime(log.timestamp)} · Your Reading Session
                </span>
                <p className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
                  <strong>{profile.name} (You)</strong> completed a section of{' '}
                  <em className="font-reader">{log.bookTitle || 'Literary Manuscript'}</em> in {langName}.
                </p>
                <span className="text-xs text-[#6E6E73] dark:text-[#98989D] font-mono mt-1 inline-block">
                  +{log.wordsCount} words read
                </span>
              </div>
            );
          })}

          <div className="py-4 first:pt-0">
            <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
              15 minutes ago · Simulated Study Circle
            </span>
            <p className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
              <strong>Elena Rostova</strong> completed Section 2 of <em className="font-reader">Don Quijote de la Mancha</em> in Spanish.
            </p>
            <span className="text-xs text-[#6E6E73] dark:text-[#98989D] font-mono mt-1 inline-block">
              +450 words read · Level B2
            </span>
          </div>

          <div className="py-4">
            <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
              2 hours ago · Simulated Study Circle
            </span>
            <p className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
              <strong>Julian Moreau</strong> practiced 12 vocabulary cards in <em className="font-reader">Le Petit Prince</em>.
            </p>
            <span className="text-xs text-[#6E6E73] dark:text-[#98989D] font-mono mt-1 inline-block">
              Mastered: "apprivoiser", "graine", "éclipse"
            </span>
          </div>

          <div className="py-4">
            <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
              Yesterday · Simulated Study Circle
            </span>
            <p className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
              <strong>Clara Weber</strong> reached a 19-day reading streak with Kafka's <em className="font-reader">Die Verwandlung</em>.
            </p>
          </div>

          <div className="py-4 last:pb-0">
            <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
              2 days ago · Simulated Study Circle
            </span>
            <p className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
              <strong>Arthur Sterling</strong> adapted Henry David Thoreau's <em className="font-reader">Walden</em> to CEFR A2 level.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="apple-glass-card rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
            <h2 className="font-display text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Chronological Reading Log
            </h2>
            <span className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
              {isFirebaseConfigured ? 'Synced with Firestore' : 'Stored Locally in Browser'}
            </span>
          </div>

          {readingLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-7 h-7 mx-auto text-[#6E6E73] dark:text-[#98989D] mb-2.5 stroke-[1.25]" />
              <p className="text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                No completed reading sections logged yet
              </p>
              <p className="text-xs text-[#6E6E73] dark:text-[#98989D] font-reader max-w-sm mx-auto mb-5">
                Advance through any chapter section in the Reader Studio to log your reading volume automatically.
              </p>
              <button
                onClick={onOpenReader}
                className="px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Reader Studio
              </button>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {readingLogs.map((entry) => {
                const langLabel =
                  SUPPORTED_LANGUAGES.find((l) => l.code === entry.language)?.name || 'Literature';
                return (
                  <div
                    key={entry.id}
                    className="py-3.5 last:pb-0 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-reader font-medium text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                          {entry.bookTitle || 'Literary Section'}
                        </p>
                        <span className="text-[#6E6E73] dark:text-[#98989D] font-mono text-[11px]">
                          {langLabel} · {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">
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
