/* Something new to start, offered where you're looking (src/start-mark.ts). */
import { describe, expect, it } from 'vitest';
import { MARK, markAt } from '../src/start-mark';

const screen = { w: 1200, h: 800, top: 70, bottom: 700 };

describe('start something where you\'re looking, not at the foot of the screen (10 Nov: "it should be in the middle of the screen where I\'m looking so that I can click on it")', () => {
  it('sits over the thing itself, where it is on the screen', () => {
    expect(markAt({ x: 0, y: 0, z: 0.5 }, screen)).toEqual({ x: 600, y: 400 });
    expect(markAt({ x: -0.5, y: 0.25, z: 0.9 }, screen)).toEqual({ x: 300, y: 300 });
  });

  it('is never down at the foot among the prompt, nor up under the den\'s panel', () => {
    const low = markAt({ x: 0, y: -0.99, z: 0.5 }, screen)!;
    expect(low.y).toBe(screen.bottom - MARK.MARGIN);
    const high = markAt({ x: 0, y: 0.99, z: 0.5 }, screen)!;
    expect(high.y).toBe(screen.top + MARK.MARGIN + MARK.HEAD);
  });

  it('just off the edge, it\'s brought in to it; well off, or behind you, it\'s out of sight (the prompt carries it)', () => {
    expect(markAt({ x: 1.05, y: 0, z: 0.5 }, screen)).toEqual({ x: screen.w - MARK.MARGIN, y: 400 });
    expect(markAt({ x: 1.6, y: 0, z: 0.5 }, screen)).toBeNull();
    expect(markAt({ x: 0, y: -2, z: 0.5 }, screen)).toBeNull();
    expect(markAt({ x: 0, y: 0, z: 1.2 }, screen)).toBeNull();
    expect(markAt({ x: NaN, y: 0, z: 0.5 }, screen)).toBeNull();
  });

  it('all of it stays on the screen, not only its point (11 Nov, seen at Umami\'s bank: its label half off the left edge)', () => {
    const p = markAt({ x: -1.05, y: 0, z: 0.5 }, screen, 110)!;
    expect(p.x - 110).toBeGreaterThanOrEqual(0);
    const q = markAt({ x: 1.1, y: 0, z: 0.5 }, screen, 110)!;
    expect(q.x + 110).toBeLessThanOrEqual(screen.w);
  });

  it('on a screen too short for the band, it goes in its middle', () => {
    const p = markAt({ x: 0, y: 0, z: 0.5 }, { w: 400, h: 200, top: 150, bottom: 160 })!;
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(200);
  });
});
