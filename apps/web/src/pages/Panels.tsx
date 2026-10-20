// The notices tray and settings: sheets over any page.
import { t } from '@idle-clash/content';
import { useState } from 'react';
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
    <fieldset className={s.choices}>
      <legend>{t('settings.theme')}</legend>
      {THEMES.map(([v, label]) => (
        <label key={v} className={s.choice}>
          <input type="radio" name="theme" data-ui="Radio" checked={theme === v} onChange={() => choose(v)} />
          {t(label)}
        </label>
      ))}
    </fieldset>
  );
}
