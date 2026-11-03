// Display pictures (session 43): the beasts of the march, each a head seen from the front (the raven in
// profile, as a bird is known): the stag's antlers, the wolf's ears and muzzle, the owl's ringed eyes, the
// boar's tusks, the raven's beak. Drawn to sit inside a picture's round (portraits.tsx).
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';

const eye = (x: number, y: number, r = 1.6) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={INK} />
    <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#ffffff" />
  </g>
);

export function Stag() {
  const antler = (s: 1 | -1) =>
    `M${24 + s * 5} 14 C${24 + s * 8} 8 ${24 + s * 9} 5 ${24 + s * 8} 1 M${24 + s * 7} 8 C${24 + s * 11} 6 ${24 + s * 14} 4 ${24 + s * 15} 1 M${24 + s * 8.6} 4.4 C${24 + s * 10} 3 ${24 + s * 11} 2 ${24 + s * 11} 0`;
  return (
    <g>
      <path
        d={`${antler(-1)} ${antler(1)}`}
        fill="none"
        stroke={M.bone.shadow}
        strokeWidth={4.6}
        strokeLinecap="round"
      />
      <path d={`${antler(-1)} ${antler(1)}`} fill="none" stroke={M.bone.base} strokeWidth={2.4} strokeLinecap="round" />
      <Shape d="M10 18 L17 15 L16 22 Z M38 18 L31 15 L32 22 Z" tone={M.eagle} />
      <Shape
        d="M24 13 C31 13 34 18 33 26 C32 33 29 40 24 44 C19 40 16 33 15 26 C14 18 17 13 24 13 Z"
        tone={M.eagle}
        lit="M24 13 C17 13 14 18 15 26 C16 33 19 40 24 44 C21.6 38 20 31 20 24 C20 18 21.4 14.6 24 13 Z"
      />
      <Shape d={ellipse(24, 40, 4.4, 3.6)} tone={M.bark} />
      {eye(19.6, 24)}
      {eye(28.4, 24)}
    </g>
  );
}

export function Wolf() {
  return (
    <g>
      <Shape d="M11 21 L12 5 L21 14 Z M37 21 L36 5 L27 14 Z" tone={M.fur} lit="M11 21 L12 5 L14 9 L15 18 Z" />
      <Shape
        d="M24 11 C33 11 39 17 38 26 C37 31 32 34 28 36 L24 44 L20 36 C16 34 11 31 10 26 C9 17 15 11 24 11 Z"
        tone={M.fur}
        lit="M24 11 C15 11 9 17 10 26 C11 31 16 34 20 36 L22 40 C19 32 18 24 19 17 C20 14 22 12 24 11 Z"
      />
      <Shape d="M18 30 C20 28 28 28 30 30 L26 40 H22 Z" tone={M.wight} />
      <Shape d={ellipse(24, 40, 2.8, 2)} tone={M.coal} />
      <path d="M17 23 L21.4 24.6 M31 23 L26.6 24.6" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={19.6} cy={24.6} r={1.4} fill={M.amber.base} stroke={INK} strokeWidth={0.8} />
      <circle cx={28.4} cy={24.6} r={1.4} fill={M.amber.base} stroke={INK} strokeWidth={0.8} />
    </g>
  );
}

export function Owl() {
  return (
    <g>
      <Shape
        d="M24 8 C34 8 40 15 40 26 C40 36 33 44 24 44 C15 44 8 36 8 26 C8 15 14 8 24 8 Z M10 10 L17 11 L13 16 Z M38 10 L31 11 L35 16 Z"
        tone={M.eagle}
        lit="M24 8 C14 8 8 15 8 26 C8 36 15 44 24 44 C17 40 13 34 13 26 C13 17 17 11 24 8 Z"
      >
        <path
          d="M18 38 L20 36 L22 38 M26 38 L28 36 L30 38 M21 42 L23 40 L25 42"
          fill="none"
          stroke={M.eagle.shadow}
          strokeWidth={1.2}
        />
      </Shape>
      {[17.6, 30.4].map((x) => (
        <g key={x}>
          <Shape d={circle(x, 23, 6.4)} tone={M.bone} lit={circle(x - 1.6, 21.4, 3.4)} />
          <Shape d={circle(x, 23, 3.4)} tone={M.amber} />
          <circle cx={x} cy={23} r={1.8} fill={INK} />
          <Glint x={x - 1} y={22} r={0.7} />
        </g>
      ))}
      <Shape d="M24 26 L26.4 29 L24 33 L21.6 29 Z" tone={M.amber} />
    </g>
  );
}

export function Boar() {
  return (
    <g>
      <Shape d="M10 14 L17 17 L13 23 Z M38 14 L31 17 L35 23 Z" tone={M.bark} />
      <Shape
        d="M24 12 C33 12 38 18 38 26 C38 34 33 40 24 40 C15 40 10 34 10 26 C10 18 15 12 24 12 Z"
        tone={M.bark}
        lit="M24 12 C15 12 10 18 10 26 C10 34 15 40 24 40 C19 36 16 31 16 25 C16 19 19 14 24 12 Z"
      >
        <path d="M24 12 V20 M21 13 L22 19 M27 13 L26 19" stroke={M.bark.shadow} strokeWidth={1.2} />
      </Shape>
      <Shape d={ellipse(24, 33, 7.4, 6)} tone={M.skin} lit={ellipse(22, 31.4, 3.6, 2.6)} />
      <ellipse cx={21.4} cy={33} rx={1.3} ry={1.8} fill={INK} />
      <ellipse cx={26.6} cy={33} rx={1.3} ry={1.8} fill={INK} />
      <Shape
        d="M16 34 C14 31 13 28 14 25 C15.6 28 16.6 30 18 32 Z M32 34 C34 31 35 28 34 25 C32.4 28 31.4 30 30 32 Z"
        tone={M.bone}
      />
      {eye(18.4, 23, 1.4)}
      {eye(29.6, 23, 1.4)}
    </g>
  );
}

export function Raven() {
  return (
    <g>
      <Shape
        d="M34 44 C36 34 36 24 32 16 C29 10 23 8 18 10 C13 12 11 17 12 22 C13 28 18 33 22 38 C24 41 26 44 26 46 Z"
        tone={M.obsidian}
        lit="M18 10 C13 12 11 17 12 22 C13 28 18 33 22 38 C20 32 17 26 17 20 C17 15 18 12 22 10 C20.6 9.4 19.4 9.4 18 10 Z"
      >
        <path
          d="M24 26 C27 30 29 36 30 42 M28 22 C31 28 32 34 32 40"
          fill="none"
          stroke={M.amethyst.shadow}
          strokeWidth={1.2}
        />
      </Shape>
      <Shape d="M13 15 L2 19 L13 21 Z" tone={M.coal} lit="M13 15 L2 19 L13 18 Z" />
      <circle cx={17} cy={15.4} r={1.8} fill={M.amber.light} stroke={INK} strokeWidth={0.8} />
      <circle cx={17.2} cy={15.4} r={0.8} fill={INK} />
    </g>
  );
}
