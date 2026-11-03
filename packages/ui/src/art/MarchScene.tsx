// The region's scene: the march at the edge of the old kingdom, seen from the road. Far mountains
// with snow, wooded hills, the old road winding up to a forge whose chimney smokes, a waystone, and
// tall pines framing it all. Drawn in the icon style at landscape scale (ART.md, The region's
// scene): flat tones, light from the upper left, ink only on what is near. Its colours are CSS
// variables (MarchScene.module.css), so by day it is a cool morning and in the dark theme it is
// night, with stars, a moon and the forge glowing.
import {
  cloud,
  FarForest,
  farHill,
  H,
  hillPath,
  midHill,
  Mountains,
  nearRange,
  Pine,
  poly,
  seeded,
  W,
} from './landscape.tsx';
import s from './MarchScene.module.css';
import { Works } from './Works.tsx';

/** The forge on the far hill: stone walls, a dark roof, a smoking chimney and a glowing door. */
function Forge() {
  return (
    <g>
      <circle className={s.glow} cx={1108} cy={404} r={46} />
      <polygon
        className={s.roof}
        points={poly([
          [1060, 382],
          [1100, 352],
          [1150, 352],
          [1170, 382],
        ])}
      />
      <polygon
        className={s.roofLit}
        points={poly([
          [1060, 382],
          [1100, 352],
          [1112, 352],
          [1076, 382],
        ])}
      />
      <rect className={s.wall} x={1066} y={382} width={98} height={36} />
      <rect className={s.wallShade} x={1132} y={382} width={32} height={36} />
      <rect className={s.chimney} x={1138} y={334} width={12} height={26} />
      <rect className={s.fireDoor} x={1100} y={396} width={14} height={22} />
      <rect className={s.window} x={1078} y={392} width={10} height={9} />
      <rect className={s.window} x={1146} y={392} width={10} height={9} />
      <polygon
        className={s.ink}
        points={poly([
          [1060, 382],
          [1100, 352],
          [1150, 352],
          [1170, 382],
          [1164, 382],
          [1164, 418],
          [1066, 418],
          [1066, 382],
        ])}
      />
      {[
        [1145, 326, 5],
        [1141, 316, 6.5],
        [1134, 304, 8],
        [1124, 290, 9.5],
        [1110, 274, 11],
        [1092, 258, 12],
      ].map(([cx, cy, r], i) => (
        <circle
          key={i}
          className={`${s.smoke} ${s.stillSmoke}`}
          cx={cx}
          cy={cy}
          r={r}
          style={{ opacity: 0.6 - i * 0.09 }}
        />
      ))}
    </g>
  );
}

/** What moves, drawn over the still scene in a layer of its own, so its few small shapes are all the
 *  page repaints: smoke rising from the forge, two clouds crossing the sky, now and then birds.
 *  Nothing moves when the player asks for reduced motion. */
function Moving({ fit }: { fit: string }) {
  return (
    <svg className={s.moving} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={fit} focusable="false">
      <path className={`${s.cloud} ${s.cloudSlow}`} d={cloud(0, 70, 0.9)} />
      <path className={`${s.cloud} ${s.cloudFast}`} d={cloud(0, 150, 0.6)} />
      <g className={s.birds}>
        <path d="M0,0 q7,-6 13,0 q6,-6 13,0" />
        <path d="M22,-14 q6,-5 11,0 q5,-5 11,0" />
        <path d="M40,6 q5,-4 9,0 q4,-4 9,0" />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          className={`${s.smoke} ${s.puff}`}
          cx={1144}
          cy={326}
          r={5}
          style={{ animationDelay: `${i * -1.5}s` }}
        />
      ))}
    </svg>
  );
}

/** `ground` keeps the foreground when the scene is cropped (a backdrop); `middle` keeps the
 *  mountains, the forest and the forge (a banner). `works`: the steading's works raised, by stage, drawn
 *  on the hill beside the forge (the Hearth's banner). */
export function MarchScene({
  className,
  keep = 'ground',
  works,
  night,
}: {
  className?: string;
  keep?: 'ground' | 'middle';
  works?: Record<string, number>;
  /** Night whatever the theme (a profile's scene, session 43). */
  night?: boolean;
}) {
  const stars = seeded(7);
  const fit = keep === 'ground' ? 'xMidYMax slice' : 'xMidYMid slice';
  return (
    <div className={`${s.wrap} ${className ?? ''}`} data-night={night || undefined} aria-hidden="true">
      <svg className={s.scene} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={fit} focusable="false">
        {/* The one gradient: a sky this wide needs it, and nothing here is seen at 24 px. */}
        <defs>
          <linearGradient id="march-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.skyTop} />
            <stop offset="0.55" className={s.skyLow} />
            <stop offset="0.75" className={s.skyHorizon} />
          </linearGradient>
        </defs>
        <rect fill="url(#march-sky)" width={W} height={H} />
        <g className={s.stars}>
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={stars() * W} cy={stars() * 240} r={0.8 + stars() * 1.4} />
          ))}
        </g>
        <circle className={s.halo} cx={1110} cy={112} r={58} />
        <circle className={s.orb} cx={1110} cy={112} r={34} />
        <Mountains />
        <path className={s.range} d={hillPath(nearRange, H)} />
        <path className={s.hillFar} d={hillPath(farHill, H)} />
        <FarForest y={farHill} count={150} seed={3} size={26} />
        <path className={s.hillMid} d={hillPath(midHill, H)} />
        <FarForest y={midHill} count={70} seed={11} size={44} />
        <Forge />
        {works && <Works stages={works} />}
        {/* The old road, from the viewer up to the forge. */}
        <path
          className={s.road}
          d="M640,600 C720,540 780,500 930,470 C1010,452 1060,440 1096,420 L1112,420 C1086,446 1040,466 960,492 C850,528 840,560 900,600 Z"
        />
        <path
          className={s.ground}
          d="M0,600 L0,520 C200,498 420,506 600,530 C760,552 980,548 1160,522 C1340,498 1480,500 1600,512 L1600,600 Z"
        />
        <path className={s.road} d="M640,600 C700,560 760,540 840,532 L870,532 C850,548 840,570 900,600 Z" />
        {/* The waystone by the road. */}
        <polygon
          className={s.stone}
          points={poly([
            [560, 548],
            [566, 498],
            [578, 490],
            [590, 500],
            [594, 548],
          ])}
        />
        <polygon
          className={s.stoneLit}
          points={poly([
            [560, 548],
            [566, 498],
            [578, 490],
            [574, 548],
          ])}
        />
        <polygon
          className={s.ink}
          points={poly([
            [560, 548],
            [566, 498],
            [578, 490],
            [590, 500],
            [594, 548],
          ])}
        />
        {/* Grass in the foreground, a shade deeper than the ground. */}
        <path className={s.grass} d="M0,600 L0,560 C240,548 420,566 560,584 C620,592 640,598 650,600 Z" />
        <path className={s.grass} d="M930,600 C1040,580 1220,560 1400,556 C1500,554 1560,558 1600,562 L1600,600 Z" />
        <Pine x={60} base={604} h={460} />
        <Pine x={190} base={596} h={330} />
        <Pine x={350} base={604} h={420} />
        <Pine x={452} base={594} h={250} />
        <Pine x={1236} base={598} h={300} />
        <Pine x={1318} base={606} h={440} />
        <Pine x={1460} base={600} h={360} />
        <Pine x={1570} base={606} h={480} />
      </svg>
      <Moving fit={fit} />
    </div>
  );
}
