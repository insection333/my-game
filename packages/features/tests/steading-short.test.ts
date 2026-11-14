// A work's tile on the Hearth says what it lifts (session 106): the Workshop's read "4% kept", leaving what
// is kept to be guessed, beside "+6% items" and "+2% damage". Each short line names its thing.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { WORKS } from '../src/shared/steading.ts';
import { steadingView } from '../src/steading/view.ts';

describe("a work's tile", () => {
  it('names what it lifts', () => {
    const s = newState(1, 0);
    s.features.steading = { stages: Object.fromEntries(WORKS.map((w) => [w.id, 2])) };
    const short = Object.fromEntries(steadingView(s).rows.map((r) => [r.id, r.short]));
    expect(short.workshop).toMatch(/^[0-9.]+% ingredients kept$/);
  });
});
