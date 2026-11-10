/* The imperial checkpoint (src/den-checkpoint.ts), on the sloop's sea (src/den-sail.ts). */
import { describe, expect, it } from 'vitest';
import { CHECK, Checkpoint, isCheckpoint, throughSay, type CheckEvent } from '../src/den-checkpoint';
import { LAY, SAIL, Sea, Helm, broadside, type Move, type Pose } from '../src/den-sail';
import { Wind } from '../src/den-wind';
import { Salvage } from '../src/den-haul';
import { carp } from './helpers';
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
    // as the lanes were laid again round the checkpoint (10 Nov).
    const was = ['0,8', '1,8', '10,8', '12,12', '12,4', '14,10', '14,8', '14,9', '15,10', '15,9', '2,8', '3,8', '4,8', '5,10', '5,12', '5,13', '5,8', '5,9', '8,5'];
    const s = new Sea(9), old = [...s.rocks].filter((k) => { const [c, r] = k.split(',').map(Number); return c < 16 && r < 14; }).sort();
    expect(old).toEqual(was.sort());
  });

  it('on from the junction, the trade winds carry her to just short of its guns, facing its gate', () => {
    const s = new Sea(9), [jc, jr] = LAY.JUNCTION, h = new Helm(s, { c: jc, r: jr, d: 0 });
    expect(s.sail(h.pose, 'F').to).toEqual(SHORT);
    const cp = new Checkpoint();
    expect(cp.battery.gunFor(SHORT.c, SHORT.r)).toBe(-1);
  });

  it('its line is closed but for the gate and the reef\'s end (the long way round)', () => {
    const s = new Sea(9), open = [];
    for (let c = 0; c < SAIL.COLS; c++) if (s.open(c, K.ROW)) open.push(c);
    expect(open).toEqual([K.GATE, K.REEF.c1 + 1, K.REEF.c1 + 2]);
    expect(isCheckpoint(s, ...K.GUNS[0])).toBe(true);
    expect(isCheckpoint(s, ...K.PIERS[1])).toBe(true);
    expect(isCheckpoint(s, K.REEF.c0, K.ROW)).toBe(false);
  });

  it('room is kept for the crane over the headland, later', () => {
    const s = new Sea(9);
    expect(s.open(...K.LEDGE)).toBe(true);
    expect(s.open(...K.LANDING)).toBe(true);
    expect(s.open(K.LEDGE[0], K.ROW)).toBe(false);   // (the headland between them)
  });

  it('every open square can still be reached, and the old sea\'s ways still work', () => {
    const s = new Sea(9), h = new Helm(s);
    // (into the hidden cove, by the lock; and out past the checkpoint to the wreck)
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

describe('or round the long way', () => {
  it('past the reef\'s end, out of reach of its guns the whole way', () => {
    const s = new Sea(9), h = new Helm(s, SHORT), cp = new Checkpoint();
    // Pins along the long way: out to the right, past the reef's end, and back to the wreck.
    const legs: [number, number][] = [[K.REEF.c1 + 1, 17], [K.REEF.c1 + 2, 22], [LAY.WRECK[0] + 1, LAY.WRECK[1]]];
    let fired = 0;
    const said: CheckEvent[] = [];
    for (const leg of legs) {
      h.drop(...leg);
      const r = run(h, cp, 90, { each: () => {} });
      fired += r.fired; said.push(...r.said);
      expect([h.pose.c, h.pose.r]).toEqual(leg);
    }
    expect(fired).toBe(0);
    expect(said).toContainEqual({ kind: 'through', how: 'round', back: false, hits: 0 });
  });

  it('is a good deal longer than through the gate', () => {
    const s = new Sea(9), to: [number, number] = [LAY.WRECK[0] + 1, LAY.WRECK[1]];
    const gate = s.plot(SHORT, ...to, null, true)!.length;
    const round = s.plot(SHORT, K.REEF.c1 + 1, 17, null, true)!.length + s.plot({ c: K.REEF.c1 + 1, r: 17, d: 0 }, ...to, null, true)!.length;
    expect(round).toBeGreaterThanOrEqual(gate * 2);
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
