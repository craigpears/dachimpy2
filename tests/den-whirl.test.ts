/* A whirlpool on the sloop's sea, by YPPedia's rules (src/den-whirl.ts): "The whirlpool covers a two
   tile by two tile area"; "On each move, whirlpools move the ship clockwise around to the opposite
   corner of the whirlpool. They simultaneously rotate the ship clockwise 90 degrees." */
import { describe, expect, it } from 'vitest';
import { WHIRL, inWhirlpool, whirl, whirlAt, whirlpool } from '../src/den-whirl';
import { Helm, Sea, type Pose, type SailEvent } from '../src/den-sail';

describe('a whirlpool, as YPPedia has it (11 Nov)', () => {
  const w = whirlpool({ at: [4, 6] });

  it('covers two squares by two', () => {
    expect(w.squares).toHaveLength(4);
    for (const [c, r] of [[4, 6], [5, 6], [4, 7], [5, 7]] as [number, number][]) expect(inWhirlpool(w, c, r)).toBe(true);
    expect(inWhirlpool(w, 6, 6)).toBe(false);
  });

  it('moves her clockwise round to the opposite corner, by the next one, turned a quarter clockwise', () => {
    // Seen from above, out to sea up: from the near right corner, clockwise is by the near left one.
    const got = whirl(w, { c: 5, r: 6, d: 0 });
    expect(got.via).toEqual([4, 6]);
    expect(got.to).toEqual({ c: 4, r: 7, d: 1 });
    // and on round, clockwise, from each corner
    expect(whirl(w, { c: 4, r: 7, d: 1 })).toEqual({ via: [5, 7], to: { c: 5, r: 6, d: 2 } });
    expect(whirl(w, { c: 4, r: 6, d: 3 })).toEqual({ via: [4, 7], to: { c: 5, r: 7, d: 0 } });
  });

  it('four whirls and she ends "in exactly the same position and orientation as it started"', () => {
    for (const start of [{ c: 4, r: 6, d: 0 }, { c: 5, r: 7, d: 3 }] as Pose[]) {
      let p = start;
      for (let i = 0; i < 4; i++) p = whirl(w, p).to;
      expect(p).toEqual(start);
    }
  });

  it('swings her round its middle as it goes, through the next corner halfway', () => {
    const from = { c: 5, r: 6, d: 0 }, to = whirl(w, from).to, half = whirlAt(from, to, 0.5);
    expect(half.c).toBeCloseTo(4);
    expect(half.r).toBeCloseTo(6);
    expect(half.a).toBeCloseTo(0.5);
    expect(whirlAt(from, to, 1)).toMatchObject({ c: 4, r: 7, a: 1 });
  });

  it('with a corner missing, the corner opposite it sends her onto it; the two either side of it send her to and fro', () => {
    const g = whirlpool({ at: [4, 6], gone: [4, 7] });
    expect(g.squares).toHaveLength(3);
    expect(inWhirlpool(g, 4, 7)).toBe(false);
    expect(whirl(g, { c: 5, r: 6, d: 0 }).to).toMatchObject({ c: 4, r: 7 });
    expect(whirl(g, { c: 4, r: 6, d: 0 }).to).toMatchObject({ c: 5, r: 7 });
    expect(whirl(g, { c: 5, r: 7, d: 0 }).to).toMatchObject({ c: 4, r: 6 });
    expect(() => whirlpool({ at: [4, 6], gone: [7, 7] })).toThrow();
  });

  it('on the helm: it acts when she comes to rest on it, and lets her go after a whole turn round, never holding her for ever', () => {
    const s = new Sea(1, false), pool = whirlpool({ at: [4, 6] });
    for (const [c, r] of pool.squares) s.whirls.set(`${c},${r}`, pool);
    const h = new Helm(s, { c: 4, r: 4, d: 0 }), ev: SailEvent[] = [];
    h.put('F'); h.put('F');
    for (let t = 0; t < 30; t += 0.02) ev.push(...h.tick(0.02));
    const whirls = ev.filter((e) => e.kind === 'push' && e.whirl);
    // Into the near left corner, then round and round: four whirls, back as she was, and let be.
    expect(whirls).toHaveLength(WHIRL.MOST);
    expect(h.pose).toEqual({ c: 4, r: 6, d: 0 });
    expect(h.whirling()).toBe(false);
    // A move of her own and it has her again.
    h.put('F');
    const more: SailEvent[] = [];
    for (let t = 0; t < 10; t += 0.02) more.push(...h.tick(0.02));
    expect(more.some((e) => e.kind === 'push' && e.whirl)).toBe(true);
  });
});
