import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  componentRenderTime: number;
  imageLoadTime: number;
  compressionTime: number;
  uploadTime: number;
  cacheRetrievalTime: number;
  memoryUsage: number;
  networkLatency: number;
  frameDrops: number;
  timestamp: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'compression' | 'caching' | 'preloading' | 'memory' | 'network' | 'rendering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: string;
  priority: number;
  implemented: boolean;
  dateIdentified: number;
}

export interface PerformanceReport {
  overall: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  };
  metrics: {
    averageRenderTime: number;
    averageLoadTime: number;
    averageCompressionTime: number;
    averageUploadTime: number;
    cacheHitRate: number;
    compressionRatio: number;
    memoryEfficiency: number;
    networkEfficiency: number;
  };
  recommendations: OptimizationRecommendation[];
  trends: {
    performance: 'improving' | 'stable' | 'degrading';
    memoryUsage: 'improving' | 'stable' | 'degrading';
    networkUsage: 'improving' | 'stable' | 'degrading';
  };
  deviceInfo: {
    platform: string;
    screenSize: string;
    memoryClass: 'low' | 'medium' | 'high';
    networkClass: 'slow' | 'medium' | 'fast';
  };
}

export interface PerformanceThresholds {
  renderTime: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  loadTime: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  compressionTime: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  uploadTime: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  memoryUsage: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  cacheHitRate: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

class AvatarPerformanceMonitor {
  private static instance: AvatarPerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private readonly METRICS_KEY = 'avatar_performance_metrics';
  private readonly RECOMMENDATIONS_KEY = 'avatar_performance_recommendations';
  private readonly MAX_METRICS = 1000;
  private readonly ANALYSIS_INTERVAL = 30000; // 30 seconds
  private analysisTimer: NodeJS.Timeout | null = null;

  private thresholds: PerformanceThresholds = {
    renderTime: {
      excellent: 50,
      good: 100,
      fair: 200,
      poor: 500,
    },
    loadTime: {
      excellent: 200,
      good: 500,
      fair: 1000,
      poor: 2000,
    },
    compressionTime: {
      excellent: 500,
      good: 1000,
      fair: 2000,
      poor: 5000,
    },
    uploadTime: {
      excellent: 2000,
      good: 5000,
      fair: 10000,
      poor: 20000,
    },
    memoryUsage: {
      excellent: 10 * 1024 * 1024, // 10MB
      good: 25 * 1024 * 1024, // 25MB
      fair: 50 * 1024 * 1024, // 50MB
      poor: 100 * 1024 * 1024, // 100MB
    },
    cacheHitRate: {
      excellent: 0.9,
      good: 0.75,
      fair: 0.5,
      poor: 0.25,
    },
  };

  private constructor() {
    this.loadStoredMetrics();
    this.loadStoredRecommendations();
    this.startPerformanceAnalysis();
  }

  static getInstance(): AvatarPerformanceMonitor {
    if (!AvatarPerformanceMonitor.instance) {
      AvatarPerformanceMonitor.instance = new AvatarPerformanceMonitor();
    }
    return AvatarPerformanceMonitor.instance;
  }

  // Performance tracking methods
  recordRenderTime(componentName: string, renderTime: number): void {
    this.addMetric({
      componentRenderTime: renderTime,
      imageLoadTime: 0,
      compressionTime: 0,
      uploadTime: 0,
      cacheRetrievalTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: 0,
      frameDrops: 0,
      timestamp: Date.now(),
    });

    logger.info('Avatar render time recorded', {
      component: componentName,
      renderTime,
      threshold: this.thresholds.renderTime,
    });
  }

  recordImageLoadTime(imageUrl: string, loadTime: number, cacheHit: boolean): void {
    this.addMetric({
      componentRenderTime: 0,
      imageLoadTime: loadTime,
      compressionTime: 0,
      uploadTime: 0,
      cacheRetrievalTime: cacheHit ? loadTime : 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: cacheHit ? 0 : loadTime,
      frameDrops: 0,
      timestamp: Date.now(),
    });

    logger.info('Avatar image load time recorded', {
      imageUrl,
      loadTime,
      cacheHit,
      threshold: this.thresholds.loadTime,
    });
  }

  recordCompressionTime(originalSize: number, compressedSize: number, compressionTime: number): void {
    this.addMetric({
      componentRenderTime: 0,
      imageLoadTime: 0,
      compressionTime,
      uploadTime: 0,
      cacheRetrievalTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: 0,
      frameDrops: 0,
      timestamp: Date.now(),
    });

    logger.info('Avatar compression time recorded', {
      originalSize,
      compressedSize,
      compressionTime,
      ratio: compressedSize / originalSize,
      threshold: this.thresholds.compressionTime,
    });
  }

  recordUploadTime(fileSize: number, uploadTime: number, networkType?: string): void {
    this.addMetric({
      componentRenderTime: 0,
      imageLoadTime: 0,
      compressionTime: 0,
      uploadTime,
      cacheRetrievalTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: uploadTime,
      frameDrops: 0,
      timestamp: Date.now(),
    });

    logger.info('Avatar upload time recorded', {
      fileSize,
      uploadTime,
      networkType,
      speed: fileSize / (uploadTime / 1000), // bytes per second
      threshold: this.thresholds.uploadTime,
    });
  }

  recordFrameDrops(frameDrops: number): void {
    this.addMetric({
      componentRenderTime: 0,
      imageLoadTime: 0,
      compressionTime: 0,
      uploadTime: 0,
      cacheRetrievalTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: 0,
      frameDrops,
      timestamp: Date.now(),
    });

    logger.warn('Avatar frame drops recorded', {
      frameDrops,
      memoryUsage: this.getMemoryUsage(),
    });
  }

  // Performance analysis methods
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const recentMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000); // Last 24 hours
    
    if (recentMetrics.length === 0) {
      return this.getDefaultReport();
    }

    const aggregatedMetrics = this.aggregateMetrics(recentMetrics);
    const overallScore = this.calculateOverallScore(aggregatedMetrics);
    const recommendations = await this.generateRecommendations(aggregatedMetrics);
    const trends = this.analyzeTrends(recentMetrics);

    const report: PerformanceReport = {
      overall: {
        score: overallScore,
        grade: this.getGrade(overallScore),
        status: this.getStatus(overallScore),
      },
      metrics: aggregatedMetrics,
      recommendations,
      trends,
      deviceInfo: this.getDeviceInfo(),
    };

    logger.info('Performance report generated', {
      score: overallScore,
      grade: report.overall.grade,
      recommendationCount: recommendations.length,
    });

    return report;
  }

  private aggregateMetrics(metrics: PerformanceMetrics[]): PerformanceReport['metrics'] {
    const totalMetrics = metrics.length;
    
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.componentRenderTime, 0) / totalMetrics;
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.imageLoadTime, 0) / totalMetrics;
    const avgCompressionTime = metrics.reduce((sum, m) => sum + m.compressionTime, 0) / totalMetrics;
    const avgUploadTime = metrics.reduce((sum, m) => sum + m.uploadTime, 0) / totalMetrics;
    
    const cacheHits = metrics.filter(m => m.cacheRetrievalTime > 0).length;
    const cacheHitRate = cacheHits / totalMetrics;
    
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalMetrics;
    const avgNetworkLatency = metrics.reduce((sum, m) => sum + m.networkLatency, 0) / totalMetrics;

    return {
      averageRenderTime: avgRenderTime,
      averageLoadTime: avgLoadTime,
      averageCompressionTime: avgCompressionTime,
      averageUploadTime: avgUploadTime,
      cacheHitRate,
      compressionRatio: 0.7, // This would be calculated from actual compression data
      memoryEfficiency: this.calculateMemoryEfficiency(avgMemoryUsage),
      networkEfficiency: this.calculateNetworkEfficiency(avgNetworkLatency),
    };
  }

  private calculateOverallScore(metrics: PerformanceReport['metrics']): number {
    const renderScore = this.getMetricScore(metrics.averageRenderTime, this.thresholds.renderTime);
    const loadScore = this.getMetricScore(metrics.averageLoadTime, this.thresholds.loadTime);
    const compressionScore = this.getMetricScore(metrics.averageCompressionTime, this.thresholds.compressionTime);
    const uploadScore = this.getMetricScore(metrics.averageUploadTime, this.thresholds.uploadTime);
    const cacheScore = this.getMetricScore(metrics.cacheHitRate, this.thresholds.cacheHitRate, true);
    const memoryScore = this.getMetricScore(metrics.memoryEfficiency, { excellent: 90, good: 75, fair: 50, poor: 25 }, true);

    const weights = {
      render: 0.2,
      load: 0.2,
      compression: 0.15,
      upload: 0.15,
      cache: 0.15,
      memory: 0.15,
    };

    const weightedScore = 
      renderScore * weights.render +
      loadScore * weights.load +
      compressionScore * weights.compression +
      uploadScore * weights.upload +
      cacheScore * weights.cache +
      memoryScore * weights.memory;

    return Math.round(weightedScore);
  }

  private getMetricScore(value: number, thresholds: any, higherIsBetter: boolean = false): number {
    if (higherIsBetter) {
      if (value >= thresholds.excellent) return 100;
      if (value >= thresholds.good) return 80;
      if (value >= thresholds.fair) return 60;
      if (value >= thresholds.poor) return 40;
      return 20;
    } else {
      if (value <= thresholds.excellent) return 100;
      if (value <= thresholds.good) return 80;
      if (value <= thresholds.fair) return 60;
      if (value <= thresholds.poor) return 40;
      return 20;
    }
  }

  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  private async generateRecommendations(metrics: PerformanceReport['metrics']): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Render time recommendations
    if (metrics.averageRenderTime > this.thresholds.renderTime.good) {
      recommendations.push({
        id: 'render-optimization',
        type: 'rendering',
        severity: metrics.averageRenderTime > this.thresholds.renderTime.poor ? 'high' : 'medium',
        title: 'Optimize Component Rendering',
        description: `Average render time is ${metrics.averageRenderTime.toFixed(0)}ms, which exceeds the recommended threshold.`,
        impact: 'Users experience noticeable delays when avatars load',
        solution: 'Implement React.memo, useMemo, and useCallback to prevent unnecessary re-renders',
        estimatedImprovement: '30-50% reduction in render time',
        priority: 8,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    // Load time recommendations
    if (metrics.averageLoadTime > this.thresholds.loadTime.good) {
      recommendations.push({
        id: 'load-optimization',
        type: 'caching',
        severity: metrics.averageLoadTime > this.thresholds.loadTime.poor ? 'high' : 'medium',
        title: 'Improve Image Loading Performance',
        description: `Average load time is ${metrics.averageLoadTime.toFixed(0)}ms, which is slower than optimal.`,
        impact: 'Avatars take too long to appear, hurting user experience',
        solution: 'Implement image preloading, better caching strategies, and optimized image formats',
        estimatedImprovement: '40-60% reduction in load time',
        priority: 9,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    // Cache hit rate recommendations
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate.good) {
      recommendations.push({
        id: 'cache-optimization',
        type: 'caching',
        severity: metrics.cacheHitRate < this.thresholds.cacheHitRate.poor ? 'high' : 'medium',
        title: 'Improve Cache Hit Rate',
        description: `Cache hit rate is ${(metrics.cacheHitRate * 100).toFixed(1)}%, which is below optimal.`,
        impact: 'Increased network usage and slower load times',
        solution: 'Implement smarter preloading, increase cache duration, and improve cache invalidation',
        estimatedImprovement: '25-40% improvement in cache hit rate',
        priority: 7,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    // Memory efficiency recommendations
    if (metrics.memoryEfficiency < 70) {
      recommendations.push({
        id: 'memory-optimization',
        type: 'memory',
        severity: metrics.memoryEfficiency < 50 ? 'high' : 'medium',
        title: 'Optimize Memory Usage',
        description: `Memory efficiency is ${metrics.memoryEfficiency.toFixed(1)}%, indicating high memory usage.`,
        impact: 'Potential app crashes on low-memory devices',
        solution: 'Implement better image cleanup, reduce cache size, and optimize image processing',
        estimatedImprovement: '20-35% reduction in memory usage',
        priority: 6,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    // Compression time recommendations
    if (metrics.averageCompressionTime > this.thresholds.compressionTime.good) {
      recommendations.push({
        id: 'compression-optimization',
        type: 'compression',
        severity: metrics.averageCompressionTime > this.thresholds.compressionTime.poor ? 'high' : 'medium',
        title: 'Optimize Image Compression',
        description: `Average compression time is ${metrics.averageCompressionTime.toFixed(0)}ms, which is slower than optimal.`,
        impact: 'Delayed uploads and poor user experience',
        solution: 'Use more efficient compression algorithms, implement background compression, or reduce compression quality',
        estimatedImprovement: '30-50% reduction in compression time',
        priority: 5,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    // Upload time recommendations
    if (metrics.averageUploadTime > this.thresholds.uploadTime.good) {
      recommendations.push({
        id: 'upload-optimization',
        type: 'network',
        severity: metrics.averageUploadTime > this.thresholds.uploadTime.poor ? 'high' : 'medium',
        title: 'Optimize Upload Performance',
        description: `Average upload time is ${(metrics.averageUploadTime / 1000).toFixed(1)}s, which is slower than optimal.`,
        impact: 'Users wait too long for uploads to complete',
        solution: 'Implement chunked uploads, retry logic, and better compression before upload',
        estimatedImprovement: '25-40% reduction in upload time',
        priority: 4,
        implemented: false,
        dateIdentified: Date.now(),
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private analyzeTrends(metrics: PerformanceMetrics[]): PerformanceReport['trends'] {
    const halfPoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, halfPoint);
    const secondHalf = metrics.slice(halfPoint);

    const firstHalfAvg = this.calculateAveragePerformance(firstHalf);
    const secondHalfAvg = this.calculateAveragePerformance(secondHalf);

    return {
      performance: this.getTrend(firstHalfAvg.performance, secondHalfAvg.performance),
      memoryUsage: this.getTrend(firstHalfAvg.memory, secondHalfAvg.memory, true),
      networkUsage: this.getTrend(firstHalfAvg.network, secondHalfAvg.network, true),
    };
  }

  private calculateAveragePerformance(metrics: PerformanceMetrics[]): {
    performance: number;
    memory: number;
    network: number;
  } {
    const total = metrics.length;
    return {
      performance: metrics.reduce((sum, m) => sum + m.componentRenderTime + m.imageLoadTime, 0) / total,
      memory: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / total,
      network: metrics.reduce((sum, m) => sum + m.networkLatency, 0) / total,
    };
  }

  private getTrend(before: number, after: number, lowerIsBetter: boolean = false): 'improving' | 'stable' | 'degrading' {
    const threshold = 0.05; // 5% threshold
    const change = (after - before) / before;

    if (Math.abs(change) < threshold) {
      return 'stable';
    }

    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'degrading';
    } else {
      return change > 0 ? 'improving' : 'degrading';
    }
  }

  private getDeviceInfo(): PerformanceReport['deviceInfo'] {
    const { width, height } = Dimensions.get('window');
    const screenSize = `${width}x${height}`;
    
    return {
      platform: Platform.OS,
      screenSize,
      memoryClass: this.getMemoryClass(),
      networkClass: this.getNetworkClass(),
    };
  }

  private getMemoryClass(): 'low' | 'medium' | 'high' {
    // This is a simplified estimation - in a real app, you'd use more sophisticated detection
    const { width, height } = Dimensions.get('window');
    const pixels = width * height;
    
    if (pixels < 1000000) return 'low'; // < 1M pixels
    if (pixels < 2000000) return 'medium'; // < 2M pixels
    return 'high';
  }

  private getNetworkClass(): 'slow' | 'medium' | 'fast' {
    // This would be determined by actual network measurements
    const recentMetrics = this.getRecentMetrics(60 * 1000); // Last minute
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.networkLatency, 0) / recentMetrics.length;
    
    if (avgLatency > 2000) return 'slow';
    if (avgLatency > 500) return 'medium';
    return 'fast';
  }

  private calculateMemoryEfficiency(avgMemoryUsage: number): number {
    const maxMemory = 100 * 1024 * 1024; // 100MB max
    return Math.max(0, Math.min(100, (1 - avgMemoryUsage / maxMemory) * 100));
  }

  private calculateNetworkEfficiency(avgLatency: number): number {
    const maxLatency = 5000; // 5 seconds max
    return Math.max(0, Math.min(100, (1 - avgLatency / maxLatency) * 100));
  }

  private getDefaultReport(): PerformanceReport {
    return {
      overall: {
        score: 0,
        grade: 'F',
        status: 'critical',
      },
      metrics: {
        averageRenderTime: 0,
        averageLoadTime: 0,
        averageCompressionTime: 0,
        averageUploadTime: 0,
        cacheHitRate: 0,
        compressionRatio: 0,
        memoryEfficiency: 0,
        networkEfficiency: 0,
      },
      recommendations: [],
      trends: {
        performance: 'stable',
        memoryUsage: 'stable',
        networkUsage: 'stable',
      },
      deviceInfo: this.getDeviceInfo(),
    };
  }

  // Utility methods
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    this.saveMetrics();
  }

  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  private getMemoryUsage(): number {
    // This is a simplified estimation
    // In a real app, you'd use platform-specific APIs
    return Math.random() * 50 * 1024 * 1024; // Random value between 0-50MB
  }

  private startPerformanceAnalysis(): void {
    this.analysisTimer = setInterval(async () => {
      const report = await this.generatePerformanceReport();
      
      if (report.overall.score < 70) {
        logger.warn('Avatar performance below threshold', {
          score: report.overall.score,
          grade: report.overall.grade,
          recommendations: report.recommendations.length,
        });
      }
    }, this.ANALYSIS_INTERVAL);
  }

  // Data management methods
  async getMetrics(): Promise<PerformanceMetrics[]> {
    return this.metrics;
  }

  async getRecommendations(): Promise<OptimizationRecommendation[]> {
    return this.recommendations;
  }

  async clearMetrics(): Promise<void> {
    this.metrics = [];
    this.recommendations = [];
    await AsyncStorage.removeItem(this.METRICS_KEY);
    await AsyncStorage.removeItem(this.RECOMMENDATIONS_KEY);
  }

  async exportPerformanceData(): Promise<string> {
    const report = await this.generatePerformanceReport();
    return JSON.stringify({
      report,
      metrics: this.metrics,
      recommendations: this.recommendations,
      exportTimestamp: Date.now(),
    }, null, 2);
  }

  // Storage methods
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      logger.error('Failed to save performance metrics', error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.RECOMMENDATIONS_KEY, JSON.stringify(this.recommendations));
    } catch (error) {
      logger.error('Failed to save performance recommendations', error);
    }
  }

  private async loadStoredMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.METRICS_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load performance metrics', error);
    }
  }

  private async loadStoredRecommendations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.RECOMMENDATIONS_KEY);
      if (stored) {
        this.recommendations = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load performance recommendations', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
  }
}

export default AvatarPerformanceMonitor; 