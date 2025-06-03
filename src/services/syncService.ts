import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
   * Sync a single operation
   */
  private async syncOperation(
    operation: QueuedOperation,
    edgeFunctionsAvailable: boolean
  ): Promise<boolean> {
    try {
      if (edgeFunctionsAvailable) {
        return await this.syncWithEdgeFunction(operation);
      } else {
        return await this.syncWithDirectDatabase(operation);
      }
    } catch (error) {
      console.error(`Error in syncOperation for ${operation.type}:`, error);
      return false;
    }
  }

  /**
   * Sync using Edge Functions
   */
  private async syncWithEdgeFunction(operation: QueuedOperation): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session available for edge function sync');
        return false;
      }

      const response = await fetch(
        `${Constants.expoConfig?.extra?.SUPABASE_URL}/functions/v1/onboarding-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation_type: operation.type,
            data: operation.data,
            user_id: operation.userId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function sync failed:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error syncing with edge function:', error);
      return false;
    }
  }

  /**
   * Sync with direct database calls (fallback)
   */
  private async syncWithDirectDatabase(operation: QueuedOperation): Promise<boolean> {
    try {
      // Use dynamic import to avoid circular dependency
      const onboardingModule = await import('./onboardingService');
      
      switch (operation.type) {
        case 'profile':
          const profileResult = await onboardingModule.onboardingService.saveProfileData(operation.data);
          return profileResult.success;
          
        case 'interests':
          const interestsResult = await onboardingModule.onboardingService.saveInterestsData(operation.data);
          return interestsResult.success;
          
        case 'goals':
          const goalsResult = await onboardingModule.onboardingService.saveGoalsData(operation.data);
          return goalsResult.success;
          
        case 'project':
          const projectResult = await onboardingModule.onboardingService.saveProjectData(operation.data);
          return projectResult.success;
          
        case 'skills':
          const skillsResult = await onboardingModule.onboardingService.saveSkillsData(operation.data);
          return skillsResult.success;
          
        default:
          console.error(`Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error('Error syncing with direct database:', error);
      return false;
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncTime = parseInt(await AsyncStorage.getItem('last_sync_time') || '0');
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
    console.log('🧹 Sync queue cleared');
  }

  /**
   * Get number of pending operations
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Retry all failed operations
   */
  async retryAllOperations(): Promise<void> {
    this.syncQueue.forEach(operation => {
      operation.retryCount = 0;
    });
    await this.saveQueueToStorage();
    this.syncNow();
  }
}

// Export singleton instance
export const syncService = new SyncService(); 