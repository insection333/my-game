// Tiers 5 to 8 (session 12): the Sunken Fen's and the Ashen Peaks' logs, ores and bars, drawn as the
// march's are (the same log pile, rock and ingot), each in its own wood, ore or metal (ART.md).
import { Glint, INK, M, Shape } from './style.tsx';
import { Bar, Log, Ore } from './world.tsx';

const pile = (wood: typeof M.oak, bark: typeof M.oak) => (
  <g>
    <Log x={21} y={18.5} r={8} wood={wood} bark={bark} />
    <Log x={12.5} y={34} r={8} wood={wood} bark={bark} />
    <Log x={29.5} y={34} r={8} wood={wood} bark={bark} />
  </g>
);

export const MapleLogs = () => pile(M.mapleWood, M.mapleBark);
export const SilverbarkLogs = () => pile(M.silverWood, M.silverbark);
export const ElderwoodLogs = () => pile(M.elderWood, M.elderBark);
/** The ancient tree's heartwood glows faintly: a gold fleck in each cut end. */
export function AncientLogs() {
  return (
    <g>
      {pile(M.ancientWood, M.ancientBark)}
      {[
        [21, 18.5],
        [12.5, 34],
        [29.5, 34],
      ].map(([x, y]) => (
        <circle key={x + y} cx={x - 2.2} cy={y - 2.4} r={1} fill="#fffbd6" />
      ))}
    </g>
  );
}

/** Moonsilver lies in cool blue-grey rock. */
export const MoonsilverOre = () => <Ore ore={M.moonsilver} rock={M.moonrock} />;
/** Star-iron lies in black rock, its pale-blue flecks catching the light like stars. */
export const StarIronOre = () => <Ore ore={M.moonstone} rock={M.coal} />;
/** Ember ore glows out of black volcanic glass. */
export const EmberOre = () => <Ore ore={M.emberOre} rock={M.obsidian} />;

/** Dawnstone: a cluster of pale gold crystals, each lit on its upper-left face. */
export function Dawnstone() {
  const crystal = (pts: [number, number][], lit: [number, number][], g?: [number, number]) => (
    <Shape
      d={`M${pts.map((p) => p.join(' ')).join(' L')} Z`}
      tone={M.dawnstone}
      lit={`M${lit.map((p) => p.join(' ')).join(' L')} Z`}
    >
      {g && <Glint x={g[0]} y={g[1]} r={1.2} />}
    </Shape>
  );
  return (
    <g>
      <Shape
        d="M6 40 C8 34 16 32 24 32 C32 32 40 34 42 40 C40 43 32 44 24 44 C16 44 8 43 6 40 Z"
        tone={M.stone}
        lit="M6 40 C8 34 16 32 24 32 C17 34 12 37 11 43 C8 42.5 6.5 41.5 6 40 Z"
      />
      {crystal(
        [
          [10, 37],
          [13, 21],
          [17, 18],
          [20, 34],
        ],
        [
          [10, 37],
          [13, 21],
          [15, 21],
          [14, 36],
        ],
      )}
      {crystal(
        [
          [18, 38],
          [21, 12],
          [25, 6],
          [29, 12],
          [31, 38],
        ],
        [
          [18, 38],
          [21, 12],
          [25, 6],
          [24, 38],
        ],
        [22.5, 15],
      )}
      {crystal(
        [
          [29, 38],
          [33, 20],
          [37, 17],
          [40, 22],
          [38, 38],
        ],
        [
          [29, 38],
          [33, 20],
          [35, 19],
          [33.5, 38],
        ],
      )}
      <path d="M25 6 L25 38" stroke={M.dawnstone.shadow} strokeWidth={0.8} opacity={0.6} />
      <path d="M17 18 L15.5 35" stroke={INK} strokeWidth={0.6} opacity={0.3} />
    </g>
  );
}

const barTop = (light: string, metal: typeof M.oak) => ({ light, base: metal.light, shadow: metal.base });
export const MoonsilverBar = () => <Bar top={barTop('#ffffff', M.moonsilver)} metal={M.moonsilver} />;
export const StarIronBar = () => <Bar top={barTop('#eef3ff', M.starIron)} metal={M.starIron} />;
export const EmbersteelBar = () => (
  <Bar top={{ light: '#ffb07a', base: '#e0703c', shadow: '#8a3a1e' }} metal={M.embersteel} />
);
export const DawnsteelBar = () => <Bar top={barTop('#ffffff', M.dawnsteel)} metal={M.dawnsteel} />;
