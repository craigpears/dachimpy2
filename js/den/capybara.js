// Umami the capybara in 3D: stuck on the clifftop lagoon's far bank, his board (Foraging) on it, her
// poled along the shore to him, his swim to her once he's free, and his life at the den's water's
// edge. (The rules: src/den-capybara.ts. The puzzle: src/foraging.ts; its look: foraging.js.)
import * as THREE from 'three';
import { Forage } from '../foraging.js';
import { UMAMI, Umami, Life, umamiDeal, freedAt } from '../den-capybara.js';
import { OF_HIM } from '../lines/capybara.js';
import { forageBoard, capybaraSkin, capybaraMesh, cageOpen } from './foraging.js';
import { scene, camera, mat, mesh, V3, burst, toast, keys, ray, canvasTex } from './world.js';
import { sail, SLOOP_DECK } from './sea.js';
import { crane, craneKey, BANK, LAGOON_AT, rigged } from './crane.js';
import { shoreZ } from './bilge.js';

/* Nothing's said about him before you find him (RULES.md, "Hidden gems, never hinted"): from where
   the crane sets her down you can see him across the water, stuck high on the far bank. The arrows
   (W, or a click on the water by him) pole her along the shore to him, S (or a click back by the
   wreck) back again; at his bank, Space frees him by Foraging, its board the bank he's stuck in. Clear
   him down off its foot and only he leaves it: he splashes into the lagoon, swims to her and clambers
   aboard. He rides home with her, and once you're ashore at the den he hops off into its shallows,
   where he lives from then on: wading, swimming and sitting in the water, as capybaras do. */
export const umami = { rules: new Umami(), on: false, board: null, bankG: null, swim: null, pet: null, life: null, then: null, boardGone: 0, said: {} };
const U = () => umami.rules;
const { WATER, REST, REST_YAW } = LAGOON_AT;
const SQ = 0.45;   // a square of his board, in metres (as Treasure Haul's)
const SIZE = 0.62;   // his size at home and swimming (the board's 0.45 x 0.92 when stuck)
const inLagoon = () => sail.on && crane.rules.where === 'lagoon' && !crane.rules.trip;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerpA = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- his bank ----------
// The board's frame on the bank: its foot at the water's edge, leaning back up the bank, facing out
// over the lagoon. A square of the board is a unit in it.
const lean = BANK.lean, up = V3(0, Math.cos(lean), -Math.sin(lean)).applyAxisAngle(V3(0, 1, 0), BANK.yaw);
const FOOT = V3(BANK.x, WATER + 0.02, BANK.z);
const MID = FOOT.clone().addScaledVector(up, 5 * SQ);   // (the board's 10 squares high)
// Her mooring by the bank: off its foot to the east, lying along the shore, bows west toward him
// (not in front of him, where her mast would hide him).
const MOORS = { wreck: { p: REST, yaw: REST_YAW }, bank: { p: V3(BANK.x + 3.5, WATER, BANK.z + 3.2), yaw: Math.PI } };
function bankFrame() {
  const g = new THREE.Group();
  g.position.copy(MID);
  g.rotation.set(-lean, BANK.yaw, 0, 'YXZ');
  g.scale.setScalar(SQ);
  return g;
}
const mudTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#5a4028'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.fillStyle = i % 3 ? 'rgba(40,26,14,0.45)' : 'rgba(140,110,70,0.4)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 2 + Math.random() * 5, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
});
// The bank: a mound of mud with roots through it, rising from the water up onto the headland, his
// board on its face (dealt as you first see it: drawn whole, pieces and all, as the den's other boards
// are, him high on it shut in an old fish trap).
function bankMake() {
  // The mound, side on: its face the slope the board lies on, from under the water up to its top,
  // then back down onto the headland behind; grass on its back.
  const L = 10 * SQ + 0.3, s = Math.sin(lean), c = Math.cos(lean), back = LAGOON_AT.HT - WATER;
  const prof = new THREE.Shape([[-0.6, -0.8], [0, 0], [L * s, L * c], [L * s + 0.9, L * c - 0.15], [L * s + 2.8, back - 0.1], [L * s + 2.8, -0.8]].map(([u, y]) => new THREE.Vector2(u, y)));
  const W2 = 7 * SQ + 1.2;
  const mound = mesh(new THREE.ExtrudeGeometry(prof, { depth: W2, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 2 }).translate(0, 0, -W2 / 2).rotateY(Math.PI / 2), mat('#ffffff', { map: mudTex, roughness: 1 }));
  // (rotated so its u runs back from the foot, away from the lagoon: -z, turned with the bank)
  mound.position.copy(FOOT).addScaledVector(V3(0, Math.sin(lean), Math.cos(lean)).applyAxisAngle(V3(0, 1, 0), BANK.yaw), -0.34);   // (back by its bevel, behind the board)
  mound.rotation.y = BANK.yaw;
  mound.receiveShadow = true;
  scene.add(mound);
  const g = umami.bankG = bankFrame();
  // Roots twisting down through its face, and reeds and rushes round its foot and along its top.
  const rootM = mat('#a88c66', { roughness: 0.9 });
  for (let i = 0; i < 7; i++) {
    const r = mesh(new THREE.CylinderGeometry(0.04, 0.09, 3 + (i % 3) * 1.5, 5), rootM);
    r.position.set(-3.6 + i * 1.2, 2.2 - (i % 3) * 2.4, -0.72);
    r.rotation.z = (i % 2 ? 1 : -1) * (0.5 + (i % 3) * 0.2);
    g.add(r);
  }
  const reedM = mat('#4f7a2e', { roughness: 0.9 }), rushM = mat('#5a3a1e', { roughness: 1 }), reed = new THREE.ConeGeometry(0.05, 1, 4);
  const tuft = (x, y, z, n, h) => {
    for (let j = 0; j < n; j++) {
      const hh = h * (0.7 + ((j * 7) % 5) * 0.12), m = mesh(reed, reedM, false);
      m.scale.set(1, hh, 1);
      m.position.set(x + Math.cos(j * 2.3) * 0.3, y + hh / 2, z + Math.sin(j * 2.3) * 0.3);
      m.rotation.set(Math.sin(j * 1.7) * 0.18, 0, Math.cos(j * 1.3) * 0.18);
      scene.add(m);
      if (j % 3 === 0) { const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6), rushM, false); r.position.set(m.position.x, y + hh - 0.2, m.position.z); scene.add(r); }
    }
  };
  for (const [dx, dz] of [[-2.2, 0.2], [2.1, 0.3], [-2.6, -1.2], [2.5, -1.4]]) tuft(FOOT.x + dx, WATER - 0.1, FOOT.z + dz, 7, 1.3);
  const top = FOOT.clone().addScaledVector(up, L);
  for (const dx of [-1.4, 0, 1.3]) tuft(top.x + dx, top.y - 0.15, top.z - 0.5, 5, 0.9);
  scene.add(g);
}

// ---------- poling her along the shore ----------
function poleTo(to, then = null) {
  if (!U().poleTo(to, inLagoon())) return false;
  umami.then = then;
  return true;
}
// Where she is, poled along: between her moorings, swinging round to lie along the shore.
function moorNow() {
  const u = U(), p = u.pole;
  if (!p) return MOORS[u.moor];
  const a = MOORS[p.to === 'bank' ? 'wreck' : 'bank'], b = MOORS[p.to], k = ease(p.t);
  return { p: a.p.clone().lerp(b.p, k), yaw: lerpA(a.yaw, b.yaw, ease(Math.min(1, p.t * 1.6 - 0.3))) };
}

// ---------- his board ----------
// His board on the bank, whole, from the start: idle (no cursor) till you take it up.
function showBoard() {
  const game = (U().game ??= new Forage(umamiDeal()));
  umami.board = forageBoard({ game, at: MID, yaw: BANK.yaw, lean, sq: SQ, skin: capybaraSkin, bananas: false, onLeave, onDone });
  umami.board.idle = true;
  scene.add(umami.board.group);
}
function openBoard() {
  if (!U().free(() => new Forage(umamiDeal()))) return;
  if (!umami.board) showBoard();
  umami.on = true;
  keys.clear();
  if (sail.g) rigged(false);   // (her mast struck: it'd be in the way, looking at the bank over her)
  if (!umami.said.board) { umami.said.board = true; toast('Foraging: turn the squares, three in a row clear. Clear him down off the foot of the bank'); }
}
function shutBoard() {
  umami.on = false;
  U().leave();
  if (sail.g) rigged(true);
  document.body.classList.remove('hauling');
}
// Only he leaves the board, in his trap (the skin's `leaves`): he and the trap are ours now. He breaks
// out of it on the muddy foot of the bank, bounds about for joy, and leaps in to swim to her.
function onLeave(l) {
  if (l.tag !== UMAMI.TAG) return false;
  U().freed();
  const him = l.mesh, c = him.userData.capybara, cage = him.userData.cage;
  scene.attach(c); scene.attach(cage);
  him.removeFromParent();
  umami.cage = cage;
  umami.swim = { m: c, cage, t: 0, phase: 'free', s0: c.scale.x, q0: c.quaternion.clone(), p0: c.position.clone() };
  toast(OF_HIM.free, false, true);
  return true;
}
// Where he breaks free (on the mud at the bank's foot), how far along it he bounds, and where he
// splashes in (on her side).
const FEET = 0.67 * SIZE;
const STAND = V3(FOOT.x - 0.4, WATER + FEET, FOOT.z + 0.05), BOUNDED = V3(FOOT.x + 1.0, WATER + FEET, FOOT.z + 0.1), SPLASH = V3(FOOT.x + 2.0, WATER - 0.05, FOOT.z + 1.0);
function onDone() {
  U().done();
  shutBoard();
  umami.boardGone = 1.5;
}

// ---------- the keys, the mouse, the prompt ----------
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** At sea, before the crane's keys (sailing.js): his board's keys while you're at it, and up in the
    lagoon, poling her along the shore and Space at his bank. */
export function umamiKey(key) {
  if (!sail.g) return false;
  if (umami.on) {
    if (key === 'escape') { shutBoard(); toast('He\'ll wait: pole back to him and Space to carry on'); return true; }
    if (umami.board?.key(key)) return true;
    return key !== 'p';
  }
  if (!inLagoon()) return false;
  const u = U();
  if (u.pole) return !VIEW.includes(key);
  if (key === 'w' || key === 'arrowup') return poleTo('bank') || true;
  if (key === 's' || key === 'arrowdown') return poleTo('wreck') || true;
  if (u.moor !== 'bank') return false;
  // At his bank: Space frees him; H takes her back to the crane and down.
  if (key === ' ' || key === 'enter') { if (u.canFree(true)) openBoard(); return true; }
  if (key === 'h') return poleTo('wreck', 'lower') || true;
  return !VIEW.includes(key);
}
const ndc = (x, y) => [x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1];
export function umamiHover(x, y) { if (umami.on) umami.board?.pointer(...ndc(x, y), camera); return umami.on; }
/** A click at sea (sailing.js): on his board, a left click turns anticlockwise, a right click (`button`
    2) clockwise; up in the lagoon, a click on the water poles her to whichever mooring's nearer it. */
export function umamiClick(x, y, button = 0) {
  if (umami.on) { if (umami.board?.pointer(...ndc(x, y), camera)) umami.board.click(button); return true; }
  if (!inLagoon() || button !== 0) return false;
  ray.setFromCamera(new THREE.Vector2(...ndc(x, y)), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(V3(0, 1, 0), -WATER), p)) return false;
  const to = p.distanceTo(MOORS.bank.p) < p.distanceTo(MOORS.wreck.p) ? 'bank' : 'wreck';
  poleTo(to);
  return false;   // (the crane's click goes on: nothing, up here)
}
export function umamiPrompt() {
  if (umami.on) return `${umami.board.prompt()} · Esc: leave him for now`;
  if (!inLagoon()) return '';
  const u = U();
  if (u.pole) return u.pole.to === 'bank' ? 'Poling her along the shore' : 'Poling her back to the wreck';
  if (u.moor !== 'bank') return '';
  if (u.canFree(true)) return 'A capybara, shut in an old fish trap · Space: free him (Foraging) · S: pole her back to the wreck';
  return 'The far bank · S: pole her back to the wreck · H: lower her down to the cove';
}
/** The camera while you free him: straight on to the bank's face; then on him as he breaks free,
    bounds about and swims to her. */
export function umamiCam() {
  if (umami.swim) return { look: umami.swim.m.position.clone().lerp(sail.g.position, 0.25), dist: 9, tilt: 0.5, yaw: -0.6 };   // (from the west: she's not in the way)
  if (!umami.on || !umami.board) return null;
  const v = umami.board.camView(camera), d = v.from.clone().sub(v.look).normalize();
  return { look: v.look, dist: v.dist, tilt: Math.asin(d.y), yaw: Math.atan2(d.x, d.z) };
}

// ---------- each tick ----------
const dummyQ = new THREE.Quaternion(), upY = V3(0, 1, 0);
// His legs paddle and his head nods.
function paddle(m, t, k) {
  (m.userData.legs || []).forEach((l, i) => { l.rotation.z = Math.sin(t * 4.5 + (i % 2) * Math.PI + (i > 1 ? 1 : 0)) * 0.4 * k; });
}
function swimTick(dt) {
  const s = umami.swim, m = s.m, t = performance.now() / 1000;
  s.t += dt;
  if (s.phase === 'free') {
    // Breaking out of the trap and bounding about: all a function of the time since he came off the
    // board (src/den-capybara.ts, freedAt): soft arcs, slow enough to watch.
    const f = freedAt(s.t);
    if (f.phase === 'break') {
      // He bursts out of the trap, its bars flying, and wriggles round upright onto the mud at the
      // bank's foot.
      const k = ease(f.u);
      m.position.lerpVectors(s.p0, STAND, k);
      m.quaternion.slerpQuaternions(s.q0, dummyQ.identity(), k);
      m.rotateZ(Math.sin(f.u * Math.PI * 2) * 0.12);   // (one slow wriggle)
      m.scale.setScalar(s.s0 + (SIZE - s.s0) * k);
      cageOpen(s.cage, f.u);
      return;
    }
    if (!s.loose) { s.loose = true; s.cage.removeFromParent(); umami.cage = null; burst(STAND.clone().setY(WATER + 0.3), '#d8c8a8', 8, 1.5); }
    if (f.phase === 'hop') {
      m.position.lerpVectors(STAND, BOUNDED, f.along).y += f.lift;
      m.quaternion.identity();
      m.rotateZ((0.5 - f.u) * 0.35);   // (nose up as he springs, down as he lands)
      paddle(m, s.t, 0);
      return;
    }
    if (f.phase === 'leap') {
      m.position.lerpVectors(BOUNDED, SPLASH, f.u).y += f.lift;
      m.quaternion.identity();
      m.rotateZ(0.25 - f.u * 0.6);
      return;
    }
    // Splash!
    m.position.copy(SPLASH);
    burst(SPLASH.clone().setY(WATER + 0.2), '#e6f3f6', 26, 3.5);
    burst(SPLASH.clone().setY(WATER + 0.2), '#9fd4ec', 12, 2.5);
    Object.assign(s, { phase: 'swim', t: 0, from: SPLASH.clone(), q0: m.quaternion.clone(), s0: SIZE });
    return;
  }
  sail.g.updateMatrixWorld(true);
  const side = sail.g.localToWorld(V3(0.8, 0, 1.6)), deck = sail.g.localToWorld(V3(1.55, SLOOP_DECK + 0.42 * SIZE / 0.62, 0));
  if (s.phase === 'swim') {
    // Across to her side, only his back and head out of the water, turning upright as he goes.
    const u = Math.min(1, s.t / UMAMI.SWIM), d = side.clone().sub(s.from);
    m.position.lerpVectors(s.from, side, ease(u)).setY(WATER - 0.05 + Math.sin(s.t * 1.6) * 0.02);   // (a slow, soft bob)
    dummyQ.setFromAxisAngle(upY, Math.atan2(-d.z, d.x));
    m.quaternion.slerpQuaternions(s.q0, dummyQ, Math.min(1, u * 2));
    m.scale.setScalar(s.s0 + (SIZE - s.s0) * Math.min(1, u * 2));
    paddle(m, t, 1);
    if ((s.ripple = (s.ripple ?? 0) - dt) < 0) { s.ripple = 0.25; burst(m.position.clone().setY(WATER + 0.05), '#cdeefa', 2, 0.6); }
    if (u >= 1) Object.assign(s, { phase: 'hop', t: 0, from: m.position.clone() });
    return;
  }
  // Up and over her rail onto her deck, by her bow.
  const u = Math.min(1, s.t / 0.7);
  m.position.lerpVectors(s.from, deck, ease(u)).y += Math.sin(u * Math.PI) * 0.9;
  paddle(m, t, 1 - u);
  if (u < 1) return;
  burst(deck.clone().setY(deck.y + 0.2), '#cdeefa', 10, 1.5);
  sail.g.attach(m);
  m.position.set(1.55, SLOOP_DECK + 0.42 * SIZE / 0.62, 0);
  m.rotation.set(0, 0, 0.12);   // (sat up on her foredeck, looking ahead)
  umami.pet = m;
  umami.swim = null;
  U().aboard();
  toast(OF_HIM.aboard);
}
// At home: where Life has him on the beach, at the depth there.
function homeTick(dt) {
  const L = umami.life, m = umami.pet, t = performance.now() / 1000;
  L.tick(dt);
  const doing = L.doing(), z = shoreZ() + L.off;
  // (the sea's at 0 and the sand slopes up out of it, and down under it into the shallows)
  const ground = L.off > 0 ? Math.min(0.05, L.off * 0.12) : L.off * 0.32, s = SIZE, feet = 0.67 * s;
  let y = ground + feet, pitch = 0, k = 0;
  if (doing === 'sit') { y -= 0.16 * s; pitch = 0.14; }
  else if (doing === 'soak') { y = -0.05 * s; pitch = 0.12; }
  else if (doing === 'float') y = -0.08 * s + Math.sin(t * 1.5) * 0.015;
  else if (doing === 'swim') { y = -0.1 * s + Math.sin(t * 1.5) * 0.015; k = 1; }
  else { y = Math.max(y, -0.1 * s) + Math.sin(t * 2.2) * 0.012; k = 0.7; }   // (an amble: no bouncing)
  m.position.set(L.x, m.position.y + (y - m.position.y) * Math.min(1, dt * 4), z);
  const want = -L.heading;
  m.rotation.set(0, lerpA(m.rotation.y, want, Math.min(1, dt * 3)), pitch);
  paddle(m, t, k);
  // Now and then a nod; a ripple round him in the water.
  const head = m.userData.head;
  if (head) head.rotation.z = Math.max(0, Math.sin(t * 0.7) - 0.85) * 2;
  if (doing !== 'sit' && doing !== 'walk' && (L.ripple = (L.ripple ?? 0) - dt) < 0) { L.ripple = doing === 'swim' ? 0.3 : 1.2; burst(V3(L.x, 0.05, z), '#cdeefa', 2, 0.4); }
}
export function umamiTick(dt) {
  if (!crane.W) return;
  if (!umami.bankG) bankMake();
  const u = U();
  // Her, up in the lagoon: where she's moored, or on her way along the shore.
  if (crane.rules.where === 'lagoon' && !crane.rules.trip) {
    const was = u.pole?.to;
    if (u.tick(dt)) {
      if (was === 'bank' && u.stage === 'stuck' && !umami.said.found) { umami.said.found = true; toast(OF_HIM.found); }
      if (umami.then === 'lower') { umami.then = null; craneKey('h'); }
    }
    if (u.pole && (umami.ripple = (umami.ripple ?? 0) - dt) < 0) { umami.ripple = 0.2; burst(sail.g.localToWorld(V3(2.4, 0.05, 0)), '#cdeefa', 3, 1); }
    crane.moor = u.moor === 'wreck' && !u.pole ? null : moorNow();
  } else crane.moor = null;
  // A trip down the cliff starts from the crane: she's by the wreck by then.
  if (umami.on) {
    if (!inLagoon()) shutBoard();
    else document.body.classList.add('hauling');   // (the sailing bar out of the way)
  }
  if (!umami.board && u.stage === 'stuck') showBoard();
  if (umami.board) umami.board.idle = !umami.on;
  umami.board?.tick(dt);
  if (umami.boardGone > 0 && (umami.boardGone -= dt) <= 0) { umami.board.dispose(); umami.board = null; }
  if (umami.swim) swimTick(dt);
  // Aboard her: once you're ashore at the den he hops off into its shallows, home for good.
  if (u.stage === 'aboard' && !sail.on && umami.pet) {
    U().home();
    umami.life = new Life();
    const m = umami.pet;
    scene.attach(m);
    m.position.set(umami.life.x, 0, shoreZ() + umami.life.off);
    burst(m.position.clone().setY(0.2), '#e6f3f6', 16, 2.5);
  }
  if (u.stage === 'home' && umami.life) homeTick(dt);
}
// A new game (or sailing put back): him stuck on his bank again, her by the wreck.
export function umamiReset() {
  if (umami.on) shutBoard();
  umami.board?.dispose();
  umami.board = null;
  for (const m of [umami.swim?.m, umami.pet, umami.cage]) m?.removeFromParent();
  Object.assign(umami, { rules: new Umami(), swim: null, pet: null, cage: null, life: null, then: null, boardGone: 0, said: {} });
  crane.moor = null;
}
/** A starting point (menus.js, "Umami's rescue"): her moored by his bank, the lagoon's crane built. */
export function umamiCheat() {
  umamiReset();
  if (!umami.bankG && crane.W) bankMake();
  Object.assign(U(), { moor: 'bank' });
  umami.said.found = true;
  crane.moor = moorNow();
}
