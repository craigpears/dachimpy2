/* The Sailing puzzle's rules, as YPPedia gives them ("Sailing", "Sail scoring", "Chain", read 10 Nov
   2026), and the den's run forward for a chain (the user, 10 Nov). */
import { describe, expect, it } from 'vitest';
import { BOOCH_PENALTY, COLOURS, COLOUR_NAMES, DIFFICULTY, EASY, H, PLATFORM, RUN_TABLE, SPAWN, Sailing, TOP_FREE, W, chainName, multiplier, runFor } from '../src/sailing';
import type { Drop, Pair, Piece, Platform, Sail } from '../src/sailing';
import { seeded } from '../src/mirror-row';
import { stagesAreWhatTheySay } from './sail-stages';

let ids = 10000;
/** A board drawn by its bottom rows (the last string is the bottom row): '.' empty, 0-2 a loose piece
    of that colour, a-c a fixed piece of colour 0-2. */
function grid(rows: string[]): (Piece | null)[][] {
  const g: (Piece | null)[][] = Array.from({ length: H }, () => Array<Piece | null>(W).fill(null));
  rows.forEach((row, i) => {
    const r = H - rows.length + i;
    [...row].forEach((ch, c) => {
      if (ch >= '0' && ch <= '2') g[r][c] = { id: ids++, c: Number(ch) };
      else if (ch >= 'a' && ch <= 'c') g[r][c] = { id: ids++, c: ch.charCodeAt(0) - 97, fixed: true };
    });
  });
  return g;
}
/** A platform from its top row, left column, size and targets as [row, col, colour]. */
const plat = (r: number, c: number, w: number, h: number, targets: [number, number, number][]): Platform =>
  ({ id: ids++, r, c, w, h, targets: targets.map(([tr, tc, colour]) => ({ r: tr, c: tc, colour })) });

/** A game with nothing dealt, the board laid as given and the pair to drop. */
function game(rows: string[], platforms: Platform[], pair: Pair): Sailing {
  const s = new Sailing(seeded(1), false);
  s.lay(grid(rows), platforms);
  s.pair = pair;
  return s;
}
const draw = (s: Sailing, from = H - 4) => s.grid.slice(from).map((row) => row.map((x) => (!x ? '.' : x.fixed ? 'abc'[x.c] : String(x.c))).join(''));

describe('the board', () => {
  it('is 8 wide by 16 high, three colours (water, rope, wind), pairs down the middle two columns', () => {
    expect([W, H, COLOURS]).toEqual([8, 16, 3]);
    expect(COLOUR_NAMES).toEqual(['water', 'rope', 'wind']);
    expect(SPAWN).toEqual([3, 4]);
    const s = new Sailing(seeded(3));
    expect(s.grid.length).toBe(16);
    expect(s.grid.every((r) => r.length === 8)).toBe(true);
    expect([...s.pair, ...s.next].every((c) => c >= 0 && c < 3)).toBe(true);
  });
  it('deals platforms that fit, keep the top clear, never touch, and have a target or more', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = new Sailing(seeded(seed));
      expect(s.platforms.length).toBeGreaterThan(0);
      for (const p of s.platforms) {
        expect(p.r).toBeGreaterThanOrEqual(TOP_FREE);
        expect(p.r + p.h).toBeLessThanOrEqual(H);
        expect(p.c + p.w).toBeLessThanOrEqual(W);
        expect(p.targets.length).toBeGreaterThanOrEqual(1);
        for (const q of s.platforms) if (q !== p)
          expect(p.r <= q.r + q.h && q.r <= p.r + p.h && p.c <= q.c + q.w && q.c <= p.c + p.w).toBe(false);
      }
    }
  });
  it("deals easy boards for Kikkit's whirlpools: 'relatively small, easy platforms' (11 Nov), and stays easy", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = new Sailing(seeded(seed), true, { easy: true });
      expect(s.easy).toBe(true);
      expect(s.platforms.length).toBeGreaterThanOrEqual(1);
      expect(s.platforms.length).toBeLessThanOrEqual(EASY.MOST);
      // (the smallest a platform comes: two wide, two or three high)
      for (const p of s.platforms) { expect(p.w).toBe(PLATFORM.W[0]); expect(PLATFORM.H).toContain(p.h); }
      expect(s.grid.flat().some((x) => x?.fixed)).toBe(false);
      // A fresh board after one's cleared is as easy as ever.
      s.difficulty = DIFFICULTY.MAX;
      s.deal();
      for (const p of s.platforms) { expect(p.w).toBe(PLATFORM.W[0]); expect(PLATFORM.H).toContain(p.h); }
    }
    expect(new Sailing(seeded(1)).easy).toBe(false);
  });
  it("platforms are 2 by 3 or 3 by 3, never a little row (11 Nov): blocks two or three wide, two or three high, as on YPPedia's typical board", () => {
    // (the user, 11 Nov: "Platforms never look that small. Like, they're always like 2 by 3 or 3 by 3";
    // YPPedia's "A typical sailing board" shows a 2 by 2 and two 2 by 3s: https://yppedia.puzzlepirates.com/Sailing)
    const seen = new Set<string>();
    for (const easy of [false, true]) for (let d = DIFFICULTY.START; d <= DIFFICULTY.MAX; d++) for (let seed = 1; seed <= 30; seed++) {
      const s = new Sailing(seeded(seed), true, { easy });
      s.difficulty = d; s.deal();
      for (const p of s.platforms) {
        expect(p.w).toBeGreaterThanOrEqual(2); expect(p.w).toBeLessThanOrEqual(3);
        expect(p.h).toBeGreaterThanOrEqual(2); expect(p.h).toBeLessThanOrEqual(3);
        seen.add(`${p.w}x${p.h}`);
      }
    }
    expect([...seen].sort()).toEqual(['2x2', '2x3', '3x2', '3x3']);
  });
  it('puts no fixed piece over a target, where it would shut it in', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = new Sailing(seeded(seed));
      s.grid.forEach((row, r) => row.forEach((x, c) => {
        if (x?.fixed) expect(s.platforms.some((p) => p.targets.some((t) => t.c === c && t.r > r))).toBe(false);
      }));
    }
  });
  it('deals the same board from the same seed', () => {
    expect(new Sailing(seeded(7)).platforms).toEqual(new Sailing(seeded(7)).platforms);
  });
  it('more and a little bigger platforms as it gets harder: "you may start with 2 or 3, you end up with 4 or 5 and more ... doesn\'t get drastically bigger" (the user, 10 Nov)', () => {
    const dealt = (d: number) => {
      const counts: number[] = [], sizes: number[] = [];
      for (let seed = 1; seed <= 40; seed++) {
        const s = new Sailing(seeded(seed));
        s.difficulty = d; s.deal();
        counts.push(s.platforms.length);
        for (const p of s.platforms) sizes.push(p.w * p.h);
      }
      return { counts, size: sizes.reduce((a, b) => a + b, 0) / sizes.length, biggest: Math.max(...sizes) };
    };
    const easy = dealt(DIFFICULTY.START), hard = dealt(DIFFICULTY.MAX);
    expect(easy.counts.every((n) => n === 2 || n === 3)).toBe(true);
    expect(hard.counts.every((n) => n >= 4)).toBe(true);
    expect(hard.counts.some((n) => n >= 5)).toBe(true);
    expect(hard.size).toBeGreaterThan(easy.size);
    expect(hard.biggest).toBeLessThanOrEqual(12);
  });
});

describe('dropping a pair', () => {
  it('can go any column it reaches, either way round: 30 drops on an empty board, 15 for a pair of one colour', () => {
    expect(game([], [], [0, 1]).moves().length).toBe(7 * 2 + 8 * 2);
    expect(game([], [], [2, 2]).moves().length).toBe(7 + 8);
  });
  it('comes in from the middle: a wall to the top shuts off the columns past it', () => {
    const s = game(Array.from({ length: H }, () => '..1.....'), [], [0, 1]);
    expect(s.moves().length).toBeGreaterThan(0);
    expect(s.moves().some((m) => m.col <= 2)).toBe(false);
    expect(s.drop(0, 1).dropped).toBe(false);
  });
  it('is steered as it falls, so it slides in under a ledge (YPPedia: moved "while it is still falling")', () => {
    // A ledge over columns 0-2, two rows up: dropped straight, a pair stops on it; steered, it goes under.
    const s = game([], [plat(13, 0, 3, 1, [[13, 0, 2]])], [0, 1]);
    expect(s.straight(1, 1)).toEqual({ col: 1, turn: 1, row: 12 });
    expect(s.moves()).toContainEqual({ col: 1, turn: 1, row: 14 });
    s.drop(1, 1, 14);
    expect(draw(s, H - 2)).toEqual(['.0......', '.1......']);
    expect(s.drop(0, 0, 14).dropped).toBe(false);   // the next pair can't get there: no room under
  });
  it('turns: 0 as it comes, 1 the first over the second, 2 swapped, 3 the second over the first', () => {
    expect(game([], [], [0, 1]).cells(0, 2, 0)).toEqual([[0, 2, 0], [0, 3, 1]]);
    expect(game([], [], [0, 1]).cells(0, 2, 1)).toEqual([[0, 2, 0], [1, 2, 1]]);
    expect(game([], [], [0, 1]).cells(0, 2, 2)).toEqual([[0, 2, 1], [0, 3, 0]]);
    expect(game([], [], [0, 1]).cells(0, 2, 3)).toEqual([[0, 2, 1], [1, 2, 0]]);
  });
  it('shows the next pair: "obviously not just the single one" (the user, 10 Nov)', () => {
    const s = new Sailing(seeded(5));
    const next = s.next;
    s.drop(...([s.moves()[0]].map((m) => [m.col, m.turn, m.row] as const)[0]));
    expect(s.pair).toEqual(next);
  });
  it('falls to the bottom, and the next pair comes up', () => {
    const s = game([], [], [0, 1]);
    const next = s.next;
    const m = s.drop(5, 1);
    expect(m.dropped).toBe(true);
    expect(draw(s, H - 2)).toEqual(['.....0..', '.....1..']);
    expect(s.pair).toEqual(next);
    expect(s.drops).toBe(1);
  });
  it('stays joined: one half held up keeps the other hanging beside it', () => {
    const s = game(['..2.....'], [], [0, 1]);
    s.drop(2, 0);
    expect(draw(s, H - 2)).toEqual(['..01....', '..2.....']);
  });
  it('comes apart when one half clears, and the other falls', () => {
    const s = game(['..0.....', '..0.....', '..0.....'], [], [0, 1]);
    const m = s.drop(2, 0);
    expect([m.steps, m.lines, m.cleared]).toEqual([1, 1, 4]);
    expect(draw(s, H - 1)).toEqual(['...1....']);
  });
  it('never moves a fixed piece', () => {
    const s = game(['.a......', '........'], [], [0, 1]);
    s.drop(1, 1);
    expect(draw(s, H - 4)).toEqual(['.0......', '.1......', '.a......', '........']);
  });
});

describe('lines', () => {
  it('clear at four or more of a colour across or down; three stay', () => {
    expect(game(['000.....'], [], [0, 1]).drop(3, 0).cleared).toBe(4);
    expect(game(['00......'], [], [0, 1]).drop(2, 0).cleared).toBe(0);
    expect(game(['2.......', '2.......', '2.......'], [], [2, 1]).drop(0, 0).cleared).toBe(4);
  });
  it('fixed pieces clear in a line too', () => {
    const s = game(['aa0.....'], [], [0, 1]);
    const m = s.drop(3, 0);
    expect(m.cleared).toBe(4);
    expect(draw(s, H - 1)).toEqual(['....1...']);
  });
  it('lines cleared at once are one step, not a chain', () => {
    const m = game(['..00....', '..00....', '..00....'], [], [0, 0]).drop(2, 0);
    expect([m.steps, m.lines, m.cleared, m.name]).toEqual([1, 2, 8, '']);
  });
});

describe('platforms', () => {
  it('are a shelf across their width: nothing falls through the gap between targets', () => {
    const s = game([], [plat(10, 2, 3, 1, [[10, 2, 0], [10, 4, 0]])], [1, 2]);
    s.drop(3, 1);
    expect(s.grid[10][3]?.c).toBe(2);
    expect(s.grid[9][3]?.c).toBe(1);
    expect(s.grid[11][3]).toBe(null);
  });
  it('clear when every target holds its colour (the other squares may be empty), and only the targets go', () => {
    // Targets at columns 2 and 4 want water (0); column 3 is no target and holds a rope piece. A second
    // platform up the board keeps the board from being cleared.
    const s = game([], [plat(15, 2, 3, 1, [[15, 2, 0], [15, 4, 0]]), plat(6, 6, 2, 1, [[6, 6, 1], [6, 7, 1]])], [0, 0]);
    s.grid[15][3] = { id: ids++, c: 1 };
    s.grid[15][2] = { id: ids++, c: 0 };
    const m = s.drop(4, 1);
    expect([m.steps, m.platforms, m.cleared, m.boardCleared]).toEqual([1, 1, 2, false]);
    expect(s.platforms.length).toBe(1);
    // The rope piece stays; the pair's top half, loose now, falls into the emptied square.
    expect(draw(s, H - 2)).toEqual(['........', '...10...']);
  });
  it('clearing the last one clears the board', () => {
    const s = game([], [plat(15, 2, 2, 1, [[15, 2, 0], [15, 3, 1]])], [0, 1]);
    expect(s.drop(2, 0).boardCleared).toBe(true);
  });
  it('won\'t clear with the wrong colour in a target', () => {
    const s = game([], [plat(15, 2, 2, 1, [[15, 2, 0], [15, 3, 0]]), plat(10, 6, 2, 1, [[10, 6, 1], [10, 7, 1]])], [0, 2]);
    s.drop(2, 0);
    expect(s.platforms.length).toBe(2);
  });
  it('a non-target square\'s piece falls once its platform goes', () => {
    const s = game([], [plat(12, 2, 2, 1, [[12, 2, 1]]), plat(5, 6, 2, 1, [[5, 6, 1], [5, 7, 1]])], [1, 2]);
    const m = s.drop(2, 0);   // 1 into the target at column 2, 2 into the square beside it
    expect(m.platforms).toBe(1);
    expect(s.grid[15][3]?.c).toBe(2);
  });
});

describe('chains', () => {
  it('are named Double, Triple, Bingo!, Donkey!, then Vegas!! for six steps or more', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 9].map(chainName)).toEqual(['', '', 'Double', 'Triple', 'Bingo!', 'Donkey!', 'Vegas!!', 'Vegas!!', 'Vegas!!']);
  });
  it('a line clear that breaks a pair drops the other half into a platform\'s last target: a Double', () => {
    // Three water down column 4; a platform at the bottom of columns 5-6 wanting rope then wind, the
    // wind already in. The pair (water, rope) lands with its rope half hanging over column 5.
    const s = game(['....0...', '....0...', '....0.2.'], [plat(15, 5, 2, 1, [[15, 5, 1], [15, 6, 2]])], [0, 1]);
    const m = s.drop(4, 0);
    expect(m.stages.map((x) => x.kind)).toEqual(['land', 'line', 'platform']);
    expect([m.steps, m.name, m.lines, m.platforms]).toEqual([2, 'Double', 1, 1]);
    // Base: four plain pieces in the line, 4 + two platform pieces at 4 each, 8; times 2; and a
    // point for filling the rope target.
    expect([m.base, m.mult, m.points]).toEqual([12, 2, 25]);
  });
  it('a six-step chain is a Vegas', () => {
    // A stack in column 3 standing on a platform's target; fixed scaffolds in columns 0-2 at every other
    // row. The pair fills the platform's other target; each clear drops the stack a row into the next line.
    const stack = [2, 2, 2, 1, 2, 0, 0, 0, 2, 0, 2, 0], scaffold = [0, 1, 1, 2, 1];
    const rows: string[] = [];
    for (let h = 12; h >= 1; h--) {
      const f = h % 2 === 1 && h <= 9 ? 'abc'[scaffold[(h - 1) / 2]].repeat(3) : '...';
      rows.push(f + String(stack[h - 1]) + '....');
    }
    const s = game(rows, [plat(15, 3, 2, 1, [[15, 3, 2], [15, 4, 2]])], [0, 2]);
    expect(s.lines()).toEqual([]);
    const m = s.drop(4, 1);
    expect(m.stages.map((x) => x.kind)).toEqual(['land', 'platform', 'line', 'line', 'line', 'line', 'line']);
    expect([m.steps, m.name, m.vegas, m.run]).toEqual([6, 'Vegas!!', true, 7]);
    expect(m.mult).toBe(multiplier(6, DIFFICULTY.START));
  });
  it('platforms break last: "it waits to do kind of the platform break" (the user, 10 Nov)', () => {
    // The pair (water over rope) fills the platform's last target with its rope and makes a row of
    // four water with its water, both at once: the row goes first, then the platform, a Double.
    const s = game(['..000...', '..212.2.'], [plat(15, 5, 2, 1, [[15, 5, 1], [15, 6, 2]])], [0, 1]);
    const m = s.drop(5, 1);
    expect(m.stages.map((x) => x.kind)).toEqual(['land', 'line', 'platform']);
    expect([m.steps, m.name]).toEqual([2, 'Double']);
  });
  it('a chain of lines runs on to a Vegas while a filled platform waits, then carries on from what the platform drops ("a Vegas before it\'s even cleared the first platform and then kind of chains down from there", the user, 10 Nov)', () => {
    // Column 3 a stack on fixed scaffolds (a-c, every other row): the pair's water makes the bottom row
    // of four, and each clear drops the stack a row into the next. Its rope fills the platform's last
    // target at the same time; the platform waits for the six lines, then clears, and the water held
    // over column 6 falls onto the three below it.
    const s = game([
      '........',
      '...1....',
      'aaa2....',
      '...1....',
      'aaa2....',
      '...1....',
      'ccc1....',
      '...0....',
      'aaa1....',
      '...2....',
      'bbb2....',
      '...2..0.',
      '.aa0..1.',
      '...11.0.',
      '...11.0.',
      '...11.0.',
    ], [plat(12, 5, 2, 1, [[12, 5, 1], [12, 6, 1]])], [0, 1]);
    expect(s.lines()).toEqual([]);
    const m = s.drop(4, 0);
    expect(m.stages.map((x) => x.kind)).toEqual(['land', 'line', 'line', 'line', 'line', 'line', 'line', 'platform', 'line']);
    expect([m.steps, m.name, m.platforms, m.run]).toEqual([8, 'Vegas!!', 1, 9]);
  });
});

/** A game from an ordinary deal (seed 1), played by the staircase bot in tools/sail-bots.mjs: its drops
    as [column, turn, row], recorded with `tools/sail-bots.mjs record`. Record again if the deal or
    the pairs change. */
const STAIRCASE = { seed: 2, drops: [[0, 2, 5], [6, 0, 15], [6, 2, 14], [6, 2, 13], [6, 3, 11], [6, 1, 13], [5, 2, 12], [6, 0, 11], [0, 0, 15], [0, 0, 14], [1, 1, 12], [4, 2, 11], [0, 0, 13], [1, 1, 11], [2, 1, 4], [4, 0, 15], [4, 0, 10], [4, 0, 14], [5, 2, 9], [3, 0, 9], [3, 0, 8], [3, 1, 12], [3, 1, 10], [4, 2, 7], [3, 1, 6], [3, 1, 14], [0, 0, 15], [0, 0, 14], [0, 0, 13], [0, 0, 12], [0, 0, 11], [1, 1, 9], [0, 0, 8], [0, 0, 9], [0, 2, 10], [0, 1, 10], [0, 1, 8], [0, 1, 6], [3, 0, 5], [2, 3, 12], [2, 1, 10], [2, 1, 8], [2, 1, 6], [0, 1, 4], [1, 1, 12], [0, 1, 2], [1, 2, 5], [1, 0, 4], [0, 1, 4], [0, 1, 2], [0, 1, 4], [1, 3, 10], [2, 2, 3], [2, 1, 1]] as [number, Drop['turn'], number][] };

describe('the staircase', () => {
  it('Vegas 3s and 4s "quite easily": stairs built pair by pair on an ordinary deal set off a Vegas, a column a step (the user, 10 Nov)', () => {
    const s = new Sailing(seeded(STAIRCASE.seed));
    expect(s.difficulty).toBe(DIFFICULTY.START);
    let last: Sail | null = null;
    for (const [col, turn, row] of STAIRCASE.drops) {
      last = s.drop(col, turn, row);
      expect(last.dropped).toBe(true);
    }
    expect(last!.steps).toBeGreaterThanOrEqual(6);
    expect(last!.name).toBe('Vegas!!');
    // Down the stairs a column a step, from column 2 to 7: the columns each step cleared three or more
    // from. (Recorded again 11 Nov, when platforms became blocks: src/sailing.ts, PLATFORM.)
    const stairs = last!.stages.slice(1).map((st, i) => {
      const count = Array<number>(W).fill(0);
      last!.stages[i].grid.forEach((r) => r.forEach((x, c) => { if (x && st.cleared.includes(x.id)) count[c]++; }));
      return count.flatMap((n, c) => (n >= 3 ? [c] : []));
    });
    expect(stairs).toEqual([[2], [3], [4], [5], [6], [7]]);
  });
});

describe('scoring', () => {
  it('a line: the first four plain pieces a point each, any more two each', () => {
    expect(game(['000.....'], [], [1, 0]).drop(3, 1).points).toBe(4);
    expect(game(['0000....'], [], [1, 0]).drop(4, 1).points).toBe(4 + 2);
    expect(game(['00000...'], [], [1, 0]).drop(5, 1).points).toBe(4 + 2 * 2);
  });
  it('a fixed piece five', () => {
    expect(game(['aa0.....'], [], [1, 0]).drop(3, 1).points).toBe(5 + 5 + 1 + 1);
  });
  it('a piece cleared from a platform four, and a point for filling a target with its colour', () => {
    const s = game([], [plat(15, 0, 2, 1, [[15, 0, 1], [15, 1, 1]]), plat(6, 6, 2, 1, [[6, 6, 0], [6, 7, 0]])], [1, 1]);
    expect(s.drop(0, 0).points).toBe(2 * 4 + 2);
  });
  it('a filled target lost before its platform clears is a point off', () => {
    // A water target in the corner, filled, under two more water: a pair (rope over water) makes four
    // down, taking the filled target's piece with it; the rope falls into the target, the wrong colour.
    const s = game(['0.......', '0.......', '0.......'], [plat(15, 0, 2, 1, [[15, 0, 0], [15, 1, 1]])], [1, 0]);
    const m = s.drop(0, 1);
    expect(m.points).toBe(4 - 1);
    expect(s.grid[15][0]?.c).toBe(1);
  });
  it('the chain multiplies the whole cascade: in full to twice the difficulty, by halves past it', () => {
    expect([multiplier(0, 1), multiplier(1, 1), multiplier(2, 1), multiplier(3, 1), multiplier(6, 1)]).toEqual([0, 1, 2, 2.5, 4]);
    expect([multiplier(6, 3), multiplier(7, 2), multiplier(8, 4)]).toEqual([6, 5.5, 8]);
  });
  it('adds up across drops', () => {
    const s = game(['000.....'], [], [1, 0]);
    s.drop(3, 1);
    s.drop(3, 1);
    expect(s.score).toBe(4);   // the second drop clears nothing
  });
});

describe('booching and new boards', () => {
  it('booches when a middle column\'s top square is still taken once it settles: 20 off and a fresh board', () => {
    const rows = Array.from({ length: H - 1 }, (_, i) => '...' + String(i % 2 ? 1 : 2) + '....');
    const s = game(rows, [plat(8, 0, 2, 1, [[8, 0, 0], [8, 1, 0]])], [0, 0]);
    s.difficulty = 3; s.boards = 2;
    const m = s.drop(3, 0);
    expect(m.booched).toBe(true);
    expect(m.points).toBe(-BOOCH_PENALTY);
    expect([s.booches, s.difficulty, s.boards]).toEqual([1, DIFFICULTY.START, 0]);
    expect(s.grid[0].every((x) => !x)).toBe(true);
    expect(s.platforms.length).toBeGreaterThan(0);
  });
  it('clearing every platform deals a new, harder board', () => {
    const s = game([], [plat(15, 0, 2, 1, [[15, 0, 1], [15, 1, 2]])], [1, 2]);
    const m = s.drop(0, 0);
    expect(m.boardCleared).toBe(true);
    expect([s.boards, s.difficulty]).toEqual([1, DIFFICULTY.START + 1]);
    expect(s.platforms.length).toBeGreaterThan(0);
  });
  it('the difficulty goes back to the start after a few boards', () => {
    const s = game([], [], [1, 2]);
    for (let i = 0; i < DIFFICULTY.RESET_AFTER; i++) {
      s.lay(grid([]), [plat(15, 0, 2, 1, [[15, 0, 1], [15, 1, 2]])]);
      s.pair = [1, 2];
      s.drop(0, 0);
    }
    expect([s.boards, s.difficulty]).toEqual([0, DIFFICULTY.START]);
  });
});

describe('the den\'s run forward', () => {
  it('scales with the chain: a step a square, and a Vegas the long rush of seven', () => {
    expect(RUN_TABLE).toEqual([0, 1, 2, 3, 4, 5, 7]);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(runFor)).toEqual([0, 1, 2, 3, 4, 5, 7, 8, 9]);
  });
  it('is in what every drop earned: a Double runs two', () => {
    const s = game(['....0...', '....0...', '....0.2.'], [plat(15, 5, 2, 1, [[15, 5, 1], [15, 6, 2]])], [0, 1]);
    expect(s.drop(4, 0).run).toBe(2);
    expect(game([], [], [0, 1]).drop(0, 0).run).toBe(0);
  });
});

describe('a copy', () => {
  it('plays on without touching the game it came from', () => {
    const s = game(['000.....'], [], [1, 0]);
    const c = s.copy(seeded(2));
    c.drop(3, 1);
    expect(draw(s, H - 1)).toEqual(['000.....']);
    expect(s.score).toBe(0);
    expect(c.score).toBe(4);
  });
});

describe('each step of a chain is a line or a platform, and says which (11 Nov)', () => {
  it('pops nothing but a line of four or a finished platform: "a yellow on a white block, and somehow it cleared a platform" (11 Nov)', () => {
    let seen = { line: 0, platform: 0 };
    // (greedy play, the move that scores most, so platforms get finished too)
    for (let seed = 1; seed <= 3; seed++) {
      const s = new Sailing(seeded(seed), true, { easy: true });
      for (let n = 0; n < 30; n++) {
        const ms = s.moves().map((m) => ({ m, pts: s.copy(seeded(1)).drop(m.col, m.turn, m.row).points }));
        if (!ms.length) break;
        const { m } = ms.reduce((a, b) => (b.pts > a.pts ? b : a)), prev = s.snap(), before = s.platforms.slice();
        const res = s.drop(m.col, m.turn, m.row);
        stagesAreWhatTheySay(prev, before, res);
        for (const st of res.stages) if (st.kind !== 'land') seen[st.kind]++;
      }
    }
    expect(seen.line).toBeGreaterThan(2);
    expect(seen.platform).toBeGreaterThan(0);
  }, 30000);
});
