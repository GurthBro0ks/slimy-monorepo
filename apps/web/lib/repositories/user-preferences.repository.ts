/**
 * User Preferences Repository
 *
 * Handles database operations for user preferences
 */

import { db } from '../db';
import type { UserPreferences } from '../db';

export interface UpdateUserPreferencesInput {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: boolean;
  chatPersonality?: 'helpful' | 'sarcastic' | 'professional' | 'creative' | 'technical';
}

/**
 * User Preferences Repository
 */
export class UserPreferencesRepository {
  /**
   * Get user preferences by user ID
   */
  async findByUserId(userId: string): Promise<UserPreferences | null> {
    return await db.userPreferences.findUnique({
      where: { userId },
    });
  }

  /**
   * Get or create user preferences
   */
  async getOrCreate(userId: string): Promise<UserPreferences> {
    let preferences = await this.findByUserId(userId);

    if (!preferences) {
      preferences = await db.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async update(
    userId: string,
    data: UpdateUserPreferencesInput
  ): Promise<UserPreferences> {
    return await db.userPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Delete user preferences
   */
  async delete(userId: string): Promise<UserPreferences> {
    return await db.userPreferences.delete({
      where: { userId },
    });
  }

  /**
   * Bulk get preferences for multiple users
   */
  async findByUserIds(userIds: string[]): Promise<UserPreferences[]> {
    return await db.userPreferences.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  }
}

// Singleton instance
let repositoryInstance: UserPreferencesRepository | null = null;

/**
 * Get user preferences repository instance
 */
export function getUserPreferencesRepository(): UserPreferencesRepository {
  if (!repositoryInstance) {
    repositoryInstance = new UserPreferencesRepository();
  }
  return repositoryInstance;
}
