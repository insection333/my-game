// The notices tray and settings: sheets over any page.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useState } from 'react';
import { account, useSession } from '../game/session.ts';
import { applyTheme, readTheme, THEMES, type Theme } from '../theme.ts';
import s from './pages.module.css';

export const Tray = () => <p className={s.note}>{t('tray.empty')}</p>;

function Account() {
  const { player } = useSession();
  if (!player) return null;
  return (
    <div className={s.account}>
      <p>{t('settings.signedInAs', { name: player.name })}</p>
      <Button onClick={() => void account.signOut()}>{t('settings.signOut')}</Button>
    </div>
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
    </>
  );
}
