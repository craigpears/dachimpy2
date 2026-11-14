// The sloop race online: racing friends, up to six of you, bots filling the rest (its rules and what's said:
// src/race-net.ts; the room that runs it: src/race-server.ts, on Cloudflare by way of worker/race-room.js; the link to it, src/race-link.ts). The user,
// 12 Nov: "a handful of people playing if we get to play testing it", never peer to peer. A way in that's
// plain to see (the user, 12 Nov: "I eventually found the race online thing. That really was not clear"): the
// den's top panel's Race online, or the starter's card on the line. Then the open races (NET.LOBBIES), who's in
// each, one click to join, no code to type or share ("You should just see a lobby and be able to join it");
// a private race's link, den.html?at=race&race=CODE, still brings a friend straight to its room. In the room,
// a lobby of its own (the user: "much more lobby-like ... here's the map of the course, you've got people
// loading and waiting, or you can play with bots"): the course's chart, who's in, each plainly a pirate or a
// bot, and two choices, wait for pirates or start now with bots filling the empty places (the room's rule:
// src/race-server.ts, Referee.aboard). A race on that you're not in: who's racing, and who's waiting for the
// next; the race done: the places, then the lobby again. The room counts down and runs the clock; you sail and
// puzzle your own sloop here, against your own sea, as alone, and send where she is a few times a second;
// everyone else's sloop is drawn from the room's snapshots (the race's Drive is the room's: mirrorDrive), and
// the spots that are one racer's at a time (the locks, the crane, the barrier's notch, the wreck's) are shut
// to you while someone else has them. Racing or in the lobby, the den's panels slimmed to what applies (body
// classes `racing`, `raceline`, `racelobby`: den.html). Touches the rest only through race.js (its keys,
// prompt and tick), race-field.js (whose sloops are on the water, and their names: fieldCast, field.mine),
// race-start.js (the starter's card's hooks; and the start's field, from the race's seed: the room's, the same
// for everyone). The rocks' hits (race-rocks.js draws them) are the room's count of everyone's.
import { NET, Mirror, mirrorDrive, meIn, poseUp, spotSquare, waitAt, peekText } from '../race-net.js';
import { wsLink } from '../race-link.js';
import { simDrive, helmMotion } from '../race-sim.js';
import { WATCHED, RIVALS } from '../den-rivals.js';
import { LAY } from '../den-sail.js';
import { FIELD } from '../den-racers.js';
import { spotPose, clockText } from '../den-race.js';
import { STARTER } from '../lines/race.js';
import { toast, myLook } from './world.js';
import { sail } from './sea.js';
import { fieldCast, field } from './race-field.js';
import { linePrompt, start } from './race-start.js';

const SPOT_NAME = { 'lock-up': 'the up lock', 'lock-down': 'the down lock', crane: 'the crane', forage: 'the barrier\'s notch', wreck: 'the wreck\'s notch' };
const now = () => performance.now() / 1000;
const savedName = () => { try { return localStorage.getItem('carp.den.name')?.trim() || ''; } catch { return ''; } };
const keepName = (n) => { try { localStorage.setItem('carp.den.name', n); } catch { /* (this voyage only) */ } };
const idFor = (code) => { try { return sessionStorage.getItem(`den.race.${code}`) || undefined; } catch { return undefined; } };
const keepId = (code, id) => { try { sessionStorage.setItem(`den.race.${code}`, id); } catch { /* */ } };
/** The room's name as the lobby shows it: an open race's, or a private one's. */
const roomName = (code) => NET.LOBBIES.find((l) => l.code === code)?.name ?? 'A private race';

export const rnet = {
  link: null, id: null, code: '', mirror: new Mirror(), panel: null, open: false, sendT: 0, heardT: 0,
  /** A race code from the link (den.html?at=race&race=CODE), to join once she's at sea. */
  want: (() => { try { const c = new URLSearchParams(location.search).get('race')?.toUpperCase(); return c && NET.CODE.test(c) ? c : null; } catch { return null; } })(),
  sig: '', panelSig: '', phase: '', me: -1, closed: new Set(), said: '', out: false, msg: '',
  /** The open races as last looked at (worker/index.js, /api/race-lobbies), when, and whether it answered. */
  lobbies: null, lookT: -99, looking: false, naming: false,
  /** Asked for from the den's top panel: in to the line, the open races up. */
  toLine: false,
};
const drive = mirrorDrive({ mirror: rnet.mirror, me: () => rnet.me, now, send: (m) => send(m) });
/** In a race's room. */
export const online = () => !!(rnet.link && rnet.id);
function send(m) { rnet.link?.send(m); }
/** Racing online, from anywhere (the den's top panel's Race online, menus.js; the starter's card): the open
    races up, and in to the starting line when she's at the race's buoy. */
export function raceOnline() { rnet.open = true; rnet.toLine = true; rnet.lookT = -99; }
start.online = raceOnline;

// ---------- joining and leaving ----------
/** Into race `code`'s room (a new one's made by its first pirate in), as `name`. */
function join(code, name) {
  if (!NET.NAME.test(name)) { rnet.msg = 'Your pirate name first: 3 to 16 letters, no spaces.'; rnet.open = true; rnet.naming = true; return; }
  if (!NET.CODE.test(code)) return;
  keepName(name);
  if (rnet.link) leave(true);
  // (a WebSocket to the den's room: src/race-link.ts; the race itself never touches the socket)
  const link = wsLink(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/race/${code}`);
  Object.assign(rnet, { link, code, id: null, msg: '', out: false, naming: false });
  rnet.mirror.snaps = [];
  link.onMessage((m) => { if (rnet.link === link) heard(m); });
  link.send({ t: 'hello', name, look: myLook, id: idFor(code) });
}
function heard(m) {
  rnet.heardT = now();
  if (m.t === 'closed') {
    const was = online();
    leave(true);
    if (was) toast('Lost the race\'s room: racing alone again', true);
    else rnet.msg = 'Couldn\'t reach the race. Racing online needs the live site.';
    return;
  }
  if (m.t === 'welcome') {
    rnet.id = m.id; rnet.msg = '';
    keepId(rnet.code, m.id);
    try { const u = new URL(location.href); u.searchParams.set('race', rnet.code); history.replaceState(history.state, '', u); } catch { /* */ }
  }
  if (m.t === 'full') rnet.msg = 'That race is full: six pirates at most.';
  if (m.t === 'snap') rnet.mirror.take(m, now());
}
/** Out of the race's room (and racing alone again: your rivals back). The open races' list stays up. */
function leave(quiet = false) {
  const link = rnet.link;
  Object.assign(rnet, { link: null, id: null, me: -1, sig: '', phase: '', lookT: -99 });
  link?.close();
  reopen();
  field.mine = null;
  if (rnet.R) {
    const R = rnet.R;
    if (R.state === 'count' || R.state === 'on') R.quit();
    R.drive = simDrive;
    R.setRoster(null);
    fieldCast(RIVALS);
  }
  try { const u = new URL(location.href); u.searchParams.delete('race'); history.replaceState(history.state, '', u); } catch { /* */ }
  if (!quiet) toast('Left the race online');
}

// ---------- the open races ----------
/** The open races looked at again, every few seconds while the list is up (worker/index.js). */
function lookAround() {
  if (rnet.looking || now() - rnet.lookT < 3) return;
  rnet.looking = true; rnet.lookT = now();
  fetch('/api/race-lobbies', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => {
    rnet.looking = false;
    rnet.lobbies = j?.lobbies ?? false;
  });
}

// ---------- the spots: shut to you while they're someone else's ----------
function reopen() {
  for (const k of rnet.closed) { sail.sea.rocks.delete(k); note('open', ...k.split(',').map(Number)); }
  rnet.closed.clear();
}
function spots(s) {
  const mine = new Map(s.holds), p = sail.helm.pose;
  for (const sp of Object.keys(FIELD.SPOTS)) {
    const [c, r] = spotSquare(sp), k = `${c},${r}`, who = mine.get(sp);
    const shut = s.phase === 'on' && who !== undefined && who !== rnet.me;
    if (shut && !rnet.closed.has(k) && !sail.sea.rocks.has(k)) { sail.sea.rocks.add(k); rnet.closed.add(k); note('shut', c, r); }
    if (!shut && rnet.closed.has(k)) { sail.sea.rocks.delete(k); rnet.closed.delete(k); note('open', c, r); }
    // (on it as someone else has it: out to wait yer turn)
    if (shut && Math.round(p.c) === c && Math.round(p.r) === r) {
      sail.helm.moor(waitAt(sp));
      toast(`${s.racers[who]?.name ?? 'Someone'} has ${SPOT_NAME[sp]}: wait yer turn`, true);
    }
  }
}

// ---------- what she does at the helm, for the race's record ----------
/* While she's racing online, everything done to her helm (src/race-net.ts, Act: its moves, pins, moorings,
   gusts, oars and strokes, hits, the locks pumped), her broadsides, her patch done, the barrier cleared, a spot
   shut to her or opened, and the breeze as it changes, are written down stamped with the race's steps she's
   sailed (race.js, steps), and go with her pose: the race written down is mostly these
   (src/race-replay.ts replays them). The helm and her guns are wrapped where they are, so nothing else
   changes; the helm's own calls inside its step aren't hers (`inTick`). */
const acts = [];
let noted = null, notedGuns = null, inTick = false, R0 = null;
/** The race's steps sailed from the gun (race.js, steps). */
const stepsOf = () => rnet.steps?.n ?? 0;
const was = { dazed: false, breeze: '', clear: false, rocks: false };
const recording = () => online() && R0 && (R0.state === 'on' || R0.state === 'done') && rnet.me >= 0;
const note = (...a) => { if (recording()) acts.push([stepsOf(), ...a]); };
const copy = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
export function netInTick(on) { inTick = on; }
/** Her plan as she sets it (race-plan.js; at the gun, and at each change): to the room and its record like any
    other action, never on to the other racers (src/race-net.ts, ActKind 'plan'). */
export function netPlan(plan) { note('plan', [...plan]); }
/** Before each of the race's steps (race.js): its count, and what's changed since that isn't a call on the
    helm (patched, the breeze, the barrier cleared). */
export function netBefore(h, R) {
  R0 = R;
  const dazed = h.dazed(), b = sail.sea.breeze, breeze = b ? `${b.d},${b.s}` : '', [bc, br] = LAY.RACE.FORAGE.BARRIER[0], clear = !sail.sea.rocks.has(`${bc},${br}`);
  const [kc, kr] = LAY.RACE.ROCKS.WALL[0], rocks = !sail.sea.rocks.has(`${kc},${kr}`);
  if (was.dazed && !dazed) note('patched');
  if (b && breeze !== was.breeze) note('breeze', b.d, b.s);
  if (clear && !was.clear) note('clear');
  if (rocks && !was.rocks) note('rocks');
  Object.assign(was, { dazed, breeze, clear, rocks });
}
function noting() {
  const h = sail.helm, g = sail.guns;
  if (h && noted !== h) {
    noted = h;
    for (const k of ['put', 'unput', 'stop', 'drop', 'moor', 'gust', 'row', 'stroke', 'hit', 'pump', 'letGo']) {
      const f = h[k].bind(h);
      h[k] = (...a) => { if (!inTick) note(k, ...a.map(copy)); return f(...a); };
    }
  }
  if (g && notedGuns !== g) {
    notedGuns = g;
    const f = g.fire.bind(g);
    g.fire = (side) => { const did = f(side); if (did !== 'empty' && did !== 'running') note('fire', side); return did; };
  }
}
/** A new race: nothing written down yet, the breeze as it is at the gun. */
function fresh() { acts.length = 0; Object.assign(was, { dazed: false, breeze: '', clear: false, rocks: false }); }

// ---------- who's racing ----------
/** A racer's sails: a player's by her place among the players (the same in every browser and the race's
    record), a bot's her own. */
const sailOf = (s, i) => { const x = s.racers[i]; return x.id ? NET.SAILS[s.racers.slice(0, i).filter((y) => y.id).length % NET.SAILS.length] : WATCHED[x.rv]?.sail ?? '#e8e4d8'; };
/** Everyone else on the course as the race lines them up (src/den-race.ts, Race.setRoster): the den's
    characters as themselves, players in their own look and sails, their name said over them at the count;
    `player` says which, for the name over her sloop (race-field.js). */
function roster(s) {
  return s.racers.flatMap((x, i) => {
    if (i === rnet.me) return [];
    if (!x.id) return [{ ...WATCHED[x.rv], spot: x.spot, key: `bot:${x.rv}`, player: false }];
    const p = s.players.find((y) => y.id === x.id);
    return [{ name: x.name, key: `player:${x.id}`, player: true, look: p?.look && typeof p.look === 'object' ? p.look : 'Kikkit', spot: x.spot, sail: sailOf(s, i), flag: NET.FLAG, crew: null, racer: { says: { start: [x.name], won: [`${x.name} wins!`], lost: [] } } }];
  });
}

// ---------- each tick ----------
/** Each tick (race.js): the room's race kept to (the line-up, the count, the gun, whose turn it is at a
    spot), your pose sent, the panel, and the den's panels slimmed while racing. `toLine`: into the starting
    line from the buoy, as Space there. */
export function netTick(dt, R, toLine, steps) {
  rnet.R = R; rnet.steps = steps;
  if (rnet.toLine && sail.on) {
    rnet.toLine = false;
    if (!online() && (R.state === 'count' || R.state === 'on' || R.state === 'done')) R.quit();
    if (R.state === 'off') toLine();
  }
  if (rnet.want && !rnet.link && sail.on) {
    if (R.state === 'off') toLine();
    const code = rnet.want, name = savedName();
    rnet.want = null;
    if (NET.NAME.test(name)) join(code, name);
    else { rnet.open = true; rnet.wantCode = code; rnet.naming = true; }
  }
  const s = rnet.mirror.latest;
  if (online() && s && sail.on) follow(dt, R, s, toLine);
  start.lobby = sail.on && (online() || rnet.open);
  const shown = panel(R);
  const B = document.body.classList;
  B.toggle('racing', sail.on && (R.state !== 'off' || shown));
  B.toggle('raceline', sail.on && (R.state === 'line' || R.state === 'count'));
  B.toggle('racelobby', shown);
}
function follow(dt, R, s, toLine) {
  rnet.me = meIn(s, rnet.id);
  if (R.drive !== drive) R.drive = drive;
  noting();
  if (s.phase !== 'on' && R.state !== 'on' && R.state !== 'done') fresh();
  const me = rnet.me, mine = s.racers[me];
  // (the race's seed, the room's: the start's field everyone races through, shown on the line before the count)
  if (s.seed && R.seed !== s.seed && R.state !== 'on' && R.state !== 'count') R.seed = s.seed;
  // (your own name over your sloop, as everyone else's is over theirs)
  field.mine = me >= 0 ? { name: mine.name, sail: sailOf(s, me) } : null;
  // (the line-up: everyone else's sloop)
  const cast = me >= 0 ? roster(s) : null;
  const sig = JSON.stringify(cast?.map((x) => [x.key, x.spot]));
  if (cast && sig !== rnet.sig && (R.state === 'line' || R.state === 'off' || R.state === 'done' || rnet.phase !== s.phase)) {
    rnet.sig = sig;
    R.setRoster(cast);
    fieldCast(cast);
  }
  if (s.phase === 'lobby' || s.phase === 'done') {
    if (s.phase === 'lobby' && (R.state === 'count' || R.state === 'on' || R.state === 'done')) { R.quit(); }
    if (s.phase === 'lobby' && R.state === 'off') toLine(s.seed);
    if (R.state === 'line' && mine && R.spot !== mine.spot) { R.spot = mine.spot; sail.helm.moor(spotPose(mine.spot)); }
    reopen();
  } else if (me < 0 || mine?.bot) {
    // (not in this race: in the room while it's on, or her sloop's a bot's now)
    if (mine?.bot && !rnet.out) { rnet.out = true; toast('The computer\'s sailing yer sloop home now: ye\'ll race the next one', true); }
    if (R.state === 'count' || R.state === 'on') R.quit();
  } else if (R.state === 'off' && rnet.phase === 'on') {
    // (sailed back out of the gate: out of the race, a bot sails her sloop)
    send({ t: 'retire' });
  } else {
    rnet.out = false;
    if (R.state === 'off' || (R.state === 'done' && s.phase === 'count')) toLine(s.seed);
    if (R.state === 'line') {
      R.spot = mine.spot;
      R.start();
      sail.helm.moor(spotPose(mine.spot));
      toast(STARTER.count[0]);
    }

    // (the count's the room's: the gun when it says)
    if (R.state === 'count') {
      const left = rnet.mirror.clock(now());
      if (s.phase === 'on') R.field.t = Math.min(R.field.t, 1e-3);
      else if (Math.abs(R.field.t - left) > 0.15) { R.field.t = left; R.t = left; }
    }
    spots(s);
    // (her pose, a few times a second)
    if ((rnet.sendT -= dt) <= 0 && (R.state === 'count' || R.state === 'on' || R.state === 'done')) {
      rnet.sendT = 1 / NET.SEND;
      send(poseUp(R.field, R.run?.took?.() ?? 0, sail.guns.shots('L') + sail.guns.shots('R'), stepsOf(), acts.splice(0, 60), helmMotion(sail.helm)));
    }
  }
  // (nothing from the room a couple of seconds: ask for the race as it is. Racing, snapshots come eight a
  // second; in the lobby, or once the race is done and the room's gone quiet, a missed one is put right so)
  if (rnet.link && now() - rnet.heardT > 2) { rnet.heardT = now(); send({ t: 'sync' }); }
  rnet.phase = s.phase;
}

// ---------- the keys and the prompt ----------
/** A key on the line, first (race.js): whether it was racing online's. O: the open races; in the room's
    lobby, A D your spot, Space start now or wait, 2 to 6 how many racers, Esc out of the room. */
export function netKey(key, R) {
  if (!sail.on) return false;
  const s = rnet.mirror.latest, lobby = online() && s && (s.phase === 'lobby' || s.phase === 'done');
  if (!online()) {
    if (R.state === 'line' && key === 'o') { rnet.open = !rnet.open; rnet.lookT = -99; return true; }
    if (R.state === 'line' && rnet.open && key === 'escape') { rnet.open = false; return true; }
    return false;
  }
  if (R.state !== 'line') return false;
  // (in the room while a race is on that she's not in: on the line waiting for the next, no race of her own)
  if (!lobby) {
    if (key === 'escape') { leave(); return true; }
    return key === ' ' || key === 'enter' || /^[0-9adg]$|^arrow(left|right)$/.test(key);
  }
  const by = { a: -1, arrowleft: -1, d: 1, arrowright: 1 }[key];
  if (by) { const c = R.shift(by); send({ t: 'spot', c }); sail.helm.moor(spotPose(c)); return true; }
  const n = Number(key);
  if (key.length === 1 && n >= FIELD.LEAST && n <= FIELD.ONLINE) { send({ t: 'fill', n }); return true; }
  if (key === ' ' || key === 'enter') { const me = s.players.find((p) => p.id === rnet.id); act(me?.ready ? 'wait' : 'start'); return true; }
  if (key === 'escape') { leave(); return true; }
  return false;
}
export function netPrompt(R) {
  if (!sail.on || R.state !== 'line') return '';
  const s = rnet.mirror.latest;
  if (!online() || !s) return rnet.open ? 'Pick a race to join · Esc: close' : `${linePrompt(R)} · O: race online`;
  if (s.phase === 'lobby' || s.phase === 'done') return 'A D: yer spot · Space: start now or wait · Esc: leave';
  return 'A race is on: ye\'ll race the next · Esc: leave';
}

// ---------- the panel: the open races, then the room's lobby ----------
function act(what, el) {
  const s = rnet.mirror.latest;
  if (what === 'join') join(el.dataset.code, nameIn());
  if (what === 'start') send({ t: 'ready', on: true });
  if (what === 'wait') send({ t: 'ready', on: false });
  if (what === 'again') send({ t: 'again' });
  if (what === 'fill' && s) send({ t: 'fill', n: Math.max(FIELD.LEAST, Math.min(FIELD.ONLINE, s.fill + Number(el.dataset.by))) });
  if (what === 'rename') { rnet.naming = true; rnet.panelSig = ''; }
  if (what === 'leave') leave();
  if (what === 'close') rnet.open = false;
}
function nameIn() {
  const v = (rnet.panel.querySelector('[name=pname]')?.value ?? savedName()).trim();
  return v;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const secs = (x) => `${Math.max(0, Math.ceil(x))}s`;
/** Seconds till the room moves on by itself (its newest snapshot's `soon`, less the time since). */
function soonLeft(s) {
  const n = rnet.mirror.snaps[rnet.mirror.snaps.length - 1];
  return s.soon === null || !n ? null : s.soon - (now() - n.got);
}
/** Who's in the room's race, a row each: her sails, her name, a pirate or a bot, and how she stands. */
function rows(s, how, order = [...s.racers.keys()]) {
  return order.map((i) => { const x = s.racers[i];
    const you = x.id === rnet.id && !!x.id, bot = !x.id || x.bot;
    return `<li class="${bot ? 'bot' : 'pirate'}${you ? ' you' : ''}"><i style="background:${sailOf(s, i)}"></i><span>${esc(x.name)}${you ? ' (you)' : ''}</span><em>${!x.id ? 'computer' : x.bot ? 'computer sailing' : 'pirate'}</em><b>${how(x, i)}</b></li>`;
  }).join('');
}
/** The panel: shown on the line while it's asked for or you're in a room, and in the room whenever you're not
    racing (a race on that you're not in, or the places). Whether it is. */
function panel(R) {
  if (!rnet.panel) {
    const el = rnet.panel = document.getElementById('racenet');
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.name === 'pname') { rnet.naming = !NET.NAME.test(e.target.value.trim()); if (!rnet.naming) keepName(e.target.value.trim()); rnet.panelSig = ''; } });
  }
  const s = rnet.mirror.latest;
  const show = sail.on && ((R.state === 'line' && (online() || rnet.open)) || (online() && !!s && (s.phase === 'done' || rnet.me < 0 || s.racers[rnet.me]?.bot)));
  rnet.panel.hidden = !show;
  if (!show) return false;
  const close = (what, text) => `<button class="rn-x" data-act="${what}">${text}</button>`;
  let html, sig;
  if (!online()) {
    // The open races: who's in each, and a click to join.
    lookAround();
    const name = savedName(), named = NET.NAME.test(name) && !rnet.naming;
    const L = rnet.lobbies;
    const list = L === false ? '<p class="rn-note">Racing online needs the live site.</p>' : !L ? '<p class="rn-note">Looking for races…</p>'
      : `<ul class="rn-rooms">${L.map((l) => {
        const t = peekText(l.peek);
        return `<li><div><b>${esc(l.name)}</b><small>${esc(t.says)}</small></div><button data-act="join" data-code="${l.code}"${t.open ? '' : ' disabled'}>Join</button></li>`;
      }).join('')}</ul>`;
    const who = named ? `<p class="rn-me">Racing as <b>${esc(name)}</b> <button class="rn-link" data-act="rename">change</button></p>`
      : `<label class="rn-me">Your pirate name <input name="pname" maxlength="16" autocomplete="off" spellcheck="false" value="${esc(name)}"></label>`;
    sig = `off|${named}|${name}|${rnet.msg}|${JSON.stringify(L)}|${rnet.link ? 1 : 0}`;
    html = `<div class="rn-head"><b>Race online</b>${close('close', 'Close')}</div>${who}${rnet.link ? '<p class="rn-note">Hailing the race…</p>' : list}${rnet.msg ? `<p class="rn-err">${esc(rnet.msg)}</p>` : ''}`;
    // (typing a name: the list kept as it is round the box, so it isn't lost)
    if (!named && rnet.panel.querySelector('[name=pname]') === document.activeElement && rnet.panelSig.startsWith('off|false')) sig = rnet.panelSig;
  } else if (!s) {
    sig = 'wait'; html = `<div class="rn-head"><b>${esc(roomName(rnet.code))}</b></div><p class="rn-note">Hailing the race…</p>`;
  } else {
    const me = s.players.find((p) => p.id === rnet.id), left = soonLeft(s), bots = s.racers.filter((x) => !x.id).length;
    const head = `<div class="rn-head"><b>${esc(roomName(rnet.code))}</b>${close('leave', 'Leave')}</div>`;
    const choice = (startText) => `<div class="rn-go"><button data-act="wait" class="${me?.ready ? '' : 'on'}">Wait for pirates</button><button data-act="start" class="${me?.ready ? 'on' : ''}">${startText}</button></div>`;
    if (s.phase === 'lobby') {
      // The lobby: the course, who's in (a pirate or a bot, plainly), wait for pirates or start now.
      const starters = s.players.filter((p) => p.ready).map((p) => (p.id === rnet.id ? 'You' : p.name));
      const note = left !== null && starters.length ? `${starters.join(', ')} pressed Start: off in ${secs(left)}` : s.players.length > 1 ? 'Off when everyone\'s pressed Start' : 'Wait for pirates to join, or start now';
      sig = JSON.stringify(['lobby', s.fill, s.racers.map((x) => [x.name, x.id, x.spot]), s.players.map((p) => [p.name, p.ready]), note]);
      html = `${head}<img class="rn-chart" src="changelog/race-map.jpg" alt="The course" width="320" height="180">`
        + `<div class="rn-sub"><span>${s.racers.length - bots} pirate${s.racers.length - bots === 1 ? '' : 's'}, ${bots} computer racer${bots === 1 ? '' : 's'}</span><span class="rn-fill">Racers <button data-act="fill" data-by="-1">−</button><b>${s.fill}</b><button data-act="fill" data-by="1">+</button></span></div>`
        + `<ul class="rn-who">${rows(s, (x) => { const p = x.id ? s.players.find((y) => y.id === x.id) : null; return p ? (p.ready ? 'Start ✓' : 'waiting') : ''; })}</ul>`
        + `${choice(bots ? `Start now, ${bots} computer racer${bots === 1 ? '' : 's'}` : 'Start now')}<p class="rn-note">${esc(note)}</p>`;
    } else if (s.phase === 'done') {
      // The places, then the lobby again for the next race.
      const note = left !== null ? `Next race's lobby in ${secs(left)}` : '';
      sig = JSON.stringify(['done', s.racers.map((x) => [x.name, x.time, x.place, x.bot]), s.players.map((p) => [p.name, p.ready]), note]);
      const order = [...s.racers.keys()].sort((a, b) => (s.racers[a].place ?? 99) - (s.racers[b].place ?? 99));
      html = `${head}<div class="rn-sub"><span>The race is done</span></div><ul class="rn-who">${rows(s, (x) => (x.time !== null ? `${x.place}. ${clockText(x.time)}` : 'still out'), order)}</ul>`
        + `<div class="rn-go"><button data-act="${me?.ready ? 'wait' : 'start'}" class="${me?.ready ? 'on' : ''}">${me?.ready ? 'In the next race ✓' : 'Race again'}</button></div><p class="rn-note">${esc(note)}</p>`;
    } else {
      // A race on that you're not in: who's racing, and who's waiting for the next.
      const next = s.players.filter((p) => !p.racing).map((p) => (p.id === rnet.id ? 'you' : p.name) + (p.ready ? ' ✓' : ''));
      const clock = rnet.mirror.clock(now());
      sig = JSON.stringify(['on', Math.floor(clock), s.racers.map((x) => [x.name, x.place, x.bot]), next]);
      html = `${head}<div class="rn-sub"><span>Racing now · ${s.phase === 'count' ? 'the count' : clockText(clock)}</span></div><ul class="rn-who">${rows(s, (x) => (x.place ? `${x.place}. ${clockText(x.time)}` : ''))}</ul>`
        + `<p class="rn-next">Next race: ${esc(next.join(', '))}</p>${choice('Race the next one')}`;
    }
  }
  if (sig !== rnet.panelSig) { rnet.panelSig = sig; rnet.panel.innerHTML = html; }
  return true;
}
