/* The race's chart kept in step with the course (12 Nov). The user: "hopefully we're keeping this [race map]
   JPEG in sync." tools/race-map.mjs stamps changelog/race-map.jpg with a fingerprint of the course it drew (a
   JPEG comment: chartFingerprint, src/race-sim.ts); this fails when the course, or what its shortcuts save, has
   changed since, as tests/build.test.ts does for the compiled js. Draw it again:
     JPG=changelog/race-map.jpg node_modules/node/bin/node.exe tools/race-map.mjs <out.html> 2000 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chartFingerprint } from '../src/race-sim';
import { layRace } from '../src/den-sail';
import { DEFAULT_COURSE } from '../src/race-course';

const drawn = (): string | null => {
  const jpg = readFileSync(new URL('../changelog/race-map.jpg', import.meta.url));
  const m = /race-course:([0-9a-f]{8})/.exec(jpg.subarray(0, 4096).toString('latin1'));
  return m ? m[1] : null;
};

describe('the race\'s chart, changelog/race-map.jpg, kept in step with the course (12 Nov: "hopefully we\'re keeping this [race map] JPEG in sync")', () => {
  it('records the course it drew, and it\'s the den\'s own course as laid today (redraw it with tools/race-map.mjs if not)', () => {
    expect(drawn(), 'the chart has no fingerprint: draw it with JPG=changelog/race-map.jpg').not.toBeNull();
    expect(drawn(), 'the course has changed since the chart was drawn: JPG=changelog/race-map.jpg node tools/race-map.mjs').toBe(chartFingerprint());
  });

  it('a course moved even a square, or a shortcut that saves differently, has another fingerprint', () => {
    const k = chartFingerprint();
    expect(chartFingerprint(layRace({ ...DEFAULT_COURSE, lock: DEFAULT_COURSE.lock + 1 }))).not.toBe(k);
    expect(chartFingerprint(layRace({ ...DEFAULT_COURSE }))).toBe(k);
  });
});
