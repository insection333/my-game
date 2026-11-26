// Session 271: a name an admin renames for giving offence was written into other players' notices (a siege, a
// friend passing them, a cheer) and into a siege waiting to be pushed, and stayed there after the rename; they now
// say the new name.
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());
const idOf = (name: string) => s.ctx.db.select().from(players).where(eq(players.name, name)).get()!.id;

describe('a player renamed', () => {
  it('is named anew in the notices and waiting pushes that named them', async () => {
    s = await server();
    const warden = await signUpAdmin(s, 'Warden');
    await signUp(s, 'Rudeword');
    await signUp(s, 'Keeper');
    const keeper = idOf('Keeper');
    const at = s.clock.now;
    s.ctx.notices.add(keeper, [
      { type: 'castleBesieged', at, foe: 'Rudeword', outcome: 'breached', lost: 10, marks: 2 },
      { type: 'cheered', at, from: 'Rudeword', occasion: 'rank', detail: 'woodcutting', place: 3 },
      { type: 'passedBy', at, skill: 'woodcutting', foe: 'Rudeword', place: 2 },
    ]);
    s.ctx.store.sqlite
      .prepare("insert into push_due (player_id, kind, at, data) values (?, 'siege', ?, ?)")
      .run(
        keeper,
        at,
        JSON.stringify({ type: 'castleBesieged', at, foe: 'Rudeword', outcome: 'breached', lost: 1, marks: 2 }),
      );
    const r = await post(s, '/api/admin/rename', { playerId: idOf('Rudeword'), name: 'Renamed' }, warden);
    expect(r.statusCode).toBe(200);
    const said = JSON.stringify(s.ctx.notices.list(keeper));
    expect(said).not.toContain('Rudeword');
    expect(said.match(/Renamed/g)).toHaveLength(3);
    const waiting = s.ctx.store.sqlite.prepare('select data from push_due').all() as { data: string }[];
    expect(waiting[0].data).toContain('"foe":"Renamed"');
  });
});
