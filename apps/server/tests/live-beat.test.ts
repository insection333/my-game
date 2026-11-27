// A page whose other end has gone (session 281): a phone that lost its signal, or slept, leaves its socket open
// on the server with no one there, and the player stood online for as long as the server ran, so their notices
// while away were never foreseen or sent, and each such page took one of their six. The server now asks every
// page each half minute whether it is there, and lets go of one that has not answered by the next ask.
import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { server, signUp } from './helpers.ts';

const until = async (ok: () => boolean) => {
  for (let i = 0; i < 100 && !ok(); i++) await new Promise((r) => setTimeout(r, 10));
};

describe('a page whose other end has gone', () => {
  it('is let go once it fails to answer, and the player is away; a page that answers stays', async () => {
    const s = await server();
    await s.app.ready();
    const gone = await signUp(s, 'Rowan', 'a long enough secret');
    const here = await signUp(s, 'Alder', 'a long enough secret');
    const at = await s.app.listen({ port: 0, host: '127.0.0.1' });
    const page = (cookie: string, autoPong: boolean) =>
      new WebSocket(`${at.replace('http', 'ws')}/api/live`, {
        headers: { cookie, origin: s.config.origins[0] },
        autoPong,
      });
    const silent = page(gone, false);
    const live = page(here, true);
    await Promise.all([silent, live].map((ws) => new Promise((r, j) => (ws.on('open', r), ws.on('error', j)))));
    expect(s.ctx.live.online).toBe(2);
    s.ctx.live.beat();
    await new Promise((r) => setTimeout(r, 100));
    s.ctx.live.beat();
    await until(() => s.ctx.live.online === 1);
    expect(s.ctx.live.online).toBe(1);
    expect(live.readyState).toBe(WebSocket.OPEN);
    s.ctx.live.beat();
    await new Promise((r) => setTimeout(r, 100));
    s.ctx.live.beat();
    expect(s.ctx.live.online).toBe(1);
    live.close();
    silent.terminate();
    await s.close();
  });
});
