// A player's record, Summary (session 229): who they are and how they stand, what they hold, each lane,
// every skill, and their castle.
import type { RecordResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Panel, ResponsiveTable, type Column } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { dayOf, whenOf } from '../pages/days.ts';
import s from './pages.module.css';

type Skill = RecordResponse['skills'][number];

export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className={s.facts}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RecordSummary({ record: r }: { record: RecordResponse }) {
  const yes = (b: boolean) => (b ? t('record.yes') : t('record.no'));
  const skills: Column<Skill>[] = [
    { key: 'skill', label: t('record.skill'), cell: (x) => x.name },
    { key: 'level', label: t('record.level'), align: 'end', cell: (x) => fmt.int(x.level) },
    { key: 'xp', label: t('record.xp'), align: 'end', cell: (x) => fmt.int(x.xp) },
  ];
  return (
    <div className={s.columns}>
      <Panel title={t('record.standing')}>
        <Facts
          rows={[
            [t('record.joined'), dayOf(r.createdAt, r.at)],
            [t('record.seen'), r.seen ? dayOf(Date.parse(`${r.seen}T12:00:00Z`), r.at) : t('console.seen.never')],
            [t('record.online'), yes(r.online)],
            [t('record.sessions'), fmt.int(r.sessions)],
            [t('record.listed'), yes(r.listed)],
            [t('record.muted'), r.mutedUntil ? whenOf(r.mutedUntil, r.at) : t('record.notMuted')],
            [t('record.reportsName'), fmt.int(r.reports.name)],
            [t('record.reportsCheating'), fmt.int(r.reports.cheating)],
            [t('record.fire'), t('record.fireHours', { hours: fmt.num(r.fireHours) })],
          ]}
        />
      </Panel>
      <Panel title={t('record.lanes')}>
        <Facts
          rows={[
            [t('record.totalLevel'), fmt.int(r.totalLevel)],
            [t('record.gold'), fmt.int(r.gold)],
            [t('record.kinds'), fmt.int(r.kinds)],
            ...r.lanes.map((l): [string, ReactNode] => [
              l.lane,
              l.doing
                ? l.stopped
                  ? t('record.laneStopped', { doing: l.doing, why: l.stopped })
                  : l.doing
                : t('record.idle'),
            ]),
          ]}
        />
      </Panel>
      <Panel title={t('record.castle')}>
        {r.castle ? (
          <Facts
            rows={[
              [t('record.castleLevel'), fmt.int(r.castle.level)],
              [t('record.rating'), fmt.int(r.castle.rating)],
            ]}
          />
        ) : (
          <p className={s.note}>{t('record.noCastle')}</p>
        )}
      </Panel>
      <div className={s.wide}>
        <Panel title={t('record.skills')} flush>
          <ResponsiveTable caption={t('record.skills')} columns={skills} rows={r.skills} rowKey={(x) => x.skill} />
        </Panel>
      </div>
    </div>
  );
}
