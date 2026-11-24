// Seasons that bring something new (session 221): from the seventh season (4 October 2027, once all six have come round) a
// season pairs two twists, the fifteen pairings in turn with no twist two seasons running, and pays both
// lifts; its pairings played are deeds. Every season also holds an omen of its own in the Deep, and puts its
// mark on the realm's boss: one of the bosses' ways, in turn.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { pending } from '../src/deeds/list.ts';
import { deepView } from '../src/expeditions/deep-view.ts';
import { realmView } from '../src/expeditions/realm.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { omensAt, omensOf, seasonOmenAt } from '../src/shared/expeditions/deep.ts';
import { realmFoe, realmMarkAt, weekOf } from '../src/shared/realm.ts';
import {
  PAIRED_FROM,
  SEASON_DAYS,
  SEASON_EPOCH,
  seasonAt,
  seasonFindPct,
  seasonXpPct,
  seasonYieldPct,
  twistsOf,
} from '../src/shared/season.ts';
import { bestInTwist, pairingsPlayed } from '../src/shared/season-state.ts';
import { seasonPill, seasonView } from '../src/shared/season-view.ts';
import { fighterAt, fighterOfLevel } from './helpers/expedition.ts';

const DAY = 86_400_000;
/** A moment three days into the season of this number. */
const into = (n: number) => SEASON_EPOCH + (n - 1) * SEASON_DAYS * DAY + 3 * DAY;
const ids = (n: number) => twistsOf(n).map((t) => t.id);

describe('seasons of two twists', () => {
  it('pairs two twists from the seventh season, once each twist has come round, each of the fifteen pairings in turn', () => {
    expect(new Date(into(PAIRED_FROM) - 3 * DAY).toISOString().slice(0, 10)).toBe('2027-10-04');
    for (let n = 1; n < PAIRED_FROM; n++) expect(twistsOf(n)).toHaveLength(1);
    const pairs = Array.from({ length: 15 }, (_, i) => ids(PAIRED_FROM + i));
    expect(new Set(pairs.map((p) => [...p].sort().join('+'))).size).toBe(15);
    for (let n = PAIRED_FROM; n < PAIRED_FROM + 30; n++) {
      expect(ids(n)).toHaveLength(2);
      // No twist two seasons running, the last single season to the first pairing included.
      expect(ids(n).filter((id) => ids(n - 1).includes(id))).toEqual([]);
    }
    expect(ids(PAIRED_FROM + 15)).toEqual(ids(PAIRED_FROM));
  });

  it('pays both lifts, and says the two by name', () => {
    const at = into(PAIRED_FROM);
    expect(seasonAt(at)!.twists.map((t) => t.id)).toEqual(['greenwood', 'forgefire']);
    expect([seasonXpPct('woodcutting', at), seasonXpPct('smithing', at), seasonXpPct('melee', at)]).toEqual([
      20, 20, 0,
    ]);
    // The Muster and the Plenty: XP to fighting, more items to gathering.
    const muster = into(PAIRED_FROM + 1);
    expect([seasonXpPct('melee', muster), seasonYieldPct('woodcutting', muster), seasonFindPct(muster)]).toEqual([
      20, 10, 0,
    ]);
    const view = seasonView(at)!;
    expect(view.title).toBe('Season 7: The Greenwood and the Forgefire');
    expect(view.gives).toBe('Gathering skills earn 20% more XP; Artisan skills earn 20% more XP');
    // A page names only the twist that lifts something there.
    expect(seasonPill(at, { skill: 'woodcutting' })).toBe('The Greenwood: +20% XP');
    expect(seasonPill(muster, { combat: true })).toBe('The Muster: +20% XP');
  });

  it('counts a paired season for both its twists, and its pairings played as deeds', () => {
    const s: State = { ...newState(1, into(9)), features: { seasons: { goals: { '7': 60, '8': 25, '22': 30 } } } };
    expect([bestInTwist(s, 'greenwood'), bestInTwist(s, 'forgefire'), bestInTwist(s, 'plenty')]).toEqual([60, 60, 25]);
    // Season 22 is season 7's pairing come round: one pairing, counted once.
    expect(pairingsPlayed(s, 20)).toBe(2);
    const done = pending(s, into(9)).map((d) => d.id);
    expect(done).toEqual(expect.arrayContaining(['season-greenwood', 'season-forgefire', 'pairings-1']));
    expect(done).not.toContain('pairings-5');
  });
});

describe("a season's omen and mark", () => {
  it('holds an omen of its own in the Deep beside the week’s two, none before the first season', () => {
    expect(seasonOmenAt(SEASON_EPOCH - DAY)).toBeNull();
    const at = into(1);
    expect(seasonOmenAt(at)!.id).toBe('rootbound');
    expect(omensAt(at)).toEqual([...omensOf(weekOf(at)), seasonOmenAt(at)]);
    expect(seasonOmenAt(into(4))!.id).toBe('falling-stars');
    const view = deepView(fighterOfLevel(99, 1, 'melee'), at)!;
    expect(view.seasonOmen?.omen).toMatchObject({ name: 'Rootbound', text: 'Foes hit 10% softer' });
  });

  it("puts one of the bosses' ways on the realm's boss, in turn, and it stays a boss the player fares well against", () => {
    expect(realmMarkAt(SEASON_EPOCH - DAY)).toBeNull();
    const kinds = [1, 2, 3, 4, 5, 6].map((n) => realmMarkAt(into(n))?.kind);
    expect(kinds).toEqual(['rise', 'rage', 'mend', 'ward', 'plumage', 'rise']);
    for (const n of [1, 2, 3, 4, 5]) {
      const s = fighterAt('fen', n);
      const foe = realmFoe(s, into(n))!;
      expect(foe.trait?.kind).toBe(kinds[n - 1]);
      expect(['easy', 'fair']).toContain(oddsFor(s, foe)!.verdict);
    }
    const s: State = {
      ...fighterAt('fen', 1),
      features: {
        ...fighterAt('fen', 1).features,
        realm: { week: weekOf(into(2)), needed: 8, strikes: 0, mine: 0, fell: false, owed: null },
      },
    };
    expect(realmView(s, into(2))!.mark).toBe("The season's mark: Rages below half health");
  });
});
