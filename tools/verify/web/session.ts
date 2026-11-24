// What steps 6 to 9 share: one build of the web app, the game's own server on a scratch database
// with every built feature on, the three browser engines, a newcomer's session, and the list of
// views to open (from IA.md, plus the sheets).
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContextOptions,
  type BrowserType,
  type Page,
} from 'playwright';
import { buildApp } from '../../../apps/server/src/app.ts';
import { flagsFrom } from '../../../apps/server/src/config.ts';
import type { Ctx } from '../../../apps/server/src/context.ts';
import type { State } from '@idle-clash/kernel';
import { exec, ROOT } from '../exec.ts';
import { seasonAt, totalLevel } from '@idle-clash/features';
import { BEFORE, withGoals } from './season-goals.ts';
import { crowdDeep, withDeep } from './deep-week.ts';
import { castles, wrongdoing } from './castles.ts';
import { elder, keeper } from './elder.ts';
import { sage } from './sage.ts';
import { withHonours } from './honours.ts';
import { crowd, CROWD, RIVAL, veteran } from './veteran.ts';
import { letters } from './letters.ts';

export const DIST = join(ROOT, 'apps/web/dist');
export const OUT = join(ROOT, '.verify');
export const WIDTHS = [320, 390, 1440] as const;
export type Width = (typeof WIDTHS)[number];
export const height = (w: number) => (w < 1000 ? 844 : 900);
export type Engine = 'chromium' | 'firefox' | 'webkit';
export const ENGINES: Engine[] = ['chromium', 'firefox', 'webkit'];

export { signedOut, views, type View } from './views.ts';
import { signedOut } from './views.ts';

let built: Promise<string | null> | null = null;
/** Builds the web app once per verify run; resolves to an error message, or null when built. */
export function ensureBuilt(): Promise<string | null> {
  // The web app's own Vite, from its package folder (pnpm does not hoist it to the root).
  built ??= exec(join(ROOT, 'apps/web/node_modules/.bin/vite'), ['build', 'apps/web', '--logLevel', 'warn']).then(
    (r) => (r.code === 0 ? null : r.output),
  );
  return built;
}

export interface Served {
  url: string;
  /** The session cookie of a newcomer signed up for this run. */
  cookie: { name: string; value: string };
  /** The session cookie of a player three weeks in (`veteran.ts`). */
  veteran: { name: string; value: string };
  /** And of one two months into the climb (`elder.ts`). */
  elder: { name: string; value: string };
  /** And of one a year in, with skills kindled past 99 (`elder.ts`). */
  keeper: { name: string; value: string };
  /** And of one two years in (`sage.ts`). */
  sage: { name: string; value: string };
  /** And of one a week in, whose castle was raised five days ago (`castles.ts`). */
  squire: { name: string; value: string };
  /** The server's insides, for flows that set up a save the way the admin page will. */
  ctx: Ctx;
  close: () => Promise<void>;
}

const freePort = () =>
  new Promise<number>((resolve) => {
    const probe = createServer();
    probe.listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      probe.close(() => resolve(typeof addr === 'object' && addr ? addr.port : 0));
    });
  });

let signups = 0;
/** Signs a new player up and returns their session cookie. Each comes as if from its own address
 *  (through the loopback proxy the server trusts), so the run stays clear of the sign-up limit. */
export async function newcomer(url: string, name: string): Promise<{ name: string; value: string }> {
  const res = await fetch(`${url}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: url, 'x-forwarded-for': `10.77.0.${++signups}` },
    body: JSON.stringify({ name, password: 'verify-newcomer-pass', ageConfirmed: true }),
  });
  if (res.status !== 201) throw new Error(`Signing up a newcomer failed: ${res.status} ${await res.text()}`);
  const [pair] = (res.headers.get('set-cookie') ?? '').split(';');
  const [cookieName, value] = pair.split('=');
  return { name: cookieName, value };
}

async function start(): Promise<Served> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const dir = mkdtempSync(join(tmpdir(), 'idle-clash-verify-'));
  const { app, ctx, close } = await buildApp({
    port,
    host: '127.0.0.1',
    dbPath: join(dir, 'verify.db'),
    webDist: DIST,
    origins: [url],
    secureCookies: false,
    emailEnabled: false,
    flags: flagsFrom('all'),
    log: false,
    now: () => Date.now(),
    adminNames: [],
    backupStatusDir: null,
    // The screenshot run loads every page in three browsers, as the same few players, all from this
    // machine: far faster than any person, so the paces are lifted here.
    readsPerMinute: 1_000_000,
    pagesPerMinute: 1_000_000,
  });
  await app.listen({ port, host: '127.0.0.1' });
  const cookie = await newcomer(url, 'Newcomer');
  const now = Date.now();
  const ids = new Map<string, string>();
  /** Signs a player up and gives their save a history (written as the admin page can). */
  /** `goals`: the goals they have done this season; `fresh`: new this season, with none before it. */
  const settle = async (name: string, make: (s: State) => State, goals: number, fresh = false) => {
    const c = await newcomer(url, name);
    const me = (await (await fetch(`${url}/api/me`, { headers: { cookie: `${c.name}=${c.value}` } })).json()) as {
      player: { id: string };
    };
    ids.set(name, me.player.id);
    const saved = ctx.store.read(me.player.id, now)!;
    // Deeds done by the time the page opens are recorded, and the best honours shown (honours.ts).
    const made = make(saved.doc.state);
    const state = withHonours(ctx, withGoals(made, (fresh ? 0 : BEFORE) + goals, goals, now), now);
    ctx.store.write(me.player.id, { ...saved.doc, state }, saved.rev, now);
    // A player of long standing had done their goals before this season opened, so the season's ladder
    // counts only this season's (session 165); one new this season counts them all.
    const season = seasonAt(now);
    if (season && !fresh) ctx.hiscores.update(me.player.id, withGoals(made, BEFORE), season.start - 1);
    ctx.hiscores.update(me.player.id, state, now);
    // A player with a history has played a while, so the hiscores list them (the newcomer is not yet).
    ctx.store.sqlite
      .prepare('update players set first_act_at = ?, listed_at = ? where id = ?')
      .run(now, now, me.player.id);
    return c;
  };
  const vet = await settle('Veteran', (s) => veteran(ctx, s, now), 74);
  const eld = await settle('Elder', (s) => elder(ctx, s, now), 131);
  // The keeper has been into the Deep this week (session 214).
  const kpr = await settle('Keeper', (s) => withDeep(keeper(ctx, s, now), 23, now), 118);
  const sg = await settle('Sage', (s) => sage(ctx, s, now), 152);
  // A player a week in, whose castle was raised five days ago (session 139).
  const sqr = await settle(
    'Squire',
    (s) => {
      const c = crowd(s, 0);
      return { ...c, items: { ...c.items, gold: 1_400_000 } };
    },
    139,
    true,
  );
  const elderId = ids.get('Elder')!;
  // The veteran keeps the game's admin page, so it is screenshot with players on it. Named on the list
  // once signed up, as the owner is: a name already on it cannot be signed up for.
  ctx.config.adminNames.push('Veteran');
  // Others on the hiscores, so the ladders read as they will with players on them.
  for (const [i, name] of CROWD.entries()) await settle(name, (s) => crowdDeep(crowd(s, i), i, now), (i * 37) % 160);
  // Castle Clash at three stages (session 139): the squire's a week in, the elder's two months in beside a
  // rival near its rating (one of the crowd), and the keeper's a year in.
  const lord = (name: string) => ({
    id: ids.get(name)!,
    level: totalLevel(ctx.store.read(ids.get(name)!, now)!.doc.state),
  });
  const [squireL, elderL, rivalL, keeperL, sageL] = ['Squire', 'Elder', RIVAL, 'Keeper', 'Sage'].map(lord);
  castles(ctx, { squire: squireL.id, elder: elderL.id, rival: rivalL.id, keeper: keeperL.id, sage: sageL.id }, now, {
    squire: squireL.level,
    elder: elderL.level,
    rival: rivalL.level,
    keeper: keeperL.level,
    sage: sageL.level,
  });
  // Feedback on the admin page, so its notes and Copy buttons are seen at every width.
  const say = (c: { name: string; value: string }, text: string, page: string) =>
    fetch(`${url}/api/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: url, cookie: `${c.name}=${c.value}` },
      body: JSON.stringify({ text, page }),
    });
  await say(
    eld,
    'The Ashen Peaks felt slow until I found the whetstones.\nMaybe the Combat page could point to them?',
    '/combat',
  );
  await say(kpr, 'Love the Kindling flames on the seals.', '/skills/woodcutting');
  // A report and a run of sieges on the admin page, so its queue and its pairs are seen at every width.
  wrongdoing(ctx, { elder: elderId, keeper: ids.get('Keeper')! }, now);
  // Letters in the elder's inbox and on the admin's monitor.
  letters(
    ctx,
    { elder: elderId, keeper: ids.get('Keeper')!, veteran: ids.get('Veteran')!, blocked: ids.get(CROWD[0])! },
    now,
  );
  return {
    url,
    cookie,
    veteran: vet,
    elder: eld,
    keeper: kpr,
    sage: sg,
    squire: sqr,
    ctx,
    close: async () => {
      await close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

let server: Promise<Served> | null = null;
export const ensureServer = (): Promise<Served> => (server ??= start());

/** A page for one view, in its own browser context, signed in unless the view is for visitors. */
export async function openPage(
  engine: Engine,
  path: string,
  options: BrowserContextOptions,
  as?: 'veteran' | 'elder' | 'keeper' | 'sage' | 'squire' | 'visitor',
): Promise<Page> {
  const served = await ensureServer();
  const ctx = await (await browser(engine)).newContext(options);
  const players = {
    veteran: served.veteran,
    elder: served.elder,
    keeper: served.keeper,
    sage: served.sage,
    squire: served.squire,
  };
  const cookie = as && as !== 'visitor' ? players[as] : served.cookie;
  if (!signedOut(path) && as !== 'visitor') await ctx.addCookies([{ ...cookie, url: served.url }]);
  const page = await ctx.newPage();
  page.on('close', () => void ctx.close().catch(() => undefined));
  return page;
}

/** Chromium from Playwright's own download, or the one preinstalled here when that cannot be fetched. */
function chromiumPath(): string | undefined {
  try {
    if (existsSync(chromium.executablePath())) return undefined;
  } catch {
    /* fall through */
  }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  const found = existsSync(base)
    ? readdirSync(base)
        .filter((d) => /^chromium-\d+$/.test(d))
        .sort()
    : [];
  const path = found.length ? join(base, found.at(-1)!, 'chrome-linux/chrome') : undefined;
  return path && existsSync(path) ? path : undefined;
}

const TYPES: Record<Engine, BrowserType> = { chromium, firefox, webkit };
const browsers = new Map<Engine, Promise<Browser>>();
export function browser(engine: Engine): Promise<Browser> {
  if (!browsers.has(engine)) {
    browsers.set(engine, TYPES[engine].launch(engine === 'chromium' ? { executablePath: chromiumPath() } : {}));
  }
  return browsers.get(engine)!;
}

/** The address of a view on the run's server. */
export const viewUrl = (base: string, path: string) => `${base}${path}`;

/** Closes browsers and the server; verify calls this once at the end. */
export async function closeSession(): Promise<void> {
  for (const b of browsers.values()) await (await b).close().catch(() => undefined);
  browsers.clear();
  if (server) await (await server).close();
  server = null;
}
