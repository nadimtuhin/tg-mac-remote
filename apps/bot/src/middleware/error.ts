import { error } from '@tg-mac-remote/core';

/**
 * Error handling middleware
 *
 * Catches and logs errors
 * Sends user-friendly error messages to users
 */
export const errorMiddleware = async (
  err: unknown,
  context: {
    reply: (text: string) => Promise<unknown>;
  }
): Promise<void> => {
  error('Bot error:', err);

  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
  await context.reply(`Sorry, something went wrong: ${errorMessage}`);
};
