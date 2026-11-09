/* Pirate Den: a hole in her deck, patched by Carpentry. TypeScript, compiled to js/den-patch.js;
   tested in tests/den-patch.test.ts. den.js draws the hole, the crate of timber beside it and the
   pieces, and plays it with the Carpentry view's keys (src/den-carp-view.ts).

   The user (9 Nov), dazed by the turret and bilging her out: it was over "way too quickly. Like,
   you know, one fix and it was done", and bilging was wrong for it: "what do you mean bilge? I've
   been hit by a cannonball, not water bucket." So a hit knocks a hole in her deck, and she's dazed
   till it's patched: a whole hole to fill, as the den's Carpentry is played (the wall's holes):
   - a piece must cover at least one open square of the hole, and nothing already in it;
   - it may rest on the sound deck round the hole (boarding it over), a square's width all round,
     as a piece at the wall may hang over the stone;
   - the hole's patched when every square of it is filled.
   About a small wall hole's worth of work: three pieces. */
export const PATCH = {
    /** Pieces' worth of hole a hit knocks in her deck: as big as the wall's biggest starting hole. */
    PIECES: 3,
    /** Squares of sound deck round the hole that a piece may rest on. */
    MARGIN: 1,
};
const k = (r, c) => `${r},${c}`;
/** Laid along her: at the top left, and turned to be longer than it's wide if it isn't, since her
    deck's long and narrow (its rows run from her bow to her stern). */
export function alongDeck(cells) {
    const r0 = Math.min(...cells.map((p) => p[0])), c0 = Math.min(...cells.map((p) => p[1]));
    const at = cells.map(([r, c]) => [r - r0, c - c0]);
    const h = Math.max(...at.map((p) => p[0])) + 1, w = Math.max(...at.map((p) => p[1])) + 1;
    return w > h ? at.map(([r, c]) => [c, r]) : at;
}
/** The hole a hit knocked in her, and what's been fitted into it. */
export class DeckHole {
    cells;
    board;
    laid = [];
    set;
    constructor(cells) {
        this.cells = alongDeck(cells);
        this.set = new Set(this.cells.map(([r, c]) => k(r, c)));
        const h = Math.max(...this.cells.map((p) => p[0])) + 1, w = Math.max(...this.cells.map((p) => p[1])) + 1, m = PATCH.MARGIN;
        this.board = { r0: -m, c0: -m, h: h + 2 * m, w: w + 2 * m };
    }
    taken() { return new Set(this.laid.flatMap((p) => p.cells.map(([r, c]) => k(r, c)))); }
    /** The squares of the hole still to fill. */
    open() { const t = this.taken(); return this.cells.filter(([r, c]) => !t.has(k(r, c))); }
    /** Every square of it filled. */
    done() { return this.open().length === 0; }
    /** Pieces resting on the deck round it (boarded over, not fitted flush). */
    over() { return this.laid.reduce((n, p) => n + p.over, 0); }
    isHole(r, c) { return this.set.has(k(r, c)); }
    /** Whether a piece (its squares, at the top left) goes with its top-left at r, c: all on the
        board, clear of the pieces in, and over at least one open square of the hole. */
    fit(shape, r, c) {
        const t = this.taken(), b = this.board;
        let over = 0, inHole = 0;
        for (const [pr, pc] of shape) {
            const R = pr + r, Cc = pc + c;
            if (R < b.r0 || R >= b.r0 + b.h || Cc < b.c0 || Cc >= b.c0 + b.w || t.has(k(R, Cc)))
                return null;
            if (this.set.has(k(R, Cc)))
                inHole++;
            else
                over++;
        }
        return inHole ? { r, c, over } : null;
    }
    /** Every spot the piece goes. */
    fits(shape) {
        const out = [], b = this.board;
        for (let r = b.r0 - 4; r < b.r0 + b.h; r++)
            for (let c = b.c0 - 4; c < b.c0 + b.w; c++) {
                const s = this.fit(shape, r, c);
                if (s)
                    out.push(s);
            }
        return out;
    }
    /** Fit a piece there, if it goes. */
    put(letter, shape, r, c) {
        const s = this.fit(shape, r, c);
        if (!s)
            return false;
        this.laid.push({ letter, cells: shape.map(([pr, pc]) => [pr + r, pc + c]), over: s.over });
        return true;
    }
    /** Take the last piece back out (as the real puzzle lets you adjust the last piece). */
    takeBack() { return this.done() ? undefined : this.laid.pop(); }
}
