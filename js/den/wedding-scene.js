// Mischievious's island, in 3D: the sea round it, the sand and palms, and her three venues (the beach,
// the clifftop chapel's ruin on its headland, a big old ship moored at the jetty), each a spot the
// wedding's venue root (where its props and pirates stand) moves to; the wedding's pirates, dressed by
// the wardrobe (only looks: RULES.md); and the hearts that float up at the kiss. (The rules: src/den-wedding.ts;
// the planner: wedding.js; the ceremony: wedding-ceremony.js.)
import * as THREE from 'three';
import * as LOOK from '../den-look.js';
import { wearable } from '../den-wedding.js';
import { scene, camera, mat, mesh, woodTex, makePirate, V3 } from './world.js';
import { hullGeo } from './raids.js';
import { heartMesh, bouquetMesh } from './wedding-props.js';

/** Where her island is: well out of sight of the den and the sea you sail (nothing else is out here). */
export const ISLE = V3(400, 0, 0);
/** Where each venue's floor is on the island (its middle: the aisle runs down its z). */
export const VENUE_AT = { beach: V3(0, 0, 0), chapel: V3(-27, 7, 2), deck: V3(31, 1.7, 0) };
/** How much further back a shot stands on a screen narrower than 4:3 (a phone held upright), so it
    takes in as much across as it would on a desktop (1 on a desktop, sideways or a tablet). */
export function roomy() {
  const across = Math.tan(camera.fov * Math.PI / 360) * Math.min(camera.aspect, 4 / 3);
  return Math.max(1, Math.tan(Math.PI / 8) * 4 / 3 / across);
}
/** The sky over her island: a warm sunset (the den's own comes back when you leave). */
export const ISLE_SKY = { zenith: '#3b4f93', horizon: '#f4a46f', hemi: ['#ffe2cf', '#6a4a52'] };

const sand = mat('#ead6a2'), wet = mat('#c9b07c'), rockM = mat('#7d6a5c'), grass = mat('#6f9a4a'), stone = mat('#b9ad9c'), stoneDark = mat('#8f8475');
const trunkM = mat('#8a6a44'), frond = mat('#3f8a3a', { side: THREE.DoubleSide }), nut = mat('#5a3a1e');
const hullM = mat('#4a2f1c', { map: woodTex }), deckM = mat('#a07c55', { map: woodTex }), plank = mat('#8a6a48', { map: woodTex }), spar = mat('#4a2f1a', { map: woodTex });
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

export function palm(h = 5, lean = 0.25) {
  const g = new THREE.Group(), n = 6;
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const seg = mesh(new THREE.CylinderGeometry(0.16 - i * 0.012, 0.19 - i * 0.012, h / n + 0.05, 8), trunkM);
    const dx = Math.sin(lean * (i / n)) * h / n;
    seg.position.set(x + dx / 2, y + h / n / 2, 0);
    seg.rotation.z = -lean * (i / n);
    g.add(seg);
    x += dx; y += h / n;
  }
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.ConeGeometry(0.32, 2.6, 4, 1, true), frond);
    leaf.scale.set(1, 1, 0.18);
    const a = i / 7 * Math.PI * 2;
    leaf.position.set(x + Math.cos(a) * 1.1, y - 0.25, Math.sin(a) * 1.1);
    leaf.rotation.set(0, -a, 0);
    leaf.rotateZ(-Math.PI / 2 - 0.35);
    g.add(leaf);
  }
  for (let i = 0; i < 3; i++) g.add(at(mesh(new THREE.SphereGeometry(0.13, 8, 6), nut), x + Math.cos(i * 2) * 0.18, y - 0.18, Math.sin(i * 2) * 0.18));
  return g;
}
// The clifftop chapel: a ruin, open to the sky, its walls broken down to jagged stumps, an apse
// behind the altar with its window arch still standing, and flagstones up the aisle.
export function chapel() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(11, 12.5, 7.6, 28), rockM), 0, -3.8 - 0.02, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(10.8, 10.8, 0.1, 28), grass), 0, -0.04, 0));
  for (let z = -5.5; z <= 6.5; z += 1) g.add(at(mesh(new THREE.BoxGeometry(1.3, 0.04, 0.85), z % 2 ? stone : stoneDark), 0, 0.0, z));
  // The side walls, in broken stretches.
  const H = [2.6, 1.4, 3.2, 0.7, 2.1, 1.7, 0.4, 2.8, 1.1];
  for (const sx of [-1, 1]) H.forEach((h, i) => {
    const z = -6 + i * 1.5, w = mesh(new THREE.BoxGeometry(0.6, h, 1.45), i % 2 ? stone : stoneDark);
    g.add(at(w, sx * 7.4, h / 2, z));
  });
  // Pillars, some snapped.
  for (const [x, z, h] of [[-6.4, -3, 4.2], [6.4, -3, 2.2], [-6.4, 2, 1.5], [6.4, 2, 3.8]]) g.add(at(mesh(new THREE.CylinderGeometry(0.32, 0.36, h, 12), stone), x, h / 2, z));
  // The apse wall behind the altar, and its pointed window, the sea through it.
  g.add(at(mesh(new THREE.BoxGeometry(2.6, 5.2, 0.6), stone), -2.7, 2.6, -7.2), at(mesh(new THREE.BoxGeometry(2.6, 4.4, 0.6), stone), 2.7, 2.2, -7.2));
  g.add(at(mesh(new THREE.BoxGeometry(2.8, 1.3, 0.6), stoneDark), 0, 0.65, -7.2));
  const arch = mesh(new THREE.TorusGeometry(1.4, 0.3, 8, 18, Math.PI), stone);
  g.add(at(arch, 0, 3.6, -7.2));
  for (const [x, z, r] of [[-3, 5.6, 0.4], [4.2, -5, 0.3], [5.4, 4.6, 0.5]]) g.add(at(mesh(new THREE.DodecahedronGeometry(r), stoneDark), x, r * 0.5, z));
  return g;
}
// The ship by the jetty: a big old hull, the venue on her deck, a mast at her bow, a rail round her.
function ship() {
  const g = new THREE.Group();
  const hull = mesh(hullGeo(19, 14.4, 2.6, 0.18), hullM);
  hull.rotation.y = Math.PI / 2;
  // (her hull's top a little below the deck's, and the deck's a hair below the venue's floor, where the
  // props and splatters stand: level with either, the two flickered through each other)
  hull.position.y = -2.6 - 0.08;
  const deck = mesh(hullGeo(18.6, 14, 0.06, 0.18), deckM);
  deck.rotation.y = Math.PI / 2;
  deck.position.y = -0.065;
  g.add(hull, deck);
  for (const sx of [-1, 1]) {
    g.add(at(mesh(new THREE.BoxGeometry(0.12, 0.12, 13), spar), sx * 6.9, 0.85, 0.6));
    for (let z = -5.5; z <= 7; z += 1.25) g.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 6), spar), sx * 6.9, 0.42, z));
  }
  const mast = at(mesh(new THREE.CylinderGeometry(0.16, 0.22, 11, 10), spar), 0, 5.5, -7.4);
  const yard = at(mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 8), spar), 0, 8.6, -7.4);
  yard.rotation.z = Math.PI / 2;
  const sail = at(mesh(new THREE.PlaneGeometry(6.4, 3.6), mat('#efe6d0', { side: THREE.DoubleSide })), 0, 6.7, -7.25);
  g.add(mast, yard, sail);
  return g;
}
/** The whole island, built once and kept (hidden while you're away). */
export function buildIsle() {
  const g = new THREE.Group();
  g.position.copy(ISLE);
  const sea = mesh(new THREE.PlaneGeometry(320, 320), mat('#2e83a8', { roughness: 0.3, metalness: 0.1, emissive: '#0d3a56' }), false);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.55;
  const isle = mesh(new THREE.CylinderGeometry(22, 26, 1.2, 48), sand);
  isle.position.set(0, -0.6 - 0.005, 14);
  const shore = mesh(new THREE.CylinderGeometry(26.4, 27, 0.4, 48), wet, false);
  shore.position.set(0, -0.7, 14);
  g.add(sea, shore, isle);
  for (const [x, z, h, l] of [[-12, -2, 5.5, 0.35], [-9, 8, 4.6, -0.3], [11, -3, 5, -0.4], [14, 9, 6, 0.3], [-4, 18, 5.2, 0.2], [6, 22, 4.8, -0.25], [-17, 14, 5.6, 0.3], [18, 18, 5, -0.3], [9.5, 3, 4.2, 0.45]]) {
    const p = palm(h, l);
    p.position.set(x, 0, z);
    p.rotation.y = x * 0.7 + z;
    g.add(p);
  }
  const C = chapel();
  C.position.copy(VENUE_AT.chapel);
  // (a path up the headland's side)
  for (let i = 0; i < 9; i++) g.add(at(mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), stoneDark), -17.5 - i * 0.2, i * 0.78 - 0.1, 8 - i * 0.55));
  const S = ship();
  S.position.copy(VENUE_AT.deck);
  // The jetty out to her, and a gangplank up onto her deck.
  const jetty = new THREE.Group();
  jetty.add(at(mesh(new THREE.BoxGeometry(8, 0.14, 1.6), plank), 20.5, 0.6, 2));
  for (let x = 17; x <= 24; x += 1.4) for (const z of [1.3, 2.7]) jetty.add(at(mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6), spar), x, -0.1, z));
  const gang = at(mesh(new THREE.BoxGeometry(2.2, 0.08, 1), plank), 24.6, 1.15, 2);
  gang.rotation.z = 0.5;
  jetty.add(gang);
  g.add(C, S, jetty);
  scene.add(g);
  g.visible = false;
  return g;
}

// ---------- the pirates ----------
const hasPart = (slot, body, id) => !!LOOK.PARTS[slot]?.[body]?.some(([x]) => x === id);
/** A look as the wardrobe can dress it just now (stand-ins for anything still to come: src/den-wedding.ts). */
export const dressable = (look) => LOOK.cleanLook(wearable(look || {}, hasPart));
/** A pirate in a look, standing at (x, z) of `parent`. `hurt`: bandaged (the jilted groom's mishap:
    a bandage round his head and his arm in a sling, the scene's, not clothing). `bouquet`: flowers in
    hand, from the wardrobe if it has them, else a little bunch of the scene's own. */
export function figure(parent, look, { x = 0, z = 0, yaw = 0, hurt = false, sword = false, bouquet = null } = {}) {
  const L = dressable(look);
  const p = Object.assign(makePirate({ look: L, sword }), { x, z, yaw, y: 0, sit: false, phase: 0 });
  if (hurt) {
    const band = mesh(new THREE.TorusGeometry(L.body === 'f' ? 0.235 : 0.25, 0.045, 6, 20), mat('#f4f1ea'));
    band.rotation.x = Math.PI / 2 - 0.25;
    band.position.y = 1.0;
    const pad = at(mesh(new THREE.BoxGeometry(0.12, 0.1, 0.03), mat('#f4f1ea')), 0.12, 1.0, 0.23);
    const sling = mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 14, Math.PI), mat('#f4f1ea'));
    sling.position.set(-0.05, 0.42, 0.12); sling.rotation.set(0.3, 0, Math.PI * 1.1);
    p.body.add(band, pad, sling);
    p.arms[1].rotation.set(-1.2, 0, -0.7);
    p.hurt = true;
  }
  if (bouquet && L.hand !== 'bouquet') {
    const b = bouquetMesh(bouquet);
    b.position.set(0, -0.56, 0.08);
    p.arms[0].add(b);
  }
  p.g.position.set(x, 0, z);
  p.g.rotation.y = yaw;
  parent.add(p.g);
  return p;
}
export function dropFigure(p) { p?.g.removeFromParent(); }
/** Draws a figure where it is (x, z, y up, yaw), standing or sitting (its arms as a scene's left them:
    restArms puts them down; its legs straight, unless it's keepLegs). Not for one walking (cine.js's
    stepTo draws them). */
export function poseFig(p, dt) {
  if (p.sit) p.legs.forEach((l) => { l.rotation.x = -1.35; });
  else if (!p.keepLegs) p.legs.forEach((l) => { l.rotation.x = 0; });
  p.g.position.set(p.x, p.y - (p.sit ? 0.26 : 0), p.z);
  p.g.rotation.y = p.yaw;
  LOOK.familiarTick(p.fam, dt);
}
/** Arms down (in the lap, sitting), but a sling's still a sling. */
export function restArms(p) { p.arms.forEach((a, i) => { if (!(p.hurt && i === 1)) a.rotation.set(p.sit ? -0.25 : 0, 0, 0); }); }

// ---------- hearts ----------
const hearts = [];
/** A few hearts floating up from (x, y, z) in `parent`, swaying and fading. */
export function heartsUp(parent, x, y, z, n = 6, cols = ['red', 'pink', 'rose']) {
  for (let i = 0; i < n; i++) {
    const h = heartMesh(cols[i % cols.length]);
    h.position.set(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.4);
    h.userData = { v: 0.5 + Math.random() * 0.6, life: 2.2 + Math.random(), t: Math.random() * 6, s: 1.6 + Math.random() * 1.6 };
    h.scale.setScalar(h.userData.s);
    parent.add(h);
    hearts.push(h);
  }
}
export function heartsTick(dt) {
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i], u = h.userData;
    u.t += dt; u.life -= dt;
    h.position.y += u.v * dt;
    h.position.x += Math.sin(u.t * 3) * 0.25 * dt;
    h.rotation.y = Math.sin(u.t * 2) * 0.6;
    h.material.opacity = Math.min(1, u.life);
    if (u.life <= 0) { h.removeFromParent(); h.material.dispose(); hearts.splice(i, 1); }
  }
}
export function heartsClear() { hearts.splice(0).forEach((h) => { h.removeFromParent(); h.material.dispose(); }); }
