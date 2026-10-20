// The welcome page: what the game is, and creating an account or signing in. Shown at /welcome
// (create) and /welcome/sign-in, outside the shell, to anyone not signed in.
import { fmt, t } from '@idle-clash/content';
import { NAME_MAX, SignUp } from '@idle-clash/contracts';
import { Button, Field, ItemIcon, Tabs } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../api.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import s from './welcome.module.css';

type Errors = Partial<Record<'name' | 'password' | 'age' | 'form', string>>;

/** The loop the game is built on: ore to bars to gear to the foes it beats. */
const LOOP = ['copper-ore', 'iron-bar', 'copper-sword', 'hollow-rat'] as const;

function refusal(err: unknown): string {
  if (!(err instanceof ApiError)) return t('error.other');
  switch (err.code) {
    case 'nameTaken':
      return t('error.nameTaken');
    case 'wrongNameOrPassword':
      return t('error.wrongNameOrPassword');
    case 'banned':
      return t('error.banned');
    case 'offline':
      return t('error.offline');
    case 'tooManyTries':
      return t('error.tooManyTries', { wait: fmt.duration((err.retryAfterSeconds ?? 60) * 1000) });
    default:
      return t('error.other');
  }
}

/** Checks the form with the server's own schema, so the page refuses what the server would. */
function check(create: boolean, name: string, password: string, age: boolean): Errors {
  const errors: Errors = {};
  if (create) {
    const r = SignUp.safeParse({ name, password, ageConfirmed: age || undefined });
    for (const issue of r.success ? [] : r.error.issues) {
      const field = issue.path[0];
      if (field === 'name') errors.name = t('error.name');
      if (field === 'password') errors.password = t('error.password');
      if (field === 'ageConfirmed') errors.age = t('error.age');
    }
  } else {
    if (!name.trim()) errors.name = t('error.name');
    if (!password) errors.password = t('error.password');
  }
  return errors;
}

export function Welcome({ path, next }: { path: string; next: string }) {
  const create = path !== '/welcome/sign-in';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [working, setWorking] = useState(false);
  const keep = next !== '/' ? `?next=${encodeURIComponent(next)}` : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = check(create, name, password, age);
    setErrors(found);
    if (Object.keys(found).length) return;
    setWorking(true);
    try {
      await (create ? game.signUp(name.trim(), password) : game.signIn(name.trim(), password));
      navigate(next);
    } catch (err) {
      setErrors({ form: refusal(err) });
      setWorking(false);
    }
  };

  return (
    <main className={s.page} id="main">
      <section data-slot="welcome.intro" className={s.intro}>
        <h1 className={s.title}>{t('welcome.title')}</h1>
        <p className={s.lead}>{t('welcome.lead')}</p>
        <ol className={s.loop} aria-hidden="true">
          {LOOP.map((icon) => (
            <li key={icon}>
              <ItemIcon name={icon} size={48} />
            </li>
          ))}
        </ol>
      </section>
      <section data-slot="welcome.form" className={s.card}>
        <Tabs
          label={t('welcome.tabs')}
          onNavigate={(href) => {
            setErrors({});
            navigate(href);
          }}
          tabs={[
            { href: `/welcome${keep}`, label: t('welcome.create'), current: create },
            { href: `/welcome/sign-in${keep}`, label: t('welcome.signIn'), current: !create },
          ]}
        />
        <form className={s.form} onSubmit={(e) => void submit(e)} noValidate>
          <Field
            label={t('welcome.name')}
            hint={create ? t('welcome.name.hint') : undefined}
            error={errors.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={create ? NAME_MAX : 64}
            required
          />
          <Field
            label={t('welcome.password')}
            hint={create ? t('welcome.password.hint') : undefined}
            error={errors.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={create ? 'new-password' : 'current-password'}
            required
          />
          {create && (
            <div className={s.age}>
              <label className={s.check}>
                <input
                  type="checkbox"
                  data-ui="Checkbox"
                  checked={age}
                  onChange={(e) => setAge(e.target.checked)}
                  aria-invalid={errors.age ? true : undefined}
                  aria-describedby={errors.age ? 'age-error' : undefined}
                />
                {t('welcome.age')}
              </label>
              {errors.age && (
                <p id="age-error" className={s.error}>
                  {errors.age}
                </p>
              )}
            </div>
          )}
          {errors.form && (
            <p className={s.error} role="alert">
              {errors.form}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={working} className={s.submit}>
            {working ? t('welcome.working') : create ? t('welcome.create') : t('welcome.signIn')}
          </Button>
          {!create && <p className={s.hint}>{t('welcome.forgot')}</p>}
        </form>
      </section>
    </main>
  );
}

/** Shown when the server cannot be reached on the first visit. */
export function Offline({ retry }: { retry: () => void }) {
  return (
    <main className={s.page} id="main">
      <section className={s.intro}>
        <h1 className={s.title}>{t('welcome.title')}</h1>
        <p className={s.lead}>{t('welcome.offline')}</p>
        <Button variant="primary" onClick={retry}>
          {t('welcome.retry')}
        </Button>
      </section>
    </main>
  );
}
