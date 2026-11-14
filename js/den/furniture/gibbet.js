/* A gibbet (YPPedia: Gibbet): a post and arm on a pale platform, an iron cage hanging from it, a skeleton
   slumped inside. Its cage swings a little (`tick`), so it's left out of a bake. */
import { THREE, mat, mesh, woodTex, box, cyl, rod, dark, ironBlack } from './parts.js';
import { skeleton } from './skeleton.js';
import { bake } from '../bake.js';

const paleDeal = mat('#c2b6a2', { map: woodTex, roughness: 0.9 });
export function gibbet({ bones = true } = {}) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.08, 0.9, paleDeal, 0, 0.04, 0), box(0.12, 2.1, 0.12, dark, -0.36, 1.13, 0), box(0.82, 0.1, 0.1, dark, -0.01, 2.13, 0), rod([-0.36, 1.75, 0], [-0.02, 2.1, 0], 0.03, dark));
  const hang = new THREE.Group(); hang.position.set(0.24, 2.08, 0); hang.userData.live = true; g.add(hang);
  hang.add(rod([0, 0, 0], [0, -0.16, 0], 0.012, ironBlack, 4));
  const cage = new THREE.Group(); cage.position.y = -0.16; hang.add(cage);
  for (const y of [0, -0.5, -1.0]) { const ring = mesh(new THREE.TorusGeometry(0.24, 0.016, 4, 14).rotateX(Math.PI / 2), ironBlack); ring.position.y = y; cage.add(ring); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 0.24, z = Math.sin(a) * 0.24; cage.add(rod([x, 0, z], [x, -1.0, z], 0.012, ironBlack, 4), rod([x, 0, z], [0, 0.14, 0], 0.012, ironBlack, 4)); }
  cage.add(cyl(0.24, 0.24, 0.02, ironBlack, 0, -1.0, 0, 14));
  if (bones) { const s = skeleton({ pose: 'slump' }); s.g.scale.setScalar(0.55); s.g.position.y = -0.99; cage.add(s.g); }
  bake(hang);   // (the cage and its bones as a few meshes, swinging as one)
  let t = Math.random() * 10;
  return { g, tick(dt) { t += dt; hang.rotation.z = Math.sin(t * 1.3) * 0.05; hang.rotation.x = Math.sin(t * 0.9 + 1) * 0.035; } };
}

export const PIECES = [
  { id: 'gibbet', name: 'Gibbet', group: 'skeleton', make: gibbet,
    about: 'A post and arm on a pale platform, an iron cage hanging from it swinging a little, a skeleton slumped inside. Options: bones (whether there\'s one in it).',
    where: 'Primates Rule\'s deck.' },
];
