/* A barrel, standing, bound in iron hoops: cargo (the smugglers' beach, Helium's distillery, the rum run). */
import { THREE, mat, woodTex, cyl } from './parts.js';

const staves = mat('#8a6238', { map: woodTex }), hoops = mat('#3b3631', { metalness: 0.5, roughness: 0.6 });
/** A barrel, standing, bound in iron hoops. */
export function barrel({ h = 0.8 } = {}) {
  const g = new THREE.Group(), r = h * 0.36;
  g.add(cyl(r * 0.88, r * 0.88, h, staves, 0, h / 2, 0, 14), cyl(r, r, h * 0.5, staves, 0, h / 2, 0, 14));
  for (const y of [0.1, 0.32, 0.68, 0.9]) g.add(cyl(r * (y > 0.2 && y < 0.8 ? 1.01 : 0.92), r * (y > 0.2 && y < 0.8 ? 1.01 : 0.92), 0.04, hoops, 0, h * y, 0, 14));
  return { g };
}

export const PIECES = [
  { id: 'barrel', name: 'Barrel', group: 'cargo', make: barrel,
    about: 'A barrel, standing, bound in iron hoops. Options: h (its height).',
    where: 'The smugglers\' beach, Helium\'s distillery, the rum run\'s deck.' },
];
