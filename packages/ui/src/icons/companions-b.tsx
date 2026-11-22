// Companions of the fighting skills and the bosses (session 179; the family's rules in companions-kit.tsx).
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';
import { C, Eye, litAt, shadeAt, Tuft } from './companions-kit.tsx';

export function CompanionHound() {
  return (
    <Tuft>
      <Shape
        d="M15 41 C13 32 16 24 23 22 C30 20 36 25 36 33 L37 41 Z"
        tone={C.pup}
        lit={litAt(24, 30, 10)}
        shade={shadeAt(28, 34, 10)}
      >
        <path d="M18 27 C17 33 18 38 20 41" fill="none" stroke={M.crumb.light} strokeWidth={4} strokeLinecap="round" />
      </Shape>
      {/* A tail up behind, the front legs straight, a head too big for it yet. */}
      <path d="M36 32 C40 30 42 26 41 22" fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
      <path d="M36 32 C40 30 42 26 41 22" fill="none" stroke={C.pup.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape
        d="M6 20 C5 14 9 9 16 9 C23 9 27 13 27 19 C27 24 23 27 17 27 C13 27 10 25.6 8.6 24 C6.6 23.4 6 22 6 20 Z"
        tone={C.pup}
        lit={litAt(16, 17, 9)}
        shade={shadeAt(18, 20, 9)}
      >
        <path d="M4 21.6 C7 24 11 24.6 14 23.6" fill="none" stroke={M.crumb.light} strokeWidth={3} />
      </Shape>
      {/* The dark ear, flopped. */}
      <Shape
        d="M18 10 C22 9 26 11 26 16 C26 21 23 24 21 23 C20 19 19 14 18 10 Z"
        tone={M.bark}
        lit="M18 10 C21 9.6 23 11 23 14 C21 13 19.6 12 18 10 Z"
      />
      <Shape d={ellipse(6.4, 19.6, 2.2, 1.8)} tone={M.coal} />
      <Eye x={13.2} y={16.6} r={1.7} />
    </Tuft>
  );
}

export function CompanionFalcon() {
  return (
    <Tuft ground={M.oakBark}>
      {/* Upright on a perch of bark: the slate back and folded wing, a barred cream breast, the hooked beak. */}
      <Shape
        d="M15 38 C12 30 13 21 18 16 C23 12 30 13 32 19 C34 26 33 33 30 40 Z"
        tone={C.slate}
        lit={litAt(22, 24, 10)}
        shade={shadeAt(26, 28, 10)}
      >
        <path d="M15.6 22 C14.6 28 15.4 34 18 39 L22 39 C20.6 33 20 27 20.6 22 Z" fill={M.bone.base} />
        <path d="M16 26 H19.6 M16 30 H20 M16.6 34 H20.4" stroke={C.slate.base} strokeWidth={1} strokeLinecap="round" />
      </Shape>
      <Shape d="M26 36 L33 44.4 L28.4 44.6 L23.6 39 Z" tone={C.slate} />
      <Shape
        d="M12 15 C12 10 15.6 7 20 7 C25 7 28 10.4 28 15 C28 18 26 20.4 23 21 L15 21 C13 20 12 18 12 15 Z"
        tone={C.slate}
        lit={litAt(19, 13, 8)}
      >
        <path
          d="M16.6 15 C16.4 18 17 20 18.4 21.4"
          fill="none"
          stroke={M.coal.shadow}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M12.8 12.2 L6.6 14 C5.2 15.6 5.4 18.2 7.4 18.8 C7.6 17.6 8.4 16.8 9.6 16.6 L13 16.8 Z"
        tone={M.amber}
        lit="M12.8 12.2 L6.6 14 C6 14.8 5.8 15.6 6 16.4 L12.8 14.6 Z"
      />
      <Eye x={16} y={13} r={1.9} iris={M.amber.light} />
    </Tuft>
  );
}

export function CompanionToad() {
  return (
    <Tuft ground={M.mud}>
      <Shape
        d="M7 38 C6 30 12 23 22 22 C32 21 41 26 42 34 C42.6 38.6 39 41 34 41 L12 41 C9 41 7.4 40 7 38 Z"
        tone={M.bog}
        lit={litAt(22, 30, 13)}
        shade={shadeAt(26, 33, 13)}
      >
        {[
          [26, 27],
          [32, 29],
          [36, 34],
          [29, 34],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={1.4} fill={M.bog.shadow} />
        ))}
        <path
          d="M8 33 C12 35 17 35.6 21 35"
          fill="none"
          stroke={M.reed.light}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Shape>
      {/* The bulging eye on the crown, gold-ringed, and a wide mouth. */}
      <Shape d={circle(15.6, 23.4, 4.6)} tone={M.bog} lit={litAt(15.6, 23.4, 4.6)} />
      <Eye x={15} y={23.6} r={2.6} iris={M.amber.base} />
      <path d="M7.6 31.4 C12 32.4 17 32 21 30.6" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <Shape d="M9 41 C9 38 12 37 14 38.6 C15 39.6 15 41 15 41 Z" tone={M.bog} />
    </Tuft>
  );
}

export function CompanionTortoise() {
  const plates = 'M18 25 L24 19 L31 20 L35 27 M24 19 L24.6 25 L31 26 L31 20 M18 25 L24.6 25 M31 26 L35 27';
  return (
    <Tuft>
      <Shape d="M14 41 L15.4 36 L19.4 36 L19 41 Z M33 41 L33.4 36 L37.4 36 L38 41 Z" tone={M.mud} />
      {/* The dome of the shell, its plates marked; the head out to the left on its neck. */}
      <Shape
        d="M11 36 C11 25 18 17 27 17 C36 17 42 24 42 36 Z"
        tone={C.shell}
        lit="M11 36 C11 25 18 17 27 17 C21 19.6 17 25 16.4 31 C16 33 15 35 15 36 Z"
        shade="M42 36 C42 24 36 17 27 17 C34 21 37 28 36.6 36 Z"
      >
        <path d={plates} fill="none" stroke={C.shell.shadow} strokeWidth={1.3} strokeLinejoin="round" />
      </Shape>
      <Shape d="M10 36.6 L43 36.6 L42 39 L11 39 Z" tone={M.bark} />
      <Shape
        d="M3 28 C3 24.4 6 22 9.6 22.4 C13 22.8 14.4 26 13.6 29.6 L13 34 L8 34 L8.4 31.4 C5 31.4 3 30 3 28 Z"
        tone={M.mud}
        lit="M3 28 C3 24.4 6 22 9.6 22.4 C7 24 6 26 6 29.4 C4.2 29.4 3 28.6 3 28 Z"
      />
      <Eye x={7.4} y={25.8} r={1.3} />
      <path d="M3.4 28.6 C4.6 29.4 6 29.6 7.4 29.2" fill="none" stroke={INK} strokeWidth={0.8} />
    </Tuft>
  );
}

export function CompanionStoneWhelp() {
  return (
    <Tuft ground={M.stone}>
      {/* A troll's pup: a round grey body, a head too big, ears out wide, two small tusks. */}
      <Shape
        d="M13 41 C10 33 13 25 22 24 C31 23 37 29 36 37 L35 41 Z"
        tone={M.troll}
        lit={litAt(23, 31, 11)}
        shade={shadeAt(27, 35, 11)}
      >
        <path d="M27 30 L31 29 L33 33 L29 35 Z" fill={M.stone.base} stroke={M.stone.shadow} strokeWidth={0.8} />
      </Shape>
      <Shape
        d="M7 18 C7 11 13 7 20 7 C27 7 32 11 32 18 C32 24 27 27.6 20 27.6 C13 27.6 7 24 7 18 Z"
        tone={M.troll}
        lit={litAt(19, 15, 10)}
        shade={shadeAt(22, 19, 10)}
      >
        <path
          d="M11 13 C14 11.4 18 11.6 21 13"
          fill="none"
          stroke={M.troll.shadow}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Shape>
      <Shape d="M8 16 L1.6 12.6 L6 20.4 Z M31 15 L38 10.6 L33.4 19.6 Z" tone={M.troll} lit="M8 16 L1.6 12.6 L5 17 Z" />
      <path
        d="M9.4 23.4 L8.6 18.4 L12.6 22.6 Z M15.6 24.2 L16.4 19 L18.8 23.8 Z"
        fill={M.bone.light}
        stroke={INK}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <Eye x={12.6} y={16.4} r={1.7} iris={M.amber.light} />
    </Tuft>
  );
}

export function CompanionLanternFrog() {
  return (
    <Tuft ground={M.bog}>
      {/* A fen frog with the Warden's lantern-light: a small glowing lamp hung from a reed over its head. */}
      <path d="M38 41 C38 30 36 18 30 9" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M38 41 C38 30 36 18 30 9" fill="none" stroke={M.reed.base} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M30 9 V13" stroke={INK} strokeWidth={1} />
      <Shape d={circle(30, 16.6, 3.8)} tone={M.wisp} lit={circle(29, 15.6, 2.4)}>
        <circle cx={30} cy={16.6} r={1.3} fill="#ffffff" />
      </Shape>
      <Shape
        d="M7 38 C5 31 9 25 17 24 C25 23 32 27 33 34 C33.6 38.4 30.6 41 26 41 L11 41 C9 41 7.6 40 7 38 Z"
        tone={C.frog}
        lit={litAt(18, 31, 11)}
        shade={shadeAt(21, 34, 11)}
      >
        <path
          d="M9 35 C13 37 18 37.4 22 36.4"
          fill="none"
          stroke={M.drowned.light}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      </Shape>
      <Shape d={circle(13.6, 24.6, 4)} tone={C.frog} lit={litAt(13.6, 24.6, 4)} />
      <Eye x={13.2} y={24.6} r={2.3} iris={M.wisp.base} />
      <path d="M7.4 31.6 C11 32.6 15.4 32.4 19 31" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <Shape d="M23 41 C24 37 28 36 31 38.4 C32.6 39.6 33 41 33 41 Z" tone={C.frog} />
    </Tuft>
  );
}

export function CompanionWyrmling() {
  return (
    <Tuft ground={M.cinder}>
      {/* A wyrm's hatchling: black-scaled, a gold belly, small wings half open, a curled tail. */}
      <Shape d="M32 38 C38 39 44 36 44 31 C44 28 41 27.6 40.4 30 C40 32.6 37 34 33 34 Z" tone={C.scale} />
      <Shape
        d="M28 22 C32 13 39 9 44 10 C41 13 40 16 41 19 C38 18 36 20 35.6 23 C33 22 30 22.6 28 25 Z"
        tone={C.scale}
        lit="M28 22 C32 13 39 9 44 10 C39 12 34 16 31 22.4 Z"
      >
        <path d="M31 21 L41 12 M33.6 22.4 L40 16" stroke={C.scale.light} strokeWidth={0.9} />
      </Shape>
      <Shape
        d="M13 41 C11 33 14 25 22 23 C30 21 35 27 35 34 L34 41 Z"
        tone={C.scale}
        lit={litAt(22, 31, 10)}
        shade={shadeAt(26, 35, 10)}
      >
        <path d="M16.4 28 C15.6 33 16.4 37.6 18.6 41 L22.6 41 C21 36 21 31 22 26 Z" fill={M.amber.base} />
        <path d="M17 31.4 H21.2 M17 35 H21.4" stroke={M.amber.shadow} strokeWidth={0.9} />
      </Shape>
      <Shape
        d="M2 19.6 C2 16.6 4.6 15 8 14.4 C9.4 11 12.6 9 16.4 9 C21.4 9 25 12.4 25 17 C25 22 21 25 16 25 C12.6 25 10.4 23.8 9 22.4 C5 22.6 2 22 2 19.6 Z"
        tone={C.scale}
        lit={litAt(14, 16, 8.4)}
      />
      <path
        d="M15.6 10 C16 6 18 3 21.6 1.6 C20 4.6 19.6 7.4 20.4 10.4 Z M20.6 11.6 C22.6 8.4 25.6 6.6 29.4 6.4 C27 8.4 25.6 10.6 25.4 13.6 Z"
        fill={M.bone.base}
        stroke={INK}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Eye x={13.4} y={15.6} r={1.9} iris={M.amber.light} />
      <Glint x={10.6} y={13} r={0.9} />
      <circle cx={4.4} cy={18.4} r={0.9} fill={INK} />
    </Tuft>
  );
}
