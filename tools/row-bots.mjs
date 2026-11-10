/* Bots that row: mirror strokes against the plain split board (TODO.md, "Test mirror strokes on a
   page of its own", 10 Nov). A check on the skill curve: if better play goes much further, and the
   gap grows with lookahead, there's depth to it.

   Run on the compiled js (npm run build first) with Node 22 (Node 18 won't load the site's ES
   modules as they are): node_modules/node/bin/node.exe tools/row-bots.mjs [games] [moves] [width]
   - games: seeded games per bot (default 40), moves: moves a game (default 60), width: how many
     first moves the two-ply bot looks past (default all 60; fewer samples the best by one ply),
     variants: comma-separated, from 'split move,mirror move,split clocked,mirror clocked' (the
     default, all four; 'clocked' pairs the sides as the den's Oars do, a move every WINDOW),
     kinds: kinds of piece on each board (default KINDS_DEFAULT; Bilge's own is 7), specials:
     'specials' for pufferfish, crabs and jellyfish at the den's late odds (default none).

   The bots:
   - random: any swap.
   - greedy: the swap worth most now, tried on copies of the boards (it sees the boards, not what
     comes in at the bottom, so the copies get new pieces of their own).
   - two-ply: the swap worth most with the best follow-up after it.
   "Worth" is how far a stroke takes her up the course (the way she started), rowed as the page rows
   her, less a square for every quarter turn she's left heading off it. */

import { Course, KINDS_DEFAULT, MirrorRow, SplitRow, seeded } from '../js/mirror-row.js';
import { ROW } from '../js/rowing.js';
import { H, W } from '../js/bilge.js';

const GAMES = Number(process.argv[2]) || 40, MOVES = Number(process.argv[3]) || 60;
const WIDTH = Number(process.argv[4]) || H * (W - 1);
const ALL = [];
for (let r = 0; r < H; r++) for (let c = 0; c < W - 1; c++) ALL.push([r, c]);

/** Her heading, as pull turned (to starboard more than nothing), wrapped to a half circle either way. */
const wrap = (h) => { const full = 4 * ROW.STEP; return ((h + full / 2) % full + full) % full - full / 2; };
/** Squares up the course a quarter turn off it is reckoned to cost (she has to be turned back). */
const OFF = 1;
const DY = [1, 0, -1, 0];

/** Where she stands: how far up the course, pull still building counted as part of a square, less
    for heading off it (pull still waiting for the other side counted as turning her). */
function standing(st) {
  const h = st.turned * ROW.STEP + st.oars.swing + st.oars.pending();
  return st.y + DY[st.heading] * st.oars.ahead / ROW.STEP - OFF * Math.abs(wrap(h)) / ROW.STEP;
}

/** The state after a stroke of pull p, rowed as the page rows her. */
function after(st, p) {
  const oars = st.oars.copy();
  const c = Object.assign(new Course(), { x: 0, y: st.y, heading: st.heading, turned: st.turned });
  for (const step of oars.row(p)) c.go(step);
  return { y: c.y, heading: c.heading, turned: c.turned, oars };
}

const stateOf = (row) => ({ y: row.course.y, heading: row.course.heading, turned: row.course.turned, oars: row.stroke });

/** What a stroke's worth, from state st: how much further up the course it leaves her. */
function worth(p, st) {
  const n = after(st, p);
  return { v: standing(n) - standing(st), h: n };
}

const pick = (xs, rnd) => xs[Math.floor(rnd() * xs.length)];

function best(row, h, rnd) {
  let top = -Infinity, at = [];
  for (const [r, c] of ALL) {
    const t = row.tryMove(r, c, rnd), w = worth(t.pull, h);
    if (w.v > top + 1e-9) { top = w.v; at = [[r, c]]; } else if (Math.abs(w.v - top) <= 1e-9) at.push([r, c]);
  }
  return { v: top, move: pick(at, rnd) };
}

const BOTS = {
  random: (row, rnd) => pick(ALL, rnd),
  greedy: (row, rnd) => best(row, stateOf(row), rnd).move,
  'two-ply': (row, rnd) => {
    const h = stateOf(row);
    let first = ALL.map(([r, c]) => { const t = row.tryMove(r, c, rnd), w = worth(t.pull, h); return { r, c, t, w }; });
    if (WIDTH < first.length) {
      // The best by one ply, and a few of the moves that clear nothing (the setting-up ones) at random.
      first.sort((a, b) => b.w.v - a.w.v);
      const quiet = first.filter((f) => Math.abs(f.w.v) < 1e-9), keep = first.slice(0, Math.ceil(WIDTH / 2));
      while (keep.length < WIDTH && quiet.length) keep.push(quiet.splice(Math.floor(rnd() * quiet.length), 1)[0]);
      first = keep;
    }
    let top = -Infinity, at = [];
    for (const f of first) {
      const v = f.w.v + best(f.t.copy, f.w.h, rnd).v;
      if (v > top + 1e-9) { top = v; at = [[f.r, f.c]]; } else if (Math.abs(v - top) <= 1e-9) at.push([f.r, f.c]);
    }
    return pick(at, rnd);
  },
};

/** Each board paired move by move ('move'), or as the den's oars pair them ('clocked'). */
const VARIANTS = (process.argv[5] ?? 'split move,mirror move,split clocked,mirror clocked').split(',');
const KINDS = Number(process.argv[6]) || KINDS_DEFAULT;
const ODDS = process.argv[7] === 'specials' ? { puffer: 0.02, crab: 0.015, jelly: 0.01 } : undefined;

const BIG = new Set(['Bingo!', 'Sea Donkey!', 'Vegas!']);

function play(variant, bot, g) {
  const [kind, pairing] = variant.split(' '), clocked = pairing === 'clocked';
  const o = { clocked, kinds: KINDS, odds: ODDS };
  const row = kind === 'mirror' ? new MirrorRow({ randoms: [seeded(1000 + g), seeded(2000 + g)], ...o }) : new SplitRow({ randoms: [seeded(1000 + g)], ...o });
  const rnd = seeded(9000 + g * 7 + bot.length);
  const s = { ahead: 0, circled: 0, fwd: 0, steps: 0, pull: 0, dBingo: 0, dVegas: 0, big: 0, vegas: 0, chain: 0 };
  for (let i = 0; i < MOVES; i++) {
    const [r, c] = BOTS[bot](row, rnd);
    const res = row.swap(r, c);
    s.fwd += res.steps.filter((x) => x === 'F').length; s.steps += res.steps.length; s.pull += res.pull.port + res.pull.starboard;
    s.big += res.combos.filter((x) => BIG.has(x)).length;
    s.chain += res.moves.reduce((t, m) => t + m.chain, 0);
    s.vegas += res.combos.filter((x) => x === 'Vegas!').length;
    if (res.combos.length === 2 && res.combos.every((x) => BIG.has(x))) s.dBingo++;
    if (res.combos.length === 2 && res.combos.every((x) => x === 'Vegas!')) s.dVegas++;
  }
  s.ahead = row.course.y; s.circled = row.course.circled ? 1 : 0;
  return s;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2);

console.log(`${GAMES} games of ${MOVES} moves a bot; two-ply looks past ${WIDTH} first moves; ${KINDS} kinds of piece${ODDS ? ', with specials' : ''}.\n`);
console.log('variant        | bot     | ahead (sd)   | circled | F steps  | pull | links | big/game | vegas/game | dbl Bingo+ | dbl Vegas | s/game');
console.log('---------------|---------|--------------|---------|----------|------|-------|----------|------------|------------|----------|-------');
const out = {};
for (const kind of VARIANTS) for (const bot of Object.keys(BOTS)) {
  const t0 = Date.now();
  const games = Array.from({ length: GAMES }, (_, g) => play(kind, bot, g));
  const secs = (Date.now() - t0) / 1000 / GAMES;
  const a = games.map((x) => x.ahead);
  out[`${kind} ${bot}`] = mean(a);
  const sum = (k) => games.reduce((t, x) => t + x[k], 0);
  console.log([kind.padEnd(14), bot.padEnd(7), `${f1(mean(a))} (${f1(sd(a))})`.padEnd(12), `${Math.round(100 * sum('circled') / GAMES)}%`.padEnd(7),
    `${Math.round(100 * sum('fwd') / Math.max(1, sum('steps')))}%`.padEnd(8), f1(sum('pull') / GAMES).padEnd(4), f1(sum('chain') / GAMES).padEnd(5),
    f2(sum('big') / GAMES).padEnd(8), f2(sum('vegas') / GAMES).padEnd(10),
    kind.startsWith('mirror') ? f2(sum('dBingo') / GAMES).padEnd(10) : '-'.padEnd(10), kind.startsWith('mirror') ? f2(sum('dVegas') / GAMES).padEnd(8) : '-'.padEnd(8), f2(secs)].join(' | '));
}
console.log('\nThe gap (squares ahead):');
for (const kind of VARIANTS) {
  const r = out[`${kind} random`], g = out[`${kind} greedy`], t = out[`${kind} two-ply`];
  console.log(`  ${kind.padEnd(14)}: greedy - random ${f1(g - r)}, two-ply - greedy ${f1(t - g)}; two-ply / greedy ${f2(t / g)}`);
}
