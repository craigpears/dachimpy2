/* The rowing boards at sea (RULES.md, "Rowing by mirror strokes", 10 Nov): the squares they row,
   how quick she goes, her rowers, and which way to pull for the pin. */
import { describe, expect, it } from 'vitest';
import { H, KINDS, W } from '../src/bilge';
import type { Bilge, Bit } from '../src/bilge';
import { ROW } from '../src/rowing';
import { BALANCE } from '../src/mirror-row';
import { CREW, LEAN, RowBoard, bearing, leadFor, leaned, pullFor, shownAt } from '../src/den-row';
import { poseAt } from '../src/den-sail';
import { WIND, Wind, rowTime } from '../src/den-wind';
import { Helm, Sea, type SailEvent } from '../src/den-sail';

const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };
/** A board laid from the top, as in tests/mirror-row.test.ts. */
function lay(b: Bilge, rows: string[], id: number): void {
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    const bit: Bit = { id: id++, k: ch === undefined ? (c + 3 * r + 5) % KINDS : Number(ch) };
    b.grid[r][c] = bit;
  }
}
function boards(port: string[], starboard: string[]): RowBoard {
  const b = new RowBoard({ randoms: [cycle(), cycle()], kinds: KINDS });
  lay(b.row.port, port, 1000); lay(b.row.starboard, starboard, 5000);
  return b;
}
const sea = () => { const s = new Sea(1, false); s.rocks.clear(); s.breeze = new Wind(1); s.breeze.set(1, 2, 1e9); return s; };
const run = (h: Helm, secs: number, step = 0.01) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };

describe('rowing her', () => {
  it(`a square rowed on its own goes at the oars' steady pace; a pile of them quicker, up to the trade winds'`, () => {
    expect(rowTime(1)).toBe(WIND.OARS);
    expect(rowTime(2)).toBeCloseTo(WIND.OARS / 2);
    expect(rowTime(20)).toBe(WIND.FAST);
  });

  it('the den rows mirror strokes: a swap on port is made in mirror on starboard', () => {
    const b = boards(['012345'], ['012345']);
    b.swap(0, 0);
    expect(b.row.port.grid[0].map((x) => x!.k)).toEqual([1, 0, 2, 3, 4, 5]);
    expect(b.row.starboard.grid[0].map((x) => x!.k)).toEqual([0, 1, 2, 3, 5, 4]);
  });

  it('even work rows her straight ahead, straight away', () => {
    const b = boards(['101145'], ['013343']), m = b.swap(0, 0);
    expect(m.pull).toEqual({ port: ROW.THREE, starboard: ROW.THREE });
    const steps = [...m.steps, ...b.pull({ port: 0.5, starboard: 0.5 })];
    expect(steps).toEqual(['F']);
    const h = new Helm(sea(), { c: 8, r: 3, d: 0 });
    h.row(true);
    h.stroke(steps);
    run(h, WIND.OARS + 0.5);
    expect(h.pose).toEqual({ c: 8, r: 4, d: 0 });
  });

  it('a Vegas on each side at once sends her zooming, "the same as traveling on the winds" (10 Nov)', () => {
    const steps = new RowBoard().pull({ port: ROW.WORTH['Vegas!'], starboard: ROW.WORTH['Vegas!'] });
    expect(steps).toEqual(Array(10).fill('F'));
    expect(steps.length).toBeGreaterThanOrEqual(CREW.FLYING);
    const h = new Helm(sea(), { c: 8, r: 2, d: 0 });
    h.row(true);
    h.stroke(steps.slice(0, 5));
    const ev = run(h, 2.5), secs = ev.filter((e) => e.kind === 'move').map((e) => (e as { secs: number }).secs);
    expect(secs[0]).toBe(WIND.FAST);
    expect(h.pose).toEqual({ c: 8, r: 7, d: 0 });   // five squares in two and a half seconds
  });

  it('one-sided rowing turns her: "you just end up rowing in circles" (10 Nov)', () => {
    const steps = new RowBoard().pull({ port: 0, starboard: 4 * BALANCE.TURN });
    expect(steps).toEqual(['R', 'R', 'R', 'R']);
    const h = new Helm(sea(), { c: 8, r: 5, d: 0 });
    h.row(true);
    h.stroke(steps);
    run(h, 4);
    expect(h.pose).toEqual({ c: 8, r: 5, d: 0 });   // right round, back where she was
  });

  it(`"if you pull on the right-hand side, it should definitely go right" (10 Nov): starboard's board turns her to starboard, port's to port`, () => {
    const h = new Helm(sea(), { c: 8, r: 5, d: 0 });
    h.row(true);
    h.stroke(new RowBoard().pull({ port: 0, starboard: ROW.WORTH['Bingo!'] }));
    run(h, 2);
    expect(h.pose.d).toBe(1);   // (heading 1: round to her starboard)
    const k = new Helm(sea(), { c: 8, r: 5, d: 0 });
    k.row(true);
    k.stroke(new RowBoard().pull({ port: ROW.WORTH['Bingo!'], starboard: 0 }));
    run(k, 2);
    expect(k.pose.d).toBe(3);
  });

  it(`"one on one side and two on the other ... basically impossible to go straight" (10 Nov): three clears like that row her on, straight`, () => {
    const b = new RowBoard(), steps = [{ port: 1, starboard: 0 }, { port: 0, starboard: 1 }, { port: 0, starboard: 1 }].flatMap((p) => b.pull(p));
    expect(steps.filter((s) => s !== 'F')).toEqual([]);
    expect(b.waiting('starboard')).toBe(1);
    expect(b.waiting('port')).toBe(0);
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
    const b = boards(['101145'], []);
    b.swap(0, 0);
    expect(b.lately).toEqual({ port: ROW.THREE, starboard: 0 });
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

  it(`pull harder on the side it's on (10 Nov: "if you pull on the right-hand side, it should definitely go right")`, () => {
    expect([pullFor('starboard'), pullFor('port'), pullFor('ahead'), pullFor('astern'), pullFor('here')]).toEqual(['starboard', 'port', null, 'either', null]);
  });
});

describe(`"I'm not seeing any physical difference" (10 Nov): she answers the oars as the pull builds`, () => {
  it(`one side's clear swings her bows toward that side at once, and heels her into it`, () => {
    const b = new RowBoard();
    b.pull({ port: 0, starboard: 1 });
    const got = b.building(), lead = leadFor(got);
    expect(got.turn).toBeCloseTo(1 / BALANCE.TURN);
    expect(lead.y).toBeGreaterThan(0);   // (starboard pulling harder: her bows swing to starboard)
    expect(lead.heel).toBeGreaterThan(0);
    const s = new RowBoard();
    s.pull({ port: 2, starboard: 0 });
    expect(leadFor(s.building()).y).toBeLessThan(0);
  });

  it(`forward pull building creeps her ahead, a fraction of a square, before the square's move`, () => {
    const b = new RowBoard();
    b.pull({ port: 0.5, starboard: 0.5 });
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

