/* Cuddly things, for any scene, each a piece like furniture.js's (a function taking a few options, returning
   `{ g }`, a three.js Group standing on the floor at its origin, facing +z; placed by furniture.js's place()):
   a soft cushion, a heap of them, and a teddy (a bear, or a bunny) sitting up. A module of its own rather than
   more in furniture.js. Affame's house (affame-house.js) is the first to use them: her cushion corner, as in
   her picture "Cushions and Teddies". */
import * as THREE from 'three';
import { mat, mesh } from './materials.js';

const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const soft = (c) => mat(c, { roughness: 1 });
const ball = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const b = at(mesh(new THREE.SphereGeometry(r, 14, 10), m), x, y, z); b.scale.set(sx, sy, sz); return b; };

/** A cushion: a plump square, `w` across, its corners pinched, a button in its middle; lying flat (its top
    at about `h`). */
export function cushion({ col = '#f2d0dc', w = 0.55, h = 0.16, button = '#c9a13c' } = {}) {
  const g = new THREE.Group(), m = soft(col);
  // (a squashed ball, squared off a little by its corners)
  g.add(ball(0.5, m, 0, h / 2, 0, w * 1.02, h, w * 1.02));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(ball(0.06, m, sx * w * 0.42, h * 0.45, sz * w * 0.42, 1, 0.7, 1));
  g.add(ball(0.03, mat(button, { metalness: 0.4, roughness: 0.5 }), 0, h * 0.98, 0, 1, 0.5, 1));
  return { g };
}

/** A heap of cushions, `r` across from its middle and `h` high there (a soft mound: anyone sinking in sits in
    it), in its colours, cushions strewn over it, plus a few big pillows leaning at the back (`back`: against a
    wall). The same heap each time (a seed). */
export function cushions({ cols = ['#f6c6d6', '#ffe6b0', '#f2b48c', '#e88fb0', '#fff1e0', '#d9b8e8'], r = 0.8, h = 0.32, n = 16, back = true } = {}) {
  const g = new THREE.Group();
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const top = (d) => h * Math.sqrt(Math.max(0, 1 - (d / r) ** 2));
  // The mound under them, so nothing shows through.
  g.add(ball(1, soft('#f6d8e2'), 0, 0, 0, r, h, r));
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.9, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const c = cushion({ col: cols[i % cols.length], w: 0.4 + rnd() * 0.22, h: 0.15 + rnd() * 0.07 });
    c.g.position.set(x, top(d) - 0.08, z);
    // (lying along the mound: tipped out from its middle)
    const tip = Math.min(0.7, (d / r) * 0.9);
    c.g.rotation.set(Math.sin(a) * tip, rnd() * 0.6, -Math.cos(a) * tip, 'YXZ');
    g.add(c.g);
  }
  if (back) {
    for (const [x, col] of [[-0.4, cols[3]], [0.35, cols[1]]]) {
      const c = cushion({ col, w: 0.62, h: 0.2 });
      c.g.rotation.set(-1.25, 0, x * 0.4);
      c.g.position.set(x, 0.3, -r * 0.75);
      g.add(c.g);
    }
  }
  return { g };
}

/** A teddy sitting up, `s` times a small one's size (about 0.5 m tall at 1), in its colour: a bear (round ears,
    a pale muzzle) or a bunny (long ears). Facing +z. */
export function teddy({ kind = 'bear', col = '#8a5a34', s = 1 } = {}) {
  const g = new THREE.Group(), fur = soft(col), pale = soft(kind === 'bunny' ? '#fff8ee' : new THREE.Color(col).lerp(new THREE.Color('#fff0dc'), 0.55));
  const eye = new THREE.MeshBasicMaterial({ color: '#1d1410' });
  const body = new THREE.Group();
  body.add(ball(0.16, fur, 0, 0.17, 0, 1, 1.1, 0.95));                    // body
  body.add(ball(0.09, pale, 0, 0.16, 0.115, 1, 1.15, 0.5));               // tummy
  for (const sx of [-1, 1]) {
    body.add(ball(0.065, fur, sx * 0.09, 0.06, 0.12, 0.9, 0.8, 1.5));     // legs, out in front
    body.add(ball(0.03, pale, sx * 0.09, 0.06, 0.215, 1.2, 1.2, 0.4));     // pads
    const arm = ball(0.05, fur, sx * 0.15, 0.2, 0.05, 0.9, 1.6, 0.9); arm.rotation.z = sx * 0.5; body.add(arm);
  }
  const head = new THREE.Group();
  head.position.set(0, 0.38, 0.01);
  head.add(ball(0.13, fur, 0, 0, 0));
  head.add(ball(0.055, pale, 0, -0.03, 0.105, 1.2, 0.9, 0.8));            // muzzle
  head.add(ball(0.018, eye, 0, -0.005, 0.15, 1.3, 1, 1));                 // nose
  for (const sx of [-1, 1]) {
    head.add(ball(0.016, eye, sx * 0.05, 0.03, 0.115));                     // eyes
    if (kind === 'bunny') {
      const ear = new THREE.Group();
      ear.add(ball(0.045, fur, 0, 0.11, 0, 0.8, 2.6, 0.45), ball(0.026, soft('#f4b8c8'), 0, 0.11, 0.015, 0.7, 2.2, 0.3));
      ear.position.set(sx * 0.055, 0.08, -0.02); ear.rotation.z = -sx * 0.18;
      head.add(ear);
    } else {
      head.add(ball(0.045, fur, sx * 0.1, 0.1, -0.01, 1, 1, 0.6), ball(0.026, pale, sx * 0.1, 0.1, 0.012, 1, 1, 0.4));
    }
  }
  head.rotation.z = 0.08;   // (its head a little on one side)
  body.add(head);
  g.add(body);
  g.scale.setScalar(s);
  return { g };
}

/** By kind, as a house's FURNISH names them. */
export const CUDDLY = { cushion, cushions, teddy };
