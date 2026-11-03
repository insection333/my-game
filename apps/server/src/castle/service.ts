// Castle Clash's service (docs/castle-clash/DESIGN.md section 3): every change runs in the player's queue
// and one transaction on the one connection. It reads the save (acting once per request id), plays it to
// now, reads the castle rows it needs in ascending id, works the change out with the pure engine, and
// writes the rows, the war chest, the reports and the save together. Nothing is half done.
import type { CastleAction } from '@idle-clash/contracts';
import { castleEngine as E, totalLevel } from '@idle-clash/features';
import { countOf, REMEMBERED_REQUESTS, seeded, type GameEvent, type SaveDoc, type State } from '@idle-clash/kernel';
import type { Ctx } from '../context.ts';
import { fail } from '../http.ts';
import { mirrored } from './mirror.ts';
import { CastleStore } from './store.ts';
import { siege, spy } from './war.ts';

type Castle = E.Castle;
export type Outcome = { ok: true; [k: string]: unknown } | { ok: false; reason: string };

/** What an action works with: the save (its gold is the purse), the castles, the time and the lord's level. */
export interface Io {
  ctx: Ctx;
  castles: CastleStore;
  playerId: string;
  state: State;
  now: number;
  totalLevel: number;
  /** Events for the acting lord (their moments and notices), and for others (a lord they besieged, or
   *  whose castle caught their spy): told once the change is written. */
  events: GameEvent[];
  told: Map<string, GameEvent[]>;
}

/** Tells another lord of something done to their castle, once the change is written. */
export function tell(io: Io, playerId: string, e: GameEvent): void {
  io.told.set(playerId, [...(io.told.get(playerId) ?? []), e]);
}

export const purseOf = (io: Io): number => countOf(io.state, 'gold');
export function setPurse(io: Io, gold: number): void {
  io.state = { ...io.state, items: { ...io.state.items, gold: Math.max(0, Math.floor(gold)) } };
}

/** The castle synced to now, its upkeep burned into the ledger. A castle whose upkeep burned is written
 *  back at once, whatever the action then does: a refused action must not count gold as burned (5% of it
 *  into the war chest) that the treasury still holds. */
export function loadSynced(io: Io, id: string, castle: Castle | null = io.castles.read(id)): Castle | null {
  if (!castle) return null;
  const { castle: synced, burned } = E.syncCastle(castle, io.now);
  if (burned > 0) {
    io.castles.burn(burned);
    io.castles.write(synced);
  }
  return synced;
}

/** Writes a castle, its rating brought up to date first. */
export function store(io: Io, c: Castle): Castle {
  const out = { ...c, rating: Math.max(c.rating, E.bastionRating(c)), updatedAt: io.now };
  io.castles.write(out);
  return out;
}

export interface Handled {
  result: Outcome;
  duplicate: boolean;
  doc: SaveDoc;
  events: GameEvent[];
  told: Map<string, GameEvent[]>;
}

/** Runs one castle request for a player: in their queue, in one transaction, acting once per request id. */
export function castleRequest(
  ctx: Ctx,
  playerId: string,
  requestId: string,
  now: number,
  fn: (io: Io) => Outcome,
): Promise<Handled> {
  return ctx.queue.run(playerId, () =>
    ctx.store.sqlite.transaction((): Handled => {
      const saved = ctx.store.read(playerId, now);
      if (!saved) throw fail(404, 'notFound');
      const seen = saved.doc.requests.find((r) => r.id === requestId);
      if (seen) return { result: seen.result as Outcome, duplicate: true, doc: saved.doc, events: [], told: new Map() };
      const castles = new CastleStore(ctx);
      const start = mirrored(saved.doc.state, castles.read(playerId), now);
      const arrived = ctx.engine.input(start, now, seeded(start.seed));
      const io: Io = {
        ctx,
        castles,
        playerId,
        state: arrived.state,
        now,
        totalLevel: totalLevel(arrived.state),
        events: [],
        told: new Map(),
      };
      const result = fn(io);
      const state = mirrored(io.state, castles.read(playerId), now);
      const requests = [...saved.doc.requests, { id: requestId, at: now, result }].slice(-REMEMBERED_REQUESTS);
      const doc: SaveDoc = { ...saved.doc, state, requests };
      ctx.store.write(playerId, doc, saved.rev, now);
      return { result, duplicate: false, doc, events: [...arrived.events, ...io.events], told: io.told };
    })(),
  );
}

/** Opens a lord's castle once their total level allows: every level 1, the novice shield up. */
export function openCastle(io: Io): Outcome {
  if (!E.castleOpen(io.totalLevel)) return { ok: false, reason: 'closed' };
  if (io.castles.read(io.playerId)) return { ok: true, opened: false };
  store(io, E.newCastle(io.playerId, io.now));
  return { ok: true, opened: true };
}

/** An own-castle action through the engine's wallet: purse or treasury paid, the burn into the ledger. */
function own(io: Io, d: E.Done): Outcome {
  if (!d.ok) return { ok: false, reason: d.reason };
  setPurse(io, d.purse);
  io.castles.burn(d.burned);
  store(io, d.castle);
  return { ok: true };
}

/** Runs one action on the player's own castle (or, for a siege or spy mission, against another). */
export function act(io: Io, action: CastleAction): Outcome {
  const c = loadSynced(io, io.playerId);
  if (!c) return { ok: false, reason: 'noCastle' };
  // A formation sent with an attack is whole: three shares of a hundred.
  if ('shares' in action && action.shares && action.shares.reduce((a, b) => a + b, 0) !== 100)
    return { ok: false, reason: 'invalid' };
  const w: E.Wallet = { castle: c, purse: purseOf(io) };
  switch (action.type) {
    case 'callToArms': {
      const r = E.claimCallToArms(c, io.now);
      if (!r.ok) return { ok: false, reason: r.reason };
      store(io, r.castle);
      return { ok: true, gained: r.gained, streak: r.streak };
    }
    case 'deposit':
      return own(io, E.deposit(w, action.gold));
    case 'withdraw':
      return own(io, E.withdraw(w, action.gold, io.now));
    case 'edict':
      return own(io, E.setEdict(w, action.edict));
    case 'payFrom':
      return own(io, E.setPayFrom(w, action.treasury));
    case 'upgrade':
      return own(io, E.upgrade(w, action.id as Parameters<typeof E.upgrade>[1], io.now));
    case 'research':
      return own(io, E.research(w, action.tech as Parameters<typeof E.research>[1], io.now));
    case 'forgeRelic':
      if (!E.tabOpen(c, 'halls')) return { ok: false, reason: 'locked' };
      return own(io, E.forgeRelic(w, action.relic));
    case 'temperRelic': {
      if (!E.tabOpen(c, 'halls')) return { ok: false, reason: 'locked' };
      const r = E.temperRelic(w, action.relic, roll(), roll());
      if (!r.ok) return { ok: false, reason: r.reason };
      setPurse(io, r.purse);
      io.castles.burn(r.burned);
      store(io, r.castle);
      if (r.outcome !== 'held')
        io.events.push({
          type: 'castleTempered',
          at: io.now,
          relic: action.relic,
          tempers: r.tempers,
          masterstroke: r.outcome === 'masterstroke',
        });
      return { ok: true, outcome: r.outcome, tempers: r.tempers };
    }
    case 'equipRelics':
      return own(io, E.equipRelics(w, action.relics));
    case 'offense':
      return own(io, E.setOffense(w, action.shares));
    case 'defense':
      return own(io, E.setDefense(w, action, io.totalLevel, io.now));
    case 'mend':
      return own(io, E.mendNow(w, action.what, io.now));
    case 'drill':
      return own(io, E.drill(w, action.unit, action.times));
    case 'excavate':
      return own(io, E.excavate(w, io.now));
    case 'incursion':
      return incursion(io, withShares(c, action.shares));
    case 'spy':
      return spy(io, c, action.target, action.mission);
    case 'siege':
      return siege(io, withShares(c, action.shares), action.target);
  }
}

/** The castle attacking in the formation sent with the attack (the page's, set against the foe), for
 *  this battle; the attack formation kept on the castle is the one written with it. */
const withShares = (c: Castle, shares: readonly [number, number, number] | undefined): Castle =>
  shares ? { ...c, offense: shares } : c;

/** What each action counts towards the orders of the day (session 40), from what it did. */
function orderOf(action: CastleAction, out: Outcome): [E.OrderKind, number] | null {
  if (!out.ok) return null;
  switch (action.type) {
    case 'siege':
      return action.target.startsWith('merc:') ? (out.outcome === 'repelled' ? null : ['strongholds', 1]) : ['lord', 1];
    case 'incursion':
      return out.won === true ? ['incursion', 1] : null;
    case 'drill':
      return ['drill', action.times];
    case 'excavate':
      return ['dig', 1];
    case 'spy':
      return ['spy', 1];
    default:
      return null;
  }
}

/** Runs an action, then counts it towards the orders of the day: what it finishes pays at once. */
export function actAndOrder(io: Io, action: CastleAction): Outcome {
  const out = act(io, action);
  const counted = orderOf(action, out);
  const c = counted && io.castles.read(io.playerId);
  if (!counted || !c) return out;
  const r = E.recordOrder(E.syncCastle(c, io.now).castle, counted[0], counted[1], io.now);
  if (r.marks > 0 || r.done.length) {
    store(io, r.castle);
    io.events.push({ type: 'castleOrders', at: io.now, orders: r.done, all: r.all, marks: r.marks });
  } else store(io, r.castle);
  return out;
}

function incursion(io: Io, c: Castle): Outcome {
  const tier = c.incursionTier;
  const r = E.launchIncursion(c, io.now, roll(), roll());
  if (r === 'ap') return { ok: false, reason: 'ap' };
  store(io, r.castle);
  const data = {
    tier,
    fortress: E.fortressAt(tier).id,
    won: r.won,
    r: r.r,
    ...E.battleAccount(r.attack, r.defense, r.r),
    formation: [...c.offense],
    marks: r.marks,
    drillXp: r.drillXp,
    ...(r.spoils ? { spoils: r.spoils } : {}),
  };
  io.castles.log(io.playerId, io.now, 'incursion', data);
  io.events.push({
    type: 'castleIncursion',
    at: io.now,
    fortress: data.fortress,
    tier,
    won: r.won,
    marks: r.marks,
    ...(r.spoils ? { spoils: r.spoils } : {}),
  });
  return { ok: true, ...data };
}

/** A fair roll in [0, 1): the server is the authority, so it needs no seed. */
export const roll = (): number => Math.random();
