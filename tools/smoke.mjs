// Smoke tests (15 Nov, after den.html?at=helium crashed on arrival, live, for a day): every page of the
// site opened in a headless Chromium, failing on any uncaught error or console error.
//
//   npm run smoke                  every page (run it before a push to main)
//   npm run smoke -- helium race   only the pages whose address has one of these in it
//   SMOKE_JOBS=4 npm run smoke     how many pages at once (default: half the cores, at most 8)
//   SMOKE_TIMES=1 npm run smoke    each page's timings too
//
// What it opens:
//   - every den.html?at=... link on the front page (index.html), so a new place is covered as soon as it's
//     linked there, plus den.html itself; dressed as Dachimpy (&as=dachimpy), each twice: as the plain
//     modules (localhost loads js/den.js) and as the bundle the live site loads (&bundle). Each is waited on
//     until the splash goes (the den's first frame drawn), then played a second and a half, Space pressed
//     (through a cutscene, ashore), played a second, Space again, half a second more: cutscenes and lessons
//     start in their first ticks (Helium's lesson crashed in its first, 14-15 Nov).
//   - every other page in the site's root (*.html), and the front page's links to them with a query
//     (distilling-test.html?bot=...), each loaded and given a moment.
// Served by a little static server of its own on a free port, stopped at the end. Each page starts with
// the site's storage emptied, as a new visitor. Drawn on the real GPU (the high-performance one where
// there are two), each job a browser of its own. Quiet when everything passes, but for one line; otherwise
// each failing page and its errors, and exit code 1.

import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { sitePages, serve, play, denDrawn, GPU_ARGS } from './site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const JOBS = Number(process.env.SMOKE_JOBS) || Math.max(1, Math.min(8, Math.floor(os.cpus().length / 2)));

// Console errors that aren't the site's fault, each with why.
const IGNORE = [
  /404.*\(api\//,   // the leaderboard's and crews' /api/... is the Cloudflare Worker's, not a static file
];

// ---- the pages: every den place twice, as the plain modules and as the bundle ----

function pages() {
  const { den, other } = sitePages(ROOT);
  const all = [...den.flatMap((u) => [{ url: u, den: true }, { url: u + '&bundle', den: true }]), ...other.map((url) => ({ url, den: false }))];
  return only.length ? all.filter((p) => only.some((o) => p.url.includes(o))) : all;
}

// ---- the browser ----

async function check(context, base, p) {
  const errors = [];
  const page = await context.newPage();
  // A fresh start each page, as a new visitor's: the site's storage emptied first.
  await page.goto(`${base}/__blank`);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  page.on('pageerror', (e) => errors.push('uncaught: ' + (e.stack || e.message)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = m.location();
    const text = m.text() + (where?.url ? `  (${where.url.replace(base + '/', '')}:${where.lineNumber})` : '');
    if (!IGNORE.some((re) => re.test(text))) errors.push('console: ' + text);
  });
  page.on('requestfailed', (r) => {
    if (!/net::ERR_ABORTED/.test(r.failure()?.errorText || '')) errors.push(`request failed: ${r.url()} ${r.failure()?.errorText}`);
  });
  const t0 = Date.now(), times = [];
  const mark = (what) => times.push(`${what} ${((Date.now() - t0) / 1000).toFixed(1)}`);
  try {
    await page.goto(`${base}/${p.url}`, { waitUntil: 'load', timeout: 30000 });
    if (p.den) {
      // The splash goes once the den has drawn its first frame; "didn't load" means its import threw.
      await denDrawn(page);
      mark('first frame');
      await play(page, 1500, 8);
      await page.keyboard.press('Space');
      await play(page, 1000, 5);
      await page.keyboard.press('Space');
      await play(page, 500, 3);
      mark('played');
    } else {
      await play(page, 500, 5);
    }
  } catch (e) {
    errors.push('timed out or failed: ' + e.message.split('\n')[0]);
  }
  await page.close();
  if (process.env.SMOKE_TIMES) console.log(`${p.url}: ${times.join(', ')}, closed ${((Date.now() - t0) / 1000).toFixed(1)}`);
  return errors;
}

// ---- the run ----

const list = pages();
if (!list.length) { console.error('smoke: no page matches ' + only.join(' ')); process.exit(1); }
const t0 = Date.now();
const server = await serve(ROOT);
const base = `http://localhost:${server.address().port}`;
// A browser a job: each has a GPU process of its own, and one shared by all would build every page's
// shaders in turn (6 pages at once took five times as long to their first frame).
const launch = () => chromium.launch({ args: GPU_ARGS });
const browsers = [];
const failed = [];
try {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(JOBS, list.length) }, async () => {
    const browser = await launch();
    browsers.push(browser);
    const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
    while (next < list.length) {
      const p = list[next++];
      const errors = await check(context, base, p);
      if (errors.length) {
        failed.push(p.url);
        console.error(`\nFAIL ${p.url}\n` + [...new Set(errors)].map((e) => '  ' + e.replace(/\n/g, '\n    ')).join('\n'));
      }
    }
  }));
} finally {
  await Promise.all(browsers.map((b) => b.close()));
  server.close();
}
const secs = ((Date.now() - t0) / 1000).toFixed(0);
if (failed.length) {
  console.error(`\nsmoke: ${failed.length} of ${list.length} pages failed (${secs}s): ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`smoke: ${list.length} pages ok (${secs}s)`);
