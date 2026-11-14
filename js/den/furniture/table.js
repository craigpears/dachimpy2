/* A round side table on one leg, and what can be on it: a teacup, a hand of cards and bottles (Primates
   Rule's deck), a plate of cookies (Dachimpy's hall). */
import { THREE, mat, cyl, box, mid, dark, ebony, cork } from './parts.js';
import { cookiePlate } from './cookie-plate.js';

const cardM = mat('#f6f3ea', { roughness: 0.8 }), cardRed = mat('#c8343a', { roughness: 0.8 });
const bottleGreen = mat('#2f6b3a', { roughness: 0.2, metalness: 0.1 }), bottleBrown = mat('#6a3a1c', { roughness: 0.2, metalness: 0.1 });
/** A round side table on one leg, a teacup on it; or `cards` dealt on it and `bottles` stood on it
    (Primates Rule's deck); `black`, in ebony; `cookies`, a plate of them (Dachimpy's hall: cookiePlate). */
export function table({ cup = true, cards = false, bottles = 0, black = false, cookies = false } = {}) {
  const g = new THREE.Group(), top = black ? ebony : mid, foot = black ? ebony : dark;
  g.add(cyl(0.42, 0.42, 0.05, top, 0, 0.72, 0, 20), cyl(0.05, 0.07, 0.7, foot, 0, 0.36, 0, 8), cyl(0.26, 0.3, 0.04, foot, 0, 0.02, 0, 16));
  if (cup) g.add(cyl(0.05, 0.04, 0.07, mat('#f4f1ea'), 0.1, 0.78, 0.05, 10), cyl(0.08, 0.08, 0.01, mat('#f4f1ea'), 0.1, 0.75, 0.05, 12));
  if (cookies) { const p = cookiePlate({ n: 7 }); p.position.set(cup ? -0.12 : 0, 0.745, cup ? -0.05 : 0); g.add(p); }
  if (cards) {
    // A hand dealt round, and the pack.
    [[-0.2, 0.05, 0.3], [0.05, -0.22, -0.4], [0.22, 0.12, 1.1], [-0.05, 0.24, 2.0], [0.15, -0.05, 2.6]].forEach(([x, z, a], i) => { const c = box(0.08, 0.004, 0.11, i === 3 ? cardRed : cardM, x, 0.748, z); c.rotation.y = a; g.add(c); });
    g.add(box(0.08, 0.03, 0.11, cardM, -0.18, 0.76, -0.15));
  }
  for (let i = 0; i < bottles; i++) {
    const a = 0.8 + i * 2.1, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2, m = i % 2 ? bottleBrown : bottleGreen;
    g.add(cyl(0.045, 0.045, 0.2, m, x, 0.845, z, 8), cyl(0.016, 0.03, 0.09, m, x, 0.99, z, 6), cyl(0.018, 0.018, 0.02, cork, x, 1.045, z, 6));
  }
  return { g };
}

export const PIECES = [
  { id: 'table', name: 'Side table', group: 'house', make: table,
    about: 'A round side table on one leg, a teacup on it. Options: cup, cards (a hand dealt on it), bottles (how many), black (in ebony), cookies (a plate of them).',
    where: 'Every house; Primates Rule\'s deck, with cards and bottles; Dachimpy\'s hall, with cookies.' },
];
