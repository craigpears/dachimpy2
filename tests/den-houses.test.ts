/* The housing district (11 Nov: "you have like the areas of houses and you have the enter a house stuff and
   you can choose whose house to go into ... a nice way of adding other friends in later"). */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSES, houseById, houseList, LODGINGS, atLodgings, walkable, step, roomAt, atWayOut, PAD, cleanSittings, sat, SITTINGS_KEY, plaqueDate, snapshotName, YOUR_PACE, ALONGSIDE, alongside, hostTarget, skipTo, skipSecs, LOOK, LOOK_HOME, WALL_BACK, lookTurn, lookZoom, lookWheel, lookEase, lookHome, lookView, viewAt, yawLimit, isDrag, walkDir, lookingAt, remark, REMARK, GAZE_START } from '../src/den-houses';
import type { Plan, Look, View, Room, Exhibit, Gaze } from '../src/den-houses';
import { PLAN as GRAVEE, galleryHang, portraitLine, allPortraits, YETIS } from '../src/den-gravee';

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

describe('looking round a house freely (11 Nov: "I should be able to move the camera freely, zoom in, look around")', () => {
  // The house's own view of you, as house.js's home() has it on a wide screen: a little ahead of you,
  // well back, from above the front.
  const home = (you: { x: number; z: number }): View => ({ look: { x: you.x, y: 0.85, z: you.z - 1.2 }, dist: 9, tilt: 0.7, yaw: 0 });
  const gallery = GRAVEE.rooms.find((r) => r.id === 'gallery')!;
  const inAll = (L: Look, n: number, f: (L: Look) => Look): Look => { for (let i = 0; i < n; i++) L = f(L); return L; };
  /** Is the camera clear of the room's full-height walls (or up over them)? */
  const clear = (room: Room, p: { x: number; y: number; z: number }): boolean => {
    const zm = room.z0 + (room.z1 - room.z0) * WALL_BACK;
    return p.y >= 3.2 || (p.y > 0.15 && p.z >= room.z0 + 0.2 && (p.z >= zm || (p.x >= room.x0 + 0.2 && p.x <= room.x1 - 0.2)));
  };

  it('standing by the portraits you can look round and zoom in (11 Nov)', () => {
    const at = galleryHang()[3], you = { x: at.x, z: gallery.z0 + 0.9 };
    let L = inAll({ ...LOOK_HOME }, 40, (l) => lookWheel(l, -100));   // (the wheel, rolled in all the way)
    L = lookTurn(L, 30, -20);   // (and a little drag round)
    // Stood there looking, it stays as you left it.
    const kept = inAll(L, 600, (l) => lookEase(l, 1 / 60, 0));
    expect(kept).toMatchObject({ yaw: L.yaw, pitch: L.pitch, zoom: L.zoom });
    const v = lookView(home(you), you, kept, gallery), cam = viewAt(v);
    // Close to the picture on the wall, near level with it, looking at the wall and clear of it.
    expect(Math.hypot(cam.x - at.x, cam.y - 1.62, cam.z - gallery.z0)).toBeLessThan(2.2);
    expect(v.tilt).toBeLessThan(0.4);
    expect(v.look.z).toBeLessThan(cam.z);
    expect(clear(gallery, cam)).toBe(true);
    // The house's own view is a long way back by comparison.
    const far = viewAt(lookView(home(you), you, LOOK_HOME, gallery));
    expect(Math.hypot(far.x - at.x, far.y - 1.62, far.z - gallery.z0)).toBeGreaterThan(7);
  });

  it("leaves the house's own view as it is until you turn or zoom", () => {
    const you = { x: 10, z: 0 }, b = home(you);
    expect(lookView(b, you, LOOK_HOME, gallery)).toEqual(b);
    expect(lookHome(LOOK_HOME)).toBe(true);
  });

  it('turns as the den\'s camera does, a little either way zoomed out, along the walls zoomed in, never out of the open front', () => {
    expect(lookTurn(LOOK_HOME, -100, 0).yaw).toBeCloseTo(100 * LOOK.turn);
    expect(lookTurn(LOOK_HOME, 0, 50).pitch).toBeCloseTo(50 * LOOK.tip);
    expect(Math.abs(lookTurn(LOOK_HOME, 5000, 0).yaw)).toBeCloseTo(LOOK.yawFar);   // (the doll's house, from the front still)
    expect(Math.abs(lookTurn(LOOK_HOME, 0, 5000).pitch)).toBeCloseTo(LOOK.pitch);
    const close = inAll(LOOK_HOME, 40, (l) => lookWheel(l, -100));
    expect(Math.abs(lookTurn(close, 5000, 0).yaw)).toBeCloseTo(LOOK.yawNear);
    expect(LOOK.yawNear).toBeGreaterThan(Math.PI / 2); expect(LOOK.yawNear).toBeLessThan(Math.PI * 0.7);
    // Zooming back out turns it back within what that allows.
    expect(Math.abs(inAll(lookTurn(close, 5000, 0), 40, (l) => lookWheel(l, 100)).yaw)).toBeLessThanOrEqual(LOOK.yawFar + 1e-9);
  });

  it('zooms within its range, never nearer than it should', () => {
    expect(inAll(LOOK_HOME, 100, (l) => lookWheel(l, -100)).zoom).toBe(LOOK.zoom[0]);
    expect(inAll(LOOK_HOME, 100, (l) => lookWheel(l, 100)).zoom).toBe(LOOK.zoom[1]);
    expect(lookWheel(LOOK_HOME, -1).zoom).toBeLessThan(1);   // (rolling forward zooms in)
    const you = { x: 10, z: 0 }, v = lookView(home(you), you, { ...LOOK_HOME, zoom: LOOK.zoom[0] }, gallery);
    expect(v.dist).toBeGreaterThanOrEqual(LOOK.close - 1e-9);
  });

  it('never puts the camera through a wall, whichever way it turns and however far in', () => {
    for (const room of GRAVEE.rooms) {
      for (const you of [{ x: room.x0 + 0.4, z: room.z0 + 0.4 }, { x: room.x1 - 0.4, z: room.z0 + 0.4 }, { x: (room.x0 + room.x1) / 2, z: 0 }, { x: room.x0 + 0.4, z: room.z1 - 0.4 }]) {
        for (let yaw = -Math.PI; yaw <= Math.PI; yaw += 0.2) {
          for (const zoom of [0.1, 0.2, 0.35, 0.6, 1, 1.3]) {
            for (const pitch of [-LOOK.pitch, 0, LOOK.pitch]) {
              const L = lookTurn(lookZoom(LOOK_HOME, zoom), 0, 0), lim = yawLimit(zoom);
              const v = lookView(home(you), you, { ...L, yaw: Math.max(-lim, Math.min(lim, yaw)), pitch }, room);
              expect(clear(room, viewAt(v)), `${room.id} at ${you.x},${you.z} yaw ${yaw.toFixed(1)} zoom ${zoom} pitch ${pitch}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('eases back to the house\'s view once you walk on, not while you stand', () => {
    const L = lookTurn(lookZoom(LOOK_HOME, 0.3), 80, 40);
    // A step or two to get a better look doesn't lose it.
    const stepped = lookEase(L, 0.1, 0.5);
    expect(stepped).toMatchObject({ yaw: L.yaw, pitch: L.pitch, zoom: L.zoom });
    // Walking on, it comes back, within a couple of seconds.
    let W = stepped;
    for (let t = 0; t < 3; t += 1 / 60) W = lookEase(W, 1 / 60, YOUR_PACE / 60);
    expect(lookHome(W)).toBe(true);
    // Halfway through, it's on its way: no snap.
    let H = lookEase(stepped, 0.1, 1);
    H = lookEase(H, 0.1, 0.4);
    expect(Math.abs(H.yaw)).toBeGreaterThan(0); expect(Math.abs(H.yaw)).toBeLessThan(Math.abs(L.yaw));
  });

  it('tells a click from a drag, so a click still walks you or lifts the lid', () => {
    expect(isDrag(2, 2)).toBe(false);
    expect(isDrag(LOOK.drag, 0)).toBe(true);
    expect(isDrag(7, 0, true)).toBe(false);   // (a finger wobbles more)
    expect(isDrag(LOOK.dragTouch, 0, true)).toBe(true);
  });

  it('walks you the way the camera faces as you set off', () => {
    expect(walkDir(0, -1, 0)).toEqual([0, -1]);   // up: away from you, into the house
    const [x, z] = walkDir(0, -1, Math.PI / 2);   // turned to look along -x: up walks that way
    expect(x).toBeCloseTo(-1); expect(z).toBeCloseTo(0);
    const [rx, rz] = walkDir(1, 0, Math.PI / 2);
    expect(rx).toBeCloseTo(0); expect(rz).toBeCloseTo(-1);
    expect(Math.hypot(...walkDir(1, 1, 0.3))).toBeCloseTo(1);
  });
});

describe('your host talks about what you\'re looking at (11 Nov: "like she talks about the portrait you are looking at")', () => {
  const gallery = GRAVEE.rooms.find((r) => r.id === 'gallery')!;
  const hung = galleryHang();
  const exhibits: Exhibit[] = hung.map((p) => ({ id: p.id, x: p.x, y: 1.62, z: gallery.z0 + 0.2 }));
  const home = (you: { x: number; z: number }): View => ({ look: { x: you.x, y: 0.85, z: you.z - 1.2 }, dist: 9, tilt: 0.7, yaw: 0 });
  /** The camera's place and the way it looks, for a view. */
  const pose = (v: View) => { const cam = viewAt(v); return { cam, dir: { x: v.look.x - cam.x, y: v.look.y - cam.y, z: v.look.z - cam.z } }; };
  const stand = (G: Gaze, seen: string | null, secs: number, quiet = true, still = true) => {
    const said: string[] = [];
    for (let t = 0; t < secs; t += 0.1) { const r = remark(G, seen, 0.1, still, quiet, portraitLine); G = r.gaze; if (r.say) said.push(r.say); }
    return { G, said };
  };

  it("she talks about the portrait you're looking at (11 Nov)", () => {
    // Stopped by Dalnoth's, in the house's own view: it's his she talks about, his own line.
    const dal = hung.find((p) => p.id === 'dalnoth')!, you = { x: dal.x, z: gallery.z0 + 1.1 };
    const { cam, dir } = pose(lookView(home(you), you, LOOK_HOME, gallery));
    expect(lookingAt(exhibits, you, cam, dir)?.id).toBe('dalnoth');
    const { G, said } = stand(GAZE_START, 'dalnoth', 3);
    expect(said).toEqual([portraitLine('dalnoth')]);
    expect(said[0]).toMatch(/Dalnoth/);
    // Turn the camera onto the next one along, zoomed in, and it's that one.
    const next = hung[hung.indexOf(dal) + 1];
    const L = { ...lookZoom(LOOK_HOME, 0.15), yaw: 0 }, you2 = { x: next.x, z: gallery.z0 + 0.9 };
    const p2 = pose(lookView(home(you2), you2, L, gallery));
    expect(lookingAt(exhibits, you2, p2.cam, p2.dir)?.id).toBe(next.id);
    // Not every time you pass it: once a visit.
    expect(stand(stand(G, null, 1).G, 'dalnoth', 5).said).toEqual([]);
  });

  it('waits till you stop and look, and never talks over anything else', () => {
    expect(stand(GAZE_START, 'busy', 3, true, false).said).toEqual([]);   // (walking past)
    expect(stand(GAZE_START, 'busy', REMARK.dwell * 0.6).said).toEqual([]);   // (a glance)
    const busy = stand(GAZE_START, 'busy', 3, false);   // (someone's talking)
    expect(busy.said).toEqual([]);
    expect(stand(busy.G, 'busy', 3).said).toHaveLength(1);   // (then, once it's quiet)
  });

  it('is nothing far off, or off to the side of the view', () => {
    const you = { x: hung[10].x, z: 0 };
    expect(lookingAt(exhibits, you, { x: you.x, y: 1.6, z: 3 }, { x: 0, y: 0, z: 1 })).toBeNull();   // (looking away)
    expect(lookingAt(exhibits, { x: hung[30].x, z: 0 }, { x: hung[10].x, y: 1.6, z: 3 }, { x: 0, y: 0, z: -1 })).toBeNull();   // (you're nowhere near it)
  });

  it('has a line of hers for every portrait she has up, the yetis by name, neighbours never the same', () => {
    const all = allPortraits(true);
    for (const p of all) expect(portraitLine(p.id), p.id).toBeTruthy();
    const proofs = all.filter((p) => p.id.startsWith('proof-'));
    expect(proofs.length).toBeGreaterThan(20);
    YETIS.forEach((name, i) => { expect(portraitLine(`proof-${i}`)).toContain(name); expect(portraitLine(`proof-${i}`)).not.toContain('{yeti}'); });
    for (let i = 1; i < YETIS.length; i++) expect(portraitLine(`proof-${i}`)!.replace(YETIS[i], '')).not.toBe(portraitLine(`proof-${i - 1}`)!.replace(YETIS[i - 1], ''));
    expect(portraitLine('nobody')).toBeNull();
    for (const p of all) expect(portraitLine(p.id)!.length, p.id).toBeLessThan(110);   // (short: a bubble)
  });
});
