// Combat's slots on the Combat page: the loadout, one row per foe with "Your odds", and the triangle.
// Data comes out formatted; the shell draws it.
import { fmt, GEAR_SLOTS, t, type GearSlot } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import type { Json, SlotFill } from '../define.ts';
import { itemOf } from '../shared/catalog.ts';
import { FOES, HITPOINTS, matchup, STYLE_SKILLS, type Foe } from '../shared/combat/data.ts';
import type { Odds } from '../shared/combat/fight.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { healthAt, healthMax, mealsOf, styleOf, wornIn } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { wearNeeds } from './gear.ts';
import { FEATURE } from './rules.ts';

export interface GearChoice {
  item: string;
  name: string;
  worn: boolean;
  /** "Needs Melee level 10" when it cannot be worn yet. */
  needs: string | null;
}
export interface LoadoutSlot {
  slot: GearSlot;
  label: string;
  item: string | null;
  name: string;
  choices: GearChoice[];
}
export interface LoadoutView {
  style: string | null;
  slots: LoadoutSlot[];
  health: number;
  healthText: string;
  food: string;
}
export interface FoeRow {
  foe: { feature: string; id: string };
  name: string;
  tier: number;
  styleId: string;
  style: string;
  level: string;
  locked: boolean;
  opensAt: string | null;
  matchup: string | null;
  matchupId: string | null;
  verdict: string | null;
  verdictId: string | null;
  facts: string[];
}

/** Your odds against a foe as the state stands (null without a weapon): the simulation picks by it. */
export const yourOdds = (state: State, foe: string): Odds | null => {
  const f = FOES.find((x) => x.id === foe);
  return f ? oddsFor(state, f) : null;
};

const VERDICTS = {
  easy: 'verdict.easy',
  fair: 'verdict.fair',
  costly: 'verdict.costly',
  tooStrong: 'verdict.tooStrong',
};
const MATCHUPS = { advantage: 'matchup.advantage', even: 'matchup.even', disadvantage: 'matchup.disadvantage' };
const SLOTS = { weapon: 'gear.weapon', helm: 'gear.helm', body: 'gear.body', legs: 'gear.legs' };

function loadout(state: State, now: number): LoadoutView {
  const style = styleOf(state);
  const slots = GEAR_SLOTS.map((slot): LoadoutSlot => {
    const item = wornIn(state, slot);
    const choices = Object.keys(state.items)
      .filter((id) => itemOf(id)?.gear?.slot === slot && countOf(state, id) > 0)
      .map((id): GearChoice => {
        const needs = wearNeeds(id)!;
        const short = skillLevel(state, needs.skill) < needs.level;
        return {
          item: id,
          name: t(`item.${id}`),
          worn: id === item,
          needs: short ? t('gear.needs', { skill: t(`skill.${needs.skill}`), level: fmt.int(needs.level) }) : null,
        };
      });
    return {
      slot,
      label: t(SLOTS[slot]),
      item,
      name: item ? t(`item.${item}`) : slot === 'weapon' ? t('gear.noWeapon') : t('gear.none'),
      choices,
    };
  });
  const most = healthMax(state);
  const health = healthAt(state, now);
  const meals = mealsOf(state);
  return {
    style: style ? t(`skill.${style}`) : null,
    slots,
    health: health / most,
    healthText: t('combat.health', { now: fmt.int(health), most: fmt.int(most) }),
    food: meals.length
      ? meals.map((m) => t('action.gives', { item: t(`item.${m.item}`), count: fmt.int(m.count) })).join(', ')
      : t('combat.noFood'),
  };
}

function foeRow(state: State, foe: Foe): FoeRow {
  const locked = skillLevel(state, HITPOINTS) < foe.hitpoints;
  const style = styleOf(state);
  const o = locked ? null : oddsFor(state, foe);
  const mu = style ? matchup(style, foe.style) : null;
  return {
    foe: { feature: FEATURE, id: foe.id },
    name: t(`action.combat.${foe.id}`),
    tier: foe.tier,
    styleId: foe.style,
    style: t(`skill.${foe.style}`),
    level: t('skill.level', { level: fmt.int(foe.level) }),
    locked,
    opensAt: locked ? t('combat.opensAt', { level: fmt.int(foe.hitpoints) }) : null,
    matchup: mu ? t(MATCHUPS[mu]) : null,
    matchupId: mu,
    verdict: o ? t(VERDICTS[o.verdict]) : null,
    verdictId: o?.verdict ?? null,
    facts: o
      ? [
          t('action.xpPerHour', { xp: fmt.int(o.xpPerHour) }),
          t('combat.foodPerHour', { food: fmt.int(o.foodPerHour) }),
          t('combat.goldPerHour', { gold: fmt.int(o.goldPerHour) }),
        ]
      : [],
  };
}

export const SLOTS_FILLED: Record<string, SlotFill> = {
  'combat.loadout': ({ state, now }) => loadout(state, now) as unknown as Json,
  'combat.foes': ({ state }) => FOES.map((f) => foeRow(state, f)) as unknown as Json,
  'combat.triangle': () =>
    STYLE_SKILLS.map((s, i) =>
      t('combat.beats', { style: t(`skill.${s}`), foe: t(`skill.${STYLE_SKILLS[(i + 1) % 3]}`) }),
    ),
};
