// The server's pulse (session 233): how hard it is working, minute by minute, for the console's System
// section, so the owner can see the load the game, and the console itself, put on it. Measured as it runs
// at almost no cost of its own: each answer adds its time to a bin, and once a minute the bins, the
// processor's time and the event loop's delays are closed into one minute of the last hour.
import type { PulseMinute } from '@idle-clash/contracts';
import type { FastifyInstance } from 'fastify';
import { monitorEventLoopDelay } from 'node:perf_hooks';

/** The upper edges of the bins an answer's time falls in, in ms. */
const BINS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, Infinity];
const MINUTE = 60_000;
/** Minutes kept: the last hour. */
const KEPT = 60;

export class Pulse {
  private bins = new Array<number>(BINS.length).fill(0);
  private busy = 0;
  private console = 0;
  private cpu = process.cpuUsage();
  private wall = performance.now();
  private loop = monitorEventLoopDelay({ resolution: 10 });
  readonly hour: PulseMinute[] = [];

  constructor() {
    this.loop.enable();
  }

  /** An answer given: how long it took, and whether the console asked it. */
  seen(ms: number, byConsole: boolean): void {
    let i = 0;
    while (ms > BINS[i]) i++;
    this.bins[i]++;
    this.busy += ms;
    if (byConsole) this.console += ms;
  }

  /** Closes the minute (or however long has passed) into the hour, stamped `at`. */
  close(at: number): PulseMinute {
    const wall = performance.now();
    const cpu = process.cpuUsage(this.cpu);
    const spent = Math.max(1, wall - this.wall);
    const requests = this.bins.reduce((a, b) => a + b, 0);
    // The edge of the bin the 95th in a hundred answers falls in: how long the slowest twentieth waited.
    let below = 0;
    let p95 = 0;
    for (const [i, n] of this.bins.entries()) {
      below += n;
      if (requests && below >= requests * 0.95) {
        p95 = Number.isFinite(BINS[i]) ? BINS[i] : BINS[i - 1];
        break;
      }
    }
    const minute: PulseMinute = {
      at,
      requests: Math.round((requests * MINUTE) / spent),
      p95Ms: p95,
      cpuPct: Math.round(((cpu.user + cpu.system) / 1000 / spent) * 1000) / 10,
      loopP99Ms: Math.round(this.loop.percentile(99) / 1e5) / 10,
      consolePct: this.busy ? Math.round((this.console / this.busy) * 1000) / 10 : 0,
    };
    this.hour.push(minute);
    if (this.hour.length > KEPT) this.hour.shift();
    this.bins.fill(0);
    this.busy = 0;
    this.console = 0;
    this.cpu = process.cpuUsage();
    this.wall = wall;
    this.loop.reset();
    return minute;
  }

  stop(): void {
    this.loop.disable();
  }
}

/** Measures every answer the server gives and closes a minute each minute, until the server closes. */
export function startPulse(app: FastifyInstance, now: () => number): Pulse {
  const pulse = new Pulse();
  app.addHook('onResponse', (req, reply, done) => {
    pulse.seen(reply.elapsedTime, req.url.startsWith('/api/admin'));
    done();
  });
  const tick = setInterval(() => pulse.close(now()), MINUTE);
  tick.unref();
  app.addHook('onClose', (_app, done) => {
    clearInterval(tick);
    pulse.stop();
    done();
  });
  return pulse;
}
