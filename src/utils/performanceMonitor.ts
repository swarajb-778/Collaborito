/**
 * Performance Monitor Utility
 * 
 * Lightweight performance monitoring for React Native app
 * Tracks component renders, navigation timing, and service calls
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'component' | 'navigation' | 'service' | 'network';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalMetrics: number;
  averageComponentRender: number;
  averageNavigation: number;
  averageServiceCall: number;
  slowestOperations: PerformanceMetric[];
  recommendations: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private readonly MAX_METRICS = 100; // Keep only last 100 metrics
  private readonly SLOW_THRESHOLD = 1000; // 1 second threshold for slow operations

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string, category: PerformanceMetric['category'], metadata?: Record<string, any>): void {
    const startTime = Date.now();
    this.activeTimers.set(name, startTime);

    // Store initial metric
    const metric: PerformanceMetric = {
      name,
      startTime,
      category,
      metadata
    };

    this.addMetric(metric);
  }

  /**
   * End timing an operation
   */
  endTimer(name: string): number | null {
    const endTime = Date.now();
    const startTime = this.activeTimers.get(name);

    if (!startTime) {
      console.warn(`PerformanceMonitor: Timer '${name}' was not started`);
      return null;
    }

    const duration = endTime - startTime;
    this.activeTimers.delete(name);

    // Update the metric with end time and duration
    const metricIndex = this.metrics.findIndex(m => m.name === name && m.startTime === startTime);
    if (metricIndex !== -1) {
      this.metrics[metricIndex].endTime = endTime;
      this.metrics[metricIndex].duration = duration;
    }

    // Log slow operations in development
    if (__DEV__ && duration > this.SLOW_THRESHOLD) {
      console.warn(`🐌 Slow operation detected: ${name} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Record a complete operation (when you already have the timing)
   */
  recordOperation(
    name: string, 
    duration: number, 
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    const now = Date.now();
    const metric: PerformanceMetric = {
      name,
      startTime: now - duration,
      endTime: now,
      duration,
      category,
      metadata
    };

    this.addMetric(metric);
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, props?: any): void {
    this.recordOperation(
      `${componentName} render`,
      renderTime,
      'component',
      { 
        componentName,
        propsCount: props ? Object.keys(props).length : 0,
        hasChildren: props?.children !== undefined
      }
    );
  }

  /**
   * Track navigation timing
   */
  trackNavigation(fromScreen: string, toScreen: string, duration: number): void {
    this.recordOperation(
      `Navigation: ${fromScreen} → ${toScreen}`,
      duration,
      'navigation',
      { fromScreen, toScreen }
    );
  }

  /**
   * Track service call performance
   */
  trackServiceCall(serviceName: string, methodName: string, duration: number, success: boolean): void {
    this.recordOperation(
      `${serviceName}.${methodName}`,
      duration,
      'service',
      { serviceName, methodName, success }
    );
  }

  /**
   * Track network request performance
   */
  trackNetworkRequest(url: string, method: string, duration: number, statusCode: number): void {
    this.recordOperation(
      `${method} ${url}`,
      duration,
      'network',
      { url, method, statusCode, success: statusCode >= 200 && statusCode < 300 }
    );
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    // Calculate averages by category
    const componentMetrics = completedMetrics.filter(m => m.category === 'component');
    const navigationMetrics = completedMetrics.filter(m => m.category === 'navigation');
    const serviceMetrics = completedMetrics.filter(m => m.category === 'service');

    const averageComponentRender = this.calculateAverage(componentMetrics);
    const averageNavigation = this.calculateAverage(navigationMetrics);
    const averageServiceCall = this.calculateAverage(serviceMetrics);

    // Find slowest operations
    const slowestOperations = completedMetrics
      .filter(m => (m.duration || 0) > this.SLOW_THRESHOLD)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      averageComponentRender,
      averageNavigation,
      averageServiceCall,
      slowestOperations
    );

    return {
      totalMetrics: completedMetrics.length,
      averageComponentRender,
      averageNavigation,
      averageServiceCall,
      slowestOperations,
      recommendations
    };
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.category === category && m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get current active timers (for debugging)
   */
  getActiveTimers(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return Math.round(total / metrics.length);
  }

  private generateRecommendations(
    avgComponent: number,
    avgNavigation: number,
    avgService: number,
    slowOperations: PerformanceMetric[]
  ): string[] {
    const recommendations: string[] = [];

    if (avgComponent > 100) {
      recommendations.push('Consider optimizing component renders with React.memo or useMemo');
    }

    if (avgNavigation > 500) {
      recommendations.push('Navigation seems slow - check for heavy computations during transitions');
    }

    if (avgService > 800) {
      recommendations.push('Service calls are taking too long - consider caching or optimization');
    }

    if (slowOperations.length > 0) {
      recommendations.push(`${slowOperations.length} slow operations detected - review these for optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Keep monitoring for any regressions.');
    }

    return recommendations;
  }
}

// Convenience functions for easy usage
export const performanceMonitor = PerformanceMonitor.getInstance();

export const withPerformanceTracking = <T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  category: PerformanceMetric['category'] = 'service'
): T => {
  return ((...args: any[]) => {
    performanceMonitor.startTimer(name, category);
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          performanceMonitor.endTimer(name);
        });
      }
      
      // Handle sync functions
      performanceMonitor.endTimer(name);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(name);
      throw error;
    }
  }) as T;
};

// React Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = Date.now();

  return {
    trackRender: (props?: any) => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime, props);
    }
  };
};

// Helper for tracking navigation
export const trackNavigation = (fromScreen: string, toScreen: string) => {
  const startTime = Date.now();
  
  return {
    complete: () => {
      const duration = Date.now() - startTime;
      performanceMonitor.trackNavigation(fromScreen, toScreen, duration);
    }
  };
};

export default performanceMonitor; 