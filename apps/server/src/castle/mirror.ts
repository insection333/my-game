// The castle's edict in its lord's save (DESIGN.md section 7): refreshed from the castle's row before the
// engine runs in every request of the owner's, so time away is played with the edict the castle can pay
// for now. A lord without a castle carries no mirror.
import { castleEngine, totalLevel } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import type { Ctx } from '../context.ts';
import { CastleStore } from './store.ts';

export function mirrored(state: State, castle: castleEngine.Castle | null, now: number): State {
  const has = Object.hasOwn(state.features, 'castle');
  if (!castle) {
    if (!has) return state;
    const { castle: _gone, ...rest } = state.features;
    return { ...state, features: rest };
  }
  const m = castleEngine.mirrorFor(castleEngine.syncCastle(castle, now).castle, totalLevel(state), now);
  const old = castleEngine.mirrorOf(state);
  if (has && old.edict === m.edict && old.pct === m.pct && old.until === m.until) return state;
  return { ...state, features: { ...state.features, castle: m } };
}

/** The save with its castle mirror as of now. */
export const withCastle = (ctx: Ctx, playerId: string, state: State, now: number): State =>
  mirrored(state, new CastleStore(ctx).read(playerId), now);
