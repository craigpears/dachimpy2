/* Pirate Den: the blockade's bots (src/blockade.ts), each sailing one ship: an AI for each kind of ship, a plug-in
   (the user, 16 Nov: "almost like an AI folder ... so that each of these can be have like a separate plugin AI. So
   the warfrig AI, a warbrig, a sloop, turtle, [ghost] ship"). TypeScript, compiled to js/blockade-ai/; tested in
   tests/blockade.test.ts. Plain greedy bots, as the puzzles' are: no planning ahead, no teamwork beyond not all going
   for the same thing.
   - config.ts: their numbers (`BOTS`) and what a bot can set out to do (`Goal`);
   - places.ts: a buoy's worth, and the berths off a gate's towers and guns;
   - captain.ts: what every kind does alike (looking round, shooting, steering, orders, raids, fights), `Captain`,
     and what the fleet needs of any AI, `ShipAI`;
   - frigate.ts, brig.ts, sloop.ts, turtle.ts, ghost.ts: each kind's own, a Captain with its own calls;
   - here: which AI sails which ship (`AIS`, by her role, `roleOf`), and the fleet's (`Bots`).
   To slot a different AI in for a kind: pass `ais` to Bots (`{ frigate: (id, random) => new MyFrigateAI(id, random) }`),
   any class that's a `ShipAI`.
   An admiral's order (src/blockade-orders.ts: hold a buoy, camp, snipe, shoot a gate down, escort, hunt) is carried
   out before anything she'd pick for herself; "free", she picks as her kind does. A strategy's (the middle, the
   outside, rushing, step by step, their frigates, sinks) bends how she picks: what she'll go for, and how much it's
   worth. */
import { squares } from '../ship-handling.js';
import { BLOCKADE, inHeart } from '../blockade.js';
import { FREE } from '../blockade-orders.js';
import { FrigateAI } from './frigate.js';
import { BrigAI } from './brig.js';
import { SloopAI } from './sloop.js';
import { TurtleAI } from './turtle.js';
import { GhostAI } from './ghost.js';
export { BOTS } from './config.js';
export { bombardBerths, gunBerths } from './places.js';
export { Captain } from './captain.js';
export { FrigateAI, BrigAI, SloopAI, TurtleAI, GhostAI };
export const roleOf = (s) => s.craft ? (s.craft.kind === 'ram' ? 'turtle' : 'ghost') : s.kind;
/** Each role's AI. */
export const AIS = {
    frigate: (id, random) => new FrigateAI(id, random),
    brig: (id, random) => new BrigAI(id, random),
    sloop: (id, random) => new SloopAI(id, random),
    turtle: (id, random) => new TurtleAI(id, random),
    ghost: (id, random) => new GhostAI(id, random),
};
/** A ship's AI, by her role (`ais` any swapped for another). */
export function botFor(b, id, random = Math.random, ais = {}) {
    const role = roleOf(b.ship(id));
    return (ais[role] ?? AIS[role])(id, random);
}
/** Every ship's bot. */
export class Bots {
    bots;
    /** `brawl`: two ships' ids (Blockade.brawl) that fight each other and nothing else; `ais`, any kind's AI swapped for
        another. */
    constructor(b, people = [], random = Math.random, brawl = null, skirmish = false, ais = {}) {
        this.bots = b.ships.filter((s) => !people.includes(s.id)).map((s) => Object.assign(botFor(b, s.id, random, ais), { skirmish }));
        if (brawl)
            for (const bot of this.bots) {
                if (brawl.includes(bot.id))
                    bot.foe = brawl[0] === bot.id ? brawl[1] : brawl[0];
                else
                    bot.spare = new Set(brawl);
            }
    }
    /** Give a ship her admiral's order (FREE: her own choice again): she looks round at once. */
    order(id, o) {
        const bot = this.bots.find((x) => x.id === id);
        if (!bot)
            return;
        bot.order = o;
        bot.t = 0;
    }
    /** A ship's order just now. */
    orderOf(id) { return this.bots.find((x) => x.id === id)?.order ?? FREE; }
    /** Each bot a tick on but those sailing a ship someone's sailing just now (`people`: their ids). */
    tick(b, dt, people = []) {
        for (const bot of this.bots) {
            if (people.includes(bot.id))
                continue;
            const team = b.ship(bot.id).team, mates = this.bots.filter((o) => o !== bot && b.ship(o.id).team === team && o.goal).map((o) => o.goal);
            bot.tick(b, dt, mates);
        }
    }
    /** What a ship's bot is up to, in plain words. */
    doing(b, id) {
        const bot = this.bots.find((x) => x.id === id), s = b.ship(id);
        if (s.craft && s.away > 0)
            return `aboard ${b.ship(s.craft.by).name}, to be launched`;
        if (s.away > 0)
            return `sunk: back in ${Math.ceil(s.away)}s from her side's edge`;
        if (s.dmg.out)
            return 'knocked out: her crew rebuilding her';
        if (b.anchored(s))
            return (s.weigh ?? 0) > 0 ? 'weighing anchor' : 'at anchor, her craft out';
        const g = bot?.goal;
        if (!g)
            return 'looking round';
        if (g.kind === 'gate')
            return `shooting down the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's tower`;
        if (g.kind === 'guns')
            return `wrecking the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's guns`;
        if (g.kind === 'raid')
            return `darting out at ${b.ship(g.on).name}`;
        if (g.kind === 'camp')
            return squares(s.h, s.helm.pose).some(([c, r]) => c === g.at[0] && r === g.at[1]) ? 'camped, firing on what comes by' : 'making for her camp';
        if (g.kind === 'escort')
            return `escorting ${b.ship(g.on).name}`;
        if (g.kind === 'fight')
            return `fighting ${b.ship(g.on).name}`;
        if (g.kind === 'ram' && g.gun !== undefined)
            return `making for the ${BLOCKADE.GATES[b.gunGate[g.gun]].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's guns, to ram one`;
        if (g.kind === 'ram')
            return `making for ${b.ship(g.on).name}, to ram her`;
        const buoy = BLOCKADE.BUOYS[g.i];
        return `${b.reaches(s, buoy) ? 'holding' : 'making for'} the ${['', 'one', 'two', 'three', 'four', 'five'][buoy.pennants] ?? buoy.pennants}-pennant buoy${inHeart(...buoy.at) ? ' in the heart' : ''}`;
    }
}
