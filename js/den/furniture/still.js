/* A copper still (behind Tzz in her portrait): a fat copper pot on a brick firebox, its domed head, a pipe
   arching over to a coil in a barrel, a little fire glowing under it. About 1.6 m high. */
import { THREE, mat, mesh, box, cyl, mid } from './parts.js';

export function still() {
  const g = new THREE.Group(), copper = mat('#c4743a', { metalness: 0.7, roughness: 0.35 }), brick = mat('#8a4a32', { roughness: 1 });
  g.add(box(0.9, 0.4, 0.9, brick, 0, 0.2, 0));
  const fire = mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff9a3a' }), false); fire.position.set(0, 0.18, 0.4); fire.scale.set(1.4, 0.7, 0.4); g.add(fire);
  const pot = mesh(new THREE.SphereGeometry(0.45, 18, 14), copper); pot.position.y = 0.78; pot.scale.y = 0.85; g.add(pot);
  g.add(cyl(0.12, 0.3, 0.3, copper, 0, 1.25), cyl(0.06, 0.08, 0.2, copper, 0, 1.48));
  const curve = new THREE.CatmullRomCurve3([[0, 1.55, 0], [0.4, 1.7, 0], [0.85, 1.4, 0], [1.05, 0.95, 0]].map((p) => new THREE.Vector3(...p)));
  g.add(mesh(new THREE.TubeGeometry(curve, 20, 0.035, 6), copper));
  g.add(cyl(0.28, 0.3, 0.75, mid, 1.1, 0.375, 0));
  for (const y of [0.15, 0.6]) g.add(cyl(0.305, 0.305, 0.04, mat('#3a3330', { metalness: 0.4 }), 1.1, y, 0));
  return { g, tick() { fire.scale.y = 0.6 + Math.sin(performance.now() / 90) * 0.12; } };
}

export const PIECES = [
  { id: 'still', name: 'Copper still', group: 'cargo', make: still,
    about: 'A fat copper pot on a brick firebox, a pipe arching over to a coil in a barrel, a little fire under it. About 1.6 m high.',
    where: 'Tzz\'s island, beside her (as in her portrait).' },
];
