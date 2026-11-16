/* Pirate Den: the blockade's bots (src/blockade-ai/), a sloop's AI. TypeScript, compiled to js/blockade-ai/sloop.js;
   tested in tests/blockade.test.ts.
   - She holds the buoys, wary: a buoy an enemy frigate's close to is a sloop sunk, so she leaves it to her, and the
     heart once the enemy's frigates are in it. No sloop hides: a hurt one is patched where she is, on the points, and
     takes fewer risks (her nerve).
   - Dip, duck and dodge: on a square an enemy frigate's broadside is about to reach, or a gate gun's painted, she's
     off it, beside a rock if she can.
   - A raider (two a side) darts out at an enemy brig or frigate, snipes at her from off her bow or her stern, where
     none of her broadsides can bear, and back to the buoys a while (the user, 15 Nov: "they snipe at the back or the
     front of the ship where they're safe, then they can't return a broadside"; "you never hide").
   - With an enemy brig close by she goes for her end, too quick for a brig (rock, paper, scissors: "sloops beat war
     brigs ... because of how they can just dart around and evade them").
   - She leaves a frigate be unless she's sniping at her end: a broadside duel with one is a sloop sunk.
   - An enemy sloop at her side's brig lying at anchor, she drives off, one sloop to each (16 Nov: "I would expect them
     to be protecting the war brig and getting behind [her]").
   - An enemy frigate stuck, half in a gateway or lying still a while, one sloop goes and snipes at her end (16 Nov:
     "that ship is a sitting duck"). */
import { SAIL } from '../den-sail.js';
import type { Side } from '../ship-handling.js';
import { BLOCKADE, inHeart, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { BOTS, type Goal } from './config.js';
import { inGateway } from './places.js';
import { Captain } from './captain.js';

export class SloopAI extends Captain {
  protected act(b: Blockade, s: Ship, _dt: number): boolean {
    // (a sloop dips, ducks and dodges: out of a frigate's broadside before it bears, firing as she goes)
    if (this.dodge(b, s)) { this.shoot(b, s); return true; }
    return false;
  }
  protected holdFire(_b: Blockade, _s: Ship, o: Ship): boolean {
    // (rock, paper, scissors: a frigate's broadside duel is a sloop sunk)
    return o.kind === 'frigate' && this.goal?.kind !== 'raid';
  }
  protected skirmishFirst(b: Blockade, s: Ship, t: Ship | undefined): { goal: Goal; score: number } | null {
    if (!t) return null;
    // (a sloop hits and runs: a few seconds away from her after each broadside, then back at her)
    if (b.clock - this.firedAt < BOTS.RUN) {
      const p = s.helm.pose, dc = p.c - t.helm.pose.c, dr = p.r - t.helm.pose.r, k = 6 / (Math.hypot(dc, dr) || 1);
      const at: [number, number] = [Math.max(1, Math.min(BLOCKADE.COLS - 2, Math.round(p.c + dc * k))), Math.max(1, Math.min(BLOCKADE.ROWS - 2, Math.round(p.r + dr * k)))];
      if (s.sea.bare().open(...at)) return { goal: { kind: 'camp', at }, score: 9 };
    }
    if (t.kind !== 'sloop') { const r = this.raid(b, s, Infinity, false, t.id); if (r) return { goal: r, score: 9 }; }
    return null;
  }
  protected first(b: Blockade, s: Ship, mates: Goal[]): { goal: Goal; score: number } | null {
    // A raider darts out at an enemy brig or frigate's end, and back to the buoys a while; never hiding (the user, 15 Nov:
    // "you never hide. There's just no tactical reason or benefit to. You lose coverage of points").
    const free = this.order.kind === 'free', taken = (id: number) => mates.some((x) => (x.kind === 'raid' || x.kind === 'fight') && x.on === id);
    const far = (o: Ship) => Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r);
    // (her side's brig at anchor with an enemy sloop at her: off her side to fight her, broadside to broadside)
    if (free) for (const br of b.ships) {
      if (br.team !== s.team || !b.anchored(br)) continue;
      const foe = b.ships.filter((o) => o.team !== s.team && o.kind === 'sloop' && !o.craft && o.away <= 0 && !o.dmg.out && !b.safe(o)
        && Math.hypot(o.helm.pose.c - br.helm.pose.c, o.helm.pose.r - br.helm.pose.r) <= BOTS.GUARD && far(o) <= BOTS.REACH).sort((a, z) => far(a) - far(z))[0];
      if (!foe || (taken(foe.id) && !(this.goal?.kind === 'fight' && this.goal.on === foe.id))) continue;
      if (this.nerve(s, foe) < BOTS.NERVE.GO) continue;
      const at = this.raid(b, s, Infinity, true, foe.id);
      if (at) return { goal: { kind: 'fight', on: foe.id, at: at.at }, score: 8 };
    }
    // (an enemy frigate stuck: her end sniped at, where she can't answer)
    if (free) for (const o of b.ships) {
      if (o.team === s.team || o.kind !== 'frigate' || o.away > 0 || o.dmg.out || b.safe(o) || far(o) > BOTS.REACH) continue;
      if (!(inGateway(o) || (b.still.get(o.id) ?? 0) >= BOTS.CAMPED) || (taken(o.id) && !(this.goal?.kind === 'raid' && this.goal.on === o.id))) continue;
      if (this.nerve(s, o) < BOTS.NERVE.GO) continue;
      const raid = this.raid(b, s, BOTS.REACH, false, o.id);
      if (raid) return { goal: raid, score: 8 };
    }
    const raider = this.order.kind === 'snipe' || (this.order.kind === 'free' && s.raider);
    if (raider) {
      const raiding = this.goal?.kind === 'raid', done = raiding && (this.firedAt > this.since || b.clock - this.since > BOTS.RAID);
      if (done) this.rest = b.clock + BOTS.LURK[0] + this.random() * (BOTS.LURK[1] - BOTS.LURK[0]);
      // (a brig before a frigate: rock, paper, scissors, the sloops' to beat; only with the nerve for it)
      const raid = b.clock < this.rest ? null : this.raid(b, s, BOTS.REACH, false, undefined, 'brig');
      if (raid && this.nerve(s, b.ship(raid.on)) >= BOTS.NERVE.GO) return { goal: raid, score: 8 };
    }
    // A sloop with an enemy brig close by goes for her, off her end where the brig's broadsides can't bear: too quick
    // for a brig (rock, paper, scissors, 15 Nov: "sloops beat war brigs ... because of how they can just dart around
    // and evade them").
    if (this.order.kind === 'free') {
      const raid = this.raid(b, s, BOTS.ENGAGE, false, undefined, 'brig');
      if (raid && b.ship(raid.on).kind === 'brig' && this.nerve(s, b.ship(raid.on)) >= BOTS.NERVE.GO) return { goal: raid, score: 7 };
    }
    return null;
  }
  protected buoyWorth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
    let w = super.buoyWorth(b, s, buoy, i, mates);
    // (a sloop in the heart once the enemy's frigates are in it: out by the winds to the lagoons, before they're caught)
    if (inHeart(...buoy.at) && b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o))) w *= BOTS.FLEE;
    // (a sloop, wary: a buoy an enemy frigate's close to is a sloop sunk, so she leaves it to her and goes where she isn't;
    // the user, 15 Nov, of sloops "hanging around in the middle being blown up by [war frigs], foolishly")
    // (further off, the more damaged she is: fewer risks)
    if (b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && Math.hypot(o.helm.pose.c - buoy.at[0], o.helm.pose.r - buoy.at[1]) <= BOTS.WARY * (1 + s.dmg.share()))) w *= BOTS.FLEE;
    return w;
  }
  /** Dip, duck and dodge (the user, 15 Nov: "in the open water, it would be suicide, but in there are ways to dip and
      dodge"): a sloop on a square an enemy frigate's broadside reaches, from where she lies or where the move she's on
      will leave her (her turn the warning: two and a half seconds of it, a sloop's move one), with that side loaded or
      nearly, gets off it to the nearest square none of them reach, a square behind a rock among them (shots stop at
      rocks). Whether she's dodging. */
  protected dodge(b: Blockade, s: Ship): boolean {
    const p = s.helm.pose, here = `${p.c},${p.r}`;
    // (still on her way to cover she chose: keep at it a moment)
    if (b.clock < this.dodging && this.goal?.kind === 'camp') { if (!(p.c === this.goal.at[0] && p.r === this.goal.at[1])) return true; }
    const danger = new Set<string>();
    for (const f of b.ships) {
      if (f.team === s.team || f.kind !== 'frigate' || f.away > 0 || f.dmg.out || Math.max(Math.abs(f.helm.pose.c - p.c), Math.abs(f.helm.pose.r - p.r)) > BOTS.DODGE.NEAR) continue;
      const poses = [f.helm.pose, f.helm.after()];
      for (const side of ['L', 'R'] as Side[]) {
        if (f.guns.wait[side] > BOTS.DODGE.LOADED) continue;
        for (const at of poses) for (const shot of b.aim(f.id, side, at, false)) for (const [c, r] of shot.cells) danger.add(`${c},${r}`);
      }
    }
    // (and the squares the gate guns have painted, their shots coming down: a sloop's quick enough to be off them)
    b.battery.forEach((gun, i) => { if (!gun.wrecked && b.gunSide[i] !== s.team) for (const x of gun.shots) danger.add(`${x.to[0]},${x.to[1]}`); });
    if (!danger.has(here)) return false;
    // (a duck: whichever of her moves next ends her out of it, one ending beside a rock first, straight on before a turn)
    const cover = (c: number, r: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([x, y]) => b.rocks.has(`${c + x},${r + y}`));
    if (s.helm.slot < 0 || !s.helm.cur) {
      const ducks = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(p, m)).map((m) => {
        const got = s.sea.move(p, m), to = got.ride.length ? got.ride[got.ride.length - 1] : got.to;
        return { m, to, score: (danger.has(`${to.c},${to.r}`) ? 10 : 0) - (cover(to.c, to.r) ? 1 : 0) + (m === 'F' ? 0 : 0.5) };
      }).filter((x) => x.score < 10).sort((a, z) => a.score - z.score);
      if (ducks.length) {
        if (s.helm.pin) s.helm.stop();
        while (s.helm.mine.length) s.helm.unput();
        s.helm.put(ducks[0].m);
        this.goal = { kind: 'camp', at: [ducks[0].to.c, ducks[0].to.r] }; this.dodging = b.clock + BOTS.DODGE.SECS;
        return true;
      }
    }
    const sea = s.sea.bare(), spots: { at: [number, number]; d: number; cover: boolean }[] = [];
    for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) {
      const c = p.c + dc, r = p.r + dr;
      if ((!dc && !dr) || danger.has(`${c},${r}`) || !sea.open(c, r) || b.under(c, r)) continue;
      const near = cover(c, r);
      spots.push({ at: [c, r], d: Math.hypot(dc, dr) - (near ? 0.4 : 0), cover: near });
    }
    spots.sort((a, z) => a.d - z.d);
    const to = spots.find((x) => !this.blocked(b, x.at));
    if (!to) return false;
    this.goal = { kind: 'camp', at: to.at }; this.dodging = b.clock + BOTS.DODGE.SECS;
    this.steer(b, s);
    return true;
  }
  /** Till when she's on her way to the cover she dodged to. */
  protected dodging = -1;
  /** Till when a raider's back on the buoys after a raid. */
  protected rest = -1;
}
