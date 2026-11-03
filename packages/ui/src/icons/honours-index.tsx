// A player's look (session 43), registered beside the rest (index.tsx): the thirty display pictures
// (`portrait-<id>`, their rim the frame shown: PictureRim) and the six title badges (`badge-<id>`).
import type { IconDef } from './index.tsx';
import { BadgeCrown, BadgeFlame, BadgeSkull, BadgeStar, BadgeTower, BadgeWyrm } from './badges.tsx';
import { PICTURES } from './portraits.tsx';

const name = (id: string) => id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');

export const HONOUR_ICONS: Record<string, IconDef> = {
  ...Object.fromEntries(
    Object.entries(PICTURES).map(([id, draw]): [string, IconDef] => [
      `portrait-${id}`,
      { draw, family: 'picture', title: `${name(id)} (picture)` },
    ]),
  ),
  'badge-tower': { draw: BadgeTower, family: 'badge', title: 'Tower (badge)' },
  'badge-skull': { draw: BadgeSkull, family: 'badge', title: 'Skull (badge)' },
  'badge-star': { draw: BadgeStar, family: 'badge', title: 'Star (badge)' },
  'badge-flame': { draw: BadgeFlame, family: 'badge', title: 'Flame (badge)' },
  'badge-wyrm': { draw: BadgeWyrm, family: 'badge', title: 'Wyrm (badge)' },
  'badge-crown': { draw: BadgeCrown, family: 'badge', title: 'Crown (badge)' },
};
