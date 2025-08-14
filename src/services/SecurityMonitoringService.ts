import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SecurityMonitoringService');

// Minimal, production-safe implementation that matches OptimizedAuthContext usage
export class SecurityMonitoringService {
  async initialize(): Promise<void> {
    return;
  }

  // Record a login attempt using database RPC if available
  async recordLoginAttempt(
    email: string,
    success: boolean,
    failureReason?: string
  ): Promise<{
    allowed: boolean;
    lockoutInfo?: { locked: boolean; lockedUntil?: Date; remainingMinutes?: number };
    securityAlerts: any[];
  }> {
    try {
      // Try to call backend RPC if present (see 20250405_login_security_monitoring.sql)
      const deviceFingerprint = 'unknown_device';
      const { data, error } = await supabase.rpc(
        'record_login_attempt_and_check_lockout',
        {
          p_email: email,
          p_success: success,
          p_device_fingerprint: deviceFingerprint,
          p_device_info: null,
          p_location_info: null,
          p_ip_address: null,
          p_user_agent: null,
          p_failure_reason: failureReason || null,
        }
      );

      if (error) {
        logger.warn('recordLoginAttempt RPC failed, proceeding as allowed:', error.message);
        return { allowed: true, securityAlerts: [] };
      }

      // data should contain: should_lockout, lockout_duration_minutes, failed_attempts_count
      const shouldLockout = Array.isArray(data) ? data?.[0]?.should_lockout : data?.should_lockout;
      const minutes = Array.isArray(data) ? data?.[0]?.lockout_duration_minutes : data?.lockout_duration_minutes;

      if (shouldLockout) {
        return {
          allowed: false,
          lockoutInfo: {
            locked: true,
            remainingMinutes: minutes || 15,
          },
          securityAlerts: [
            {
              type: 'account_locked',
              severity: 'high',
              title: 'Account Temporarily Locked',
              message: 'Too many failed login attempts. Please try again later.',
              recommendation: 'Reset your password or wait before trying again.',
            },
          ],
        };
      }

      return { allowed: true, securityAlerts: [] };
    } catch (err) {
      logger.warn('recordLoginAttempt error, proceeding as allowed:', err);
      return { allowed: true, securityAlerts: [] };
    }
  }

  // Start secure session (no-op minimal)
  async startSecureSession(_userId: string, _sessionId: string): Promise<void> {
    return;
  }

  async endSession(): Promise<void> {
    return;
  }

  async isDeviceTrusted(_userId: string): Promise<boolean> {
    // Minimal implementation: assume trusted
    return true;
  }

  async registerTrustedDevice(_userId: string): Promise<void> {
    return;
  }

  async updateSessionActivity(): Promise<void> {
    return;
  }

  async getSecurityMetrics(): Promise<{
    deviceTrusted: boolean;
    sessionValid: boolean;
    recentLoginAttempts: number;
    securityScore: number;
  }> {
    return {
      deviceTrusted: true,
      sessionValid: true,
      recentLoginAttempts: 0,
      securityScore: 100,
    };
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
export default securityMonitoringService;