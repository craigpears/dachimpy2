/* Sailing, the real puzzle (YPPedia "Sailing", "Sail scoring", "Chain", "Maneuver", "Sea battle", read
   10 Nov 2026). TypeScript, compiled to js/sailing.js by `npm run build`; tested in
   tests/sailing.test.ts and played by the bots in tools/sail-bots.mjs. It knows nothing of the den:
   the den draws the board and turns what a drop earned (Sail.run) into her moves.

   Faithful to the original (RULES.md):
   - The board is 8 wide by 16 high. Row 0 is the top. Three colours: water (blue), rope (yellow),
     wind (white).
   - Pieces come in joined pairs down the two middle columns (3 and 4). You steer the pair left or
     right and turn it, then it falls. A pair stays joined after it lands: one half held up keeps the
     other half hanging beside it. When either half is cleared the other is loose and falls.
   - Platforms: rectangles with outlined targets, each wanting a colour. A platform is a shelf across
     its whole width (nothing falls through the gaps between its targets). It's done when every
     target holds a piece of its colour (the other squares may hold anything, or nothing); then the
     pieces in its targets clear and the platform goes.
   - Four or more of a colour in a row or a column clear, fixed square pieces included.
   - After a drop the board settles in turn: everything falls, done platforms clear (all at once),
     lines clear (all at once), and round again until nothing moves. Each step that clears something
     is a step of the chain; things cleared together are one step.
   - Chain names: 2 Double, 3 Triple, 4 Bingo!, 5 Donkey!, 6 or more Vegas!!. Sailing has a real
     Vegas (unlike Bilge's, which is a combo of lines at once, Sailing's is a chain of six).
   - Scoring, for the whole cascade: in each line step the first four ordinary pieces 1 point each and
     any more 2 each; pieces cleared from platforms 4 each; fixed pieces 5 each. Times the chain, which
     counts in full up to twice the board's difficulty and by halves beyond: c, or 2d + (c - 2d) / 2,
     rounded down. A target filled with its colour is a point; a filled target lost before its
     platform clears is a point off.
   - A booch: once everything has settled, a piece in the top square of either middle column. 20
     points off, and a fresh board. Clearing every platform deals a fresh board too, a harder one.

   Not on YPPedia, so made up here (say so if it matters): how boards are dealt (how many platforms,
   their sizes, targets and fixed pieces), how fast difficulty rises and when it resets, whether the
   next pair is shown, whether the target points are inside the chain's multiplier (here they're not),
   and steering: a pair is dropped straight down a column it can reach along the top row (no tucking
   under a ledge while it falls).

   The den's twist (the user, 10 Nov: "set up a Vegas, and go like 7 forwards in one go"): each drop's
   chain is a run straight ahead, in one go (runFor). The real game has nothing like it: there, the
   crew's sailing as a whole makes the ship's move tokens, at a rate YPPedia doesn't give, and no clear
   makes a forward token of its own. */
export const W = 8, H = 16, COLOURS = 3;
/** The two middle columns the pairs come down, and whose top squares booch the board. */
export const SPAWN = [3, 4];
export const COLOUR_NAMES = ['water', 'rope', 'wind'];
export const BOOCH_PENALTY = 20;
/** Rows kept clear of platforms and fixed pieces when a board is dealt. */
export const TOP_FREE = 4;
/** Difficulty: up by one a board cleared, to MAX; back to START after RESET_AFTER boards, or a booch.
    (YPPedia: "increasingly difficult ... after several boards have been cleared ... reset"; the
    numbers are guesses.) */
export const DIFFICULTY = { START: 1, MAX: 4, RESET_AFTER: 5 };
/** A chain's name by its steps. */
export function chainName(steps) {
    return steps >= 6 ? 'Vegas!!' : ['', '', 'Double', 'Triple', 'Bingo!', 'Donkey!'][Math.max(0, steps)];
}
/** What a chain of `steps` multiplies the cascade by, on a board of difficulty d. */
export function multiplier(steps, d) {
    return steps <= 2 * d ? steps : 2 * d + (steps - 2 * d) / 2;
}
/** The den's twist: squares straight ahead in one go, by the drop's chain, scaled so small combos
    count too (the user, 10 Nov: "I did a double and it went forward double and got me past one of
    the whirlwinds"). A step a square up to a Donkey, then the Vegas jumps to seven, the long rush
    ("like 7 forwards in one go"), and a square more for each step past it.
      nothing 0, plain clear 1, Double 2, Triple 3, Bingo! 4, Donkey! 5, Vegas!! 7, V2 8, V3 9 ... */
export const RUN_TABLE = [0, 1, 2, 3, 4, 5, 7];
export const RUN = { VEGAS: 6 };
export function runFor(steps) {
    const s = Math.max(0, Math.floor(steps)), top = RUN_TABLE.length - 1;
    return s <= top ? RUN_TABLE[s] : RUN_TABLE[top] + s - top;
}
const key = (p, t) => `${p.id}:${t.r},${t.c}`;
export class Sailing {
    random;
    /** grid[row][col], row 0 at the top. */
    grid = [];
    platforms = [];
    pair;
    next;
    difficulty = DIFFICULTY.START;
    /** Boards cleared since the difficulty last reset. */
    boards = 0;
    score = 0;
    drops = 0;
    booches = 0;
    /** Keep stages (the den animates them; bots don't need them). */
    record = true;
    filled = new Set();
    nextId = 1;
    constructor(random = Math.random, deal = true) {
        this.random = random;
        this.pair = this.newPair();
        this.next = this.newPair();
        if (deal)
            this.deal();
        else
            this.clear();
    }
    newPair() { return [Math.floor(this.random() * COLOURS), Math.floor(this.random() * COLOURS)]; }
    /** An empty board, no platforms. */
    clear() {
        this.grid = Array.from({ length: H }, () => Array(W).fill(null));
        this.platforms = [];
        this.filled.clear();
    }
    /** A fresh board for the difficulty: more platforms, targets and fixed pieces as it rises. */
    deal() {
        this.clear();
        const d = this.difficulty, want = Math.min(6, 2 + d);
        for (let tries = 0; this.platforms.length < want && tries < 300; tries++) {
            const h = this.random() < 0.25 ? 2 : 1, w = 2 + Math.floor(this.random() * 3);
            const c = Math.floor(this.random() * (W - w + 1)), r = TOP_FREE + Math.floor(this.random() * (H - TOP_FREE - h + 1));
            // Not touching another platform, so every shelf is its own.
            if (this.platforms.some((p) => r <= p.r + p.h && p.r <= r + h && c <= p.c + p.w && p.c <= c + w))
                continue;
            const targets = [];
            const odds = 0.6 + 0.1 * d;
            for (let rr = r; rr < r + h; rr++)
                for (let cc = c; cc < c + w; cc++)
                    if (this.random() < odds)
                        targets.push({ r: rr, c: cc, colour: Math.floor(this.random() * COLOURS) });
            if (targets.length < 2)
                continue;
            this.platforms.push({ id: this.nextId++, r, c, w, h, targets });
        }
        // Fixed pieces low down, never over a target (it would be shut in) nor inside a platform.
        for (let n = 0, tries = 0; n < d && tries < 100; tries++) {
            const r = H - 6 + Math.floor(this.random() * 6), c = Math.floor(this.random() * W);
            if (this.grid[r][c] || this.inPlatform(r, c) || this.platforms.some((p) => p.targets.some((t) => t.c === c && t.r > r)))
                continue;
            this.grid[r][c] = { id: this.nextId++, c: Math.floor(this.random() * COLOURS), fixed: true };
            n++;
        }
    }
    /** Set a board out as given (a test's, or a den's own): targets already holding their colour count
        as filled, for no points. */
    lay(grid, platforms) {
        this.grid = grid;
        this.platforms = platforms;
        this.filled.clear();
        this.fills();
    }
    inPlatform(r, c) {
        return this.platforms.find((p) => r >= p.r && r < p.r + p.h && c >= p.c && c < p.c + p.w);
    }
    /** Is there a shelf under (r, c)? */
    shelf(r, c) {
        return this.platforms.some((p) => r === p.r + p.h - 1 && c >= p.c && c < p.c + p.w);
    }
    /** The squares the pair comes in at for a drop, [row, col, colour] each; null if it can't get
        there: it comes in along the top row from the middle columns, which must be clear all the way. */
    entry(d) {
        const flat = d.turn === 0 || d.turn === 2;
        if (d.col < 0 || d.col > (flat ? W - 2 : W - 1))
            return null;
        const right = flat ? d.col + 1 : d.col;
        for (let c = Math.min(d.col, SPAWN[0]); c <= Math.max(right, SPAWN[1]); c++)
            if (this.grid[0][c])
                return null;
        if (!flat && this.grid[1][d.col])
            return null;
        const [a, b] = this.pair;
        switch (d.turn) {
            case 0: return [[0, d.col, a], [0, d.col + 1, b]];
            case 1: return [[0, d.col, a], [1, d.col, b]];
            case 2: return [[0, d.col, b], [0, d.col + 1, a]];
            default: return [[0, d.col, b], [1, d.col, a]];
        }
    }
    /** Every drop the pair can make now (a pair of one colour has only two ways round). */
    moves() {
        const out = [];
        const turns = this.pair[0] === this.pair[1] ? [0, 1] : [0, 1, 2, 3];
        for (const turn of turns)
            for (let col = 0; col < W; col++)
                if (this.entry({ col, turn }))
                    out.push({ col, turn });
        return out;
    }
    /** Drop the pair, settle the board, and say what it earned. */
    drop(col, turn = 0) {
        const res = { dropped: false, steps: 0, name: '', platforms: 0, lines: 0, cleared: 0, base: 0, mult: 0, points: 0, run: 0, vegas: false, booched: false, boardCleared: false, stages: [] };
        const cells = this.entry({ col, turn });
        if (!cells)
            return res;
        res.dropped = true;
        this.drops++;
        const a = { id: this.nextId++, c: cells[0][2] }, b = { id: this.nextId++, c: cells[1][2] };
        a.mate = b.id;
        b.mate = a.id;
        this.grid[cells[0][0]][cells[0][1]] = a;
        this.grid[cells[1][0]][cells[1][1]] = b;
        this.pair = this.next;
        this.next = this.newPair();
        let fill = 0, first = true;
        for (;;) {
            this.fall();
            fill += this.fills();
            if (first) {
                this.stage(res, 'land', []);
                first = false;
            }
            const done = this.platforms.filter((p) => p.targets.every((t) => { const x = this.grid[t.r][t.c]; return !!x && x.c === t.colour; }));
            if (done.length) {
                res.steps++;
                res.platforms += done.length;
                const ids = [];
                for (const p of done)
                    for (const t of p.targets) {
                        const x = this.grid[t.r][t.c];
                        res.base += x.fixed ? 5 : 4;
                        ids.push(x.id);
                        this.filled.delete(key(p, t));
                    }
                this.platforms = this.platforms.filter((p) => !done.includes(p));
                this.remove(ids);
                res.cleared += ids.length;
                this.stage(res, 'platform', ids);
            }
            const lines = this.lines();
            if (lines.length) {
                res.steps++;
                res.lines += lines.length;
                const cells = new Map();
                for (const l of lines)
                    for (const [r, c] of l)
                        cells.set(this.grid[r][c].id, this.grid[r][c]);
                let plain = 0;
                for (const x of cells.values())
                    if (x.fixed)
                        res.base += 5;
                    else
                        plain++;
                res.base += Math.min(4, plain) + 2 * Math.max(0, plain - 4);
                const ids = [...cells.keys()];
                this.remove(ids);
                fill += this.fills();
                res.cleared += ids.length;
                this.stage(res, 'line', ids);
            }
            if (!done.length && !lines.length)
                break;
        }
        res.name = chainName(res.steps);
        res.mult = multiplier(res.steps, this.difficulty);
        res.points = Math.floor(res.base * res.mult) + fill;
        res.run = runFor(res.steps);
        res.vegas = res.steps >= RUN.VEGAS;
        if (this.grid[0][SPAWN[0]] || this.grid[0][SPAWN[1]]) {
            res.booched = true;
            res.points -= BOOCH_PENALTY;
            this.booches++;
            this.boards = 0;
            this.difficulty = DIFFICULTY.START;
            this.deal();
        }
        else if (res.platforms && !this.platforms.length) {
            res.boardCleared = true;
            this.boards++;
            if (this.boards >= DIFFICULTY.RESET_AFTER)
                this.boards = 0;
            this.difficulty = Math.min(DIFFICULTY.MAX, DIFFICULTY.START + this.boards);
            this.deal();
        }
        this.score += res.points;
        return res;
    }
    /** Everything loose falls until it rests: a joined pair falls only when neither half is held up;
        fixed pieces never fall; nothing falls through a shelf. */
    fall() {
        for (let moved = true; moved;) {
            moved = false;
            const where = this.where();
            const seen = new Set();
            for (let r = H - 2; r >= 0; r--)
                for (let c = 0; c < W; c++) {
                    const x = this.grid[r][c];
                    if (!x || x.fixed || seen.has(x.id))
                        continue;
                    const unit = [[r, c]];
                    seen.add(x.id);
                    if (x.mate !== undefined && where.has(x.mate)) {
                        unit.push(where.get(x.mate));
                        seen.add(x.mate);
                    }
                    const ids = new Set(unit.map(([rr, cc]) => this.grid[rr][cc].id));
                    const free = unit.every(([rr, cc]) => {
                        if (rr + 1 >= H || this.shelf(rr, cc))
                            return false;
                        const below = this.grid[rr + 1][cc];
                        return !below || ids.has(below.id);
                    });
                    if (!free)
                        continue;
                    unit.sort((p, q) => q[0] - p[0]);
                    for (const [rr, cc] of unit) {
                        this.grid[rr + 1][cc] = this.grid[rr][cc];
                        this.grid[rr][cc] = null;
                    }
                    moved = true;
                }
        }
    }
    /** Where each piece is, by id. */
    where() {
        const m = new Map();
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const x = this.grid[r][c];
                if (x)
                    m.set(x.id, [r, c]);
            }
        return m;
    }
    /** Take pieces off the board; their mates come loose. */
    remove(ids) {
        const gone = new Set(ids);
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const x = this.grid[r][c];
                if (!x)
                    continue;
                if (gone.has(x.id))
                    this.grid[r][c] = null;
                else if (x.mate !== undefined && gone.has(x.mate))
                    this.grid[r][c] = { id: x.id, c: x.c };
            }
    }
    /** Targets newly filled with their colour (a point each), less those lost (a point off each). */
    fills() {
        const now = new Set();
        for (const p of this.platforms)
            for (const t of p.targets) {
                const x = this.grid[t.r][t.c];
                if (x && x.c === t.colour)
                    now.add(key(p, t));
            }
        let n = 0;
        for (const k of now)
            if (!this.filled.has(k))
                n++;
        for (const k of this.filled)
            if (!now.has(k))
                n--;
        this.filled = now;
        return n;
    }
    /** Every line of four or more of a colour, as its squares. */
    lines() {
        const out = [];
        const scan = (len, at, n) => {
            for (let i = 0; i < n; i++) {
                let run = [];
                for (let j = 0; j <= len; j++) {
                    const sq = j < len ? at(i, j) : null;
                    const x = sq ? this.grid[sq[0]][sq[1]] : null;
                    const prev = run.length ? this.grid[run[0][0]][run[0][1]] : null;
                    if (x && prev && x.c === prev.c)
                        run.push(sq);
                    else {
                        if (run.length >= 4)
                            out.push(run);
                        run = x ? [sq] : [];
                    }
                }
            }
        };
        scan(W, (r, c) => [r, c], H);
        scan(H, (c, r) => [r, c], W);
        return out;
    }
    stage(res, kind, cleared) {
        if (this.record)
            res.stages.push({ kind, cleared, grid: this.snap(), platforms: this.platforms.slice() });
    }
    /** A copy of the grid, pieces and all. */
    snap() { return this.grid.map((row) => row.map((x) => (x ? { ...x } : null))); }
    /** A copy of the whole game with its own source of numbers (what a bot imagines a drop would do). */
    copy(random) {
        const s = Object.assign(Object.create(Sailing.prototype), this);
        Object.assign(s, { grid: this.snap(), platforms: this.platforms.slice(), random, record: false, filled: new Set(this.filled) });
        return s;
    }
}
