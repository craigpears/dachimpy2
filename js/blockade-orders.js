/* Pirate Den: the admiral's orders in a blockade (src/blockade.ts), one a ship, carried out by her bot
   (src/blockade-bots.ts). TypeScript, compiled to js/blockade-orders.js; tested in tests/blockade.test.ts. Its page is
   blockade-test.html?admiral.

   The user (15 Nov): "we're going to need some kind of admiral mode where ... similar to the route planning thing ...
   you need to be able to give each ship a target or directive, where it's going, what it's doing"; "you could give
   sloops orders like ... camping somewhere, sniping ... being in kind of snipe mode ... starting from the middle,
   drawing up those sorts of plans, and then you watch the things unfold and can ... update and tweak things or take
   over specific [ships] and detail." So an order is what a bot would have picked for herself (src/blockade-bots.ts's
   goals), picked for her:
   - free: her bot's own choice, as ever;
   - hold a buoy: there, and stay in its reach;
   - camp: lie on a square (a cove, the mouth of a gate, the middle), firing on whatever comes by;
   - snipe: a raider's way (hide in a cove, dart out at an enemy frigate's end, fire, back);
   - shoot a gate down (a war frigate's: her large guns are the only ones that hurt its towers);
   - escort a friend: keep off her side, fighting whoever comes at her;
   - hunt an enemy: after her wherever she goes, broadside on (a sloop at a frigate, off her end).
   A plan is drawn on the board: a ship picked, then a click on what she's to do (orderAt).
   Kept simple to start (the user, 15 Nov: "keep the Admiral mode relatively simple ... like choosing just a strategy,
   just because this is a demo really ... a few tactics, like going for a cove, running for the middle. Same with the
   frigs ... rush the middle, systematically attack the middle, control the outside, attack the enemy frigates ... go
   for sinks ... a handful of ... choices of each"): a strategy for the sloops and one for the frigates (STRATEGIES),
   each an order every ship of the kind is given; one ship's own order on the board as well, if you like. */
import { BLOCKADE } from './blockade.js';
/** The admiral's strategies, a handful for each kind of ship: what each is called, and the order it gives her. */
export const STRATEGIES = {
    sloop: [
        { name: 'Their own choice', order: { kind: 'free' }, says: 'each picks for herself' },
        { name: 'Hide and snipe', order: { kind: 'snipe' }, says: 'hide in the coves, dart out at the enemy frigates\' ends' },
        { name: 'Run for the middle', order: { kind: 'middle' }, says: 'in by the side ways\' winds, to hold the heart\'s buoys' },
        { name: 'Hold the outside', order: { kind: 'outside' }, says: 'hold the buoys out on the open sea' },
    ],
    frigate: [
        { name: 'Their own choice', order: { kind: 'free' }, says: 'each picks for herself' },
        { name: 'Rush the middle', order: { kind: 'rush' }, says: 'shoot a tower down and charge in under the guns' },
        { name: 'Take the middle step by step', order: { kind: 'siege' }, says: 'wreck a gate\'s guns, then its tower, then in' },
        { name: 'Control the outside', order: { kind: 'outside' }, says: 'hold the open sea\'s buoys and keep the enemy off them' },
        { name: 'Hunt their frigates', order: { kind: 'frigates' }, says: 'after the enemy frigates, broadside to broadside' },
        { name: 'Go for sinks', order: { kind: 'sinks' }, says: 'after whoever\'s most hurt, to sink her' },
    ],
};
export const FREE = { kind: 'free' };
/** A buoy in plain words: its pennants, and where. */
export function buoyName(i) {
    const b = BLOCKADE.BUOYS[i], [c, r] = b.at, H = BLOCKADE.HEART;
    const where = c >= H.c0 && c <= H.c1 && r >= H.r0 && r <= H.r1 ? 'in the heart' : r < H.r0 ? (c < 16 ? 'by the south-west isles' : c > 27 ? 'by the south-east isles' : 'off the south gate')
        : r > H.r1 ? (c < 16 ? 'by the north-west isles' : c > 27 ? 'by the north-east isles' : 'off the north gate') : 'out at sea';
    return `the ${['', 'one', 'two', 'three'][b.pennants]}-pennant buoy ${where}`;
}
/** A gate in plain words. */
export const gateName = (g) => `the ${BLOCKADE.GATES[g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate`;
/** An order in plain words. */
export function orderText(b, o) {
    switch (o.kind) {
        case 'free': return 'her own choice';
        case 'hold': return `hold ${buoyName(o.buoy)}`;
        case 'camp': return `camp at ${o.at[0]}, ${o.at[1]}`;
        case 'snipe': return 'snipe at frigates from a cove';
        case 'gate': return `shoot ${gateName(o.g)} down`;
        case 'escort': return `escort ${b.ship(o.ship).name}`;
        case 'hunt': return `hunt ${b.ship(o.ship).name}`;
        case 'middle': return 'run for the middle';
        case 'outside': return 'hold the outside';
        case 'rush': return 'rush the middle';
        case 'siege': return 'take the middle step by step';
        case 'frigates': return 'hunt their frigates';
        case 'sinks': return 'go for sinks';
    }
}
/** Where an order points on the board (a square to draw a line to), if anywhere. */
export function orderTarget(b, o) {
    switch (o.kind) {
        case 'hold': return BLOCKADE.BUOYS[o.buoy].at;
        case 'camp': return o.at;
        case 'gate': {
            const x = BLOCKADE.GATES[o.g];
            return [x.way, (x.r0 + x.r1) / 2];
        }
        case 'escort':
        case 'hunt': {
            const s = b.ship(o.ship);
            return s.away > 0 ? null : [s.helm.pose.c, s.helm.pose.r];
        }
        default: return null;
    }
}
/** What a click on the board (square c, r) orders her to do: a ship there, an enemy to hunt or a friend to escort
    (herself, her own choice again); a buoy near it, hold it; a gate's way or towers near it, shoot that gate down
    (a war frigate only, the gate still shut); else camp on the nearest square she can lie on. Null if there's none. */
export function orderAt(b, s, c, r) {
    const o = b.under(c, r);
    if (o)
        return o === s ? FREE : o.team === s.team ? { kind: 'escort', ship: o.id } : { kind: 'hunt', ship: o.id };
    const buoy = BLOCKADE.BUOYS.findIndex((x) => Math.hypot(x.at[0] - c, x.at[1] - r) <= 1.5);
    if (buoy >= 0)
        return { kind: 'hold', buoy };
    if (s.kind === 'frigate') {
        const g = b.gates.findIndex((x) => !x.open() && Math.abs(c - x.way) <= 3 && r >= x.r0 - 1 && r <= x.r1 + 1);
        if (g >= 0)
            return { kind: 'gate', g };
    }
    // (the nearest square with room for her, as the crow flies)
    const sea = s.sea.bare();
    for (let ring = 0; ring < 6; ring++) {
        let best = null, far = Infinity;
        for (let x = c - ring; x <= c + ring; x++)
            for (let y = r - ring; y <= r + ring; y++) {
                if (Math.max(Math.abs(x - c), Math.abs(y - r)) !== ring || !sea.open(x, y))
                    continue;
                if ([0, 1, 2, 3].every((d) => !sea.fits({ c: x, r: y, d })) && s.h.long * s.h.wide > 1)
                    continue;
                const h = Math.hypot(x - c, y - r);
                if (h < far) {
                    far = h;
                    best = [x, y];
                }
            }
        if (best)
            return { kind: 'camp', at: best };
    }
    return null;
}
