// A player's record in the console (`/admin/players/<id>`; the brief, the console since session 227, its
// parts since session 229): their name and standing at its head, then by tabs (`?tab=`) the Summary (who
// they are, what they hold and do, their skills and castle), Account (rename, ban, password, sign out
// everywhere, messages, delete), Give and take (gold, items and XP, each with a reason), Save (check and
// mend, download, what was repaired, the save itself) and History (what admins have done to them); since
// session 234 notes admins keep for each other head the Summary, and Activity holds the days they came, the
// browsers signed in and the notices sent them. A name in the address (`@Rowan`) opens that player's record.
import { FIRE_WATCH_HOURS, type RecordResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Pill, Tabs, TextLink } from '@idle-clash/ui';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { PageHead } from '../pages/PageHead.tsx';
import { untilLoaded } from '../Ready.tsx';
import { refused } from '../refused.ts';
import { navigate, replace, useLocation } from '../router.ts';
import { Slot } from '../slots.tsx';
import { latest } from '../latest.ts';
import { opened } from './recent.ts';
import { RecordAccount } from './RecordAccount.tsx';
import { RecordActivity } from './RecordActivity.tsx';
import { RecordGrants } from './RecordGrants.tsx';
import { RecordHistory, RecordSave } from './RecordSave.tsx';
import { RecordNotes } from './RecordNotes.tsx';
import { RecordSummary } from './RecordSummary.tsx';
import s from './admin.module.css';

const TABS = ['summary', 'activity', 'account', 'grants', 'save', 'history'] as const;
type Tab = (typeof TABS)[number];
const TAB_WORDS: Record<Tab, () => string> = {
  summary: () => t('record.summary'),
  activity: () => t('record.activity'),
  account: () => t('record.account'),
  grants: () => t('record.grants'),
  save: () => t('record.save'),
  history: () => t('record.history'),
};

/** Runs an admin's press: its answer, or why it was refused, in the words given for its refusals. */
export type Run = <T>(go: () => Promise<T>, then: (r: T) => void, own?: Parameters<typeof refused>[1]) => Promise<void>;

export function PlayerRecord({ id }: { id: string }) {
  useLocation();
  const asked = new URLSearchParams(location.search).get('tab');
  const tab: Tab = TABS.find((x) => x === asked) ?? 'summary';
  const [record, setRecord] = useState<RecordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [take] = useState(latest);
  const load = () =>
    take(
      untilLoaded(api.admin.record(id)),
      (r) => {
        setRecord(r);
        opened({ id: r.id, name: r.name });
      },
      (err: unknown) => {
        if (!handled(err)) setError(refused(err, { notFound: t('admin.none') }));
      },
    );
  useEffect(() => {
    // A record named in the address (`/admin/players/@Rowan`), as an admin can write it or pass it on, is
    // found by the name and opened at its own address.
    if (id.startsWith('@'))
      void untilLoaded(api.admin.directory({ query: id.slice(1), filter: 'all', sort: 'name', page: 0 })).then(
        (r) => {
          const found = r.rows.find((x) => x.name.toLowerCase() === id.slice(1).toLowerCase());
          if (found) replace(`/admin/players/${encodeURIComponent(found.id)}${location.search}`);
          else setError(t('admin.none'));
        },
        (err: unknown) => void handled(err),
      );
    else void load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // One press at a time (session 231): a double click on Give gave twice, and on Set a new password set two.
  const busy = useRef(false);
  const run: Run = async (go, then, own) => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    try {
      then(await go());
    } catch (err) {
      if (!handled(err)) setError(refused(err, { yourself: t('record.yourself'), ...own }));
    } finally {
      busy.current = false;
    }
  };
  const here = `/admin/players/${encodeURIComponent(id)}`;
  return (
    <div className={s.record}>
      <TextLink href="/admin/players" onNavigate={navigate}>
        {t('console.allPlayers')}
      </TextLink>
      <PageHead title={record?.name ?? t('console.players')}>
        {record && (
          <p className={s.badges}>
            {record.bannedAt !== null && <Pill tone="ember">{t('admin.banned')}</Pill>}
            {record.online && <Pill tone="moss">{t('record.online')}</Pill>}
            {record.mutedUntil !== null && <Pill>{t('console.standing.muted')}</Pill>}
            {record.reports.name + record.reports.cheating > 0 && (
              <Pill tone="ember">
                {t('console.standing.reports', { count: fmt.int(record.reports.name + record.reports.cheating) })}
              </Pill>
            )}
            {record.notes.length > 0 && <Pill>{t('record.notesPill', { count: fmt.int(record.notes.length) })}</Pill>}
            {/* A fire that never sleeps is a script's (session 156). */}
            {record.fireHours >= FIRE_WATCH_HOURS && (
              <Pill tone="ember">{t('admin.fireWatch', { hours: fmt.num(record.fireHours) })}</Pill>
            )}
          </p>
        )}
      </PageHead>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {record && (
        <Slot id="admin.player" className={s.player}>
          <Tabs
            label={t('record.tabs')}
            onNavigate={navigate}
            tabs={TABS.map((x) => ({
              href: x === 'summary' ? here : `${here}?tab=${x}`,
              label: TAB_WORDS[x](),
              ...(x === 'grants' ? { short: t('record.grantsShort') } : {}),
              current: x === tab,
            }))}
          />
          {tab === 'summary' && (
            <>
              <RecordNotes key={record.id} record={record} reload={() => void load()} run={run} />
              <RecordSummary record={record} />
            </>
          )}
          {tab === 'activity' && <RecordActivity record={record} run={run} />}
          {tab === 'account' && <RecordAccount record={record} reload={() => void load()} run={run} />}
          {tab === 'grants' && <RecordGrants record={record} reload={() => void load()} run={run} />}
          {tab === 'save' && <RecordSave id={id} run={run} />}
          {tab === 'history' && <RecordHistory record={record} />}
        </Slot>
      )}
    </div>
  );
}
