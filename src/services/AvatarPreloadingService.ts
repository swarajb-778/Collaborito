import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { createLogger } from '../utils/logger';
import { supabase } from './supabase';

const logger = createLogger('AvatarPreloadingService');

export interface PreloadRequest {
  userId: string;
  avatarUrl: string;
  priority: 'high' | 'medium' | 'low';
  context: 'profile' | 'team' | 'chat' | 'list' | 'suggestion';
  timestamp: number;
}

export interface PreloadResult {
  userId: string;
  avatarUrl: string;
  success: boolean;
  loadTime: number;
  cacheHit: boolean;
  errorMessage?: string;
  fileSize?: number;
}

export interface PreloadStats {
  totalRequests: number;
  successfulPreloads: number;
  failedPreloads: number;
  averageLoadTime: number;
  cacheHitRate: number;
  totalDataSaved: number;
  lastPreloadTime: number;
}

interface PreloadQueue {
  high: PreloadRequest[];
  medium: PreloadRequest[];
  low: PreloadRequest[];
}

class AvatarPreloadingService {
  private static instance: AvatarPreloadingService;
  private queue: PreloadQueue = { high: [], medium: [], low: [] };
  private preloadedUrls = new Set<string>();
  private preloadingUrls = new Set<string>();
  private stats: PreloadStats;
  private readonly PRELOAD_STATS_KEY = 'avatar_preload_stats';
  private readonly PRELOAD_CACHE_KEY = 'avatar_preload_cache';
  private readonly MAX_CONCURRENT_PRELOADS = 3;
  private readonly PRELOAD_TIMEOUT = 10000; // 10 seconds
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.stats = {
      totalRequests: 0,
      successfulPreloads: 0,
      failedPreloads: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalDataSaved: 0,
      lastPreloadTime: 0,
    };
    
    this.loadStoredStats();
    this.loadPreloadCache();
    this.startPreloadWorker();
  }

  static getInstance(): AvatarPreloadingService {
    if (!AvatarPreloadingService.instance) {
      AvatarPreloadingService.instance = new AvatarPreloadingService();
    }
    return AvatarPreloadingService.instance;
  }

  // Main preload methods
  async preloadAvatar(
    userId: string,
    avatarUrl: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    context: 'profile' | 'team' | 'chat' | 'list' | 'suggestion' = 'profile'
  ): Promise<void> {
    // Skip if already preloaded or currently preloading
    if (this.preloadedUrls.has(avatarUrl) || this.preloadingUrls.has(avatarUrl)) {
      logger.info('Avatar preload skipped - already cached or in progress', {
        userId,
        avatarUrl,
        priority,
        context,
      });
      return;
    }

    const request: PreloadRequest = {
      userId,
      avatarUrl,
      priority,
      context,
      timestamp: Date.now(),
    };

    this.queue[priority].push(request);
    this.stats.totalRequests++;

    logger.info('Avatar preload queued', {
      userId,
      avatarUrl,
      priority,
      context,
      queueLength: this.getQueueLength(),
    });

    this.saveStats();
  }

  async preloadAvatarList(
    userAvatars: Array<{ userId: string; avatarUrl: string }>,
    priority: 'high' | 'medium' | 'low' = 'medium',
    context: 'team' | 'chat' | 'list' | 'suggestion' = 'list'
  ): Promise<void> {
    const promises = userAvatars.map(({ userId, avatarUrl }) =>
      this.preloadAvatar(userId, avatarUrl, priority, context)
    );

    await Promise.all(promises);

    logger.info('Avatar list preload queued', {
      count: userAvatars.length,
      priority,
      context,
    });
  }

  async preloadTeamAvatars(teamId: string): Promise<void> {
    try {
      // Fetch team members' avatars from database
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('user_id, users(avatar_url)')
        .eq('team_id', teamId)
        .limit(20); // Limit to prevent excessive preloading

      if (error) {
        logger.error('Failed to fetch team members for preloading', error);
        return;
      }

      const userAvatars = teamMembers
        ?.filter(member => member.users?.avatar_url)
        .map(member => ({
          userId: member.user_id,
          avatarUrl: member.users.avatar_url,
        })) || [];

      if (userAvatars.length > 0) {
        await this.preloadAvatarList(userAvatars, 'high', 'team');
        logger.info('Team avatars queued for preloading', {
          teamId,
          count: userAvatars.length,
        });
      }
    } catch (error) {
      logger.error('Error preloading team avatars', { teamId, error });
    }
  }

  async preloadFrequentlyViewedAvatars(): Promise<void> {
    try {
      // Get frequently viewed avatars from usage analytics
      const cachedUsage = await AsyncStorage.getItem('avatar_usage_patterns');
      if (!cachedUsage) return;

      const usagePatterns = JSON.parse(cachedUsage);
      const frequentAvatars = usagePatterns
        .filter((pattern: any) => pattern.viewCount > 5) // Threshold for frequent viewing
        .sort((a: any, b: any) => b.viewCount - a.viewCount)
        .slice(0, 10); // Top 10 most viewed

      const userAvatars = frequentAvatars.map((pattern: any) => ({
        userId: pattern.userId,
        avatarUrl: pattern.avatarUrl,
      }));

      if (userAvatars.length > 0) {
        await this.preloadAvatarList(userAvatars, 'medium', 'suggestion');
        logger.info('Frequently viewed avatars queued for preloading', {
          count: userAvatars.length,
        });
      }
    } catch (error) {
      logger.error('Error preloading frequently viewed avatars', error);
    }
  }

  // Smart preloading based on user behavior
  async preloadBasedOnContext(
    currentUserId: string,
    context: 'profile_screen' | 'team_screen' | 'chat_screen' | 'project_screen'
  ): Promise<void> {
    switch (context) {
      case 'profile_screen':
        // Preload user's connections/friends
        await this.preloadUserConnections(currentUserId);
        break;
      
      case 'team_screen':
        // Preload all team members
        await this.preloadCurrentTeamMembers(currentUserId);
        break;
      
      case 'chat_screen':
        // Preload recent chat participants
        await this.preloadRecentChatParticipants(currentUserId);
        break;
      
      case 'project_screen':
        // Preload project collaborators
        await this.preloadProjectCollaborators(currentUserId);
        break;
    }
  }

  // Preload worker
  private async startPreloadWorker(): Promise<void> {
    setInterval(async () => {
      await this.processPreloadQueue();
    }, 1000); // Check queue every second
  }

  private async processPreloadQueue(): Promise<void> {
    const concurrentPreloads = this.preloadingUrls.size;
    
    if (concurrentPreloads >= this.MAX_CONCURRENT_PRELOADS) {
      return; // Already at max concurrent preloads
    }

    // Process high priority first, then medium, then low
    const request = this.getNextPreloadRequest();
    if (!request) {
      return; // No requests in queue
    }

    await this.executePreload(request);
  }

  private getNextPreloadRequest(): PreloadRequest | null {
    if (this.queue.high.length > 0) {
      return this.queue.high.shift()!;
    }
    if (this.queue.medium.length > 0) {
      return this.queue.medium.shift()!;
    }
    if (this.queue.low.length > 0) {
      return this.queue.low.shift()!;
    }
    return null;
  }

  private async executePreload(request: PreloadRequest): Promise<void> {
    const { userId, avatarUrl, priority, context } = request;
    const startTime = Date.now();

    this.preloadingUrls.add(avatarUrl);

    try {
      await this.preloadImageWithTimeout(avatarUrl, this.PRELOAD_TIMEOUT);
      
      const loadTime = Date.now() - startTime;
      this.preloadedUrls.add(avatarUrl);
      this.stats.successfulPreloads++;
      this.stats.averageLoadTime = 
        (this.stats.averageLoadTime * (this.stats.successfulPreloads - 1) + loadTime) 
        / this.stats.successfulPreloads;

      const result: PreloadResult = {
        userId,
        avatarUrl,
        success: true,
        loadTime,
        cacheHit: false,
      };

      logger.info('Avatar preload successful', {
        userId,
        avatarUrl,
        priority,
        context,
        loadTime,
      });

      await this.storePreloadResult(result);

    } catch (error) {
      this.stats.failedPreloads++;
      
      const result: PreloadResult = {
        userId,
        avatarUrl,
        success: false,
        loadTime: Date.now() - startTime,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      logger.error('Avatar preload failed', {
        userId,
        avatarUrl,
        priority,
        context,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await this.storePreloadResult(result);
    } finally {
      this.preloadingUrls.delete(avatarUrl);
      this.stats.lastPreloadTime = Date.now();
      this.saveStats();
    }
  }

  private async preloadImageWithTimeout(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Preload timeout'));
      }, timeout);

      Image.prefetch(url)
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Context-specific preloading methods
  private async preloadUserConnections(userId: string): Promise<void> {
    try {
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select('connected_user_id, users(avatar_url)')
        .eq('user_id', userId)
        .limit(10);

      if (error) {
        logger.error('Failed to fetch user connections for preloading', error);
        return;
      }

      const userAvatars = connections
        ?.filter(conn => conn.users?.avatar_url)
        .map(conn => ({
          userId: conn.connected_user_id,
          avatarUrl: conn.users.avatar_url,
        })) || [];

      if (userAvatars.length > 0) {
        await this.preloadAvatarList(userAvatars, 'medium', 'suggestion');
      }
    } catch (error) {
      logger.error('Error preloading user connections', { userId, error });
    }
  }

  private async preloadCurrentTeamMembers(userId: string): Promise<void> {
    try {
      const { data: userTeams, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (error || !userTeams?.length) {
        logger.error('Failed to fetch user teams for preloading', error);
        return;
      }

      // Preload avatars for all teams the user is part of
      const preloadPromises = userTeams.map(team => 
        this.preloadTeamAvatars(team.team_id)
      );

      await Promise.all(preloadPromises);
    } catch (error) {
      logger.error('Error preloading team members', { userId, error });
    }
  }

  private async preloadRecentChatParticipants(userId: string): Promise<void> {
    try {
      const { data: chatParticipants, error } = await supabase
        .from('chat_participants')
        .select('participant_id, users(avatar_url)')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('Failed to fetch chat participants for preloading', error);
        return;
      }

      const userAvatars = chatParticipants
        ?.filter(participant => participant.users?.avatar_url)
        .map(participant => ({
          userId: participant.participant_id,
          avatarUrl: participant.users.avatar_url,
        })) || [];

      if (userAvatars.length > 0) {
        await this.preloadAvatarList(userAvatars, 'high', 'chat');
      }
    } catch (error) {
      logger.error('Error preloading chat participants', { userId, error });
    }
  }

  private async preloadProjectCollaborators(userId: string): Promise<void> {
    try {
      const { data: projectMembers, error } = await supabase
        .from('project_members')
        .select('user_id, users(avatar_url)')
        .in('project_id', (
          await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', userId)
        ).data?.map(p => p.project_id) || [])
        .limit(30);

      if (error) {
        logger.error('Failed to fetch project collaborators for preloading', error);
        return;
      }

      const userAvatars = projectMembers
        ?.filter(member => member.users?.avatar_url && member.user_id !== userId)
        .map(member => ({
          userId: member.user_id,
          avatarUrl: member.users.avatar_url,
        })) || [];

      if (userAvatars.length > 0) {
        await this.preloadAvatarList(userAvatars, 'medium', 'list');
      }
    } catch (error) {
      logger.error('Error preloading project collaborators', { userId, error });
    }
  }

  // Statistics and management
  async getPreloadStats(): Promise<PreloadStats> {
    return this.stats;
  }

  async clearPreloadCache(): Promise<void> {
    this.preloadedUrls.clear();
    this.preloadingUrls.clear();
    this.queue = { high: [], medium: [], low: [] };
    
    await AsyncStorage.removeItem(this.PRELOAD_CACHE_KEY);
    await AsyncStorage.removeItem(this.PRELOAD_STATS_KEY);
    
    this.stats = {
      totalRequests: 0,
      successfulPreloads: 0,
      failedPreloads: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalDataSaved: 0,
      lastPreloadTime: 0,
    };

    logger.info('Avatar preload cache cleared');
  }

  getQueueLength(): number {
    return this.queue.high.length + this.queue.medium.length + this.queue.low.length;
  }

  getPreloadedCount(): number {
    return this.preloadedUrls.size;
  }

  isPreloaded(avatarUrl: string): boolean {
    return this.preloadedUrls.has(avatarUrl);
  }

  // Storage methods
  private async storePreloadResult(result: PreloadResult): Promise<void> {
    try {
      const key = `preload_result_${result.userId}_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(result));
    } catch (error) {
      logger.error('Failed to store preload result', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PRELOAD_STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      logger.error('Failed to save preload stats', error);
    }
  }

  private async loadStoredStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PRELOAD_STATS_KEY);
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Failed to load preload stats', error);
    }
  }

  private async loadPreloadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.PRELOAD_CACHE_KEY);
      if (cached) {
        const cachedUrls = JSON.parse(cached);
        this.preloadedUrls = new Set(cachedUrls);
      }
    } catch (error) {
      logger.error('Failed to load preload cache', error);
    }
  }

  private async savePreloadCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.preloadedUrls);
      await AsyncStorage.setItem(this.PRELOAD_CACHE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      logger.error('Failed to save preload cache', error);
    }
  }
}

export default AvatarPreloadingService; 