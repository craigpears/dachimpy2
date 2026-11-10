/* A destructible gun at sea (src/den-turret.ts): the one module for every gun that shoots at her,
   the checkpoint's bastion guns and any turret to come. */
import { describe, expect, it } from 'vitest';
import { TURRET, Turret } from '../src/den-turret';
import { SAIL, Sea, Helm } from '../src/den-sail';
import { carp } from './helpers';
import type { DeckHole } from '../src/den-patch';
import type { Cell } from '../src/engine';

const clearSea = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
const fill = (hole: DeckHole) => { for (const p of carp.solve(hole.open(), 1)[0]) expect(hole.put(p.letter, norm(p.cells), ...at(p.cells))).toBe(true); };
const fires = (ev: { kind: string }[]) => ev.some((e) => e.kind === 'fire');

describe('"there should be an object for a destructible turret ... just there to plug in" (10 Nov)', () => {
  it('shoots at the square she\'s on when she\'s in reach, and the shot takes a while to come down', () => {
    const t = new Turret({ at: [5, 5] });
    expect(t.tick(2, { c: 5, r: 9 })).toEqual([]);   // out of reach
    expect(t.tick(0.1, { c: 6.9, r: 7.2 })).toEqual([{ kind: 'fire', to: [7, 7], aimed: true, secs: TURRET.FLIGHT }]);
    expect(t.tick(TURRET.FLIGHT - 0.2, { c: 7, r: 7 })).toEqual([]);
    expect(t.tick(0.2, { c: 7, r: 7 })).toEqual([{ kind: 'land', to: [7, 7], hit: true, aimed: true }]);
  });

  it(`"you can shoot, but there's no guarantee": gone from that square by the time it lands, she's missed`, () => {
    const t = new Turret({ at: [5, 5] });
    t.tick(1, { c: 7, r: 7 });
    expect(t.tick(TURRET.FLIGHT, { c: 8, r: 7 })[0]).toEqual({ kind: 'land', to: [7, 7], hit: false, aimed: true });
  });

  it('loads between shots; a hit from her guns quietens it a while', () => {
    const t = new Turret({ at: [5, 5] }), here = { c: 6, r: 6 };
    t.tick(1, here);
    expect(fires(t.tick(TURRET.RELOAD - 0.1, here))).toBe(false);
    expect(fires(t.tick(0.2, here))).toBe(true);
    expect(t.hit()).toBe('quiet');
    expect(fires(t.tick(TURRET.QUIET - 0.1, here))).toBe(false);
    expect(fires(t.tick(0.2, null))).toBe(false);
    expect(fires(t.tick(0.1, here))).toBe(true);
  });

  it(`"it obviously needs to be destructible" (9 Nov): the third hit wrecks it for good`, () => {
    const t = new Turret({ at: [5, 5] }), here = { c: 7, r: 5 };
    expect([TURRET.QUIET, TURRET.WRECK]).toEqual([10, 3]);
    for (let i = 1; i < TURRET.WRECK; i++) {
      expect(t.hit()).toBe('quiet');
      expect(t.left()).toBe(TURRET.WRECK - i);
      expect(fires(t.tick(TURRET.QUIET - 0.1, here))).toBe(false);
      expect(fires(t.tick(0.2, here))).toBe(true);
    }
    expect(t.hit()).toBe('wrecked');
    expect(t.wrecked).toBe(true);
    // Its last shot in the air still comes down, but it never fires again.
    const ev = t.tick(60, here);
    expect(fires(ev)).toBe(false);
    expect(ev.some((e) => e.kind === 'land')).toBe(true);
    expect(t.tick(60, here)).toEqual([]);
    expect(t.hit()).toBeNull();
  });

  it('trained on marks: fires on her there, the shot down quicker; set up not alert, it leaves her be elsewhere till she fires on it', () => {
    const t = new Turret({ at: [5, 5], marks: [[5, 7]], alert: false });
    expect(t.trained(5, 7)).toBe(true);
    expect(t.tick(5, { c: 6, r: 6 })).toEqual([]);
    expect(t.tick(0.1, { c: 5, r: 7 })).toEqual([{ kind: 'fire', to: [5, 7], aimed: false, secs: TURRET.MARK_FLIGHT }]);
    t.tick(TURRET.MARK_RELOAD, { c: 6, r: 6 });
    expect(fires(t.tick(1, { c: 6, r: 6 }))).toBe(false);
    t.rouse();
    expect(t.tick(0.1, { c: 6, r: 6 })).toContainEqual({ kind: 'fire', to: [6, 6], aimed: true, secs: TURRET.FLIGHT });
  });

  it('set up where it\'s placed: its reach, flights, reloads, how long a hit quietens it and how many wreck it', () => {
    const t = new Turret({ at: [0, 0], reach: 1, flight: 0.5, reload: 1, quiet: 2, wreck: 2 });
    expect(t.reaches(1, 1)).toBe(true);
    expect(t.reaches(2, 0)).toBe(false);
    t.tick(1, { c: 1, r: 1 });
    expect(t.tick(0.5, { c: 1, r: 1 })).toContainEqual({ kind: 'land', to: [1, 1], hit: true, aimed: true });
    expect(t.hit()).toBe('quiet');
    expect(fires(t.tick(2.1, { c: 1, r: 1 }))).toBe(true);
    expect(t.hit()).toBe('wrecked');
  });

  it('holds fire while she\'s dazed, and a while once she\'s patched (9 Nov: it fired again "literally before you can do anything about it")', () => {
    const h = new Helm(clearSea(), { c: 6, r: 6, d: 0 }), t = new Turret({ at: [6, 8] });
    const shoot = (secs: number) => { const ev = []; for (let s = 0; s < secs; s += 0.05) { h.tick(0.05); ev.push(...t.tick(0.05, h.spared() ? null : h.now())); } return ev; };
    h.hit();
    expect(fires(shoot(20))).toBe(false);   // dazed: no shots
    fill(h.hole!);
    expect(h.dazed()).toBe(false);
    expect(fires(shoot(SAIL.GRACE - 0.2))).toBe(false);
    expect(fires(shoot(0.4))).toBe(true);   // (she's still in reach)
  });
});
