import { useEffect } from 'react';
import { SessionTimeoutService } from '../services/SessionTimeoutService';

export function useSessionTimeout(userId: string | undefined, onTimeout: () => void) {
  useEffect(() => {
    if (!userId) return;

    // TODO: Implement activity listeners and timeout logic
  }, [userId, onTimeout]);
} 