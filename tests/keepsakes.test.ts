/* Every adventure ends with something to keep (src/keepsakes.ts), 14 Nov. The user: "any little adventure that you
   complete, there should be some meaningful reward ... a visible persistent change to the map, a creature that
   carries along, or some furniture"; and of Helium's rum run, "it just seems a bit anticlimactic at the end ...
   some barrels of rum to decorate the den or something." */
import { describe, expect, it } from 'vitest';
import { KEEPSAKES, Keepsakes, cleanKept } from '../src/keepsakes';
import { RUM_RUN, RUM_CAST, Scene, homeBeats } from '../src/den-rumrun';
import { RUM_RUN as HELIUM_SAYS } from '../src/lines/helium';

describe('the rum run ending anticlimactically, nothing to show for it (14 Nov)', () => {
  it('Helium rolls a few barrels aboard for your den as you take them home, the first run', () => {
    const gift = homeBeats(true), plain = homeBeats();
    expect(new Scene(gift).rolls).toBe(RUM_RUN.KEEP);
    expect(gift.some((b) => b.who === 'helium' && b.says === HELIUM_SAYS.keepsake)).toBe(true);
    expect(new Scene(plain).rolls).toBe(0);   // (later runs: just home)
    expect(RUM_CAST.den.length).toBe(RUM_RUN.KEEP);   // (every barrel given stands at the den)
  });

  it('the barrels ride home aboard her, then stand at the den once you\'re ashore', () => {
    const k = new Keepsakes();
    expect(k.has('rumrun')).toBe(false);
    expect(k.earn('rumrun', true)).toBe(true);
    expect(k.where('rumrun')).toBe('aboard');
    expect(k.settle(true)).toEqual([]);   // (still sailing)
    expect(k.home('rumrun')).toBe(false);
    expect(k.settle(false)).toEqual(['rumrun']);
    expect(k.home('rumrun')).toBe(true);
    expect(k.settle(false)).toEqual([]);   // (said once)
  });

  it('once each: a second run gives nothing more', () => {
    const k = new Keepsakes();
    k.earn('rumrun');
    expect(k.earn('rumrun')).toBe(false);
    expect(k.kept).toEqual(['rumrun']);
  });

  it('kept across reloads: what\'s saved comes back at the den, and junk in storage is ignored', () => {
    const k = new Keepsakes();
    k.earn('rumrun', true);
    const again = new Keepsakes(cleanKept(JSON.parse(JSON.stringify(k.kept))));
    expect(again.home('rumrun')).toBe(true);
    expect(cleanKept(['rumrun', 'rumrun', 'nonsense', 3, null])).toEqual(['rumrun']);
    expect(cleanKept({ rumrun: true })).toEqual([]);
    expect(cleanKept(null)).toEqual([]);
  });

  it('every keepsake says what it is and what\'s said when it\'s home', () => {
    for (const k of Object.values(KEEPSAKES)) {
      expect(k.adventure.length).toBeGreaterThan(0);
      expect(k.what.length).toBeGreaterThan(0);
      expect(k.home.length).toBeGreaterThan(0);
    }
  });
});
