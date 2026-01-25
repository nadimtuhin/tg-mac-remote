export interface Config {
  telegramBotToken: string;
  allowedUserIds: number[];
  logLevel: string;
  enabledPlugins: string;
  externalPlugins?: string;
  openCodeModel?: string;
  anthropicApiKey?: string;
  autoUpdate: boolean;
}

export interface PluginLoadConfig {
  enabledPlugins: string;
  externalPlugins?: string;
}

export function getProjectConfig(): Config {
  const userIds = process.env.ALLOWED_USER_IDS;
  const allowedUserIds = userIds
    ? userIds
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id): id is number => !isNaN(id))
    : [];

  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedUserIds,
    logLevel: process.env.LOG_LEVEL || 'info',
    enabledPlugins: process.env.ENABLED_PLUGINS || '',
    externalPlugins: process.env.EXTERNAL_PLUGINS,
    openCodeModel: process.env.OPENCODE_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    autoUpdate: process.env.AUTO_UPDATE === 'true',
  };
}
