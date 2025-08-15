import { supabase } from './supabase';
import { createLogger } from '../utils/logger';
import { DeviceRegistrationService } from './DeviceRegistrationService';

const logger = createLogger('NewDeviceNotificationService');

export interface NewDeviceNotification {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  device_info: any;
  ip_address?: string;
  location_info?: any;
  created_at: string;
  is_dismissed: boolean;
  is_trusted: boolean;
  action_taken?: 'trusted' | 'blocked' | 'dismissed';
  action_taken_at?: string;
}

export class NewDeviceNotificationService {
  private static instance: NewDeviceNotificationService;
  private notificationCallbacks: ((notification: NewDeviceNotification) => void)[] = [];

  static getInstance(): NewDeviceNotificationService {
    if (!this.instance) {
      this.instance = new NewDeviceNotificationService();
    }
    return this.instance;
  }

  /**
   * Check if a device login should trigger a new device notification
   */
  async checkAndCreateNotification(
    userId: string,
    deviceFingerprint: string,
    deviceInfo: any,
    ipAddress?: string,
    locationInfo?: any
  ): Promise<NewDeviceNotification | null> {
    try {
      // Check if this device is already trusted
      const isTrusted = await DeviceRegistrationService.isDeviceTrusted(userId, deviceFingerprint);
      
      if (isTrusted) {
        logger.info('Device is already trusted, no notification needed');
        return null;
      }

      // Check if we already have a recent notification for this device
      const { data: existingNotification, error } = await supabase
        .from('device_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.warn('Error checking existing notifications:', error);
      }

      if (existingNotification) {
        logger.info('Recent notification already exists for this device');
        return existingNotification;
      }

      // Create new device notification
      const notification: Partial<NewDeviceNotification> = {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceInfo.device_name || deviceInfo.name || 'Unknown Device',
        device_info: deviceInfo,
        ip_address: ipAddress,
        location_info: locationInfo,
        is_dismissed: false,
        is_trusted: false,
      };

      const { data: createdNotification, error: createError } = await supabase
        .from('device_notifications')
        .insert(notification)
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create device notification:', createError);
        return null;
      }

      logger.info('New device notification created:', createdNotification.id);

      // Trigger callbacks for UI updates
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(createdNotification);
        } catch (error) {
          logger.error('Error in notification callback:', error);
        }
      });

      return createdNotification;
    } catch (error) {
      logger.error('Error in checkAndCreateNotification:', error);
      return null;
    }
  }

  /**
   * Mark a notification as trusted (user chose to trust the device)
   */
  async trustDevice(notificationId: string, userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      // Trust the device in the device registration service
      await DeviceRegistrationService.trustDevice(userId, deviceFingerprint);

      // Update the notification
      const { error } = await supabase
        .from('device_notifications')
        .update({
          is_trusted: true,
          action_taken: 'trusted',
          action_taken_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        logger.error('Failed to update notification as trusted:', error);
        return false;
      }

      logger.info('Device trusted successfully:', notificationId);
      return true;
    } catch (error) {
      logger.error('Error trusting device:', error);
      return false;
    }
  }

  /**
   * Mark a notification as blocked (user said "this wasn't me")
   */
  async blockDevice(notificationId: string, userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      // Revoke the device access
      await DeviceRegistrationService.revokeDevice(userId, deviceFingerprint);

      // Update the notification
      const { error } = await supabase
        .from('device_notifications')
        .update({
          action_taken: 'blocked',
          action_taken_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        logger.error('Failed to update notification as blocked:', error);
        return false;
      }

      // TODO: Additional security actions could be taken here:
      // - Force logout of all sessions
      // - Send email notification
      // - Temporarily lock account
      // - Require password reset

      logger.info('Device blocked successfully:', notificationId);
      return true;
    } catch (error) {
      logger.error('Error blocking device:', error);
      return false;
    }
  }

  /**
   * Dismiss a notification without taking action
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('device_notifications')
        .update({
          is_dismissed: true,
          action_taken: 'dismissed',
          action_taken_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        logger.error('Failed to dismiss notification:', error);
        return false;
      }

      logger.info('Notification dismissed:', notificationId);
      return true;
    } catch (error) {
      logger.error('Error dismissing notification:', error);
      return false;
    }
  }

  /**
   * Get pending (unresolved) notifications for a user
   */
  async getPendingNotifications(userId: string): Promise<NewDeviceNotification[]> {
    try {
      const { data, error } = await supabase
        .from('device_notifications')
        .select('*')
        .eq('user_id', userId)
        .is('action_taken', null)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get pending notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Get all notifications for a user (for security history)
   */
  async getAllNotifications(userId: string, limit: number = 50): Promise<NewDeviceNotification[]> {
    try {
      const { data, error } = await supabase
        .from('device_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get all notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting all notifications:', error);
      return [];
    }
  }

  /**
   * Register a callback to be called when new device notifications are created
   */
  onNewDeviceNotification(callback: (notification: NewDeviceNotification) => void): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Initialize the service and check for any pending notifications
   */
  async initialize(userId: string): Promise<NewDeviceNotification[]> {
    try {
      logger.info('Initializing NewDeviceNotificationService');
      
      // Get any pending notifications
      const pendingNotifications = await this.getPendingNotifications(userId);
      
      if (pendingNotifications.length > 0) {
        logger.info(`Found ${pendingNotifications.length} pending device notifications`);
      }
      
      return pendingNotifications;
    } catch (error) {
      logger.error('Failed to initialize NewDeviceNotificationService:', error);
      return [];
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('device_notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo);

      if (error) {
        logger.error('Failed to cleanup old notifications:', error);
        return 0;
      }

      const deletedCount = Array.isArray(data) ? data.length : 0;
      logger.info(`Cleaned up ${deletedCount} old device notifications`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }
}

export const newDeviceNotificationService = NewDeviceNotificationService.getInstance();
