// The second bosses' companions (session 210), drawn as the first fourteen are (companions-kit.tsx): each on
// a tuft of its boss's ground, facing left, read by its silhouette at 24 px: the raven's heavy beak on a
// barrow-stone, the newt's long tail and crest in the bog, the roc chick's pale fluff and its beak too big for it.
import { Shape, circle, INK, M } from './style.tsx';
import { Eye, litAt, shadeAt, Tuft } from './companions-kit.tsx';

const tone = (light: string, base: string, shadow: string) => ({ light, base, shadow });
/** A raven's black, its light raised to read on the dark theme; a newt's mire-green and its fire belly. */
const RAVEN = tone('#7d8296', '#2f3240', '#14161d');
const NEWT = tone('#b4cf8a', '#5f8040', '#344a22');
const FIRE = tone('#ffc07a', '#e8742c', '#9a4316');

export function CompanionBarrowRaven() {
  return (
    <Tuft ground={M.stone}>
      {/* A raven on a barrow-stone: a long tail, a folded wing, the heavy beak. */}
      <Shape d="M28 34 C34 34 41 37 45 41 L33 41 Z" tone={RAVEN} />
      <Shape
        d="M12 32 C11 25 16 20 23 20 C30 20 35 25 35 31 C35 37 30 41 23 41 C17 41 12.6 37.6 12 32 Z"
        tone={RAVEN}
        lit={litAt(21, 28, 10)}
        shade={shadeAt(25, 33, 10)}
      >
        <path
          d="M18 30 C22 27 29 27 34 31 M20 34 C24 31.6 29 32 33 35"
          fill="none"
          stroke={RAVEN.light}
          strokeWidth={0.9}
        />
      </Shape>
      <Shape d={circle(14.4, 17.4, 6)} tone={RAVEN} lit={litAt(14.4, 17.4, 6)} />
      <Shape
        d="M9.4 15.6 C6 15.4 3 16.6 1.6 19 C4.4 19.6 7.6 19.8 10.4 19.4 Z"
        tone={M.cinder}
        lit="M9.4 15.6 C6 15.4 3 16.6 1.6 19 C4.4 18 7 17.4 10 17.6 Z"
      />
      <Eye x={13.4} y={16} r={1.6} iris="#b8ffcf" />
      <path d="M17 40 L17 43 M21 40.4 L21 43" stroke={INK} strokeWidth={1.2} />
    </Tuft>
  );
}

export function CompanionMireNewt() {
  return (
    <Tuft ground={M.bog}>
      {/* A mire newt: a long body and a curling tail, a ragged crest along its back, a fire belly. */}
      <Shape
        d="M30 38 C36 39 42 37.6 44 33 C45 30 43 28.6 41.4 30.4 C39.6 33 35.4 34 31 34 Z"
        tone={NEWT}
        lit="M30 38 C36 39 42 37.6 44 33 C41 35.4 36 36 31 35.6 Z"
      />
      <Shape
        d="M8 36 C8 31 12 28 19 28 L31 29 C34 30 35 33 34 36 C33 39 30 40 26 40 L14 40 C10.6 40 8 38.6 8 36 Z"
        tone={NEWT}
        lit="M8 36 C8 31 12 28 19 28 L28 28.6 C22 29.4 15 31 11 35 C10 36.6 9.4 38 9 39 C8.4 38.2 8 37.2 8 36 Z"
        shade={shadeAt(25, 37, 7)}
      >
        <path
          d="M10 38.6 C15 40 22 40.2 30 39"
          fill="none"
          stroke={FIRE.base}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Shape>
      {/* The crest, a row of soft points. */}
      <path
        d="M14 28.6 L16 25.4 L18 28 L20.4 25 L22.4 28.2 L25 25.4 L26.6 28.6"
        fill={NEWT.shadow}
        stroke={INK}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <Shape
        d="M3 33 C3 29.4 6 27.4 10 27.4 C13.4 27.4 15.6 29.6 15.6 32.6 C15.6 35.6 13 37 9.4 37 C5.6 37 3 35.6 3 33 Z"
        tone={NEWT}
        lit={litAt(9, 31.6, 5.6)}
      />
      <path d="M3.4 34.4 C6 35.4 9 35.4 11.4 34.6" fill="none" stroke={INK} strokeWidth={0.9} />
      <Eye x={8.6} y={30.6} r={1.6} iris={FIRE.base} />
      <path d="M13 39.6 L11.6 42.4 M24 39.6 L25.4 42.4" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
    </Tuft>
  );
}

export function CompanionRocChick() {
  return (
    <Tuft ground={M.cinder}>
      {/* A roc's chick: a ball of pale down, a wing-stub, and a golden beak far too big for it. */}
      <Shape
        d="M12 32 C12 23 18 17 26 17 C34 17 39 23 39 31 C39 37.6 34 41.4 26 41.4 C18 41.4 12 38 12 32 Z"
        tone={M.feather}
        lit={litAt(24, 27, 12)}
        shade={shadeAt(28, 33, 12)}
      >
        {/* Down standing up in tufts. */}
        <path
          d="M22 17.6 L21 13.6 L24.4 16.8 L25.6 12.6 L27.6 17"
          fill={M.feather.base}
          stroke={INK}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
        <path
          d="M30 28 C34 29 36 32.4 35.6 36"
          fill="none"
          stroke={M.feather.shadow}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M15 24 C10 23 5 24.6 3 28.6 C2.4 31 3.6 33 5.6 33.4 C6.6 31 9 30 12 30.2 L16 30.6 Z"
        tone={M.bronze}
        lit="M15 24 C10 23 5 24.6 3 28.6 C6 26.4 10 25.6 14.6 26.4 Z"
      />
      <Eye x={19.6} y={24} r={2} iris="#ffe27a" />
      <path d="M21 41 L20 43.6 M29 41 L30 43.6" stroke={M.bronze.shadow} strokeWidth={1.6} strokeLinecap="round" />
    </Tuft>
  );
}
