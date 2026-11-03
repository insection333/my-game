// The Reports tab (session 42, the owner: battle reports easy to take in and good to look at): every
// siege, defence, stronghold, fortress and spy's errand as a card, newest first under the day it fell on,
// with filters across the top. The War tab shows the latest few (LatestReports) with the way here.
import { fmt, t } from '@idle-clash/content';
import type { castleEngine } from '@idle-clash/features';
import { Panel, Pill, Tabs, TextLink } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { cardOf, cardsBy, FILTERS, type Filter, type ReportCard } from './report-model.ts';
import { ReportCardLink } from './ReportCards.tsx';
import { useSyncedCastle } from './synced.ts';
import s from './reports.module.css';

const FILTER_KEY: Record<Filter, string> = {
  all: 'castle.reports.filter.all',
  sieges: 'castle.reports.filter.sieges',
  defences: 'castle.reports.filter.defences',
  strongholds: 'castle.reports.filter.strongholds',
  spies: 'castle.reports.filter.spies',
};
const label = (f: Filter) => t(FILTER_KEY[f]);

const DAY = 86_400_000;
/** The day a report fell on, as its heading says it: Today, Yesterday, or the date. */
function dayOf(at: number, now: number): string {
  const day = (x: number) => new Date(x).toDateString();
  if (day(at) === day(now)) return t('castle.reports.today');
  if (day(at) === day(now - DAY)) return t('castle.reports.yesterday');
  return fmt.date(at);
}

/** The castle's reports as cards; a report the page cannot read (an older kind) is left out. */
export function useCards(): { cards: ReportCard[]; now: number } {
  const { view, castle, now } = useSyncedCastle();
  const logs: castleEngine.CastleReport[] = view?.logs ?? [];
  const me = castle?.userId ?? '';
  return { cards: logs.map((l) => cardOf(l, me)).filter((c): c is ReportCard => c !== null), now };
}

export function ReportsTab() {
  const { cards, now } = useCards();
  const asked = new URLSearchParams(location.search).get('show');
  const filter: Filter = FILTERS.find((f) => f === asked) ?? 'all';
  const shown = cardsBy(cards, filter);
  const days = [...new Set(shown.map((c) => dayOf(c.at, now)))];
  return (
    <section data-section>
      <Panel title={t('castle.reports.title')} aside={<Pill>{fmt.int(shown.length)}</Pill>} flush>
        <div className={s.filters}>
          <Tabs
            label={t('castle.reports.filters')}
            onNavigate={navigate}
            tabs={FILTERS.map((f) => ({
              href: f === 'all' ? '/castle/reports' : `/castle/reports?show=${f}`,
              label: label(f),
              current: f === filter,
            }))}
          />
        </div>
        <div data-slot="castle.reports" className={s.days} data-scrollbox>
          {shown.length === 0 ? (
            <p className={s.none}>{t('castle.reports.none')}</p>
          ) : (
            days.map((d) => (
              <section key={d} className={s.day} aria-label={d}>
                <h3 className={s.dayName}>{d}</h3>
                <ul className={s.cards}>
                  {shown
                    .filter((c) => dayOf(c.at, now) === d)
                    .map((c) => (
                      <ReportCardLink key={c.id} card={c} now={now} />
                    ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </Panel>
    </section>
  );
}

/** The War tab's latest three reports, and the way to the rest. */
export function LatestReports() {
  const { cards, now } = useCards();
  const latest = cardsBy(cards, 'all').slice(0, 3);
  return (
    <section data-section>
      <Panel title={t('castle.reports.latest')} flush>
        <div data-slot="castle.latest">
          {latest.length ? (
            <ul className={s.cards}>
              {latest.map((c) => (
                <ReportCardLink key={c.id} card={c} now={now} />
              ))}
            </ul>
          ) : (
            <p className={s.none}>{t('castle.reports.none')}</p>
          )}
        </div>
        {cards.length > latest.length && (
          <p className={s.more}>
            <TextLink href="/castle/reports" onNavigate={navigate}>
              {t('castle.reports.all')}
            </TextLink>
          </p>
        )}
      </Panel>
    </section>
  );
}
