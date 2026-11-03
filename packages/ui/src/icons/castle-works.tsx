// The castle's four buildings (session 41; ART.md, The castle's works and garrison): the walls, a
// stretch of curtain with its gate; the deep vault, a round door of iron with its gold lock; the
// watchtower, crenellated with its beacon burning and a pennon; and the spy guild, a hood with two eyes in it.
import { circle, Glint, INK, M, Shape } from './style.tsx';

const DARK = '#2a2320';

export function Walls() {
  return (
    <g>
      <Shape d="M3 18 H45 V44 H3 Z" tone={M.stone} lit="M3 18 H45 V21 H3 Z" shade="M3 40 H45 V44 H3 Z">
        <path
          d="M3 26 H45 M3 34 H45 M10 18 V26 M24 18 V26 M38 18 V26 M17 26 V34 M31 26 V34 M10 34 V44 M38 34 V44"
          stroke={M.stone.shadow}
          strokeWidth={1}
        />
      </Shape>
      {[3, 14.5, 26, 37.5].map((x) => (
        <Shape key={x} d={`M${x} 11 H${x + 7.5} V18 H${x} Z`} tone={M.stone} lit={`M${x} 11 H${x + 2} V18 H${x} Z`} />
      ))}
      <path d="M17 44 V34 A7 7 0 0 1 31 34 V44 Z" fill={DARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path
        d="M20.5 44 V31 M24 44 V29.5 M27.5 44 V31 M17.5 36 H30.5 M17 40 H31"
        stroke={M.iron.base}
        strokeWidth={1.4}
      />
    </g>
  );
}

export function DeepVault() {
  return (
    <g>
      <Shape
        d={circle(24, 24, 20)}
        tone={M.iron}
        lit={circle(20, 20, 12)}
        shade="M44 24 A20 20 0 0 1 10 38 C24 40 36 34 40 18 Z"
      >
        <path d={`M24 4 V44 M4 24 H44 M10 10 L38 38 M38 10 L10 38`} stroke={M.iron.shadow} strokeWidth={1.2} />
      </Shape>
      <Shape d={circle(24, 24, 15)} tone={M.steel} lit={circle(21, 21, 9)} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle
          key={a}
          cx={24 + 17.6 * Math.cos((a * Math.PI) / 180)}
          cy={24 + 17.6 * Math.sin((a * Math.PI) / 180)}
          r={1.4}
          fill={INK}
        />
      ))}
      <Shape d={circle(24, 24, 7)} tone={M.amber} lit={circle(22.4, 22.4, 3.8)}>
        <Glint x={21.8} y={21.6} r={1.2} />
      </Shape>
      <path d="M24 21 a1.8 1.8 0 1 0 0.01 0 M23.2 24 L22.6 28 H25.4 L24.8 24 Z" fill={INK} />
      <path d="M31 24 H40 M35.5 20 V28" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

export function Watchtower() {
  return (
    <g>
      <Shape d="M15 18 H33 V46 H15 Z" tone={M.stone} lit="M15 18 H19 V46 H15 Z" shade="M28 18 H33 V46 H28 Z">
        <path d="M15 27 H33 M15 37 H33" stroke={M.stone.shadow} strokeWidth={1} />
      </Shape>
      <path d="M22 26 V22.5 A2 2 0 0 1 26 22.5 V26 Z" fill={M.amber.light} stroke={INK} strokeWidth={1.4} />
      <rect x={22.6} y={33} width={2.8} height={6} fill={INK} />
      <Shape d="M12 18 H36 V14 H12 Z" tone={M.stone} lit="M12 14 H36 V15.4 H12 Z" />
      {[12, 20, 28].map((x) => (
        <Shape key={x} d={`M${x} 10 H${x + 5} V14 H${x} Z`} tone={M.stone} />
      ))}
      <Shape d="M19 10 H29 L27 6.5 H21 Z" tone={M.iron} />
      <Shape
        d="M24 0.5 C26.5 3 29.5 5 28 7.4 L20 7.4 C18.6 5 21.6 3.4 24 0.5 Z"
        tone={M.flame}
        lit="M20 7.4 C18.6 5 21.6 3.4 24 0.5 C23 3.6 23.4 5.6 24 7.4 Z"
      />
      <path d="M33.5 10 V2.5" stroke={INK} strokeWidth={1.6} />
      <Shape d="M33.5 2.5 L41 4.5 L33.5 7 Z" tone={M.banner} lit="M33.5 2.5 L41 4.5 L33.5 4.6 Z" />
      <path d="M4 46 H44" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function SpyGuild() {
  return (
    <g>
      <Shape
        d="M24 3 C34 3 40 11 40 22 C40 30 42 38 45 45 H3 C6 38 8 30 8 22 C8 11 14 3 24 3 Z"
        tone={M.seal}
        lit="M24 3 C14 3 8 11 8 22 C8 30 6 38 3 45 H8 C11 37 12.4 29 12.4 22 C12.4 12 17 5.6 24 3 Z"
        shade="M24 3 C34 3 40 11 40 22 C40 30 42 38 45 45 H39 C37 38 35.6 30 35.6 22 C35.6 12 31 5.6 24 3 Z"
      />
      <Shape
        d="M24 13 C31 13 34 19 34 26 C34 33 30 37 24 37 C18 37 14 33 14 26 C14 19 17 13 24 13 Z"
        tone={{ light: '#1d2528', base: '#11171a', shadow: '#0a0e10' }}
      />
      {[19, 29].map((x) => (
        <Shape
          key={x}
          d={`M${x - 3} 25.5 C${x - 1.5} 23.6 ${x + 1.5} 23.6 ${x + 3} 25.5 C${x + 1.5} 27.2 ${x - 1.5} 27.2 ${x - 3} 25.5 Z`}
          tone={M.amber}
        />
      ))}
      <path d="M17 41 L24 44 L31 41" fill="none" stroke={M.seal.shadow} strokeWidth={1.4} />
      <Shape d="M21.5 41.5 L24 46 L26.5 41.5 Z" tone={M.steel} />
    </g>
  );
}
