/* A wooden door in a stone or timber frame, a ring for a handle; it swings open. */
import { THREE, mat, mesh, woodTex, box, brass } from './parts.js';

/** A wooden door in a stone or timber frame, `w` by `h`, a ring for a handle; `open` swings it in (0 to 1). */
export function door({ w = 1.1, h = 2.2, frameCol = '#6e655c', wood = '#5a3620' } = {}) {
  const g = new THREE.Group(), fm = mat(frameCol, { flatShading: true }), wm = mat(wood, { map: woodTex });
  g.add(box(0.22, h + 0.2, 0.3, fm, -w / 2 - 0.11, (h + 0.2) / 2, 0), box(0.22, h + 0.2, 0.3, fm, w / 2 + 0.11, (h + 0.2) / 2, 0), box(w + 0.44, 0.24, 0.3, fm, 0, h + 0.12, 0));
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, 0); g.add(hinge);
  const leaf = box(w, h, 0.07, wm, w / 2, h / 2, 0); hinge.add(leaf);
  for (const y of [0.4, h - 0.4]) hinge.add(box(w * 0.9, 0.07, 0.02, mat('#2a2622', { metalness: 0.5 }), w / 2, y, 0.045));
  const ring = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), brass); ring.position.set(w * 0.82, h * 0.48, 0.06); hinge.add(ring);
  let o = 0, want = 0;
  return { g, open(u) { want = u; }, tick(dt) { o += (want - o) * Math.min(1, dt * 5); hinge.rotation.y = -o * 1.6; } };
}

export const PIECES = [
  { id: 'door', name: 'Door', group: 'house', make: door,
    about: 'A wooden door in a stone or timber frame, a ring for a handle; open(u) swings it in. Options: w and h, frameCol, wood.',
    where: 'The housing district\'s door.' },
];
