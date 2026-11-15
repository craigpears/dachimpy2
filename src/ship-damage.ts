/* Pirate Den: a ship's damage, as Puzzle Pirates keeps it, and her crew at work on it. TypeScript, compiled to
   js/ship-damage.js; tested in tests/ship-damage.test.ts; knows nothing of where she's sailed. The blockade's
   ships (src/blockade.ts) take it; js/den/ship-damage.js draws it on any ship.

   The user (15 Nov): "I think this is the natural place to start adding the damage tile mechanic ... as it starts
   getting chipped away or shot, damage goes up, and you should visibly start seeing some holes and bilge appear ...
   maybe you would have a few like carpentry bots on board ... slowly repairing or bilging out ... I want to shoot
   cannonballs at it, see a hole and see an explode or bang and a hole appear in the side of the war frigate as I shoot
   it, and for it to appear where I've shot it. I want to shoot the sloop from the war frigate and see it just go
   dead in the water ... they then have to sit there and rebuild."

   By YPPedia ("Damage meter", "War frigate"): a shot's damage by its size, a war frigate's full damage 15 large,
   20 medium or 30 small; damage fills the bilge faster, and water slows her; carpentry takes damage off. Here:
   - damage in small shots' worth (SHOT), each hit a hole where it struck (along her, which side);
   - full damage by her class (FULL; a war frigate's YPPedia's, the sloop's to check);
   - her carpenters patch the holes in order, her bilgers pump, both quicker with more stations (CREW);
   - water comes in faster the more she's damaged, and slows her moves (`drag`);
   - at full damage she's knocked out, dead in the water, till her carpenters have her back under RECOVER of it;
   - shot on while she's knocked out, past full by SINK of it, she sinks (the user, 15 Nov: "eventually you do need
     ships to be able to [sink]. Because that's part of the joy of blockading is, oh, look, we've lost control of the
     central area, we've got to get back in there again"). Her carpenters keep at it while she's out, so her friends
     can still save her by driving off whoever's finishing her. */
import type { GunSize } from './ship-handling.js';
import type { ShipClass } from './ships.js';

export const DAMAGE = {
  /** A hit's damage, by its gun's size, in small shots' worth (YPPedia: 30 small = 20 medium = 15 large). */
  SHOT: { small: 1, medium: 1.5, large: 2 } as Record<GunSize, number>,
  /** Full damage, in small shots: a war frigate's YPPedia's (30); the sloop's and the war brig's not checked yet (6,
      15: halfway between, as Puzzle Pirates has her, the user, 15 Nov: "consistent with Puzzle Pirates"); a brig's
      craft (src/blockade.ts, LAUNCH): a sea turtle's, four. */
  FULL: { 'War frigate': 30, 'War brig': 15, Sloop: 6, 'Sea turtle': 4 } as Record<string, number>,
  /** Damage a second her carpenters take off, by the square root of her carpentry stations. */
  CARP: 0.035,
  /** Water a second her bilgers pump out (of a full bilge, 1), by the square root of her bilge stations. */
  PUMP: 0.012,
  /** Water a second coming in at full damage (in proportion below it). */
  LEAK: 0.12,
  /** How much a full bilge slows her moves (1 + DRAG x water). */
  DRAG: 0.6,
  /** Knocked out at full damage, she's back in action under this share of it. */
  RECOVER: 0.6,
  /** Knocked out, she sinks with this share of full damage more on her (a war frigate 12 small shots' worth more, six
      large; a sloop between one and two large). */
  SINK: 0.4,
};

/** A hole, where it struck: `along` her from stern (-0.5) to bow (0.5), on her port or starboard side (or her
    deck), its damage still to patch. */
export interface Hole { id: number; along: number; side: 'L' | 'R' | 'deck'; gun: GunSize; left: number }
export type DamageEvent = { kind: 'patched'; hole: Hole } | { kind: 'out' } | { kind: 'back' };

let ids = 0;
/** One ship's damage and her crew working on it. */
export class Damage {
  holes: Hole[] = [];
  /** Her bilge, 0 (dry) to 1 (full). */
  water = 0;
  /** Knocked out: dead in the water. */
  out = false;
  /** Sunk: shot on while she was knocked out till she went down. */
  sunk = false;
  readonly full: number;
  readonly carp: number;
  readonly pump: number;
  constructor(public ship: ShipClass) {
    this.full = DAMAGE.FULL[ship.name] ?? 10;
    this.carp = DAMAGE.CARP * Math.sqrt(ship.stations.carpentry);
    this.pump = DAMAGE.PUMP * Math.sqrt(ship.stations.bilge);
  }
  /** Her damage, in small shots' worth. */
  total(): number { return this.holes.reduce((t, h) => t + h.left, 0); }
  /** Her damage as a share of full. */
  share(): number { return Math.min(1, this.total() / this.full); }
  /** Struck by a shot of that size, there: the hole it makes (knocking her out if it's her last; sinking her if she
      was knocked out already and it's more than she can take, `sinks` false where nobody sinks). */
  hit(gun: GunSize, along: number, side: Hole['side'], sinks = true): { hole: Hole; out: boolean; sunk: boolean } {
    const hole = { id: ++ids, along: Math.max(-0.5, Math.min(0.5, along)), side, gun, left: DAMAGE.SHOT[gun] };
    const was = this.out;
    this.holes.push(hole);
    const out = !this.out && this.total() >= this.full - 1e-9;
    if (out) this.out = true;
    const sunk = sinks && was && !this.sunk && this.total() >= this.full * (1 + DAMAGE.SINK) - 1e-9;
    if (sunk) this.sunk = true;
    return { hole, out, sunk };
  }
  /** Refitted (back in action after she sank): no holes, a dry bilge. */
  refit() { this.holes = []; this.water = 0; this.out = false; this.sunk = false; }
  /** Her crew at work a while: her carpenters on the oldest hole, her bilgers on the water, the water coming in. */
  tick(dt: number): DamageEvent[] {
    const out: DamageEvent[] = [];
    if (this.sunk) return out;
    let work = this.carp * dt;
    while (work > 0 && this.holes.length) {
      const h = this.holes[0], d = Math.min(work, h.left);
      h.left -= d; work -= d;
      if (h.left <= 1e-9) { this.holes.shift(); out.push({ kind: 'patched', hole: h }); }
    }
    this.water = Math.max(0, Math.min(1, this.water + (DAMAGE.LEAK * this.share() - this.pump) * dt));
    if (this.out && this.share() <= DAMAGE.RECOVER) { this.out = false; out.push({ kind: 'back' }); }
    return out;
  }
  /** How much longer her moves take for the water in her. */
  drag(): number { return 1 + DAMAGE.DRAG * this.water; }
}

/** Where on her a shot struck: `along` her (stern -0.5 to bow 0.5) from her own square and heading, the square it
    struck and her length in squares; the side it came in on from where it was fired. Her squares lie along her
    from her own (src/ship-handling.ts, alongs). */
export function struck(own: { c: number; r: number; d: number }, long: number, at: [number, number], from: [number, number]): { along: number; side: 'L' | 'R' } {
  const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], hc = DC[own.d], hr = DR[own.d], sc = DC[(own.d + 1) % 4], sr = DR[(own.d + 1) % 4];
  const mid = long % 2 ? 0 : -0.5;   // (her middle along her from her own square: alongs' mean)
  const a = (at[0] - own.c) * hc + (at[1] - own.r) * hr - mid;
  const s = (from[0] - at[0]) * sc + (from[1] - at[1]) * sr;
  return { along: long > 1 ? a / long : 0, side: s >= 0 ? 'R' : 'L' };
}
