/* Distilling's rules (src/distilling.ts), as DISTILLING.md has them from the port of the game's own
   client (12 Nov). */
import { describe, expect, it } from 'vitest';
import {
  BLACK, BROWN, BURNT, BURN_TICKS, CARRY_ON, COLS, DOWN_LEFT, DOWN_RIGHT, Distilling, FLASK, MESSAGES, SHORT, SLIDE_MS, SPICE,
  SWAP_MS, TALL, TICK_MS, UP_LEFT, UP_RIGHT, WARN_TICK, WHITE, goesUp, judge, parseBoard, writeBoard,
} from '../src/distilling';
import type { DistillEvent } from '../src/distilling';
import { seeded } from '../src/mirror-row';

/** A board of one piece everywhere, tall and short in turn from a tall first column. */
const sea = (ch: string, short = false) => Array.from({ length: COLS }, (_, x) => ch.repeat((x % 2 === 0) !== short ? TALL : SHORT));
/** A game on a board laid out (columns as strings, top to bottom), new pieces from `random`. */
const laid = (cols: string[], random = seeded(1)) => new Distilling(random).lay(parseBoard(cols));
/** Put pieces at places on a board of strings. */
function put(cols: string[], at: [number, number, string][]): string[] {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return out.map((c) => c.join(''));
}
/** Send a column off the right of the board now (laid in by hand first), and let the board slide. */
function send(g: Distilling, col: string): DistillEvent[] {
  const n = g.cols[COLS - 1].length;
  g.cols[COLS - 1] = parseBoard([col.padEnd(n, col[col.length - 1]).slice(0, n)])[0];
  const ev = g.burnNow();
  g.tick(SLIDE_MS);
  return ev;
}
const columnOf = (ev: DistillEvent[]) => ev.find((e) => e.kind === 'column') as Extract<DistillEvent, { kind: 'column' }> | undefined;

describe('the board (12 Nov)', () => {
  it('is ten columns, tall and short in turn from a tall one on the left, 85 pieces', () => {
    const g = new Distilling(seeded(3));
    expect(g.cols.map((c) => c.length)).toEqual([9, 8, 9, 8, 9, 8, 9, 8, 9, 8]);
    expect(g.cols.flat().length).toBe(85);
  });
  it('starts with the column by the furnace all black, and no spice in the two beside it', () => {
    for (let s = 1; s <= 200; s++) {
      const g = new Distilling(seeded(s));
      expect(g.cols[9]).toEqual(Array(SHORT).fill(BLACK));
      expect([...g.cols[7], ...g.cols[8]]).not.toContain(SPICE);
    }
  });
  it('makes 1 piece in 31 a spice, the rest white, brown and black evenly', () => {
    const g = new Distilling(seeded(9)), n = [0, 0, 0, 0, 0];
    for (let i = 0; i < 62000; i++) n[g.nextPiece()]++;
    expect(n[SPICE] / 62000).toBeCloseTo(1 / 31, 2);
    for (const p of [WHITE, BROWN, BLACK]) expect(n[p] / 62000).toBeCloseTo(10 / 31, 1);
  });
  it('is the same board for the same seed', () => {
    expect(writeBoard(new Distilling(seeded(42)).cols)).toEqual(writeBoard(new Distilling(seeded(42)).cols));
  });
  it('links each piece to its four diagonal neighbours only, never above or below in its own column', () => {
    const g = new Distilling(seeded(1));
    // (0, 3) is in a tall column: up-right is (1, 2), down-right (1, 3); nothing to its left.
    expect(g.neighbour(0, 3, UP_RIGHT)).toEqual([1, 2]);
    expect(g.neighbour(0, 3, DOWN_RIGHT)).toEqual([1, 3]);
    expect(g.neighbour(0, 3, UP_LEFT)).toBeNull();
    // (1, 3) is in a short column, half a piece lower: its neighbours are rows 3 and 4 either side.
    expect([UP_LEFT, DOWN_LEFT, UP_RIGHT, DOWN_RIGHT].map((d) => g.neighbour(1, 3, d))).toEqual([[0, 3], [0, 4], [2, 3], [2, 4]]);
    expect(g.linked(0, 3, 0, 4)).toBe(false);
    expect(g.linked(1, 3, 2, 3)).toBe(true);
    // A tall column's top and bottom pieces have one neighbour each side.
    expect(g.neighbour(0, 0, UP_RIGHT)).toBeNull();
    expect(g.neighbour(0, 8, DOWN_RIGHT)).toBeNull();
  });
});

describe('the swap rule: the lower piece beats the upper (12 Nov)', () => {
  // (0, 3) tall sits above (1, 3) short; (1, 2) short sits above (0, 3).
  const pair = (upper: string, lower: string) => laid(put(sea('w'), [[0, 3, upper], [1, 3, lower]]));
  it('a white rises past a black', () => {
    const g = pair('K', 'w');
    expect(g.swap(0, 3, 1, 3)).toBe(true);
    expect([g.at(0, 3), g.at(1, 3)]).toEqual([WHITE, BLACK]);
  });
  it('a brown rises past a white', () => {
    expect(pair('w', 'b').swap(1, 3, 0, 3)).toBe(true);
  });
  it('a black rises past a brown', () => {
    expect(pair('b', 'K').swap(0, 3, 1, 3)).toBe(true);
  });
  it('the other way round, nothing swaps: a black over a white, a white over a brown, a brown over a black', () => {
    expect(pair('w', 'K').swap(0, 3, 1, 3)).toBe(false);
    expect(pair('b', 'w').swap(0, 3, 1, 3)).toBe(false);
    expect(pair('K', 'b').swap(0, 3, 1, 3)).toBe(false);
  });
  it('the same colours never swap, nor a burnt white with a white', () => {
    for (const ch of ['w', 'b', 'K', 'x']) expect(pair(ch, ch).swap(0, 3, 1, 3)).toBe(false);
    expect(pair('x', 'w').swap(0, 3, 1, 3)).toBe(false);
  });
  it('a burnt white swaps exactly like a white', () => {
    expect(pair('K', 'x').swap(0, 3, 1, 3)).toBe(true);
    expect(pair('x', 'b').swap(0, 3, 1, 3)).toBe(true);
  });
  it('spice never moves, under or over anything', () => {
    for (const ch of ['w', 'b', 'K', 'x']) {
      expect(pair('*', ch).swap(0, 3, 1, 3)).toBe(false);
      expect(pair(ch, '*').swap(0, 3, 1, 3)).toBe(false);
    }
  });
  it("can't swap pieces that aren't linked, even ones that would", () => {
    const g = laid(put(sea('w'), [[0, 3, 'K'], [0, 4, 'w'], [2, 3, 'w']]));
    expect(g.swap(0, 3, 0, 4)).toBe(false);
    expect(g.swap(0, 3, 2, 3)).toBe(false);
  });
  it("can't be undone straight away: the pair is now the wrong way round", () => {
    const g = pair('K', 'w');
    expect(g.swap(0, 3, 1, 3)).toBe(true);
    expect(g.swap(0, 3, 1, 3)).toBe(false);
    expect(g.swap(1, 3, 0, 3)).toBe(false);
  });
  it('lights the corners a piece can swap toward', () => {
    // A brown in whites can only rise: up-left and up-right.
    const g = laid(put(sea('w'), [[3, 3, 'b']]));
    expect(g.mask(3, 3)).toBe((1 << UP_LEFT) | (1 << UP_RIGHT));
    // A black in whites can only sink.
    const h = laid(put(sea('w'), [[3, 3, 'K']]));
    expect(h.mask(3, 3)).toBe((1 << DOWN_LEFT) | (1 << DOWN_RIGHT));
    expect(laid(sea('w')).allSwaps()).toEqual([]);
  });
});

describe('dragging (12 Nov)', () => {
  it('a black dragged down-right sinks through the whites a column at a time', () => {
    const g = laid(put(sea('w'), [[0, 0, 'K']]));
    const d = g.dragWays(0, 0, [DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT]);
    expect(d.swaps).toBe(4);
    expect(g.at(...d.at)).toBe(BLACK);
    expect(d.at).toEqual([4, 2]);
    expect(g.cols.flat().filter((p) => p === BLACK).length).toBe(1);
  });
  it('a drag stops at the first swap it can\'t make', () => {
    const g = laid(put(sea('w'), [[0, 0, 'K']]));
    expect(g.dragWays(0, 0, [DOWN_RIGHT, UP_RIGHT, DOWN_RIGHT]).swaps).toBe(1);
  });
  it('the mouse over a piece it can\'t swap with does nothing, and the drag goes on from where it is', () => {
    const g = laid(put(sea('w'), [[0, 0, 'K']]));
    // Down-right to (1, 0); then (2, 0) is up-right of it, where a black can't go in whites; then (2, 1).
    const d = g.drag([[0, 0], [1, 0], [2, 0], [2, 1]]);
    expect(d).toEqual({ swaps: 2, at: [2, 1] });
  });
  it('a slightly sloppy drag still goes where it was meant: the mouse nearest a way it can go', () => {
    const g = laid(put(sea('w'), [[3, 3, 'K']]));
    // Straight right: a black in whites can only go down-right of the two.
    expect(g.wayToward(3, 3, 0.9, 0)).toBe(DOWN_RIGHT);
    // Up-right it can't go at all, so nothing.
    expect(g.wayToward(3, 3, 0.8, -0.6)).toBeNull();
    // Too little movement: nothing yet.
    expect(g.wayToward(3, 3, 0.3, 0.2)).toBeNull();
  });
  it('a drag swaps into the next place only once the pointer is well into it (12 Nov: "Oh shoot! I just pulled it one thing too many. This is a bit sensitive")', () => {
    const g = laid(put(sea('w'), [[3, 3, 'K']]));
    // Just over the edge of the place down-right: not yet.
    expect(g.wayToward(3, 3, 0.55, 0.28)).toBeNull();
    // Well into it, two thirds of the way to its middle: now.
    expect(g.wayToward(3, 3, 0.7, 0.35)).toBe(DOWN_RIGHT);
  });
  it('moves a black and a brown level through whites together, three swaps a column (the crawl)', () => {
    // DISTILLING.md's sketch: brown at (1, 1) (short), black at (0, 2) (tall), in whites.
    const g = laid(put(sea('w'), [[1, 1, 'b'], [0, 2, 'K']]));
    const where = () => { const out: string[] = []; g.cols.forEach((c, x) => c.forEach((p, y) => { if (p !== WHITE) out.push(`${'wbK*x'[p]}${x},${y}`); })); return out.sort(); };
    expect(g.swapToward(0, 2, UP_RIGHT)).toEqual([1, 1]);   // the black up through the brown
    expect(g.swapToward(1, 1, DOWN_RIGHT)).toEqual([2, 2]);  // the black down through a white
    expect(g.swapToward(0, 2, UP_RIGHT)).toEqual([1, 1]);   // the brown up through a white
    expect(g.swapToward(1, 1, DOWN_RIGHT)).toEqual([2, 2]);  // the brown down past the black (which goes back up-left)
    expect(g.swapToward(2, 2, UP_RIGHT)).toEqual([3, 1]);   // the brown up through a white
    expect(g.swapToward(1, 1, DOWN_RIGHT)).toEqual([2, 2]);  // the black down through a white
    expect(where()).toEqual(['K2,2', 'b3,1']);   // as they were at (0, 2) and (1, 1), two columns right
  });
});

describe('the furnace (12 Nov)', () => {
  it('burns the rightmost column on its 50th tick of 306 ms, 15.3 seconds, and warns about 3 seconds before', () => {
    const g = new Distilling(seeded(5));
    const ev = g.tick(TICK_MS * WARN_TICK);
    expect(ev).toEqual([]);
    expect(g.tick(TICK_MS).map((e) => e.kind)).toEqual(['warning']);
    expect(g.tick(TICK_MS * (BURN_TICKS - WARN_TICK - 1)).filter((e) => e.kind === 'column')).toEqual([]);
    expect(g.time).toBe(TICK_MS * BURN_TICKS);
    const last = g.tick(TICK_MS);
    expect(columnOf(last)?.column.up).toBe(false);   // the all-black column burns
    expect(g.time).toBe(15300);
  });
  it('then the next one 15.3 seconds after that', () => {
    const g = new Distilling(seeded(5));
    g.tick(15300);
    expect(g.columns.length).toBe(1);
    g.tick(15300 - TICK_MS);
    expect(g.columns.length).toBe(1);
    g.tick(TICK_MS);
    expect(g.columns.length).toBe(2);
  });
  it('a burn waits for a swap still moving', () => {
    const g = laid(put(sea('w'), [[0, 3, 'K'], [1, 3, 'w']]));
    g.tick(TICK_MS * (BURN_TICKS + 1) - 10);
    expect(g.swap(0, 3, 1, 3)).toBe(true);
    expect(g.tick(10)).toEqual([]);
    expect(g.due).toBe(true);
    expect(columnOf(g.tick(SWAP_MS - 10))).toBeTruthy();
  });
  it('burning now goes at once, whatever the timer, and restarts it', () => {
    const g = new Distilling(seeded(5));
    g.tick(4000);
    expect(columnOf(g.burnNow())).toBeTruthy();
    expect(g.timeLeft()).toBe(15300);
    g.tick(15300 - 1);
    expect(g.columns.length).toBe(1);
    g.tick(1);
    expect(g.columns.length).toBe(2);
  });
  it('slides the board right for 900 ms after a column goes, when nothing can be moved', () => {
    const g = laid(put(sea('w'), [[2, 3, 'K'], [3, 3, 'w']]));
    g.burnNow();
    // Everything moved right a column: the black is at (3, 3) now, its white at (4, 3).
    expect(g.at(3, 3)).toBe(BLACK);
    expect(g.swap(3, 3, 4, 3)).toBe(false);
    expect(g.burnNow()).toEqual([]);
    g.tick(SLIDE_MS - 1);
    expect(g.swap(3, 3, 4, 3)).toBe(false);
    g.tick(1);
    expect(g.swap(3, 3, 4, 3)).toBe(true);
  });
  it('brings in a new column on the left the opposite height of its neighbour', () => {
    const g = new Distilling(seeded(5));
    g.burnNow();
    expect(g.cols.map((c) => c.length)).toEqual([8, 9, 8, 9, 8, 9, 8, 9, 8, 9]);
    g.tick(SLIDE_MS); g.burnNow();
    expect(g.cols.map((c) => c.length)).toEqual([9, 8, 9, 8, 9, 8, 9, 8, 9, 8]);
  });
});

describe('which way a column goes, and what it says (12 Nov)', () => {
  const p = (s: string) => parseBoard([s])[0];
  it('goes up with as many whites as blacks or more, a pure brown column too; burns with more blacks', () => {
    expect(goesUp(p('wwwwKKKKb'))).toBe(true);
    expect(goesUp(p('bbbbbbbb'))).toBe(true);
    expect(goesUp(p('wwwKKKKbb'))).toBe(false);
    expect(goesUp(p('bbbbbbbK'))).toBe(false);
    expect(goesUp(p('xKbbbbbb'))).toBe(true);   // a burnt white weighs like a white
    expect(goesUp(p('**bbbbbK'))).toBe(false);
  });
  it('Crystal clear: only whites and spice, scoring 1 a white and 3 a spice', () => {
    const c = judge(p('wwww*wwww'), 0);
    expect([c.up, c.message, c.spice, c.points, c.chain]).toEqual([true, 'clear', 'spicy', 11, 1]);
    expect(MESSAGES.clear).toBe('Crystal clear!');
  });
  it('Smooooooth: no blacks, more whites than browns', () => {
    expect(judge(p('wwwwwwbb'), 0).message).toBe('smooth');
    expect(judge(p('wwwwbbbb'), 0).message).toBeNull();
  });
  it('Blecch!: as many blacks as whites', () => {
    const c = judge(p('wwwwKKKKb'), 0);
    expect([c.up, c.message, c.points]).toEqual([true, 'blecch', 0]);
    expect(judge(p('wwwwwKKKb'), 0).message).toBeNull();
  });
  it('a pure brown column goes up with no message and no points, and breaks a chain', () => {
    const c = judge(p('bbbbbbbbb'), 5);
    expect([c.up, c.message, c.points, c.bonus, c.chain]).toEqual([true, null, 0, 0, 0]);
  });
  it('Burnt!: a column that burns with whites in it; Wasted Spice, -3 a spice', () => {
    const c = judge(p('ww*KKKKbb'), 3);
    expect([c.up, c.message, c.spice, c.points, c.chain]).toEqual([false, 'burnt', 'wasted', -3, 0]);
    expect(judge(p('bbbKKKKb'), 0).message).toBeNull();
  });
  it('a burnt white spoils a Crystal Clear, and scores -3', () => {
    const c = judge(p('wwwwxwwww'), 4);
    expect([c.up, c.message, c.chain, c.points]).toEqual([true, null, 0, 8 - 3]);
  });
});

describe('scoring a Crystal Clear chain (12 Nov)', () => {
  it('scores 4 more for every Crystal Clear straight before it, and anything else breaks the chain', () => {
    const g = new Distilling(() => 0);
    const got = [];
    for (const col of ['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'bbbbbbbb', 'wwwwwwwww']) {
      const c = columnOf(send(g, col))!.column;
      got.push([c.chain, c.bonus, c.points + c.bonus]);
    }
    expect(got).toEqual([[1, 0, 8], [2, 4, 13], [3, 8, 16], [0, 0, 0], [1, 0, 8]]);
    expect(g.longest).toBe(3);
  });
  it('a burned column breaks it too', () => {
    const g = new Distilling(() => 0);
    send(g, 'wwwwwwwww'); send(g, 'wwwwwwww');
    expect(g.chain).toBe(2);
    send(g, 'KKKKKKKKK');
    expect(g.chain).toBe(0);
  });
  it('CC^12 with no spice is 366 points, 30.5 a column', () => {
    const g = new Distilling(() => 0);
    for (let i = 0; i < 12; i++) send(g, 'wwwwwwwww');
    expect(g.longest).toBe(12);
    // (12 columns of 9 and 8 in turn: 102 whites, and 4 x (0 + 1 + ... + 11) = 264)
    expect(g.points).toBe(102 + 264);
    expect(g.score()).toBe(30.5);
  });
  it('the session score is points a column sent up: burned columns don\'t count', () => {
    const g = new Distilling(() => 0);
    send(g, 'KKKKKKKKK'); send(g, 'wwwwwwww'); send(g, 'wwwwwwwww');
    expect(g.columnsUp).toBe(2);
    expect(g.score()).toBe((8 + 9 + 4) / 2);
  });
});

describe('burnt whites (12 Nov)', () => {
  it('every two whites burned make the next white made a burnt white', () => {
    const g = new Distilling(() => 0);   // every new piece a white
    send(g, 'wKKKKKKKK');                // 1 white burned: nothing owed yet
    expect(g.cols[0]).not.toContain(BURNT);
    send(g, 'wKKKKKKKK');                // the 2nd: the next white made is burnt
    expect(g.cols[0].filter((p) => p === BURNT).length).toBe(1);
    send(g, 'wwwKKKKKK');                // three more: one burnt now, one owed
    expect(g.cols[0].filter((p) => p === BURNT).length).toBe(1);
    send(g, 'wKKKKKKKK');
    expect(g.cols[0].filter((p) => p === BURNT).length).toBe(1);
    expect(g.whitesBurned).toBe(6);
  });
  it('a burnt white burned isn\'t counted again', () => {
    const g = new Distilling(() => 0);
    send(g, 'xxKKKKKKK');
    expect(g.owed).toBe(0);
  });
});

describe('the end of a session (12 Nov)', () => {
  it('ends once 100 pieces are in the flask: the 12th column sent up', () => {
    const g = new Distilling(() => 0);
    const cols = ['wwwwbbbbb', 'wwwwbbbb'];
    let n = 0;
    while (!g.finished) { send(g, cols[n % 2]); n++; }
    expect(n).toBe(12);
    expect(g.flask).toBeGreaterThanOrEqual(FLASK);

  });
  it('burned columns don\'t fill the flask', () => {
    const g = new Distilling(() => 0);
    for (let i = 0; i < 20; i++) send(g, 'KKKKKKKKK');
    expect([g.flask, g.finished]).toEqual([0, false]);
  });
  it('carries on past 100 at CC^12 until a column that isn\'t Crystal Clear leaves', () => {
    const g = new Distilling(() => 0);
    for (let i = 0; i < 14; i++) send(g, 'wwwwwwwww');
    expect([g.finished, g.chain, g.flask]).toEqual([false, 14, 119]);
    const ev = send(g, 'wwwwbbbbb');
    expect(columnOf(ev)!.finished).toBe(true);
    expect(g.finished).toBe(true);
  });
  it('a chain short of 12 when the flask fills ends there as ever', () => {
    const g = new Distilling(() => 0);
    send(g, 'bbbbbbbbb');
    for (let i = 0; i < 10; i++) send(g, 'wwwwwwwww');
    expect(g.finished).toBe(false);
    const ev = send(g, 'wwwwwwwww');
    expect(columnOf(ev)!.finished).toBe(true);
    expect([g.finished, g.flask >= FLASK, g.chain]).toEqual([true, true, 11]);
    expect(CARRY_ON).toBe(12);
  });
  it('dismissing ends it at once, keeping what was sent up', () => {
    const g = new Distilling(() => 0);
    send(g, 'wwwwwwwww');
    g.dismiss();
    expect([g.finished, g.dismissed, g.points]).toEqual([true, true, 8]);   // (the first column out is a short one)
    expect(g.burnNow()).toEqual([]);
    expect(g.tick(20000)).toEqual([]);
  });
});

describe('the flask (12 Nov)', () => {
  it('fills with pieces sent up, paler and clearer the purer the batch, darker with blacks', () => {
    const pure = new Distilling(() => 0), murky = new Distilling(() => 0);
    for (let i = 0; i < 3; i++) { send(pure, 'wwwwwwwww'); send(murky, 'wwwwKKKKb'); }
    const a = pure.liquid(), b = murky.liquid();
    expect(a.level).toBeCloseTo(25 / 100);
    expect(a.alpha).toBeLessThan(0.1);
    expect(b.bri).toBeLessThan(0.5);
  });
});

describe('paused, for demos (12 Nov)', () => {
  it('a burn still goes while paused, the furnace standing still (the user: "when I\'m in pause mode as well, I need a burn button so I can demo these")', () => {
    const g = new Distilling(seeded(4));
    g.tick(2000);
    const clock = g.clock, furnace = g.furnace, time = g.time;
    // Paused: nothing but settle() passes. A swap made, then burn now: the swap lands and the burn goes.
    const [x1, y1, x2, y2] = g.allSwaps()[0];
    expect(g.swap(x1, y1, x2, y2)).toBe(true);
    const ev = [...g.burnNow(), ...g.settle(SWAP_MS)];
    expect(ev.some((e) => e.kind === 'column')).toBe(true);
    expect(g.movable).toBe(false);
    g.settle(SLIDE_MS);
    expect(g.movable).toBe(true);
    // ... and the time played hasn't moved; the furnace starts afresh only once it's running again.
    expect(g.time).toBe(time);
    expect(g.furnace).not.toBe(furnace + 1);
    expect(clock).toBeGreaterThanOrEqual(0);
  });
});