// Honours as styles: a banner's colour and a frame's metal, for whatever wears them (a hiscores row's
// pennant, the plaque on the Hearth, the honours panel). Unknown names fall back to woad and no frame.
import { hasString, t } from '@idle-clash/content';
import type { CSSProperties } from 'react';

const FRAME_TONE: Record<string, string> = { bronze: 'easy', silver: 'hard', gold: 'elite', dawn: 'master' };
/** The two frames of prestige (session 43) in their own metals. */
const FRAME_COLOUR: Record<string, string> = { royal: '#8a4bb8', obsidian: '#2d2a38' };

export const bannerStyle = (banner: string | null): CSSProperties =>
  ({ '--banner': `var(--banner-${banner ?? 'woad'}, var(--banner-woad))` }) as CSSProperties;

export const frameStyle = (frame: string | null): CSSProperties =>
  frame && Object.hasOwn(FRAME_TONE, frame)
    ? ({ '--frame': `var(--deed-${FRAME_TONE[frame]})` } as CSSProperties)
    : frame && Object.hasOwn(FRAME_COLOUR, frame)
      ? ({ '--frame': FRAME_COLOUR[frame] } as CSSProperties)
      : {};

export const honourStyle = (banner: string | null, frame: string | null): CSSProperties => ({
  ...bannerStyle(banner),
  ...frameStyle(frame),
});

/** A badge's name, for the screen reader (the badge itself is drawn). */
export const badgeName = (id: string): string => (hasString(`honour.badge.${id}`) ? t(`honour.badge.${id}`) : id);
