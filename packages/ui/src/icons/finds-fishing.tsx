// Fishing's finds (session 13), drawn as the other finds are (ART.md): one object, lit from the upper
// left, a glint where it is polished or wet; each comes up from the water (a mussel, a pearl, a bottle,
// a drowned ring, a great scale, a king's crown).
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';
import { tone } from './fish.tsx';

/** The finds' materials (Cooking's finds share them). */
export const W = {
  shell: tone('#7b8aa6', '#3a4560', '#1c2335'),
  pearl: tone('#ffffff', '#efe6e4', '#b9a8a6'),
  glass: tone('#c9f0cf', '#6fb58a', '#2f6b49'),
  cork: tone('#e7c08a', '#b98950', '#7a5528'),
  paper: tone('#fffaf0', '#f0e2c4', '#c4ad80'),
  gold: tone('#ffe9a3', '#e2b04a', '#94691b'),
  jade: tone('#a8e8c0', '#2f8a5a', '#174a30'),
  deep: tone('#b8f2f0', '#3f9fb0', '#1d5566'),
  silver: tone('#ffffff', '#cfd6dc', '#7f8a92'),
  herb: tone('#c9e89a', '#6f9e45', '#3d6326'),
  saffron: tone('#ffb08a', '#d9452a', '#8a1f12'),
  cloth: tone('#f0dcb4', '#c2a06a', '#7f6237'),
  pot: tone('#7d878c', '#454d52', '#22282c'),
  broth: tone('#ffe08a', '#e6a53a', '#9c6418'),
};

export function PearlMussel() {
  return (
    <g>
      <Shape
        d="M5 30 C6 20 15 12 27 11 C36 10.5 43 15 43 21 C43 25 39 27 34 28 C25 30 15 33 5 30 Z"
        tone={W.shell}
        lit="M5 30 C6 20 15 12 27 11 C20 14 13 20 11 29 Z"
      >
        {[18, 25, 32].map((x) => (
          <path
            key={x}
            d={`M${x - 8} ${30 - (x - 18) * 0.3} C${x - 3} ${20} ${x + 3} ${15} ${x + 6} ${13.5}`}
            fill="none"
            stroke={W.shell.light}
            strokeWidth={0.9}
            opacity={0.6}
          />
        ))}
      </Shape>
      <Shape
        d="M5 31 C14 35 26 33 35 30 C40 28.5 43 30 42 33 C40 39 30 42 20 41 C11 40 5 37 5 31 Z"
        tone={W.shell}
        shade="M42 33 C40 39 30 42 20 41 C28 38 36 36 42 31.5 Z"
      >
        <path d="M9 33 C17 36 27 35 36 32" fill="none" stroke={M.moonstone.base} strokeWidth={2.2} opacity={0.8} />
      </Shape>
      <Shape d={circle(23, 30.5, 4.6)} tone={W.pearl} lit={circle(21.6, 29, 2.4)}>
        <Glint x={21.4} y={28.6} r={1.2} />
      </Shape>
    </g>
  );
}

export function RiverPearl() {
  return (
    <g>
      <Shape d={ellipse(24, 38, 17, 5.5)} tone={W.shell} lit={ellipse(19, 36.5, 9, 2.4)} />
      <Shape
        d={circle(24, 24, 13)}
        tone={W.pearl}
        lit={circle(20, 20, 8)}
        shade="M37 24 A13 13 0 0 1 24 37 C30 33 33.5 29 34 21 Z"
      >
        <path d="M14 28 C18 33 27 34.5 33 30" fill="none" stroke="#f3c8d2" strokeWidth={2.4} opacity={0.7} />
        <Glint x={18.5} y={18.5} r={2.6} />
      </Shape>
      <Shape d={circle(38.5, 33, 3.6)} tone={W.pearl} lit={circle(37.5, 32, 2)}>
        <Glint x={37.4} y={31.8} r={0.9} />
      </Shape>
    </g>
  );
}

export function MessageInABottle() {
  return (
    <g>
      <Shape
        d="M7 37 C4 34 5 30 9 26 L24 11 C26 9 28.5 9 30.5 10 L33 7.5 L38.5 13 L36 15.5 C37 17.5 37 20 35 22 L20 37 C16 41 11 41 7 37 Z"
        tone={W.glass}
        lit="M7 37 C4 34 5 30 9 26 L24 11 C26 9 28.5 9 30.5 10 C27 11 25 13 13 25.5 C10 28.5 8.5 32 7 37 Z"
        shade="M35 22 L20 37 C16 41 11 41 7 37 C12 38.5 15.5 37 19 33.5 L33 19.5 C34.5 18 35.5 17.5 36 15.5 C37 17.5 37 20 35 22 Z"
      >
        {/* The rolled message inside. */}
        <path d="M12 31 L26 17" stroke={W.paper.shadow} strokeWidth={6.4} strokeLinecap="round" opacity={0.85} />
        <path d="M12 31 L26 17" stroke={W.paper.base} strokeWidth={4.4} strokeLinecap="round" opacity={0.95} />
        <path d="M16.5 30 L24.5 22" stroke={W.saffron.base} strokeWidth={1.2} opacity={0.8} />
        <Glint x={11} y={29} r={1.3} />
      </Shape>
      <Shape
        d="M33 7.5 L36 4.5 C37.5 3.5 39 3.5 40.5 5 L43 7.5 C44.5 9 44.5 10.5 43.5 12 L38.5 13 Z"
        tone={W.cork}
        lit="M33 7.5 L36 4.5 C37.5 3.5 39 3.5 40.5 5 L36.5 9 Z"
      />
    </g>
  );
}

export function DrownedSignet() {
  return (
    <g>
      <Shape
        d={`${circle(22, 29, 14)} ${'M22 21 a8 8 0 1 1 0 16 a8 8 0 1 1 0 -16 Z'}`}
        tone={W.gold}
        lit="M8 29 A14 14 0 0 1 22 15 L22 21 A8 8 0 0 0 14 29 Z"
        shade="M36 29 A14 14 0 0 1 22 43 L22 37 A8 8 0 0 0 30 29 Z"
      />
      <Shape d="M14 12 L30 12 L33 20 L11 20 Z" tone={W.gold} lit="M14 12 L22 12 L20 20 L11 20 Z" />
      <Shape d={ellipse(22, 14.5, 7, 4.2)} tone={W.jade} lit={ellipse(20, 13.4, 3.6, 2)}>
        <Glint x={19.5} y={13} r={1} />
      </Shape>
      {/* Weed still caught on it. */}
      <path
        d="M34 22 C39 25 37 31 41 34 C44 36 43 40 45 43"
        fill="none"
        stroke={M.leaf.shadow}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <path
        d="M34 22 C39 25 37 31 41 34 C44 36 43 40 45 43"
        fill="none"
        stroke={M.leaf.base}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
    </g>
  );
}

export function ScaleOfTheDeep() {
  return (
    <g>
      <Shape
        d="M24 4 C35 9 42 18 41 28 C40 38 32 44 24 44 C16 44 8 38 7 28 C6 18 13 9 24 4 Z"
        tone={W.deep}
        lit="M24 4 C13 9 6 18 7 28 C8 34 11 38 15 41 C12 35 12 26 15 18 C17 12 20 8 24 4 Z"
        shade="M41 28 C40 38 32 44 24 44 C31 39 35 32 35 24 C35 17 31 10 24 4 C35 9 42 18 41 28 Z"
      >
        {[12, 18, 24, 30].map((y) => (
          <path
            key={y}
            d={`M${24 - (y - 4) * 0.55} ${y + 4} C${20} ${y + 1} ${28} ${y + 1} ${24 + (y - 4) * 0.55} ${y + 4}`}
            fill="none"
            stroke={W.deep.light}
            strokeWidth={1}
            opacity={0.7}
          />
        ))}
        <path d="M14 30 C18 25 24 22 34 21" fill="none" stroke="#c7a8ff" strokeWidth={2.4} opacity={0.55} />
        <Glint x={16} y={16} r={1.8} />
      </Shape>
    </g>
  );
}

export function FenKingsCrown() {
  return (
    <g>
      <Shape
        d="M6 34 L6 14 L14 22 L19 9 L24 20 L29 9 L34 22 L42 14 L42 34 Z"
        tone={W.gold}
        lit="M6 34 L6 14 L14 22 L19 9 L21 14 L16 27 L11 25 L11 34 Z"
        shade="M42 34 L42 14 L37 19 L37 34 Z"
      />
      <Shape
        d="M5 33 L43 33 L43 40 L5 40 Z"
        tone={W.gold}
        lit="M5 33 L43 33 L43 35.5 L5 35.5 Z"
        shade="M5 38 L43 38 L43 40 L5 40 Z"
      >
        {[13, 24, 35].map((x) => (
          <path key={x} d={ellipse(x, 36.5, 2.6, 2)} fill={W.jade.base} stroke={INK} strokeWidth={0.8} />
        ))}
      </Shape>
      {[19, 29].map((x) => (
        <circle key={x} cx={x} cy={9} r={2.2} fill={W.jade.base} stroke={INK} strokeWidth={1} />
      ))}
      {/* Fen weed hanging from the rim. */}
      {['M9 40 C10 43 8 45 9.5 47', 'M30 40 C31 42.5 29.5 44.5 31 46.5', 'M40 40 C40.5 42 39.5 43 40 45'].map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={M.leaf.shadow} strokeWidth={2.6} strokeLinecap="round" />
          <path d={d} fill="none" stroke={M.leaf.base} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}
