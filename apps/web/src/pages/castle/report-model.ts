// A report as its card shows it (session 42, the owner: battle reports easy to take in and good to look
// at): who stood on each side (their arms), how it went in a word and whether that was good for you, the
// clash of strength, and what it moved. Pure, so the page and its tests read reports the same way.
import { fmt, t } from '@idle-clash/content';
import { castleEngine } from '@idle-clash/features';
import { fortressName, mercName, missionName, outcomeName } from './labels.ts';

type Report = castleEngine.CastleReport;
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const str = (x: unknown): string => (typeof x === 'string' ? x : '');

/** The Reports tab's filters, and which each report falls under. */
export const FILTERS = ['all', 'sieges', 'defences', 'strongholds', 'spies'] as const;
export type Filter = (typeof FILTERS)[number];
/** When: the time today, the day and time this year, or the date. */
export const when = (at: number, now: number): string => fmt.when(at, now);

/** The address of a report's account, over the page shown. */
export const reportSheet = (id: number) => `${location.pathname}?panel=report&report=${id}`;

const FILTER_OF: Record<string, Exclude<Filter, 'all'>> = {
  siegeOut: 'sieges',
  siegeIn: 'defences',
  mercenary: 'strongholds',
  incursion: 'strongholds',
  spyOut: 'spies',
  spyIn: 'spies',
};

export interface Spoil {
  /** The icon drawn beside it, if the game has one. */
  icon: 'gold' | 'marks' | 'lost' | null;
  text: string;
}

/** One side of a report: its arms' seed, its name, and whether it is a lord (whose card opens from it). */
export interface Side {
  seed: string;
  name: string;
  lord: boolean;
}

export interface ReportCard {
  id: number;
  at: number;
  filter: Exclude<Filter, 'all'>;
  /** A battle, or a spy's errand. */
  kind: 'battle' | 'spy';
  /** The outcome in a word ("Stormed", "Repelled", "Done unseen", "Caught"), and whether it went your way. */
  word: string;
  good: boolean;
  /** What happened, in a line: "Your siege on Keeper", "Keeper attacked you". */
  title: string;
  /** Each side's arms (the id they are drawn from) and name: the attacker on the left. */
  left: Side;
  right: Side;
  /** Attack against defence, when the battle was reckoned in full. */
  attack: number | null;
  defense: number | null;
  /** The spy mission, for a spy's errand. */
  mission: string | null;
  spoils: Spoil[];
  rout: boolean;
}

/** Your arms are drawn from your own id; a departed lord's from their report. */
export function cardOf(r: Report, me: string): ReportCard | null {
  const d = r.data;
  const foe = r.foeName ?? t('castle.departed');
  const foeSeed = str(d.foe) || `report-${r.id}`;
  const you: Side = { seed: me, name: t('arena.you'), lord: false };
  // The other lord, when there is one still (a departed lord's name is gone).
  const lord: Side = { seed: foeSeed, name: foe, lord: r.foeName !== null };
  const marks: Spoil[] =
    num(d.marks) > 0 ? [{ icon: 'marks', text: t('castle.report.marks', { marks: fmt.int(num(d.marks)) }) }] : [];
  const gold: Spoil[] =
    num(d.gold) > 0 ? [{ icon: 'gold', text: t('castle.report.gold', { gold: fmt.short(num(d.gold)) }) }] : [];
  const reckoned = typeof d.attack === 'number' && typeof d.defense === 'number';
  const base = {
    id: r.id,
    at: r.at,
    filter: FILTER_OF[r.kind],
    attack: reckoned ? num(d.attack) : null,
    defense: reckoned ? num(d.defense) : null,
    mission: null,
    rout: d.rout === true,
  };
  switch (r.kind) {
    case 'siegeOut': {
      const won = d.outcome !== 'repelled';
      return {
        ...base,
        kind: 'battle',
        word: outcomeName(str(d.outcome)),
        good: won,
        title: t('castle.reports.siegeOut', { foe }),
        left: you,
        right: lord,
        spoils: [...gold, ...marks],
      };
    }
    case 'siegeIn': {
      const held = d.outcome === 'repelled';
      const lost: Spoil[] =
        !held && num(d.raided) > 0
          ? [{ icon: 'lost', text: t('castle.report.lost', { gold: fmt.short(num(d.raided)) }) }]
          : [];
      return {
        ...base,
        kind: 'battle',
        word: held ? t('castle.reports.held') : outcomeName(str(d.outcome)),
        good: held,
        title: t('castle.reports.siegeIn', { foe }),
        left: lord,
        right: you,
        spoils: [...lost, ...marks],
      };
    }
    case 'mercenary': {
      const m = d.merc && typeof d.merc === 'object' ? (d.merc as Record<string, unknown>) : {};
      const name = mercName(num(m.first), num(m.second));
      return {
        ...base,
        kind: 'battle',
        word: outcomeName(str(d.outcome)),
        good: d.outcome !== 'repelled',
        title: t('castle.reports.stronghold', { foe: name }),
        left: you,
        right: { seed: str(m.id) || `merc-${num(m.first)}-${num(m.second)}`, name, lord: false },
        spoils: [...gold, ...marks],
      };
    }
    case 'incursion': {
      const name = fortressName(str(d.fortress));
      const won = d.won === true;
      const found: Spoil[] =
        d.spoils === 'hoard'
          ? [{ icon: null, text: castleEngine.sentence(t('castle.spoils.hoard')) }]
          : d.spoils === 'armoury'
            ? [{ icon: null, text: castleEngine.sentence(t('castle.spoils.armoury')) }]
            : [];
      return {
        ...base,
        kind: 'battle',
        word: won ? t('castle.report.won') : t('castle.report.lostIncursion'),
        good: won,
        title: t('castle.reports.fortress', { fortress: name, tier: fmt.int(num(d.tier)) }),
        left: you,
        right: { seed: str(d.fortress), name, lord: false },
        spoils: [...found, ...marks],
      };
    }
    case 'spyOut': {
      const done = d.success === true;
      return {
        ...base,
        kind: 'spy',
        mission: str(d.mission) || null,
        word: done ? t('castle.report.success') : t('castle.report.caught'),
        good: done,
        title: t('castle.reports.spyOut', { mission: missionName(str(d.mission)), foe }),
        left: you,
        right: lord,
        spoils: marks,
      };
    }
    case 'spyIn':
      return {
        ...base,
        kind: 'spy',
        mission: null,
        word: t('castle.reports.caughtTheirs'),
        good: true,
        title: t('castle.reports.spyIn', { foe }),
        left: lord,
        right: you,
        spoils: marks,
      };
    default:
      return null;
  }
}

/** The reports under a filter, newest first, grouped by the day they fell on. */
export function cardsBy(cards: ReportCard[], filter: Filter): ReportCard[] {
  return cards.filter((c) => filter === 'all' || c.filter === filter).sort((a, b) => b.at - a.at);
}
