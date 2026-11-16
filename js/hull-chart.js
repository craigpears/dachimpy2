/* Pirate Den: one kind of ship's moves on a board, worked out once and shared by every ship of the kind. TypeScript,
   compiled to js/hull-chart.js; tested in tests/hull-chart.test.ts.

   The user (15 Nov): "surely, you know, there's not that many ways you can move around ... Can we not just for the map
   have ... a couple of pre-computed maps ... one for small ships, one for big, and ... the only thing that can really
   change is ... the destructible items ... And then ... the adversarial planning on the top ... so you can plan around
   other moving ships". So, for a board:
   - **the chart** (`HullChart`): from every square she could lie on and every way she could face, where each of her
     three moves takes her (by her handling, and the winds if she's small enough to be carried), what it costs her in
     seconds (as the pilot reckons it: src/den-sail.ts, Sea.quickest), and the squares it sweeps. Only the rocks are on
     it, never a ship: worked out once for every ship of her kind (all the sloops share one, all the frigates another),
     and again only when the rocks change (a tower crumbling);
   - **how far to anywhere** (`field`): from a place (a buoy's square, a cove, a gate's berths), the seconds from every
     pose of hers to get there, the chart worked backwards from it once. Then how far it is from anywhere is a look-up
     (a bot choosing where to go), and her quickest way there is always the move that's cheapest with what's left
     after it: no searching. Kept for every ship of her kind, the most used few hundred;
   - **round the ships** (`plot`): her way as things are. The other ships are in the way only near her (`near`
     squares: one further off will have moved by the time she's there), and the search round them is told exactly how
     far everything is past them (the field: A*, with it as its guess), so it looks only at what they change. With no
     ship near, it goes straight down the field. */
import { PILOT_COST, pauseFor } from './den-sail.js';
const MOVES = ['F', 'L', 'R'];
const NONE = new Int32Array(0);
export const CHART = {
    /** Fields kept for a kind of ship (each one board's worth of numbers); the least used goes first. */
    FIELDS: 256,
    /** The most poses a search round the ships looks at before it gives up: there's no way as things are. */
    SEARCH: 4000,
};
/** A heap of poses by cost, cheapest on top (for a field, and a search round the ships). */
class Heap {
    cost = [];
    id = [];
    get size() { return this.id.length; }
    push(c, id) {
        const C = this.cost, I = this.id;
        let i = I.length;
        C.push(c);
        I.push(id);
        while (i > 0) {
            const j = (i - 1) >> 1;
            if (C[j] <= c)
                break;
            C[i] = C[j];
            I[i] = I[j];
            i = j;
        }
        C[i] = c;
        I[i] = id;
    }
    /** Take off the cheapest: its pose (read its cost with `top` first). */
    pop() {
        const C = this.cost, I = this.id, id = I[0], lc = C.pop(), li = I.pop(), n = I.length;
        if (n) {
            let i = 0;
            for (;;) {
                const a = 2 * i + 1, b = a + 1;
                let k = -1;
                if (a < n && C[a] < lc)
                    k = a;
                if (b < n && C[b] < (k < 0 ? lc : C[a]))
                    k = b;
                if (k < 0)
                    break;
                C[i] = C[k];
                I[i] = I[k];
                i = k;
            }
            C[i] = lc;
            I[i] = li;
        }
        return id;
    }
    top() { return this.cost[0]; }
}
/** One kind of ship's moves on a board (her sea's rocks and winds, no ships), and how far to anywhere on it. */
export class HullChart {
    sea;
    cols;
    rows;
    /** Poses: (c * rows + r) * 4 + d, as the pilot numbers them. */
    N;
    /** Each move (pose * 3 + move): the pose it ends in (-1: no move, she can't be there, or it leaves her as she
        was), its cost in seconds, and whether she bumped. */
    end;
    cost;
    bump;
    /** Times the chart's been worked out (once, and again each time the rocks change). */
    builds = 0;
    /** Poses worked out again the last time the rocks changed (all of them, the first time). */
    rebuilt = 0;
    /** The squares each move sweeps (square ids, c * rows + r). */
    sw = [];
    /** The moves into each pose, packed (a field works backwards along them). */
    in0;
    ins;
    sig = '';
    /** The rocks as they were when it was last worked out (to work out again only what's near a change). */
    was = new Set();
    fields = new Map();
    /** A search's own numbers, kept between searches (stamped, so none needs clearing). */
    g;
    prev;
    how;
    seen;
    stamp = 0;
    /** `sea`: her kind's sea with no ships on it (ShipSea.bare), sharing the board's rocks and winds. */
    constructor(sea) {
        this.sea = sea;
        this.cols = sea.cols;
        this.rows = sea.rows;
        this.N = this.cols * this.rows * 4;
    }
    id(p) { return (p.c * this.rows + p.r) * 4 + p.d; }
    pose(id) { return { c: Math.floor(id / 4 / this.rows), r: Math.floor(id / 4) % this.rows, d: id % 4 }; }
    /** Worked out again if the rocks or winds have changed since: the whole of it the first time (or the winds
        changed, or a changed rock's on or by a wind, whose rides could run anywhere along it); else only the poses near
        enough to a changed rock for any move of hers to touch it (ShipSea.reach). */
    fresh() {
        const { sea } = this, sig = `${sea.rocks.size},${sea.wind.size}`;
        if (sig === this.sig)
            return;
        const changed = !this.builds || this.sig.split(',')[1] !== `${sea.wind.size}` ? null
            : [...[...sea.rocks].filter((k) => !this.was.has(k)), ...[...this.was].filter((k) => !sea.rocks.has(k))].map((k) => k.split(',').map(Number));
        const windy = (c, r) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([x, y]) => sea.wind.has(`${c + x},${r + y}`));
        this.sig = sig;
        this.was = new Set(sea.rocks);
        this.build(changed && !changed.some(([c, r]) => windy(c, r)) ? changed : null);
    }
    /** What the chart hangs on (a plot made on it is good while this is the same). */
    version() { this.fresh(); return `${this.sig}#${this.builds}`; }
    /** Each move from every pose (or, `near` these squares, only the poses whose moves could touch them), then the
        moves into each pose. */
    build(near) {
        const { N, rows, sea } = this;
        if (!near) {
            this.end = new Int32Array(N * 3).fill(-1);
            this.cost = new Float64Array(N * 3);
            this.bump = new Uint8Array(N * 3);
            this.sw = new Array(N * 3);
            this.g = new Float64Array(N);
            this.prev = new Int32Array(N);
            this.how = new Int8Array(N);
            this.seen = new Int32Array(N);
        }
        const R = sea.reach() + 1, redo = (id) => {
            const p = this.pose(id), ok = sea.fits(p);
            for (let m = 0; m < 3; m++) {
                const k = id * 3 + m;
                this.end[k] = -1;
                this.cost[k] = 0;
                this.bump[k] = 0;
                this.sw[k] = NONE;
                if (!ok)
                    continue;
                const got = sea.move(p, MOVES[m]), to = got.ride.length ? got.ride[got.ride.length - 1] : got.to, e = this.id(to);
                if (e === id)
                    continue;
                const secs = sea.moveSecs(false, p, MOVES[m]);
                this.end[k] = e;
                this.bump[k] = got.bump ? 1 : 0;
                const swept = sea.sweep(p, MOVES[m], got), toll = sea.toll;
                this.cost[k] = secs + pauseFor(secs) + PILOT_COST.TURN + got.ride.length * PILOT_COST.PUSH
                    + (toll && swept.some(([c, r]) => toll.squares.has(`${c},${r}`)) ? toll.secs : 0); // (through her shoals: the toll)
                this.sw[k] = Int32Array.from(swept, ([c, r]) => c * rows + r);
            }
        };
        let n = 0;
        if (!near)
            for (let id = 0; id < N; id++, n++)
                redo(id);
        else {
            const todo = new Set();
            for (const [c0, r0] of near)
                for (let c = Math.max(0, c0 - R); c <= Math.min(this.cols - 1, c0 + R); c++)
                    for (let r = Math.max(0, r0 - R); r <= Math.min(rows - 1, r0 + R); r++)
                        todo.add(c * rows + r);
            for (const sq of todo)
                for (let d = 0; d < 4; d++, n++)
                    redo(sq * 4 + d);
        }
        // (the moves into each pose, for working backwards)
        const end = this.end, count = new Int32Array(N + 1);
        for (let k = 0; k < N * 3; k++)
            if (end[k] >= 0)
                count[end[k] + 1]++;
        for (let i = 0; i < N; i++)
            count[i + 1] += count[i];
        const ins = new Int32Array(count[N]), fill = count.slice(0, N);
        for (let k = 0; k < N * 3; k++)
            if (end[k] >= 0)
                ins[fill[end[k]]++] = k;
        this.in0 = count;
        this.ins = ins;
        this.fields.clear();
        this.rebuilt = n;
        this.builds++;
    }
    /** The squares a move sweeps (pose * 3 + move). */
    sweeps(k) { return this.sw[k]; }
    /** How far to a place from every pose: the seconds of her quickest way to any of its poses (`goals`, asked for only
        the first time), Infinity where there's none. `key` names the place (the same key, the same goals). */
    field(key, goals) {
        this.fresh();
        const had = this.fields.get(key);
        if (had) {
            this.fields.delete(key);
            this.fields.set(key, had);
            return had;
        }
        const f = new Float64Array(this.N).fill(Infinity), heap = new Heap();
        for (const g of goals())
            if (g >= 0 && g < this.N && f[g] !== 0) {
                f[g] = 0;
                heap.push(0, g);
            }
        while (heap.size) {
            const t = heap.top(), at = heap.pop();
            if (t > f[at])
                continue;
            for (let i = this.in0[at]; i < this.in0[at + 1]; i++) {
                const k = this.ins[i], from = (k / 3) | 0, c = t + this.cost[k];
                if (c < f[from] - 1e-9) {
                    f[from] = c;
                    heap.push(c, from);
                }
            }
        }
        this.fields.set(key, f);
        if (this.fields.size > CHART.FIELDS)
            this.fields.delete(this.fields.keys().next().value);
        return f;
    }
    /** Fields kept just now. */
    kept() { return this.fields.size; }
    /** Her quickest way from `from` to the place, as things are on `sea` (her own, with the other ships on it): a ship
        whose squares are within `near` of hers is in her way (a move through her is sailed as her sea really has it:
        bumped, or not at all); one further off isn't. `near` below 0: no ships at all. Null if there's no way. */
    plot(sea, from, key, goals, near) {
        const h = this.field(key, goals), s0 = this.id(from);
        if (!(h[s0] < Infinity))
            return null;
        if (h[s0] === 0)
            return [];
        const { g, prev, how, seen } = this, st = ++this.stamp;
        // (by what it'll cost all told, ties to the one nearer there: straight down the field)
        const by = (gx, hx) => gx + hx * (1 + 1e-9);
        const heap = new Heap();
        g[s0] = 0;
        prev[s0] = -1;
        seen[s0] = st;
        heap.push(by(0, h[s0]), s0);
        let looked = 0;
        while (heap.size) {
            const f = heap.top(), at = heap.pop(), ga = g[at];
            if (f > by(ga, h[at]) + 1e-12)
                continue; // (a stale entry: she's been found a quicker way there since)
            if (h[at] === 0) {
                const moves = [];
                for (let x = at; prev[x] >= 0; x = prev[x])
                    moves.push(MOVES[how[x]]);
                return moves.reverse();
            }
            if (++looked > CHART.SEARCH)
                return null;
            const p = near >= 0 ? this.pose(at) : null;
            for (let m = 0; m < 3; m++) {
                const k = at * 3 + m;
                let e = this.end[k], c = this.cost[k];
                if (e < 0)
                    continue;
                // (a ship near her in its way: the move as her own sea has it)
                if (p && this.crossed(sea, k, from, near)) {
                    const got = sea.move(p, MOVES[m]), to = got.ride.length ? got.ride[got.ride.length - 1] : got.to;
                    e = this.id(to);
                    if (e === at || !(h[e] < Infinity))
                        continue;
                    const secs = sea.moveSecs(false, p, MOVES[m]) / (sea.drag || 1);
                    c = secs + pauseFor(secs) + PILOT_COST.TURN + got.ride.length * PILOT_COST.PUSH;
                }
                const ng = ga + c;
                if (seen[e] === st && g[e] <= ng + 1e-9)
                    continue;
                seen[e] = st;
                g[e] = ng;
                prev[e] = at;
                how[e] = m;
                heap.push(by(ng, h[e]), e);
            }
        }
        return null;
    }
    /** A ship's in the way of this move (another ship on any square it sweeps, within `near` of where she starts). */
    crossed(sea, k, from, near) {
        const { rows } = this;
        for (const sq of this.sw[k]) {
            const c = (sq / rows) | 0, r = sq % rows;
            if (Math.max(Math.abs(c - from.c), Math.abs(r - from.r)) <= near && sea.blocked(c, r))
                return true;
        }
        return false;
    }
    /** What a list of moves costs her from there, by the chart (Infinity if one isn't on it). */
    costOf(from, moves) {
        this.fresh();
        let at = this.id(from), t = 0;
        for (const m of moves) {
            const k = at * 3 + MOVES.indexOf(m);
            if (this.end[k] < 0)
                return Infinity;
            t += this.cost[k];
            at = this.end[k];
        }
        return t;
    }
}
