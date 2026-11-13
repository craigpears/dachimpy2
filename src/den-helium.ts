/* Pirate Den: Helium's island, their still, and Distilling taught at it. TypeScript, compiled to
   js/den-helium.js; tested in tests/den-helium.test.ts. js/den/helium-isle.js draws the island and places
   them from HELIUM_CAST (below), plain data; the squares are LAY.HELIUM in src/den-sail.ts; the puzzle is
   src/distilling.ts (its look js/den/distill-board.js), the planner their help reads your board with
   src/distill-bots.ts's `advise`; their lines src/lines/helium.ts.

   The user (11 and 12 Nov, IDEAS.md "Helium, and Distilling"; DISTILLING.md §7, items 3 and 4): Helium, a
   real pirate who "really loves distilling", teaches it "very kind of by the by", on "his own little
   island ... I bet he just wants an island for him somewhere", near the smugglers' beach where their rum
   would one day go out. The first time you come up off it they give a short lesson on a real board, a
   little cutscene: the swap rule, whites left and junk right, the furnace's column burned, and a white
   burned with the next, their mishap ("Oops. That happens sometimes. Don't worry about it."). Then "now
   you try": the still's yours, a real session, and "Help, Helium" while you play: "helium should kind of
   detect what stage you're at and show you what technique ... It's context aware". They read your board
   (`advise`), say in a line what they'd do and why, naming the technique, and play it on your board.
   Space off their island again and you're back at the still. Not yet: the smuggling ring, the penguin's
   link to them, the coached replay (IDEAS.md). */

import { LAY, type Pose } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { PACE, type Script } from './chatter.js';
import { seeded } from './mirror-row.js';
import { BLACK, COLS, Distilling, UP_LEFT, DOWN_LEFT, WHITE, canSwapOn, goesUp, neighbourOn, type Board } from './distilling.js';
import { advise, type Advice } from './distill-bots.js';
import { isJunk } from './distill-routines.js';
import { AFTER, GREET, HELP, HELP_ELSE, LESSON, MISHAP, OPENING } from './lines/helium.js';
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
/** Where they stand, at their still, on the sand toward the sloop's side. */
export const HELIUM_STANDS = { c: O[0] - 0.05, r: O[1] + 0.3 } as const;
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
    board starts, and the one after it mostly junk with a white in it, for their mishap), its furnace's clock
    stopped, so the columns go only when they burn them. */
export const LESSON_SEED = 21;
export const lessonGame = (): Distilling => new Distilling(seeded(LESSON_SEED), { timer: false });

/** What a beat of their lesson does on the board: a drag (the piece at x, y swapped each way in turn), the
    furnace's column burned now, or nothing (they talk). */
export type LessonAct = { kind: 'drag'; x: number; y: number; ways: number[] } | { kind: 'burn' } | { kind: 'bang' } | { kind: 'none' };
/** A beat of their lesson: their line (`says`, in their bubble), what it shows in plain words (`note`, in the
    bar), and what they do. `mishap`: the column they burn has a white in it (the still goes bang). */
export interface Beat { name: string; says: string; note: string; act: LessonAct; mishap?: boolean; who?: 'you' }

/** Their opening, the first time you come up off their island, before their lesson (the user, 12 Nov): the still
    goes bang (no line, a moment for it); they shrug it off and offer to teach you; you ask, warily, if it's
    safe (`who: 'you'`, over your head); of course it is; you note their eyebrows are gone; none of us have
    any, they say. */
export function opening(): Beat[] {
  const note = 'Helium\'s island.', none: LessonAct = { kind: 'none' };
  return [
    { name: 'bang', says: '', note, act: { kind: 'bang' } },
    { name: 'mishap', says: OPENING.mishap, note, act: none },
    { name: 'offer', says: OPENING.offer, note, act: none },
    { name: 'safe?', says: AT_HELIUMS.safe, note, act: none, who: 'you' },
    { name: 'safe', says: OPENING.safe, note, act: none },
    { name: 'brows?', says: AT_HELIUMS.brows, note, act: none, who: 'you' },
    { name: 'brows', says: OPENING.brows, note, act: none },
  ];
}

const swapOn = (b: Board, x: number, y: number, way: number): [number, number] | null => {
  const n = neighbourOn(b, x, y, way);
  if (!n || !canSwapOn(b, x, y, n[0], n[1])) return null;
  [b[x][y], b[n[0]][n[1]]] = [b[n[0]][n[1]], b[x][y]];
  return n;
};
/** A white walked left as far as it goes, swap by swap (up-left or down-left, whichever it can): its ways. */
function walkLeft(b: Board, x: number, y: number, most = 6): number[] {
  const ways: number[] = [];
  let at: [number, number] | null = [x, y];
  while (at && ways.length < most) {
    let next: [number, number] | null = null;
    for (const w of [UP_LEFT, DOWN_LEFT]) { next = swapOn(b, at[0], at[1], w); if (next) { ways.push(w); break; } }
    at = next;
  }
  return ways;
}
const copy = (b: Board): Board => b.map((c) => [...c]);

/** Their lesson on a board (the lesson's deal, `lessonGame().cols`), worked out by the real rules: the greeting; the
    swap rule shown by one swap, a white rising past a black and a step to the left; the rest of the rule;
    whites left, a white dragged as far left as it goes (all in the columns clear of the furnace's next
    two, so they stay as dealt); the furnace's column, all black, burned; the next, mostly junk with a
    white in it, burned too: their mishap, and their line for it; then it's yours. */
export function lessonPlan(start: Board): Beat[] {
  const b = copy(start), beats: Beat[] = [{ name: 'greet', says: GREET, note: 'Helium\'s still: Distilling.', act: { kind: 'none' } }];
  const say = (name: keyof typeof LESSON, act: LessonAct = { kind: 'none' }, mishap = false): Beat => ({ name, ...LESSON[name], act, ...(mishap ? { mishap } : {}) });
  // The swap rule: a white under a black, up-left past it.
  let rule: [number, number] | null = null;
  for (let x = 1; x <= COLS - 3 && !rule; x++) for (let y = 0; y < b[x].length && !rule; y++) {
    const n = neighbourOn(b, x, y, UP_LEFT);
    if (b[x][y] === WHITE && n && b[n[0]][n[1]] === BLACK && canSwapOn(b, x, y, n[0], n[1])) rule = [x, y];
  }
  if (rule) {
    swapOn(b, rule[0], rule[1], UP_LEFT);
    beats.push(say('rule', { kind: 'drag', x: rule[0], y: rule[1], ways: [UP_LEFT] }), say('ruleAfter'));
  }
  // Whites left: the white that walks furthest left (from the middle of the board, clear of the furnace's
  // next two columns), at least two steps.
  let best: { x: number; y: number; ways: number[] } | null = null;
  for (let x = 2; x <= COLS - 3; x++) for (let y = 0; y < b[x].length; y++) {
    if (b[x][y] !== WHITE) continue;
    const ways = walkLeft(copy(b), x, y);
    if (ways.length >= 2 && (!best || ways.length > best.ways.length)) best = { x, y, ways };
  }
  if (best) { walkLeft(b, best.x, best.y); beats.push(say('left', { kind: 'drag', ...best })); }
  // The furnace's column, all junk: burned.
  if (b[COLS - 1].every(isJunk)) beats.push(say('furnace', { kind: 'burn' }));
  // The next one in: mostly junk, a white in it. Burned all the same: bang.
  const next = b[COLS - 2];
  if (next.includes(WHITE) && !goesUp(next)) beats.push(say('mishapSetup', { kind: 'burn' }, true), { name: 'mishap', says: MISHAP[0], note: LESSON.mishapSetup.note, act: { kind: 'none' } });
  beats.push(say('yours'));
  return beats;
}
/** How long each line of their is up, a beat at the least: offhand, unhurried, long enough to read. */
export const lessonSecs = (text: string): number => (text ? 1.4 + text.length * 0.05 : 1.6);

// ---------- their mishaps ----------
/** A column's gone: whether the still goes bang (it burned with a white in it, or a burnt white). */
export const bangs = (c: { up: boolean; whites: number; burnt: number }): boolean => !c.up && c.whites + c.burnt > 0;
/** Their line for the `n`th bang (0 the first): the first always their own, "Oops. That happens sometimes.";
    after that, round the rest. */
export const mishapLine = (n: number): string => (n <= 0 ? MISHAP[0] : MISHAP[1 + ((n - 1) % (MISHAP.length - 1))]);

// ---------- "Help, Helium" ----------
/** What they say to the planner's advice: their line (naming the technique, why, in their voice) and, in the
    bar, the technique's name and the planner's own reason; and whether they play anything (drags, or a burn). */
export function helpFor(a: Advice): { says: string; note: string; plays: 'drags' | 'burn' | null } {
  const note = a.reason ? `${a.label}: ${a.reason}` : a.label;
  if (a.kind === 'move') {
    if (a.routine && a.drags.length) return { says: HELP[a.routine], note, plays: 'drags' };
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
   there through the shared pieces: a talking pirate (props-people.js's person()), their still (furniture.js)
   and Distilling's board (distill-board.js). Squares on the sloop's sea (`at`: [c, r]); `yaw` the way they
   face (0: out to sea). */
export const HELIUM_CAST = {
  /** Helium: their look (PIRATES's), on the sand at their still, a touch big so they read from the sea, turned
      to you while you're within earshot; their lines. */
  them: { look: 'Helium', at: [HELIUM_STANDS.c, HELIUM_STANDS.r] as [number, number], scale: 1.15, yaw: -1.4, idle: 'stand', earshot: HELIUM.EARSHOT, says: HELIUM_SAYS, gap: PACE.ASIDE },
  /** Their board: Distilling's own panel on a stand beside them, its face to the water off their island's left;
      `size`, its width in metres (taller than they are), `lift` its bottom edge over the sand. */
  board: { at: off(-0.1, 1.15), size: 2.6, lift: 0.5 },
  /** Behind them, their copper still; and a palm. */
  props: [{ kind: 'still', at: off(0.7, 0.4) as [number, number], yaw: -1.9 }],
  palm: off(1.15, -0.2),
  /** Where their board and the lesson's camera face: out over the water on their island's left (squares). */
  facing: off(-3.5, 0.8),
} as const;
