/* A grand piano, black (as on Primates Rule's quarterdeck): its lid propped open, its keyboard toward +z.
   About 1.25 across and 1.4 deep. */
import { THREE, mat, mesh, box, cyl, rod, ivory } from './parts.js';

const pianoBlack = mat('#131216', { roughness: 0.22, metalness: 0.15 });
export function grandPiano() {
  const g = new THREE.Group(), s = new THREE.Shape();
  // Its outline from above (x across, y = -z: the keyboard's edge at z 0.45, the curved tail at z -0.7).
  s.moveTo(-0.62, -0.45); s.lineTo(0.62, -0.45); s.lineTo(0.62, 0.0);
  s.bezierCurveTo(0.62, 0.3, 0.25, 0.3, 0.2, 0.5); s.quadraticCurveTo(0.1, 0.7, -0.2, 0.7); s.lineTo(-0.62, 0.7); s.closePath();
  const body = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), pianoBlack); body.position.y = 0.62; g.add(body);
  const hinge = new THREE.Group(); hinge.position.set(-0.62, 0.92, 0); hinge.rotation.z = 0.6; g.add(hinge);
  const lid = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), pianoBlack); lid.position.x = 0.62; hinge.add(lid);
  g.add(rod([0.5, 0.9, 0.1], [0.5, 1.5, 0.1], 0.012, pianoBlack, 4));
  for (const [x, z] of [[-0.5, 0.35], [0.5, 0.35], [-0.35, -0.55]]) g.add(cyl(0.05, 0.04, 0.62, pianoBlack, x, 0.31, z, 8));
  g.add(box(1.2, 0.1, 0.24, pianoBlack, 0, 0.78, 0.55), box(1.12, 0.04, 0.16, ivory, 0, 0.845, 0.56));
  for (let i = 0; i < 15; i++) if (i % 7 !== 2 && i % 7 !== 6) g.add(box(0.035, 0.02, 0.09, pianoBlack, -0.54 + i * 0.075, 0.87, 0.53));
  const stand = box(0.6, 0.26, 0.02, pianoBlack, 0, 1.03, 0.4); stand.rotation.x = -0.25; g.add(stand);
  return { g };
}

export const PIECES = [
  { id: 'grandPiano', name: 'Grand piano', group: 'skeleton', make: grandPiano,
    about: 'A black grand piano, its lid propped open, its keyboard toward you.',
    where: 'Primates Rule\'s quarterdeck.' },
];
