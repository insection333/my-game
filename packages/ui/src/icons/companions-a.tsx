// Companions of the gathering and artisan skills (session 179; the family's rules in companions-kit.tsx).
import { circle, ellipse, INK, M, Shape } from './style.tsx';
import { C, Eye, litAt, shadeAt, Tuft } from './companions-kit.tsx';

export function CompanionSquirrel() {
  return (
    <Tuft>
      {/* The tail: a great plume curled up behind, its tip over the back. */}
      <Shape
        d="M27 38 C37 39 44 33 43 23 C42 14 35 8 28 11 C24 13 25 18 29 18 C33 18 36 22 34 27 C32 31 28 32 27 38 Z"
        tone={C.squirrel}
        lit="M28 11 C24 13 25 18 29 18 C31 13 35 12 39 14 C36 10 31 9 28 11 Z"
        shade="M43 23 C44 33 37 39 27 38 C33 35 38 30 39 22 Z"
      />
      <Shape
        d="M13 40 C11 33 13 26 19 24 C25 22 30 27 30 33 C30 37 28 40 25 41 Z"
        tone={C.squirrel}
        lit={litAt(19, 31, 9)}
        shade={shadeAt(22, 34, 9)}
      >
        <path d="M16 31 C17 35 20 38 24 39" fill="none" stroke={M.crumb.base} strokeWidth={3} strokeLinecap="round" />
      </Shape>
      {/* The head, ears tufted, and an acorn held at the chest. */}
      <Shape
        d="M8 21 C8 15 12 12 17 12 C22 12 25 16 24 21 C23 25 19 27 15 27 C11 27 8 25 8 21 Z"
        tone={C.squirrel}
        lit={litAt(15, 19, 8)}
        shade={shadeAt(17, 21, 8)}
      />
      <Shape d="M13 13 L13.5 6 L17.5 12 Z M18 12.5 L20.5 6.5 L22 13.5 Z" tone={C.squirrel} />
      <Shape d={ellipse(14.5, 32, 3, 3.6)} tone={M.oak} lit={ellipse(13.5, 31, 1.8, 2)} />
      <Shape d="M11.4 30 C12 27.6 17 27.6 17.6 30 Z" tone={M.bark} />
      <Eye x={13.6} y={18.8} />
      <circle cx={8.6} cy={21.6} r={1} fill={INK} />
    </Tuft>
  );
}

export function CompanionMole() {
  return (
    <Tuft ground={M.mud}>
      <Shape
        d="M10 36 C8 26 15 18 25 18 C35 18 41 25 40 33 C39.5 38 36 41 31 41 L16 41 C12 41 10.4 39 10 36 Z"
        tone={C.velvet}
        lit={litAt(24, 28, 13)}
        shade={shadeAt(27, 31, 13)}
      />
      {/* The pink snout, out to the left, and the great spade paws in front. */}
      <Shape
        d="M11 28 C7 28 3 30 3.5 32.5 C4 34.5 8 34.5 11.5 33 Z"
        tone={M.skin}
        lit="M11 28 C7 28 4 29.5 4 31 L11 30.6 Z"
      />
      <Shape
        d="M9 41 C7 38 9 35 13 35.5 C16 36 17 39 16 41 Z M19 41 C18 38 20 36 23.5 36.5 C26.5 37 27 39.5 26 41 Z"
        tone={M.skin}
        lit="M9 41 C7 38 9 35 13 35.5 C11 37 10.5 39 10.5 41 Z M19 41 C18 38 20 36 23.5 36.5 C21.5 37.5 21 39.5 21 41 Z"
      >
        <path d="M10.5 41 V38.6 M13 41 V38.4 M20.5 41 V38.8 M23 41 V38.6" stroke={M.skin.shadow} strokeWidth={0.9} />
      </Shape>
      <Eye x={14} y={26.6} r={1.2} />
    </Tuft>
  );
}

export function CompanionOtter() {
  return (
    <Tuft>
      {/* The tail laid along the ground behind, then the long body sitting up. */}
      <Shape d="M28 40 C34 41 41 40 45 37 C44 40 39 43 30 43 Z" tone={C.otter} />
      <Shape
        d="M15 41 C12 34 12 25 15 19 C18 14 25 14 28 19 C31 25 32 34 30 41 Z"
        tone={C.otter}
        lit={litAt(20, 26, 9)}
        shade={shadeAt(25, 30, 9)}
      >
        <path
          d="M17 24 C16 30 17 36 20 41"
          fill="none"
          stroke={M.heartwood.light}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M8 15 C8 9 13 5 19 5 C25 5 29 9 28.5 14 C28 19 23 22 18 22 C12 22 8 19.5 8 15 Z"
        tone={C.otter}
        lit={litAt(17, 13, 9)}
        shade={shadeAt(20, 15, 9)}
      >
        <path d="M6 17 C9 20 14 21 18 20" fill="none" stroke={M.heartwood.light} strokeWidth={3.2} />
      </Shape>
      <Shape d={circle(25.5, 7, 2.4)} tone={C.otter} />
      <circle cx={8.6} cy={14.2} r={1.5} fill={INK} />
      <path d="M8 16.4 L3 15.6 M8.4 17.6 L3.4 18.4" stroke={INK} strokeWidth={0.7} strokeLinecap="round" />
      <Eye x={13.4} y={11.8} r={1.6} />
      {/* Its paws held together at the chest. */}
      <Shape d={ellipse(15.5, 27, 2.6, 2)} tone={C.otter} />
    </Tuft>
  );
}

export function CompanionMoth() {
  return (
    <Tuft ground={M.stone}>
      {/* A ley moth resting on a stone: pale wings spread, each marked with a rune's blue eye. */}
      <Shape d={ellipse(24, 36.5, 8, 4)} tone={M.stone} lit={ellipse(22, 35, 5, 2)} />
      <Shape
        d="M23 26 C15 14 6 10 3.5 14 C1.5 18 5 25 12 28 C7 31 6 36 10 37.5 C14 39 20 35 23 30 Z"
        tone={M.moonstone}
        lit="M23 26 C15 14 6 10 3.5 14 C1.5 18 5 25 12 28 C9 23 9 18 12 16 C16 17 20 21 23 26 Z"
      >
        <circle cx={11} cy={20} r={2.6} fill={M.sapphire.base} />
        <circle cx={10.6} cy={19.6} r={1} fill={M.sapphire.light} />
        <circle cx={12} cy={33} r={1.6} fill={M.sapphire.base} />
      </Shape>
      <Shape
        d="M25 26 C33 14 42 10 44.5 14 C46.5 18 43 25 36 28 C41 31 42 36 38 37.5 C34 39 28 35 25 30 Z"
        tone={M.moonstone}
        shade="M44.5 14 C46.5 18 43 25 36 28 C41 31 42 36 38 37.5 C40 31 42 22 44.5 14 Z"
      >
        <circle cx={37} cy={20} r={2.6} fill={M.sapphire.base} />
        <circle cx={36} cy={33} r={1.6} fill={M.sapphire.base} />
      </Shape>
      <Shape d={ellipse(24, 28, 2.6, 7)} tone={M.fur} lit={ellipse(23.2, 26, 1.2, 4)} />
      <path
        d="M23 21.5 C21 17 18 15 16 15 M25 21.5 C27 17 30 15 32 15"
        fill="none"
        stroke={INK}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Eye x={22.8} y={22.4} r={1.1} />
    </Tuft>
  );
}

export function CompanionSalamander() {
  const spots = [
    [12, 27],
    [19, 30.6],
    [26, 30],
    [33, 31.6],
  ];
  return (
    <Tuft ground={M.stone}>
      <Shape d={ellipse(26, 37, 15, 4.6)} tone={M.stone} lit={ellipse(22, 35.4, 10, 2.4)} />
      {/* Its tail curled over the stone's end, the body low, the head raised to the left. */}
      <Shape
        d="M34 34 C40 34 45 31 44 26 C43.5 23 40 23 40 26 C40 29 37 30.5 33 30.5 Z"
        tone={C.newt}
        lit="M44 26 C43.5 23 40 23 40 26 C41 25 42.6 25 44 26 Z"
      />
      <Shape
        d="M6 26 C6 22 9.5 20 13 21 C17 22 21 27 28 28 C32 28.6 35 29.6 35 31.8 C35 34 31 35 27 34.6 L14 33.4 C9 33 6 30 6 26 Z"
        tone={C.newt}
        lit="M6 26 C6 22 9.5 20 13 21 C17 22 21 27 28 28 C22 29 16 27 12 25 C10 24.4 8 25 6 26 Z"
      >
        {spots.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={1.9} fill={M.amber.base} />
        ))}
      </Shape>
      <path d="M13 33.4 L11 36.6 M26 34.6 L27.4 37" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Eye x={9.6} y={24.4} r={1.5} iris={M.amber.light} />
    </Tuft>
  );
}

export function CompanionCat() {
  return (
    <Tuft>
      {/* The tail wrapped round in front, then the body sitting tall. */}
      <Shape
        d="M14 40 C14 25 18 19 25 19 C32 19 36 25 36 40 Z"
        tone={C.tabby}
        lit={litAt(24, 28, 11)}
        shade={shadeAt(28, 32, 11)}
      >
        <path
          d="M29 23 C32 25 33.5 28 34 31 M30.5 30 C33 32 34.5 35 35 38"
          fill="none"
          stroke={C.tabby.shadow}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M13 41 C17 38.6 28 38 36 39.6 C39 40.2 41 38 40 35.6 C42 36 43 39.4 40.6 41.4 C37 43.6 22 43.4 13 41 Z"
        tone={C.tabby}
        lit="M13 41 C17 38.6 28 38 36 39.6 C28 40 20 40.4 13 41 Z"
      />
      <Shape
        d="M9 16 C9 10 13 7 18.5 7 C24 7 28 10.4 28 16 C28 21 24 24 18.5 24 C13 24 9 21 9 16 Z"
        tone={C.tabby}
        lit={litAt(18, 14, 9)}
        shade={shadeAt(20, 17, 9)}
      >
        <path d="M17 7.6 L18 11 M21 7.8 L20.6 11" stroke={C.tabby.shadow} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
      <Shape
        d="M10 11 L9.6 2.6 L16 8.4 Z M21 8.2 L27.4 3 L27.6 11.4 Z"
        tone={C.tabby}
        lit="M10 11 L9.6 2.6 L12.4 9 Z"
      />
      <path d="M11 9.6 L10.8 5.6 L13.6 8.4 Z" fill={M.skin.base} />
      <Shape d="M10.6 18.2 L13 18.2 L11.8 19.8 Z" tone={M.skin} />
      <Eye x={14} y={15} r={1.6} iris={M.leaf.light} />
      <Eye x={21.4} y={15} r={1.6} iris={M.leaf.light} />
    </Tuft>
  );
}

export function CompanionGoose() {
  return (
    <Tuft>
      {/* The body low and full, wing folded; the long neck up to a head that looks left. */}
      <Shape
        d="M14 34 C14 27 21 23 30 23 C38 23 44 27 44 32 C44 37 39 40 31 40 L19 40 C16 40 14 37.6 14 34 Z"
        tone={C.goose}
        lit={litAt(26, 29, 12)}
        shade={shadeAt(31, 33, 12)}
      >
        <path d="M22 28 C28 26 36 27 41 31 C36 31.5 29 33 23 32 Z" fill={C.goose.shadow} />
      </Shape>
      <Shape
        d="M14 31 C12 25 12 18 14 13 L19.6 13.4 C18.4 18 18.4 24 20.4 29 Z"
        tone={C.goose}
        lit="M14 31 C12 25 12 18 14 13 L16 13.2 C15 18 15 25 16.6 30 Z"
      />
      <Shape
        d="M10 12 C10 8 12.6 6 16 6 C19.4 6 21.4 8.4 21 11.4 C20.6 14 18.4 15 16 15 C12.6 15 10 14.4 10 12 Z"
        tone={C.goose}
        lit={litAt(15, 10, 5)}
      />
      <Shape d="M10.4 10.4 L3.4 12 L10.6 13.8 Z" tone={M.amber} lit="M10.4 10.4 L3.4 12 L10.4 11.8 Z" />
      <path d="M20 40 V42.6 M26 40 V42.6" stroke={M.amber.base} strokeWidth={2.2} strokeLinecap="round" />
      <Eye x={14} y={9.8} r={1.3} />
    </Tuft>
  );
}
