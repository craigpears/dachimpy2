// Treasure Haul in the world: the board laid on the water where a chest is to be hauled up, and the
// old wreck's beyond the checkpoint hauled aboard the sloop by it (the lagoon's too: crane.js).
import * as THREE from 'three';
import { H as TH, W as TW } from '../treasure-haul.js';
import { Salvage, aboard } from '../den-haul.js';
import { scene, camera, mat, mesh, canvasTex, V3, G, keys, ray, burst, toast, tween } from './world.js';
import { updateStats } from './wall.js';
import { seaX, seaZ, SLOOP_DECK, SLOOP_BEAM, sail, liftAt } from './sea.js';

/* Treasure Haul (src/treasure-haul.ts, the real puzzle; src/den-haul.ts, when you can haul and what
   it pays). The board lies on the water where the chest went down, its top row nearest whoever's
   hauling, and you look down on it from beyond, back toward them, so the treasure rises up the
   screen toward them as in the real puzzle. The chest you're after is on it, at its foot; the coins
   it spilled are round it. A swap is the two squares of the upright cursor; Esc leaves it as it is,
   to come back to.

   Drawn after Puzzle Pirates' own (YPPedia's screenshots, looked at 10 Nov, and side by side with
   them again 11 Nov, when the coins and chest were redrawn from placeholders): the board is a rope
   cargo net let down over the side, a close grey-brown diamond lattice behind the coins, a thin
   silver frame round the grid, thick ropes down its sides and up to the rail, seaweed at its foot;
   the coins each their own metal and design struck in relief (see COIN); a ruby cut as an
   octagon, an emerald cut as an emerald; the chest an iron-framed lattice of pale crate wood with
   a strap down to a big padlock, seen from above; the cursor red brackets lined in yellow. Coins
   hauled fly up the board toward the hauler, as the real one's "coins flying up the screen".

   haulOpen takes where the board goes and what to do when it's done, so any place can have one:
   the old wreck's beyond the checkpoint (haulWreck, below), the clifftop lagoon's wreck (crane.js).
   (The wrecked turret's chest, the first, went with the turret, 10 Nov.) */
export const haul = { on: false, salvage: null, board: null, group: null, pieces: null, cursor: null, net: null, weed: [], meshes: new Map(), queue: [], holdT: 0, shown: null, cur: { r: 3, c: 3 }, yaw: 0, sq: 0.45, flying: 0, deck: null, onDone: null, stay: null };
const colX = (c) => c - (TW - 1) / 2, rowZ = (r) => r - (TH - 1) / 2;

// ---------- the pieces: four coins, two gems and the chest ----------
const tint = (hex, f) => { const n = parseInt(hex.slice(1), 16), ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
const octagon = (g, c, r) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } g.closePath(); };
/* The four coins, as on the real board (the top of the texture is the top of the screen): each a
   bright rim with a dark edge and a fine ring inside it, its design struck in relief, in its own
   metal's lighter shade outlined in its darker. Olive: a square hole in a frame, a little skull
   over it, scrolled handles either side and a goblet's foot under it. Silver: two cutlasses
   crossed, hilts down, a skull over them. Gold: a scalloped ring, a cross quartering it and a
   little emblem in each quarter. Tan, eight-sided: a crowned bust, white. */
const COIN = [['#97aa30', 'hole', 'round'], ['#d3d7dc', 'swords', 'round'], ['#ead53a', 'cross', 'round'], ['#d8ae6a', 'king', 'octagon']];
function coinFace(col, mark, shape) {
  return canvasTex(256, 256, (g, w) => {
    g.scale(w / 128, w / 128);   // (drawn on a 128 grid, at twice that for the detail)
    const c = 64, ink = tint(col, 0.36), mid = tint(col, 0.72), lite = tint(col, 1.28), pale = tint(col, 1.5);
    const outline = (r) => { if (shape === 'octagon') octagon(g, c, r / Math.cos(Math.PI / 8)); else { g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    // The edge, the rim (lit from the top left), a fine dark ring, and the field inside it.
    outline(62); g.fillStyle = ink; g.fill();
    outline(59);
    const rim = g.createLinearGradient(16, 10, 112, 118);
    rim.addColorStop(0, pale); rim.addColorStop(0.45, col); rim.addColorStop(1, mid);
    g.fillStyle = rim; g.fill();
    outline(51); g.fillStyle = ink; g.fill();
    outline(49);
    const field = g.createRadialGradient(c - 14, c - 16, 4, c, c, 58);
    field.addColorStop(0, lite); field.addColorStop(0.55, col); field.addColorStop(1, mid);
    g.fillStyle = field; g.fill();
    // Struck in relief: a raised part is the lighter shade, outlined in the dark.
    const raise = (path, lw = 2.2) => { g.beginPath(); path(); g.fillStyle = lite; g.fill(); g.lineWidth = lw; g.strokeStyle = ink; g.stroke(); };
    const ridge = (path, lw = 5) => { g.beginPath(); path(); g.lineWidth = lw + 2.6; g.strokeStyle = ink; g.stroke(); g.lineWidth = lw; g.strokeStyle = lite; g.stroke(); };
    const skull = (x, y, r) => {
      raise(() => { g.arc(x, y, r, 0, Math.PI * 2); });
      raise(() => { g.rect(x - r * 0.55, y + r * 0.6, r * 1.1, r * 0.75); }, 1.6);
      g.fillStyle = ink; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * r * 0.42, y - r * 0.05, r * 0.27, 0, Math.PI * 2); g.fill(); }
    };
    if (mark === 'hole') {
      skull(c, 25, 6.5);
      // The scrolled handles, curling out and down either side of the hole.
      for (const s of [-1, 1]) ridge(() => { g.moveTo(c + s * 17, c - 11); g.bezierCurveTo(c + s * 28, c - 19, c + s * 35, c - 5, c + s * 29, c + 4); g.bezierCurveTo(c + s * 25, c + 10, c + s * 20, c + 5, c + s * 24, c + 1); }, 2.6);
      for (const s of [-1, 1]) ridge(() => { g.moveTo(c + s * 17, c + 13); g.quadraticCurveTo(c + s * 23, c + 22, c + s * 31, c + 17); }, 2.2);
      // The goblet's stem and foot under it.
      raise(() => { g.moveTo(c - 4, c + 17); g.lineTo(c + 4, c + 17); g.lineTo(c + 2.5, c + 30); g.lineTo(c + 12, c + 36); g.lineTo(c - 12, c + 36); g.lineTo(c - 2.5, c + 30); g.closePath(); }, 2);
      // The square hole in its raised frame, dark right through.
      raise(() => { g.rect(c - 17, c - 17, 34, 34); }, 2.6);
      g.fillStyle = ink; g.fillRect(c - 10.5, c - 10.5, 21, 21);
      g.fillStyle = '#1b2008'; g.fillRect(c - 8, c - 8, 16, 16);
    } else if (mark === 'swords') {
      skull(c, 27, 7.5);
      for (const s of [-1, 1]) {
        // A cutlass: its hilt low on one side, the blade sweeping up across to the other.
        const hx = c - s * 22, hy = c + 26;
        raise(() => { g.moveTo(hx + s * 3, hy - 8); g.quadraticCurveTo(c - s * 2, c - 8, c + s * 31, c - 31); g.quadraticCurveTo(c + s * 26, c - 4, hx + s * 12, hy); g.closePath(); }, 2.6);
        g.strokeStyle = mid; g.lineWidth = 1.4; g.beginPath(); g.moveTo(hx + s * 8, hy - 5); g.quadraticCurveTo(c + s * 6, c - 6, c + s * 27, c - 27); g.stroke();
        ridge(() => { g.moveTo(hx - 3, hy - 13); g.lineTo(hx + s * 14, hy + 4); }, 3.2);                 // the guard
        ridge(() => { g.moveTo(hx + s * 9, hy); g.quadraticCurveTo(hx + s * 2, hy + 14, hx - s * 9, hy + 10); }, 2.4);   // the knuckle bow
        ridge(() => { g.moveTo(hx + s * 2, hy - 2); g.lineTo(hx - s * 7, hy + 9); }, 4.2);                // the grip
        raise(() => { g.arc(hx - s * 8.5, hy + 11, 3.4, 0, Math.PI * 2); }, 1.6);                        // the pommel
      }
    } else if (mark === 'cross') {
      // A scalloped ring inside the rim.
      g.beginPath();
      for (let i = 0; i <= 240; i++) { const a = i / 240 * Math.PI * 2, r = 42 + Math.abs(Math.sin(a * 12)) * 3.2; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
      g.lineWidth = 4.4; g.strokeStyle = ink; g.stroke(); g.lineWidth = 2; g.strokeStyle = lite; g.stroke();
      // The cross, its arms a little flared, and the boss where they meet.
      raise(() => { g.moveTo(c - 3, c - 39); g.lineTo(c + 3, c - 39); g.lineTo(c + 2.5, c - 3); g.lineTo(c + 39, c - 3); g.lineTo(c + 39, c + 3); g.lineTo(c + 2.5, c + 3); g.lineTo(c + 3, c + 39); g.lineTo(c - 3, c + 39); g.lineTo(c - 2.5, c + 3); g.lineTo(c - 39, c + 3); g.lineTo(c - 39, c - 3); g.lineTo(c - 2.5, c - 3); g.closePath(); }, 2);
      raise(() => { g.arc(c, c, 6, 0, Math.PI * 2); }, 2);
      // An emblem in each quarter: a crown, a trefoil, a star, a cross.
      const q = 19;
      raise(() => { const x = c - q, y = c - q; g.moveTo(x - 8, y + 6); g.lineTo(x - 8, y - 5); g.lineTo(x - 4, y); g.lineTo(x, y - 7); g.lineTo(x + 4, y); g.lineTo(x + 8, y - 5); g.lineTo(x + 8, y + 6); g.closePath(); }, 1.8);
      for (const [dx, dy] of [[0, -5], [-5, 1], [5, 1]]) raise(() => { g.arc(c + q + dx, c - q + dy, 3.6, 0, Math.PI * 2); }, 1.6);
      ridge(() => { g.moveTo(c + q, c - q + 3); g.lineTo(c + q, c - q + 10); }, 2.2);
      ridge(() => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; g.moveTo(c - q + Math.cos(a) * 8, c + q + Math.sin(a) * 8); g.lineTo(c - q - Math.cos(a) * 8, c + q - Math.sin(a) * 8); } }, 2.2);
      raise(() => { const x = c + q, y = c + q; g.moveTo(x - 2, y - 8); g.lineTo(x + 2, y - 8); g.lineTo(x + 1.5, y - 1.5); g.lineTo(x + 8, y - 2); g.lineTo(x + 8, y + 2); g.lineTo(x + 1.5, y + 1.5); g.lineTo(x + 2, y + 8); g.lineTo(x - 2, y + 8); g.lineTo(x - 1.5, y + 1.5); g.lineTo(x - 8, y + 2); g.lineTo(x - 8, y - 2); g.lineTo(x - 1.5, y - 1.5); g.closePath(); }, 1.6);
    } else {
      // A fine eight-sided ring inside the rim, and the crowned bust in white.
      octagon(g, c, 45 / Math.cos(Math.PI / 8)); g.lineWidth = 1.6; g.strokeStyle = ink; g.stroke();
      const white = '#f4f3ef', shadow = '#b9b8b4', line = '#4a3b26';
      const part = (path, fill = white, lw = 2) => { g.beginPath(); path(); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = line; g.stroke(); };
      part(() => { g.moveTo(c - 27, c + 42); g.bezierCurveTo(c - 26, c + 26, c - 16, c + 21, c, c + 21); g.bezierCurveTo(c + 16, c + 21, c + 26, c + 26, c + 27, c + 42); g.closePath(); });   // shoulders
      part(() => { g.rect(c - 6, c + 10, 12, 13); });   // neck
      part(() => { g.ellipse(c, c + 1, 13.5, 15.5, 0, 0, Math.PI * 2); });   // head
      part(() => { g.moveTo(c - 13, c - 2); g.quadraticCurveTo(c - 18, c + 10, c - 12, c + 16); g.lineTo(c - 9, c + 6); g.closePath(); }, shadow, 1.6);   // hair down the sides
      part(() => { g.moveTo(c + 13, c - 2); g.quadraticCurveTo(c + 18, c + 10, c + 12, c + 16); g.lineTo(c + 9, c + 6); g.closePath(); }, shadow, 1.6);
      // The crown: a band, five points each with a pearl on it.
      part(() => { g.moveTo(c - 14, c - 8); g.lineTo(c - 17, c - 27); g.lineTo(c - 9, c - 17); g.lineTo(c - 5, c - 31); g.lineTo(c, c - 18); g.lineTo(c + 5, c - 31); g.lineTo(c + 9, c - 17); g.lineTo(c + 17, c - 27); g.lineTo(c + 14, c - 8); g.closePath(); });
      part(() => { g.rect(c - 14.5, c - 12, 29, 5); }, shadow, 1.6);
      for (const [x, y] of [[-17, -28], [-5, -32], [5, -32], [17, -28]]) part(() => { g.arc(c + x, c + y, 2.2, 0, Math.PI * 2); }, white, 1.2);
      // A face: eyes, nose and a mouth; a fold down the front of the robe.
      g.fillStyle = line; for (const s of [-1, 1]) { g.beginPath(); g.arc(c + s * 5, c + 1, 1.7, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = line; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(c, c + 3); g.lineTo(c - 1.5, c + 7); g.lineTo(c + 1, c + 7.5); g.stroke();
      g.beginPath(); g.moveTo(c - 3.5, c + 11); g.quadraticCurveTo(c, c + 12.5, c + 3.5, c + 11); g.stroke();
      g.beginPath(); g.moveTo(c - 10, c + 25); g.quadraticCurveTo(c, c + 33, c + 10, c + 25); g.stroke();
    }
  });
}
// A gem seen from above: the ruby cut as an octagon, the emerald as an emerald (cut corners).
function gemFace(col, cut) {
  return canvasTex(128, 128, (g, w) => {
    const c = w / 2;
    const out = (r) => {
      if (cut === 'oct') return octagon(g, c, r);
      const a = r, b = r * 0.82, k = r * 0.3;
      g.beginPath(); g.moveTo(c - b + k, c - a); g.lineTo(c + b - k, c - a); g.lineTo(c + b, c - a + k); g.lineTo(c + b, c + a - k); g.lineTo(c + b - k, c + a); g.lineTo(c - b + k, c + a); g.lineTo(c - b, c + a - k); g.lineTo(c - b, c - a + k); g.closePath();
    };
    out(58);
    const gr = g.createLinearGradient(0, 0, w, w); gr.addColorStop(0, tint(col, 1.6)); gr.addColorStop(0.5, col); gr.addColorStop(1, tint(col, 0.45));
    g.fillStyle = gr; g.fill(); g.lineWidth = 4; g.strokeStyle = tint(col, 0.3); g.stroke();
    // The table, and a glint.
    out(32); g.fillStyle = tint(col, 1.25); g.fill(); g.lineWidth = 2.5; g.strokeStyle = tint(col, 0.55); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(c - 26, c - 20); g.lineTo(c - 6, c - 30); g.lineTo(c - 18, c - 6); g.closePath(); g.fill();
  });
}
// The chest from above, as the real one: a dark iron frame round it, riveted at the corners, pale
// crate-wood slats in a lattice inside it, an iron bar across and a strap down the middle to a big
// round-shouldered padlock at the front (the bottom, nearest you), its keyplate like a face.
const chestTop = canvasTex(256, 256, (g, w) => {
  const black = '#1c1e20', iron = '#4a5157', ironLite = '#7b858d';
  // The frame.
  g.fillStyle = black; g.fillRect(0, 0, w, w);
  g.fillStyle = iron; g.fillRect(4, 4, w - 8, w - 8);
  g.fillStyle = ironLite; g.fillRect(4, 4, w - 8, 3); g.fillRect(4, 4, 3, w - 8);
  g.fillStyle = black; g.fillRect(20, 20, w - 40, w - 40);
  // The lattice: pale slats across and down, the dark of the chest between them.
  g.fillStyle = '#2e1c0e'; g.fillRect(22, 22, w - 44, w - 44);
  const slat = (x, y, sw, sh) => {
    g.fillStyle = '#b98a55'; g.fillRect(x, y, sw, sh);
    g.fillStyle = '#dcb07a'; if (sw < sh) g.fillRect(x, y, 3, sh); else g.fillRect(x, y, sw, 3);
    g.fillStyle = '#7a5530'; if (sw < sh) g.fillRect(x + sw - 3, y, 3, sh); else g.fillRect(x, y + sh - 3, sw, 3);
  };
  for (let y = 26; y < w - 30; y += 27) slat(22, y, w - 44, 15);
  for (let x = 26; x < w - 30; x += 27) slat(x, 22, 15, w - 44);
  // An iron bar across, and the strap down the middle.
  const strap = (x, y, sw, sh) => {
    g.fillStyle = black; g.fillRect(x - 2, y - 2, sw + 4, sh + 4);
    g.fillStyle = iron; g.fillRect(x, y, sw, sh);
    g.fillStyle = ironLite; g.fillRect(x, y, sw, 3); g.fillRect(x, y, 3, sh);
  };
  strap(22, 96, w - 44, 18);
  strap(w / 2 - 13, 20, 26, 150);
  // Rivets: the frame's corners, the bar's ends, the strap's.
  const rivet = (x, y, r = 5) => { g.fillStyle = black; g.beginPath(); g.arc(x, y, r + 1.5, 0, Math.PI * 2); g.fill(); g.fillStyle = ironLite; g.beginPath(); g.arc(x - 1, y - 1, r, 0, Math.PI * 2); g.fill(); };
  for (const x of [12, w - 12]) for (const y of [12, w - 12]) rivet(x, y);
  for (const x of [30, w - 30]) rivet(x, 105, 4);
  rivet(w / 2, 36, 4); rivet(w / 2, 105, 4);
  // The padlock: its shackle through the strap's hasp, a round-shouldered body, the face-like
  // keyplate (two round eyes and a keyhole for a nose).
  g.lineWidth = 9; g.strokeStyle = black; g.beginPath(); g.arc(w / 2, 168, 22, Math.PI, 0); g.stroke();
  g.lineWidth = 5; g.strokeStyle = ironLite; g.beginPath(); g.arc(w / 2, 168, 22, Math.PI, 0); g.stroke();
  g.fillStyle = black; g.beginPath(); g.ellipse(w / 2, 200, 44, 40, 0, 0, Math.PI * 2); g.fill();
  const body = g.createRadialGradient(w / 2 - 14, 186, 4, w / 2, 200, 44);
  body.addColorStop(0, '#9aa3aa'); body.addColorStop(0.6, '#5f686f'); body.addColorStop(1, '#3a4146');
  g.fillStyle = body; g.beginPath(); g.ellipse(w / 2, 200, 40, 36, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a4146'; g.beginPath(); g.ellipse(w / 2, 204, 24, 26, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = black;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * 11, 196, 6.5, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(w / 2, 210, 4.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(w / 2 - 3, 212); g.lineTo(w / 2 + 3, 212); g.lineTo(w / 2 + 5, 226); g.lineTo(w / 2 - 5, 226); g.closePath(); g.fill();
});
const look = {
  rim: { round: new THREE.CylinderGeometry(0.46, 0.46, 0.1, 24), octagon: new THREE.CylinderGeometry(0.49, 0.49, 0.1, 8).rotateY(Math.PI / 8) },
  faceGeo: new THREE.PlaneGeometry(0.98, 0.98).rotateX(-Math.PI / 2),
  sides: COIN.map(([col]) => mat(tint(col, 0.6), { metalness: 0.6, roughness: 0.4 })),
  faces: COIN.map(([col, mark, shape]) => new THREE.MeshStandardMaterial({ map: coinFace(col, mark, shape), alphaTest: 0.5, metalness: 0.3, roughness: 0.45 })),
  gems: {
    ruby: new THREE.MeshStandardMaterial({ map: gemFace('#e0202e', 'oct'), alphaTest: 0.5, roughness: 0.2, emissive: '#3a0408' }),
    emerald: new THREE.MeshStandardMaterial({ map: gemFace('#25c25e', 'em'), alphaTest: 0.5, roughness: 0.2, emissive: '#05301a' }),
  },
  gemGeo: { ruby: new THREE.CylinderGeometry(0.4, 0.44, 0.18, 8).rotateY(Math.PI / 8), emerald: new THREE.BoxGeometry(0.66, 0.18, 0.84) },
  gemSide: { ruby: mat('#8a0f1a', { roughness: 0.2 }), emerald: mat('#0f6a34', { roughness: 0.2 }) },
  chestGeo: new THREE.BoxGeometry(1.86, 0.5, 1.86),
  chest: [mat('#33383c'), mat('#33383c'), new THREE.MeshStandardMaterial({ map: chestTop, roughness: 0.7 }), mat('#33383c'), mat('#6a4a2a'), mat('#6a4a2a')],
};
function pieceMesh(bit) {
  const g = new THREE.Group();
  if (bit.s === 'chest') {
    const ch = mesh(look.chestGeo, look.chest);
    ch.position.y = 0.25;
    g.add(ch);
  } else if (bit.s) {
    const body = mesh(look.gemGeo[bit.s], look.gemSide[bit.s], false);
    body.position.y = 0.1;
    const face = new THREE.Mesh(look.faceGeo, look.gems[bit.s]);
    face.position.y = 0.195;
    g.add(body, face);
  } else {
    const rim = new THREE.Mesh(look.rim[COIN[bit.k][2]], look.sides[bit.k]);
    rim.position.y = 0.05;
    const face = new THREE.Mesh(look.faceGeo, look.faces[bit.k]);
    face.position.y = 0.102;
    g.add(rim, face);
  }
  return g;
}
// Where a piece sits on the board (a chest, by its top left square, across its four).
const spotX = (bit, c) => colX(c) + (bit.s === 'chest' ? 0.5 : 0), spotZ = (bit, r) => rowZ(r) + (bit.s === 'chest' ? 0.5 : 0);

// ---------- the board: a cargo net let down over the side ----------
// Grey-brown rope in a close diamond lattice, as the real net behind the coins: a tile to a square of
// the board, two diamonds across it, on clear ground (it repeats).
const NET_TILE = 1;   // (squares of the board to a tile)
const netTex = canvasTex(128, 128, (g, w) => {
  g.lineCap = 'butt';
  const strands = (dir) => { g.beginPath(); for (let k = -w; k <= w * 1.5; k += w / 2) { if (dir > 0) { g.moveTo(k, 0); g.lineTo(k + w, w); } else { g.moveTo(k + w, 0); g.lineTo(k, w); } } g.stroke(); };
  // One way under, the other over, each dark-edged with a lit top.
  for (const dir of [1, -1]) for (const [col, lw] of [['#2c2822', 15], ['#8c8576', 10], ['#bcb4a0', 3]]) { g.strokeStyle = col; g.lineWidth = lw; strands(dir); }
  // The twist of the rope, a dash every so often along each strand.
  g.strokeStyle = 'rgba(40,34,26,0.55)'; g.lineWidth = 1.5;
  for (let k = -w; k <= w * 1.5; k += w / 2) for (let t = 0.1; t < 1; t += 0.14) {
    const x = k + w - t * w, y = t * w;
    g.beginPath(); g.moveTo(x - 3, y - 3); g.lineTo(x + 3, y + 3); g.stroke();
  }
});
// The net over an area `sx` by `sy` squares of the board.
function netMat(sx, sy) {
  const t = netTex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(sx / NET_TILE, sy / NET_TILE);
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, roughness: 1, side: THREE.DoubleSide });
}
const ropeM = mat('#8a7656', { roughness: 0.95 });
function rope(a, b, r = 0.13) {
  const d = b.clone().sub(a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), ropeM);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
  return m;
}
function haulMake() {
  const g = new THREE.Group();
  // The deep water under the net, dark as the real board's ground behind its net, darker toward its foot.
  const deepTex = canvasTex(64, 128, (x, cw, ch) => { const gr = x.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, '#2a3b36'); gr.addColorStop(1, '#0f1c1d'); x.fillStyle = gr; x.fillRect(0, 0, cw, ch); });
  const deep = mesh(new THREE.PlaneGeometry(TW + 0.4, TH + 0.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: deepTex, roughness: 0.5 }), false);
  g.add(deep);
  // The net over it, a diamond to a square, under the coins.
  const net = mesh(new THREE.PlaneGeometry(TW + 0.4, TH + 0.4).rotateX(-Math.PI / 2), netMat(TW + 0.4, TH + 0.4), false);
  net.position.y = 0.012;
  g.add(net);
  // The thin silver frame round the grid.
  const silver = mat('#c4c8cc', { metalness: 0.7, roughness: 0.3 }), shade = mat('#5d6266', { metalness: 0.6, roughness: 0.4 });
  for (const [x, z, sx, sz] of [[0, -TH / 2 - 0.06, TW + 0.24, 0.12], [0, TH / 2 + 0.06, TW + 0.24, 0.12], [-TW / 2 - 0.06, 0, 0.12, TH], [TW / 2 + 0.06, 0, 0.12, TH]]) {
    const b = mesh(new THREE.BoxGeometry(sx, 0.08, sz), silver, false); b.position.set(x, 0.05, z); g.add(b);
    const s = mesh(new THREE.BoxGeometry(sx + 0.08, 0.04, sz + 0.08), shade, false); s.position.set(x, 0.01, z); g.add(s);
  }
  // Thick ropes down both sides of the net.
  for (const sx of [-1, 1]) g.add(rope(V3(sx * (TW / 2 + 0.4), 0.1, TH / 2 + 0.6), V3(sx * (TW / 2 + 0.4), 0.1, -TH / 2 - 0.3)));
  // Seaweed at its foot, swaying.
  haul.weed = [];
  const weedM = mat('#3f8a3a', { side: THREE.DoubleSide, roughness: 0.7 }), weedD = mat('#2c6a2e', { side: THREE.DoubleSide, roughness: 0.7 });
  for (const [x, h, m] of [[-TW / 2 - 0.3, 1.6, weedM], [-TW / 2 + 0.6, 1.1, weedD], [TW / 2 - 0.8, 1.3, weedM], [TW / 2 + 0.3, 1.8, weedD], [0.4, 0.9, weedM]]) {
    const geo = new THREE.PlaneGeometry(0.35, h, 1, 6).translate(0, h / 2, 0), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h; p.setX(i, p.getX(i) * (1 - y * 0.8) + Math.sin(y * 4) * 0.12); }
    geo.computeVertexNormals();
    const wd = mesh(geo, m, false);
    wd.position.set(x, 0, TH / 2 + 0.35);
    wd.rotation.x = 0.6;
    g.add(wd); haul.weed.push(wd);
  }
  haul.pieces = new THREE.Group();
  g.add(haul.pieces);
  // The cursor, as on the real board: red brackets at the corners of its two squares, lined in
  // yellow, ticks between them; upright, a square and the one below it.
  const cur = haul.cursor = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: '#d42a1c' }), yel = new THREE.MeshBasicMaterial({ color: '#ffd23a' });
  const bar = (x, z, sx, sz, m, y) => { const b = mesh(new THREE.BoxGeometry(sx, 0.03, sz), m, false); b.position.set(x, y, z); cur.add(b); };
  const t = 0.09, len = 0.3, i = 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    bar(sx * (1 - len / 2), sz / 2, len, t, red, 0.3); bar(sx, sz * (0.5 - len / 2), t, len, red, 0.3);
    bar(sx * (1 - len / 2 - i / 2), sz * (0.5 - t / 2 - i / 2), len - i, i, yel, 0.32); bar(sx * (1 - t / 2 - i / 2), sz * (0.5 - len / 2 - i / 2), i, len - i, yel, 0.32);
  }
  for (const sz of [-1, 1]) bar(0, sz * (0.5 - len / 2), t, len, red, 0.3);
  cur.rotation.y = Math.PI / 2;
  g.add(cur);
  haul.group = g;
}
/* The net's top edge on up to the rail it hangs from, `up` metres above the board and `out` metres
   back toward the hauler (nothing, if it isn't hung from anything). */
function haulRig(up, out) {
  if (haul.net) { haul.net.removeFromParent(); haul.net.traverse((o) => { if (o.geometry && o.material === ropeM) o.geometry.dispose(); }); haul.net = null; }
  if (!up) return;
  const sq = haul.sq, u = up / sq, o = out / sq, len = Math.hypot(u, o), z0 = -TH / 2 - 0.2, g = new THREE.Group();
  const p = mesh(new THREE.PlaneGeometry(TW + 0.4, len), netMat(TW + 0.4, len), false);
  p.position.set(0, u / 2, z0 - o / 2);
  p.rotation.x = Math.atan2(-o, u);
  g.add(p);
  for (const sx of [-1, 1]) g.add(rope(V3(sx * (TW / 2 + 0.4), 0.1, z0 - 0.1), V3(sx * (TW / 2 + 0.4), u, z0 - o)));
  haul.group.add(g);
  haul.net = g;
}
/* Open a haul. `salvage`: the chest to haul (src/den-haul.ts). `at`: the middle of the board, on
   the water; `yaw`: which way it's turned, its top row (row 0) toward the hauler along
   (-sin yaw, -cos yaw). `deck()`: where a chest hauled up goes to. `stay()`: while it's true the
   haul can go on (false and it's left, as with Esc). `onDone(doubloons)` once it's all up.
   `rig`: what the net hangs from, { up, out } in metres from its top edge (a ship's rail, say). */
export function haulOpen({ salvage, at, yaw = 0, sq = 0.45, deck, stay, onDone, rig = null }) {
  if (!haul.group) haulMake();
  for (const m of haul.meshes.values()) haul.pieces.remove(m);
  haul.meshes.clear();
  Object.assign(haul, { on: true, salvage, board: salvage.open(), queue: [], holdT: 0, shown: null, cur: { r: 3, c: 3 }, yaw, sq, flying: 0, deck, stay, onDone });
  const g = haul.group;
  g.position.copy(at);
  g.rotation.set(0, yaw, 0);
  g.scale.setScalar(sq);
  haulRig(rig?.up, rig?.out);
  scene.add(g);
  document.body.classList.add('hauling');   // (the sailing bar out of the way while you haul)
  keys.clear();
  if (!G.haulSaid) { G.haulSaid = true; toast('Treasure Haul: three coins in a row come up. Get the chest to the top, and every coin with it'); }
}
export function haulShut() {
  haul.group?.removeFromParent();
  haul.on = false;
  haul.queue = [];
  document.body.classList.remove('hauling');
}
const busy = () => haul.queue.length > 0 || haul.flying > 0;
export function haulSwap() {
  if (!haul.on || busy()) return;
  const m = haul.board.swap(haul.cur.r, haul.cur.c);
  if (!m.moved) {
    for (const bit of [haul.board.grid[haul.cur.r][haul.cur.c], haul.board.grid[haul.cur.r + 1]?.[haul.cur.c]]) if (bit?.s === 'chest') { const mm = haul.meshes.get(bit.id); if (mm) mm.userData.jig = 0.5; }
    return;
  }
  haul.queue.push(...m.stages);
  haul.holdT = 0;
  if (m.gems) toast(m.gems > 1 ? `${m.gems} gems went off!` : 'A gem went off!');
  else if (m.chain >= 2) toast(`A chain of ${m.chain + 1}!`);
}
// The keys play the board, as in the real puzzle: the arrows (or WASD) move the cursor, Space swaps
// (or sets off a gem under it); Esc leaves the chest for now. The others do nothing while you haul.
export function haulKey(key, e) {
  if (key === 'escape') { haulShut(); toast('The chest can wait: stop by it and Space to haul again'); return true; }
  const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
  if (mv) { haul.cur.r = Math.max(0, Math.min(TH - 2, haul.cur.r + mv[0])); haul.cur.c = Math.max(0, Math.min(TW - 1, haul.cur.c + mv[1])); return true; }
  if (key === ' ' || key === 'enter') { if (!e?.repeat) haulSwap(); return true; }
  return key !== 'p';
}
// The cursor's two squares either side of the pointer, one above the other.
export function haulHover(x, y) {
  if (!haul.on) return;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  haul.group.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(haul.group.matrixWorld), n = new THREE.Vector3(0, 1, 0).transformDirection(haul.group.matrixWorld);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  haul.group.worldToLocal(p);
  haul.cur.c = Math.max(0, Math.min(TW - 1, Math.round(p.x + (TW - 1) / 2)));
  haul.cur.r = Math.max(0, Math.min(TH - 2, Math.round(p.z + (TH - 1) / 2 - 0.5)));
}
// A chest up at the top: it's swung up out of the water onto the deck.
function chestUp(m) {
  const from = m.getWorldPosition(new THREE.Vector3()), to = haul.deck ? haul.deck() : from.clone().setY(from.y + 3);
  const s0 = m.getWorldScale(new THREE.Vector3()).x;
  haul.pieces.remove(m);
  scene.add(m);
  m.scale.setScalar(s0);
  burst(from.clone().setY(from.y + 0.3), '#e6f3f6', 16, 3);
  burst(from.clone().setY(from.y + 0.3), '#ffd23a', 14, 2.5);
  haul.flying++;
  tween(1.1, (u) => { m.position.lerpVectors(from, to, u); m.position.y += Math.sin(u * Math.PI) * 2.2; m.rotation.y = haul.yaw + u * Math.PI * 2; }, () => {
    scene.remove(m);
    burst(to.clone().setY(to.y + 0.4), '#ffd23a', 20, 3);
    burst(to.clone().setY(to.y + 0.4), '#f3ecdc', 8, 2);
    haul.flying--;
  });
  toast('Up comes the chest!');
}
export function haulTick(dt) {
  if (!haul.on) return;
  if (haul.stay && !haul.stay()) { haulShut(); return; }
  const b = haul.board;
  if (!haul.shown) {
    haul.shown = b.snap();
    const seen = new Set();
    for (let r = 0; r < TH; r++) for (let c = 0; c < TW; c++) {
      const bit = haul.shown[r][c];
      if (!bit || seen.has(bit.id)) continue;
      seen.add(bit.id);
      const m = pieceMesh(bit);
      m.position.set(spotX(bit, c), 0, spotZ(bit, r));
      haul.pieces.add(m); haul.meshes.set(bit.id, m);
    }
  }
  // A move a step at a time, as on the Bilge boards: what's hauled up goes, the rest rise into the
  // gaps, and new coins come up from the deep under the bottom edge.
  haul.holdT += dt;
  let moving = false;
  for (const m of haul.meshes.values()) if (m.userData.tz !== undefined && Math.abs(m.position.z - m.userData.tz) + Math.abs(m.position.x - m.userData.tx) > 0.02) moving = true;
  if (haul.queue.length && haul.holdT > 0.18 && !moving) {
    const st = haul.queue.shift();
    haul.holdT = 0;
    // What's hauled up flies up the board toward the hauler, and is gone over its top edge.
    for (const id of st.cleared) {
      const m = haul.meshes.get(id);
      if (!m) continue;
      haul.meshes.delete(id);
      const w = m.getWorldPosition(new THREE.Vector3());
      burst(w.setY(w.y + 0.2), '#ffe7a0', 3, 1);
      const x0 = m.position.x, z0 = m.position.z, x1 = x0 * 0.6, z1 = -TH / 2 - 1.5, dur = 0.3 + (z0 - z1) * 0.035;
      tween(dur, (u) => { m.position.set(x0 + (x1 - x0) * u, 0.3 + Math.sin(u * Math.PI) * 1.2 + u * 1.5, z0 + (z1 - z0) * u * u); m.rotation.x = u * 8; }, () => haul.pieces.remove(m));
    }
    for (const id of st.chests) { const m = haul.meshes.get(id); if (m) { haul.meshes.delete(id); chestUp(m); } }
    haul.shown = st.grid;
    const fresh = Array(TW).fill(0), seen = new Set();
    for (let r = 0; r < TH; r++) for (let c = 0; c < TW; c++) {
      const bit = st.grid[r][c];
      if (!bit || seen.has(bit.id)) continue;
      seen.add(bit.id);
      let m = haul.meshes.get(bit.id);
      if (!m) { m = pieceMesh(bit); m.position.set(spotX(bit, c), 0, rowZ(TH + fresh[c]++)); haul.pieces.add(m); haul.meshes.set(bit.id, m); }
      m.userData.tx = spotX(bit, c); m.userData.tz = spotZ(bit, r);
    }
  }
  const t = performance.now() / 1000;
  for (const [id, m] of haul.meshes) {
    const tx = m.userData.tx ?? m.position.x, tz = m.userData.tz ?? m.position.z;
    const dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
    if (d > 1e-3) { const k = Math.min(1, 6 * dt / d); m.position.x += dx * k; m.position.z += dz * k; }
    m.visible = m.position.z < rowZ(TH - 1) + 0.6;   // (new ones come up from under the bottom edge)
    m.rotation.y = m.userData.jig > 0 ? Math.sin((m.userData.jig -= dt) * 40) * 0.3 : Math.sin(t * 1.2 + id) * 0.03;
  }
  haul.cursor.position.set(colX(haul.cur.c), 0, (rowZ(haul.cur.r) + rowZ(haul.cur.r + 1)) / 2);
  haul.weed.forEach((wd, i) => { wd.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.15; });
  // All up: the chest's aboard.
  if (b.over && !busy() && !moving) {
    const n = haul.salvage.finish(), done = haul.onDone;
    haulShut();
    if (n !== null) done?.(n);
  }
}
// The camera while hauling: down onto the board from beyond it, looking back toward the hauler (so
// row 0 is at the top of the screen), drawn back enough to see them at its top edge.
export function haulCam() {
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = haul.sq;
  const look = haul.group.position.clone().add(V3(-Math.sin(haul.yaw), 0, -Math.cos(haul.yaw)).multiplyScalar(TH * sq * 0.12));
  const dist = Math.max((TH * sq / 2 + sq * 2) / Math.tan(vh), (TW * sq / 2 + sq * 1.5) / Math.tan(hh)) * 1.35;
  return { look, dist, tilt: 1.15, yaw: haul.yaw };
}
export function haulPrompt() {
  if (!haul.on) return '';
  const left = haul.board.hoard, ch = haul.board.chestList().length;
  const what = [ch ? 'the chest' : '', left > 0 ? `${left} coin${left === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ');
  return `Treasure Haul · ${what || 'all of it'} to come up · arrows or mouse move · Space or click swaps · Esc: leave it for now`;
}

// ---------- treasure by her side ----------
// The old wreck beyond the imperial checkpoint (LAY.WRECK, src/den-sail.ts): its treasure's hauled
// up the same way, stopped beside it. Once it's up, the wreck's bare.
function wreckSalvage() {
  const w = sail.sea.wreck;
  if (!w) return null;
  return (sail.wreckSalvage ||= new Salvage(w));
}
export const canHaulWreck = () => sail.on && !haul.on && !!wreckSalvage()?.canStart(sail.helm);
export function haulWreck() { return haulBeside(wreckSalvage(), () => {}, true); }
// Haul a salvage up beside her: the board on the water on its side of her (on her other side with
// `away`, clear of a wreck that's in the way), the chest it brings up swinging aboard onto her deck.
// `done` once it's aboard and paid.
function haulBeside(s, done, away = false) {
  if (!s || !s.canStart(sail.helm)) return false;
  const ry = sail.g.rotation.y, side = V3(Math.sin(ry), 0, Math.cos(ry));   // her own +z: abeam
  const p = sail.helm.pose, to = V3(seaX(s.at[0]) - seaX(p.c), 0, seaZ(s.at[1]) - seaZ(p.r));
  const k = (Math.sign(to.dot(side)) || 1) * (away ? -1 : 1), sq = 0.45;
  const at = V3(seaX(p.c), 0.12 + liftAt(p.c, p.r), seaZ(p.r)).addScaledVector(side, k * (SLOOP_BEAM / 2 - 0.15 + 0.35 + TH * sq / 2));   // (as far out from her side as before she was widened)
  haulOpen({
    salvage: s, at, yaw: Math.atan2(k * side.x, k * side.z), sq,
    deck: () => sail.g.localToWorld(V3(0.9, SLOOP_DECK + 0.1, 0)),
    rig: { up: SLOOP_DECK + 0.2 - 0.12, out: 0.35 },   // (the net hangs from her rail)
    stay: () => sail.on && !sail.helm.dazed() && !sail.helm.held(),
    onDone: (n) => {
      G.gold += n;
      updateStats();
      done();
      toast(aboard(n));
    },
  });
  return true;
}
