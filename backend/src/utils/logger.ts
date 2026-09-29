/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\u001b[90m',
  info: '\u001b[36m',
  warn: '\u001b[33m',
  error: '\u001b[31m',
};

const RESET = '\u001b[0m';
const enabled = process.env.NODE_ENV !== 'test';

const write = (level: LogLevel, message: string, context?: unknown): void => {
  if (!enabled) return;
  const timestamp = new Date().toISOString();
  const prefix = `${LEVEL_COLORS[level]}[${timestamp}] ${level.toUpperCase()}${RESET}`;
  if (context === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }
  console.log(`${prefix} ${message}`, context);
};

export const logger = {
  debug: (message: string, context?: unknown) => write('debug', message, context),
  info: (message: string, context?: unknown) => write('info', message, context),
  warn: (message: string, context?: unknown) => write('warn', message, context),
  error: (message: string, context?: unknown) => write('error', message, context),
};

export type Logger = typeof logger;
