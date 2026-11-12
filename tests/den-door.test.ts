/* The starlit door, on the sloop race's course (src/den-door.ts; its squares LAY.RACE.DOOR). The user,
   11 Nov: "use duty navigation as the puzzle for how you find the door and have it discoverable in some
   way similar to the carpentry spots", and of the tunnel behind it: "a really long, straight passage. But
   it requires some like more hardcore puzzling ... you've got to do like big Vegas, like a big Vegas to
   get through it in sailing". Back to simple, 12 Nov: "nav only shortcut that takes you just like one step
   through ... I could just imagine someone good at doing Vegas, it takes you out of the race." */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { DOOR, Door, offDoor, doorColumn, exitPose, through } from '../src/den-door';
import { RACE, Race, stretchAt } from '../src/den-race';
import { gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { Navigation, needsCombo, COLOURS, type Done } from '../src/navigation';
import { seeded } from '../src/mirror-row';
import { WAYS } from './race-helpers';

const RC = LAY.RACE, D = RC.DOOR, sea = new Sea(9), k = (c: number, r: number) => `${c},${r}`;
const DT = 0.05, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const MOUTH: Pose = { c: D.OFF[0][0], r: D.OFF[0][1], d: 0 };

/** Sail her (under sail, by the pilot) from `from` to `to`: the seconds it takes, and where she ends. */
function sailTo(s: Sea, from: Pose, to: [number, number]): { t: number; at: Pose } {
  const h = new Helm(s, from);
  h.drop(...to);
  let t = 0;
  while ((h.pin || h.slot >= 0) && t < 900) { h.tick(DT); t += DT; }
  return { t, at: { ...h.pose } };
}
/** The sea with these squares shut (a shortcut's way through), to sail round it the long way. */
function shut(...sq: [number, number][]): Sea { const s = new Sea(9); for (const [c, r] of sq) s.rocks.add(k(c, r)); return s; }
const done = (marks: Done['marks'], booched = false) => ({ marks, booched }) as Done;

describe('where the door is: in the cliff off leg 2; its tunnel one stretch under the spit, up a cleft onto leg 3 (back to simple, 12 Nov)', () => {
  it('its face is the second spit\'s cliff, the water off it leg 2; its one exit a cleft in the spit\'s far face, the water off it leg 3', () => {
    for (const [c, r] of D.FACE) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of D.OFF) { expect(offDoor(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(DOOR.FROM); }
    expect(DOOR.FROM).toBe(1);
    expect(D.EXITS).toHaveLength(1);
    expect(DOOR.EXITS.map((e) => e.to)).toEqual([2]);
    expect(DOOR.TO).toBe(2);
    const e = D.EXITS[0];
    for (const [c, r] of e.OUT) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of e.INTO) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(2); expect(sea.windAt(c, r)).toBeUndefined(); }
    D.FACE.forEach(([c], i) => { expect(e.OUT[i][0]).toBe(c); expect(exitPose(i)).toEqual({ c, r: e.INTO[i][1], d: 0 }); });
    expect(DOOR.LEN).toBe(e.INTO[0][1] - D.FACE[0][1] + 1);
  });
});

describe('the door is the only way into the tunnel (11 Nov)', () => {
  it('the cliff\'s face stops every move and gust, open or shut: the tunnel is no square of the sea', () => {
    for (const [c, r] of D.FACE) expect(sea.open(c, r)).toBe(false);
    expect(gustPath(sea, MOUTH, runFor(RUN.VEGAS))).toEqual([]);
    expect(sea.sail(MOUTH, 'F').to).toEqual(MOUTH);
  });
});

describe('a Navigation-only shortcut, one stretch through (12 Nov: "nav only shortcut that takes you just like one step through")', () => {
  it('opened, the door carries her straight through from off it, either column, up its cleft onto leg 3: no Sailing to get in, nothing to choose under the cleft', () => {
    for (const i of [0, 1]) {
      const off: Pose = { c: D.OFF[i][0], r: D.OFF[i][1], d: 3 };
      expect(doorColumn(off)).toBe(i);
      expect(through(doorColumn(off))).toEqual({ exit: 0, went: DOOR.LEN, to: exitPose(i) });
      // (on open water on leg 3, free to sail on)
      const o = exitPose(i);
      expect(sea.open(o.c, o.r)).toBe(true);
      expect(new Helm(sea, o).put('R')).toBe(true);
    }
    expect(doorColumn({ c: 3, r: D.OFF[0][1] })).toBe(-1);
    expect('NEED' in DOOR).toBe(false);
  });

  it('the race counts leg 3 reached, passed under, and home from there', () => {
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    race.tick(1, { c: 10, r: RC.STRETCHES[1].r });
    expect(race.under(DOOR.FROM, DOOR.TO)).toEqual([{ kind: 'leg', n: 2 }]);
    expect(race.tick(1, exitPose(0))).toEqual([]);
    for (let n = 3; n < 6; n++) expect(race.tick(1, { c: 10, r: RC.STRETCHES[n].r })).toEqual([{ kind: 'leg', n }]);
    expect(race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] })[0]).toMatchObject({ kind: 'finish' });
    expect(new Race().under(DOOR.FROM, DOOR.TO)).toEqual([]);
  });
});
describe('the door\'s saving (11 Nov; one stretch since 12 Nov)', () => {
  // The long way, off the door to where its exit puts her: round the second spit's end and along leg 3 to
  // under its cleft (its first row there's only come to from the leg's own start: the second row beside it is
  // as far along), every shortcut shut.
  it(`coming up its cleft saves about ${DOOR.SAVES} seconds of sailing, less than the Vegas over the whirlpools`, () => {
    const s = shut(...WAYS);
    const h = new Helm(s, { c: D.OFF[0][0], r: D.OFF[0][1], d: 3 });
    const go = (p: [number, number]) => { h.drop(...p); let t = 0; while ((h.pin || h.slot >= 0) && t < 900) { h.tick(DT); t += DT; } return t; };
    const E = D.EXITS[0];
    const secs = go([3, RC.SPITS[1].r1]) + go([E.INTO[0][0], E.INTO[0][1] + 1]);
    expect([h.pose.c, h.pose.r]).toEqual([E.INTO[0][0], E.INTO[0][1] + 1]);
    const saves = secs - DOOR.TRIP;
    expect(saves).toBeGreaterThan(DOOR.SAVES * 0.9);
    expect(saves).toBeLessThan(DOOR.SAVES * 1.1);
    expect(DOOR.TRIP).toBeCloseTo(DOOR.LEN * SAIL.PUSH + 2, 1);
    expect(DOOR.SAVES).toBeLessThan(RACE.DECENT.whirls);
  }, 120000);

  it('a long-way race is unchanged: the door, open or shut, is no square of the sea, and the pilot never sails her into it', () => {
    // (the sea's the same sea: every square as it was, the door's face cliff, the water off it leg 2)
    const fresh = new Sea(9);
    for (let c = 0; c < SAIL.COLS; c++) for (let r = RC.R0; r < SAIL.ROWS; r++) {
      expect(fresh.open(c, r)).toBe(sea.open(c, r));
      expect(fresh.windAt(c, r)).toBe(sea.windAt(c, r));
    }
    // Sailed along leg 2 past it, she goes by: the pilot's way along leg 2 runs past the mouth.
    const g = sailTo(sea, { c: 18, r: D.OFF[0][1], d: 3 }, [3, D.OFF[0][1]]);
    expect([g.at.c, g.at.r]).toEqual([3, D.OFF[0][1]]);
    // A race that never goes through counts every stretch in order, as before (den-race.test.ts sails
    // the whole long way and its clock); one that does skips legs 3 and 4 only by Race.under.
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    for (let n = 1; n < 6; n++) expect(race.tick(1, { c: 10, r: RC.STRETCHES[n].r })).toEqual([{ kind: 'leg', n }]);
  });
});

describe('the door: its stars lit, a booch, open for the race (11 Nov)', () => {
  it('its constellation lights its stars and opens it; a booch darkens them all and pushes her off, turned about', () => {
    const door = new Door();
    const off = door.booch({ c: D.OFF[0][0], r: D.OFF[0][1], d: 3 });
    expect(door.lit).toEqual([]);
    expect(off).toEqual({ c: D.OFF[0][0], r: D.OFF[0][1] - 1, d: 2 });
    expect(sea.open(off.c, off.r)).toBe(true);
    expect(stretchAt(off.c, off.r)).toBe(DOOR.FROM);
    // (a constellation booched while it was up lights nothing)
    expect(door.done(done([{ ring: 0, spoke: 1, colour: 2 }], true))).toBe(false);
    expect(door.lit).toEqual([]);
    for (let i = 0; i < DOOR.RUN - 1; i++) expect(door.done(done([{ ring: 0, spoke: i, colour: 1 }]))).toBe(false);
    expect(door.done(done([{ ring: 0, spoke: 7, colour: 1 }]))).toBe(true);
    expect(door.open).toBe(true);
    // Open, it stays open that race; a new race, shut again.
    expect(door.done(done([{ ring: 0, spoke: 1, colour: 1 }]))).toBe(false);
    expect(door.open).toBe(true);
    door.reset();
    expect(door.open).toBe(false);
    expect(door.lit).toEqual([]);
  });

  it('its Navigation: one of three stars dealt as ever, the puzzle\'s own five colours, no combo needed ("more competitive", 11 Nov; set by the simulation, 12 Nov)', () => {
    const g = new Navigation(seeded(4), DOOR.NAV);
    expect(g.colours).toBe(COLOURS);
    const sizes: number[] = [];
    for (let i = 0; i < DOOR.RUN; i++) {
      sizes.push(g.constellation!.marks.length);
      expect(needsCombo(g.constellation!.marks), `constellation ${i}`).toBe(false);
      g.lay([[], [], []]);
      const marks = g.constellation!.marks;
      // (each star where it goes, held up by stars under it toward the middle, so nothing falls in)
      for (const m of marks) for (let r = 0; r < m.ring; r++) g.grid[r][m.spoke] ??= { id: 2000 + r * 8 + m.spoke, c: (m.colour + 1) % COLOURS };
      for (const m of marks) g.grid[m.ring][m.spoke] = { id: 1000 + m.ring * 8 + m.spoke, c: m.colour };
      // (a turn of a ring with none of its stars on it, so they stay in their places)
      g.turn([2, 1, 0].find((r) => !marks.some((m) => m.ring === r)) ?? 2, 2);
    }
    expect(sizes).toEqual([3]);
    expect(g.completed).toBe(DOOR.RUN);
  });
});
