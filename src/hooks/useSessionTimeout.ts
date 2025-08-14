import { useEffect } from 'react';
import sessionTimeoutService from '../services/SessionTimeoutService';
import { AppState } from 'react-native';
import { useState } from 'react';

export function useSessionTimeout(
  userId: string | undefined,
  onTimeout: () => void,
  onWarning?: (minutesRemaining: number) => void
) {
  const [lastWarning, setLastWarning] = useState<number | null>(null);
  useEffect(() => {
    if (!userId) return;

    let appStateSub: any;
    let isMounted = true;

    const init = async () => {
      await sessionTimeoutService.initialize();
      sessionTimeoutService.setSessionTimeoutCallback(() => {
        if (!isMounted) return;
        onTimeout();
      });
      if (onWarning) sessionTimeoutService.setSessionWarningCallback((m) => {
        // prevent spamming warning
        if (lastWarning !== m) {
          setLastWarning(m);
          onWarning(m);
        }
      });
      await sessionTimeoutService.startSession(userId, '');
    };

    init();

    // Record activity on app foreground
    appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sessionTimeoutService.recordActivity();
      }
    });

    return () => {
      isMounted = false;
      appStateSub?.remove?.();
      sessionTimeoutService.endSession();
    };
  }, [userId, onTimeout, onWarning]);
}