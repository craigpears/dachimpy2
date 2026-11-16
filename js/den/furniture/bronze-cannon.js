/* A large cannon in any metal, on its carriage: its muzzle toward +z, 0.8 out, its barrel 0.42 up, as the skeletal
   cannon's. An Atlantean ship's in green verdigris and gold (src/den-frigate.ts, CORAL_THRONE). */
import { THREE, mat, mesh, box, cyl, ball, socket, dark } from './parts.js';

/** A cannon. `col`: its barrel's metal; `band`: its bands'; `wood`: its carriage's. */
export function bronzeCannon({ col = '#9c6b2e', band = '#d9a93a', wood = null } = {}) {
  const g = new THREE.Group(), metal = mat(col, { metalness: 0.65, roughness: 0.4 }), trim = mat(band, { metalness: 0.75, roughness: 0.3 }), carriage = wood ? mat(wood, { roughness: 0.8 }) : dark;
  g.add(box(0.48, 0.2, 0.86, carriage, 0, 0.2, -0.1), box(0.3, 0.12, 0.3, carriage, 0, 0.36, -0.35));
  for (const sx of [-1, 1]) for (const z of [-0.42, 0.22]) { const w = cyl(0.13, 0.13, 0.06, carriage, 0.27 * sx, 0.13, z, 12); w.rotation.z = Math.PI / 2; g.add(w); }
  const barrel = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.3, 14).rotateX(Math.PI / 2), metal); barrel.position.set(0, 0.42, 0.1); g.add(barrel);
  const lip = mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.14, 14).rotateX(Math.PI / 2), trim); lip.position.set(0, 0.42, 0.74); g.add(lip);
  const bore = mesh(new THREE.CircleGeometry(0.1, 12), socket, false); bore.position.set(0, 0.42, 0.812); g.add(bore);
  for (const [z, r] of [[-0.3, 0.2], [0.2, 0.18]]) { const b = mesh(new THREE.TorusGeometry(r, 0.03, 5, 16), trim); b.position.set(0, 0.42, z); g.add(b); }
  g.add(ball(0.2, metal, 0, 0.42, -0.55, 12), ball(0.07, trim, 0, 0.42, -0.76));
  return { g };
}

export const PIECES = [
  { id: 'bronzeCannon', name: 'Large cannon', group: 'styles', make: bronzeCannon, sample: { col: '#3f8f7f', band: '#d9a93a' },
    about: 'A large cannon on its carriage in any metal, its muzzle facing you. Options: col (its barrel), band (its bands), wood (its carriage).',
    where: 'The Atlantean war frigate\'s guns, in verdigris and gold; any ship\'s that wants plain ones.' },
];
