import { describe, expect, it } from 'vitest';
import { SIEGE, STRAGGLERS, STRAGGLERS_GONE, afterWave, countingDown, stragglerBanner, stragglerClock, stragglerCount, stragglerLine, stragglersIn, theft, timberComes } from '../src/den-raids';

describe('the opening siege', () => {
  it('is three waves, then the den goes quiet: "do a few waves" (9 Nov)', () => {
    expect(SIEGE.WAVES).toBe(3);
    expect(afterWave(1)).toBe('calm');
    expect(afterWave(2)).toBe('calm');
    expect(afterWave(3)).toBe('peace');
  });

  it('stays quiet after a raid called on later', () => {
    expect(afterWave(4)).toBe('peace');
    expect(afterWave(9)).toBe('peace');
  });

  it('counts down to the next wave only before the first and between the siege\'s waves, never once it\'s over', () => {
    expect(countingDown('build')).toBe(true);
    expect(countingDown('calm')).toBe(true);
    expect(countingDown('wave')).toBe(false);
    expect(countingDown('peace')).toBe(false);
  });
});

describe("The walk frame once the wall's all filled (8 Nov)", () => {
  it('comes as soon as every hole is mended, mid-wave or not: "so you can work on that while they try in a futile attempt to get in"', () => {
    expect(timberComes('walk', 'mended')).toBe(true);
  });

  it('or with a wave beaten off, if that comes first', () => {
    expect(timberComes('walk', 'beaten')).toBe(true);
  });

  it('the parts after it still come as the reward for beating a wave off, not for mending', () => {
    expect(timberComes('later', 'mended')).toBe(false);
    expect(timberComes('later', 'beaten')).toBe(true);
  });

  it("nothing comes while a frame's still being filled, or once all is built", () => {
    expect(timberComes(null, 'mended')).toBe(false);
    expect(timberComes(null, 'beaten')).toBe(false);
  });
});

describe('the rampart after the siege', () => {
  it("the gun tower can still be built after the siege: no waves left to bring its timber (10 Nov)", () => {
    // "what happened to building the [gun tower]? Have I got no way of doing that now because there
    // was that triggered after a third wave or something?"
    expect(afterWave(SIEGE.WAVES)).toBe('peace');
    expect(timberComes('later', 'peace')).toBe(true);
    // Not while something's still being built (nextPart is null then), and nothing once all's built.
    expect(timberComes(null, 'peace')).toBe(false);
  });
});

describe('the occasional raider after the siege', () => {
  it('not too peaceful after the siege: the occasional raider to throw scrap at (10 Nov)', () => {
    // "you've got no way of wasting pieces ... originally it was the balance, the key was that you
    // could throw things at the enemies"; "Definitely the occasional raiders, I think, is still
    // needed. It gives it a bit of life, and as you said, a way to throw scrap."
    expect(stragglerClock({ phase: 'peace', away: false, raiders: 0 })).toBe(true);
    // Every couple of minutes or so: alive, never pressured.
    expect(stragglersIn(0)).toBe(90);
    expect(stragglersIn(1)).toBe(180);
    expect(stragglersIn(0.5)).toBe(135);
    expect(stragglersIn(-1)).toBe(90);
    expect(stragglersIn(2)).toBe(180);
  });

  it('a raider or two, rarely three: on the easy side', () => {
    expect(stragglerCount(0)).toBe(1);
    expect(stragglerCount(STRAGGLERS.ONE - 0.01)).toBe(1);
    expect(stragglerCount(STRAGGLERS.ONE)).toBe(2);
    expect(stragglerCount(0.85)).toBe(2);
    expect(stragglerCount(0.95)).toBe(3);
    expect(stragglerCount(0.999)).toBe(3);
    // Over many rolls: never more than three, and three only now and then.
    const rolls = Array.from({ length: 1000 }, (_, i) => stragglerCount(i / 1000));
    expect(Math.max(...rolls)).toBe(3);
    expect(rolls.filter((n) => n === 3).length).toBeLessThanOrEqual(100);
  });

  it("only in peace and in the den: not in the siege, at sea, in a cutscene or the map, nor with some still about", () => {
    expect(stragglerClock({ phase: 'build', away: false, raiders: 0 })).toBe(false);
    expect(stragglerClock({ phase: 'wave', away: false, raiders: 0 })).toBe(false);
    expect(stragglerClock({ phase: 'calm', away: false, raiders: 0 })).toBe(false);
    expect(stragglerClock({ phase: 'peace', away: true, raiders: 0 })).toBe(false);
    expect(stragglerClock({ phase: 'peace', away: false, raiders: 1 })).toBe(false);
  });

  it('is no siege: nothing said reads as a wave, a countdown or cannon', () => {
    const said = [1, 2, 3].flatMap((n) => [stragglerLine(n, true), stragglerLine(n, false), stragglerBanner(n)]).concat(STRAGGLERS_GONE);
    for (const s of said) expect(s).not.toMatch(/wave|siege|cannon|attack in|next/i);
    expect(stragglerLine(2, false)).toBe("Two boats putting in: a couple of Vikings after an easy mark");
    expect(stragglerLine(1, false)).toBe("A boat's putting in: a Viking after an easy mark");
    // The first time, how to be rid of a piece on them.
    expect(stragglerLine(1, true)).toMatch(/Shift throws/);
  });

  it('leaves the den at peace: the siege stays over', () => {
    expect(countingDown('peace')).toBe(false);
    expect(afterWave(SIEGE.WAVES)).toBe('peace');
  });
});

describe('a straggler at the chest', () => {
  it('never empties it after the siege: a bit of life, not a way to lose the den (10 Nov)', () => {
    expect(theft(60, 10, 'peace')).toBe(10);
    expect(theft(5, 10, 'peace')).toBe(4);
    expect(theft(1, 10, 'peace')).toBe(0);
    expect(theft(0, 10, 'peace')).toBe(0);
  });

  it('in the siege takes what it always did', () => {
    expect(theft(5, 10, 'wave')).toBe(10);
  });
});
