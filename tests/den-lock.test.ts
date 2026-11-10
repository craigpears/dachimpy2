/* A lock (src/den-lock.ts), and the canal's chain of them on the sloop's sea (src/den-sail.ts): the
   secret way round the imperial checkpoint (the user, 10 Nov). */
import { describe, expect, it } from 'vitest';
import { LOCK, Lock, ends, lockCost } from '../src/den-lock';
import { LAY, Sea, Helm, SAIL, type Pose } from '../src/den-sail';
import { Checkpoint, CHECK } from '../src/den-checkpoint';

const K = LAY.CHECKPOINT;
const sea = new Sea(9);
const key = ([c, r]: [number, number]) => `${c},${r}`;
/** Sail her to the pin, a frame at a time, pumping each lock she waits in to go up (by Bilge, a
    move's worth `w` every so often): where she went, and the locks she was pumped up in. */
function voyage(h: Helm, secs = 400, w = 2) {
  const been: string[] = [], pumped = new Set<number>();
  let t = 0;
  for (; h.pin && t < secs; t += 0.05) {
    for (const e of h.tick(0.05)) if (e.kind === 'move' || e.kind === 'push') been.push(`${e.to.c},${e.to.r}`);
    const l = h.working();
    if (l && Math.round(t * 20) % 10 === 0) { h.pump(w); pumped.add(h.locks.indexOf(l)); }
  }
  return { been, pumped, t };
}

describe('a lock, one module, the same wherever it\'s put (10 Nov)', () => {
  const spot = { at: [5, 5] as [number, number], up: 0, low: 1 };

  it('joins two stretches of water a level apart: she goes through only when its water\'s at hers', () => {
    const l = new Lock(spot);
    expect(l.height()).toBe(1);   // (it starts drained, at its low side's level)
    expect(l.need(1, true)).toBeNull();
    expect(l.need(1, false)).toBeNull();
    // Up to the high side with her in it takes Bilge; wanted full from the high side, it fills by
    // itself (nobody's lifted); and down, it drains by itself.
    expect(l.need(2, false)).toBe('up');
    expect(l.need(2, true)).toBe('fill');
    l.level = 1;
    expect(l.need(1, false)).toBe('down');
    expect(l.need(1, true)).toBe('down');
    expect(l.need(2, false)).toBeNull();
  });

  it('pumped a step at a time, it rises to what\'s been pumped, and full, its gates swing open', () => {
    const l = new Lock(spot);
    l.pump(LOCK.WORK / 2);
    expect(l.fill).toBeCloseTo(0.5);
    for (let i = 0; i < 120; i++) l.rise(1 / 60);
    expect(l.level).toBeCloseTo(0.5);
    expect(l.gates).toBe(0);
    l.pump(LOCK.WORK);
    for (let i = 0; i < 120; i++) l.rise(1 / 60);
    expect(l.level).toBe(1);
    expect(l.gates).toBe(LOCK.GATES);
    expect(l.open(LOCK.GATES / 2)).toBe(0);
    expect(l.open(LOCK.GATES)).toBeCloseTo(LOCK.GATES / 2);
    expect(l.openAt('high')).toBe(true);
    expect(l.openAt('low')).toBe(false);
  });

  it('drains (or fills from above) by itself in a couple of seconds, then its gates open', () => {
    const l = new Lock(spot);
    l.level = l.fill = 1;
    expect(l.run(0, LOCK.DRAIN / 2)).toBe(0);
    expect(l.level).toBeCloseTo(0.5);
    expect(l.fill).toBeCloseTo(0.5);
    expect(l.run(0, LOCK.DRAIN)).toBeCloseTo(LOCK.DRAIN / 2);
    expect(l.level).toBe(0);
    expect(l.gates).toBe(LOCK.GATES);
    expect(l.run(1, LOCK.DRAIN + 1)).toBeCloseTo(1);
    expect(l.level).toBe(1);
  });

  it('the pilot reckons a lock up a go of Bilge, and down only quick', () => {
    expect(lockCost(spot, 1)).toBe(LOCK.COST_UP);
    expect(lockCost(spot, 2)).toBe(LOCK.COST_DOWN);
    expect(ends(spot)).toEqual({ low: [5, 4], high: [5, 6] });
  });
});

describe('"be more than just the one lock": a chain of them, the secret way round the checkpoint (10 Nov)', () => {
  it('each lock on the sea is an instance of it, put down with its place and its levels', () => {
    expect(LAY.LOCKS.length).toBe(4);
    const h = new Helm(sea);
    expect(h.locks.map((l) => l.spot)).toEqual(LAY.LOCKS);
    for (const s of LAY.LOCKS) {
      const { low, high } = ends(s), [c, r] = s.at;
      // Its ends are water a level apart; its banks are rock, so she only ever goes through it
      // straight (never turns through it in one move); and no two locks touch.
      expect(sea.level(...low)).toBe(s.low);
      expect(sea.level(...high)).toBe(s.low + 1);
      expect(sea.open(...low) && sea.open(...high)).toBe(true);
      const side: [number, number][] = s.up % 2 ? [[c, r - 1], [c, r + 1]] : [[c - 1, r], [c + 1, r]];
      for (const b of side) expect(sea.open(...b)).toBe(false);
      for (const o of LAY.LOCKS) if (o !== s) expect(Math.abs(o.at[0] - c) + Math.abs(o.at[1] - r)).toBeGreaterThan(1);
      expect(h.lockAt(c, r)?.spot).toEqual(s);
    }
  });

  it('two up and two down: up the cliff from the canal, along the clifftop, down through the headland', () => {
    const levels = LAY.LOCKS.map((s) => s.low);
    expect(levels).toEqual([0, 1, 1, 0]);
    // The last two cut through the checkpoint's headland, and the sea at the foot of the last is
    // beyond the checkpoint.
    const H = K.HEADLAND, last = LAY.LOCKS[3];
    for (const s of LAY.LOCKS.slice(2)) expect(s.at[0] >= H.c0 && s.at[0] <= H.c1 && s.at[1] >= H.r0 && s.at[1] <= H.r1).toBe(true);
    expect(ends(last).low[1]).toBeGreaterThan(K.ROW);
    expect(sea.level(...ends(last).low)).toBe(0);
  });

  it('the reef\'s end is closed: the gate and the locks are the only ways past (10 Nov)', () => {
    const open: number[] = [];
    for (let c = 0; c < SAIL.COLS; c++) if (sea.open(c, K.ROW)) open.push(c);
    expect(open).toEqual([LAY.LOCKS[3].at[0], K.GATE]);
    expect(sea.isLock(LAY.LOCKS[3].at[0], K.ROW - 1)).toBe(true);
  });

  it('the locks are out of the checkpoint\'s sight and the reach of its guns, all the way', () => {
    const cp = new Checkpoint();
    for (const [id, lv] of sea.pounds) {
      const [c, r] = id.split(',').map(Number);
      expect(lv).toBeGreaterThan(0);
      for (let g = 0; g < K.GUNS.length; g++) expect(cp.battery.reaches(g, c, r)).toBe(false);
      expect(Math.max(Math.abs(c - K.GATE), Math.abs(r - K.ROW))).toBeGreaterThan(CHECK.SIGHT);
    }
    for (const s of LAY.LOCKS) for (const sq of [s.at, ends(s).low]) for (let g = 0; g < K.GUNS.length; g++) expect(cp.battery.reaches(g, ...sq)).toBe(false);
  });

  it('it costs puzzles, not just time: a go of Bilge at each lock up, and the way down drains by itself', () => {
    // From the canal at the sea's level up onto the clifftop, then on down to the sea beyond the
    // checkpoint, at the foot of the last lock.
    const h = new Helm(sea, { c: 7, r: 11, d: 3 }), out = ends(LAY.LOCKS[3]).low, top: [number, number] = [2, 16];
    h.drop(...top);
    const up = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual(top);
    expect([...up.pumped].sort()).toEqual([0, 1]);
    h.drop(out[0], out[1] + 1);
    const down = voyage(h);
    expect(h.pin).toBeNull();
    expect([h.pose.c, h.pose.r]).toEqual([out[0], out[1] + 1]);
    expect([...down.pumped]).toEqual([]);
    for (const s of LAY.LOCKS) expect([...up.been, ...down.been]).toContain(key(s.at));
    // And back the same way: up the two that came down, and down the two that went up.
    h.drop(...top);
    expect([...voyage(h).pumped].sort()).toEqual([2, 3]);
    h.drop(7, 11);
    const home = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual([7, 11]);
    expect([...home.pumped]).toEqual([]);
  });

  it('waiting in a lock to go up, nothing happens on its own: it\'s yours to pump', () => {
    const h = new Helm(sea, { c: 6, r: 11, d: 3 });
    h.put('F'); h.put('F');
    for (let t = 0; t < 30; t += 0.05) h.tick(0.05);
    expect([h.pose.c, h.pose.r]).toEqual(LAY.LOCKS[0].at);
    expect(h.held()).toBe('up');
    expect(h.working()).toBe(h.locks[0]);
    expect(h.locks.map((l) => l.level)).toEqual([0, 0, 0, 0]);
  });

  it('going down, a lock left drained fills from above by itself before she goes in', () => {
    // On the clifftop, by the third lock (drained, as they start): it fills, she goes in, it drains.
    const [c, r] = LAY.LOCKS[2].at, h = new Helm(sea, { c, r: r - 1, d: 0 });
    h.put('F');
    const seen = new Set<string>();
    for (let t = 0; t < 20 && h.pose.r !== r; t += 0.05) { seen.add(String(h.held())); h.tick(0.05); }
    expect(seen).toContain('fill');
    expect(h.pose.r).toBe(r);
    expect(h.locks[2].level).toBe(1);
    expect(h.working()).toBeNull();
  });
});

describe('the pilot through the locks', () => {
  it('a pin dropped up on the clifftop finds its way there through the locks', () => {
    const h = new Helm(sea), [c, r] = [2, 16];
    expect(h.drop(c, r)).toEqual([c, r]);
    voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual([c, r]);
  });

  it('a pin on a lock goes to the water beside it, not in it', () => {
    const h = new Helm(sea), at = h.drop(...LAY.LOCKS[1].at)!;
    expect(sea.isLock(...at)).toBe(false);
  });

  it('from the den, the pilot sails for the wreck by the gate, never the locks: they\'re yours to find', () => {
    const p = sea.plot(SAIL.HOME, LAY.WRECK[0] + 1, LAY.WRECK[1], null, true)!;
    let at: Pose = SAIL.HOME;
    const been: string[] = [];
    for (const m of p) { at = sea.sail(at, m, true).to; been.push(`${at.c},${at.r}`); }
    expect(been.some((id) => sea.pounds.has(id))).toBe(false);
    // But from up on the clifftop, on down the locks is the way.
    const q = sea.plot({ c: 2, r: 16, d: 0 }, LAY.WRECK[0] + 1, LAY.WRECK[1], null, true)!;
    at = { c: 2, r: 16, d: 0 };
    const went: string[] = [];
    for (const m of q) { at = sea.sail(at, m, true).to; went.push(`${at.c},${at.r}`); }
    expect(went).toContain(key(LAY.LOCKS[3].at));
  });
});

describe('the hidden cove: an Easter egg off the chain, after the second lock (10 Nov)', () => {
  it('is up at the top of the locks, its water the clifftop canal\'s, down an arm off it', () => {
    const { c0, r0, level } = LAY.COVE;
    expect(level).toBe(LAY.LOCKS[1].low + 1);
    expect(sea.level(c0, r0)).toBe(level);
    const h = new Helm(sea);
    h.drop(c0 + 1, r0 + 1);
    const v = voyage(h);
    expect(h.pin).toBeNull();
    expect(sea.cove.has(`${h.pose.c},${h.pose.r}`)).toBe(true);
    expect([...v.pumped].sort()).toEqual([0, 1]);
    expect(v.been).toContain(key(LAY.LOCKS[1].at));
  });

  it('"almost more like an Easter egg": the way the locks lead you along never goes near it', () => {
    // Up the second lock and on down the third: not into the cove, nor down its arm.
    const [c, r] = ends(LAY.LOCKS[1]).high, h = new Helm(sea, { c, r, d: 0 });
    h.drop(...ends(LAY.LOCKS[2]).low);
    const v = voyage(h);
    expect(h.pin).toBeNull();
    const arm = LAY.POUNDS[1].at.filter(([x, y]) => [-1, 0, 1].some((a) => sea.cove.has(`${x + a},${y - 1}`)));
    expect(arm.length).toBeGreaterThan(0);
    for (const id of v.been) expect(sea.cove.has(id)).toBe(false);
    for (const sq of arm) expect(v.been).not.toContain(key(sq));
  });
});
