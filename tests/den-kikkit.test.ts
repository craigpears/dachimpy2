/* Kikkit's island and her whirlpools through the reef (src/den-kikkit.ts), on the sloop's sea
   (LAY.KIKKIT in src/den-sail.ts), Puzzle Pirates' whirlpools (src/den-whirl.ts). The user (11 Nov):
   "Maybe a small combo gets you through the reef, with the penguins being the bigger prize after",
   and "definitely a Vegas to get fully through to the penguins". */
import { describe, expect, it } from 'vitest';
import { GAP, KIKKIT, KIKKIT_CAST, KIKKIT_SAYS, KIKKIT_STANDS, MOUTH, OUT, PENGUINS, Whirlpools, inEarshot, inKikkitWaters, kikkitAt, kikkitShore, onKikkitLanding, passageAt, turnsOf, type WhirlEvent } from '../src/den-kikkit';
import { LAY, SAIL, Sea, Helm, path, type Pose, type SailEvent } from '../src/den-sail';
import { WHIRL, whirlpool } from '../src/den-whirl';
import { carry, gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { isleMooring } from '../src/den-isle';
import { Checkpoint } from '../src/den-checkpoint';
import { CHART, NOTES, VEGAS_NOTE } from '../src/den-map';
import { RAMBLE, BACK, BACK_OUT, TANGENTS } from '../src/lines/kikkit';
import { Chatter } from '../src/chatter';
import { readSecs } from '../src/den-dignity';

/** Kikkit, talking (src/chatter.ts with her script: she's only config, RULES.md "A character is only config"). */
const kikkit = () => new Chatter(KIKKIT_SAYS, { secs: readSecs });
/** Her next `n` lines, in order. */
const nextOf = (k: Chatter, n: number) => Array.from({ length: n }, () => k.next());

const K = LAY.KIKKIT, ROW = LAY.CHECKPOINT.ROW;
const at = (p: Pose) => [p.c, p.r];
const last = (ps: Pose[]) => ps[ps.length - 1];
const DOUBLE = runFor(2), VEGAS = runFor(RUN.VEGAS);
/** A gust of `run` from the mouth (or `from`), played out: what the helm did, what the watch said, and where she ends. */
function sail(run: number, from: Pose = MOUTH, secs = 30) {
  const h = new Helm(new Sea(9), from), w = new Whirlpools(), events: SailEvent[] = [], said: WhirlEvent[] = [];
  const went = carry(h, run);
  for (let t = 0; t < secs; t += 0.02) { const ev = h.tick(0.02); events.push(...ev); said.push(...w.watch(ev, h)); }
  return { h, w, events, said, went, whirls: events.filter((e) => e.kind === 'push' && e.whirl) as Extract<SailEvent, { kind: 'push' }>[] };
}

describe("her island, at the reef's near end, right of the checkpoint's gate (11 Nov)", () => {
  it('is land to sail by, on every sea, right of the gate and on the near side of the reef', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of K.LAND) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); }
    }
    for (const [c, r] of K.LAND) {
      expect(c).toBeGreaterThan(LAY.CHECKPOINT.GATE);
      expect(r).toBeLessThan(ROW);
      expect(kikkitAt(c, r)).toBe(true);
    }
  });
  it('the water off its shore is open on every sea, the mouth of the whirlpools among it', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = new Sea(seed);
      for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onKikkitLanding(c, r)) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
    }
    expect(onKikkitLanding(MOUTH.c, MOUTH.r)).toBe(true);
    expect(inKikkitWaters(MOUTH.c, MOUTH.r)).toBe(true);
  });
  it("a new player can sail there from the den and home, and still to the Wedding Isle and home (seas 1 to 20)", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new Sea(seed), W = isleMooring();
      const there = s.plot(SAIL.HOME, MOUTH.c, MOUTH.r);
      expect(there, `seed ${seed}`).not.toBeNull();
      let p = { ...SAIL.HOME };
      for (const m of there!) { for (const [c, r] of path(p, m).cells) expect(s.isLock(c, r) || s.level(c, r) > 0).toBe(false); p = s.sail(p, m).to; }
      expect(at(p)).toEqual([MOUTH.c, MOUTH.r]);
      expect(s.plot(p, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
      expect(s.plot(SAIL.HOME, W.c, W.r), `seed ${seed}`).not.toBeNull();
      expect(s.plot(W, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
      expect(s.plot(W, MOUTH.c, MOUTH.r)).not.toBeNull();
    }
  });
  it("is on the captain's map, drawn round its land, but not named (11 Nov: one point of interest)", () => {
    expect(kikkitShore().length).toBeGreaterThanOrEqual(4);
    expect(CHART.kikkit.shore).toHaveLength(kikkitShore().length);
    expect(NOTES.some((n) => n.label === KIKKIT.NAME)).toBe(false);
    // (Vegas Island isn't on the map's notes from the start: map.js writes it once you've been.)
    expect(NOTES.some((n) => n.label === KIKKIT.VEGAS)).toBe(false);
    expect(VEGAS_NOTE.label).toBe('Vegas Island');
  });
});

describe('her whirlpools, as Puzzle Pirates\' are (YPPedia, 11 Nov)', () => {
  const s = new Sea(9);

  it('are two whirlpools of four squares, each with a corner missing where the winds sit', () => {
    expect(K.WHIRLS).toHaveLength(2);
    for (const spot of K.WHIRLS) {
      const w = whirlpool(spot);
      expect(w.squares).toHaveLength(3);
      for (const [c, r] of w.squares) { expect(s.whirlAt(c, r)?.squares).toEqual(w.squares); expect(s.open(c, r)).toBe(false); }
      expect(s.windAt(...w.gone!)).toBeDefined();
    }
    // The reef's gap is a wind, in the reef's row; past it, open water.
    expect(GAP[1]).toBe(ROW);
    expect(s.windAt(...GAP)).toBeDefined();
    expect(OUT[1]).toBeGreaterThan(ROW);
    expect(s.open(...OUT) && s.windAt(...OUT) === undefined).toBe(true);
  });

  it(`whirlpools only spun her and flung her back, not the four-tile turn to the opposite corner (11 Nov)`, () => {
    // "Whirlpools are basically four tiles ... each one ... rotates the ship and sends it to the opposite
    // corner"; "a corner missing where there's some winds, so you kind of get caught in the whirlpool and
    // it sends you to the opposite corner, which then gets you on some winds and sends you back".
    const { h, whirls, events, said } = sail(runFor(1));
    expect(whirls).toHaveLength(1);
    const [first] = whirls, w = s.whirlAt(first.from.c, first.from.r)!;
    // A quarter turn clockwise, and across the whirlpool to its opposite corner, the missing one.
    expect(first.to.d).toBe((first.from.d + 1) % 4);
    expect(Math.abs(first.to.c - first.from.c)).toBe(1);
    expect(Math.abs(first.to.r - first.from.r)).toBe(1);
    expect(at(first.to)).toEqual(w.gone);
    // Then the winds carry her back, a square at a time, never a leap: back as she started.
    for (const e of events) if (e.kind === 'push' && !e.whirl) expect(Math.abs(e.to.c - e.from.c) + Math.abs(e.to.r - e.from.r)).toBe(1);
    expect(h.pose).toEqual(MOUTH);
    expect(said).toEqual(['caught', 'back']);
  });

  it('a plain clear stops in the gap and is caught; the winds throw her back to the mouth', () => {
    const { h, w, went } = sail(runFor(1));
    expect(went.squares.map(at)[0]).toEqual(GAP);
    expect(h.pose).toEqual(MOUTH);
    expect(w.through).toBe(false);
    expect(w.backOut).toBe(false);
  });

  it('a Double carries her clean over the gap and out past the reef: through', () => {
    const { h, w, whirls, said } = sail(DOUBLE);
    expect(at(h.pose)).toEqual(OUT);
    expect(whirls).toEqual([]);
    expect(said).toEqual(['through']);
    expect(w.through).toBe(true);
  });

  it('a Triple, a Bingo or a Donkey gets through, then onto the winds past it, into the other whirlpool, and home', () => {
    for (const steps of [3, 4, 5]) {
      const { h, whirls, said, w } = sail(runFor(steps));
      expect(said, `steps ${steps}`).toEqual(['through', 'caught', 'back']);
      expect(whirls).toHaveLength(1);
      expect(s.whirlAt(whirls[0].from.c, whirls[0].from.r)).toBe(s.whirlAt(...(K.WHIRLS[1].at as [number, number])));
      expect(at(h.pose)).toEqual([MOUTH.c, MOUTH.r]);
      expect(w.backOut).toBe(true);
    }
  });

  it('only a Vegas carries her to the penguins, from the mouth or from past the reef', () => {
    const got = gustPath(s, MOUTH, VEGAS);
    expect(at(last(got))).toEqual(PENGUINS);
    for (let steps = 1; steps < RUN.VEGAS; steps++) expect(gustPath(s, MOUTH, runFor(steps)).map(at)).not.toContainEqual(PENGUINS);
    expect(at(last(gustPath(s, MOUTH, runFor(8))))).toEqual(PENGUINS);
    const out: Pose = { c: OUT[0], r: OUT[1], d: 0 };
    expect(at(last(gustPath(s, out, VEGAS)))).toEqual(PENGUINS);
    for (let steps = 1; steps < RUN.VEGAS; steps++) expect(gustPath(s, out, runFor(steps)).map(at)).not.toContainEqual(PENGUINS);
    // Played: through and to the penguins, and nothing has her.
    const { h, said, whirls } = sail(VEGAS);
    expect(at(h.pose)).toEqual(PENGUINS);
    expect(said).toEqual(['through', 'penguins']);
    expect(whirls).toEqual([]);
  });

  it('sailing into it under her own way, it has her the same; and the pilot never takes her in', () => {
    const h = new Helm(new Sea(9), MOUTH), w = new Whirlpools(), said: WhirlEvent[] = [];
    h.put('F');
    for (let t = 0; t < 30; t += 0.02) said.push(...w.watch(h.tick(0.02), h));
    expect(said).toEqual(['caught', 'back']);
    expect(h.pose).toEqual(MOUTH);
    // The pilot: out past the reef the long way round, never onto a whirlpool nor the winds that feed them.
    const p = new Helm(new Sea(9), MOUTH), ev: SailEvent[] = [];
    expect(p.drop(...OUT)).toEqual(OUT);
    for (let t = 0; t < 400 && p.pin; t += 0.05) ev.push(...p.tick(0.05));
    expect(at(p.pose)).toEqual(OUT);
    expect(ev.some((e) => e.kind === 'push' && e.whirl)).toBe(false);
    expect(s.plot(MOUTH, ...PENGUINS, null, true)).toBeNull();
  });

  it('never holds her for ever: from anywhere in it, facing any way, she comes to rest', () => {
    const squares = [...K.WHIRLS.flatMap((spot) => whirlpool(spot).squares), ...K.WINDS.map(([c, r]) => [c, r] as [number, number])];
    for (const [c, r] of squares) for (let d = 0; d < 4; d++) {
      const h = new Helm(new Sea(9), { c, r, d });
      if (s.windAt(c, r) !== undefined) h.gust([{ c, r, d }]);   // (blown on from a wind, as she'd come to it)
      let whirls = 0;
      for (let t = 0; t < 40; t += 0.05) whirls += h.tick(0.05).filter((e) => e.kind === 'push' && e.whirl).length;
      const rest = (!h.cur || h.cur.done) && !h.rides.length && !h.gusts.length && !h.whirling();
      expect(rest, `${c},${r},${d}`).toBe(true);
      expect(whirls).toBeLessThanOrEqual(WHIRL.MOST);
      // From a whirlpool's corner opposite its missing one, or any wind, it's the winds home to the mouth.
      if (s.windAt(c, r) !== undefined) expect(at(h.pose), `${c},${r}`).toEqual([MOUTH.c, MOUTH.r]);
    }
  });

  it('the checkpoint knows she came by them, out and back', () => {
    const h = new Helm(new Sea(9), MOUTH), cp = new Checkpoint(), said = [];
    carry(h, runFor(3));
    for (let t = 0; t < 30; t += 0.02) { h.tick(0.02); said.push(...cp.watch(h.pose)); }
    expect(said).toContainEqual({ kind: 'through', how: 'whirlpools', back: false, hits: 0 });
    expect(passageAt(...GAP)).toBe(true);
  });
});

describe('her ramble is the real map, taken literally (10 Nov: "it\'s got to actually make some mechanical sense")', () => {
  it('five lefts and a right (the right a twirl-eh), and back where she started', () => {
    expect(turnsOf(1)).toEqual({ lefts: 5, rights: 0, twirls: 1, backflips: 0, home: true });
    expect(turnsOf(runFor(3))).toEqual({ lefts: 5, rights: 0, twirls: 1, backflips: 0, home: true });
    const all = RAMBLE.join(' ');
    expect(all).toMatch(/five lefts and a right/);
    expect(all).toMatch(/twirl-eh/);
    // The way, from where she set off to back where she started: a left-eh, the twirl-eh, four more lefts.
    const way = RAMBLE.slice(RAMBLE.findIndex((l) => l.startsWith('I set off')), RAMBLE.findIndex((l) => l.includes('back where I started')) + 1).join(' ');
    expect(way.match(/\bleft-eh\b/g)?.length).toBe(5);
    expect(way.match(/\btwirl-eh\b/g)?.length).toBe(1);
    expect(all).toMatch(/back where I started-eh/);
    expect(all).toMatch(/Clockwise/);
    expect(all).toMatch(/WHOOSH/);
    expect(all).toMatch(/really, really big and really sparkly/);
    expect(all).toMatch(/balaclava/);
  });

  it('everything ends in -eh, near enough (11 Nov: "it\'s not a twirl, it\'s twirl EH"): sprinkled, not every word', () => {
    for (const set of [RAMBLE, TANGENTS, BACK, BACK_OUT]) {
      const eh = set.filter((l) => /-eh\b/.test(l)).length;
      expect(eh / set.length).toBeGreaterThan(0.85);
      for (const l of set) expect(l.split(' ').filter((w) => /-eh\b/.test(w)).length).toBeLessThan(l.split(' ').length / 2);
    }
    for (const l of [...RAMBLE, ...BACK, ...BACK_OUT]) expect(l.length).toBeLessThanOrEqual(100);
    expect([...RAMBLE, ...TANGENTS, ...BACK].join(' ')).not.toMatch(/\btwirl\b(?!-eh| round|y)/i);
  });

  it("she rambles the first time you sail up, then goes off on tangents, and has a new line each time you're thrown back", () => {
    const k = kikkit();
    expect(k.start()).toBe(true);   // (sailing up to her island: js/den/whirlpools.js)
    expect(k.start()).toBe(false);   // (and again: she's begun, nothing new)
    expect(nextOf(k, RAMBLE.length + 1)).toEqual([...RAMBLE, TANGENTS[0]]);
    const backs = Array.from({ length: BACK.length }, () => k.aside('back'));
    expect(new Set(backs).size).toBe(BACK.length);
    expect(new Set(Array.from({ length: BACK_OUT.length }, () => k.aside('backOut'))).size).toBe(BACK_OUT.length);
  });

  it('played: her ramble a line at a time, each up long enough to read, then the tangents straight after', () => {
    const k = kikkit(), said: string[] = [];
    k.start();
    for (let t = 0; t < 600; t += 0.05) { const l = k.tick(0.05, true); if (l) said.push(l); }
    expect(said.slice(0, RAMBLE.length + 2)).toEqual([...RAMBLE, TANGENTS[0], TANGENTS[1]]);
  });

  it("she's placed from config: her look, her lines, her animation, where she stands, her familiars and the penguins", () => {
    const her = KIKKIT_CAST.her;
    expect(her.look).toBe('Kikkit');
    expect(her.says).toBe(KIKKIT_SAYS);
    expect(her.at).toEqual([KIKKIT_STANDS.c, KIKKIT_STANDS.r]);
    expect(her.earshot).toBe(KIKKIT.EARSHOT);
    // Each on its own island: her familiars on hers, the penguins on Vegas Island.
    const near = (sq: readonly (readonly number[])[], at: readonly number[]) => sq.some(([c, r]) => Math.hypot(c + 0.5 - at[0], r + 0.5 - at[1]) < 1.6);
    for (const c of KIKKIT_CAST.creatures) expect(near(c.on === 'sand' ? K.LAND : K.VEGAS, c.at), `${c.kind} ${c.at}`).toBe(true);
    expect(KIKKIT_CAST.creatures.filter((c) => c.kind === 'penguin')).toHaveLength(6);
    expect(KIKKIT_CAST.creatures.filter((c) => c.on === 'sand').map((c) => c.kind)).toEqual(['parrot', 'octopus', 'squirrel', 'bat', 'krakling', 'parrot', 'monkey']);
  });
});

describe(`she never stops talking (11 Nov: "a never-ending loop of tangents and her speech bubbles that don't stop")`, () => {
  it('after her ramble she always has more: every tangent in turn, then the ramble again, round and round for ever', () => {
    const k = kikkit();
    k.start();
    nextOf(k, RAMBLE.length);
    expect(nextOf(k, TANGENTS.length)).toEqual([...TANGENTS]);
    expect(nextOf(k, RAMBLE.length)).toEqual([...RAMBLE]);
    expect(k.next()).toBe(TANGENTS[0]);
    for (let i = 0; i < 1000; i++) expect(k.next()).toBeTruthy();
  });

  it('an insanely long list of them, each short enough for a bubble on a phone, none said twice', () => {
    expect(TANGENTS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(TANGENTS).size).toBe(TANGENTS.length);
    for (const t of TANGENTS) expect(t.length).toBeLessThanOrEqual(100);
  });

  it("within earshot, hailed or not, she goes on and on; out of it she finishes her line and stops, and starts up again when you're back", () => {
    const k = kikkit(), said: string[] = [];
    const go = (secs: number, near: boolean) => { for (let t = 0; t < secs; t += 0.05) { const l = k.tick(0.05, near); if (l) said.push(l); } };
    k.start();
    go(400, true);
    const n = said.length;
    expect(n).toBeGreaterThan(RAMBLE.length + 20);
    go(60, false);
    expect(said.length).toBe(n);
    expect(k.line).toBeNull();
    go(1, true);
    expect(said.length).toBe(n + 1);
    // Space: on to the next now.
    expect(k.hail()).toBe(k.line?.text);
  });

  it(`within earshot as you sail past her island, hailed or not, and not from the checkpoint's gate`, () => {
    expect(inEarshot(KIKKIT_STANDS.c, KIKKIT_STANDS.r)).toBe(true);
    expect(inEarshot(MOUTH.c, MOUTH.r)).toBe(true);
    for (let r = K.LANDING.r0; r <= K.LANDING.r1; r++) expect(inEarshot(K.LANDING.c0, r)).toBe(true);
    expect(inEarshot(KIKKIT_STANDS.c - KIKKIT.EARSHOT - 1, KIKKIT_STANDS.r)).toBe(false);
    expect(inEarshot(LAY.CHECKPOINT.GATE, LAY.CHECKPOINT.ROW)).toBe(false);   // (Dignity's to talk there)
  });
});

describe(`keeping the charm of the first go (11 Nov: "it does throw you out and say too many lefts")`, () => {
  it('spat back, the first thing she says is "too many lefts", as her ramble warned', () => {
    expect(kikkit().aside('back')).toMatch(/too many lefts/i);
    // Slotted in over her ramble, and then she carries on with it.
    const k = kikkit();
    k.start();
    k.tick(0.05);
    expect(k.line?.text).toBe(RAMBLE[0]);
    expect(k.aside('back')).toMatch(/too many lefts/i);
    let next: string | null = null;
    for (let t = 0; t < 10 && !next; t += 0.05) next = k.tick(0.05);
    expect(next).toBe(RAMBLE[1]);
    expect(RAMBLE.join(' ')).toMatch(/too many lefts/i);
  });
});
