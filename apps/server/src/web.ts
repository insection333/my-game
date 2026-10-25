// Serves the built web app: every file read once at start and kept gzipped in memory; hashed
// assets cached for a year; every other page address answered with index.html for the page's router.
// A file that is not there (an asset from before a deploy, a favicon) is a 404, never the page.
import type { FastifyInstance } from 'fastify';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fail } from './http.ts';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

interface File {
  body: Buffer;
  gz: Buffer | null;
  type: string;
}

function load(dir: string): Map<string, File> {
  const files = new Map<string, File>();
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else {
        const body = readFileSync(p);
        const type = TYPES[extname(p)] ?? 'application/octet-stream';
        const gz = /\.(html|js|css|svg|json|webmanifest)$/.test(p) ? gzipSync(body, { level: 9 }) : null;
        files.set(`/${relative(dir, p).split('\\').join('/')}`, { body, gz, type });
      }
    }
  };
  walk(dir);
  return files;
}

export function webRoutes(app: FastifyInstance, dist: string): void {
  if (!existsSync(dist)) throw new Error(`WEB_DIST ${dist} does not exist: build the web app first`);
  const files = load(dist);
  const index = files.get('/index.html');
  if (!index) throw new Error(`No index.html in ${dist}: build the web app first`);
  app.get('/*', (req, reply) => {
    const path = new URL(req.url, 'http://x').pathname;
    if (path.startsWith('/api/')) throw fail(404, 'notFound');
    const found = files.get(path) ?? (path === '/review' ? files.get('/review.html') : undefined);
    // Page addresses have no file extension; anything that does and is missing is not the page.
    if (!found && (path.startsWith('/assets/') || /\.[a-z0-9]+$/i.test(path))) throw fail(404, 'notFound');
    const file = found ?? index;
    const gzip = file.gz && /\bgzip\b/.test(String(req.headers['accept-encoding']));
    reply
      .header('content-type', file.type)
      .header('cache-control', path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    if (gzip) reply.header('content-encoding', 'gzip').header('vary', 'accept-encoding');
    return reply.send(gzip ? file.gz : file.body);
  });
}
