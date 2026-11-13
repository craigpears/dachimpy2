/* A piece brought round to take a stuck piece's place (src/distill-path.ts; the user, 13 Nov, the eighteenth
   note: "Find the path of a piece that could take that white's place. But obviously that pathfinding can
   involve loops"). */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, COLS, DOWN_LEFT, Distilling, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { PATH, bringRound, openWay, pathMoves, stuck } from '../src/distill-path';
import { playDrags } from '../src/distill-routines';
import type { Ctx } from '../src/distill-routines';
import { HELIUM, choose, contextFor, weigh } from '../src/distill-bots';
import { helpFor } from '../src/den-helium';
import { HELP } from '../src/lines/helium';
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
  it('when no single drag reaches the whites at the bottom right, a brown is moved up first to open the way, 13 Nov ("you have to drag that brown upwards so then you could drag a black over and into that spot")', () => {
    // notes/distilling/37-move-a-brown-to-open-the-path.webp, read off the picture: whites low in the two
    // right-hand columns, next to burn, and no junk piece with a drag of its own down to them.
    const cols = parseBoard(['KKKwwKbKK', 'wwwKwbww', 'KwwKKw*Kw', 'bbwwbwbK', '*wKwKKbwb', 'bKwKbwKb', 'b*wKbbKbw', 'KwKbbKbw', 'KbwKKKbwK', 'bbKbbbww']);
    const ctx = junkCtx(cols), s = { x: 9, y: 6, side: -1 };
    expect(stuck(cols, ctx)).toContainEqual(s);
    expect(bringRound(cols, s, HELIUM)).toBeNull();
    const t = performance.now();
    const two = openWay(cols, s, HELIUM)!;
    expect(performance.now() - t).toBeLessThan(250);
    expect(two).toHaveLength(2);
    // As drawn: the brown low in the middle moved up, then the black left of it along the bottom, right and up,
    // into the white's place.
    expect(cols[two[0].x][two[0].y]).toBe(BROWN);
    expect([UP_LEFT, UP_RIGHT]).toContain(two[0].ways[0]);
    const between = playDrags(cols, [two[0]])!;
    expect(between[two[1].x][two[1].y]).toBe(BLACK);
    expect(bringRound(between, s, HELIUM)).not.toBeNull();
    const after = playDrags(cols, two)!;
    expect(after[9][6]).toBe(BLACK);
    expect(after[8][6] === WHITE || after[8][7] === WHITE).toBe(true);
    // The planner offers the pair; with the furnace close it plays it, and Helium says so in their words.
    expect(weigh({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM).some((m) => m.move.routine === 'path' && m.move.drags.length === 2)).toBe(true);
    const a = choose({ cols, chain: 0, timeLeft: 4000 }, ctx, HELIUM);
    expect(a.technique).toBe('path');
    expect(a.drags).toHaveLength(2);
    expect(a.reason).toMatch(/out of the way/);
    expect(helpFor(a).says).toBe(HELP.path);
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
