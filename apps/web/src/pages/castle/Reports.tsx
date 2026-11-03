// Castle Clash's reports in words: a report's line and the facts beside it, and what a scouting found.
// The cards (ReportCards.tsx) and the account (Account.tsx, session 42) draw them.
import { fmt, t } from '@idle-clash/content';
import type { castleEngine } from '@idle-clash/features';
import { fortressName, mercName, missionName, outcomeName, trapName } from './labels.ts';
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
      return {
        line: t('castle.report.spyOut', { mission: missionName(str(d.mission)), foe }),
        facts: [
          d.success === true ? t('castle.report.success') : t('castle.report.caught'),
          ...(report ? [garrisonLine(report)] : []),
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
    default:
      return { line: '', facts: [] };
  }
}
