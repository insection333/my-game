// A sheet opened on what is not there says so (session 159). A profile card asked for while the connection
// was down said "There is no player of that name." of a player who exists; one opened with no name said
// "Reading their card…" for ever; a deed or a steading work from an address naming none opened an empty sheet.
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api.ts';
import { cardRefusal, missingWords } from '../src/pages/missing.ts';

describe('a sheet on what is not there', () => {
  it('says a player is not found only when the server says so, and otherwise why the card did not come', () => {
    expect(cardRefusal(new ApiError(404, { error: { code: 'notFound' } }))).toBe('There is no player of that name.');
    expect(cardRefusal(new ApiError(400, { error: { code: 'invalidInput' } }))).toBe(
      'There is no player of that name.',
    );
    expect(cardRefusal(new ApiError(0, null))).toBe('Could not reach the server. Check your connection and try again.');
  });

  it('says a deed or a work is not there', () => {
    expect(missingWords('deed')).toBe('There is no such deed.');
    expect(missingWords('work')).toBe('There is no such work.');
  });
});
