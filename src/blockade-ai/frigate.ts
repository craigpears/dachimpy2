/* Pirate Den: the blockade's bots (src/blockade-ai/), a war frigate's AI. TypeScript, compiled to
   js/blockade-ai/frigate.js; tested in tests/blockade.test.ts.
   - The heart's buoys are worth more to her: what she's for (`BOTS.HEART`).
   - With no gate down yet she weighs shooting one down instead (worth all the heart's pennants): she lies broadside to
     a tower and fires till it crumbles.
   - She wrecks the other side's gate guns, worth more the more of them stand, and far more while they're firing on her.
   - She fights an enemy close by on the points (a sloop before anything: rock, paper, scissors, hers to sink, sheer
     weight of shot), lying off her side; never one off the points, and holding a buoy in the heart she fights only
     what comes at her there. */
import { inHeart, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { BLOCKADE } from '../blockade.js';
import { BOTS, type Goal, same } from './config.js';
import { gatePlace } from './places.js';
import { Captain, type Weights } from './captain.js';

export class FrigateAI extends Captain {
  protected shunsShelter = true;
  protected buoyWorth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
    let w = super.buoyWorth(b, s, buoy, i, mates);
    if (inHeart(...buoy.at)) w *= BOTS.HEART;
    return w;
  }
  protected options(b: Blockade, s: Ship, mates: Goal[], best: { goal: Goal; score: number }[], { gateW, fightW, post }: Weights) {
    const p = s.helm.pose;
    // (any gate still shut: the one nearest her may be quicker shot down than sailing round to one that's open; a
    // gate a friend's already shooting at is left to her)
    if (post !== 'outside') for (const [g, gate] of b.gates.entries()) {
      if (gate.open() || mates.some((m) => m.kind === 'gate' && m.g === g)) continue;
      const place = gatePlace(b, s, g);
      if (!place.berths.length) continue;
      const here = place.berths.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
      // (her own berth while it's still a berth, so she doesn't change her mind for another each look; else the
      // nearest, where her quickest way to any of them ends)
      const mine = this.goal?.kind === 'gate' && this.goal.g === g ? place.berths.find((x) => same({ kind: 'gate', ...x }, this.goal)) : undefined;
      const nearest = () => { const way = s.sea.plotAny(p, place.key, place.poses); return way ? place.berths.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined; };
      const berth = here ?? mine ?? nearest();
      if (!berth) continue;
      // (the gate's own field, its nearest berth's, unless she's set on another of its berths already)
      const eta = here ? 0 : mine ? s.sea.eta(p, berth.pose.c, berth.pose.r, berth.pose) : s.sea.etaAny(p, place.key, place.poses);
      if (!(eta < Infinity)) continue;
      const prize = BLOCKADE.BUOYS.filter((x) => inHeart(...x.at)).reduce((t, x) => t + x.pennants, 0) * 1.3;
      const left = gate.towers[berth.tower].hp;
      best.push({ goal: { kind: 'gate', ...berth }, score: gateW * prize / (4 + eta + left * s.h.reload * 0.5) });
    }
    // A frigate wrecks a gate's guns: worth more the more of them stand, and far more while they're firing on her (the
    // user, 15 Nov: "a lot of foolish ships just hanging out when there are cannons shooting at them ... more of an
    // incentive to destroy these cannons for the war frigates"); from either side of the wall, the heart's side too.
    if (post !== 'outside') for (const g of b.gates.keys()) {
      // (the other side's guns only: her own fire on her enemies)
      if (b.gates[g] && BLOCKADE.GATES[g].side === s.team) continue;
      const live = b.battery.filter((x, i) => b.gunGate[i] === g && !x.wrecked).length;
      if (!live) continue;
      const onHer = b.battery.some((x, i) => b.gunGate[i] === g && !x.wrecked && b.gunOn[i] === s.id);
      const got = this.gunBerth(b, s, g);
      if (!got || !(got.eta < Infinity)) continue;
      best.push({ goal: { kind: 'guns', ...got.berth }, score: (onHer ? BOTS.GUNS.ON : BOTS.GUNS.W) * live / (4 + got.eta + s.h.reload) });
    }
    // A frigate fights an enemy close by on the points, lying off her side.
    // (a frigate holding a buoy in the heart keeps it: she fights only what comes at her there, the points hers while
    // she lies on them; the user, 15 Nov: "people aren't really paying attention to the points. They're just going off
    // and starting a few fights")
    const holds = BLOCKADE.BUOYS.some((x) => inHeart(...x.at) && b.reaches(s, x));
    // (a sloop before anything: rock, paper, scissors, hers to sink, sheer weight of shot; never a fight off the points:
    // she fires on whoever comes into her broadside, and goes for the buoys; the user, 15 Nov, "You don't hang around
    // off points getting into fights. That is not the blockade ... way ... not wanting to put yourself in a vulnerable
    // position ... turning into an enemy broadside")
    this.fights(b, s, best, fightW, holds ? BOTS.HOLD : BOTS.ENGAGE, 'sloop', (o) => o.kind === 'sloop' ? 1.6 : o.kind === 'frigate' ? 1.3 : 0.8, 0);
  }
}
