/* A plate of cookies (Dachimpy's, at their door: "I'm very well known for giving just like hugs and cookies"),
   its middle at its origin, `n` cookies on it, chips and all; one mesh of chips, to stay cheap. On a table
   (`table({ cookies })`), or held out in a hand (props-people.js's 'offer'). It returns the three.js Group
   itself, not `{ g }` (a hand holds it); its registry entry wraps it as every other piece is. */
import { THREE, mat, mesh, cyl, doughM } from './parts.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const chipM = mat('#3a2216', { roughness: 0.7 }), plateM = mat('#f4f1ea', { roughness: 0.35 });
export function cookiePlate({ n = 5 } = {}) {
  const g = new THREE.Group(), chips = [];
  g.add(cyl(0.15, 0.12, 0.018, plateM, 0, 0.009, 0, 20));
  for (let i = 0; i < n; i++) {
    const a = i * 2.4, r = i ? 0.075 : 0, x = Math.sin(a) * r, z = Math.cos(a) * r, y = 0.024 + (i ? 0 : 0.012);
    const c = cyl(0.048, 0.048, 0.013, doughM, x, y, z, 14); c.rotation.set(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08); g.add(c);
    for (let k = 0; k < 4; k++) { const ca = a + k * 1.7, cr = 0.012 + (k % 2) * 0.018, s = new THREE.SphereGeometry(0.008, 5, 4); s.translate(x + Math.sin(ca) * cr, y + 0.007, z + Math.cos(ca) * cr); chips.push(s); }
  }
  g.add(mesh(mergeGeometries(chips), chipM));
  return g;
}

export const PIECES = [
  { id: 'cookiePlate', name: 'Plate of cookies', group: 'museum', make: (o) => ({ g: cookiePlate(o) }), small: true,
    about: 'A plate of chocolate-chip cookies, on a table or held out in a hand. Options: n (how many cookies).',
    where: 'Dachimpy\'s hall, on the table and in their hand at the door.' },
];
