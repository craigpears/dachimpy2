/* Pirate Den: the wolf den, a first version (14 Nov). TypeScript, compiled to js/den-wolfden.js; tested in
   tests/den-wolfden.test.ts. js/den/wolfden-house.js plays it in the house shell (js/den/house.js): a hut of its own
   (not in the housing district's list) on Multibella's island (src/den-multibella.ts), its round star table with Duty
   Navigation's wheel lying on it, the moon in its window. Its lines are Multibella's, src/lines/multibella.ts's
   WOLF_DEN; the tutorial it teaches, described in the shape every tutorial shares, is src/wolf-den-tutorial.ts.

   Asked for by Dignity (the real pirate behind the checkpoint's commander): "the 4-tier duty nav in the werewolf den"
   (13 Nov), and the user, 14 Nov: "build the building, the at least do a first version of it". From IDEAS.md,
   "Dignity's tutorial: four-tier Duty Navigation in the werewolf den": the Wolf Dens Guide (a player's, on r/ypp), the
   run in the screenshots the user shared, and Multibella's telling of the wilds. Multibella teaches it, on an island
   of her own (the user, 14 Nov: "Thought the plan was for her to do the wolf den tutorial and would expect her to have
   her own island similar to others"); she was Dignity at first.

   The puzzle is src/navigation.ts's, on a wolf den's board (`den: true`): four rings, the den's constellations, wild
   places, a chain's chart times its step. Here: the hut, the table, the moon (each window starts full, about 200
   charted points a werewolf in the next pack; each chart takes its points off, and as it wanes they turn back to
   wolf-kin, the guide's), and the lesson's boards, each laid for a part of the tutorial and the moves Multibella plays on
   it, and when she says what as they play (her cues, `stageCues`; the words are src/lines/multibella.ts's LESSON).
   The deeper mechanics (15 Nov, after the user played the basics): a cascade making wild targets, the outer ring where
   stars wait, a constellation charted by a cascade's last clear, and Umami's evil constellation (a fun one, not the
   lesson); and Umami's run from his replay, the lesson's "How it works" (`replay`); and the quick double, speed nav (`quick`). Her opening, the first time you
   come in: spinning the wheel frantically as the werewolves come, the moon waning (`OPENING`). Not yet (to come,
   with the user): the rumbles, the den's Foraging. */
import { Navigation, bottomRow, type Mark, type NextStar, type Place, type Stage } from './navigation.js';
import type { Plan, Piece } from './den-houses.js';

// ---------------------------------------------------------------- the hut

/** One room, a log hut, the camera looking in from the front (its front wall cut low, a doll's house). */
export const PLAN: Plan = {
  rooms: [{ id: 'hut', name: 'The star table', x0: -4.6, x1: 4.6, z0: -3, z1: 3, paper: '#3b2c22' }],
  doors: [],
  out: { x: 0, z: 2.35, r: 0.9 },
};
export const WALLS = { high: 3.6, low: 0.45 } as const;
/** The back wall's face (z). */
export const BACK = PLAN.rooms[0].z0 + 0.2;
/** Where you come in, and where Multibella waits: at the table's left, a cookie in hand. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: -1.75, z: -0.55 } } as const;
/** The round star table: its middle, its top's radius and height, and the wheel lying on it (its width). */
export const TABLE = { x: 0, z: -0.55, r: 1.15, top: 0.95, board: 2.0 } as const;
/** Close enough to the table to chart at it. */
export const atTable = (p: { x: number; z: number }): boolean => Math.hypot(p.x - TABLE.x, p.z - TABLE.z) < TABLE.r + 0.95;
/** The window in the back wall, the moon through it (and a werewolf's shadow, turning back as the moon wanes). */
export const WINDOW = { x: 2.7, y: 2.05, w: 1.3, h: 1.05 } as const;
/** What's in the hut beside the table: candles and lanterns, barrels, a crate of charts, a rug under the table, and a
    side table with a plate of chocolate chip cookies. */
export const FURNISH: readonly Piece[] = [
  { kind: 'rug', x: 0, z: -0.55, col: '#4a2a3a' },
  { kind: 'table', x: -3.4, z: -1.9 },
  { kind: 'barrel', x: 3.7, z: -2.2 },
  { kind: 'barrel', x: 4.0, z: -1.4 },
  { kind: 'crate', x: -3.9, z: 0.6, yaw: 0.4 },
  { kind: 'lantern', x: -2.6, z: -2.45 },
  { kind: 'lantern', x: 2.0, z: -2.45 },
  { kind: 'candelabra', x: 3.6, z: 0.3 },
];

// ---------------------------------------------------------------- the moon

/** The den's moon (the Wolf Dens Guide): about this many points charted a werewolf in the pack; and the pack this
    first version's window starts with. */
export const MOON = { PER_WOLF: 200, PACK: 4 } as const;
/** What a chart did to the moon: how many werewolves it turned back, and whether that was half the pack or the last. */
export interface Waned { turned: number; half: boolean; last: boolean }
/** A window's moon: full at the start, each chart's points off it; the share of it left says how many werewolves are
    still werewolves (rounded up: the last is turned back only when the moon's gone). */
export class Moon {
  readonly full: number;
  left: number;
  constructor(readonly pack: number = MOON.PACK) { this.full = pack * MOON.PER_WOLF; this.left = this.full; }
  /** How much of it is left, 0 to 1. */
  share(): number { return this.left / this.full; }
  /** The werewolves still werewolves. */
  werewolves(): number { return Math.ceil(this.pack * this.share() - 1e-9); }
  /** A constellation's points charted: off the moon. */
  chart(points: number): Waned {
    const was = this.werewolves();
    this.left = Math.max(0, this.left - Math.max(0, points));
    const now = this.werewolves(), half = Math.ceil(this.pack / 2);
    return { turned: was - now, half: was > this.pack - half && now <= this.pack - half && now > 0, last: was > 0 && now === 0 };
  }
  /** The next pack, the moon full again. */
  rise(): void { this.left = this.full; }
}

// ---------------------------------------------------------------- the lesson's boards

/** A move Multibella plays: a ring turned (+1 clockwise, -1 anticlockwise), or the next star dropped. `next`: the star
    that comes before it, its colour and spoke (her lesson's stars come as they come, shown before she says what she'll
    do with them: the user, 20 Nov, "the tutorial seems to be making an insinuation that you can magically predict that
    the white is coming next"). */
export type Step = ({ turn: number; dir: 1 | -1 } | { drop: true }) & { next?: { c: number; spoke: number } };
/** A board laid for the lesson: its stars ring by ring (0 the innermost, colours as COLOUR_NAMES: 0 yellow, 1 red,
    2 orange, 3 white, 4 blue), the constellation's places, the next star waiting, and the moves she plays on it.
    `plan`: the places her plan's about, ringed on the board while she says it, before she plays (RULES.md, "A
    demonstration shows its plan before it builds"); `then`: the board she lays next, once this one's played. */
export interface Laid { rings: (number | null)[][]; marks: Mark[]; next?: Omit<NextStar, 'id'>; moves: Step[]; plan?: Place[]; then?: string; marked?: true; markFrom?: number }
const [Y, R, O, W, B] = [0, 1, 2, 3, 4];
const _ = null;
/** The lesson's boards, by name (a tutorial part's `shows.ref`, after its kind). Each is tested to do what its part
    says (tests/den-wolfden.test.ts). */
export const BOARDS: Readonly<Record<string, Laid>> = {
  /* A fresh den's board as you'd find it: the four rings, the first constellation (3 in the centre, 1 in the
     middle), a few stars down, some up in the fourth ring over full spokes. */
  rings: {
    rings: [
      [O, W, B, _, R, Y, _, W],
      [B, R, _, _, W, O, _, _],
      [W, _, _, _, Y],
      [Y],
    ],
    marks: [{ ring: 0, spoke: 2, colour: Y }, { ring: 0, spoke: 3, colour: R }, { ring: 0, spoke: 6, colour: B }, { ring: 1, spoke: 3, colour: O }],
    next: { c: R, spoke: 3 },
    moves: [],
  },
  /* Umami's run, from his replay (notes/wolf-den/, the user's screenshots of 14 Nov: "the tutorial thing I was
     intending", 15 Nov), its constellation where his was: an orange target in the centre ring at the top, a yellow
     over it and a red on the left in the middle ring, a yellow up-left in the third (71). Three are filled, but a blue
     sits in the orange one. A white dropped down the lower left makes three round the centre: "Single! +3". The red
     over the first white falls in beside the two reds: "Double! +6", a combo's clear, and the orange target beside it
     goes every colour (wild), the blue in it counting. So the constellation's charted on the third step: "Triple!
     Constellation! +213", and the next goes up with four wild targets in its centre (two clears before the chart).
     Her lesson's "How it works" walks it a beat at a time (src/wolf-den-tutorial.ts's WALK). */
  replay: {
    rings: [
      [B, R, R, W, W, _, O, B],
      [Y, O, B, R, B, _, R, W],
      [_, Y, W, _, O, _, _, Y],
      [_, B],
    ],
    marks: [{ ring: 0, spoke: 0, colour: O }, { ring: 1, spoke: 0, colour: Y }, { ring: 1, spoke: 6, colour: R }, { ring: 2, spoke: 7, colour: Y }],
    next: { c: W, spoke: 5 },
    moves: [{ drop: true }],
    plan: [{ ring: 0, spoke: 0 }, { ring: 0, spoke: 3 }, { ring: 0, spoke: 4 }, { ring: 0, spoke: 5 }, { ring: 1, spoke: 3 }, { ring: 0, spoke: 1 }, { ring: 0, spoke: 2 }],
  },
  /* The quick double, speed nav (the user, 15 Nov: "it's speed nav and quick doubles is a good strategy. So a layer of
     three so you can line up two pieces in the outer ring and it's nice and simple"; their board, notes/wolf-den/
     quick-double.png), as you'd really play it (20 Nov, after playing the first goes: "the first step is ... we're
     building the bottom two rings basically like normal, we're just filling them in. And then by the time we get to the
     third ring, we're saying, right, we want to wait for an opportunity ... I've already got a red ... That's the ...
     basis for the first part of the double ... this is so methodical and easy to recreate. So now all I need is to get
     a red and a yellow piece next to each other in the outer ring"; and "you can['t] magically predict that the white is
     coming next"). The constellation's yellow target on the third ring at the top, a red already beside it, up-right.
     Stars come as they come (each step's `next`, shown before she says what she'll do with it): a blue and an orange
     fill the bottom two rings in, like normal; a blue that's no use goes on the third ring out of the way; a red, onto
     the target beside the red: the pair, its gap up-left. A red: parked on the outer ring, right, over a full spoke. A
     yellow, two spokes on: the outer ring turned on one to bring the red right up beside where it'll land, and the
     yellow dropped in behind it. The outer ring turned back round toward the gap, four places: the red drops into the
     gap, three reds, "Single! +3"; the yellow, right behind, falls into the emptied target: charted on the second step,
     "Double! Constellation!", 71 times two. Her lesson's "Speed nav" walks it a beat at a time (src/wolf-den-
     tutorial.ts's WALKS.quick), its plan marked on the board from when she spots the red (`planMarks`, `markFrom`). */
  quick: {
    rings: [
      [O, Y, R, R, B, W, Y, B],
      [_, O, Y, W, _, Y, B, W],
      [_, R, O, W, _, B, Y, _],
    ],
    marks: [{ ring: 0, spoke: 3, colour: R }, { ring: 1, spoke: 4, colour: O }, { ring: 1, spoke: 6, colour: B }, { ring: 2, spoke: 0, colour: Y }],
    next: { c: B, spoke: 0 },
    moves: [
      { drop: true, next: { c: B, spoke: 0 } }, { drop: true, next: { c: O, spoke: 4 } },
      { drop: true, next: { c: B, spoke: 4 } }, { drop: true, next: { c: R, spoke: 0 } },
      { drop: true, next: { c: R, spoke: 2 } }, { turn: 3, dir: 1, next: { c: Y, spoke: 4 } }, { drop: true },
      { turn: 3, dir: -1 }, { turn: 3, dir: -1 }, { turn: 3, dir: -1 }, { turn: 3, dir: -1 },
    ],
    marked: true,
    markFrom: 3,
  },
  /* A Trapdoor: the third ring turned a place puts a red over two reds down spoke 0; they go, and the yellow parked
     above them in the fourth ring falls into the place. */
  trapdoor: {
    rings: [
      [R, W, _, _, _, _, _, O],
      [R, B, _, _, _, _, _, B],
      [W, R],
      [Y],
    ],
    marks: [{ ring: 0, spoke: 0, colour: Y }],
    next: { c: W, spoke: 4 },
    moves: [{ turn: 2, dir: -1 }],
  },
  /* An Echo: the middle ring turned a place brings its red onto the place; charted, it goes, and the blue above it
     falls between two blues round the ring: a line. */
  echo: {
    rings: [
      [O, W, O, _, _, _, _, W],
      [B, R, B],
      [B],
    ],
    marks: [{ ring: 1, spoke: 0, colour: R }],
    next: { c: Y, spoke: 4 },
    moves: [{ turn: 1, dir: -1 }],
  },
  /* A cascade, lines only (Single +3, Double +6, Triple +9): the red dropped makes a line round the third ring; the
     blue parked above it in the fourth falls between two blues, a line; and the yellow parked above that falls onto two
     yellows down their spoke. The Double's and the Triple's clears, in a combo, turn the slots beside them wild. */
  cascade: {
    rings: [
      [B, W, Y, O, W, B, Y, R],
      [R, O, Y, W, B, W],
      [_, B, B, R, _, R],
      [_, _, Y, B],
    ],
    marks: [{ ring: 0, spoke: 3, colour: B }, { ring: 0, spoke: 6, colour: R }, { ring: 0, spoke: 0, colour: O }, { ring: 1, spoke: 3, colour: Y }, { ring: 1, spoke: 6, colour: W }, { ring: 2, spoke: 4, colour: Y }],
    next: { c: R, spoke: 4 },
    moves: [{ drop: true }],
    plan: [{ ring: 2, spoke: 3 }, { ring: 2, spoke: 5 }, { ring: 3, spoke: 3 }, { ring: 3, spoke: 2 }],
  },
  /* The outer ring, where stars wait: a yellow dropped onto a full spoke stays up in the fourth ring; the fourth ring
     turned carries it round, still waiting, over the yellow slot's spoke; the third ring turned puts a white over two
     whites; they go, the yellow falls into the slot, and it's charted on the second step. Then the next constellation
     goes up, three, two and one, its centre wild. */
  outer: {
    rings: [
      [O, R, W, B, Y, R, B, O],
      [B, Y, W, O, R, W, Y, W],
      [B, W, O, R, Y, B, O, R],
      [],
    ],
    marks: [{ ring: 0, spoke: 2, colour: Y }, { ring: 0, spoke: 5, colour: R }, { ring: 0, spoke: 7, colour: O }, { ring: 1, spoke: 4, colour: R }, { ring: 1, spoke: 6, colour: Y }, { ring: 2, spoke: 5, colour: Y }],
    next: { c: Y, spoke: 1 },
    moves: [{ drop: true }, { turn: 3, dir: 1 }, { turn: 2, dir: 1 }],
    plan: [{ ring: 0, spoke: 2 }, { ring: 1, spoke: 2 }, { ring: 2, spoke: 1 }],
  },
  /* The cascade's last clear charts it: the same cascade as `cascade`'s, on a constellation of the usual three, two and
     one (its centre wild, from a chain before) with only the third ring's slot left, a blue in an orange slot. The
     Double's clear takes the blue and turns the slot wild; the yellow parked above falls into it, and it's charted on
     the third step: 125 times three, where a line is 3. Two clears before it: the next one's centre four wild. */
  lastClear: {
    rings: [
      [B, W, Y, O, W, B, Y, R],
      [R, O, Y, W, B, W],
      [_, B, B, R, _, R],
      [_, _, Y, B],
    ],
    marks: [{ ring: 0, spoke: 0, colour: R, wild: true }, { ring: 0, spoke: 4, colour: Y, wild: true }, { ring: 0, spoke: 6, colour: O, wild: true }, { ring: 1, spoke: 1, colour: O }, { ring: 1, spoke: 5, colour: W }, { ring: 2, spoke: 2, colour: O }],
    next: { c: R, spoke: 4 },
    moves: [{ drop: true }],
    plan: [{ ring: 2, spoke: 2 }, { ring: 3, spoke: 2 }],
  },
  /* Umami's evil constellation (IDEAS.md, "The evil constellation"; the user's, 11 Nov), first a star at a time: six
     reds side by side round the centre, four in, and the fifth dropped makes five in a row, a line, gone. */
  evilTry: {
    rings: [
      [R, R, _, R, R, _, B, O],
    ],
    marks: bottomRow(R, 6),
    next: { c: R, spoke: 2 },
    moves: [{ drop: true }],
    then: 'evil',
  },
  /* ...then by a combo, the user's way ("put 2 in there ... 2 of the first color in the ring above those 2, so that
     when you do a combo ... it creates a gap and it falls down"): whites in the two gaps, a white over each in the
     third ring and the reds waiting above them in the fourth; the middle ring turned puts a white under each, both
     spokes go at once, and both reds land together: charted on the second step, 243 times two. */
  evil: {
    rings: [
      [R, R, W, R, R, W],
      [B, W, O, Y, W, B],
      [_, _, W, _, _, W],
      [_, _, R, _, _, R],
    ],
    marks: bottomRow(R, 6),
    next: { c: O, spoke: 6 },
    moves: [{ turn: 1, dir: 1 }],
    plan: [{ ring: 0, spoke: 2 }, { ring: 0, spoke: 5 }, { ring: 1, spoke: 1 }, { ring: 1, spoke: 4 }, { ring: 2, spoke: 2 }, { ring: 2, spoke: 5 }, { ring: 3, spoke: 2 }, { ring: 3, spoke: 5 }],
  },
};
/** A lesson's boards in turn: the one named, then each it says to lay next (`then`). */
export function boardsOf(name: string): string[] {
  const out: string[] = [];
  for (let n: string | undefined = name; n && BOARDS[n] && !out.includes(n); n = BOARDS[n].then) out.push(n);
  return out;
}

/* Her cues: when she says what as a board's moves play (the words are src/lines/multibella.ts's LESSON, a board's
   lines keyed by its cues). 'set' as it's laid (its plan ringed), `move<n>` before its nth move (once the one before
   it is shown), `step<n>` as the nth clear or chart of a move's cascade is shown, 'wild' as a clear turns slots wild,
   'chart' as a constellation's charted, 'deal' as the next one goes up, 'end' once it's all been shown. Each is said
   once a board, the first time it comes; the board waits while she talks. */
export const CUES = ['set', 'wild', 'chart', 'deal', 'end'] as const;
export const isCue = (key: string): boolean => (CUES as readonly string[]).includes(key) || /^(move|step)[1-9]$/.test(key);
/** The cues a stage sets off as it's shown (`step`: its step in the move's cascade, a line's or a chart's), in the
    order she says them. */
export function stageCues(st: Pick<Stage, 'kind' | 'wilded'>, step = 0): string[] {
  const out: string[] = [];
  if ((st.kind === 'line' || st.kind === 'constellation') && step > 0) out.push(`step${step}`);
  if (st.wilded?.length) out.push('wild');
  if (st.kind === 'constellation') out.push('chart');
  if (st.kind === 'deal') out.push('deal');
  return out;
}
/** Every cue a board sets off, played from as it's laid: what the lesson can say on it. */
export function cuesOn(name: string, random: () => number = Math.random): Set<string> {
  const b = layBoard(name, random), out = new Set<string>(['set', 'end']);
  if (!b) return out;
  b.moves.forEach((step, i) => {
    out.add(`move${i + 1}`);
    let n = 0;
    for (const st of playStep(b.game, step).stages) for (const c of stageCues(st, st.kind === 'line' || st.kind === 'constellation' ? ++n : 0)) out.add(c);
  });
  return out;
}
/** A lesson board laid on a den's Navigation of its own: the game, and the moves to play on it. Null if there's no
    such board. */
export function layBoard(name: string, random: () => number = Math.random): { game: Navigation; moves: Step[] } | null {
  const L = BOARDS[name];
  if (!L) return null;
  const game = new Navigation(random, { den: true });
  game.lay(L.rings.map((ring) => Array.from({ length: 8 }, (_v, s) => ring[s] ?? null)), L.marks);
  // (a board's first constellation counts as one after a fresh board's, so what's dealt after it is the den's usual)
  game.completed = 1;
  if (L.next) game.next = { id: 9000, ...L.next };
  return { game, moves: [...L.moves] };
}
/** Play one of a lesson's moves on its game (the star that comes before it first, if it says). */
export function playStep(game: Navigation, step: Step) {
  if (step.next && (game.next.c !== step.next.c || game.next.spoke !== step.next.spoke)) game.place(step.next);
  return 'drop' in step ? game.drop() : game.turn(step.dir, step.turn);
}

/* The plan marked on a lesson's board, Sailing's way (src/balloons.ts's marks; RULES.md, "A demonstration shows its
   plan before it builds"; the user, 20 Nov, of the quick double: "it's not really showing the plan in the way that
   sailing is"): the whole of what she's building on the board from the start, each part faint till it's built, then
   solid, read off the board as the rules play it, so it can't point at the wrong place. For a board built then set
   off (`marked`): its drops build it, the turns after the last drop set it off. Marked: the stars of the line that
   goes first already in place (`star`), the gap they leave (`gap`), each star parked on the outer ring by the order it
   lands ("1st", "2nd"; riding round with its ring), an arrow from each to where it lands, and what happens in order
   (`badge`: 1, the Single, at the gap; 2, the Double, where the second lands). */
export type PlanMark = (
  | { kind: 'star'; at: Place; colour: number; label: string }
  | { kind: 'gap'; at: Place; label: string }
  | { kind: 'arrow'; from: Place; to: Place; colour: number; dir: 1 | -1 }
  | { kind: 'badge'; at: Place; n: number; label: string }
) & { faint?: true };
const placeOf = (grid: Navigation['grid'], id: number): Place | null => {
  for (let r = 0; r < grid.length; r++) for (let s = 0; s < grid[r].length; s++) if (grid[r][s]?.id === id) return { ring: r, spoke: s };
  return null;
};
/** What's marked on a lesson's board once `n` of its moves are played (see PlanMark); none for a board that isn't
    `marked`, or once it's been set off. */
export function planMarks(name: string, n: number): PlanMark[] {
  const L = BOARDS[name];
  if (!L?.marked) return [];
  const steady = () => 0.5, lastDrop = L.moves.map((m) => 'drop' in m).lastIndexOf(true);
  // (from where she spots it, `markFrom`, till it's set off)
  if (n >= L.moves.length || n < (L.markFrom ?? 0)) return [];
  // (the board built, then set off, every stage seen)
  const g = layBoard(name, steady)!.game, outer = g.rings - 1;
  L.moves.slice(0, lastDrop + 1).forEach((s) => playStep(g, s));
  const built = g.grid.map((ring) => ring.slice());
  const parked = built[outer].flatMap((x, spoke) => (x ? [{ id: x.id, c: x.c, at: { ring: outer, spoke } }] : []));
  const spin = L.moves.slice(lastDrop + 1);
  const dir = spin.find((m): m is { turn: number; dir: 1 | -1 } => 'turn' in m)?.dir ?? -1;
  const stages = spin.flatMap((s) => playStep(g, s).stages);
  // (the line that goes first: where its stars were as it went, on the board the stage before it left)
  const li = stages.findIndex((st) => st.kind === 'line');
  if (li < 1) return [];
  const lineAt = stages[li].cleared.map((id) => placeOf(stages[li - 1].grid, id)).filter((p): p is Place => !!p);
  const lands = parked.map((p) => {
    const i = stages.findIndex((st) => { const at = placeOf(st.grid, p.id); return !!at && at.ring < outer; });
    return i < 0 ? null : { ...p, to: placeOf(stages[i].grid, p.id)!, i };
  }).filter((p): p is NonNullable<typeof p> => !!p).sort((a, b) => a.i - b.i);
  // (where things stand after n moves)
  const now = layBoard(name, steady)!.game;
  L.moves.slice(0, n).forEach((s) => playStep(now, s));
  const has = (p: Place, c: number) => now.grid[p.ring][p.spoke]?.c === c;
  const out: PlanMark[] = [];
  const mark = (m: PlanMark, there: boolean) => { out.push(there ? m : { ...m, faint: true }); };
  // (the pair: a star already there first, the one she spots, tagged)
  const laid = layBoard(name, steady)!.game.grid;
  const pair = lineAt.filter((p) => built[p.ring][p.spoke]).sort((p, q) => Number(!!laid[q.ring][q.spoke]) - Number(!!laid[p.ring][p.spoke]));
  const gap = lineAt.find((p) => !pair.includes(p));
  pair.forEach((p, k) => mark({ kind: 'star', at: p, colour: built[p.ring][p.spoke]!.c, label: k === 0 ? 'pair' : '' }, has(p, built[p.ring][p.spoke]!.c)));
  if (gap) mark({ kind: 'gap', at: gap, label: 'gap' }, pair.every((p) => has(p, built[p.ring][p.spoke]!.c)));
  const ready = n > lastDrop;
  lands.forEach((l, k) => {
    const at = placeOf(now.grid, l.id) ?? l.at;
    mark({ kind: 'star', at, colour: l.c, label: k === 0 ? '1st' : k === 1 ? '2nd' : `${k + 1}th` }, !!placeOf(now.grid, l.id));
    mark({ kind: 'arrow', from: at, to: l.to, colour: l.c, dir }, ready);
  });
  if (gap) mark({ kind: 'badge', at: gap, n: 1, label: 'Single' }, ready);
  if (lands[1]) mark({ kind: 'badge', at: lands[1].to, n: 2, label: 'Double' }, ready);
  return out;
}
/** Seconds between Multibella's moves on a lesson's board, and how long she waits before the first. */
export const PACE_LESSON = { MOVE: 1.1, FIRST: 1.6 } as const;

// ---------------------------------------------------------------- her opening

/* Her opening, a little cutscene the first time you come in (the user, 14 Nov, on the wolf den's idea card, "Funny
   cutscenes": her spinning the wheel frantically as the moon wanes; 15 Nov, missing it: "I thought she was supposed to
   be ... turning the table and doing all of the things, like just like spinning it ... stop the werewolves coming").
   js/den/wolfden-opening.js plays it (js/den/cine.js); her words are src/lines/multibella.ts's OPENING, by `say`. */
export type OpeningShot = 'hut' | 'wheel' | 'window' | 'her';
export interface OpeningBeat { at: number; shot: OpeningShot; say: 'frantic' | 'spin' | 'waning' | 'phew' }
export const OPENING = {
  /** Its length (s). */
  SECS: 13.5,
  /** Its beats: from when (s), the camera's shot, her line. */
  BEATS: [
    { at: 0, shot: 'hut', say: 'frantic' },
    { at: 3.4, shot: 'wheel', say: 'spin' },
    { at: 6.8, shot: 'window', say: 'waning' },
    { at: 10.2, shot: 'her', say: 'phew' },
  ] as readonly OpeningBeat[],
  /** Her hands on the wheel: a ring turned or a star dropped every EVERY seconds, till UNTIL. */
  SPIN: { EVERY: 0.17, UNTIL: 10 },
  /** The moon in the window: full till FROM, gone by TO, the werewolf turning back to a wolf-kin as it goes. */
  WANE: { FROM: 2.2, TO: 9.6 },
} as const;
/** Her opening at `t` seconds: its beat (the index in BEATS), how much moon's left, whether she's still spinning,
    and whether it's over. */
export function openingAt(t: number): { beat: number; moon: number; spinning: boolean; done: boolean } {
  let beat = 0;
  OPENING.BEATS.forEach((b, i) => { if (t >= b.at) beat = i; });
  const { FROM, TO } = OPENING.WANE, moon = Math.max(0, Math.min(1, 1 - (t - FROM) / (TO - FROM)));
  return { beat, moon, spinning: t < OPENING.SPIN.UNTIL, done: t >= OPENING.SECS };
}
