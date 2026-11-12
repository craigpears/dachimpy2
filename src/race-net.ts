/* Pirate Den: the sloop race online, what's said between a browser and its race's room. TypeScript, compiled
   to js/race-net.js; tested in tests/race-net.test.ts. Pure: no sockets, no 3D. The room (worker/race-room.js)
   runs the race by src/race-server.ts (the links between, src/race-link.ts); each browser (js/den/race-net.js) sails its own sloop and draws the
   rest from what the room sends. RACE.md §6, "Real players racing each other online".

   The user (12 Nov): "what would it take to make the sloop race things multiplayer? So you can have like a
   handful of people playing", not peer to peer ("peer-to-peer architecture was a major problem when I've done
   something before"), and, on keeping in step: one player missing a message the other didn't, "and before
   you know it, you're on top of a rock." So it heals itself:
   - The room sends the whole race every time (a Snapshot, numbered): every racer's pose and state, whose
     turn it is at each spot, places and times, the recent broadsides. Never a change on its own, never an
     event that has to arrive for things to be right. A missed one is put right by the next, an eighth of a
     second later.
   - Anything that happens once (a hit, a turn at the lock, a finish) is in the state the snapshots carry:
     a racer's hits taken is a count, so a hit whose broadside was missed is still taken (Mirror, `took`);
     a turn is who holds the spot; a finish is a time and a place.
   - Your own sloop is sailed in your browser against your own sea, as alone: what comes from the room only
     says where everyone else is, whose turn it is, and what's hit you.
   - Everyone else's sloop is drawn only from snapshots, a moment behind the newest and in between two
     (poseAt), never sailed on by itself: past the newest, she waits where it had her.
   What a browser sends is its own sloop's pose a few times a second (pose: where, what she's doing, the hits
   it's taken, home and when), and claims (a hit on someone); the room's answer is the next snapshot. */

import { LAY, SAIL, type Pose } from './den-sail.js';
import { FIELD, hittable, type Field, type FieldEvent, type RacerState, type Spot } from './den-racers.js';
import type { Drive, Driver } from './den-race.js';
import { progressAt } from './race-sim.js';

const RC = LAY.RACE;

export const NET = {
  /** Players in one race's room at most; bots fill the field up to `fill`, six racers at most (FIELD.ONLINE). */
  MOST: FIELD.ONLINE,
  /** Racers in all by default, players and bots. */
  FILL: 4,
  /** The race's step, in seconds: it's run in whole steps of this (the helm, the field, the bots), in the room
      and in every browser, so a race replayed from its actions comes out the same, step for step (the user,
      12 Nov: "everybody should always be on the same turn"). */
  STEP: 1 / 60,
  /** Snapshots a second while the room's counting down or racing (it's quiet otherwise, and sleeps). */
  HZ: 8,
  /** Your pose a second, sent to the room. */
  SEND: 5,
  /** Seconds behind the room's newest snapshot that everyone else's sloop is drawn (between two of them). */
  BEHIND: 0.25,
  /** Snapshots kept to draw between. */
  KEEP: 12,
  /** Squares between two snapshots past which she's put straight there (a gust, a sweep, the crane), not
      slid across the land. */
  JUMP: 2.5,
  /** Seconds a broadside stays in the snapshots, to be shown. */
  SHOTS: 3,
  /** Seconds a dropped player has to come back before a bot sails her sloop. */
  GRACE: 6,
  /** A race's seconds at most, before the room calls it. */
  LONGEST: 900,
  /** A spot's yours while you're within a square of it once you've been on it (two before), and you keep
      your place waiting for it within two. */
  HOLD_NEAR: 1,
  WAIT_NEAR: 2,
  /** A race's code: four letters, none easily misread. */
  CODE: /^[A-Z]{4}$/,
  LETTERS: 'ABCDEFGHJKMNPQRSTUVWXYZ',
  /** Players' sails, each their own (in the order they're in the race), told apart from the den's characters';
      and their flag. */
  SAILS: ['#7a3fb0', '#d9612a', '#1d8a8a', '#c43b7a', '#e8e4d8', '#3a5ad0'],
  FLAG: '#1d1a18',
  /** A pirate's name, as everywhere in the den: three to sixteen letters. */
  NAME: /^[A-Za-z]{3,16}$/,
} as const;

/** A fresh race code. */
export const makeCode = (random: () => number = Math.random): string => Array.from({ length: 4 }, () => NET.LETTERS[Math.floor(random() * NET.LETTERS.length)]).join('');
/** A name as the den writes it: a capital, then small letters ('Deckhand' if it isn't one). */
export const tidyName = (s: unknown): string => {
  const t = String(s ?? '').trim();
  return NET.NAME.test(t) ? t[0].toUpperCase() + t.slice(1).toLowerCase() : 'Deckhand';
};

export type Phase = 'lobby' | 'count' | 'on' | 'done';
/** A player in the room: their name and look, ready or not, connected or not, and whether they're in the
    race on now (`racing`: a player who came in during one races the next). */
export interface SnapPlayer { id: string; name: string; look: unknown; ready: boolean; on: boolean; racing: boolean }
/** A racer, as the room has her: who (a player's id, or the bot's rival: WATCHED's number), her spot on the
    line, where she is, her stretch, what she's doing, shots, hits taken, time and place, how far round the
    long way (seconds of it), how high the crane has her; `bot`: a player's sloop a bot has taken over. */
export interface SnapRacer {
  name: string; id: string | null; rv: number; bot: boolean; spot: number;
  c: number; r: number; d: number; leg: number; st: RacerState;
  shots: number; hits: number; time: number | null; place: number | null; prog: number; lift: number;
}
/** A broadside, numbered in the race: who fired (-1 a gun of the gap's), who it holed (-1 nobody), its squares. */
export interface Shot { n: number; by: number; on: number; cells: [number, number][] }
/** The whole race, every time. `room`: this run of the room (a room that's slept or been moved starts its
    numbers again, so a browser starts afresh when it changes); `seq`, numbered in it. `at`: the room's own
    seconds (for drawing between snapshots); `clock`: the count's seconds left, or the race's clock. In the
    lobby, `racers` is the line-up as it would race. `seed`: the race's (its start's field, src/start-field.ts,
    the same for everyone, laid from it in the lobby too: the next race's). `rocks`: the hits on the rocks across
    spit 3's gap, everyone's (12 Nov: down at ROCKS.HITS, open to every racer). */
export interface Snapshot {
  t: 'snap'; room: string; seq: number; phase: Phase; at: number; clock: number; seed: number; fill: number;
  players: SnapPlayer[]; racers: SnapRacer[]; holds: [Spot, number][]; shots: Shot[]; rocks: number;
}

/** What a browser sends. */
export type Up =
  | { t: 'hello'; name: string; look?: unknown; id?: string }
  | { t: 'spot'; c: number }
  | { t: 'fill'; n: number }
  | { t: 'ready'; on: boolean }
  | { t: 'go' }
  | { t: 'again' }
  /** Her sloop: where, what she's doing, the room's hits she's taken (`took`), her stretch, shots loaded,
      and her time once she's home (sent every time after: nothing that must arrive once); and what she's
      done at the helm since the last (`acts`, for the race's record: Act), and the race's steps she's sailed
      from the gun (`n`: src/race-replay.ts, STEP). */
  | { t: 'pose'; c: number; r: number; d: number; st: RacerState; took: number; leg: number; sh: number; home: number | null; n: number; acts?: Act[] }
  /** A claim: her broadside's come down on racer `on` (the room's number). */
  | { t: 'hit'; on: number }
  /** Her broadside's come down on the rocks across spit 3's gap: a hit on them, everyone's. */
  | { t: 'rock' }
  /** Out of the race (sailed back out through the gate): a bot takes her sloop. */
  | { t: 'retire' }
  /** Send me the race as it is. */
  | { t: 'sync' };
/** Something done at the helm, at the race's clock (seconds): a move put in (F, L or R), the last taken back
    (`unput`), the pin pulled up (`stop`), a pin dropped on a square, moored on one (taken there: the line, the
    crane, out of a spot that's someone else's), a broadside fired (L or R). What a race's record keeps of a
    player (src/race-server.ts, RaceRecord). */
export type Act = [n: number, a: ActKind, ...args: unknown[]];
/** What can be done to her helm (src/race-replay.ts, PlayerSea.act, says what each does): a Helm method by
    its name and its arguments as they were (put, unput, stop, drop a pin, moor, a gust, the oars out or in, a
    stroke, holed, a lock pumped); a broadside fired (`fire`, L or R); patched (`patched`); the barrier of
    driftwood cleared (`clear`); a square shut to her or opened (someone else's spot: `shut`, `open`); the
    breeze as it changed (`breeze`, its way and strength); the rocks come down on her sea (`rocks`, whoever's
    shots it was). Stamped with the steps sailed before it. */
export type ActKind = 'put' | 'unput' | 'stop' | 'drop' | 'moor' | 'gust' | 'row' | 'stroke' | 'hit' | 'pump' | 'fire' | 'patched' | 'clear' | 'shut' | 'open' | 'breeze' | 'rocks';
export const ACTS: ReadonlySet<string> = new Set<ActKind>(['put', 'unput', 'stop', 'drop', 'moor', 'gust', 'row', 'stroke', 'hit', 'pump', 'fire', 'patched', 'clear', 'shut', 'open', 'breeze', 'rocks']);
/** Actions as they came, checked for shape: at most 60 at once, each a step, a kind, and small arguments. */
export function cleanActs(x: unknown): Act[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 60).filter((a): a is Act => Array.isArray(a) && Number.isInteger(a[0]) && a[0] >= 0 && ACTS.has(a[1]) && JSON.stringify(a).length < 600);
}

/** What the room sends: who you are, then snapshots. (`closed`: the link's gone, said by the link itself, or
    by the room when the same pirate's come in elsewhere.) */
export type Down = { t: 'welcome'; id: string; code: string } | { t: 'full' } | { t: 'closed' } | Snapshot;

/** How a browser talks to its race's room, whatever's between them (src/race-link.ts: a WebSocket to the
    den's room, or a room in the same tab): what it sends, what comes, and done. A link that closes says so
    with `closed`. */
export interface Link { send(m: Up): void; onMessage(fn: (m: Down) => void): void; close(): void }

const num = (x: unknown, lo: number, hi: number, d = 0): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d);
const STATES: RacerState[] = ['sailing', 'waiting', 'puzzling', 'dazed', 'carried', 'finished'];
/** A browser's message, checked for shape (players are trusted, but a garbled one shouldn't break the
    room); null if it isn't one. */
export function parseUp(data: unknown): Up | null {
  if (typeof data !== 'string' || data.length > 20000) return null;
  let m: Record<string, unknown>;
  try { m = JSON.parse(data); } catch { return null; }
  if (!m || typeof m !== 'object') return null;
  switch (m.t) {
    case 'hello': return { t: 'hello', name: tidyName(m.name), look: m.look && typeof m.look === 'object' ? m.look : undefined, id: typeof m.id === 'string' && /^[a-z0-9]{4,16}$/.test(m.id) ? m.id : undefined };
    case 'spot': return { t: 'spot', c: Math.round(num(m.c, RC.LINE.c0, RC.LINE.c1, RC.LINE.c0)) };
    case 'fill': return { t: 'fill', n: Math.round(num(m.n, FIELD.LEAST, FIELD.ONLINE, NET.FILL)) };
    case 'ready': return { t: 'ready', on: !!m.on };
    case 'go': case 'again': case 'retire': case 'sync': case 'rock': return { t: m.t };
    case 'hit': return { t: 'hit', on: Math.round(num(m.on, 0, FIELD.ONLINE - 1, -1)) };
    case 'pose': return {
      t: 'pose', c: num(m.c, 0, SAIL.COLS), r: num(m.r, 0, 200), d: Math.round(num(m.d, 0, 3)),
      st: STATES.includes(m.st as RacerState) && m.st !== 'finished' && m.st !== 'waiting' ? m.st as RacerState : 'sailing',
      took: Math.round(num(m.took, 0, 999)), leg: Math.round(num(m.leg, 0, RC.STRETCHES.length - 1)), sh: Math.round(num(m.sh, 0, FIELD.HOLD)),
      home: typeof m.home === 'number' && Number.isFinite(m.home) && m.home > 0 ? m.home : null,
      n: Math.round(num(m.n, 0, 1e7)),
      acts: cleanActs(m.acts),
    };
    default: return null;
  }
}

/* ---- The spots, one racer's at a time (the locks, the crane, the barrier's notch, the wreck's) ---- */
const SPOTS = Object.entries(FIELD.SPOTS) as [Spot, [number, number]][];
/** Squares apart, any way. */
export const apart = (a: { c: number; r: number }, c: number, r: number): number => Math.max(Math.abs(Math.round(a.c) - c), Math.abs(Math.round(a.r) - r));
/** The spot on this square, if one is. */
export const spotOn = (c: number, r: number): Spot | null => SPOTS.find(([, [x, y]]) => x === Math.round(c) && y === Math.round(r))?.[0] ?? null;
/** Its square. */
export const spotSquare = (s: Spot): [number, number] => FIELD.SPOTS[s];
/** Where she waits her turn for a spot someone else has: the locks' berth for the up lock (sheltered), or
    the water in front of it. */
export function waitAt(s: Spot): Pose {
  if (s === 'lock-up') return { c: RC.BERTH[0], r: RC.BERTH[1], d: 3 };
  const [c, r] = FIELD.SPOTS[s];
  return { c, r: r - 1, d: 0 };
}

/* ---- Everyone else's sloop, between snapshots ---- */

/** Between two poses, `u` of the way (0 to 1); a jump (a gust, a sweep, the crane) put straight there. */
export function lerpPose(a: Pose, b: Pose, u: number): Pose {
  if (Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)) > NET.JUMP) return u > 0 ? { ...b } : { ...a };
  const w = Math.max(0, Math.min(1, u));
  return { c: a.c + (b.c - a.c) * w, r: a.r + (b.r - a.r) * w, d: w < 0.5 ? a.d : b.d };
}

/** Your number in the field you sail (you're always 0 there) and the room's: you first, then the rest in the
    room's order. */
export const localOf = (room: number, me: number): number => (room === me ? 0 : room < me ? room + 1 : room);
export const roomOf = (local: number, me: number): number => (local === 0 ? me : local <= me ? local - 1 : local);

/** A browser's copy of the race: the snapshots as they come (out of order or repeated ones dropped), and
    everyone's sloop drawn from them. `now`: the browser's seconds. */
export class Mirror {
  snaps: { s: Snapshot; got: number }[] = [];
  get latest(): Snapshot | null { return this.snaps[this.snaps.length - 1]?.s ?? null; }
  /** A snapshot's come: kept if it's newer than the last. Whether it was. */
  take(s: Snapshot, now: number): boolean {
    let last = this.latest;
    // (the room's started again: its numbers too)
    if (last && last.room !== s.room) { this.snaps = []; last = null; }
    if (last && s.seq <= last.seq) return false;
    // (a new race, or back to the lobby: nothing to draw between across it)
    if (last && last.phase !== s.phase && s.phase !== 'on') this.snaps = [];
    this.snaps.push({ s, got: now });
    if (this.snaps.length > NET.KEEP) this.snaps.shift();
    return true;
  }
  /** The room's seconds now, as near as can be told (never more than a second past the newest). */
  roomAt(now: number): number {
    const n = this.snaps[this.snaps.length - 1];
    return n ? n.s.at + Math.min(1, Math.max(0, now - n.got)) : 0;
  }
  /** The race's clock now: under way, seconds from the gun; counting down, seconds left. */
  clock(now: number): number {
    const n = this.snaps[this.snaps.length - 1];
    if (!n) return 0;
    const gone = this.roomAt(now) - n.s.at;
    return n.s.phase === 'count' ? Math.max(0, n.s.clock - gone) : n.s.phase === 'on' ? n.s.clock + gone : n.s.clock;
  }
  /** Where racer `i` (the room's number) is drawn now: a moment behind the newest snapshot, between the two
      either side of then; past the newest, where it has her. */
  poseAt(i: number, now: number): Pose | null {
    const S = this.snaps;
    if (!S.length) return null;
    const t = this.roomAt(now) - NET.BEHIND;
    const at = (k: number) => S[k].s.racers[i];
    for (let k = S.length - 1; k > 0; k--) {
      const a = S[k - 1].s, b = S[k].s;
      if (a.at <= t && t <= b.at && at(k - 1) && at(k)) return lerpPose(at(k - 1), at(k), (t - a.at) / Math.max(1e-6, b.at - a.at));
    }
    const k = t >= S[S.length - 1].s.at ? S.length - 1 : S.findIndex((x) => x.s.racers[i]);
    const r = S[Math.max(0, k)].s.racers[i] ?? at(S.length - 1);
    return r ? { c: r.c, r: r.r, d: r.d } : null;
  }
}

/** Who you are in a snapshot's racers (the room's number), or -1. */
export const meIn = (s: Snapshot | null, id: string | null): number => (s && id ? s.racers.findIndex((r) => r.id === id && !r.bot) : -1);

/** What your browser tells the room of your own sloop, from the race you're sailing (racer 0 of its
    field): where, what she's doing, the hits taken, shots loaded, home and when. */
export function poseUp(field: Field, took: number, shots: number, n: number, acts: Act[] = []): Extract<Up, { t: 'pose' }> {
  const r = field.racers[0], fin = r.state === 'finished';
  const st: RacerState = fin || r.state === 'waiting' ? 'sailing' : r.state;
  const q = (x: number) => Math.round(x * 100) / 100;
  return { t: 'pose', c: q(r.pose.c), r: q(r.pose.r), d: r.pose.d, st, took, leg: r.leg, sh: shots, home: fin && r.time !== null ? r.time : null, n, ...(acts.length ? { acts } : {}) };
}

/** What the race you sail is fed from its room: the snapshots (`mirror`), who you are in them (`me`, the
    room's number), the browser's clock, and sending (on its Link). */
export interface Feed { mirror: Mirror; me: () => number; now: () => number; send: (m: Up) => void }
/** A Driver that hits are counted by: the room's hits on you that you've taken. */
export interface NetDriver extends Driver { took(): number }

/** The race's Drive online (src/den-race.ts): everyone else on your field moved by the room's snapshots,
    yours sailed by you. Each tick: their poses (between snapshots), what they're doing, their stretches,
    shots and hits; home with the room's time once it says so; everyone's places as the room has them; the
    broadsides fired since (but yours, shown as you fired them); and any hit on you the room counts that
    you've not taken yet, taken now (a missed snapshot's included). Your hit on someone is a claim: shown on
    her at once, the room's answer the snapshots. */
export function mirrorDrive(link: Feed): Drive {
  return (field: Field): NetDriver => {
    let seen = 0, took = 0;
    const held = new Map<number, number>();
    const snap = () => link.mirror.latest;
    return {
      took: () => took,
      step(): FieldEvent[] {
        const s = snap(), me = link.me(), now = link.now(), out: FieldEvent[] = [];
        if (!s || s.phase === 'lobby' || me < 0) return out;
        for (let k = 1; k < field.racers.length; k++) {
          const sr = s.racers[roomOf(k, me)], r = field.racers[k];
          if (!sr) continue;
          if (sr.time !== null && r.state !== 'finished') out.push(...field.home(k, sr.time));
          if (r.state !== 'finished') {
            r.pose = link.mirror.poseAt(roomOf(k, me), now) ?? r.pose;
            r.state = (held.get(k) ?? 0) > now && sr.st !== 'finished' ? 'dazed' : sr.st === 'finished' ? 'sailing' : sr.st;
          }
          Object.assign(r, { leg: sr.leg, shots: sr.shots, hits: sr.hits });
        }
        field.racers.forEach((r, k) => { const p = s.racers[roomOf(k, me)]?.place; if (p != null && r.state === 'finished') r.place = p; });
        for (const sh of s.shots) {
          if (sh.n <= seen) continue;
          seen = sh.n;
          if (sh.by === me) continue;
          if (sh.on === me) took++;
          out.push({ kind: 'shot', racer: sh.by < 0 ? -1 : localOf(sh.by, me), cells: sh.cells, hit: sh.on < 0 ? -1 : localOf(sh.on, me) });
        }
        // (the rocks: everyone's hits on them, as the room counts them; never fewer than you've seen)
        field.rocks = Math.max(field.rocks, s.rocks ?? 0);
        // (the room's count of hits on you: one whose broadside you missed, taken now all the same)
        const mine = s.racers[me];
        while (mine && took < mine.hits) { took++; out.push({ kind: 'shot', racer: -1, cells: [], hit: 0 }); }
        return out;
      },
      progress: (k) => (k === 0 ? progressAt(field.racers[0].pose) : snap()?.racers[roomOf(k, link.me())]?.prog ?? 0),
      hit(k) {
        const r = field.racers[k];
        if (k <= 0 || !r || !hittable(r)) return false;
        link.send({ t: 'hit', on: roomOf(k, link.me()) });
        r.state = 'dazed';
        held.set(k, link.now() + 0.6);
        return true;
      },
      lift: (k) => snap()?.racers[roomOf(k, link.me())]?.lift ?? 0,
      rock: () => link.send({ t: 'rock' }),
    };
  };
}
