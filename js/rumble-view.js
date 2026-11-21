// rumble-test.html's view (hand-written): two Rumble boards side by side, a duel against a bot or two bots
// watched, drawn on canvases from the rules in js/rumble.js (src/rumble.ts) and the bots in js/rumble-bots.js. It
// owns only the drawing, the input and the clock; every rule is the module's. The address keeps the seed, the
// bots and the mode: ?seed=7&bot=greedy, or ?watch&seed=7&left=greedy&right=greedy. Normal speed only.
import { CHARGE_TIME, COLOURS, LAUNCH_X, LAUNCH_Y, LINE_Y, MAX_AIM, R, ROW_H, Rumble, SHOT_CLOCK, SPRINKLE_ROW, W, WIDTH, seeded } from './rumble.js';
import { Hand, STYLES } from './rumble-bots.js';

const q = new URLSearchParams(location.search);
const WATCH = q.has('watch');
let seed = Number(q.get('seed')) || Math.floor(Math.random() * 1e6);
const styleOf = (id) => STYLES[id] ?? STYLES.greedy;
const STYLE = WATCH ? [styleOf(q.get('left')), styleOf(q.get('right'))] : [null, styleOf(q.get('bot'))];

/** The address for this rumble, so it can be played again or sent. */
function address() {
  const p = new URLSearchParams();
  if (WATCH) { p.set('watch', ''); p.set('seed', seed); p.set('left', STYLE[0].id); p.set('right', STYLE[1].id); }
  else { p.set('seed', seed); p.set('bot', STYLE[1].id); }
  return '?' + p.toString().replace('watch=&', 'watch&');
}

// The ball colours: the puzzle's own five, as the real game draws them (not the site's theme).
const BALL = { red: '#d8402f', orange: '#ee8a24', yellow: '#f2d23c', aqua: '#3fc9c4', blue: '#3366d6' };
const HEX = COLOURS.map((n) => BALL[n]);
const BOARD_H = LAUNCH_Y + 1.1;            // the board's height in ball widths, the fists under the line
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const $ = (id) => document.getElementById(id);
const canvases = [$('board0'), $('board1')];
const ctxs = canvases.map((c) => c.getContext('2d'));
let game, hands, t0, effects, moving, said, held, target, aimFromKeys, scale = 30;
const TARGET = () => ({ x: WIDTH / 2, y: LINE_Y * 0.45 });

function start() {
  game = new Rumble(seeded(seed), 0);
  hands = STYLE.map((st, p) => (st ? new Hand(st, p, seeded(seed * 7 + p + 1)) : null));
  t0 = performance.now() / 1000;
  effects = [];      // flashes: { p, t, kind, ... }
  moving = [new Map(), new Map()];   // balls of an attack still on their way in, by id: { from, t, dur }
  said = [];
  held = null;       // the human's held fist: { fist, from }
  target = TARGET();  // where you're aiming: both fists point at it
  history.replaceState(null, '', address());
  $('seed').textContent = `seed ${seed}`;
  $('who0').textContent = WATCH ? `${STYLE[0].name}` : 'You';
  $('who0').classList.toggle('you', !WATCH);
  $('who1').textContent = STYLE[1].name;
  say(WATCH ? 'Two bots brawling. Watch what each one\'s clears do to the other\'s board.' : 'Your board\'s on the left. Clear threes, or hold to charge groups for a strike.');
}

const now = () => performance.now() / 1000 - t0;
const name = (p) => (WATCH ? (p === 0 ? 'Left' : 'Right') : p === 0 ? 'You' : 'The bot');
const whose = (p) => (WATCH ? (p === 0 ? 'the left' : 'the right') : p === 0 ? 'your' : "the bot's");

function say(line) {
  said.unshift(line);
  said.length = Math.min(said.length, 3);
  $('said').innerHTML = said.map((l) => `<span>${l}</span>`).join('');
}

// ---- What happened, as flashes and words --------------------------------------------------------------------

function take(happenings) {
  for (const h of happenings) {
    if (h.what === 'fired') effects.push({ p: h.p, kind: 'flight', t: h.t, until: h.lands, path: h.path, c: null, fist: h.fist, charged: h.charged });
    if (h.what === 'landed') {
      const fl = effects.find((e) => e.kind === 'flight' && e.p === h.p);
      if (fl) fl.until = -1;
      for (const g of h.outcome.gone) effects.push({ p: h.p, kind: g.fell ? 'fall' : 'pop', t: h.t, until: h.t + 0.6, r: g.r, c: g.c, ball: g.ball });
      if (h.outcome.kind === 'charge') effects.push({ p: h.p, kind: 'ring', t: h.t, until: h.t + 0.7, cell: h.outcome.cell });
    }
    if (h.what === 'sent') {
      const a = h.attack;
      if (a.kind === 'strike') {
        const rows = a.rows.length, w = a.rows[0].length;
        say(`${name(h.p)} sent a strike: ${a.groups} groups, ${rows} row${rows > 1 ? 's' : ''} by ${w}${a.bruises ? `, ${a.bruises} bruised` : ''}, coming in at the top ${a.from} of ${whose(h.to)} board.`);
      } else say(`${name(h.p)} sent ${a.balls.length} sprinkles, coming up from the foot of ${whose(h.to)} board.`);
    }
    if (h.what === 'hit') {
      effects.push({ p: h.p, kind: 'hit', t: h.t + 0.5, until: h.t + 2.2, cells: h.cells, attack: h.attack.kind });
      arrive(h, happenings.some((x) => x.what === 'row' && x.p === h.p));
    }
    if (h.what === 'row') effects.push({ p: h.p, kind: 'row', t: h.t, until: h.t + 0.5 });
    if (h.what === 'lost') say(WATCH ? `${name(h.p)} is knocked out. ${name(1 - h.p)} wins.` : h.p === 0 ? 'Knocked out! The bot wins. New rumble?' : 'The bot\'s knocked out. You win!');
  }
}

/** An attack coming in, animated: sprinkles rising from the foot of the board up their columns one after another; a
    strike punched in from the top, the balls under it shoved down its height, the board shaking. Only the drawing:
    the rules have already put every ball where it ends up. */
function arrive(h, rowAfter) {
  const b = game.sides[h.p].board, m = moving[h.p];
  const at = (id) => { const c = b.find(id); return c && { ...c, end: b.centre(c.r, c.c) }; };
  if (h.attack.kind === 'sprinkle') {
    h.attack.balls.forEach(({ ball }, i) => {
      const c = at(ball.id);
      if (!c) return;
      const from = { x: c.end.x, y: LAUNCH_Y + 1.4 }, dist = from.y - c.end.y;
      m.set(ball.id, { from, t: h.t + i * 0.07, dur: 0.25 + dist / 18, ease: easeOut });
    });
    effects.push({ p: h.p, kind: 'shake', t: h.t, until: h.t + 0.3, dx: 0, dy: 0.06 });
    return;
  }
  const rows = h.attack.rows, hgt = rows.length, w = rows[0].length;
  const c0 = h.attack.from === 'left' ? 0 : W - w, mine = new Set(rows.flat().map((x) => x.id));
  const dur = 0.42;
  for (const { r, c, ball } of b.balls()) {
    if (c < c0 || c >= c0 + w || (rowAfter && r === 0 && !mine.has(ball.id))) continue;
    // Where it was before the strike: its height higher up the same column (a ball of the strike, above the top).
    m.set(ball.id, { from: b.centre(r - hgt, c), t: h.t, dur, ease: punch });
  }
  effects.push({ p: h.p, kind: 'shake', t: h.t + dur * 0.7, until: h.t + dur * 0.7 + 0.35, dx: 0.12, dy: 0.05 });
}
const easeOut = (f) => 1 - (1 - f) ** 3;
const punch = (f) => { const k = 1.9; return 1 + (k + 1) * (f - 1) ** 3 + k * (f - 1) ** 2; };   // in fast, a little past, back

/** Where a ball is drawn: its cell, or on its way there. */
function placed(p, ball, end, t) {
  const mv = moving[p].get(ball.id);
  if (!mv) return end;
  const f = (t - mv.t) / mv.dur;
  if (f >= 1) { moving[p].delete(ball.id); return end; }
  if (f <= 0) return mv.from;
  const k = mv.ease(f);
  return { x: mv.from.x + (end.x - mv.from.x) * k, y: mv.from.y + (end.y - mv.from.y) * k };
}

/** The angle a fist fires at to hit where you're aiming. */
function angleFor(fist) {
  const dy = Math.max(0.2, LAUNCH_Y - target.y);
  return Math.max(-MAX_AIM, Math.min(MAX_AIM, Math.atan2(target.x - LAUNCH_X[fist], dy)));
}

// ---- Drawing ------------------------------------------------------------------------------------------------

function size() {
  // The two boards and the gap between them across the room there is (the container's own width, so never past the edge).
  const boards = document.querySelector('.boards'), gap = parseFloat(getComputedStyle(boards).columnGap) || 0;
  const w = boards.clientWidth - gap - 2;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const top = canvases[0].getBoundingClientRect().top + scrollY;
  const below = (innerWidth <= 620 ? 56 : 90) + (coarse ? 66 : 0);
  const byW = w / 2 / WIDTH, byH = (innerHeight - Math.min(top, 160) - below) / BOARD_H;
  scale = Math.max(14, Math.min(byW, byH, 46));
  const dpr = devicePixelRatio || 1;
  for (const c of canvases) {
    c.style.width = `${Math.round(WIDTH * scale)}px`;
    c.style.height = `${Math.round(BOARD_H * scale)}px`;
    c.width = Math.round(WIDTH * scale * dpr);
    c.height = Math.round(BOARD_H * scale * dpr);
  }
}

function ballAt(ctx, x, y, colour, { bruise = 0, charged = false, order = 0, alpha = 1, rad = R * 0.94 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const base = HEX[colour];
  const g = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad);
  g.addColorStop(0, bruise ? shade(base, bruise === 2 ? 0.25 : 0.5) : shade(base, 1.35));
  g.addColorStop(1, bruise ? shade(base, bruise === 2 ? 0.12 : 0.3) : base);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  if (bruise) {
    // A bruise: its colour half showing; dark has two marks, bruised one.
    ctx.strokeStyle = shade(base, 0.9); ctx.lineWidth = 0.08;
    for (let i = 0; i < bruise; i++) { const o = (i - (bruise - 1) / 2) * 0.22; ctx.beginPath(); ctx.moveTo(x - 0.22 + o, y - 0.22); ctx.lineTo(x + 0.22 + o, y + 0.22); ctx.stroke(); }
  }
  if (charged) {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 160);
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`; ctx.lineWidth = 0.09;
    ctx.beginPath(); ctx.arc(x, y, rad - 0.04, 0, Math.PI * 2); ctx.stroke();
    if (order) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 0.12;
      ctx.font = '700 0.5px "Alegreya Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(String(order), x, y + 0.02); ctx.fillText(String(order), x, y + 0.02);
    }
  }
  ctx.restore();
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
  return `rgb(${ch.join(',')})`;
}

function pathPoint(path, f) {
  let total = 0;
  const seg = [];
  for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y); seg.push(d); total += d; }
  let want = f * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, want / seg[i]) : 1; return { x: path[i].x + (path[i + 1].x - path[i].x) * k, y: path[i].y + (path[i + 1].y - path[i].y) * k }; }
    want -= seg[i];
  }
  return path[path.length - 1];
}

function draw(p, t) {
  const ctx = ctxs[p], s = game.sides[p], b = s.board, dpr = devicePixelRatio || 1;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.clearRect(0, 0, WIDTH, BOARD_H);
  ctx.fillStyle = css('--well') || '#241b1b';
  ctx.fillRect(0, 0, WIDTH, BOARD_H);
  ctx.fillStyle = css('--tile') || 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, LINE_Y, WIDTH, BOARD_H - LINE_Y);
  // The line: below it, you're out.
  ctx.strokeStyle = css('--accent') || '#e48fae'; ctx.lineWidth = 0.06; ctx.setLineDash([0.25, 0.18]);
  ctx.beginPath(); ctx.moveTo(0, LINE_Y); ctx.lineTo(WIDTH, LINE_Y); ctx.stroke(); ctx.setLineDash([]);

  // A row coming in slides the board down a row; an attack landing shakes it.
  const row = effects.find((e) => e.p === p && e.kind === 'row' && e.until > t);
  const shake = effects.find((e) => e.p === p && e.kind === 'shake' && e.until > t && e.t <= t);
  ctx.save();
  if (row) ctx.translate(0, -ROW_H * (1 - easeOut((t - row.t) / (row.until - row.t))));
  if (shake) { const k = 1 - (t - shake.t) / (shake.until - shake.t), w = Math.sin((t - shake.t) * 70) * k; ctx.translate(shake.dx * w, shake.dy * w); }

  for (const { r, c, ball } of b.balls()) {
    if (r > 40) continue;
    const { x, y } = placed(p, ball, b.centre(r, c), t), order = b.charges.indexOf(ball.id) + 1;
    ballAt(ctx, x, y, ball.c, { bruise: ball.bruise, charged: order > 0, order });
  }
  // What just landed from the other side: ringed, fading.
  for (const e of effects) {
    if (e.p !== p || e.until < t) continue;
    const f = Math.max(0, (t - e.t) / (e.until - e.t));
    if (e.kind === 'hit' && e.t <= t) {
      ctx.strokeStyle = e.attack === 'strike' ? `rgba(255,90,60,${1 - f})` : `rgba(255,255,255,${1 - f})`; ctx.lineWidth = 0.1;
      for (const { r, c } of e.cells) { const { x, y } = b.centre(r, c); ctx.beginPath(); ctx.arc(x, y, R * 1.02, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (e.kind === 'ring') { const { x, y } = b.centre(e.cell.r, e.cell.c); ctx.strokeStyle = `rgba(255,255,255,${1 - f})`; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.arc(x, y, R + f * 0.8, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.restore();
  // Clears and falls (where they were, so drawn without the row's shake).
  for (const e of effects) {
    if (e.p !== p || e.until < t || (e.kind !== 'pop' && e.kind !== 'fall')) continue;
    const f = (t - e.t) / (e.until - e.t), at = b.centre(e.r, e.c);
    if (e.kind === 'pop') ballAt(ctx, at.x, at.y, e.ball.c, { bruise: e.ball.bruise, alpha: 1 - f, rad: R * (0.94 + f * 0.5) });
    else ballAt(ctx, at.x, at.y + f * f * 8, e.ball.c, { bruise: e.ball.bruise, alpha: 1 - f * 0.6 });
  }

  // The aim: where your mouse is, a cross, and where each fist's ball would go from there, in that ball's colour;
  // once a fist's held, only its line (one ball fires, never both). For a bot, its plan.
  const lines = [];
  if (!WATCH && p === 0 && !game.over()) {
    for (const fist of [0, 1]) if (!held || held.fist === fist) lines.push({ fist, angle: angleFor(fist), strong: !!held });
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.06;
    const { x, y } = target;
    ctx.beginPath(); ctx.arc(x, y, 0.3, 0, Math.PI * 2); ctx.moveTo(x - 0.5, y); ctx.lineTo(x - 0.15, y); ctx.moveTo(x + 0.15, y); ctx.lineTo(x + 0.5, y);
    ctx.moveTo(x, y - 0.5); ctx.lineTo(x, y - 0.15); ctx.moveTo(x, y + 0.15); ctx.lineTo(x, y + 0.5); ctx.stroke();
  }
  const hand = hands[p];
  if (hand?.plan && game.canFire(p)) lines.push({ fist: hand.plan.option.fist, angle: hand.plan.option.angle, strong: true });
  for (const l of lines) {
    const { path, cell } = b.shot(l.fist, l.angle), colour = shade(HEX[s.fists[l.fist][0]], 1.3);
    ctx.save();
    ctx.globalAlpha = l.strong ? 0.9 : 0.5; ctx.strokeStyle = colour; ctx.lineWidth = l.strong ? 0.07 : 0.05; ctx.setLineDash([0.18, 0.16]);
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); for (const pt of path.slice(1)) ctx.lineTo(pt.x, pt.y); ctx.stroke();
    ctx.restore();
    const at = b.centre(cell.r, cell.c);
    ballAt(ctx, at.x, at.y, s.fists[l.fist][0], { alpha: l.strong ? 0.5 : 0.3 });
  }

  // The ball in the air.
  const fl = effects.find((e) => e.p === p && e.kind === 'flight' && e.until > t);
  if (s.flying && fl) {
    const f = Math.max(0, Math.min(1, (t - fl.t) / (fl.until - fl.t))), pt = pathPoint(fl.path, f);
    ballAt(ctx, pt.x, pt.y, s.flying.c, { charged: fl.charged });
  }

  // The fists: the ball in each, the next one beside it, charging when held.
  for (const fist of [0, 1]) {
    const x = LAUNCH_X[fist], y = LAUNCH_Y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x, y, 0.62, 0, Math.PI * 2); ctx.fill();
    ballAt(ctx, x, y, s.fists[fist][0], {});
    ballAt(ctx, x + (fist === 0 ? -1 : 1) * 0.95, y + 0.25, s.fists[fist][1], { rad: 0.28 });
    const ch = chargeOf(p, fist, t);
    if (ch > 0) {
      ctx.strokeStyle = ch >= 1 ? '#fff' : 'rgba(255,255,255,0.8)'; ctx.lineWidth = ch >= 1 ? 0.14 : 0.09;
      ctx.beginPath(); ctx.arc(x, y, 0.66, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ch); ctx.stroke();
    }
  }
  // The shot clock: a bar under the fists, going red at the end.
  const left = s.clock(game.over() ? 0 : t) / SHOT_CLOCK;
  ctx.fillStyle = left < 0.3 ? 'rgba(255,90,60,0.9)' : 'rgba(255,255,255,0.35)';
  ctx.fillRect(WIDTH / 2 - 1.5, BOARD_H - 0.32, 3 * left, 0.14);

  // Warnings: a strike coming at its top corner, sprinkles at the foot.
  for (const { attack } of s.incoming) {
    ctx.save();
    ctx.font = '700 0.62px "Alegreya Sans", sans-serif'; ctx.textBaseline = 'middle';
    const blink = 0.55 + 0.45 * Math.sin(performance.now() / 120);
    if (attack.kind === 'strike') {
      const w = attack.rows[0].length, h = attack.rows.length, x0 = attack.from === 'left' ? 0 : WIDTH - w - 0.5;
      ctx.fillStyle = `rgba(255,70,40,${0.25 * blink})`; ctx.fillRect(x0, 0, w + 0.5, h * 0.87 + 0.15);
      ctx.fillStyle = `rgba(255,220,200,${blink})`; ctx.textAlign = attack.from === 'left' ? 'left' : 'right';
      ctx.fillText(`STRIKE ${h}×${w}`, attack.from === 'left' ? 0.2 : WIDTH - 0.2, h * 0.87 + 0.5);
    } else {
      ctx.fillStyle = `rgba(255,255,255,${0.2 * blink})`; ctx.fillRect(0, LINE_Y - 0.1, WIDTH, 0.4);
      ctx.fillStyle = `rgba(255,255,255,${blink})`; ctx.textAlign = 'center';
      ctx.fillText(`▲ ${attack.balls.length} SPRINKLES`, WIDTH / 2, LINE_Y - 0.5);
    }
    ctx.restore();
  }

  if (game.over()) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, WIDTH, BOARD_H);
    ctx.fillStyle = '#fff'; ctx.font = '700 1.1px "Alegreya", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(game.winner === p ? 'Wins!' : 'Knocked out', WIDTH / 2, BOARD_H / 2);
  }

  const n = b.charges.length;
  $(`stat${p}`).innerHTML = `<b>${n}</b> charged · sprinkles <b>${s.queue}</b>/${SPRINKLE_ROW} · row in <b>${s.toRow()}</b>`;
}

/** How far a fist's ball is through charging, 0 to 1. */
function chargeOf(p, fist, t) {
  if (hands[p]) { const c = hands[p].charging(t); return c && c.fist === fist ? c.t : 0; }
  if (!held || held.fist !== fist || !game.canFire(0)) return 0;
  return Math.min(1, (t - held.from) / CHARGE_TIME);
}

// ---- Your fists ---------------------------------------------------------------------------------------------

function press(fist) {
  if (WATCH || game.over() || held) return;
  held = { fist, from: now() };
  $(`fist${fist}`).classList.add('held');
}
function release(fist) {
  if (!held || held.fist !== fist) return;
  const t = now();
  const charged = t - held.from >= CHARGE_TIME;
  if (game.canFire(0)) game.fire(0, fist, angleFor(fist), charged, t);
  else held.later = true;            // let go while a ball's in the air: it fires, uncharged, when it lands
  if (!held.later) held = null;
  $(`fist${fist}`).classList.remove('held');
}
function aimAt(ev) {
  const r = canvases[0].getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * WIDTH, y = ((ev.clientY - r.top) / r.height) * BOARD_H;
  target = { x: Math.max(0.2, Math.min(WIDTH - 0.2, x)), y: Math.max(0.3, Math.min(LINE_Y, y)) };
  aimFromKeys = false;
}

function wire() {
  const c = canvases[0];
  c.addEventListener('pointermove', (ev) => { if (!WATCH) aimAt(ev); });
  c.addEventListener('pointerdown', (ev) => {
    if (WATCH) return;
    aimAt(ev);
    if (ev.pointerType === 'mouse') { press(ev.button === 2 ? 1 : 0); c.setPointerCapture(ev.pointerId); }
  });
  c.addEventListener('pointerup', (ev) => { if (ev.pointerType === 'mouse') release(ev.button === 2 ? 1 : 0); });
  c.addEventListener('contextmenu', (ev) => ev.preventDefault());
  for (const fist of [0, 1]) {
    const btn = $(`fist${fist}`);
    btn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); btn.setPointerCapture(ev.pointerId); press(fist); });
    btn.addEventListener('pointerup', () => release(fist));
    btn.addEventListener('pointercancel', () => release(fist));
    btn.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }
  const keys = { KeyZ: 0, KeyX: 1 };
  addEventListener('keydown', (ev) => {
    if (ev.code in keys) { if (!ev.repeat) press(keys[ev.code]); ev.preventDefault(); }
    if (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight') { aimFromKeys = ev.code === 'ArrowLeft' ? -1 : 1; ev.preventDefault(); }
  });
  addEventListener('keyup', (ev) => {
    if (ev.code in keys) release(keys[ev.code]);
    if (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight') aimFromKeys = false;
  });
  $('again').addEventListener('click', () => { seed = Math.floor(Math.random() * 1e6); start(); });
  $('how').addEventListener('click', () => {
    const open = $('help').hidden;
    $('help').hidden = !open;
    $('how').setAttribute('aria-expanded', String(open));
    size();
  });
  $('mode-play').href = `?seed=${seed}&bot=${STYLE[1].id}`;
  $('mode-watch').href = `?watch&seed=${seed}&left=${(STYLE[0] ?? STYLE[1]).id}&right=${STYLE[1].id}`;
  $(WATCH ? 'mode-watch' : 'mode-play').setAttribute('aria-current', 'page');
  if (WATCH) { $('fists').style.display = 'none'; $('keys').style.display = 'none'; }
  addEventListener('resize', size);
}

let last = 0;
function frame() {
  const t = now();
  const dt = Math.min(0.1, t - last);
  last = t;
  if (aimFromKeys) target = { ...target, x: Math.max(0.2, Math.min(WIDTH - 0.2, target.x + aimFromKeys * dt * 6)) };
  if (!game.over()) {
    // A fist let go while its ball was in the air fires once it's landed.
    if (held?.later && game.canFire(0)) { game.fire(0, held.fist, angleFor(held.fist), false, t); held = null; }
    // A button held while the last ball's in the air starts charging the moment it lands (Boothook's guide).
    if (held && !held.later && !game.canFire(0)) held.from = t;
    if (!WATCH) game.sides[0].aim = angleFor(0);   // the shot clock fires the left fist where you're aiming
    for (const h of hands) h?.play(game, t);
    game.tick(t);
    take(game.drain());
  }
  effects = effects.filter((e) => e.until > t);
  draw(0, t);
  draw(1, t);
  requestAnimationFrame(frame);
}

start();
wire();
size();
requestAnimationFrame(frame);
