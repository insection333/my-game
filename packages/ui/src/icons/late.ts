// Icons drawn in the game alone (session 179): Castle Clash's art and the companions, kept out of the first
// page's weight (the welcome page shows neither) and added to the registry as the game's own code loads,
// before any of its pages draws. The icon review sheet adds them too.
import { CASTLE_ICONS } from './castle-index.tsx';
import { COMPANION_ART } from './companions.tsx';
import { ICONS, type IconDef } from './index.tsx';

const name = (id: string) => id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');

export const LATE_ICONS: Record<string, IconDef> = {
  ...CASTLE_ICONS,
  // Companions (session 179), each sitting on its tuft beside a player's picture.
  ...Object.fromEntries(
    Object.entries(COMPANION_ART).map(([id, draw]): [string, IconDef] => [
      `companion-${id}`,
      { draw, family: 'companion', title: `${name(id)} (companion)` },
    ]),
  ),
};

/** Adds the game's own icons to the registry; done once, as the game's code loads. */
export function installLateIcons(): void {
  Object.assign(ICONS, LATE_ICONS);
}
