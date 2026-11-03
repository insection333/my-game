// The garrison's three units (session 41; ART.md, The castle's works and garrison), each drawn at its
// four evolutions so a unit's stage reads before its name: the vanguard a shield before a polearm, the
// outriders a horse's head before a lance, the siege train its engine. Each stage is a step up in
// metal and finish, as gear's tiers are: wood and iron, then iron, then gold, then dawnsteel.
import { circle, ellipse, Glint, INK, M, Shape, type Tone } from './style.tsx';

/** A stage's materials: the shield or plate, the shaft, and the trim. */
const STAGES: readonly { plate: Tone; shaft: Tone; trim: Tone }[] = [
  { plate: M.oak, shaft: M.ash, trim: M.iron },
  { plate: M.iron, shaft: M.oak, trim: M.steel },
  { plate: M.amber, shaft: M.oak, trim: M.bronze },
  { plate: M.dawnsteel, shaft: M.silverWood, trim: M.moonstone },
];
const at = (stage: number) => STAGES[Math.max(0, Math.min(3, stage))];

/** A shaft on the rising diagonal, from the lower left to (x, y). */
function Shaft({ x, y, t }: { x: number; y: number; t: Tone }) {
  return (
    <g transform={`rotate(${(Math.atan2(y - 44, x - 8) * 180) / Math.PI + 90} 8 44)`}>
      <Shape d={`M6.6 44 H9.4 V${44 - Math.hypot(x - 8, y - 44)} H6.6 Z`} tone={t} lit="M6.6 -20 H7.6 V48 H6.6 Z" />
    </g>
  );
}

/** The gilded rim the later shields wear. */
const SHIELD_RIM =
  'M11 15.4 C11 12.6 14.4 11 20 11 C25.6 11 29 12.6 29 15.4 V33 C29 37.8 25 41.2 20 42.9 C15 41.2 11 37.8 11 33 Z';

export function Vanguard({ stage }: { stage: number }) {
  const s = at(stage);
  const shield = 'M9 15 C9 11 13 9 20 9 C27 9 31 11 31 15 V33 C31 39 26 43 20 45 C14 43 9 39 9 33 Z';
  return (
    <g>
      <Shaft x={39} y={9} t={s.shaft} />
      {stage === 0 ? (
        // A levy's spear: a leaf of iron.
        <Shape
          d="M43 3 C42 7.5 39.5 11 35.6 12.4 C35.2 8.6 38.4 4.8 43 3 Z"
          tone={s.trim}
          lit="M35.6 12.4 C35.2 8.6 38.4 4.8 43 3 C39.4 6 37 9 35.6 12.4 Z"
        />
      ) : (
        // A halberd's head: a spike, and an axe's blade swept back.
        <>
          <Shape d="M38 10 L44 3 L40.5 12 Z" tone={s.trim} lit="M38 10 L44 3 L39.2 10.8 Z" />
          <Shape
            d="M35 11 C33 7 33.5 3.5 36.5 2 L41 7 L37.5 13.5 Z"
            tone={s.trim}
            lit="M35 11 C33 7 33.5 3.5 36.5 2 L37.6 3.2 C35.6 5 35.4 8 36.6 11.6 Z"
          >
            <Glint x={35.6} y={5} r={1} />
          </Shape>
        </>
      )}
      <Shape
        d={shield}
        tone={s.plate}
        lit="M9 15 C9 11 13 9 20 9 C16 10.5 13.5 12.5 13.5 16 V34 C13.5 38 15.5 41.5 18 44 C13 42 9 38.5 9 33 Z"
        shade="M31 15 C31 11 27 9 20 9 C24 10.5 26.5 12.5 26.5 16 V34 C26.5 38 24.5 41.5 22 44 C27 42 31 38.5 31 33 Z"
      >
        {stage === 0 && (
          <path d="M14.5 10 V44 M20 9 V45 M25.5 10 V44" stroke={s.plate.shadow} strokeWidth={1} opacity={0.8} />
        )}
        {stage === 1 &&
          [13, 27].flatMap((x) => [14, 34].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.2} fill={INK} />))}
        {stage >= 2 && <path d={SHIELD_RIM} fill="none" stroke={s.trim.base} strokeWidth={2} />}
      </Shape>
      {stage === 2 ? (
        // The sun the phalanx is forged under.
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="M20 17.6 L21.2 20.8 L18.8 20.8 Z"
              transform={`rotate(${i * 45} 20 25)`}
              fill={M.flame.base}
              stroke={INK}
              strokeWidth={0.9}
              strokeLinejoin="round"
            />
          ))}
          <Shape d={circle(20, 25, 4)} tone={M.flame} lit={circle(19, 24, 2.2)} />
        </g>
      ) : (
        <Shape
          d={circle(20, 25, stage === 3 ? 4.6 : 4)}
          tone={stage === 3 ? M.moonstone : s.trim}
          lit={circle(18.8, 23.8, 2.2)}
        >
          <Glint x={18.6} y={23.4} r={1.1} />
        </Shape>
      )}
    </g>
  );
}

/** The outriders' horses, by stage: a bay, a chestnut, a black and a grey. */
const COATS: readonly { coat: Tone; mane: Tone }[] = [
  { coat: M.eagle, mane: M.bark },
  { coat: M.oakWood, mane: M.oakBark },
  { coat: M.obsidian, mane: M.amethyst },
  { coat: M.wight, mane: M.sapphire },
];

export function Outriders({ stage }: { stage: number }) {
  const s = at(stage);
  const { coat, mane } = COATS[Math.max(0, Math.min(3, stage))];
  const head =
    'M10 46 C10 34 12.5 24 18 17 L19 9.5 L23 14 C27.5 13 31.5 15 34.5 19 L40.5 28 C42 30.6 40.6 33.4 37.6 33 L32 31.4 C29.6 33.6 28 37.4 28 41.5 V46 Z';
  return (
    <g>
      {/* The lance, upright at the horse's shoulder, its pennon in the realm's red. */}
      <Shape d="M3.6 46 H6.4 V9 H3.6 Z" tone={s.shaft} lit="M3.6 46 H4.6 V9 H3.6 Z" />
      <Shape d="M5 1 L7.4 9.4 H2.6 Z" tone={s.trim} lit="M5 1 L2.6 9.4 H4.4 Z" />
      {stage >= 1 && (
        <Shape
          d="M6.4 10 L16 11.6 L12.6 14 L16 16.6 L6.4 17.4 Z"
          tone={M.banner}
          lit="M6.4 10 L16 11.6 L12.6 14 L6.4 13.4 Z"
        />
      )}
      <Shape
        d={head}
        tone={coat}
        lit="M10 46 C10 34 12.5 24 18 17 L19 9.5 L20.2 10.9 L20 18 C15.5 25 14 35 14.5 46 Z"
        shade="M32 31.4 C29.6 33.6 28 37.4 28 41.5 V46 H24 C24 38 26 33 30 29.6 Z"
      >
        <path d={`M37.5 30 a1.1 1.1 0 1 0 0.01 0`} fill={INK} />
      </Shape>
      {/* The mane down the neck's crest. */}
      <Shape
        d="M18 17 C14 22 11.5 30 11 40 L8 41 C8.4 31 10.6 22 15.4 15.4 Z"
        tone={mane}
        lit="M15.4 15.4 C11 22 9 30 8.6 40 L8 41 C8.4 31 10.6 22 15.4 15.4 Z"
      />
      {stage === 0 ? (
        // A scout's bridle.
        <path
          d="M22 15.5 L33 26 M24.5 17.2 C27 21 30.5 23.5 34 24.6"
          fill="none"
          stroke={M.leather.shadow}
          strokeWidth={1.6}
        />
      ) : (
        // A chanfron of plate down the face, and from the grey's, a plume.
        <Shape
          d="M22.5 14.2 C26.5 14 30 15.8 33 19.4 L37.8 26.6 L34.2 28 L25 19.8 Z"
          tone={s.plate}
          lit="M22.5 14.2 C26.5 14 29.5 15.6 31.5 18 L25 19.8 Z"
        >
          <Glint x={26.5} y={16} r={1} />
        </Shape>
      )}
      <circle cx={27.4} cy={20.8} r={1.5} fill={INK} />
      {stage === 3 && (
        <Shape
          d="M19 9.5 C17 5 19 2 23 2 C21.6 4.6 22 7 23 9.6 Z"
          tone={M.sapphire}
          lit="M19 9.5 C17 5 19 2 21 2.6 C20 5 20 7.4 21 9.6 Z"
        />
      )}
    </g>
  );
}

/** A wheel on its axle. */
const Wheel = ({ x, y, r, t }: { x: number; y: number; r: number; t: Tone }) => (
  <Shape d={circle(x, y, r)} tone={t} lit={circle(x - r * 0.3, y - r * 0.3, r * 0.55)}>
    <path d={`M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}`} stroke={t.shadow} strokeWidth={1.2} />
    <circle cx={x} cy={y} r={r * 0.28} fill={INK} />
  </Shape>
);

export function Siege({ stage }: { stage: number }) {
  if (stage === 0) {
    // A timber trebuchet: its frame, the throwing arm cocked, the counterweight and the stone in its sling.
    return (
      <g>
        <Shape
          d="M8 42 L20 14 L23 14 L15 42 Z M36 42 L24 14 L21 14 L29 42 Z"
          tone={M.oak}
          lit="M8 42 L20 14 L21.4 14 L10.4 42 Z"
        />
        <Shape d="M5 41 H39 V45 H5 Z" tone={M.oak} lit="M5 41 H39 V42.4 H5 Z" />
        <Shape d="M10 29 L42 6 L43.6 8.4 L11.6 31.4 Z" tone={M.ash} lit="M10 29 L42 6 L42.6 6.9 L10.6 29.9 Z" />
        <Shape d="M7 28 H15 V36 H7 Z" tone={M.stone} lit="M7 28 H9.2 V36 H7 Z" />
        <path d="M43 7 C44 11 43 14 40.5 15.5" fill="none" stroke={M.leather.shadow} strokeWidth={1.4} />
        <Shape d={circle(39.5, 17, 3)} tone={M.stone} lit={circle(38.6, 16.1, 1.6)} />
        <Shape d={circle(21.5, 18.5, 2.2)} tone={M.iron} />
      </g>
    );
  }
  if (stage === 3) {
    // The arcane conflux engine: a great crystal held in dawnsteel prongs on its carriage.
    return (
      <g>
        <ellipse cx={24} cy={19} rx={13} ry={13} fill={M.amethyst.light} opacity={0.35} />
        <Shape d="M15 33 H33 L36 38 H12 Z" tone={M.dawnsteel} lit="M15 33 H33 L33.6 34.6 H14.2 Z" />
        <Shape d="M16 33 L13 20 L18 26 Z M32 33 L35 20 L30 26 Z" tone={M.dawnsteel} lit="M16 33 L13 20 L14.6 21.8 Z" />
        <Shape
          d="M24 6 L31 17 L27 31 L21 31 L17 17 Z"
          tone={M.amethyst}
          lit="M24 6 L17 17 L21 31 L22.6 31 L20.4 17 Z"
          shade="M24 6 L31 17 L27 31 L25.6 31 L28 17 Z"
        >
          <Glint x={21} y={14} r={1.3} />
        </Shape>
        <Wheel x={15} y={40} r={5} t={M.silverWood} />
        <Wheel x={33} y={40} r={5} t={M.silverWood} />
      </g>
    );
  }
  // A bombard: an iron barrel on a wooden carriage; the hellcannon's in embersteel, banded in gold, and lit.
  const barrel = stage === 2 ? M.embersteel : M.iron;
  const band = stage === 2 ? M.amber : M.steel;
  return (
    <g>
      {stage === 2 && (
        <Shape
          d="M41 8 C46 10 46.5 15 43 18.5 C44 15 42 12.5 39.5 12 Z"
          tone={M.flame}
          lit="M41 8 C44 9.6 45 12 44.4 14 C43.4 11.6 42 10.6 39.5 12 Z"
        />
      )}
      <Shape d="M6 39 L26 33 L30 39 L10 45 Z" tone={M.oak} lit="M6 39 L26 33 L26.8 34.2 L6.8 40.2 Z" />
      <g transform="rotate(-30 22 28)">
        <Shape
          d="M8 22 C8 19.5 10 18.5 12 18.5 H36 V31.5 H12 C10 31.5 8 30.5 8 28 Z"
          tone={barrel}
          lit="M8 22 C8 19.5 10 18.5 12 18.5 H36 V21.4 H12 C10.6 21.4 9.4 22 8 23.4 Z"
          shade="M8 27.4 C9.4 28.6 10.6 29 12 29 H36 V31.5 H12 C10 31.5 8 30.5 8 28 Z"
        >
          <Glint x={18} y={20.4} r={1.1} />
        </Shape>
        {[16, 26].map((x) => (
          <Shape
            key={x}
            d={`M${x} 17.4 H${x + 3} V32.6 H${x} Z`}
            tone={band}
            lit={`M${x} 17.4 H${x + 1} V32.6 H${x} Z`}
          />
        ))}
        <Shape d="M35 16.5 H40 V33.5 H35 Z" tone={band} lit="M35 16.5 H36.4 V33.5 H35 Z" />
        <path d={ellipse(40, 25, 1.4, 5.4)} fill={INK} />
      </g>
      <Wheel x={22} y={39} r={6.5} t={M.oak} />
    </g>
  );
}
