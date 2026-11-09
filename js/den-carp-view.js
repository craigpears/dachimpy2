/* Pirate Den: the Carpentry view. TypeScript, compiled to js/den-carp-view.js; tested in
   tests/den-carp-view.test.ts. den.js draws it (the camera straight on to the board, the piece's
   ghost) and wires these to the wall and the frames.

   The user (9 Nov), after Bilge: "have a 3D mode, but when you're puzzling, like I just don't think
   you can beat 2D, especially like the biggest critique and feedback I've got is people like to use
   keyboard controls, and this 3D experience is just not very good." And not a separate screen: "to
   make it really feel like, oh, look, I can put things on the stairs. I can put things on the wall
   or the deck or ramparts". So the view goes straight on to whatever you're building (the wall, or
   a frame: the stairs, the wall-walk, the gun tower, your shack), and the keys are Puzzle Pirates'
   own Carpentry keys (YPPedia "Carpentry", read 9 Nov 2026):
   - 1-3 take the toolbox's pieces (the den's three crates);
   - the arrows move the piece a square;
   - X and C turn it one way and the other, Z flips it;
   - Q, W, A and S centre it over the upper-left, upper-right, lower-left and lower-right holes;
   - Space puts it in.
   The den's own: Tab goes on to the next thing being built, Backspace takes the last piece back
   off (as the real puzzle lets you adjust the last piece), Esc walks off. E and F turn and flip as
   they do when walking about. */
/** The keys, by `KeyboardEvent.key` in lower case. Turning: -1 anticlockwise, 1 clockwise. */
export const KEYS = {
    arrowup: { kind: 'move', dr: -1, dc: 0 },
    arrowdown: { kind: 'move', dr: 1, dc: 0 },
    arrowleft: { kind: 'move', dr: 0, dc: -1 },
    arrowright: { kind: 'move', dr: 0, dc: 1 },
    x: { kind: 'turn', dir: -1 },
    c: { kind: 'turn', dir: 1 },
    e: { kind: 'turn', dir: 1 },
    z: { kind: 'flip' },
    f: { kind: 'flip' },
    q: { kind: 'jump', corner: 'ul' },
    w: { kind: 'jump', corner: 'ur' },
    a: { kind: 'jump', corner: 'dl' },
    s: { kind: 'jump', corner: 'dr' },
    '1': { kind: 'take', i: 0 },
    '2': { kind: 'take', i: 1 },
    '3': { kind: 'take', i: 2 },
    ' ': { kind: 'place' },
    enter: { kind: 'place' },
    tab: { kind: 'next' },
    backspace: { kind: 'undo' },
    escape: { kind: 'leave' },
    d: { kind: 'none' },
};
const LEFT = (c) => c === 'ul' || c === 'dl';
const UP = (c) => c === 'ul' || c === 'ur';
/** On the wall: the hole a corner key sends the piece to. The wall is the real board's four
    holes in two courses either side of the gate (src/den-wall.ts), so Q goes to the high hole
    left of the gate, W the high one right of it, A and S the low ones; `split` is the wall's
    middle, [row, column], between the courses and at the gate. Cannon breaches add more holes to a
    corner: then the key goes on round them, nearest first. Never `cur`, the hole the piece is at
    already (the user, 9 Nov: Q took the piece back to the hole it was at, so "it isn't jumping"),
    unless it's the only one there; if the corner has none, the nearest on that side. Null if
    there's nowhere else to go. */
export function nextHole(holes, at, corner, cur, split) {
    const sideOk = ([, c]) => (LEFT(corner) ? c < split[1] : c >= split[1]);
    const inCorner = (p) => sideOk(p) && (UP(corner) ? p[0] < split[0] : p[0] >= split[0]);
    const nearest = (ok) => {
        let best = null, bd = Infinity;
        holes.forEach((p, i) => {
            if (i === cur || !ok(p))
                return;
            const d = Math.hypot(p[0] - at[0], p[1] - at[1]);
            if (d < bd) {
                bd = d;
                best = i;
            }
        });
        return best;
    };
    if (holes.some(inCorner))
        return nearest(inCorner);
    return nearest(sideOk);
}
/** The key that sends the piece to a hole (Q, W, A or S, as the keyboard's little square matches
    the holes' layout), shown on the hole in the Carpentry view. The user (9 Nov) pressed W and S
    for up and down, as when walking, and the piece leapt to the top-right and bottom-right holes:
    they wanted the real game's keys kept ("we want to be completely faithful to the Puzzle Pirate
    controls"), so the holes say which key is theirs. */
export function holeKey([r, c], split) {
    return r < split[0] ? (c < split[1] ? 'Q' : 'W') : (c < split[1] ? 'A' : 'S');
}
/** On a frame (one big space): its four quarters, as the real board's four holes. Each is the
    middle of the squares still empty in that quarter of the frame, or null if it's all filled. */
export function quarters(open) {
    const out = { ul: null, ur: null, dl: null, dr: null };
    if (!open.length)
        return out;
    const rs = open.map((p) => p[0]), cs = open.map((p) => p[1]);
    const midR = (Math.min(...rs) + Math.max(...rs)) / 2, midC = (Math.min(...cs) + Math.max(...cs)) / 2;
    const sums = { ul: [0, 0, 0], ur: [0, 0, 0], dl: [0, 0, 0], dr: [0, 0, 0] };
    for (const [r, c] of open) {
        const k = r <= midR ? (c <= midC ? 'ul' : 'ur') : (c <= midC ? 'dl' : 'dr');
        sums[k][0] += r + 0.5;
        sums[k][1] += c + 0.5;
        sums[k][2]++;
    }
    for (const k of Object.keys(sums))
        if (sums[k][2])
            out[k] = [sums[k][0] / sums[k][2], sums[k][1] / sums[k][2]];
    return out;
}
/** Where a piece's top-left goes to be centred over a point. */
export const centreOn = (p, h, w) => [Math.round(p[0] - h / 2), Math.round(p[1] - w / 2)];
/** How far the piece can be moved: anywhere it still touches the board, so it can hang over an
    edge (frames take overhangs; the spare's sawn off). `box` is the board's squares' extent. */
export function clampTo(r, c, h, w, box, overhang) {
    const lo = (a0, n) => (overhang ? a0 - n + 1 : a0);
    const hi = (a0, A, n) => (overhang ? a0 + A - 1 : a0 + A - n);
    return [
        Math.max(lo(box.r0, h), Math.min(hi(box.r0, box.h, h), r)),
        Math.max(lo(box.c0, w), Math.min(hi(box.c0, box.w, w), c)),
    ];
}
/** Tab: the next thing being built after the one you're on, round and round. */
export function nextBoard(boards, cur) {
    if (!boards.length)
        return null;
    const i = cur === null ? -1 : boards.indexOf(cur);
    return boards[(i + 1) % boards.length];
}
/** The arrows on the wall. The user (9 Nov): "you should always be able to go left and right and
    move to the next available spot"; the piece "seems to be jumping two spaces and going right to
    the bottom, presumably because the game has decided that's the only place it can fit" (it went
    to the next hole's best fit). So an arrow always moves the piece, and never further than it
    must:
    - a square that way, if the piece still touches a hole there (some of it over the hole's box);
    - else, over the bare stone and the gate, to the nearest spot touching the next hole in line
      with it that way (in its course, going left or right), keeping its row (its column, going up
      or down): never a diagonal jump;
    - else, with no hole in line that way, a square on, to the wall's edge (null at the edge).
    `at` is the piece's top-left; `piece` its height and width; `wall` the wall's rows and columns. */
export function arrowStep(holes, at, piece, wall, dr, dc) {
    if (!dc && !dr)
        return null;
    // Going up or down is going left or right with rows and columns swapped.
    if (!dc) {
        const t = arrowStep(holes.map((b) => ({ r0: b.c0, c0: b.r0, h: b.w, w: b.h })), { r: at.c, c: at.r }, { h: piece.w, w: piece.h }, { H: wall.W, W: wall.H }, 0, dr);
        return t && { r: t.c, c: t.r };
    }
    const dir = Math.sign(dc), maxC = wall.W - piece.w;
    const c1 = at.c + dir;
    if (c1 < 0 || c1 > maxC)
        return null;
    const rowsMeet = (b, r) => r < b.r0 + b.h && r + piece.h > b.r0;
    const colsMeet = (b, c) => c < b.c0 + b.w && c + piece.w > b.c0;
    if (holes.some((b) => rowsMeet(b, at.r) && colsMeet(b, c1)))
        return { r: at.r, c: c1 };
    // The nearest spot touching the next hole in line with the piece (in its course, going left or
    // right), its row kept: never a diagonal jump.
    let best = null;
    for (const b of holes) {
        if (!rowsMeet(b, at.r))
            continue;
        const lo = Math.max(0, b.c0 - piece.w + 1), hi = Math.min(maxC, b.c0 + b.w - 1);
        const c = dir > 0 ? Math.max(lo, c1) : Math.min(hi, c1);
        if (c < lo || c > hi)
            continue; // behind the piece
        if (best === null || Math.abs(c - at.c) < Math.abs(best - at.c))
            best = c;
    }
    if (best !== null)
        return { r: at.r, c: best };
    return { r: at.r, c: c1 };
}
