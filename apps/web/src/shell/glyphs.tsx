// Interface glyphs: single-weight line drawings in the text colour, for the menu and the header.
// (Item art lives in @idle-clash/ui's icons and follows ART.md; these are signs, not objects.)
const G = ({ d, size = 24 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export const MENU_GLYPHS: Record<string, string> = {
  hearth: 'M4 21V10l8-6 8 6v11M9 21v-4.5c0-1.2 1.3-2.7 3-4.5 1.7 1.8 3 3.3 3 4.5V21M3 21h18',
  skills: 'M5 20V14M10 20V10M15 20V6M20 20V3M3 20h19',
  combat: 'M5 4l9.5 9.5M14.5 13.5l2 2M16 19l-1.5-1.5 4-4L20 15M19 4L9.5 13.5M9.5 13.5l-2 2M8 19l1.5-1.5-4-4L4 15',
  storehouse: 'M3 10h18v10H3zM3 10l2-5h14l2 5M10 14h4',
  hiscores: 'M6 3h12v6a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M12 15v3M8 21h8M9 18h6',
};

export const MenuGlyph = ({ name }: { name: string }) => <G d={MENU_GLYPHS[name]} />;
export const Bell = () => <G d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />;
export const Person = () => (
  <G d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
);

/** The gold coin beside the gold count. */
export const Coin = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" aria-hidden="true">
    <circle cx={8} cy={8} r={6.5} fill="#e0b043" stroke="#7a5a12" strokeWidth={1.2} />
    <circle cx={8} cy={8} r={3.4} fill="none" stroke="#7a5a12" strokeWidth={1} />
  </svg>
);

/** The fire: the one place ember colour appears. `lit` from 0 (out) to 1 (fresh). */
export function Flame({ lit }: { lit: number }) {
  const out = lit <= 0;
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="flame-fill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--ember)" />
          <stop offset="1" stopColor="var(--ember-glow)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c1 3.2 4.8 5.3 4.8 10a4.8 4.8 0 0 1-9.6 0c0-2.4 1.3-3.6 2.2-5 .3 1.4.9 2.3 1.9 2.8C11 8 11.2 5.2 12 2.5z"
        fill={out ? 'none' : 'url(#flame-fill)'}
        stroke="var(--ember)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={out ? 0.85 : 0.55 + 0.45 * lit}
      />
      <path d="M5 21.5h14" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}
