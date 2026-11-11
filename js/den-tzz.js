/* Pirate Den: Tzz's island and her balloon lesson. TypeScript, compiled to js/den-tzz.js; tested in
   tests/den-tzz.test.ts. js/den/balloon-isle.js draws the island and places her from TZZ_CAST (below),
   plain data; the squares are LAY.TZZ in src/den-sail.ts; her lesson's balloons are src/balloons.ts's
   (a show any pair of hands can give), her lines src/lines/tzz.ts.

   The user (10 and 11 Nov, IDEAS.md "Tzz's huge Vegas, on an island of her own"): after Kikkit's
   rambling, "now I wonder if I can find somebody that can explain how to get past all these ...
   whirlpools and winds that makes a bit more sense, or goes on fewer tangents". Tzz is that someone,
   on a little island of her own a hop from Kikkit's, nearer the start: "Have it nearby because you
   want to run in to [Kikkit] first". The first time you sail up off it she gives her lesson, a little
   cutscene (the stretch's one: "we're going to be getting the cinematic from [Tzz] on her balloon
   popping"): she twists a real balloon, squeak by squeak, into Sailing's pieces, a Double ("and
   that's what zooms you over a whirlpool"), then a Bingo, and pops it pop-pop-pop. Then you sail the
   whirlpools yourself. Space off her island, and she shows you again.
   And no one comes aboard (11 Nov): "I don't think they need to be aboard, to be honest. I like Kikkit
   just kind of on her island. It works." She stays on hers. */
import { LAY, SAIL } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { ROUTINES } from './balloons.js';
import { GREET, DOUBLE, BINGO, AFTER } from './lines/tzz.js';
import { PACE } from './chatter.js';
const T = LAY.TZZ;
export const TZZ = {
    /** Its name (never on the captain's map, where the whirlpools' islands are one unnamed point of
        interest: src/den-map.ts's WHIRLPOOLS). */
    NAME: "Tzz's Island",
    /** Within earshot: squares from where she stands. */
    EARSHOT: 4,
};
const key = (c, r) => `${c},${r}`;
const land = new Set(T.LAND.map(([c, r]) => key(c, r)));
/** Her island's first square: where she stands, her board, her still and palm, the lesson's camera and
    a starting point beside it are all placed from it, so the island moves as one (11 Nov: moved
    further from Kikkit's whirlpools). */
const O = T.LAND[0];
/** A square, so far from her island's first square (across, out). */
const off = (c, r) => [O[0] + c, O[1] + r];
/** Her island's squares. */
export const tzzAt = (c, r) => land.has(key(c, r));
/** The water round her island, every square beside it (diagonally too), where her lesson's seen (and
    Space has her show you again). The user (11 Nov): "to actually get the [lesson] to trigger was
    awkward. So you've got to go straight in front": come up beside her island anywhere and it plays. */
export function onTzzLanding(c, r) {
    return !tzzAt(c, r) && T.LAND.some(([x, y]) => Math.abs(x - c) <= 1 && Math.abs(y - r) <= 1);
}
/** Her island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const tzzShore = () => shoreOf(T.LAND);
/** Where she stands, and where her balloons go up beside her (her stand, on the sand of her island's
    shore toward the camera: TZZ_CAST.shot). */
export const TZZ_STANDS = { c: O[0] - 0.05, r: O[1] + 0.25 };
export const inTzzEarshot = (c, r) => Math.hypot(c - TZZ_STANDS.c, r - TZZ_STANDS.r) <= TZZ.EARSHOT;
/** Where the sloop's brought alongside as her lesson begins, wherever round her island you came up:
    beside it, and out of the lesson's shot (the user, 11 Nov: "then the [ship] blocks the view"). */
export const TZZ_MOOR = T.MOOR;
/** Where a starting point puts her (den.html?at=tzz: js/den/menus.js): beside her island's near end,
    facing it, her lesson about to begin. */
export const TZZ_ARRIVE = { c: O[0] - 1, r: O[1] + 1, d: 1 };
/** Her lesson, on a real Sailing board beside her (src/balloons.ts): a Double, then a Bingo (that
    Double with another storey on top), each built the real way, a platform one short and a line whose
    pop drops its partner into the gap, so you see how each is made (the user, 11 Nov: "how to build
    doubles and bingos and things"; and of a first go, "she's just showing bodging moves"), and in each
    she sets the balloons up and you drop the pair that pops it ("it should definitely be like a now you
    try thing"); her first line by whether you've heard Kikkit out (`heard`: you've wondered aloud after
    her ramble). */
export function lesson(heard) {
    return [
        { routine: ROUTINES.double, says: { ...DOUBLE, start: `${heard ? GREET.heard : GREET.plain} ${DOUBLE.start}` }, you: true },
        { routine: ROUTINES.bingo, says: BINGO, you: true },
    ];
}
/** How long each of her lesson's lines is up: quick, breezy patter (a street performer's), still long
    enough to read; the show gives each beat at least this (src/balloons.ts). */
export const lessonSecs = (text) => 0.8 + text.length * 0.055;
/** When her lesson plays: the first time you come up off her island (a cutscene), and again whenever
    you ask (Space there). Not while something else is playing, nor while you're just passing through
    at speed (on a gust, say): once you're off her island and nothing's carrying her. */
export class Visit {
    /** Her lesson's been seen. */
    seen = false;
    /** Each tick: off her island (`off`), and whether you're free to watch (`free`: nothing else playing,
        nothing carrying her). True when her lesson should begin now (the first time you come up). */
    arrive(off, free) {
        if (!off || !free || this.seen)
            return false;
        this.seen = true;
        return true;
    }
    /** Space off her island: again (true), once it's been seen; the first time, it begins as you come up. */
    again(off, free) { return off && free && this.seen; }
}
/** After her lesson, while you're within earshot: a tip now and then, round and round (src/chatter.ts). */
export const TZZ_SAYS = { loop: AFTER };
/* Who's on her island, placed: a character is only config (RULES.md). js/den/balloon-isle.js puts them
   there through the shared pieces: a talking pirate (props-people.js's person(), her Script with
   src/chatter.ts), the balloon show in her hands (balloons.js, src/balloons.ts) and furniture (her
   still). Squares on the sloop's sea (`at`: [c, r]); `yaw` the way they face (0: out to sea). */
export const TZZ_CAST = {
    /** Tzz: her look (PIRATES's), on the sand, a touch big so she reads from the sea, swaying gently,
        turned to you while you're within earshot; her lines. */
    her: { look: 'Tzz', at: [TZZ_STANDS.c, TZZ_STANDS.r], scale: 1.15, yaw: -1.4, idle: 'sway', earshot: TZZ.EARSHOT, says: TZZ_SAYS, gap: PACE.ASIDE },
    /** Her board: the den's own Sailing board on a stand on the sand beside her (balloons.js), its front
        to the camera; `tall`, its picture's height in metres: taller than she is, and the shot closer in
        (the user, 11 Nov: "that puzzle can be a bit bigger. It's very tiny"). */
    board: { at: off(-0.05, 1.1), tall: 3.5 },
    /** Behind her, a copper still (her portrait's); and a palm. */
    props: [{ kind: 'still', at: off(0.75, 0.35), yaw: -1.9 }],
    palm: off(1.15, -0.15),
    /** The camera on her lesson, one shot held throughout (the user, 11 Nov: "She's hidden quite
        behind"): from out on the water toward `from` (squares), at her and her board side by side, `up`
        metres over the sand, `dist` metres off, tilted down `tilt`. From the island's left, the open
        water between hers and the Wedding Isle, with the sloop brought alongside out of it (TZZ_MOOR). */
    shot: { from: off(-3.5, 0.7), dist: 6.3, tilt: 0.1, up: 1.95 },
};
/** Her lesson's shot, on the sea's squares: what it looks at (between her and her board), where the
    camera stands (dist metres back toward `from`), and the half-width it sees either side of straight
    ahead (radians: den.js's camera, 45 degrees high, on a wide screen). */
export function tzzShot() {
    const C = TZZ_CAST, look = [(C.her.at[0] + C.board.at[0]) / 2, (C.her.at[1] + C.board.at[1]) / 2];
    const dc = C.shot.from[0] - look[0], dr = C.shot.from[1] - look[1], n = Math.hypot(dc, dr), k = C.shot.dist * Math.cos(C.shot.tilt) / SAIL.CELL / n;
    return { look, cam: [look[0] + dc * k, look[1] + dr * k], half: Math.atan(Math.tan(Math.PI / 8) * 16 / 9) };
}
/** How far off the shot's straight ahead a square on the sea is (radians, 0 to pi). */
export function offShot(c, r) {
    const { look, cam } = tzzShot(), a = Math.atan2(look[1] - cam[1], look[0] - cam[0]), b = Math.atan2(r - cam[1], c - cam[0]);
    return Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
}
