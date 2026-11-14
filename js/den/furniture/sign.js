/* A sign: a painted board with words on it (its own, `text`, in `ink` on `col`), `w` by `h` metres, its
   back to a wall at its origin, its middle at height `y`; a gilt edge round it. Roobear's ROOm's, over her
   answer; any house's or any door's. */
import { THREE, mesh, canvasTex, box, gilt, AHEAD } from './parts.js';

export function sign({ text = '', w = 1.6, h = 0.42, y = 2.4, col = '#4a2a5e', ink = '#f2d89a' } = {}) {
  const g = new THREE.Group(), px = 512, ph = Math.max(32, Math.round(px * h / w));
  const face = canvasTex(px, ph, (c, W, H) => {
    c.fillStyle = col; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 6; c.strokeRect(10, 10, W - 20, H - 20);
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    let s = Math.round(H * 0.58);
    do c.font = `700 ${s}px Alegreya, Georgia, serif`; while (c.measureText(text).width > W - 40 && --s > 12);
    c.fillText(text, W / 2, H / 2 + 2);
  });
  g.add(box(w + 0.08, h + 0.08, 0.04, gilt, 0, y, 0.02));
  const board = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: face, roughness: 0.7, ...AHEAD }), false);
  board.position.set(0, y, 0.045);
  g.add(board);
  return { g };
}

export const PIECES = [
  { id: 'sign', name: 'Sign', group: 'pictures', make: sign, onWall: true, sample: { text: 'A sign' },
    about: 'A painted board with words on it, a gilt edge round it, its back to a wall. Options: text, w and h, y (how high), col (the board), ink (the words).',
    where: 'Roobear\'s ROOm, over her answer; any house\'s or any door\'s.' },
];
