// The notices tray and settings: sheets over any page.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useState } from 'react';
import { useSession } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import s from './pages.module.css';

export const Tray = () => <p className={s.note}>{t('tray.empty')}</p>;

type Theme = 'system' | 'light' | 'dark';
const THEMES: [Theme, string][] = [
  ['system', 'settings.theme.system'],
  ['light', 'settings.theme.light'],
  ['dark', 'settings.theme.dark'],
];

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

function Account() {
  const { player } = useSession();
  if (!player) return null;
  return (
    <div className={s.account}>
      <p>{t('settings.signedInAs', { name: player.name })}</p>
      <Button onClick={() => void game.signOut()}>{t('settings.signOut')}</Button>
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
