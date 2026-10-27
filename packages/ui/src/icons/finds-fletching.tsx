// Fletching's finds (session 14), drawn as the other finds are (ART.md): one object, lit from the upper
// left; a fletcher's treasures, from a heron's quill to the quiver of the wild hunt.
import { ellipse, Glint, INK, M, Shape } from './style.tsx';
import { tone } from './fish.tsx';

const F = {
  heron: tone('#ffffff', '#c9d1d6', '#7f8a92'),
  hawk: tone('#e7b98a', '#a8693c', '#5e3519'),
  blade: tone('#ffffff', '#c3ccd2', '#6f7a82'),
  wax: tone('#f6e3a2', '#d4ae4e', '#8e6d1d'),
  hunt: tone('#ffe9a3', '#e2b04a', '#94691b'),
  quiver: tone('#c08250', '#8b5530', '#5b361d'),
};

/** A feather on the slant: a shaft and its vane, with a few barbs. */
function Feather({ vane, barbs }: { vane: typeof F.heron; barbs: string }) {
  return (
    <g>
      <Shape
        d="M9 41 C12 30 20 17 33 8 C38 5 42 6 40 11 C35 22 24 34 12 41 Z"
        tone={vane}
        lit="M9 41 C12 30 20 17 33 8 C38 5 42 6 40 11 C30 15 20 27 13 39 Z"
        shade="M40 11 C35 22 24 34 12 41 C20 33 28 24 34 14 C36 12 38 11 40 11 Z"
      >
        {[14, 19, 24, 29].map((x) => (
          <path key={x} d={`M${x} ${48 - x} L${x + 6} ${44 - x}`} stroke={barbs} strokeWidth={1} opacity={0.75} />
        ))}
      </Shape>
      <path d="M5 45 L37 12" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M5 45 L37 12" stroke={vane.light} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
}

export const HeronQuill = () => <Feather vane={F.heron} barbs={F.heron.shadow} />;
export const HawkFeather = () => (
  <g>
    <Feather vane={F.hawk} barbs="#f4dcae" />
  </g>
);

export function FletchersKnife() {
  return (
    <g>
      <Shape d="M22 26 L40 8 C42 6 44 7 43 9.5 L27 31 Z" tone={F.blade} lit="M22 26 L40 8 C42 6 44 7 43 9.5 L24 28.5 Z">
        <Glint x={36} y={13} r={1} />
      </Shape>
      <Shape
        d="M8 39 L21 25 L28 32 L15 45 C13 47 10 47 8 45 L6 43 C4.5 41.5 6 40.5 8 39 Z"
        tone={M.oakWood}
        lit="M8 39 L21 25 L23 27 L10 41 C8.5 42.5 7 43 6.3 42.5 C5.5 41.5 6.5 40.5 8 39 Z"
      />
      <Shape d="M19 23 L30 34 L28 36 L17 25 Z" tone={M.bronze} />
    </g>
  );
}

export function WaxedBowstring() {
  return (
    <g>
      {/* A coil of string, glossy with wax. */}
      {[15, 11, 7].map((r) => (
        <path key={r} d={ellipse(24, 26, r + 6, r)} fill="none" stroke={INK} strokeWidth={4} />
      ))}
      {[15, 11, 7].map((r) => (
        <path key={`s${r}`} d={ellipse(24, 26, r + 6, r)} fill="none" stroke={F.wax.base} strokeWidth={2} />
      ))}
      <path d="M8 22 C10 16 16 12 22 11.5" fill="none" stroke={F.wax.light} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M38 34 L44 40" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M38 34 L44 40" stroke={F.wax.base} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function ArrowOfTheFirstHunt() {
  return (
    <g>
      <path d="M8 40 L36 12" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
      <path d="M8 40 L36 12" stroke={M.ancientWood.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape d="M32 10 L45 3 L38 16 Z" tone={F.hunt} lit="M32 10 L45 3 L35 13 Z">
        <Glint x={38} y={8} r={1} />
      </Shape>
      <Shape d="M7 45 L4 34 L12 38 Z" tone={M.eagle} />
      <Shape d="M7 45 L18 43 L13 36 Z" tone={M.eagle} lit="M7 45 L18 43 L15.5 40 Z" />
      {/* Gold binding at the head, and the old marks along the shaft. */}
      <path d="M28 18 L31 21" stroke={F.hunt.base} strokeWidth={3} strokeLinecap="round" />
      <path d="M18 30 L20 28 M22 26 L24 24" stroke={F.hunt.light} strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

export function QuiverOfTheWildHunt() {
  return (
    <g>
      {/* Arrows standing in it. */}
      {[
        [17, 5],
        [24, 3],
        [31, 6],
      ].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y + 4} L${x} 20`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Shape d={`M${x - 3} ${y + 6} L${x} ${y} L${x + 3} ${y + 6} Z`} tone={M.eagle} />
        </g>
      ))}
      <Shape
        d="M12 18 L36 18 L33 43 C33 45 31 46 29 46 L19 46 C17 46 15 45 15 43 Z"
        tone={F.quiver}
        lit="M12 18 L19 18 L20 46 L19 46 C17 46 15 45 15 43 Z"
        shade="M36 18 L33 43 C33 45 31 46 29 46 L27 46 C29 40 30 30 30 18 Z"
      >
        <path d="M13.5 26 L35 26 M14.5 36 L34 36" stroke={F.hunt.base} strokeWidth={2.2} />
        <circle cx={24} cy={31} r={2.6} fill={M.leaf.base} stroke={INK} strokeWidth={0.9} />
      </Shape>
    </g>
  );
}
