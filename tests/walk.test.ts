/* A pirate's walk (src/walk.ts), drawn by js/den/world.js's animateWalk for everyone moved anywhere. */
import { describe, expect, it } from 'vitest';
import { cadence, gaitPose, gaitStep, newGait, MAX_CADENCE, WALK_CADENCE, WALK_PACE, type Gait } from '../src/walk';

const DT = 1 / 60;
/** Frames of a pirate moved along x at `speed` (m/s), as the den moves them: when `twice`, another part
    first calls them not moving each frame (the den's own tick, under a cutscene or the whiz). The leg's
    swing each frame. */
function legs(speed: (t: number) => number, frames: number, twice = false, g: Gait = newGait(), x0 = 0) {
  const out: number[] = [];
  let x = x0;
  for (let i = 0; i < frames; i++) {
    if (twice) gaitStep(g, x, 0, false, DT);
    x += speed(i * DT) * DT;
    gaitStep(g, x, 0, true, DT);
    out.push(gaitPose(g).leg);
  }
  return { out, g, x };
}
const crossings = (a: number[]) => a.slice(1).filter((v, i) => Math.sign(v) !== Math.sign(a[i]) && v !== 0).length;
const biggestJump = (a: number[]) => Math.max(...a.slice(1).map((v, i) => Math.abs(v - a[i])));

describe('legs walk, not jitter, when whizzing along and fetching the map (11 Nov)', () => {
  it('walking out to the map (a cutscene moving you, the den saying "not moving" each frame) swings the legs full strides', () => {
    const { out } = legs(() => 2.6, 120, true);
    expect(Math.max(...out)).toBeGreaterThan(0.5);   // (it was stuck near 0: snapped back every frame)
    expect(Math.min(...out)).toBeLessThan(-0.5);
    expect(crossings(out)).toBeGreaterThanOrEqual(2);   // two seconds, a step and more each way
    expect(biggestJump(out)).toBeLessThan(0.15);   // smooth frame to frame
  });
  it('whizzing along the gallery is a run: a bigger swing, at no more than a sprint\'s cadence', () => {
    const secs = 2.4, dist = 30;
    const sm = (u: number) => 6 * u * (1 - u) / secs * dist;   // (the smoothstep's speed: up to ~19 m/s)
    const { out } = legs((t) => sm(Math.min(1, t / secs)), Math.round(secs * 60), true);
    expect(Math.max(...out.map(Math.abs))).toBeGreaterThan(0.85);   // a run's swing, not a walk's 0.6
    expect(biggestJump(out)).toBeLessThan(0.3);
    // never more than a sprint's strides: at most MAX_CADENCE / 2π cycles a second
    expect(crossings(out) / 2 / secs).toBeLessThanOrEqual(MAX_CADENCE / (Math.PI * 2) + 0.5);
    expect(cadence(19)).toBeLessThanOrEqual(MAX_CADENCE);
  });
  it('ordinary walking at the den\'s pace goes as it always did', () => {
    expect(cadence(WALK_PACE)).toBeCloseTo(WALK_CADENCE, 6);
    const { out } = legs(() => WALK_PACE, 60);
    expect(Math.max(...out)).toBeCloseTo(0.6, 1);
    expect(crossings(out)).toBe(Math.floor(WALK_CADENCE / Math.PI));   // 11 rad/s: three and a half half-strides
  });
  it('the legs go with the distance: twice as far at a walk, more stride, a little quicker', () => {
    expect(cadence(4)).toBeGreaterThan(cadence(2));
    expect(cadence(4)).toBeLessThan(cadence(2) * 2);
  });
  it('a one-frame stop never flickers the legs; a real stop eases them back to rest', () => {
    const { g, x } = legs(() => 3, 40);
    const before = gaitPose(g).leg;
    gaitStep(g, x, 0, false, DT);
    expect(gaitPose(g).leg).toBeCloseTo(before, 6);   // (one frame: as they were)
    const rest: number[] = [];
    for (let i = 0; i < 40; i++) { gaitStep(g, x, 0, false, DT); rest.push(gaitPose(g).leg); }
    expect(biggestJump([before, ...rest])).toBeLessThan(0.1);   // eased, not snapped
    expect(Math.abs(rest[rest.length - 1])).toBeLessThan(0.05);   // and at rest in well under a second
  });
  it('someone put somewhere (a skip, a snap aboard) doesn\'t run a mile on the spot', () => {
    const g = newGait();
    gaitStep(g, 0, 0, true, DT);
    const p = g.phase;
    gaitStep(g, 20, 0, true, DT);
    expect(g.phase).toBe(p);
  });
});
