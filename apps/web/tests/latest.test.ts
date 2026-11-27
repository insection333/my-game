// Answers applied only while theirs is the latest ask (session 278): the console's directory, audit log and a
// player's record took every answer as it came, so an older one landing after a newer showed what was asked
// before (the banned under Muted, one player's record at another's address).
import { describe, expect, it } from 'vitest';
import { cameLate, inOrder, LATE_MS, latest } from '../src/latest.ts';

const later = <T>(value: T, ms: number) => new Promise<T>((r) => setTimeout(() => r(value), ms));
const failLater = (ms: number) => new Promise<never>((_, no) => setTimeout(() => no(new Error('gone')), ms));

describe('the latest ask', () => {
  it('keeps the newer answer when the older one lands after it', async () => {
    const take = latest();
    const shown: string[] = [];
    const banned = take(later('banned', 30), (r) => shown.push(r));
    const muted = take(later('muted', 5), (r) => shown.push(r));
    await Promise.all([banned, muted]);
    expect(shown).toEqual(['muted']);
  });

  it('says an older refusal no more than an older answer, and takes each ask in turn', async () => {
    const take = latest();
    const said: string[] = [];
    const old = take(
      failLater(20),
      () => said.push('old'),
      () => said.push('old refused'),
    );
    await take(later('new', 1), (r) => said.push(r));
    await old;
    await take(later('next', 1), (r) => said.push(r));
    expect(said).toEqual(['new', 'next']);
  });

  it('never lets an older answer put back what a newer one showed, while each newer one is taken', () => {
    const views = inOrder();
    const minute = views.ask();
    const press = views.ask();
    expect(views.fresh(press)).toBe(true);
    expect(views.fresh(minute)).toBe(false);
    const next = views.ask();
    expect(views.fresh(next)).toBe(true);
  });

  it("knows a game state made before the one shown, but not the server's clock stepped back", () => {
    const taken = Date.UTC(2026, 10, 27, 10);
    expect(cameLate(taken - 800, taken)).toBe(true);
    expect(cameLate(taken + 800, taken)).toBe(false);
    expect(cameLate(taken - LATE_MS - 1, taken)).toBe(false);
    expect(cameLate(taken, 0)).toBe(false);
  });
});
