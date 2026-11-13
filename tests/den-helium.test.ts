/* Helium's island, their lesson at the still and "Help, Helium" (src/den-helium.ts), 12 Nov: their own little
   island by the smugglers' rocks, a short lesson on a real board (the swap rule, whites left and junk
   right, a column burned, and their mishap), then your go with them to ask. The user: "helium should kind of
   detect what stage you're at and show you what technique ... It's context aware." */
import { describe, expect, it } from 'vitest';
import {
  HELIUM, HELIUM_ARRIVE, HELIUM_CAST, HELIUM_MOOR, HELIUM_STANDS, LESSON_SEED, Visit, askHelium, bangs, heliumAt, heliumShore, helpFor,
  inHeliumEarshot, lessonGame, lessonPlan, lessonSecs, mishapLine, onHeliumLanding, opening,
  Cellar, OPENING_BANG, RUM, lineSpot, pileSpot, praiseFor, worksFor, STEPS, whitesOnFireSide, beatSecs, PACE_LESSON,
} from '../src/den-helium';
import { AT_HELIUMS } from '../src/lines/you';
import { LAY, SAIL, Sea } from '../src/den-sail';
import { onTzzLanding } from '../src/den-tzz';
import { smugglersAt } from '../src/den-smugglers';
import { BLACK, BURNT, COLS, Distilling, WHITE, goesUp, neighbourOn, canSwapOn, parseBoard } from '../src/distilling';
import { isJunk } from '../src/distill-routines';
import type { Advice } from '../src/distill-bots';
import { AFTER, GREET, HELP, HELP_ELSE, LESSON, MISHAP, OPENING, STEP_ONE } from '../src/lines/helium';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const H = LAY.HELIUM;
const SQUARES = Array.from({ length: SAIL.COLS * SAIL.ROWS }, (_, i) => [i % SAIL.COLS, Math.floor(i / SAIL.COLS)] as [number, number]);
const RING = SQUARES.filter(([c, r]) => onHeliumLanding(c, r));

describe('their island: a little place of its own, by the smugglers\' rocks', () => {
  it('is land on every sea, and the water round it always open', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of H.LAND) { expect(s.open(c, r)).toBe(false); expect(heliumAt(c, r)).toBe(true); }
      for (const [c, r] of RING) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
    }
  }, 30000);
  it('is out past the checkpoint, beside the smugglers\' rocks but not on their hidden water, and no one else\'s', () => {
    for (const [c, r] of H.LAND) {
      expect(r).toBeGreaterThan(LAY.CHECKPOINT.ROW);
      expect(r).toBeLessThan(SAIL.CHARTED.ROWS);
      expect(smugglersAt(c, r)).toBe(false);
    }
    for (const [c, r] of RING) { expect(smugglersAt(c, r)).toBe(false); expect(onTzzLanding(c, r)).toBe(false); }
    // (near the smugglers' rocks: within a few squares of them)
    const near = Math.min(...H.LAND.flatMap(([c, r]) => LAY.SMUGGLERS.ROCKS.map(([x, y]) => Math.hypot(x - c, y - r))));
    expect(near).toBeLessThanOrEqual(4);
    expect(near).toBeGreaterThan(1.5);
  });
  it('is reached from the open sea: its ring is water the den can sail to, not hidden', () => {
    const s = new Sea(1);
    for (const [c, r] of RING) expect(s.hidden.has(`${c},${r}`)).toBe(false);
  });
  it('puts her alongside on its ring, and its starting point beside it', () => {
    expect(onHeliumLanding(HELIUM_MOOR.c, HELIUM_MOOR.r)).toBe(true);
    expect(onHeliumLanding(HELIUM_ARRIVE.c, HELIUM_ARRIVE.r)).toBe(true);
    expect(inHeliumEarshot(HELIUM_ARRIVE.c, HELIUM_ARRIVE.r)).toBe(true);
    expect(heliumShore().length).toBeGreaterThan(3);
  });
  it('places them, their board and their still on their island\'s sand', () => {
    const onIt = ([c, r]: readonly number[]) => H.LAND.some(([x, y]) => Math.abs(x - c) <= 0.75 && Math.abs(y - r) <= 0.75);
    expect(onIt([HELIUM_STANDS.c, HELIUM_STANDS.r])).toBe(true);
    expect(onIt(HELIUM_CAST.board.at)).toBe(true);
    for (const p of HELIUM_CAST.props) expect(onIt(p.at)).toBe(true);
    expect(HELIUM_CAST.them.look).toBe('Helium');
    expect(HELIUM.NAME).toMatch(/Helium/);
  });
});

describe('their look: from their portrait, in the wardrobe', () => {
  const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8').replace(/\r\n/g, '\n');
  it('is one of the real pirates, a plum monkey on their shoulder', () => {
    const m = /\n {2}Helium: \{([^}]*)\}/.exec(LOOK_JS);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/hat: 'feline'/);
    expect(m![1]).toMatch(/top: 'raiment'/);
    expect(m![1]).toMatch(/fam: 'monkey', famCol: 'plum'/);
    expect(LOOK_JS).toMatch(/export const FUR = \{[^}]*plum:/);
  });
});

describe('their lesson: a real board, by the real rules', () => {
  const g = lessonGame(), plan = lessonPlan();
  it('is the same board every time, its furnace stopped', () => {
    expect(lessonGame().cols).toEqual(g.cols);
    expect(g.timeLeft()).toBe(Infinity);
    expect(LESSON_SEED).toBeGreaterThan(0);
  });
  it('goes greeting, the swap rule, the furnace, their mishap, step one and why, your go', () => {
    expect(plan.map((b) => b.name)).toEqual(['greet', 'rule', 'ruleAfter', 'furnace', 'mishapSetup', 'mishap', 'step', 'clear', 'why', 'yours']);
    expect(plan[0].says).toBe(GREET);
    expect(plan.find((b) => b.name === 'mishap')!.says).toBe('Oops. That happens sometimes. Don\'t worry about it.');
    for (const b of plan) { expect(b.says.length).toBeGreaterThan(0); expect(b.note.length).toBeGreaterThan(0); }
  });
  it('plays every move legally on the board, and shows what it says', () => {
    const game = lessonGame();
    const settle = () => game.settle(1000);
    for (const b of plan) {
      const drags = b.act.kind === 'drag' ? [b.act] : b.act.kind === 'drags' ? b.act.drags : [];
      for (const { x, y, ways } of drags) {
        if (b.name === 'rule') expect(game.at(x, y)).toBe(WHITE);
        // (the swap rule: the white rises past a black)
        if (b.name === 'rule') { const n = neighbourOn(game.cols, x, y, ways[0])!; expect(game.at(n[0], n[1])).toBe(BLACK); expect(n[1] <= y).toBe(true); }
        const r = game.dragWays(x, y, ways);
        expect(r.swaps).toBe(ways.length);
        if (b.name === 'rule') expect(r.at[0]).toBe(x - ways.length);   // (a column left each swap)
        settle();
      }
      if (b.act.kind === 'burn') {
        const before = game.cols[COLS - 1].slice();
        if (b.name === 'furnace') expect(before.every(isJunk)).toBe(true);
        const ev = game.burnNow();
        const col = ev.find((e) => e.kind === 'column');
        expect(col && col.kind === 'column' && !col.column.up).toBe(true);
        if (col?.kind === 'column') expect(bangs(col.column)).toBe(!!b.mishap);
        if (b.mishap) expect(before.filter((p) => p === WHITE).length).toBe(1);   // ("one white in it")
        settle();
      }
    }
    expect(game.whitesBurned).toBe(1);
  });
  it('has no mishap on a board whose next column would go up (worked out, not assumed)', () => {
    expect(lessonPlan(new Distilling(() => 0.1, { timer: false })).some((b) => b.mishap)).toBe(false);   // (every piece white)
  });
});

describe('Helium\'s lesson as step one, and only step one (the user, 13 Nov: "let\'s just really take it one step at a time")', () => {
  const plan = lessonPlan();
  it('"step one is getting a few columns on the right-hand side that are about to burn completely free of white pieces" (13 Nov)', () => {
    // (played out as the den plays it, the three columns next to the fire end with no white in them)
    const game = lessonGame();
    for (const b of plan) {
      for (const d of b.act.kind === 'drag' ? [b.act] : b.act.kind === 'drags' ? b.act.drags : []) { game.dragWays(d.x, d.y, d.ways); game.settle(1000); }
      if (b.act.kind === 'burn') { game.burnNow(); game.settle(1000); }
    }
    const before = lessonGame();
    expect(whitesOnFireSide(game.cols)).toBe(0);
    const clear = plan.find((b) => b.name === 'clear')!;
    expect(clear.act.kind === 'drags' && clear.act.drags.length).toBeGreaterThan(0);
    expect(whitesOnFireSide(before.cols)).toBeGreaterThan(0);
    expect(STEPS[0].cols).toBe(3);
  });
  it('is the only step there is for now, shown as step 1 from the mishap on', () => {
    expect(STEPS.map((s) => s.n)).toEqual([1]);
    const from = plan.findIndex((b) => b.name === 'step');
    expect(from).toBeGreaterThan(plan.findIndex((b) => b.name === 'mishap'));   // (the mishap: what skipping it does)
    for (const b of plan.slice(from)) expect(b.step).toBe(1);
    for (const b of plan.slice(0, from)) expect(b.step).toBeUndefined();
  });
  it('says why in their voice: "otherwise ... the furnace blows up and ... I\'ve already got no eyebrows" (13 Nov)', () => {
    const why = plan.find((b) => b.name === 'why')!;
    expect(why.says).toBe(STEP_ONE.why);
    expect(STEP_ONE.why).toMatch(/bang/);
    expect(STEP_ONE.why).toMatch(/eyebrows/);
    expect(plan.at(-1)!.says).toMatch(/three/);   // (your go: step one the goal)
  });
  it('knows when you\'ve done it yourself: no white or burnt white in the three columns next to the fire', () => {
    const cols = parseBoard(['wwwwwwwww', 'KKKKKKKK', 'wwwwwwwww', 'KKKKKKKK', 'wwwwwwwww', 'KKKKKKKK', 'wwwwwwwww', 'KKKKbKKK', 'KKKKKKKKK', 'bbbbbbbb']);
    expect(whitesOnFireSide(cols)).toBe(0);
    cols[COLS - 1][3] = WHITE;
    expect(whitesOnFireSide(cols)).toBe(1);
    cols[COLS - 3][0] = BURNT;
    expect(whitesOnFireSide(cols)).toBe(2);
    cols[COLS - 4][0] = WHITE;   // (the fourth from the right is clear of the fire's side)
    expect(whitesOnFireSide(cols)).toBe(2);
  });
});

describe('Helium\'s lesson over in half a second (the user, 13 Nov: "it\'s supposed to be a little cutscene, and it\'s like half a second")', () => {
  const beats = [...opening(), ...lessonPlan()];
  it('keeps every line up long enough to read: a few seconds at the least, about 2.5 words a second', () => {
    for (const b of beats) {
      const words = b.says.split(/\s+/).filter(Boolean).length;
      expect(lessonSecs(b.says)).toBeGreaterThanOrEqual(3);
      expect(lessonSecs(b.says)).toBeGreaterThanOrEqual(words / 2.5);
    }
  });
  it('gives the opening\'s bang its moment before anyone speaks', () => {
    expect(lessonSecs('')).toBeGreaterThanOrEqual(3);
    expect(beatSecs(beats[0])).toBeGreaterThanOrEqual(3);
  });
  it('plays their drags swap by swap slowly enough to follow, a breath between beats', () => {
    expect(PACE_LESSON.SWAP).toBeGreaterThanOrEqual(0.4);
    expect(PACE_LESSON.GAP).toBeGreaterThan(0);
    for (const b of beats) expect(beatSecs(b)).toBeGreaterThan(lessonSecs(b.says));
    const clear = beats.find((b) => b.name === 'clear')!;
    if (clear.act.kind === 'drags') expect(beatSecs(clear)).toBeGreaterThanOrEqual(clear.act.drags.reduce((s, d) => s + d.ways.length, 0) * PACE_LESSON.SWAP);
  });
  it('runs as a little cutscene, a minute or two in all, not seconds', () => {
    const total = beats.reduce((s, b) => s + beatSecs(b), 0);
    expect(total).toBeGreaterThan(60);
    expect(total).toBeLessThan(180);
  });
});

describe('their opening, the first time: the still goes bang, and they shrug it off (the user, 12 Nov)', () => {
  const o = opening();
  it('starts with the bang, then their everyday mishap and their offer', () => {
    expect(o[0].act.kind).toBe('bang');
    expect(o[0].says).toBe('');
    expect(o.slice(1, 3).map((b) => b.says)).toEqual([OPENING.mishap, OPENING.offer]);
  });
  it('has you ask if it\'s safe and them say of course it is; then the eyebrows, and none of us have any', () => {
    expect(o.map((b) => [b.who ?? 'them', b.says])).toEqual([
      ['them', ''], ['them', OPENING.mishap], ['them', OPENING.offer],
      ['you', AT_HELIUMS.safe], ['them', OPENING.safe], ['you', AT_HELIUMS.brows], ['them', OPENING.brows],
    ]);
    expect(OPENING.safe).toMatch(/Of course it's safe/);
    expect(OPENING.brows).toMatch(/developers/);
  });
  it('does nothing on the board: the lesson after it does', () => {
    for (const b of o) expect(b.act.kind === 'bang' || b.act.kind === 'none').toBe(true);
    expect(lessonSecs('')).toBeGreaterThan(1);
  });
});

describe('the mishap: a white burned, and the still goes bang', () => {
  it('bangs only when a column burns with a white or a burnt white in it', () => {
    expect(bangs({ up: false, whites: 1, burnt: 0 })).toBe(true);
    expect(bangs({ up: false, whites: 0, burnt: 1 })).toBe(true);
    expect(bangs({ up: false, whites: 0, burnt: 0 })).toBe(false);
    expect(bangs({ up: true, whites: 4, burnt: 0 })).toBe(false);
  });
  it('says their own line first, then the rest round and round', () => {
    expect(mishapLine(0)).toBe(MISHAP[0]);
    const later = Array.from({ length: MISHAP.length * 2 }, (_, i) => mishapLine(i + 1));
    expect(later).not.toContain(MISHAP[0]);
    expect(new Set(later).size).toBe(MISHAP.length - 1);
  });
});

describe('their distillery answering the board (the user, 13 Nov: a white burned blows it up, whites sent up fill barrels)', () => {
  const col = (o: Partial<{ up: boolean; whites: number; burnt: number; chain: number }>) => ({ up: true, whites: 0, burnt: 0, chain: 0, ...o });
  it('"If white goes down, it should cause like that explosion animation as well" (13 Nov): bigger the more whites', () => {
    expect(worksFor(col({ up: false, whites: 1 }))).toEqual({ kind: 'bang', size: 1 });
    expect(worksFor(col({ up: false, burnt: 1 }))).toEqual({ kind: 'bang', size: 1 });
    expect(worksFor(col({ up: false, whites: 3 }))).toEqual({ kind: 'bang', size: 1.5 });
    expect(worksFor(col({ up: false, whites: 9 }))).toEqual({ kind: 'bang', size: 2 });
    expect(OPENING_BANG).toBeGreaterThan(1);
    // (every column that bangs blows the distillery up, and nothing else does)
    for (const up of [true, false]) for (const whites of [0, 1, 4]) for (const burnt of [0, 1]) {
      expect(worksFor(col({ up, whites, burnt })).kind === 'bang').toBe(bangs({ up, whites, burnt }));
    }
  });
  it('an all-junk column burned does nothing: the furnace just takes it', () => {
    expect(worksFor(col({ up: false }))).toEqual({ kind: 'none' });
  });
  it('"sending up the white ... distilling out some rum and filling some barrels" (13 Nov): a measure a white, a Crystal Clear twice', () => {
    expect(worksFor(col({ whites: 5 }))).toEqual({ kind: 'rum', measures: 5, cheer: false });
    expect(worksFor(col({ whites: 9, chain: 1 }))).toEqual({ kind: 'rum', measures: 9 * RUM.CLEAR, cheer: false });
    expect(worksFor(col({ whites: 9, chain: 2 }))).toMatchObject({ kind: 'rum', cheer: true });
    expect(worksFor(col({ whites: 0 }))).toEqual({ kind: 'none' });
  });
  it('fills a cask at a time, rolls it onto the pile, and a fresh one under the spout', () => {
    const c = new Cellar();
    expect(c.pour(10)).toEqual([{ from: 0, to: 10, full: false, onPile: false }]);
    expect(c.pour(RUM.CASK)).toEqual([{ from: 10, to: RUM.CASK, full: true, onPile: true }, { from: 0, to: 10, full: false, onPile: false }]);
    expect(c.filled).toBe(1);
    expect(c.piled).toBe(1);
    // (a long run of Crystal Clears: the pile fills, and casks after it are rolled off behind)
    const runs = c.pour(RUM.CASK * (RUM.PILE + 2));
    expect(runs.filter((r) => r.full).length).toBe(RUM.PILE + 2);
    expect(runs.filter((r) => r.onPile).length).toBe(RUM.PILE - 1);
    expect(c.piled).toBe(RUM.PILE);
    for (const r of runs) { expect(r.to).toBeGreaterThan(r.from); expect(r.to).toBeLessThanOrEqual(RUM.CASK); }
  });
  it('stacks the pile as a pyramid, each cask on two below it', () => {
    const spots = Array.from({ length: RUM.PILE }, (_, i) => pileSpot(i));
    expect(new Set(spots.map((s) => s.join())).size).toBe(RUM.PILE);
    expect(spots.filter(([, up]) => up === 0).length).toBe(3);
    for (const [x, up] of spots) if (up > 0) expect(spots.filter(([x2, up2]) => up2 < up && up2 > up - 1 && Math.abs(x2 - x) === 0.5).length).toBe(2);
  });
  it('praises a Crystal Clear chain now and then, never a lone one', () => {
    expect(praiseFor(1, 0)).toBeNull();
    expect(praiseFor(2, 0)).toBeTruthy();
    expect(praiseFor(5, 0.9)).toBeNull();
  });
  it('is placed on their island\'s sand, behind them, and the palm too', () => {
    const onIt = ([c, r]: readonly number[]) => H.LAND.some(([x, y]) => Math.abs(x - c) <= 0.75 && Math.abs(y - r) <= 0.75);
    expect(onIt(HELIUM_CAST.distillery.at)).toBe(true);
    expect(onIt(HELIUM_CAST.palm)).toBe(true);
    expect(HELIUM_CAST.distillery.at[0]).toBeGreaterThan(HELIUM_STANDS.c);   // (further from the board's camera than they are)
  });
});

describe('Help, Helium\'s bubble too far to the right to be read (the user, 13 Nov)', () => {
  const bubble = { w: 320, h: 80 };
  const inside = (p: { x: number; y: number }, s: { w: number; h: number }) => {
    expect(p.x - bubble.w / 2).toBeGreaterThanOrEqual(0);
    expect(p.x + bubble.w / 2).toBeLessThanOrEqual(s.w);
    expect(p.y - bubble.h).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(s.h);
  };
  const clear = (p: { x: number; y: number }, b: { l: number; t: number; r: number; b: number }) =>
    expect(p.x + bubble.w / 2 <= b.l || p.x - bubble.w / 2 >= b.r || p.y <= b.t || p.y - bubble.h >= b.b).toBe(true);
  it('on a wide screen, their head off its right edge: kept on it, beside the board', () => {
    const s = { w: 1600, h: 900 }, board = { l: 560, t: 150, r: 1040, b: 790 };
    const p = lineSpot({ x: 1680, y: 300 }, bubble, board, s);
    inside(p, s); clear(p, board);
    expect(p.x).toBeGreaterThan(board.r);
  });
  it('on a phone (375 by 812), the board the screen\'s width: above or below it, never over it', () => {
    const s = { w: 375, h: 812 }, b = { l: 12, t: 250, r: 363, b: 690 };
    const p = lineSpot({ x: 420, y: 330 }, { w: 340, h: 90 }, b, s);
    expect(p.x - 170).toBeGreaterThanOrEqual(0);
    expect(p.x + 170).toBeLessThanOrEqual(375);
    expect(p.y <= b.t || p.y - 90 >= b.b).toBe(true);
  });
  it('left where their head is when that\'s already clear of the board and on the screen', () => {
    const p = lineSpot({ x: 1300, y: 400 }, bubble, { l: 300, t: 150, r: 900, b: 800 }, { w: 1600, h: 900 });
    expect(p).toEqual({ x: 1300, y: 400 });
  });
});

describe('"Help, Helium": your board read, the technique named, and played', () => {
  const advice = (o: Partial<Advice>): Advice => ({ stage: 'junk', kind: 'move', routine: 'rescue', label: 'Save the whites', reason: 'a white by the fire', drags: [{ x: 8, y: 2, ways: [1] }], value: 1, sweep: false, ...o });
  it('names the technique in their line, with the reason in the bar, and plays the drags', () => {
    const h = helpFor(advice({}));
    expect(h.says).toBe(HELP.rescue);
    expect(h.note).toBe('Save the whites: a white by the fire');
    expect(h.plays).toBe('drags');
  });
  it('has a line for every technique the planner knows', async () => {
    const { ROUTINES } = await import('../src/distill-routines');
    for (const name of Object.keys(ROUTINES)) expect(HELP[name as keyof typeof HELP], name).toBeTruthy();
  });
  it('burns when it says burn, waits and never dismisses your session for you', () => {
    expect(helpFor(advice({ kind: 'burn', routine: null, drags: [] }))).toMatchObject({ says: HELP_ELSE.burn, plays: 'burn' });
    expect(helpFor(advice({ kind: 'wait', routine: null, drags: [] }))).toMatchObject({ says: HELP_ELSE.wait, plays: null });
    expect(helpFor(advice({ kind: 'dismiss', routine: null, drags: [] }))).toMatchObject({ says: HELP_ELSE.dismiss, plays: null });
    expect(helpFor(advice({ drags: [] }))).toMatchObject({ says: HELP_ELSE.stuck, plays: null });
  });
  it('reads a real board mid-game and gives moves that play on it', () => {
    const game = lessonGame();
    const h = askHelium(game);
    expect(h.advice).not.toBeNull();
    if (h.plays === 'drags') {
      for (const d of h.advice!.drags) { const r = game.dragWays(d.x, d.y, d.ways); expect(r.swaps).toBe(d.ways.length); game.settle(1000); }
    }
    expect(h.says.length).toBeGreaterThan(0);
  });
  it('waits while the board\'s sliding', () => {
    const game = lessonGame();
    game.burnNow();
    expect(askHelium(game)).toMatchObject({ advice: null, says: HELP_ELSE.busy });
  });
  it('plays a white out of a burning column when that\'s what the board needs', () => {
    // (a board whose furnace column is all junk but one white, the column next to it all whites)
    const cols = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'KKKKKKKKK', 'KKKKwKKK']);
    const game = new Distilling(() => 0.5, { timer: false }).lay(cols);
    const h = askHelium(game);
    expect(h.advice!.kind === 'move' || h.advice!.kind === 'burn').toBe(true);
    if (h.plays === 'drags') for (const d of h.advice!.drags) expect(canSwapOn(game.cols, d.x, d.y, ...neighbourOn(game.cols, d.x, d.y, d.ways[0])!)).toBe(true);
  });
});

describe('their chatter', () => {
  it('knows the others: Mischievious\'s weddings, Kikkit at their stash', () => {
    expect(AFTER.some((l) => /Mischievious/.test(l) && /wedding/.test(l))).toBe(true);
    expect(AFTER.some((l) => /Kikkit/.test(l) && /stash/.test(l))).toBe(true);
    expect(LESSON.yours.says).toMatch(/H/);
  });
  it('a lesson and a visit: once on arrival, then Space to the still', () => {
    const v = new Visit();
    expect(v.again(true, true)).toBe(false);
    expect(v.arrive(true, false)).toBe(false);
    expect(v.arrive(true, true)).toBe(true);
    expect(v.arrive(true, true)).toBe(false);
    expect(v.again(true, true)).toBe(true);
    expect(v.again(false, true)).toBe(false);
  });
});
