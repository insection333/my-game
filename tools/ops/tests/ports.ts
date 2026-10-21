// A free local port for a test's server.
import { createServer } from 'node:net';

export const freePort = () =>
  new Promise<number>((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      probe.close(() => resolve(typeof addr === 'object' && addr ? addr.port : 0));
    });
  });
