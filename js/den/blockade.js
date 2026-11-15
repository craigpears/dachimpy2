// A blockade, in 3D: the proof of concept on the unlinked blockade-test.html (its rules src/blockade.ts, its bots
// src/blockade-bots.ts; BLOCKADE.md). Drawn here: the board's squares faintly, its rocks, the fort round the heart,
// its imperial gates (gate-look.js) and their bastion guns, the islands and their coves, the winds blowing in through
// the side ways, the buoys (their pennants, coloured by whose they are), every ship (each war frigate by her config,
// src/den-frigate.ts: Primates Rule, Coral Throne the Atlantean, Eldritch Wail the ghost ship...; each war brig by
// hers, src/den-brig.ts; the sloops; a brig's craft, sea-craft.js, launched off her sides and fading) with
// her crew at work and her name over her, her influence circle on the water and her damage (ship-damage.js: holes where
// she's shot, her crew at work, sitting low, dead in the water), the shots between them, and the pin, berth and
// course of the ship you sail. Everything else is the rules'.
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { Blockade, BLOCKADE, reefSquares } from '../blockade.js';
import { Bots } from '../blockade-bots.js';
import { FREE, STRATEGIES, orderAt, orderText, orderTarget } from '../blockade-orders.js';
import { drawnAt } from '../ship-handling.js';
import { FRIGATES, WAR_FRIGATE_PLAN, deckY } from '../den-frigate.js';
import { BRIGS, WAR_BRIG_PLAN } from '../den-brig.js';
import { SLOOP_HULL } from '../ships.js';
import { scene, camera, mat, mesh, canvasTex, burst, makePirate } from './world.js';
import { bake } from './bake.js';
import { blastTick } from './blast.js';
import { turretView, turretWrecked, turretFire, turretLand, turretShotsTick } from './turret.js';
import { gateLook } from './gate-look.js';
import { damageLook } from './ship-damage.js';
import { frigateMesh } from './frigate.js';
import { sloopMesh, SLOOP_DECK } from './sloop.js';
import { turtleMesh, ghostSloopMesh } from './sea-craft.js';

const CELL = SAIL.CELL, B = BLOCKADE;
export const TEAM_COL = { gold: '#e0a92a', crimson: '#c8372a' };
const NONE_COL = '#b9b2a2', CONTEST_COL = '#f6f1e6';
/** A square's middle in metres (the board's middle at the origin; r up the board is -z, as the den's sea). */
export const seaXZ = (c, r) => [(c + 0.5 - B.COLS / 2) * CELL, -(r + 0.5 - B.ROWS / 2) * CELL];
export const seaCR = (x, z) => [x / CELL + B.COLS / 2 - 0.5, -z / CELL + B.ROWS / 2 - 0.5];
const v3 = (c, r, y = 0) => { const [x, z] = seaXZ(c, r); return new THREE.Vector3(x, y, z); };
const dice = (c, r) => { let s = (c * 73856093) ^ (r * 19349663); return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };
const DRESS = { gold: { shirt: ['#f4efe4', '#1d1b20'], scarf: '#e0a92a' }, crimson: { shirt: ['#f4efe4', '#8a1f22'], scarf: '#d8b04e' } };

/** A name over a ship, in her side's colour. */
const label = (text, col) => {
  const tex = canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = 'rgba(28, 19, 12, 0.78)'; g.beginPath(); g.roundRect(4, 8, w - 8, h - 16, 20); g.fill();
    g.strokeStyle = col; g.lineWidth = 5; g.stroke();
    g.fillStyle = col; g.font = 'italic 700 46px Alegreya, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(6, 6 * 96 / 512, 1); s.renderOrder = 6;
  return s;
};

/** The blockade: `you`, the ship you sail (its number; -1 to watch the bots alone), `say(text, bad)` what's said;
    `brawl`, two war frigates put broadside to broadside to fight it out (Blockade.brawl), the rest going on round them;
    `admiral`, a side ('gold' or 'crimson') you command (src/blockade-orders.ts): the round waits while you plan
    (`start()` sets it going), each of her ships given an order (`order`, `orderAt` a click on the board), a line drawn
    from each to what she's to do.
    `sailed(id)`, told when your helm moves to another ship of yours by itself (a craft you were steering gone home:
    back to her brig).
    Returns { b (the rules), bots, g, duel (the brawl's two ids, or null), you(), sail(id), tick(dt), click(point),
    key(k), focus(), hud() }. */
export function blockadeSea({ you = 0, say = () => {}, brawl = false, admiral = null, sailed = () => {} } = {}) {
  const b = new Blockade(), duel = brawl ? b.brawl() : null, bots = new Bots(b, [], Math.random, duel), g = new THREE.Group();
  scene.add(g);
  let me = you, clock = 0, planning = !!admiral, picked = -1;

  // ----- the board's squares, faintly -----
  const pts = [], x0 = -B.COLS / 2 * CELL, z0 = -B.ROWS / 2 * CELL;
  for (let c = 0; c <= B.COLS; c++) pts.push(x0 + c * CELL, 0.03, z0, x0 + c * CELL, 0.03, -z0);
  for (let r = 0; r <= B.ROWS; r++) pts.push(x0, 0.03, z0 + r * CELL, -x0, 0.03, z0 + r * CELL);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color: '#d9ecf5', transparent: true, opacity: 0.13, depthWrite: false })));

  // ----- the rocks, the fort's walls among them (its towers and bastions their own) -----
  const stoneM = mat('#6b6158', { flatShading: true, roughness: 0.95 }), stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  const isleSq = new Set(BLOCKADE.REEFS.map((x) => `${x.islet[0]},${x.islet[1]}`));
  // (the reefs round the island buoys, drawn as a lagoon is (15 Nov: "they look incredibly weird and colourful, not very
  // lagoon reef like"): the sea paling to turquoise round each, the reef a ring of pale sand just under the water with
  // a few dark rocks breaking it and white surf along it, the lagoon inside clear turquoise)
  // (the fort's wall where a reef meets it, still wall)
  const wall = (c, r) => B.WALLS.some((w) => c >= w.c0 && c <= w.c1 && r >= w.r0 && r <= w.r1);
  const reefSq = new Set(BLOCKADE.REEFS.flatMap((x) => reefSquares(x).filter(([c, r]) => !wall(c, r)).map(([c, r]) => `${c},${r}`)));
  // (each reef painted as one picture over the sea: a soft paling round it, the lagoon, a sandbar ring with a wobbly
  // edge and its gaps open, surf along its outside; the few rocks on it in 3D)
  const reefTex = (reef) => canvasTex(1024, 1024, (x, w) => {
    const n = (reef.ring + reef.shoal) * 2 + 3, px = w / n, mid = w / 2, roll = dice(reef.at[0], reef.at[1]);
    const toPx = (c, r) => [mid + (c - reef.at[0]) * px, mid - (r - reef.at[1]) * px];
    x.clearRect(0, 0, w, w);
    // (the shoals: the sea paling over sand, out to their edge, soft)
    const S = (reef.ring + reef.shoal + 0.5) * px;
    x.filter = `blur(${px * 0.9}px)`; x.fillStyle = 'rgba(96, 178, 176, 0.5)';
    x.beginPath(); x.roundRect(mid - S + px * 0.4, mid - S + px * 0.4, S * 2 - px * 0.8, S * 2 - px * 0.8, px * 3.2); x.fill();
    x.filter = 'none';
    const halo = x.createRadialGradient(mid, mid, px * 1.5, mid, mid, (reef.ring + 1.5) * px);
    halo.addColorStop(0, 'rgba(74, 185, 178, 0.75)'); halo.addColorStop(0.7, 'rgba(66, 176, 172, 0.55)'); halo.addColorStop(1, 'rgba(60, 168, 168, 0)');
    x.fillStyle = halo; x.fillRect(0, 0, w, w);
    // (along the ring: its middle line, a rounded square reef.ring squares out)
    const R = reef.ring * px, corner = px * 1.1, along = [];
    for (let t = 0; t < 1; t += 1 / 400) {
      const u = t * 4, side = Math.floor(u), f = u - side, a = -R + corner + f * (2 * R - 2 * corner);
      const pts = [[a, -R], [R, a], [-a, R], [-R, -a]][side];
      along.push(pts);
      if (f > 0.97) for (let k = 0; k <= 8; k++) { const th = (side * Math.PI) / 2 - Math.PI / 2 + (k / 8) * (Math.PI / 2); along.push([[R - corner, R - corner], [-R + corner, R - corner], [-R + corner, -R + corner], [R - corner, -R + corner]][side].map((v, i) => v + (i ? Math.sin(th) : Math.cos(th)) * corner)); }
    }
    const gaps = reef.gaps.map(([c, r]) => toPx(c, r));
    const inGap = (X, Y) => gaps.some(([gx, gy]) => Math.hypot(X - gx, Y - gy) < px * 0.62);
    // the sandbar under the water, its edge wobbling
    for (const [ax, ay] of along) {
      const X = mid + ax, Y = mid + ay;
      if (inGap(X, Y)) continue;
      x.fillStyle = 'rgba(160, 220, 204, 0.8)'; x.beginPath(); x.arc(X + (roll() - 0.5) * px * 0.2, Y + (roll() - 0.5) * px * 0.2, px * (0.42 + roll() * 0.16), 0, Math.PI * 2); x.fill();
    }
    for (const [ax, ay] of along) {
      const X = mid + ax, Y = mid + ay;
      if (inGap(X, Y) || roll() < 0.5) continue;
      x.fillStyle = 'rgba(226, 216, 178, 0.45)'; x.beginPath(); x.arc(X + (roll() - 0.5) * px * 0.35, Y + (roll() - 0.5) * px * 0.35, px * (0.12 + roll() * 0.14), 0, Math.PI * 2); x.fill();
    }
    // surf, white, along the bar's outer edge
    for (const [ax, ay] of along) {
      const d = Math.hypot(ax, ay) || 1, out = px * 0.5, X = mid + ax + (ax / d) * out, Y = mid + ay + (ay / d) * out;
      if (inGap(mid + ax, mid + ay) || roll() < 0.35) continue;
      x.fillStyle = `rgba(255, 255, 255, ${0.25 + roll() * 0.35})`; x.beginPath(); x.ellipse(X, Y, px * (0.06 + roll() * 0.14), px * (0.04 + roll() * 0.06), Math.atan2(ay, ax) + Math.PI / 2, 0, Math.PI * 2); x.fill();
    }
  });
  const reefRockM = ['#6d6f68', '#7a776c', '#5d6660'].map((col) => mat(col, { flatShading: true, roughness: 0.95 }));
  // (everything of the board that never moves, its rocks and walls and islets, baked into one mesh a material: three
  // hundred stones were three hundred draws, 15 Nov)
  const still = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(1, 0), reefSheets = [];
  for (const reef of BLOCKADE.REEFS) {
    const at = v3(...reef.at), size = ((reef.ring + reef.shoal) * 2 + 3) * CELL;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: reefTex(reef), transparent: true, depthWrite: false }));
    q.position.set(at.x, 0.02, at.z); q.renderOrder = 1; g.add(q); reefSheets.push(q);
  }
  for (const k of b.rocks) {
    const [c, r] = k.split(',').map(Number);
    if (isleSq.has(k) || b.gates.some((gate) => gate.towerAt(c, r) >= 0) || b.battery.some((x) => x.at[0] === c && x.at[1] === r)) continue;
    const roll = dice(c, r), at = v3(c, r);
    if (reefSq.has(k)) {
      // (a rock or two breaking the surface, low and dark)
      for (let i = 0, n = roll() < 0.45 ? 1 : 0; i < n; i++) {
        const sz = 0.4 + roll() * 0.4, m = mesh(rockGeo, reefRockM[Math.floor(roll() * reefRockM.length)]);
        m.scale.set(sz * (1 + roll() * 0.4), sz * 0.6, sz * (1 + roll() * 0.4));
        m.position.set(at.x + (roll() - 0.5) * 2.6, 0.02, at.z + (roll() - 0.5) * 2.6);
        m.rotation.set(0, roll() * 3, 0);
        still.add(m);
      }
      continue;
    }
    for (let i = 0; i < 4; i++) {
      const s = 1.5 + roll() * 0.8, m = mesh(stoneGeo, stoneM);
      m.scale.set(s * (0.9 + roll() * 0.3), s * (0.8 + roll() * 0.9), s * (0.9 + roll() * 0.3));
      m.position.set(at.x + ((i & 1) - 0.5) * 1.8 + (roll() - 0.5) * 0.6, s * 0.35, at.z + ((i >> 1) - 0.5) * 1.8 + (roll() - 0.5) * 0.6);
      m.rotation.set(roll() * 3, roll() * 3, roll() * 3);
      still.add(m);
    }
  }
  // ----- a tiny island by each lagoon's buoy: a round of sand, a tuft of grass, a palm or two -----
  const sandM = mat('#e2cf98', { roughness: 1 }), grassM = mat('#6f9a46', { roughness: 1, flatShading: true }), trunkM = mat('#8a6a44', { roughness: 1 }), leafM = mat('#4f8a3a', { roughness: 1, side: THREE.DoubleSide });
  for (const { islet: [c, r] } of BLOCKADE.REEFS) {
    const at = v3(c, r), roll = dice(c, r);
    const sand = mesh(new THREE.CylinderGeometry(CELL * 0.55, CELL * 0.68, 0.7, 14), sandM); sand.position.set(at.x, 0.1, at.z); still.add(sand);
    const hill = mesh(new THREE.DodecahedronGeometry(CELL * 0.3, 0), grassM); hill.scale.set(1, 0.5, 1); hill.position.set(at.x + (roll() - 0.5) * 0.6, 0.5, at.z + (roll() - 0.5) * 0.6); still.add(hill);
    for (let k = 0, n = 1 + Math.floor(roll() * 2); k < n; k++) {
      const palm = new THREE.Group(), h = 2.6 + roll() * 1.4, lean = (roll() - 0.5) * 0.5;
      const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.18, h, 6), trunkM); trunk.position.y = h / 2; palm.add(trunk);
      for (let i = 0; i < 6; i++) { const leaf = mesh(new THREE.PlaneGeometry(0.5, 2.0), leafM, false); leaf.position.set(0, h, 0); leaf.rotation.set(-1.1, i / 6 * Math.PI * 2, 0); leaf.translateY(0.9); palm.add(leaf); }
      palm.position.set(at.x + (roll() - 0.5) * 1.6, 0.4, at.z + (roll() - 0.5) * 1.6); palm.rotation.z = lean; palm.rotation.y = roll() * 6; still.add(palm);
    }
  }
  g.add(bake(still));
  // ----- the imperial gates and their bastion guns -----
  const gls = b.gates.map((gate, gi) => gateLook(g, gate, b.battery.filter((_, i) => b.gunGate[i] === gi), v3));
  const bastions = b.battery.map((_, i) => { const gi = b.gunGate[i], k = b.battery.slice(0, i).filter((__, j) => b.gunGate[j] === gi).length; return gls[gi].bastions[k]; });

  // ----- the winds: chevrons blowing along each, quick -----
  const chevron = canvasTex(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(240, 250, 255, 0.85)'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(12, 44); c.lineTo(32, 22); c.lineTo(52, 44); c.stroke();
  });
  chevron.wrapS = chevron.wrapT = THREE.RepeatWrapping;
  // (the side ways' winds in, and the ways out of the heart to the lagoons)
  const lanes = [...B.WINDS, ...B.EXITS.flat()].map(({ at: [c, r], d, n }) => {
    const tex = chevron.clone(); tex.needsUpdate = true; tex.repeat.set(1, n);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 0.8, CELL * n).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, color: '#bfe6f5' }));
    const DC = [0, 1, 0, -1][d], DR = [1, 0, -1, 0][d], mid = v3(c + DC * (n - 1) / 2, r + DR * (n - 1) / 2, 0.06);
    m.position.copy(mid); m.rotation.y = [0, -Math.PI / 2, Math.PI, Math.PI / 2][d]; m.renderOrder = 2;
    g.add(m);
    return tex;
  });

  // ----- the buoys: a float, a pole, its pennants; all coloured by whose it is -----
  const buoys = B.BUOYS.map((x) => {
    const o = new THREE.Group(), M = new THREE.MeshStandardMaterial({ color: NONE_COL, roughness: 0.5 }), white = mat('#f3ecdc');
    o.add(mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.5, 14), M), mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6).translate(0, 2.6, 0), mat('#4a2f1a')));
    o.add(mesh(new THREE.CylinderGeometry(0.8, 0.82, 0.3, 14).translate(0, 0.3, 0), white));
    for (let i = 0; i < x.pennants; i++) { const p = mesh(new THREE.ConeGeometry(0.45, 1.3, 3).rotateZ(-Math.PI / 2), M); p.scale.set(1, 1, 0.15); p.position.set(0.7, 4.5 - i * 0.9, 0); o.add(p); }
    o.position.copy(v3(...x.at)); g.add(o);
    return { o, M };
  });

  // ----- the ships: each her own look, her name, her influence circle, her crew and her damage -----
  // (how near the camera, in the sea's units, a ship has to be for her little crew to be drawn: following a ship, she
  // and those round her; the whole board, none. The usual trick: detail only where it can be seen)
  const DETAIL = 70;
  const sqGeoReach = new THREE.PlaneGeometry(CELL * 0.92, CELL * 0.92).rotateX(-Math.PI / 2);
  // (a turtle's damage isn't drawn on her: two hits and she's gone)
  const NO_DAMAGE = { tick: () => ({ low: 0, list: 0, turn: 0 }), reset() {} };
  const ships = b.ships.map((s) => {
    const big = s.kind === 'frigate', brig = s.kind === 'brig', craft = s.craft?.kind, col = TEAM_COL[s.team];
    const plan = big ? WAR_FRIGATE_PLAN : brig ? WAR_BRIG_PLAN : null;
    const look = big ? frigateMesh(FRIGATES[s.name] ?? FRIGATES['Primates Rule']) : brig ? frigateMesh(BRIGS[s.name] ?? BRIGS.Tidecaller, WAR_BRIG_PLAN)
      : craft === 'ram' ? turtleMesh() : craft === 'ghost' ? ghostSloopMesh() : null;
    // (a sloop baked down to one mesh a material, as a frigate is: nothing on her moves here; her crew and her holes,
    // added after, stay as they are)
    const m = look ? look.g : bake(sloopMesh());
    g.add(m);
    const hull = plan ? plan.hull : SLOOP_HULL, deck = plan ? deckY(plan, 'waist') : SLOOP_DECK;
    const crew = craft ? [] : big
      ? [{ x: -1.4, z: 1.15, job: 'carp' }, { x: 0.1, z: -1.15, job: 'carp' }, { x: 3.1, z: 1.05, job: 'carp' }, { x: -0.3, z: 0.25, job: 'bilge' }, { x: 1.5, z: -0.25, job: 'bilge' }]
      : brig ? [{ x: -0.4, z: 0.75, job: 'carp' }, { x: 1.9, z: -0.7, job: 'carp' }, { x: 0.9, z: 0.3, job: 'bilge' }]
        : [{ x: 0.55, z: 0.35, job: 'carp' }, { x: 0.05, z: -0.35, job: 'bilge' }];
    const dl = craft === 'ram' ? NO_DAMAGE : damageLook(m, hull, { deck, crew, dress: DRESS[s.team] });
    // (her helmsman, at her wheel or tiller; a craft has none to see)
    const helm = craft ? null : makePirate(DRESS[s.team]).g;
    if (helm) { helm.position.set(plan ? plan.helm.x - 0.6 : -1.15, plan ? deckY(plan, 'quarter') : SLOOP_DECK, 0); helm.rotation.y = Math.PI / 2; m.add(helm); }
    const name = label(s.name, col); g.add(name);
    if (craft) name.scale.multiplyScalar(0.7);
    const R = (B.INFLUENCE[s.kind] + (s.h.long - 1) / 2) * CELL;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.25, R, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.32, depthWrite: false }));
    ring.renderOrder = 2; g.add(ring);
    // (the admiral's: a dashed line from her to what she's been ordered to do)
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: col, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.9 }));
    line.visible = false; line.frustumCulled = false; g.add(line);
    const mark = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false }));
    mark.visible = false; mark.renderOrder = 3; g.add(mark);
    // (a craft starts aboard her brig, unseen)
    if (craft) { m.visible = false; name.visible = false; ring.visible = false; }
    return { s, m, look, dl, helm, name, ring, line, mark, big, brig, craft, heel: 0, pending: new Set(), fadeT: craft ? 99 : undefined };
  });

  // ----- a frigate's broadside reach, shaded red on the water (the one you're following): her blind spots plain, off her
  // bow and stern and behind rocks (15 Nov: "dip, duck and dodge") -----
  const reachM = new THREE.MeshBasicMaterial({ color: '#e0412e', transparent: true, opacity: 0.4, depthWrite: false });
  const reachSq = Array.from({ length: 40 }, () => { const q = new THREE.Mesh(sqGeoReach, reachM); q.renderOrder = 2; q.visible = false; g.add(q); return q; });
  let reachOf = -1;
  // ----- your pin, the block of squares she'll lie on there, her course -----
  const pin = new THREE.Group(); pin.add(mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.7, 12).translate(0, 0.2, 0), mat('#c8372a')), mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6).translate(0, 1.2, 0), mat('#4a2f1a')));
  pin.visible = false; g.add(pin);
  const sqGeo = new THREE.PlaneGeometry(CELL * 0.9, CELL * 0.9).rotateX(-Math.PI / 2), goldM = new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.22, depthWrite: false });
  const berth = Array.from({ length: 8 }, () => { const q = new THREE.Mesh(sqGeo, goldM); q.renderOrder = 2; q.visible = false; g.add(q); return q; });
  const dotM = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.7, depthWrite: false });
  const dots = Array.from({ length: 20 }, () => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.4, 14).rotateX(-Math.PI / 2), dotM); d.visible = false; d.renderOrder = 3; g.add(d); return d; });

  // ----- shots in flight -----
  const ballGeo = new THREE.SphereGeometry(1, 10, 8), ballM = mat('#1b1a1c', { metalness: 0.5, roughness: 0.4 }), flying = [];
  /** A broadside fired (anyone's, from the rules' list), set flying. */
  function show(got) {
    const s = b.ship(got.ship), V = ships[got.ship], size = { large: 0.26, medium: 0.2, small: 0.15 }[s.h.guns];
    const hit = got.shots.find((x) => x.what?.what === 'ship'), tower = got.shots.find((x) => x.what?.what === 'tower' && x.got !== 'bounced');
    saw(got.ship, hit ? 'hit' : tower ? 'gate' : 'fire', hit?.out ? 6 : tower?.got === 'crumbled' ? 6 : hit || tower ? 3 : 1);
    got.shots.forEach((shot, i) => {
      const end = shot.hit ?? shot.cells[shot.cells.length - 1], w = shot.what?.what;
      const a = v3(...shot.from, V.big ? 2.2 : V.brig ? 1.6 : 1.1), z = v3(...end, w === 'rock' ? 1.2 : w === 'tower' ? 4 : w === 'gun' ? 2.6 : w === 'ship' ? 1 : 0.1);
      const m = new THREE.Mesh(ballGeo, ballM); m.scale.setScalar(size); m.visible = false; g.add(m);
      if (shot.hole) ships[shot.what.id].pending.add(shot.hole.id);   // (its hole shows when it comes down)
      burst(a, '#ffcf6a', 10, 3); burst(a, '#cfc6b8', 8, 1.5);
      flying.push({ m, a, z, t: -i * 0.12, dur: 0.1 * shot.cells.length + 0.2, shot });
    });
  }
  function land({ shot, z }) {
    const w = shot.what?.what;
    if (w === 'rock') burst(z, '#9a9088', 14, 4);
    else if (w === 'tower') { if (shot.got === 'bounced') burst(z, '#f2e2a0', 8, 3); else gls[shot.what.g].knock(shot.what.i, shot.got === 'crumbled'); }
    else if (w === 'gun') { if (shot.got === 'wrecked') turretWrecked(bastions[shot.what.i], z); else burst(z, '#ffb85a', 14, 4); }
    else if (w === 'ship') {
      const V = ships[shot.what.id];
      if (shot.hole) V.pending.delete(shot.hole.id);
      if (shot.out) { say(`${V.s.name} is knocked out: dead in the water till her crew rebuild her`, V.s.id === me); saw(V.s.id, 'out', 5); }
      if (shot.sunk) sank(V, z);
    } else { burst(z.clone().setY(0.1), '#e8f4fa', 16, 4); burst(z.clone().setY(0.1), '#9cc8d4', 8, 2.5); }
  }

  /** She's gone down (the rules sank her as the shot was fired; seen as it lands): said, a great splash. */
  function sank(V, z) {
    if (V.craft) say(`${V.s.name}, ${b.ship(V.s.craft.by).name}'s ${V.craft === 'ram' ? 'turtle' : 'phantom sloop'}, has gone down`);
    else say(`${V.s.name} has gone down! She'll be back from her side's edge in ${B.RETURN} seconds`, V.s.id === me);
    saw(V.s.id, 'sunk', 8);
    burst(z.clone().setY(0.2), '#e8f4fa', 30, 6); burst(z.clone().setY(0.2), '#9cc8d4', 18, 4);
    V.sinking = true;
  }
  /** How long she takes going under, seen; and a craft fading, her time up. */
  const SINK_SECS = 5, FADE_SECS = 1.6;
  const SAY_GUN = { L: 'port', R: 'starboard' };
  /** What's just happened worth a look (for the camera's director, spectating): { at (clock), ship, what, weight }. */
  const action = [];
  const saw = (ship, what, weight) => { action.push({ at: clock, ship, what, weight }); if (action.length > 40) action.shift(); };
  return {
    b, bots, g, duel,
    you: () => me,
    /** Sail another ship (her number), or none (-1: watch). Her bot takes the one you leave. */
    sail(id) { me = id; },
    tick(dt) {
      // (planning: the round waits, everything drawn where it is)
      if (planning) dt = 0;
      clock += dt;
      // (a craft you were steering gone home, faded or sunk: back at her brig's helm)
      if (me >= 0 && b.ship(me).craft && b.ship(me).away > 0) { const was = b.ship(me); me = was.craft.by; say(`${was.name}'s gone home: you're back at ${b.ship(me).name}'s helm`); sailed(me); }
      if (!planning) bots.tick(b, dt, me >= 0 ? [me] : []);
      // (the bots' broadsides: fired through the rules, seen here as they fly)
      const ev = b.tick(dt);
      for (const got of b.fired.splice(0)) show(got);
      for (const { gun, e, hit, sunk } of ev.guns) {
        if (e.kind === 'fire') { turretFire(bastions[gun], e, v3(...e.to)); continue; }
        turretLand(bastions[gun], { ...e, hit: hit !== null });
        if (sunk) sank(ships[hit], v3(...e.to));
        if (hit !== null && hit === me) say(`The gate's gun has hit ${b.ship(hit).name}!`, true);
      }
      // A brig's craft launched off her sides: a splash each, seen; a turtle's ram, a great one where she struck; a
      // craft's time up, she fades.
      for (const { by, ids } of b.launches.splice(0)) {
        for (const id of ids) {
          const V = ships[id];
          V.m.visible = V.name.visible = true; V.ring.visible = true; V.fadeT = undefined; V.sinkT = 0; V.sinking = false; V.dl.reset(); V.look?.fade?.(1);
          const at = drawnAt(V.s.h, V.s.helm.now()), p = v3(at.c, at.r, 0.3);
          burst(p, V.craft === 'ghost' ? '#9fffd0' : '#e8f4fa', 18, 4);
        }
        const brig = b.ship(by), what = ships[ids[0]].craft === 'ram' ? 'her turtles' : 'her phantom sloops';
        saw(by, 'launch', 5);
        if (b.ship(by).team === (me >= 0 ? b.ship(me).team : admiral)) say(`${brig.name} launches ${what}`);
      }
      // (a frigate scraping her bottom in the shoals: sand and spray where she's aground)
      for (const sc of ev.scrapes) {
        const p = v3(...sc.at, 0.4);
        burst(p, '#d9c48e', 10, 3); burst(p, '#e8f4fa', 8, 2.5);
        if (sc.ship === me) say(`${b.ship(sc.ship).name} is scraping her bottom in the shoals!`, true);
        if (sc.sunk) sank(ships[sc.ship], p);
      }
      for (const r of ev.rams) {
        const V = ships[r.ram], O = ships[r.on], p = v3(...r.at, 0.6);
        V.fadeT = 0;
        burst(p, '#e8f4fa', 26, 6); burst(p, '#7d9a5c', 10, 3); burst(p, '#8a6a44', 10, 4);
        saw(r.on, 'hit', r.sunk ? 8 : 4);
        if (r.on === me) say(`${V.s.name} has rammed ${O.s.name}!`, true);
        if (r.sunk) sank(O, p);
      }
      for (const id of ev.faded) ships[id].fadeT = 0;
      if (ev.scored && me >= 0) {
        const mine = b.ship(me).team;
        say(`Turn scored: ${b.score.gold} to ${b.score.crimson}${b.leader() ? `, ${b.leader() === mine ? 'your side' : 'theirs'} ahead` : ''}`);
      }
      turretShotsTick(dt);
      bastions.forEach((V, i) => {
        const gun = b.battery[i], near = b.ships.map((s) => drawnAt(s.h, s.helm.now())).filter((p) => gun.reaches(Math.round(p.c), Math.round(p.r)));
        turretView(V, gun, dt, near.length ? v3(near[0].c, near[0].r) : v3(gun.at[0], gun.at[1] - 3));
      });
      for (const gl of gls) gl.tick(dt);
      // Each ship where her helm has her, riding the swell, heeling into her turns, her damage drawn on her.
      // (back after she sank: her holes gone, a splash where she comes in)
      for (const id of ev.returned) {
        const V = ships[id];
        V.dl.reset(); V.sinkT = 0; V.sinking = false; V.m.visible = true; V.name.visible = true;
        const at = drawnAt(V.s.h, V.s.helm.now()), p = v3(at.c, at.r, 0.3);
        burst(p, '#e8f4fa', 24, 5);
        if (id === me) say(`${V.s.name} is back, refitted: fight your way in again`); else saw(id, 'back', 4);
      }
      for (const V of ships) {
        const s = V.s, h = s.helm, at = drawnAt(s.h, h.now()), turning = h.cur && (h.cur.m === 'L' || h.cur.m === 'R') && !h.cur.bump && h.t < h.cur.secs;
        V.heel += ((turning ? (h.cur.m === 'L' ? -1 : 1) * (V.big ? 0.05 : 0.12) : 0) - V.heel) * Math.min(1, dt * 3);
        // (gone under: nothing more of her drawn, her smoke and crew with her)
        const [x, z] = seaXZ(at.c, at.r);
        // (near the camera, her crew drawn and at work; further off, only her: DETAIL)
        const far = Math.hypot(camera.position.x - x, camera.position.y, camera.position.z - z), near = far < DETAIL;
        if (V.helm) V.helm.visible = near;
        // (a big ship's deck furniture as near as her crew; her guns twice as far)
        if (V.look?.detail) { V.look.detail.furniture.visible = near; V.look.detail.guns.visible = far < DETAIL * 2; }
        const aboard = s.craft && s.away > 0 && !V.sinking, under = s.away > 0 && (aboard || (V.sinkT ?? 0) > SINK_SECS + 0.7), d = under ? { low: 0, list: 0, turn: 0 } : V.dl.tick(dt, s.dmg, { pending: V.pending, near });
        V.m.position.set(x, d.low + Math.sin(clock * (V.big ? 0.8 : 1.1) + s.id) * 0.05, z);
        V.m.rotation.set(V.heel + d.list, Math.PI / 2 - at.a * Math.PI / 2 + d.turn, Math.sin(clock * 0.6 + s.id) * 0.012, 'YXZ');
        V.look?.tick(dt);
        V.name.position.set(x, V.big ? 16 : V.brig ? 10 : V.craft === 'ram' ? 4 : 7.5, z);
        V.name.material.opacity = s.dmg.out ? 0.5 : 1;
        V.ring.position.set(x, 0.05, z); V.ring.visible = !s.dmg.out && !V.craft;   // (a brig's craft hold no buoy)
        V.ring.material.opacity = s.id === me || s.id === picked ? 0.6 : 0.28;
        // (her order's line, the admiral's side's ships)
        const tgt = admiral && s.team === admiral && s.away <= 0 ? orderTarget(b, bots.orderOf(s.id)) : null;
        V.line.visible = V.mark.visible = !!tgt;
        if (tgt) {
          V.mark.position.copy(v3(...tgt, 0.12)); V.mark.scale.setScalar(s.id === picked ? 1.3 + Math.sin(performance.now() / 250) * 0.15 : 1);
          const p = V.line.geometry.attributes.position, z0 = v3(at.c, at.r, 0.4), z1 = v3(...tgt, 0.4);
          p.setXYZ(0, z0.x, z0.y, z0.z); p.setXYZ(1, z1.x, z1.y, z1.z); p.needsUpdate = true;
          V.line.computeLineDistances(); V.line.material.opacity = s.id === picked ? 1 : 0.55;
        }
        // Sunk: she settles by the stern, bow lifting, and goes under (once the shot that did it has landed); then
        // she's gone till she comes back.
        // A craft back aboard her brig (faded, or rammed home): fading out where she was, then gone till she's launched.
        if (aboard) {
          V.fadeT = (V.fadeT ?? 99) + dt;
          const k = Math.max(0, 1 - V.fadeT / FADE_SECS);
          V.m.visible = k > 0; V.name.visible = false; V.ring.visible = false;
          V.look?.fade?.(k);
          if (V.craft === 'ghost' && k > 0 && Math.random() < dt * 8) burst(v3(at.c, at.r, 1), '#bfffe0', 3, 1.5);
        } else if (s.away > 0) {
          V.sinkT = (V.sinkT ?? 0) + dt;
          const k = Math.max(0, Math.min(1, (V.sinkT - 0.7) / SINK_SECS));
          V.m.visible = k < 1; V.name.visible = false; V.ring.visible = false;
          V.m.position.y = d.low - k * k * (V.big ? 10 : 5);
          V.m.rotation.z = k * 0.45;
          if (k > 0 && k < 1 && Math.random() < dt * 6) burst(v3(at.c, at.r, 0.2), '#d8eef6', 4, 2);
        }
      }
      // The buoys, by whose they are; contested, flickering.
      B.BUOYS.forEach((x, i) => {
        const hold = b.hold(x), col = hold === 'contested' ? (Math.sin(clock * 8) > 0 ? CONTEST_COL : NONE_COL) : hold ? TEAM_COL[hold] : NONE_COL;
        buoys[i].M.color.set(col);
        buoys[i].o.position.y = Math.sin(clock * 1.2 + i) * 0.1;
      });
      for (const t of lanes) t.offset.y -= dt * 2.2;
      for (const q of reefSheets) q.material.opacity = 0.92 + Math.sin(clock * 0.9) * 0.08;   // (the surf, breathing)
      // The followed frigate's reach: where her loaded sides' broadsides fall from where she lies and where her move
      // leaves her; nothing off her ends, nothing past a rock.
      const rf = reachOf >= 0 ? b.ship(reachOf) : null, cells = new Set();
      if (rf && rf.kind === 'frigate' && rf.away <= 0 && !rf.dmg.out) for (const at of [rf.helm.pose, rf.helm.after()]) for (const side of ['L', 'R']) for (const x of b.aim(rf.id, side, at, false)) for (const [c, r] of x.cells) cells.add(`${c},${r}`);
      const list = [...cells];
      reachSq.forEach((q, i) => { q.visible = i < list.length; if (q.visible) { const [c, r] = list[i].split(',').map(Number); q.position.copy(v3(c, r, 0.2)); } });
      // Your pin, your berth there, your course.
      const mine = me >= 0 ? b.ship(me) : null;
      pin.visible = !!mine?.helm.pin;
      if (pin.visible) pin.position.copy(v3(...mine.helm.pin, Math.sin(clock * 1.3) * 0.08));
      const block = mine ? mine.helm.berthSquares() : [];
      berth.forEach((q, i) => { q.visible = i < block.length; if (q.visible) q.position.copy(v3(...block[i], 0.07)); });
      const route = mine ? mine.helm.route().slice(1, dots.length + 1) : [];
      dots.forEach((d, i) => { d.visible = i < route.length; if (d.visible) { const p = drawnAt(mine.h, { c: route[i].c, r: route[i].r, a: route[i].d }); d.position.copy(v3(p.c, p.r, 0.08)); } });
      // Shots flying.
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i];
        if ((f.t += dt) < 0) continue;
        f.m.visible = true;
        const u = Math.min(1, f.t / f.dur);
        f.m.position.lerpVectors(f.a, f.z, u); f.m.position.y += Math.sin(Math.PI * u) * 0.9;
        if (u >= 1) { land(f); g.remove(f.m); flying.splice(i, 1); }
      }
      blastTick();
    },
    click(point) {
      if (me < 0) return;
      const [c, r] = seaCR(point.x, point.z).map(Math.round), s = b.ship(me);
      if (s.away > 0) return say(`She's gone down: she'll be back in ${Math.ceil(s.away)} seconds`, true);
      if (s.dmg.out) return say('She\'s dead in the water: her crew are rebuilding her', true);
      const got = b.drop(me, c, r);
      if (!got) say(`${s.name} can't get anywhere near there`, true);
      else if (Math.hypot(got[0] - c, got[1] - r) > 1.5) say(s.kind === 'frigate' && !b.gateOpen() && c >= B.HEART.c0 && c <= B.HEART.c1 && r >= B.HEART.r0 && r <= B.HEART.r1
        ? 'She can\'t get into the heart: a gate\'s way is one square wide. Lie broadside to a tower and fire (Q or E) to bring it down.'
        : `${s.name} can't get there from here, so she'll go as near as she can`, true);
    },
    key(k) {
      if (me < 0) return false;
      const s = b.ship(me), m = { w: 'F', arrowup: 'F', a: 'L', arrowleft: 'L', d: 'R', arrowright: 'R' }[k];
      if (m) { if (!b.put(me, m)) say(b.anchored(s) ? 'She\'s at anchor while her craft are out: G to weigh it' : 'That\'s a turn\'s worth put in already', true); return true; }
      if ((k === 'q' || k === 'e') && s.craft?.kind === 'ram') { say('A turtle has no guns: steer her beside a ship lying still and she rams it', true); return true; }
      if (k === 'q' || k === 'e') {
        const side = k === 'q' ? 'L' : 'R';
        if (s.dmg.out) say('She\'s dead in the water: her crew are rebuilding her', true);
        else if (!b.fire(me, side)) say(`Her ${SAY_GUN[side]} guns are loading`, true);
        return true;
      }
      if (k === 's' || k === 'backspace') { s.helm.unput(); return true; }
      // (a brig's: L launches her craft, dropping anchor; Tab moves your helm between her and each of them out, the
      // rest on autopilot (their bots); the user, 15 Nov)
      const brig = s.craft ? b.ship(s.craft.by) : s;
      if (k === 'l' && brig.kind === 'brig') {
        if (b.canLaunch(brig)) { b.launch(brig.id); say(`${brig.name} drops anchor and launches her craft: Tab to take one's helm, G to call them home`); }
        else if (b.craftOf(brig).some((x) => x.away <= 0)) say('Her craft are out already: Tab to take the helm of one', true);
        else if (brig.dmg.out) say('Dead in the water: her crew are rebuilding her', true);
        else say(`Her craft are being readied: ready in ${Math.ceil(B.LAUNCH.EVERY - (b.clock - brig.launched))}s`, true);
        return true;
      }
      if (k === 'tab' && brig.kind === 'brig') {
        const f = b.fleet(me);
        if (f.length < 2) { say('No craft out to steer: L launches them', true); return true; }
        me = f[(f.indexOf(me) + 1) % f.length];
        sailed(me);
        return true;
      }
      // (a brig at anchor, her craft out: G weighs it, calling them home)
      if (k === 'g' && brig.kind === 'brig') { say(b.weighAnchor(brig.id) ? `Weighing anchor: ${brig.name}'s craft called home` : b.anchored(brig) ? 'She\'s weighing anchor already' : 'She\'s not at anchor', !b.anchored(brig)); return true; }
      if (k === 'x') { s.helm.stop(); return true; }
      return false;
    },
    /** Where the camera looks: a ship (yours, or `id`), or the middle of the board. */
    /** The admiral's: whether the round's waiting on your plan; set it going; pick a ship of yours to order (-1:
        none); give her an order (FREE her own choice), or the order a click on the board gives her (what's there). */
    planning: () => planning,
    start() { planning = false; },
    pick(id) { picked = id; },
    picked: () => picked,
    order(id, o) { bots.order(id, o); },
    orderAt(id, point) {
      const [c, r] = seaCR(point.x, point.z).map(Math.round), s = b.ship(id), o = orderAt(b, s, c, r);
      if (o) bots.order(id, o);
      return o && orderText(b, o);
    },
    free: () => FREE,
    /** The strategies (src/blockade-orders.ts), and one picked for every ship of a kind on your side: what it is. */
    strategies: STRATEGIES,
    strategy(kind, i) {
      const st = STRATEGIES[kind][i];
      // (a brig's craft as her own bots have them: they've only a while)
      for (const s of b.ships) if (s.team === admiral && s.kind === kind && !s.craft) bots.order(s.id, st.order);
      return st;
    },
    /** The ship on the square a point on the sea is over (-1: none). */
    /** Shade a frigate's broadside reach on the water (-1: none). */
    showReach(id) { reachOf = id; },
    shipAt(point) { const [c, r] = seaCR(point.x, point.z).map(Math.round), s = b.under(c, r); return s ? s.id : -1; },
    focus(id = me) { if (id < 0) return v3(B.COLS / 2 - 0.5, B.ROWS / 2 - 0.5); const s = b.ship(id), at = drawnAt(s.h, s.helm.now()); return v3(at.c, at.r); },
    /** The ship most worth watching just now, spectating: the biggest thing that's happened lately (a knockout, a gate
        coming down, a hit), else a sloop darting out or a frigate fighting, else whoever's on the heart's prize. */
    director(now = clock) {
      const recent = action.filter((x) => now - x.at < 6).sort((a, z) => z.weight - a.weight || z.at - a.at)[0];
      if (recent) return recent.ship;
      const busy = b.ships.find((x) => /darting|fighting|shooting/.test(bots.doing(b, x.id)));
      return busy?.id ?? b.ships.find((x) => !x.dmg.out)?.id ?? 0;
    },
    hud() {
      const s = me >= 0 ? b.ship(me) : null, h = s?.helm;
      return {
        score: { ...b.score }, clock: b.clock, turn: b.turnT, over: b.over, leader: b.leader(),
        buoys: B.BUOYS.map((x) => ({ pennants: x.pennants, hold: b.hold(x), heart: x.at[0] >= B.HEART.c0 && x.at[0] <= B.HEART.c1 && x.at[1] >= B.HEART.r0 && x.at[1] <= B.HEART.r1 })),
        gates: b.gates.map((x) => ({ towers: x.towers.map((t) => t.hp), open: x.open() })),
        ships: b.ships.map((x) => ({ id: x.id, name: x.name, team: x.team, kind: x.kind, craft: x.craft?.kind ?? null, order: admiral === x.team ? orderText(b, bots.orderOf(x.id)) : null, share: x.away > 0 ? 0 : x.dmg.share(), water: x.away > 0 ? 0 : x.dmg.water, out: x.dmg.out || x.away > 0, away: x.away > 0, doing: x.id === me ? (x.away > 0 ? `yours, sunk: back in ${Math.ceil(x.away)}s` : 'yours') : bots.doing(b, x.id) })),
        me: s && { name: s.name, team: s.team, h: s.h, brig: (s.craft ? b.ship(s.craft.by) : s).kind === 'brig', craft: s.craft?.kind ?? null, fleet: b.fleet(me).length, moves: h.slot >= 0 ? h.turn : h.next(), lit: h.lit(), mine: h.mine.length, load: { L: s.guns.wait.L / s.h.reload, R: s.guns.wait.R / s.h.reload }, out: s.dmg.out },
      };
    },
  };
}
