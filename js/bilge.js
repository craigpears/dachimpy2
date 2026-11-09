/* Bilge, the real puzzle (YPPedia "Bilging", read 9 Nov 2026). TypeScript, compiled to js/bilge.js
   by `npm run build`; tested in tests/bilge.test.ts. It knows nothing of the den: the den lays the
   board in the shallows, sets the water and turns what a move clears into the tide going out.

   Every puzzle stays faithful to the original (RULES.md):
   - The board is 6 wide by 12 high, seven kinds of piece. Row 0 is the top.
   - A two-piece cursor swaps two pieces side by side. Any swap is allowed, one that clears nothing
     too (it's still a move).
   - Three or more of a kind in a row or a column clear. Pieces float up into the gap and new ones
     come in at the bottom; anything they line up clears too (a chain).
   - The water: at least three rows, and the top three rows always dry.
   - Crabs can't be moved; they're cleared when they rise out of the water, a bonus.
   - A pufferfish swapped with another piece blows up: it and the eight round it are cleared (a crab
     cleared that way is no bonus). Two pufferfish just swap.
   - A jellyfish swapped with an ordinary piece clears every piece of that kind. It does nothing
     with a crab; with a pufferfish the pufferfish goes off first; two jellyfish just swap.
   - What a move clears has a name: Good, Great, Arrr!, Har!, Yarrr!, Bingo!, Sea Donkey!, Vegas!. */
export const W = 6, H = 12, KINDS = 7;
/** The water: never less than three rows, and the top three rows always dry. */
export const MIN_WATER = 3, MAX_WATER = H - 3;
export const NO_SPECIALS = { puffer: 0, crab: 0, jelly: 0 };
/** The name for the lines a move makes. A line of five or more counts as five. */
export function comboName(lines) {
    const ls = lines.map((n) => Math.min(5, n)).sort((a, b) => a - b), n = ls.length, five = ls.includes(5);
    if (n === 0)
        return '';
    if (n === 1)
        return ls[0] === 4 ? 'Good' : ls[0] >= 5 ? 'Great' : '';
    if (n === 2)
        return five ? 'Yarrr!' : ls[0] === 4 ? 'Har!' : 'Arrr!';
    if (n === 3)
        return 'Bingo!';
    return five ? 'Vegas!' : 'Sea Donkey!';
}
const isPlain = (b) => !!b && !b.s;
export class Bilge {
    random;
    /** grid[row][col], row 0 at the top. */
    grid = [];
    /** Rows of water at the bottom (it needn't be whole: the den's tide comes and goes smoothly). */
    water = MIN_WATER;
    odds;
    nextId = 1;
    constructor(random = Math.random, odds = NO_SPECIALS) {
        this.random = random;
        this.odds = odds;
        this.fill();
    }
    /** A fresh board of ordinary pieces with nothing lined up. */
    fill() {
        this.grid = Array.from({ length: H }, () => Array(W).fill(null));
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                let k;
                do
                    k = Math.floor(this.random() * KINDS);
                while ((c >= 2 && this.kindAt(r, c - 1) === k && this.kindAt(r, c - 2) === k) || (r >= 2 && this.kindAt(r - 1, c) === k && this.kindAt(r - 2, c) === k));
                this.grid[r][c] = { id: this.nextId++, k };
            }
    }
    /** Is this row out of the water? */
    dry(r) { return r + 0.5 < H - this.water; }
    kindAt(r, c) {
        const b = this.grid[r]?.[c];
        return isPlain(b) ? b.k : -1;
    }
    /** A new piece coming in at the bottom. */
    fresh() {
        const x = this.random(), o = this.odds;
        if (x < o.crab)
            return { id: this.nextId++, k: -1, s: 'crab' };
        if (x < o.crab + o.puffer)
            return { id: this.nextId++, k: -1, s: 'puffer' };
        if (x < o.crab + o.puffer + o.jelly)
            return { id: this.nextId++, k: -1, s: 'jelly' };
        return { id: this.nextId++, k: Math.floor(this.random() * KINDS) };
    }
    /** Every line of three or more lined up now: its squares and its length. */
    lines() {
        const out = [];
        const run = (cells) => { if (cells.length >= 3)
            out.push({ cells, n: cells.length }); };
        for (let r = 0; r < H; r++) {
            let cur = [];
            for (let c = 0; c < W; c++) {
                if (cur.length && this.kindAt(r, c) === this.kindAt(cur[0][0], cur[0][1]) && this.kindAt(r, c) >= 0)
                    cur.push([r, c]);
                else {
                    run(cur);
                    cur = this.kindAt(r, c) >= 0 ? [[r, c]] : [];
                }
            }
            run(cur);
        }
        for (let c = 0; c < W; c++) {
            let cur = [];
            for (let r = 0; r < H; r++) {
                if (cur.length && this.kindAt(r, c) === this.kindAt(cur[0][0], cur[0][1]) && this.kindAt(r, c) >= 0)
                    cur.push([r, c]);
                else {
                    run(cur);
                    cur = this.kindAt(r, c) >= 0 ? [[r, c]] : [];
                }
            }
            run(cur);
        }
        return out;
    }
    /** Swap the pieces at (r, c) and (r, c + 1), and everything that follows. */
    swap(r, c) {
        const res = { moved: false, lines: [], combo: '', cleared: 0, chain: 0, crabs: 0, puffer: false, jelly: false, stages: [] };
        if (r < 0 || r >= H || c < 0 || c >= W - 1)
            return res;
        const a = this.grid[r][c], b = this.grid[r][c + 1];
        if (!a || !b || a.s === 'crab' || b.s === 'crab')
            return res;
        res.moved = true;
        const gone = new Set();
        if ((a.s === 'puffer') !== (b.s === 'puffer')) {
            // The pufferfish goes off where it is: it and the eight round it.
            res.puffer = true;
            const pc = a.s === 'puffer' ? c : c + 1;
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++)
                    if (this.grid[r + dr]?.[pc + dc])
                        gone.add(`${r + dr},${pc + dc}`);
        }
        else if ((a.s === 'jelly') !== (b.s === 'jelly') && !(a.s === 'jelly' ? b : a).s) {
            // Every piece of the other one's kind, and the jellyfish.
            res.jelly = true;
            const k = (a.s === 'jelly' ? b : a).k;
            gone.add(`${r},${a.s === 'jelly' ? c : c + 1}`);
            for (let rr = 0; rr < H; rr++)
                for (let cc = 0; cc < W; cc++)
                    if (this.kindAt(rr, cc) === k)
                        gone.add(`${rr},${cc}`);
        }
        else {
            this.grid[r][c] = b;
            this.grid[r][c + 1] = a;
            const ls = this.lines();
            res.lines = ls.map((l) => l.n);
            res.combo = comboName(res.lines);
            for (const l of ls)
                for (const [rr, cc] of l.cells)
                    gone.add(`${rr},${cc}`);
            res.stages.push({ cleared: [], grid: this.snap() }); // the swap itself
        }
        let first = true;
        while (gone.size) {
            const ids = [];
            for (const key of gone) {
                const [rr, cc] = key.split(',').map(Number);
                const bit = this.grid[rr][cc];
                if (bit) {
                    ids.push(bit.id);
                    this.grid[rr][cc] = null;
                }
            }
            res.cleared += ids.length;
            if (!first)
                res.chain++;
            first = false;
            this.rise();
            res.stages.push({ cleared: ids, grid: this.snap() });
            // Crabs up out of the water are cleared too (a bonus), and the rest float up after them.
            let freed = this.freeCrabs();
            while (freed.length) {
                res.crabs += freed.length;
                this.rise();
                res.stages.push({ cleared: freed, grid: this.snap() });
                freed = this.freeCrabs();
            }
            gone.clear();
            for (const l of this.lines())
                for (const [rr, cc] of l.cells)
                    gone.add(`${rr},${cc}`);
        }
        return res;
    }
    /** Everything floats up into the gaps; new pieces come in at the bottom. */
    rise() {
        for (let c = 0; c < W; c++) {
            const col = [];
            for (let r = 0; r < H; r++) {
                const b = this.grid[r][c];
                if (b)
                    col.push(b);
            }
            for (let r = 0; r < H; r++)
                this.grid[r][c] = r < col.length ? col[r] : this.fresh();
        }
    }
    freeCrabs() {
        const ids = [];
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const b = this.grid[r][c];
                if (b?.s === 'crab' && this.dry(r)) {
                    ids.push(b.id);
                    this.grid[r][c] = null;
                }
            }
        return ids;
    }
    snap() { return this.grid.map((row) => row.slice()); }
}
