// Shared TypeScript types for the bot

import type { Config, LogLevel } from './config.js';

export type { Config, LogLevel };

/**
 * Telegram message context
 */
export interface BotContext {
  from: {
    id: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    isBot: boolean;
    languageCode?: string;
  };
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
  };
  messageId: number;
  date: number;
  text?: string;
}

/**
 * Bot command definition
 */
export interface Command {
  name: string;
  description: string;
  handler: (context: BotContext, args: string[]) => Promise<string> | string;
}

/**
 * Plugin interface
 */
export interface Plugin {
  name: string;
  description: string;
  commands?: Command[];
  register(bot: unknown): void;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  error?: unknown;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  name: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

/**
 * Bot event types
 */
export type BotEvent =
  | 'command'
  | 'message'
  | 'callback_query'
  | 'inline_query'
  | 'error'
  | 'ready';

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
}
