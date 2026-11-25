// Everything the server reads from its environment, read once at start. Secrets live only here.
import { FEATURES } from '@idle-clash/features';

/** The password the console's account is first made with when no secret is set (the owner, 26 November
 *  2026), changed at its first sign-in before anything else. */
export const FIRST_PASSWORD = 'Password';

export interface Config {
  port: number;
  host: string;
  /** The SQLite file; ':memory:' for tests. */
  dbPath: string;
  /** The built web app to serve, or null to serve only the API. */
  webDist: string | null;
  /** Origins allowed to send changes (the site's own address). Requests from any other are refused. */
  origins: string[];
  /** Send the session cookie only over HTTPS (on for the live site). */
  secureCookies: boolean;
  /** Transactional email: off until the owner switches it on. */
  emailEnabled: boolean;
  /** Feature flags; by default each feature's own flag. */
  flags: Record<string, boolean>;
  /** Write structured logs (off in tests). */
  log: boolean;
  /** The clock, so tests can move time. */
  now: () => number;
  /** Players who may open the admin page, by name (any case). */
  adminNames: string[];
  /** The admin console's own account (session 227): its name, and its password from a secret (never in the
   *  repository). With no password set, there is no such account. */
  /** The console's own account: its password from the secret, or with none set, the first password it is
   *  made with (`first`, the owner's "Password", session 237), which it must change at its first sign-in. */
  staff: { name: string; password: string | null; first?: string | null };
  /** Reads of the game, notices and hiscores a player may make in a minute (READS_PER_MINUTE). */
  readsPerMinute: number;
  /** New live pages one address may open in a minute (PAGES_PER_MINUTE). */
  pagesPerMinute: number;
  /** Where the backup and the restore rehearsal mark their success; null where there are none. */
  backupStatusDir: string | null;
}

/** Flags from FEATURES: unset keeps each feature's own flag; "all" turns every built feature on. */
export function flagsFrom(value: string | undefined): Record<string, boolean> {
  const on = new Set(
    (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return Object.fromEntries(FEATURES.map((f) => [f.id, on.has('all') || on.has(f.id) || (!value && f.flag.on)]));
}

/** A pace from the environment: a whole number of at least 1, or the default (a typo never lifts a limit). */
const pace = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value !== undefined && Number.isSafeInteger(n) && n >= 1 ? n : fallback;
};

/** The console account's password: as written, or base64 as the deploy writes it (no character of it then
 *  read by the settings file as anything but itself); null when neither is set. */
export function consolePassword(env: NodeJS.ProcessEnv): string | null {
  if (env.ADMIN_ACCOUNT_PASSWORD) return env.ADMIN_ACCOUNT_PASSWORD;
  const b64 = env.ADMIN_ACCOUNT_PASSWORD_B64?.trim();
  return b64 ? Buffer.from(b64, 'base64').toString('utf8') || null : null;
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? '127.0.0.1',
    dbPath: env.DB_PATH ?? 'idle-clash.db',
    webDist: env.WEB_DIST ?? null,
    origins: (env.ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173')
      .split(',')
      .map((s) => s.trim()),
    secureCookies: env.SECURE_COOKIES === 'true',
    emailEnabled: env.EMAIL_ENABLED === 'true',
    flags: flagsFrom(env.FEATURES),
    log: env.LOG !== 'false',
    now: () => Date.now(),
    adminNames: (env.ADMIN_NAMES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    staff: {
      name: env.ADMIN_ACCOUNT_NAME?.trim() || 'Admin',
      password: consolePassword(env),
      first: FIRST_PASSWORD,
    },
    backupStatusDir: env.BACKUP_STATUS_DIR ?? null,
    readsPerMinute: pace(env.READS_PER_MINUTE, 120),
    pagesPerMinute: pace(env.PAGES_PER_MINUTE, 20),
  };
}
