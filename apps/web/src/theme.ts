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
 * Restyles the whole page in the new theme's colours. Chromium has been seen keeping the old theme's
 * colour on a few elements after the theme changed (on GitHub Actions: the Combat page's facts and food
 * rows, a gold pill, a resting lane's name, a locked foe's name): elements that inherit their colour
 * from a parent that takes it from a theme token. For one style pass every element is given a colour of
 * its own (`data-repaint`, in base.css), then its own again, so each works its colour out afresh.
 * Reading the layout makes each pass happen at once; nothing is painted in between.
 */
export function repaintInk(root: HTMLElement = document.documentElement) {
  root.setAttribute('data-repaint', '');
  void root.offsetHeight;
  root.removeAttribute('data-repaint');
  void root.offsetHeight;
}

/** Repaints the ink whenever the device switches between light and dark. */
export function followScheme(win: Window = window) {
  win.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => repaintInk());
}
