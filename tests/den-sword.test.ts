/* Swordfight in the den: the sword rack and the soldiers (src/den-sword.ts). */
import { describe, expect, it } from 'vitest';
import { Barracks, Lumber, muster, planRepair, REPAIR, rewardPair, SWORD, SwordRack, waitSpot } from '../src/den-sword';
import type { Foe, Mend } from '../src/den-sword';
import { carp, hole } from './helpers';
import { toSword } from '../src/swordfight';
import type { Pair } from '../src/swordfight';

const pair = (a = 0, b = 1, breaker = false): Pair => [{ c: a as 0, breaker }, { c: b as 0, breaker: false }];
/** A raider, as the soldiers see one. */
const raider = (x: number, z: number, state = 'raid', inside = true): Foe => ({ x, z, state, inside, hitT: 0.5 });
/** Run the soldiers, and the raider fighting back as den.js would, for `secs`; what got knocked flat. */
function fight(b: Barracks, foes: Foe[], secs: number, spots = [] as { x: number; z: number }[]) {
  const knocked: Foe[] = [];
  for (let t = 0; t < secs; t += 0.05) {
    for (const n of b.tick(0.05, foes, spots, { x: 0, z: 5 })) if (n.kind === 'knock') { n.foe.state = 'down'; knocked.push(n.foe); }
    for (const r of foes) if (r.duel) b.duel(r, 0.05);
  }
  return knocked;
}

describe('muster', () => {
  const link = (chain: number, ...strikes: ReturnType<typeof toSword>[]) => ({ chain, broken: 0, sprinkles: 0, strikes, before: [] });

  // The user, after the demo (8 Nov): "you'd have to do a combo, like a fuse block to get a soldier,
  // and obviously combo for multiples".
  it('loose pieces arm nobody: only a fused block makes a soldier (8 Nov)', () => {
    expect(muster({ links: [{ chain: 1, broken: 6, sprinkles: 3, strikes: [], before: [] }], sprinkles: 3, strikes: [] })).toEqual([]);
    const [one, ...rest] = muster({ links: [link(1, toSword(2, 2))], sprinkles: 0, strikes: [toSword(2, 2)] });
    expect(rest).toEqual([]);
    expect(one.hp).toBe(3);
    expect(one.size).toBe(1);
  });

  it('a combo arms more of them: two for each block on the second link, three on the third (8 Nov)', () => {
    const res = { links: [link(1, toSword(2, 2)), link(2, toSword(2, 2, 2)), link(3, toSword(2, 2, 3))], sprinkles: 0, strikes: [] };
    expect(muster(res)).toHaveLength(1 + 2 + 3);
  });

  it('a bigger block makes tougher, bigger soldiers, but not by the chain', () => {
    const [small] = muster({ links: [link(1, toSword(2, 2))], sprinkles: 0, strikes: [] });
    const [big] = muster({ links: [link(1, toSword(4, 4))], sprinkles: 0, strikes: [] });
    const [chained] = muster({ links: [link(3, toSword(2, 2, 3))], sprinkles: 0, strikes: [] });
    expect(big.hp).toBeGreaterThan(small.hp);
    expect(big.size).toBeGreaterThan(small.size);
    expect(chained).toEqual({ ...small, sword: chained.sword });
  });

  it('nothing broken, nobody comes', () => {
    expect(muster({ links: [], sprinkles: 0, strikes: [] })).toEqual([]);
  });
});

describe('repairs', () => {
  const mend = (rest: ReturnType<typeof hole>, o: Partial<Mend> = {}): Mend => ({ rest, open: false, attackers: 0, strength: 1, ...o });
  const key = (cells: [number, number][]) => cells.map(([r, c]) => `${r},${c}`).sort().join(' ');

  // The user (8 Nov), on barricade crates piled on the ground: "this is confusing. Maybe you have to
  // do a certain number and it actually fills in a hole a bit ... more of like a permanent wall
  // repair for sprinkling."
  it('loose crates pile up as planks till there are enough to mend a piece of a hole (8 Nov)', () => {
    const l = new Lumber();
    l.add(REPAIR.CRATES - 1);
    expect(l.ready).toBe(false);
    l.add(2);
    expect(l.ready).toBe(true);
    l.use();
    expect(l.crates).toBe(1);
  });

  it('planks waiting with no hole to mend are kept, up to a few pieces\' worth', () => {
    const l = new Lumber();
    l.add(100);
    expect(l.crates).toBe(REPAIR.CRATES * REPAIR.KEEP);
  });

  it('a repair is a whole piece\'s worth, leaving the rest of the hole finishable as a Masterpiece', () => {
    // Ten squares: a P and another piece, or several other ways. Whatever it planks, the rest is a piece.
    const h = hole('###.', '####', '###.');
    const plan = planRepair([mend(h)], carp)!;
    expect(plan.hole).toBe(0);
    expect(plan.piece.cells).toHaveLength(5);
    const used = new Set(plan.piece.cells.map(([r, c]) => `${r},${c}`));
    const left = h.filter(([r, c]) => !used.has(`${r},${c}`));
    expect(left).toHaveLength(5);
    expect(carp.solve(left, 1)).toHaveLength(1);
  });

  it('it mends from the bottom of the hole, where raiders come through', () => {
    // Two I's, one on top of the other: the lower one goes first.
    const h = hole('#####', '#####');
    expect(key(planRepair([mend(h)], carp)!.piece.cells)).toBe(key([[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]]));
  });

  it('it goes to a gap raiders can walk through first, then the hole hacked hardest, then the weakest', () => {
    const a = hole('#####'), b = hole('#####');
    expect(planRepair([mend(a, { attackers: 2 }), mend(b, { open: true })], carp)!.hole).toBe(1);
    expect(planRepair([mend(a, { attackers: 1 }), mend(b, { attackers: 3 })], carp)!.hole).toBe(1);
    expect(planRepair([mend(a, { strength: 0.2 }), mend(b, { strength: 0.9 })], carp)!.hole).toBe(0);
  });

  it('a hole that can\'t be finished exactly any more still gets a piece that fits in it', () => {
    const h = hole('######', '#.....');   // seven squares: no exact finish
    const plan = planRepair([mend(h)], carp)!;
    const set = new Set(h.map(([r, c]) => `${r},${c}`));
    expect(plan.piece.cells.every(([r, c]) => set.has(`${r},${c}`))).toBe(true);
  });

  it('nothing to mend: no repair', () => {
    expect(planRepair([], carp)).toBeNull();
    expect(planRepair([mend(hole('####'))], carp)).toBeNull();
  });
});

describe('rewardPair', () => {
  // The user (8 Nov): gold for a Masterpiece "is fairly meaningless ... getting a reward like some
  // breakers would be a lot better than gold".
  it('a Masterpiece pays a pair with a breaker in it, in any colours (8 Nov)', () => {
    let i = 0;
    const seq = [0, 0.99, 0.3, 0.6, 0.5, 0.1];
    const seen = new Set<number>();
    for (let k = 0; k < 3; k++) {
      const p = rewardPair(() => seq[i++ % seq.length]);
      expect(p.some((x) => x.breaker)).toBe(true);
      p.forEach((x) => { expect(x.c).toBeGreaterThanOrEqual(0); expect(x.c).toBeLessThanOrEqual(3); seen.add(x.c); });
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('SwordRack', () => {
  const stocked = (n: number) => { const r = new SwordRack(); for (let i = 0; i < n; i++) { r.take(pair()); r.unload(); } return r; };

  it('a reward jumps the queue, so it comes down next, unless the shelves are full', () => {
    const r = stocked(2);
    const prize = rewardPair(() => 0.5);
    expect(r.give(prize)).toBe(true);
    expect(r.queue[0]).toBe(prize);
    const full = stocked(SWORD.STORE);
    expect(full.give(rewardPair())).toBe(false);
  });

  it('you carry the sword pieces you pick up on your back, up to eight', () => {
    const r = new SwordRack();
    for (let i = 0; i < 10; i++) r.take(pair());
    expect(r.pack).toHaveLength(SWORD.PACK);
    expect(r.take(pair())).toBe(false);
    expect(r.pieces).toBe(0);   // (none at the hoist yet)
  });

  it(`dropped off just by walking up to the armoury, onto shelves that hold far more ("you shouldn't have to press space", 9 Nov)`, () => {
    const r = new SwordRack();
    for (let i = 0; i < SWORD.PACK; i++) r.take(pair());
    expect(r.unload()).toBe(SWORD.PACK);
    expect(r.pack).toHaveLength(0);
    expect(r.pieces).toBe(SWORD.PACK);
    for (let i = 0; i < SWORD.PACK; i++) r.take(pair());
    r.unload();
    expect(r.queue).toHaveLength(SWORD.PACK * 2);
    expect(SWORD.STORE).toBeGreaterThan(SWORD.PACK * 2);
    // Full shelves leave the rest on your back.
    const full = stocked(SWORD.STORE);
    full.take(pair());
    expect(full.unload()).toBe(0);
    expect(full.pack).toHaveLength(1);
  });

  it('brings in the next pair, which falls a row every 0.6 seconds', () => {
    const r = new SwordRack();
    r.take(pair()); r.unload();
    expect(r.tick(0.01).changed).toBe(true);
    const row = r.board.falling!.r;
    r.tick(0.5);
    expect(r.board.falling!.r).toBe(row);
    r.tick(0.11);
    expect(r.board.falling!.r).toBe(row - 1);
  });

  it('Space drops it straight down, and says what broke', () => {
    const r = new SwordRack();
    r.board.grid[0][3] = { c: 0 };
    r.take([{ c: 0, breaker: true }, { c: 2, breaker: false }]); r.unload();
    r.tick(0.01);
    const res = r.drop()!;
    expect(res.links[0].broken).toBe(2);
    expect(r.pieces).toBe(0);
  });

  it('a full fourth column loses the fight: the board clears, the shelves keep their crates', () => {
    const r = stocked(2);
    for (let row = 0; row < 12; row++) r.board.grid[row][3] = { c: (row % 2) as 0 };
    expect(r.tick(0.01).lost).toBe(true);
    expect(r.pieces).toBe(2);
    expect(r.board.grid.flat().some(Boolean)).toBe(false);
  });

  it('a raider getting in buries the board in sprinkles', () => {
    const r = new SwordRack(() => 0.2);
    expect(r.hitBy(2)).toBe(2);
    expect(r.board.grid.flat().filter((g) => g?.grey)).toHaveLength(2);
  });
});

describe('Barracks', () => {
  it('only a handful of soldiers at the start, "but can be upgraded" (9 Nov)', () => {
    const b = new Barracks();
    expect(SWORD.START_SOLDIERS).toBe(5);
    expect(b.enlist(Array(14).fill({ hp: 2, size: 1 }), 0, 5)).toHaveLength(5);
    expect(b.enlist([{ hp: 2, size: 1 }], 0, 5)).toHaveLength(0);
    b.cap = 8;
    expect(b.enlist(Array(5).fill({ hp: 2, size: 1 }), 0, 5)).toHaveLength(3);
  });

  it('a soldier runs a raider down in the den and knocks them flat (8 Nov)', () => {
    const b = new Barracks();
    b.enlist([{ hp: 2, size: 1 }], -6, 5.5);
    const r = raider(0, 3);
    expect(fight(b, [r], 5)).toEqual([r]);
    expect(b.soldiers[0].hp).toBeGreaterThan(0);   // one on one, a soldier wins
  });

  it('two raiders on one plain soldier beat it', () => {
    const b = new Barracks();
    b.enlist([{ hp: 2, size: 1 }], 0, 3);
    const a = raider(0, 3.3), c = raider(0.3, 3.3);
    // Both fight it: the second one too, once the first is down.
    fight(b, [a, c], 6);
    expect(b.soldiers[0].state).toBe('down');
  });

  it('with nobody to fight they stand guard in the gap, and a raider coming through stops to fight (8 Nov)', () => {
    const b = new Barracks();
    b.enlist([{ hp: 4, size: 1.2 }], -6, 5.5);
    const gap = { x: -9, z: 0.95 };
    fight(b, [], 5, [gap]);
    expect(Math.hypot(b.soldiers[0].x - gap.x, b.soldiers[0].z - gap.z)).toBeLessThan(0.2);
    const r = raider(-9, 0.3, 'climb', false);
    b.tick(0.05, [r], [gap], { x: 0, z: 5 });
    expect(r.duel).toBe(b.soldiers[0]);
    expect(b.duel(r, 0.05).fighting).toBe(true);
  });

  it('spread out over several raiders rather than all on one', () => {
    const b = new Barracks();
    b.enlist(Array(4).fill({ hp: 2, size: 1 }), 0, 5);
    const foes = [raider(-2, 3), raider(2, 3)];
    b.tick(0.05, foes, [], { x: 0, z: 5 });
    const on = foes.map((r) => b.soldiers.filter((s) => s.foe === r).length);
    expect(on).toEqual([2, 2]);
  });

  it('don\'t go out over the wall after raiders outside', () => {
    const b = new Barracks();
    b.enlist([{ hp: 2, size: 1 }], 0, 3);
    b.tick(0.05, [raider(0, -3, 'attack', false)], [], { x: 0, z: 5 });
    expect(b.soldiers[0].foe).toBeNull();
  });

  it('fallen soldiers are taken off the field after a moment', () => {
    const b = new Barracks();
    const [s] = b.enlist([{ hp: 1, size: 1 }], 0, 3);
    const r = raider(0, 3.2);
    r.duel = s; r.hitT = 0;
    b.duel(r, 0.01);
    expect(s.state).toBe('down');
    b.tick(1, [], [], { x: 0, z: 5 });
    expect(b.sweep(0.5)).toEqual([s]);
    expect(b.soldiers).toEqual([]);
  });
});

describe('Waiting soldiers block the Swordfight board (9 Nov)', () => {
  // The den's hoist: the stack's foot at x -6.775, z 3.2, 2.7 m wide; you stand at the winch on its
  // +z side, and the camera looks straight on at it from +x.
  const hoist = { x: -6.775, z: 3.2, w: 2.7 };

  it('with nobody to fight or guard, they wait off to the side, clear of the stack and of you at the winch', () => {
    const b = new Barracks();
    b.enlist(Array(b.cap).fill({ hp: 2, size: 1.5 }), hoist.x + 0.9, hoist.z);
    for (let t = 0; t < 30; t += 0.05) b.tick(0.05, [], [], waitSpot(hoist));
    for (const s of b.soldiers) {
      expect(s.moving).toBe(false);
      // Past the stack's side and the winch, with room for the biggest soldier (and you).
      expect(s.z - hoist.z).toBeGreaterThan(hoist.w / 2 + 1.2);
    }
  });

  it('the spot moves with the hoist', () => {
    const a = waitSpot(hoist), b = waitSpot({ ...hoist, x: hoist.x + 1, z: hoist.z - 2 });
    expect(b.x - a.x).toBeCloseTo(1);
    expect(b.z - a.z).toBeCloseTo(-2);
  });
});
