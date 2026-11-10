/* Pirate Den: the landing off the den's beach. TypeScript, compiled to js/den-beach.js; tested in
   tests/den-beach.test.ts. js/den/landing.js draws it.

   The user (10 Nov): "how to get back to shore is not very obvious ... more squares should have
   that action. So you get to the general vicinity, not one specific square." So a whole stretch of
   water along the den's beach counts: from any square of it, Space brings her in to her mooring
   and puts you on the beach. It's the sloop's sea's first rows (src/den-sail.ts), from the
   lowest tide's edge out, so it's sea whatever the beach's tide (src/den-bilge.ts). */
export const BEACH = {
    /** The landing: the sea's squares along the den's beach, these columns (her mooring among them)
        and this many rows out from the shore. */
    LANDING: { c0: 4, c1: 11, rows: 2 },
};
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
