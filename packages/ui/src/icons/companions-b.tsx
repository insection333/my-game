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
      {/* A falcon perched in profile, facing left: the slate wing folded and crossing past the tail, a barred
          cream breast, the dark moustache under a yellow-ringed eye, a hooked beak, yellow feet. */}
      <Shape
        d="M14 34 C12 27 13 20 17 16 C21 12.6 27 13 29.6 18 C32 23 31.6 30 29 36 Z"
        tone={M.bone}
        lit={litAt(19, 24, 9)}
        shade={shadeAt(24, 29, 9)}
      >
        <path
          d="M15.4 24 H19 M15 27.6 H19.6 M15.4 31.2 H20 M16.4 34.6 H20.6"
          stroke={C.slate.base}
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeDasharray="1.4 1.2"
        />
      </Shape>
      <Shape
        d="M20 18 C26 16 32 20 33 27 C34 33 33 39 31 45 L27.6 44.6 C27 38 24 31 20.6 26 Z"
        tone={C.slate}
        lit="M20 18 C26 16 32 20 33 27 C30 23 25.4 21 21.4 21.6 Z"
        shade="M33 27 C34 33 33 39 31 45 L29.4 44.8 C30.6 38 31 32 30.6 27 Z"
      >
        <path
          d="M24 27 C27 30 29 35 29.6 41 M27 25.6 C30 29 31.4 34 31.6 40"
          fill="none"
          stroke={C.slate.shadow}
          strokeWidth={1}
        />
      </Shape>
      <Shape
        d="M11.4 14.6 C11.4 9.8 15 6.6 19.6 6.6 C24.6 6.6 27.6 10 27.4 14.6 C27.2 18.4 24.4 21 20 21 C15 21 11.4 19 11.4 14.6 Z"
        tone={C.slate}
        lit={litAt(19, 12.6, 8)}
      >
        <path d="M13.4 16.4 C15 19.4 18 20.6 21 20.4 C19.6 18.6 19.4 16.4 20 14.6 Z" fill={M.bone.light} />
        <path
          d="M16.6 14.6 C16.4 17.4 17 19.4 18.4 21"
          fill="none"
          stroke={M.coal.shadow}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M12.4 11.8 L6.4 13.4 C4.8 15 4.8 17.8 6.8 18.8 C7.2 17.4 8 16.6 9.4 16.4 L12.6 16.4 Z"
        tone={M.amber}
        lit="M12.4 11.8 L6.4 13.4 C5.8 14.2 5.4 15 5.6 15.8 L12.4 14 Z"
      />
      <circle cx={15.6} cy={12.8} r={2.6} fill={M.amber.light} />
      <Eye x={15.6} y={12.8} r={1.8} />
      <path d="M17 39 L16.4 42.4 M20.6 39.4 L20.6 42.4" stroke={M.amber.base} strokeWidth={2} strokeLinecap="round" />
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
      {/* A troll's pup, squat as a boulder: a round body with stony patches and moss on its back, a broad
          head with small round ears low on its sides, a grin with two short tusks under a heavy brow. */}
      <Shape
        d="M10 41 C8 32 13 24 23 24 C33 24 38 31 37 41 Z"
        tone={M.troll}
        lit={litAt(22, 31, 12)}
        shade={shadeAt(26, 35, 12)}
      >
        <path d="M26 27 C30 26 34 28 35.6 32 C32 30.6 28.6 30 26 30.6 Z" fill={M.leaf.base} />
        <path d="M28.4 33 L32 32.2 L33.6 35.6 L30 37 Z" fill={M.stone.base} stroke={M.stone.shadow} strokeWidth={0.8} />
        <path d="M14 36 L16.6 35 L17.6 38 L15 38.8 Z" fill={M.stone.base} stroke={M.stone.shadow} strokeWidth={0.8} />
      </Shape>
      <Shape
        d="M5 19 C5 11.6 11 7 19 7 C27 7 33 11.6 33 19 C33 25 27.4 28.4 19 28.4 C10.6 28.4 5 25 5 19 Z"
        tone={M.troll}
        lit={litAt(18, 15.4, 11)}
        shade={shadeAt(21, 19, 11)}
      >
        <path
          d="M8.6 14.6 C12 12.4 17 12.4 21 14"
          fill="none"
          stroke={M.troll.shadow}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M22 9.4 L26.4 9 L27.4 12.4 L23.4 13.2 Z"
          fill={M.stone.base}
          stroke={M.stone.shadow}
          strokeWidth={0.8}
        />
      </Shape>
      <Shape d={circle(5.6, 19.4, 2.8)} tone={M.troll} lit={circle(5, 18.8, 1.4)} />
      <Shape d={circle(32.6, 18.4, 2.8)} tone={M.troll} />
      <path d="M8.4 22.6 C12 25.4 17 25.6 21 23.6" fill="none" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
      <path
        d="M10.4 23.8 L10 20.4 L12.8 23.6 Z M17.2 24.6 L17.8 21 L19.6 24.2 Z"
        fill={M.bone.light}
        stroke={INK}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <Eye x={11.4} y={17.4} r={1.8} iris={M.amber.light} />
      <Eye x={17.6} y={17.6} r={1.6} iris={M.amber.light} />
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
