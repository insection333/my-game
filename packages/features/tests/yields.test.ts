// What a row says an action gives (session 70): the count a repetition pays on average, every gain the
// engine pays by counted (a perk's chance of a second, the Woodyard, the Path of Bounty), where every row
// said its base count ("Dawn sturgeon ×1") however much more it paid. A newcomer's rows are unchanged.
import { MASTERY_STEPS, XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { givesText } from '../src/shared/skill-slots.ts';
import { woodcutting } from '../src/woodcutting/index.ts';

const T0 = Date.UTC(2026, 10, 10, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
interface Row {
  action: { id: string };
  gives: string;
}
const rowsOf = (state: State) => woodcutting.slots['skill.actions']({ state, now: T0 }) as unknown as Row[];

describe('what an action gives', () => {
  it('is the base count for a newcomer', () => {
    expect(rowsOf(newState(3, T0))[0].gives).toBe('Pine logs ×1');
  });

  it('is what the lane pays on average at the top, every gain counted', () => {
    const top: State = {
      ...newState(3, T0),
      skills: { woodcutting: { xp: XP_TABLE[99] + 1 } },
      features: {
        kindling: { paths: { woodcutting: 'bounty' } },
        steading: { stages: { woodyard: 5 } },
      },
    };
    // Mastery raises the yield as it climbs, so the action starts at its last step: a steady rate.
    const last = rowsOf(top).at(-1)!.action.id;
    const mastered: State = { ...top, mastery: { [`woodcutting:${last}`]: MASTERY_STEPS.at(-1)! } };
    const row = rowsOf(mastered).at(-1)!;
    const said = /×([0-9.]+) on average$/.exec(row.gives);
    expect(said, row.gives).not.toBeNull();
    const started = engine.command(
      mastered,
      T0,
      {
        type: 'start',
        lane: 'gathering',
        action: { feature: 'woodcutting', id: row.action.id },
      },
      seeded(5),
    ).state;
    const after = engine.advance(started, T0 + 6 * 3600_000, seeded(5)).state;
    const done = (after.mastery[`woodcutting:${row.action.id}`] ?? 0) - MASTERY_STEPS.at(-1)!;
    const item = Object.keys(after.items).find((k) => k.endsWith('-logs') && (after.items[k] ?? 0) > 0)!;
    expect(done).toBeGreaterThan(300);
    // Said to a tenth: within a tenth of what six hours paid.
    expect(Math.abs((after.items[item] ?? 0) / done - Number(said![1]))).toBeLessThan(0.1);
  });

  it('says a whole extra item plainly, as it is paid every time', () => {
    expect(givesText('Ancient logs', 1, 100)).toBe('Ancient logs ×2');
    expect(givesText('Ancient logs', 1, 0)).toBe('Ancient logs ×1');
    expect(givesText('Ancient logs', 1, 106)).toBe('Ancient logs ×2.1 on average');
    expect(givesText('Ancient logs', 1, 99.6)).toBe('Ancient logs ×2 on average');
    // Too little to show at a tenth: the base alone.
    expect(givesText('Ancient logs', 2, 4)).toBe('Ancient logs ×2');
  });
});
