/* The blockade proof of concept (src/blockade.ts, src/blockade-bots.ts). The user, 15 Nov: "go study blockading and
   how blockade boards look ... sideways for the sloops and ... a few bots ... competing, trying to get to the points.
   The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking the
   shortcuts, taking those sideways in, just like winds"; then "blockading is a bit more epic ... a good handful of
   sloops each side and ... three or four [war frigs] ... coming from different directions ... Some ocean, some island
   ... you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a fight to land a few pot
   shots". */
import { describe, expect, it } from 'vitest';
import { BLOCKADE, Blockade, inHeart, islandLand } from '../src/blockade';
import { Bot, Bots, bombardBerths } from '../src/blockade-bots';
import { orderAt, orderText, FREE } from '../src/blockade-orders';
import { squares, alongs } from '../src/ship-handling';

const B = BLOCKADE, prize: [number, number] = [21, 17];
/** A seeded dice, so a game plays the same every run. */
const dice = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const frigate = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'frigate' && s.team === team)!;
const sloop = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'sloop' && s.team === team)!;

describe('the board, as a blockade board is, and more epic (15 Nov: "three or four [war frigs] ... coming from different directions ... Some ocean, some island")', () => {
  it('each side three war frigates and five sloops, coming in from two edges of its own, where they fit', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) {
      const mine = b.ships.filter((s) => s.team === team);
      expect(mine.filter((s) => s.kind === 'frigate')).toHaveLength(3);
      expect(mine.filter((s) => s.kind === 'sloop')).toHaveLength(5);
      const edges = new Set(mine.map(({ helm: { pose: p } }) => (p.r <= 2 ? 'south' : p.c <= 2 ? 'west' : p.r >= B.ROWS - 3 ? 'north' : p.c >= B.COLS - 3 ? 'east' : 'none')));
      expect(edges.has('none')).toBe(false);
      expect(edges.size).toBe(2);
      for (const s of mine) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`), s.name).toBe(false);
    }
  });
  it('the heart\'s a walled fort: its only ways in the two gates\' and the two side ways, one square each', () => {
    const b = new Blockade(), open: string[] = [];
    for (const w of B.WALLS) for (let c = w.c0; c <= w.c1; c++) for (let r = w.r0; r <= w.r1; r++) if (!b.rocks.has(`${c},${r}`)) open.push(`${c},${r}`);
    const ways = [...B.GATES.flatMap((g) => [`${g.way},${g.r0}`, `${g.way},${g.r1}`]), ...B.SIDEWAYS.map(([c, r]) => `${c},${r}`)];
    expect(open.sort()).toEqual([...new Set(ways)].sort());
  });
  it('the sloops can get into the heart from the start; the frigates can\'t till a tower\'s down (15 Nov: "a way of naturally delaying the war [frigs]")', () => {
    const b = new Blockade();
    for (const s of b.ships) expect(!!s.sea.plotPast(s.helm.pose, ...prize), s.name).toBe(s.kind === 'sloop');
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
  it('islands out on the open sea, each with a cove a sloop can hide in and a frigate can\'t get into, its rocks between her and the guns', () => {
    const b = new Blockade(), s = sloop(b), f = frigate(b);
    expect(B.ISLANDS.length).toBeGreaterThanOrEqual(4);
    for (const isle of B.ISLANDS) {
      expect(islandLand(isle).every(([c, r]) => b.rocks.has(`${c},${r}`))).toBe(true);
      expect(b.rocks.has(`${isle.cove[0]},${isle.cove[1]}`)).toBe(false);
      expect(s.sea.plotPast(s.helm.pose, ...isle.cove), `sloop to ${isle.cove}`).not.toBeNull();
      for (let d = 0; d < 4; d++) expect(squares(f.h, { c: isle.cove[0], r: isle.cove[1], d }).some(([c, r]) => b.rocks.has(`${c},${r}`))).toBe(true);
      // (sideways onto the cove from the open sea, a shot comes down on the island's rocks)
      for (const dc of [-1, 1]) {
        const shooter = { c: isle.cove[0] + dc * 3, r: isle.cove[1] };
        if (b.rocks.has(`${shooter.c},${shooter.r}`)) continue;
        for (let k = 1; k < 3; k++) expect(b.rocks.has(`${isle.cove[0] + dc * k},${isle.cove[1]}`)).toBe(true);
      }
    }
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
    bots.order(sl.id, { kind: 'camp', at: [10, 11] });
    bots.order(other.id, { kind: 'hold', buoy: 8 });
    for (let i = 0; i < 2; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    const goal = (id: number) => bots.bots.find((x) => x.id === id)!.goal;
    expect(goal(f.id)).toMatchObject({ kind: 'gate', g: 1 });
    let camped = 0;
    for (let i = 0; i < 900; i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (i > 600 && sl.away <= 0 && !sl.dmg.out && squares(sl.h, sl.helm.pose).some(([c, r]) => c === 10 && r === 11)) camped++;
    }
    expect(camped).toBeGreaterThan(100);
    expect(b.reaches(other, B.BUOYS[8]) || other.dmg.out || other.away > 0).toBe(true);
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
    const b = new Blockade(), bots = new Bots(b, [], dice(6)), log = { gate: -1, sloopIn: -1, frigateIn: -1, hid: 0, raided: 0, fought: 0, outs: 0, sunk: 0, back: 0 };
    const wasOut = new Set<number>();
    for (let i = 0; i < B.ROUND * 10; i++) {
      bots.tick(b, 0.1);
      const ev = b.tick(0.1);
      log.back += ev.returned.length;
      for (const f of b.fired.splice(0)) for (const x of f.shots) if (x.sunk) log.sunk++;
      if (log.gate < 0 && b.gateOpen()) log.gate = b.clock;
      if (log.sloopIn < 0 && b.ships.some((s) => s.kind === 'sloop' && b.inHeart(s))) log.sloopIn = b.clock;
      if (log.frigateIn < 0 && b.ships.some((s) => s.kind === 'frigate' && b.inHeart(s))) log.frigateIn = b.clock;
      for (const s of b.ships) { if (s.dmg.out && !wasOut.has(s.id)) { log.outs++; wasOut.add(s.id); } if (!s.dmg.out) wasOut.delete(s.id); }
      if (i % 50 === 0) for (const x of bots.bots) { const d = bots.doing(b, x.id); if (d.startsWith('hiding')) log.hid++; if (d.startsWith('darting')) log.raided++; if (d.startsWith('fighting')) log.fought++; }
    }
    expect(log.sloopIn).toBeGreaterThan(0);
    expect(log.gate).toBeGreaterThan(log.sloopIn);
    expect(log.frigateIn).toBeGreaterThan(log.gate);
    for (const k of ['hid', 'raided', 'fought', 'outs', 'sunk', 'back'] as const) expect(log[k], k).toBeGreaterThan(0);
    expect(b.score.gold).toBeGreaterThan(0);
    expect(b.score.crimson).toBeGreaterThan(0);
    expect(b.over).toBe(true);
    for (const s of b.ships) if (s.away <= 0) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`)).toBe(false);
  }, 120000);
});
