/* The rowing board at sea (TODO.md, "Rowing by port and starboard", 10 Nov): the squares it rows,
   how quick she goes, her rowers, and which way to pull for the pin. */
import { describe, expect, it } from 'vitest';
import { H, KINDS, W } from '../src/bilge';
import type { Bit } from '../src/bilge';
import { Oars, ROW } from '../src/rowing';
import { CREW, LEAN, RowBoard, bearing, leadFor, leaned, pullFor, shownAt } from '../src/den-row';
import { poseAt } from '../src/den-sail';
import { WIND, Wind, rowTime } from '../src/den-wind';
import { Helm, Sea, type SailEvent } from '../src/den-sail';

const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };
/** A rowing board drawn from the top, as in tests/rowing.test.ts. */
function board(rows: string[]): RowBoard {
  const b = new RowBoard({ random: cycle() });
  let id = 1000;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    const bit: Bit = ch === undefined ? { id: id++, k: (c + 3 * r + 5) % KINDS } : { id: id++, k: Number(ch) };
    b.rowing.bilge.grid[r][c] = bit;
  }
  return b;
}
const sea = () => { const s = new Sea(1, false); s.rocks.clear(); s.breeze = new Wind(1); s.breeze.set(1, 2, 1e9); return s; };
const run = (h: Helm, secs: number, step = 0.01) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };

describe('rowing her', () => {
  it('a square rowed on its own goes at the oars\' steady pace; a pile of them quicker, up to the trade winds\'', () => {
    expect(rowTime(1)).toBe(WIND.OARS);
    expect(rowTime(2)).toBeCloseTo(WIND.OARS / 2);
    expect(rowTime(20)).toBe(WIND.FAST);
  });

  it('even work rows her straight ahead, straight away', () => {
    const b = board(['001011']), m = b.swap(0, 2);
    expect(m.steps).toEqual(['F']);
    const h = new Helm(sea(), { c: 8, r: 3, d: 0 });
    h.row(true);
    h.stroke(m.steps);
    run(h, WIND.OARS + 0.5);
    expect(h.pose).toEqual({ c: 8, r: 4, d: 0 });
  });

  it('a Vegas on each side at once sends her zooming, "the same as traveling on the winds" (10 Nov)', () => {
    const o = new Oars(), steps = o.feed({ port: ROW.WORTH['Vegas!'] / 2, starboard: ROW.WORTH['Vegas!'] / 2 }, 0);
    expect(steps).toEqual(['F', 'F', 'F', 'F', 'F']);
    expect(steps.length).toBeGreaterThanOrEqual(CREW.FLYING);
    const h = new Helm(sea(), { c: 8, r: 2, d: 0 });
    h.row(true);
    h.stroke(steps);
    const ev = run(h, 2.5), secs = ev.filter((e) => e.kind === 'move').map((e) => (e as { secs: number }).secs);
    expect(secs[0]).toBe(WIND.FAST);
    expect(h.pose).toEqual({ c: 8, r: 7, d: 0 });   // five squares in two and a half seconds
  });

  it('one-sided rowing turns her: "you just end up rowing in circles" (10 Nov)', () => {
    const o = new Oars();
    expect(o.row('port', ROW.WORTH['Vegas!'], 0)).toEqual([]);
    const steps = o.tick(ROW.WINDOW);
    expect(steps).toEqual(['R', 'R', 'R', 'R', 'R']);
    const h = new Helm(sea(), { c: 8, r: 5, d: 0 });
    h.row(true);
    h.stroke(steps.slice(0, 4));
    run(h, 4);
    expect(h.pose).toEqual({ c: 8, r: 5, d: 0 });   // right round, back where she was
  });

  it('turns and goes on while the pull on one side waits for the other', () => {
    const b = new RowBoard();
    b.rowing.oars.row('starboard', 3, b.t);
    expect(b.waiting('starboard')).toBe(3);
    expect(b.tick(ROW.SOLO - 0.1)).toEqual([]);
    expect(b.tick(0.2)).toEqual(['L']);
    expect(b.waiting('starboard')).toBe(0);
  });
});

describe('her rowers', () => {
  it('rest when there\'s nothing to row, and stroke steady when she\'s under way', () => {
    const b = new RowBoard();
    expect([b.rate('port', false), b.rate('port', true)]).toEqual([0, CREW.STEADY]);
  });

  it('a big clear makes that side\'s rower go "like crazy" (10 Nov), and it wears off', () => {
    const b = new RowBoard();
    b.lately.port = ROW.WORTH['Vegas!'];
    expect(b.crazy('port')).toBe(true);
    expect(b.crazy('starboard')).toBe(false);
    expect(b.rate('port', true)).toBeGreaterThan(5);
    for (let i = 0; i < 50; i++) b.tick(0.1);
    expect(b.crazy('port')).toBe(false);
    expect(b.rate('port', true)).toBeLessThan(CREW.STEADY + 1);
  });

  it('each side strokes as hard as it pulled', () => {
    const b = board(['001011']);
    b.swap(0, 2);
    expect(b.lately).toEqual({ port: 1.5, starboard: 1.5 });
  });
});

describe('rowing for the pin (the pilot doesn\'t row for her)', () => {
  it('tells which way the pin lies as she heads', () => {
    const p = { c: 8, r: 5, d: 0 };   // heading out to sea (r up); her starboard is c up
    expect(bearing(p, [8, 5])).toBe('here');
    expect(bearing(p, [8, 9])).toBe('ahead');
    expect(bearing(p, [9, 9])).toBe('ahead');
    expect(bearing(p, [12, 6])).toBe('starboard');
    expect(bearing(p, [3, 7])).toBe('port');
    expect(bearing(p, [8, 1])).toBe('astern');
    expect(bearing({ c: 8, r: 5, d: 1 }, [8, 9])).toBe('port');
  });

  it('pull harder on the side away from it, as at the oars', () => {
    expect([pullFor('starboard'), pullFor('port'), pullFor('ahead'), pullFor('astern'), pullFor('here')]).toEqual(['port', 'starboard', null, 'either', null]);
  });
});

describe(`"I'm not seeing any physical difference" (10 Nov): she answers the oars as the pull builds`, () => {
  it(`rowed alone, a one-sided move turns her after ROW.SOLO, not the team's ROW.WINDOW`, () => {
    const b = new RowBoard();
    b.rowing.oars.row('port', ROW.STEP, b.t);
    expect(ROW.SOLO).toBeLessThan(ROW.WINDOW);
    expect(b.tick(ROW.SOLO - 0.05)).toEqual([]);
    expect(b.tick(0.1)).toEqual(['R']);
  });

  it(`one side's clear swings her bows toward the turn at once, and heels her into it`, () => {
    const b = new RowBoard();
    b.rowing.oars.row('port', 1, b.t);
    const got = b.building(), lead = leadFor(got);
    expect(got.turn).toBeCloseTo(1 / ROW.STEP);
    expect(lead.y).toBeGreaterThan(0);   // (port pulling harder: her bows swing to starboard)
    expect(lead.heel).toBeGreaterThan(0);
    const s = new RowBoard();
    s.rowing.oars.row('starboard', 2, s.t);
    expect(leadFor(s.building()).y).toBeLessThan(0);
  });

  it(`forward pull building creeps her ahead, a fraction of a square, before the square's move`, () => {
    const b = new RowBoard();
    b.rowing.oars.feed({ port: 0.5, starboard: 0.5 }, b.t);
    expect(b.building()).toEqual({ ahead: 1 / ROW.STEP, turn: 0 });
    const lead = leadFor({ ahead: 0.99, turn: 0 });
    expect(lead.f).toBeGreaterThan(0);
    expect(lead.f).toBeLessThanOrEqual(LEAN.CREEP);
    expect(leaned({ c: 8, r: 3, a: 0 }, 0, lead).r).toBeCloseTo(3 + lead.f);
  });

  it(`the square's move starts from where she'd crept to, and never jumps back`, () => {
    const from = { c: 8, r: 3, d: 0 }, lead = leadFor({ ahead: 0.9, turn: 0.6 });
    const idle = leaned({ c: 8, r: 3, a: 0 }, 0, lead);
    for (const m of ['F', 'L', 'R'] as const) {
      expect(shownAt(from, m, 0, lead)).toEqual(idle);
      const end = poseAt(from, m, 1);
      const got = shownAt(from, m, 1, lead);
      expect([got.c, got.r, got.a]).toEqual([end.c, end.r, end.a]);
    }
    // Forward, she only ever goes ahead.
    let r = -Infinity;
    for (let u = 0; u <= 1.0001; u += 0.05) { const p = shownAt(from, 'F', u, lead); expect(p.r).toBeGreaterThanOrEqual(r - 1e-9); r = p.r; }
  });
});

