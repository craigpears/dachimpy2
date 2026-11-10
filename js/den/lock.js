// A lock on the canal, in 3D: its chamber and the water in it rising and falling, the stone piers
// it's built of, a pair of gates at each end, and its quay: an old bilge pump at the head of a
// Bilge board, played to pump her up. One module, each lock on the sea a placed instance of it,
// where LAY.LOCKS says (src/den-sail.ts); its rules are src/den-lock.ts, its Bilge the one Bilge
// puzzle (src/bilge.ts). (The quay's Bilge was in sea-puzzles.js; the lock itself in sea.js.)
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { Bilge, W as BW, H as BH } from '../bilge.js';
import { worth, oddsFor } from '../den-bilge.js';
import { scene, camera, mat, mesh, canvasTex, woodTex, V3, keys, ray, burst, toast } from './world.js';
import { bitMesh } from './bilge.js';
import { seaX, seaZ, sail, LIFT, BANK, LOCK_GATE_X, coveM, stoneM, grassM, pumpMesh } from './sea.js';

/* The user (9 Nov): "some kind of a lock and canal ... You have to go up a lock", "we need the
   actual bilge pump"; (10 Nov) "be more than just the one lock". Every lock is built the same: its
   chamber a square of the canal between rock banks, its stone piers running on past the square each
   way (she's longer than a square) with a pair of mitre gates at each end, both pairs swinging open
   toward its high side as a lock's do. Its quay is on the bank toward the den (or, for a lock that
   runs out to sea, the right-hand bank), an old pump at the chamber's edge, its spout out over it,
   and the Bilge board laid beside it. Waiting in it to go up, you bilge: each clear pumps its share,
   the pump's handle working, water gushing from its spout, and the chamber's water rising a step
   with it, her on it, till it's full and the top gates swing open. Going down it drains by itself;
   wanted full from the high side, it fills from above by itself. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const gateM = mat('#5b3a20', { map: woodTex }), ironM = mat('#3a3f45', { metalness: 0.6, roughness: 0.4 });
// One lock, put down: its group turned so its local +x runs from its low side to its high side.
function lockMesh(spot) {
  const [c, r] = spot.at, half = SAIL.CELL / 2, x = seaX(c), z = seaZ(r);
  // (in the world, a square across is +x and a square out is -z)
  const hx = DC[spot.up], hz = -DR[spot.up], top = LIFT * (spot.low + 1) + BANK;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.atan2(-hz, hx);   // (local +x along (hx, hz))
  // Its quay: the bank toward the den, or the right-hand bank if it runs out to sea; in the world,
  // (qx, qz) from its middle.
  const across = hz === 0, qx = across ? 0 : 1, qz = across ? 1 : 0;
  const L = { spot, g, top, at: V3(x, top, z), gates: {} };
  // Its chamber's water.
  L.chamber = mesh(new THREE.PlaneGeometry(LOCK_GATE_X * 2, SAIL.CELL).rotateX(-Math.PI / 2), coveM, false);
  g.add(L.chamber);
  // Its piers: stone walls either side, on past the square each way.
  const pierL = LOCK_GATE_X + 0.2 - half;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pier = mesh(new THREE.BoxGeometry(pierL, top + 1, 0.6), stoneM);
    pier.position.set(sx * (half + pierL / 2), (top - 1) / 2, sz * (half + 0.3));
    const cap = mesh(new THREE.BoxGeometry(pierL, 0.12, 0.6), grassM);
    cap.position.set(pier.position.x, top + 0.06, pier.position.z);
    g.add(pier, cap);
  }
  // A pair of gates at each end, from below its low water to over its high water, swinging open
  // toward the high side (see lockTick).
  const y0 = LIFT * spot.low - 0.4, gh = LIFT + 2;
  for (const [end, sx] of [['low', -1], ['high', 1]]) {
    const leaves = [];
    for (const sz of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(sx * LOCK_GATE_X, y0, sz * half);
      const leaf = mesh(new THREE.BoxGeometry(0.28, gh, half), gateM);
      leaf.position.set(0, gh / 2, -sz * half / 2);
      for (const y of [0.8, 2.0, 3.2]) { const band = mesh(new THREE.BoxGeometry(0.32, 0.1, half), ironM, false); band.position.set(0, y, -sz * half / 2); hinge.add(band); }
      hinge.add(leaf);
      hinge.userData.sz = sz;
      g.add(hinge);
      leaves.push(hinge);
    }
    L.gates[end] = { leaves, open: end === 'low' ? 1 : 0 };
  }
  scene.add(g);
  // Its quay pump, at the chamber's edge, its spout out over the chamber, toward the low end as the
  // first lock's always was (and past the board's foot beside one that runs out, its handle clear
  // of the board).
  const toHigh = V3(hx, 0, hz), quay = V3(qx, 0, qz);
  L.pump = pumpMesh();
  L.pump.scale.setScalar(1.8);
  L.pump.position.copy(L.at).addScaledVector(quay, half + 0.6).addScaledVector(toHigh, across ? -1.7 : -2.9).setY(top + 0.12);
  const d = V3(x - L.pump.position.x, 0, z - L.pump.position.z).normalize();
  L.pump.rotation.y = Math.atan2(d.z, -d.x);   // (its spout, its local -x, toward the chamber)
  scene.add(L.pump);
  // (thick and bright enough to read from the quay's camera, up over the board)
  L.gush = mesh(new THREE.CylinderGeometry(0.3, 0.45, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#cdeefa', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false }), false);
  L.gush.visible = false;
  scene.add(L.gush);
  // Where its Bilge board lies on the quay: a lock that runs across has it on the den's side, as
  // the first one always did; one that runs out, beside it, nudged toward its high side (clear of
  // the sea at its foot).
  L.board = across ? L.at.clone().addScaledVector(quay, 1.5 * SAIL.CELL) : L.at.clone().addScaledVector(quay, 4.3).addScaledVector(toHigh, 1);
  L.board.y = top + 0.15;
  return L;
}
export const locks = { all: null };
export function lockWorld() { return (locks.all ||= sail.sea.locks.map(lockMesh)); }

// A stroke of the quay pump's handle, as a clear's pumped into the lock.
function pumpStroke(L) { if (L) L.pump.userData.stroke = 1; }
// Each tick: each lock's water at its level, its gates open at the end she can pass, and the pump
// she's bilging at working, water gushing from it into the chamber.
export function lockTick(dt) {
  const all = lockWorld(), h = sail.helm, working = sail.on ? h.working() : null;
  all.forEach((L, i) => {
    const lk = h.locks[i], y = LIFT * lk.height();
    L.chamber.position.y = y + 0.05;
    L.chamber.visible = y > 0.02;   // (at the sea's level, it's the sea)
    for (const [end, gt] of Object.entries(L.gates)) {
      gt.open += ((lk.openAt(end) ? 1 : 0) - gt.open) * Math.min(1, dt * 2.5);
      for (const lf of gt.leaves) lf.rotation.y = -gt.open * lf.userData.sz * Math.PI / 2;
    }
    const P = L.pump, s = P.userData.stroke ?? 0;
    P.userData.stroke = Math.max(0, s - dt * 2.5);
    P.userData.arm.rotation.z = 0.35 - 0.75 * Math.sin(Math.PI * (1 - P.userData.stroke)) * (P.userData.stroke > 0 ? 1 : 0);
    const rising = working === lk && lk.fill > lk.level + 1e-4;
    L.gush.visible = rising;
    if (rising) {
      P.updateMatrixWorld(true);
      const m = P.localToWorld(P.userData.mouth.clone()), y1 = y + 0.05;
      L.gush.scale.set(1, Math.max(0.1, m.y - y1), 1);
      L.gush.position.set(m.x, (m.y + y1) / 2, m.z);
      if ((L.gushT = (L.gushT ?? 0) - dt) < 0) { L.gushT = 0.12; burst(V3(m.x, y1 + 0.05, m.z), '#e6f3f6', 3, 1.6); burst(m, '#9fd4ec', 1, 0.8); }
    }
  });
}

/* Bilging at a lock (the user, 9 Nov: "you have to do a lot of bilging to open and close the
   canals"). The real Bilge board on its quay, the old pump at its head. Each clear pumps its share
   of what the move's worth (as on the beach) as it washes away, the pump's handle working and water
   gushing from its spout into the lock, till the lock's up; then it's gone and she sails on. One
   board, laid on the quay of whichever lock she's waiting in. */
const QUAY_SQ = 0.45;
export const hold = { mode: null, lock: null, at: null, board: null, group: null, pieces: null, meshes: new Map(), queue: [], holdT: 0, shown: null, cur: { r: 5, c: 2 }, water: null, cursor: null };
const holdX = (c) => c - (BW - 1) / 2, holdZ = (r) => r - (BH - 1) / 2;
// The lock she's waiting in to be pumped up, if she is.
const holdWanted = () => (sail.on ? sail.helm.working() : null);
const holdRows = () => 3 + (1 - (hold.lock?.level ?? 0)) * 6;
function holdMake() {
  const g = new THREE.Group();
  const bedTex = canvasTex(BW * 32, BH * 32, (x, cw, ch) => {
    x.fillStyle = '#5a4128'; x.fillRect(0, 0, cw, ch);
    for (let y = 0; y < ch; y += 16) { x.fillStyle = y % 32 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.05)'; x.fillRect(0, y, cw, 15); }
    x.strokeStyle = 'rgba(20,12,6,0.45)'; x.lineWidth = 1.5;
    for (let i = 0; i <= cw; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, ch); x.stroke(); }
    for (let i = 0; i <= ch; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(cw, i); x.stroke(); }
  });
  const bed = mesh(new THREE.PlaneGeometry(BW + 0.3, BH + 0.3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: bedTex, roughness: 1 }), false);
  bed.position.y = 0.005;
  g.add(bed);
  hold.pieces = new THREE.Group();
  g.add(hold.pieces);
  hold.water = mesh(new THREE.PlaneGeometry(BW + 0.3, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2a6fd8', transparent: true, opacity: 0.4, depthWrite: false }), false);
  hold.water.renderOrder = 4;
  g.add(hold.water);
  hold.cursor = new THREE.Group();
  const orange = new THREE.MeshBasicMaterial({ color: '#f39a2b' }), t = 0.07, len = 0.28;
  const bar = (x, z, sx, sz) => { const m = mesh(new THREE.BoxGeometry(sx, 0.03, sz), orange, false); m.position.set(x, 0.07, z); hold.cursor.add(m); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { bar(sx * (1 - len / 2), sz / 2, len, t); bar(sx, sz * (0.5 - len / 2), t, len); }
  for (const sz of [-1, 1]) bar(0, sz * (0.5 - len / 2), t, len);
  g.add(hold.cursor);
  hold.group = g;
}
function holdOpen(lk) {
  if (!hold.group) holdMake();
  hold.board = new Bilge(Math.random, oddsFor(0));
  for (const m of hold.meshes.values()) hold.pieces.remove(m);
  hold.meshes.clear();
  hold.queue = []; hold.shown = null; hold.cur = { r: 5, c: 2 };
  // On its quay, its top row toward the sea, seen from the den side.
  const L = lockWorld()[sail.helm.locks.indexOf(lk)], g = hold.group;
  scene.add(g);
  g.position.copy(L.board);
  g.rotation.set(0, 0, 0);
  g.scale.setScalar(QUAY_SQ);
  hold.mode = 'up'; hold.lock = lk; hold.at = L.at;
  document.body.classList.add('quay');   // (the sailing bar out of the way while you bilge)
  keys.clear();
}
export function holdShut() {
  if (hold.group) hold.group.removeFromParent();
  hold.mode = null; hold.lock = null;
  hold.queue = [];
  document.body.classList.remove('quay');
}
/* A Bilge piece on the quay's board. The pieces are drawn the right way up for the beach's board,
   which you look at from the sea; the quay's you look at from the den side, so they're turned the
   other way round here, or they read upside down (the user, 9 Nov: "the bilge puzzle looks like
   it's upside down"). Their shadows fall the same way as on the beach, down and to the left. */
function holdBit(bit) {
  const m = bitMesh(bit);
  m.userData.face.rotation.z = 0;
  m.children[0].position.set(-0.05, 0.012, -0.05);
  return m;
}
export function holdKey(key) {
  const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
  if (mv) { hold.cur.r = Math.max(0, Math.min(BH - 1, hold.cur.r + mv[0])); hold.cur.c = Math.max(0, Math.min(BW - 2, hold.cur.c + mv[1])); return true; }
  if (key === ' ' || key === 'enter') { holdSwap(); return true; }
  return key === 'q' || key === 'e' || key === 'h';
}
export function holdHover(x, y) {
  if (!hold.group) return;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  hold.group.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(hold.group.matrixWorld), n = new THREE.Vector3(0, 1, 0).transformDirection(hold.group.matrixWorld);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  hold.group.worldToLocal(p);
  hold.cur.c = Math.max(0, Math.min(BW - 2, Math.round(p.x + (BW - 1) / 2 - 0.5)));
  hold.cur.r = Math.max(0, Math.min(BH - 1, Math.round(p.z + (BH - 1) / 2)));
}
export function holdSwap() {
  if (!hold.mode || hold.queue.length) return;
  const { r, c } = hold.cur, b = hold.board, rows = holdRows();
  b.water = Math.round(rows);
  const m = b.swap(r, c);
  if (!m.moved) {
    for (const bit of [b.grid[r][c], b.grid[r][c + 1]]) if (bit?.s === 'crab') { const mm = hold.meshes.get(bit.id); if (mm) mm.userData.jig = 0.6; }
    return;
  }
  // What the move's worth, pumped a share at a time as each clear washes away (holdTick), so the
  // lock's water rises a step with each.
  const w = worth(m, rows), n = m.stages.reduce((a, st) => a + st.cleared.length, 0) || 1;
  hold.queue.push(...m.stages.map((st) => ({ ...st, w: w * st.cleared.length / n })));
  hold.holdT = 0;
  if (m.combo) toast(m.combo);
}
export function holdTick(dt) {
  const want = holdWanted();
  if (want !== hold.lock) { holdShut(); if (want) holdOpen(want); }
  if (!hold.mode) return;
  const b = hold.board;
  if (!hold.shown) {
    hold.shown = b.snap();
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) { const bit = hold.shown[r][c], m = holdBit(bit); m.position.set(holdX(c), 0.01, holdZ(r)); hold.pieces.add(m); hold.meshes.set(bit.id, m); }
  }
  // A move a step at a time, as on the beach: what's cleared washes away, the rest float up.
  hold.holdT += dt;
  let moving = false;
  for (const m of hold.meshes.values()) if (m.userData.tz !== undefined && Math.abs(m.position.z - m.userData.tz) + Math.abs(m.position.x - m.userData.tx) > 0.02) moving = true;
  if (hold.queue.length && hold.holdT > 0.18 && !moving) {
    const st = hold.queue.shift();
    hold.holdT = 0;
    if (st.w > 0 && sail.helm.pump(st.w)) pumpStroke(lockWorld()[sail.helm.locks.indexOf(hold.lock)]);
    for (const id of st.cleared) {
      const m = hold.meshes.get(id);
      if (!m) continue;
      burst(m.getWorldPosition(new THREE.Vector3()).setY(m.getWorldPosition(new THREE.Vector3()).y + 0.2), '#dff3f6', 4, 1.2);
      hold.pieces.remove(m);
      hold.meshes.delete(id);
    }
    hold.shown = st.grid;
    const fresh = Array(BW).fill(0);
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) {
      const bit = st.grid[r][c];
      let m = hold.meshes.get(bit.id);
      if (!m) { m = holdBit(bit); m.position.set(holdX(c), 0.01, holdZ(BH + fresh[c]++)); hold.pieces.add(m); hold.meshes.set(bit.id, m); }
      m.userData.tx = holdX(c); m.userData.tz = holdZ(r);
    }
  }
  for (const m of hold.meshes.values()) {
    const tx = m.userData.tx ?? m.position.x, tz = m.userData.tz ?? m.position.z;
    const dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
    if (d > 1e-3) { const k = Math.min(1, 6 * dt / d); m.position.x += dx * k; m.position.z += dz * k; }
    m.visible = m.position.z < holdZ(BH - 1) + 0.6;   // (new ones come in from under the bottom edge)
    if (m.userData.jig > 0) { m.userData.jig -= dt; m.rotation.y = Math.sin(m.userData.jig * 40) * 0.4; } else m.rotation.y = 0;
  }
  // The water over the bottom rows: what's still to pump.
  const rows = Math.min(BH, holdRows());
  hold.water.scale.z = rows;
  hold.water.position.set(0, 0.042, (BH / 2) - rows / 2);
  hold.cursor.position.set((holdX(hold.cur.c) + holdX(hold.cur.c + 1)) / 2, 0, holdZ(hold.cur.r));
}

/* What's said of the locks as she goes: the first lock she's to be pumped up in, and each other one
   the first time; the top gates opening; the first time one drains (or fills) by itself for her;
   and up on the clifftop canal at the top of the locks, the first time. */
export function lockSay(h, heldWas, said) {
  const held = h.held(), lk = h.working();
  if (held === 'up' && heldWas !== 'up' && lk) {
    const i = h.locks.indexOf(lk);
    if (!said.locks?.[i]) {
      (said.locks ||= {})[i] = true;
      toast(Object.keys(said.locks).length === 1 ? 'A lock up the cliff: bilge on the quay to pump her up' : 'Another lock: bilge on the quay to pump her up again');
    }
  }
  if (held === 'gates' && heldWas === 'up') toast('The lock\'s full: the top gates open');
  if ((held === 'down' || held === 'fill') && heldWas !== held && !said.lockDown) { said.lockDown = true; toast(held === 'down' ? 'Down she goes: the lock drains by itself' : 'The lock fills from the canal above by itself'); }
  const top = Math.max(...sail.sea.locks.map((s) => s.low + 1));
  if (!said.clifftop && sail.sea.level(h.pose.c, h.pose.r) === top && !sail.sea.cove.has(`${h.pose.c},${h.pose.r}`) && !h.lockAt(h.pose.c, h.pose.r)) {
    said.clifftop = true;
    toast('Up on the clifftop: the canal runs on along the top of the cliffs');
  }
}
