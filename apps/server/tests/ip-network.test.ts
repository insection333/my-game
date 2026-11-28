// An IPv6 home or server is given a whole /64 (or more), and one device may take any address in it, so a
// limit kept by the whole address was no limit (session 290).
import { describe, expect, it, afterEach } from 'vitest';
import { networkOf } from '../src/context.ts';
import { code, server, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

describe('the network a request comes from', () => {
  it('keeps an IPv4 address as it is, and one written as IPv6', () => {
    expect(networkOf('203.0.113.7')).toBe('203.0.113.7');
    expect(networkOf('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(networkOf('::FFFF:203.0.113.7')).toBe('203.0.113.7');
  });

  it('takes an IPv6 address by its /64, however it is written', () => {
    const net = networkOf('2001:db8:1:2:aaaa:bbbb:cccc:dddd');
    expect(net).toBe('2001:db8:1:2::/64');
    expect(networkOf('2001:0db8:0001:0002::1')).toBe(net);
    expect(networkOf('2001:DB8:1:2:ffff::9%eth0')).toBe(net);
    expect(networkOf('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(networkOf('::1')).toBe('0:0:0:0::/64');
    expect(networkOf('2001:db8:1:3::1')).not.toBe(net);
  });

  it('leaves anything else as it is', () => {
    expect(networkOf('unknown')).toBe('unknown');
  });
});

describe('sign-ups from one IPv6 network', () => {
  it('are paced as one address, whichever addresses in its /64 they come from', async () => {
    s = await server();
    const up = (n: number) =>
      s.app.inject({
        method: 'POST',
        url: '/api/auth/sign-up',
        remoteAddress: `2001:db8:1:2::${(n + 1).toString(16)}`,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ name: `Sixer ${n}`, password: 'a long enough secret', ageConfirmed: true }),
      });
    for (let i = 0; i < 5; i++) expect((await up(i)).statusCode).toBe(201);
    const sixth = await up(5);
    expect([sixth.statusCode, code(sixth)]).toEqual([429, 'tooManyTries']);
  });
});
