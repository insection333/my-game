// The kinds of lord in the realm (realm.ts), and its dice.

export interface LordKind {
  name: string;
  /** Visits a day (hours after midnight); a lapsed lord skips days after its first week. */
  visits: number[];
  /** Gold earned a day, and the total level the lord holds (for the treasury it needs). */
  income: number;
  totalLevel: number;
  /** Days of each four, from its second week, it plays at all. */
  playsOf4: number;
  /** The treasury it keeps, in times what its edict needs: more for a stronger edict, and more to raid. */
  treasury: number;
  /** Whether it goes to war, against other lords and today's strongholds. */
  raids: boolean;
  /** Whether it sends spies to the day's strongholds (session 178). */
  spies: boolean;
}

export const KINDS: LordKind[] = [
  {
    name: 'steady',
    visits: [8],
    income: 1_500_000,
    totalLevel: 420,
    playsOf4: 4,
    raids: true,
    treasury: 2.5,
    spies: false,
  },
  // A steady player who goes for the rout (session 178): heals between sieges, sends spies, saves for it.
  {
    name: 'warlord',
    visits: [8],
    income: 1_500_000,
    totalLevel: 420,
    playsOf4: 4,
    raids: true,
    treasury: 2.5,
    spies: true,
  },
  {
    name: 'light',
    visits: [8, 20],
    income: 500_000,
    totalLevel: 300,
    playsOf4: 4,
    raids: false,
    treasury: 1.5,
    spies: false,
  },
  {
    name: 'lapsed',
    visits: [8],
    income: 400_000,
    totalLevel: 250,
    playsOf4: 1,
    raids: true,
    treasury: 2,
    spies: false,
  },
];

export function generator(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}
