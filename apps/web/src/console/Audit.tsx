// The console's Audit log (session 228, `/admin/audit`): every action taken from the console, newest first:
// when, by which admin, what, to which player (their record a press away) and what it changed. Searched by
// the action or a name; a hundred at a time, Older entries for the rest.
import type { AuditEntry } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { Button, Field, Panel, ResponsiveTable, TextLink, type Column } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import s from './pages.module.css';

/** Each action in the console's words; an action this page does not know is said as it is stored. */
const ACTIONS: Record<string, () => string> = {
  rename: () => t('audit.rename'),
  ban: () => t('audit.ban'),
  unban: () => t('audit.unban'),
  mend: () => t('audit.mend'),
  resetPassword: () => t('audit.resetPassword'),
  dismissReports: () => t('audit.dismissReports'),
  warn: () => t('audit.warn'),
  mute: () => t('audit.mute'),
  unmute: () => t('audit.unmute'),
};

export const actionWords = (action: string): string => (Object.hasOwn(ACTIONS, action) ? ACTIONS[action]() : action);

/** What an action changed, in words: a rename's names before and after. */
export function detailWords(e: Pick<AuditEntry, 'action' | 'detail'>): string {
  const d = e.detail;
  if (e.action === 'rename' && d && typeof d.from === 'string' && typeof d.to === 'string')
    return t('audit.renamed', { from: d.from, to: d.to });
  return '';
}

export function Audit() {
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [more, setMore] = useState<number | null>(null);
  const load = (q: string, before: number | null) =>
    untilLoaded(api.admin.audit(q, before)).then(
      (r) => {
        setEntries((was) => (before ? [...(was ?? []), ...r.entries] : r.entries));
        setMore(r.more);
      },
      (err: unknown) => void handled(err),
    );
  useEffect(() => void load(query, null), [query]);
  const search = (e: FormEvent) => {
    e.preventDefault();
    setQuery(typed.trim());
  };
  const columns: Column<AuditEntry>[] = [
    { key: 'when', label: t('console.audit.when'), cell: (e) => whenOf(e.at) },
    { key: 'admin', label: t('console.audit.admin'), cell: (e) => e.actor || t('console.audit.departed') },
    {
      key: 'action',
      label: t('console.audit.action'),
      cell: (e) => {
        const detail = detailWords(e);
        return (
          <span className={s.actionCell}>
            <span>{actionWords(e.action)}</span>
            {detail && <span className={s.muted}>{detail}</span>}
          </span>
        );
      },
    },
    {
      key: 'player',
      label: t('console.audit.player'),
      cell: (e) =>
        e.targetId && e.target ? (
          <TextLink href={`/admin/players/${encodeURIComponent(e.targetId)}`} onNavigate={navigate}>
            {e.target}
          </TextLink>
        ) : (
          (e.target ?? '–')
        ),
    },
  ];
  return (
    <Slot id="admin.audit" className={s.stack}>
      <Panel title={t('console.audit.searchTitle')}>
        <form className={s.toolbar} onSubmit={search} role="search">
          <Field
            label={t('console.audit.search')}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            maxLength={64}
          />
          <Button type="submit" variant="primary">
            {t('console.audit.find')}
          </Button>
        </form>
      </Panel>
      {entries?.length === 0 && <p className={s.note}>{t('console.audit.none')}</p>}
      {entries && entries.length > 0 && (
        <ResponsiveTable caption={t('console.audit')} columns={columns} rows={entries} rowKey={(e) => String(e.id)} />
      )}
      {more !== null && (
        <div className={s.pager}>
          <Button onClick={() => void load(query, more)}>{t('console.audit.older')}</Button>
        </div>
      )}
    </Slot>
  );
}
