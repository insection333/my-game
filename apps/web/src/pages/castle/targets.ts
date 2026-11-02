// The War room's targets reckoned for the page (session 38): what is known of a target's defence, the
// chance against it, what a win brings, and how it stands for you today. Shared by its rows and its sheet.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';

export interface Target {
  id: string;
  name: string;
  rating: number;
  spyChance: number | null;
  struck: number | null;
  shieldedUntil: number | null;
  merc: E.Mercenary | null;
}

export const pct = (p: number) => fmt.pct(Math.round(p * 100));
export const sheetOf = (id: string) => `${location.pathname}?panel=target&target=${encodeURIComponent(id)}`;

/** What the last scouting of a lord saw, if any. */
export function scoutingOf(logs: readonly E.CastleReport[], id: string) {
  const found = logs.find(
    (l) => l.kind === 'spyOut' && l.data.foe === id && l.data.report && typeof l.data.report === 'object',
  );
  return found ? { at: found.at, report: found.data.report as Record<string, unknown> } : null;
}

/** The side a target defends with: a stronghold as it is, a lord as their last scouting saw them. */
export function defenceOf(c: E.Castle, target: Target, logs: readonly E.CastleReport[], now: number): E.Side | null {
  if (target.merc) return E.mercenarySide(target.merc);
  const seen = scoutingOf(logs, target.id);
  if (!seen) return null;
  const r = seen.report;
  return E.estimatedDefence(
    c,
    {
      defense: Array.isArray(r.defense) ? r.defense.map(Number) : [34, 33, 33],
      trap: typeof r.trap === 'string' ? r.trap : null,
      castellan: typeof r.castellan === 'string' ? r.castellan : null,
    },
    target.rating,
    now,
    E.sabotageSent(logs, target.id, now),
  );
}

/** What a win against a target brings, in a line. */
export function paysLine(
  c: E.Castle,
  target: Target,
  chest: number,
  logs: readonly E.CastleReport[],
  now: number,
): string {
  if (target.merc) {
    const pays = E.strongholdSpoils(c, target.merc, chest, now);
    return pays.bounty > 0
      ? t('castle.target.pays', { marks: fmt.int(pays.marks), gold: fmt.short(pays.bounty) })
      : t('castle.target.paysMarks', { marks: fmt.int(pays.marks) });
  }
  const raidable = scoutingOf(logs, target.id)?.report.raidable;
  const pays = E.lordSpoils(c, target.rating, typeof raidable === 'number' ? raidable : null, now);
  const marks = `${fmt.int(pays.marks[0])}–${fmt.int(pays.marks[1])}`;
  return pays.gold === null
    ? t('castle.target.paysLordUnscouted', { marks })
    : t('castle.target.paysLord', { gold: fmt.short(pays.gold), marks });
}

export type Standing = { kind: 'fallen' | 'shielded' | 'twice'; text: string } | { kind: 'once'; text: string };

/** How a target stands for you today: fallen, shielded, sieged once or twice, or free (null). */
export function standingOf(c: E.Castle, target: Target, now: number): Standing | null {
  const pair = E.pairOf(c, target.id, now);
  if (pair.fell) return { kind: 'fallen', text: t('castle.target.fallen') };
  if (target.shieldedUntil !== null && target.shieldedUntil > now)
    return { kind: 'shielded', text: t('castle.target.shielded', { time: fmt.duration(target.shieldedUntil - now) }) };
  if (pair.sieges.length >= 2) return { kind: 'twice', text: t('castle.target.twice') };
  if (pair.sieges.length === 1) return { kind: 'once', text: t('castle.target.once') };
  return null;
}

/** The chance against a target in words: with the attack as set, and set against them if that is better. */
export function chanceLine(c: E.Castle, def: E.Side | null, estimate: boolean, now: number): string {
  if (!def) return t('castle.target.unscouted');
  const chance = E.winChance(E.oddsWith(c, c.offense, def, now));
  const best = E.winChance(E.bestOffense(c, def, now).r);
  const better = best >= chance + 0.01 && chance < 0.995;
  const set = { pct: pct(chance), best: pct(best) };
  const only = { pct: pct(chance) };
  if (estimate) return better ? t('castle.target.chanceAbout.set', set) : t('castle.target.chanceAbout', only);
  return better ? t('castle.target.chance.set', set) : t('castle.target.chance', only);
}
