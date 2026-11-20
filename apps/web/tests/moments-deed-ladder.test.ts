// Two steps of one ladder of deeds done at once are said as the higher (session 163). A keeper's castle
// raised did "Fortresses taken: 10" and "Fortresses taken: 25" in one breath, and the moment read "Also done:
// Castle 10, Fortresses taken: 10, Fortresses taken: 25, War marks: 100 and 2 more", the same ladder twice.
import { FEATURES } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { noticesOf } from '../src/pages/notices.ts';
import { momentsFrom } from '../src/shell/moments.ts';

const T = Date.UTC(2026, 10, 20, 9);
const deed = (deed: string, name: string, tier = 'easy', at = T): GameEvent => ({
  type: 'deedDone',
  at,
  deed,
  name,
  icon: null,
  tier,
  points: 5,
});

describe('deeds done at once', () => {
  it('name the highest step of a ladder, once', () => {
    const [m] = momentsFrom(
      [
        deed('castle-raised', 'A castle raised'),
        deed('fortresses-10', 'Fortresses taken: 10', 'easy', T + 1),
        deed('fortresses-25', 'Fortresses taken: 25', 'hard', T + 2),
        deed('war-marks-100', 'War marks: 100', 'easy', T + 3),
      ],
      T - 1,
      FEATURES,
    );
    const said = `${m.title} ${m.body ?? ''}`;
    expect(said).toContain('Fortresses taken: 25');
    expect(said).not.toContain('Fortresses taken: 10');
  });

  it('name it once in the tray and on Today too', () => {
    const events = [
      deed('fortresses-10', 'Fortresses taken: 10', 'easy', T + 1),
      deed('fortresses-25', 'Fortresses taken: 25', 'hard', T + 2),
      deed('war-marks-100', 'War marks: 100', 'easy', T + 3),
    ];
    const [line] = noticesOf({ notices: [], events });
    expect(line.text).toContain('Fortresses taken: 25');
    expect(line.text).not.toContain('Fortresses taken: 10');
  });
});
