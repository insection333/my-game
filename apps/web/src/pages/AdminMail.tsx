// The admin's mail monitor (session 45), under the bad actors. A search over who wrote, to whom and what;
// then one list at a time, chosen by tabs (each with its own address, `?mail=`): every message sent,
// newest first; only those flagged (sent the day their sender had one refused); the messages the filter
// refused, so an attempt to get round it shows; and who has had messages refused today, most first. Every
// message carries Warn the sender and Mute for a week; every name searches for that player's messages.
import type { AdminLetter, AdminMailResponse, AdminRefused } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel, Pill, Tabs } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { navigate, useLocation } from '../router.ts';
import { Slot } from '../slots.tsx';
import s from './admin.module.css';

const VIEWS = ['sent', 'flagged', 'refused', 'watch'] as const;
type View = (typeof VIEWS)[number];
const LABEL: Record<View, string> = {
  sent: 'admin.mail.letters',
  flagged: 'admin.mail.flagged',
  refused: 'admin.mail.refused',
  watch: 'admin.mail.watch',
};
/** The tabs' words where the strip is narrow (a phone). */
const SHORT: Record<View, string> = {
  sent: 'admin.mail.letters',
  flagged: 'admin.mail.flagged',
  refused: 'admin.mail.refused',
  watch: 'admin.mail.watch.short',
};

interface Query {
  player: string;
  other: string;
  text: string;
}
const NONE: Query = { player: '', other: '', text: '' };

/** The query as the server takes it: empty fields left out, and whether only flagged letters are wanted. */
const asked = (q: Query, flagged: boolean) => ({
  ...(q.player.trim() ? { player: q.player.trim() } : {}),
  ...(q.other.trim() ? { other: q.other.trim() } : {}),
  ...(q.text.trim() ? { text: q.text.trim() } : {}),
  flagged,
});

const viewHref = (v: View) => {
  const url = new URL(location.href);
  url.searchParams.set('mail', v);
  return url.pathname + url.search;
};

export function AdminMail() {
  useLocation();
  const asks = new URLSearchParams(location.search).get('mail');
  const view: View = VIEWS.find((v) => v === asks) ?? 'sent';
  const [q, setQ] = useState<Query>(NONE);
  const [found, setFound] = useState<AdminMailResponse | null>(null);
  const [said, setSaid] = useState<{ text: string; bad: boolean } | null>(null);
  const load = (query: Query) =>
    api.admin.mail(asked(query, view === 'flagged')).then(
      (r) => setFound(r),
      (err: unknown) => {
        if (!handled(err)) setSaid({ text: t('admin.none'), bad: true });
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(q), [view]);
  const search = (e: FormEvent) => {
    e.preventDefault();
    setSaid(null);
    void load(q);
  };
  const about = (name: string) => {
    const next = { ...NONE, player: name };
    setQ(next);
    setSaid(null);
    if (view === 'watch') navigate(viewHref('sent'));
    else void load(next);
  };
  const DONE = { warn: 'admin.mail.warned', mute: 'admin.mail.mutedDone', unmute: 'admin.mail.unmutedDone' } as const;
  const act = (name: string, action: 'warn' | 'mute' | 'unmute') =>
    api.admin.mailAction(name, action).then(
      () => {
        setSaid({ text: t(DONE[action], { name }), bad: false });
        void load(q);
      },
      (err: unknown) => void handled(err),
    );
  const Who = ({ name }: { name: string }) => (
    <Button variant="quiet" onClick={() => about(name)}>
      {name}
    </Button>
  );
  // Each tab's count, where this search knows it (the flagged letters are among those sent).
  const count = (v: View): number | null => {
    if (!found) return null;
    if (v === 'watch') return found.watch.length;
    if (v === 'refused') return found.refused.length;
    if (v === 'flagged') return found.letters.filter((l) => l.flagged).length;
    return view === 'flagged' ? null : found.letters.length;
  };
  const letters: (AdminLetter | AdminRefused)[] = !found ? [] : view === 'refused' ? found.refused : found.letters;
  return (
    <Slot id="admin.mail" className={s.test}>
      <Panel title={t('admin.mail')} flush>
        <form className={s.mailSearch} onSubmit={search}>
          <Field
            label={t('admin.mail.player')}
            value={q.player}
            maxLength={16}
            onChange={(e) => setQ({ ...q, player: e.target.value })}
          />
          <Field
            label={t('admin.mail.other')}
            value={q.other}
            maxLength={16}
            onChange={(e) => setQ({ ...q, other: e.target.value })}
          />
          <Field
            label={t('admin.mail.text')}
            value={q.text}
            maxLength={100}
            onChange={(e) => setQ({ ...q, text: e.target.value })}
          />
          <Button type="submit" variant="primary">
            {t('admin.mail.search')}
          </Button>
        </form>
        <div className={s.mailTabs}>
          <Tabs
            label={t('admin.mail')}
            onNavigate={navigate}
            tabs={VIEWS.map((v) => ({
              href: viewHref(v),
              label: count(v) === null ? t(LABEL[v]) : `${t(LABEL[v])} (${fmt.int(count(v) ?? 0)})`,
              current: v === view,
              short: t(SHORT[v]),
            }))}
          />
        </div>
        {said && (
          <p className={said.bad ? s.error : s.note} role="status">
            {said.text}
          </p>
        )}
        {view === 'watch' ? (
          found && found.watch.length === 0 ? (
            <p className={s.note}>{t('admin.mail.watch.none')}</p>
          ) : (
            <ul className={s.mailList} data-scrollbox tabIndex={0} aria-label={t('admin.mail.watch')}>
              {found?.watch.map((w) => (
                <li key={w.name} className={s.letter}>
                  <div className={s.letterHead}>
                    <Who name={w.name} />
                    {w.muted && <Pill tone="ember">{t('admin.mail.muted')}</Pill>}
                    <span className={s.letterAt}>
                      {w.refused === 1
                        ? t('admin.mail.watch.countOne')
                        : t('admin.mail.watch.count', { count: fmt.int(w.refused) })}
                    </span>
                  </div>
                  <div className={s.letterActions}>
                    <Button variant="quiet" onClick={() => void act(w.name, 'warn')}>
                      {t('admin.mail.warn')}
                    </Button>
                    <Button variant="quiet" onClick={() => void act(w.name, w.muted ? 'unmute' : 'mute')}>
                      {t(w.muted ? 'admin.mail.unmute' : 'admin.mail.mute')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : found && letters.length === 0 ? (
          <p className={s.note}>{t('admin.mail.none')}</p>
        ) : (
          <ul className={s.mailList} data-scrollbox tabIndex={0} aria-label={t(LABEL[view])}>
            {letters.map((m, i) => (
              <li key={`${m.at}-${i}`} className={s.letter} data-refused={view === 'refused' ? '' : undefined}>
                <div className={s.letterHead}>
                  <span className={s.pair}>
                    {m.from ? <Who name={m.from} /> : <span>{t('mail.realm')}</span>}
                    <span aria-hidden="true">→</span>
                    <span className="visually-hidden">{t('admin.mail.to')}</span>
                    <Who name={m.to} />
                  </span>
                  {'flagged' in m && m.flagged && (
                    <span title={t('admin.mail.flag.note')}>
                      <Pill tone="gold">{t('admin.mail.flag')}</Pill>
                    </span>
                  )}
                  <time className={s.letterAt}>{`${fmt.date(m.at)} ${fmt.time(m.at)}`}</time>
                </div>
                <p className={s.letterBody}>{m.body}</p>
                <div className={s.letterActions}>
                  <Button variant="quiet" onClick={() => void act(m.from, 'warn')}>
                    {t('admin.mail.warnSender')}
                  </Button>
                  <Button variant="quiet" onClick={() => void act(m.from, 'mute')}>
                    {t('admin.mail.mute')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Slot>
  );
}
