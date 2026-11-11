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
import { widthAt, sideY, liftAt, stemX } from '../ships.js';
import { WAR_FRIGATE_PLAN, deckAt, deckY, insideAt, deckGuns, portXs, portRows, mastSails } from '../den-frigate.js';
import { mat, mesh, woodTex, canvasTex } from './world.js';
import { sweepGeo, deckGeo, sectionGeo, bilgeRows, rise, skinFrame, sternFrame, sternX, placeOn } from './hull.js';
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
    sails (their group: hide it to see her deck), plan, ship }. `furled`: at anchor, her sails rolled
    up on their yards, squared across her (js/den/moored.js). */
export function frigateMesh(ship, plan = WAR_FRIGATE_PLAN, { furled = false } = {}) {
  const P = plan, H = P.hull, l = H.len / 2, tip = stemX(H);
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
  const sweep = (faces, m, o) => g.add(mesh(sweepGeo(H, faces, o), m));
  /** Her rail's top at `x`, above the water: the deck there, its bulwark, her sheer's lift. */
  const railY = (x) => deckY(P, deckAt(P, x)) + bw.h + liftAt(H, x);
  /** A thin band round her whole hull from y0 to y1 (heights on her side: her sheer lifts it), `out` proud of her side. */
  const ring = (y0, y1, m, out = 0.025) => sweep([[[y0, -0.04], [y0, out]], [[y0, out], [y1, out]], [[y1, out], [y1, -0.04]]], m);

  // ----- her hull, curved as Puzzle Pirates draws a ship (js/den/hull.js; her shape, src/ships.ts) -----
  sweep([[...bilgeRows(H), [P.bottom, 0]]], M.bottom);   // (bare wood below)
  sweep([rise(P.bottom, H.deck, 0, 6)], M.hull);
  // Each deck's bulwark up from her side's deck line, the quarterdeck's and forecastle's standing
  // above the main deck's, capped with her rail; inside, each deck's planking; across her, where the
  // quarterdeck and forecastle stop, their faces onto the main deck.
  for (const [x0, x1, y] of [[-Infinity, qto, yQ], [qto, ffrom, yW], [ffrom, Infinity, yF]]) {
    const top = y + bw.h, level = () => y, t = bw.t;
    sweep([[[H.deck, 0], [top, 0]], [[top, 0], [top, -t]], [[top, -t], [level, -t]]], M.hull, { x0, x1, closed: true });
    sweep([[[top, -t - 0.035], [top, 0.035]], [[top, 0.035], [top + 0.06, 0.035]], [[top + 0.06, 0.035], [top + 0.06, -t - 0.035]], [[top + 0.06, -t - 0.035], [top, -t - 0.035]]], M.rail, { x0, x1, closed: true });
    g.add(mesh(deckGeo(H, y, x0, x1, 0.02), M.deck));
  }
  g.add(mesh(sectionGeo(H, qto, yW, yQ, 1), M.hull), mesh(sectionGeo(H, ffrom, yW, yF, -1), M.hull));
  for (const y of P.stripes.at) ring(y - P.stripes.h / 2, y + P.stripes.h / 2, M.side);
  ring(P.bottom - P.line / 2, P.bottom + P.line / 2, M.side, 0.012);   // (a fine line where the paint stops)
  // Her stem, up from the forecastle's rail to the bowsprit.
  rod([tip - 0.05, yW - 0.6, 0], [tip - 0.15, railY(tip) + 0.1, 0], 0.08, M.hull, 8);

  // ----- ports: two rows a side, and one in the bulwark for each gun on deck -----
  /** A box on her side (sd) at x and Y above the water, out proud of it, facing straight out of it. */
  const onSide = (x, Y, sd, w, h, d, m, out = 0.012) => g.add(placeOn(mesh(new THREE.BoxGeometry(w, h, d), m), skinFrame(H, x, Y, sd, out)));
  const onStern = (z, Y, w, h, d, m, out = 0.012) => g.add(placeOn(mesh(new THREE.BoxGeometry(w, h, d), m), sternFrame(H, z, Y, out)));
  // (each in the middle of its band of black, its stripes' sheer lifting it with them: portRows)
  const port = (x, y, sd, s) => {
    const Y = sideY(H, x, y), lid = sideY(H, x, y + s / 2 + 0.02);
    onSide(x, Y, sd, s + 0.09, s + 0.09, 0.03, M.side); onSide(x, Y, sd, s, s, 0.04, M.dark, 0.02); onSide(x, lid, sd, s + 0.14, 0.035, 0.05, M.side, 0.025);
  };
  const [upper, lower] = portXs(P), rows = portRows(P);
  for (const sd of [-1, 1]) {
    upper.forEach((x) => port(x, rows[1], sd, P.ports.size));
    lower.forEach((x) => { if (x < tip - 1.2) port(x, rows[0], sd, P.ports.size); });
  }
  const guns = deckGuns(P, ship.guns);
  for (const gun of guns) {
    const y = deckY(P, deckAt(P, gun.x)), sd = gun.side === 'port' ? -1 : 1;
    onSide(gun.x, y + 0.42, sd, 0.46, 0.46, 0.03, M.side); onSide(gun.x, y + 0.42, sd, 0.36, 0.36, 0.035, M.dark, 0.016);
  }

  // ----- the quarterdeck: its face onto the main deck, its windows, the stern -----
  const faceX = qto + 0.02, qW = widthAt(H, qto, yQ);
  box(0.06, 1.3, 0.86, M.side, faceX, yW + 0.65, 0); box(0.08, 1.2, 0.72, M.wood, faceX + 0.01, yW + 0.6, 0);
  box(0.09, 1.2, 0.03, M.dark, faceX + 0.02, yW + 0.6, 0); box(0.1, 0.05, 0.05, M.gold, faceX + 0.04, yW + 0.6, 0.12);
  box(0.04, 0.06, qW * 2 - 0.1, M.side, faceX - 0.01, yQ - 0.03, 0);
  // (her cabin's windows, as her stripes, where her sheer lifts her side)
  for (const sd of [-1, 1]) for (const x of [-6.5, -5.5, -4.5]) { const Y = sideY(H, x, yW + 0.78); onSide(x, Y, sd, 0.5, 0.42, 0.03, M.side); onSide(x, Y, sd, 0.4, 0.32, 0.035, M.glass, 0.016); }
  // Her stern windows, round her curved stern, and her name across it.
  const sY = (y) => sideY(H, -l, y);
  for (const z of [-1.2, -0.4, 0.4, 1.2]) { onStern(z, sY(yW + 0.8), 0.5, 0.46, 0.03, M.side); onStern(z, sY(yW + 0.8), 0.4, 0.36, 0.035, M.glass, 0.018); }
  {
    // (a plate bent round her stern: each point of it set just off her stern there)
    const geo = new THREE.PlaneGeometry(2.6, 0.48, 16, 1).rotateY(-Math.PI / 2), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i), Y = sY(yW + 0.2) + p.getY(i); p.setXYZ(i, sternX(H, z, Y) - 0.02, Y, z); }
    geo.computeVertexNormals();
    g.add(mesh(geo, new THREE.MeshStandardMaterial({ map: nameTex(ship.name, pt.railing, pt.hull), roughness: 0.6 }), false));
  }
  // Lanterns on the taffrail, and its white scrollwork.
  const tY = yQ + bw.h + liftAt(H, -l);
  for (const z of [-1.3, 0, 1.3]) {
    const x = sternX(H, z, tY) + bw.t / 2;
    rod([x, tY, z], [x, tY + 0.55, z], 0.025, M.dark);
    box(0.18, 0.24, 0.18, M.dark, x, tY + 0.66, z); box(0.13, 0.17, 0.2, M.lamp, x, tY + 0.66, z); box(0.2, 0.17, 0.13, M.lamp, x, tY + 0.66, z);
  }
  for (const sd of [-1, 1]) {
    const s = placeOn(mesh(new THREE.TorusGeometry(0.2, 0.045, 6, 14, Math.PI * 1.6), M.side), sternFrame(H, sd * 0.42, tY + 0.2, 0.03));
    s.rotateZ(sd > 0 ? 0.6 : Math.PI - 0.6); g.add(s);
  }
  g.add(placeOn(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), M.side), sternFrame(H, 0, tY + 0.12, 0.02)));

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
    const s = placeOn(mesh(new THREE.TorusGeometry(r, 0.045, 6, 14, Math.PI * 1.5), M.gold), skinFrame(H, tip - dx, fy + dy, sd, 0.04));
    s.rotateZ(dx * 2); g.add(s);
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
      const lines = [-0.75, -0.25, 0.25, 0.75].map((dx) => { const x = m.x + dx; return [[m.x + dx * 0.25, nest, sd * 0.4], [x, railY(x) + 0.06, sd * (widthAt(H, x, railY(x) + 0.06) + 0.03)]]; });
      for (const [a, b] of lines) rod(a, b, 0.016, M.rope, 3);
      const [a0, b0] = lines[0], [a1, b1] = lines[3], lerp = (p, q, f) => p.map((v, i) => v + (q[i] - v) * f);
      for (let f = 0.08; f < 0.95; f += 0.09) rod(lerp(b0, a0, f), lerp(b1, a1, f), 0.01, M.rope, 3);
    }
    m.sails.forEach(([w, h], i) => {
      const geo = new THREE.PlaneGeometry(w, h, 8, 4), pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.cos(pos.getX(k) / w * Math.PI) * 0.22 * w / 2 * (0.6 + 0.4 * Math.cos(pos.getY(k) / h * Math.PI)));
      geo.computeVertexNormals();
      const yard = mesh(new THREE.CylinderGeometry(0.05, 0.05, w + 0.35, 6), M.spar, false);
      // (furled: the sail rolled up along the top of its yard)
      const cloth = furled ? mesh(new THREE.CylinderGeometry(0.11, 0.11, w * 0.92, 8).rotateZ(Math.PI / 2), M.sail, false) : mesh(geo, M.sail, false);
      cloth.position.y = furled ? 0.1 : -h / 2; yard.rotation.z = Math.PI / 2;
      const arm = new THREE.Group(); arm.add(cloth, yard);
      arm.position.set(m.x, feet[i] + h, 0);
      arm.rotation.y = Math.PI / 2 - (furled ? 0 : 0.45);   // (square across her, braced round a little, as the sloop's)
      sails.add(arm);
    });
  }
  // Stays: fore to the bowsprit, main to fore, mizzen to main, and back to the stern.
  const tops = P.masts.map((m) => [m.x, mastSails(m).top - 0.3, 0]);
  rod(tops[0], [tip + 4.4, yF + 1.9, 0], 0.02, M.rope, 3);
  rod(tops[1], [P.masts[0].x, mastSails(P.masts[0]).feet[1], 0], 0.02, M.rope, 3);
  rod(tops[2], [P.masts[1].x, mastSails(P.masts[1]).feet[1], 0], 0.02, M.rope, 3);
  rod(tops[2], [-l + 0.2, railY(-l + 0.2), 0], 0.02, M.rope, 3);

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
