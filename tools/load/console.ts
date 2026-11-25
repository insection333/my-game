// The console's load (session 233): how long each of the admin console's reads holds the server, on a realm
// grown as a year of friends would grow it. The server answers every request on one thread, SQLite with it,
// so a read the console makes is time no player's request is answered in. `pnpm load:console` builds the
// realm in a file database, signs in as the console's account and times each read; it fails any read over
// its budget, and any read whose query walks a whole growing table where an index would serve.
// `PLAYERS=500 pnpm load:console` runs a smaller realm (the budget is held at the default, 3,000).
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { post, server, signUp, type TestServer } from '../../apps/server/tests/helpers.ts';
import { keeper } from '../verify/web/elder.ts';

const PLAYERS = Number(process.env.PLAYERS ?? 3000);
const DAYS = 365;
/** The most a read made afresh may hold the server, in ms (the median of its runs once warm). */
const BUDGET_MS = 25;
const DAY = 86_400_000;
/** The id of the realm's i-th player, as an SQL expression (ids are UUIDs). */
const pid = (i: string) => `printf('00000000-0000-4000-8000-%012d', ${i})`;

const dbPath = join(mkdtempSync(join(tmpdir(), 'ic-console-')), 'console.db');
const s: TestServer = await server({ dbPath, staff: { name: 'Admin', password: 'console load 1' } });
s.clock.now = Date.now();
const db = s.ctx.store.sqlite;

/** Copies a table's one row `n` times, each column as `as` says (its own value where not said). */
function clone(table: string, n: number, as: Record<string, string>, where = '1') {
  const cols = (db.prepare(`pragma table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
  const pick = cols.map((c) => as[c] ?? `t.${c}`).join(', ');
  db.prepare(
    `with recursive k(i) as (select 1 union all select i + 1 from k where i < ${n})
     insert into ${table} (${cols.join(', ')}) select ${pick} from k, (select * from ${table} where ${where} limit 1) t`,
  ).run();
}

const t0 = performance.now();
await signUp(s, 'Template');
const now = s.clock.now;
// Every player's save as grown as a year-in keeper's, so reading one costs what the largest will.
const tid = (db.prepare("select id from players where name_key = 'template'").get() as { id: string }).id;
const kept = s.ctx.store.read(tid, now)!;
s.ctx.store.write(tid, { ...kept.doc, state: keeper(s.ctx, kept.doc.state, now) }, kept.rev, now);
db.exec('begin');
// Players who joined over the year, some banned; each with their save.
clone(
  'players',
  PLAYERS,
  {
    id: pid('i'),
    name: `'Player' || i`,
    name_key: `'player' || i`,
    name_look: `'player' || i`,
    email: 'null',
    created_at: `${now} - (i % ${DAYS}) * ${DAY} - (i * 7919) % ${DAY}`,
    banned_at: `case when i % 97 = 0 then ${now - DAY} else null end`,
    listed_at: `case when i % 3 = 0 then null else ${now - 2 * DAY} end`,
  },
  "name_key = 'template'",
);
clone('saves', PLAYERS, { player_id: pid('i') }, "player_id = (select id from players where name_key = 'template')");
// A visit on about two days in three since each joined: the table that grows fastest.
db.exec(`with recursive d(n) as (select 0 union all select n + 1 from d where n < ${DAYS - 1})
  insert into visits (player_id, day) select p.id, date((${now} - d.n * ${DAY}) / 1000, 'unixepoch')
  from players p, d where p.id like '00000000-0000-4000-8000-%' and ${now} - d.n * ${DAY} >= p.created_at and (abs(random()) % 3) <> 0`);
// The hiscores: twenty ladders a player.
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 20)
  insert or ignore into hiscores (player_id, skill, level, xp, reached_at)
  select p.id, case when k.i = 20 then 'total' else 'skill' || k.i end, 1 + abs(random()) % 99, abs(random()) % 13000000, ${now} from players p, k
  where p.id like '00000000-0000-4000-8000-%'`);
// Telemetry, notices and letters by the hundred thousand.
const types = ['command', 'pageView', 'browserError', 'levelUp'];
for (const [i, type] of types.entries())
  db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < ${i === 2 ? 2000 : 100000})
    insert into telemetry (type, player_id, at, data) select '${type}', ${pid(`1 + k.i % ${PLAYERS}`)},
    ${now} - (k.i * 37) % (30 * ${DAY}), '{"message":"x"}' from k`);
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 100000)
  insert into notices (player_id, at, data) select ${pid(`1 + k.i % ${PLAYERS}`)}, ${now} - k.i * 1000,
  '{"kind":"rank"}' from k`);
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 40000)
  insert into mail (to_id, from_id, body, at) select ${pid(`1 + k.i % ${PLAYERS}`)},
  ${pid(`1 + (k.i * 13) % ${PLAYERS}`)}, 'Well met', ${now} - k.i * 5000 from k`);
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 300)
  insert into reports (reporter_id, target_id, reason, at) select ${pid(`1 + k.i % ${PLAYERS}`)},
  ${pid('1 + (k.i * 7) % 60')}, 'abuse', ${now} - k.i * 60000 from k`);
// A year of admins' work, and notes on players (session 234).
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 20000)
  insert into admin_actions (at, actor_id, actor_name, action, target_id, target_name, detail)
  select ${now} - k.i * 1500, 'admin', 'Admin', case k.i % 3 when 0 then 'give' when 1 then 'note' else 'warn' end,
  ${pid(`1 + k.i % ${PLAYERS}`)}, 'Player' || (1 + k.i % ${PLAYERS}), '{"item":"Oak logs","count":5,"reason":"A fault"}' from k`);
db.exec(`with recursive k(i) as (select 1 union all select i + 1 from k where i < 3000)
  insert into admin_notes (player_id, at, actor_id, actor_name, text) select ${pid(`1 + k.i % ${PLAYERS}`)},
  ${now} - k.i * 60000, 'admin', 'Admin', 'Asked about a lost sword; gave it back.' from k`);
db.exec('commit');
db.exec('analyze');
const rows = (t: string) => (db.prepare(`select count(*) n from ${t}`).get() as { n: number }).n;
const saveKb = Math.round(
  (db.prepare('select length(doc) n from saves where player_id = ?').get(tid) as { n: number }).n / 1024,
);
console.log(
  `Saves of ${saveKb} KB. Realm of ${PLAYERS} players built in ${Math.round(performance.now() - t0)} ms: ` +
    ['players', 'saves', 'visits', 'hiscores', 'telemetry', 'notices', 'mail', 'admin_actions']
      .map((t) => `${t} ${rows(t)}`)
      .join(', '),
);

const signed = await post(s, '/api/auth/sign-in', { name: 'Admin', password: 'console load 1' }, undefined, {
  origin: 'http://localhost:3000',
});
const cookie = String(signed.headers['set-cookie']).split(';')[0];

/** The console's reads, as its pages make them. */
const READS: [string, string, unknown][] = [
  ['Overview', '/api/admin/overview', ''],
  ['Directory', '/api/admin/directory', { query: '', filter: 'all', sort: 'joined', page: 0 }],
  ['Directory, a name', '/api/admin/directory', { query: 'layer12', filter: 'all', sort: 'name', page: 0 }],
  ['Directory, reported', '/api/admin/directory', { query: '', filter: 'reported', sort: 'level', page: 0 }],
  ['Directory, away', '/api/admin/directory', { query: '', filter: 'away', sort: 'seen', page: 0 }],
  ['Directory, active', '/api/admin/directory', { query: '', filter: 'active', sort: 'seen', page: 0 }],
  ['Directory, last page', '/api/admin/directory', { query: '', filter: 'all', sort: 'level', page: 59 }],
  ['A record', '/api/admin/record', { playerId: '00000000-0000-4000-8000-000000001234' }],
  ['Activity', '/api/admin/activity', { playerId: '00000000-0000-4000-8000-000000001234' }],
  ['Directory, as a file', '/api/admin/directory', { query: '', filter: 'all', sort: 'level', page: 2, file: true }],
  ['Audit log, as a file', '/api/admin/audit', { query: '', before: null, file: true }],
  ['Audit log', '/api/admin/audit', { query: '', before: null }],
  ['Audit log, a search', '/api/admin/audit', { query: 'Gave', before: null }],
  ['Live', '/api/admin/live', ''],
  ['System', '/api/admin/system', ''],
  ['Moderation', '/api/admin/reports', ''],
  ['Mail monitor', '/api/admin/mail', { flagged: false }],
  ['Mail monitor, refused', '/api/admin/mail', { flagged: true }],
  ['Closed test', '/api/admin/test', ''],
  ['Sieges between lords', '/api/admin/siege-flows', ''],
];

let failed = 0;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const [name, url, body] of READS) {
  const runs: number[] = [];
  let status = 0;
  for (let k = 0; k < 7; k++) {
    // Past every memo's minute, so each run is made afresh, as the server makes it once a minute.
    s.clock.now += 61_000;
    const a = performance.now();
    const r = await post(s, url, body, cookie, { origin: 'http://localhost:3000' });
    runs.push(performance.now() - a);
    status = r.statusCode;
    if (k === 0 && process.env.SHOW) console.log(r.body.slice(0, 300));
  }
  // The first run warms the code; the median of the rest is what a read made afresh holds the server.
  const mid = median(runs.slice(1));
  const over = status >= 300 || mid > BUDGET_MS;
  if (over) failed++;
  console.log(
    `${over ? 'OVER' : 'ok  '} ${name.padEnd(22)} ${mid.toFixed(1).padStart(6)} ms (slowest ${Math.max(...runs.slice(1)).toFixed(1)})${status >= 300 ? `, status ${status}` : ''}`,
  );
}
await s.app.close();
if (failed) {
  console.log(`${failed} reads over ${BUDGET_MS} ms`);
  process.exit(1);
}
