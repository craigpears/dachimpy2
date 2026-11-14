/* An anchor-backed chair: grey, an anchor on its tall rounded back. */
import { THREE, mat, mesh, box, greyStone } from './parts.js';

const anchorGrey = mat('#5a5f66', { metalness: 0.3, roughness: 0.6 });
export function anchorChair() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.08, 0.46, greyStone, 0, 0.44, 0), box(0.5, 0.62, 0.08, greyStone, 0, 0.78, -0.2));
  const top = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 14, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), greyStone); top.position.set(0, 1.09, -0.2); g.add(top);
  for (const [x, z] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) g.add(box(0.06, 0.42, 0.06, greyStone, x, 0.21, z));
  g.add(box(0.035, 0.38, 0.02, anchorGrey, 0, 0.84, -0.15), box(0.2, 0.035, 0.02, anchorGrey, 0, 0.98, -0.15));
  const ring = mesh(new THREE.TorusGeometry(0.035, 0.01, 4, 10), anchorGrey); ring.position.set(0, 1.05, -0.15); g.add(ring);
  const arms = mesh(new THREE.TorusGeometry(0.13, 0.016, 4, 12, Math.PI).rotateZ(Math.PI), anchorGrey); arms.position.set(0, 0.79, -0.15); g.add(arms);
  return { g };
}

export const PIECES = [
  { id: 'anchorChair', name: 'Anchor-backed chair', group: 'skeleton', make: anchorChair,
    about: 'A grey chair, an anchor on its tall rounded back.',
    where: 'Primates Rule\'s deck.' },
];
