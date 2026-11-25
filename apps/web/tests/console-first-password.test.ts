// The console's first password (session 237): an admin route refused because the console's account still
// holds it turns the console to Choose your own password, and choosing one opens it again.
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api.ts';
import { handled, passwordChosen, sessionStore } from '../src/game/session.ts';

describe("the console's first password", () => {
  it('turns the console to choosing a password when a route refuses it, and back once chosen', () => {
    expect(sessionStore.get().mustChangePassword).toBe(false);
    expect(handled(new ApiError(403, { error: { code: 'mustChangePassword' } }))).toBe(true);
    expect(sessionStore.get().mustChangePassword).toBe(true);
    passwordChosen();
    expect(sessionStore.get().mustChangePassword).toBe(false);
  });
});
