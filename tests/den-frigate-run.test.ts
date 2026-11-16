/* Primates Rule's test run on the den's own sea (src/den-frigate-run.ts). The user, 15 Nov: "put into the main
   game where you've got [Primates Rule] all in progress, so you can just kind of be like ... park this sloop there
   and then take the war frig on a test run, even if it's just to go shoot some nearby things and destructible
   obstacles, or sail out into the ocean through some rocks". */
import { describe, expect, it } from 'vitest';
import { LAY, Sea, type Pose } from '../src/den-sail';
import { squares } from '../src/ship-handling';
import { RUN, TestRun, canTakeOut, runRocks } from '../src/den-frigate-run';

const den = new Sea(9);   // (the den's own sea: js/den/sea.js)
const [c0, r0] = LAY.PRIMATES.AT[0];
const bySloop: Pose = { c: c0, r: r0 - 2, d: 0 };   // (in toward the den of her, two squares off)
const run = (t: TestRun, secs: number, until?: () => boolean) => { for (let s = 0; s < secs; s += 0.05) { t.tick(0.05); if (until?.()) return s; } return Infinity; };

describe('park the sloop there and take the war frig on a test run (15 Nov)', () => {
  it('she can be taken out from your sloop near her, not from anywhere else', () => {
    expect(canTakeOut(bySloop)).toBe(true);
    expect(canTakeOut(bySloop, false)).toBe(false);   // (something else has the helm)
    expect(canTakeOut({ c: c0, r: r0 - 6, d: 0 })).toBe(false);
    // (its starting point, ?at=primates, moors your sloop where she can be)
    expect(canTakeOut(RUN.CHEAT)).toBe(true);
    expect(den.open(RUN.CHEAT.c, RUN.CHEAT.r)).toBe(true);
  });
  it('she starts where she lies at anchor, on her own squares, and your sloop is left in her way', () => {
    const t = new TestRun(den, bySloop), mine = squares(RUN.SHIP, t.helm.pose).map(([c, r]) => `${c},${r}`);
    for (const [c, r] of LAY.PRIMATES.AT) expect(mine).toContain(`${c},${r}`);
    expect(t.sea.fits(t.helm.pose)).toBe(true);
    expect(t.sea.open(bySloop.c, bySloop.r)).toBe(false);
    expect(t.bySloop()).toBe(true);
  });
  it('with your sloop lying on her usual spot, she starts on the other one', () => {
    const t = new TestRun(den, { c: c0 + 1, r: r0 + 1, d: 0 });
    expect(t.helm.pose).toEqual(RUN.ANCHOR[1]);
  });
  it('what the sloop can\'t sail through is in her way, and so is the water not for a ship her size', () => {
    const rocks = runRocks(den);
    for (const k of den.rocks) if (!LAY.PRIMATES.AT.some(([c, r]) => `${c},${r}` === k)) expect(rocks.has(k)).toBe(true);
    for (const k of den.hidden) expect(rocks.has(k)).toBe(true);
    for (const k of den.cove) expect(rocks.has(k)).toBe(true);
    for (const [c, r] of LAY.PRIMATES.AT) expect(rocks.has(`${c},${r}`)).toBe(false);
  });
  it('back by your sloop, she can be left; heading back finds her a way there', () => {
    const t = new TestRun(den, bySloop);
    t.drop(4, 41);
    run(t, 120, () => t.outPastReef());
    expect(t.bySloop()).toBe(false);
    expect(t.backToSloop()).not.toBeNull();
    expect(run(t, 160, () => t.bySloop())).toBeLessThan(160);
  }, 30000);
});

describe('sail out into the ocean through some rocks (15 Nov)', () => {
  it('the reef\'s gap out past her is just wide enough for her: she sails out through it to the open sea', () => {
    const { c0: a, c1: b, r } = RUN.GAP;
    expect(b - a + 1).toBe(RUN.SHIP.wide);
    for (let c = a; c <= b; c++) expect(den.open(c, r)).toBe(true);
    expect(den.open(a - 1, r)).toBe(false);
    expect(den.open(b + 1, r)).toBe(false);
    const t = new TestRun(den, bySloop);
    t.drop(6, 42);
    expect(run(t, 120, () => t.outPastReef())).toBeLessThan(120);
  }, 30000);
});

describe('go shoot some nearby things and destructible obstacles (15 Nov)', () => {
  it('old hulks lie about her anchorage, in her way, on open water', () => {
    const t = new TestRun(den, bySloop);
    for (const h of t.hulks) {
      expect(den.open(...h.at)).toBe(true);
      expect(t.sea.open(...h.at)).toBe(false);
      expect(Math.max(Math.abs(h.at[0] - c0), Math.abs(h.at[1] - r0))).toBeLessThanOrEqual(10);
    }
  });
  it('lying alongside one, two of her broadsides sink it, and then it\'s open water', () => {
    const t = new TestRun(den, bySloop), [hc, hr] = t.hulks[1].at;
    // Her bow along +r, the hulk off her starboard side, two squares out.
    t.helm = new (t.helm.constructor as typeof import('../src/ship-handling').ShipHelm)(t.sea, { c: hc - 3, r: hr, d: 0 });
    const first = t.fire('R')!;
    expect(first.shots.some((s) => s.got === 'hit')).toBe(true);
    expect(t.fire('R')).toBeNull();   // (still loading)
    run(t, RUN.SHIP.reload + 0.1);
    const second = t.fire('R')!;
    expect(second.shots.some((s) => s.got === 'sunk')).toBe(true);
    expect(t.sea.open(hc, hr)).toBe(true);
    expect(t.afloat()).toBe(RUN.HULKS.length - 1);
  });
  it('her shots come down short of your own sloop, and the rocks stop them', () => {
    const t = new TestRun(den, bySloop);
    expect(t.stopAt(bySloop.c, bySloop.r)).toBe('sloop');
    const [rc, rr] = [RUN.GAP.c0 - 1, RUN.GAP.r];
    expect(t.stopAt(rc, rr)).toBe('rock');
  });
  it('they\'re there again the next time she\'s taken out', () => {
    const t = new TestRun(den, bySloop);
    t.hulks[0].hp = 0;
    expect(new TestRun(den, bySloop).afloat()).toBe(RUN.HULKS.length);
  });
});

describe('her pilot aims her at a block of squares (15 Nov: "that pilot should really aim you for like a block of squares, not just one, because obviously you can\'t sit on one square")', () => {
  it('her berth is the block she\'ll lie on, with the pin under it, and it\'s where she ends up', () => {
    const t = new TestRun(den, bySloop);
    t.drop(4, 30);
    const block = t.helm.berthSquares().map(([c, r]) => `${c},${r}`);
    expect(block).toHaveLength(RUN.SHIP.long * RUN.SHIP.wide);
    expect(block).toContain(`${t.helm.pin![0]},${t.helm.pin![1]}`);
    let arrived = false;
    for (let s = 0; s < 90 && !arrived; s += 0.05) arrived = t.tick(0.05).some((e) => e.kind === 'arrive');
    expect(arrived).toBe(true);
    expect(squares(RUN.SHIP, t.helm.pose).map(([c, r]) => `${c},${r}`).sort()).toEqual([...block].sort());
  }, 30000);
  it('with no pin, no berth', () => {
    expect(new TestRun(den, bySloop).helm.berth()).toBeNull();
  });
});
