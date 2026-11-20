/* Pirate Den: the blockade's bots (src/blockade-ai/), a war brig's AI. TypeScript, compiled to js/blockade-ai/brig.js;
   tested in tests/blockade.test.ts.
   - She goes for the lagoons' buoys more than the heart's, and fights another brig, leaving sloops and frigates to
     others: rock, paper, scissors, her craft the frigates'.
   - With an enemy frigate in the heart she makes for her launching spot, a lagoon's corner nearest it or a corner of
     the heart, and launches her craft from there whenever an enemy frigate's in reach, or the other side's gate guns
     (her standoff work), and no sloop's near enough to catch her at anchor; at anchor she only fires.
   - Under way, with a gate gun's shot coming down on her, she moves on off its square. */
import { squares } from '../ship-handling.js';
import { BLOCKADE, inHeart, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { BOTS, type Goal } from './config.js';
import { Captain, type Weights } from './captain.js';

export class BrigAI extends Captain {
  protected act(b: Blockade, s: Ship, _dt: number): boolean {
    // (a brig under way with a gate gun's shot coming down on her: a move on, off its square)
    if (!b.anchored(s) && s.helm.slot < 0 && !s.helm.mine.length) {
      const mine = new Set(squares(s.h, s.helm.pose).map(([c, r]) => `${c},${r}`));
      if (b.battery.some((gun) => !gun.wrecked && gun.shots.some((x) => mine.has(`${x.to[0]},${x.to[1]}`)))) {
        const m = (['F', 'L', 'R'] as const).find((x) => s.sea.clear(s.helm.pose, x));
        if (m) s.helm.put(m);
      }
    }
    // (a brig: her craft launched whenever an enemy's near)
    // (a brig launches when there's a big ship for her craft in reach and no sloop near enough to catch her at anchor:
    // launching anchors her, a sitting duck till they're home, so she does it from somewhere safe; at anchor she only
    // fires)
    {
      const near = (o: Ship, d: number) => o.team !== s.team && !o.craft && o.away <= 0 && !o.dmg.out && Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r) <= d;
      // (making for her launching spot by a lagoon: not till she's there, never anchored in the open on the way)
      const spot = !this.skirmish && this.order.kind === 'free' && !b.open ? this.station(b, s) : null;
      const placed = !spot || Math.max(Math.abs(spot[0] - s.helm.pose.c), Math.abs(spot[1] - s.helm.pose.r)) <= 1;
      // (at a frigate: her craft's work, rock, paper, scissors; not at another brig, both anchored by the edge ramming
      // each other, once the sides came in from both edges, 15 Nov)
      // (or at the other side's gate guns in reach: her craft's standoff work, wrecking them from her lagoon, 15 Nov)
      const guns = b.battery.some((g, i) => !g.wrecked && b.gunSide[i] !== s.team && Math.hypot(g.at[0] - s.helm.pose.c, g.at[1] - s.helm.pose.r) <= BOTS.BRIG.LAUNCH);
      if (placed && b.canLaunch(s) && (guns || b.ships.some((o) => o.kind === 'frigate' && near(o, BOTS.BRIG.LAUNCH))) && !b.ships.some((o) => o.kind === 'sloop' && near(o, BOTS.BRIG.SAFE))) b.launch(s.id);
      if (b.anchored(s)) { this.shoot(b, s); return true; }
    }
    return false;
  }
  protected skirmishFirst(b: Blockade, s: Ship, _t: Ship | undefined): { goal: Goal; score: number } | null {
    // (a brig on the blockade's board, with a big ship for her craft to go after, makes for a lagoon and lies in it, out
    // of any frigate's reach, launching from there: the terrain's hers, her craft slipping out through its gaps. With
    // only sloops against her, there's nothing to launch at: she fights in the open)
    if (!b.open && b.ships.some((o) => o.team !== s.team && !o.craft && o.away <= 0 && o.kind !== 'sloop')) {
      const inside = BLOCKADE.REEFS.find((x) => Math.max(Math.abs(s.helm.pose.c - x.at[0]), Math.abs(s.helm.pose.r - x.at[1])) <= 2);
      if (inside) return { goal: { kind: 'camp', at: [s.helm.pose.c, s.helm.pose.r] }, score: 9 };
      const lagoon = BLOCKADE.REEFS.map((x) => ({ at: x.hide, eta: s.sea.eta(s.helm.pose, ...x.hide) })).filter((x) => x.eta < Infinity).sort((a, z) => a.eta - z.eta)[0];
      if (lagoon) return { goal: { kind: 'camp', at: lagoon.at }, score: 9 };
    }
    return null;
  }
  protected first(b: Blockade, s: Ship, mates: Goal[]): { goal: Goal; score: number } | null {
    // A brig, with an enemy frigate in the heart: to her lagoon's corner nearest it, beside the gap the wind runs through
    // into the fort, out of any frigate's reach (a frigate scrapes her bottom in the shoals), to launch her craft in at
    // her along the wind (the user, 15 Nov: "war frigs camping in the middle, war brigs sending turtles in through the
    // gaps ... I just want to see the war brigs camping out there more and sending in the turtles").
    if (!this.skirmish && this.order.kind === 'free' && !b.open) {
      const there = this.station(b, s);
      if (there) return { goal: { kind: 'camp', at: there }, score: 9 };
    }
    return null;
  }
  protected buoyWorth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
    let w = super.buoyWorth(b, s, buoy, i, mates);
    // (the lagoons' buoys before the heart's)
    w *= inHeart(...buoy.at) ? BOTS.BRIG.HEART : BOTS.BRIG.OUT;
    return w;
  }
  protected options(b: Blockade, s: Ship, _mates: Goal[], best: { goal: Goal; score: number }[], { fightW }: Weights) {
    // (another brig, her craft the frigates: she leaves the sloops, too quick for her, be)
    this.fights(b, s, best, fightW, BOTS.ENGAGE, 'brig', (o) => o.kind === 'brig' ? 1.5 : 0.25, BOTS.OFF_POINTS);
  }
  /** A brig's launching spot, while an enemy frigate's in the heart: the square inside a lagoon nearest the heart's
      middle, or a corner of the heart itself (out of the reach of any frigate in there, a postern or a way out by it:
      the user, 15 Nov, "an enclosed launching spot for a brig"), whichever she gets to soonest (none: no enemy frigate
      in there, or no way to one). */
  protected station(b: Blockade, s: Ship): [number, number] | null {
    const frigate = b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o));
    if (!frigate) return null;
    const [hc, hr] = BLOCKADE.BUOYS[0].at, sea = s.sea.bare(), H = BLOCKADE.HEART;
    const spots = BLOCKADE.REEFS.map((x) => {
      const inside: [number, number][] = [];
      for (let dc = 1 - x.ring; dc < x.ring; dc++) for (let dr = 1 - x.ring; dr < x.ring; dr++) if (sea.open(x.at[0] + dc, x.at[1] + dr)) inside.push([x.at[0] + dc, x.at[1] + dr]);
      return inside.sort((a, z) => Math.hypot(a[0] - hc, a[1] - hr) - Math.hypot(z[0] - hc, z[1] - hr))[0];
    }).concat(([[H.c0, H.r1], [H.c1, H.r1], [H.c0, H.r0], [H.c1, H.r0]] as [number, number][]).filter(([c, r]) => sea.open(c, r))).filter(Boolean).map((at) => ({ at, eta: at[0] === s.helm.pose.c && at[1] === s.helm.pose.r ? 0 : s.sea.eta(s.helm.pose, ...at) }))
      .filter((x) => x.eta < Infinity && !this.blocked(b, x.at)).sort((a, z) => a.eta - z.eta);
    return spots[0]?.at ?? null;
  }
}
