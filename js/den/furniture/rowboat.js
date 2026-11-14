/* A rowboat drawn up on a beach, a pair of oars across her thwarts (the smugglers' beach). */
import { THREE, mat, mesh, woodTex, box, mid } from './parts.js';

/** A rowboat drawn up on a beach, a pair of oars across her thwarts. */
export function rowboat({ col = '#6e4a2c' } = {}) {
  const g = new THREE.Group(), hull = mat(col, { map: woodTex }), L = 2.6, B = 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, 0); shape.quadraticCurveTo(-L / 2 + 0.15, B, 0, B); shape.quadraticCurveTo(L / 2 - 0.4, B, L / 2, 0);
  shape.quadraticCurveTo(L / 2 - 0.4, -B, 0, -B); shape.quadraticCurveTo(-L / 2 + 0.15, -B, -L / 2, 0);
  const side = new THREE.Shape(shape.getPoints(16)); side.holes.push(new THREE.Path(shape.getPoints(16).map((p) => p.clone().multiplyScalar(0.9))));
  const wall = mesh(new THREE.ExtrudeGeometry(side, { depth: 0.38, bevelEnabled: false }).rotateX(-Math.PI / 2), hull); wall.position.y = 0.05;
  const floor = mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), hull); floor.position.y = 0.08; floor.scale.set(0.9, 1, 0.9);
  g.add(wall, floor);
  for (const x of [-0.45, 0.35]) g.add(box(0.16, 0.04, B * 1.75, mid, x, 0.33, 0));
  for (const s of [-1, 1]) { const oar = box(2.2, 0.04, 0.06, mid, 0.05, 0.4, s * 0.12); oar.rotation.y = s * 0.08; g.add(oar, box(0.4, 0.03, 0.14, mid, 1.1, 0.4, s * 0.2)); }
  g.rotation.z = 0.06;   // (her bow up the sand)
  return { g };
}

export const PIECES = [
  { id: 'rowboat', name: 'Rowboat', group: 'cargo', make: rowboat,
    about: 'A rowboat drawn up on a beach, a pair of oars across her thwarts. Options: col (her wood).',
    where: 'The smugglers\' beach.' },
];
