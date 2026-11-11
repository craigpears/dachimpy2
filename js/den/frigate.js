// A war frigate, in 3D: any war frigate, built from a plan (src/den-frigate.ts: her hull by YPPedia's
// numbers against the sloop, her decks, ports, masts) and a ship's config (her name, her paints, her
// guns' look and what's on her deck). Primates Rule, Dachimpy's black and white war frigate, is the
// first (PRIMATES_RULE; the user, 11 Nov: "I want Primates Rule"). As Puzzle Pirates draws a war
// frigate (notes/primates-rule/1-top-deck.jpg): her hull painted above the water and bare wood below,
// two stripes round her and two rows of square ports, a raised quarterdeck aft (the cabin's windows in
// its sides, lanterns on its taffrail) and forecastle forward, stairs up to each, three masts with
// their crow's nests, shrouds and ratlines, a beast's head at her bow. What's on her deck is shared
// furniture (js/den/furniture.js: the skeletal cannons, gibbets, the skeleton set...), placed as the
// config says. She's baked down to a few meshes (js/den/bake.js): cheap to see at sea.
// Not yet: her people (up to 75: RULES.md, "Ships, physically proportional"), below decks, and a
// place on the sea. Looked at on its own in the unlinked frigate-test.html.
import * as THREE from 'three';
import { halfBeam } from '../ships.js';
import { WAR_FRIGATE_PLAN, deckAt, deckY, insideAt, deckGuns, portXs, mastSails } from '../den-frigate.js';
import { mat, mesh, woodTex, canvasTex } from './world.js';
import { FURNITURE } from './furniture.js';
import { bake } from './bake.js';

// Her deck's planks, running fore and aft (a hull's deck's texture is laid in metres: 4 planks to one).
const deckTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f0dcbc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    const y = i * 64, off = (i * 97) % 256;
    g.fillStyle = `rgba(120, 80, 40, ${0.05 + (i % 2) * 0.05})`; g.fillRect(0, y, w, 64);
    g.fillStyle = 'rgba(70, 40, 20, .55)'; g.fillRect(0, y, w, 3); g.fillRect(off, y, 3, 64);
  }
});
deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
const nameTex = (name, ink, ground) => canvasTex(512, 96, (g, w, h) => {
  g.fillStyle = ground; g.fillRect(0, 0, w, h);
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic 700 58px Alegreya, Georgia, serif';
  g.fillText(name, w / 2, h / 2 + 3);
});

/** A war frigate: `ship`, her config (src/den-frigate.ts, PRIMATES_RULE); `plan`, her shape. Her bow
    toward +x, her waterline at y 0, port (-z) and starboard (+z) as the sloop's. Returns { g, tick(dt),
    sails (their group: hide it to see her deck), plan, ship }. */
export function frigateMesh(ship, plan = WAR_FRIGATE_PLAN) {
  const P = plan, H = P.hull, l = H.len / 2, tip = l + H.len * 0.04, xb = l - H.len * H.bow;
  const hb = (x) => halfBeam(H, Math.min(tip, Math.max(-l, x))), slope = (x) => (hb(x + 0.01) - hb(x - 0.01)) / 0.02;
  const yW = deckY(P, 'waist'), yQ = deckY(P, 'quarter'), yF = deckY(P, 'fore'), qto = P.quarter.to, ffrom = P.fore.from;
  const bw = P.bulwark, pt = ship.paint;
  const M = {
    hull: mat(pt.hull, { roughness: 0.55 }), side: mat(pt.sideboard, { roughness: 0.6 }), rail: mat(pt.railing, { roughness: 0.6 }),
    bottom: mat(pt.bottom, { map: woodTex, roughness: 0.85 }), deck: mat(pt.deck, { map: deckTex, roughness: 0.9 }),
    spar: mat('#c08a52', { map: woodTex }), wood: mat('#7a4f2c', { map: woodTex }), dark: mat('#0d0c0f', { roughness: 0.9 }),
    glass: mat('#9db8cc', { roughness: 0.15, metalness: 0.4 }), gold: mat(pt.gold, { metalness: 0.75, roughness: 0.3 }),
    rope: mat('#cdb88e', { roughness: 1 }), lamp: new THREE.MeshBasicMaterial({ color: '#ffd27a' }),
    head: mat(ship.figurehead.col, { roughness: 0.4, metalness: 0.2 }), eye: new THREE.MeshBasicMaterial({ color: '#ffd23a' }),
    sail: mat(pt.sails, { side: THREE.DoubleSide, roughness: 0.95 }),
  };
  const g = new THREE.Group(), ticks = [];
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  const box = (w, h, d, m, x, y, z) => add(mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
  const UP = new THREE.Vector3(0, 1, 0);
  const rod = (a, b, r, m, n = 6) => {
    const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A), c = mesh(new THREE.CylinderGeometry(r, r, d.length(), n), m, n > 4);
    c.position.copy(A).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(UP, d.normalize()); g.add(c); return c;
  };

  // ----- her hull: outlines along her, as hullGeo draws her (src/ships.ts, halfBeam) -----
  const xsBetween = (x0, x1, n) => {
    const xs = []; for (let i = 0; i <= n; i++) xs.push(x0 + (x1 - x0) * i / n);
    if (x0 < xb && xb < x1) xs.push(xb);
    return xs.sort((a, b) => a - b);
  };
  /** Her outline between x0 and x1 (closed: up the starboard side, back down port), `inset` in from her side (- out). */
  const outline = (x0, x1, inset = 0) => {
    const a = x0 <= -l ? -l + inset : x0, xs = xsBetween(a, x1, 30).filter((x) => hb(x) - inset > 0.005);
    const stb = xs.map((x) => [x, hb(x) - inset]), pts = [...stb];
    if (x1 >= tip - 1e-6) pts.push([tip - inset, 0]);
    return pts.concat(stb.slice().reverse().map(([x, z]) => [x, -z]));
  };
  const shapeOf = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const prismGeo = (shape, y0, y1) => new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 2 }).rotateX(-Math.PI / 2).translate(0, y0, 0);
  const prism = (pts, y0, y1, m) => g.add(mesh(prismGeo(shapeOf(pts), y0, y1), m));
  /** A band round her whole hull, from y0 to y1, standing `out` proud of her side. */
  const ring = (y0, y1, m, out = 0.025) => { const s = shapeOf(outline(-l, tip, -out)); s.holes.push(new THREE.Path(outline(-l, tip, 0.04).map(([x, z]) => new THREE.Vector2(x, -z)))); g.add(mesh(prismGeo(s, y0, y1), m)); };
  /** A wall along one side (`sd` ±1) from x0 to x1, from zi(x) out to zo(x) from her middle. */
  const strip = (x0, x1, sd, zo, zi, y0, y1, m) => { const xs = xsBetween(x0, x1, 24); prism([...xs.map((x) => [x, sd * zo(x)]), ...xs.slice().reverse().map((x) => [x, sd * Math.max(0, zi(x))])], y0, y1, m); };

  const draught = H.deep - H.deck;
  prism(outline(-l, tip), -draught, P.bottom, M.bottom);   // (bare wood below)
  prism(outline(-l, tip), P.bottom, yW, M.hull);
  prism(outline(-l, qto), yW, yQ, M.hull);                 // the quarterdeck
  prism(outline(ffrom, tip), yW, yF, M.hull);              // the forecastle
  prism(outline(-l, qto, 0.02), yQ, yQ + 0.02, M.deck);
  prism(outline(qto, ffrom, 0.02), yW, yW + 0.02, M.deck);
  prism(outline(ffrom, tip, 0.02), yF, yF + 0.02, M.deck);
  for (const y of P.stripes.at) ring(y - P.stripes.h / 2, y + P.stripes.h / 2, M.side);
  ring(P.bottom - 0.02, P.bottom + 0.03, M.side, 0.012);   // (a fine line where the paint stops)

  // ----- bulwarks round each deck, capped with her rail -----
  const ends = tip - 0.03;
  for (const [x0, x1, y] of [[-l, qto, yQ], [qto, ffrom, yW], [ffrom, ends, yF]]) {
    for (const sd of [-1, 1]) {
      strip(x0, x1, sd, (x) => hb(x), (x) => hb(x) - bw.t, y, y + bw.h, M.hull);
      strip(x0, x1, sd, (x) => hb(x) + 0.035, (x) => hb(x) - bw.t - 0.035, y + bw.h, y + bw.h + 0.06, M.rail);
    }
  }
  const sternW = hb(-l);
  box(bw.t, bw.h, sternW * 2, M.hull, -l + bw.t / 2, yQ + bw.h / 2, 0);
  box(bw.t + 0.07, 0.06, sternW * 2 + 0.07, M.rail, -l + bw.t / 2, yQ + bw.h + 0.03, 0);
  // Her stem, up from the forecastle's rail to the bowsprit.
  rod([tip - 0.05, yW - 0.6, 0], [tip - 0.15, yF + bw.h + 0.1, 0], 0.08, M.hull, 8);

  // ----- ports: two rows a side, and one in the bulwark for each gun on deck -----
  const onSide = (x, y, sd, w, h, d, m, out = 0.012) => { const b = mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, sd * (hb(x) + out)); b.rotation.y = Math.atan2(-slope(x), sd); g.add(b); return b; };
  const port = (x, y, sd, s) => { onSide(x, y, sd, s + 0.09, s + 0.09, 0.03, M.side); onSide(x, y, sd, s, s, 0.04, M.dark, 0.02); onSide(x, y + s / 2 + 0.02, sd, s + 0.14, 0.035, 0.05, M.side, 0.025); };
  const [upper, lower] = portXs(P);
  for (const sd of [-1, 1]) {
    upper.forEach((x) => port(x, P.ports.rows[1], sd, P.ports.size));
    lower.forEach((x) => { if (x < tip - 1.2) port(x, P.ports.rows[0], sd, P.ports.size); });
  }
  const guns = deckGuns(P, ship.guns);
  for (const gun of guns) {
    const y = deckY(P, deckAt(P, gun.x)), sd = gun.side === 'port' ? -1 : 1;
    onSide(gun.x, y + 0.42, sd, 0.46, 0.46, 0.03, M.side); onSide(gun.x, y + 0.42, sd, 0.36, 0.36, 0.035, M.dark, 0.016);
  }

  // ----- the quarterdeck: its face onto the main deck, its windows, the stern -----
  const faceX = qto + 0.02;
  box(0.06, 1.3, 0.86, M.side, faceX, yW + 0.65, 0); box(0.08, 1.2, 0.72, M.wood, faceX + 0.01, yW + 0.6, 0);
  box(0.09, 1.2, 0.03, M.dark, faceX + 0.02, yW + 0.6, 0); box(0.1, 0.05, 0.05, M.gold, faceX + 0.04, yW + 0.6, 0.12);
  box(0.04, 0.06, sternW * 2, M.side, faceX - 0.01, yQ - 0.03, 0);
  for (const sd of [-1, 1]) for (const x of [-6.5, -5.5, -4.5]) { onSide(x, yW + 0.78, sd, 0.5, 0.42, 0.03, M.side); onSide(x, yW + 0.78, sd, 0.4, 0.32, 0.035, M.glass, 0.016); }
  for (const z of [-1.2, -0.4, 0.4, 1.2]) { box(0.03, 0.46, 0.5, M.side, -l - 0.012, yW + 0.8, z); box(0.035, 0.36, 0.4, M.glass, -l - 0.018, yW + 0.8, z); }
  const plate = mesh(new THREE.PlaneGeometry(2.6, 0.48), new THREE.MeshStandardMaterial({ map: nameTex(ship.name, pt.railing, pt.hull), roughness: 0.6 }), false);
  plate.rotation.y = -Math.PI / 2; add(plate, -l - 0.02, yW + 0.2, 0);
  // Lanterns on the taffrail, and its white scrollwork.
  for (const z of [-sternW + 0.25, 0, sternW - 0.25]) {
    rod([-l + 0.06, yQ + bw.h, z], [-l + 0.06, yQ + bw.h + 0.55, z], 0.025, M.dark);
    box(0.18, 0.24, 0.18, M.dark, -l + 0.06, yQ + bw.h + 0.66, z); box(0.13, 0.17, 0.2, M.lamp, -l + 0.06, yQ + bw.h + 0.66, z); box(0.2, 0.17, 0.13, M.lamp, -l + 0.06, yQ + bw.h + 0.66, z);
  }
  for (const sd of [-1, 1]) { const s = mesh(new THREE.TorusGeometry(0.2, 0.045, 6, 14, Math.PI * 1.6).rotateY(Math.PI / 2), M.side); s.rotation.x = sd > 0 ? 0.6 : Math.PI - 0.6; add(s, -l - 0.03, yQ + bw.h + 0.2, sd * 0.42); }
  box(0.05, 0.3, 0.5, M.side, -l - 0.02, yQ + bw.h + 0.12, 0);

  // ----- her figurehead: a black beast's head, gold scrollwork behind it -----
  const fy = yW - 0.2, fh = new THREE.Group();
  fh.position.set(tip - 0.05, fy, 0); fh.scale.setScalar(1.7); g.add(fh);
  const part = (geo, m, x, y, z) => { const p = mesh(geo, m); p.position.set(x, y, z); fh.add(p); return p; };
  part(new THREE.SphereGeometry(0.28, 12, 10), M.head, 0.3, 0, 0).scale.set(1.35, 1, 0.85);
  part(new THREE.BoxGeometry(0.36, 0.2, 0.3), M.head, 0.64, -0.05, 0); part(new THREE.BoxGeometry(0.32, 0.08, 0.26), M.head, 0.6, -0.2, 0);
  part(new THREE.BoxGeometry(0.06, 0.04, 0.22), M.side, 0.78, -0.15, 0);
  part(new THREE.CylinderGeometry(0.12, 0.2, 0.5, 8).rotateZ(1.1), M.head, 0.05, -0.15, 0);
  for (const sd of [-1, 1]) {
    part(new THREE.ConeGeometry(0.08, 0.22, 6), M.head, 0.15, 0.27, sd * 0.13).rotation.x = sd * 0.4;
    part(new THREE.SphereGeometry(0.045, 8, 6), M.eye, 0.5, 0.08, sd * 0.17);
    part(new THREE.TorusGeometry(0.16, 0.045, 6, 14, Math.PI * 1.5), M.gold, -0.05, 0.12, sd * 0.2).rotation.z = 0.4;
    part(new THREE.TorusGeometry(0.1, 0.035, 6, 12, Math.PI * 1.5), M.gold, -0.15, -0.22, sd * 0.18).rotation.z = 2.4;
  }
  // Gold scrollwork along her bows, either side of the stem.
  for (const sd of [-1, 1]) for (const [dx, dy, r] of [[0.5, 0.25, 0.22], [0.95, -0.05, 0.15], [1.3, 0.2, 0.11]]) {
    const s = mesh(new THREE.TorusGeometry(r, 0.045, 6, 14, Math.PI * 1.5), M.gold); s.rotation.y = -sd * Math.atan(slope(tip - dx)); s.rotation.z = dx * 2;
    add(s, tip - dx, fy + dy, sd * (hb(tip - dx) + 0.04));
  }
  // The bowsprit and jib boom.
  rod([tip - 0.5, yF + 0.45, 0], [tip + 3.3, yF + 1.55, 0], 0.09, M.spar, 8);
  rod([tip + 2.2, yF + 1.25, 0], [tip + 4.6, yF + 1.95, 0], 0.045, M.spar, 6);

  // ----- stairs up, and the rails along each break -----
  // (rising toward x1)
  const stairs = (x0, x1, y0, rise, n, z, w) => { const run = (x1 - x0) / n; for (let k = 1; k <= n; k++) box(run + 0.01, rise * k, w, M.deck, x0 + (k - 0.5) * run, y0 + rise * k / 2, z); };
  const sq = P.stairs.quarter, sf = P.stairs.fore;
  for (const sd of [-1, 1]) {
    const mid = qto + sq.len / 2, z = sd * (insideAt(P, mid) - 0.32);
    // (rising aft: from the main deck at qto + len up to the quarterdeck at qto)
    const run = sq.len / 8;
    for (let k = 1; k <= 8; k++) box(run + 0.01, P.quarter.up * k / 8, 0.62, M.deck, qto + sq.len - (k - 0.5) * run, yW + P.quarter.up * k / 16, z);
    rod([qto + sq.len, yW + 0.8, z - sd * 0.33], [qto, yQ + 0.8, z - sd * 0.33], 0.03, M.rail);
    for (const f of [0, 0.5, 1]) rod([qto + sq.len * (1 - f), yW + P.quarter.up * f, z - sd * 0.33], [qto + sq.len * (1 - f), yW + P.quarter.up * f + 0.8, z - sd * 0.33], 0.025, M.rail);
  }
  stairs(ffrom - sf.len, ffrom, yW, P.fore.up / 4, 4, 0, sf.w);
  const balusters = (x, y, z0, z1) => {
    box(0.07, 0.05, z1 - z0, M.rail, x, y + 0.72, (z0 + z1) / 2); box(0.07, 0.05, z1 - z0, M.rail, x, y + 0.05, (z0 + z1) / 2);
    const n = Math.max(2, Math.round((z1 - z0) / 0.18));
    for (let i = 0; i <= n; i++) add(mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.66, 6), M.rail), x, y + 0.39, z0 + (z1 - z0) * i / n);
  };
  const qIn = insideAt(P, qto - 0.05) - 0.68;
  balusters(qto - 0.05, yQ, -qIn, qIn);
  for (const sd of [-1, 1]) { const a = sf.w / 2 + 0.05, b = insideAt(P, ffrom + 0.05); balusters(ffrom + 0.05, yF, sd > 0 ? a : -b, sd > 0 ? b : -a); }
  // Hatches down to the gun deck.
  for (const h of P.hatches) { box(h.w + 0.14, 0.1, h.w + 0.14, M.side, h.x, yW + 0.05, h.z); box(h.w, 0.11, h.w, M.dark, h.x, yW + 0.06, h.z); }
  // The ship's wheel.
  { const x = P.helm.x, y = yQ + 0.95;
    box(0.2, 0.85, 0.2, M.wood, x + 0.14, yQ + 0.43, 0);
    const wheel = mesh(new THREE.TorusGeometry(0.36, 0.03, 5, 18).rotateY(Math.PI / 2), M.wood); add(wheel, x, y, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; rod([x, y, 0], [x, y + Math.sin(a) * 0.5, Math.cos(a) * 0.5], 0.018, M.wood, 5); }
    add(mesh(new THREE.SphereGeometry(0.07, 8, 6), M.gold), x, y, 0);
  }

  // ----- masts, crow's nests, rigging; her sails in a group of their own -----
  const sails = new THREE.Group(); sails.userData.live = true;
  for (const m of P.masts) {
    const foot = deckY(P, deckAt(P, m.x)), { feet, top } = mastSails(m);
    add(mesh(new THREE.CylinderGeometry(0.09, 0.17, top - foot, 10), M.spar), m.x, (foot + top) / 2, 0);
    const nest = feet[0] + m.sails[0][1] + 0.08;
    add(mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.1, 12), M.wood), m.x, nest, 0);
    add(mesh(new THREE.TorusGeometry(0.46, 0.025, 4, 16).rotateX(Math.PI / 2), M.wood), m.x, nest + 0.32, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; rod([m.x + Math.cos(a) * 0.46, nest, Math.sin(a) * 0.46], [m.x + Math.cos(a) * 0.46, nest + 0.32, Math.sin(a) * 0.46], 0.015, M.wood, 4); }
    // Shrouds from the crow's nest down to her rail each side, ratlines across them.
    for (const sd of [-1, 1]) {
      const lines = [-0.75, -0.25, 0.25, 0.75].map((dx) => { const x = m.x + dx; return [[m.x + dx * 0.25, nest, sd * 0.4], [x, deckY(P, deckAt(P, x)) + bw.h + 0.06, sd * (hb(x) + 0.03)]]; });
      for (const [a, b] of lines) rod(a, b, 0.016, M.rope, 3);
      const [a0, b0] = lines[0], [a1, b1] = lines[3], lerp = (p, q, f) => p.map((v, i) => v + (q[i] - v) * f);
      for (let f = 0.08; f < 0.95; f += 0.09) rod(lerp(b0, a0, f), lerp(b1, a1, f), 0.01, M.rope, 3);
    }
    m.sails.forEach(([w, h], i) => {
      const geo = new THREE.PlaneGeometry(w, h, 8, 4), pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.cos(pos.getX(k) / w * Math.PI) * 0.22 * w / 2 * (0.6 + 0.4 * Math.cos(pos.getY(k) / h * Math.PI)));
      geo.computeVertexNormals();
      const cloth = mesh(geo, M.sail, false), yard = mesh(new THREE.CylinderGeometry(0.05, 0.05, w + 0.35, 6), M.spar, false);
      cloth.position.y = -h / 2; yard.rotation.z = Math.PI / 2;
      const arm = new THREE.Group(); arm.add(cloth, yard);
      arm.position.set(m.x, feet[i] + h, 0);
      arm.rotation.y = Math.PI / 2 - 0.45;   // (square across her, braced round a little, as the sloop's)
      sails.add(arm);
    });
  }
  // Stays: fore to the bowsprit, main to fore, mizzen to main, and back to the stern.
  const tops = P.masts.map((m) => [m.x, mastSails(m).top - 0.3, 0]);
  rod(tops[0], [tip + 4.4, yF + 1.9, 0], 0.02, M.rope, 3);
  rod(tops[1], [P.masts[0].x, mastSails(P.masts[0]).feet[1], 0], 0.02, M.rope, 3);
  rod(tops[2], [P.masts[1].x, mastSails(P.masts[1]).feet[1], 0], 0.02, M.rope, 3);
  rod(tops[2], [-l + 0.2, yQ + bw.h, 0], 0.02, M.rope, 3);

  // ----- her guns and furniture, as her config places them -----
  const piece = (kind, opts, x, z, yaw) => {
    const make = FURNITURE[kind];
    if (!make) throw new Error(`No furniture called ${kind}`);
    const p = make(opts || {});
    p.g.position.set(x, deckY(P, deckAt(P, x)) + 0.02, z); p.g.rotation.y = yaw || 0;
    g.add(p.g);
    if (p.tick) ticks.push(p.tick);
  };
  for (const gun of guns) piece(ship.gunKind, null, gun.x, gun.z, gun.side === 'port' ? Math.PI : 0);
  for (const f of ship.furniture) piece(f.kind, f.opts, f.x, f.z, f.yaw);

  bake(g);
  bake(sails);
  g.add(sails);
  g.rotation.order = 'YXZ';   // (turned to her heading, then heeled over about her own length, as the sloop)
  return { g, sails, plan: P, ship, tick(dt) { for (const t of ticks) t(dt); } };
}
