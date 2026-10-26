// The loadout's figure: a quiet outline of a person, front on, that the gear slots sit on (the helm on
// the head, the weapon in the right hand). Drawn in the surface's own tones so it stays behind the gear;
// lit from the upper left as all the art is (ART.md). 164 by 236, the box the Combat page lays it in.
// Built from simple parts drawn twice: once wide in the line colour, then in the fill over it, so the
// parts merge into one silhouette with a single outline.
import type { ReactNode } from 'react';

export const FIGURE = { width: 164, height: 236 } as const;

const LIMBS: [number, number, number, number, number][] = [
  // x1, y1, x2, y2, thickness: the arms angled a little out, the legs a little apart.
  [58, 72, 40, 152, 15],
  [118, 72, 136, 152, 15],
  [76, 142, 72, 222, 21],
  [100, 142, 104, 222, 21],
];
const TORSO = 'M54 72 C55 62 62 58 72 57 L104 57 C114 58 121 62 122 72 L116 136 C108 146 68 146 60 136 Z';

function parts(stroke: string, fill: string, wide: number): ReactNode {
  const shape = { fill, stroke, strokeWidth: wide };
  return (
    <>
      {LIMBS.map(([x1, y1, x2, y2, w]) => (
        <line key={`${x1}${y1}`} {...{ x1, y1, x2, y2 }} stroke={stroke} strokeWidth={w + wide} strokeLinecap="round" />
      ))}
      <circle cx={39} cy={159} r={8} {...shape} />
      <circle cx={137} cy={159} r={8} {...shape} />
      <ellipse cx={70} cy={226} rx={13} ry={6} {...shape} />
      <ellipse cx={106} cy={226} rx={13} ry={6} {...shape} />
      <rect x={81} y={42} width={14} height={20} {...shape} />
      <path d={TORSO} {...shape} />
      <circle cx={88} cy={28} r={19} {...shape} />
    </>
  );
}

export function Figure({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${FIGURE.width} ${FIGURE.height}`}
      width={FIGURE.width}
      height={FIGURE.height}
      aria-hidden
      focusable="false"
    >
      <g strokeLinejoin="round">{parts('var(--line-strong)', 'var(--line-strong)', 3)}</g>
      <g strokeLinejoin="round">{parts('var(--figure)', 'var(--figure)', 0)}</g>
      {/* The light on the upper left: the crown, the left shoulder and arm, the left leg. */}
      <g fill="none" stroke="var(--figure-lit)" strokeWidth={3} strokeLinecap="round">
        <path d="M76 18 C79 13 84 11 90 11" />
        <path d="M60 66 C62 62 66 60 72 60" />
        <path d="M54 80 L43 140" />
        <path d="M70 152 L68 212" />
      </g>
      {/* The shade on the right: under the arm and down the right leg. */}
      <g fill="none" stroke="var(--figure-shade)" strokeWidth={3} strokeLinecap="round">
        <path d="M118 82 L114 132" />
        <path d="M108 152 L110 214" />
      </g>
    </svg>
  );
}
