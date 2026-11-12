/* The sloop race online (src/race-net.ts, what's said between a browser and its race's room; src/race-server.ts,
   the room running the race; src/race-link.ts, the links between). The user, 12 Nov: "a handful of people
   playing if we get to play testing it", never peer to peer, and on keeping in step: one player missing a
   message the other didn't, "and before you know it, you're on top of a rock." The room's rules (Referee) are
   tried on their own; and the room as a server (RaceServer) run in-process (LocalRoom), several pretend
   browsers linked to it, one dropping messages, each sailing its own sloop in the den's own Race, its Drive the
   room's (mirrorDrive). */
import { describe, expect, it } from 'vitest';
import { LAY } from '../src/den-sail';
import { FIELD } from '../src/den-racers';
import { Race, RACE } from '../src/den-race';
import { WATCHED, type Rival } from '../src/den-rivals';
import { routePose, startTau, SIM } from '../src/race-sim';
import { seeded } from '../src/mirror-row';
import { NET, Mirror, mirrorDrive, meIn, poseUp, parseUp, localOf, roomOf, lerpPose, spotOn, waitAt, type Snapshot, type NetDriver, type Up, type Link, type Down } from '../src/race-net';
import { Referee, RaceServer, type RaceRecord } from '../src/race-server';
import { PlayerSea } from '../src/race-replay';
import { LONG_ROUTE } from '../src/den-race';
import type { Act } from '../src/race-net';
import { LocalRoom } from '../src/race-link';

const RC = LAY.RACE, DT = 1 / NET.HZ;

/** A room run in-process, and its clock. */
class Room {
  L = new LocalRoom('TEST', seeded(3));
  t = 0;
  get R() { return this.L.server.race; }
}
/** A browser in the race, on a link into the room: its copy of the race, the den's Race it sails (racer 0
    its own sloop), and where its pirate's sailed her (`tau`, round the long way at `pace`; or put somewhere
    by the test). `drop`: how much of what comes it misses. */
class Browser {
  mirror = new Mirror();
  R: Race;
  link: Link;
  t = 0;
  tau = 0;
  drop = 0;
  heard: Down[] = [];
  at: { c: number; r: number; d: number } | null = null;
  events: { kind: string; hit?: number; racer?: number }[] = [];
  /** Holed: patching for a few seconds (the helm's daze, as sailing.js has it). */
  dazed = 0;
  constructor(room: Room, public id: string, public pace = 1, public rand = seeded(7)) {
    this.R = new Race(null, mirrorDrive({ mirror: this.mirror, me: () => meIn(this.mirror.latest, id), now: () => this.t, send: (m) => this.say(m) }));
    this.link = room.L.connect(() => this.rand() < this.drop);
    this.link.onMessage((m) => { this.heard.push(m); if (m.t === 'snap') this.mirror.take(m, this.t); });
    this.say({ t: 'hello', name: id, id });
  }
  say(m: Up) { this.link.send(m); }
  get me() { return meIn(this.mirror.latest, this.id); }
  get driver() { return this.R.run as NetDriver | null; }
  /** Everyone else, as the den's race lines them up. */
  roster(): Rival[] {
    const s = this.mirror.latest!, me = this.me;
    return s.racers.filter((_, i) => i !== me).map((r) => ({ ...(r.rv >= 0 ? WATCHED[r.rv] : WATCHED[0]), name: r.name, spot: r.spot }));
  }
  /** To the line and into the count, as js/den/race-net.js does when the room starts it. */
  line() {
    this.R.take();
    this.R.setRoster(this.roster());
    this.R.start();
    this.tau = startTau(this.mirror.latest!.racers[this.me].spot);
  }
  /** A tick of this browser: her sloop on (sailing the long way once the gun's gone), the race, her pose sent. */
  tick(dt: number) {
    this.t += dt;
    if (this.R.state === 'on') this.tau += dt * this.pace;
    const p = this.at ?? (this.R.state === 'on' || this.R.state === 'done' ? routePose(Math.min(this.tau, SIM.LONG)) : routePose(this.tau));
    this.dazed = Math.max(0, this.dazed - dt);
    for (const e of this.R.tick(dt, { c: p.c, r: p.r, d: p.d, held: this.dazed > 0 ? 'dazed' : null })) {
      this.events.push(e as never);
      if (e.kind === 'shot' && e.hit === 0) this.dazed = 3;
    }
    const d = this.driver;
    if (this.R.state === 'on') this.n++;
    this.say(poseUp(this.R.field, d ? d.took() : 0, 2, this.n));
  }
  n = 0;
}

/** A player who sails a real helm on the race's course (src/race-replay.ts, PlayerSea), as js/den/race.js
    does: in whole steps, the frame's time added up; each step the helm's step, then her race's. Her pirate drops pins round the long way, a buoy at a time; holed, she patches in three seconds.
    Everything done to her helm is written down with the steps she's sailed and sent with her pose. (A simple
    pin-dropper, she doesn't get round the whole course alone: out of pins, she retires and a bot sails her
    sloop home, so a takeover's in the race replayed as well.) */
class Helmsman extends Browser {
  ps: PlayerSea;
  acc = 0;
  acts: Act[] = [];
  /** The long way round, a pin every few squares. */
  way = LONG_ROUTE.slice(1).flatMap(([c, r], k) => {
    const [c0, r0] = LONG_ROUTE[k], n = Math.max(1, Math.ceil(Math.abs(c - c0) / 4));
    // (along leg 2's second row past the turning pool: its first row sails into it)
    return Array.from({ length: n }, (_, j) => { const x = Math.round(c0 + ((c - c0) * (j + 1)) / n), y = Math.floor(r); return [x, y + (y === RC.STRETCHES[1].r && x <= 14 ? 1 : 0)] as [number, number]; });
  });
  holed = 0;
  retired = false;
  constructor(room: Room, id: string, spot: number) {
    super(room, id);
    this.ps = new PlayerSea(spot, [], 0, 0);
  }
  /** Something done to her helm: done, and written down. */
  act(kind: Act[1], ...x: unknown[]) {
    const a: Act = [this.n, kind, ...x];
    if (this.R.state === 'on' || this.R.state === 'done') this.acts.push(a);
    this.ps.act(a);
  }
  line() {
    super.line();
    const s = this.mirror.latest!;
    // (her sea, its start's field from the race's seed, as her browser has it)
    this.ps = new PlayerSea(s.racers[this.me].spot, [], s.seed, this.me);
  }
  tick(dt: number) {
    this.t += dt;
    this.acc += dt;
    while (this.acc >= NET.STEP - 1e-9) {
      this.acc -= NET.STEP;
      const on = this.R.state === 'on' || this.R.state === 'done', h = this.ps.helm;
      if (this.holed > 0 && (this.holed -= NET.STEP) <= 0) this.act('patched');
      // (no way there along a leg's first row, the turning pool in it, say: along its second)
      if (on && h.idle() && this.way.length) { const [c, r] = this.way.shift()!; this.act('drop', c, r); if (h.idle()) this.act('drop', c, r + 1); }
      // (out of pins and going nowhere: she gives up, and a bot sails her sloop home)
      if (on && h.idle() && !this.way.length && !this.retired) { this.retired = true; this.say({ t: 'retire' }); }
      h.tick(NET.STEP);
      for (const e of this.R.tick(NET.STEP, { c: h.pose.c, r: h.pose.r, d: h.pose.d, held: h.dazed() ? 'dazed' : h.gusts.length ? 'carried' : null })) {
        this.events.push(e as never);
        if (e.kind === 'shot' && e.hit === 0) { this.act('hit', [[0, 0], [0, 1]]); this.holed = 3; }
      }
      if (on) this.n++;
    }
    const d = this.driver, up = poseUp(this.R.field, d ? d.took() : 0, 2, this.n, this.acts.splice(0, 60));
    if (!this.retired && this.R.state === 'on') this.sent = { n: this.n, at: { c: up.c, r: up.r, d: up.d } };
    this.say(up);
  }
  /** The last pose she sent while sailing her own sloop: the steps, and where. */
  sent: { n: number; at: { c: number; r: number; d: number } } | null = null;
}
/** A room in-process with a browser for each pirate (ids of four letters or more), the racers in all set. */
function local(ids: string[], fill = ids.length, paces: number[] = []) {
  const room = new Room(), bs = ids.map((id, k) => new Browser(room, id, paces[k] ?? 1, seeded(7 + k)));
  bs[0].say({ t: 'fill', n: fill });
  return { room, R: room.R, bs };
}
/** The room's clock on a tick (it sends everyone the race), then each browser's. */
function tick(room: Room, bs: Browser[]) {
  room.t += DT;
  room.L.tick(room.t);
  for (const b of bs) b.tick(DT);
  return room.R.snapshot();
}
/** Everyone ready, the count started by anyone (the last in), every browser on the line. */
function go(bs: Browser[]) {
  for (const b of bs) b.say({ t: 'ready', on: true });
  bs[bs.length - 1].say({ t: 'go' });
  for (const b of bs) b.line();
}

/* ---- the room's rules on their own (Referee) ---- */
/** The rules with players in them (their ids four letters), the racers in all set. */
function room(ids: string[], fill = ids.length) {
  const R = new Referee(seeded(3));
  for (const id of ids) R.join(id, id[0].toUpperCase() + id.slice(1), null);
  R.handle(ids[0], { t: 'fill', n: fill });
  return R;
}
/** Everyone ready, the count started by the last in. */
function off(R: Referee) {
  for (const p of R.players) R.handle(p.id, { t: 'ready', on: true });
  R.handle(R.players[R.players.length - 1].id, { t: 'go' });
}

describe('a race online: a lobby on the starting line (12 Nov)', () => {
  it('two friends in one room see each other on the line, and a bot fills the third place', () => {
    const R = room(['anne', 'bart'], 3);
    const s = R.snapshot();
    expect(s.phase).toBe('lobby');
    expect(s.players.map((p) => p.name)).toEqual(['Anne', 'Bart']);
    expect(s.racers.map((r) => r.name)).toEqual(['Anne', 'Bart', WATCHED[0].name]);
    // (each on a spot of her own along the line)
    expect(new Set(s.racers.map((r) => r.spot)).size).toBe(3);
  });

  it('a pirate alone still races someone: a bot', () => {
    const R = room(['anne'], 1);
    expect(R.snapshot().racers).toHaveLength(2);
  });

  it('six players at most, and no more racers than six with the bots', () => {
    const R = room(['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee'], 6);
    expect(R.snapshot().racers).toHaveLength(6);
    expect(R.join('ffff', 'Fred', null)).not.toBe('full');
    expect(R.join('gggg', 'Gwen', null)).toBe('full');
    expect(R.snapshot().racers).toHaveLength(FIELD.ONLINE);
  });

  it('moving along the line never lands on another player\'s spot', () => {
    const R = room(['anne', 'bart']);
    const bart = R.player('bart')!.spot;
    R.handle('anne', { t: 'spot', c: bart });
    expect(R.player('anne')!.spot).not.toBe(bart);
  });

  it('anyone starts the count once everyone\'s ready, not before', () => {
    const R = room(['anne', 'bart']);
    R.handle('anne', { t: 'ready', on: true });
    R.handle('anne', { t: 'go' });
    expect(R.phase).toBe('lobby');
    R.handle('bart', { t: 'ready', on: true });
    R.handle('anne', { t: 'go' });
    expect(R.phase).toBe('count');
    expect(R.ticking).toBe(true);
  });
});

describe('the room runs the race: the count, the clock, the bots (12 Nov)', () => {
  it('counts down, then the clock runs from the gun and the bots sail', () => {
    const R = room(['anne'], 3);
    off(R);
    for (let k = 0; k < RACE.COUNT * NET.HZ - 1; k++) R.tick(DT);
    expect(R.phase).toBe('count');
    R.tick(DT); R.tick(DT);
    expect(R.phase).toBe('on');
    for (let k = 0; k < 10 * NET.HZ; k++) R.tick(DT);
    const s = R.snapshot();
    expect(s.clock).toBeCloseTo(10, 0);
    expect(s.racers[1].prog).toBeGreaterThan(5);
  });

  it('stops ticking once the race is done and its places shown, back in its lobby, so the room can sleep', () => {
    const R = room(['anne'], 2);
    off(R);
    R.handle('anne', { t: 'retire' });
    let done = false;
    for (let k = 0; k < 2000 * NET.HZ && R.ticking; k++) { R.tick(DT); done ||= R.phase === 'done'; }
    expect(done).toBe(true);
    expect(R.phase).toBe('lobby');
    expect(R.ticking).toBe(false);
  });
});

describe('everyone else\'s sloop, drawn from snapshots (12 Nov)', () => {
  const snap = (seq: number, at: number, c: number, room = 'r1'): Snapshot => ({ t: 'snap', room, seq, phase: 'on', at, clock: at, seed: 1, fill: 2, soon: null, players: [], racers: [{ name: 'x', id: null, rv: 0, bot: false, spot: 1, c, r: 50, d: 1, leg: 0, st: 'sailing', shots: 2, hits: 0, time: null, place: null, prog: 0, lift: 0 }], holds: [], shots: [], rocks: 0 });

  it('glides between two snapshots, a moment behind the newest', () => {
    const M = new Mirror();
    M.take(snap(1, 10, 4), 100);
    M.take(snap(2, 10.125, 5), 100.125);
    M.take(snap(3, 10.25, 6), 100.25);
    expect(M.poseAt(0, 100.25)!.c).toBeCloseTo(4, 5);
    expect(M.poseAt(0, 100.3125)!.c).toBeCloseTo(4.5, 5);
  });

  it('never sails on by herself past the newest snapshot: she waits where it had her', () => {
    const M = new Mirror();
    M.take(snap(1, 10, 4), 100);
    M.take(snap(2, 10.125, 5), 100.125);
    expect(M.poseAt(0, 105)!.c).toBe(5);
  });

  it('an old or repeated snapshot is dropped', () => {
    const M = new Mirror();
    M.take(snap(2, 10, 4), 100);
    expect(M.take(snap(1, 9, 9), 100.1)).toBe(false);
    expect(M.take(snap(2, 10, 9), 100.1)).toBe(false);
    expect(M.latest!.racers[0].c).toBe(4);
  });

  it('a room that\'s slept and woken (its numbers started again) is listened to afresh', () => {
    const M = new Mirror();
    M.take(snap(40, 10, 4), 100);
    expect(M.take(snap(1, 0.1, 7, 'r2'), 101)).toBe(true);
    expect(M.latest!.racers[0].c).toBe(7);
  });

  it('a gust or a sweep puts her straight there, never sliding across the land', () => {
    expect(lerpPose({ c: 2, r: 50, d: 1 }, { c: 2, r: 40, d: 2 }, 0.3)).toEqual({ c: 2, r: 40, d: 2 });
  });

  it('your number and the room\'s go back and forth (you\'re always first in your own race)', () => {
    for (const me of [0, 1, 3, 5]) for (let i = 0; i < 6; i++) expect(roomOf(localOf(i, me), me)).toBe(i);
    expect(localOf(2, 2)).toBe(0);
  });
});

describe('first come, first served at the locks and the crane, online (12 Nov)', () => {
  it('the lock is one player\'s at a time: the second waits her turn in the berth and has it when the first is through', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart']);
    go([A, B]);
    while (R.phase !== 'on') tick(W, [A, B]);
    const [lc, lr] = RC.LOCKS[0].at;
    A.at = { c: lc, r: lr, d: 0 };
    tick(W, [A, B]);
    let s = tick(W, [A, B]);
    expect(s.holds).toEqual([['lock-up', 0]]);
    expect(spotOn(lc, lr)).toBe('lock-up');
    B.at = { c: lc, r: lr, d: 0 };
    tick(W, [A, B]);
    s = tick(W, [A, B]);
    expect(s.racers[1].st).toBe('waiting');
    // (her browser moors her in the berth to wait: still in line there)
    B.at = { ...waitAt('lock-up') };
    tick(W, [A, B]);
    // (Anne through the canal and out of the down lock)
    A.at = { c: lc, r: RC.LOCKS[1].at[1] + 1, d: 0 };
    tick(W, [A, B]);
    s = tick(W, [A, B]);
    expect(s.holds).toEqual([['lock-up', 1]]);
    expect(s.racers[1].st).not.toBe('waiting');
  });
});

describe('hits online: claimed by the shooter, decided by the room, shown everywhere (12 Nov)', () => {
  it('a hit on a friend\'s sloop holes her in every browser, and she can\'t be hit again till she\'s patched', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart']);
    go([A, B]);
    while (R.phase !== 'on') tick(W, [A, B]);
    A.at = { c: 10, r: RC.STRETCHES[0].r, d: 1 };
    B.at = { c: 10, r: RC.STRETCHES[0].r + 1, d: 1 };
    tick(W, [A, B]); tick(W, [A, B]); tick(W, [A, B]);
    expect(A.R.shoot(localOf(1, 0))).toBe(true);
    tick(W, [A, B]);
    expect(R.field!.racers[1].hits).toBe(1);
    expect(R.field!.racers[1].state).toBe('dazed');
    expect(B.events.filter((e) => e.kind === 'shot' && e.hit === 0)).toHaveLength(1);
    expect(B.driver!.took()).toBe(1);
    // (a second claim while she's holed: nothing)
    A.R.shoot(localOf(1, 0));
    tick(W, [A, B]);
    expect(R.field!.racers[1].hits).toBe(1);
  });
});

describe('a browser that misses messages still agrees with the room (12 Nov: "before you know it, you\'re on top of a rock")', () => {
  it('missing every snapshot for a while, she still takes a hit she never saw fired, once', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart']);
    go([A, B]);
    while (R.phase !== 'on') tick(W, [A, B]);
    A.at = { c: 10, r: RC.STRETCHES[0].r, d: 1 };
    B.at = { c: 10, r: RC.STRETCHES[0].r + 1, d: 1 };
    tick(W, [A, B]); tick(W, [A, B]);
    B.drop = 1;
    A.R.shoot(localOf(1, 0));
    for (let k = 0; k < (NET.SHOTS + 1) * NET.HZ; k++) tick(W, [A, B]);
    expect(R.snapshot().shots).toEqual([]);
    expect(B.driver!.took()).toBe(0);
    // (the room keeps her holed till her browser's taken it)
    expect(R.field!.racers[1].state).toBe('dazed');
    B.drop = 0;
    tick(W, [A, B]);
    expect(B.events.filter((e) => e.kind === 'shot' && e.hit === 0)).toHaveLength(1);
    expect(B.driver!.took()).toBe(1);
    tick(W, [A, B]);
    expect(B.events.filter((e) => e.kind === 'shot' && e.hit === 0)).toHaveLength(1);
  });

  it('dropping two snapshots in five all race long, places, times, hits and where everyone is still agree with the room', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart'], 4, [1.15, 1]);
    go([A, B]);
    B.drop = 0.4;
    for (let k = 0; k < 900 * NET.HZ && R.phase !== 'done'; k++) {
      const s = tick(W, [A, B]);
      if (k % 40 === 0 && s.phase === 'on') {
        // (where B draws everyone else: never further than a jump from where the room has them)
        for (let i = 0; i < s.racers.length; i++) {
          if (i === B.me || s.racers[i].time !== null) continue;
          const p = B.R.field.racers[localOf(i, B.me)].pose;
          expect(Math.abs(p.c - s.racers[i].c) + Math.abs(p.r - s.racers[i].r)).toBeLessThan(6);
        }
      }
    }
    expect(R.phase).toBe('done');
    // (the room's quiet once it's done: a browser that's heard nothing a while asks for the race again)
    B.drop = 0;
    B.say({ t: 'sync' });
    tick(W, [A, B]);
    const s = R.snapshot();
    const F = B.R.field;
    for (let i = 0; i < s.racers.length; i++) {
      const mine = F.racers[localOf(i, B.me)];
      expect(mine.place).toBe(s.racers[i].place);
      expect(mine.time).toBeCloseTo(s.racers[i].time!, 0);
    }
    expect(B.driver!.took()).toBe(s.racers[B.me].hits);
    // (and Anne, quicker round, beat Bart in both browsers)
    expect(F.racers[localOf(0, B.me)].place! < F.racers[0].place!).toBe(true);
  });
});

describe('a player who drops out (12 Nov)', () => {
  it('a closed tab\'s sloop is sailed home by a bot after a few seconds, and the race goes on', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart']);
    go([A, B]);
    while (R.phase !== 'on') tick(W, [A, B]);
    for (let k = 0; k < 2 * NET.HZ; k++) tick(W, [A, B]);
    B.link.close();
    for (let k = 0; k < (NET.GRACE - 1) * NET.HZ; k++) tick(W, [A]);
    expect(R.snapshot().racers[1].bot).toBe(false);
    for (let k = 0; k < 2 * NET.HZ; k++) tick(W, [A]);
    const s = R.snapshot();
    expect(s.racers[1].bot).toBe(true);
    expect(s.players.find((p) => p.id === 'bart')!.racing).toBe(false);
    const was = s.racers[1].prog;
    for (let k = 0; k < 20 * NET.HZ; k++) tick(W, [A]);
    expect(R.snapshot().racers[1].prog).toBeGreaterThan(was);
  });

  it('back within a few seconds (her tab reloaded), she sails her own sloop again', () => {
    const { room: W, R, bs: [A, B] } = local(['anne', 'bart']);
    go([A, B]);
    while (R.phase !== 'on') tick(W, [A, B]);
    B.link.close();
    for (let k = 0; k < 2 * NET.HZ; k++) tick(W, [A]);
    const again = new Browser(W, 'bart');
    for (let k = 0; k < 10 * NET.HZ; k++) tick(W, [A, again]);
    expect(R.snapshot().racers[1].bot).toBe(false);
    expect(again.me).toBe(1);
  });

  it('the same pirate in a second tab takes her place; the first is told it\'s closed', () => {
    const { room: W, bs: [A] } = local(['anne']);
    const twin = new Browser(W, 'anne');
    expect(A.heard.at(-1)).toEqual({ t: 'closed' });
    expect(twin.me).toBe(0);
  });

  it('everyone gone, the race is off and the room goes quiet', () => {
    const R = room(['anne']);
    off(R);
    R.drop('anne');
    expect(R.ticking).toBe(false);
  });
});

describe('what the room hears is checked for shape (12 Nov)', () => {
  it('garbled messages are dropped, and a pose is kept on the course', () => {
    expect(parseUp('not json')).toBeNull();
    expect(parseUp(JSON.stringify({ t: 'teleport' }))).toBeNull();
    expect(parseUp(JSON.stringify({ t: 'hello', name: 'x y z' }))).toMatchObject({ t: 'hello', name: 'Deckhand' });
    const p = parseUp(JSON.stringify({ t: 'pose', c: 999, r: 50, d: 7, st: 'finished', took: 2, leg: 9, sh: 9, home: null }));
    expect(p).toMatchObject({ t: 'pose', c: 27, d: 3, st: 'sailing', leg: RC.STRETCHES.length - 1, sh: FIELD.HOLD });
  });
});

describe('a race online written down, and replayed exactly (12 Nov: "everybody should always be on the same turn")', () => {
  /** Two players at the helm round the course, bots filling four, the second missing two snapshots in five;
      the race as the room ran it, and what it wrote down. */
  function race() {
    const room = new Room();
    const A = new Helmsman(room, 'anne', 0), B = new Helmsman(room, 'bart', 0);
    A.say({ t: 'fill', n: 4 });
    go([A, B]);
    B.drop = 0.4;
    for (let k = 0; k < 1000 * NET.HZ && room.R.phase !== 'done'; k++) tick(room, [A, B]);
    const recs = (room.L.server as RaceServer).records();
    return { room, A, B, rec: recs[0] };
  }
  const { room, rec, A, B } = race();

  it('is written down when the race is done: its seed, racers, actions and what the room heard', () => {
    expect(room.R.phase).toBe('done');
    expect(rec).toBeTruthy();
    expect(rec.racers.map((r) => r.name)).toEqual(['Anne', 'Bart', WATCHED[0].name, WATCHED[1].name]);
    expect(rec.acts[0].length).toBeGreaterThan(10);
    expect(rec.acts[0].every((a) => Number.isInteger(a[0]))).toBe(true);
    expect(rec.inputs.length).toBeGreaterThan(100);
    expect(rec.moves).toEqual([[], [], [], []]);
    expect(rec.places.filter((p) => p.place !== null)).toHaveLength(4);
    // (small: report its size)
    const size = JSON.stringify(rec).length;
    console.log(`a race's record: ${size} characters, ${rec.steps} steps (${(rec.steps * NET.STEP).toFixed(0)} s), ${rec.inputs.length} inputs, ${rec.acts.map((a) => a.length).join('/')} actions, ${rec.keys.length} keyframes`);
    expect(size).toBeLessThan(150_000);
  });

  it('replayed through the same rules, it comes out the same: every place, time and square', () => {
    const F = Referee.replay(JSON.parse(JSON.stringify(rec)) as RaceRecord), L = room.R.field!;
    expect(F.racers.map((r) => r.place)).toEqual(L.racers.map((r) => r.place));
    expect(F.racers.map((r) => r.time)).toEqual(L.racers.map((r) => r.time));
    expect(F.racers.map((r) => r.pose)).toEqual(L.racers.map((r) => r.pose));
    expect(F.racers.map((r) => r.hits)).toEqual(L.racers.map((r) => r.hits));
  });

  it('each player\'s sloop, replayed from her actions alone, sails the very squares she did', () => {
    for (const X of [A, B]) {
      const i = rec.racers.findIndex((r) => r.id === X.id), ps = new PlayerSea(rec.racers[i].spot, rec.acts[i], rec.seed, i);
      expect(X.sent!.n).toBeGreaterThan(1000);
      expect(ps.to(X.sent!.n)).toEqual(X.sent!.at);
    }
  });
});
