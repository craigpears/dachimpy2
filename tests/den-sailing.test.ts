/* The Sailing puzzle at sea (TODO.md, "The Sailing puzzle, for Kikkit's quest", 10 Nov: "like a
   trade winds, kind of, just jump multiple tiles"): a drop's run carries her that many squares
   straight ahead in one go, stopping short of whatever her other moves are stopped by. */
import { describe, expect, it } from 'vitest';
import { Helm, LAY, SAIL, Sea, type Pose, type SailEvent } from '../src/den-sail';
import { WEATHER, Wind } from '../src/den-wind';
import { BILLOW, SPARKLE, SURGE, Sparkle, billow, carry, carrySay, gustPath, sparkleFor, surgeFor } from '../src/den-sailing';
import { runFor } from '../src/sailing';

/** Open sea: no rocks, no lanes, no wind to put her in irons (every move SAIL.MOVE). */
const open = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
const run = (h: Helm, secs: number, step = 0.01) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };
const at = (p: Pose) => [p.c, p.r, p.d];

describe('a gust (gustPath)', () => {
  it('goes straight ahead the way she heads, a square at a time', () => {
    expect(gustPath(open(), { c: 5, r: 5, d: 1 }, 3).map(at)).toEqual([[6, 5, 1], [7, 5, 1], [8, 5, 1]]);
    expect(gustPath(open(), { c: 5, r: 5, d: 0 }, 2).map(at)).toEqual([[5, 6, 0], [5, 7, 0]]);
    expect(gustPath(open(), { c: 5, r: 5, d: 2 }, 0)).toEqual([]);
  });
  it('stops short of a rock, and of the board\'s edge', () => {
    const s = open();
    s.rocks.add('9,5');
    expect(gustPath(s, { c: 5, r: 5, d: 1 }, 7).map(at)).toEqual([[6, 5, 1], [7, 5, 1], [8, 5, 1]]);
    expect(gustPath(s, { c: 8, r: 5, d: 1 }, 7)).toEqual([]);
    expect(gustPath(s, { c: 1, r: 5, d: 3 }, 7).map(at)).toEqual([[0, 5, 3]]);
  });
  it('stops short of land and the cliffs (the laid sea: the Wedding Isle, the clifftop)', () => {
    const s = new Sea(1);
    const [jc, jr] = LAY.ISLE.JETTY;   // (its jetty, land; the water off it to the left)
    expect(gustPath(s, { c: jc - 1, r: jr, d: 1 }, 5)).toEqual([]);
    for (const p of gustPath(s, { c: 6, r: 2, d: 0 }, 20)) expect(s.ground(p.c, p.r)).toBe(false);
  });
  it('stops short of a lock, and never runs from one', () => {
    const s = new Sea(1), [lc, lr] = LAY.LOCKS[0].at;
    // (up the canal's mouth toward the first lock, from the sea)
    expect(gustPath(s, { c: lc, r: lr - 3, d: 0 }, 7).map(at)).toEqual([[lc, lr - 2, 0], [lc, lr - 1, 0]]);
    expect(gustPath(s, { c: lc, r: lr, d: 0 }, 3)).toEqual([]);
  });
  it('stops short of water at another level', () => {
    const s = open();
    s.pounds.set('7,5', 1);
    expect(gustPath(s, { c: 5, r: 5, d: 1 }, 4).map(at)).toEqual([[6, 5, 1]]);
  });
  it('"the big sailing boost" zooms her through the checkpoint\'s gate (11 Nov)', () => {
    const s = new Sea(1), K = LAY.CHECKPOINT;
    const got = gustPath(s, { c: K.GATE, r: K.ROW - 3, d: 0 }, 7);
    expect(got.map(at)).toEqual(Array.from({ length: 7 }, (_, i) => [K.GATE, K.ROW - 2 + i, 0]));
  });
});

describe('the whirlpools are a way through only on purpose (11 Nov)', () => {
  /** A gust of `run` from `from`, played out with whatever the winds and whirlpools do after it. */
  const blown = (s: Sea, from: Pose, run: number) => {
    const h = new Helm(s, from), got = carry(h, run);
    for (let i = 0; i < 2000 && (h.cur || h.gusts.length || h.whirling()); i++) h.tick(0.05);
    return { h, got };
  };
  const K = LAY.CHECKPOINT, KK = LAY.KIKKIT;

  it('11 Nov: sailing by Tzz\'s island, a chain blew her through the whirlpools to Dignity ("something got clipped")', () => {
    // The user: "somehow I have ended up over near Dignity ... I don't know how I managed to just make a
    // mishap near the Whirlpools". Heading out to sea past Kikkit's island, a big chain carried her over
    // the winds that feed the whirlpools, through the reef with them, and out beside the checkpoint.
    const s = new Sea(9);
    for (const from of [{ c: 13, r: 16, d: 0 }, { c: 16, r: 13, d: 0 }, { c: 16, r: 16, d: 0 }]) {
      const { h, got } = blown(s, from, runFor(6));
      expect(h.pose.r, `${from.c},${from.r}`).toBeLessThan(K.ROW);
      for (const p of got.squares) expect(s.passage.has(`${p.c},${p.r}`) || s.reef.has(`${p.c},${p.r}`), `${p.c},${p.r}`).toBe(false);
    }
  });

  it('no gust from the den\'s side of the reef, but from the mouth, ever takes her past it, nor onto the way through', () => {
    const s = new Sea(9), runs = [1, 2, 3, 4, 5, 7, 9];
    for (let c = 0; c < s.cols; c++) for (let r = 0; r < K.ROW; r++) for (let d = 0; d < 4; d++) {
      if (!s.open(c, r) || s.windAt(c, r) !== undefined || s.isLock(c, r) || s.level(c, r) !== 0) continue;
      if (c === KK.MOUTH.c && r === KK.MOUTH.r && d === KK.MOUTH.d) continue;
      for (const run of runs) {
        const { h, got } = blown(s, { c, r, d }, run);
        // (through the checkpoint's gate is the other way past it, a big boost's since 11 Nov)
        const gate = got.squares.some((p) => p.c === K.GATE && p.r === K.ROW);
        if (!gate) expect(h.pose.r, `${c},${r},${d} run ${run}`).toBeLessThanOrEqual(K.ROW);
        for (const p of got.squares) expect(s.passage.has(`${p.c},${p.r}`), `${c},${r},${d} run ${run}: ${p.c},${p.r}`).toBe(false);
      }
    }
  }, 60000);

  it('from the mouth, facing out, it\'s the way through as Kikkit tells it: a Double clears the reef', () => {
    const s = new Sea(9);
    expect(blown(s, KK.MOUTH, runFor(2)).h.pose).toMatchObject({ c: KK.OUT[0], r: KK.OUT[1] });
    // (and from OUT, on out to the penguins, a Vegas's)
    expect(at(gustPath(s, { c: KK.OUT[0], r: KK.OUT[1], d: 0 }, runFor(6)).at(-1)!)).toEqual([...KK.PENGUINS, 0]);
  });

  it('stops short of a whirlpool and the reef, as of any rock, from outside the way through', () => {
    const s = new Sea(9);
    // Past the reef, along it toward the whirlpools from the right: short of the first whirlpool.
    const along = gustPath(s, { c: 20, r: KK.OUT[1], d: 3 }, 9).map(at);
    expect(along.at(-1)).toEqual([KK.OUT[0], KK.OUT[1], 3]);
    // The reef's whole length is rock but where the way through runs, out to the sea's edge.
    for (let c = K.REEF.c0; c <= K.REEF.c1; c++) {
      const k = `${c},${K.ROW}`;
      expect(s.reef.has(k) !== s.passage.has(k), k).toBe(true);
      if (s.reef.has(k)) expect(s.isRock(c, K.ROW)).toBe(true);
    }
    expect(K.REEF.c1).toBe(SAIL.COLS - 1);
  });
});

describe('carried by a chain (carry)', () => {
  it('a Triple carries her three squares, in one go, at the trade winds\' pace', () => {
    const h = new Helm(open(), { c: 5, r: 5, d: 1 });
    const c = carry(h, runFor(3));
    expect(c).toMatchObject({ run: 3, went: 3, why: null });
    const ev = run(h, 3 * SAIL.PUSH + 0.05);
    expect(ev.filter((e) => e.kind === 'push' && e.gust).length).toBe(3);
    expect(at(h.pose)).toEqual([8, 5, 1]);
    expect(h.slot).toBe(-1);
  });
  it('a Vegas carries her seven', () => {
    const h = new Helm(open(), { c: 2, r: 5, d: 1 });
    expect(carry(h, runFor(6)).went).toBe(7);
    run(h, 3);
    expect(at(h.pose)).toEqual([9, 5, 1]);
  });
  it('blows after the move she\'s on, then the rest of her turn goes on from there', () => {
    const h = new Helm(open(), { c: 5, r: 5, d: 1 });
    h.put('F'); h.put('F');
    run(h, SAIL.WAKE + 0.1);   // (the first move under way)
    expect(h.cur?.m).toBe('F');
    expect(at(h.gustFrom())).toEqual([6, 5, 1]);
    carry(h, 2);
    expect(at(h.after())).toEqual([9, 5, 1]);   // (6, then the gust to 8, then her second move)
    run(h, 10);
    expect(at(h.pose)).toEqual([9, 5, 1]);
    expect(h.idle()).toBe(true);
  });
  it('carries her in a calm (it\'s wind), and the move she was waiting on goes after', () => {
    const parked = WEATHER.parked;
    WEATHER.parked = false;   // (the weather's parked for now, 10 Nov: no calms till it's back on)
    try {
      const s = open();
      s.breeze = new Wind(1); s.breeze.set(1, 0, 1e9);
      const h = new Helm(s, { c: 5, r: 5, d: 1 });
      h.put('F');
      run(h, 1);
      expect(h.held()).toBe('calm');
      carry(h, 2);
      run(h, 1);
      expect(at(h.pose)).toEqual([7, 5, 1]);
      expect(h.held()).toBe('calm');
    } finally { WEATHER.parked = parked; }
  });
  it('stops short, and says so', () => {
    const s = open();
    s.rocks.add('8,5');
    const h = new Helm(s, { c: 5, r: 5, d: 1 });
    const c = carry(h, 5);
    expect(c).toMatchObject({ run: 5, went: 2, why: 'short' });
    expect(carrySay(3, c)).toBe('A Triple! The wind carries her 2 squares, as far as she can go');
    run(h, 2);
    expect(at(h.pose)).toEqual([7, 5, 1]);
  });
  it('not while she\'s holed', () => {
    const h = new Helm(open(), { c: 5, r: 5, d: 1 });
    h.hit();
    const c = carry(h, 3);
    expect(c.why).toBe('held');
    run(h, 2);
    expect(at(h.pose)).toEqual([5, 5, 1]);
  });
  it('ending on a trade wind, the wind takes her on', () => {
    const s = new Sea(1), [lc, lr] = LAY.LANES[0].at;
    // (just before the lane out from off the beach, heading onto it from the side)
    const h = new Helm(s, { c: lc - 2, r: lr + 1, d: 1 });
    const c = carry(h, 2);
    expect(c.went).toBe(2);
    run(h, 8);
    expect(h.pose.c).toBe(lc);
    expect(h.pose.r).toBeGreaterThan(lr + 1);
  });
  it('moored, it\'s all forgotten', () => {
    const h = new Helm(open(), { c: 5, r: 5, d: 1 });
    carry(h, 3);
    h.moor();
    expect(h.gusts).toEqual([]);
  });
});

describe('what\'s said (carrySay)', () => {
  const c = (went: number, run = went) => ({ run, went, why: null, squares: [] });
  it('names the chain and the squares', () => {
    expect(carrySay(1, c(1))).toBe('A clear! The wind carries her a square');
    expect(carrySay(2, c(2))).toBe('A Double! The wind carries her 2 squares');
    expect(carrySay(3, c(3))).toBe('A Triple! The wind carries her 3 squares');
    expect(carrySay(4, c(4))).toBe('A Bingo! The wind carries her 4 squares');
    expect(carrySay(6, c(7))).toBe('A Vegas! The wind carries her 7 squares');
  });
  it('says when there\'s nowhere to go', () => {
    expect(carrySay(2, { run: 2, went: 0, why: 'short', squares: [] })).toBe("A Double! But there's no sea ahead of her to run");
    expect(carrySay(2, { run: 2, went: 0, why: 'held', squares: [] })).toMatch(/held up/);
  });
});

describe('doing well shows (Sparkle; the user, 11 Nov: "a sparkly indicator, and sparkly full sails")', () => {
  it('bigger chains, more show: a glint for a plain clear (14 Nov: "the ship sparkle even a tiny bit"), a little glitter for a Double, everything for a Vegas', () => {
    expect([0, 1, 2, 3, 6, 9].map(sparkleFor)).toEqual([0, 0.12, 0.25, 0.45, 1, 1]);
    for (let s = 1; s < 6; s++) expect(sparkleFor(s + 1)).toBeGreaterThan(sparkleFor(s));
    const a = new Sparkle(), b = new Sparkle();
    a.chain(2); b.chain(6, 7);
    expect(a.full()).toBe(false);
    expect(b.full()).toBe(true);
  });
  it('every gust shows as it takes her, a single clear too, bigger with a bigger chain (14 Nov: "you should visibly see the jump")', () => {
    expect(surgeFor(1)).toBeGreaterThan(0.3);
    for (let s = 1; s < 6; s++) expect(surgeFor(s + 1)).toBeGreaterThan(surgeFor(s));
    expect(surgeFor(6)).toBe(1);
    expect(surgeFor(3, 0)).toBe(0);   // (held up: no gust, no surge)
    expect(SURGE.EASE).toBeGreaterThan(0.3);
  });
  it('lasts while the gust carries her and a while after, then fades away', () => {
    const s = new Sparkle();
    s.chain(6, 7, 0.28);
    s.tick(7 * 0.28 + SPARKLE.HOLD - 0.1);
    expect(s.level).toBe(1);
    s.tick(SPARKLE.FADE / 2);
    expect(s.level).toBeGreaterThan(0.3);
    expect(s.level).toBeLessThan(0.7);
    s.tick(SPARKLE.FADE);
    expect(s.level).toBe(0);
  });
  it('a smaller chain doesn\'t dim a bigger one\'s show', () => {
    const s = new Sparkle();
    s.chain(6, 7);
    s.chain(2, 2);
    expect(s.level).toBe(1);
  });
  it('the meter fills with chains, more for bigger ones, drains slowly, and a booch knocks most of it out', () => {
    const s = new Sparkle();
    s.chain(1);
    const plain = s.meter;
    s.chain(3);
    expect(s.meter - plain).toBeGreaterThan(plain);
    for (let i = 0; i < 5; i++) s.chain(6);
    expect(s.meter).toBe(1);
    s.tick(10);
    expect(s.meter).toBeLessThan(1);
    expect(s.meter).toBeGreaterThan(0.8);
    s.booch();
    expect(s.meter).toBeLessThan(0.3);
    expect(s.level).toBe(0);
  });
});

describe('Sailing\'s sparkle seen from behind her (11 Nov: from the usual camera a Vegas\'s billow barely showed)', () => {
  it('a Vegas swells her sails wider and taller, so they read bigger from anywhere, and deepens their belly', () => {
    const b = billow(1);
    expect(b.wide * b.tall).toBeGreaterThanOrEqual(1.5);   // (their face, as the camera behind her sees it)
    expect(b.fill).toBeGreaterThan(BILLOW.FULL_WIND);   // (fuller than the best wind fills them)
    expect(b.square).toBe(1);   // (square across her, facing the camera behind her full on)
  });
  it('no show, no change: the wind alone shapes them', () => {
    expect(billow(0)).toEqual({ wide: 1, tall: 1, fill: 0, square: 0 });
  });
  it('a Double swells them a little, less than a Vegas', () => {
    const d = billow(sparkleFor(2)), v = billow(sparkleFor(6));
    expect(d.wide).toBeGreaterThan(1);
    expect(d.wide).toBeLessThan(v.wide);
  });
});
