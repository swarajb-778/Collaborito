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
} 