// Session 156's stress test: a bad actor could take a name that passes for the game's own and write to
// players as it: "Realm Keepers" beside the game's warnings from "The keepers of the realm", "Admin Team",
// "Game Master", "Official". Such names are now refused, and ordinary names that hold the letters are not.
import { describe, expect, it } from 'vitest';
import { nameAllowed } from '../src/auth/names.ts';

describe('a name that would pass for the game', () => {
  it('is refused', () => {
    for (const name of [
      'Realm Keepers',
      'Keepers of realm',
      'The Realm',
      'Admin Team',
      'AdminTeam',
      'Admin2',
      'Mod_Team',
      'Game Master',
      'GameMaster',
      'Official',
      'Dev Team',
      'Staff-Bot',
      'Support Desk',
      'Idle Clash',
    ])
      expect(nameAllowed(name), name).toBe(false);
  });

  it('is not confused with an ordinary one', () => {
    for (const name of ['Keeper', 'Badminton', 'Modesty', 'Devon', 'Realmwalker', 'Elder', 'Staffordshire', 'Officer'])
      expect(nameAllowed(name), name).toBe(true);
  });
});
