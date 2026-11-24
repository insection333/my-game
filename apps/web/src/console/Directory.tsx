// The console's directory of players (session 228, `/admin/players`): find by any part of a name, show one
// kind (new this week, played this week, away a week, banned, reported, muted), sort, and page through 50
// at a time; each name opens the player's record. The search, the kind, the order and the page are in
// the address, so a view can be kept or passed on.
import {
  DIRECTORY_FILTERS,
  DIRECTORY_PAGE,
  DIRECTORY_SORTS,
  type DirectoryFilter,
  type DirectoryResponse,
  type DirectoryRow,
  type DirectorySort,
} from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel, Pill, ResponsiveTable, Tabs, TextLink, type Column } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { dayOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { navigate, useLocation } from '../router.ts';
import { Slot } from '../slots.tsx';
import s from './pages.module.css';

const FILTER_WORDS: Record<DirectoryFilter, string> = {
  all: 'console.filter.all',
  new: 'console.filter.new',
  active: 'console.filter.active',
  away: 'console.filter.away',
  banned: 'console.filter.banned',
  reported: 'console.filter.reported',
  muted: 'console.filter.muted',
};
/** A short word for each, where a phone turns the strip compact. */
const FILTER_SHORT: Record<DirectoryFilter, string> = {
  all: 'console.filter.all',
  new: 'console.filterShort.new',
  active: 'console.filterShort.active',
  away: 'console.filterShort.away',
  banned: 'console.filter.banned',
  reported: 'console.filter.reported',
  muted: 'console.filter.muted',
};
const SORT_SHORT: Record<DirectorySort, string> = {
  joined: 'console.sort.joined',
  name: 'console.sort.name',
  level: 'console.sortShort.level',
  seen: 'console.sortShort.seen',
};
const SORT_WORDS: Record<DirectorySort, string> = {
  joined: 'console.sort.joined',
  name: 'console.sort.name',
  level: 'console.sort.level',
  seen: 'console.sort.seen',
};

interface Ask {
  query: string;
  filter: DirectoryFilter;
  sort: DirectorySort;
  page: number;
}

function askOf(search: string): Ask {
  const p = new URLSearchParams(search);
  const filter = DIRECTORY_FILTERS.find((f) => f === p.get('show')) ?? 'all';
  const sort = DIRECTORY_SORTS.find((x) => x === p.get('sort')) ?? 'joined';
  const page = Math.max(0, Math.min(10_000, Math.floor(Number(p.get('page')) || 0)));
  return { query: (p.get('q') ?? '').slice(0, 64), filter, sort, page };
}

export function hrefOf(a: Ask): string {
  const p = new URLSearchParams();
  if (a.query) p.set('q', a.query);
  if (a.filter !== 'all') p.set('show', a.filter);
  if (a.sort !== 'joined') p.set('sort', a.sort);
  if (a.page) p.set('page', String(a.page));
  const q = p.toString();
  return `/admin/players${q ? `?${q}` : ''}`;
}

const playerHref = (id: string) => `/admin/players/${encodeURIComponent(id)}`;

function Standing({ row, now }: { row: DirectoryRow; now: number }) {
  const pills = [
    row.bannedAt !== null && (
      <Pill key="b" tone="ember">
        {t('admin.banned')}
      </Pill>
    ),
    row.openReports > 0 && (
      <Pill key="r" tone="ember">
        {t('console.standing.reports', { count: fmt.int(row.openReports) })}
      </Pill>
    ),
    row.mutedUntil !== null && row.mutedUntil > now && <Pill key="m">{t('console.standing.muted')}</Pill>,
    !row.listed && <Pill key="l">{t('console.standing.unlisted')}</Pill>,
  ].filter(Boolean);
  return pills.length ? <span className={s.pills}>{pills}</span> : <span>{t('console.standing.fine')}</span>;
}

export function Directory() {
  useLocation();
  const ask = askOf(location.search);
  const [typed, setTyped] = useState(ask.query);
  const [found, setFound] = useState<DirectoryResponse | null>(null);
  const key = hrefOf(ask);
  useEffect(() => {
    untilLoaded(api.admin.directory(askOf(location.search))).then(setFound, (err: unknown) => void handled(err));
  }, [key]);
  const go = (next: Partial<Ask>) => navigate(hrefOf({ ...ask, page: 0, ...next }));
  const search = (e: FormEvent) => {
    e.preventDefault();
    go({ query: typed.trim() });
  };
  const now = found?.at ?? 0;
  const columns: Column<DirectoryRow>[] = [
    {
      key: 'name',
      label: t('console.col.name'),
      cell: (r) => (
        <TextLink href={playerHref(r.id)} onNavigate={navigate}>
          {r.name}
        </TextLink>
      ),
    },
    { key: 'joined', label: t('console.col.joined'), cell: (r) => dayOf(r.createdAt) },
    {
      key: 'seen',
      label: t('console.col.seen'),
      cell: (r) => (r.seen ? dayOf(Date.parse(`${r.seen}T12:00:00Z`)) : t('console.seen.never')),
    },
    { key: 'level', label: t('console.col.level'), align: 'end', cell: (r) => fmt.int(r.totalLevel) },
    { key: 'standing', label: t('console.col.standing'), cell: (r) => <Standing row={r} now={now} /> },
  ];
  const from = ask.page * DIRECTORY_PAGE;
  const total = found?.total ?? 0;
  return (
    <Slot id="admin.players" className={s.stack}>
      <Panel title={t('console.findPlayers')} aside={found ? fmt.int(total) : undefined}>
        <form className={s.toolbar} onSubmit={search} role="search">
          <Field label={t('admin.search')} value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={64} />
          <Button type="submit" variant="primary">
            {t('admin.find')}
          </Button>
        </form>
        <Tabs
          label={t('console.filters')}
          onNavigate={navigate}
          tabs={DIRECTORY_FILTERS.map((f) => ({
            href: hrefOf({ ...ask, filter: f, page: 0 }),
            label: t(FILTER_WORDS[f]),
            short: t(FILTER_SHORT[f]),
            current: f === ask.filter,
          }))}
        />
        <Tabs
          label={t('console.sorts')}
          onNavigate={navigate}
          tabs={DIRECTORY_SORTS.map((x) => ({
            href: hrefOf({ ...ask, sort: x, page: 0 }),
            label: t(SORT_WORDS[x]),
            short: t(SORT_SHORT[x]),
            current: x === ask.sort,
          }))}
        />
      </Panel>
      {found && found.rows.length === 0 && <p className={s.note}>{t('console.directory.none')}</p>}
      {found && found.rows.length > 0 && (
        <>
          {/* On a panel's own ground, where its pills read as they do everywhere else. */}
          <Panel flush>
            <ResponsiveTable caption={t('admin.players')} columns={columns} rows={found.rows} rowKey={(r) => r.id} />
          </Panel>
          <div className={s.pager}>
            <span>
              {t('console.page', {
                from: fmt.int(from + 1),
                to: fmt.int(from + found.rows.length),
                total: fmt.int(total),
              })}
            </span>
            <span className={s.pagerButtons}>
              <Button disabled={ask.page === 0} onClick={() => go({ page: ask.page - 1 })}>
                {t('console.prev')}
              </Button>
              <Button disabled={from + found.rows.length >= total} onClick={() => go({ page: ask.page + 1 })}>
                {t('console.next')}
              </Button>
            </span>
          </div>
        </>
      )}
    </Slot>
  );
}
