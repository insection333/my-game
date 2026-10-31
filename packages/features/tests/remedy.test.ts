// Every way a lane can stop by itself comes with what puts it right, the same in the lanes rail and the
// away recap; only the quiet stops (the player's own, an expedition home, a boss rested) ask nothing.
import { isQuietStop } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { remedyFor } from '../src/shared/remedy.ts';

const codes = [...new Set(['outOfInputs', 'levelTooLow', ...FEATURES.flatMap((f) => f.stops)])];

describe('what puts a stopped lane right', () => {
  it('is offered for every stop that is not quiet', () => {
    const detail = { item: 'copper-ore', level: 20 };
    const missing = codes.filter(
      (c) => !isQuietStop(c) && !remedyFor({ code: c, detail }, { feature: 'fletching', id: 'copper-arrows' }),
    );
    expect(missing).toEqual([]);
  });

  it('leads where the stop is put right', () => {
    const at = { feature: 'fletching', id: 'copper-arrows' };
    expect(remedyFor({ code: 'noWeapon' }, { feature: 'combat', id: 'hollow-rat' })).toEqual({
      label: 'Wear a weapon',
      path: '/combat',
    });
    expect(remedyFor({ code: 'storehouseFull' }, at)).toEqual({ label: 'Make room', path: '/storehouse' });
    expect(remedyFor({ code: 'levelTooLow', detail: { level: 20 } }, at)).toEqual({
      label: 'Train Fletching',
      path: '/skills/fletching',
    });
    expect(remedyFor({ code: 'hitpointsTooLow', detail: { level: 30 } }, null)).toEqual({
      label: 'Train Hitpoints',
      path: '/skills/hitpoints',
    });
  });
});
