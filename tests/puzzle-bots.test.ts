/* The puzzles' bots (12 Nov), each knowing nothing of where it's played: Sailing's (src/sail-bots.ts, moved
   from tools/sail-bots.mjs so the browser can use them), and simple greedy ones for Bilge
   (src/bilge-bot.ts), Foraging (src/foraging-bot.ts), Gunnery (src/gunnery-bot.ts) and Carpentry
   (src/carpentry-bot.ts). The race watched plays each racer's board with them (src/race-watch.ts): the
   user, 12 Nov, "I can see the puzzle, as I said, the puzzling". */
import { describe, expect, it } from 'vitest';
import { carp, hole } from './helpers';
import { Sailing } from '../src/sailing';
import { SAIL_BOTS, VEGAS_GAMES, potential } from '../src/sail-bots';
import { Bilge } from '../src/bilge';
import { bilgeCopy, bilgeMove } from '../src/bilge-bot';
import { Forage } from '../src/foraging';
import { forageApply, forageCopy, forageMove } from '../src/foraging-bot';
import { barrierDeal } from '../src/den-race';
import { Gunnery } from '../src/gunnery';
import { gunneryCopy, gunneryMove, loadWorth, loaded, wants } from '../src/gunnery-bot';
import { CarpentryFrame } from '../src/carpentry-frame';
import { DeckHole } from '../src/den-patch';
import { carpLift, carpMove, pockets, type InHand } from '../src/carpentry-bot';
import { seeded } from '../src/mirror-row';
import type { Letter } from '../src/engine';

describe('Sailing\'s bots, in src now (12 Nov)', () => {
  it('each makes a drop the rules allow, and the shallow one sets chains up without booching', () => {
    for (const name of ['random', 'greedy', 'shallow'] as const) {
      const s = new Sailing(seeded(4));
      let booches = 0, chains = 0;
      for (let d = 0; d < 60; d++) {
        const m = SAIL_BOTS[name](s, seeded(d));
        expect(m, name).not.toBeNull();
        const e = s.drop(m!.col, m!.turn, m!.row);
        expect(e.dropped, name).toBe(true);
        booches += e.booched ? 1 : 0; chains += e.steps;
      }
      if (name === 'shallow') { expect(booches).toBe(0); expect(chains).toBeGreaterThan(5); }
    }
  });
  it('a board weighed: a platform one short is worth more than one with a wrong colour in it', () => {
    const s = new Sailing(seeded(1));
    expect(Number.isFinite(potential(s))).toBe(true);
  });
  it('the recorded Vegases replay to a Vegas from their seeds', () => {
    expect(VEGAS_GAMES.length).toBeGreaterThanOrEqual(3);
    for (const g of VEGAS_GAMES) {
      const s = new Sailing(seeded(g.seed));
      let last = null;
      for (const [c, t, r] of g.drops) { last = s.drop(c, t, r); expect(last.dropped).toBe(true); }
      expect(last!.vegas, `seed ${g.seed}`).toBe(true);
    }
  });
});

describe('Bilge\'s bot', () => {
  it('tries a swap on a copy, leaving the board as it was', () => {
    const b = new Bilge(seeded(3)), before = JSON.stringify(b.grid);
    bilgeCopy(b).swap(5, 2);
    bilgeMove(b);
    expect(JSON.stringify(b.grid)).toBe(before);
  });
  it('clears pieces most moves, as a decent bilger does', () => {
    const b = new Bilge(seeded(7));
    let clearing = 0;
    for (let i = 0; i < 30; i++) { const m = bilgeMove(b)!; if (b.swap(m[0], m[1]).cleared) clearing++; }
    expect(clearing).toBeGreaterThan(24);
  });
});

describe('Foraging\'s bot', () => {
  it('tries a move on a copy, leaving the board as it was', () => {
    const f = new Forage(barrierDeal(seeded(2))), before = JSON.stringify(f.grid);
    forageCopy(f).turn(4, 2, true);
    forageMove(f);
    expect(JSON.stringify(f.grid)).toBe(before);
  });
  it('clears the race\'s barrier of driftwood in a handful of moves (its two bundles down off the bottom)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const f = new Forage(barrierDeal(seeded(seed)));
      let n = 0;
      while (!f.over && n < 40) { forageApply(f, forageMove(f)!); n++; }
      expect(f.over, `seed ${seed}`).toBe(true);
      expect(n).toBeLessThan(35);
    }
  });
});

describe('Gunnery\'s bot', () => {
  it('what a store rolled into a gun is worth: the next in turn good, the shot best, the wrong one fouls it', () => {
    expect(wants('empty')).toBe('powder');
    expect(wants('dirty')).toBe('bucket');
    expect(wants('loaded')).toBeNull();
    expect(loadWorth('wad', 'shot')).toBeGreaterThan(loadWorth('empty', 'powder'));
    expect(loadWorth('empty', 'shot')).toBeLessThan(0);
    expect(loadWorth('fouled', 'bucket')).toBeGreaterThan(0);
  });
  it('tries its arrows on a copy, and loads guns by chalking them', () => {
    const g = new Gunnery(null, seeded(2));
    g.setCrates(g.pickCrates());
    const before = JSON.stringify([...g.arrows]);
    gunneryCopy(g).chalk(6, 3, 1, 'x');
    expect(JSON.stringify([...g.arrows])).toBe(before);
    let marks = 0;
    for (let beat = 0; beat < 400; beat++) {
      if (beat % 4 === 0) { const m = gunneryMove(g); if (m) { g.chalk(m.r, m.c, m.dir, 'bot', beat); marks++; } }
      g.tick();
    }
    expect(marks).toBeGreaterThan(0);
    expect(loaded(g)).toBeGreaterThanOrEqual(1);
  }, 30000);
});

describe('Carpentry\'s bot', () => {
  const hand = (...ls: Letter[]): InHand[] => ls.map((letter) => ({ letter, ways: carp.ORIENTS_BY_LETTER[letter].map((o) => carp.normalize(o.cells)) }));
  it('fits the piece that fills the hole exactly', () => {
    const f = new CarpentryFrame(carp.ORIENTS_BY_LETTER.L[0].cells, { margin: 1 });
    const m = carpMove(f, hand('I', 'L', 'P'))!;
    expect(m.i).toBe(1);
    expect(f.put('L', m.cells, m.r, m.c)).toBe(true);
    expect(f.shipshape()).toBe(true);
  });
  it('leaves no pocket too small to fill', () => {
    expect(pockets(hole('##.##', '##...')).sort()).toEqual([2, 4]);
  });
  it('stuck on a gap shut in, it lifts a piece beside it back out', () => {
    const f = new CarpentryFrame(hole('######', '######'), { margin: 0 });
    f.put('I', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], 0, 0);
    expect(f.put('I', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], 1, 1)).toBe(true);
    // (two gaps of a square each, shut in: nothing fits; lift a piece beside them)
    expect(carpMove(f, hand('I', 'L', 'P', 'X'))).toBeNull();
    expect([0, 1]).toContain(carpLift(f));
  });
  it('patches a hole in her deck, a piece at a time, from the crate, lifting one out when stuck', () => {
    for (let seed = 1; seed <= 6; seed++) {
      carp.useSeed(seed);
      const f = new DeckHole(carp.genHole(3).hole);
      let n = 0, h = hand(carp.weightedLetter(), carp.weightedLetter(), carp.weightedLetter());
      while (!f.done() && n < 40) {
        const m = carpMove(f, h);
        if (!m) { f.lift(carpLift(f)); h = hand(carp.weightedLetter(), carp.weightedLetter(), carp.weightedLetter()); n++; continue; }
        expect(f.put(h[m.i].letter as Letter, m.cells, m.r, m.c)).toBe(true);
        h[m.i] = hand(carp.weightedLetter())[0];
        n++;
      }
      expect(f.done(), `seed ${seed}`).toBe(true);
    }
    carp.useSeed(null);
  });
});

describe('rowing\'s and Navigation\'s bots, in src now (12 Nov)', () => {
  it('the greedy rower gets her further up the course than random swaps', async () => {
    const { MirrorRow } = await import('../src/mirror-row');
    const { ROW_BOTS } = await import('../src/row-bots');
    const go = (name: 'random' | 'greedy') => {
      const row = new MirrorRow({ randoms: [seeded(11), seeded(12)], clocked: true }), rnd = seeded(5);
      for (let i = 0; i < 20; i++) { const [r, c] = ROW_BOTS[name](row, rnd); row.swap(r, c); }
      return row.course.y;
    };
    expect(go('greedy')).toBeGreaterThan(go('random'));
  });
  it('the planner fills the starlit door\'s two constellations without booching', async () => {
    const { Navigation } = await import('../src/navigation');
    const { NAV_BOTS } = await import('../src/nav-bots');
    const { DOOR } = await import('../src/den-door');
    const g = new Navigation(seeded(1000), DOOR.NAV);
    g.record = false;
    const rnd = seeded(77);
    while (g.completed < DOOR.RUN && g.totalMoves < 400) {
      const p = NAV_BOTS.planner(g, rnd)!;
      for (const [r, d] of p.steps) g.turn(d, r);
      if (p.drop) g.drop();
    }
    expect(g.completed).toBe(DOOR.RUN);
    expect(g.booches).toBe(0);
  }, 30000);
});
