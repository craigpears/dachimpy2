// The phone check (16 Nov; the user: menus and controls take "a disproportionate amount of the space" on a phone,
// "can I actually see the action?"): every page of the site, as the smoke tests open them (tools/site.mjs), at a
// phone's size with touch, measured with no tokens spent, and a screenshot each for the reviewer
// (tools/mobile-review.md) to judge against RULES.md's "On a phone".
//
//   npm run mobile                        every page, portrait
//   npm run mobile -- blockade wolfden    only the pages whose address has one of these in it
//   npm run mobile -- --landscape         portrait and landscape
//   npm run mobile -- --root ../other     another checkout's pages (a branch not merged yet), measured from here
//   npm run mobile -- --review blockade   then a headless Claude reviews those pages (tools/mobile-review.md),
//                                         their problems put on cards; a few pages at a time, it's token heavy
//   MOBILE_JOBS=4                         how many pages at once (default: half the cores, at most 6)
//
// What it measures on each page, a few seconds after it's drawn (the den's after its splash goes):
//   - cover: how much of the action (the biggest canvas, the 3D or a board) HTML panels, buttons and words paint
//     over, and of its middle; and which panels, biggest first
//   - chrome: how much of the screen fixed or sticky bars and panels take, on any page
//   - taps: buttons and links smaller than a fingertip (THRESHOLDS.tap), links in a run of words excepted
//   - text: words smaller than THRESHOLDS.text
//   - edge: things cut off at the screen's edge (or its foot, on a page that doesn't scroll), a sideways scroll
// Writes mobile-report/ (gitignored): report.md (the pages ranked, worst first, each one's flags), report.json
// (everything, examples included) and shots/<page>.jpg. A run of a few pages is merged into the last run's report,
// replacing those pages. Flags pages rather than failing: it exits 0 either way.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { sitePages, serve, play, denDrawn, GPU_ARGS } from './site.mjs';
import { plainEnv } from './task.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(HERE, 'mobile-report');

/** What's flagged: every threshold in one place. */
export const THRESHOLDS = {
  cover: 0.25,      // of the action covered by panels, buttons and words
  middle: 0.15,     // of the action's middle (its central 60% each way) covered
  chrome: 0.2,      // of the screen taken by fixed or sticky bars and panels (any page)
  tap: 44,          // px: a button or link smaller than this either way is under a fingertip
  taps: 3,          // more than this many small tap targets
  text: 12,         // px: words smaller than this
  texts: 5,         // more than this many small bits of words
  edge: 0,          // more than this many things cut off at the edge
};

const PHONE = {
  portrait: { width: 390, height: 844 },
  landscape: { width: 844, height: 390 },
};
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

// ---- what's said on the command line ----

const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); if (i < 0) return false; args.splice(i, 1); return true; };
const value = (f) => { const i = args.indexOf(f); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const LANDSCAPE = flag('--landscape');
const REVIEW = flag('--review');
const ROOT = path.resolve(HERE, value('--root') ?? '.');
const FROM = ROOT === HERE ? '' : path.basename(ROOT); // another checkout's pages are marked with its name
const only = args;
const JOBS = Number(process.env.MOBILE_JOBS) || Math.max(1, Math.min(6, Math.floor(os.cpus().length / 2)));

function pages() {
  const { den, other } = sitePages(ROOT);
  // a page drawing a canvas (three.js, a board) is waited on until it's drawn one, past its loading screen
  const draws = (url) => /three|<canvas|getContext/.test(fs.readFileSync(path.join(ROOT, url.split('?')[0]), 'utf8'));
  const all = [...den.map((url) => ({ url, den: true })), ...other.map((url) => ({ url, den: false, canvas: draws(url) }))];
  return only.length ? all.filter((p) => only.some((o) => p.url.includes(o))) : all;
}

/** A page's name for its screenshot. */
export const slug = (url, orient = 'portrait') =>
  url.replace(/&as=dachimpy|\?as=dachimpy$/, '').replace(/\.html/, '').replace(/[?&=]+/g, '-').replace(/[^\w-]/g, '').replace(/-+$/, '') +
  (orient === 'portrait' ? '' : '.' + orient);

// ---- measuring, in the page ----

// Run in the page: everything it measures, no screenshots or tokens. Cells of CELL px over the screen, each marked
// painted if a visible element paints there: a background, a border, an image, a control, or its words.
export function measure({ T, CELL }) {
  const W = innerWidth, H = innerHeight;
  const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
  const name = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    const words = (el.innerText || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim();
    return words ? `${s} "${words.slice(0, 40)}${words.length > 40 ? '...' : ''}"` : s;
  };
  const seen = (el) => el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true;
  const alpha = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c === 'transparent' ? 0 : 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };

  // The action: the biggest canvas showing, if it takes a good part of the screen.
  const canvases = [...document.querySelectorAll('canvas')].filter(seen).map((c) => {
    const r = c.getBoundingClientRect();
    const a = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
    return { c, r, a };
  }).sort((a, b) => b.a - a.a);
  const action = canvases[0] && canvases[0].a > 0.3 * W * H ? canvases[0] : null;
  const under = new Set(); // the action and what holds it
  for (let e = action?.c; e; e = e.parentElement) under.add(e);

  // An element's box cut down by what clips it (overflow hidden or scrolling) and the screen.
  const clipCache = new Map();
  const clipOf = (el) => {
    if (!el || el === document.body || el === document.documentElement) return { l: 0, t: 0, r: W, b: H };
    if (clipCache.has(el)) return clipCache.get(el);
    const up = clipOf(el.parentElement);
    const cs = getComputedStyle(el);
    let out = up;
    if (cs.position === 'fixed') out = { l: 0, t: 0, r: W, b: H };
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const r = el.getBoundingClientRect();
      out = { l: Math.max(out.l, r.left), t: Math.max(out.t, r.top), r: Math.min(out.r, r.right), b: Math.min(out.b, r.bottom) };
    }
    clipCache.set(el, out);
    return out;
  };
  const fixedOf = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };

  // The panel each painted bit belongs to: its outermost ancestor that isn't the action or what holds it.
  const panelOf = (el) => { let p = el; while (p.parentElement && !under.has(p.parentElement) && p.parentElement !== document.body) p = p.parentElement; return p; };

  const cover = new Int32Array(cols * rows).fill(-1); // a cell's panel, -1 for none
  const chrome = new Uint8Array(cols * rows);
  const panels = [];
  const panelIx = new Map();
  const paint = (el, r) => {
    const c = clipOf(el.parentElement);
    const l = Math.max(r.left, c.l, 0), t = Math.max(r.top, c.t, 0), rr = Math.min(r.right, c.r, W), b = Math.min(r.bottom, c.b, H);
    if (rr - l < 1 || b - t < 1) return;
    if (T.debug && (rr - l) * (b - t) > 0.3 * W * H) T.debug.push(`${name(el)} ${Math.round(l)},${Math.round(t)} ${Math.round(rr - l)}x${Math.round(b - t)}`);
    const p = panelOf(el);
    if (!panelIx.has(p)) { panelIx.set(p, panels.length); panels.push(p); }
    const ix = panelIx.get(p), fixed = fixedOf(el);
    for (let y = Math.floor(t / CELL); y < Math.ceil(b / CELL); y++) for (let x = Math.floor(l / CELL); x < Math.ceil(rr / CELL); x++) {
      cover[y * cols + x] = ix;
      if (fixed) chrome[y * cols + x] = 1;
    }
  };
  const CONTROLS = 'a[href],button,input,select,textarea,summary,[role=button],[role=tab],[role=menuitem],[onclick],label[for]';
  const taps = [], texts = [], edges = [];
  const scrolls = document.documentElement.scrollHeight > H + 2 && getComputedStyle(document.body).overflowY !== 'hidden' && getComputedStyle(document.documentElement).overflowY !== 'hidden';

  for (const el of document.body.querySelectorAll('*')) {
    if (under.has(el) || el.closest('script,style,noscript,template,head') || !seen(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) continue;
    const cs = getComputedStyle(el);
    const paints = alpha(cs.backgroundColor) > 0.1 || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) > 0 && alpha(cs.borderTopColor) > 0.1
      || /^(IMG|SVG|VIDEO|CANVAS|INPUT|SELECT|TEXTAREA|BUTTON|PROGRESS|METER)$/i.test(el.tagName);
    // a flash, a vignette, a tint over the whole scene (nothing to press, no words) is an effect, not a panel
    const effect = cs.pointerEvents === 'none' && r.width * r.height > 0.5 * W * H && !el.innerText?.trim();
    if (paints && !effect) paint(el, r);
    // its own words, each line's box
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const b of range.getClientRects()) paint(el, b);
      const size = parseFloat(cs.fontSize);
      if (size < T.text) texts.push({ el, size, words: n.textContent.trim().slice(0, 40) });
    }
    // too small to tap (a link in a run of words is all right: WCAG's inline exception)
    if (el.matches(CONTROLS) && cs.pointerEvents !== 'none' && !el.disabled) {
      const inline = el.tagName === 'A' && cs.display === 'inline' && el.parentElement?.closest('p,li,dd,td,figcaption,blockquote');
      if (!inline && (r.width < T.tap || r.height < T.tap)) taps.push({ el, w: Math.round(r.width), h: Math.round(r.height) });
    }
    // cut off at the edge (inside something that clips it is fine: it scrolls or it's meant to)
    if (paints || el.matches(CONTROLS)) {
      const c = clipOf(el.parentElement);
      const offSide = r.right > Math.min(W, c.r) + 1 || r.left < Math.max(0, c.l) - 1;
      const offFoot = !scrolls && (r.bottom > Math.min(H, c.b) + 1);
      if ((offSide || offFoot) && c.r >= W - 1 && c.l <= 1) edges.push({ el, side: offSide ? (r.right > W ? 'right' : 'left') : 'foot', by: Math.round(offSide ? Math.max(r.right - W, -r.left) : r.bottom - H) });
    }
  }
  // only the outermost of each (a panel off the edge, not every button in it)
  const outer = (list) => list.filter((x) => !list.some((y) => y !== x && y.el.contains(x.el)));

  // the action covered, and its middle
  let inAction = 0, covered = 0, mid = 0, midCovered = 0, chromeCells = 0;
  const byPanel = new Map();
  const a = action?.r;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x, px = (x + 0.5) * CELL, py = (y + 0.5) * CELL;
    if (chrome[i]) chromeCells++;
    if (!a || px < a.left || px > a.right || py < a.top || py > a.bottom) continue;
    inAction++;
    const isMid = px > a.left + 0.2 * a.width && px < a.right - 0.2 * a.width && py > a.top + 0.2 * a.height && py < a.bottom - 0.2 * a.height;
    if (isMid) mid++;
    if (cover[i] < 0) continue;
    covered++; if (isMid) midCovered++;
    byPanel.set(cover[i], (byPanel.get(cover[i]) || 0) + 1);
  }
  const round = (v) => Math.round(v * 1000) / 1000;
  return {
    screen: { w: W, h: H },
    action: action ? { what: name(action.c), x: Math.round(a.left), y: Math.round(a.top), w: Math.round(a.width), h: Math.round(a.height) } : null,
    cover: action ? round(covered / Math.max(1, inAction)) : null,
    middle: action ? round(midCovered / Math.max(1, mid)) : null,
    chrome: round(chromeCells / (cols * rows)),
    ...(T.debug && { debug: T.debug }),
    panels: [...byPanel].sort((p, q) => q[1] - p[1]).slice(0, 8).map(([ix, n]) => ({ panel: name(panels[ix]), share: round(n / Math.max(1, inAction)) })),
    taps: taps.length, tapExamples: taps.slice(0, 8).map((t) => `${name(t.el)} ${t.w}x${t.h}`),
    texts: texts.length, textExamples: texts.slice(0, 8).map((t) => `${t.size}px "${t.words}" in ${name(t.el).split(' ')[0]}`),
    edges: outer(edges).length, edgeExamples: outer(edges).slice(0, 8).map((e) => `${name(e.el)} off the ${e.side} by ${e.by}px`),
    sideways: document.documentElement.scrollWidth > W + 1 ? document.documentElement.scrollWidth - W : 0,
  };
}

/** A page's flags: what's over THRESHOLDS, in words. */
export function flags(m, T = THRESHOLDS) {
  const pc = (v) => Math.round(v * 100) + '%';
  const out = [];
  if (m.error) return [`didn't load: ${m.error}`];
  if (m.cover != null && m.cover > T.cover) out.push(`action ${pc(m.cover)} covered`);
  if (m.middle != null && m.middle > T.middle) out.push(`its middle ${pc(m.middle)} covered`);
  if (m.chrome > T.chrome) out.push(`fixed bars and panels take ${pc(m.chrome)} of the screen`);
  if (m.taps > T.taps) out.push(`${m.taps} tap targets under ${T.tap}px`);
  if (m.texts > T.texts) out.push(`${m.texts} bits of words under ${T.text}px`);
  if (m.edges > T.edge) out.push(`${m.edges} cut off at the edge`);
  if (m.sideways) out.push(`scrolls sideways ${m.sideways}px`);
  return out;
}

/** How bad a page is, to rank them: the action covered counts most. */
export const score = (m) => m.error ? 1000 :
  100 * (m.cover ?? 0) + 100 * (m.middle ?? 0) + 50 * m.chrome + 2 * Math.min(m.taps, 20) + Math.min(m.texts, 20) + 10 * Math.min(m.edges, 5) + (m.sideways ? 20 : 0);

// ---- the run ----

async function check(context, base, p, orient) {
  const page = await context.newPage();
  const shot = path.join(OUT, 'shots', (FROM ? FROM + '.' : '') + slug(p.url, orient) + '.jpg');
  let m;
  try {
    await page.goto(`${base}/__blank`);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${base}/${p.url}`, { waitUntil: 'load', timeout: 30000 });
    if (p.den) await denDrawn(page);
    if (p.canvas) await page.waitForFunction(() => [...document.querySelectorAll('canvas')].some((c) => c.offsetWidth * c.offsetHeight > 0.3 * innerWidth * innerHeight), null, { timeout: 15000 }).catch(() => {});
    await play(page, p.den ? 3000 : 800, 10, 8000);
    m = await page.evaluate(measure, { T: THRESHOLDS, CELL: 10 });
    await page.screenshot({ path: shot, type: 'jpeg', quality: 70 });
  } catch (e) {
    m = { error: e.message.split('\n')[0] };
  }
  await page.close();
  return { url: p.url, orient, ...(FROM && { from: FROM }), shot: path.relative(HERE, shot).replace(/\\/g, '/'), ...m };
}

const key = (r) => `${r.from ?? ''}|${r.url}|${r.orient}`;
const label = (r) => (r.from ? `[${r.from}] ` : '') + r.url + (r.orient === 'portrait' ? '' : ` (${r.orient})`);

/** This run's pages ranked, written into the report with the last run's other pages. */
function report(fresh, secs) {
  for (const r of fresh) { r.flags = flags(r); r.score = Math.round(score(r)); }
  let old = [];
  try { old = JSON.parse(fs.readFileSync(path.join(OUT, 'report.json'), 'utf8')).pages ?? []; } catch { /* none yet */ }
  const now = new Set(fresh.map(key));
  const results = [...old.filter((r) => !now.has(key(r))), ...fresh];
  const rank = (list) => list.sort((a, b) => b.flags.length - a.flags.length || b.score - a.score);
  rank(results);
  const pc = (v) => v == null ? '' : Math.round(v * 100) + '%';
  const md = [
    `# Phone check, ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, '',
    `${results.length} pages at ${PHONE.portrait.width}x${PHONE.portrait.height} (landscape marked), worst first; ${results.filter((r) => r.flags.length).length} flagged; ` +
    `the last run ${fresh.length} of them (${secs}s). Thresholds in tools/mobile.mjs (THRESHOLDS); the principles they stand for in RULES.md, "On a phone".`, '',
    '| page | cover | middle | chrome | small taps | small text | off edge | flags |',
    '|---|---|---|---|---|---|---|---|',
    ...results.map((r) => `| [${label(r)}](${r.shot.replace(/^mobile-report\//, '')}) | ${pc(r.cover)} | ${pc(r.middle)} | ${pc(r.chrome)} | ${r.taps ?? ''} | ${r.texts ?? ''} | ${r.edges ?? ''} | ${r.flags.join('; ')} |`),
    '', '## Each flagged page', '',
    ...results.filter((r) => r.flags.length).flatMap((r) => [
      `### ${label(r)}`, '',
      `Shot: ${r.shot}. ${r.flags.join('; ')}.`, '',
      ...(r.panels?.length ? ['Covering the action: ' + r.panels.map((p) => `${p.panel} ${pc(p.share)}`).join(', ') + '.', ''] : []),
      ...(r.tapExamples?.length ? ['Small taps: ' + r.tapExamples.join('; ') + '.', ''] : []),
      ...(r.textExamples?.length ? ['Small text: ' + r.textExamples.join('; ') + '.', ''] : []),
      ...(r.edgeExamples?.length ? ['Off the edge: ' + r.edgeExamples.join('; ') + '.', ''] : []),
    ]),
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ when: new Date().toISOString(), root: ROOT, thresholds: THRESHOLDS, pages: results }, null, 1));
  fs.writeFileSync(path.join(OUT, 'report.md'), md + '\n');
  return rank(fresh);
}

/** The reviewer: a headless Claude (Sonnet) given tools/mobile-review.md and these pages' measurements, allowed to
 *  read the report and screenshots and change cards only through the task script, as the board's inbox is sorted. */
function review(results) {
  const pagesText = JSON.stringify(results.map(({ url, orient, from, shot, flags, cover, middle, chrome, panels, tapExamples, textExamples, edgeExamples, sideways, error }) =>
    ({ url, orient, from, shot, flags, cover, middle, chrome, panels, tapExamples, textExamples, edgeExamples, sideways, error })), null, 1);
  const prompt = fs.readFileSync(path.join(HERE, 'tools', 'mobile-review.md'), 'utf8').replaceAll('{{pages}}', pagesText).replaceAll('{{root}}', ROOT);
  const tools = ['Read', 'Grep', 'Glob', 'Bash(node tools/task.mjs:*)'].join(',');
  return new Promise((ok) => {
    const child = spawn('claude', ['-p', '--model', 'sonnet', '--allowedTools', tools], { cwd: HERE, env: plainEnv(), stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
    child.on('error', (e) => { console.error(`mobile: couldn't start Claude: ${e.message}`); ok(1); });
    child.on('close', ok);
    child.stdin.end(prompt);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const list = pages();
  if (!list.length) { console.error('mobile: no page matches ' + only.join(' ')); process.exit(1); }
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const t0 = Date.now();
  const server = await serve(ROOT);
  const base = `http://localhost:${server.address().port}`;
  const jobs = (LANDSCAPE ? ['portrait', 'landscape'] : ['portrait']).flatMap((orient) => list.map((p) => ({ p, orient })));
  const results = [], browsers = [];
  try {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, async () => {
      const browser = await chromium.launch({ args: GPU_ARGS });
      browsers.push(browser);
      const contexts = {};
      while (next < jobs.length) {
        const { p, orient } = jobs[next++];
        contexts[orient] ??= await browser.newContext({ viewport: PHONE[orient], screen: PHONE[orient], isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: UA });
        results.push(await check(contexts[orient], base, p, orient));
      }
    }));
  } finally {
    await Promise.all(browsers.map((b) => b.close()));
    server.close();
  }
  const ranked = report(results, ((Date.now() - t0) / 1000).toFixed(0));
  const worst = ranked.filter((r) => r.flags.length);
  console.log(`mobile: ${ranked.length} pages, ${worst.length} flagged; worst first:`);
  for (const r of worst.slice(0, 12)) console.log(`  ${label(r)}: ${r.flags.join('; ')}`);
  console.log(`report: ${path.relative(HERE, path.join(OUT, 'report.md'))}`);
  if (REVIEW) process.exit(await review(ranked));
}
