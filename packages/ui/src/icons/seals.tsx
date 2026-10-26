// The skill seals after Woodcutting's (ART.md, Skills): each skill's tool on the slate seal with the
// bronze rim that marks the family. The rim and slate are drawn as Woodcutting's are.
import { useContext, type ReactNode } from 'react';
import { circle, Glint, INK, M, RimTone, Shape } from './style.tsx';

/** The rim (its metal the skill's highest tier) and slate face every seal shares, with the tool on it. */
function Seal({ children }: { children: ReactNode }) {
  const rim = useContext(RimTone);
  return (
    <g>
      <Shape
        d={circle(24, 24, 21.5)}
        tone={rim}
        lit="M2.5 24 A21.5 21.5 0 0 1 24 2.5 L24 6 A18 18 0 0 0 6 24 Z"
        shade="M45.5 24 A21.5 21.5 0 0 1 24 45.5 L24 42 A18 18 0 0 0 42 24 Z"
      >
        <path d={circle(24, 24, 18.2)} fill={M.seal.base} stroke={INK} strokeWidth={1.4} />
        <path d="M6 24 A18 18 0 0 1 24 6 L24 9 A15 15 0 0 0 9 24 Z" fill={M.seal.light} opacity={0.6} />
      </Shape>
      {children}
    </g>
  );
}

/** A wooden handle on the diagonal, from (x1, y1) at the bottom left to (x2, y2). */
const Handle = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={5.6} strokeLinecap="round" />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={M.ash.base} strokeWidth={3.4} strokeLinecap="round" />
    <line
      x1={x1 - 0.6}
      y1={y1 - 0.8}
      x2={x2 - 0.6}
      y2={y2 - 0.8}
      stroke={M.ash.light}
      strokeWidth={1.1}
      strokeLinecap="round"
    />
  </g>
);

export function MiningSeal() {
  return (
    <Seal>
      <Handle x1={15} y1={37.5} x2={29} y2={14} />
      <Shape
        d="M12 15 C18 9 28 7.5 37 10 C38.5 10.5 38.5 12 37 12.3 C29 11.5 21 13.5 14.5 18.5 C13 19.6 11 16.5 12 15 Z"
        tone={M.iron}
        lit="M12 15 C18 9 28 7.5 37 10 C30 10 22 11.5 15.5 16 Z"
      >
        <Glint x={24} y={10.4} r={1} />
      </Shape>
    </Seal>
  );
}

export function SmithingSeal() {
  return (
    <Seal>
      <Handle x1={14} y1={37} x2={27} y2={17} />
      <Shape
        d="M20 13.5 L28.5 8 L37 21 L28.5 26.5 Z"
        tone={M.iron}
        lit="M20 13.5 L28.5 8 L30.5 11 L22 16.5 Z"
        shade="M37 21 L28.5 26.5 L27 24.3 L35.5 18.8 Z"
      >
        <Glint x={25.5} y={11.5} r={1.1} />
      </Shape>
    </Seal>
  );
}

export function MeleeSeal() {
  return (
    <Seal>
      <Shape
        d="M17 31 L33 9.5 L36.5 8.5 L35.5 12 L19.5 33.5 Z"
        tone={M.steel}
        lit="M17 31 L33 9.5 L36.5 8.5 L18.5 32.2 Z"
      >
        <Glint x={30} y={14} r={1} />
      </Shape>
      <Shape d="M13.5 28.5 L16 26.5 L24 32.5 L22 35 Z" tone={M.bronze} lit="M13.5 28.5 L16 26.5 L18 28 L15.5 30 Z" />
      <line x1={13} y1={39.5} x2={18.5} y2={32} stroke={INK} strokeWidth={4.8} strokeLinecap="round" />
      <line x1={13} y1={39.5} x2={18.5} y2={32} stroke={M.leather.base} strokeWidth={2.8} strokeLinecap="round" />
    </Seal>
  );
}

export function ArcherySeal() {
  return (
    <Seal>
      <path d="M17 9 C29 13 29 35 17 39" fill="none" stroke={INK} strokeWidth={5.2} strokeLinecap="round" />
      <path d="M17 9 C29 13 29 35 17 39" fill="none" stroke={M.yew.base} strokeWidth={3} strokeLinecap="round" />
      <path
        d="M17.6 10.6 C25 14 26.5 22 26 26"
        fill="none"
        stroke={M.yew.light}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line x1={17} y1={9} x2={17} y2={39} stroke={M.feather.base} strokeWidth={1.2} />
      <line x1={13} y1={24} x2={36} y2={24} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <line x1={13} y1={24} x2={36} y2={24} stroke={M.ash.base} strokeWidth={1.6} strokeLinecap="round" />
      <Shape d="M34 20.5 L40.5 24 L34 27.5 Z" tone={M.iron} lit="M34 20.5 L40.5 24 L34 24 Z" />
      <path d="M13.5 24 L10 21 M13.5 24 L10 27" stroke={M.feather.light} strokeWidth={2} strokeLinecap="round" />
    </Seal>
  );
}

export function MagicSeal() {
  return (
    <Seal>
      <Handle x1={15} y1={38} x2={28.5} y2={17.5} />
      <Shape d={circle(31, 14, 6.5)} tone={M.moonstone} lit={circle(29.5, 12.5, 3.6)}>
        <Glint x={29} y={11.5} r={1.3} />
      </Shape>
    </Seal>
  );
}

export function HitpointsSeal() {
  return (
    <Seal>
      <Shape
        d="M24 37 C14 30 10.5 24 10.5 19 C10.5 14.5 14 11.5 17.8 11.5 C20.6 11.5 22.8 13 24 15.4 C25.2 13 27.4 11.5 30.2 11.5 C34 11.5 37.5 14.5 37.5 19 C37.5 24 34 30 24 37 Z"
        tone={M.wax}
        lit="M10.5 19 C10.5 14.5 14 11.5 17.8 11.5 C20.6 11.5 22.8 13 24 15.4 C20 14.5 15.5 16 14.6 21.5 C14 25 15 27.5 16.5 29.5 C12.5 26 10.5 22.5 10.5 19 Z"
        shade="M24 37 C34 30 37.5 24 37.5 19 C37.5 17 36.8 15.2 35.6 13.9 C35.8 22 31 29 24 33.5 Z"
      >
        <Glint x={16.5} y={16.5} r={1.4} />
      </Shape>
    </Seal>
  );
}
