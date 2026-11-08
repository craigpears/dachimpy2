/* Pirate Den: Swordfight in the den. TypeScript, compiled to js/den-sword.js; tested in
   tests/den-sword.test.ts. The puzzle itself is src/swordfight.ts; how the board looks is
   src/den-sword-draw.ts; den.js only draws the 3D and wires these to the raid.

   The user (8 Nov), wanting more ways to fight the raids than mending the wall, chosen naturally as
   the raid goes ("attackers are coming and you just choose which ways to deal with them"): a
   sword-fighting piece from each raider beaten, landing inside the den, and the pieces "spawn little
   soldiers so they would help you defend. So obviously they'd end up sword fighting". The puzzle is
   the real one; what a break would send at an opponent musters soldiers instead: a soldier for every
   sprinkle, a bigger, tougher champion for every sword. */

import { Board } from './swordfight.js';
import type { Pair, Result, Strike } from './swordfight.js';

/** The numbers to tune. */
export const SWORD = {
  /** Seconds for the falling pair to drop a row. */
  FALL: 0.6,
  /** Sword pieces you can carry, waiting to be played. */
  QUEUE: 8,
  /** Soldiers in the den at once. */
  MAX_SOLDIERS: 10,
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

/** The soldiers a break musters: one (two blows) for each sprinkle, and a champion for each sword,
    as tough as the sword is big (a 1x4, the smallest, takes four blows). */
export function muster(res: Result): Recruit[] {
  const out: Recruit[] = [];
  for (const s of res.strikes) {
    const area = s.w * s.h;
    out.push({ hp: area, size: Math.min(1.6, 1 + area / 20), sword: s });
  }
  for (let i = 0; i < res.sprinkles; i++) out.push({ hp: 2, size: 1 });
  return out;
}

/** What happened at the rack this frame. */
export interface RackNews { landed?: Result; lost?: boolean; changed?: boolean }

/** The sword rack: the Swordfight board, the pieces you've picked up and not yet played (a pair
    comes in only while you're at the rack), and the falling pair's timer. */
export class SwordRack {
  readonly board: Board;
  queue: Pair[] = [];
  private fallT = 0;

  constructor(random: () => number = Math.random) { this.board = new Board(random); }

  /** Pieces still to play: the ones waiting, and the one falling. */
  get pieces(): number { return this.queue.length + (this.board.falling ? 1 : 0); }

  /** Pick up a sword piece. False if your hands are full. */
  take(pair: Pair): boolean {
    if (this.queue.length >= SWORD.QUEUE) return false;
    this.queue.push(pair);
    return true;
  }

  /** A frame at the rack: the next pair comes in, and falls a row every SWORD.FALL seconds. If it
      can't come in (the fourth column's full), the fight's lost: the board clears, and the pieces with it. */
  tick(dt: number): RackNews {
    const b = this.board;
    if (!b.falling) {
      if (!this.queue.length) return {};
      if (!b.spawn(this.queue[0])) { this.reset(); return { lost: true, changed: true }; }
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

  reset(): void { this.board.clear(); this.queue = []; this.fallT = 0; }
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

/** The soldiers: who each goes for, where they stand when there's nobody to fight, and the duels. */
export class Barracks {
  soldiers: Soldier[] = [];

  /** New soldiers at (x, z), as many as there's room for. Returns the ones that came. */
  enlist(recruits: Recruit[], x: number, z: number): Soldier[] {
    const room = Math.max(0, SWORD.MAX_SOLDIERS - this.up().length);
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
