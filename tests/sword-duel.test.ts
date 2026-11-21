/* Swordfight duels (SWORDFIGHT.md): where an attack lands on the other board, by Puzzle Pirates' rules (YPPedia's
   Swordfight, its drop pattern page and the Black Death placement guide, read 21 Nov 2026), and the duel's bots. */
import { describe, expect, it } from 'vitest';
import { Aim, Board, Duel, ENTRY, H, SWORDS, W, patternRow, seeded, toSword } from '../src/swordfight';
import type { Attack, Colour, Pair, Strike } from '../src/swordfight';
import { BOTS, Hand, greedy, placements, tryPlace } from '../src/sword-bots';

const CUT = SWORDS.cutlass;
const up = (w: number, h: number): Strike => ({ w, h, vertical: true });
const att = (sprinkles: number, strikes: Strike[] = [], pattern = CUT): Attack => ({ sprinkles, strikes, pattern });
/** Fill column c with plain blocks to height h, colours that never break or fuse (a column of alternating colours). */
function fill(b: Board, c: number, h: number) {
  for (let r = 0; r < h; r++) b.grid[r][c] = { c: (r % 2 ? 0 : 1) as Colour };
}
const cols = (cells: [number, number][]) => [...new Set(cells.map(([, c]) => c))].sort((a, b) => a - b);

describe('a duel: sprinkles', () => {
  it('the first attack of the duel starts on the right, one a column leftward, coloured by the bottom row', () => {
    const b = new Board(), aim = new Aim();
    const got = b.take(att(3), aim);
    expect(got.sprinkles).toEqual([[0, 5], [0, 4], [0, 3]]);
    for (const c of [5, 4, 3]) expect(b.grid[0][c]).toMatchObject({ c: CUT[0][c], grey: 2 });
  });

  it('the next attack, either side\'s, starts on the left', () => {
    const b = new Board(), aim = new Aim();
    b.take(att(1), aim);
    expect(b.take(att(2), aim).sprinkles).toEqual([[0, 0], [0, 1]]);
  });

  it('a second layer in one attack takes the pattern\'s second row, a third its first again', () => {
    const b = new Board(), aim = new Aim();
    b.take(att(W * 3), aim);
    for (let c = 0; c < W; c++) {
      expect(b.grid[1][c]!.c).toBe(CUT[1][c]);
      expect(b.grid[2][c]!.c).toBe(CUT[0][c]);
    }
  });

  it('a full column wastes its sprinkle, and the fourth takes them only 10 high', () => {
    const b = new Board(), aim = new Aim();
    fill(b, 5, H);
    fill(b, ENTRY, 10);
    const got = b.take(att(3), aim);
    expect(got.wasted).toBe(2);
    expect(got.sprinkles).toEqual([[0, 4]]);
  });
});

describe('a duel: upright swords', () => {
  it('aim at the second column, then on round, keeping out of the fourth (Black Death: 2, 3, 5*, 5, 6, 1)', () => {
    const b = new Board(), aim = new Aim();
    const got = b.take(att(0, [up(1, 4), up(1, 4), up(1, 4), up(1, 4), up(1, 4), up(1, 4)]), aim);
    // the fourth aims at the third's column (never on another sword) and goes left, to the first; the sixth has
    // nowhere but the fourth column left
    expect(got.swords.map((s) => cols(s.cells))).toEqual([[1], [2], [4], [0], [5], [ENTRY]]);
  });

  it('a 3-wide sword lands in columns 1 to 3', () => {
    const b = new Board(), aim = new Aim();
    expect(cols(b.take(att(0, [up(3, 4)]), aim).swords[0].cells)).toEqual([0, 1, 2]);
  });

  it('takes its colours from the attacker\'s pattern, the column\'s own, round the top four rows when it\'s longer', () => {
    expect([0, 5, 6, 7, 8, 9, 10].map((j) => patternRow(j, 6))).toEqual([0, 5, 2, 3, 4, 5, 2]);
    expect(patternRow(4, 3)).toBe(1);   // a stick's three rows repeat whole
    const b = new Board(), aim = new Aim();
    b.take(att(0, [up(1, 8)]), aim);
    for (let j = 0; j < 8; j++) expect(b.grid[j][1]!.c).toBe(CUT[patternRow(j, 6)][1]);
  });

  it('is a sword picture for a turn, then opaque grey, then see-through, then ordinary', () => {
    const d = new Duel({ random: seeded(3) });
    const b = d.sides[1].board;
    b.take(att(0, [up(1, 4)]), d.aim);
    expect(b.grid[0][1]).toMatchObject({ grey: 3 });
    expect(b.grid[0][1]!.sword).toBeDefined();
    const greys: (number | undefined)[] = [];
    for (let i = 0; i < 3; i++) { d.update(0); d.drop(1); greys.push(b.grid[0][1]!.grey); }
    expect(greys).toEqual([2, 1, undefined]);
    expect(b.grid[0][1]!.sword).toBeUndefined();
  });

  it('with only the fourth column left, it lands there: an insta', () => {
    const b = new Board(), aim = new Aim();
    for (let c = 0; c < W; c++) if (c !== ENTRY) fill(b, c, H);
    fill(b, ENTRY, 9);
    expect(b.lost).toBe(false);
    expect(cols(b.take(att(0, [up(1, 4)]), aim).swords[0].cells)).toEqual([ENTRY]);
    expect(b.lost).toBe(true);
  });

  it('sprinkles alone can never knock anyone out', () => {
    const b = new Board(), aim = new Aim();
    for (let i = 0; i < 6; i++) b.take(att(60), aim);
    expect(b.lost).toBe(false);
  });
});

describe('a duel: sideways swords', () => {
  it('a block wider than tall comes in from the right first, low on an empty board, the pattern on its side', () => {
    const s = toSword(3, 2);
    expect(s).toEqual({ w: 3, h: 2, vertical: false });
    const b = new Board(), aim = new Aim();
    const got = b.take(att(0, [s]), aim).swords[0];
    expect(got).toMatchObject({ vertical: false, from: 'right', wasted: 0 });
    expect(got.cells.length).toBe(6);
    // its top row (row 2) is the pattern's last column, read from the pattern's bottom row in from the edge
    expect([5, 4, 3].map((c) => b.grid[1][c]!.c)).toEqual([0, 1, 2].map((i) => CUT[i][W - 1]));
    expect([5, 4, 3].map((c) => b.grid[0][c]!.c)).toEqual([0, 1, 2].map((i) => CUT[i][W - 2]));
  });

  it('the second comes in from the left', () => {
    const b = new Board(), aim = new Aim();
    expect(b.take(att(0, [toSword(3, 2), toSword(3, 2)]), aim).swords[1].from).toBe('left');
  });

  it('comes in two rows below the highest piece', () => {
    const b = new Board(), aim = new Aim();
    fill(b, 0, 8);
    const got = b.take(att(0, [toSword(3, 2)]), aim).swords[0];
    // rows 5 and 6 (two below the eighth) from the right, then falls till it rests
    expect(got.from).toBe('right');
    expect(cols(got.cells)).toEqual([3, 4, 5]);
  });

  it('turns upright when at least half of it can\'t get in: twelve long or more always', () => {
    const b = new Board(), aim = new Aim();
    const got = b.take(att(0, [{ w: 12, h: 2, vertical: false }]), aim).swords[0];
    expect(got.vertical).toBe(true);
    expect(cols(got.cells).length).toBe(2);
  });
});

describe('the duel', () => {
  it('deals both sides the same pairs, in the same order', () => {
    const d = new Duel({ random: seeded(7) });
    d.update(0);
    const first = d.sides.map((s) => s.board.falling!.pair);
    expect(first[0]).toBe(first[1]);
    d.drop(0);
    d.drop(1);
    expect(d.sides[0].board.falling!.pair).toBe(d.sides[1].board.falling!.pair);
  });

  it('what one side breaks waits over the other board, and comes in when that side\'s pair lands', () => {
    const d = new Duel({ random: () => 0.9 });   // (pairs of blue blocks, no breakers)
    const me = d.sides[0].board;
    // a blue 2x2 with a blue breaker coming down onto it sends a 1x4
    for (const [r, c] of [[0, 0], [0, 1], [1, 0], [1, 1]]) me.grid[r][c] = { c: 3 };
    d.update(0);
    me.falling!.pair = [{ c: 3, breaker: true }, { c: 3, breaker: false }] as Pair;
    while (me.falling!.c > 0) me.move(-1);
    const turn = d.drop(0)!;
    expect(turn.sent!.strikes).toEqual([{ w: 1, h: 4, vertical: true }]);
    expect(d.sides[1].incoming.length).toBe(1);
    expect(d.sides[1].board.snap().length).toBe(0);
    const theirs = d.drop(1)!;
    expect(theirs.landed[0].swords.length).toBe(1);
    expect(d.sides[1].incoming.length).toBe(0);
  });

  it('the side whose fourth column fills loses', () => {
    const d = new Duel({ random: seeded(2) });
    fill(d.sides[1].board, ENTRY, H - 3);
    d.update(0);
    d.sides[1].board.falling!.pair = [{ c: 2, breaker: false }, { c: 3, breaker: false }];
    d.drop(1);
    expect(d.winner).toBe(0);
  });
});

describe('duel bots', () => {
  it('every place a pair can go, each once', () => {
    const p = placements(new Board(), [{ c: 0, breaker: false }, { c: 1, breaker: false }]);
    expect(p.length).toBe(W * 2 + (W - 1) * 2);
  });

  it('the greedy bot breaks when it can', () => {
    const b = new Board();
    for (let c = 0; c < 4; c++) b.grid[0][c] = { c: 2 };
    const pair: Pair = [{ c: 2, breaker: true }, { c: 1, breaker: false }];
    const plan = greedy.plan({ board: b, pair, foe: new Board(), incoming: [] });
    expect(tryPlace(b, pair, plan)!.result.links.length).toBeGreaterThan(0);
  });

  it('two greedy bots play a duel out at a person\'s pace to a winner', () => {
    const d = new Duel({ random: seeded(11) });
    const hands = [new Hand(BOTS.greedy, 0), new Hand(BOTS.greedy, 1)];
    let t = 0;
    for (; t < 1200 && !d.over; t += 1 / 20) {
      d.update(1 / 20);
      for (const h of hands) h.update(d, 1 / 20);
    }
    expect(d.winner).not.toBeNull();
    expect(d.sides[0].sent.sprinkles + d.sides[1].sent.sprinkles).toBeGreaterThan(0);
  });
});
