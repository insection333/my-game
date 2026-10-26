// The admin page (the brief): find a player; rename them, ban or unban them, look at their save and
// what was mended in it, and set a new password when they have forgotten theirs. Only players on the
// server's admin list reach it; everyone else gets the page that does not exist.
import type { AdminPlayerView, AdminSaveResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { ActionRow, Button, Field, Panel, Pill } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api.ts';
import { handled, useSession } from '../game/session.ts';
import { untilLoaded } from '../Ready.tsx';
import { Slot } from '../slots.tsx';
import { PageHead } from './PageHead.tsx';
import { NotFound } from './Simple.tsx';
import s from './admin.module.css';

const why = (err: unknown) =>
  !(err instanceof ApiError)
    ? t('error.other')
    : err.code === 'nameTaken'
      ? t('error.nameTaken')
      : err.code === 'nameNotAllowed'
        ? t('error.nameNotAllowed')
        : t('error.other');

export function Admin() {
  const { admin } = useSession();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<AdminPlayerView[] | null>(null);
  const [save, setSave] = useState<AdminSaveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Opens on the first players by name, so there is something to act on at once.
  useEffect(() => {
    if (admin)
      untilLoaded(api.admin.players('')).then(
        (r) => setFound(r.players),
        (err: unknown) => void handled(err),
      );
  }, [admin]);
  if (!admin) return <NotFound />;
  const run = async <T,>(go: () => Promise<T>, then: (r: T) => void) => {
    setError(null);
    try {
      then(await go());
    } catch (err) {
      if (!handled(err)) setError(why(err));
    }
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    void run(
      () => api.admin.players(query.trim()),
      (r) => setFound(r.players),
    );
  };
  const open = (id: string) => void run(() => api.admin.save(id), setSave);
  return (
    <>
      <PageHead title={t('admin.title')} />
      <div className={s.layout}>
        <section data-section>
          <Panel title={t('admin.players')} flush>
            <Slot id="admin.players">
              <form className={s.search} onSubmit={search}>
                <Field
                  label={t('admin.search')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  maxLength={64}
                />
                <Button type="submit" variant="primary">
                  {t('admin.find')}
                </Button>
              </form>
              {found?.length === 0 && <p className={s.note}>{t('admin.none')}</p>}
              {/* Up to 25 players: the list scrolls in its own box, reachable from the keyboard. */}
              <div className={s.results} tabIndex={0} aria-label={t('admin.players')}>
                {found?.map((p) => (
                  <ActionRow
                    key={p.id}
                    name={p.name}
                    facts={[
                      t('admin.joined', { date: fmt.date(p.createdAt) }),
                      t('admin.totalLevel', { level: fmt.int(p.totalLevel) }),
                    ]}
                    status={p.bannedAt ? <Pill tone="ember">{t('admin.banned')}</Pill> : undefined}
                    actions={
                      <Button variant="secondary" onClick={() => open(p.id)}>
                        {t('admin.open')}
                      </Button>
                    }
                  />
                ))}
              </div>
            </Slot>
          </Panel>
        </section>
        {save && (
          <section data-section>
            <PlayerPanel key={save.player.id} save={save} reload={open} run={run} />
          </section>
        )}
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function PlayerPanel({
  save,
  reload,
  run,
}: {
  save: AdminSaveResponse;
  reload: (id: string) => void;
  run: <T>(go: () => Promise<T>, then: (r: T) => void) => Promise<void>;
}) {
  const { player } = save;
  const [name, setName] = useState(player.name);
  const [password, setPassword] = useState<string | null>(null);
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(
      () => api.admin.rename(player.id, name.trim()),
      () => reload(player.id),
    );
  };
  return (
    <Panel title={player.name} aside={player.bannedAt ? t('admin.banned') : undefined}>
      <Slot id="admin.player" className={s.player}>
        <form className={s.search} onSubmit={rename}>
          <Field label={t('admin.newName')} value={name} onChange={(e) => setName(e.target.value)} maxLength={16} />
          <Button type="submit" variant="secondary">
            {t('admin.rename')}
          </Button>
        </form>
        <div className={s.actions}>
          <Button
            variant="secondary"
            onClick={() =>
              void run(
                () => api.admin.ban(player.id, !player.bannedAt),
                () => reload(player.id),
              )
            }
          >
            {player.bannedAt ? t('admin.unban') : t('admin.ban')}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              void run(
                () => api.admin.mend(player.id),
                () => reload(player.id),
              )
            }
          >
            {t('admin.mend')}
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              void run(
                () => api.admin.resetPassword(player.id),
                (r) => setPassword(r.password),
              )
            }
          >
            {t('admin.reset')}
          </Button>
        </div>
        {password && (
          <div className={s.password} data-password>
            <p>{t('admin.newPassword')}</p>
            <code>{password}</code>
          </div>
        )}
        <h3>{t('admin.repairs')}</h3>
        {save.repairs.length === 0 ? (
          <p className={s.note}>{t('admin.noRepairs')}</p>
        ) : (
          <ul className={s.repairs}>
            {save.repairs.map((r) => (
              <li key={r.at}>
                {fmt.date(r.at)}: {r.repairs.join('; ')}
              </li>
            ))}
          </ul>
        )}
        <h3>{t('admin.save')}</h3>
        <pre className={s.doc} data-scrolls>
          {JSON.stringify(save.doc, null, 2)}
        </pre>
      </Slot>
    </Panel>
  );
}
