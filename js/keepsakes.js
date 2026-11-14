/* Pirate Den: every adventure ends with something to keep. TypeScript, compiled to js/keepsakes.js; tested in
   tests/keepsakes.test.ts. js/den/keepsakes.js draws them at the den.

   The user (14 Nov, RULES.md "Every adventure ends with something to keep"): "any little adventure that you
   complete, there should be some meaningful reward, even if it's a small token thing like a visible persistent
   change to the map, a creature that carries along, or some furniture, some visual representation that you've
   completed that quest." So each adventure finished leaves something you can see afterwards, kept with your save
   (this browser), as your spouse is (src/den-spouse.ts). Won by sea, it rides home aboard her and is at the den
   once you're ashore; the den opened again, it's there.

   A new adventure plugs in with one entry in KEEPSAKES (and its drawing in js/den/keepsakes.js). This knows
   nothing of how anything's drawn, nor of the adventures themselves: each says when it's done (`earn`). */
export const KEEPSAKES = {
    /** Helium's rum run (src/den-rumrun.ts): taken home, they give you a few barrels of rum for the den (the user,
        14 Nov: "some barrels of rum to decorate the den or something"). */
    rumrun: { adventure: 'Helium\'s rum run', what: 'three barrels of Helium\'s rum', home: 'Helium\'s rum is home: three barrels at the back of the den' },
};
const isId = (x) => typeof x === 'string' && Object.prototype.hasOwnProperty.call(KEEPSAKES, x);
/** Keepsakes from anywhere (this browser's storage) made safe: the known ones, once each. */
export function cleanKept(o) {
    return Array.isArray(o) ? [...new Set(o.filter(isId))] : [];
}
/** Everything you've kept, and where each is. */
export class Keepsakes {
    at = new Map();
    /** `kept`: what's been won before (from storage): at the den. */
    constructor(kept = []) { for (const id of cleanKept(kept))
        this.at.set(id, 'den'); }
    has(id) { return this.at.has(id); }
    where(id) { return this.at.get(id) ?? null; }
    /** Whether it's standing at the den now. */
    home(id) { return this.at.get(id) === 'den'; }
    /** An adventure finished: its keepsake's yours, aboard her if won at sea. True the first time (once only). */
    earn(id, bySea = true) {
        if (this.at.has(id))
            return false;
        this.at.set(id, bySea ? 'aboard' : 'den');
        return true;
    }
    /** Each tick: once she's home and you're ashore (not sailing), what's aboard is at the den. Those just arrived. */
    settle(sailing) {
        if (sailing)
            return [];
        const came = [];
        for (const [id, w] of this.at)
            if (w === 'aboard') {
                this.at.set(id, 'den');
                came.push(id);
            }
        return came;
    }
    /** What's kept, for storage (all of it: the den opened again, it's at the den). */
    get kept() { return [...this.at.keys()]; }
}
