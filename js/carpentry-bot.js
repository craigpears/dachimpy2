/* A bot at Carpentry: the Carpentry frame's move-choosing (src/carpentry-frame.ts, the one
   implementation: the den's frames, her deck patch, the crane), knowing nothing of where it's played.
   TypeScript, compiled to js/carpentry-bot.js; tested in tests/puzzle-bots.test.ts. Written (12 Nov)
   for the race watched (src/race-watch.ts): a racer patching her holed deck, or building the race's crane,
   plays her frame with it, a piece at a time.

   Greedy, a piece at a time, as a decent carpenter plays: of the pieces in hand, each way up, every spot
   it fits, the one that fills most of the frame and sticks out least, leaving no pocket of empty squares
   too small for a piece to fill (fewer than five, cut off from the rest), and snug (touching the frame's
   edge and the pieces in it). */
const key = (r, c) => `${r},${c}`;
/** The frame's empty squares in pockets (joined side to side): each pocket's size. */
export function pockets(open) {
    const left = new Set(open.map(([r, c]) => key(r, c))), out = [];
    for (const [r0, c0] of open) {
        if (!left.has(key(r0, c0)))
            continue;
        let n = 0;
        const todo = [[r0, c0]];
        left.delete(key(r0, c0));
        while (todo.length) {
            const [r, c] = todo.pop();
            n++;
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
                if (left.delete(key(r + dr, c + dc)))
                    todo.push([r + dr, c + dc]);
        }
        out.push(n);
    }
    return out;
}
/** The piece to fit, and where; null if none goes. */
export function carpMove(f, hand) {
    const open = f.open(), openSet = new Set(open.map(([r, c]) => key(r, c)));
    let top = null, topV = -Infinity;
    hand.forEach((p, i) => {
        for (const cells of p.ways)
            for (const s of f.fits(cells)) {
                const sq = cells.map(([a, b]) => [a + s.r, b + s.c]), mine = new Set(sq.map(([a, b]) => key(a, b)));
                const fill = sq.filter(([a, b]) => openSet.has(key(a, b))).length;
                const after = open.filter(([a, b]) => !mine.has(key(a, b)));
                const stuck = pockets(after).filter((n) => n < 5).reduce((x, n) => x + n, 0);
                // (snug: each side of it against the frame's edge or a piece, not open water)
                let snug = 0;
                for (const [a, b] of sq)
                    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                        const kk = key(a + dr, b + dc);
                        if (!mine.has(kk) && !openSet.has(kk))
                            snug++;
                    }
                const v = fill * 10 - s.over * 7 - stuck * 30 + snug * 0.5 + (after.length === 0 ? 50 : 0);
                if (v > topV) {
                    topV = v;
                    top = { i, cells, r: s.r, c: s.c };
                }
            }
    });
    return top;
}
/** Stuck (nothing in hand fits what's left: a gap shut in by the pieces round it), the piece to lift back
    out, as a carpenter would (any piece laid can be, till the frame's full): the one beside the smallest
    gap. Its place in the frame's `laid`, or -1. */
export function carpLift(f) {
    const open = f.open();
    if (!open.length || !f.laid.length)
        return -1;
    const near = new Map();
    for (const [r, c] of open)
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const i = f.at(r + dr, c + dc);
            if (i >= 0)
                near.set(i, (near.get(i) ?? 0) + 1);
        }
    let best = f.laid.length - 1, most = 0;
    for (const [i, n] of near)
        if (n > most) {
            most = n;
            best = i;
        }
    return best;
}
