// Notable moments as the page shows them (GAME_DESIGN.md section 11): events within 5 seconds of each
// other show together, led by the best. Levels and Legendary finds take the centre of the screen;
// Rare finds and mastery steps a banner; Uncommon finds and goals a small toast.
import { fmt, formatEffect, masteryEffects, t } from '@idle-clash/content';
import { skill as skillKit, type Feature } from '@idle-clash/features';
import { isNotable, type GameEvent } from '@idle-clash/kernel';

export type MomentSize = 'centre' | 'banner' | 'toast';

export interface MomentView {
  /** Stable while the moment shows: the time of its first event. */
  key: string;
  size: MomentSize;
  /** An item to draw beside it (a find), if any. */
  icon: string | null;
  title: string;
  body: string | null;
  /** When it should go: some seconds after its last event. */
  until: number;
}

const GROUP_MS = 5000;
const SHOW_MS: Record<MomentSize, number> = { centre: 6000, banner: 5000, toast: 4000 };
const SIZE_RANK: MomentSize[] = ['toast', 'banner', 'centre'];

/** Best first: Legendary, a new collection entry, a level, Rare, a mastery step, a goal, Uncommon. */
function rank(e: GameEvent): number {
  if (e.type === 'find') return e.rarity === 'legendary' ? 0 : e.first ? 1 : e.rarity === 'rare' ? 3 : 6;
  return e.type === 'levelUp' ? 2 : e.type === 'masteryStep' ? 4 : 5;
}

function sizeOf(e: GameEvent): MomentSize {
  if (e.type === 'levelUp' || (e.type === 'find' && e.rarity === 'legendary')) return 'centre';
  if (e.type === 'masteryStep' || (e.type === 'find' && e.rarity === 'rare')) return 'banner';
  return 'toast';
}

function describe(
  e: GameEvent,
  features: readonly Feature[],
): { title: string; body: string | null; icon: string | null } {
  switch (e.type) {
    case 'levelUp': {
      const f = features.find((x) => x.content.skill?.id === e.skill);
      const ladder = f?.content.skill?.ladder;
      const unlocks = f && ladder ? (ladder[e.level - 1] ?? []).map((u) => skillKit.unlockText(f.id, ladder, u)) : [];
      return {
        title: t('moment.levelUp', { skill: t(`skill.${e.skill}`), level: fmt.int(e.level) }),
        body: unlocks.length ? t('moment.unlocked', { unlock: unlocks.join('; ') }) : null,
        icon: null,
      };
    }
    case 'find':
      return {
        title: t('moment.find', { rarity: t(`rarity.${e.rarity}`), item: t(`item.${e.item}`) }),
        body: e.first ? t('moment.find.first') : null,
        icon: e.item,
      };
    case 'masteryStep':
      return {
        title: t('moment.masteryStep', {
          action: t(`action.${e.action.feature}.${e.action.id}`),
          step: fmt.int(e.step),
        }),
        body: masteryEffects(e.step).map(formatEffect).join(', '),
        icon: null,
      };
    case 'goalDone':
      return { title: t('moment.goalDone', { goal: t(`goal.${e.goal}`) }), body: null, icon: null };
    default:
      return { title: '', body: null, icon: null };
  }
}

/** The moments to show for events after `since`, newest last. */
export function momentsFrom(events: readonly GameEvent[], since: number, features: readonly Feature[]): MomentView[] {
  const notable = events.filter((e) => e.at > since && isNotable(e)).sort((a, b) => a.at - b.at);
  const groups: GameEvent[][] = [];
  for (const e of notable) {
    const last = groups.at(-1);
    if (last && e.at - last[0].at <= GROUP_MS) last.push(e);
    else groups.push([e]);
  }
  return groups.map((group) => {
    const ordered = [...group].sort((a, b) => rank(a) - rank(b));
    const best = describe(ordered[0], features);
    const size = group.map(sizeOf).reduce((a, b) => (SIZE_RANK.indexOf(b) > SIZE_RANK.indexOf(a) ? b : a));
    const also = ordered.slice(1).map((e) => describe(e, features).title);
    const body = [best.body, also.length ? t('moment.also', { what: also.join('; ') }) : null].filter(Boolean);
    return {
      key: String(group[0].at),
      size,
      icon: best.icon ?? ordered.map((e) => describe(e, features).icon).find(Boolean) ?? null,
      title: best.title,
      body: body.length ? body.join(' ') : null,
      until: group.at(-1)!.at + SHOW_MS[size],
    };
  });
}
