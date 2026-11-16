/* The blockade proof of concept (src/blockade.ts, src/blockade-ai/). The user, 15 Nov: "go study blockading and
   how blockade boards look ... sideways for the sloops and ... a few bots ... competing, trying to get to the points.
   The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking the
   shortcuts, taking those sideways in, just like winds"; then "blockading is a bit more epic ... a good handful of
   sloops each side and ... three or four [war frigs] ... coming from different directions ... Some ocean, some island
   ... you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a fight to land a few pot
   shots". */
import { describe, expect, it } from 'vitest';
import { BLOCKADE, Blockade, inHeart, reefSquares, laneSquares } from '../src/blockade';
import { botFor, Bots, bombardBerths } from '../src/blockade-ai/index';
import { orderAt, orderText, FREE, STRATEGIES } from '../src/blockade-orders';
import { squares, alongs, SLOOP_HANDLING, BRIG_HANDLING, FRIGATE_HANDLING } from '../src/ship-handling';
import { DAMAGE } from '../src/ship-damage';

const B = BLOCKADE, prize: [number, number] = [27, 23];
/** A seeded dice, so a game plays the same every run. */
const dice = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const frigate = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'frigate' && s.team === team)!;
const sloop = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'sloop' && s.team === team && !s.craft)!;
const brig = (b: Blockade, team = 'gold') => b.ships.find((s) => s.kind === 'brig' && s.team === team)!;
/** A lagoon's buoy (inside its reef). */
const lagoonBuoy = (reef: (typeof B.REEFS)[number]) => B.BUOYS.find((u) => Math.max(Math.abs(u.at[0] - reef.at[0]), Math.abs(u.at[1] - reef.at[1])) <= 2)!;
/** Everyone else out of the way, on open water in the north-east, so a test's ships have the sea to themselves. */
const clearAway = (b: Blockade, keep: { id: number }[]) => {
  b.ships.filter((s) => !keep.some((k) => k.id === s.id) && !s.craft).forEach((s, i) => s.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
  b.notice();
};

describe('the board, as a blockade board is, and more epic (15 Nov: "three or four [war frigs] ... coming from different directions ... Some ocean, some island")', () => {
  it('each side two war frigates, two war brigs and five sloops (three frigates till 15 Nov: "a bit crowded with [war frigates]"), coming in from two edges of its own, where they fit', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) {
      const mine = b.ships.filter((s) => s.team === team && !s.craft);
      expect(mine.filter((s) => s.kind === 'frigate')).toHaveLength(2);
      expect(mine.filter((s) => s.kind === 'brig')).toHaveLength(2);
      expect(mine.filter((s) => s.kind === 'sloop')).toHaveLength(5);
      const edges = new Set(mine.map(({ helm: { pose: p } }) => (p.r <= 2 ? 'south' : p.c <= 2 ? 'west' : p.r >= B.ROWS - 3 ? 'north' : p.c >= B.COLS - 3 ? 'east' : 'none')));
      expect(edges.has('none')).toBe(false);
      // (the small ships by both side edges, island side and ocean side, 15 Nov; one frigate by each end since 16 Nov:
      // "one frig from each team should come in on each side")
      expect(edges.size).toBe(4);
      for (const s of mine) for (const [c, r] of squares(s.h, s.helm.pose)) expect(b.rocks.has(`${c},${r}`), s.name).toBe(false);
    }
  });
  it('the heart\'s a walled fort: its only ways through the two gates\', the two side ways, the ways out and the two posterns, one square each', () => {
    const b = new Blockade(), open: string[] = [];
    for (const w of B.WALLS) for (let c = w.c0; c <= w.c1; c++) for (let r = w.r0; r <= w.r1; r++) if (!b.rocks.has(`${c},${r}`)) open.push(`${c},${r}`);
    const inWall = ([c, r]: [number, number]) => B.WALLS.some((w) => c >= w.c0 && c <= w.c1 && r >= w.r0 && r <= w.r1);
    const ways = [...B.GATES.flatMap((g) => [`${g.way},${g.r0}`, `${g.way},${g.r1}`]), ...B.SIDEWAYS.map(([c, r]) => `${c},${r}`), ...B.POSTERNS.map(([c, r]) => `${c},${r}`), ...B.EXITS.flat().flatMap(laneSquares).filter(inWall).map(([c, r]) => `${c},${r}`)];
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
    s.helm.moor({ c: 27, r: 22, d: 0 }); b.notice();
    const bot = botFor(b, s.id, dice(1)), goalAt = () => { bot.tick(b, 0.1); const g = bot.goal; return g?.kind === 'buoy' ? B.BUOYS[g.i].at : null; };
    for (let i = 0; i < 40; i++) goalAt();
    expect(inHeart(...goalAt()!)).toBe(true);
    foe.helm.moor({ c: 28, r: 25, d: 1 }); b.notice();
    const fresh = botFor(b, s.id, dice(1));
    for (let i = 0; i < 40; i++) fresh.tick(b, 0.1);
    const g = fresh.goal;
    expect(g).not.toBeNull();
    expect(g!.kind === 'buoy' && inHeart(...B.BUOYS[g!.i].at)).toBe(false);
  });
  it('the heart worth eight, each lagoon five, each gate\'s buoy two: the heart and one lagoon contested beat the other lagoon; both lagoons beat the heart (15 Nov: "centre\'s worth 8, a lagoon is worth 5")', () => {
    const sum = (f: (x: (typeof B.BUOYS)[number]) => boolean) => B.BUOYS.filter(f).reduce((t, x) => t + x.pennants, 0);
    const heart = sum((x) => inHeart(...x.at)), lagoon = B.REEFS.map((r) => sum((x) => Math.max(Math.abs(x.at[0] - r.at[0]), Math.abs(x.at[1] - r.at[1])) <= 2));
    expect([heart, ...lagoon]).toEqual([8, 5, 5]);
    expect(heart).toBeGreaterThan(lagoon[0]);
    expect(lagoon[0] + lagoon[1]).toBeGreaterThan(heart);
    expect(sum(() => true) - heart - lagoon[0] - lagoon[1]).toBe(4);
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
  it('a frigate\'s broadside on a sloop holes her where it struck; the third sinks her, gone till she comes back in (15 Nov: "we were supposed to be sinking ships, not having them just float around there")', () => {
    const b = new Blockade(), f = frigate(b), s = sloop(b, 'crimson');
    f.helm.moor({ c: 14, r: 20, d: 0 }); s.helm.moor({ c: 16, r: 20, d: 0 });
    for (let i = 0; i < 3; i++) {
      const shot = b.fire(f.id, 'R')!.shots.find((x) => x.what?.what === 'ship')!;
      expect(shot.hole).toBeTruthy();
      expect(shot.hole!.side).toBe('L');   // (facing up the board, the frigate\'s off her port side)
      if (i < 2) expect(s.away).toBe(0);
      f.guns.tick(9);
    }
    expect(s.away).toBeGreaterThan(0);
    let back = false;
    for (let t = 0; t < 60 && !back; t += 0.5) back = b.tick(0.5).returned.includes(s.id);
    expect(back).toBe(true);
    expect(s.dmg.share()).toBe(0);
  });
  it('a ship back in waits a moment before she can move; nobody in the safe zone round the edge can fire or be shot (15 Nov: "the safe zone around the edge ... you can\'t shoot each other ... one turn before they can move again")', () => {
    const b = new Blockade(), s = sloop(b);
    b.sink(s);
    for (let t = 0; t < 60 && s.away > 0; t += 0.5) b.tick(0.5);
    const at = { ...s.helm.pose };
    expect(b.safe(s)).toBe(true);
    s.helm.put('F');
    b.tick(1);
    expect(s.helm.pose).toEqual(at);
    for (let t = 0; t < B.RESPAWN_WAIT + 1; t += 0.5) b.tick(0.5);
    s.helm.put('F');
    for (let t = 0; t < 3; t += 0.1) b.tick(0.1);
    expect(s.helm.pose).not.toEqual(at);
    // (a frigate lying off a ship in the safe zone: her broadside goes through her; and from in it, no broadside at all)
    const f = frigate(b, 'crimson'), o = sloop(b, 'gold');
    clearAway(b, [f, o]);
    f.helm.moor({ c: 6, r: 2 + 6, d: 0 }); o.helm.moor({ c: 8, r: 2, d: 0 }); b.notice();
    expect(b.safe(o)).toBe(true);
    expect(b.aim(f.id, 'R').some((x) => x.what?.what === 'ship')).toBe(false);
    f.helm.moor({ c: 6, r: 2, d: 0 }); b.notice();
    expect(b.fire(f.id, 'R')).toBeNull();
  });
  it('only a frigate\'s large guns hurt a gate\'s towers', () => {
    const b = new Blockade(), f = frigate(b), berth = bombardBerths(b, f)[0];
    expect(berth).toBeTruthy();
    f.helm.moor(berth.pose);
    expect(b.fire(f.id, berth.side)!.shots.some((x) => x.got === 'hit')).toBe(true);
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
  it('a gun paints a target on the square of the nearest ship in its reach and fires on it, the shot GATE_AIM coming down: lying still, she\'s hit (15 Nov: "paint a target on a square and then just take quite a while to fire")', () => {
    const b = new Blockade(), s = sloop(b, 'crimson'), gun = b.battery[0];   // (Dalnoth's, under Dachimpy's guns at the south gate: a gun fires on the other side only)
    b.ships.filter((x) => x !== s).forEach((x, i) => x.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
    s.helm.moor({ c: gun.at[0], r: gun.at[1] - 2, d: 1 }); b.notice();
    let fired: { to: [number, number]; secs: number } | null = null, t = 0;
    for (; t < 1 && !fired; t += 0.1) { const e = b.tick(0.1).guns.find((x) => x.gun === 0 && x.e.kind === 'fire'); if (e && e.e.kind === 'fire') fired = e.e; }
    expect(fired).not.toBeNull();
    expect(fired!.to).toEqual([s.helm.pose.c, s.helm.pose.r]);
    expect(fired!.secs).toBe(B.GATE_AIM);
    expect(b.gunOn[0]).toBe(s.id);
    let hit = false;
    for (let u = 0; u < B.GATE_AIM + 0.3 && !hit; u += 0.1) hit = b.tick(0.1).guns.some((x) => x.gun === 0 && x.e.kind === 'land' && x.hit === s.id);
    expect(hit).toBe(true);
  });
  it('a sloop that moves off the painted square before the shot comes down is missed: keep moving and the guns can\'t touch her (15 Nov: "it\'s clear that a sloop will move quickly before it shoots")', () => {
    const b = new Blockade(), s = sloop(b, 'crimson'), gun = b.battery[0];
    b.ships.filter((x) => x !== s).forEach((x, i) => x.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
    s.helm.moor({ c: gun.at[0], r: gun.at[1] - 2, d: 1 }); b.notice();
    let fired = false;
    for (let t = 0; t < 1 && !fired; t += 0.1) fired = b.tick(0.1).guns.some((x) => x.gun === 0 && x.e.kind === 'fire');
    expect(fired).toBe(true);
    // (a square along, well inside the time a sloop's move takes)
    s.helm.moor({ c: s.helm.pose.c + 1, r: s.helm.pose.r, d: 1 }); b.notice();
    let landed = false, hit = false;
    for (let u = 0; u < B.GATE_AIM + 0.3 && !landed; u += 0.1) for (const x of b.tick(0.1).guns) if (x.gun === 0 && x.e.kind === 'land') { landed = true; hit = x.hit === s.id; }
    expect(landed).toBe(true);
    expect(hit).toBe(false);
    expect(B.GATE_AIM).toBeGreaterThan(SLOOP_HANDLING.move * 1.5);
    expect(B.GATE_AIM).toBeLessThan(FRIGATE_HANDLING.move);
  });
});

describe('a sinking blockade (15 Nov: "that sense of working your way back in would be lost if you can\'t [sink] at all")', () => {
  const knockOut = (b: Blockade, s: ReturnType<typeof frigate>) => { while (!s.dmg.out) s.dmg.hit('large', 0, 'L'); s.helm.hit(); };
  it('a frigate knocked out and shot on sinks: off the board, in nobody\'s way, no influence, no guns, till she comes back where she came in', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), g = frigate(b, 'gold');
    // (the two out on open water, the gold frigate's broadside on her)
    b.ships.filter((s) => s !== f && s !== g).forEach((s, i) => s.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
    g.helm.moor({ c: 13, r: 16, d: 1 }); f.helm.moor({ c: 13, r: 20, d: 1 }); b.notice();
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
  it('someone lying on each of her entries: she waits till they\'ve gone', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), other = frigate(b, 'gold'), third = b.ships.filter((s) => s.kind === 'frigate' && s.team === 'gold')[1];
    b.sink(f);
    // (a frigate has two, one each end of the board, 15 Nov: "Ocean Island matters for the [war frigs] as well")
    expect(f.entries).toHaveLength(2);
    other.helm.moor(f.entries[0]); third.helm.moor(f.entries[1]); b.notice();
    for (let t = 0; t < B.RETURN + 5; t += 0.5) expect(b.tick(0.5).returned).not.toContain(f.id);
    other.helm.moor({ c: 13, r: 16, d: 1 }); b.notice();
    let back = false;
    for (let t = 0; t < 2 && !back; t += 0.5) back = b.tick(0.5).returned.includes(f.id);
    expect(back).toBe(true);
  });
  it('a bot fires on an enemy who\'s knocked out, to sink her; and leaves her be once she\'s gone', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), g = frigate(b, 'gold');
    b.ships.filter((s) => s !== f && s !== g).forEach((s, i) => s.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
    g.helm.moor({ c: 13, r: 16, d: 1 }); f.helm.moor({ c: 13, r: 20, d: 1 }); b.notice();
    knockOut(b, f);
    const bot = botFor(b, g.id, dice(2));
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
    const camp = orderAt(b, f, 24, 24)!;
    expect(camp.kind).toBe('camp');
    if (camp.kind === 'camp') expect(b.rocks.has(`${camp.at[0]},${camp.at[1]}`)).toBe(false);
    expect(orderText(b, { kind: 'hold', buoy: 0 })).toBe('hold the four-pennant buoy in the heart');
  });

  it('the bots carry their orders out: a frigate to the far gate, not her nearest; a sloop to camp where she\'s told and stay; a sloop to hold a far buoy', () => {
    const b = new Blockade(), bots = new Bots(b, [], dice(4)), f = frigate(b), sl = sloop(b), other = b.ships.find((x) => x.team === 'gold' && x.kind === 'sloop' && x !== sl && !x.raider)!;
    bots.order(f.id, { kind: 'gate', g: 1 });
    // (her camp out on the open sea; a lagoon's buoy)
    bots.order(sl.id, { kind: 'camp', at: [16, 17] });
    bots.order(other.id, { kind: 'hold', buoy: 6 });
    for (let i = 0; i < 2; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    const goal = (id: number) => bots.bots.find((x) => x.id === id)!.goal;
    expect(goal(f.id)).toMatchObject({ kind: 'gate', g: 1 });
    let camped = 0, held = 0;
    for (let i = 0; i < 900; i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      // (on it a good while of the last minute: a lagoon's, not the buoy off a gate, under its guns since 15 Nov; a minute,
      // not half, since 16 Nov: sunk there, she can come back by the far edge and have the board to cross)
      if (i >= 300 && (b.reaches(other, B.BUOYS[6]) || other.away > 0)) held++;
      if (i > 600 && sl.away <= 0 && !sl.dmg.out && squares(sl.h, sl.helm.pose).some(([c, r]) => c === 16 && r === 17)) camped++;
    }
    expect(camped).toBeGreaterThan(100);
    expect(held).toBeGreaterThan(60);
    expect(bots.doing(b, sl.id)).toMatch(/camp|knocked|sunk/);
  }, 60000);

  it('hunting: after that enemy, broadside on (a sloop after a frigate, off her end); escorting: off her friend\'s side', () => {
    const b = new Blockade(), bots = new Bots(b, [], dice(4)), f = frigate(b), foe = frigate(b, 'crimson');
    const sl = b.ships.find((x) => x.team === 'gold' && x.kind === 'sloop' && !x.raider)!;
    // (her prey out of the safe zone round the edge, where she came in: there's no fighting in it)
    foe.helm.moor({ c: 30, r: 38, d: 2 }); b.notice();
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
    b.ships.filter((s) => s !== raider && s !== foe).forEach((s, i) => s.helm.moor({ c: 36 + (i % 8), r: 36 + Math.floor(i / 8) * 3, d: 1 }));
    foe.helm.moor({ c: 14, r: 16, d: 1 });
    raider.helm.moor({ c: 8, r: 19, d: 1 });
    b.notice();
    const bot = botFor(b, raider.id, dice(3));
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
    let moved = false, holed = [false, false];
    // (till one's sunk, both at it the whole while: full damage sinks her at once since 15 Nov)
    for (let i = 0; i < 900 && !duel.some((id) => b.ship(id).away > 0); i++) {
      bots.tick(b, 0.1); b.tick(0.1);
      if (duel.some((id, k) => JSON.stringify(b.ship(id).helm.pose) !== JSON.stringify(start[k]))) moved = true;
      duel.forEach((id, k) => { if (b.ship(id).dmg.holes.length) holed[k] = true; });
      if (i > 20 && i % 10 === 0) for (const id of duel) if (b.ship(id).away <= 0) expect(bots.doing(b, id), b.ship(id).name).toMatch(/fighting/);
    }
    expect(duel.some((id) => b.ship(id).away > 0)).toBe(true);
    expect(moved).toBe(true);
    expect(holed).toEqual([true, true]);
  });
});

describe('the bots, a whole round (15 Nov: "you should see sloops hiding out, sometimes coming out ... while [war frigs] are having a fight to land a few pot shots")', () => {
  it('sloops in by the side ways first; frigates fight, shoot a gate down and get in; sloops raid, are knocked out and rebuilt, and never hide; ships sink and come back; both sides score', () => {
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
    for (const k of ['raided', 'fought', 'outs', 'sunk', 'back', 'launched', 'rammed', 'faded'] as const) expect(log[k], k).toBeGreaterThan(0);
    // (nobody hides: the user, 15 Nov, "you never hide. There\'s just no tactical reason or benefit to. You lose coverage of points")
    expect(log.hid).toBe(0);
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
    t.helm.moor({ c: 26, r: 12, d: 1 }); g.helm.moor({ c: 30, r: 34, d: 3 }); b.notice();
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
    t.helm.moor({ c: 26, r: 12, d: 1 }); f.helm.moor({ c: 32, r: 15, d: 1 }); b.notice();
    const [turtle] = b.launch(t.id), x = b.ship(turtle);
    for (const c of b.craftOf(t)) if (c !== x) c.helm.moor({ c: 46, r: 36 + (c.id % 3), d: 1 });
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
    f.helm.moor({ c: 46, r: 26, d: 1 }); sl.helm.moor({ c: x.helm.pose.c + 1, r: x.helm.pose.r, d: 1 }); b.notice();
    let onSloop = 0;
    for (let i = 0; i < 60 && !onSloop; i++) onSloop = b.tick(0.1).rams.filter((r) => r.on === sl.id).length;
    expect(onSloop).toBe(1);
  });
  it('a phantom sloop: no shot ever hits her, and she holds no buoy; nor does a turtle (15 Nov: "they don\'t take damage. Like, you really can\'t shoot them")', () => {
    const b = new Blockade(), t = brig(b, 'gold'), g = brig(b, 'crimson'), f = frigate(b, 'gold');
    clearAway(b, [t, g, f]);
    t.helm.moor({ c: 26, r: 12, d: 1 }); g.helm.moor({ c: 30, r: 36, d: 1 }); f.helm.moor({ c: 26, r: 16, d: 1 }); b.notice();
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
    t.helm.moor({ c: 26, r: 12, d: 1 }); f.helm.moor({ c: 26, r: 16, d: 1 }); b.notice();
    const [a, z] = b.launch(t.id).map((id) => b.ship(id));
    // (one turtle lying under the frigate's broadside, the others well away from it)
    a.helm.moor({ c: f.helm.pose.c - 1, r: Math.max(...squares(f.h, f.helm.pose).map(([, r]) => r)) + 2, d: 1 });
    z.helm.moor({ c: 46, r: 9, d: 1 });
    for (const x of b.craftOf(t)) if (x !== a && x !== z) x.helm.moor({ c: 46, r: 12, d: 1 });
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
    t.helm.moor({ c: 26, r: 12, d: 1 }); b.notice();
    expect(b.anchored(t)).toBe(false);
    expect(b.launch(t.id).length).toBeGreaterThan(0);
    expect(b.anchored(t)).toBe(true);
    expect(b.put(t.id, 'F')).toBe(false);
    expect(b.drop(t.id, 36, 12)).toBeNull();
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
    t.helm.moor({ c: 26, r: 12, d: 1 }); f.helm.moor({ c: 32, r: 16, d: 1 }); sl.helm.moor({ c: 29, r: 14, d: 1 }); b.notice();
    const bots = new Bots(b, b.ships.filter((s) => s !== t && !s.craft).map((s) => s.id), dice(3));
    for (let i = 0; i < 30; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    expect(b.anchored(t)).toBe(false);
    // (the sloop gone off: she launches, and anchors)
    sl.helm.moor({ c: 46, r: 36, d: 1 }); b.notice();
    for (let i = 0; i < 30 && !b.anchored(t); i++) { bots.tick(b, 0.1); b.tick(0.1); }
    expect(b.anchored(t)).toBe(true);
  });
  it('a brig\'s bot launches her craft when an enemy frigate\'s near, and her turtles ram her', () => {
    const b = new Blockade(), t = brig(b, 'gold'), f = frigate(b, 'crimson');
    clearAway(b, [t, f]);
    t.helm.moor({ c: 26, r: 12, d: 1 }); f.helm.moor({ c: 32, r: 15, d: 1 }); b.notice();
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
    for (const f of b.ships.filter((s) => s.kind === 'frigate')) for (const [c, r] of [[27, 15], [28, 32], [12, 14], [44, 34]] as [number, number][]) {
      expect(f.sea.plotPast(f.helm.pose, c, r), `${f.name} to ${c},${r}`).not.toBeNull();
    }
  });
});

describe('dip, duck and dodge (15 Nov: "in the open water, it would be suicide, but in there are ways to dip and dodge")', () => {
  /** The squares a frigate's loaded broadsides reach, from where she lies and where the move she's on leaves her. */
  const reach = (b: Blockade, f: ReturnType<typeof frigate>) => {
    const out = new Set<string>();
    for (const at of [f.helm.pose, f.helm.after()]) for (const side of ['L', 'R'] as const) for (const x of b.aim(f.id, side, at, false)) for (const [c, r] of x.cells) out.add(`${c},${r}`);
    return out;
  };
  it('a sloop in an enemy frigate\'s broadside gets out of it before it bears, and fires as she goes', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), sl = sloop(b, 'gold');
    clearAway(b, [f, sl]);
    f.helm.moor({ c: 26, r: 12, d: 1 }); b.notice();
    // (two squares off her side, square in her broadside)
    const [c, r] = [...reach(b, f)].map((k) => k.split(',').map(Number)).find(([x, y]) => x === 26)!;
    sl.helm.moor({ c, r, d: 0 }); b.notice();
    expect(reach(b, f).has(`${sl.helm.pose.c},${sl.helm.pose.r}`)).toBe(true);
    const bot = botFor(b, sl.id, dice(1));
    for (let i = 0; i < 25; i++) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(reach(b, f).has(`${sl.helm.pose.c},${sl.helm.pose.r}`)).toBe(false);
  });
  it('she ducks behind a rock if one\'s near: her shot stops on it', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), sl = sloop(b, 'gold');
    clearAway(b, [f, sl]);
    // (the frigate on open water south of the fort, a rock by the sloop, the rock square off her side)
    f.helm.moor({ c: 27, r: 7, d: 1 }); b.notice();
    expect(b.rocks.has('27,10')).toBe(true);
    sl.helm.moor({ c: 26, r: 10, d: 0 }); b.notice();
    const bot = botFor(b, sl.id, dice(1));
    let safe = false;
    for (let i = 0; i < 30 && !safe; i++) { bot.tick(b, 0.1); b.tick(0.1); safe = !reach(b, f).has(`${sl.helm.pose.c},${sl.helm.pose.r}`); }
    expect(safe).toBe(true);
  });
});

describe('playing for the points (15 Nov: "people aren\'t really paying attention to the points. They\'re just going off and starting a few fights ... I just want to see the war brigs camping out there more and sending in the turtles")', () => {
  /** A gate's tower shot down, as a frigate's broadsides leave it: its squares open water. */
  const crumble = (b: Blockade, g: number, i: number) => {
    const t = b.gates[g].towers[i];
    while (t.hp > 0) t.hit('large');
    for (const [c, r] of t.squares) b.rocks.delete(`${c},${r}`);
    for (const o of b.ships) o.sea.touch();
  };
  it('a frigate goes in through a gate shot open to the prize, not lying on the buoy in front of it', () => {
    const b = new Blockade(), f = frigate(b);
    clearAway(b, [f]);
    crumble(b, 0, 1);
    b.battery.forEach((x) => { x.wrecked = true; });
    const bot = botFor(b, f.id, dice(3));
    let t = 0;
    for (; t < 60 && !b.reaches(f, B.BUOYS[0]); t += 0.1) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(b.reaches(f, B.BUOYS[0])).toBe(true);
  });
  it('a frigate holding the prize keeps it: a sloop out of her reach is left be', () => {
    const b = new Blockade(), f = frigate(b), sl = sloop(b, 'crimson');
    clearAway(b, [f, sl]);
    f.helm.moor({ c: 27, r: 23, d: 1 });
    sl.helm.moor({ c: 27, r: 31, d: 1 }); b.notice();
    expect(b.reaches(f, B.BUOYS[0])).toBe(true);
    const bot = botFor(b, f.id, dice(5));
    for (let t = 0; t < 15; t += 0.1) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(b.reaches(f, B.BUOYS[0])).toBe(true);
  });
  it('a brig, with an enemy frigate camped in the heart, makes for her lagoon\'s corner by the wind\'s gap into it, anchors there and launches', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b, 'crimson');
    clearAway(b, [br, f]);
    f.helm.moor({ c: 27, r: 23, d: 1 }); b.notice();
    const bot = botFor(b, br.id, dice(7));
    for (let t = 0; t < 90 && !b.anchored(br); t += 0.1) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(b.anchored(br)).toBe(true);
    // (inside the west lagoon, its side nearest the fort)
    const reef = B.REEFS[0], p = br.helm.pose;
    expect(Math.max(Math.abs(p.c - reef.at[0]), Math.abs(p.r - reef.at[1]))).toBeLessThan(reef.ring);
    expect(p.c).toBeGreaterThan(reef.at[0]);
  });
  it('a turtle goes for a frigate lying still before a sloop on the move nearer her', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b, 'crimson'), sl = sloop(b, 'crimson');
    clearAway(b, [br, f, sl]);
    br.helm.moor({ c: 14, r: 24, d: 1 }); f.helm.moor({ c: 24, r: 24, d: 0 }); sl.helm.moor({ c: 18, r: 24, d: 0 }); b.notice();
    expect(b.launch(br.id)).toBeTruthy();
    const turtle = b.ships.find((s) => s.craft?.kind === 'ram' && s.team === 'gold' && s.away <= 0)!;
    const bot = botFor(b, turtle.id, dice(9));
    b.still.set(f.id, 5); b.still.set(sl.id, 0);
    bot.tick(b, 5);
    expect(bot.goal?.kind === 'ram' && bot.goal.on).toBe(f.id);
  });
});

describe('playing a brig (15 Nov: "Are they expected to go on autopilot and you control one of them? ... you can choose which one you\'re controlling, and the others go on autopilot")', () => {
  it('a brig\'s helm moves between her and each of her craft out on the sea, her first; anyone else\'s is hers alone', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b);
    expect(b.fleet(br.id)).toEqual([br.id]);
    expect(b.fleet(f.id)).toEqual([f.id]);
    const ids = b.launch(br.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(b.fleet(br.id)).toEqual([br.id, ...ids]);
    // (from one of her craft, the same: her brig first)
    expect(b.fleet(ids[1])).toEqual([br.id, ...ids]);
  });
  it('a craft gone home is off the list', () => {
    const b = new Blockade(), br = brig(b);
    const ids = b.launch(br.id);
    expect(b.weighAnchor(br.id)).toBeTruthy();
    for (let t = 0; t < B.LAUNCH.WEIGH + 1; t += 0.1) b.tick(0.1);
    expect(b.fleet(br.id)).toEqual([br.id]);
    expect(ids.every((id) => b.ship(id).away > 0)).toBe(true);
  });
});

describe('island side and ocean side (15 Nov: "for the smaller ships, they should ... be able to spawn ... on any side that they want to ... that\'s probably what\'s creating this one-sided thing where brigs are quite safe")', () => {
  it('each side\'s sloops and brigs start on both side edges, a brig on each; its frigates on their own edge', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) {
      const small = b.ships.filter((s) => s.team === team && !s.craft && s.kind !== 'frigate');
      const west = small.filter((s) => s.helm.pose.c <= 2), east = small.filter((s) => s.helm.pose.c >= B.COLS - 3);
      expect(west.length + east.length).toBe(small.length);
      expect(west.some((s) => s.kind === 'brig') && east.some((s) => s.kind === 'brig')).toBe(true);
      expect(west.filter((s) => s.kind === 'sloop').length).toBeGreaterThan(0);
      expect(east.filter((s) => s.kind === 'sloop').length).toBeGreaterThan(0);
      // (its frigates on their own end, facing their gate, with an entry at the other end too, by the other gate: 15 Nov)
      for (const f of b.ships.filter((s) => s.team === team && s.kind === 'frigate')) { expect(f.entries).toHaveLength(2); expect(f.entries[1].r > B.ROWS / 2).toBe(f.entries[0].r < B.ROWS / 2); }
    }
  });
  it('a sloop sunk comes back in by the other side\'s edge, then her own again', () => {
    const b = new Blockade(), sl = sloop(b), was = sl.helm.pose.c;
    b.sink(sl);
    for (let t = 0; t <= B.RETURN + 1 && sl.away > 0; t += 0.5) b.tick(0.5);
    expect(sl.away).toBe(0);
    expect(Math.abs(sl.helm.pose.c - was)).toBeGreaterThan(B.COLS / 2);
    b.sink(sl);
    for (let t = 0; t <= B.RETURN + 1 && sl.away > 0; t += 0.5) b.tick(0.5);
    expect(sl.helm.pose.c).toBe(was);
  });
});

describe('nobody off in a corner (15 Nov: "three sloops, two of which are repairing, like really right on the corner of the map ... there should be no reason for them to really be venturing over there")', () => {
  it('a sloop hides to be patched only inside a lagoon\'s reef', () => {
    const b = new Blockade();
    for (const team of ['gold', 'crimson'] as const) for (const [c, r] of b.coves(team)) expect(B.REEFS.some((x) => Math.max(Math.abs(c - x.at[0]), Math.abs(r - x.at[1])) < x.ring)).toBe(true);
  });
  it('a frigate leaves be a sloop sheltering in a lagoon, close as she is', () => {
    const b = new Blockade(), f = frigate(b, 'crimson'), sl = sloop(b, 'gold');
    clearAway(b, [f, sl]);
    const reef = B.REEFS[0];
    sl.helm.moor({ c: reef.hide[0], r: reef.hide[1], d: 1 });
    f.helm.moor({ c: reef.at[0] + reef.ring + reef.shoal + 2, r: reef.at[1] - 5, d: 0 }); b.notice();
    expect(b.sheltered(sl)).toBe(true);
    const bot = botFor(b, f.id, dice(2));
    for (let t = 0; t < 8; t += 0.1) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(bot.goal?.kind === 'fight' && bot.goal.on === sl.id).toBe(false);
  });
});

describe('turtles get to their frigates (15 Nov: 3 or 4 rams on frigates a game after the bigger board, "Yes, dig in")', () => {
  it('a turtle goes for a frigate lying still before a sloop lying still nearer her: the frigate\'s worth more', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b, 'crimson'), sl = sloop(b, 'crimson');
    clearAway(b, [br, f, sl]);
    br.helm.moor({ c: 14, r: 12, d: 1 }); f.helm.moor({ c: 26, r: 12, d: 0 }); sl.helm.moor({ c: 19, r: 12, d: 0 }); b.notice();
    expect(b.launch(br.id)).toBeTruthy();
    const turtle = b.ships.find((s) => s.craft?.kind === 'ram' && s.team === 'gold' && s.away <= 0)!;
    const bot = botFor(b, turtle.id, dice(9));
    b.still.set(f.id, 5); b.still.set(sl.id, 5);
    bot.tick(b, 0.1);
    expect(bot.goal?.kind === 'ram' && bot.goal.on).toBe(f.id);
  });
  it('one launched at a frigate lying still sixteen squares off on open water rams her inside her time', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b, 'crimson');
    clearAway(b, [br, f]);
    br.helm.moor({ c: 8, r: 6, d: 1 }); f.helm.moor({ c: 25, r: 6, d: 0 }); b.notice();
    const [id] = b.launch(br.id), bot = botFor(b, id, dice(3));
    let at = -1;
    for (let t = 0; t < B.LAUNCH.LIFE.ram && at < 0; t += 0.1) { bot.tick(b, 0.1); const ev = b.tick(0.1); b.still.set(f.id, 9); if (ev.rams.some((r) => r.ram === id)) at = t; }
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(B.LAUNCH.LIFE.ram * 0.75);
  });
});

describe('nobody hangs about under the gate guns (15 Nov: "a lot of foolish ships just hanging out when there are cannons shooting at them ... more of an incentive to destroy these cannons for the war frigates")', () => {
  it('a frigate a gate\'s guns are firing on goes to wreck them', () => {
    const b = new Blockade(), f = frigate(b, 'crimson');   // (Dalnoth's, off Dachimpy's gate)
    clearAway(b, [f]);
    // (lying off the south gate, in its guns' reach)
    f.helm.moor({ c: 22, r: 14, d: 1 }); b.notice();
    let fired = false;
    for (let t = 0; t < 4 && !fired; t += 0.1) fired = b.tick(0.1).guns.some((x) => x.e.kind === 'fire' && b.gunOn[x.gun] === f.id);
    expect(fired).toBe(true);
    const bot = botFor(b, f.id, dice(2));
    bot.tick(b, 4);
    expect(bot.goal?.kind).toBe('guns');
  });
  it('a sloop on a square a gate gun has painted is off it before the shot lands', () => {
    const b = new Blockade(), sl = sloop(b, 'crimson');
    clearAway(b, [sl]);
    sl.helm.moor({ c: 22, r: 15, d: 1 }); b.notice();
    let painted: [number, number] | null = null;
    for (let t = 0; t < 4 && !painted; t += 0.1) { const e = b.tick(0.1).guns.find((x) => x.e.kind === 'fire'); if (e && e.e.kind === 'fire') painted = e.e.to; }
    expect(painted).toEqual([sl.helm.pose.c, sl.helm.pose.r]);
    const bot = botFor(b, sl.id, dice(2));
    let hit = false;
    for (let t = 0; t < B.GATE_AIM + 0.5; t += 0.1) { bot.tick(b, 0.1); hit = b.tick(0.1).guns.some((x) => x.hit === sl.id) || hit; }
    expect(hit).toBe(false);
  });
});

describe('the gate guns have a side (15 Nov: "it\'s for everybody\'s gain to destroy them ... Hence the dilemma. The turrets need to have a side ... more of an incentive to destroy the other team\'s turrets")', () => {
  it('each gate\'s guns are the side\'s whose frigates come in at that end, and fire on the other side\'s ships only', () => {
    expect(B.GATES.map((g) => g.side)).toEqual(['gold', 'crimson']);
    for (const team of ['gold', 'crimson'] as const) {
      const b = new Blockade(), s = sloop(b, team);
      clearAway(b, [s]);
      s.helm.moor({ c: 28, r: 15, d: 1 }); b.notice();
      let fired = false;
      for (let t = 0; t < 5 && !fired; t += 0.1) fired = b.tick(0.1).guns.some((x) => x.e.kind === 'fire');
      expect(fired, team).toBe(team === 'crimson');
    }
  });
  it('a frigate goes to wreck the other side\'s guns, never her own', () => {
    const b = new Blockade(), f = frigate(b);
    clearAway(b, [f]);
    f.helm.moor({ c: 22, r: 14, d: 1 }); b.notice();
    const bot = botFor(b, f.id, dice(2));
    for (let t = 0; t < 6; t += 0.1) { bot.tick(b, 0.1); b.tick(0.1); }
    expect(bot.goal?.kind === 'guns' && BLOCKADE.GATES[bot.goal.g].side).not.toBe('gold');
  });
});

describe('a brig\'s craft clear the enemy\'s gate guns, her standoff work (16 Nov: "the turtles and [ghost sloops] ... as good tactical options to clear out the cannon placements. Maybe it should still need a few rounds, so you\'d lose some turtles ... they\'re the standoff hunters")', () => {
  it('a turtle beside a gate gun of the other side\'s rams it, a hit to its wrecking that doesn\'t quieten it: it fires on her; her own side\'s she leaves', () => {
    const b = new Blockade(), br = brig(b, 'gold');
    clearAway(b, [br]);
    br.helm.moor({ c: 14, r: 24, d: 1 }); b.notice();
    const [id] = b.launch(br.id), x = b.ship(id);
    for (const c of b.craftOf(br)) if (c !== x) c.helm.moor({ c: 46, r: 36 + (c.id % 3), d: 1 });
    const g = B.GATES.findIndex((z) => z.side === 'crimson'), gi = b.battery.findIndex((_, i) => b.gunGate[i] === g), gun = b.battery[gi];
    x.helm.moor({ c: gun.at[0], r: gun.at[1] + 1, d: 1 }); b.notice();
    let rams: ReturnType<Blockade['tick']>['rams'] = [], firedOnHer = false;
    for (let i = 0; i < 80 && !(rams.length && firedOnHer); i++) {
      const ev = b.tick(0.1);
      if (!rams.length) rams = ev.rams;
      if (ev.guns.some((e) => e.e.kind === 'fire' && e.e.to[0] === x.helm.pose.c && e.e.to[1] === x.helm.pose.r)) firedOnHer = true;
    }
    expect(rams[0]?.gun).toBe(gi);
    expect(gun.hits).toBeGreaterThan(0);
    expect(firedOnHer).toBe(true);
    // (a gold gun beside her: she leaves it be)
    const own = b.battery.findIndex((_, i) => b.gunSide[i] === 'gold');
    x.helm.moor({ c: b.battery[own].at[0], r: b.battery[own].at[1] - 1, d: 1 }); b.notice();
    for (let i = 0; i < 60; i++) expect(b.tick(0.1).rams).toHaveLength(0);
    expect(b.battery[own].hits).toBe(0);
  });
  it('a brig\'s bot launches at the enemy\'s gate guns in reach of her spot, no frigate near, and her turtles go for them', () => {
    const b = new Blockade(), br = brig(b, 'gold');
    clearAway(b, [br]);
    const bots = new Bots(b, [], dice(4)), bot = bots.bots.find((z) => z.id === br.id)!;
    // (by the west lagoon, the fort's side of it: no enemy frigate about, so anywhere's her spot)
    br.helm.moor({ c: 14, r: 24, d: 1 }); b.notice();
    let launched = 0;
    for (let i = 0; i < 40 && !launched; i++) { bots.tick(b, 0.1); b.tick(0.1); launched += b.launches.splice(0).length; }
    expect(launched).toBe(1);
    for (let i = 0; i < 20; i++) { bots.tick(b, 0.1); b.tick(0.1); }
    const after = b.craftOf(br).filter((z) => z.away <= 0).map((z) => bots.bots.find((q) => q.id === z.id)!.goal);
    expect(after.some((goal) => goal?.kind === 'ram' && goal.gun !== undefined && b.gunSide[goal.gun] === 'crimson')).toBe(true);
  });
});

describe('a turtle rams a frigate where her broadsides don\'t bear (16 Nov: "turtles approach from the front ... and they start ... going to the war frigate\'s side, getting predictably shot and sunk, instead of ... ramming it from the front. That\'s what they were designed to do")', () => {
  it('coming at her bow, a turtle makes for the square just past her bow, not round to her side', () => {
    const b = new Blockade(), br = brig(b), f = frigate(b, 'crimson');
    clearAway(b, [br, f]);
    // (the frigate heading north-east up the board on open water, the turtle a few squares ahead of her)
    br.helm.moor({ c: 14, r: 40, d: 1 }); f.helm.moor({ c: 24, r: 38, d: 0 }); b.notice();
    const [id] = b.launch(br.id), x = b.ship(id);
    for (const c of b.craftOf(br)) if (c !== x) c.helm.moor({ c: 46, r: 30 + (c.id % 3), d: 1 });
    const hers = squares(f.h, f.helm.pose), bowR = Math.max(...hers.map(([, r]) => r)), cols = hers.map(([c]) => c);
    x.helm.moor({ c: 24, r: Math.min(B.ROWS - 2, bowR + 4), d: 2 }); b.notice();
    b.still.set(f.id, 5);
    const bot = botFor(b, id, dice(9));
    bot.tick(b, 5);
    expect(bot.goal?.kind === 'ram' && bot.goal.on).toBe(f.id);
    const at = bot.goal?.kind === 'ram' ? bot.goal.at : [0, 0];
    expect(at[1]).toBe(bowR + 1);
    expect(at[0]).toBeGreaterThanOrEqual(Math.min(...cols));
    expect(at[0]).toBeLessThanOrEqual(Math.max(...cols));
  });
});
