// The console's live figures kept fresh (session 231): the Overview and Live read again every half minute
// while the page is in view, and at once when it comes back into view, where they stood as first read.
import { useEffect } from 'react';

export const FRESH_MS = 30_000;

export function useFresh(read: () => void, ms = FRESH_MS): void {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') read();
    };
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
}
