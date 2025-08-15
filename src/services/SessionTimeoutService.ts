import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SessionTimeoutService');

// Minimal, app-side-only session timeout with no persistence
export class SessionTimeoutService {
  static DEFAULT_TIMEOUT_MINUTES = 120;

  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private warningHandle: ReturnType<typeof setTimeout> | null = null;
  private lastActivity: number = Date.now();
  private onTimeoutCb: (() => void) | null = null;
  private onWarningCb: ((minutesRemaining: number) => void) | null = null;
  private timeoutMinutes: number = SessionTimeoutService.DEFAULT_TIMEOUT_MINUTES;

  async initialize(): Promise<void> {
    // No-op for now
    return;
  }

  async startSession(userId: string, _sessionId: string, customTimeoutMinutes?: number): Promise<void> {
    this.lastActivity = Date.now();
    this.timeoutMinutes = customTimeoutMinutes || SessionTimeoutService.DEFAULT_TIMEOUT_MINUTES;
    this.scheduleTimers();
  }

  async endSession(): Promise<void> {
    this.clearTimers();
  }

  recordActivity(): void {
    this.lastActivity = Date.now();
    this.scheduleTimers();
  }

  extendSession(additionalMinutes?: number): void {
    this.timeoutMinutes = (additionalMinutes || this.timeoutMinutes);
    this.lastActivity = Date.now();
    this.scheduleTimers();
  }

  getSessionInfo(): { isActive: boolean; timeRemaining: number; lastActivity: Date | null; warningShown: boolean } {
    const remainingMs = this.getRemainingMs();
    return {
      isActive: remainingMs > 0,
      timeRemaining: Math.max(0, Math.floor(remainingMs / 60000)),
      lastActivity: new Date(this.lastActivity),
      warningShown: false,
    };
  }

  setSessionTimeoutCallback(cb: () => void): void {
    this.onTimeoutCb = cb;
  }

  setSessionWarningCallback(cb: (minutes: number) => void): void {
    this.onWarningCb = cb;
  }

  private getRemainingMs(): number {
    const expiresAt = this.lastActivity + this.timeoutMinutes * 60 * 1000;
    return expiresAt - Date.now();
  }

  private scheduleTimers(): void {
    this.clearTimers();
    const remainingMs = this.getRemainingMs();
    if (remainingMs <= 0) {
      this.triggerTimeout();
      return;
    }
    // Warning 5 minutes before timeout
    const warningMs = remainingMs - 5 * 60 * 1000;
    if (warningMs > 0 && this.onWarningCb) {
      this.warningHandle = setTimeout(() => this.onWarningCb?.(5), warningMs);
    }
    this.timeoutHandle = setTimeout(() => this.triggerTimeout(), remainingMs);
  }

  private triggerTimeout(): void {
    this.clearTimers();
    this.onTimeoutCb?.();
  }

  private clearTimers(): void {
    if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
    if (this.warningHandle) clearTimeout(this.warningHandle);
    this.timeoutHandle = null;
    this.warningHandle = null;
  }
}

export const sessionTimeoutService = new SessionTimeoutService();
export default sessionTimeoutService;