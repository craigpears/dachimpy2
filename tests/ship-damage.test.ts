/* A ship's damage and her crew at work on it (src/ship-damage.ts). The user, 15 Nov: "as it starts getting
   chipped away or shot, damage goes up, and you should visibly start seeing some holes and bilge appear ... a few
   like carpentry bots on board ... slowly repairing or bilging out"; "shoot the sloop from the war frigate and see
   it just go dead in the water ... they then have to sit there and rebuild". */
import { describe, expect, it } from 'vitest';
import { DAMAGE, Damage, struck } from '../src/ship-damage';
import { SLOOP, WAR_FRIGATE } from '../src/ships';

describe('damage by YPPedia\'s numbers (15 Nov: "as it starts getting chipped away or shot, damage goes up")', () => {
  it('a war frigate takes 15 large, 20 medium or 30 small shots to full damage', () => {
    for (const [gun, n] of [['large', 15], ['medium', 20], ['small', 30]] as const) {
      const d = new Damage(WAR_FRIGATE);
      for (let i = 0; i < n - 1; i++) expect(d.hit(gun, 0, 'L').out).toBe(false);
      expect(d.hit(gun, 0, 'L').out).toBe(true);
    }
  });
  it('the sloop takes far fewer: three of the frigate\'s large shots knock her out', () => {
    const d = new Damage(SLOOP);
    d.hit('large', 0, 'R'); d.hit('large', 0, 'R');
    expect(d.out).toBe(false);
    expect(d.hit('large', 0, 'R').out).toBe(true);
  });
  it('each hit is a hole where it struck, along her and on the side it came in', () => {
    const d = new Damage(WAR_FRIGATE), { hole } = d.hit('large', 0.3, 'R');
    expect(hole).toMatchObject({ along: 0.3, side: 'R', gun: 'large', left: DAMAGE.SHOT.large });
    // (her own square in the middle of her four along, facing out to sea: a shot from her right on her bow)
    expect(struck({ c: 5, r: 5, d: 0 }, 4, [5, 6], [8, 6])).toEqual({ along: 1.5 / 4, side: 'R' });
    expect(struck({ c: 5, r: 5, d: 0 }, 4, [5, 3], [1, 3])).toEqual({ along: -0.5 / 4 - 0.25, side: 'L' });
  });
});

describe('her crew at work (15 Nov: "a few like carpentry bots on board ... slowly repairing or bilging out")', () => {
  it('her carpenters patch her holes in order, oldest first, quicker on a frigate with her many stations', () => {
    const f = new Damage(WAR_FRIGATE), s = new Damage(SLOOP);
    expect(f.carp).toBeGreaterThan(s.carp);
    const a = f.hit('large', -0.2, 'L').hole, b = f.hit('large', 0.2, 'L').hole;
    const patched: number[] = [];
    for (let t = 0; t < 60; t += 0.1) for (const e of f.tick(0.1)) if (e.kind === 'patched') patched.push(e.hole.id);
    expect(patched).toEqual([a.id, b.id]);
    expect(f.total()).toBe(0);
  });
  it('damage lets water into her bilge, her bilgers pump it out, and water slows her', () => {
    const d = new Damage(WAR_FRIGATE);
    for (let i = 0; i < 12; i++) d.hit('large', 0, 'L');
    for (let t = 0; t < 10; t += 0.1) d.tick(0.1);
    expect(d.water).toBeGreaterThan(0);
    expect(d.drag()).toBeGreaterThan(1);
    for (let t = 0; t < 600; t += 0.5) d.tick(0.5);
    expect(d.water).toBe(0);
    expect(d.drag()).toBe(1);
  });
  it('knocked out, she\'s dead in the water till her carpenters have her back under the mark', () => {
    const d = new Damage(SLOOP);
    for (let i = 0; i < 3; i++) d.hit('large', 0, 'R');
    expect(d.out).toBe(true);
    let back = -1;
    for (let t = 0; t < 600 && back < 0; t += 0.1) if (d.tick(0.1).some((e) => e.kind === 'back')) back = t;
    expect(back).toBeGreaterThan(10);   // (a while: she has to sit there and rebuild)
    expect(d.share()).toBeLessThanOrEqual(DAMAGE.RECOVER + 1e-9);
  });
});
