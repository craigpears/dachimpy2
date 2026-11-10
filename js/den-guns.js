/* Pirate Den: her guns, loaded by Gunnery. TypeScript, compiled to js/den-guns.js; tested in
   tests/den-guns.test.ts. The puzzle is the one copy of Gunnery (src/gunnery.ts), the gun tower's
   too; js/den/sea-guns.js lays its board on her deck, in the tower's look (js/den/gundeck.js);
   src/den-sail.ts says where a shot goes (broadside).

   The user (10 Nov): "we should have to load the guns through the puzzle". So Q and E fire only a
   gun that's loaded, and her guns are loaded by Gunnery, the den's own (the gun tower's), played on
   her deck. The board's four guns are hers, as in Puzzle Pirates, where what the gunners load is
   what the ship can fire: the two down its left side are her port guns, the two down its right her
   starboard. Firing a side's shot empties one of that side's loaded guns, which then wants a bucket
   to swab it out, as after any shot in Gunnery. So she holds as many shots a side as that side has
   guns on the board: two. This is only what the puzzle means for her. */
import { Gunnery } from './gunnery.js';
export const GUNS = {
    /** The side of her each of the board's guns is, in the board's order (src/gunnery.ts,
        GUNNERY.GUNS: two down its left side, then two down its right). */
    SIDES: ['L', 'L', 'R', 'R'],
    /** Seconds her gun takes to run out again after a shot, with that side's next load. */
    RUN_OUT: 1.2,
};
/** Her guns: the Gunnery board on her deck (the puzzle itself, src/gunnery.ts: the same one the gun
    tower plays), its four guns two a side, and her side guns running out after a shot. */
export class Broadside {
    board;
    /** Seconds till each side's gun is run out again (0: it is). */
    wait = { L: 0, R: 0 };
    constructor(board = new Gunnery()) {
        this.board = board;
    }
    /** The board's guns that side. */
    side(side) { return this.board.guns.filter((_, i) => GUNS.SIDES[i] === side); }
    /** The shots that side has: its loaded guns. */
    shots(side) { return this.side(side).filter((g) => g.state === 'loaded').length; }
    /** The most shots that side can hold. */
    most(side) { return this.side(side).length; }
    /** A shot loaded that side, and its gun run out. */
    ready(side) { return this.shots(side) > 0 && this.wait[side] <= 1e-9; }
    /** How far that side's gun is run out again after a shot, 0 just fired to 1 out. */
    out(side) { return 1 - Math.max(0, this.wait[side]) / GUNS.RUN_OUT; }
    /** Fire that side, if it has a shot and its gun's run out: one of its loaded guns on the board is
        fired (it wants a bucket now, as in Gunnery). */
    fire(side) {
        if (!this.shots(side))
            return 'empty';
        if (this.wait[side] > 1e-9)
            return 'running';
        this.board.fired(this.side(side).find((g) => g.state === 'loaded'));
        this.wait[side] = GUNS.RUN_OUT;
        return 'fired';
    }
    tick(dt) { for (const k of ['L', 'R'])
        this.wait[k] = Math.max(0, this.wait[k] - dt); }
}
/** Why the Gunnery board can't be on her deck just now, if it can't: her oars are out (the rowing
    board's there: one or the other, not both), she's holed (the deck patch comes first), or she's
    waiting in the lock to be pumped up (the quay's Bilge). Under way to a pin she can: she sails
    on while you load. */
export function cantLoad(h) {
    if (h.oars)
        return 'oars';
    if (h.dazed())
        return 'holed';
    if (h.held() === 'up')
        return 'lock';
    return null;
}
