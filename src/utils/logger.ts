/**
 * Logger Utility
 * 
 * A centralized logging utility that provides better debugging capabilities
 * with support for different log levels, environments, and performance tracking.
 */
import { DEBUG } from '../constants/AppConfig';

interface LogEntry {
  timestamp: string;
  namespace: string;
  level: LogLevel;
  message: string;
  args: any[];
}

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
  private static logHistory: LogEntry[] = [];
  private static readonly MAX_HISTORY = 100;

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
   * Add log entry to history for debugging purposes
   */
  private addToHistory(level: LogLevel, message: string, args: any[]): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      namespace: this.namespace,
      level,
      message,
      args: args.map(arg => arg instanceof Error ? this.formatError(arg) : arg)
    };

    Logger.logHistory.push(entry);
    
    // Keep only the last MAX_HISTORY entries
    if (Logger.logHistory.length > Logger.MAX_HISTORY) {
      Logger.logHistory = Logger.logHistory.slice(-Logger.MAX_HISTORY);
    }
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: any[]): void {
    this.addToHistory('debug', message, args);
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void {
    this.addToHistory('info', message, args);
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, ...args: any[]): void {
    this.addToHistory('warn', message, args);
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  /**
   * Log error level message
   */
  error(message: string, ...args: any[]): void {
    this.addToHistory('error', message, args);
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

  /**
   * Get recent log history (static method)
   */
  static getLogHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return Logger.logHistory.filter(entry => entry.level === level);
    }
    return [...Logger.logHistory];
  }

  /**
   * Clear log history (static method)
   */
  static clearHistory(): void {
    Logger.logHistory = [];
  }

  /**
   * Export logs for debugging (static method)
   */
  static exportLogs(): string {
    return JSON.stringify(Logger.logHistory, null, 2);
  }

  /**
   * Get log statistics (static method)
   */
  static getLogStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    Logger.logHistory.forEach(entry => {
      stats[entry.level]++;
    });

    return stats;
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