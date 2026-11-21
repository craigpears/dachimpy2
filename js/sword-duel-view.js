// The Swordfight duel test page (swordfight-duel-test.html), hand-written: both boards side by side, you against a
// bot, or ?watch two bots. The rules are js/swordfight.js (src/swordfight.ts, the one Swordfight: the den's armoury
// plays the same board), the bots js/sword-bots.js, each board drawn by js/sword-duel-board.js (the den's swords).
// Everything the page was dealt with is in its address: ?seed=, ?bot= (or ?watch&bots=a,b), ?swords=a,b.
import { Duel, SWORDS, W, H, seeded } from './swordfight.js';
import { BOTS, Hand } from './sword-bots.js';
import { duelBoard, STRIP } from './sword-duel-board.js';

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

let duel, hands, over, nextT;
function start() {
  history.replaceState(null, '', address());
  duel = new Duel({ random: seeded(seed), swords: [SWORDS[swordNames[0]], SWORDS[swordNames[1]]] });
  hands = botNames.map((n, i) => (n ? new Hand(BOTS[n], i) : null));
  boards.forEach((b) => b.clear());
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
    for (const s of l.swords) boards[t.side].flash(s.cells);
    if (l.sprinkles.length) boards[t.side].flash(l.sprinkles);
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

// ---- drawing (the board itself: js/sword-duel-board.js, the one drawing of a duel's board) ----
const boards = [duelBoard($('c0')), duelBoard($('c1'))];
function layout() {
  const main = document.querySelector('.duel');
  main.style.height = `${Math.max(320, innerHeight - main.getBoundingClientRect().top + scrollY)}px`;
  const box = document.querySelector('.boards').getBoundingClientRect();
  const label = document.querySelector('.who').getBoundingClientRect().height + 4;
  const gap = parseFloat(getComputedStyle(document.querySelector('.boards')).columnGap) || 12;
  const cell = Math.max(10, Math.floor(Math.min((box.width - gap) / (2 * W + 0.4), (box.height - label) / (H + STRIP + 0.3), 44)));
  boards.forEach((b) => b.size(cell));
}
addEventListener('resize', layout);

function drawSide(i, dt) {
  const s = duel.sides[i];
  boards[i].draw(s, dt);
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
