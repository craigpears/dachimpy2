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
     (poseAt), never sailed on by itself: past the newest, she waits where it had her. Each snapshot says the
     move each racer's on (`mv`: from which square to which, forward, a turn or a square of wind, and how far
     along), so she's drawn on her moves, square to square, as her own browser or the room's bot sails her,
     never slid along between where two snapshots had her (12 Nov: "why are they going so smoothly?").
   What a browser sends is its own sloop's pose a few times a second (pose: where, what she's doing, the hits
   it's taken, home and when), and claims (a hit on someone); the room's answer is the next snapshot. */
import { LAY, SAIL } from './den-sail.js';
import { FIELD, hittable } from './den-racers.js';
import { progressAt, motionPose } from './race-sim.js';
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
    /** The open races anyone walks into with a click, no code (the user, 12 Nov: "the public lobby, where people
        can just come in", and "I [don't] think I want people to share codes. You should just see a lobby and be
        able to join it"). Each a room like any other, its code reserved; a private race's code (a ?race= link)
        still works, but nobody's asked to type or share one. */
    LOBBIES: [{ code: 'OPEN', name: 'The open race' }, { code: 'GALE', name: 'Gale race' }, { code: 'TIDE', name: 'Tide race' }],
    /** Seconds from the first pirate pressing Start (not everyone has) to the count: anyone else in the lobby
        can press it too and race; whoever's still waiting for pirates races the next one. */
    ABOARD: 15,
    /** Seconds the race goes on once every player in it is home or out (the bots still coming in), when someone
        in the room is waiting for the next race, before the room calls it: she isn't kept waiting long. */
    CALL: 20,
    /** Seconds the places are shown once the race is done, before the room's back to its lobby for the next. */
    RESULTS: 15,
};
/** Whether a race's code is one of the open races'. */
export const isOpen = (code) => NET.LOBBIES.some((l) => l.code === code);
/** A fresh race code. */
export function makeCode(random = Math.random) {
    for (;;) {
        const c = Array.from({ length: 4 }, () => NET.LETTERS[Math.floor(random() * NET.LETTERS.length)]).join('');
        if (!isOpen(c))
            return c;
    }
}
/** A name as the den writes it: a capital, then small letters ('Deckhand' if it isn't one). */
export const tidyName = (s) => {
    const t = String(s ?? '').trim();
    return NET.NAME.test(t) ? t[0].toUpperCase() + t.slice(1).toLowerCase() : 'Deckhand';
};
const MOVE_OF = ['F', 'L', 'R', 'W'];
const q2 = (x) => Math.round(x * 100) / 100;
export const mvOf = (x) => [x.from.c, x.from.r, Math.round(x.from.d), x.to.c, x.to.r, Math.round(x.to.d), MOVE_OF.indexOf(x.m), q2(x.u), q2(Math.max(0.05, x.secs ?? SAIL.MOVE))];
export const motionOfMv = (v) => ({ from: { c: v[0], r: v[1], d: v[2] }, to: { c: v[3], r: v[4], d: v[5] }, m: MOVE_OF[v[6]] ?? 'W', u: v[7], secs: v[8] });
const withU = (v, u) => [v[0], v[1], v[2], v[3], v[4], v[5], v[6], Math.max(0, Math.min(1, u)), v[8]];
const atRest = (v) => v[0] === v[3] && v[1] === v[4] && v[2] === v[5] && v[7] === 0;
const sameMove = (a, b) => a.slice(0, 7).every((x, k) => x === b[k]);
/** A move `secs` seconds on from when it was said (at its own pace, to its end at most): a player's, as the
    room passes it on in a snapshot some moments after her browser said it. */
export const mvLater = (v, secs) => (atRest(v) ? v : withU(v, v[7] + Math.max(0, secs) / v[8]));
/** Her move `w` of the way between two snapshots' moves (0 to 1): along the same move, or on from one move into
    the next where it began; null if they're further apart than that (a jump, or a snapshot or two missed). */
export function mvBetween(a, b, w) {
    const x = Math.max(0, Math.min(1, w));
    if (sameMove(a, b))
        return motionOfMv(withU(a, a[7] + (b[7] - a[7]) * x));
    if (a[3] !== b[0] || a[4] !== b[1])
        return null;
    // (the rest of the first, then the next as far as it got: each at its own pace)
    const left = atRest(a) ? 0 : (1 - a[7]) * a[8], on = atRest(b) ? 0 : b[7] * b[8], p = (left + on) * x;
    if (p <= left && left > 0)
        return motionOfMv(withU(a, a[7] + p / a[8]));
    return motionOfMv(atRest(b) ? b : withU(b, (p - left) / b[8]));
}
/** A room's line in the open races' list, in a few words: whether there's room in it, and what it's doing. */
export function peekText(p) {
    if (!p)
        return { open: false, says: 'Can\'t reach it' };
    const n = p.players.length, waiting = p.players.filter((x) => !x.racing).map((x) => x.name);
    if (n >= p.most)
        return { open: false, says: 'Full' };
    if (p.phase === 'count' || p.phase === 'on')
        return { open: true, says: `Racing now${waiting.length ? ` · next: ${waiting.join(', ')}` : ''}` };
    if (!n)
        return { open: true, says: 'Nobody yet' };
    return { open: true, says: `Waiting: ${waiting.join(', ')}` };
}
export const ACTS = new Set(['put', 'unput', 'stop', 'drop', 'moor', 'gust', 'row', 'stroke', 'hit', 'pump', 'fire', 'patched', 'clear', 'shut', 'open', 'breeze', 'rocks', 'letGo', 'plan']);
/** Actions as they came, checked for shape: at most 60 at once, each a step, a kind, and small arguments. */
export function cleanActs(x) {
    if (!Array.isArray(x))
        return [];
    return x.slice(0, 60).filter((a) => Array.isArray(a) && Number.isInteger(a[0]) && a[0] >= 0 && ACTS.has(a[1]) && JSON.stringify(a).length < 600);
}
const num = (x, lo, hi, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d);
const STATES = ['sailing', 'waiting', 'puzzling', 'dazed', 'carried', 'finished'];
/** A browser's message, checked for shape (players are trusted, but a garbled one shouldn't break the
    room); null if it isn't one. */
export function parseUp(data) {
    if (typeof data !== 'string' || data.length > 20000)
        return null;
    let m;
    try {
        m = JSON.parse(data);
    }
    catch {
        return null;
    }
    if (!m || typeof m !== 'object')
        return null;
    switch (m.t) {
        case 'hello': return { t: 'hello', name: tidyName(m.name), look: m.look && typeof m.look === 'object' ? m.look : undefined, id: typeof m.id === 'string' && /^[a-z0-9]{4,16}$/.test(m.id) ? m.id : undefined };
        case 'spot': return { t: 'spot', c: Math.round(num(m.c, RC.LINE.c0, RC.LINE.c1, RC.LINE.c0)) };
        case 'fill': return { t: 'fill', n: Math.round(num(m.n, FIELD.LEAST, FIELD.ONLINE, NET.FILL)) };
        case 'ready': return { t: 'ready', on: !!m.on };
        case 'go':
        case 'again':
        case 'retire':
        case 'sync':
        case 'rock': return { t: m.t };
        case 'hit': return { t: 'hit', on: Math.round(num(m.on, 0, FIELD.ONLINE - 1, -1)) };
        case 'pose': return {
            t: 'pose', c: num(m.c, 0, SAIL.COLS), r: num(m.r, 0, 200), d: Math.round(num(m.d, 0, 3)),
            st: STATES.includes(m.st) && m.st !== 'finished' && m.st !== 'waiting' ? m.st : 'sailing',
            took: Math.round(num(m.took, 0, 999)), leg: Math.round(num(m.leg, 0, RC.STRETCHES.length - 1)), sh: Math.round(num(m.sh, 0, FIELD.HOLD)),
            home: typeof m.home === 'number' && Number.isFinite(m.home) && m.home > 0 ? m.home : null,
            n: Math.round(num(m.n, 0, 1e7)),
            acts: cleanActs(m.acts),
            ...(cleanMv(m.mv) ? { mv: cleanMv(m.mv) } : {}),
        };
        default: return null;
    }
}
/** A move as a browser said it (Mv), checked for shape; null if it isn't one. */
function cleanMv(x) {
    if (!Array.isArray(x) || x.length !== 9 || !x.every((v) => typeof v === 'number' && Number.isFinite(v)))
        return null;
    const [fc, fr, fd, tc, tr, td, m, u, secs] = x;
    if (Math.max(Math.abs(fc - tc), Math.abs(fr - tr)) > 1)
        return null;
    const i = (v, hi) => Math.round(Math.max(0, Math.min(hi, v)));
    return [i(fc, SAIL.COLS), i(fr, 200), i(fd, 3), i(tc, SAIL.COLS), i(tr, 200), i(td, 3), i(m, 3), Math.max(0, Math.min(1, u)), Math.max(0.05, Math.min(10, secs))];
}
/* ---- The spots, one racer's at a time (the locks, the crane, the barrier's notch, the wreck's) ---- */
const SPOTS = Object.entries(FIELD.SPOTS);
/** Squares apart, any way. */
export const apart = (a, c, r) => Math.max(Math.abs(Math.round(a.c) - c), Math.abs(Math.round(a.r) - r));
/** The spot on this square, if one is. */
export const spotOn = (c, r) => SPOTS.find(([, [x, y]]) => x === Math.round(c) && y === Math.round(r))?.[0] ?? null;
/** Its square. */
export const spotSquare = (s) => FIELD.SPOTS[s];
/** Where she waits her turn for a spot someone else has: the locks' berth for the up lock (sheltered), or
    the water in front of it. */
export function waitAt(s) {
    if (s === 'lock-up')
        return { c: RC.BERTH[0], r: RC.BERTH[1], d: 3 };
    const [c, r] = FIELD.SPOTS[s];
    return { c, r: r - 1, d: 0 };
}
/* ---- Everyone else's sloop, between snapshots ---- */
/** Between two poses, `u` of the way (0 to 1); a jump (a gust, a sweep, the crane) put straight there. */
export function lerpPose(a, b, u) {
    if (Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)) > NET.JUMP)
        return u > 0 ? { ...b } : { ...a };
    const w = Math.max(0, Math.min(1, u));
    return { c: a.c + (b.c - a.c) * w, r: a.r + (b.r - a.r) * w, d: w < 0.5 ? a.d : b.d };
}
/** Your number in the field you sail (you're always 0 there) and the room's: you first, then the rest in the
    room's order. */
export const localOf = (room, me) => (room === me ? 0 : room < me ? room + 1 : room);
export const roomOf = (local, me) => (local === 0 ? me : local <= me ? local - 1 : local);
/** A browser's copy of the race: the snapshots as they come (out of order or repeated ones dropped), and
    everyone's sloop drawn from them. `now`: the browser's seconds. */
export class Mirror {
    snaps = [];
    get latest() { return this.snaps[this.snaps.length - 1]?.s ?? null; }
    /** A snapshot's come: kept if it's newer than the last. Whether it was. */
    take(s, now) {
        let last = this.latest;
        // (the room's started again: its numbers too)
        if (last && last.room !== s.room) {
            this.snaps = [];
            last = null;
        }
        if (last && s.seq <= last.seq)
            return false;
        // (a new race, or back to the lobby: nothing to draw between across it)
        if (last && last.phase !== s.phase && s.phase !== 'on')
            this.snaps = [];
        this.snaps.push({ s, got: now });
        if (this.snaps.length > NET.KEEP)
            this.snaps.shift();
        return true;
    }
    /** The room's seconds now, as near as can be told (never more than a second past the newest). */
    roomAt(now) {
        const n = this.snaps[this.snaps.length - 1];
        return n ? n.s.at + Math.min(1, Math.max(0, now - n.got)) : 0;
    }
    /** The race's clock now: under way, seconds from the gun; counting down, seconds left. */
    clock(now) {
        const n = this.snaps[this.snaps.length - 1];
        if (!n)
            return 0;
        const gone = this.roomAt(now) - n.s.at;
        return n.s.phase === 'count' ? Math.max(0, n.s.clock - gone) : n.s.phase === 'on' ? n.s.clock + gone : n.s.clock;
    }
    /** Where racer `i` (the room's number) is drawn now: a moment behind the newest snapshot, between the two
        either side of then, on her move (mvBetween: square to square, as she's sailed); past the newest, where
        it has her. */
    poseAt(i, now) {
        const S = this.snaps;
        if (!S.length)
            return null;
        const t = this.roomAt(now) - NET.BEHIND;
        const at = (k) => S[k].s.racers[i];
        for (let k = S.length - 1; k > 0; k--) {
            const a = S[k - 1].s, b = S[k].s, A = at(k - 1), B = at(k);
            if (!(a.at <= t && t <= b.at && A && B))
                continue;
            const w = (t - a.at) / Math.max(1e-6, b.at - a.at), m = A.mv && B.mv ? mvBetween(A.mv, B.mv, w) : null;
            return m ? motionPose(m) : lerpPose(A, B, w);
        }
        const k = t >= S[S.length - 1].s.at ? S.length - 1 : S.findIndex((x) => x.s.racers[i]);
        const r = S[Math.max(0, k)].s.racers[i] ?? at(S.length - 1);
        return r ? (r.mv ? motionPose(motionOfMv(r.mv)) : { c: r.c, r: r.r, d: r.d }) : null;
    }
}
/** Who you are in a snapshot's racers (the room's number), or -1. */
export const meIn = (s, id) => (s && id ? s.racers.findIndex((r) => r.id === id && !r.bot) : -1);
/** What your browser tells the room of your own sloop, from the race you're sailing (racer 0 of its
    field): where, what she's doing, the hits taken, shots loaded, home and when; and the move she's on (`mv`:
    her helm's, helmMotion), for everyone else to draw her by. */
export function poseUp(field, took, shots, n, acts = [], mv = null) {
    const r = field.racers[0], fin = r.state === 'finished';
    const st = fin || r.state === 'waiting' ? 'sailing' : r.state;
    const q = (x) => Math.round(x * 100) / 100;
    return { t: 'pose', c: q(r.pose.c), r: q(r.pose.r), d: r.pose.d, st, took, leg: r.leg, sh: shots, home: fin && r.time !== null ? r.time : null, n, ...(acts.length ? { acts } : {}), ...(mv ? { mv: mvOf(mv) } : {}) };
}
/** The race's Drive online (src/den-race.ts): everyone else on your field moved by the room's snapshots,
    yours sailed by you. Each tick: their poses (between snapshots), what they're doing, their stretches,
    shots and hits; home with the room's time once it says so; everyone's places as the room has them; the
    broadsides fired since (but yours, shown as you fired them); and any hit on you the room counts that
    you've not taken yet, taken now (a missed snapshot's included). Your hit on someone is a claim: shown on
    her at once, the room's answer the snapshots. */
export function mirrorDrive(link) {
    return (field) => {
        let seen = 0, took = 0;
        const held = new Map();
        const snap = () => link.mirror.latest;
        return {
            took: () => took,
            step() {
                const s = snap(), me = link.me(), now = link.now(), out = [];
                if (!s || s.phase === 'lobby' || me < 0)
                    return out;
                for (let k = 1; k < field.racers.length; k++) {
                    const sr = s.racers[roomOf(k, me)], r = field.racers[k];
                    if (!sr)
                        continue;
                    if (sr.time !== null && r.state !== 'finished')
                        out.push(...field.home(k, sr.time));
                    if (r.state !== 'finished') {
                        r.pose = link.mirror.poseAt(roomOf(k, me), now) ?? r.pose;
                        r.state = (held.get(k) ?? 0) > now && sr.st !== 'finished' ? 'dazed' : sr.st === 'finished' ? 'sailing' : sr.st;
                    }
                    Object.assign(r, { leg: sr.leg, shots: sr.shots, hits: sr.hits });
                }
                field.racers.forEach((r, k) => { const p = s.racers[roomOf(k, me)]?.place; if (p != null && r.state === 'finished')
                    r.place = p; });
                for (const sh of s.shots) {
                    if (sh.n <= seen)
                        continue;
                    seen = sh.n;
                    if (sh.by === me)
                        continue;
                    if (sh.on === me)
                        took++;
                    out.push({ kind: 'shot', racer: sh.by < 0 ? -1 : localOf(sh.by, me), cells: sh.cells, hit: sh.on < 0 ? -1 : localOf(sh.on, me) });
                }
                // (the rocks: everyone's hits on them, as the room counts them; never fewer than you've seen)
                field.rocks = Math.max(field.rocks, s.rocks ?? 0);
                // (the room's count of hits on you: one whose broadside you missed, taken now all the same)
                const mine = s.racers[me];
                while (mine && took < mine.hits) {
                    took++;
                    out.push({ kind: 'shot', racer: -1, cells: [], hit: 0 });
                }
                return out;
            },
            progress: (k) => (k === 0 ? progressAt(field.racers[0].pose) : snap()?.racers[roomOf(k, link.me())]?.prog ?? 0),
            hit(k) {
                const r = field.racers[k];
                if (k <= 0 || !r || !hittable(r))
                    return false;
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
