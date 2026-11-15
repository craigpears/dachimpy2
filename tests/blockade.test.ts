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
  it('sloops in by the side ways first; frigates fight, shoot a gate down and get in; sloops hide, raid, are knocked out and rebuilt; both sides score', () => {
    const b = new Blockade(), bots = new Bots(b, [], dice(5)), log = { gate: -1, sloopIn: -1, frigateIn: -1, hid: 0, raided: 0, fought: 0, outs: 0 };
    const wasOut = new Set<number>();
    for (let i = 0; i < B.ROUND * 10; i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (log.gate < 0 && b.gateOpen()) log.gate = b.clock;
      if (log.sloopIn < 0 && b.ships.some((s) => s.kind === 'sloop' && b.inHeart(s))) log.sloopIn = b.clock;
      if (log.frigateIn < 0 && b.ships.some((s) => s.kind === 'frigate' && b.inHeart(s))) log.frigateIn = b.clock;
      for (const s of b.ships) { if (s.dmg.out && !wasOut.has(s.id)) { log.outs++; wasOut.add(s.id); } if (!s.dmg.out) wasOut.delete(s.id); }
      if (i % 50 === 0) for (const x of bots.bots) { const d = bots.doing(b, x.id); if (d.startsWith('hiding')) log.hid++; if (d.startsWith('darting')) log.raided++; if (d.startsWith('fighting')) log.fought++; }
    }
    expect(log.sloopIn).toBeGreaterThan(0);
    expect(log.gate).toBeGreaterThan(log.sloopIn);
    expect(log.frigateIn).toBeGreaterThan(log.gate);
    for (const k of ['hid', 'raided', 'fought', 'outs'] as const) expect(log[k], k).toBeGreaterThan(0);
    expect(b.score.gold).toBeGreaterThan(0);
    expect(b.score.crimson).toBeGreaterThan(0);
    expect(b.over).toBe(true);
    for (const s of b.ships) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`)).toBe(false);
  }, 120000);
});
