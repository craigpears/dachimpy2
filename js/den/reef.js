// A reef on the sloop's sea, in 3D: a plain line of rocks, square after square, with surf breaking
// along it, so it reads from afar as a barrier you can't sail through. The user (11 Nov), of the
// checkpoint's reef beside Kikkit's whirlpools: "there definitely needs to be a much more visible line
// of rocks. Like, this is supposed to be a secret way round. It's literally right next to it." So the
// reef is drawn whole, out to the sea's edge, and the whirlpools' gap is the one way through it.
//
// Knows nothing of whose reef: given its squares (src/den-sail.ts, Sea.reef: the checkpoint's reef and
// the rocks round Kikkit's whirlpools) and where a square is in the world, it lays them. Cheap to draw:
// each square's rocks are one merged mesh (one draw call a square, a few dozen for the whole reef), in
// the sea's own rock colours and look (land.js's rock: flat-shaded dodecahedra), and the surf one mesh
// for the lot. Each square's mesh is handed back so a shot can shake it, as any rock's (sailing.js).
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { mat, mesh, canvasTex } from './world.js';
import { ROCK_COLOURS } from './land.js';

const ROCK = new THREE.DodecahedronGeometry(1, 0);
const rockM = mat('#ffffff', { flatShading: true, vertexColors: true, roughness: 0.95 });
// (read when first drawn: land.js is still loading when this module is)
let PALETTE = null;

/** Rocks merged into one geometry: each [x, y, z, size, tall], about the origin, a colour of the
    rocks' own each, tumbled at random. */
function rocksGeo(list) {
  PALETTE ||= ROCK_COLOURS.map((c) => new THREE.Color(c));
  const src = ROCK.index ? ROCK.toNonIndexed() : ROCK, P = src.attributes.position, N = src.attributes.normal, n = P.count;
  const pos = new Float32Array(list.length * n * 3), nor = new Float32Array(list.length * n * 3), col = new Float32Array(list.length * n * 3);
  const m = new THREE.Matrix4(), turn = new THREE.Matrix4(), size = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), e = new THREE.Euler();
  list.forEach(([x, y, z, s, tall], i) => {
    // (sized, tumbled, then stretched up after the tumble, so a pinnacle stands tall)
    e.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.makeScale(1, tall, 1).multiply(turn.makeRotationFromEuler(e)).multiply(size.makeScale(s, s, s)).setPosition(x, y, z);
    nm.getNormalMatrix(m);
    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    for (let k = 0; k < n; k++) {
      const o = (i * n + k) * 3;
      v.fromBufferAttribute(P, k).applyMatrix4(m); pos.set([v.x, v.y, v.z], o);
      v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], o);
      col.set([c.r, c.g, c.b], o);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

/** A square of reef's rocks, about its middle, along `along` (0 across the sea, 1 out to sea): a row
    of big rocks the square's whole length, so they run on into the next square's; smaller ones either
    side; and a jagged pinnacle or two standing up out of it. */
function squareRocks(along) {
  const H = SAIL.CELL / 2, out = [], j = (a) => (Math.random() - 0.5) * a;
  const put = (u, w, y, s, tall) => out.push(along ? [w, y, -u, s, tall] : [u, y, w, s, tall]);
  // (two staggered rows, close enough to overlap: no water showing between them)
  for (let u = -H + 0.2; u <= H; u += 0.85) put(u + j(0.3), -0.45 + j(0.4), 0.3 + Math.random() * 0.25, 1.15 + Math.random() * 0.4, 0.9 + Math.random() * 0.5);
  for (let u = -H + 0.6; u <= H; u += 0.85) put(u + j(0.3), 0.45 + j(0.4), 0.3 + Math.random() * 0.25, 1.1 + Math.random() * 0.4, 0.9 + Math.random() * 0.5);
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) put(j(3.4), side * (1.5 + Math.random() * 0.3), 0.1, 0.55 + Math.random() * 0.35, 0.7 + Math.random() * 0.3);
  for (let i = 0, n = 1 + (Math.random() < 0.5 ? 1 : 0); i < n; i++) put(j(2.6), j(0.6), 0.9 + Math.random() * 0.3, 0.8 + Math.random() * 0.3, 1.9 + Math.random() * 0.6);
  return out;
}

/** The surf breaking along a reef: white water, thickest in the middle and frayed at its edges. */
const surfTex = canvasTex(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * w, y = h / 2 + (Math.random() - 0.5) * (Math.random() * h), r = 1.5 + Math.random() * 3.5;
    g.fillStyle = `rgba(236,246,246,${0.25 + Math.random() * 0.5 * (1 - Math.abs(y - h / 2) / (h / 2))})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
});
surfTex.wrapS = THREE.RepeatWrapping;
const surfM = new THREE.MeshBasicMaterial({ map: surfTex, transparent: true, opacity: 0.95, depthWrite: false, fog: false });

/** The reef on these squares ('c,r' keys); `at(c, r)` where a square's middle is in the world, [x, z].
    Each square's rocks run the way its neighbours on the reef lie (across the sea if it has none), so
    the line reads unbroken. Back: the group to add to the scene, and each square's mesh, by its key. */
export function reef(squares, at) {
  const g = new THREE.Group(), rocks = new Map(), surf = [];
  const has = (c, r) => squares.has(`${c},${r}`);
  for (const id of squares) {
    const [c, r] = id.split(',').map(Number), [x, z] = at(c, r);
    const across = has(c - 1, r) || has(c + 1, r), along = !across && (has(c, r - 1) || has(c, r + 1)) ? 1 : 0;
    const m = mesh(rocksGeo(squareRocks(along)), rockM);
    m.position.set(x, 0, z);
    g.add(m);
    rocks.set(id, [m]);
    // Its surf: a band the square's length, a little wider than the rocks, butting onto the next.
    const s = new THREE.PlaneGeometry(SAIL.CELL, SAIL.CELL * 1.6).rotateX(-Math.PI / 2);
    if (along) s.rotateY(Math.PI / 2);
    s.translate(x, 0.06, z);
    surf.push(s);
  }
  if (surf.length) {
    const merged = mergeFlat(surf), m = mesh(merged, surfM, false);
    m.renderOrder = 2;
    g.add(m);
  }
  return { g, rocks };
}

/** Flat planes merged into one geometry (position and uv: all the surf needs). */
function mergeFlat(list) {
  const geos = list.map((x) => (x.index ? x.toNonIndexed() : x)), n = geos.reduce((t, x) => t + x.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const x of geos) {
    pos.set(x.attributes.position.array, o * 3);
    uv.set(x.attributes.uv.array, o * 2);
    o += x.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  return g;
}
