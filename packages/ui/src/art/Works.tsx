// The steading's works in the region's scene (session 25), on the hill beside the forge: each appears
// when first built, takes its full shape by its third raising and flies a pennant at its fifth. Drawn
// as the forge is (MarchScene.tsx): flat tones, the light from the upper left, ink round each shape.
import s from './MarchScene.module.css';

type Pt = [number, number];
/** A work's stage, and where it stands: its centre and the ground beneath it. */
interface Placed {
  stage: number;
  x: number;
  base: number;
}
const poly = (pts: Pt[]) => pts.map(([x, y]) => `${x},${y}`).join(' ');

/** A small gabled building standing on `base`, centred on `x`. */
function House({ x, base, w, h, roof }: { x: number; base: number; w: number; h: number; roof: number }) {
  const l = x - w / 2;
  const r = x + w / 2;
  const top = base - h;
  return (
    <g>
      <rect className={s.wall} x={l} y={top} width={w} height={h} />
      <rect className={s.wallShade} x={x + w / 6} y={top} width={w / 3} height={h} />
      <polygon
        className={s.roof}
        points={poly([
          [l - 3, top],
          [x, top - roof],
          [r + 3, top],
        ])}
      />
      <polygon
        className={s.roofLit}
        points={poly([
          [l - 3, top],
          [x, top - roof],
          [x - 2, top],
        ])}
      />
      <polygon
        className={s.ink}
        points={poly([
          [l - 3, top],
          [x, top - roof],
          [r + 3, top],
          [r, top],
          [r, base],
          [l, base],
          [l, top],
        ])}
      />
    </g>
  );
}

/** A pennant on a pole: a work raised five times. */
function Pennant({ x, top }: { x: number; top: number }) {
  return (
    <g>
      <line className={s.ink} x1={x} y1={top} x2={x} y2={top - 16} />
      <polygon
        className={s.pennant}
        points={poly([
          [x, top - 16],
          [x + 12, top - 12],
          [x, top - 8],
        ])}
      />
    </g>
  );
}

/** A log seen end on. */
const Log = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle className={s.trunk} cx={x} cy={y} r={4} />
    <circle className={s.roofLit} cx={x - 0.6} cy={y - 0.6} r={2} />
  </g>
);

function Shrine({ stage, x, base }: Placed) {
  return (
    <g>
      {stage >= 2 &&
        [x - 14, x + 14].map((cx) => (
          <g key={cx}>
            <circle className={s.stone} cx={cx} cy={base - 3} r={3} />
            <circle className={s.ink} cx={cx} cy={base - 3} r={3} />
          </g>
        ))}
      <rect className={s.stone} x={x - 9} y={base - 5} width={18} height={5} />
      <rect className={s.ink} x={x - 9} y={base - 5} width={18} height={5} />
      {stage < 3 ? (
        <g>
          <polygon
            className={s.stoneLit}
            points={poly([
              [x - 4, base - 5],
              [x - 3, base - 20],
              [x + 3, base - 22],
              [x + 4, base - 5],
            ])}
          />
          <polygon
            className={s.ink}
            points={poly([
              [x - 4, base - 5],
              [x - 3, base - 20],
              [x + 3, base - 22],
              [x + 4, base - 5],
            ])}
          />
        </g>
      ) : (
        <House x={x} base={base - 5} w={16} h={12} roof={8} />
      )}
      {stage >= 4 && <rect className={s.fireDoor} x={x - 2} y={base - 13} width={4} height={7} />}
      {stage >= 5 && <Pennant x={x} top={base - 25} />}
    </g>
  );
}

/** The tower's height at each stage: it climbs with the first four. */
const TOWER = [0, 20, 30, 36, 44, 44];

function Watchtower({ stage, x, base }: Placed) {
  const h = TOWER[Math.min(stage, 5)];
  return (
    <g>
      <rect className={s.wall} x={x - 6} y={base - h} width={12} height={h} />
      <rect className={s.wallShade} x={x + 1} y={base - h} width={5} height={h} />
      <rect className={s.ink} x={x - 6} y={base - h} width={12} height={h} />
      {stage < 3 ? (
        <g>
          <rect className={s.roofLit} x={x - 8} y={base - h - 3} width={16} height={3} />
          <rect className={s.ink} x={x - 8} y={base - h - 3} width={16} height={3} />
        </g>
      ) : (
        <House x={x} base={base - h} w={16} h={5} roof={7} />
      )}
      {stage >= 2 && <rect className={s.window} x={x - 2} y={base - h + 8} width={4} height={5} />}
      {stage >= 5 && <Pennant x={x} top={base - h - 12} />}
    </g>
  );
}

function Smokehouse({ stage, x, base }: Placed) {
  return (
    <g>
      {stage >= 2 && <rect className={s.chimney} x={x + 6} y={base - 30} width={6} height={12} />}
      <House x={x} base={base} w={26} h={13} roof={9} />
      {stage >= 3 &&
        [
          [x + 10, base - 36, 3],
          [x + 7, base - 43, 4],
          [x + 2, base - 51, 5],
        ].map(([cx, cy, r], i) => (
          <circle key={i} className={s.smoke} cx={cx} cy={cy} r={r} style={{ opacity: 0.55 - i * 0.12 }} />
        ))}
      {stage >= 4 && <House x={x - 19} base={base} w={12} h={8} roof={5} />}
      {stage >= 5 && <Pennant x={x - 5} top={base - 22} />}
    </g>
  );
}

function Workshop({ stage, x, base }: Placed) {
  return (
    <g>
      {stage >= 3 && <House x={x + 21} base={base} w={14} h={9} roof={5} />}
      <House x={x} base={base} w={32} h={15} roof={10} />
      {stage >= 2 && <rect className={s.fireDoor} x={x - 3} y={base - 9} width={6} height={9} />}
      {stage >= 4 && <rect className={s.window} x={x - 12} y={base - 11} width={5} height={4} />}
      {stage >= 5 && <Pennant x={x} top={base - 25} />}
    </g>
  );
}

function Woodyard({ stage, x, base }: Placed) {
  const pile: Pt[] = [
    [-8, -4],
    [0, -4],
    [8, -4],
    [-4, -11],
    [4, -11],
    [0, -18],
  ];
  return (
    <g>
      {stage >= 3 && (
        <g>
          <line className={s.ink} x1={x - 14} y1={base} x2={x - 14} y2={base - 26} />
          <line className={s.ink} x1={x + 14} y1={base} x2={x + 14} y2={base - 26} />
          <polygon
            className={s.roof}
            points={poly([
              [x - 18, base - 26],
              [x, base - 34],
              [x + 18, base - 26],
            ])}
          />
          <polygon
            className={s.ink}
            points={poly([
              [x - 18, base - 26],
              [x, base - 34],
              [x + 18, base - 26],
            ])}
          />
        </g>
      )}
      {pile.slice(0, stage >= 2 ? 6 : 3).map(([dx, dy], i) => (
        <Log key={i} x={x + dx} y={base + dy} />
      ))}
      {stage >= 4 &&
        [
          [-24, -4],
          [-32, -4],
          [-28, -11],
        ].map(([dx, dy], i) => <Log key={i} x={x + dx} y={base + dy} />)}
      {stage >= 5 && <Pennant x={x} top={base - 34} />}
    </g>
  );
}

function TrainingYard({ stage, x, base }: Placed) {
  const posts = stage >= 3 ? [-18, -6, 6, 18] : [-10, 2, 14];
  return (
    <g>
      {stage >= 4 && (
        <g>
          <line className={s.ink} x1={x} y1={base} x2={x} y2={base - 18} />
          <line className={s.ink} x1={x - 6} y1={base - 14} x2={x + 6} y2={base - 14} />
          <circle className={s.wall} cx={x} cy={base - 21} r={3} />
          <circle className={s.ink} cx={x} cy={base - 21} r={3} />
        </g>
      )}
      <line className={s.ink} x1={x + posts[0]} y1={base - 7} x2={x + posts[posts.length - 1]} y2={base - 7} />
      {posts.map((dx) => (
        <line key={dx} className={s.ink} x1={x + dx} y1={base} x2={x + dx} y2={base - 10} />
      ))}
      {stage >= 2 && (
        <g>
          <line className={s.ink} x1={x - 30} y1={base} x2={x - 30} y2={base - 14} />
          <circle className={s.wall} cx={x - 30} cy={base - 20} r={6} />
          <circle className={s.fireDoor} cx={x - 30} cy={base - 20} r={2.5} />
          <circle className={s.ink} cx={x - 30} cy={base - 20} r={6} />
        </g>
      )}
      {stage >= 5 && <Pennant x={x + posts[posts.length - 1]} top={base - 10} />}
    </g>
  );
}

/** Where each work stands: along the hill on the near side of the forge, inside the middle of the scene
 *  that every crop of the banner keeps; `base` is the hill's height there (MarchScene's `midHill`). */
const DRAW: Record<string, { draw: (p: Placed) => React.JSX.Element; x: number; base: number }> = {
  'training-yard': { draw: TrainingYard, x: 688, base: 389 },
  woodyard: { draw: Woodyard, x: 762, base: 395 },
  shrine: { draw: Shrine, x: 822, base: 402 },
  watchtower: { draw: Watchtower, x: 866, base: 407 },
  smokehouse: { draw: Smokehouse, x: 916, base: 412 },
  workshop: { draw: Workshop, x: 990, base: 417 },
};
/** The works are drawn a size up from their outline numbers (their ink kept at the forge's weight). */
const SIZE = 1.3;

/** The works raised so far, by their stage (none drawn until built). */
export function Works({ stages }: { stages: Record<string, number> }) {
  return (
    <g className={s.works}>
      {Object.entries(DRAW).map(([id, { draw: Draw, x, base }]) => {
        const stage = Object.hasOwn(stages, id) ? stages[id] : 0;
        if (stage <= 0) return null;
        return (
          <g key={id} transform={`translate(${x} ${base}) scale(${SIZE}) translate(${-x} ${-base})`}>
            <Draw stage={stage} x={x} base={base} />
          </g>
        );
      })}
    </g>
  );
}
