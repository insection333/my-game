// Usable: the first real page has drawn and the fonts are in. Verify's speed budget waits for this.
import { useEffect } from 'react';

export function Ready() {
  useEffect(() => {
    requestAnimationFrame(() => {
      void document.fonts.ready.then(() => (document.documentElement.dataset.ready = 'true'));
    });
  }, []);
  return null;
}
