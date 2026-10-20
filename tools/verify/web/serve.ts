// Serves the built web app (apps/web/dist) the way a production host would: gzip, long cache for
// hashed assets, and every unknown path answered with index.html so the page's router can take it.
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

export interface Served {
  url: string;
  /** Compressed bytes sent for each path, for the page weight budget. */
  sent: Map<string, number>;
  close: () => Promise<void>;
}

export function serve(dist: string, port = 0): Promise<Served> {
  const sent = new Map<string, number>();
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = normalize(join(dist, path));
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(dist, path.startsWith('/review') ? 'review.html' : 'index.html');
    }
    const body = readFileSync(file);
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const zip = /\.(html|js|css|svg|json)$/.test(file) && /gzip/.test(String(req.headers['accept-encoding']));
    const out = zip ? gzipSync(body, { level: 9 }) : body;
    sent.set(path, out.length);
    res.writeHead(200, {
      'content-type': type,
      'content-length': out.length,
      ...(zip ? { 'content-encoding': 'gzip' } : {}),
      'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(out);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const p = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ url: `http://127.0.0.1:${p}`, sent, close: () => new Promise((r) => server.close(() => r())) });
    });
  });
}
