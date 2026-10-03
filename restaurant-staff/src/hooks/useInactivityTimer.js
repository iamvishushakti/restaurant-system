import { useEffect, useRef } from 'react';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes

/**
 * Hook to automatically log out staff after a period of inactivity.
 * @param {boolean} isAuthenticated - Current authentication state
 * @param {Function} onTimeout - Callback to execute on timeout (e.g. logout)
 * @param {number} timeoutMs - Timeout duration in milliseconds
 */
export function useInactivityTimer(isAuthenticated, onTimeout, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isAuthenticated && typeof onTimeout === 'function') {
      timerRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isAuthenticated, timeoutMs]);

  return { resetTimer };
}

export default useInactivityTimer;
