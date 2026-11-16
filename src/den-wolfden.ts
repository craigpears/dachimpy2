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
   stars wait, a constellation charted by a cascade's last clear, and Umami's evil constellation. Not yet (to come, with the user): the rumbles, the den's Foraging, the funny cutscenes. */
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

/** A move Multibella plays: a ring turned (+1 clockwise, -1 anticlockwise), or the next star dropped. */
export type Step = { turn: number; dir: 1 | -1 } | { drop: true };
/** A board laid for the lesson: its stars ring by ring (0 the innermost, colours as COLOUR_NAMES: 0 yellow, 1 red,
    2 orange, 3 white, 4 blue), the constellation's places, the next star waiting, and the moves she plays on it.
    `plan`: the places her plan's about, ringed on the board while she says it, before she plays (RULES.md, "A
    demonstration shows its plan before it builds"); `then`: the board she lays next, once this one's played. */
export interface Laid { rings: (number | null)[][]; marks: Mark[]; next?: Omit<NextStar, 'id'>; moves: Step[]; plan?: Place[]; then?: string }
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
  /* The run in the screenshots ("Single! +3", "Double! +6", "Triple! Constellation!"): the red dropped makes a line
     round the third ring; the orange above falls onto two below it, a line down its spoke, beside the constellation's
     place holding a blue; that combo's clear turns it wild, the blue counts, and it's charted on the third step. */
  run: {
    rings: [
      [_, _, W, O, B],
      [_, _, B, O, W],
      [_, _, R, R],
      [_, _, _, O],
    ],
    marks: [{ ring: 0, spoke: 4, colour: Y }],
    next: { c: R, spoke: 4 },
    moves: [{ drop: true }],
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
/** Play one of a lesson's moves on its game. */
export function playStep(game: Navigation, step: Step) {
  return 'drop' in step ? game.drop() : game.turn(step.dir, step.turn);
}
/** Seconds between Multibella's moves on a lesson's board, and how long she waits before the first. */
export const PACE_LESSON = { MOVE: 1.1, FIRST: 1.6 } as const;
