// Reference icons for the other families: Pine logs, Copper ore, Iron bar (resources), Hollow rat
// (foe), Bread (food), Bird's nest (find) and Woodcutting (skill, on its seal); and the other logs.
import { circle, ellipse, Glint, INK, LINE, M, Shape, type Tone } from './style.tsx';

/** One log lying with its cut end towards you: a rounded bark body running back to the upper right. */
function Log({ x, y, r, wood, bark = M.bark }: { x: number; y: number; r: number; wood: Tone; bark?: Tone }) {
  const [bx, by] = [x + 7, y - 4.5];
  return (
    <g>
      <line x1={x} y1={y} x2={bx} y2={by} stroke={INK} strokeWidth={r * 2 + LINE} strokeLinecap="round" />
      <line x1={x} y1={y} x2={bx} y2={by} stroke={bark.base} strokeWidth={r * 2} strokeLinecap="round" />
      <line
        x1={x - 2}
        y1={y - 3.4}
        x2={bx - 2}
        y2={by - 3.4}
        stroke={bark.light}
        strokeWidth={r * 0.7}
        strokeLinecap="round"
      />
      <Shape d={circle(x, y, r)} tone={wood} lit={circle(x - r * 0.25, y - r * 0.25, r * 0.7)}>
        <circle cx={x} cy={y} r={r - 1.6} fill="none" stroke={bark.base} strokeWidth={1.8} />
        <circle cx={x + 0.4} cy={y + 0.3} r={r * 0.48} fill="none" stroke={wood.shadow} strokeWidth={0.9} />
        <circle cx={x + 0.6} cy={y + 0.5} r={r * 0.2} fill={wood.shadow} />
      </Shape>
    </g>
  );
}

export function PineLogs() {
  return (
    <g>
      <Log x={21} y={18.5} r={8} wood={M.heartwood} />
      <Log x={12.5} y={34} r={8} wood={M.heartwood} />
      <Log x={29.5} y={34} r={8} wood={M.heartwood} />
    </g>
  );
}

/** The three logs of a pile, in a tree's wood and bark. Tiers step from pale to deep. */
const pile = (wood: Tone, bark: Tone) => (
  <g>
    <Log x={21} y={18.5} r={8} wood={wood} bark={bark} />
    <Log x={12.5} y={34} r={8} wood={wood} bark={bark} />
    <Log x={29.5} y={34} r={8} wood={wood} bark={bark} />
  </g>
);

export const AshLogs = () => pile(M.ashWood, M.ashBark);
export const OakLogs = () => pile(M.oakWood, M.oakBark);
export const YewLogs = () => pile(M.yewWood, M.yewBark);

/** A chunk of rock with nuggets of its ore, faceted, lit on the upper left. */
export function Ore({ ore }: { ore: Tone }) {
  const nugget = (cx: number, cy: number, r: number) => {
    const pt = (x: number, y: number) => `${cx + x * r} ${cy + y * r}`;
    const d = `M${pt(-1, -0.4)} L${pt(-0.2, -1)} L${pt(0.9, -0.6)} L${pt(1, 0.5)} L${pt(0.1, 1)} L${pt(-0.9, 0.6)} Z`;
    return (
      <Shape
        d={d}
        tone={ore}
        lit={`M${pt(-1, -0.4)} L${pt(-0.2, -1)} L${pt(0.9, -0.6)} L${pt(0.1, 0)} Z`}
        shade={`M${pt(0.1, 0)} L${pt(0.9, -0.6)} L${pt(1, 0.5)} L${pt(0.1, 1)} Z`}
      >
        <Glint x={cx - r * 0.35} y={cy - r * 0.45} r={r * 0.22} />
      </Shape>
    );
  };
  return (
    <g>
      <Shape
        d="M7 33 L11.5 18 L22 9.5 L35 11.5 L42.5 22.5 L40.5 36.5 L28 42.5 L13.5 40.5 Z"
        tone={M.stone}
        lit="M7 33 L11.5 18 L22 9.5 L35 11.5 L27 21.5 L15.5 24 Z"
        shade="M35 11.5 L42.5 22.5 L40.5 36.5 L28 42.5 L29.5 30 L27 21.5 Z"
      >
        <path
          d="M15.5 24 L27 21.5 L29.5 30 L28 42.5 M27 21.5 L35 11.5"
          fill="none"
          stroke={M.stone.shadow}
          strokeWidth={1.1}
        />
      </Shape>
      {nugget(19, 30, 4)}
      {nugget(31.5, 19.5, 3.2)}
      {nugget(34, 32, 2.6)}
    </g>
  );
}

/** An ingot seen from slightly above: its top in the metal's lighter tone, its face in the metal. */
export function Bar({ top, metal }: { top: Tone; metal: Tone }) {
  return (
    <g>
      <Shape
        d="M13 14.5 H35 L40.5 22.5 H7.5 Z"
        tone={top}
        lit="M13 14.5 H35 L36.5 16.6 H11.5 Z"
        shade="M31 14.5 H35 L40.5 22.5 H35 Z"
      >
        <rect x={19.5} y={16.8} width={9} height={3.4} rx={0.6} fill={metal.base} />
      </Shape>
      <Shape
        d="M7.5 22.5 H40.5 L37 35.5 H11 Z"
        tone={metal}
        lit="M7.5 22.5 H16 L16.5 35.5 H11 Z"
        shade="M29 22.5 H40.5 L37 35.5 H28.5 Z"
      >
        <Glint x={11.5} y={25.5} r={1.2} />
      </Shape>
    </g>
  );
}

export function HollowRat() {
  return (
    <g>
      <Shape d={circle(28.5, 13, 6.5)} tone={M.fur} lit={circle(27, 11.5, 4)}>
        <circle cx={29} cy={13.5} r={3.4} fill={M.skin.base} />
      </Shape>
      <Shape
        d="M5 28 C7 22 14 17 22 16.5 C31 16 39 21 41.5 29 C43.5 37 38 43.5 30 44 L15.5 44 C12 40 13.5 35 17.5 33 C11.5 32.5 7 31 5 28 Z"
        tone={M.fur}
        lit="M5 28 C7 22 14 17 22 16.5 C27 16.3 31 17.5 34 19.5 C27 19 19 21 15 26 C12 29.5 8.5 30 5 28 Z"
        shade="M41.5 29 C43.5 37 38 43.5 30 44 L24 44 C31 41 36 35 35.5 26 C38.5 26.5 40.5 27.5 41.5 29 Z"
      >
        <path d="M21 33 C25 36 31 36 35 33" fill="none" stroke={M.fur.shadow} strokeWidth={1.1} />
      </Shape>
      <Shape d={circle(5.6, 27.6, 2)} tone={M.skin} lit={circle(5, 27, 1)} />
      <ellipse cx={16.5} cy={23.2} rx={2.9} ry={2.3} fill={INK} />
      <circle cx={17.2} cy={23.4} r={1.15} fill="#c4e8a2" />
      <path d="M9 30.5 L8.5 33.5 L10.5 30.8" fill="#f4efe2" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M11 28.5 L1.5 26.5 M11 29.6 L2 31" stroke={INK} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

export function Bread() {
  return (
    <g>
      <Shape
        d="M5.5 30.5 C5.5 18 15.5 12 24 12 C33.5 12 42.5 18 42.5 30.5 C42.5 35.5 36 37.5 24 37.5 C12 37.5 5.5 35.5 5.5 30.5 Z"
        tone={M.crust}
        lit="M5.5 30.5 C5.5 18 15.5 12 24 12 C18 14.5 13 20 12.5 30 C12.5 33 13.5 35.5 15 37 C9 36.2 5.5 34 5.5 30.5 Z"
        shade="M42.5 30.5 C42.5 35.5 36 37.5 24 37.5 C31 36 36 33 37 27 C37.5 23 36 18.5 33.5 15.5 C39 18.5 42.5 23.5 42.5 30.5 Z"
      >
        {['M13.5 26 L19.5 17.5', 'M20.5 28.5 L27.5 17', 'M28 29 L34.5 19'].map((d) => (
          <g key={d}>
            <path d={d} stroke={M.crumb.shadow} strokeWidth={3.4} strokeLinecap="round" />
            <path d={d} stroke={M.crumb.base} strokeWidth={1.8} strokeLinecap="round" />
          </g>
        ))}
        <Glint x={13} y={21} r={1.2} />
      </Shape>
    </g>
  );
}

export function BirdsNest() {
  const bowl = 'M5.5 25.5 C7 39 41 39 42.5 25.5 C40 21.5 8 21.5 5.5 25.5 Z';
  const egg = (cx: number, cy: number, rot: number) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <Shape d={ellipse(cx, cy, 5, 6.4)} tone={M.eggshell} lit={ellipse(cx - 1.4, cy - 1.8, 2.6, 3.4)}>
        <circle cx={cx + 1.4} cy={cy + 1.2} r={0.7} fill={M.eggshell.shadow} />
      </Shape>
    </g>
  );
  return (
    <g>
      <path d={ellipse(24, 25.2, 17, 3.6)} fill="#4f3720" stroke={INK} strokeWidth={LINE} />
      {egg(16.5, 19, -20)}
      {egg(31.5, 19, 18)}
      {egg(24, 16, 0)}
      <Shape
        d={bowl}
        tone={M.straw}
        lit="M5.5 25.5 C6 30 9 33.5 13 35.5 C11 31 11 27 13 24 C9.5 24 6.7 24.6 5.5 25.5 Z"
        shade="M42.5 25.5 C41.5 33 36 36.5 30 37.5 C34 33.5 36 29 35 23.6 C39 24 41.6 24.6 42.5 25.5 Z"
      >
        {[
          'M8 27 C16 31 30 31 40 27',
          'M9 31 C18 34 30 34 38.5 31',
          'M14 25.5 L19 33',
          'M28 33 L33 25.5',
          'M22 26.5 L25.5 35',
        ].map((d) => (
          <path key={d} d={d} fill="none" stroke={M.straw.shadow} strokeWidth={1} strokeLinecap="round" />
        ))}
      </Shape>
    </g>
  );
}

export function WoodcuttingSeal() {
  return (
    <g>
      <Shape
        d={circle(24, 24, 21.5)}
        tone={M.bronze}
        lit="M2.5 24 A21.5 21.5 0 0 1 24 2.5 L24 6 A18 18 0 0 0 6 24 Z"
        shade="M45.5 24 A21.5 21.5 0 0 1 24 45.5 L24 42 A18 18 0 0 0 42 24 Z"
      >
        <path d={circle(24, 24, 18.2)} fill={M.seal.base} stroke={INK} strokeWidth={1.4} />
        <path d="M6 24 A18 18 0 0 1 24 6 L24 9 A15 15 0 0 0 9 24 Z" fill={M.seal.light} opacity={0.6} />
      </Shape>
      <line x1={15.5} y1={38} x2={29.5} y2={12.5} stroke={INK} strokeWidth={5.6} strokeLinecap="round" />
      <line x1={15.5} y1={38} x2={29.5} y2={12.5} stroke={M.ash.base} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={14.9} y1={37.2} x2={28.9} y2={11.7} stroke={M.ash.light} strokeWidth={1.1} strokeLinecap="round" />
      <Shape
        d="M25.5 10 L32 6 C38 8.5 40 16 36.5 22 L29.5 17.5 Z"
        tone={M.iron}
        lit="M25.5 10 L32 6 C34 6.8 35.6 8 36.8 9.6 L28 14 Z"
        shade="M36.5 22 C38.6 18.4 39 14.2 38 10.6 L33.5 14 L33 19.8 Z"
      >
        <path d="M35.2 7.6 C38.6 10.8 39.4 16.6 36.8 21.4" fill="none" stroke={M.steel.light} strokeWidth={1.3} />
        <Glint x={30} y={9.6} r={1.1} />
      </Shape>
    </g>
  );
}

export const CopperOre = () => <Ore ore={M.copper} />;
export const TinOre = () => <Ore ore={M.tin} />;
export const IronOre = () => <Ore ore={M.ironOre} />;

/** Coal: a heap of glossy black lumps, each catching the light on its upper-left face. */
export function Coal() {
  const lump = (pts: [number, number][], lit: [number, number][], g: [number, number]) => (
    <Shape
      d={`M${pts.map((p) => p.join(' ')).join(' L')} Z`}
      tone={M.coal}
      lit={`M${lit.map((p) => p.join(' ')).join(' L')} Z`}
    >
      <Glint x={g[0]} y={g[1]} r={1.2} />
    </Shape>
  );
  return (
    <g>
      {lump(
        [
          [22, 12],
          [33, 9.5],
          [40, 17],
          [37.5, 27],
          [26, 28],
          [20, 21],
        ],
        [
          [22, 12],
          [33, 9.5],
          [30, 17.5],
          [21, 20],
        ],
        [26, 14],
      )}
      {lump(
        [
          [6.5, 30],
          [12, 20.5],
          [23, 19.5],
          [27, 29],
          [22, 39.5],
          [10, 39],
        ],
        [
          [6.5, 30],
          [12, 20.5],
          [23, 19.5],
          [15, 28],
        ],
        [12, 24.5],
      )}
      {lump(
        [
          [25, 31],
          [33, 25],
          [42, 29],
          [42.5, 39],
          [33, 42.5],
          [25.5, 39],
        ],
        [
          [25, 31],
          [33, 25],
          [42, 29],
          [32, 33],
        ],
        [31, 29],
      )}
    </g>
  );
}

const barTop = (light: string, metal: Tone): Tone => ({ light, base: metal.light, shadow: metal.base });
export const CopperBar = () => <Bar top={barTop('#fbd2b2', M.copper)} metal={M.copper} />;
export const BronzeBar = () => <Bar top={barTop('#f8e6bf', M.bronze)} metal={M.bronze} />;
export const IronBar = () => <Bar top={M.steel} metal={M.iron} />;
export const SteelBar = () => <Bar top={barTop('#ffffff', M.steel)} metal={M.steel} />;
