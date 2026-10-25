// What the lanes just brought in, as the page watches time pass: items gained and XP earned between
// one tick of the page's clock and the next. The shell shows them as they arrive (shell/Gains.tsx).
// Only time passing counts: a change the player makes (a sale, a claim) has its own answer on screen.
import { countOf, xpOf, type State } from '@idle-clash/kernel';

export type Gain = { kind: 'item'; item: string; count: number } | { kind: 'xp'; skill: string; xp: number };

/** Items that rose (gold included) and skills that earned XP, items first. */
export function gainsBetween(before: State, after: State): Gain[] {
  const items: Gain[] = Object.keys(after.items)
    .map((item) => ({ kind: 'item' as const, item, count: countOf(after, item) - countOf(before, item) }))
    .filter((g) => g.count > 0);
  const xp: Gain[] = Object.keys(after.skills)
    .map((skill) => ({ kind: 'xp' as const, skill, xp: xpOf(after, skill) - xpOf(before, skill) }))
    .filter((g) => g.xp >= 0.5);
  return [...items, ...xp];
}

const listeners = new Set<(gains: Gain[]) => void>();

export function onGains(fn: (gains: Gain[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function announceGains(before: State, after: State): void {
  if (!listeners.size) return;
  const gains = gainsBetween(before, after);
  if (gains.length) for (const fn of listeners) fn(gains);
}
