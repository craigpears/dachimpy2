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
    /** Her guns, one each side (see Guns): how many squares a shot carries, and the seconds to load
        again after firing. */
    RANGE: 3,
    RELOAD: 3,
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
    /** The turret: how far it reaches (squares, any way), seconds between shots, how long a shot is
        in the air (time to get out from under it), and how long a hit from her guns quiets it. */
    TURRET_RANGE: 3,
    TURRET_RELOAD: 4,
    FLIGHT: 1.4,
    QUIET: 10,
    /** Seconds the turret holds fire once she's patched, so she can get going (the user, 9 Nov: "as
        soon as you finish the puzzle, the cannon starts shooting at you again ... literally before
        you can do anything about it"). */
    GRACE: 5,
    /** The hole a hit knocks in her deck when nothing says what shape (den.js makes a fresh one each
        hit): three pieces' worth, patched by Carpentry (src/den-patch.ts). */
    HOLE: [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3], [4, 2], [4, 3]],
};
/* The lay of the sea (the user, 9 Nov: "just really go for it. Add some shipping lanes ... where
   you've got a fork in the road ... some kind of a lock and canal ... if you want to switch from one
   route to the other one, you know, there's a bit of a cliff. You have to go up a lock").

   A trade wind runs out from near the mooring (A) and drops her at a junction, "just like a normal
   square", to choose: right onto the wind that sweeps her across (B) and round back in towards the
   cove (C), a loop; left along a canal to a lock in a cliff, up into a hidden cove behind it; or on
   out to open sea. Rocks stand along the lanes' sides, and a turret on a rock between them shoots
   at her. */
export const LAY = {
    /** The trade winds: where each starts, the way it blows, and how many squares long. */
    LANES: [
        { at: [9, 2], d: 0, n: 8 },
        { at: [10, 11], d: 1, n: 3 },
        { at: [13, 11], d: 2, n: 9 },
    ],
    JUNCTION: [9, 10],
    CANAL: [[8, 11], [7, 11], [6, 11]],
    LOCK: [5, 11],
    /** The hidden cove: up behind the cliff, its water a lock's lift above the sea. */
    COVE: { c0: 0, c1: 4, r0: 9, r1: 13 },
    TURRET: [11, 6],
    /** Rocks along the lanes' sides ("some craziness to the journey"). */
    SIDES: [[8, 5], [10, 8], [12, 4], [14, 8], [11, 13]],
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
    /** The trade winds: the way each lane square blows (see LAY). */
    wind = new Map();
    /** The cliff round the hidden cove (rocks too), the cove's water, the lock, the turret's rock. */
    cliff = new Set();
    cove = new Set();
    lock = null;
    turret = null;
    junction = null;
    /** Squares the scattered rocks keep off: the lanes and everything round them. */
    keep = new Set();
    /** A sea of scattered rocks; with `lay`, the lanes, the lock and the cove too (LAY). */
    constructor(seed = 1, lay = true) {
        if (lay)
            this.lay();
        for (let tries = 0; tries < 50; tries++) {
            this.scatter(dice(seed + tries * 7919));
            if (this.allReachable())
                return;
        }
        this.scatter(() => 1); // (never seen: no scattered rocks, rather than a stuck sea)
    }
    lay() {
        const near = (c, r) => { for (let a = -1; a <= 1; a++)
            for (let b = -1; b <= 1; b++)
                this.keep.add(key(c + a, r + b)); };
        for (const { at: [c, r], d, n } of LAY.LANES)
            for (let i = 0; i < n; i++) {
                const x = c + DC[d] * i, y = r + DR[d] * i;
                this.wind.set(key(x, y), d);
                near(x, y);
            }
        for (const [c, r] of [LAY.JUNCTION, [LAY.JUNCTION[0], LAY.JUNCTION[1] + 1], ...LAY.CANAL, LAY.TURRET])
            near(c, r);
        const { c0, c1, r0, r1 } = LAY.COVE;
        for (let c = c0; c <= c1; c++)
            for (let r = r0; r <= r1; r++)
                this.cove.add(key(c, r));
        for (let r = r0 - 1; r <= r1; r++)
            if (r !== LAY.LOCK[1])
                this.cliff.add(key(c1 + 1, r));
        for (let c = c0; c <= c1; c++)
            this.cliff.add(key(c, r0 - 1));
        for (let c = c0; c <= c1 + 2; c++)
            for (let r = r0 - 2; r <= r1; r++)
                this.keep.add(key(c, r));
        this.lock = [...LAY.LOCK];
        this.turret = [...LAY.TURRET];
        this.junction = [...LAY.JUNCTION];
    }
    scatter(roll) {
        this.rocks = new Set([...this.cliff, ...LAY.SIDES.filter(() => this.wind.size).map(([c, r]) => key(c, r)), ...(this.turret ? [key(...this.turret)] : [])]);
        const H = SAIL.HOME;
        for (let n = 0; n < SAIL.CLUMPS; n++) {
            let c = Math.floor(roll() * this.cols), r = 2 + Math.floor(roll() * (this.rows - 2));
            const size = 1 + Math.floor(roll() * 3);
            for (let i = 0; i < size; i++) {
                if ((Math.abs(c - H.c) > 2 || r > 3) && !this.keep.has(key(c, r)) && c < this.cols && r < this.rows)
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
    /** The way the trade wind blows on this square, if it's a lane. */
    windAt(c, r) { return this.wind.get(key(c, r)); }
    isLock(c, r) { return !!this.lock && this.lock[0] === c && this.lock[1] === r; }
    /** The water's level here: the sea's 0, the hidden cove's 1 (the lock's is the helm's). */
    level(c, r) { return this.cove.has(key(c, r)) ? 1 : 0; }
    /** Swept along by the trade winds from here, a square at a time, facing the way it blows, till
        she's off the lane (or would hit something). */
    ride(p) {
        const out = [];
        let at = p;
        for (let d = this.windAt(at.c, at.r); d !== undefined && out.length < 64; d = this.windAt(at.c, at.r)) {
            const c = at.c + DC[d], r = at.r + DR[d];
            if (!this.open(c, r))
                break;
            at = { c, r, d };
            out.push(at);
        }
        return out;
    }
    /** A move and what the wind does after it. */
    move(p, m) {
        const { cells, to } = path(p, m);
        if (cells.every(([c, r]) => this.open(c, r)))
            return { to, bump: false, ride: this.ride(to) };
        return { to: { c: p.c, r: p.r, d: to.d }, bump: true, ride: [] };
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
        const { to, bump, ride } = this.move(p, m);
        return { to: ride.length ? ride[ride.length - 1] : to, bump };
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
                    const { to, bump } = this.sail(p, m), s = `${to.c},${to.r},${to.d}`;
                    if (bump || seen.has(s))
                        continue;
                    seen.add(s);
                    got.add(key(to.c, to.r));
                    next.push(to);
                }
            edge = next;
        }
        // (She can't stop on a lane: the wind always sweeps her on.)
        for (let c = 0; c < this.cols; c++)
            for (let r = 0; r < this.rows; r++)
                if (this.open(c, r) && this.windAt(c, r) === undefined && !got.has(key(c, r)))
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
/** The lock's water, rising (or falling) towards where it's headed: a step at a time as each clear
    is pumped in, smoothly, never in one jump, and there within a second or so. */
export function lockRise(level, to, dt) {
    const d = to - level, step = Math.max(SAIL.RISE * dt, Math.abs(d) * Math.min(1, dt * 3));
    return Math.abs(d) <= step ? to : level + Math.sign(d) * step;
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
    /** What's being sailed just now: a move, or a square of trade wind ('W') sweeping her on. */
    cur = null;
    /** The squares of trade wind still to come after it. */
    rides = [];
    /** The lock's water: 0 the sea's level, 1 the hidden cove's. */
    level = 0;
    /** What's been pumped into the lock: the water rises to it as she waits (lockRise). */
    fill = 0;
    /** The hole the last hit knocked in her deck: she's dazed till it's patched. */
    hole = null;
    /** Seconds till the lock's gates are open, after it's filled or drained. */
    gates = 0;
    /** Seconds the turret still holds fire after she's patched (SAIL.GRACE). */
    grace = 0;
    wait = 0;
    constructor(sea, pose = SAIL.HOME) {
        this.sea = sea;
        this.pose = { ...pose };
    }
    /** Where she'll be when this turn's played out. */
    after() {
        if (this.slot < 0)
            return { ...this.pose };
        let p = this.cur ? (this.rides.length ? this.rides[this.rides.length - 1] : this.cur.to) : this.pose;
        for (let i = this.slot + (this.cur ? 1 : 0); i < this.turn.length; i++)
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
    /** Pull up the pin and forget your moves: she stops when this turn's done (or straight away,
        if she's waiting at the lock). */
    stop() {
        this.pin = null;
        this.mine = [];
        if (!this.cur && this.slot >= 0) {
            this.turn = [];
            this.slot = -1;
            this.wait = SAIL.BREAK;
        }
    }
    /** Nothing playing and nothing to play. */
    idle() { return this.slot < 0 && !this.next().length; }
    /** Holed, and the hole not yet patched. */
    dazed() { return !!this.hole && !this.hole.done(); }
    /** Hit (by the turret, say): a hole in her deck, and she's dazed till it's patched. She finishes
        the move she's on (or the trade wind's ride), then waits. (A hit while she's holed already
        does nothing more: the turret holds fire then anyway.) */
    hit(cells = SAIL.HOLE) { if (!this.dazed()) {
        this.hole = new DeckHole(cells);
        this.grace = SAIL.GRACE;
    } }
    /** Not to be shot at just now: held up (dazed, or at the lock), or just patched and getting going. */
    spared() { return !!this.held() || this.grace > 1e-9; }
    /** What she's waiting on, if anything. */
    held() {
        if (this.dazed())
            return 'daze';
        if (this.slot >= 0 && !this.cur)
            return this.gate(this.turn[this.slot]) ?? (this.gates > 1e-9 ? 'gates' : null);
        return null;
    }
    /** A move of Bilge's worth: pumps the lock up if she's waiting on it. What it went to. */
    pump(w) {
        if (this.held() === 'up') {
            this.fill = Math.min(1, Math.max(this.fill, this.level) + w / SAIL.LOCK_WORK);
            return 'lock';
        }
        return null;
    }
    /** Whether the lock's in the way of this move: through its gates only when its water's at the
        level of the other side. */
    gate(m) {
        if (!this.sea.lock)
            return null;
        const { cells } = path(this.pose, m);
        if (!cells.every(([c, r]) => this.sea.open(c, r)))
            return null; // (she'll only bump)
        const seq = [[this.pose.c, this.pose.r], ...cells];
        for (let i = 0; i + 1 < seq.length; i++) {
            const a = this.sea.isLock(...seq[i]), b = this.sea.isLock(...seq[i + 1]);
            if (a === b)
                continue;
            const want = this.sea.level(...(a ? seq[i + 1] : seq[i]));
            if (Math.abs(this.level - want) > 1e-6)
                return want > this.level ? 'up' : 'down';
        }
        return null;
    }
    /** Where she is right now, for drawing (see poseAt). */
    now() {
        if (!this.cur)
            return { c: this.pose.c, r: this.pose.r, a: this.pose.d };
        const { from, to, m } = this.cur;
        if (m === 'W') {
            const u = Math.min(1, this.t / SAIL.PUSH), turn = ((to.d - from.d + 6) % 4) - 2;
            return { c: from.c + (to.c - from.c) * u, r: from.r + (to.r - from.r) * u, a: from.d + turn * Math.min(1, u * 1.5) };
        }
        return poseAt(from, m, Math.min(1, this.t / SAIL.MOVE), this.cur.bump);
    }
    tick(dt) {
        const out = [];
        let left = dt;
        // Holed, the turret's grace waits for the patch; then it runs down.
        this.grace = this.dazed() ? SAIL.GRACE : Math.max(0, this.grace - dt);
        // The lock's water rising to what's been pumped in; full, the top gates swing open.
        if (this.fill > this.level + 1e-9) {
            this.level = lockRise(this.level, this.fill, dt);
            if (this.level >= 1 - 1e-9) {
                this.level = this.fill = 1;
                this.gates = SAIL.GATES;
            }
        }
        for (let guard = 0; left > 1e-12 && guard < 1000; guard++) {
            if (this.cur) {
                // A move or a square of wind, then (after the last of the wind) the pause. Dazed, she
                // holds once the move's sailed; the wind sweeps her on regardless.
                const cur = this.cur, dur = cur.m === 'W' ? SAIL.PUSH : SAIL.MOVE;
                const span = dur + (this.rides.length ? 0 : SAIL.PAUSE), hold = this.dazed() && !this.rides.length;
                if (hold && cur.done)
                    break;
                const use = hold ? Math.min(left, Math.max(0, dur - this.t)) : Math.min(left, span - this.t);
                this.t += use;
                left -= use;
                if (!cur.done && this.t >= dur - 1e-9) {
                    cur.done = true;
                    this.pose = { ...cur.to };
                    if (this.pin && this.pose.c === this.pin[0] && this.pose.r === this.pin[1]) {
                        this.pin = null;
                        out.push({ kind: 'arrive', at: { ...this.pose } });
                    }
                }
                if (this.t < span - 1e-9)
                    continue;
                this.t = 0;
                if (this.rides.length) {
                    const to = this.rides.shift();
                    this.cur = { m: 'W', from: { ...this.pose }, to, bump: false };
                    out.push({ kind: 'push', from: { ...this.pose }, to: { ...to } });
                    continue;
                }
                this.cur = null;
                this.slot++;
                if (this.slot >= this.turn.length) {
                    this.slot = -1;
                    this.turn = [];
                    this.wait = SAIL.BREAK;
                }
                continue;
            }
            if (this.slot >= 0) {
                // The next move of the turn, unless she's dazed or waiting on the lock.
                if (this.dazed())
                    break;
                const g = this.gate(this.turn[this.slot]);
                if (g === 'up')
                    break;
                if (g === 'down') {
                    const use = Math.min(left, this.level * SAIL.DRAIN);
                    this.level -= use / SAIL.DRAIN;
                    left -= use;
                    this.fill = Math.min(this.fill, this.level);
                    if (this.level > 1e-6)
                        break;
                    this.level = 0;
                    this.gates = SAIL.GATES; // drained: the bottom gates swing open
                    continue;
                }
                if (this.gates > 1e-9) {
                    // The gates swinging open before she sails through.
                    const use = Math.min(left, this.gates);
                    this.gates -= use;
                    left -= use;
                    if (this.gates > 1e-9)
                        break;
                    this.gates = 0;
                    continue;
                }
                this.begin(out);
                continue;
            }
            // Between turns: the breather, then the next turn, if there's anything to play.
            const use = Math.min(left, Math.max(0, this.wait));
            this.wait -= use;
            left -= use;
            this.gates = Math.max(0, this.gates - use);
            if (this.wait > 1e-9 || this.dazed())
                break;
            const moves = this.next();
            if (!moves.length)
                break;
            this.mine.splice(0, Math.min(this.mine.length, moves.length));
            this.turn = moves;
            this.slot = 0;
            this.t = 0;
            out.push({ kind: 'turn', moves: [...moves] });
        }
        return out;
    }
    begin(out) {
        const m = this.turn[this.slot], { to, bump, ride } = this.sea.move(this.pose, m);
        this.cur = { m, from: { ...this.pose }, to, bump };
        this.rides = ride;
        this.t = 0;
        out.push({ kind: 'move', i: this.slot, m, from: { ...this.pose }, to: { ...to }, bump });
    }
}
export class Turret {
    at;
    /** Seconds till it can fire again, and till it's over being hit. */
    wait = 1;
    quiet = 0;
    /** Shots in the air: where each comes down, and when. */
    shots = [];
    constructor(at) {
        this.at = at;
    }
    /** Within its reach (squares, any way). */
    reaches(c, r) { return Math.max(Math.abs(c - this.at[0]), Math.abs(r - this.at[1])) <= SAIL.TURRET_RANGE; }
    /** Hit by her guns: quiet for a while. */
    silence() { this.quiet = SAIL.QUIET; }
    /** `ship`: where she is now (Helm.now), or null when it shouldn't shoot at her (she's not out,
        or Helm.spared: dazed, at the lock, or just patched). */
    tick(dt, ship) {
        const out = [];
        this.quiet = Math.max(0, this.quiet - dt);
        this.wait = Math.max(0, this.wait - dt);
        for (const s of this.shots)
            s.t -= dt;
        for (const s of this.shots.filter((x) => x.t <= 1e-9)) {
            const hit = !!ship && Math.round(ship.c) === s.to[0] && Math.round(ship.r) === s.to[1];
            out.push({ kind: 'land', to: s.to, hit });
        }
        this.shots = this.shots.filter((x) => x.t > 1e-9);
        if (ship && this.quiet <= 0 && this.wait <= 0) {
            const to = [Math.round(ship.c), Math.round(ship.r)];
            if (this.reaches(...to)) {
                this.shots.push({ to, t: SAIL.FLIGHT });
                this.wait = SAIL.TURRET_RELOAD;
                out.push({ kind: 'fire', to });
            }
        }
        return out;
    }
}
/** A shot out of that side from where she is now (see Helm.now: mid-move counts from the square
    and heading she's nearest): the squares it passes over, and the rock it hits, if any. */
export function broadside(sea, at, side) {
    const d = (((Math.round(at.a) + (side === 'R' ? 1 : 3)) % 4) + 4) % 4;
    const c0 = Math.round(at.c), r0 = Math.round(at.r), cells = [];
    for (let k = 1; k <= SAIL.RANGE; k++) {
        const c = c0 + DC[d] * k, r = r0 + DR[d] * k;
        cells.push([c, r]);
        if (sea.isRock(c, r))
            return { cells, hit: [c, r] };
    }
    return { cells, hit: null };
}
/** Her two guns: loaded, or loading again after a shot. */
export class Guns {
    /** Seconds till each is loaded again (0: loaded). */
    wait = { L: 0, R: 0 };
    ready(side) { return this.wait[side] <= 1e-9; }
    /** Fire it, if it's loaded. */
    fire(side) {
        if (!this.ready(side))
            return false;
        this.wait[side] = SAIL.RELOAD;
        return true;
    }
    /** How loaded it is, 0 just fired to 1 ready. */
    loaded(side) { return 1 - Math.max(0, this.wait[side]) / SAIL.RELOAD; }
    tick(dt) { for (const k of ['L', 'R'])
        this.wait[k] = Math.max(0, this.wait[k] - dt); }
}
