/* Pirate Den: the sloop race online, its room: the server. TypeScript, compiled to js/race-server.js; tested
   in tests/race-net.test.ts. A modular monolith (the user, 12 Nov): this is all of the room's logic, pure,
   with no Cloudflare, WebSocket or DOM in it, the clock and the dice handed in, so it can move to a server of
   its own one day. RaceServer takes a connection's coming (join), going (leave), what it sends (message)
   and the clock (tick), and answers with what to send to whom (Out). Around it, thin adapters: the den's
   Durable Object (worker/race-room.js: its sockets, sleeping between races, its timer while one's on), and
   in a tab of its own (src/race-link.ts, LocalRoom: the tests, and one day the race alone). What's said both
   ways is src/race-net.ts; the browser's end is js/den/race-net.js, on a Link.

   Referee is the race's rules as the room keeps them; Recorder, every race it runs written down, small, to
   be watched again (a RaceRecord: the user, 12 Nov, "people can see games that have been played, view them
   and see the replays").

   The user (12 Nov), agreeing the room runs the race ("absolutely go for it"): one fair referee, no host
   browser to lose, nothing stalling when someone's tab is in the background. So the room keeps the race's
   field (src/den-racers.ts) and decides:
   - the lobby: who's in (six players at most), their spots on the line, how many racers the bots fill the
     field to; each waiting for pirates or pressing Start (Referee.aboard: everyone's pressed it, the count;
     someone has, the count in NET.ABOARD seconds with whoever has, the rest racing the next one);
   - after a race: called once every player in it is home or out if someone's waiting for the next
     (NET.CALL), its places shown (NET.RESULTS), then the lobby again; whoever pressed Start while waiting
     through it still has, for the next. The open races (NET.LOBBIES) are rooms like any other;
     `peek`, the room seen from outside for their list;
   - the count and the clock;
   - whose turn it is at a lock, the crane, the barrier's notch, the wreck's (first come, first served, as
     the field's rules have it): a player's taken from where she is, so it can't be missed;
   - hits: a player's claim on someone, checked (hittable, and in a broadside's reach); the bots' broadsides;
   - places and finish times;
   - the race's seed: the bots' sailing and the start's field (src/start-field.ts: everyone's the same) from
     it, chosen for the next race as one ends, so the lobby shows the field to be raced;
   - the rocks across spit 3's gap (12 Nov): everyone's hits on them, the bots' and the players', so once
     they're down they're down for every racer;
   - the bots filling the empty places, sailed by the simulation (src/race-sim.ts), the same bots as race you
     alone: the den's characters (WATCHED), on their own favourite ways round;
   - a player who drops out: a few seconds to come back (NET.GRACE), then a bot sails her sloop home.
   No cheat-proofing: the players are friends, trusted with where they say they are. */

import { SAIL, type Pose } from './den-sail.js';
import { Field, FIELD, courseSea, hittable, type RacerState, type Spot, type FieldEvent } from './den-racers.js';
import { RACE, FIRST_SPOT, spotPose, rocksDown } from './den-race.js';
import { sail as sailBots, route, style, progressAt, type SimRun } from './race-sim.js';
import { WATCHED } from './den-rivals.js';
import { NET, apart, spotOn, spotSquare, waitAt, parseUp, mvOf, mvLater, type Mv, type Phase, type Shot, type Snapshot, type SnapRacer, type Up, type Down, type Act, type Peek } from './race-net.js';
import { LAY } from './den-sail.js';
import { PlayerSea } from './race-replay.js';

const RC = LAY.RACE;

/** A player in the room. `i`: her number in the race on now (-1: not in it). `out`: her sloop's a bot's now
    (she dropped out, or sailed back out of the gate). `gone`: seconds since she dropped. */
export interface Player {
  id: string; name: string; look: unknown; ready: boolean; spot: number; on: boolean; joined: number;
  i: number; out: boolean; gone: number; took: number; st: RacerState;
  /** The hits on her the room's seen, and till when (the room's steps) she's held holed for her browser to
      say she's patching. */
  hits: number; holed: number;
  /** Her last pose heard, as it bears on the race (one the same again changes nothing, and isn't heard). */
  said?: string;
  /** The move she said she's on, and when the room heard it (its seconds), to draw her by (nothing the race
      goes by). */
  mv?: Mv; mvAt?: number;
}
/** What the room keeps of a player on her socket, to wake up with (a Durable Object sleeps between races). */
export interface Kept { id: string; name: string; look: unknown; ready: boolean; spot: number; joined: number; fill: number }

/** One of the race's racers: a player (her id), or a bot (WATCHED's number), and her spot on the line. */
interface Entry { id: string | null; rv: number; name: string; spot: number }

export class Referee {
  phase: Phase = 'lobby';
  players: Player[] = [];
  /** Racers in all, the bots filling the rest. */
  fill: number = NET.FILL;
  seed = 1;
  seq = 0;
  /** The room's own seconds (snapshots are drawn between by them). */
  at = 0;
  field: Field | null = null;
  run: SimRun | null = null;
  /** The race on now: who's each racer. */
  cast: Entry[] = [];
  shots: (Shot & { t: number })[] = [];
  private shotN = 0;
  /** The spots each player's been on while she holds them (she lets go once she's left). */
  private been = new Map<number, Set<Spot>>();
  /** The race on now being written down, and the races finished, written down, for the host to keep. */
  rec: Recorder | null = null;
  done: RaceRecord[] = [];
  /** The race's steps run (from the count), and the time towards the next. */
  k = 0;
  private acc = 0;
  /** This run of the room (snapshots are numbered in it). `random`: the room's dice (seeded, or the host's),
      for each race's seed. */
  readonly room: string;
  constructor(public random: () => number) {
    this.seed = this.newSeed();
    this.room = Math.floor(random() * 36 ** 6).toString(36);
  }
  private newSeed() { return 1 + Math.floor(this.random() * 2 ** 30); }

  /** The room's seconds when it moves on by itself (Snapshot, `soon`): in the lobby, the count once someone's
      pressed Start; racing, the race called once every player in it is home or out; done, the lobby again. */
  soonAt: number | null = null;
  /** Counting down or racing, the places up, or the lobby's clock running: the room ticks (NET.HZ) and sends
      snapshots. Otherwise it's quiet. */
  get ticking(): boolean { return this.racing || this.phase === 'done' || this.soonAt !== null; }
  /** Counting down or racing. */
  get racing(): boolean { return this.phase === 'count' || this.phase === 'on'; }
  player(id: string): Player | undefined { return this.players.find((p) => p.id === id); }
  /** Players in the room, connected, in the order they came. */
  private here(): Player[] { return this.players.filter((p) => p.on).sort((a, b) => a.joined - b.joined); }

  /** A free spot on the line, from `c` along it (`dir`), not another player's. */
  private free(c: number, dir: number, not: Player | null = null): number {
    const taken = new Set(this.players.filter((p) => p !== not).map((p) => p.spot));
    for (let k = 0; k <= RC.LINE.c1 - RC.LINE.c0; k++) {
      for (const s of k ? [c + dir * k, c - dir * k] : [c]) if (s >= RC.LINE.c0 && s <= RC.LINE.c1 && !taken.has(s)) return s;
    }
    return c;
  }

  /** A pirate's come in (or back: the same id): her place in the room, or 'full'. */
  join(id: string, name: string, look: unknown, now = this.at): Player | 'full' {
    const was = this.player(id);
    if (was) { Object.assign(was, { on: true, gone: 0, name, look: look ?? was.look }); return was; }
    if (this.players.filter((p) => p.on).length >= NET.MOST) return 'full';
    const p: Player = { id, name, look, ready: false, spot: FIRST_SPOT, on: true, joined: now + this.players.length * 1e-6, i: -1, out: false, gone: 0, took: 0, st: 'sailing', hits: 0, holed: 0 };
    p.spot = this.free(FIRST_SPOT, 1, p);
    this.players.push(p);
    return p;
  }
  /** Back from sleep: a player as her socket kept her (in the lobby; a race keeps the room awake). */
  restore(k: Kept) {
    if (this.player(k.id)) return;
    this.players.push({ ...k, on: true, i: -1, out: false, gone: 0, took: 0, st: 'sailing', hits: 0, holed: 0 });
    this.fill = k.fill;
  }
  /** What's kept of her on her socket. */
  kept(id: string): Kept | null {
    const p = this.player(id);
    return p ? { id: p.id, name: p.name, look: p.look, ready: p.ready, spot: p.spot, joined: p.joined, fill: this.fill } : null;
  }
  /** Her socket's closed: gone from the lobby; in a race, a few seconds to come back before a bot has her sloop. */
  drop(id: string) {
    const p = this.player(id);
    if (!p) return;
    p.on = false; p.gone = 0;
    if (!this.racing || p.i < 0) this.players = this.players.filter((x) => x !== p);
    // (nobody left racing: the race is off, and the room can sleep)
    if (this.racing && !this.players.some((x) => x.on && x.i >= 0)) this.toLobby();
    else this.aboard();
  }

  /** The lobby's start, Blockade-style (the user, 12 Nov: "you can either wait for people, start with bots"):
      each pirate in it is waiting for pirates, or has pressed Start (ready). Everyone's pressed it: the count,
      at once, bots filling the empty places. Someone has: the count in NET.ABOARD seconds, whoever's pressed
      Start by then in it, the rest racing the next one. Nobody has: nothing, and no clock. */
  private aboard() {
    if (this.phase !== 'lobby') return;
    const ps = this.here(), ready = ps.filter((p) => p.ready);
    if (!ready.length) this.soonAt = null;
    else if (ready.length === ps.length) this.begin();
    else this.soonAt ??= this.at + NET.ABOARD;
  }

  /** The line-up: the players in the room (or those given: the ones who've pressed Start), then bots (the
      den's characters, in order) up to `fill`, at least one if she's alone, on their own spots or the nearest
      free. */
  lineUp(ps: Player[] = this.here()): Entry[] {
    const out: Entry[] = ps.map((p) => ({ id: p.id, rv: -1, name: p.name, spot: p.spot }));
    const bots = Math.min(WATCHED.length, FIELD.ONLINE - ps.length, Math.max(this.fill - ps.length, FIELD.LEAST - ps.length, 0));
    for (let k = 0; k < bots; k++) {
      const taken = new Set(out.map((e) => e.spot));
      let s = WATCHED[k].spot;
      for (let d = 1; taken.has(s); d++) s = [WATCHED[k].spot + d, WATCHED[k].spot - d].find((x) => x >= RC.LINE.c0 && x <= RC.LINE.c1 && !taken.has(x)) ?? s;
      out.push({ id: null, rv: k, name: WATCHED[k].name, spot: s });
    }
    return out;
  }

  /** What a player's sent. */
  handle(id: string, m: Up) {
    const p = this.player(id);
    if (!p) return;
    switch (m.t) {
      case 'spot': if (this.phase === 'lobby' || this.phase === 'done') p.spot = this.free(m.c, m.c >= p.spot ? 1 : -1, p); break;
      case 'fill': if (this.phase === 'lobby' || this.phase === 'done') this.fill = m.n; break;
      // (Start, or waiting for pirates: in the lobby; once the race is done, for the next one; and, while a
      // race is on that she's not in, for the next one too)
      case 'go': case 'ready': {
        const on = m.t === 'go' || m.on;
        if (this.phase === 'lobby' || this.phase === 'done' || p.i < 0 || p.out) p.ready = on;
        if (this.phase === 'done' && this.here().every((x) => x.ready)) this.toLobby();
        this.aboard();
        break;
      }
      case 'again': if (this.phase === 'done' || (this.phase === 'on' && this.players.every((x) => x.i < 0 || x.out || this.field!.racers[x.i].state === 'finished'))) this.toLobby(); break;
      case 'pose': {
        if (!this.field || p.i < 0 || p.out) break;
        if (m.acts?.length) this.rec?.acted(p.i, m.acts);
        // (the move she's on: only to draw her by, passed on to everyone in the snapshots)
        if (m.mv) { p.mv = m.mv; p.mvAt = this.at; }
        // (the same pose again changes nothing: not heard, so not written down either)
        const said = JSON.stringify([m.c, m.r, m.d, m.st, m.took, m.sh, m.leg, m.home]);
        if (said === p.said) break;
        p.said = said;
        this.rec?.input(this.k, [p.i, 'p', m.n - this.k, RECORD.STATES.indexOf(m.st), m.took, m.sh, m.leg, ...(m.home === null ? [] : [m.home])]);
        this.pose(p, m);
        break;
      }
      case 'hit': if (this.phase === 'on' && p.i >= 0 && !p.out) { this.rec?.input(this.k, [p.i, 'h', m.on]); this.claim(p, m.on); } break;
      case 'rock': if (this.phase === 'on' && p.i >= 0 && !p.out) { this.rec?.input(this.k, [p.i, 'r']); this.blast(p); } break;
      case 'retire': if (this.racing && p.i >= 0 && !p.out) { this.rec?.input(this.k, [p.i, 'o']); this.takeOver(p); } break;
      default: break;
    }
  }

  /** The count: the field lined up from the lobby (whoever's pressed Start), on the seed the lobby's shown (its
      start's field). */
  begin() {
    const ps = this.here().filter((p) => p.ready);
    this.cast = this.lineUp(ps);
    this.soonAt = null;
    for (const p of this.players) Object.assign(p, { i: -1, out: false, took: 0, st: 'sailing', gone: 0, hits: 0, holed: 0, said: undefined });
    this.cast.forEach((e, i) => { const p = e.id ? this.player(e.id) : null; if (p) p.i = i; });
    this.field = new Field(this.cast.map((e) => e.name), courseSea(), RACE.COUNT, FIELD.ONLINE);
    this.field.start();
    this.cast.forEach((e, i) => { this.field!.racers[i].pose = spotPose(e.spot); });
    this.run = null;
    this.shots = []; this.shotN = 0; this.been.clear(); this.k = 0; this.acc = 0;
    this.phase = ps.length ? 'count' : 'lobby';
    this.rec = this.phase === 'count' ? new Recorder(this.newId(), this.seed, this.cast.map((e, i) => {
      const p = e.id ? this.player(e.id) : null, k = this.cast.slice(0, i).filter((x) => x.id).length, W = WATCHED[e.rv];
      return { name: e.name, id: e.id, rv: e.rv, look: p ? p.look : W.look, sail: p ? NET.SAILS[k % NET.SAILS.length] : W.sail, flag: p ? NET.FLAG : W.flag, spot: e.spot };
    })) : null;
  }
  /** A race's id: ten letters and digits. */
  newId(): string { return Array.from({ length: 10 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(this.random() * 36)]).join(''); }
  /** The race written down, finished (some may still be racing: their places null), for the host to keep. */
  private written() {
    if (this.rec && this.field && this.field.order.length) this.done.push(this.rec.finish(this.field, this.k));
    this.rec = null;
  }
  /** Back to the lobby for the next race, anyone gone let go: whoever's pressed Start for it still has (those
      who waited through the race, say), and its clock starts if anyone has; a race cut short, a fresh seed for
      the next. */
  toLobby() {
    this.written();
    if (this.phase === 'count' || this.phase === 'on') this.seed = this.newSeed();
    this.phase = 'lobby';
    this.field = null; this.run = null; this.cast = []; this.soonAt = null;
    this.players = this.players.filter((p) => p.on);
    for (const p of this.players) Object.assign(p, { i: -1, out: false, gone: 0, took: 0 });
    this.aboard();
  }

  /** A player's sloop sailed by a bot from now on (or, before the gun, as soon as it goes). */
  private takeOver(p: Player) {
    p.out = true;
    this.rec?.event({ k: this.k, kind: 'out', i: p.i });
    if (this.run) this.run.adopt(p.i);
  }

  /** Her pose: where she is, her stretch, what she's doing; home if she says so; her turn at a spot. */
  private pose(p: Player, m: Extract<Up, { t: 'pose' }>) {
    const F = this.field!, r = F.racers[p.i];
    if (r.state === 'finished') return;
    p.took = m.took; p.st = m.st;
    r.shots = m.sh;
    if (this.phase !== 'on') return;   // (on the line for the count: held on her spot)
    if (m.leg > r.leg) r.leg = m.leg;   // (the starlit door's tunnel counts its stretches: trusted)
    const at: Pose = { c: m.c, r: m.r, d: m.d };
    F.move(p.i, at);
    const home = () => F.racers[p.i].state === 'finished';   // (the move may have brought her home)
    if (m.home !== null && !home()) F.home(p.i, Math.max(0, Math.min(F.t, m.home)));
    if (!home()) this.spots(p);
    this.stateOf(p);
  }

  /** First come, first served, from where she is: on a spot's square, she has it if it's free or waits her
      turn (her browser keeps her out of it till it's hers); she lets go of it once she's been on it and left
      (or gone off), and gives up her place waiting if she sails away. */
  private spots(p: Player) {
    const F = this.field!, r = F.racers[p.i], been = this.been.get(p.i) ?? new Set<Spot>();
    this.been.set(p.i, been);
    for (const s of Object.keys(FIELD.SPOTS) as Spot[]) {
      const [c, y] = spotSquare(s), d = apart(r.pose, c, y);
      if (F.holder(s) === p.i) {
        if (d === 0) been.add(s);
        if (d > NET.WAIT_NEAR || (been.has(s) && d > NET.HOLD_NEAR)) { F.release(p.i, s); been.delete(s); }
      } else if ((F.queues.get(s) ?? []).includes(p.i) && d > NET.WAIT_NEAR) F.leave(p.i, s);
    }
    // (in the locks' berth while someone has the up lock, she's waiting her turn for it: her browser puts
    // her there, out of it)
    const berth = waitAt('lock-up'), held = F.holder('lock-up');
    const on = spotOn(r.pose.c, r.pose.r) ?? (apart(r.pose, berth.c, berth.r) === 0 && held >= 0 && held !== p.i ? 'lock-up' : null);
    if (on && F.holder(on) !== p.i && !(F.queues.get(on) ?? []).includes(p.i) && F.claim(p.i, on) === 'yours') been.add(on);
  }
  /** What she's doing, as the field has it: holed by a hit she's not taken yet (dazed, till her browser has
      it and says she's patching: a second's grace for that), waiting her turn, or as she says. */
  private stateOf(p: Player) {
    const F = this.field!, r = F.racers[p.i];
    if (r.state === 'finished' || p.out) return;
    if (r.hits > p.hits) { p.hits = r.hits; p.holed = this.k + Math.round(1 / NET.STEP); }
    const waiting = [...F.queues.values()].some((q) => q.includes(p.i));
    r.state = r.hits > p.took || this.k < p.holed ? 'dazed' : waiting ? 'waiting' : p.st;
  }

  /** Her claim: her broadside's come down on racer `on`. Holed if she can be hit and is in a broadside's
      reach of her (trusted otherwise), and shown to everyone. */
  private claim(p: Player, on: number) {
    const F = this.field!, me = F.racers[p.i], t = F.racers[on];
    if (!t || on === p.i || me.state === 'finished' || !hittable(t)) return;
    if (apart(me.pose, Math.round(t.pose.c), Math.round(t.pose.r)) > SAIL.RANGE + 1) return;
    if (!(this.run ? this.run.hit(on, p.i) : F.hit(on, p.i))) return;
    this.shot({ kind: 'shot', racer: p.i, cells: [[Math.round(t.pose.c), Math.round(t.pose.r)]], hit: on });
  }
  /** Her broadside on the rocks: a hit on them, counted (once they're down, nothing more). */
  private blast(p: Player) {
    const F = this.field!;
    if (F.racers[p.i].state === 'finished' || rocksDown(F)) return;
    if (F.blast(RACE.ROCKS.HITS)) this.rec?.event({ k: this.k, kind: 'rocks', i: p.i, hits: F.rocks });
  }
  private shot(e: Extract<FieldEvent, { kind: 'shot' }>) {
    this.shots.push({ n: ++this.shotN, by: e.racer, on: e.hit, cells: e.cells, t: this.at });
    if (e.hit >= 0) this.rec?.event({ k: this.k, kind: 'hit', by: e.racer, on: e.hit });
  }

  /** The room's tick (NET.HZ while ticking), `dt` seconds of the host's: the race on in whole steps
      (NET.STEP), the rest carried to the next tick. */
  tick(dt: number) {
    this.at += dt;
    // (the lobby's clock run out: the count, whoever's pressed Start in it; the places shown long enough:
    // the lobby again, for the next race)
    if (this.soonAt !== null && this.at >= this.soonAt - 1e-9) {
      if (this.phase === 'lobby') this.begin();
      else if (this.phase === 'done') this.toLobby();
    }
    if (!this.field || !this.racing) { this.acc = 0; return; }
    this.acc += dt;
    while (this.acc >= NET.STEP - 1e-9 && this.racing) { this.acc -= NET.STEP; this.step(); }
  }
  /** One step of the race: the count, then the race, its bots, the dropped. A player dropped too long is
      taken over first, at the step's start, as if she'd said so between steps. */
  step() {
    const F = this.field!, dt = NET.STEP;
    for (const p of this.players) {
      if (this.phase !== 'on' || p.i < 0 || p.out || p.on) continue;
      if ((p.gone += dt) > NET.GRACE) { this.rec?.input(this.k, [p.i, 'o']); this.takeOver(p); }
    }
    this.k++;
    if (this.phase === 'count') {
      F.tick(dt);
      if (F.state !== 'on') return;
      this.phase = 'on';
      const bots = this.cast.flatMap((e) => (e.id ? [] : [e]));
      const humans = this.cast.length - bots.length;
      this.run = sailBots({
        field: F, seed: this.seed, humans,
        racers: bots.map((e) => { const R = WATCHED[e.rv].racer; return { route: route(R.route), style: style(R.style), skill: R.skill, spot: e.spot }; }),
      });
      for (const p of this.players) if (p.i >= 0 && p.out) this.run.adopt(p.i);
      return;
    }
    F.tick(dt);
    for (const e of this.run!.step(dt)) if (e.kind === 'shot') this.shot(e);
    for (const p of this.players) if (p.i >= 0 && !p.out) this.stateOf(p);
    this.shots = this.shots.filter((x) => this.at - x.t <= NET.SHOTS);
    this.rec?.watch(F, this.run!, this.k);
    // (every player in it home or out, and someone's come in waiting for the next race: the bots have
    // NET.CALL seconds more to come in, then it's called)
    const home = this.players.every((p) => p.i < 0 || p.out || F.racers[p.i].state === 'finished');
    if (home && this.soonAt === null && this.players.some((p) => p.on && p.i < 0)) this.soonAt = this.at + NET.CALL;
    if (F.state === 'done' || F.t > NET.LONGEST || (this.soonAt !== null && this.at >= this.soonAt)) this.over();
  }
  /** The race over (or called): its places shown for NET.RESULTS seconds, then the lobby for the next.
      Those who raced it are waiting again; those who waited through it for the next still want it. */
  private over() {
    this.phase = 'done';
    for (const p of this.players) if (p.i >= 0) p.ready = false;
    this.soonAt = this.at + NET.RESULTS;
    this.written();
    this.seed = this.newSeed();   // (the next race's start's field, shown in the lobby)
  }

  /** A race replayed from what was written down: the same field, seed and bots, each player's input heard at
      the step it was, her squares then from her sloop's own replay (PlayerSea). The field as it ends. */
  static replay(rec: RaceRecord): Field {
    const R = new Referee(() => 0.5);
    R.cast = rec.racers.map((x) => ({ id: x.id, rv: x.rv, name: x.name, spot: x.spot }));
    R.players = rec.racers.flatMap((x, i) => (x.id ? [{ id: x.id, name: x.name, look: null, ready: true, spot: x.spot, on: true, joined: i, i, out: false, gone: 0, took: 0, st: 'sailing' as RacerState, hits: 0, holed: 0 }] : []));
    R.field = new Field(R.cast.map((e) => e.name), courseSea(), RACE.COUNT, FIELD.ONLINE);
    R.field.start();
    R.cast.forEach((e, i) => { R.field!.racers[i].pose = spotPose(e.spot); });
    R.seed = rec.seed; R.phase = 'count';
    const seas = rec.racers.map((x, i) => (x.id ? new PlayerSea(x.spot, rec.acts[i], rec.seed, i) : null));
    let j = 0, at = rec.inputs.length ? rec.inputs[0][0] : Infinity;
    while (R.k < rec.steps && R.field.state !== 'done') {
      for (; j < rec.inputs.length && at === R.k; j++, at += rec.inputs[j]?.[0] ?? 0) {
        const [, i, what, ...x] = rec.inputs[j] as [number, number, string, ...number[]];
        const id = rec.racers[i].id!;
        if (what === 'p') {
          const n = R.k + x[0], sq = seas[i]!.to(n);
          R.handle(id, { t: 'pose', c: sq.c, r: sq.r, d: sq.d, n, st: RECORD.STATES[x[1]], took: x[2], sh: x[3], leg: x[4], home: x[5] ?? null });
        } else if (what === 'h') R.handle(id, { t: 'hit', on: x[0] });
        else if (what === 'r') R.handle(id, { t: 'rock' });
        else if (what === 'o') R.handle(id, { t: 'retire' });
      }
      R.step();
    }
    return R.field;
  }

  /** Seconds till the room moves on by itself, or null. */
  private soon(): number | null { return this.soonAt === null ? null : Math.max(0, Math.round((this.soonAt - this.at) * 10) / 10); }
  /** The room seen from outside (the open races' list): what it's doing, and who's in, racing or waiting. */
  peek(): Peek {
    return {
      phase: this.phase, clock: Math.round(this.field ? this.field.t : 0), soon: this.soon(), fill: this.fill, most: NET.MOST,
      players: this.here().map((p) => ({ name: p.name, ready: p.ready, racing: p.i >= 0 && !p.out && this.racing })),
    };
  }
  /** The whole race as it is now, numbered. */
  snapshot(): Snapshot {
    const F = this.field, q = (x: number) => Math.round(x * 100) / 100;
    const cast = F ? this.cast : this.lineUp();
    const racers: SnapRacer[] = cast.map((e, i) => {
      const r = F?.racers[i], pose = r?.pose ?? spotPose(e.spot), p = e.id ? this.player(e.id) : null;
      // (the move she's on: a bot's, as the room sails her; a player's, as her browser said)
      const bm = this.phase === 'on' ? this.run?.motion(i) : null;
      const mv = bm ? mvOf(bm) : p?.mv && !p.out && this.phase === 'on' ? mvLater(p.mv, this.at - (p.mvAt ?? this.at)) : undefined;
      return {
        ...(mv ? { mv } : {}),
        name: e.name, id: e.id, rv: e.rv, bot: !!p?.out, spot: e.spot,
        c: q(pose.c), r: q(pose.r), d: pose.d, leg: r?.leg ?? 0, st: r?.state ?? 'sailing',
        shots: r?.shots ?? FIELD.SHOTS, hits: r?.hits ?? 0, time: r?.time ?? null, place: r?.place ?? null,
        prog: q(this.run ? this.run.progress(i) : progressAt(pose)), lift: q(this.run?.lift(i) ?? 0),
      };
    });
    return {
      t: 'snap', room: this.room, seq: ++this.seq, phase: this.phase, at: q(this.at), clock: q(F ? F.t : 0), seed: this.seed, fill: this.fill,
      soon: this.soon(),
      players: this.players.map((p) => ({ id: p.id, name: p.name, look: p.look, ready: p.ready, on: p.on, racing: p.i >= 0 && !p.out })),
      racers, holds: F ? [...F.holds.entries()] : [], shots: this.shots.map(({ n, by, on, cells }) => ({ n, by, on, cells })), rocks: F ? F.rocks : 0,
    };
  }
}

/** What to send, and to whom: a connection's id. */
export interface Out { to: string; msg: Down }

/** A race's room, for any host to run: its connections (each a string of the host's: a socket, a tab),
    which player each is once she's said hello, and the race (a Referee). Every answer is a list of what to
    send to whom. While `ticking` (counting down or racing), the host calls tick NET.HZ times a second, with
    its clock in seconds; otherwise it needn't (and a Durable Object can sleep). */
export class RaceServer {
  readonly race: Referee;
  /** Each connection's player (null till she's said hello). */
  readonly conns = new Map<string, string | null>();
  private last: number | null = null;
  constructor(public code: string, public random: () => number) { this.race = new Referee(random); }
  get ticking(): boolean { return this.race.ticking; }
  /** Races finished since last asked, written down (RaceRecord), for the host to keep. */
  records(): RaceRecord[] { return this.race.done.splice(0); }
  /** The room seen from outside, for the open races' list (Referee.peek). */
  peek(): Peek { return this.race.peek(); }

  /** Everyone who's said hello, the race as it is now. */
  private everyone(): Out[] {
    const snap = this.race.snapshot();
    return [...this.conns].filter(([, id]) => id).map(([to]) => ({ to, msg: snap }));
  }
  /** A connection's opened (nothing's said till she says hello). */
  join(conn: string): Out[] { this.conns.set(conn, null); return []; }
  /** Back from sleep: a connection and the player it was (Referee.kept). */
  restore(conn: string, k: Kept) { this.conns.set(conn, k.id); this.race.restore(k); }
  /** What to keep on a connection, to wake up with. */
  kept(conn: string): Kept | null { const id = this.conns.get(conn); return id ? this.race.kept(id) : null; }

  /** What a connection's sent (raw, as it came, or already read). */
  message(conn: string, data: unknown): Out[] {
    const m = typeof data === 'string' ? parseUp(data) : (data as Up | null);
    if (!m || !this.conns.has(conn)) return [];
    if (m.t === 'hello') {
      const id = this.conns.get(conn) ?? m.id ?? Array.from({ length: 10 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(this.random() * 36)]).join('');
      const p = this.race.join(id, m.name, m.look ?? null);
      if (p === 'full') return [{ to: conn, msg: { t: 'full' } }];
      const out: Out[] = [];
      // (the same pirate on another connection: that one's let go)
      for (const [c, x] of this.conns) if (c !== conn && x === id) { this.conns.set(c, null); out.push({ to: c, msg: { t: 'closed' } }); }
      this.conns.set(conn, id);
      return [...out, { to: conn, msg: { t: 'welcome', id, code: this.code } }, ...this.everyone()];
    }
    const id = this.conns.get(conn);
    if (!id) return [];
    if (m.t === 'sync') return [{ to: conn, msg: this.race.snapshot() }];
    const was = this.ticking;
    this.race.handle(id, m);
    if (!was && this.ticking) this.last = null;
    // (a pose or a hit is answered by the next tick's snapshot; anything in the lobby, at once)
    return m.t === 'pose' || m.t === 'hit' ? [] : this.everyone();
  }
  /** A connection's closed. */
  leave(conn: string): Out[] {
    const id = this.conns.get(conn);
    this.conns.delete(conn);
    if (!id || [...this.conns.values()].includes(id)) return [];
    this.race.drop(id);
    return this.everyone();
  }
  /** The clock: `now` in seconds, the host's. The race on by the time since the last tick (half a second at
      most, after a stall), and everyone the race as it is. */
  tick(now: number): Out[] {
    const dt = this.last === null ? 1 / NET.HZ : Math.max(0, Math.min(0.5, now - this.last));
    this.last = now;
    if (this.race.rec && !this.race.rec.rec.date) this.race.rec.rec.date = Math.round(now * 1000);
    if (!this.ticking) return [];
    this.race.tick(dt);
    return this.everyone();
  }
}

/* ---- Races written down, to watch again ---- */

/** A race written down (the user, 12 Nov: "people can see games that have been played, view them and see the
    replays"), kept small: "you don't need positions 4 times a second, you just need moves ... really all you
    need is to save somebody's actions." So: its seed (every bot's sailing, and the start's field, from it:
    bots are written down as nothing more); its racers (names, looks, sails, spots); each player's actions at
    the helm with the race's clock (`acts`: src/race-net.ts, Act: moves, pins, moorings, broadsides); what the
    room decided (`events`: hits, turns at the spots, the rocks' hits, finishes, a player's sloop taken over by a bot);
    a keyframe of every racer's square, facing and what she's doing every RECORD.KEY seconds (to put right any
    drift in replaying, and to start watching from the middle); the places and times; and each racer's
    puzzle moves (`moves`: empty for now, to be filled in). `v`: the version, for a viewer to read it by. */
export const RECORD = { V: 1, KEY: 5 * 60, STATES: ['sailing', 'waiting', 'puzzling', 'dazed', 'carried', 'finished'] as RacerState[] } as const;
export interface RecordRacer { name: string; id: string | null; rv: number; look: unknown; sail: string; flag: string; spot: number }
/** What the room decided, at its step `k` (for a viewer's timeline: a replay works them out again). */
export type RecordEvent =
  | { k: number; kind: 'hit'; by: number; on: number }
  | { k: number; kind: 'turn'; i: number; spot: Spot }
  | { k: number; kind: 'rocks'; i: number; hits: number }
  | { k: number; kind: 'finish'; i: number; place: number; time: number }
  | { k: number; kind: 'out'; i: number };
/** What a player said that changed the race, in order, each at the room's steps since the one before (`dk`),
    from whom (`i`): her pose (`p`: the steps she'd sailed, less the room's then; what she was doing as
    RECORD.STATES' number, the room's hits she'd taken, shots loaded, her stretch, and her time home once
    she's home; her squares are her sloop's replay at those steps), a hit she claimed (`h`: on whom), a hit
    on the rocks (`r`), out of the race (`o`: a bot sails her sloop from here). */
export type RecordInput = [dk: number, i: number, what: 'p' | 'h' | 'r' | 'o', ...x: number[]];
export interface RaceRecord {
  v: number; id: string; date: number; seed: number;
  /** The race's step (seconds: NET.STEP), the room's steps it ran (from the count), and the steps between
      keyframes. */
  step: number; steps: number; key: number;
  inputs: RecordInput[];
  racers: RecordRacer[];
  /** Each racer's actions at the helm, in order, stamped with her steps sailed (a bot's: none, her sailing's
      the seed's). */
  acts: Act[][];
  events: RecordEvent[];
  /** Keyframes, only to start watching from the middle quicker (a replay doesn't need them): [the room's
      step, then for each racer c × 10, r × 10, facing, what she's doing (RECORD.STATES' number)]. */
  keys: number[][];
  places: { i: number; place: number | null; time: number | null }[];
  /** Each racer's puzzle moves (empty for now). */
  moves: unknown[][];
}
/** Writing a race down as it's run (Referee keeps one a race). */
export class Recorder {
  readonly rec: RaceRecord;
  private next = 0;
  private holds = new Map<Spot, number>();
  private rocks = 0;
  private home = new Set<number>();
  constructor(id: string, seed: number, racers: RecordRacer[]) {
    this.rec = { v: RECORD.V, id, date: 0, seed, step: NET.STEP, steps: 0, key: RECORD.KEY, racers, inputs: [], acts: racers.map(() => []), events: [], keys: [], places: [], moves: racers.map(() => []) };
  }
  event(e: RecordEvent) { this.rec.events.push(e); }
  private lastK = 0;
  /** What a player said at the room's step `k`. */
  input(k: number, x: [number, 'p' | 'h' | 'r' | 'o', ...number[]]) { this.rec.inputs.push([k - this.lastK, ...x]); this.lastK = k; }
  /** A player's actions, as her browser sent them. */
  acted(i: number, acts: Act[]) { this.rec.acts[i]?.push(...acts); }
  private keyframe(F: Field, k: number) {
    this.rec.keys.push([k, ...F.racers.flatMap((r) => [Math.round(r.pose.c * 10), Math.round(r.pose.r * 10), r.pose.d, RECORD.STATES.indexOf(r.state)])]);
  }
  /** Each step under way: a keyframe now and then; who's been given a spot, the rocks' hits (a bot's: a
      player's is written as she makes it), who's home. */
  watch(F: Field, run: SimRun, k: number) {
    if (k >= this.next) { this.next = k + RECORD.KEY; this.keyframe(F, k); }
    for (const [s, i] of F.holds) if (this.holds.get(s) !== i) this.event({ k, kind: 'turn', i, spot: s });
    this.holds = new Map(F.holds);
    const said = this.rec.events.filter((e) => e.kind === 'rocks').length;
    if (F.rocks > Math.max(this.rocks, said)) this.event({ k, kind: 'rocks', i: -1, hits: F.rocks });
    this.rocks = F.rocks;
    F.racers.forEach((r, i) => {
      if (r.time !== null && !this.home.has(i)) { this.home.add(i); this.event({ k, kind: 'finish', i, place: r.place ?? 0, time: r.time }); }
    });
  }
  /** Done, `k` steps run: a last keyframe, the places and times as they stand. */
  finish(F: Field, k: number): RaceRecord {
    this.keyframe(F, k);
    this.rec.steps = k;
    this.rec.places = F.racers.map((r, i) => ({ i, place: r.place, time: r.time }));
    return this.rec;
  }
}
