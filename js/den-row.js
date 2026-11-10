/* Pirate Den: the rowing board at sea, her oars run out (RULES.md, "Rowing by mirror strokes", 10
   Nov). TypeScript, compiled to js/den-row.js; tested in tests/den-row.test.ts. The puzzle is
   src/mirror-row.ts (two Bilge boards, port and starboard, every swap made on one made in mirror on
   the other), played as it is: this only keeps the clock and the crew round it. src/den-sail.ts
   rows her by the squares it hands out (Helm.stroke), the more of them waiting the quicker (rowTime,
   src/den-wind.ts); js/den/rowing.js draws it.

   While her oars are out the boards are the steering: the pin stays where you dropped it, a buoy to
   row for, but the pilot doesn't row for her. So she's told which way the pin lies (bearing), and
   which side to pull harder to bring her round to it (pullFor): the side it's on, since more pull
   on the right-hand board turns her right (the user, 10 Nov: "if you pull on the right-hand side,
   it should definitely go right").

   The rowers, one each side, stroke as hard as their side's been pulling lately (the user, 10 Nov:
   a big clear makes that side's pirate go "like crazy"; "I want the funny animation"): `lately` is
   each side's pull, fading over a couple of seconds, and a rower's strokes a second follow it. */
import { KINDS_DEFAULT, MirrorRow } from './mirror-row.js';
import { poseAt } from './den-sail.js';
export const CREW = {
    /** A rower's strokes a second, rowing steady: while she's under way at the oars, or that side's
        pulled lately. */
    STEADY: 0.9,
    /** And this many more a second for every bit of pull that side's had lately: a Vegas on one side
        (15) is over five a second. */
    PER: 0.3,
    /** Seconds the pull lately takes to fade to about a third. */
    FADE: 1.6,
    /** Pull lately at which a side's rower is going like crazy: a two-line combo on one side, or a
        Bingo shared across both. */
    CRAZY: 4,
    /** Squares handed out at once that send her flying: a Vegas shared across both sides is five. */
    FLYING: 4,
};
/** The rowing boards at sea: mirror strokes, and the pull each side's had lately. */
export class RowBoard {
    row;
    lately = { port: 0, starboard: 0 };
    constructor(o = {}) { this.row = new MirrorRow({ kinds: KINDS_DEFAULT, ...o }); }
    /** The next square building up, as fractions (Stroke.building): `ahead` toward a forward (0 to
        1), and `turn` toward a quarter turn, more than nothing to starboard (right), less to port
        (left). A whole one either way and she turns. The compass shows it, and she leans into it
        (leadFor). */
    building() { return this.row.stroke.building(); }
    /** A swap at (r, c) on the port board, made in mirror on the starboard board, rowed now. */
    swap(r, c) {
        const m = this.row.swap(r, c);
        this.felt(m.pull);
        return m;
    }
    /** Pull as a move on the boards would, without the boards (a debug hook). */
    pull(p) {
        const steps = this.row.stroke.row(p);
        for (const s of steps)
            this.row.course.go(s);
        this.felt(p);
        return steps;
    }
    felt(p) { this.lately.port += p.port; this.lately.starboard += p.starboard; }
    /** Time going by: the pull lately fades. */
    tick(dt) {
        const k = Math.exp(-dt / CREW.FADE);
        this.lately.port *= k;
        this.lately.starboard *= k;
    }
    /** A side's rower's strokes a second (`under`: she's being rowed along just now). */
    rate(side, under) {
        const l = this.lately[side];
        return (under || l > 0.05 ? CREW.STEADY : 0) + CREW.PER * l;
    }
    /** That side's rower is going like crazy. */
    crazy(side) { return this.lately[side] >= CREW.CRAZY; }
    /** A side's lead: pull it's made that the other side hasn't matched yet. */
    waiting(side) {
        const s = this.row.stroke.swing;
        return Math.max(0, side === 'starboard' ? s : -s);
    }
}
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
/** Which way a square lies from her, as she's heading: there already, ahead (within about a
    quarter either side), astern, or off to port or starboard. */
export function bearing(p, to) {
    const dc = to[0] - p.c, dr = to[1] - p.r;
    if (!dc && !dr)
        return 'here';
    const ahead = dc * DC[p.d] + dr * DR[p.d], right = dc * DC[(p.d + 1) % 4] + dr * DR[(p.d + 1) % 4];
    if (Math.abs(right) <= ahead / 2)
        return 'ahead';
    if (Math.abs(right) <= -ahead / 2)
        return 'astern';
    return right > 0 ? 'starboard' : 'port';
}
/** The side to pull harder to bring her round toward a square: the side it's on (harder on
    starboard turns her to starboard). Null when it's ahead (pull evenly) or she's there; astern,
    either side turns her. */
export function pullFor(b) {
    if (b === 'port' || b === 'starboard')
        return b;
    return b === 'astern' ? 'either' : null;
}
/* Seeing her answer the oars as the pull builds (TODO.md, 10 Nov: "I'm not seeing any physical
   difference. Like ... I expect the boat to start, tilt it, angling to one side if I'm just rowing
   one side, and it to actually see some sense of movement"). She still moves a whole square at a
   time, but between them she creeps ahead as forward pull builds, swings her bows toward the turn
   that's building, and heels toward it; and when the square's move comes it starts from where she's
   crept to, the lead melting into the move, never jumping back. */
export const LEAN = {
    /** Squares she creeps ahead with a whole square's pull built up (short of handing it out). */
    CREEP: 0.3,
    /** Quarter turns her bows swing with a whole turn's pull built up. */
    YAW: 0.35,
    /** Radians she heels into it then. */
    HEEL: 0.1,
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function leadFor(b) {
    const t = clamp(b.turn, -1, 1);
    return { f: LEAN.CREEP * clamp(b.ahead, 0, 1), y: LEAN.YAW * t, heel: LEAN.HEEL * t };
}
/** Where she's drawn, for a pose (as poseAt gives it: across, out, quarter turns) heading `d`, with
    a lead `k` of the way in. */
export function leaned(p, d, lead, k = 1) {
    return { c: p.c + DC[d] * lead.f * k, r: p.r + DR[d] * lead.f * k, a: p.a + lead.y * k };
}
/** Where she's drawn partway (u, 0 to 1) through a move that began with her leaning `lead`: the
    move as ever (poseAt), the lead fading out as the move goes, so it starts where she'd crept to
    and ends square on. */
export function shownAt(from, m, u, lead, bump = false) {
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    return leaned(poseAt(from, m, u, bump), from.d, lead, 1 - e);
}
