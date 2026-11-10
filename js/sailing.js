/* Sailing, the real puzzle (YPPedia "Sailing", "Sail scoring", "Chain", "Maneuver", "Sea battle", read
   10 Nov 2026). TypeScript, compiled to js/sailing.js by `npm run build`; tested in
   tests/sailing.test.ts and played by the bots in tools/sail-bots.mjs. It knows nothing of the den:
   the den draws the board and turns what a drop earned (Sail.run) into her moves.

   Faithful to the original (RULES.md):
   - The board is 8 wide by 16 high. Row 0 is the top. Three colours: water (blue), rope (yellow),
     wind (white).
   - Pieces come in joined pairs down the two middle columns (3 and 4), the next pair shown. You steer
     the pair left and right and turn it while it falls ("increasing the falling speed does not prevent
     the pair from being moved or rotated while it is still falling"), so it can be slid in under a
     ledge. A pair stays joined after it lands (the peg between them stays, the user's screenshot, 10
     Nov): one half held up keeps the other half hanging beside it. When either half is cleared the
     other is loose and falls.
   - Platforms: rectangles with outlined targets, each wanting a colour. A platform is a shelf across
     its whole width (nothing falls through the gaps between its targets). It's done when every
     target holds a piece of its colour (the other squares may hold anything, or nothing); then the
     pieces in its targets clear and the platform goes.
   - Four or more of a colour in a row or a column clear, fixed square pieces included.
   - After a drop the board settles in turn: everything falls, lines clear (all at once), and round
     again; only when no line is left do done platforms clear (all at once), and then round again from
     what that drops, until nothing moves. Each step that clears something is a step of the chain;
     things cleared together are one step. Platforms last is the user's memory of the real game (10
     Nov: "the platforms break last. So it waits to do kind of the platform break"; a competition
     Vegas "before it's even cleared the first platform and then kind of chains down from there").
     YPPedia's "Sailing" page, under "Resolution order", says the opposite (platforms, then lines,
     each round); the user's memory wins.
   - Chain names: 2 Double, 3 Triple, 4 Bingo!, 5 Donkey!, 6 or more Vegas!!. Sailing has a real
     Vegas (unlike Bilge's, which is a combo of lines at once, Sailing's is a chain of six).
   - Scoring, for the whole cascade: in each line step the first four ordinary pieces 1 point each and
     any more 2 each; pieces cleared from platforms 4 each; fixed pieces 5 each. Times the chain, which
     counts in full up to twice the board's difficulty and by halves beyond: c, or 2d + (c - 2d) / 2,
     rounded down. A target filled with its colour is a point; a filled target lost before its
     platform clears is a point off.
   - A booch: once everything has settled, a piece in the top square of either middle column. 20
     points off, and a fresh board. Clearing every platform deals a fresh board too, a harder one.

   - Difficulty is more platforms and a little bigger (the user, 10 Nov: "you may start with 2 or 3,
     you end up with 4 or 5 and more ... boundaries, so you have to kind of navigate around them.
     Doesn't get drastically bigger"). Platforms come single or in small blocks (the screenshot).

   Not on YPPedia, so made up here (say so if it matters): the exact deal (sizes, how many targets,
   fixed pieces), how fast difficulty rises and when it resets, whether the target points are inside
   the chain's multiplier (here they're not), and turning: a pair turns about its first square, with
   no kick off a wall.

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
    /** A fresh board for the difficulty: two or three platforms at first, a couple more each level,
        a little bigger; fixed pieces from the second level. */
    deal() {
        this.clear();
        const d = this.difficulty, want = 1 + d + (this.random() < 0.5 ? 1 : 0);
        const wide = d >= 3 ? 4 : 3, high = d >= 3 ? 3 : 2;
        for (let tries = 0; this.platforms.length < want && tries < 400; tries++) {
            const w = 1 + Math.floor(this.random() * wide), h = this.random() < 0.3 ? 1 + Math.floor(this.random() * high) : 1;
            const c = Math.floor(this.random() * (W - w + 1)), r = TOP_FREE + Math.floor(this.random() * (H - TOP_FREE - h + 1));
            // Not touching another platform, so every shelf is its own.
            if (this.platforms.some((p) => r <= p.r + p.h && p.r <= r + h && c <= p.c + p.w && p.c <= c + w))
                continue;
            const targets = [];
            for (let rr = r; rr < r + h; rr++)
                for (let cc = c; cc < c + w; cc++)
                    if (this.random() < 0.85)
                        targets.push({ r: rr, c: cc, colour: Math.floor(this.random() * COLOURS) });
            if (!targets.length)
                continue;
            this.platforms.push({ id: this.nextId++, r, c, w, h, targets });
        }
        // Fixed pieces low down, never over a target (it would be shut in) nor inside a platform.
        for (let n = 0, tries = 0; n < d - 1 && tries < 100; tries++) {
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
    /** The squares the pair takes turned `turn` with its first square at (row, col), [row, col, colour]
        each (turn 0: a then b across; 1: a over b; 2: b then a; 3: b over a); null if off the board. */
    cells(row, col, turn) {
        const flat = turn === 0 || turn === 2;
        if (row < 0 || col < 0 || col > (flat ? W - 2 : W - 1) || row > (flat ? H - 1 : H - 2))
            return null;
        const [a, b] = this.pair;
        switch (turn) {
            case 0: return [[row, col, a], [row, col + 1, b]];
            case 1: return [[row, col, a], [row + 1, col, b]];
            case 2: return [[row, col, b], [row, col + 1, a]];
            default: return [[row, col, b], [row + 1, col, a]];
        }
    }
    /** Can the pair be there: on the board, its squares empty, not split by a shelf? */
    open(row, col, turn) {
        const cs = this.cells(row, col, turn);
        if (!cs || cs.some(([r, c]) => this.grid[r][c]))
            return false;
        return (turn === 0 || turn === 2) || !this.shelf(row, col);
    }
    /** Can the pair fall a row from there? */
    sinks(row, col, turn) {
        const cs = this.cells(row, col, turn);
        return cs.every(([r, c]) => r + 1 < H && !this.shelf(r, c) && (!this.grid[r + 1][c] || cs.some(([rr, cc]) => rr === r + 1 && cc === c)));
    }
    /** Where a pair dropped straight down a column comes to rest: it comes in along the top row from
        the middle columns, which must be clear all the way. Null if it can't get there. */
    straight(col, turn) {
        const flat = turn === 0 || turn === 2;
        if (!this.cells(0, col, turn))
            return null;
        for (let c = Math.min(col, SPAWN[0]); c <= Math.max(flat ? col + 1 : col, SPAWN[1]); c++)
            if (this.grid[0][c])
                return null;
        if (!this.open(0, col, turn))
            return null;
        let row = 0;
        while (this.sinks(row, col, turn))
            row++;
        return { col, turn, row };
    }
    /** Every place the pair can be steered to and come to rest, sliding and turning as it falls from
        the middle columns (a pair of one colour has only two ways round). */
    moves() {
        const out = [];
        if (!this.open(0, SPAWN[0], 0))
            return out;
        const same = this.pair[0] === this.pair[1];
        const seen = new Set(), todo = [[0, SPAWN[0], 0]];
        const id = (r, c, t) => (r * W + c) * 4 + t;
        seen.add(id(0, SPAWN[0], 0));
        while (todo.length) {
            const [r, c, t] = todo.pop();
            const falls = this.sinks(r, c, t);
            if (!falls && !(same && t >= 2))
                out.push({ col: c, turn: t, row: r });
            const next = [[r, c - 1, t], [r, c + 1, t], [r, c, ((t + 1) % 4)], [r, c, ((t + 3) % 4)]];
            if (falls)
                next.push([r + 1, c, t]);
            for (const [nr, nc, nt] of next) {
                const k = id(nr, nc, nt);
                if (nc < 0 || nc >= W || seen.has(k) || !this.open(nr, nc, nt))
                    continue;
                seen.add(k);
                todo.push([nr, nc, nt]);
            }
        }
        return out.sort((p, q) => p.turn - q.turn || p.col - q.col || p.row - q.row);
    }
    /** Drop the pair, settle the board, and say what it earned. Without a row, it's dropped straight
        down the column; with one, it must be a place it can be steered to (moves()). */
    drop(col, turn = 0, row) {
        const res = { dropped: false, steps: 0, name: '', platforms: 0, lines: 0, cleared: 0, base: 0, mult: 0, points: 0, run: 0, vegas: false, booched: false, boardCleared: false, stages: [] };
        const at = row === undefined ? this.straight(col, turn) : this.moves().find((m) => m.col === col && m.turn === turn && m.row === row);
        if (!at)
            return res;
        const cells = this.cells(at.row, col, turn);
        res.dropped = true;
        this.drops++;
        const a = { id: this.nextId++, c: cells[0][2] }, b = { id: this.nextId++, c: cells[1][2] };
        a.mate = b.id;
        b.mate = a.id;
        this.grid[cells[0][0]][cells[0][1]] = a;
        this.grid[cells[1][0]][cells[1][1]] = b;
        this.pair = this.next;
        this.next = this.newPair();
        // Lines first, round and round; platforms only once no line is left, then round again.
        let fill = 0, first = true;
        for (;;) {
            this.fall();
            fill += this.fills();
            if (first) {
                this.stage(res, 'land', []);
                first = false;
            }
            const lines = this.lines();
            if (lines.length) {
                res.steps++;
                res.lines += lines.length;
                const cs = new Map();
                for (const l of lines)
                    for (const [r, c] of l)
                        cs.set(this.grid[r][c].id, this.grid[r][c]);
                let plain = 0;
                for (const x of cs.values())
                    if (x.fixed)
                        res.base += 5;
                    else
                        plain++;
                res.base += Math.min(4, plain) + 2 * Math.max(0, plain - 4);
                const ids = [...cs.keys()];
                this.remove(ids);
                fill += this.fills();
                res.cleared += ids.length;
                this.stage(res, 'line', ids);
                continue;
            }
            const done = this.platforms.filter((p) => p.targets.every((t) => { const x = this.grid[t.r][t.c]; return !!x && x.c === t.colour; }));
            if (!done.length)
                break;
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
