/* The Bilge puzzle's rules, as YPPedia gives them ("Bilging", read 9 Nov 2026). */
import { describe, expect, it } from 'vitest';
import { Bilge, H, KINDS, MAX_WATER, MIN_WATER, W, comboName } from '../src/bilge';
import type { Bit, Odds } from '../src/bilge';

/** New pieces come in as kinds 0, 1, 2 ... in turn, so they don't line up by chance. */
const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };

/** A board drawn from the top: 0-6 a piece of that kind, C a crab, P a pufferfish, J a jellyfish.
    Rows not drawn are filled with a pattern that never lines up. */
function board(rows: string[], odds?: Odds): Bilge {
  const b = new Bilge(cycle(), odds);
  let id = 1000;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    let bit: Bit;
    if (ch === undefined) bit = { id: id++, k: (c + 3 * r + 5) % KINDS };
    else if (ch === 'C') bit = { id: id++, k: -1, s: 'crab' };
    else if (ch === 'P') bit = { id: id++, k: -1, s: 'puffer' };
    else if (ch === 'J') bit = { id: id++, k: -1, s: 'jelly' };
    else bit = { id: id++, k: Number(ch) };
    b.grid[r][c] = bit;
  }
  return b;
}
const row = (b: Bilge, r: number) => b.grid[r].map((x) => (!x ? '.' : x.s ? x.s[0].toUpperCase() : String(x.k))).join('');

describe('the board', () => {
  it('is 6 wide by 12 high, seven kinds of piece, and starts with nothing lined up', () => {
    const b = new Bilge();
    expect([b.grid.length, W, H]).toEqual([12, 6, 12]);
    expect(b.grid.every((r) => r.length === 6)).toBe(true);
    expect(b.grid.flat().every((x) => x && x.k >= 0 && x.k < 7 && !x.s)).toBe(true);
    expect(b.lines()).toEqual([]);
  });
  it('has at least three rows of water, and the top three rows always dry', () => {
    expect([MIN_WATER, MAX_WATER]).toEqual([3, 9]);
    const b = new Bilge();
    b.water = 3;
    expect([...Array(H).keys()].filter((r) => b.dry(r))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    b.water = MAX_WATER;
    expect([...Array(H).keys()].filter((r) => b.dry(r))).toEqual([0, 1, 2]);
  });
});

describe('swapping', () => {
  it('swaps two pieces side by side, even when that clears nothing (it is still a move)', () => {
    const b = board(['012345']);
    const m = b.swap(0, 1);
    expect(m.moved).toBe(true);
    expect(m.cleared).toBe(0);
    expect(row(b, 0)).toBe('021345');
  });
  it('clears three in a row; the pieces below float up and new ones come in at the bottom', () => {
    const b = board(['001034', '256012']);
    const below = b.grid[1].slice(0, 3).map((x) => x!.id);
    const m = b.swap(0, 2);   // 0 0 0 1 3 4
    expect(m.lines).toEqual([3]);
    expect(m.combo).toBe('');
    expect(m.stages[1].cleared.length).toBe(3);
    expect(b.grid[0].slice(0, 3).map((x) => x!.id)).toEqual(below);
    expect(b.grid[H - 1].slice(0, 3).every((x) => x!.id < 1000)).toBe(true);
  });
  it('clears a column of three as well as a row', () => {
    const m = board(['120345', '405612', '603451']).swap(0, 1);   // the 0 comes over the two below
    expect(m.lines).toEqual([3]);
  });
  it('names four in a line Good, and five Great', () => {
    expect(board(['120345', '405612', '603451', '304512']).swap(0, 1).combo).toBe('Good');
    expect(board(['120345', '405612', '603451', '304512', '506123']).swap(0, 1).combo).toBe('Great');
  });
  it('names two lines at once Arrr!', () => {
    // The 1 moves right: 1 1 1 across the top, and 1 1 1 down its column.
    const m = board(['121134', '415632', '012345', '345612']).swap(0, 0);
    expect(m.lines.sort()).toEqual([3, 3]);
    expect(m.combo).toBe('Arrr!');
  });
  it('knows every combo by its lines', () => {
    expect(comboName([3])).toBe('');
    expect(comboName([4])).toBe('Good');
    expect(comboName([5])).toBe('Great');
    expect(comboName([6])).toBe('Great');
    expect(comboName([3, 3])).toBe('Arrr!');
    expect(comboName([3, 4])).toBe('Arrr!');
    expect(comboName([4, 4])).toBe('Har!');
    expect(comboName([3, 5])).toBe('Yarrr!');
    expect(comboName([3, 3, 3])).toBe('Bingo!');
    expect(comboName([3, 4, 5])).toBe('Bingo!');
    expect(comboName([3, 3, 3, 3])).toBe('Sea Donkey!');
    expect(comboName([3, 3, 4, 4])).toBe('Sea Donkey!');
    expect(comboName([3, 3, 3, 5])).toBe('Vegas!');
  });
  it('counts what lines up once the pieces have floated up as a chain', () => {
    // 2 2 2 clears; the 5 6 3 below float up beside the top row's 3 3: 3 3 3, a chain.
    const b = board(['223234', '563012', '012345']);
    const threes = [b.grid[0][4]!.id, b.grid[0][5]!.id];
    const m = b.swap(0, 2);
    expect(m.chain).toBeGreaterThanOrEqual(1);
    expect(m.stages[2].cleared).toEqual(expect.arrayContaining(threes.slice(0, 1)));
  });
});

describe('the special pieces', () => {
  it('a crab can\'t be moved', () => {
    const b = board(['0C1234']);
    expect(b.swap(0, 0).moved).toBe(false);
    expect(row(b, 0)).toBe('0C1234');
  });
  it('a crab rises with the pieces and is cleared once it is out of the water, a bonus', () => {
    const b = board([]);
    b.water = 3;
    // Column 0: three 6s lined up at rows 6-8, and a crab under the water line at row 9.
    for (const r of [6, 7, 8]) b.grid[r][0] = { id: 50 + r, k: 6 };
    b.grid[9][0] = { id: 99, k: -1, s: 'crab' };
    b.grid[5][0] = { id: 49, k: 1 };
    const m = b.swap(0, 3);   // any move: the 6s go, and the crab floats up to row 6, out of the water
    expect(m.crabs).toBe(1);
    expect(b.grid.flat().some((x) => x?.id === 99)).toBe(false);
  });
  it('a crab still under the water stays put', () => {
    const b = board([]);
    b.water = MAX_WATER;   // only the top three rows dry
    for (const r of [6, 7, 8]) b.grid[r][0] = { id: 50 + r, k: 6 };
    b.grid[9][0] = { id: 99, k: -1, s: 'crab' };
    b.grid[5][0] = { id: 49, k: 1 };
    const m = b.swap(0, 3);
    expect(m.crabs).toBe(0);
    expect(b.grid[6][0]!.id).toBe(99);
  });
  it('a pufferfish swapped with a piece clears itself and the eight round it', () => {
    const m = board(['012345', '1P2450', '234501']).swap(1, 1);
    expect(m.puffer).toBe(true);
    expect(m.stages[0].cleared.length).toBe(9);
  });
  it('a crab cleared by a pufferfish is no bonus', () => {
    const m = board(['0C2345', '1P2450', '234501']).swap(1, 1);
    expect(m.stages[0].cleared.length).toBe(9);
    expect(m.crabs).toBe(0);
  });
  it('two pufferfish just swap', () => {
    const m = board(['PP2345']).swap(0, 0);
    expect([m.puffer, m.cleared]).toEqual([false, 0]);
  });
  it('a jellyfish swapped with a piece clears every piece of that kind', () => {
    const b = board(['J32345', '133450', '234531']);
    const threes = b.grid.flat().filter((x) => x?.k === 3).length;
    const m = b.swap(0, 0);
    expect(m.jelly).toBe(true);
    expect(m.stages[0].cleared.length).toBe(threes + 1);
  });
  it('a jellyfish does nothing with a crab, and with a pufferfish the pufferfish goes off first', () => {
    expect(board(['JC2345']).swap(0, 0).moved).toBe(false);
    const m = board(['012345', '1JP450', '234501']).swap(1, 1);
    expect([m.puffer, m.jelly]).toEqual([true, false]);
  });
  it('two jellyfish just swap', () => {
    const m = board(['JJ2345']).swap(0, 0);
    expect([m.jelly, m.cleared]).toEqual([false, 0]);
  });
  it('new pieces come in special as often as the odds say', () => {
    const b = board(['001034'], { crab: 1, puffer: 0, jelly: 0 });
    b.swap(0, 2);
    expect(b.grid[H - 1].slice(0, 3).map((x) => x!.s)).toEqual(['crab', 'crab', 'crab']);
  });
});
