// Where the tour's card goes: never over what a newcomer should read above a tall target.
import { describe, expect, it } from 'vitest';
import { placeCard } from '../src/shell/tourPlace.ts';

const box = (top: number, bottom: number, left: number, right: number) => ({
  top,
  bottom,
  left,
  right,
  height: bottom - top,
});

describe('the tour card', () => {
  it('sits beside a target on a wide screen', () => {
    expect(placeCard(box(330, 850, 244, 735), { width: 1440, height: 900 }, 900)).toEqual({ top: 330, left: 745 });
  });

  it('sits below a small target, and docks at the foot for a tall one on a phone', () => {
    expect(placeCard(box(8, 40, 160, 230), { width: 390, height: 844 }, 736)).toEqual({ top: 50, left: 78 });
    // The first steps panel fills most of a phone: the card docks above the lanes strip, not over the
    // welcome card above the panel.
    expect(placeCard(box(300, 840, 16, 374), { width: 390, height: 844 }, 736)).toEqual({ bottom: 118, left: 16 });
  });

  it('sits above a small target near the foot', () => {
    expect(placeCard(box(700, 730, 16, 374), { width: 390, height: 844 }, 736)).toEqual({ bottom: 154, left: 16 });
  });
});
