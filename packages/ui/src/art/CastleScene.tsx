// The lord's castle in its scene (ART.md, The lord's castle): the castle on its mound in the march, as
// the lord has raised it. Its walls are a timber palisade, then rough stone, dressed stone, stone capped
// in iron and at last white stone trimmed in gold; the keep rises a storey as the castle's levels climb;
// towers stand at the corners and then between them as the watchtower rises, and from level 50 they
// burn beacons. The edict in force flies on the keep. Walls under 100% show their cracks, and below 80%
// their missing merlons and fallen stones; a castle besieged in the last hours has fires on its walls,
// smoke over them and a camp in the field. The sky, hills and pines are the march's (MarchScene), so by
// day it is morning and in the dark theme night, the castle dimmed and its windows and fires lit.
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { INK } from '../icons/style.tsx';
import {
  BANNERS,
  Block,
  buildAt,
  Crown,
  FlagCloth,
  FlagPole,
  Flame,
  Rubble,
  Tower,
  type Build,
} from './castle-parts.tsx';
import c from './CastleScene.module.css';
import { cloud, FarForest, farHill, H, hillPath, Mountains, nearRange, Pine, seeded, W } from './landscape.tsx';
import s from './MarchScene.module.css';

/** The foot of the walls; the keep, towers and banner rise from it, the mound falls away below. */
const B = 446;
const L = 500;
const R = 1100;
const GATE_L = 750;
const GATE_R = 850;
const KEEP_L = 708;
const KEEP_R = 892;
const STOREY = 32;

export interface CastleLook {
  /** The walls' level: their material. */
  walls: number;
  /** The castle's average level: the keep's storeys. */
  keep: number;
  /** The watchtower's level: how many towers, and from 50 their beacons. */
  towers: number;
  /** The edict in force, flown on the keep; null flies plain cloth. */
  banner: 'harvest' | 'vigor' | 'fortune' | null;
  /** The walls' integrity, 0 to 100. */
  integrity: number;
  /** Besieged in the last hours. */
  besieged: boolean;
}

export const storeysAt = (keep: number) => (keep >= 30 ? 4 : keep >= 15 ? 3 : keep >= 5 ? 2 : 1);
export const towersAt = (watch: number): number[] =>
  watch >= 30 ? [L, 624, 976, R] : watch >= 15 ? [L, 624, R] : watch >= 5 ? [L, R] : [];

const wallHeight = (b: Build, walls: number) => (b.timber ? 62 : walls >= 30 ? 84 : 76);

/** A crack down a wall from (x, y): a jagged line in ink. */
const crack = (x: number, y: number) => `M${x} ${y} l-6 10 l8 8 l-5 12 l7 9`;
const CRACKS: [number, number][] = [
  [566, 22],
  [1036, 30],
  [690, 16],
  [910, 26],
];

/** Where things are: the parts the castle draws and the lit and moving parts the scene adds over it. */
function layout(look: CastleLook) {
  const b = buildAt(look.walls);
  const top = B - wallHeight(b, look.walls);
  const storeys = storeysAt(look.keep);
  const keepTop = top - 10 - storeys * STOREY;
  const towers = towersAt(look.towers).map((x) => {
    const corner = x === L || x === R;
    return { x, w: corner ? 78 : 64, top: top - (corner ? 48 : 30), beacon: corner && look.towers >= 50 };
  });
  const damage = 100 - Math.max(0, Math.min(100, look.integrity));
  // The keep's windows, a pair to a storey, those the gatehouse hides left out; one over the gate.
  const windows = [
    ...Array.from({ length: storeys }, (_, i) => keepTop + 12 + i * STOREY)
      .filter((y) => y + 16 < top - 52)
      .flatMap((y) => [
        [762, y],
        [826, y],
      ]),
    [794, top - 22],
  ] as [number, number][];
  // Under siege, fires on the walls either side of the gate.
  const fires = look.besieged ? [692, 1032].map((x) => ({ x, base: top })) : [];
  return { b, top, storeys, keepTop, towers, damage, windows, fires };
}

function Castle({ look }: { look: CastleLook }) {
  const { b, top, storeys, keepTop, towers, damage } = layout(look);
  const breached = damage > 20;
  const gateTop = top - 34;
  const arch = `M${GATE_L + 22} ${B} L${GATE_L + 22} ${B - 40} A28 28 0 0 1 ${GATE_R - 22} ${B - 40} L${GATE_R - 22} ${B} Z`;
  return (
    <g className={c.castle}>
      {/* The keep, behind the curtain wall: its storeys marked by a course of stone. */}
      <Block l={KEEP_L} r={KEEP_R} top={keepTop} base={top + 4} t={b.wall} />
      {Array.from({ length: storeys - 1 }, (_, i) => (
        <line
          key={i}
          className={c.course}
          x1={KEEP_L}
          x2={KEEP_R}
          y1={keepTop + (i + 1) * STOREY}
          y2={keepTop + (i + 1) * STOREY}
        />
      ))}
      <Crown l={KEEP_L} r={KEEP_R} top={keepTop} b={b} />
      <FlagPole x={800} top={keepTop - 16} />
      {/* The curtain wall either side of the gate, its merlons broken where it is breached. */}
      <Block l={L} r={GATE_L} top={top} base={B} t={b.wall} />
      <Block l={GATE_R} r={R} top={top} base={B} t={b.wall} />
      <Crown l={L} r={GATE_L} top={top} b={b} gone={breached ? (damage > 50 ? [2, 3, 5] : [3]) : []} />
      <Crown l={GATE_R} r={R} top={top} b={b} gone={breached ? (damage > 50 ? [1, 4, 5] : [5]) : []} />
      {CRACKS.slice(0, Math.min(4, Math.ceil(damage / 15))).map(([x, dy]) => (
        <path key={x} className={c.crack} d={crack(x, top + dy)} />
      ))}
      {/* The gatehouse: its arch dark, a portcullis in stone, plank doors in timber. */}
      <Block l={GATE_L} r={GATE_R} top={gateTop} base={B} t={b.wall} />
      <Crown l={GATE_L} r={GATE_R} top={gateTop} b={b} />
      <path d={arch} fill="#2a2320" stroke={INK} strokeWidth={3} />
      {b.timber ? (
        <path className={c.planks} d={`M786 ${B} V${B - 50} M800 ${B} V${B - 54} M814 ${B} V${B - 50}`} />
      ) : (
        <path
          className={c.portcullis}
          d={`M784 ${B - 6} V${B - 44} M800 ${B - 6} V${B - 54} M816 ${B - 6} V${B - 44} M776 ${B - 34} H824 M776 ${B - 18} H824`}
        />
      )}
      {towers.map((t) => (
        <Tower key={t.x} x={t.x} w={t.w} top={t.top} base={B + 4} b={b} beacon={t.beacon} />
      ))}
      {breached && (
        <>
          <Rubble x={640} base={B + 8} t={b.wall} />
          {damage > 50 && <Rubble x={1010} base={B + 8} t={b.wall} />}
        </>
      )}
    </g>
  );
}

/** A siege camp in the field: two tents under the foe's red. */
const FIELD = 456;
function Camp() {
  const tent = (x: number, w: number, h: number) => (
    <g key={x}>
      <path className={c.tent} d={`M${x - w / 2} ${FIELD} L${x} ${FIELD - h} L${x + w / 2} ${FIELD} Z`} />
      <path className={c.tentLit} d={`M${x - w / 2} ${FIELD} L${x} ${FIELD - h} L${x - 4} ${FIELD} Z`} />
      <path
        className={s.ink}
        d={`M${x - w / 2} ${FIELD} L${x} ${FIELD - h} L${x + w / 2} ${FIELD} Z M${x} ${FIELD} V${FIELD - h * 0.45}`}
      />
      <line x1={x} y1={FIELD - h} x2={x} y2={FIELD - h - 30} stroke={INK} strokeWidth={3} />
      <path className={c.foe} d={`M${x} ${FIELD - h - 30} h22 l-6 8 l6 8 h-22 Z`} />
    </g>
  );
  return <g>{[tent(352, 60, 42), tent(414, 48, 34)]}</g>;
}

/** What moves, in a layer of its own: clouds, the banner, beacon fires, and under siege, fires on the
 *  walls and their smoke. Nothing moves when the player asks for reduced motion. */
function Moving({ look, fit, box }: { look: CastleLook; fit: string; box: string }) {
  const { keepTop, towers, fires } = layout(look);
  return (
    <svg className={s.moving} viewBox={box} preserveAspectRatio={fit} focusable="false">
      <path className={`${s.cloud} ${s.cloudSlow}`} d={cloud(0, 64, 0.8)} />
      <path className={`${s.cloud} ${s.cloudFast}`} d={cloud(0, 140, 0.55)} />
      <g className={c.castle}>
        <FlagCloth x={800} top={keepTop - 16} t={BANNERS[look.banner ?? 'none']} className={c.flag} />
      </g>
      {towers
        .filter((t) => t.beacon)
        .map((t) => (
          <g key={t.x}>
            <Flame x={t.x} base={t.top - 20} h={30} className={c.flicker} />
          </g>
        ))}
      {fires.map((f, i) => (
        <g key={f.x}>
          <Flame x={f.x} base={f.base + 2} h={40} className={c.flicker} />
          {[0, 1, 2, 3, 4].map((k) => (
            <circle
              key={k}
              className={`${c.smoke} ${s.puff}`}
              cx={f.x}
              cy={f.base - 36}
              r={8}
              style={{ animationDelay: `${(k + i * 0.5) * -1.6}s` }}
            />
          ))}
        </g>
      ))}
      {/* At rest (reduced motion), the smoke still hangs over a besieged castle. */}
      {fires.map((f) => (
        <path key={`still${f.x}`} className={`${c.smoke} ${c.stillSmoke}`} d={cloud(f.x - 70, f.base - 50, 0.5)} />
      ))}
    </svg>
  );
}

/** The band the castle needs, from its banner's tip to the foot of its walls (y 140 to 460). */
const BAND = 320;

/** The scene's width in view: as much of the march as the frame's shape lets the castle's band fit, so
 *  on a phone's narrow banner the castle is drawn larger and on a wide one the whole march shows. */
function useFrame(): [RefObject<HTMLDivElement | null>, string] {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(W);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setWide(Math.round(Math.min(W, Math.max(1000, (BAND * width) / height))));
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  return [ref, `${(W - wide) / 2} 0 ${wide} ${H}`];
}

/** The castle banner: `look` as the lord has raised it, cropped to the castle's band. */
export function CastleScene({ className, look }: { className?: string; look: CastleLook }) {
  const stars = seeded(19);
  const fit = 'xMidYMid slice';
  const [ref, box] = useFrame();
  const { windows, towers, fires } = layout(look);
  return (
    <div ref={ref} className={`${s.wrap} ${c.wrap} ${className ?? ''}`} aria-hidden="true">
      <svg className={s.scene} viewBox={box} preserveAspectRatio={fit} focusable="false">
        <defs>
          <linearGradient id="castle-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.skyTop} />
            <stop offset="0.55" className={s.skyLow} />
            <stop offset="0.75" className={s.skyHorizon} />
          </linearGradient>
          {/* Night on the castle: each channel dimmed, blue least, so its stone goes cold under the moon. */}
          <filter id="castle-night" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.38" />
              <feFuncG type="linear" slope="0.42" />
              <feFuncB type="linear" slope="0.52" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect fill="url(#castle-sky)" width={W} height={H} />
        <g className={s.stars}>
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={stars() * W} cy={stars() * 240} r={0.8 + stars() * 1.4} />
          ))}
        </g>
        <circle className={s.halo} cx={1300} cy={174} r={54} />
        <circle className={s.orb} cx={1300} cy={174} r={30} />
        <Mountains />
        <path className={s.range} d={hillPath(nearRange, H)} />
        <path className={s.hillFar} d={hillPath(farHill, H)} />
        <FarForest y={farHill} count={150} seed={5} size={24} />
        {/* The mound the castle stands on, lit on its left. */}
        <path
          className={s.hillMid}
          d={`M250,600 C360,500 430,${B} 520,${B} L1080,${B} C1170,${B} 1240,500 1350,600 Z`}
        />
        <path className={c.moundLit} d={`M250,600 C360,500 430,${B} 520,${B} L560,${B} C470,470 420,530 380,600 Z`} />
        <Castle look={look} />
        {windows.map(([x, y]) => (
          <path key={`${x},${y}`} className={s.window} d={`M${x} ${y + 16} V${y + 5} a6 6 0 0 1 12 0 V${y + 16} Z`} />
        ))}
        {/* The fires' glow, still: drawn here, not in the layer that moves, so it is painted once. */}
        {towers
          .filter((t) => t.beacon)
          .map((t) => (
            <circle key={t.x} className={c.glow} cx={t.x} cy={t.top - 34} r={34} />
          ))}
        {fires.map((f) => (
          <circle key={f.x} className={c.glow} cx={f.x} cy={f.base - 12} r={40} />
        ))}
        {/* The road up to the gate, the field before it. */}
        <path className={s.road} d={`M690,600 C740,540 776,500 784,${B} L816,${B} C826,500 860,540 930,600 Z`} />
        <path
          className={s.ground}
          d="M0,600 L0,500 C160,488 300,500 420,524 C520,544 640,560 700,600 Z M920,600 C1000,560 1120,540 1240,526 C1380,508 1500,502 1600,506 L1600,600 Z"
        />
        {look.besieged && <Camp />}
        <Pine x={110} base={606} h={430} />
        <Pine x={292} base={598} h={270} />
        <Pine x={1312} base={598} h={280} />
        <Pine x={1496} base={606} h={440} />
      </svg>
      <Moving look={look} fit={fit} box={box} />
    </div>
  );
}
