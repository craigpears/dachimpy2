/* Summoning furniture, as in Puzzle Pirates' houses: a werewolf summoning stump (a gnarled stump, pink-eyed skulls
   in its roots, where a charm brings a werewolf pack), and a vampire summoning altar (a gothic altar, its arch glazed
   green and purple). Jezerbell's house has the stump. The stump's `glow(k)` lights its
   skulls' eyes and a ring round it (0 to 1): its summoning. */
import { THREE, mat, mesh, box, cyl, rod, ball, bone, socket, gilt, wax, flameM } from './parts.js';

const bark = mat('#4b3626', { roughness: 0.95 }), heartwood = mat('#8a6a48', { roughness: 0.9 }), moss = mat('#2f4a24', { roughness: 1 });
const eyeM = () => new THREE.MeshBasicMaterial({ color: '#ff4fa3' });

/** A werewolf summoning stump: a gnarled stump, its roots spread, pink-eyed skulls among them. `glow(k)`: its
    summoning, the skulls' eyes blazing and a ring of light on the floor (k from 0 to 1). */
export function summoningStump({ skulls = 5 } = {}) {
  const g = new THREE.Group(), eye = eyeM();
  g.add(cyl(0.42, 0.55, 0.62, bark, 0, 0.31, 0, 9), cyl(0.4, 0.4, 0.02, heartwood, 0, 0.625, 0, 9));
  // a broken stub of trunk on one side, and the roots
  const stub = cyl(0.12, 0.2, 0.42, bark, -0.18, 0.8, -0.12, 7); stub.rotation.z = 0.25; g.add(stub);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.3, r = 0.5 + (i % 2) * 0.25;
    g.add(rod([Math.cos(a) * 0.38, 0.22, Math.sin(a) * 0.38], [Math.cos(a) * (r + 0.35), 0.03, Math.sin(a) * (r + 0.35)], 0.075 - (i % 2) * 0.02, bark));
  }
  // moss round its foot
  const tuft = cyl(0.95, 1.05, 0.04, moss, 0, 0.02, 0, 14); g.add(tuft);
  // the skulls, among the roots, round the front
  for (let i = 0; i < skulls; i++) {
    const a = Math.PI / 2 + (i - (skulls - 1) / 2) * 0.62, r = 0.72 + (i % 2) * 0.12, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const s = new THREE.Group();
    s.add(ball(0.13, bone, 0, 0.13, 0, 10), box(0.15, 0.07, 0.1, bone, 0, 0.04, 0.05));
    for (const sx of [-1, 1]) s.add(ball(0.04, socket, 0.05 * sx, 0.15, 0.1), ball(0.025, eye, 0.05 * sx, 0.15, 0.125));
    s.position.set(x, 0, z); s.rotation.y = Math.atan2(x, z) * 0.6;
    g.add(s);
  }
  // the ring its summoning lights on the floor
  const ringM = new THREE.MeshBasicMaterial({ color: '#d94fff', transparent: true, opacity: 0, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(1.0, 1.35, 40), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  let k = 0, t = 0;
  return {
    g,
    glow(v) { k = v; },
    tick(dt) {
      t += dt;
      const p = 0.5 + 0.5 * Math.sin(t * 3);
      eye.color.setRGB(1, 0.31 + 0.3 * k * p, 0.64 + 0.2 * k);
      ringM.opacity = k * (0.35 + 0.35 * p);
      ring.rotation.z = t * 0.6;
    },
  };
}

const stone = mat('#2c2833', { roughness: 0.85 }), stoneHi = mat('#4a4456', { roughness: 0.8 });
const glassG = mat('#5fd35a', { emissive: '#2f8a2a', emissiveIntensity: 0.5, roughness: 0.3 }), glassP = mat('#8a4fd0', { emissive: '#4a2380', emissiveIntensity: 0.5, roughness: 0.3 });
const scrollM = mat('#e9dcc0', { roughness: 0.9 }), red = mat('#a01828', { roughness: 0.8 });

/** A vampire summoning altar: a dark stone altar, behind it a gothic arch glazed green and purple between two spires,
    a scroll on the altar, candles either side. */
export function vampireAltar() {
  const g = new THREE.Group();
  g.add(box(1.5, 0.75, 0.6, stone, 0, 0.375, 0.1), box(1.6, 0.06, 0.68, stoneHi, 0, 0.78, 0.1), box(1.3, 0.12, 0.08, red, 0, 0.7, 0.42));
  // the arch: two spires and the glazing between them
  for (const sx of [-1, 1]) {
    g.add(box(0.18, 1.9, 0.18, stone, 0.7 * sx, 0.95, -0.15), cyl(0, 0.13, 0.45, stoneHi, 0.7 * sx, 2.12, -0.15, 4));
  }
  g.add(box(1.22, 1.1, 0.06, glassG, 0, 1.4, -0.17), box(0.5, 0.8, 0.07, glassP, 0, 1.35, -0.15));
  const arch = cyl(0, 0.62, 0.55, stone, 0, 2.2, -0.17, 3); arch.rotation.y = Math.PI / 6; arch.scale.z = 0.12; g.add(arch);
  g.add(box(1.36, 0.08, 0.14, stoneHi, 0, 1.97, -0.15));
  // the scroll, and its candles
  const sc = cyl(0.05, 0.05, 0.5, scrollM, 0, 0.86, 0.15, 10); sc.rotation.z = Math.PI / 2; g.add(sc, box(0.4, 0.01, 0.3, scrollM, 0, 0.815, 0.25));
  for (const sx of [-1, 1]) g.add(cyl(0.035, 0.035, 0.22, wax, 0.6 * sx, 0.92, 0.2, 8), ball(0.025, flameM, 0.6 * sx, 1.06, 0.2), cyl(0.06, 0.07, 0.03, gilt, 0.6 * sx, 0.82, 0.2, 10));
  return { g };
}

export const PIECES = [
  { id: 'summoningStump', name: 'Werewolf summoning stump', group: 'hall', make: summoningStump,
    about: 'A gnarled stump, pink-eyed skulls in its roots: a charm on it brings a werewolf pack. glow(k) lights it. Options: skulls (how many).',
    where: 'Jezerbell\'s house.' },
  { id: 'vampireAltar', name: 'Vampire summoning altar', group: 'hall', make: vampireAltar,
    about: 'A dark stone altar under a gothic arch glazed green and purple, a scroll and candles on it.',
    where: 'Nowhere yet (made for Jezerbell\'s house, left out: one summoning a house).' },
];
