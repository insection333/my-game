// The live channel: each signed-in page holds one WebSocket; the server tells it what changed.
import type { LiveMessage } from '@idle-clash/contracts';

interface Socket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

const OPEN = 1;

export class LiveHub {
  private sockets = new Map<string, Set<Socket>>();

  add(playerId: string, socket: Socket): void {
    const set = this.sockets.get(playerId) ?? new Set();
    set.add(socket);
    this.sockets.set(playerId, set);
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

  /** Open pages, for the "online now" count on the hiscores. */
  get online(): number {
    return this.sockets.size;
  }

  closeAll(): void {
    for (const set of this.sockets.values()) for (const s of set) s.close(1001, 'server stopping');
    this.sockets.clear();
  }
}
