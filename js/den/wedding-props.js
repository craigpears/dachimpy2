// Mischievious's wedding: the props you lay out (src/den-wedding.ts, PROPS), as simple shapes in their
// dyes: benches, the arch, flowers, banners, barrels, tables, lanterns, candles, the cake and the
// splatters; and each one wrecked, as the last wedding left them (a bench overturned, the arch snapped,
// a banner torn). Each faces its own -z (a bench's sitters look that way), its length along x.
import * as THREE from 'three';
import { dyeHex } from '../den-look.js';
import { mat, mesh, canvasTex, woodTex } from './world.js';

const mats = new Map();
const dyed = (c, o = {}) => { const key = c + JSON.stringify(o); if (!mats.has(key)) mats.set(key, mat(dyeHex(c), o)); return mats.get(key); };
const wood = mat('#8a5a32', { map: woodTex }), darkWood = mat('#5b3a20', { map: woodTex }), white = mat('#f6f2ea'), leaf = mat('#3f7d34'), iron = mat('#2b2b2b', { metalness: 0.6 });
const pot = mat('#b5653a'), gold = mat('#e8b23a', { metalness: 0.7, roughness: 0.3 });
const flame = new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffae35', emissiveIntensity: 2 });
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, n = 12) => new THREE.CylinderGeometry(a, b, h, n);
const G = {
  seat: box(2.2, 0.07, 0.42), back: box(2.2, 0.42, 0.06), leg: box(0.07, 0.45, 0.07), sash: box(0.06, 0.09, 0.44), bow: new THREE.SphereGeometry(0.09, 10, 8),
  post: cyl(0.07, 0.08, 2.4), hoop: new THREE.TorusGeometry(1.1, 0.07, 8, 28, Math.PI), bloom: new THREE.SphereGeometry(0.11, 10, 8),
  pot: cyl(0.2, 0.14, 0.32), bush: new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), small: new THREE.SphereGeometry(0.075, 8, 6),
  pole: cyl(0.04, 0.05, 2.2, 8), cloth: new THREE.PlaneGeometry(1.3, 0.85), knob: new THREE.SphereGeometry(0.05, 8, 6),
  barrel: cyl(0.34, 0.3, 0.75, 16), ring: new THREE.TorusGeometry(0.33, 0.02, 6, 24),
  top: cyl(0.55, 0.55, 0.05, 24), stem: cyl(0.06, 0.08, 0.72), skirt: new THREE.CylinderGeometry(0.58, 0.62, 0.62, 24, 1, true),
  lpost: cyl(0.045, 0.06, 1.6, 8), glass: cyl(0.11, 0.11, 0.24, 6), lid: new THREE.ConeGeometry(0.15, 0.1, 6),
  candle: cyl(0.035, 0.035, 1, 8), flame: new THREE.ConeGeometry(0.025, 0.07, 8), plate: cyl(0.2, 0.22, 0.04, 16),
  tier: [cyl(0.4, 0.4, 0.22, 24), cyl(0.29, 0.29, 0.2, 24), cyl(0.18, 0.18, 0.18, 24)], band: [cyl(0.41, 0.41, 0.05, 24), cyl(0.3, 0.3, 0.05, 24), cyl(0.19, 0.19, 0.05, 24)],
  heart: null, splat: new THREE.PlaneGeometry(1.4, 1.4),
};
{
  const s = new THREE.Shape();
  s.moveTo(0, -0.06); s.bezierCurveTo(-0.16, 0.06, -0.08, 0.18, 0, 0.08); s.bezierCurveTo(0.08, 0.18, 0.16, 0.06, 0, -0.06);
  G.heart = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
}
// A banner's cloth: a heart, or a skull for the darker colours.
const banners = new Map();
function bannerMat(c) {
  if (banners.has(c)) return banners.get(c);
  const dark = ['black', 'maroon', 'shadow', 'grey', 'navy', 'purple', 'brown', 'plum', 'crimson'].includes(c);
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(130, 85, (g, w, h) => {
    g.fillStyle = dyeHex(c); g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.fillStyle = dark ? '#f6f2ea' : '#c8213a';
    if (dark) {   // a little skull, for the bloody and gory
      g.beginPath(); g.arc(w / 2, h / 2 - 6, 17, 0, Math.PI * 2); g.fill(); g.fillRect(w / 2 - 10, h / 2 + 4, 20, 14);
      g.fillStyle = dyeHex(c); g.beginPath(); g.arc(w / 2 - 7, h / 2 - 6, 5, 0, 7); g.arc(w / 2 + 7, h / 2 - 6, 5, 0, 7); g.fill();
    } else {
      g.beginPath(); g.moveTo(w / 2, h / 2 + 22); g.bezierCurveTo(w / 2 - 34, h / 2 - 2, w / 2 - 16, h / 2 - 30, w / 2, h / 2 - 12); g.bezierCurveTo(w / 2 + 16, h / 2 - 30, w / 2 + 34, h / 2 - 2, w / 2, h / 2 + 22); g.fill();
    }
  }) });
  banners.set(c, m);
  return m;
}
// A splatter: a blob and its drops, in the dye, on a see-through square (the same shape each time).
const splatTex = canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff';
  let a = 11;
  const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
  g.beginPath();
  for (let i = 0; i <= 20; i++) { const t = i / 20 * Math.PI * 2, d = 26 + r() * 18; g.lineTo(64 + Math.cos(t) * d, 64 + Math.sin(t) * d); }
  g.fill();
  for (let i = 0; i < 14; i++) { const t = r() * Math.PI * 2, d = 40 + r() * 20; g.beginPath(); g.arc(64 + Math.cos(t) * d, 64 + Math.sin(t) * d, 2 + r() * 6, 0, 7); g.fill(); }
});
const splatMats = new Map();
const splatMat = (c) => splatMats.get(c) || splatMats.set(c, new THREE.MeshStandardMaterial({ color: dyeHex(c), alphaMap: splatTex, transparent: true, depthWrite: false, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 })).get(c);
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

/* More from the furnisher's (11 Nov: "more control and variety ... on the furniture"): seats, a feast
   and its grog, lights, flowers, finery, music and the piratey bits, in the same low-poly shapes. Each
   faces its own -z, its length along x, as src/den-wedding.ts's footprint() has it. */
const stone = mat('#cfc6b6'), amber = new THREE.MeshStandardMaterial({ color: '#c9761e', emissive: '#7a3a08', emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.85 });
const glassM = new THREE.MeshStandardMaterial({ color: '#dff4ff', roughness: 0.1, transparent: true, opacity: 0.55 });
const roastM = mat('#8a4a1c', { roughness: 0.5 }), bottleM = mat('#2f6b3a', { roughness: 0.2 }), coin = mat('#f2c040', { metalness: 0.8, roughness: 0.25 });
const fireM = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff7a1a', emissiveIntensity: 2.4 });
const blackKey = mat('#141414'), whiteKey = mat('#f8f6f0');
const H = {
  box: box(1, 1, 1), ball: new THREE.SphereGeometry(1, 12, 9), cyl: cyl(1, 1, 1, 14), cone: new THREE.ConeGeometry(1, 1, 12), ring: new THREE.TorusGeometry(1, 0.06, 6, 24),
  arc: new THREE.TorusGeometry(1, 0.05, 6, 20, Math.PI), leaf: new THREE.ConeGeometry(0.16, 1.1, 4, 1, true), skull: new THREE.SphereGeometry(0.12, 10, 8),
};
/** A mesh of one of H's unit shapes, scaled to size and put at x, y, z. */
const S = (geo, m, sx, sy, sz, x = 0, y = 0, z = 0, shadow = true) => { const o = at(mesh(geo, m, shadow), x, y, z); o.scale.set(sx, sy, sz); return o; };
const flat = (w, d, m, y = 0.014) => { const o = mesh(new THREE.PlaneGeometry(w, d), m, false); o.rotation.x = -Math.PI / 2; o.position.y = y; return o; };
const rugMats = new Map();
function rugMat(c) {
  if (!rugMats.has(c)) rugMats.set(c, new THREE.MeshStandardMaterial({ roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, map: canvasTex(256, 110, (g, w, h) => {
    g.fillStyle = dyeHex(c); g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8b23a'; g.lineWidth = 7; g.strokeRect(8, 8, w - 16, h - 16);
    g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40);
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 5; i++) { const x = 50 + i * 39, y = h / 2; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 14, y); g.lineTo(x, y + 18); g.lineTo(x - 14, y); g.fill(); }
    g.fillStyle = '#e8b23a'; for (let x = 4; x < w; x += 10) { g.fillRect(x, 0, 3, 5); g.fillRect(x, h - 5, 3, 5); }
  }) }));
  return rugMats.get(c);
}
const petalTex = canvasTex(128, 64, (g) => {
  let a = 7; const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) { g.save(); g.translate(8 + r() * 112, 6 + r() * 52); g.rotate(r() * 7); g.beginPath(); g.ellipse(0, 0, 3.4, 2, 0, 0, 7); g.fill(); g.restore(); }
});
const petalMats = new Map();
const petalMat = (c) => petalMats.get(c) || petalMats.set(c, new THREE.MeshStandardMaterial({ color: dyeHex(c), alphaMap: petalTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })).get(c);
function flames(g, pts, y0 = 0) { for (const [x, y, z] of pts) g.add(at(mesh(G.flame, flame, false), x, y + y0, z)); }
const MORE = {
  chair(g, c) {
    g.add(S(H.box, wood, 0.46, 0.05, 0.44, 0, 0.45, 0), S(H.box, dyed(c), 0.4, 0.06, 0.38, 0, 0.5, -0.01), S(H.box, wood, 0.46, 0.55, 0.05, 0, 0.75, 0.2));
    for (const x of [-0.19, 0.19]) for (const z of [-0.18, 0.18]) g.add(S(H.box, darkWood, 0.05, 0.45, 0.05, x, 0.22, z));
    g.add(at(mesh(G.bow, dyed(c)), 0, 1.0, 0.21));
  },
  throne(g, c) {
    g.add(S(H.box, darkWood, 0.84, 0.12, 0.7, 0, 0.42, 0.05), S(H.box, dyed(c), 0.72, 0.08, 0.6, 0, 0.5, 0.02), S(H.box, darkWood, 0.84, 1.45, 0.12, 0, 0.95, 0.38));
    g.add(S(H.box, dyed(c), 0.6, 1.0, 0.04, 0, 1.0, 0.31));
    for (const x of [-0.42, 0.42]) { g.add(S(H.box, darkWood, 0.1, 0.5, 0.66, x, 0.6, 0.05), at(mesh(G.knob, gold), x, 0.88, -0.25)); }
    for (const x of [-0.42, 0, 0.42]) g.add(at(mesh(G.bloom, gold), x, 1.72 + (x ? 0 : 0.12), 0.38));
    for (const x of [-0.36, 0.36]) for (const z of [-0.24, 0.34]) g.add(S(H.box, darkWood, 0.08, 0.38, 0.08, x, 0.19, z));
  },
  feast(g, c) {
    g.add(S(H.box, wood, 2.3, 0.06, 0.9, 0, 0.75, 0), S(H.box, dyed(c), 2.34, 0.02, 0.94, 0, 0.785, 0));
    for (const z of [-0.47, 0.47]) g.add(S(H.box, dyed(c), 2.34, 0.32, 0.015, 0, 0.62, z));
    for (const x of [-1.05, 1.05]) for (const z of [-0.35, 0.35]) g.add(S(H.box, darkWood, 0.08, 0.74, 0.08, x, 0.37, z));
    // The roast on its platter, a bowl of fruit, bottles and tankards.
    g.add(S(H.cyl, gold, 0.3, 0.02, 0.22, 0, 0.81, 0), S(H.ball, roastM, 0.24, 0.13, 0.16, 0, 0.88, 0), S(H.ball, white, 0.035, 0.035, 0.08, 0.22, 0.9, 0));
    g.add(S(H.ball, gold, 0.17, 0.08, 0.17, -0.72, 0.82, 0.1));
    [['#d72c22', 0], ['#ffbe00', 1], ['#3fd837', 2], ['#f57c09', 3], ['#6104ad', 4]].forEach(([col, i]) => g.add(S(H.ball, mat(col), 0.06, 0.06, 0.06, -0.72 + Math.cos(i * 1.3) * 0.08, 0.89 + (i === 4 ? 0.05 : 0), 0.1 + Math.sin(i * 1.3) * 0.08)));
    for (const [x, z] of [[0.62, 0.18], [0.78, -0.12], [-0.4, -0.25]]) g.add(S(H.cyl, bottleM, 0.045, 0.3, 0.045, x, 0.95, z), S(H.cyl, bottleM, 0.018, 0.08, 0.018, x, 1.14, z));
    for (const [x, z] of [[0.35, -0.3], [-0.95, -0.28], [1.0, 0.25], [-0.25, 0.3]]) g.add(S(H.cyl, wood, 0.06, 0.13, 0.06, x, 0.86, z));
  },
  punch(g, c) {
    g.add(S(H.cyl, gold, 0.12, 0.05, 0.12, 0, 0.025, 0), S(H.cyl, gold, 0.035, 0.12, 0.035, 0, 0.1, 0));
    const bowl = S(H.ball, glassM, 0.27, 0.16, 0.27, 0, 0.26, 0, false);
    g.add(bowl, S(H.cyl, dyed(c, { roughness: 0.2 }), 0.25, 0.02, 0.25, 0, 0.3, 0));
    const ladle = S(H.cyl, gold, 0.012, 0.36, 0.012, 0.14, 0.4, 0); ladle.rotation.z = 0.5; g.add(ladle);
  },
  fountain(g, c) {
    g.add(S(H.cyl, stone, 0.62, 0.32, 0.62, 0, 0.16, 0), S(H.cyl, amber, 0.55, 0.02, 0.55, 0, 0.3, 0, false), S(H.ring, dyed(c, { metalness: 0.6, roughness: 0.3 }), 0.62, 0.62, 2, 0, 0.32, 0));
    g.children.at(-1).rotation.x = Math.PI / 2;
    g.add(S(H.cyl, stone, 0.09, 0.9, 0.09, 0, 0.75, 0), S(H.cyl, stone, 0.36, 0.1, 0.36, 0, 1.0, 0), S(H.cyl, amber, 0.32, 0.02, 0.32, 0, 1.05, 0, false));
    g.add(S(H.cyl, stone, 0.06, 0.38, 0.06, 0, 1.25, 0), S(H.cyl, stone, 0.2, 0.08, 0.2, 0, 1.42, 0), S(H.ball, dyed(c, { metalness: 0.6, roughness: 0.3 }), 0.08, 0.08, 0.08, 0, 1.55, 0));
    // The rum, pouring over each tier's lip.
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(S(H.cyl, amber, 0.02, 0.7, 0.02, Math.cos(a) * 0.35, 0.68, Math.sin(a) * 0.35, false)); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; g.add(S(H.cyl, amber, 0.015, 0.36, 0.015, Math.cos(a) * 0.2, 1.22, Math.sin(a) * 0.2, false)); }
  },
  candelabra(g, c) {
    g.add(S(H.cyl, gold, 0.16, 0.04, 0.16, 0, 0.02, 0), S(H.cyl, gold, 0.03, 1.3, 0.03, 0, 0.67, 0), S(H.box, gold, 0.7, 0.03, 0.03, 0, 1.3, 0));
    const tips = [[-0.35, 1.32, 0], [-0.17, 1.42, 0], [0, 1.52, 0], [0.17, 1.42, 0], [0.35, 1.32, 0]];
    for (const [x, y] of tips) { if (y > 1.33) g.add(S(H.cyl, gold, 0.015, y - 1.3, 0.015, x, (y + 1.3) / 2, 0)); g.add(S(H.cyl, dyed(c), 0.03, 0.2, 0.03, x, y + 0.1, 0)); }
    flames(g, tips.map(([x, y, z]) => [x, y + 0.24, z]));
  },
  torch(g, c) {
    g.add(S(H.cyl, darkWood, 0.04, 1.6, 0.04, 0, 0.8, 0), S(H.cyl, dyed(c), 0.07, 0.16, 0.07, 0, 1.55, 0), S(H.cyl, iron, 0.09, 0.08, 0.09, 0, 1.66, 0));
    const f = S(H.cone, fireM, 0.1, 0.32, 0.1, 0, 1.86, 0, false); g.add(f, S(H.cone, flame, 0.06, 0.2, 0.06, 0.02, 1.98, 0, false));
  },
  chandelier(g, c) {
    // (its post off to the side, an arm over to where it hangs: the prop's own spot)
    g.add(S(H.cyl, darkWood, 0.08, 3.1, 0.08, -1.0, 1.55, 0), S(H.box, darkWood, 1.15, 0.1, 0.1, -0.45, 3.05, 0), S(H.box, darkWood, 0.08, 0.5, 0.08, -0.82, 2.82, 0));
    g.children.at(-1).rotation.z = -0.8;
    g.add(S(H.cyl, iron, 0.012, 0.5, 0.012, 0, 2.78, 0, false));
    const ring = S(H.ring, dyed(c, { metalness: 0.6, roughness: 0.3 }), 0.45, 0.45, 1.4, 0, 2.5, 0);
    ring.rotation.x = Math.PI / 2; g.add(ring);
    const tips = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45;
      g.add(S(H.cyl, white, 0.025, 0.14, 0.025, x, 2.58, z), S(H.ball, glassM, 0.04, 0.06, 0.04, x * 0.8, 2.38, z * 0.8, false));
      tips.push([x, 2.68, z]);
    }
    flames(g, tips);
  },
  palm(g, c) {
    g.add(S(H.cyl, dyed(c), 0.24, 0.36, 0.18, 0, 0.18, 0), S(H.cyl, dyed(c), 0.27, 0.06, 0.27, 0, 0.37, 0));
    g.children.at(-2).scale.z = 0.24;
    for (let i = 0; i < 4; i++) g.add(S(H.cyl, mat('#8a6a44'), 0.06 - i * 0.008, 0.36, 0.06 - i * 0.008, i * 0.03, 0.55 + i * 0.33, 0));
    for (let i = 0; i < 7; i++) {
      const fr = mesh(H.leaf, leaf), a = i / 7 * Math.PI * 2;
      fr.scale.set(1, 1, 0.2);
      fr.position.set(0.1 + Math.cos(a) * 0.42, 1.78, Math.sin(a) * 0.42);
      fr.rotation.set(0, -a, 0); fr.rotateZ(-Math.PI / 2 - 0.4);
      g.add(fr);
    }
  },
  garland(g, c) {
    for (const x of [-1, 1]) g.add(S(H.cyl, darkWood, 0.05, 1.7, 0.05, x, 0.85, 0), at(mesh(G.knob, gold), x, 1.73, 0));
    const swag = S(H.arc, leaf, 1, 0.45, 1.2, 0, 1.6, 0); swag.rotation.z = Math.PI; g.add(swag);
    for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI; g.add(at(mesh(G.bloom, i % 3 === 1 ? white : dyed(c)), Math.cos(t), 1.6 - Math.sin(t) * 0.45, 0.04)); }
  },
  petals(g, c) { g.add(flat(1.9, 1.0, petalMat(c), 0.016)); },
  rug(g, c) { g.add(flat(2.6, 1.1, rugMat(c), 0.012)); },
  flag(g, c) {
    g.add(S(H.cyl, darkWood, 0.045, 3.2, 0.045, 0, 1.6, 0), at(mesh(G.knob, gold), 0, 3.24, 0), S(H.cyl, stone, 0.2, 0.12, 0.2, 0, 0.06, 0));
    const f = at(mesh(G.cloth, bannerMat(c)), 0.66, 2.8, 0); f.scale.set(1, 0.85, 1); g.add(f);
  },
  statue(g, c) {
    const m = dyed(c, { roughness: 0.6 });
    g.add(S(H.box, stone, 0.62, 0.7, 0.62, 0, 0.35, 0), S(H.box, stone, 0.72, 0.08, 0.72, 0, 0.72, 0));
    // A pirate striking a pose, one hand on hip, the other pointing to sea.
    g.add(S(H.cyl, m, 0.17, 0.5, 0.15, 0, 1.2, 0), S(H.cone, m, 0.22, 0.42, 0.2, 0, 0.96, 0), S(H.ball, m, 0.13, 0.15, 0.13, 0, 1.6, 0), S(H.cone, m, 0.2, 0.12, 0.2, 0, 1.76, 0));
    const arm = S(H.cyl, m, 0.045, 0.5, 0.045, 0.28, 1.45, -0.06); arm.rotation.z = 1.0; g.add(arm);
    const arm2 = S(H.cyl, m, 0.045, 0.3, 0.045, -0.17, 1.2, 0); arm2.rotation.z = -0.7; g.add(arm2);
    for (const x of [-0.07, 0.07]) g.add(S(H.cyl, m, 0.05, 0.36, 0.05, x, 0.94, 0));
  },
  heart(g, c) {
    const h = at(mesh(G.heart, dyed(c)), 0, 1.0, 0);
    h.scale.set(5, 5, 4); h.position.z = -0.06; g.add(h);
    for (const x of [-0.3, 0.3]) g.add(S(H.cyl, darkWood, 0.04, 1.0, 0.04, x, 0.5, 0.05));
    for (let i = 0; i < 9; i++) { const t = i / 8 * Math.PI * 2; g.add(at(mesh(G.small, white), Math.sin(t) * 0.65, 1.3 + Math.cos(t) * 0.45, -0.1)); }
  },
  chest(g, c) {
    g.add(S(H.box, wood, 0.8, 0.42, 0.5, 0, 0.21, 0), S(H.cyl, wood, 0.25, 0.8, 0.25, 0, 0.42, 0));
    g.children.at(-1).rotation.z = Math.PI / 2; g.children.at(-1).scale.set(0.25, 0.8, 0.25);
    for (const x of [-0.3, 0.3]) g.add(S(H.box, dyed(c, { metalness: 0.5, roughness: 0.4 }), 0.06, 0.46, 0.52, x, 0.23, 0), S(H.ring, dyed(c, { metalness: 0.5 }), 0.26, 0.26, 1, x, 0.42, 0));
    for (const o of g.children.slice(-4)) if (o.geometry === H.ring) o.rotation.y = Math.PI / 2;
    g.add(S(H.box, gold, 0.1, 0.12, 0.04, 0, 0.36, -0.26));
    for (let i = 0; i < 9; i++) g.add(S(H.cyl, coin, 0.06, 0.012, 0.06, -0.25 + (i % 3) * 0.25 + (i * 0.37 % 0.1), 0.66 + Math.floor(i / 3) * 0.02, -0.08 + (i * 0.53 % 0.16)));
  },
  gifts(g, c) {
    [[-0.18, 0.18, 0.36, 0], [0.2, 0.15, 0.3, 1], [0.0, 0.5, 0.24, 2], [0.15, 0.1, 0.2, 3]].forEach(([x, y, s, i]) => {
      const z = i === 3 ? -0.25 : 0, m = i % 2 ? white : dyed(c), rib = i % 2 ? dyed(c) : gold;
      const b = S(H.box, m, s, s, s, x, i === 2 ? 0.36 + s / 2 : s / 2, z); b.rotation.y = i * 0.5; g.add(b);
      const r1 = S(H.box, rib, s + 0.01, s + 0.01, 0.04, x, b.position.y, z), r2 = S(H.box, rib, 0.04, s + 0.01, s + 0.01, x, b.position.y, z);
      r1.rotation.y = r2.rotation.y = i * 0.5; g.add(r1, r2, at(mesh(G.bow, rib), x, b.position.y + s / 2 + 0.03, z));
    });
  },
  piano(g, c) {
    const m = dyed(c, { roughness: 0.35 });
    g.add(S(H.box, m, 1.5, 1.2, 0.5, 0, 0.6, 0.06), S(H.box, m, 1.5, 0.08, 0.32, 0, 0.75, -0.3), S(H.box, whiteKey, 1.36, 0.03, 0.2, 0, 0.8, -0.32));
    for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) g.add(S(H.box, blackKey, 0.035, 0.03, 0.11, -0.64 + i * 0.075, 0.82, -0.27));
    for (const x of [-0.68, 0.68]) g.add(S(H.box, m, 0.08, 0.7, 0.08, x, 0.35, -0.4));
    g.add(S(H.box, wood, 0.6, 0.4, 0.02, 0, 1.0, -0.2), S(H.box, gold, 0.06, 0.06, 0.06, 0.55, 1.23, 0.1));
    g.children.at(-2).rotation.x = -0.25;
    g.add(S(H.cyl, dyed('white'), 0.03, 0.16, 0.03, -0.55, 1.28, 0.1)); flames(g, [[-0.55, 1.4, 0.1]]);
  },
  band(g, c) {
    g.add(S(H.cyl, wood, 0.8, 0.18, 0.8, 0, 0.09, 0), S(H.cyl, dyed(c), 0.82, 0.12, 0.82, 0, 0.12, 0));
    const drum = S(H.cyl, dyed(c), 0.26, 0.4, 0.26, -0.25, 0.45, 0.1); drum.rotation.x = Math.PI / 2; g.add(drum);
    g.add(S(H.cyl, white, 0.25, 0.02, 0.25, -0.25, 0.45, -0.11)); g.children.at(-1).rotation.x = Math.PI / 2;
    g.add(S(H.cyl, iron, 0.015, 0.9, 0.015, 0.35, 0.63, 0.25), S(H.cyl, gold, 0.18, 0.01, 0.18, 0.35, 1.08, 0.25));
    g.add(S(H.cyl, iron, 0.015, 0.9, 0.015, 0.3, 0.63, -0.35), S(H.box, white, 0.32, 0.22, 0.02, 0.3, 1.1, -0.35));
    g.children.at(-1).rotation.x = 0.4;
    // A fiddle, propped on a stool.
    g.add(S(H.cyl, darkWood, 0.12, 0.35, 0.12, 0.05, 0.36, 0.35), S(H.ball, wood, 0.09, 0.14, 0.04, 0.05, 0.66, 0.35));
  },
  cannon(g, c) {
    const m = dyed(c, { metalness: 0.6, roughness: 0.4 });
    g.add(S(H.box, wood, 0.5, 0.28, 0.9, 0, 0.3, 0.12));
    for (const x of [-0.3, 0.3]) for (const z of [-0.2, 0.42]) { const w = S(H.cyl, darkWood, 0.17, 0.08, 0.17, x, 0.17, z); w.rotation.z = Math.PI / 2; g.add(w); }
    const barrel = S(H.cyl, m, 0.13, 1.3, 0.13, 0, 0.55, -0.15); barrel.rotation.x = Math.PI / 2 - 0.12; g.add(barrel);
    g.add(S(H.ball, m, 0.16, 0.16, 0.16, 0, 0.62, 0.5), S(H.cyl, m, 0.17, 0.1, 0.17, 0, 0.47, -0.78));
    g.children.at(-1).rotation.x = Math.PI / 2 - 0.12;
    for (const [x, z] of [[0.25, 0.75], [0.4, 0.62], [0.33, 0.9]]) g.add(S(H.ball, iron, 0.09, 0.09, 0.09, x, 0.09, z));
  },
  anchor(g, c) {
    const m = dyed(c, { metalness: 0.5, roughness: 0.45 });
    g.add(S(H.box, stone, 0.6, 0.12, 0.3, 0, 0.06, 0), S(H.cyl, m, 0.05, 1.3, 0.05, 0, 0.8, 0), S(H.ring, m, 0.13, 0.13, 1.6, 0, 1.55, 0), S(H.box, darkWood, 0.8, 0.07, 0.07, 0, 1.3, 0));
    const arm = S(H.arc, m, 0.42, 0.42, 1.4, 0, 0.55, 0); arm.rotation.z = Math.PI; g.add(arm);
    for (const s of [-1, 1]) { const f = S(H.cone, m, 0.08, 0.2, 0.04, s * 0.42, 0.62, 0); f.rotation.z = s * -0.5; g.add(f); }
  },
  skulls(g, c) {
    const m = dyed(c, { roughness: 0.7 });
    [[0, 0.12, 0, 0], [0.22, 0.12, 0.05, 0.5], [-0.2, 0.12, 0.08, -0.4], [0.05, 0.12, 0.24, 0.2], [0.02, 0.33, 0.08, 0.1]].forEach(([x, y, z, a]) => {
      const s = new THREE.Group();
      s.add(at(mesh(H.skull, m), 0, 0, 0), S(H.box, m, 0.12, 0.06, 0.1, 0, -0.1, -0.04));
      for (const ex of [-0.045, 0.045]) s.add(S(H.ball, blackKey, 0.03, 0.035, 0.02, ex, 0.0, -0.1, false));
      s.position.set(x, y, z); s.rotation.y = a; g.add(s);
    });
    g.add(S(H.cyl, white, 0.025, 0.14, 0.025, 0.02, 0.52, 0.08)); flames(g, [[0.02, 0.62, 0.08]]);
  },
};
/** Those with a wreck of their own (the last wedding's, as you find them in Dark humour). */
const WRECKS = new Set(['bench', 'arch', 'flowers', 'banner', 'barrel', 'table', 'cake']);

const BUILD = {
  bench(g, c, w) {
    const b = new THREE.Group();
    b.add(at(mesh(G.seat, wood), 0, 0.45, 0), at(mesh(G.back, wood), 0, 0.75, 0.2));
    for (const x of [-0.95, 0.95]) for (const z of [-0.15, 0.15]) b.add(at(mesh(G.leg, darkWood), x, 0.22, z));
    // A sash of the colour over each end, and a bow.
    for (const x of [-1.04, 1.04]) { b.add(at(mesh(G.sash, dyed(c)), x, 0.5, 0)); b.add(at(mesh(G.bow, dyed(c)), x, 0.62, -0.22)); }
    if (w) { b.rotation.x = Math.PI / 2; b.position.set(0, 0.24, -0.4); }   // (overturned, on its back)
    g.add(b);
  },
  arch(g, c, w) {
    const a = new THREE.Group();
    const L = at(mesh(G.post, darkWood), -1.1, 1.2, 0), R = at(mesh(G.post, darkWood), 1.1, 1.2, 0), hoop = at(mesh(G.hoop, darkWood), 0, 2.4, 0);
    a.add(L, R, hoop);
    const blooms = new THREE.Group();
    for (let i = 0; i <= 14; i++) {
      const t = i / 14 * Math.PI, m = mesh(G.bloom, i % 3 === 2 ? white : dyed(c));
      blooms.add(at(m, Math.cos(t) * 1.1, 2.4 + Math.sin(t) * 1.1, 0.04));
      if (i % 2) blooms.add(at(mesh(G.small, leaf), Math.cos(t) * 1.18, 2.4 + Math.sin(t) * 1.18, -0.05));
    }
    for (const x of [-1.1, 1.1]) for (let y = 0.5; y < 2.4; y += 0.45) blooms.add(at(mesh(G.small, dyed(c)), x + (y * 7 % 2 > 1 ? 0.06 : -0.06), y, 0.07));
    if (w) {
      // Snapped: one post down at an angle, the top fallen off onto the ground, flowers strewn.
      R.rotation.z = 0.9; R.position.set(1.5, 0.75, 0.2);
      hoop.rotation.set(-Math.PI / 2, 0, 0.4); hoop.position.set(0.4, 0.1, 0.9);
      blooms.children.forEach((m, i) => { m.position.set(-1.6 + (i * 0.37) % 3.4, 0.08, 0.3 + (i * 0.53) % 1.4); });
    }
    a.add(blooms);
    g.add(a);
  },
  flowers(g, c, w) {
    const f = new THREE.Group();
    f.add(at(mesh(G.pot, pot), 0, 0.16, 0), at(mesh(G.bush, leaf), 0, 0.3, 0));
    for (let i = 0; i < 7; i++) { const t = i / 7 * Math.PI * 2, r = i ? 0.15 : 0; f.add(at(mesh(G.bloom, i % 4 === 3 ? white : dyed(c)), Math.cos(t) * r, 0.44 + (i ? 0 : 0.06), Math.sin(t) * r)); }
    if (w) { f.rotation.z = Math.PI / 2; f.position.y = 0.2; }
    g.add(f);
  },
  banner(g, c, w) {
    const L = at(mesh(G.pole, darkWood), -0.7, 1.1, 0), R = at(mesh(G.pole, darkWood), 0.7, 1.1, 0);
    const cloth = at(mesh(G.cloth, bannerMat(c)), 0, 1.68, 0);
    g.add(L, R, cloth, at(mesh(G.knob, gold), -0.7, 2.22, 0), at(mesh(G.knob, gold), 0.7, 2.22, 0));
    if (w) {   // torn: hanging off one pole by a corner, the other pole leaning
      cloth.scale.set(0.62, 0.8, 1); cloth.rotation.z = 0.75; cloth.position.set(-0.55, 1.45, 0.02);
      R.rotation.z = -0.35; R.position.x = 0.95;
      g.children.at(-1).position.set(1.35, 2.1, 0);
    }
  },
  barrel(g, c, w) {
    const b = new THREE.Group();
    b.add(at(mesh(G.barrel, wood), 0, 0.375, 0));
    for (const y of [0.12, 0.63]) { const h = at(mesh(G.ring, dyed(c, { metalness: 0.4 })), 0, y, 0); h.rotation.x = Math.PI / 2; b.add(h); }
    if (w) { b.rotation.z = Math.PI / 2; b.position.set(0.37, 0.34, 0); }
    g.add(b);
  },
  table(g, c, w) {
    const t = new THREE.Group();
    t.add(at(mesh(G.top, wood), 0, 0.75, 0), at(mesh(G.stem, darkWood), 0, 0.37, 0), at(mesh(G.skirt, dyed(c, { side: THREE.DoubleSide })), 0, 0.46, 0));
    if (w) { t.rotation.x = 1.4; t.position.set(0, 0.5, 0.2); }
    g.add(t);
  },
  lantern(g, c) {
    const glass = new THREE.MeshStandardMaterial({ color: dyeHex(c), emissive: dyeHex(c), emissiveIntensity: 1.4 });
    g.add(at(mesh(G.lpost, iron), 0, 0.8, 0), at(mesh(G.glass, glass, false), 0, 1.72, 0), at(mesh(G.lid, iron), 0, 1.89, 0));
  },
  candles(g, c) {
    g.add(at(mesh(G.plate, gold), 0, 0.02, 0));
    [[0, 0, 0.5], [0.11, 0.07, 0.36], [-0.1, 0.08, 0.28], [0.02, -0.11, 0.22]].forEach(([x, z, h], i) => {
      const m = at(mesh(G.candle, i % 2 ? white : dyed(c)), x, 0.04 + h / 2, z);
      m.scale.y = h;
      g.add(m, at(mesh(G.flame, flame, false), x, 0.08 + h, z));
    });
  },
  cake(g, c, w) {
    const k = new THREE.Group();
    let y = 0;
    G.tier.forEach((t, i) => {
      const h = t.parameters.height;
      k.add(at(mesh(t, white), 0, y + h / 2, 0), at(mesh(G.band[i], dyed(c)), 0, y + 0.04, 0));
      y += h;
    });
    const top = at(mesh(G.heart, dyed(c)), 0, y + 0.04, -0.015);
    k.add(top);
    if (w) { k.scale.set(1.5, 0.22, 1.5); k.rotation.z = 0.2; g.add(at(mesh(G.splat, splatMat(c), false), 0, 0.015, 0)); g.children.at(-1).rotation.x = -Math.PI / 2; }
    g.add(k);
    g.userData.cake = k;
  },
  splat(g, c) {
    const s = mesh(G.splat, splatMat(c), false);
    s.rotation.x = -Math.PI / 2;
    s.position.y = 0.012;
    g.add(s);
  },
  ...MORE,
};
/** A prop (src/den-wedding.ts's Prop), drawn: a group at its place, turned its way. Wrecked, one that
    hasn't a wreck of its own is knocked over. */
export function propMesh(p) {
  const g = new THREE.Group();
  if (p.w && !WRECKS.has(p.k)) {
    const tip = new THREE.Group();
    (BUILD[p.k] || BUILD.barrel)(tip, p.c, false);
    tip.rotation.z = Math.PI / 2 * 0.92; tip.position.set(0.3, 0.25, 0);
    g.add(tip);
  } else (BUILD[p.k] || BUILD.barrel)(g, p.c, !!p.w);
  g.position.set(p.x, 0, p.z);
  g.rotation.y = p.r * Math.PI / 4;
  return g;
}
/** A little heart, for the kiss (its own material, to fade). */
export function heartMesh(c = 'red') {
  const m = new THREE.Mesh(G.heart, new THREE.MeshBasicMaterial({ color: dyeHex(c), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  m.scale.setScalar(2.2);
  return m;
}
/** A bouquet, for a hand that hasn't one from the wardrobe. */
export function bouquetMesh(c = 'rose') {
  const g = new THREE.Group();
  g.add(at(mesh(G.stem, leaf), 0, -0.08, 0));
  g.children[0].scale.set(0.5, 0.25, 0.5);
  for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2; g.add(at(mesh(G.small, i % 3 ? dyed(c) : white), Math.cos(t) * 0.07, 0.06, Math.sin(t) * 0.07)); }
  g.add(at(mesh(G.small, dyed(c)), 0, 0.1, 0));
  return g;
}
