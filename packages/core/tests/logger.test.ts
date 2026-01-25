import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';

describe('Logger Module', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('log level filtering', () => {
    it('should call console.log for debug level when LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug';
      const { info, debug } = require('../src/logger');

      console.log = mock(() => {});

      debug('Debug message');
      expect(console.log).toHaveBeenCalledWith(
        '[2025-01-25T03:00:00.000Z]',
        '[DEBUG]',
        'Debug message'
      );

      console.log.mockClear();
    });

    it('should not call console.log for debug level when LOG_LEVEL=info', () => {
      process.env.LOG_LEVEL = 'info';
      const { info, debug } = require('../src/logger');

      console.log = mock(() => {});

      debug('Debug message');
      expect(console.log).not.toHaveBeenCalled();
      expect(console.log.mock.calls.length).toBe(0);
    });

    it('should call console.log for info level when LOG_LEVEL=info', () => {
      process.env.LOG_LEVEL = 'info';
      const { info } = require('../src/logger');

      console.log = mock(() => {});

      info('Info message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[2025-01-25T\d{2}:\d{2}\.\d{3}Z]/),
        '[INFO]',
        'Info message'
      );
    });

    it('should call console.warn for warn level', () => {
      process.env.LOG_LEVEL = 'warn';
      const { warn } = require('../src/logger');

      console.warn = mock(() => {});

      warn('Warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[2025-01-25T\d{2}:\d{2}\.\d{3}Z]/),
        '[WARN]',
        'Warning message'
      );
    });

    it('should call console.error for error level', () => {
      process.env.LOG_LEVEL = 'error';
      const { error } = require('../src/logger');

      console.error = mock(() => {});

      error('Error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[2025-01-25T\d{2}:\d{2}\.\d{3}Z]/),
        '[ERROR]',
        'Error message'
      );
    });

    it('should call console.error for error level regardless of LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'info';
      const { error } = require('../src/logger');

      console.error = mock(() => {});

      error('Error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[2025-01-25T\d{2}:\d{2}\.\d{3}Z]/),
        '[ERROR]',
        'Error message'
      );
    });
  });

  describe('timestamp formatting', () => {
    it('should format timestamp in ISO 8601 format', () => {
      process.env.LOG_LEVEL = 'info';
      const { info } = require('../src/logger');

      console.log = mock(() => {});

      info('Test message');
      expect(console.log).toHaveBeenCalledTimes(1);

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toMatch(/^\[\d{4}-\d{2}-\d{2}\.\d{3}Z\]/);
    });
  });
});
