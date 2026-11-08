/* The fair deal (src/den-deal.ts): here are some holes, what gets dealt? Holes are drawn as rows
   of '#' (a square still to fill) and '.' (stone, or a square already filled). Each scenario the
   user runs into in a game can become one here: name it after what they saw, with the date. */
import { beforeEach, describe, expect, it } from 'vitest';
import { carp, count, hole, piece, seededDealer } from './helpers';
import { FairDeal, missing, orders, turnWide } from '../src/den-deal';
import type { Cell, Letter } from '../src/engine';

const RARE: Letter[] = ['U', 'V', 'W', 'X', 'Z', 'I'];

describe('FairDeal.pick', () => {
  it.each(carp.LETTERS)('deals %s for a hole shaped like an %s', (l) => {
    expect(seededDealer().pick([piece(l)])).toBe(l);
  });

  it.each([
    ['no holes', []],
    ['a done hole', [[]]],
    ['four squares', [hole('####')]],
    ['six squares', [hole('###', '###')]],
    ['five squares, none touching', [hole('#.#.#.#.#')]],
  ] as [string, Cell[][]][])('deals as usual (null) for %s', (_, holes) => {
    expect(seededDealer().pick(holes)).toBeNull();
  });

  it('deals nothing more for a hole the crates already cover', () => {
    expect(seededDealer().pick([piece('X')], ['P', 'X', 'F'])).toBeNull();
  });

  describe('the hole nearest done comes first (8 Nov: needing just an L, got P after P)', () => {
    const big = hole('#####', '#####', '#####', '#####');

    it.each([...Array(30).keys()])('seed %i: one hole wants only an L, another several pieces', (s) => {
      expect(seededDealer(s + 1).pick([big, piece('L')])).toBe('L');
    });

    it('two holes one piece from done: both pieces come up', () => {
      const got = count(Array.from({ length: 60 }, (_, s) => seededDealer(s + 1).pick([piece('L'), big, piece('F')])));
      expect(Object.keys(got).sort()).toEqual(['F', 'L']);
    });
  });
});

describe('FairDeal.plan', () => {
  it('counts the pieces on the crates towards a hole', () => {
    // A 2 by 5 hole takes two L's, two P's or two I's: with an L on a crate, the other L comes.
    for (let s = 1; s <= 30; s++) {
      expect(seededDealer(s).plan([hole('#####', '#####')], ['L']).map((n) => n.l)).toEqual(['L']);
    }
  });

  it('plans the holes together, so a piece in hand is not counted twice (8 Nov: a third M)', () => {
    // Two L-shaped holes and one L on the crates: one more L is missing, not none and not two.
    for (let s = 1; s <= 20; s++) {
      expect(seededDealer(s).plan([piece('L'), piece('L', 1)], ['L'])).toEqual([{ l: 'L', h: expect.any(Number) }]);
    }
  });

  it('says which hole each missing piece is for', () => {
    const need = seededDealer().plan([[], piece('W'), piece('T')]);
    expect(need).toEqual(expect.arrayContaining([{ l: 'W', h: 1 }, { l: 'T', h: 2 }]));
    expect(need).toHaveLength(2);
  });

  it('keeps to the usual odds: rare pieces only when the holes need them (8 Nov: five crosses in thirteen)', () => {
    // Open 5 by 5 and 4 by 5 holes can be finished many ways: what's asked for should be mostly common pieces.
    const holes = [hole('#####', '#####', '#####', '#####', '#####'), hole('#####', '#####', '#####', '#####')];
    const asked: Letter[] = [];
    for (let s = 1; s <= 40; s++) asked.push(...seededDealer(s).plan(holes).map((n) => n.l));
    const c = count(asked), share = (ls: Letter[]) => ls.reduce((n, l) => n + (c[l] ?? 0), 0) / asked.length;
    expect(share(RARE)).toBeLessThan(0.15);
    expect(share(['X'])).toBeLessThan(0.05);
  });
});

describe('FairDeal.holdBack (8 Nov: four M pieces in a row building a frame)', () => {
  let d: FairDeal;
  beforeEach(() => { d = seededDealer(); });

  it('holds a piece put in a frame back for three deals, then deals it again', () => {
    d.holdBack('W');
    expect([d.next([piece('W')]), d.next([piece('W')]), d.next([piece('W')]), d.next([piece('W')])]).toEqual([null, null, null, 'W']);
  });

  it('lets the other pieces needed come meanwhile', () => {
    d.holdBack('L');
    expect(d.next([piece('L'), piece('F')])).toBe('F');
  });

  it('counts down even while the fair deal is off', () => {
    d.holdBack('W');
    d.next([]); d.next([]); d.next([]);
    expect(d.next([piece('W')])).toBe('W');
  });

  it('forgets it all in a new game', () => {
    d.holdBack('W');
    d.reset();
    expect(d.next([piece('W')])).toBe('W');
  });
});

describe('a whole opening wall, played carelessly', () => {
  // An opening wall's holes, of one, two, two and three pieces, made by the engine as the den makes them.
  const wallFor = (seed: number): Cell[][] => { carp.useSeed(seed * 31); return [1, 2, 2, 3].map((n) => carp.genHole(n).hole); };
  const key = ([r, c]: Cell) => `${r},${c}`;
  const solver = turnWide(carp);

  /** Deal until the wall's done, fitting each piece in any spot that still leaves the hole finishable exactly. */
  function play(seed: number): { dealt: Letter[]; stuck: string | null; finished: boolean } {
    const holes = wallFor(seed), d = seededDealer(seed), dealt: Letter[] = [];
    while (holes.some((h) => h.length) && dealt.length < 40) {
      const l = d.next(holes) ?? carp.weightedLetter();
      dealt.push(l);
      const spots: Cell[][][] = [];
      holes.forEach((h, hi) => {
        const free = new Set(h.map(key));
        for (const o of carp.ORIENTS_BY_LETTER[l]) for (const [r0, c0] of h) {
          const cells = o.cells.map(([r, c]): Cell => [r + r0 - o.cells[0][0], c + c0 - o.cells[0][1]]);
          if (!cells.every((x) => free.has(key(x)))) continue;
          const gone = new Set(cells.map(key)), rest = h.filter((x) => !gone.has(key(x)));
          if (!rest.length || solver.solve(rest, 1).length) spots.push(holes.map((x, i) => (i === hi ? rest : x)));
        }
      });
      if (!spots.length) return { dealt, stuck: `dealt ${l} with nowhere clean to go; holes left ${holes.map((h) => h.length)}`, finished: false };
      carp.pick(spots).forEach((h, i) => (holes[i] = h));
    }
    return { dealt, stuck: null, finished: holes.every((h) => !h.length) };
  }
  const games = Array.from({ length: 10 }, (_, s) => play(s + 1));

  it.each(games.map((g, s) => [s + 1, g] as const))('seed %i: every hole a Masterpiece, in eight pieces', (_, g) => {
    expect(g.stuck).toBeNull();
    expect(g.finished).toBe(true);
    expect(g.dealt).toHaveLength(8);
  });

  it("a natural mix: not mostly P's, hardly any rare pieces (8 Nov: 'not too many P's')", () => {
    const all = games.flatMap((g) => g.dealt), c = count(all);
    const share = (ls: Letter[]) => ls.reduce((n, l) => n + (c[l] ?? 0), 0) / all.length;
    // Dealt at random, P's are 23% and the rare pieces 22%. These holes are any the engine makes;
    // the den picks roomier ones (more ways to finish with common pieces), so it should do better
    // still: when the wall's maker is pulled out of den.js, test with that.
    const random = (ls: Letter[]) => ls.reduce((n, l) => n + carp.WEIGHTS[l], 0) / carp.TOTAL_WEIGHT;
    expect(share(['P'])).toBeLessThan(0.5);
    expect(share(RARE)).toBeLessThan(random(RARE));
    expect(share(['X'])).toBeLessThan(0.05);
  });
});

describe('helpers', () => {
  it('missing: the letters a pool does not cover, each piece used once', () => {
    expect(missing(['P', 'P', 'L'], ['P', 'X'])).toEqual(['P', 'L']);
    expect(missing([], ['P'])).toEqual([]);
  });

  it('orders: every order of a few holes, shuffles of many', () => {
    expect(orders(3, carp.shuffle)).toHaveLength(6);
    expect(orders(0, carp.shuffle)).toEqual([[]]);
    expect(orders(7, carp.shuffle, 10)).toHaveLength(10);
  });

  it('turnWide: a wide strip is solved, and solved the right way round', () => {
    const strip = hole('####################', '####################', '####################');
    const sol = turnWide(carp).solve(strip, 1)[0];
    const covered = new Set(sol.flatMap((p) => p.cells.map(([r, c]) => `${r},${c}`)));
    expect(covered).toEqual(new Set(strip.map(([r, c]) => `${r},${c}`)));
  });
});
