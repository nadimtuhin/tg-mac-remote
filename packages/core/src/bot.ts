// Telegram bot wrapper using grammy

import { Bot as GrammyBot, type Context as GrammyContext } from 'grammy';
import { getConfig } from './config.js';
import { error } from './logger.js';

/**
 * Bot instance (lazy-loaded singleton)
 */
let botInstance: GrammyBot<GrammyContext> | null = null;

/**
 * Initialize the Telegram bot
 *
 * @returns Grammy Bot instance
 * @throws Error if bot token is missing or invalid
 */
export function initBot(): GrammyBot<GrammyContext> {
  if (botInstance !== null) {
    return botInstance;
  }

  const config = getConfig();

  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  try {
    botInstance = new GrammyBot<GrammyContext>(config.telegramBotToken);

    // Setup basic error handling
    botInstance.catch((err) => {
      error('Bot error:', err);
    });

    return botInstance;
  } catch (err) {
    error('Failed to initialize bot:', err);
    throw new Error(`Failed to initialize Telegram bot: ${err}`);
  }
}

/**
 * Get the bot instance (initializes if needed)
 *
 * @returns Grammy Bot instance
 */
export function getBot(): GrammyBot<GrammyContext> {
  if (botInstance === null) {
    return initBot();
  }
  return botInstance;
}

/**
 * Check if bot is initialized
 *
 * @returns true if bot is initialized, false otherwise
 */
export function isBotInitialized(): boolean {
  return botInstance !== null;
}

/**
 * Stop the bot
 *
 * @returns Promise that resolves when bot is stopped
 */
export async function stopBot(): Promise<void> {
  if (botInstance !== null) {
    await botInstance.stop();
    botInstance = null;
  }
}
