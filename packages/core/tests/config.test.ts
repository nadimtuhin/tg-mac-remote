import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'bun:test';

describe('Config Module', () => {
  beforeEach(() => {
    // Reset config before each test
    process.env.TELEGRAM_BOT_TOKEN = '';
    process.env.ALLOWED_USER_IDS = '';
    delete process.env.LOG_LEVEL;
    delete process.env.ENABLED_PLUGINS;
  });

  describe('parseUserIds', () => {
    it('should parse single user ID', () => {
      const { parseUserIds } = require('../src/config');
      const ids = parseUserIds('123456789');
      expect(ids).toEqual([123456789]);
    });

    it('should parse multiple user IDs', () => {
      const { parseUserIds } = require('../src/config');
      const ids = parseUserIds('123456789,987654321');
      expect(ids).toEqual([123456789, 987654321]);
    });

    it('should handle empty string', () => {
      const { parseUserIds } = require('../src/config');
      const ids = parseUserIds('');
      expect(ids).toEqual([]);
    });

    it('should handle whitespace', () => {
      const { parseUserIds } = require('../src/config');
      const ids = parseUserIds('123456789,  987654321');
      expect(ids).toEqual([123456789, 987654321]);
    });
  });

  describe('parseCommaList', () => {
    it('should parse single item', () => {
      const { parseCommaList } = require('../src/config');
      const list = parseCommaList('terminal');
      expect(list).toEqual(['terminal']);
    });

    it('should parse multiple items', () => {
      const { parseCommaList } = require('../src/config');
      const list = parseCommaList('terminal,activity,daemon');
      expect(list).toEqual(['terminal', 'activity', 'daemon']);
    });

    it('should handle empty string', () => {
      const { parseCommaList } = require('../src/config');
      const list = parseCommaList('');
      expect(list).toEqual([]);
    });

    it('should trim whitespace', () => {
      const { parseCommaList } = require('../src/config');
      const list = parseCommaList(' terminal , activity ');
      expect(list).toEqual(['terminal', 'activity']);
    });
  });

  describe('parseBoolean', () => {
    it('should parse true value', () => {
      const { parseBoolean } = require('../src/config');
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
    });

    it('should parse false value', () => {
      const { parseBoolean } = require('../src/config');
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('FALSE')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('no')).toBe(false);
    });

    it('should default to false for invalid values', () => {
      const { parseBoolean } = require('../src/config');
      expect(parseBoolean('invalid')).toBe(false);
      expect(parseBoolean('')).toBe(false);
    });
  });

  describe('validateLogLevel', () => {
    it('should accept valid log levels', () => {
      const { validateLogLevel } = require('../src/config');
      expect(validateLogLevel('debug')).toBe('debug');
      expect(validateLogLevel('info')).toBe('info');
      expect(validateLogLevel('warn')).toBe('warn');
      expect(validateLogLevel('error')).toBe('error');
    });

    it('should reject invalid log levels', () => {
      const { validateLogLevel } = require('../src/config');
      expect(() => validateLogLevel('invalid')).toThrow();
      expect(() => validateLogLevel('')).toThrow();
    });
  });

  describe('getConfig validation', () => {
    it('should throw error if TELEGRAM_BOT_TOKEN is missing', () => {
      const { getConfig, resetConfig } = require('../src/config');
      resetConfig();

      expect(() => getConfig()).toThrow('TELEGRAM_BOT_TOKEN is required');
    });

    it('should throw error if ALLOWED_USER_IDS is missing', () => {
      const { getConfig, resetConfig } = require('../src/config');
      resetConfig();
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';

      expect(() => getConfig()).toThrow('ALLOWED_USER_IDS is required');
    });

    it('should return config with all required fields set', () => {
      const { getConfig, resetConfig } = require('../src/config');
      resetConfig();
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.ALLOWED_USER_IDS = '123456789';

      const config = getConfig();
      expect(config.telegramBotToken).toBe('test-token');
      expect(config.allowedUserIds).toEqual([123456789]);
      expect(config.logLevel).toBe('info');
      expect(config.autoUpdate).toBe(false);
      expect(config.enabledPlugins).toEqual([]);
    });

    it('should use default values for optional fields', () => {
      const { getConfig, resetConfig } = require('../src/config');
      resetConfig();
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.ALLOWED_USER_IDS = '123456789';
      process.env.LOG_LEVEL = 'debug';
      process.env.ENABLED_PLUGINS = 'terminal,activity';

      const config = getConfig();
      expect(config.logLevel).toBe('debug');
      expect(config.autoUpdate).toBe(false);
      expect(config.enabledPlugins).toEqual(['terminal', 'activity']);
    });
  });
});
