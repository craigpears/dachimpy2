// Patching her deck at sea by Carpentry (and the crane's frames, with the same tray and keys).
// (Split out of den.js. The quay's Bilge, to work a lock, is the lock's own: lock.js.)
import * as THREE from 'three';
import { FairDeal } from '../den-deal.js';
import { KEYS as VIEW_KEYS, quarters, centreOn, clampTo, liftTip, UNDO_TIP } from '../den-carp-view.js';
import { held } from '../carpentry-frame.js';
import { PATCH } from '../den-patch.js';
import { C, S, scene, camera, mat, mesh, woodTex, woodMat, cellBox, pieceGroup, outline, rotCW, rotCCW, flip, V3, keys, shake, ray, burst, toast, fatOutline, worldLets, redrawRoom } from './world.js';
import { roomyShapes } from './wall.js';
import { ghostMats } from './pieces.js';
import { cursor } from './raids.js';
import { SLOOP_DECK, sail } from './sea.js';

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
export const patch = { on: false, hole: null, group: null, face: null, wood: null, ghost: null, ghostKey: '', crate: null, slots: [], hand: null, lift: -1, r: 0, c: 0, sq: 0.2, keyAt: null, fair: new FairDeal(C), aways: [] };
/* The same Carpentry, the same tray and keys, for a frame somewhere other than her deck: the crane's
   frames on the cliff's ledge (crane.js), and the race's crane on its neck of land (race.js). Each one's in
   `patch.aways`, and the first with a frame to fill has the board. One is { hole() (the frame to fill, or null), sq
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
/* Every patch's planks off her deck (a new hole, or a new voyage). Every one on her, not just
   `patch.group` (whichever board is open): a crane frame opened since takes that over, and the old
   planks were left on her, over the next hole (the user, 10 Nov: "the carpentry pieces ... from the
   last time I got shot are all still on there and they are blocking the board. I can't even tell
   where it thinks my supposed hole is"). */
export function patchClear() {
  for (const g of (sail.g?.children ?? []).filter((o) => o.userData.deckPatch)) {
    g.removeFromParent();
    g.traverse((o) => { if (o.geometry && o.geometry !== cellBox) o.geometry.dispose(); });
  }
  if (!patch.at) patch.group = patch.face = patch.wood = null;
}
function patchOpen(hole, away = null) {
  if (!away) patchClear();
  Object.assign(patch, { on: true, hole, hand: null, lift: -1, ghostKey: '', keyAt: null, at: away });
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
  // The deck round it a piece may rest on, chalked as every frame's room is (world.js: roomMarks).
  patch.chalk = redrawRoom(face, null, hole, 0.02, 0.015);
  patch.wood = new THREE.Group();
  face.add(patch.wood);
  if (away) { away.mount(g); finishOpen(); return; }
  g.userData.deckPatch = true;   // (under the rowing board while she rows: rowing.js hides it)
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
  patch.lift = -1;
  patch.crate?.removeFromParent();
  if (patch.ghost) { patch.ghost.removeFromParent(); patch.ghost = null; }
  patch.ghostKey = '';
  if (patch.rim) { patch.rim.removeFromParent(); patch.chalk?.removeFromParent(); patch.rim = patch.chalk = null; }
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
  chalkRoom();
  if (hole.done()) {
    burst(at, '#f0d9a8', 14, 2);
    if (patch.at) patch.at.done(hole);
    else toast(hole.over() ? 'Patched, boarded over! She sails on' : 'Patched! She sails on');
  }
}
/* A piece you've placed, picked back up into your hands to fit again: any of them, as at the den's
   frames (Carpentry's frame, src/carpentry-frame.ts, lifts it out). Empty-handed, Space or a click
   picks up the one you're pointing at (patch.lift); Backspace, the last one. A crate's piece in your
   hands goes back to its crate first. */
function patchLift(i) {
  if (patch.hand && !patch.hand.from) return toast('Your hands are full: fit that piece first', false, true);
  if (!patch.hole.laid[i] || patch.hole.done()) return;
  if (patch.hand) patchPutBack();
  const h = held(patch.hole.lift(i));
  const g = patch.wood.children[i];   // (the pieces' groups, in the order they're laid)
  if (g) patch.wood.remove(g);
  patch.hand = { letter: h.letter, cells: h.cells, from: null };
  patch.r = h.r; patch.c = h.c;
  patch.lift = -1;
  chalkRoom();
}
// The room chalked afresh as pieces go in and come out; gone once the hole's filled.
function chalkRoom() {
  if (!patch.face) return;
  if (patch.hole.done()) { patch.chalk?.removeFromParent(); patch.chalk = null; }
  else patch.chalk = redrawRoom(patch.face, patch.chalk, patch.hole, 0.02, 0.015);
}
const patchTakeBack = () => patchLift(patch.hole.laid.length - 1);
// A click on the board: fit the piece in your hands, or pick up the one you're pointing at.
export function patchClick(x, y) {
  patch.keyAt = null;
  patchHover(x, y);
  if (patch.hand) patchPlace();
  else if (patch.lift >= 0) patchLift(patch.lift);
}
/* The prompt, the same on her deck and on the crane's frames: `empty` says what you're at, with
   empty hands; `over` what a piece sticking out means there; `esc` how to leave it, if you can. */
export function patchPrompt(empty, over, esc = '') {
  const hd = patch.hand, l = !hd && patch.hole?.laid[patch.lift];
  if (l) return `${liftTip(l.letter)} · ${UNDO_TIP}${esc}`;
  if (!hd) return `${empty}${patch.hole?.laid.length ? ` · ${UNDO_TIP}` : ''}${esc}`;
  const f = patch.hole?.fit(hd.cells, patch.r, patch.c);
  return (f ? `Space or click: fit the ${hd.letter}${f.over ? over : ''}` : `The ${hd.letter} won't go there`)
    + ` · arrows or mouse move · X/C turn · Z flip · Q/W/A/S: its corners · ${UNDO_TIP}${esc}`;
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
    case 'place': if (hand) patchPlace(); else if (patch.lift >= 0) patchLift(patch.lift); else patchTakeBack(); break;
    case 'undo': patchTakeBack(); break;
  }
  return true;
}
// The pointer moves the piece, centred on it (onto a fit close by), once it's really moved since a key.
// Empty-handed, it points at a piece you've placed (patch.lift), to pick it back up.
export function patchHover(x, y) {
  if (!patch.face) return;
  if (patch.keyAt) { if (Math.hypot(x - patch.keyAt.x, y - patch.keyAt.y) < 24) return; patch.keyAt = null; }
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  patch.face.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(patch.face.matrixWorld), n = new THREE.Vector3(0, 0, 1).transformDirection(patch.face.matrixWorld);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  patch.face.worldToLocal(p);
  const at = [-p.y / S, p.x / S];
  if (!patch.hand) { patch.lift = patch.hole.done() ? -1 : patch.hole.at(Math.floor(at[0]), Math.floor(at[1])); return; }
  const b = C.bbox(patch.hand.cells);
  const [r, c] = centreOn(at, b.h, b.w);
  if (patch.hole.fit(patch.hand.cells, r, c)) { patch.r = r; patch.c = c; patchClamp(); } else patchSnap(at, 1.2);
}
export function patchTick(dt) {
  const away = !sail.helm.dazed() ? patch.aways.find((a) => a.hole()) ?? null : null;
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
