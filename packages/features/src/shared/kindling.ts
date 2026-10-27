// Kindling (GAME_DESIGN.md section 4, step 17): past 99 a skill's XP keeps counting, and every
// KINDLE_XP of it is a Kindling: a flame on its seal, a place on its ladder, and, for the first five, a
// stronger Path. At 99 each skill with work of its own takes a Path, changed whenever the player likes:
// Bounty (more of what it makes), Lore (more XP) or Fortune (more finds). Nothing is ever taken away.
// Shared, because every skill's completions and every fight read their skill's Path. Verify compares
// these numbers with the paper model's (design/model/kindling.ts).
import { MAX_LEVEL, XP_TABLE } from '@idle-clash/content';
import { xpOf, type ActionContext, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { skillActions } from './catalog.ts';
import { STYLE_SKILLS } from './combat/data.ts';
import { skillLevel } from './skill.ts';

export const KINDLE_XP = 37_000_000;
export const KINDLINGS_THAT_STRENGTHEN = 5;

export type PathRaises = 'items' | 'xp' | 'finds';
export interface Path {
  id: string;
  raises: PathRaises;
  /** Its bonus at 99 in percent, and how much more each of the first five Kindlings adds. */
  pct: number;
  perKindling: number;
}
export const PATHS: readonly Path[] = [
  { id: 'bounty', raises: 'items', pct: 15, perKindling: 3 },
  { id: 'lore', raises: 'xp', pct: 15, perKindling: 3 },
  { id: 'fortune', raises: 'finds', pct: 50, perKindling: 10 },
];
export const pathById = (id: string) => PATHS.find((p) => p.id === id);
export const pathPct = (p: Path, kindlings: number) =>
  p.pct + p.perKindling * Math.min(kindlings, KINDLINGS_THAT_STRENGTHEN);

/** Kindlings an amount of XP makes: none below 99, then one for each KINDLE_XP past it. */
export const kindlingsIn = (xp: number) =>
  xp > XP_TABLE[MAX_LEVEL] ? Math.floor((xp - XP_TABLE[MAX_LEVEL]) / KINDLE_XP) : 0;
export const kindlings = (state: State, skill: string) => kindlingsIn(xpOf(state, skill));

/** Skills that take a Path: those with work of their own, and the three styles (Hitpoints rises with
 *  them, so it has none of its own). */
export const pathSkills = (): string[] => [...skillActions().map((s) => s.skill), ...STYLE_SKILLS];

export const KindlingState = z
  .object({ paths: z.record(z.string().regex(/^[a-z][a-z-]{0,31}$/), z.enum(['bounty', 'lore', 'fortune'])) })
  .strict();
export type KindlingState = z.infer<typeof KindlingState>;
const EMPTY: KindlingState = Object.freeze({ paths: Object.freeze({}) });
const checked = new WeakMap<object, KindlingState>();

export function kindlingOf(state: State): KindlingState {
  const raw = Object.hasOwn(state.features, 'kindling') ? state.features.kindling : undefined;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const known = checked.get(raw);
  if (known) return known;
  const parsed = KindlingState.safeParse(raw);
  const k = parsed.success ? parsed.data : EMPTY;
  checked.set(raw, k);
  return k;
}

/** The Path a skill walks: only at 99, and only one it has chosen. */
export function pathOf(state: State, skill: string): Path | null {
  const paths = kindlingOf(state).paths;
  if (!Object.hasOwn(paths, skill) || skillLevel(state, skill) < MAX_LEVEL) return null;
  return pathById(paths[skill]) ?? null;
}

/** What a skill's Path adds to one thing it pays, in percent (0 off its Path). */
export function pathBonus(state: State, skill: string, raises: PathRaises): number {
  const p = pathOf(state, skill);
  return p && p.raises === raises ? pathPct(p, kindlings(state, skill)) : 0;
}

/** After XP is added: a new Kindling has its moment. */
export function announceKindling(ctx: ActionContext, skill: string, xpBefore: number) {
  const [before, after] = [kindlingsIn(xpBefore), kindlings(ctx.state, skill)];
  if (after > before) ctx.emit({ type: 'kindled', at: ctx.at, skill, count: after });
}
