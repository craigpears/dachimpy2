/* A crate, battens across its faces: cargo (the smugglers' beach). */
import { THREE, mat, woodTex, box, dark } from './parts.js';

const crateM = mat('#9a7a50', { map: woodTex });
/** A crate, `s` metres a side, battens across its faces. */
export function crate({ s = 0.7 } = {}) {
  const g = new THREE.Group();
  g.add(box(s, s, s, crateM, 0, s / 2, 0));
  for (const z of [-1, 1]) for (const y of [0.15, 0.85]) g.add(box(s + 0.02, s * 0.1, 0.03, dark, 0, s * y, z * (s / 2 + 0.01)));
  return { g };
}

export const PIECES = [
  { id: 'crate', name: 'Crate', group: 'cargo', make: crate,
    about: 'A wooden crate, battens across its faces. Options: s (metres a side).',
    where: 'The smugglers\' beach; under the tarp pile.' },
];
