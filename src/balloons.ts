/* Balloons: Sailing's pieces blown up one by one, tied off with a squeak, and played onto a real
   Sailing board till they pop. TypeScript, compiled to js/balloons.js; tested in tests/balloons.test.ts.
   It knows nothing of who's blowing them up or where: js/den/balloons.js shows it in any pair of hands
   beside a board drawn as the den's own Sailing board (js/den/sail-board.js), and an island's config
   says who, and what they say as they go (src/den-tzz.ts: Tzz's lesson).

   The user (11 Nov), of Tzz: "she's literally got a balloon and starts twisting it, like the same as
   you're making a balloon animal, but she ends up ... twisting it into sailing pieces and then pops
   [it] ... It just makes sense of like, well, how on earth do these sailing pieces pop in the puzzle?
   It makes sense. They're balloon animals." And "the humour is the layer on top, but there's a
   genuine mechanic underneath" (RULES.md). Then, seeing a first go (11 Nov): "it's not really a real
   looking sailing board, it's just things stacked on each other, so it needs to be ... closer to the
   actual tutorial idea. She's helping you ... how to build doubles and bingos and things." And later
   the same day, simpler: "Maybe it would be simpler just to be like, they're balloons and she's blowing
   them up ... Maybe my balloon animal thing was a bit too complicated." So no animals: each piece is a
   round balloon in its colour, blown up and tied. (A "twist", below, is still a pair of them: the
   name's from when they were twisted.)

   So it's the real puzzle (src/sailing.ts), on its real board: a routine lays out some platforms, then
   each twist is a pair that comes in at the top of the middle columns and is steered down to where it
   comes to rest, a move at a time (route: a column across, a turn, a row down, the moves a player makes,
   each one Sailing's own), and dropped there by the rules. Nothing clears as it's built; the last
   twist's landing sets off a real chain, popped by the board as any chain is.

   The routines (ROUTINES) are the real way a chain is built (YPPedia, "Sailing", Strategy, read 11
   Nov: "A common construction begins by preparing a lower platform one target short. A line clear
   above it breaks a joined pair, allowing the surviving piece to fall into the missing target. Further
   platforms and line clears may then be arranged to resolve in succession"; "Avoid placing the wrong
   color in a target"; "Keep the columns above unfinished targets open"). After the user saw a first
   go (11 Nov): "the colours are not going into the right spots ... they're just going in random places
   and bodging it. This is a tutorial, and she's just showing bodging moves." So every balloon she puts
   down goes in a target of its own colour or in a line that pops, platforms are blocks (three by two),
   and nothing's left on the board once it's popped. Lines clear before platforms (src/sailing.ts), so
   a line pops first, its partner drops into the gap, and then the platform pops: a Double. The Bingo is
   that Double with another storey on top, whose pop drops a parked pair onto it.

   A show (BalloonShow) plays acts, each a routine and what's said as it goes: a line to start, a line
   as each pair's blown up, and one once it's popped. Its clock gives each beat its time (long enough
   to read its line; a pair slow enough to see each balloon blown up and tied off, the user: "it
   goes really quickly in her hand ... like, what is she doing? Fiddling around some Play-Doh"), and
   says what's happening: a squeak as each balloon's tied off, the pair tossed onto the board, the
   pair falling, landing, and the chain going off. */

import { Sailing, SPAWN, chainName, type Drop, type Platform } from './sailing.js';

/** A twist: a pair of balloons (colours, as Sailing's: water, rope, wind), where it comes to rest. */
export interface Twist { pair: readonly [number, number]; col: number; turn: Drop['turn']; row: number }
/** A routine: the platforms laid out first, then the twists, in order. */
export interface Routine { platforms: readonly Platform[]; twists: readonly Twist[] }

/** Sailing's colours, by name: water (blue), rope (yellow), wind (white). */
const WATER = 0, ROPE = 1, WIND = 2;
/** A platform from its rows of target colours, top row first ('B' water, 'Y' rope, 'W' wind). */
function platform(id: number, r: number, c: number, rows: readonly string[]): Platform {
  return { id, r, c, w: rows[0].length, h: rows.length, targets: rows.flatMap((row, i) => [...row].map((ch, j) => ({ r: r + i, c: c + j, colour: 'BYW'.indexOf(ch) }))) };
}
const across = (a: number, b: number, col: number, row: number): Twist => ({ pair: [a, b], col, turn: 0, row });
const upright = (top: number, under: number, col: number, row: number): Twist => ({ pair: [top, under], col, turn: 1, row });

/** The bottom storey, both routines' (rows 14 and 15, columns 0 to 3): a platform three by two on the
    floor, every target but its top right filled in its own colour, and beside that gap a stack of
    three blues, the first of them pegged to the platform's bottom right. The gap wants yellow.
      row 13   . . . B
      row 14   W B _ B      (_ the gap: yellow)
      row 15   B Y W B */
const BOTTOM = platform(1, 14, 0, ['WBY', 'BYW']);
const BOTTOM_TWISTS: readonly Twist[] = [
  across(WATER, ROPE, 0, 15),
  across(WIND, WATER, 0, 14),
  // (a white in its square, its blue partner beside it on the floor: the stack's first)
  across(WIND, WATER, 2, 15),
  upright(WATER, WATER, 3, 13),
];
/** Off to the right, a platform she's not started on (a real board has more than one on the go): and
    so a chain that pops her others doesn't clear the board, dealing a fresh one under it. */
const NEXT = platform(9, 9, 5, ['BW', 'YB', 'WY']);

export const ROUTINES = {
  /** A Double, the real way: the platform one short, three blues beside its gap; then a pair across
      the top, yellow over the gap, blue on the stack. The four blues pop (a line clears first), the
      yellow pegged to them drops into the gap, and the platform pops: two. */
  double: {
    platforms: [BOTTOM, NEXT],
    twists: [...BOTTOM_TWISTS, across(ROPE, WATER, 2, 12)],
  },
  /** A Bingo: the same Double, with another storey on top that drops its trigger in. The top platform
      (rows 10 and 11, columns 0 to 2) is one short in the middle of its top row, wanting yellow; on its
      left corner, a stack of three whites (the first pegged to the corner's blue); and parked on its
      right corner a yellow and a blue, the blue hanging out over the bottom stack. Your pair: a white
      on the whites, a yellow over the top gap.
        row  6   W Y          (yours)
        row  7   W
        row  8   W
        row  9   W . Y B      (the parked pair: yellow on the corner, blue hanging)
        row 10   B _ W        (_ the top gap: yellow)
        row 11   Y W B
        rows 13 to 15: the Double's
      The whites pop (1); the yellow drops into the top gap and the top platform pops (2); the parked
      pair drops, its blue onto the blues, which pop (3); its yellow drops into the bottom gap and the
      bottom platform pops (4). */
  bingo: {
    platforms: [platform(2, 10, 0, ['BYW', 'YWB']), BOTTOM, NEXT],
    twists: [
      ...BOTTOM_TWISTS,
      across(ROPE, WIND, 0, 11),
      upright(WIND, WATER, 2, 10),
      upright(WIND, WATER, 0, 9),
      upright(WIND, WIND, 0, 7),
      across(ROPE, WATER, 2, 9),
      across(WIND, ROPE, 0, 6),
    ],
  },
} as const satisfies Record<string, Routine>;

/** A game laid out for a routine: its platforms, an empty board, its first pair coming in. */
export function layout(routine: Routine): Sailing {
  const g = new Sailing(() => 0, false);
  g.lay(g.grid, routine.platforms.map((p) => ({ ...p, targets: p.targets.map((t) => ({ ...t })) })));
  if (routine.twists.length) g.pair = [routine.twists[0].pair[0], routine.twists[0].pair[1]];
  return g;
}

/** The board after the routine's first `n` twists, each dropped where it comes to rest by the rules
    (her setup, before your turn: and again, as it was, if you miss). */
export function setup(routine: Routine, n: number): Sailing {
  const g = layout(routine);
  routine.twists.slice(0, n).forEach((t, i) => {
    g.pair = [t.pair[0], t.pair[1]];
    if (!g.drop(t.col, t.turn, t.row).dropped) throw new Error(`twist ${i} can't come to rest at row ${t.row}, column ${t.col}`);
  });
  const next = routine.twists[n] ?? routine.twists[routine.twists.length - 1];
  g.pair = [next.pair[0], next.pair[1]];
  return g;
}

/** A move steering the falling pair, as a player's keys do (src/sail-pair.ts): a column left or right,
    a quarter turn either way, or a row down. */
export type Step = 'left' | 'right' | 'turnR' | 'turnL' | 'down';

/** The moves that steer the game's pair from where it comes in (the top of the middle columns, turned
    0) down to where the twist comes to rest, fewest first, each one a move the rules allow (Sailing's
    own open() and sinks(), as moves() searches); null if it can't get there. */
export function route(g: Sailing, t: Twist): Step[] | null {
  const start: [number, number, Drop['turn']] = [0, SPAWN[0], 0];
  if (!g.open(...start)) return null;
  const id = (r: number, c: number, u: number) => `${r},${c},${u}`;
  const from = new Map<string, [string, Step] | null>([[id(...start), null]]);
  const todo: [number, number, Drop['turn']][] = [start];
  while (todo.length) {
    const [r, c, u] = todo.shift()!;
    if (r === t.row && c === t.col && u === t.turn && !g.sinks(r, c, u)) {
      const out: Step[] = [];
      for (let k = id(r, c, u); from.get(k); k = from.get(k)![0]) out.unshift(from.get(k)![1]);
      return out;
    }
    const next: [number, number, Drop['turn'], Step][] = [
      [r, c - 1, u, 'left'], [r, c + 1, u, 'right'], [r, c, ((u + 1) % 4) as Drop['turn'], 'turnR'], [r, c, ((u + 3) % 4) as Drop['turn'], 'turnL'],
    ];
    // (down last: of the shortest ways, the one a player takes, across and turned first, then dropped,
    // sliding in sideways only where it has to, under a platform)
    if (g.sinks(r, c, u)) next.push([r + 1, c, u, 'down']);
    for (const [nr, nc, nu, step] of next) {
      const k = id(nr, nc, nu);
      if (from.has(k) || !g.open(nr, nc, nu)) continue;
      from.set(k, [id(r, c, u), step]);
      todo.push([nr, nc, nu]);
    }
  }
  return null;
}

/** A routine, played by Sailing's rules, as a player would: each twist steered down its route and
    dropped where it comes to rest. What each drop earned, the routes, and the pieces cleared before the
    last twist (a fair show clears none). Throws if a twist can't be got where it says. */
export function perform(routine: Routine): { routes: Step[][]; steps: number; name: string; early: number; game: Sailing } {
  const g = layout(routine), routes: Step[][] = [];
  let early = 0, steps = 0, name = '';
  routine.twists.forEach((t, i) => {
    g.pair = [t.pair[0], t.pair[1]];
    const way = route(g, t);
    if (!way) throw new Error(`twist ${i} can't be steered to row ${t.row}, column ${t.col}`);
    routes.push(way);
    const res = g.drop(t.col, t.turn, t.row);
    if (i < routine.twists.length - 1) early += res.cleared;
    else ({ steps, name } = res);
  });
  return { routes, steps, name, early, game: g };
}

/** What's said as an act goes: to start, as each twist's twisted (one each, in order; fewer and the
    rest go quietly), handing you the last one (`yours`), each time you miss (`again`, in turn), as she
    shows you after all (`help`), and once it's popped. */
export interface Says { start?: string; twists?: readonly string[]; yours?: string; again?: readonly string[]; help?: string; popped?: string }
/** An act of a show: a routine, what's said, and whether the last twist is yours to drop (`you`: she
    sets the balloons up, you do the pop; the user, 11 Nov: "it should definitely be like a now you try
    thing. And, you know, she sets up the balloons, you do the pop"). */
export interface Act { routine: Routine; says?: Says; you?: boolean }

/** Seconds: a line to start; a twist in hand (the first balloon blown up and tied off, squeak; the
    second, squeak; pegged together and tossed onto the board: SQUEAKS and TOSS are its fractions); a move
    of the pair steered down the board; your turn's line (then it waits for you); the chain once it's
    going (the board plays it: a show waits while it does); after it's popped. A beat with a line is at
    least as long as its line takes to read. HELP: misses before she shows you how after all. */
export const SHOW = { START: 2.6, TWIST: 3.4, SQUEAKS: [0.38, 0.76], TOSS: 0.86, STEP: 0.055, LAND: 0.35, YOURS: 2.4, POP: 0.6, AFTER: 3, HELP: 3 } as const;

export type BeatKind = 'start' | 'twist' | 'fall' | 'yours' | 'pop' | 'after';
/** A beat of the show: which act, what kind, which twist (`i`, from 0), when it starts and how long it
    is, and its line. */
export interface Beat { act: number; kind: BeatKind; i: number; t0: number; secs: number; line?: string }

/** Something happening in a show, from its clock (or from your drop: BalloonShow.played). */
export type ShowEvent =
  | { kind: 'act'; act: number }
  | { kind: 'line'; text: string; secs: number }
  | { kind: 'squeak'; colour: number; half: 0 | 1 }
  | { kind: 'toss'; act: number; twist: number }
  | { kind: 'fall'; act: number; twist: number; route: Step[] }
  | { kind: 'land'; act: number; twist: number }
  | { kind: 'yours'; act: number; twist: number }
  | { kind: 'again'; act: number; misses: number }
  | { kind: 'done' };

/** A show's beats, end to end; `secs(text)` how long a line takes to read. */
export function beats(acts: readonly Act[], secs: (text: string) => number): Beat[] {
  const out: Beat[] = [];
  let t = 0;
  const add = (act: number, kind: BeatKind, i: number, base: number, line?: string) => {
    const s = Math.max(base, line ? secs(line) : 0);
    out.push({ act, kind, i, t0: t, secs: s, ...(line ? { line } : {}) });
    t += s;
  };
  acts.forEach((a, k) => {
    const S = a.says ?? {}, P = perform(a.routine), n = a.routine.twists.length, hers = a.you ? n - 1 : n;
    add(k, 'start', 0, S.start ? SHOW.START : 0.4, S.start);
    for (let i = 0; i < hers; i++) {
      add(k, 'twist', i, SHOW.TWIST, S.twists?.[i]);
      add(k, 'fall', i, P.routes[i].length * SHOW.STEP + SHOW.LAND);
    }
    if (a.you) add(k, 'yours', n - 1, SHOW.YOURS, S.yours);
    add(k, 'pop', 0, P.steps * SHOW.POP);
    add(k, 'after', 0, SHOW.AFTER, S.popped);
  });
  return out;
}

/** A show, played: see the top of this file. On your turn its clock holds at the end of the beat till
    your pair lands (played): set off the chain she built and on it goes; anything else, and she has
    you try again (the board as she left it: setup), and after HELP misses shows you how. */
export class BalloonShow {
  readonly beats: Beat[];
  readonly shows: ReturnType<typeof perform>[];
  /** Seconds in. */
  t = 0;
  /** Your misses this act. */
  misses = 0;
  /** It's said it's done. */
  private over = false;
  private sent = new Set<string>();
  /** Your turns that are over (your pair set it off, or she showed you), by beat. */
  private through = new Set<number>();

  constructor(readonly acts: readonly Act[], secs: (text: string) => number) {
    this.shows = acts.map((a) => perform(a.routine));
    this.beats = beats(acts, secs);
  }

  /** How long it all takes (not counting waiting for you, or for the board). */
  get length(): number { const b = this.beats[this.beats.length - 1]; return b ? b.t0 + b.secs : 0; }
  get done(): boolean { return this.t >= this.length; }
  /** The beat on now (the last, once it's done). */
  beat(): Beat { return this.beats[this.index()]; }
  private index(): number { let i = 0; while (i + 1 < this.beats.length && this.beats[i + 1].t0 <= this.t) i++; return i; }
  /** It's your turn: your pair's to drop. */
  get yours(): boolean { const n = this.index(), b = this.beats[n]; return b.kind === 'yours' && !this.through.has(n); }

  /** Time going by: what happened. `wait`: the board's still playing a chain out, so the show holds at
      the end of its pop beat till it's done. And on your turn it holds till you've dropped. */
  tick(dt: number, wait = false): ShowEvent[] {
    if (this.over) return [];
    const n0 = this.index(), b0 = this.beats[n0];
    const hold = (b0.kind === 'pop' && wait) || (b0.kind === 'yours' && !this.through.has(n0));
    this.t = Math.min(this.length, hold ? Math.min(this.t + dt, b0.t0 + b0.secs - 1e-6) : this.t + dt);
    const out: ShowEvent[] = [];
    this.beats.forEach((b, n) => {
      // (each thing once, as its moment comes: in order, however big the step)
      const once = (key: string, at: number, e: ShowEvent) => {
        const k = `${n}:${key}`;
        if (this.sent.has(k) || this.t < b.t0 + at) return;
        this.sent.add(k);
        out.push(e);
      };
      if (n === 0 || b.act !== this.beats[n - 1].act) {
        if (this.t >= b.t0 && !this.sent.has(`${n}:act`)) this.misses = 0;
        once('act', 0, { kind: 'act', act: b.act });
      }
      if (b.line) once('line', 0, { kind: 'line', text: b.line, secs: b.secs });
      if (b.kind === 'twist') {
        const pair = this.acts[b.act].routine.twists[b.i].pair;
        once('s0', b.secs * SHOW.SQUEAKS[0], { kind: 'squeak', colour: pair[0], half: 0 });
        once('s1', b.secs * SHOW.SQUEAKS[1], { kind: 'squeak', colour: pair[1], half: 1 });
        once('toss', b.secs * SHOW.TOSS, { kind: 'toss', act: b.act, twist: b.i });
      }
      if (b.kind === 'fall') {
        once('fall', 0, { kind: 'fall', act: b.act, twist: b.i, route: this.shows[b.act].routes[b.i] });
        once('land', b.secs - SHOW.LAND * 0.5, { kind: 'land', act: b.act, twist: b.i });
      }
      if (b.kind === 'yours') once('yours', 0, { kind: 'yours', act: b.act, twist: b.i });
    });
    if (this.done) { this.over = true; out.push({ kind: 'done' }); }
    return out;
  }

  /** Your pair's landed, setting off a chain of `steps`: 'hit' if that's the one she built (on it goes),
      'miss' if not (she has you try again: her line for it, `again` in turn), or 'help' once you've
      missed HELP times (she shows you, her pair falling down its route, and on it goes). Null if it
      isn't your turn. */
  played(steps: number): { result: 'hit' | 'miss' | 'help'; events: ShowEvent[] } | null {
    if (!this.yours) return null;
    const n = this.index(), b = this.beats[n], want = this.shows[b.act].steps;
    if (steps >= want) { this.through.add(n); return { result: 'hit', events: [] }; }
    this.misses++;
    const S = this.acts[b.act].says ?? {}, again = S.again ?? [], events: ShowEvent[] = [{ kind: 'again', act: b.act, misses: this.misses }];
    if (this.misses >= SHOW.HELP) {
      this.through.add(n);
      if (S.help) events.push({ kind: 'line', text: S.help, secs: SHOW.YOURS * 1.5 });
      events.push({ kind: 'fall', act: b.act, twist: b.i, route: this.shows[b.act].routes[b.i] });
      return { result: 'help', events };
    }
    if (again.length) events.push({ kind: 'line', text: again[(this.misses - 1) % again.length], secs: SHOW.YOURS * 1.5 });
    return { result: 'miss', events };
  }

  /** On to the next beat now (Space): never past your turn. */
  skip(): ShowEvent[] {
    if (this.yours) return [];
    const n = this.index(), next = this.beats[n + 1];
    return this.tick((next ? next.t0 : this.length) - this.t);
  }

  /** What's shown now: the act, the beat and how far into it (0 to 1), and the twist in hand (its pair,
      and how far it's twisted, 0 to 1) if one is. */
  now(): { act: number; beat: Beat; u: number; twisting: { i: number; pair: readonly [number, number]; u: number } | null } {
    const b = this.beat(), u = b.secs ? Math.min(1, (this.t - b.t0) / b.secs) : 1;
    const twisting = b.kind === 'twist' ? { i: b.i, pair: this.acts[b.act].routine.twists[b.i].pair, u } : null;
    return { act: b.act, beat: b, u, twisting };
  }
}

export { chainName };
