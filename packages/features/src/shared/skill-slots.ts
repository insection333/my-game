// The slots every skill fills on its page, the Skills list and the Hearth's "Next up", from the
// skill's ladder and actions. Data comes out already formatted; the shell (session 4) draws it.
import { fmt, levelProgress, MASTERY_STEPS, t, XP_TABLE, type Ladder } from '@idle-clash/content';
import { xpOf } from '@idle-clash/kernel';
import type { Json, SlotFill } from '../define.ts';
import { actionMastery, actionModifiers, nextUnlock, skillLevel, unlockText } from './skill.ts';

export interface SkillAction {
  id: string;
  level: number;
  seconds: number;
  xp: number;
  gives: { item: string; count: number }[];
}

export interface SkillDef {
  feature: string;
  skill: string;
  ladder: Ladder;
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

  return {
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
