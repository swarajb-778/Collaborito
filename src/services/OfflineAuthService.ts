import React from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../utils/logger';

const logger = createLogger('OfflineAuthService');

// Offline authentication state
export interface OfflineAuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  lastSync: number;
  expiresAt: number;
  isOfflineMode: boolean;
}

// Queued operation
export interface QueuedOperation {
  id: string;
  type: 'login' | 'logout' | 'register' | 'update_profile' | 'refresh_token';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Network state
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isExpensive: boolean | null;
}

// Configuration
interface OfflineAuthConfig {
  maxQueueSize: number;
  maxRetries: number;
  syncInterval: number; // minutes
  cacheTimeout: number; // minutes
  enableOfflineMode: boolean;
}

class OfflineAuthService {
  private static instance: OfflineAuthService;
  private authState: OfflineAuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    lastSync: 0,
    expiresAt: 0,
    isOfflineMode: false,
  };
  private operationQueue: QueuedOperation[] = [];
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
    isExpensive: null,
  };
  private config: OfflineAuthConfig = {
    maxQueueSize: 50,
    maxRetries: 3,
    syncInterval: 5, // 5 minutes
    cacheTimeout: 60, // 1 hour
    enableOfflineMode: true,
  };
  private listeners: Array<(state: OfflineAuthState) => void> = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;

  public static getInstance(): OfflineAuthService {
    if (!OfflineAuthService.instance) {
      OfflineAuthService.instance = new OfflineAuthService();
    }
    return OfflineAuthService.instance;
  }

  // Initialize offline auth service
  public async initialize(): Promise<void> {
    try {
      logger.info('📱 Initializing offline auth service...');

      // Load cached auth state
      await this.loadCachedAuthState();

      // Set up network monitoring
      await this.setupNetworkMonitoring();

      // Set up periodic sync
      this.setupPeriodicSync();

      // Load operation queue
      await this.loadOperationQueue();

      logger.info('✅ Offline auth service initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing offline auth service:', error);
      throw error;
    }
  }

  // Set up network monitoring
  private async setupNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.updateNetworkState(netInfo);

      // Subscribe to network changes
      this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        this.updateNetworkState(state);
      });

      logger.info('📡 Network monitoring set up');
    } catch (error) {
      logger.error('❌ Error setting up network monitoring:', error);
    }
  }

  // Update network state and handle connection changes
  private updateNetworkState(netInfo: NetInfoState): void {
    const previouslyConnected = this.networkState.isConnected;
    
    this.networkState = {
      isConnected: netInfo.isConnected || false,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      isExpensive: netInfo.details?.isConnectionExpensive || null,
    };

    logger.info(`📡 Network state updated: ${JSON.stringify(this.networkState)}`);

    // Update offline mode
    const wasOffline = this.authState.isOfflineMode;
    this.authState.isOfflineMode = !this.networkState.isConnected;

    // If just came back online, sync queued operations
    if (previouslyConnected === false && this.networkState.isConnected) {
      logger.info('🌐 Connection restored, syncing queued operations...');
      this.syncQueuedOperations();
    }

    // If just went offline, enable offline mode
    if (previouslyConnected === true && !this.networkState.isConnected) {
      logger.info('📵 Connection lost, enabling offline mode...');
      this.enableOfflineMode();
    }

    // Notify listeners if offline mode changed
    if (wasOffline !== this.authState.isOfflineMode) {
      this.notifyListeners();
    }
  }

  // Enable offline mode
  private enableOfflineMode(): void {
    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      
      // Save current state to cache
      this.saveCachedAuthState();
      
      logger.info('📵 Offline mode enabled');
    } catch (error) {
      logger.error('❌ Error enabling offline mode:', error);
    }
  }

  // Load cached authentication state
  private async loadCachedAuthState(): Promise<void> {
    try {
      const cachedState = await AsyncStorage.getItem('offline_auth_state');
      if (cachedState) {
        const parsedState = JSON.parse(cachedState) as OfflineAuthState;
        
        // Check if cached state is still valid
        const now = Date.now();
        if (now < parsedState.expiresAt) {
          this.authState = { ...parsedState, isOfflineMode: false };
          logger.info('💾 Loaded valid cached auth state');
        } else {
          logger.info('⏰ Cached auth state expired, clearing...');
          await this.clearCachedAuthState();
        }
      }
    } catch (error) {
      logger.error('❌ Error loading cached auth state:', error);
    }
  }

  // Save authentication state to cache
  private async saveCachedAuthState(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_auth_state', JSON.stringify(this.authState));
      logger.info('💾 Auth state cached successfully');
    } catch (error) {
      logger.error('❌ Error saving cached auth state:', error);
    }
  }

  // Clear cached authentication state
  private async clearCachedAuthState(): Promise<void> {
    try {
      await AsyncStorage.removeItem('offline_auth_state');
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        lastSync: 0,
        expiresAt: 0,
        isOfflineMode: this.authState.isOfflineMode,
      };
      logger.info('🧹 Cached auth state cleared');
    } catch (error) {
      logger.error('❌ Error clearing cached auth state:', error);
    }
  }

  // Update authentication state
  public async updateAuthState(
    token: string | null,
    refreshToken: string | null,
    user: any | null,
    expiresIn?: number
  ): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = expiresIn ? now + (expiresIn * 1000) : now + (60 * 60 * 1000); // Default 1 hour

      this.authState = {
        ...this.authState,
        isAuthenticated: !!token,
        user,
        token,
        refreshToken,
        lastSync: now,
        expiresAt,
      };

      // Save to cache
      await this.saveCachedAuthState();

      // Notify listeners
      this.notifyListeners();

      logger.info(`🔐 Auth state updated - Authenticated: ${this.authState.isAuthenticated}`);
    } catch (error) {
      logger.error('❌ Error updating auth state:', error);
    }
  }

  // Queue operation for later sync
  public async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queuedOp: QueuedOperation = {
        ...operation,
        id: this.generateOperationId(),
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Add to queue
      this.operationQueue.push(queuedOp);

      // Limit queue size
      if (this.operationQueue.length > this.config.maxQueueSize) {
        this.operationQueue.shift(); // Remove oldest operation
      }

      // Save queue to storage
      await this.saveOperationQueue();

      logger.info(`📝 Operation queued: ${queuedOp.type} (${queuedOp.id})`);

      // Try to sync immediately if online
      if (this.networkState.isConnected) {
        this.syncQueuedOperations();
      }
    } catch (error) {
      logger.error('❌ Error queuing operation:', error);
    }
  }

  // Load operation queue from storage
  private async loadOperationQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('operation_queue');
      if (queueData) {
        this.operationQueue = JSON.parse(queueData);
        logger.info(`📋 Loaded ${this.operationQueue.length} queued operations`);
      }
    } catch (error) {
      logger.error('❌ Error loading operation queue:', error);
    }
  }

  // Save operation queue to storage
  private async saveOperationQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('operation_queue', JSON.stringify(this.operationQueue));
    } catch (error) {
      logger.error('❌ Error saving operation queue:', error);
    }
  }

  // Sync queued operations
  private async syncQueuedOperations(): Promise<void> {
    if (!this.networkState.isConnected || this.operationQueue.length === 0) {
      return;
    }

    logger.info(`🔄 Syncing ${this.operationQueue.length} queued operations...`);

    const operationsToSync = [...this.operationQueue];
    const successfulOps: string[] = [];
    const failedOps: QueuedOperation[] = [];

    for (const operation of operationsToSync) {
      try {
        const success = await this.syncOperation(operation);
        if (success) {
          successfulOps.push(operation.id);
        } else {
          // Increment retry count
          operation.retryCount++;
          if (operation.retryCount < operation.maxRetries) {
            failedOps.push(operation);
          } else {
            logger.warn(`⚠️ Operation ${operation.id} exceeded max retries, discarding`);
          }
        }
      } catch (error) {
        logger.error(`❌ Error syncing operation ${operation.id}:`, error);
        operation.retryCount++;
        if (operation.retryCount < operation.maxRetries) {
          failedOps.push(operation);
        }
      }

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update queue - remove successful operations, keep failed ones for retry
    this.operationQueue = failedOps;
    await this.saveOperationQueue();

    logger.info(`✅ Sync complete - Success: ${successfulOps.length}, Failed: ${failedOps.length}`);

    // Provide feedback
    if (successfulOps.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  // Sync individual operation (implement based on your API)
  private async syncOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      logger.info(`🔄 Syncing operation: ${operation.type}`);

      // This is a placeholder - implement actual API calls based on operation type
      switch (operation.type) {
        case 'login':
          // Implement login sync
          return true;
        case 'logout':
          // Implement logout sync
          return true;
        case 'register':
          // Implement registration sync
          return true;
        case 'update_profile':
          // Implement profile update sync
          return true;
        case 'refresh_token':
          // Implement token refresh sync
          return true;
        default:
          logger.warn(`⚠️ Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`❌ Error syncing operation ${operation.id}:`, error);
      return false;
    }
  }

  // Set up periodic sync
  private setupPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.networkState.isConnected && this.operationQueue.length > 0) {
        logger.info('⏰ Periodic sync triggered');
        this.syncQueuedOperations();
      }
    }, this.config.syncInterval * 60 * 1000);

    logger.info(`⏰ Periodic sync set up (${this.config.syncInterval} minutes)`);
  }

  // Generate unique operation ID
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: OfflineAuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        logger.error('❌ Error notifying auth state listener:', error);
      }
    });
  }

  // Public getters
  public getAuthState(): OfflineAuthState {
    return { ...this.authState };
  }

  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  public isOnline(): boolean {
    return this.networkState.isConnected;
  }

  public isOffline(): boolean {
    return !this.networkState.isConnected;
  }

  public getQueuedOperationsCount(): number {
    return this.operationQueue.length;
  }

  public hasQueuedOperations(): boolean {
    return this.operationQueue.length > 0;
  }

  // Force sync
  public async forcSync(): Promise<void> {
    if (this.networkState.isConnected) {
      await this.syncQueuedOperations();
    } else {
      logger.warn('⚠️ Cannot force sync while offline');
    }
  }

  // Clear all cached data
  public async clearAllData(): Promise<void> {
    try {
      await this.clearCachedAuthState();
      this.operationQueue = [];
      await this.saveOperationQueue();
      this.notifyListeners();
      logger.info('🧹 All offline data cleared');
    } catch (error) {
      logger.error('❌ Error clearing all data:', error);
    }
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<OfflineAuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('⚙️ Offline auth config updated');
  }

  public getConfig(): OfflineAuthConfig {
    return { ...this.config };
  }

  // Cleanup
  public cleanup(): void {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      if (this.netInfoUnsubscribe) {
        this.netInfoUnsubscribe();
        this.netInfoUnsubscribe = null;
      }

      this.listeners = [];
      logger.info('🧹 Offline auth service cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up offline auth service:', error);
    }
  }
}

// Export singleton instance
export const offlineAuthService = OfflineAuthService.getInstance();

// Export hook for React components
export const useOfflineAuth = () => {
  const [authState, setAuthState] = React.useState<OfflineAuthState>(offlineAuthService.getAuthState());
  const [networkState, setNetworkState] = React.useState<NetworkState>(offlineAuthService.getNetworkState());

  React.useEffect(() => {
    const unsubscribe = offlineAuthService.subscribe((state) => {
      setAuthState(state);
      setNetworkState(offlineAuthService.getNetworkState());
    });

    return unsubscribe;
  }, []);

  return {
    authState,
    networkState,
    isOnline: offlineAuthService.isOnline(),
    isOffline: offlineAuthService.isOffline(),
    queuedOperationsCount: offlineAuthService.getQueuedOperationsCount(),
    hasQueuedOperations: offlineAuthService.hasQueuedOperations(),
    queueOperation: offlineAuthService.queueOperation.bind(offlineAuthService),
    forceSync: offlineAuthService.forcSync.bind(offlineAuthService),
    clearAllData: offlineAuthService.clearAllData.bind(offlineAuthService),
  };
};

export default offlineAuthService; 