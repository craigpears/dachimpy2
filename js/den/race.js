// The sloop race, in 3D and at sea (its rules: src/den-race.ts; its course LAY.RACE in src/den-sail.ts;
// what the starter says, src/lines/race.ts). Out past Primates Rule, behind a line of rocks with one gate
// in it: the starting buoy off the gate, the course's land (its spits, the headland the locks cut through),
// its winds (the snakes, the headwinds the Doubles hop, the start's field's), the field's whirlpools and the
// whirlpool channel's, its gun gap's two guns, the crane in its notch on the last spit; the clock and your
// place. Its start (the line, picking your spot and how many rivals, the starter's card) is race-start.js;
// its marks (the numbered buoys, the finish line and the moment you cross it, everyone's places)
// race-marks.js; the barrier of driftwood and its Foraging race-forage.js; your rivals' sloops on the water,
// their broadsides and yours, race-field.js.
// Everything it's made of is a shared piece: the sea draws its line of rocks (reef.js), the locks
// (lock.js) and the winds (sea.js, windLane); a gun is a destructible turret (turret.js), a whirlpool
// Kikkit's look (whirlpools.js), the sloop the sloop (sloop.js), the crane's frames played on the deck
// patch's tray (sea-puzzles.js). The starlit door, hidden in the second spit's cliffs, is door.js's. Touches the rest only through a few hooks: sailing.js builds, ticks and
// asks it (keys, the prompt, her shots, what holds her), and a starting point (menus.js).
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { whirlpool } from '../den-whirl.js';
import { CRANE, travel } from '../den-crane.js';
import { RACE, Race, GunGap, Drift, atStart, clockText, cleanBest, neckCrane, nextBuoy, stretchAt } from '../den-race.js';
import { simDrive } from '../race-sim.js';
import { FIELD } from '../den-racers.js';
import { STARTER } from '../lines/race.js';
import { scene, mat, mesh, canvasTex, V3, burst, toast, flagpole, pirate } from './world.js';
import { rock } from './land.js';
import { sail, seaX, seaZ, windLane, bankTop, stoneM, grassM, SLOOP_DECK } from './sea.js';
import { turretMesh, turretMark, turretView, turretWrecked, turretFire, turretLand, shotComing } from './turret.js';
import { pool } from './whirlpools.js';
import { patch, patchPrompt, deckHoleShape } from './sea-puzzles.js';
import { bake } from './bake.js';
import { cine } from './cine.js';
import { doorWorld, doorSquares, doorKey, doorPrompt, doorHolds, doorCarried, doorTick, doorReset } from './door.js';
import { DOOR } from '../den-door.js';
import { startWorld, takeLine, lineKey, linePrompt, startTick } from './race-start.js';
import { marksWorld, marksTick, crossed, placings } from './race-marks.js';
import { fieldWorld, fieldTick, fieldHome, fieldShot, fieldHit, fieldAt, fieldReset } from './race-field.js';
import { forageWorld, forageKey, foragePrompt, forageHolds, forageTick, forageReset, forageCam, forageHover, forageClick } from './race-forage.js';

const RC = LAY.RACE, CELL = SAIL.CELL, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const NTH = (n) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
const say = (s, secs, place = 1) => s.replace('{time}', clockText(secs)).replace('{place}', NTH(place));
/** Everyone's places for the finish card: you, and each rival, home or still racing. */
const rows = (R) => R.standings().map((x) => ({ place: x.place, name: x.i === 0 ? 'You' : x.name, time: x.time === null ? null : clockText(x.time), you: x.i === 0 }));
function readBest() { try { return cleanBest(localStorage.getItem(RACE.STORE)); } catch { return null; } }
function keepBest(secs) { try { localStorage.setItem(RACE.STORE, String(secs)); } catch { /* (no storage: kept this voyage only) */ } }
const newRace = () => new Race(readBest(), simDrive);
export const race = { W: null, rules: newRace(), gap: new GunGap(), drift: new Drift(), crane: neckCrane(), said: {}, trip: null, hud: null, doneT: 0 };

// ---------- the look of it ----------
/* The course's land, a square at a time, each spit as it is: the first, third and last low and grassy
   (a few boulders on them), the second a high ridge of cliffs (the starlit door's face, kept plain:
   LAY.RACE.DOOR), the fourth a headland standing over the canal its locks cut through (its banks as the
   sea's cliffs are: bankTop). All baked into a mesh a material. (The
   starlit door's squares, its face and the tunnel's far end, are its crags': door.js.) */
const LOOK = [{ h: 0.9, low: true }, { h: 4.6 }, { h: 0.9, low: true }, { h: null }, { h: 1.0, low: true }];
const sandM = mat('#d9c08a', { roughness: 1 }), lowGrass = mat('#7c9a52', { roughness: 1 });
function land(g) {
  const S = CELL;
  const square = (c, r, h, side, top) => {
    const b = mesh(new THREE.BoxGeometry(S, h + 1, S), side); b.position.set(seaX(c), (h - 1) / 2, seaZ(r));
    const t = mesh(new THREE.BoxGeometry(S, 0.12, S), top); t.position.set(seaX(c), h + 0.06, seaZ(r));
    g.add(b, t);
  };
  RC.LAND.forEach((sq, i) => {
    const L = LOOK[i];
    for (const [c, r] of sq) {
      if (doorSquares.has(`${c},${r}`)) continue;
      const h = L.h ?? bankTop(c, r);
      square(c, r, h, L.low ? sandM : stoneM, L.low ? lowGrass : grassM);
      if (L.low && (c * 7 + r * 3) % 4 === 0) g.add(rock(seaX(c) + (Math.random() - 0.5) * 2.5, h, seaZ(r) + (Math.random() - 0.5) * 2.5, 0.5 + Math.random() * 0.4));
      if (!L.low && (c * 5 + r) % 3 === 0) g.add(rock(seaX(c) + (Math.random() - 0.5) * 3, h * (0.3 + Math.random() * 0.5), seaZ(r) + (Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.6));
    }
  });
}
// A race flag: chequered black and white.
const chequer = () => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(64, 40, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f1e8'; x.fillRect(i * 8, j * 8, 8, 8); } }) });
// The starting buoy: a tall one, banded yellow and black, a chequered flag on it.
function buoy() {
  const g = new THREE.Group(), y = mat('#e8b52a', { roughness: 0.6 }), k = mat('#26221e');
  const body = mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.4, 14), y); body.position.y = 0.4;
  const band = mesh(new THREE.CylinderGeometry(0.5, 0.53, 0.3, 14), k); band.position.y = 0.55;
  const f = flagpole(2.2, chequer()); f.position.y = 1.05;
  g.add(body, band, f);
  return g;
}
// Whirlpools' winds as the trade winds' (sea.js, windLane): each straight run one lane.
function lanes(list) {
  const d0 = new Map(list.map(([c, r, d]) => [`${c},${r}`, d])), out = [];
  for (const [c, r, d] of list) {
    if (d0.get(`${c - DC[d]},${r - DR[d]}`) === d) continue;
    let n = 1;
    while (d0.get(`${c + DC[d] * n},${r + DR[d] * n}`) === d) n++;
    out.push(windLane(c, r, d, n));
  }
  return out;
}
/* The crane on the last spit: a stone footing on the land, its frames (the pieces you fit) put up on it as
   each is built: the foot laid flat, the post stood up on it, the jib out from its top on a turning
   head; then its rope and hook. Where it stands: on the spit beside the notch she lies in. */
const CR = { c: RC.CRANE.LEDGE[0] + 1, r: (RC.SPITS[4].r0 + RC.SPITS[4].r1) / 2, y: LOOK[4].h + 0.12 };
const POST_H = 8 * CRANE.SQ, JIB_A = 0.33, JIB_L = 10 * CRANE.SQ, TIP = V3(JIB_L * Math.cos(JIB_A) - 0.2, POST_H + 0.3 + JIB_L * Math.sin(JIB_A), 0);
function craneMesh() {
  const g = new THREE.Group(), slew = new THREE.Group(), rope = mat('#c9ab72', { roughness: 0.95 });
  g.position.set(seaX(CR.c), CR.y, seaZ(CR.r));
  const foot = mesh(new THREE.BoxGeometry(3.2, 0.3, 2.2), stoneM); foot.position.y = 0.0;
  slew.position.y = 0.2;
  slew.rotation.y = -Math.PI / 2;   // (its jib out over her ledge)
  const hook = new THREE.Group(), line = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), rope);
  line.position.y = 0.5; hook.add(line);
  const iron = mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12, Math.PI * 1.4), mat('#33383d', { metalness: 0.6 })); iron.position.y = -0.1; hook.add(iron);
  hook.visible = false;
  g.add(foot, slew, hook);
  return { g, slew, hook, parts: [] };
}
// Where each part goes: the foot flat on the footing, the post up on it, the jib out from its top.
function partPlace(V, i, fg) {
  if (i === 0) { V.g.add(fg); fg.position.set(0, 0.18, 0); fg.rotation.set(0, 0, 0); return; }
  // (the post stood up, its face toward the den; the jib out from its top on the turning head)
  if (i === 1) { V.g.add(fg); fg.position.set(0, POST_H / 2 + 0.2, 0); fg.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX'); return; }
  V.slew.add(fg);
  fg.position.set(JIB_L / 2 * Math.cos(JIB_A), POST_H + 0.3 + JIB_L / 2 * Math.sin(JIB_A), 0); fg.rotation.set(0, 0, JIB_A);
}

function build() {
  const W = { g: new THREE.Group(), winds: [], pools: [], guns: [], rings: [], crane: null };
  const ground = new THREE.Group();
  land(ground);
  bake(ground);
  W.g.add(ground);
  // The starting buoy off the gate (the gate's flags and the finish flag there were are the numbered
  // buoys and the finish line now: race-marks.js).
  const b = buoy(); b.position.set(seaX(RC.BUOY[0]) + CELL * 0.4, 0.1, seaZ(RC.BUOY[1]) - CELL * 0.4); W.g.add(b);
  // Its winds (the snakes, the headwinds the Doubles hop, the start's field's), the whirlpool channel's
  // winds, and the channel's whirlpools and the field's.
  for (const l of [...lanes(RC.WINDS), ...lanes(RC.WHIRLS.WINDS)]) { W.g.add(l.g); W.winds.push(l.tex); }
  for (const spot of [...RC.WHIRLS.POOLS, ...RC.FIELD.POOLS]) { const o = pool(whirlpool(spot)); W.g.add(o); W.pools.push(o); }
  // The gun gap: a turret either side on the spit, in plain stone, and the squares they're trained on.
  for (const [c, r] of RC.GUNS.at) { const V = turretMesh({ rocks: 2 }); V.g.position.set(seaX(c), LOOK[0].h - 0.3, seaZ(r)); W.g.add(V.g); W.guns.push(V); }
  RC.GUNS.marks.forEach((ms) => ms.forEach(([c, r]) => { const m = turretMark(seaX(c), seaZ(r)); W.g.add(m.g); W.rings.push({ c, r, m: m.m }); }));
  // The crane's footing on the neck.
  W.crane = craneMesh(); W.g.add(W.crane.g);
  scene.add(W.g);
  startWorld(); marksWorld(); forageWorld(); fieldWorld();
  return W;
}
/** Built the first time the sea's drawn (sailing.js). */
export function raceWorld() { race.W ||= build(); doorWorld(); }

// ---------- the crane's frames, on the deck patch's tray (sea-puzzles.js) ----------
const K = () => race.crane;
const frameM = mat('#4a3220', { roughness: 1 });
const away = {
  sq: CRANE.SQ,
  hole: () => (K().building && sail.on && !race.trip && K().alongside(sail.helm) ? K().frame : null),
  // Laid flat on the neck beside the footing, toward her.
  mount(g) {
    g.position.set(seaX(CR.c) + 2.6, CR.y + 0.05, seaZ(CR.r) + 1.2);
    g.rotation.set(0, 0, 0);
    g.userData.frameOnNeck = true;
    race.W.g.add(g);
  },
  dress(face, f) {
    const sq = new THREE.PlaneGeometry(0.55, 0.55);
    for (const [r, c] of f.cells) { const p = mesh(sq, frameM, false); p.position.set((c + 0.5) * 0.55, -(r + 0.5) * 0.55, -0.02); face.add(p); }
  },
  // Full: sawn to fit, and up it goes into its place on the crane; the next part's frame is laid.
  done(f) {
    const g = patch.group, i = K().up;
    toast(f.shipshape() ? 'Shipshape! Not a scrap wasted' : `Sawn to fit: ${f.over()} square${f.over() > 1 ? 's' : ''} of offcuts`);
    if (g) { g.userData.frameOnNeck = false; burst(g.getWorldPosition(V3()), '#e8c890', 14, 3); partPlace(race.W.crane, i, g); race.W.crane.parts.push(g); }
    for (const e of K().raise()) if (e.kind === 'built') { race.W.crane.hook.visible = true; toast('The crane\'s built! Space: haul her over the neck'); return; }
    K().build();
    toast(`The crane's ${CRANE.PARTS[i].name}'s up! Now its ${CRANE.PARTS[K().up].name}`);
  },
};
patch.aways.push(away);
const building = () => patch.on && patch.at === away && !K().built();

// ---------- her trip over the neck ----------
// Hooked up from the leg, up, swung over the neck, and down onto the run home (the crane's beats:
// src/den-crane.ts, travel), Space skipping it. Then she's set down there, on her way.
function haulOver() {
  if (!K().haul()) return;
  race.trip = { from: sail.g.position.clone(), yaw: sail.g.rotation.y };
  sail.helm.moor({ ...sail.helm.pose });
}
function tripTick(dt) {
  const T = race.trip, V = race.W.crane, b = travel(K().trip?.t ?? 0);
  if (K().trip) K().tick(dt);
  const ease = (u) => u * u * (3 - 2 * u);
  V.slew.rotation.y = -Math.PI / 2 + Math.PI * ease(b.swing);
  V.slew.updateMatrixWorld(true);
  const tip = V.slew.localToWorld(TIP.clone()), hang = tip.clone().setY(tip.y - 2.6 - SLOOP_DECK);
  const to = V3(seaX(RC.CRANE.TO.c), 0, seaZ(RC.CRANE.TO.r));
  let p;
  if (b.swing <= 0) p = T.from.clone().lerp(hang, ease(b.rise));
  else if (b.lower <= 0) p = hang;
  else p = hang.clone().lerp(to, ease(b.lower));
  sail.g.position.copy(p);
  sail.g.rotation.y = T.yaw + Math.PI * ease(b.swing);
  V.hook.position.copy(V.g.worldToLocal(tip.clone())).setY(V.g.worldToLocal(tip.clone()).y - 1);
  if (!K().trip) arrive();
  else standAboard();
}
function arrive() {
  race.trip = null;
  K().where = 'cove';
  race.W.crane.slew.rotation.y = -Math.PI / 2;
  sail.helm.moor({ ...RC.CRANE.TO });
  toast('Over the neck, and on her way');
}
function standAboard() {
  sail.g.updateMatrixWorld(true);
  const at = sail.g.localToWorld(V3(-1.15, SLOOP_DECK, 0)), yaw = sail.g.rotation.y;
  pirate.x = at.x; pirate.z = at.z; pirate.g.position.copy(at);
  pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
}

// ---------- the keys, the prompt, her shots ----------
/** Holding her: on the crane's hook, or at its frame (no pins, no Sailing board). */
export const raceHolds = () => !!race.trip || building() || doorHolds() || forageHolds() || (sail.on && (race.rules.state === 'line' || race.rules.state === 'count'));
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** A key at sea, first: whether it was the race's. */
export function raceKey(key) {
  if (!sail.on || !race.W) return false;
  const go = key === ' ' || key === 'enter', h = sail.helm;
  if (!race.trip && !building() && doorKey(key)) return true;   // (the starlit door: door.js)
  if (!race.trip && !building() && forageKey(key)) return true;   // (the barrier of driftwood: race-forage.js)
  if (lineKey(key, race.rules)) return true;   // (on the starting line: race-start.js)
  if (race.trip) { if (go || key === 'escape') { K().skip(); arrive(); } return !VIEW.includes(key); }
  if (building()) {
    if (key === 'escape') { K().leave(); toast('The frame can wait: it stays on the neck as it is'); return true; }
    return false;   // (the tray's keys: sea-puzzles.js)
  }
  if (go && K().alongside(h)) {
    if (K().built()) haulOver();
    else { const first = !K().frame && K().up === 0; K().build(); if (first) toast('A crane, by Carpentry: first its foot'); }
    return true;
  }
  const R = race.rules;
  if (go && atStart(h.pose.c, h.pose.r) && h.slot < 0 && !h.held() && R.state !== 'count' && R.state !== 'on') {
    takeLine(R);
    race.gap = new GunGap();
    doorReset();   // (shut again, for a new race)
    forageReset();   // (the driftwood back across its gap)
    toast('Pick yer spot on the line, and Space when ye\'re ready');
    return true;
  }
  return false;
}
export function racePrompt() {
  if (!sail.on || !race.W) return '';
  const h = sail.helm, R = race.rules;
  if (race.trip) return 'Space: skip';
  const dp = doorPrompt();
  if (dp || doorHolds()) return dp;
  const lp = linePrompt(R) || foragePrompt();
  if (lp) return lp;
  if (building() && !K().built()) return patchPrompt(`The crane's ${CRANE.PARTS[K().up].name} (${K().up + 1} of ${CRANE.PARTS.length}) · 1, 2, 3: a piece`, ' (the spare gets sawn off)', ' · Esc: leave it for now');
  if (K().alongside(h)) {
    if (K().built()) return 'Under the crane · Space: haul her over the neck';
    return K().frame || K().up ? `Alongside the neck · Space: back to building the crane (its ${CRANE.PARTS[K().up].name})` : 'Alongside the neck · Space: build a crane to haul her over (Carpentry)';
  }
  if (atStart(h.pose.c, h.pose.r) && h.slot < 0 && R.state !== 'count' && R.state !== 'on') {
    return `The race buoy · Space: in to the starting line${R.best ? ` · your best ${clockText(R.best)}` : ''}`;
  }
  return '';
}
/* Her broadside, fired over `cells` (sailing.js, sailFire): the rival it'd come down on, if one's on them
   (before any rock: the race's field says), and where her sloop's drawn; or null. */
export function raceTarget(cells) {
  if (!sail.on || !race.W) return null;
  const i = race.rules.target(cells);
  return i > 0 ? { i, at: fieldAt(i) } : null;
}
/** Her shot's come down on rival `i`: holed, dazed till she's patched (the field's rules), shown on her. */
export function raceHitRival(i) { if (race.rules.shoot(i)) fieldHit(i); }
/* Her shot came down on (c, r) (sailing.js, sailFire): on one of the gun gap's guns, a hit on it; once
   she's fired on them they fire on her, as the checkpoint's do. Whether it was theirs. */
export function raceShot(hit, at) {
  const e = race.gap.shot(...hit);
  if (!e) return false;
  const fight = e.first ? ' It\'s a fight now: their guns are on her' : '';
  if (e.did === 'quiet') toast(`A hit on the gun! That's quietened it for a while (${race.gap.guns[e.gun].left()} more to wreck it).${fight}`);
  else if (e.did === null) toast('A hit on the wrecked gun!');
  else {
    turretWrecked(race.W.guns[e.gun], at);
    toast(race.gap.silenced() ? 'Both guns wrecked! The gap\'s safe' : 'That gun\'s wrecked! Its marks are safe now');
  }
  return true;
}

// ---------- each tick ----------
function hud() {
  if (!race.hud) {
    const el = race.hud = document.createElement('div');
    el.id = 'racehud';
    Object.assign(el.style, { position: 'fixed', top: '112px', left: '50%', transform: 'translateX(-50%)', padding: '6px 16px', borderRadius: '8px', background: 'rgba(20,14,9,.78)', color: '#f4e9cf', font: '600 16px/1.3 system-ui, sans-serif', zIndex: 20, pointerEvents: 'none', display: 'none', whiteSpace: 'nowrap' });
    document.body.appendChild(el);
  }
  const R = race.rules, show = sail.on && !cine && (R.state === 'count' || R.state === 'on' || (R.state === 'done' && race.doneT > 0));
  race.hud.style.display = show ? 'block' : 'none';
  if (!show) return;
  // Where she is: the leg she's on and the buoy at its end, the next one (the long way plain to follow).
  const legs = RC.STRETCHES.length - 1, p = sail.helm.pose, here = stretchAt(p.c, p.r);
  const where = R.state === 'done' ? 'home' : here === legs ? 'the run home · to the finish line' : here >= 0 ? `Leg ${here + 1} of ${legs} · to buoy ${here + 1}` : R.leg === 0 && p.r < RC.STRETCHES[0].r ? 'the start · to buoy 1' : `Leg ${Math.min(legs, R.leg + 1)} of ${legs}`;
  // (your place among the field, and your shots: her guns' loaded, more by Gunnery)
  const n = R.field.racers.length, place = n > 1 ? ` · ${NTH(R.place())} of ${n}` : '';
  const shots = sail.guns.shots('L') + sail.guns.shots('R');
  const txt = R.state === 'count' ? `Race · ${Math.ceil(R.t)}...` : `Race ${clockText(R.clock())}${place} · ${where} · shots ${shots}${R.best ? ` · best ${clockText(R.best)}` : ''}`;
  if (race.hud.textContent !== txt) race.hud.textContent = txt;
}
/** Each tick at sea (sailing.js, after she's drawn where the helm has her, and the cliff's crane). */
export function raceTick(dt) {
  const W = race.W;
  if (!W) return;
  for (const tex of W.winds) tex.offset.y -= dt * 2.2;   // (as the trade winds' lanes race: sailing.js)
  for (const o of W.pools) o.rotation.z += dt * o.userData.speed;
  const h = sail.helm, R = race.rules, p = h.now();
  if (sail.on) {
    // The starter's hail, the first time she's by the buoy a voyage.
    if (atStart(h.pose.c, h.pose.r) && !race.said.hail && !cine && R.state === 'off') { race.said.hail = true; toast(STARTER.hail); }
    // (what holds her, for the rivals' guns: holed and patching, or carried out of reach)
    const held = h.dazed() ? 'dazed' : race.trip || h.gusts.length || doorCarried() ? 'carried' : null;
    for (const e of R.tick(dt, { c: h.pose.c, r: h.pose.r, d: h.pose.d, held })) {
      if (e.kind === 'count') toast(STARTER.count[RACE.COUNT - e.n] ?? '');
      if (e.kind === 'go') {
        toast(STARTER.go);
        burst(V3(seaX(RC.BUOY[0]), 2.5, seaZ(RC.BUOY[1])), '#cfc6b8', 16, 2);
        sail.guns.stock(FIELD.SHOTS);   // (every racer starts with her shots loaded: one a side)
      }
      if (e.kind === 'quit') toast(STARTER.quit);
      if (e.kind === 'swept') toast(STARTER.swept[e.snake], true);
      if (e.kind === 'shot') {
        fieldShot(e);
        if (e.hit === 0 && doorHolds()) doorKey('escape');   // (holed at the rock: she's knocked off its board)
      }
      if (e.kind === 'home') {
        fieldHome(e);
        toast(say(STARTER.home.replace('{name}', R.field.racers[e.racer].name), e.secs, e.place));
        if (R.state === 'done') placings(rows(R), R.field.state === 'done');
      }
      if (e.kind === 'finish') {
        race.doneT = 8;
        crossed(clockText(e.secs), e.place, rows(R));
        toast(say(e.won ? STARTER.won : STARTER.lost, e.secs, e.place));
        if (e.best) { keepBest(e.secs); toast(say(STARTER.best, e.secs)); }
      }
    }
    if (R.state === 'done' && atStart(h.pose.c, h.pose.r) && race.doneT <= 0 && !race.said.again) { race.said.again = true; toast(STARTER.again); }
    if (R.state !== 'done') race.said.again = false;
    // [A] the gun gap's guns fire on her marks (and on her, once it's a fight); a hit holes her.
    for (const e of race.gap.tick(dt, h.spared() ? null : p, h.pose)) {
      const V = W.guns[e.gun], where = V3(seaX(e.to[0]), 0, seaZ(e.to[1]));
      if (e.kind === 'fire') { turretFire(V, e, where); continue; }
      turretLand(V, e);
      if (!e.hit) continue;
      h.hit(deckHoleShape());
      toast(e.aimed ? 'Hit! She\'s holed: patch her to sail on' : 'Hit! That gun had her on its mark: patch her to sail on', true);
    }
    // [B] idle in the headwind gap, she's blown back out of it.
    const back = race.drift.tick(dt, h);
    forageTick(dt);
    if (back) { h.gust([back]); if (!race.said.drift) { race.said.drift = true; toast('The wind\'s blowing her back out of the gap'); } }
  }
  race.doneT -= dt;
  // The guns' marks flare under a shot; each gun as its turret's rules say, turned on her when she's near.
  const t = performance.now() / 1000, [gc, gr] = RC.GUNS.gap, near = sail.on && Math.max(Math.abs(p.c - gc), Math.abs(p.r - gr)) <= RACE.SIGHT + 1;
  for (const ring of W.rings) ring.m.opacity = shotComing(ring.c, ring.r) ? 0.6 + 0.35 * Math.sin(t * 20) : 0.32 + 0.08 * Math.sin(t * 2);
  W.guns.forEach((V, i) => turretView(V, race.gap.guns[i], dt, near ? { x: seaX(p.c), z: seaZ(p.r) } : { x: seaX(gc), z: seaZ(gr) }));
  // The starlit door: its board, its stars, its leaves, her trip through (out on leg 5: the race counts it).
  doorTick(dt, () => R.under(DOOR.FROM, DOOR.TO));
  // Her trip over the neck, on the crane's hook.
  if (race.trip && sail.on) tripTick(dt);
  else if (K().built()) { const tip = W.crane.slew.localToWorld(TIP.clone()), l = W.crane.g.worldToLocal(tip); W.crane.hook.position.set(l.x, l.y - 1, l.z); }
  // The start's line and card; the buoys, the next one lit; the finish's banner.
  startTick(R, sail.on);
  marksTick(dt, sail.on && R.state === 'on' ? nextBuoy(p.c, p.r) : -1);
  // Your rivals: on their spots on the line for the count, then racing, then moored past the finish line.
  fieldTick(dt, R, sail.on);
  hud();
}

/** A fresh voyage: no race on, the guns and the crane as they were, said again. Your best is kept. */
export function raceReset() {
  race.rules = newRace();
  fieldReset();
  race.gap = new GunGap();
  race.drift = new Drift();
  race.said = {};
  if (race.trip) { race.trip = null; }
  race.crane = neckCrane();
  doorReset();
  forageReset();
  if (race.W) {
    for (const g of race.W.crane.parts) g.removeFromParent();
    race.W.crane.parts = [];
    race.W.crane.hook.visible = false;
    race.W.crane.slew.rotation.y = -Math.PI / 2;
    for (const ch of [...race.W.g.children]) if (ch.userData.frameOnNeck) race.W.g.remove(ch);
  }
}

/** The camera, the mouse: on the barrier's Foraging board (den.js, sailing.js). */
export const raceCam = forageCam, raceHover = forageHover, raceClick = forageClick;

/** A starting point (menus.js): at sea, by the race's buoy. */
export function raceCheat() {
  sail.helm.moor({ c: RC.BUOY[0] - 1, r: RC.BUOY[1], d: 0 });
  sail.riding = false;
}
