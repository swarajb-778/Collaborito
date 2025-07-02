/**
 * Logger Utility
 * 
 * A centralized logging utility that provides better debugging capabilities
 * with support for different log levels and environments.
 */
import { DEBUG } from '../constants/AppConfig';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private readonly namespace: string;
  private readonly isEnabled: boolean;
  private logLevel: LogLevel;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.isEnabled = DEBUG.ENABLED;
    this.logLevel = DEBUG.LOG_LEVEL as LogLevel;
  }

  /**
   * Determines if the specified log level should be logged
   * based on the current log level setting
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.logLevel];
  }

  /**
   * Format the log message with the namespace and timestamp
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.namespace}] ${message}`;
  }

  /**
   * Format error objects for better logging
   */
  private formatError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any) // Include additional error properties
      };
    }
    return error;
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log error level message
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const formattedArgs = args.map(arg => 
        arg instanceof Error ? this.formatError(arg) : arg
      );
      console.error(this.formatMessage(message), ...formattedArgs);
    }
  }

  /**
   * Log and time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    if (!this.shouldLog('debug')) {
      return fn();
    }

    console.time(this.formatMessage(label));
    try {
      return fn();
    } finally {
      console.timeEnd(this.formatMessage(label));
    }
  }

  /**
   * Log an async function execution time
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.shouldLog('debug')) {
      return await fn();
    }

    console.time(this.formatMessage(label));
    try {
      return await fn();
    } finally {
      console.timeEnd(this.formatMessage(label));
    }
  }

  /**
   * Log a table of data (useful for debugging)
   */
  table(data: any[], properties?: string[]): void {
    if (this.shouldLog('debug')) {
      console.info(this.formatMessage('Table data:'));
      if (properties) {
        console.table(data, properties);
      } else {
        console.table(data);
      }
    }
  }

  /**
   * Log a group of related messages
   */
  group(label: string, fn: () => void): void {
    if (this.shouldLog('debug')) {
      console.group(this.formatMessage(label));
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  }

  /**
   * Log success messages with green color in browser
   */
  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`✅ ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log API calls for debugging
   */
  api(method: string, url: string, data?: any, response?: any): void {
    if (this.shouldLog('debug')) {
      this.group(`API ${method} ${url}`, () => {
        if (data) this.debug('Request data:', data);
        if (response) this.debug('Response:', response);
      });
    }
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

// Default export for backward compatibility
export default createLogger; 