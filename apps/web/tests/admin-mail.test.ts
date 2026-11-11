// The mail monitor's letters (session 78): a warning sent by the realm itself ("The keepers of the realm")
// offered Warn the sender and Mute for a week, which would act on a blank name. Only a player's letter
// offers them; and its time reads as the game's others do ("14:22" today, "9 Nov, 13:02" this year).
import { fmt } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { letterSender, letterWhen } from '../src/pages/admin-mail-words.ts';

const NOW = Date.UTC(2026, 10, 11, 4);

describe("the mail monitor's letters", () => {
  it('offer to warn or mute only a player who wrote', () => {
    expect(letterSender({ from: 'Keeper' })).toBe('Keeper');
    expect(letterSender({ from: '' })).toBeNull();
  });

  it('say when as the rest of the game does', () => {
    expect(letterWhen(NOW - 3_600_000, NOW)).toBe(fmt.when(NOW - 3_600_000, NOW));
    expect(letterWhen(NOW - 3_600_000, NOW)).not.toMatch(/2026/);
  });
});
