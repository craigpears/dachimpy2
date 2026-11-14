/* A skeleton, and a skull for any piece that wants one (the skeleton chair's, the skeletal cannon's). The
   skeleton set and its company, as Puzzle Pirates has them (YPPedia: the Skeletal large cannon, the Gibbet,
   the Skeleton chair): bone white on black, from the user's war frigate (TODO.md, "Pictures of Primates
   Rule"; the user, 11 Nov: "the skeleton cannons ... the gibbet, the skeleton set"). Each piece's materials
   are shared by every copy (parts.js), so a ship full of them bakes down to a few meshes (js/den/bake.js). */
import { THREE, mesh, box, rod, ball, bone, socket } from './parts.js';

/** A skull, its middle at (x, y, z), looking toward +z. */
export function skull(parent, x, y, z, r = 0.1) {
  const c = ball(r, bone, x, y, z, 10); c.scale.set(0.92, 1, 1.08);
  parent.add(c, box(r * 1.1, r * 0.45, r * 0.9, bone, x, y - r * 0.85, z + r * 0.25));
  for (const sx of [-1, 1]) parent.add(ball(r * 0.26, socket, x + sx * r * 0.38, y - r * 0.05, z + r * 0.84, 6));
  parent.add(ball(r * 0.12, socket, x, y - r * 0.4, z + r * 0.98, 4));
}
/** A skeleton: `pose` 'stand', 'sit' (sat on a seat 0.46 high, at its origin, thighs out toward +z), or
    'slump' (hanging in a gibbet). About a pirate's height stood. */
export function skeleton({ pose = 'stand' } = {}) {
  const g = new THREE.Group(), sit = pose === 'sit', hipY = sit ? 0.5 : 0.92;
  for (const sx of [-1, 1]) {
    const hx = 0.1 * sx;
    if (sit) {
      const knee = [hx * 1.25, hipY + 0.02, 0.42];
      g.add(rod([hx, hipY, 0], knee, 0.03, bone), rod(knee, [hx * 1.25, 0.06, 0.47], 0.026, bone), ball(0.04, bone, ...knee), box(0.08, 0.04, 0.16, bone, hx * 1.25, 0.03, 0.52));
    } else {
      const knee = [hx, 0.48, pose === 'slump' ? 0.06 : 0.02];
      g.add(rod([hx, hipY, 0], knee, 0.03, bone), rod(knee, [hx, 0.06, 0], 0.026, bone), ball(0.04, bone, ...knee), box(0.08, 0.04, 0.16, bone, hx, 0.03, 0.05));
    }
  }
  g.add(box(0.26, 0.1, 0.12, bone, 0, hipY + 0.02, 0));
  // From the hips up: the spine, the ribs (open at the back), the collarbones, arms and the skull.
  const torso = new THREE.Group(); torso.position.set(0, hipY + 0.05, 0); torso.rotation.x = sit ? -0.12 : pose === 'slump' ? 0.3 : 0; g.add(torso);
  torso.add(rod([0, 0, -0.04], [0, 0.6, -0.04], 0.022, bone), rod([-0.2, 0.52, -0.02], [0.2, 0.52, -0.02], 0.018, bone));
  for (let i = 0; i < 4; i++) {
    const r = 0.13 - i * 0.012, rib = mesh(new THREE.TorusGeometry(r, 0.014, 4, 12, Math.PI * 1.5).rotateX(Math.PI / 2).rotateY(Math.PI / 4), bone);
    rib.position.set(0, 0.44 - i * 0.075, 0.02); torso.add(rib);
  }
  for (const sx of [-1, 1]) {
    const sh = [0.2 * sx, 0.5, -0.02], elbow = sit ? [0.21 * sx, 0.24, 0.12] : [0.22 * sx, 0.22, 0], hand = sit ? [0.16 * sx, 0.12, 0.38] : [0.22 * sx, -0.04, 0.04];
    torso.add(rod(sh, elbow, 0.022, bone), rod(elbow, hand, 0.018, bone), box(0.05, 0.08, 0.03, bone, hand[0], hand[1] - 0.03, hand[2]));
  }
  torso.add(rod([0, 0.6, -0.03], [0, 0.66, 0], 0.02, bone));
  skull(torso, 0, 0.76, 0.01);
  if (pose === 'slump') torso.rotation.z = 0.12;
  return { g };
}

export const PIECES = [
  { id: 'skeleton', name: 'Skeleton', group: 'skeleton', make: skeleton,
    about: 'Bones, about a pirate\'s height stood. Options: pose (\'stand\', \'sit\' on a seat, or \'slump\' in a gibbet).',
    where: 'Primates Rule\'s deck: in the skeleton chairs and the gibbets.' },
];
