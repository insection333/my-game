// Castle Clash's reports (the War room, Incursions, a target's sheet): each siege, spy mission, stronghold
// battle and incursion, newest first, in one line with what it moved. Each opens its account
// (`?panel=report&report=<id>`, session 38): both sides' strength, the day's fortune and what came of it.
import { SIEGE, fmt, t } from '@idle-clash/content';
import { castleEngine } from '@idle-clash/features';
import { Button, Panel, Pill, ProgressBar, Sheet, TextLink } from '@idle-clash/ui';
import { navigate, withPanel } from '../../router.ts';
import { fortressName, mercName, missionName, outcomeName, trapName } from './labels.ts';
import { useSyncedCastle } from './synced.ts';
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

/** The address of a report's account, over the page shown. */
export const reportSheet = (id: number) => `${location.pathname}?panel=report&report=${id}`;

export function ReportRow({ report, now }: { report: Report; now: number }) {
  const r = readReport(report);
  if (!r.line) return null;
  const line = castleEngine.sentence(r.line);
  return (
    <li className={s.report}>
      <span className={s.reportHead}>
        <TextLink href={reportSheet(report.id)} onNavigate={navigate}>
          {line}
        </TextLink>
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
          <ul data-slot="castle.reports" className={s.reports} data-scrollbox aria-label={t('castle.reports.title')}>
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

const num2 = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const shares = (x: unknown): number[] | null =>
  Array.isArray(x) && x.length === 3 && x.every((v) => typeof v === 'number') ? x : null;
const signed = (f: number) => `${f >= 0 ? '+' : '−'}${fmt.pct(Math.round(Math.abs(f) * 100))}`;

/** A report's account (session 38), over whichever tab is open: the battle's two sides, the day's fortune
 *  and the ratio they made, the formation, and what moved; a lord's report offers the next siege. */
export function ReportSheet() {
  const { view, now, targets } = useSyncedCastle();
  const id = Number(new URLSearchParams(location.search).get('report'));
  const report = view?.logs.find((l) => l.id === id);
  if (!report) return null;
  const close = () => navigate(withPanel(null).replace(/[?&]report=[^&]*/, ''));
  const { line, facts } = readReport(report);
  const d = report.data;
  const defending = report.kind === 'siegeIn';
  const battle = report.kind !== 'spyOut' && report.kind !== 'spyIn';
  const attack = num2(d.attack);
  const defense = num2(d.defense);
  const fortune = num2(d.fortune);
  const r = num2(d.r);
  const fee = num2(d.fee);
  const walls = num2(d.walls);
  const most = Math.max(attack ?? 0, defense ?? 0, 1);
  const formation = shares(d.formation);
  const won = report.kind === 'incursion' ? d.won === true : d.outcome !== 'repelled';
  const good = defending ? !won : won;
  const foe = typeof d.foe === 'string' ? targets?.lords.find((l) => l.id === d.foe) : undefined;
  const sheetOf = (target: string) => `/castle?panel=target&target=${encodeURIComponent(target)}`;
  return (
    <Sheet title={castleEngine.sentence(line)} closeLabel={t('shell.close')} onClose={close} slot="castle.account">
      <div className={s.sheet}>
        <div className={s.pills}>
          {battle && (
            <Pill tone={good ? 'moss' : 'ember'}>{good ? t('castle.account.won') : t('castle.account.lost')}</Pill>
          )}
          {d.rout === true && <Pill tone="gold">{t('castle.strongholds.routed')}</Pill>}
          <Pill>{when(report.at, now)}</Pill>
        </div>
        {battle && attack !== null && defense !== null ? (
          <div className={s.sheetSection}>
            <h3>{t('castle.account.title')}</h3>
            <div className={s.sides}>
              {(
                [
                  [
                    defending
                      ? t('castle.account.theirAttack', { n: fmt.int(attack) })
                      : t('castle.account.yourAttack', { n: fmt.int(attack) }),
                    attack,
                  ],
                  [
                    defending
                      ? t('castle.account.yourDefence', { n: fmt.int(defense) })
                      : t('castle.account.theirDefence', { n: fmt.int(defense) }),
                    defense,
                  ],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className={s.side}>
                  <span>{label}</span>
                  <ProgressBar value={n / most} label={label} />
                </div>
              ))}
            </div>
            {fortune !== null && <p>{t('castle.account.fortune', { pct: signed(fortune) })}</p>}
            {r !== null && (
              <p className={s.muted}>
                {t('castle.account.ratio', {
                  r: r.toFixed(2),
                  breach: SIEGE.GRAZE_FROM.toFixed(2),
                  decisive: SIEGE.DECISIVE_FROM.toFixed(2),
                })}
              </p>
            )}
            {formation && (
              <p className={s.muted}>
                {t(defending ? 'castle.account.theyCame' : 'castle.account.youCame', {
                  v: fmt.int(formation[0]),
                  o: fmt.int(formation[1]),
                  s: fmt.int(formation[2]),
                })}
              </p>
            )}
          </div>
        ) : (
          battle && <p className={s.muted}>{t('castle.account.none')}</p>
        )}
        <div className={s.sheetSection}>
          <h3>{t('castle.account.moved')}</h3>
          <p>{facts.length ? facts.join(', ') : t('castle.account.nothing')}</p>
          {fee !== null && <p className={s.muted}>{t('castle.account.fee', { gold: fmt.short(fee) })}</p>}
          {defending && walls !== null && (
            <p className={s.muted}>{t('castle.account.walls', { pct: fmt.pct(Math.floor(walls)) })}</p>
          )}
        </div>
        {foe && (
          <div className={s.save}>
            <Button variant="primary" onClick={() => navigate(sheetOf(foe.id))}>
              {defending ? t('castle.target.strikeBack') : t('castle.account.again')}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
