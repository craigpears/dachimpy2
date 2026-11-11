// Mischievious's isle on the sloop's sea (src/den-isle.ts; its squares LAY.ISLE in src/den-sail.ts),
// where her wedding is (wedding.js). The user (11 Nov): "on an island somewhere ... islands can all
// have their own little thing out there". In plain sight off to the right of the lanes: sand and
// palms, her chapel's ruin up on a rise at the back (wedding-scene.js's own, smaller), a little
// jetty out from its left-hand shore with her flag at its foot, bunting strung from it, and the water
// off it a little lighter, shallows, so you can see where to bring her in. Sail up off the jetty and
// Space puts you ashore, at the wedding; leaving it, you're back aboard her there.
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { isleAt, canLandIsle, isleMooring, isleShore } from '../den-isle.js';
import { scene, mat, mesh, canvasTex, woodTex, flagpole, keys } from './world.js';
import { torch } from './land.js';
import { sail, seaX, seaZ } from './sea.js';
import { gunneryReset } from './sea-guns.js';
import { palm, chapel } from './wedding-scene.js';
import { weddingEnter } from './wedding.js';

const CELL = SAIL.CELL, I = LAY.ISLE;
const ex = (c) => SAIL.X0 + c * CELL, ez = (r) => SAIL.Z0 - r * CELL;   // (a square's edges: c, r whole)
export const isle = { g: null, bunting: [] };

/* An island's shore (src/den-isle.ts: isleShore, round the edge of its land squares, all but the
   jetty's; or any island's, shoreOf), smoothed into a curve and drawn in a little, so it reads as a
   sandy island, not a block. Kikkit's island uses it too (whirlpools.js). */
export function outline(inset, shore = isleShore()) {
  const pts = shore.map(([c, r]) => new THREE.Vector3(ex(c), 0, ez(r)));
  // (each corner's midpoints, so the curve keeps to the squares rather than ballooning out)
  const mids = pts.flatMap((p, i) => [p.clone().lerp(pts[(i + 1) % pts.length], 0.25), p.clone().lerp(pts[(i + 1) % pts.length], 0.75)]);
  const curve = new THREE.CatmullRomCurve3(mids, true, 'centripetal');
  const mid = mids.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / mids.length);
  return curve.getSpacedPoints(90).slice(0, -1).map((p) => { const d = p.clone().sub(mid), l = d.length(); return mid.clone().add(d.multiplyScalar(Math.max(0, l - inset) / l)); });
}
export function slab(pts, y0, h, m) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.5, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2);
  const o = mesh(geo, m);
  o.position.y = y0;
  return o;
}

// Her flag: rose pink, a white heart on it.
const herFlag = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(200, 128, (g, w, h) => {
  g.fillStyle = '#d14a8b'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff4f8';
  g.beginPath(); g.moveTo(100, 100); g.bezierCurveTo(40, 60, 62, 18, 100, 44); g.bezierCurveTo(138, 18, 160, 60, 100, 100); g.fill();
}) });
const BUNT = ['#e8467c', '#ffd23a', '#ffffff', '#59b8e6', '#f08ac0'].map((c) => mat(c, { side: THREE.DoubleSide, roughness: 0.8 }));

function build() {
  const g = new THREE.Group();
  const sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 }), grass = mat('#6f9a4a', { roughness: 1 });
  // The sand, a wet rim round it at the water's edge, and grass on its back.
  g.add(slab(outline(0.5), -0.55, 0.45, wet), slab(outline(1.1), -0.4, 0.62, sand));
  const back = outline(3.2).map((p) => p.clone().add(new THREE.Vector3(1.2, 0, -1.2)));
  g.add(slab(back, -0.2, 0.5, grass));
  // Her chapel's ruin up on its rise at the back of the isle (the wedding's own, smaller).
  const ch = chapel();
  ch.scale.setScalar(0.34);
  ch.position.set(seaX(19) + 1.2, 2.8, seaZ(11.9));
  ch.rotation.y = -Math.PI / 4;   // (its open end and its aisle toward the jetty and the den)
  g.add(ch);
  // Palms round the sand.
  for (const [c, r, h, l] of [[17.1, 9.3, 4.2, 0.3], [18.6, 9.1, 3.6, -0.25], [17.2, 12.4, 4.4, -0.3], [20.4, 10.3, 3.8, 0.35], [18.3, 13.2, 3.5, 0.2], [20.3, 12.6, 4, -0.2], [17.6, 10.9, 3.2, 0.4]]) {
    const p = palm(h, l);
    p.scale.setScalar(0.8);
    p.position.set(seaX(c), 0.2, seaZ(r));
    p.rotation.y = c * 2.1 + r;
    g.add(p);
  }
  // The jetty: out from the sand along the near side of its square, to where she lies alongside it.
  const wood = mat('#6a5038', { map: woodTex }), plank = mat('#9a7a55', { map: woodTex });
  const JZ = ez(I.MOOR.r) + 0.6, J0 = ex(I.JETTY[0] + 1) + 2, J1 = ex(I.JETTY[0]) + 0.5, DECK = 0.35, JW = 1.3;
  for (let x = J0; x > J1; x -= 0.34) {
    const b = mesh(new THREE.BoxGeometry(0.3, 0.06, JW), plank);
    b.position.set(x - 0.17, DECK, JZ + (Math.random() - 0.5) * 0.04);
    b.rotation.y = (Math.random() - 0.5) * 0.03;
    g.add(b);
  }
  for (const sz of [-1, 1]) for (let x = J1 + 0.1; x <= J0 - 1.5; x += 1.2) {
    const p = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 7), wood);
    p.position.set(x, DECK - 0.6, JZ + sz * (JW / 2 - 0.05));
    g.add(p);
  }
  const bollard = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.4, 10), mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 }));
  bollard.position.set(J1 + 0.6, DECK + 0.2, JZ - 0.35);
  const lamp = torch(J1 + 0.15, JZ - JW / 2 + 0.15);
  lamp.position.y = DECK;
  g.add(bollard, lamp);
  // Her flag at the jetty's foot, flying high (clear of her, moored at its end).
  const post = mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), wood);
  post.position.set(ex(I.JETTY[0] + 1) + 0.6, DECK + 1.3, JZ + JW / 2 - 0.15);
  const fl = flagpole(1.6, herFlag);
  fl.position.set(post.position.x, DECK + 2.6, post.position.z);
  g.add(post, fl);
  // Bunting from her flag's post up to a tall pole on the sand, and on to the chapel's rise.
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), wood);
  pole.position.set(seaX(18.1), 2.1, JZ - 0.2);
  const top = mesh(new THREE.CylinderGeometry(0.07, 0.09, 2, 8), wood);
  top.position.set(seaX(18.9), 3.6, seaZ(11.3));
  g.add(pole, top);
  const strung = [[post.position.x, DECK + 2.5, post.position.z], [pole.position.x, 4.1, pole.position.z], [top.position.x, 4.55, top.position.z]].map((p) => new THREE.Vector3(...p));
  const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.17, 0, 0), new THREE.Vector3(0.17, 0, 0), new THREE.Vector3(0, -0.42, 0)]);
  tri.computeVertexNormals();
  const line = mat('#efe6d0');
  for (let i = 0; i + 1 < strung.length; i++) {
    const a = strung[i], b = strung[i + 1], len = a.distanceTo(b), n = Math.floor(len / 0.5);
    const sag = (u) => -Math.sin(u * Math.PI) * len * 0.07;
    const pts = Array.from({ length: n + 1 }, (_, k) => a.clone().lerp(b, k / n).add(new THREE.Vector3(0, sag(k / n), 0)));
    const rope = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.018, 4), line, false);
    g.add(rope);
    for (let k = 1; k < n; k++) {
      const f = mesh(tri, BUNT[(k + i * 3) % BUNT.length], false);
      f.position.copy(pts[k]);
      f.rotation.order = 'YXZ';   // (square across the line, swinging about it)
      f.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      f.userData.ph = k * 0.9 + i * 3;
      g.add(f);
      isle.bunting.push(f);
    }
  }
  // The shallows off its jetty: the landing, a little lighter and greener (as off the den's beach).
  const L = I.LANDING, lw = (L.c1 - L.c0 + 1) * CELL, ld = (L.r1 - L.r0 + 1) * CELL;
  const fadeTex = canvasTex(64, 64, (x, w, h) => {
    const img = x.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let k = 0; k < w; k++) {
      const a = Math.round(255 * Math.min(1, Math.min(y, h - 1 - y) / (h * 0.2)) * Math.min(1, k / (w * 0.5))), i = (y * w + k) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = a; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  });
  const shallows = mesh(new THREE.PlaneGeometry(lw, ld), new THREE.MeshBasicMaterial({ color: '#8fe3d2', transparent: true, opacity: 0.3, alphaMap: fadeTex, depthWrite: false }), false);
  shallows.rotation.x = -Math.PI / 2;   // (the texture's right-hand side toward the isle)
  shallows.position.set(ex(L.c0) + lw / 2, 0.052, ez(L.r0) - ld / 2);
  shallows.renderOrder = 2;
  g.add(shallows);
  scene.add(g);
  return g;
}

/** Built the first time the sea's drawn (sailing.js), seen from the den's beach too. */
export function isleWorld() { isle.g ||= build(); }
/** Each frame: the bunting fluttering. */
export function isleTick() {
  if (!isle.g) return;
  const t = performance.now() / 1000;
  for (const f of isle.bunting) f.rotation.x = Math.sin(t * 2.2 + f.userData.ph) * 0.3;
}

/** Off her isle's jetty, Space: she's brought in alongside it and made fast, and you go ashore, to
    the wedding. She waits there; leaving the wedding, you're back aboard (wedding.js). */
export function isleAshore() {
  gunneryReset();
  if (sail.helm.oars) sail.helm.row(false);
  sail.helm.moor(isleMooring());
  keys.clear();
  weddingEnter({ bySea: true });
}
export { canLandIsle, isleAt };
