// Honours as styles: a banner's colour and a frame's metal, for whatever wears them (a hiscores row's
// pennant, the plaque on the Hearth, the honours panel). Unknown names fall back to woad and no frame.
import type { CSSProperties } from 'react';

const FRAME_TONE: Record<string, string> = { bronze: 'easy', silver: 'hard', gold: 'elite', dawn: 'master' };

export const bannerStyle = (banner: string | null): CSSProperties =>
  ({ '--banner': `var(--banner-${banner ?? 'woad'}, var(--banner-woad))` }) as CSSProperties;

export const frameStyle = (frame: string | null): CSSProperties =>
  frame && Object.hasOwn(FRAME_TONE, frame) ? ({ '--frame': `var(--deed-${FRAME_TONE[frame]})` } as CSSProperties) : {};

export const honourStyle = (banner: string | null, frame: string | null): CSSProperties => ({
  ...bannerStyle(banner),
  ...frameStyle(frame),
});
