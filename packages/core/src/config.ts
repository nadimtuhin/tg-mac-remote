// Config types and environment variable loader

export interface Config {
  telegramBotToken: string;
  allowedUserIds: number[];
  logLevel: LogLevel;
  enabledPlugins?: string[];
  openCodeModel?: string;
  anthropicApiKey?: string;
  autoUpdate?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Required environment variables
const REQUIRED_VARS = ['TELEGRAM_BOT_TOKEN', 'ALLOWED_USER_IDS'] as const;

// Default values for optional variables
const DEFAULTS = {
  LOG_LEVEL: 'info' as const,
  AUTO_UPDATE: 'false',
} as const;

/**
 * Validate that all required environment variables are present
 */
function validateEnv(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env file.'
    );
  }
}

/**
 * Parse comma-separated string into array of numbers
 */
function parseUserIds(value: string): number[] {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => {
      const num = Number.parseInt(id, 10);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      return num;
    });
}

/**
 * Parse comma-separated string into array of strings
 */
function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse boolean string to boolean
 */
function parseBoolean(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

/**
 * Validate log level
 */
function validateLogLevel(level: string): LogLevel {
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (validLevels.includes(level as LogLevel)) {
    return level as LogLevel;
  }
  return DEFAULTS.LOG_LEVEL;
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): Config {
  validateEnv();

  const config: Config = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    allowedUserIds: parseUserIds(process.env.ALLOWED_USER_IDS!),
    logLevel: validateLogLevel(process.env.LOG_LEVEL ?? DEFAULTS.LOG_LEVEL),
  };

  // Optional fields
  if (process.env.ENABLED_PLUGINS) {
    config.enabledPlugins = parseCommaList(process.env.ENABLED_PLUGINS);
  }

  if (process.env.OPENCODE_MODEL) {
    config.openCodeModel = process.env.OPENCODE_MODEL;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (process.env.AUTO_UPDATE) {
    config.autoUpdate = parseBoolean(process.env.AUTO_UPDATE);
  } else {
    config.autoUpdate = parseBoolean(DEFAULTS.AUTO_UPDATE);
  }

  return config;
}

// Singleton config instance
let configInstance: Config | null = null;

/**
 * Get configuration (lazy-loaded singleton)
 */
export function getConfig(): Config {
  if (configInstance === null) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
