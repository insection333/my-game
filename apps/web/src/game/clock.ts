// The server's time on this device (session 158). The game runs on the server's clock, learnt from every
// read of the save, so a device whose own clock is wrong still says "today" of today. Light on purpose:
// the pages that say times read it without loading the game's engine.

/** The server's clock minus this device's. */
let skew = 0;

/** Takes the server's word for the time now. */
export const setServerTime = (now: number): void => {
  skew = now - Date.now();
};

/** The server's time now. */
export const serverNow = (): number => Date.now() + skew;
