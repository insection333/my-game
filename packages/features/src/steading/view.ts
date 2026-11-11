// The steading as the Hearth draws it: each work with its stage, what it gives now, and what its next
// stage costs and gives, with whether the player holds enough of each.
import { fmt, t } from '@idle-clash/content';
import { countOf, type GameEvent, type State } from '@idle-clash/kernel';
import { STAGE_GOLD, STAGES, stageCost, stageOf, WORKS, type Work, type WorkEffect } from '../shared/steading.ts';

export interface WorkCost {
  label: string;
  enough: boolean;
  /** How many the player holds now ("40 held"). */
  held: string;
}
export interface WorkRow {
  id: string;
  name: string;
  stage: number;
  stages: number;
  /** "Raised 2 of 5" or "Not yet built". */
  standing: string;
  /** What it gives now, or (unbuilt) what its first stage would give. */
  gives: string;
  /** The same in a few words, for its tile ("+6% items"); null until built. */
  short: string | null;
  /** Its next raising is held in full. */
  ready: boolean;
  /** The next stage: what it gives in all, and what it costs; null once fully raised. */
  next: { gives: string; cost: WorkCost[]; affordable: boolean } | null;
}
export interface SteadingView {
  /** Shown once the player could build the first work (holds its gold) or has built one. */
  open: boolean;
  rows: WorkRow[];
  /** Each work's stage, for the Hearth's scene. */
  stages: Record<string, number>;
}

const EFFECT: Record<WorkEffect, string> = {
  gatherYield: 'steading.effect.gatherYield',
  artisanSave: 'steading.effect.artisanSave',
  damage: 'steading.effect.damage',
  foodHeal: 'steading.effect.foodHeal',
  marks: 'steading.effect.marks',
  xp: 'steading.effect.xp',
};
const NAME: Record<string, string> = {
  woodyard: 'work.woodyard',
  workshop: 'work.workshop',
  'training-yard': 'work.training-yard',
  smokehouse: 'work.smokehouse',
  watchtower: 'work.watchtower',
  shrine: 'work.shrine',
};
const SHORT: Record<WorkEffect, string> = {
  gatherYield: 'steading.short.gatherYield',
  artisanSave: 'steading.short.artisanSave',
  damage: 'steading.short.damage',
  foodHeal: 'steading.short.foodHeal',
  marks: 'steading.short.marks',
  xp: 'steading.short.xp',
};
const effectAt = (w: Work, stage: number) => t(EFFECT[w.effect], { pct: fmt.pct(w.pct * stage) });

export function steadingView(state: State): SteadingView {
  const rows = WORKS.map((w): WorkRow => {
    const stage = stageOf(state, w.id);
    const cost = stage < STAGES ? stageCost(w, stage + 1) : null;
    const lines: WorkCost[] = cost
      ? [
          {
            label: t('steading.cost.gold', { gold: fmt.int(cost.gold) }),
            enough: countOf(state, 'gold') >= cost.gold,
            held: t('steading.held', { count: fmt.int(countOf(state, 'gold')) }),
          },
          ...cost.items.map((i) => ({
            label: t('steading.cost.item', { count: fmt.int(i.count), item: t(`item.${i.item}`) }),
            enough: countOf(state, i.item) >= i.count,
            held: t('steading.held', { count: fmt.int(countOf(state, i.item)) }),
          })),
        ]
      : [];
    return {
      id: w.id,
      name: t(NAME[w.id]),
      stage,
      stages: STAGES,
      standing:
        stage === 0 ? t('steading.unbuilt') : t('steading.stage', { stage: fmt.int(stage), stages: fmt.int(STAGES) }),
      gives: effectAt(w, Math.max(1, stage)),
      short: stage ? t(SHORT[w.effect], { pct: fmt.pct(w.pct * stage) }) : null,
      ready: lines.length > 0 && lines.every((l) => l.enough),
      next: cost ? { gives: effectAt(w, stage + 1), cost: lines, affordable: lines.every((l) => l.enough) } : null,
    };
  });
  const open = rows.some((r) => r.stage > 0) || countOf(state, 'gold') >= STAGE_GOLD[0];
  return { open, rows, stages: Object.fromEntries(rows.map((r) => [r.id, r.stage])) };
}

/** A work raised, in words (session 76): the stage it reached, or fully raised, and what it now gives. */
export function workRaisedWords(e: Extract<GameEvent, { type: 'workRaised' }>): { title: string; body: string } | null {
  const w = WORKS.find((x) => x.id === e.work);
  if (!w) return null;
  const work = t(NAME[w.id]);
  return {
    title:
      e.stage >= STAGES
        ? t('steading.raisedTop', { work })
        : t('steading.raised', { work, stage: fmt.int(e.stage), stages: fmt.int(STAGES) }),
    body: t('steading.now', { gives: effectAt(w, e.stage) }),
  };
}
