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
import { LAY } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { PACE } from './chatter.js';
import { seeded } from './mirror-row.js';
import { BURNT, COLS, Distilling, WHITE, goesUp, neighbourOn } from './distilling.js';
import { HELIUM as HAND, advise } from './distill-bots.js';
import { ROUTINES, isJunk, playDrags } from './distill-routines.js';
import { routesInto } from './distill-path.js';
import { PHASES } from './distill-phase.js';
import { AFTER, BEST, HELP, HELP_ELSE, HINT, LESSON, MISHAP, NERVES, ONWARD, OPENING, PHASE, PRAISE, STEP_ONE, TELL, WATCH } from './lines/helium.js';
import { AT_HELIUMS } from './lines/you.js';
const H = LAY.HELIUM;
export const HELIUM = {
    /** Its name, at the foot of the screen off it. */
    NAME: "Helium's Island",
    /** Within earshot: squares from where they stand. */
    EARSHOT: 4,
};
const key = (c, r) => `${c},${r}`;
const land = new Set(H.LAND.map(([c, r]) => key(c, r)));
/** Their island's first square: they, their still, their board and the lesson's camera are placed from it, so the
    island moves as one. */
const O = H.LAND[0];
const off = (c, r) => [O[0] + c, O[1] + r];
/** Their island's squares. */
export const heliumAt = (c, r) => land.has(key(c, r));
/** The water round their island, every square beside it (diagonally too): where their lesson's seen, and
    Space takes you to the still (as round Tzz's). */
export function onHeliumLanding(c, r) {
    return !heliumAt(c, r) && H.LAND.some(([x, y]) => Math.abs(x - c) <= 1 && Math.abs(y - r) <= 1);
}
/** Their island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const heliumShore = () => shoreOf(H.LAND);
/** Where they stand: just beside their board, on the side toward their distillery, so at the still they're in
    the shot and their line's read beside it (the user, 13 Nov: they were "too far to the right"). */
export const HELIUM_STANDS = { c: O[0] - 0.1, r: O[1] + 0.68 };
export const inHeliumEarshot = (c, r) => Math.hypot(c - HELIUM_STANDS.c, r - HELIUM_STANDS.r) <= HELIUM.EARSHOT;
/** Where the sloop's brought alongside as their lesson begins, out of its shot. */
export const HELIUM_MOOR = H.MOOR;
/** Where a starting point puts her (den.html?at=helium: js/den/menus.js): beside their island, their lesson
    about to begin. */
export const HELIUM_ARRIVE = { c: O[0] - 1, r: O[1] + 1, d: 1 };
/** When their lesson plays: the first time you come up off their island (a cutscene), never while something
    else is playing or you're carried past at speed; after it, Space there takes you to the still. */
/** Their lesson seen, kept in this browser, so it plays the first time only, not every voyage (the user, 13 Nov:
    "I wouldn't want that playing every time"). */
export const SEEN_STORE = 'den-helium-seen';
export class Visit {
    /** Their lesson's been seen (in this browser, when read from SEEN_STORE). */
    seen;
    constructor(seen = false) { this.seen = seen; }
    /** Each tick: off their island (`off`), free to watch (`free`). True when their lesson should begin now. */
    arrive(off, free) {
        if (!off || !free || this.seen)
            return false;
        this.seen = true;
        return true;
    }
    /** Space off their island, once their lesson's been seen: to the still. */
    again(off, free) { return off && free && this.seen; }
}
// ---------- their lesson ----------
/** The lesson's board: a real deal, the same every time (this seed's furnace column all black, as every
    board starts, the one after it mostly junk with a white in it, for the opening's bang, and the three after
    that clear of white in a few drags, for step one: picked from the first 600 seeds, 13 Nov), its furnace's
    clock stopped, so the columns go only when they burn them. */
export const LESSON_SEED = 269;
export const lessonGame = (seed = LESSON_SEED) => new Distilling(seeded(seed), { timer: false });
/** Whether a piece in column `x` is ringed by a beat's `marks`: a white or burnt white from that column on. */
export const ringed = (marks, x, p) => marks !== undefined && x >= marks && (p === WHITE || p === BURNT);
const copy = (b) => b.map((c) => [...c]);
/** A burn on a lesson's board, played out. */
const burnOn = (g) => { const ev = g.burnNow(); g.settle(5000); return ev; };
/** Their opening, the first time you come up off their island, before their lesson (the user, 12 Nov), on
    their board (`game`, played on as it goes): the furnace takes its column, all junk; then the next, a white
    in it, ringed, goes down into the furnace, and the still goes bang (the user, 13 Nov: "in the initial
    opening animation, you actually see some white being burnt, and that's what causes the explosion"); no
    words for either, a moment for the bang. They shrug it off (a white let go down: the link to the one thing
    to know), offer to teach you; you ask, warily, if it's safe (`who: 'you'`, over your head); of course it is,
    just don't send whites down; you note their eyebrows are gone; none of us have any, they say. */
export function opening(game = lessonGame()) {
    const g = game, note = 'Helium\'s island.', none = { kind: 'none' }, beats = [];
    if (g.cols[COLS - 1].every(isJunk)) {
        beats.push({ name: 'furnace', says: '', note: OPENING_NOTES.furnace, act: { kind: 'burn' } });
        burnOn(g);
    }
    const next = g.cols[COLS - 1];
    if (next.includes(WHITE) && !goesUp(next)) {
        beats.push({ name: 'bang', says: '', note: OPENING_NOTES.bang, act: { kind: 'burn' }, mishap: true, bang: OPENING_BANG, marks: COLS - 1 });
        burnOn(g);
    }
    else
        beats.push({ name: 'bang', says: '', note, act: { kind: 'bang' }, bang: OPENING_BANG });
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
};
/* The puzzle taught a step at a time (the user, 13 Nov: "we could tab through the steps and say, like, step
   one is getting a few columns on the right-hand side that are about to burn completely free of white pieces
   ... let's just really take it one step at a time"). Only step one is built: the three columns next to the
   fire, the next to burn, cleared of every white (DISTILLING.md, "Stage I, opening: rescue the whites": "The
   rightmost three columns burn first, so save the whites there first"). Later steps go in this list. */
export const STEPS = [
    { n: 1, name: 'Clear the fire\'s side', cols: 3, ...STEP_ONE },
];
/** Step one's columns: the rightmost STEPS[0].cols. */
export const fireSide = (x) => x >= COLS - STEPS[0].cols;
/** Whites (and burnt whites) left in step one's columns, on a board as it stands: none, and it's done. */
export const whitesOnFireSide = (cols) => cols.reduce((n, col, x) => n + (fireSide(x) ? col.filter((p) => p === WHITE || p === BURNT).length : 0), 0);
/** What they say once you've done step one yourself, in turn: that's it done, and the rest is from other
    pirates (the user, 13 Nov: "this is not a replacement for the game ... talk to people"). */
export const stepDoneLines = () => [STEP_ONE.done, ONWARD, TELL];
/** Whites walked out of the fire's side, left, swap by swap: the drags that do it on board `b` (changed as
    they're made), rightmost first, at most `most`; a white that can't get clear isn't dragged. */
function clearFireSide(b, most = 16) {
    // (the bots' own rescue, src/distill-routines.ts: a white dragged out left, up through blacks or down
    // through browns, a helper's drag first when it can't go on its own; each time the move that saves the
    // most whites from the fire's side for the fewest swaps, tried on a real board)
    const ctx = { stage: 'junk', burnFrom: COLS - STEPS[0].cols, fill: 0, reach: 8 }, drags = [];
    const play = (cols, ds) => {
        const t = new Distilling(() => 0.5, { timer: false }).lay(copy(cols));
        for (const d of ds) {
            if (t.dragWays(d.x, d.y, d.ways).swaps !== d.ways.length)
                return null;
            t.settle(1000);
        }
        return t;
    };
    while (drags.length < most && whitesOnFireSide(b) > 0) {
        let best = null;
        for (const m of ROUTINES.rescue.find(b, ctx)) {
            const t = play(b, m.drags);
            if (!t)
                continue;
            const saved = whitesOnFireSide(b) - whitesOnFireSide(t.cols), swaps = m.drags.reduce((s, d) => s + d.ways.length, 0);
            if (saved > 0 && (!best || saved > best.saved || (saved === best.saved && swaps < best.swaps)))
                best = { ds: m.drags, saved, swaps, cols: t.cols };
        }
        if (!best)
            break;
        drags.push(...best.ds.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })));
        b.splice(0, b.length, ...copy(best.cols));
    }
    return drags;
}
/** The lesson's board as their opening leaves it: its two columns burned. */
export const afterOpening = () => { const g = lessonGame(); opening(g); return g; };
/** Their lesson, after their opening, on its board as the opening left it (`game`, played on as it goes),
    worked out by the real rules. Technique, not the basics (the user, 13 Nov: "basic move mechanics ...
    Puzzle Pirates does that. That tutorial exists ... This is more about technique to get to [Crystal Clears]
    and opening up with the right. First things first. See all these whites on the right, you know, highlight
    them all."): no swap rule; straight to step one, every white in the three columns next to the fire ringed,
    walked out swap by swap (the ring staying on each till it's out), and why (silly mishaps, the still goes
    bang, and they've no eyebrows left); then it's yours, step one the goal. */
export function lessonPlan(game = afterOpening()) {
    const g = game, S = STEPS[0], marks = COLS - S.cols, beats = [];
    const drags = clearFireSide(copy(g.cols));
    beats.push({ name: 'step', says: S.says, note: S.note, act: { kind: 'none' }, step: S.n, marks });
    if (drags.length) {
        for (const d of drags) {
            g.dragWays(d.x, d.y, d.ways);
            g.settle(1000);
        }
        beats.push({ name: 'clear', says: S.clear, note: S.note, act: { kind: 'drags', drags }, step: S.n, marks });
    }
    beats.push({ name: 'why', says: S.why, note: S.note, act: { kind: 'none' }, step: S.n });
    beats.push({ name: 'burner', ...LESSON.burner, act: { kind: 'none' }, step: S.n });
    beats.push({ name: 'yours', ...LESSON.yours, act: { kind: 'none' }, step: S.n });
    return beats;
}
/** Their opening and lesson together, in order, on one board (`game`, played on as they go). */
export const lessonBeats = (game = lessonGame()) => [...opening(game), ...lessonPlan(game)];
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
};
/** How long a line of their lesson is up: a reading pace, a few seconds at the least (the bang's moment for no
    line). */
export const lessonSecs = (text) => {
    const P = PACE_LESSON;
    if (!text)
        return P.BANG;
    return Math.max(P.MIN, P.LEAD + text.trim().split(/\s+/).length * P.PER_WORD);
};
/** When a beat does what it does on the board: once its line's had a moment, or, with no line, a moment in. */
export const actAfter = (b) => (b.says ? PACE_LESSON.ACT_AFTER : PACE_LESSON.QUIET_LEAD);
/** How long a beat holds at the least before going on: its line read; with no line, the bang's moment after the
    white's fall into the furnace (or the bang on its own), else a short moment. */
export function holdSecs(b) {
    const P = PACE_LESSON;
    if (b.says)
        return lessonSecs(b.says);
    if (b.mishap)
        return P.QUIET_LEAD + P.FALL + P.BANG;
    return b.act.kind === 'bang' ? P.BANG : P.QUIET;
}
/** How long a beat of the lesson takes at the least: its line read, and what it does on the board played out
    at the lesson's pace (a drag's swaps each SWAP, a breath between drags; a burn's fall), then the gap. */
export function beatSecs(b) {
    const P = PACE_LESSON, drags = b.act.kind === 'drag' ? [b.act] : b.act.kind === 'drags' ? b.act.drags : [];
    const acting = drags.length ? actAfter(b) + drags.reduce((s, d) => s + P.HOLD + d.ways.length * P.SWAP + P.BETWEEN, 0) : b.act.kind === 'burn' ? actAfter(b) + P.FALL : 0;
    return Math.max(holdSecs(b), acting) + P.GAP;
}
// ---------- their mishaps ----------
/** A column's gone: whether the still goes bang (it burned with a white in it, or a burnt white). */
export const bangs = (c) => !c.up && c.whites + c.burnt > 0;
/** Their line for the `n`th bang at your still (0 the first): the first always their own, "Oops. That happens
    sometimes."; after that, round the rest. */
export const mishapLine = (n) => (n <= 0 ? MISHAP[0] : MISHAP[1 + ((n - 1) % (MISHAP.length - 1))]);
/** When they get nervous at your still (the user, 13 Nov: "imagine Helium getting nervous if you're not really
    clearing out the whites"): ms left before the furnace's column burns with a white still in it, uneasy at
    UNEASY_MS, panicking (and cowering COWER seconds) at PANIC_MS; a burn's 15.3 s round. */
export const NERVE = { UNEASY_MS: 9000, PANIC_MS: 3500, COWER: 2.5 };
/** Their nerves at your still, a furnace column at a time: each tick, how many columns have gone (a new one
    in the furnace resets them), whites in the furnace's column, and ms till it burns; a line when they get
    uneasy, then panic, or say phew once you've got the white out after they'd worried; else null. Once each
    a column, the lines in turn. */
export class Nerves {
    col = -1;
    level = 0;
    n = { uneasy: 0, panic: 0, phew: 0 };
    tick(gone, whites, msLeft) {
        if (gone !== this.col) {
            this.col = gone;
            this.level = 0;
        }
        if (whites <= 0)
            return this.level > 0 && this.level < 3 ? (this.level = 3, this.line('phew')) : null;
        if (this.level < 2 && msLeft <= NERVE.PANIC_MS) {
            this.level = 2;
            return this.line('panic');
        }
        if (this.level < 1 && msLeft <= NERVE.UNEASY_MS) {
            this.level = 1;
            return this.line('uneasy');
        }
        return null;
    }
    line(level) {
        const pool = NERVES[level];
        return { says: pool[this.n[level]++ % pool.length], level };
    }
}
/** Whites in the furnace's column, the right-hand one, the next to burn. */
export const whitesInFurnace = (cols) => cols[COLS - 1].filter((p) => p === WHITE).length;
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
export const RUM = { CASK: 16, CLEAR: 2, PILE: 6, RATE: 6 };
/** Their opening's bang, the first time you come up (the user: "more dramatic"): bigger than one white's. */
export const OPENING_BANG = 1.6;
export function worksFor(c) {
    if (bangs(c))
        return { kind: 'bang', size: Math.min(2, 1 + 0.25 * (c.whites + c.burnt - 1)) };
    if (!c.up || !c.whites)
        return { kind: 'none' };
    return { kind: 'rum', measures: c.whites * (c.chain >= 1 ? RUM.CLEAR : 1), cheer: c.chain >= 2 };
}
/** Their praise as a Crystal Clear chain grows, now and then (`roll` a random 0 to 1): a line, or none. */
export const praiseFor = (chain, roll) => (chain >= 2 && roll < 0.35 ? PRAISE.clear[chain % PRAISE.clear.length] : null);
/** The casks at their distillery: the one under the spout filling, and those filled (the first PILE on the
    pile). */
/** Your best Crystal Clear at their still, kept in this browser under BEST_STORE (the user, 13 Nov: "save it in
    the local memory, so [they remember] what your best crystal clear is. So the idea is each time you come back,
    you'll try to work on that breaking that personal best"). Anything stored that isn't a chain reads as none. */
export const BEST_STORE = 'den-helium-best';
export const cleanBestChain = (raw) => {
    const n = typeof raw === 'string' && raw.trim() ? Number(raw) : typeof raw === 'number' ? raw : NaN;
    return Number.isInteger(n) && n > 0 && n < 100 ? n : 0;
};
/** Their line as you sit down at the still: your best to beat, or the first goal when there's none yet. */
export const bestToBeat = (best) => (best > 0 ? BEST.toBeat.replace('{n}', String(best)) : BEST.none);
/** A column sent up in a chain: the new best (and their line) when it beats yours, or null. */
export function beatBest(chain, best) {
    if (chain <= best || chain < 1)
        return null;
    return { best: chain, says: best > 0 ? BEST.beaten.replace('{n}', String(chain)) : BEST.first };
}
export class Cellar {
    /** Measures in the cask under the spout. */
    fill = 0;
    /** Casks filled. */
    filled = 0;
    /** Pours `m` measures: the runs, in order, a cask at a time. */
    pour(m) {
        const out = [];
        while (m > 0) {
            const take = Math.min(RUM.CASK - this.fill, m), full = this.fill + take >= RUM.CASK;
            out.push({ from: this.fill, to: this.fill + take, full, onPile: full && this.filled < RUM.PILE });
            this.fill += take;
            m -= take;
            if (full) {
                this.fill = 0;
                this.filled++;
            }
        }
        return out;
    }
    /** Casks on the pile. */
    get piled() { return Math.min(this.filled, RUM.PILE); }
}
/** Where the `i`th cask on the pile lies (0 the first): a pyramid, 3 along the bottom, then 2, then 1; [along,
    up] in casks' widths. */
export function pileSpot(i) {
    const row = i < 3 ? 0 : i < 5 ? 1 : 2, first = [0, 3, 5][row];
    return [row * 0.5 + (i - first), row * 0.86];
}
const overlaps = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
/** Where their bubble goes: its bottom middle (the bubble's drawn up from there), given where their head is on
    the screen (`head`), the bubble's size, the board's box on the screen and the screen's; `top` and `bottom`
    kept clear (the den's panel, the bar and the help button), `tail` the bubble's pointer below it. */
/** Their line over their head when it's not by the board (their chatter after the lesson, before or after your
    go at the still), kept whole on the screen (the user, 13 Nov: "at the end again. The speech [bubbles] are
    really off the edge of the screen ... two-thirds of them are on the screen, half"): `head` where its tail
    points, the bubble's size; where it goes (its bottom middle, as the bubble's drawn). */
export function onScreen(head, bubble, screen, o = {}) {
    const { top = 8, bottom = 8, margin = 8 } = o, { w, h } = bubble;
    return {
        x: Math.max(w / 2 + margin, Math.min(screen.w - w / 2 - margin, head.x)),
        y: Math.max(top + h, Math.min(screen.h - bottom, head.y)),
    };
}
export function lineSpot(head, bubble, board, screen, o = {}) {
    const { top = 90, bottom = 70, margin = 8, tail = 12 } = o, { w, h } = bubble;
    const clampX = (x) => Math.max(w / 2 + margin, Math.min(screen.w - w / 2 - margin, x));
    const clampY = (y) => Math.max(top + h, Math.min(screen.h - bottom, y));
    const box = (p) => ({ l: p.x - w / 2, t: p.y - h - tail, r: p.x + w / 2, b: p.y });
    const at = { x: clampX(head.x), y: clampY(head.y) };
    if (!overlaps(box(at), board))
        return at;
    const side = head.x >= (board.l + board.r) / 2 ? 1 : -1, y = clampY(Math.min(head.y, board.b));
    const tries = [
        { x: side > 0 ? board.r + margin + w / 2 : board.l - margin - w / 2, y }, // beside it, their side
        { x: clampX(head.x), y: board.t - margin }, // above it
        { x: clampX(head.x), y: board.b + margin + h + tail }, // below it
        { x: side > 0 ? board.l - margin - w / 2 : board.r + margin + w / 2, y }, // beside it, the other side
    ];
    const fits = (p) => p.x - w / 2 >= margin && p.x + w / 2 <= screen.w - margin && p.y - h - tail >= top && p.y <= screen.h - bottom && !overlaps(box(p), board);
    return tries.find(fits) ?? at;
}
// ---------- "Help, Helium" ----------
/** What they say to the planner's advice: their line (naming the technique, why, in their voice) and, in the
    bar, the technique's name and the planner's own reason; and whether they play anything (drags, or a burn). */
export function helpFor(a) {
    const note = a.reason ? `${a.label}: ${a.reason}` : a.label;
    if (a.kind === 'move') {
        if (a.routine && a.drags.length)
            return { says: HELP[a.technique === 'path' ? 'path' : a.routine], note, plays: 'drags' };
        return { says: HELP_ELSE.stuck, note, plays: null };
    }
    if (a.kind === 'burn')
        return { says: HELP_ELSE.burn, note, plays: 'burn' };
    if (a.kind === 'dismiss')
        return { says: HELP_ELSE.dismiss, note, plays: null };
    return { says: HELP_ELSE.wait, note, plays: null };
}
/** "Help, Helium" on a board as it stands (a person's, mid-game): the planner reads its stage and picks the
    routine (src/distill-bots.ts, advise), and they say it. Nothing while it's sliding. */
export function askHelium(g) {
    if (!g.movable)
        return { advice: null, says: HELP_ELSE.busy, note: '', plays: null };
    const advice = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() });
    return { advice, ...helpFor(advice) };
}
// ---------- hints, and watching them play ----------
/* The user (13 Nov): "as well as helium helping, they can be hinting as well, so it shows you the path. Of what
   the next moves are they would do. And maybe ... plans out a few of like, well, this is the thing I will do at
   this part of the game"; "when he's kind of highlighting the white pieces ... maybe it should show some arrows
   of nearby routes of pieces that can be dragged into the spots"; and "the watch helium play option where he
   explains ... first of all ... I'm going to try and get rid of all the white pieces in all these columns, and
   then just kind of step by step". So three ways at the still: Help (they play the move), a hint (the next drags
   drawn as arrows, not played, their line the phase and what they're after), and watching them play your board,
   saying each phase as it starts and each move's technique before it. All read your board with the planner
   (src/distill-bots.ts, advise) and its phase (src/distill-phase.ts). */
/** A hint's drags at the most: the next one or two the planner would play. */
export const HINT_DRAGS = 2;
const copyDrag = (d) => ({ x: d.x, y: d.y, ways: [...d.ways] });
/** The phase in the bar: its name and plan. */
const phaseNote = (p) => `${PHASES[p].label}: ${PHASES[p].plan}`;
/** A hint on a board as it stands: the planner's next drag or two (its move's, then the move after it, looked
    ahead on the board the first leaves), and their line naming the phase. Nothing while it's sliding. */
export function hintFor(g) {
    if (!g.movable)
        return { advice: null, says: HELP_ELSE.busy, note: '', drags: [], boards: [], routes: [] };
    const chain = g.chain, timeLeft = g.timeLeft(), a = advise({ cols: g.cols, chain, timeLeft });
    if (a.kind !== 'move' || !a.drags.length) {
        return { advice: a, says: a.kind === 'move' ? HINT.none : helpFor(a).says, note: `${phaseNote(a.phase)} · now: ${a.label}`, drags: [], boards: [], routes: [] };
    }
    const drags = a.drags.slice(0, HINT_DRAGS).map(copyDrag), boards = [copy(g.cols)];
    for (const d of drags)
        boards.push(playDrags(boards[boards.length - 1], [d]));
    if (drags.length < HINT_DRAGS) {
        const next = advise({ cols: boards[boards.length - 1], chain, timeLeft });
        if (next.kind === 'move' && next.drags.length) {
            const d = copyDrag(next.drags[0]), after = playDrags(boards[boards.length - 1], [d]);
            if (after) {
                drags.push(d);
                boards.push(after);
            }
        }
    }
    return { advice: a, says: PHASE[a.phase].first, note: `${phaseNote(a.phase)} · next: ${a.label}: ${a.reason}`, drags, boards, routes: otherWhites(g.cols, drags.map((d, i) => dragEnd(boards[i], d))) };
}
/** Where a drag's piece ends up, swap by swap. */
export function dragEnd(cols, d) {
    let x = d.x, y = d.y;
    for (const w of d.ways) {
        const n = neighbourOn(cols, x, y, w);
        if (!n)
            break;
        [x, y] = n;
    }
    return { x, y };
}
/** The hint's other whites: in the columns its drags clear, each white they don't reach gets a route of its own
    (a junk piece's drag into its place, as the path search finds, on the board as it stands), so every white
    there has a way out shown `ends` where the hint's drags end (the user, 13 Nov: "you've got 2 of the 3 in that column, but there's no route shown
    for how that third white can get out. It should show all of them"). */
export function otherWhites(cols, ends) {
    const out = [];
    for (const x of new Set(ends.map((e) => e.x))) {
        cols[x].forEach((p, y) => {
            if (p !== WHITE || ends.some((e) => e.x === x && e.y === y))
                return;
            out.push(...routesInto(cols, { x, y, side: -1 }, HAND, 1));
        });
    }
    return out;
}
const same = (a, b) => a.length === b.length && a.every((c, x) => c.length === b[x].length && c.every((p, y) => p === b[x][y]));
/** The hint's drags still to show on the board now: from the one you're up to, as you follow them; none once
    you've played them all, or done something else. */
export function hintLeft(h, cols) {
    for (let k = h.boards.length - 1; k >= 0; k--)
        if (same(h.boards[k], cols))
            return h.drags.slice(k);
    return [];
}
/** Routes into the places of the whites in the furnace's column, the ones their nerves ring: for each, a few
    junk pieces' drags that would take its place (it then drops out left), the path search's (src/distill-path.ts,
    routesInto), cheapest first; at most `most` in all. */
export function routesToFire(cols, most = 6) {
    const x = COLS - 1, whites = cols[x].flatMap((p, y) => (p === WHITE ? [y] : []));
    // (one for every white first, so none is left without a way out; then a second each while there's room)
    const out = whites.flatMap((y) => routesInto(cols, { x, y, side: -1 }, HAND, 1));
    for (const y of whites) {
        if (out.length >= most)
            break;
        for (const d of routesInto(cols, { x, y, side: -1 }, HAND, 2).slice(1))
            if (out.length < most)
                out.push(d);
    }
    return out;
}
/** Watching them play your board: how long a move's arrow is up before they drag it, their hand's pace (slower
    than their help's quick one, to follow), a breath between beats, and how long they let the furnace run when
    there's nothing worth doing before they look again. Each line's up at the lesson's reading pace (lessonSecs). */
export const PACE_WATCH = { ARROW: 1.4, HOLD: 0.45, SWAP: 0.3, BETWEEN: 0.5, GAP: 0.5, WAIT: 2.5 };
/** Them playing your board for you to watch, a beat at a time (`next` on the board as it stands): before each
    phase, the phase and its plan ("first of all ... get rid of all the white pieces in all these columns"); before
    each move, the technique and why, a short line ("again" when it's the same as before); a wait said once. */
export class Watch {
    phase = null;
    said = new Set();
    last = null;
    agains = 0;
    waited = false;
    next(g) {
        if (!g.movable)
            return { kind: 'busy', says: '', note: '', phase: this.phase, drags: [] };
        const a = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() }), phase = a.phase;
        if (phase !== this.phase) {
            const says = this.said.has(phase) ? PHASE[phase].again : PHASE[phase].first;
            this.said.add(phase);
            this.phase = phase;
            this.last = null;
            this.waited = false;
            return { kind: 'phase', says, note: phaseNote(phase), phase, drags: [] };
        }
        const note = a.reason ? `${a.label}: ${a.reason}` : a.label;
        if (a.kind === 'move' && a.drags.length) {
            const t = a.sweep ? 'diamond' : a.technique === 'path' ? 'path' : a.routine ?? 'diamond';
            const says = t === this.last ? WATCH.again[this.agains++ % WATCH.again.length] : WATCH[t];
            this.last = t;
            this.waited = false;
            return { kind: 'move', says, note, phase, drags: a.drags.map(copyDrag) };
        }
        this.last = null;
        if (a.kind === 'burn') {
            this.waited = false;
            return { kind: 'burn', says: WATCH.burn, note, phase, drags: [] };
        }
        if (a.kind === 'dismiss')
            return { kind: 'dismiss', says: WATCH.dismiss, note, phase, drags: [] };
        const says = this.waited ? '' : a.kind === 'move' ? WATCH.stuck : WATCH.wait;
        this.waited = true;
        return { kind: 'wait', says, note, phase, drags: [] };
    }
}
/** While you're within earshot of their island, lesson or none: a line now and then, round and round. */
export const HELIUM_SAYS = { loop: AFTER };
/* Who's on their island, placed: a character is only config (RULES.md). js/den/helium-isle.js puts them
   there through the shared pieces: a talking pirate (props-people.js's person()), their distillery
   (distillery.js) and Distilling's board (distill-board.js). Squares on the sloop's sea (`at`: [c, r]); `yaw` the way they
   face (0: out to sea). */
export const HELIUM_CAST = {
    /** Helium: their look (PIRATES's), on the sand at their still, a touch big so they read from the sea, turned
        to you while you're within earshot; their lines. */
    them: { look: 'Helium', at: [HELIUM_STANDS.c, HELIUM_STANDS.r], scale: 1.15, yaw: -1.4, idle: 'stand', earshot: HELIUM.EARSHOT, says: HELIUM_SAYS, gap: PACE.ASIDE },
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
    props: [],
    /** A palm, on the far tip past their board. */
    palm: off(0.2, 1.4),
    /** Where their board and the lesson's camera face: out over the water on their island's left (squares). */
    facing: off(-3.5, 0.8),
};
