// The sloop race online: racing friends, up to six of you, bots filling the rest (its rules and what's said:
// src/race-net.ts; the room that runs it: src/race-server.ts, on Cloudflare by way of worker/race-room.js; the link to it, src/race-link.ts). The user,
// 12 Nov: "a handful of people playing if we get to play testing it", never peer to peer. On the starting
// line, a panel: make a race (a four-letter code) or join one, who's in, ready up, how many racers, and
// anyone starts the count once everyone's ready; the link den.html?at=race&race=CODE brings a friend
// straight to it. The room counts down and runs the clock; you sail and puzzle your own sloop here, against
// your own sea, as alone, and send where she is a few times a second; everyone else's sloop is drawn from the
// room's snapshots (the race's Drive is the room's: mirrorDrive), and the spots that are one racer's at a
// time (the locks, the crane, the barrier's notch, the wreck's) are shut to you while someone else has them.
// Touches the rest only through race.js (its keys, prompt and tick), race-field.js (whose sloops are on the
// water: fieldCast). The race's seed (its start's field: race-start.js lays it) is the room's, the same for
// everyone; the rocks' hits (race-rocks.js draws them) are the room's count of everyone's.
import { NET, Mirror, mirrorDrive, meIn, poseUp, makeCode, spotSquare, waitAt } from '../race-net.js';
import { wsLink } from '../race-link.js';
import { simDrive } from '../race-sim.js';
import { WATCHED, RIVALS } from '../den-rivals.js';
import { LAY } from '../den-sail.js';
import { FIELD } from '../den-racers.js';
import { spotPose, clockText } from '../den-race.js';
import { STARTER } from '../lines/race.js';
import { toast, myLook } from './world.js';
import { sail } from './sea.js';
import { fieldCast } from './race-field.js';
import { linePrompt } from './race-start.js';

const SPOT_NAME = { 'lock-up': 'the up lock', 'lock-down': 'the down lock', crane: 'the crane', forage: 'the barrier\'s notch', wreck: 'the wreck\'s notch' };
const now = () => performance.now() / 1000;
const savedName = () => { try { return localStorage.getItem('carp.den.name')?.trim() || ''; } catch { return ''; } };
const keepName = (n) => { try { localStorage.setItem('carp.den.name', n); } catch { /* (this voyage only) */ } };
const idFor = (code) => { try { return sessionStorage.getItem(`den.race.${code}`) || undefined; } catch { return undefined; } };
const keepId = (code, id) => { try { sessionStorage.setItem(`den.race.${code}`, id); } catch { /* */ } };

export const rnet = {
  link: null, id: null, code: '', mirror: new Mirror(), panel: null, open: false, sendT: 0, heardT: 0,
  /** A race code from the link (den.html?at=race&race=CODE), to join once she's at sea. */
  want: (() => { try { const c = new URLSearchParams(location.search).get('race')?.toUpperCase(); return c && NET.CODE.test(c) ? c : null; } catch { return null; } })(),
  sig: '', panelSig: '', phase: '', me: -1, closed: new Set(), said: '', out: false, msg: '',
};
const drive = mirrorDrive({ mirror: rnet.mirror, me: () => rnet.me, now, send: (m) => send(m) });
/** In a race's room. */
export const online = () => !!(rnet.link && rnet.id);
function send(m) { rnet.link?.send(m); }

// ---------- joining and leaving ----------
/** Into race `code`'s room (a new one's made by its first pirate in), as `name`. */
function join(code, name) {
  if (!NET.NAME.test(name)) { rnet.msg = 'Your pirate name first: 3 to 16 letters, no spaces.'; rnet.open = true; return; }
  if (!NET.CODE.test(code)) { rnet.msg = 'A race code is four letters.'; return; }
  keepName(name);
  if (rnet.link) leave(true);
  // (a WebSocket to the den's room: src/race-link.ts; the race itself never touches the socket)
  const link = wsLink(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/race/${code}`);
  Object.assign(rnet, { link, code, id: null, msg: 'Hailing the race…', out: false });
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
    toast(`In race ${rnet.code}: share the link, ready up, and anyone can start the count`);
  }
  if (m.t === 'full') rnet.msg = 'That race is full: six pirates at most.';
  if (m.t === 'snap') rnet.mirror.take(m, now());
}
/** Out of the race's room (and racing alone again: your rivals back). */
function leave(quiet = false) {
  const link = rnet.link;
  Object.assign(rnet, { link: null, id: null, me: -1, sig: '', phase: '' });
  link?.close();
  reopen();
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
    for (const k of ['put', 'unput', 'stop', 'drop', 'moor', 'gust', 'row', 'stroke', 'hit', 'pump']) {
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
/** Everyone else on the course as the race lines them up (src/den-race.ts, Race.setRoster): the den's
    characters as themselves, players in their own look and sails, their name said over them at the count. */
function roster(s) {
  return s.racers.flatMap((x, i) => {
    if (i === rnet.me) return [];
    if (!x.id) return [{ ...WATCHED[x.rv], spot: x.spot, key: `bot:${x.rv}` }];
    // (her sails by her place among the players, the same in every browser and the race's record)
    const p = s.players.find((y) => y.id === x.id), k = s.racers.slice(0, i).filter((y) => y.id).length;
    return [{ name: x.name, key: `player:${x.id}`, look: p?.look && typeof p.look === 'object' ? p.look : 'Kikkit', spot: x.spot, sail: NET.SAILS[k % NET.SAILS.length], flag: NET.FLAG, crew: null, racer: { says: { start: [x.name], won: [`${x.name} wins!`], lost: [] } } }];
  });
}

// ---------- each tick ----------
/** Each tick (race.js): the room's race kept to (the line-up, the count, the gun, whose turn it is at a
    spot), your pose sent, the panel. `toLine`: into the starting line from the buoy, as Space there. */
export function netTick(dt, R, toLine, steps) {
  rnet.R = R; rnet.steps = steps;
  if (rnet.want && !rnet.link && sail.on) {
    if (R.state === 'off') toLine();
    const code = rnet.want, name = savedName();
    rnet.want = null;
    if (NET.NAME.test(name)) join(code, name);
    else { rnet.open = true; rnet.wantCode = code; }
  }
  const s = rnet.mirror.latest;
  if (online() && s && sail.on) follow(dt, R, s, toLine);
  panel(R);
}
function follow(dt, R, s, toLine) {
  rnet.me = meIn(s, rnet.id);
  if (R.drive !== drive) R.drive = drive;
  noting();
  if (s.phase !== 'on' && R.state !== 'on' && R.state !== 'done') fresh();
  const me = rnet.me, mine = s.racers[me];
  // (the race's seed, the room's: the start's field everyone races through, shown on the line before the count)
  if (s.seed && R.seed !== s.seed && R.state !== 'on' && R.state !== 'count') R.seed = s.seed;
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
    if (mine?.bot && !rnet.out) { rnet.out = true; toast('A bot\'s sailing yer sloop home now: ye\'ll race the next one', true); }
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
      send(poseUp(R.field, R.run?.took?.() ?? 0, sail.guns.shots('L') + sail.guns.shots('R'), stepsOf(), acts.splice(0, 60)));
    }
  }
  // (nothing from the room a couple of seconds: ask for the race as it is. Racing, snapshots come eight a
  // second; in the lobby, or once the race is done and the room's gone quiet, a missed one is put right so)
  if (rnet.link && now() - rnet.heardT > 2) { rnet.heardT = now(); send({ t: 'sync' }); }
  rnet.phase = s.phase;
}

// ---------- the keys and the prompt ----------
/** A key on the line, first (race.js): whether it was racing online's. O: the panel; online, A D your spot,
    Space ready, G the count, 2 to 6 how many racers, Esc out of the room. */
export function netKey(key, R) {
  if (!sail.on) return false;
  const s = rnet.mirror.latest, lobby = online() && s && (s.phase === 'lobby' || s.phase === 'done');
  if (!online()) {
    if (R.state === 'line' && key === 'o') { rnet.open = !rnet.open; return true; }
    return false;
  }
  if (!lobby || R.state !== 'line') return false;
  const by = { a: -1, arrowleft: -1, d: 1, arrowright: 1 }[key];
  if (by) { const c = R.shift(by); send({ t: 'spot', c }); sail.helm.moor(spotPose(c)); return true; }
  const n = Number(key);
  if (key.length === 1 && n >= FIELD.LEAST && n <= FIELD.ONLINE) { send({ t: 'fill', n }); return true; }
  if (key === ' ' || key === 'enter') { act('ready'); return true; }
  if (key === 'g') { act('go'); return true; }
  if (key === 'escape') { leave(); return true; }
  return false;
}
export function netPrompt(R) {
  if (!sail.on || R.state !== 'line') return '';
  const s = rnet.mirror.latest;
  if (!online() || !s) return `${linePrompt(R)} · O: race online`;
  if (s.phase === 'lobby' || s.phase === 'done') return `Race ${rnet.code} online · A D: yer spot · Space: ready · G: the count, once all are · 2 to 6: racers (${s.fill}) · Esc: leave`;
  return '';
}

// ---------- the panel ----------
function act(what, el) {
  const s = rnet.mirror.latest, me = s?.players.find((p) => p.id === rnet.id);
  if (what === 'make') join(makeCode(), nameIn());
  if (what === 'join') join((rnet.panel.querySelector('[name=code]')?.value || '').trim().toUpperCase(), nameIn());
  if (what === 'ready' && me) send({ t: 'ready', on: !me.ready });
  if (what === 'go') {
    const not = s?.players.filter((p) => p.on && !p.ready).map((p) => p.name) ?? [];
    if (not.length) toast(`Waiting for ${not.join(', ')} to be ready`, true);
    else send({ t: 'go' });
  }
  if (what === 'again') send({ t: 'again' });
  if (what === 'fill' && s) send({ t: 'fill', n: s.fill + Number(el.dataset.by) });
  if (what === 'copy') {
    const link = `${location.origin}${location.pathname}?at=race&race=${rnet.code}`;
    navigator.clipboard?.writeText(link).then(() => { el.textContent = 'Copied!'; }, () => { el.textContent = link; });
  }
  if (what === 'leave') leave();
  if (what === 'close') rnet.open = false;
}
function nameIn() {
  const v = (rnet.panel.querySelector('[name=pname]')?.value || savedName()).trim();
  return v;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function panel(R) {
  if (!rnet.panel) {
    const el = rnet.panel = document.createElement('div');
    el.id = 'racenet';
    Object.assign(el.style, { position: 'fixed', top: '150px', left: '18px', width: '300px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(20,14,9,.86)', color: '#f4e9cf', font: '14px/1.4 Georgia, serif', zIndex: 21, display: 'none', border: '2px solid #4fb0c6' });
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act, b); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.name === 'code') act('join'); if (e.key === 'Enter' && e.target.name === 'pname') act(rnet.wantCode ? 'join' : 'make'); });
    document.body.appendChild(el);
  }
  const s = rnet.mirror.latest;
  const show = sail.on && ((R.state === 'line' && (online() || rnet.open)) || (online() && s && (s.phase === 'done' || rnet.me < 0)));
  rnet.panel.style.display = show ? 'block' : 'none';
  if (!show) return;
  const btn = (act, text, extra = '') => `<button data-act="${act}" ${extra} style="font:600 13px system-ui,sans-serif;margin:6px 6px 0 0;padding:4px 10px;border-radius:6px;border:1px solid #4fb0c6;background:#24323a;color:#f4e9cf;cursor:pointer">${text}</button>`;
  const head = `<div style="font:700 13px system-ui,sans-serif;letter-spacing:3px;color:#4fb0c6;margin-bottom:6px">RACE ONLINE${online() ? ` · ${esc(rnet.code)}` : ''}</div>`;
  let html, sig;
  if (!online()) {
    sig = `off|${rnet.msg}|${rnet.wantCode || ''}|${!!rnet.link}`;
    html = `${head}<p style="margin:0 0 6px">Race yer friends round the course: up to six of ye, the den's own racers filling the rest.</p><input name="pname" placeholder="Your pirate name" value="${esc(savedName())}" maxlength="16" style="width:100%;box-sizing:border-box;margin:2px 0;padding:4px 6px">${btn('make', 'Make a race')}<br><input name="code" placeholder="CODE" value="${esc(rnet.wantCode || '')}" maxlength="4" style="width:80px;margin-top:6px;padding:4px 6px;text-transform:uppercase">${btn('join', 'Join')}${rnet.msg ? `<p style="margin:6px 0 0;color:#ffcf6a">${esc(rnet.msg)}</p>` : ''}<div style="font:600 12px system-ui,sans-serif;color:#4fb0c6;margin-top:8px">O: close this</div>`;
  } else if (!s) {
    sig = 'wait'; html = `${head}<p style="margin:0">Hailing the race…</p>`;
  } else {
    const racing = s.phase === 'count' || s.phase === 'on';
    const rows = s.racers.map((x) => {
      const p = x.id ? s.players.find((y) => y.id === x.id) : null, you = x.id === rnet.id;
      const tag = !x.id ? ' <i>(bot)</i>' : x.bot ? ' <i>(a bot has her)</i>' : you ? ' (you)' : '';
      const st = s.phase === 'done' ? (x.time !== null ? `${x.place}. ${clockText(x.time)}` : 'still racing') : x.id ? (p?.ready ? '✓ ready' : 'not ready') : '';
      return `<div style="display:flex;justify-content:space-between"><span>${esc(x.name)}${tag}</span><span style="color:${p?.ready || s.phase === 'done' ? '#9fe29f' : '#c9b89a'}">${st}</span></div>`;
    }).join('');
    const waiting = s.players.filter((p) => !p.racing && racing).map((p) => esc(p.name));
    const meP = s.players.find((p) => p.id === rnet.id);
    sig = JSON.stringify([s.phase, s.fill, s.racers.map((x) => [x.name, x.time, x.place, x.bot]), s.players.map((p) => [p.name, p.ready, p.racing])]);
    html = `${head}${rows}${waiting.length ? `<p style="margin:6px 0 0;font-style:italic">A race is on: ${waiting.join(', ')} ${waiting.length > 1 ? 'race' : 'races'} the next one.</p>` : ''}${s.phase === 'lobby' ? `<div style="margin-top:6px">Racers in all: ${btn('fill', '−', 'data-by="-1"')}<b>${s.fill}</b> ${btn('fill', '+', 'data-by="1"')}</div>
        ${btn('ready', meP?.ready ? 'Not ready' : 'Ready')}${btn('go', 'Start the count')}` : ''}${s.phase === 'done' ? btn('again', 'Race again') : ''}${btn('copy', 'Copy the link')}${btn('leave', 'Leave')}`;
  }
  if (sig !== rnet.panelSig) { rnet.panelSig = sig; rnet.panel.innerHTML = html; }
}
