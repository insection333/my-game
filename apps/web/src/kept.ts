// What this browser keeps for the player signed in (session 204): the tour's end, when the tray was last
// read and whether notices while away were offered belong to a player, not to the device, so a second
// player on one browser (a family's tablet, a friend's second account) has their own.
let who: string | null = null;

/** Set as a player enters the game, and cleared as they leave it. */
export function keepFor(id: string | null): void {
  who = id;
}

const key = (name: string) => (who ? `${name}:${who}` : name);

/** What is kept under `name` for this player: null if nothing, undefined if this browser keeps nothing. */
export function kept(name: string): string | null | undefined {
  try {
    return localStorage.getItem(key(name));
  } catch {
    return undefined;
  }
}

/** Keeps `value` under `name` for this player; false if this browser keeps nothing. */
export function keep(name: string, value: string): boolean {
  try {
    localStorage.setItem(key(name), value);
    return true;
  } catch {
    return false;
  }
}
