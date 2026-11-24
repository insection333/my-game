// The console's Overview (session 228, `/admin`): the realm at a glance. Its players as figures (all told,
// new, playing today, this week and this month, online now, on the hiscores, banned) and how many come back;
// a fortnight of sign-ups and of players each day; what waits for an admin, each leading to where it is
// dealt with; the realm's season, boss and work; and the server's health.
import type { AdminOverviewResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Panel, TextLink } from '@idle-clash/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import { setServerTime } from '../game/clock.ts';
import { handled } from '../game/session.ts';
import { whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import { Bars } from './Bars.tsx';
import { useFresh } from './fresh.ts';
import { Facts } from './RecordSummary.tsx';
import s from './pages.module.css';

interface Tile {
  label: string;
  value: string;
  note?: string;
  href?: string;
}

function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <dl className={s.tiles}>
      {tiles.map((x) => (
        <div key={x.label} className={s.tile}>
          <dt>
            {x.href ? (
              <TextLink href={x.href} onNavigate={navigate}>
                {x.label}
              </TextLink>
            ) : (
              x.label
            )}
          </dt>
          <dd className={s.tileValue}>{x.value}</dd>
          {x.note && <dd className={s.tileNote}>{x.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

const BACKUPS = {
  fresh: () => t('console.server.backups.fresh'),
  stale: () => t('console.server.backups.stale'),
  off: () => t('console.server.backups.off'),
};

const share = (p: number | null, of: number): Pick<Tile, 'value' | 'note'> =>
  p === null
    ? { value: '–', note: t('console.kpi.noCohort') }
    : { value: fmt.pct(p), note: t('console.kpi.cohort', { count: fmt.int(of) }) };

export function Overview() {
  const [o, setO] = useState<AdminOverviewResponse | null>(null);
  // The realm's clock in the bar keeps the server's time (session 232), learnt from each read.
  const seen = (r: AdminOverviewResponse) => (setServerTime(r.at), setO(r));
  const read = () => api.admin.overview().then(seen, (err: unknown) => void handled(err));
  useEffect(() => {
    untilLoaded(api.admin.overview()).then(seen, (err: unknown) => void handled(err));
  }, []);
  useFresh(() => void read());
  if (!o) return null;
  const p = o.players;
  const { boss, work, season } = o.realm;
  const mb = (n: number) => t('console.server.mb', { mb: fmt.num(n) });
  return (
    <div className={s.stack}>
      <Slot id="admin.overview" className={s.stack}>
        <Panel title={t('console.kpi.players')} aside={fmt.int(p.total)}>
          <Tiles
            tiles={[
              { label: t('console.kpi.online'), value: fmt.int(p.online) },
              { label: t('console.kpi.activeToday'), value: fmt.int(p.activeToday) },
              { label: t('console.kpi.activeWeek'), value: fmt.int(p.activeWeek) },
              { label: t('console.kpi.activeMonth'), value: fmt.int(p.activeMonth) },
              {
                label: t('console.kpi.newWeek'),
                value: fmt.int(p.newWeek),
                note: t('console.kpi.newToday', { count: fmt.int(p.newToday) }),
                href: '/admin/players?show=new',
              },
              { label: t('console.kpi.day2'), ...share(o.retention.day2, o.retention.day2Of) },
              { label: t('console.kpi.day7'), ...share(o.retention.day7, o.retention.day7Of) },
              { label: t('console.kpi.listed'), value: fmt.int(p.listed) },
              { label: t('console.kpi.banned'), value: fmt.int(p.banned), href: '/admin/players?show=banned' },
            ]}
          />
          <div className={s.charts}>
            <Bars title={t('console.chart.active')} days={o.days} of="active" />
            <Bars title={t('console.chart.signUps')} days={o.days} of="signUps" />
          </div>
        </Panel>
      </Slot>
      <div className={s.columns}>
        <Slot id="admin.waiting">
          <Panel title={t('console.waiting')}>
            <Tiles
              tiles={[
                {
                  label: t('console.waiting.reports'),
                  value: fmt.int(o.moderation.openReports),
                  note: t('console.waiting.reported', { count: fmt.int(o.moderation.reported) }),
                  href: '/admin/moderation',
                },
                {
                  label: t('console.waiting.refused'),
                  value: fmt.int(o.moderation.refusedToday),
                  note: t('console.waiting.refusedNote'),
                  href: '/admin/mail?mail=watch',
                },
                {
                  label: t('console.waiting.muted'),
                  value: fmt.int(o.moderation.muted),
                  href: '/admin/players?show=muted',
                },
                {
                  label: t('console.waiting.feedback'),
                  value: fmt.int(o.moderation.feedbackWeek),
                  href: '/admin/test',
                },
              ]}
            />
          </Panel>
        </Slot>
        <Slot id="admin.realm">
          <Panel title={t('console.realm')}>
            {season ? (
              <Facts
                rows={[
                  [t('console.realm.season'), season.title],
                  [t('console.realm.endsAt'), whenOf(season.endsAt)],
                  ...(boss
                    ? ([
                        [
                          boss.name,
                          boss.fell
                            ? t('console.realm.fell')
                            : t('console.realm.of', { done: fmt.int(boss.strikes), of: fmt.int(boss.needed) }),
                        ],
                        [t('console.realm.struckBy'), fmt.int(boss.strikers)],
                      ] as [string, ReactNode][])
                    : []),
                  ...(work
                    ? ([
                        [
                          work.name,
                          work.done
                            ? t('console.realm.done')
                            : t('console.realm.given', {
                                given: fmt.short(work.given),
                                needed: fmt.short(work.needed),
                              }),
                        ],
                        [t('console.realm.gaveBy'), fmt.int(work.givers)],
                      ] as [string, ReactNode][])
                    : []),
                ]}
              />
            ) : (
              <p className={s.note}>{t('console.realm.noSeason')}</p>
            )}
          </Panel>
        </Slot>
        <Slot id="admin.server">
          <Panel title={t('console.server')}>
            <Facts
              rows={[
                [t('console.server.since'), whenOf(o.server.startedAt)],
                [
                  t('console.server.build'),
                  o.server.build ? <code className={s.code}>{o.server.build}</code> : t('console.server.noBuild'),
                ],
                [t('console.server.memory'), mb(o.server.memoryMb)],
                [t('console.server.database'), mb(o.server.databaseMb)],
                [t('console.server.saves'), fmt.int(o.server.saves)],
                [t('console.server.backups'), BACKUPS[o.server.backups]()],
                [t('console.server.errors'), fmt.int(o.server.errorsDay)],
              ]}
            />
          </Panel>
        </Slot>
      </div>
    </div>
  );
}
