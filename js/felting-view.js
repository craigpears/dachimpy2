// felting-test.html's view (hand-written): a tuft of wool on a foam pad, felted by stabbing it, drawn on a canvas
// from the rules in js/felting.js (src/felting.ts) and its bot in js/felting-bot.js. It owns only the drawing, the
// input and the clock; every rule is the module's. The address keeps the pattern and the seed
// (?pattern=cheese&seed=3), and &watch has the bot felt it at a person's pace.
import { FIRM, Felting, HARD, HOLE, NEEDLES, PATTERNS, WISP_IN, detailColours, patternOf, seeded } from './felting.js';
import { nextMove } from './felting-bot.js';

const q = new URLSearchParams(location.search);
const WATCH = q.has('watch');
const PATTERN = patternOf(q.get('pattern'));
let seed = Number(q.get('seed')) || Math.floor(Math.random() * 1e6);

// The wool's own colours and the foam pad's, as dyed wool is (not the site's theme, as Rumble's balls aren't).
const WOOL = { white: '#f2ece1', black: '#2f2a2a', yellow: '#f0c64a', rind: '#c4762b', green: '#74ad4d', pink: '#ee93ad' };
const FOAM = '#6a8c93', FOAM_DARK = '#557379', FOAM_LIGHT = '#7d9ea4', INK = 'rgba(28, 30, 44, 0.5)';
const WORDS = { white: 'White', black: 'Black', yellow: 'Yellow', rind: 'Rind', green: 'Green', pink: 'Pink' };
const PAD = 0.7;   // the foam showing round the board, in cells
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const $ = (id) => document.getElementById(id);
const canvas = $('felt'), ctx = canvas.getContext('2d');
const wool = document.createElement('canvas'), wctx = wool.getContext('2d');
let game, s = 30, dirty = true, tool = null, feel = false, hover = null, press = null, effects = [], said = [], t0 = 0, botAt = 0, done = false, shownBent = false;

const now = () => performance.now() / 1000;
const colourOf = (letter) => WOOL[PATTERN.wools[letter]] ?? WOOL.white;
const CORE = colourOf(PATTERN.core);
const DETAILS = detailColours(PATTERN);

function start() {
  game = new Felting(PATTERN, seeded(seed));
  tool = null; effects = []; said = []; done = false; dirty = true; botAt = now() + 1;
  const p = new URLSearchParams({ pattern: PATTERN.id, seed });
  history.replaceState(null, '', `?${p}${WATCH ? '&watch' : ''}`);
  $('result').hidden = true;
  tools();
  say(WATCH ? `The bot felting ${PATTERN.name.toLowerCase()}: the strays first, then the wisps, then stab after stab.`
    : `${PATTERN.name}. Tuck the stray wool in first: stab it, outside the outline.`);
  update();
}

function say(line) {
  if (said[0] === line) return;
  said.unshift(line);
  said.length = Math.min(said.length, 2);
  $('said').innerHTML = said.map((l) => `<span>${l}</span>`).join('');
}

// ---- The page round the board ----------------------------------------------------------------------------------

function nav() {
  const links = Object.values(PATTERNS).map((p) => `<a href="?pattern=${p.id}"${p === PATTERN && !WATCH ? ' aria-current="page"' : ''}>${p.name.replace(/^An? /, '').replace(/ \(.*/, '').replace(/^wedge of /, '').toLowerCase()}</a>`);
  links.push(`<a href="?pattern=${PATTERN.id}&watch"${WATCH ? ' aria-current="page"' : ''}>Watch the bot</a>`);
  $('patterns').innerHTML = links.join('');
}

const needleSvg = (state) => `<svg viewBox="0 0 16 40" class="${state === 'gone' ? 'gone' : ''}" aria-hidden="true"><rect class="grip" x="5" y="1" width="6" height="9" rx="2"/>${
  state === 'gone' ? '<path class="shaft" d="M8 10 V20 M9 24 L11 36"/>' : state === 'bent' ? '<path class="shaft" d="M8 10 V24 Q8 30 13 36"/>' : '<path class="shaft" d="M8 10 V38"/>'}</svg>`;

function tools() {
  const buttons = [`<button type="button" data-tool="" aria-pressed="${tool === null}">${needleSvg('ok').replace('<svg', '<svg style="width:12px;height:28px"')}Needle</button>`];
  DETAILS.forEach((d) => buttons.push(`<button type="button" data-tool="${d}" aria-pressed="${tool === d}"><span class="swatch" style="background:${colourOf(d)}"></span>${WORDS[PATTERN.wools[d]]}</button>`));
  buttons.push(`<button type="button" id="feel" aria-pressed="${feel}" title="Show how firm each cell is">Feel</button>`);
  buttons.push(`<span class="needles" id="needles" aria-label="Needles left"></span>`);
  buttons.push(`<button type="button" class="finish" id="finish">Finish</button>`);
  $('tools').innerHTML = buttons.join('');
  for (const b of $('tools').querySelectorAll('[data-tool]')) b.onclick = () => pick(b.dataset.tool || null);
  $('feel').onclick = () => { feel = !feel; dirty = true; tools(); };
  $('finish').onclick = finish;
  needles();
}

function pick(t) {
  if (WATCH) return;
  tool = t;
  for (const b of $('tools').querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', String((b.dataset.tool || null) === tool));
  say(tool ? `${WORDS[PATTERN.wools[tool]]} wool in hand: tap a cell to lay a wisp, tap again to stab it in.` : 'The needle in hand: tap to stab.');
}

function needles() {
  const out = [];
  for (let i = 0; i < NEEDLES; i++) out.push(needleSvg(i >= game.needles ? 'gone' : i === game.needles - 1 && game.bentAt(now()) ? 'bent' : 'ok'));
  $('needles').innerHTML = out.join('');
}

function steps() {
  const l = game.left(), shape = l.soft + l.hard, details = l.details + l.holes;
  const items = [
    [l.strays === 0, `Tuck in the strays${l.strays ? ` (${l.strays})` : ''}`],
    [l.soft === 0, `Firm it evenly${shape ? ` (${l.soft} soft${l.hard ? `, ${l.hard} hard` : ''})` : ''}`],
    [details === 0, `The details${details ? ` (${details} to go)` : ''}`],
  ];
  const at = items.findIndex(([ok]) => !ok);
  $('steps').innerHTML = items.map(([ok, text], i) => `<li class="${ok ? 'done' : i === at ? 'now' : ''}">${i + 1}. ${text}</li>`).join('');
}

function update() { steps(); needles(); dirty = true; }

function finish() {
  if (done) return;
  done = true;
  const sc = game.finish();
  const r = $('result');
  r.hidden = false;
  r.innerHTML = `<h2>${sc.total}</h2><p>${sc.verdict}</p><p class="parts">The pattern ${Math.round(sc.match * 100)}% · even ${Math.round(sc.evenness * 100)}% · needles ${sc.needles} of ${NEEDLES} · ${game.stabs} stabs</p>`
    + `<p class="parts">${[sc.strays && `${sc.strays} stray tufts`, sc.soft && `${sc.soft} soft`, sc.hard && `${sc.hard} hard`, sc.details && `${sc.details} details unfinished`, sc.holes && `${sc.holes} holes not deep`].filter(Boolean).join(', ') || 'Nothing off.'}</p>`;
  say(game.needles ? 'Finished. New tuft for another go.' : 'The last needle snapped: the piece is done as it stands.');
  steps(); needles(); dirty = true;
}

// ---- Sizing ----------------------------------------------------------------------------------------------------

function size() {
  const box = document.querySelector('.board'), coarse = matchMedia('(pointer: coarse)').matches;
  const top = canvas.getBoundingClientRect().top + scrollY;
  const below = (innerWidth <= 620 ? 150 : 170) + (coarse ? 10 : 0);
  const byW = (box.clientWidth - 2) / (game.w + PAD * 2), byH = (innerHeight - Math.min(top, 170) - below) / (game.h + PAD * 2);
  s = Math.max(14, Math.min(byW, byH, 46));
  const dpr = devicePixelRatio || 1, W = (game.w + PAD * 2) * s, H = (game.h + PAD * 2) * s;
  for (const c of [canvas, wool]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  canvas.style.width = `${Math.round(W)}px`;
  canvas.style.height = `${Math.round(H)}px`;
  dirty = true;
}

const centre = (r, c) => ({ x: (c + PAD + 0.5) * s, y: (r + PAD + 0.5) * s });
function cellAt(e) {
  const b = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - b.left) / s - PAD), r = Math.floor((e.clientY - b.top) / s - PAD);
  return game.at(r, c) ? { r, c } : null;
}

// ---- Drawing the wool --------------------------------------------------------------------------------------------

/** A cell's own steady dice, so its fibres stay put as it firms. */
function dice(r, c, k = 0) { return seeded(((r * 73856093) ^ (c * 19349663) ^ (k * 83492791) ^ seed) >>> 0); }

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
  return `rgb(${ch.join(',')})`;
}
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** What colour a cell's felt shows: its core, going over to its wisp's colour as the wisp is stabbed in. */
function feltColour(x) {
  if (!x.wisp) return CORE;
  return mix(CORE, colourOf(x.wisp), x.felt >= WISP_IN ? 1 : x.felt * 0.55);
}

/** Wool fibres round (x, y): n curly strokes of length len, in shades of colour. */
function fibres(g, rand, x, y, n, len, colour, spread, alpha = 0.85, width = 0.05) {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * spread * s;
    const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d;
    const dir = rand() * Math.PI * 2, l = len * s * (0.6 + rand() * 0.6), bend = (rand() - 0.5) * l * 0.9;
    const ex = sx + Math.cos(dir) * l, ey = sy + Math.sin(dir) * l;
    const mx = (sx + ex) / 2 - Math.sin(dir) * bend, my = (sy + ey) / 2 + Math.cos(dir) * bend;
    g.strokeStyle = shade(colour, 0.78 + rand() * 0.42);
    g.globalAlpha = alpha * (0.6 + rand() * 0.4);
    g.lineWidth = width * s * (0.7 + rand() * 0.6);
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
  }
  g.globalAlpha = 1;
}

const firmK = (x) => Math.max(0, Math.min(1, x.firm / HARD));

function drawWool() {
  const dpr = devicePixelRatio || 1, g = wctx, W = (game.w + PAD * 2) * s, H = (game.h + PAD * 2) * s;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // The foam pad: a soft block with its pores.
  const pad = g.createLinearGradient(0, 0, 0, H);
  pad.addColorStop(0, FOAM_LIGHT); pad.addColorStop(1, FOAM);
  g.fillStyle = pad; g.fillRect(0, 0, W, H);
  const pr = seeded(911);
  for (let i = 0; i < W * H / 90; i++) {
    g.fillStyle = pr() < 0.6 ? FOAM_DARK : FOAM_LIGHT;
    g.globalAlpha = 0.35 + pr() * 0.3;
    g.beginPath(); g.arc(pr() * W, pr() * H, 0.6 + pr() * 1.4, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // The outline drawn on the foam, as with a marker before the wool went down.
  outline(g, INK, 0.07, [0.3, 0.22]);

  const inside = [], strays = [];
  for (let r = 0; r < game.h; r++) for (let c = 0; c < game.w; c++) {
    const x = game.grid[r][c];
    if (x.inside) inside.push([r, c, x]); else if (x.wool) strays.push([r, c, x]);
  }
  // The body: puffy blobs, overlapping, casting a soft shadow on the foam. Loose wool's puffier; firm, tighter.
  g.save();
  g.shadowColor = 'rgba(10, 20, 24, 0.45)'; g.shadowBlur = s * 0.5; g.shadowOffsetY = s * 0.12;
  for (const [r, c, x] of inside) {
    const { x: cx, y: cy } = centre(r, c), k = firmK(x);
    g.fillStyle = shade(feltColour(x), 0.95);
    g.beginPath(); g.arc(cx, cy, s * (0.8 - 0.14 * k), 0, Math.PI * 2); g.fill();
  }
  g.restore();
  for (const [r, c, x] of inside) {
    const { x: cx, y: cy } = centre(r, c), k = firmK(x), col = feltColour(x), rad = s * (0.78 - 0.14 * k);
    const rand = dice(r, c);
    const ox = (rand() - 0.5) * 0.12 * s, oy = (rand() - 0.5) * 0.12 * s;
    const grad = g.createRadialGradient(cx + ox - rad * 0.25, cy + oy - rad * 0.3, rad * 0.1, cx, cy, rad);
    // A gentle swell, not a bead: loose wool airy and pale, firm felt flatter and a shade darker.
    grad.addColorStop(0, shade(col, 1.05 - 0.05 * k));
    grad.addColorStop(1, shade(col, 0.96 - 0.14 * k));
    g.fillStyle = grad;
    g.beginPath(); g.arc(cx + ox, cy + oy, rad, 0, Math.PI * 2); g.fill();
  }
  // The fibres: loose wool all wisps reaching over its neighbours, firm felt only a few, short and tight.
  for (const [r, c, x] of inside) {
    const { x: cx, y: cy } = centre(r, c), k = firmK(x);
    fibres(g, dice(r, c, 1), cx, cy, Math.round(15 - 11 * k), 0.55 - 0.3 * k, feltColour(x), 0.5 - 0.15 * k, 0.8, 0.05);
    if (x.wool > 1) fibres(g, dice(r, c, 5), cx, cy, 8 * (x.wool - 1), 0.5, CORE, 0.45, 0.9);
    // A firm cell's felt: fine short marks, tight as a felted surface.
    if (k > 0.5) fibres(g, dice(r, c, 2), cx, cy, 6, 0.12, feltColour(x), 0.38, 0.3, 0.03);
    // A hard cell: a dimple sunk into it.
    if (x.firm >= HARD) {
      const dg = g.createRadialGradient(cx, cy + s * 0.04, 0, cx, cy, s * 0.36);
      dg.addColorStop(0, 'rgba(20, 12, 8, 0.55)'); dg.addColorStop(0.7, 'rgba(20, 12, 8, 0.25)'); dg.addColorStop(1, 'rgba(20, 12, 8, 0)');
      g.fillStyle = dg; g.beginPath(); g.arc(cx, cy, s * 0.36, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.25)'; g.lineWidth = s * 0.04;
      g.beginPath(); g.arc(cx, cy, s * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
  }
  // Wisps laid but not yet stabbed in: a cloud of coloured fibres on top.
  for (const [r, c, x] of inside) {
    if (!x.wisp || x.felt >= WISP_IN) continue;
    const { x: cx, y: cy } = centre(r, c);
    fibres(g, dice(r, c, 3), cx, cy, x.felt ? 9 : 18, x.felt ? 0.4 : 0.6, colourOf(x.wisp), 0.45, 0.95, 0.06);
  }
  // Stray wool off the shape: wispy tufts lying loose on the foam.
  for (const [r, c, x] of strays) {
    const { x: cx, y: cy } = centre(r, c);
    g.fillStyle = CORE; g.globalAlpha = 0.45;
    g.beginPath(); g.arc(cx, cy, s * 0.35, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    fibres(g, dice(r, c, 4), cx, cy, 12 * x.wool, 0.65, CORE, 0.45, 0.9, 0.05);
  }
  // The pattern's marks, faint on top: where the details go and the holes, and the outline again, so it shows
  // through the strays.
  outline(g, INK, 0.035, [0.2, 0.25]);
  for (const [r, c, x] of inside) {
    const { x: cx, y: cy } = centre(r, c);
    if (x.want === HOLE && x.firm < HARD) {
      g.strokeStyle = INK; g.lineWidth = s * 0.05; g.setLineDash([s * 0.09, s * 0.08]);
      g.beginPath(); g.arc(cx, cy, s * 0.26, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    } else if (x.want !== HOLE && x.want !== PATTERN.core && !(x.wisp === x.want && x.felt >= WISP_IN)) {
      g.fillStyle = colourOf(x.want); g.globalAlpha = x.wisp === x.want ? 0.35 : 0.7;
      g.beginPath(); g.arc(cx, cy, s * 0.13, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = INK; g.lineWidth = s * 0.03;
      g.beginPath(); g.arc(cx, cy, s * 0.13, 0, Math.PI * 2); g.stroke();
    }
  }
  if (feel) for (const [r, c, x] of inside) feelPip(g, r, c, x);
}

/** The pattern's outline: the edges between the cells inside it and out. */
function outline(g, colour, width, dash) {
  g.strokeStyle = colour; g.lineWidth = width * s; g.lineCap = 'round'; g.setLineDash(dash.map((d) => d * s));
  g.beginPath();
  for (let r = 0; r <= game.h; r++) for (let c = 0; c <= game.w; c++) {
    const inn = (rr, cc) => !!game.at(rr, cc)?.inside;
    const x0 = (c + PAD) * s, y0 = (r + PAD) * s;
    if (inn(r, c) !== inn(r - 1, c)) { g.moveTo(x0, y0); g.lineTo(x0 + s, y0); }
    if (inn(r, c) !== inn(r, c - 1)) { g.moveTo(x0, y0); g.lineTo(x0, y0 + s); }
  }
  g.stroke(); g.setLineDash([]);
}

/** Feeling the wool: a little dial on each cell, filling to firm (green), red when hard. */
function feelPip(g, r, c, x) {
  const { x: cx, y: cy } = centre(r, c), rad = s * 0.17;
  const want = x.want === HOLE ? HARD : FIRM, hard = x.firm >= HARD, ok = x.want === HOLE ? hard : x.firm >= FIRM && !hard;
  // An empty dial is a faint ring, so loose wool doesn't read as a field of holes.
  g.fillStyle = 'rgba(20, 20, 30, 0.22)'; g.strokeStyle = 'rgba(20, 20, 30, 0.5)'; g.lineWidth = s * 0.03;
  g.beginPath(); g.arc(cx, cy, rad + s * 0.02, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = ok ? '#6fcf7a' : hard ? '#e0574a' : '#9cc4e8';
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, x.firm / want)); g.closePath(); g.fill();
}

// ---- Each frame: the wool, then the needle and what it's doing ---------------------------------------------------

function frame() {
  const t = now();
  if (WATCH && !done && t >= botAt) botMove(t);
  if (dirty) { drawWool(); dirty = false; }
  const bent = game.bentAt(t);
  if (bent !== shownBent) { shownBent = bent; needles(); }
  const dpr = devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(wool, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (hover && !done && !WATCH) {
    const { x, y } = centre(hover.r, hover.c);
    ctx.strokeStyle = css('--accent') || '#e48fae'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(x, y, s * 0.46, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  effects = effects.filter((e) => t < e.t + e.life);
  for (const e of effects) drawEffect(e, (t - e.t) / e.life);
  requestAnimationFrame(frame);
}

function needleLine(x, y, k, bent, colour = '#d9d6dc') {
  // The needle from up and to the right, its point at (x, y) when k is 1.
  const len = s * 1.7, ang = -Math.PI * 0.38, lift = (1 - k) * s * 0.8;
  const tx = x + Math.cos(ang) * lift, ty = y + Math.sin(ang) * lift;
  const hx = tx + Math.cos(ang) * len, hy = ty + Math.sin(ang) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s * 0.09;
  ctx.beginPath(); ctx.moveTo(tx + s * 0.08, ty + s * 0.06); ctx.lineTo(hx + s * 0.08, hy + s * 0.06); ctx.stroke();
  ctx.strokeStyle = colour; ctx.lineWidth = s * 0.06;
  ctx.beginPath(); ctx.moveTo(tx, ty);
  if (bent) ctx.quadraticCurveTo(tx + len * 0.55, ty - len * 0.15, hx + s * 0.4, hy + s * 0.25); else ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = css('--accent2') || '#9d65b9';
  ctx.beginPath(); ctx.arc(bent ? hx + s * 0.4 : hx, bent ? hy + s * 0.25 : hy, s * 0.13, 0, Math.PI * 2); ctx.fill();
}

function drawEffect(e, f) {
  const { x, y } = centre(e.r, e.c);
  if (e.kind === 'stab') {
    const k = f < 0.4 ? f / 0.4 : 1 - (f - 0.4) / 0.6;
    needleLine(x, y, k, e.bent);
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - f)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, s * (0.15 + f * 0.35), 0, Math.PI * 2); ctx.stroke();
  } else if (e.kind === 'tuck') {
    const to = centre(e.to.r, e.to.c), px = x + (to.x - x) * f, py = y + (to.y - y) * f;
    ctx.fillStyle = CORE; ctx.globalAlpha = 0.8 * (1 - f * 0.5);
    ctx.beginPath(); ctx.arc(px, py, s * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    needleLine(px, py, f < 0.3 ? f / 0.3 : 1, false);
  } else if (e.kind === 'snap') {
    for (let i = 0; i < 2; i++) {
      const dx = (i ? 1 : -0.6) * f * s * 1.2, dy = -Math.sin(f * Math.PI) * s * 0.9 + f * f * s;
      ctx.save(); ctx.translate(x + dx, y - s * 0.5 + dy); ctx.rotate((i ? 1 : -1) * f * 5);
      ctx.strokeStyle = '#d9d6dc'; ctx.lineWidth = s * 0.06; ctx.globalAlpha = 1 - f;
      ctx.beginPath(); ctx.moveTo(-s * 0.35, 0); ctx.lineTo(s * 0.35, 0); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = `rgba(255, 220, 120, ${1 - f})`;
    ctx.font = `700 ${Math.round(s * 0.6)}px 'Alegreya', serif`; ctx.textAlign = 'center';
    ctx.fillText('snap!', x, y - s * (0.9 + f * 0.6));
  } else if (e.kind === 'lay') {
    ctx.strokeStyle = colourOf(e.colour); ctx.globalAlpha = 1 - f; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - (1 - f) * s * 0.5, s * 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 1;
}

// ---- Stabbing ----------------------------------------------------------------------------------------------------

function firmWord(x) {
  if (!x.inside) return x.wool ? 'stray wool: stab it to tuck it in' : 'bare foam';
  const f = x.firm, name = f < 1 ? 'loose' : f < 2 ? 'tacked' : f < FIRM ? 'felted, nearly firm' : f < HARD ? 'firm' : 'hard, a dimple';
  if (x.want === HOLE) return f >= HARD ? 'a hole, deep enough' : `a hole: stab it hard (${name} now)`;
  const detail = x.want !== PATTERN.core ? ` · wants ${WORDS[PATTERN.wools[x.want]].toLowerCase()}${x.wisp === x.want ? (x.felt >= WISP_IN ? ', in' : ', laid') : ''}` : '';
  return name + detail;
}

function act(r, c, colour, t) {
  const st = game.stab(r, c, { t, colour });
  if (st.kind === 'none') return st;
  if (st.kind === 'lay') effects.push({ kind: 'lay', r, c, colour, t: now(), life: 0.35 });
  else if (st.kind === 'tuck') effects.push({ kind: 'tuck', r, c, to: st.to, t: now(), life: 0.3 });
  else effects.push({ kind: 'stab', r, c, bent: st.bent, t: now(), life: 0.22 });
  needleNews(st, r, c);
  update();
  if (game.over && !done) finish();
  return st;
}

function needleNews(n, r, c) {
  if (n.snapped) {
    effects.push({ kind: 'snap', r, c, t: now(), life: 0.8 });
    say(game.needles ? `Snap! ${game.needles} needle${game.needles > 1 ? 's' : ''} left. Slow and straight.` : 'Snap! That was the last needle.');
  } else if (n.bent) say('The needle bent: slow down, and stab straight down. Wait a moment and it straightens.');
}

function botMove(t) {
  const m = nextMove(game);
  if (!m) { finish(); return; }
  if (m.colour !== tool) { tool = m.colour; tools(); }
  act(m.r, m.c, m.colour, t);
  botAt = t + (m.colour && game.grid[m.r][m.c].felt === 0 && game.grid[m.r][m.c].wisp === m.colour ? 0.2 : 0.33);
}

canvas.addEventListener('pointerdown', (e) => {
  if (WATCH || done) return;
  const at = cellAt(e);
  if (!at) return;
  canvas.setPointerCapture?.(e.pointerId);
  const st = act(at.r, at.c, tool, now());
  press = { x: e.clientX, y: e.clientY, needle: st.kind !== 'lay' && st.kind !== 'none', twisted: false };
  hover = at;
});
canvas.addEventListener('pointermove', (e) => {
  if (press && press.needle && !press.twisted && Math.hypot(e.clientX - press.x, e.clientY - press.y) > s * 0.55) {
    press.twisted = true;
    const n = game.twist(now());
    if (n.bent || n.snapped) { const at = cellAt(e) ?? hover; needleNews(n, at.r, at.c); update(); if (game.over && !done) finish(); }
  }
  const at = cellAt(e);
  if (at && (hover?.r !== at.r || hover?.c !== at.c) && e.pointerType === 'mouse' && !WATCH) say(`Here: ${firmWord(game.grid[at.r][at.c])}.`);
  hover = e.pointerType === 'mouse' ? at : null;
});
const lift = () => { press = null; };
canvas.addEventListener('pointerup', lift);
canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('pointerleave', () => { hover = null; });

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === '1') pick(null);
  else if (/^[2-9]$/.test(e.key) && DETAILS[Number(e.key) - 2]) pick(DETAILS[Number(e.key) - 2]);
  else if (e.key === 'f' || e.key === 'F') { feel = !feel; dirty = true; tools(); }
  else if (e.key === 'Enter' && !done) finish();
  else return;
  e.preventDefault();
});

$('again').onclick = () => { seed = Math.floor(Math.random() * 1e6); start(); size(); };
$('how').onclick = () => { const h = $('help'); h.hidden = !h.hidden; $('how').setAttribute('aria-expanded', String(!h.hidden)); size(); };
addEventListener('resize', size);

nav();
start();
size();
t0 = now();
frame();
window.felting = () => game;   // (for poking at it from the console)
