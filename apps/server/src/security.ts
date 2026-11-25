// The server's guards: strict JSON (no prototype keys, no repeated keys, limited depth), a rate
// limiter, and the response headers every answer carries.

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 32;

/** Thrown for JSON the server will not read; becomes a 400 with code invalidInput. */
export class BadJson extends Error {}

/**
 * Parses JSON, refusing what JSON.parse lets through: keys that reach prototypes, a key given
 * twice in one object (which would silently keep the last), and nesting deeper than 32.
 */
export function strictJson(text: string): unknown {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new BadJson('not JSON');
  }
  const stack: { keys: Set<string>; object: boolean }[] = [];
  let expectKey = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      let raw = '';
      while (text[j] !== '"') {
        if (text[j] === '\\') {
          raw += text.slice(j, j + 2);
          j += 2;
        } else raw += text[j++];
      }
      const top = stack.at(-1);
      if (top?.object && expectKey) {
        const key = JSON.parse(`"${raw}"`) as string;
        if (FORBIDDEN_KEYS.has(key)) throw new BadJson(`the key "${key}" is not allowed`);
        if (top.keys.has(key)) throw new BadJson(`the key "${key}" is repeated`);
        top.keys.add(key);
        expectKey = false;
      }
      i = j;
    } else if (c === '{' || c === '[') {
      stack.push({ keys: new Set(), object: c === '{' });
      if (stack.length > MAX_DEPTH) throw new BadJson('nested too deeply');
      expectKey = c === '{';
    } else if (c === '}' || c === ']') {
      stack.pop();
      expectKey = false;
    } else if (c === ',') {
      expectKey = stack.at(-1)?.object ?? false;
    }
  }
  return value;
}

/** Counts attempts per key in a sliding window. In memory: one server, as the brief plans. Each key keeps its
 *  own window (session 238): a sweep made by a key of a minute let go of keys of an hour whose attempts were
 *  older than a minute, so a flood of other keys (sign-ups from many addresses) reset the hour's count of
 *  sign-in tries on an account; and once past the sweep's mark, a sweep ran on every attempt. */
export class RateLimiter {
  private hits = new Map<string, { at: number[]; windowMs: number }>();
  private swept = 0;
  /** The keys held past which a sweep is made, and how often at most. */
  static readonly SWEEP_AT = 50_000;
  static readonly SWEEP_EVERY_MS = 60_000;

  /** Records an attempt; says whether it is allowed and, if not, how long to wait. */
  take(key: string, max: number, windowMs: number, now: number): { ok: true } | { ok: false; retryAfterMs: number } {
    const recent = (this.hits.get(key)?.at ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= max) {
      this.hits.set(key, { at: recent, windowMs });
      return { ok: false, retryAfterMs: recent[0] + windowMs - now };
    }
    recent.push(now);
    this.hits.set(key, { at: recent, windowMs });
    if (this.hits.size > RateLimiter.SWEEP_AT && now - this.swept >= RateLimiter.SWEEP_EVERY_MS) this.sweep(now);
    return { ok: true };
  }

  /** How many keys are held (for the tests). */
  get size(): number {
    return this.hits.size;
  }

  /** Lets go of each key whose own window holds no attempt. */
  private sweep(now: number) {
    this.swept = now;
    for (const [k, v] of this.hits) if (!v.at.some((t) => t > now - v.windowMs)) this.hits.delete(k);
  }
}

/**
 * Headers on every response: no framing, no sniffing, scripts and styles only from the site. No
 * Cross-Origin-Opener-Policy: the game opens no windows, and the header makes Firefox switch
 * processes on every first load, which the browser tests in verify cannot follow.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
