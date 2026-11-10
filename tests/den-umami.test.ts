/* Umami the capybara (src/den-umami.ts): his board in the lagoon, her moorings there, and his life at
   the den. */
import { describe, expect, it } from 'vitest';
import { Forage, H, NO_SPECIALS, SPECIAL_ODDS, SPECIALS, W, seeded } from '../src/foraging';
import type { Bit, Move } from '../src/foraging';
import { FREED, FREED_T, LIFE, UMAMI, Umami, Life, depth, freedAt, umamiDeal } from '../src/den-umami';

const him = (f: Forage) => f.containers().find((x) => x.bit.tag === UMAMI.TAG) ?? null;

/** A copy of a board to try a move on (its new pieces from a source of its own: the bot can't see
    what's coming). */
function copy(f: Forage, seed: number): Forage {
  const g = Object.assign(Object.create(Forage.prototype), f) as Forage;
  return Object.assign(g, { grid: structuredClone(f.grid), cur: { ...f.cur }, random: seeded(seed) });
}

/** Every move there is: each 2x2 turned either way, each special piece used either way. */
function moves(f: Forage): { r: number; c: number; cw: boolean }[] {
  const out: { r: number; c: number; cw: boolean }[] = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const b = f.grid[r][c];
    const ok = (b?.s && b.s !== 'ant') || f.canTurn(r, c);
    if (ok) for (const cw of [false, true]) out.push({ r, c, cw });
  }
  return out;
}
const play = (f: Forage, m: { r: number; c: number; cw: boolean }): Move => { f.cur = { r: m.r, c: m.c }; return f.press(m.cw); };

/** A blunderer: any move at all. */
function blunder(f: Forage, R: () => number): Move | null {
  const all = moves(f);
  return all.length ? play(f, all[Math.floor(R() * all.length)]) : null;
}

const kind = (f: Forage, r: number, c: number) => { const b = f.grid[r]?.[c]; return b && b.k >= 0 ? b.k : -1; };
/** The ids of the pieces under him, in his two columns. */
function under(f: Forage): Set<number> {
  const at = him(f)!, out = new Set<number>();
  for (let r = at.r + 2; r < H; r++) for (const c of [at.c, at.c + 1]) { const b = f.grid[r][c]; if (b) out.add(b.id); }
  return out;
}
/** How near a line through a tile under him is: the most of any three in a row through one that
    match it (3 would clear). */
function near(f: Forage): number {
  const at = him(f)!;
  let best = 0;
  for (let r = at.r + 2; r < H; r++) for (const c of [at.c, at.c + 1]) {
    const k = kind(f, r, c);
    if (k < 0) continue;
    for (const [dr, dc] of [[0, 1], [1, 0]]) for (let s = -2; s <= 0; s++) {
      let n = 0, open = true;
      for (let i = 0; i < 3; i++) {
        const rr = r + (s + i) * dr, cc = c + (s + i) * dc, b = f.grid[rr]?.[cc];
        if (!b || b.box) open = false; else if (kind(f, rr, cc) === k) n++;
      }
      if (open) best = Math.max(best, n);
    }
  }
  return best;
}
/** The moves round him: near enough to matter to what's under him. */
const round = (f: Forage) => { const at = him(f)!; return moves(f).filter((m) => (m.r >= at.r - 3 && Math.abs(m.c - at.c) <= 3) || f.grid[m.r][m.c]?.s); };
/** A rescuer, as a player who's trying: the move that brings him furthest down, then clears most
    under him, then brings a line under him nearest; if none does any of that, a move round him that
    sets up a clear under him the move after; failing that, any move round him. */
function rescue(f: Forage, R: () => number): Move | null {
  if (!him(f)) return null;
  const all = round(f);
  if (!all.length) return blunder(f, R);
  const mine = under(f), base = him(f)!.r * 1e4 + near(f) * 10;
  let best = -1, pick: typeof all = [];
  all.forEach((m, i) => {
    const g = copy(f, i + 1), res = play(g, m), a = him(g);
    const cleared = res.stages.flatMap((s) => s.cleared).filter((id) => mine.has(id)).length;
    const score = !a ? 1e9 : a.r * 1e4 + cleared * 100 + near(g) * 10;
    if (score > best) { best = score; pick = [m]; } else if (score === best) pick.push(m);
  });
  if (best <= base) {
    const local = round(f);
    pick = local.filter((m, i) => {
      const g = copy(f, 500 + i);
      if (play(g, m).left.length || !him(g)) return true;
      const ids = under(g);
      return round(g).some((m2, j) => { const r2 = play(copy(g, 900 + j), m2); return r2.left.length > 0 || r2.stages.some((s) => s.cleared.some((id) => ids.has(id))); });
    });
    if (!pick.length) pick = local;
  }
  return play(f, pick[Math.floor(R() * pick.length)]);
}

/** Play his board: `mistakes` blunders first, then the rescuer, till he's out (or `cap` moves).
    Returns the moves it took, or null if he never got out; and checks every step that he's never
    off his middle columns. */
function free(seed: number, mistakes: number, cap = 400, odds = SPECIAL_ODDS): number | null {
  const R = seeded(seed * 31 + 7), f = new Forage(umamiDeal(seeded(seed), odds));
  for (let n = 0; n < mistakes + cap; n++) {
    const m = n < mistakes ? blunder(f, R) : rescue(f, R);
    if (!m) return null;
    if (m.left.some((l) => l.tag === UMAMI.TAG)) return n + 1;
    const a = him(f);
    expect(a?.c).toBe(UMAMI.AT.c);
  }
  return null;
}

describe('his board', () => {
  it('has him high on the bank, in the middle two columns, as its one container, with nothing more to come', () => {
    const f = new Forage(umamiDeal(seeded(1)));
    expect(f.containers()).toEqual([{ bit: expect.objectContaining({ box: 'basket', tag: UMAMI.TAG }), r: 0, c: 2 }]);
    expect(f.toCome).toBe(0);
    // Two columns clear of him on his left and three on his right: never against an edge.
    expect(UMAMI.AT.c).toBeGreaterThanOrEqual(2);
    expect(W - (UMAMI.AT.c + 2)).toBeGreaterThanOrEqual(2);
  });
  it('deals special pieces, but never an earthquake (the one thing that moves a container sideways) nor a shovel', () => {
    const d = umamiDeal(seeded(2));
    expect(d.specials!.weights.earthquake).toBe(0);
    expect(d.specials!.weights.shovel).toBe(0);
    for (const s of SPECIALS) if (s !== 'earthquake' && s !== 'shovel') expect(d.specials!.weights[s]).toBeGreaterThan(0);
    // Played long with lots of specials coming in, not one earthquake turns up.
    const f = new Forage(umamiDeal(seeded(3), { ...SPECIAL_ODDS, chance: 0.3, max: 0.6 }));
    const R = seeded(4), seen = new Set<string>();
    for (let n = 0; n < 300 && !f.over; n++) {
      blunder(f, R);
      for (const row of f.grid) for (const b of row) if (b?.s) seen.add(b.s);
    }
    expect(seen.has('earthquake')).toBe(false);
    expect(seen.has('shovel')).toBe(false);
    expect(seen.size).toBeGreaterThan(1);
  });
});

/* The user, 10 Nov: "as long as we've got enough pieces so that you don't get stuck ... as long as you
   can get through eventually if you make a mistake." */
describe('never stuck, even after mistakes (10 Nov)', () => {
  it('a rescuer frees him on every board straight off', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 5; seed++) expect(free(seed, 0), `seed ${seed}`).not.toBeNull();
  });
  it('after a run of blunders, wherever they leave him, he can still be got down', { timeout: 300_000 }, () => {
    // Blunders that strand him: columns dug out under one side, him low on the board, specials wasted.
    for (let seed = 1; seed <= 6; seed++) for (const mistakes of [15, 60]) {
      expect(free(seed, mistakes), `seed ${seed}, ${mistakes} mistakes`).not.toBeNull();
    }
  });
  it('even without any special pieces to help, lines alone free him', { timeout: 300_000 }, () => {
    for (let seed = 1; seed <= 3; seed++) expect(free(seed, 40, 400, NO_SPECIALS), `seed ${seed}`).not.toBeNull();
  });
  it('the worst a mistake leaves: one side dug out to the bottom, him on the board\'s last rows', () => {
    // Him on rows 7 and 8, his left column empty under him, his right side held up by one tile in a
    // row that can't be turned: a line along the bottom row from the squares beside it still clears it.
    const f = new Forage({ random: seeded(5), bananas: 0, specials: NO_SPECIALS, start: [{ ...UMAMI.AT, r: 7, tag: UMAMI.TAG }] });
    f.grid[9][2] = null;
    const R = seeded(6);
    let n = 0;
    for (; n < 200; n++) if (rescue(f, R)!.left.some((l) => l.tag === UMAMI.TAG)) break;
    expect(n).toBeLessThan(200);
  });
});

describe('her moorings in the lagoon', () => {
  it('she rests by the wreck, and is poled along the shore to his bank and back', () => {
    const u = new Umami();
    expect(u.byWreck(true)).toBe(true);
    expect(u.beside(true)).toBe(false);
    expect(u.poleTo('bank', false)).toBe(false);   // (not in the lagoon)
    expect(u.poleTo('wreck', true)).toBe(false);   // (there already)
    expect(u.poleTo('bank', true)).toBe(true);
    expect(u.byWreck(true)).toBe(false);           // on her way: no hauling the wreck, no lowering her
    expect(u.beside(true)).toBe(false);
    expect(u.tick(UMAMI.POLE / 2)).toBe(false);
    expect(u.tick(UMAMI.POLE / 2)).toBe(true);
    expect(u.beside(true)).toBe(true);
    expect(u.canFree(true)).toBe(true);
    expect(u.poleTo('wreck', true)).toBe(true);
    u.tick(UMAMI.POLE);
    expect(u.byWreck(true)).toBe(true);
  });
  it('his board is kept as you left it, and she stays put while you free him', () => {
    const u = new Umami();
    u.poleTo('bank', true); u.tick(UMAMI.POLE);
    const f = u.free(() => new Forage(umamiDeal(seeded(1))))!;
    expect(f).not.toBeNull();
    expect(u.canPole(true)).toBe(false);
    u.leave();
    expect(u.free(() => { throw new Error('dealt again'); })).toBe(f);
  });
  it('freed, he swims to her, comes aboard, and goes home with her', () => {
    const u = new Umami();
    u.poleTo('bank', true); u.tick(UMAMI.POLE);
    u.free(() => new Forage(umamiDeal(seeded(1))));
    u.freed();
    expect(u.stage).toBe('swimming');
    expect(u.canFree(true)).toBe(false);
    u.done();
    expect(u.canPole(true)).toBe(true);
    u.home();
    expect(u.stage).toBe('swimming');   // not till he's aboard
    u.aboard();
    expect(u.stage).toBe('aboard');
    u.home();
    expect(u.stage).toBe('home');
  });
});

describe('his life at the den', () => {
  it('keeps to his stretch of the water\'s edge, mostly in the water, and does what the depth there allows', () => {
    const l = new Life(seeded(9));
    let wet = 0, n = 0;
    const seen = new Set<string>();
    for (let t = 0; t < 1200; t += 0.1) {
      l.tick(0.1);
      expect(l.x).toBeGreaterThanOrEqual(LIFE.X[0] - 1e-9);
      expect(l.x).toBeLessThanOrEqual(LIFE.X[1] + 1e-9);
      expect(l.off).toBeLessThanOrEqual(LIFE.OFF[0] + 1e-9);
      expect(l.off).toBeGreaterThanOrEqual(Math.min(LIFE.OFF[1], LIFE.ARRIVE.off) - 1e-9);
      const d = l.doing(), dp = depth(l.off);
      seen.add(d);
      expect({ sand: ['sit', 'walk'], shallows: ['soak', 'wade'], deep: ['float', 'swim'] }[dp]).toContain(d);
      if (dp !== 'sand') wet++;
      n++;
    }
    expect(wet / n).toBeGreaterThan(0.5);
    for (const d of ['sit', 'soak', 'float', 'walk', 'wade', 'swim']) expect(seen).toContain(d);
  });
  it('stays a while at each spot, then moves on', () => {
    const l = new Life(seeded(2));
    const at = () => `${l.x.toFixed(3)},${l.off.toFixed(3)}`;
    l.tick(1.01);
    expect(l.to).not.toBeNull();
    for (let t = 0; t < 60 && l.to; t += 0.1) l.tick(0.1);
    expect(l.to).toBeNull();
    const here = at();
    l.tick(LIFE.STAY[0] - 0.5);
    expect(at()).toBe(here);
    for (let t = 0; t < LIFE.STAY[1] + 1; t += 0.1) l.tick(0.1);
    expect(at()).not.toBe(here);
  });
});

/** (For the record: a board with him against an edge and his inner column dug out to the bottom is
    one no line can ever free; the reason he's dealt in the middle and no earthquake can shift him.) */
it('against an edge, with his inner column dug out, nothing under him can ever turn or line up', () => {
  const f = new Forage({ random: seeded(5), bananas: 0, specials: NO_SPECIALS, start: [{ size: 'basket', r: 0, c: 5, tag: UMAMI.TAG }] });
  for (let r = 2; r < H; r++) f.grid[r][5] = null;
  for (let r = 2; r < H; r++) {
    expect(f.canTurn(r, 5)).toBe(false);
    expect(f.canTurn(r - 1, 5)).toBe(false);
  }
  const col: (Bit | null)[] = f.grid.slice(2).map((row) => row[6]);
  expect(col.every((b) => b && b.k >= 0)).toBe(true);
});

/* The user, 10 Nov: "being in the cage or being trapped in some way visually makes sense while you're
   trying to free them. They break free and happily start jumping around." */
describe('trapped while you free him, then breaks free and jumps about happily (10 Nov)', () => {
  it('first wriggles out of the net, still on the ground, the net sliding off him', () => {
    expect(freedAt(0)).toMatchObject({ phase: 'break', lift: 0, net: 0 });
    expect(freedAt(FREED.BREAK / 2)).toMatchObject({ phase: 'break', lift: 0, net: 0.5 });
  });
  it('then bounds about a few times, each a soft arc up and down, along the bank', () => {
    let tops = 0, rising = false, last = 0, along = 0;
    for (let t = FREED.BREAK; t < FREED.BREAK + FREED.HOPS * FREED.HOP; t += 0.005) {
      const f = freedAt(t);
      expect(f.phase).toBe('hop');
      expect(f.net).toBe(1);
      expect(f.lift).toBeGreaterThanOrEqual(0);
      expect(f.lift).toBeLessThanOrEqual(FREED.HIGH + 1e-9);
      expect(Math.abs(f.lift - last)).toBeLessThan(0.02);   // (smooth: no jumps between frames)
      expect(f.along).toBeGreaterThanOrEqual(along);
      if (f.lift < last && rising) tops++;
      rising = f.lift > last; last = f.lift; along = f.along;
    }
    expect(tops).toBe(FREED.HOPS);
    expect(FREED.HOP).toBeGreaterThanOrEqual(0.4);   // (slow enough to enjoy, not a flicker)
  });
  it('then a leap into the water, and he swims', () => {
    expect(freedAt(FREED_T - FREED.LEAP / 2)).toMatchObject({ phase: 'leap' });
    expect(freedAt(FREED_T - FREED.LEAP / 2).lift).toBeCloseTo(FREED.LEAP_HIGH, 9);
    expect(freedAt(FREED_T + 0.01).phase).toBe('swim');
  });
});

/* The user, 10 Nov: "I don't understand as well how he seems to get free after just 2 clicks." */
describe("he isn't freed after just two clicks (10 Nov)", () => {
  /** A player who sees just what each move does and takes the one that brings him down most. */
  function greedy(f: Forage, R: () => number): Move {
    const mine = under(f);
    let best = -1, pick: ReturnType<typeof moves> = [];
    moves(f).forEach((m, i) => {
      const g = copy(f, i + 1), res = play(g, m), a = him(g);
      const score = !a ? 1e9 : a.r * 1e4 + res.stages.flatMap((st) => st.cleared).filter((id) => mine.has(id)).length * 100 + res.tiles;
      if (score > best) { best = score; pick = [m]; } else if (score === best) pick.push(m);
    });
    return play(f, pick[Math.floor(R() * pick.length)]);
  }
  it('a fresh deal takes a good number of moves to free him, even played well', { timeout: 300_000 }, () => {
    const took: number[] = [];
    for (let seed = 1; seed <= 9; seed++) {
      const f = new Forage(umamiDeal(seeded(seed))), R = seeded(seed * 13);
      let n = 1;
      while (n < 2000 && !greedy(f, R).left.some((l) => l.tag === UMAMI.TAG)) n++;
      took.push(n);
    }
    took.sort((a, b) => a - b);
    expect(took[0]).toBeGreaterThan(3);              // never in a click or two
    expect(took[took.length >> 1]).toBeGreaterThan(25);   // and mostly a fair while
  });
  it('the reason it was quick: a shovel over him digs out his whole column at once', () => {
    // On a board that dealt shovels, two over him (they come in at the top, where he is) free him in
    // two moves: his board deals none.
    const f = new Forage({ random: seeded(7), bananas: 0, specials: NO_SPECIALS, start: [{ ...UMAMI.AT, r: 1, tag: UMAMI.TAG }] });
    f.grid[0][2] = { id: 5000, k: -1, s: 'shovel' };
    f.grid[0][3] = { id: 5001, k: -1, s: 'shovel' };
    f.cur = { r: 0, c: 2 }; f.press(true);
    f.cur = { r: 0, c: 3 };
    expect(f.press(true).left.map((l) => l.tag)).toEqual([UMAMI.TAG]);
    expect(umamiDeal().specials!.weights.shovel).toBe(0);
  });
});
