/* Pirate Den: an imperial gate across a wall of rocks, its rules: a way through it one square wide under its
   arch, a tower either side, crumbled only by large guns. TypeScript, compiled to js/imperial-gate.js; knows
   nothing of where it stands. The frigate-and-sloop test sea's (src/two-ships.ts) and the blockade's
   (src/blockade.ts); drawn by js/den/empire.js's gatehouse, its towers and arch kept apart to fall.

   The user (15 Nov): "the sloop can run through it. The ship, the war frig has to shoot through it because there's
   only one tile of ... canal between the Imperial Gate. So since the war frig needs two, it has to destroy and
   crumble the towers in order to get through ... It's a way of naturally delaying the war [frigs]. Like, they have
   to go through a shooting destruction phase before they can get into the heart and center of the board." Its
   bastion guns are the den's destructible gun (src/den-turret.ts), placed by whoever lays the gate.

   Each tower stands two squares wide, so a crumbled one leaves a way three wide: a war frigate's big moves keep her
   on every other square (src/ship-handling.ts: her middle moves two at a time), so a way two wide would let only
   half of them through; three wide, any can. Lying along it, both shots of her broadside land on the tower. */
import type { GunSize } from './ship-handling.js';

/** Large shots that crumble a tower: three of her broadsides, both shots of each on it. */
export const TOWER_HP = 6;

/** A tower of the gate: its squares (its columns of the wall, rows r0 to r1: rocks to sail by till it's
    crumbled), and what's left of it. Only large guns hurt it. */
export class Tower {
  squares: [number, number][] = [];
  hp: number;
  constructor(public cols: number[], r0: number, r1: number, hp: number = TOWER_HP) {
    this.hp = hp;
    for (const c of cols) for (let r = r0; r <= r1; r++) this.squares.push([c, r]);
  }
  down(): boolean { return this.hp <= 0; }
  has(c: number, r: number): boolean { return !this.down() && this.squares.some(([x, y]) => x === c && y === r); }
  /** A shot on it: a large gun's knocks a piece off ('hit', or 'crumbled' with the last); anything less
      'bounces'. */
  hit(guns: GunSize): 'hit' | 'crumbled' | 'bounced' | null {
    if (this.down()) return null;
    if (guns !== 'large') return 'bounced';
    this.hp--;
    return this.down() ? 'crumbled' : 'hit';
  }
}

/** An imperial gate in a wall rows r0 to r1 deep: its way (a column), a tower two wide either side of it. */
export class Gate {
  towers: Tower[];
  constructor(public way: number, public r0: number, public r1: number, hp: number = TOWER_HP) {
    this.towers = [[way - 2, way - 1], [way + 1, way + 2]].map((cols) => new Tower(cols, r0, r1, hp));
  }
  /** Each tower's middle, across (for drawing). */
  middles(): number[] { return this.towers.map((t) => (t.cols[0] + t.cols[t.cols.length - 1]) / 2); }
  /** The tower standing on this square, if one is (its number), else -1. */
  towerAt(c: number, r: number): number { return this.towers.findIndex((t) => t.has(c, r)); }
  /** A tower's down: the way's three wide. */
  open(): boolean { return this.towers.some((t) => t.down()); }
  /** The wall's squares the gate stands on: its towers' (rocks till crumbled). */
  squares(): [number, number][] { return this.towers.flatMap((t) => (t.down() ? [] : t.squares)); }
}
