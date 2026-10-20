// defineFeature: the one place a feature declares everything it is. The manifest check reads these
// declarations; a feature missing a part, or filling a slot IA.md does not list, fails verify.
import { Id, Item, Ladder, type Effect, type EffectKind } from '@idle-clash/content';
import type { ActionRules, State } from '@idle-clash/kernel';
import { z, type ZodType } from 'zod';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface SlotContext {
  state: State;
  now: number;
}

/** Data for one slot, already formatted for the screen; the shell draws it with a shared component. */
export type SlotFill = (ctx: SlotContext) => Json;

/**
 * A feature's own route (claim a goal, buy food), mounted by the server at
 * POST /api/f/<feature>/<route>. The server checks the input against `input`, advances the state to
 * now and counts the input, then calls `run`, which must be pure: it returns the new state and an
 * answer for the page.
 */
export interface RouteDef<I = unknown> {
  input: ZodType<I>;
  run: (state: State, input: I, now: number) => { state: State; result: Json };
}

/** Types a route's `run` by its own input schema; the server only calls `run` with parsed input. */
export const defineRoute = <I>(def: RouteDef<I>): RouteDef => def as unknown as RouteDef;

/** An action as content: the level it opens at and, for timed actions, its seconds, XP and output. */
export const ContentAction = z
  .object({
    id: Id,
    level: z.number().int().min(1).max(40),
    seconds: z.number().positive().optional(),
    xp: z.number().int().nonnegative().optional(),
    gives: z.array(z.object({ item: Id, count: z.number().int().positive() }).strict()).optional(),
  })
  .strict();
export type ContentAction = z.infer<typeof ContentAction>;

/** A skill-shaped feature's content: its skill, its actions with their levels, and its unlock ladder. */
export const FeatureContent = z
  .object({
    items: z.array(Item).default([]),
    actions: z.array(ContentAction).default([]),
    skill: z.object({ id: Id, ladder: Ladder }).strict().optional(),
  })
  .strict();
export type FeatureContent = z.input<typeof FeatureContent>;

export interface Feature {
  /** The feature's folder name, and the prefix of its actions and strings. */
  id: string;
  /** Read on the server and passed to the page. Off: its actions cannot start and its slots are hidden. */
  flag: { on: boolean; note: string };
  content: FeatureContent;
  /** Every effect kind the feature's content uses. */
  effects: EffectKind[];
  /** Stop codes its rules may give, beyond the kernel's own. */
  stops: string[];
  /** Action rules by action id. */
  rules: Record<string, ActionRules>;
  routes: Record<string, RouteDef>;
  /** Contributions by slot id from IA.md. */
  slots: Record<string, SlotFill>;
  /** String keys of its entry in the in-game help. */
  help: { title: string; body: string };
}

/** Declares a feature; its content is checked against the shared schemas as it loads. */
export function defineFeature(f: Feature): Feature {
  const parsed = FeatureContent.safeParse(f.content);
  if (!parsed.success) throw new Error(`Feature "${f.id}" has invalid content: ${z.prettifyError(parsed.error)}`);
  return { ...f, content: parsed.data };
}

/** Every effect in a feature's content, for the content check. */
export function effectsIn(f: Feature): Effect[] {
  return (f.content.skill?.ladder ?? []).flat().flatMap((u) => (u.type === 'perk' ? [u.effect] : []));
}
