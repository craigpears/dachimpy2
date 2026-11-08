/* Swordfight in the den: the sword rack and the soldiers (src/den-sword.ts). */
import { describe, expect, it } from 'vitest';
import { BARRICADE, Barracks, muster, rewardPair, shareCrates, SWORD, SwordRack } from '../src/den-sword';
import type { Breach, Foe } from '../src/den-sword';
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
  const link = (chain: number, ...strikes: ReturnType<typeof toSword>[]) => ({ chain, broken: 0, sprinkles: 0, strikes });

  // The user, after the demo (8 Nov): "you'd have to do a combo, like a fuse block to get a soldier,
  // and obviously combo for multiples".
  it('loose pieces arm nobody: only a fused block makes a soldier (8 Nov)', () => {
    expect(muster({ links: [{ chain: 1, broken: 6, sprinkles: 3, strikes: [] }], sprinkles: 3, strikes: [] })).toEqual([]);
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

describe('shareCrates', () => {
  const breach = (o: Partial<Breach> = {}): Breach => ({ open: false, attackers: 0, strength: 1, crates: 0, ...o });

  // The user (8 Nov): sprinkles should "build an extra barrier ... on this side of the wall", like
  // the rubble in a fresh breach.
  it('crates go to the gap raiders can walk through (8 Nov)', () => {
    expect(shareCrates([breach({ attackers: 1, strength: 0.4 }), breach({ open: true })], 2)).toEqual([0, 2]);
  });

  it('then to the hole being hacked hardest, then the weakest', () => {
    expect(shareCrates([breach({ attackers: 1 }), breach({ attackers: 3 })], 1)).toEqual([0, 1]);
    expect(shareCrates([breach({ strength: 0.9 }), breach({ strength: 0.2 })], 1)).toEqual([0, 1]);
  });

  it('a big break spreads over several breaches rather than piling all on one', () => {
    const got = shareCrates([breach({ open: true }), breach({ open: true })], 6);
    expect(got).toEqual([3, 3]);
  });

  it('a breach takes six crates at most; the rest are lost', () => {
    expect(shareCrates([breach({ open: true, crates: 4 })], 5)).toEqual([BARRICADE.MAX - 4]);
    expect(shareCrates([], 3)).toEqual([]);
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
  it('a reward jumps the queue, so it comes down next, unless your hands are full', () => {
    const r = new SwordRack();
    r.take(pair(0, 1)); r.take(pair(2, 3));
    const prize = rewardPair(() => 0.5);
    expect(r.give(prize)).toBe(true);
    expect(r.queue[0]).toBe(prize);
    while (r.take(pair())) { /* fill up */ }
    expect(r.give(rewardPair())).toBe(false);
  });

  it('holds the sword pieces you pick up, up to eight', () => {
    const r = new SwordRack();
    for (let i = 0; i < 10; i++) r.take(pair());
    expect(r.pieces).toBe(SWORD.QUEUE);
    expect(r.take(pair())).toBe(false);
  });

  it('brings in the next pair, which falls a row every 0.6 seconds', () => {
    const r = new SwordRack();
    r.take(pair());
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
    r.take([{ c: 0, breaker: true }, { c: 2, breaker: false }]);
    r.tick(0.01);
    const res = r.drop()!;
    expect(res.links[0].broken).toBe(2);
    expect(r.pieces).toBe(0);
  });

  it('a full fourth column loses the fight: the board and the pieces clear', () => {
    const r = new SwordRack();
    for (let row = 0; row < 12; row++) r.board.grid[row][3] = { c: (row % 2) as 0 };
    r.take(pair()); r.take(pair());
    expect(r.tick(0.01).lost).toBe(true);
    expect(r.pieces).toBe(0);
    expect(r.board.grid.flat().some(Boolean)).toBe(false);
  });

  it('a raider getting in buries the board in sprinkles', () => {
    const r = new SwordRack(() => 0.2);
    expect(r.hitBy(2)).toBe(2);
    expect(r.board.grid.flat().filter((g) => g?.grey)).toHaveLength(2);
  });
});

describe('Barracks', () => {
  it('never more than ten soldiers', () => {
    const b = new Barracks();
    expect(b.enlist(Array(14).fill({ hp: 2, size: 1 }), 0, 5)).toHaveLength(SWORD.MAX_SOLDIERS);
    expect(b.enlist([{ hp: 2, size: 1 }], 0, 5)).toHaveLength(0);
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
