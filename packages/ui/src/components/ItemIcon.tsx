// An icon at one of four sizes. Named icons draw from the registry; an unknown name draws a quiet
// placeholder so a missing icon is visible but never breaks a page. A silhouette (a find not yet
// found) keeps the shape and fills it with one quiet tone.
import { useId } from 'react';
import { hasIcon, ICONS } from '../icons/index.tsx';

export type IconSize = 24 | 32 | 48 | 96;

export function ItemIcon({
  name,
  size = 32,
  label,
  silhouette,
}: {
  name: string;
  size?: IconSize;
  label?: string;
  silhouette?: boolean;
}) {
  const Draw = hasIcon(name) ? ICONS[name].draw : null;
  const filter = `silhouette-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      data-ui="ItemIcon"
      data-icon={name}
      data-silhouette={silhouette || undefined}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: 'block', flex: 'none', color: silhouette ? 'var(--line-strong)' : undefined }}
    >
      {silhouette && (
        <filter id={filter}>
          <feFlood floodColor="currentColor" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      )}
      {Draw ? (
        <g filter={silhouette ? `url(#${filter})` : undefined}>
          <Draw />
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
