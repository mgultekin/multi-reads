import { LanguageCode, LeagueTier, SocialUser, UserProfile } from '../types/index.ts';
import { MOCK_SOCIAL_USERS } from '../data/constants.ts';
import { storageService } from './storageService.ts';

class SocialService {
  /**
   * Get leaderboard sorted by weekly reading words
   */
  async getLeaderboard(): Promise<SocialUser[]> {
    const profile = storageService.getUserProfile();

    const currentUserAsSocial: SocialUser = {
      id: profile.id,
      name: `${profile.name} (You)`,
      handle: profile.handle,
      avatar: profile.avatar,
      wordsReadThisWeek: profile.wordsReadThisWeek || profile.wordsReadToday + 1200,
      totalWordsRead: profile.totalWordsRead,
      streakDays: profile.streakDays,
      leagueTier: profile.leagueTier,
      currentBookTitle: 'Active Reader',
    };

    const peers = [...MOCK_SOCIAL_USERS].map((user) => ({
      ...user,
      isFollowing: profile.following.includes(user.id),
    }));

    const combined = [currentUserAsSocial, ...peers];
    return combined.sort((a, b) => b.wordsReadThisWeek - a.wordsReadThisWeek);
  }

  /**
   * Follow or unfollow a scholar peer
   */
  async toggleFollow(targetUserId: string): Promise<boolean> {
    const profile = storageService.getUserProfile();
    const idx = profile.following.indexOf(targetUserId);
    let isNowFollowing = false;

    if (idx >= 0) {
      profile.following.splice(idx, 1);
      isNowFollowing = false;
    } else {
      profile.following.push(targetUserId);
      isNowFollowing = true;
    }

    storageService.saveUserProfile(profile);
    return isNowFollowing;
  }

  /**
   * Log actual reading section words and award proportional reading XP
   */
  async recordReadingProgress(
    wordsRead: number,
    bookMeta?: { bookId?: string; bookTitle?: string; language?: LanguageCode }
  ): Promise<UserProfile> {
    const updated = storageService.recordWordsRead(wordsRead, bookMeta);
    return this.recalculateLeagueTier(updated);
  }

  /**
   * Award standalone XP for quizzes, flashcards, or vocabulary saves without inflating wordsReadToday
   */
  async awardXP(xpAmount: number): Promise<UserProfile> {
    const updated = storageService.awardXP(xpAmount);
    return this.recalculateLeagueTier(updated);
  }

  private recalculateLeagueTier(profile: UserProfile): UserProfile {
    let tier: LeagueTier = 'Bronze';
    if (profile.xp >= 3000) tier = 'Diamond';
    else if (profile.xp >= 1800) tier = 'Sapphire';
    else if (profile.xp >= 900) tier = 'Gold';
    else if (profile.xp >= 400) tier = 'Silver';

    if (profile.leagueTier !== tier) {
      profile.leagueTier = tier;
      storageService.saveUserProfile(profile);
    }
    return profile;
  }
}

export const socialService = new SocialService();
