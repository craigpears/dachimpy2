/* A lock (src/den-lock.ts), and the canal's chain of them on the sloop's sea (src/den-sail.ts): the
   secret way round the imperial checkpoint (the user, 10 Nov). */
import { describe, expect, it } from 'vitest';
import { LOCK, Lock, ends, lockCost, gatesOf, lieAmong, lieClear, HER, GATES, quayOf, QUAY } from '../src/den-lock';
import { W as BW, H as BH } from '../src/bilge';
import { LAY, Sea, Helm, SAIL, type Move, type Pose } from '../src/den-sail';
import { Checkpoint, CHECK } from '../src/den-checkpoint';
import { stilled } from './helpers';

const K = LAY.CHECKPOINT;
// (Its winds stilled: the one at the canal's mouth keeps her out of it under sail; tests/den-wind.test.ts.)
const sea = stilled(new Sea(9));
const key = ([c, r]: [number, number]) => `${c},${r}`;
/** The canal's mouth at the sea's level, facing the first lock; and up on the clifftop, between the
    second lock and the third. */
const MOUTH: Pose = { c: LAY.CANAL[LAY.CANAL.length - 1][0], r: LAY.CANAL[LAY.CANAL.length - 1][1], d: LAY.LOCKS[0].up };
const TOP: [number, number] = [LAY.LOCKS[1].at[0], 16];
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
    // (the canal's; then the race course's, out past Primates Rule, 11 Nov: tests/den-race.test.ts)
    expect(h.locks.map((l) => l.spot)).toEqual([...LAY.LOCKS, ...LAY.RACE.LOCKS]);
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
    // (but Kikkit's whirlpools' winds through the reef, a way past of their own: tests/den-kikkit.test.ts)
    for (let c = 0; c < SAIL.COLS; c++) if (sea.open(c, K.ROW) && sea.windAt(c, K.ROW) === undefined) open.push(c);
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
    const h = new Helm(sea, { ...MOUTH }), out = ends(LAY.LOCKS[3]).low, top: [number, number] = TOP;
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
    h.drop(MOUTH.c, MOUTH.r);
    const home = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual([MOUTH.c, MOUTH.r]);
    expect([...home.pumped]).toEqual([]);
  });

  it('waiting in a lock to go up, nothing happens on its own: it\'s yours to pump', () => {
    const h = new Helm(sea, { ...MOUTH });
    for (let i = LAY.CANAL.length + 1; i > 0; i--) h.put('F');   // (up the mouth, into the lock, and on)
    for (let t = 0; t < 30; t += 0.05) h.tick(0.05);
    expect([h.pose.c, h.pose.r]).toEqual(LAY.LOCKS[0].at);
    expect(h.held()).toBe('up');
    expect(h.working()).toBe(h.locks[0]);
    expect(h.locks.map((l) => l.level)).toEqual([...LAY.LOCKS, ...LAY.RACE.LOCKS].map(() => 0));
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
    const h = new Helm(sea), [c, r] = TOP;
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
    const q = sea.plot({ c: TOP[0], r: TOP[1], d: 0 }, LAY.WRECK[0] + 1, LAY.WRECK[1], null, true)!;
    at = { c: TOP[0], r: TOP[1], d: 0 };
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

describe('"staring at a cliff once you go through", "having to bump into the walls to get around this lock system" (10 Nov)', () => {
  /** Steer her by hand, a move at a time (as W A D do), pumping each lock she waits in: the squares
      she went through, and whether she ever bumped. */
  function steer(h: Helm, list: Move[], secs = 300) {
    const been: string[] = [];
    let bumps = 0;
    for (const m of list) {
      h.put(m);
      for (let t = 0; t < secs && (h.mine.length || h.slot >= 0); t += 0.05) {
        for (const e of h.tick(0.05)) if (e.kind === 'move') { been.push(`${e.to.c},${e.to.r}`); if (e.bump) bumps++; }
        if (h.working()) h.pump(1);
      }
    }
    return { been, bumps };
  }
  const n = (k: number, m: Move = 'F'): Move[] => Array.from({ length: k }, () => m);
  const out = ends(LAY.LOCKS[3]).low;

  it('out of every lock she faces on along the canal, the next lock\'s gates ahead: one straight line', () => {
    for (const s of LAY.LOCKS) expect([s.at[0], s.up % 2]).toEqual([MOUTH.c, 0]);
    // (out of each lock, the way on is straight ahead: water, a lock, or the sea beyond)
    for (const s of LAY.LOCKS) for (const end of Object.values(ends(s))) expect(sea.open(...end)).toBe(true);
  });

  it('by hand, straight up the locks and down to the sea beyond, and back, never a bump', () => {
    const h = new Helm(sea, { ...MOUTH });
    const up = steer(h, n(out[1] - MOUTH.r));
    expect([h.pose.c, h.pose.r]).toEqual(out);
    expect(up.bumps).toBe(0);
    for (const s of LAY.LOCKS) expect(up.been).toContain(key(s.at));
    h.pose = { ...h.pose, d: 2 };
    const back = steer(h, n(out[1] - MOUTH.r));
    expect([h.pose.c, h.pose.r]).toEqual([MOUTH.c, MOUTH.r]);
    expect(back.bumps).toBe(0);
  });

  it('rowed through the same way, the wind at its mouth and all: at the oars, never a bump', () => {
    const h = new Helm(new Sea(9), { ...MOUTH });
    h.row(true);
    let bumps = 0;
    for (let i = 0; i < out[1] - MOUTH.r; i++) {
      h.row(true);   // (out again after each lock: she ships them in one, 10 Nov)
      h.stroke(['F']);
      for (let t = 0; t < 300 && (h.strokes.length || h.slot >= 0); t += 0.05) {
        for (const e of h.tick(0.05)) if (e.kind === 'move' && e.bump) bumps++;
        if (h.working()) h.pump(1);
      }
    }
    expect([h.pose.c, h.pose.r, bumps]).toEqual([...out, 0]);
  });

  it('rowed into a lock, she ships her oars and sails on: not rowing the whole way (10 Nov)', () => {
    // "once you get through the lock and you figured out the rowing, it should auto switch back to
    // sailing so that it doesn't make it seem like you're having bilge the whole way through."
    const s = new Sea(9), L = LAY.LOCKS[0], h = new Helm(s, { ...MOUTH });
    h.row(true);
    h.stroke(['F', 'F', 'F', 'F']);   // (up the mouth, into the lock, and on out of it)
    const said: string[] = [];
    let t = 0;
    for (; t < 30 && !h.working(); t += 0.05) for (const e of h.tick(0.05)) said.push(e.kind);
    // Waiting in it to be pumped up, her oars are shipped: the Bilge board's up, not the rowing.
    expect([h.pose.c, h.pose.r]).toEqual(L.at);
    expect(h.working()).toBe(h.locks[0]);
    expect(h.oars).toBe(false);
    expect(h.strokes).toEqual([]);
    // Pumped up, the gates open and she makes her move out of it under sail, then waits for you.
    for (t = 0; t < 120 && h.slot >= 0; t += 0.05) { for (const e of h.tick(0.05)) said.push(e.kind); if (h.working()) h.pump(1); }
    expect([h.pose.c, h.pose.r]).toEqual(ends(L).high);
    expect(h.oars).toBe(false);
    expect(h.idle()).toBe(true);
    // Nothing said of it (no word of the oars: "Hidden gems, never hinted").
    expect(said.every((k) => ['turn', 'move', 'push'].includes(k))).toBe(true);
    // And on up the canal under sail, to the next lock.
    h.drop(...ends(LAY.LOCKS[1]).low);
    for (t = 0; t < 30 && h.pin; t += 0.05) h.tick(0.05);
    expect([h.pose.c, h.pose.r]).toEqual(ends(LAY.LOCKS[1]).low);
  });

  it('the side way pushes back: the arm to the hidden cove doubles back off the clifftop, two turns tight together', () => {
    // (STORY.md, "The way on pulls you; the side ways push back".) Off the way on, never on it.
    const arm = LAY.POUNDS[1].at.filter(([c]) => c !== MOUTH.c);
    expect(arm.length).toBeGreaterThanOrEqual(3);
    for (const s of LAY.LOCKS) for (const sq of arm) expect(Math.abs(sq[0] - s.at[0]) + Math.abs(sq[1] - s.at[1])).toBeGreaterThan(1);
    // Turned off the canal into it, and turned again straight away, down into the cove.
    const h = new Helm(sea, { c: MOUTH.c, r: 14, d: 0 });
    const v = steer(h, ['L', 'L', 'F']);
    expect(v.bumps).toBe(0);
    expect(sea.cove.has(`${h.pose.c},${h.pose.r}`)).toBe(true);
  });
});

describe('"the way to the locks: found, not shown" (10 Nov)', () => {
  it('the canal\'s mouth is in the cliffs\' face toward the den, well off to the side of the trade wind\'s run', () => {
    const run = LAY.LANES[0].at[0], mouth = LAY.CANAL[0];
    expect(run - mouth[0]).toBeGreaterThanOrEqual(5);
    expect(LAY.LOCKS[0].up).toBe(0);   // (facing the den)
    expect(mouth[1]).toBe(LAY.PLATEAU.r0 - 1);
    // Nothing at the junction leads there: the water off the junction to the left is open sea.
    const [jc, jr] = LAY.JUNCTION;
    for (let c = jc - 3; c < jc; c++) expect(sea.level(c, jr + 1)).toBe(0);
  });

  it('from the open sea the pilot never takes her up the locks: they\'re yours to find', () => {
    // Even for a pin she can't otherwise sail to (the old wreck, by its wind: den-wind.test.ts).
    const [wc, wr] = LAY.WRECK, windy = new Sea(9);
    windy.zones = windy.zones.filter((z) => z.r0 >= K.ROW);   // (only the wreck's wind)
    expect(windy.plot(SAIL.HOME, wc - 1, wr)).toBeNull();
    expect(windy.plot(SAIL.HOME, wc - 1, wr, null, true)).not.toBeNull();
    // But from on the canal, or to a pin on it, the locks are the way.
    expect(sea.plot({ ...MOUTH }, ...TOP)).not.toBeNull();
    expect(sea.plot({ c: TOP[0], r: TOP[1], d: 0 }, wc - 1, wr)).not.toBeNull();
  });
});

describe('"the front part of the ship is sticking out of the gate when the [lock] is draining" (10 Nov)', () => {
  const C = SAIL.CELL, pad = GATES.LEAF / 2;
  const at = (i: number) => gatesOf(LAY.LOCKS[i], LAY.LOCKS, C);

  it('in a lock she fits between its gates, bow and stern, whichever way she faces', () => {
    for (let i = 0; i < LAY.LOCKS.length; i++) {
      const g = at(i);
      for (const [toHigh, toLow] of [[HER.BOW, HER.STERN], [HER.STERN, HER.BOW]]) {
        expect(toHigh + pad).toBeLessThan(g.high);
        expect(toLow + pad).toBeLessThan(g.low);
      }
    }
  });

  it('its low gates, swinging into the chamber, sweep clear of her stern going up and her bow going down', () => {
    // (a leaf swings about its hinge on the chamber's wall, GATES.HALF across from her middle)
    for (let i = 0; i < LAY.LOCKS.length; i++) {
      const hinge = [-at(i).low, GATES.HALF];
      const stern = [-HER.STERN, HER.STERN_HALF], bowsprit = [-HER.BOW, 0];
      for (const [x, z] of [stern, bowsprit]) expect(Math.hypot(x - hinge[0], z - hinge[1])).toBeGreaterThan(Math.hypot(GATES.HALF, pad));   // (a leaf's far corner)
    }
  });

  it('the two down through the headland, a square apart, are a staircase: one pair of gates between them', () => {
    expect(at(3).above).toBe(2);
    expect(at(3).high + at(2).low).toBe(2 * C);   // (the same pair: the upper's low gates)
    for (const i of [0, 1, 2]) expect(at(i).above).toBe(-1);
  });

  it('up the locks and down, and back, she\'s never drawn through a shut gate, waiting or not', () => {
    const h = new Helm(sea, { ...MOUTH });
    const open = (i: number, end: 'low' | 'high') => {
      const g = at(i), lk = h.locks[i];
      // (a staircase's pair opens once the lower lock's full too)
      const below = LAY.LOCKS.findIndex((_, j) => at(j).above === i);
      return lk.openAt(end) && (end === 'high' || below < 0 || h.locks[below].openAt('high')) && !(end === 'high' && g.above >= 0) ? 1 : 0;
    };
    let waits = 0, lay = 0;
    const look = () => {
      const p = lieAmong(h.now(), LAY.LOCKS, C, open);
      const d = ((Math.round(p.a) % 4) + 4) % 4;
      if (Math.abs(p.r - h.now().r) > 1e-9) lay++;
      LAY.LOCKS.forEach((s, i) => {
        if (p.c !== s.at[0] || d % 2 !== s.up % 2) return;
        const along = (p.r - s.at[1]) * (s.up === 0 ? 1 : -1) * C, face = d === s.up ? 1 : -1;
        const hi = along + (face > 0 ? HER.BOW : HER.STERN), lo = along - (face > 0 ? HER.STERN : HER.BOW), g = at(i);
        const shut: number[] = [];
        if (!open(i, 'low')) shut.push(-g.low);
        if (g.above >= 0 ? !open(g.above, 'low') : !open(i, 'high')) shut.push(g.high);
        for (const x of shut) expect(x + pad <= lo || x - pad >= hi, `${h.held()} at ${h.pose.r}: lock ${i}'s gates at ${x}, her ${lo}..${hi}`).toBe(true);
      });
    };
    const go = (c: number, r: number) => {
      h.drop(c, r);
      for (let t = 0; h.pin && t < 400; t += 0.05) {
        h.tick(0.05);
        if (h.held()) waits++;
        look();
        const l = h.working();
        if (l && Math.round(t * 20) % 10 === 0) h.pump(2);
      }
      expect(h.pin).toBeNull();
    };
    go(...TOP); go(3, 22); go(...TOP); go(MOUTH.c, MOUTH.r);
    expect(waits).toBeGreaterThan(0);
    expect(lay).toBeGreaterThan(0);   // (she lay back from a lock's gates at least once: filling from above)
  });

  it('lying off a lock she\'s let in only as its gates swing well open, gliding, never jumping', () => {
    const g = { low: C, high: GATES.HIGH };
    const shut = lieClear(C, -1, g, { low: 0, high: 0 });
    expect(shut).toBeCloseTo(g.high + pad + GATES.CLEAR + HER.BOW);
    expect(lieClear(C, -1, g, { low: 0, high: 0.5 })).toBe(shut);
    let was = shut;
    for (let u = 0.6; u <= 1.0001; u += 0.02) {
      const now = lieClear(C, -1, g, { low: 0, high: u });
      expect(was - now).toBeLessThan(1.2);
      was = now;
    }
    expect(was).toBe(C);
    // In it, she lies as she is.
    expect(lieClear(0, 1, g, { low: 0, high: 0 })).toBe(0);
  });
});

/* The user, playtesting (10 Nov): "[pulling] in[to] the locks and the [nose], so you can't see the
   [bilging] puzzle. Obviously, it should be orientated to the ship or the dock or whatever", and
   "You can see some of it, but I think some of it's in". Coming back up through the headland, the
   view had her bow coming at you, and at the lower of the two, half the board was sunk in the
   staircase's higher bank. */
describe('the lock\'s Bilge board hidden as she comes in (10 Nov)', () => {
  const C = SAIL.CELL, w = BW + 0.3, h = BH + 0.3;
  const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
  const top = (c: number, r: number) => (sea.ground(c, r) ? sea.bank(c, r) : null);
  const boards = sea.locks.map((s) => quayOf(s, C, w, h, top));

  it('every lock\'s board lies wholly on its own quay, never sunk in a higher bank nor out over the sea', () => {
    sea.locks.forEach((s, i) => {
      const q = boards[i], [c, r] = s.at, own = top(c + DC[q.side], r + DR[q.side]);
      expect(own, `lock ${i}'s quay`).not.toBeNull();
      // Every bit of the board (its frame in), on a square of high ground at the quay's own height.
      const e = 1e-6, A = h * q.sq / 2 - e, X = w * q.sq / 2 - e;
      for (let u = -1; u <= 1; u += 0.25) for (let v = -1; v <= 1; v += 0.25) {
        const along = q.along + u * A, across = q.across + v * X;
        const a = Math.round(along / C), x = Math.round(across / C);
        const sc = c + a * DC[s.up] + x * DC[q.side], sr = r + a * DR[s.up] + x * DR[q.side];
        expect(top(sc, sr), `lock ${i}'s board at ${along.toFixed(2)} along, ${across.toFixed(2)} across: square ${sc},${sr}`).toBe(own);
      }
      // Off the chamber's edge, clear of the pier and the pump; and still a good size (the view comes
      // in to suit it).
      expect(q.across - w * q.sq / 2).toBeGreaterThanOrEqual(C / 2 + QUAY.IN - 1e-9);
      expect(q.sq).toBeGreaterThan(0.3);
      expect(q.sq).toBeLessThanOrEqual(QUAY.SQ);
    });
    // Where there's room, it's where it always was: the first lock's, as before.
    expect(boards[0]).toMatchObject({ side: 1, along: QUAY.NUDGE, sq: QUAY.SQ });
    expect(boards[0].across).toBeCloseTo(4.3, 1);
    // The lower of the headland's staircase: only the one square of quay at its height, between the
    // sea and the upper lock's higher bank, and the board fits on it.
    const low = sea.locks.findIndex((s) => gatesOf(s, sea.locks, C).above >= 0);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(boards[low].sq).toBeLessThan(QUAY.SQ);
  });

  it('turned to her: its top row toward the way she faces waiting to be pumped up, whichever lock, whichever way she came', () => {
    sea.locks.forEach((s, i) => {
      const [lc, lr] = ends(s).low, helm = new Helm(sea, { c: lc, r: lr, d: s.up });
      helm.put('F'); helm.put('F');
      for (let t = 0; !helm.working() && t < 60; t += 0.05) helm.tick(0.05);
      expect(helm.working(), `lock ${i}`).toBe(helm.locks[i]);
      expect(helm.pose.d).toBe(boards[i].face);
    });
    // Both ways round: out, up the first two facing out to sea; back, up the headland's two facing in.
    expect(new Set(boards.map((b) => b.face))).toEqual(new Set([0, 2]));
  });
});
