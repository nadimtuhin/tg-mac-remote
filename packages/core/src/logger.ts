// Structured logging with configurable log levels

import { getConfig, type LogLevel } from './config.js';

export type { LogLevel };

/**
 * Check if a message should be logged based on current log level
 */
function shouldLog(messageLevel: LogLevel): boolean {
  const config = getConfig();
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(messageLevel) >= levels.indexOf(config.logLevel);
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Debug level logging (most verbose)
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    const formatted = formatMessage('debug', message);
    // eslint-disable-next-line no-console
    console.debug(formatted, ...args);
  }
}

/**
 * Info level logging (general information)
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    const formatted = formatMessage('info', message);
    // eslint-disable-next-line no-console
    console.log(formatted, ...args);
  }
}

/**
 * Warn level logging (potential issues)
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    const formatted = formatMessage('warn', message);
    console.warn(formatted, ...args);
  }
}

/**
 * Error level logging (errors and exceptions)
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    const formatted = formatMessage('error', message);
    console.error(formatted, ...args);
  }
}
