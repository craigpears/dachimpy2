/* Pirate Den: the blockade's bots (src/blockade-ai/), a phantom sloop's AI: a haunted brig's craft. TypeScript,
   compiled to js/blockade-ai/ghost.js; tested in tests/blockade.test.ts.
   - Nothing can hurt her and she holds no buoy: she darts at anything slow or sat still (a frigate first, a brig, a
     ship that's lain still a while), again and again, while she lasts; or at the other side's gate guns when they're
     nearer, her brig's standoff work. */
import { BLOCKADE, inHeart, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { BOTS, type Goal } from './config.js';
import { Captain } from './captain.js';

export class GhostAI extends Captain {
  protected first(b: Blockade, s: Ship): { goal: Goal; score: number } | null {
    // A phantom sloop darts at anything slow or sat still (a frigate first, a brig, a ship that's lain still a while),
    // again and again: she's only a while, nothing can hurt her, no hiding.
    {
      const raid = this.raid(b, s, Infinity);
      // (or the other side's gate guns, nearer: they can't hurt her, and wrecking them is her brig's standoff work, 15 Nov)
      const gun = b.gates.map((_, g) => g).filter((g) => BLOCKADE.GATES[g].side !== s.team).map((g) => this.gunBerth(b, s, g)).filter((x) => x && x.eta < Infinity).sort((a, z) => a!.eta - z!.eta)[0];
      if (gun && (!raid || gun.eta <= s.sea.eta(s.helm.pose, ...raid.at))) return { goal: { kind: 'guns', ...gun.berth }, score: 8 };
      if (raid) return { goal: raid, score: 8 };
    }
    return null;
  }
  protected buoyWorth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
    let w = super.buoyWorth(b, s, buoy, i, mates);
    if (inHeart(...buoy.at) && b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o))) w *= BOTS.FLEE;
    return w;
  }
}
