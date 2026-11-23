// The second bosses' finds (session 210), a Rare and a Legendary each, drawn as the first bosses' are
// (bosses.tsx): the Barrow-king's ring and sceptre, the Mire-mother's pearl and egg, the Storm-roc's talon
// and the feather that carries its storm.
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';

const GRAVE = '#b8ffcf';
const Glow = ({ d, under, over }: { d: string; under: string; over: string }) => (
  <g>
    <path d={d} fill="none" stroke={under} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={over} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export function BarrowRing() {
  const ring = circle(24, 28, 13);
  return (
    <g>
      {/* A thick band of old bronze, a grave-light stone set in its bezel. */}
      <path d={ring} fill="none" stroke={INK} strokeWidth={8.4} />
      <path d={ring} fill="none" stroke={M.bronze.base} strokeWidth={5.6} />
      <path
        d="M12 25 C13.4 19 18 15.6 24 15"
        fill="none"
        stroke={M.bronze.light}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M34 36 C31.6 39 28 41 24 41"
        fill="none"
        stroke={M.bronze.shadow}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Shape d="M17 13 L24 5 L31 13 L24 19 Z" tone={M.bronze} lit="M17 13 L24 5 L24 13 Z" />
      <Shape d="M20 12.4 L24 8 L28 12.4 L24 16 Z" tone={M.wisp} lit="M20 12.4 L24 8 L24 12.4 Z">
        <circle cx={24} cy={12} r={1.4} fill={GRAVE} />
      </Shape>
      <Glint x={22} y={10} r={0.8} />
    </g>
  );
}

export function WightKingsSceptre() {
  return (
    <g>
      {/* The rod, corded where the hand held it, its head a cracked bronze cage round a grave-light. */}
      <path d="M8 44 L28 16" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M8 44 L28 16" stroke={M.bark.base} strokeWidth={2.8} strokeLinecap="round" />
      <path d="M12 38 L15 34 M14 40 L17 36" stroke={M.leather.shadow} strokeWidth={1.4} />
      <path d={circle(33, 11, 9)} fill={GRAVE} opacity={0.35} />
      <Shape d={circle(33, 11, 6)} tone={M.wisp} lit={circle(31.6, 9.6, 3.4)}>
        <circle cx={33} cy={11} r={2} fill="#ffffff" />
      </Shape>
      <path
        d="M27 15 C25 10 27 5 31 3.4 M39 7 C41 12 39 17 35 18.6 M28 6 L39 16"
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M27 15 C25 10 27 5 31 3.4 M39 7 C41 12 39 17 35 18.6 M28 6 L39 16"
        fill="none"
        stroke={M.bronze.base}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Glint x={30} y={8.6} r={1} />
    </g>
  );
}

export function MirePearl() {
  return (
    <g>
      {/* A mussel's shell of the fen's mud, half open on its pale pearl. */}
      <Shape
        d="M5 34 C6 24 14 18 24 18 C34 18 42 24 43 34 C36 38 12 38 5 34 Z"
        tone={M.mud}
        lit="M5 34 C6 24 14 18 24 18 C17 20.6 12 26 11 34.8 C8.6 34.6 6.6 34.4 5 34 Z"
      >
        {/* The ridges of its growth. */}
        <path
          d="M9 30 C13 24 19 21 24 21 C29 21 35 24 39 30 M12 26 C16 22.6 20 21.6 24 21.6"
          fill="none"
          stroke={M.mud.shadow}
          strokeWidth={1}
        />
      </Shape>
      <Shape d="M5 34 C12 38 36 38 43 34 C40 41 32 44 24 44 C16 44 8 41 5 34 Z" tone={M.mud} />
      <path d="M8 34.8 C16 37.4 32 37.4 40 34.8" fill="none" stroke={M.drowned.light} strokeWidth={1} />
      <Shape d={circle(24, 30, 6.4)} tone={M.moonstone} lit={circle(22.4, 28.4, 3.6)}>
        <Glint x={22} y={27.8} r={1.2} />
      </Shape>
    </g>
  );
}

export function MireMothersEgg() {
  return (
    <g>
      {/* A great mottled egg, a glowing crack about to give. */}
      <Shape
        d="M24 3 C34 3 41 16 41 28 C41 38 33 45 24 45 C15 45 7 38 7 28 C7 16 14 3 24 3 Z"
        tone={M.bog}
        lit="M24 3 C14 3 7 16 7 28 C7 33 9 37.4 12.4 40.6 C11 30 13.4 16 24 3 Z"
        shade="M41 28 C41 38 33 45 24 45 C31 41 35 34.6 35.6 27 C36 20 34 12 30.6 6.4 C37 10.4 41 19 41 28 Z"
      >
        {[
          [29, 15, 2.4],
          [16, 26, 2],
          [30, 33, 2.8],
          [20, 38, 1.6],
        ].map(([x, y, r]) => (
          <path key={x} d={ellipse(x, y, r, r * 0.8)} fill={M.mud.shadow} opacity={0.7} />
        ))}
        <Glow d="M18 12 L22 17 L19.6 21 L24 26" under="#7a5a12" over="#ffe27a" />
      </Shape>
      <Glint x={14} y={14} r={1.4} />
    </g>
  );
}

export function RocTalon() {
  return (
    <g>
      {/* One curved claw, black and glossed, its root in the grey scale of the foot. */}
      <Shape
        d="M10 40 C9 26 16 12 31 6 C36 4.4 40 5 42 7 C33 10 25 18 22 30 L20 40 Z"
        tone={M.obsidian}
        lit="M10 40 C9 26 16 12 31 6 C22 12.6 16.4 22 15.4 40 Z"
      >
        <path d="M14 34 C15 24 21 15 31 9" fill="none" stroke={M.obsidian.light} strokeWidth={1} />
      </Shape>
      <Shape
        d="M6 38 C12 36 22 36 26 39 L26 45 L6 45 Z"
        tone={M.cinder}
        lit="M6 38 C12 36 22 36 26 39 L26 40.6 C20 38.6 12 38.6 6 40 Z"
      >
        <path d="M10 41.6 L14 40.4 M17 42 L21 40.6" stroke={M.cinder.shadow} strokeWidth={1} />
      </Shape>
      <Glint x={20} y={14} r={1.1} />
    </g>
  );
}

export function Stormfeather() {
  return (
    <g>
      {/* A long flight feather, storm-grey, lightning running down its quill. */}
      <Shape
        d="M40 4 C44 14 38 28 26 37 C20 41 13 43 8 44 C10 38 13 31 18 24 C24 15 32 8 40 4 Z"
        tone={M.cloak}
        lit="M40 4 C32 8 24 15 18 24 C14.6 29 12 34 10 39.4 C17 30 27 18 40 4 Z"
        shade="M40 4 C44 14 38 28 26 37 C21.4 40 16.4 42 12 43.2 C24 36 34 22 40 4 Z"
      >
        <path d="M18 31 L23 30 M22 25.6 L27 25 M26 20.6 L31 20" stroke={M.cloak.shadow} strokeWidth={0.9} />
      </Shape>
      <Glow d="M40 4 L31 17 L34 18.6 L22 31 L25 32 L8 44" under="#3b6b99" over="#d8f0ff" />
      <Glint x={33} y={10} r={1} />
    </g>
  );
}
