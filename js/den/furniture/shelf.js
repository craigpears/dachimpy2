/* A shelf of trinkets, freestanding, its back to a wall: three shelves, and on them a jar of cookies and a
   stack of books, a model sloop on a stand and a ship in a bottle, a little gold cup and a treasure chest.
   Baked: a few meshes. Dachimpy's museum. */
import { THREE, mat, mesh, woodTex, box, cyl, dark, mid, brass, gilt, glass, cork, doughM } from './parts.js';
import { bake } from '../bake.js';

export function shelf() {
  const g = new THREE.Group(), W = 1.2, D = 0.36, Hh = 1.75;
  g.add(box(W, Hh, 0.03, dark, 0, Hh / 2, -D / 2 + 0.015), box(0.05, Hh, D, dark, -W / 2 + 0.025, Hh / 2, 0), box(0.05, Hh, D, dark, W / 2 - 0.025, Hh / 2, 0));
  for (const y of [0.04, 0.5, 1.0, 1.5, Hh - 0.02]) g.add(box(W, 0.04, D, mid, 0, y, 0));
  // a jar of cookies, and books
  g.add(cyl(0.11, 0.11, 0.24, glass, -0.3, 0.64, 0, 14), cyl(0.115, 0.115, 0.03, cork, -0.3, 0.775, 0, 14));
  for (let i = 0; i < 5; i++) g.add(cyl(0.07, 0.07, 0.012, doughM, -0.3 + Math.sin(i) * 0.02, 0.535 + i * 0.03, Math.cos(i) * 0.02, 12));
  ['#7a2a3a', '#2a4a6a', '#3a5a2a', '#8a6a2a'].forEach((col, i) => g.add(box(0.05, 0.3 - (i % 2) * 0.04, 0.24, mat(col, { roughness: 0.8 }), 0.18 + i * 0.06, 0.67 - (i % 2) * 0.02, 0)));
  // a model sloop on her stand, and a ship in a bottle
  const sloop = new THREE.Group();
  sloop.add(box(0.3, 0.06, 0.08, mat('#7a4a28', { map: woodTex }), 0, 0.05, 0), cyl(0.008, 0.008, 0.3, dark, 0.02, 0.22, 0, 6));
  const sail = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 0.24), new THREE.Vector2(0.16, 0.02)])), new THREE.MeshStandardMaterial({ color: '#f4efe2', side: THREE.DoubleSide, roughness: 0.9 }));
  sail.position.set(0.03, 0.09, 0); sloop.add(sail);
  sloop.add(box(0.04, 0.03, 0.04, dark, -0.08, 0.0, 0), box(0.04, 0.03, 0.04, dark, 0.08, 0.0, 0));
  sloop.position.set(-0.25, 1.035, 0); g.add(sloop);
  const bottle = cyl(0.06, 0.06, 0.3, glass, 0.25, 1.08, 0.02, 12); bottle.rotation.z = Math.PI / 2; g.add(bottle);
  const neck = cyl(0.025, 0.035, 0.08, glass, 0.44, 1.08, 0.02, 10); neck.rotation.z = Math.PI / 2;
  const cap = cyl(0.024, 0.024, 0.03, cork, 0.49, 1.08, 0.02, 8); cap.rotation.z = Math.PI / 2; g.add(neck, cap);
  g.add(box(0.14, 0.025, 0.035, mat('#7a4a28'), 0.25, 1.06, 0.02), box(0.006, 0.07, 0.006, dark, 0.25, 1.1, 0.02));
  // a little gold cup, and a treasure chest
  g.add(cyl(0.05, 0.06, 0.03, gilt, -0.25, 1.535, 0, 12), cyl(0.012, 0.012, 0.08, gilt, -0.25, 1.59, 0, 8), cyl(0.07, 0.035, 0.1, gilt, -0.25, 1.68, 0, 14));
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.03, 0.007, 5, 10, Math.PI), gilt); h.position.set(-0.25 + s * 0.075, 1.68, 0); h.rotation.z = -s * Math.PI / 2; g.add(h); }
  g.add(box(0.26, 0.14, 0.17, mat('#6a3a1c', { map: woodTex }), 0.25, 1.59, 0), box(0.27, 0.025, 0.18, brass, 0.25, 1.6, 0), box(0.04, 0.05, 0.01, brass, 0.25, 1.6, 0.09));
  const lid = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.26, 12, 1, false, 0, Math.PI), mat('#6a3a1c', { map: woodTex })); lid.rotation.z = Math.PI / 2; lid.position.set(0.25, 1.66, 0); g.add(lid);
  bake(g);
  return { g };
}

export const PIECES = [
  { id: 'shelf', name: 'Shelf of trinkets', group: 'museum', make: shelf,
    about: 'Three shelves: a jar of cookies and books, a model sloop and a ship in a bottle, a little gold cup and a treasure chest.',
    where: 'Dachimpy\'s museum.' },
];
