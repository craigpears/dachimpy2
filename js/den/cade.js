// The tabletop blockade, drawn (TABLETOP-BLOCKADE.md): its rules src/cade.ts, the table src/cade-play.ts; this only
// draws what they say, on the unlinked cade-test.html, in the den's look and the 3D blockade's (the user, 17 Nov: "I
// definitely want the beauty of ... that new blockading thing for the 3D new concept one ... carrying through"). A
// real board from above on the den's sea, a square a square: its safe zones paler, its tall rocks the 3D blockade's
// clustered stones, its small rocks a pale ledge awash, its winds the den's wind lanes and its whirlpools the den's
// swirl (both sea-marks.js), its buoys with their float, white band and pennants in the colour of whoever holds them.
// The ships are the den's own (a sloop, a war brig and a war frigate as the 3D blockade draws them), each fitted to
// her square (every ship one square, as the rules have it; the bigger a little longer), her helmsman at the wheel, her
// crew at work, her holes where she's struck and her smoke when she's hurt (ship-damage.js, fed from the rules'
// damage), her influence a ring on the water, her name over her. A turn plays back slot by slot: her move (a straight
// run, a quarter circle for a turn, a nudge where she's stopped), the wind or the whirlpool, then the guns, muzzle
// flash, the ball flying out to whatever it hit, a splash, a hole, a sinking ship going down. Your plan's drawn ahead
// of you as you make it. The rules decide everything; nothing here changes them.
import * as THREE from 'three';
import { scene, mat, mesh, canvasTex, burst, makePirate } from './world.js';
import { bake } from './bake.js';
import { windMarks, swirlMesh } from './sea-marks.js';
import { damageLook } from './ship-damage.js';
import { sloopMesh, SLOOP_DECK } from './sloop.js';
import { frigateMesh } from './frigate.js';
import { FRIGATES, WAR_FRIGATE_PLAN, deckY } from '../den-frigate.js';
import { BRIGS, WAR_BRIG_PLAN } from '../den-brig.js';
import { SLOOP_HULL } from '../ships.js';
import { influence, tileAt } from '../cade.js';

export const CELL = 10;
export const SIDE_COL = ['#e0a92a', '#c8372a'];
const NONE_COL = '#b9b2a2', CONTEST_COL = '#f6f1e6';
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
/** Each side's ships' names, by kind, in the order they're met (the den's frigates and brigs by their configs). */
const NAMES = [
  { warFrigate: ['Primates Rule', 'Golden Grin'], warBrig: ['Pearl Diver', 'Tidecaller'], sloop: ['Little Monkey', 'Banana Boat', 'Quick Nut'] },
  { warFrigate: ['Crimson Tide', 'Iron Pride'], warBrig: ["Wraith's Wake", 'Grave Lantern'], sloop: ['Red Herring', 'Sea Wasp', 'Cutthroat'] },
];
const DRESS = [{ shirt: ['#f4efe4', '#1d1b20'], scarf: '#e0a92a' }, { shirt: ['#f4efe4', '#8a1f22'], scarf: '#d8b04e' }];
/** Each kind's crew on her deck (as the 3D blockade has them), the length she's drawn to fit her square, her look. */
const LOOKS = [
  { len: 0.52, crew: [{ x: 0.55, z: 0.35, job: 'carp' }, { x: 0.05, z: -0.35, job: 'bilge' }] },
  { len: 0.78, crew: [{ x: -0.4, z: 0.75, job: 'carp' }, { x: 1.9, z: -0.7, job: 'carp' }, { x: 0.9, z: 0.3, job: 'bilge' }] },
  { len: 0.96, crew: [{ x: -1.4, z: 1.15, job: 'carp' }, { x: 0.1, z: -1.15, job: 'carp' }, { x: 3.1, z: 1.05, job: 'carp' }, { x: -0.3, z: 0.25, job: 'bilge' }, { x: 1.5, z: -0.25, job: 'bilge' }] },
];
const GUN = { 1: 'small', 1.5: 'medium', 2: 'large' };
const dice = (c, r) => { let s = (c * 73856093) ^ (r * 19349663); return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

/** A label over a ship, in her side's colour. */
function label(text, col, w = 9) {
  const tex = canvasTex(512, 96, (g, W, H) => {
    g.fillStyle = 'rgba(28, 19, 12, 0.78)'; g.beginPath(); g.roundRect(4, 8, W - 8, H - 16, 20); g.fill();
    g.strokeStyle = col; g.lineWidth = 5; g.stroke();
    g.fillStyle = col; g.font = 'italic 700 44px Alegreya, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(w, w * 96 / 512, 1); s.renderOrder = 6;
  return s;
}

const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
/** A heading as the den's ships take it: their bows down +x, north (row 0's way) is -z. */
const yawOf = (face) => Math.PI / 2 - face * Math.PI / 2;
const turnDelta = (a, b) => { const d = (((b - a) % 4) + 4) % 4; return d === 3 ? -1 : d; };

/** The table drawn: `table` (src/cade-play.ts's Table). Returns { g, at(x, y), play(log) (a promise, done when the
 *  turn's played back), tick(dt, camera), show() (everything where the rules have it now), plan(path) (your plan
 *  ahead of you), focus() (your ship's middle), names() }. */
export function cadeView(table) {
  const b = table.board, g = new THREE.Group();
  scene.add(g);
  const at = (x, y, h = 0) => new THREE.Vector3((x + 0.5 - b.w / 2) * CELL, h, (y + 0.5 - b.h / 2) * CELL);
  const W = b.w * CELL, H = b.h * CELL;

  // ----- the board: the safe zones paler, its squares faintly, a line round it -----
  const safeM = new THREE.MeshBasicMaterial({ color: '#d8eef6', transparent: true, opacity: 0.14, depthWrite: false });
  for (let y = 0; y < b.h; y++) {
    if (![...Array(b.w).keys()].every((x) => tileAt(b, x, y).safe)) continue;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(W, CELL).rotateX(-Math.PI / 2), safeM);
    s.position.set(0, 0.03, at(0, y).z); s.renderOrder = 1; g.add(s);
  }
  const pts = [];
  for (let x = 0; x <= b.w; x++) pts.push(-W / 2 + x * CELL, 0.03, -H / 2, -W / 2 + x * CELL, 0.03, H / 2);
  for (let y = 0; y <= b.h; y++) pts.push(-W / 2, 0.03, -H / 2 + y * CELL, W / 2, 0.03, -H / 2 + y * CELL);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color: '#d9ecf5', transparent: true, opacity: 0.13, depthWrite: false })));
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => new THREE.Vector3(u * W / 2, 0.05, v * H / 2))),
    new THREE.LineBasicMaterial({ color: '#e7d3a3', transparent: true, opacity: 0.55 })));

  // ----- rocks: the tall ones clustered stones, the small ones a pale ledge awash; baked, as they never move -----
  const still = new THREE.Group();
  const stoneM = mat('#6b6158', { flatShading: true, roughness: 0.95 }), stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  const reefRockM = ['#6d6f68', '#7a776c', '#5d6660'].map((col) => mat(col, { flatShading: true, roughness: 0.95 }));
  const ledgeM = mat('#9fd0c4', { roughness: 1, transparent: true, opacity: 0.7 });
  const K = CELL / 4;   // (the 3D blockade's stones were laid on a square of 4)
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const t = tileAt(b, x, y), p = at(x, y), roll = dice(x, y);
    if (t.rock === 'tall') {
      for (let i = 0; i < 4; i++) {
        const s = (1.5 + roll() * 0.8) * K, m = mesh(stoneGeo, stoneM);
        m.scale.set(s * (0.9 + roll() * 0.3), s * (0.8 + roll() * 0.9), s * (0.9 + roll() * 0.3));
        m.position.set(p.x + ((i & 1) - 0.5) * 1.8 * K + (roll() - 0.5) * 0.6 * K, s * 0.35, p.z + ((i >> 1) - 0.5) * 1.8 * K + (roll() - 0.5) * 0.6 * K);
        m.rotation.set(roll() * 3, roll() * 3, roll() * 3);
        still.add(m);
      }
    } else if (t.rock === 'small') {
      const ledge = mesh(new THREE.CylinderGeometry(CELL * 0.48, CELL * 0.55, 0.2, 10), ledgeM, false); ledge.position.set(p.x, -0.02, p.z); ledge.rotation.y = roll() * 3; still.add(ledge);
      for (let i = 0; i < 5; i++) {
        const sz = (0.45 + roll() * 0.4) * K, m = mesh(stoneGeo, reefRockM[Math.floor(roll() * reefRockM.length)]);
        m.scale.set(sz * (1.1 + roll() * 0.5), sz * 0.45, sz * (1.1 + roll() * 0.5));
        m.position.set(p.x + (roll() - 0.5) * 2.8 * K, 0.05, p.z + (roll() - 0.5) * 2.8 * K);
        m.rotation.set(0, roll() * 3, 0);
        still.add(m);
      }
    }
  }
  g.add(bake(still));

  // ----- winds, each straight run of squares blowing one way a lane; whirlpools the den's swirl -----
  const lanes = [], swirls = [];
  const windAt = (x, y) => tileAt(b, x, y)?.wind;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const d = windAt(x, y);
    if (d === undefined || windAt(x - DX[d], y - DY[d]) === d) continue;   // (not the start of its run)
    let n = 1;
    while (windAt(x + DX[d] * n, y + DY[d] * n) === d) n++;
    const lane = windMarks(CELL, n), mid = at(x + DX[d] * (n - 1) / 2, y + DY[d] * (n - 1) / 2);
    lane.g.position.set(mid.x, 0, mid.z); lane.g.rotation.y = -d * Math.PI / 2;
    g.add(lane.g); lanes.push(lane.tex);
  }
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (tileAt(b, x, y).whirl !== 0) continue;
    const o = swirlMesh(CELL), p = at(x + 0.5, y + 0.5);
    o.position.set(p.x, 0.06, p.z); g.add(o); swirls.push(o);
  }

  // ----- the buoys: a float, a pole, its pennants; all coloured by whose it is -----
  const buoys = influence(b, []).buoys.map((bu) => {
    const o = new THREE.Group(), M = new THREE.MeshStandardMaterial({ color: NONE_COL, roughness: 0.5 }), white = mat('#f3ecdc');
    o.add(mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.8, 14), M), mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.6, 6).translate(0, 3.3, 0), mat('#4a2f1a')));
    o.add(mesh(new THREE.CylinderGeometry(1.0, 1.02, 0.36, 14).translate(0, 0.36, 0), white));
    for (let i = 0; i < bu.points; i++) { const p = mesh(new THREE.ConeGeometry(0.55, 1.6, 3).rotateZ(-Math.PI / 2), M); p.scale.set(1, 1, 0.15); p.position.set(0.85, 5.7 - i * 1.1, 0); o.add(p); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(CELL * 0.34, CELL * 0.4, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: NONE_COL, transparent: true, opacity: 0.6, depthWrite: false }));
    ring.position.y = 0.08; ring.renderOrder = 2; o.add(ring);
    o.position.copy(at(bu.x, bu.y)); g.add(o);
    return { ...bu, o, M, ring, ph: Math.random() * 6 };
  });
  const paintBuoys = (held) => {
    for (const [i, bu] of buoys.entries()) {
      const h = held[i]?.holder ?? null;
      const col = h === 0 || h === 1 ? SIDE_COL[h] : h === 'contested' ? CONTEST_COL : NONE_COL;
      bu.M.color.set(h === 'contested' ? '#2a2420' : col); bu.ring.material.color.set(col);
    }
  };

  // ----- the ships: each her own look, her helmsman, her crew and her damage, her ring, her name -----
  const counts = [{}, {}], ships = new Map();
  let holeId = 0;
  for (const s of table.cade.ships) {
    const k = s.kind.id, n = counts[s.side][k] ?? 0;
    counts[s.side][k] = n + 1;
    const name = (NAMES[s.side][k] ?? [])[n] ?? `${s.kind.name} ${n + 1}`;
    const cls = Math.min(2, s.kind.cls), plan = cls === 2 ? WAR_FRIGATE_PLAN : cls === 1 ? WAR_BRIG_PLAN : null;
    const look = cls === 2 ? frigateMesh(FRIGATES[name] ?? FRIGATES['Primates Rule']).g : cls === 1 ? frigateMesh(BRIGS[name] ?? BRIGS.Tidecaller, WAR_BRIG_PLAN).g : bake(sloopMesh());
    const hull = plan ? plan.hull : SLOOP_HULL, deck = plan ? deckY(plan, 'waist') : SLOOP_DECK;
    look.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const holder = new THREE.Group(), body = new THREE.Group();
    body.scale.setScalar(CELL * LOOKS[cls].len / hull.len);
    body.add(look); holder.add(body);
    const helm = makePirate(DRESS[s.side]).g;
    helm.position.set(plan ? plan.helm.x - 0.6 : -1.15, plan ? deckY(plan, 'quarter') : SLOOP_DECK, 0); helm.rotation.y = Math.PI / 2; look.add(helm);
    const dmg = { holes: [], water: 0, out: false, share: () => s.damage / s.kind.sinks };
    const dl = damageLook(look, hull, { deck, crew: LOOKS[cls].crew, dress: DRESS[s.side] });
    const col = SIDE_COL[s.side], you = s.id === table.me;
    const R = Math.max(0.42, s.kind.influence / 2) * CELL;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.3, R, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: you ? 0.5 : 0.28, depthWrite: false }));
    ring.position.y = 0.09; ring.renderOrder = 2; holder.add(ring);
    const tag = label(you ? `${name} (you)` : name, col);
    tag.position.y = 5 + cls * 2.5; holder.add(tag);
    g.add(holder);
    ships.set(s.id, { s, name, holder, body, look, ring, tag, dl, dmg, sinking: 0, pending: new Set() });
  }
  /** Her holes kept to her damage: a hole for each share of it, the oldest patched first as her crew mend her. */
  const keepHoles = (V) => {
    const most = Math.ceil(V.dmg.share() * 10 - 1e-9);
    while (V.dmg.holes.length > most) V.dmg.holes.shift();
  };
  const place = (V) => { V.holder.position.copy(at(V.s.x, V.s.y)); V.body.rotation.set(0, yawOf(V.s.face), 0); V.body.position.y = 0; };
  const show = () => {
    for (const V of ships.values()) {
      if (V.sinking && !V.s.sunk) { V.sinking = 0; V.dmg.holes = []; V.dl.reset(); }
      V.holder.visible = !V.s.sunk; place(V); keepHoles(V);
    }
    paintBuoys(influence(b, table.cade.ships).buoys);
  };

  // ----- your plan, ahead of you: a mark a slot, the line between, red where she'd hit something -----
  const ghosts = new THREE.Group(); g.add(ghosts);
  const ghostM = new THREE.MeshBasicMaterial({ color: '#ffe7a6', transparent: true, opacity: 0.75, depthWrite: false });
  const ghostBad = new THREE.MeshBasicMaterial({ color: '#ff7b5a', transparent: true, opacity: 0.85, depthWrite: false });
  const arrowGeo = new THREE.ConeGeometry(1.3, 3.2, 3).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2);
  const plan = (path) => {
    ghosts.clear();
    if (!path) return;
    const me = table.you;
    let prev = at(me.x, me.y, 0.4);
    for (const [i, step] of path.entries()) {
      const [x, y, face] = step.to, p = at(x, y, 0.4), bad = step.rock || step.stopped;
      if (!p.equals(prev)) ghosts.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([prev, p]), new THREE.LineDashedMaterial({ color: '#ffe7a6', dashSize: 1.2, gapSize: 0.8 })).computeLineDistances());
      const a = new THREE.Mesh(arrowGeo, bad ? ghostBad : ghostM); a.position.copy(p); a.rotation.y = yawOf(face); a.renderOrder = 3; ghosts.add(a);
      const n = label(String(i + 1), bad ? '#ff7b5a' : '#ffe7a6', 2.6); n.position.set(p.x, 3, p.z); ghosts.add(n);
      prev = p;
    }
  };

  // ----- a turn played back -----
  const SLOT = 1.3, MOVE = 0.42, WIND = [0.42, 0.66], GUNS = 0.68;
  let playing = null;
  const balls = [];
  const ballGeo = new THREE.SphereGeometry(1, 10, 8), ballM = mat('#1b1a1c', { metalness: 0.5, roughness: 0.4 });

  /** Where she is a fraction `u` through her move: a straight run, a quarter circle round its pivot for a turn, a
   *  nudge out and back where she's stopped in her first square. */
  function moveAt(tr, u) {
    const [x0, y0, f0] = tr.from, [x1, y1, f1] = tr.moved, turn = f0 + turnDelta(f0, f1) * u;
    if ((tr.move === 'L' || tr.move === 'R') && !tr.stopped && !tr.shoved) {
      const px = x0 + DX[f1], py = y0 + DY[f1], th = u * Math.PI / 2;
      return [px - DX[f1] * Math.cos(th) + DX[f0] * Math.sin(th), py - DY[f1] * Math.cos(th) + DY[f0] * Math.sin(th), turn];
    }
    if (tr.move && tr.stopped === 1 && x0 === x1 && y0 === y1) { const k = Math.sin(u * Math.PI) * 0.22; return [x0 + DX[f0] * k, y0 + DY[f0] * k, turn]; }
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, turn];
  }
  /** Where the wind or the whirlpool has her: a straight push, or half way round the whirlpool's middle, clockwise. */
  function windAtU(tr, u) {
    const [x0, y0, f0] = tr.moved, [x1, y1, f1] = tr.to, turn = f0 + turnDelta(f0, f1) * u;
    if (tr.wind === 'whirl' && !tr.windStopped && (x0 !== x1 || y0 !== y1)) {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, vx = x0 - cx, vy = y0 - cy, th = u * Math.PI;
      return [cx + vx * Math.cos(th) - vy * Math.sin(th), cy + vx * Math.sin(th) + vy * Math.cos(th), turn];
    }
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, turn];
  }

  function play(log) {
    plan(null);
    return new Promise((done) => { playing = { log, t: 0, done, fired: new Set(), sunk: new Set() }; });
  }

  /** A shot come down: a splash in open water, stone chips off a rock, or a hole in her where she was struck. */
  function land(bl) {
    const z = bl.to;
    if (bl.hit === 'rock') burst(z, '#9a9088', 14, 4);
    else if (bl.hit) {
      const V = ships.get(bl.hit);
      if (V && !V.sinking) {
        const f = V.s.face, from = (bl.d + 2) % 4;
        const side = from === (f + 1) % 4 ? 'R' : from === (f + 3) % 4 ? 'L' : 'deck';
        V.dmg.holes.push({ id: holeId++, gun: bl.gun, along: Math.random() - 0.5, side });
        if (V.dmg.holes.length > 12) V.dmg.holes.shift();
      }
      burst(z, '#ffb85a', 14, 4);
    } else { burst(z.clone().setY(0.1), '#e8f4fa', 16, 4); burst(z.clone().setY(0.1), '#9cc8d4', 8, 2.5); }
  }

  function tick(dt, camera) {
    for (const tex of lanes) tex.offset.y -= dt * 2.2;
    for (const o of swirls) o.rotation.z += dt * o.userData.speed;
    const clock = performance.now() / 1000;
    for (const bu of buoys) { bu.o.position.y = Math.sin(clock * 1.4 + bu.ph) * 0.12; bu.o.rotation.z = Math.sin(clock * 1.1 + bu.ph) * 0.04; }
    for (const V of ships.values()) {
      if (!V.holder.visible) continue;
      const near = !camera || camera.position.distanceTo(V.holder.position) < 110;
      const d = V.dl.tick(dt, V.dmg, { pending: V.pending, near });
      if (!V.sinking) { V.body.position.y = d.low * V.body.scale.x; V.body.rotation.z = Math.sin(clock * 1.2 + V.s.id) * 0.02 + d.list; V.body.rotation.x = 0; }
      else {
        V.sinking = Math.min(1, V.sinking + dt / 2.4);
        V.body.position.y = -V.sinking * 6; V.body.rotation.x = V.sinking * 0.6; V.body.rotation.y += dt * 1.2 * (1 - V.sinking);
        V.tag.visible = V.ring.visible = V.sinking < 0.3;
      }
    }
    for (const bl of balls) {
      bl.t += dt / bl.dur;
      if (bl.t < 0) continue;
      const k = clamp01(bl.t);
      bl.m.visible = k < 1;
      bl.m.position.lerpVectors(bl.from, bl.to, k); bl.m.position.y += Math.sin(k * Math.PI) * 1.8;
      if (k >= 1 && !bl.done) { bl.done = true; land(bl); }
    }
    for (let i = balls.length - 1; i >= 0; i--) if (balls[i].done) { g.remove(balls[i].m); balls.splice(i, 1); }
    if (!playing) return;
    const P = playing;
    P.t += dt / SLOT;
    if (P.t >= 4) {
      // the turn's end: everyone where the rules have them, the sunk back on their edges, the buoys repainted
      playing = null;
      for (const V of ships.values()) V.tag.visible = V.ring.visible = true;
      show();
      P.done();
      return;
    }
    const slot = Math.floor(P.t), f = P.t - slot, sl = P.log.slots[slot];
    for (const [id, tr] of sl.tracks) {
      const V = ships.get(id);
      if (!V || V.sinking) continue;
      const pose = f < MOVE ? moveAt(tr, ease(f / MOVE)) : f < WIND[1] ? windAtU(tr, ease(clamp01((f - WIND[0]) / (WIND[1] - WIND[0])))) : tr.to;
      const p = at(pose[0], pose[1]);
      V.holder.position.set(p.x, 0, p.z); V.body.rotation.y = yawOf(pose[2]);
      if (tr.rock && f > MOVE * 0.6 && !P.fired.has(`rock${slot}:${id}`)) { P.fired.add(`rock${slot}:${id}`); burst(p.clone().setY(1), '#9a9088', 10, 3); }
    }
    if (f >= GUNS && !P.fired.has(slot)) {
      P.fired.add(slot);
      for (const sh of sl.shots) {
        const tr = sl.tracks.get(sh.from), [x, y, face] = tr.to, d = (face + (sh.side === 'left' ? 3 : 1)) % 4, n = sh.range ?? 3;
        const shooter = ships.get(sh.from), gun = GUN[shooter.s.kind.shot] ?? 'small';
        const a = at(x + DX[d] * 0.35, y + DY[d] * 0.35, 1.4 + Math.min(2, shooter.s.kind.cls) * 0.6);
        burst(a, '#ffcf6a', 10, 3); burst(a, '#cfc6b8', 8, 1.5);
        for (let i = 0; i < sh.count; i++) {
          const m = new THREE.Mesh(ballGeo, ballM); m.scale.setScalar({ small: 0.3, medium: 0.38, large: 0.46 }[gun]); m.visible = false; g.add(m);
          const hit = sh.hit === 'rock' ? 'rock' : sh.hit ? sh.hit.ship : null;
          const to = at(x + DX[d] * (hit === null ? n + 0.3 : n), y + DY[d] * (hit === null ? n + 0.3 : n), hit === null ? 0.1 : 1.2);
          balls.push({ m, from: a, to, t: -i * 0.14, dur: 0.12 * n + 0.18, hit, d, gun, done: false });
        }
      }
    }
    if (f >= 0.97) for (const id of sl.sunk) if (!P.sunk.has(id)) {
      P.sunk.add(id);
      const V = ships.get(id);
      if (V) { V.sinking = 0.001; const z = V.holder.position.clone().setY(0.3); burst(z, '#e8f4fa', 30, 6); burst(z, '#9cc8d4', 18, 4); }
    }
  }

  show();
  return {
    g, at, play, tick, show, plan,
    get playing() { return !!playing; },
    focus: () => at(table.you.x, table.you.y),
    /** Your ship where she's drawn now, mid-turn too (for the camera to follow). */
    shipNow: () => ships.get(table.me).holder.position.clone(),
    names: () => new Map([...ships].map(([id, V]) => [id, V.name])),
    size: { w: W, h: H },
  };
}
