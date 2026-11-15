// A brig's little craft in 3D (src/blockade.ts, LAUNCH; src/den-brig.ts): an Atlantean's sea turtle, which swims at the
// other side's ships and rams them, and a haunted brig's ghost sloop, the sloop's own look gone see-through and
// glowing faintly green as Eldritch Wail is (js/den/frigate.js). Each returns { g, tick(dt), fade(k) } (k 1 seen, 0
// gone), her bow toward +x and her waterline at y 0, as the sloop's.
import * as THREE from 'three';
import { mat, mesh } from './world.js';
import { sloopMesh } from './sloop.js';

/** A sea turtle the size of a rowing boat: a domed shell, its plates, a head held up and four flippers paddling. */
export function turtleMesh({ shell = '#4f6b3a', skin = '#7d9a5c', plate = '#38502a' } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), S = mat(shell, { roughness: 0.7 }), K = mat(skin, { roughness: 0.8 }), P = mat(plate, { roughness: 0.75 });
  g.add(body);
  const dome = mesh(new THREE.SphereGeometry(1.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), S); dome.scale.set(1.25, 0.55, 1); body.add(dome);
  const rim = mesh(new THREE.TorusGeometry(1.3, 0.12, 6, 24).rotateX(Math.PI / 2), P); rim.scale.set(1.25, 1, 1); body.add(rim);
  // (the plates of her shell: a ring of them round a middle one)
  const plateGeo = new THREE.CircleGeometry(0.36, 6).rotateX(-Math.PI / 2);
  const top = mesh(plateGeo, P); top.position.y = 0.72; body.add(top);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, p = mesh(plateGeo, P); p.position.set(Math.cos(a) * 0.85, 0.52, Math.sin(a) * 0.7); p.lookAt(Math.cos(a) * 3, 3, Math.sin(a) * 2.4); body.add(p); }
  const head = new THREE.Group(); head.position.set(1.75, 0.18, 0); body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.36, 12, 10), K).translateX(0.15));
  head.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 10).rotateZ(Math.PI / 2), K).translateX(-0.2));
  for (const sd of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#121010')).translateX(0.38).translateY(0.1).translateZ(sd * 0.22));
  const fin = new THREE.SphereGeometry(0.5, 10, 6), flips = [];
  for (const [x, z, s] of [[0.8, 1.05, 1], [0.8, -1.05, 1], [-0.95, 0.85, 0.65], [-0.95, -0.85, 0.65]]) {
    const f = new THREE.Group(), m = mesh(fin, K); m.scale.set(0.9 * s, 0.12, 0.45 * s); m.position.z = Math.sign(z) * 0.4 * s; f.add(m);
    f.position.set(x, 0.05, z); body.add(f); flips.push({ f, front: x > 0, sd: Math.sign(z) });
  }
  let t = Math.random() * 6;
  return {
    g,
    tick(dt) {
      t += dt;
      for (const { f, front, sd } of flips) f.rotation.y = sd * Math.sin(t * (front ? 5 : 4) + (front ? 0 : 1.2)) * (front ? 0.55 : 0.35);
      body.position.y = Math.sin(t * 2.4) * 0.08; head.rotation.y = Math.sin(t * 1.3) * 0.15;
    },
    fade(k) { body.position.y -= (1 - k) * 1.6; },
  };
}

/** A ghost sloop: the sloop's look, every part see-through and glowing faintly green, flickering. */
export function ghostSloopMesh() {
  const g = sloopMesh(), ghostly = new Map();
  g.traverse((o) => {
    if (!o.material) return;
    const make = (m) => ghostly.get(m) ?? ghostly.set(m, Object.assign(m.clone(), { transparent: true, opacity: 0.55, depthWrite: false, ...(m.emissive ? { emissive: new THREE.Color('#3fd89a'), emissiveIntensity: 0.35 } : {}) })).get(m);
    o.material = Array.isArray(o.material) ? o.material.map(make) : make(o.material);
  });
  let t = Math.random() * 6, seen = 1;
  const set = () => { const a = (0.5 + Math.sin(t * 1.7) * 0.07 + Math.sin(t * 5.3) * 0.03) * seen; for (const m of ghostly.values()) m.opacity = a; };
  return { g, tick(dt) { t += dt; set(); }, fade(k) { seen = k; set(); } };
}
