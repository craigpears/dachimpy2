// The Swordfight duel test page (swordfight-duel-test.html), hand-written: both boards side by side, you against a
// bot, or ?watch two bots. The rules are js/swordfight.js (src/swordfight.ts, the one Swordfight: the den's armoury
// plays the same board), the bots js/sword-bots.js, the pieces' look js/den-sword-draw.js (the den's swords).
// Everything the page was dealt with is in its address: ?seed=, ?bot= (or ?watch&bots=a,b), ?swords=a,b.
import { Duel, SWORDS, W, H, seeded } from './swordfight.js';
import { BOTS, Hand } from './sword-bots.js';
import { PALETTE, drawSword, drawBreaker } from './den-sword-draw.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const watch = q.has('watch');
const pick = (name) => (BOTS[name] ? name : 'greedy');
const botNames = watch ? (q.get('bots') ?? 'greedy,greedy').split(',').map(pick) : [null, pick(q.get('bot') ?? 'greedy')];
const swordNames = (q.get('swords') ?? 'cutlass,cutlass').split(',').map((s) => (SWORDS[s] ? s : 'cutlass'));
let seed = Number(q.get('seed')) || Math.floor(Math.random() * 1e6) + 1;

// The address keeps what this duel was dealt, so a link brings it back.
function address(over = {}) {
  const w = over.watch ?? watch;
  const bits = w ? ['watch', `bots=${(over.bots ?? (watch ? botNames : ['greedy', 'greedy'])).join(',')}`] : [`bot=${over.bot ?? botNames[1] ?? 'greedy'}`];
  if (swordNames.join(',') !== 'cutlass,cutlass') bits.push(`swords=${swordNames.map(encodeURIComponent).join(",")}`);
  bits.push(`seed=${over.seed ?? seed}`);
  return '?' + bits.join('&');
}
$(watch ? 'watch' : 'play').setAttribute('aria-current', 'page');
$('play').href = address({ watch: false, seed });
$('watch').href = address({ watch: true, seed });

const nice = (s) => s[0].toUpperCase() + s.slice(1);
const botLabel = (n) => `${nice(n)} bot`;
const names = watch ? botNames.map((n, i) => `${botLabel(n)} ${i ? '(right)' : '(left)'}`) : ['You', botLabel(botNames[1])];
names.forEach((n, i) => { $(`name${i}`).textContent = n; $(`sword${i}`).textContent = swordNames[i]; });

let duel, hands, flashes, over, nextT;
function start() {
  history.replaceState(null, '', address());
  duel = new Duel({ random: seeded(seed), swords: [SWORDS[swordNames[0]], SWORDS[swordNames[1]]] });
  hands = botNames.map((n, i) => (n ? new Hand(BOTS[n], i) : null));
  flashes = [[], []];
  over = false;
  nextT = 0;
  $('over').hidden = true;
  say(watch ? 'Two bots, the same pairs: watch what each break does to the other board.' : 'Your board on the left. Break on your colour to send it at the bot.');
}
$('again').onclick = () => { seed = Math.floor(Math.random() * 1e6) + 1; start(); };
$('overAgain').onclick = $('again').onclick;
$('helpBtn').onclick = () => {
  const h = $('help');
  h.hidden = !h.hidden;
  $('helpBtn').setAttribute('aria-expanded', String(!h.hidden));
  layout();
};

// ---- your keys (Puzzle Pirates' own: arrows move, up and down turn, Space drops) ----
function key(k) {
  if (watch || over) return;
  const b = duel.sides[0].board;
  if (!b.falling) return;
  if (k === 'left') b.move(-1);
  else if (k === 'right') b.move(1);
  else if (k === 'ccw') b.rotate(-1);
  else if (k === 'cw') b.rotate(1);
  else if (k === 'drop') turned(duel.drop(0));
}
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'ccw', ArrowDown: 'cw', ' ': 'drop' };
addEventListener('keydown', (e) => {
  const k = KEYS[e.key];
  if (!k || e.target.closest?.('button, a') && e.key === ' ') return;
  e.preventDefault();
  if (k === 'drop' && e.repeat) return;
  key(k);
});
$('pad').hidden = watch;
for (const btn of $('pad').querySelectorAll('button')) btn.addEventListener('pointerdown', (e) => { e.preventDefault(); key(btn.dataset.k); });

// ---- what happened: what broke and was sent, and where it came in ----
const CHAINS = ['', '', 'a double', 'a triple', 'a bingo', 'a donkey', 'a vegas'];
function attackWords(a) {
  const bits = a.strikes.map((s) => `a ${s.w}x${s.h}${s.vertical ? '' : ' sideways'} sword`);
  if (a.sprinkles) bits.push(`${a.sprinkles} sprinkle${a.sprinkles > 1 ? 's' : ''}`);
  return bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}` : bits[0];
}
function turned(t) {
  if (!t) return;
  for (const l of t.landed) {
    for (const s of l.swords) flashes[t.side].push({ cells: s.cells, t: 1.2 });
    if (l.sprinkles.length) flashes[t.side].push({ cells: l.sprinkles, t: 1.2 });
  }
  if (t.sent) {
    const who = names[t.side], chain = CHAINS[Math.min(t.result.links.length, 6)];
    const to = watch ? 'the other board' : t.side ? 'you' : 'the bot';
    const when = watch ? "that board's pair lands" : t.side ? 'your pair lands' : 'its pair lands';
    say(`${who}${chain ? `, ${chain}` : ''}: ${attackWords(t.sent)} at ${to}. It comes in when ${when}.`);
  }
  const landed = t.landed.reduce((n, l) => n + l.swords.length + l.sprinkles.length, 0);
  if (landed && !t.sent) {
    const insta = duel.over && t.landed.some((l) => l.swords.some((s) => s.cells.some(([, c]) => c === 3)));
    const where = watch ? `On the ${t.side ? 'right' : 'left'} board` : t.side ? "On the bot's board" : 'On your board';
    say(`${where}: ${t.landed.map((l) => l.swords.length + l.sprinkles.length ? attackWords({ strikes: l.swords.map((s) => size(s)), sprinkles: l.sprinkles.length }) : '').filter(Boolean).join(', ')} came in${insta ? ', into the fourth column: an insta!' : '.'}`);
  }
  ended();
}
// A sword come in, by its squares.
function size(s) {
  const rs = s.cells.map(([r]) => r), cs = s.cells.map(([, c]) => c);
  return { w: Math.max(...cs) - Math.min(...cs) + 1, h: Math.max(...rs) - Math.min(...rs) + 1, vertical: s.vertical };
}
function say(s) { $('say').textContent = s; }
function ended() {
  if (over || !duel.over) return;
  over = true;
  const w = duel.winner;
  $('overText').textContent = watch ? `${names[w]} wins` : w === 0 ? 'You win!' : `${names[1]} wins`;
  const whose = watch ? `The ${w ? 'left' : 'right'} board's` : w ? 'Your' : "The bot's";
  $('overSub').textContent = `${whose} fourth column filled. Seed ${seed}.`;
  $('over').hidden = false;
  if (watch) nextT = 6;   // watching: the next duel by itself
}

// ---- drawing ----
const cv = [$('c0'), $('c1')], ctx = cv.map((c) => c.getContext('2d'));
let cell = 24;
const STRIP = 1.3;   // the strip over a board where waiting attacks show, in squares
function layout() {
  const main = document.querySelector('.duel');
  main.style.height = `${Math.max(320, innerHeight - main.getBoundingClientRect().top + scrollY)}px`;
  const box = document.querySelector('.boards').getBoundingClientRect();
  const label = document.querySelector('.who').getBoundingClientRect().height + 4;
  const gap = parseFloat(getComputedStyle(document.querySelector('.boards')).columnGap) || 12;
  cell = Math.max(10, Math.floor(Math.min((box.width - gap) / (2 * W + 0.4), (box.height - label) / (H + STRIP + 0.3), 44)));
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (const c of cv) {
    c.style.width = `${cell * W}px`;
    c.style.height = `${cell * (H + STRIP)}px`;
    c.width = Math.round(cell * W * dpr);
    c.height = Math.round(cell * (H + STRIP) * dpr);
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
addEventListener('resize', layout);

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// The attack blocks' iron greys, as the den's banded crates (js/den/sword.js).
const GREY = { light: '#c9c6c0', base: '#8f8b84', dark: '#3c3934' };
function box(x, X, Y, w, h, pal, alpha = 1) {
  const g = x.createLinearGradient(X, Y, X + w, Y + h);
  g.addColorStop(0, pal.light); g.addColorStop(0.55, pal.base); g.addColorStop(1, pal.dark);
  x.globalAlpha = alpha;
  x.fillStyle = g;
  x.beginPath(); x.roundRect(X + 1, Y + 1, w - 2, h - 2, Math.max(2, cell * 0.14)); x.fill();
  x.strokeStyle = pal.dark; x.lineWidth = 1.5; x.stroke();
  x.globalAlpha = 1;
}
function block(x, g, X, Y, w = cell, h = cell) {
  if (g.breaker && !g.grey) { drawBreaker(x, g.c, X, Y, cell); return; }
  if (g.grey === 2) {   // opaque grey: banded shut
    box(x, X, Y, w, h, GREY);
    x.strokeStyle = GREY.dark; x.lineWidth = 1;
    x.beginPath(); x.moveTo(X + 3, Y + h * 0.33); x.lineTo(X + w - 3, Y + h * 0.33); x.moveTo(X + 3, Y + h * 0.67); x.lineTo(X + w - 3, Y + h * 0.67); x.stroke();
    return;
  }
  const pal = PALETTE[g.c];
  box(x, X, Y, w, h, pal);
  const s = Math.min(w, h);
  drawSword(x, g.c, X + (w - s * 0.6) / 2, Y + (h - s * 0.86) / 2, s * 0.6, s * 0.86, 'rgba(255,248,230,0.45)', pal.dark);
  if (g.grey === 1) box(x, X, Y, w, h, GREY, 0.55);   // see-through grey: the colour showing through
}

function drawSide(i, dt) {
  const x = ctx[i], s = duel.sides[i], b = s.board, top = STRIP * cell;
  const Y = (r) => top + (H - 1 - r) * cell;
  x.clearRect(0, 0, cell * W, cell * (H + STRIP));
  // the well, and the fourth column's top marked: fill it and you've lost
  x.fillStyle = css('--well'); x.fillRect(0, top, cell * W, cell * H);
  x.fillStyle = css('--tile'); for (let c = 0; c < W; c += 2) x.fillRect(c * cell, top, cell, cell * H);
  x.fillStyle = css('--accent'); x.globalAlpha = 0.35; x.fillRect(3 * cell, top, cell, cell * 2); x.globalAlpha = 1;
  x.strokeStyle = css('--edge'); x.lineWidth = 2; x.strokeRect(1, top + 1, cell * W - 2, cell * H - 2);
  // the pieces: fused blocks and swords just come in drawn whole, the rest a square each
  const units = new Map();
  for (const p of b.snap()) {
    const key = p.g.sword !== undefined ? `s${p.g.sword}` : p.fuse !== undefined ? `f${p.fuse}` : null;
    if (!key) { block(x, p.g, p.c * cell, Y(p.r)); continue; }
    const u = units.get(key) ?? { g: p.g, r0: p.r, r1: p.r, c0: p.c, c1: p.c, sword: key[0] === 's' };
    Object.assign(u, { r0: Math.min(u.r0, p.r), r1: Math.max(u.r1, p.r), c0: Math.min(u.c0, p.c), c1: Math.max(u.c1, p.c) });
    units.set(key, u);
  }
  for (const u of units.values()) {
    const X = u.c0 * cell, YY = Y(u.r1), w = (u.c1 - u.c0 + 1) * cell, h = (u.r1 - u.r0 + 1) * cell;
    if (!u.sword) { block(x, u.g, X, YY, w, h); continue; }
    // a sword just come in: its picture, silver, for a turn
    box(x, X, YY, w, h, { light: '#f4f2ee', base: GREY.light, dark: GREY.dark });
    x.save();
    if (w > h) { x.translate(X + w / 2, YY + h / 2); x.rotate(Math.PI / 2); x.translate(-(X + w / 2), -(YY + h / 2)); }
    const sw = Math.min(w, h), sh = Math.max(w, h);
    drawSword(x, 1, X + w / 2 - sw * 0.35, YY + h / 2 - sh * 0.46, sw * 0.7, sh * 0.92, '#ffffff', GREY.dark);
    x.restore();
  }
  // the falling pair, and a ghost where it'll land
  const f = b.falling;
  if (f) {
    const cells = b.fallingCells();
    x.globalAlpha = 0.28;
    const flat = f.rot % 2 === 1;
    cells.forEach(([r, c], k) => {
      let gr = b.height(c);
      if (!flat) gr += cells[k][0] > cells[1 - k][0] ? 1 : 0;
      if (gr < H) block(x, f.pair[k], c * cell, Y(gr));
    });
    x.globalAlpha = 1;
    cells.forEach(([r, c], k) => { if (r < H) block(x, f.pair[k], c * cell, Y(r)); });
  }
  // what just came in, lit up
  for (const fl of flashes[i]) {
    fl.t -= dt;
    x.strokeStyle = css('--accent-hi'); x.lineWidth = 3; x.globalAlpha = Math.max(0, Math.min(1, fl.t));
    for (const [r, c] of fl.cells) x.strokeRect(c * cell + 2, Y(r) + 2, cell - 4, cell - 4);
    x.globalAlpha = 1;
  }
  flashes[i] = flashes[i].filter((fl) => fl.t > 0);
  // the strip: attacks waiting to come in, flashing
  if (s.incoming.length) {
    x.globalAlpha = 0.65 + 0.35 * Math.sin(performance.now() / 140);
    x.fillStyle = css('--text');
    x.font = `700 ${Math.max(11, Math.round(cell * 0.5))}px 'Alegreya Sans', sans-serif`;
    x.textBaseline = 'middle';
    const swords = s.incoming.flatMap((a) => a.strikes.map((k) => `${k.w}x${k.h}`)), n = s.incoming.reduce((t, a) => t + a.sprinkles, 0);
    const words = [swords.length ? `⚔ ${swords.join(' ')}` : '', n ? `${n} sprinkle${n > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ');
    x.fillText(`incoming: ${words}`, 4, top * 0.5, cell * W - 8);
    x.globalAlpha = 1;
  }
  $(`sent${i}`).textContent = s.sent.sprinkles + s.sent.squares ? `sent ${s.sent.sprinkles + s.sent.squares}` : '';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!over) {
    for (const t of duel.update(dt)) turned(t);
    for (const h of hands) if (h && !over) turned(h.update(duel, dt));
  } else if (nextT > 0 && (nextT -= dt) <= 0) { seed++; start(); }
  drawSide(0, dt);
  drawSide(1, dt);
  requestAnimationFrame(frame);
}
// For checking from the console: the duel, and time run on (each step as a frame would).
window.swordDuel = {
  get duel() { return duel; },
  run(seconds, step = 1 / 30) {
    for (let t = 0; t < seconds && !over; t += step) {
      for (const tn of duel.update(step)) turned(tn);
      for (const h of hands) if (h && !over) turned(h.update(duel, step));
    }
  },
};
start();
layout();
document.fonts?.ready.then(layout);
requestAnimationFrame(frame);
