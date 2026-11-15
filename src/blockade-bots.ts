/* Pirate Den: the blockade's bots (src/blockade.ts), each sailing one ship: picking the buoy most worth her while,
   or, in a war frigate with the imperial gate still shut, lying broadside to one of its towers and shooting it
   down; firing on an enemy whenever her broadside would hit one and no friend. TypeScript, compiled to
   js/blockade-bots.js; tested in tests/blockade.test.ts. Plain greedy bots, as the puzzles' are: no planning
   ahead, no teamwork beyond not all going for the same buoy.

   The user (15 Nov): "a few bots that just, you know, you're competing, trying to get to the points. The [war frig]
   bots are there trying to blast their way through while the sloops are more nimble, taking the shortcuts, taking
   those sideways in." The sloops' shortcuts aren't told them: their pilot finds the winds through the side ways
   because they're quicker, as it finds any way. */
import type { Pose } from './den-sail.js';
import type { Side } from './ship-handling.js';
import { BLOCKADE, type Blockade, type Ship, type Buoy } from './blockade.js';

export const BOTS = {
  /** Seconds between a bot's looks round for something better to do. */
  THINK: 2,
  /** How much better something has to look before she changes her mind. */
  STICK: 1.3,
  /** How much more the heart's buoys are worth to a frigate. */
  HEART: 1.6,
};

type Goal = { kind: 'buoy'; i: number } | { kind: 'gate'; tower: number; pose: Pose; side: Side };

/** A buoy's worth to one side: whose it is just now, and whether a friend's already on it. */
function worth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
  const hold = b.hold(buoy), friend = b.ships.some((o) => o !== s && o.team === s.team && b.reaches(o, buoy));
  let w = buoy.pennants * (hold === s.team ? (friend ? 0.15 : 1) : hold === 'contested' ? 1.4 : hold ? 1.5 : 1.2);
  if (mates.some((g) => g.kind === 'buoy' && g.i === i)) w *= 0.35;
  // (a frigate's come to blast her way into the heart: its buoys are what she's for)
  if (s.kind === 'frigate' && buoy.at[1] > BLOCKADE.WALL.r1) w *= BOTS.HEART;
  return w;
}

/** Every berth a frigate can lie in with one side's broadside landing on a standing tower (her nearest first). */
export function bombardBerths(b: Blockade, s: Ship): { tower: number; pose: Pose; side: Side }[] {
  const out: { tower: number; pose: Pose; side: Side; far: number }[] = [], { r0 } = BLOCKADE.WALL, way = BLOCKADE.GATE.WAY;
  for (let c = way - 5; c <= way + 5; c++) for (let r = r0 - 5; r < r0; r++) for (const d of [1, 3]) {
    const pose = { c, r, d };
    if (!s.sea.fits(pose)) continue;
    for (const side of ['L', 'R'] as Side[]) {
      const shots = b.aim(s.id, side, pose);
      const t = shots.find((x) => x.what?.what === 'tower');
      if (t && t.what?.what === 'tower') out.push({ tower: t.what.i, pose, side, far: Math.hypot(c - s.helm.pose.c, r - s.helm.pose.r) });
    }
  }
  return out.sort((a, z) => a.far - z.far).map(({ tower, pose, side }) => ({ tower, pose, side }));
}

/** One ship's bot. */
export class Bot {
  goal: Goal | null = null;
  score = 0;
  t: number;
  constructor(public id: number, public random: () => number = Math.random) { this.t = random() * BOTS.THINK; }

  tick(b: Blockade, dt: number, mates: Goal[] = []) {
    const s = b.ship(this.id);
    if (s.dmg.out || b.over) return;
    this.shoot(b, s);
    // (idle short of her buoy, she looks again sooner: but never more than twice a second)
    const idle = s.helm.slot < 0 && !s.helm.pin && this.goal?.kind === 'buoy' && !b.reaches(s, BLOCKADE.BUOYS[this.goal.i]);
    if ((this.t -= dt) > 0 && !(idle && this.t < BOTS.THINK - 0.5)) return;
    this.t = BOTS.THINK * (0.8 + 0.4 * this.random());
    this.think(b, s, mates);
  }

  /** Fire a side that's loaded if it would hit an enemy and no friend, or the tower she's come to shoot down. */
  private shoot(b: Blockade, s: Ship) {
    for (const side of ['L', 'R'] as Side[]) {
      if (!s.guns.ready(side)) continue;
      const shots = b.aim(s.id, side), at = (id: number) => b.ship(id);
      const foe = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team !== s.team && !at(x.what.id).dmg.out);
      const friend = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team === s.team);
      const gate = this.goal?.kind === 'gate' && s.h.guns === 'large' && shots.some((x) => x.what?.what === 'tower');
      // (and the gate's guns, while they're firing on her: a hit quietens one a while)
      const gun = shots.some((x) => x.what?.what === 'gun' && b.battery[x.what.i].roused && !(b.battery[x.what.i].quiet > 0));
      if ((foe || gate || gun) && !friend) b.fire(s.id, side);
    }
  }

  /** Look round: the buoy most worth her while for how far it is, or, for a frigate with the gate shut and its
      prizes behind it, the gate. */
  private think(b: Blockade, s: Ship, mates: Goal[]) {
    const best: { goal: Goal; score: number; far?: boolean }[] = [];
    BLOCKADE.BUOYS.forEach((buoy, i) => {
      const w = worth(b, s, buoy, i, mates);
      if (b.reaches(s, buoy)) { best.push({ goal: { kind: 'buoy', i }, score: w / 10 }); return; }
      // (as the crow flies, for now: only the one she picks is worked out properly, below)
      if (s.kind === 'frigate' && !b.gate.open() && buoy.at[1] > BLOCKADE.WALL.r1) return;   // (shut out till the gate's down)
      const far = Math.hypot(buoy.at[0] - s.helm.pose.c, buoy.at[1] - s.helm.pose.r) * 1.3;
      best.push({ goal: { kind: 'buoy', i }, score: w / (4 + far / s.h.stride * s.h.move), far: true });
    });
    if (s.kind === 'frigate' && !b.gate.open() && !mates.some((g) => g.kind === 'gate')) {
      // (her current berth if she's one, so she doesn't change her mind for a nearer one each look)
      const mine = this.goal?.kind === 'gate' ? this.goal : null, here = (x: { pose: Pose }) => x.pose.c === s.helm.pose.c && x.pose.r === s.helm.pose.r && x.pose.d === s.helm.pose.d;
      const all = bombardBerths(b, s), berth = all.find(here) ?? (mine && all.find((x) => JSON.stringify(x.pose) === JSON.stringify(mine.pose)))
        ?? all.slice(0, 8).find((x) => s.sea.plotTo(s.helm.pose, x.pose));
      if (berth) {
        // (worth all the heart's pennants to her side: the gate's what keeps her from them)
        const prize = BLOCKADE.BUOYS.filter((x) => x.at[1] > BLOCKADE.WALL.r1).reduce((t, x) => t + x.pennants, 0) * 1.3;
        const left = b.gate.towers[berth.tower].hp, eta = here(berth) ? 0 : Math.hypot(berth.pose.c - s.helm.pose.c, berth.pose.r - s.helm.pose.r) * s.h.pace * 1.6;
        best.push({ goal: { kind: 'gate', ...berth }, score: prize / (4 + eta + left * s.h.reload * 0.5) });
      }
    }
    // Best first; a buoy picked is worked out properly (by the pilot, past the other ships, who'll have moved),
    // and dropped if there's no way there or it's much further than it looked.
    best.sort((a, z) => z.score - a.score);
    let top: { goal: Goal; score: number; far?: boolean } | undefined;
    for (const x of best.slice(0, 4)) {
      if (!x.far || x.goal.kind !== 'buoy') { top = x; break; }
      const at = BLOCKADE.BUOYS[x.goal.i].at, moves = s.sea.plotPast(s.helm.pose, ...at);
      if (!moves) continue;
      x.score = worth(b, s, BLOCKADE.BUOYS[x.goal.i], x.goal.i, mates) / (4 + moves.length * s.h.move);
      if (!top || x.score > top.score) top = x;
      if (top === x) break;
    }
    if (!top) return;
    const same = this.goal && JSON.stringify(this.goal) === JSON.stringify(top.goal);
    if (!same && this.goal && top.score < this.score * BOTS.STICK && this.still(b, s)) { this.score = this.rescore(b, s, best); return; }
    if (top.goal.kind !== 'gate' && s.sea.exact) { s.sea.exact = null; s.sea.touch(); }
    this.goal = top.goal; this.score = top.score;
    this.steer(b, s);
  }
  /** Her goal's still there to go for (not a gate that's open now). */
  private still(b: Blockade, _s: Ship): boolean { return !(this.goal?.kind === 'gate' && b.gate.open()); }
  private rescore(_b: Blockade, _s: Ship, best: { goal: Goal; score: number }[]): number {
    const mine = best.find((x) => JSON.stringify(x.goal) === JSON.stringify(this.goal));
    return mine?.score ?? 0;
  }
  /** Set her pin for her goal. */
  private steer(b: Blockade, s: Ship) {
    const g = this.goal!;
    if (g.kind === 'gate') {
      const p = s.helm.pose;
      if (!(p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d)) s.helm.sailTo(g.pose);
      return;
    }
    if (b.reaches(s, BLOCKADE.BUOYS[g.i])) { if (s.helm.pin) s.helm.stop(); return; }
    // (only if she can get there as things are: another ship in her way, she waits for her next look)
    const at = BLOCKADE.BUOYS[g.i].at;
    if (s.sea.plot(s.helm.after(), ...at)) { s.helm.drop(...at); return; }
    // (another ship's in her way: rather than wait on each other for ever, she makes a move of her own, forward if
    // she can, to try another way)
    if (s.helm.slot < 0 && !s.helm.mine.length) {
      const free = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(s.helm.pose, m));
      if (free.length) s.helm.put(free.includes('F') && this.random() < 0.6 ? 'F' : free[Math.floor(this.random() * free.length)]);
    }
  }
}

/** Every ship's bot but the ones sailed by people (`people`: their ids). */
export class Bots {
  bots: Bot[];
  constructor(b: Blockade, people: number[] = [], random: () => number = Math.random) {
    this.bots = b.ships.filter((s) => !people.includes(s.id)).map((s) => new Bot(s.id, random));
  }
  /** Each bot a tick on but those sailing a ship someone's sailing just now (`people`: their ids). */
  tick(b: Blockade, dt: number, people: number[] = []) {
    for (const bot of this.bots) {
      if (people.includes(bot.id)) continue;
      const team = b.ship(bot.id).team, mates = this.bots.filter((o) => o !== bot && b.ship(o.id).team === team && o.goal).map((o) => o.goal!);
      bot.tick(b, dt, mates);
    }
  }
  /** What a ship's bot is up to, in plain words. */
  doing(b: Blockade, id: number): string {
    const bot = this.bots.find((x) => x.id === id), s = b.ship(id);
    if (s.dmg.out) return 'knocked out: her crew rebuilding her';
    if (!bot?.goal) return 'looking round';
    if (bot.goal.kind === 'gate') return 'shooting down the imperial gate\'s tower';
    const buoy = BLOCKADE.BUOYS[bot.goal.i];
    return `${b.reaches(s, buoy) ? 'holding' : 'making for'} the ${['', 'one', 'two', 'three'][buoy.pennants]}-pennant buoy${b.inHeart(s) || buoy.at[1] > BLOCKADE.WALL.r1 ? ' in the heart' : ''}`;
  }
}
