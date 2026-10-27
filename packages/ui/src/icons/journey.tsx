// What an expedition is drawn with (session 16), as the other icons are (ART.md): each region as a
// small landscape on a round shield of sky (the march's green hills, the Fen's reeds over still water,
// the Peaks' ash and ember), the camp, the fork's signpost, and the marks runs pay.
import type { ReactNode } from 'react';
import { circle, Glint, INK, M, Shape, type Tone } from './style.tsx';

const SKY: Record<string, Tone> = {
  march: { light: '#eaf6ff', base: '#bcdcf2', shadow: '#86b4d6' },
  fen: { light: '#e3f1e9', base: '#a9c8b8', shadow: '#6e9583' },
  peaks: { light: '#f6d8c4', base: '#d39a7c', shadow: '#91573f' },
};

/** A round shield of sky with the land drawn into it. */
function Vista({ sky, children }: { sky: Tone; children: ReactNode }) {
  const d = circle(24, 24, 20);
  return (
    <g>
      <Shape d={d} tone={sky} lit="M4 24 C4 13 13 4 24 4 C17 8 12 14 10 22 Z" outline={false}>
        {children}
      </Shape>
      <path d={d} fill="none" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function MarchVista() {
  return (
    <Vista sky={SKY.march}>
      <path d="M2 34 C10 26 18 26 26 31 C33 25 40 24 46 28 L46 46 L2 46 Z" fill={M.leaf.base} />
      <path d="M2 34 C10 26 18 26 26 31 L26 46 L2 46 Z" fill={M.leaf.light} opacity={0.7} />
      <path d="M2 40 C14 36 30 37 46 40 L46 46 L2 46 Z" fill={M.leaf.shadow} />
      {/* A pine on the far hill. */}
      <path d="M33 14 L38 26 L28 26 Z" fill={M.cloth.shadow} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <path d="M33 26 L33 29" stroke={M.bark.base} strokeWidth={1.6} />
    </Vista>
  );
}

export function FenVista() {
  return (
    <Vista sky={SKY.fen}>
      <path d="M2 32 L46 32 L46 46 L2 46 Z" fill={M.drowned.base} />
      <path d="M8 36 L22 36 M26 40 L40 40" stroke={M.drowned.light} strokeWidth={1.2} strokeLinecap="round" />
      {[10, 14, 31, 35, 38].map((x, i) => (
        <path
          key={x}
          d={`M${x} 33 C${x - 1} ${26 - i} ${x + 1} ${20 + i} ${x} ${16 + i * 2}`}
          fill="none"
          stroke={M.reed.shadow}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      ))}
      <path d="M14 18 L14 23" stroke={M.mud.shadow} strokeWidth={2.4} strokeLinecap="round" />
    </Vista>
  );
}

export function PeaksVista() {
  return (
    <Vista sky={SKY.peaks}>
      <path d="M2 40 L17 14 L25 26 L31 17 L46 40 L46 46 L2 46 Z" fill={M.cinder.base} />
      <path d="M2 40 L17 14 L19 28 L12 40 Z" fill={M.cinder.light} />
      <path d="M31 17 L46 40 L38 40 L34 26 Z" fill={M.cinder.shadow} />
      <path d="M17 14 L21 21 L14 24 Z" fill={M.bone.light} />
      <path d="M22 40 L26 32 L29 40" fill="none" stroke={M.flame.base} strokeWidth={1.8} strokeLinejoin="round" />
    </Vista>
  );
}

export function Camp() {
  return (
    <g>
      {/* A tent, and a small fire before it. */}
      <Shape d="M4 40 L19 8 L34 40 Z" tone={M.straw} lit="M4 40 L19 8 L16 40 Z" shade="M34 40 L19 8 L24 40 Z">
        <path d="M19 22 L15 40 L23 40 Z" fill={INK} opacity={0.75} />
      </Shape>
      <path d="M32 42 L44 38 M33 38 L44 42" stroke={M.oakWood.shadow} strokeWidth={2.6} strokeLinecap="round" />
      <Shape
        d="M38 37 C34 33 36 27 39 23 C40 27 44 29 43 34 C42.5 36 41 37.5 38 37 Z"
        tone={M.flame}
        lit="M38 37 C34 33 36 27 39 23 C38.5 28 39 32 40 36.5 Z"
      />
    </g>
  );
}

export function Signpost() {
  return (
    <g>
      <Shape d="M22 8 L26 8 L26 45 L22 45 Z" tone={M.oakWood} lit="M22 8 L23.5 8 L23.5 45 L22 45 Z" />
      {/* Two arms, one each way: the fork. */}
      <Shape d="M24 10 L40 10 L45 15 L40 20 L24 20 Z" tone={M.oakWood} lit="M24 10 L40 10 L41.5 11.5 L24 11.5 Z">
        <path d="M28 15 L38 15" stroke={M.oakWood.shadow} strokeWidth={1.2} />
      </Shape>
      <Shape d="M24 24 L8 24 L3 29 L8 34 L24 34 Z" tone={M.oakWood} lit="M24 24 L8 24 L6.5 25.5 L24 25.5 Z">
        <path d="M10 29 L20 29" stroke={M.oakWood.shadow} strokeWidth={1.2} />
      </Shape>
      <path d="M12 45 L36 45" stroke={M.leaf.shadow} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

export function ExpeditionMark() {
  const metal = M.bronze;
  return (
    <g>
      <Shape
        d={circle(24, 24, 19)}
        tone={metal}
        lit={circle(19, 19, 12)}
        shade="M43 24 C43 34.5 34.5 43 24 43 C31 39 36 32 36 24 C36 17 33 11 28 7.5 C36.5 9.5 43 16 43 24 Z"
      >
        <path d={circle(24, 24, 14)} fill="none" stroke={metal.shadow} strokeWidth={1.2} />
        {/* A compass's four points, stamped. */}
        <path d="M24 12 L27 24 L24 36 L21 24 Z" fill={metal.shadow} />
        <path d="M12 24 L24 21 L36 24 L24 27 Z" fill={metal.shadow} opacity={0.7} />
      </Shape>
      <Glint x={17} y={16} r={1.3} />
    </g>
  );
}
