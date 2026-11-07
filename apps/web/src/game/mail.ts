// Letters waiting (session 45): how many are unread, for the bell's badge. Read once the game starts and
// kept by the live channel, which says whenever a letter comes or letters are read.
import { useSyncExternalStore } from 'react';
import { api } from '../api.ts';

let unread = 0;
const listeners = new Set<() => void>();

export function setUnreadMail(n: number): void {
  if (n === unread) return;
  unread = n;
  for (const l of listeners) l();
}

export const useUnreadMail = (): number =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => unread,
  );

/** Asks the server how many letters wait (on starting, and on coming back to the page). */
export async function refreshMail(): Promise<void> {
  try {
    setUnreadMail((await api.mail.inbox()).unread);
  } catch {
    /* The bell shows what it last knew; the live channel corrects it. */
  }
}
