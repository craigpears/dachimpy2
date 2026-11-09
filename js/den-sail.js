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
export const SAIL = {
    /** The board: squares across and out to sea. */
    COLS: 16,
    ROWS: 14,
    /** A square, in metres (the sloop's about one long). */
    CELL: 4,
    /** Where the board starts, out from the wall (metres; the wall's at 0, out is -): at the lowest
        tide's edge, so the sloop's moored close in, where you see her from the beach (the user, 9
        Nov: she should be "in a more natural place"), and still always afloat. */
    Z0: -17,
    /** Her mooring: just off the left of the beach, broadside on, bows along the shore toward the
        middle of the cove. */
    HOME: { c: 6, r: 0, d: 1 },
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
};
/** Across and out for each way she can face. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const key = (c, r) => `${c},${r}`;
/** The squares a move passes through (one for forward, two for a turn), and how she ends up. */
export function path(p, m) {
    const a = [p.c + DC[p.d], p.r + DR[p.d]];
    if (m === 'F')
        return { cells: [a], to: { c: a[0], r: a[1], d: p.d } };
    const d = (p.d + (m === 'L' ? 3 : 1)) % 4, b = [a[0] + DC[d], a[1] + DR[d]];
    return { cells: [a, b], to: { c: b[0], r: b[1], d } };
}
/** A little seeded dice, so the same sea comes up for the same seed. */
function dice(seed) {
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
    cols = SAIL.COLS;
    rows = SAIL.ROWS;
    rocks = new Set();
    constructor(seed = 1) {
        for (let tries = 0; tries < 50; tries++) {
            this.scatter(dice(seed + tries * 7919));
            if (this.allReachable())
                return;
        }
        this.rocks.clear(); // (never seen: a clear sea, rather than a stuck one)
    }
    scatter(roll) {
        this.rocks.clear();
        const H = SAIL.HOME;
        for (let n = 0; n < SAIL.CLUMPS; n++) {
            let c = Math.floor(roll() * this.cols), r = 2 + Math.floor(roll() * (this.rows - 2));
            const size = 1 + Math.floor(roll() * 3);
            for (let i = 0; i < size; i++) {
                if (Math.abs(c - H.c) > 2 || r > 3)
                    this.rocks.add(key(c, r));
                if (roll() < 0.5)
                    c += roll() < 0.5 ? -1 : 1;
                else
                    r += roll() < 0.5 ? -1 : 1;
                if (c < 0 || c >= this.cols || r < 1 || r >= this.rows)
                    break;
            }
        }
    }
    /** On the board and not a rock. */
    open(c, r) {
        return c >= 0 && c < this.cols && r >= 0 && r < this.rows && !this.rocks.has(key(c, r));
    }
    isRock(c, r) { return this.rocks.has(key(c, r)); }
    /** Sailing a move from here: where she ends up, and whether she hit something. Forward into a
        rock (or off the edge of the board) and she stays put; a turn that's blocked turns her where
        she is. */
    sail(p, m) {
        const { cells, to } = path(p, m);
        if (cells.every(([c, r]) => this.open(c, r)))
            return { to, bump: false };
        return { to: { c: p.c, r: p.r, d: to.d }, bump: true };
    }
    /** The pilot: the fewest moves from here to that square (facing any way), never sailing into a
        rock, though a turn that's blocked can turn her where she is (facing the shore at the board's
        edge, that's the only way round). Null if there's no way there. */
    plot(from, c, r) {
        if (!this.open(c, r))
            return null;
        if (from.c === c && from.r === r)
            return [];
        const seen = new Map();
        const id = (p) => `${p.c},${p.r},${p.d}`;
        let edge = [from];
        seen.set(id(from), { prev: null, m: null });
        while (edge.length) {
            const next = [];
            for (const p of edge) {
                for (const m of ['F', 'L', 'R']) {
                    const { to } = this.sail(p, m);
                    if (seen.has(id(to)))
                        continue;
                    seen.set(id(to), { prev: id(p), m });
                    if (to.c === c && to.r === r) {
                        const moves = [];
                        for (let at = id(to); at; at = seen.get(at).prev) {
                            const s = seen.get(at);
                            if (s.m)
                                moves.unshift(s.m);
                        }
                        return moves;
                    }
                    next.push(to);
                }
            }
            edge = next;
        }
        return null;
    }
    /** Where a pin dropped here lands: the nearest open square you can get to (off the board, or on
        a rock, it moves to the nearest that's open). */
    pinAt(c, r, from = SAIL.HOME) {
        const cc = Math.max(0, Math.min(this.cols - 1, Math.round(c))), rr = Math.max(0, Math.min(this.rows - 1, Math.round(r)));
        for (let ring = 0; ring < Math.max(this.cols, this.rows); ring++) {
            const near = [];
            for (let dc = -ring; dc <= ring; dc++)
                for (let dr = -ring; dr <= ring; dr++) {
                    if (Math.max(Math.abs(dc), Math.abs(dr)) === ring)
                        near.push([cc + dc, rr + dr]);
                }
            near.sort((a, b) => Math.hypot(a[0] - c, a[1] - r) - Math.hypot(b[0] - c, b[1] - r));
            for (const [x, y] of near)
                if (this.open(x, y) && this.plot(from, x, y))
                    return [x, y];
        }
        return null;
    }
    allReachable() {
        const H = SAIL.HOME;
        if (!this.open(H.c, H.r))
            return false;
        const got = new Set([key(H.c, H.r)]), seen = new Set();
        let edge = [H];
        while (edge.length) {
            const next = [];
            for (const p of edge)
                for (const m of ['F', 'L', 'R']) {
                    const { cells, to } = path(p, m), s = `${to.c},${to.r},${to.d}`;
                    if (!cells.every(([x, y]) => this.open(x, y)) || seen.has(s))
                        continue;
                    seen.add(s);
                    got.add(key(to.c, to.r));
                    next.push(to);
                }
            edge = next;
        }
        for (let c = 0; c < this.cols; c++)
            for (let r = 0; r < this.rows; r++)
                if (this.open(c, r) && !got.has(key(c, r)))
                    return false;
        return true;
    }
}
/** Where she is partway (u, 0 to 1) through a move, for drawing: across and out in squares (the
    middle of a square is a whole number) and the way she faces, in quarter turns. A turn sweeps a
    quarter circle; a bump lurches forward and back, or turns her on the spot. */
export function poseAt(p, m, u, bump = false) {
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    if (m === 'F') {
        const k = bump ? 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) : e;
        return { c: p.c + DC[p.d] * k, r: p.r + DR[p.d] * k, a: p.d };
    }
    const s = m === 'L' ? -1 : 1, a = p.d + s * e;
    if (bump)
        return { c: p.c, r: p.r, a };
    const side = (p.d + (m === 'L' ? 3 : 1)) % 4, mc = p.c + DC[side], mr = p.r + DR[side];
    const x = -DC[side], y = -DR[side], th = (m === 'L' ? 1 : -1) * e * Math.PI / 2;
    return { c: mc + x * Math.cos(th) - y * Math.sin(th), r: mr + x * Math.sin(th) + y * Math.cos(th), a };
}
/** The helm: where she is, where she's headed, and the clock that plays the turns. */
export class Helm {
    sea;
    pose;
    /** The pin: the square she's sailing for, if any. */
    pin = null;
    /** Moves you've put in yourself, played before the pilot's. */
    mine = [];
    /** The turn being played: its moves, which one's on, and how far into it. */
    turn = [];
    slot = -1;
    t = 0;
    /** The move being sailed just now. */
    cur = null;
    wait = 0;
    constructor(sea, pose = SAIL.HOME) {
        this.sea = sea;
        this.pose = { ...pose };
    }
    /** Where she'll be when this turn's played out. */
    after() {
        if (this.slot < 0)
            return { ...this.pose };
        let p = this.cur ? this.cur.to : this.pose;
        for (let i = this.slot + 1; i < this.turn.length; i++)
            p = this.sea.sail(p, this.turn[i]).to;
        return { ...p };
    }
    /** The course from the end of this turn on: your moves, then the pilot's to the pin. */
    course() {
        let p = this.after();
        for (const m of this.mine)
            p = this.sea.sail(p, m).to;
        const pilot = this.pin ? this.sea.plot(p, ...this.pin) ?? [] : [];
        return [...this.mine, ...pilot];
    }
    /** What the next turn will play. */
    next() { return this.course().slice(0, SAIL.SLOTS); }
    woken() { if (this.slot < 0 && this.wait <= 0)
        this.wait = SAIL.WAKE; }
    /** Drop the pin (near where you pointed: see Sea.pinAt). */
    drop(c, r) {
        const at = this.sea.pinAt(c, r, this.after());
        if (!at)
            return null;
        this.pin = at;
        if (at[0] === this.after().c && at[1] === this.after().r && !this.mine.length)
            this.pin = null;
        else
            this.woken();
        return at;
    }
    /** Put in a move yourself (up to a turn's worth ahead). */
    put(m) {
        if (this.mine.length >= SAIL.SLOTS)
            return false;
        this.mine.push(m);
        this.woken();
        return true;
    }
    /** Take back the last move you put in. */
    unput() { return this.mine.pop(); }
    /** Pull up the pin and forget your moves: she stops when this turn's done. */
    stop() { this.pin = null; this.mine = []; }
    /** Nothing playing and nothing to play. */
    idle() { return this.slot < 0 && !this.next().length; }
    /** Where she is right now, for drawing (see poseAt). */
    now() {
        if (!this.cur)
            return { c: this.pose.c, r: this.pose.r, a: this.pose.d };
        return poseAt(this.cur.from, this.cur.m, Math.min(1, this.t / SAIL.MOVE), this.cur.bump);
    }
    tick(dt) {
        const out = [];
        let left = dt;
        while (left > 0) {
            if (this.slot < 0) {
                // Between turns: the breather, then the next turn, if there's anything to play.
                const use = Math.min(left, Math.max(0, this.wait));
                this.wait -= use;
                left -= use;
                if (this.wait > 1e-9)
                    break;
                const moves = this.next();
                if (!moves.length)
                    break;
                this.mine.splice(0, Math.min(this.mine.length, moves.length));
                this.turn = moves;
                this.slot = 0;
                this.t = 0;
                out.push({ kind: 'turn', moves: [...moves] });
                this.begin(out);
                continue;
            }
            const span = SAIL.MOVE + SAIL.PAUSE, use = Math.min(left, span - this.t);
            const was = this.t;
            this.t += use;
            left -= use;
            if (was < SAIL.MOVE && this.t >= SAIL.MOVE && this.cur) {
                // The move's sailed.
                this.pose = { ...this.cur.to };
                if (this.pin && this.pose.c === this.pin[0] && this.pose.r === this.pin[1]) {
                    this.pin = null;
                    out.push({ kind: 'arrive', at: { ...this.pose } });
                }
            }
            if (this.t >= span - 1e-9) {
                this.cur = null;
                this.slot++;
                this.t = 0;
                if (this.slot >= this.turn.length) {
                    this.slot = -1;
                    this.turn = [];
                    this.wait = SAIL.BREAK;
                }
                else
                    this.begin(out);
            }
        }
        return out;
    }
    begin(out) {
        const m = this.turn[this.slot], { to, bump } = this.sea.sail(this.pose, m);
        this.cur = { m, from: { ...this.pose }, to, bump };
        out.push({ kind: 'move', i: this.slot, m, from: { ...this.pose }, to: { ...to }, bump });
    }
}
