import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@idle-clash/ui/tokens.css';
import '@idle-clash/ui/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { reloadOnStaleFiles, watchBuild } from './deploys.ts';
import { watchErrors } from './errors.ts';
import { boot } from './game/session.ts';
import { watchScrollboxes } from './scrollbox.ts';
import { applyTheme, followScheme, readTheme } from './theme.ts';
import { bearTranslation } from './translated.ts';

bearTranslation();
watchErrors();
reloadOnStaleFiles();
watchBuild(new URL(import.meta.url).pathname);
applyTheme(readTheme());
followScheme();
watchScrollboxes();
void boot();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
