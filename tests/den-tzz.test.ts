/* Tzz's island and her balloon lesson (src/den-tzz.ts), a hop from Kikkit's (src/den-kikkit.ts), and
   what comes between them: your wondering aloud once Kikkit's done (src/lines/you.ts), and whom you hear
   when both are near (src/chatter.ts's Voices). The user (11 Nov): "Have it nearby because you want to
   run in to [Kikkit] first, because then it's like the point is you want to go find the other person to
   help you", and of riding along: "I don't think they need to be aboard, to be honest. I like Kikkit
   just kind of on her island. It works." */
import { describe, expect, it } from 'vitest';
import { TZZ, TZZ_CAST, TZZ_MOOR, TZZ_SAYS, TZZ_STANDS, Visit, inTzzEarshot, lesson, lessonSecs, offShot, onTzzLanding, tzzAt, tzzShore, tzzShot } from '../src/den-tzz';
import { KIKKIT, KIKKIT_CAST, KIKKIT_SAYS, KIKKIT_STANDS, kikkitAt, onKikkitLanding, inEarshot, youWonder } from '../src/den-kikkit';
import { LAY, SAIL, Sea, checkpointWorks } from '../src/den-sail';
import { isleAt, onIsleLanding } from '../src/den-isle';
import { BalloonShow, ROUTINES, marks, perform, plan } from '../src/balloons';
import { Chatter, Voices } from '../src/chatter';
import { readSecs } from '../src/den-dignity';
import { CHART, NOTES, WHIRLPOOLS } from '../src/den-map';
import { RAMBLE, TANGENTS } from '../src/lines/kikkit';
import { AFTER_KIKKIT } from '../src/lines/you';
import { GREET, DOUBLE, BINGO, AFTER } from '../src/lines/tzz';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The wardrobe, read from js/den-look.js (it needs three.js to run). */
const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8').replace(/\r\n/g, '\n');

const T = LAY.TZZ;
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Every square of the sea. */
const SQUARES = Array.from({ length: SAIL.COLS * SAIL.ROWS }, (_, i) => [i % SAIL.COLS, Math.floor(i / SAIL.COLS)] as [number, number]);
/** The water round her island, where her lesson's seen. */
const RING = SQUARES.filter(([c, r]) => onTzzLanding(c, r));

describe('her island: a hop from Kikkit\'s, nearer the start, in plain sight', () => {
  it('is land, sailed round, whatever the sea, and its water is always open', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of T.LAND) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); expect(tzzAt(c, r)).toBe(true); }
      for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onTzzLanding(c, r)) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
    }
  }, 30000);

  it('is on nobody else\'s land or water: not Kikkit\'s, not the Wedding Isle\'s, no wind, no whirlpool, no rock', () => {
    const s = new Sea(9);
    for (const [c, r] of [...T.LAND, ...RING]) {
      expect(kikkitAt(c, r) || isleAt(c, r) || onKikkitLanding(c, r) || onIsleLanding(c, r), `${c},${r}`).toBe(false);
      expect(s.windAt(c, r)).toBeUndefined();
      expect(s.whirls.has(`${c},${r}`)).toBe(false);
      expect(LAY.FAR.concat(LAY.SIDES).some(([a, b]) => a === c && b === r)).toBe(false);
    }
  });

  it('is a hop from Kikkit\'s, on the den\'s side of it (nearer the start), short of the checkpoint', () => {
    const mid = [TZZ_STANDS.c, TZZ_STANDS.r], kik = [KIKKIT_STANDS.c, KIKKIT_STANDS.r];
    // (a hop: a few squares' sail, moved a little further off on 11 Nov, below)
    expect(dist(mid, kik)).toBeLessThan(9);
    const kikkitTop = Math.min(...LAY.KIKKIT.LAND.map(([, r]) => r));
    for (const [, r] of T.LAND) { expect(r).toBeLessThan(kikkitTop); expect(r).toBeLessThan(LAY.CHECKPOINT.ROW); }
  });

  it('11 Nov: well away from the whirlpools and the reef\'s gap ("maybe they need to be a little bit further away from each other")', () => {
    // Sailing by her island with the Sailing board open, a chain blew her through the whirlpools to
    // Dignity (tests/den-sailing.test.ts). Her island and the water round it are well off the way
    // through and the reef, so sailing about her you're nowhere near the secret way round.
    const s = new Sea(9), way = [...s.passage, ...s.reef].map((k) => k.split(',').map(Number));
    for (const [c, r] of [...T.LAND, ...RING]) for (const [a, b] of way) expect(Math.max(Math.abs(a - c), Math.abs(b - r)), `${c},${r} to ${a},${b}`).toBeGreaterThanOrEqual(6);
  });

  it('11 Nov: her island has room of its own, open sea round it (it was "crammed into the middle")', () => {
    // Nothing within two squares of her island but open water: no one else's land or landing, no rock,
    // no wind, no whirlpool, and the board's edge no nearer.
    const s = new Sea(9), works = new Set(checkpointWorks().map(([c, r]) => `${c},${r}`));
    for (const [lc, lr] of T.LAND) for (let c = lc - 2; c <= lc + 2; c++) for (let r = lr - 2; r <= lr + 2; r++) {
      if (tzzAt(c, r)) continue;
      expect(c >= 0 && c < SAIL.COLS && r >= 0 && r < SAIL.ROWS, `${c},${r} on the board`).toBe(true);
      expect(s.open(c, r), `${c},${r}`).toBe(true);
      expect(s.windAt(c, r)).toBeUndefined();
      expect(kikkitAt(c, r) || isleAt(c, r) || onKikkitLanding(c, r) || onIsleLanding(c, r) || works.has(`${c},${r}`), `${c},${r}`).toBe(false);
    }
  });

  it('a new player can sail there from the mooring, under sail', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = new Sea(seed);
      expect(s.plot(SAIL.HOME, TZZ_MOOR.c, TZZ_MOOR.r), `seed ${seed}`).not.toBeNull();
    }
  }, 30000);

  it("the whirlpools are one point of interest on the map, no island named (11 Nov)", () => {
    expect(CHART.tzz.shore.length).toBe(tzzShore().length);
    expect(NOTES.some((n) => /tzz|kikkit/i.test(n.label + (n.note ?? '')))).toBe(false);
    const w = NOTES.find((n) => n.label === WHIRLPOOLS.label)!;
    expect(w.note).toMatch(/way through/);
    // (written off both islands, not on them)
    for (const [c, r] of [...T.LAND, ...LAY.KIKKIT.LAND]) expect(Math.abs(w.at[0] - c) < 0.6 && Math.abs(w.at[1] - r) < 0.6).toBe(false);
  });
});

describe('you hear whoever\'s nearest (Kikkit\'s island and hers are a hop apart)', () => {
  const v = new Voices();
  v.add('kikkit', { c: KIKKIT_STANDS.c, r: KIKKIT_STANDS.r, earshot: KIKKIT.EARSHOT });
  v.add('tzz', { c: TZZ_STANDS.c, r: TZZ_STANDS.r, earshot: TZZ.EARSHOT });
  it('off Tzz\'s island, Tzz (Kikkit hushes, if she\'s within earshot too)', () => {
    for (const [c, r] of RING) {
      expect(v.heard(c, r)).toBe('tzz');
      expect(v.hears('kikkit', c, r)).toBe(false);
    }
  });
  it('off Kikkit\'s, Kikkit', () => {
    const L = LAY.KIKKIT.LANDING;
    for (let c = L.c0; c <= L.c1; c++) for (let r = L.r0; r <= L.r1; r++) expect(v.heard(c, r)).toBe('kikkit');
  });
  it('out of everyone\'s earshot, nobody; and a talker nobody added goes by its own earshot', () => {
    expect(v.heard(SAIL.HOME.c, SAIL.HOME.r)).toBeNull();
    expect(new Voices().hears('anyone', 0, 0)).toBe(true);
  });
  it('her own earshot reaches the water round her island', () => {
    for (const [c, r] of RING) expect(inTzzEarshot(c, r)).toBe(true);
  });
});

describe('you wonder aloud, once Kikkit\'s told it all, and only then (11 Nov)', () => {
  /** Kikkit talking, played a tenth at a time while you're near: her lines, and the tick you'd wonder. */
  function hear(secs: number) {
    const k = new Chatter(KIKKIT_SAYS, { secs: readSecs, gap: 0, wait: 0 }), lines: string[] = [];
    let wondered = -1;
    k.start();
    for (let t = 0; t < secs; t += 0.1) {
      const l = k.tick(0.1, true);
      if (l) lines.push(l);
      if (wondered < 0 && youWonder(k, false)) wondered = lines.length;
    }
    return { k, lines, wondered };
  }
  it('not while she\'s still rambling', () => {
    const { lines, wondered } = hear(10);
    expect(lines.length).toBeLessThan(RAMBLE.length);
    expect(wondered).toBe(-1);
  });
  it('right after her last line of it, in a quiet beat before her tangents', () => {
    const { lines, wondered } = hear(RAMBLE.reduce((a, l) => a + readSecs(l), 0) + 1);
    expect(wondered).toBe(RAMBLE.length);
    expect(lines).toEqual([...RAMBLE]);
    expect(KIKKIT_SAYS.afterIntro).toBeGreaterThan(2);
    const after = hear(RAMBLE.reduce((a, l) => a + readSecs(l), 0) + (KIKKIT_SAYS.afterIntro ?? 0) + 1).lines;
    expect(after[RAMBLE.length]).toBe(TANGENTS[0]);
  });
  it('hailed through her ramble with Space, the same: after its last line', () => {
    const k = new Chatter(KIKKIT_SAYS, { secs: readSecs });
    for (let i = 0; i < RAMBLE.length; i++) { k.hail(); expect(youWonder(k, false)).toBe(false); }
    k.hail();
    expect(youWonder(k, false)).toBe(true);
  });
  it('once: never again after you have', () => {
    const { k } = hear(200);
    expect(youWonder(k, true)).toBe(false);
  });
  it('it\'s your line, set after hers, and it never says who, or where (RULES.md, "Hidden gems, never hinted")', () => {
    expect(KIKKIT_CAST.her.then).toBe(AFTER_KIKKIT);
    expect(AFTER_KIKKIT).toMatch(/fewer tangents/);
    expect(AFTER_KIKKIT).not.toMatch(/tzz|island|left|right|north|south|east|west|over there|near/i);
  });
});

describe('her lesson starts from anywhere close by, and the sloop keeps out of its shot (11 Nov, first play)', () => {
  it("11 Nov: her lesson starts from any square beside her island (\"you've got to go straight in front\")", () => {
    for (const [lc, lr] of T.LAND) for (let c = lc - 1; c <= lc + 1; c++) for (let r = lr - 1; r <= lr + 1; r++) {
      expect(onTzzLanding(c, r), `${c},${r}`).toBe(!tzzAt(c, r));
    }
    // (all round it: in front of it, behind it, either end)
    const cs = RING.map(([c]) => c), rs = RING.map(([, r]) => r);
    for (const [c, r] of T.LAND) {
      expect(Math.min(...cs)).toBeLessThan(c); expect(Math.max(...cs)).toBeGreaterThan(c);
      expect(Math.min(...rs)).toBeLessThan(r); expect(Math.max(...rs)).toBeGreaterThan(r);
    }
    // (and not from further off)
    for (const [c, r] of SQUARES) if (onTzzLanding(c, r)) expect(T.LAND.some(([x, y]) => Math.max(Math.abs(x - c), Math.abs(y - r)) === 1)).toBe(true);
    // Each square of it open water on any sea, so you can come up anywhere round it.
    for (let seed = 1; seed <= 4; seed++) { const s = new Sea(seed); for (const [c, r] of RING) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true); }
  });

  it("11 Nov: the sloop doesn't block the view of her and her board (\"then the [ship] blocks the view\")", () => {
    // As it begins she's brought alongside: beside her island, open water, and well out of the shot.
    expect(onTzzLanding(TZZ_MOOR.c, TZZ_MOOR.r)).toBe(true);
    const { cam, half } = tzzShot();
    expect(offShot(TZZ_MOOR.c, TZZ_MOOR.r)).toBeGreaterThan(half + 0.2);
    // (her hull, bow to stern, a square long, the way she lies)
    const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
    for (const u of [-0.5, 0.5]) expect(offShot(TZZ_MOOR.c + DC[TZZ_MOOR.d] * u, TZZ_MOOR.r + DR[TZZ_MOOR.d] * u)).toBeGreaterThan(half);
    // Her and her board in it, side by side across it; the camera out on open water, off her island.
    const C = TZZ_CAST;
    for (const at of [C.her.at, C.board.at]) expect(offShot(at[0], at[1])).toBeLessThan(half * 0.6);
    expect(tzzAt(Math.round(cam[0]), Math.round(cam[1]))).toBe(false);
    expect(new Sea(9).open(Math.round(cam[0]), Math.round(cam[1]))).toBe(true);
  });
});

describe('her lesson: a Double, then a Bingo, on a real board; she sets them up, you do the pop (11 Nov)', () => {
  it('the Double first, "that\'s what zooms you over a whirlpool", then a Bingo', () => {
    const L = lesson(false);
    expect(L.map((a) => perform(a.routine).name)).toEqual(['Double', 'Bingo!']);
    expect(L.map((a) => a.routine)).toEqual([ROUTINES.double, ROUTINES.bingo]);
    expect(L[0].says?.popped).toMatch(/zooms you over a whirlpool/);
  });
  it('11 Nov: she says what each balloon\'s for, the real move: one short, a line, its partner dropping in', () => {
    expect(DOUBLE.start).toMatch(/one short/);
    expect(DOUBLE.twists.join(' ')).toMatch(/square of its own colour/);
    expect(BINGO.twists.join(' ')).toMatch(/top gap's your trigger/);
    expect(Object.values(BINGO.watch).join(' ')).toMatch(/Nothing goes over it, so a balloon can drop straight in/);
    // (no ledges or stairs any more: those were the bodged routines)
    expect(JSON.stringify([DOUBLE, BINGO, AFTER])).not.toMatch(/ledge|\bstairs?\b/i);
  });
  it('12 Nov, "she says, bingo, go clear some whirlpools, but we need a Vegas to get that far": her Bingo send-off points you on to a Vegas', () => {
    const end = BINGO.popped;
    expect(end).toMatch(/Vegas/);
    // (true to the rules: a Bingo is four pops, a Vegas six, two more)
    expect(end).toMatch(/Four pops/);
    expect(end).toMatch(/Two more/);
    expect(perform(ROUTINES.bingo).name).toBe('Bingo!');
    // (and none of her lines has a Bingo, or anything short of a Vegas, getting you through the whirlpools)
    for (const l of [...Object.values(BINGO).flat(), ...AFTER]) if (/whirl/i.test(String(l)) && !/Vegas/.test(String(l))) expect(String(l)).not.toMatch(/Bingo|clear|through/i);
  });
  it('12 Nov, "what\'s the plan?": she says the Bingo\'s plan before she builds upstairs: the bottom blues wait for a blue from upstairs', () => {
    expect(BINGO.start).toMatch(/drop a blue onto it/);
    expect(BINGO.twists[3]).toMatch(/wait.*blue.*upstairs/i);
    expect(BINGO.brief).toMatch(/plan/i);
    expect(DOUBLE.brief).toMatch(/plan/i);
  });
  it('11 Nov: her lesson ends in character, not on a key to press ("it still says r for sailing which seems odd")', () => {
    const L = lesson(false), end = L[L.length - 1].says?.popped ?? '';
    expect(end).not.toMatch(/\bR\b|press|key/);
    expect(JSON.stringify([GREET, DOUBLE, BINGO, AFTER])).not.toMatch(/\bR (gets|for)\b/);
  });
  it('now you try: in each, the last pair\'s yours, with a line handing it you, egging you on if you miss, and showing you after all', () => {
    for (const a of lesson(false)) {
      expect(a.you).toBe(true);
      expect(a.says?.twists).toHaveLength(a.routine.twists.length - 1);
      expect(a.says?.yours).toBeTruthy();
      expect(a.says?.again?.length).toBeGreaterThan(0);
      expect(a.says?.help).toBeTruthy();
    }
    expect([DOUBLE, BINGO].map((s) => s.twists.length)).toEqual([4, 9]);
  });
  /* The user, 11 Nov: "her [important] instructions disappear very quickly. Like ... when she's telling
     me blue over the yellow and top the stack, that should be a lot clearer that it's just not her being
     a bit just chatting. It's an actual instruction to you, and it should be more prominent and
     persistent." */
  it('11 Nov, "it\'s an actual instruction to you": each act\'s instructions apart from her chatter, the task naming your pair\'s colours and where each goes', () => {
    const NAME = ['blue', 'yellow', 'white'];
    for (const a of lesson(false)) {
      const S = a.says!, t = a.routine.twists[a.routine.twists.length - 1];
      expect(S.brief && S.task && S.chain).toBeTruthy();
      // (the task's said once, in the panel, not again in her bubble)
      expect(S.yours).not.toContain(S.task);
      const named = NAME.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(S.task!));
      expect(named.sort()).toEqual([...new Set(t.pair.map((c) => NAME[c]))].sort());
      expect(S.task).toMatch(/gap/);
      // (and what to watch pop, by number, as the board numbers it)
      expect(S.chain!.match(/\d/g)!.map(Number)).toEqual(plan(a.routine).pops.map((p) => p.n));
    }
  });
  it('11 Nov, shown, then named: each of her notes once its mark is on the board, and "trigger" only once the gap is, said what it is', () => {
    for (const a of lesson(false)) {
      const S = a.says!, r = a.routine, last = r.twists.length - 1;
      // (each watch note comes as something new is marked on the board, and a gap's named once it's shown)
      for (const [i, text] of Object.entries(S.watch ?? {})) {
        const n = Number(i) + 1, now = marks(r, n), was = marks(r, n - 1).map((m) => JSON.stringify(m));
        expect(now.some((m) => !was.includes(JSON.stringify(m))), text).toBe(true);
        if (/\bgap\b/.test(text)) expect(now.some((m) => m.kind === 'gap' && !m.faint), text).toBe(true);
      }
      // (her lines in the order they come, each with how many of her pairs are down by then)
      const said: [number, string][] = [
        [0, S.start ?? ''], [0, S.brief ?? ''],
        ...(S.twists ?? []).flatMap((x, i): [number, string][] => [[i, x], [i + 1, S.watch?.[i] ?? '']]),
        [last, S.yours ?? ''], [last, S.task ?? ''],
      ];
      const first = said.find(([, x]) => /trigger/i.test(x));
      expect(first).toBeDefined();
      expect(marks(r, first![0]).some((m) => m.kind === 'gap' && !m.faint)).toBe(true);
    }
    // (and the first time, what a trigger is, simply)
    expect(DOUBLE.yours).toMatch(/gap's the trigger: fill it last, and the whole lot pops/);
  });
  it('she greets you knowing you\'ve heard Kikkit out, once you have', () => {
    expect(lesson(false)[0].says?.start).toContain(GREET.plain);
    expect(lesson(true)[0].says?.start).toContain(GREET.heard);
    expect(GREET.heard).toMatch(/Kikkit/);
  });
  it('her lines are up long enough to read', () => {
    const show = new BalloonShow(lesson(true), lessonSecs);
    for (const b of show.beats) if (b.line) expect(b.secs).toBeGreaterThanOrEqual(b.line.length / 20);
  });
  it('it calls it Sailing, never "the rigging" (11 Nov: "It\'s supposed to be sailing, not rigging")', () => {
    expect(JSON.stringify([GREET, DOUBLE, BINGO, AFTER])).not.toMatch(/rigging/i);
  });
  it('plays the first time you come up off her island, settled, and again when you ask', () => {
    const v = new Visit();
    expect(v.again(true, true)).toBe(false);   // (the first time, it begins as you come up)
    expect(v.arrive(false, true)).toBe(false);
    expect(v.arrive(true, false)).toBe(false);   // (still being carried, say)
    expect(v.arrive(true, true)).toBe(true);
    expect(v.arrive(true, true)).toBe(false);
    expect(v.arrive(false, true)).toBe(false);
    expect(v.arrive(true, true)).toBe(false);   // (once a voyage by itself)
    expect(v.again(true, true)).toBe(true);
    expect(v.again(false, true)).toBe(false);
  });
  it('after it, her tips round and round while you\'re near', () => {
    expect(TZZ_SAYS.loop).toEqual(AFTER);
    expect(TZZ_SAYS.intro).toBeUndefined();
  });
});

describe('she\'s only config, and the wardrobe has all she wears (RULES.md, "A character is only config")', () => {
  it('her look is a wardrobe look: PIRATES.Tzz, from her portrait', () => {
    expect(TZZ_CAST.her.look).toBe('Tzz');
    const her = LOOK_JS.match(/\n {2}Tzz: \{([\s\S]*?)\n {2}\},/)![1];
    for (const bit of ["body: 'f'", "hair: 'ponytail'", "hairCol: 'light brown'", 'patch: true', 'earring: true', 'smile: true', 'pegleg: true',
      "top: 'rag'", "topCol: 'light blue'", "legs: 'knickers'", "legsCol: 'blue'", "feet: 'bare'", "fam: 'dragon'", "famCol: 'silver'", "famCol2: 'vibrant red'"]) expect(her).toContain(bit);
  });
  it('the Rag shirt, Stripy knickers and the dragon are in the wardrobe for anyone, by YPPedia\'s names; the peg leg an injury like the hook', () => {
    const parts = LOOK_JS.match(/export const PARTS = \{[\s\S]*?\n\};/)![0];
    expect(parts.match(/\['rag', 'Rag shirt'\]/g)).toHaveLength(2);
    expect(parts.match(/\['knickers', 'Stripy knickers'\]/g)).toHaveLength(2);
    expect(parts.match(/\['dragon', 'Dragon', 1\]/g)).toHaveLength(2);
    expect(LOOK_JS).toMatch(/silver: '#[0-9a-f]{6}', 'vibrant red': '#[0-9a-f]{6}'/);
    expect(LOOK_JS).toMatch(/'light brown': '#[0-9a-f]{6}'/);
    expect(LOOK_JS).toContain("['patch', 'smile', 'hook', 'tongue', 'tattoos', 'wristband', 'starfish', 'pegleg']");
  });
});
