/* The Foraging puzzle's rules, as YPPedia gives them ("Foraging", "Official:Foraging", "Jamesh's
   Ultimate Foraging", "Talk:Foraging") and Fullbeard University's Foraging lessons, read 10 Nov 2026. */
import { describe, expect, it } from 'vitest';
import { FALL, Forage, H, KINDS, MAX_BOXES, NO_SPECIALS, SIZES, TILES, W, fallTime, fallen, points, seeded } from '../src/foraging';
import type { Bit, Deal, Dir, Size, Special, SpecialOdds } from '../src/foraging';

/** New pieces come in as tiles 0, 1, 2, 3, 4 in turn, so they don't line up by chance. */
const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };

/** A row of the pattern that never lines up. */
const P = (r: number) => Array.from({ length: W }, (_, c) => String((c + 2 * r) % KINDS)).join('');

/** A board (one container still to come, never due, so it isn't over) drawn from the top: 0-4 a tile of that kind, '.' nothing; M a machete, V a shovel, K a
    monkey, Q an earthquake; an ant ^ > v < (facing that way, five bites); c a crate, b a basket
    (drawn 2x2), h a chest (drawn 3 wide, 2 high). Rows, or the ends of rows, not drawn are the pattern. */
function board(rows: (string | undefined)[], deal: Deal = {}): Forage {
  const f = new Forage({ random: cycle(), bananas: 1, first: 1e9, specials: NO_SPECIALS, ...deal });
  let id = 1000;
  const SP: Record<string, Special> = { M: 'machete', V: 'shovel', K: 'monkey', Q: 'earthquake' };
  const BOX: Record<string, Size> = { c: 'crate', b: 'basket', h: 'chest' };
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c] ?? P(r)[c];
    if (BOX[ch]) {
      const size = BOX[ch], { w, h } = SIZES[size];
      if (f.grid[r][c]?.box) continue;   // part of one already laid
      const bit: Bit = { id: id++, k: -1, box: size };
      for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) f.grid[rr][cc] = bit;
      continue;
    }
    const ant = '^>v<'.indexOf(ch);
    f.grid[r][c] = ch === '.' ? null
      : SP[ch] ? { id: id++, k: -1, s: SP[ch] }
      : ant >= 0 ? { id: id++, k: -1, s: 'ant', dir: ant as Dir, bites: 5 }
      : { id: id++, k: Number(ch) };
  }
  return f;
}
const at = (f: Forage, r: number, c: number) => f.grid[r][c];
const idAt = (f: Forage, r: number, c: number) => f.grid[r][c]!.id;
/** A turn at the bottom right that clears nothing on the pattern (and back again, the other way). */
const dead = (f: Forage, n = 0) => f.turn(H - 2, W - 2, n % 2 === 0);
const ONLY = (s: Special, chance = 1, perExtra = 0): SpecialOdds =>
  ({ chance, perExtra, max: 1, weights: { machete: 0, shovel: 0, monkey: 0, earthquake: 0, ant: 0, [s]: 1 } });

describe('the board', () => {
  it('is 7 wide and 10 high, five tiles, and starts with nothing lined up', () => {
    const f = new Forage({ random: seeded(3), bananas: 0 });
    expect([W, H, KINDS]).toEqual([7, 10, 5]);
    expect(TILES).toEqual(['rock', 'foliage', 'wood', 'sand', 'soil']);
    expect(f.grid.length).toBe(H);
    expect(f.grid.every((row) => row.length === W && row.every((b) => b && b.k >= 0 && b.k < KINDS))).toBe(true);
    expect(f.lines()).toEqual([]);
  });
  it('deals the same board for the same seed', () => {
    const a = new Forage({ random: seeded(42) }), b = new Forage({ random: seeded(42) });
    expect(a.grid.map((r) => r.map((x) => x!.k))).toEqual(b.grid.map((r) => r.map((x) => x!.k)));
  });
  it('the test pattern never lines up, and the dead turn clears nothing', () => {
    const f = board([]);
    expect(f.lines()).toEqual([]);
    const m = dead(f);
    expect(m.moved).toBe(true);
    expect(m.lines).toEqual([]);
  });
});

describe('the cursor', () => {
  it('moves a square at a time and stays on the board', () => {
    const f = board([]);
    f.cur = { r: 0, c: 0 };
    f.step(-1, -1);
    expect(f.cur).toEqual({ r: 0, c: 0 });
    for (let i = 0; i < 20; i++) f.step(1, 1);
    expect(f.cur).toEqual({ r: H - 1, c: W - 1 });
  });
  it('is a 2x2 by its top left, kept on the board at the bottom and right edges', () => {
    const f = board([]);
    f.cur = { r: H - 1, c: W - 1 };
    expect(f.selection()).toEqual({ one: false, r: H - 2, c: W - 2 });
    f.cur = { r: 3, c: 2 };
    expect(f.selection()).toEqual({ one: false, r: 3, c: 2 });
  });
  it('is 1x1 over a special piece, but not over an ant', () => {
    const f = board([undefined, undefined, undefined, '01M3v01']);
    f.cur = { r: 3, c: 2 };
    expect(f.selection()).toEqual({ one: true, r: 3, c: 2 });
    f.cur = { r: 3, c: 4 };
    expect(f.selection()).toEqual({ one: false, r: 3, c: 4 });
  });
  it('the mouse picks the 2x2 round the nearest corner, or the special piece under it', () => {
    const f = board([undefined, undefined, undefined, '01M3401']);
    f.point(3.9, 5.1);   // nearest the corner between columns 3 and 4, rows 4 and 5
    expect(f.selection()).toEqual({ one: false, r: 4, c: 3 });
    f.point(0.1, 0.1);
    expect(f.selection()).toEqual({ one: false, r: 0, c: 0 });
    f.point(2.5, 3.5);
    expect(f.selection()).toEqual({ one: true, r: 3, c: 2 });
  });
});

describe('turning', () => {
  it('X turns the four counter-clockwise, C clockwise', () => {
    const f = board([]);
    const [tl, tr, bl, br] = [idAt(f, 0, 5), idAt(f, 0, 6), idAt(f, 1, 5), idAt(f, 1, 6)];
    f.cur = { r: 0, c: 5 };
    f.press(true);   // clockwise: the top left goes to the top right, and on round
    expect([idAt(f, 0, 5), idAt(f, 0, 6), idAt(f, 1, 6), idAt(f, 1, 5)]).toEqual([bl, tl, tr, br]);
    f.press(false);   // and back
    expect([idAt(f, 0, 5), idAt(f, 0, 6), idAt(f, 1, 5), idAt(f, 1, 6)]).toEqual([tl, tr, bl, br]);
    expect(f.moves).toBe(2);
  });
  it("won't turn a container, a special piece or an empty square, and that's no move", () => {
    for (const rows of [['c'], ['0M'], ['.1']]) {
      const f = board(rows);
      const before = f.snap();
      const m = f.turn(0, 0, true);
      expect(m.moved).toBe(false);
      expect(f.grid).toEqual(before);
      expect(f.moves).toBe(0);
    }
  });
  it('turns an ant with the tiles, and the ant turns with them', () => {
    const f = board(['01v', '234']);
    const ant = at(f, 0, 2)!;
    const m = f.turn(0, 1, true);   // clockwise: the top right goes to the bottom right
    expect(m.stages[0].grid[1][2]?.id).toBe(ant.id);
    expect(ant.dir).toBe(3);   // facing down, turned clockwise, it faces left
  });
});

describe('clearing', () => {
  // Row 9 "0030234": turning (8,2) clockwise brings a 0 down into (9,2).
  const ROWS = [...Array(9).fill(undefined), '0030234'];
  it('three in a row clear, everything falls into the gap and new tiles come in at the top', () => {
    const f = board(ROWS);
    const gone = [idAt(f, 9, 0), idAt(f, 9, 1), idAt(f, 9, 3)];   // (9,3)'s 0 turns round into (9,2)
    const above = idAt(f, 8, 0);
    const m = f.turn(8, 2, true);
    expect(m.lines).toEqual([3]);
    expect(m.tiles).toBe(3);
    expect(m.stages.map((s) => s.what)).toEqual(['turn', 'clear', 'fall']);
    expect(m.stages[1].cleared.sort()).toEqual(gone.sort());
    expect(idAt(f, 9, 0)).toBe(above);   // fell a row
    expect(f.grid.every((row) => row.every((b) => b))).toBe(true);   // the top's filled again
    expect(m.points).toBe(0);   // tiles score nothing on their own
  });
  it('specials, ants and gaps break a line', () => {
    expect(board(['00M0123', '1.11034', '22v2341']).lines()).toEqual([]);
  });
  it('what falls and lines up clears too, in the same move', () => {
    // Row 9 "0040412": the turn clears 0 0 0; row 8 drops onto row 9 and its 4 lines up with 4 4.
    const f = board([...Array(9).fill(undefined), '0040412']);
    const m = f.turn(8, 2, true);
    expect(m.lines.slice(0, 2)).toEqual([3, 3]);
    expect(m.stages.filter((s) => s.what === 'clear').length).toBeGreaterThanOrEqual(2);
  });
  it('a column clears as well as a row', () => {
    // Turning (8,0) clockwise brings (8,1)'s 2 down to (9,1) and (8,0)'s 2 across to (8,1), under (7,1)'s 2.
    const f = board([...Array(7).fill(undefined), '4212340', '2234012']);
    const m = f.turn(8, 0, true);
    expect(m.lines[0]).toBe(3);
    expect(m.stages[1].cleared.length).toBe(3);
    expect(m.stages[0].grid[7][1]?.k).toBe(2);
    expect([7, 8, 9].map((r) => m.stages[0].grid[r][1]?.k)).toEqual([2, 2, 2]);
  });
  it('a turn that clears nothing is still a move', () => {
    const f = board([]);
    dead(f);
    expect(f.moves).toBe(1);
  });
});

describe('containers', () => {
  it('sink as the tiles under them clear, and drop out of the bottom when nothing is left under them', () => {
    // A machete in the bottom row clears it; the crate on it falls and drops out.
    const f = board([...Array(8).fill(undefined), '012c401', 'M234012']);
    f.cur = { r: 9, c: 0 };
    const crate = idAt(f, 8, 3);
    const m = f.press(true);
    expect(m.action).toBe('machete');
    expect(m.left).toEqual([{ id: crate, size: 'crate', drop: 0 }]);
    expect(f.containers()).toEqual([]);
    expect(m.points).toBe(1);
    expect(f.score).toBe(1);
    expect(f.boxes).toBe(1);
  });
  it('nothing falls through one, so a gap under one side of a basket stays empty and it sticks', () => {
    // A shovel clears column 2 under the basket's left side; its right side is still held up.
    const f = board([...Array(6).fill(undefined), '01bb401', '23bb012', '40V2340', '1234012']);
    f.cur = { r: 8, c: 2 };
    const m = f.press(true);
    expect(m.action).toBe('shovel');
    expect(m.left).toEqual([]);
    expect(at(f, 6, 2)?.box).toBe('basket');
    expect([at(f, 8, 2), at(f, 9, 2)]).toEqual([null, null]);
    expect(f.turn(8, 1, true).moved).toBe(false);   // and a 2x2 with the gap in it won't turn
  });
  it('a stuck basket goes when its other side is cleared too', () => {
    const f = board([...Array(6).fill(undefined), '01bb401', '23bb012', '40VV340', '1234012']);
    f.cur = { r: 8, c: 2 }; f.press(true);
    f.cur = { r: 8, c: 3 };
    const m = f.press(false);
    expect(m.left.map((l) => l.size)).toEqual(['basket']);
    expect(m.points).toBe(SIZES.basket.value);
  });
  it('two side by side leave together; stacked, one after the other', () => {
    const side = board([...Array(8).fill(undefined), '0c2c401', 'M234012']);
    side.cur = { r: 9, c: 0 };
    const a = side.press(true);
    expect(a.left.map((l) => l.drop)).toEqual([0, 0]);
    expect(a.points).toBe(points([{ size: 'crate', drop: 0 }, { size: 'crate', drop: 0 }]));
    const stack = board([...Array(7).fill(undefined), '012c401', '234c012', 'M012340']);
    stack.cur = { r: 9, c: 0 };
    const b = stack.press(true);
    expect(b.left.map((l) => l.drop)).toEqual([0, 1]);
    expect(a.points).toBeGreaterThan(b.points);   // together scores more than one after the other
  });
  it('a shovel ignores containers, clearing the tiles under them', () => {
    const f = board([...Array(5).fill(undefined), '012V401', '2340123', '401c340']);
    f.cur = { r: 5, c: 3 };
    const m = f.press(true);
    expect(m.left.map((l) => l.size)).toEqual(['crate']);
  });
});

describe('containers coming in', () => {
  const CRATES = { crate: 1, basket: 0, chest: 0 };
  it('one is there at the start, forced in at the top, and another every few moves', () => {
    const g = new Forage({ random: cycle(), bananas: 3, every: [2, 2], sizes: CRATES, specials: NO_SPECIALS });
    expect(g.containers().map((x) => x.r)).toEqual([0]);
    expect(g.toCome).toBe(2);
  });
  it('comes in at the top over the tiles there, a banana gone, and the next is due a few moves on', () => {
    const f = board([], { bananas: 2, first: 1, every: [2, 2], sizes: CRATES });
    expect(f.containers()).toEqual([]);
    const m = dead(f);
    expect(m.entered).not.toBeNull();
    const enter = m.stages.find((s) => s.what === 'enter')!;
    expect(enter.cleared.length).toBe(1);   // the tile it pushed off
    expect(f.containers().map((x) => x.r)).toEqual([0]);
    expect(f.toCome).toBe(1);
    expect(dead(f, 1).entered).toBeNull();
    expect(dead(f, 2).entered).not.toBeNull();   // two moves after the last
    expect(f.toCome).toBe(0);
  });
  it('never over another container', () => {
    const f = board(['bb.bb..', 'bb.bb..'], { bananas: 1, first: 1, sizes: CRATES });
    for (const c of [2, 5, 6]) f.grid[0][c] = { id: 900 + c, k: c % KINDS };
    for (const c of [2, 5, 6]) f.grid[1][c] = { id: 910 + c, k: (c + 2) % KINDS };
    dead(f);
    const crate = f.containers().find((x) => x.bit.box === 'crate')!;
    expect(crate.r).toBe(0);
    expect([2, 5, 6]).toContain(crate.c);
  });
  it('no more than three on the board, nor more than nine squares of them', () => {
    expect(MAX_BOXES).toBe(3);
    const f = board([], { bananas: 5, first: 1, every: [1, 1], sizes: CRATES });
    for (let i = 0; i < 6; i++) dead(f, i);
    expect(f.containers().length).toBe(3);
    expect(f.toCome).toBe(2);   // still to come, waiting for room
    // Two baskets on the board: a chest waits, a crate comes.
    const g = board([...Array(5).fill(undefined), 'bb..bb.', 'bb..bb.'], { bananas: 1, first: 1, sizes: { crate: 0, basket: 0, chest: 1 } });
    for (const c of [2, 3, 6]) { g.grid[5][c] = { id: 800 + c, k: c % KINDS }; g.grid[6][c] = { id: 810 + c, k: (c + 1) % KINDS }; }
    dead(g);
    expect(g.containers().length).toBe(2);
    expect(g.next).toBe('chest');
  });
  it('the board is over once every banana has come and gone', () => {
    const f = board([...Array(8).fill(undefined), '012c401', 'M234012'], { bananas: 0 });
    expect(f.over).toBe(false);
    f.cur = { r: 9, c: 0 };
    f.press(true);
    expect(f.over).toBe(true);
    expect(f.press(true).moved).toBe(false);
  });
});

describe('a dealt board: one container stuck near the top, nothing more to come', () => {
  it('the capybara goes out of the bottom, carrying its tag, and the board is done', () => {
    const f = new Forage({ random: seeded(7), bananas: 0, specials: NO_SPECIALS, start: [{ size: 'basket', r: 0, c: 2, tag: 'capybara' }] });
    expect(f.containers()).toEqual([{ bit: expect.objectContaining({ box: 'basket', tag: 'capybara' }), r: 0, c: 2 }]);
    expect(f.toCome).toBe(0);
    // Clear the two columns under it with shovels.
    f.grid[2][2] = { id: 5000, k: -1, s: 'shovel' };
    f.grid[2][3] = { id: 5001, k: -1, s: 'shovel' };
    f.cur = { r: 2, c: 2 };
    expect(f.press(true).left).toEqual([]);   // one side: it's stuck
    f.cur = { r: 2, c: 3 };
    const m = f.press(true);
    expect(m.left).toEqual([expect.objectContaining({ size: 'basket', tag: 'capybara', drop: 0 })]);
    expect(f.over).toBe(true);
  });
});

describe('special pieces', () => {
  it('come in with the new tiles at the top', () => {
    const f = board([...Array(9).fill(undefined), '0030234'], { specials: ONLY('shovel') });
    f.turn(8, 2, true);
    expect([at(f, 0, 0)?.s, at(f, 0, 1)?.s, at(f, 0, 2)?.s]).toEqual(['shovel', 'shovel', 'shovel']);
  });
  it('more of them the more a move clears', () => {
    // No chance on a three; certain once the move's cleared more than three.
    const three = board([...Array(9).fill(undefined), '0030234'], { specials: ONLY('machete', 0, 1) });
    three.turn(8, 2, true);
    expect(three.grid.flat().some((b) => b?.s)).toBe(false);
    const four = board([...Array(9).fill(undefined), '0030034'], { specials: ONLY('machete', 0, 1) });
    // (9,0..1) 0s and (9,4) 0: turning (8,2) clockwise brings a 0 to (9,2), then (9,3)... use a row of four
    four.grid[9][3] = { id: 4000, k: 0 };
    four.grid[9][4] = { id: 4001, k: 2 };
    four.grid[8][3] = { id: 4002, k: 0 };
    four.grid[8][2] = { id: 4003, k: 0 };
    four.grid[9][2] = { id: 4004, k: 3 };
    // Turning (8,2) anticlockwise: (8,3)'s 0 to (8,2), (9,3)'s 0 to (8,3)... clockwise: (8,2)'s 0 down to (9,2)
    const m = four.turn(8, 2, true);
    expect(m.tiles).toBeGreaterThan(3);
    expect(four.grid.flat().some((b) => b?.s === 'machete')).toBe(true);
  });
  it('the machete clears its row to the left (X) or the right (C), passing containers by', () => {
    const f = board([undefined, undefined, undefined, undefined, '0c1M234']);
    const left = f.grid[4].map((b) => b!.id);
    f.cur = { r: 4, c: 3 };
    const m = f.press(false);
    expect(m.stages[0].cleared.sort()).toEqual([left[0], left[2], left[3]].sort());
    const g = board([undefined, undefined, undefined, undefined, '01M2c34']);
    const right = g.grid[4].map((b) => b!.id);
    g.cur = { r: 4, c: 2 };
    g.press(true);
    expect(g.grid.flat().some((b) => b?.id === right[1])).toBe(true);
    expect(g.grid.flat().some((b) => [right[2], right[3], right[5], right[6]].includes(b?.id ?? -1))).toBe(false);
  });
  it('the shovel clears its column below it, down to the bottom', () => {
    const f = board([undefined, undefined, undefined, undefined, undefined, '012V401']);
    const col = [5, 6, 7, 8, 9].map((r) => idAt(f, r, 3)), above = idAt(f, 4, 3);
    f.cur = { r: 5, c: 3 };
    const m = f.press(false);
    expect(m.stages[0].cleared.sort()).toEqual(col.sort());
    expect(m.stages[0].grid[4][3]?.id).toBe(above);
  });
  it("the monkey refills the 5x5 round him, holes and all; specials there are lost, containers aren't touched", () => {
    const f = board([...Array(6).fill(undefined), '01bb401', '23bb0M2', '40.2340', '12.4K12']);
    const basket = idAt(f, 6, 2), machete = idAt(f, 7, 5);
    f.cur = { r: 9, c: 4 };
    const m = f.press(true);
    expect(m.action).toBe('monkey');
    const g = m.stages[0].grid;
    for (let r = 7; r <= 9; r++) for (let c = 2; c <= 6; c++) {
      if (g[r][c]?.box) continue;
      expect(g[r][c]?.k).toBeGreaterThanOrEqual(0);   // every square a tile: the holes filled, the monkey gone
    }
    expect(m.stages[0].cleared).toContain(machete);
    expect(g[6][2]?.id).toBe(basket);
    expect(g[7][2]?.id).toBe(basket);
  });
  it('the earthquake shifts full rows one place that way, the far tile lost', () => {
    const f = board(['012Q401']);
    const row5 = f.grid[5].map((b) => b!.id), row0 = f.grid[0].map((b) => b?.id);
    f.cur = { r: 0, c: 3 };
    const m = f.press(true);
    expect(m.action).toBe('earthquake');
    const g = m.stages[0].grid;
    expect(g[5].map((b) => b?.id)).toEqual([undefined, ...row5.slice(0, 6)]);
    expect(m.stages[0].cleared).toContain(row5[6]);
    // Its own row had a gap where it was: that closes up toward the right instead.
    expect(g[0].map((b) => b?.id)).toEqual([undefined, row0[0], row0[1], row0[2], row0[4], row0[5], row0[6]]);
    expect(m.stages[0].cleared.length).toBe(1 + 9);   // itself, and one off each full row
  });
  it("a container at the far edge holds its row still; one by the near edge moves off it", () => {
    const f = board(['0123Q01', undefined, 'c234012', undefined, '340123c']);
    const row4 = f.grid[4].map((b) => b!.id), crate = idAt(f, 2, 0);
    f.cur = { r: 0, c: 4 };
    const g = f.press(true).stages[0].grid;
    expect(g[4].map((b) => b!.id)).toEqual(row4);
    expect(g[2][1]?.id).toBe(crate);
    expect(g[2][0]).toBeNull();
  });
  it('the earthquake closes a gap under a container', () => {
    // The basket's left side hangs over a gap at (8,2),(9,2); a quake left slides tiles in under it.
    const f = board([...Array(6).fill(undefined), '01bb401', '23bb012', '40.2340', '12.4Q12']);
    f.cur = { r: 9, c: 4 };
    const g = f.press(false).stages[0].grid;
    expect(g[8][2]).not.toBeNull();
    expect(g[9][2]).not.toBeNull();
  });
});

describe('the ant', () => {
  it('eats the piece in front of it each move and steps into its place, counting down', () => {
    const f = board([undefined, undefined, undefined, '012v401']);
    const ant = at(f, 3, 3)!, food = idAt(f, 4, 3);
    const m = dead(f);
    expect(m.bites).toBe(1);
    const bite = m.stages.find((s) => s.what === 'bite')!;
    expect(bite.cleared).toEqual([food]);
    expect(bite.grid[4][3]?.id).toBe(ant.id);
    expect(ant.bites).toBe(4);
  });
  it('dies once it has eaten its last', () => {
    const f = board([undefined, undefined, undefined, '012v401']);
    at(f, 3, 3)!.bites = 1;
    dead(f);
    expect(f.grid.flat().some((b) => b?.s === 'ant')).toBe(false);
  });
  it('starves at the edge, at a hole, or at a container', () => {
    for (const rows of [[undefined, undefined, undefined, '012340>'], [undefined, undefined, undefined, '012v401', '012c401']]) {
      const f = board(rows);
      const m = dead(f);
      expect(m.bites).toBe(0);
      expect(f.grid.flat().some((b) => b?.s === 'ant')).toBe(false);
    }
  });
  it('eats special pieces in its way', () => {
    const f = board([undefined, undefined, undefined, '01>M401']);
    const machete = idAt(f, 3, 3);
    dead(f);
    expect(f.grid.flat().some((b) => b?.id === machete)).toBe(false);
  });
});

describe('scoring', () => {
  it('only containers score, bigger ones more', () => {
    expect(points([])).toBe(0);
    expect(points([{ size: 'crate', drop: 0 }])).toBeLessThan(points([{ size: 'basket', drop: 0 }]));
    expect(points([{ size: 'basket', drop: 0 }])).toBeLessThan(points([{ size: 'chest', drop: 0 }]));
  });
  it('each one after the first in a move counts more: small ones first, then the big one, beats the other way round', () => {
    const smallFirst = points([{ size: 'crate', drop: 0 }, { size: 'crate', drop: 1 }, { size: 'basket', drop: 2 }]);
    const bigFirst = points([{ size: 'basket', drop: 0 }, { size: 'crate', drop: 1 }, { size: 'crate', drop: 2 }]);
    expect(smallFirst).toBeGreaterThan(bigFirst);
  });
  it('several leaving at once score much more than the same one at a time', () => {
    const one = points([{ size: 'crate', drop: 0 }]);
    expect(points([{ size: 'crate', drop: 0 }, { size: 'crate', drop: 0 }])).toBeGreaterThan(2 * one);
  });
});

describe('played at random for a long while', () => {
  it('keeps the board whole: nothing floats, nothing lined up is left, containers stay in shape and in number', () => {
    for (const seed of [1, 2, 3]) {
      const rnd = seeded(seed * 101);
      const f = new Forage({ random: seeded(seed), bananas: Infinity, every: [2, 5], specials: { ...NO_SPECIALS, chance: 0.08, max: 0.3, weights: { machete: 1, shovel: 1, monkey: 1, earthquake: 1, ant: 1 } } });
      let left = 0;
      for (let i = 0; i < 1500; i++) {
        f.cur = { r: Math.floor(rnd() * H), c: Math.floor(rnd() * W) };
        left += f.press(rnd() < 0.5).left.length;
        expect(f.lines()).toEqual([]);
        const boxes = f.containers();
        expect(boxes.length).toBeLessThanOrEqual(3);
        expect(boxes.reduce((a, x) => a + SIZES[x.bit.box!].w * SIZES[x.bit.box!].h, 0)).toBeLessThanOrEqual(9);
        for (const { bit, r, c } of boxes) {
          const { w, h } = SIZES[bit.box!];
          let n = 0;
          for (const row of f.grid) for (const b of row) if (b === bit) n++;
          expect(n).toBe(w * h);
          for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) expect(f.grid[rr][cc]).toBe(bit);
        }
        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
          if (f.grid[r][c]) continue;
          expect(r).toBeGreaterThan(0);   // the top's always filled
          const up = f.grid[r - 1][c];
          expect(!up || !!up.box).toBe(true);   // a hole only ever under a container (or more hole)
        }
      }
      expect(left).toBeGreaterThan(0);   // (random play gets few out: they stick)
      expect(f.boxes).toBe(left);
    }
  });
});

/* The user, 10 Nov, watching the capybara drop out of the bottom: "why is it so out of sync with the
   pieces? And it looks very jittery. Like, I think the animation's too fast and it just goes up and
   down like ding, ding, ding, ding." */
describe('the capybara falls in step with the pieces, smoothly and slowly enough to watch (10 Nov)', () => {
  it('everything falling goes by one clock: what falls together stays level till the nearer lands', () => {
    // A container falling six squares out of the bottom, and a tile beside it falling two: level all
    // the way down till the tile lands, as it's one function of time for both.
    for (let t = 0; t < fallTime(2); t += 0.01) expect(Math.min(6, fallen(t))).toBe(Math.min(2, fallen(t)));
    expect(fallTime(6)).toBeGreaterThan(fallTime(2));
  });
  it('smooth: starts from rest, never goes back up, never jumps, and never runs faster than its top speed', () => {
    expect(fallen(0)).toBe(0);
    let last = 0;
    for (let t = 0.001; t < 4; t += 0.001) {
      const s = fallen(t);
      expect(s).toBeGreaterThanOrEqual(last);
      expect(s - last).toBeLessThanOrEqual(FALL.V * 0.001 + 1e-9);
      last = s;
    }
    for (const d of [0.5, 1, 3, 10]) expect(fallen(fallTime(d))).toBeCloseTo(d, 9);
  });
  it('slow enough to watch: a square takes a third of a second, the whole board about two', () => {
    expect(fallTime(1)).toBeGreaterThan(0.3);
    expect(fallTime(H)).toBeGreaterThan(1.5);
    expect(fallTime(H)).toBeLessThan(3);
  });
});
