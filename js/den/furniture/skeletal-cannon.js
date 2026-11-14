/* A skeletal large cannon (YPPedia's name for it): a black barrel banded in bone, a skull on its breech, on a
   black carriage on bone wheels. Its muzzle toward +z, 0.8 out; its barrel 0.42 up. */
import { THREE, mesh, box, cyl, ball, bone, socket, ironBlack } from './parts.js';
import { skull } from './skeleton.js';

export function skeletalCannon() {
  const g = new THREE.Group();
  g.add(box(0.48, 0.2, 0.86, ironBlack, 0, 0.2, -0.1), box(0.3, 0.12, 0.3, ironBlack, 0, 0.36, -0.35));
  for (const sx of [-1, 1]) for (const z of [-0.42, 0.22]) { const w = cyl(0.13, 0.13, 0.06, bone, 0.27 * sx, 0.13, z, 12); w.rotation.z = Math.PI / 2; g.add(w); }
  const barrel = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.3, 14).rotateX(Math.PI / 2), ironBlack); barrel.position.set(0, 0.42, 0.1); g.add(barrel);
  const swell = mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.14, 14).rotateX(Math.PI / 2), ironBlack); swell.position.set(0, 0.42, 0.74); g.add(swell);
  const bore = mesh(new THREE.CircleGeometry(0.1, 12), socket, false); bore.position.set(0, 0.42, 0.812); g.add(bore);
  for (const [z, r] of [[-0.38, 0.205], [-0.14, 0.19], [0.1, 0.18], [0.34, 0.17], [0.66, 0.2]]) { const band = mesh(new THREE.TorusGeometry(r, 0.035, 5, 16), bone); band.position.set(0, 0.42, z); g.add(band); }
  g.add(ball(0.2, ironBlack, 0, 0.42, -0.55, 12), ball(0.07, bone, 0, 0.42, -0.76));
  skull(g, 0, 0.66, -0.36, 0.09);
  return { g };
}

export const PIECES = [
  { id: 'skeletalCannon', name: 'Skeletal large cannon', group: 'skeleton', make: skeletalCannon,
    about: 'A black barrel banded in bone, a skull on its breech, on a black carriage on bone wheels. Its muzzle faces you.',
    where: 'Primates Rule\'s guns.' },
];
