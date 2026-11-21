// rumble-test.html's view (hand-written): two Rumble boards side by side, a duel against a bot or two bots
// watched, the rules in js/rumble.js (src/rumble.ts), the bots in js/rumble-bots.js, the boards drawn by
// js/rumble-board.js (the one drawing of them, Jezerbell's werewolf fray's too). It owns only the input, the clock
// and the words; every rule is the module's. The address keeps the seed, the
// bots and the mode: ?seed=7&bot=greedy, or ?watch&seed=7&left=greedy&right=greedy. Normal speed only.
import { CHARGE_TIME, LAUNCH_Y, MAX_AIM, Rumble, SPRINKLE_ROW, WIDTH, seeded } from './rumble.js';
import { rumbleBoards, BOARD_H } from './rumble-board.js';
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

const $ = (id) => document.getElementById(id);
const canvases = [$('board0'), $('board1')];
const boards = rumbleBoards(canvases);
let game, hands, t0, said, held, aim, aimFromKeys, scale = 30;

function start() {
  game = new Rumble(seeded(seed), 0);
  hands = STYLE.map((st, p) => (st ? new Hand(st, p, seeded(seed * 7 + p + 1)) : null));
  t0 = performance.now() / 1000;
  boards.clear();
  said = [];
  held = null;       // the human's held fist: { fist, from }
  aim = 0;
  history.replaceState(null, '', address());
  $('seed').textContent = `seed ${seed}`;
  $('who0').textContent = WATCH ? `${STYLE[0].name}` : 'You';
  $('who0').classList.toggle('you', !WATCH);
  $('who1').textContent = STYLE[1].name;
  say(WATCH ? 'Two bots brawling. Watch what each one\'s clears do to the other\'s board.' : 'Your board\'s on the left. Clear threes, or hold to charge groups for a strike.');
}

const now = () => performance.now() / 1000 - t0;
const name = (p) => (WATCH ? (p === 0 ? 'Left' : 'Right') : p === 0 ? 'You' : 'The bot');
const whose = (p) => (WATCH ? (p === 0 ? "the left board's" : "the right board's") : p === 0 ? 'your' : "the bot's");

function say(line) {
  said.unshift(line);
  said.length = Math.min(said.length, 3);
  $('said').innerHTML = said.map((l) => `<span>${l}</span>`).join('');
}

// ---- What happened, as flashes and words --------------------------------------------------------------------

function take(happenings) {
  boards.take(happenings);
  for (const h of happenings) {
    if (h.what === 'sent') {
      const a = h.attack;
      if (a.kind === 'strike') {
        const rows = a.rows.length, w = a.rows[0].length;
        say(`${name(h.p)} sent a strike: ${a.groups} groups, ${rows} row${rows > 1 ? 's' : ''} by ${w}${a.bruises ? `, ${a.bruises} bruised` : ''}, coming in at the top ${a.from} of ${whose(h.to)} board.`);
      } else say(`${name(h.p)} sent ${a.balls.length} sprinkles, coming up from the foot of ${whose(h.to)} board.`);
    }
    if (h.what === 'lost') say(WATCH ? `${name(h.p)} is knocked out. ${name(1 - h.p)} wins.` : h.p === 0 ? 'Knocked out! The bot wins. New rumble?' : 'The bot\'s knocked out. You win!');
  }
}

// ---- Drawing ------------------------------------------------------------------------------------------------

function size() {
  // The two boards and the gap between them across the room there is (the container's own width, so never past the edge).
  const box = document.querySelector('.boards'), gap = parseFloat(getComputedStyle(box).columnGap) || 0;
  const w = box.clientWidth - gap - 2;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const top = canvases[0].getBoundingClientRect().top + scrollY;
  const below = (innerWidth <= 620 ? 56 : 90) + (coarse ? 66 : 0);
  const byW = w / 2 / WIDTH, byH = (innerHeight - Math.min(top, 160) - below) / BOARD_H;
  scale = Math.max(14, Math.min(byW, byH, 46));
  boards.size(scale);
}

function draw(p, t) {
  boards.draw(p, t, { game, hands, you: WATCH ? -1 : 0, aim, held });
  const s = game.sides[p], n = s.board.charges.length;
  $(`stat${p}`).innerHTML = `<b>${n}</b> charged · sprinkles <b>${s.queue}</b>/${SPRINKLE_ROW} · row in <b>${s.toRow()}</b>`;
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
  if (game.canFire(0)) game.fire(0, fist, aim, charged, t);
  else held.later = true;            // let go while a ball's in the air: it fires, uncharged, when it lands
  if (!held.later) held = null;
  $(`fist${fist}`).classList.remove('held');
}
function aimAt(ev) {
  const r = canvases[0].getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * WIDTH, y = ((ev.clientY - r.top) / r.height) * BOARD_H;
  const dy = Math.min(-0.2, y - LAUNCH_Y);
  aim = Math.max(-MAX_AIM, Math.min(MAX_AIM, Math.atan2(x - WIDTH / 2, -dy)));
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
  if (aimFromKeys) aim = Math.max(-MAX_AIM, Math.min(MAX_AIM, aim + aimFromKeys * dt * 1.4));
  if (!game.over()) {
    // A fist let go while its ball was in the air fires once it's landed.
    if (held?.later && game.canFire(0)) { game.fire(0, held.fist, aim, false, t); held = null; }
    // A button held while the last ball's in the air starts charging the moment it lands (Boothook's guide).
    if (held && !held.later && !game.canFire(0)) held.from = t;
    if (!WATCH && !held) game.sides[0].aim = aim;
    for (const h of hands) h?.play(game, t);
    game.tick(t);
    take(game.drain());
  }
  boards.prune(t);
  draw(0, t);
  draw(1, t);
  requestAnimationFrame(frame);
}

start();
wire();
size();
requestAnimationFrame(frame);
