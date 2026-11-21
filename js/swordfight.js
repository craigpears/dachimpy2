/* Swordfight, the real puzzle (YPPedia "Swordfight", read 8 Nov 2026). TypeScript, compiled to
   js/swordfight.js by `npm run build`; tested in tests/swordfight.test.ts. It knows nothing of the
   den: the den hands it pairs and sprinkles, and turns what it sends back into soldiers.

   Every puzzle stays faithful to the original (RULES.md): the board, the pieces, fusing, breaking,
   chains and what a break sends are the real rules. Only where the pairs come from is the den's. */
export const COLOURS = ['red', 'yellow', 'green', 'blue'];
/** The board: 6 wide by 13 high. Pairs come in at the top of the fourth column. */
export const W = 6, H = 13, ENTRY = 3;
/** Where the second piece of the pair sits from the first, for each way round: above, right, below, left. */
const ROT = [[1, 0], [0, 1], [-1, 0], [0, -1]];
/** A random pair. Breakers come about one piece in five (the real puzzle's sword drop patterns
    aren't published in full; the den's raiders all fight with the same plain cutlass). */
export function randomPair(random = Math.random, breakerOdds = 0.2) {
    const one = () => ({ c: Math.floor(random() * 4), breaker: random() < breakerOdds });
    return [one(), one()];
}
/** A fused block turned into the sword it sends. A chain multiplies the block's longest side first
    (its height when square). Square or tall blocks send upright swords, wide ones sideways swords,
    at most three across: a 2x2 sends a 1x4, a 3x3 a 2x4, a 5x5 a 3x7, a 5 wide by 4 high a 6x3. */
export function toSword(w, h, chain = 1) {
    if (h >= w)
        h *= chain;
    else
        w *= chain;
    if (w <= h) {
        if (w === 2 && h === 2)
            return { w: 1, h: 4, vertical: true };
        if (w === 3 && h === 3)
            return { w: 2, h: 4, vertical: true };
        if (w > 3) {
            h += w - 3;
            w = 3;
        }
        return { w, h, vertical: true };
    }
    if (h > 3) {
        w += h - 3;
        h = 3;
    }
    return { w, h, vertical: false };
}
export class Board {
    random;
    /** grid[row][col], row 0 at the bottom. */
    grid = [];
    /** The pair you're moving: the first piece at (r, c), the second next to it, `rot` round. */
    falling = null;
    fuseId = 0; // (a sword's id comes from it too)
    constructor(random = Math.random) {
        this.random = random;
        this.clear();
    }
    /** A copy to try moves on (a bot's), sharing nothing with this one. */
    clone() {
        const b = new Board(this.random);
        b.grid = this.grid.map((row) => row.map((g) => (g ? { ...g } : null)));
        b.falling = this.falling ? { ...this.falling, pair: this.falling.pair.map((p) => ({ ...p })) } : null;
        b.fuseId = this.fuseId;
        return b;
    }
    /** How high column c is stacked: the row its next piece would land in. */
    height(c) {
        let r = H;
        while (r > 0 && !this.grid[r - 1][c])
            r--;
        return r;
    }
    clear() {
        this.grid = Array.from({ length: H }, () => Array(W).fill(null));
        this.falling = null;
    }
    at(r, c) { return this.grid[r]?.[c] ?? null; }
    /** Every piece on the board where it stands now, bottom row first. */
    snap() {
        const out = [];
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const g = this.grid[r][c];
                if (g)
                    out.push(g.fuse === undefined ? { g, r, c } : { g, r, c, fuse: g.fuse });
            }
        return out;
    }
    open(r, c) { return c >= 0 && c < W && r >= 0 && r < H && !this.grid[r][c]; }
    /** The squares the falling pair covers: the first piece's, then the second's. */
    fallingCells(f = this.falling) {
        if (!f)
            return [];
        const [dr, dc] = ROT[f.rot];
        return [[f.r, f.c], [f.r + dr, f.c + dc]];
    }
    fits(r, c, rot) {
        const [dr, dc] = ROT[rot];
        return this.open(r, c) && this.open(r + dr, c + dc);
    }
    /** How full the fourth column is: you lose when no pair can come in at its top. */
    get lost() { return !this.open(H - 1, ENTRY) || !this.open(H - 2, ENTRY); }
    /** A new pair at the top of the fourth column, the second piece on top. False if it can't come in: lost. */
    spawn(pair) {
        if (this.lost)
            return false;
        this.falling = { pair, r: H - 2, c: ENTRY, rot: 0 };
        return true;
    }
    move(dc) {
        const f = this.falling;
        if (!f || !this.fits(f.r, f.c + dc, f.rot))
            return false;
        f.c += dc;
        return true;
    }
    /** Turn the pair a quarter (1 clockwise, -1 the other way). Against a side or a stack, it shifts
        over to make room, as in the real puzzle. */
    rotate(dir) {
        const f = this.falling;
        if (!f)
            return false;
        const rot = (f.rot + dir + 4) % 4, [dr, dc] = ROT[rot];
        for (const [mr, mc] of [[0, 0], [-dr, -dc]]) {
            if (this.fits(f.r + mr, f.c + mc, rot)) {
                f.r += mr;
                f.c += mc;
                f.rot = rot;
                return true;
            }
        }
        return false;
    }
    /** One row down on the timer. Null while it's still falling; what happened when it lands. */
    step() {
        const f = this.falling;
        if (!f)
            return null;
        if (this.fits(f.r - 1, f.c, f.rot)) {
            f.r--;
            return null;
        }
        return this.lock();
    }
    /** Straight down. */
    drop() {
        const f = this.falling;
        if (!f)
            return { links: [], sprinkles: 0, strikes: [] };
        while (this.fits(f.r - 1, f.c, f.rot))
            f.r--;
        return this.lock();
    }
    /** The pair lands: attack blocks get a turn older, both pieces fall as far as they go (each on its
        own), and anything that breaks, breaks. */
    lock() {
        const f = this.falling;
        this.falling = null;
        this.age();
        this.fallingCells(f).forEach(([r, c], i) => {
            const p = f.pair[i];
            this.grid[r][c] = { c: p.c, breaker: p.breaker || undefined };
        });
        this.settle();
        return this.resolve();
    }
    /** Attack blocks decay: a sword's picture, then opaque grey, then see-through grey, then an ordinary block. */
    age() {
        for (const row of this.grid)
            for (const g of row)
                if (g?.grey) {
                    g.grey--;
                    if (g.grey < 3)
                        delete g.sword;
                    if (!g.grey)
                        delete g.grey;
                }
    }
    /** Everything falls till it rests: loose pieces one by one, a fused block (or a sword just landed) all together. */
    settle() {
        const unitOf = (g) => (g.fuse !== undefined ? `f${g.fuse}` : g.sword !== undefined ? `s${g.sword}` : null);
        for (let moved = true; moved;) {
            moved = false;
            const done = new Set();
            for (let r = 1; r < H; r++)
                for (let c = 0; c < W; c++) {
                    const g = this.grid[r][c];
                    if (!g)
                        continue;
                    const unit = unitOf(g);
                    if (!unit) {
                        if (!this.grid[r - 1][c]) {
                            this.grid[r - 1][c] = g;
                            this.grid[r][c] = null;
                            moved = true;
                        }
                        continue;
                    }
                    if (done.has(unit))
                        continue;
                    done.add(unit);
                    const cells = [];
                    for (let rr = 0; rr < H; rr++)
                        for (let cc = 0; cc < W; cc++) {
                            const o = this.grid[rr][cc];
                            if (o && unitOf(o) === unit)
                                cells.push([rr, cc]);
                        }
                    const mine = (o) => !o || unitOf(o) === unit;
                    if (cells.every(([rr, cc]) => rr > 0 && mine(this.grid[rr - 1][cc]))) {
                        for (const [rr, cc] of cells) {
                            this.grid[rr - 1][cc] = this.grid[rr][cc];
                            this.grid[rr][cc] = null;
                        }
                        moved = true;
                    }
                }
        }
    }
    fusedCells(id) {
        const out = [];
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++)
                if (this.grid[r][c]?.fuse === id)
                    out.push([r, c]);
        return out;
    }
    /** A fused block's corner and size. */
    fusedBox(id) {
        const cells = this.fusedCells(id), rs = cells.map((x) => x[0]), cs = cells.map((x) => x[1]);
        const r0 = Math.min(...rs), c0 = Math.min(...cs);
        return { r0, c0, w: Math.max(...cs) - c0 + 1, h: Math.max(...rs) - r0 + 1 };
    }
    /** Fused blocks: each id once. */
    fusedIds() {
        const s = new Set();
        for (const row of this.grid)
            for (const g of row)
                if (g?.fuse !== undefined)
                    s.add(g.fuse);
        return [...s];
    }
    /** A plain block, not part of a fused one, of colour c: free to fuse. */
    loose(r, c, col) {
        const g = this.at(r, c);
        return !!g && g.c === col && !g.breaker && !g.grey && g.fuse === undefined;
    }
    /** Blocks of one colour two by two or bigger fuse into one big block. A fused block grows by a
        whole row or column of its colour alongside it; otherwise the biggest new rectangles go first. */
    fuse() {
        for (let grew = true; grew;) {
            grew = false;
            for (const id of this.fusedIds()) {
                const b = this.fusedBox(id), col = this.at(b.r0, b.c0).c;
                const sides = [
                    [b.r0 + b.h, b.c0, 1, b.w], [b.r0 - 1, b.c0, 1, b.w], [b.r0, b.c0 - 1, b.h, 1], [b.r0, b.c0 + b.w, b.h, 1],
                ];
                for (const [r0, c0, h, w] of sides) {
                    let all = true;
                    for (let r = r0; r < r0 + h && all; r++)
                        for (let c = c0; c < c0 + w && all; c++)
                            all = this.loose(r, c, col);
                    if (!all)
                        continue;
                    for (let r = r0; r < r0 + h; r++)
                        for (let c = c0; c < c0 + w; c++)
                            this.grid[r][c].fuse = id;
                    grew = true;
                    break;
                }
            }
        }
        for (;;) {
            let best = null;
            for (let r0 = 0; r0 < H; r0++)
                for (let c0 = 0; c0 < W; c0++) {
                    const g = this.at(r0, c0);
                    if (!g || !this.loose(r0, c0, g.c))
                        continue;
                    let maxW = W - c0;
                    for (let h = 1; r0 + h <= H; h++) {
                        let w = 0;
                        while (w < maxW && this.loose(r0 + h - 1, c0 + w, g.c))
                            w++;
                        if (!w)
                            break;
                        maxW = w;
                        if (w >= 2 && h >= 2 && (!best || w * h > best.w * best.h))
                            best = { r0, c0, w, h };
                    }
                }
            if (!best)
                return;
            const id = ++this.fuseId;
            for (let r = best.r0; r < best.r0 + best.h; r++)
                for (let c = best.c0; c < best.c0 + best.w; c++)
                    this.grid[r][c].fuse = id;
        }
    }
    /** Breakers touching their colour shatter everything of that colour they're connected to (side by
        side or one above the other, not diagonally; attack blocks don't count till they've turned).
        What falls into place can set off more: a chain, each link multiplying what it sends. */
    resolve() {
        const res = { links: [], sprinkles: 0, strikes: [] };
        const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const live = (r, c, col) => { const g = this.at(r, c); return !!g && g.c === col && !g.grey; };
        for (let chain = 1;; chain++) {
            this.fuse();
            const seen = new Set(), regions = [];
            for (let r = 0; r < H; r++)
                for (let c = 0; c < W; c++) {
                    const g = this.grid[r][c];
                    if (!g?.breaker || g.grey || seen.has(`${r},${c}`))
                        continue;
                    if (!N.some(([dr, dc]) => live(r + dr, c + dc, g.c)))
                        continue;
                    const region = [], todo = [[r, c]];
                    seen.add(`${r},${c}`);
                    while (todo.length) {
                        const [cr, cc] = todo.pop();
                        region.push([cr, cc]);
                        for (const [dr, dc] of N) {
                            const nr = cr + dr, nc = cc + dc, key = `${nr},${nc}`;
                            if (!seen.has(key) && live(nr, nc, g.c)) {
                                seen.add(key);
                                todo.push([nr, nc]);
                            }
                        }
                    }
                    regions.push(region);
                }
            if (!regions.length)
                return res;
            const link = { chain, broken: 0, sprinkles: 0, strikes: [], before: this.snap() };
            for (const region of regions) {
                // One sprinkle for every two loose pieces broken (rounded down), counted region by region;
                // a sword for each fused block.
                const fused = new Set();
                let loose = 0;
                for (const [r, c] of region) {
                    const g = this.grid[r][c];
                    if (g.fuse === undefined)
                        loose++;
                    else
                        fused.add(g.fuse);
                }
                link.sprinkles += Math.floor(loose / 2) * chain;
                for (const id of fused) {
                    const b = this.fusedBox(id);
                    link.strikes.push(toSword(b.w, b.h, chain));
                }
                link.broken += region.length;
                for (const [r, c] of region)
                    this.grid[r][c] = null;
            }
            res.links.push(link);
            res.sprinkles += link.sprinkles;
            res.strikes.push(...link.strikes);
            this.settle();
        }
    }
    /** A duel's attack from the other side coming in, by Puzzle Pirates' rules (SWORDFIGHT.md §2-5): its swords
        in the order they broke, then its sprinkles, coloured by the attacker's drop pattern. `aim` is the duel's
        queues, shared by both sides. Says where everything went. */
    take(a, aim) {
        const out = { swords: [], sprinkles: [], wasted: 0 };
        for (const s of a.strikes) {
            const k = aim.swords++, right = k % 2 === 0;
            const got = (!s.vertical && this.sideways(s, right, a.pattern)) || this.upright(s.vertical ? s.w : s.h, s.vertical ? s.h : s.w, k, right, a.pattern);
            if (got) {
                out.swords.push(got);
                out.wasted += got.wasted;
                this.settle();
            }
            else
                out.wasted += s.w * s.h;
        }
        if (a.sprinkles > 0) {
            const right = aim.sprinkles++ % 2 === 0, layer = Array(W).fill(0);
            for (let i = 0; i < a.sprinkles; i++) {
                const c = right ? W - 1 - (i % W) : i % W, r = this.height(c);
                // A full column wastes it; the fourth takes them only 10 high, so sprinkles can't knock anyone out.
                if (r >= (c === ENTRY ? SPRINKLE_TOP : H)) {
                    out.wasted++;
                    continue;
                }
                this.grid[r][c] = { c: a.pattern[layer[c]++ % 2][c], grey: 2 };
                out.sprinkles.push([r, c]);
            }
        }
        this.settle();
        return out;
    }
    /** An upright sword w wide and h long, the k-th of the duel: aimed at the k-th of the columns it fits in,
        starting from the second, moving over (its hand's way first) to keep out of the fourth column and off other
        swords and to fit whole, else where most of it fits; null if it fits nowhere: wasted. */
    upright(w, h, k, right, pattern) {
        const lefts = W - w + 1, at = (1 + k) % lefts, order = [at];
        const one = (d) => { for (let c = at + d; c >= 0 && c < lefts; c += d)
            order.push(c); };
        if (right) {
            one(1);
            one(-1);
        }
        else {
            one(-1);
            one(1);
        }
        const tries = order.map((c0) => {
            let base = 0;
            for (let c = c0; c < c0 + w; c++)
                base = Math.max(base, this.height(c));
            const cols = Array.from({ length: w }, (_, i) => c0 + i);
            return {
                c0, base, fits: Math.max(0, Math.min(h, H - base)),
                clear: !(c0 <= ENTRY && ENTRY < c0 + w),
                onSword: base > 0 && cols.some((c) => this.grid[base - 1][c]?.sword !== undefined),
            };
        }).filter((t) => !t.onSword && t.fits > 0);
        const most = (ts) => ts.reduce((b, t) => (!b || t.fits > b.fits ? t : b), null);
        const clear = tries.filter((t) => t.clear);
        const pick = clear.find((t) => t.fits === h) ?? most(clear) ?? tries.find((t) => t.fits === h) ?? most(tries);
        if (!pick)
            return null;
        const id = ++this.fuseId, cells = [];
        for (let j = 0; j < pick.fits; j++)
            for (let i = 0; i < w; i++) {
                const r = pick.base + j, c = pick.c0 + i;
                this.grid[r][c] = { c: pattern[patternRow(j, pattern.length)][c], grey: 3, sword: id };
                cells.push([r, c]);
            }
        return { cells, vertical: true, wasted: (h - pick.fits) * w };
    }
    /** A sideways sword s (s.w its length, s.h the rows it covers) coming in from its hand's side, at the height
        the rules give, as far in as it goes; failing that, the other side, then lower, then higher. Null if at
        least half of it can't get in anywhere: it comes in upright instead. */
    sideways(s, right, pattern) {
        const n = s.h, len = s.w;
        // Its top row: two below the highest piece; with fused blocks (or a sword) on the board, three below the
        // bottom of the lowest. Never in the top row.
        let gemBottom = Infinity, high = 0;
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const g = this.grid[r][c];
                if (!g)
                    continue;
                high = Math.max(high, r + 1);
                if (g.fuse !== undefined || g.sword !== undefined)
                    gemBottom = Math.min(gemBottom, r + 1);
            }
        let top = gemBottom < Infinity ? gemBottom - 3 : high >= H ? n : high - 2;
        top = Math.min(Math.max(top, n), H - 1) - 1; // (0-based)
        const heights = [top];
        for (let t = top - 1; t >= n - 1; t--)
            heights.push(t);
        for (let t = top + 1; t <= H - 2; t++)
            heights.push(t);
        for (const t of heights)
            for (const fromRight of [right, !right]) {
                let inn = Math.min(len, W);
                for (let r = t - n + 1; r <= t; r++) {
                    let run = 0;
                    while (run < inn && !this.grid[r][fromRight ? W - 1 - run : run])
                        run++;
                    inn = run;
                }
                if (inn * 2 <= len)
                    continue;
                const id = ++this.fuseId, cells = [];
                for (let ti = 0; ti < n; ti++)
                    for (let i = 0; i < inn; i++) {
                        // The pattern on its side: from the left its top row is the pattern's first column, read from the
                        // pattern's bottom row inward; from the right, mirrored.
                        const r = t - ti, c = fromRight ? W - 1 - i : i;
                        this.grid[r][c] = { c: pattern[patternRow(i, pattern.length)][fromRight ? W - 1 - ti : ti], grey: 3, sword: id };
                        cells.push([r, c]);
                    }
                return { cells, vertical: false, from: fromRight ? 'right' : 'left', wasted: (len - inn) * n };
            }
        return null;
    }
    /** Attack blocks from the other side: grey blocks dropped in across the columns, never into the
        top of the fourth (sprinkles can't knock you out). Returns how many found room. */
    receive(sprinkles) {
        let put = 0, c = Math.floor(this.random() * W);
        const pair = this.fallingCells();
        for (let tries = 0; put < sprinkles && tries < sprinkles * W + W; tries++, c = (c + 1) % W) {
            let r = 0;
            while (r < H && this.grid[r][c])
                r++;
            if (r >= H || (c === ENTRY && r >= H - 2) || pair.some(([pr, pc]) => pc === c && pr <= r))
                continue;
            this.grid[r][c] = { c: Math.floor(this.random() * 4), grey: 2 };
            put++;
        }
        return put;
    }
}
/** The highest a sprinkle stacks the fourth column. */
export const SPRINKLE_TOP = 10;
/** A sword's pattern, written as Mantid's tool shows it, top row first, a row a word of r y g b. */
const pattern = (s) => s.split(' ').reverse().map((row) => [...row].map((ch) => 'rygb'.indexOf(ch)));
/** Every sword's drop pattern, in red/red enamel (Mantid's Sword Patterns, read 21 Nov 2026; SWORDFIGHT.md §7). */
export const SWORDS = {
    cutlass: pattern('rrggyy bbbygg ggbbrr ggbbrr yygbbr yyggbb'),
    rapier: pattern('ygrybr rgbgby rrbgyy gggbbb rggbby rrgbyy'),
    foil: pattern('ggbbyy ggbbyy rrggbb rrggbb'),
    falchion: pattern('yyggrr ybbgbr rbgbby rrggyy'),
    'skull dagger': pattern('ggyrgg gbyrbg gbyrbg bbyrbb byggrb'),
    stiletto: pattern('bbyrgg brgbyg brbgyg bbrygg'),
    'long sword': pattern('bbrryy bggggy ybrryb ybrryb bbggyy bbrryy'),
    saber: pattern('gbbrry gggyyy gggyyy grrbby brrbbb bbbrrb'),
    stick: pattern('yrbbgy rrbbgg rrbbgg'),
    backsword: pattern('ggrbyy grrbby grgyby rggyyb'),
    cleaver: pattern('ggybyy gyyyby ggbyyb rbbryy rrgyry rggyyr'),
    dadao: pattern('grgrgr rggrrg ybybyb byybby rrgggg rrrrgg'),
    dirk: pattern('bbggyy bbggyy bggrry bbrryy rrrrry'),
    katana: pattern('grrggr rggrrg ybbyyb byybby rrggrr rrggrr'),
    poniard: pattern('yyrbgg gyrbgy ggrbyy ggrbyy grrbby rgrbyb'),
    scimitar: pattern('grrrry gggyyy brgyrb bbgybb'),
    'short sword': pattern('ggbbyy ggbbyy rrggbb rbggyb'),
};
/** Which of a pattern's rows (of n) a sword's j-th row from its bottom takes: row for row, then round the top four
    again (a pattern under four rows tall, round all of it). */
export function patternRow(j, n) {
    if (j < n)
        return j;
    return n < 4 ? j % n : n - 4 + ((j - n) % 4);
}
/** The queues every sword and sprinkle of a duel moves on, shared by both sides (SWORDFIGHT.md §3, §5): how many
    swords have come in so far (the column each aims at, and its hand), and how many sprinkle attacks (their side). */
export class Aim {
    swords = 0;
    sprinkles = 0;
}
/** A duel's pace: seconds for a pair to fall a row (the den's armoury pace, SWORD.FALL). */
export const DUEL = { FALL: 0.6 };
/** A Swordfight duel, knowing nothing of how it's drawn or who plays it: two boards dealt the same pairs, each pair
    landing sending its breaks at the other side, and the first side whose fourth column fills losing. Randomness
    (the pairs, and nothing else) is handed in. */
export class Duel {
    sides;
    aim = new Aim();
    /** The side that won, once one side's lost. */
    winner = null;
    pairs = [];
    constructor(opts = {}) {
        const random = opts.random ?? Math.random, swords = opts.swords ?? [SWORDS.cutlass, SWORDS.cutlass];
        this.deal = () => randomPair(random, opts.breakerOdds);
        const side = (sword) => ({ board: new Board(random), sword, incoming: [], dealt: 0, t: 0, sent: { sprinkles: 0, squares: 0 } });
        this.sides = [side(swords[0]), side(swords[1])];
    }
    deal;
    /** The n-th pair of the duel, the same for both sides. */
    pair(n) {
        while (this.pairs.length <= n)
            this.pairs.push(this.deal());
        return this.pairs[n];
    }
    get over() { return this.winner !== null; }
    /** A side's next pair comes in, if it has none falling. False if it can't: that side has lost. */
    spawn(i) {
        const s = this.sides[i];
        if (s.board.falling)
            return true;
        if (s.board.spawn(this.pair(s.dealt))) {
            s.dealt++;
            s.t = 0;
            return true;
        }
        this.winner = (1 - i);
        return false;
    }
    /** Time goes by: each side's pair comes in, and falls a row every DUEL.FALL seconds. What landed, in order. */
    update(dt) {
        const out = [];
        for (const i of [0, 1]) {
            if (this.over || !this.spawn(i))
                continue;
            const s = this.sides[i];
            s.t += dt;
            while (!this.over && s.t >= DUEL.FALL) {
                s.t -= DUEL.FALL;
                const res = s.board.step();
                if (res) {
                    out.push(this.landed(i, res));
                    if (!this.spawn(i))
                        break;
                }
            }
        }
        return out;
    }
    /** A side's pair straight down. */
    drop(i) {
        if (this.over || !this.sides[i].board.falling)
            return null;
        const turn = this.landed(i, this.sides[i].board.drop());
        this.spawn(i);
        return turn;
    }
    /** A side's pair landed: what waited for it comes in, and what it broke goes to the other side. */
    landed(i, result) {
        const me = this.sides[i], them = this.sides[1 - i];
        const landed = me.incoming.map((a) => me.board.take(a, this.aim));
        me.incoming = [];
        let sent = null;
        if (result.sprinkles || result.strikes.length) {
            sent = { sprinkles: result.sprinkles, strikes: result.strikes, pattern: me.sword };
            them.incoming.push(sent);
            me.sent.sprinkles += result.sprinkles;
            me.sent.squares += result.strikes.reduce((n, s) => n + s.w * s.h, 0);
        }
        const lost = me.board.lost;
        if (lost)
            this.winner = (1 - i);
        return { side: i, result, sent, landed, lost };
    }
}
/** A seeded random, for a duel to be dealt again from its address (?seed=). */
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
