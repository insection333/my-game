// Cooking's finds (session 13), drawn as the other finds are (ART.md): a cook's treasures, from wild herbs
// to a cauldron of plenty.
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';
import { W } from './finds-fishing.tsx';

export function WildHerbs() {
  const sprigs = ['M24 40 C22 30 15 22 9 16', 'M24 40 C24 28 24 18 23 8', 'M24 40 C27 30 33 22 40 17'];
  return (
    <g>
      {sprigs.map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          <path d={d} fill="none" stroke={W.herb.shadow} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      ))}
      {[
        [10, 15, -40],
        [14, 21, -35],
        [19, 27, -30],
        [23, 9, 0],
        [24, 16, 10],
        [22, 23, -10],
        [38, 17, 40],
        [33, 21, 35],
        [29, 27, 30],
      ].map(([x, y, r]) => (
        <Shape key={`${x},${y}`} d={ellipse(x, y, 4.2, 2.3)} tone={W.herb} lit={ellipse(x - 1, y - 0.8, 2.2, 1)}>
          <path
            d={`M${x - 3.5} ${y} L${x + 3.5} ${y}`}
            stroke={W.herb.shadow}
            strokeWidth={0.7}
            transform={`rotate(${r} ${x} ${y})`}
          />
        </Shape>
      ))}
      <Shape d="M19 34 L29 34 L28 39 L20 39 Z" tone={M.straw} lit="M19 34 L24 34 L23 39 L20 39 Z" />
    </g>
  );
}

export function SaffronThreads() {
  const threads = [
    'M20 19 C19 14 17 11 14 8',
    'M23 18 C23 13 23 9 22 5',
    'M26 18 C27 13 29 10 32 7',
    'M29 19 C31 15 34 13 37 12',
  ];
  return (
    <g>
      {/* The threads standing up out of the sack's open neck. */}
      {threads.map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
          <path d={d} fill="none" stroke={W.saffron.base} strokeWidth={1.3} strokeLinecap="round" />
        </g>
      ))}
      <Shape
        d="M17 19 C13 24 8 29 8 35 C8 41 14 44 24 44 C34 44 40 41 40 35 C40 29 35 24 31 19 Z"
        tone={W.cloth}
        lit="M17 19 C13 24 8 29 8 35 C8 39 11 42 15.5 43.2 C13 38 13.5 30 18.5 21 Z"
        shade="M40 35 C40 41 34 44 24 44 C31 42 35.5 38 35.5 31 C35.5 27 33.5 23 31 19 C35 24 40 29 40 35 Z"
      >
        <path d="M14 32 C20 34 28 34 35 31" fill="none" stroke={W.cloth.shadow} strokeWidth={1.1} opacity={0.7} />
      </Shape>
      {/* The tie round the neck. */}
      <Shape
        d="M15.5 18 L32.5 18 L31.5 22 L16.5 22 Z"
        tone={W.saffron}
        lit="M15.5 18 L32.5 18 L32.2 19.4 L15.8 19.4 Z"
      />
      {['M6 41 C8 39 10 38.5 13 38.5', 'M37 39.5 C39 38 41 37.8 44 38.5'].map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <path d={d} fill="none" stroke={W.saffron.base} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

export function GrandmothersRecipe() {
  return (
    <g>
      <Shape
        d="M9 8 L36 6 L40 40 L12 42 Z"
        tone={W.paper}
        lit="M9 8 L36 6 L36.5 10 L10 12 Z"
        shade="M40 40 L12 42 L11.7 38 L39.5 36 Z"
      >
        {[16, 21, 26, 31].map((y, i) => (
          <path
            key={y}
            d={`M14 ${y + 1} C${20} ${y} ${26} ${y + 0.5} ${i === 3 ? 26 : 34} ${y - 0.5}`}
            fill="none"
            stroke={W.cloth.shadow}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        ))}
        <path d="M24 6 L26 41" stroke={W.paper.shadow} strokeWidth={0.9} opacity={0.6} />
      </Shape>
      <Shape d={circle(33, 36, 5.2)} tone={M.wax} lit={circle(31.8, 34.8, 2.8)}>
        <path d="M30.5 36 L35.5 36 M33 33.5 L33 38.5" stroke={M.wax.shadow} strokeWidth={1.1} />
      </Shape>
    </g>
  );
}

export function SilverLadle() {
  return (
    <g>
      <path d="M22 22 L42 4" stroke={INK} strokeWidth={5.2} strokeLinecap="round" />
      <path d="M22 22 L42 4" stroke={W.silver.base} strokeWidth={3} strokeLinecap="round" />
      <path d="M23.5 19.5 L40.5 4.2" stroke={W.silver.light} strokeWidth={1} strokeLinecap="round" />
      <Shape
        d="M6 26 C6 36 12 42 20 42 C28 42 33 36 33 28 C33 25 31 23 28 23 L10 23 C7.5 23 6 24 6 26 Z"
        tone={W.silver}
        lit="M6 26 C6 33 9 39 14 41 C11 36 10.5 30 11.5 23 L10 23 C7.5 23 6 24 6 26 Z"
        shade="M33 28 C33 36 28 42 20 42 C26 39 29 34 29 27 C29 25 28.5 24 28 23 C31 23 33 25 33 28 Z"
      >
        <path d={ellipse(19.5, 25.5, 12, 3)} fill={W.silver.shadow} opacity={0.6} />
        <Glint x={11} y={31} r={1.4} />
      </Shape>
    </g>
  );
}

export function EverWarmPot() {
  return (
    <g>
      {/* Steam curling up. */}
      {['M17 15 C14 11 19 9 16 5', 'M25 14 C22 10 27 8 24 3', 'M33 15 C30 11 35 9 32 5'].map((d) => (
        <path key={d} d={d} fill="none" stroke={M.wisp.base} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      ))}
      <Shape
        d="M8 20 L40 20 L38 36 C37 40 32 42 24 42 C16 42 11 40 10 36 Z"
        tone={W.pot}
        lit="M8 20 L16 20 L15.5 40.5 C12.5 39.5 10.5 38 10 36 Z"
        shade="M40 20 L38 36 C37 40 32 42 28 42 C31.5 39 32.5 30 33 20 Z"
      >
        {/* The glow of the coals in it, through the iron. */}
        <path
          d="M12 34 C18 37 30 37 36 34 L35.5 37 C34 40 30 41 24 41 C18 41 14 40 12.5 37 Z"
          fill={M.flame.shadow}
          opacity={0.9}
        />
      </Shape>
      <Shape d={ellipse(24, 20, 17, 4)} tone={W.broth} lit={ellipse(19, 19, 8, 1.8)}>
        <Glint x={13} y={19.4} r={1} />
      </Shape>
      {[6, 42].map((x) => (
        <path
          key={x}
          d={`M${x} 22 C${x === 6 ? 2 : 46} 22 ${x === 6 ? 2 : 46} 28 ${x === 6 ? 8.5 : 39.5} 28`}
          fill="none"
          stroke={INK}
          strokeWidth={2.4}
        />
      ))}
    </g>
  );
}

export function CauldronOfPlenty() {
  return (
    <g>
      <Shape
        d="M5 20 C3 34 11 44 24 44 C37 44 45 34 43 20 Z"
        tone={W.pot}
        lit="M5 20 C4 30 8 38 14 41.5 C10 35 9.5 27 10.5 20 Z"
        shade="M43 20 C45 34 37 44 24 44 C32 40 37 32 37.5 20 Z"
      />
      <Shape d={ellipse(24, 20, 19.5, 5)} tone={W.broth} lit={ellipse(18, 18.8, 9, 2.2)}>
        <Glint x={11} y={19} r={1.1} />
      </Shape>
      {/* Broth spilling over the rim, and gold coins in it. */}
      <Shape d="M30 21 C32 23 33 26 32.5 29 C32 31 30 31 29.5 29 C29 27 28.5 24 27 22 Z" tone={W.broth} />
      <Shape
        d="M12 21.5 C11.5 23.5 11.5 25 12.5 26.5 C13.5 27.5 14.8 26.5 14.6 25 C14.4 23.8 14.6 22.6 15.2 21.6 Z"
        tone={W.broth}
      />
      {[
        [18, 14, 3.4],
        [26, 12, 3.8],
        [33, 15, 3.1],
      ].map(([x, y, r]) => (
        <Shape key={x} d={circle(x, y, r)} tone={W.gold} lit={circle(x - r * 0.3, y - r * 0.3, r * 0.55)}>
          <Glint x={x - r * 0.35} y={y - r * 0.35} r={0.8} />
        </Shape>
      ))}
      <path d="M5 20 C3 34 11 44 24 44 C37 44 45 34 43 20" fill="none" stroke={INK} strokeWidth={2} />
    </g>
  );
}
