import { describe, expect, it } from 'vitest';
import { BEATS, DIGNITY, Dignity, HOP_SECS, SAYS, bellaGun, fromGate, heard, missAt, readSecs, sceneAt } from '../src/den-dignity';
import { CHECK } from '../src/den-checkpoint';
import { LAY } from '../src/den-sail';

const GATE = { c: LAY.CHECKPOINT.GATE, r: LAY.CHECKPOINT.ROW };

describe('Dignity at the checkpoint (10 Nov)', () => {
  it('spots you the first time you sail up from the cove\'s side: the cutscene, once', () => {
    const d = new Dignity();
    expect(d.watch(null, true)).toBe(null);   // (not out)
    expect(d.watch(DIGNITY.SPOT + 1, true)).toBe(null);
    expect(d.watch(DIGNITY.SPOT, true)).toBe('scene');
    expect(d.met).toBe(true);
    expect(d.watch(DIGNITY.SPOT, true)).toBe(null);
    // Sail away and come back: no second cutscene.
    expect(d.watch(DIGNITY.SPOT + 3, true)).toBe(null);
    expect(d.watch(DIGNITY.SPOT, true)).toBe(null);
  });

  it('spots you where the trade wind drops you, facing her gate, as the checkpoint sights you', () => {
    expect(DIGNITY.SPOT).toBe(CHECK.SIGHT);
    const lane = LAY.LANES[1], drop = { c: lane.at[0], r: lane.at[1] + lane.n };
    expect(fromGate(drop, GATE)).toEqual({ near: DIGNITY.SPOT, before: true });
  });

  it('says "one more stroke" once, a square short of her guns\' first mark', () => {
    const firstMark = Math.min(...CHECK.MARKS.flat().map(([, r]) => r));
    expect(GATE.r - (firstMark - 1)).toBe(DIGNITY.CLOSER);
    const d = new Dignity();
    expect(d.watch(DIGNITY.CLOSER, true)).toBe('scene');   // (straight in close: the cutscene first)
    expect(d.watch(DIGNITY.CLOSER, true)).toBe('closer');
    expect(d.watch(DIGNITY.CLOSER - 1, true)).toBe(null);
  });

  it('has nothing to say beyond her gate, from the far side', () => {
    const d = new Dignity();
    expect(d.watch(1, false)).toBe(null);
    expect(d.met).toBe(false);
    expect(fromGate({ c: GATE.c, r: GATE.r + 2 }, GATE)).toEqual({ near: 2, before: false });
  });

  it('says each later line once, and only once you\'ve met', () => {
    const d = new Dignity();
    expect(d.say('wrecked')).toBe(null);
    expect(d.say('passed')).toBe(null);
    d.watch(DIGNITY.SPOT, true);
    expect(d.say('wrecked')).toBe(SAYS.wrecked);
    expect(d.say('wrecked')).toBe(null);   // (the second gun: she's said it)
    expect(d.say('passed')).toBe(SAYS.passed);
    expect(d.say('passed')).toBe(null);
  });

  it('sees you come out of the locks even if she never saw you sail up ("Nobody uses the canal")', () => {
    const d = new Dignity();
    expect(d.say('canal')).toBe(SAYS.canal);
    expect(d.say('canal')).toBe(null);
    // Seen now: no cutscene when you come round to the gate after.
    expect(d.watch(DIGNITY.SPOT, true)).toBe(null);
  });
});

describe('her cutscene ("go all in ... Bella fires it", 10 Nov)', () => {
  it('plays her lines in order: Halt, oh, Look lively, the giggle', () => {
    const said: string[] = [];
    for (let t = 0; t < BEATS.end; t += 0.05) {
      const s = sceneAt(t).says;
      if (s && said[said.length - 1] !== s) said.push(s);
    }
    expect(said).toEqual([SAYS.halt, SAYS.oh, SAYS.lively, SAYS.giggle]);
  });

  it('the giggling monkey and her giggle at the end don\'t go by too quickly (10 Nov)', () => {
    // "things like the giggling monkey or her giggling at the end all go by very quickly"
    let proud = 0, giggle = 0;
    for (let t = 0; t < BEATS.end; t += 0.01) {
      const s = sceneAt(t);
      if (s.bella === 'proud') proud += 0.01;
      if (s.beat === 'giggle') giggle += 0.01;
    }
    expect(proud).toBeGreaterThan(2);
    expect(giggle).toBeGreaterThan(5.5);
  });

  it('leaves each line up long enough to read', () => {
    const up = (line: string) => { let n = 0; for (let t = 0; t < BEATS.end; t += 0.01) if (sceneAt(t).says === line) n += 0.01; return n; };
    for (const line of [SAYS.halt, SAYS.oh, SAYS.lively]) expect(up(line)).toBeGreaterThan(line.length * 0.04);
    expect(up(SAYS.giggle)).toBeGreaterThan(3.5);
  });

  it('is short: about twenty seconds ("go all in", 10 Nov)', () => {
    expect(BEATS.end).toBeGreaterThan(9);
    expect(BEATS.end).toBeLessThanOrEqual(22);
    expect(sceneAt(BEATS.end - 0.01).done).toBe(false);
    expect(sceneAt(BEATS.end).done).toBe(true);
  });

  it('has Bella fire the shot: chatter, hop down, salute, light the fuse, cover her ears, boom', () => {
    const seen: string[] = [];
    for (let t = 0; t < BEATS.end; t += 0.05) { const b = sceneAt(t).bella; if (seen[seen.length - 1] !== b) seen.push(b); }
    expect(seen).toEqual(['shoulder', 'chatter', 'hop', 'salute', 'fuse', 'ears', 'boom', 'proud', 'home', 'shoulder']);
    // The shot goes when her ears are covered, and she's home on Dignity's shoulder before it ends.
    expect(sceneAt(BEATS.fire - 0.01).bella).toBe('ears');
    expect(sceneAt(BEATS.fire).shot).toBe(0);
    expect(BEATS.home + HOP_SECS).toBeLessThan(BEATS.end);
  });

  it("follows the shot out to the sloop, back to Bella's proud pose, then the giggle", () => {
    expect(sceneAt(1).cam).toBe('her');
    expect(sceneAt(BEATS.hop).cam).toBe('gun');
    expect(sceneAt((BEATS.fire + BEATS.splash) / 2).cam).toBe('sloop');
    expect(sceneAt(BEATS.splash + 0.3).cam).toBe('sloop');   // (the splash over her deck in the shot)
    expect(sceneAt(BEATS.proud + 0.3).cam).toBe('gun');
    expect(sceneAt(BEATS.proud + 0.3).bella).toBe('proud');
    expect(sceneAt(BEATS.giggle + 0.5).cam).toBe('her');
    expect(sceneAt(BEATS.splash).shot).toBe(null);
  });
});

describe('the warning shot ("It should land close, splash her, and miss", 10 Nov)', () => {
  it('comes down close beside her, on the gun\'s side, and misses', () => {
    const ship = { x: 0, z: 0 }, gun = { x: 3, z: -16 };
    const at = missAt(ship, gun), d = Math.hypot(at.x - ship.x, at.z - ship.z);
    expect(d).toBeGreaterThan(2);   // (a miss: clear of her hull)
    expect(d).toBeLessThan(3.5);    // (close enough to splash her)
    expect(Math.hypot(at.x - gun.x, at.z - gun.z)).toBeLessThan(Math.hypot(gun.x, gun.z));
  });
});

describe('her lines later, over her head', () => {
  it('stay up long enough to read, but not for ever', () => {
    expect(readSecs(SAYS.wrecked)).toBeGreaterThanOrEqual(2.4);
    expect(readSecs(SAYS.closer)).toBeGreaterThan(readSecs(SAYS.wrecked));
    expect(readSecs('x'.repeat(500))).toBe(6);
  });
});

describe("Bella fires one of the checkpoint's real guns, not a little one of her own (10 Nov)", () => {
  const cols = LAY.CHECKPOINT.GUNS.map(([c]) => c), gate = LAY.CHECKPOINT.GATE;
  it("runs to the gun on Dignity's left, her shoulder's side", () => {
    const g = bellaGun(cols, gate, [false, false]);
    expect(cols[g]).toBeGreaterThan(gate);
  });
  it("runs to the other one if that one's wrecked", () => {
    const left = bellaGun(cols, gate, [false, false]);
    const wrecked = cols.map((_, i) => i === left);
    expect(bellaGun(cols, gate, wrecked)).not.toBe(left);
  });
});

describe("her lines on the checkpoint's own events (10 Nov)", () => {
  it('"That was Imperial property!" when a gun of hers is wrecked, not just quietened', () => {
    expect(heard({ on: 'gun', gun: 1, did: 'wrecked', first: false })).toBe('wrecked');
    expect(heard({ on: 'gun', gun: 1, did: 'quiet', first: true })).toBe(null);
    expect(heard({ on: 'gun', gun: 1, did: null, first: false })).toBe(null);
    expect(heard({ on: 'gatehouse', first: true })).toBe(null);
  });
  it('the report when you get through her gate, either way', () => {
    expect(heard({ kind: 'through', how: 'gate', back: false, hits: 0 })).toBe('passed');
    expect(heard({ kind: 'through', how: 'gate', back: true, hits: 2 })).toBe('passed');
  });
  it('"Nobody uses the canal" when you come round by the locks, going out', () => {
    expect(heard({ kind: 'through', how: 'locks', back: false, hits: 0 })).toBe('canal');
    expect(heard({ kind: 'through', how: 'locks', back: true, hits: 0 })).toBe(null);
  });
  it('nothing for being sighted or the calm', () => {
    expect(heard({ kind: 'sighted' })).toBe(null);
    expect(heard({ kind: 'calm' })).toBe(null);
  });
});

describe('Bella "randomly arrived at the cannon, fired in 2 seconds" (10 Nov)', () => {
  it('takes a clear second or two scampering down to the gun', () => {
    expect(HOP_SECS).toBeGreaterThanOrEqual(1);
    expect(HOP_SECS).toBeLessThanOrEqual(2);
    expect(BEATS.salute - BEATS.hop).toBeCloseTo(HOP_SECS);
  });
  it('then has time at it: a salute, the fuse, her ears, before it goes off', () => {
    expect(BEATS.fuse - BEATS.salute).toBeGreaterThanOrEqual(0.4);
    expect(BEATS.ears - BEATS.fuse).toBeGreaterThanOrEqual(0.6);
    expect(BEATS.fire - BEATS.ears).toBeGreaterThanOrEqual(0.4);
  });
  it('is where the timeline says at every moment: her beat is a function of the scene\'s time alone', () => {
    for (let t = BEATS.hop; t < BEATS.salute; t += 0.1) {
      const s = sceneAt(t);
      expect(s.bella).toBe('hop');
      expect(s.bu).toBeCloseTo((t - BEATS.hop) / HOP_SECS, 5);
    }
  });
});
