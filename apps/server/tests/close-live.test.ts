// The server closes with pages open (session 273). Every restart and deploy closed the database before the pages'
// sockets finished closing, and each last page closing asked the database for the player's push subscriptions:
// "The database connection is not open", thrown from a socket's handler where nothing caught it.
import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { server, signUp } from './helpers.ts';

describe('the server closing', () => {
  it('lets open pages go without touching the closed database', async () => {
    const s = await server();
    await s.app.ready();
    const cookie = await signUp(s, 'Rowan', 'a long enough secret');
    const at = await s.app.listen({ port: 0, host: '127.0.0.1' });
    const ws = new WebSocket(`${at.replace('http', 'ws')}/api/live`, {
      headers: { cookie, origin: s.config.origins[0] },
    });
    await new Promise((r, j) => (ws.on('open', r), ws.on('error', j)));
    const thrown: unknown[] = [];
    const caught = (e: unknown) => thrown.push(e);
    process.on('uncaughtException', caught);
    const closed = new Promise<void>((r) => ws.on('close', () => r()));
    await s.close();
    await Promise.race([closed, new Promise((r) => setTimeout(r, 300))]);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
    await new Promise((r) => setTimeout(r, 50));
    process.off('uncaughtException', caught);
    expect(thrown.map(String)).toEqual([]);
  });
});
