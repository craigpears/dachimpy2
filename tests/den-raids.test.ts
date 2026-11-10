import { describe, expect, it } from 'vitest';
import { SIEGE, afterWave, countingDown, timberComes } from '../src/den-raids';

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
