// The console's System section (session 230, `/admin/system`): the server (running since, build, memory,
// database, backups), every feature and whether it is on here, the tables that grow, and the browser
// errors of the last day, newest first, by player and page.
import type { SystemResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Panel, ResponsiveTable, type Column } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { Slot } from '../slots.tsx';
import { Facts } from './RecordSummary.tsx';
import s from './pages.module.css';

type Err = SystemResponse['errors'][number];
const BACKUPS = {
  fresh: () => t('console.server.backups.fresh'),
  stale: () => t('console.server.backups.stale'),
  off: () => t('console.server.backups.off'),
};
/** A page's address without its site, as the error report gives it. */
const pageOf = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};

export function System() {
  const [sys, setSys] = useState<SystemResponse | null>(null);
  useEffect(() => void untilLoaded(api.admin.system()).then(setSys, (err: unknown) => void handled(err)), []);
  if (!sys) return null;
  const mb = (n: number) => t('console.server.mb', { mb: fmt.num(n) });
  const columns: Column<Err>[] = [
    { key: 'when', label: t('console.audit.when'), cell: (e) => whenOf(e.at, sys.at) },
    { key: 'player', label: t('console.audit.player'), cell: (e) => e.player ?? t('console.errors.signedOut') },
    { key: 'page', label: t('console.errors.page'), cell: (e) => pageOf(e.url) },
    { key: 'message', label: t('console.errors.message'), cell: (e) => e.message },
  ];
  return (
    <div className={s.stack}>
      <Slot id="admin.system" className={s.columns}>
        <Panel title={t('console.server')}>
          <Facts
            rows={[
              [t('console.server.since'), whenOf(sys.startedAt, sys.at)],
              [t('console.server.build'), sys.build ?? t('console.server.noBuild')],
              [t('console.server.memory'), mb(sys.memoryMb)],
              [t('console.server.database'), mb(sys.databaseMb)],
              [t('console.server.backups'), BACKUPS[sys.backups]()],
            ]}
          />
        </Panel>
        <Panel title={t('console.features')}>
          <Facts rows={sys.features.map((f) => [f.id, f.on ? t('console.feature.on') : t('console.feature.off')])} />
        </Panel>
        <Panel title={t('console.tables')}>
          <Facts rows={sys.tables.map((x) => [x.name, fmt.int(x.rows)])} />
        </Panel>
      </Slot>
      <Panel title={t('console.errors')} flush={sys.errors.length > 0}>
        {sys.errors.length ? (
          <ResponsiveTable
            caption={t('console.errors')}
            columns={columns}
            rows={sys.errors}
            rowKey={(e) => `${sys.errors.indexOf(e)}`}
          />
        ) : (
          <p className={s.note}>{t('console.errors.none')}</p>
        )}
      </Panel>
    </div>
  );
}
