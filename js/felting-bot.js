/* A greedy bot for Felting (src/felting.ts), knowing nothing of where it's played: to check every pattern can be
   done well, and to watch on felting-test.html (?watch). It felts as the phases go: tucks the strays in, lays every
   wisp, then stabs wherever a stab brings the piece nearest the pattern, until no stab helps. */
import { FIRM, HARD, HOLE, WISP_IN } from './felting.js';
/** How far the piece is from the pattern: the bot's measure, smooth so a greedy step can follow it. */
export function distance(f) {
    let d = 0;
    for (let r = 0; r < f.h; r++)
        for (let c = 0; c < f.w; c++) {
            const x = f.grid[r][c];
            if (!x.inside) {
                d += x.wool * f.toShape[r][c] * 2;
                continue;
            }
            if (x.want === HOLE) {
                d += Math.max(0, HARD - x.firm);
                continue;
            }
            if (x.firm < FIRM)
                d += FIRM - x.firm;
            else if (x.firm >= HARD)
                d += 2 + (x.firm - HARD) * 2;
            if (x.want !== f.pattern.core)
                d += (x.wisp === x.want ? Math.max(0, WISP_IN - x.felt) : WISP_IN) * 2;
        }
    return d;
}
/** The bot's next move, or null when it's done. */
export function nextMove(f) {
    if (f.over)
        return null;
    // The strays first, the farthest out first (so each tuck carries in what's beyond it).
    let stray = null, far = 0;
    for (let r = 0; r < f.h; r++)
        for (let c = 0; c < f.w; c++) {
            const x = f.grid[r][c];
            if (!x.inside && x.wool && f.toShape[r][c] > far) {
                far = f.toShape[r][c];
                stray = { r, c, colour: null };
            }
        }
    if (stray)
        return stray;
    // Then every wisp laid, before the stabbing.
    for (let r = 0; r < f.h; r++)
        for (let c = 0; c < f.w; c++) {
            const x = f.grid[r][c];
            if (x.inside && x.want !== HOLE && x.want !== f.pattern.core && x.wisp !== x.want)
                return { r, c, colour: x.want };
        }
    // Then the stab that helps most.
    const now = distance(f);
    let best = null, bestGain = 1e-9;
    for (let r = 0; r < f.h; r++)
        for (let c = 0; c < f.w; c++) {
            if (!f.grid[r][c].inside)
                continue;
            const g = f.clone();
            g.stab(r, c, { t: 1e6 });
            const gain = now - distance(g);
            if (gain > bestGain) {
                bestGain = gain;
                best = { r, c, colour: null };
            }
        }
    return best;
}
/** Play a whole piece at a calm pace (no bent needles), returning how many moves it took. */
export function play(f, limit = 2000) {
    let moves = 0, t = 0;
    for (let m = nextMove(f); m && moves < limit; m = nextMove(f)) {
        f.stab(m.r, m.c, { t: (t += 1), colour: m.colour });
        moves++;
    }
    return moves;
}
