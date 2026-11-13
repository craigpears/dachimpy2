/* A piece brought round to take a stuck piece's place (src/distill-path.ts; the user, 13 Nov, the eighteenth
   note: "Find the path of a piece that could take that white's place. But obviously that pathfinding can
   involve loops"). */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, COLS, DOWN_LEFT, Distilling, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { PATH, bringRound, pathMoves, stuck } from '../src/distill-path';
import { playDrags } from '../src/distill-routines';
import type { Ctx } from '../src/distill-routines';
import { HELIUM, contextFor } from '../src/distill-bots';
import { trappedWhite } from '../src/distill-score';
import { seeded } from '../src/mirror-row';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function board(at: [number, number, string][], cols = sea('w')): Board {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return parseBoard(out.map((c) => c.join('')));
}
const column = (x: number, s: string): [number, number, string][] => [...s].map((ch, y) => [x, y, ch]);
const junkCtx = (cols: Board): Ctx => contextFor(cols, 'junk', 0, 16);

/** The test page's first board (seed 1) after the bots' old first move: a white dragged to the top of column 7. */
const usersBoard = () => playDrags(new Distilling(seeded(1)).cols, [{ x: 8, y: 1, ways: [UP_LEFT, UP_LEFT] }])!;

describe('bringing a piece round (13 Nov, the eighteenth note)', () => {
  it('the white trapped at the top is freed by the brown looped round under it, 13 Nov ("the next step I would have taken is to loop the brown around, because I really want to get rid of that ... trapped white")', () => {
    const cols = usersBoard();
    expect(trappedWhite(cols, 6, 0)).toBe(true);
    expect(stuck(cols, junkCtx(cols))).toContainEqual({ x: 6, y: 0, side: -1 });
    const drags = bringRound(cols, { x: 6, y: 0, side: -1 }, HELIUM)!;
    expect(drags).toHaveLength(1);
    // The brown just below and right of it: up-left, up-left through the whites, round, and up-right into its place.
    expect(drags[0]).toEqual({ x: 7, y: 1, ways: [UP_LEFT, UP_LEFT, UP_RIGHT] });
    expect(cols[7][1]).toBe(BROWN);
    const after = playDrags(cols, drags)!;
    expect(after[6][0]).toBe(BROWN);
    // And the white is out left, with a way on left.
    expect(after[5][0]).toBe(WHITE);
    expect(trappedWhite(after, 5, 0)).toBe(false);
  });
  it('junk stuck in the whites too: a black on the bottom has a brown brought round to its upper right, and climbs out right', () => {
    // A black on the bottom of the whites: its only way right is up into a brown. A brown on the bottom further
    // right comes up-left through the whites, then down-left past the black, which rises out.
    const cols = board([[4, 8, 'K'], [6, 8, 'b'], ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')]);
    const s = stuck(cols, junkCtx(cols)).find((p) => p.x === 4 && p.y === 8)!;
    expect(s).toEqual({ x: 4, y: 8, side: 1 });
    const drags = bringRound(cols, s, HELIUM)!;
    expect(drags).toEqual([{ x: 6, y: 8, ways: [UP_LEFT, DOWN_LEFT] }]);
    const after = playDrags(cols, drags)!;
    expect(after[4][8]).toBe(BROWN);
    expect(after[5][7]).toBe(BLACK);
  });
  it('none to be had: a white stuck with no piece that can come to it within reach', () => {
    // A white on the top of an all-black column beside the furnace, everything left of it white: no brown
    // anywhere to come under it.
    const cols = board([...column(7, 'KKKKKKKK'), ...column(8, 'wKKKKKKKK'), ...column(9, 'KKKKKKKK')]);
    expect(bringRound(cols, { x: 8, y: 0, side: -1 }, HELIUM)).toBeNull();
  });
  it('the cheapest in a person\'s time: one drag, no longer than the search\'s reach, every swap by the rules', () => {
    const cols = usersBoard();
    for (const m of pathMoves(cols, junkCtx(cols), HELIUM)) {
      expect(m.routine).toBe('path');
      expect(m.drags).toHaveLength(1);
      expect(m.drags[0].ways.length).toBeLessThanOrEqual(PATH.SWAPS + 1);
      expect(playDrags(cols, m.drags)).not.toBeNull();
      expect(m.reason).toMatch(/stuck: bring the (brown|black|white) at column \d+, row \d+ round/);
    }
  });
  it('cheap enough to run on every move in the browser', () => {
    let worst = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const cols = new Distilling(seeded(seed)).cols, ctx = junkCtx(cols), t = performance.now();
      pathMoves(cols, ctx, HELIUM);
      worst = Math.max(worst, performance.now() - t);
    }
    expect(worst).toBeLessThan(250);
  });
});
