// The six heirlooms (session 251): each a piece of the gear family's own shapes, wrought in its boss's colours
// (the barrow's bone-grey, the troll's hill-stone, the mire's moss, the drowned Warden's sea-green, the
// Storm-roc's thundercloud, the Ember Wyrm's coal and fire), with a gem set where the light falls, so an heirloom
// reads apart from the tier's gear at 24 px.
import { Body, Bow, Helm, Legs, Staff, Sword } from './gear.tsx';
import { tone } from './fish.tsx';
import type { IconDef } from './index.tsx';
import { M, Shape, type Tone } from './style.tsx';

const METAL = {
  barrow: tone('#eef0e6', '#b9bfae', '#6f7766'),
  troll: tone('#cbbd94', '#857a52', '#4c4429'),
  mire: tone('#c6dc9a', '#6f8f43', '#3d5424'),
  warden: tone('#b4e6dc', '#3f9a8c', '#1e5a52'),
  roc: tone('#d5def0', '#6f80a6', '#3a4566'),
  wyrm: tone('#ffb27a', '#b8461f', '#5e1d0c'),
};
const GEM = tone('#fff1a8', '#e2b231', '#8a6514');

/** The heirloom's gem, high on the piece where the light from the upper left falls. */
function Gem({ x, y }: { x: number; y: number }) {
  return (
    <Shape d={`M${x} ${y - 4} L${x + 3.6} ${y} L${x} ${y + 4} L${x - 3.6} ${y} Z`} tone={GEM}>
      <circle cx={x - 1} cy={y - 1.2} r={0.9} fill="#ffffff" opacity={0.85} />
    </Shape>
  );
}

const marked = (draw: () => React.JSX.Element, x: number, y: number) => () => (
  <g>
    {draw()}
    <Gem x={x} y={y} />
  </g>
);
const wood: Tone = M.ancientWood;

export const HEIRLOOM_ICONS: Record<string, IconDef> = {
  'barrow-helm': {
    draw: marked(() => <Helm metal={METAL.barrow} />, 24, 15),
    family: 'armour',
    title: "Barrow-king's helm (heirloom)",
  },
  'troll-blade': {
    draw: marked(() => <Sword metal={METAL.troll} />, 31, 17),
    family: 'weapon',
    title: "Troll-chief's blade (heirloom)",
  },
  'mire-mail': {
    draw: marked(() => <Body metal={METAL.mire} />, 24, 20),
    family: 'armour',
    title: "Mire-mother's mail (heirloom)",
  },
  'warden-bow': {
    draw: marked(() => <Bow wood={wood} metal={METAL.warden} />, 24, 24),
    family: 'weapon',
    title: "Drowned Warden's bow (heirloom)",
  },
  'roc-greaves': {
    draw: marked(() => <Legs metal={METAL.roc} />, 24, 13),
    family: 'armour',
    title: "Storm-roc's greaves (heirloom)",
  },
  'wyrm-staff': {
    draw: marked(() => <Staff wood={wood} metal={METAL.wyrm} />, 33, 11),
    family: 'weapon',
    title: "Ember Wyrm's staff (heirloom)",
  },
};
