// The imperial checkpoint across the main shipping lane, in 3D, and its guns at work; the headland
// beside it and the old wreck beyond it. (The rules: src/den-checkpoint.ts.)
import * as THREE from 'three';
import { LAY, SAIL, canalAt } from '../den-sail.js';
import { CHECK, Checkpoint, throughSay } from '../den-checkpoint.js';
import { addFind, wayThrough, wayWrecked } from '../den-finds.js';
import { passageAt } from '../den-kikkit.js';
import { G, scene, mat, mesh, canvasTex, woodTex, V3, burst, toast, worldLets, shake, flagpole, warm } from './world.js';
import { rock } from './land.js';
import { turretMesh, turretView, turretWrecked, turretFire, turretLand, turretShotsTick, turretShotsClear, shotComing } from './turret.js';
import { hullGeo } from './raids.js';
import { seaX, seaZ, sail, CLIFF_H, bankTop } from './sea.js';
import { deckHoleShape } from './sea-puzzles.js';
import { canHaulWreck } from './treasure.js';
import { dignityWatch, dignityHeard } from './dignity.js';
import { cine } from './cine.js';

/* The user (10 Nov): "We need our own puzzle where we have to get through the Imperial checkpoint
   by doing slow row and then fast rowing with the Vegas." The main shipping lane, a trade wind on
   from the junction, drops her short of an imperial checkpoint: a gatehouse of pale stone over the
   one gap in a line across the sea, its arch high enough for her mast, the Empire's crimson flag
   over it and banners down its towers, a boom chain lying slack under the water between its piers
   (the bribe, later, is paid here), and a bastion either side with a gun on it. Each gun is trained
   on squares of the way through, marked on the water with red rings: stop on one and she's hit.
   Each bastion and its gun is a destructible turret (src/den-turret.ts, js/den/turret.js), put
   down here and dressed in the Empire's stone and crimson: "just the same as the other one", a hit
   quietens it ten seconds, smoking, and the third wrecks it, the gun toppling off and the bastion
   sinking to a smoking stump. Once she's fired on it, its guns turn on her, a red ring on the water
   where each shot will come down.
   On its left a headland, the canal's last two locks cut down through it (lock.js): the secret way
   round. On its right a reef, out to the edge of the sea. Beyond it, an old wreck on the open sea, its treasure hauled up by
   Treasure Haul (treasure.js). */
export const cp = { check: new Checkpoint(), W: null, byWreck: false, held: [] };
const K = LAY.CHECKPOINT, GATE_Z = seaZ(K.ROW), ARCH_Y = 6.4;
const stone = () => mat('#d3c9b2', { flatShading: true, roughness: 0.9 });
const CRIMSON = '#9e1b24', GOLD = '#e0b53a';

// The Empire's flag: crimson, a gold border, a gold crown over a rising sun.
const imperialTex = (w = 200, h = 128) => canvasTex(w, h, (g) => {
  g.fillStyle = CRIMSON; g.fillRect(0, 0, w, h);
  g.strokeStyle = GOLD; g.lineWidth = h * 0.06; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  const cx = w / 2, cy = h * 0.62, R = h * 0.26;
  g.fillStyle = GOLD;
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.08) * R * 0.9, cy + Math.sin(a - 0.08) * R * 0.9); g.lineTo(cx + Math.cos(a) * R * 1.55, cy + Math.sin(a) * R * 1.55); g.lineTo(cx + Math.cos(a + 0.08) * R * 0.9, cy + Math.sin(a + 0.08) * R * 0.9); g.fill(); }
  g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI, 0); g.fill();
  // the crown, over the sun
  const y0 = h * 0.2, cw = h * 0.36, ch = h * 0.2;
  g.beginPath(); g.moveTo(cx - cw / 2, y0 + ch);
  for (const [x, y] of [[-0.5, 0], [-0.25, 0.45], [0, -0.1], [0.25, 0.45], [0.5, 0], [0.5, 1]]) g.lineTo(cx + x * cw, y0 + y * ch);
  g.closePath(); g.fill();
  g.fillStyle = CRIMSON; g.fillRect(cx - cw / 2, y0 + ch * 0.82, cw, ch * 0.08);
});
let imperialMat = null;
const flagMatImperial = () => (imperialMat ||= new THREE.MeshStandardMaterial({ map: imperialTex(), side: THREE.DoubleSide, roughness: 0.9 }));
// A long banner hanging down a tower's face.
function banner(w, h) {
  const m = new THREE.MeshStandardMaterial({ map: canvasTex(64, 160, (g, cw, chh) => {
    g.fillStyle = CRIMSON; g.fillRect(0, 0, cw, chh);
    g.fillStyle = GOLD; g.fillRect(0, 0, cw, 8); g.fillRect(6, 0, 4, chh); g.fillRect(cw - 10, 0, 4, chh);
    g.beginPath(); g.arc(cw / 2, chh * 0.35, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = CRIMSON; g.beginPath(); g.arc(cw / 2, chh * 0.35, 7, 0, Math.PI * 2); g.fill();
    g.clearRect(0, chh - 18, cw, 18); g.fillStyle = CRIMSON; g.beginPath(); g.moveTo(0, chh - 18); g.lineTo(cw / 2, chh); g.lineTo(cw, chh - 18); g.fill();
  }), side: THREE.DoubleSide, roughness: 0.9, transparent: true });
  return mesh(new THREE.PlaneGeometry(w, h), m, false);
}
// A square tower of pale stone, battlemented, a crimson band below its top.
function tower(w, h) {
  const g = new THREE.Group(), st = stone();
  const body = mesh(new THREE.BoxGeometry(w, h + 1, w), st); body.position.y = (h - 1) / 2;
  const band = mesh(new THREE.BoxGeometry(w + 0.08, 0.35, w + 0.08), mat(CRIMSON, { roughness: 0.8 })); band.position.y = h - 0.7;
  g.add(body, band);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const m = mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), st), s = (j - 1) * (w - 0.5) / 2, e = (w - 0.5) / 2;
    m.position.set([s, e, s, -e][i], h + 0.27, [e, s, -e, s][i]);
    g.add(m);
  }
  return g;
}
// A bastion: a destructible turret (js/den/turret.js) in the Empire's pale stone, a crimson band
// under its battlements and its flag on top, on its rock.
function bastion(c, r) {
  const V = turretMesh({ stone: '#d3c9b2', top: 1.5, foot: 1.8, height: 3.4, band: CRIMSON, flag: flagMatImperial(), rocks: 3, merlons: 10 });
  V.g.position.set(seaX(c), 0, seaZ(r));
  return V;
}
// The wreck: an old ship run onto a sandbar, listing, her masts snapped, ribs showing at her stern.
export function wreckMesh() {
  const g = new THREE.Group(), rot = mat('#4a3a2c', { map: woodTex, roughness: 1 }), dark = mat('#2e2620', { map: woodTex });
  const hull = mesh(hullGeo(6, 2.2, 1.8), rot); hull.position.y = -1.4;
  const deck = mesh(hullGeo(5.4, 1.9, 0.06), mat('#6e5a44', { map: woodTex })); deck.position.y = 0.35;
  g.add(hull, deck);
  for (let i = 0; i < 5; i++) { const rib = mesh(new THREE.TorusGeometry(1.05, 0.08, 5, 10, Math.PI), dark); rib.position.set(-2.2 - i * 0.35, -0.3, 0); rib.rotation.y = Math.PI / 2; g.add(rib); }
  const mast = mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 7), dark); mast.position.set(0.6, 1.5, 0); mast.rotation.z = 0.3;
  const stub = mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 7), dark); stub.position.set(-1.2, 0.8, 0.1);
  const spar = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), dark); spar.position.set(1.4, 0.1, 1.5); spar.rotation.set(1.2, 0.3, 0.2);
  const rag = mesh(new THREE.PlaneGeometry(1, 0.8), mat('#b9ab8e', { side: THREE.DoubleSide, roughness: 1 }), false); rag.position.set(0.9, 2.1, 0.05); rag.rotation.set(0, 0.3, 0.2);
  g.add(mast, stub, spar, rag);
  // run aground on a sandbar, listing hard, her bow up
  const sand = mesh(new THREE.CylinderGeometry(2.6, 3.4, 0.5, 14), mat('#d2b47e', { roughness: 1 })); sand.position.y = -0.2; sand.scale.z = 0.75;
  const ship = new THREE.Group(); ship.add(g, sand); g.rotation.set(0.42, 0, 0.14);
  return ship;
}
function build() {
  const W = { g: new THREE.Group(), bastions: [], rings: [], wreck: null };
  // The gatehouse: a tower on each pier, an arch between them high over the gate, battlemented.
  const [p0, p1] = K.PIERS, xa = seaX(p0[0]), xb = seaX(p1[0]), TW = 3.4;
  for (const x of [xa, xb]) {
    const t = tower(TW, ARCH_Y + 1.6); t.position.set(x, 0, GATE_Z); W.g.add(t);
    const b = banner(1.4, 3.6); b.position.set(x, ARCH_Y - 1.2, GATE_Z + TW / 2 + 0.03); W.g.add(b);
    const b2 = b.clone(); b2.position.z = GATE_Z - TW / 2 - 0.03; b2.rotation.y = Math.PI; W.g.add(b2);
  }
  const span = xb - xa - TW, st = stone();
  const arch = mesh(new THREE.BoxGeometry(span, 1.6, TW * 0.8), st); arch.position.set((xa + xb) / 2, ARCH_Y + 0.8, GATE_Z);
  // (its underside curved: two haunches)
  for (const s of [-1, 1]) { const h = mesh(new THREE.CylinderGeometry(0.9, 0.9, TW * 0.8, 10, 1, false, 0, Math.PI / 2), st); h.rotation.x = Math.PI / 2; h.rotation.z = s < 0 ? Math.PI / 2 : 0; h.position.set((xa + xb) / 2 + s * (span / 2 - 0.9), ARCH_Y + 0.9, GATE_Z); W.g.add(h); }
  W.g.add(arch);
  for (let i = 0; i < 4; i++) { const m = mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), st); m.position.set(xa + TW / 2 + 0.4 + i * (span - 0.8) / 3, ARCH_Y + 1.87, GATE_Z + TW * 0.4 - 0.25); W.g.add(m); }
  const fl = flagpole(3, flagMatImperial()); fl.scale.setScalar(1.6); fl.position.set((xa + xb) / 2, ARCH_Y + 1.6, GATE_Z); W.g.add(fl);
  // The boom: an iron chain between the piers, lying slack under the water (the bribe, later).
  const iron = mat('#2b2f34', { metalness: 0.6, roughness: 0.5 }), linkG = new THREE.TorusGeometry(0.22, 0.06, 5, 10);
  const L = xb - xa - TW, n = Math.round(L / 0.36);
  for (let i = 0; i <= n; i++) {
    const u = i / n, l = mesh(linkG, iron, false);
    l.position.set(xa + TW / 2 + u * L, 0.4 - Math.sin(u * Math.PI) * 1.3, GATE_Z + 0.3);
    l.rotation.set(0, i % 2 ? Math.PI / 2 : 0, 0); l.rotateZ(Math.PI / 2);
    W.g.add(l);
  }
  for (const x of [xa + TW / 2 + 0.25, xb - TW / 2 - 0.25]) { const w = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10), mat('#5b3a20', { map: woodTex })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.9, GATE_Z + 0.3); W.g.add(w); }
  // The bastions and their guns.
  for (const [c, r] of K.GUNS) { const b = bastion(c, r); W.g.add(b.g); W.bastions.push(b); }
  // The guns' marks: a red ring on the water on each square they're trained on, a little marker
  // buoy at its corner. They flare as a shot comes down on them.
  CHECK.MARKS.forEach((ms, gi) => ms.forEach(([c, r]) => {
    const ring = mesh(new THREE.RingGeometry(1.3, 1.65, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#d23a2a', transparent: true, opacity: 0.4, depthWrite: false, fog: false }), false);
    ring.position.set(seaX(c), 0.09, seaZ(r)); ring.renderOrder = 3;
    const cross = mesh(new THREE.PlaneGeometry(0.18, 2.6).rotateX(-Math.PI / 2), ring.material, false);
    cross.position.copy(ring.position); cross.renderOrder = 3;
    const cross2 = cross.clone(); cross2.rotation.y = Math.PI / 2;
    const buoy = mesh(new THREE.ConeGeometry(0.3, 0.8, 8), mat('#c8372a')); buoy.position.set(seaX(c) + 1.6, 0.3, seaZ(r) + 1.6);
    const cap = mesh(new THREE.SphereGeometry(0.14, 8, 6), mat('#f3ecdc')); cap.position.set(buoy.position.x, 0.78, buoy.position.z);
    W.g.add(ring, cross, cross2, buoy, cap);
    W.rings.push({ c, r, gun: gi, m: ring.material });
  }));
  // The headland: cliff, flat-topped and grassy as round the hidden cove, and on past the board; the
  // canal's locks cut down through it (lock.js), its banks there level with the clifftop canal's.
  const { c0, c1, r0, r1 } = K.HEADLAND, rockM = mat('#6b6158', { flatShading: true, roughness: 0.95 }), grass = mat('#5f7d3a', { roughness: 1 });
  for (let c = c0 - 2; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (canalAt(c, r)) continue;
    const bank = [-1, 0, 1].some((a) => [-1, 0, 1].some((b) => canalAt(c + a, r + b)));
    const x = seaX(c), z = seaZ(r), ht = bank ? bankTop(c, r) : CLIFF_H + 1.4 + ((c * 7 + r * 3) % 3) * 0.5;
    const b = mesh(new THREE.BoxGeometry(SAIL.CELL, ht + 1, SAIL.CELL), rockM); b.position.set(x, (ht - 1) / 2, z);
    const t = mesh(new THREE.BoxGeometry(SAIL.CELL * 0.98, 0.12, SAIL.CELL * 0.98), grass); t.position.set(x, ht + 0.06, z);
    W.g.add(b, t);
    if (!bank) for (let i = 0; i < 2; i++) W.g.add(rock(x + (Math.random() - 0.5) * 3, ht * (0.3 + Math.random() * 0.5), z + (Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.7));
  }
  // The old wreck.
  const [wc, wr] = LAY.WRECK;
  W.wreck = wreckMesh(); W.wreck.position.set(seaX(wc), 0, seaZ(wr)); W.wreck.rotation.y = 0.6;
  W.g.add(W.wreck);
  scene.add(W.g);
  // Every shader the gauntlet will want (its guns' wrecks, the splashes, the hit and the patch's
  // board), built now in the background, not mid-run (world.js).
  warm();
  return W;
}
export function checkpointReset() {
  cp.check = new Checkpoint();
  turretShotsClear();
  cp.byWreck = false;
  cp.held = [];
  cp.rowed = false;
  sail.wreckSalvage = null;
}
const GUN_NAME = ['left', 'right'];
/* A shot of hers came down on the checkpoint (sailing.js, sailFire): on a bastion, a hit on its gun,
   quietening it a while or, the third, wrecking it; on the gatehouse, only stone. Either way it's a
   fight now: its guns turn on her (src/den-checkpoint.ts, Checkpoint.shot). */
export function checkpointShot(hit, at) {
  const e = cp.check.shot(...hit), b = cp.check.battery;
  if (!e) return false;
  dignityHeard(e);   // ("That was Imperial property!": dignity.js)
  const fight = e.first ? ' It\'s a fight now: its guns are on her' : '';
  if (e.on === 'gatehouse') { toast(`A hit on the gatehouse! Solid stone: aim for the bastions' guns.${fight}`); return true; }
  const name = GUN_NAME[e.gun] ?? '';
  if (e.did === 'quiet') toast(`A hit on the ${name} bastion's gun! That's quietened it for a while (${b.guns[e.gun].left()} more to wreck it).${fight}`);
  else if (e.did === null) toast('A hit on the wrecked bastion!');
  else {
    turretWrecked(cp.W.bastions[e.gun], at);   // (its moment: it comes down)
    const w = wayWrecked(b.silenced());   // (both down: a way past found, for the map's quests: src/den-finds.ts)
    if (w) G.found = addFind(G.found, w);
    toast(b.silenced() ? 'Both its guns are wrecked! The way through the checkpoint is safe' : `The ${name} bastion's gun is wrecked! Its marks are safe now`);
  }
  return true;
}
// Each tick at sea: its guns fire on their marks when she's on one, the shots come down, and what
// she's done there is said. Drawn whether she's out or not (it's seen from the den too, far off).
export function checkpointTick(dt) {
  const W = (cp.W ||= build()), h = sail.helm;
  if (sail.on) {
    for (const e of cp.check.battery.tick(dt, h.spared() ? null : h.now())) {
      const where = V3(seaX(e.to[0]), 0, seaZ(e.to[1]));
      if (e.kind === 'fire') { turretFire(W.bastions[e.gun], e, where); continue; }
      turretLand(W.bastions[e.gun], e);
      if (!e.hit) continue;
      h.hit(deckHoleShape());
      cp.check.holed();
      toast(e.aimed ? 'Hit! She\'s holed: patch her to sail on' : 'Hit! That gun had her on its mark: patch her to sail on', true);
    }
    // Its commander on the gate: her cutscene the first time she's sighted from the cove's side
    // (dignity.js). What's said here waits till it's over, so they don't talk over each other.
    // (not while Kikkit's whirlpools' winds carry her home past it: she'd be gone before it began)
    if (!passageAt(h.pose.c, h.pose.r)) dignityWatch(h.pose);
    if (h.pose.r === K.ROW && h.pose.c === K.GATE) cp.rowed = h.oars;   // (at the oars in the gate, or under sail)
    for (const e of cp.check.watch(h.pose)) {
      dignityHeard(e);
      // Which way she got past, for the map's quests (src/den-finds.ts).
      const way = e.kind === 'through' ? wayThrough(e.how, { oars: cp.rowed, silenced: cp.check.battery.silenced() }) : null;
      if (way) G.found = addFind(G.found, way);
      // Nothing's said as she sights it: how to get past it is yours to work out (the user, 10 Nov:
      // "I like these just to be hidden gems that you work out").
      if (e.kind === 'sighted') continue;
      const say = e.kind === 'calm' ? 'Out of sight of the checkpoint: its guns go back to their marks' : throughSay(e);
      if (!say) continue;   // (spat back by Kikkit's whirlpools: whirlpools.js says so)
      if (cine) cp.held.push(say); else toast(say);
    }
    if (!cine && cp.held.length) for (const say of cp.held.splice(0)) toast(say);
    const by = canHaulWreck();
    if (by && !cp.byWreck) toast('By the old wreck: Space to haul up its treasure');
    cp.byWreck = by;
  }
  // The shots on their way down; the rings flare under them.
  turretShotsTick(dt);
  const t = performance.now() / 1000;
  for (const ring of W.rings) {
    const live = shotComing(ring.c, ring.r);
    ring.m.opacity = live ? 0.6 + 0.35 * Math.sin(t * 20) : 0.32 + 0.08 * Math.sin(t * 2);
  }
  // Each gun as its turret's rules say (quiet, smoking; wrecked, coming down), turned to her while
  // she's in sight of the checkpoint, else to its first mark.
  const p = h.now(), near = sail.on && Math.max(Math.abs(p.c - K.GATE), Math.abs(p.r - K.ROW)) <= CHECK.SIGHT + 1;
  W.bastions.forEach((B, i) => {
    const [mc, mr] = CHECK.MARKS[i][0];
    turretView(B, cp.check.battery.guns[i], dt, near ? { x: seaX(p.c), z: seaZ(p.r) } : { x: seaX(mc), z: seaZ(mr) });
  });
}
