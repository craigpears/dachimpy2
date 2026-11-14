/* Exhibits, for any house's walls (IDEAS.md: "showing off beloved memories is a piece of its own, not
   Dachimpy's code: exhibits (a picture, a trinket, a plaque with its story) placed in any house as config"):
   a photo (a picture published with the site, houses/<host>/..., e.g. houses/dachimpy/museum/*.jpg) as a texture for a frame and as an image for
   the close view (picture-view.js), and a page of words painted on a canvas (a panel of a museum's story, a
   thank-you, a name), as a portrait is. Hung in frames from furniture.js, their plaques its `card`. Dachimpy's
   museum (dachimpy-house.js) is the first to use them. */
import * as THREE from 'three';
import { wrapLines } from './furniture.js';

const loader = new THREE.TextureLoader(), textures = new Map();
/** A photo as a texture, loaded once (it fills in when it's come). */
export function photoTexture(file) {
  if (!textures.has(file)) {
    const t = loader.load(file);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.set(file, t);
  }
  return textures.get(file);
}
/** A photo for the close view: an image that keeps its own shape (`px`: its size, [w, h]), as big as the
    view allows (den.html's .pic-photo). */
export function photoArt(file, [w, h]) {
  const img = new Image(w, h);
  img.src = file; img.alt = ''; img.className = 'pic-photo';
  img.style.setProperty('--a', String(w / h));
  return img;
}

/** A page's canvas: 512 by 640, a portrait's shape (4:5). */
export const PAGE_PX = { w: 512, h: 640 };
/** A little heart, its middle at (x, y), `s` across. */
function heart(g, x, y, s, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.35, y - s * 0.55, x, y - s * 0.2);
  g.bezierCurveTo(x + s * 0.35, y - s * 0.55, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  g.fill();
}
/* A page of words: on parchment, its `title` big and its `text` under it, the biggest that fits, a heart at
   the foot (`heart`); or `night`, a name (`title`) under the stars over a dark sea, a line under it (`text`):
   a special someone not drawn yet. A canvas. */
export function paintPage({ title = '', text = '', kind = 'parchment', withHeart = false }) {
  const cv = document.createElement('canvas');
  cv.width = PAGE_PX.w; cv.height = PAGE_PX.h;
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  if (kind === 'night') {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b1030'); sky.addColorStop(0.68, '#28306a'); sky.addColorStop(0.69, '#14204a'); sky.addColorStop(1, '#0a1230');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255, 250, 230, ${0.35 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * W, rnd() * H * 0.66, 0.6 + rnd() * 1.8, 0, Math.PI * 2); g.fill(); }
    // a crescent moon, its light on the water
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(W * 0.74, H * 0.17, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0f1538'; g.beginPath(); g.arc(W * 0.74 + 15, H * 0.17 - 8, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255, 244, 207, .35)';
    for (let i = 0; i < 9; i++) g.fillRect(W * 0.74 - 30 + Math.sin(i * 2.3) * 14, H * 0.7 + i * 18, 60 - i * 4, 3);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
    g.shadowColor = 'rgba(255, 200, 230, .7)'; g.shadowBlur = 18;
    // (as big as fits: on two lines if it's long)
    const words = title.split(' '), two = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [title];
    let px = 92;
    do g.font = `italic 700 ${px}px Alegreya, Georgia, serif`; while (two.some((l) => g.measureText(l).width > W - 60) && --px > 20);
    two.forEach((l, i) => g.fillText(l, W / 2, H * 0.43 + (i - (two.length - 1) / 2) * px * 1.05));
    g.shadowBlur = 0;
    g.font = 'italic 30px Alegreya, Georgia, serif'; g.fillStyle = '#f2d9e6';
    g.fillText(text, W / 2, H * 0.55);
    heart(g, W / 2, H * 0.86, 44, '#ee8fb4');
    return cv;
  }
  // Parchment, its edge darkened, a ruled border.
  g.fillStyle = '#efe0b8'; g.fillRect(0, 0, W, H);
  const edge = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
  edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(110, 70, 20, .45)');
  g.fillStyle = edge; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#7a5216'; g.lineWidth = 4; g.strokeRect(22, 22, W - 44, H - 44);
  g.lineWidth = 1.5; g.strokeRect(32, 32, W - 64, H - 64);
  g.fillStyle = '#3a2210'; g.textAlign = 'center'; g.textBaseline = 'top';
  g.font = 'italic 700 46px Alegreya, Georgia, serif';
  g.fillText(title, W / 2, 64);
  g.fillRect(W / 2 - 70, 126, 140, 2);
  const room = H - 170 - (withHeart ? 80 : 50);
  for (let px = 34; px > 14; px--) {
    g.font = `${px}px Alegreya, Georgia, serif`;
    const lines = wrapLines(g, text, W - 110), lh = px * 1.32;
    if (lines.length * lh > room) continue;
    lines.forEach((l, i) => g.fillText(l, W / 2, 150 + i * lh));
    break;
  }
  if (withHeart) heart(g, W / 2, H - 82, 40, '#c4446f');
  return cv;
}
/** A painted page as a texture, for a frame. */
export function pageTexture(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
