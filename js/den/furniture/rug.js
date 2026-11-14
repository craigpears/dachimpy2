/* A rug, and a long runner (Gravee's gallery, Dachimpy's hall): a patterned rectangle with a border, flat on
   the floor. */
import { THREE, mat, mesh, canvasTex } from './parts.js';

const rugTex = (col, w, h) => canvasTex(256, Math.round(256 * h / w), (g, W, H) => {
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255, 220, 150, .55)'; g.lineWidth = 6; g.strokeRect(12, 12, W - 24, H - 24);
  g.strokeStyle = 'rgba(0, 0, 0, .3)'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
  g.fillStyle = 'rgba(255, 220, 150, .35)';
  for (let y = 48; y < H - 40; y += 40) for (let x = 48; x < W - 40; x += 40) { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.fill(); }
});
/** A rug: a patterned rectangle with a border, flat on the floor. */
export function rug({ col = '#6b1d2a', w = 3.2, d = 2.2 } = {}) {
  const g = new THREE.Group(), r = mesh(new THREE.PlaneGeometry(w, d), mat('#ffffff', { map: rugTex(col, w, d), roughness: 1 }), false);
  r.rotation.x = -Math.PI / 2; r.position.y = 0.012;
  g.add(r);
  return { g };
}
/** A long runner, for a gallery or a hall. */
export const runner = ({ col = '#3a5a2a', len = 60 } = {}) => rug({ col, w: len, d: 1.2 });

export const PIECES = [
  { id: 'rug', name: 'Rug', group: 'house', make: rug,
    about: 'A patterned rug with a border, flat on the floor. Options: col (its colour), w and d (its size in metres).',
    where: 'Every house; the catalogue\'s colours page, in the colour picked.' },
  { id: 'runner', name: 'Runner', group: 'house', make: runner, sample: { len: 4 },
    about: 'A long, narrow rug for a gallery or a hall. Options: col, len (its length in metres).',
    where: 'Gravee\'s gallery, Dachimpy\'s hall.' },
];
