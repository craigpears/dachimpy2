/* Pirate Den: the landing off the den's beach, and the jetty out to her. TypeScript, compiled to
   js/den-beach.js; tested in tests/den-beach.test.ts. js/den/landing.js draws it.

   The user (10 Nov): "how to get back to shore is not very obvious ... more squares should have
   that action. So you get to the general vicinity, not one specific square." So a whole stretch of
   water along the den's beach counts: from any square of it, Space brings her in to her mooring
   and puts you on the jetty by her. It's the sloop's sea's first rows (src/den-sail.ts), from the
   lowest tide's edge out, so it's sea whatever the beach's tide (src/den-bilge.ts).

   And the jetty (10 Nov): "I like the little pier to the side. I feel like I want to actually walk
   on the pier to the sloop, though. Like, it's just kind of a random pier in the middle of the water
   at the moment." So it runs from dry sand above high tide's mark all the way out to her mooring,
   just astern of her; you walk out along its boards and board her at its end, and going ashore puts
   you on its end, to walk back along it. */
import { SAIL } from './den-sail.js';
import { HIGH } from './den-bilge.js';
export const BEACH = {
    /** The landing: the sea's squares along the den's beach, these columns (her mooring among them)
        and this many rows out from the shore. */
    LANDING: { c0: 4, c1: 11, rows: 2 },
    /** On the sand you keep this far up from the water's edge (metres). */
    DRY: 0.4,
};
/** The jetty: metres, the den's own (x across, the wall at z 0, out to sea is -). */
export const JETTY = {
    /** Along the beach from her mooring's middle (+ toward the cove's middle): just astern of her. */
    DX: -1.9,
    /** Its width. */
    W: 1.3,
    /** Its foot is this far up the beach from high tide's mark, so it always starts on dry sand. */
    UP: 1.5,
    /** Its end is this far out past the lowest tide's edge: alongside her stern as she lies moored. */
    OUT: 1.1,
    /** Its boards' height. Under 0.3, so on it you're still down on the beach, not up the den's
        stairs (the den reads anything higher as climbing to the rampart). */
    DECK: 0.28,
    /** A pirate's half-width: how far in from its edges you keep, so you don't stand half off it. */
    PAD: 0.3,
    /** You can board her from this far along it from its end. */
    REACH: 2.2,
};
/** Where the jetty lies: its middle across (x), its foot on the sand (z0) and its end by her (z1). */
export const JETTY_AT = {
    x: SAIL.X0 + (SAIL.HOME.c + 0.5) * SAIL.CELL + JETTY.DX,
    z0: HIGH + JETTY.UP,
    z1: SAIL.Z0 - JETTY.OUT,
};
/** Is this spot on the jetty's boards (pad: keeping that far in from its sides and its end)? */
export function onJetty(x, z, pad = 0) {
    const J = JETTY_AT;
    return Math.abs(x - J.x) <= JETTY.W / 2 - pad && z <= J.z0 && z >= J.z1 + pad;
}
/** How high the ground is here, out on the beach: the jetty's boards, or the sand. */
export const beachFloor = (x, z) => (onJetty(x, z) ? JETTY.DECK : 0);
/** A step out on the beach, from (ox, oz) toward (nx, nz): where you end up. The sand's yours down
    to the water's edge (shore: where the tide has it) and across to the den's sides (side), or out
    to the jetty, whichever's further; the jetty's boards are yours all the way out to her. Off its
    side or its end you don't go: into the sea is nowhere you walk. */
export function beachStep(ox, oz, nx, nz, shore, side) {
    const J = JETTY_AT, edge = JETTY.W / 2 - JETTY.PAD;
    const lo = Math.min(-side, J.x - edge), hi = Math.max(side, J.x + edge);
    const sand = (x, z) => x >= lo && x <= hi && z >= shore + BEACH.DRY;
    const ok = (x, z) => onJetty(x, z, JETTY.PAD) || sand(x, z);
    if (ok(nx, nz))
        return [nx, nz];
    // On the jetty: kept to its boards, within its sides and short of its end.
    if (onJetty(ox, oz, JETTY.PAD))
        return [Math.max(J.x - edge, Math.min(J.x + edge, nx)), Math.max(J.z1 + JETTY.PAD, nz)];
    // On the sand (or the tide come in round you): up the beach, out of the water, as ever.
    return [Math.max(lo, Math.min(hi, nx)), Math.max(shore + BEACH.DRY, nz)];
}
/** Can you board her from here? Out at the jetty's end, where she's moored alongside. */
export const canBoard = (x, z) => onJetty(x, z) && z <= JETTY_AT.z1 + JETTY.REACH;
/** Where going ashore puts you: on the jetty's end by her, to walk back along it. */
export const ashoreAt = () => ({ x: JETTY_AT.x, z: JETTY_AT.z1 + 0.7, h: JETTY.DECK });
/** Is this square of the sea part of the landing along the den's beach? */
export function onLanding(c, r) {
    const L = BEACH.LANDING;
    return c >= L.c0 && c <= L.c1 && r >= 0 && r < L.rows;
}
/** Can you go ashore from where she is? On the landing, and not held up by a hole in her deck (a
    calm doesn't keep you aboard). Under way or stopped, either: she's brought in to her mooring. */
export function canLand(h) {
    const held = h.held();
    return onLanding(h.pose.c, h.pose.r) && !h.dazed() && (!held || held === 'calm');
}
