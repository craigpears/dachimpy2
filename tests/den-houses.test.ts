/* The housing district (11 Nov: "you have like the areas of houses and you have the enter a house stuff and
   you can choose whose house to go into ... a nice way of adding other friends in later"). */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSES, houseById, houseList, LODGINGS, atLodgings, walkable, step, roomAt, atWayOut, PAD, cleanSittings, sat, SITTINGS_KEY, plaqueDate, snapshotName, YOUR_PACE, ALONGSIDE, alongside, hostTarget, skipTo, skipSecs } from '../src/den-houses';
import type { Plan } from '../src/den-houses';

const ROOT = join(__dirname, '..');
const BOX: Plan = {
  rooms: [{ id: 'a', name: 'A', x0: 0, x1: 4, z0: 0, z1: 4 }, { id: 'b', name: 'B', x0: 4, x1: 8, z0: 0, z1: 4 }],
  doors: [{ x0: 3.5, x1: 4.5, z0: 1.5, z1: 2.5 }],
  out: { x: 2, z: 3.6, r: 0.8 },
};

describe('the district lists its houses by owner, as Puzzle Pirates did', () => {
  it("has Gravee's manor, Bedside Manors, by its real name", () => {
    expect(houseById('gravee')).toMatchObject({ owner: 'Gravee', name: 'Bedside Manors', kind: 'Manor' });
    expect(houseById('nobody')).toBeNull();
  });

  it('lists them by owner, each id once', () => {
    const L = houseList();
    expect(L.map((h) => h.owner)).toEqual([...L.map((h) => h.owner)].sort((a, b) => a.localeCompare(b)));
    expect(new Set(HOUSES.map((h) => h.id)).size).toBe(HOUSES.length);
  });

  it('gives every house a scene module of its own (adding a friend is an entry and a scene)', () => {
    const shell = readFileSync(join(ROOT, 'js', 'den', 'house.js'), 'utf8');
    for (const h of HOUSES) {
      expect(shell, `house.js's SCENES has ${h.id}`).toMatch(new RegExp(`\\b${h.id}:`));
    }
    expect(readdirSync(join(ROOT, 'js', 'den'))).toContain('gravee-house.js');
  });
});

describe("the district's door, dug into the den's left-hand cliff", () => {
  it('is on the den floor, clear of the shack plot (back left) and the rampart frames (right)', () => {
    expect(LODGINGS.x).toBeLessThan(-7);   // the left-hand side
    expect(LODGINGS.z).toBeGreaterThan(6.9); expect(LODGINGS.z).toBeLessThan(10.5);   // between the hoist's torch and the plot
  });
  it('is knocked at from in front of it, not from across the den', () => {
    expect(atLodgings(LODGINGS.x + 1, LODGINGS.z)).toBe(true);
    expect(atLodgings(0, 8)).toBe(false);
    expect(atLodgings(LODGINGS.x + 1, LODGINGS.z + 3)).toBe(false);
  });
});

describe('walking about a house', () => {
  it('keeps you off the walls, and lets you through a doorway', () => {
    expect(walkable(BOX, 2, 2)).toBe(true);
    expect(walkable(BOX, 0.1, 2)).toBe(false);
    expect(walkable(BOX, 4, 2)).toBe(true);    // in the doorway
    expect(walkable(BOX, 4, 0.6)).toBe(false); // in the wall beside it
    expect(roomAt(BOX, 6, 2)?.id).toBe('b');
  });

  it('slides you along a wall instead of stopping you dead', () => {
    const [x, z] = step(BOX, 2, 2, 2.2, -1);
    expect(x).toBeCloseTo(2.2); expect(z).toBe(2);
  });

  it('walks you round furniture', () => {
    const [x, z] = step(BOX, 1.5, 2, 2, 2, [{ x: 2.2, z: 2, r: 0.4 }]);
    expect(Math.hypot(x - 2.2, z - 2)).toBeGreaterThanOrEqual(0.4 + PAD - 1e-9);
  });

  it('lets you out at the front door', () => {
    expect(atWayOut(BOX, 2, 3.4)).toBe(true);
    expect(atWayOut(BOX, 2, 1)).toBe(false);
  });
});

describe('whoever shows you round walks with you', () => {
  /** You walk along x at your pace for `secs`, then stop; they follow as the shell walks them. The
      furthest they got from you while you walked, and where they are a while after you stop. */
  function stroll(secs: number, start = { x: -1.5, z: 0 }) {
    const you = { x: 0, z: 0 }, host = { ...start }, dt = 1 / 60;
    let walking = false, worst = 0;
    for (let t = 0; t < secs + 3; t += dt) {
      if (t < secs) you.x += YOUR_PACE * dt;
      const to = hostTarget(host, you, null, walking);
      walking = !!to;
      if (to) {
        const dx = to.x - host.x, dz = to.z - host.z, d = Math.hypot(dx, dz), s = Math.min(d, to.speed * dt);
        if (d > 1e-9) { host.x += dx / d * s; host.z += dz / d * s; }
      }
      if (t < secs) worst = Math.max(worst, Math.hypot(host.x - you.x, host.z - you.z));
    }
    return { worst, end: Math.hypot(host.x - you.x, host.z - you.z) };
  }

  it("Gravee walks with you, not slowly behind (11 Nov: 'she comes eventually. She was very slow to, though')", () => {
    const { worst, end } = stroll(6);
    expect(worst).toBeLessThan(ALONGSIDE.near + 0.3);   // at your side the whole way, not left behind
    expect(end).toBeLessThan(ALONGSIDE.near);
    expect(end).toBeGreaterThan(0.8);                     // (beside you, not on top of you)
  });

  it('hurries to catch up when you have got ahead of them', () => {
    expect(alongside({ x: 0, z: 0 }, { x: 6, z: 0 })!.speed).toBeGreaterThan(YOUR_PACE);
    expect(alongside({ x: 0, z: 0 }, { x: 2.5, z: 0 })!.speed).toBe(YOUR_PACE);
    expect(stroll(0.01, { x: -9, z: 0 }).end).toBeLessThan(ALONGSIDE.near);
  });

  it("doesn't stop and start at your heels", () => {
    // Once on their way they keep on till they're back beside you; stood, they wait till you're a step off.
    expect(alongside({ x: 0, z: 0 }, { x: 1.7, z: 0 }, true)).not.toBeNull();
    expect(alongside({ x: 0, z: 0 }, { x: 1.7, z: 0 }, false)).toBeNull();
  });

  it('stands by what they are showing you while you are there, and comes along when you walk on', () => {
    const spot = { at: { x: 5, z: 0 }, near: 1.5, stand: { x: 6, z: -1 } };
    expect(hostTarget({ x: 4, z: 0 }, { x: 5.2, z: 0 }, spot)).toMatchObject({ x: 6, z: -1 });
    expect(hostTarget({ x: 6, z: -1 }, { x: 5.2, z: 0 }, spot)).toBeNull();
    expect(hostTarget({ x: 6, z: -1 }, { x: 12, z: 0 }, spot)).toMatchObject({ speed: ALONGSIDE.hurry });
  });
});

describe("a long stretch you can skip along (11 Nov: 'you can zoom by as a skip. I don't think it should do that by default, though')", () => {
  const S = { room: 'b', a: 4.5, b: 7.5 };
  const LONG: Plan = { rooms: [{ id: 'a', name: 'A', x0: 0, x1: 4, z0: 0, z1: 4 }, { id: 'b', name: 'B', x0: 4, x1: 40, z0: 0, z1: 4 }], doors: BOX.doors, out: BOX.out };
  const L = { ...S, b: 38 };
  it('takes you to its end the way you face, or back the other way from the far end', () => {
    expect(skipTo(LONG, L, 6, 2, 1)).toBe(38);
    expect(skipTo(LONG, L, 30, 2, -1)).toBe(4.5);
    expect(skipTo(LONG, L, 37, 2, 1)).toBe(4.5);
    expect(skipTo(LONG, L, 2, 2, 1)).toBeNull();   // (not in its room)
  });
  it('offers nothing in a stretch too short to skip', () => expect(skipTo(BOX, S, 6, 2, 1)).toBeNull());
  it('goes slowly enough the first time to see it go on and on, quicker after, never a chore', () => {
    expect(50 / skipSecs(50, 0)).toBeLessThan(8);   // metres a second
    expect(skipSecs(50, 1)).toBeLessThan(skipSecs(50, 0));
    expect(skipSecs(50, 1)).toBeLessThan(6);
  });
});

describe('your portrait on a friend\'s wall, kept in this browser (RULES.md, "Except what people make their own")', () => {
  it('is kept under a carp.den key', () => expect(SITTINGS_KEY).toMatch(/^carp\.den\./));

  it('keeps your look as it was when you sat, and the day', () => {
    const look = { body: 'f', hat: 'pelt', skin: 3 };
    const s = sat({}, 'gravee', look, new Date(2026, 10, 11));
    expect(s.gravee).toEqual({ look, at: '2026-11-11' });
    look.hat = 'none';
    expect(s.gravee.look.hat).toBe('pelt');   // (frozen as you were)
    expect(plaqueDate(s.gravee.at)).toBe('11 Nov 2026');
  });

  it('survives a round trip through storage, and throws away anything odd', () => {
    const s = sat({}, 'gravee', { body: 'm', hat: 'tricorne' }, new Date(2026, 0, 2));
    expect(cleanSittings(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(cleanSittings(null)).toEqual({});
    expect(cleanSittings('x')).toEqual({});
    expect(cleanSittings({ nobody: s.gravee })).toEqual({});
    expect(cleanSittings({ gravee: { look: [1], at: '2026-01-02' } })).toEqual({});
    expect(cleanSittings({ gravee: { look: { a: 1 }, at: 'yesterday' } })).toEqual({});
    expect(cleanSittings({ gravee: { look: { a: 1, b: { evil: true } }, at: '2026-01-02' } }).gravee.look).toEqual({ a: 1 });
  });

  it('names a snapshot plainly', () => {
    expect(snapshotName("Cap'n Jo", 'Bedside Manors')).toBe('cap-n-jo-in-bedside-manors.png');
    expect(snapshotName('!!', '')).toBe('in.png');
  });
});
