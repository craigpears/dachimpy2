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
    fuseId = 0;
    constructor(random = Math.random) {
        this.random = random;
        this.clear();
    }
    clear() {
        this.grid = Array.from({ length: H }, () => Array(W).fill(null));
        this.falling = null;
    }
    at(r, c) { return this.grid[r]?.[c] ?? null; }
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
    /** Attack blocks decay: opaque grey, then see-through grey, then an ordinary block. */
    age() {
        for (const row of this.grid)
            for (const g of row)
                if (g?.grey) {
                    g.grey--;
                    if (!g.grey)
                        delete g.grey;
                }
    }
    /** Everything falls till it rests: loose pieces one by one, a fused block all together. */
    settle() {
        for (let moved = true; moved;) {
            moved = false;
            const done = new Set();
            for (let r = 1; r < H; r++)
                for (let c = 0; c < W; c++) {
                    const g = this.grid[r][c];
                    if (!g)
                        continue;
                    if (g.fuse === undefined) {
                        if (!this.grid[r - 1][c]) {
                            this.grid[r - 1][c] = g;
                            this.grid[r][c] = null;
                            moved = true;
                        }
                        continue;
                    }
                    if (done.has(g.fuse))
                        continue;
                    done.add(g.fuse);
                    const cells = this.fusedCells(g.fuse);
                    if (cells.every(([rr, cc]) => rr > 0 && (!this.grid[rr - 1][cc] || this.grid[rr - 1][cc].fuse === g.fuse))) {
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
            const link = { chain, broken: 0, sprinkles: 0, strikes: [] };
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
