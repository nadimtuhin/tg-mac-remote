import { checkUserId } from '@tg-mac-remote/core';
import { info, warn } from '@tg-mac-remote/core';

/**
 * Authorization middleware
 *
 * Checks if the user is allowed to use the bot
 * Rejects unauthorized users with a clear message
 */
export const authMiddleware = async (context: {
  from?: { id: number };
  reply: (text: string) => Promise<unknown>;
}): Promise<void> => {
  if (!context.from) {
    warn('Message received without sender information');
    return;
  }

  const userId = context.from.id;

  if (!checkUserId(userId)) {
    info(`Unauthorized access attempt from user ${userId}`);
    await context.reply('Sorry, you are not authorized to use this bot.');
    throw new Error(`Unauthorized user: ${userId}`);
  }
};
