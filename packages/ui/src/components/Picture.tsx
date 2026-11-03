// A player's picture (session 43): one of the thirty display pictures in its round, its rim the frame they
// show, and round it the glow they show, if any: a slow ring of light that turns (still with reduced
// motion). On the Hearth's plaque, the honours sheet, the hiscores and a player's sheet.
import { M } from '../icons/style.tsx';
import { PictureRim, RIMS } from '../icons/portraits.tsx';
import { ItemIcon, type IconSize } from './ItemIcon.tsx';
import s from './Picture.module.css';

export const GLOWS = ['verdant', 'ember', 'frost', 'wyrmfire', 'aurora'] as const;

export function Picture({
  picture,
  frame = null,
  glow = null,
  size = 48,
  label,
}: {
  picture: string;
  frame?: string | null;
  glow?: string | null;
  size?: IconSize;
  label?: string;
}) {
  const rim = frame && Object.hasOwn(RIMS, frame) ? RIMS[frame] : M.bronze;
  const lit = glow && (GLOWS as readonly string[]).includes(glow) ? glow : null;
  return (
    <span className={s.picture} data-glow={lit ?? undefined} style={{ width: size, height: size }}>
      {lit && <span className={s.glow} aria-hidden="true" />}
      <PictureRim.Provider value={rim}>
        <ItemIcon name={`portrait-${picture}`} size={size} label={label} />
      </PictureRim.Provider>
    </span>
  );
}
