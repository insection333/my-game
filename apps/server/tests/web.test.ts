// Serving the built page: a page address gets index.html; a file that is there is sent as itself;
// a file that is not (an asset from a build before the last deploy, a favicon) is a 404, never the
// page, so a stale script fails as missing instead of loading HTML (and being kept for a year).
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { server, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

function dist() {
  const dir = mkdtempSync(join(tmpdir(), 'ic-dist-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>Idle Clash</title>');
  writeFileSync(join(dir, 'assets', 'index-abc123.js'), 'console.log(1)');
  writeFileSync(join(dir, 'robots.txt'), 'User-agent: *\n');
  return dir;
}
const get = (url: string) => s.app.inject({ method: 'GET', url });

describe('the built page', () => {
  it('answers page addresses with the page and files with themselves', async () => {
    s = await server({ webDist: dist() });
    const page = await get('/skills/woodcutting');
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('<title>Idle Clash</title>');
    const script = await get('/assets/index-abc123.js');
    expect(script.headers['cache-control']).toContain('immutable');
    expect(script.body).toBe('console.log(1)');
    const robots = await get('/robots.txt');
    expect(robots.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  it('answers a missing file with a 404, not the page', async () => {
    s = await server({ webDist: dist() });
    for (const url of ['/assets/Game-old999.js', '/favicon.ico', '/apple-touch-icon.png']) {
      const r = await get(url);
      expect(r.statusCode).toBe(404);
      expect(r.headers['cache-control'] ?? '').not.toContain('immutable');
    }
  });
});
