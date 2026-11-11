/* Primates Rule at anchor on the sloop's sea, still to come (src/den-moored.ts; her squares LAY.PRIMATES in
   src/den-sail.ts). The user (11 Nov): "add that to the scene somewhere so you can just, once you start
   getting out to sea, you just kind of see that out there and put [a mark] on it. [To] make it clear,
   it's kind of a to-do item." */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, checkpointWorks } from '../src/den-sail';
import { MOORED, MOORED_MID, MooredHail, mooredAt, nearMoored } from '../src/den-moored';
import { FRIGATE_HULL } from '../src/den-frigate';
import { kikkitAt, onKikkitLanding } from '../src/den-kikkit';
import { tzzAt, onTzzLanding } from '../src/den-tzz';
import { isleAt, onIsleLanding } from '../src/den-isle';
import { empireAt } from '../src/den-imperial';
import { BY_PRIMATES_RULE } from '../src/lines/you';

const AT = LAY.PRIMATES.AT;

describe('Primates Rule at anchor, "kind of a to-do item" (11 Nov)', () => {
  it('lies across as many squares as she is long, in a row, broadside on to the den', () => {
    expect(AT.length).toBe(Math.ceil(FRIGATE_HULL.len / SAIL.CELL));
    for (const [c, r] of AT) { expect(r).toBe(AT[0][1]); expect(mooredAt(c, r)).toBe(true); }
    expect(new Set(AT.map(([c]) => c)).size).toBe(AT.length);
    expect(Math.max(...AT.map(([c]) => c)) - Math.min(...AT.map(([c]) => c))).toBe(AT.length - 1);
    expect(MOORED_MID.r).toBe(AT[0][1]);
  });

  it('can\'t be sailed through, on every sea', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 9]) {   // (9: the den's own sea)
      const s = new Sea(seed);
      for (const [c, r] of AT) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(false);
    }
  });

  it('has open sea two squares deep all round her: no rock, no wind, no one else\'s place, nor the board\'s edge', () => {
    const works = new Set(checkpointWorks().map(([c, r]) => `${c},${r}`));
    for (const seed of [1, 2, 3, 4, 5, 6, 9]) {   // (9: the den's own sea)
      const s = new Sea(seed);
      for (const [mc, mr] of AT) for (let c = mc - 2; c <= mc + 2; c++) for (let r = mr - 2; r <= mr + 2; r++) {
        if (mooredAt(c, r)) continue;
        expect(c >= 0 && c < SAIL.COLS && r >= 0 && r < SAIL.ROWS, `${c},${r} on the board`).toBe(true);
        expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
        expect(s.windAt(c, r), `${c},${r}`).toBeUndefined();
        expect(kikkitAt(c, r) || tzzAt(c, r) || isleAt(c, r) || empireAt(c, r) || onKikkitLanding(c, r) || onTzzLanding(c, r) || onIsleLanding(c, r) || works.has(`${c},${r}`), `${c},${r}`).toBe(false);
      }
    }
  });

  it('is seen early, "once you start getting out to sea": just off the trade winds\' first run out from the beach', () => {
    const [lc, lr] = LAY.LANES[0].at, run = Array.from({ length: LAY.LANES[0].n }, (_, i) => [lc, lr + i]);
    const nearest = Math.min(...AT.flatMap(([c, r]) => run.map(([x, y]) => Math.max(Math.abs(c - x), Math.abs(r - y)))));
    expect(nearest).toBeLessThanOrEqual(6);
    expect(Math.min(...AT.map(([, r]) => r))).toBeLessThan(8);   // (not far out: near the start)
  });

  it('can be sailed up to from the mooring, under sail, on every sea', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 9]) {   // (9: the den's own sea)
      const s = new Sea(seed), [c, r] = AT[0];
      expect(s.plot(SAIL.HOME, c, r - 1), `seed ${seed}`).not.toBeNull();
    }
  }, 30000);

  it('says she\'s not ready yet the first time on a voyage you sail near her, not on every tick', () => {
    expect(BY_PRIMATES_RULE).toMatch(/not ready yet/);
    expect(MOORED.SIGN.note).toMatch(/coming soon/);
    const [c, r] = AT[0], hail = new MooredHail();
    expect(nearMoored(c, r - 2)).toBe(true);
    expect(nearMoored(c, r - 3)).toBe(false);
    expect(hail.pass(false, true)).toBe(false);
    expect(hail.pass(true, false)).toBe(false);   // (not over anything else playing)
    expect(hail.pass(true, true)).toBe(true);
    expect(hail.pass(true, true)).toBe(false);
  });
});
