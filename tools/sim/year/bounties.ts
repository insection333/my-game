// The bounty board as a player uses it (session 180): a bounty done is claimed; with none held, the day's
// bounty on the foe the Combat lane already fights is taken, so the board pays for the fighting a player
// does anyway, never steering it. Each through the feature's own routes, as the page sends them.
import { FEATURES, type BountyView } from '@idle-clash/features';
import type { GameEvent, State } from '@idle-clash/kernel';

const combat = FEATURES.find((f) => f.id === 'combat')!;
type Ran = { state: State; events?: GameEvent[] };

export function bounties(state: State, now: number): { state: State; events: GameEvent[] } {
  const view = combat.slots['combat.bounty']({ state, now }) as unknown as BountyView | null;
  if (!view) return { state, events: [] };
  if (view.held?.done) {
    const r = combat.routes.bountyClaim.run(state, {}, now) as Ran;
    return { state: r.state, events: r.events ?? [] };
  }
  const fighting = state.lanes.combat.current?.action;
  const offer = !view.held && fighting?.feature === 'combat' && view.offers.find((o) => o.foe === fighting.id);
  if (!offer) return { state, events: [] };
  const r = combat.routes.bounty.run(state, { foe: offer.foe }, now) as Ran;
  return { state: r.state, events: r.events ?? [] };
}
