/* Crates and barrels stacked under a tarp, roped down, its corner turned back on a barrel's top (the
   smugglers' beach). */
import { THREE, mat, mesh, at, cloth } from './parts.js';
import { crate } from './crate.js';
import { barrel } from './barrel.js';

/** Crates and barrels stacked under a tarp, `col`, roped down, its corner turned back on a barrel's top. */
export function tarpPile({ col = '#6f6a4e' } = {}) {
  const g = new THREE.Group(), tarp = cloth(col);
  for (const [x, z, s] of [[-0.4, -0.2, 0.75], [0.38, -0.25, 0.7], [-0.05, 0.4, 0.65]]) g.add(at(crate({ s }).g, x, 0, z));
  g.add(at(crate({ s: 0.55 }).g, -0.2, 0.75, -0.2));
  // the tarp: a draped shell over the stack, its hem on the sand
  const shell = mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), tarp); shell.scale.set(1.05, 1.4, 0.95); shell.position.set(-0.05, 0, -0.02);
  g.add(shell);
  for (const x of [-0.45, 0.4]) { const rope = mesh(new THREE.TorusGeometry(1.0, 0.025, 4, 18, Math.PI), mat('#c8b48a', { roughness: 1 })); rope.scale.set(1.08, 1.42, 1); rope.rotation.y = Math.PI / 2; rope.position.set(x, 0, -0.02); g.add(rope); }
  const b = barrel({ h: 0.75 }).g; b.position.set(1.05, 0, 0.35); g.add(b);
  const flap = mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, side: THREE.DoubleSide })); flap.rotation.set(-1.2, 0.3, 0.2); flap.position.set(0.85, 0.8, 0.3);
  g.add(flap);
  return { g };
}

export const PIECES = [
  { id: 'tarpPile', name: 'Tarp pile', group: 'cargo', make: tarpPile,
    about: 'Crates and barrels stacked under a tarp, roped down, one corner turned back. Options: col (the tarp).',
    where: 'The smugglers\' beach.' },
];
