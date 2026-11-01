// Castle Clash's reports (the War room, and a target's sheet): each siege, spy mission, mercenary battle
// and incursion, newest first, in one line with what it moved.
import { fmt, t } from '@idle-clash/content';
import { castleEngine } from '@idle-clash/features';
import { Panel, Pill } from '@idle-clash/ui';
import { fortressName, mercName, missionName, outcomeName, trapName } from './labels.ts';
import s from './castle.module.css';

type Report = castleEngine.CastleReport;
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const str = (x: unknown): string => (typeof x === 'string' ? x : '');

/** When: the time today, or the date. */
export const when = (at: number, now: number): string =>
  new Date(at).toDateString() === new Date(now).toDateString() ? fmt.time(at) : fmt.date(at);

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

export function ReportRow({ report, now }: { report: Report; now: number }) {
  const r = readReport(report);
  if (!r.line) return null;
  const line = castleEngine.sentence(r.line);
  return (
    <li className={s.report}>
      <span className={s.reportHead}>
        <span>{line}</span>
        <span className={s.reportWhen}>{when(report.at, now)}</span>
      </span>
      {r.facts.length > 0 && <span className={s.muted}>{r.facts.join(', ')}</span>}
    </li>
  );
}

export function Reports({ logs, now }: { logs: Report[]; now: number }) {
  return (
    <section data-section>
      <Panel
        title={t('castle.reports.title')}
        aside={logs.length ? <Pill>{fmt.int(logs.length)}</Pill> : undefined}
        flush
      >
        {logs.length ? (
          // The list scrolls inside its panel and holds no controls: it takes the keyboard's focus itself.
          <ul
            data-slot="castle.reports"
            className={s.reports}
            data-scrollbox
            tabIndex={0}
            aria-label={t('castle.reports.title')}
          >
            {logs.map((l) => (
              <ReportRow key={l.id} report={l} now={now} />
            ))}
          </ul>
        ) : (
          <p data-slot="castle.reports" className={s.lead}>
            {t('castle.reports.none')}
          </p>
        )}
      </Panel>
    </section>
  );
}
