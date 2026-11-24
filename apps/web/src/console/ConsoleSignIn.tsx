// The admin console's sign-in (session 227), at /admin for anyone not signed in: the game's mark on the
// lodge's night, a name and a password. The console's own account opens the console; a player on the admin
// list goes on to it inside the game; any other account goes on to the game.
import { t } from '@idle-clash/content';
import { Button, Field, GameMark } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { account, sessionStore } from '../game/session.ts';
import { Ready } from '../Ready.tsx';
import { refused } from '../refused.ts';
import { replace } from '../router.ts';
import s from './console.module.css';

export default function ConsoleSignIn() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.title = t('console.title');
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await account.signIn(name.trim(), password);
      const now = sessionStore.get();
      // A player not on the admin list is signed in, and goes on to the game.
      if (now.phase === 'playing' && !now.admin) replace('/');
    } catch (err) {
      setError(refused(err, { wrongNameOrPassword: t('error.wrongNameOrPassword'), banned: t('error.banned') }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className={s.gate} data-chrome>
      <form className={s.gateCard} onSubmit={(e) => void submit(e)} noValidate data-slot="console.signIn">
        <div className={s.gateMark}>
          <GameMark size={40} />
          <div>
            <p className={s.gateGame}>{t('shell.name')}</p>
            <h1 className={s.gateTitle}>{t('console.title')}</h1>
          </div>
        </div>
        <p className={s.gateLead}>{t('console.signIn.lead')}</p>
        <Field
          label={t('console.signIn.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={64}
          required
        />
        <Field
          label={t('console.signIn.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className={s.gateError} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={busy || !name.trim() || !password}>
          {t('console.signIn.submit')}
        </Button>
      </form>
      <Ready />
    </main>
  );
}
