/* Pirate Den: the smugglers' beach, Port Decorum's back way in. TypeScript, compiled to
   js/den-smugglers.js; tested in tests/den-smugglers.test.ts. js/den/smugglers.js draws it and places
   what's on it from SMUGGLERS_CAST (below), plain data; its squares are LAY.SMUGGLERS in src/den-sail.ts
   (the rocks, the run of water behind them, its cove and the beach), what's said there src/lines/you.ts.

   The user (11 Nov): "for the Imperial Outpost, the kind of beach, so the back way in, I think that will
   be better, like, accessed far through those whirlpools by, you know, [Kikkit]. I think having it one
   open area is a bit off. Like, I do think, like, Penguin Island, and then you have the, you know,
   Smuggler's Beach there. So that you can go sell the rum made by Helium ... once we tie that in. So
   yeah, redesign the fort so that, you know, there's some rocks and whatnot blocking some back entry
   where that, you know, with some kind of, you know, Smuggler's Beach, you know, obviously for that
   mechanic to plug into later."

   So rocks shut off Port Decorum's right-hand side and its back from the open sea, and behind them a
   narrow run of water goes from beside the penguins' water (a Vegas over Kikkit's whirlpools is the one
   way there) down past the island to a little cove at its back, behind the warehouse: a sandy beach, a
   lantern, crates and barrels under a tarp, a rowboat drawn up. Nothing to do there yet: smuggling, and
   Helium's rum, plug in later, here. A hidden gem (RULES.md, "Hidden gems, never hinted"): nothing names
   it before you're there, and it's on the captain's map only once you've been (a hidden place found:
   src/den-finds.ts). */
import { LAY } from './den-sail.js';
const S = LAY.SMUGGLERS;
export const SMUGGLERS = {
    /** Its name, once you've found it: on the captain's map, and at the foot of the screen in its cove. */
    NAME: 'Smugglers\' beach',
};
const key = (c, r) => `${c},${r}`;
const cove = new Set(S.COVE.map(([c, r]) => key(c, r)));
const run = new Set(S.RUN.map(([c, r]) => key(c, r)));
const all = new Set([...S.RUN, ...S.COVE, ...S.BEACH, ...S.ROCKS].map(([c, r]) => key(c, r)));
/** In its cove, off the beach: where you've found it. */
export const inSmugglersCove = (c, r) => cove.has(key(c, r));
/** On the run of water down to it, behind the rocks. */
export const onSmugglersRun = (c, r) => run.has(key(c, r));
/** Any square of it: its rocks, the run, the cove, the beach (none of them Port Decorum's own water:
    src/den-imperial.ts, onEmpireLanding). */
export const smugglersAt = (c, r) => all.has(key(c, r));
/** Where a starting point (?at=smugglers) puts her: in the cove, bows to the beach. */
export const SMUGGLERS_OFF = { c: 17, r: 31, d: 3 };
/** Coming into the cove: found, said once a voyage, the first time (the map keeps it found for good). */
export class Landfall {
    seen = false;
    /** Each tick: in the cove (`there`), free to say it (`free`: nothing else playing). True the first time. */
    arrive(there, free) {
        if (!there || !free || this.seen)
            return false;
        this.seen = true;
        return true;
    }
}
/** What's on the beach, placed (a thing in the world is only config): each a shared piece of furniture
    (js/den/furniture.js, by its kind), at a square of the sloop's sea (`at`: [c, r], fractions allowed),
    turned `yaw` (radians: 0 faces back toward the den, as furniture faces +z). The beach is BEACH's square, and spills a little into
    the cove's shallows. */
export const SMUGGLERS_CAST = {
    /** The sand: its middle, and how far it runs across and out (squares). */
    sand: { at: [15.0, 31.45], w: 1.1, d: 0.95 },
    pieces: [
        { kind: 'tarpPile', at: [14.85, 31.1], yaw: 0.4 },
        { kind: 'barrel', at: [15.35, 30.95], yaw: 0 },
        { kind: 'barrel', at: [15.45, 31.15], yaw: 1 },
        { kind: 'crate', at: [14.65, 31.5], yaw: 0.3 },
        { kind: 'lantern', at: [15.4, 31.45], yaw: -1.2 },
        { kind: 'rowboat', at: [15.15, 31.85], yaw: 2.1 },
    ],
};
