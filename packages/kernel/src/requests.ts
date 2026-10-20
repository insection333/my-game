// One request at a time per player, and each request id acted on once.
//
// The queue serialises a player's requests even when handlers await (password hashing, I/O), so two
// never interleave. The request id is stored in the save in the same write as the change it made,
// so a retry or a double click returns the first answer instead of acting twice.
import { REMEMBERED_REQUESTS, type RequestRecord, type SaveDoc } from './schema.ts';

export class PlayerQueue {
  private tails = new Map<string, Promise<unknown>>();

  /** Runs fn after every earlier request for the same player has finished. */
  run<T>(player: string, fn: () => T | Promise<T>): Promise<T> {
    const before = this.tails.get(player) ?? Promise.resolve();
    const result = before.then(fn, fn);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(player, tail);
    void tail.then(() => {
      if (this.tails.get(player) === tail) this.tails.delete(player);
    });
    return result;
  }

  /** Players with a request in flight (for tests and the admin page). */
  get busy(): number {
    return this.tails.size;
  }
}

/** Where saves live; the SQLite store implements this, tests may use a fake. */
export interface SaveStore {
  read(player: string, now: number): { doc: SaveDoc; rev: number } | null;
  /** Writes if the stored revision is still `rev`; throws SaveConflict otherwise. */
  write(player: string, doc: SaveDoc, rev: number, now: number): void;
}

export class SaveConflict extends Error {
  constructor(player: string) {
    super(`The save of ${player} changed underneath this request`);
  }
}

export type Handled<R> = { result: R; duplicate: boolean };

/**
 * Handles one request: waits its turn, loads the save, returns the stored answer if this request id
 * was already handled, otherwise runs the handler and writes the new state with the request id.
 */
export function handle<R>(
  queue: PlayerQueue,
  store: SaveStore,
  player: string,
  requestId: string,
  now: number,
  handler: (doc: SaveDoc) => { doc: SaveDoc; result: R } | Promise<{ doc: SaveDoc; result: R }>,
): Promise<Handled<R>> {
  return queue.run(player, async () => {
    const saved = store.read(player, now);
    if (!saved) throw new Error(`No save for ${player}`);
    const seen = saved.doc.requests.find((r) => r.id === requestId);
    if (seen) return { result: seen.result as R, duplicate: true };
    const out = await handler(saved.doc);
    const record: RequestRecord = { id: requestId, at: now, result: out.result };
    const requests = [...saved.doc.requests, record].slice(-REMEMBERED_REQUESTS);
    store.write(player, { ...out.doc, requests }, saved.rev, now);
    return { result: out.result, duplicate: false };
  });
}
