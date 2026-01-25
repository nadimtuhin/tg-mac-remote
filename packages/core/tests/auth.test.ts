import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('Auth Module', () => {
  beforeEach(() => {
    // Reset environment before each test
    process.env.ALLOWED_USER_IDS = '';
  });

  afterEach(() => {
    // Clean up after each test
    process.env.ALLOWED_USER_IDS = '';
  });

  describe('checkUserId', () => {
    it('should return true for authorized user', () => {
      const { checkUserId } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '123456789';

      expect(checkUserId(123456789)).toBe(true);
    });

    it('should return true for user in whitelist', () => {
      const { checkUserId } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '123456789,987654321';

      expect(checkUserId(987654321)).toBe(true);
    });

    it('should return false for unauthorized user', () => {
      const { checkUserId } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '123456789';

      expect(checkUserId(999888777)).toBe(false);
    });

    it('should handle empty ALLOWED_USER_IDS', () => {
      const { checkUserId } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '';

      expect(checkUserId(123456789)).toBe(false);
    });

    it('should handle malformed user ID', () => {
      const { checkUserId } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '123456789';

      expect(checkUserId(NaN)).toBe(false);
      expect(checkUserId(undefined as any)).toBe(false);
      expect(checkUserId(null as any)).toBe(false);
    });
  });

  describe('formatUserIds', () => {
    it('should format single user ID', () => {
      const { formatUserIds } = require('../src/auth');

      expect(formatUserIds([123456789])).toBe('123456789');
    });

    it('should format multiple user IDs', () => {
      const { formatUserIds } = require('../src/auth');

      expect(formatUserIds([123456789, 987654321])).toBe('123456789, 987654321');
    });

    it('should handle empty array', () => {
      const { formatUserIds } = require('../src/auth');

      expect(formatUserIds([])).toBe('');
    });
  });

  describe('getAllowedUserIds', () => {
    it('should return copy of user IDs', () => {
      const { getAllowedUserIds } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '123456789,987654321';

      const ids = getAllowedUserIds();

      expect(ids).toEqual([123456789, 987654321]);
      expect(ids).not.toBe(process.env.ALLOWED_USER_IDS);
    });

    it('should return empty array for empty whitelist', () => {
      const { getAllowedUserIds } = require('../src/auth');
      process.env.ALLOWED_USER_IDS = '';

      const ids = getAllowedUserIds();

      expect(ids).toEqual([]);
    });
  });
});
