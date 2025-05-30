import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingService } from './onboardingService';
import Constants from 'expo-constants';

interface QueuedOperation {
  id: string;
  type: 'profile' | 'interests' | 'goals' | 'project' | 'skills';
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

interface SyncStatus {
  lastSyncTime: number;
  pendingOperations: number;
  edgeFunctionsAvailable: boolean;
  lastError?: string;
}

class SyncService {
  private syncQueue: QueuedOperation[] = [];
  private syncInProgress = false;
  private maxRetries = 3;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadQueueFromStorage();
    this.startPeriodicSync();
  }

  /**
   * Load queued operations from local storage
   */
  private async loadQueueFromStorage() {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        console.log(`📱 Loaded ${this.syncQueue.length} operations from queue`);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Save queue to local storage
   */
  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    type: QueuedOperation['type'],
    data: any,
    userId: string
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      userId
    };

    this.syncQueue.push(operation);
    await this.saveQueueToStorage();
    
    console.log(`📝 Queued ${type} operation for user ${userId}`);
    
    // Try immediate sync
    this.syncNow();
    
    return operation.id;
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync() {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, 30000);
  }

  /**
   * Stop periodic sync
   */
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform sync now
   */
  async syncNow(): Promise<boolean> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return true;
    }

    this.syncInProgress = true;
    let successCount = 0;
    let errorCount = 0;

    try {
      console.log(`🔄 Starting sync of ${this.syncQueue.length} operations`);
      
      // Check if Edge Functions are available
      const edgeFunctionsAvailable = await this.checkEdgeFunctionsAvailability();
      
      for (let i = this.syncQueue.length - 1; i >= 0; i--) {
        const operation = this.syncQueue[i];
        
        try {
          const success = await this.syncOperation(operation, edgeFunctionsAvailable);
          
          if (success) {
            // Remove from queue
            this.syncQueue.splice(i, 1);
            successCount++;
            console.log(`✅ Synced ${operation.type} operation ${operation.id}`);
          } else {
            // Increment retry count
            operation.retryCount++;
            errorCount++;
            
            // Remove if max retries exceeded
            if (operation.retryCount >= this.maxRetries) {
              console.log(`❌ Max retries exceeded for ${operation.type} operation ${operation.id}`);
              this.syncQueue.splice(i, 1);
            }
          }
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          operation.retryCount++;
          errorCount++;
          
          if (operation.retryCount >= this.maxRetries) {
            this.syncQueue.splice(i, 1);
          }
        }
      }

      await this.saveQueueToStorage();
      
      console.log(`🎉 Sync completed: ${successCount} success, ${errorCount} errors`);
      
    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.syncInProgress = false;
    }

    return errorCount === 0;
  }

  /**
   * Check if Edge Functions are available
   */
  private async checkEdgeFunctionsAvailability(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return false;
      }

      // Try a simple Edge Function call to test availability
      const response = await fetch(
        `${Constants.expoConfig?.extra?.SUPABASE_URL}/functions/v1/onboarding-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_status' }),
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync individual operation
   */
  private async syncOperation(
    operation: QueuedOperation,
    edgeFunctionsAvailable: boolean
  ): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'profile':
          if (edgeFunctionsAvailable) {
            await onboardingService.saveProfileData(operation.data);
          } else {
            await onboardingService.saveProfileData(operation.data); // Fallback included
          }
          break;

        case 'interests':
          if (edgeFunctionsAvailable) {
            await onboardingService.saveInterestsData(operation.data);
          } else {
            await onboardingService.saveInterestsData(operation.data); // Fallback included
          }
          break;

        case 'goals':
          if (edgeFunctionsAvailable) {
            await onboardingService.saveGoalsData(operation.data);
          } else {
            await onboardingService.saveGoalsData(operation.data); // Fallback included
          }
          break;

        case 'project':
          if (edgeFunctionsAvailable) {
            await onboardingService.saveProjectData(operation.data);
          } else {
            await onboardingService.saveProjectData(operation.data); // Fallback included
          }
          break;

        case 'skills':
          if (edgeFunctionsAvailable) {
            await onboardingService.saveSkillsData(operation.data);
          } else {
            await onboardingService.saveSkillsData(operation.data); // Fallback included
          }
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      return true;
    } catch (error) {
      console.error(`Failed to sync ${operation.type} operation:`, error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncTime = parseInt(
      (await AsyncStorage.getItem('last_sync_time')) || '0'
    );
    
    const edgeFunctionsAvailable = await this.checkEdgeFunctionsAvailability();

    return {
      lastSyncTime,
      pendingOperations: this.syncQueue.length,
      edgeFunctionsAvailable,
    };
  }

  /**
   * Clear all queued operations
   */
  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveQueueToStorage();
    console.log('🗑️ Sync queue cleared');
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Force retry all failed operations
   */
  async retryAllOperations(): Promise<void> {
    for (const operation of this.syncQueue) {
      operation.retryCount = 0;
    }
    await this.saveQueueToStorage();
    console.log('🔄 Reset retry count for all operations');
    this.syncNow();
  }
}

export const syncService = new SyncService(); 