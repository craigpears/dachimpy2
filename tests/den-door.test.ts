/* The starlit door, on the sloop race's course (src/den-door.ts; its squares LAY.RACE.DOOR). The user,
   11 Nov: "use duty navigation as the puzzle for how you find the door and have it discoverable in some
   way similar to the carpentry spots", and of the tunnel behind it: "a really long, straight passage. But
   it requires some like more hardcore puzzling ... you've got to do like big Vegas, like a big Vegas to
   get through it in sailing". */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { DOOR, Door, Tunnel, offDoor, mouthOf, exitPose, tunnelGust } from '../src/den-door';
import { RACE, Race, stretchAt } from '../src/den-race';
import { gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { Navigation, needsCombo, COLOURS, type Done } from '../src/navigation';
import { seeded } from '../src/mirror-row';
import { WAYS, BEFORE_MID, hop as hopFrom } from './race-helpers';

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

describe('where the door is: a plain cliff off leg 2; the tunnel\'s exits, sea caves onto leg 3 and, at its far end, leg 5 (12 Nov)', () => {
  it('its face is the second spit\'s cliff, the water off it leg 2; each exit a spit\'s far face, the water off it a leg further along', () => {
    for (const [c, r] of D.FACE) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of D.OFF) { expect(offDoor(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(DOOR.FROM); }
    expect(DOOR.FROM).toBe(1);
    expect(DOOR.EXITS.map((e) => e.to)).toEqual([2, 4]);
    expect(DOOR.TO).toBe(4);
    D.EXITS.forEach((e, k) => {
      for (const [c, r] of e.OUT) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
      for (const [c, r] of e.INTO) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(DOOR.EXITS[k].to); expect(sea.windAt(c, r)).toBeUndefined(); }
      // (a long straight passage: the door's own columns, its face to each exit)
      D.FACE.forEach(([c], i) => { expect(e.OUT[i][0]).toBe(c); expect(exitPose(k, i)).toEqual({ c, r: e.INTO[i][1], d: 0 }); });
      expect(DOOR.EXITS[k].len).toBe(e.INTO[0][1] - D.FACE[0][1] + 1);
    });
    expect(DOOR.LEN).toBe(DOOR.EXITS[DOOR.EXITS.length - 1].len);
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

describe('the tunnel\'s stretches: always some gain for going in, then the choice at each exit (12 Nov: "You either rejoin ... the main leg, or you have the opportunity to go through the Vegases")', () => {
  it('a Vegas from the mouth carries her along the first stretch to wait under its exit; anything less spills her up out of that first exit, never back to the mouth', () => {
    expect(DOOR.NEED).toBe(runFor(RUN.VEGAS));
    for (let steps = 1; steps <= RUN.VEGAS + 1; steps++) {
      const t = tunnelGust(true, MOUTH, runFor(steps))!;
      if (steps >= RUN.VEGAS) expect(t, `steps ${steps}`).toEqual({ way: 'on', exit: 0, went: DOOR.EXITS[0].len, to: exitPose(0, 0) });
      else expect(t, `steps ${steps}`).toEqual({ way: 'out', exit: 0, went: Math.min(runFor(steps), DOOR.EXITS[0].len), to: exitPose(0, 0) });
      expect(t.to).not.toEqual(MOUTH);
    }
    // (and from the other column, along the other)
    expect(tunnelGust(true, { c: D.OFF[1][0], r: D.OFF[1][1], d: 0 }, runFor(RUN.VEGAS))!.to).toEqual(exitPose(0, 1));
  });

  it('waiting under an exit she chooses: up onto the leg, keeping what she\'s gained, or a Vegas on to the next; less, and she\'s spilled up the exit she\'s under', () => {
    const t = new Tunnel(), VEGAS = runFor(RUN.VEGAS), OTHER: Pose = { c: D.OFF[1][0], r: D.OFF[1][1], d: 0 };
    // Up she comes, at the first exit.
    expect(t.enter(true, MOUTH, VEGAS)).toMatchObject({ way: 'on', exit: 0 });
    expect(t.inside()).toBe(true);
    expect(t.up()).toEqual({ way: 'out', exit: 0, went: 0, to: exitPose(0, 0) });
    expect(t.inside()).toBe(false);
    expect(t.up()).toBeNull();
    // On with a Vegas: out of the far end (in the column she came in by).
    t.enter(true, OTHER, VEGAS);
    expect(t.gust(VEGAS)).toEqual({ way: 'out', exit: 1, went: DOOR.EXITS[1].len - DOOR.EXITS[0].len, to: exitPose(1, 1) });
    expect(t.inside()).toBe(false);
    // Less than a Vegas under the first exit: spilled up it, not back to the mouth.
    t.enter(true, MOUTH, VEGAS);
    const m = t.gust(runFor(RUN.VEGAS - 1))!;
    expect(m).toMatchObject({ way: 'out', exit: 0, to: exitPose(0, 0) });
    expect(m.went).toBeLessThanOrEqual(DOOR.EXITS[1].len - DOOR.EXITS[0].len);
    // (less from the mouth: straight out of the first; no gust, nothing; the door shut, nothing)
    expect(t.enter(true, MOUTH, runFor(2))).toMatchObject({ way: 'out', exit: 0 });
    expect(t.inside()).toBe(false);
    expect(t.gust(VEGAS)).toBeNull();
    expect(t.enter(false, MOUTH, VEGAS)).toBeNull();
    t.enter(true, MOUTH, VEGAS); t.reset();
    expect(t.inside()).toBe(false);
  });

  it('each exit puts her on open water on its leg, free to sail on, and each further along the course than the last', () => {
    let was = -1;
    D.EXITS.forEach((_, k) => {
      for (const i of [0, 1]) { const o = exitPose(k, i); expect(sea.open(o.c, o.r)).toBe(true); expect(new Helm(sea, o).put('R')).toBe(true); expect(new Helm(sea, o).put('L')).toBe(true); }
      expect(DOOR.EXITS[k].to).toBeGreaterThan(Math.max(DOOR.FROM, was));
      expect(DOOR.EXITS[k].saves).toBeGreaterThan(k ? DOOR.EXITS[k - 1].saves : 0);
      was = DOOR.EXITS[k].to;
    });
  });

  it('the race counts each leg she passes under, in order: up at leg 3, or on under leg 4 to leg 5, and home from there', () => {
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    race.tick(1, { c: 10, r: RC.STRETCHES[1].r });
    expect(race.leg).toBe(1);
    // (waiting under the first exit, the helm's moored where it comes up: leg 3 reached)
    expect(race.under(DOOR.FROM, DOOR.EXITS[0].to)).toEqual([{ kind: 'leg', n: 2 }]);
    expect(race.tick(1, exitPose(0, 0))).toEqual([]);
    // (on to the far end: leg 4 passed under, leg 5 reached)
    expect(race.under(DOOR.EXITS[0].to, DOOR.EXITS[1].to)).toEqual([{ kind: 'leg', n: 4 }]);
    expect(race.tick(1, exitPose(1, 0))).toEqual([]);
    expect(race.tick(1, { c: 10, r: RC.STRETCHES[5].r })).toEqual([{ kind: 'leg', n: 5 }]);
    expect(race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] })[0]).toMatchObject({ kind: 'finish' });
    // (not from anywhere but leg 2; not with no race on)
    const r2 = new Race();
    r2.start(); r2.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(r2.under(DOOR.FROM, DOOR.TO)).toEqual([]);
    expect(new Race().under(DOOR.FROM, DOOR.TO)).toEqual([]);
  });
});

describe('the course\'s biggest shortcut (11 Nov; its exits 12 Nov)', () => {
  // The long way, mouth to where each exit puts her: round the second spit's end and along leg 3 to under
  // the first exit (its first row there's only come to from the leg's own start: the second row beside it
  // is as far along); then on, a Double over the trade wind back up the course, round the third spit's
  // end, along leg 4, round the fourth's, and along leg 5 to the far end (every shortcut shut).
  const ways = WAYS;
  it(`coming up at the first exit saves about ${DOOR.EXITS[0].saves} seconds of sailing; on to the far end, about ${DOOR.SAVES}, more than any other shortcut`, () => {
    const s = shut(...ways);
    // (pins round each bend, as you'd drop them)
    const h = new Helm(s, { c: D.OFF[0][0], r: D.OFF[0][1], d: 3 });
    const go = (p: [number, number]) => { h.drop(...p); let t = 0; while ((h.pin || h.slot >= 0) && t < 900) { h.tick(DT); t += DT; } return t; };
    const E = D.EXITS;
    let long = go([3, RC.SPITS[1].r1]);
    const first = long + go([E[0].INTO[0][0], E[0].INTO[0][1] + 1]);
    expect([h.pose.c, h.pose.r]).toEqual([E[0].INTO[0][0], E[0].INTO[0][1] + 1]);
    long = first + go(BEFORE_MID);
    long += hopFrom(h, 2, 1);
    long += go([25, RC.SPITS[2].r1]) + go([3, RC.SPITS[3].r1]) + go(E[1].INTO[0]);
    expect([h.pose.c, h.pose.r]).toEqual(E[1].INTO[0]);
    [first, long].forEach((secs, k) => {
      const saves = secs - DOOR.EXITS[k].trip;
      expect(saves, `exit ${k}`).toBeGreaterThan(DOOR.EXITS[k].saves * 0.9);
      expect(saves, `exit ${k}`).toBeLessThan(DOOR.EXITS[k].saves * 1.1);
      // (her trip there in one go, at a gust's pace, door to daylight)
      expect(DOOR.EXITS[k].trip).toBeCloseTo(DOOR.EXITS[k].len * SAIL.PUSH + 2, 1);
    });
    expect(DOOR.SAVES).toBe(DOOR.EXITS[1].saves);
    expect(DOOR.SAVES).toBeGreaterThan(Math.max(...Object.values(RACE.DECENT)) * 1.5);
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
