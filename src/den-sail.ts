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
import { Wind, WIND, moveTime, pointOf, rowTime, upwind, type WindEvent } from './den-wind.js';
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
      put. */
  COLS: 22,
  ROWS: 26,
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
  /** The lock: moves' worth of Bilge to raise her (see Helm.pump), and seconds it takes to drain
      down by itself. A proper go of Bilge, tens of seconds of good play: at four it "filled way
      too quickly" (the user, 9 Nov), "you should see the line of water gradually going up as you
      clear a few bilging pieces". */
  LOCK_WORK: 16,
  DRAIN: 2,
  /** The lock's water rising to what's been pumped (see lockRise): at least this much of the lift a
      second, quicker the further it has to go, so each clear lifts it a step you can see. */
  RISE: 0.15,
  /** Seconds the gates take to swing open once the lock's full (or drained), before she sails on
      through them. */
  GATES: 0.8,
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
   Rocks stand along the lanes' sides. */
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
  CANAL: [[8, 11], [7, 11], [6, 11]] as [number, number][],
  LOCK: [5, 11] as [number, number],
  /** The hidden cove: up behind the cliff, its water a lock's lift above the sea. */
  COVE: { c0: 0, c1: 4, r0: 9, r1: 13 },
  /** Rocks along the lanes' sides ("some craziness to the journey"). */
  SIDES: [[8, 5], [10, 8], [12, 4], [14, 8], [12, 12]] as [number, number][],
  /** The imperial checkpoint (10 Nov), across the main shipping lane: a line across the sea at ROW,
      closed but for its gate (GATE, under a gatehouse whose PIERS stand either side) and the far end
      of its reef. Its guns stand on bastions either side (GUNS), each trained on squares of the way
      through (MARKS, src/den-checkpoint.ts). On its left a headland (cliff): the crane up and over
      it, later, goes from LEDGE on the near side to LANDING beyond, both kept clear. On its right a
      reef of rocks (REEF, along ROW), its end open: the long way round. */
  CHECKPOINT: {
    ROW: 19,
    GATE: 9,
    PIERS: [[8, 19], [10, 19]] as [number, number][],
    GUNS: [[7, 19], [11, 19]] as [number, number][],
    HEADLAND: { c0: 0, c1: 6, r0: 18, r1: 20 },
    REEF: { c0: 12, c1: 19 },
    LEDGE: [3, 17] as [number, number],
    LANDING: [3, 21] as [number, number],
  },
  /** An old wreck on the open sea beyond the checkpoint, its treasure hauled up by Treasure Haul:
      the reason to get past. Out of reach of the checkpoint's guns, so she can haul in peace. */
  WRECK: [5, 24] as [number, number],
  /** Rocks out on the water the board grew into. */
  FAR: [[17, 4], [19, 8], [16, 13], [20, 15], [15, 17], [17, 22], [13, 24], [19, 24], [1, 23]] as [number, number][],
};

/** The squares of the checkpoint's line that are built on (its piers and its guns' bastions), and
    the headland's: rocks to sail by, drawn by js/den/checkpoint.js, not as sea stacks. */
export function checkpointWorks(): [number, number][] {
  const K = LAY.CHECKPOINT, out: [number, number][] = [...K.PIERS, ...K.GUNS];
  const { c0, c1, r0, r1 } = K.HEADLAND;
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) out.push([c, r]);
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
  /** The cliff round the hidden cove (rocks too), the cove's water, the lock. */
  cliff = new Set<string>();
  cove = new Set<string>();
  lock: [number, number] | null = null;
  junction: [number, number] | null = null;
  /** The squares built on (the checkpoint's piers and bastions, its headland) and the wreck's:
      rocks to sail by, drawn by their own 3D rather than as sea stacks. */
  works = new Set<string>();
  /** The old wreck beyond the checkpoint, if laid. */
  wreck: [number, number] | null = null;
  /** The wind she sails by (src/den-wind.ts), if there's one. With none, every move takes
      SAIL.MOVE and goes any way. */
  breeze: Wind | null = null;
  /** Squares the scattered rocks keep off: the lanes and everything round them. */
  private keep = new Set<string>();

  /** A sea of scattered rocks; with `lay`, the lanes, the lock and the cove too (LAY). */
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
    const { c0, c1, r0, r1 } = LAY.COVE;
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) this.cove.add(key(c, r));
    for (let r = r0 - 1; r <= r1; r++) if (r !== LAY.LOCK[1]) this.cliff.add(key(c1 + 1, r));
    for (let c = c0; c <= c1; c++) this.cliff.add(key(c, r0 - 1));
    // (and behind it, now the board runs on out past it: 10 Nov)
    for (let c = c0; c <= c1 + 1; c++) this.cliff.add(key(c, r1 + 1));
    for (let c = c0; c <= c1 + 2; c++) for (let r = r0 - 2; r <= r1; r++) this.keep.add(key(c, r));
    this.lock = [...LAY.LOCK];
    this.junction = [...LAY.JUNCTION];
    // The checkpoint, its headland and the wreck beyond it (all outside where the rocks scatter).
    for (const [c, r] of [...checkpointWorks(), LAY.WRECK]) this.works.add(key(c, r));
    this.wreck = [...LAY.WRECK];
  }

  private scatter(roll: () => number) {
    const laid = this.wind.size > 0, K = LAY.CHECKPOINT;
    const reef = laid ? Array.from({ length: K.REEF.c1 - K.REEF.c0 + 1 }, (_, i) => key(K.REEF.c0 + i, K.ROW)) : [];
    this.rocks = new Set([...this.cliff, ...this.works, ...reef, ...[...LAY.SIDES, ...LAY.FAR].filter(() => laid).map(([c, r]) => key(c, r))]);
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
  isLock(c: number, r: number): boolean { return !!this.lock && this.lock[0] === c && this.lock[1] === r; }
  /** The water's level here: the sea's 0, the hidden cove's 1 (the lock's is the helm's). */
  level(c: number, r: number): number { return this.cove.has(key(c, r)) ? 1 : 0; }

  /** Swept along by the trade winds from here, a square at a time, facing the way it blows, till
      she's off the lane (or would hit something). */
  ride(p: Pose): Pose[] {
    const out: Pose[] = [];
    let at = p;
    for (let d = this.windAt(at.c, at.r); d !== undefined && out.length < 64; d = this.windAt(at.c, at.r)) {
      const c = at.c + DC[d], r = at.r + DR[d];
      if (!this.open(c, r)) break;
      at = { c, r, d };
      out.push(at);
    }
    return out;
  }

  /** Under sail (not at the oars), whether this move would take her a square against the wind:
      then she's in irons, and makes no way (src/den-wind.ts). */
  irons(p: Pose, m: Move, oars = false): boolean {
    const w = this.breeze;
    if (!w || oars) return false;
    return (m === 'F' ? [p.d] : [p.d, path(p, m).to.d]).some((d) => upwind(d, w.d));
  }

  /** A move and what the trade wind does after it. In irons, or blocked, she stays where she is (a
      turn turning her on the spot): `bump` either way, and `irons` too if it was the wind. */
  move(p: Pose, m: Move, oars = false): { to: Pose; bump: boolean; ride: Pose[]; irons?: boolean } {
    const { cells, to } = path(p, m);
    if (this.irons(p, m, oars)) return { to: { c: p.c, r: p.r, d: m === 'F' ? p.d : to.d }, bump: true, ride: [], irons: true };
    if (cells.every(([c, r]) => this.open(c, r))) return { to, bump: false, ride: this.ride(to) };
    return { to: { c: p.c, r: p.r, d: to.d }, bump: true, ride: [] };
  }

  /** The seconds a move takes: at the oars (a square on its own: see Helm for a pile of them), or
      under sail in the wind there is, by how she lies to it on the way (a turn's two squares
      shared; in a calm, as in light airs, which is what she'll have when it picks up). Without a
      move, a reach's. A move in irons swings her head round in a reach's time. */
  moveSecs(oars = false, p?: Pose, m?: Move): number {
    if (!this.breeze) return SAIL.MOVE;
    const s = this.breeze.s === 0 ? 1 : this.breeze.s;
    if (oars || !p || !m || this.irons(p, m)) return moveTime(s, oars);
    const legs = m === 'F' ? [p.d] : [p.d, path(p, m).to.d];
    return legs.reduce((t, d) => t + moveTime(s, false, pointOf(d, this.breeze!.d)), 0) / legs.length;
  }

  /** On the board and not a rock. */
  open(c: number, r: number): boolean {
    return c >= 0 && c < this.cols && r >= 0 && r < this.rows && !this.rocks.has(key(c, r));
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
      loop round just to save a move. With `via` (a lane square), she gets there by riding that
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
      this.plots.set(memo, this.quickest(from, c, r, via ? this.boarding(via) : null, oars));
    }
    const got = this.plots.get(memo);
    return got ? [...got] : null;
  }

  /** What the moves hang on besides the rocks: under sail, the way the wind blows and how hard; at
      the oars (or with no wind), nothing. */
  private rig(oars: boolean): string { return !this.breeze ? 'still' : oars ? 'oars' : `sail${this.breeze.d}${this.breeze.s}`; }

  /** Where each move takes her from each pose (worked out as needed, and again if the rocks or
      the winds change; a set for each rig): the pose she ends up in, her squares of trade wind,
      whether she bumped, and the square the move itself ended on (before the trade wind). Poses
      are numbered ((c * rows + r) * 4 + d). */
  private edges = new Map<string, Map<number, { end: number; ride: number; bump: boolean; on: number; secs: number }[]>>();
  private edgesFor = '';
  private from(id: number, oars: boolean) {
    const sig = `${this.rocks.size},${this.wind.size}`;
    if (sig !== this.edgesFor) { this.edges.clear(); this.edgesFor = sig; }
    const rig = this.rig(oars);
    let set = this.edges.get(rig);
    if (!set) this.edges.set(rig, set = new Map());
    let got = set.get(id);
    if (!got) {
      const p: Pose = { c: Math.floor(id / 4 / this.rows), r: Math.floor(id / 4) % this.rows, d: id % 4 };
      got = (['F', 'L', 'R'] as Move[]).map((m) => {
        const { to, bump, ride } = this.move(p, m, oars), end = ride.length ? ride[ride.length - 1] : to;
        const secs = this.moveSecs(oars, p, m);
        return { end: (end.c * this.rows + end.r) * 4 + end.d, ride: ride.length, bump, on: to.c * this.rows + to.r, secs: secs + pauseFor(secs) };
      });
      set.set(id, got);
    }
    return got;
  }

  /** Dijkstra over where she can be and the way she faces, by the seconds it takes (at the oars,
      or under sail in the wind there is, by how she lies to it on each move). */
  private quickest(from: Pose, c: number, r: number, boards: Set<string> | null, oars: boolean): Move[] | null {
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
      can get to and stop in (off the board, or on a rock, it moves to the nearest that's open). */
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
      for (const [x, y] of near) if (this.open(x, y) && this.windAt(x, y) === undefined && this.plot(from, x, y, null, true)) return { at: [x, y], via: null };
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
    for (let c = 0; c < this.cols; c++) for (let r = 0; r < this.rows; r++) if (this.open(c, r) && this.windAt(c, r) === undefined && !got.has(key(c, r))) return false;
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
  | { kind: 'push'; from: Pose; to: Pose }
  | { kind: 'arrive'; at: Pose }
  /** The pin's where the wind won't let her sail at all: she waits (said once for each pin). The
      pilot used to run the oars out and row her there itself, and the user (10 Nov) saw "a pop-up
      saying you can't sail there. Well, it is letting me". Now the oars are yours to run out: the
      rowing board is the steering while they're out (src/den-row.ts). */
  | { kind: 'headwind' }
  | WindEvent;

/** What she's waiting on, if anything: dazed by a hit (patch the hole in her deck), at the lock,
    for it to be pumped up to the cove's level, or to drain down to the sea's, or for its gates to
    swing open; or becalmed under sail, for the wind to pick up (or the oars). */
export type Held = 'daze' | 'up' | 'down' | 'gates' | 'calm' | null;

/** The lock's water, rising (or falling) towards where it's headed: a step at a time as each clear
    is pumped in, smoothly, never in one jump, and there within a second or so. */
export function lockRise(level: number, to: number, dt: number): number {
  const d = to - level, step = Math.max(SAIL.RISE * dt, Math.abs(d) * Math.min(1, dt * 3));
  return Math.abs(d) <= step ? to : level + Math.sign(d) * step;
}

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
  /** What's being sailed just now: a move, or a square of trade wind ('W') sweeping her on. */
  cur: { m: Move | 'W'; from: Pose; to: Pose; bump: boolean; secs: number; pause: number; irons?: boolean; done?: boolean } | null = null;
  /** The squares of trade wind still to come after it. */
  rides: Pose[] = [];
  /** The lock's water: 0 the sea's level, 1 the hidden cove's. */
  level = 0;
  /** What's been pumped into the lock: the water rises to it as she waits (lockRise). */
  fill = 0;
  /** The hole the last hit knocked in her deck: she's dazed till it's patched. */
  hole: DeckHole | null = null;
  /** Seconds till the lock's gates are open, after it's filled or drained. */
  gates = 0;
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
  /** The headwind's been said for this pin. */
  private told = false;
  private wait = 0;

  constructor(public sea: Sea, pose: Pose = SAIL.HOME) { this.pose = { ...pose }; }

  /** Where she'll be when this turn's played out. */
  after(): Pose {
    if (this.slot < 0) return { ...this.pose };
    let p = this.cur ? (this.rides.length ? this.rides[this.rides.length - 1] : this.cur.to) : this.pose;
    for (let i = this.slot + (this.cur ? 1 : 0); i < this.turn.length; i++) p = this.sea.sail(p, this.turn[i], this.oars).to;
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
    return !!this.pin && !this.oars && !!this.sea.breeze && !this.mine.length && !this.sea.plot(this.after(), ...this.pin, this.via) && !!this.sea.plot(this.after(), ...this.pin, this.via, true);
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
      if she's waiting at the lock). */
  stop() {
    this.pin = null; this.via = null; this.mine = [];
    if (!this.cur && this.slot >= 0) { this.turn = []; this.slot = -1; this.wait = SAIL.BREAK; }
  }

  /** Nothing playing and nothing to play. */
  idle(): boolean { return this.slot < 0 && !this.next().length; }

  /** Holed, and the hole not yet patched. */
  dazed(): boolean { return !!this.hole && !this.hole.done(); }
  /** Hit (by the checkpoint's guns, say): a hole in her deck, and she's dazed till it's patched. She
      finishes the move she's on (or the trade wind's ride), then waits. (A hit while she's holed
      already does nothing more: the guns hold fire then anyway.) */
  hit(cells: Cell[] = SAIL.HOLE) { if (!this.dazed()) { this.hole = new DeckHole(cells); this.grace = SAIL.GRACE; } }
  /** Not to be shot at just now: held up (dazed, or at the lock), or just patched and getting going.
      (Becalmed she's fair game: row out of reach.) */
  spared(): boolean { const h = this.held(); return (!!h && h !== 'calm') || this.grace > 1e-9; }

  /** What she's waiting on, if anything. */
  held(): Held {
    if (this.dazed()) return 'daze';
    if (this.slot >= 0 && !this.cur) return this.gate(this.turn[this.slot]) ?? (this.gates > 1e-9 ? 'gates' : this.becalmed() ? 'calm' : null);
    return null;
  }

  /** A move of Bilge's worth: pumps the lock up if she's waiting on it. What it went to. */
  pump(w: number): 'lock' | null {
    if (this.held() === 'up') {
      this.fill = Math.min(1, Math.max(this.fill, this.level) + w / SAIL.LOCK_WORK);
      return 'lock';
    }
    return null;
  }

  /** Whether the lock's in the way of this move: through its gates only when its water's at the
      level of the other side. */
  private gate(m: Move): Held {
    if (!this.sea.lock) return null;
    const { cells } = path(this.pose, m);
    if (!cells.every(([c, r]) => this.sea.open(c, r))) return null;   // (she'll only bump)
    const seq: [number, number][] = [[this.pose.c, this.pose.r], ...cells];
    for (let i = 0; i + 1 < seq.length; i++) {
      const a = this.sea.isLock(...seq[i]), b = this.sea.isLock(...seq[i + 1]);
      if (a === b) continue;
      const want = this.sea.level(...(a ? seq[i + 1] : seq[i]));
      if (Math.abs(this.level - want) > 1e-6) return want > this.level ? 'up' : 'down';
    }
    return null;
  }

  /** Where she is right now, for drawing (see poseAt). */
  now(): { c: number; r: number; a: number } {
    if (!this.cur) return { c: this.pose.c, r: this.pose.r, a: this.pose.d };
    const { from, to, m } = this.cur;
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
    // The lock's water rising to what's been pumped in; full, the top gates swing open.
    if (this.fill > this.level + 1e-9) {
      this.level = lockRise(this.level, this.fill, dt);
      if (this.level >= 1 - 1e-9) { this.level = this.fill = 1; this.gates = SAIL.GATES; }
    }
    for (let guard = 0; left > 1e-12 && guard < 1000; guard++) {
      if (this.cur) {
        // A move or a square of wind, then (after the last of the wind) the pause. Dazed, she
        // holds once the move's sailed; the wind sweeps her on regardless.
        const cur = this.cur, dur = cur.secs;
        const span = dur + (this.rides.length ? 0 : cur.pause), hold = this.dazed() && !this.rides.length;
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
        this.cur = null;
        this.slot++;
        // At the oars, squares rowed since the turn began join it, up to a turn's worth; and there's
        // no breather after it: she rows whatever's been rowed.
        if (this.oars && this.turn.length < SAIL.SLOTS) this.turn.push(...this.strokes.splice(0, SAIL.SLOTS - this.turn.length));
        if (this.slot >= this.turn.length) { this.slot = -1; this.turn = []; this.wait = this.oars ? 0 : SAIL.BREAK; }
        continue;
      }
      if (this.slot >= 0) {
        // The next move of the turn, unless she's dazed or waiting on the lock.
        if (this.dazed()) break;
        const g = this.gate(this.turn[this.slot]);
        if (g === 'up') break;
        if (g === 'down') {
          const use = Math.min(left, this.level * SAIL.DRAIN);
          this.level -= use / SAIL.DRAIN; left -= use;
          this.fill = Math.min(this.fill, this.level);
          if (this.level > 1e-6) break;
          this.level = 0;
          this.gates = SAIL.GATES;   // drained: the bottom gates swing open
          continue;
        }
        if (this.gates > 1e-9) {
          // The gates swinging open before she sails through.
          const use = Math.min(left, this.gates);
          this.gates -= use; left -= use;
          if (this.gates > 1e-9) break;
          this.gates = 0;
          continue;
        }
        // Under sail in a calm, she's dead in the water till the wind picks up (or the oars go out).
        if (this.becalmed()) break;
        this.begin(out);
        continue;
      }
      // Between turns: the breather, then the next turn, if there's anything to play.
      const use = Math.min(left, Math.max(0, this.wait));
      this.wait -= use; left -= use;
      this.gates = Math.max(0, this.gates - use);
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

  private begin(out: SailEvent[]) {
    const m = this.turn[this.slot], { to, bump, ride, irons } = this.sea.move(this.pose, m, this.oars);
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
