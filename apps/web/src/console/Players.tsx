// A player's record in the console (`/admin/players/<id>`; the brief, the console since session 227): rename
// them, ban or unban them, check and mend their save and see what was mended, set a new password when they
// have forgotten theirs, and read the save itself. Reached from the directory and from Moderation.
import type { AdminSaveResponse } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { dayOf } from '../pages/days.ts';
import { Button, Field, Panel, TextLink } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { untilLoaded } from '../Ready.tsx';
import { refused } from '../refused.ts';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import { PageHead } from '../pages/PageHead.tsx';
import s from './admin.module.css';

const why = (err: unknown) =>
  refused(err, {
    nameTaken: t('error.nameTaken'),
    nameNotAllowed: t('error.nameNotAllowed'),
    notFound: t('admin.none'),
  });

export function PlayerRecord({ id }: { id: string }) {
  const [save, setSave] = useState<AdminSaveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = (then?: () => void) =>
    untilLoaded(api.admin.save(id)).then(
      (r) => {
        setSave(r);
        then?.();
      },
      (err: unknown) => {
        if (!handled(err)) setError(why(err));
      },
    );
  useEffect(() => void load(), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async <T,>(go: () => Promise<T>, then: (r: T) => void) => {
    setError(null);
    try {
      then(await go());
    } catch (err) {
      if (!handled(err)) setError(why(err));
    }
  };
  return (
    <div className={s.record}>
      <TextLink href="/admin/players" onNavigate={navigate}>
        {t('console.allPlayers')}
      </TextLink>
      <PageHead title={save?.player.name ?? t('console.players')} />
      {save && <PlayerPanel key={save.player.id} save={save} reload={() => void load()} run={run} />}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PlayerPanel({
  save,
  reload,
  run,
}: {
  save: AdminSaveResponse;
  reload: () => void;
  run: <T>(go: () => Promise<T>, then: (r: T) => void) => Promise<void>;
}) {
  const { player } = save;
  const [name, setName] = useState(player.name);
  const [password, setPassword] = useState<string | null>(null);
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(
      () => api.admin.rename(player.id, name.trim()),
      () => reload(),
    );
  };
  return (
    <Panel title={t('console.record.account')} aside={player.bannedAt ? t('admin.banned') : undefined}>
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
                () => reload(),
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
                () => reload(),
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
                {dayOf(r.at)}: {r.repairs.join('; ')}
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
