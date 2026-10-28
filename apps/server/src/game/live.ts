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

  /** Holds a page open; past the limit, the player's oldest page is closed (a Set keeps its order). */
  add(playerId: string, socket: Socket): void {
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

  /** The players with a page open. */
  players(): string[] {
    return [...this.sockets.keys()];
  }

  /** Open pages, for the "online now" count on the hiscores. */
  get online(): number {
    return this.sockets.size;
  }

  /** Closes a player's pages (signed out everywhere: banned, or the account deleted). */
  closePlayer(playerId: string): void {
    for (const s of this.sockets.get(playerId) ?? []) s.close(4401, 'signed out');
    this.sockets.delete(playerId);
  }

  closeAll(): void {
    for (const set of this.sockets.values()) for (const s of set) s.close(1001, 'server stopping');
    this.sockets.clear();
  }
}
