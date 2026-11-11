/* Kikkit's island and her whirlpools through the reef (src/den-kikkit.ts), on the sloop's sea
   (LAY.KIKKIT in src/den-sail.ts). The user (11 Nov): "Maybe a small combo gets you through the reef,
   with the penguins being the bigger prize after", and "definitely a Vegas to get fully through to
   the penguins". */
import { describe, expect, it } from 'vitest';
import { KIKKIT, KIKKIT_STANDS, Kikkit, OUT, PASSAGE, PENGUINS, REEF_WHIRL, Whirlpools, caught, inEarshot, inKikkitWaters, kikkitAt, kikkitShore, onKikkitLanding, spatPose, turnsOf } from '../src/den-kikkit';
import { LAY, SAIL, Sea, Helm, path, type Pose, type SailEvent } from '../src/den-sail';
import { carry, gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { isleMooring } from '../src/den-isle';
import { Checkpoint } from '../src/den-checkpoint';
import { CHART, NOTES, VEGAS_NOTE } from '../src/den-map';
import { RAMBLE, BACK, TANGENTS } from '../src/lines/kikkit';

const K = LAY.KIKKIT, MOUTH = K.MOUTH;
const at = (p: Pose) => [p.c, p.r];
const last = (ps: Pose[]) => ps[ps.length - 1];
const run = (h: Helm, secs: number, step = 0.02) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };
const DOUBLE = runFor(2), VEGAS = runFor(RUN.VEGAS);

describe("her island, at the reef's near end, right of the checkpoint's gate (11 Nov)", () => {
  it('is land to sail by, on every sea, right of the gate and on the near side of the reef', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of K.LAND) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); }
    }
    for (const [c, r] of K.LAND) {
      expect(c).toBeGreaterThan(LAY.CHECKPOINT.GATE);
      expect(r).toBeLessThan(LAY.CHECKPOINT.ROW);
      expect(kikkitAt(c, r)).toBe(true);
    }
  });
  it('the water off its shore is open on every sea, the mouth of the whirlpools among it', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = new Sea(seed);
      for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onKikkitLanding(c, r)) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
    }
    expect(onKikkitLanding(MOUTH.c, MOUTH.r)).toBe(true);
    expect(onKikkitLanding(spatPose().c, spatPose().r)).toBe(true);
    expect(inKikkitWaters(MOUTH.c, MOUTH.r)).toBe(true);
  });
  it("a new player can sail there from the den and home, and still to the Wedding Isle and home (seas 1 to 20)", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed), W = isleMooring();
      const there = s.plot(SAIL.HOME, MOUTH.c, MOUTH.r);
      expect(there, `seed ${seed}`).not.toBeNull();
      let p = { ...SAIL.HOME };
      for (const m of there!) { for (const [c, r] of path(p, m).cells) expect(s.isLock(c, r) || s.level(c, r) > 0).toBe(false); p = s.sail(p, m).to; }
      expect(at(p)).toEqual([MOUTH.c, MOUTH.r]);
      expect(s.plot(p, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
      expect(s.plot(SAIL.HOME, W.c, W.r), `seed ${seed}`).not.toBeNull();
      expect(s.plot(W, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
      expect(s.plot(W, MOUTH.c, MOUTH.r)).not.toBeNull();
    }
  });
  it("is on the captain's map by name, drawn round its land", () => {
    expect(kikkitShore().length).toBeGreaterThanOrEqual(4);
    expect(CHART.kikkit.shore).toHaveLength(kikkitShore().length);
    expect(NOTES.some((n) => n.label === KIKKIT.NAME)).toBe(true);
    // (Vegas Island isn't on the map's notes from the start: map.js writes it once you've been.)
    expect(NOTES.some((n) => n.label === KIKKIT.VEGAS)).toBe(false);
    expect(VEGAS_NOTE.label).toBe('Vegas Island');
  });
});

describe('her whirlpools: a small chain through the reef, a Vegas to the penguins (11 Nov)', () => {
  const s = new Sea(9);

  it('run through a gap in the reef, which is otherwise closed but for the gate', () => {
    expect(REEF_WHIRL[1]).toBe(LAY.CHECKPOINT.ROW);
    expect(s.isRock(...REEF_WHIRL)).toBe(false);
    expect(s.whirlAt(...REEF_WHIRL)).toEqual({ spin: 4, big: false });
    expect(OUT[1]).toBeGreaterThan(LAY.CHECKPOINT.ROW);
    expect(s.open(...OUT)).toBe(true);
  });

  it('a small chain from the mouth carries her over the little whirlpool and out past the reef', () => {
    const got = gustPath(s, MOUTH, DOUBLE);
    expect(got.map(at)).toEqual([REEF_WHIRL, OUT]);
    expect(last(got).r).toBeGreaterThan(LAY.CHECKPOINT.ROW);
    // A Triple, a Bingo or a Donkey too: out past the reef, stopped short of the big whirlpools.
    for (const steps of [3, 4, 5]) expect(at(last(gustPath(s, MOUTH, runFor(steps))))).toEqual(OUT);
  });

  it('a Vegas from the mouth carries her over the big whirlpools too, to the penguins; a lesser chain doesn\'t', () => {
    const got = gustPath(s, MOUTH, VEGAS);
    expect(at(last(got))).toEqual(PENGUINS);
    expect(got).toHaveLength(PASSAGE.length);
    for (let steps = 1; steps < RUN.VEGAS; steps++) expect(gustPath(s, MOUTH, runFor(steps)).map(at)).not.toContainEqual(PENGUINS);
    // A bigger Vegas gets there too, and no further (their water's closed in).
    expect(at(last(gustPath(s, MOUTH, runFor(8))))).toEqual(PENGUINS);
    // From out past the reef, still only a Vegas.
    const out: Pose = { c: OUT[0], r: OUT[1], d: 0 };
    expect(at(last(gustPath(s, out, VEGAS)))).toEqual(PENGUINS);
    expect(gustPath(s, out, runFor(5))).toEqual([]);
  });

  it('played on the helm: a Vegas from the mouth and she\'s with the penguins, the watch saying through and penguins', () => {
    const h = new Helm(new Sea(9), MOUTH), w = new Whirlpools(), said: string[] = [];
    expect(carry(h, VEGAS)).toMatchObject({ went: PASSAGE.length, why: null });
    for (let t = 0; t < 4; t += 0.02) said.push(...w.watch(h.tick(0.02), h.pose));
    expect(at(h.pose)).toEqual(PENGUINS);
    expect(said).toEqual(['through', 'penguins']);
    expect(caught(h)).toBeNull();
    // And a Double: through, no penguins.
    const h2 = new Helm(new Sea(9), MOUTH), w2 = new Whirlpools(), said2: string[] = [];
    carry(h2, DOUBLE);
    for (let t = 0; t < 3; t += 0.02) said2.push(...w2.watch(h2.tick(0.02), h2.pose));
    expect(at(h2.pose)).toEqual(OUT);
    expect(said2).toEqual(['through']);
    expect(w2.penguins).toBe(false);
  });

  it('a plain clear drops her in the little whirlpool, and it has her (too many lefts: back to the island)', () => {
    const h = new Helm(new Sea(9), MOUTH);
    carry(h, runFor(1));
    expect(caught(h)).toBeNull();   // (still on her way)
    run(h, 2);
    expect(caught(h)).toEqual(REEF_WHIRL);
    h.moor(spatPose());
    expect(onKikkitLanding(h.pose.c, h.pose.r)).toBe(true);
  });

  it('sailing into one under her own way, it has her too; and the pilot never takes her through them', () => {
    const h = new Helm(new Sea(9), MOUTH);
    h.put('F');
    const ev = run(h, 3);
    expect(caught(h, ev)).toEqual(REEF_WHIRL);
    expect(at(h.pose)).toEqual([MOUTH.c, MOUTH.r]);
    // No pin's course goes through them: the penguins only by a gust, and beyond the reef not this way.
    expect(s.plot(MOUTH, ...PENGUINS, null, true)).toBeNull();
    for (const [c, r] of PASSAGE.filter((q) => q.kind === 'small' || q.kind === 'big').map((q) => [q.c, q.r])) expect(s.open(c, r)).toBe(false);
  });

  it('the checkpoint knows she came by them', () => {
    const h = new Helm(new Sea(9), MOUTH), cp = new Checkpoint(), said = [];
    carry(h, DOUBLE);
    for (let t = 0; t < 3; t += 0.02) { h.tick(0.02); said.push(...cp.watch(h.pose)); }
    // (out on to the open sea beyond)
    h.moor({ c: OUT[0] + 1, r: LAY.CHECKPOINT.ROW + 3, d: 0 });
    said.push(...cp.watch(h.pose));
    expect(said).toContainEqual({ kind: 'through', how: 'whirlpools', back: false, hits: 0 });
  });
});

describe('her ramble is the real map, taken literally (10 Nov: "it\'s got to actually make some mechanical sense")', () => {
  it('five lefts and a right, and a double backflip, as the whirlpools turn her', () => {
    expect(turnsOf()).toEqual({ lefts: 5, rights: 1, backflips: 2 });
    const all = RAMBLE.join(' ');
    expect(all).toMatch(/five lefts and a right/);
    expect(all).toMatch(/double backflip/);
    expect(all).toMatch(/a left, the left, the left, the left/i);
    expect(all).toMatch(/WHOOSH/);
    expect(all).toMatch(/really, really big and really sparkly/);
    expect(all).toMatch(/balaclava/);
    expect(all).toMatch(/too many lefts/i);
    // (the big ones: a left, the backflips, a right, in that order)
    const big = PASSAGE.filter((q) => q.kind === 'big').map((q) => q.spin);
    expect(big).toEqual([1, 4, 4, -1]);
    expect(all.indexOf('A left. Then a double backflip')).toBeGreaterThan(0);
    expect(all.indexOf('double backflip')).toBeLessThan(all.indexOf('Then a right'));
  });

  it('she rambles the first time you sail up, then goes off on tangents, and has a new line each time you\'re spat back', () => {
    const k = new Kikkit();
    expect(k.arrive()).toEqual([...RAMBLE]);
    expect(k.arrive()).toEqual([]);
    expect(k.hail()).toEqual([TANGENTS[0]]);
    const backs = Array.from({ length: BACK.length }, () => k.spat());
    expect(new Set(backs).size).toBe(BACK.length);
  });
});

describe(`she never stops talking (11 Nov: "a never-ending loop of tangents and her speech bubbles that don't stop")`, () => {
  it('after her ramble she always has more: every tangent in turn, then the ramble again, round and round for ever', () => {
    const k = new Kikkit();
    k.arrive();
    const said = Array.from({ length: TANGENTS.length }, () => k.more());
    expect(said.flat()).toEqual([...TANGENTS]);
    expect(k.more()).toEqual([...RAMBLE]);
    expect(k.more()).toEqual([TANGENTS[0]]);
    for (let i = 0; i < 1000; i++) expect(k.more().length).toBeGreaterThan(0);
  });

  it('an insanely long list of them, each short enough for a bubble on a phone, none said twice', () => {
    expect(TANGENTS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(TANGENTS).size).toBe(TANGENTS.length);
    for (const t of TANGENTS) expect(t.length).toBeLessThanOrEqual(100);
  });

  it(`within earshot as you sail past her island, hailed or not, and not from the checkpoint's gate`, () => {
    expect(inEarshot(KIKKIT_STANDS.c, KIKKIT_STANDS.r)).toBe(true);
    expect(inEarshot(MOUTH.c, MOUTH.r)).toBe(true);
    for (let r = K.LANDING.r0; r <= K.LANDING.r1; r++) expect(inEarshot(K.LANDING.c0, r)).toBe(true);
    expect(inEarshot(KIKKIT_STANDS.c - KIKKIT.EARSHOT - 1, KIKKIT_STANDS.r)).toBe(false);
    expect(inEarshot(LAY.CHECKPOINT.GATE, LAY.CHECKPOINT.ROW)).toBe(false);   // (Dignity's to talk there)
  });
});
