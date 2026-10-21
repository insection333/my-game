// The notices tray and settings: sheets over any page.
import { fmt, t } from '@idle-clash/content';
import { Button, Field, ItemIcon, TextLink } from '@idle-clash/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api.ts';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { noticesOf } from './notices.ts';
import { account, useSession } from '../game/session.ts';
import { applyTheme, readTheme, THEMES, type Theme } from '../theme.ts';
import s from './pages.module.css';

/** When the tray was last opened on this device: notices after it count as new on the bell. */
const READ_KEY = 'trayRead';
export function trayReadAt(): number {
  try {
    return Number(localStorage.getItem(READ_KEY) ?? 0);
  } catch {
    return 0;
  }
}

/** The notices tray: newest first, grouped by day, each saying what happened and where to act. */
export function Tray() {
  const view = useGame();
  const list = noticesOf(view);
  useEffect(() => {
    try {
      localStorage.setItem(READ_KEY, String(view.now));
    } catch {
      /* The count simply stays until the next visit. */
    }
    window.dispatchEvent(new Event('tray-read'));
  }, [view.now]);
  if (!list.length) return <p className={s.note}>{t('tray.empty')}</p>;
  const today = new Date(view.now).setHours(0, 0, 0, 0);
  const label = (at: number) => {
    const d = new Date(at).setHours(0, 0, 0, 0);
    return d === today ? t('tray.today') : d === today - 86_400_000 ? t('tray.yesterday') : fmt.date(at);
  };
  const days = [...new Set(list.map((n) => label(n.at)))];
  return (
    <div className={s.tray}>
      {days.map((day) => (
        <section key={day}>
          <h3 className={s.trayDay}>{day}</h3>
          <ul className={s.lines}>
            {list
              .filter((n) => label(n.at) === day)
              .map((n, i) => (
                <li key={`${n.at}-${i}`} data-kind={n.kind}>
                  <a
                    href={n.href ?? '/'}
                    data-ui="RowLink"
                    className={s.line}
                    onClick={(e) => (e.preventDefault(), navigate(n.href ?? '/'))}
                  >
                    <span className={s.lineTime}>{fmt.time(n.at)}</span>
                    {n.icon ? <ItemIcon name={n.icon} size={24} /> : <span className={s.lineDot} aria-hidden="true" />}
                    <span className={s.lineText}>{n.text}</span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Account() {
  const { player, admin } = useSession();
  if (!player) return null;
  return (
    <>
      <div className={s.account}>
        <p>{t('settings.signedInAs', { name: player.name })}</p>
        <Button onClick={() => void account.signOut()}>{t('settings.signOut')}</Button>
      </div>
      <p className={s.links}>
        <TextLink href="/privacy" onNavigate={navigate}>
          {t('legal.privacy.title')}
        </TextLink>
        <TextLink href="/terms" onNavigate={navigate}>
          {t('legal.terms.title')}
        </TextLink>
        {admin && (
          <TextLink href="/admin" onNavigate={navigate}>
            {t('admin.title')}
          </TextLink>
        )}
      </p>
    </>
  );
}

/** Deleting the account: asked for twice, the second time with the password. */
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <div className={s.danger}>
        <Button variant="quiet" onClick={() => setOpen(true)}>
          {t('settings.delete')}
        </Button>
      </div>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await account.deleteAccount(password);
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'wrongPassword' ? t('settings.delete.wrong') : t('error.other'));
      setBusy(false);
    }
  };
  return (
    <form className={s.danger} onSubmit={(e) => void submit(e)}>
      <p>{t('settings.delete.warning')}</p>
      <Field
        label={t('settings.delete.password')}
        type="password"
        autoComplete="current-password"
        value={password}
        error={error}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className={s.dangerActions}>
        <Button type="submit" variant="primary" disabled={busy || !password}>
          {t('settings.delete.confirm')}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('settings.delete.cancel')}
        </Button>
      </div>
    </form>
  );
}

export function Settings() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const choose = (v: Theme) => {
    setTheme(v);
    applyTheme(v);
    try {
      localStorage.setItem('theme', v);
    } catch {
      /* The choice still applies for this visit. */
    }
  };
  return (
    <>
      <Account />
      <fieldset className={s.choices}>
        <legend>{t('settings.theme')}</legend>
        {THEMES.map(([v, label]) => (
          <label key={v} className={s.choice}>
            <input type="radio" name="theme" data-ui="Radio" checked={theme === v} onChange={() => choose(v)} />
            {t(label)}
          </label>
        ))}
      </fieldset>
      <DeleteAccount />
    </>
  );
}
