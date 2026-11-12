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
     faint marks in the rock for anyone looking closely, never pointed out ("Hidden gems, never hinted").
     Stop off it and Space, and Duty Navigation (src/navigation.ts, its one module) stands in front of
     the rock as the night sky; each constellation filled lights its stars on the rock, in their places
     on the wheel. Its run is two small ones dealt as ever (NAV), about a minute's navigating, so it pays
     in a race (the user, 11 Nov: "simplify the duty navigation down to be more competitive"; the evil
     constellation it had first is saved for elsewhere, IDEAS.md). Both lit, the door's outline glows and
     it swings open; open, it stays open that race.
   - A booch turns her about, away from the cliff: she's pushed off, and the board starts again, every
     star on the rock gone dark (Door.booch).
   - The tunnel: a long straight passage under the cliffs, under legs 3 and 4, from the door to the
     fourth spit's far face, out onto leg 5 (EXITS). No wind blows in it but a draught out through the
     door, so no sail or oar gets her in: only a Sailing chain's gust from the door's mouth (OFF, facing
     in), and only a Vegas's carries her along a stretch of it (tunnelGust; as only a Vegas gets her
     over the race's whirlpools, or into the penguins' water). It's the course's biggest shortcut, for
     whoever finds it and can navigate (DOOR.EXITS' savings, tested).
   - It's ours, not the film's: no words to speak, no elvish, just the stars.

   And the tunnel kept connected to the race (12 Nov). The user: "you should always get some benefit from
   going through it, similar to ... any other shortcut. So you then have the choice. You either rejoin
   ... the main leg, or you have the opportunity to go through the Vegases ... in relative peace,
   assuming you're the only one that's taken that route." So it's a run of stretches (EXITS), each ending
   under a sea cave in a spit's far face that comes up onto the course further along: onto leg 3, onto
   leg 4, and the far end onto leg 5. A Vegas from the mouth carries her along the first stretch to the
   first exit, and she waits there in the dark, out of anyone's reach; there she comes up (Tunnel.up) and
   rejoins the leg, keeping what she's gained, or pushes on with the next Vegas (Tunnel.gust). Anything
   less than a Vegas, from the mouth or at an exit, and the draught spills her up out of the last exit
   she passed (the first, from the mouth): never back to the mouth, so going in always gains something.
   Out of a cave she's back among the field, in the open as anywhere. */
import { LAY, SAIL } from './den-sail.js';
import { runFor, RUN } from './sailing.js';
const D = LAY.RACE.DOOR, ROW0 = D.FACE[0][1];
/** Squares from the door's face to the water off exit `k`; seconds her trip there takes in one go, at a
    gust's pace (SAIL.PUSH a square), with a little dark either end as she goes in and comes out. */
const lenOf = (k) => D.EXITS[k].INTO[0][1] - ROW0 + 1;
const tripOf = (k) => Math.round((lenOf(k) * SAIL.PUSH + 2) * 10) / 10;
/** What coming up at each exit saves over sailing the long way from the mouth there, in seconds:
    measured with the helm (tests/den-door.test.ts holds them to it). */
const SAVES = [40, 119];
const FROM = 1, LAST = D.EXITS.length - 1;
const EXITS = D.EXITS.map((e, k) => ({ to: LAY.RACE.STRETCHES.findIndex((s) => s.r === e.INTO[0][1]), len: lenOf(k), trip: tripOf(k), saves: SAVES[k] }));
export const DOOR = {
    /** The door's Navigation: two constellations dealt as ever, two stars then three, the puzzle's own five
        colours: about 50 moves, a minute or so (tools/nav-bots.mjs, DOOR=1), so with the Vegas it still saves
        time in a race. */
    NAV: { sizes: [2, 3] },
    /** How many constellations open it (the run's length). */
    RUN: 2,
    /** The squares a gust has to be worth to carry her along a stretch of the tunnel: a Vegas's. */
    NEED: runFor(RUN.VEGAS),
    /** Its exits, in order: onto leg 3, leg 4, and the far end onto leg 5. */
    EXITS,
    /** The stretch she's on at its mouth (leg 2); and the whole tunnel's, to the far end: the stretch it
        comes up onto, its squares, her trip and what it saves. */
    FROM, TO: EXITS[LAST].to, LEN: EXITS[LAST].len, TRIP: EXITS[LAST].trip, SAVES: EXITS[LAST].saves,
};
/** Off the door: the water off its face, on leg 2, where Space by the rock brings the board up. */
export const offDoor = (c, r) => D.OFF.some(([x, y]) => x === c && y === r);
/** Which of the door's two columns `p` is at the mouth of, facing in (toward the cliff), or -1. */
export function mouthOf(p) {
    return p.d === 0 ? D.OFF.findIndex(([x, y]) => x === p.c && y === p.r) : -1;
}
/** Where exit `k` puts her out, in column `i` (the door's, the tunnel running straight): the water off its
    cave, facing straight on. */
export const exitPose = (k, i) => ({ c: D.EXITS[k].INTO[i][0], r: D.EXITS[k].INTO[i][1], d: 0 });
/** What a gust from `from` does at the door: null if it isn't the tunnel's (not at its mouth facing in,
    or the door's shut: the cliff stops it as any rock does, src/den-sailing.ts). With a Vegas's run or
    more, along the first stretch to wait at its exit ('on'); with less, carried in and the draught spills
    her up out of that first exit ('out'). */
export function tunnelGust(open, from, run) {
    const i = mouthOf(from);
    if (!open || i < 0 || run <= 0)
        return null;
    return along(-1, i, run);
}
/** A gust in the tunnel from exit `at` (-1 the mouth), in column `i`: a Vegas's carries her on to the next
    exit (out of the far end, if that's the last); less, and she's spilled out of exit `at` (the first,
    from the mouth). */
function along(at, i, run) {
    const len = (k) => (k < 0 ? 0 : EXITS[k].len);
    if (run >= DOOR.NEED) {
        const k = at + 1;
        return { way: k === LAST ? 'out' : 'on', exit: k, went: len(k) - len(at), to: exitPose(k, i) };
    }
    const k = Math.max(0, at);
    return { way: 'out', exit: k, went: Math.min(run, len(k) - len(at)), to: exitPose(k, i) };
}
/** Where she is in the tunnel: waiting inside at an exit (`at`, -1 not in it), in the door's column she
    came in by. One a racer (js/den/door.js, yours). */
export class Tunnel {
    at = -1;
    col = 0;
    /** A gust at the door (tunnelGust): in she goes, waiting at the first exit, or spilled out of it. */
    enter(open, from, run) {
        const m = tunnelGust(open, from, run);
        if (!m)
            return null;
        this.col = mouthOf(from);
        this.at = m.way === 'on' ? m.exit : -1;
        return m;
    }
    /** Waiting at an exit, a gust: a Vegas's on to the next (out of the far end), less and out of this one. */
    gust(run) {
        if (this.at < 0 || run <= 0)
            return null;
        const m = along(this.at, this.col, run);
        this.at = m.way === 'on' ? m.exit : -1;
        return m;
    }
    /** Waiting at an exit, up she comes out of it, onto the leg above. */
    up() {
        if (this.at < 0)
            return null;
        const m = { way: 'out', exit: this.at, went: 0, to: exitPose(this.at, this.col) };
        this.at = -1;
        return m;
    }
    /** Inside, waiting at an exit. */
    inside() { return this.at >= 0; }
    reset() { this.at = -1; this.col = 0; }
}
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
