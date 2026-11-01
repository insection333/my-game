// Castle Clash's checks on simulated play (session 33): a realm of 24 lords (steady raiders, light lords
// who keep to themselves, lapsed lords who come back one day in four) for twelve weeks on the pure engine
// (realm.ts), and the odds a lord meets at each castle level. The year's own checks (year/checks.ts) hold
// the rest of the game to its targets with an edict running.
import { SPOILS, TEMPER } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { DAY, goldOf, KINDS, playRealm, T0 } from './realm.ts';

type Check = (ok: boolean, what: string) => void;
const WEEKS = 26;
const M = (n: number) => `${(n / 1e6).toFixed(1)}M`;
const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

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

  // Luck: fortresses' spoils as often as their odds say, and tempering a long chase with no end.
  const taken = realm.incursions.filter((x) => x.won);
  const armoury = taken.filter((x) => x.spoils === 'armoury').length / Math.max(1, taken.length);
  const hoards = taken.filter((x) => x.spoils === 'hoard').length;
  lines.push(
    `Incursions: ${realm.incursions.length}, ${taken.length} taken (${pct(taken.length / Math.max(1, realm.incursions.length))}); the armoury on ${pct(armoury)}, ${hoards} hoards`,
  );
  check(
    Math.abs(armoury - SPOILS.ARMOURY) < 0.05,
    `The hidden armoury opens on about one fortress in ten (${pct(armoury)} of ${taken.length})`,
  );
  const lost = realm.incursions.length - taken.length;
  check(lost > 0, `Some assaults on a fortress fail (${lost}): the battle's roll is a real gamble`);
  const t = realm.tempers;
  const best = Math.max(0, ...realm.lords.flatMap((l) => Object.values(l.castle.tempers)));
  lines.push(
    `Tempering: ${t.tries} tries, ${t.taken} taken, ${t.masterstrokes} masterstrokes; the best relic at +${best}`,
  );
  // The chase itself: one relic tempered try after try, as long as a lord keeps paying, a thousand times
  // over, for what each step of it costs on average.
  const chase = temperChase(1000);
  lines.push(
    `A relic's tempering, averaged over 1,000 chases: ${chase.map((c) => `+${c.to} after ${c.tries.toFixed(0)} tries (${c.marks.toFixed(0)} war marks)`).join(', ')}`,
  );
  const [five, ten, twenty] = chase;
  check(five.tries < 15, `+5 comes in a few weeks of war marks (${five.tries.toFixed(1)} tries)`);
  check(
    ten.marks > 4 * five.marks && twenty.marks > 4 * ten.marks,
    `Each further step is a longer chase: +10 costs ${(ten.marks / five.marks).toFixed(1)}× what +5 does, +20 ${(twenty.marks / ten.marks).toFixed(1)}× what +10 does`,
  );
  check(
    E.temperMult(20) < 1 + TEMPER.BONUS_MAX && E.temperChance(1000) >= TEMPER.CHANCE_MIN,
    `It never ends and never runs away: at +20 a relic is ×${E.temperMult(20).toFixed(2)}, and a try always has at least ${(TEMPER.CHANCE_MIN * 100).toFixed(0)}%`,
  );

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

/** Tries and war marks, on average over `runs` chases, to temper one relic to +5, +10 and +20. */
function temperChase(runs: number): { to: number; tries: number; marks: number }[] {
  let seed = 35;
  const roll = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
  const goals = [5, 10, 20];
  const sums = goals.map(() => ({ tries: 0, marks: 0 }));
  for (let n = 0; n < runs; n++) {
    let tempers = 0;
    let tries = 0;
    let marks = 0;
    for (const [i, goal] of goals.entries()) {
      while (tempers < goal) {
        tries++;
        marks += TEMPER.MARKS_BASE + TEMPER.MARKS_PER * tempers;
        if (roll() < E.temperChance(tempers)) tempers += roll() < TEMPER.MASTERSTROKE ? 2 : 1;
      }
      sums[i].tries += tries;
      sums[i].marks += marks;
    }
  }
  return goals.map((to, i) => ({ to, tries: sums[i].tries / runs, marks: sums[i].marks / runs }));
}
