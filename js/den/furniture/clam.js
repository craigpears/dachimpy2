/* A giant clam, open, a pearl in it glowing faintly: an Atlantean ship's (src/den-frigate.ts, CORAL_THRONE). */
import { THREE, mat, mesh, ball } from './parts.js';

/** A giant clam. `col`: its shell; `pearl`: its pearl's. */
export function clam({ col = '#d9c6e8', pearl = '#fff4fb' } = {}) {
  const g = new THREE.Group(), shell = mat(col, { roughness: 0.45, metalness: 0.1, side: THREE.DoubleSide }), inner = mat('#f6e3ee', { roughness: 0.3, side: THREE.DoubleSide });
  // (each half a ribbed bowl: a squashed half sphere, its ribs a few thin wedges along it)
  const half = (open) => {
    const h = new THREE.Group();
    const bowl = mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell); bowl.scale.set(1, 0.42, 0.8); h.add(bowl);
    const lining = mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), inner); lining.scale.set(0.97, 0.38, 0.77); lining.position.y = -0.005; h.add(lining);
    for (let i = -3; i <= 3; i++) { const rib = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.62), shell); rib.position.set(i * 0.11, 0.15 - Math.abs(i) * 0.02, 0); rib.rotation.z = i * 0.18; h.add(rib); }
    h.rotation.x = open;
    return h;
  };
  const lower = half(Math.PI); lower.position.set(0, 0.2, 0); g.add(lower);
  const upper = half(-0.75); upper.position.set(0, 0.22, -0.3); g.add(upper);
  g.add(ball(0.11, mat(pearl, { roughness: 0.15, metalness: 0.3, emissive: '#c8b6ff', emissiveIntensity: 0.35 }), 0, 0.27, 0.02, 16));
  return { g };
}

export const PIECES = [
  { id: 'clam', name: 'Giant clam', group: 'styles', make: clam,
    about: 'A giant clam, open, a pearl in it glowing faintly. Options: col (its shell), pearl.',
    where: 'The Atlantean war frigate\'s deck.' },
];
