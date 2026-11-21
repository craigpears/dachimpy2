/* A summoner's hall's other pieces, as in Jezerbell's house: her throne with bat wings, bat gargoyles crouched on
   chests, a doubloon exchange, a blue-and-white vase, a potted palm, and statues of sea creatures (a shark, a sea
   turtle, a seal). */
import { THREE, mat, mesh, box, cyl, rod, ball, cloth, dark, ebony, gilt, brass, canvasTex } from './parts.js';

// ---------- her throne ----------
const wingM = mat('#3a3346', { roughness: 0.8, side: THREE.DoubleSide }), batFrame = mat('#2a2433', { roughness: 0.7 });
/** A bat's wing, flat, `w` across, `h` high, its root at the origin, spreading toward +x. */
function wing(w, h) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(w * 0.35, h); s.lineTo(w * 0.55, h * 0.55); s.lineTo(w * 0.72, h * 0.95); s.lineTo(w * 0.85, h * 0.4); s.lineTo(w, h * 0.8);
  s.quadraticCurveTo(w * 0.85, -h * 0.1, w * 0.55, -h * 0.25); s.quadraticCurveTo(w * 0.25, -h * 0.05, 0, 0);
  return mesh(new THREE.ShapeGeometry(s), wingM);
}
/** A throne with bat wings: a tall golden-yellow back and seat in a dark frame, bat wings spread from its back, gold
    finials. `col`: its upholstery. */
export function batThrone({ col = '#e3b32a' } = {}) {
  const g = new THREE.Group(), up = cloth(col), seatRed = cloth('#b0202e');
  g.add(box(0.95, 0.12, 0.8, batFrame, 0, 0.06, 0), box(0.85, 0.32, 0.72, batFrame, 0, 0.28, 0), box(0.86, 0.12, 0.76, up, 0, 0.5, 0.02));
  g.add(box(1.0, 0.08, 0.9, seatRed, 0, 0.03, 0.1));   // (wider than the base: sides sharing a face flicker)
  // the back, tall and rounded at the top
  g.add(box(0.8, 1.2, 0.1, up, 0, 1.15, -0.33), box(0.92, 1.3, 0.06, batFrame, 0, 1.15, -0.4));
  const top = cyl(0.46, 0.46, 0.06, batFrame, 0, 1.8, -0.4, 16); top.rotation.x = Math.PI / 2; top.scale.y = 1; g.add(top);
  const topUp = cyl(0.4, 0.4, 0.1, up, 0, 1.78, -0.33, 16); topUp.rotation.x = Math.PI / 2; g.add(topUp);
  for (const sx of [-1, 1]) {
    g.add(box(0.1, 0.5, 0.7, batFrame, 0.45 * sx, 0.72, 0), ball(0.07, gilt, 0.45 * sx, 1.0, 0.32), cyl(0, 0.06, 0.24, gilt, 0.47 * sx, 1.95, -0.4, 6));
    const w = wing(0.9, 0.7); w.position.set(0.38 * sx, 1.55, -0.45); w.scale.x = sx; w.rotation.y = -0.35 * sx; g.add(w);
  }
  g.add(ball(0.09, gilt, 0, 2.28, -0.4));
  return { g };
}

// ---------- a gargoyle on a chest ----------
const gargM = mat('#5a5862', { roughness: 0.85 }), gargDark = mat('#38363f', { roughness: 0.9, side: THREE.DoubleSide });
/** A bat gargoyle crouched on a chest: the chest dark wood banded in `col`, the gargoyle grey stone, wings half
    spread, horns and purple eyes. */
export function gargoyleChest({ col = '#6a3a9a' } = {}) {
  const g = new THREE.Group(), band = mat(col, { metalness: 0.3, roughness: 0.5 });
  // (its bands proud of every face, never level with its top or with each other's fronts: the user, 21 Nov, saw
  // the chests flicker)
  g.add(box(0.95, 0.5, 0.55, dark, 0, 0.25, 0), box(0.97, 0.06, 0.57, band, 0, 0.44, 0), box(0.97, 0.06, 0.57, band, 0, 0.1, 0));
  for (const sx of [-1, 1]) g.add(box(0.06, 0.53, 0.6, band, 0.34 * sx, 0.265, 0));
  g.add(box(0.12, 0.12, 0.04, brass, 0, 0.3, 0.3));
  const G = new THREE.Group(); G.position.y = 0.5;
  G.add(ball(0.2, gargM, 0, 0.2, 0, 10), ball(0.13, gargM, 0, 0.42, 0.1, 10), box(0.1, 0.06, 0.12, gargM, 0, 0.38, 0.22));
  for (const sx of [-1, 1]) {
    G.add(ball(0.07, gargM, 0.14 * sx, 0.06, 0.12), rod([0.07 * sx, 0.5, 0.06], [0.13 * sx, 0.64, 0.0], 0.025, gargDark), ball(0.022, new THREE.MeshBasicMaterial({ color: '#b77cff' }), 0.05 * sx, 0.45, 0.21));
    const w = mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.5, 0.35); s.lineTo(0.42, 0.1); s.lineTo(0.55, 0.02); s.lineTo(0.38, -0.1); s.lineTo(0.3, -0.25); return s; })()), gargDark);
    w.position.set(0.12 * sx, 0.28, -0.08); w.scale.x = sx; w.rotation.y = -0.5 * sx; G.add(w);
  }
  g.add(G);
  return { g };
}

// ---------- a doubloon exchange ----------
const coinTex = canvasTex(128, 128, (x) => {
  x.fillStyle = '#d9a93a'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#8a6418'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 50, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#8a6418'; x.font = 'bold 64px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('D', 64, 68);
});
const coinFace = mat('#ffffff', { map: coinTex, metalness: 0.6, roughness: 0.35 });
/** A doubloon exchange: a counter of dark wood trimmed in gold, a big doubloon on its sign, stacks of coins. */
export function doubloonExchange() {
  const g = new THREE.Group();
  g.add(box(0.9, 0.9, 0.5, ebony, 0, 0.45, 0), box(0.96, 0.05, 0.56, gilt, 0, 0.92, 0), box(0.96, 0.08, 0.56, gilt, 0, 0.04, 0));
  for (const sx of [-1, 1]) g.add(box(0.06, 0.55, 0.06, gilt, 0.4 * sx, 1.2, -0.18));
  g.add(box(0.9, 0.12, 0.08, ebony, 0, 1.48, -0.18));
  const coin = cyl(0.26, 0.26, 0.05, gilt, 0, 1.78, -0.18, 24); coin.rotation.x = Math.PI / 2; g.add(coin);
  const face = mesh(new THREE.CircleGeometry(0.24, 24), coinFace); face.position.set(0, 1.78, -0.14); g.add(face);   // (clear of the coin's own face)
  for (const [x, n] of [[-0.25, 5], [-0.1, 3], [0.2, 4]]) for (let i = 0; i < n; i++) g.add(cyl(0.06, 0.06, 0.018, gilt, x, 0.955 + i * 0.019, 0.08, 12));
  return { g };
}

// ---------- a blue-and-white vase ----------
const vaseTex = canvasTex(256, 128, (x) => {
  x.fillStyle = '#f2f1ec'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#2a4fa0'; x.fillStyle = '#2a4fa0'; x.lineWidth = 4;
  for (const y of [10, 118]) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); }
  for (let i = 0; i < 8; i++) {
    const cx = 16 + i * 32;
    x.beginPath(); x.arc(cx, 64, 12, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(cx - 16, 40); x.quadraticCurveTo(cx, 20, cx + 16, 40); x.stroke();
    x.beginPath(); x.arc(cx, 64, 4, 0, Math.PI * 2); x.fill();
  }
});
/** A tall blue-and-white vase, waisted, flowers and swirls round it. */
export function vase({ h = 0.85 } = {}) {
  const pts = [[0, 0], [0.16, 0], [0.2, 0.08], [0.26, 0.3], [0.25, 0.5], [0.15, 0.72], [0.12, 0.85], [0.16, 0.95], [0.14, 1]].map(([r, y]) => new THREE.Vector2(r * h / 0.85 * 0.9, y * h));
  const m = mesh(new THREE.LatheGeometry(pts, 20), mat('#ffffff', { map: vaseTex, roughness: 0.25, side: THREE.DoubleSide }));
  return { g: new THREE.Group().add(m) };
}

// ---------- a potted palm ----------
const frondM = mat('#3f8a3a', { roughness: 0.8, side: THREE.DoubleSide }), trunkM = mat('#8a6a42', { roughness: 0.95 });
/** A palm in a big pot, its fronds drooping. `pot`: the pot's colour. */
export function pottedPalm({ pot = '#5a2a7a', h = 1.5 } = {}) {
  const g = new THREE.Group(), potM = mat(pot, { roughness: 0.5 });
  g.add(cyl(0.3, 0.22, 0.45, potM, 0, 0.225, 0, 14), cyl(0.33, 0.33, 0.06, potM, 0, 0.46, 0, 14), cyl(0.28, 0.28, 0.02, mat('#3a2818'), 0, 0.47, 0, 12));
  for (let i = 0; i < 5; i++) g.add(cyl(0.07 - i * 0.006, 0.08 - i * 0.006, (h - 0.5) / 5, trunkM, Math.sin(i) * 0.03, 0.5 + (i + 0.5) * (h - 0.5) / 5, 0, 7));
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, f = mesh(new THREE.PlaneGeometry(0.75, 0.2, 4, 1), frondM);
    const p = f.geometry.attributes.position;
    for (let k = 0; k < p.count; k++) { const u = (p.getX(k) + 0.375) / 0.75; p.setY(k, p.getY(k) * (1 - u * 0.7)); p.setZ(k, -u * u * 0.35); }
    f.geometry.computeVertexNormals();
    f.position.set(Math.cos(a) * 0.35, h + 0.02, -Math.sin(a) * 0.35); f.rotation.set(0, a, -0.2);
    g.add(f);
  }
  return { g };
}

// ---------- statues of sea creatures ----------
const plinthM = mat('#d6d0c4', { roughness: 0.9 });
/** A statue of a sea creature on a plinth: `animal` 'shark' (big, blue, reared up on its tail), 'turtle' (a sea
    turtle, white stone) or 'seal' (blue, lying). */
export function statue({ animal = 'shark' } = {}) {
  const g = new THREE.Group();
  if (animal === 'shark') {
    const m = mat('#3d6fb8', { roughness: 0.6 }), belly = mat('#dfe6f0', { roughness: 0.6 });
    g.add(box(0.6, 0.3, 0.6, plinthM, 0, 0.15, 0));
    const body = ball(0.3, m, 0, 0.95, 0, 12); body.scale.set(0.9, 2.1, 0.8); g.add(body);
    const front = ball(0.22, belly, 0, 0.9, 0.12, 10); front.scale.set(0.8, 2, 0.5); g.add(front);
    g.add(cyl(0, 0.16, 0.35, m, 0, 1.7, 0.02, 8));
    for (const sx of [-1, 1]) { const fin = cyl(0, 0.12, 0.35, m, 0.3 * sx, 0.95, 0.05, 4); fin.rotation.z = -1.2 * sx; g.add(fin); }
    const dors = cyl(0, 0.14, 0.3, m, 0, 1.15, -0.28, 4); dors.rotation.x = -1.1; g.add(dors);
    g.add(box(0.36, 0.04, 0.05, mat('#f4f4f4'), 0, 1.38, 0.24));    // its grin
    for (const sx of [-1, 1]) g.add(ball(0.035, mat('#111'), 0.13 * sx, 1.5, 0.2));
    const tail = cyl(0.02, 0.2, 0.3, m, 0, 0.42, 0, 4); tail.rotation.z = Math.PI / 2; tail.scale.z = 0.3; g.add(tail);
  } else if (animal === 'turtle') {
    const shell = mat('#e6e2da', { roughness: 0.7 }), skin = mat('#c9c4ba', { roughness: 0.8 });
    const s = ball(0.24, shell, 0, 0.16, 0, 12); s.scale.set(1, 0.45, 1.25); g.add(s);
    g.add(ball(0.08, skin, 0, 0.14, 0.32));
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const f = box(0.16, 0.03, 0.08, skin, 0.24 * x, 0.08, 0.14 * z); f.rotation.y = 0.5 * x * z; g.add(f); }
  } else {
    const m = mat('#4a84d0', { roughness: 0.6 });
    const b = ball(0.2, m, 0, 0.2, 0, 12); b.scale.set(0.85, 0.9, 1.8); g.add(b);
    g.add(ball(0.13, m, 0, 0.36, 0.3, 10), ball(0.025, mat('#111'), 0.05, 0.4, 0.42), ball(0.025, mat('#111'), -0.05, 0.4, 0.42));
    for (const sx of [-1, 1]) { const f = box(0.16, 0.025, 0.08, m, 0.18 * sx, 0.05, 0.12); f.rotation.y = 0.4 * sx; g.add(f); }
    const tail = box(0.22, 0.02, 0.1, m, 0, 0.05, -0.38); g.add(tail);
  }
  return { g };
}

export const PIECES = [
  { id: 'batThrone', name: 'Throne with bat wings', group: 'hall', make: batThrone,
    about: 'A tall golden throne in a dark frame, bat wings spread from its back, gold finials. Options: col (its upholstery).',
    where: 'Jezerbell\'s house.' },
  { id: 'gargoyleChest', name: 'Gargoyle on a chest', group: 'hall', make: gargoyleChest,
    about: 'A bat gargoyle in grey stone crouched on a banded chest. Options: col (the chest\'s bands).',
    where: 'Jezerbell\'s house.' },
  { id: 'doubloonExchange', name: 'Doubloon exchange', group: 'hall', make: doubloonExchange,
    about: 'A dark counter trimmed in gold, a big doubloon on its sign, stacks of coins.',
    where: 'Jezerbell\'s house.' },
  { id: 'vase', name: 'Blue-and-white vase', group: 'hall', make: vase,
    about: 'A tall waisted vase, blue flowers and swirls on white. Options: h (its height).',
    where: 'Jezerbell\'s house.' },
  { id: 'pottedPalm', name: 'Potted palm', group: 'hall', make: pottedPalm,
    about: 'A palm in a big pot, its fronds drooping. Options: pot (its colour), h (its height).',
    where: 'Jezerbell\'s house.' },
  { id: 'statue', name: 'Statue of a sea creature', group: 'hall', make: statue,
    about: 'A sea creature in stone: animal \'shark\' (reared up on a plinth), \'turtle\' or \'seal\'.',
    where: 'Jezerbell\'s house.', sample: { animal: 'shark' } },
];
