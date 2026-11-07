// The admin's mail monitor (session 45), under the bad actors: who has had messages refused today (most
// first, Warn, Mute for a week or Unmute), then every message sent, newest first, or only those between two
// players, holding some words, or flagged (sent the day its sender had one refused); and the messages the
// filter refused, so an attempt to get round it shows. A name searches for that player's messages.
import type { AdminMailResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel, Pill } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { Slot } from '../slots.tsx';
import s from './admin.module.css';

interface Query {
  player: string;
  other: string;
  text: string;
  flagged: boolean;
}
const NONE: Query = { player: '', other: '', text: '', flagged: false };
const LISTS = { letters: 'admin.mail.letters', refused: 'admin.mail.refused' } as const;

/** The query as the server takes it: empty fields left out. */
const asked = (q: Query) => ({
  ...(q.player.trim() ? { player: q.player.trim() } : {}),
  ...(q.other.trim() ? { other: q.other.trim() } : {}),
  ...(q.text.trim() ? { text: q.text.trim() } : {}),
  ...(q.flagged ? { flagged: true } : {}),
});

export function AdminMail() {
  const [q, setQ] = useState<Query>(NONE);
  const [found, setFound] = useState<AdminMailResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [done, setDone] = useState('');
  const load = (query: Query) =>
    api.admin.mail(asked(query)).then(
      (r) => {
        setFound(r);
        setMissing(false);
      },
      (err: unknown) => {
        if (!handled(err)) setMissing(true);
      },
    );
  useEffect(() => void load(NONE), []);
  const search = (e: FormEvent) => {
    e.preventDefault();
    void load(q);
  };
  const about = (name: string) => {
    const next = { ...NONE, player: name };
    setQ(next);
    void load(next);
  };
  const act = (name: string, action: 'warn' | 'mute' | 'unmute') =>
    api.admin.mailAction(name, action).then(
      () => {
        setDone(
          t(
            action === 'warn'
              ? 'admin.mail.warned'
              : action === 'mute'
                ? 'admin.mail.mutedDone'
                : 'admin.mail.unmutedDone',
            {
              name,
            },
          ),
        );
        void load(q);
      },
      (err: unknown) => void handled(err),
    );
  const Who = ({ name }: { name: string }) => (
    <button type="button" className={s.who} onClick={() => about(name)}>
      {name}
    </button>
  );
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
          <label className={s.check}>
            <input type="checkbox" checked={q.flagged} onChange={(e) => setQ({ ...q, flagged: e.target.checked })} />
            {t('admin.mail.flagged')}
          </label>
          <Button type="submit" variant="primary">
            {t('admin.mail.search')}
          </Button>
        </form>
        <p className={s.note} role="status">
          {missing ? t('admin.none') : done}
        </p>
        <h3 className={s.mailHead}>{t('admin.mail.watch')}</h3>
        {found && found.watch.length === 0 ? (
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
        )}
        {(['letters', 'refused'] as const).map((list) => (
          <section key={list} aria-label={t(LISTS[list])}>
            <h3 className={s.mailHead}>
              {t(LISTS[list])}
              {found && <Pill tone={list === 'refused' ? 'ember' : 'neutral'}>{fmt.int(found[list].length)}</Pill>}
            </h3>
            {found && found[list].length === 0 ? (
              <p className={s.note}>{t('admin.mail.none')}</p>
            ) : (
              <ul className={s.mailList} data-scrollbox tabIndex={0} aria-label={t(LISTS[list])}>
                {found?.[list].map((m, i) => (
                  <li key={`${m.at}-${i}`} className={s.letter} data-refused={list === 'refused' ? '' : undefined}>
                    <div className={s.letterHead}>
                      <span className={s.pair}>
                        <Who name={m.from} />
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
          </section>
        ))}
      </Panel>
    </Slot>
  );
}
