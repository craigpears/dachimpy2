/* The imperial checkpoint (src/den-checkpoint.ts), on the sloop's sea (src/den-sail.ts). */
import { describe, expect, it } from 'vitest';
import { CHECK, Checkpoint, isCheckpoint, throughSay, type CheckEvent } from '../src/den-checkpoint';
import { LAY, SAIL, Sea, Helm, broadside, type Move, type Pose } from '../src/den-sail';
import { Wind } from '../src/den-wind';
import { Salvage } from '../src/den-haul';
import { carp, stilled } from './helpers';
import type { DeckHole } from '../src/den-patch';
import type { Cell } from '../src/engine';

const K = LAY.CHECKPOINT;
/** Where the main shipping lane drops her: just short of the guns, facing the gate. */
const SHORT: Pose = { c: K.GATE, r: 15, d: 0 };
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
const fill = (hole: DeckHole) => { for (const p of carp.solve(hole.open(), 1)[0]) expect(hole.put(p.letter, norm(p.cells), ...at(p.cells))).toBe(true); };

/** Run her a while under the checkpoint's guns: hits hole her (patched at once if `patch`), and
    what she does at the checkpoint is said. `each` is called every step (to row, say). */
function run(h: Helm, cp: Checkpoint, secs: number, { patch = true, each }: { patch?: boolean; each?: (t: number) => void } = {}) {
  const said: CheckEvent[] = [];
  let hits = 0, fired = 0;
  for (let t = 0; t < secs; t += 1 / 60) {
    each?.(t);
    h.tick(1 / 60);
    for (const e of cp.battery.tick(1 / 60, h.spared() ? null : h.now())) {
      if (e.kind === 'fire') fired++;
      if (e.kind === 'land' && e.hit) { h.hit(); cp.holed(); hits++; }
    }
    said.push(...cp.watch(h.pose));
    if (patch && h.dazed()) fill(h.hole!);
  }
  return { said, hits, fired };
}
const rowing = (sea = new Sea(9), pose = SHORT) => { const h = new Helm(sea, pose); h.row(true); return h; };

describe('the lay: the main shipping lane runs out to an imperial checkpoint (10 Nov)', () => {
  it('the board grew, and the near sea is as it was rebuilt round the checkpoint', () => {
    expect([SAIL.COLS, SAIL.ROWS]).toEqual([22, 26]);
    // The rocks of the near sea (seed 9: the den's): as before it grew, less the turret's rock, and
    // as the lanes were laid again round the checkpoint (10 Nov); and the cliffs the canal's chain
    // of locks is cut through, the hidden cove narrower behind the first lock (10 Nov); then the
    // locks in one straight line, their mouth tucked away in the cliffs' face toward the den, and
    // the water by the junction where the canal was let go (a rock off it now) (10 Nov); then the
    // harbour's arms at the canal's mouth (LAY.HARBOUR, 10 Nov); then the clump off the Wedding
    // Isle's jetty gone, its landing kept clear (11 Nov).
    const was = ['0,8', '1,8', '10,8', '12,12', '12,4', '14,8', '2,8', '4,8', '5,10', '5,12', '5,13', '5,8', '5,9', '8,5',
      '2,9', '2,10', '2,11', '2,12', '2,13', '4,9', '4,10', '4,11', '4,12', '4,13', '5,11', '7,12',
      '1,7', '1,6', '1,5', '0,7', '0,6', '5,7', '5,6', '5,5', '5,4', '6,7', '6,6'];
    const s = new Sea(9), old = [...s.rocks].filter((k) => { const [c, r] = k.split(',').map(Number); return c < 16 && r < 14; }).sort();
    expect(old).toEqual(was.sort());
  });

  it('on from the junction, the trade winds carry her to just short of its guns, facing its gate', () => {
    const s = new Sea(9), [jc, jr] = LAY.JUNCTION, h = new Helm(s, { c: jc, r: jr, d: 0 });
    expect(s.sail(h.pose, 'F').to).toEqual(SHORT);
    const cp = new Checkpoint();
    expect(cp.battery.gunFor(SHORT.c, SHORT.r)).toBe(-1);
  });

  it('its line is closed but for the gate, and the locks cut through its headland (the reef\'s end closed, 10 Nov)', () => {
    // (Kikkit's whirlpools' winds through the reef are a way past of their own: tests/den-kikkit.test.ts)
    const s = new Sea(9), open = [];
    for (let c = 0; c < SAIL.COLS; c++) if (s.open(c, K.ROW) && s.windAt(c, K.ROW) === undefined) open.push(c);
    expect(open).toEqual([LAY.LOCKS[3].at[0], K.GATE]);
    expect(K.REEF.c1).toBe(SAIL.COLS - 1);
    expect(isCheckpoint(s, ...K.GUNS[0])).toBe(true);
    expect(isCheckpoint(s, ...K.PIERS[1])).toBe(true);
    expect(isCheckpoint(s, K.REEF.c0, K.ROW)).toBe(false);
  });

  it('every open square can still be reached, and the old sea\'s ways still work', () => {
    const s = new Sea(9), h = new Helm(s);
    // (into the hidden cove, up the locks; and out past the checkpoint to the wreck)
    expect(s.plot(SAIL.HOME, LAY.COVE.c0 + 1, LAY.COVE.r0 + 1, null, true)).not.toBeNull();
    expect(s.plot(SAIL.HOME, LAY.WRECK[0] + 1, LAY.WRECK[1], null, true)).not.toBeNull();
    expect(h.drop(LAY.JUNCTION[0] + 1, LAY.JUNCTION[1] + 1)).not.toBeNull();
  });
});

describe('"get through the Imperial checkpoint by doing slow row and then fast rowing with the Vegas" (10 Nov)', () => {
  it('its guns are trained on squares of the way through, and out of their reach she\'s safe', () => {
    const cp = new Checkpoint(), h = rowing();
    const r = run(h, cp, 20);
    expect(r.fired).toBe(0);
    for (const ms of CHECK.MARKS) for (const [c, rr] of ms) expect(new Sea(9).open(c, rr)).toBe(true);
    expect(CHECK.MARKS.flat().some(([c, rr]) => c === K.GATE && rr === K.ROW)).toBe(true);
  });

  it('quick small clears keep her moving but walk her into the guns', () => {
    // A square rowed at a time, as quick as she rows them: she stops on each, the marks too.
    const cp = new Checkpoint(), h = rowing();
    const r = run(h, cp, 40, { each: () => { if (!h.strokes.length && h.slot < 0 && !h.dazed() && h.pose.r < 24) h.stroke(['F']); } });
    expect(r.hits).toBeGreaterThanOrEqual(1);
    expect(r.said).toContainEqual({ kind: 'through', how: 'gate', back: false, hits: r.hits });
  });

  it('a combo big enough to row two squares at once skips the gun\'s square', () => {
    // From the square before a mark, two squares rowed as one go straight over it.
    const cp = new Checkpoint(), h = rowing(new Sea(9), { c: K.GATE, r: 16, d: 0 });
    h.stroke(['F', 'F']);
    const r = run(h, cp, 6);
    expect(h.pose.r).toBe(18);
    expect(r.hits).toBe(0);
    expect(r.fired).toBe(1);   // (it fired, and missed)
  });

  it('a Vegas on each side rushes her through the lot at the trade winds\' pace', () => {
    const cp = new Checkpoint(), h = rowing();
    h.stroke(Array<Move>(10).fill('F'));   // (a Vegas each side: 30 of pull, ten squares)
    const r = run(h, cp, 6);
    expect(h.pose.r).toBe(SHORT.r + 10);
    expect(r.hits).toBe(0);
    expect(r.said).toContainEqual({ kind: 'through', how: 'gate', back: false, hits: 0 });
    expect(throughSay({ kind: 'through', how: 'gate', back: false, hits: 0 })).toBe('Through the checkpoint! Not a scratch on her');
  });

  it('"you need some chance to actually sail through" (10 Nov): a hit or two at most, never one after another', () => {
    // A square rowed at a time, stopping on every mark: each gun has her once, then holds its fire.
    const cp = new Checkpoint(), h = rowing();
    const r = run(h, cp, 60, { each: () => { if (!h.strokes.length && h.slot < 0 && !h.dazed() && h.pose.r < 24) h.stroke(['F']); } });
    expect(r.hits).toBeLessThanOrEqual(K.GUNS.length);
    expect(h.pose.r).toBe(24);
    // Sailed by hand a square at a time, as boldly as it gets: the same.
    const c2 = new Checkpoint(), s = new Helm(new Sea(9), SHORT);
    const r2 = run(s, c2, 80, { each: () => { if (!s.mine.length && s.slot < 0 && !s.dazed() && s.pose.r < 24) s.put('F'); } });
    expect(r2.hits).toBeGreaterThanOrEqual(1);
    expect(r2.hits).toBeLessThanOrEqual(K.GUNS.length);
    expect(s.pose.r).toBe(24);
    // "Not things you just casually get through on the first try ... it should be work": a pin
    // beyond it under sail, the boldest run there is, and the gatehouse's walls take the wind out of
    // her sails (light airs: LAY.ZONES), so she ghosts through the gate on its gun's mark: a hit,
    // patched, and through.
    const c3 = new Checkpoint(), p = new Helm(new Sea(9), SHORT);
    expect(p.sea.airAt(K.GATE, K.ROW)).toMatchObject({ s: 1, felt: true });
    p.drop(K.GATE, 23);
    expect(run(p, c3, 40).hits).toBe(1);
    expect(p.pose.r).toBe(23);
    // Out of its sight, and back: its guns are fresh again.
    expect(c2.battery.scored.some(Boolean)).toBe(true);
    c2.watch({ c: K.GATE, r: 10 });
    expect(c2.battery.scored.some(Boolean)).toBe(false);
  });

  it('a big combo leaves her sitting still while you build it: on a mark, she\'s hit', () => {
    const cp = new Checkpoint(), h = rowing(new Sea(9), { c: K.GATE, r: 17, d: 0 });
    const r = run(h, cp, 3, { patch: false });
    expect(r.hits).toBe(1);
    expect(h.dazed()).toBe(true);
    // Dazed, then patched, its guns hold fire a while so she can get going (as the turret's did).
    expect(run(h, cp, 10, { patch: false }).fired).toBe(0);
  });
});

describe('running it under sail (10 Nov)', () => {
  const sailing = (d: number) => { const s = new Sea(9); s.breeze = new Wind(1, d, 2); return new Helm(s, SHORT); };

  it('a good wind behind her gets her through quick', () => {
    const h = sailing(0), cp = new Checkpoint();
    h.drop(K.GATE, 23);
    const r = run(h, cp, 25);
    expect(h.pose.r).toBe(23);
    expect(r.said.some((e) => e.kind === 'through' && e.how === 'gate')).toBe(true);
  });

  it('with the wind across her she\'s hit, and patched by Carpentry, and through', () => {
    const h = sailing(1), cp = new Checkpoint();
    h.drop(K.GATE, 23);
    const r = run(h, cp, 40);
    expect(r.hits).toBeGreaterThanOrEqual(1);
    expect(h.pose.r).toBe(23);
    expect(r.said.find((e) => e.kind === 'through')).toMatchObject({ how: 'gate', back: false, hits: r.hits });
    expect(throughSay({ kind: 'through', how: 'gate', back: false, hits: 1 })).toBe('Through the checkpoint! Holed once, patched, and through');
  });
});

describe('or round it by the locks, the secret way (10 Nov)', () => {
  it('up the canal and down through its headland, out of its sight and never a shot fired', () => {
    // (The chain of locks itself: tests/den-lock.test.ts.)
    const mouth = LAY.CANAL[LAY.CANAL.length - 1], s = stilled(new Sea(9)),   // (its mouth's wind stilled: den-wind.test.ts)
      h = new Helm(s, { c: mouth[0], r: mouth[1], d: LAY.LOCKS[0].up }), cp = new Checkpoint();
    const pump = () => { if (h.working()) h.pump(0.5); };
    // Pins along the way: up on the clifftop, then beyond, by the wreck.
    const legs: [number, number][] = [[LAY.LOCKS[1].at[0], 16], [LAY.WRECK[0] - 1, LAY.WRECK[1]]];
    let fired = 0;
    const said: CheckEvent[] = [];
    for (const leg of legs) {
      h.drop(...leg);
      const r = run(h, cp, 200, { each: pump });
      fired += r.fired; said.push(...r.said);
      expect([h.pose.c, h.pose.r]).toEqual(leg);
    }
    expect(fired).toBe(0);
    expect(said).toContainEqual({ kind: 'through', how: 'locks', back: false, hits: 0 });
    expect(said.find((e) => e.kind === 'sighted')).toBeUndefined();
    expect(throughSay({ kind: 'through', how: 'locks', back: false, hits: 0 })).toMatch(/by the locks/);
  });

  it('no hint of another way round as she sights it: hidden gems you work out (10 Nov)', () => {
    // "I don't like it giving you a hint as to what you can do ... I like these just to be hidden
    // gems that you work out": sighting it from the trade wind's run is all that happens.
    const cp = new Checkpoint(), s = new Sea(9), [jc, jr] = LAY.JUNCTION, h = new Helm(s, { c: jc, r: jr - 6, d: 0 });
    const said: CheckEvent[] = [];
    h.put('F'); h.put('F');   // (onto the lane to the junction, and on up the main lane)
    for (let t = 0; t < 10; t += 0.05) { h.tick(0.05); const e = cp.watch(h.pose); if (e.length) expect([h.pose.c, h.pose.r]).toEqual([SHORT.c, SHORT.r]); said.push(...e); }
    expect(said).toEqual([{ kind: 'sighted' }]);
    expect(cp.watch(SHORT)).toEqual([]);
  });
});

describe('the wreck beyond it, hauled up by Treasure Haul', () => {
  it('stands on the open sea out of reach of its guns, and she can stop beside it to haul', () => {
    const s = new Sea(9), [wc, wr] = LAY.WRECK;
    expect(s.open(wc, wr)).toBe(false);
    expect(s.works.has(`${wc},${wr}`)).toBe(true);
    const cp = new Checkpoint();
    for (let c = wc - 1; c <= wc + 1; c++) for (let r = wr - 1; r <= wr + 1; r++) {
      expect(cp.battery.gunFor(c, r)).toBe(-1);
      // (and out of their reach once they're firing on her, too)
      for (let g = 0; g < K.GUNS.length; g++) expect(cp.battery.reaches(g, c, r)).toBe(false);
    }
    const h = new Helm(s, { c: wc + 1, r: wr, d: 0 });
    expect(new Salvage([wc, wr]).canStart(h)).toBe(true);
  });
});

/** A broadside of hers from (c, r) facing d, and where it comes down on the checkpoint, if it does. */
const fireOn = (s: Sea, cp: Checkpoint, c: number, r: number, d: number, side: 'L' | 'R') => {
  const shot = broadside(s, { c, r, a: d }, side);
  return shot.hit ? cp.shot(...shot.hit) : null;
};

describe('"just the same as the other one": its guns can be wrecked (10 Nov)', () => {
  // The user: the checkpoint's guns should be "just the same as the other one" (the turret): a hit
  // quietens a gun a while and the third wrecks it, "everything should be destructive". And it's a
  // fight: once she's fired on it, its guns fire on her too.
  const [g0c, g0r] = K.GUNS[0];

  it('her guns can reach a bastion: sailing across its gun\'s column, her broadside comes down on it', () => {
    const s = new Sea(9), cp = new Checkpoint();
    // Facing right on the near side, three squares short: port fires out to sea, up the gun's column.
    expect(fireOn(s, cp, g0c, g0r - 2, 1, 'L')).toEqual({ on: 'gun', gun: 0, did: 'quiet', first: true });
    // Facing right from beyond it, starboard fires back in at it.
    expect(fireOn(s, cp, g0c, g0r + 2, 1, 'R')).toEqual({ on: 'gun', gun: 0, did: 'quiet', first: false });
    // A pier's only stone.
    expect(fireOn(s, cp, K.PIERS[1][0], K.ROW - 1, 1, 'L')).toEqual({ on: 'gatehouse', first: false });
    expect(cp.shot(5, 5)).toBeNull();
  });

  it('a hit quietens a gun ten seconds; the third wrecks it, and it never fires on its marks again', () => {
    const b = new Checkpoint().battery, mark = CHECK.MARKS[1][0];
    expect(b.hit(1)).toBe('quiet');
    expect(b.tick(CHECK.QUIET - 0.1, { c: mark[0], r: mark[1] }).some((e) => e.kind === 'fire' && e.gun === 1)).toBe(false);
    expect(b.tick(0.2, { c: mark[0], r: mark[1] })).toContainEqual({ kind: 'fire', gun: 1, to: mark, aimed: false, secs: CHECK.FLIGHT });
    expect([CHECK.QUIET, CHECK.WRECK]).toEqual([10, 3]);
    expect(b.hit(1)).toBe('quiet');
    expect(b.hit(1)).toBe('wrecked');
    expect(b.wrecked[1]).toBe(true);
    // Its last shot in the air still comes down, but it never fires again.
    const ev = b.tick(60, { c: mark[0], r: mark[1] });
    expect(ev.some((e) => e.kind === 'land' && e.gun === 1)).toBe(true);
    expect(b.tick(60, { c: mark[0], r: mark[1] }).some((e) => e.kind === 'fire' && e.gun === 1)).toBe(false);
    expect(b.hit(1)).toBeNull();
    // (each is a destructible turret: src/den-turret.ts)
    expect(b.guns[1].wrecked).toBe(true);
  });

  it('with both its guns wrecked, the way through is safe, a square at a time', () => {
    const cp = new Checkpoint(), h = rowing();
    for (let g = 0; g < K.GUNS.length; g++) for (let i = 0; i < CHECK.WRECK; i++) cp.battery.hit(g);
    expect(cp.battery.silenced()).toBe(true);
    const r = run(h, cp, 40, { each: () => { if (!h.strokes.length && h.slot < 0 && h.pose.r < 23) h.stroke(['F']); } });
    expect(r.fired).toBe(0);
    expect(r.said).toContainEqual({ kind: 'through', how: 'gate', back: false, hits: 0 });
  });

  it('once she\'s fired on it, its guns fire on her square wherever she\'s in their reach, the shot a while coming down', () => {
    const s = new Sea(9), cp = new Checkpoint(), b = cp.battery, near = { c: g0c, r: g0r - 2 };
    // Not before: off its marks, it leaves her be.
    expect(b.tick(5, near).some((e) => e.kind === 'fire')).toBe(false);
    fireOn(s, cp, g0c + 1, g0r - 3, 1, 'L');   // (on stone, a pier: it's a fight all the same)
    expect(b.roused).toBe(true);
    const fired = b.tick(0.1, near);
    expect(fired).toContainEqual({ kind: 'fire', gun: 0, to: [near.c, near.r], aimed: true, secs: CHECK.AIMED });
    // Still there when it comes down, she's hit; gone, it splashes down.
    expect(b.tick(CHECK.AIMED - 0.2, near).some((e) => e.kind === 'land')).toBe(false);
    expect(b.tick(0.2, near)).toContainEqual({ kind: 'land', gun: 0, to: [near.c, near.r], hit: true, aimed: true });
    b.tick(CHECK.AIMED_RELOAD, near);
    expect(b.tick(CHECK.AIMED, { c: near.c - 1, r: near.r })).toContainEqual({ kind: 'land', gun: 0, to: [near.c, near.r], hit: false, aimed: true });
    // Out of its reach, it holds fire.
    const far = { c: g0c, r: g0r - CHECK.REACH - 1 };
    b.tick(10, far);
    expect(b.tick(10, far).some((e) => e.kind === 'fire')).toBe(false);
  });

  it('a gun knocked quiet, or wrecked, doesn\'t fire on her either', () => {
    const cp = new Checkpoint(), b = cp.battery, near = { c: g0c, r: g0r - 1 };
    cp.shot(g0c, g0r);
    expect(b.tick(CHECK.QUIET - 0.1, near).some((e) => e.kind === 'fire' && e.gun === 0)).toBe(false);
    expect(b.tick(0.2, near).some((e) => e.kind === 'fire' && e.gun === 0)).toBe(true);
    cp.shot(g0c, g0r); cp.shot(g0c, g0r);
    expect(b.tick(60, near).some((e) => e.kind === 'fire' && e.gun === 0)).toBe(false);
  });

  it('the turret fired again the moment she was patched (9 Nov): its guns hold fire a while once she is', () => {
    // "As soon as you finish the puzzle, the cannon starts shooting at you again ... literally
    // before you can do anything about it." So the checkpoint's guns, firing on her as the turret
    // did, hold fire a while once she's patched.
    const s = new Sea(9), cp = new Checkpoint(), h = new Helm(s, { c: g0c, r: g0r - 2, d: 1 });
    cp.battery.roused = true;
    h.hit();
    const r = run(h, cp, 20, { patch: false });
    expect(r.fired).toBe(0);   // dazed: no shots
    fill(h.hole!);
    expect(run(h, cp, SAIL.GRACE - 0.2, { patch: false }).fired).toBe(0);
    expect(run(h, cp, 0.4, { patch: false }).fired).toBeGreaterThan(0);   // (she's still in reach)
  });

  it('it calms down once she\'s out of its sight, and its guns go back to their marks', () => {
    const cp = new Checkpoint();
    cp.watch({ c: K.GATE, r: 16 });
    cp.shot(...K.PIERS[0]);
    expect(cp.watch({ c: K.GATE, r: 14 })).toEqual([]);
    expect(cp.battery.roused).toBe(true);
    expect(cp.watch({ c: K.GATE, r: 12 })).toEqual([{ kind: 'calm' }]);
    expect(cp.battery.roused).toBe(false);
    // (what's wrecked stays wrecked)
    for (let i = 0; i < CHECK.WRECK; i++) cp.shot(...K.GUNS[1]);
    cp.watch({ c: K.GATE, r: 12 });
    expect(cp.battery.wrecked).toEqual([false, true]);
  });

  it('the main lane still drops her out of its reach, so she can stop and load before a fight', () => {
    const cp = new Checkpoint();
    for (let g = 0; g < K.GUNS.length; g++) expect(cp.battery.reaches(g, K.GATE, 15)).toBe(false);
    const home = LAY.LANES[2];
    for (let g = 0; g < K.GUNS.length; g++) expect(cp.battery.reaches(g, ...home.at)).toBe(false);
  });
});
