/* A suit of armour stood on a stone plinth, a plume on its helm. */
import { THREE, mat, box, cyl, rod, ball, steel, socket } from './parts.js';

const plinthM = mat('#dcd6cb', { roughness: 0.9 });
/** A suit of armour stood on a stone plinth, a plume on its helm. */
export function armour({ plinth = true, plume = '#2f5fb8' } = {}) {
  const g = new THREE.Group(), y0 = plinth ? 0.34 : 0;
  if (plinth) g.add(box(0.56, 0.3, 0.5, plinthM, 0, 0.15, 0), box(0.62, 0.04, 0.56, plinthM, 0, 0.32, 0));
  for (const sx of [-1, 1]) {
    g.add(cyl(0.07, 0.06, 0.82, steel, 0.1 * sx, y0 + 0.43, 0, 8), ball(0.075, steel, 0.1 * sx, y0 + 0.45, 0.02), box(0.11, 0.06, 0.2, steel, 0.1 * sx, y0 + 0.03, 0.04));
    g.add(ball(0.1, steel, 0.25 * sx, y0 + 1.35, 0), rod([0.26 * sx, y0 + 1.32, 0], [0.27 * sx, y0 + 0.95, 0.04], 0.055, steel), ball(0.06, steel, 0.27 * sx, y0 + 0.9, 0.05));
  }
  g.add(cyl(0.2, 0.24, 0.22, steel, 0, y0 + 0.92, 0, 12), cyl(0.21, 0.17, 0.42, steel, 0, y0 + 1.22, 0, 12), box(0.02, 0.36, 0.06, steel, 0, y0 + 1.22, 0.18));
  g.add(cyl(0.11, 0.115, 0.2, steel, 0, y0 + 1.56, 0, 12), ball(0.11, steel, 0, y0 + 1.66, 0, 12), box(0.15, 0.025, 0.02, socket, 0, y0 + 1.58, 0.11));
  const pl = cyl(0.01, 0.06, 0.24, mat(plume, { roughness: 0.95 }), 0, y0 + 1.86, -0.02, 8); pl.rotation.x = -0.35; g.add(pl);
  return { g };
}

export const PIECES = [
  { id: 'armour', name: 'Suit of armour', group: 'skeleton', make: armour,
    about: 'A suit of armour stood on a stone plinth, a plume on its helm. Options: plinth, plume (its colour).',
    where: 'Primates Rule\'s deck.' },
];
