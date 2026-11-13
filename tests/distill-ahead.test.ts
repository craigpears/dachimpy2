/* A bot's plan seen through, 13 Nov (src/distill-ahead.ts; the positions page, distilling-positions.html). The user:
   "for each one as well, show like a short plan of next steps ... this P1, for example, ... it only shows one move, so
   then it's kind of just wanting to make sure it actually follows through rather than just making a step towards it."

   Each position the user hasn't skipped: the bot's next few moves, played forward, reach the aim its first move sets
   out on, every move up to then working on it. A position where they don't is listed in OPEN: its test is expected to
   fail (it.fails), and says so once the bots see it through; then take it out. */
import { describe, expect, it } from 'vitest';
import { AHEAD, ahead, headline } from '../src/distill-ahead';
import { POSITIONS, SKIPPED, VERDICTS, boardOf, botAt, planOf } from '../src/distill-positions';
import { levelNamed } from '../src/distill-bots';
import { parseBoard } from '../src/distilling';

/** Positions whose plan doesn't see its aim through yet, and why (13 Nov). */
const OPEN: Readonly<Record<string, string>> = {
  // Its first move sets column 8's white in row 2 moving; move 2 opens the way to it; move 3 turns to column 8's
  // bottom white instead (the board read now ranks it the more at risk); move 4 comes back and frees it.
  P1: 'move 3 frees column 8\'s bottom white first, then move 4 frees the white in row 2',
};

describe('the plan: the bot\'s next moves, played forward', () => {
  it('its first move is the bot\'s move there, and the plan kept on the page is the plan now', () => {
    for (const p of POSITIONS) {
      const plan = planOf(p), a = botAt(p);
      if (a.kind === 'move') expect(plan.moves[0].drags, p.id).toEqual(a.drags);
      expect(p.plan, `${p.id}: run tools/distill-positions.mjs`).toEqual(plan);
      expect(plan.moves.length).toBeLessThanOrEqual(AHEAD.MOVES);
    }
  }, 90000);   // every position's plan played again: 30 positions since the batch of 13 Nov, 24 s in a full run
  it('each move of it played on the board the last one left, each drag named with its trick and goal', () => {
    for (const p of POSITIONS) {
      const plan = planOf(p);
      plan.moves.forEach((m) => { expect(m.steps.length, p.id).toBe(m.drags.length); for (const s of m.steps) expect(s.goal, p.id).not.toBeNull(); });
    }
  });
  it('its aim is its first move\'s goal: a white the move only opens the way to is the white freed', () => {
    const p1 = POSITIONS.find((p) => p.id === 'P1')!, a = botAt(p1);
    expect(headline(a.steps!)!.kind).toBe('open');
    expect(planOf(p1).aim).toBe('free column 8\'s white in row 2');
  });
  it('a plan stops where the furnace would take a column', () => {
    const p = POSITIONS.find((q) => q.id === 'P9')!;
    const a = ahead({ cols: parseBoard(p.cols), stage: p.stage, burns: p.burns, chain: p.chain, timeLeft: 500 }, levelNamed(p.level));
    expect(a.moves.length).toBe(1);
    expect(a.ends).toMatch(/furnace/);
  });
});

describe('"make sure it actually follows through rather than just making a step towards it" (13 Nov)', () => {
  for (const p of POSITIONS) {
    if (SKIPPED[p.id] && !VERDICTS[p.id]?.length) { it.skip(`${p.id}: skipped by the user`, () => {}); continue; }
    // A bot that waits there (the batch of 13 Nov has three: waiting with something stuck, or a white in the furnace's
    // column) has no plan to see through: its plan says so, and whether waiting's right is the user's to judge.
    if (botAt(p).kind === 'wait') {
      it(`${p.id}: the bot waits there, and its plan says so`, () => {
        const plan = planOf(p);
        expect(plan.moves, p.id).toEqual([]);
        expect(plan.ends, p.id).toBe('it waits');
      });
      continue;
    }
    const run = () => {
      const plan = planOf(p);
      expect(boardOf(p)).toBeTruthy();
      expect(plan.aim, p.id).not.toBeNull();
      expect(plan.reached, `${p.id}: aim "${plan.aim}" not reached in ${plan.moves.length} moves`).not.toBeNull();
      expect(plan.through, `${p.id}: aim "${plan.aim}" reached by move ${plan.reached}, but not every move before it works on it`).toBe(true);
    };
    if (OPEN[p.id]) it.fails(`${p.id}: its plan sees its aim through (open: ${OPEN[p.id]}; once this fails, it does, so take it out of OPEN)`, run);
    else it(`${p.id}: its plan sees its aim through`, run);
  }
});
