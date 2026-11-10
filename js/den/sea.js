// The sailing sea and the sloop, in 3D: the water, rocks, cliffs, lock, turret, pump and pins.
// New things out on the sea are built here. (Split out of den.js.)
import * as THREE from 'three';
import { SAIL, LAY, Sea, Helm, Guns, Turret } from '../den-sail.js';
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
   She has a gun each side: Q fires the port gun, E the starboard, as she sails, at the rocks.
   The sea has its lay (LAY in src/den-sail.ts): a trade wind out to a junction, the loop round and
   home, and a canal to a lock up a cliff into a hidden cove; a turret on a rock shoots at her, and
   a hit holes her deck: she's dazed till you patch it by Carpentry (patchOpen). The lock's worked
   by Bilge, from a board on the quay beside it, an old pump at its head (holdOpen). */
export const SEA_X0 = SAIL.X0;   // (where it was before the board grew out to the right)
export const seaX = (c) => SEA_X0 + (c + 0.5) * SAIL.CELL, seaZ = (r) => SAIL.Z0 - (r + 0.5) * SAIL.CELL;
export const SLOOP_DECK = 0.75;
export const sail = { on: false, sea: new Sea(9), helm: null, g: null, rocks: null, pin: null, hover: null, dots: [], sig: '', hudSig: '', seen: false, heel: 0, bumpT: 0, guns: new Guns(), rockAt: new Map(), world: null, turret: null, shots: [], riding: false, said: {} };
// The wind she sails by (src/den-wind.ts; drawn in wind.js).
sail.sea.breeze = new Wind(9);
sail.helm = new Helm(sail.sea);
sail.turret = new Turret(LAY.TURRET);
// The hidden cove's water is a lock's lift above the sea; the cliff stands above that.
export const LIFT = 1.6, CLIFF_H = 3.4;
// The lock's gates, out from its middle each way: past her bow, bowsprit and stern, so she fits
// between them shut (she's 4.4 long and her bowsprit reaches 3.3 ahead; a square's 4).
const LOCK_GATE_X = 3.5;
export const liftAt = (c, r) => LIFT * (sail.sea.isLock(c, r) ? sail.helm.level : sail.sea.level(c, r));
// Her, smaller than their ship: one mast, a square sail and a topsail, a bowsprit, a tiller at the
// stern, weathered planks, and your own flag at the masthead.
export function sloopMesh() {
  const g = new THREE.Group(), hullM = mat('#5e4128', { map: woodTex }), deckM = mat('#9a7a55', { map: woodTex }), spar = mat('#4a2f1a', { map: woodTex });
  const hull = mesh(hullGeo(4.4, 1.7, 1.3), hullM);
  hull.position.y = SLOOP_DECK - 1.3;
  const deck = mesh(hullGeo(4.25, 1.55, 0.05), deckM);
  deck.position.y = SLOOP_DECK - 0.02;
  const stripe = mesh(hullGeo(4.46, 1.74, 0.1), mat('#d8c9a0'));
  stripe.position.y = SLOOP_DECK - 0.32;
  g.add(hull, deck, stripe);
  const stern = mesh(new THREE.BoxGeometry(0.9, 0.35, 1.45), hullM);
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
  // A gun each side, a smaller copy of the gun tower's, muzzle out over her side (port is her left).
  g.userData.guns = {};
  // Staggered, so they read as two guns and not one beam across her.
  for (const [side, x, z] of [['L', -0.05, -0.5], ['R', -0.7, 0.5]]) {
    const gun = gunMesh();
    gun.scale.setScalar(0.6);
    gun.position.set(x, SLOOP_DECK, z);
    gun.rotation.y = side === 'L' ? 0 : Math.PI;
    gun.userData.z = z;
    g.add(gun);
    g.userData.guns[side] = gun;
  }
  g.rotation.order = 'YXZ';   // (turned to her heading, then heeled over about her own length)
  return g;
}
// The rocks: sea stacks, a clump of boulders on each square.
export function seaRocks() {
  const g = new THREE.Group();
  for (const id of sail.sea.rocks) {
    if (sail.sea.cliff.has(id) || sail.sea.works.has(id)) continue;   // (the cliff's drawn with the cove: seaWorld; the checkpoint and the wreck by checkpoint.js)
    const [c, r] = id.split(',').map(Number), x = seaX(c), z = seaZ(r), here = [];
    for (let i = 0; i < 3; i++) here.push(rock(x + (Math.random() - 0.5) * 2.2, 0.2 + Math.random() * 0.4, z + (Math.random() - 0.5) * 2.2, 0.9 + Math.random() * 0.8));
    g.add(...here);
    sail.rockAt.set(id, here);
  }
  scene.add(g);
  return g;
}
/* The lay of the sea: the trade winds as streaks of white water racing along their lanes, a yellow
   buoy at the junction, the cliff with the hidden cove's water up behind it, the lock in its gap
   (its chamber's water rising and falling, a pair of gates at each end), and the turret, a stone
   tower on its rock with a gun on top. */
export function seaWorld() {
  const W = { g: new THREE.Group(), lanes: [], gates: {}, chamber: null, turret: null, gun: null };
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
  // The cliff: blocks of rock, flat-topped and grassy, round the cove. (Its left-hand side, past the
  // board's edge, is the headland the crane stands on and the lagoon lies up on: crane.js.)
  const { c0, c1, r0, r1 } = LAY.COVE, cliffAt = new Set(sail.sea.cliff);
  for (let c = c0; c <= c1 + 1; c++) cliffAt.add(`${c},${r1 + 1}`);
  const stone = mat('#6b6158', { flatShading: true, roughness: 0.95 }), grass = mat('#5f7d3a', { roughness: 1 });
  for (const id of cliffAt) {
    const [c, r] = id.split(',').map(Number), x = seaX(c), z = seaZ(r);
    const b = mesh(new THREE.BoxGeometry(SAIL.CELL, CLIFF_H + 1, SAIL.CELL), stone);
    b.position.set(x, (CLIFF_H - 1) / 2, z);
    const t = mesh(new THREE.BoxGeometry(SAIL.CELL * 0.98, 0.12, SAIL.CELL * 0.98), grass);
    t.position.set(x, CLIFF_H + 0.06, z);
    W.g.add(b, t);
    // (none on the quay by the lock, where its Bilge board lies: holdOpen)
    if (c === LAY.LOCK[0] && (r === LAY.LOCK[1] - 1 || r === LAY.LOCK[1] - 2)) continue;
    for (let i = 0; i < 2; i++) W.g.add(rock(x + (Math.random() - 0.5) * 3, CLIFF_H * (0.3 + Math.random() * 0.5), z + (Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.7));
  }
  // The cove's water, up behind the cliff (all but the end of the lock that reaches into it: see
  // LOCK_GATE_X).
  const [lc, lr] = LAY.LOCK;
  const coveM = mat('#2f86b0', { roughness: 0.3, transparent: true, opacity: 0.88, emissive: '#0f3f5e' });
  const cw = (c1 - c0 + 1) * SAIL.CELL, cd = (r1 - r0 + 1) * SAIL.CELL, cx = seaX((c0 + c1) / 2), cz = seaZ((r0 + r1) / 2);
  const nx = seaX(lc) - LOCK_GATE_X - 0.2 - cx, ny = -(seaZ(lr) - cz), half = SAIL.CELL / 2;   // (the shape's y is -z)
  const coveShape = new THREE.Shape();
  coveShape.moveTo(-cw / 2, -cd / 2);
  for (const [x, y] of [[cw / 2, -cd / 2], [cw / 2, ny - half], [nx, ny - half], [nx, ny + half], [cw / 2, ny + half], [cw / 2, cd / 2], [-cw / 2, cd / 2]]) coveShape.lineTo(x, y);
  const cove = mesh(new THREE.ShapeGeometry(coveShape).rotateX(-Math.PI / 2), coveM, false);
  cove.position.set(cx, LIFT + 0.05, cz);
  W.g.add(cove);
  // A strip of sand at the back of the cove, and an old pump on it (the map's "hidden cove with an
  // old bilge pump").
  const sand = mesh(new THREE.BoxGeometry(cw, 0.3, 1.6), mat('#c9a874', { roughness: 1 }));
  sand.position.set(cove.position.x, LIFT + 0.1, seaZ(r1) - SAIL.CELL / 2 + 0.8);
  W.g.add(sand);
  const pumpG = pumpMesh();
  pumpG.position.set(seaX(c0 + 1), LIFT + 0.25, sand.position.z);
  W.g.add(pumpG);
  // And one on the quay by the lock, at the head of its Bilge board, its spout out over the lock
  // (the user, 9 Nov: "we need a visible pumping action going on as well. We need the actual bilge
  // pump"): its handle works as you bilge, and water gushes from it into the lock as it fills.
  W.pump = pumpMesh();
  W.pump.scale.setScalar(1.8);
  W.pump.rotation.y = -Math.PI / 2 + 0.7;   // (its spout out over the lock, its handle clear of the board)
  W.pump.position.set(seaX(LAY.LOCK[0]) + 1.7, CLIFF_H + 0.12, seaZ(LAY.LOCK[1]) + SAIL.CELL / 2 + 0.6);
  W.g.add(W.pump);
  // (thick and bright enough to read from the quay's camera, up over the board)
  W.gush = mesh(new THREE.CylinderGeometry(0.3, 0.45, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#cdeefa', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false }), false);
  W.gush.visible = false;
  W.g.add(W.gush);
  // The lock: its chamber's water, and a pair of gates at each end. She's longer than a square, so
  // its walls run on past the cliff each way, as stone piers, and the gates hang at their ends.
  W.chamber = mesh(new THREE.PlaneGeometry(LOCK_GATE_X * 2, SAIL.CELL).rotateX(-Math.PI / 2), coveM, false);
  W.chamber.position.set(seaX(lc), 0.05, seaZ(lr));
  W.g.add(W.chamber);
  const pierL = LOCK_GATE_X + 0.2 - half;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pier = mesh(new THREE.BoxGeometry(pierL, CLIFF_H + 1, 0.6), stone);
    pier.position.set(seaX(lc) + sx * (half + pierL / 2), (CLIFF_H - 1) / 2, seaZ(lr) + sz * (half + 0.3));
    const top = mesh(new THREE.BoxGeometry(pierL, 0.12, 0.6), grass);
    top.position.set(pier.position.x, CLIFF_H + 0.06, pier.position.z);
    W.g.add(pier, top);
  }
  const gateM = mat('#5b3a20', { map: woodTex }), iron = mat('#3a3f45', { metalness: 0.6, roughness: 0.4 });
  for (const [end, sx] of [['sea', 1], ['cove', -1]]) {
    const leaves = [];
    for (const sz of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(seaX(lc) + sx * LOCK_GATE_X, 0, seaZ(lr) + sz * SAIL.CELL / 2);
      const leaf = mesh(new THREE.BoxGeometry(0.28, CLIFF_H + 0.2, SAIL.CELL / 2), gateM);
      leaf.position.set(0, (CLIFF_H + 0.2) / 2 - 0.4, -sz * SAIL.CELL / 4);
      for (const y of [0.4, 1.6, 2.8]) { const band = mesh(new THREE.BoxGeometry(0.32, 0.1, SAIL.CELL / 2), iron, false); band.position.set(0, y, -sz * SAIL.CELL / 4); hinge.add(band); }
      hinge.add(leaf);
      hinge.userData.sz = sz;
      W.g.add(hinge);
      leaves.push(hinge);
    }
    W.gates[end] = { leaves, sx, open: 1 };
  }
  // The turret: a round stone tower on its rock, crenellated, a gun on top that turns to aim.
  const [tc, tr] = LAY.TURRET, tower = new THREE.Group(), ts = mat('#8a8178', { flatShading: true });
  const body = mesh(new THREE.CylinderGeometry(1.15, 1.35, 3.2, 12), ts); body.position.y = 1.6;
  tower.add(body);
  const merlons = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), ts); m.position.set(Math.cos(a) * 1.0, 3.4, Math.sin(a) * 1.0); m.rotation.y = -a; tower.add(m); merlons.push(m); }
  const gun = gunMesh(); gun.scale.setScalar(0.85); gun.position.y = 3.2;
  tower.add(gun);
  tower.position.set(seaX(tc), 0, seaZ(tr));
  W.g.add(tower);
  // Its wreck (see turretLook): a broken stump, scorched, its stones and gun tumbled round it.
  const scorch = mat('#3e3935', { flatShading: true }), ruin = new THREE.Group();
  // (tall enough to stand up out of its rock, its top broken off jagged, embers glowing in it)
  const stump = mesh(new THREE.CylinderGeometry(1.05, 1.35, 2.3, 10), scorch); stump.position.y = 1.15;
  ruin.add(stump);
  for (let i = 0; i < 6; i++) { const a = i / 10 * Math.PI * 2 + 0.3, ht = 0.3 + ((i * 7) % 5) * 0.16, b = mesh(new THREE.BoxGeometry(0.42, ht, 0.42), i % 2 ? ts : scorch); b.position.set(Math.cos(a) * 0.95, 2.3 + ht / 2, Math.sin(a) * 0.95); b.rotation.y = -a; ruin.add(b); }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff8a2a' });
  for (let i = 0; i < 5; i++) { const e = mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), ember, false); e.position.set(Math.cos(i * 1.9) * 0.5, 2.32, Math.sin(i * 1.9) * 0.5); e.rotation.y = i; ruin.add(e); }
  for (let i = 0; i < 9; i++) { const a = i * 2.4, k = 1.5 + (i % 3) * 0.35, b = mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), i % 3 ? ts : scorch); b.position.set(Math.cos(a) * k, 0.7 + (i % 2) * 0.2, Math.sin(a) * k); b.rotation.set(i * 0.7, i * 1.3, i * 0.4); ruin.add(b); }
  const barrel = gunMesh(); barrel.scale.setScalar(0.75); barrel.position.set(1.4, 0.9, 0.7); barrel.rotation.set(0.5, 0.9, 1.2); ruin.add(barrel);
  ruin.visible = false;
  tower.add(ruin);
  W.turret = tower; W.gun = gun; W.intact = [body, ...merlons, gun]; W.ruin = ruin; W.wrecked = false;
  scene.add(W.g);
  return W;
}
// The turret standing, or its wreck.
export function turretLook(W, wrecked) {
  W.wrecked = wrecked;
  W.fall = undefined;
  for (const o of W.intact) { o.visible = !wrecked; if (o.userData.home) { o.position.copy(o.userData.home); o.rotation.copy(o.userData.turn); } }
  W.turret.children[0].scale.y = 1;
  W.ruin.visible = wrecked;
}
// Wrecked, it comes down: its gun topples off the top and splashes down, its battlements fly
// apart, the tower shudders and sinks into its rock, then there's the smoking stump.
export function turretFall(W, dt) {
  const T = 1.4, u = Math.min(1, (W.fall += dt) / T), tw = W.turret.position;
  for (const o of W.intact) if (!o.userData.home) { o.userData.home = o.position.clone(); o.userData.turn = o.rotation.clone(); }
  const body = W.turret.children[0];
  body.scale.y = 1 - 0.45 * u * u;
  body.position.x = Math.sin(W.fall * 40) * 0.08 * (1 - u);
  W.intact.forEach((o, i) => {
    if (o === body) return;
    const h = o.userData.home, a = Math.atan2(h.z, h.x) || i;
    o.position.set(h.x + Math.cos(a) * u * 2.5, h.y + 1.6 * u - 5.2 * u * u, h.z + Math.sin(a) * u * 2.5);
    o.rotation.set(o.userData.turn.x + u * 3, o.userData.turn.y, o.userData.turn.z + u * (o === W.gun ? 1.6 : 2.5));
  });
  if ((W.smokeT = (W.smokeT ?? 0) - dt) < 0) { W.smokeT = 0.08; burst(V3(tw.x, 2 + Math.random(), tw.z), '#3f3a37', 4, 1.6); }
  if (u >= 1) { burst(V3(tw.x + 2, 0.3, tw.z + 1), '#e6f3f6', 18, 3.5); burst(V3(tw.x, 1.5, tw.z), '#8a8178', 16, 3); turretLook(W, true); }
}
// The chest floating free of the wreck: a little sea chest, banded, bobbing on the water.
export function floatChestMesh() {
  const g = new THREE.Group(), wood = mat('#6e4a2a', { map: woodTex }), band = mat('#c9a43a', { metalness: 0.6, roughness: 0.4 });
  const box = mesh(new THREE.BoxGeometry(1.1, 0.6, 0.75), wood); box.position.y = 0.15;
  const lid = mesh(new THREE.CylinderGeometry(0.375, 0.375, 1.1, 10, 1, false, 0, Math.PI), wood); lid.rotation.z = Math.PI / 2; lid.position.y = 0.45;
  for (const x of [-0.35, 0.35]) { const b = mesh(new THREE.BoxGeometry(0.08, 0.66, 0.8), band, false); b.position.set(x, 0.15, 0); g.add(b); }
  const lock = mesh(new THREE.BoxGeometry(0.18, 0.2, 0.06), band, false); lock.position.set(0, 0.35, 0.39);
  g.add(box, lid, lock);
  scene.add(g);
  return g;
}
/* An old bilge pump: a post, a spout out of one side and a handle out of the other, pivoted at the
   top of the post so it can be worked (userData.arm; the spout's mouth is userData.mouth). */
function pumpMesh() {
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
// A stroke of the quay pump's handle, as a clear's pumped into the lock.
export function pumpStroke() { const p = sail.world?.pump; if (p) p.userData.stroke = 1; }
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
