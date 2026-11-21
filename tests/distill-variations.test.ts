/* Distilling's variations (src/distilling.ts, 21 Nov): two furnaces, dark rum and rich spice, each off by default,
   for the user's feel-test of a harder Distilling that changes the thinking (the card
   a-distilling-test-board-with-furnaces-on-both-si; DISTILLING.md §8). */
import { describe, expect, it } from 'vitest';
import {
  BLACK, BROWN, BURNT, BURN_TICKS, CHAIN_BONUS, COLS, DARK_RUM_BONUS, DOUBLE_BONUS, Distilling, NO_SPICE_FIRST, RICH_COLUMNS, SHORT, SLIDE_MS,
  SPICE, TALL, TICK_MS, WARN_TICK, WHITE, parseBoard, writeBoard,
} from '../src/distilling';
import type { DistillEvent, DistillOptions } from '../src/distilling';
import { seeded } from '../src/mirror-row';

type ColumnEvent = Extract<DistillEvent, { kind: 'column' }>;
const columns = (ev: DistillEvent[]) => ev.filter((e): e is ColumnEvent => e.kind === 'column');
/** A board of one letter everywhere, tall and short in turn from a tall first column. */
const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
/** Set a column to one letter, its own height. */
const fill = (g: Distilling, x: number, ch: string) => { g.cols[x] = parseBoard([ch.repeat(g.cols[x].length)])[0]; };
/** Burn now and let the board slide. */
const burn = (g: Distilling) => { const ev = g.burnNow(); g.tick(SLIDE_MS); return columns(ev); };
const two = (o: DistillOptions = {}, seed = 1) => new Distilling(seeded(seed), { furnaces: 2, ...o });

describe('two furnaces (21 Nov)', () => {
  it('are off by default: the same board, furnace and burns as ever', () => {
    for (const s of [1, 7, 42]) {
      const a = new Distilling(seeded(s)), b = new Distilling(seeded(s), { furnaces: 1, darkRum: false, richSpice: false });
      expect(writeBoard(a.cols)).toEqual(writeBoard(b.cols));
      expect(a.burnTicks).toBe(BURN_TICKS);
      expect(a.warnTick).toBe(WARN_TICK);
      for (let i = 0; i < 6; i++) { burn(a); burn(b); }
      expect(writeBoard(a.cols)).toEqual(writeBoard(b.cols));
      expect(a.points).toBe(b.points);
    }
  });
  it('start with both furnaces\' columns all black, and no spice in the two beside them', () => {
    for (let s = 1; s <= 200; s++) {
      const g = two({}, s);
      expect(g.cols.map((c) => c.length)).toEqual([9, 8, 9, 8, 9, 8, 9, 8, 9, 8]);
      expect(g.cols[0]).toEqual(Array(TALL).fill(BLACK));
      expect(g.cols[9]).toEqual(Array(SHORT).fill(BLACK));
      expect(g.cols[1].length + g.cols[8].length).toBe(NO_SPICE_FIRST);
      expect([...g.cols[1], ...g.cols[8]]).not.toContain(SPICE);
    }
  });
  it('send both edge columns off together, the right first, each by the same up-or-burn rule', () => {
    const g = two();
    fill(g, 9, 'w');
    const [right, left] = burn(g);
    expect(right.column.side).toBe('right');
    expect(right.column.up).toBe(true);
    expect(right.column.message).toBe('clear');
    expect(right.finished).toBe(false);
    expect(left.column.side).toBe('left');
    expect(left.column.up).toBe(false);
    expect(g.columns.map((c) => c.side)).toEqual(['right', 'left']);
  });
  it('slide each half out a column and bring two new columns in in the middle, tall and short in turn', () => {
    for (let s = 1; s <= 40; s++) {
      const g = two({}, s), before = writeBoard(g.cols);
      burn(g);
      const after = writeBoard(g.cols);
      expect(after.slice(0, 4)).toEqual(before.slice(1, 5));
      expect(after.slice(6)).toEqual(before.slice(5, 9));
      for (let x = 1; x < COLS; x++) expect(g.cols[x].length).not.toBe(g.cols[x - 1].length);
      // ... and again, the board never losing its honeycomb.
      for (let i = 0; i < 8; i++) burn(g);
      for (let x = 1; x < COLS; x++) expect(g.cols[x].length).not.toBe(g.cols[x - 1].length);
      expect(g.cols.flat().length).toBe(85);
    }
  });
  it('carry a column from the middle to a furnace in five burns, as long as one furnace takes in ten', () => {
    const g = two(), mark = g.cols[5].length;
    g.lay(parseBoard(sea('b')));
    fill(g, 5, 'w');
    for (let i = 0; i < 3; i++) burn(g);
    expect(g.cols[8]).toEqual(Array(mark).fill(WHITE));
    burn(g);
    const [right] = burn(g);
    expect(right.column.message).toBe('clear');
  });
  it('burn every 100 ticks (30.6 s), so as many columns leave a minute as with one furnace every 50', () => {
    const g = two();
    expect(g.burnTicks).toBe(2 * (BURN_TICKS + 1) - 1);
    let ev: DistillEvent[] = [];
    let warned = -1;
    for (let t = 0; t < 2 * (BURN_TICKS + 1) * TICK_MS + 10; t += TICK_MS) {
      const e = g.tick(TICK_MS);
      if (e.some((x) => x.kind === 'warning')) warned = g.time;
      ev = ev.concat(e);
    }
    expect(columns(ev).length).toBe(2);
    expect(warned).toBeGreaterThan(0);
    expect(g.time - warned).toBeLessThan(3500);
    expect(g.timeLeft()).toBeGreaterThan(29000);
  });
  it('chain Crystal Clears across both sides, the right then the left', () => {
    const g = two();
    g.lay(parseBoard(sea('w')));
    let [right, left] = burn(g);
    expect([right.column.chain, left.column.chain]).toEqual([1, 2]);
    expect(left.column.bonus).toBe(CHAIN_BONUS);
    fill(g, 9, 'w'); fill(g, 0, 'K');
    [right, left] = burn(g);
    expect(right.column.chain).toBe(3);
    expect(left.column.chain).toBe(0);
    expect(g.chain).toBe(0);
  });
  it('burn whites by the left furnace like the right\'s: owed back as burnt whites', () => {
    const g = two();
    fill(g, 0, 'K');
    g.cols[0][0] = WHITE; g.cols[0][1] = WHITE;
    fill(g, 9, 'b');
    burn(g);
    expect(g.whitesBurned).toBe(2);
    // (owed, and paid back in the first white made since, in the new columns in the middle)
    expect([...g.cols[4], ...g.cols[5]]).toContain(BURNT);
  });
});

describe('four furnaces (21 Nov, the user: "every single side being a furnace")', () => {
  const four = (seed = 1) => new Distilling(seeded(seed), { furnaces: 4 });
  it('burn the sides and then the rows in turn, one pair every 50 ticks (15.3 s), the sides first', () => {
    const g = four();
    expect(g.burnTicks).toBe(BURN_TICKS);
    const sides: string[][] = [];
    for (let i = 0; i < 4; i++) {
      let ev: DistillEvent[] = [];
      while (!columns(ev).length) ev = g.tick(TICK_MS);
      sides.push(columns(ev).map((e) => e.column.side!));
      g.tick(SLIDE_MS);
    }
    expect(sides).toEqual([['right', 'left'], ['top', 'bottom'], ['right', 'left'], ['top', 'bottom']]);
  });
  it('send the top and bottom rows off, every column keeping its height, two new pieces in its middle', () => {
    for (let s = 1; s <= 30; s++) {
      const g = four(s);
      burn(g);   // (the sides)
      const before = g.cols.map((c) => [...c]);
      const [top, bottom] = burn(g);
      expect(top.column.side).toBe('top');
      expect(top.column.pieces).toEqual(before.map((c) => c[0]));
      expect(bottom.column.side).toBe('bottom');
      expect(bottom.column.pieces).toEqual(before.map((c) => c[c.length - 1]));
      for (let x = 0; x < COLS; x++) {
        const c = g.cols[x], b = before[x], k = b.length === TALL ? 3 : 3;
        expect(c.length).toBe(b.length);
        expect(c.slice(0, k)).toEqual(b.slice(1, k + 1));
        expect(c.slice(k + 2)).toEqual(b.slice(k + 1, b.length - 1));
      }
      for (let x = 1; x < COLS; x++) expect(g.cols[x].length).not.toBe(g.cols[x - 1].length);
    }
  });
  it('judge a row by the same up-or-burn rule, and chain it like a column', () => {
    const g = four();
    g.lay(parseBoard(sea('w')));
    burn(g);   // (the sides: two Crystal Clears)
    for (const c of g.cols) { c[0] = WHITE; c[c.length - 1] = BLACK; }
    const [top, bottom] = burn(g);
    expect(top.column.up).toBe(true);
    expect(top.column.pieces.length).toBe(COLS);
    expect(top.column.chain).toBe(3);
    expect(bottom.column.up).toBe(false);
    expect(g.chain).toBe(0);
  });
});

describe('double Crystal Clears (21 Nov, the user: "extra spice pieces ... a double hit")', () => {
  it('pay a bonus when both side columns clear at once, and bring a spice into each new column', () => {
    const g = new Distilling(seeded(4), { furnaces: 2, doubles: true }).lay(parseBoard(sea('b')));
    fill(g, 0, 'w'); fill(g, COLS - 1, 'w');
    const [right, left] = burn(g);
    expect(right.column.double).toBeUndefined();
    expect(left.column.double).toBe(true);
    expect(left.column.bonus).toBe(CHAIN_BONUS + DOUBLE_BONUS);
    expect(g.points).toBe(right.column.points + left.column.points + CHAIN_BONUS + DOUBLE_BONUS);
    expect(g.cols[4]).toContain(SPICE);
    expect(g.cols[5]).toContain(SPICE);
  });
  it('pay for the top and bottom rows together too, a spice into each new row', () => {
    const g = new Distilling(seeded(4), { furnaces: 4, doubles: true }).lay(parseBoard(sea('b')));
    burn(g);   // (the sides)
    for (const c of g.cols) { c[0] = WHITE; c[c.length - 1] = WHITE; }
    const [, bottom] = burn(g);
    expect(bottom.column.double).toBe(true);
    const newRow = (at: number) => g.cols.map((c) => c[3 + at]);
    expect(newRow(0)).toContain(SPICE);
    expect(newRow(1)).toContain(SPICE);
  });
  it('need both: one Crystal Clear of a pair is no double, and it\'s off by default', () => {
    const g = new Distilling(seeded(4), { furnaces: 2, doubles: true }).lay(parseBoard(sea('b')));
    fill(g, COLS - 1, 'w');
    expect(burn(g).some((e) => e.column.double)).toBe(false);
    const off = new Distilling(seeded(4), { furnaces: 2 }).lay(parseBoard(sea('b')));
    fill(off, 0, 'w'); fill(off, COLS - 1, 'w');
    expect(burn(off).some((e) => e.column.double)).toBe(false);
  });
});

describe('dark rum (21 Nov)', () => {
  /** A game laid all white, the next columns to go set by hand, for chains. */
  const rum = (on = true) => new Distilling(seeded(3), { darkRum: on }).lay(parseBoard(sea('w')));
  const sendCol = (g: Distilling, ch: string) => { fill(g, COLS - 1, ch); return burn(g)[0].column; };
  it('holds a chain once between two Crystal Clears, and pays only when the next one keeps it going', () => {
    const g = rum();
    sendCol(g, 'w'); sendCol(g, 'w');
    const dark = sendCol(g, 'b');
    expect(dark.up).toBe(true);
    expect(dark.darkRum).toBe(true);
    expect(dark.points + dark.bonus).toBe(0);
    expect(g.chain).toBe(2);
    const next = sendCol(g, 'w');
    expect(next.chain).toBe(3);
    expect(next.rumBonus).toBe(DARK_RUM_BONUS);
    expect(next.bonus).toBe(CHAIN_BONUS * 2 + DARK_RUM_BONUS);
  });
  it('never pays on its own: with no chain going it\'s only browns, and after it a chain broken pays nothing', () => {
    const g = rum();
    const alone = sendCol(g, 'b');
    expect(alone.darkRum).toBeUndefined();
    sendCol(g, 'w');
    sendCol(g, 'b');
    const broke = sendCol(g, 'K');
    expect(broke.rumBonus).toBeUndefined();
    expect(g.chain).toBe(0);
  });
  it('can\'t pad a chain: a second dark rum in a row breaks it', () => {
    const g = rum();
    sendCol(g, 'w'); sendCol(g, 'b');
    const second = sendCol(g, 'b');
    expect(second.darkRum).toBeUndefined();
    expect(g.chain).toBe(0);
  });
  it('is off by default: browns break a chain', () => {
    const g = rum(false);
    sendCol(g, 'w');
    expect(sendCol(g, 'b').darkRum).toBeUndefined();
    expect(g.chain).toBe(0);
  });
});

describe('moves heat the furnace (21 Nov, the user: "the burn is sped up by how many drags you do")', () => {
  it('brings the burn nearer a move at a time, warning on the way, burning on a tick of its own', () => {
    const g = new Distilling(seeded(2), { moveHeat: 2 });
    const left = g.timeLeft();
    g.moved();
    expect(g.timeLeft()).toBe(left - 2 * TICK_MS);
    let warned = false;
    for (let i = 0; i < 30; i++) if (g.moved().some((e) => e.kind === 'warning')) warned = true;
    expect(warned).toBe(true);
    expect(g.furnace).toBe(g.burnTicks);
    expect(g.columns.length).toBe(0);
    expect(columns(g.tick(TICK_MS)).length).toBe(1);
    expect(g.moves).toBe(31);
  });
  it('is off by default: moves counted, the furnace untouched', () => {
    const g = new Distilling(seeded(2)), left = g.timeLeft();
    expect(g.moved()).toEqual([]);
    expect(g.timeLeft()).toBe(left);
    expect(g.moves).toBe(1);
  });
});

describe('rich spice (21 Nov)', () => {
  it('makes the next columns richer in whites and spice when a spice goes up in a Crystal Clear', () => {
    const g = new Distilling(seeded(5), { richSpice: true }).lay(parseBoard(sea('b')));
    fill(g, COLS - 1, 'w'); g.cols[COLS - 1][2] = SPICE;
    const [{ column: c }] = burn(g);
    expect(c.rich).toBe(true);
    expect(g.rich).toBe(RICH_COLUMNS - 1);
    burn(g);
    expect(g.rich).toBe(0);
    // Rich pieces: half white, spice one in twelve.
    const r = new Distilling(seeded(9)), n = [0, 0, 0, 0, 0];
    for (let i = 0; i < 24000; i++) n[r.nextPiece(true)]++;
    expect(n[WHITE] / 24000).toBeCloseTo(11 / 24, 1);
    expect(n[SPICE] / 24000).toBeCloseTo(1 / 12, 1);
    expect(n[BROWN]).toBeGreaterThan(0);
  });
  it('does nothing for a spice sent up out of a Crystal Clear, or with the flag off', () => {
    const g = new Distilling(seeded(5), { richSpice: true }).lay(parseBoard(sea('b')));
    g.cols[COLS - 1][2] = SPICE;
    expect(burn(g)[0].column.rich).toBeUndefined();
    const off = new Distilling(seeded(5)).lay(parseBoard(sea('b')));
    fill(off, COLS - 1, 'w'); off.cols[COLS - 1][2] = SPICE;
    burn(off);
    expect(off.rich).toBe(0);
  });
});
