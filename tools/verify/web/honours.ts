// Deeds for the screenshots' players: every deed they will have done by the time the page opens is
// already recorded (worked out on their save run on to `now`), so no deed's moment covers a page as
// it is measured; and each shows the best title, banner and frame their deeds have opened.
import { FEATURES, type HonoursView } from '@idle-clash/features';
import { seeded, type State } from '@idle-clash/kernel';
import type { Ctx } from '../../../apps/server/src/context.ts';

const deeds = FEATURES.find((f) => f.id === 'deeds')!;

export function withHonours(ctx: Ctx, state: State, now: number): State {
  const ahead = ctx.engine.advance(state, now, seeded(state.seed)).state;
  let recorded = deeds.routes.refresh.run(ahead, {}, now).state;
  const view = deeds.slots['hiscores.honours']({ state: recorded, now }) as unknown as HonoursView;
  for (const choice of view.choices) {
    const best = choice.options.filter((o) => o.open && o.id !== null).at(-1);
    if (best) recorded = deeds.routes.choose.run(recorded, { kind: choice.kind, id: best.id }, now).state;
  }
  return { ...state, features: { ...state.features, deeds: recorded.features.deeds } };
}
