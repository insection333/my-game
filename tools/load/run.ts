// The load test (the brief: 500 players online on the 2-core server, load-tested before launch).
// `pnpm load` starts the real server on a fresh database, pinned to one core (half the live server),
// signs 500 players up, and keeps them all online for a few minutes: each holds the live channel open
// and plays at a person's pace (a change every 15 s or so, the game read each minute, the hiscores
// every two). It reports each kind of request's latency, the errors, and the server's CPU and memory,
// and fails if any budget is broken. `PLAYERS=50 MINUTES=1 pnpm load` runs a smaller one.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { freePort } from '../ops/tests/ports.ts';
import { ROOT } from '../verify/exec.ts';

const PLAYERS = Number(process.env.PLAYERS ?? 500);
const MINUTES = Number(process.env.MINUTES ?? 3);
const BUDGET = { p95ms: { command: 250, game: 250, hiscores: 500 }, cpuOfOneCore: 0.7, rssMb: 800 };

const port = await freePort();
const url = `http://127.0.0.1:${port}`;
const pinned = spawnSync('taskset', ['--version']).status === 0;
const pin = (core: number, pid: number) => pinned && spawnSync('taskset', ['-cp', String(core), String(pid)]);
pin(1, process.pid);
const server = spawn(process.execPath, ['apps/server/src/main.ts'], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(port),
    DB_PATH: join(mkdtempSync(join(tmpdir(), 'ic-load-')), 'load.db'),
    ORIGINS: url,
    LOG: 'false',
  },
  stdio: 'inherit',
});
pin(0, server.pid!);
const stop = () => server.kill('SIGTERM');
process.on('exit', stop);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
for (
  let i = 0;
  i < 100 &&
  !(await fetch(`${url}/api/health`).then(
    (r) => r.ok,
    () => false,
  ));
  i++
)
  await wait(100);

type Kind = 'command' | 'game' | 'hiscores';
const times: Record<Kind, number[]> = { command: [], game: [], hiscores: [] };
const errors: string[] = [];
let measuring = false;
let liveMessages = 0;

async function request(kind: Kind | null, path: string, cookie: string, ip: string, body?: unknown) {
  const start = performance.now();
  const res = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { cookie, origin: url, 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch((err: unknown) => ({ ok: false, status: 0, text: () => Promise.resolve(String(err)) }) as const);
  if (measuring && kind) times[kind].push(performance.now() - start);
  if (!res.ok && errors.length < 20) errors.push(`${path}: ${res.status} ${(await res.text()).slice(0, 120)}`);
  else if (!res.ok) errors.push(path);
  return res;
}

interface Player {
  cookie: string;
  ip: string;
  socket: WebSocket;
  n: number;
}

async function signUp(i: number): Promise<Player> {
  const ip = `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
  const attempt = (name: string) =>
    fetch(`${url}/api/auth/sign-up`, {
      method: 'POST',
      headers: { origin: url, 'x-forwarded-for': ip, 'content-type': 'application/json' },
      body: JSON.stringify({ name, password: 'a load test password', ageConfirmed: true }),
    });
  let res = await attempt(`Load ${i}`);
  // The names filter reads digits as letters ("455" alone reads "ass"); such a number gets a letter in front.
  if (res.status === 422) res = await attempt(`Load x${i}`);
  if (res.status !== 201) throw new Error(`sign-up ${i}: ${res.status} ${await res.text()}`);
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0];
  const socket = new WebSocket(`ws://127.0.0.1:${port}/api/live`, { headers: { cookie, origin: url } });
  socket.on('message', () => liveMessages++);
  socket.on('close', (code) => measuring && errors.push(`live channel closed (${code})`));
  await new Promise((resolve, reject) => (socket.once('open', resolve), socket.once('error', reject)));
  return { cookie, ip, socket, n: 0 };
}

const COMMANDS = [
  { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
  { type: 'stoke' },
  { type: 'start', lane: 'gathering', action: { feature: 'mining', id: 'copper-vein' } },
  { type: 'stoke' },
];

/** One player's few minutes: a change every 15 s or so, the game each minute, the hiscores every two. */
async function play(p: Player, until: number) {
  await wait(Math.random() * 15_000);
  let nextGame = Date.now() + Math.random() * 60_000;
  let nextHiscores = Date.now() + Math.random() * 120_000;
  while (Date.now() < until) {
    const command = COMMANDS[p.n % COMMANDS.length];
    await request('command', '/api/game/command', p.cookie, p.ip, {
      requestId: `load-${p.ip.replaceAll('.', '-')}-${p.n++}`,
      command,
    });
    if (Date.now() >= nextGame) {
      await request('game', '/api/game', p.cookie, p.ip);
      nextGame += 60_000;
    }
    if (Date.now() >= nextHiscores) {
      await request('hiscores', '/api/hiscores', p.cookie, p.ip);
      nextHiscores += 120_000;
    }
    await wait(8_000 + Math.random() * 14_000);
  }
}

/** The server's CPU time so far (seconds) and its memory now (MB), from /proc. */
function usage() {
  const stat = readFileSync(`/proc/${server.pid}/stat`, 'utf8').split(') ')[1].split(' ');
  const rss = Number(/VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${server.pid}/status`, 'utf8'))![1]) / 1024;
  return { cpu: (Number(stat[11]) + Number(stat[12])) / 100, rss };
}

const t0 = performance.now();
const players: Player[] = [];
for (let i = 0; i < PLAYERS; i += 10)
  players.push(...(await Promise.all(Array.from({ length: Math.min(10, PLAYERS - i) }, (_, j) => signUp(i + j)))));
console.log(`${PLAYERS} players signed up and online in ${((performance.now() - t0) / 1000).toFixed(0)} s`);

measuring = true;
const before = usage();
let peakRss = before.rss;
const sampler = setInterval(() => (peakRss = Math.max(peakRss, usage().rss)), 2000);
const start = Date.now();
await Promise.all(players.map((p) => play(p, start + MINUTES * 60_000)));
const seconds = (Date.now() - start) / 1000;
const cpu = (usage().cpu - before.cpu) / seconds;
clearInterval(sampler);
measuring = false;
for (const p of players) p.socket.close();

const pct = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * q)] ?? 0;
const problems: string[] = [];
const lines = [
  `# Load test: ${PLAYERS} players for ${MINUTES} min${pinned ? ', the server on one core' : ''}`,
  '',
  '| Request | Count | p50 | p95 | Max |',
  '| --- | --- | --- | --- | --- |',
];
for (const kind of ['command', 'game', 'hiscores'] as const) {
  const xs = times[kind];
  const p95 = pct(xs, 0.95);
  lines.push(
    `| ${kind} | ${xs.length} | ${pct(xs, 0.5).toFixed(0)} ms | ${p95.toFixed(0)} ms | ${pct(xs, 1).toFixed(0)} ms |`,
  );
  if (p95 > BUDGET.p95ms[kind]) problems.push(`${kind} p95 ${p95.toFixed(0)} ms (budget ${BUDGET.p95ms[kind]} ms)`);
}
const total = times.command.length + times.game.length + times.hiscores.length;
lines.push(
  '',
  `${(total / seconds).toFixed(1)} requests a second; ${liveMessages} live messages; ${errors.length} errors.`,
  `Server: ${(cpu * 100).toFixed(0)}% of one core, at most ${peakRss.toFixed(0)} MB of memory.`,
);
if (errors.length) problems.push(`${errors.length} errors: ${errors.slice(0, 5).join('; ')}`);
if (cpu > BUDGET.cpuOfOneCore) problems.push(`CPU ${(cpu * 100).toFixed(0)}% of one core (budget 70%)`);
if (peakRss > BUDGET.rssMb) problems.push(`memory ${peakRss.toFixed(0)} MB (budget ${BUDGET.rssMb} MB)`);
lines.push('', problems.length ? `Over budget: ${problems.join('; ')}` : 'Within every budget.');
mkdirSync(join(ROOT, '.verify'), { recursive: true });
writeFileSync(join(ROOT, '.verify', 'load.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
stop();
process.exit(problems.length ? 1 : 0);
