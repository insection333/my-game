// The day's bosses (session 239): one press on the Expeditions tab or the Hearth sets the day's fights, the
// realm's boss while its strike waits today and every boss the player fares well against (Easy or Fair) that
// has not been fought today, and the Combat lane fights them one after another as `expeditions:bosses`, each
// through its own rules, so it pays, rests and is said as a boss fought alone is. Done, the lane rests
// quietly and a Next queued takes over. Where six presses (and a press each time one ended) asked for each.
import { fmt, t } from '@idle-clash/content';
import { actionKey, type ActionRules, type GameEvent, type State } from '@idle-clash/kernel';
import { realmBossIn, realmOf } from '../shared/realm.ts';
import { dayOf, roundLeft, roundOn } from '../shared/expeditions/round.ts';
import { expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';
import { realmView } from './realm.ts';
import { bossRows } from './views.ts';

/** The fights the day's bosses would take on now, in the order fought: the realm's first. */
export function roundFoes(state: State, now: number): string[] {
  const realm = realmView(state, now);
  const r = realmOf(state);
  const bosses = bossRows(state, now)
    .filter((b) => b.ready && (b.verdictId === 'easy' || b.verdictId === 'fair'))
    .map((b) => b.id);
  return [...(realm?.ready && r && !r.fell ? ['realm'] : []), ...bosses];
}

export type RoundResult = { ok: true; count: number } | { ok: false; reason: 'none' };

/** Sets the day's fights; the page then starts `expeditions:bosses` in the Combat lane, as it starts a run. */
export function planRound(state: State, now: number): { state: State; result: RoundResult; events: GameEvent[] } {
  const foes = roundFoes(state, now);
  if (!foes.length) return { state, result: { ok: false, reason: 'none' }, events: [] };
  const out = structuredClone(state);
  setExpeditions(out, { ...expeditionsOf(out), round: { day: dayOf(now), foes } });
  return { state: out, result: { ok: true, count: foes.length }, events: [] };
}

/** The lane's rules for the day's bosses: each repetition the next fight of the list, by its own rules. The
 *  fight is read at the repetition's start in all three, so a day that turns mid-fight changes nothing. */
export function roundRules(rulesOf: (id: string) => ActionRules | undefined): ActionRules {
  const on = (state: State, at: number) => {
    const id = roundOn(state, at);
    const rules = id ? rulesOf(id) : undefined;
    return id && rules ? { id, rules } : null;
  };
  return {
    lane: 'combat',
    seeded: true,
    check: (ctx) => {
      const fight = on(ctx.state, ctx.at);
      if (!fight) return { code: 'roundDone' };
      return fight.rules.check(ctx, { feature: 'expeditions', id: fight.id });
    },
    duration: (ctx) => {
      const fight = on(ctx.state, ctx.startedAt);
      return fight ? fight.rules.duration(ctx, { feature: 'expeditions', id: fight.id }) : 3000;
    },
    complete: (ctx) => {
      const fight = on(ctx.state, ctx.startedAt);
      if (!fight) return false;
      return fight.rules.complete(ctx, { feature: 'expeditions', id: fight.id });
    },
  };
}

/** The day's bosses on the Expeditions tab: offered while two fights or more wait today, and while the lane is
 *  on them, how many are left and which is under way, so their rows can say so. */
export interface RoundView {
  text: string;
  /** Whether the Combat lane is on the day's bosses, or has them next. */
  running: boolean;
  /** The fight under way: `realm` or a boss's id. */
  on: string | null;
  /** The fights still to come after it. */
  waiting: string[];
  /** The picture: the fight under way, or the first to come. */
  icon: string;
}

/** A fight's picture: the realm's boss of the week as itself. */
function iconOf(state: State, id: string): string {
  const r = realmOf(state);
  return id === 'realm' && r ? realmBossIn(r.week).id : id;
}

export function roundView(state: State, now: number): RoundView | null {
  const lane = state.lanes.combat;
  const key = 'expeditions:bosses';
  const current = lane.current !== null && actionKey(lane.current.action) === key;
  const next = lane.next !== null && actionKey(lane.next) === key;
  const left = roundLeft(state, lane.current?.startedAt ?? now);
  const round = expeditionsOf(state).round;
  if ((current || next) && left.length && round) {
    const count = fmt.int(round.foes.length);
    return {
      text: left.length === 1 ? t('round.onOne', { count }) : t('round.on', { left: fmt.int(left.length), count }),
      running: true,
      on: current ? left[0] : null,
      waiting: current ? left.slice(1) : left,
      icon: iconOf(state, left[0]),
    };
  }
  const foes = roundFoes(state, now);
  if (foes.length < 2) return null;
  return {
    text: t('round.waiting', { count: fmt.int(foes.length) }),
    running: false,
    on: null,
    waiting: [],
    icon: iconOf(state, foes[0]),
  };
}

export { roundLeft, roundOn };
