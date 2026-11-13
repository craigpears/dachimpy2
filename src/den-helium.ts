/* Pirate Den: Helium's island, their still, and Distilling taught at it. TypeScript, compiled to
   js/den-helium.js; tested in tests/den-helium.test.ts. js/den/helium-isle.js draws the island and places
   them from HELIUM_CAST (below), plain data; the squares are LAY.HELIUM in src/den-sail.ts; the puzzle is
   src/distilling.ts (its look js/den/distill-board.js), the planner their help reads your board with
   src/distill-bots.ts's `advise`; their lines src/lines/helium.ts.

   The user (11 and 12 Nov, IDEAS.md "Helium, and Distilling"; DISTILLING.md §7, items 3 and 4): Helium, a
   real pirate who "really loves distilling", teaches it "very kind of by the by", on "his own little
   island ... I bet he just wants an island for him somewhere", near the smugglers' beach where their rum
   would one day go out. The first time you come up off it, a little cutscene on a real board: a column with
   a white in it goes down into the furnace and the still goes bang, which they shrug off ("Let a white go
   down the furnace. Just a little distilling mishap."); then their lesson, technique not the basics (13
   Nov): step one, the whites on the fire's side ringed and walked out. Then "now you try": the still's yours, a real session, and "Help, Helium" while you play: "helium should kind of
   detect what stage you're at and show you what technique ... It's context aware". They read your board
   (`advise`), say in a line what they'd do and why, naming the technique, and play it on your board.
   Space off their island again and you're back at the still. Their distillery answers the board (13 Nov,
   worksFor below): a white burned blows it up, whites sent up run rum into casks. Not yet: the smuggling
   ring, the penguin's link to them, the coached replay, the lesson's later steps (IDEAS.md, TODO.md). */

import { LAY, type Pose } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { PACE, type Script } from './chatter.js';
import { seeded } from './mirror-row.js';
import { BURNT, COLS, Distilling, WHITE, goesUp, type Board } from './distilling.js';
import { advise, type Advice } from './distill-bots.js';
import { ROUTINES, isJunk } from './distill-routines.js';
import { AFTER, HELP, HELP_ELSE, LESSON, MISHAP, ONWARD, OPENING, PRAISE, STEP_ONE, TELL } from './lines/helium.js';
import { AT_HELIUMS } from './lines/you.js';

const H = LAY.HELIUM;
export const HELIUM = {
  /** Its name, at the foot of the screen off it. */
  NAME: "Helium's Island",
  /** Within earshot: squares from where they stand. */
  EARSHOT: 4,
} as const;

const key = (c: number, r: number) => `${c},${r}`;
const land = new Set(H.LAND.map(([c, r]) => key(c, r)));
/** Their island's first square: they, their still, their board and the lesson's camera are placed from it, so the
    island moves as one. */
const O = H.LAND[0];
const off = (c: number, r: number): [number, number] => [O[0] + c, O[1] + r];
/** Their island's squares. */
export const heliumAt = (c: number, r: number): boolean => land.has(key(c, r));
/** The water round their island, every square beside it (diagonally too): where their lesson's seen, and
    Space takes you to the still (as round Tzz's). */
export function onHeliumLanding(c: number, r: number): boolean {
  return !heliumAt(c, r) && H.LAND.some(([x, y]) => Math.abs(x - c) <= 1 && Math.abs(y - r) <= 1);
}
/** Their island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const heliumShore = (): [number, number][] => shoreOf(H.LAND);
/** Where they stand: just beside their board, on the side toward their distillery, so at the still they're in
    the shot and their line's read beside it (the user, 13 Nov: they were "too far to the right"). */
export const HELIUM_STANDS = { c: O[0] - 0.1, r: O[1] + 0.68 } as const;
export const inHeliumEarshot = (c: number, r: number): boolean => Math.hypot(c - HELIUM_STANDS.c, r - HELIUM_STANDS.r) <= HELIUM.EARSHOT;
/** Where the sloop's brought alongside as their lesson begins, out of its shot. */
export const HELIUM_MOOR = H.MOOR;
/** Where a starting point puts her (den.html?at=helium: js/den/menus.js): beside their island, their lesson
    about to begin. */
export const HELIUM_ARRIVE: Pose = { c: O[0] - 1, r: O[1] + 1, d: 1 };

/** When their lesson plays: the first time you come up off their island (a cutscene), never while something
    else is playing or you're carried past at speed; after it, Space there takes you to the still. */
export class Visit {
  /** Their lesson's been seen. */
  seen = false;
  /** Each tick: off their island (`off`), free to watch (`free`). True when their lesson should begin now. */
  arrive(off: boolean, free: boolean): boolean {
    if (!off || !free || this.seen) return false;
    this.seen = true;
    return true;
  }
  /** Space off their island, once their lesson's been seen: to the still. */
  again(off: boolean, free: boolean): boolean { return off && free && this.seen; }
}

// ---------- their lesson ----------
/** The lesson's board: a real deal, the same every time (this seed's furnace column all black, as every
    board starts, the one after it mostly junk with a white in it, for the opening's bang, and the three after
    that clear of white in a few drags, for step one: picked from the first 600 seeds, 13 Nov), its furnace's
    clock stopped, so the columns go only when they burn them. */
export const LESSON_SEED = 269;
export const lessonGame = (seed = LESSON_SEED): Distilling => new Distilling(seeded(seed), { timer: false });

/** What a beat of their lesson does on the board: a drag (the piece at x, y swapped each way in turn), the
    furnace's column burned now, the still going bang on its own (a board with no white to burn), or nothing
    (they talk). */
export type LessonAct = { kind: 'drag'; x: number; y: number; ways: number[] } | { kind: 'drags'; drags: { x: number; y: number; ways: number[] }[] } | { kind: 'burn' } | { kind: 'bang' } | { kind: 'none' };
/** A beat of their lesson: their line (`says`, in their bubble; none, a moment with no words), what it shows
    in plain words (`note`, in the bar), and what they do. `mishap`: the column they burn has a white in it (the
    still goes bang as it goes into the furnace), `bang` how big. `marks`: the whites (and burnt whites) in
    the columns from this one rightward are ringed on the board while it's up (`ringed`). `step`: the
    puzzle's step it's teaching (STEPS), shown in the bar. */
export interface Beat { name: string; says: string; note: string; act: LessonAct; mishap?: boolean; bang?: number; marks?: number; who?: 'you'; step?: number }
/** Whether a piece in column `x` is ringed by a beat's `marks`: a white or burnt white from that column on. */
export const ringed = (marks: number | undefined, x: number, p: number): boolean => marks !== undefined && x >= marks && (p === WHITE || p === BURNT);

const copy = (b: Board): Board => b.map((c) => [...c]);
/** A burn on a lesson's board, played out. */
const burnOn = (g: Distilling) => { const ev = g.burnNow(); g.settle(5000); return ev; };

/** Their opening, the first time you come up off their island, before their lesson (the user, 12 Nov), on
    their board (`game`, played on as it goes): the furnace takes its column, all junk; then the next, a white
    in it, ringed, goes down into the furnace, and the still goes bang (the user, 13 Nov: "in the initial
    opening animation, you actually see some white being burnt, and that's what causes the explosion"); no
    words for either, a moment for the bang. They shrug it off (a white let go down: the link to the one thing
    to know), offer to teach you; you ask, warily, if it's safe (`who: 'you'`, over your head); of course it is,
    just don't send whites down; you note their eyebrows are gone; none of us have any, they say. */
export function opening(game: Distilling = lessonGame()): Beat[] {
  const g = game, note = 'Helium\'s island.', none: LessonAct = { kind: 'none' }, beats: Beat[] = [];
  if (g.cols[COLS - 1].every(isJunk)) { beats.push({ name: 'furnace', says: '', note: OPENING_NOTES.furnace, act: { kind: 'burn' } }); burnOn(g); }
  const next = g.cols[COLS - 1];
  if (next.includes(WHITE) && !goesUp(next)) {
    beats.push({ name: 'bang', says: '', note: OPENING_NOTES.bang, act: { kind: 'burn' }, mishap: true, bang: OPENING_BANG, marks: COLS - 1 });
    burnOn(g);
  } else beats.push({ name: 'bang', says: '', note, act: { kind: 'bang' }, bang: OPENING_BANG });
  return [
    ...beats,
    { name: 'mishap', says: OPENING.mishap, note, act: none },
    { name: 'offer', says: OPENING.offer, note, act: none },
    { name: 'safe?', says: AT_HELIUMS.safe, note, act: none, who: 'you' },
    { name: 'safe', says: OPENING.safe, note, act: none },
    { name: 'brows?', says: AT_HELIUMS.brows, note, act: none, who: 'you' },
    { name: 'brows', says: OPENING.brows, note, act: none },
  ];
}

/** The bar under their opening's two burns, in plain words. */
const OPENING_NOTES = {
  furnace: 'Helium\'s island. The furnace takes the right-hand column.',
  bang: 'A white in that one: a white burned, and the still goes bang.',
} as const;

/* The puzzle taught a step at a time (the user, 13 Nov: "we could tab through the steps and say, like, step
   one is getting a few columns on the right-hand side that are about to burn completely free of white pieces
   ... let's just really take it one step at a time"). Only step one is built: the three columns next to the
   fire, the next to burn, cleared of every white (DISTILLING.md, "Stage I, opening: rescue the whites": "The
   rightmost three columns burn first, so save the whites there first"). Later steps go in this list. */
export const STEPS = [
  { n: 1, name: 'Clear the fire\'s side', cols: 3, ...STEP_ONE },
] as const;
/** Step one's columns: the rightmost STEPS[0].cols. */
export const fireSide = (x: number): boolean => x >= COLS - STEPS[0].cols;
/** Whites (and burnt whites) left in step one's columns, on a board as it stands: none, and it's done. */
export const whitesOnFireSide = (cols: Board): number => cols.reduce((n, col, x) => n + (fireSide(x) ? col.filter((p) => p === WHITE || p === BURNT).length : 0), 0);
/** What they say once you've done step one yourself, in turn: that's it done, and the rest is from other
    pirates (the user, 13 Nov: "this is not a replacement for the game ... talk to people"). */
export const stepDoneLines = (): string[] => [STEP_ONE.done, ONWARD, TELL];
/** A drag, as the planner gives them: the piece at (x, y) swapped each way in turn. */
export type Drag = { x: number; y: number; ways: number[] };

/** Whites walked out of the fire's side, left, swap by swap: the drags that do it on board `b` (changed as
    they're made), rightmost first, at most `most`; a white that can't get clear isn't dragged. */
function clearFireSide(b: Board, most = 16): Drag[] {
  // (the bots' own rescue, src/distill-routines.ts: a white dragged out left, up through blacks or down
  // through browns, a helper's drag first when it can't go on its own; each time the move that saves the
  // most whites from the fire's side for the fewest swaps, tried on a real board)
  const ctx = { stage: 'junk' as const, burnFrom: COLS - STEPS[0].cols, fill: 0, reach: 8 }, drags: Drag[] = [];
  const play = (cols: Board, ds: readonly Drag[]): Distilling | null => {
    const t = new Distilling(() => 0.5, { timer: false }).lay(copy(cols));
    for (const d of ds) { if (t.dragWays(d.x, d.y, d.ways).swaps !== d.ways.length) return null; t.settle(1000); }
    return t;
  };
  while (drags.length < most && whitesOnFireSide(b) > 0) {
    let best: { ds: Drag[]; saved: number; swaps: number; cols: Board } | null = null;
    for (const m of ROUTINES.rescue.find(b, ctx)) {
      const t = play(b, m.drags);
      if (!t) continue;
      const saved = whitesOnFireSide(b) - whitesOnFireSide(t.cols), swaps = m.drags.reduce((s, d) => s + d.ways.length, 0);
      if (saved > 0 && (!best || saved > best.saved || (saved === best.saved && swaps < best.swaps))) best = { ds: m.drags, saved, swaps, cols: t.cols };
    }
    if (!best) break;
    drags.push(...best.ds.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })));
    b.splice(0, b.length, ...copy(best.cols));
  }
  return drags;
}

/** The lesson's board as their opening leaves it: its two columns burned. */
export const afterOpening = (): Distilling => { const g = lessonGame(); opening(g); return g; };

/** Their lesson, after their opening, on its board as the opening left it (`game`, played on as it goes),
    worked out by the real rules. Technique, not the basics (the user, 13 Nov: "basic move mechanics ...
    Puzzle Pirates does that. That tutorial exists ... This is more about technique to get to [Crystal Clears]
    and opening up with the right. First things first. See all these whites on the right, you know, highlight
    them all."): no swap rule; straight to step one, every white in the three columns next to the fire ringed,
    walked out swap by swap (the ring staying on each till it's out), and why (silly mishaps, the still goes
    bang, and they've no eyebrows left); then it's yours, step one the goal. */
export function lessonPlan(game: Distilling = afterOpening()): Beat[] {
  const g = game, S = STEPS[0], marks = COLS - S.cols, beats: Beat[] = [];
  const drags = clearFireSide(copy(g.cols));
  beats.push({ name: 'step', says: S.says, note: S.note, act: { kind: 'none' }, step: S.n, marks });
  if (drags.length) {
    for (const d of drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
    beats.push({ name: 'clear', says: S.clear, note: S.note, act: { kind: 'drags', drags }, step: S.n, marks });
  }
  beats.push({ name: 'why', says: S.why, note: S.note, act: { kind: 'none' }, step: S.n });
  beats.push({ name: 'yours', ...LESSON.yours, act: { kind: 'none' }, step: S.n });
  return beats;
}
/** Their opening and lesson together, in order, on one board (`game`, played on as they go). */
export const lessonBeats = (game: Distilling = lessonGame()): Beat[] => [...opening(game), ...lessonPlan(game)];

/* Their lesson's pace (the user, 13 Nov: "the speech and the animation is over so quickly. Like, it's
   supposed to be a little cutscene, and it's like half a second."). A line is up at a reading pace, a few
   seconds at the least; what they do on the board starts once you've had a moment with the line, a swap at
   a time slow enough to follow, and a breath between beats. Space, Enter or a click goes on once the line's
   up a moment; Esc skips the lot. */
export const PACE_LESSON = {
  /** Seconds a line's up: MIN at the least, else LEAD plus PER_WORD a word (about 2.5 words a second). */
  MIN: 3.2, LEAD: 1.4, PER_WORD: 0.4,
  /** The opening's bang, once the white's gone into the furnace, before anyone speaks: its moment. */
  BANG: 3.5,
  /** A beat with no line: a moment before they do it (the white ringed a moment before it goes), and at the
      least this long for a plain one (the furnace taking an all-junk column). */
  QUIET_LEAD: 1, QUIET: 1.2,
  /** A burned column's fall into the furnace (distill-board.js: 0.4 px a ms, about a second at the most). */
  FALL: 1,
  /** After a line's up, before they do anything on the board. */
  ACT_AFTER: 1.6,
  /** A swap of theirs: the piece held, then each swap this long; a breath between drags. */
  HOLD: 0.6, SWAP: 0.55, BETWEEN: 0.8,
  /** A quiet breath between beats. */
  GAP: 0.6,
  /** Going on (Space, Enter, a click) works once a line's been up this long. */
  READ_FIRST: 0.8,
} as const;
/** How long a line of their lesson is up: a reading pace, a few seconds at the least (the bang's moment for no
    line). */
export const lessonSecs = (text: string): number => {
  const P = PACE_LESSON;
  if (!text) return P.BANG;
  return Math.max(P.MIN, P.LEAD + text.trim().split(/\s+/).length * P.PER_WORD);
};
/** When a beat does what it does on the board: once its line's had a moment, or, with no line, a moment in. */
export const actAfter = (b: Beat): number => (b.says ? PACE_LESSON.ACT_AFTER : PACE_LESSON.QUIET_LEAD);
/** How long a beat holds at the least before going on: its line read; with no line, the bang's moment after the
    white's fall into the furnace (or the bang on its own), else a short moment. */
export function holdSecs(b: Beat): number {
  const P = PACE_LESSON;
  if (b.says) return lessonSecs(b.says);
  if (b.mishap) return P.QUIET_LEAD + P.FALL + P.BANG;
  return b.act.kind === 'bang' ? P.BANG : P.QUIET;
}
/** How long a beat of the lesson takes at the least: its line read, and what it does on the board played out
    at the lesson's pace (a drag's swaps each SWAP, a breath between drags; a burn's fall), then the gap. */
export function beatSecs(b: Beat): number {
  const P = PACE_LESSON, drags = b.act.kind === 'drag' ? [b.act] : b.act.kind === 'drags' ? b.act.drags : [];
  const acting = drags.length ? actAfter(b) + drags.reduce((s, d) => s + P.HOLD + d.ways.length * P.SWAP + P.BETWEEN, 0) : b.act.kind === 'burn' ? actAfter(b) + P.FALL : 0;
  return Math.max(holdSecs(b), acting) + P.GAP;
}

// ---------- their mishaps ----------
/** A column's gone: whether the still goes bang (it burned with a white in it, or a burnt white). */
export const bangs = (c: { up: boolean; whites: number; burnt: number }): boolean => !c.up && c.whites + c.burnt > 0;
/** Their line for the `n`th bang at your still (0 the first): the first always their own, "Oops. That happens
    sometimes."; after that, round the rest. */
export const mishapLine = (n: number): string => (n <= 0 ? MISHAP[0] : MISHAP[1 + ((n - 1) % (MISHAP.length - 1))]);

// ---------- their distillery, answering the board ----------
/* The user (13 Nov): "If white goes down, it should cause like that explosion animation as well", and the
   other way, "some meaningful animation that happens if you start sending up the white ... Helium should
   start, you know, distilling out some rum and filling some barrels or something." So each column that
   leaves does something at their distillery (js/den/distillery.js draws it): a white burned, the bang, bigger
   the more whites went; a column up with whites in it, rum run off into the cask under the spout, a measure
   a white and twice that for a Crystal Clear; a cask full, it's rolled onto the pile beside it. */
/** Rum: a cask holds CASK measures; a Crystal Clear pours CLEAR times its whites; the pile beside the
    distillery holds PILE casks (3, 2, 1), and a cask filled past that is rolled off behind (to the smugglers'
    beach, one day); RATE measures a second run from the spout. */
export const RUM = { CASK: 16, CLEAR: 2, PILE: 6, RATE: 6 } as const;
/** Their opening's bang, the first time you come up (the user: "more dramatic"): bigger than one white's. */
export const OPENING_BANG = 1.6;
/** What the distillery does as a column leaves: the bang (`size`: 1 for one white burned, a quarter more a
    white more, 2 at most), rum (`measures` into the cask; `cheer`, a Crystal Clear chain of two or more), or
    nothing (an all-junk column burned, or one up with no whites in it). */
export type Works = { kind: 'bang'; size: number } | { kind: 'rum'; measures: number; cheer: boolean } | { kind: 'none' };
export function worksFor(c: { up: boolean; whites: number; burnt: number; chain: number }): Works {
  if (bangs(c)) return { kind: 'bang', size: Math.min(2, 1 + 0.25 * (c.whites + c.burnt - 1)) };
  if (!c.up || !c.whites) return { kind: 'none' };
  return { kind: 'rum', measures: c.whites * (c.chain >= 1 ? RUM.CLEAR : 1), cheer: c.chain >= 2 };
}
/** Their praise as a Crystal Clear chain grows, now and then (`roll` a random 0 to 1): a line, or none. */
export const praiseFor = (chain: number, roll: number): string | null => (chain >= 2 && roll < 0.35 ? PRAISE.clear[chain % PRAISE.clear.length] : null);

/** One run of rum into the cask under the spout: from and to (measures in it), and whether that fills it
    (it's rolled away and a fresh one put under the spout), and if so whether it goes on the pile. */
export interface Run { from: number; to: number; full: boolean; onPile: boolean }
/** The casks at their distillery: the one under the spout filling, and those filled (the first PILE on the
    pile). */
export class Cellar {
  /** Measures in the cask under the spout. */
  fill = 0;
  /** Casks filled. */
  filled = 0;
  /** Pours `m` measures: the runs, in order, a cask at a time. */
  pour(m: number): Run[] {
    const out: Run[] = [];
    while (m > 0) {
      const take = Math.min(RUM.CASK - this.fill, m), full = this.fill + take >= RUM.CASK;
      out.push({ from: this.fill, to: this.fill + take, full, onPile: full && this.filled < RUM.PILE });
      this.fill += take; m -= take;
      if (full) { this.fill = 0; this.filled++; }
    }
    return out;
  }
  /** Casks on the pile. */
  get piled(): number { return Math.min(this.filled, RUM.PILE); }
}
/** Where the `i`th cask on the pile lies (0 the first): a pyramid, 3 along the bottom, then 2, then 1; [along,
    up] in casks' widths. */
export function pileSpot(i: number): [number, number] {
  const row = i < 3 ? 0 : i < 5 ? 1 : 2, first = [0, 3, 5][row];
  return [row * 0.5 + (i - first), row * 0.86];
}

// ---------- their line, where you can read it ----------
/* The user (13 Nov): "you could do like the help from Helium, but they are too far to the right for the
   help bubble to really appear." At the still the camera's on the board, and their bubble, over their head,
   went off the screen's edge. So while you're at it (and in their lesson) their bubble is kept on the
   screen and off the board: beside it on their side if there's room (a wide screen), else above it or below
   it (a phone), else at least on the screen. */
type Rect = { l: number; t: number; r: number; b: number };
const overlaps = (a: Rect, b: Rect): boolean => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
/** Where their bubble goes: its bottom middle (the bubble's drawn up from there), given where their head is on
    the screen (`head`), the bubble's size, the board's box on the screen and the screen's; `top` and `bottom`
    kept clear (the den's panel, the bar and the help button), `tail` the bubble's pointer below it. */
export function lineSpot(head: { x: number; y: number }, bubble: { w: number; h: number }, board: Rect, screen: { w: number; h: number }, o: { top?: number; bottom?: number; margin?: number; tail?: number } = {}): { x: number; y: number } {
  const { top = 90, bottom = 70, margin = 8, tail = 12 } = o, { w, h } = bubble;
  const clampX = (x: number) => Math.max(w / 2 + margin, Math.min(screen.w - w / 2 - margin, x));
  const clampY = (y: number) => Math.max(top + h, Math.min(screen.h - bottom, y));
  const box = (p: { x: number; y: number }): Rect => ({ l: p.x - w / 2, t: p.y - h - tail, r: p.x + w / 2, b: p.y });
  const at = { x: clampX(head.x), y: clampY(head.y) };
  if (!overlaps(box(at), board)) return at;
  const side = head.x >= (board.l + board.r) / 2 ? 1 : -1, y = clampY(Math.min(head.y, board.b));
  const tries = [
    { x: side > 0 ? board.r + margin + w / 2 : board.l - margin - w / 2, y },   // beside it, their side
    { x: clampX(head.x), y: board.t - margin },                                 // above it
    { x: clampX(head.x), y: board.b + margin + h + tail },                      // below it
    { x: side > 0 ? board.l - margin - w / 2 : board.r + margin + w / 2, y },   // beside it, the other side
  ];
  const fits = (p: { x: number; y: number }) => p.x - w / 2 >= margin && p.x + w / 2 <= screen.w - margin && p.y - h - tail >= top && p.y <= screen.h - bottom && !overlaps(box(p), board);
  return tries.find(fits) ?? at;
}

// ---------- "Help, Helium" ----------
/** What they say to the planner's advice: their line (naming the technique, why, in their voice) and, in the
    bar, the technique's name and the planner's own reason; and whether they play anything (drags, or a burn). */
export function helpFor(a: Advice): { says: string; note: string; plays: 'drags' | 'burn' | null } {
  const note = a.reason ? `${a.label}: ${a.reason}` : a.label;
  if (a.kind === 'move') {
    if (a.routine && a.drags.length) return { says: HELP[a.technique === 'path' ? 'path' : a.routine], note, plays: 'drags' };
    return { says: HELP_ELSE.stuck, note, plays: null };
  }
  if (a.kind === 'burn') return { says: HELP_ELSE.burn, note, plays: 'burn' };
  if (a.kind === 'dismiss') return { says: HELP_ELSE.dismiss, note, plays: null };
  return { says: HELP_ELSE.wait, note, plays: null };
}
/** "Help, Helium" on a board as it stands (a person's, mid-game): the planner reads its stage and picks the
    routine (src/distill-bots.ts, advise), and they say it. Nothing while it's sliding. */
export function askHelium(g: Pick<Distilling, 'cols' | 'chain' | 'timeLeft' | 'movable'>): { advice: Advice | null; says: string; note: string; plays: 'drags' | 'burn' | null } {
  if (!g.movable) return { advice: null, says: HELP_ELSE.busy, note: '', plays: null };
  const advice = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() });
  return { advice, ...helpFor(advice) };
}

/** While you're within earshot of their island, lesson or none: a line now and then, round and round. */
export const HELIUM_SAYS: Script = { loop: AFTER };

/* Who's on their island, placed: a character is only config (RULES.md). js/den/helium-isle.js puts them
   there through the shared pieces: a talking pirate (props-people.js's person()), their distillery
   (distillery.js) and Distilling's board (distill-board.js). Squares on the sloop's sea (`at`: [c, r]); `yaw` the way they
   face (0: out to sea). */
export const HELIUM_CAST = {
  /** Helium: their look (PIRATES's), on the sand at their still, a touch big so they read from the sea, turned
      to you while you're within earshot; their lines. */
  them: { look: 'Helium', at: [HELIUM_STANDS.c, HELIUM_STANDS.r] as [number, number], scale: 1.15, yaw: -1.4, idle: 'stand', earshot: HELIUM.EARSHOT, says: HELIUM_SAYS, gap: PACE.ASIDE },
  /** Their board: Distilling's own panel on a stand beside them, its face to the water off their island's left;
      `size`, its width in metres (taller than they are), `lift` its bottom edge over the sand. */
  board: { at: off(-0.1, 1.15), size: 2.6, lift: 0.5 },
  /** Their distillery (js/den/distillery.js), its front turned to `facing` as their board is: a timber
      distillery, its chimney smoking, the big copper still in its yard, the worm tub, the spout and the cask
      under it nearest you, the pile of casks beside it. The island's eastern square, behind them. (The user,
      13 Nov: "[Helium] needs to have at least a bigger setup. That little object that blows up in the
      background is very tiny.") */
  distillery: { at: off(0.95, 0.3) },
  /** Anything else on the sand (furniture.js's pieces, by kind). */
  props: [] as { kind: string; at: [number, number]; yaw: number }[],
  /** A palm, on the far tip past their board. */
  palm: off(0.2, 1.4),
  /** Where their board and the lesson's camera face: out over the water on their island's left (squares). */
  facing: off(-3.5, 0.8),
} as const;
