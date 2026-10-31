// The game's own mark: the hearth fire on a dark round seal (the owner's choice, 22 October 2026).
// It is the site's icon in the browser tab and on a phone's home screen, so it is drawn to read at
// 16 px: a big flame, its bright core, two crossed logs, and the seal. Ember belongs to the fire
// alone (ART.md), and this is the fire.
import { circle, hole, INK, M, Shape, type Tone } from './style.tsx';

const SEAL: Tone = { light: '#3d4f57', base: '#26343a', shadow: '#151e22' };
const EMBER: Tone = { light: '#f8a258', base: '#d4511f', shadow: '#8c2c10' };
const CORE: Tone = { light: '#fff3c8', base: '#ffc95c', shadow: '#ec9a32' };

/** A log on the diagonal, from (x1, y1) to (x2, y2), its cut end at the first point. */
function Log({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={M.bark.base} strokeWidth={4.6} strokeLinecap="round" />
      <line x1={x1} y1={y1 - 1} x2={x2} y2={y2 - 1} stroke={M.bark.light} strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={x1} cy={y1} r={2.6} fill={M.heartwood.base} stroke={INK} strokeWidth={1.4} />
    </g>
  );
}

export function FireSeal() {
  return (
    <g>
      <Shape
        d={circle(24, 24, 22)}
        tone={SEAL}
        lit={circle(24, 24, 22) + hole(26, 26, 21.5, 21.5)}
        shade={circle(24, 24, 22) + hole(22, 22, 21.5, 21.5)}
      />
      <Log x1={11.5} y1={39} x2={35} y2={32.5} />
      <Log x1={36.5} y1={39} x2={13} y2={32.5} />
      <Shape
        d="M24 5.5C27.5 12 35 16.5 35 25.5C35 31.8 30.1 36 24 36C17.9 36 13 31.8 13 25.8C13 20.8 15.8 18 17.9 14.6C18.5 18 20.2 20.4 22.4 21.4C21.2 15.6 21.8 10.4 24 5.5Z"
        tone={EMBER}
        lit="M13 25.8C13 20.8 15.8 18 17.9 14.6C18.5 18 20.2 20.4 22.4 21.4C21.2 15.6 21.8 10.4 24 5.5C22.6 11 23 16 24.6 21.5C21 22 17 24 16.5 30C14.2 29 13 27.6 13 25.8Z"
        shade="M35 25.5C35 31.8 30.1 36 24 36C28.5 33.5 31.2 29.5 30.6 23.2C32.8 23.5 34.3 24.2 35 25.5Z"
      />
      <Shape
        d="M24 16.5C25.8 20.6 30 23.4 30 28.3C30 31.9 27.4 34.2 24 34.2C20.6 34.2 18 31.9 18 28.6C18 25.9 19.5 24.3 20.7 22.9C21.2 24.7 22.2 25.8 23.4 26.3C22.6 22.7 22.9 19.6 24 16.5Z"
        tone={CORE}
        lit="M18 28.6C18 25.9 19.5 24.3 20.7 22.9C21.2 24.7 22.2 25.8 23.4 26.3C22.8 23.5 22.9 20.5 24 16.5C23.6 20.5 24.4 24.5 25.6 27.2C23 27.6 21 29.4 20.6 32.8C18.9 32 18 30.5 18 28.6Z"
      />
    </g>
  );
}

/** The mark as a picture of its own, beside the game's name in the header and on the welcome page. */
export function GameMark({ size }: { size: number }) {
  return (
    <svg
      data-ui="GameMark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      style={{ display: 'block', flex: 'none' }}
    >
      <FireSeal />
    </svg>
  );
}
