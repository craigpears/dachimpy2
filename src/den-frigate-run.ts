/* Pirate Den: Primates Rule's test run, out of her anchorage on the den's own sea. TypeScript, compiled to
   js/den-frigate-run.js; tested in tests/den-frigate-run.test.ts; drawn by js/den/frigate-run.js, which
   sailing.js hands the helm's keys and clicks to while you're aboard her.

   The user (15 Nov), after playing her on frigate-test.html: "I think this is good enough to actually put into
   the main game where you've got [Primates Rule] all in progress, so you can just kind of be like ... park this
   sloop there and then take the war frig on a test run, even if it's just to go shoot some nearby things and
   destructible obstacles, or sail out into the ocean through some rocks." So:
   - sailing up near her where she lies at anchor (src/den-moored.ts), Space leaves your sloop there, at anchor
     where she is, and takes you aboard Primates Rule;
   - she sails on the den's own sea by her own handling (src/ship-handling.ts: her size on the squares, her
     wide turn, three moves a turn, her pilot there once the pin's under her, her berth a block of squares),
     everything the sloop can't sail through in her way too, and the canal, its cove and the water only the
     whirlpools reach, which aren't for a ship her size. She rides out the trade winds (IDEAS.md, "Bigger ships
     ride out the winds"): they don't carry her;
   - out the way she lies, a gap in the reef two squares wide (the race's gate in it), just wide enough for her,
     out to the open sea past it;
   - a few old hulks moored about her anchorage, in her way, for her broadsides: two large shots sink one, and
     then it's open water. They're there again the next time she's taken out;
   - back by your sloop, Space takes you aboard her again, and Primates Rule's crew take her back to her
     anchorage.
   Nothing here knows of the 3D: the den's sea (src/den-sail.ts's Sea) is handed in. */
import { LAY, type Sea, type Move, type Pose, type SailEvent } from './den-sail.js';
import { FRIGATE_HANDLING, ShipSea, ShipHelm, Guns, broadside, squares, type Handling, type Shot, type Side } from './ship-handling.js';
import { MOORED, nearMoored } from './den-moored.js';

const key = (c: number, r: number) => `${c},${r}`;

export const RUN = {
  /** Her handling: Primates Rule's, a war frigate's. */
  SHIP: FRIGATE_HANDLING as Handling,
  /** Where she lies at anchor as a ship on the squares (bow out to the right, +c, as she's moored: MOORED.HEADING):
      her own square, covering her moored row and the one out to sea of it; or, if your sloop's on that, the one
      in toward the den. */
  ANCHOR: [{ c: 5, r: 34, d: 1 }, { c: 5, r: 33, d: 1 }] as Pose[],
  /** How near your sloop she has to be (squares, any way, from any of hers) to go back aboard her. */
  NEAR: MOORED.NEAR,
  /** The old hulks moored about her anchorage, for her broadsides: where each lies, and the large shots that sink one. */
  HULKS: [[1, 31], [8, 31], [13, 36]] as [number, number][],
  HULK_HP: 2,
  /** Where her starting point (?at=primates) moors your sloop: two squares in toward the den of her. */
  CHEAT: { c: 4, r: 32, d: 0 } as Pose,
  /** The gap in the reef out past her, two squares wide: just wide enough for her (the race's gate in it). */
  GAP: { c0: 8, c1: 9, r: 37 },
};

/** An old hulk, for her broadsides: in her way till it's sunk. */
export class Hulk {
  hp: number = RUN.HULK_HP;
  constructor(public at: [number, number]) {}
  sunk(): boolean { return this.hp <= 0; }
  /** A shot on her: 'hit', or 'sunk' with the last (null if she's sunk already). */
  hit(): 'hit' | 'sunk' | null { if (this.sunk()) return null; this.hp--; return this.sunk() ? 'sunk' : 'hit'; }
}

/** What one of her shots stopped at. */
export type RunStop = 'rock' | 'hulk' | 'sloop';
export interface RunFired { side: Side; shots: (Shot<RunStop> & { hulk?: number; got?: 'hit' | 'sunk' })[] }

/** Out in your sloop: near enough Primates Rule to take her out (and nothing else has the helm: `free`). */
export const canTakeOut = (sloop: Pose, free = true): boolean => free && nearMoored(sloop.c, sloop.r);

/** Every square of the den's sea she can't sail on: what the sloop can't, and the water that isn't for a ship her
    size (the canal and its locks, the hidden cove, the water only the whirlpools reach, the way through them);
    her own anchorage isn't, since she's the one lying there. */
export function runRocks(den: Sea): Set<string> {
  const out = new Set<string>(), mine = new Set(LAY.PRIMATES.AT.map(([c, r]) => key(c, r)));
  for (let c = 0; c < den.cols; c++) for (let r = 0; r < den.rows; r++) {
    const k = key(c, r);
    if (mine.has(k)) continue;
    if (!den.open(c, r) || den.hidden.has(k) || den.pounds.has(k) || den.cove.has(k) || den.passage.has(k) || den.lockAt(c, r) >= 0) out.add(k);
  }
  return out;
}

/** Primates Rule out on a test run: her sea (the den's, as she sees it), her helm and guns, the hulks, and where
    your sloop's left at anchor. */
export class TestRun {
  rocks: Set<string>;
  sea: ShipSea;
  helm: ShipHelm;
  guns: Guns;
  hulks: Hulk[] = RUN.HULKS.map((at) => new Hulk([...at] as [number, number]));
  /** Where your sloop lies at anchor, left there. */
  sloop: [number, number];

  constructor(public den: Sea, sloop: Pose) {
    this.sloop = [sloop.c, sloop.r];
    this.rocks = runRocks(den);
    for (const h of this.hulks) this.rocks.add(key(...h.at));
    this.sea = new ShipSea(RUN.SHIP, den.cols, den.rows, this.rocks, (c, r) => c === this.sloop[0] && r === this.sloop[1]);
    const start = RUN.ANCHOR.find((p) => this.sea.fits(p)) ?? RUN.ANCHOR[0];
    this.helm = new ShipHelm(this.sea, start);
    this.guns = new Guns(RUN.SHIP.reload);
  }

  tick(dt: number): SailEvent[] { this.guns.tick(dt); return this.helm.tick(dt); }

  /** What a shot of hers stops at on this square. */
  stopAt(c: number, r: number): RunStop | null {
    if (this.hulkAt(c, r) >= 0) return 'hulk';
    if (c === this.sloop[0] && r === this.sloop[1]) return 'sloop';
    return this.den.rocks.has(key(c, r)) ? 'rock' : null;
  }
  /** The hulk afloat on this square, if one is (its number), else -1. */
  hulkAt(c: number, r: number): number { return this.hulks.findIndex((h) => !h.sunk() && h.at[0] === c && h.at[1] === r); }

  /** Her broadside out of that side, if it's loaded (null if not): a shot on a hulk knocks a piece off it, the
      last sinks it, and it's open water. A shot on your sloop comes down short of her (she's yours). */
  fire(side: Side): RunFired | null {
    if (!this.guns.fire(side)) return null;
    const shots = broadside(RUN.SHIP, this.helm.now(), side, (c, r) => this.stopAt(c, r)).map((shot) => {
      if (shot.what !== 'hulk') return shot;
      const i = this.hulkAt(...shot.hit!), got = this.hulks[i].hit()!;
      if (got === 'sunk') { this.rocks.delete(key(...this.hulks[i].at)); this.sea.touch(); }
      return { ...shot, hulk: i, got };
    });
    return { side, shots };
  }
  /** How many hulks are still afloat. */
  afloat(): number { return this.hulks.filter((h) => !h.sunk()).length; }

  drop(c: number, r: number): [number, number] | null { return this.helm.drop(c, r); }
  put(m: Move): boolean { return this.helm.put(m); }

  /** By your sloop: any square of hers within NEAR of her. */
  bySloop(): boolean {
    const [sc, sr] = this.sloop;
    return squares(RUN.SHIP, this.helm.pose).some(([c, r]) => Math.max(Math.abs(c - sc), Math.abs(r - sr)) <= RUN.NEAR);
  }
  /** The pin for heading back to your sloop: the nearest square beside her that's open. */
  backToSloop(): [number, number] | null {
    const [sc, sr] = this.sloop;
    for (let d = 1; d <= RUN.NEAR; d++) for (let a = -d; a <= d; a++) for (let b = -d; b <= d; b++) {
      if (Math.max(Math.abs(a), Math.abs(b)) !== d) continue;
      const c = sc + a, r = sr + b;
      if (c < 0 || r < 0 || c >= this.sea.cols || r >= this.sea.rows || this.rocks.has(key(c, r))) continue;
      if (this.helm.drop(c, r)) return this.helm.pin;
    }
    return null;
  }
  /** Out past the reef. */
  outPastReef(): boolean { return this.helm.pose.r > RUN.GAP.r; }
}
