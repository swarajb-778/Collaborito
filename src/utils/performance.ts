/**
 * Performance Monitoring Utility
 * 
 * Provides tools for measuring and tracking app performance metrics
 * including component render times, API call durations, and memory usage.
 */

import { createLogger } from './logger';

const logger = createLogger('Performance');

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'render' | 'api' | 'navigation' | 'database' | 'custom';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = __DEV__; // Only enable in development
  
  /**
   * Start timing a performance metric
   */
  start(name: string, category: PerformanceMetric['category'] = 'custom', metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      category,
      metadata
    };
    
    this.metrics.set(name, metric);
    logger.debug(`Performance tracking started: ${name}`);
  }
  
  /**
   * End timing a performance metric
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance metric not found: ${name}`);
      return null;
    }
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    this.logMetric(metric);
    this.metrics.delete(name);
    
    return metric.duration;
  }
  
  /**
   * Time a synchronous function execution
   */
  time<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'custom'): T {
    this.start(name, category);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }
  
  /**
   * Time an asynchronous function execution
   */
  async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    category: PerformanceMetric['category'] = 'custom'
  ): Promise<T> {
    this.start(name, category);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }
  
  /**
   * Measure API call performance
   */
  async measureApiCall<T>(
    name: string, 
    apiCall: () => Promise<T>, 
    metadata?: { method?: string; url?: string }
  ): Promise<T> {
    return this.timeAsync(name, apiCall, 'api');
  }
  
  /**
   * Measure database operation performance
   */
  async measureDatabaseOperation<T>(
    name: string, 
    dbOperation: () => Promise<T>
  ): Promise<T> {
    return this.timeAsync(name, dbOperation, 'database');
  }
  
  /**
   * Get memory usage information
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if (!this.isEnabled || typeof performance === 'undefined' || !performance.memory) {
      return null;
    }
    
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) // MB
    };
  }
  
  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.isEnabled) return;
    
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage) {
      logger.info(`Memory usage: ${memoryUsage.used}MB / ${memoryUsage.total}MB`);
    }
    
    logger.info(`Active performance metrics: ${this.metrics.size}`);
  }
  
  /**
   * Clear all active metrics
   */
  clear(): void {
    this.metrics.clear();
    logger.debug('Performance metrics cleared');
  }
  
  /**
   * Log a completed metric
   */
  private logMetric(metric: PerformanceMetric): void {
    const duration = metric.duration || 0;
    const category = metric.category.toUpperCase();
    
    // Color code based on performance thresholds
    let emoji = '⚡'; // Fast
    if (duration > 1000) emoji = '🔴'; // Slow
    else if (duration > 500) emoji = '🟡'; // Medium
    else if (duration > 100) emoji = '🟠'; // Caution
    
    logger.info(`${emoji} [${category}] ${metric.name}: ${duration.toFixed(2)}ms`);
    
    // Log detailed metadata if available
    if (metric.metadata) {
      logger.debug('Metadata:', metric.metadata);
    }
    
    // Warn about slow operations
    if (duration > 1000) {
      logger.warn(`Slow ${category.toLowerCase()} operation detected: ${metric.name} took ${duration.toFixed(2)}ms`);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component render performance
 */
export const usePerformanceMonitor = (componentName: string) => {
  if (!__DEV__) return { start: () => {}, end: () => {} };
  
  return {
    start: () => performanceMonitor.start(`${componentName}-render`, 'render'),
    end: () => performanceMonitor.end(`${componentName}-render`)
  };
};

/**
 * Higher-order component for automatic performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  if (!__DEV__) return WrappedComponent;
  
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceWrappedComponent = (props: P) => {
    const React = require('react');
    
    React.useEffect(() => {
      performanceMonitor.start(`${displayName}-mount`, 'render');
      return () => {
        performanceMonitor.end(`${displayName}-mount`);
      };
    }, []);
    
    return React.createElement(WrappedComponent, props);
  };
  
  PerformanceWrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceWrappedComponent;
};

/**
 * Performance monitoring decorators for methods
 */
export const measurePerformance = (
  category: PerformanceMetric['category'] = 'custom'
) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    if (!__DEV__) return descriptor;
    
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyName}`;
      return performanceMonitor.time(methodName, () => method.apply(this, args), category);
    };
    
    return descriptor;
  };
};

/**
 * Async performance monitoring decorator
 */
export const measureAsyncPerformance = (
  category: PerformanceMetric['category'] = 'custom'
) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    if (!__DEV__) return descriptor;
    
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyName}`;
      return performanceMonitor.timeAsync(methodName, () => method.apply(this, args), category);
    };
    
    return descriptor;
  };
};

// Export types for external use
export type { PerformanceMetric }; 
 