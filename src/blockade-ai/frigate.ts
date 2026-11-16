/* Pirate Den: the blockade's bots (src/blockade-ai/), a war frigate's AI. TypeScript, compiled to
   js/blockade-ai/frigate.js; tested in tests/blockade.test.ts.
   - The heart's buoys are worth more to her: what she's for (`BOTS.HEART`).
   - With no gate down yet she weighs shooting one down instead (worth all the heart's pennants): she lies broadside to
     a tower and fires till it crumbles.
   - She wrecks the other side's gate guns, worth more the more of them stand, and far more while they're firing on her.
   - She fights an enemy close by on the points (a sloop before anything: rock, paper, scissors, hers to sink, sheer
     weight of shot), lying off her side; never one off the points, and holding a buoy in the heart she fights only
     what comes at her there.
   - Never lying in a gateway, half in and half out: holding a buoy from there, she goes on in (16 Nov: "they seem now
     to just want to sit in the gate"; a frigate "with its back end stuck out ... halfway into the gate, that ship is a
     sitting duck").
   - On the points with an enemy in reach and neither side bearing, she turns her broadside onto her, by a move that
     keeps the buoy in her reach (16 Nov: "you can still maneuver within the middle, fight things, but ... while you've
     got the points within your influence"; "at the very least, you would swing ... and start putting broadside").
   - An enemy frigate stuck half in a gateway, near, she rakes from off her end (16 Nov: "somebody else
     ... swing around behind it and just start pummeling it with shots from the back"). */
import type { Side } from '../ship-handling.js';
import { squares, drawnAt } from '../ship-handling.js';
import { inHeart, phantom, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { BLOCKADE } from '../blockade.js';
import { BOTS, type Goal, same } from './config.js';
import { gatePlace, inGateway } from './places.js';
import { Captain, type Weights } from './captain.js';

export class FrigateAI extends Captain {
  protected shunsShelter = true;
  protected settled(b: Blockade, s: Ship, buoy: Buoy): boolean { return super.settled(b, s, buoy) && !inGateway(s); }
  protected act(b: Blockade, s: Ship, _dt: number): boolean {
    if (this.bounce(b, s)) return false;
    // (caught in a gateway, her way on blocked by the ships ahead and no room to turn: straight on into the heart when
    // that's clear, rather than lie there with her stern out)
    if (inGateway(s) && this.goal?.kind === 'buoy' && s.helm.slot < 0 && !s.helm.pin && !s.helm.mine.length && s.sea.clear(s.helm.pose, 'F')) { s.helm.put('F'); return false; }
    this.bear(b, s);
    return false;
  }
  /** Boxed in, no move of hers clear (bow to bow with another frigate between the gates, say): warped round on the spot,
      the way that keeps her buoy if either does, so her broadside comes round onto whoever's ahead of her (16 Nov:
      "nobody's turning ... surely frigs should be able to bounce off each other and then start exchanging a broadside
      in the middle, not camping"). */
  private bounce(b: Blockade, s: Ship): boolean {
    const g = this.goal, p = s.helm.pose;
    if (s.helm.slot >= 0 || s.helm.pin || s.helm.mine.length || g?.kind !== 'buoy') return false;
    if ((['F', 'L', 'R'] as const).some((m) => s.sea.clear(p, m))) return false;
    const buoy = BLOCKADE.BUOYS[g.i], R = BLOCKADE.INFLUENCE.frigate;
    const spins = (['L', 'R'] as const).map((m) => ({ m, to: s.sea.move(p, m).to })).filter((x) => x.to.d !== p.d);
    if (!spins.length) return false;
    const keeps = (to: typeof p) => squares(s.h, to).some(([c, r]) => Math.hypot(c - buoy.at[0], r - buoy.at[1]) <= R);
    s.helm.put((spins.find((x) => keeps(x.to)) ?? spins[0]).m);
    return true;
  }
  /** On the points, idle, an enemy in reach and neither side bearing on any: a turn that brings her broadside round onto
      the nearest, keeping the buoy in her reach. */
  private bear(b: Blockade, s: Ship) {
    const g = this.goal;
    if (s.helm.slot >= 0 || s.helm.pin || s.helm.mine.length || g?.kind !== 'buoy') return;
    const buoy = BLOCKADE.BUOYS[g.i], p = s.helm.pose;
    if (!this.settled(b, s, buoy)) return;
    const me = drawnAt(s.h, { c: p.c, r: p.r, a: p.d }), mid = (o: Ship) => drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d });
    const foes = b.ships.filter((o) => o.team !== s.team && o.away <= 0 && !o.dmg.out && !phantom(o) && !b.safe(o))
      .map((o) => ({ o, m: mid(o) })).map((x) => ({ ...x, d: Math.hypot(x.m.c - me.c, x.m.r - me.r) })).filter((x) => x.d <= BOTS.BEAR).sort((a, z) => a.d - z.d);
    if (!foes.length) return;
    if ((['L', 'R'] as Side[]).some((side) => b.aim(s.id, side).some((x) => x.what?.what === 'ship' && b.ship(x.what.id).team !== s.team))) return;
    const { m } = foes[0], DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], dc = m.c - me.c, dr = m.r - me.r;
    const ahead = dc * DC[p.d] + dr * DR[p.d], across = dc * DC[(p.d + 1) % 4] + dr * DR[(p.d + 1) % 4];
    if (Math.abs(ahead) < Math.abs(across)) return;   // (abeam already: rocks or range, not her heading)
    // (her wide turn, or, no room for it, bumping round on the spot where she fits)
    const R = BLOCKADE.INFLUENCE.frigate, keeps = (mv: 'L' | 'R') => { const to = s.sea.move(p, mv).to; return to.d !== p.d && squares(s.h, to).some(([c, r]) => Math.hypot(c - buoy.at[0], r - buoy.at[1]) <= R); };
    const turn = (['L', 'R'] as const).find(keeps);
    if (turn) s.helm.put(turn);
  }
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
    // An enemy frigate stuck half in a gateway: raked from off her end, where she can't answer, if it's quick to get
    // there (a friend already at her, left to her; a frigate merely lying still on the points is the sloops' to snipe).
    for (const o of b.ships) {
      if (o.team === s.team || o.kind !== 'frigate' || o.away > 0 || o.dmg.out || b.safe(o)) continue;
      if (!inGateway(o) || mates.some((x) => (x.kind === 'raid' || x.kind === 'fight') && x.on === o.id)) continue;
      const rake = this.raid(b, s, BOTS.RAKE.NEAR, false, o.id);
      if (!rake?.pose) continue;
      const eta = s.sea.eta(p, rake.pose.c, rake.pose.r, rake.pose);
      if (eta < BOTS.RAKE.SECS) best.push({ goal: rake, score: fightW * BOTS.RAKE.W * this.nerve(s, o) / (4 + eta) });
    }
  }
}
