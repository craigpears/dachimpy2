// The crane up the cliff from the hidden cove, and the clifftop lagoon, in 3D: the headland, the
// ledge at its foot (somewhere to moor), the crane's footings waiting, its frames and the crane as
// it goes up, her trip up and down, and the lagoon with its sunk wreck. (The rules: src/den-crane.ts.)
import * as THREE from 'three';
import { CRANE, Crane } from '../den-crane.js';
import { CRANE_RIDE as SAYS } from '../lines/you.js';
import { aboard } from '../den-haul.js';
import { SLOOP_HULL, widthAt } from '../ships.js';
import { H as TH } from '../treasure-haul.js';
import { S, scene, camera, mat, mesh, woodTex, woodMat, pieceGroup, V3, basis, pirate, G, burst, toast, outline, v3, animateWalk } from './world.js';
import { rock } from './land.js';
import { updateStats } from './wall.js';
import { seaX, seaZ, SLOOP_DECK, SLOOP_BEAM, sail, COVE_Y } from './sea.js';
import { patch, patchPrompt } from './sea-puzzles.js';
import { haul, haulOpen } from './treasure.js';
import { wreckMesh } from './checkpoint.js';

/* The user (9 Nov): "could I go somewhere to the side of a cliff and like construct a crane to get
   in?", built "with like the carpentry puzzle", to somewhere of its own, not the lock's cove. So the
   hidden cove's left-hand cliff is a headland, taller than the cove's walls, and at its foot there's
   a ledge cut into the rock: an old smugglers' landing, bollards and rings to moor to, the crane's
   stone footings waiting on the clifftop above it and the first frame's outline chalked on the
   ledge. Sail her alongside it and Space builds a crane up there, by Carpentry (the deck patch's
   tray and keys: sea-puzzles.js), a part at a time: each part's frame is laid on the ledge and
   filled; full, it's sawn to fit (what sticks out falls away as sawdust), you leap up onto the
   clifftop and haul it up by hand on ropes, and it goes into its place: the foot laid on the
   footings, the post raised on it, the jib swung up. The crane is the pieces you fitted. Then its
   windlass, block and rope are rigged on it. (There was an old smugglers' hoist up there that
   hauled the frames up, till the user, 10 Nov: "If you're building a crane, you've literally got a
   crane here that's helping you build the crane".)
   Built, it hauls her up the cliff and swings her round into a still lagoon up on the headland,
   a short, cheesy moment you can skip with Space; and lowers her back down whenever you like.
   In the lagoon an old wreck lies sunk in the clear water, its treasure hauled up by Treasure Haul. */
// `moor`: where she rests in the lagoon ({ p, yaw }), if not where the crane sets her down (capybara.js
// poles her along the shore to the far bank).
export const crane = { rules: new Crane(), W: null, parts: [], hoist: null, slew: 0, said: {}, bubble: null, shot: null, moor: null };
const K = () => crane.rules;
// The headland's top (as far over the hidden cove as ever, now the cove's up at the top of the
// locks), the lagoon's water, and the ledge's (just above the cove's).
const HT = COVE_Y + 4.4, WATER = HT - 0.6, LEDGE_Y = COVE_Y + 0.15;
// The ledge: cut into the foot of the headland, beside her square; the frames lie on it, their top
// row toward the cliff.
const LEDGE_X0 = -34.2, LEDGE_X1 = seaX(CRANE.LEDGE[0]) - 2, LEDGE_Z0 = seaZ(CRANE.LEDGE[1]) + 3.3, LEDGE_Z1 = seaZ(CRANE.LEDGE[1]) - 3.3;
const FRAME_AT = V3((LEDGE_X0 + LEDGE_X1) / 2 + 0.1, LEDGE_Y + 0.38, seaZ(CRANE.LEDGE[1]));
// The crane's post, on the clifftop behind the ledge; its jib's tip (in the post's turning frame,
// from the clifftop), out over her when it's turned to the cove (0) and over the lagoon (π).
const POST = V3(-35.8, HT, seaZ(CRANE.LEDGE[1]));
const FOOT_T = 0.41, POST_TOP = FOOT_T + 8 * CRANE.SQ, JIB_A = 0.33, JIB_Z = 0.41;
const JIB_X = 2.6, TIP = V3(JIB_X + 1.91, POST_TOP + 1.7, JIB_Z);
const HOOK_REST = 1.0;   // how far the hook hangs below the tip
// Where she rests in the lagoon, and her heading there (bows along the shore, out from under the jib).
const REST = V3(-42, WATER, POST.z), REST_YAW = Math.PI / 2;
// The lagoon: an oval up on the headland.
const LAG = { x: -46.6, z: POST.z - 0.5, rx: 9.2, rz: 10 };
// Its shore, not a perfect oval: a wobble round it, a little bay here and there (the crane's side,
// toward the cove, kept to the oval so she's set down clear of it).
const shoreAt = (a) => (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5 ? 1 : 1 + 0.07 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 5 + 2));
/* The lagoon's far bank, across the water from where she's set down: a bank of mud, kept clear of
   reeds, rocks and lily pads, where Umami the capybara's stuck (capybara.js draws him and his bank). Its
   foot's middle out in the water (so the headland's grass is under it, not through it), the angle
   round the shore it's at, and how it leans back. */
const BANK_A = 1.4;
export const BANK = { a: BANK_A, x: LAG.x + Math.cos(BANK_A) * LAG.rx * shoreAt(BANK_A), z: LAG.z - Math.sin(BANK_A) * LAG.rz * shoreAt(BANK_A) + 1.0, yaw: 0, lean: 0.95 };
const nearBank = (a) => Math.abs(Math.atan2(Math.sin(a - BANK_A), Math.cos(a - BANK_A))) < 0.3;
// (the lagoon, for what else is up there: capybara.js)
export const LAGOON_AT = { HT, WATER, LAG, REST, REST_YAW };
const shore = (k = 1, n = 64) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, f = shoreAt(a) * k; return [LAG.x + Math.cos(a) * LAG.rx * f, LAG.z - Math.sin(a) * LAG.rz * f]; });
// Hauling a frame up by hand: you stand on the clifftop at the back of the ledge's notch, the ropes
// up over its lip (LIP) to your hands.
const LIP = V3(LEDGE_X0 - 0.1, HT + 0.08, FRAME_AT.z), HAUL = V3(LEDGE_X0 - 1.0, HT, FRAME_AT.z);
// Its windlass on the crane: behind the post (on the side away from the jib, toward the camera), and
// where you stand to work it, in sight (always over the clifftop, however the crane's turned).
const WINCH = V3(-0.85, FOOT_T, 0.35), STAND = V3(-1.3, FOOT_T, 0.35);

const stoneM = () => mat('#6b6158', { flatShading: true, roughness: 0.95 });
const grassM = mat('#56763a', { roughness: 1 });
const oldWood = mat('#5a4530', { map: woodTex, roughness: 1 });
const ropeM = mat('#c9ab72', { roughness: 0.95 });
const ironM = mat('#33383d', { metalness: 0.6, roughness: 0.45 });
const cyl = new THREE.CylinderGeometry(1, 1, 1, 6);
// A rope (a thin cylinder) stretched between two points.
function stretch(m, a, b, r = 0.035) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.scale.set(r, Math.max(1e-3, len), r);
  if (len > 1e-6) m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(len));
  return m;
}
const rope = (r = 0.035) => { const m = mesh(cyl, ropeM, false); m.userData.r = r; return m; };
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerpA = (a, b, u) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * u; };

// ---------- the headland, the ledge, the footings and the lagoon ----------
/* The headland: one block of rock with a grassy top, the cove's left-hand side, taller than the
   cove's walls, with the ledge cut into its foot and the lagoon's basin let into its top. */
function headland(W) {
  const x0 = -58, x1 = -32, y0 = 45, y1 = 81;   // (the shape's y is -z)
  const outer = new THREE.Shape();
  outer.moveTo(x0, y0);
  for (const [x, y] of [[x1, y0], [x1, -LEDGE_Z0], [LEDGE_X0, -LEDGE_Z0], [LEDGE_X0, -LEDGE_Z1], [x1, -LEDGE_Z1], [x1, y1], [x0, y1]]) outer.lineTo(x, y);
  // (the shape's y is -z; the hole goes round the other way)
  const pool = new THREE.Path(shore().map(([x, z]) => new THREE.Vector2(x, -z)).reverse());
  outer.holes.push(pool);
  const body = mesh(new THREE.ExtrudeGeometry(outer, { depth: HT + 1, bevelEnabled: false, curveSegments: 28 }).rotateX(-Math.PI / 2), stoneM());
  body.position.y = -1;
  const top = mesh(new THREE.ShapeGeometry(outer, 28).rotateX(-Math.PI / 2), grassM, false);
  top.position.y = HT + 0.02;
  top.receiveShadow = true;
  W.g.add(body, top);
  // Boulders down its faces and round the lagoon's rim, as round the cove.
  for (let z = -46; z > -80; z -= 2.6) {
    if (z < LEDGE_Z0 + 0.3 && z > LEDGE_Z1 - 0.3) continue;
    W.g.add(rock(x1 + 0.3, 0.6 + Math.random() * 3.5, z + Math.random(), 0.7 + Math.random() * 0.6));
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + 0.2, k = 1.06 + (i % 3) * 0.05;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.45 || nearBank(a)) continue;   // (the crane's side and the far bank kept clear)
    const f = shoreAt(a) * k;
    W.g.add(rock(LAG.x + Math.cos(a) * LAG.rx * f, HT - 0.1, LAG.z - Math.sin(a) * LAG.rz * f, 0.6 + (i % 4) * 0.2));
  }
}
/* The ledge: a shelf of rock at the cliff's foot, plainly somewhere to moor (the user, 10 Nov: the
   place to stop should be plain): two stout bollards along its edge with a rope's coil on one,
   rope fenders hung down its face, mooring rings. */
function ledge(W) {
  const w = LEDGE_X1 - LEDGE_X0, d = LEDGE_Z0 - LEDGE_Z1;
  const shelf = mesh(new THREE.BoxGeometry(w, LEDGE_Y + 1, d), stoneM());
  shelf.position.set((LEDGE_X0 + LEDGE_X1) / 2, (LEDGE_Y - 1) / 2, (LEDGE_Z0 + LEDGE_Z1) / 2);
  const ring = mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), ironM, false);
  ring.position.set(LEDGE_X1 + 0.03, LEDGE_Y - 0.2, POST.z + 1.8); ring.rotation.y = Math.PI / 2;
  const ring2 = ring.clone(); ring2.position.z = POST.z - 1.8;
  W.g.add(shelf, ring, ring2);
  const bollM = mat('#2d2a27', { metalness: 0.4, roughness: 0.6 }), fenderM = mat('#a8875a', { roughness: 1 });
  for (const s of [1, -1]) {
    const z = POST.z + s * 2.4, b = new THREE.Group();
    const stem = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 10), bollM); stem.position.y = 0.27;
    const cap = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10), bollM); cap.position.y = 0.58;
    b.add(stem, cap);
    if (s > 0) { const coil = mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 14).rotateX(Math.PI / 2), ropeM, false); coil.position.y = 0.12; b.add(coil); }
    b.position.set(LEDGE_X1 - 0.45, LEDGE_Y, z);
    W.g.add(b);
    // (a rope fender hung down the ledge's face beside each)
    const fender = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 8), fenderM); fender.position.set(LEDGE_X1 + 0.12, LEDGE_Y - 0.45, z - s * 0.8);
    W.g.add(fender, stretch(rope(0.02), V3(LEDGE_X1 - 0.1, LEDGE_Y + 0.02, z - s * 0.8), V3(LEDGE_X1 + 0.12, LEDGE_Y - 0.2, z - s * 0.8), 0.02));
  }
}
/* Before it's built: the crane's place waiting, so nothing looks built before it is (the user, 10
   Nov: "I thought we were constructing this crane"): four squared stone footings set in the
   clifftop where its foot will go, and on the ledge the first frame's outline chalked out where
   it'll be laid. Its windlass and block are its own, and come out once it's built (rigCrane); the
   ropes you haul each frame up by are W.haulRopes. */
function footings(W) {
  const pad = new THREE.BoxGeometry(0.5, 0.3, 0.5), padM = mat('#8d8478', { flatShading: true, roughness: 0.9 });
  W.footings = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = mesh(pad, padM); p.position.set(POST.x + x * 0.9, HT + 0.1, POST.z + z * 0.9); W.footings.add(p); }
  W.g.add(W.footings);
  // The first frame's outline, chalked on the ledge: rows across the ledge from the cliff, columns along it.
  const rows = CRANE.PARTS[0].rows, sq = CRANE.SQ, set = new Set(), chalk = mat('#efe9da', { roughness: 1, emissive: '#3a3832' });
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') set.add(`${r},${c}`); }));
  W.outline = new THREE.Group();
  const at = (r, c) => V3(FRAME_AT.x + (r - rows.length / 2) * sq, LEDGE_Y + 0.02, FRAME_AT.z - (c - rows[0].length / 2) * sq);
  for (const id of set) {
    const [r, c] = id.split(',').map(Number);
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (set.has(`${r + a},${c + b}`)) continue;
      // (an edge between rows runs along the ledge, one between columns across it)
      const line = mesh(a ? new THREE.BoxGeometry(0.04, 0.01, sq + 0.04) : new THREE.BoxGeometry(sq + 0.04, 0.01, 0.04), chalk, false);
      line.position.copy(at(r + 0.5 + a * 0.5, c + 0.5 + b * 0.5));
      W.outline.add(line);
    }
  }
  W.g.add(W.outline);
  W.block = blockMesh(); W.block.visible = false;
  W.winch = winchMesh(); W.winch.visible = false;
  W.haulRopes = [0, 1, 2, 3, 4].map(() => { const r = rope(0.025); r.visible = false; return r; });
  W.g.add(W.block, W.winch, ...W.haulRopes);
}
function blockMesh() {
  const g = new THREE.Group();
  const shell = mesh(new THREE.BoxGeometry(0.16, 0.34, 0.26), oldWood);
  const sheave = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 12), ironM, false); sheave.rotation.x = Math.PI / 2;
  g.add(shell, sheave);
  return g;
}
// A windlass: a log drum between two cheeks, a crank at each end.
function winchMesh() {
  const g = new THREE.Group();
  const drum = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), oldWood); drum.rotation.z = Math.PI / 2; drum.position.y = 0.55;
  const coil = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), ropeM, false); coil.rotation.z = Math.PI / 2; coil.position.y = 0.55;
  g.add(drum, coil);
  for (const s of [-1, 1]) {
    const cheek = mesh(new THREE.BoxGeometry(0.08, 0.75, 0.3), oldWood); cheek.position.set(s * 0.5, 0.37, 0);
    const crank = new THREE.Group(); crank.position.set(s * 0.58, 0.55, 0);
    const a = mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), ironM, false); a.position.y = 0.16;
    const h = mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), ironM, false); h.position.set(s * 0.08, 0.32, 0);
    crank.add(a, h);
    g.add(cheek, crank);
    (g.userData.cranks ||= []).push(crank);
  }
  g.userData.drum = drum;
  return g;
}
// The hook that goes under her: an iron hook under a block, and the slings that go round her.
function hookMesh() {
  const g = new THREE.Group();
  const b = blockMesh(); b.scale.setScalar(1.2); g.add(b);
  const hook = mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 10, Math.PI * 1.4), ironM, false); hook.position.y = -0.3; hook.rotation.z = -0.6;
  g.add(hook);
  return g;
}
/* The lagoon, a discovery of its own: still and glassy, dark green and clear (the wreck shows
   through it), fringed with reeds and bulrushes, lily pads with pale flowers lying on it, its rim
   mossy rock. Nothing moves on it but her. */
function lagoon(W) {
  const pond = new THREE.Shape(shore(1.002).map(([x, z]) => new THREE.Vector2(x - LAG.x, -(z - LAG.z))));
  const water = mesh(new THREE.ShapeGeometry(pond, 40).rotateX(-Math.PI / 2), mat('#1f5a50', { roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.8, emissive: '#06221d' }), false);
  water.position.set(LAG.x, WATER, LAG.z);
  water.renderOrder = 2;
  const bed = mesh(new THREE.ShapeGeometry(pond, 40).rotateX(-Math.PI / 2), mat('#2c3a2a', { roughness: 1 }), false);
  bed.position.set(LAG.x, WATER - 3, LAG.z);
  W.g.add(water, bed);
  // Reeds and bulrushes in clumps round the shore (not on the crane's side).
  const reedM = mat('#3f6a2c', { roughness: 1 }), rushM = mat('#5a3a1e', { roughness: 1 }), reed = new THREE.ConeGeometry(0.04, 1, 4);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + 0.13 * (i % 3);
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.6 || nearBank(a)) continue;
    const f = shoreAt(a), cx = LAG.x + Math.cos(a) * (LAG.rx * f - 0.5), cz = LAG.z - Math.sin(a) * (LAG.rz * f - 0.5);
    for (let j = 0; j < 6; j++) {
      const h = 0.9 + ((i * 7 + j * 3) % 5) * 0.18, m = mesh(reed, reedM, false);
      m.scale.set(1, h, 1);
      m.position.set(cx + Math.cos(j * 2.3) * 0.35, WATER + h / 2 - 0.1, cz + Math.sin(j * 2.3) * 0.35);
      m.rotation.set(Math.sin(j * 1.7) * 0.15, 0, Math.cos(j * 1.3) * 0.15);
      W.g.add(m);
      if (j % 3 === 0) { const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 6), rushM, false); r.position.set(m.position.x, WATER + h - 0.25, m.position.z); W.g.add(r); }
    }
  }
  // Lily pads, a few in flower.
  const padM = mat('#3b7a3a', { roughness: 0.7 }), flowerM = mat('#f2dce6', { roughness: 0.6, emissive: '#3a2a30' });
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996, k = 0.45 + (i % 5) * 0.1, x = LAG.x - 1 + Math.cos(a) * LAG.rx * k * 0.9, z = LAG.z + Math.sin(a) * LAG.rz * k * 0.9;
    if (Math.hypot(x - REST.x, z - REST.z) < 3 || (x > LAG.x - 6 && x < REST.x && Math.abs(z - LAG.z) < 2.5) || Math.hypot(x - BANK.x - 1.8, z - BANK.z - 2.6) < 4) continue;   // (clear of her, the haul's board, and her mooring by the far bank)
    const pad = mesh(new THREE.CircleGeometry(0.32 + (i % 3) * 0.08, 10, 0.4, Math.PI * 2 - 0.4).rotateX(-Math.PI / 2), padM, false);
    pad.position.set(x, WATER + 0.03, z); pad.rotation.y = i;
    W.g.add(pad);
    if (i % 4 === 0) { const f = mesh(new THREE.ConeGeometry(0.12, 0.14, 6), flowerM, false); f.position.set(x, WATER + 0.1, z); W.g.add(f); }
  }
  // The old wreck, sunk: her hull down on a bank of sand on the bed, her snapped mast out of the water.
  const wk = wreckMesh();
  wk.position.set(REST.x - 7, WATER - 2.1, REST.z - 0.4);   // (its bow under the far end of the haul's board, its mast clear of it)
  wk.rotation.y = 0.2;
  W.g.add(wk);
}
export function craneWorld() {
  if (crane.W) return crane.W;
  const W = crane.W = { g: new THREE.Group() };
  headland(W); ledge(W); footings(W); lagoon(W);
  // The crane's place: its foot on the clifftop, and a turning frame for its post and jib.
  W.root = new THREE.Group(); W.root.position.copy(POST);
  W.slew = new THREE.Group(); W.root.add(W.slew);
  W.hook = hookMesh(); W.hook.visible = false;
  W.hookRope = rope(0.03); W.hookRope.visible = false;
  W.slings = [0, 1, 2, 3].map(() => { const r = rope(0.025); r.visible = false; return r; });
  W.rig = new THREE.Group(); W.rig.visible = false; W.slew.add(W.rig);   // (its running rope, once it's rigged)
  W.g.add(W.root, W.hook, W.hookRope, ...W.slings);
  scene.add(W.g);
  return W;
}

// ---------- building it: the frames on the ledge ----------
const frameM = mat('#4a3220', { roughness: 1 }), railM = mat('#8a5a30', { map: woodTex });
const railGeo = [new THREE.BoxGeometry(0.06, S + 0.06, 0.1), new THREE.BoxGeometry(S + 0.06, 0.06, 0.1)];
// What sea-puzzles.js needs to play a frame on the ledge with the deck patch's tray and keys.
const away = {
  sq: CRANE.SQ,
  hole: () => (K().building && !crane.hoist && sail.on && K().alongside(sail.helm) ? K().frame : null),
  // On the ledge. A frame left part-built and come back to is laid again as it was, its pieces in it.
  mount(g) {
    g.position.copy(FRAME_AT); g.rotation.set(0, Math.PI / 2, 0);
    g.userData.frame = true;
    crane.ledgeG?.removeFromParent();
    crane.ledgeG = g;
    crane.W.g.add(g);
    for (const p of K().frame?.laid ?? []) {
      const r0 = Math.min(...p.cells.map((q) => q[0])), c0 = Math.min(...p.cells.map((q) => q[1]));
      const pg = pieceGroup(p.cells.map(([r, c]) => [r - r0, c - c0]), woodMat(p.letter));
      pg.position.set(c0 * S, -r0 * S, 0.05);
      patch.wood.add(pg);
    }
  },
  // The frame under the pieces: dark boards, a timber rail round its edge (as the den's frames).
  dress(face, f) {
    const back = new THREE.Group(), set = new Set(f.cells.map(([r, c]) => `${r},${c}`)), sq = new THREE.PlaneGeometry(S, S);
    for (const [r, c] of f.cells) {
      const p = mesh(sq, frameM, false); p.position.set((c + 0.5) * S, -(r + 0.5) * S, -0.46); back.add(p);
      for (const [a, z] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (set.has(`${r + a},${c + z}`)) continue;
        const rail = mesh(railGeo[a ? 1 : 0], railM, false);
        rail.position.set((c + 0.5 + z * 0.5) * S, -(r + 0.5 + a * 0.5) * S, -0.4);
        back.add(rail);
      }
    }
    back.userData.backing = true;
    face.add(back);
  },
  done(f) { startHoist(f); },
};
patch.away = away;
const PART_NAME = { foot: 'foot', post: 'post', jib: 'jib' };
// Where each part goes on the crane: its parent (the crane's place, or the turning frame), and the
// frame's group's place and turn in it. A frame's group: its columns along x, its face up y, its
// rows down z; its middle is the frame's middle.
function partPose(i) {
  const W = crane.W, k = Math.sin(JIB_A), c = Math.cos(JIB_A);
  if (i === 0) return { parent: W.root, p: V3(0, 0.37, 0), q: basis(V3(1, 0, 0), V3(0, 1, 0)) };   // (its length along the jib's way when it's over the cove or the lagoon)
  if (i === 1) return { parent: W.slew, p: V3(0, FOOT_T + 4 * CRANE.SQ, 0.164), q: basis(V3(0, 1, 0), V3(0, 0, 1)) };
  return { parent: W.slew, p: V3(JIB_X, POST_TOP + 0.33, JIB_Z + 0.164), q: basis(V3(c, k, 0), V3(0, 0, 1)) };
}
/* The frame's full: sawn to fit, then you leap up onto the clifftop and haul it up by hand on ropes,
   and it goes into its place: the foot laid on its footings, the post raised on it, the jib swung
   up. A beat at a time (seconds), skipped with Space. */
const HOIST_T = { saw: 0.8, lift: 2.4, place: 1.6 };
const HOIST_ALL = HOIST_T.saw + HOIST_T.lift + HOIST_T.place;
function startHoist(f) {
  const g = patch.group, face = patch.face, wood = patch.wood, i = K().up;
  if (!g) return;
  const ship = f.shipshape();
  // Sawn to fit: what sticks out over the frame falls away as sawdust.
  f.saw().forEach((s, n) => {
    const pg = wood.children[n], p = f.laid[n];
    if (!pg) return;
    const r0 = Math.round(-pg.position.y / S), c0 = Math.round(pg.position.x / S);
    const kept = s.kept.map((j) => [p.cells[j][0] - r0, p.cells[j][1] - c0]);
    for (const j of s.cut) {
      const m = pg.children[j];
      if (m) { burst(m.getWorldPosition(new THREE.Vector3()), '#f0d9a8', 8, 2); m.visible = false; }
    }
    pg.children[pg.children.length - 1].visible = false;
    pg.add(outline(kept, 0.002, '#4a2a12'));
  });
  if (!ship) toast(`Sawn to fit: ${f.over()} square${f.over() > 1 ? 's' : ''} of offcuts`);
  else toast('Shipshape! Not a scrap wasted');
  const pose = partPose(i);
  const ghost = new THREE.Object3D(); pose.parent.add(ghost); ghost.position.copy(pose.p); ghost.quaternion.copy(pose.q);
  ghost.updateMatrixWorld(true);
  const to = { p: ghost.getWorldPosition(new THREE.Vector3()), q: ghost.getWorldQuaternion(new THREE.Quaternion()) };
  pose.parent.remove(ghost);
  crane.hoist = { i, t: 0, g, face, from: { p: g.position.clone(), q: g.quaternion.clone() }, up: g.position.clone().setY(HT + 1.6), to, pose };
}
function hoistTick(dt) {
  const h = crane.hoist, W = crane.W;
  h.t += dt;
  const T = HOIST_T, t = h.t, g = h.g;
  if (t > 0.3) for (const ch of [...h.face.children]) if (ch.userData.backing) h.face.remove(ch);
  const lift = ease((t - T.saw) / T.lift), place = ease((t - T.saw - T.lift) / T.place);
  if (place <= 0) {
    g.position.lerpVectors(h.from.p, h.up, lift);
    g.quaternion.copy(h.from.q);
  } else {
    g.position.lerpVectors(h.up, h.to.p, place);
    g.position.y += Math.sin(place * Math.PI) * 1.2;
    g.quaternion.slerpQuaternions(h.from.q, h.to.q, place);
  }
  // Ropes from the frame's corners up over the lip to your hands while you haul it up (and steady
  // it into its place).
  const hauling = t > T.saw * 0.6 && place < 0.6;
  g.updateMatrixWorld(true);
  const f = K().frame, bx = f?.board, hands = haulHands();
  W.haulRopes.forEach((r, n) => {
    r.visible = hauling && !!bx;
    if (!r.visible) return;
    if (n === 4) { stretch(r, LIP, hands, 0.03); return; }
    const cc = (n & 1 ? bx.c0 + bx.w - CRANE.MARGIN : bx.c0 + CRANE.MARGIN), rr = (n & 2 ? bx.r0 + bx.h - CRANE.MARGIN : bx.r0 + CRANE.MARGIN);
    stretch(r, LIP, h.face.localToWorld(V3(cc * S, -rr * S, 0.1)), 0.025);
  });
  if (t < HOIST_ALL) return;
  landPart();
}
// It's in its place: on the crane for good. The next frame's laid on the ledge.
function landPart() {
  const h = crane.hoist, W = crane.W;
  crane.hoist = null;
  W.haulRopes.forEach((r) => { r.visible = false; });
  for (const ch of [...h.face.children]) if (ch.userData.backing) h.face.remove(ch);
  h.pose.parent.add(h.g);
  if (crane.ledgeG === h.g) crane.ledgeG = null;
  h.g.userData.frame = false;
  h.g.position.copy(h.pose.p); h.g.quaternion.copy(h.pose.q);
  crane.parts.push(h.g);
  burst(h.to.p, '#e8c890', 14, 3);
  for (const e of K().raise()) {
    if (e.kind === 'built') { rigCrane(); toast('The crane\'s built! Space: haul her up'); return; }
  }
  const next = K().build();
  if (next) toast(`The ${PART_NAME[CRANE.PARTS[h.i].name]}'s up! Now its ${PART_NAME[CRANE.PARTS[K().up].name]}`);
}
// Its windlass and block go onto the crane, and its rope's rove from the windlass up the post and
// out along the jib to the block at its tip, the hook under it.
function rigCrane() {
  const W = crane.W;
  W.slew.add(W.winch); W.winch.position.copy(WINCH); W.winch.rotation.set(0, Math.PI / 2, 0); W.winch.visible = true;
  W.slew.add(W.block); W.block.position.copy(TIP); W.block.visible = true;
  W.rig.clear();
  const pts = [V3(WINCH.x, WINCH.y + 0.6, WINCH.z), V3(-0.3, POST_TOP + 0.15, JIB_Z), TIP.clone()];
  for (let i = 0; i + 1 < pts.length; i++) W.rig.add(stretch(rope(0.03), pts[i], pts[i + 1], 0.03));
  W.rig.visible = true;
  W.hook.visible = W.hookRope.visible = true;
  burst(POST.clone().setY(HT + 3), '#e8c890', 20, 3);
}

// ---------- her trip up the cliff and down again ----------
// The jib's tip, the hook resting under it, where you stand at the windlass: in the world, for a turn.
const slewed = (v, s) => V3(POST.x + v.x * Math.cos(s) + v.z * Math.sin(s), POST.y + v.y, POST.z - v.x * Math.sin(s) + v.z * Math.cos(s));
// Alongside the ledge: warped in under the jib's tip, lying along it (her bows out to sea or in).
const poseYaw = () => Math.PI / 2 - sail.helm.pose.d * Math.PI / 2;
const alongYaw = () => (Math.cos(poseYaw() - Math.PI / 2) >= -1e-6 ? Math.PI / 2 : -Math.PI / 2);
const ALONG_X = POST.x + TIP.x;
const coveSpot = () => ({ p: V3(ALONG_X, COVE_Y, seaZ(CRANE.LEDGE[1])), yaw: alongYaw() });
const lagoonSpot = () => ({ p: REST.clone(), yaw: REST_YAW });
const TOP = HT + 1.2;   // her (deck - SLOOP_DECK) up the cliff: her keel clear of the clifftop
function haulUp() {
  if (!K().haul()) return;
  sail.helm.stop();
  const up = K().trip.to === 'lagoon', from = up ? coveSpot() : lagoonSpot(), to = up ? lagoonSpot() : coveSpot();
  const s0 = up ? 0 : Math.PI, hang = s0 + Math.PI / 2;
  crane.go = { up, from, to, s0, s1: up ? Math.PI : 0, flip: Math.abs(Math.atan2(Math.sin(from.yaw - hang), Math.cos(from.yaw - hang))) > Math.PI / 2 ? Math.PI : 0, drip: 0 };
  document.body.classList.add('cine');
  rigged(false);
  crane.bubble ||= (() => { const el = document.createElement('div'); el.className = 'label say'; el.style.display = 'none'; document.body.append(el); return el; })();
}
// Her mast, sails and guns struck while she hangs from the crane (they'd foul the jib), and up again.
export function rigged(on) {
  const g = sail.g;
  for (const o of [...(g.userData.sails || []), ...(g.userData.rig || [])]) o.visible = on;
  for (const side of ['L', 'R']) if (g.userData.guns?.[side]) g.userData.guns[side].visible = on;
}
function arrive(where) {
  const go = crane.go;
  crane.go = null;
  document.body.classList.remove('cine');
  if (crane.bubble) crane.bubble.style.display = 'none';
  rigged(true);
  crane.slew = go ? go.s1 : where === 'lagoon' ? Math.PI : 0;
  for (const r of crane.W.slings) r.visible = false;
  if (where === 'lagoon') {
    if (!crane.said.lagoon) { crane.said.lagoon = true; toast('A hidden lagoon, and a wreck sunk in it!'); }
    else toast('Up in the lagoon');
  } else { crane.warp = 1; toast('Back down in the cove'); }
}
// Who says what, when: the cheesy bit (the words: src/lines/you.ts).
function says(go, b) {
  if (b.leap < 1) return go.up ? SAYS.up : SAYS.down;
  if (b.rise < 0.5) return SAYS.heave;
  if (b.rise < 1) return SAYS.ho;
  if (b.swing < 1) return SAYS.easy;
  if (b.lower < 1) return SAYS.paint;
  if (b.back < 1) return SAYS.wheee;
  return go.up ? SAYS.lagoon : SAYS.cove;
}
// Her trip, a tick at a time; false once she's there.
function tripTick(dt) {
  const go = crane.go, W = crane.W;
  for (const e of K().tick(dt)) if (e.kind === 'arrive') { arrive(e.where); return false; }
  const b = K().beat();
  if (!b) return false;
  const s = go.s0 + (go.s1 - go.s0) * ease(b.swing);
  crane.slew = s;
  W.slew.rotation.y = s;
  const tip = slewed(TIP, s), hang = s + Math.PI / 2 + go.flip;
  const under = V3(tip.x, 0, tip.z);
  const rise = ease(b.rise), lower = ease(b.lower);
  let p, yaw;
  if (b.rise < 1) {
    p = V3(0, go.from.p.y + (TOP - go.from.p.y) * rise, 0);
    const k = Math.min(1, rise * 2.5);
    p.x = go.from.p.x + (under.x - go.from.p.x) * k; p.z = go.from.p.z + (under.z - go.from.p.z) * k;
    yaw = lerpA(go.from.yaw, hang, Math.min(1, rise * 2));
  } else if (b.swing < 1) {
    // She swings out, lagging behind the jib as it turns.
    const tan = V3(-Math.sin(s), 0, -Math.cos(s)), lag = -Math.sin(Math.PI * b.swing) * 0.7 * Math.sign(go.s1 - go.s0);
    p = V3(under.x + tan.x * lag, TOP, under.z + tan.z * lag);
    yaw = hang + Math.sin(b.swing * Math.PI * 2) * 0.12;
  } else if (b.back < 1 || b.lower < 1) {
    const bk = ease(b.back);
    p = V3(under.x + (go.to.p.x - under.x) * bk, TOP + (go.to.p.y - TOP) * lower, under.z + (go.to.p.z - under.z) * bk);
    yaw = lerpA(hang, go.to.yaw, bk);
  } else { p = go.to.p.clone(); yaw = go.to.yaw; }
  const t = performance.now() / 1000;
  const hanging = b.leap >= 1 && b.lower < 1;
  sail.g.position.set(p.x, p.y + (hanging ? Math.sin(t * 3) * 0.04 : Math.sin(t * 0.9) * 0.05), p.z);
  sail.g.rotation.set(hanging ? Math.sin(t * 2.3) * 0.05 : 0, yaw, hanging ? Math.sin(t * 1.7) * 0.06 : 0);
  // Dripping as she comes up out of the water; a splash as she goes down into it.
  if (b.rise > 0 && b.rise < 1 && (go.drip -= dt) < 0) { go.drip = 0.1; burst(V3(p.x + (Math.random() - 0.5) * 2, p.y - 0.4, p.z + (Math.random() - 0.5)), '#cdeefa', 3, 0.8); }
  if (b.lower >= 1 && !go.splash) { go.splash = true; burst(V3(p.x, go.to.p.y + 0.3, p.z), '#e6f3f6', 30, 4); burst(V3(p.x, go.to.p.y + 0.3, p.z), '#9fd4ec', 16, 3); }
  // The hook: down to her, then with her; back up under the tip once she's afloat.
  const deckY = sail.g.position.y + SLOOP_DECK, rest = tip.y - HOOK_REST;
  let hy;
  if (b.leap < 1) hy = rest + (go.from.p.y + SLOOP_DECK + 1.4 - rest) * ease(b.leap);
  else if (b.lower < 1) hy = deckY + 1.4;
  else hy = (go.to.p.y + SLOOP_DECK + 1.4) + (rest - go.to.p.y - SLOOP_DECK - 1.4) * ease(b.back);
  W.hook.position.set(tip.x, hy, tip.z);
  stretch(W.hookRope, tip, W.hook.position.clone().setY(hy + 0.2), 0.03);
  W.slings.forEach((r, n) => {
    r.visible = b.leap >= 1 && b.lower < 1;
    if (r.visible) stretch(r, W.hook.position.clone().setY(hy - 0.35), sail.g.localToWorld(V3(n & 1 ? 1.3 : -1.3, SLOOP_DECK - 0.4, (n & 2 ? 1 : -1) * (widthAt(SLOOP_HULL, n & 1 ? 1.3 : -1.3, SLOOP_DECK - 0.4) + 0.03))), 0.025);   // (round her sides, just outside her)
  });
  // You: up to the windlass in a leap, winding (or leaning on the jib as it swings), and a leap
  // down onto her deck at the end.
  const stand = slewed(STAND, s), tiller = sail.g.localToWorld(V3(-1.15, SLOOP_DECK, 0));
  let at;
  if (b.leap < 1) { const u = ease(b.leap); at = new THREE.Vector3().lerpVectors(go.leapFrom ||= tiller.clone(), stand, u); at.y += Math.sin(u * Math.PI) * 2.5; }
  else if (b.lower < 1) at = stand;
  else { const u = ease(b.back); at = new THREE.Vector3().lerpVectors(stand, tiller, u); at.y += Math.sin(u * Math.PI) * 2.5; }
  pirate.x = at.x; pirate.z = at.z;
  pirate.g.position.copy(at);
  const w = slewed(WINCH, s);
  pirate.g.rotation.set(0, b.leap >= 1 && b.lower < 1 ? Math.atan2(w.x - stand.x, w.z - stand.z) : pirate.g.rotation.y, 0);
  animateWalk(pirate, false, dt);
  pirate.g.position.y = at.y;
  const winding = (b.rise > 0 && b.rise < 1) || (b.lower > 0 && b.lower < 1);
  if (winding) { pirate.arms[0].rotation.x = -1.2 + Math.sin(t * 9) * 0.6; pirate.arms[1].rotation.x = -1.2 - Math.sin(t * 9) * 0.6; }
  else if (b.swing > 0 && b.swing < 1) { pirate.arms[0].rotation.x = pirate.arms[1].rotation.x = -1.5; }
  for (const c of W.winch.userData.cranks || []) c.rotation.x = winding ? t * 9 : c.rotation.x;
  // The bubble over your head.
  const el = crane.bubble;
  el.textContent = says(go, b);
  v3.set(at.x, at.y + 2.3, at.z).project(camera);
  el.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  el.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  el.style.display = v3.z > 1 ? 'none' : '';
  return true;
}

// ---------- the lagoon's wreck ----------
function haulLagoon() {
  const s = K().salvage;
  if (!K().canHaulWreck()) return false;
  const ry = sail.g.rotation.y, side = V3(Math.sin(ry), 0, Math.cos(ry));   // her own +z: abeam
  const to = V3(LAG.x - REST.x, 0, LAG.z - REST.z), k = Math.sign(to.dot(side)) || 1, sq = 0.45;
  const at = V3(REST.x, WATER + 0.12, REST.z).addScaledVector(side, k * (SLOOP_BEAM / 2 + 0.35 + TH * sq / 2));   // (her half-beam, a gap, half the board)
  haulOpen({
    salvage: s, at, yaw: Math.atan2(k * side.x, k * side.z), sq,
    deck: () => sail.g.localToWorld(V3(0.9, SLOOP_DECK + 0.1, 0)),
    rig: { up: SLOOP_DECK + 0.2 - 0.12, out: 0.35 },
    stay: () => sail.on && K().where === 'lagoon' && !K().trip,
    onDone: (n) => { G.gold += n; updateStats(); toast(aboard(n)); },
  });
  return true;
}

// ---------- the keys, the prompt and each tick ----------
// Up in the lagoon, on her way, or watching a part go up: no pins, no moves.
export const craneHolds = () => !!crane.hoist || !!K().trip || K().where === 'lagoon';
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
export function craneKey(key) {
  if (!sail.on) return false;
  const go = key === ' ' || key === 'enter';
  if (crane.hoist || K().trip) {
    if (go || key === 'escape') { if (crane.hoist) { crane.hoist.t = HOIST_ALL; hoistTick(0); } else { const e = K().skip(); if (e.length) arrive(e[0].where); } }
    return key !== 'p';
  }
  if (K().building && patch.on && patch.at) {
    if (key === 'escape') { K().leave(); toast('The frame can wait: it stays on the ledge as it is'); return true; }
    return !VIEW.includes(key);
  }
  if (K().where === 'lagoon') {
    if (go && K().canHaulWreck()) haulLagoon();
    else if (go || key === 'h') haulUp();
    return !VIEW.includes(key);
  }
  if (go && K().alongside(sail.helm)) {
    if (K().built()) haulUp();
    else {
      const first = !K().frame && K().up === 0;
      K().build();
      if (first) toast('A crane, by Carpentry: first its foot');
    }
    return true;
  }
  return false;
}
export function cranePrompt() {
  if (!sail.on) return '';
  if (crane.hoist || K().trip) return 'Space: skip';
  if (patch.on && patch.at) {
    const name = PART_NAME[CRANE.PARTS[K().up].name];
    return patchPrompt(`The crane's ${name} (${K().up + 1} of ${CRANE.PARTS.length}) · 1, 2, 3: a piece`, ' (the spare gets sawn off)', ' · Esc: leave it for now');
  }
  if (K().where === 'lagoon') {
    return K().canHaulWreck() ? 'The clifftop lagoon · Space: haul up the wreck\'s treasure · H: lower her down'
      : 'The clifftop lagoon · Space or H: lower her back down to the cove';
  }
  if (K().alongside(sail.helm)) {
    if (K().built()) return 'Under the crane · Space: haul her up the cliff';
    return K().frame || K().up ? `Alongside the ledge · Space: back to building the crane (its ${PART_NAME[CRANE.PARTS[K().up].name]})` : 'Alongside the ledge · Space: build a crane on the ledge to haul her up the cliff (Carpentry)';
  }
  return '';
}
// Your hands on the ropes while you haul a frame up, on the clifftop at the back of the ledge.
const haulHands = () => V3(pirate.x + 0.35, HT + 1.0, pirate.z);
// Hauling a frame up: a leap up from the ledge onto the clifftop as it's sawn, then hand over hand.
function standHauling() {
  const h = crane.hoist, u = ease(Math.min(1, h.t / HOIST_T.saw)), t = performance.now() / 1000;
  const from = V3(LEDGE_X0 + 0.55, LEDGE_Y, LEDGE_Z0 - 0.35), at = new THREE.Vector3().lerpVectors(from, HAUL, u);
  at.y += Math.sin(u * Math.PI) * 2.2;
  pirate.x = at.x; pirate.z = at.z;
  pirate.g.position.copy(at);
  pirate.g.rotation.set(0, Math.PI / 2, 0);   // (facing out over the cove, the ropes in his hands)
  const pulling = h.t > HOIST_T.saw && h.t < HOIST_T.saw + HOIST_T.lift;
  pirate.arms[0].rotation.x = pulling ? -1.3 + Math.sin(t * 8) * 0.5 : -1.1;
  pirate.arms[1].rotation.x = pulling ? -1.3 - Math.sin(t * 8) * 0.5 : -1.1;
}
// You at her tiller, facing her bow; or, while you build, ashore on the ledge at the frame's end, so
// others see you building (as at the den's frames).
function standAboard() {
  if (crane.hoist) return standHauling();
  if (patch.on && patch.at) {
    pirate.x = LEDGE_X0 + 0.55; pirate.z = LEDGE_Z0 - 0.35;
    pirate.g.position.set(pirate.x, LEDGE_Y, pirate.z);
    pirate.g.rotation.set(0, Math.PI, 0);
    return;
  }
  sail.g.updateMatrixWorld(true);
  const at = sail.g.localToWorld(V3(-1.15, SLOOP_DECK, 0)), yaw = sail.g.rotation.y;
  pirate.x = at.x; pirate.z = at.z; pirate.g.position.copy(at);
  pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
}
// Each tick, after sailTick has drawn her where the helm has her.
export function craneTick(dt) {
  const W = craneWorld(), h = sail.helm;
  if (K().building && !crane.hoist && !K().alongside(h)) K().leave();
  // Her mast and sails struck while you build (they'd be in your way, looking down on the ledge).
  const atFrame = !!(patch.on && patch.at) || !!crane.hoist;
  if (!K().trip && (atFrame || crane.struck)) { rigged(!atFrame); crane.struck = atFrame; }
  document.body.classList.toggle('hauling', !!crane.hoist || !!K().trip || haul.on);   // (the sailing bar out of the way while a part goes up)
  if (crane.hoist) hoistTick(dt);
  if (!crane.go || !K().trip) W.slew.rotation.y = crane.slew;
  if (!K().built()) { W.hook.visible = W.hookRope.visible = false; }
  else if (!K().trip) {
    const tip = slewed(TIP, crane.slew);
    W.hook.position.set(tip.x, tip.y - HOOK_REST, tip.z);
    stretch(W.hookRope, tip, W.hook.position.clone().setY(tip.y - HOOK_REST + 0.2), 0.03);
  }
  if (K().trip && crane.go && tripTick(dt)) return;
  // Stopped by the ledge, she's warped in alongside it (and back out as she sails off).
  const by = K().where === 'cove' && sail.on && h.pose.c === CRANE.LEDGE[0] && h.pose.r === CRANE.LEDGE[1] && h.idle() && !h.oars;
  if (K().where === 'cove') crane.warp = Math.max(0, Math.min(1, (crane.warp ?? 0) + (by ? dt : -dt * 2) * 1.2));
  if (crane.warp > 0 && K().where === 'cove') {
    const u = ease(crane.warp);
    sail.g.position.x += (ALONG_X - sail.g.position.x) * u;
    sail.g.position.z += (seaZ(CRANE.LEDGE[1]) - sail.g.position.z) * u;
    sail.g.rotation.y = lerpA(sail.g.rotation.y, alongYaw(), u);
    if (sail.on) standAboard();
  }
  // The crane's place waiting: its footings (its foot's laid on them, and they stay under it), the
  // first frame's outline chalked on the ledge till a frame's laid there.
  W.outline.visible = !K().built() && K().up === 0 && !K().frame && !crane.ledgeG;
  // In the lagoon: she rests out from under the jib, you at her tiller.
  if (K().where === 'lagoon') {
    const t = performance.now() / 1000, m = crane.moor ?? { p: REST, yaw: REST_YAW };
    sail.g.position.set(m.p.x, WATER + Math.sin(t * 0.9) * 0.03, m.p.z);
    sail.g.rotation.set(Math.sin(t * 0.7) * 0.01, m.yaw, Math.sin(t * 0.55) * 0.01);
    if (sail.on) standAboard();
  }
  // The first time she's stopped in the cove, the ledge is pointed out.
  if (sail.on && !crane.said.ledge && sail.sea.cove.has(`${h.pose.c},${h.pose.r}`) && h.idle() && K().where === 'cove') {
    crane.said.ledge = true;
    toast('A ledge under the left-hand cliff, somewhere to moor her: stop alongside it');
  }
}
// The camera: on the cliff while a part goes up, and on her trip up and down.
export function craneCam() {
  if (!sail.on) return null;
  if (crane.hoist) return { look: V3(-34, HT * 0.6, POST.z), dist: 17, tilt: 0.3, yaw: 0.7 };
  const b = K().beat();
  if (!b || !crane.go) return null;
  const go = crane.go, u = ease(b.swing), from = go.up ? 0 : 1, k = from + (1 - 2 * from) * u;   // 0 over the cove, 1 over the lagoon
  if (b.back >= 1) return go.up ? { look: V3(LAG.x + 2, WATER, LAG.z), dist: 17, tilt: 0.7, yaw: 1.0 } : { look: V3(-31, COVE_Y + 1, POST.z), dist: 18, tilt: 0.45, yaw: 1.2 };
  // (side on to the crane, so you see the jib swing her round from the cove to the lagoon)
  return { look: V3(-31.5 - 8 * k, HT + 0.5, POST.z), dist: 20, tilt: 0.3 + 0.1 * k, yaw: 0.35 };
}
/* A cheat (menus.js, "Umami's rescue"): the crane built at once, each part's frame filled for you
   (`tile(cells)`: pieces that fill them, { letter, shape, dr, dc }) and put in its place as if hauled
   up, and her set down in the lagoon. */
export function craneCheat(tile) {
  craneWorld();
  const R = K();
  while (!R.built()) {
    const i = R.up, f = R.build(), b = f.board;
    for (const p of tile(f.open())) f.put(p.letter, p.shape, p.dr, p.dc);
    // (as the deck patch's tray lays a frame: sea-puzzles.js)
    const g = new THREE.Group(), flat = new THREE.Group(), face = new THREE.Group();
    g.scale.setScalar(CRANE.SQ / S);
    flat.rotation.x = -Math.PI / 2;
    face.position.set(-(b.c0 + b.w / 2) * S, (b.r0 + b.h / 2) * S, 0);
    g.add(flat); flat.add(face);
    for (const p of f.laid) {
      const r0 = Math.min(...p.cells.map((q) => q[0])), c0 = Math.min(...p.cells.map((q) => q[1]));
      const pg = pieceGroup(p.cells.map(([r, c]) => [r - r0, c - c0]), woodMat(p.letter));
      pg.position.set(c0 * S, -r0 * S, 0.05);
      face.add(pg);
    }
    const pose = partPose(i);
    pose.parent.add(g); g.position.copy(pose.p); g.quaternion.copy(pose.q);
    crane.parts.push(g);
    R.raise();
  }
  rigCrane();
  R.where = 'lagoon';
  crane.slew = Math.PI;
  crane.said.lagoon = crane.said.ledge = true;
}
// A new game (or sailing put back): no crane, its footings waiting, her back in the cove.
export function craneReset() {
  const W = crane.W;
  if (crane.go) arrive('cove');
  crane.rules = new Crane();
  crane.hoist = null; crane.go = null; crane.slew = 0; crane.said = {}; crane.ledgeG = null; crane.moor = null;
  document.body.classList.remove('cine');
  if (!W) return;
  for (const g of crane.parts) g.removeFromParent();
  crane.parts = [];
  W.g.add(W.winch); W.winch.visible = false;
  W.g.add(W.block); W.block.visible = false;
  W.rig.visible = false; W.hook.visible = W.hookRope.visible = false;
  W.haulRopes.forEach((r) => { r.visible = false; });
  // (any frame left on the ledge)
  for (const ch of [...W.g.children]) if (ch.userData.frame) W.g.remove(ch);
}
