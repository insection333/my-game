// Castle Clash's reports in words: a report's line and the facts beside it, and what a scouting found.
// The cards (ReportCards.tsx) and the account (Account.tsx, session 42) draw them.
import { fmt, t } from '@idle-clash/content';
import { castleEngine } from '@idle-clash/features';
import {
  chamberName,
  foeMissionDoes,
  fortressName,
  mercName,
  missionDoes,
  missionName,
  outcomeName,
  trapName,
} from './labels.ts';
import { reportSheet, when } from './report-model.ts';

export { reportSheet, when };

type Report = castleEngine.CastleReport;
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const str = (x: unknown): string => (typeof x === 'string' ? x : '');

/** A scouting's findings: the garrison's shares, the trap, the gold a siege could take. */
export function garrisonLine(report: Record<string, unknown>): string {
  const d = Array.isArray(report.defense) ? report.defense.map(num) : [0, 0, 0];
  const trap = str(report.trap);
  return t('castle.report.garrison', {
    v: fmt.int(d[0]),
    o: fmt.int(d[1]),
    s: fmt.int(d[2]),
    trap: trap ? trapName(trap) : t('castle.report.noTrap'),
    gold: fmt.short(num(report.raidable)),
  });
}

/** What a mission does, for one of the day's foes or a lord. */
const missionLeft = (mission: string, foe: boolean) => (foe ? foeMissionDoes(mission) : missionDoes(mission));

/** A report's line and the facts beside it. */
export function readReport(r: Report): { line: string; facts: string[] } {
  const d = r.data;
  const foe = r.foeName ?? t('castle.departed');
  const marks = num(d.marks) > 0 ? [t('castle.report.marks', { marks: fmt.int(num(d.marks)) })] : [];
  const gold = num(d.gold) > 0 ? [t('castle.report.gold', { gold: fmt.short(num(d.gold)) })] : [];
  const outcome = outcomeName(str(d.outcome));
  switch (r.kind) {
    case 'siegeOut':
      return { line: t('castle.report.siegeOut', { outcome, foe }), facts: [...gold, ...marks] };
    case 'siegeIn': {
      const lost = num(d.raided) > 0 && d.outcome !== 'repelled';
      return {
        line: t('castle.report.siegeIn', { foe, outcome }),
        facts: [
          ...(lost ? [t('castle.report.lost', { gold: fmt.short(num(d.raided)) })] : []),
          ...marks,
          ...(d.truce === true ? [t('castle.report.truce')] : []),
        ],
      };
    }
    case 'spyOut': {
      const report = d.report && typeof d.report === 'object' ? (d.report as Record<string, unknown>) : null;
      // Spies at one of the day's foes (session 167), named as itself.
      const m = d.merc && typeof d.merc === 'object' ? (d.merc as Record<string, unknown>) : null;
      const at = m
        ? mercName(num(m.first), num(m.second))
        : typeof d.fortress === 'string'
          ? fortressName(d.fortress)
          : typeof d.legend === 'string'
            ? chamberName(d.legend, num(d.chamber))
            : foe;
      return {
        line: t('castle.report.spyOut', { mission: missionName(str(d.mission)), foe: at }),
        facts: [
          d.success === true ? t('castle.report.success') : t('castle.report.caught'),
          ...(report ? [garrisonLine(report)] : []),
          // What a mission that got through left on them (session 169: its account said "Nothing changed
          // hands" of wells poisoned).
          ...(d.success === true && str(d.mission) !== 'scout'
            ? [
                missionLeft(
                  str(d.mission),
                  m !== null || typeof d.fortress === 'string' || typeof d.legend === 'string',
                ),
              ]
            : []),
        ],
      };
    }
    case 'spyIn':
      return { line: t('castle.report.spyIn', { foe }), facts: marks };
    case 'mercenary': {
      const m = d.merc && typeof d.merc === 'object' ? (d.merc as Record<string, unknown>) : {};
      return {
        line: t('castle.report.mercenary', { outcome, foe: mercName(num(m.first), num(m.second)) }),
        facts: [...gold, ...marks],
      };
    }
    case 'incursion':
      return {
        line: t('castle.report.incursion', { fortress: fortressName(str(d.fortress)), tier: fmt.int(num(d.tier)) }),
        facts: [
          d.won === true ? t('castle.report.won') : t('castle.report.lostIncursion'),
          ...(d.spoils === 'hoard'
            ? [t('castle.spoils.hoard')]
            : d.spoils === 'armoury'
              ? [t('castle.spoils.armoury')]
              : []),
          ...marks,
        ],
      };
    case 'legend':
      return {
        line: t('castle.legend.chamberName', {
          legend: castleEngine.legendName(str(d.legend)),
          n: fmt.int(num(d.chamber) + 1),
        }),
        facts: [d.won === true ? t('castle.report.won') : t('castle.legend.held'), ...marks],
      };
    default:
      return { line: '', facts: [] };
  }
}
