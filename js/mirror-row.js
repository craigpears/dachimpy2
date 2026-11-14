/* Mirror strokes: the den's rowing board (RULES.md, "Rowing by mirror strokes", 10 Nov). TypeScript,
   compiled to js/mirror-row.js by `npm run build`; tested in tests/mirror-row.test.ts, played on the
   sloop (src/den-row.ts, js/den/rowing.js) and by the bots in tools/row-bots.mjs. It knows nothing
   of the den.

   IDEAS.md's "Mirror strokes, thought through for skill": two full Bilge boards side by side, port
   on the left and starboard on the right, with pieces of their own; every swap made on one is made
   in mirror on the other. Looking over her bows the port board's left edge is her outboard side and
   the starboard board's right edge is his, so the mirror of columns c, c + 1 on port is columns
   W - 2 - c, W - 1 - c on starboard. Each board's cascade runs on its own.

   What each board clears is pull for its side, reckoned as rowing.ts reckons a move (ROW: a big
   combo is a big pull). Matched pull drives her ahead, a clear lead on one side turns her toward
   that side (BALANCE, below). Two ways to pair them:
   - Stroke: move by move, the den's way: one side's lead waits for the other side's next pull.
   - ClockedOars: rowing.ts's own Oars, with a move every WINDOW seconds, for the bots to compare.
   The plain split board (SplitRow) is here too, paired either way, so the bots can measure the two
   side by side.

   Fewer kinds of piece (the user, after playing it, 10 Nov: "because that makes more of a risk for
   cascades and unintended effects"): Bilge's own rules, but each board can be dealt from fewer than
   its seven kinds (KINDS_LEAST to KINDS), so lines come together by themselves more often and a
   move sets off more you didn't plan. The default (KINDS_DEFAULT) is from the bots in
   tools/row-bots.mjs. Bilge itself knows only seven, so a board of fewer is dealt from a source of
   numbers squeezed into the first `kinds` sevenths (see fewer()). */
import { Bilge, KINDS, NO_SPECIALS, W } from './bilge.js';
import { Oars, ROW, pull } from './rowing.js';
/** The fewest kinds of piece a board can have: with two, a square could be barred both kinds when
    it's dealt (two alike beside it and two of the other above), and the deal would never end. */
export const KINDS_LEAST = 3;
/** How many kinds a board has unless it's asked for more or fewer: picked from the bots' runs (10
    Nov, 30 games of 80 moves, mirror strokes move by move). Squares up the course for random /
    greedy / two-ply: 7 kinds 0.9 / 2.8 / 10.4; 6: 1.2 / 5.7 / 21.2; 5: 0.6 / 15.2 / 40.6, random
    play rowing a circle in 27% of games; 4: 0.7 / 63.5 / 60.5, random circling in 63%, and looking
    ahead no better than greedy, the cascades doing the playing. Five keeps the chaos and the skill. */
export const KINDS_DEFAULT = 5;
/** A source of numbers for a Bilge board of `kinds` kinds: Bilge reckons a new piece's kind as
    floor(x * 7), so squeezing every x into [0, kinds / 7) deals kinds 0 to kinds - 1, evenly. */
export function fewer(random, kinds) {
    const k = Math.max(KINDS_LEAST, Math.min(KINDS, Math.round(kinds))) / KINDS;
    return k === 1 ? random : () => random() * k;
}
/** The odds of a special piece for a board dealt by fewer(): the same squeeze applies to Bilge's
    draw for a special, so the odds are squeezed too, to come out as asked. */
export function fewerOdds(odds, kinds) {
    const k = Math.max(KINDS_LEAST, Math.min(KINDS, Math.round(kinds))) / KINDS;
    return { puffer: odds.puffer * k, crab: odds.crab * k, jelly: odds.jelly * k };
}
/** A Bilge board for rowing: `kinds` kinds of piece, the water at ROW.WATER. */
export function rowBilge(random, odds = NO_SPECIALS, kinds = KINDS_DEFAULT) {
    const b = new Bilge(fewer(random, kinds), fewerOdds(odds, kinds));
    b.water = ROW.WATER;
    return b;
}
/** The column on starboard where a swap at column c on port is mirrored (its left piece). */
export const mirrorCol = (c) => W - 2 - c;
/** All of a move's pull on a board of one side's own. */
export function sidePull(before, m) {
    const p = pull(before, m);
    return p.port + p.starboard;
}
/** A copy of a Bilge board, with its own source of new pieces: what a bot imagines a move would do
    (it can see the board, not what's coming in at the bottom). */
export function copyBilge(b, random) {
    return Object.assign(Object.create(Bilge.prototype), b, { grid: b.snap(), random });
}
/* Balance, so she can row straight (the user, 10 Nov, on the den's first rowing board: "it only took
   three moves to generate three clears to generate a turn ... one on one side and two on the other.
   So that's basically impossible to go straight"). Going straight is something to aim for: a small
   lopsidedness still rows her straight, and only a clear imbalance turns her.
   - Pull one side has made that the other hasn't yet is that side's lead (Stroke.swing). The other
     side's next pull catches it up first, and what's caught up drives her ahead: both sides pulled,
     if not on the same move.
   - Every bit of pull matched like that also straightens up some of what's left of the lead (KEEL
     of it, into forward pull too), as her keel holds her straight. So rowed steadily, one side
     pulling up to 1 + 2 * KEEL times the other never turns her.
   - Only a lead of TURN turns her: a quarter turn, and it uses the lead up. */
export const BALANCE = {
    /** Lead it takes to turn her a quarter: two squares' pull, so a Bingo on one side (8) turns her
        plainly, even when the mirrored board clears a three on the same move or the other side was a
        three ahead, and the same pull built up from smaller clears on one side, left unbalanced, does
        too; three threes on one side don't. It was 7.5 (10 Nov) till the user, 14 Nov: a Bingo on one
        side "doesn't seem to obviously happen", "possible to almost do accidentally if you leave it":
        at 7.5 any pull at all on the other side first (a three's worth and the keel's share of it)
        left a Bingo short, a one-sided Bingo turning her 19 times in 24 in the side-blind bot's play,
        22 in 24 at 6. From the bots (tools/row-bots.mjs, 30 games of 60 moves, five kinds), 7.5 then
        6: a player out to row straight never turns (0.1 turns a game, then none); one who just clears
        whatever's biggest, never minding the side, turns every 8 moves, then every 6, and rows a
        circle in 53% of games, then 67%; one out to turn her does it in 3.6 moves, then 2.9. (At 9 a
        Bingo on one side didn't turn her at all.) */
    TURN: 6,
    /** Of each bit of pull matched, how much of the lead it straightens up. */
    KEEL: 0.25,
};
/** One stroke's pull turned into squares, move by move. Starboard pulling harder turns her to
    starboard, port to port (the user, 10 Nov: "if you pull on the right-hand side, it should
    definitely go right"; real oars do the opposite). */
export class Stroke {
    /** Pull built up toward a square forward. */
    ahead = 0;
    /** One side's lead: pull it's made that the other side hasn't matched yet, more than nothing for
        starboard (turning her to starboard). */
    swing = 0;
    row(p) {
        let port = p.port, stbd = p.starboard;
        // Matched on the move itself, then the side behind catching up the other's lead.
        const both = Math.min(port, stbd);
        let fwd = 2 * both;
        port -= both;
        stbd -= both;
        if (this.swing > 0 && port > 0) {
            const t = Math.min(port, this.swing);
            fwd += 2 * t;
            this.swing -= t;
            port -= t;
        }
        if (this.swing < 0 && stbd > 0) {
            const t = Math.min(stbd, -this.swing);
            fwd += 2 * t;
            this.swing += t;
            stbd -= t;
        }
        this.swing += stbd - port;
        // Her keel: what's matched straightens up some of the lead that's left.
        const k = Math.min(Math.abs(this.swing), BALANCE.KEEL * fwd);
        this.swing -= Math.sign(this.swing) * k;
        this.ahead += fwd + k;
        const out = [];
        while (this.swing >= BALANCE.TURN) {
            out.push('R');
            this.swing -= BALANCE.TURN;
        }
        while (this.swing <= -BALANCE.TURN) {
            out.push('L');
            this.swing += BALANCE.TURN;
        }
        while (this.ahead >= ROW.STEP) {
            out.push('F');
            this.ahead -= ROW.STEP;
        }
        return out;
    }
    pending() { return 0; }
    building() { return { ahead: this.ahead / ROW.STEP, turn: this.swing / BALANCE.TURN }; }
    copy() { return Object.assign(new Stroke(), { ahead: this.ahead, swing: this.swing }); }
}
/** rowing.ts's Oars, as the den rows, with a move every WINDOW seconds: pull on one side waits for
    the next move to match it. */
export class ClockedOars {
    oars = new Oars();
    t = 0;
    get ahead() { return this.oars.ahead; }
    get swing() { return this.oars.swing; }
    pending() {
        const sum = (ls) => ls.reduce((t, l) => t + l.n, 0);
        return sum(this.oars.waiting.starboard) - sum(this.oars.waiting.port);
    }
    building() { return { ahead: this.ahead / ROW.STEP, turn: (this.swing + this.pending()) / ROW.STEP }; }
    row(p) { this.t += ROW.WINDOW; return this.oars.feed(p, this.t); }
    copy() {
        const o = this.oars;
        const oars = Object.assign(Object.create(Oars.prototype), this.oars, {
            waiting: { port: this.oars.waiting.port.map((l) => ({ ...l })), starboard: this.oars.waiting.starboard.map((l) => ({ ...l })) },
            matched: o.matched.slice(),
        });
        return Object.assign(new ClockedOars(), { oars, t: this.t });
    }
}
/** Headings, a quarter turn at a time: 0 up the course, 1 to starboard, 2 back, 3 to port. */
const DX = [0, 1, 0, -1], DY = [1, 0, -1, 0];
/** Where she's been on the sea, in squares, as Battle Navigation moves her: forward a square, or
    forward a square and round a quarter turn into the next. She starts at (0, 0) heading up the
    course (y). */
export class Course {
    x = 0;
    y = 0;
    heading = 0;
    /** Quarter turns made in all, to starboard more than nothing (four is a whole circle). */
    turned = 0;
    /** The most she's been round, either way, in quarter turns. */
    mostTurned = 0;
    /** Every square she's moved through: [x, y, heading]. */
    trail = [[0, 0, 0]];
    go(step) {
        this.x += DX[this.heading];
        this.y += DY[this.heading];
        if (step !== 'F') {
            const t = step === 'R' ? 1 : -1;
            this.heading = (this.heading + t + 4) % 4;
            this.turned += t;
            this.mostTurned = Math.max(this.mostTurned, Math.abs(this.turned));
            this.x += DX[this.heading];
            this.y += DY[this.heading];
        }
        this.trail.push([this.x, this.y, this.heading]);
    }
    /** Has she been right round, a whole circle? */
    get circled() { return this.mostTurned >= 4; }
}
function sail(stroke, course, p) {
    const steps = stroke.row(p);
    for (const s of steps)
        course.go(s);
    return steps;
}
/** Mirror strokes: two boards, one cursor, every swap made on both. */
export class MirrorRow {
    kind = 'mirror';
    boards;
    stroke;
    course = new Course();
    kinds;
    constructor(o = {}, boards) {
        this.stroke = o.clocked ? new ClockedOars() : new Stroke();
        this.kinds = o.kinds ?? KINDS_DEFAULT;
        const rs = o.randoms ?? [Math.random, Math.random];
        this.boards = boards ?? [0, 1].map((i) => rowBilge(rs[i] ?? Math.random, o.odds, this.kinds));
    }
    get port() { return this.boards[0]; }
    get starboard() { return this.boards[1]; }
    play(r, c) {
        const [pb, sb] = [this.port.snap(), this.starboard.snap()];
        const pm = this.port.swap(r, c), sm = this.starboard.swap(r, mirrorCol(c));
        return { moves: [pm, sm], pull: { port: sidePull(pb, pm), starboard: sidePull(sb, sm) }, combos: [pm.combo, sm.combo] };
    }
    swap(r, c) {
        const res = this.play(r, c);
        return { ...res, steps: sail(this.stroke, this.course, res.pull) };
    }
    tryMove(r, c, random) {
        const copy = new MirrorRow({ kinds: this.kinds }, this.boards.map((b) => copyBilge(b, fewer(random, this.kinds))));
        const { pull: p, combos } = copy.play(r, c);
        return { pull: p, combos, copy };
    }
}
/** The plain split board (rowing.ts): one board, the left three columns port, the right three
    starboard, reckoned move by move as mirror strokes are. */
export class SplitRow {
    kind = 'split';
    boards;
    stroke;
    course = new Course();
    kinds;
    constructor(o = {}, board) {
        this.stroke = o.clocked ? new ClockedOars() : new Stroke();
        this.kinds = o.kinds ?? KINDS_DEFAULT;
        this.boards = [board ?? rowBilge(o.randoms?.[0] ?? Math.random, o.odds, this.kinds)];
    }
    play(r, c) {
        const before = this.boards[0].snap(), m = this.boards[0].swap(r, c);
        return { moves: [m], pull: pull(before, m), combos: [m.combo] };
    }
    swap(r, c) {
        const res = this.play(r, c);
        return { ...res, steps: sail(this.stroke, this.course, res.pull) };
    }
    tryMove(r, c, random) {
        const copy = new SplitRow({ kinds: this.kinds }, copyBilge(this.boards[0], fewer(random, this.kinds)));
        const { pull: p, combos } = copy.play(r, c);
        return { pull: p, combos, copy };
    }
}
/** A seeded source of numbers in [0, 1) (mulberry32), so a game can be played again. */
export function seeded(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
