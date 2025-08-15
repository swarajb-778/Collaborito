import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('DeviceRegistrationService');

export class DeviceRegistrationService {
  static async registerDevice(
    userId: string,
    deviceFingerprint: string,
    deviceName: string,
    os: string,
    browser: string | null,
    ipAddress: string | null,
    markTrusted: boolean = false
  ): Promise<void> {
    try {
      // Check if device exists
      const { data: existing, error: selectError } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();

      if (selectError) {
        logger.warn('Select device error:', selectError.message);
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('user_devices')
          .update({
            device_name: deviceName,
            os,
            browser,
            ip_address: ipAddress,
            last_seen: new Date().toISOString(),
            is_trusted: markTrusted ? true : undefined,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_devices')
          .insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: deviceName,
            os,
            browser,
            ip_address: ipAddress,
            is_trusted: markTrusted,
          });
        if (insertError) throw insertError;
      }

      return;
    } catch (error: any) {
      logger.error('Failed to register device:', error?.message || error);
      // Non-fatal for client UX
    }
  }

  static async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('is_trusted')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();
      if (error) throw error;
      return !!data?.is_trusted;
    } catch (error: any) {
      logger.warn('isDeviceTrusted error:', error?.message || error);
      return false;
    }
  }

  static async trustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();
      if (selectError) throw selectError;

      if (existing?.id) {
        const { error } = await supabase
          .from('user_devices')
          .update({ is_trusted: true, last_seen: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      }
    } catch (error: any) {
      logger.warn('trustDevice error:', error?.message || error);
    }
  }

  static async getTrustedDevices(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trusted', true)
        .order('last_seen', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.warn('getTrustedDevices error:', error?.message || error);
      return [];
    }
  }

  static async getAllDevices(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.warn('getAllDevices error:', error?.message || error);
      return [];
    }
  }

  static async untrustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ 
          is_trusted: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint);
      
      if (error) throw error;
      logger.info('Device untrusted successfully');
    } catch (error: any) {
      logger.error('untrustDevice error:', error?.message || error);
      throw error;
    }
  }

  static async revokeDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint);
      
      if (error) throw error;
      logger.info('Device revoked successfully');
    } catch (error: any) {
      logger.error('revokeDevice error:', error?.message || error);
      throw error;
    }
  }

  static async getCurrentDeviceFingerprint(): Promise<string> {
    // Generate a device fingerprint based on available device info
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const platform = typeof navigator !== 'undefined' ? navigator.platform : 'Unknown';
      const timestamp = Date.now().toString();
      
      // Simple fingerprint - in production, you'd want something more sophisticated
      const fingerprint = btoa(`${userAgent}-${platform}-${timestamp}`).slice(0, 32);
      return fingerprint;
    } catch (error) {
      // Fallback fingerprint
      return `device-${Date.now()}`;
    }
  }

  static async isCurrentDevice(deviceFingerprint: string): Promise<boolean> {
    try {
      const currentFingerprint = await this.getCurrentDeviceFingerprint();
      return deviceFingerprint === currentFingerprint;
    } catch (error) {
      return false;
    }
  }
} 