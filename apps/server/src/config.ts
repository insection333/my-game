// Everything the server reads from its environment, read once at start. Secrets live only here.
import { FEATURES } from '@idle-clash/features';

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
    backupStatusDir: env.BACKUP_STATUS_DIR ?? null,
  };
}
