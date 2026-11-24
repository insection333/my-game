// The realm's boss of the week in the Combat lane (session 174): fought once a day at the player's own
// measure (shared/realm.ts), a win a strike for the realm, paying gold, marks and XP as a fight does; and,
// once the server says it fell with the player's strike, their share taken from the Combat page.
import { dayTurns, fmt, midSentence, t } from '@idle-clash/content';
import {
  give,
  seeded,
  take,
  type ActionContext,
  type ActionRules,
  type GameEvent,
  type State,
} from '@idle-clash/kernel';
import { fight, maxHealth, retreatShare, type Fought } from '../shared/combat/fight.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { fightXp, goldLift } from '../shared/combat/spoils.ts';
import { combatOf, fighterOf, healthAt, mealsOf, setCombat } from '../shared/combat/state.ts';
import { expeditionsOf, setExpeditions, type ExpeditionState } from '../shared/expeditions/state.ts';
import {
  REALM_MARKS,
  REALM_SHARE_MARKS,
  REALM_SHARE_STRIKES,
  realmBossIn,
  realmFoe,
  realmOf,
  weekEnds,
  weekOf,
} from '../shared/realm.ts';
import { realmName } from '../shared/realm-words.ts';
import type { Foe } from '../shared/combat/foes.ts';
import { BOSSES, type Boss } from '../shared/expeditions/data.ts';
import { traitWords } from './views.ts';
import { noRoom } from '../shared/storehouse.ts';
import { dayOf } from './boss.ts';

const NONE = { day: null, claimed: null, fallen: 0 };
/** Whether a week's share is taken: it, or a later week's, was the last claimed (weeks are dates, so they
 *  sort as text). */
const taken = (claimed: string | null, week: string) => claimed !== null && week <= claimed;
const realmPart = (e: ExpeditionState) => e.realm ?? NONE;

/** Whether the realm's boss has been fought today. */
export const realmRested = (state: State, at: number) => realmPart(expeditionsOf(state)).day === dayOf(at);

function playRealm(ctx: ActionContext): Fought | null {
  const foe = realmFoe(ctx.state, ctx.startedAt);
  const p = foe && fighterOf(ctx.state, foe);
  if (!foe || !p) return null;
  const r = seeded(ctx.seed ?? 0);
  let i = 0;
  return fight(p, foe, () => r('realm', i++), healthAt(ctx.state, ctx.startedAt), mealsOf(ctx.state));
}

export const REALM_RULES: ActionRules = {
  lane: 'combat',
  seeded: true,
  check: (ctx) => {
    const foe = realmFoe(ctx.state, ctx.at);
    const p = foe && fighterOf(ctx.state, foe);
    if (!foe || !p) return { code: 'noWeapon' };
    if (realmRested(ctx.state, ctx.at)) return { code: 'realmRested' };
    const low = healthAt(ctx.state, ctx.at) < maxHealth(p) * retreatShare(p);
    if (low && mealsOf(ctx.state).length === 0) return { code: 'tooHurt' };
    return noRoom(ctx.state, [foe.drop]);
  },
  duration: (ctx) => (playRealm(ctx)?.seconds ?? 3) * 1000,
  complete: (ctx) => {
    const { state } = ctx;
    const foe = realmFoe(state, ctx.startedAt);
    const p = foe && fighterOf(state, foe);
    const f = playRealm(ctx);
    if (!foe || !p || !f) return false;
    for (const [item, n] of Object.entries(f.eaten)) take(state, item, n);
    if (p.supply) take(state, p.supply.item, 1);
    setCombat(state, { ...combatOf(state), health: f.health, healthAt: ctx.at, retreated: null });
    fightXp(ctx, p, foe, f.dealt, 1);
    const won = !f.retreated;
    const gold = won ? Math.round(foe.gold * goldLift(state, ctx.at, p)) : 0;
    if (won) {
      give(state, 'gold', gold);
      give(state, foe.drop, 1);
    }
    const e = expeditionsOf(state);
    setExpeditions(state, {
      ...e,
      marks: e.marks + (won ? REALM_MARKS : 0),
      realm: { ...realmPart(e), day: dayOf(ctx.at) },
    });
    const boss = realmBossIn(weekOf(ctx.startedAt)).id;
    ctx.emit({ type: 'realmFought', at: ctx.at, boss, won, gold, marks: won ? REALM_MARKS : 0 });
  },
};

export type ShareResult = { ok: true } | { ok: false; reason: 'none' };

/** Takes this player's share of a fallen realm's boss, once for each week it fell. */
export function takeShare(state: State, now: number): { state: State; result: ShareResult; events: GameEvent[] } {
  const owed = realmOf(state)?.owed ?? null;
  const e = expeditionsOf(state);
  const part = realmPart(e);
  if (!owed || taken(part.claimed, owed.week)) return { state, result: { ok: false, reason: 'none' }, events: [] };
  const out = structuredClone(state);
  const foe = realmFoe(out, now);
  const gold = (foe?.gold ?? 0) * REALM_SHARE_STRIKES;
  give(out, 'gold', gold);
  setExpeditions(out, {
    ...e,
    marks: e.marks + REALM_SHARE_MARKS,
    realm: { ...part, claimed: owed.week, fallen: part.fallen + 1 },
  });
  return {
    state: out,
    result: { ok: true },
    events: [{ type: 'realmShare', at: now, boss: owed.boss, gold, marks: REALM_SHARE_MARKS }],
  };
}

export interface RealmView {
  boss: string;
  name: string;
  /** "34 of 60 strikes", the realm's; and this player's. */
  strikes: string;
  mine: string;
  progress: number;
  fell: boolean;
  /** Your odds' verdict against the realm's boss at your measure. */
  verdict: string | null;
  verdictId: string | null;
  /** The season's mark on it, in words ("This season it fights as the Barrow-king does: …"), or null. */
  mark: string | null;
  /** Why it cannot be fought now (today's fought, no weapon), or null. */
  status: string | null;
  ready: boolean;
  /** A share to take: its words, and the button's. */
  share: { text: string; label: string } | null;
  note: string;
}

/** The season's mark said with the boss whose way it is (session 223): "This season it fights as the
 *  Barrow-king does: its wights rise at a third of its health", where the Ember Wyrm's wights stood unexplained. */
function markWords(foe: Foe, boss: Boss): string {
  const trait = foe.trait!;
  const from = BOSSES.find((b) => b.trait?.kind === trait.kind) ?? boss;
  const way = traitWords({ ...boss, style: foe.style, trait }) ?? '';
  return t('realm.mark', { boss: midSentence(t(`boss.${from.id}`)), way: midSentence(way) });
}

/** The realm's boss on the Combat page; null until the server has told the save of the realm's week. */
export function realmView(state: State, now: number): RealmView | null {
  const r = realmOf(state);
  if (!r) return null;
  const boss = realmBossIn(r.week);
  const foe = realmFoe(state, now);
  const o = foe ? oddsFor(state, foe) : null;
  const rested = realmRested(state, now);
  const part = realmPart(expeditionsOf(state));
  const owed = r.owed && !taken(part.claimed, r.owed.week) ? r.owed : null;
  const name = realmName(boss.id);
  return {
    boss: boss.id,
    name,
    strikes: t('realm.strikes', { done: fmt.int(Math.min(r.strikes, r.needed)), of: fmt.int(r.needed) }),
    mine: r.mine === 1 ? t('realm.mineOne') : t('realm.mine', { count: fmt.int(r.mine) }),
    progress: r.needed ? Math.min(1, r.strikes / r.needed) : 0,
    fell: r.fell,
    verdict: o ? t(`verdict.${o.verdict}`) : null,
    verdictId: o?.verdict ?? null,
    mark: foe?.trait ? markWords(foe, boss) : null,
    status: !o ? t('stop.noWeapon') : rested ? t('realm.rested', { back: dayTurns(now) }) : null,
    ready: o !== null && !rested,
    share: owed
      ? {
          text: t('realm.owed', { boss: realmName(owed.boss) }),
          label: t('realm.take'),
        }
      : null,
    // The week turns at Monday 00:00 UTC, said in the player's own clock (session 183: "on Monday" was
    // Monday 11:00 in Sydney).
    note: r.fell ? t('realm.fell', { when: fmt.when(weekEnds(now), now) }) : t('realm.note'),
  };
}
