// What the health check says about backups. The nightly backup and the monthly restore rehearsal each
// touch a file in the status folder when they succeed (tools/ops/backup.sh, rehearse.sh); the health
// answer reads their ages, so the outside uptime check also notices a backup that stopped.
import { statSync } from 'node:fs';
import { join } from 'node:path';

const HOUR = 3_600_000;
/** A nightly backup is late after a day and two hours. */
export const BACKUP_FRESH_MS = 26 * HOUR;
/** A monthly rehearsal is late after 35 days. */
export const RESTORE_FRESH_MS = 35 * 24 * HOUR;

export type BackupsHealth = 'fresh' | 'stale' | 'off';

const touchedAt = (dir: string, name: string): number | null => {
  try {
    return statSync(join(dir, name)).mtimeMs;
  } catch {
    return null;
  }
};

/** Off where no status folder is configured (development and tests). */
export function backupsHealth(dir: string | null, now: number): BackupsHealth {
  if (!dir) return 'off';
  const backup = touchedAt(dir, 'backup');
  const restore = touchedAt(dir, 'restore');
  const fresh = (at: number | null, within: number) => at !== null && now - at <= within;
  return fresh(backup, BACKUP_FRESH_MS) && fresh(restore, RESTORE_FRESH_MS) ? 'fresh' : 'stale';
}
