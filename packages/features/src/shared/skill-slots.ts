// The slots every skill fills on its page, the Skills list and the Hearth's "Next up", from the
// skill's ladder and actions. Data comes out already formatted; the shell (session 4) draws it.
import {
  fmt,
  GREATER_FROM_TIER,
  levelProgress,
  MASTERY_STEPS,
  MAX_LEVEL,
  tierOf,
  t,
  XP_TABLE,
  type Find,
  type Ladder,
} from '@idle-clash/content';
import { KINDLE_XP, kindlingsIn } from './kindling.ts';
import { countOf, xpOf } from '@idle-clash/kernel';
import type { Json, SlotFill } from '../define.ts';
import { actionMastery, actionModifiers, nextUnlock, skillLevel, unlockText } from './skill.ts';
import { extraYieldPct, xpBonusPct } from './complete.ts';
import { itemOf } from './catalog.ts';
import { STYLE_SKILLS } from './combat/data.ts';
import { healsFor } from './combat/state.ts';

export interface SkillAction {
  id: string;
  level: number;
  seconds: number;
  xp: number;
  gives: { item: string; count: number }[];
  takes?: { item: string; count: number }[];
  /** What it needs to have but keeps (a standing stone's key). */
  needs?: { item: string }[];
}

/** What the skill slots give the shell, so the page can type what it draws. */
export interface SkillSummary {
  skill: string;
  name: string;
  level: string;
  progress: number;
  toNext: string;
  nextUnlock: string | null;
  /** The highest tier reached, for the seal's rim, and whether the skill is at the top level. */
  tier: number;
  top: boolean;
  /** Kindlings earned past 99: a flame each on the seal. */
  kindlings: number;
}
export interface SkillActionRow {
  action: { feature: string; id: string };
  /** The tier the action belongs to (tiers open at levels 1, 10, 20 and 30). */
  tier: number;
  name: string;
  locked: boolean;
  opensAt: string | null;
  time: string;
  xpPerHour: string;
  gives: string;
  /** What one repetition uses up, or null when it takes nothing. */
  takes: string | null;
  /** What it needs and keeps, and whether it is held ("Needs Iron key (kept)"), or null (session 102). */
  needs: string | null;
  /** What the food it makes heals in your fights ("Each heals 161"), or null when it makes no food. */
  heals: string | null;
  mastery: string;
  /** The mastery step reached, 0 to 10. */
  masteryStep: number;
  masteryProgress: number;
}
export interface LadderRow {
  level: string;
  reached: boolean;
  /** The level the player stands at, marked on the ladder (session 100). */
  current: boolean;
  unlocks: string[];
}
/** One find as the skill page and the collection log show it: found, or a silhouette. */
export interface FindEntry {
  item: string;
  name: string;
  rarity: string;
  rarityId: string;
  found: boolean;
  /** "Found 20 Oct 2026", where a greater find comes from, or nothing. */
  note: string | null;
}
export interface CollectionGroup {
  skill: string;
  name: string;
  progress: string;
  finds: FindEntry[];
}
export interface NextUpRow {
  skill: string;
  text: string;
  away: string;
  /** XP still to earn, for choosing the nearest three. */
  xpAway: number;
}

export interface SkillDef {
  feature: string;
  skill: string;
  ladder: Ladder;
  finds: readonly Find[];
  actions: SkillAction[];
}

export function skillSlots(def: SkillDef): Record<string, SlotFill> {
  const { feature, skill, ladder } = def;
  const name = () => t(`skill.${skill}`);

  const summary = (xp: number): { [k: string]: Json } => {
    const p = levelProgress(xp);
    const next = nextUnlock(ladder, p.level);
    // Past 99 the bar runs on towards the next Kindling.
    const k = kindlingsIn(xp);
    const past = p.toNext ? 0 : Math.max(0, xp - XP_TABLE[MAX_LEVEL]) - k * KINDLE_XP;
    return {
      skill,
      name: name(),
      level: t('skill.level', { level: fmt.int(p.level) }),
      progress: p.span ? p.into / p.span : past / KINDLE_XP,
      toNext: p.toNext
        ? t('skill.toNext', { xp: fmt.int(p.toNext), level: fmt.int(p.level + 1) })
        : t('kindling.toNext', { xp: fmt.int(KINDLE_XP - past) }),
      nextUnlock: next
        ? t('skill.nextUnlock', {
            level: fmt.int(next.level),
            unlock: next.unlocks.map((u) => unlockText(feature, ladder, u)).join('; '),
          })
        : null,
      tier: tierOf(p.level),
      top: p.level === MAX_LEVEL,
      kindlings: k,
    };
  };

  // A combat style's finds come from foes (sessions 65 and 83), a skill's from its actions.
  const style = (STYLE_SKILLS as readonly string[]).includes(skill);
  const findEntries = (found: Record<string, number>, now: number): { [k: string]: Json }[] =>
    def.finds.map((f) => {
      const at = Object.hasOwn(found, f.item) ? found[f.item] : null;
      return {
        item: f.item,
        name: t(`item.${f.item}`),
        rarity: t(`rarity.${f.rarity}`),
        rarityId: f.rarity,
        found: at !== null,
        note:
          at !== null
            ? t('find.foundOn', { date: fmt.day(at, now) })
            : f.greater
              ? t(style ? 'find.greaterFoe' : 'find.greaterHint', { tier: fmt.int(GREATER_FROM_TIER) })
              : t(style ? 'find.anyFoe' : 'find.anyAction', { skill: t(`skill.${skill}`) }),
      };
    });

  return {
    'skill.finds': ({ state, now }) => findEntries(state.found, now),
    'collection.log': ({ state, now }) => {
      const finds = findEntries(state.found, now);
      return {
        skill,
        name: name(),
        progress: t('collection.progress', {
          found: fmt.int(finds.filter((f) => f.found).length),
          total: fmt.int(finds.length),
        }),
        finds,
      };
    },
    'skills.list': ({ state }) => summary(xpOf(state, skill)),
    'skill.header': ({ state }) => summary(xpOf(state, skill)),
    'skill.actions': ({ state, now }) => {
      const level = skillLevel(state, skill);
      // The XP an hour each row states is what the lane pays now, every gain counted.
      const gain = 1 + xpBonusPct(state, skill, def.finds, now) / 100;
      return def.actions.map((a) => {
        const m = actionModifiers(state, skill, ladder, feature, a.id);
        const food = a.gives.map((g) => itemOf(g.item)?.heals).find((h) => h !== undefined);
        const seconds = a.seconds / (1 + m.speed / 100);
        const step = actionMastery(state, ladder, skill, feature, a.id);
        const done = Object.hasOwn(state.mastery, `${feature}:${a.id}`) ? state.mastery[`${feature}:${a.id}`] : 0;
        const [from, to] = [MASTERY_STEPS[step - 1] ?? 0, MASTERY_STEPS[step] ?? 0];
        return {
          action: { feature, id: a.id },
          tier: tierOf(a.level),
          name: t(`action.${feature}.${a.id}`),
          locked: level < a.level,
          opensAt: level < a.level ? t('action.opensAt', { level: fmt.int(a.level) }) : null,
          time: fmt.seconds(Math.round(seconds * 100) / 100),
          xpPerHour: t('action.xpPerHour', { xp: fmt.int((a.xp * gain * 3600) / seconds) }),
          // What a repetition pays on average where it is more than the base (session 70).
          gives: a.gives
            .map((g) =>
              givesText(
                t(`item.${g.item}`),
                g.count,
                extraYieldPct(state, skill, m.extraYield, !!a.takes?.length, g.count),
              ),
            )
            .join(', '),
          takes: a.takes?.length
            ? t('action.takes', {
                items: a.takes
                  .map((g) => t('action.gives', { item: t(`item.${g.item}`), count: fmt.int(g.count) }))
                  .join(', '),
              })
            : null,
          needs: a.needs?.length
            ? t(a.needs.every((n) => countOf(state, n.item) > 0) ? 'action.needs' : 'action.needsMissing', {
                items: a.needs.map((n) => t(`item.${n.item}`)).join(', '),
              })
            : null,
          heals: food === undefined ? null : t('action.heals', { health: fmt.int(healsFor(state, food)) }),
          mastery: t('mastery.step', { step: fmt.int(step) }),
          masteryStep: step,
          masteryProgress: to ? Math.min(1, (done - from) / (to - from)) : 1,
        };
      });
    },
    'skill.ladder': ({ state }) => {
      const level = skillLevel(state, skill);
      return ladder.map((unlocks, i) => ({
        level: t('skill.level', { level: fmt.int(i + 1) }),
        reached: i + 1 <= level,
        current: i + 1 === level,
        unlocks: unlocks.map((u) => unlockText(feature, ladder, u)),
      }));
    },
    'hearth.nextUp': ({ state }) => {
      const xp = xpOf(state, skill);
      const p = levelProgress(xp);
      const next = nextUnlock(ladder, p.level);
      if (!next) return null;
      return {
        skill,
        text: t('skill.nextUnlock', {
          level: fmt.int(next.level),
          unlock: next.unlocks.map((u) => unlockText(feature, ladder, u)).join('; '),
        }),
        away: t('skill.xpAway', { xp: fmt.int(Math.max(0, XP_TABLE[next.level] - xp)) }),
        xpAway: Math.max(0, XP_TABLE[next.level] - xp),
      };
    },
  };
}

/** What an action gives, in words (session 70): its base count and the percent chance of more. Whole extra
 *  items are paid every time ("×2"); a part of one, on average to a tenth ("×3.2 on average"); an extra
 *  too small to show, the base alone. */
export function givesText(item: string, count: number, extraPct: number): string {
  if (extraPct % 100 === 0) return t('action.gives', { item, count: fmt.int(count + extraPct / 100) });
  const shown = Math.round((count + extraPct / 100) * 10) / 10;
  return shown > count
    ? t('action.givesAverage', { item, count: fmt.num(shown) })
    : t('action.gives', { item, count: fmt.int(count) });
}
