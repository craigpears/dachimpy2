// A ship's hull, the shape every hull in the den is drawn from: the raiders' ship and rowboats, the
// sloop, the checkpoint's hulk, the wedding's barge, a war frigate. Two ways: hullGeo, the plain
// prism (a deck, a barge, the older hulls); and a curved hull, as Puzzle Pirates draws its ships (the
// user, 11 Nov: "is it intentional with the style that it really is such a square back? ... I'd like
// to see it maybe with a bit more curves"): her stern rounded in, her bow fuller, her sides falling
// in above the water in a gentle slant (11 Nov: "it needs a tiny bit of a slant") and rounding under
// below it, her deck line rising toward bow and stern. Its numbers are her Hull's shape (src/ships.ts,
// HullShape), and anything built on her measures her with widthAt there; here it's drawn: swept round her (sweepGeo), her decks (outlinePts), a bulkhead
// across her (sectionGeo), and where on her side a thing sits and which way it faces (skinFrame,
// sternFrame). The sloop (js/den/sloop.js) and a war frigate (js/den/frigate.js) are built from it.
import * as THREE from 'three';
import { halfBeam, widthAt, sideY, stemX, bowAt } from '../ships.js';

// A hull seen from above (bow to +x), stood up: `len` long, `beam` wide, `deep` from keel to deck.
export function hullGeo(len, beam, deep, bow = 0.22) {
  const sh = new THREE.Shape(), l = len / 2, b = beam / 2;
  sh.moveTo(-l, -b * 0.85); sh.lineTo(l - len * bow, -b);
  sh.quadraticCurveTo(l, -b * 0.6, l + len * 0.04, 0);
  sh.quadraticCurveTo(l, b * 0.6, l - len * bow, b);
  sh.lineTo(-l, b * 0.85); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: deep, bevelEnabled: false }).rotateX(-Math.PI / 2);
}

// ----- a curved hull: `h` a Hull from src/ships.ts, her bow toward +x, her waterline at y 0 -----

/** Stations along her from x0 to x1 (both included), close together where she curves: round her
    stern and her bow. */
export function stations(h, x0 = -Infinity, x1 = Infinity) {
  const l = h.len / 2, tip = stemX(h), xb = l - h.len * h.bow, s = (h.shape?.stern ?? 0) * h.len, p = h.shape?.square ?? 2;
  const xs = [];
  // (round the stern, evenly round its superellipse; then along her side; then round the bow's curve)
  if (s > 0) for (let i = 0; i < 16; i++) xs.push(-l + s - s * Math.pow(Math.cos(i / 16 * Math.PI / 2), 2 / p));
  const a = -l + s, n = Math.max(4, Math.ceil((xb - a) / (h.len / 28)));
  for (let i = 0; i < n; i++) xs.push(a + (xb - a) * i / n);
  for (let i = 0; i <= 20; i++) xs.push(bowAt(h, i / 20)[0]);
  const lo = Math.max(-l, x0), hi = Math.min(tip, x1);
  return [lo, ...xs.filter((x) => x > lo + 1e-4 && x < hi - 1e-4), hi];
}

/** Her outline at `Y` above the water, from x0 to x1, `inset` in from her side: a closed run of
    [x, z], up her starboard side and back down port (for a deck). */
export function outlinePts(h, Y, x0 = -Infinity, x1 = Infinity, inset = 0) {
  const stb = stations(h, x0, x1).map((x) => [x, widthAt(h, x, Y) - inset]).filter(([, z]) => z > 0.005);
  return [...stb, ...stb.slice().reverse().map(([x, z]) => [x, -z])];
}
/** A deck: her outline at Y, `inset` in, `thick` deep (its top at Y + thick). */
export function deckGeo(h, Y, x0, x1, inset = 0.02, thick = 0.02) {
  const shape = new THREE.Shape(outlinePts(h, Y, x0, x1, inset).map(([x, z]) => new THREE.Vector2(x, -z)));
  return new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 2 }).rotateX(-Math.PI / 2).translate(0, Y, 0);
}

// The runs of her side a sweep goes along, from x0 to x1: each a list of { x, sd } (sd: +1 her
// starboard side, -1 port), oriented the same way round her (starboard toward the bow, port toward
// the stern), so a run's outward side is always on its left.
function runs(h, x0, x1) {
  const l = h.len / 2, tip = stemX(h), xs = stations(h, x0, x1);
  const aft = x0 <= -l + 1e-6, fore = x1 >= tip - 1e-6, round = halfBeam(h, -l) < 1e-6;
  const stb = xs.map((x) => ({ x, sd: 1 })), port = xs.slice().reverse().map((x) => ({ x, sd: -1 }));
  const transom = [{ x: -l, sd: -1 }, { x: -l, sd: 1 }];
  if (aft && fore) return round ? { loop: true, runs: [[...stb, ...port.slice(1, -1)]] } : { runs: [[...stb, ...port.slice(1)], transom] };
  if (aft) return { runs: round ? [[...port, ...stb.slice(1)]] : [port, transom, stb] };
  if (fore) return { runs: [[...stb, ...port.slice(1)]] };
  return { runs: [stb, port] };
}
const heightOf = (h, x, y) => (typeof y === 'function' ? y(x) : sideY(h, x, y));

/** A band of her skin swept round her from x0 to x1. `faces`: its cross-section, each face a run of
    [y, out] (y, a height on her side as her shape has it, her sheer lifting it; or a function of x
    for a height above the water, such as a level deck's; out, how far proud of her side, - in),
    each face shaded on its own (sharp between them). `closed`: the faces go round a solid (a rail, a
    bulwark), its cut ends capped. The faces' outward side: on the left as they run (up her outside,
    in across a top, down an inside). */
export function sweepGeo(h, faces, { x0 = -Infinity, x1 = Infinity, closed = false } = {}) {
  const pos = [], uv = [], idx = [], { loop, runs: rs } = runs(h, x0, x1);
  const cap = [];
  for (const run of rs) {
    if (run.length < 2) continue;
    // Each row of every face: its points round the run, with the plan's outward normal at each.
    const rowsOf = (y, out) => {
      const base = run.map(({ x, sd }) => { const Y = heightOf(h, x, y); return [x, Y, sd * widthAt(h, x, Y)]; });
      const n = base.length;
      return base.map((p, i) => {
        const a = base[loop ? (i - 1 + n) % n : Math.max(0, i - 1)], b = base[loop ? (i + 1) % n : Math.min(n - 1, i + 1)];
        let tx = b[0] - a[0], tz = b[2] - a[2], d = Math.hypot(tx, tz);
        if (d < 1e-9) { tx = run[i].sd > 0 ? 1 : -1; tz = 0; d = 1; }
        return [p[0] - tz / d * out, p[1], p[2] + tx / d * out];
      });
    };
    for (const face of faces) {
      const rows = face.map(([y, out]) => rowsOf(y, out)), start = pos.length / 3, n = run.length;
      rows.forEach((row) => {
        let u = 0;
        row.forEach((p, i) => { if (i) u += Math.hypot(p[0] - row[i - 1][0], p[2] - row[i - 1][2]); pos.push(...p); uv.push(u, p[1]); });
      });
      const at = (r, c) => start + r * n + (c % n);
      for (let r = 0; r + 1 < rows.length; r++) for (let c = 0; c < (loop ? n : n - 1); c++) {
        idx.push(at(r, c), at(r, c + 1), at(r + 1, c + 1), at(r, c), at(r + 1, c + 1), at(r + 1, c));
      }
    }
    // Capping a cut end of a solid: its cross-section there, facing out along her.
    if (closed && !loop) for (const end of [0, run.length - 1]) {
      const p = run[end], q = run[end ? end - 1 : 1];
      if (Math.abs(p.x - q.x) < 1e-9) continue;   // (the transom's ends: her sides carry on round)
      const ring = [];
      for (const face of faces) for (const [y, out] of face) {
        const Y = heightOf(h, p.x, y), z = p.sd * (widthAt(h, p.x, Y) + out);
        if (!ring.length || Math.hypot(ring.at(-1)[1] - Y, ring.at(-1)[2] - z) > 1e-6) ring.push([p.x, Y, z]);
      }
      if (ring.length > 2 && Math.hypot(ring[0][1] - ring.at(-1)[1], ring[0][2] - ring.at(-1)[2]) < 1e-6) ring.pop();
      if (ring.length < 3) continue;
      const tris = THREE.ShapeUtils.triangulateShape(ring.map(([, Y, z]) => new THREE.Vector2(z, Y)), []);
      const want = Math.sign(p.x - q.x), start = pos.length / 3;
      for (const r of ring) { pos.push(...r); uv.push(r[2], r[1]); }
      for (const [a, b, c] of tris) {
        // (which way round: its normal's x, (B-A)×(C-A), should point out along her, away from the run)
        const A = ring[a], B = ring[b], C = ring[c];
        const nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
        cap.push(...(Math.sign(nx) === want ? [start + a, start + b, start + c] : [start + a, start + c, start + b]));
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  if (!cap.length) return geo;
  // (the caps flat-shaded, apart from her curved faces)
  const flat = new THREE.BufferGeometry();
  flat.setAttribute('position', geo.attributes.position); flat.setAttribute('uv', geo.attributes.uv); flat.setIndex(cap);
  const capped = flat.toNonIndexed(); capped.computeVertexNormals();
  const curved = geo.toNonIndexed();
  return mergeTwo(curved, capped);
}
function mergeTwo(a, b) {
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) {
    const A = a.attributes[k], B = b.attributes[k], arr = new Float32Array(A.array.length + B.array.length);
    arr.set(A.array, 0); arr.set(B.array, A.array.length);
    out.setAttribute(k, new THREE.BufferAttribute(arr, A.itemSize));
  }
  return out;
}

/** A run of `n` rows of [y, out] up her side from y0 to y1 (heights as her shape has them). */
export const rise = (y0, y1, out = 0, n = 4) => Array.from({ length: n + 1 }, (_, i) => [y0 + (y1 - y0) * i / n, out]);
/** Her bottom: rows from her keel up to the waterline, closest together where it curves. */
export function bilgeRows(h, n = 10) {
  const dr = h.deep - h.deck, q = h.shape?.bilge || 0;
  if (!q) return [[-dr, 0], [0, 0]];
  return Array.from({ length: n + 1 }, (_, i) => [-dr * Math.pow(Math.cos(i / n * Math.PI / 2), 2 / q), 0]);
}

/** Her cross-section at `x`, from y0 to y1 above the water (numbers, or functions of x), facing
    `facing` (+1 toward her bow, -1 her stern): a bulkhead across her. */
export function sectionGeo(h, x, y0, y1, facing = 1, n = 6) {
  const Y0 = typeof y0 === 'function' ? y0(x) : y0, Y1 = typeof y1 === 'function' ? y1(x) : y1;
  const ys = Array.from({ length: n + 1 }, (_, i) => Y0 + (Y1 - Y0) * i / n);
  const pts = [...ys.map((Y) => [widthAt(h, x, Y), Y]), ...ys.slice().reverse().map((Y) => [-widthAt(h, x, Y), Y])];
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([z, Y]) => new THREE.Vector2(-facing * z, Y))));
  return geo.rotateY(facing * Math.PI / 2).translate(x, 0, 0);
}

const V = (x, y, z) => new THREE.Vector3(x, y, z), UP = V(0, 1, 0);
function frame(p, n) {
  const z = n.normalize(), y = UP.clone().addScaledVector(z, -UP.dot(z)).normalize(), x = new THREE.Vector3().crossVectors(y, z);
  return { pos: p, quat: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)), normal: z };
}
/** Where on her side (`sd` +1 starboard, -1 port) at `x` along her and `Y` above the water a thing
    sits `out` proud of it, and which way it faces (its +z straight out of her side, its +y up her
    side): { pos, quat, normal }. */
export function skinFrame(h, x, Y, sd, out = 0) {
  const e = 0.01, P = (x, Y) => V(x, Y, sd * widthAt(h, x, Y));
  const dx = P(x + e, Y).sub(P(x - e, Y)), dy = P(x, Y + e).sub(P(x, Y - e));
  const n = sd > 0 ? dx.cross(dy) : dy.cross(dx);
  if (n.lengthSq() < 1e-12) n.set(0, 0, sd);
  n.normalize();
  return frame(P(x, Y).addScaledVector(n, out), n);
}
/** Where on her stern a thing sits, `z` across her and `Y` above the water, `out` proud of it, and
    which way it faces (as skinFrame). Her stern's curve, found by halving: where her side is z out. */
export function sternX(h, z, Y) {
  const l = h.len / 2, s = Math.max(1e-3, (h.shape?.stern ?? 0) * h.len);
  let a = -l, b = -l + s;
  if (widthAt(h, a, Y) >= Math.abs(z)) return a;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (widthAt(h, m, Y) < Math.abs(z)) a = m; else b = m; }
  return (a + b) / 2;
}
export function sternFrame(h, z, Y, out = 0) {
  const e = 0.01, P = (z, Y) => V(sternX(h, z, Y), Y, z);
  const dz = P(z + e, Y).sub(P(z - e, Y)), dy = P(z, Y + e).sub(P(z, Y - e));
  const n = dz.cross(dy);
  if (n.x > 0) n.negate();
  if (n.lengthSq() < 1e-12) n.set(-1, 0, 0);
  n.normalize();
  return frame(P(z, Y).addScaledVector(n, out), n);
}
/** Puts `obj` where `f` (skinFrame, sternFrame) says. Returns it. */
export function placeOn(obj, f) { obj.position.copy(f.pos); obj.quaternion.copy(f.quat); return obj; }
