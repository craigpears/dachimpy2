/* The blockade proof of concept (src/blockade.ts, src/blockade-bots.ts). The user, 15 Nov: "go study blockading and
   how blockade boards look ... sideways for the sloops and ... a few bots ... competing, trying to get to the points.
   The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking the
   shortcuts, taking those sideways in, just like winds". */
import { describe, expect, it } from 'vitest';
import { BLOCKADE, Blockade } from '../src/blockade';
import { Bots, bombardBerths } from '../src/blockade-bots';
import { squares } from '../src/ship-handling';

const B = BLOCKADE, heart: [number, number] = [15, 20];
/** A seeded dice, so a game plays the same every run. */
const dice = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

describe('the board, as a blockade board is: rocks, winds, buoys, a wall with three ways in', () => {
  it('both sides come in at the foot, a war frigate and two sloops each, where they fit', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) {
      const mine = b.ships.filter((s) => s.team === team);
      expect(mine.map((s) => s.kind).sort()).toEqual(['frigate', 'sloop', 'sloop']);
      for (const s of mine) { expect(s.sea.fits(s.helm.pose)).toBe(true); expect(s.helm.pose.r).toBeLessThan(4); }
    }
  });
  it('the heart\'s ways in: the gate\'s one-square way, and a side way at each flank; nothing else through the wall', () => {
    const b = new Blockade(), open: number[] = [];
    for (let c = 0; c < B.COLS; c++) if (!b.rocks.has(`${c},${B.WALL.r0}`)) open.push(c);
    expect(open).toEqual([B.SIDEWAYS[0], B.GATE.WAY, B.SIDEWAYS[1]]);
  });
  it('the sloops get into the heart from the start; the frigates can\'t till a tower\'s down (16 Nov: "a way of naturally delaying the war [frigs]")', () => {
    const b = new Blockade();
    for (const s of b.ships) expect(!!s.sea.plot(s.helm.pose, ...heart), s.name).toBe(s.kind === 'sloop');
    b.gate.towers[0].hp = 0;
    for (const [c, r] of b.gate.towers[0].squares) b.rocks.delete(`${c},${r}`);
    for (const s of b.ships) { s.sea.touch(); expect(!!s.sea.plot(s.helm.pose, ...heart), s.name).toBe(true); }
  });
  it('a wind blows up through each side way, carrying a sloop through it fast; a frigate rides the winds out (15 Nov: "sideways ... only the sloops can really get to on those fast little winds")', () => {
    const b = new Blockade();
    for (const c of B.SIDEWAYS) for (let r = B.WALL.r0; r <= B.WALL.r1; r++) expect(b.wind.get(`${c},${r}`)).toBe(0);
    const sloop = b.ships.find((s) => s.kind === 'sloop')!, frigate = b.ships.find((s) => s.kind === 'frigate')!;
    const [c] = B.SIDEWAYS, got = sloop.sea.move({ c, r: B.WINDS[0].at[1] - 1, d: 0 }, 'F');
    expect(got.ride.length).toBeGreaterThan(5);
    expect(got.ride[got.ride.length - 1].r).toBeGreaterThan(B.WALL.r1);
    expect(frigate.sea.windy).toBe(false);
  });
  it('buoys of one to three pennants, the best in the heart', () => {
    const inHeart = B.BUOYS.filter((x) => x.at[1] > B.WALL.r1), outside = B.BUOYS.filter((x) => x.at[1] < B.WALL.r0);
    expect(Math.max(...inHeart.map((x) => x.pennants))).toBe(3);
    expect(Math.max(...outside.map((x) => x.pennants))).toBeLessThan(3);
    const b = new Blockade();
    for (const x of B.BUOYS) expect(b.rocks.has(`${x.at[0]},${x.at[1]}`)).toBe(false);
  });
});

describe('scoring, as YPPedia has it: a buoy in one side\'s influence alone scores its pennants each turn', () => {
  it('one side\'s ship on a buoy scores it; both sides\' cancel out; nobody\'s, nothing', () => {
    const b = new Blockade(), [g] = b.ships.filter((s) => s.team === 'gold' && s.kind === 'sloop'), [cr] = b.ships.filter((s) => s.team === 'crimson' && s.kind === 'sloop');
    const buoy = B.BUOYS[0];
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
  it('a frigate\'s influence reaches further than a sloop\'s', () => {
    expect(B.INFLUENCE.frigate).toBeGreaterThan(B.INFLUENCE.sloop);
  });
  it('a ship knocked out has no influence', () => {
    const b = new Blockade(), s = b.ships.find((x) => x.kind === 'sloop')!, buoy = B.BUOYS[0];
    s.helm.moor({ c: buoy.at[0], r: buoy.at[1] - 1, d: 0 });
    for (let i = 0; i < 3; i++) s.dmg.hit('large', 0, 'L');
    expect(s.dmg.out).toBe(true);
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
    const b = new Blockade(), f = b.ships.find((s) => s.kind === 'frigate' && s.team === 'gold')!, s = b.ships.find((x) => x.kind === 'sloop' && x.team === 'crimson')!;
    f.helm.moor({ c: 10, r: 6, d: 0 }); s.helm.moor({ c: 12, r: 6, d: 0 });
    for (let i = 0; i < 3; i++) {
      const got = b.fire(f.id, 'R')!;
      const shot = got.shots.find((x) => x.what?.what === 'ship')!;
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
  it('only a frigate\'s large guns hurt the gate\'s towers, and shooting it rouses its guns', () => {
    const b = new Blockade(), f = b.ships.find((s) => s.kind === 'frigate')!, berth = bombardBerths(b, f)[0];
    expect(berth).toBeTruthy();
    f.helm.moor(berth.pose);
    const got = b.fire(f.id, berth.side)!;
    expect(got.shots.some((x) => x.got === 'hit')).toBe(true);
    expect(b.battery.every((g) => g.roused)).toBe(true);
    const s = b.ships.find((x) => x.kind === 'sloop')!, sb = bombardBerths(b, s)[0];
    s.helm.moor(sb.pose);
    expect(b.fire(s.id, sb.side)!.shots.some((x) => x.got === 'bounced')).toBe(true);
  });
});

describe('the bots, a whole round (15 Nov: "the [war frig] bots ... blast their way through while the sloops are more nimble, taking the shortcuts")', () => {
  const play = (seed: number) => {
    const b = new Blockade(), bots = new Bots(b, [], dice(seed)), log = { gateAt: -1, sloopInHeart: -1, frigateInHeart: -1 };
    for (let t = 0; t < B.ROUND; t += 0.1) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (log.gateAt < 0 && b.gate.open()) log.gateAt = b.clock;
      if (log.sloopInHeart < 0 && b.ships.some((s) => s.kind === 'sloop' && b.inHeart(s))) log.sloopInHeart = b.clock;
      if (log.frigateInHeart < 0 && b.ships.some((s) => s.kind === 'frigate' && b.inHeart(s))) log.frigateInHeart = b.clock;
    }
    return { b, log };
  };
  it('the sloops are into the heart first by the side ways; the frigates shoot the gate open and follow; both sides score', () => {
    const { b, log } = play(7);
    expect(log.sloopInHeart).toBeGreaterThan(0);
    expect(log.gateAt).toBeGreaterThan(log.sloopInHeart);
    expect(log.frigateInHeart).toBeGreaterThan(log.gateAt);
    expect(b.score.gold).toBeGreaterThan(0);
    expect(b.score.crimson).toBeGreaterThan(0);
    expect(b.over).toBe(true);
    // (and she lies where she's drawn: every ship on open water)
    for (const s of b.ships) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`)).toBe(false);
  }, 120000);
});
