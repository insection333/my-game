// Browser errors go to the server's log, so a problem a player hits is seen without them reporting
// it. At most five a visit, each message once.
import { api } from './api.ts';

const MAX = 5;
const seen = new Set<string>();
// Control and text-direction characters are refused by the server's schema; stack traces keep lines.
// eslint-disable-next-line no-control-regex -- removing control characters is the point
const CONTROL = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]+/g;
const clean = (s: string) => s.replace(CONTROL, ' ').trim() || 'Unknown error';

export function report(err: unknown) {
  const message = clean(err instanceof Error ? err.message : String(err));
  if (seen.size >= MAX || seen.has(message)) return;
  seen.add(message);
  const stack = err instanceof Error && err.stack ? err.stack.slice(0, 4000) : undefined;
  void api.reportError(message, clean(location.pathname), stack).catch(() => undefined);
}

export function watchErrors() {
  window.addEventListener('error', (e) => report(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => report(e.reason));
}
