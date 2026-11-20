/* Branching coral, standing up off a rock: an Atlantean ship's (src/den-frigate.ts, CORAL_THRONE). */
import { THREE, mat, mesh, ball } from './parts.js';

/** A coral. `col`: its colour; `h`: how tall. */
export function coral({ col = '#ef7a6a', h = 0.9 } = {}) {
  const g = new THREE.Group(), m = mat(col, { roughness: 0.75 }), rock = mat('#7d8b8a', { roughness: 1, flatShading: true });
  const base = mesh(new THREE.DodecahedronGeometry(0.22, 0), rock); base.scale.set(1.2, 0.5, 1); base.position.y = 0.08; g.add(base);
  // (each branch a tapering stalk, splitting twice, a knob at each tip)
  const branch = (x, y, z, len, r, tilt, turn, depth) => {
    const s = mesh(new THREE.CylinderGeometry(r * 0.6, r, len, 6), m);
    const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(turn), Math.cos(tilt), Math.sin(tilt) * Math.sin(turn));
    s.position.set(x, y, z).addScaledVector(dir, len / 2); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(s);
    const tx = x + dir.x * len, ty = y + dir.y * len, tz = z + dir.z * len;
    if (depth === 0) { g.add(ball(r * 0.75, m, tx, ty, tz, 6)); return; }
    for (const k of [-1, 1]) branch(tx, ty, tz, len * 0.7, r * 0.7, tilt + k * 0.45, turn + k * 0.9 + depth, depth - 1);
  };
  for (let i = 0; i < 3; i++) branch(0, 0.14, 0, h * 0.4, 0.06, 0.25, i * 2.1, 2);
  return { g };
}

export const PIECES = [
  { id: 'coral', name: 'Coral', group: 'styles', make: coral,
    about: 'Branching coral standing up off a rock. Options: col (its colour), h (how tall).',
    where: 'The Atlantean war frigate\'s deck.' },
];
