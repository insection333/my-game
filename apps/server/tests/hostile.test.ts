// The hostile-input suite, generated from every route's contract: each route with input is sent
// what an attacker or a broken client would send, and must answer with the right 4xx, never a 5xx,
// never pollute prototypes, and stay healthy. Routes that change state are also sent twice.
import { featurePath, FeatureRequest, ROUTES, type RouteContract } from '@idle-clash/contracts';
import { FEATURES } from '@idle-clash/features';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { code, notes, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
let cookie: string;
beforeAll(async () => {
  s = await server({ emailEnabled: true, adminNames: ['Hostile Tester'] });
  // A password unlike the routes' examples, so a well-formed request to delete the account is refused.
  cookie = await signUp(s, 'Hostile Tester', 'not the example password');
});
afterAll(() => s.close());
// Half a second between cases, as a quick attacker would: the suite measures answers, not the rate
// limit (30 requests in 10 s), which its own test covers.
beforeEach(() => {
  s.clock.now += 500;
});

// Every feature's own routes (and the test fixture's), each as its full input: the envelope with the
// feature's own schema inside it, so a new feature route is attacked the moment it exists.
const featureRoutes: RouteContract[] = [...FEATURES, notes].flatMap((f) =>
  Object.entries(f.routes).map(([name, route], i) => ({
    id: `${f.id}.${name}`,
    method: 'POST' as const,
    path: featurePath(f.id, name),
    auth: 'player' as const,
    input: FeatureRequest.extend({ input: route.input }),
    example: { requestId: `req-hostile-${f.id}-${i}`, input: route.example },
  })),
);
const routes: RouteContract[] = [
  ...Object.values(ROUTES).filter((r) => r.method === 'POST' && r.input),
  ...featureRoutes,
];

/**
 * Each hostile body, what it is, and the status it must get. A changed field the route's own schema
 * accepts (an optional field left out) must be accepted: status 0 means "anything but 400 or 5xx".
 */
function cases(r: RouteContract): [string, string, number][] {
  const ex = r.example as Record<string, unknown>;
  const keys = Object.keys(ex);
  const out: [string, string, number][] = [
    ['not JSON', '{"name": ', 400],
    ['an empty object', '{}', 400],
    ['an array', JSON.stringify([ex]), 400],
    ['a string', '"hello"', 400],
    ['null', 'null', 400],
    ['an extra field', JSON.stringify({ ...ex, extra: 1 }), 400],
    ['a __proto__ key', `{"__proto__":{"polluted":true},${JSON.stringify(ex).slice(1)}`, 400],
    [
      'a nested __proto__ key',
      JSON.stringify({ ...ex, [keys[0]]: { __proto__: 1 } }).replace('"__proto__"', '"__proto__"'),
      400,
    ],
    [
      'a constructor.prototype key',
      `{"constructor":{"prototype":{"polluted":true}},${JSON.stringify(ex).slice(1)}`,
      400,
    ],
    [
      'a repeated key',
      `{${JSON.stringify(keys[0])}:${JSON.stringify(ex[keys[0]])},${JSON.stringify(ex).slice(1)}`,
      400,
    ],
    ['deep nesting', `{"a":${'['.repeat(64)}${']'.repeat(64)}}`, 400],
    ['a 1 MB body', JSON.stringify({ ...ex, [keys[0]]: 'x'.repeat(1_000_000) }), 413],
  ];
  const expect = (body: unknown) => (r.input!.safeParse(body).success ? 0 : 400);
  // A feature route's own fields, each set to a well-formed id that names nothing: the route must
  // answer, never crash.
  const inner = ex.input;
  if (r.path.startsWith('/api/f/') && inner && typeof inner === 'object')
    for (const k of Object.keys(inner)) {
      const body = { ...ex, input: { ...(inner as Record<string, unknown>), [k]: 'zz-names-nothing' } };
      out.push([`input.${k} naming nothing`, JSON.stringify(body), expect(body)]);
    }
  for (const k of keys) {
    const { [k]: _gone, ...rest } = ex;
    out.push([`no ${k}`, JSON.stringify(rest), expect(rest)]);
    for (const [what, v] of [
      ['a 10,000-character string', 'x'.repeat(10_000)],
      ['a number', 12345],
      ['null', null],
      ['an object', { nested: true }],
      ['a string with control characters', 'a\u0000b‮c'],
    ] as const) {
      if (JSON.stringify(v) === JSON.stringify(ex[k])) continue;
      out.push([`${k} as ${what}`, JSON.stringify({ ...ex, [k]: v }), expect({ ...ex, [k]: v })]);
    }
  }
  return out;
}

describe.each(routes.map((r) => [r.id, r] as const))('%s', (_id, r) => {
  it.each(cases(r))('answers %s', async (_what, body, status) => {
    const res = await post(s, r.path, body, r.auth === 'none' ? undefined : cookie);
    if (status === 0) {
      expect(res.statusCode).not.toBe(400);
      expect(res.statusCode).toBeLessThan(500);
    } else {
      expect(res.statusCode).toBe(status);
      expect(code(res)).toBe(status === 413 ? 'tooLarge' : 'invalidInput');
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('refuses other content types and an empty body', async () => {
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x']) {
      const res = await s.app.inject({
        method: 'POST',
        url: r.path,
        headers: { 'content-type': type, cookie },
        payload: 'name=a',
      });
      expect(res.statusCode).toBe(415);
    }
    const empty = await s.app.inject({
      method: 'POST',
      url: r.path,
      headers: { 'content-type': 'application/json', cookie },
    });
    expect(empty.statusCode).toBe(400);
  });

  it('refuses a request sent from another site', async () => {
    const res = await post(s, r.path, r.example, cookie, { origin: 'https://evil.example' });
    expect(res.statusCode).toBe(403);
    expect(code(res)).toBe('forbiddenOrigin');
  });

  it('stays healthy', async () => {
    expect((await s.app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(200);
  });
});

describe('the same request twice', () => {
  it.each([
    [
      'command',
      ROUTES.command.path,
      {
        requestId: 'req-twice-1',
        command: { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
      },
    ],
    ['feature route', '/api/f/notes/add', { requestId: 'req-twice-2', input: { text: 'once' } }],
  ])('acts once for a %s', async (_what, path, body) => {
    const [a, b] = await Promise.all([post(s, path, body, cookie), post(s, path, body, cookie)]);
    const [ja, jb] = [JSON.parse(a.body), JSON.parse(b.body)] as {
      duplicate: boolean;
      result: unknown;
      state: { features: { notes?: string[] } };
    }[];
    expect([a.statusCode, b.statusCode]).toEqual([200, 200]);
    expect([ja.duplicate, jb.duplicate].sort()).toEqual([false, true]);
    expect(jb.result).toEqual(ja.result);
    if (path.includes('notes')) expect(jb.state.features.notes?.filter((n) => n === 'once')).toHaveLength(1);
  });
});
