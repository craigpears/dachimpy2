/* Helium's island, their lesson at the still and "Help, Helium" (src/den-helium.ts), 12 Nov: their own little
   island by the smugglers' rocks, a short lesson on a real board (the swap rule, whites left and junk
   right, a column burned, and their mishap), then your go with them to ask. The user: "helium should kind of
   detect what stage you're at and show you what technique ... It's context aware." */
import { describe, expect, it } from 'vitest';
import {
  HELIUM, HELIUM_ARRIVE, HELIUM_CAST, HELIUM_MOOR, HELIUM_STANDS, LESSON_SEED, Visit, askHelium, bangs, heliumAt, heliumShore, helpFor,
  inHeliumEarshot, lessonGame, lessonPlan, lessonSecs, mishapLine, onHeliumLanding, opening,
} from '../src/den-helium';
import { AT_HELIUMS } from '../src/lines/you';
import { LAY, SAIL, Sea } from '../src/den-sail';
import { onTzzLanding } from '../src/den-tzz';
import { smugglersAt } from '../src/den-smugglers';
import { BLACK, COLS, Distilling, WHITE, goesUp, neighbourOn, canSwapOn, parseBoard } from '../src/distilling';
import { isJunk } from '../src/distill-routines';
import type { Advice } from '../src/distill-bots';
import { AFTER, GREET, HELP, HELP_ELSE, LESSON, MISHAP, OPENING } from '../src/lines/helium';
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
  const g = lessonGame(), plan = lessonPlan(g.cols);
  it('is the same board every time, its furnace stopped', () => {
    expect(lessonGame().cols).toEqual(g.cols);
    expect(g.timeLeft()).toBe(Infinity);
    expect(LESSON_SEED).toBeGreaterThan(0);
  });
  it('goes greeting, the swap rule, whites left, the furnace, their mishap, your go', () => {
    expect(plan.map((b) => b.name)).toEqual(['greet', 'rule', 'ruleAfter', 'left', 'furnace', 'mishapSetup', 'mishap', 'yours']);
    expect(plan[0].says).toBe(GREET);
    expect(plan.find((b) => b.name === 'mishap')!.says).toBe('Oops. That happens sometimes. Don\'t worry about it.');
    for (const b of plan) { expect(b.says.length).toBeGreaterThan(0); expect(b.note.length).toBeGreaterThan(0); }
  });
  it('plays every move legally on the board, and shows what it says', () => {
    const game = lessonGame();
    const settle = () => game.settle(1000);
    for (const b of plan) {
      if (b.act.kind === 'drag') {
        const { x, y, ways } = b.act;
        expect(game.at(x, y)).toBe(WHITE);
        // (the swap rule: the white rises past a black)
        if (b.name === 'rule') { const n = neighbourOn(game.cols, x, y, ways[0])!; expect(game.at(n[0], n[1])).toBe(BLACK); expect(n[1] <= y).toBe(true); }
        const r = game.dragWays(x, y, ways);
        expect(r.swaps).toBe(ways.length);
        expect(r.at[0]).toBe(x - ways.length);   // (whites left: a column left each swap)
        if (b.name === 'left') expect(ways.length).toBeGreaterThanOrEqual(2);
        settle();
      } else if (b.act.kind === 'burn') {
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
  it('leaves the furnace\'s next column as dealt: its moves are clear of it', () => {
    const next = g.cols[COLS - 2];
    expect(next.includes(WHITE) && !goesUp(next)).toBe(true);
    for (const b of plan) if (b.act.kind === 'drag') expect(b.act.x).toBeLessThanOrEqual(COLS - 3);
  });
  it('gives each line long enough to read', () => {
    for (const b of plan) expect(lessonSecs(b.says)).toBeGreaterThan(b.says.split(' ').length * 0.25);
  });
  it('has no mishap on a board whose next column would go up (worked out, not assumed)', () => {
    const board = new Distilling(() => 0.1).cols;   // (every piece the same: white)
    expect(lessonPlan(board).some((b) => b.mishap)).toBe(false);
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
