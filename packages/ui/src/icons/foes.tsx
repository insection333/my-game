// The foes after the hollow rat, and the better foods (ART.md): each foe a bust in left-facing
// profile with the eye its brightest point; each food one warm, lit item.
import { circle, ellipse, Glint, INK, LINE, M, Shape } from './style.tsx';

/** A bright eye: ink socket, coloured iris, white core. */
const Eye = ({ x, y, glow, r = 2.4 }: { x: number; y: number; glow: string; r?: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r + 0.6} ry={r} fill={INK} />
    <circle cx={x - 0.3} cy={y} r={r * 0.6} fill={glow} />
    <circle cx={x - 0.6} cy={y - 0.4} r={r * 0.22} fill="#ffffff" />
  </g>
);

const shoulders = (top: number) => `M5 46 C6 ${top + 4} 13 ${top} 24 ${top} C35 ${top} 42 ${top + 4} 43 46 Z`;

export function GoblinSlinger() {
  return (
    <g>
      <Shape d={shoulders(35)} tone={M.leather} lit={`M5 46 C6 39 13 35 24 35 C17 37 13 41 12 46 Z`} />
      <path d="M14 36 L33 46" stroke={M.leather.shadow} strokeWidth={2.4} />
      <Shape d="M33 17 L46 9 L39 25 Z" tone={M.goblin} lit="M33 17 L46 9 L36 20 Z" />
      <Shape
        d="M10 21 C10 13 16 8 24 8 C32 8 37 13 37 21 C37 29 32 35 24 35 C19 35 15 33 13 30 L4 29 C5 26 8 24 10 21 Z"
        tone={M.goblin}
        lit="M10 21 C10 13 16 8 24 8 C19 10 15 14 14 21 C13.5 25 12 27 9 27.5 L4 29 C5 26 8 24 10 21 Z"
        shade="M37 21 C37 29 32 35 24 35 C29 32 32 27 32 20 C32 15 30 11.5 27.5 9 C33 10.5 37 15 37 21 Z"
      >
        <path d="M13 30.5 C16 31.5 19 31 21 29.5" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      </Shape>
      <Eye x={16.5} y={19.5} glow="#ffe27a" />
    </g>
  );
}

export function MarshWisp() {
  return (
    <g>
      <path
        d="M30 40 C36 42 41 39 43 34 M27 43 C32 46 38 46 41 43"
        fill="none"
        stroke={M.wisp.shadow}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Shape
        d="M25 5 C34 11 41 19 39.5 29 C38 37 31 42 23 42 C14.5 42 8.5 36 9.5 27.5 C10.5 20 17 15.5 20 9 C21.5 13 22.5 15.5 25 17.5 C25 13 24.5 9 25 5 Z"
        tone={M.wisp}
        lit="M9.5 27.5 C10.5 20 17 15.5 20 9 C21.5 13 22.5 15.5 25 17.5 C20 19 16 23 15.5 29 C15 34 17 38 19.5 41.5 C13 40 8.8 34.5 9.5 27.5 Z"
        shade="M39.5 29 C38 37 31 42 23 42 C29 39 33.5 34 34 27 C34.5 20 31 14 25 5 C34 11 41 19 39.5 29 Z"
      />
      <Eye x={19.5} y={28} glow="#ffffff" r={2.6} />
    </g>
  );
}

function OrcHead({ helm }: { helm: boolean }) {
  return (
    <g>
      <Shape
        d="M8 24 C8 14 15 8 25 8 C34 8 40 14 40 23 C40 31 35 37 26 37 C19 37 13 35 10 32 C7 31 6 28 8 24 Z"
        tone={M.orc}
        lit="M8 24 C8 14 15 8 25 8 C19 10.5 15 15.5 14.5 23 C14 27 12.5 29.5 10 31 C7 30 6 27.5 8 24 Z"
        shade="M40 23 C40 31 35 37 26 37 C31.5 33.5 34.5 28.5 34.5 21 C34.5 15.5 32 11 28.5 8.5 C35 10 40 15.5 40 23 Z"
      >
        <path d="M11 21.5 L21 19" stroke={M.orc.shadow} strokeWidth={2.2} strokeLinecap="round" />
      </Shape>
      {helm ? (
        <Shape
          d="M9.5 18 C10.5 10 17 5 25.5 5 C34 5 40 10 41 18 Z"
          tone={M.iron}
          lit="M9.5 18 C10.5 10 17 5 25.5 5 C20 7.5 16.5 12 16 18 Z"
          shade="M41 18 C40 10 34 5 25.5 5 C31 8 34 12.5 34.5 18 Z"
        >
          <Glint x={15} y={11} r={1.2} />
        </Shape>
      ) : (
        <Shape
          d="M9 15.5 C14 12 34 11 40 15 L40 19.5 C33 16 15 16.5 9 20 Z"
          tone={M.leather}
          lit="M9 15.5 C14 12 22 11.5 28 12 C20 13.5 13 16 9 18.5 Z"
        />
      )}
      <Shape d="M11 32 L8.5 25 L14 30.5 Z" tone={M.bone} />
      <Eye x={15.5} y={23.5} glow="#ffb84d" />
    </g>
  );
}

export function OrcRaider() {
  return (
    <g>
      <Shape
        d={shoulders(36)}
        tone={M.iron}
        lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z"
        shade="M43 46 C42 40 35 36 24 36 C31 38.5 35 42 36 46 Z"
      />
      <OrcHead helm />
    </g>
  );
}

export function OrcBowman() {
  return (
    <g>
      {[37, 41, 45].map((x) => (
        <path key={x} d={`M${x - 6} 30 L${x} 6`} stroke={M.pine.shadow} strokeWidth={1.6} />
      ))}
      {[37, 41, 45].map((x) => (
        <path
          key={`f${x}`}
          d={`M${x} 6 L${x - 2.2} 9.5 L${x + 0.6} 11 Z`}
          fill={M.feather.base}
          stroke={INK}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
      ))}
      <Shape d={shoulders(36)} tone={M.leather} lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z" />
      <OrcHead helm={false} />
    </g>
  );
}

export function GraveWight() {
  return (
    <g>
      <Shape
        d="M5 46 C5 28 10 9 26 7 C39 6 44 18 44 31 L44 46 Z"
        tone={M.seal}
        lit="M5 46 C5 28 10 9 26 7 C18 11 13 20 12 32 C11.5 38 12 42 13 46 Z"
        shade="M44 31 L44 46 L37 46 C38 38 38.5 30 37.5 22 C37 17 35 12 32 8.5 C40 10.5 44 19 44 31 Z"
      />
      <Shape
        d="M13 29 C13 21.5 17.5 16.5 24 16.5 C30 16.5 33 21.5 33 28 C33 35 29 40 23 40 C19 40 16.5 38.5 15 36.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        tone={M.wight}
        lit="M13 29 C13 21.5 17.5 16.5 24 16.5 C20 19 18.5 23 18.5 28 C18.5 31 17 33 14 34.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        shade="M33 28 C33 35 29 40 23 40 C27 37 29 33 29 27 C29 23 28 20 26 17 C30.5 18 33 22.5 33 28 Z"
      >
        <path d="M14.5 36.5 L18 35.5 M19.5 37.8 L21.5 35.8" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
      </Shape>
      <Eye x={18.5} y={25.5} glow="#8fe3ff" />
    </g>
  );
}

export function HillTroll() {
  return (
    <g>
      <Shape
        d="M8 29 C6 17 14 6 26 6 C38 6 46 14 46 26 C46 37 39 45 28 45 L15 45 C11 42.5 10 39 11 36 C8 34.5 8 32 8 29 Z"
        tone={M.troll}
        lit="M8 29 C6 17 14 6 26 6 C19 9 15 15 14.5 24 C14 29 13 33 11 36 C8 34.5 8 32 8 29 Z"
        shade="M46 26 C46 37 39 45 28 45 L22 45 C33 41 39 35 39.5 25 C40 17 37 11 32 7 C40 9 46 16 46 26 Z"
      >
        <path
          d="M12 19.5 C16 16.5 22 16 26 18"
          fill="none"
          stroke={M.troll.shadow}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={34} cy={14} r={1.6} fill={M.leaf.base} />
        <circle cx={38} cy={18} r={1.2} fill={M.leaf.base} />
      </Shape>
      <Shape d={circle(7.5, 27, 4.5)} tone={M.troll} lit={circle(6.5, 25.8, 2.6)} />
      <Shape d="M14 37.5 L13 32.5 L17 36.5 Z" tone={M.bone} />
      <Eye x={17.5} y={22} glow="#ffe27a" r={2} />
    </g>
  );
}

export function FellHuntsman() {
  return (
    <g>
      <path d="M41 4 C47 16 47 30 41 42" fill="none" stroke={M.yew.shadow} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M41 4 L41 42" stroke={M.feather.shadow} strokeWidth={0.9} />
      <Shape
        d="M5 46 C5 30 9 11 24 8 C35 6 40 16 40 30 L40 46 Z"
        tone={M.cloth}
        lit="M5 46 C5 30 9 11 24 8 C17 12 12.5 21 12 32 C11.5 38 12 42 13 46 Z"
        shade="M40 30 L40 46 L34 46 C35 38 35.5 30 34.5 22 C34 17 32.5 12.5 30 9 C37 11 40 19 40 30 Z"
      />
      <Shape
        d="M13 29 C13 22 17 17.5 23 17.5 C28.5 17.5 31 22 31 28 C31 35 27.5 40 22 40 C18.5 40 16 38.5 14.5 36.5 L9.5 33.5 C11 32 12.5 31 13 29 Z"
        tone={M.skin}
        lit="M13 29 C13 22 17 17.5 23 17.5 C19.5 20 18 24 18 28.5 C18 31 16.5 33 13 34 L9.5 33.5 C11 32 12.5 31 13 29 Z"
        shade="M31 28 C31 35 27.5 40 22 40 C26 37 27.5 33 27.5 27.5 C27.5 23 26.5 20 24.5 18 C28.5 19 31 23 31 28 Z"
      >
        <path d="M14.5 36.5 C18 39 23 40 27 37 L31 30 L31 41 L14 41 Z" fill={M.cloth.shadow} />
      </Shape>
      <Eye x={18} y={26} glow="#ffd36b" r={2.2} />
    </g>
  );
}

export function MeatPie() {
  return (
    <g>
      <Shape
        d="M5 25 L8 36 C10 39.5 16 41 24 41 C32 41 38 39.5 40 36 L43 25 Z"
        tone={M.iron}
        lit="M5 25 L8 36 C9 37.5 11 38.6 13 39.4 L11 25 Z"
        shade="M43 25 L40 36 C38.8 38 36.5 39.4 33.5 40.2 L36 25 Z"
      />
      <Shape
        d={ellipse(24, 24, 20, 10.5)}
        tone={M.crust}
        lit={ellipse(19, 21, 12, 6)}
        shade="M44 24 C44 30 35 34.5 24 34.5 C33 32 40 29 41 22 Z"
      >
        {['M15 22 L19 20', 'M22 26 L27 24', 'M28 19 L32 17.5'].map((d) => (
          <path key={d} d={d} stroke={M.meat.base} strokeWidth={2.4} strokeLinecap="round" />
        ))}
        <Glint x={13} y={19} r={1.1} />
      </Shape>
    </g>
  );
}

export function HeartyStew() {
  return (
    <g>
      <path d="M30 22 L44 6" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M30 22 L44 6" stroke={M.oakWood.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape
        d="M4 24 C4 36 13 43 24 43 C35 43 44 36 44 24 Z"
        tone={M.oakWood}
        lit="M4 24 C4 32 8 38 14 41 C11 36 10 30 10.5 24 Z"
        shade="M44 24 C44 36 35 43 24 43 C31 40 37 33 37.5 24 Z"
      />
      <Shape d={ellipse(24, 24, 20, 7)} tone={M.broth} lit={ellipse(18, 22.5, 10, 3.5)}>
        <circle cx={15} cy={24} r={2.6} fill={M.meat.base} stroke={INK} strokeWidth={0.8} />
        <circle cx={24} cy={26} r={2.3} fill={M.amber.base} stroke={INK} strokeWidth={0.8} />
        <circle cx={31} cy={23} r={2.5} fill={M.meat.base} stroke={INK} strokeWidth={0.8} />
        <circle cx={21} cy={21.5} r={1.6} fill={M.leaf.base} stroke={INK} strokeWidth={0.7} />
        <Glint x={11} y={22} r={1.1} />
      </Shape>
      <path d="M4 24 C4 36 13 43 24 43 C35 43 44 36 44 24" fill="none" stroke={INK} strokeWidth={LINE} />
    </g>
  );
}
