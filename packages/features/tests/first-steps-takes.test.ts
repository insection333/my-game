// A first step whose action takes an ingredient says so until there is some (session 110): "Smelt a copper
// bar" offered Start to a newcomer with no copper ore, and the press was refused ("Out of copper ore"),
// where the step under it said "Needs Smithing level 2" and offered nothing.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FIRST_STEPS } from '../src/goals/content.ts';
import { firstStepRows } from '../src/goals/first-steps.ts';
import { RECIPES } from '../src/smithing/content.ts';

const T0 = Date.UTC(2026, 10, 15, 9);
const row = (s: State, id: string) => firstStepRows(s, T0).find((r) => r.id === id)!;

describe('a first step that takes an ingredient', () => {
  it('says what it needs instead of offering a Start that would be refused', () => {
    const s = newState(1, T0);
    expect(row(s, 'smelt-a-copper-bar')).toMatchObject({ button: null, note: 'Needs copper ore' });
    const ore: State = { ...s, items: { 'copper-ore': 1 } };
    expect(row(ore, 'smelt-a-copper-bar').button).toMatchObject({ label: 'Start smelting' });
    const smith: State = { ...s, skills: { smithing: { xp: XP_TABLE[2] } } };
    expect(row(smith, 'forge-a-copper-sword')).toMatchObject({ button: null, note: 'Needs copper bar' });
  });

  it('names what the recipe it starts truly takes', () => {
    for (const step of FIRST_STEPS.filter((f) => f.takes)) {
      const recipe = RECIPES.find((r) => r.id === step.start.action.id)!;
      expect(recipe.takes.map((x) => x.item)).toContain(step.takes);
    }
    expect(FIRST_STEPS.filter((f) => f.takes).map((f) => f.id)).toEqual(['smelt-a-copper-bar', 'forge-a-copper-sword']);
  });
});
