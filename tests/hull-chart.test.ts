/* Each kind of ship's chart of a board (src/hull-chart.ts), as the blockade uses it. The user, 15 Nov: "surely ...
   there's not that many ways you can move around ... Can we not just for the map have ... a couple of pre-computed
   maps ... one for small ships, one for big, and ... the only thing that can really change is ... the destructible
   items ... And then ... the adversarial planning on the top ... so you can plan around other moving ships". */
import { describe, expect, it } from 'vitest';
import { BLOCKADE, Blockade } from '../src/blockade';
import { HullChart } from '../src/hull-chart';
import { ShipSea, squares } from '../src/ship-handling';
import type { Pose } from '../src/den-sail';

const B = BLOCKADE, prize: [number, number] = [21, 17];
const kind = (b: Blockade, k: 'sloop' | 'frigate', team = 'gold') => b.ships.find((s) => s.kind === k && s.team === team)!;
/** Her kind's sea as the den's pilot has it, no chart (Sea.plot's own search), the same rocks and winds. */
const plain = (b: Blockade, k: 'sloop' | 'frigate') => {
  const s = kind(b, k), sea = new ShipSea(s.h, B.COLS, B.ROWS, b.rocks);
  return k === 'sloop' ? sea.carriedBy(b.wind) : sea;
};
/** Every few poses she can lie in, out of the way of every ship. */
const poses = (b: Blockade, k: 'sloop' | 'frigate', every: number) => {
  const sea = kind(b, k).sea.bare(), out: Pose[] = [];
  for (let c = 0; c < B.COLS; c += every) for (let r = 0; r < B.ROWS; r += every) for (const d of [0, 1, 2, 3]) if (sea.fits({ c, r, d })) out.push({ c, r, d });
  return out;
};

describe('a chart a kind of ship, shared (15 Nov: "a couple of pre-computed maps ... one for small ships, one for big")', () => {
  it('every sloop shares one chart and every frigate another, worked out once when the board is set up', () => {
    const b = new Blockade();
    const sloops = b.ships.filter((s) => s.kind === 'sloop'), frigates = b.ships.filter((s) => s.kind === 'frigate');
    expect(new Set(sloops.map((s) => s.sea.chart)).size).toBe(1);
    expect(new Set(frigates.map((s) => s.sea.chart)).size).toBe(1);
    expect(sloops[0].sea.chart).not.toBe(frigates[0].sea.chart);
    for (const k of ['sloop', 'frigate'] as const) expect(b.charts[k].builds).toBe(1);
    // (how far to the prize, from where any frigate is: one field, worked out once for all of them)
    const before = b.charts.frigate.kept();
    for (const s of frigates) s.sea.eta(s.helm.pose, ...B.BUOYS[3].at);
    expect(b.charts.frigate.kept()).toBe(before + 1);
  });

  it('her quickest way on the chart is as quick as the den\'s own pilot finds, from all over the board, for both kinds', () => {
    const b = new Blockade();
    for (const k of ['sloop', 'frigate'] as const) {
      const chart = b.charts[k], old = plain(b, k), s = kind(b, k);
      // (the buoy off the south gate, open water west of the fort, a lagoon's hiding place, a far corner: places both
      // kinds can reach or not)
      const goals: [number, number][] = [B.BUOYS[3].at, [6, 20], B.REEFS[0].hide, [2, 33]];
      let compared = 0;
      for (const from of poses(b, k, 7)) for (const [c, r] of goals) {
        const mine = s.sea.plotPast(from, c, r), theirs = old.plot(from, c, r);
        expect(!!mine, `${k} from ${JSON.stringify(from)} to ${c},${r}`).toBe(!!theirs);
        if (!mine || !theirs) continue;
        expect(chart.costOf(from, mine)).toBeCloseTo(chart.costOf(from, theirs), 6);
        // (and how far it is, a look-up, is what that way costs)
        expect(s.sea.eta(from, c, r)).toBeCloseTo(chart.costOf(from, mine), 6);
        compared++;
      }
      expect(compared, k).toBeGreaterThan(40);
    }
  });

  it('the sloops find the side ways\' winds; a frigate has no way into the heart till a gate\'s down, then has', () => {
    const b = new Blockade(), sl = kind(b, 'sloop'), fr = kind(b, 'frigate');
    expect(sl.sea.eta(sl.helm.pose, ...prize)).toBeLessThan(Infinity);
    expect(fr.sea.eta(fr.helm.pose, ...prize)).toBe(Infinity);
    for (const t of b.gates[0].towers.slice(0, 1)) for (const [c, r] of t.squares) b.rocks.delete(`${c},${r}`);
    expect(fr.sea.eta(fr.helm.pose, ...prize)).toBeLessThan(Infinity);
  });
});

describe('a tower falling: only what\'s near it worked out again (15 Nov: "the only thing that can really change is ... the destructible items")', () => {
  it('the poses near a crumbled tower are worked out again, not the board, and it comes out as if worked out afresh', () => {
    const b = new Blockade(), chart = b.charts.frigate;
    const tower = b.gates[0].towers[0];
    for (const [c, r] of tower.squares) b.rocks.delete(`${c},${r}`);
    chart.fresh();
    expect(chart.builds).toBe(2);
    expect(chart.rebuilt).toBeGreaterThan(0);
    expect(chart.rebuilt).toBeLessThan(chart.N / 3);
    const afresh = new HullChart(new ShipSea(chart.sea.ship, B.COLS, B.ROWS, b.rocks));
    afresh.fresh();
    expect(afresh.rebuilt).toBe(chart.N);
    expect([...chart.end]).toEqual([...afresh.end]);
    expect([...chart.cost]).toEqual([...afresh.cost]);
    for (let k = 0; k < chart.N * 3; k += 7) expect([...chart.sweeps(k)]).toEqual([...afresh.sweeps(k)]);
  });
});

describe('round the other ships, near her only (15 Nov: "the adversarial planning on the top ... so you can plan around other moving ships")', () => {
  it('a ship lying across her way close by: her pilot goes round her; the same ship far off: straight through, she\'ll have moved', () => {
    const b = new Blockade(), s = kind(b, 'sloop');
    const others = b.ships.filter((o) => o !== s);
    // (the sloop on open water at the west edge, heading out along it; everyone else well away, but one)
    others.forEach((o, i) => o.helm.moor({ c: 30 + (i % 8), r: 4 + Math.floor(i / 8) * 4, d: 1 }));
    s.helm.moor({ c: 1, r: 14, d: 0 });
    b.notice();
    const block = kind(b, 'frigate', 'crimson');
    const straight = s.sea.plot(s.helm.pose, 1, 24)!;
    expect(straight.every((m) => m === 'F')).toBe(true);
    // (a frigate lying across her way, three squares ahead: round her)
    block.helm.moor({ c: 1, r: 17, d: 1 });
    b.notice(); s.sea.touch();
    expect(squares(block.h, block.helm.pose).some(([c, r]) => c === 1 && r === 17)).toBe(true);
    const round = s.sea.plot(s.helm.pose, 1, 24)!;
    expect(round).not.toBeNull();
    expect(round.some((m) => m !== 'F')).toBe(true);
    let p = s.helm.pose;
    for (const m of round) { p = s.sea.sail(p, m).to; expect(b.under(p.c, p.r)?.id ?? s.id, JSON.stringify(p)).toBe(s.id); }
    // (the same frigate further along, beyond her pilot's reckoning: straight on, for now)
    block.helm.moor({ c: 1, r: 22, d: 1 });
    b.notice(); s.sea.touch();
    expect(s.sea.near).toBeLessThan(8);
    expect(s.sea.plot(s.helm.pose, 1, 30)!.slice(0, 4).every((m) => m === 'F')).toBe(true);
  });

  it('a frigate bound for a gate goes to the nearest of its berths, and lies just so', () => {
    const b = new Blockade(), s = kind(b, 'frigate'), rows = s.sea.rows;
    const berths: Pose[] = [{ c: 17, r: 9, d: 1 }, { c: 26, r: 9, d: 3 }];
    const way = s.sea.plotAny(s.helm.pose, 'test-berths', () => berths.map((x) => (x.c * rows + x.r) * 4 + x.d))!;
    expect(way).not.toBeNull();
    const etas = berths.map((x) => s.sea.eta(s.helm.pose, x.c, x.r, x));
    const nearest = berths[etas[0] <= etas[1] ? 0 : 1];
    expect(way.to).toEqual(nearest);
    let p = s.helm.pose;
    for (const m of way.moves) p = s.sea.bare().sail(p, m).to;
    expect(p).toEqual(nearest);
  });
});
