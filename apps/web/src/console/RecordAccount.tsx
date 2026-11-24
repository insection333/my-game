// A player's record, Account (session 229; the admin page's first powers): rename them; ban or unban them,
// a ban asked once; set a new password, shown once to pass on; sign them out on every device, asked once;
// warn, mute or unmute their messages; and delete the account, their name typed to be sure.
import type { RecordResponse } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { navigate } from '../router.ts';
import type { Run } from './Players.tsx';
import s from './admin.module.css';
import p from './pages.module.css';

type Asking = 'ban' | 'signOut' | null;

export function RecordAccount({ record: r, reload, run }: { record: RecordResponse; reload: () => void; run: Run }) {
  const [name, setName] = useState(r.name);
  const [password, setPassword] = useState<string | null>(null);
  const [asking, setAsking] = useState<Asking>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const banned = r.bannedAt !== null;
  const done = (words: string) => () => {
    setAsking(null);
    setSaid(words);
    reload();
  };
  const rename = (e: FormEvent) => {
    e.preventDefault();
    void run(() => api.admin.rename(r.id, name.trim()), done(''), {
      nameTaken: t('error.nameTaken'),
      nameNotAllowed: t('error.nameNotAllowed'),
    });
  };
  const remove = (e: FormEvent) => {
    e.preventDefault();
    void run(
      () => api.admin.remove(r.id, typed),
      () => navigate('/admin/players'),
      { invalidInput: t('record.typeName') },
    );
  };
  const ask = (words: string, yes: string, go: () => Promise<unknown>, after: string) => (
    <div className={s.ask} role="group" aria-label={words}>
      <p>{words}</p>
      <div className={s.actions}>
        <Button variant="primary" onClick={() => void run(go, done(after))}>
          {yes}
        </Button>
        <Button onClick={() => setAsking(null)}>{t('record.cancel')}</Button>
      </div>
    </div>
  );
  return (
    <div className={s.player}>
      <Panel title={t('record.account')}>
        <div className={s.player}>
          <form className={p.toolbar} onSubmit={rename}>
            <Field label={t('admin.newName')} value={name} onChange={(e) => setName(e.target.value)} maxLength={16} />
            <Button type="submit">{t('admin.rename')}</Button>
          </form>
          {asking === 'ban' ? (
            ask(t('record.banAsk', { name: r.name }), t('record.yesBan'), () => api.admin.ban(r.id, true), '')
          ) : asking === 'signOut' ? (
            ask(
              t('record.signOutAsk', { name: r.name }),
              t('record.signOut'),
              () => api.admin.signOut(r.id),
              t('record.signedOut'),
            )
          ) : (
            <div className={s.actions}>
              <Button
                onClick={() => (banned ? void run(() => api.admin.ban(r.id, false), done('')) : setAsking('ban'))}
              >
                {banned ? t('admin.unban') : t('admin.ban')}
              </Button>
              <Button onClick={() => setAsking('signOut')}>{t('record.signOut')}</Button>
              <Button
                variant="primary"
                onClick={() =>
                  void run(
                    () => api.admin.resetPassword(r.id),
                    (x) => setPassword(x.password),
                  )
                }
              >
                {t('admin.reset')}
              </Button>
            </div>
          )}
          {password && (
            <div className={s.password} data-password>
              <p>{t('admin.newPassword')}</p>
              <code>{password}</code>
            </div>
          )}
          {said && (
            <p className={p.note} role="status">
              {said}
            </p>
          )}
        </div>
      </Panel>
      <Panel title={t('record.mail')}>
        <div className={s.actions}>
          <Button onClick={() => void run(() => api.admin.mailAction(r.name, 'warn'), done(t('record.warned')))}>
            {t('record.warn')}
          </Button>
          {r.mutedUntil ? (
            <Button onClick={() => void run(() => api.admin.mailAction(r.name, 'unmute'), done(t('record.unmuted')))}>
              {t('record.unmute')}
            </Button>
          ) : (
            <Button onClick={() => void run(() => api.admin.mailAction(r.name, 'mute'), done(t('record.mutedNow')))}>
              {t('record.mute')}
            </Button>
          )}
        </div>
      </Panel>
      <Panel title={t('record.danger')}>
        <form className={p.form} onSubmit={remove}>
          <p className={p.note}>{t('record.dangerLead')}</p>
          <Field label={t('record.typeName')} value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={64} />
          <div className={s.actions}>
            <Button type="submit" variant="primary" disabled={typed.trim() !== r.name}>
              {t('record.delete')}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
