// The sailing sea and the sloop, in 3D: the water, rocks, cliffs, the canal's water and pins.
// (Its locks: lock.js.) (Split out of den.js.)
import * as THREE from 'three';
import { SAIL, LAY, Sea, Helm } from '../den-sail.js';
import { ends, gatesOf } from '../den-lock.js';
import { Broadside } from '../den-guns.js';
import { Wind } from '../den-wind.js';
import { scene, mat, mesh, canvasTex, woodTex, V3, flagMat, flagpole, burst } from './world.js';
import { rock } from './land.js';
import { gunMesh } from './gundeck.js';
import { hullGeo } from './raids.js';

// ---------- sailing: the old sloop in the cove ----------
/* A first go at sailing (the user, 9 Nov: "how you end up getting a ship? ... a ship would just be
   waiting in the cove"). Once the siege is over and their ship's gone, there's an old sloop left
   at anchor off the left of the beach. Walk down to the water by her and board, and the camera
   pulls out over the sea: click the water to drop a pin, and she sails there herself on Battle
   Navigation's moves, a turn at a time (src/den-sail.ts). W, A, D put in a forward, left or right
   yourself, played ahead of the pilot's. The board's squares are there but not drawn; the square
   you're pointing at shows faintly, and the course ahead is dotted on the water. Rocks stand out
   of the sea as stacks (you can see them from the den too). Sail back to her mooring to go ashore.
   She has a gun each side: Q fires the port gun, E the starboard, as she sails, once they're
   loaded by Gunnery (js/den/sea-guns.js). The sea has its lay (LAY in src/den-sail.ts): a trade
   wind out to a junction, on to the imperial checkpoint (checkpoint.js) and back home on another,
   and a canal up through a chain of locks and down again round the checkpoint, the hidden cove off
   it at the top; the checkpoint's guns shoot at her, and a hit holes her deck: she's dazed till you
   patch it by Carpentry (patchOpen). Each lock is worked by Bilge, from a board on the quay beside
   it, an old pump at its head (lock.js). */
export const SEA_X0 = SAIL.X0;   // (where it was before the board grew out to the right)
export const seaX = (c) => SEA_X0 + (c + 0.5) * SAIL.CELL, seaZ = (r) => SAIL.Z0 - (r + 0.5) * SAIL.CELL;
export const SLOOP_DECK = 0.75;
export const sail = { on: false, sea: new Sea(9), helm: null, g: null, rocks: null, pin: null, hover: null, dots: [], sig: '', hudSig: '', seen: false, heel: 0, bumpT: 0, guns: new Broadside(), rockAt: new Map(), world: null, riding: false, said: {} };
// The wind she sails by (src/den-wind.ts; drawn in wind.js).
sail.sea.breeze = new Wind(9);
sail.helm = new Helm(sail.sea);
// Each lock lifts the canal's water this much; its banks stand BANK above it (CLIFF_H, a lock's
// lift up: the first lock's banks, as they always were).
export const LIFT = 1.6, BANK = 1.8, CLIFF_H = LIFT + BANK;
// The hidden cove's water, up at the top of the locks (the crane's ledge is just above it: crane.js).
export const COVE_Y = LIFT * LAY.COVE.level;
// The water's height on a square: the sea's, the canal's, or a lock's as it is just now.
export const liftAt = (c, r) => LIFT * (sail.helm.lockAt(c, r)?.height() ?? sail.sea.level(c, r));
// The top of the cliff on a square: BANK over the highest water beside it (a lock counted full), and
// never below CLIFF_H.
export function bankTop(c, r) {
  let top = 1;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const i = sail.sea.lockAt(c + a, r + b), lv = i >= 0 ? sail.sea.locks[i].low + 1 : sail.sea.level(c + a, r + b);
    top = Math.max(top, lv);
  }
  return LIFT * top + BANK;
}
// Her, smaller than their ship: one mast, a square sail and a topsail, a bowsprit, a tiller at the
// stern, weathered planks, and your own flag at the masthead. Beamy enough for her two rowers to sit
// side by side, each at their own sweep (the user, 10 Nov: "make the ship a little wider so the
// little guys can sit next to each other"): 2 across, from 1.7; and for her two guns to stand
// straight across from each other, clear of each other as they run in (10 Nov: "they should be just
// cannons on opposite sides of the ship, but in the same slots each side. I don't know if it needs
// to make the ship a bit wider"): 2.3. (Her length, as a lock holds her: HER in src/den-lock.ts.)
export const SLOOP_BEAM = 2.3;
export function sloopMesh() {
  const g = new THREE.Group(), hullM = mat('#5e4128', { map: woodTex }), deckM = mat('#9a7a55', { map: woodTex }), spar = mat('#4a2f1a', { map: woodTex });
  const B = SLOOP_BEAM;
  const hull = mesh(hullGeo(4.4, B, 1.3), hullM);
  hull.position.y = SLOOP_DECK - 1.3;
  const deck = mesh(hullGeo(4.25, B - 0.15, 0.05), deckM);
  deck.position.y = SLOOP_DECK - 0.02;
  const stripe = mesh(hullGeo(4.46, B + 0.04, 0.1), mat('#d8c9a0'));
  stripe.position.y = SLOOP_DECK - 0.32;
  g.add(hull, deck, stripe);
  const stern = mesh(new THREE.BoxGeometry(0.9, 0.35, B * 0.87), hullM);
  stern.position.set(-1.65, SLOOP_DECK + 0.17, 0);
  const tiller = mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), spar);
  tiller.position.set(-1.6, SLOOP_DECK + 0.5, 0);
  const sprit = mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.4, 6), spar);
  sprit.rotation.z = -Math.PI / 2 + 0.25; sprit.position.set(2.6, SLOOP_DECK + 0.2, 0);
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), spar);
  mast.position.set(0.35, SLOOP_DECK + 2.1, 0);
  g.add(stern, tiller, sprit, mast);
  const sailM = mat('#e9dfc8', { side: THREE.DoubleSide, roughness: 0.95 });
  for (const [y, w, ht] of [[1.45, 2, 1.6], [3.1, 1.4, 0.9]]) {
    const geo = new THREE.PlaneGeometry(w, ht, 8, 4), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.cos(pos.getX(i) / w * Math.PI) * 0.22 * (0.6 + 0.4 * Math.cos(pos.getY(i) / ht * Math.PI)));
    geo.computeVertexNormals();
    const cloth = mesh(geo, sailM, false), yard = mesh(new THREE.CylinderGeometry(0.035, 0.035, w + 0.25, 6), spar, false);
    cloth.position.y = -ht / 2; yard.rotation.z = Math.PI / 2;
    const arm = new THREE.Group();
    arm.add(cloth, yard);
    arm.position.set(0.35, SLOOP_DECK + y + ht / 2, 0);
    arm.rotation.y = Math.PI / 2 - 0.45;   // square across her, braced round a little so they show from the side too
    g.add(arm);
    (g.userData.sails ||= []).push(arm);
  }
  const fl = flagpole(0.6, flagMat);
  fl.position.set(0.35, SLOOP_DECK + 4.15, 0);
  g.add(fl);
  g.userData.rig = [mast, fl];   // (struck, with her sails, while you patch a hole in her deck)
  // A gun each side, a smaller copy of the gun tower's, muzzle out over her side (port is her left):
  // a matching pair, in the same slot each side, straight across from each other, between her mast
  // and the tiller. Each runs in and out along its slide (js/den/sailing.js runs it in, by its
  // userData.z, when it's fired), the slide far enough out from her middle that the two, both run
  // in at once, still clear each other.
  g.userData.guns = {};
  for (const side of ['L', 'R']) {
    const slide = new THREE.Group(), gun = gunMesh();
    slide.position.set(-0.3, SLOOP_DECK, side === 'L' ? -0.44 : 0.44);
    slide.rotation.y = side === 'L' ? 0 : Math.PI;   // (its -z out over her side)
    gun.scale.setScalar(0.55);
    gun.position.z = gun.userData.z = -0.36;   // (out along it: her muzzle 1.2 from her middle)
    slide.add(gun);
    g.add(slide);
    g.userData.guns[side] = gun;
  }
  g.rotation.order = 'YXZ';   // (turned to her heading, then heeled over about her own length)
  return g;
}
// The rocks: sea stacks, a clump of boulders on each square; the harbour's arms at the canal's
// mouth as rocky spurs out from the cliff (harbourSpur).
export function seaRocks() {
  const g = new THREE.Group(), harbour = new Set(LAY.HARBOUR.map(([c, r]) => `${c},${r}`));
  for (const id of sail.sea.rocks) {
    if (sail.sea.cliff.has(id) || sail.sea.works.has(id)) continue;   // (the cliff's drawn with the cove: seaWorld; the checkpoint and the wreck by checkpoint.js)
    if (harbour.has(id)) { const s = harbourSpur(id, harbour); g.add(s.g); sail.rockAt.set(id, s.rocks); continue; }
    const [c, r] = id.split(',').map(Number), x = seaX(c), z = seaZ(r), here = [];
    for (let i = 0; i < 3; i++) here.push(rock(x + (Math.random() - 0.5) * 2.2, 0.2 + Math.random() * 0.4, z + (Math.random() - 0.5) * 2.2, 0.9 + Math.random() * 0.8));
    g.add(...here);
    sail.rockAt.set(id, here);
  }
  scene.add(g);
  return g;
}
/* A square of the harbour's arms (LAY.HARBOUR, 10 Nov: "some protruding rocks, almost like it's a
   bit of a harbour"): the cliff's own rock running on out from its foot, its top sloping down from
   just under the clifftop toward the sea and dropping into it at the arm's end, rough-hewn (each
   corner nudged by where it is, so the squares of an arm meet as one ridge), boulders tumbled
   round its foot and one on its back. */
const SPUR = { FOOT: 2.9, FALL: 0.12, LOW: 0.7, END: 0.35, ROUGH: 0.45 };
const nudge = (x, z, k) => { const s = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return s - Math.floor(s) - 0.5; };
function harbourSpur(id, harbour) {
  const [c, r] = id.split(',').map(Number), S = SAIL.CELL, x0 = seaX(c), z0 = seaZ(r);
  const face = seaZ(LAY.PLATEAU.r0 - 0.5);   // (the cliff's foot: rows grow out to sea, -z)
  const end = !harbour.has(`${c},${r - 1}`);   // (nothing further out toward the den: the arm's end)
  const geo = new THREE.BoxGeometry(S, 1, S, 4, 1, 4), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + x0, z = pos.getZ(i) + z0, top = pos.getY(i) > 0, out = z - face;
    let y = -1;
    if (top) {
      y = Math.max(SPUR.LOW, SPUR.FOOT - out * SPUR.FALL) + nudge(x, z, 1) * SPUR.ROUGH;
      if (end && pos.getZ(i) > S / 2 - 0.01) y = SPUR.END;   // (its end drops into the sea)
      else if (end && pos.getZ(i) > S / 4 - 0.01) y *= 0.7;
    }
    // (rough sides, but tight against the cliff)
    const dz = out < 0.01 ? -0.3 : nudge(x, z, 2) * SPUR.ROUGH;
    pos.setXYZ(i, x - x0 + nudge(x, z, 3) * SPUR.ROUGH, y, z - z0 + dz);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group(), body = mesh(geo, stoneM);
  body.position.set(x0, 0, z0);
  g.add(body);
  const rocks = [];
  const h = Math.max(SPUR.LOW, SPUR.FOOT - (z0 - face) * SPUR.FALL);
  for (let i = 0; i < 3; i++) rocks.push(rock(x0 + (Math.random() - 0.5) * 3.6, 0.15 + Math.random() * 0.3, z0 + (Math.random() - 0.5) * 3.6, 0.8 + Math.random() * 0.6));
  rocks.push(rock(x0 + (Math.random() - 0.5) * 1.6, (end ? 0.6 : h) + 0.1, z0 + (Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 0.4));
  g.add(...rocks);
  return { g, rocks };
}
/* The lay of the sea: the trade winds as streaks of white water racing along their lanes, a yellow
   buoy at the junction, and the high ground the canal's cut through, its cliffs stepping up beside
   each stretch of the canal's water, the hidden cove's up at the top. (Its locks: lock.js.) */
export const coveM = mat('#2f86b0', { roughness: 0.3, transparent: true, opacity: 0.88, emissive: '#0f3f5e' });
export const stoneM = mat('#6b6158', { flatShading: true, roughness: 0.95 }), grassM = mat('#5f7d3a', { roughness: 1 });
export function seaWorld() {
  const W = { g: new THREE.Group(), lanes: [] };
  for (const { at: [c, r], d, n } of LAY.LANES) {
    const tex = canvasTex(64, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(240,250,252,0.95)'; g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = 6 + Math.random() * 52, y = Math.random() * h, l = 18 + Math.random() * 30; g.lineWidth = 2 + Math.random() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke(); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, n * 1.5);
    const L = n * SAIL.CELL, m = mesh(new THREE.PlaneGeometry(SAIL.CELL * 0.85, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false, fog: false }), false);
    const DCx = [0, 1, 0, -1][d], DRx = [1, 0, -1, 0][d], mid = (n - 1) / 2;
    m.position.set(seaX(c + DCx * mid), 0.07, seaZ(r + DRx * mid));
    m.rotation.y = -d * Math.PI / 2;
    m.renderOrder = 2;
    W.g.add(m);
    W.lanes.push(tex);
    // A faint blue band under the streaks, so the lane reads from afar.
    const band = mesh(new THREE.PlaneGeometry(SAIL.CELL * 0.95, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7fd0ea', transparent: true, opacity: 0.18, depthWrite: false, fog: false }), false);
    band.position.copy(m.position).setY(0.065);
    band.rotation.y = m.rotation.y;
    band.renderOrder = 2;
    W.g.add(band);
  }
  // The junction's buoy, yellow, at the corner of the square.
  const [jc, jr] = LAY.JUNCTION, buoy = mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.8, 12), mat('#e8b52a', { roughness: 0.6 }));
  buoy.position.set(seaX(jc) - SAIL.CELL * 0.42, 0.25, seaZ(jr) + SAIL.CELL * 0.42);
  const top = mesh(new THREE.ConeGeometry(0.25, 0.5, 4), mat('#2a2a2a'));
  top.position.set(buoy.position.x, 0.9, buoy.position.z);
  W.g.add(buoy, top);
  W.buoy = buoy;
  // The cliffs: blocks of rock, flat-topped and grassy, each standing BANK over the highest water
  // beside it, so they step up the locks with the canal. (The cove's left-hand side, past the
  // board's edge, is the headland the crane stands on and the lagoon lies up on: crane.js; the
  // checkpoint's headland, checkpoint.js. Between the two, past the board's edge, more of it.)
  const P = LAY.PLATEAU, cliffAt = new Set(sail.sea.cliff);
  for (let c = -2; c < P.c0; c++) for (let r = 16; r <= P.r1; r++) cliffAt.add(`${c},${r}`);
  for (const id of cliffAt) {
    const [c, r] = id.split(',').map(Number), x = seaX(c), z = seaZ(r), top = bankTop(c, r);
    const b = mesh(new THREE.BoxGeometry(SAIL.CELL, top + 1, SAIL.CELL), stoneM);
    b.position.set(x, (top - 1) / 2, z);
    const t = mesh(new THREE.BoxGeometry(SAIL.CELL * 0.98, 0.12, SAIL.CELL * 0.98), grassM);
    t.position.set(x, top + 0.06, z);
    W.g.add(b, t);
    // (none on a lock's banks, where its quay and Bilge board are: lock.js)
    if (sail.sea.locks.some(({ at: [lc, lr] }) => Math.abs(lc - c) <= 1 && Math.abs(lr - r) <= 1)) continue;
    for (let i = 0; i < 2; i++) W.g.add(rock(x + (Math.random() - 0.5) * 3, top * (0.3 + Math.random() * 0.5), z + (Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.7));
  }
  // The canal's water between the locks, a square at a time at its level (all but the ends of the
  // locks that reach into it, out to their gates: src/den-lock.ts, gatesOf; each lock draws its own
  // chamber).
  const half = SAIL.CELL / 2;
  for (const [id, lv] of sail.sea.pounds) {
    if (sail.sea.cove.has(id)) continue;
    const [c, r] = id.split(',').map(Number);
    // (trimmed on each side a lock's end reaches into: x0, x1 across, z0, z1 out)
    let x0 = -half, x1 = half, z0 = -half, z1 = half;
    for (const spot of sail.sea.locks) {
      const { low, high } = ends(spot), at = gatesOf(spot, sail.sea.locks, SAIL.CELL), [lc, lr] = spot.at;
      const into = (low[0] === c && low[1] === r ? at.low : high[0] === c && high[1] === r ? at.high : half) - half;
      if (lr === r && lc === c - 1) x0 += into; else if (lr === r && lc === c + 1) x1 -= into;
      else if (lc === c && lr === r - 1) z0 += into; else if (lc === c && lr === r + 1) z1 -= into;
    }
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) continue;   // (between a staircase's two chambers: all lock)
    const w = mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), coveM, false);
    w.position.set(seaX(c) + (x0 + x1) / 2, LIFT * lv + 0.05, seaZ(r) - (z0 + z1) / 2);
    W.g.add(w);
  }
  // The hidden cove's water, up at the top, its mouth the arm off the clifftop canal.
  const { c0, c1, r0, r1 } = LAY.COVE;
  const cw = (c1 - c0 + 1) * SAIL.CELL, cd = (r1 - r0 + 1) * SAIL.CELL;
  const cove = mesh(new THREE.PlaneGeometry(cw, cd).rotateX(-Math.PI / 2), coveM, false);
  cove.position.set(seaX((c0 + c1) / 2), COVE_Y + 0.05, seaZ((r0 + r1) / 2));
  W.g.add(cove);
  // A strip of sand at the back of the cove (the den's side of it, away from its mouth), and an old
  // pump on it (the map's "hidden cove with an old bilge pump").
  const sand = mesh(new THREE.BoxGeometry(cw, 0.3, 1.6), mat('#c9a874', { roughness: 1 }));
  sand.position.set(cove.position.x, COVE_Y + 0.1, seaZ(r0) + SAIL.CELL / 2 - 0.8);
  W.g.add(sand);
  const pumpG = pumpMesh();
  pumpG.position.set(seaX(c0 + 1), COVE_Y + 0.25, sand.position.z);
  W.g.add(pumpG);
  scene.add(W.g);
  return W;
}
/* An old bilge pump: a post, a spout out of one side and a handle out of the other, pivoted at the
   top of the post so it can be worked (userData.arm; the spout's mouth is userData.mouth). */
export function pumpMesh() {
  const g = new THREE.Group(), pw = mat('#6a5038', { map: woodTex });
  const post = mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), pw); post.position.y = 0.6;
  const arm = new THREE.Group(); arm.position.set(0.05, 1.2, 0); arm.rotation.z = 0.35;
  const handle = mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), pw); handle.position.x = 0.3;
  arm.add(handle);
  const spout = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), mat('#4a4f55', { metalness: 0.5 })); spout.rotation.z = Math.PI / 2; spout.position.set(-0.3, 0.9, 0);
  g.add(post, arm, spout);
  g.userData.arm = arm;
  g.userData.mouth = V3(-0.5, 0.9, 0);
  return g;
}
// The pin: a red buoy with a little pennant, riding the swell.
export function pinMesh() {
  const g = new THREE.Group(), red = mat('#c8372a', { roughness: 0.6 }), white = mat('#f3ecdc');
  const buoy = mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.7, 12), red);
  buoy.position.y = 0.2;
  const band = mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.16, 12), white);
  band.position.y = 0.25;
  const staff = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), mat('#4a2f1a'));
  staff.position.y = 1.15;
  const pennant = mesh(new THREE.ConeGeometry(0.22, 0.6, 3).rotateZ(-Math.PI / 2), red);
  pennant.scale.set(1, 1, 0.15); pennant.position.set(0.3, 1.6, 0);
  g.add(buoy, band, staff, pennant);
  scene.add(g);
  return g;
}
export const dotMat = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.7, depthWrite: false, fog: false });
export const dotMine = new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.75, depthWrite: false, fog: false });
export const dotGeo = new THREE.CircleGeometry(0.32, 14).rotateX(-Math.PI / 2);
export const hoverMat = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.12, depthWrite: false, fog: false });
export const TOK = { F: '↑', L: '↰', R: '↱' };
