/* The board score Stage I is judged by (src/distill-score.ts; the user, 12 Nov, the eleventh note: "how many
   whites have moved to the left, how many other pieces have moved to the right ... Like completed brown black
   columns with no whites in on the right, good"). */
import { describe, expect, it } from 'vitest';
import { COLS, SHORT, TALL, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { S, behindSpice, boardScore, doneFromRight, junkDone, seams, trapped } from '../src/distill-score';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function board(at: [number, number, string][], cols = sea('w')): Board {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return parseBoard(out.map((c) => c.join('')));
}
const column = (x: number, s: string): [number, number, string][] => [...s].map((ch, y) => [x, y, ch]);

describe('the board score (12 Nov)', () => {
  it('whites further left and junk further right score more ("how many whites have moved to the left, how many other pieces have moved to the right")', () => {
    // One black and the white beside it, swapped a column across: the black right, the white left.
    const left = board([[3, 4, 'K']]), right = board([[4, 4, 'K']]);
    expect(seams(right)).toBe(seams(left));
    expect(boardScore(right) - boardScore(left)).toBe(S.WHITE + S.JUNK);
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
  it('the same colour stacked against the junk scores above a line of it through the whites, 12 Nov ("zigzagging so I can maintain a nice wall of white so I\'m not creating that line in the middle")', () => {
    // Three blacks in each of columns 5 to 7 both times: stacked low against the junk, the whites above them one
    // block; or a slanting line of them across the whites, whites above and below it.
    const junkRight = [...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')];
    const wall = board([...column(4, 'wwwwwwKKK'), ...column(5, 'wwwwwKKK'), ...column(6, 'wwwwwwKKK'), ...junkRight]);
    const line = board([...column(4, 'wKKKwwwww'), ...column(5, 'wwKKKwww'), ...column(6, 'wwwwKKKww'), ...junkRight]);
    expect(seams(line)).toBeGreaterThan(seams(wall));
    expect(boardScore(wall)).toBeGreaterThan(boardScore(line));
  });
  it('a black on the bottom of the whites, with no way right, is trapped', () => {
    const cols = board([[4, 8, 'K'], [3, 3, 'K']]);
    expect(trapped(cols, 4, 8)).toBe(true);
    expect(trapped(cols, 3, 3)).toBe(false);
  });
});
