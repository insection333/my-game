// How the Deep reads on the Expeditions tab (session 213): the deepest reached ever and this week, the week's
// omens, where the next descent starts and the pack it carries, how deep that pack should see the fighter
// (Your odds, depth by depth), the next boss and its way; or the descent under way. Null below Hitpoints 99,
// where the level that opens it names it.
import { fmt, midSentence, t } from '@idle-clash/content';
import { actionKey, type State } from '@idle-clash/kernel';
import { HITPOINTS } from '../shared/combat/data.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { bossDepth, deepBoss, deepFoe, DEEP, omensOf, waystoneOf } from '../shared/expeditions/deep.ts';
import { skillLevel } from '../shared/skill.ts';
import { weekEnds, weekOf } from '../shared/week-time.ts';
import { deepOf, foeAt, packOf, packSize } from './deep.ts';
import { inTheDeep } from '../shared/expeditions/deep-relics.ts';
import { hardened } from './stage.ts';
import { bossUnder } from './boss.ts';
import { traitWords, type TwistView } from './views.ts';
import { twistText } from './words.ts';

export interface DeepView {
  /** "Deepest: depth 23", or null before the first descent. */
  deepest: string | null;
  /** "This week: depth 19", or null before one this week. */
  week: string | null;
  omens: TwistView[];
  /** "Until 30 Nov, 11:00" */
  omensUntil: string;
  /** "From depth 20, your deepest waystone" or "From the surface". */
  from: string;
  /** The meals the next descent carries, best first: "30 meals: Shark pie ×30", or "No food carried". */
  pack: string;
  packItem: string | null;
  /** Your odds: "Your pack should see you to about depth 27", or where a boss is likely to hold. */
  reach: string | null;
  boss: { id: string; name: string; depth: string; trait: string | null };
  run: {
    depth: string;
    progress: number;
    meals: string;
    marks: string | null;
    running: boolean;
  } | null;
}

const marks = (n: number) => (n === 1 ? t('expedition.marksOne') : t('expedition.marks', { marks: fmt.int(n) }));

/** An omen's words: only what holds in the Deep (it has no caches, camps or stages to change). */
const omenView = (tw: ReturnType<typeof omensOf>[number]): TwistView => ({
  id: tw.id,
  name: t(`twist.${tw.id}`),
  text: twistText({ ...tw, caches: undefined, camp: undefined, stages: undefined }),
});

/** How deep a pack should go from a depth: meals eaten depth by depth at Your odds' rate, until the pack is
 *  gone, a depth sends the fighter back, or a boss is likely to hold. At most fifty depths ahead. */
export function reachOf(state: State, from: number, fed: number, seq: number, at: number) {
  const mods = omensOf(weekOf(at));
  let left = packSize(state) - fed;
  for (let depth = from + 1; depth <= from + 50; depth++) {
    if (bossDepth(depth)) {
      const o = oddsFor(state, bossUnder(inTheDeep(state, deepBoss(depth)), mods));
      if (!o || o.retreatRate > 0.5) return { depth, held: true };
      left -= (o.foodPerHour * o.secondsPerFight) / 3600;
    } else {
      const base = foeAt(state, depth, seq);
      const o = base && oddsFor(state, inTheDeep(state, hardened(deepFoe(base, depth), mods)));
      if (!o || o.verdict === 'tooStrong') return { depth: depth - 1, held: false };
      left -= (o.foodPerHour * DEEP.STAGE_MINUTES) / 60;
    }
    if (left < 0) return { depth: depth - 1, held: false };
  }
  return { depth: from + 50, held: false };
}

export function deepView(state: State, now: number): DeepView | null {
  if (skillLevel(state, HITPOINTS) < DEEP.OPENS) return null;
  const d = deepOf(state);
  const run = d.run;
  const start = run ? run.depth : waystoneOf(d.deepest);
  const fed = run?.fed ?? 0;
  const pack = packOf(state, fed);
  const count = pack.reduce((a, m) => a + m.count, 0);
  const nextBoss = (Math.floor(start / DEEP.EVERY) + 1) * DEEP.EVERY;
  const boss = deepBoss(nextBoss);
  const reach = count > 0 ? reachOf(state, start, fed, run?.seq ?? d.descents, now) : null;
  const running =
    state.lanes.combat.current !== null && actionKey(state.lanes.combat.current.action) === 'expeditions:deep';
  return {
    deepest: d.deepest > 0 ? t('deep.deepest', { depth: fmt.int(d.deepest) }) : null,
    week: d.week === weekOf(now) && d.weekDeepest > 0 ? t('deep.week', { depth: fmt.int(d.weekDeepest) }) : null,
    omens: omensOf(weekOf(now)).map(omenView),
    omensUntil: t('deep.omensUntil', { when: fmt.when(weekEnds(now), now) }),
    from: start > 0 ? t('deep.from', { depth: fmt.int(start) }) : t('deep.fromSurface'),
    pack:
      count === 0
        ? t('deep.packNone')
        : t('deep.pack', {
            meals: count === 1 ? t('deep.mealsOne') : t('deep.meals', { count: fmt.int(count) }),
            food: pack.map((m) => `${t(`item.${m.item}`)} ×${fmt.int(m.count)}`).join(', '),
          }),
    packItem: pack[0]?.item ?? null,
    reach: !reach
      ? null
      : reach.held
        ? t('deep.reachHeld', { boss: midSentence(t(`boss.${deepBoss(reach.depth).id}`)), depth: fmt.int(reach.depth) })
        : reach.depth <= start
          ? t('deep.reachNone')
          : t('deep.reach', { depth: fmt.int(reach.depth) }),
    boss: {
      id: boss.id,
      name: t(`boss.${boss.id}`),
      depth: t('deep.bossAt', { depth: fmt.int(nextBoss) }),
      trait: traitWords(boss),
    },
    run: run && {
      // The depth under way (or next, while the lane is elsewhere).
      depth: t('deep.at', { depth: fmt.int(run.depth + 1) }),
      // Towards the next boss and waystone.
      progress: (run.depth % DEEP.EVERY) / DEEP.EVERY,
      meals: t('deep.mealsLeft', { left: fmt.int(Math.max(0, packSize(state) - fed)), pack: fmt.int(packSize(state)) }),
      marks: run.marks > 0 ? t('deep.marksSoFar', { marks: marks(run.marks) }) : null,
      running,
    },
  };
}
