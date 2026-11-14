/* A four-poster bed (Gravee's bedchamber). */
import { THREE, mat, mesh, box, cyl, cloth, dark } from './parts.js';

/** A bed: a four-poster, its canopy and curtains in its colour, a pillow and a turned-down blanket. */
export function bed({ col = '#2f5a32' } = {}) {
  const g = new THREE.Group(), drape = cloth(col);
  g.add(box(1.7, 0.35, 2.2, dark, 0, 0.3, 0), box(1.6, 0.18, 2.05, mat('#efe8d8'), 0, 0.56, 0.02), box(1.62, 0.12, 1.3, drape, 0, 0.68, 0.38));
  const pillow = mesh(new THREE.BoxGeometry(1.1, 0.14, 0.4), mat('#f6f2ea')); pillow.position.set(0, 0.72, -0.72); g.add(pillow);
  g.add(box(1.7, 0.9, 0.08, dark, 0, 0.75, -1.1));   // the headboard
  for (const [x, z] of [[-0.82, -1.08], [0.82, -1.08], [-0.82, 1.08], [0.82, 1.08]]) g.add(cyl(0.05, 0.05, 2.3, dark, x, 1.15, z, 8));
  // The canopy: rails round the top, a valance hanging from them (open above, so you can see in).
  g.add(box(1.76, 0.06, 0.06, dark, 0, 2.3, -1.1), box(1.76, 0.06, 0.06, dark, 0, 2.3, 1.1), box(0.06, 0.06, 2.24, dark, -0.84, 2.3, 0), box(0.06, 0.06, 2.24, dark, 0.84, 2.3, 0));
  g.add(box(1.76, 0.22, 0.03, drape, 0, 2.16, 1.12), box(0.03, 0.22, 2.24, drape, -0.86, 2.16, 0), box(0.03, 0.22, 2.24, drape, 0.86, 2.16, 0));
  for (const s of [-1, 1]) {
    const c = mesh(new THREE.BoxGeometry(0.04, 1.9, 0.5), drape); c.position.set(0.84 * s, 1.35, -0.8); g.add(c);
    const c2 = mesh(new THREE.BoxGeometry(0.04, 1.9, 0.4), drape); c2.position.set(0.84 * s, 1.35, 0.86); g.add(c2);
  }
  return { g };
}

export const PIECES = [
  { id: 'bed', name: 'Four-poster bed', group: 'house', make: bed,
    about: 'A four-poster: its canopy and curtains in its colour, a pillow and a turned-down blanket. Options: col (the drapes).',
    where: 'Gravee\'s bedchamber.' },
];
