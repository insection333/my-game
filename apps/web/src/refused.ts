// A refusal said as what it was (session 117): a form's own words for its own refusals, else the wait the
// server asked for, a connection that never reached it, or a fault on the server's side. Every form says
// its refusal through this, where each fell back on "Something went wrong on our side" for all three.
import { fmt, t } from '@idle-clash/content';
import { ApiError } from './api.ts';

export type OwnWords = Partial<Record<ApiError['code'], string>>;

export function refused(err: unknown, own: OwnWords = {}): string {
  if (!(err instanceof ApiError)) return t('error.other');
  const said = own[err.code];
  if (said) return said;
  if (err.code === 'offline') return t('error.offline');
  if (err.code === 'tooManyTries')
    return t('error.tooManyTries', { wait: fmt.duration((err.retryAfterSeconds ?? 60) * 1000) });
  return t('error.other');
}
