/* A skeleton chair (YPPedia: Skeleton chair): a chair of bones, a skull atop its back. */
import { THREE, rod, ball, bone } from './parts.js';
import { skeleton, skull } from './skeleton.js';

/** A skeleton chair: a chair of bones, a skull atop its back. `sitter`: a skeleton sat in it. */
export function skeletonChair({ sitter = false } = {}) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) g.add(rod([x, 0, z], [x, 0.44, z], 0.028, bone), ball(0.045, bone, x, 0.02, z), ball(0.045, bone, x, 0.44, z));
  for (let i = 0; i < 5; i++) g.add(rod([-0.24, 0.47, -0.18 + i * 0.09], [0.24, 0.47, -0.18 + i * 0.09], 0.024, bone));
  for (const x of [-0.2, -0.07, 0.07, 0.2]) g.add(rod([x, 0.47, -0.2], [x * 0.9, 1.08, -0.24], 0.022, bone));
  g.add(rod([-0.22, 0.75, -0.215], [0.22, 0.75, -0.215], 0.02, bone), rod([-0.2, 1.05, -0.24], [0.2, 1.05, -0.24], 0.02, bone));
  skull(g, 0, 1.17, -0.24, 0.085);
  if (sitter) { const s = skeleton({ pose: 'sit' }); s.g.position.z = -0.1; g.add(s.g); }
  return { g };
}

export const PIECES = [
  { id: 'skeletonChair', name: 'Skeleton chair', group: 'skeleton', make: skeletonChair, sample: { sitter: true },
    about: 'A chair of bones, a skull atop its back (YPPedia: Skeleton chair). Options: sitter (a skeleton sat in it).',
    where: 'Primates Rule\'s deck.' },
];
