/* The starlit door, on the sloop race's course (src/den-door.ts; its squares LAY.RACE.DOOR). The user,
   11 Nov: "use duty navigation as the puzzle for how you find the door and have it discoverable in some
   way similar to the carpentry spots", and of the tunnel behind it: "a really long, straight passage. But
   it requires some like more hardcore puzzling ... you've got to do like big Vegas, like a big Vegas to
   get through it in sailing". */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { DOOR, Door, offDoor, mouthOf, outOf, tunnelGust } from '../src/den-door';
import { RACE, Race, stretchAt } from '../src/den-race';
import { gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { Navigation, needsCombo, COLOURS, type Done } from '../src/navigation';
import { seeded } from '../src/mirror-row';

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

describe('where the door is: a plain cliff off leg 2, the tunnel out onto leg 5 (11 Nov)', () => {
  it('its face is the second spit\'s cliff, the water off it leg 2; its far end the fourth spit\'s far face, onto leg 5', () => {
    for (const [c, r] of [...D.FACE, ...D.OUT]) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of D.OFF) { expect(offDoor(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(DOOR.FROM); }
    for (const [c, r] of D.INTO) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(DOOR.TO); }
    expect(DOOR.FROM).toBe(1);
    expect(DOOR.TO).toBe(4);
    // (a long straight passage: the same columns, door to far end, under legs 3 and 4)
    D.FACE.forEach(([c], i) => { expect(D.OUT[i][0]).toBe(c); expect(outOf(i)).toEqual({ c, r: D.INTO[i][1], d: 0 }); });
    expect(DOOR.LEN).toBe(D.INTO[0][1] - D.FACE[0][1] + 1);
    for (const s of [RC.STRETCHES[2], RC.STRETCHES[3]]) expect(s.r).toBeGreaterThan(D.FACE[0][1]);
    for (const s of [RC.STRETCHES[2], RC.STRETCHES[3]]) expect(s.r + 1).toBeLessThan(D.OUT[0][1]);
  });

  it('its mouth can be come to facing in, by her own moves along leg 2 (a turn in off its upper row)', () => {
    // From leg 2's upper row, sailing it (left), a turn to starboard brings her to the mouth facing the cliff.
    const h = new Helm(sea, { c: D.OFF[0][0] + 1, r: D.OFF[0][1] - 1, d: 3 });
    h.put('R');
    for (let t = 0; t < 10; t += DT) h.tick(DT);
    expect(mouthOf(h.pose)).toBe(0);
  });
});

describe('the door is the only way into the tunnel (11 Nov)', () => {
  it('the cliff\'s face stops every move and gust, open or shut: the tunnel is no square of the sea', () => {
    for (const [c, r] of D.FACE) expect(sea.open(c, r)).toBe(false);
    // A Vegas from the mouth with the door shut: the cliff stops it, as any rock.
    expect(gustPath(sea, MOUTH, runFor(RUN.VEGAS))).toEqual([]);
    expect(tunnelGust(false, MOUTH, runFor(RUN.VEGAS))).toBeNull();
    // Her own moves into it bump.
    expect(sea.sail(MOUTH, 'F').to).toEqual(MOUTH);
  });

  it('only from its mouth, facing in, with the door open: from anywhere else on the sea, any heading, never', () => {
    let mouths = 0;
    for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) for (let d = 0; d < 4; d++) {
      if (!sea.open(c, r)) continue;
      const t = tunnelGust(true, { c, r, d }, runFor(RUN.VEGAS) + 5);
      if (!t) continue;
      mouths++;
      expect(D.OFF.some(([x, y]) => x === c && y === r), `${c},${r}`).toBe(true);
      expect(d).toBe(0);
      // (facing the cliff: the square ahead is the door's face)
      expect(D.FACE.some(([x, y]) => x === c + DC[d] && y === r + DR[d])).toBe(true);
    }
    expect(mouths).toBe(2);
  });
});

describe('only a Vegas carries her through (11 Nov)', () => {
  it('a Vegas from the mouth carries her the length of it, out onto leg 5; less, and the draught carries her back out to the mouth', () => {
    expect(DOOR.NEED).toBe(runFor(RUN.VEGAS));
    for (let steps = 1; steps <= RUN.VEGAS + 1; steps++) {
      const t = tunnelGust(true, MOUTH, runFor(steps))!;
      if (steps >= RUN.VEGAS) expect(t, `steps ${steps}`).toEqual({ way: 'through', went: DOOR.LEN, to: outOf(0) });
      else expect(t, `steps ${steps}`).toEqual({ way: 'back', went: runFor(steps), to: MOUTH });
    }
    // (and from the other column, out of the other)
    expect(tunnelGust(true, { c: D.OFF[1][0], r: D.OFF[1][1], d: 0 }, runFor(RUN.VEGAS))!.to).toEqual(outOf(1));
    // Where it puts her: open water on leg 5, free to sail on.
    for (const i of [0, 1]) { const o = outOf(i); expect(sea.open(o.c, o.r)).toBe(true); expect(new Helm(sea, o).put('R')).toBe(true); }
  });

  it('the race counts it: from leg 2 straight on to leg 5, and home from there', () => {
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    race.tick(1, { c: 10, r: RC.STRETCHES[1].r });
    expect(race.leg).toBe(1);
    expect(race.under(DOOR.FROM, DOOR.TO)).toEqual([{ kind: 'leg', n: 4 }]);
    expect(race.tick(1, { c: D.INTO[0][0], r: D.INTO[0][1] })).toEqual([]);
    expect(race.tick(1, { c: 10, r: RC.STRETCHES[5].r })).toEqual([{ kind: 'leg', n: 5 }]);
    expect(race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] })[0]).toMatchObject({ kind: 'finish' });
    // (not from anywhere but leg 2; not twice; not with no race on)
    const r2 = new Race();
    r2.start(); r2.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(r2.under(DOOR.FROM, DOOR.TO)).toEqual([]);
    expect(new Race().under(DOOR.FROM, DOOR.TO)).toEqual([]);
  });
});

describe('the course\'s biggest shortcut (11 Nov)', () => {
  // The long way, mouth to where the tunnel puts her: round the second spit's end, back along leg 3,
  // round the third's, along leg 4, round the fourth's, onto leg 5 (every shortcut shut, as the long way).
  const ways: [number, number][] = [...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at)];
  it(`saves about ${DOOR.SAVES} seconds of sailing, more than any other shortcut`, () => {
    const s = shut(...ways);
    // (pins round each bend, as you'd drop them)
    const pins: [number, number][] = [[3, RC.SPITS[1].r1], [25, RC.SPITS[2].r1], [3, RC.SPITS[3].r1], D.INTO[0]];
    let at: Pose = { c: D.OFF[0][0], r: D.OFF[0][1], d: 3 }, long = 0;
    for (const p of pins) { const g = sailTo(s, at, p); long += g.t; at = g.at; }
    expect([at.c, at.r]).toEqual(D.INTO[0]);
    const saves = long - DOOR.TRIP;
    expect(saves).toBeGreaterThan(DOOR.SAVES * 0.85);
    expect(saves).toBeLessThan(DOOR.SAVES * 1.15);
    expect(saves).toBeGreaterThan(Math.max(...Object.values(RACE.DECENT)) * 1.5);
    // (her trip through, at a gust's pace, door to daylight)
    expect(DOOR.TRIP).toBeCloseTo(DOOR.LEN * SAIL.PUSH + 2, 1);
  }, 120000);

  it('a long-way race is unchanged: the door, open or shut, is no square of the sea, and the pilot never sails her into it', () => {
    // (the sea's the same sea: every square as it was, the door's face cliff, the water off it leg 2)
    const fresh = new Sea(9);
    for (let c = 0; c < SAIL.COLS; c++) for (let r = RC.R0; r < SAIL.ROWS; r++) {
      expect(fresh.open(c, r)).toBe(sea.open(c, r));
      expect(fresh.windAt(c, r)).toBe(sea.windAt(c, r));
    }
    // Sailed along leg 2 past it, she goes by: the pilot's way along leg 2 runs past the mouth.
    const g = sailTo(sea, { c: 25, r: D.OFF[0][1], d: 3 }, [3, D.OFF[0][1]]);
    expect([g.at.c, g.at.r]).toEqual([3, D.OFF[0][1]]);
    // A race that never goes through counts every stretch in order, as before (den-race.test.ts sails
    // the whole long way and its clock); one that does skips legs 3 and 4 only by Race.under.
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    for (let n = 1; n < 6; n++) expect(race.tick(1, { c: 10, r: RC.STRETCHES[n].r })).toEqual([{ kind: 'leg', n }]);
  });
});

describe('the door: its stars lit, a booch, open for the race (11 Nov)', () => {
  it('each constellation lights its stars; the third opens it; a booch darkens them all and pushes her off, turned about', () => {
    const door = new Door();
    expect(door.done(done([{ ring: 0, spoke: 1, colour: 2 }, { ring: 1, spoke: 5, colour: 0 }]))).toBe(false);
    expect(door.lit).toHaveLength(1);
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

  it('its Navigation: two small ones dealt as ever, the puzzle\'s own five colours, no combo needed ("more competitive", 11 Nov)', () => {
    const g = new Navigation(seeded(4), DOOR.NAV);
    expect(g.colours).toBe(COLOURS);
    const sizes: number[] = [];
    for (let i = 0; i < DOOR.RUN; i++) {
      sizes.push(g.constellation!.marks.length);
      expect(needsCombo(g.constellation!.marks), `constellation ${i}`).toBe(false);
      g.lay([[], [], []]);
      for (const m of g.constellation!.marks) g.grid[m.ring][m.spoke] = { id: 1000 + m.ring * 8 + m.spoke, c: m.colour };
      g.turn(1, 2);
    }
    expect(sizes).toEqual([2, 3]);
    expect(g.completed).toBe(DOOR.RUN);
  });
});
