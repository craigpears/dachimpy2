// Primates Rule's test run, out of her anchorage on the den's own sea (its rules src/den-frigate-run.ts; her
// handling src/ship-handling.ts). The user (15 Nov): "park this sloop there and then take the war frig on a test
// run, even if it's just to go shoot some nearby things and destructible obstacles, or sail out into the ocean
// through some rocks." Sailing up near her in your sloop, Space leaves the sloop at anchor where she is and takes
// you aboard her: sailing.js hands this the helm's keys and clicks while you are (runKey, runClick), its prompt
// and bar (runPrompt, runHud), and the camera follows her (sail.follow). Her look is js/den/frigate.js's, sails
// set; moored.js's at anchor is put away while she's out. Drawn here: her, you at her wheel, her pin and the
// block of squares she'll lie on (her berth), her course dotted, her broadsides, and the old hulks about her
// anchorage, sunk by them. Back by your sloop, Space takes you aboard her again and Primates Rule's crew take
// her back to her anchorage.
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { TestRun, RUN, canTakeOut } from '../den-frigate-run.js';
import { drawnAt } from '../ship-handling.js';
import { PRIMATES_RULE, WAR_FRIGATE_PLAN, deckY } from '../den-frigate.js';
import { MOORED_MID } from '../den-moored.js';
import { $, scene, mat, mesh, woodTex, burst, toast, tween, pirate, animateWalk, V3, keys, worldLets, shake } from './world.js';
import { sail, seaX, seaZ, pinMesh, dotGeo, dotMat, TOK } from './sea.js';
import { frigateMesh } from './frigate.js';
import { moored } from './moored.js';
import { blast, blastTick } from './blast.js';

export const run = { on: false, R: null, her: null, hulks: [], pin: null, marks: [], dots: [], flying: [], heel: 0, ease: null, sig: '', hudSig: '', said: {} };

const SIDE = { L: 'port', R: 'starboard' }, DECK = deckY(WAR_FRIGATE_PLAN, 'waist'), WHEEL = deckY(WAR_FRIGATE_PLAN, 'quarter');

// ----- built once: her with sails set, the hulks, her pin, her berth's squares, her course's dots -----
function hulkMesh() {
  const g = new THREE.Group(), wood = mat('#4b3a2c', { map: woodTex, roughness: 1 }), dark = mat('#2c241d', { roughness: 1 });
  const hull = mesh(new THREE.BoxGeometry(3.4, 1.1, 1.7), wood); hull.position.y = 0.15; g.add(hull);
  const bow = mesh(new THREE.ConeGeometry(0.85, 1.3, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4), wood); bow.scale.set(1, 0.65, 1); bow.position.set(2.3, 0.15, 0); g.add(bow);
  const stump = mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.2, 6), dark); stump.position.set(0.2, 1.6, 0); stump.rotation.z = 0.25; g.add(stump);
  const rag = mesh(new THREE.PlaneGeometry(0.9, 0.6), mat('#b8a98a', { side: THREE.DoubleSide, roughness: 1 })); rag.position.set(0.55, 2.3, 0); rag.rotation.y = 0.4; g.add(rag);
  for (const x of [-1.2, 0.9]) { const hole = mesh(new THREE.CircleGeometry(0.22, 8), dark); hole.position.set(x, 0.3, 0.86); g.add(hole); }
  g.rotation.set(0.05, Math.random() * Math.PI, 0.12);
  return g;
}
function build() {
  run.her = frigateMesh(PRIMATES_RULE);
  scene.add(run.her.g);
  run.hulks = RUN.HULKS.map(([c, r]) => { const g = hulkMesh(); g.position.set(seaX(c), 0, seaZ(r)); g.userData = { y0: 0, ph: c * 1.3 + r }; scene.add(g); return g; });
  run.pin = pinMesh();
  const sq = new THREE.PlaneGeometry(SAIL.CELL * 0.92, SAIL.CELL * 0.92).rotateX(-Math.PI / 2);
  const gold = new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.2, depthWrite: false, fog: false });
  run.marks = Array.from({ length: RUN.SHIP.long * RUN.SHIP.wide }, () => { const m = new THREE.Mesh(sq, gold); m.renderOrder = 3; m.visible = false; scene.add(m); return m; });
  run.dots = Array.from({ length: 20 }, () => { const m = new THREE.Mesh(dotGeo, dotMat); m.renderOrder = 3; m.visible = false; scene.add(m); return m; });
}
const showAll = (on) => {
  run.her.g.visible = on;
  run.hulks.forEach((g, i) => { g.visible = on && !run.R?.hulks[i].sunk(); });
  if (!on) { run.pin.visible = false; [...run.marks, ...run.dots].forEach((m) => { m.visible = false; }); }
};

/** In your sloop by her, nothing else having the helm (`free`, sailing.js's say). */
export const canTakeHer = (free) => sail.on && !run.on && canTakeOut(sail.helm.pose, free && sail.helm.slot < 0 && !sail.helm.pin && !sail.helm.cur);
export const takePrompt = () => 'Off Primates Rule, at anchor · Space: leave your sloop here and take her out for a test run';

/** Aboard her: your sloop left at anchor where she is. */
export function takeHer() {
  if (!run.her) build();
  run.R = new TestRun(sail.sea, sail.helm.pose);
  run.on = true; run.said = {}; run.sig = ''; run.hudSig = '';
  showAll(true);
  if (moored.W) moored.W.her.g.visible = false;
  // (drawn from where she lay at anchor, easing onto her squares as she weighs anchor)
  const m = drawnAt(RUN.SHIP, run.R.helm.now());
  run.ease = { c: MOORED_MID.c - m.c, r: MOORED_MID.r - m.r, t: 1 };
  sail.follow = run.her.g;
  keys.clear();
  toast('Aboard Primates Rule! Your sloop\'s at anchor here. Click the sea, or W A D; Q E fire her broadsides');
}
/** Its starting point, ?at=primates (menus.js): your sloop moored two squares in toward the den of her, and
    you aboard her. */
export function primatesCheat() {
  if (run.on) return;
  sail.helm.moor({ ...RUN.CHEAT });
  sail.riding = false;
  takeHer();
}
/** Back aboard your sloop: Primates Rule's crew take her back to her anchorage. */
export function leaveHer() {
  run.on = false;
  showAll(false);
  for (const f of run.flying) scene.remove(f.m);
  run.flying = [];
  if (moored.W) moored.W.her.g.visible = true;
  sail.follow = null;
  sail.hudSig = '';
  keys.clear();
  toast('Back aboard your sloop: Primates Rule\'s crew take her back to her anchorage');
}

// ----- her broadsides -----
const ballGeo = new THREE.SphereGeometry(0.24, 10, 8), ballM = mat('#1b1a1c', { metalness: 0.5, roughness: 0.4 });
function fire(side) {
  const got = run.R.fire(side);
  if (!got) return toast(`Her ${SIDE[side]} guns are still loading`, true);
  worldLets.shake = Math.max(shake, 0.25);
  got.shots.forEach((shot, i) => {
    const end = shot.hit ?? shot.cells[shot.cells.length - 1], a = V3(seaX(shot.from[0]), DECK + 0.6, seaZ(shot.from[1]));
    const b = V3(seaX(end[0]), shot.what === 'rock' ? 1.2 : shot.what === 'hulk' ? 0.9 : 0.05, seaZ(end[1]));
    if (shot.what === 'sloop') b.lerp(a, 0.3).setY(0.05);   // (short of your own sloop)
    burst(a, '#ffcf6a', 10, 3); burst(a, '#cfc6b8', 8, 1.5);
    const m = mesh(ballGeo, ballM); m.visible = false; scene.add(m);
    run.flying.push({ m, a, b, t: -i * 0.12, dur: 0.12 * shot.cells.length + 0.2, shot });
  });
  const hulk = got.shots.find((s) => s.got);
  if (hulk?.got === 'sunk') toast(run.R.afloat() ? `Sunk! ${run.R.afloat()} old hulk${run.R.afloat() > 1 ? 's' : ''} left afloat` : 'Sunk! That\'s every old hulk: they\'ll be out again the next time you take her out');
  else if (hulk) toast('A hit! One more broadside to sink her');
  else if (got.shots.some((s) => s.what === 'sloop')) toast('Steady! That\'s your own sloop', true);
}
function land(f) {
  const { shot, b } = f;
  if (!shot.hit || shot.what === 'sloop') { burst(b, '#e6f3f6', 18, 3.5); burst(b, '#9cc8d4', 10, 2.5); return; }
  burst(b, '#ffb85a', 14, 4); burst(b, '#6b5c50', 18, 4);
  worldLets.shake = Math.max(shake, 0.3);
  if (shot.got !== 'sunk') return;
  const g = run.hulks[shot.hulk];
  blast(g.position.clone().setY(0.8), 1.2);
  tween(2.2, (u) => { g.position.y = -2.2 * u * u; g.rotation.z = 0.12 + u * 0.7; }, () => { g.visible = false; g.position.y = 0; g.rotation.z = 0.12; });
}

/** The helm's keys while you're aboard her (true if it was one of hers; the rest, the camera's, go on). */
export function runKey(key) {
  if (!run.on) return false;
  const R = run.R, m = { w: 'F', arrowup: 'F', a: 'L', arrowleft: 'L', d: 'R', arrowright: 'R' }[key];
  if (m) { if (!R.put(m)) toast('That\'s a turn\'s worth put in already: she takes three', true); return true; }
  if (key === 'q' || key === 'e') { fire(key === 'q' ? 'L' : 'R'); return true; }
  if (key === 's' || key === 'arrowdown' || key === 'backspace') { R.helm.unput(); return true; }
  if (key === 'x' || key === 'escape') { R.helm.stop(); toast('Pin pulled up: she\'ll stop when this turn\'s done'); return true; }
  if (key === 'h') { if (R.backToSloop()) toast('Heading back to your sloop'); else toast('She can\'t find a way back to your sloop from here', true); return true; }
  if (key === ' ' || key === 'enter') {
    if (R.bySloop()) leaveHer(); else toast('Sail her back by your sloop to go aboard her again · H heads back', true);
    return true;
  }
  if (key === '1' || key === '2' || key === '3') { toast('On a test run her crew see to her sails, guns and sweeps', true); return true; }
  return false;
}
/** A click on the sea (its square, fractional): her pin. */
export function runClick(at) {
  if (!run.R.drop(at.c, at.r)) toast('She\'s there already', true);
}
export const runOpen = (c, r) => run.R.sea.open(c, r);
export function runPrompt() {
  const R = run.R, h = R.helm;
  if (R.bySloop()) return h.slot < 0 ? 'Primates Rule, by your sloop · Space: back aboard her · click the sea to sail on' : 'Primates Rule, under way by your sloop · Space: back aboard her';
  if (h.pin) return 'Primates Rule under way to the pin: she\'ll lie on the gold squares';
  return 'Primates Rule on a test run · click the sea to drop a pin, or W A D · Q E: her broadsides · H: back to your sloop';
}

/** Her bar along the foot of the screen: this turn's moves and the next (three), her guns loading. */
export function runHud() {
  const R = run.R, h = R.helm, now = h.slot >= 0 ? h.turn : [], next = h.next(), mineN = h.mine.length, lit = h.lit();
  const load = (s) => Math.round((1 - R.guns.wait[s] / R.guns.reload) * 20);
  const sig = `${now.join('')}|${lit}|${h.slot}|${next.join('')}|${mineN}|${load('L')}|${load('R')}|${R.bySloop()}`;
  if (sig === run.hudSig) return;
  run.hudSig = sig;
  const n = RUN.SHIP.tokens, toks = (list, cls) => Array.from({ length: n }, (_, i) => (list[i] ? `<b class="tok ${cls(i)}">${TOK[list[i]]}</b>` : '<b class="tok empty"></b>')).join('');
  const gun = (s, k) => `<div class="gun${R.guns.ready(s) ? ' ready' : ''}" id="run-${s}" title="${SIDE[s]} broadside (${k})"><kbd>${k}</kbd>${s === 'L' ? 'Port' : 'Starboard'}<i style="width:${load(s) * 5}%"></i></div>`;
  $('sailhud').innerHTML = `<div class="turns">${gun('L', 'Q')}<div class="turn"><span>This turn</span>${toks(now, (i) => (i < h.slot ? 'done' : i === lit ? 'now' : ''))}</div>`
    + `<div class="turn"><span>Next</span>${toks(next, (i) => (i < mineN ? 'mine' : ''))}</div>${gun('R', 'E')}`
    + `<button class="oars" id="run-back" title="${R.bySloop() ? 'Back aboard your sloop (Space)' : 'Head back to your sloop (H)'}"><kbd>${R.bySloop() ? 'Space' : 'H'}</kbd>${R.bySloop() ? 'Your sloop' : 'Head back'}</button></div>`
    + '<div class="help">Primates Rule · click the sea: drop a pin · <kbd>W</kbd> <kbd>A</kbd> <kbd>D</kbd>: forward, left, right · <kbd>S</kbd>: take one back · <kbd>Q</kbd> <kbd>E</kbd>: fire port, starboard · <kbd>Esc</kbd>: pull up the pin · <kbd>H</kbd>: back to your sloop · wheel: zoom</div>';
}
$('sailhud').addEventListener('mousedown', (e) => {
  if (!run.on || e.button !== 0) return;
  const b = e.target.closest('#run-L, #run-R, #run-back');
  if (!b) return;
  e.preventDefault();
  if (b.id === 'run-back') runKey(run.R.bySloop() ? ' ' : 'h'); else fire(b.id === 'run-L' ? 'L' : 'R');
});

/** Each tick at sea, while you're aboard her (sailing.js): her helm, her drawn, you at her wheel, the shots,
    the hulks, her pin and berth and course. */
export function runTick(dt) {
  if (!run.on) return;
  blastTick();
  if (moored.W?.her.g.visible) moored.W.her.g.visible = false;   // (at anchor, put away while she's out: built late, at ?at=primates)
  const R = run.R, h = R.helm, t = performance.now() / 1000;
  for (const e of R.tick(dt)) {
    if (e.kind === 'move' && e.bump) { worldLets.shake = Math.max(shake, 0.2); if (!run.said.bump) { run.said.bump = true; toast('Bump! She needs room: four squares long, two across', true); } }
    if (e.kind === 'arrive' && R.bySloop()) toast('By your sloop: Space to go back aboard her');
    if (e.kind === 'arrive' && R.outPastReef() && !run.said.out) { run.said.out = true; toast('Out through the reef\'s gap, onto the open sea: just wide enough for her'); }
  }
  // Her, riding the swell, heeling a little into her turns (a big ship: less than the sloop).
  const turning = h.cur && (h.cur.m === 'L' || h.cur.m === 'R') && !h.cur.bump && h.t < h.cur.secs;
  run.heel += ((turning ? (h.cur.m === 'L' ? -0.05 : 0.05) : 0) - run.heel) * Math.min(1, dt * 2);
  const m = drawnAt(RUN.SHIP, h.now()), E = run.ease;
  if (E && (E.t -= dt / 2) <= 0) run.ease = null;
  const k = run.ease ? run.ease.t * run.ease.t : 0, g = run.her.g;
  g.position.set(seaX(m.c + (E ? E.c * k : 0)), Math.sin(t * 0.7) * 0.05, seaZ(m.r + (E ? E.r * k : 0)));
  g.rotation.set(run.heel + Math.sin(t * 0.6) * 0.01, Math.PI / 2 - m.a * Math.PI / 2, Math.sin(t * 0.5) * 0.008, 'YXZ');
  run.her.tick(dt);
  // You, at her wheel on her quarterdeck, facing her bow.
  g.updateMatrixWorld(true);
  const at = g.localToWorld(V3(-WAR_FRIGATE_PLAN.hull.len / 2 + 2.4, WHEEL, 0)), yaw = g.rotation.y;
  pirate.x = at.x; pirate.z = at.z;
  pirate.g.position.copy(at);
  pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
  animateWalk(pirate, false, dt);
  pirate.g.position.y = at.y;
  // The hulks, riding low.
  run.hulks.forEach((hg, i) => { if (!R.hulks[i].sunk()) hg.position.y = Math.sin(t * 0.8 + hg.userData.ph) * 0.06 - 0.2; });
  // Shots in flight.
  for (let i = run.flying.length - 1; i >= 0; i--) {
    const f = run.flying[i];
    if ((f.t += dt) < 0) continue;
    const u = Math.min(1, f.t / f.dur);
    f.m.visible = true;
    f.m.position.lerpVectors(f.a, f.b, u);
    f.m.position.y += Math.sin(u * Math.PI) * (0.8 + f.a.distanceTo(f.b) * 0.06);
    if (u >= 1) { scene.remove(f.m); run.flying.splice(i, 1); land(f); }
  }
  // Her pin, the block of squares she'll lie on there, and her course to it dotted, her middle's way.
  run.pin.visible = !!h.pin;
  if (h.pin) run.pin.position.set(seaX(h.pin[0]), Math.sin(t * 1.3) * 0.08, seaZ(h.pin[1]));
  const sig = `${JSON.stringify(h.after())}${h.slot}${h.course().join('')}${h.mine.length}${h.pin}`;
  if (sig !== run.sig) {
    run.sig = sig;
    const block = h.berthSquares();
    run.marks.forEach((q, i) => { q.visible = i < block.length; if (q.visible) q.position.set(seaX(block[i][0]), 0.08, seaZ(block[i][1])); });
    const route = h.route().slice(0, run.dots.length);
    run.dots.forEach((d, i) => {
      d.visible = i < route.length && i > 0;
      if (d.visible) { const p = drawnAt(RUN.SHIP, { c: route[i].c, r: route[i].r, a: route[i].d }); d.position.set(seaX(p.c), 0.09, seaZ(p.r)); }
    });
  }
}
