/* Pirate Den: sailing. TypeScript, compiled to js/den-sail.js; tested in tests/den-sail.test.ts.
   den.js draws the sloop, the sea and the pin; this is the board under them, the moves, and the
   clock that plays them.

   The user (9 Nov): "actually navigating to these areas, being very more Puzzle Pirates ... you
   actually sail around, you know, do the left, right tokens, and you can see the beach go and
   land", "keep it a 3D thing, so you don't have the grid squares quite as obviously, but obviously
   they're still there underneath", "just keep it simple as like with a few rocks". And then, for a
   first go at it: "drop a pin, like a destination point, but it almost like auto moves. So like
   the turns last maybe every 5 or 10 seconds, but it still moves like a Puzzle Pirate ship. So it
   goes left, pauses, right, pauses, forward, forward, left, right ... the fact that you chart the
   waypoints out gives it the speed."

   So, Battle Navigation's moves on a hidden grid of sea: forward is one square ahead; left and
   right are a square ahead and a square to that side, ending up facing that way (a quarter circle,
   as in Battle Navigation). A turn plays up to four moves, one after another with a pause between,
   then a breather before the next. You drop a pin and the pilot works out the moves to get there;
   you can put in moves yourself as well (they're played first), for when you want to steer. */

import { DeckHole } from './den-patch.js';
import { Lock, lockCost, type LockNeed, type LockSpot } from './den-lock.js';
import { Wind, WIND, against, inZone, lie, rowTime, sailTime, weather, zoneAir, type Air, type WindEvent, type WindZone } from './den-wind.js';
import { WHIRL, whirl, whirlAt, whirlpool, type Whirlpool, type WhirlSpot } from './den-whirl.js';
import type { Cell } from './engine';

/** A move, as on Battle Navigation's tokens: forward, left, right. */
export type Move = 'F' | 'L' | 'R';
/** Where she is: a square of the board (c across, r out to sea from the cove) and the way she's
    facing (0 out to sea, 1 right as seen from the den, 2 back in to the cove, 3 left). */
export interface Pose { c: number; r: number; d: number }

export const SAIL = {
  /** The board: squares across and out to sea. Grown (10 Nov) from 16 by 14 to make room for the
      imperial checkpoint and the open sea beyond it (the user wanted "a bit of the map, not just
      tiny sections"): out to the right and further out to sea, everything already there staying
      put. Grown again (11 Nov) from 22 to 27 across, out to the right, to space the islands out
      (the user: "can we see if we can just space things out a bit? ... TZZ just seems kind of
      crammed into the middle"): Tzz's island out in the new water, open sea round it, and the Wedding
      Isle and Kikkit's island no longer against the edge. And again (11 Nov) from 26 to 34 out to
      sea, for Port Decorum, the island under imperial control (LAY.EMPIRE): out past the wreck, open
      sea round it. And again (11 Nov) from 34 to 37, for Primates Rule at anchor out past Port Decorum,
      to its left (LAY.PRIMATES), open sea round her: everything already there staying put. And again
      (11 Nov) from 37 to 65, for the sloop race's course out past her (LAY.RACE), behind a line of
      rocks with one gate in it: everything already there staying put. */
  COLS: 27,
  ROWS: 65,
  /** The sea as the captain's map shows it: the rows it had before the race's course was laid out
      past Primates Rule (src/den-map.ts). The course is a place of its own, off the map. */
  CHARTED: { ROWS: 37 },
  /** Where the scattered rocks fall: the board as it was before it grew, so its rocks are the same
      as ever. The new water is laid out by hand (LAY). */
  SCATTER: { COLS: 16, ROWS: 14 },
  /** A square, in metres (the sloop's about one long). */
  CELL: 4,
  /** The board's left edge, in metres across from the den's middle: where it was at 16 squares
      across, so it grows out to the right. */
  X0: -32,
  /** Where the board starts, out from the wall (metres; the wall's at 0, out is -): at the lowest
      tide's edge, so the sloop's moored close in, where you see her from the beach (the user, 9
      Nov: she should be "in a more natural place"), and still always afloat. */
  Z0: -17,
  /** Her mooring: just off the left of the beach, broadside on, bows along the shore toward the
      middle of the cove. */
  HOME: { c: 6, r: 0, d: 1 } as Pose,
  /** Moves in a turn, as in Battle Navigation. */
  SLOTS: 4,
  /** Seconds a move takes to sail, the pause after it, and the breather between turns: about
      seven seconds a turn ("5 or 10 seconds"). */
  MOVE: 1,
  PAUSE: 0.35,
  BREAK: 1.4,
  /** A beat before the first move when you give her an order while she's idle. */
  WAKE: 0.5,
  /** Rocks on the board: clumps of one to three squares. */
  CLUMPS: 13,
  /** Her guns, one each side (see broadside; loaded by Gunnery: src/den-guns.ts): how many squares
      a shot carries. */
  RANGE: 3,
  /** Seconds a square of trade wind takes to sweep her along: "just insanely quick wind tiles". */
  PUSH: 0.28,
  /* (The locks' own numbers, the Bilge to raise her and the seconds to drain, are LOCK in
     src/den-lock.ts.) */
  /** Seconds the guns that shoot at her (the checkpoint's: src/den-checkpoint.ts) hold fire once
      she's patched, so she can get going (the user, 9 Nov, of the turret that was: "as soon as you
      finish the puzzle, the cannon starts shooting at you again ... literally before you can do
      anything about it"). */
  GRACE: 5,
  /** The hole a hit knocks in her deck when nothing says what shape (den.js makes a fresh one each
      hit): three pieces' worth, patched by Carpentry (src/den-patch.ts). */
  HOLE: [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3], [4, 2], [4, 3]] as Cell[],
} as const;

/* The lay of the sea (the user, 9 Nov: "just really go for it. Add some shipping lanes ... where
   you've got a fork in the road ... some kind of a lock and canal ... if you want to switch from one
   route to the other one, you know, there's a bit of a cliff. You have to go up a lock").

   Rebuilt round the imperial checkpoint (the user, 10 Nov: "there's no need for that cannon near
   the turret near the den now, because ... we've got the Imperial checkpoint. That's the evolution
   of it"): a trade wind runs out from off the beach and drops her at a junction, "just like a
   normal square", to choose: on, the main shipping lane out to the checkpoint, which drops her
   short of its guns; or left along a canal to a lock in a cliff, up into a hidden cove behind it
   (the side adventure). Another trade wind runs back home from by where the main lane drops her.
   Rocks stand along the lanes' sides.

   The canal became a chain of locks (the user, 10 Nov: "make it a bit more of a journey ... be more
   than just the one lock ... 4 or 5 or something in total. Might be swallowing a bit too much"):
   the secret way round the checkpoint. It climbs two locks up the cliff (each pumped up by Bilge),
   runs along the clifftop, and comes down two more through the headland beside the checkpoint, out
   onto the open sea beyond it. The hidden cove is off it, up at the top, down an arm the locks
   don't lead you along, "almost more like an Easter egg" you find by wandering off. With the
   locks the way round, the reef's far end was closed: the ways past are to run it, row it, fight
   its guns, or the locks.

   Then (the user, 10 Nov) the way to the locks is "supposed to be more of an Easter egg. It
   shouldn't be like right there for you to see. You should have to sail around to find it a bit":
   the canal's mouth is in the high ground's face toward the den, off to the left, out of view from
   the trade wind's run, and nothing at the junction points it out. And the locks were "very
   confusing ... staring at a cliff once you go through", "having to bump into the walls to get
   around this lock system": so the chain runs straight, up one channel cut through the cliffs and
   down through the headland, and out of every lock she faces on along the canal, its next lock's
   gates ahead. The way on pulls you; the side way pushes back (STORY.md): the arm to the hidden
   cove doubles back off it, narrow, two turns tight together. */

/* The sloop race's course (11 Nov; its rules src/den-race.ts, its 3D js/den/race.js). The user: "a
   winding, snakes and ladders, zigzagging kind of course, just with a lot of shortcuts, and each
   shortcut is a different puzzle", "out near where Primates Rule is", and "we're going to have to go
   through several iterations of this course": so it's laid out here from a few numbers, to rework
   freely. Out past Primates Rule, behind a line of rocks across the sea (REEF) with one gate in it
   (GATE), right of the old wreck's wind, so nothing on the den's side of the line changes. Six
   stretches of water two squares deep (STRETCHES: five legs and the run home), back and forth
   across the sea, out from the den one under the other, the course's own breeze (ZONE) blowing out
   across them, so every leg is a reach and every bend a run; between each pair a spit of land (SPITS),
   the bend round its end the long way. A shortcut cuts through each spit, each its own puzzle:
   - [A] the gun gap (GUNS): a gap in the first spit, a gun either side trained on it as the
     checkpoint's are (src/den-checkpoint.ts's numbers, src/den-turret.ts), light airs in the gap as
     under the checkpoint's gatehouse: a heavy combo rushes her past their marks, or knock them out
     by Gunnery; a square at a time, she's a sitting duck.
   - [B] the headwind gap (HEADWIND): a gap in the second, the wind blowing straight back through it,
     so no sail gets through: row it (src/den-row.ts); idle in it and she drifts back out.
   - [C] the whirlpool reef (WHIRLS): only a Vegas from its mouth carries her clean over (src/den-whirl.ts,
     src/den-sailing.ts); less and a whirlpool has her and its winds carry her back to the mouth.
   - [D] the locks (LOCKS): a canal through the fourth, a lock up and a lock down (src/den-lock.ts),
     the up one pumped by Bilge.
   - [E] the crane (CRANE): on the neck of the last spit, built by Carpentry (src/den-crane.ts), it
     hauls her over to the run home.
   The run home ends on a trade wind (LANE) up the course's left-hand side, behind a wall (WALL), that
   sweeps her up to the finish (FINISH), by the gate she came in at. Laid out at r0 (the line of
   rocks' row), 27 squares across. */
const RACE_LAY = (() => {
  const R0 = 37, W = 27;
  /** Each stretch: its first row (it's two deep) and the way it's sailed (1 right, 3 left). */
  const STRETCHES = [{ r: R0 + 1, d: 1 }, { r: R0 + 4, d: 3 }, { r: R0 + 9, d: 1 }, { r: R0 + 17, d: 3 }, { r: R0 + 22, d: 1 }, { r: R0 + 26, d: 3 }];
  /** Each spit: its rows, and the end she rounds it the long way ('R' the right, 'L' the left). Two
      squares of water round its end; on the left, the wall (WALL) beside them. */
  const SPITS = [{ r0: R0 + 3, r1: R0 + 3, bend: 'R' }, { r0: R0 + 6, r1: R0 + 8, bend: 'L' }, { r0: R0 + 11, r1: R0 + 16, bend: 'R' }, { r0: R0 + 19, r1: R0 + 21, bend: 'L' }, { r0: R0 + 24, r1: R0 + 25, bend: 'R' }] as const;
  const GUN_C = 15, WIND_C = 13, WHIRL_C = 11, LOCK_C = 17, CRANE_C = 3;
  const S = SPITS;
  // The whirlpool reef [C]: a gust from MOUTH straight out down WHIRL_C, over three whirlpools beside
  // it (two squares across, at WHIRL_C - 2), each missing its far left corner, where a wind blows her
  // into the way home: up the column beside them (WHIRL_C - 3), across the stretch above and down into
  // the mouth. Each square of the way down is a wind: the even ones blow her left into a whirlpool's
  // near right corner (it whirls her round to the missing corner, home); the odd ones back up a square
  // onto an even one. Seven squares from the mouth is the stretch beyond: only a Vegas's gust (src/sailing.ts).
  const wr0 = S[2].r0, whirls: { at: [number, number]; gone: [number, number] }[] = [], winds: [number, number, number][] = [];
  for (let k = 0; k < 3; k++) whirls.push({ at: [WHIRL_C - 2, wr0 + 2 * k], gone: [WHIRL_C - 2, wr0 + 2 * k + 1] });
  for (let r = wr0; r <= S[2].r1; r++) winds.push([WHIRL_C, r, (r - wr0) % 2 ? 2 : 3]);
  for (const w of whirls) winds.push([w.gone[0], w.gone[1], 3]);
  for (let r = S[2].r1; r >= wr0 - 1; r--) winds.push([WHIRL_C - 3, r, 2]);
  const mouthR = wr0 - 1, topR = wr0 - 2;
  for (let c = WHIRL_C - 3; c < WHIRL_C; c++) winds.push([c, topR, 1]);
  winds.push([WHIRL_C, topR, 0]);
  const passage = new Set<string>([...winds.map(([c, r]) => `${c},${r}`), ...whirls.flatMap(({ at: [c, r] }) => [`${c},${r}`, `${c + 1},${r}`, `${c},${r + 1}`, `${c + 1},${r + 1}`])]);
  // The locks [D], straight down through the fourth spit: up a lock, a stretch of canal, down a lock.
  const locks: LockSpot[] = [{ at: [LOCK_C, S[3].r0], up: 0, low: 0 }, { at: [LOCK_C, S[3].r1], up: 2, low: 0 }];
  const pound: [number, number][] = [];
  for (let r = S[3].r0 + 1; r < S[3].r1; r++) pound.push([LOCK_C, r]);
  // The land of each spit, but for its shortcut's way through it.
  const open = new Set<string>([`${GUN_C},${S[0].r0}`, ...[S[1].r0, S[1].r0 + 1, S[1].r1].map((r) => `${WIND_C},${r}`), ...passage, ...locks.map((l) => `${l.at[0]},${l.at[1]}`), ...pound.map(([c, r]) => `${c},${r}`)]);
  const land: [number, number][][] = S.map((s) => {
    const out: [number, number][] = [];
    for (let r = s.r0; r <= s.r1; r++) for (let c = s.bend === 'R' ? 1 : 4; c <= (s.bend === 'R' ? W - 3 : W - 1); c++) if (!open.has(`${c},${r}`)) out.push([c, r]);
    return out;
  });
  // The wall up the left-hand side, between the bends and the trade wind home.
  const wall: [number, number][] = [];
  for (let r = S[0].r0; r <= S[4].r1; r++) if (!land.some((l) => l.some(([c, y]) => c === 1 && y === r))) wall.push([1, r]);
  const reef: [number, number][] = [];
  for (let c = 0; c < W; c++) if (c !== 8 && c !== 9) reef.push([c, R0]);
  const last = STRETCHES[STRETCHES.length - 1];
  return {
    R0, STRETCHES, SPITS,
    /** The line of rocks across the sea in front of it, and its gate (the start, from the open sea). */
    REEF: reef,
    GATE: [[8, R0], [9, R0]] as [number, number][],
    /** The starting buoy, on the open sea off the gate, a little to the right of Primates Rule: where
        she starts, from any square of START (Space). */
    BUOY: [10, R0 - 1] as [number, number],
    START: { c0: 8, c1: 10, r0: R0 - 2, r1: R0 - 1 },
    /** The land of each spit (works: drawn by js/den/race.js), and the wall. */
    LAND: land, WALL: wall,
    /** The trade wind home, up the left-hand edge from the run home, and the finish where it drops her. */
    LANE: { at: [0, last.r + 1] as [number, number], d: 2, n: last.r + 1 - (R0 + 2) + 1 },
    FINISH: [0, R0 + 1] as [number, number],
    /** The course's own breeze, out across it; light airs across the gun gap (as under the checkpoint's
        gatehouse); and the headwind back through the second spit's gap. (The first that has a square
        is the one she feels: src/den-sail.ts, Sea.zoneAt.) */
    ZONES: [
      { c0: GUN_C, c1: GUN_C, r0: S[0].r0, r1: S[0].r0, d: 1, s: 1 },
      { c0: WIND_C, c1: WIND_C, r0: S[1].r0, r1: S[1].r1, d: 2, s: 2 },
      // (but the third leg's first row past the whirlpools' mouth, where the winds into the mouth cross it
      // and the only way into it is up from the row beside it)
      { c0: 1, c1: W - 1, r0: R0 + 1, r1: topR - 1, d: 0, s: 2 },
      { c0: 1, c1: WHIRL_C, r0: topR, r1: topR, d: 0, s: 2 },
      { c0: 1, c1: W - 1, r0: topR + 1, r1: last.r + 1, d: 0, s: 2 },
    ] as WindZone[],
    /** [A]: the gap, its guns either side, and the squares each is trained on (gun 0 the way in and the
        way out, gun 1 the gap itself, as the checkpoint's: src/den-checkpoint.ts, CHECK.MARKS). */
    GUNS: { gap: [GUN_C, S[0].r0] as [number, number], at: [[GUN_C - 1, S[0].r0], [GUN_C + 1, S[0].r0]] as [number, number][], marks: [[[GUN_C, S[0].r0 - 1], [GUN_C, S[0].r0 + 1]], [[GUN_C, S[0].r0]]] as [number, number][][] },
    /** [B]: the gap's squares, the way in first. */
    HEADWIND: [S[1].r0, S[1].r0 + 1, S[1].r1].map((r) => [WIND_C, r]) as [number, number][],
    /** [C]: the mouth (facing in), the whirlpools and their winds ([c, r, the way it blows]). */
    WHIRLS: { MOUTH: { c: WHIRL_C, r: mouthR, d: 0 } as Pose, POOLS: whirls as WhirlSpot[], WINDS: winds, OUT: [WHIRL_C, S[2].r1 + 1] as [number, number] },
    /** [D]: the locks and the canal between them (its level, a lock's lift up). */
    LOCKS: locks, POUND: { level: 1, at: pound },
    /** [E]: the crane's ledge on the neck (she lies alongside it, on the leg), and where it sets her down
        on the run home, facing along it. */
    CRANE: { LEDGE: [CRANE_C, S[4].r0 - 1] as [number, number], TO: { c: CRANE_C, r: S[4].r1 + 1, d: 3 } as Pose },
    /** The starlit door (src/den-door.ts; Duty Navigation opens it): a plain cliff face on the second
        spit, off leg 2 (FACE, the water off it OFF), and its tunnel's end on the fourth spit's far face,
        out onto leg 5 (OUT, the water off it INTO). The tunnel's no square of the sea: it runs under. */
    DOOR: {
      FACE: [[21, S[1].r0], [22, S[1].r0]] as [number, number][], OFF: [[21, S[1].r0 - 1], [22, S[1].r0 - 1]] as [number, number][],
      OUT: [[21, S[3].r1], [22, S[3].r1]] as [number, number][], INTO: [[21, S[3].r1 + 1], [22, S[3].r1 + 1]] as [number, number][],
    },
  };
})();

export const LAY = {
  /** The trade winds: where each starts, the way it blows, and how many squares long. Out from off
      the beach to the junction; on from the junction, the main shipping lane, out to the imperial
      checkpoint, dropping her off just out of reach of its guns, facing its gate (see CHECKPOINT);
      and back home, from beside where the main lane drops her to just off the beach. */
  LANES: [
    { at: [9, 2], d: 0, n: 8 },
    { at: [9, 11], d: 0, n: 4 },
    { at: [11, 15], d: 2, n: 13 },
  ] as { at: [number, number]; d: number; n: number }[],
  JUNCTION: [9, 10] as [number, number],
  /** The canal's mouth, at the sea's level: the water up to the first lock, in the high ground's face
      toward the den, out of view from the trade wind's run (kept clear of scattered rocks). */
  CANAL: [[3, 7], [3, 6], [3, 5]] as [number, number][],
  /** A sheltered harbour at the canal's mouth (10 Nov): rocks jutting out from the cliff's foot
      either side of it, most of all on its right, the mouth's wind (ZONES) filling the water
      between them right up to the cliff and the first lock. The user, playtesting the way in: "it
      just maybe needs a few rocks along the right-hand side so you can't try and, like, sneak around
      the wind. I mean, you can't, but it kind of feels like you almost can ... almost like it's a
      bit of a harbour, sheltered area. And like the wind just to expand up to the cliff. At the
      moment, it's just kind of in the middle of nowhere." Its arms run out from the cliff (row
      PLATEAU.r0 - 1) toward the den: the left one three squares, the right one four, each two
      thick at the cliff's foot. Drawn as rocky spurs stepping down from the cliff (js/den/sea.js). */
  HARBOUR: [
    [1, 7], [1, 6], [1, 5], [0, 7], [0, 6],
    [5, 7], [5, 6], [5, 5], [5, 4], [6, 7], [6, 6],
  ] as [number, number][],
  /** The locks (src/den-lock.ts), in the order she meets them going out, all in one straight line
      out to sea: up the cliff from the canal's mouth, up again to the clifftop, then down through
      the headland beside the checkpoint (each with its high side back toward the den), out onto
      the sea beyond it. Each lock's banks are rock, so she can only go through it straight; and out
      of each she's facing on along the canal. */
  LOCKS: [
    { at: [3, 8], up: 0, low: 0 },
    { at: [3, 12], up: 0, low: 1 },
    { at: [3, 18], up: 2, low: 1 },
    { at: [3, 20], up: 2, low: 0 },
  ] as LockSpot[],
  /** The stretches of canal between the locks (pounds), and their water's level: a lock's lift
      above the sea; the clifftop's, two (with the arm off it, doubling back down to the hidden cove,
      which the locks don't lead you along); and the one between the two locks down through the
      headland. */
  POUNDS: [
    { level: 1, at: [[3, 9], [3, 10], [3, 11]] },
    { level: 2, at: [[3, 13], [3, 14], [3, 15], [3, 16], [3, 17], [2, 15], [1, 15], [1, 14]] },
    { level: 1, at: [[3, 19]] },
  ] as { level: number; at: [number, number][] }[],
  /** The hidden cove: up on the clifftop, its water at the top of the locks, off the end of the
      clifftop canal's arm, beside the canal's first stretches (a wall of cliff between). */
  COVE: { c0: 0, c1: 1, r0: 9, r1: 13, level: 2 },
  /** The high ground the canal's cut through, the cove's cliffs with it: every square of it that
      isn't the canal's water (or a lock) is cliff. (The checkpoint's headland, beyond it, is its
      own: CHECKPOINT.HEADLAND.) */
  PLATEAU: { c0: 0, c1: 5, r0: 8, r1: 17 },
  /** Rocks along the lanes' sides ("some craziness to the journey"). ([12, 4] in to [13, 2], 11 Nov, to
      leave open sea round Primates Rule at anchor: PRIMATES.) */
  SIDES: [[8, 5], [10, 8], [13, 2], [14, 8], [12, 12]] as [number, number][],
  /** The imperial checkpoint (10 Nov), across the main shipping lane: a line across the sea at ROW,
      closed but for its gate (GATE, under a gatehouse whose PIERS stand either side). Its guns
      stand on bastions either side (GUNS), each trained on squares of the way through (MARKS,
      src/den-checkpoint.ts). On its left a headland (cliff), the last two locks cut down through it
      (LOCKS); on its right a reef of rocks (REEF, along ROW), out to the board's edge (its end was
      open, the long way round, till the locks became the way round: 10 Nov). */
  CHECKPOINT: {
    ROW: 19,
    GATE: 9,
    PIERS: [[8, 19], [10, 19]] as [number, number][],
    GUNS: [[7, 19], [11, 19]] as [number, number][],
    HEADLAND: { c0: 0, c1: 6, r0: 18, r1: 20 },
    REEF: { c0: 12, c1: 26 },
  },
  /** An old wreck on the open sea beyond the checkpoint, its treasure hauled up by Treasure Haul:
      the reason to get past. Out of reach of the checkpoint's guns, so she can haul in peace. */
  WRECK: [5, 24] as [number, number],
  /** Wind zones (src/den-wind.ts): patches of sea with a wind of their own, whatever the weather.
      The old wreck's (10 Nov): it blows from the left, so from the checkpoint's side, heading for the
      wreck, she's dead into it ("tempting, but you can't get to it unless you go around the back
      way"), and down the locks she comes out beside it with it across her or behind her. It starts
      a column short of the last lock's foot, so from beside the wreck she can slip out of it
      westward and back up the locks, as well as downwind. It runs out to the sea's far edge, as it did
      before the sea grew out past it for Port Decorum (11 Nov: LAY.EMPIRE), and again for Primates Rule
      (11 Nov: LAY.PRIMATES), so there's still no sailing round its far end to the locks' foot.
      And the canal's mouth (10 Nov: "there should be some wind stopping you from getting to the
      locks on the left as well ... People have got to figure out that they can use the oars to go
      past the wind"): it blows down out of the cut toward the den, so under sail she can't get into
      the first lock, and coming back down she runs out before it; the oars take her in. It fills
      the harbour (HARBOUR), wall to wall and up to the cliff, so there's no water beside it that
      looks like a way round.
      And under the checkpoint's gatehouse (10 Nov: "these checkpoints are supposed to be strong
      things, not things you just casually get through on the first try ... it should be work"):
      its walls take the wind out of her sails, light airs across her, so under sail she ghosts
      through the gate slowly, on its gun's mark, and that gun has her (once a gun:
      src/den-checkpoint.ts); a combo rowed as one still rushes her through. */
  ZONES: [
    // (out to the race course's line of rocks, since 11 Nov: LAY.RACE.REEF, which shuts its far end)
    { c0: 4, c1: 7, r0: 20, r1: 36, d: 1, s: 2 },
    { c0: 2, c1: 4, r0: 5, r1: 8, d: 2, s: 2 },
    { c0: 9, c1: 9, r0: 19, r1: 19, d: 1, s: 1 },
  ] as WindZone[],
  /** Rocks out on the water the board grew into. (Two moved, 11 Nov, for Mischievious's isle
      (ISLE): [16, 13] out to [15, 15], to leave the water off its jetty clear, and [19, 8] to
      [21, 6], off its near shore, to leave room for its name on the captain's map. And one more, 11
      Nov, for Kikkit's island (KIKKIT): [15, 17] to [12, 17], out of the water off her shore; and
      [17, 22] gone, 11 Nov, for her whirlpools' winds; and [20, 15] gone, 11 Nov, for Tzz's island
      (TZZ): with it the water behind her island, between hers and Kikkit's, was shut in. And [17, 4]
      out to [21, 3], 11 Nov, to leave open sea round Primates Rule at anchor: PRIMATES.) */
  FAR: [[21, 3], [21, 6], [15, 15], [12, 17], [13, 24], [19, 24], [1, 23]] as [number, number][],
  /** Mischievious's isle (11 Nov), where her wedding is (js/den/wedding.js). The user: "on an island
      somewhere ... islands can all have their own little thing out there". In plain sight, out to
      the right of the shipping lanes on the den's side of the checkpoint, so a new player can sail
      there without the oars or the locks. LAND: its squares (land to sail by, drawn by
      js/den/isle.js, not as sea stacks), its jetty's among them, out from its left-hand shore
      toward the lanes. MOOR: where she lies alongside the jetty, bows toward the lanes, ready to
      sail home. LANDING: the water off its left-hand shore (kept clear of the scattered rocks) from any square
      of which Space puts you ashore (src/den-isle.ts), as along the den's beach: "you get to the
      general vicinity, not one specific square" (10 Nov). */
  ISLE: {
    LAND: [
      [17, 9], [18, 9], [19, 9],
      [16, 10], [17, 10], [18, 10], [19, 10], [20, 10],
      [17, 11], [18, 11], [19, 11], [20, 11],
      [17, 12], [18, 12], [19, 12], [20, 12],
      [18, 13], [19, 13],
    ] as [number, number][],
    JETTY: [16, 10] as [number, number],
    MOOR: { c: 16, r: 11, d: 3 } as Pose,
    LANDING: { c0: 14, c1: 16, r0: 9, r1: 13 },
  },
  /** Kikkit's island and her whirlpools (11 Nov; rules: src/den-kikkit.ts): "another way of getting
      past the reef, so it should go over there", to the right of the checkpoint's gate, the island
      on the reef's near side. LAND: her little island, against the reef (at its right-hand end till
      the board grew out past it, 11 Nov: SAIL.COLS). LANDING:
      the water off its left-hand shore, where you hear her out. MOUTH: where the way through starts,
      just off her shore, facing out to sea at the reef's gap (GAP).
      Reworked (11 Nov) to Puzzle Pirates' whirlpools (src/den-whirl.ts): WHIRLS, two whirlpools of
      four squares, each with a corner missing (`gone`) where the winds sit; WINDS, [c, r, d] squares
      of wind, blowing as the trade winds do. So, a gust from the mouth (a Sailing chain's run: src/
      den-sailing.ts), straight out through the gap:
      - a plain clear stops in the gap, on a wind that blows her left into the first whirlpool's near
        right corner; it whirls her round to its far left, the missing corner, whose wind blows her
        left onto the winds home: back up through the reef, along toward her island and into the
        mouth, as she started. Five lefts and a right (the right a whirl's: a twirl), as Kikkit said;
      - a Double carries her clean over the gap to OUT, open water past the reef: through;
      - a Triple, a Bingo or a Donkey further, onto the winds past OUT, into the second whirlpool,
        and home the same way (a Donkey stops short of the penguins: only a Vegas carries her in);
      - a Vegas over all of it to PENGUINS, their water, a gust's only, beside VEGAS, Vegas Island
        (the user named it, 11 Nov: "reached only by a Vegas").
      REEF: rocks round it all, so the whirlpools' corners can't be sailed into but from the winds
      and the gap, and the penguins' water is closed in.
      And a ring of them round Vegas Island (11 Nov): "Make sure you can't get to Penguin Island without
      going through the whirlpools ... the idea that ... you can get to the penguins by going behind it
      is obviously a bit weird ... They should be at least a few rocks around them." Sailed round the
      long way, past the checkpoint, she could come up beside it from the open sea behind (on its left,
      below it and on its right); now every square round it, corners too, is rock or the whirlpools'
      own way in, so the whirlpools (a Vegas over them) are the one way to the penguins. (On its right,
      since 11 Nov, the smugglers' run, on from the penguins: SMUGGLERS.) */
  KIKKIT: {
    LAND: [
      [19, 16], [20, 16],
      [18, 17], [19, 17], [20, 17], [21, 17],
      [18, 18], [19, 18], [20, 18], [21, 18],
    ] as [number, number][],
    LANDING: { c0: 16, c1: 17, r0: 15, r1: 18 },
    MOUTH: { c: 16, r: 18, d: 0 } as Pose,
    GAP: [16, 19] as [number, number],
    OUT: [16, 20] as [number, number],
    PENGUINS: [16, 23] as [number, number],
    WHIRLS: [
      { at: [14, 19], gone: [14, 20] },
      { at: [14, 21], gone: [14, 22] },
    ] as WhirlSpot[],
    WINDS: [
      // The gap, and on past OUT: into a whirlpool's near right corner.
      [16, 19, 3], [16, 21, 3], [16, 22, 2],
      // Each whirlpool's missing corner, out of it; then home, back up through the reef...
      [14, 20, 3], [14, 22, 3], [13, 22, 2], [13, 21, 2], [13, 20, 2], [13, 19, 2], [13, 18, 2],
      // ...along toward her island, and in to the mouth from behind it (the water on its right left
      // open, the way out of it).
      [13, 17, 1], [14, 17, 1], [15, 17, 1], [16, 17, 0],
    ] as [number, number, number][],
    REEF: [
      [14, 18], [15, 18], [14, 23], [17, 21],
      // (round Vegas Island: its left, below it, its right; beside the penguins' water on its right, the
      // smugglers' run, SMUGGLERS.RUN)
      [14, 24], [14, 25], [15, 25], [16, 25], [17, 25], [17, 24],
    ] as [number, number][],
    VEGAS: [[15, 23], [15, 24], [16, 24]] as [number, number][],
  },
  /** Tzz's island (11 Nov; src/den-tzz.ts): the sensible one after Kikkit, who shows you plainly how a
      Vegas is built. "Have it nearby because you want to run in to [Kikkit] first, because then it's
      like the point is you want to go find the other person to help you", and "[Tzz] appears nearer
      the start": a hop from Kikkit's, on the den's side of it, in plain sight. Moved (11 Nov) out of
      the gap between hers and the Wedding Isle, where it was "crammed into the middle", into the
      water the board grew into on the right (SAIL.COLS): open sea all round it, two squares at
      least to anything else. LAND: three squares, a little island of her own. The water round it,
      every square beside it, is where her lesson's seen (src/den-tzz.ts, onTzzLanding: the user, 11
      Nov, "you've got to go straight in front"). MOOR: where she's brought alongside as her lesson
      begins, out of its shot (the user: "then the [ship] blocks the view").
      Moved again (11 Nov) three squares in toward the den, further from Kikkit's whirlpools and the
      gap in the reef, so sailing by her you don't stumble into the secret way round (the user, by her
      island with the Sailing board open, a chain blew her through them: "Maybe they need to be a
      little bit further away from each other"): beside the Wedding Isle's far shore now, still on the
      den's side of Kikkit's and a hop from it, open sea two squares deep all round. (Everything of
      hers is placed from LAND[0]: src/den-tzz.ts.) */
  TZZ: {
    LAND: [[23, 10], [24, 10], [23, 11]] as [number, number][],
    MOOR: { c: 22, r: 9, d: 2 } as Pose,
  },
  /** Port Decorum (11 Nov; src/den-imperial.ts, js/den/imperial-isle.js), an island under imperial
      control: "just some island that's, say, under imperial control ... to create trading mechanics,
      looting mechanics, smuggling mechanics". In imperial waters, where the main shipping lane leads:
      straight out past the checkpoint's gate, beyond the old wreck, so the checkpoint guards the way
      to it and getting through is a reason to go. A proper island, twice Kikkit's (a port town to
      come), in the water the board grew into out to sea (SAIL.ROWS), open sea two squares deep all
      round it. LAND: its squares, the jetty's among them (JETTY: out from its near shore, toward the
      gate). */
  EMPIRE: {
    LAND: [
      [11, 27],
      [11, 28], [12, 28], [13, 28], [14, 28],
      [10, 29], [11, 29], [12, 29], [13, 29], [14, 29], [15, 29],
      [10, 30], [11, 30], [12, 30], [13, 30], [14, 30], [15, 30],
      [11, 31], [12, 31], [13, 31], [14, 31],
    ] as [number, number][],
    JETTY: [11, 27] as [number, number],
  },
  /** The smugglers' beach (11 Nov; src/den-smugglers.ts, js/den/smugglers.js): Port Decorum's back way
      in, reached only by way of Kikkit's whirlpools. The user: "for the Imperial Outpost, the kind of
      beach, so the back way in, I think that will be better, like, accessed far through those
      whirlpools ... I think having it one open area is a bit off ... Penguin Island, and then you have
      the ... Smuggler's Beach there ... redesign the fort so that ... there's some rocks and whatnot
      blocking some back entry". So rocks (drawn as the reef is: ROCKS, with the reef in Sea.reef) shut
      off Port Decorum's right-hand side and its back from the open sea, and behind them a narrow run of
      water (RUN) goes from beside the penguins' water, down past the island, to a cove (COVE) at its
      back, behind the warehouse, and a little sandy beach there (BEACH). The run's one way in is off the
      penguins' water (only a Vegas over the whirlpools gets there: KIKKIT), turning out of it to the
      right; its top square opens onto the whirlpools' wind beside the penguins, the way home (the winds
      throw her back to Kikkit's island, as from anywhere in them). Nothing to do there yet: the place
      for smuggling (Helium's rum) to plug into later. */
  SMUGGLERS: {
    RUN: [[17, 22], [17, 23], [18, 23], [18, 24], [18, 25], [18, 26], [18, 27], [18, 28], [18, 29], [18, 30]] as [number, number][],
    COVE: [[18, 31], [17, 31], [16, 31], [18, 32], [17, 32], [16, 32], [15, 32]] as [number, number][],
    BEACH: [[15, 31]] as [number, number][],
    ROCKS: [
      // (the run's near side, between it and the open water off Port Decorum's right-hand shore, on from
      // the rocks round Vegas Island, round to the island's corner by the beach)
      [17, 26], [17, 27], [17, 28], [17, 29], [17, 30], [16, 30],
      // (its far side, from beside the whirlpools down to the cove)
      [18, 21], [18, 22], [19, 22], [19, 23], [19, 24], [19, 25], [19, 26], [19, 27], [19, 28], [19, 29], [19, 30], [19, 31], [19, 32],
      // (under the cove, and on round the island's back to its left-hand shore)
      [19, 33], [18, 33], [17, 33], [16, 33], [15, 33], [14, 32], [13, 32], [12, 32], [11, 32], [10, 32], [10, 31],
    ] as [number, number][],
  },
  /** Primates Rule, the user's war frigate (src/den-frigate.ts; src/den-moored.ts), at anchor, still to
      come (11 Nov: "add that to the scene somewhere so you can just, once you start getting out to sea,
      you just kind of see that out there and put [a mark] on it. [To] make it clear, it's kind of a
      to-do item"). Moved (11 Nov) from just off the trade winds' first run out from the beach to the
      deeper water out past Port Decorum, to its left (the user: "it's ready for that [war frig] to be
      dropped in maybe a bit past in that same kind of deeper ocean area near where the [Port Decorum]
      is ... if you go over to the left, you'll ... find the [war frig]"): broadside on to the den, her
      bow out to the right, toward the island, in the old wreck's wind (ZONES) that runs out to the
      sea's edge. AT: the squares she lies across (four: she's about four squares long), which she
      can't be sailed through; open sea two squares deep all round her (the sea grew for it: SAIL.ROWS). */
  PRIMATES: {
    AT: [[3, 34], [4, 34], [5, 34], [6, 34]] as [number, number][],
  },
  /** The sloop race's course, out past Primates Rule (11 Nov): see RACE_LAY above. */
  RACE: RACE_LAY,
};

/** The canal's squares: its locks and the water between them (the hidden cove's too). */
export function canalAt(c: number, r: number): boolean {
  const { c0, c1, r0, r1 } = LAY.COVE;
  return LAY.LOCKS.some((l) => l.at[0] === c && l.at[1] === r) || LAY.POUNDS.some((p) => p.at.some(([x, y]) => x === c && y === r))
    || (c >= c0 && c <= c1 && r >= r0 && r <= r1);
}

/** The squares of the checkpoint's line that are built on (its piers and its guns' bastions), and
    the headland's (but for the canal cut through it): rocks to sail by, drawn by
    js/den/checkpoint.js, not as sea stacks. */
export function checkpointWorks(): [number, number][] {
  const K = LAY.CHECKPOINT, out: [number, number][] = [...K.PIERS, ...K.GUNS];
  const { c0, c1, r0, r1 } = K.HEADLAND;
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (!canalAt(c, r)) out.push([c, r]);
  return out;
}

/** Across and out for each way she can face. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const key = (c: number, r: number) => `${c},${r}`;
/** What the pilot weighs a course by: the seconds it takes to sail. A move is a move's sailing, its
    pause and its share of the turn's breather; a square of trade wind is a quick push. (Counting
    moves alone made the wind free, so she'd ride the whole loop round to save a move: 9 Nov, "the
    autopilot is going crazy around them".) */
const COST_TURN = SAIL.BREAK / SAIL.SLOTS, COST_PUSH = SAIL.PUSH;

/** The pause after a move, by how long the move took: the full pause after a move of SAIL.MOVE or
    more, less after a quicker one, so running before the wind (or rowing like crazy) she's quick
    all the way, not just between the pauses (10 Nov: "I'm not seeing like a big speed difference"). */
export const pauseFor = (secs: number): number => SAIL.PAUSE * Math.min(1, (secs / SAIL.MOVE) ** 2);

/** The squares a move passes through (one for forward, two for a turn), and how she ends up. */
export function path(p: Pose, m: Move): { cells: [number, number][]; to: Pose } {
  const a: [number, number] = [p.c + DC[p.d], p.r + DR[p.d]];
  if (m === 'F') return { cells: [a], to: { c: a[0], r: a[1], d: p.d } };
  const d = (p.d + (m === 'L' ? 3 : 1)) % 4, b: [number, number] = [a[0] + DC[d], a[1] + DR[d]];
  return { cells: [a, b], to: { c: b[0], r: b[1], d } };
}

/** A little seeded dice, so the same sea comes up for the same seed. */
function dice(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The board: its size and its rocks. Every open square can be sailed to from the mooring, and the
    water round the mooring is kept clear so you can always get out. */
export class Sea {
  readonly cols = SAIL.COLS;
  readonly rows = SAIL.ROWS;
  rocks = new Set<string>();
  /** The trade winds: the way each lane square blows (see LAY). */
  wind = new Map<string, number>();
  /** The cliffs the canal's cut through (rocks too), the hidden cove's water, the canal's water
      and its level (the cove's too), and the locks (src/den-lock.ts). */
  cliff = new Set<string>();
  cove = new Set<string>();
  pounds = new Map<string, number>();
  locks: LockSpot[] = [];
  junction: [number, number] | null = null;
  /** The squares built on (the checkpoint's piers and bastions, its headland) and the wreck's:
      rocks to sail by, drawn by their own 3D rather than as sea stacks. */
  works = new Set<string>();
  /** The old wreck beyond the checkpoint, if laid. */
  wreck: [number, number] | null = null;
  /** Patches of sea with a wind of their own (src/den-wind.ts), if laid. */
  zones: WindZone[] = [];
  /** The wind she sails by (src/den-wind.ts), if there's one. With none, every move takes
      SAIL.MOVE and goes any way. */
  breeze: Wind | null = null;
  /** Whirlpools (src/den-whirl.ts; Kikkit's: LAY.KIKKIT), each of their squares, and water only a
      gust gets to (her penguins'). Neither is open (the pilot never takes her into them, nor stops
      her there), but her own moves, a gust or the winds can put her on a whirlpool, and then it has
      her (Helm's twirl); a gust from the way through's mouth carries her clean over one, and one
      from anywhere else stops short of it (src/den-sailing.ts, gustPath). */
  whirls = new Map<string, Whirlpool>();
  pockets = new Set<string>();
  /** The way through the whirlpools (Kikkit's): every square of it, its whirlpools, their missing
      corners and the winds that feed them, the gap in the reef among them; and its mouths, where a
      gust starts into it on purpose, facing it (src/den-sailing.ts, gustPath: a gust from anywhere
      else stops short of it, so sailing by you never stumble through: 11 Nov). */
  passage = new Set<string>();
  mouths: Pose[] = [];
  /** The reef's rocks, drawn as one line of them (js/den/reef.js): the checkpoint's reef, out from
      its right-hand gun to the sea's edge but where the passage runs through it, and the rocks round
      the whirlpools and round Vegas Island. Rocks like any other to sail by. */
  reef = new Set<string>();
  /** Water reached only by way of the whirlpools (the smugglers' run and its cove: LAY.SMUGGLERS):
      open to sail on, but never got to from the den without them, so not counted when every open
      square's checked for a way there (allReachable). */
  hidden = new Set<string>();
  /** Squares the scattered rocks keep off: the lanes and everything round them. */
  private keep = new Set<string>();

  /** A sea of scattered rocks; with `lay`, the lanes, the canal and its locks, and the cove too (LAY). */
  constructor(seed = 1, lay = true) {
    if (lay) this.lay();
    for (let tries = 0; tries < 50; tries++) {
      this.scatter(dice(seed + tries * 7919));
      if (this.allReachable()) return;
    }
    this.scatter(() => 1);   // (never seen: no scattered rocks, rather than a stuck sea)
  }

  private lay() {
    const near = (c: number, r: number) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) this.keep.add(key(c + a, r + b)); };
    for (const { at: [c, r], d, n } of LAY.LANES) for (let i = 0; i < n; i++) {
      const x = c + DC[d] * i, y = r + DR[d] * i;
      this.wind.set(key(x, y), d);
      near(x, y);
    }
    for (const [c, r] of [LAY.JUNCTION, [LAY.JUNCTION[0], LAY.JUNCTION[1] + 1], ...LAY.CANAL] as [number, number][]) near(c, r);
    // (and the water round the harbour's arms and in front of it, so its way in is always open and
    // its arms stand clear, not lost among the scattered rocks)
    for (const [c, r] of LAY.HARBOUR) near(c, r - 1);
    const { c0, c1, r0, r1, level } = LAY.COVE;
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) { this.cove.add(key(c, r)); this.pounds.set(key(c, r), level); }
    for (const p of LAY.POUNDS) for (const [c, r] of p.at) this.pounds.set(key(c, r), p.level);
    this.locks = LAY.LOCKS.map((l) => ({ ...l, at: [...l.at] as [number, number] }));
    // The high ground round it all is cliff, but for the canal cut through it.
    const P = LAY.PLATEAU;
    for (let c = P.c0; c <= P.c1; c++) for (let r = P.r0; r <= P.r1; r++) if (!canalAt(c, r)) this.cliff.add(key(c, r));
    for (let c = P.c0; c <= P.c1 + 1; c++) for (let r = P.r0 - 1; r <= P.r1; r++) this.keep.add(key(c, r));
    this.junction = [...LAY.JUNCTION];
    // The checkpoint, its headland and the wreck beyond it (all outside where the rocks scatter).
    for (const [c, r] of [...checkpointWorks(), LAY.WRECK]) this.works.add(key(c, r));
    this.wreck = [...LAY.WRECK];
    // Mischievious's isle: land, drawn by its own 3D, and the water off its jetty kept clear of the
    // scattered rocks, so you never come in to land among them (11 Nov: rocks fell there on some seas).
    for (const [c, r] of LAY.ISLE.LAND) this.works.add(key(c, r));
    const I = LAY.ISLE.LANDING;
    for (let c = I.c0; c <= I.c1; c++) for (let r = I.r0; r <= I.r1; r++) this.keep.add(key(c, r));
    // Kikkit's island, land too, and her whirlpools and winds through the reef, the penguins' water
    // beyond them.
    for (const [c, r] of [...LAY.KIKKIT.LAND, ...LAY.KIKKIT.VEGAS]) this.works.add(key(c, r));
    for (const spot of LAY.KIKKIT.WHIRLS) { const w = whirlpool(spot); for (const [c, r] of w.squares) this.whirls.set(key(c, r), w); }
    for (const [c, r, d] of LAY.KIKKIT.WINDS) this.wind.set(key(c, r), d);
    this.pockets.add(key(...LAY.KIKKIT.PENGUINS));
    const KK = LAY.KIKKIT;
    for (const { at: [c, r] } of KK.WHIRLS) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) this.passage.add(key(c + a, r + b));
    for (const [c, r] of KK.WINDS) this.passage.add(key(c, r));
    // (its mouth, out through the gap; and past the reef, on out to the penguins: a Vegas's)
    this.mouths = [{ ...KK.MOUTH }, { c: KK.OUT[0], r: KK.OUT[1], d: KK.MOUTH.d }];
    // Tzz's island, a hop from Kikkit's: land, and the water round it kept clear.
    for (const [c, r] of LAY.TZZ.LAND) { this.works.add(key(c, r)); near(c, r); }
    // Port Decorum, the imperial island: land, the same.
    for (const [c, r] of LAY.EMPIRE.LAND) { this.works.add(key(c, r)); near(c, r); }
    // The smugglers' run, its cove and beach, behind Port Decorum: water only the whirlpools get to,
    // the beach land; its rocks are the reef's (scatter).
    for (const [c, r] of [...LAY.SMUGGLERS.RUN, ...LAY.SMUGGLERS.COVE]) this.hidden.add(key(c, r));
    for (const [c, r] of LAY.SMUGGLERS.BEACH) this.works.add(key(c, r));
    // Primates Rule at anchor: in the way, drawn by her own 3D (js/den/moored.js), open sea two deep
    // round her (no scattered rocks fall there).
    for (const [c, r] of LAY.PRIMATES.AT) {
      this.works.add(key(c, r));
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) this.keep.add(key(c + a, r + b));
    }
    this.zones = LAY.ZONES.map((z) => ({ ...z }));
    // The sloop race's course out past her (LAY.RACE; src/den-race.ts): its spits and wall (land, drawn
    // by js/den/race.js), its whirlpool reef and the winds round it (a way through, as Kikkit's, its
    // mouth on the third leg), its locks and canal, the trade wind home, and its breezes. (Its line of
    // rocks is the reef's: scatter.)
    const RC = LAY.RACE;
    for (const [c, r] of [...RC.LAND.flat(), ...RC.WALL]) this.works.add(key(c, r));
    for (const spot of RC.WHIRLS.POOLS) {
      const w = whirlpool(spot);
      for (const [c, r] of w.squares) this.whirls.set(key(c, r), w);
      for (const [c, r] of w.corners) this.passage.add(key(c, r));
    }
    for (const [c, r, d] of RC.WHIRLS.WINDS) { this.wind.set(key(c, r), d); this.passage.add(key(c, r)); }
    this.mouths.push({ ...RC.WHIRLS.MOUTH });
    const L = RC.LANE;
    for (let i = 0; i < L.n; i++) this.wind.set(key(L.at[0] + DC[L.d] * i, L.at[1] + DR[L.d] * i), L.d);
    this.locks.push(...RC.LOCKS.map((l) => ({ ...l, at: [...l.at] as [number, number] })));
    for (const [c, r] of RC.POUND.at) this.pounds.set(key(c, r), RC.POUND.level);
    this.zones.push(...RC.ZONES.map((z) => ({ ...z })));
  }

  private scatter(roll: () => number) {
    const laid = this.wind.size > 0, K = LAY.CHECKPOINT;
    const reef = laid ? Array.from({ length: K.REEF.c1 - K.REEF.c0 + 1 }, (_, i) => key(K.REEF.c0 + i, K.ROW)) : [];
    // (the reef but where Kikkit's whirlpools and winds run through it; the rocks round them; and the
    // smugglers' rocks round Port Decorum's back)
    this.reef = new Set([...reef.filter((k) => !this.whirls.has(k) && !this.wind.has(k)), ...[...LAY.KIKKIT.REEF, ...LAY.SMUGGLERS.ROCKS, ...LAY.RACE.REEF].filter(() => laid).map(([c, r]) => key(c, r))]);
    this.rocks = new Set([...this.cliff, ...this.works, ...this.reef, ...[...LAY.SIDES, ...LAY.FAR, ...LAY.HARBOUR].filter(() => laid).map(([c, r]) => key(c, r))]);
    const H = SAIL.HOME, COLS = SAIL.SCATTER.COLS, ROWS = SAIL.SCATTER.ROWS;
    for (let n = 0; n < SAIL.CLUMPS; n++) {
      let c = Math.floor(roll() * COLS), r = 2 + Math.floor(roll() * (ROWS - 2));
      const size = 1 + Math.floor(roll() * 3);
      for (let i = 0; i < size; i++) {
        if ((Math.abs(c - H.c) > 2 || r > 3) && !this.keep.has(key(c, r)) && c < COLS && r < ROWS) this.rocks.add(key(c, r));
        if (roll() < 0.5) c += roll() < 0.5 ? -1 : 1; else r += roll() < 0.5 ? -1 : 1;
        if (c < 0 || c >= COLS || r < 1 || r >= ROWS) break;
      }
    }
  }

  /** The way the trade wind blows on this square, if it's a lane. */
  windAt(c: number, r: number): number | undefined { return this.wind.get(key(c, r)); }
  /** The lock on this square (its number, as LAY.LOCKS), or -1. */
  lockAt(c: number, r: number): number { return this.locks.findIndex((l) => l.at[0] === c && l.at[1] === r); }
  isLock(c: number, r: number): boolean { return this.lockAt(c, r) >= 0; }
  /** High ground on this square: the cliffs the canal's cut through, or the checkpoint's headland
      and works. */
  ground(c: number, r: number): boolean { return this.cliff.has(key(c, r)) || this.works.has(key(c, r)); }
  /** The level the top of high ground on this square stands a bank's height over: the highest water
      beside it (a lock counted full), and never less than a level, so the cliffs step up the locks
      with the canal (js/den/sea.js draws them to it: bankTop). */
  bank(c: number, r: number): number {
    let top = 1;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const i = this.lockAt(c + a, r + b);
      top = Math.max(top, i >= 0 ? this.locks[i].low + 1 : this.level(c + a, r + b));
    }
    return top;
  }
  /** The water's level here: the sea's 0, a lock's lift up for each lock up the canal (a lock's own
      is its low side's here: how full it is is the helm's, Helm.lockAt). */
  level(c: number, r: number): number {
    const l = this.pounds.get(key(c, r));
    if (l !== undefined) return l;
    const i = this.lockAt(c, r);
    return i >= 0 ? this.locks[i].low : 0;
  }

  /** Swept along by the trade winds from here, a square at a time, facing the way it blows, till
      she's off the lane (or would hit something). With `whirls`, as she really goes: onto a
      whirlpool, if the wind blows her there, and it has her (Helm's twirl); without, as the pilot
      reckons, stopping short of one. */
  ride(p: Pose, whirls = false): Pose[] {
    const out: Pose[] = [];
    let at = p;
    for (let d = this.windAt(at.c, at.r); d !== undefined && out.length < 64; d = this.windAt(at.c, at.r)) {
      const c = at.c + DC[d], r = at.r + DR[d], into = whirls && this.whirls.has(key(c, r));
      if (!into && !this.open(c, r)) break;
      at = { c, r, d };
      out.push(at);
      if (into) break;
    }
    return out;
  }

  /** The wind zone this square's in, if any. */
  zoneAt(c: number, r: number): WindZone | null { return this.zones.find((z) => inZone(z, c, r)) ?? null; }

  /** The wind she feels sailing into this square: a zone's, if it's in one, else the weather's
      (none with neither). */
  airAt(c: number, r: number): Air | null {
    const z = this.zoneAt(c, r);
    return z ? zoneAir(z) : this.breeze ? weather(this.breeze.d, this.breeze.s) : null;
  }

  /** A move's legs: each square she sails into, the way she's heading as she does, and the wind she
      feels on it, the wind where she's going (one leg for forward, two for a turn). */
  private legs(p: Pose, m: Move): { d: number; air: Air | null }[] {
    const { cells, to } = path(p, m), heads = m === 'F' ? [p.d] : [p.d, to.d];
    return cells.map(([c, r], i) => ({ d: heads[i], air: this.airAt(c, r) }));
  }

  /** Under sail (not at the oars), whether this move would take her a square against the wind
      where she's going: then she's in irons, and makes no way (src/den-wind.ts). */
  irons(p: Pose, m: Move, oars = false): boolean {
    return !oars && this.legs(p, m).some(({ d, air }) => !!air && against(d, air));
  }

  /** A move and what the trade wind does after it. In irons, or blocked, she stays where she is (a
      turn turning her on the spot): `bump` either way, and `irons` too if it was the wind. With
      `whirls`, as she really goes (Helm): a whirlpool's squares are water she sails into, and it has
      her; without, as the pilot reckons, they're in her way. */
  move(p: Pose, m: Move, oars = false, whirls = false): { to: Pose; bump: boolean; ride: Pose[]; irons?: boolean } {
    const { cells, to } = path(p, m);
    if (this.irons(p, m, oars)) return { to: { c: p.c, r: p.r, d: m === 'F' ? p.d : to.d }, bump: true, ride: [], irons: true };
    if (cells.every(([c, r]) => this.open(c, r) || (whirls && this.whirls.has(key(c, r))))) return { to, bump: false, ride: this.ride(to, whirls) };
    return { to: { c: p.c, r: p.r, d: to.d }, bump: true, ride: [] };
  }

  /** The whirlpool on this square, if there's one. */
  whirlAt(c: number, r: number): Whirlpool | undefined { return this.whirls.get(key(c, r)); }
  /** Whether a move from here would put her on a whirlpool, as she really goes (by its own squares
      or the trade wind after it): the pilot never makes it. */
  whirly(p: Pose, m: Move, oars = false): boolean {
    if (!this.whirls.size) return false;
    const got = this.move(p, m, oars, true);
    return !got.bump && [got.to, ...got.ride, ...path(p, m).cells.map(([c, r]) => ({ c, r }))].some((q) => this.whirls.has(key(q.c, q.r)));
  }

  /** The seconds a move takes: at the oars (a square on its own: see Helm for a pile of them), or
      under sail in the wind there is, by how she lies to it on the way (a turn's two squares
      shared; in a calm, as in light airs, which is what she'll have when it picks up). Without a
      move, a reach's. A move in irons swings her head round in a reach's time. */
  moveSecs(oars = false, p?: Pose, m?: Move): number {
    const legs = p && m ? this.legs(p, m) : [], still = this.breeze ? weather(this.breeze.d, this.breeze.s) : null;
    if (!still && !legs.some((l) => l.air)) return SAIL.MOVE;
    if (oars) return WIND.OARS;
    // (in a calm, as in light airs: what she'll have when it picks up)
    const secs = (a: Air | null, point: 'run' | 'reach' | 'into' = 'reach') => (a ? sailTime(a.s === 0 ? { ...a, s: 1 } : a, point) : SAIL.MOVE);
    if (!legs.length) return secs(still);
    // In irons: a reach's time in the wind that heads her off.
    const head = legs.find(({ d, air }) => !!air && against(d, air));
    if (head) return secs(head.air);
    return legs.reduce((t, { d, air }) => t + secs(air, air ? lie(d, air) : 'reach'), 0) / legs.length;
  }

  /** On the board and not a rock. */
  open(c: number, r: number): boolean {
    const k = key(c, r);
    return c >= 0 && c < this.cols && r >= 0 && r < this.rows && !this.rocks.has(k) && !this.whirls.has(k) && !this.pockets.has(k);
  }

  isRock(c: number, r: number): boolean { return this.rocks.has(key(c, r)); }

  /** Sailing a move from here: where she ends up, and whether she hit something. Forward into a
      rock (or off the edge of the board) and she stays put; a turn that's blocked turns her where
      she is. */
  sail(p: Pose, m: Move, oars = false): { to: Pose; bump: boolean } {
    const { to, bump, ride } = this.move(p, m, oars);
    return { to: ride.length ? ride[ride.length - 1] : to, bump };
  }

  /** Where the trade wind sweeping her on from this lane square drops her off (the square itself,
      if it isn't a lane). */
  dropOff(c: number, r: number): [number, number] {
    const d = this.windAt(c, r);
    if (d === undefined) return [c, r];
    const ride = this.ride({ c, r, d }), end = ride[ride.length - 1];
    return end ? [end.c, end.r] : [c, r];
  }

  /** The lane squares she can sail onto to be swept over this one: it, and every square upwind of
      it on the same wind. */
  private boarding(k: [number, number]): Set<string> {
    const out = new Set<string>();
    for (const [id, d] of this.wind) {
      const [c, r] = id.split(',').map(Number);
      if ((c === k[0] && r === k[1]) || this.ride({ c, r, d }).some((p) => p.c === k[0] && p.r === k[1])) out.add(id);
    }
    return out;
  }

  private plots = new Map<string, Move[] | null>();

  /** The pilot: the quickest way from here to that square (facing any way), never sailing into a
      rock, though a turn that's blocked can turn her where she is (facing the shore at the board's
      edge, that's the only way round). Quickest by the clock, not the fewest moves: a ride on the
      trade wind is quick but not free, so she takes a lane when it saves time and never rides the
      loop round just to save a move; and going up a lock costs her a go of Bilge, so she goes
      through the locks only where they're the way. And the locks are yours to find: from the open
      sea to a pin on the open sea she's never taken up one (going down's fine), only when she's on
      the canal already or the pin is. With `via` (a lane square), she gets there by riding that
      lane: onto it at that square or upwind of it, and the wind carries her to the pin. Under sail
      (`oars` false), by the wind there is: never a square against it, each move the seconds it
      takes in that wind; at the oars, any way, at the oars' steady pace. Null if there's no way
      there. */
  plot(from: Pose, c: number, r: number, via: [number, number] | null = null, oars = false): Move[] | null {
    if (!this.open(c, r)) return null;
    if (!via && from.c === c && from.r === r) return [];
    const memo = `${from.c},${from.r},${from.d}|${c},${r}|${via ?? ''}|${this.rocks.size},${this.wind.size}|${this.rig(oars)}`;
    if (!this.plots.has(memo)) {
      if (this.plots.size > 256) this.plots.clear();
      const up = this.canal(from.c, from.r) || this.canal(c, r);
      this.plots.set(memo, this.quickest(from, c, r, via ? this.boarding(via) : null, oars, up));
    }
    const got = this.plots.get(memo);
    return got ? [...got] : null;
  }

  /** Up off the sea: on the canal's water above it, or in a lock. */
  private canal(c: number, r: number): boolean { return this.level(c, r) > 0 || this.isLock(c, r); }

  /** What the moves hang on besides the rocks: under sail, the way the wind blows and how hard; at
      the oars (or with no wind), nothing. */
  private rig(oars: boolean): string { return oars ? 'oars' : !this.breeze ? 'still' : `sail${this.breeze.d}${this.breeze.s}`; }

  /** Where each move takes her from each pose (worked out as needed, and again if the rocks or
      the winds change; a set for each rig): the pose she ends up in, her squares of trade wind,
      whether she bumped, and the square the move itself ended on (before the trade wind). Poses
      are numbered ((c * rows + r) * 4 + d). */
  private edges = new Map<string, Map<number, { end: number; ride: number; bump: boolean; on: number; secs: number; up: boolean; whirl: boolean }[]>>();
  /** What going into a lock costs her by this move, if it does (src/den-lock.ts, lockCost: Bilge to
      raise her; down's quick), and whether it's up. Into it from the square before it on the move. */
  private lockToll(p: Pose, m: Move, bump: boolean): { secs: number; up: boolean } {
    const none = { secs: 0, up: false };
    if (bump || !this.locks.length) return none;
    const { cells } = path(p, m), [c, r] = cells[cells.length - 1], i = this.lockAt(c, r);
    if (i < 0) return none;
    const [pc, pr] = cells.length > 1 ? cells[0] : [p.c, p.r];
    if (this.isLock(pc, pr)) return none;
    const lv = this.level(pc, pr);
    return { secs: lockCost(this.locks[i], lv), up: lv <= this.locks[i].low };
  }
  private edgesFor = '';
  private from(id: number, oars: boolean) {
    const sig = `${this.rocks.size},${this.wind.size},${this.zones.length}`;
    if (sig !== this.edgesFor) { this.edges.clear(); this.edgesFor = sig; }
    const rig = this.rig(oars);
    let set = this.edges.get(rig);
    if (!set) this.edges.set(rig, set = new Map());
    let got = set.get(id);
    if (!got) {
      const p: Pose = { c: Math.floor(id / 4 / this.rows), r: Math.floor(id / 4) % this.rows, d: id % 4 };
      got = (['F', 'L', 'R'] as Move[]).map((m) => {
        const { to, bump, ride } = this.move(p, m, oars), end = ride.length ? ride[ride.length - 1] : to;
        const secs = this.moveSecs(oars, p, m), toll = this.lockToll(p, m, bump);
        return { end: (end.c * this.rows + end.r) * 4 + end.d, ride: ride.length, bump, on: to.c * this.rows + to.r, secs: secs + pauseFor(secs) + toll.secs, up: toll.up, whirl: this.whirly(p, m, oars) };
      });
      set.set(id, got);
    }
    return got;
  }

  /** Dijkstra over where she can be and the way she faces, by the seconds it takes (at the oars,
      or under sail in the wind there is, by how she lies to it on each move); up a lock only with
      `up`. */
  private quickest(from: Pose, c: number, r: number, boards: Set<string> | null, oars: boolean, up: boolean): Move[] | null {
    const N = this.cols * this.rows * 4, MOVES: Move[] = ['F', 'L', 'R'];
    const best = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), how = new Int8Array(N), done = new Uint8Array(N);
    const board = new Uint8Array(this.cols * this.rows);
    if (boards) for (const k of boards) { const [x, y] = k.split(',').map(Number); board[x * this.rows + y] = 1; }
    const goalSq = c * this.rows + r;
    // A little heap of [seconds, order found, pose], quickest (then first found) on top.
    const heap: [number, number, number][] = [];
    const less = (x: [number, number, number], y: [number, number, number]) => x[0] < y[0] - 1e-9 || (Math.abs(x[0] - y[0]) <= 1e-9 && x[1] < y[1]);
    const push = (e: [number, number, number]) => {
      heap.push(e);
      for (let i = heap.length - 1; i > 0;) {
        const j = (i - 1) >> 1;
        if (!less(e, heap[j])) break;
        heap[i] = heap[j]; heap[j] = e; i = j;
      }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ;) {
          const a = 2 * i + 1, b = a + 1;
          let k = i;
          if (a < heap.length && less(heap[a], heap[k])) k = a;
          if (b < heap.length && less(heap[b], heap[k])) k = b;
          if (k === i) break;
          [heap[i], heap[k]] = [heap[k], heap[i]]; i = k;
        }
      }
      return top;
    };
    let n = 0, goal: { cost: number; at: number; m: number } | null = null;
    const s0 = (from.c * this.rows + from.r) * 4 + from.d;
    best[s0] = 0; push([0, n++, s0]);
    while (heap.length) {
      const [t, , at] = pop();
      if (goal && t >= goal.cost - 1e-9) break;
      if (done[at]) continue;
      done[at] = 1;
      const out = this.from(at, oars);
      for (let m = 0; m < out.length; m++) {
        const e = out[m], cost = t + e.secs + COST_TURN + e.ride * COST_PUSH;
        if ((e.up && !up) || e.whirl) continue;   // (and never onto a whirlpool: it'd have her)
        if (e.end >> 2 === goalSq && (!boards || (!e.bump && board[e.on]))) {
          if (!goal || cost < goal.cost - 1e-9) goal = { cost, at, m };
          continue;
        }
        if (done[e.end] || best[e.end] <= cost + 1e-9) continue;
        best[e.end] = cost; prev[e.end] = at; how[e.end] = m;
        push([cost, n++, e.end]);
      }
    }
    if (!goal) return null;
    const moves: Move[] = [MOVES[goal.m]];
    for (let at = goal.at; prev[at] >= 0; at = prev[at]) moves.unshift(MOVES[how[at]]);
    return moves;
  }

  /** Where a pin dropped here lands, and the lane she rides to get there, if any. Dropped on a trade
      wind it means "ride this lane": the pin goes to where the wind drops her off (the lane's end,
      or the junction), and she gets there by riding it. Otherwise it's the nearest open square she
      can get to and stop in (off the board, or on a rock or a lock, it moves to the nearest that's
      open). */
  pinFor(c: number, r: number, from: Pose = SAIL.HOME): { at: [number, number]; via: [number, number] | null } | null {
    const cc = Math.max(0, Math.min(this.cols - 1, Math.round(c))), rr = Math.max(0, Math.min(this.rows - 1, Math.round(r)));
    if (this.windAt(cc, rr) !== undefined) {
      const at = this.dropOff(cc, rr), via: [number, number] = [cc, rr];
      if (this.plot(from, ...at, via, true)) return { at, via };
    }
    for (let ring = 0; ring < Math.max(this.cols, this.rows); ring++) {
      const near: [number, number][] = [];
      for (let dc = -ring; dc <= ring; dc++) for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) === ring) near.push([cc + dc, rr + dr]);
      }
      near.sort((a, b) => Math.hypot(a[0] - c, a[1] - r) - Math.hypot(b[0] - c, b[1] - r));
      for (const [x, y] of near) if (this.open(x, y) && this.windAt(x, y) === undefined && !this.isLock(x, y) && this.plot(from, x, y, null, true)) return { at: [x, y], via: null };
    }
    return null;
  }
  /** Just where the pin lands (see pinFor). */
  pinAt(c: number, r: number, from: Pose = SAIL.HOME): [number, number] | null { return this.pinFor(c, r, from)?.at ?? null; }

  private allReachable(): boolean {
    const H = SAIL.HOME;
    if (!this.open(H.c, H.r)) return false;
    const got = new Set<string>([key(H.c, H.r)]), seen = new Set<string>();
    let edge: Pose[] = [H];
    while (edge.length) {
      const next: Pose[] = [];
      for (const p of edge) for (const m of ['F', 'L', 'R'] as Move[]) {
        const { to, bump } = this.sail(p, m, true), s = `${to.c},${to.r},${to.d}`;
        if (bump || seen.has(s)) continue;
        seen.add(s); got.add(key(to.c, to.r)); next.push(to);
      }
      edge = next;
    }
    // (She can't stop on a lane: the wind always sweeps her on.)
    // (nor is the water only the whirlpools get to: Sea.hidden)
    for (let c = 0; c < this.cols; c++) for (let r = 0; r < this.rows; r++) if (this.open(c, r) && this.windAt(c, r) === undefined && !this.hidden.has(key(c, r)) && !got.has(key(c, r))) return false;
    return true;
  }
}

/** Where she is partway (u, 0 to 1) through a move, for drawing: across and out in squares (the
    middle of a square is a whole number) and the way she faces, in quarter turns. A turn sweeps a
    quarter circle; a bump lurches forward and back, or turns her on the spot. */
export function poseAt(p: Pose, m: Move, u: number, bump = false): { c: number; r: number; a: number } {
  const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  if (m === 'F') {
    const k = bump ? 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) : e;
    return { c: p.c + DC[p.d] * k, r: p.r + DR[p.d] * k, a: p.d };
  }
  const s = m === 'L' ? -1 : 1, a = p.d + s * e;
  if (bump) return { c: p.c, r: p.r, a };
  const side = (p.d + (m === 'L' ? 3 : 1)) % 4, mc = p.c + DC[side], mr = p.r + DR[side];
  const x = -DC[side], y = -DR[side], th = (m === 'L' ? 1 : -1) * e * Math.PI / 2;
  return { c: mc + x * Math.cos(th) - y * Math.sin(th), r: mr + x * Math.sin(th) + y * Math.cos(th), a };
}

/** What happened on a tick: a turn began, a move began (where from, where to, and whether she
    bumped), or she got to the pin. */
export type SailEvent =
  | { kind: 'turn'; moves: Move[] }
  | { kind: 'move'; i: number; m: Move; from: Pose; to: Pose; bump: boolean; irons: boolean; secs: number }
  /** A square of trade wind sweeping her on, of a gust (`gust`), or a whirlpool whirling her round to
      its far corner (`whirl`: src/den-whirl.ts). */
  | { kind: 'push'; from: Pose; to: Pose; gust?: boolean; whirl?: boolean }
  | { kind: 'arrive'; at: Pose }
  /** The pin's where the wind won't let her sail at all: she waits (said once for each pin). The
      pilot used to run the oars out and row her there itself, and the user (10 Nov) saw "a pop-up
      saying you can't sail there. Well, it is letting me". Now the oars are yours to run out: the
      rowing board is the steering while they're out (src/den-row.ts). */
  | { kind: 'headwind' }
  | WindEvent;

/** What she's waiting on, if anything: dazed by a hit (patch the hole in her deck), at a lock, for
    it to be pumped up by Bilge with her in it ('up'), to drain down, or to fill from above, by
    itself, or for its gates to swing open; or becalmed under sail, for the wind to pick up (or the
    oars). */
export type Held = 'daze' | LockNeed | 'gates' | 'calm' | null;

/** The helm: where she is, where she's headed, and the clock that plays the turns. */
export class Helm {
  pose: Pose;
  /** The pin: the square she's sailing for, if any. */
  pin: [number, number] | null = null;
  /** The lane square the pin was dropped on, if it was: she rides that lane to the pin. */
  via: [number, number] | null = null;
  /** Moves you've put in yourself, played before the pilot's. */
  mine: Move[] = [];
  /** The turn being played: its moves, which one's on, and how far into it. */
  turn: Move[] = [];
  slot = -1;
  t = 0;
  /** What's being sailed just now: a move, or a square of trade wind ('W') sweeping her on (or a
      whirlpool whirling her round, by the corner `via`). */
  cur: { m: Move | 'W'; from: Pose; to: Pose; bump: boolean; secs: number; pause: number; irons?: boolean; done?: boolean; via?: [number, number] } | null = null;
  /** Whirls in a row since she last moved of her own accord or a gust took her (WHIRL.MOST). */
  spins = 0;
  /** The squares of trade wind still to come after it. */
  rides: Pose[] = [];
  /** The locks on her sea and their water (src/den-lock.ts), as LAY.LOCKS: they start drained. */
  locks: Lock[];
  /** The hole the last hit knocked in her deck: she's dazed till it's patched. */
  hole: DeckHole | null = null;
  /** Seconds the guns that shoot at her still hold fire after she's patched (SAIL.GRACE). */
  grace = 0;
  /** Her oars out (she's rowed by the port-and-starboard board, any way, whatever the wind) or
      shipped (she sails, by the wind). */
  oars = false;
  /** At the oars, the squares the board's rowed that she's still to row (Oars hands them out:
      src/rowing.ts). The pin and the pilot don't steer her while the oars are out: the board does. */
  strokes: Move[] = [];
  /** The seconds each rowed square takes just now: set by the biggest pile of them rowed and
      waiting since she last caught up, so a Vegas is rowed at a rush all the way (rowTime). */
  pace: number = WIND.OARS;
  /** A gust's squares still to come (a Sailing chain's run: src/den-sailing.ts), played as the trade
      winds' are, after the move she's on (and its ride). */
  gusts: Pose[] = [];
  /** The gust blowing came with no move of a turn on, so it's no step of one. */
  private free = false;
  /** The headwind's been said for this pin. */
  private told = false;
  private wait = 0;

  constructor(public sea: Sea, pose: Pose = SAIL.HOME) {
    this.pose = { ...pose };
    this.locks = sea.locks.map((s) => new Lock(s));
  }

  /** The lock on this square, if there's one. */
  lockAt(c: number, r: number): Lock | null { return this.locks[this.sea.lockAt(c, r)] ?? null; }

  /** Where she'll be when this turn's played out. */
  after(): Pose {
    let p = this.gustFrom();
    if (this.slot < 0) return { ...p };
    for (let i = this.slot + (this.cur && !this.free ? 1 : 0); i < this.turn.length; i++) p = this.sea.sail(p, this.turn[i], this.oars).to;
    return { ...p };
  }

  /** The course from the end of this turn on: your moves, then the pilot's to the pin (under sail
      or at the oars, as she is). */
  course(): Move[] {
    if (this.oars) return [...this.strokes];
    let p = this.after();
    for (const m of this.mine) p = this.sea.sail(p, m, this.oars).to;
    const pilot = this.pin ? this.sea.plot(p, ...this.pin, this.via, this.oars) ?? [] : [];
    return [...this.mine, ...pilot];
  }

  /** Where a gust given now would start from: where she'll be once the move she's on, its trade
      wind and any gust already blowing are done. */
  gustFrom(): Pose {
    if (this.gusts.length) return { ...this.gusts[this.gusts.length - 1] };
    return { ...(this.cur ? (this.rides.length ? this.rides[this.rides.length - 1] : this.cur.to) : this.pose) };
  }
  /** A gust can carry her: not while she's holed, nor waiting on a lock (a calm's fine: it's wind). */
  gusty(): boolean {
    const h = this.held();
    return !this.dazed() && (!h || h === 'calm') && !this.sea.isLock(this.pose.c, this.pose.r);
  }
  /** A gust: these squares (src/den-sailing.ts, gustPath), blown straight on, after the move she's
      on; ending on a trade wind's lane, the wind takes her on from there. */
  gust(squares: Pose[]) {
    if (!squares.length) return;
    this.gusts.push(...squares.map((p) => ({ ...p })), ...this.sea.ride(squares[squares.length - 1], true));
    this.spins = 0;
  }

  /** A whirlpool will have her next: she's on one, and it hasn't yet turned her right round. */
  whirling(): boolean { return this.spins < WHIRL.MOST && !!this.sea.whirlAt(this.pose.c, this.pose.r); }

  /** Run the oars out, or ship them (a toggle, with nothing said). Always yours to choose: the pilot
      never does. Out, the board rows her (stroke) and your own moves go; either way the rest of a
      turn under way goes after the move she's on, as it was planned for the other rig. Shipped,
      she sails on to the pin, if there is one, by the wind. */
  row(on = !this.oars): boolean {
    if (on === this.oars) return on;
    this.oars = on;
    this.strokes = [];
    this.pace = WIND.OARS;
    if (on) this.mine = [];
    if (this.slot >= 0) {
      this.turn = this.turn.slice(0, this.slot + (this.cur ? 1 : 0));
      if (!this.cur) { this.turn = []; this.slot = -1; this.wait = 0; }
    }
    this.told = false;
    if (!on && (this.pin || this.mine.length)) this.woken();
    return on;
  }

  /** Squares rowed on the board (Oars hands them out): she rows them in turn, straight away, the
      more of them waiting the quicker (rowTime, and `pace`). Only while her oars are out. */
  stroke(steps: Move[]) {
    if (!this.oars || !steps.length) return;
    this.strokes.push(...steps);
    const ahead = this.strokes.length + (this.slot >= 0 ? this.turn.length - this.slot - (this.cur ? 1 : 0) : 0);
    this.pace = Math.min(this.pace, rowTime(ahead));
  }

  /** The token on the sailing bar that's being sailed just now, if any: not while she waits (10 Nov:
      "in a calm, the first token of 'This turn' lights up though she isn't moving"). */
  lit(): number { return this.cur ? this.slot : -1; }

  /** Under sail in a calm: dead in the water. */
  becalmed(): boolean { return !this.oars && this.sea.breeze?.s === 0; }

  /** A pin she can't sail to in this wind, and the pilot won't row for (you shipped the oars). */
  headwind(): boolean {
    return !!this.pin && !this.oars && !this.mine.length && !this.sea.plot(this.after(), ...this.pin, this.via) && !!this.sea.plot(this.after(), ...this.pin, this.via, true);
  }

  /** What the next turn will play. */
  next(): Move[] { return this.oars ? this.strokes.slice(0, SAIL.SLOTS) : this.course().slice(0, SAIL.SLOTS); }

  private woken() { if (this.slot < 0 && this.wait <= 0) this.wait = SAIL.WAKE; }

  /** Drop the pin (near where you pointed: see Sea.pinFor). On a trade wind, it goes to where the
      wind will drop her off, and she rides that lane to get there. */
  drop(c: number, r: number): [number, number] | null {
    const got = this.sea.pinFor(c, r, this.after());
    if (!got) return null;
    this.pin = got.at; this.via = got.via; this.told = false;
    // On the lane she's riding already, ahead of her: she's on her way there.
    const v = got.via, riding = this.cur ? [this.cur.to, ...this.rides] : [];
    if (v && this.rides.length + (this.cur?.m === 'W' ? 1 : 0) > 0 && riding.some((p) => p.c === v[0] && p.r === v[1])) this.via = null;
    if (!this.via && got.at[0] === this.after().c && got.at[1] === this.after().r && !this.mine.length) this.pin = null;
    else this.woken();
    return got.at;
  }

  /** Put in a move yourself (up to a turn's worth ahead). */
  put(m: Move): boolean {
    if (this.mine.length >= SAIL.SLOTS) return false;
    this.mine.push(m);
    this.woken();
    return true;
  }
  /** Take back the last move you put in. */
  unput(): Move | undefined { return this.mine.pop(); }
  /** Pull up the pin and forget your moves: she stops when this turn's done (or straight away,
      if she's waiting at a lock). */
  stop() {
    this.pin = null; this.via = null; this.mine = [];
    if (!this.cur && this.slot >= 0) { this.turn = []; this.slot = -1; this.wait = SAIL.BREAK; }
  }
  /** Brought in to her mooring and made fast, whatever she was doing: no pin, no moves, nothing
      playing (going ashore from anywhere along the den's beach: src/den-beach.ts; or at another
      mooring, `at`: Mischievious's isle's, src/den-isle.ts). */
  moor(at: Pose = SAIL.HOME) {
    this.pin = null; this.via = null; this.mine = []; this.turn = []; this.slot = -1; this.t = 0;
    this.cur = null; this.rides = []; this.strokes = []; this.wait = 0; this.gusts = []; this.free = false; this.spins = 0;
    this.pose = { ...at };
  }

  /** Nothing playing and nothing to play. */
  idle(): boolean { return this.slot < 0 && !this.next().length; }

  /** Holed, and the hole not yet patched. */
  dazed(): boolean { return !!this.hole && !this.hole.done(); }
  /** Hit (by the checkpoint's guns, say): a hole in her deck, and she's dazed till it's patched. She
      finishes the move she's on (or the trade wind's ride), then waits. (A hit while she's holed
      already does nothing more: the guns hold fire then anyway.) */
  hit(cells: Cell[] = SAIL.HOLE) { if (!this.dazed()) { this.hole = new DeckHole(cells); this.grace = SAIL.GRACE; } }
  /** Not to be shot at just now: held up (dazed, or at a lock), or just patched and getting going.
      (Becalmed she's fair game: row out of reach.) */
  spared(): boolean { const h = this.held(); return (!!h && h !== 'calm') || this.grace > 1e-9; }

  /** What she's waiting on, if anything. */
  held(): Held {
    if (this.dazed()) return 'daze';
    if (this.slot >= 0 && !this.cur) {
      const g = this.gate(this.turn[this.slot]);
      return g?.need ?? (g && g.lock.gates > 1e-9 ? 'gates' : this.becalmed() ? 'calm' : null);
    }
    return null;
  }

  /** The lock she's waiting in to be pumped up by Bilge, if she is. */
  working(): Lock | null {
    if (this.dazed() || this.slot < 0 || this.cur) return null;
    const g = this.gate(this.turn[this.slot]);
    return g?.need === 'up' ? g.lock : null;
  }

  /** A move of Bilge's worth: pumps the lock up if she's waiting in it to go up. What it went to. */
  pump(w: number): 'lock' | null {
    const l = this.working();
    if (!l) return null;
    l.pump(w);
    return 'lock';
  }

  /** The lock this move takes her into or out of, if any, and what's in its way: through its gates
      only when its water's at the level of the side she's going to or from (src/den-lock.ts). */
  private gate(m: Move): { lock: Lock; need: LockNeed | null } | null {
    if (!this.locks.length) return null;
    const { cells } = path(this.pose, m);
    if (!cells.every(([c, r]) => this.sea.open(c, r))) return null;   // (she'll only bump)
    const seq: [number, number][] = [[this.pose.c, this.pose.r], ...cells];
    let first: Lock | null = null;
    for (let i = 0; i + 1 < seq.length; i++) {
      const a = this.sea.lockAt(...seq[i]), b = this.sea.lockAt(...seq[i + 1]);
      if (a === b) continue;
      const into = b >= 0, lock = this.locks[into ? b : a];
      const need = lock.need(this.sea.level(...(into ? seq[i] : seq[i + 1])), into);
      if (need) return { lock, need };
      first ??= lock;
    }
    return first ? { lock: first, need: null } : null;
  }

  /** Where she is right now, for drawing (see poseAt). */
  now(): { c: number; r: number; a: number } {
    if (!this.cur) return { c: this.pose.c, r: this.pose.r, a: this.pose.d };
    const { from, to, m } = this.cur;
    if (m === 'W' && this.cur.via) return whirlAt(from, to, Math.min(1, this.t / this.cur.secs));
    if (m === 'W') {
      const u = Math.min(1, this.t / SAIL.PUSH), turn = ((to.d - from.d + 6) % 4) - 2;
      return { c: from.c + (to.c - from.c) * u, r: from.r + (to.r - from.r) * u, a: from.d + turn * Math.min(1, u * 1.5) };
    }
    return poseAt(from, m, Math.min(1, this.t / this.cur.secs), this.cur.bump);
  }

  tick(dt: number): SailEvent[] {
    const out: SailEvent[] = [];
    let left = dt;
    // The wind drops, picks up and shifts as it will.
    if (this.sea.breeze) out.push(...this.sea.breeze.tick(dt));
    // Holed, the guns' grace waits for the patch; then it runs down.
    this.grace = this.dazed() ? SAIL.GRACE : Math.max(0, this.grace - dt);
    // The locks' water rising to what's been pumped in; full, the top gates swing open.
    for (const l of this.locks) l.rise(dt);
    for (let guard = 0; left > 1e-12 && guard < 1000; guard++) {
      if (this.cur) {
        // A move or a square of wind, then (after the last of the wind) the pause. Dazed, she
        // holds once the move's sailed; the wind sweeps her on regardless.
        const cur = this.cur, dur = cur.secs;
        const span = dur + (this.rides.length || this.gusts.length ? 0 : cur.pause), hold = this.dazed() && !this.rides.length;
        if (hold && cur.done) break;
        const use = hold ? Math.min(left, Math.max(0, dur - this.t)) : Math.min(left, span - this.t);
        this.t += use; left -= use;
        if (!cur.done && this.t >= dur - 1e-9) {
          cur.done = true;
          this.pose = { ...cur.to };
          // (Riding a lane to the pin, she's there when the wind drops her off on it.)
          if (this.pin && this.pose.c === this.pin[0] && this.pose.r === this.pin[1] && (!this.via || cur.m === 'W')) {
            this.pin = null; this.via = null;
            out.push({ kind: 'arrive', at: { ...this.pose } });
          }
        }
        if (this.t < span - 1e-9) continue;
        this.t = 0;
        if (this.rides.length) {
          const to = this.rides.shift()!;
          this.cur = { m: 'W', from: { ...this.pose }, to, bump: false, secs: SAIL.PUSH, pause: SAIL.PAUSE };
          out.push({ kind: 'push', from: { ...this.pose }, to: { ...to } });
          continue;
        }
        // A gust after it (src/den-sailing.ts): its squares, as the trade winds' are.
        if (this.gusts.length) { this.blow(out); continue; }
        // Come to rest on a whirlpool: it has her (after the move, as in Puzzle Pirates).
        if (this.twirl(out)) continue;
        this.cur = null;
        // (a gust that came with no move on is no step of the turn)
        if (this.free) { this.free = false; continue; }
        this.slot++;
        // At the oars, squares rowed since the turn began join it, up to a turn's worth; and there's
        // no breather after it: she rows whatever's been rowed.
        if (this.oars && this.turn.length < SAIL.SLOTS) this.turn.push(...this.strokes.splice(0, SAIL.SLOTS - this.turn.length));
        if (this.slot >= this.turn.length) { this.slot = -1; this.turn = []; this.wait = this.oars ? 0 : SAIL.BREAK; }
        continue;
      }
      // A gust with no move on: it blows her straight away (in a calm too).
      if (this.gusts.length && !this.dazed()) { this.free = true; this.blow(out); continue; }
      // Idle on a whirlpool (put there, say): it has her.
      if (this.slot < 0 && !this.dazed() && this.twirl(out)) { this.free = true; continue; }
      if (this.slot >= 0) {
        // The next move of the turn, unless she's dazed or waiting on a lock: to be pumped up (by
        // Bilge), or to drain down or fill from above (by itself), then for its gates.
        if (this.dazed()) break;
        const g = this.gate(this.turn[this.slot]);
        if (g && (g.need || g.lock.gates > 1e-9) && this.oars && this.sea.isLock(this.pose.c, this.pose.r)) this.ship();
        if (g?.need === 'up') break;
        if (g?.need) { left = g.lock.run(g.need === 'down' ? 0 : 1, left); continue; }
        if (g && g.lock.gates > 1e-9) { left = g.lock.open(left); continue; }
        // Under sail in a calm, she's dead in the water till the wind picks up (or the oars go out).
        if (this.becalmed()) break;
        this.begin(out);
        continue;
      }
      // Between turns: the breather, then the next turn, if there's anything to play.
      const use = Math.min(left, Math.max(0, this.wait));
      this.wait -= use; left -= use;
      for (const l of this.locks) l.gates = Math.max(0, l.gates - use);
      if (this.wait > 1e-9 || this.dazed()) break;
      // The pin's where the wind won't let her sail at all (against it): she waits, and says so
      // once. Rowing there is your call.
      if (!this.told && this.headwind()) { this.told = true; out.push({ kind: 'headwind' }); }
      const moves = this.next();
      if (!moves.length) break;
      if (this.oars) this.strokes.splice(0, moves.length);
      else this.mine.splice(0, Math.min(this.mine.length, moves.length));
      this.turn = moves; this.slot = 0; this.t = 0;
      out.push({ kind: 'turn', moves: [...moves] });
    }
    return out;
  }

  /** Rowed into a lock, she ships her oars there while she waits on it (the user, 10 Nov: "once you
      get through the lock and you figured out the rowing, it should auto switch back to sailing so
      that it doesn't make it seem like you're having bilge the whole way through"): the move out
      of it she's waiting to make stays, and she makes it under sail once its gates open; what else
      was rowed is let go. Nothing's said. */
  private ship() {
    this.oars = false;
    this.strokes = [];
    this.pace = WIND.OARS;
    this.turn = this.turn.slice(0, this.slot + 1);
    this.told = false;
  }

  /** A whirl, if she's on a whirlpool (src/den-whirl.ts): round by the next corner, clockwise, to the
      opposite one, turned a quarter clockwise; then, if that's a wind, it takes her on. Whether it
      had her. */
  private twirl(out: SailEvent[]): boolean {
    if (!this.whirling()) return false;
    const { via, to } = whirl(this.sea.whirlAt(this.pose.c, this.pose.r)!, this.pose);
    this.spins++;
    this.cur = { m: 'W', from: { ...this.pose }, to, via, bump: false, secs: WHIRL.SECS, pause: SAIL.PAUSE };
    this.rides = this.sea.ride(to, true);
    this.t = 0;
    out.push({ kind: 'push', from: { ...this.pose }, to: { ...to }, whirl: true });
    return true;
  }

  /** The next square of a gust. */
  private blow(out: SailEvent[]) {
    const to = this.gusts.shift()!;
    this.cur = { m: 'W', from: { ...this.pose }, to, bump: false, secs: SAIL.PUSH, pause: SAIL.PAUSE };
    this.t = 0;
    out.push({ kind: 'push', from: { ...this.pose }, to: { ...to }, gust: true });
  }

  private begin(out: SailEvent[]) {
    const m = this.turn[this.slot], { to, bump, ride, irons } = this.sea.move(this.pose, m, this.oars, true);
    this.spins = 0;
    // At the oars, the more squares rowed and waiting, the quicker she goes (a Vegas on each side
    // at once: as quick as the trade winds); under sail, by how she lies to the wind.
    const secs = this.oars ? this.pace : this.sea.moveSecs(false, this.pose, m);
    if (this.oars && this.turn.length - this.slot - 1 + this.strokes.length <= 0) this.pace = WIND.OARS;   // (caught up)
    this.cur = { m, from: { ...this.pose }, to, bump, secs, pause: pauseFor(secs), irons: !!irons };
    this.rides = ride;
    this.t = 0;
    out.push({ kind: 'move', i: this.slot, m, from: { ...this.pose }, to: { ...to }, bump, irons: !!irons, secs });
  }
}

/* Her guns (the user, 9 Nov: "in Puzzle Pirates, the sloop can shoot both sides, so a gun on each,
   gun port on each side, so you can go along and shoot the rocks"). Not on a token, as in Battle
   Navigation, but whenever you fire, as she sails: she never stops moving, so it's your timing
   that brings a shot on ("you have to time it"). A shot goes straight out of that side, up to
   RANGE squares, and stops at the first rock. They fire only when they're loaded, and they're
   loaded by Gunnery (src/den-guns.ts). */

/** A side of her: port (her left) or starboard (her right). */
export type Side = 'L' | 'R';

/** A shot out of that side from where she is now (see Helm.now: mid-move counts from the square
    and heading she's nearest): the squares it passes over, and the rock it hits, if any. */
export function broadside(sea: Sea, at: { c: number; r: number; a: number }, side: Side): { cells: [number, number][]; hit: [number, number] | null } {
  const d = (((Math.round(at.a) + (side === 'R' ? 1 : 3)) % 4) + 4) % 4;
  const c0 = Math.round(at.c), r0 = Math.round(at.r), cells: [number, number][] = [];
  for (let k = 1; k <= SAIL.RANGE; k++) {
    const c = c0 + DC[d] * k, r = r0 + DR[d] * k;
    cells.push([c, r]);
    if (sea.isRock(c, r)) return { cells, hit: [c, r] };
  }
  return { cells, hit: null };
}
