/* A lantern on a post, lit, its glow round it (the smugglers' beach). */
import { THREE, mesh, box, cyl, dark, ironBlack, flameM, glowM } from './parts.js';

/** A lantern on a post, lit, its glow round it. */
export function lantern({ h = 1.5 } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.06, h, dark, 0, h / 2, 0, 6), box(0.4, 0.04, 0.04, dark, 0.18, h - 0.05, 0));
  const L = new THREE.Group(); L.position.set(0.34, h - 0.12, 0);
  L.add(box(0.16, 0.2, 0.16, glowM.clone(), 0, -0.14, 0), cyl(0.04, 0.04, 0.1, flameM, 0, -0.14, 0, 6), box(0.2, 0.03, 0.2, ironBlack, 0, -0.03, 0), box(0.2, 0.03, 0.2, ironBlack, 0, -0.25, 0));
  for (const [x, z] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) L.add(box(0.015, 0.22, 0.015, ironBlack, x, -0.14, z));
  const halo = mesh(new THREE.SphereGeometry(0.42, 12, 8), glowM, false); halo.position.y = -0.14; L.add(halo);
  g.add(L);
  return { g };
}

export const PIECES = [
  { id: 'lantern', name: 'Lantern', group: 'light', make: lantern,
    about: 'A lantern hung from a post, lit, its glow round it. Options: h (the post\'s height).',
    where: 'The smugglers\' beach.' },
];
