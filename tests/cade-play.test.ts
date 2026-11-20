// The tabletop blockade at the table (src/cade-play.ts): the planning pad, its preview, the stand-ins, a round.
import { describe, expect, it } from 'vitest';
import { boardFromText, freshTokens, KINDS, type Seat } from '../src/cade.js';
import { cycleGuns, cycleMove, dropGun, emptyPlan, left, pressMove, preview, setMove, standIn, Table } from '../src/cade-play.js';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const seat = (id: number, kind: string, x: number, y: number, face: 0 | 1 | 2 | 3, side: 0 | 1 = 0): Seat =>
  ({ id, kind: KINDS[kind], side, x, y, face, damage: 0, sunk: false, out: true, crew: 'normal', tokens: freshTokens(0, 16), want: 'auto' });

describe('the planning pad', () => {
  const brig = KINDS.warBrig, t = freshTokens(0, 16);   // four forwards, two lefts, two rights, ten guns

  it('a slot clicked goes round none, left, forward, right, skipping what she has none of', () => {
    let p = emptyPlan();
    const seen = [];
    for (let i = 0; i < 4; i++) { p = cycleMove(brig, t, p, 0); seen.push(p.moves[0]); }
    expect(seen).toEqual(['L', 'F', 'R', null]);
    p = setMove(brig, t, setMove(brig, t, emptyPlan(), 0, 'L'), 1, 'L');
    expect(cycleMove(brig, t, p, 2).moves[2]).toBe('F');
    expect(cycleMove(brig, t, cycleMove(brig, t, p, 2), 2).moves[2]).toBe('R');   // no lefts left
  });

  it("the mouse as the game's, 17 Nov (\"quite confusing, especially being the first click being forward ... left mouse is left, and then it cycles through. Middle mouse is forward, right mouse click is right\")", () => {
    expect(pressMove(brig, t, emptyPlan(), 0, 0).moves[0]).toBe('L');
    expect(pressMove(brig, t, emptyPlan(), 0, 1).moves[0]).toBe('F');
    expect(pressMove(brig, t, emptyPlan(), 0, 2).moves[0]).toBe('R');
    const f = pressMove(brig, t, emptyPlan(), 0, 1);
    expect(pressMove(brig, t, f, 0, 1).moves[0]).toBeNull();   // a forward clicked off again
    expect(pressMove(brig, t, f, 0, 2).moves[0]).toBe('R');    // a right over it
    expect(pressMove(brig, t, f, 0, 0).moves[0]).toBe('R');    // the left button cycles on from where it is
  });

  it('a gun right-clicked comes back out', () => {
    let p = cycleGuns(brig, t, cycleGuns(brig, t, emptyPlan(), 1, 0), 1, 0);
    expect(p.guns![1]).toEqual([2, 0]);
    p = dropGun(p, 1, 0);
    expect(p.guns![1]).toEqual([1, 0]);
    expect(dropGun(dropGun(p, 1, 0), 1, 0).guns![1]).toEqual([0, 0]);
  });

  it('a 3-move ship rests a slot: the fourth move won\'t go in', () => {
    let p = emptyPlan();
    for (const s of [0, 1, 2]) p = setMove(brig, t, p, s, 'F');
    expect(setMove(brig, t, p, 3, 'F').moves[3]).toBeNull();
    expect(cycleMove(brig, t, p, 3).moves[3]).toBeNull();
    expect(setMove(KINDS.sloop, t, p, 3, 'F').moves[3]).toBe('F');
  });

  it('guns go up to her guns a side, then back to none; tokens left count down', () => {
    let p = emptyPlan();
    p = cycleGuns(brig, t, p, 0, 1); p = cycleGuns(brig, t, p, 0, 1);
    expect(p.guns![0]).toEqual([0, 2]);
    expect(cycleGuns(brig, t, p, 0, 1).guns![0]).toEqual([0, 0]);
    p = setMove(brig, t, p, 1, 'R');
    expect(left(t, p)).toEqual({ F: 4, L: 2, R: 1, guns: 8 });
  });

  it("the preview is where her plan takes her, everyone else lying still", () => {
    const b = boardFromText(['.....', '.....', '..>..', '.....']);
    const path = preview(b, [seat(0, 'sloop', 2, 3, 0)], 0, { moves: ['F', null, null, null] });
    expect(path[0].moved.slice(0, 2)).toEqual([2, 2]);
    expect(path[0].to.slice(0, 2)).toEqual([3, 2]);   // the wind carries her on
    expect(path[3].to.slice(0, 2)).toEqual([3, 2]);
  });
});

describe('the stand-ins', () => {
  it('sail for the buoys, and fire at an enemy in line', () => {
    const b = boardFromText(['..3..', '.....', '.....', '.....', '.....', '.....']);
    const me = seat(0, 'sloop', 2, 5, 0);
    const p = standIn(b, [me], me);
    expect(p.moves.filter((m) => m === 'F').length).toBe(4);   // straight up the board to the buoy
    const foe = seat(1, 'warBrig', 3, 5, 0, 1);
    const shooter = seat(0, 'warBrig', 1, 5, 0);
    shooter.tokens.F = []; shooter.tokens.L = []; shooter.tokens.R = [];   // no moves: she can only shoot
    const q = standIn(b, [shooter, foe], shooter);
    expect(q.guns).toEqual([[0, 2], [0, 2], [0, 2], [0, 2]]);   // ten loaded, two a side a slot: every slot
    const friend = seat(1, 'warBrig', 3, 5, 0, 0);
    expect(standIn(b, [shooter, friend], shooter).guns!.flat().every((n) => n === 0)).toBe(true);
  });
});

describe('the table', () => {
  it('sets out the round, plays your plan and the stand-ins\', and scores', () => {
    const tb = new Table({ board: 'Gallows16_3', turns: 12, random: seeded(5) });
    expect(tb.cade.ships).toHaveLength(6);
    expect(tb.you.kind.id).toBe('warBrig');
    tb.press(0, 1); tb.press(1, 1);
    expect(tb.pad.moves.slice(0, 2)).toEqual(['F', 'F']);
    expect(tb.tokensLeft.F).toBe(2);
    for (let i = 0; i < 12; i++) tb.sail();
    expect(tb.cade.over).toBe(true);
    expect(tb.pad).toEqual(emptyPlan());
    expect(tb.cade.score[0] + tb.cade.score[1]).toBeGreaterThan(0);
  });
});
