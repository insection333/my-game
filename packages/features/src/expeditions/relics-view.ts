// How relics read: the marks held, and each relic with its rank, what it gives now, and its next rank's
// price. The bosses' finds, as the collection log's group of its own.
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { BOSSES } from '../shared/expeditions/data.ts';
import { RELIC_COSTS, rankOf, relics, type RelicEffect } from '../shared/expeditions/relics.ts';
import { expeditionsOf } from '../shared/expeditions/state.ts';
import type { CollectionGroup } from '../shared/skill-slots.ts';

export interface RelicRow {
  id: string;
  name: string;
  /** "Rank 2 of 5" */
  rank: string;
  /** What it gives at its rank now ("+2% Woodcutting XP"), or at its first rank while unbought. */
  effect: string;
  /** What its next rank costs ("Next rank: 50 marks"), or null at its last rank. */
  raise: string | null;
  affordable: boolean;
}
export interface RelicsView {
  marks: string;
  relics: RelicRow[];
}

function effectText(e: RelicEffect, rank: number): string {
  const n = Math.max(1, rank);
  switch (e.kind) {
    case 'xp':
      return t('relic.effect.xp', { pct: fmt.pct(e.pct * n), skill: t(`skill.${e.skill}`) });
    case 'foodHeal':
      return t('relic.effect.foodHeal', { pct: fmt.pct(e.pct * n) });
    case 'finds':
      return t('relic.effect.finds', { pct: fmt.pct(e.pct * n) });
    case 'slots':
      return t('relic.effect.slots', { slots: fmt.int(e.amount * n) });
  }
}

export function relicsView(state: State): RelicsView {
  const marks = expeditionsOf(state).marks;
  return {
    marks: t('expedition.marks', { marks: fmt.int(marks) }),
    relics: relics().map((r) => {
      const rank = rankOf(state, r.id);
      const cost = rank < r.ranks ? RELIC_COSTS[rank] : null;
      return {
        id: r.id,
        name: t(`relic.${r.id}`),
        rank: t('relic.rank', { rank: fmt.int(rank), ranks: fmt.int(r.ranks) }),
        effect: effectText(r.effect, rank),
        raise: cost === null ? null : t('relic.next', { marks: fmt.int(cost) }),
        affordable: cost !== null && marks >= cost,
      };
    }),
  };
}

/** The bosses' finds, found or silhouetted, as one group of the collection log. */
export function bossLog(state: State): CollectionGroup {
  const finds = BOSSES.flatMap((b) =>
    (['rare', 'legendary'] as const).map((rarity) => {
      const item = b.finds[rarity];
      const at = Object.hasOwn(state.found, item) ? state.found[item] : null;
      return {
        item,
        name: t(`item.${item}`),
        rarity: t(`rarity.${rarity}`),
        rarityId: rarity,
        found: at !== null,
        note: at !== null ? t('find.foundOn', { date: fmt.date(at) }) : t('boss.findHint', { boss: t(`boss.${b.id}`) }),
      };
    }),
  );
  return {
    skill: 'expeditions',
    name: t('boss.log'),
    progress: t('collection.progress', {
      found: fmt.int(finds.filter((f) => f.found).length),
      total: fmt.int(finds.length),
    }),
    finds,
  };
}
