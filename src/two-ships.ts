/* Pirate Den: a war frigate and a sloop on one small sea, a proof of concept (IDEAS.md, "A war frigate and a
   sloop on one board"; RACE.md §11, "Racing in a frigate or a sloop"). TypeScript, compiled to
   js/two-ships.js; tested in tests/ship-handling.test.ts; drawn by js/den/two-ships.js on the unlinked
   frigate-test.html.

   A line of rocks right across the sea with one way through it, an imperial gate (the user, 15 Nov: "taking it
   from that rock boundary into making it a full-on Imperial Gate ... the sloop can run through it. The ship, the war
   frig has to shoot through it because there's only one tile of ... canal between the Imperial Gate. So since the
   war frig needs two, it has to destroy and crumble the towers in order to get through ... It's a way of naturally
   delaying the war [frigs]. Like, they have to go through a shooting destruction phase before they can get into
   the heart and center of the board"):
   - its way under the arch is one square wide: the sloop runs straight through; a war frigate, two squares
     abeam, can't;
   - so she crumbles a tower either side of it, two columns of the wall, with her large guns (TOWER_HP shots, both
     of a broadside landing on it lying along it: src/imperial-gate.ts), and then the way's three wide for anyone.
     The sloop's small guns bounce off the towers;
   - its bastion guns are the den's destructible gun (src/den-turret.ts): they leave you be till someone fires on
     the gate, then fire on whoever's in reach; any gun's hits quieten them, three wreck one. So the frigate pays
     for her way in while she shoots it open.
   Past it, the open sea and a buoy to make for. Both ships sail on it at once, each in the other's way;
   you steer one at a time (the same helm, src/den-sail.ts, by each one's handling: src/ship-handling.ts).
   And they shoot each other (15 Nov: "just be able to shoot at the sloop"): a broadside's shot on the other
   ship holes her, dazed while her crew patch her (no deck patch board on the test sea: a few seconds, longer
   for a large shot). */
import { SAIL, type Move, type Pose } from './den-sail.js';
import { ShipSea, ShipHelm, Guns, broadside, SLOOP_HANDLING, FRIGATE_HANDLING, type Handling, type Shot, type Side, type GunSize } from './ship-handling.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Gate, Tower, TOWER_HP } from './imperial-gate.js';
export { Tower };
import type { SailEvent } from './den-sail.js';

const key = (c: number, r: number) => `${c},${r}`;

/** The test sea's lay (squares: c across, r out from where the ships start). */
export const TWO_SEA = {
  COLS: 24,
  ROWS: 18,
  /** The line of rocks across it, two deep. */
  WALL: { r0: 8, r1: 9 },
  /** The imperial gate, the one way through: its way under the arch (a column, one square wide), its gatehouse's
      towers either side of it (each two columns of the wall, both rows: src/imperial-gate.ts), and its bastion
      guns beyond them (the den's destructible gun: src/den-turret.ts). */
  GATE: { WAY: 16, GUNS: [[12, 8], [20, 8]] as [number, number][] },
  /** Large shots that crumble a tower (src/imperial-gate.ts). */
  TOWER_HP,
  /** Seconds a ship's holed by a hit, by the gun's size, while her crew patch her. */
  HOLED: { small: 3, medium: 4, large: 5 } as Record<GunSize, number>,
  /** The gate's guns' size (what a hit from one holes her for). */
  GATE_GUNS: 'medium' as GunSize,
  /** A few more rocks, out of the way. */
  ROCKS: [[1, 5], [2, 5], [21, 3], [22, 3], [18, 13], [19, 13], [4, 14]] as [number, number][],
  /** The buoy to make for, past the rocks. */
  GOAL: [11, 15] as [number, number],
  /** Where each starts, bows out toward the rocks. */
  START: { sloop: { c: 7, r: 2, d: 0 } as Pose, frigate: { c: 15, r: 3, d: 0 } as Pose },
};

export type Kind = 'sloop' | 'frigate';
export const KINDS: Kind[] = ['sloop', 'frigate'];
export const HANDLINGS: Record<Kind, Handling> = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };

/** What a broadside stopped at: a rock, a gate's tower, one of the gate's guns, or the other ship. */
export type Stop = 'rock' | 'tower' | 'gun' | Kind;
/** A broadside fired: its shots, and what each did: to a tower (which, and what), to a gate's gun (which, and
    what), to the other ship (holed). */
export interface Fired {
  kind: Kind; side: Side;
  shots: (Shot<Stop> & { tower?: number; got?: 'hit' | 'crumbled' | 'bounced'; gun?: number; quieted?: 'quiet' | 'wrecked'; holed?: boolean })[];
}
/** What the gate's guns did on a tick: gun `gun`'s shot fired, or come down (on a ship, `hit`, holing her). */
export interface GunEvent { gun: number; e: TurretEvent; hit: Kind | null }
/** A tick on: what happened to each ship, and the gate's guns. */
export type Ticked = Record<Kind, SailEvent[]> & { guns: GunEvent[] };

/** The two ships on the test sea: each her own sea (her size on the squares, the other in her way) and helm,
    the rocks and the gate shared. */
export class TwoShips {
  rocks = new Set<string>();
  /** The gate (src/imperial-gate.ts), its towers either side of its way. */
  gate = new Gate(TWO_SEA.GATE.WAY, TWO_SEA.WALL.r0, TWO_SEA.WALL.r1);
  towers: Tower[] = this.gate.towers;
  /** The gate's bastion guns. */
  battery: Turret[] = TWO_SEA.GATE.GUNS.map((at) => new Turret({ at, alert: false }));
  ships: Record<Kind, { h: Handling; sea: ShipSea; helm: ShipHelm; guns: Guns }>;
  /** Seconds each still has to be patched (holed). */
  patch: Record<Kind, number> = { sloop: 0, frigate: 0 };
  /** The one you're steering. */
  active: Kind = 'sloop';
  private seen: Record<Kind, string> = { sloop: '', frigate: '' };

  constructor() {
    const S = TWO_SEA;
    for (let c = 0; c < S.COLS; c++) for (let r = S.WALL.r0; r <= S.WALL.r1; r++) if (c !== S.GATE.WAY) this.rocks.add(key(c, r));
    for (const [c, r] of S.ROCKS) this.rocks.add(key(c, r));
    const make = (kind: Kind) => {
      const h = HANDLINGS[kind], other = kind === 'sloop' ? 'frigate' : 'sloop';
      const sea = new ShipSea(h, S.COLS, S.ROWS, this.rocks, (c, r) => !!this.ships?.[other]?.helm.covers().has(key(c, r)));
      return { h, sea, helm: new ShipHelm(sea, S.START[kind]), guns: new Guns(h.reload) };
    };
    this.ships = { sloop: make('sloop'), frigate: make('frigate') };
    this.notice();
  }

  other(kind: Kind): Kind { return kind === 'sloop' ? 'frigate' : 'sloop'; }

  /** Each ship's helm and guns a tick on, her patching, and the gate's guns: what happened. */
  tick(dt: number): Ticked {
    const out = { guns: [] } as unknown as Ticked;
    for (const k of KINDS) {
      const s = this.ships[k];
      if (this.patch[k] > 0 && (this.patch[k] -= dt) <= 1e-9) { this.patch[k] = 0; s.helm.hole = null; }
      out[k] = s.helm.tick(dt);
      s.guns.tick(dt);
      this.notice();
    }
    this.battery.forEach((g, i) => {
      for (const e of g.tick(dt, this.target(g))) {
        const hit = e.kind === 'land' ? this.under(...e.to) : null;
        if (hit) this.hole(hit, TWO_SEA.GATE_GUNS);
        out.guns.push({ gun: i, e, hit });
      }
    });
    return out;
  }
  /** The ship a gate's gun fires on, if any's in its reach and fair game (not holed, nor just patched): the
      square of hers nearest it. */
  private target(g: Turret): { c: number; r: number } | null {
    let best: [number, number] | null = null, far = Infinity;
    for (const k of KINDS) {
      if (this.ships[k].helm.spared()) continue;
      for (const id of this.ships[k].helm.covers()) {
        const [c, r] = id.split(',').map(Number), d = Math.max(Math.abs(c - g.at[0]), Math.abs(r - g.at[1]));
        if (g.reaches(c, r) && d < far) { far = d; best = [c, r]; }
      }
    }
    return best && { c: best[0], r: best[1] };
  }
  /** The ship on this square, if one is. */
  under(c: number, r: number): Kind | null { return KINDS.find((k) => this.ships[k].helm.covers().has(key(c, r))) ?? null; }
  /** Holed by a shot of that size: dazed (Helm.hit) till her crew have patched her. */
  hole(kind: Kind, guns: GunSize) {
    this.ships[kind].helm.hit();
    this.patch[kind] = Math.max(this.patch[kind], TWO_SEA.HOLED[guns]);
  }
  /** Holed, being patched. */
  holed(kind: Kind): boolean { return this.ships[kind].helm.dazed(); }
  /** Where either's moved to, the other's pilot works her way out afresh. */
  private notice() {
    for (const k of KINDS) {
      const sig = [...this.ships[k].helm.covers()].sort().join(' ');
      if (sig !== this.seen[k]) { this.seen[k] = sig; this.ships[this.other(k)].sea.touch(); }
    }
  }

  /** The gate's tower standing on this square, if one is (its number), else -1. */
  towerAt(c: number, r: number): number { return this.gate.towerAt(c, r); }
  /** A tower's down: the way's two wide. */
  gateOpen(): boolean { return this.gate.open(); }

  /** The gate's gun on this square, if it's one's (standing or wrecked). */
  gunAt(c: number, r: number): number { return this.battery.findIndex((g) => g.at[0] === c && g.at[1] === r); }

  /** What a shot from `kind` would stop at on this square. */
  stopAt(kind: Kind, c: number, r: number): Stop | null {
    if (this.towerAt(c, r) >= 0) return 'tower';
    const g = this.gunAt(c, r);
    if (g >= 0) return this.battery[g].wrecked ? 'rock' : 'gun';
    if (this.rocks.has(key(c, r))) return 'rock';
    const o = this.other(kind);
    return this.ships[o].helm.covers().has(key(c, r)) ? o : null;
  }

  /** Fire `kind`'s broadside out of that side, if it's loaded (null if not). A large gun's shot on a tower
      knocks a piece off; the last crumbles it, and its squares are open water. Any shot on a gate's gun quietens
      it (the third wrecks it); a shot on the gate or its guns rouses them all. A shot on the other ship holes
      her. */
  fire(side: Side, kind: Kind = this.active): Fired | null {
    const s = this.ships[kind];
    if (!s.guns.fire(side)) return null;
    const shots: Fired['shots'] = broadside(s.h, s.helm.now(), side, (c, r) => this.stopAt(kind, c, r)).map((shot) => {
      if (shot.what === 'tower') {
        const tower = this.towerAt(...shot.hit!), got = this.towers[tower].hit(s.h.guns);
        if (got === 'crumbled') this.crumble(tower);
        return { ...shot, tower, got: got ?? undefined };
      }
      if (shot.what === 'gun') {
        const gun = this.gunAt(...shot.hit!), got = this.battery[gun].hit();
        return { ...shot, gun, quieted: got ?? undefined };
      }
      if (shot.what === 'sloop' || shot.what === 'frigate') { this.hole(shot.what, s.h.guns); return { ...shot, holed: true }; }
      return shot;
    });
    if (shots.some((x) => x.what === 'tower' || x.what === 'gun')) for (const g of this.battery) g.rouse();
    return { kind, side, shots };
  }
  private crumble(i: number) {
    for (const [c, r] of this.towers[i].squares) this.rocks.delete(key(c, r));
    for (const k of KINDS) this.ships[k].sea.touch();
  }

  /** The pin for the one you're steering, near this square: where it went (null if she can't get anywhere
      near), and whether that's short of where you meant (she can't get there, as things are). */
  drop(c: number, r: number, kind: Kind = this.active): { at: [number, number]; short: boolean } | null {
    const at = this.ships[kind].helm.drop(c, r);
    if (!at) return null;
    return { at, short: Math.hypot(at[0] - c, at[1] - r) > 1.5 };
  }
  /** A move put in yourself. */
  put(m: Move, kind: Kind = this.active): boolean { return this.ships[kind].helm.put(m); }

  /** She's past the rocks. */
  through(kind: Kind): boolean { return this.ships[kind].helm.pose.r > TWO_SEA.WALL.r1; }
}

/** A square of the test sea in metres (its middle; x across, z out, -z as the den's sea: js/den/two-ships.js
    lays it with the board's middle at the origin). */
export const seaXZ = (c: number, r: number): [number, number] => [(c + 0.5 - TWO_SEA.COLS / 2) * SAIL.CELL, -(r + 0.5 - TWO_SEA.ROWS / 2) * SAIL.CELL];
/** A point on the water back to the square it's over (fractional). */
export const seaCR = (x: number, z: number): [number, number] => [x / SAIL.CELL + TWO_SEA.COLS / 2 - 0.5, -z / SAIL.CELL + TWO_SEA.ROWS / 2 - 0.5];
