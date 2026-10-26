// The colour theme: the device's own, or light or dark by choice, remembered on this device.

export type Theme = 'system' | 'light' | 'dark';
export const THEMES: [Theme, string][] = [
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
  repaintInk();
}

/**
 * Passes the new theme's ink down the whole page. Chromium has been seen to keep an inherited text
 * colour from the old theme on a few elements after the theme changed (on GitHub Actions, the Combat
 * page's facts and food rows); changing the root's own colour for one style pass makes every element
 * that inherits its colour work it out again. Nothing is painted in between.
 */
export function repaintInk(root: HTMLElement = document.documentElement) {
  root.style.color = 'transparent';
  void getComputedStyle(root).color;
  root.style.removeProperty('color');
  void getComputedStyle(root).color;
}

/** Repaints the ink whenever the device switches between light and dark. */
export function followScheme(win: Window = window) {
  win.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => repaintInk());
}
