import { useCallback, useRef } from 'react';

/**
 * Hook to prevent rapid repeated actions (spam clicking).
 * Returns a wrapped function that only executes once per cooldown period.
 */
export function useRateLimit(cooldownMs: number = 1000) {
  const lastCallRef = useRef<number>(0);

  const rateLimited = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCallRef.current < cooldownMs) {
          return;
        }
        lastCallRef.current = now;
        return fn(...args);
      };
    },
    [cooldownMs]
  );

  return rateLimited;
}
