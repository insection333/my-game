// Mining's finds, drawn as they were found (ART.md): two rough gems, an old coin, a geode, a shard of
// star-iron and the heart of the mountain.
import { circle, ellipse, Glint, INK, M, Shape, type Tone } from './style.tsx';

/** A rough gem: a faceted chunk, its facets marked, lit on the upper left. */
function RoughGem({ tone, pts, cut }: { tone: Tone; pts: [number, number][]; cut: [number, number] }) {
  const d = `M${pts.map((p) => p.join(' ')).join(' L')} Z`;
  const [cx, cy] = cut;
  const half = Math.ceil(pts.length / 2);
  const lit = `M${pts
    .slice(0, half)
    .map((p) => p.join(' '))
    .join(' L')} L${cx} ${cy} Z`;
  const shade = `M${pts
    .slice(half - 1)
    .map((p) => p.join(' '))
    .join(' L')} L${cx} ${cy} Z`;
  return (
    <Shape d={d} tone={tone} lit={lit} shade={shade}>
      {pts.map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${cx} ${cy} L${x} ${y}`} stroke={tone.shadow} strokeWidth={0.9} />
      ))}
      <Glint x={(pts[0][0] + cx) / 2} y={(pts[0][1] + cy) / 2 - 2} r={1.4} />
    </Shape>
  );
}

export const RoughGarnet = () => (
  <RoughGem
    tone={M.garnet}
    pts={[
      [9, 24],
      [16, 10],
      [31, 8],
      [40, 19],
      [37, 35],
      [22, 41],
      [11, 35],
    ]}
    cut={[24, 23]}
  />
);

export const RoughSapphire = () => (
  <g transform="rotate(-30 24 24)">
    <RoughGem
      tone={M.sapphire}
      pts={[
        [17, 9],
        [24, 4],
        [31, 9],
        [32, 37],
        [24, 44],
        [16, 37],
      ]}
      cut={[24, 22]}
    />
  </g>
);

export function AncientCoin() {
  return (
    <g>
      <Shape
        d={circle(24, 24, 18)}
        tone={M.bronze}
        lit={circle(21, 21, 12)}
        shade="M42 24 A18 18 0 0 1 24 42 L24 38 A14 14 0 0 0 38 24 Z"
      >
        <path d={circle(24, 24, 14.5)} fill="none" stroke={M.bronze.shadow} strokeWidth={1.3} />
        <path
          d="M17 31 L19 20 L22.5 25.5 L24 17 L25.5 25.5 L29 20 L31 31 Z"
          fill={M.bronze.shadow}
          stroke={M.bronze.shadow}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        <path
          d="M9.5 27 A15 15 0 0 0 12 32 M36 14 A15 15 0 0 1 38.5 19"
          stroke={M.bronze.light}
          strokeWidth={1.1}
          fill="none"
        />
        <Glint x={15.5} y={15} r={1.5} />
      </Shape>
    </g>
  );
}

export function CrystalGeode() {
  const crystal = (x: number, y: number, h: number, rot: number) => (
    <g key={`${x}-${y}`} transform={`rotate(${rot} ${x} ${y})`}>
      <path
        d={`M${x - 2.4} ${y} L${x} ${y - h} L${x + 2.4} ${y} Z`}
        fill={M.amethyst.base}
        stroke={INK}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <path d={`M${x - 2.4} ${y} L${x} ${y - h} L${x} ${y} Z`} fill={M.amethyst.light} />
    </g>
  );
  return (
    <g>
      <Shape
        d="M5 26 C5 15 13 8 24 8 C35 8 43 15 43 26 C43 36 35 42 24 42 C13 42 5 36 5 26 Z"
        tone={M.stone}
        lit="M5 26 C5 15 13 8 24 8 C17 11 11 17 10.5 25 Z"
        shade="M43 26 C43 36 35 42 24 42 C31 38 36 33 37.5 26 Z"
      >
        <path d={ellipse(24, 25.5, 14.5, 11.5)} fill={M.amethyst.shadow} stroke={INK} strokeWidth={1.4} />
        {[
          [14, 31, 8, -35],
          [19, 33, 11, -15],
          [24, 34, 12, 0],
          [29, 33, 11, 15],
          [34, 31, 8, 35],
          [18, 20, 7, 160],
          [26, 18, 8, 185],
          [32, 21, 6, 205],
        ].map(([x, y, h, r]) => crystal(x, y, h, r))}
        <Glint x={22.5} y={26} r={1.2} />
      </Shape>
    </g>
  );
}

export function StarIronShard() {
  return (
    <g>
      <Shape
        d="M10 38 L14 22 L21 13 L26 15 L33 6 L37 12 L35 22 L41 27 L33 34 L24 42 Z"
        tone={M.starIron}
        lit="M10 38 L14 22 L21 13 L26 15 L33 6 L28 20 L20 27 Z"
        shade="M37 12 L35 22 L41 27 L33 34 L24 42 L27 31 L31 23 Z"
      >
        <path d="M20 27 L28 20 L31 23 L27 31 Z" fill={M.starIron.shadow} />
        {[
          [17, 30],
          [23, 22],
          [30, 13],
          [33, 29],
        ].map(([x, y]) => (
          <circle key={`${x}`} cx={x} cy={y} r={0.9} fill="#ffffff" />
        ))}
        <Glint x={17} y={22} r={1.4} />
      </Shape>
    </g>
  );
}

export function HeartOfTheMountain() {
  return (
    <g>
      <Shape
        d="M4 42 L9 31 L17 28 L31 28 L39 31 L44 42 Z"
        tone={M.stone}
        lit="M4 42 L9 31 L17 28 L20 34 Z"
        shade="M31 28 L39 31 L44 42 L33 38 Z"
      />
      <Shape
        d="M24 41 L9.5 25 C6 20.5 7.5 11.5 15 10 C19 9.2 22.5 11.5 24 15 C25.5 11.5 29 9.2 33 10 C40.5 11.5 42 20.5 38.5 25 Z"
        tone={M.garnet}
        lit="M24 41 L9.5 25 C6 20.5 7.5 11.5 15 10 C19 9.2 22.5 11.5 24 15 Z"
        shade="M24 41 L38.5 25 C40.5 22.5 41 19 40 16 L28 27 Z"
      >
        <path
          d="M24 15 L24 41 M9.5 25 L24 27 L38.5 25 M15 10 L17 20 L24 27 M33 10 L31 20 L24 27"
          fill="none"
          stroke={M.garnet.shadow}
          strokeWidth={0.9}
        />
        <path d={ellipse(24, 24, 4, 5.5)} fill={M.amber.light} opacity={0.75} />
        <Glint x={14} y={15} r={1.8} />
      </Shape>
    </g>
  );
}
