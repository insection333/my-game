// A press while the server restarts (session 274). Every merged session deploys; a press made in those seconds
// was retried for three and a half seconds, dropped, and undone without a word at the next read of the save,
// and a gateway's 502 was not even taken for the server out of reach.
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api.ts';
import { KEEP_UNSENT_MS, outbox } from '../src/game/outbox.ts';

const down = () => new ApiError(502, null);
function box() {
  const ups: boolean[] = [];
  let now = 0;
  const b = outbox({
    connected: (up) => ups.push(up),
    handled: () => false,
    now: () => now,
    pause: () => Promise.resolve(),
  });
  return { b, ups, at: (t: number) => (now = t) };
}

describe('a change the server could not hear', () => {
  it('takes a gateway answer for the server out of reach', () => {
    expect(new ApiError(502, null).code).toBe('offline');
    expect(new ApiError(504, null).code).toBe('offline');
    expect(new ApiError(500, null).code).toBe('serverError');
  });

  it('waits, and is sent again in order once the server answers, a later press behind it', async () => {
    const { b, ups } = box();
    let up = false;
    const sent: string[] = [];
    const go = (name: string) => () => (up ? Promise.resolve((sent.push(name), name)) : Promise.reject(down()));
    const first = b.send(go('start'));
    await new Promise((r) => setTimeout(r, 0));
    expect(b.waiting).toBe(1);
    expect(ups).toContain(false);
    const second = b.send(go('next'));
    expect(b.waiting).toBe(2);
    up = true;
    await b.flush();
    expect(await first).toBe('start');
    expect(await second).toBe('next');
    expect(sent).toEqual(['start', 'next']);
    expect(b.waiting).toBe(0);
  });

  it('lets go of a change left unsent too long, and of all on signing out', async () => {
    const { b, at } = box();
    const stale = b.send(() => Promise.reject(down()));
    await new Promise((r) => setTimeout(r, 0));
    at(KEEP_UNSENT_MS + 1);
    await b.flush();
    expect(await stale).toBeNull();
    const kept = b.send(() => Promise.reject(down()));
    await new Promise((r) => setTimeout(r, 0));
    b.drop();
    expect(await kept).toBeNull();
    expect(b.waiting).toBe(0);
  });
});
