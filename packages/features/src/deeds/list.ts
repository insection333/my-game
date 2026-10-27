// Every deed, made once from the content the first time it is asked for (after the registry has
// loaded every feature), and the categories the Deeds tab lists them under.
import type { State } from '@idle-clash/kernel';
import { POINTS, type Deed } from './content.ts';
import { combat, craft, skills } from './families.ts';
import { finds, home } from './families-home.ts';
import { Reader } from './reader.ts';
import { deedsOf } from './state.ts';

/** The Deeds tab's categories, each with its families in the order they are listed. */
export const CATEGORIES: readonly { id: string; families: readonly string[] }[] = [
  { id: 'skills', families: ['level', 'rank'] },
  { id: 'craft', families: ['work', 'mastery', 'masters'] },
  { id: 'combat', families: ['foe', 'region', 'defeats', 'gear'] },
  { id: 'finds', families: ['legendary', 'log', 'collector'] },
  { id: 'home', families: ['fire', 'gold', 'store', 'hidden'] },
];

let made: { list: Deed[]; byId: Map<string, Deed> } | null = null;
function make() {
  if (!made) {
    const list = [...skills(), ...craft(), ...combat(), ...finds(), ...home()];
    made = { list, byId: new Map(list.map((d) => [d.id, d])) };
  }
  return made;
}

export const deedList = (): readonly Deed[] => make().list;
export const deedById = (id: string): Deed | undefined => make().byId.get(id);

/** Every deed's points, all told: what the titles' thresholds are measured against. */
export const allPoints = (): number => deedList().reduce((n, d) => n + POINTS[d.tier], 0);

/** The points of the deeds done. */
export function pointsOf(state: State): number {
  const done = deedsOf(state).done;
  return deedList().reduce((n, d) => n + (Object.hasOwn(done, d.id) ? POINTS[d.tier] : 0), 0);
}

/** Deeds done by now but not yet recorded. */
export function pending(state: State, now: number): Deed[] {
  const done = deedsOf(state).done;
  const r = new Reader(state, now);
  return deedList().filter((d) => !Object.hasOwn(done, d.id) && d.measure(r) >= d.target);
}
