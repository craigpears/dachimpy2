/* Pirate Den: Swordfight in the den. TypeScript, compiled to js/den-sword.js; tested in
   tests/den-sword.test.ts. The puzzle itself is src/swordfight.ts; how the board looks is
   src/den-sword-draw.ts; den.js only draws the 3D and wires these to the raid.

   The user (8 Nov), wanting more ways to fight the raids than mending the wall, chosen naturally as
   the raid goes ("attackers are coming and you just choose which ways to deal with them"): a
   sword-fighting piece from each raider beaten, landing inside the den, and the pieces "spawn little
   soldiers so they would help you defend. So obviously they'd end up sword fighting". The puzzle is
   the real one; what a break would send at an opponent goes to the raid instead. Since 8 Nov, after
   a demo (the user: "you'd have to do a combo, like a fuse block to get a soldier, and obviously
   combo for multiples"): a fused block broken arms soldiers, as many as the chain's link. Sprinkles
   are loose crates broken up for planks, and every few crates' planks mend a piece's worth of a
   hole for good (the user, 8 Nov, finding barricade crates piled on the ground confusing: "maybe
   you have to do a certain number and it actually fills in a hole a bit ... more of like a
   permanent wall repair for sprinkling"). */

import { Board } from './swordfight.js';
import type { Colour, Pair, Result, Strike } from './swordfight.js';
import type { Cell, Engine, Placed } from './engine';

/** The numbers to tune. */
export const SWORD = {
  /** Seconds for the falling pair to drop a row. */
  FALL: 0.6,
  /** Sword pieces you can carry on your back. */
  PACK: 8,
  /** Pairs the armoury's shelves hold, waiting to be played: dropped off just by walking up to the
      hoist (the user, 9 Nov: "you should be able to just drop them off, like by going near the
      armory. You shouldn't have to press space ... you should see the collection really building
      up"). Six shelves of four. */
  STORE: 24,
  SHELF: 4,
  /** Soldiers in the den at once, to start with: a handful. The user (9 Nov): "make sure there's
      only so many soldiers you can have ... limited to a handful at the start, but can be upgraded
      ... as you build more of a pirate den", to "build a little army up later" (Barracks.cap). */
  START_SOLDIERS: 5,
  /** Blows a raider takes. */
  RAIDER_HP: 2,
  /** Seconds between a soldier's blows, and between a raider's. */
  SOLDIER_BLOW: 0.75,
  RAIDER_BLOW: 1,
  /** How close a soldier has to be to fight. */
  REACH: 0.85,
  /** Walking pace, metres a second. */
  SPEED: 3.4,
  /** A soldier can't step out past the wall: this far into the den at least. */
  INSIDE: 0.6,
} as const;

/** A soldier to send out: how many blows it can take, and how big it stands. */
export interface Recruit { hp: number; size: number; sword?: Strike }

/** The soldiers a break arms: only fused blocks do it (a big chest of swords bursting open). Each
    one broken arms a soldier, or two on the second link of a chain, three on the third, and so on.
    A bigger block makes tougher, bigger soldiers: the smallest (2x2) takes three blows. Loose pieces
    arm nobody: their sprinkles are planks for repairs (see Lumber and planRepair). */
export function muster(res: Result): Recruit[] {
  const out: Recruit[] = [];
  for (const link of res.links) for (const s of link.strikes) {
    const base = (s.w * s.h) / link.chain;   // the block's own size: toSword grew it by the chain
    const hp = Math.min(6, 2 + Math.floor(base / 4)), size = Math.min(1.5, 1 + Math.max(0, base - 4) / 16);
    for (let i = 0; i < link.chain; i++) out.push({ hp, size, sword: s });
  }
  return out;
}

/** Repairs: loose crates broken on the hoist are broken up for planks, and every REPAIR.CRATES
    crates' worth mends a piece's worth of a hole for good, nailed in as a piece would be. */
export const REPAIR = {
  /** Loose crates (sprinkles) to a piece's worth of planks. */
  CRATES: 4,
  /** Planks kept waiting while no hole needs them: this many pieces' worth at most. */
  KEEP: 3,
} as const;

/** The planks broken out of loose crates, waiting by the hoist till there's a piece's worth. */
export class Lumber {
  crates = 0;
  /** Crates broken up; any past what can be kept are lost. */
  add(n: number): void { this.crates = Math.min(REPAIR.CRATES * REPAIR.KEEP, this.crates + n); }
  /** Is there a piece's worth? */
  get ready(): boolean { return this.crates >= REPAIR.CRATES; }
  /** Use a piece's worth. */
  use(): void { this.crates = Math.max(0, this.crates - REPAIR.CRATES); }
  reset(): void { this.crates = 0; }
}

/** A hole in the wall, as the repairs see it. */
export interface Mend {
  /** Squares still to fill. */
  rest: Cell[];
  /** A gap raiders can walk through right now. */
  open: boolean;
  /** Raiders hacking at it. */
  attackers: number;
  /** What's left of what's in it, 0 (nothing) to 1 (whole). */
  strength: number;
}

/** Where the next piece's worth of planks goes: the hole that needs it most (a gap raiders can
    walk through first, then the one hacked hardest, then the weakest; the nearest done if it's a
    tie), and in it, a piece lying in the hole that leaves the rest still finishable exactly, so a
    Masterpiece is still there to be made; lowest down first, where raiders come through. A hole
    that can't be finished exactly any more just gets any piece that fits, lowest down. Null if no
    hole has room for one. Rows count down the wall (row 0 at the top). */
export function planRepair(holes: Mend[], carp: Engine): { hole: number; piece: Placed } | null {
  const need = (m: Mend) => (m.open ? 3 : 0) + m.attackers + (1 - m.strength);
  const order = holes.map((m, i) => i).filter((i) => holes[i].rest.length >= 5)
    .sort((a, b) => need(holes[b]) - need(holes[a]) || holes[a].rest.length - holes[b].rest.length);
  const low = (p: Placed) => p.cells.reduce((t, [r]) => t + r, 0);
  const lowest = (ps: Placed[]) => ps.reduce<Placed | null>((best, p) => (!best || low(p) > low(best) ? p : best), null);
  for (const i of order) {
    const rest = holes[i].rest;
    if (rest.length % 5 === 0) {
      const ways = carp.solve(rest, 12).flat();
      if (ways.length) return { hole: i, piece: lowest(ways)! };
    }
    const set = new Set(rest.map(([r, c]) => `${r},${c}`)), fits: Placed[] = [];
    for (const l of carp.LETTERS) for (const o of carp.ORIENTS_BY_LETTER[l]) for (const [er, ec] of rest) {
      const [pr, pc] = o.cells[0], cells = o.cells.map(([r, c]): Cell => [r - pr + er, c - pc + ec]);
      if (cells.every(([r, c]) => set.has(`${r},${c}`))) fits.push({ letter: l, cells });
    }
    if (fits.length) return { hole: i, piece: lowest(fits)! };
  }
  return null;
}

/** A Masterpiece's reward: a pair with a breaker in it (a block underneath, a breaker on top, any
    colours). The user (8 Nov): "the whole getting some gold thing is fairly meaningless. So getting
    a reward like some breakers would be a lot better than gold." */
export function rewardPair(random: () => number = Math.random): Pair {
  const colour = () => Math.min(3, Math.floor(random() * 4)) as Colour;
  return [{ c: colour(), breaker: false }, { c: colour(), breaker: true }];
}

/** What happened at the rack this frame. */
export interface RackNews { landed?: Result; lost?: boolean; changed?: boolean }

/** The sword rack: the Swordfight board, the pieces you've picked up and not yet played (a pair
    comes in only while you're at the rack), and the falling pair's timer. */
export class SwordRack {
  readonly board: Board;
  /** The pairs on the armoury's shelves, next down first. */
  queue: Pair[] = [];
  /** The pairs on your back. */
  pack: Pair[] = [];
  private fallT = 0;

  constructor(random: () => number = Math.random) { this.board = new Board(random); }

  /** Pieces at the hoist still to play: the ones on the shelves, and the one falling. */
  get pieces(): number { return this.queue.length + (this.board.falling ? 1 : 0); }

  /** Pick up a sword piece, onto your back. False if you're carrying all you can. */
  take(pair: Pair): boolean {
    if (this.pack.length >= SWORD.PACK) return false;
    this.pack.push(pair);
    return true;
  }

  /** At the hoist: everything on your back onto the shelves (as much as there's room for). How
      many pairs went up. */
  unload(): number {
    const n = Math.min(this.pack.length, SWORD.STORE - this.queue.length);
    this.queue.push(...this.pack.splice(0, n));
    return n;
  }

  /** A reward (see rewardPair): straight onto the shelves at the front, so it's the next pair down.
      False if the shelves are full (den.js leaves it on the floor instead). */
  give(pair: Pair): boolean {
    if (this.queue.length >= SWORD.STORE) return false;
    this.queue.unshift(pair);
    return true;
  }

  /** A frame at the rack: the next pair comes in, and falls a row every SWORD.FALL seconds. If it
      can't come in (the fourth column's full), the fight's lost: the stack topples and the board
      clears (the crates still on the shelves are kept: with a whole store up there, losing it all
      would be too harsh). */
  tick(dt: number): RackNews {
    const b = this.board;
    if (!b.falling) {
      if (!this.queue.length) return {};
      if (!b.spawn(this.queue[0])) { b.clear(); this.fallT = 0; return { lost: true, changed: true }; }
      this.queue.shift();
      this.fallT = 0;
      return { changed: true };
    }
    this.fallT += dt;
    if (this.fallT < SWORD.FALL) return {};
    this.fallT = 0;
    const landed = b.step();
    return landed ? { landed, changed: true } : { changed: true };
  }

  move(dc: number): boolean { return this.board.move(dc); }
  turn(dir: 1 | -1): boolean { return this.board.rotate(dir); }
  /** Space: straight down. */
  drop(): Result | null {
    if (!this.board.falling) return null;
    this.fallT = 0;
    return this.board.drop();
  }

  /** An attack from the raid: sprinkles on the board. */
  hitBy(sprinkles: number): number { return this.board.receive(sprinkles); }

  reset(): void { this.board.clear(); this.queue = []; this.pack = []; this.fallT = 0; }
}

/** A raider, as the soldiers see one. (den.js's raiders carry much more; this is all that matters here.) */
export interface Foe {
  x: number;
  z: number;
  state: string;
  inside: boolean;
  gone?: boolean;
  /** Blows left (SWORD.RAIDER_HP to start). */
  hp?: number;
  /** The soldier they've stopped to fight, if any. */
  duel?: Soldier | null;
  /** Their own blow timer (den.js shares it with hacking). */
  hitT: number;
}

export interface Soldier {
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  size: number;
  state: 'up' | 'down';
  foe: Foe | null;
  /** Which way they face, and whether they're walking or fighting (for den.js to pose them). */
  fx: number;
  fz: number;
  moving: boolean;
  fighting: boolean;
  /** Seconds since they fell. */
  downT: number;
  hitT: number;
  retT: number;
}

/** Something den.js shows: a blow landing, a raider knocked flat (by), a soldier falling. */
export type BarracksNews =
  | { kind: 'blow'; x: number; z: number }
  | { kind: 'knock'; foe: Foe; by: Soldier }
  | { kind: 'fell'; soldier: Soldier };

/** Who a soldier can reach: raiders in the den, and ones coming in through a gap. */
export const reachable = (r: Foe): boolean => !r.gone && r.state !== 'down' && (r.inside || r.state === 'climb' || r.state === 'winded');

/** The armoury hoist, as the soldiers see it: the middle of the stack's foot (it faces +x, into the
    den, its width running along z) and how wide it is. The winch is on its +z side. */
export interface Hoist { x: number; z: number; w: number }

/** Where soldiers with nobody to fight or guard wait: off to the winch's side of the hoist, past
    where you stand to work it, never in front of the stack. The user (9 Nov): they "stand in a spot
    that obscures the swordfighting board". Barracks.post lines them up from here, four to a row,
    each row further along. */
export function waitSpot(h: Hoist): { x: number; z: number } {
  return { x: h.x + 1.4, z: h.z + h.w / 2 + 1.9 };
}

/** The soldiers: who each goes for, where they stand when there's nobody to fight, and the duels. */
export class Barracks {
  soldiers: Soldier[] = [];
  /** How many soldiers the den can hold at once: a handful, till building up the den raises it. */
  cap: number = SWORD.START_SOLDIERS;

  /** New soldiers at (x, z), as many as there's room for. Returns the ones that came. */
  enlist(recruits: Recruit[], x: number, z: number): Soldier[] {
    const room = Math.max(0, this.cap - this.up().length);
    const out = recruits.slice(0, room).map((rc, i): Soldier => ({
      x: x + ((i % 3) - 1) * 0.5, z: z + Math.floor(i / 3) * 0.4, hp: rc.hp, maxHp: rc.hp, size: rc.size,
      state: 'up', foe: null, fx: 0, fz: -1, moving: false, fighting: false, downT: 0, hitT: 0.4, retT: 0,
    }));
    this.soldiers.push(...out);
    return out;
  }

  up(): Soldier[] { return this.soldiers.filter((s) => s.state === 'up'); }

  /** The raider a soldier should go for: the nearest they can reach, spreading out (a raider two
      others are already on counts as four metres further away). */
  pick(s: Soldier, foes: Foe[]): Foe | null {
    let best: Foe | null = null, bd = Infinity;
    for (const r of foes) {
      if (!reachable(r)) continue;
      const others = this.soldiers.filter((o) => o !== s && o.state === 'up' && o.foe === r).length;
      const d = Math.hypot(r.x - s.x, r.z - s.z) + others * 4;
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  /** With nobody to fight, where soldier i stands: shared out over the spots to guard (gaps in the
      wall first; den.js decides), side by side when several share one. */
  post(i: number, spots: { x: number; z: number }[], home: { x: number; z: number }): { x: number; z: number } {
    if (!spots.length) return { x: home.x + ((i % 4) - 1.5) * 0.7, z: home.z + Math.floor(i / 4) * 0.6 };
    const p = spots[i % spots.length], n = Math.floor(i / spots.length);
    return { x: p.x + (n % 2 ? 0.5 : -0.5) * Math.ceil(n / 2), z: p.z + n * 0.15 };
  }

  /** The soldiers' turn. `spots`: where to stand guard; `home`: where to wait when there's nothing to guard. */
  tick(dt: number, foes: Foe[], spots: { x: number; z: number }[], home: { x: number; z: number }): BarracksNews[] {
    const news: BarracksNews[] = [];
    this.up().forEach((s, i) => {
      if (s.foe && !reachable(s.foe)) s.foe = null;
      // Look again every half second for the best one to go for, but never walk off mid-fight.
      s.retT -= dt;
      const close = !!s.foe && Math.hypot(s.foe.x - s.x, s.foe.z - s.z) <= SWORD.REACH;
      if (!close && (!s.foe || s.retT <= 0)) { s.retT = 0.5; s.foe = this.pick(s, foes); }
      s.moving = s.fighting = false;
      const r = s.foe;
      if (r && Math.hypot(r.x - s.x, r.z - s.z) > SWORD.REACH) s.moving = this.walk(s, r.x, Math.max(SWORD.INSIDE, r.z), SWORD.SPEED, dt);
      else if (r) {
        // En garde: the raider stops to fight (the first soldier to reach them), blow for blow.
        if (!r.duel) r.duel = s;
        s.fighting = true;
        this.face(s, r.x - s.x, r.z - s.z);
        s.hitT -= dt;
        if (s.hitT <= 0) {
          s.hitT = SWORD.SOLDIER_BLOW;
          r.hp = (r.hp ?? SWORD.RAIDER_HP) - 1;
          news.push({ kind: 'blow', x: (r.x + s.x) / 2, z: (r.z + s.z) / 2 });
          if (r.hp <= 0) { r.duel = null; s.foe = null; news.push({ kind: 'knock', foe: r, by: s }); }
        }
      } else {
        const p = this.post(i, spots, home);
        s.moving = this.walk(s, p.x, p.z, SWORD.SPEED * 0.9, dt);
        if (!s.moving) { s.fx = 0; s.fz = -1; }
      }
    });
    for (const s of this.soldiers) if (s.state === 'down') s.downT += dt;
    return news;
  }

  /** A raider a soldier has squared up to stops and fights back. True while they're fighting (so
      den.js leaves them where they are); a soldier who walks off or falls lets them go. */
  duel(r: Foe, dt: number): { fighting: boolean; news: BarracksNews[] } {
    const s = r.duel, news: BarracksNews[] = [];
    if (!s || s.state !== 'up' || r.state === 'down' || Math.hypot(s.x - r.x, s.z - r.z) > SWORD.REACH + 0.35) {
      r.duel = null;
      return { fighting: false, news };
    }
    r.hitT -= dt;
    if (r.hitT <= 0) {
      r.hitT = SWORD.RAIDER_BLOW;
      s.hp--;
      news.push({ kind: 'blow', x: s.x, z: s.z });
      if (s.hp <= 0) { s.state = 'down'; s.foe = null; r.duel = null; news.push({ kind: 'fell', soldier: s }); }
    }
    return { fighting: true, news };
  }

  /** Soldiers who fell a while ago, taken off the field (den.js removes their figures). */
  sweep(after = 1.6): Soldier[] {
    const gone = this.soldiers.filter((s) => s.state === 'down' && s.downT >= after);
    this.soldiers = this.soldiers.filter((s) => !gone.includes(s));
    return gone;
  }

  reset(): Soldier[] { const all = this.soldiers; this.soldiers = []; return all; }

  private face(s: Soldier, dx: number, dz: number): void {
    const n = Math.hypot(dx, dz);
    if (n > 1e-6) { s.fx = dx / n; s.fz = dz / n; }
  }

  /** A step towards (tx, tz). True while still on the way. */
  private walk(s: Soldier, tx: number, tz: number, speed: number, dt: number): boolean {
    const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz);
    if (d < 0.08) return false;
    const step = Math.min(d, speed * dt);
    s.x += (dx / d) * step; s.z += (dz / d) * step;
    this.face(s, dx, dz);
    return true;
  }
}
