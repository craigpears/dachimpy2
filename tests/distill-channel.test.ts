/* The late game's channels (src/distill-channel.ts): a white brought right along a channel into the junk's place in the
   column being filled, the channel built first where need be. The user, 14 Nov, watching CC^1 (DISTILLING.md, "The late
   game: whites go right"; notes/distilling/48- to 50-*). */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, DOWN_LEFT, WHITE, neighbourOn, parseBoard } from '../src/distilling';
import { CHANNEL, builders, channelRuns, whiteRun } from '../src/distill-channel';
import { playDrags } from '../src/distill-routines';
import type { Ctx } from '../src/distill-routines';
import { stepsFor } from '../src/distill-goals';
import { P, channelMove, choose, levelNamed } from '../src/distill-bots';

/** The board in notes/distilling/48-two-blacks-in-the-target.webp (P43): column 9 being filled, blacks in rows 4 and 6. */
const SHOT = parseBoard(['KwKKKK*Kw', 'bbKbKbww', '*bwwKwbwb', 'bbwKbbKb', 'K*wKbbKbb', 'wwKbKbbK', 'KKKKKbbwK', 'wbKKKbww', 'wwwKwKwww', 'KKKKbKKK']);
const CTX: Ctx = { stage: 'chain', burnFrom: 9, fill: 8, reach: 40 };
const PACE = { rate: 5, spot: 350 };

describe('a white along a channel (whiteRun)', () => {
  it('two blacks in the target column (14 Nov): a white from the left reaches the top one in one drag, down through browns and up through blacks', () => {
    const r = whiteRun(SHOT, [8, 3], PACE)!;
    expect(r).not.toBeNull();
    expect(r.drag.x).toBeLessThan(8);
    const after = playDrags(SHOT, [r.drag])!;
    expect(after[8][3]).toBe(WHITE);
    // The black goes back along the path: to the place the white rose from, beside the column.
    const back = neighbourOn(SHOT, 8, 3, DOWN_LEFT)!;
    expect(after[back[0]][back[1]]).toBe(BLACK);
    expect(after[8].filter((p) => p === BLACK).length).toBe(1);
  });
  it('steps only down onto browns and up onto blacks, never into the target column but for its last swap', () => {
    const r = whiteRun(SHOT, [8, 5], PACE)!;
    let at: [number, number] = [r.drag.x, r.drag.y];
    r.drag.ways.forEach((w, i) => {
      const n = neighbourOn(SHOT, at[0], at[1], w)!;
      expect(SHOT[n[0]][n[1]]).toBe(w <= 1 ? BLACK : BROWN);
      if (i < r.drag.ways.length - 1) expect(n[0]).toBeLessThan(8);
      at = n;
    });
    expect(at).toEqual([8, 5]);
  });
  it("the user's own drawing (50-a-brown-channel-for-the-top-one): column 8's top brown sunk down-left through the blacks, then column 3's white down through the browns and up through the blacks into row 4", () => {
    const built = playDrags(SHOT, [{ x: 7, y: 1, ways: [DOWN_LEFT, DOWN_LEFT, DOWN_LEFT, DOWN_LEFT, DOWN_LEFT] }])!;
    expect(built[2][4]).toBe(BROWN);
    const after = playDrags(built, [{ x: 2, y: 3, ways: [2, 3, 3, 3, 0, 0, 0, 0] }])!;
    expect(after[8][3]).toBe(WHITE);
    // ... and the search finds a run there too, on the channel built.
    expect(whiteRun(built, [8, 3], PACE)).not.toBeNull();
  });
  it('nothing when the target is no junk', () => {
    expect(whiteRun(SHOT, [8, 0], PACE)).toBeNull();
  });
});

describe('the channel built first (channelRuns)', () => {
  it('a plan for each black in the target column, cheapest first, each clearing its black', () => {
    const plans = channelRuns(SHOT, CTX, PACE);
    expect(plans.map((p) => p.into).sort()).toEqual([[8, 3], [8, 5]]);
    for (const p of plans) expect(playDrags(SHOT, p.drags)![p.into[0]][p.into[1]]).toBe(WHITE);
    expect(plans[0].ms).toBeLessThanOrEqual(plans[1].ms);
  });
  it('builds the channel when there is none: after the top black is replaced, the bottom one needs a brown sunk through a black first', () => {
    const first = channelRuns(SHOT, CTX, PACE).find((p) => p.into[1] === 3)!;
    const b = playDrags(SHOT, first.drags)!;
    const second = channelRuns(b, CTX, PACE).find((p) => p.into[1] === 5)!;
    expect(second).toBeTruthy();
    expect(second.built).toBe(true);
    {
      // A builder moves junk past junk only, left of the column being filled.
      const [f] = second.drags;
      expect([BROWN, BLACK]).toContain(b[f.x][f.y]);
      expect(f.x).toBeLessThan(8);
    }
    expect(playDrags(b, second.drags)![8].every((p) => p === WHITE)).toBe(true);
  });
  it("builders move only junk past junk, and stay left of the column being filled", () => {
    for (const f of builders(SHOT, 2, 8, PACE).slice(0, 100)) {
      let at: [number, number] = [f.drag.x, f.drag.y], bb = SHOT;
      for (const w of f.drag.ways) {
        const n = neighbourOn(bb, at[0], at[1], w)!;
        expect([BROWN, BLACK]).toContain(bb[n[0]][n[1]]);
        expect(n[0]).toBeLessThan(8);
        bb = playDrags(bb, [{ x: at[0], y: at[1], ways: [w] }])!;
        at = n;
      }
      expect(f.drag.ways.length).toBeLessThanOrEqual(CHANNEL.BUILD);
    }
  });
  it('only in the chain', () => {
    expect(channelRuns(SHOT, { ...CTX, stage: 'junk' }, PACE)).toEqual([]);
  });
});

describe('named and planned', () => {
  it("its drags' goals: the builder 'buildChannel', the white's run 'channel'", () => {
    const first = channelRuns(SHOT, CTX, PACE).find((p) => p.into[1] === 3)!;
    const b = playDrags(SHOT, first.drags)!;
    const second = channelRuns(b, CTX, PACE).find((p) => p.into[1] === 5 && p.built);
    const steps = stepsFor(SHOT, first.drags, { ctx: CTX });
    expect(steps[steps.length - 1].goal?.kind).toBe('channel');
    expect(second).toBeTruthy();
    expect(stepsFor(b, channelMove(b, second!).drags, { ctx: CTX }).map((s) => s.goal?.kind)).toEqual(['buildChannel', 'channel']);
  });
  it('the CC^1 bot plays it on the screenshot, and not with the trick off (P.CHANNEL 0)', () => {
    const lv = levelNamed('cc1');
    expect(choose({ cols: SHOT, chain: 0, timeLeft: 9000 }, CTX, lv).steps?.some((s) => s.goal?.kind === 'channel')).toBe(true);
    const was = P.CHANNEL;
    try {
      P.CHANNEL = 0;
      expect(choose({ cols: SHOT, chain: 0, timeLeft: 9000 }, CTX, lv).steps?.some((s) => s.goal?.kind === 'channel')).toBe(false);
    } finally { P.CHANNEL = was; }
  });
});
