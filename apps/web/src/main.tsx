import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@idle-clash/ui/tokens.css';
import '@idle-clash/ui/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { watchErrors } from './errors.ts';
import { boot } from './game/store.ts';
import { applyTheme, readTheme } from './pages/Panels.tsx';

watchErrors();
applyTheme(readTheme());
void boot();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
