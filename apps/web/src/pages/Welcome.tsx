// The welcome page: what the game is, and creating an account or signing in. Shown at /welcome
// (create) and /welcome/sign-in, outside the shell, to anyone not signed in.
import { CONTACT_ADDRESS, fmt, t } from '@idle-clash/content';
import { INVITE_LENGTH, NAME_MAX } from '@idle-clash/contracts';
import { Button, Field, ItemIcon, MarchScene, Tabs, TextLink } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../api.ts';
import { account, loadGame, useSession } from '../game/session.ts';
import { navigate } from '../router.ts';
import { check, type Errors } from './welcome-check.ts';
import s from './welcome.module.css';

/** The loop the game is built on: ore to bars to gear to the foes it beats. */
const LOOP = ['copper-ore', 'iron-bar', 'copper-sword', 'hollow-rat'] as const;

function refusal(err: unknown): string {
  if (!(err instanceof ApiError)) return t('error.other');
  switch (err.code) {
    case 'nameTaken':
      return t('error.nameTaken');
    case 'nameNotAllowed':
      return t('error.nameNotAllowed');
    case 'wrongNameOrPassword':
      return t('error.wrongNameOrPassword');
    case 'banned':
      return t('error.banned');
    case 'inviteNeeded':
      return t('error.inviteNeeded');
    case 'inviteUnknown':
      return t('error.inviteUnknown');
    case 'offline':
      return t('error.offline');
    case 'tooManyTries':
      return t('error.tooManyTries', { wait: fmt.duration((err.retryAfterSeconds ?? 60) * 1000) });
    default:
      return t('error.other');
  }
}

const prefetch = () => void loadGame().then(() => import('../Game.tsx'));

export function Welcome({ path, next }: { path: string; next: string }) {
  const create = path !== '/welcome/sign-in';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState(false);
  const [invite, setInvite] = useState('');
  // While the closed test runs, signing up takes the invite a tester was sent.
  const invites = useSession().invites;
  const [errors, setErrors] = useState<Errors>({});
  const [working, setWorking] = useState(false);
  const keep = next !== '/' ? `?next=${encodeURIComponent(next)}` : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const code = invite.trim().toLowerCase();
    const found = check(create, name, password, age, invites ? code : null);
    setErrors(found);
    if (Object.keys(found).length) return;
    setWorking(true);
    try {
      await (create
        ? account.signUp(name.trim(), password, invites ? code : undefined)
        : account.signIn(name.trim(), password));
      navigate(next);
    } catch (err) {
      setErrors({ form: refusal(err) });
      setWorking(false);
    }
  };

  return (
    <main className={s.page} id="main">
      <MarchScene className={s.scene} />
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
        {/* Typing a name means a sign-in is coming: fetch the game's part of the page meanwhile. */}
        <form className={s.form} onSubmit={(e) => void submit(e)} onFocus={prefetch} noValidate>
          {create && invites && (
            <Field
              label={t('welcome.invite')}
              hint={t('welcome.invite.hint')}
              error={errors.invite}
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={INVITE_LENGTH + 4}
              required
            />
          )}
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
          {!create && <p className={s.hint}>{t('welcome.forgot', { address: CONTACT_ADDRESS })}</p>}
          <p className={s.legalLinks}>
            <TextLink href="/terms" onNavigate={navigate}>
              {t('legal.terms.title')}
            </TextLink>
            <TextLink href="/privacy" onNavigate={navigate}>
              {t('legal.privacy.title')}
            </TextLink>
            <TextLink href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</TextLink>
          </p>
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
