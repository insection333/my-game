// The icon review sheet (not part of the game): every icon at 24, 48 and 96 px on each theme's
// surface, by family. Verify's review step screenshots this page.
import '@idle-clash/ui/tokens.css';
import '@idle-clash/ui/base.css';
import { ICONS, ItemIcon, REFERENCE_SET } from '@idle-clash/ui';
import { createRoot } from 'react-dom/client';

const Sheet = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div
    data-theme-block={theme}
    style={{
      background: theme === 'light' ? '#f4f6f1' : '#1a262b',
      color: theme === 'light' ? '#1b2629' : '#e4eae5',
      padding: 24,
    }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
      {REFERENCE_SET.map((n) => (
        <figure key={n} style={{ margin: 0, display: 'grid', gap: 8, justifyItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
            <ItemIcon name={n} size={96} />
            <ItemIcon name={n} size={48} />
            <ItemIcon name={n} size={24} />
          </div>
          <figcaption style={{ font: '13px var(--font-ui)', textAlign: 'center' }}>
            {ICONS[n].title} <span style={{ opacity: 0.6 }}>({ICONS[n].family})</span>
          </figcaption>
        </figure>
      ))}
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <>
    <Sheet theme="light" />
    <Sheet theme="dark" />
  </>,
);
requestAnimationFrame(() => (document.documentElement.dataset.ready = 'true'));
