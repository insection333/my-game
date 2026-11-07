// Messages behind the bell (session 45): every reason a message can be refused is said to its sender in
// words of its own, the language warning among them; and the tray's addresses open Notices or Messages,
// writing to a player from their card, with the card's own name left behind.
import { MAIL_REFUSALS } from '@idle-clash/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reasonText } from '../src/pages/mail-words.ts';
import { trayHref } from '../src/router.ts';
import '../../../packages/content/src/index.ts';

afterEach(() => vi.unstubAllGlobals());
const at = (href: string) => vi.stubGlobal('location', new URL(href, 'https://idleclash.com'));

describe('a message refused', () => {
  it('says why, for every reason the server gives', () => {
    for (const r of MAIL_REFUSALS) expect(reasonText(r), r).not.toBe('');
    expect(reasonText('language')).toMatch(/language the game does not allow/);
    expect(reasonText('tooLong')).toBe('A message holds at most 250 characters.');
  });
});

describe("the tray's addresses", () => {
  it('opens Messages addressed to a player from their card, over the page they were on', () => {
    at('/castle?panel=player&name=Keeper');
    expect(trayHref('mail', 'Keeper')).toBe('/castle?panel=tray&tray=mail&to=Keeper');
  });

  it('goes back to Notices without the message begun', () => {
    at('/skills?panel=tray&tray=mail&to=Keeper');
    expect(trayHref('notices')).toBe('/skills?panel=tray');
  });
});
