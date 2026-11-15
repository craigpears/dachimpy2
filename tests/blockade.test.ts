/* The blockade proof of concept (src/blockade.ts, src/blockade-bots.ts). The user, 15 Nov: "go study blockading and
   how blockade boards look ... sideways for the sloops and ... a few bots ... competing, trying to get to the points.
   The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking the
   shortcuts, taking those sideways in, just like winds"; then "blockading is a bit more epic ... a good handful of
   sloops each side and ... three or four [war frigs] ... coming from different directions ... Some ocean, some island
   ... you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a fight to land a few pot
   shots". */
import { describe, expect, it } from 'vitest';
import { BLOCKADE, Blockade, inHeart, reefSquares, laneSquares } from '../src/blockade';
import { Bot, Bots, bombardBerths } from '../src/blockade-bots';
import { orderAt, orderText, FREE, STRATEGIES } from '../src/blockade-orders';
import { squares, alongs, SLOOP_HANDLING, BRIG_HANDLING, FRIGATE_HANDLING } from '../src/ship-handling';
import { DAMAGE } from '../src/ship-damage';

const B = BLOCKADE, prize: [number, number] = [21, 17];
/** A seeded dice, so a game plays the same every run. */
const dice = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const frigate = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'frigate' && s.team === team)!;
const sloop = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'sloop' && s.team === team && !s.craft)!;
const brig = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'brig' && s.team === team)!;
/** A lagoon's buoy (inside its reef). */
const lagoonBuoy = (reef: (typeof B.REEFS)[number]) => B.BUOYS.find((u) => Math.max(Math.abs(u.at[0] - reef.at[0]), Math.abs(u.at[1] - reef.at[1])) <= 2)!;
/** Everyone else out of the way, on open water in the north-east, so a test's ships have the sea to themselves. */
const clearAway = (b: Blockade, keep: { id: number }[]) => {
  b.ships.filter((s) => !keep.some((k) => k.id === s.id) && !s.craft).forEach((s, i) => s.helm.moor({ c: 30 + (i % 8), r: 30 + Math.floor(i / 8) * 3, d: 1 }));
  b.notice();
};

describe('the board, as a blockade board is, and more epic (15 Nov: "three or four [war frigs] ... coming from different directions ... Some ocean, some island")', () => {
  it('each side three war frigates, a war brig and five sloops, coming in from two edges of its own, where they fit', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) {
      const mine = b.ships.filter((s) => s.team === team && !s.craft);
      expect(mine.filter((s) => s.kind === 'frigate')).toHaveLength(3);
      expect(mine.filter((s) => s.kind === 'brig')).toHaveLength(1);
      expect(mine.filter((s) => s.kind === 'sloop')).toHaveLength(5);
      const edges = new Set(mine.map(({ helm: { pose: p } }) => (p.r <= 2 ? 'south' : p.c <= 2 ? 'west' : p.r >= B.ROWS - 3 ? 'north' : p.c >= B.COLS - 3 ? 'east' : 'none')));
      expect(edges.has('none')).toBe(false);
      expect(edges.size).toBe(2);
      for (const s of mine) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`), s.name).toBe(false);
    }
  });
  it('the heart\'s a walled fort: its only ways through the two gates\', the two side ways and the four ways out, one square each', () => {
    const b = new Blockade(), open: string[] = [];
    for (const w of B.WALLS) for (let c = w.c0; c <= w.c1; c++) for (let r = w.r0; r <= w.r1; r++) if (!b.rocks.has(`${c},${r}`)) open.push(`${c},${r}`);
    const inWall = ([c, r]: [number, number]) => B.WALLS.some((w) => c >= w.c0 && c <= w.c1 && r >= w.r0 && r <= w.r1);
    const ways = [...B.GATES.flatMap((g) => [`${g.way},${g.r0}`, `${g.way},${g.r1}`]), ...B.SIDEWAYS.map(([c, r]) => `${c},${r}`), ...B.EXITS.flat().flatMap(laneSquares).filter(inWall).map(([c, r]) => `${c},${r}`)];
    expect(open.sort()).toEqual([...new Set(ways)].sort());
  });
  it('the sloops can get into the heart from the start, and a brig, one square wide, through a gate under its guns; the frigates can\'t till a tower\'s down (15 Nov: "a way of naturally delaying the war [frigs]")', () => {
    const b = new Blockade();
    for (const s of b.ships.filter((x) => !x.craft)) expect(!!s.sea.plotPast(s.helm.pose, ...prize), s.name).toBe(s.kind !== 'frigate');
    const t = b.gates[0].towers[0];
    t.hp = 0;
    for (const [c, r] of t.squares) b.rocks.delete(`${c},${r}`);
    for (const s of b.ships) s.sea.touch();
    expect(frigate(b).sea.plotPast(frigate(b).helm.pose, ...prize)).not.toBeNull();
  });
  it('a wind blows in through each side way, carrying a sloop through it fast; a frigate rides the winds out (15 Nov: "sideways ... only the sloops can really get to on those fast little winds")', () => {
    const b = new Blockade();
    for (const [c, r] of B.SIDEWAYS) expect(b.wind.has(`${c},${r}`), `${c},${r}`).toBe(true);
    const lane = B.WINDS[0], got = sloop(b).sea.move({ c: lane.at[0] - 1, r: lane.at[1], d: 1 }, 'F');
    expect(got.ride.length).toBeGreaterThan(5);
    expect(inHeart(got.ride[got.ride.length - 1].c, got.ride[got.ride.length - 1].r)).toBe(true);
    expect(frigate(b).sea.windy).toBe(false);
  });
  it('a sloop hides in a lagoon\'s far corner, by its tiny island: no frigate can get to her or shoot her there (15 Nov: "a tiny little island with a buoy in the middle")', () => {
    const b = new Blockade(), s = sloop(b), f = frigate(b), fsea = f.sea.bare();
    for (const reef of B.REEFS) {
      expect(b.rocks.has(`${reef.islet[0]},${reef.islet[1]}`)).toBe(true);
      expect(Math.max(Math.abs(reef.islet[0] - reef.at[0]), Math.abs(reef.islet[1] - reef.at[1]))).toBeLessThanOrEqual(2);
      expect(lagoonBuoy(reef)).toBeTruthy();
      expect(b.rocks.has(`${reef.hide[0]},${reef.hide[1]}`)).toBe(false);
      expect(b.coves()).toContainEqual(reef.hide);
      expect(s.sea.plotPast(s.helm.pose, ...reef.hide), `sloop to ${reef.hide}`).not.toBeNull();
      expect(f.sea.plotPast(f.helm.pose, ...reef.hide), `frigate to ${reef.hide}`).toBeNull();
      // (a frigate anywhere outside the reef: none of her broadsides reaches the hiding place, the reef in the way)
      for (let c = 0; c < B.COLS; c++) for (let r = 0; r < B.ROWS; r++) for (const d of [0, 1, 2, 3]) {
        const p = { c, r, d };
        if (!fsea.fits(p) || Math.max(Math.abs(c - reef.at[0]), Math.abs(r - reef.at[1])) <= 3) continue;
        for (const side of ['L', 'R'] as const) expect(b.aim(f.id, side, p, false).some((x) => x.cells.some(([u, v]) => u === reef.hide[0] && v === reef.hide[1]))).toBe(false);
      }
    }
  });
  it('a way out of the heart to each lagoon, a wind through a gap in the fort\'s side wall, carrying a sloop to its buoy in one move; a frigate can\'t get through (15 Nov: "an exit from the middle ... a wind heading towards each of the reefed areas, so they can get out quickly")', () => {
    const b = new Blockade(), s = sloop(b), f = frigate(b);
    expect(B.EXITS).toHaveLength(B.REEFS.length);
    for (const [i, [a]] of B.EXITS.entries()) {
      const reef = B.REEFS[i], start = { c: a.at[0] - [0, 1, 0, -1][a.d], r: a.at[1] - [1, 0, -1, 0][a.d], d: a.d };
      expect(inHeart(start.c, start.r)).toBe(true);
      const got = s.sea.bare().move(start, 'F'), end = got.ride[got.ride.length - 1];
      // (onto the buoy, or the square beside it, its influence on it)
      expect(Math.max(Math.abs(end.c - lagoonBuoy(reef).at[0]), Math.abs(end.r - lagoonBuoy(reef).at[1]))).toBeLessThanOrEqual(1);
      const through = B.EXITS[i].flatMap(laneSquares).filter(([c, r]) => B.WALLS.some((w) => c >= w.c0 && c <= w.c1 && r >= w.r0 && r <= w.r1));
      expect(through.length).toBeGreaterThan(0);
      for (const [c, r] of through) expect(b.rocks.has(`${c},${r}`)).toBe(false);
    }
    // (and each side's own wind blows in through its lagoon, then on through the side way into the heart)
    for (const [i, w] of B.WINDS.entries()) {
      const sq = laneSquares(w);
      expect(sq.filter(([c, r]) => Math.max(Math.abs(c - B.REEFS[i].at[0]), Math.abs(r - B.REEFS[i].at[1])) <= 2).length).toBeGreaterThan(0);
      expect(inHeart(...sq[sq.length - 1])).toBe(true);
    }
    // (a frigate's still shut out of the heart till a gate's down: the ways out are a square wide)
    expect(f.sea.plotPast(f.helm.pose, ...prize)).toBeNull();
  });
  it('a sloop in the heart leaves it for a lagoon once the enemy\'s frigates are in', () => {
    const b = new Blockade(), s = sloop(b), foe = frigate(b, 'crimson');
    clearAway(b, [s, foe]);
    s.helm.moor({ c: 21, r: 16, d: 0 }); b.notice();
    const bot = new Bot(s.id, dice(1)), goalAt = () => { bot.tick(b, 0.1); const g = bot.goal; return g?.kind === 'buoy' ? B.BUOYS[g.i].at : null; };
    for (let i = 0; i < 40; i++) goalAt();
    expect(inHeart(...goalAt()!)).toBe(true);
    foe.helm.moor({ c: 22, r: 19, d: 1 }); b.notice();
    const fresh = new Bot(s.id, dice(1));
    for (let i = 0; i < 40; i++) fresh.tick(b, 0.1);
    const g = fresh.goal;
    expect(g).not.toBeNull();
    expect(g!.kind === 'buoy' && inHeart(...B.BUOYS[g!.i].at)).toBe(false);
  });
  it('buoys of one to three pennants, the best, the three, in the heart', () => {
    expect(Math.max(...B.BUOYS.filter((x) => inHeart(...x.at)).map((x) => x.pennants))).toBe(3);
    expect(Math.max(...B.BUOYS.filter((x) => !inHeart(...x.at)).map((x) => x.pennants))).toBeLessThan(3);
    const b = new Blockade();
    for (const x of B.BUOYS) expect(b.rocks.has(`${x.at[0]},${x.at[1]}`)).toBe(false);
  });
});

describe('scoring, as YPPedia has it: a buoy in one side\'s influence alone scores its pennants each turn', () => {
  it('one side\'s ship on a buoy scores it; both sides\' cancel out; nobody\'s, nothing', () => {
    const b = new Blockade(), g = sloop(b), cr = sloop(b, 'crimson'), buoy = B.BUOYS[5];
    expect(b.hold(buoy)).toBeNull();
    g.helm.moor({ c: buoy.at[0], r: buoy.at[1] - 1, d: 0 });
    expect(b.hold(buoy)).toBe('gold');
    b.scoreTurn();
    expect(b.score.gold).toBe(buoy.pennants);
    cr.helm.moor({ c: buoy.at[0] + 1, r: buoy.at[1] + 1, d: 0 });
    expect(b.hold(buoy)).toBe('contested');
    b.scoreTurn();
    expect(b.score).toEqual({ gold: buoy.pennants, crimson: 0 });
  });
  it('a frigate\'s influence reaches further than a sloop\'s; a ship knocked out has none', () => {
    expect(B.INFLUENCE.frigate).toBeGreaterThan(B.INFLUENCE.sloop);
    const b = new Blockade(), s = sloop(b), buoy = B.BUOYS[5];
    s.helm.moor({ c: buoy.at[0], r: buoy.at[1] - 1, d: 0 });
    for (let i = 0; i < 3; i++) s.dmg.hit('large', 0, 'L');
    expect(b.hold(buoy)).toBeNull();
  });
  it('a round is scored every turn and ends', () => {
    const b = new Blockade();
    let turns = 0;
    for (let t = 0; t < B.ROUND + 1; t += 0.5) if (b.tick(0.5).scored) turns++;
    expect(turns).toBe(B.ROUND / B.TURN);
    expect(b.over).toBe(true);
  });
});

describe('shooting each other: holes where she\'s shot, and dead in the water (15 Nov: "I want to shoot the sloop from the war frigate and see it just go dead in the water")', () => {
  it('a frigate\'s broadside on a sloop holes her where it struck; the third knocks her out, held till she\'s rebuilt', () => {
    const b = new Blockade(), f = frigate(b), s = sloop(b, 'crimson');
    f.helm.moor({ c: 8, r: 14, d: 0 }); s.helm.moor({ c: 10, r: 14, d: 0 });
    for (let i = 0; i < 3; i++) {
      const shot = b.fire(f.id, 'R')!.shots.find((x) => x.what?.what === 'ship')!;
      expect(shot.hole).toBeTruthy();
      expect(shot.hole!.side).toBe('L');   // (facing up the board, the frigate's off her port side)
      f.guns.tick(9);
    }
    expect(s.dmg.out).toBe(true);
    expect(s.helm.dazed()).toBe(true);
    let back = false;
    for (let t = 0; t < 300 && !back; t += 0.5) back = (b.tick(0.5).damage.get(s.id) ?? []).some((e) => e.kind === 'back');
    expect(back).toBe(true);
    expect(s.helm.dazed()).toBe(false);
  });
  it('only a frigate\'s large guns hurt a gate\'s towers, and shooting one rouses its guns, not the other gate\'s', () => {
    const b = new Blockade(), f = frigate(b), berth = bombardBerths(b, f)[0];
    expect(berth).toBeTruthy();
    f.helm.moor(berth.pose);
    expect(b.fire(f.id, berth.side)!.shots.some((x) => x.got === 'hit')).toBe(true);
    b.battery.forEach((g, i) => expect(g.roused, `gun ${i}`).toBe(b.gunGate[i] === berth.g));
    const s = sloop(b), sb = bombardBerths(b, s)[0];
    s.helm.moor(sb.pose);
    expect(b.fire(s.id, sb.side)!.shots.some((x) => x.got === 'bounced')).toBe(true);
  });
});

describe('the gates\' guns doubled, punishing campers (15 Nov: "training on people\'s positions, especially punishing people camping ... double up on the [cannons] ... provide more of a barrier to the war frigates")', () => {
  it('four bastion guns a gate', () => {
    const b = new Blockade();
    for (let g = 0; g < b.gates.length; g++) expect(b.gunGate.filter((x) => x === g)).toHaveLength(4);
    for (const gun of b.battery) expect(b.rocks.has(`${gun.at[0]},${gun.at[1]}`)).toBe(true);
  });
  it(`a gun not yet roused leaves a ship passing under it be, and fires on her once she's lingered there CAMP seconds`, () => {
    const b = new Blockade(), s = sloop(b), gun = b.battery[0];
    b.ships.filter((x) => x !== s).forEach((x, i) => x.helm.moor({ c: 30 + (i % 8), r: 30 + Math.floor(i / 8) * 3, d: 1 }));
    // (lying still under the south gate's first gun, unroused)
    s.helm.moor({ c: gun.at[0], r: gun.at[1] - 2, d: 1 }); b.notice();
    expect(gun.roused).toBe(false);
    let fired = -1;
    for (let t = 0; t < B.CAMP + 3 && fired < 0; t += 0.1) if (b.tick(0.1).guns.some((x) => x.gun === 0 && x.e.kind === 'fire')) fired = t;
    expect(fired).toBeGreaterThanOrEqual(B.CAMP - 0.2);
    expect(b.gunOn[0]).toBe(s.id);
    // (away from it, the count starts again)
    s.helm.moor({ c: 2, r: 30, d: 1 }); b.notice();
    for (let t = 0; t < 1; t += 0.1) b.tick(0.1);
    expect(b.gunOn[0]).toBe(-1);
  });
});

describe('a sinking blockade (15 Nov: "that sense of working your way back in would be lost if you can\'t [sink] at all")', () => {
  const knockOut = (b: Blockade, s: ReturnType<typeof frigate>) => { while (!s.dmg.out) s.dmg.hit('large', 0, 'L'); s.helm.hit(); };
  it('a frigate knocked out and shot on sinks: off the board, in nobody\'s way, no influence, no guns, till she comes back where she came in', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), g = frigate(b, 'gold');
    // (the two out on open water, the gold frigate's broadside on her)
    b.ships.filter((s) => s !== f && s !== g).forEach((s, i) => s.helm.moor({ c: 30 + (i % 8), r: 30 + Math.floor(i / 8) * 3, d: 1 }));
    g.helm.moor({ c: 7, r: 10, d: 1 }); f.helm.moor({ c: 7, r: 14, d: 1 }); b.notice();
    knockOut(b, f);
    let sunk = false;
    for (let i = 0; i < 20 && !sunk; i++) { g.guns.tick(9); sunk = (['L', 'R'] as const).some((side) => b.fire(g.id, side)?.shots.some((x) => x.sunk)); }
    expect(sunk).toBe(true);
    expect(f.away).toBe(B.RETURN);
    expect(b.afloat(f)).toBe(false);
    for (const [c, r] of squares(f.h, f.helm.pose)) expect(b.under(c, r)).toBeNull();
    expect(B.BUOYS.some((x) => b.reaches(f, x))).toBe(false);
    f.guns.tick(9);
    expect(b.fire(f.id, 'L')).toBeNull();
    let back = -1;
    for (let t = 0; t < B.RETURN + 2 && back < 0; t += 0.5) if (b.tick(0.5).returned.includes(f.id)) back = t;
    expect(back).toBeGreaterThan(B.RETURN - 1);
    expect(f.helm.pose).toEqual(f.start);
    expect([f.dmg.out, f.dmg.sunk, f.dmg.holes.length]).toEqual([false, false, 0]);
    for (const [c, r] of squares(f.h, f.helm.pose)) expect(b.under(c, r)?.id).toBe(f.id);
  });
  it('someone lying where she came in: she waits till they\'ve gone', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), other = frigate(b, 'gold');
    b.sink(f);
    other.helm.moor(f.start); b.notice();
    for (let t = 0; t < B.RETURN + 5; t += 0.5) expect(b.tick(0.5).returned).not.toContain(f.id);
    other.helm.moor({ c: 7, r: 10, d: 1 }); b.notice();
    let back = false;
    for (let t = 0; t < 2 && !back; t += 0.5) back = b.tick(0.5).returned.includes(f.id);
    expect(back).toBe(true);
  });
  it('a bot fires on an enemy who\'s knocked out, to sink her; and leaves her be once she\'s gone', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), g = frigate(b, 'gold');
    b.ships.filter((s) => s !== f && s !== g).forEach((s, i) => s.helm.moor({ c: 30 + (i % 8), r: 30 + Math.floor(i / 8) * 3, d: 1 }));
    g.helm.moor({ c: 7, r: 10, d: 1 }); f.helm.moor({ c: 7, r: 14, d: 1 }); b.notice();
    knockOut(b, f);
    const bot = new Bot(g.id, dice(2));
    let fired = 0;
    for (let i = 0; i < 300 && f.away <= 0; i++) { bot.tick(b, 0.1); b.fired.splice(0).forEach((x) => { if (x.ship === g.id) fired++; }); b.tick(0.1); }
    expect(fired).toBeGreaterThan(0);
    expect(f.away).toBeGreaterThan(0);
  });
});

describe('admiral mode: an order for each ship (15 Nov: "you need to be able to give each ship a target or directive, where it\'s going, what it\'s doing")', () => {
  it('a click on the board orders what\'s there: a buoy held, an enemy hunted, a friend escorted, a gate shot down, else camping on the nearest square she fits', () => {
    const b = new Blockade(), f = frigate(b), sl = sloop(b), foe = frigate(b, 'crimson'), mate = b.ships.find((x) => x.team === 'gold' && x !== f && x !== sl)!;
    expect(orderAt(b, sl, ...B.BUOYS[4].at)).toEqual({ kind: 'hold', buoy: 4 });
    expect(orderAt(b, sl, foe.helm.pose.c, foe.helm.pose.r)).toEqual({ kind: 'hunt', ship: foe.id });
    expect(orderAt(b, sl, mate.helm.pose.c, mate.helm.pose.r)).toEqual({ kind: 'escort', ship: mate.id });
    expect(orderAt(b, sl, sl.helm.pose.c, sl.helm.pose.r)).toEqual(FREE);
    const north = B.GATES[1];
    expect(orderAt(b, f, north.way, north.r0)).toEqual({ kind: 'gate', g: 1 });
    // (a sloop's guns can't hurt a tower: there, she camps)
    expect(orderAt(b, sl, north.way, north.r0)?.kind).toBe('camp');
    // (on a rock: the nearest square she fits)
    const camp = orderAt(b, f, 18, 18)!;
    expect(camp.kind).toBe('camp');
    if (camp.kind === 'camp') expect(b.rocks.has(`${camp.at[0]},${camp.at[1]}`)).toBe(false);
    expect(orderText(b, { kind: 'hold', buoy: 0 })).toBe('hold the three-pennant buoy in the heart');
  });

  it('the bots carry their orders out: a frigate to the far gate, not her nearest; a sloop to camp where she\'s told and stay; a sloop to hold a far buoy', () => {
    const b = new Blockade(), bots = new Bots(b, [], dice(4)), f = frigate(b), sl = sloop(b), other = b.ships.find((x) => x.team === 'gold' && x.kind === 'sloop' && x !== sl && !x.raider)!;
    bots.order(f.id, { kind: 'gate', g: 1 });
    // (her camp out on the open sea; the far buoy, off the south gate)
    bots.order(sl.id, { kind: 'camp', at: [10, 11] });
    bots.order(other.id, { kind: 'hold', buoy: 3 });
    for (let i = 0; i < 2; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    const goal = (id: number) => bots.bots.find((x) => x.id === id)!.goal;
    expect(goal(f.id)).toMatchObject({ kind: 'gate', g: 1 });
    let camped = 0;
    for (let i = 0; i < 900; i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (i > 600 && sl.away <= 0 && !sl.dmg.out && squares(sl.h, sl.helm.pose).some(([c, r]) => c === 10 && r === 11)) camped++;
    }
    expect(camped).toBeGreaterThan(100);
    expect(b.reaches(other, B.BUOYS[3]) || other.dmg.out || other.away > 0).toBe(true);
    expect(bots.doing(b, sl.id)).toMatch(/camp|knocked|sunk/);
  }, 60000);

  it('hunting: after that enemy, broadside on (a sloop after a frigate, off her end); escorting: off her friend\'s side', () => {
    const b = new Blockade(), bots = new Bots(b, [], dice(4)), f = frigate(b), foe = frigate(b, 'crimson');
    const sl = b.ships.find((x) => x.team === 'gold' && x.kind === 'sloop' && !x.raider)!;
    bots.order(f.id, { kind: 'hunt', ship: foe.id });
    bots.order(sl.id, { kind: 'escort', ship: f.id });
    const raider = b.ships.find((x) => x.team === 'gold' && x.raider)!;
    bots.order(raider.id, { kind: 'hunt', ship: foe.id });
    bots.tick(b, 0.1);
    const goal = (id: number) => bots.bots.find((x) => x.id === id)!.goal;
    expect(goal(f.id)).toMatchObject({ kind: 'fight', on: foe.id });
    expect(goal(raider.id)).toMatchObject({ kind: 'raid', on: foe.id });
    expect(goal(sl.id)?.kind === 'escort' || goal(sl.id)?.kind === 'fight').toBe(true);
  });
});

describe(`the admiral's strategies, a handful each (15 Nov: "keep the Admiral mode relatively simple ... like choosing just a strategy")`, () => {
  const round = (kind: 'sloop' | 'frigate', name: string, secs: number) => {
    const b = new Blockade(), bots = new Bots(b, [], dice(5)), st = STRATEGIES[kind].find((x) => x.name === name)!;
    const mine = b.ships.filter((x) => x.team === 'gold' && x.kind === kind);
    for (const s of mine) bots.order(s.id, st.order);
    const goals: string[] = [];
    for (let i = 0; i < secs * 10; i++) { bots.tick(b, 0.1); b.tick(0.1); if (i % 10 === 0) for (const s of mine) { const g = bots.bots.find((x) => x.id === s.id)!.goal; if (g) goals.push(g.kind === 'buoy' ? (inHeart(...B.BUOYS[g.i].at) ? 'heart' : 'outside') : g.kind); } }
    return { b, goals };
  };
  it('the sloops and the frigates have a handful each, their own choice first', () => {
    expect(STRATEGIES.sloop.length).toBeGreaterThanOrEqual(3);
    expect(STRATEGIES.frigate.length).toBeGreaterThanOrEqual(5);
    for (const k of ['sloop', 'frigate'] as const) expect(STRATEGIES[k][0].order).toEqual(FREE);
  });
  it(`sloops running for the middle go for the heart's buoys only; holding the outside, never`, () => {
    expect(round('sloop', 'Run for the middle', 40).goals).not.toContain('outside');
    expect(round('sloop', 'Hold the outside', 40).goals).not.toContain('heart');
  });
  it(`frigates taking the middle step by step wreck a gate's guns; hunting their frigates fight them; controlling the outside keep off the gates`, () => {
    const siege = round('frigate', 'Take the middle step by step', 60);
    expect(siege.goals).toContain('guns');
    expect(siege.b.battery.some((x) => x.wrecked || x.hits > 0)).toBe(true);
    const hunt = round('frigate', 'Hunt their frigates', 40);
    expect(hunt.goals.filter((x) => x === 'fight').length).toBeGreaterThan(hunt.goals.length / 2);
    const out = round('frigate', 'Control the outside', 40);
    expect(out.goals).not.toContain('gate');
    expect(out.goals).not.toContain('heart');
  }, 60000);
});

describe('a raider snipes from off a frigate\'s bow or stern (15 Nov: "they snipe at the back or the front of the ship where they\'re safe, then they can\'t return a broadside")', () => {
  it('she makes for a berth across the frigate\'s line past her end, from where her own broadside rakes her and none of the frigate\'s bears on her', () => {
    const b = new Blockade(), raider = b.ships.find((s) => s.raider && s.team === 'gold')!, foe = frigate(b, 'crimson');
    // (out on open water, the frigate heading along the board, the raider off to one side of her and astern)
    b.ships.filter((s) => s !== raider && s !== foe).forEach((s, i) => s.helm.moor({ c: 30 + (i % 8), r: 30 + Math.floor(i / 8) * 3, d: 1 }));
    foe.helm.moor({ c: 8, r: 10, d: 1 });
    raider.helm.moor({ c: 2, r: 13, d: 1 });
    b.notice();
    const bot = new Bot(raider.id, dice(3));
    bot.tick(b, 5);
    expect(bot.goal?.kind).toBe('raid');
    const g = bot.goal as { kind: 'raid'; on: number; pose?: { c: number; r: number; d: number } };
    expect(g.on).toBe(foe.id);
    const at = g.pose!, al = alongs(foe.h), fp = foe.helm.pose;
    // (along the frigate's line, past one of her ends: her stern here, the nearer, not in her way)
    const along = (at.c - fp.c) * [0, 1, 0, -1][fp.d] + (at.r - fp.r) * [1, 0, -1, 0][fp.d];
    const across = (at.c - fp.c) * [0, 1, 0, -1][(fp.d + 1) % 4] + (at.r - fp.r) * [1, 0, -1, 0][(fp.d + 1) % 4];
    expect(along).toBeLessThan(al[0]);
    expect(Math.abs(across)).toBeLessThanOrEqual(1);
    expect(at.d % 2).not.toBe(fp.d % 2);
    // (lying there: her broadside lands on the frigate; neither of the frigate's reaches her)
    raider.helm.moor(at); b.notice();
    expect((['L', 'R'] as const).some((side) => b.aim(raider.id, side).some((x) => x.what?.what === 'ship' && x.what.id === foe.id))).toBe(true);
    for (const side of ['L', 'R'] as const) expect(b.aim(foe.id, side).some((x) => x.what?.what === 'ship' && x.what.id === raider.id)).toBe(false);
  });
});

describe('the brawl, to watch (15 Nov: "I want to see two of the big ships really having a brawl and fighting it out to see what that damage looks like")', () => {
  it('two war frigates put broadside to broadside fight each other, manoeuvring, and both are holed', () => {
    const b = new Blockade(), duel = b.brawl(), bots = new Bots(b, [], dice(5), duel);
    expect(duel.map((id) => b.ship(id).name)).toEqual(B.BRAWL.map((x) => x.name));
    const [a, z] = duel.map((id) => b.ship(id)), start = duel.map((id) => ({ ...b.ship(id).helm.pose }));
    for (const s of [a, z]) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`)).toBe(false);
    // (lying broadside to broadside: each one's broadside lands on the other)
    const bears = (x: typeof a, y: typeof a) => (['L', 'R'] as const).some((side) => b.aim(x.id, side).every((q) => q.what?.what === 'ship' && q.what.id === y.id));
    expect(bears(a, z)).toBe(true);
    expect(bears(z, a)).toBe(true);
    let moved = false;
    for (let i = 0; i < 400; i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (duel.some((id, k) => JSON.stringify(b.ship(id).helm.pose) !== JSON.stringify(start[k]))) moved = true;
    }
    for (const id of duel) expect(bots.doing(b, id), b.ship(id).name).toMatch(/fighting|knocked out/);
    expect(moved).toBe(true);
    expect(a.dmg.holes.length + (a.dmg.out ? 1 : 0)).toBeGreaterThan(0);
    expect(z.dmg.holes.length + (z.dmg.out ? 1 : 0)).toBeGreaterThan(0);
  });
});

describe('the bots, a whole round (15 Nov: "you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a fight to land a few pot shots")', () => {
  it('sloops in by the side ways first; frigates fight, shoot a gate down and get in; sloops hide, raid, are knocked out and rebuilt; ships sink and come back; both sides score', () => {
    // (seed 6: any seed's round has all of this but a frigate getting into the heart, which two rounds in three do)
    const b = new Blockade(), bots = new Bots(b, [], dice(6)), log = { gate: -1, sloopIn: -1, frigateIn: -1, hid: 0, raided: 0, fought: 0, outs: 0, sunk: 0, back: 0, launched: 0, rammed: 0, faded: 0, brigOut: 0, brigIn: 0 };
    const wasOut = new Set<number>();
    for (let i = 0; i < B.ROUND * 10; i++) {
      bots.tick(b, 0.1);
      const ev = b.tick(0.1);
      log.back += ev.returned.length;
      log.rammed += ev.rams.length; log.faded += ev.faded.length; log.launched += b.launches.splice(0).length;
      for (const s of b.ships) if (s.kind === 'brig' && s.away <= 0 && i % 10 === 0) b.inHeart(s) ? log.brigIn++ : log.brigOut++;
      for (const f of b.fired.splice(0)) for (const x of f.shots) if (x.sunk) log.sunk++;
      if (log.gate < 0 && b.gateOpen()) log.gate = b.clock;
      if (log.sloopIn < 0 && b.ships.some((s) => s.kind === 'sloop' && !s.craft && b.inHeart(s))) log.sloopIn = b.clock;
      if (log.frigateIn < 0 && b.ships.some((s) => s.kind === 'frigate' && b.inHeart(s))) log.frigateIn = b.clock;
      for (const s of b.ships) { if (s.dmg.out && !wasOut.has(s.id)) { log.outs++; wasOut.add(s.id); } if (!s.dmg.out) wasOut.delete(s.id); }
      if (i % 50 === 0) for (const x of bots.bots) { const d = bots.doing(b, x.id); if (d.startsWith('hiding')) log.hid++; if (d.startsWith('darting')) log.raided++; if (d.startsWith('fighting')) log.fought++; }
    }
    expect(log.sloopIn).toBeGreaterThan(0);
    expect(log.gate).toBeGreaterThan(log.sloopIn);
    expect(log.frigateIn).toBeGreaterThan(log.gate);
    for (const k of ['hid', 'raided', 'fought', 'outs', 'sunk', 'back', 'launched', 'rammed', 'faded'] as const) expect(log[k], k).toBeGreaterThan(0);
    // (the brigs out round the islands far more than in the heart: theirs is the middle ground)
    expect(log.brigOut).toBeGreaterThan(log.brigIn * 2);
    expect(b.score.gold).toBeGreaterThan(0);
    expect(b.score.crimson).toBeGreaterThan(0);
    expect(b.over).toBe(true);
    for (const s of b.ships) if (s.away <= 0) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`)).toBe(false);
  }, 120000);
});

describe('war brigs, the middle class (15 Nov: "a middle ship class, so it\'s not a big [brawling] fighter ... medium cannonballs ... but it can spawn ... haunted sloops"; "they can help fight around the islands ... the sloops get there first ... but like brig v sloop wins")', () => {
  it('between the sloop and the frigate: medium guns, two shots a side; a square a move, slower than a sloop\'s; her damage and influence between theirs', () => {
    const h = BRIG_HANDLING;
    expect([h.guns, h.shots, h.stride, h.long, h.wide]).toEqual(['medium', 2, 1, 2, 1]);
    expect(h.pace).toBeGreaterThan(SLOOP_HANDLING.pace);
    expect(h.pace).toBeLessThan(FRIGATE_HANDLING.pace);
    expect(B.INFLUENCE.brig).toBeGreaterThan(B.INFLUENCE.sloop);
    expect(B.INFLUENCE.brig).toBeLessThan(B.INFLUENCE.frigate);
    expect(DAMAGE.FULL['War brig']).toBeGreaterThan(DAMAGE.FULL.Sloop);
    expect(DAMAGE.FULL['War brig']).toBeLessThan(DAMAGE.FULL['War frigate']);
    // (a brig rides the side ways' winds out, as a frigate does: those are the sloops')
    expect(brig(new Blockade()).sea.windy).toBe(false);
  });
  it('brig v sloop, the brig wins: she knocks a sloop out in a few broadsides, the sloop needs many more for her; a frigate beats her', () => {
    const broadsides = (gun: 'small' | 'medium' | 'large', shots: number, full: number) => Math.ceil(full / (DAMAGE.SHOT[gun] * shots));
    const brigOnSloop = broadsides('medium', 2, DAMAGE.FULL.Sloop), sloopOnBrig = broadsides('small', 1, DAMAGE.FULL['War brig']);
    expect(sloopOnBrig).toBeGreaterThanOrEqual(brigOnSloop * 4);
    expect(broadsides('large', 2, DAMAGE.FULL['War brig'])).toBeLessThan(broadsides('medium', 2, DAMAGE.FULL['War frigate']));
  });
  it('each brig launches her craft off her sides, heading as she is, for a while; not again till they\'re all back aboard and her time\'s up', () => {
    const b = new Blockade(), t = brig(b, 'gold'), g = brig(b, 'crimson');
    clearAway(b, [t, g]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); g.helm.moor({ c: 24, r: 28, d: 3 }); b.notice();
    expect(b.craftOf(t).map((x) => x.craft!.kind)).toEqual(['ram', 'ram', 'ram']);
    expect(b.craftOf(g).map((x) => x.craft!.kind)).toEqual(['ghost', 'ghost']);
    expect(b.craftOf(t).every((x) => x.away > 0)).toBe(true);
    const ids = b.launch(t.id);
    expect(ids).toHaveLength(3);
    const mine = squares(t.h, t.helm.pose);
    for (const id of ids) {
      const x = b.ship(id), p = x.helm.pose;
      expect(x.away).toBe(0);
      expect(p.d).toBe(t.helm.pose.d);
      expect(mine.some(([c, r]) => Math.max(Math.abs(c - p.c), Math.abs(r - p.r)) === 1)).toBe(true);
      expect(b.under(p.c, p.r)?.id).toBe(id);
      expect(x.craft!.life).toBe(B.LAUNCH.LIFE.ram);
    }
    expect(b.launch(t.id)).toEqual([]);
    // (her turtles' time up: they fade, back aboard; and once her time's up too, she launches again)
    let faded: number[] = [];
    for (let s = 0; s < B.LAUNCH.LIFE.ram + 1; s += 0.5) faded.push(...b.tick(0.5).faded);
    expect(faded.sort()).toEqual([...ids].sort());
    expect(b.craftOf(t).every((x) => x.away === Infinity)).toBe(true);
    while (b.clock < B.LAUNCH.EVERY) b.tick(0.5);
    expect(b.launch(t.id)).toHaveLength(3);
  });
  it('a turtle beside an enemy lying still rams her, backs off a moment, and rams again; whatever she is (15 Nov: "send in the turtles and crush your war frigs"; "rather than ... [a rule] ... a mechanical advantage")', () => {
    const b = new Blockade(), t = brig(b, 'gold'), f = frigate(b, 'crimson');
    clearAway(b, [t, f]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); f.helm.moor({ c: 26, r: 9, d: 1 }); b.notice();
    const [turtle] = b.launch(t.id), x = b.ship(turtle);
    for (const c of b.craftOf(t)) if (c !== x) c.helm.moor({ c: 40, r: 30 + (c.id % 3), d: 1 });
    // (lying just off the frigate's side)
    x.helm.moor({ c: f.helm.pose.c, r: Math.max(...squares(f.h, f.helm.pose).map(([, r]) => r)) + 1, d: 1 }); b.notice();
    // (a ship that's only just come there slips her; lying still a moment, she's rammed)
    expect(b.tick(0.1).rams).toHaveLength(0);
    let first: ReturnType<Blockade['tick']>['rams'] = [];
    for (let i = 0; i < 20 && !first.length; i++) first = b.tick(0.1).rams;
    expect(first).toHaveLength(1);
    expect(first[0].on).toBe(f.id);
    expect(f.dmg.holes).toHaveLength(B.LAUNCH.RAM.hits);
    expect(x.away).toBe(0);
    expect(b.tick(0.1).rams).toHaveLength(0);
    let again = 0;
    for (let i = 0; i < B.LAUNCH.RAM.COOL * 10 + 5 && !again; i++) again = b.tick(0.1).rams.length;
    expect(again).toBe(1);
    // (a sloop lying still beside her is rammed as any ship is: no rule keeps her off)
    const sl = sloop(b, 'crimson');
    f.helm.moor({ c: 40, r: 20, d: 1 }); sl.helm.moor({ c: x.helm.pose.c + 1, r: x.helm.pose.r, d: 1 }); b.notice();
    let onSloop = 0;
    for (let i = 0; i < 60 && !onSloop; i++) onSloop = b.tick(0.1).rams.filter((r) => r.on === sl.id).length;
    expect(onSloop).toBe(1);
  });
  it('a phantom sloop: no shot ever hits her, and she holds no buoy; nor does a turtle (15 Nov: "they don\'t take damage. Like, you really can\'t shoot them")', () => {
    const b = new Blockade(), t = brig(b, 'gold'), g = brig(b, 'crimson'), f = frigate(b, 'gold');
    clearAway(b, [t, g, f]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); g.helm.moor({ c: 24, r: 30, d: 1 }); f.helm.moor({ c: 20, r: 10, d: 1 }); b.notice();
    const turtle = b.ship(b.launch(t.id)[0]), ghost = b.ship(b.launch(g.id)[0]);
    // (the phantom right under the frigate's broadside: it goes through her)
    ghost.helm.moor({ c: f.helm.pose.c - 1, r: Math.max(...squares(f.h, f.helm.pose).map(([, r]) => r)) + 2, d: 1 }); b.notice();
    for (let i = 0; i < 6; i++) { f.guns.tick(9); for (const side of ['L', 'R'] as const) expect(b.fire(f.id, side)?.shots.some((x) => x.what?.what === 'ship' && x.what.id === ghost.id) ?? false).toBe(false); }
    expect(ghost.dmg.holes).toHaveLength(0);
    // (on a buoy, neither holds it)
    const buoy = B.BUOYS[3];
    ghost.helm.moor({ c: buoy.at[0], r: buoy.at[1] + 1, d: 1 }); turtle.helm.moor({ c: buoy.at[0], r: buoy.at[1] - 1, d: 1 }); b.notice();
    expect(b.reaches(ghost, buoy)).toBe(false);
    expect(b.reaches(turtle, buoy)).toBe(false);
  });
  it('a craft knocked out goes down at once and stays aboard her brig, never coming back at the edge; and her brig sunk, her craft fade', () => {
    const b = new Blockade(), t = brig(b, 'gold'), f = frigate(b, 'crimson');
    clearAway(b, [t, f]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); f.helm.moor({ c: 20, r: 10, d: 1 }); b.notice();
    const [a, z] = b.launch(t.id).map((id) => b.ship(id));
    // (one turtle lying under the frigate's broadside, the others well away from it)
    a.helm.moor({ c: f.helm.pose.c - 1, r: Math.max(...squares(f.h, f.helm.pose).map(([, r]) => r)) + 2, d: 1 });
    z.helm.moor({ c: 40, r: 3, d: 1 });
    for (const x of b.craftOf(t)) if (x !== a && x !== z) x.helm.moor({ c: 40, r: 6, d: 1 });
    b.notice();
    let sunk = false;
    for (let i = 0; i < 12 && !sunk; i++) { f.guns.tick(9); sunk = (['L', 'R'] as const).some((side) => b.fire(f.id, side)?.shots.some((x) => x.sunk && x.what?.what === 'ship' && x.what.id === a.id)); }
    expect(sunk).toBe(true);
    expect(a.away).toBe(Infinity);
    for (let s = 0; s < B.RETURN + 5; s += 0.5) expect(b.tick(0.5).returned).not.toContain(a.id);
    // (her brig sunk: her other turtles fade, if they've not faded already)
    if (z.away <= 0) { b.sink(t); expect(b.tick(0.1).faded).toContain(z.id); }
  });
  it('launching anchors her: she can\'t move while her craft are out; weighing anchor calls them home and takes a while (15 Nov: "she has to stay anchored while they\'re out ... They become a sitting duck")', () => {
    const b = new Blockade(), t = brig(b, 'gold');
    clearAway(b, [t]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); b.notice();
    expect(b.anchored(t)).toBe(false);
    expect(b.launch(t.id).length).toBeGreaterThan(0);
    expect(b.anchored(t)).toBe(true);
    expect(b.put(t.id, 'F')).toBe(false);
    expect(b.drop(t.id, 30, 6)).toBeNull();
    const at = { ...t.helm.pose };
    for (let i = 0; i < 50; i++) b.tick(0.1);
    expect(t.helm.pose).toEqual(at);
    // (weighing anchor: her craft home at once, and WEIGH seconds before she's free)
    expect(b.weighAnchor(t.id)).toBe(true);
    expect(b.craftOf(t).every((x) => x.away > 0)).toBe(true);
    expect(b.anchored(t)).toBe(true);
    for (let s = 0; s < B.LAUNCH.WEIGH - 0.5; s += 0.5) b.tick(0.5);
    expect(b.anchored(t)).toBe(true);
    b.tick(1);
    expect(b.anchored(t)).toBe(false);
    expect(b.put(t.id, 'F')).toBe(true);
  });
  it('a brig\'s bot won\'t anchor to launch with an enemy sloop close enough to catch her at it', () => {
    const b = new Blockade(), t = brig(b, 'gold'), f = frigate(b, 'crimson'), sl = sloop(b, 'crimson');
    clearAway(b, [t, f, sl]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); f.helm.moor({ c: 26, r: 14, d: 1 }); sl.helm.moor({ c: 23, r: 8, d: 1 }); b.notice();
    const bots = new Bots(b, b.ships.filter((s) => s !== t && !s.craft).map((s) => s.id), dice(3));
    for (let i = 0; i < 30; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    expect(b.anchored(t)).toBe(false);
    // (the sloop gone off: she launches, and anchors)
    sl.helm.moor({ c: 40, r: 30, d: 1 }); b.notice();
    for (let i = 0; i < 30 && !b.anchored(t); i++) { bots.tick(b, 0.1); b.tick(0.1); }
    expect(b.anchored(t)).toBe(true);
  });
  it('a brig\'s bot launches her craft when an enemy frigate\'s near, and her turtles ram her', () => {
    const b = new Blockade(), t = brig(b, 'gold'), f = frigate(b, 'crimson');
    clearAway(b, [t, f]);
    t.helm.moor({ c: 20, r: 6, d: 1 }); f.helm.moor({ c: 26, r: 9, d: 1 }); b.notice();
    const bots = new Bots(b, b.ships.filter((s) => s !== t && s !== f && !s.craft).map((s) => s.id), dice(3));
    let launched = 0, rammed = 0;
    for (let i = 0; i < 400 && !rammed; i++) { bots.tick(b, 0.1); launched += b.launches.splice(0).length; rammed += b.tick(0.1).rams.filter((x) => x.on === f.id).length; }
    expect(launched).toBeGreaterThan(0);
    expect(rammed).toBeGreaterThan(0);
  });
});

describe('reefs round the island buoys, the brigs\' and the sloops\' middle ground (15 Nov: "Maybe need like some middle ground somewhere"; "Yeah, do it")', () => {
  it('two lagoons, one on each side\'s wind (15 Nov: "two lagoons like that"): a ring three squares out round each, gaps a square wide, a lagoon inside', () => {
    const b = new Blockade();
    expect(B.REEFS).toHaveLength(2);
    for (const reef of B.REEFS) {
      expect(lagoonBuoy(reef)).toBeTruthy();
      for (const [c, r] of reefSquares(reef)) expect(b.rocks.has(`${c},${r}`)).toBe(true);
      for (const [c, r] of reef.gaps) expect(b.rocks.has(`${c},${r}`), `gap ${c},${r}`).toBe(false);
      // (open water inside, but its tiny island)
      for (let c = reef.at[0] - 2; c <= reef.at[0] + 2; c++) for (let r = reef.at[1] - 2; r <= reef.at[1] + 2; r++) if (c !== reef.islet[0] || r !== reef.islet[1]) expect(b.rocks.has(`${c},${r}`), `lagoon ${c},${r}`).toBe(false);
    }
  });
  it('a sloop and a brig get in to the buoy; a frigate can\'t, and her influence doesn\'t reach it from outside the reef', () => {
    const b = new Blockade(), sea = frigate(b).sea.bare();
    for (const reef of B.REEFS) for (const s of [sloop(b), brig(b), frigate(b)]) expect(!!s.sea.plotPast(s.helm.pose, ...lagoonBuoy(reef).at), `${s.name} to ${lagoonBuoy(reef).at}`).toBe(s.kind !== 'frigate');
    // (anywhere a frigate can lie outside the reef, her influence falls short of its buoy)
    for (const reef of B.REEFS) for (let c = 0; c < B.COLS; c++) for (let r = 0; r < B.ROWS; r++) for (const d of [0, 1, 2, 3]) {
      const p = { c, r, d }, at = lagoonBuoy(reef).at;
      if (!sea.fits(p) || squares(frigate(b).h, p).some(([x, y]) => Math.max(Math.abs(x - reef.at[0]), Math.abs(y - reef.at[1])) <= 2)) continue;
      expect(squares(frigate(b).h, p).every(([x, y]) => Math.hypot(x - at[0], y - at[1]) > B.INFLUENCE.frigate)).toBe(true);
    }
  });
  it('every frigate can still get to both gates and the open sea all round, the long way past the islands', () => {
    const b = new Blockade();
    for (const f of b.ships.filter((s) => s.kind === 'frigate')) for (const [c, r] of [[21, 9], [22, 26], [6, 8], [38, 28]] as [number, number][]) {
      expect(f.sea.plotPast(f.helm.pose, c, r), `${f.name} to ${c},${r}`).not.toBeNull();
    }
  });
});
