// An icon at one of four sizes. Named icons draw from the registry; an unknown name draws a quiet
// placeholder so a missing icon is visible but never breaks a page. A silhouette (a find not yet
// found) keeps the shape and its inner lines, in grey and faded: a coin still reads as a coin, a rune
// stone as a rune stone, but nothing of its colour is given away.
import { useId } from 'react';
import { hasIcon, ICONS } from '../icons/index.tsx';
import { KindledFlames } from '../icons/kindling.tsx';
import { M, RIM_TONES, RimTone, Shape } from '../icons/style.tsx';

export type IconSize = 24 | 32 | 48 | 96;

export function ItemIcon({
  name,
  size = 32,
  label,
  silhouette,
  seal,
}: {
  name: string;
  size?: IconSize;
  label?: string;
  silhouette?: boolean;
  /** For a skill's seal: the highest tier its skill has reached (the rim's metal), and whether it is
   *  at the top level (a star on the rim), and its Kindlings (a flame on the rim for each, up to five). */
  seal?: { tier: number; top: boolean; kindlings?: number };
}) {
  const Draw = hasIcon(name) ? ICONS[name].draw : null;
  const filter = `silhouette-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      data-ui="ItemIcon"
      data-icon={name}
      data-silhouette={silhouette || undefined}
      data-rim={seal?.tier}
      data-kindled={seal?.kindlings || undefined}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: 'block', flex: 'none' }}
    >
      {silhouette && (
        <filter id={filter} colorInterpolationFilters="sRGB">
          {/* Grey, its tones drawn together (the ink stays darkest, the lights a soft grey), and faded. */}
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.45" intercept="0.36" />
            <feFuncG type="linear" slope="0.45" intercept="0.38" />
            <feFuncB type="linear" slope="0.45" intercept="0.4" />
            <feFuncA type="linear" slope="0.7" />
          </feComponentTransfer>
        </filter>
      )}
      {Draw ? (
        <g filter={silhouette ? `url(#${filter})` : undefined}>
          {seal ? (
            <RimTone.Provider value={RIM_TONES[Math.min(RIM_TONES.length, Math.max(1, seal.tier)) - 1]}>
              <Draw />
              {seal.top && <TopStar />}
              {!!seal.kindlings && <KindledFlames count={seal.kindlings} />}
            </RimTone.Provider>
          ) : (
            <Draw />
          )}
        </g>
      ) : (
        <rect
          x={8}
          y={8}
          width={32}
          height={32}
          rx={6}
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 3"
          opacity={0.5}
        />
      )}
    </svg>
  );
}

/** The star a seal wears on its rim once its skill is at the top level. */
function TopStar() {
  return (
    <Shape
      d="M24.0 33.4 L25.8 38.1 L30.8 38.4 L26.9 41.6 L28.2 46.4 L24.0 43.7 L19.8 46.4 L21.1 41.6 L17.2 38.4 L22.2 38.1 Z"
      tone={M.amber}
      lit="M24.0 33.4 L25.8 38.1 L24 40.6 L17.2 38.4 L22.2 38.1 Z"
    />
  );
}
