// Changes the server has not heard (session 274). Every merged session deploys, and the server restarts; a press
// made in those seconds was shown done, retried for three and a half seconds, then dropped, and undone without a
// word when the page next read the save. Each change that could not get through now waits, with its own request
// id (so it acts once), and is sent again in order when the server answers again; a press made meanwhile waits
// behind it, so the order the player pressed in is kept. A change left unsent for ten minutes is let go.
import { ApiError } from '../api.ts';

/** How long a change that could not get through is kept to send again. */
export const KEEP_UNSENT_MS = 10 * 60_000;

export interface Outbox {
  /** Sends a change: its answer, or null when it was refused or let go. */
  send<T>(go: () => Promise<T>): Promise<T | null>;
  /** Sends what waits, in order; called when the server answers again. */
  flush(): Promise<void>;
  /** Lets go of everything waiting (signed out). */
  drop(): void;
  readonly waiting: number;
}

interface Deps {
  connected: (up: boolean) => void;
  /** Whether the error was dealt with (signed out, banned): nothing more to do. */
  handled: (err: unknown) => boolean;
  now: () => number;
  pause: (ms: number) => Promise<void>;
}

const unreachable = (err: unknown) => err instanceof ApiError && err.code === 'offline';

export function outbox(deps: Deps): Outbox {
  let queue: { go: () => Promise<unknown>; done: (r: unknown) => void; at: number }[] = [];
  let running: Promise<void> | null = null;
  let again = false;
  const wait = <T>(go: () => Promise<T>) =>
    new Promise<T | null>((done) => queue.push({ go, done: done as (r: unknown) => void, at: deps.now() }));

  /** Sends what waits, in order, until it is all sent or the server is out of reach again. */
  async function drain() {
    while (queue.length) {
      const w = queue[0];
      if (deps.now() - w.at > KEEP_UNSENT_MS) {
        queue.shift();
        w.done(null);
        continue;
      }
      try {
        const answer = await w.go();
        queue.shift();
        deps.connected(true);
        w.done(answer);
      } catch (err) {
        if (unreachable(err)) {
          deps.connected(false);
          return;
        }
        queue.shift();
        deps.handled(err);
        w.done(null);
      }
    }
  }

  return {
    get waiting() {
      return queue.length;
    },
    async send<T>(go: () => Promise<T>): Promise<T | null> {
      if (queue.length) {
        const after = wait(go);
        void this.flush();
        return after;
      }
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const answer = await go();
          deps.connected(true);
          return answer;
        } catch (err) {
          if (deps.handled(err) || !unreachable(err)) return null;
          if (attempt === 2) {
            deps.connected(false);
            return wait(go);
          }
          await deps.pause(500 * 2 ** attempt);
        }
      }
      return null;
    },
    flush() {
      // Asked again while sending (the server came back mid-way): runs once more when this one ends.
      if (running) {
        again = true;
        return running;
      }
      running = (async () => {
        do {
          again = false;
          await drain();
        } while (again);
      })().finally(() => (running = null));
      return running;
    },
    drop() {
      const all = queue;
      queue = [];
      for (const w of all) w.done(null);
    },
  };
}
