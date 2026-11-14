/* A plain wooden chair. */
import { THREE, mat, woodTex, box, cyl, mid } from './parts.js';

/** A plain wooden chair. */
export function chair({ col = '#7a4a28' } = {}) {
  const g = new THREE.Group(), m = col === '#7a4a28' ? mid : mat(col, { map: woodTex });
  g.add(box(0.48, 0.06, 0.46, m, 0, 0.46, 0), box(0.48, 0.55, 0.05, m, 0, 0.76, -0.21));
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) g.add(cyl(0.025, 0.025, 0.46, m, x, 0.23, z, 6));
  return { g };
}

export const PIECES = [
  { id: 'chair', name: 'Chair', group: 'house', make: chair,
    about: 'A plain wooden chair. Options: col (its wood\'s colour).',
    where: 'Gravee\'s and Roobear\'s houses.' },
];
