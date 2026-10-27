// The icon review sheet (not part of the game): every icon at 24, 48 and 96 px on each theme's
// surface, the reference set first and every later icon after it. Verify's review step screenshots
// this page.
import '@idle-clash/ui/tokens.css';
import '@idle-clash/ui/base.css';
import { ICONS, ItemIcon, REFERENCE_SET } from '@idle-clash/ui';

const ALL = [...REFERENCE_SET, ...Object.keys(ICONS).filter((n) => !REFERENCE_SET.includes(n))];
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
      {ALL.map((n) => (
        <figure key={n} style={{ margin: 0, display: 'grid', gap: 8, justifyItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
            <ItemIcon name={n} size={96} />
            <ItemIcon name={n} size={48} />
            <ItemIcon name={n} size={24} />
          </div>
          <figcaption style={{ font: '13px var(--font-ui)', textAlign: 'center' }}>
            {ICONS[n].title}{' '}
            <span style={{ opacity: 0.6 }}>
              ({ICONS[n].family}
              {REFERENCE_SET.includes(n) ? ', reference' : ''})
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
    {/* A seal's rim follows its skill's highest tier, with a star at the top level. */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'end', marginTop: 32 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
        <figure key={tier} style={{ margin: 0, display: 'grid', gap: 8, justifyItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
            <ItemIcon name="mining" size={96} seal={{ tier, top: tier === 8 }} />
            <ItemIcon name="mining" size={48} seal={{ tier, top: tier === 8 }} />
            <ItemIcon name="mining" size={24} seal={{ tier, top: tier === 8 }} />
          </div>
          <figcaption style={{ font: '13px var(--font-ui)' }}>
            Seal at tier {tier}
            {tier === 8 ? ', top level' : ''}
          </figcaption>
        </figure>
      ))}
    </div>
    {/* Each Kindling past 99 sets a flame on the rim's crown, up to five. */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'end', marginTop: 32 }}>
      {[1, 2, 3, 5].map((kindlings) => (
        <figure key={kindlings} style={{ margin: 0, display: 'grid', gap: 8, justifyItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
            {([96, 48, 24] as const).map((size) => (
              <ItemIcon key={size} name="woodcutting" size={size} seal={{ tier: 8, top: true, kindlings }} />
            ))}
          </div>
          <figcaption style={{ font: '13px var(--font-ui)' }}>Kindled {kindlings}</figcaption>
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
