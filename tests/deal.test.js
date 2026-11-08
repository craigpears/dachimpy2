/* The fair deal (js/den-deal.js): here are some holes, what gets dealt? Run with `npm test`, or
   `node --test`. Holes are drawn as rows of '#' (a square still to fill) and '.' (stone,
   or a square already filled). Each scenario the user runs into in a game can become one here. */
const test = require('node:test');
const assert = require('node:assert');
require('../js/engine.js');
require('../js/den-deal.js');
const { Carp } = globalThis, { FairDeal, turnWide, missing } = globalThis.DenDeal;

const hole = (...rows) => Carp.parseRows(rows);
// Shapes to build holes from: a piece's cells, moved along by dc columns.
const piece = (letter, n = 0, dc = 0) => Carp.ORIENTS_BY_LETTER[letter][n].cells.map(([r, c]) => [r, c + dc]);
// A fresh dealer whose every choice is repeatable (seed), so a failure can be rerun.
function dealer(seed = 1) {
  Carp.useSeed(seed);
  let a = seed * 7919;
  return new FairDeal(turnWide(Carp), () => ((a = (a * 16807) % 2147483647) / 2147483647));
}
const count = (xs) => xs.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});

test('a hole shaped like one piece gets that piece', () => {
  for (const l of Carp.LETTERS) assert.strictEqual(dealer().pick([piece(l)]), l, l);
});

test('nothing to deal fair: no holes, done holes, or holes that cannot be finished exactly', () => {
  const d = dealer();
  assert.strictEqual(d.pick([]), null);
  assert.strictEqual(d.pick([[]]), null);
  assert.strictEqual(d.pick([hole('####')]), null, 'four squares');
  assert.strictEqual(d.pick([hole('###', '###')]), null, 'six squares');
  assert.strictEqual(d.pick([hole('#.#.#.#.#')]), null, 'five squares, none touching');
});

test('a hole the crates already cover gets nothing more', () => {
  assert.deepStrictEqual(dealer().plan([piece('L')], ['L']), []);
  assert.strictEqual(dealer().pick([piece('X')], ['P', 'X', 'F']), null);
});

test('the pieces on the crates count towards the plan', () => {
  // 2 by 5: two L's, two P's, or an I and an I... with an L on a crate, the other L comes.
  const two = hole('#####', '#####');
  for (let s = 1; s <= 30; s++) {
    const need = dealer(s).plan([two], ['L']).map((n) => n.l);
    assert.deepStrictEqual(need, ['L'], `seed ${s}: ${need}`);
  }
});

test('the hole nearest done comes first (8 Nov: needing just an L, got P after P)', () => {
  // One hole wants only an L; the other is a big one wanting several pieces.
  const big = hole('#####', '#####', '#####', '#####');
  for (let s = 1; s <= 30; s++) assert.strictEqual(dealer(s).pick([big, piece('L')]), 'L', `seed ${s}`);
  // Two holes one piece from done: either piece, both come up.
  const got = count(Array.from({ length: 60 }, (_, s) => dealer(s + 1).pick([piece('L'), big, piece('F')])));
  assert.deepStrictEqual(Object.keys(got).sort(), ['F', 'L'], JSON.stringify(got));
});

test('the holes are planned together, so a piece in hand is not counted twice', () => {
  // Two L-shaped holes and one L on the crates: one more L is missing, not none and not two.
  for (let s = 1; s <= 20; s++) {
    const need = dealer(s).plan([piece('L'), piece('L', 1)], ['L']);
    assert.deepStrictEqual(need.map((n) => n.l), ['L'], `seed ${s}`);
  }
});

test('a piece put in a frame is held back for three deals, then comes back', () => {
  const d = dealer(), holes = [piece('W')];
  d.holdBack('W');
  assert.strictEqual(d.next(holes), null);
  assert.strictEqual(d.next(holes), null);
  assert.strictEqual(d.next(holes), null);
  assert.strictEqual(d.next(holes), 'W', 'fourth deal');
  // A new game forgets it.
  d.holdBack('W'); d.reset();
  assert.strictEqual(d.next(holes), 'W');
});

test('a held-back piece gives way to what else is needed', () => {
  const d = dealer();
  d.holdBack('L');
  assert.strictEqual(d.next([piece('L'), piece('F')]), 'F');
});

test('held-back deals count down even when the fair deal is off', () => {
  const d = dealer();
  d.holdBack('W');
  d.next([]); d.next([]); d.next([]);
  assert.strictEqual(d.next([piece('W')]), 'W');
});

test('keeps to the usual odds: rare pieces only when the holes need them (8 Nov: five crosses in thirteen)', () => {
  // Open 5 by 5 and 4 by 5 holes can be finished many ways; what's asked for should be mostly common pieces.
  const holes = [hole('#####', '#####', '#####', '#####', '#####'), hole('#####', '#####', '#####', '#####')];
  const asked = [];
  for (let s = 1; s <= 40; s++) asked.push(...dealer(s).plan(holes).map((n) => n.l));
  const c = count(asked), rare = ['U', 'V', 'W', 'X', 'Z', 'I'].reduce((n, l) => n + (c[l] || 0), 0);
  assert.ok(rare / asked.length < 0.15, `rare pieces ${(100 * rare / asked.length).toFixed(0)}% of ${asked.length}: ${JSON.stringify(c)}`);
  assert.ok((c.X || 0) / asked.length < 0.05, `crosses ${c.X} of ${asked.length}`);
});

test('a careless player who fits each piece anywhere it goes cleanly finishes every hole as a Masterpiece', () => {
  // The four holes of an opening wall, roughly.
  const start = [
    hole('###', '###', '##.', '##.'),
    hole('.##.', '####', '####'),
    hole('#####', '#####'),
    hole('.###', '####', '###.'),
  ];
  assert.ok(start.every((h) => h.length % 5 === 0), start.map((h) => h.length).join(' '));
  const key = ([r, c]) => `${r},${c}`;
  for (let s = 1; s <= 10; s++) {
    const d = dealer(s), holes = start.map((h) => h.slice());
    let dealt = 0;
    while (holes.some((h) => h.length) && dealt < 40) {
      const l = d.next(holes) || Carp.weightedLetter();
      dealt++;
      // Anywhere it fits in any hole, leaving what's left still finishable exactly.
      const spots = [];
      holes.forEach((h, hi) => {
        const free = new Set(h.map(key));
        for (const o of Carp.ORIENTS_BY_LETTER[l]) for (const [r0, c0] of h) {
          const cells = o.cells.map(([r, c]) => [r + r0 - o.cells[0][0], c + c0 - o.cells[0][1]]);
          if (!cells.every((x) => free.has(key(x)))) continue;
          const gone = new Set(cells.map(key)), rest = h.filter((x) => !gone.has(key(x)));
          if (!rest.length || turnWide(Carp).solve(rest, 1).length) spots.push({ hi, rest });
        }
      });
      assert.ok(spots.length, `seed ${s}: dealt ${l} with nowhere clean to go, holes left ${holes.map((h) => h.length)}`);
      const { hi, rest } = Carp.pick(spots);
      holes[hi] = rest;
    }
    assert.ok(holes.every((h) => !h.length), `seed ${s}: not finished after ${dealt} pieces`);
  }
});

test('missing: the letters a pool does not cover, each piece used once', () => {
  assert.deepStrictEqual(missing(['P', 'P', 'L'], ['P', 'X']), ['P', 'L']);
  assert.deepStrictEqual(missing([], ['P']), []);
});
