// How a player looks to others (session 43): the picture, frame, glow, badge and scene they show, kept on
// their player row as JSON beside their title and banner so the ladders and their sheet read it without
// opening their save. A row that cannot be read shows nothing rather than failing the ladder.
import type { Look } from '@idle-clash/contracts';
import type { shownHonours } from '@idle-clash/features';
import { z } from 'zod';

const Key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const LookSchema = z
  .object({ picture: Key, frame: Key.nullable(), glow: Key.nullable(), badge: Key.nullable(), scene: Key })
  .strict();

/** The look to keep, from the honours a save shows. */
export const lookOf = (h: ReturnType<typeof shownHonours>): string =>
  JSON.stringify({ picture: h.picture, frame: h.frame, glow: h.glow, badge: h.badge, scene: h.scene });

export function readLook(raw: string | null): Look | null {
  if (!raw) return null;
  try {
    const parsed = LookSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
