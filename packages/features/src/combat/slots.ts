// Combat's slots on the Combat page: the loadout, one row per foe with "Your odds", and the triangle
// as it bears on your style.
// Data comes out formatted; the shell draws it.
import { fmt, GEAR_SLOTS, midSentence, t, type GearSlot, type Style } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import type { Json, SlotFill } from '../define.ts';
import { itemOf } from '../shared/catalog.ts';
import { FOES, HITPOINTS, matchup, regionOf, STYLE_SKILLS, type Foe } from '../shared/combat/data.ts';
import type { Odds } from '../shared/combat/fight.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { healthAt, healthMax, mealsOf, styleOf, supplyOf, wornIn } from '../shared/combat/state.ts';
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
/** The supply in the figure's other hand: what is used, how many are left, or what makes it. */
export interface SupplyView {
  item: string | null;
  label: string;
  name: string;
  /** "+9% damage, one a foe" or where to get some. */
  line: string;
  /** The skill that makes the style's supply. */
  skill: string;
}
export interface LoadoutView {
  style: string | null;
  /** The style's id, for its seal. */
  styleId: string | null;
  slots: LoadoutSlot[];
  health: number;
  healthText: string;
  food: string;
  supply: SupplyView | null;
}
export interface FoeRow {
  foe: { feature: string; id: string };
  name: string;
  tier: number;
  /** The region it is fought in (a tab of the Combat page), and its name. */
  region: string;
  regionName: string;
  /** Its short name, for the tab on a narrow screen. */
  regionShort: string;
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
      name: item
        ? t(`item.${item}`)
        : slot !== 'weapon'
          ? t('gear.none')
          : choices.length
            ? t('gear.wearWeapon')
            : t('gear.noWeapon'),
      choices,
    };
  });
  const most = healthMax(state);
  const health = healthAt(state, now);
  const meals = mealsOf(state);
  return {
    style: style ? t(`skill.${style}`) : null,
    styleId: style,
    slots,
    health: health / most,
    healthText: t('combat.health', { now: fmt.int(health), most: fmt.int(most) }),
    supply: style ? supplyView(state, style) : null,
    food: meals.length
      ? t('combat.carrying', {
          food: meals.map((m) => t('action.gives', { item: t(`item.${m.item}`), count: fmt.int(m.count) })).join(', '),
        })
      : t('combat.noFood'),
  };
}

/** Which skill makes each style's supply, and its name. */
const MAKER = { melee: 'smithing', archery: 'fletching', magic: 'runecraft' } as const;
const SUPPLY_NAME = { melee: 'supply.melee', archery: 'supply.archery', magic: 'supply.magic' } as const;

function supplyView(state: State, style: Style): SupplyView {
  const s = supplyOf(state, style);
  const label = t('gear.supply');
  if (!s)
    return {
      item: null,
      label,
      name: t('supply.none', { supply: midSentence(t(SUPPLY_NAME[style])) }),
      line: t('supply.makes', { skill: t(`skill.${MAKER[style]}`) }),
      skill: MAKER[style],
    };
  return {
    item: s.item,
    label,
    name: t('action.gives', { item: t(`item.${s.item}`), count: fmt.int(countOf(state, s.item)) }),
    line: t('supply.line', { pct: fmt.int(s.pct) }),
    skill: MAKER[style],
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
    region: regionOf(foe.tier),
    regionName: t(`combat.region.${regionOf(foe.tier)}`),
    regionShort: t(`combat.region.${regionOf(foe.tier)}.short`),
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
  // Each style, the one it beats, and the line that says so (the page draws their seals beside it).
  'combat.triangle': ({ state }) => triangle(styleOf(state)) as unknown as Json,
};

/** One part of the triangle's line: a style's seal and the words beside it. */
export interface TrianglePart {
  seal: string;
  text: string;
}

/** The triangle as it bears on you: what your style beats and loses to; without a weapon, all of it. */
export function triangle(style: string | null): TrianglePart[] {
  const at = (i: number) => STYLE_SKILLS[(i + 3) % 3];
  const i = style ? (STYLE_SKILLS as readonly string[]).indexOf(style) : -1;
  if (i < 0)
    return STYLE_SKILLS.map((s, n) => ({
      seal: s,
      text: t('combat.beats', { style: t(`skill.${s}`), foe: t(`skill.${at(n + 1)}`) }),
    }));
  return [
    { seal: at(i + 1), text: t('combat.strongAgainst', { style: t(`skill.${at(i + 1)}`) }) },
    { seal: at(i - 1), text: t('combat.weakAgainst', { style: t(`skill.${at(i - 1)}`) }) },
  ];
}
