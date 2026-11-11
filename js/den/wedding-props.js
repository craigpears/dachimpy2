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
};
/** A prop (src/den-wedding.ts's Prop), drawn: a group at its place, turned its way. */
export function propMesh(p) {
  const g = new THREE.Group();
  (BUILD[p.k] || BUILD.barrel)(g, p.c, !!p.w);
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
