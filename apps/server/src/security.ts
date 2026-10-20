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

/** Counts attempts per key in a sliding window. In memory: one server, as the brief plans. */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  /** Records an attempt; says whether it is allowed and, if not, how long to wait. */
  take(key: string, max: number, windowMs: number, now: number): { ok: true } | { ok: false; retryAfterMs: number } {
    const recent = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= max) {
      this.hits.set(key, recent);
      return { ok: false, retryAfterMs: recent[0] + windowMs - now };
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 50_000) this.sweep(now, windowMs);
    return { ok: true };
  }

  private sweep(now: number, windowMs: number) {
    for (const [k, v] of this.hits) if (!v.some((t) => t > now - windowMs)) this.hits.delete(k);
  }
}

/** Headers on every response: no framing, no sniffing, scripts and styles only from the site. */
export const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
