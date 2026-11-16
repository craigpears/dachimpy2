/* A gold trident standing in a stand: an Atlantean ship's (src/den-frigate.ts, CORAL_THRONE). */
import { THREE, mat, box, cyl, gilt } from './parts.js';

/** A trident, upright in its stand, its prongs up. */
export function trident() {
  const g = new THREE.Group(), stone = mat('#5f8f8c', { roughness: 0.8 });
  g.add(cyl(0.22, 0.28, 0.2, stone, 0, 0.1, 0, 10), cyl(0.035, 0.035, 2.2, gilt, 0, 1.25, 0, 8));
  g.add(box(0.5, 0.06, 0.06, gilt, 0, 2.3, 0));
  for (const x of [-0.22, 0, 0.22]) g.add(cyl(0.03, 0.03, 0.42, gilt, x, 2.5, 0, 6), cyl(0, 0.06, 0.16, gilt, x, 2.78, 0, 6));
  return { g };
}

export const PIECES = [
  { id: 'trident', name: 'Trident', group: 'styles', make: trident,
    about: 'A gold trident standing upright in a stone stand.',
    where: 'The Atlantean war frigate\'s deck.' },
];
