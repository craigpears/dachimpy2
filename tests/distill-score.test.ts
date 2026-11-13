/* The board score Stage I is judged by (src/distill-score.ts; the user, 12 Nov, the eleventh note: "Like
   completed brown black columns with no whites in on the right, good"; and simpler, 13 Nov, the eighteenth:
   "Metric is how many columns are filled, second metric, how straight and vertical is the ... wall"). */
import { describe, expect, it } from 'vitest';
import { COLS, Distilling, SHORT, TALL, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { S, behindSpice, boardScore, doneFromRight, junkDone, trapped, trappedWhite, wall } from '../src/distill-score';
import { playDrags } from '../src/distill-routines';
import { seeded } from '../src/mirror-row';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function board(at: [number, number, string][], cols = sea('w')): Board {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return parseBoard(out.map((c) => c.join('')));
}
const column = (x: number, s: string): [number, number, string][] => [...s].map((ch, y) => [x, y, ch]);

describe('the board score (12 Nov)', () => {
  it('colour pulled from the left to the right scores, and no more for the white it passes going left, 13 Nov ("forget about dragging whites to the left ... you just want to pull things from the left to the right")', () => {
    // One black and the white beside it, swapped a column across: the black right, the white left.
    const left = board([[3, 4, 'K']]), right = board([[4, 4, 'K']]);
    expect(boardScore(right) - boardScore(left)).toBe(S.PULL);
  });
  it('the column being filled on the right counts each piece of junk in it, 13 Nov ("Metric is how many columns are filled")', () => {
    // The last two columns junk but for one white in the furnace's: a black swapped in for it from the left.
    const one = board([...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbw'), [8, 8, 'K']]);
    const two = board([...column(8, 'KKKKbbbbw'), ...column(9, 'KKKKbbbK')]);
    expect(doneFromRight(one)).toBe(0);
    expect(doneFromRight(two)).toBe(1);
    expect(boardScore(two) - boardScore(one)).toBeGreaterThan(S.COLUMN - TALL * S.FILL);
  });
  it('a completed junk column with no white scores above one with a white in it, 12 Nov ("completed brown black columns with no whites in on the right, good")', () => {
    // The same pieces: one brown and one white swapped across between the last two columns.
    const done = board([...column(9, 'KKKKbbbb')]);
    const white = board([...column(9, 'KKKKwbbb'), [8, 4, 'b']]);
    expect(doneFromRight(done)).toBe(1);
    expect(doneFromRight(white)).toBe(0);
    // More than the swap alone is worth: the bonus.
    expect(doneFromRight(done) - doneFromRight(white)).toBe(1);
    expect(boardScore(done)).toBeGreaterThan(boardScore(white) + S.COLUMN / 2);
  });
  it('done junk columns count from the right-hand edge in: one further in counts only once those right of it are done', () => {
    expect(doneFromRight(board([...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')]))).toBe(2);
    expect(doneFromRight(board([...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbw')]))).toBe(0);
  });
  it('a column of browns alone is not done: it floats up rather than burns', () => {
    expect(junkDone([1, 1, 1, 1, 1, 1, 1, 1])).toBe(false);
    expect(junkDone([2, 1, 1, 1, 1, 1, 1, 1])).toBe(true);
  });
  it('sorting the junk earns nothing: a black swapped up past a brown scores the same', () => {
    const a = board([...column(8, 'bKbbbbbbb'), ...column(9, 'KKKKbbbb')]), b = board([...column(8, 'Kbbbbbbbb'), ...column(9, 'KKKKbbbb')]);
    expect(boardScore(a)).toBe(boardScore(b));
  });
  it('a white trapped behind the spice at the top right is one of the worst things to leave, 12 Nov ("one of the first things I\'ve done is cleared that white piece that\'s kind of trapped behind the spice at the top right")', () => {
    // notes/distilling/24-white-behind-the-spice.webp: column 7's top white, a spice just under it, junk round it.
    const junkRight = [...column(7, 'KbKbKbKb'), ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')];
    const pocket = board([...column(6, 'w*KbKbKbK'), ...junkRight]);
    const freed = board([...column(6, 'K*KbKbKbK'), [5, 0, 'w'], ...junkRight]);
    expect(behindSpice(pocket, 6, 0)).toBe(true);
    expect(behindSpice(freed, 5, 0)).toBe(false);
    // Freeing it is worth far more than the column it moved.
    expect(boardScore(freed) - boardScore(pocket)).toBeGreaterThanOrEqual(S.POCKET);
  });
  it('once the wall between the whites and the colour has formed, a straight upright one scores above a slanting one, 13 Nov ("how straight and vertical is the ... wall where the white meets the color")', () => {
    // The colour on the right: stood upright in the last three columns, or slanting, two columns wide at the top
    // and four at the bottom.
    const upright = board([7, 8, 9].flatMap((x) => column(x, x % 2 === 0 ? 'KKKKbbbbb' : 'KKKKbbbb')));
    const slant = board([...column(6, 'wwwwwKKKK'), ...column(7, 'wwKKbbbb'), ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')]);
    expect(wall(upright).off).toBe(0);
    expect(wall(slant).off).toBeGreaterThan(0);
    expect(wall(upright).rows.every((b) => b === 7)).toBe(true);
    expect(boardScore(upright)).toBeGreaterThan(boardScore(slant));
  });
  it('before a wall has formed, there is none to judge: a mixed board scores nothing for it', () => {
    const g = new Distilling(seeded(1));
    expect(wall(g.cols).off).toBe(0);
    expect(wall(g.cols).rows.every((b) => b === null)).toBe(true);
  });
  it('a black on the bottom of the whites, with no way right, is trapped', () => {
    const cols = board([[4, 8, 'K'], [3, 3, 'K']]);
    expect(trapped(cols, 4, 8)).toBe(true);
    expect(trapped(cols, 3, 3)).toBe(false);
  });
  it('a white dragged up to the top among the blacks is trapped, 13 Nov (the bot\'s first move "went the entire way so that there was a white trap right at the top. So I don\'t know how that\'s following the instruction of don\'t trap things")', () => {
    // notes/distilling/35- and 36-*: the test page's first board (seed 1), and the bots' old first move: the white
    // second from the top of the second column from the right, dragged up-left twice to the top of column 7.
    const cols = new Distilling(seeded(1)).cols;
    const once = playDrags(cols, [{ x: 8, y: 1, ways: [1] }])!, twice = playDrags(cols, [{ x: 8, y: 1, ways: [1, 1] }])!;
    expect(trappedWhite(twice, 6, 0)).toBe(true);
    // One swap up-left it can still go on left (up into the black above it); the second leaves it on the top
    // edge, the white below it its only way left: stuck till a brown is brought round under it.
    expect(trappedWhite(once, 7, 0)).toBe(false);
    expect(boardScore(once)).toBeGreaterThan(boardScore(twice));
  });
  it('whites at the top of the whites\' own side aren\'t trapped: only on the colour\'s side', () => {
    // A river of whites in the middle, colour coming in on the left: its top whites have junk far left in their
    // row, but they're home.
    const cols = parseBoard(['KwwwKbwbw', 'KwKwwbwb', 'wwKwwwbwb', 'wKwwwwbw', 'wwwwwwwww', 'wwwwwwww', 'KbKbKKbbb', 'KKbKbKbb', 'KbKbKKbbK', 'bKKKbbbb']);
    expect(trappedWhite(cols, 4, 0)).toBe(false);
    expect(trappedWhite(cols, 4, 8)).toBe(false);
  });
});
