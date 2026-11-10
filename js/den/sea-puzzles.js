// The board puzzles at sea: Bilge on the quay, to work the lock, and patching her deck by
// Carpentry. (Split out of den.js.)
import * as THREE from 'three';
import { FairDeal } from '../den-deal.js';
import { Bilge, W as BW, H as BH } from '../bilge.js';
import { KEYS as VIEW_KEYS, quarters, centreOn, clampTo } from '../den-carp-view.js';
import { LAY } from '../den-sail.js';
import { PATCH } from '../den-patch.js';
import { worth, oddsFor } from '../den-bilge.js';
import { C, S, scene, camera, mat, mesh, canvasTex, woodTex, woodMat, cellBox, pieceGroup, outline, rotCW, rotCCW, flip, V3, keys, shake, ray, burst, toast, fatOutline, worldLets } from './world.js';
import { roomyShapes } from './wall.js';
import { ghostMats } from './pieces.js';
import { cursor } from './raids.js';
import { bitMesh } from './bilge.js';
import { seaX, seaZ, SLOOP_DECK, sail, CLIFF_H, pumpStroke } from './sea.js';

/* Bilging at the lock (the user, 9 Nov: "you have to do a lot of bilging to open and close the
   canals"). The real Bilge board on the quay beside it, and an old bilge pump at its head. Each
   clear pumps its share of what the move's worth (as on the beach) as it washes away, the pump's
   handle working and water gushing from its spout into the lock, till the lock's up; then it's
   gone and she sails on. (A hit at sea is a hole in her deck, patched by Carpentry: patchOpen.) */
const QUAY_SQ = 0.45;
export const hold = { mode: null, board: null, group: null, pieces: null, meshes: new Map(), queue: [], holdT: 0, shown: null, cur: { r: 5, c: 2 }, water: null, cursor: null };
const holdX = (c) => c - (BW - 1) / 2, holdZ = (r) => r - (BH - 1) / 2;
// What there is to bilge just now, if anything: the lock ('up').
const holdWanted = () => (sail.on && sail.helm.held() === 'up' ? 'up' : null);
const holdRows = () => 3 + (1 - sail.helm.level) * 6;
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
function holdOpen(mode) {
  if (!hold.group) holdMake();
  hold.board = new Bilge(Math.random, oddsFor(0));
  for (const m of hold.meshes.values()) hold.pieces.remove(m);
  hold.meshes.clear();
  hold.queue = []; hold.shown = null; hold.cur = { r: 5, c: 2 };
  // On the quay on the den side of the lock, its top row toward the sea, seen from the den side.
  const g = hold.group;
  scene.add(g);
  g.position.set(seaX(LAY.LOCK[0]), CLIFF_H + 0.15, (seaZ(LAY.LOCK[1] - 1) + seaZ(LAY.LOCK[1] - 2)) / 2);
  g.rotation.set(0, 0, 0);
  g.scale.setScalar(QUAY_SQ);
  hold.mode = mode;
  document.body.classList.add('quay');   // (the sailing bar out of the way while you bilge)
  keys.clear();
}
export function holdShut() {
  if (hold.group) hold.group.removeFromParent();
  hold.mode = null;
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
  if (want !== hold.mode) { holdShut(); if (want) holdOpen(want); }
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
    if (st.w > 0 && sail.helm.pump(st.w)) pumpStroke();
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
/* A hole in her deck (the user, 9 Nov: being dazed by a hit was over "way too quickly. Like, you
   know, one fix and it was done", and bilging was wrong for it: "what do you mean bilge? I've been
   hit by a cannonball, not water bucket"). A hit knocks a hole in her deck and she's dazed, her
   sails struck, till you've patched it by Carpentry, as the wall's holes are mended (the rules are
   src/den-patch.ts): a piece goes over at least one open square, clear of what's in already, and
   may rest on the deck round the hole. You can't walk off to the den's crates at sea, so the
   pieces are offered in the same tray as ashore, 1, 2 and 3 along the bottom (clicked or pressed,
   a bit bigger here), each restocked as it's used, dealt fair (as for the first wall) so the hole
   can be finished. The ship's timber crate stands by the hole as scenery, nothing on its lid (the
   user, 9 Nov: the pieces shown twice, on the lid and in the tray, was "a very cluttered user
   interface ... simplify it, standardize it"); the sailing bar's hidden while you patch. Played with the Carpentry view's own keys (src/den-carp-view.ts), looking down on it
   from her stern, its top row toward her bow, as the wall's Carpentry reads. */
export const patch = { on: false, hole: null, group: null, face: null, wood: null, ghost: null, ghostKey: '', crate: null, slots: [], hand: null, r: 0, c: 0, sq: 0.2, keyAt: null, fair: new FairDeal(C), away: null };
/* The same Carpentry, the same tray and keys, for a frame somewhere other than her deck: the crane's
   frames on the cliff's ledge (crane.js). `patch.away` is { hole() (the frame to fill, or null), sq
   (metres a square), mount(g) (puts the board's group in the world), dress(face, frame) (draws the
   frame under the pieces), done(frame) (it's full) }. Its board and pieces are the crane's to keep:
   they're left where they are when it's shut. */
const PATCH_W = 1.3;   // metres across her deck the board may take, at most
// A fresh hole for a hit: shaped for the common pieces, as the wall's are.
export const deckHoleShape = () => roomyShapes(PATCH.PIECES, 6)[0] || C.genHole(PATCH.PIECES).hole;
function struck(on) {
  if (!sail.g) return;
  for (const o of [...sail.g.userData.sails, ...sail.g.userData.rig]) o.visible = !on;
  for (const side of ['L', 'R']) sail.g.userData.guns[side].visible = !on;
}
// The last patch's planks off her deck (a new hole, or a new voyage).
export function patchClear() {
  if (patch.group) { patch.group.removeFromParent(); patch.group.traverse((o) => { if (o.geometry && o.geometry !== cellBox) o.geometry.dispose(); }); }
  patch.group = patch.face = patch.wood = null;
}
function patchOpen(hole, away = null) {
  if (!away) patchClear();
  Object.assign(patch, { on: true, hole, hand: null, ghostKey: '', keyAt: null, at: away });
  const b = hole.board, sq = patch.sq = away ? away.sq : Math.min(0.22, PATCH_W / b.w);
  // In cell space (rows down, as pieceGroup draws them), laid flat on her deck, the top row toward
  // her bow and the board's middle where the deck's is.
  const g = patch.group = new THREE.Group();
  g.position.set(0.05, SLOOP_DECK + 0.03, 0);
  g.rotation.y = -Math.PI / 2;
  g.scale.setScalar(sq / S);
  const flatG = new THREE.Group();
  flatG.rotation.x = -Math.PI / 2;
  g.add(flatG);
  const face = patch.face = new THREE.Group();
  face.position.set(-(b.c0 + b.w / 2) * S, (b.r0 + b.h / 2) * S, 0);
  flatG.add(face);
  // The hole: dark water down through it, splintered planks round its edge (the wall's hole colour).
  if (away) away.dress(face, hole);
  else {
    const dark = new THREE.MeshBasicMaterial({ color: '#0d1a20' }), sqGeo = new THREE.PlaneGeometry(S, S);
    for (const [r, c] of hole.cells) { const m = new THREE.Mesh(sqGeo, dark); m.position.set((c + 0.5) * S, -(r + 0.5) * S, 0.01); face.add(m); }
  }
  patch.rim = outline(hole.cells, 0.03, '#ffd58a');
  face.add(patch.rim);
  // The deck round it a piece may rest on, chalked.
  const all = [];
  for (let r = b.r0; r < b.r0 + b.h; r++) for (let c = b.c0; c < b.c0 + b.w; c++) all.push([r, c]);
  patch.chalk = outline(all, 0.02, '#e9dfc8');
  patch.chalk.material.transparent = true; patch.chalk.material.opacity = 0.45;
  face.add(patch.chalk);
  patch.wood = new THREE.Group();
  face.add(patch.wood);
  if (away) { away.mount(g); finishOpen(); return; }
  sail.g.add(g);
  // The ship's timber crate, between the hole and her stern (scenery: the pieces are in the tray).
  if (!patch.crate) {
    const c = patch.crate = new THREE.Group(), box = mesh(new THREE.BoxGeometry(0.4, 0.26, 0.9), mat('#7a5634', { map: woodTex }));
    box.position.y = 0.13;
    const band = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.92), mat('#3a3f45', { metalness: 0.6, roughness: 0.4 }), false);
    band.position.y = 0.2;
    c.add(box, band);
    c.position.set(-0.95, SLOOP_DECK, 0);
  }
  sail.g.add(patch.crate);
  struck(true);
  finishOpen();
}
// The tray dealt, the piece's starting spot, and the sailing bar out of the way.
function finishOpen() {
  patch.slots = [0, 1, 2].map(() => ({ letter: null, cells: null, fair: false, wait: 0, waitFull: 0.45 }));
  patch.slots.forEach(patchDeal);
  const q = quarters(patch.hole.open());
  [patch.r, patch.c] = centreOn(q.ul || q.ur || q.dl || q.dr, 1, 1);
  document.body.classList.add('patching');
  keys.clear();
}
// Patched (or ashore): the crate and the ghost go, her sails go up again; the patch stays in her deck.
export function patchShut() {
  patch.on = false;
  patch.hand = null;
  patch.crate?.removeFromParent();
  if (patch.ghost) { patch.ghost.removeFromParent(); patch.ghost = null; }
  patch.ghostKey = '';
  if (patch.rim) { patch.rim.removeFromParent(); patch.chalk.removeFromParent(); patch.rim = patch.chalk = null; }
  // (a frame away from her deck is the crane's: its board stays where it is, and isn't cleared with hers)
  if (patch.at) { patch.group = patch.face = patch.wood = null; patch.at = null; }
  struck(false);
  document.body.classList.remove('patching');
}
// A slot of the crate dealt a piece: fair, for what's left of the hole, while there's a way.
function patchDeal(p) {
  const have = [...patch.slots.map((s) => s.letter), patch.hand?.letter].filter(Boolean);
  const l = patch.fair.next(patch.hole.done() ? [] : [patch.hole.open()], have);
  p.letter = l || C.weightedLetter();
  p.fair = !!l;
  p.cells = C.normalize(C.pick(C.ORIENTS_BY_LETTER[p.letter]).cells);
}
// Where the piece in hand is (or would start): its middle, on the board.
function patchMid() {
  if (patch.hand) { const b = C.bbox(patch.hand.cells); return [patch.r + b.h / 2, patch.c + b.w / 2]; }
  const q = quarters(patch.hole.open());
  return q.ul || q.ur || q.dl || q.dr || [patch.hole.board.r0 + patch.hole.board.h / 2, patch.hole.board.c0 + patch.hole.board.w / 2];
}
function patchClamp() {
  const b = C.bbox(patch.hand.cells);
  [patch.r, patch.c] = clampTo(patch.r, patch.c, b.h, b.w, patch.hole.board, false);
}
// The piece centred near a point: on the nearest spot it fits there, if one's close (a flush fit first).
function patchSnap(p, near = 2.6) {
  const b = C.bbox(patch.hand.cells), d = (s) => Math.hypot(s.r + b.h / 2 - p[0], s.c + b.w / 2 - p[1]);
  const best = patch.hole.fits(patch.hand.cells).filter((s) => d(s) < near).sort((a, z) => (a.over > 0) - (z.over > 0) || d(a) - d(z))[0];
  if (best) { patch.r = best.r; patch.c = best.c; } else [patch.r, patch.c] = centreOn(p, b.h, b.w);
  patchClamp();
}
export function patchTake(j) {
  const p = patch.slots[j];
  if (!p) return;
  if (patch.hand?.from === p) return patchPutBack();
  if (!p.letter) return toast(`Crate ${j + 1} is restocking`, false, true);
  if (patch.hand && !patch.hand.from) return toast('Your hands are full: fit that piece first', false, true);
  const mid = patchMid();
  if (patch.hand) patchPutBack();
  patch.hand = { letter: p.letter, cells: p.cells, from: p };
  p.letter = null;
  patchSnap(mid, 1.5);
}
function patchPutBack() {
  const h = patch.hand, p = h.from;
  p.letter = h.letter; p.cells = h.cells;
  patch.hand = null;
}
// Turned or flipped about its middle, so it turns where it is.
export function patchTurn(fn) {
  const mid = patchMid();
  patch.hand.cells = fn(patch.hand.cells);
  const b = C.bbox(patch.hand.cells);
  [patch.r, patch.c] = centreOn(mid, b.h, b.w);
  patchClamp();
}
export function patchPlace() {
  const hand = patch.hand, hole = patch.hole;
  if (!hand) return;
  if (!hole.put(hand.letter, hand.cells, patch.r, patch.c)) { worldLets.shake = 0.2; return; }
  const laid = hole.laid[hole.laid.length - 1];
  // Fitted flush in the hole, or resting proud on the deck round it.
  const g = pieceGroup(hand.cells, woodMat(hand.letter));
  g.position.set(patch.c * S, -patch.r * S, laid.over && !patch.at ? 0.3 : 0.05);   // (in a frame it lies flat, sticking out)
  patch.wood.add(g);
  const b = C.bbox(hand.cells), at = patch.face.localToWorld(V3((patch.c + b.w / 2) * S, -(patch.r + b.h / 2) * S, 0.4));
  burst(at, '#e8c890', 8, 1.2);
  if (hand.from) hand.from.wait = hand.from.waitFull;   // the crate restocks
  patch.hand = null;
  if (hole.done()) {
    burst(at, '#f0d9a8', 14, 2);
    if (patch.at) patch.at.done(hole);
    else toast(hole.over() ? 'Patched, boarded over! She sails on' : 'Patched! She sails on');
  }
}
// Backspace: the last piece back out of the hole into your hands, to fit again.
function patchTakeBack() {
  if (patch.hand && !patch.hand.from) return toast('Your hands are full: fit that piece first', false, true);
  const l = patch.hole.laid.length ? patch.hole.laid[patch.hole.laid.length - 1] : null;
  if (!l) return;
  if (patch.hand) patchPutBack();
  patch.hole.takeBack();
  const g = patch.wood.children[patch.wood.children.length - 1];
  if (g) patch.wood.remove(g);
  const r0 = Math.min(...l.cells.map((p) => p[0])), c0 = Math.min(...l.cells.map((p) => p[1]));
  patch.hand = { letter: l.letter, cells: l.cells.map(([r, c]) => [r - r0, c - c0]), from: null };
  patch.r = r0; patch.c = c0;
}
// The Carpentry view's keys (Esc is left to the helm: it pulls up the pin).
export function patchKey(key, e) {
  const a = VIEW_KEYS[key];
  if (!a || a.kind === 'leave') return false;
  if (e.repeat && a.kind !== 'move') return true;
  if (['move', 'turn', 'flip', 'jump'].includes(a.kind)) patch.keyAt = cursor ? { ...cursor } : { x: -1e4, y: -1e4 };
  const hand = patch.hand;
  switch (a.kind) {
    case 'move': if (hand) { patch.r += a.dr; patch.c += a.dc; patchClamp(); } break;
    case 'turn': if (hand) patchTurn(a.dir > 0 ? rotCW : rotCCW); break;
    case 'flip': if (hand) patchTurn(flip); break;
    case 'jump': if (hand) { const q = quarters(patch.hole.open())[a.corner]; if (q) patchSnap(q); else worldLets.shake = 0.08; } break;
    case 'take': patchTake(a.i); break;
    case 'place': if (hand) patchPlace(); else patchTakeBack(); break;
    case 'undo': patchTakeBack(); break;
  }
  return true;
}
// The pointer moves the piece, centred on it (onto a fit close by), once it's really moved since a key.
export function patchHover(x, y) {
  if (!patch.hand || !patch.face) return;
  if (patch.keyAt) { if (Math.hypot(x - patch.keyAt.x, y - patch.keyAt.y) < 24) return; patch.keyAt = null; }
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  patch.face.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(patch.face.matrixWorld), n = new THREE.Vector3(0, 0, 1).transformDirection(patch.face.matrixWorld);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  patch.face.worldToLocal(p);
  const at = [-p.y / S, p.x / S], b = C.bbox(patch.hand.cells);
  const [r, c] = centreOn(at, b.h, b.w);
  if (patch.hole.fit(patch.hand.cells, r, c)) { patch.r = r; patch.c = c; patchClamp(); } else patchSnap(at, 1.2);
}
export function patchTick(dt) {
  const away = !sail.helm.dazed() && patch.away?.hole() ? patch.away : null;
  const want = sail.on && sail.helm.dazed() ? sail.helm.hole : sail.on && away ? away.hole() : null;
  if (want !== (patch.on ? patch.hole : null)) { if (patch.on) patchShut(); if (want) patchOpen(want, want === sail.helm.hole ? null : away); }
  if (!patch.on) return;
  for (const p of patch.slots) {
    if (p.wait > 0) p.wait -= dt;
    if (!p.letter && patch.hand?.from !== p && p.wait <= 0) patchDeal(p);
  }
  // Where the piece in hand would go: green, amber resting on the deck, red if it won't go.
  const hand = patch.hand, f = hand && patch.hole.fit(hand.cells, patch.r, patch.c);
  const kind = !hand ? '' : !f ? 'no' : f.over ? 'over' : 'ok';
  const want2 = hand ? `${hand.cells.map((x) => x.join()).join(';')}|${patch.r},${patch.c}|${kind}` : '';
  if (want2 !== patch.ghostKey) {
    patch.ghostKey = want2;
    if (patch.ghost) { patch.ghost.removeFromParent(); patch.ghost.traverse((o) => o.geometry?.dispose()); patch.ghost = null; }
    if (hand) {
      const g = new THREE.Group(), geo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 0.12), gz = 0.16;
      for (const [r, c] of hand.cells) { const m = new THREE.Mesh(geo, ghostMats[kind]); m.position.set((c + 0.5) * S, -(r + 0.5) * S, gz); g.add(m); }
      g.add(fatOutline(hand.cells, gz + 0.07, kind === 'no' ? '#ffd0c8' : '#fff4d0', 0.05));
      g.position.set(patch.c * S, -patch.r * S, 0);
      patch.face.add(g);
      patch.ghost = g;
    }
  }
}
