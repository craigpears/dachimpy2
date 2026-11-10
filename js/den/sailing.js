// Sailing the sloop: boarding and going ashore, her guns and the turret's shots, the helm's keys
// and clicks, and each tick at sea. (Split out of den.js.)
import * as THREE from 'three';
import { SAIL, LAY, Helm, Guns, Turret, broadside } from '../den-sail.js';
import { $, scene, camera, mat, mesh, animateWalk, V3, pirate, view, carry, G, keys, shake, wm, ray, burst, toast, tween, worldLets } from './world.js';
import { outside } from './land.js';
import { putBack, exitWall } from './pieces.js';
import { sword } from './sword.js';
import { shoreZ, bilge, groundPlane } from './bilge.js';
import { chart, cine } from './map.js';
import { SEA_X0, seaX, seaZ, SLOOP_DECK, sail, LIFT, liftAt, sloopMesh, seaRocks, seaWorld, turretLook, turretFall, floatChestMesh, pinMesh, dotMat, dotMine, dotGeo, hoverMat, TOK } from './sea.js';
import { hold, holdShut, holdKey, holdHover, holdSwap, holdTick, patch, deckHoleShape, patchClear, patchShut, patchPlace, patchHover, patchTick } from './sea-puzzles.js';
import { online } from './crew.js';
import { deco, decoMode } from './menus.js';
import { sailView, patchView, setPaused, denLets } from '../den.js';

// The old sloop's at anchor in the cove from the moment the siege is over, while their ship makes
// sail in the background (the user, 9 Nov: "I'm sat here quite a while waiting for his sloop to sail
// off ... That should be a background feature as soon as he's rowed back").
const sloopHome = () => G.phase === 'peace' && !online();
const atHome = () => { const p = sail.helm.pose, H = SAIL.HOME; return p.c === H.c && p.r === H.r; };
export const nearSloop = () => !sail.on && sail.g?.visible && atHome() && sail.helm.slot < 0 && outside() && !carry && !cine
  && Math.abs(pirate.x - seaX(SAIL.HOME.c)) < 2.6 && pirate.z < shoreZ() + 2.4;
// Aboard: whatever you had in hand back on its crate, and the camera out over the sea.
export function board() {
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  sword.on = false; bilge.on = false; chart.on = false;
  if (carry) { if (carry.from && !carry.from.letter) putBack(); else { scene.remove(carry.group); worldLets.carry = null; } }
  keys.clear();
  sail.on = true;
  pirate.h = pirate.hs = 0; pirate.hop = null;
  document.body.classList.add('sailing');
  $('intro').classList.add('off');
  toast('Aboard! Click the sea to drop a pin, and she\'ll sail there');
}
// Ashore, at her mooring: you hop down onto the beach by her.
export function ashore() {
  sail.on = false;
  sail.helm.stop();
  document.body.classList.remove('sailing');
  Object.assign(pirate, { x: seaX(SAIL.HOME.c) + 0.6, z: shoreZ() + 0.7, h: 0, hs: 0, hop: null });
  pirate.g.rotation.set(0, 0, 0);
  keys.clear();
}
export function sailReset() {
  if (sail.on) { sail.on = false; document.body.classList.remove('sailing'); }
  sail.helm = new Helm(sail.sea);
  sail.guns = new Guns();
  sail.turret = new Turret(LAY.TURRET);
  if (sail.world) turretLook(sail.world, false);
  sail.shots.forEach((v) => { scene.remove(v.ball, v.ring); });
  sail.shots = [];
  sail.said = {};
  holdShut();
  if (patch.on) patchShut();
  patchClear();
  denLets.sailView = 0;
}
// A hit on the turret from her guns: quietened a while or, the third, wrecked, a chest floating
// free of it (src/den-sail.ts, Turret.hit).
function turretHit(at) {
  const t = sail.turret, what = t.hit(sail.sea), left = SAIL.WRECK - t.hits;
  if (what === 'quiet') return toast(`A hit on the turret! That's quietened it for a while (${left} more to wreck it)`);
  if (!what) return toast('A hit on the wreck!');
  // Its moment: a blast of fire, smoke and stone, and the tower comes down (see turretFall).
  const W = sail.world, tw = W.turret.position;
  burst(V3(tw.x, 3.4, tw.z), '#ffb85a', 36, 6); burst(V3(tw.x, 3, tw.z), '#ff7a2a', 20, 4.5); burst(V3(tw.x, 2.5, tw.z), '#3f3a37', 30, 4);
  burst(V3(tw.x, 2, tw.z), '#8a8178', 24, 5.5); burst(at, '#e6f3f6', 16, 4);
  W.fall = 0;
  worldLets.shake = Math.max(shake, 0.6);
  toast('The turret\'s wrecked! And a chest has floated free of it');
}
// A shot out of her side, from where she is right now: it flies straight out and comes down in the
// sea, or on the first rock in its way (src/den-sail.ts, broadside). Then that gun loads again.
const SIDE_NAME = { L: 'port', R: 'starboard' };
function sailFire(side) {
  if (!sail.guns.fire(side)) return toast(`The ${SIDE_NAME[side]} gun's still loading`, true);
  const { cells, hit } = broadside(sail.sea, sail.helm.now(), side), gun = sail.g.userData.guns[side];
  sail.g.updateMatrixWorld(true);
  const from = gun.localToWorld(V3(0, 0.3, -0.85)), end = cells[cells.length - 1];
  const to = V3(seaX(end[0]), hit ? 1 : 0.05, seaZ(end[1]));
  burst(from, '#ffcf6a', 12, 3);
  burst(from, '#cfc6b8', 8, 1.5);
  worldLets.shake = Math.max(shake, 0.15);
  const ball = mesh(new THREE.SphereGeometry(0.13, 10, 8), mat('#3a3f45', { metalness: 0.6 }));
  scene.add(ball);
  const d = from.distanceTo(to);
  tween(0.35 + d * 0.03, (u) => {
    ball.position.lerpVectors(from, to, u);
    ball.position.y += Math.sin(u * Math.PI) * (0.8 + d * 0.08);
  }, () => {
    scene.remove(ball);
    if (!hit) { burst(to, '#e6f3f6', 18, 3.5); burst(to, '#9cc8d4', 10, 2.5); return; }
    burst(to, '#ffb85a', 14, 4);
    burst(to, '#6b5c50', 18, 4);
    burst(to, '#e6f3f6', 8, 2.5);
    worldLets.shake = Math.max(shake, 0.2);
    // The stacks there shudder with the hit.
    for (const r of sail.rockAt.get(`${hit[0]},${hit[1]}`) ?? []) {
      const x0 = r.position.x, z0 = r.position.z;
      tween(0.4, (u) => { const k = Math.sin(u * Math.PI * 6) * 0.12 * (1 - u); r.position.x = x0 + k; r.position.z = z0 - k; }, () => { r.position.x = x0; r.position.z = z0; });
    }
    if (hit[0] === LAY.TURRET[0] && hit[1] === LAY.TURRET[1]) turretHit(to);
    else toast('A hit on the rocks!');
  });
}
// The square of the board under the pointer (fractional: the middle of a square is whole).
function seaCellAt(x, y) {
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(groundPlane, p)) return null;
  return { c: (p.x - SEA_X0) / SAIL.CELL - 0.5, r: (SAIL.Z0 - p.z) / SAIL.CELL - 0.5 };
}
export function sailClick(x, y) {
  if (patch.on) { patch.keyAt = null; patchHover(x, y); if (patch.hand) patchPlace(); return; }
  if (hold.mode) { holdHover(x, y); holdSwap(); return; }
  const at = seaCellAt(x, y);
  if (!at) return;
  if (!sail.helm.drop(at.c, at.r)) toast('She\'s there already', true);
  else if (sail.helm.via) toast('She\'ll ride the trade winds: the pin\'s where they drop her off');
}
export function sailHover(x, y) {
  if (patch.on) { patchHover(x, y); sail.hover = null; return; }
  if (hold.mode) { holdHover(x, y); sail.hover = null; return; }
  const at = seaCellAt(x, y);
  sail.hover = at && sail.sea.open(Math.round(at.c), Math.round(at.r)) ? [Math.round(at.c), Math.round(at.r)] : null;
}
export function sailKey(key) {
  if (hold.mode && holdKey(key)) return;
  const m = { w: 'F', arrowup: 'F', a: 'L', arrowleft: 'L', d: 'R', arrowright: 'R' }[key];
  if (m) { if (!sail.helm.put(m)) toast('That\'s a turn\'s worth put in already', true); return; }
  if (key === 'q' || key === 'e') return sailFire(key === 'q' ? 'L' : 'R');
  if (key === 's' || key === 'arrowdown' || key === 'backspace') sail.helm.unput();
  else if (key === 'escape') { sail.helm.stop(); toast('Pin pulled up: she\'ll stop when this turn\'s done'); }
  else if (key === 'h') { sail.helm.drop(SAIL.HOME.c, SAIL.HOME.r); if (sail.helm.pin) toast('Heading home to the cove'); }
  else if ((key === ' ' || key === 'enter') && atHome() && sail.helm.slot < 0) ashore();
  else if (key === 'z' || key === 'c') keys.add(key);
  else if (key === 'p') setPaused(true);
  else if (key === 'v') Object.assign(view, { yaw: 0, pitch: 0, zoom: 1 });
  else if (key === '-' || key === '_') view.zoom = Math.min(2, view.zoom * 1.15);
  else if (key === '=' || key === '+') view.zoom = Math.max(0.55, view.zoom / 1.15);
}
export function sailPrompt() {
  if (nearSloop()) return 'Space: board the old sloop';
  if (!sail.on) return '';
  const h = sail.helm, held = h.held();
  if (held === 'daze') {
    const hd = patch.hand, f = hd && patch.hole?.fit(hd.cells, patch.r, patch.c);
    const tips = ' · arrows or mouse move · X/C turn · Z flip · Q/W/A/S: its corners · Backspace: the last piece back out';
    if (!hd) return 'Holed! Patch her deck to sail on · 1, 2, 3: a piece from the crate' + tips;
    return (f ? `Space or click: fit the ${hd.letter}${f.over ? ' (it rests on the deck: boarded over)' : ''}` : `The ${hd.letter} won't go there`) + tips;
  }
  if (held === 'up') return 'In the lock · bilge on the quay to pump it up, and the top gates open: arrows or mouse move · Space or click swaps';
  if (held === 'down') return 'The lock\'s draining down to the sea';
  if (held === 'gates') return 'The lock gates are swinging open';
  if (atHome() && h.slot < 0 && !h.next().length) return 'At her mooring · Space: go ashore · click the sea to drop a pin';
  if (h.pin) return 'Under way to the pin';
  if (h.slot >= 0) return 'Under way';
  return 'Click the sea to drop a pin, or put in moves with W A D · Q E: fire';
}
// This turn's tokens (the one being sailed lit) and the next turn's, yours in gold.
function sailHud() {
  const h = sail.helm, mineN = h.mine.length;
  const now = h.slot >= 0 ? h.turn : [], next = h.next();
  const load = (side) => Math.round(sail.guns.loaded(side) * 20);
  const sig = `${now.join('')}|${h.slot}|${next.join('')}|${mineN}|${load('L')}|${load('R')}`;
  if (sig === sail.hudSig) return;
  sail.hudSig = sig;
  const toks = (list, cls) => Array.from({ length: SAIL.SLOTS }, (_, i) => (list[i] ? `<b class="tok ${cls(i)}">${TOK[list[i]]}</b>` : '<b class="tok empty"></b>')).join('');
  // Her guns either side of the tokens, port on the left: lit when loaded, filling as they load.
  const gun = (side, k) => `<div class="gun${sail.guns.ready(side) ? ' ready' : ''}"><kbd>${k}</kbd>${side === 'L' ? 'Port' : 'Starboard'}<i style="width:${load(side) * 5}%"></i></div>`;
  $('sailhud').innerHTML = `<div class="turns">${gun('L', 'Q')}<div class="turn"><span>This turn</span>${toks(now, (i) => (i < h.slot ? 'done' : i === h.slot ? 'now' : ''))}</div>`
    + `<div class="turn"><span>Next</span>${toks(next, (i) => (i < mineN ? 'mine' : ''))}</div>${gun('R', 'E')}</div>`
    + '<div class="help">Click the sea: drop a pin · <kbd>W</kbd> <kbd>A</kbd> <kbd>D</kbd>: forward, left, right yourself · <kbd>S</kbd>: take one back · <kbd>Q</kbd> <kbd>E</kbd>: fire port, starboard · <kbd>Esc</kbd>: pull up the pin · <kbd>H</kbd>: head home · wheel: zoom</div>';
}
// The turret's shots in the air: the ball on its arc, and a red ring on the water where it'll land,
// so you can see it coming and get out from under it.
const ringGeo = new THREE.RingGeometry(1.5, 1.9, 32).rotateX(-Math.PI / 2);   // (wide enough to show round her hull)
function turretFire(to) {
  const W = sail.world;
  W.turret.updateMatrixWorld(true);
  const from = W.gun.localToWorld(V3(0, 0.3, -0.85));
  burst(from, '#ffcf6a', 14, 3); burst(from, '#cfc6b8', 10, 1.8);
  const ball = mesh(new THREE.SphereGeometry(0.24, 10, 8), mat('#2a2d31', { metalness: 0.6 }));
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#e0412e', transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
  ring.position.set(seaX(to[0]), 0.1 + liftAt(...to), seaZ(to[1]));
  ring.renderOrder = 3;
  scene.add(ball, ring);
  sail.shots.push({ to, t: 0, from, ball, ring });
}
function turretLand(to, hit) {
  const i = sail.shots.findIndex((v) => v.to[0] === to[0] && v.to[1] === to[1]);
  const v = i >= 0 ? sail.shots.splice(i, 1)[0] : null;
  if (v) scene.remove(v.ball, v.ring);
  const at = V3(seaX(to[0]), 0.3 + liftAt(...to), seaZ(to[1]));
  if (!hit) { burst(at, '#e6f3f6', 20, 4); burst(at, '#9cc8d4', 10, 2.5); return; }
  sail.helm.hit(deckHoleShape());
  burst(at.setY(at.y + 0.8), '#ffb85a', 18, 4); burst(at, '#5a4630', 16, 3.5); burst(at, '#e6f3f6', 10, 3);
  worldLets.shake = Math.max(shake, 0.45);
  toast('Hit! She\'s holed: patch her to sail on', true);
}
export function sailTick(dt) {
  sail.rocks ||= seaRocks();
  sail.world ||= seaWorld();
  sail.g ||= (() => { const g = sloopMesh(); scene.add(g); return g; })();
  const show = sail.on || sloopHome();
  if (sail.g.visible !== show) sail.g.visible = show;
  if (show && !sail.seen && !sail.on && G.phase === 'peace' && !cine && !chart.on) { sail.seen = true; toast('Their ship\'s making sail, and there\'s an old sloop left at anchor in the cove: walk down to her'); }
  if (!show) return;
  const h = sail.helm, W = sail.world;
  // The trade winds race along their lanes.
  for (const tex of W.lanes) tex.offset.y -= dt * 2.2;
  if (sail.on) {
    const heldWas = h.held();
    for (const e of h.tick(dt)) {
      if (e.kind === 'move' && e.bump) sail.bumpT = SAIL.MOVE * 0.45;   // (felt as she hits)
      if (e.kind === 'arrive' && atHome()) toast('Back at her mooring: Space to go ashore');
      if (e.kind === 'push') {
        if (!sail.riding) { sail.riding = true; if (!sail.said.wind) { sail.said.wind = true; toast('The trade winds have her!'); } }
        burst(V3(seaX(e.from.c), 0.3 + liftAt(e.from.c, e.from.r), seaZ(e.from.r)), '#e6f3f6', 5, 2);
      }
      if (e.kind === 'move') sail.riding = false;
    }
    if (sail.riding && !(h.cur && h.cur.m === 'W')) {
      sail.riding = false;
      const [jc, jr] = LAY.JUNCTION;
      if (h.pose.c === jc && h.pose.r === jr && !sail.said.junction) { sail.said.junction = true; toast('The junction: right rides the winds round and home, left\'s the canal to the lock, on is open sea'); }
    }
    const held = h.held();
    if (held === 'up' && heldWas !== 'up' && !sail.said.lock) { sail.said.lock = true; toast('The lock: bilge on the quay to pump it up to the cove'); }
    if (held === 'gates' && heldWas === 'up') toast('The lock\'s full: the top gates open');
    if (sail.sea.level(h.pose.c, h.pose.r) === 1 && !sail.said.cove) { sail.said.cove = true; toast('The hidden cove, up behind the cliff: an old bilge pump on the sand'); }
    // The turret shoots at her when she's in reach (not while she's dazed, or in the lock).
    for (const e of sail.turret.tick(dt, h.spared() ? null : h.now())) {
      if (e.kind === 'fire') turretFire(e.to);
      else turretLand(e.to, e.hit);
    }
    if (sail.bumpT > 0 && (sail.bumpT -= dt) <= 0) { worldLets.shake = 0.3; toast('Bump! Rocks', true); }
    sail.guns.tick(dt);
  }
  holdTick(dt);
  patchTick(dt);
  // The turret's shots on their way; its gun turned on her; smoking while it's quiet.
  for (const v of sail.shots) {
    v.t += dt;
    const u = Math.min(1, v.t / SAIL.FLIGHT), to = V3(seaX(v.to[0]), 0.3 + liftAt(...v.to), seaZ(v.to[1]));
    v.ball.position.lerpVectors(v.from, to, u);
    v.ball.position.y += Math.sin(u * Math.PI) * 4;
    v.ring.material.opacity = 0.5 + 0.4 * Math.sin(v.t * 14);
  }
  {
    const p = h.now(), tw = W.turret.position, dx = seaX(p.c) - tw.x, dz = seaZ(p.r) - tw.z;
    if (sail.on) W.gun.rotation.y += (Math.atan2(-dx, -dz) - W.gun.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI > 0 ? Math.min(dt * 2, ((Math.atan2(-dx, -dz) - W.gun.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) : Math.max(-dt * 2, ((Math.atan2(-dx, -dz) - W.gun.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (W.fall !== undefined) turretFall(W, dt);
    else if (sail.turret.wrecked !== W.wrecked) turretLook(W, sail.turret.wrecked);
    if (sail.turret.wrecked) { if ((W.smokeT = (W.smokeT ?? 0) - dt) < 0) { W.smokeT = 0.14; burst(V3(tw.x + 0.2, 2.8, tw.z), '#3f3a37', 4, 0.9); } }
    else if (sail.turret.quiet > 0 && (W.smokeT = (W.smokeT ?? 0) - dt) < 0) { W.smokeT = 0.25; burst(V3(tw.x, 3.8, tw.z), '#6f6a66', 2, 0.6); }
    // The wreck's chest, bobbing on the water till she hauls it aboard.
    const ch = sail.turret.chest;
    if (ch) sail.chestG ||= floatChestMesh();
    if (sail.chestG) {
      sail.chestG.visible = !!ch;
      if (ch) { const tt = performance.now() / 1000; sail.chestG.position.set(seaX(ch[0]), 0.05 + Math.sin(tt * 1.6) * 0.1, seaZ(ch[1])); sail.chestG.rotation.set(Math.sin(tt * 1.1) * 0.08, 0.4 + Math.sin(tt * 0.5) * 0.2, Math.sin(tt * 1.3) * 0.08); }
    }
  }
  // The quay pump: its handle down and up again with each stroke, and water gushing from its spout
  // into the lock while it's rising.
  {
    const P = W.pump, s = P.userData.stroke ?? 0;
    P.userData.stroke = Math.max(0, s - dt * 2.5);
    P.userData.arm.rotation.z = 0.35 - 0.75 * Math.sin(Math.PI * (1 - P.userData.stroke)) * (P.userData.stroke > 0 ? 1 : 0);
    const rising = sail.on && h.fill > h.level + 1e-4;
    W.gush.visible = rising;
    if (rising) {
      P.updateMatrixWorld(true);
      const m = P.localToWorld(P.userData.mouth.clone()), y1 = h.level * LIFT + 0.05;
      W.gush.scale.set(1, Math.max(0.1, m.y - y1), 1);
      W.gush.position.set(m.x, (m.y + y1) / 2, m.z - 0.08);
      if ((W.gushT = (W.gushT ?? 0) - dt) < 0) { W.gushT = 0.12; burst(V3(m.x, y1 + 0.05, m.z - 0.1), '#e6f3f6', 3, 1.6); burst(m, '#9fd4ec', 1, 0.8); }
    }
  }
  // The lock: its chamber's water at its level; each pair of gates open when she can pass that end.
  const lockY = h.level * LIFT;

  W.chamber.position.y = lockY + 0.05;
  W.chamber.visible = lockY > 0.02;
  for (const [end, gt] of Object.entries(W.gates)) {
    const open = end === 'sea' ? h.level < 0.01 : h.level > 0.99;
    gt.open += ((open ? 1 : 0) - gt.open) * Math.min(1, dt * 2.5);
    // (both pairs swing open towards the cove, the high side, as a lock's mitre gates do: the sea
    // pair back into the chamber, against its walls, the cove pair into the cove)
    for (const lf of gt.leaves) lf.rotation.y = gt.open * lf.userData.sz * Math.PI / 2;
  }
  // A gun that's fired kicks back in and runs out again as it's loaded, smoking at first.
  for (const side of ['L', 'R']) {
    const gun = sail.g.userData.guns[side], u = sail.guns.loaded(side);
    gun.position.z = gun.userData.z * (1 - 0.55 * (1 - u) ** 2);
    if (u < 0.6 && (gun.userData.smokeT = (gun.userData.smokeT ?? 0) - dt) < 0) {
      gun.userData.smokeT = 0.3;
      burst(gun.localToWorld(V3(0, 0.32, -0.8)), '#7d7873', 2, 0.5);
    }
  }
  // Her, riding the swell, heeling into her turns.
  const t = performance.now() / 1000, p = h.now(), turning = h.cur && (h.cur.m === 'L' || h.cur.m === 'R') && !h.cur.bump && h.t < SAIL.MOVE;
  sail.heel += ((turning ? (h.cur.m === 'L' ? -0.13 : 0.13) : 0) - sail.heel) * Math.min(1, dt * 4);
  sail.low = (sail.low ?? 0) + ((h.dazed() ? -0.3 : 0) - (sail.low ?? 0)) * Math.min(1, dt * 2);
  sail.g.position.set(seaX(p.c), liftAt(Math.round(p.c), Math.round(p.r)) + sail.low + Math.sin(t * 0.9) * 0.06, seaZ(p.r));
  sail.g.rotation.y = Math.PI / 2 - p.a * Math.PI / 2;
  sail.g.rotation.x = sail.heel + Math.sin(t * 0.7) * 0.02;
  sail.g.rotation.z = Math.sin(t * 0.55) * 0.02;
  if (sail.on) {
    // You, at the tiller, facing her bow (up on her stern, beside it, while the board's on her deck,
    // so you're not stood on it, nor between it and the camera).
    const deck = patch.on, at = sail.g.localToWorld(deck ? V3(-1.7, SLOOP_DECK + 0.35, 0.45) : V3(-1.15, SLOOP_DECK, 0)), yaw = sail.g.rotation.y;
    pirate.x = at.x; pirate.z = at.z;
    pirate.g.position.copy(at);
    pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
    animateWalk(pirate, false, dt);
    pirate.g.position.y = at.y;
    sail.stars ||= (() => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffe066' }); for (let i = 0; i < 3; i++) { const s = mesh(new THREE.OctahedronGeometry(0.12, 0), m, false); s.position.set(Math.cos(i * 2.1) * 0.4, 0, Math.sin(i * 2.1) * 0.4); g.add(s); } scene.add(g); return g; })();
    sail.stars.visible = h.dazed() && patchView < 0.5;   // (not in your face over the board)
    if (h.dazed()) { sail.stars.position.set(at.x, at.y + 2.15, at.z); sail.stars.rotation.y += dt * 4; }
  } else if (sail.stars) sail.stars.visible = false;
  // The pin, and the course to it dotted on the water.
  sail.pin ||= pinMesh();
  sail.pin.visible = sail.on && !!h.pin;
  if (h.pin) sail.pin.position.set(seaX(h.pin[0]), liftAt(...h.pin) + Math.sin(t * 1.3) * 0.08, seaZ(h.pin[1]));
  const sig = sail.on ? `${JSON.stringify(h.after())}${h.slot}${h.course().join('')}${h.mine.length}` : '';
  if (sig !== sail.sig) {
    sail.sig = sig;
    sail.dots.forEach((d) => { d.visible = false; });
    if (sail.on) {
      const pts = [];
      let q = h.cur ? (h.rides.length ? h.rides[h.rides.length - 1] : h.cur.to) : h.pose;
      if (h.slot >= 0) { pts.push([q, false]); for (let i = h.slot + 1; i < h.turn.length; i++) { q = sail.sea.sail(q, h.turn[i]).to; pts.push([q, false]); } }
      h.course().slice(0, 16).forEach((m, i) => { q = sail.sea.sail(q, m).to; pts.push([q, i < h.mine.length]); });
      pts.forEach(([at, mine], i) => {
        const d = sail.dots[i] ||= (() => { const o = new THREE.Mesh(dotGeo, dotMat); o.renderOrder = 3; scene.add(o); return o; })();
        d.material = mine ? dotMine : dotMat;
        d.position.set(seaX(at.c), 0.09 + LIFT * sail.sea.level(at.c, at.r), seaZ(at.r));
        d.visible = true;
      });
    }
  }
  // The square you're pointing at, faintly.
  sail.hoverG ||= (() => { const o = new THREE.Mesh(new THREE.PlaneGeometry(SAIL.CELL * 0.96, SAIL.CELL * 0.96).rotateX(-Math.PI / 2), hoverMat); o.renderOrder = 3; scene.add(o); return o; })();
  sail.hoverG.visible = sail.on && !!sail.hover;
  if (sail.hover) sail.hoverG.position.set(seaX(sail.hover[0]), 0.08, seaZ(sail.hover[1]));
  if (sail.on) sailHud();
}
