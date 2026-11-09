/* Treasure Haul, the real puzzle (YPPedia "Treasure Haul" and the official "Official:Treasure Haul",
   read 9 Nov 2026, and the wiki's screenshots of the board). TypeScript, compiled to
   js/treasure-haul.js by `npm run build`; tested in tests/treasure-haul.test.ts. It knows nothing of
   the den: the den says what's down there to haul and how long you've got, and shows what comes up.

   Every puzzle stays faithful to the original (RULES.md):
   - The board is 8 by 8, four kinds of coin (green, silver, gold, bronze). Row 0 is the top.
   - The cursor covers two squares one above the other and swaps them (arrow keys and Space, or a
     click). Any swap is allowed, one that clears nothing too, as in Bilge.
   - Three or more coins of a kind in a row or a column are hauled up. What's below rises into the
     gap and new coins come in at the bottom (the treasure comes up from the deep); anything that
     lines up then goes too (a chain), exactly as in Bilge.
   - A ruby, selected with the cursor, clears its whole row and column; an emerald clears both its
     diagonals. A gem in another's path goes off too.
   - A treasure chest, two by two, rises with the coins. It can't be moved, and it only rises when
     both squares above it are clear: a coin cleared above one side leaves a gap that stays till the
     other side clears too. A chest that reaches the top row is hauled. At most two at a time.
   - Scoring in the real puzzle is "the rate and the value of treasure being hauled up"; the formula
     isn't published. In the Vampirate lairs a session is scored by chests hauled (see `rating`).
   Where the wiki is silent the reading here is the likeliest one, and says so. */
export const W = 8, H = 8, KINDS = 4;
/** The coins, as the real board has them. */
export const COINS = ['green', 'silver', 'gold', 'bronze'];
/** Chests on the board at once, at most (the Vampirate lairs: "up to two chests on the board"). */
export const MAX_CHESTS = 2;
export const NO_SPECIALS = { ruby: 0, emerald: 0, chest: 0 };
/** The den's score for one clear (the real formula isn't published, only that combinations score
    more than single threes): a coin is one, the swap's own clear counts once per line it made, and
    each later link of a chain counts one more than the last. */
export function points(coins, link, lines) {
    return coins * (link === 0 ? Math.max(1, lines) : link + 1);
}
/** The Vampirate lairs' ratings for a session, by chests hauled (YPPedia "Vampirate expedition":
    Frenetic 8 and up, Swift 6 to 8, Brisk 5 to 6, Steady 3 to 5, Lethargic 2 to 3, Asleep 0 to 2;
    where the ranges meet, the higher one). */
export function rating(chests) {
    if (chests >= 8)
        return 'Frenetic';
    if (chests >= 6)
        return 'Swift';
    if (chests >= 5)
        return 'Brisk';
    if (chests >= 3)
        return 'Steady';
    if (chests >= 2)
        return 'Lethargic';
    return 'Asleep';
}
const isCoin = (b) => !!b && !b.s;
const isGem = (b) => b?.s === 'ruby' || b?.s === 'emerald';
const ROOK = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
export class Haul {
    random;
    /** grid[row][col], row 0 at the top. */
    grid = [];
    odds;
    /** Coins still down there; the haul's over when they're all up (a wreck "hit bottom"). */
    hoard = Infinity;
    /** Chests still down there, to come up now and then. */
    chestsLeft = Infinity;
    /** Coins hauled so far, chests hauled so far, and the score. */
    coins = 0;
    chests = 0;
    score = 0;
    nextId = 1;
    constructor(random = Math.random, odds = NO_SPECIALS) {
        this.random = random;
        this.odds = odds;
        this.fill();
    }
    /** A fresh board of coins with nothing lined up. */
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
    /** All brought up: no coins left, and no chests left down there or on the board. */
    get over() {
        return this.hoard <= 0 && (this.chestsLeft <= 0 || this.odds.chest <= 0) && !this.chestList().length;
    }
    kindAt(r, c) {
        const b = this.grid[r]?.[c];
        return isCoin(b) ? b.k : -1;
    }
    /** Every chest on the board, by its top left square. */
    chestList() {
        const out = [], seen = new Set();
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++) {
                const b = this.grid[r][c];
                if (b?.s === 'chest' && !seen.has(b.id)) {
                    seen.add(b.id);
                    out.push({ bit: b, r, c });
                }
            }
        return out;
    }
    /** A new piece coming in at the bottom: one draw decides both whether it's a gem and its kind. */
    fresh() {
        const x = this.random(), { ruby, emerald } = this.odds;
        if (x < ruby)
            return { id: this.nextId++, k: -1, s: 'ruby' };
        if (x < ruby + emerald)
            return { id: this.nextId++, k: -1, s: 'emerald' };
        const k = Math.min(KINDS - 1, Math.floor(((x - ruby - emerald) / (1 - ruby - emerald)) * KINDS));
        return { id: this.nextId++, k };
    }
    /** Every line of three or more coins lined up now: its squares and its length. */
    lines() {
        const out = [];
        const scan = (n, m, at) => {
            for (let i = 0; i < n; i++) {
                let cur = [];
                const run = () => { if (cur.length >= 3)
                    out.push({ cells: cur, n: cur.length }); };
                for (let j = 0; j < m; j++) {
                    const [r, c] = at(i, j), k = this.kindAt(r, c);
                    if (cur.length && k >= 0 && k === this.kindAt(cur[0][0], cur[0][1]))
                        cur.push([r, c]);
                    else {
                        run();
                        cur = k >= 0 ? [[r, c]] : [];
                    }
                }
                run();
            }
        };
        scan(H, W, (r, c) => [r, c]);
        scan(W, H, (c, r) => [r, c]);
        return out;
    }
    /** The cursor on (r, c) and the square below it: swap the two, or, if a gem's under the cursor,
        set it off (the real puzzle: gems go off "when clicked (or selected using the space bar)"). */
    swap(r, c) {
        const res = { moved: false, lines: [], gems: 0, coins: 0, chain: 0, chests: 0, points: 0, stages: [] };
        if (this.over || r < 0 || r >= H - 1 || c < 0 || c >= W)
            return res;
        const a = this.grid[r][c], b = this.grid[r + 1][c];
        if (!a || !b || a.s === 'chest' || b.s === 'chest')
            return res;
        res.moved = true;
        let gone;
        if (isGem(a) || isGem(b)) {
            const start = [];
            if (isGem(a))
                start.push([r, c]);
            if (isGem(b))
                start.push([r + 1, c]);
            const blast = this.blast(start);
            gone = blast.gone;
            res.gems = blast.fired;
        }
        else {
            this.grid[r][c] = b;
            this.grid[r + 1][c] = a;
            const ls = this.lines();
            res.lines = ls.map((l) => l.n);
            gone = new Set(ls.flatMap((l) => l.cells.map(([rr, cc]) => `${rr},${cc}`)));
            res.stages.push({ cleared: [], chests: [], grid: this.snap() }); // the swap itself
        }
        for (let link = 0; gone.size; link++) {
            const ids = [];
            let coins = 0;
            for (const key of gone) {
                const [rr, cc] = key.split(',').map(Number), bit = this.grid[rr][cc];
                if (!bit)
                    continue;
                ids.push(bit.id);
                if (!bit.s)
                    coins++;
                this.grid[rr][cc] = null;
            }
            if (link)
                res.chain++;
            res.coins += coins;
            res.points += points(coins, link, res.lines.length);
            const chests = this.settle();
            res.chests += chests.length;
            res.stages.push({ cleared: ids, chests, grid: this.snap() });
            gone = new Set(this.lines().flatMap((l) => l.cells.map(([rr, cc]) => `${rr},${cc}`)));
        }
        const up = Math.min(res.coins, this.hoard);
        this.hoard -= up;
        this.coins += up;
        this.chests += res.chests;
        this.score += res.points;
        return res;
    }
    /** Gems going off from these squares: a ruby along its row and column, an emerald along both
        diagonals, to the edges. A gem in the way goes off too. Chests aren't touched (the wiki says
        gems clear "puzzle pieces"; a chest is the prize, so it stays, and the clear passes it by). */
    blast(start) {
        const gone = new Set(), fired = new Set(), todo = start.slice();
        while (todo.length) {
            const [r, c] = todo.pop(), gem = this.grid[r][c];
            if (fired.has(gem.id))
                continue;
            fired.add(gem.id);
            gone.add(`${r},${c}`);
            for (const [dr, dc] of gem.s === 'ruby' ? ROOK : BISHOP) {
                for (let rr = r + dr, cc = c + dc; rr >= 0 && rr < H && cc >= 0 && cc < W; rr += dr, cc += dc) {
                    const b = this.grid[rr][cc];
                    if (!b || b.s === 'chest')
                        continue;
                    gone.add(`${rr},${cc}`);
                    if (isGem(b) && !fired.has(b.id))
                        todo.push([rr, cc]);
                }
            }
        }
        return { gone, fired: fired.size };
    }
    /** After a clear: everything rises as far as it goes, chests at the top are hauled, and new pieces
        come in at the bottom. Returns the ids of the chests hauled. */
    settle() {
        const hauled = [];
        for (;;) {
            this.rise();
            const top = this.chestList().filter((x) => x.r === 0);
            if (!top.length)
                break;
            for (const { bit, c } of top) {
                hauled.push(bit.id);
                for (const [rr, cc] of [[0, c], [0, c + 1], [1, c], [1, c + 1]])
                    this.grid[rr][cc] = null;
            }
        }
        this.refill();
        return hauled;
    }
    /** Coins and gems rise into any gap above them; a chest rises only when both squares above it are
        clear. Whatever's stuck under a chest waits for it. */
    rise() {
        for (let moved = true; moved;) {
            moved = false;
            for (let r = 1; r < H; r++)
                for (let c = 0; c < W; c++) {
                    const b = this.grid[r][c];
                    if (!b)
                        continue;
                    if (b.s !== 'chest') {
                        if (!this.grid[r - 1][c]) {
                            this.grid[r - 1][c] = b;
                            this.grid[r][c] = null;
                            moved = true;
                        }
                        continue;
                    }
                    if (this.grid[r - 1][c] === b || this.grid[r][c - 1] === b)
                        continue; // not its top left
                    if (this.grid[r - 1][c] || this.grid[r - 1][c + 1])
                        continue;
                    this.grid[r - 1][c] = this.grid[r - 1][c + 1] = b;
                    this.grid[r + 1][c] = this.grid[r + 1][c + 1] = null;
                    moved = true;
                }
        }
    }
    /** New pieces into the empty squares at the foot of each column (a gap held above a stuck chest
        stays empty). Now and then a chest comes up with them, in two side-by-side columns that were
        cleared ("chests will have a higher likelihood of spawning wherever coins are cleared"). */
    refill() {
        const empty = Array.from({ length: W }, (_, c) => { let n = 0; while (n < H && !this.grid[H - 1 - n][c])
            n++; return n; });
        const room = [];
        for (let c = 0; c < W - 1; c++)
            if (empty[c] >= 2 && empty[c + 1] >= 2)
                room.push(c);
        if (room.length && this.odds.chest > 0 && this.chestsLeft > 0 && this.chestList().length < MAX_CHESTS && this.random() < this.odds.chest) {
            // The chest comes in last, at the very bottom, under the new coins in its two columns.
            const c = room[Math.floor(this.random() * room.length)], bit = { id: this.nextId++, k: -1, s: 'chest' };
            for (const [rr, cc] of [[H - 2, c], [H - 2, c + 1], [H - 1, c], [H - 1, c + 1]])
                this.grid[rr][cc] = bit;
            this.chestsLeft--;
        }
        // Column by column, the highest new piece first.
        for (let c = 0; c < W; c++)
            for (let r = H - empty[c]; r < H; r++)
                if (!this.grid[r][c])
                    this.grid[r][c] = this.fresh();
    }
    snap() { return this.grid.map((row) => row.slice()); }
}
