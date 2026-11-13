/* Helium's rum run (src/den-rumrun.ts), 13 Nov. The user: once you've done some distilling, Helium asks you to
   help smuggle it; they jump aboard, her deck "slightly full of barrels just piled all in the deck"; a delivery
   to Mischievious for her wedding, some for Kikkit, then the rest smuggled to Port Decorum past the imperial
   outposts, Helium all innocence: "nothing suspicious at all", whistling "whoop-de-doop-de-doop-de-doo". */
import { describe, expect, it } from 'vitest';
import {
  RUM_RUN, RUM_CAST, STOPS, RumRun, Whistle, Scene, PACE_RUN, atStop, inSight, dropFor,
  askBeats, aboardBeats, stopBeats, notYetBeats, homeBeats, whistleBeats, type StopId,
} from '../src/den-rumrun';
import { LAY, SAIL, Sea } from '../src/den-sail';
import { HELIUM_ARRIVE, HELIUM_MOOR, Cellar, RUM } from '../src/den-helium';
import { EMPIRE_OFF } from '../src/den-imperial';
import { SMUGGLERS_OFF, inSmugglersCove } from '../src/den-smugglers';
import { MOUTH } from '../src/den-kikkit';
import { readSecs } from '../src/den-dignity';
import { ABOARD } from '../src/den-spouse';
import { RUM_RUN as HELIUM_SAYS } from '../src/lines/helium';
import { RUM_RUN as KIKKIT_SAYS } from '../src/lines/kikkit';

const casks = (n: number): number => { const c = new Cellar(); c.pour(RUM.CASK * n); return c.filled; };
const taken = (): RumRun => { const r = new RumRun(); r.ask(); r.take(); return r; };

describe('"Once you\'ve done some distilling, Helium asks" (13 Nov)', () => {
  it('asks once a few casks are filled at their still, not before', () => {
    const r = new RumRun();
    expect(r.canAsk(casks(RUM_RUN.CASKS - 1))).toBe(false);
    expect(r.canAsk(casks(RUM_RUN.CASKS))).toBe(true);
    r.ask();
    expect(r.step).toBe('asked');
    expect(r.canAsk(99)).toBe(false);
  });

  it('"not now" puts it off till you\'ve been back at the still', () => {
    const r = new RumRun();
    r.ask(); r.decline();
    expect(r.step).toBe('idle');
    expect(r.canAsk(9)).toBe(false);
    r.stilled();
    expect(r.canAsk(9)).toBe(true);
  });

  it('taken on: the barrels aboard, and Helium with them', () => {
    const r = new RumRun();
    expect(r.take()).toBe(false);   // (not asked yet)
    r.ask();
    expect(r.take()).toBe(true);
    expect(r.aboard).toBe(RUM_RUN.LOAD);
    expect(r.heliumAboard).toBe(true);
    expect(r.goal()).toMatch(/Wedding Isle.*Kikkit's island.*either way round/);
  });
});

describe('the stops: Mischievious and Kikkit either way round, then the rest to Port Decorum', () => {
  it('delivers a wedding\'s worth, Kikkit\'s barrel, then all the rest at Port Decorum; then Helium\'s taken home', () => {
    const r = taken();
    expect(r.open('decorum')).toBe(false);
    expect(r.deliver('decorum')).toBe(0);   // (not yet: the other two first)
    expect(r.aboard).toBe(RUM_RUN.LOAD);
    expect(r.deliver('wedding')).toBe(2);
    expect(r.deliver('wedding')).toBe(0);   // (done already)
    expect(r.goal()).toMatch(/Kikkit's island next \(1 for Kikkit\)/);
    expect(r.deliver('kikkit')).toBe(1);
    expect(r.goal()).toMatch(/the rest \(3\) to Port Decorum/);
    expect(r.deliver('decorum', 'cove')).toBe(3);
    expect(r).toMatchObject({ step: 'home', aboard: 0, delivered: RUM_RUN.LOAD, how: 'cove' });
    expect(r.heliumAboard).toBe(true);
    expect(r.home()).toBe(true);
    expect(r).toMatchObject({ step: 'idle', runs: 1, heliumAboard: false });
    expect(r.home()).toBe(false);
  });

  it('the first two either way round', () => {
    const r = taken();
    expect(r.deliver('kikkit')).toBe(1);
    expect(r.goal()).toMatch(/Wedding Isle next/);
    expect(r.deliver('wedding')).toBe(2);
    expect(r.open('decorum')).toBe(true);
  });

  it('a barrel fewer on her deck at every stop, and every barrel delivered', () => {
    const r = taken(), left = [r.aboard];
    for (const id of ['wedding', 'kikkit', 'decorum'] as StopId[]) { r.deliver(id, 'quay'); left.push(r.aboard); }
    for (let i = 1; i < left.length; i++) expect(left[i]).toBeLessThan(left[i - 1]);
    expect(left.at(-1)).toBe(0);
    expect(STOPS.map((s) => s.id)).toEqual(['wedding', 'kikkit', 'decorum']);
  });

  it('nothing to deliver without a run', () => {
    const r = new RumRun();
    for (const s of STOPS) expect(r.deliver(s.id)).toBe(0);
    expect(r.goal()).toBe('');
  });
});

describe('where each stop is, on the sea', () => {
  it('off the Wedding Isle\'s jetty, Kikkit\'s island, Port Decorum\'s jetty or the smugglers\' cove behind it, and Helium\'s island', () => {
    const I = LAY.ISLE.LANDING;
    expect(atStop(I.c0, I.r0)).toEqual({ id: 'wedding' });
    expect(atStop(MOUTH.c, MOUTH.r)).toEqual({ id: 'kikkit' });
    expect(atStop(EMPIRE_OFF.c, EMPIRE_OFF.r)).toEqual({ id: 'decorum', how: 'quay' });
    expect(atStop(SMUGGLERS_OFF.c, SMUGGLERS_OFF.r)).toEqual({ id: 'decorum', how: 'cove' });
    expect(atStop(HELIUM_ARRIVE.c, HELIUM_ARRIVE.r)).toEqual({ id: 'helium' });
    expect(atStop(HELIUM_MOOR.c, HELIUM_MOOR.r)).toEqual({ id: 'helium' });
    expect(atStop(SAIL.HOME.c, SAIL.HOME.r)).toBe(null);
  });

  it('where she\'s brought alongside for each is that stop\'s water, and open on every sea', () => {
    for (const how of ['quay', 'cove'] as const) {
      const d = dropFor('decorum', how);
      expect(atStop(d.moor!.c, d.moor!.r)).toEqual({ id: 'decorum', how });
    }
    expect(atStop(RUM_CAST.drops.wedding.moor!.c, RUM_CAST.drops.wedding.moor!.r)).toEqual({ id: 'wedding' });
    expect(inSmugglersCove(RUM_CAST.drops.cove.moor!.c, RUM_CAST.drops.cove.moor!.r)).toBe(true);
    for (const seed of [1, 9, 17]) {
      const s = new Sea(seed);
      for (const d of Object.values(RUM_CAST.drops)) if (d.moor) expect(s.open(d.moor.c, d.moor.r), `seed ${seed}`).toBe(true);
    }
  });
});

describe('"Nothing suspicious at all": whistling past the Empire', () => {
  it('in sight by the checkpoint\'s gate and off Port Decorum (and behind its rocks); not at home, nor off the other islands', () => {
    const K = LAY.CHECKPOINT;
    expect(inSight(K.GATE, K.ROW - 2)).toBe('checkpoint');
    expect(inSight(K.GATE, K.ROW + 3)).toBe('checkpoint');
    expect(inSight(EMPIRE_OFF.c, EMPIRE_OFF.r)).toBe('decorum');
    expect(inSight(SMUGGLERS_OFF.c, SMUGGLERS_OFF.r)).toBe('decorum');
    expect(inSight(SAIL.HOME.c, SAIL.HOME.r)).toBe(null);
    expect(inSight(LAY.ISLE.MOOR.c, LAY.ISLE.MOOR.r)).toBe(null);
    expect(inSight(HELIUM_MOOR.c, HELIUM_MOOR.r)).toBe(null);
  });

  it('whistles as she comes into sight with rum aboard, once a pass', () => {
    const w = new Whistle(), dt = 0.5;
    expect(w.tick(dt, null, true)).toBe(null);
    expect(w.tick(dt, 'checkpoint', true)).toBe('checkpoint');
    for (let i = 0; i < 20; i++) expect(w.tick(dt, 'checkpoint', true)).toBe(null);   // (still in sight)
    for (let i = 0; i < 4; i++) w.tick(dt, null, true);
    expect(w.tick(dt, 'checkpoint', true)).toBe(null);   // (only just out of sight: the same pass)
    for (let t = 0; t <= RUM_RUN.QUIET; t += dt) w.tick(dt, null, true);
    expect(w.tick(dt, 'decorum', true)).toBe('decorum');
    expect(w.n).toBe(2);
  });

  it('no rum aboard, no whistling', () => {
    const w = new Whistle();
    expect(w.tick(0.5, 'checkpoint', false)).toBe(null);
    expect(w.tick(0.5, 'checkpoint', false)).toBe(null);
  });

  it('the tune, then a line in turn; Dignity remarks from her gate, only at the checkpoint', () => {
    expect(HELIUM_SAYS.tune.toLowerCase()).toContain('whoop-de-doop-de-doop-de-doo');
    expect(HELIUM_SAYS.innocent[0]).toBe('Nothing suspicious at all.');
    const at = whistleBeats('checkpoint', 0), off = whistleBeats('decorum', 1);
    expect(at.map((x) => x.who)).toEqual(['helium', 'helium', 'dignity']);
    expect(off.map((x) => x.who)).toEqual(['helium', 'helium']);
    expect(off[1].says).toBe(HELIUM_SAYS.innocent[1]);
  });
});

describe('each stop a little scene with that character\'s lines', () => {
  it('rolls exactly that stop\'s barrels ashore, as it\'s said', () => {
    const cases: [StopId, 'quay' | 'cove' | null, number][] = [['wedding', null, 2], ['kikkit', null, 1], ['decorum', 'quay', 3], ['decorum', 'cove', 3]];
    for (const [id, how, n] of cases) {
      const s = new Scene(stopBeats(id, n, how));
      expect(s.rolls, `${id} ${how}`).toBe(n);
      expect(s.beats.every((x) => x.says.length > 0)).toBe(true);
    }
    expect(stopBeats('wedding', 2)[0].who).toBe('mischievious');
    expect(stopBeats('kikkit', 1).filter((x) => x.who === 'kikkit').length).toBeGreaterThanOrEqual(2);
    expect(stopBeats('decorum', 3, 'quay').some((x) => x.who === 'guard')).toBe(true);
    expect(stopBeats('decorum', 3, 'cove').some((x) => x.who === 'guard')).toBe(false);   // (nobody about)
    expect(new Scene(aboardBeats()).rolls).toBe(RUM_RUN.LOAD);
    for (const beats of [askBeats(), notYetBeats(), homeBeats()]) expect(new Scene(beats).rolls).toBe(0);
    expect(askBeats().some((x) => x.who === 'you')).toBe(true);
  });

  it('plays each line as long as it takes to read, and Space goes on once it\'s been up a moment', () => {
    const beats = askBeats(), s = new Scene(beats);
    expect(s.tick(0.01)).toBe(beats[0]);
    expect(s.tick(readSecs(beats[0].says) - 0.1)).toBe(null);
    s.goOn();   // (up long enough: on)
    expect(s.tick(0.01)).toBe(beats[1]);
    s.goOn();   // (only just up: not yet)
    expect(s.tick(0.01)).toBe(null);
    s.tick(PACE_RUN.READ_FIRST); s.goOn();
    expect(s.tick(0.01)).toBe(beats[2]);
    for (let i = 0; i < 400 && !s.done; i++) s.tick(0.1);
    expect(s.done).toBe(true);
  });

  it('Kikkit draws out one word at most, and it\'s the barrel she\'s savouring, never a joke at her drinking', () => {
    for (const line of Object.values(KIKKIT_SAYS)) expect((line.match(/\w+ehh+/gi) ?? []).length).toBeLessThanOrEqual(1);
    expect(Object.values(KIKKIT_SAYS).join(' ')).not.toMatch(/drunk|drink|jug|hic/i);
  });
});

describe('the barrels on her deck: a pile that shows', () => {
  it('a spot for every barrel, the top ones first ashore, all clear of the mast, the tiller and the spots of whoever\'s aboard', () => {
    const D = RUM_CAST.deck;
    expect(D.length).toBe(RUM_RUN.LOAD);
    const first = STOPS[0].barrels;
    expect(D.slice(0, first).every((p) => p.y > 0)).toBe(true);
    expect(D.slice(first).every((p) => p.y === 0)).toBe(true);
    const r = RUM_CAST.h * 0.36;
    for (const p of D) {
      expect(Math.hypot(p.x - 0.35, p.z)).toBeGreaterThan(r + 0.1);   // (her mast)
      expect(Math.hypot(p.x - RUM_CAST.aboard.x, p.z - RUM_CAST.aboard.z)).toBeGreaterThan(0.6);   // (Helium)
      expect(Math.hypot(p.x - ABOARD.x, p.z - ABOARD.z)).toBeGreaterThan(0.6);   // (your spouse)
      expect(Math.abs(p.z) + r).toBeLessThan(1.15);   // (inside her beam)
    }
  });
});
