// A gun, as Gunnery draws it, wherever one stands: the gun tower's, the sloop's pair, a turret at sea;
// and Gunnery's bold black outlines round things (ink). (Out of js/den/gundeck.js, so the sloop can be
// drawn without the den.)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, mesh, woodTex } from './world.js';

// Bold black outlines round everything on the board, as Gunnery draws it: readable before pretty.
const inkMat = new THREE.MeshBasicMaterial({ color: '#160d06', side: THREE.BackSide });
export function ink(g, t = 0.022) {
  const list = [];
  g.traverse((m) => { if (m.isMesh && !m.userData.ink && m.geometry.type !== 'CircleGeometry') list.push(m); });
  for (const m of list) {
    m.geometry.computeBoundingSphere();
    const { radius, center } = m.geometry.boundingSphere, f = t / radius, h = new THREE.Mesh(m.geometry, inkMat);
    h.userData.ink = true;
    h.scale.setScalar(1 + f);
    h.position.copy(center).multiplyScalar(-f);
    m.add(h);
  }
  return g;
}
// A gun as Gunnery draws it: a long bright iron barrel lying on the deck, three squares long, on a
// low carriage. Muzzle to the north; centred on its middle square.
export function gunMesh() {
  const g = new THREE.Group();
  const iron = mat('#b4bcc4', { metalness: 0.65, roughness: 0.3 }), dark = mat('#3a3f45', { metalness: 0.6, roughness: 0.4 });
  const wood = mat('#5b3a20', { map: woodTex });
  const bed = mesh(new RoundedBoxGeometry(0.44, 0.1, 1.2, 2, 0.03), wood);
  bed.position.set(0, 0.06, 0.1);
  g.add(bed);
  [-1, 1].forEach((sx) => [-0.35, 0.5].forEach((z) => { const w = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), wood); w.rotation.z = Math.PI / 2; w.position.set(0.24 * sx, 0.09, z); g.add(w); }));
  const tube = mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.5, 22), iron);
  tube.rotation.x = -Math.PI / 2;   // its narrow end, the muzzle, to the north
  tube.position.set(0, 0.3, 0);
  g.add(tube);
  // Reinforcing rings, the muzzle's swell, and the breech knob at the inner end.
  [[-0.72, 0.19, 0.035], [-0.2, 0.2, 0.025], [0.3, 0.215, 0.03], [0.72, 0.225, 0.04]].forEach(([z, r, t]) => { const ring = mesh(new THREE.TorusGeometry(r, t, 8, 24), iron); ring.position.set(0, 0.3, z); g.add(ring); });
  const mouth = mesh(new THREE.CircleGeometry(0.11, 16), mat('#0a0a0a'));
  mouth.position.set(0, 0.3, -0.756);
  mouth.rotation.y = Math.PI;
  const cap = mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), iron);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0.3, 0.75);
  const knob = mesh(new THREE.SphereGeometry(0.075, 10, 8), dark);
  knob.position.set(0, 0.3, 0.98);
  g.add(mouth, cap, knob);
  // An open trough along the top, where you see what's been rammed in (gunLoad).
  const trough = mesh(new RoundedBoxGeometry(0.22, 0.04, 1.3, 2, 0.015), mat('#161210', { roughness: 1 }));
  trough.position.set(0, 0.5, 0);
  g.userData.trough = trough;
  g.add(trough);
  return ink(g, 0.018);
}
