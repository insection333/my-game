// Display pictures (session 43; ART.md, Pictures): thirty, each drawn inside a round of its own colour
// with a rim of metal. Folk under a morning sky, beasts in the greenwood, foes overcome against dusk, the
// three bosses against embers. The rim is the frame a player shows (bronze by default), the round is the
// picture; a glow, when shown, is drawn round it by the page (Picture in components).
import { createContext, useContext, useId, type ComponentType } from 'react';
import { TrollChief, DrownedWarden, EmberWyrm } from './bosses.tsx';
import { BogLurker, BogWitch, DrownedAcolyte, MireHulk } from './foes-fen.tsx';
import { AshShaman, AshTroll, EmberSorcerer, ObsidianGolem } from './foes-peaks.tsx';
import { FellHuntsman, GoblinSlinger, GraveWight, HillTroll, MarshWisp, OrcRaider } from './foes.tsx';
import { Boar, Owl, Raven, Stag, Wolf } from './portraits-beasts.tsx';
import { Angler, Delver, Forester, Knight, Mage, Ranger, Smith } from './portraits-folk.tsx';
import { circle, INK, M, type Tone } from './style.tsx';
import { HollowRat } from './world.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
/** The round behind each kind of picture. */
const GROUNDS = {
  folk: tone('#eaf4fb', '#bcd8ea', '#8db4cf'),
  beast: tone('#dcebc4', '#9fc28a', '#6d9661'),
  foe: tone('#cfc6de', '#8e84a6', '#5f577a'),
  boss: tone('#f6c79a', '#d27a4a', '#8f4128'),
} as const;

/** A picture's rim: the frame shown, in its metal. */
export const RIMS: Record<string, Tone> = {
  none: M.bronze,
  bronze: M.bronze,
  silver: M.steel,
  gold: M.amber,
  dawn: M.dawnsteel,
  royal: tone('#d8b4f0', '#8a4bb8', '#4f2470'),
  obsidian: M.obsidian,
};
/** The rim a picture is drawn with: the page sets it to the frame a player shows. */
export const PictureRim = createContext<Tone>(M.bronze);

function Round({ ground, Subject, scale = 1 }: { ground: Tone; Subject: ComponentType; scale?: number }) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rim = useContext(PictureRim);
  const k = scale;
  return (
    <g>
      <clipPath id={id}>
        <path d={circle(24, 24, 20)} />
      </clipPath>
      <path d={circle(24, 24, 20)} fill={ground.base} />
      <g clipPath={`url(#${id})`}>
        <path d="M4 24 A20 20 0 0 1 24 4 C14 8 9 15 8 24 Z" fill={ground.light} />
        <path d="M44 24 A20 20 0 0 1 24 44 C34 40 39 33 40 24 Z" fill={ground.shadow} />
        <g transform={`translate(${24 - 24 * k} ${26 - 24 * k}) scale(${k})`}>
          <Subject />
        </g>
      </g>
      {/* The rim: a band of the frame's metal, lit on its upper left, outlined in ink. */}
      <path d={circle(24, 24, 21.4)} fill="none" stroke={rim.base} strokeWidth={3.6} />
      <path d="M4.2 21 A20 20 0 0 1 21 4.2" fill="none" stroke={rim.light} strokeWidth={1.4} strokeLinecap="round" />
      <path d={circle(24, 24, 23.2)} fill="none" stroke={INK} strokeWidth={1.4} />
      <path d={circle(24, 24, 19.6)} fill="none" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

const FOLK: [string, ComponentType][] = [
  ['forester', Forester],
  ['delver', Delver],
  ['smith', Smith],
  ['angler', Angler],
  ['ranger', Ranger],
  ['mage', Mage],
  ['knight', Knight],
];
const BEASTS: [string, ComponentType][] = [
  ['stag', Stag],
  ['wolf', Wolf],
  ['owl', Owl],
  ['boar', Boar],
  ['raven', Raven],
];
const FOES: [string, ComponentType][] = [
  ['hollow-rat', HollowRat],
  ['goblin-slinger', GoblinSlinger],
  ['marsh-wisp', MarshWisp],
  ['orc-raider', OrcRaider],
  ['grave-wight', GraveWight],
  ['hill-troll', HillTroll],
  ['fell-huntsman', FellHuntsman],
  ['bog-lurker', BogLurker],
  ['drowned-acolyte', DrownedAcolyte],
  ['mire-hulk', MireHulk],
  ['bog-witch', BogWitch],
  ['ash-troll', AshTroll],
  ['ash-shaman', AshShaman],
  ['obsidian-golem', ObsidianGolem],
  ['ember-sorcerer', EmberSorcerer],
];
const BOSSES: [string, ComponentType][] = [
  ['troll-chief', TrollChief],
  ['drowned-warden', DrownedWarden],
  ['ember-wyrm', EmberWyrm],
];

/** Every picture, by its honour's id: the folk and beasts at their own size, foes and bosses (drawn as
 *  busts on the full grid) a little smaller so their heads sit inside the round. */
const set = (list: [string, ComponentType][], ground: Tone, scale: number): [string, ComponentType][] =>
  list.map(([id, S]) => [id, () => <Round ground={ground} Subject={S} scale={scale} />]);
export const PICTURES: Record<string, ComponentType> = Object.fromEntries([
  ...set(FOLK, GROUNDS.folk, 0.9),
  ...set(BEASTS, GROUNDS.beast, 0.86),
  ...set(FOES, GROUNDS.foe, 0.8),
  ...set(BOSSES, GROUNDS.boss, 0.8),
]);
