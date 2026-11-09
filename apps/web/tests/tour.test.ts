// Where the tour's card goes: never over what a newcomer should read above a tall target.
import { describe, expect, it } from 'vitest';
import { floorOf, placeCard, ringOf } from '../src/shell/tourPlace.ts';

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

  // Session 60: on a wide screen the side menu runs from the header to the foot, and its top was taken
  // for the floor, pressing the card against the header far from the First steps it pointed at.
  it('takes for the floor only what is fixed along the foot, not the columns down the sides', () => {
    const menu = { top: 48, bottom: 900, height: 852 };
    const lanes = { top: 48, bottom: 900, height: 852 };
    expect(floorOf([menu, lanes], 900)).toBe(900);
    expect(placeCard(box(255, 742, 668, 1075), { width: 1440, height: 900 }, floorOf([menu, lanes], 900))).toEqual({
      top: 255,
      left: 1085,
    });
    // A phone's lanes strip and menu along the foot are its floor.
    expect(
      floorOf(
        [
          { top: 736, bottom: 844, height: 108 },
          { top: 790, bottom: 844, height: 54 },
        ],
        844,
      ),
    ).toBe(736);
  });

  // Session 61: the lanes column runs to the screen's right edge, and its ring was cut off there.
  it('keeps the ring around a target inside the screen', () => {
    expect(ringOf(box(92, 308, 1120, 1440), { width: 1440, height: 900 })).toEqual({
      top: 88,
      left: 1116,
      width: 322,
      height: 224,
    });
    expect(ringOf(box(300, 400, 100, 200), { width: 1440, height: 900 })).toEqual({
      top: 296,
      left: 96,
      width: 108,
      height: 108,
    });
  });
});
