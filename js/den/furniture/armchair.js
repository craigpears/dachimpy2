/* An armchair, upholstered in its colour, on little dark legs. */
import { THREE, mesh, box, cyl, cloth, ebony } from './parts.js';

/** An armchair, upholstered in its colour, on little dark legs. */
export function armchair({ col = '#4a6b3a' } = {}) {
  const g = new THREE.Group(), up = cloth(col);
  g.add(box(0.86, 0.22, 0.78, up, 0, 0.36, 0), box(0.86, 0.75, 0.18, up, 0, 0.82, -0.3), box(0.16, 0.3, 0.72, up, -0.4, 0.6, 0), box(0.16, 0.3, 0.72, up, 0.4, 0.6, 0));
  const cushion = mesh(new THREE.BoxGeometry(0.6, 0.1, 0.55), up); cushion.position.set(0, 0.52, 0.05); g.add(cushion);
  for (const [x, z] of [[-0.36, -0.32], [0.36, -0.32], [-0.36, 0.32], [0.36, 0.32]]) g.add(cyl(0.035, 0.025, 0.25, ebony, x, 0.125, z, 6));
  return { g };
}

export const PIECES = [
  { id: 'armchair', name: 'Armchair', group: 'house', make: armchair,
    about: 'An armchair, upholstered in its colour, on little dark legs. Options: col (the upholstery).',
    where: 'Every house; the catalogue\'s colours page, in the colour picked.' },
];
