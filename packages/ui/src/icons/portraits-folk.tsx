// Display pictures (session 43; ART.md, Pictures): the folk of the march, each a head and shoulders seen
// from the front, told apart by what they wear on their heads and carry: the forester's hood and axe, the
// delver's lamp-lit helmet, the smith's beard and apron, the angler's brim, the ranger's feathered hood,
// the mage's starred hat and the knight's plumed helm. Drawn to sit inside a picture's round (portraits.tsx).
import type { ReactNode } from 'react';
import { circle, ellipse, Glint, INK, M, Shape, type Tone } from './style.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
const SKIN = tone('#f2c9a8', '#d9a07c', '#a8714f');
const HAIR = tone('#8a5a3a', '#5e3b24', '#3b2414');

/** Shoulders in a tunic, the neck and the face: eyes, a mouth, cheeks lit on the left. */
function Bust({ tunic, children, beard }: { tunic: Tone; children?: ReactNode; beard?: boolean }) {
  return (
    <g>
      <Shape
        d="M6 48 C6 38 13 33 24 33 C35 33 42 38 42 48 Z"
        tone={tunic}
        lit="M6 48 C6 38 13 33 24 33 C18 35 13 40 12 48 Z"
        shade="M42 48 C42 38 35 33 24 33 C31 35 35 40 36 48 Z"
      />
      <Shape d="M20 28 H28 V35 C26 37 22 37 20 35 Z" tone={SKIN} shade="M25 28 H28 V35 C27 36 26 36.4 25 36.6 Z" />
      <Shape
        d={ellipse(24, 22, 9, 10.5)}
        tone={SKIN}
        lit={ellipse(21, 19, 4.6, 6)}
        shade="M33 22 A9 10.5 0 0 1 24 32.5 C29 30 31 26 31 20 Z"
      />
      <circle cx={20.6} cy={22} r={1.3} fill={INK} />
      <circle cx={27.4} cy={22} r={1.3} fill={INK} />
      {beard ? (
        <Shape
          d="M15.6 24 C16 31 19 35 24 35.6 C29 35 32 31 32.4 24 C30 27 27 27.6 24 27.6 C21 27.6 18 27 15.6 24 Z"
          tone={HAIR}
          lit="M15.6 24 C16 31 19 35 24 35.6 C21 33 19 29.6 18.6 26 Z"
        />
      ) : (
        <path
          d="M21.6 27.4 C23 28.6 25 28.6 26.4 27.4"
          fill="none"
          stroke={SKIN.shadow}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      )}
      {children}
    </g>
  );
}

export function Forester() {
  return (
    <g>
      {/* The axe over the shoulder, behind the hood. */}
      <path d="M36 46 L42 14" stroke={M.oak.shadow} strokeWidth={3} strokeLinecap="round" />
      <Shape d="M40 12 L47 9 L46 19 L40.6 17 Z" tone={M.iron} lit="M40 12 L47 9 L46.6 11.6 L40.4 14 Z" />
      <Bust tunic={M.leather}>
        <Shape
          d="M12 26 C11 14 16 7 24 7 C32 7 37 14 36 26 L33 26 C33 18 30 13 24 13 C18 13 15 18 15 26 Z"
          tone={M.cloth}
          lit="M12 26 C11 14 16 7 24 7 C19 9 15 14 15 20 L15 26 Z"
        />
      </Bust>
    </g>
  );
}

export function Delver() {
  return (
    <Bust tunic={M.straw}>
      <Shape
        d="M13 21 C13 12 18 8 24 8 C30 8 35 12 35 21 Z M11 21 H37 V24 H11 Z"
        tone={M.copper}
        lit="M13 21 C13 12 18 8 24 8 C20 10 17 14 17 21 Z"
      />
      <Shape d="M20.6 9.6 H27.4 V15 H20.6 Z" tone={M.iron} />
      <Shape d={circle(24, 12.2, 2.4)} tone={M.amber}>
        <Glint x={23.2} y={11.4} r={0.9} />
      </Shape>
      <circle cx={24} cy={12.2} r={5.4} fill={M.amber.light} opacity={0.35} />
    </Bust>
  );
}

export function Smith() {
  return (
    <Bust tunic={M.leather} beard>
      <path
        d="M15.4 17 C16 12 19 10.6 24 10.6 C29 10.6 32 12 32.6 17"
        fill="none"
        stroke={HAIR.base}
        strokeWidth={2.4}
      />
      <Shape d="M16 38 H32 V48 H16 Z" tone={M.bark} lit="M16 38 H19 V48 H16 Z" />
      <Shape d={circle(30, 42, 2)} tone={M.iron} />
    </Bust>
  );
}

export function Angler() {
  return (
    <Bust tunic={M.sapphire}>
      <path d="M15 17 C16 13 19 12 24 12 C29 12 32 13 33 17" fill="none" stroke={HAIR.base} strokeWidth={2.4} />
      <Shape
        d="M5 18 C10 16 14 15 16 10 C18 6 30 6 32 10 C34 15 38 16 43 18 C36 20.6 12 20.6 5 18 Z"
        tone={M.straw}
        lit="M5 18 C10 16 14 15 16 10 C18 6 23 6 24 6.4 C20 8 19 12 18 15 C14 17 9 17.6 5 18 Z"
      >
        <path d="M16.4 13.6 C20 15 28 15 31.6 13.6" stroke={M.banner.base} strokeWidth={2} fill="none" />
      </Shape>
    </Bust>
  );
}

export function Ranger() {
  return (
    <g>
      <path d="M8 46 C8 30 14 20 22 14" fill="none" stroke={M.yew.base} strokeWidth={2.6} strokeLinecap="round" />
      <Bust tunic={M.oakWood}>
        <Shape
          d="M12 28 C10 16 15 6 24 5 C33 6 38 16 36 28 L33 28 C33 19 30 13 24 13 C18 13 15 19 15 28 Z"
          tone={M.leaf}
          lit="M12 28 C10 16 15 6 24 5 C19 8 15 14 15 21 L15 28 Z"
        />
        <Shape
          d="M33 9 C38 4 43 4 45 6 C42 8 38 11 34.4 12.6 Z"
          tone={M.feather}
          lit="M33 9 C38 4 43 4 45 6 C41 6 37 7.4 33.6 10 Z"
        />
      </Bust>
    </g>
  );
}

export function Mage() {
  return (
    <Bust tunic={M.amethyst} beard>
      <Shape
        d="M11 19 C16 17 32 17 37 19 C35 21.6 13 21.6 11 19 Z M15 18 L26 1 L33 18 Z"
        tone={M.starIron}
        lit="M15 18 L26 1 L22 18 Z"
      />
      <Shape
        d="M24.6 9 L25.6 11.6 L28.4 11.8 L26.2 13.6 L27 16.2 L24.6 14.8 L22.2 16.2 L23 13.6 L20.8 11.8 L23.6 11.6 Z"
        tone={M.amber}
      />
    </Bust>
  );
}

export function Knight() {
  return (
    <g>
      <Shape
        d="M6 48 C6 38 13 33 24 33 C35 33 42 38 42 48 Z"
        tone={M.steel}
        lit="M6 48 C6 38 13 33 24 33 C18 35 13 40 12 48 Z"
        shade="M42 48 C42 38 35 33 24 33 C31 35 35 40 36 48 Z"
      >
        <path d="M24 34 V48" stroke={M.steel.shadow} strokeWidth={1.2} />
      </Shape>
      <Shape
        d="M13 32 V18 C13 10 18 6 24 6 C30 6 35 10 35 18 V32 C31 35 17 35 13 32 Z"
        tone={M.steel}
        lit="M13 32 V18 C13 10 18 6 24 6 C20 8 17.6 12 17.6 18 V33.4 C15.6 33 14 32.6 13 32 Z"
        shade="M35 18 V32 C34 32.6 32.4 33 30.4 33.4 V18 C30.4 13 29 9 26.6 6.6 C31.6 7.6 35 12 35 18 Z"
      >
        <path d="M24 7 V33" stroke={M.steel.shadow} strokeWidth={1.2} />
        <Glint x={17} y={13} r={1.2} />
      </Shape>
      <rect x={15.6} y={19.6} width={16.8} height={3} rx={1.4} fill={INK} />
      {[17, 20, 23, 26, 29].map((x) => (
        <circle key={x} cx={x + 1} cy={27.6} r={0.9} fill={INK} />
      ))}
      <Shape
        d="M24 6 C25 2 30 0 34 2 C31 3 28 4.4 26 7 Z"
        tone={M.banner}
        lit="M24 6 C25 2 30 0 34 2 C30 2 27 3.6 25 6.4 Z"
      />
    </g>
  );
}
