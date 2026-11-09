import { describe, expect, it } from 'vitest';
import { SIEGE, afterWave, countingDown } from '../src/den-raids';

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
