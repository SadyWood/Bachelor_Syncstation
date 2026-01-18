// packages/logger/src/index.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enabled: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getEnvironment(): 'development' | 'production' | 'test' {
  // Vite (frontend) - check for import.meta.env
  try {
    // @ts-expect-error import.meta.env may not exist in all environments
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
      // @ts-expect-error import.meta.env may not exist in all environments
      return import.meta.env.MODE as 'development' | 'production' | 'test';
    }
  } catch {
    // import.meta not available
  }

  // Node (backend)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV as 'development' | 'production' | 'test';
  }

  return 'development';
}

function getDefaultConfig(): LoggerConfig {
  const env = getEnvironment();

  let level: LogLevel;
  if (env === 'production') {
    level = 'error';
  } else if (env === 'test') {
    level = 'warn';
  } else {
    level = 'debug';
  }

  return {
    level,
    enabled: env !== 'production',
  };
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      ...getDefaultConfig(),
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    if (level === 'silent') return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private format(level: LogLevel, message: string): string {
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const timestamp = new Date().toISOString().slice(11, 23);
    return `${timestamp} ${prefix}[${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message), ...args);
    }
  }

  /** Create a child logger with a prefix */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /** Update logger configuration at runtime */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Singleton for app-wide logging
export const logger = new Logger();

// Factory for component-specific loggers
export function createLogger(prefix: string): Logger {
  return logger.child(prefix);
}

// Re-export Logger class for advanced usage
export { Logger };
