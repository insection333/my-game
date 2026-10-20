import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@idle-clash/ui/tokens.css';
import '@idle-clash/ui/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { applyTheme, readTheme } from './pages/Panels.tsx';

applyTheme(readTheme());
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// Usable: the shell has drawn and the fonts are in. Verify's speed budget waits for this mark.
requestAnimationFrame(() => {
  void document.fonts.ready.then(() => (document.documentElement.dataset.ready = 'true'));
});
