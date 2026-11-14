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
   and Dalnoth come next: IDEAS.md, "The captain's map".)

   Then the sea was built, and the map had to match it (the user, 10 Nov: "the map obviously needs
   updating as well now, because we've added a lot of stuff. Obviously, don't show off the secrets,
   but certainly, like, even just like the checkpoint or something should, like, the line, it should
   match up with what is actually on the map at the moment a little bit"). So it's drawn from the
   sea's own lay (LAY in src/den-sail.ts), square for square: your cove and beach at the bottom, the
   trade winds out of it and the main shipping lane on to the imperial checkpoint's line across the
   sea, its gate and guns, the reef out to the right and the headland on the left, and beyond it the
   open sea and the old wreck, the X on it. The rumour's the same. Nothing secret is on it ("Hidden
   gems, never hinted", RULES.md): the cliffs are drawn whole, with no canal, locks, harbour or cove
   cut into them, nothing off the edge of the sea (the lagoon), and no word of the oars or of how to
   get past the checkpoint: that's yours to find. The ways past Dalnoth himself (sword, gun, flooding
   him out) come back onto it when his hideout's built (STORY.md). */
import { LAY, SAIL } from './den-sail.js';
import { ISLE, isleShore, shoreOf } from './den-isle.js';
import { KIKKIT, kikkitShore } from './den-kikkit.js';
import { tzzShore } from './den-tzz.js';
import { multibellaShore } from './den-multibella.js';
import { empireShore } from './den-imperial.js';
import { SMUGGLERS } from './den-smugglers.js';
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
/** What the captain scrawled across it (src/lines/dalnoth.ts). */
export { RUMOUR } from './lines/dalnoth.js';
/** The sheet (0 to 1 across from the left, down from the top): the sea's board between U0 and U1
    across, and between V0 (its far edge, out to sea) and V1 (its near edge, the shore) down. */
export const SHEET = { U0: 0.02, U1: 0.98, V0: 0.06, V1: 0.78 };
/** Where a square of the sea falls on the sheet. */
export function onMap([c, r]) {
    const S = SHEET;
    return [S.U0 + (c + 0.5) / SAIL.COLS * (S.U1 - S.U0), S.V1 - (r + 0.5) / SAIL.CHARTED.ROWS * (S.V1 - S.V0)];
}
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
/** The den: its gate in the wall, at the den's middle (across, the column the den's middle falls
    in: SAIL.X0 is the board's left edge), back up the beach from the sea's edge (SAIL.Z0). */
const DEN = [-SAIL.X0 / SAIL.CELL - 0.5, SAIL.Z0 / SAIL.CELL - 0.5];
/** What the map shows, all from the sea's lay (LAY). */
export const CHART = {
    /** Your den, in its cove at the bottom; the shore's along the board's near edge. */
    den: DEN,
    /** The trade winds: out from off the beach, the main shipping lane on to the checkpoint, and home. */
    lanes: LAY.LANES.map(({ at, d, n }) => ({ from: [...at], to: [at[0] + DC[d] * (n - 1), at[1] + DR[d] * (n - 1)], d })),
    /** The imperial checkpoint's line across the sea: from the headland's end to the reef, its gate
        under the gatehouse between its piers, a gun on a bastion either side; and the reef on from it
        to the edge of the sea. */
    checkpoint: {
        row: LAY.CHECKPOINT.ROW,
        gate: LAY.CHECKPOINT.GATE,
        piers: LAY.CHECKPOINT.PIERS.map(([c]) => c),
        guns: LAY.CHECKPOINT.GUNS.map(([c]) => c),
        from: LAY.CHECKPOINT.HEADLAND.c1 + 1,
        to: LAY.CHECKPOINT.REEF.c0 - 1,
    },
    reef: { row: LAY.CHECKPOINT.ROW, from: LAY.CHECKPOINT.REEF.c0, to: LAY.CHECKPOINT.REEF.c1 },
    /** The high ground on the left, drawn whole, as it looks from the sea: the cliffs, and the
        checkpoint's headland on from them (squares, inclusive). Whatever's cut into it isn't shown. */
    land: [
        { c0: LAY.PLATEAU.c0, c1: LAY.PLATEAU.c1, r0: LAY.PLATEAU.r0, r1: LAY.PLATEAU.r1 },
        { ...LAY.CHECKPOINT.HEADLAND },
    ],
    /** Rocks to steer by: along the lanes' sides, and out on the far water. (Not the scattered ones,
        a different sea every game, nor the harbour's.) */
    rocks: [...LAY.SIDES, ...LAY.FAR].map(([c, r]) => [c, r]),
    /** The old wreck beyond the checkpoint, the X on it. */
    wreck: [...LAY.WRECK],
    /** Mischievious's isle (11 Nov), off to the right of the lanes, in plain sight from them, so it's
        on the map, named: its shore (corners, on the squares' edges: src/den-isle.ts), its jetty's
        square, and where her chapel's ruin stands on it. (What's on there isn't said.) */
    isle: {
        shore: isleShore().map(([c, r]) => [c - 0.5, r - 0.5]),
        jetty: [...LAY.ISLE.JETTY],
        chapel: [19.3, 11.9],
    },
    /** Kikkit's island (11 Nov), at the reef's near end, in plain sight, so on the map and named; the
        rocks round her whirlpools and Vegas Island with the reef's (the whirlpools and their winds aren't drawn: what's
        there is for you to find); and Vegas Island, the penguins', drawn only once you've been there
        (js/den/map.js: "hidden gems are never hinted"). */
    kikkit: {
        shore: kikkitShore().map(([c, r]) => [c - 0.5, r - 0.5]),
        reef: LAY.KIKKIT.REEF.map(([c, r]) => [c, r]),
        vegas: shoreOf(LAY.KIKKIT.VEGAS).map(([c, r]) => [c - 0.5, r - 0.5]),
    },
    /** Tzz's island (11 Nov), a hop from Kikkit's, in plain sight, so it's on the map: drawn, never
        named (the whirlpools' islands are one point of interest: WHIRLPOOLS). */
    tzz: { shore: tzzShore().map(([c, r]) => [c - 0.5, r - 0.5]) },
    /** Multibella's island (14 Nov), off to the right of the den, her wolf den's hut on it: drawn, never named, as Tzz's. */
    multibella: { shore: multibellaShore().map(([c, r]) => [c - 0.5, r - 0.5]) },
    /** Port Decorum (11 Nov), the imperial island past the checkpoint, where the shipping lane leads: no
        secret, so it's drawn, one point of interest (IMPERIAL), never named, nothing said of what's there. */
    empire: { shore: empireShore().map(([c, r]) => [c - 0.5, r - 0.5]) },
    /** Helium's island (12 Nov), past the checkpoint by the smugglers' rocks: drawn, never named, as Tzz's
        is; and the rocks shutting their corner's bottom off (14 Nov), drawn with the reef's. */
    helium: {
        shore: shoreOf(LAY.HELIUM.LAND).map(([c, r]) => [c - 0.5, r - 0.5]),
        rocks: LAY.HELIUM.ROCKS.map(([c, r]) => [c, r]),
    },
    /** The rocks shutting off Port Decorum's right-hand side and its back (11 Nov), drawn whole (`whole`:
        the run of water behind them and its cove drawn as rock too, as the cliffs are drawn without their
        canal) till you've found the smugglers' beach behind them; then the rocks alone (`rocks`), the
        beach (`beach`) and its name (SMUGGLERS_NOTE), as Vegas Island is (js/den/map.js). */
    smugglers: {
        rocks: LAY.SMUGGLERS.ROCKS.map(([c, r]) => [c, r]),
        whole: [...LAY.SMUGGLERS.ROCKS, ...LAY.SMUGGLERS.RUN, ...LAY.SMUGGLERS.COVE].map(([c, r]) => [c, r]),
        beach: shoreOf(LAY.SMUGGLERS.BEACH).map(([c, r]) => [c - 0.5, r - 0.5]),
    },
};
/** Where the X is: on the old wreck beyond the checkpoint. */
export const X_AT = [...LAY.WRECK];
/** The way the captain's dotted it: out of the den, up the trade winds and the shipping lane to
    the checkpoint's gate, through it and on to the X. (How you get through is for you to find.) */
export const ROUTE = [
    DEN,
    CHART.lanes[0].from,
    CHART.lanes[0].to,
    [...LAY.JUNCTION],
    CHART.lanes[1].to,
    [LAY.CHECKPOINT.GATE, LAY.CHECKPOINT.ROW],
    [LAY.CHECKPOINT.GATE, LAY.CHECKPOINT.ROW + 2],
    [(LAY.CHECKPOINT.GATE + LAY.WRECK[0]) / 2 + 0.5, (LAY.CHECKPOINT.ROW + LAY.WRECK[1]) / 2 + 1.5],
    X_AT,
];
/** Port Decorum, the imperial island, as one point of interest: whose waters, never its name. */
export const IMPERIAL = { label: 'Imperial waters', at: [19.4, 29.4] };
/** Kikkit's whirlpools and the islands by them, on the map as one point of interest: never whose. */
export const WHIRLPOOLS = { label: 'Whirlpools', note: 'another way through?', at: [16.9, 14.6] };
export const NOTES = [
    { label: 'Yer den', at: [DEN[0] - 2.2, DEN[1] + 1.5] },
    { label: 'The trade winds', at: [(CHART.lanes[0].from[0] + CHART.lanes[2].from[0]) / 2, CHART.lanes[0].from[1] + 2.2], along: true },
    { label: 'Shipping lane', at: [CHART.lanes[1].from[0] - 0.75, LAY.JUNCTION[1] + 4], along: true },
    { label: 'The Imperial checkpoint', note: 'Pirates not welcome', at: [LAY.CHECKPOINT.REEF.c0 + 4, LAY.CHECKPOINT.ROW - 1.4] },
    { label: 'Reef', at: [LAY.CHECKPOINT.REEF.c1 - 2, LAY.CHECKPOINT.ROW + 1.1] },
    { label: 'Headland', at: [(LAY.CHECKPOINT.HEADLAND.c0 + LAY.CHECKPOINT.HEADLAND.c1) / 2, LAY.CHECKPOINT.HEADLAND.r0 + 1] },
    { label: 'Cliffs', at: [(LAY.PLATEAU.c0 + LAY.PLATEAU.c1) / 2, (LAY.PLATEAU.r0 + LAY.PLATEAU.r1) / 2] },
    // (out to the right of Kikkit's whirlpools since 11 Nov: where it was, Vegas Island is, once found)
    { label: 'The open sea', at: [LAY.CHECKPOINT.REEF.c1 - 2, LAY.CHECKPOINT.ROW + 4] },
    { label: 'An old wreck', note: 'aground on a sandbar', at: [LAY.WRECK[0] + 5.5, LAY.WRECK[1] - 0.2] },
    { label: ISLE.NAME, at: [17.4, 8.2] }, // (under it, clear of the compass)
    // The whirlpools' islands, Kikkit's and Tzz's, as one point of interest, unnamed (the user, 11 Nov:
    // "I don't want [Kikkit's] Island or ... the detailed individual ones ... the whole point of that map
    // is here's a point of interest. It's ... a different way through. That's about all ... That's for
    // you to discover").
    { label: WHIRLPOOLS.label, note: WHIRLPOOLS.note, at: WHIRLPOOLS.at },
    { label: IMPERIAL.label, at: IMPERIAL.at },
];
/** Vegas Island's name, written once you've been there (js/den/map.js). */
// (under the rocks round it: 11 Nov)
export const VEGAS_NOTE = { label: KIKKIT.VEGAS, at: [15.6, 26.2] };
/** The smugglers' beach's name, written once you've been there (js/den/map.js): beside its rocks. */
export const SMUGGLERS_NOTE = { label: SMUGGLERS.NAME, at: [21.6, 32.2] };
