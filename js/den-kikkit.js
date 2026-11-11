/* Pirate Den: Kikkit's island and her whirlpools, a way through the reef. TypeScript, compiled to
   js/den-kikkit.js; tested in tests/den-kikkit.test.ts. js/den/whirlpools.js draws them, and places
   her and her familiars from KIKKIT_CAST (below), plain data; the squares are LAY.KIKKIT in
   src/den-sail.ts, a whirlpool's rules src/den-whirl.ts (the helm plays them), and a gust's way over
   them gustPath's (src/den-sailing.ts).

   The user (11 Nov), of the map's ways past the checkpoint: "maybe that will be a good place for it
   to be, is that's a way for you to get through the reef. And there's a penguin in the middle, so it
   gives you a bit of a reward", and then "Maybe a small combo gets you through the reef, with the
   penguins being the bigger prize after." And: "definitely a Vegas to get fully through to the
   penguins ... you've got relatively small, easy platforms" (so Sailing's board is an easy one in her
   waters: KIKKIT.WATERS, src/sailing.ts's EASY).

   Then (11 Nov) the first go "only spun her and flung her back": "Whirlpools are basically four tiles
   ... each one ... rotates the ship and sends it to the opposite corner", and some have "a corner
   missing where there's some winds, so you kind of get caught in the whirlpool and it sends you to the
   opposite corner, which then gets you on some winds and sends you back". YPPedia's rules win.

   So, sailed with the Sailing puzzle's gusts (R, Sailing), from the passage's mouth just off her
   island, facing the reef's gap (LAY.KIKKIT says the squares):
   - a plain clear stops in the gap, and its wind blows her into a whirlpool: it turns her a quarter
     and sends her to its far corner, the missing one, whose wind takes her back up through the reef,
     along her shore and into the mouth, just as she started (five lefts and a right: turnsOf);
   - a Double carries her clean over the gap, out past the reef: the third way past the checkpoint;
   - a Triple, a Bingo or a Donkey further, onto the winds past it, into the other whirlpool, and
     home the same way;
   - only a Vegas over all of it, to the penguins.
   Her own moves into any of it, and they have her the same way. The pilot never takes her in. */
import { Helm, LAY, Sea } from './den-sail.js';
import { carry } from './den-sailing.js';
import { shoreOf } from './den-isle.js';
import { RAMBLE, TANGENTS, BACK, BACK_OUT } from './lines/kikkit.js';
import { AFTER_KIKKIT } from './lines/you.js';
const K = LAY.KIKKIT;
export const KIKKIT = {
    /** Its name on the captain's map; and the penguins' island's, once you've been (the user named it,
        11 Nov: "reached only by a Vegas"). */
    NAME: 'Kikkit\'s Island',
    VEGAS: 'Vegas Island',
    /** Her waters: where Sailing's board is the whirlpools' own easy one (src/sailing.ts, EASY). */
    WATERS: { c0: 13, c1: 21, r0: 14, r1: 24 },
    /** Within earshot: squares from where she stands on her island. Once she's told her ramble she
        never stops talking while you're this near (the user, 11 Nov: "you're sailing past, you've not
        even engaged, and she's going on these tangents"). */
    EARSHOT: 7,
};
const key = (c, r) => `${c},${r}`;
const land = new Set(K.LAND.map(([c, r]) => key(c, r)));
/** Her island's squares. */
export const kikkitAt = (c, r) => land.has(key(c, r));
/** The water off her island's shore, where she hails you (and you her). */
export function onKikkitLanding(c, r) {
    const L = K.LANDING;
    return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !kikkitAt(c, r);
}
/** In her waters: Sailing's board is the easy one here. */
export function inKikkitWaters(c, r) {
    const W = KIKKIT.WATERS;
    return c >= W.c0 && c <= W.c1 && r >= W.r0 && r <= W.r1;
}
/** Where she stands on her island (KIKKIT_CAST places her there). */
export const KIKKIT_STANDS = { c: 18.35, r: 17.35 };
/** Within earshot of her: she keeps talking. */
export const inEarshot = (c, r) => Math.hypot(c - KIKKIT_STANDS.c, r - KIKKIT_STANDS.r) <= KIKKIT.EARSHOT;
/** Her island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const kikkitShore = () => shoreOf(K.LAND);
/** The passage's mouth, the reef's gap, the open water past it, and the penguins' water. */
export const MOUTH = { ...K.MOUTH };
export const GAP = [...K.GAP];
export const OUT = [...K.OUT];
export const PENGUINS = [...K.PENGUINS];
/** A square of the passage: a whirlpool's (its missing corner too) or one of its winds. The
    checkpoint knows she crossed the reef by them (src/den-checkpoint.ts). */
const passage = new Set([
    ...K.WHIRLS.flatMap(({ at: [c, r] }) => [key(c, r), key(c + 1, r), key(c, r + 1), key(c + 1, r + 1)]),
    ...K.WINDS.map(([c, r]) => key(c, r)),
]);
export const passageAt = (c, r) => passage.has(key(c, r));
/** The turns she makes, as Kikkit counts them, sailing a gust of `run` squares from the mouth: each
    quarter turn left (the winds turn her the way they blow), right, or a whirl's quarter right (a
    twirl), and about-turns (backflips); and whether she's back as she started, at the mouth. */
export function turnsOf(run = 1) {
    const h = new Helm(new Sea(1), MOUTH), n = { lefts: 0, rights: 0, twirls: 0, backflips: 0 };
    carry(h, run);
    for (let t = 0; t < 40; t += 0.05) {
        for (const e of h.tick(0.05)) {
            if (e.kind !== 'push')
                continue;
            const q = (((e.to.d - e.from.d) % 4) + 4) % 4;
            if (q === 3)
                n.lefts++;
            else if (q === 2)
                n.backflips++;
            else if (q === 1)
                n[e.whirl ? 'twirls' : 'rights']++;
        }
    }
    const p = h.pose;
    return { ...n, home: p.c === MOUTH.c && p.r === MOUTH.r && p.d === MOUTH.d };
}
/** The passage's watch. Each time she does it. */
export class Whirlpools {
    /** Through the reef, and at the penguins, ever. */
    through = false;
    penguins = false;
    /** A whirlpool has her just now, its whirls and winds still carrying her: and whether she'd got
        out past the reef first. */
    has = null;
    /** The last time it let her go, whether she'd got out past the reef first. */
    backOut = false;
    crossing = false;
    past = false;
    atPenguins = false;
    /** A tick's events and the helm after them. */
    watch(events, h) {
        const out = [], ROW = LAY.CHECKPOINT.ROW;
        for (const e of events) {
            if (e.kind !== 'push' && e.kind !== 'move')
                continue;
            // Through: a gust's carrying her over the gap and on, out past the reef.
            if (e.kind === 'push' && e.whirl) {
                this.crossing = false;
                if (!this.has) {
                    this.has = { out: this.past };
                    out.push('caught');
                }
            }
            else if (e.kind === 'push' && e.gust && e.to.c === GAP[0] && e.to.r === GAP[1])
                this.crossing = true;
            else if (this.crossing && e.to.r > ROW) {
                this.crossing = false;
                this.through = this.past = true;
                out.push('through');
            }
            if (e.to.r < ROW)
                this.crossing = this.past = false;
        }
        const p = h.pose;
        // Let go: nothing more carrying her, and not about to whirl again.
        const settled = (!h.cur || !!h.cur.done) && !h.rides.length && !h.gusts.length && !h.whirling();
        if (this.has && settled) {
            this.backOut = this.has.out;
            this.has = null;
            this.past = false;
            out.push('back');
        }
        const there = p.c === PENGUINS[0] && p.r === PENGUINS[1];
        if (there && !this.atPenguins) {
            this.penguins = true;
            out.push('penguins');
        }
        this.atPenguins = there;
        return out;
    }
}
/* Who's on her island, placed: a character is only config (RULES.md, "A character is only config").
   js/den/whirlpools.js puts them there through the shared pieces, a talking pirate (props-people.js's
   person(), saying her Script with src/chatter.ts) and creatures (creatures.js's creature()), and has
   nothing of hers in code. Squares are on the sloop's sea (`at`: [c, r]); `on` is whose ground they
   stand on, her island's sand or Vegas Island's floe. */
/** What she says, and in what order (src/chatter.ts): the first time you sail up, her ramble (the real
    way through her whirlpools); then her tangents, round and round for ever while you're within
    earshot, hailed or not, the ramble retold after the last (it's the real way, after all); and spat
    back by the winds, a new line each time, over whatever she was saying ("Too many lefts-eh!" first:
    `back`; `backOut` if you'd got out past the reef first). */
export const KIKKIT_SAYS = { intro: RAMBLE, loop: TANGENTS, retell: true, asides: { back: BACK, backOut: BACK_OUT }, afterIntro: 4 };
/** Once she's told her whole ramble, the first time, you wonder aloud in the quiet after it (her
    `afterIntro`: KIKKIT_CAST's `then`, src/lines/you.ts), whether anyone could explain it with fewer
    tangents (IDEAS.md, "Nearer the start, the sensible one after Kikkit", settled 11 Nov: it's your
    pirate reacting to her, and it never says where anyone is). Once a voyage: not before she's told it
    all, and never again after. */
export const youWonder = (her, said) => her.told && !said;
export const KIKKIT_CAST = {
    /** Kikkit: her look (PIRATES's), on the sand by the whirlpools' mouth, a touch big so she reads from
        the sea (as Dignity), looking out (`yaw`) or at you when you're within earshot (`earshot`,
        squares), swaying a bit drunk and swigging from her jug, her hands going as she talks; and `then`,
        what you say once she's told her whole ramble (youWonder). */
    her: { look: 'Kikkit', at: [KIKKIT_STANDS.c, KIKKIT_STANDS.r], on: 'sand', scale: 1.15, yaw: -0.9, idle: 'tipsy', earshot: KIKKIT.EARSHOT, says: KIKKIT_SAYS, then: AFTER_KIKKIT },
    /** Her familiars about her, each doing its own thing ("the familiar version of a cat lady"); and
        the penguins on Vegas Island, one of them in a balaclava with a sack, up to something. */
    creatures: [
        { kind: 'parrot', col: 'green', col2: 'red', at: [19.1, 16.6], on: 'sand', scale: 2.2, yaw: -0.6, idle: 'hop', rate: 1, height: 0.35 },
        { kind: 'octopus', col: 'violet', at: [18.6, 18.1], on: 'sand', scale: 2.2, yaw: 0.1, idle: 'perch' },
        { kind: 'squirrel', col: 'grey', at: [19.6, 17.5], on: 'sand', scale: 2.2, yaw: 0.8, idle: 'hop', rate: 1.4, height: 0.35 },
        { kind: 'bat', col: 'black', at: [20.3, 17.2], on: 'sand', scale: 2.2, yaw: 1.5, idle: 'flutter', r: 1.6, h: 1.9, speed: 1.3, bob: 0.5 },
        { kind: 'krakling', col: 'aqua', at: [20.6, 18.4], on: 'sand', scale: 2.2, yaw: 2.2, idle: 'perch' },
        { kind: 'parrot', col: 'blue', col2: 'yellow', at: [20.9, 16.9], on: 'sand', scale: 2.2, yaw: 2.9, idle: 'hop', rate: 0.8, height: 0.35 },
        { kind: 'monkey', col: 'tan', at: [19.4, 18.6], on: 'sand', scale: 2.2, yaw: 3.6, idle: 'hop', rate: 1.2, height: 0.35 },
        ...[[15.1, 23.1], [14.9, 23.8], [15.3, 24.4], [15.9, 24.0], [16.3, 24.4]].map(([c, r], i) => ({ kind: 'penguin', at: [c, r], on: 'floe', scale: 1.6, yaw: i * 1.7, idle: 'potter' })),
        /** (Caught in the act when you first reach them: js/den/whirlpools.js.) */
        { kind: 'penguin', balaclava: true, sack: true, at: [15.3, 23.55], on: 'floe', scale: 1.6, yaw: 0, idle: 'sneak', span: 1.2, id: 'sneak' },
    ],
};
