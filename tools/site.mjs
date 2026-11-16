// What the smoke tests (tools/smoke.mjs) and the phone check (tools/mobile.mjs) share: the site's pages, a little
// static server for them, and letting a page play a while.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const unescape = (s) => s.replace(/&amp;/g, '&');

/** The site's pages, from the front page's links and the root's *.html: `den`, den.html itself and every
 *  den.html?at=... link on the front page, dressed as Dachimpy (&as=dachimpy); `other`, every other page in the
 *  root and the front page's links to them with a query (distilling-test.html?bot=...). */
export function sitePages(root) {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const links = [...index.matchAll(/href="([^"#]+)"/g)].map((m) => unescape(m[1]));
  const places = [...new Set(links.filter((h) => /^den\.html\?at=/.test(h)))];
  const den = ['den.html', ...places].map((h) => h + (h.includes('?') ? '&' : '?') + 'as=dachimpy');
  const roots = fs.readdirSync(root).filter((f) => f.endsWith('.html') && f !== 'den.html').sort();
  const withQuery = links.filter((h) => /^[\w-]+\.html\?/.test(h) && !h.startsWith('den.html'));
  return { den, other: [...new Set([...roots, ...withQuery])] };
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary', '.txt': 'text/plain', '.md': 'text/markdown',
};

/** The site's files served on a free port (`/__blank` an empty page, to clear storage on). */
export function serve(root) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/__blank') { res.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html>'); return; }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    });
  });
  return new Promise((ok) => server.listen(0, 'localhost', () => ok(server)));
}

/** Let the page play: at least `ms` and `n` animation frames, but no more than `cap` ms (pages sharing the GPU
 *  draw slowly, and a slow frame shouldn't hang the run). */
export const play = (page, ms, n, cap = 5000) => page.evaluate(([ms, n, cap]) => new Promise((done) => {
  const t0 = performance.now();
  let count = 0;
  const tick = (t) => (++count >= n && t - t0 >= ms) || t - t0 >= cap ? done() : requestAnimationFrame(tick);
  requestAnimationFrame(tick);
}), [ms, n, cap]);

/** Until the den's splash goes (its first frame drawn), or says it didn't load (its import threw). */
export const denDrawn = (page, timeout = 30000) => page.waitForFunction(() => {
  const s = document.getElementById('splash');
  return !s || s.classList.contains('gone') || /didn't load/.test(document.getElementById('splash-say')?.textContent || '');
}, null, { timeout });

/** A browser on the real GPU (the high-performance one where there are two). */
export const GPU_ARGS = ['--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', '--mute-audio'];
