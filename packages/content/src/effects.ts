// Effect kinds: what perks, mastery and (later) gear do. Every kind has a schema, a handler (how it
// changes an action's modifiers) and a formatter (its text, from its numbers). EFFECTS is typed by
// kind, so a kind without a handler or formatter does not compile.
import { z } from 'zod';
import { fmt } from './numbers.ts';
import { t } from './t.ts';

const pct = z.number().positive().max(100);
const pctEffect = <K extends string>(kind: K) => z.object({ kind: z.literal(kind), pct }).strict();

export const Effect = z.discriminatedUnion('kind', [
  pctEffect('speed'),
  pctEffect('extraYield'),
  pctEffect('findChance'),
  pctEffect('masteryGain'),
  pctEffect('saveInput'),
  pctEffect('damage'),
  pctEffect('accuracy'),
  pctEffect('guard'),
  pctEffect('spoils'),
  z.object({ kind: z.literal('maxHealth'), amount: z.number().int().positive() }).strict(),
  pctEffect('regen'),
  pctEffect('foodHeal'),
  pctEffect('retreatAt'),
]);
export type Effect = z.infer<typeof Effect>;
export type EffectKind = Effect['kind'];
export type EffectOf<K extends EffectKind> = Extract<Effect, { kind: K }>;

/** The summed changes an action runs with. Zero means no change. */
export type Modifiers = Record<EffectKind, number>;

/** Where a fighter retreats without the Stubborn perk: below this share of health. */
export const BASE_RETREAT_PCT = 20;

export interface EffectDef<K extends EffectKind> {
  apply(m: Modifiers, e: EffectOf<K>): void;
  format(e: EffectOf<K>): string;
}

const adds =
  <K extends EffectKind>(key: K) =>
  (m: Modifiers, e: EffectOf<K>) => {
    m[key] += (e as { pct: number }).pct;
  };
const says =
  <K extends EffectKind>(key: K) =>
  (e: EffectOf<K>) =>
    t(`effect.${key}`, { pct: fmt.pct((e as { pct: number }).pct) });

export const EFFECTS: { [K in EffectKind]: EffectDef<K> } = {
  speed: { apply: adds('speed'), format: says('speed') },
  extraYield: { apply: adds('extraYield'), format: says('extraYield') },
  findChance: { apply: adds('findChance'), format: says('findChance') },
  masteryGain: { apply: adds('masteryGain'), format: says('masteryGain') },
  saveInput: { apply: adds('saveInput'), format: says('saveInput') },
  damage: { apply: adds('damage'), format: says('damage') },
  accuracy: { apply: adds('accuracy'), format: says('accuracy') },
  guard: { apply: adds('guard'), format: says('guard') },
  spoils: { apply: adds('spoils'), format: says('spoils') },
  maxHealth: {
    apply: (m, e) => void (m.maxHealth += e.amount),
    format: (e) => t('effect.maxHealth', { amount: fmt.int(e.amount) }),
  },
  regen: { apply: adds('regen'), format: says('regen') },
  foodHeal: { apply: adds('foodHeal'), format: says('foodHeal') },
  retreatAt: {
    // The lowest retreat point wins; perks do not add up here.
    apply: (m, e) => void (m.retreatAt = m.retreatAt ? Math.min(m.retreatAt, e.pct) : e.pct),
    format: (e) => t('effect.retreatAt', { pct: fmt.pct(e.pct), base: fmt.pct(BASE_RETREAT_PCT) }),
  },
};

export const EFFECT_KINDS = Object.keys(EFFECTS) as EffectKind[];

export const noModifiers = (): Modifiers => Object.fromEntries(EFFECT_KINDS.map((k) => [k, 0])) as Modifiers;

const defOf = <K extends EffectKind>(e: EffectOf<K>): EffectDef<K> => EFFECTS[e.kind];

export function applyEffects(effects: readonly Effect[], into: Modifiers = noModifiers()): Modifiers {
  for (const e of effects) defOf(e).apply(into, e);
  return into;
}

export const formatEffect = (e: Effect): string => defOf(e).format(e);
