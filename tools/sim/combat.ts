// Simulated fighters on the real engine. A focused fighter trains one style in the Combat lane: one
// active hour a day with the fire, picking every minute the foe its Your odds rate best among those
// Easy or Fair, then away until the next day. Like the model's fighter, it wears the best gear its
// levels allow (handed over each morning and whenever a level opens a tier) and carries plenty of the
// best food its Hitpoints level buys.
import { levelFor, TIER_LEVELS, XP_TABLE, type Style } from '@idle-clash/content';
import { actionRegistry, combatData, FEATURES, yourOdds } from '@idle-clash/features';
import {
  createEngine,
  HOUR,
  isNotable,
  MINUTE,
  newState,
  seeded,
  xpOf,
  type Command,
  type GameEvent,
  type State,
} from '@idle-clash/kernel';
import { DAY, T0, type Day, type Played } from './player.ts';

const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));
const combat = FEATURES.find((f) => f.id === 'combat')!;
const METALS = ['copper', 'bronze', 'iron', 'steel'];
const WEAPON: Record<Style, string> = { melee: 'sword', archery: 'bow', magic: 'staff' };
const tierAt = (level: number) => TIER_LEVELS.filter((l) => l <= level).length;

/** The player's gear and food, as the model's fighter has them at these levels. */
export function equip(state: State, style: Style): State {
  const metal = (level: number) => METALS[tierAt(level) - 1];
  const weapon = `${metal(levelFor(xpOf(state, style)))}-${WEAPON[style]}`;
  const hp = levelFor(xpOf(state, combatData.HITPOINTS));
  const armour = ['helm', 'body', 'legs'].map((p) => `${metal(hp)}-${p}`);
  const food = [...combatData.FOODS].reverse().find((f) => f.level <= hp)!;
  let s: State = { ...state, items: { ...state.items, [food.id]: 10_000 } };
  for (const item of [weapon, ...armour]) {
    if (!s.items[item]) s = { ...s, items: { ...s.items, [item]: 1 } };
    s = combat.routes.wear.run(s, { item }, s.clock).state;
  }
  return s;
}

/** The foe a sensible fighter picks: the most XP an hour among those Easy or Fair. */
export function bestFoe(state: State): string {
  const hp = levelFor(xpOf(state, combatData.HITPOINTS));
  let best = 'hollow-rat';
  let most = -1;
  for (const f of combatData.FOES.filter((x) => x.hitpoints <= hp)) {
    const o = yourOdds(state, f.id);
    if (o && (o.verdict === 'easy' || o.verdict === 'fair') && o.xpPerHour > most) [best, most] = [f.id, o.xpPerHour];
  }
  return best;
}

export function fighter(style: Style, seed: number, days: number): Played {
  const rng = seeded(seed);
  let state = newState(seed, T0);
  const levelAt = [0, 0];
  const out: Day[] = [];
  let commands = 0;
  let refused = 0;
  const note = (events: GameEvent[]) => {
    for (const e of events) if (e.type === 'levelUp' && e.skill === style) levelAt[e.level] = (e.at - T0) / HOUR;
    return events.filter(isNotable);
  };
  for (let d = 0; d < days; d++) {
    const dayStart = T0 + d * DAY;
    state = equip({ ...state, clock: Math.max(state.clock, dayStart) }, style);
    const day: Day = { start: state, active: [], away: [] };
    for (let t = dayStart; t < dayStart + HOUR; t += MINUTE) {
      const arrived = engine.advance(state, t, rng);
      day.active.push(...note(arrived.events));
      state = equip(arrived.state, style);
      const best = bestFoe(state);
      const cmd: Command =
        state.lanes.combat.current?.action.id === best
          ? { type: 'stoke' }
          : { type: 'start', lane: 'combat', action: { feature: 'combat', id: best } };
      const r = engine.command(state, t, cmd, rng);
      commands++;
      if (!r.result.ok) refused++;
      state = r.state;
      day.active.push(...note(r.events));
    }
    const away = engine.advance(state, dayStart + DAY, rng);
    state = away.state;
    const all = note(away.events);
    day.active.push(...all.filter((e) => e.at < dayStart + HOUR));
    day.away.push(...all.filter((e) => e.at >= dayStart + HOUR));
    out.push(day);
  }
  return { levelAt, days: out, commands, refused, final: state };
}

/** XP an hour in the Combat lane as the state stands: the best Easy or Fair foe, with or without the fire. */
export function combatXpPerHour(state: State, fire: boolean): number {
  const o = yourOdds(state, bestFoe(state));
  return (o?.xpPerHour ?? 0) * (fire ? 1.15 : 1);
}

export interface Measured {
  xpPerHour: number;
  foodPerHour: number;
  retreatRate: number;
  verdict: 'easy' | 'fair' | 'costly' | 'tooStrong';
}

/**
 * Fights measured on the engine at fixed levels: the lane runs `hours`, a minute at a time, with the
 * levels and mastery put back each minute (so the fighter does not outgrow the foe while measured) and
 * the food topped up. After a retreat the fighter rests to full health and goes again. The verdict
 * follows GAME_DESIGN.md's rules from what happened.
 */
export function measured(
  style: Style,
  styleLevel: number,
  hpLevel: number,
  foe: string,
  food: boolean,
  hours = 6,
): Measured {
  const skills = { [style]: { xp: XP_TABLE[styleLevel] }, [combatData.HITPOINTS]: { xp: XP_TABLE[hpLevel] } };
  let s = equip({ ...newState(7, T0), skills }, style);
  const meal = Object.keys(s.items).find((i) => combatData.FOODS.some((f) => f.id === i))!;
  const stock = food ? 10_000 : 0;
  const rng = seeded(7);
  const fight: Command = { type: 'start', lane: 'combat', action: { feature: 'combat', id: foe } };
  // Starting a fight lights the fire; it is put out, so its XP does not count.
  const go = (st: State, at: number) => ({ ...engine.command(st, at, fight, rng).state, fireUntil: at });
  s = go({ ...s, items: { ...s.items, [meal]: stock } }, T0);
  let t = T0;
  let [xp, eaten, wins, retreats] = [0, 0, 0, 0];
  for (let m = 0; m < hours * 60; m++) {
    s = { ...s, skills, mastery: {}, items: { ...s.items, [meal]: stock } };
    const out = engine.advance(s, (t += MINUTE), rng);
    xp += out.state.skills[style].xp - XP_TABLE[styleLevel];
    eaten += stock - (out.state.items[meal] ?? 0);
    wins += out.state.mastery[`combat:${foe}`] ?? 0;
    s = out.state;
    if (out.events.some((e) => e.type === 'laneStopped')) {
      retreats++;
      const c = s.features.combat as Record<string, unknown>;
      s = { ...s, features: { ...s.features, combat: { ...c, health: null, retreated: null } } };
      s = go(s, t);
    }
  }
  const foodPerHour = eaten / hours;
  const retreatRate = retreats / Math.max(1, wins + retreats);
  const verdict = retreatRate > 0.02 ? 'tooStrong' : foodPerHour < 4 ? 'easy' : foodPerHour < 25 ? 'fair' : 'costly';
  return { xpPerHour: xp / hours, foodPerHour, retreatRate, verdict };
}
