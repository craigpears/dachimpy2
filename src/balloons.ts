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

/* ---------- the plan, shown on the board ----------
   The user (11 Nov, Tzz's lesson): "her speech explains things. It doesn't really visibly show you the
   plan very well. Like, we're starting a stack. Great. What on earth does that even mean? What is the
   impact of that?" So the plan's drawn on the board as she builds it (js/den/sail-board.js,
   sailBoardMarks), each mark shown before she names it: the gap left in a platform, the stack of three
   and the square where a fourth makes a line, the balloon that drops into the gap (a dotted arrow), what
   pops after what (1, 2, 3...), and on your go your pair as a ghost where it goes. None of it's written
   by hand: it's read off the routine as the rules play it (plan), so it can't point at the wrong square.
   Then (12 Nov, the Bingo): "when you've got the blues at the bottom ... she's then, like, building the
   platform at the top and the gap first. But it's like, well, hang on, what happened to the blues on the
   bottom? What's the plan? ... It kind of gets revealed right at the end." Your go was "perfectly clear
   and fantastic" ("here's the plan. This is where it's going to drop"), but "while she's building it,
   it's a bit like, wait, why were you putting that there?" So the whole plan's on the board from the
   start of each act (RULES.md: a demonstration shows its plan before it builds), what's still to come
   faint, each part going solid as she builds it; your go just as it was. */

/** A square, [row, column]. */
export type Sq = readonly [number, number];
/** What's on the board, by the rules, when the routine's last pair goes in: `gaps`, the targets left
    empty for something to drop into (the trigger: filled last, it sets the platform off); each line
    that pops, the `stack` of three already there and the square that makes it `four`; each balloon
    that `drops` from where it landed to where it pops (into a gap, or onto a stack); what pops in what
    order (`pops`, n from 1: a line's squares, or a platform's); and your pair, the `ghost`. */
export interface Plan {
  gaps: { at: Sq; colour: number }[];
  lines: { n: number; colour: number; stack: Sq[]; four: Sq[] }[];
  drops: { from: Sq; to: Sq; colour: number; yours: boolean }[];
  pops: { n: number; kind: 'line' | 'platform'; cells: Sq[] }[];
  ghost: [number, number, number][];
}

/** Where every piece is, by id, on a grid. */
function where(grid: Sailing['grid']): Map<number, { at: Sq; c: number }> {
  const m = new Map<number, { at: Sq; c: number }>();
  grid.forEach((line, r) => line.forEach((x, c) => { if (x) m.set(x.id, { at: [r, c], c: x.c }); }));
  return m;
}
const same = (a: Sq, b: Sq) => a[0] === b[0] && a[1] === b[1];

/** The routine's plan (see Plan), as Sailing's rules play its last pair. */
export function plan(routine: Routine): Plan {
  const n = routine.twists.length - 1, t = routine.twists[n], g = setup(routine, n);
  const before = g.snap(), ghost = g.cells(t.row, t.col, t.turn)!;
  const res = g.drop(t.col, t.turn, t.row), st = res.stages;
  // (the gaps in the platforms that pop: not the one she's not started on)
  const went = new Set(st.flatMap((s) => s.went ?? []).map((p) => p.id));
  const gaps = st[0].platforms.filter((p) => went.has(p.id)).flatMap((p) => p.targets.filter((q) => !before[q.r][q.c]).map((q) => ({ at: [q.r, q.c] as Sq, colour: q.colour })));
  const landed = where(st[0].grid), mine = new Set([...landed.keys()].filter((id) => !before.flat().some((x) => x?.id === id)));
  const lines: Plan['lines'] = [], drops: Plan['drops'] = [], pops: Plan['pops'] = [];
  for (let k = 1; k < st.length; k++) {
    if (st[k].kind === 'fall') continue;   // (nothing pops: the last clear's leftovers coming to rest)
    // (what this step pops is where the step before left it, once it's all fallen: as the board shows it)
    const sim = new Sailing(() => 0, false);
    sim.lay(st[k - 1].grid.map((line) => line.slice()), st[k - 1].platforms.slice());
    sim.fall();
    const at = where(sim.grid), cells = st[k].cleared.map((id) => at.get(id)!.at);
    pops.push({ n: k, kind: st[k].kind as 'line' | 'platform', cells });
    for (const id of st[k].cleared) {
      const from = landed.get(id)!.at, to = at.get(id)!.at;
      if (!same(from, to)) drops.push({ from, to, colour: at.get(id)!.c, yours: mine.has(id) });
    }
    if (st[k].kind === 'line') {
      const still = (id: number) => !mine.has(id) && same(landed.get(id)!.at, at.get(id)!.at);
      lines.push({ n: k, colour: at.get(st[k].cleared[0])!.c, stack: st[k].cleared.filter(still).map((id) => at.get(id)!.at), four: st[k].cleared.filter((id) => !still(id)).map((id) => at.get(id)!.at) });
    }
  }
  return { gaps, lines, drops, pops, ghost };
}

/** A mark on the board: see Plan. `of`: how many of a stack's three are up so far. `faint`: still to
    come (what it points at isn't built yet): drawn faintly, going solid once it is. */
export type Mark = (
  | { kind: 'gap'; at: Sq; colour: number }
  | { kind: 'stack'; cells: Sq[]; colour: number; of: number }
  | { kind: 'four'; at: Sq; colour: number }
  | { kind: 'drop'; from: Sq; to: Sq; colour: number }
  | { kind: 'pop'; n: number; at: Sq }
  | { kind: 'ghost'; cells: [number, number, number][] }
) & { faint?: true };

/** What's marked on the board once `n` of the routine's twists are down: the whole plan from the start
    (n 0), each part faint till what it points at is built, then solid, so it's seen before it's named
    (the user: "words like 'trigger' are shown before they're named"): a platform's gap once it's the
    only target left; a stack once its first balloon's down, and the square for the fourth once there
    are three; a balloon's drop once it's on the board. On your go (n the last), your pair's ghost too,
    and its drops and what pops in what order solid. */
export function marks(routine: Routine, n: number): Mark[] {
  const P = plan(routine), last = routine.twists.length - 1, yours = n >= last, g = setup(routine, Math.min(n, last)), out: Mark[] = [];
  const has = ([r, c]: Sq, colour: number) => g.grid[r][c]?.c === colour;
  // (solid once what it points at is there; till then, to come: faint)
  const mark = (m: Mark, there: boolean) => { out.push(there ? m : { ...m, faint: true }); };
  for (const gap of P.gaps) {
    const p = g.platforms.find((q) => q.targets.some((t) => same([t.r, t.c], gap.at)))!;
    mark({ kind: 'gap', ...gap }, p.targets.every((t) => same([t.r, t.c], gap.at) || has([t.r, t.c], t.colour)));
  }
  for (const l of P.lines) {
    const of = l.stack.filter((s) => has(s, l.colour)).length;
    mark({ kind: 'stack', cells: l.stack, colour: l.colour, of }, of > 0);
    for (const at of l.four) mark({ kind: 'four', at, colour: l.colour }, of === l.stack.length);
  }
  for (const d of P.drops) mark({ kind: 'drop', from: d.from, to: d.to, colour: d.colour }, yours || (!d.yours && has(d.from, d.colour)));
  if (yours) out.push({ kind: 'ghost', cells: P.ghost });
  // (each pop's number by the top left of what pops)
  for (const p of P.pops) mark({ kind: 'pop', n: p.n, at: p.cells.reduce((a, b) => (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1]) ? b : a)) }, yours);
  return out;
}

/** What's said as an act goes: to start, as each twist's twisted (one each, in order; fewer and the
    rest go quietly), handing you the last one (`yours`), each time you miss (`again`, in turn), as she
    shows you after all (`help`), and once it's popped. That's chatter, in a bubble over her head.
    What's for you to do or to watch isn't (the user, 11 Nov: "when she's telling me blue over the
    yellow and top the stack, that should be a lot clearer that it's just not her being a bit just
    chatting. It's an actual instruction to you, and it should be more prominent and persistent"): it's
    a note in a panel by the board, up till the next replaces it (ShowEvent 'note'): `brief` as the act
    starts, `watch[i]` once her twist i is down (its mark just shown on the board), `task` on your go,
    `chain` once it's set off. */
export interface Says {
  start?: string; twists?: readonly string[]; yours?: string; again?: readonly string[]; help?: string; popped?: string;
  brief?: string; watch?: Readonly<Record<number, string>>; task?: string; chain?: string;
}
/** An act of a show: a routine, what's said, and whether the last twist is yours to drop (`you`: she
    sets the balloons up, you do the pop; the user, 11 Nov: "it should definitely be like a now you try
    thing. And, you know, she sets up the balloons, you do the pop"). */
export interface Act { routine: Routine; says?: Says; you?: boolean }

/** Seconds: a line to start; a twist in hand (the first balloon blown up and tied off, squeak; the
    second, squeak; pegged together and tossed onto the board: SQUEAKS and TOSS are its fractions); a move
    of the pair steered down the board; your turn's line (then it waits for you); the chain once it's
    going (the board plays it: a show waits while it does); after it's popped. A beat with a line is at
    least as long as its line takes to read. HELP: misses before she shows you how after all.
    Your go comes in at the top of the board as in the real game, and with time to steer (the user, 11
    Nov: "surely it should start at the top ... give you a bit more of a chance"): it waits there
    YOU_WAIT while she hands it over, then falls a row every YOU_FALL (slower than at sea's
    src/sail-pair.ts FALL.SECS; Space still speeds it). */
export const SHOW = { START: 2.6, TWIST: 3.4, SQUEAKS: [0.38, 0.76], TOSS: 0.86, STEP: 0.055, LAND: 0.35, YOURS: 2.4, POP: 0.6, AFTER: 3, HELP: 3, YOU_WAIT: 2, YOU_FALL: 0.9 } as const;

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
  /** An instruction to you (Says: brief, watch, task, chain), up till the next ('' takes it down);
      `yours`: it's your go. */
  | { kind: 'note'; text: string; yours: boolean }
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
      // (and once it's down, long enough to read a note on what it's for: before the next replaces it)
      const w = S.watch?.[i];
      add(k, 'fall', i, P.routes[i].length * SHOW.STEP + SHOW.LAND + (w ? secs(w) : 0));
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
      const S = this.acts[b.act].says ?? {};
      if (n === 0 || b.act !== this.beats[n - 1].act) {
        if (this.t >= b.t0 && !this.sent.has(`${n}:act`)) this.misses = 0;
        once('act', 0, { kind: 'act', act: b.act });
        once('brief', 0, { kind: 'note', text: S.brief ?? '', yours: false });
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
        const down = this.shows[b.act].routes[b.i].length * SHOW.STEP + SHOW.LAND * 0.5, w = S.watch?.[b.i];
        once('land', down, { kind: 'land', act: b.act, twist: b.i });
        if (w) once('watch', down, { kind: 'note', text: w, yours: false });
      }
      if (b.kind === 'yours') {
        once('yours', 0, { kind: 'yours', act: b.act, twist: b.i });
        if (S.task) once('task', 0, { kind: 'note', text: S.task, yours: true });
      }
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
    const n = this.index(), b = this.beats[n], want = this.shows[b.act].steps, S = this.acts[b.act].says ?? {};
    // (once it's set off, what to watch pop: the note on your go comes down)
    const chain: ShowEvent = { kind: 'note', text: S.chain ?? '', yours: false };
    if (steps >= want) { this.through.add(n); return { result: 'hit', events: [chain] }; }
    this.misses++;
    const again = S.again ?? [], events: ShowEvent[] = [{ kind: 'again', act: b.act, misses: this.misses }];
    if (this.misses >= SHOW.HELP) {
      this.through.add(n);
      events.push(chain);
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
