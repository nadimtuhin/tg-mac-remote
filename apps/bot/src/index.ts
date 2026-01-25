import { initBot, stopBot } from '@tg-mac-remote/core';
import type { PluginLoadConfig } from '@tg-mac-remote/plugins';
import { PluginLoader } from '@tg-mac-remote/plugins';
import { info, error, debug } from '@tg-mac-remote/core';
import { authMiddleware } from './middleware/auth.js';
import { errorMiddleware } from './middleware/error.js';
import { setupCommands } from './commands/index.js';
import { getProjectConfig } from '../../tg-mac-remote.config.js';

/**
 * Setup bot middleware
 */
function setupMiddleware(bot: unknown): void {
  info('Setting up middleware...');

  const grammyBot = bot as { use: (middleware: unknown) => void };
  grammyBot.use(authMiddleware);
  grammyBot.use(errorMiddleware);

  debug('Middleware setup complete');
}

/**
 * Load and register plugins using PluginLoader
 */
async function loadAndRegisterPlugins(bot: unknown): Promise<void> {
  const config = getProjectConfig();
  const pluginConfig: PluginLoadConfig = {
    enabledPlugins: config.enabledPlugins ? config.enabledPlugins.split(',').filter(Boolean) : [],
    externalPlugins: config.externalPlugins
      ? config.externalPlugins.split(',').filter(Boolean)
      : [],
  };

  if (
    pluginConfig.enabledPlugins.length === 0 &&
    (!pluginConfig.externalPlugins || pluginConfig.externalPlugins.length === 0)
  ) {
    info('No plugins enabled');
    return;
  }

  const loader = new PluginLoader();
  const loadedPlugins = await loader.loadPlugins(pluginConfig);

  info(`Loaded ${loadedPlugins.length} plugins`);

  // Register plugins with bot
  const registry = loader.getRegistry();
  const plugins = registry.getAllPlugins();

  for (const plugin of plugins) {
    try {
      plugin.register(bot);
      debug(`Registered plugin: ${plugin.name}`);
    } catch (err) {
      error(`Failed to register plugin ${plugin.name}:`, err);
    }
  }

  const commands = registry.getCommands();
  if (commands.length > 0) {
    setupCommands(bot, commands);
    info(`Registered ${commands.length} commands from plugins`);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    info(`Received ${signal}, shutting down gracefully...`);

    try {
      await stopBot();
      info('Bot stopped successfully');
      process.exit(0);
    } catch (err) {
      error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));

  process.on('uncaughtException', (err) => {
    error('Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    info('Starting Telegram bot...');

    const config = getProjectConfig();
    info(`Log level: ${config.logLevel}`);
    info(`Allowed users: ${config.allowedUserIds.join(', ')}`);

    const bot = initBot();
    info('Bot initialized');

    setupMiddleware(bot);

    await loadAndRegisterPlugins(bot);

    setupGracefulShutdown();

    info('Starting bot polling...');
    const grammyBot = bot as { start: () => Promise<void> };
    await grammyBot.start();

    info('Bot started successfully');
  } catch (err) {
    error('Failed to start bot:', err);
    process.exit(1);
  }
}

void main();
