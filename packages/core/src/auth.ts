// Telegram user authentication and authorization

import { getConfig } from './config.js';

/**
 * Check if a Telegram user ID is allowed to use the bot
 *
 * @param userId - Telegram user ID to check
 * @returns true if user is in the allowed list, false otherwise
 */
export function checkUserId(userId: number): boolean {
  const config = getConfig();
  return config.allowedUserIds.includes(userId);
}

/**
 * Get list of all allowed user IDs
 *
 * @returns Array of allowed user IDs
 */
export function getAllowedUserIds(): number[] {
  const config = getConfig();
  return [...config.allowedUserIds];
}

/**
 * Format user IDs for display (e.g., in logs)
 *
 * @param userIds - Array of user IDs
 * @returns Comma-separated string
 */
export function formatUserIds(userIds: number[]): string {
  return userIds.join(', ');
}
