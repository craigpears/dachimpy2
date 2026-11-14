// Jazzmy's island's things: her palms and her spice stall (jazzmy-isle.js), kept apart so anywhere else she's shown
// can have them too. Ice Spices, as hers on Armstrong Island.
import * as THREE from 'three';
import { mat, mesh, canvasTex, woodTex } from './materials.js';

/** A palm, h tall, leaning a little. */
export function palm(h, lean) {
  const g = new THREE.Group(), bark = mat('#8a6a46', { roughness: 1 }), leaf = mat('#3f8a3a', { roughness: 0.9, side: THREE.DoubleSide });
  let y = 0, x = 0;
  for (let i = 0; i < 6; i++) {
    const s = mesh(new THREE.CylinderGeometry(0.11 - i * 0.008, 0.13 - i * 0.008, h / 6, 7), bark);
    x += lean * i * 0.03; s.position.set(x, y + h / 12, 0); s.rotation.z = -lean * 0.25;
    g.add(s); y += h / 6;
  }
  for (let i = 0; i < 7; i++) {
    const f = mesh(new THREE.PlaneGeometry(1.5, 0.32), leaf);
    const a = (i / 7) * Math.PI * 2;
    f.geometry.translate(0.75, 0, 0);
    f.position.set(x, y, 0); f.rotation.set(0, a, -0.45);
    g.add(f);
  }
  for (let i = 0; i < 3; i++) { const n = mesh(new THREE.SphereGeometry(0.1, 6, 5), mat('#5a3a1e')); n.position.set(x + Math.cos(i * 2.1) * 0.12, y - 0.12, Math.sin(i * 2.1) * 0.12); g.add(n); }
  return g;
}
/** Her spice stall: a counter, a striped awning on four posts, sacks of spice, the Ice Spices board. */
export function stall() {
  const g = new THREE.Group(), wood = mat('#7a5230', { map: woodTex });
  const counter = mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6), wood); counter.position.set(0, 0.4, 0); g.add(counter);
  for (const [x, z] of [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.6], [0.75, 0.6]]) { const p = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), wood); p.position.set(x, 0.9, z); g.add(p); }
  const stripes = canvasTex(128, 32, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f4ead2' : '#c03a2a'; c.fillRect(i * w / 8, 0, w / 8, h); } });
  const awn = mesh(new THREE.BoxGeometry(1.8, 0.06, 1.15), mat('#ffffff', { map: stripes }));
  awn.position.set(0, 1.82, 0.15); awn.rotation.x = 0.12; g.add(awn);
  for (const [x, col] of [[-0.5, '#c8402a'], [-0.05, '#e0a830'], [0.42, '#d06a20']]) {
    const s = mesh(new THREE.SphereGeometry(0.2, 10, 8), mat('#d8c49a')); s.scale.y = 1.2; s.position.set(x, 0.95, 0.05); g.add(s);
    const top = mesh(new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(col)); top.position.set(x, 1.12, 0.05); g.add(top);
  }
  const sign = mesh(new THREE.PlaneGeometry(1.2, 0.36), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: canvasTex(256, 80, (c, w, h) => {
    c.fillStyle = '#5a3a1c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9a63a'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#f2d27a'; c.font = 'bold 36px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Ice Spices', w / 2, h / 2 + 2);
  }) }));
  sign.position.set(0, 2.08, 0.72); g.add(sign);
  return g;
}
