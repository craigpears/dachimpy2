/* Pirate Den: the blockade's bots (src/blockade.ts), each sailing one ship. TypeScript, compiled to js/blockade-bots.js;
   tested in tests/blockade.test.ts. Plain greedy bots, as the puzzles' are: no planning ahead, no teamwork beyond not
   all going for the same thing.
   - Each picks the buoy most worth her while for how far it is (more if the other side holds it or it's contested,
     less if a friend's on it already), and holds it.
   - A war frigate with no gate down yet weighs shooting one down instead (worth all the heart's pennants): she lies
     broadside to a tower and fires till it crumbles. Inside, the heart's buoys are worth more to her: what she's for.
   - A sloop badly hurt runs for a cove to be patched, out of everyone's guns.
   - A raider sloop (two a side) hides in a cove, then darts out at an enemy frigate, lies off her side, fires, and
     runs back to hide: "you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a
     fight to land a few pot shots" (the user, 15 Nov).
   - A war frigate with an enemy close by, in her way or on a buoy she wants, lies off her side and fights her for
     it: "[war frigs] ... having a fight to land a few pot shots".
   - Every ship fires a loaded side whenever it would hit an enemy and no friend, a tower she's come for, or one of a
     gate's guns firing on her.
   The sloops' shortcuts aren't told them: their pilot finds the winds through the side ways because they're quicker,
   as it finds any way ("the sloops are more nimble, taking the shortcuts, taking those sideways in"). */
import type { Pose } from './den-sail.js';
import type { Side } from './ship-handling.js';
import { squares, drawnAt } from './ship-handling.js';
import { BLOCKADE, inHeart, type Blockade, type Ship, type Buoy } from './blockade.js';

export const BOTS = {
  /** Seconds between a bot's looks round for something better to do. */
  THINK: 3.5,
  /** Seconds she leaves a place she found no way to before trying it again. */
  NOWAY: 8,
  /** How much better something has to look before she changes her mind. */
  STICK: 1.3,
  /** How much more the heart's buoys are worth to a frigate. */
  HEART: 1.6,
  /** A sloop hurt this badly runs to hide and be patched; and comes out again patched to this. */
  HIDE: 0.5, HEALED: 0.1,
  /** Seconds a raider lies hidden before she darts out again, and the longest a raid lasts. */
  LURK: [8, 14] as [number, number], RAID: 25,
  /** How near an enemy frigate has to be (squares) for a raider to dart out at her, and how far off her side she lies. */
  REACH: 16, OFF: 3,
  /** How near an enemy has to be (squares) for a frigate to fight her, and how much she's worth fighting. */
  ENGAGE: 9, FIGHT: 3,
};

export type Goal = { kind: 'buoy'; i: number } | { kind: 'gate'; g: number; tower: number; pose: Pose; side: Side }
  | { kind: 'hide'; cove: [number, number] } | { kind: 'raid'; on: number; at: [number, number] } | { kind: 'fight'; on: number; at: [number, number] };

const same = (a: Goal | null, z: Goal | null) => !!a && !!z && JSON.stringify(a) === JSON.stringify(z);

/** A buoy's worth to one side: whose it is just now, and whether a friend's already on it. */
function worth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
  const hold = b.hold(buoy), friend = b.ships.some((o) => o !== s && o.team === s.team && b.reaches(o, buoy));
  let w = buoy.pennants * (hold === s.team ? (friend ? 0.15 : 1) : hold === 'contested' ? 1.4 : hold ? 1.5 : 1.2);
  if (mates.some((g) => g.kind === 'buoy' && g.i === i)) w *= 0.35;
  if (s.kind === 'frigate' && inHeart(...buoy.at)) w *= BOTS.HEART;
  return w;
}

/** Every berth a frigate can lie in with one side's broadside landing on a standing tower of a gate (her nearest
    first), from either side of its wall. */
export function bombardBerths(b: Blockade, s: Ship): { g: number; tower: number; pose: Pose; side: Side }[] {
  const out: { g: number; tower: number; pose: Pose; side: Side; far: number }[] = [];
  b.gates.forEach((gate, g) => {
    if (gate.open()) return;
    const rows = [...Array.from({ length: 5 }, (_, k) => gate.r0 - 1 - k), ...Array.from({ length: 5 }, (_, k) => gate.r1 + 1 + k)];
    for (let c = gate.way - 6; c <= gate.way + 6; c++) for (const r of rows) for (const d of [1, 3]) {
      const pose = { c, r, d };
      if (!s.sea.fits(pose)) continue;
      for (const side of ['L', 'R'] as Side[]) {
        const t = b.aim(s.id, side, pose).find((x) => x.what?.what === 'tower');
        if (t && t.what?.what === 'tower' && t.what.g === g) out.push({ g, tower: t.what.i, pose, side, far: Math.hypot(c - s.helm.pose.c, r - s.helm.pose.r) });
      }
    }
  });
  return out.sort((a, z) => a.far - z.far).map(({ g, tower, pose, side }) => ({ g, tower, pose, side }));
}

/** One ship's bot. */
export class Bot {
  goal: Goal | null = null;
  score = 0;
  t: number;
  /** When she last fired; when her hiding or her raid started; how long she'll lurk. */
  firedAt = -99;
  since = 0;
  lurk = 10;
  /** Places she found no way to, and when (not tried again for a while: working out there's no way is costly). */
  noway = new Map<string, number>();
  /** A frigate's berths by the gates (bombardBerths), kept a while. */
  berths: { sig: string; all: ReturnType<typeof bombardBerths> } = { sig: '', all: [] };
  constructor(public id: number, public random: () => number = Math.random) { this.t = random() * BOTS.THINK; }

  tick(b: Blockade, dt: number, mates: Goal[] = []) {
    const s = b.ship(this.id);
    if (s.dmg.out) { this.goal = null; return; }
    if (b.over) return;
    this.shoot(b, s);
    // (idle short of where she's going, she looks again sooner: but never more than twice a second)
    const idle = s.helm.slot < 0 && !s.helm.pin && (this.goal?.kind === 'buoy' ? !b.reaches(s, BLOCKADE.BUOYS[this.goal.i]) : this.goal?.kind === 'raid' || this.goal?.kind === 'fight');
    if ((this.t -= dt) > 0 && !(idle && this.t < BOTS.THINK - 0.5)) return;
    this.t = BOTS.THINK * (0.8 + 0.4 * this.random());
    this.think(b, s, mates);
  }

  /** Fire a side that's loaded if it would hit an enemy and no friend, the tower she's come to shoot down, or a
      gate's gun firing on her. */
  private shoot(b: Blockade, s: Ship) {
    for (const side of ['L', 'R'] as Side[]) {
      if (!s.guns.ready(side)) continue;
      const shots = b.aim(s.id, side), at = (id: number) => b.ship(id);
      const foe = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team !== s.team && !at(x.what.id).dmg.out);
      const friend = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team === s.team);
      const gate = this.goal?.kind === 'gate' && s.h.guns === 'large' && shots.some((x) => x.what?.what === 'tower');
      const gun = shots.some((x) => x.what?.what === 'gun' && b.battery[x.what.i].roused && !(b.battery[x.what.i].quiet > 0));
      if ((foe || gate || gun) && !friend && b.fire(s.id, side)) this.firedAt = b.clock;
    }
  }

  /** Look round, and steer for what's best. */
  private think(b: Blockade, s: Ship, mates: Goal[]) {
    const g = this.pick(b, s, mates);
    if (!g) return;
    if (g.goal.kind !== 'gate' && s.sea.exact) s.sea.exact = null;
    if (!same(this.goal, g.goal) && (g.goal.kind === 'hide' || g.goal.kind === 'raid')) this.since = b.clock;
    this.goal = g.goal; this.score = g.score;
    this.steer(b, s);
  }

  /** What's best for her just now. */
  private pick(b: Blockade, s: Ship, mates: Goal[]): { goal: Goal; score: number } | null {
    // A sloop badly hurt hides till she's patched; a raider lurks a while, then darts out at a frigate, and back.
    if (s.kind === 'sloop') {
      const share = s.dmg.share(), hiding = this.goal?.kind === 'hide';
      if (share >= BOTS.HIDE || (hiding && share > BOTS.HEALED) || (hiding && s.raider && b.clock - this.since < this.lurk)) {
        const cove = this.cove(b, s, mates);
        if (cove) return { goal: { kind: 'hide', cove }, score: 9 };
      }
      if (s.raider) {
        const raiding = this.goal?.kind === 'raid', done = raiding && (this.firedAt > this.since || b.clock - this.since > BOTS.RAID);
        if (done) { this.lurk = BOTS.LURK[0] + this.random() * (BOTS.LURK[1] - BOTS.LURK[0]); const cove = this.cove(b, s, mates); if (cove) return { goal: { kind: 'hide', cove }, score: 9 }; }
        const raid = this.raid(b, s);
        if (raid) return { goal: raid, score: 8 };
      }
    }
    const best: { goal: Goal; score: number; far?: boolean }[] = [];
    BLOCKADE.BUOYS.forEach((buoy, i) => {
      const w = worth(b, s, buoy, i, mates);
      if (b.reaches(s, buoy)) { best.push({ goal: { kind: 'buoy', i }, score: w / 10 }); return; }
      if (s.kind === 'frigate' && !b.gateOpen() && inHeart(...buoy.at)) return;   // (shut out till a gate's down)
      // (as the crow flies, for now: only the one she picks is worked out properly, below)
      const far = Math.hypot(buoy.at[0] - s.helm.pose.c, buoy.at[1] - s.helm.pose.r) * 1.3;
      best.push({ goal: { kind: 'buoy', i }, score: w / (4 + far / s.h.stride * s.h.move), far: true });
    });
    // (any gate still shut: the one nearest her may be quicker shot down than sailing round to one that's open)
    if (s.kind === 'frigate' && b.gates.some((x) => !x.open())) {
      // (her current berth if she's in one, so she doesn't change her mind for a nearer one each look; a gate a
      // friend's already shooting at is left to her)
      const mine = this.goal?.kind === 'gate' ? this.goal : null, here = (x: { pose: Pose }) => x.pose.c === s.helm.pose.c && x.pose.r === s.helm.pose.r && x.pose.d === s.helm.pose.d;
      // (the berths kept a while: worked out afresh only every few looks, or as a tower's knocked)
      const sig = `${b.gates.map((x) => x.towers.map((t) => t.hp).join('/')).join(' ')}|${Math.floor(b.clock / 10)}`;
      if (this.berths.sig !== sig) this.berths = { sig, all: bombardBerths(b, s) };
      const all = this.berths.all.filter((x) => !mates.some((m) => m.kind === 'gate' && m.g === x.g) && s.sea.fits(x.pose));
      // (a berth there's no way to is left alone a while: working that out is costly)
      const tried = (x: { pose: Pose }) => { const k = `b${x.pose.c},${x.pose.r},${x.pose.d}`, w = this.noway.get(k); return w !== undefined && b.clock - w < BOTS.NOWAY * 2; };
      const reach = (x: { pose: Pose }) => { if (s.sea.plotTo(s.helm.pose, x.pose)) return true; this.noway.set(`b${x.pose.c},${x.pose.r},${x.pose.d}`, b.clock); return false; };
      const berth = all.find(here) ?? (mine && all.find((x) => same({ kind: 'gate', ...x }, mine))) ?? all.filter((x) => !tried(x)).slice(0, 1).find(reach);
      if (berth) {
        const prize = BLOCKADE.BUOYS.filter((x) => inHeart(...x.at)).reduce((t, x) => t + x.pennants, 0) * 1.3;
        const left = b.gates[berth.g].towers[berth.tower].hp, eta = here(berth) ? 0 : Math.hypot(berth.pose.c - s.helm.pose.c, berth.pose.r - s.helm.pose.r) * s.h.pace * 1.6;
        best.push({ goal: { kind: 'gate', ...berth }, score: prize / (4 + eta + left * s.h.reload * 0.5) });
      }
    }
    // A frigate fights an enemy close by (the nearest; a frigate before a sloop), lying off her side.
    if (s.kind === 'frigate') {
      const fight = this.raid(b, s, BOTS.ENGAGE, true);
      if (fight) {
        const was = this.goal?.kind === 'fight' && this.goal.on === fight.on, eta = Math.hypot(fight.at[0] - s.helm.pose.c, fight.at[1] - s.helm.pose.r) / s.h.stride * s.h.move;
        best.push({ goal: { kind: 'fight', on: fight.on, at: was && this.goal?.kind === 'fight' ? this.goal.at : fight.at }, score: BOTS.FIGHT * (b.ship(fight.on).kind === 'frigate' ? 1.5 : 1) / (4 + eta) });
      }
    }
    // Best first; a buoy picked is worked out properly (by the pilot, past the other ships, who'll have moved), and
    // dropped if there's no way there or it's much further than it looked.
    best.sort((a, z) => z.score - a.score);
    let top: { goal: Goal; score: number; far?: boolean } | undefined;
    for (const x of best.slice(0, 4)) {
      if (!x.far || x.goal.kind !== 'buoy') { if (!top || x.score > top.score) top = x; break; }
      const at = BLOCKADE.BUOYS[x.goal.i].at, moves = this.way(b, s, at, true);
      if (!moves) continue;
      x.score = worth(b, s, BLOCKADE.BUOYS[x.goal.i], x.goal.i, mates) / (4 + moves.length * s.h.move);
      if (!top || x.score > top.score) top = x;
      if (top === x) break;
    }
    if (!top) return null;
    // (sticking to what she's at unless the new is much better, and it's still there to do)
    const mineNow = this.goal && best.find((x) => same(x.goal, this.goal));
    const goal = this.goal, gone = goal?.kind === 'gate' && b.gates[goal.g].open();
    if (mineNow && !same(top.goal, goal) && top.score < mineNow.score * BOTS.STICK && !gone) return mineNow;
    return top;
  }

  /** The nearest cove nobody else is in or making for. */
  private cove(b: Blockade, s: Ship, mates: Goal[]): [number, number] | null {
    const mine = this.goal?.kind === 'hide' ? this.goal.cove : null;
    if (mine) return mine;
    const free = b.coves(s.team).filter(([c, r]) => !mates.some((m) => m.kind === 'hide' && m.cove[0] === c && m.cove[1] === r) && !(b.under(c, r) && b.under(c, r) !== s) && !this.noway.has(`${c},${r}!`));
    free.sort((a, z) => Math.hypot(a[0] - s.helm.pose.c, a[1] - s.helm.pose.r) - Math.hypot(z[0] - s.helm.pose.c, z[1] - s.helm.pose.r));
    return free[0] ?? null;
  }

  /** A raid (or a frigate's fight): the nearest enemy frigate in reach (`any`: any enemy ship, frigates first), and a
      square off her side to lie in and fire from. */
  private raid(b: Blockade, s: Ship, reach: number = BOTS.REACH, any = false): { kind: 'raid'; on: number; at: [number, number] } | null {
    const p = s.helm.pose;
    const foes = b.ships.filter((o) => o.team !== s.team && (any || o.kind === 'frigate') && !o.dmg.out)
      .map((o) => ({ o, m: drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d }) }))
      .filter(({ m }) => Math.hypot(m.c - p.c, m.r - p.r) <= reach)
      .sort((a, z) => (a.o.kind === z.o.kind ? 0 : a.o.kind === 'frigate' ? -1 : 1) || Math.hypot(a.m.c - p.c, a.m.r - p.r) - Math.hypot(z.m.c - p.c, z.m.r - p.r));
    for (const { o, m } of foes) {
      const sd = (o.helm.pose.d + 1) % 4, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
      const spots = [1, -1].map((k) => [Math.round(m.c + DC[sd] * k * BOTS.OFF), Math.round(m.r + DR[sd] * k * BOTS.OFF)] as [number, number])
        .filter(([c, r]) => s.sea.open(c, r) && !squares(o.h, o.helm.pose).some(([x, y]) => x === c && y === r))
        .sort((a, z) => Math.hypot(a[0] - p.c, a[1] - p.r) - Math.hypot(z[0] - p.c, z[1] - p.r));
      if (spots.length) return { kind: 'raid', on: o.id, at: spots[0] };
    }
    return null;
  }

  /** Her way to a square (`past` the other ships, as if they'd moved), or null: a place with no way to it is left
      alone a while. */
  private way(b: Blockade, s: Ship, at: [number, number], past: boolean) {
    const k = `${at[0]},${at[1]}${past ? '' : '!'}`, when = this.noway.get(k);
    if (when !== undefined && b.clock - when < BOTS.NOWAY) return null;
    const got = past ? s.sea.plotPast(s.helm.pose, ...at) : s.sea.plot(s.helm.after(), ...at);
    if (got) this.noway.delete(k); else this.noway.set(k, b.clock);
    return got;
  }
  /** Set her pin for her goal. */
  private steer(b: Blockade, s: Ship) {
    const g = this.goal!;
    if (g.kind === 'gate') {
      const p = s.helm.pose;
      if (!(p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d)) s.helm.sailTo(g.pose);
      return;
    }
    if (g.kind === 'buoy' && b.reaches(s, BLOCKADE.BUOYS[g.i])) { if (s.helm.pin) s.helm.stop(); return; }
    const at = g.kind === 'buoy' ? BLOCKADE.BUOYS[g.i].at : g.kind === 'hide' ? g.cove : g.at;
    if (g.kind === 'fight' && squares(s.h, s.helm.pose).some(([c, r]) => c === at[0] && r === at[1])) return;   // (lying off her: firing as she bears)
    if (s.helm.pose.c === at[0] && s.helm.pose.r === at[1]) return;
    // (only if she can get there as things are: another ship in her way, she waits for her next look)
    if (this.way(b, s, at, false)) { s.helm.drop(...at); return; }
    // (another ship's in her way: rather than wait on each other for ever, she makes a move of her own, forward if
    // she can, to try another way)
    if (s.helm.slot < 0 && !s.helm.mine.length) {
      const free = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(s.helm.pose, m));
      if (free.length) s.helm.put(free.includes('F') && this.random() < 0.6 ? 'F' : free[Math.floor(this.random() * free.length)]);
    }
  }
}

/** Every ship's bot. */
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
    const g = bot?.goal;
    if (!g) return 'looking round';
    if (g.kind === 'gate') return `shooting down the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's tower`;
    if (g.kind === 'hide') return s.helm.pose.c === g.cove[0] && s.helm.pose.r === g.cove[1] ? 'hiding in a cove' + (s.dmg.share() > 0.05 ? ', being patched' : '') : 'running for a cove to hide';
    if (g.kind === 'raid') return `darting out at ${b.ship(g.on).name}`;
    if (g.kind === 'fight') return `fighting ${b.ship(g.on).name}`;
    const buoy = BLOCKADE.BUOYS[g.i];
    return `${b.reaches(s, buoy) ? 'holding' : 'making for'} the ${['', 'one', 'two', 'three'][buoy.pennants]}-pennant buoy${inHeart(...buoy.at) ? ' in the heart' : ''}`;
  }
}
