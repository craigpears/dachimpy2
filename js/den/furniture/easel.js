/* An easel: three legs, a ledge, a canvas on it (a picture: setPicture, as a frame's), and a palette
   hooked on one leg. Facing +z (the canvas's front). Gravee paints your portrait on it. */
import { THREE, mat, mesh, woodTex, at, box, cyl, mid, PLAIN } from './parts.js';
import { CANVAS } from '../../den-houses.js';

export function easel() {
  const g = new THREE.Group();
  for (const [x, z, rz, rx] of [[-0.32, 0.08, -0.12, 0.08], [0.32, 0.08, 0.12, 0.08], [0, -0.42, 0, -0.32]]) {
    const leg = cyl(0.03, 0.035, 1.9, mid, x, 0.93, z, 6); leg.rotation.set(rx, 0, rz); g.add(leg);
  }
  g.add(box(0.86, 0.05, 0.12, mid, 0, 0.82, 0.15));
  // The canvas: on the ledge, leant on the front legs and clear in front of them (never the wood through
  // the painting), as they lean.
  const cv = mesh(new THREE.BoxGeometry(0.8, 1.0, 0.03), mat('#f2ead8', { roughness: 0.9 }));
  cv.position.set(0, CANVAS.y, CANVAS.out); cv.rotation.x = 0.08; g.add(cv);   // (where a painter's brush goes: src/den-houses.ts)
  const pic = mesh(new THREE.PlaneGeometry(0.76, 0.96), new THREE.MeshStandardMaterial({ map: PLAIN, roughness: 0.85 }), false);
  pic.position.set(0, 0, 0.017); cv.add(pic);
  const pal = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 16), mat('#c9a56e', { map: woodTex }));
  pal.rotation.set(Math.PI / 2, 0, 0.3); pal.position.set(-0.55, 1.05, 0.12); g.add(pal);
  for (const [c, a] of [['#d72c22', 0], ['#2a6fd7', 1.3], ['#f8ff35', 2.4], ['#3b6c2c', 3.6], ['#f6f2ea', 4.8]]) g.add(at(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(c)), -0.55 + Math.cos(a) * 0.1, 1.05 + Math.sin(a) * 0.1, 0.14));
  pic.visible = false;
  return {
    g, canvas: cv,
    /** The picture on it, or none (a blank canvas). */
    setPicture(tex) { pic.material.map = tex || PLAIN; pic.material.needsUpdate = true; pic.visible = !!tex; },
  };
}

export const PIECES = [
  { id: 'easel', name: 'Easel', group: 'pictures', make: easel,
    about: 'Three legs, a ledge, a canvas on it and a palette hooked on one leg. A picture can be painted onto its canvas (setPicture).',
    where: 'Gravee\'s hall, where she paints your portrait.' },
];
