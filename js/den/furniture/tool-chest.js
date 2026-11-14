/* A tool chest, its lid thrown back, a hammer and a saw sticking out. */
import { THREE, box, rod, mid, dark, brass, ironBlack, steel } from './parts.js';

export function toolChest() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.34, 0.42, mid, 0, 0.17, 0), box(0.72, 0.04, 0.44, brass, 0, 0.3, 0), box(0.72, 0.04, 0.44, brass, 0, 0.06, 0));
  const lid = box(0.7, 0.05, 0.42, mid, 0, 0, 0.21), hinge = new THREE.Group(); hinge.position.set(0, 0.34, -0.21); hinge.rotation.x = -1.9; hinge.add(lid); g.add(hinge);
  g.add(rod([0.12, 0.25, 0], [0.2, 0.55, 0.05], 0.018, dark), box(0.16, 0.05, 0.05, ironBlack, 0.2, 0.57, 0.05));
  const saw = box(0.04, 0.32, 0.14, steel, -0.15, 0.42, 0); saw.rotation.z = 0.25; g.add(saw, box(0.05, 0.08, 0.06, dark, -0.2, 0.6, 0));
  return { g };
}

export const PIECES = [
  { id: 'toolChest', name: 'Tool chest', group: 'skeleton', make: toolChest,
    about: 'A tool chest, its lid thrown back, a hammer and a saw sticking out.',
    where: 'Primates Rule\'s deck.' },
];
