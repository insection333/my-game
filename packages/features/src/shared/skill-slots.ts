// The slots every skill fills on its page, the Skills list and the Hearth's "Next up", from the
// skill's ladder and actions. Data comes out already formatted; the shell (session 4) draws it.
import {
  fmt,
  GREATER_FROM_TIER,
  levelProgress,
  MASTERY_STEPS,
  t,
  XP_TABLE,
  type Find,
  type Ladder,
} from '@idle-clash/content';
import { xpOf } from '@idle-clash/kernel';
import type { Json, SlotFill } from '../define.ts';
import { actionMastery, actionModifiers, nextUnlock, skillLevel, unlockText } from './skill.ts';

export interface SkillAction {
  id: string;
  level: number;
  seconds: number;
  xp: number;
  gives: { item: string; count: number }[];
  takes?: { item: string; count: number }[];
}

/** What the skill slots give the shell, so the page can type what it draws. */
export interface SkillSummary {
  skill: string;
  name: string;
  level: string;
  progress: number;
  toNext: string;
  nextUnlock: string | null;
}
export interface SkillActionRow {
  action: { feature: string; id: string };
  name: string;
  locked: boolean;
  opensAt: string | null;
  time: string;
  xpPerHour: string;
  gives: string;
  /** What one repetition uses up, or null when it takes nothing. */
  takes: string | null;
  mastery: string;
  masteryProgress: number;
}
export interface LadderRow {
  level: string;
  reached: boolean;
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
    return {
      skill,
      name: name(),
      level: t('skill.level', { level: fmt.int(p.level) }),
      progress: p.span ? p.into / p.span : 1,
      toNext: p.toNext ? t('skill.toNext', { xp: fmt.int(p.toNext), level: fmt.int(p.level + 1) }) : t('skill.top'),
      nextUnlock: next
        ? t('skill.nextUnlock', {
            level: fmt.int(next.level),
            unlock: next.unlocks.map((u) => unlockText(feature, ladder, u)).join('; '),
          })
        : null,
    };
  };

  const findEntries = (found: Record<string, number>): { [k: string]: Json }[] =>
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
            ? t('find.foundOn', { date: fmt.date(at) })
            : f.greater
              ? t('find.greaterHint', { tier: fmt.int(GREATER_FROM_TIER) })
              : null,
      };
    });

  return {
    'skill.finds': ({ state }) => findEntries(state.found),
    'collection.log': ({ state }) => {
      const finds = findEntries(state.found);
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
    'skill.actions': ({ state }) => {
      const level = skillLevel(state, skill);
      return def.actions.map((a) => {
        const m = actionModifiers(state, skill, ladder, feature, a.id);
        const seconds = a.seconds / (1 + m.speed / 100);
        const step = actionMastery(state, ladder, skill, feature, a.id);
        const done = Object.hasOwn(state.mastery, `${feature}:${a.id}`) ? state.mastery[`${feature}:${a.id}`] : 0;
        const [from, to] = [MASTERY_STEPS[step - 1] ?? 0, MASTERY_STEPS[step] ?? 0];
        return {
          action: { feature, id: a.id },
          name: t(`action.${feature}.${a.id}`),
          locked: level < a.level,
          opensAt: level < a.level ? t('action.opensAt', { level: fmt.int(a.level) }) : null,
          time: fmt.seconds(Math.round(seconds * 100) / 100),
          xpPerHour: t('action.xpPerHour', { xp: fmt.int((a.xp * 3600) / seconds) }),
          gives: a.gives
            .map((g) => t('action.gives', { item: t(`item.${g.item}`), count: fmt.int(g.count) }))
            .join(', '),
          takes: a.takes?.length
            ? t('action.takes', {
                items: a.takes
                  .map((g) => t('action.gives', { item: t(`item.${g.item}`), count: fmt.int(g.count) }))
                  .join(', '),
              })
            : null,
          mastery: t('mastery.step', { step: fmt.int(step) }),
          masteryProgress: to ? Math.min(1, (done - from) / (to - from)) : 1,
        };
      });
    },
    'skill.ladder': ({ state }) => {
      const level = skillLevel(state, skill);
      return ladder.map((unlocks, i) => ({
        level: t('skill.level', { level: fmt.int(i + 1) }),
        reached: i + 1 <= level,
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
      };
    },
  };
}
