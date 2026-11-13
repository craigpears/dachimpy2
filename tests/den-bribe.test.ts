/* The sloop race's bribe at the gate (src/den-bribe.ts), 12 Nov: "build the bribe gate ... I just want all
   the ideas in there ... to show how many different ways you have of really getting through the course." */
import { describe, expect, it } from 'vitest';
import { BRIBE, Bribe, Purse, GUARD_SAYS, atGate, atWreck, inEarshot, purseBoard, towPath } from '../src/den-bribe';
import { H, W } from '../src/treasure-haul';
import { LAY, Sea, Helm } from '../src/den-sail';
import { sheltered, FIELD, stretchAt } from '../src/den-racers';
import { seeded } from '../src/mirror-row';
import { CHARACTERS } from '../src/lines/index';
import { CHARACTER } from '../src/lines/gate-guard';

const RC = LAY.RACE, RB = RC.BRIBE;

// Play a board out, a swap at a time (the first swap that makes a line or sets off a gem; else any).
function haulOut(p: Purse, most = 500) {
  const b = p.open();
  for (let n = 0; n < most && !b.over; n++) {
    let pick: [number, number] | null = null;
    for (let r = 0; r < H - 1 && !pick; r++) for (let c = 0; c < W && !pick; c++) {
      const a = b.grid[r][c], d = b.grid[r + 1][c];
      if (!a || !d) continue;
      if (a.s || d.s) { pick = [r, c]; break; }
      b.grid[r][c] = d; b.grid[r + 1][c] = a;
      const lined = b.lines().length > 0;
      b.grid[r][c] = a; b.grid[r + 1][c] = d;
      if (lined) pick = [r, c];
    }
    b.swap(...(pick ?? [n % (H - 1), (n * 3) % W]));
  }
  return b;
}

describe('the gate and the wreck on the course (12 Nov)', () => {
  it('the wreck\'s notch is off leg 1 on the way to the gate (on its left, 13 Nov), where the field comes down onto it, open water, sheltered, one racer\'s at a time; the wreck itself is on the spit', () => {
    const sea = new Sea(9);
    const [c, r] = RB.NOTCH;
    expect(r).toBe(RC.SPITS[0].r0);
    // (13 Nov: beside where the start's hop and its winds bring the field down onto leg 1; and since the gate went
    // into the fort's bay by buoy 1, before the gate, on the way to it: the user, "almost like on the left-hand side")
    expect(c).toBeLessThan(RC.GUNS.gap[0]);
    expect(Math.abs(c - RC.FIELD.HOP.LANDS[0])).toBeLessThanOrEqual(1);
    expect(sea.isRock(c, r)).toBe(false);
    expect(sea.isRock(c, r - 1)).toBe(false);
    expect(sea.isRock(...RB.WRECK)).toBe(true);
    expect(sea.isRock(c - 1, r) && sea.isRock(c + 1, r)).toBe(true);
    expect(sheltered(c, r)).toBe(true);
    expect(FIELD.SPOTS.wreck).toEqual(RB.NOTCH);
    // (never one of the gap's guns' marks, and a column of land between it and the gate's bastion; their aimed
    // shots, once roused, never come into a sheltered notch: src/race-sim.ts, js/den/race.js)
    for (const ms of RC.GUNS.marks) expect(ms.some(([x, y]) => x === c && y === r)).toBe(false);
    for (const [gc] of RC.GUNS.at) expect(Math.abs(gc - c)).toBeGreaterThan(1);
  });
  it('she pays by the gate, in front of its way in (on the fort\'s bay\'s north side since 13 Nov); the guard\'s heard from a few squares off', () => {
    const [gc, gr] = RB.GATE;
    expect(gr).toBe(RC.BAY.UP);
    expect(new Sea(9).open(gc, gr)).toBe(true);
    expect(atGate(gc, gr) && atGate(gc - 1, gr) && atGate(gc + 1, gr)).toBe(true);
    expect(atGate(gc, gr - 1)).toBe(false);
    expect(atGate(gc, gr + 1)).toBe(false);   // (in the gap: too late)
    expect(atGate(...RB.NOTCH)).toBe(false);
    expect(inEarshot(gc - 3, gr)).toBe(true);
    expect(inEarshot(gc - 4, gr)).toBe(false);
    expect(atWreck(...RB.NOTCH) && !atWreck(gc, gr)).toBe(true);
  });
  it('paid, she\'s towed from the gate through the fort\'s three squares and out by buoy 1, a square at a time', () => {
    for (const from of [{ c: RB.GATE[0], r: RB.GATE[1] }, { c: RB.GATE[0] - 1, r: RB.GATE[1] }, { c: RB.GATE[0] + 1, r: RB.GATE[1] }]) {
      const p = towPath(from);
      let at = from;
      for (const q of p) { expect(Math.abs(q.c - at.c) + Math.abs(q.r - at.r)).toBe(1); at = q; }
      for (const w of RC.GUNS.way) expect(p.some((q) => q.c === w[0] && q.r === w[1])).toBe(true);
      expect([at.c, at.r]).toEqual(RC.BUOYS[0].at);
    }
  });
});

describe('the wreck\'s coins, hauled up by Treasure Haul (12 Nov)', () => {
  it('its board is Treasure Haul\'s own, the price in coins to come up and no chest', () => {
    const b = purseBoard(seeded(3));
    expect(b.hoard).toBe(BRIBE.PRICE);
    expect(b.chestList()).toEqual([]);
    expect(BRIBE.ODDS.chest).toBe(0);
  });
  it('hauled from the notch only, stopped there; all up, she carries the price; Esc keeps the board to come back to', () => {
    const sea = new Sea(9), p = new Purse(seeded(5));
    expect(p.canStart(new Helm(sea, { c: RB.NOTCH[0], r: RB.NOTCH[1], d: 0 }))).toBe(true);
    expect(p.canStart(new Helm(sea, { c: RB.NOTCH[0], r: RB.NOTCH[1] - 1, d: 1 }))).toBe(false);
    const b = p.open();
    expect(p.open()).toBe(b);
    haulOut(p);
    expect(b.over).toBe(true);
    expect(p.finish()).toBe(BRIBE.PRICE);
    expect(p.finish()).toBe(null);
    expect(p.coins()).toBe(BRIBE.PRICE);
    expect(p.canStart(new Helm(sea, { c: RB.NOTCH[0], r: RB.NOTCH[1], d: 0 }))).toBe(false);
  });
});

describe('the gate\'s answer (12 Nov)', () => {
  const [gc, gr] = RB.GATE;
  it('with nothing aboard, Space at the gate is nothing; away from it, nothing', () => {
    const k = new Bribe(seeded(1));
    expect(k.pay(gc, gr)).toBe(null);
    expect(k.spares()).toBe(false);
  });
  it('short of the price, he sends her back to haul the rest; paid, the guns spare her, the coins are spent, and again is again', () => {
    const k = new Bribe(seeded(2)), b = k.purse.open();
    b.coins = BRIBE.PRICE - 5;
    expect(k.carried()).toBe(BRIBE.PRICE - 5);
    expect(k.pay(gc, gr)).toBe('short');
    expect(k.pay(...RB.NOTCH)).toBe(null);
    b.coins = BRIBE.PRICE;
    expect(k.pay(gc, gr)).toBe('paid');
    expect(k.spares()).toBe(true);
    expect(k.carried()).toBe(0);
    expect(k.pay(gc, gr)).toBe('again');
  });
});

describe('the guard\'s lines (12 Nov)', () => {
  it('his price is said as it is, he hints at the wreck, never the starlit door, and he\'s listed with the characters', () => {
    const all = [...GUARD_SAYS.intro!, ...GUARD_SAYS.loop!, ...Object.values(GUARD_SAYS.asides!).flat()];
    expect(all.some((s) => s.includes(String(BRIBE.PRICE)))).toBe(true);
    expect(all.every((s) => !s.includes('{'))).toBe(true);
    expect(all.some((s) => /wreck/i.test(s))).toBe(true);
    expect(all.every((s) => !/door|star/i.test(s))).toBe(true);
    expect(CHARACTERS).toContain(CHARACTER);
  });
});
