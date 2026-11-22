// A player's look (session 43), registered beside the rest (index.tsx): the thirty display pictures
// (`portrait-<id>`, their rim the frame shown: PictureRim), the six title badges (`badge-<id>`) and the
// fourteen companions (`companion-<id>`, session 179).
import type { IconDef } from './index.tsx';
import { BadgeCrown, BadgeFlame, BadgeSkull, BadgeStar, BadgeTower, BadgeWyrm } from './badges.tsx';
import { COMPANION_ART } from './companions.tsx';
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
  // Companions (session 179), each sitting on its tuft beside a player's picture.
  ...Object.fromEntries(
    Object.entries(COMPANION_ART).map(([id, draw]): [string, IconDef] => [
      `companion-${id}`,
      { draw, family: 'companion', title: `${name(id)} (companion)` },
    ]),
  ),
};
