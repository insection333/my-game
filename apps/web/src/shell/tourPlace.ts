// Where the tour's card goes beside what it points at, so it never hides what a newcomer should read:
// beside the target when there is room (wide screens), below it when there is room, docked at the
// foot of the screen (above the lanes and the menu) for a target taller than half the screen, and
// above it only for a small target near the foot.
export const CARD_W = 300;
const CARD_H = 150;
const GAP = 10;
const EDGE = 12;

export type Place = { top: number; left: number } | { bottom: number; left: number };

export function placeCard(
  box: { top: number; bottom: number; left: number; right: number; height: number },
  view: { width: number; height: number },
  /** The top of whatever is fixed at the foot of the screen (the lanes strip and the menu). */
  floor: number,
): Place {
  const clampLeft = (x: number) => Math.max(EDGE, Math.min(view.width - CARD_W - EDGE, x));
  if (view.width - box.right - GAP - EDGE >= CARD_W)
    return { top: Math.max(EDGE, Math.min(floor - CARD_H - GAP, box.top)), left: box.right + GAP };
  if (box.bottom + GAP + CARD_H <= floor) return { top: box.bottom + GAP, left: clampLeft(box.left) };
  if (box.height > view.height / 2) return { bottom: view.height - floor + GAP, left: clampLeft(box.left) };
  return { bottom: view.height - box.top + GAP, left: clampLeft(box.left) };
}
