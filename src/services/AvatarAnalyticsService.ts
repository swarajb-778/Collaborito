import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('AvatarAnalyticsService');

export interface AvatarAnalyticsEvent {
  event: string;
  userId: string;
  timestamp: number;
  properties: Record<string, any>;
  sessionId: string;
}

export interface AvatarUploadMetrics {
  uploadStartTime: number;
  uploadEndTime: number;
  fileSize: number;
  compressionRatio: number;
  uploadDuration: number;
  errorCount: number;
  retryCount: number;
  compressionTime: number;
  uploadSpeed: number; // bytes per second
}

export interface AvatarUsageMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadTime: number;
  averageFileSize: number;
  averageCompressionRatio: number;
  cacheHitRate: number;
  errorRate: number;
  mostCommonErrors: Record<string, number>;
  usageByTimeOfDay: Record<string, number>;
  usageByDayOfWeek: Record<string, number>;
}

export interface AvatarPerformanceMetrics {
  componentRenderTime: number;
  imageLoadTime: number;
  cacheRetrievalTime: number;
  compressionPerformance: number;
  memoryUsage: number;
  networkLatency: number;
}

class AvatarAnalyticsService {
  private static instance: AvatarAnalyticsService;
  private sessionId: string;
  private analytics: AvatarAnalyticsEvent[] = [];
  private metrics: AvatarUsageMetrics | null = null;
  private readonly ANALYTICS_KEY = 'avatar_analytics';
  private readonly METRICS_KEY = 'avatar_metrics';
  private readonly MAX_EVENTS = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredAnalytics();
    this.loadStoredMetrics();
  }

  static getInstance(): AvatarAnalyticsService {
    if (!AvatarAnalyticsService.instance) {
      AvatarAnalyticsService.instance = new AvatarAnalyticsService();
    }
    return AvatarAnalyticsService.instance;
  }

  // Event tracking methods
  trackAvatarUploadStarted(userId: string, fileSize: number) {
    this.trackEvent('avatar_upload_started', userId, {
      fileSize,
      source: 'user_initiated',
    });
  }

  trackAvatarUploadCompleted(userId: string, metrics: AvatarUploadMetrics) {
    this.trackEvent('avatar_upload_completed', userId, {
      ...metrics,
      success: true,
    });
    
    this.updateUsageMetrics({
      uploadDuration: metrics.uploadDuration,
      fileSize: metrics.fileSize,
      compressionRatio: metrics.compressionRatio,
      success: true,
    });
  }

  trackAvatarUploadFailed(userId: string, error: string, retryCount: number) {
    this.trackEvent('avatar_upload_failed', userId, {
      error,
      retryCount,
      success: false,
    });

    this.updateUsageMetrics({
      success: false,
      error,
    });
  }

  trackAvatarView(userId: string, avatarId: string, loadTime: number) {
    this.trackEvent('avatar_viewed', userId, {
      avatarId,
      loadTime,
      source: 'cache_or_network',
    });
  }

  trackAvatarCacheHit(userId: string, avatarId: string, retrievalTime: number) {
    this.trackEvent('avatar_cache_hit', userId, {
      avatarId,
      retrievalTime,
      cacheType: 'local_storage',
    });
  }

  trackAvatarCacheMiss(userId: string, avatarId: string) {
    this.trackEvent('avatar_cache_miss', userId, {
      avatarId,
      requiresNetworkFetch: true,
    });
  }

  trackAvatarCompressionPerformance(userId: string, metrics: {
    originalSize: number;
    compressedSize: number;
    compressionTime: number;
    compressionRatio: number;
  }) {
    this.trackEvent('avatar_compression_performance', userId, metrics);
  }

  trackAvatarError(userId: string, error: string, component: string) {
    this.trackEvent('avatar_error', userId, {
      error,
      component,
      severity: 'error',
    });
  }

  trackAvatarComponentRender(userId: string, component: string, renderTime: number) {
    this.trackEvent('avatar_component_render', userId, {
      component,
      renderTime,
      performance: renderTime < 100 ? 'good' : renderTime < 300 ? 'fair' : 'poor',
    });
  }

  // Performance tracking
  trackPerformanceMetrics(metrics: AvatarPerformanceMetrics) {
    this.trackEvent('avatar_performance_metrics', 'system', {
      ...metrics,
      timestamp: Date.now(),
    });
  }

  // Usage patterns
  trackUsagePattern(userId: string, pattern: string, data: Record<string, any>) {
    this.trackEvent('avatar_usage_pattern', userId, {
      pattern,
      ...data,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    });
  }

  // Core tracking method
  private trackEvent(event: string, userId: string, properties: Record<string, any>) {
    const analyticsEvent: AvatarAnalyticsEvent = {
      event,
      userId,
      timestamp: Date.now(),
      properties,
      sessionId: this.sessionId,
    };

    this.analytics.push(analyticsEvent);

    // Limit stored events to prevent memory issues
    if (this.analytics.length > this.MAX_EVENTS) {
      this.analytics = this.analytics.slice(-this.MAX_EVENTS);
    }

    // Store to AsyncStorage
    this.saveAnalytics();

    // Log for debugging
    logger.info('Avatar analytics event', {
      event,
      userId,
      properties,
      sessionId: this.sessionId,
    });
  }

  // Metrics calculation and storage
  private updateUsageMetrics(data: {
    uploadDuration?: number;
    fileSize?: number;
    compressionRatio?: number;
    success: boolean;
    error?: string;
  }) {
    if (!this.metrics) {
      this.metrics = {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        averageUploadTime: 0,
        averageFileSize: 0,
        averageCompressionRatio: 0,
        cacheHitRate: 0,
        errorRate: 0,
        mostCommonErrors: {},
        usageByTimeOfDay: {},
        usageByDayOfWeek: {},
      };
    }

    this.metrics.totalUploads++;

    if (data.success) {
      this.metrics.successfulUploads++;
      
      if (data.uploadDuration) {
        this.metrics.averageUploadTime = 
          (this.metrics.averageUploadTime * (this.metrics.successfulUploads - 1) + data.uploadDuration) 
          / this.metrics.successfulUploads;
      }

      if (data.fileSize) {
        this.metrics.averageFileSize = 
          (this.metrics.averageFileSize * (this.metrics.successfulUploads - 1) + data.fileSize) 
          / this.metrics.successfulUploads;
      }

      if (data.compressionRatio) {
        this.metrics.averageCompressionRatio = 
          (this.metrics.averageCompressionRatio * (this.metrics.successfulUploads - 1) + data.compressionRatio) 
          / this.metrics.successfulUploads;
      }
    } else {
      this.metrics.failedUploads++;
      
      if (data.error) {
        this.metrics.mostCommonErrors[data.error] = 
          (this.metrics.mostCommonErrors[data.error] || 0) + 1;
      }
    }

    // Update time-based usage patterns
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    this.metrics.usageByTimeOfDay[hour] = (this.metrics.usageByTimeOfDay[hour] || 0) + 1;
    this.metrics.usageByDayOfWeek[day] = (this.metrics.usageByDayOfWeek[day] || 0) + 1;

    // Calculate error rate
    this.metrics.errorRate = this.metrics.failedUploads / this.metrics.totalUploads;

    this.saveMetrics();
  }

  // Data retrieval methods
  async getAnalytics(): Promise<AvatarAnalyticsEvent[]> {
    return this.analytics;
  }

  async getMetrics(): Promise<AvatarUsageMetrics | null> {
    return this.metrics;
  }

  async getEventsByType(eventType: string): Promise<AvatarAnalyticsEvent[]> {
    return this.analytics.filter(event => event.event === eventType);
  }

  async getAnalyticsForUser(userId: string): Promise<AvatarAnalyticsEvent[]> {
    return this.analytics.filter(event => event.userId === userId);
  }

  async getAnalyticsForDateRange(startDate: Date, endDate: Date): Promise<AvatarAnalyticsEvent[]> {
    return this.analytics.filter(event => 
      event.timestamp >= startDate.getTime() && 
      event.timestamp <= endDate.getTime()
    );
  }

  // Performance insights
  async getPerformanceInsights(): Promise<{
    averageUploadTime: number;
    averageRenderTime: number;
    cacheEfficiency: number;
    errorRate: number;
    compressionEfficiency: number;
    recommendations: string[];
  }> {
    const uploadEvents = await this.getEventsByType('avatar_upload_completed');
    const renderEvents = await this.getEventsByType('avatar_component_render');
    const cacheHits = await this.getEventsByType('avatar_cache_hit');
    const cacheMisses = await this.getEventsByType('avatar_cache_miss');

    const avgUploadTime = uploadEvents.length > 0 
      ? uploadEvents.reduce((sum, event) => sum + event.properties.uploadDuration, 0) / uploadEvents.length
      : 0;

    const avgRenderTime = renderEvents.length > 0
      ? renderEvents.reduce((sum, event) => sum + event.properties.renderTime, 0) / renderEvents.length
      : 0;

    const cacheEfficiency = (cacheHits.length + cacheMisses.length) > 0
      ? cacheHits.length / (cacheHits.length + cacheMisses.length)
      : 0;

    const recommendations: string[] = [];

    if (avgUploadTime > 5000) {
      recommendations.push('Consider implementing background uploads for large files');
    }

    if (avgRenderTime > 100) {
      recommendations.push('Optimize component rendering with memoization');
    }

    if (cacheEfficiency < 0.8) {
      recommendations.push('Improve cache strategy for better performance');
    }

    if (this.metrics && this.metrics.errorRate > 0.1) {
      recommendations.push('Address common upload errors to improve reliability');
    }

    return {
      averageUploadTime: avgUploadTime,
      averageRenderTime: avgRenderTime,
      cacheEfficiency,
      errorRate: this.metrics?.errorRate || 0,
      compressionEfficiency: this.metrics?.averageCompressionRatio || 0,
      recommendations,
    };
  }

  // Data management
  async clearAnalytics(): Promise<void> {
    this.analytics = [];
    this.metrics = null;
    await AsyncStorage.removeItem(this.ANALYTICS_KEY);
    await AsyncStorage.removeItem(this.METRICS_KEY);
  }

  async exportAnalytics(): Promise<string> {
    const data = {
      analytics: this.analytics,
      metrics: this.metrics,
      sessionId: this.sessionId,
      exportTimestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  // Private helper methods
  private generateSessionId(): string {
    return `avatar_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveAnalytics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(this.analytics));
    } catch (error) {
      logger.error('Failed to save avatar analytics', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      logger.error('Failed to save avatar metrics', error);
    }
  }

  private async loadStoredAnalytics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.ANALYTICS_KEY);
      if (stored) {
        this.analytics = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load avatar analytics', error);
    }
  }

  private async loadStoredMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.METRICS_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load avatar metrics', error);
    }
  }
}

export default AvatarAnalyticsService; 