// The crew: playing together, and joining one. (Split out of den.js.)
import * as THREE from 'three';
import { gateTop, lowMiddle } from '../den-wall.js';
import { cleanLook, cleanDen } from '../den-look.js';
import { C, MAX_PATCHES, WEAK, k, rand, $, myLook, denLook, scene, camera, woodMat, centred, makePirate, wearLook, animateWalk, pirate, carry, G, raiders, target, ghost, ghostKey, burst, toast, tween, v3, worldLets } from './world.js';
import { ramp, openJob, frameState, frameFits, putFramePiece, finishFrame, startHouse } from './land.js';
import { wall, registerHole, holeVisuals, buildWall, rest, fits, patchFits, relining, updateStats, putPiece, breakHole, dropPiece, breakBoard, holeMidY, wallLets } from './wall.js';
import { gd, fireGun, chalk, gunOut, gunIn } from './gundeck.js';
import { piles, showPile, place, lastPlaced, unplace, holdPiece, refill, piecesLets } from './pieces.js';
import { cannon, boats, raiderOut, throwAt, weakSpot, hackX, widen, raiderSeq, makeRaider, giveLoot, raiderPose, rubbleShow, shoot, blast, endScreen, raidsLets } from './raids.js';
import { applyDen } from './menus.js';
import { newGame } from '../den.js';

// ---------- the crew: playing together ----------
/* Co-op: up to four pirates defend one den, all doing the same jobs. One browser (the first in)
   runs the raiders, deals the crates and tells the others what happens; that's only whose computer
   does the sums. Each pirate walks themself and asks it before taking from a crate or fitting a
   piece, so two can't take the same piece or fill the same spot. If it leaves, the next carries on. */
export const CREW_COLOURS = ['#2a6fb8', '#2f8a4a', '#8a2fb8', '#c07a1f'];
export const net = { ws: null, id: null, host: false, code: '', name: '', crew: new Map(), pending: null, asking: false, holds: new Map(), meAt: 0, snapAt: 0 };
export const online = () => !!(net.ws && net.id);
export const guest = () => online() && !net.host;
export const isHost = () => online() && net.host;
export const myId = () => net.id || 'me';
export const crewSize = () => (online() ? 1 + net.crew.size : 1);
export function send(to, msg) { if (net.ws?.readyState === 1) net.ws.send(JSON.stringify({ ...msg, to })); }
// News everyone should hear: shown here and passed to the crew.
export function say(text, bad = false, warn = false) { toast(text, bad, warn); if (isHost()) send('all', { t: 'toast', text, bad, warn }); }
export const r2 = (n) => Math.round(n * 100) / 100;
const pileSig = (p) => (p.letter ? p.letter + JSON.stringify(p.cells) : '');
// An empty crate goes as the seconds left till it restocks (if it's a while), so the crew see it.
const pilesOut = () => piles.map((p) => (p.letter ? [p.letter, p.cells] : p.wait > 1 ? r2(p.wait) : null));
function pilesIn(list) {
  list.forEach((d, i) => {
    const p = piles[i];
    if (typeof d === 'number') { p.wait = d; d = null; } else if (!d) p.wait = 0;
    if ((d ? d[0] + JSON.stringify(d[1]) : '') === pileSig(p)) return;
    const fresh = d && !p.letter;
    p.letter = d ? d[0] : null;
    p.cells = d ? d[1] : null;
    showPile(p);
    if (fresh && p.group) { const g = p.group, s0 = g.scale.x; tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3))); }
  });
}

// Crewmates: a pirate in their own colours, with their name over their head.
function addMate(id, name) {
  if (id === net.id || net.crew.has(id)) return;
  const used = new Set([...net.crew.values()].map((m) => m.ci));
  const ci = [0, 1, 2, 3].find((i) => !used.has(i)) ?? 0, col = CREW_COLOURS[ci];
  const m = makePirate({ shirt: ['#f4efe4', col], scarf: col, beard: ['#3a2a1a', '#222', '#7a4a1a', '#999'][ci] });
  m.g.position.set(0, 0, 8);
  scene.add(m.g);
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.textContent = name;
  tag.style.borderColor = col;
  $('tags').append(tag);
  net.crew.set(id, { id, name, ci, col, m, tag, x: 0, z: 8, h: 0, tx: 0, tz: 8, th: 0, ry: Math.PI, mv: false, c: '', cg: null, bonkT: 0 });
  crewLine();
}
function dropMate(id) {
  const mt = net.crew.get(id);
  if (!mt) return;
  scene.remove(mt.m.g);
  if (mt.cg) scene.remove(mt.cg);
  mt.tag.remove();
  net.crew.delete(id);
  crewLine();
}
function mateCarry(mt, c) {
  const sig = c ? c[0] + JSON.stringify(c[1]) : '';
  if (sig === mt.c) return;
  mt.c = sig;
  if (mt.cg) scene.remove(mt.cg);
  mt.cg = null;
  if (!c) return;
  mt.cg = centred(c[1], woodMat(c[0]));
  mt.cg.scale.setScalar(0.55);
  scene.add(mt.cg);
}
export function updateMates(dt) {
  for (const mt of net.crew.values()) {
    const a = Math.min(1, dt * 12), g = mt.m.g;
    mt.x += (mt.tx - mt.x) * a; mt.z += (mt.tz - mt.z) * a; mt.h += (mt.th - mt.h) * a;
    let d = mt.ry - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * a;
    animateWalk(mt.m, mt.mv, dt);
    g.position.set(mt.x, g.position.y + mt.h, mt.z);
    if (mt.cg) {
      mt.m.arms.forEach((arm, i) => { arm.rotation.x = -2.75; arm.rotation.z = i ? 0.25 : -0.25; });
      mt.cg.position.set(mt.x, 2.15 + g.position.y, mt.z + 0.05);
    } else mt.m.arms.forEach((arm) => { arm.rotation.z = 0; });
    if (mt.bonkT > 0) { mt.bonkT -= dt; mt.m.arms[1].rotation.x = -2.6 + (0.3 - mt.bonkT) * 9; }
    v3.set(mt.x, 2.5 + mt.h + (mt.cg ? 0.6 : 0), mt.z).project(camera);
    mt.tag.style.display = v3.z > 1 ? 'none' : '';
    mt.tag.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    mt.tag.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  }
}
// The piece a crewmate is using, appearing at their head (or ours, waiting in the air).
function handAt(by, letter, cells, from = null) {
  if (by === myId() && net.pending) { const p = net.pending; net.pending = null; return p; }
  const mt = net.crew.get(by), src = mt || pirate;
  const g = centred(cells, woodMat(letter));
  g.position.set(src.x, 2.15 + (src.h || 0), src.z);
  g.scale.setScalar(0.55);
  scene.add(g);
  if (mt) { mateCarry(mt, null); mt.bonkT = 0.3; }
  return { letter, cells, from, group: g };
}
// Our piece back in our hands (the host said no, or the crew's gone).
function regain(why) {
  const p = net.pending;
  net.pending = null;
  net.asking = false;
  if (!p) return;
  const at = p.group.position.clone();
  scene.remove(p.group);
  holdPiece(p.letter, p.cells, p.from, at);
  if (why) toast(why, true);
}

export function sendMe() {
  send('all', { t: 'me', x: r2(pirate.x), z: r2(pirate.z), h: r2(pirate.h), ry: r2(pirate.g.rotation.y), mv: pirate.moving ? 1 : 0, c: carry ? [carry.letter, carry.cells] : null });
}
export function snapshot() {
  send('all', {
    t: 'snap', g: { ...G }, p: pilesOut(), cv: cannon.visible ? 1 : 0, gd: gunOut(),
    h: wall.holes.map((h) => [r2(h.hp), h.maxHp, h.status, h.pieces.length, h.lay.map((L) => [r2(L.hp), r2(L.maxHp), L.status]), r2(h.rubble || 0), r2(h.weak)]),
    r: raiders.map((r) => [r.id, r2(r.x), r2(r.z), r2(r.m.g.position.y), r2(r.m.g.rotation.y), r2(r.m.g.rotation.x), r2(r.m.g.scale.x), r.state, r.inside ? 1 : 0, r.loot ? 1 : 0, wall.holes.indexOf(r.hole), r2(r.slot), r.look]),
  });
}
function applySnap(m) {
  const was = G.over;
  Object.assign(G, m.g);
  if (G.over && !was) endScreen();
  if (G.wave > 0) $('intro').classList.add('off');
  updateStats();
  pilesIn(m.p);
  gunIn(m.gd);
  cannon.visible = !!m.cv;
  m.h.forEach(([hp, maxHp, status, n, bh, rub, weak], i) => {
    const h = wall.holes[i];
    if (!h) return;
    if (weak !== undefined) h.weak = weak;
    if (h.rubble !== rub) { h.rubble = rub; rubbleShow(h); }
    if (h.busy || h.pieces.length !== n) return;   // something's on its way: wait for it
    if (h.status !== status) { h.status = status; h.sig = ''; }
    h.hp = hp; h.maxHp = maxHp;
    (bh || []).forEach(([hp, maxHp, status], j) => { if (h.lay[j]) { if (h.lay[j].status !== status) h.sig = ''; Object.assign(h.lay[j], { hp, maxHp, status }); } });
  });
  const seen = new Set();
  for (const [id, x, z, y, ry, rx, sc, state, inside, loot, hi, slot, look] of m.r) {
    seen.add(id);
    let r = raiders.find((o) => o.id === id);
    if (!r) { r = makeRaider(look, id, x, z); r.m.g.rotation.y = ry; }
    Object.assign(r, { nx: x, nz: z, ny: y, nry: ry, nrx: rx, nsc: sc, inside: !!inside, hole: wall.holes[hi] || r.hole, slot });
    if (r.state !== state) { r.state = state; r.t = 0; }
    if (loot && !r.loot) giveLoot(r);
    else if (!loot && r.loot) { r.loot.removeFromParent(); r.loot = null; }
  }
  for (let i = raiders.length - 1; i >= 0; i--) {
    if (seen.has(raiders[i].id)) continue;
    raiderOut(raiders[i]);
    raiders.splice(i, 1);
  }
}
export function followRaider(r, dt) {
  if (r.nx === undefined) return;
  const a = Math.min(1, dt * 10), g = r.m.g, ox = r.x, oz = r.z;
  r.t += dt;
  r.x += (r.nx - r.x) * a;
  r.z += (r.nz - r.z) * a;
  if (['climb', 'climbOut', 'down'].includes(r.state)) {
    g.position.y += (r.ny - g.position.y) * a;
    g.rotation.x = r.nrx;
    g.scale.setScalar(r.nsc);
  } else { g.rotation.x = 0; g.scale.setScalar(0.82); }
  let d = r.nry - g.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  g.rotation.y += d * a;
  if ((r.state === 'attack' || r.state === 'hackOut') && r.hole) {
    r.hitT -= dt;
    if (r.hitT <= 0) {
      r.hitT = 0.7;
      burst(new THREE.Vector3(hackX(r.hole, r.slot * 0.5), Math.min(holeMidY(r.hole), 1.4), r.state === 'hackOut' ? 0.6 : 0.25), weakSpot(r.hole) ? '#9a8a7a' : '#c98a45', 4, 2);
      r.hole.jig = 0.15;
    }
  }
  raiderPose(r, Math.hypot(r.x - ox, r.z - oz) > dt * 0.4, dt);
}

// Everything a pirate joining needs to see the den as it is now.
export function sendSync(to, fresh = false) {
  send(to, {
    t: 'sync', fresh, g: { ...G }, W: wall.W, H: wall.H, gate: wall.gateCols, cv: cannon.visible ? 1 : 0, p: pilesOut(),
    holes: wall.holes.map((h) => ({ cells: h.cells, status: h.status, hp: h.hp, maxHp: h.maxHp, weak: h.weak, hop: h.hop ? 1 : 0, pieces: h.pieces.map((p) => p.info), boards: h.lay.map((L) => [L.hp, L.maxHp, L.status]) })),
    next: ramp.next,
    gd: gunOut(),
    den: denLook,
    jobs: ramp.jobs.map((j) => (j.frame ? { cells: j.frame.walk || j.frame.cells, pieces: j.frame.pieces.map((p) => p.info), done: j.frame.done } : null)),
  });
}
function applySync(s) {
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  if (carry) { scene.remove(carry.group); worldLets.carry = null; }
  if (net.pending) { scene.remove(net.pending.group); net.pending = null; }
  net.asking = false;
  piecesLets.lastPlaced = null; worldLets.target = null; worldLets.ghost = null; worldLets.ghostKey = '';
  Object.assign(G, s.g);
  $('labels').replaceChildren();
  wallLets.wall = { W: s.W, H: s.H, holes: [], cellHole: new Map(), wood: new Set(), lining: Array.from({ length: MAX_PATCHES }, () => new Set()), gate: new Set(), gateCols: s.gate, stoneAt: new Map() };
  for (let r = gateTop(s.H); r < s.H; r++) for (let c = s.gate.c0; c <= s.gate.c1; c++) wall.gate.add(k(r, c));
  wall.mid = lowMiddle(s.H, s.gate);
  s.holes.forEach((d) => registerHole(d.cells));
  buildWall();
  wall.holes.forEach((h, i) => {
    const d = s.holes[i];
    holeVisuals(h);
    d.pieces.forEach((info) => putPiece(h, info));
    Object.assign(h, { status: d.status, hp: d.hp, maxHp: d.maxHp, weak: d.weak ?? WEAK, hop: !!d.hop });
    (d.boards || []).forEach((L, j) => { if (h.lay[j] && Array.isArray(L)) Object.assign(h.lay[j], { hp: L[0], maxHp: L[1], status: L[2] }); });
    h.open = rest(h);
    h.exact = h.status === 'open' && h.open.length % 5 === 0 && C.solve(h.open, 1).length > 0;
    h.sig = '';
  });
  relining();
  // The rampart as built so far: every piece of it, where it is.
  s.jobs.forEach((d, i) => {
    if (!d) return;
    const f = openJob(i, d.cells);
    d.pieces.forEach((info) => putFramePiece(f, info));
    frameState(f);
    if (d.done) finishFrame(f, true);
  });
  ramp.next = s.next;
  if (s.den) applyDen(cleanDen(s.den));
  gunIn(s.gd);
  cannon.visible = !!s.cv;
  pilesIn(s.p);
  if (s.fresh) { Object.assign(pirate, { x: 0, z: 8, h: 0 }); $('intro').classList.remove('off'); }
  if (G.over) endScreen(); else $('end').classList.remove('on');
  updateStats();
}
// The host's gone: this browser runs the den now (or, cut off, carries on alone).
function becomeHost() {
  net.host = true;
  for (const r of raiders) { r.t = 0; r.hitT = 0.5; r.targeted = false; if (r.state === 'down') r.gone = true; }
  if (G.cannonT == null) G.cannonT = G.wave >= 2 ? 8 : Infinity;
  if (G.spawnT == null) G.spawnT = 1;
  raidsLets.raiderSeq = Math.max(raiderSeq, 0, ...raiders.map((r) => r.id));
  net.holds.clear();
  regain();
  piles.forEach((p) => { if (!p.letter && carry?.from !== p) refill(p); });
}

// The host's side: the crew asking for things.
function hostPlace(m) {
  const pile = piles[m.pile] || null;
  const list = m.frame != null ? frameFits(m.shape).filter((o) => o.frame.i === m.frame) : fits(m.shape).concat(patchFits(m.shape)).filter((o) => o.hole === m.hole);
  const t = list.find((o) => o.dr === m.dr && o.dc === m.dc && !!o.patch === !!m.patch);
  if (!t) return send(m.from, { t: 'grant', letter: m.letter, cells: m.shape, pile: m.pile, why: 'Someone got there first' });
  net.holds.delete(m.from);
  place(t, m.from, handAt(m.from, m.letter, m.shape, pile));
}
function hostThrow(m) {
  net.holds.delete(m.from);
  const hand = handAt(m.from, m.letter, m.shape, piles[m.pile] || null);
  const r = raiders.find((o) => o.id === m.rid);
  if (r && !r.gone) throwAt(r, hand, m.from);
  else { scene.remove(hand.group); refill(hand.from); }
}
const slotOf = (m) => (m.frame != null ? ramp.jobs[m.frame]?.frame : wall.holes[m.hole]);

export function onNet(m) {
  const mt = net.crew.get(m.from);
  switch (m.t) {
    case 'welcome':
      net.id = m.id;
      net.host = m.host === m.id;
      m.crew.forEach((c) => addMate(c.id, c.name));
      send('all', { t: 'look', look: myLook });
      crewPanel(false);
      history.replaceState(null, '', `?crew=${net.code}`);
      if (net.host) newGame();
      crewLine();
      break;
    case 'full': lobbyMsg('That crew is full: four pirates already.'); break;
    case 'join':
      addMate(m.id, m.name);
      send(m.id, { t: 'look', look: myLook });
      toast(`${m.name} came aboard!`);
      if (net.host) sendSync(m.id);
      break;
    case 'leave': {
      const who = net.crew.get(m.id)?.name;
      dropMate(m.id);
      if (who) toast(`${who} left the crew`, false, true);
      if (net.host) {
        const pi = net.holds.get(m.id);
        net.holds.delete(m.id);
        if (pi !== undefined && !piles[pi].letter) refill(piles[pi]);
      } else if (m.host === net.id) becomeHost();
      break;
    }
    case 'me':
      if (!mt) return;
      Object.assign(mt, { tx: m.x, tz: m.z, th: m.h, ry: m.ry, mv: !!m.mv });
      mateCarry(mt, m.c);
      break;
    case 'toast': toast(m.text, m.bad, m.warn); break;
    case 'look': if (mt) wearLook(mt.m, cleanLook(m.look)); break;
    case 'den': applyDen(cleanDen(m.den)); break;
    case 'build': if (net.host) startHouse(); break;
    case 'map': if (net.host && G.map !== 'found') { G.map = 'found'; say("A crewmate's picked up the captain's map: press M to have a look"); } break;
    // From the host: what happened.
    case 'snap': if (!net.host) applySnap(m); break;
    case 'sync': if (!net.host) applySync(m); break;
    case 'grant':
      if (net.host) break;
      if (net.pending) { regain(m.why); break; }
      net.asking = false;
      if (m.letter && !carry) {
        const p = piles[m.pile];
        holdPiece(m.letter, m.cells, p, p.group ? p.group.position.clone() : new THREE.Vector3(p.x, 0.76, p.z));
        if (p.group) scene.remove(p.group);
        p.group = null; p.letter = null;
      }
      break;
    case 'place':
      if (net.host) hostPlace(m);
      else {
        const t = { ...m, frame: m.frame != null ? ramp.jobs[m.frame]?.frame : undefined };
        if (t.frame || wall.holes[m.hole]) place(t, m.by, handAt(m.by, m.letter, m.shape));
      }
      break;
    case 'unplace': if (!net.host && slotOf(m)) unplace(slotOf(m), m.by, undefined, m.pi ?? null); break;
    case 'throw':
      if (net.host) hostThrow(m);
      else if (m.by !== net.id) {
        const r = raiders.find((o) => o.id === m.rid), hand = handAt(m.by, m.letter, m.shape);
        if (r) throwAt(r, hand, m.by); else scene.remove(hand.group);
      }
      break;
    case 'break': if (!net.host && wall.holes[m.hole]) breakHole(wall.holes[m.hole]); break;
    case 'drop': if (!net.host && wall.holes[m.hole]) dropPiece(wall.holes[m.hole]); break;
    case 'gfire': if (!net.host && gd?.guns[m.i]) fireGun(m.i, m.x, m.z, !!m.cn); break;
    case 'chalk': if (net.host && gd) chalk(m.r, m.c, m.dir, m.from); break;
    case 'unboard': { const h = wall.holes[m.hole]; if (!net.host && h?.pieces[m.i]) breakBoard(h, h.pieces[m.i]); break; }
    case 'shoot': if (!net.host) shoot(m.cells); break;
    case 'blast': if (!net.host) blast(m.cells, true); break;
    case 'widen': if (!net.host && wall.holes[m.hole]) widen(wall.holes[m.hole], m.cells); break;
    case 'frame': if (!net.host) openJob(m.fi, m.cells); break;
    // To the host: the crew asking.
    case 'crate': {
      if (!net.host) break;
      const p = piles[m.i];
      if (p?.letter && !net.holds.has(m.from)) {
        send(m.from, { t: 'grant', letter: p.letter, cells: p.cells, pile: m.i });
        net.holds.set(m.from, m.i);
        if (p.group) scene.remove(p.group);
        p.group = null; p.letter = null;
      } else send(m.from, { t: 'grant' });
      break;
    }
    case 'putback': {
      if (!net.host) break;
      const p = piles[m.i];
      if (p && !p.letter) { p.letter = m.letter; p.cells = m.cells; showPile(p); }
      net.holds.delete(m.from);
      break;
    }
    case 'takeback': {
      if (net.host && m.pi != null && slotOf(m)?.occ) { unplace(slotOf(m), m.from, false, m.pi); break; }   // lifted out of a frame
      const where = net.host && slotOf(m), p = where?.pieces[where.pieces.length - 1];
      if (p && p.by === m.from && p.undo?.hpAfter != null && !(where.occ ? where.done : !p.patch && where.status === 'master')) unplace(where, m.from, false);
      break;
    }
    case 'again': if (net.host && G.over) newGame(); break;
  }
}

// ---------- joining a crew ----------
const CREW_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ', PIRATE_NAME = /^[A-Za-z]{3,16}$/;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } } };
function savedName() {
  const own = store.get('carp.den.name');
  if (own) return own;
  try { return JSON.parse(store.get('carp.pirate'))?.name || ''; } catch { return ''; }
}
function lobbyMsg(text, calm = false) { const el = $('crew-err'); el.textContent = text; el.classList.toggle('calm', calm); }
function crewPanel(on) {
  $('crew').classList.toggle('on', on);
  if (!on) return;
  lobbyMsg('');
  $('crew-name').value ||= savedName();
  ($('crew-name').value ? $('crew-code') : $('crew-name')).focus();
}
function crewLine() {
  const el = $('crew-line');
  el.replaceChildren();
  $('crew-btn').hidden = online();
  if (!online()) return;
  const add = (tag, text, cls) => { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; el.append(e); return e; };
  add('span', 'Crew ');
  add('b', net.code);
  add('span', ': ');
  add('span', `${net.name} (you)`);
  for (const mt of net.crew.values()) { add('span', ', '); add('span', mt.name).style.color = mt.col; }
  const copy = add('button', 'Copy invite link', 'mini');
  copy.onclick = () => {
    const link = `${location.origin}${location.pathname}?crew=${net.code}`;
    navigator.clipboard?.writeText(link).then(() => { copy.textContent = 'Copied!'; }, () => { copy.textContent = link; });
  };
  add('button', 'Leave', 'mini').onclick = leaveCrew;
}
// On narrower screens the wave banner sits under the panel, however tall the crew line makes it.
new ResizeObserver(([e]) => document.documentElement.style.setProperty('--hud-h', `${e.target.offsetHeight}px`)).observe(document.querySelector('.hud'));
export function joinCrew(code, name) {
  if (!PIRATE_NAME.test(name)) return lobbyMsg('Your pirate name: 3 to 16 letters, no spaces.');
  if (!/^[A-Z]{4}$/.test(code)) return lobbyMsg('A crew code is four letters.');
  store.set('carp.den.name', name);
  if (net.ws) leaveCrew();
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/crew/${code}?name=${encodeURIComponent(name)}`);
  Object.assign(net, { ws, code, name: name[0].toUpperCase() + name.slice(1).toLowerCase(), host: false, id: null });
  lobbyMsg('Hailing the crew…', true);
  ws.onmessage = (e) => { if (net.ws !== ws) return; let m; try { m = JSON.parse(e.data); } catch { return; } onNet(m); };
  ws.onclose = () => { if (net.ws === ws) lostCrew(); };
}
function lostCrew(quiet = false) {
  const was = online();
  net.ws = null;
  net.id = null;
  [...net.crew.keys()].forEach(dropMate);
  if (was && !net.host) becomeHost();   // carry on with the den as it stands
  net.host = false;
  net.holds.clear();
  regain();
  crewLine();
  if (quiet) return;
  if (was) toast('Lost touch with the crew: carrying on alone', true);
  else lobbyMsg("Couldn't reach the crew. Crews need the live site, not a plain file preview.");
}
export function leaveCrew() {
  const ws = net.ws;
  lostCrew(true);
  ws?.close();
  history.replaceState(null, '', location.pathname);
}
$('crew-btn').onclick = () => crewPanel(true);
$('crew-close').onclick = () => crewPanel(false);
$('crew-start').onclick = () => joinCrew(Array.from({ length: 4 }, () => CREW_CODE[rand(CREW_CODE.length)]).join(''), $('crew-name').value.trim());
$('crew-join').onclick = () => joinCrew($('crew-code').value.trim().toUpperCase(), $('crew-name').value.trim());
$('crew-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('crew-join').click(); });
{
  const code = new URLSearchParams(location.search).get('crew')?.toUpperCase();
  if (code && /^[A-Z]{4}$/.test(code)) {
    $('crew-code').value = code;
    if (PIRATE_NAME.test(savedName())) setTimeout(() => joinCrew(code, savedName()), 0);
    else crewPanel(true);
  }
}
