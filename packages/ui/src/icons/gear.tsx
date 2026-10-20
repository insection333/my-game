// Reference icons, weapons and armour: Copper sword, Ash bow with bronze fittings, Iron staff,
// Bronze helm, Steel body. Weapons lie on the rising diagonal, point or head to the top right.
import { circle, ellipse, Glint, INK, LINE, M, Shape } from './style.tsx';

export function CopperSword() {
  return (
    <g transform="rotate(45 24 24)">
      <Shape
        d="M24 2.5 L27.6 8.5 L27.6 31 L20.4 31 L20.4 8.5 Z"
        tone={M.copper}
        lit="M24 2.5 L20.4 8.5 L20.4 31 L23 31 L23 7 Z"
        shade="M25.2 6 L27.6 8.5 L27.6 31 L25.2 31 Z"
      >
        <path d="M24 9 L24 29" stroke={M.copper.shadow} strokeWidth={1.2} />
        <Glint x={22} y={11} r={1.1} />
      </Shape>
      <Shape
        d="M14.5 31 H33.5 V35.5 H14.5 Z"
        tone={M.copper}
        lit="M14.5 31 H33.5 V32.6 H14.5 Z"
        shade="M14.5 34 H33.5 V35.5 H14.5 Z"
      />
      <Shape d="M21.8 35.5 H26.2 V42.5 H21.8 Z" tone={M.leather} lit="M21.8 35.5 H23.4 V42.5 H21.8 Z">
        <path d="M21.8 37.8 H26.2 M21.8 40.2 H26.2" stroke={M.leather.shadow} strokeWidth={1} />
      </Shape>
      <Shape d={circle(24, 44.6, 2.9)} tone={M.copper} lit={circle(23, 43.6, 1.6)} />
    </g>
  );
}

export function AshBow() {
  const stave = 'M27.5 3 C6.5 9.5 6.5 38.5 27.5 45 L31.5 42 C17 36 17 12 31.5 6 Z';
  return (
    <g>
      <path d="M30.5 6 L30.5 42" stroke={INK} strokeWidth={2.2} />
      <path d="M30.5 6 L30.5 42" stroke="#f6efdf" strokeWidth={1.1} />
      <Shape
        d={stave}
        tone={M.ash}
        lit="M27.5 3 C6.5 9.5 6.5 38.5 27.5 45 L25 44.4 C11 37 11 11 25 3.6 Z"
        shade="M31.5 6 C17 12 17 36 31.5 42 L33 40 C20.5 34 20.5 14 33 8 Z"
      />
      <Shape d="M10 19 H19.5 V29 H10 Z" tone={M.bronze} lit="M10 19 H19.5 V21.2 H10 Z" shade="M10 26.8 H19.5 V29 H10 Z">
        <path d="M10 22.8 H19.5 M10 25.2 H19.5" stroke={M.bronze.shadow} strokeWidth={1} />
      </Shape>
      <Shape d={circle(29.6, 4.6, 2.6)} tone={M.bronze} lit={circle(28.8, 3.8, 1.3)} />
      <Shape d={circle(29.6, 43.4, 2.6)} tone={M.bronze} lit={circle(28.8, 42.6, 1.3)} />
    </g>
  );
}

export function IronStaff() {
  return (
    <g transform="rotate(35 24 24)">
      <Shape
        d="M21.8 15 H26.2 V46 H21.8 Z"
        tone={M.oak}
        lit="M21.8 15 H23.6 V46 H21.8 Z"
        shade="M25 15 H26.2 V46 H25 Z"
      >
        <path d="M21.8 26 L26.2 24.4 M21.8 36 L26.2 34.4" stroke={M.oak.shadow} strokeWidth={0.9} />
      </Shape>
      <Shape
        d="M17 15.5 C15.5 10 16.5 5 19.5 2.5 L21 4 C19.5 7 19.8 10.5 21.5 13 L26.5 13 C28.2 10.5 28.5 7 27 4 L28.5 2.5 C31.5 5 32.5 10 31 15.5 Z"
        tone={M.iron}
        lit="M17 15.5 C15.5 10 16.5 5 19.5 2.5 L20.3 3.3 C18 6 17.8 10.5 19 15.5 Z"
        shade="M31 15.5 C32.5 10 31.5 5 28.5 2.5 L27.7 3.3 C30 6 30.2 10.5 29 15.5 Z"
      />
      <Shape
        d={circle(24, 8.2, 5.2)}
        tone={M.moonstone}
        lit={circle(22.4, 6.6, 2.9)}
        shade="M29.2 8.2 A5.2 5.2 0 0 1 20.6 12.2 L28.6 5.6 Z"
      >
        <Glint x={22.4} y={6.4} r={1.2} />
      </Shape>
      <Shape d="M19.5 15 H28.5 V18.2 H19.5 Z" tone={M.iron} lit="M19.5 15 H28.5 V16.2 H19.5 Z" />
    </g>
  );
}

export function BronzeHelm() {
  const dome = 'M10 30 C10 15 16 6.5 24 6.5 C32 6.5 38 15 38 30 Z';
  return (
    <g>
      <Shape
        d={dome}
        tone={M.bronze}
        lit="M10 30 C10 15 16 6.5 24 6.5 C20 8.5 17.5 13 17 18 C14.5 20 14 25 15 30 Z"
        shade="M38 30 C38 15 32 6.5 24 6.5 C28 9.5 30.5 17 30.5 30 Z"
      >
        <path d="M24 7 L24 29" stroke={M.bronze.shadow} strokeWidth={1.4} />
        <path d="M24.8 8 L24.8 28" stroke={M.bronze.light} strokeWidth={0.7} />
        <Glint x={17} y={14} r={1.5} />
      </Shape>
      <Shape
        d="M8.5 28.5 H39.5 V34.5 H8.5 Z"
        tone={M.bronze}
        lit="M8.5 28.5 H39.5 V30.3 H8.5 Z"
        shade="M8.5 32.8 H39.5 V34.5 H8.5 Z"
      >
        {[13, 19, 29, 35].map((x) => (
          <circle key={x} cx={x} cy={31.5} r={1} fill={M.bronze.shadow} />
        ))}
      </Shape>
      <Shape
        d="M21.6 32 H26.4 V42 C26.4 44 21.6 44 21.6 42 Z"
        tone={M.bronze}
        lit="M21.6 32 H23.3 V43.4 C22.2 43 21.6 42.6 21.6 42 Z"
        shade="M25 32 H26.4 V42 C26.4 42.8 25.8 43.4 25 43.6 Z"
      />
      <path d="M10 34.5 C10 37 11.5 38.5 13 39" fill="none" stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
      <path d="M38 34.5 C38 37 36.5 38.5 35 39" fill="none" stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
    </g>
  );
}

export function SteelBody() {
  const pauldron = (flip: boolean) => {
    const t = flip ? 'translate(48 0) scale(-1 1)' : undefined;
    return (
      <g transform={t}>
        <Shape
          d="M4.5 16.5 C4.5 10.5 9.5 7 15.5 8.5 L17 19.5 C12.5 20.5 7.5 19.8 4.5 16.5 Z"
          tone={M.steel}
          lit={
            flip
              ? 'M15.5 8.5 L17 19.5 C15.5 19.8 14 19.9 12.5 19.8 L12 8.4 Z'
              : 'M4.5 16.5 C4.5 10.5 9.5 7 15.5 8.5 L14.5 10.5 C10 10 7.5 12.5 7 17.8 Z'
          }
          shade={
            flip
              ? 'M4.5 16.5 C4.5 10.5 9.5 7 15.5 8.5 L14.5 10.5 C10 10 7.5 12.5 7 17.8 Z'
              : 'M15.5 8.5 L17 19.5 C15.5 19.8 14 19.9 12.5 19.8 L12 8.4 Z'
          }
        >
          <path d="M6 14 C9 15.8 12.5 16.3 16.2 15.8" fill="none" stroke={INK} strokeWidth={1.1} />
        </Shape>
      </g>
    );
  };
  return (
    <g>
      <Shape
        d="M13.5 10 C18 8 30 8 34.5 10 L35.5 37 C30 42 18 42 12.5 37 Z"
        tone={M.steel}
        lit="M13.5 10 C16 9 19.5 8.6 22 8.5 L21 41.4 C17.5 40.8 14.6 39.2 12.5 37 Z"
        shade="M34.5 10 C32.5 9.2 30 8.8 28 8.6 L28.5 41 C31.5 40.3 33.8 38.8 35.5 37 Z"
      >
        <path d="M24 12 L24 33" stroke={M.steel.shadow} strokeWidth={1.4} />
        <path d="M24.9 12 L24.9 33" stroke="#ffffff" strokeWidth={0.6} opacity={0.8} />
        <path
          d="M12.8 31.5 C19 34.5 29 34.5 35.2 31.5 M12.6 35.6 C19 38.6 29 38.6 35.4 35.6"
          fill="none"
          stroke={INK}
          strokeWidth={1.2}
        />
        <Glint x={17.5} y={16} r={1.7} />
      </Shape>
      <path d={ellipse(24, 10.4, 6.6, 2.6)} fill="#2b3539" stroke={INK} strokeWidth={LINE} />
      {pauldron(false)}
      {pauldron(true)}
    </g>
  );
}
