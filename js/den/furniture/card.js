/* Words on a little card for a wall: a museum's plaque under a picture (Dachimpy's museum), and wrapLines,
   any text broken into lines that fit (exhibits.js uses it too). */
import { THREE, mesh, canvasTex, LAYER, AHEAD } from './parts.js';

/** Words on a little card for a wall: a museum's plaque under a picture (`title` in bold, then `text`),
    `w` by `h` metres, its back to the wall at its origin, its middle at height `y`; in front of a frame's
    layers, as a plaque is. */
export function card({ title = '', text = '', w = 0.9, h = 0.42, y = 1.1 } = {}) {
  const g = new THREE.Group(), W = 640, H = Math.round(W * h / w);
  const face = canvasTex(W, H, (c) => {
    c.fillStyle = '#efe2bd'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#7a5216'; c.lineWidth = 4; c.strokeRect(5, 5, W - 10, H - 10);
    c.fillStyle = '#3a2210'; c.textAlign = 'left'; c.textBaseline = 'top';
    // (the biggest the words go that fits: the title, then the text under it)
    for (let px = 30; px > 10; px -= 1) {
      c.font = `italic ${px}px Alegreya, Georgia, serif`;
      const lines = wrapLines(c, text, W - 44), lh = px * 1.2, th = title ? px * 1.35 : 0;
      if (th + lines.length * lh > H - 30) continue;
      let at = (H - th - lines.length * lh) / 2;
      if (title) { c.font = `700 ${Math.round(px * 1.1)}px Alegreya, Georgia, serif`; c.fillText(title, 22, at); at += th; }
      c.font = `italic ${px}px Alegreya, Georgia, serif`;
      lines.forEach((l, i) => c.fillText(l, 22, at + i * lh));
      break;
    }
  });
  const board = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: face, roughness: 0.7, ...AHEAD }), false);
  board.position.set(0, y, LAYER.plaque);
  g.add(board);
  return { g };
}
/** `text` in lines no wider than `max` pixels, in the canvas's font as it's set. */
export function wrapLines(c, text, max) {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && c.measureText(next).width > max) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export const PIECES = [
  { id: 'card', name: 'Card of words', group: 'pictures', make: card, onWall: true,
    sample: { title: 'A card', text: 'A few words about what hangs above it, as big as fits.' },
    about: 'A museum\'s plaque for a wall: a title in bold, then a few words, as big as they fit. Options: title, text, w and h, y (how high).',
    where: 'Dachimpy\'s museum, under each exhibit.' },
];
