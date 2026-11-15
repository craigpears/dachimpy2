// Jazzmy's magic carpet ride (src/den-carpet.ts) and its flight over the real sea (src/den-carpet-flight.ts): its steps,
// the ride down the wind, the flight, the gusts, and where she comes down.
import { describe, it, expect } from 'vitest';
import { Ride, CARPET, LAUNCH_X, METER, REEF_SPEEDS, moodAt, meterAt, straightOn, dressedForIt, OUTFIT, ENDINGS, type RideEvent, type Phase } from '../src/den-carpet.js';
import { Flight, flyOut, groundOf, GUSTS, CALLOUTS, FLIGHT, pointAt, squareAt, REEF_ROW, type Ground } from '../src/den-carpet-flight.js';
import { WHERE_SHE_ENDS_UP } from '../src/lines/jazzmy.js';
import { WHEN_JAZZMY_LANDS as HELIUM_LANDS } from '../src/lines/helium.js';
import { Sea, LAY } from '../src/den-sail.js';

const SEEDS = [1, 2, 3, 7, 11, 42];
const seaGround = (seed = 1): Ground => groundOf(new Sea(seed));
/** Plays a ride to its card, `lean(ride)` saying whether you're holding Space each tick, `steer(ride)` how you steer. */
function play(lean: (r: Ride) => boolean, steer: (r: Ride) => number = () => 0, seed = 1, dt = 1 / 30): { ride: Ride; events: RideEvent[] } {
  const ride = new Ride(seaGround(seed)), events: RideEvent[] = [...ride.opening()];
  for (let i = 0; i < 30 * 300 && ride.phase !== 'card'; i++) {
    const P = ride.phase;
    events.push(...ride.tick(dt, P === 'ride' || P === 'ready' ? lean(ride) : false, steer(ride)));
  }
  return { ride, events };
}
const said = (events: RideEvent[]) => events.flatMap((e) => (e.kind === 'say' ? [e.text] : []));
const phases = (events: RideEvent[]) => events.flatMap((e) => (e.kind === 'phase' ? [e.phase] : []));
/** A pilot: through these gusts in turn, then on for that square. */
const pilot = (ids: number[], [c, r]: [number, number]) => (f: Flight) => {
  const next = ids.find((i) => !f.taken.has(i) && GUSTS[i].x > f.x - 1);
  const p = next !== undefined ? GUSTS[next] : pointAt(c, r);
  const dz = p.z - f.z;
  return Math.abs(dz) < 0.5 ? 0 : Math.sign(dz);
};
/** And diving as a player would: once past the trail's last gust, lined up on the place, when a dive now would bring her
    down on it. */
const diver = (ids: number[], [c, r]: [number, number]) => (f: Flight) => {
  if (ids.some((i) => !f.taken.has(i))) return false;
  const T = pointAt(c, r), a = FLIGHT.G + FLIGHT.DIVE, fall = (f.w + Math.sqrt(f.w * f.w + 2 * a * Math.max(0, f.h - 1))) / a;
  return Math.abs(f.z - T.z) <= 9 && f.x + f.u * fall >= T.x - 1;
};
const ROUTE: Record<'helium' | 'decorum' | 'smugglers' | 'race', [number[], [number, number]]> = { helium: [[0], [22.5, 28.5]], decorum: [[1, 2], [12.5, 29]], smugglers: [[1, 3], [16.5, 31.5]], race: [[0, 4, 5, 6], [22, 41]] };
const flyTo = (to: keyof typeof ROUTE, v: number, g: Ground) => {
  const [ids, at] = ROUTE[to];
  return flyOut(v, g, pilot(ids, at), LAUNCH_X, CARPET.DECK_H, diver(ids, at)).landed!.where;
};

describe("Jazzmy's carpet ride", () => {
  it('reaches an ending without touching anything (the user, 14 Nov: "I don\'t want her to have to play the puzzle to see the funny part")', () => {
    const { ride, events } = play(() => false);
    expect(ride.phase).toBe('card');
    expect(ride.result?.where).toBe('short');
    expect(said(events)).toContain(WHERE_SHE_ENDS_UP.short);
    expect(ride.leaned).toBe(false);
  });
  it('goes through every step in order, her jetty to the card', () => {
    const { events } = play(() => false);
    const order: Phase[] = ['arrive', 'hello', 'ask', 'idea', 'yes', 'dress', 'lash', 'board', 'ready', 'ride', 'stop', 'fly', 'down', 'punch', 'card'];
    expect(phases(events)).toEqual(order);
  });
  it('the carpet\'s your idea, not her ask (the user, 14 Nov: "I don\'t want her to seem like she\'s demanding it")', () => {
    const { events } = play(() => false), says = events.filter((e) => e.kind === 'say') as Extract<RideEvent, { kind: 'say' }>[];
    const firstCarpet = says.find((e) => /carpet|Aladdin/i.test(e.text))!;
    expect(firstCarpet.who).toBe('you');
  });
  it('never says "my name\'s not even Jasmine" (the user, 14 Nov: "That seems a bit personal")', () => {
    for (const hold of [0, 6, 9, 30]) for (const t of said(play((r) => r.v < hold).events)) expect(t).not.toMatch(/Jasmine/i);
  });
  it('is a run for Helium\'s rum (the user: "she\'s got to go pick the [rum] up"): leaning to the meter\'s Helium\'s zone and flying straight on lands her there', () => {
    const z = METER.find((m) => m.id === 'helium')!;
    const { ride, events } = play((r) => r.v < (z.from + z.to) / 2);
    expect(ride.result?.where).toBe('helium');
    expect(said(events)).toContain(HELIUM_LANDS);
    expect(said(events)).toContain(WHERE_SHE_ENDS_UP.helium);
  });
  it('the meter shows where her launch alone would take her, slowest first: a splash, the reef, Helium\'s; and starts at the left with nobody leaning (the user: "if you don\'t even touch the space bar, it\'s like 80, 90% of the way through")', () => {
    expect(METER.map((m) => m.id)).toEqual(['short', 'rocks', 'sea', 'helium', 'sea']);
    expect(METER[0].from).toBe(CARPET.CRUISE);
    expect(METER[METER.length - 1].to).toBe(CARPET.MAX);
    for (let i = 1; i < METER.length; i++) expect(METER[i].from).toBeCloseTo(METER[i - 1].to);
    for (const m of METER) expect(straightOn((m.from + m.to) / 2)).toBe(m.id);
    expect(meterAt(CARPET.CRUISE)).toBe(0);
    expect(meterAt(CARPET.MAX)).toBe(1);
    // (the Helium's zone wide enough to aim for)
    const h = METER.find((m) => m.id === 'helium')!;
    expect((h.to - h.from) / (CARPET.MAX - CARPET.CRUISE)).toBeGreaterThan(0.15);
  });
  it('her lines follow how fast she\'s going: bored short of the reef, happy, then thrilled', () => {
    expect(moodAt(CARPET.CRUISE)).toBe('bored');
    expect(moodAt(REEF_SPEEDS.reach + 0.5)).toBe('happy');
    expect(moodAt(CARPET.MAX)).toBe('thrilled');
  });
  it('a ride without leaning takes under half a minute down the wind, and leaning gets there sooner', () => {
    const secs = (lean: boolean) => { const r = new Ride(seaGround(), 'ready'); let t = 0; while (r.phase !== 'stop' && t < 120) { r.tick(0.05, lean); t += 0.05; } return t; };
    expect(secs(false)).toBeLessThan(30);
    expect(secs(true)).toBeLessThan(secs(false));
  });
  it('Tzz and Kikkit call out as the sloop goes by their islands (the user: "an interaction of like [Kikkit] saying something")', () => {
    const { events } = play(() => false);
    const who = events.flatMap((e) => (e.kind === 'say' ? [e.who] : []));
    expect(who).toContain('tzz');
    expect(who).toContain('kikkit');
    // (once each)
    expect(who.filter((w) => w === 'kikkit').length).toBe(1);
  });
  it('Space skips her lines on the jetty but never the ride or the flight', () => {
    const r = new Ride(seaGround());
    for (let i = 0; i < 8; i++) r.skip();
    expect(r.phase).toBe('ready');
    r.skip();
    expect(r.phase).toBe('ride');
    expect(r.skip()).toEqual([]);
    expect(r.phase).toBe('ride');
  });
  it('again starts her back on the carpet at the jetty', () => {
    const { ride } = play(() => true);
    ride.again();
    expect([ride.phase, ride.x, ride.v, ride.result, ride.flight]).toEqual(['board', 0, 0, null, null]);
  });
  it('dresses you for it and keeps who you are (the user: "your pirate\'s clothes temporarily")', () => {
    const me = { body: 'm', skin: 2, hair: 'wavy', hairCol: 'blonde', beard: 'goatee', hat: 'tricorne', top: 'captain', fam: 'parrot' };
    const L = dressedForIt(me);
    expect(L).toMatchObject({ body: 'm', skin: 2, hair: 'wavy', hairCol: 'blonde', beard: 'goatee', ...OUTFIT });
    expect(me.hat).toBe('tricorne');
  });
  it('every ending has its card', () => {
    for (const e of ['short', 'rocks', 'sea', 'helium', 'decorum', 'smugglers', 'race', 'over'] as const) expect(ENDINGS[e].title).toBeTruthy();
  });
});

describe('her flight over the real sea (the user, 14 Nov: "depending on how far you go, you end up at ... fly over all the assets that we\'ve made")', () => {
  it('lands where the speed says, flown straight on: short of the reef, into it, then on to Helium\'s', () => {
    for (const seed of SEEDS) {
      const g = seaGround(seed), at = (v: number) => flyOut(v, g, () => 0, LAUNCH_X, CARPET.DECK_H).landed!;
      expect(at(CARPET.CRUISE).where).toBe('short');
      expect(at(6).where).toBe('rocks');
      expect(at(6).r).toBe(REEF_ROW);
      expect(at(9).where).toBe('helium');
    }
  });
  it('each place has a way there from any launch over the reef, steering through its gusts and diving onto it, on every sea and the den\'s own: Helium\'s, Port Decorum, the race course', () => {
    for (const seed of [9, ...SEEDS]) {
      const g = seaGround(seed);
      for (const v of [8, 9, 10, 11, 12]) {
        expect(flyTo('helium', v, g)).toBe('helium');
        expect(flyTo('race', v, g)).toBe('race');
      }
      for (const v of [7.5, 8, 9, 10, 11, 12]) expect(flyTo('decorum', v, g)).toBe('decorum');
    }
  });
  it('the smugglers\' beach is somewhere ahead of her to land, not behind (the user, 14 Nov: "how exactly am I supposed to land on somebody else\'s island? ... all the islands are behind you"): left through Port Decorum\'s first gust, then the one round its back, on every sea', () => {
    for (const seed of [9, ...SEEDS]) {
      const g = seaGround(seed);
      for (const v of [8, 9, 10, 11, 12]) expect(flyTo('smugglers', v, g)).toBe('smugglers');
    }
    for (const [c, r] of LAY.SMUGGLERS.BEACH) expect(seaGround(9)(c, r)).toBe('smugglers');
    expect(GUSTS.filter((g) => g.to === 'smugglers').every((g) => g.x > pointAt(LAY.JAZZMY.RUN.c, LAY.JAZZMY.RUN.r1).x)).toBe(true);
  });
  it('every other island\'s land is as hard as rock: no ending she can\'t reach', () => {
    const sea = new Sea(9), g = groundOf(sea);
    for (const k of sea.works) { const [c, r] = k.split(',').map(Number); expect(['rocks', 'helium', 'decorum', 'smugglers']).toContain(g(c, r)); }
  });
  it('down in the water right off Helium\'s or Port Decorum is arriving there, in its harbour', () => {
    const g = seaGround(9), [c, r] = LAY.EMPIRE.LAND.find(([a, b]) => g(a + 1, b) === 'sea' && g(a + 2, b) === 'sea')!;
    const f = new Flight(pointAt(c + 1, r).x, 0.01, 0, g);
    f.z = pointAt(c + 1, r).z;
    for (let i = 0; i < 20 && !f.landed; i++) f.tick(0.05, 0);
    expect(f.landed?.where).toBe('decorum');
  });
  it('diving brings her down sooner', () => {
    const at = (dive: boolean) => flyOut(10, () => 'sea', () => 0, 0, 5, () => dive).landed!.x;
    expect(at(true)).toBeLessThan(at(false) - 10);
  });
  it('a gust lifts her and pushes her on, once', () => {
    const f = new Flight(GUSTS[0].x - 0.5, 3, 10, () => 'sea');
    f.z = GUSTS[0].z;
    const e = f.tick(0.05, 0);
    expect(e).toEqual([{ kind: 'gust', i: 0 }]);
    expect(f.w).toBeGreaterThan(4);
    expect(f.tick(0.05, 0)).toEqual([]);
  });
  it('steering moves her across the way, left and right', () => {
    const fly = (s: number) => { const f = new Flight(0, 10, 10, () => 'sea'); for (let i = 0; i < 20; i++) f.tick(0.05, s); return f.z; };
    expect(fly(1)).toBeGreaterThan(2);
    expect(fly(-1)).toBeLessThan(-2);
    expect(fly(0)).toBe(0);
  });
  it('steered off the side of the sea, she\'s off the map', () => {
    expect(flyOut(12, seaGround(), () => 1, LAUNCH_X, 12).landed!.where).toBe('over');
  });
  it('the trade wind runs down open water on every sea, just short of the reef, past Tzz\'s and Kikkit\'s islands', () => {
    const R = LAY.JAZZMY.RUN;
    for (const seed of SEEDS) {
      const sea = new Sea(seed);
      for (let r = R.r0; r <= R.r1 + 1; r++) { expect(sea.open(R.c, r)).toBe(true); expect(sea.rocks.has(`${R.c},${r}`)).toBe(false); }
    }
    expect(R.r1).toBeLessThan(REEF_ROW);
    expect(squareAt(CARPET.LANE, 0)).toEqual([R.c, R.r1]);
    // (each near enough the lane to be heard from the sloop going by)
    for (const C of CALLOUTS.filter((k) => k.who === 'tzz' || k.who === 'kikkit')) {
      const p = pointAt(C.at[0], C.at[1]), x = Math.max(0, Math.min(CARPET.LANE, p.x));
      expect(Math.hypot(p.x - x, p.z)).toBeLessThan(C.near);
    }
  });
});

describe("Jazzmy's island (the user, 14 Nov: \"don't put it in the den though ... a modular system of islands\")", async () => {
  const { onJazzmyLanding, jazzmyLandingSquares, jazzmyAt } = await import('../src/den-jazzmy.js');
  it('is out on the sea, its landing open water on every sea, clear of every other island', () => {
    for (const seed of SEEDS) {
      const sea = new Sea(seed);
      for (const [c, r] of jazzmyLandingSquares()) { expect(onJazzmyLanding(c, r)).toBe(true); expect(sea.open(c, r)).toBe(true); expect(sea.wind.has(`${c},${r}`)).toBe(false); }
    }
    const others = [...LAY.MULTIBELLA.LAND, ...LAY.ISLE.LAND, ...LAY.TZZ.LAND, ...LAY.KIKKIT.LAND];
    for (const [c, r] of LAY.JAZZMY.LAND) for (const [a, b] of others) expect(Math.max(Math.abs(a - c), Math.abs(b - r))).toBeGreaterThan(2);
    expect(jazzmyAt(LAY.JAZZMY.MOOR.c, LAY.JAZZMY.MOOR.r)).toBe(false);
  });
});
