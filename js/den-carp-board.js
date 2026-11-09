/* Pirate Den: the wall's Carpentry board. TypeScript, compiled to js/den-carp-board.js; tested in
   tests/den-carp-board.test.ts. den.js draws it (a flat board over the den) and fits what you put
   on it into the real holes in the 3D wall.

   The user (9 Nov), at the wall in the Carpentry view, with the holes strung out along it: "you
   don't want to move a piece 4 to the right over all the holes", so with 4 or 5 holes "you should
   see 2 rows". It "doesn't need to map one-on-one to the physical reality ... we care about the
   playability and the accessibility for different controls, like the 3D view is for the fun part,
   the 2D is for that." So the board is the real puzzle's: each hole in a tile of its own (the hole
   and a little of the stone round it, to board over), the tiles in two rows, left to right in the
   order the holes run along the wall, two to a column. Q/W/A/S jump between them as in the real
   puzzle (with two columns, they're its four holes exactly). */
/** Lays the holes out in two rows (one if there's only one), two to a column, left to right along
    the wall. Each tile is the hole and `margin` squares of stone all round it (cut short at the
    wall's edges, if `within` gives its size); `gap` squares between tiles. A tile sits in the
    middle of its slot. */
export function layout(holes, margin = 2, gap = 1, within) {
    const order = holes.map((b, i) => ({ b, i })).sort((a, z) => a.b.c0 - z.b.c0 || a.b.r0 - z.b.r0);
    const rows = order.length > 1 ? 2 : 1;
    const cols = Math.ceil(order.length / rows);
    // The hole and its margin, cut short at the edges of the wall (`within`), if given.
    const span = (a, n, max) => {
        const lo = max === undefined ? a - margin : Math.max(0, a - margin), hi = max === undefined ? a + n + margin : Math.min(max, a + n + margin);
        return [lo, hi - lo];
    };
    const box = (b) => { const [r0, H] = span(b.r0, b.h, within?.h), [c0, W] = span(b.c0, b.w, within?.w); return { r0, c0, H, W }; };
    const size = box;
    const colW = Array(cols).fill(0), rowH = Array(rows).fill(0);
    order.forEach(({ b }, n) => {
        const { H, W } = size(b), col = Math.floor(n / rows), row = n % rows;
        colW[col] = Math.max(colW[col], W);
        rowH[row] = Math.max(rowH[row], H);
    });
    const colX = colW.map((_, c) => colW.slice(0, c).reduce((a, w) => a + w + gap, 0));
    const rowY = rowH.map((_, r) => rowH.slice(0, r).reduce((a, h) => a + h + gap, 0));
    const tiles = order.map(({ b, i }, n) => {
        const { H, W } = size(b), col = Math.floor(n / rows), row = n % rows;
        return {
            i, H, W, col, row,
            R0: rowY[row] + Math.floor((rowH[row] - H) / 2),
            C0: colX[col] + Math.floor((colW[col] - W) / 2),
            r0: box(b).r0, c0: box(b).c0,
        };
    });
    tiles.sort((a, z) => a.i - z.i);
    return {
        tiles,
        H: rowH.reduce((a, h) => a + h, 0) + gap * (rows - 1),
        W: colW.reduce((a, w) => a + w, 0) + gap * Math.max(0, cols - 1),
    };
}
/** The tile a board point is on, or the nearest one to it (by distance to its edge). -1 if none. */
export function tileAt(L, R, C) {
    let best = -1, bd = Infinity;
    L.tiles.forEach((t, n) => {
        const dr = Math.max(t.R0 - R, 0, R - (t.R0 + t.H)), dc = Math.max(t.C0 - C, 0, C - (t.C0 + t.W));
        const d = Math.hypot(dr, dc);
        if (d < bd) {
            bd = d;
            best = n;
        }
    });
    return best;
}
/** Board square to wall square, through a tile. */
export const toWall = (t, R, C) => [R - t.R0 + t.r0, C - t.C0 + t.c0];
/** Wall square to board square, through a tile. */
export const toBoard = (t, r, c) => [r - t.r0 + t.R0, c - t.c0 + t.C0];
/** Where a piece `h` by `w` with its top-left at board square (R, C) goes on the wall: through the
    tile its middle is over. */
export function pieceToWall(L, R, C, h, w) {
    const n = tileAt(L, R + h / 2, C + w / 2);
    if (n < 0)
        return null;
    const [r, c] = toWall(L.tiles[n], R, C);
    return { tile: n, r, c };
}
/** Q, W, A and S: the tile that way. Up keys the top row, down keys the bottom; left keys the
    nearest column to the left, else this one; right keys the nearest to the right, else this one.
    With two columns that's the real puzzle's four holes, wherever you are. A column with nothing in
    that row gives its other tile. Null if there are no tiles. */
export function cornerTile(L, cur, corner) {
    if (!L.tiles.length)
        return null;
    const at = L.tiles[cur] ?? L.tiles[0];
    const left = corner === 'ul' || corner === 'dl', row = corner === 'ul' || corner === 'ur' ? 0 : 1;
    const cols = [...new Set(L.tiles.map((t) => t.col))].sort((a, z) => a - z);
    const col = left ? [...cols].reverse().find((c) => c < at.col) ?? at.col : cols.find((c) => c > at.col) ?? at.col;
    const inCol = L.tiles.map((t, n) => ({ t, n })).filter(({ t }) => t.col === col);
    return (inCol.find(({ t }) => t.row === row) ?? inCol[0]).n;
}
