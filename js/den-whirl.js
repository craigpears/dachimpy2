/* Pirate Den: a whirlpool on the sloop's sea, by Puzzle Pirates' rules. TypeScript, compiled to
   js/den-whirl.js; tested in tests/den-whirl.test.ts. The helm plays it (src/den-sail.ts: Sea.whirlAt,
   Helm's twirl); Kikkit's are laid in LAY.KIKKIT.WHIRLS and drawn by js/den/whirlpools.js. Knows nothing
   of where it's put: any whirlpool anywhere on the sea is one of these.

   The user (11 Nov): "Whirlpools are basically four tiles ... each one ... rotates the ship and sends it
   to the opposite corner", and "obviously, follow the [YPPedia] thing". YPPedia (Whirlpool, Whirlpool
   tutorial, Sea battle, Collision mechanics; read 11 Nov):
   - "The whirlpool covers a two tile by two tile area."
   - "On each move, whirlpools move the ship clockwise around to the opposite corner of the whirlpool.
     They simultaneously rotate the ship clockwise 90 degrees." "Every Whirlpool moves ships clockwise."
     So four moves on one and she's back as she was.
   - Each phase of a turn: the movement token first, then "if a boat is resting on a special sea tile,
     such as wind or a whirlpool, the ship is moved once according to the rules of this tile. If this
     movement places the ship on another special square, it has no effect for this phase, but will act
     during the next phase if the ship remains there."
   - A whirl moves like a turn token: round by the next corner, clockwise, to the opposite one. A wind
     tile "pushes a ship one space in one direction on each turn".
   And the user's whirlpool "with a corner missing where there's some winds, so you kind of get caught
   in the whirlpool and it sends you to the opposite corner, which then gets you on some winds and sends
   you back": `gone`, the corner that isn't whirlpool. From the corner opposite it she's sent onto it;
   the two corners either side of it send her to and fro between them, as any whirlpool does.

   Square coordinates as the sea's: c across (right as seen from the den), r out to sea. Seen from
   above, out to sea up, clockwise is from facing out (0) to facing right (1): a right turn. */
export const WHIRL = {
    /** Seconds a whirl takes: a quarter turn, swung round to the far corner. A beat of its own between
        her moves, about as long as a quick one (12 Nov: 0.8 and a full pause after it was twice a
        downwind move's beat). */
    SECS: 0.6,
    /** Whirls in a row she can be held for (YPPedia: four and she's back as she was, a whole turn). In
        Puzzle Pirates you'd play a token to get out; here, so she's never held for ever, a whirlpool
        lets her go after a whole turn round, till she next moves of her own accord. */
    MOST: 4,
};
export function whirlpool(spot) {
    const [c, r] = spot.at, gone = spot.gone ?? null;
    // Clockwise seen from above: far left, far right, near right, near left.
    const corners = [[c, r + 1], [c + 1, r + 1], [c + 1, r], [c, r]];
    if (gone && !corners.some(([x, y]) => x === gone[0] && y === gone[1]))
        throw new Error(`whirlpool at ${c},${r}: ${gone} isn't a corner of it`);
    const squares = corners.filter(([x, y]) => !gone || x !== gone[0] || y !== gone[1]);
    return { corners, squares, gone: gone ? [...gone] : null, mid: [c + 0.5, r + 0.5] };
}
/** On one of its squares (the missing corner isn't). */
export const inWhirlpool = (w, c, r) => w.squares.some(([x, y]) => x === c && y === r);
/** A whirl: from her square of it, clockwise round by the next corner (`via`) to the opposite one,
    turned a quarter clockwise. */
export function whirl(w, p) {
    const i = w.corners.findIndex(([x, y]) => x === p.c && y === p.r);
    if (i < 0)
        throw new Error(`not on the whirlpool: ${p.c},${p.r}`);
    const via = w.corners[(i + 1) % 4], [c, r] = w.corners[(i + 2) % 4];
    return { via: [...via], to: { c, r, d: (p.d + 1) % 4 } };
}
/** Where she is partway (u, 0 to 1) through a whirl, for drawing: swung round the middle of it,
    clockwise, half a circle, turning a quarter as she goes. */
export function whirlAt(from, to, u) {
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), th = e * Math.PI;
    const mc = (from.c + to.c) / 2, mr = (from.r + to.r) / 2, x = from.c - mc, y = from.r - mr;
    return { c: mc + x * Math.cos(th) + y * Math.sin(th), r: mr - x * Math.sin(th) + y * Math.cos(th), a: from.d + e };
}
