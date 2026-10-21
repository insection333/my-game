// A number that counts up to its new value instead of jumping (the gold in the header): a short
// ease-out, drawn frame by frame only while it moves. Spending, and reduced motion, show the new
// value at once.
import { useEffect, useState } from 'react';

export function useCountUp(value: number, ms = 650): number {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const from = shown;
    const still = from >= value || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(at) {
      const p = still ? 1 : Math.min(1, (at - start) / ms);
      setShown(Math.round(from + (value - from) * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
    // Only a new value starts a count; `shown` is where the last one had got to.
  }, [value, ms]);
  return value === shown ? value : shown;
}
