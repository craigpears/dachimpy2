/* Pirate Den: the starlit door, on the sloop race's course. TypeScript, compiled to js/den-door.js;
   tested in tests/den-door.test.ts. js/den/door.js draws it and plays it at sea (the marks in the rock,
   the Navigation board in front of it, the stars lit on it, the door swinging open, the tunnel and her
   trip through it); its squares are LAY.RACE.DOOR in src/den-sail.ts.

   The user (11 Nov), of Duty Navigation finding hidden ways: "the only thing that comes to mind is in
   [The Fellowship of the Ring] ... going into the mines of Moria, and he's ... doing the thing to reveal
   the door by starlight. Can we do a similar kind of thing and use duty navigation as the puzzle for how
   you find the door and have it discoverable in some way similar to the carpentry spots?" And of the
   tunnel behind it: "that unlocks a really long, straight passage. But it requires some like more
   hardcore puzzling ... you're going underneath the cavern, but you've got to do like big Vegas, like
   a big Vegas to get through it in sailing".

   So:
   - The door: a stretch of plain cliff on the second spit, off leg 2 (FACE, the water off it OFF), with
     faint marks in the rock for anyone looking closely (built as a hidden gem; since 12 Nov the starter
     names it, and it has a cheat and ?at=door: RULES.md, "No hidden gems in the proof of concept").
     Stop off it and Space, and Duty Navigation (src/navigation.ts, its one module) stands in front of
     the rock as the night sky; each constellation filled lights its stars on the rock, in their places
     on the wheel. Its run is one of three stars dealt as ever (NAV), about forty seconds' navigating, so it pays
     in a race (the user, 11 Nov: "simplify the duty navigation down to be more competitive"; the evil
     constellation it had first is saved for elsewhere, IDEAS.md). It lit, the door's outline glows and
     it swings open; open, it stays open that race.
   - A booch turns her about, away from the cliff: she's pushed off, and the board starts again, every
     star on the rock gone dark (Door.booch).
   - The tunnel: a straight passage under the second spit, from the door to a cleft in its far face, onto
     leg 3 (EXITS). Opened, the door carries her through (through), and up the cleft she comes.
   - It's ours, not the film's: no words to speak, no elvish, just the stars.

   Back to simple, Navigation only (12 Nov). The user: "I love some of the animation and the styles on it,
   but I think it needs just probably to go back to being simple... nav only shortcut that takes you just like
   one step through, and maybe can be tuned to be a bit trickier. Because I could just imagine someone good at
   doing Vegas, it takes you out of the race. It's too isolated otherwise." So the door's Navigation is the
   whole puzzle: opened, it carries her straight through the tunnel, one stretch under the second spit, and up
   its cleft onto leg 3 (EXITS: one), back among the field. No Sailing clear to get in, no Vegas under the
   cleft, no far end onto leg 5 (the stretches of the day before, and their Sailing board in the dark, are
   gone). Its Navigation sized (NAV) so what it saves is in proportion with the other shortcuts: the
   simulation decides (RACE.md §8). */
import { LAY, SAIL } from './den-sail.js';
const D = LAY.RACE.DOOR, ROW0 = D.FACE[0][1];
/** Squares from the door's face to the water off its exit; seconds her trip there takes in one go, at a
    gust's pace (SAIL.PUSH a square), with a little dark either end as she goes in and comes out. */
const lenOf = (k) => D.EXITS[k].INTO[0][1] - ROW0 + 1;
const tripOf = (k) => Math.round((lenOf(k) * SAIL.PUSH + 2) * 10) / 10;
/** What coming up at its exit saves over sailing the long way from the mouth there, in seconds: measured
    with the helm (tests/den-door.test.ts holds it to it). */
const SAVES = [40];
const FROM = 1;
const EXITS = D.EXITS.map((e, k) => ({ to: LAY.RACE.STRETCHES.findIndex((s) => s.r === e.INTO[0][1]), len: lenOf(k), trip: tripOf(k), saves: SAVES[k] }));
export const DOOR = {
    /** The door's Navigation: one constellation of three stars, dealt as ever, the puzzle's own five colours,
        about 34 moves (tools/nav-bots.mjs, DOOR=1). Set by the simulation (12 Nov): with the tunnel one stretch,
        the door saves about 40 s, and its Navigation has to be about that long to be in proportion with the
        rest. Two small ones (the day before's, 2 and 3 stars, about 53 moves) left the door winning 3% of its
        races, a constellation more 2%; one of three stars, 18% (fair 25%). The user's "a bit trickier" is a
        three-star one to start rather than a two. */
    NAV: { sizes: [3] },
    /** How many constellations open it (the run's length). */
    RUN: 1,
    /** Its exit (one: onto leg 3). */
    EXITS,
    /** The stretch she's on at its mouth (leg 2); and its exit's: the stretch it comes up onto, its squares,
        her trip and what it saves. */
    FROM, TO: EXITS[0].to, LEN: EXITS[0].len, TRIP: EXITS[0].trip, SAVES: EXITS[0].saves,
};
/** Off the door: the water off its face, on leg 2, where Space by the rock brings the board up. */
export const offDoor = (c, r) => D.OFF.some(([x, y]) => x === c && y === r);
/** Which of the door's two columns she's off (any way she faces), or -1. */
export const doorColumn = (p) => D.OFF.findIndex(([x, y]) => x === p.c && y === p.r);
/** Where its exit puts her out, in column `i` (the door's, the tunnel running straight): the water off its
    cleft on leg 3, facing straight on. */
export const exitPose = (i) => ({ c: D.EXITS[0].INTO[i][0], r: D.EXITS[0].INTO[i][1], d: 0 });
export const through = (i) => ({ exit: 0, went: EXITS[0].len, to: exitPose(Math.max(0, i)) });
/** The door: the stars lit on the rock (each constellation's marks as it went), how far through the
    run, and whether it's open. One a race (a new race, a shut door). */
export class Door {
    lit = [];
    open = false;
    /** A constellation filled on its board: its stars lit on the rock. True when that was the last of
        the run, and the door opens. */
    done(d) {
        if (this.open || d.booched)
            return false;
        this.lit.push(d.marks.map((m) => ({ ...m })));
        if (this.lit.length >= DOOR.RUN)
            this.open = true;
        return this.open;
    }
    /** A booch: every star on the rock dark, the run to start again; and where she's pushed off to,
        turned about away from the cliff, from `at` (off its face). */
    booch(at) {
        this.lit = [];
        return { c: at.c, r: at.r - 1, d: 2 };
    }
    /** A new race: shut again, dark. */
    reset() { this.lit = []; this.open = false; }
}
