/**
 * @file lib/logger.ts
 * @description Lightweight structured logger shared across server and client code.
 *
 * Goals:
 * - Single sink for all application logging (replaces ad-hoc console.* calls).
 * - Level-based filtering controlled by the `LOG_LEVEL` env var.
 * - Structured JSON output in production (machine-parseable for App Insights,
 *   Datadog, Loki, etc.) and readable, contextual output in development.
 * - Carries an optional structured `context` object on every entry so callers
 *   can attach a requestId and other correlation fields.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Order creation failed', { requestId, message: err.message });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

/** Numeric severities used for level filtering. Higher = more severe. */
const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Resolves the minimum severity to emit from the `LOG_LEVEL` env var.
 * Defaults to `debug` in development and `info` everywhere else.
 */
function resolveMinSeverity(): number {
  const configured = (process.env.LOG_LEVEL || '').toLowerCase() as LogLevel;
  if (configured in LEVEL_SEVERITY) {
    return LEVEL_SEVERITY[configured];
  }
  return process.env.NODE_ENV === 'development'
    ? LEVEL_SEVERITY.debug
    : LEVEL_SEVERITY.info;
}

/** A single structured log entry. */
export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
}

/**
 * Emits a structured log entry, honoring the configured minimum level.
 *
 * In production, the entry is serialized to a single JSON line so log
 * aggregators can parse it. In development, a readable prefix is used and the
 * context object is passed through for inspection in the console.
 */
function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_SEVERITY[level] < resolveMinSeverity()) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const sink =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;

  if (process.env.NODE_ENV === 'production') {
    sink(JSON.stringify(entry));
  } else {
    sink(`[${level.toUpperCase()}] ${message}`, context ?? {});
  }
}

/**
 * Application logger. Prefer this over direct `console.*` calls so that output
 * is consistently structured, level-filtered, and ready for aggregation.
 */
export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};
