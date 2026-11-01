// Castle Clash's checks on simulated play (session 33): a realm of 24 lords (steady raiders, light lords
// who keep to themselves, lapsed lords who come back one day in four) for twelve weeks on the pure engine
// (realm.ts), and the odds a lord meets at each castle level. The year's own checks (year/checks.ts) hold
// the rest of the game to its targets with an edict running.
import { castleEngine as E } from '@idle-clash/features';
import { DAY, goldOf, KINDS, playRealm, T0 } from './realm.ts';

type Check = (ok: boolean, what: string) => void;
const WEEKS = 12;
const M = (n: number) => `${(n / 1e6).toFixed(1)}M`;

export function castleChecks(check: Check, lines: string[]): void {
  const realm = playRealm(8, WEEKS * 7, 33);
  lines.push(`## A realm of ${realm.lords.length} lords over ${WEEKS} weeks`);

  // The realm's gold: what came in from play equals what lords hold, what the chest holds and what burned.
  const drift = goldOf(realm) - (realm.start + realm.income);
  check(drift === 0, `The realm's gold balances to the coin after ${WEEKS} weeks (off by ${drift})`);
  const burned = Object.entries(realm.burned).map(([k, v]) => `${k} ${M(v)}`);
  lines.push(`Gold earned ${M(realm.income)}; burned: ${burned.join(', ')}; war chest ${M(realm.chest)}`);
  check(realm.chest >= 0, `The war chest never pays out more than it holds (${M(realm.chest)} left)`);

  for (const kind of KINDS) {
    const lords = realm.lords.filter((l) => l.kind === kind);
    const avg = (f: (l: (typeof lords)[number]) => number) => lords.reduce((n, l) => n + f(l), 0) / lords.length;
    const last = WEEKS * 7 - 1;
    const powered = avg((l) => l.powered.filter(Boolean).length / l.powered.length);
    const lost = avg((l) => l.raidedOn.reduce((a, b) => a + (b ?? 0), 0));
    const worst = Math.max(0, ...lords.flatMap((l) => l.raidedOn.map((x) => x ?? 0)));
    lines.push(
      `${kind.name} lords: castle level ${avg((l) => l.levels[last]).toFixed(1)}, tier ${avg((l) => l.tiers[last]).toFixed(1)}, ${avg((l) => l.marks[last]).toFixed(0)} war marks, edict powered ${(powered * 100).toFixed(0)}% of days, ${M(lost)} lost to sieges (the worst day ${M(worst)})`,
    );
    check(
      powered >= 0.9,
      `${kind.name} lords keep their edict powered on ${(powered * 100).toFixed(0)}% of days, sieges and all (at least 90%)`,
    );
    check(
      worst <= 3 * kind.income,
      `No ${kind.name} lord loses more than three days' earnings to sieges in a day (the worst ${M(worst)})`,
    );
  }

  // Sieges between lords: capped, and on the whole worth about their fee to the attacker.
  const sieges = realm.sieges;
  const capped = sieges.every((s) => s.raided <= 2 * s.required + 1);
  check(capped, `No siege takes more than twice what the defender's edict needs (${sieges.length} sieges)`);
  const fees = sieges.reduce((n, s) => n + s.fee, 0);
  const won = sieges.reduce((n, s) => n + s.raided, 0) * 0.65;
  const worth = won / Math.max(1, fees);
  lines.push(
    `Sieges on lords: ${sieges.length}, fees ${M(fees)}, spoils to attackers ${M(won)} (${worth.toFixed(2)} of the fees)`,
  );
  check(
    worth >= 0.75 && worth <= 2,
    `A siege on a lord earns back about its fee (${worth.toFixed(2)} of it; neither a loss nor a gold mine)`,
  );
  const bounties = realm.mercs.every((m) => m.bounty < m.fee);
  check(bounties, `Every stronghold's bounty is less than its fee (${realm.mercs.length} stronghold sieges)`);

  // What a lord meets at each castle level, with an even formation: a stronghold for every taste, a fair
  // siege held by the walls, and fortresses as far as the castle's level and a little past.
  lines.push(`\n## The odds a castle meets, with an even formation`);
  const now = T0 + 30 * DAY;
  for (const level of [3, 10, 20, 30, 50]) {
    const blank = E.newCastle('a', now - 30 * DAY);
    const levels = Object.fromEntries(Object.keys(blank.levels).map((k) => [k, level])) as E.Castle['levels'];
    const raw = { ...blank, levels, shieldUntil: 0, treasury: 1e12 };
    const c = { ...raw, rating: E.bastionRating(raw) };
    const att = E.castleSide(c, now, 'attack');
    const mercs = E.mercenaries(c, now, 5).map((m) => E.combatRatio(att, E.mercenarySide(m), 0.5).r);
    let frontier = 1;
    while (E.combatRatio(att, E.fortressSide(frontier), 0.5).r >= 1) frontier++;
    lines.push(
      `Level ${level}: strongholds ${mercs.map((r) => r.toFixed(2)).join(', ')}; the first fortress that holds is tier ${frontier}`,
    );
    check(
      mercs[0] >= 1.05 && mercs[4] < 0.95,
      `Level ${level}: the day's easiest stronghold falls to an even formation (${mercs[0].toFixed(2)}) and its hardest does not (${mercs[4].toFixed(2)})`,
    );
    check(
      frontier >= level && frontier <= 1.5 * level + 3,
      `Level ${level}: incursions open up to about the castle's level (tier ${frontier})`,
    );
  }
}
