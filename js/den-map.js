/* Pirate Den: the captain's map. TypeScript, compiled to js/den-map.js; tested in
   tests/den-map.test.ts. den.js draws the scroll on the sand and the map opened out; this says when
   it's there, who can pick it up, and what it shows.

   The user (9 Nov), on what beating the siege should leave you: "a treasure map ... leading up the
   rocks behind the den to an X marks the spot", and then, sketching how you get it: "there's a map
   that's dropped on the beach to some treasure". Their captain drops it as he sails off; walk out
   through the gate and pick it up, and it opens out on the sand in front of you. It shows "we hear
   there's some secret treasure here, guarded by a fearsome enemy", and the ways to him: "a gunning
   platform here, a secret bilging pump station here, or a path up for a direct sword fight here".
   Leave the choices open: one way for each of the den's puzzles, and you pick yours from the map.

   Then (9 Nov, while this was being built) the treasure moved out to sea: not up the rocks behind
   the den ("it feels weird going backwards") but across the water to his hideout, so you go
   forward, "the reverse of this kind of mirror of this kind of siege". So the map shows your cove
   at the bottom, the sea, and his island at the top: shoot at him from your ship (the gunnery
   deck, natural at sea), land and sword fight him, or "bypass his defenses, go around the corner
   into some cove" where the map says there's "some hidden undiscovered bilge pump". (The voyage
   and Dalnoth come next: IDEAS.md, "The captain's map".) */
export const MAP = {
    /** Where it lies on the beach, across from the gate's middle (the pumps are off to the right) and
        out from the wall (metres; the wall's at 0, out is -). */
    DX: -2.4,
    Z: -3.6,
    /** How close you must be to pick it up (metres). */
    REACH: 1.6,
    /** From how far away the scroll catches your eye ("A map?" over it). */
    SEEN: 14,
};
/** The map after the den's moved on: their captain drops it when the siege is over, and once
    picked up it's yours for good (a raid called on later doesn't take it back). */
export function mapAfter(state, phase) {
    const s = state ?? 'none';
    return s === 'none' && phase === 'peace' ? 'lying' : s;
}
/** Whether you can pick it up: it's lying there and you're standing by it (dx, dz from it). */
export const canPickUp = (state, dx, dz) => state === 'lying' && Math.hypot(dx, dz) <= MAP.REACH;
/** Whether you can open it out to look at: once it's been picked up (by you or a crewmate). */
export const canRead = (state) => state === 'found';
/** What the captain scrawled across the top. */
export const RUMOUR = "We hear there's some secret treasure here, guarded by a fearsome enemy";
export const WAYS = [
    { puzzle: 'Gunning', label: 'Come at him by sea', note: 'shoot up his defences from your ship', at: [0.2, 0.49] },
    { puzzle: 'Swordfight', label: 'Land on his beach', note: 'and fight him for it', at: [0.67, 0.5] },
    { puzzle: 'Bilge', label: 'A hidden cove', note: "an old bilge pump nobody's found: flood him out", at: [0.81, 0.33] },
];
/** Where the X is: on his island, at the top. */
export const X_AT = [0.5, 0.13];
/** Where your den is: its cove, at the bottom, across the sea from him. */
export const DEN_AT = [0.5, 0.86];
