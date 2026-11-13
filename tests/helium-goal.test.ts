/* Helium's still as goals, 13 Nov (src/den-helium.ts: goalFor, Batch, planFor, PlanLines, flaskLevel): a batch's
   goal (at least your best plus one), their plan for it on your board step by step, the batch done once it's met
   and the chain ends, and the flask filling a step a Crystal Clear. */
import { describe, expect, it } from 'vitest';
import { Batch, FLASK_STEPS, PLAN_STEPS, PlanLines, biggerGoal, crystalClears, fillIn, flaskLevel, goalFor, goalLines, planFor, planTarget } from '../src/den-helium';
import type { PlanStep } from '../src/den-helium';
import { FLASK, CARRY_ON, COLS, Distilling, SHORT, SPICE, TALL, WHITE } from '../src/distilling';
import { advise } from '../src/distill-bots';
import { BEST, GOAL, PLAN, PRAISE } from '../src/lines/helium';
import { seeded } from '../src/mirror-row';

const words = (s: string) => s.trim().split(/\s+/).length;

describe('Helium\'s lesson as goals, 13 Nov ("you\'re aiming for at least one, but do a few more if you can")', () => {
  it('the goal is at least your best plus one, a Crystal Clear 1 to start', () => {
    expect(goalFor(0)).toBe(1);
    expect(goalFor(3)).toBe(4);
    // ("Might be a bit tedious if you have to go through every single CC level one by one"): a bigger goal is past
    // your best, not just one more than the last goal
    expect(biggerGoal(1, 3)).toBe(4);
    expect(biggerGoal(2, 1)).toBe(3);
  });
  it('they say it as you sit down: the first goal with none yet, else your best to beat and the goal', () => {
    expect(goalLines(0)).toEqual([BEST.none]);
    expect(goalLines(2)).toEqual(["Your best's a Crystal Clear 2. Let's beat it.", 'Goal: a Crystal Clear 3. At least. More if you can.']);
  });
  it('"if we\'re aiming for crystal clear one, the whole thing should obviously just finish ... once you\'ve hit that goal" (13 Nov): met, then done once the chain ends', () => {
    const b = new Batch(1);
    expect(b.column({ chain: 0 }, false)).toBeNull();   // (junk burned: nothing yet)
    expect(b.column({ chain: 1 }, false)).toBe('met');
    expect(b.column({ chain: 2 }, false)).toBeNull();   // ("more if you can": the chain goes on)
    expect(b.column({ chain: 0 }, false)).toBe('done');
    expect(b.best).toBe(2);
    expect(b.column({ chain: 1 }, false)).toBeNull();   // (done is done)
    expect(b.doneLines(false)[0]).toBe('That\'s a batch. Crystal Clear 2. Not bad at all.');
  });
  it('a chain broken short of the goal isn\'t the end: it goes on till it\'s met', () => {
    const b = new Batch(2);
    expect(b.column({ chain: 1 }, false)).toBeNull();
    expect(b.column({ chain: 0 }, false)).toBeNull();
    expect(b.column({ chain: 1 }, false)).toBeNull();
    expect(b.column({ chain: 2 }, false)).toBe('met');
    expect(b.column({ chain: 3 }, true)).toBe('done');   // (the flask full)
    expect(b.doneLines(false, true)[0]).toBe(PRAISE.finished);
  });
  it('the flask full before the goal: done, not met, and they say so', () => {
    const b = new Batch(3);
    b.column({ chain: 1 }, false);
    expect(b.column({ chain: 0 }, true)).toBe('done');
    expect(b.met).toBe(false);
    expect(b.doneLines(true)).toEqual([fillIn(GOAL.short, 3)]);
  });
  it('plans one more than the chain once the goal\'s reached ("more if you can")', () => {
    expect(planTarget(1, 0)).toBe(1);
    expect(planTarget(1, 1)).toBe(2);
    expect(planTarget(3, 1)).toBe(3);
  });
});

describe('the flask fills a step each Crystal Clear, 13 Nov ("the jar thing at the top should fill up each time you do a crystal clear ... one nth")', () => {
  it('n is the most Crystal Clears a flask holds: twelve columns of whites fill it, eleven don\'t', () => {
    expect(FLASK_STEPS).toBe(CARRY_ON);
    expect(6 * TALL + 5 * SHORT).toBeLessThan(FLASK);
    expect(6 * TALL + 6 * SHORT).toBeGreaterThanOrEqual(FLASK);
  });
  it('a twelfth a Crystal Clear sent up; junk burned and columns up that aren\'t clear add nothing', () => {
    const cols = [{ up: false, chain: 0 }, { up: true, chain: 1 }, { up: true, chain: 0 }, { up: true, chain: 2 }];
    expect(crystalClears(cols)).toBe(2);
    expect(flaskLevel(crystalClears(cols))).toBeCloseTo(2 / 12);
    expect(flaskLevel(12)).toBe(1);
    expect(flaskLevel(15)).toBe(1);   // (the carry-on past CC^12: full)
  });
});

/** Plays their plan on a seeded board with the fire held, as you'd follow it: the planner's move, or X when it
    would wait; each plan checked as it goes. */
function follow(seed: number, goal: number, most = 80) {
  const g = new Distilling(seeded(seed), { timer: false }), batch = new Batch(goal), lines = new PlanLines(), steps: PlanStep[] = [], said: string[] = [];
  for (let i = 0; i < most && !batch.done; i++) {
    const p = planFor(g, goal);
    steps.push(p.step);
    const line = lines.next(p, g.chain);
    if (line) said.push(line);
    // (what's shown is a plain move for the step, src/distill-teach.ts, tests/distill-teach.test.ts; the planner's own
    // advice, playing to the goal, behind it)
    const a = advise({ cols: g.cols, chain: g.chain, timeLeft: Infinity }, { target: planTarget(goal, g.chain) });
    expect(p.advice.kind).toBe(a.kind);
    expect(p.drags).toEqual(p.teach ? p.teach.drags : []);
    expect(p.target).toBe(planTarget(goal, g.chain));
    expect(p.note).toMatch(new RegExp(`^Step ${PLAN_STEPS.indexOf(p.step) + 1} of 4, `));
    if (p.step === 'clear') for (const [x, y] of p.ring) { expect(p.burn).toContain(x); expect(g.cols[x][y]).toBe(WHITE); }
    if (p.step === 'build') {
      expect(p.column).not.toBeNull();
      expect(p.burn).not.toContain(p.column);
      for (const [x, y] of p.ring) { expect(x).toBe(p.column); expect([WHITE, SPICE]).not.toContain(g.cols[x][y]); }
    }
    if (a.kind === 'move' && a.drags.length) {
      for (const d of a.drags) { expect(g.dragWays(d.x, d.y, d.ways).swaps).toBe(d.ways.length); g.settle(1000); }
    } else for (const e of g.burnNow()) if (e.kind === 'column') batch.column(e.column, e.finished);
    g.settle(5000);
  }
  return { g, batch, steps, said };
}

describe('Helium\'s plan for the goal on your board, 13 Nov ("try and get those three columns of blacks out of the way ... highlighting some column ... and arrows of where they think the white pieces should go")', () => {
  const run = follow(269, 1);
  it('followed on a real board, it gets to the goal and the batch ends: a Crystal Clear sent up', () => {
    expect(run.batch.met).toBe(true);
    expect(run.batch.done).toBe(true);
    expect(crystalClears(run.g.columns)).toBeGreaterThanOrEqual(1);
  });
  it('the junk columns first, the gold column built, then sent up', () => {
    const first = (s: PlanStep) => run.steps.indexOf(s);
    expect(first('clear')).toBe(0);
    expect(first('send')).toBeGreaterThan(first('clear'));
    expect(run.said[0]).toBe(PLAN.clear.says);
    expect(run.said).toContain(PLAN.send.says);
  });
  it('the plan\'s junk columns are the right-hand ones, the gold column left of them', () => {
    const p = planFor(new Distilling(seeded(269), { timer: false }), 1);
    expect(p.burn.length).toBeGreaterThan(0);
    expect(p.burn.at(-1)).toBe(COLS - 1);
    expect(p.column).not.toBeNull();
    expect(p.column!).toBeLessThan(p.burn[0]);
    expect(p.ring.length).toBe(p.left);
  });
  it('banks whites first when the board hasn\'t enough for a bigger goal', () => {
    const p = planFor(new Distilling(seeded(1), { timer: false }), 5);
    expect(p.advice.stage).toBe('junk');
    expect(['clear', 'bank']).toContain(p.step);
    expect(p.column).toBeNull();   // (the Crystal Clear's column not known yet)
  });
});

describe('their plan\'s lines, said as each step starts', () => {
  it('in full the first time, "again" for a later column of the chain, nothing back and forth', () => {
    const L = new PlanLines();
    expect(L.next({ step: 'clear' }, 0)).toBe(PLAN.clear.says);
    expect(L.next({ step: 'clear' }, 0)).toBeNull();
    expect(L.next({ step: 'build' }, 0)).toBe(PLAN.build.says);
    expect(L.next({ step: 'clear' }, 0)).toBeNull();   // (back and forth on one column: said already)
    expect(L.next({ step: 'build' }, 0)).toBeNull();
    expect(L.next({ step: 'send' }, 0)).toBe(PLAN.send.says);
    expect(L.next({ step: 'build' }, 1)).toBe(PLAN.build.again);   // (the next column of the chain)
  });
  it('short enough for a phone bubble, and Helium "they"', () => {
    const lines = [...Object.values(GOAL), ...Object.values(PLAN).flatMap((s) => [s.says, s.again])];
    for (const l of lines) {
      expect(l.length, l).toBeLessThanOrEqual(110);
      expect(words(l), l).toBeLessThanOrEqual(18);
      expect(l, l).not.toMatch(/\b(he|she|him|her|his)\b/i);
    }
    for (const s of Object.values(PLAN)) { expect(s.says.length, s.says).toBeLessThanOrEqual(90); expect(s.again.length).toBeLessThanOrEqual(90); }
  });
});
