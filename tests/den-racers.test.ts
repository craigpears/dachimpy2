/* The sloop race's field: two to four racers on one course (src/den-racers.ts). The user, 11 Nov: "start
   adding multiple players to this first, even if it's like 2 to 4 players with some bots", "I definitely
   want to be able to shoot other racers", "If you got through it first, we get through it first", and "Some
   can be safe, like ... the locks and the crane". */
import { describe, expect, it } from 'vitest';
import { LAY, Sea } from '../src/den-sail';
import { Field, FIELD, sheltered } from '../src/den-racers';
import { Race, RACE } from '../src/den-race';

const RC = LAY.RACE, S = RC.STRETCHES, sea = new Sea(9);
const on = (n: number) => { const f = new Field(Array.from({ length: n }, (_, i) => `racer ${i}`), sea, 0); f.start(); return f; };
/** Racer `i` round every stretch in order, then home. */
const round = (f: Field, i: number) => {
  for (let n = 1; n < S.length; n++) f.move(i, { c: 10, r: S[n].r, d: S[n].d });
  return f.move(i, { c: RC.FINISH[0], r: RC.FINISH[1], d: 2 });
};

describe('two to four racers on one course, each in order, finishing in order (11 Nov: "2 to 4 players with some bots")', () => {
  it('holds two to four racers, no fewer, no more', () => {
    for (const n of [2, 3, 4]) expect(on(n).racers).toHaveLength(n);
    expect(() => on(1)).toThrow();
    expect(() => on(5)).toThrow();
  });

  it('counts each racer\'s stretches in order, her own, and the finish only once she\'s been round', () => {
    const f = on(3);
    expect(f.move(0, { c: RC.FINISH[0], r: RC.FINISH[1], d: 2 })).toEqual([]);
    expect(f.move(1, { c: 10, r: S[2].r, d: 1 })).toEqual([]);
    expect(f.move(1, { c: 10, r: S[1].r, d: 3 })).toEqual([{ kind: 'leg', racer: 1, n: 1 }]);
    expect(f.racers.map((r) => r.leg)).toEqual([0, 1, 0]);
    // (the starlit door's tunnel: legs 2 to 5 at once, only from leg 2)
    expect(f.under(0, 1, 4)).toEqual([]);
    expect(f.under(1, 1, 4)).toEqual([{ kind: 'leg', racer: 1, n: 4 }]);
  });

  it('places them by their times as they come home, and the race is done when they all are', () => {
    const f = on(3);
    f.tick(100);
    expect(round(f, 2)).toEqual([{ kind: 'finish', racer: 2, secs: 100, place: 1 }]);
    f.tick(20);
    round(f, 0);
    expect(f.state).toBe('on');
    // (a bot on a set route, home at its own time, earlier than the clock: placed by it)
    expect(f.home(1, 110)).toEqual([{ kind: 'finish', racer: 1, secs: 110, place: 2 }]);
    expect(f.order).toEqual([2, 1, 0]);
    expect(f.racers.map((r) => r.place)).toEqual([3, 2, 1]);
    expect(f.state).toBe('done');
    // (home's home: nothing more)
    expect(round(f, 2)).toEqual([]);
  });

  it('the den\'s own race keeps a field of two: you, and the rival as a bot racer, placed by time', () => {
    const race = new Race();
    race.start();
    race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    for (let t = 0; t < RACE.RIVAL.SECS + 1; t += 1) race.tick(1, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(race.field.racers[1]).toMatchObject({ state: 'finished', time: RACE.RIVAL.SECS, place: 1 });
    for (let n = 1; n < S.length; n++) race.tick(0.1, { c: 10, r: S[n].r });
    const e = race.tick(0.1, { c: RC.FINISH[0], r: RC.FINISH[1] });
    expect(e).toMatchObject([{ kind: 'finish', won: false }]);
    expect(race.field.racers[0].place).toBe(2);
  });
});

describe('first come, first served at a lock and the crane (11 Nov: "If you got through it first, we get through it first")', () => {
  it('the first to come has it; the next waits her turn, in the order they came, and has it when it\'s free', () => {
    const f = on(4);
    expect(f.claim(2, 'lock-up')).toBe('yours');
    expect(f.claim(0, 'lock-up')).toBe('wait');
    expect(f.claim(3, 'lock-up')).toBe('wait');
    expect(f.racers[0].state).toBe('waiting');
    expect(f.holder('lock-up')).toBe(2);
    // (the crane's another spot: hers, though the lock's taken)
    expect(f.claim(1, 'crane')).toBe('yours');
    // (only the one who has it can give it up)
    expect(f.release(0, 'lock-up')).toEqual([]);
    expect(f.release(2, 'lock-up')).toEqual([{ kind: 'turn', racer: 0, spot: 'lock-up' }]);
    expect(f.holder('lock-up')).toBe(0);
    expect(f.racers[0].state).toBe('puzzling');
    // (one who gives up waiting goes the long way, and isn't given it later)
    f.leave(3, 'lock-up');
    expect(f.racers[3]).toMatchObject({ state: 'sailing', spot: null });
    expect(f.release(0, 'lock-up')).toEqual([]);
    expect(f.holder('lock-up')).toBe(-1);
  });

  it('home with it, she gives it up', () => {
    const f = on(2);
    f.claim(0, 'crane'); f.claim(1, 'crane');
    expect(round(f, 0)[0]).toMatchObject({ kind: 'finish', racer: 0 });
    expect(f.holder('crane')).toBe(1);
  });
});

describe('shooting other racers: hit while exposed, never while sheltered (11 Nov: "I definitely want to be able to shoot other racers")', () => {
  it('a broadside three squares out of her side holes a racer sitting in the open, dazed till she\'s patched', () => {
    const f = on(2), M = RC.WHIRLS.MOUTH;
    // Racer 1 sits at the whirlpools' mouth building her Vegas; racer 0 comes by along the leg's other row.
    f.move(1, { ...M }); f.racers[1].state = 'puzzling';
    f.move(0, { c: M.c, r: M.r - 1, d: 1 });
    expect(f.aim(0, 'R').hit).toBe(-1);
    expect(f.aim(0, 'L').hit).toBe(1);
    expect(f.fire(0, 'L')).toMatchObject({ kind: 'shot', racer: 0, hit: 1 });
    expect(f.racers[1]).toMatchObject({ state: 'dazed', hits: 1 });
    expect(f.racers[0]).toMatchObject({ shots: FIELD.SHOTS - 1, scored: 1 });
    // (dazed, she can't be hit again till she's patched)
    expect(f.fire(0, 'L')!.hit).toBe(-1);
    f.patched(1);
    expect(f.racers[1].state).toBe('sailing');
    // (no shots left, nothing fires)
    expect(f.racers[0].shots).toBe(0);
    expect(f.fire(0, 'L')).toBeNull();
    // (a shot timed wrong as she goes by is spent, and hits nobody)
    f.load(0, 9);
    expect(f.racers[0].shots).toBe(FIELD.HOLD);
    expect(f.fire(0, 'L', false)!.hit).toBe(-1);
    expect(f.racers[1].hits).toBe(1);
  });

  it('three squares and no further, and land stops a shot: no shooting across a spit', () => {
    const open = new Field(['a', 'b'], null, 0);
    open.start();
    open.move(1, { c: 10, r: 50, d: 1 });
    open.move(0, { c: 10, r: 46, d: 1 });
    expect(open.aim(0, 'L').hit).toBe(-1);
    open.move(0, { c: 10, r: 47, d: 1 });
    expect(open.aim(0, 'L').hit).toBe(1);
    const f = on(2);
    // (leg 1 and leg 2 either side of the first spit: two rows apart, the spit between)
    f.move(1, { c: 20, r: S[1].r, d: 3 });
    f.move(0, { c: 20, r: S[0].r + 1, d: 1 });
    expect(f.aim(0, 'L').hit).toBe(-1);
  });

  it('sheltered in a lock\'s chamber, the canal, or alongside the crane\'s ledge, nobody\'s broadside reaches her', () => {
    for (const [c, r] of [...RC.LOCKS.map((l) => l.at), ...RC.POUND.at, RC.CRANE.LEDGE]) expect(sheltered(c, r)).toBe(true);
    for (const [c, r] of [[RC.WHIRLS.MOUTH.c, RC.WHIRLS.MOUTH.r], ...RC.DOOR.OFF, ...RC.HEADWIND] as [number, number][]) expect(sheltered(c, r)).toBe(false);
    const f = on(2), [lc, lr] = RC.LOCKS[0].at;
    f.move(1, { c: lc, r: lr, d: 0 }); f.racers[1].state = 'puzzling';
    f.move(0, { c: lc, r: lr - 2, d: 3 });
    expect(f.aim(0, 'R').cells).toContainEqual([lc, lr]);
    expect(f.aim(0, 'R').hit).toBe(-1);
    const [cc, cr] = RC.CRANE.LEDGE;
    f.move(1, { c: cc, r: cr, d: 1 });
    f.move(0, { c: cc, r: cr - 1, d: 1 });
    expect(f.aim(0, 'L').cells).toContainEqual([cc, cr]);
    expect(f.aim(0, 'L').hit).toBe(-1);
    // (nor while she's carried: a gust, the crane, the tunnel)
    f.move(1, { c: cc + 2, r: cr, d: 1 }); f.racers[1].state = 'carried';
    f.move(0, { c: cc + 2, r: cr - 1, d: 1 });
    expect(f.aim(0, 'L').hit).toBe(-1);
  });
});
