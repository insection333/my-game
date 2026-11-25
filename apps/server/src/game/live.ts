// The live channel: each signed-in page holds one WebSocket; the server tells it what changed.
import type { LiveMessage } from '@idle-clash/contracts';

interface Socket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

const OPEN = 1;
/** Pages a player may hold open at once: a new one past this closes their oldest. */
export const PAGES_PER_PLAYER = 6;

export class LiveHub {
  private sockets = new Map<string, Set<Socket>>();
  /** The session each page was opened under (its token's hash), so ending a session closes its pages. */
  private sessionOf = new WeakMap<Socket, string>();

  /** Holds a page open; past the limit, the player's oldest page is closed (a Set keeps its order). */
  add(playerId: string, socket: Socket, session = ''): void {
    this.sessionOf.set(socket, session);
    const set = this.sockets.get(playerId) ?? new Set();
    set.add(socket);
    this.sockets.set(playerId, set);
    for (const old of set) {
      if (set.size <= PAGES_PER_PLAYER) break;
      set.delete(old);
      old.close(4408, 'opened elsewhere');
    }
  }

  remove(playerId: string, socket: Socket): void {
    const set = this.sockets.get(playerId);
    set?.delete(socket);
    if (set && !set.size) this.sockets.delete(playerId);
  }

  publish(playerId: string, message: LiveMessage): void {
    const text = JSON.stringify(message);
    for (const s of this.sockets.get(playerId) ?? []) if (s.readyState === OPEN) s.send(text);
  }

  /** Whether a player has a page open. */
  has(playerId: string): boolean {
    return this.sockets.has(playerId);
  }

  /** The players with a page open. */
  players(): string[] {
    return [...this.sockets.keys()];
  }

  /** Every page open, a player's tabs each counted (the console's System, session 233). */
  get pages(): number {
    let n = 0;
    for (const set of this.sockets.values()) n += set.size;
    return n;
  }

  /** Open pages, for the "online now" count on the hiscores. */
  get online(): number {
    return this.sockets.size;
  }

  /** Closes a player's pages: signed out everywhere (4401: the account deleted, a password reset), or
   *  banned (4403), which the page says on the welcome page it lands on (session 95). */
  closePlayer(playerId: string, banned = false): void {
    for (const s of this.sockets.get(playerId) ?? []) s.close(banned ? 4403 : 4401, banned ? 'banned' : 'signed out');
    this.sockets.delete(playerId);
  }

  /** Closes the pages of sessions that have ended (session 158): those opened under `session`, or with
   *  `keep`, all but those opened under it (the password changed on another device ends every other). */
  closeSessions(playerId: string, which: { session: string } | { keep: string }): void {
    const set = this.sockets.get(playerId);
    if (!set) return;
    for (const s of [...set]) {
      const of = this.sessionOf.get(s) ?? '';
      if ('session' in which ? of !== which.session : of === which.keep) continue;
      set.delete(s);
      s.close(4401, 'signed out');
    }
    if (!set.size) this.sockets.delete(playerId);
  }

  closeAll(): void {
    for (const set of this.sockets.values()) for (const s of set) s.close(1001, 'server stopping');
    this.sockets.clear();
  }
}
