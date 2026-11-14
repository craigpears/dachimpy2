// A war frigate and a sloop on one small sea, in 3D: the proof of concept on the unlinked frigate-test.html
// (IDEAS.md, "A war frigate and a sloop on one board"; RACE.md §11). Its rules are src/two-ships.ts (the sea,
// its narrow gap and its boom, both ships on it) and src/ship-handling.ts (each ship's handling on the squares,
// sailed by the den's own helm); this only draws them: the rocks, the boom of chained logs across the channel,
// the buoy to make for, the squares each ship covers, her pin and course, the shots. The ships are the den's
// own (js/den/frigate.js, js/den/sloop.js), handed in.
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { TwoShips, TWO_SEA, KINDS, seaXZ, seaCR } from '../two-ships.js';
import { squares, drawnAt } from '../ship-handling.js';
import { scene, mat, mesh, woodTex, burst, sparks } from './world.js';
import { blast, puff, blastTick } from './blast.js';

const CELL = SAIL.CELL, NAME = { sloop: 'Your sloop', frigate: 'Primates Rule' };
const v3 = (c, r, y = 0) => { const [x, z] = seaXZ(c, r); return new THREE.Vector3(x, y, z); };
/** A little seeded dice per square, so the rocks look the same every time. */
const dice = (c, r) => { let s = (c * 73856093) ^ (r * 19349663); return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

/** The test sea, the two ships on it. `ships`: { sloop, frigate } their meshes (groups, bow toward +x, the
    waterline at y 0). `say(text, bad)`: what's said (a toast on the page). Returns { t (the rules: TwoShips),
    g, on(bool), tick(dt), click(point) (a point on the water: drops the active ship's pin), key(k) (W A D
    moves, Q E broadsides, X stop: whether it was one), focus() (where the active ship's drawn), hud() }. */
export function twoShipsSea(ships, say = () => {}) {
  const t = new TwoShips(), g = new THREE.Group();
  g.visible = false;
  scene.add(g);

  // ----- the board's squares, faintly, so you see what fits where -----
  const pts = [], x0 = -TWO_SEA.COLS / 2 * CELL, z0 = -TWO_SEA.ROWS / 2 * CELL;
  for (let c = 0; c <= TWO_SEA.COLS; c++) pts.push(x0 + c * CELL, 0.03, z0, x0 + c * CELL, 0.03, -z0);
  for (let r = 0; r <= TWO_SEA.ROWS; r++) pts.push(x0, 0.03, z0 + r * CELL, -x0, 0.03, z0 + r * CELL);
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color: '#d9ecf5', transparent: true, opacity: 0.18, depthWrite: false }));
  g.add(grid);

  // ----- the rocks: the line across the sea, and a few more -----
  const stoneM = mat('#6b6158', { flatShading: true, roughness: 0.95 }), stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  for (const k of t.rocks) {
    const [c, r] = k.split(',').map(Number);
    if (t.boom.has(c, r)) continue;
    const roll = dice(c, r), at = v3(c, r);
    // (filling its square, so a line of them reads as a wall and a gap in it as a gap)
    for (let i = 0; i < 4; i++) {
      const s = 1.5 + roll() * 0.8, m = mesh(stoneGeo, stoneM);
      m.scale.set(s * (0.9 + roll() * 0.3), s * (0.8 + roll() * 0.9), s * (0.9 + roll() * 0.3));
      m.position.set(at.x + ((i & 1) - 0.5) * 1.8 + (roll() - 0.5) * 0.6, s * 0.35, at.z + ((i >> 1) - 0.5) * 1.8 + (roll() - 0.5) * 0.6);
      m.rotation.set(roll() * 3, roll() * 3, roll() * 3);
      g.add(m);
    }
  }

  // ----- the boom: chained logs across the channel, posts at its ends -----
  const logM = mat('#7a5634', { map: woodTex, roughness: 0.9 }), ironM = mat('#2b2a2c', { metalness: 0.6, roughness: 0.5 });
  const logs = [], { c0, c1 } = TWO_SEA.CHANNEL, R = TWO_SEA.BOOM.r;
  for (let c = c0; c <= c1; c++) for (const dx of [-1, 1]) {
    const L = new THREE.Group(), at = v3(c, R);
    L.add(mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.95, 10).rotateZ(Math.PI / 2), logM));
    for (const bx of [-0.6, 0.6]) L.add(mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 10).rotateZ(Math.PI / 2).translate(bx, 0, 0), ironM));
    L.position.set(at.x + dx, 0.12, at.z);
    L.userData = { x: L.position.x, z: L.position.z, ph: logs.length * 1.7, knock: 0, v: null };
    logs.push(L); g.add(L);
  }
  for (const c of [c0 - 0.5, c1 + 0.5]) {
    const at = v3(c, R), post = mesh(new THREE.CylinderGeometry(0.3, 0.36, 3.2, 8), logM);
    post.position.set(at.x, 1.2, at.z); g.add(post);
    const cap = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 8), ironM); cap.position.set(at.x, 2.8, at.z); g.add(cap);
  }
  let brokeAt = -1;

  // ----- the buoy to make for -----
  const goal = new THREE.Group(), gold = mat('#e0a92a', { metalness: 0.4, roughness: 0.4 }), red = mat('#c8372a', { roughness: 0.6 }), white = mat('#f3ecdc');
  goal.add(mesh(new THREE.CylinderGeometry(0.6, 0.85, 1.4, 14), red), mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.3, 14).translate(0, 0.25, 0), white));
  goal.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6).translate(0, 2.2, 0), mat('#4a2f1a')));
  const flag = mesh(new THREE.ConeGeometry(0.45, 1.2, 3).rotateZ(-Math.PI / 2), gold); flag.scale.set(1, 1, 0.15); flag.position.set(0.6, 3.3, 0); goal.add(flag);
  goal.position.copy(v3(...TWO_SEA.GOAL)); g.add(goal);

  // ----- each ship's squares, her pin and the active one's course -----
  const sqGeo = new THREE.PlaneGeometry(CELL * 0.9, CELL * 0.9).rotateX(-Math.PI / 2);
  const sqMat = { on: new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.22, depthWrite: false }), off: new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.09, depthWrite: false }) };
  const pool = (n, make) => Array.from({ length: n }, () => { const m = make(); m.visible = false; g.add(m); return m; });
  const marks = { sloop: pool(4, () => new THREE.Mesh(sqGeo, sqMat.off)), frigate: pool(16, () => new THREE.Mesh(sqGeo, sqMat.off)) };
  const dotGeo = new THREE.CircleGeometry(0.4, 14).rotateX(-Math.PI / 2), dotM = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.7, depthWrite: false });
  const dots = pool(24, () => new THREE.Mesh(dotGeo, dotM));
  const pinOf = (col) => {
    const p = new THREE.Group(), m = mat(col, { roughness: 0.6 });
    p.add(mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.7, 12).translate(0, 0.2, 0), m), mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6).translate(0, 1.2, 0), mat('#4a2f1a')));
    const pen = mesh(new THREE.ConeGeometry(0.24, 0.6, 3).rotateZ(-Math.PI / 2), m); pen.scale.set(1, 1, 0.15); pen.position.set(0.3, 1.75, 0); p.add(pen);
    p.visible = false; g.add(p); return p;
  };
  const pins = { sloop: pinOf('#c8372a'), frigate: pinOf('#2a2a2e') };

  // ----- shots in flight -----
  const ballGeo = new THREE.SphereGeometry(1, 10, 8), ballM = mat('#1b1a1c', { metalness: 0.5, roughness: 0.4 }), flying = [];
  const hitSay = { hit: () => `A hit! The boom's splintering: ${t.boom.hp} more large shot${t.boom.hp === 1 ? '' : 's'} to break it.`, bounced: () => 'Your sloop\'s small guns bounce off the boom: it would take a war frigate\'s.', broken: () => 'The boom\'s smashed: the channel\'s open, for either ship.' };
  function fire(side) {
    const kind = t.active, s = t.ships[kind], got = t.fire(side);
    if (!got) { say(`${NAME[kind]}'s ${side === 'L' ? 'port' : 'starboard'} guns are loading.`, true); return; }
    const y = kind === 'frigate' ? 2.2 : 1.1, size = s.h.guns === 'large' ? 0.24 : 0.14;
    got.shots.forEach((shot, i) => {
      const end = shot.hit ?? shot.cells[shot.cells.length - 1], a = v3(...shot.from, y), b = v3(...end, shot.what === 'rock' ? 1.2 : 0.6);
      const m = new THREE.Mesh(ballGeo, ballM); m.scale.setScalar(size); m.position.copy(a); m.visible = false; g.add(m);
      flying.push({ m, a, b, t: -i * 0.12, dur: 0.1 * shot.cells.length + 0.15, shot });
    });
    const booms = got.shots.map((sh) => sh.boom), said = booms.includes('broken') ? 'broken' : booms.find(Boolean);
    if (said) say(hitSay[said](), said === 'bounced');
    else if (got.shots.some((sh) => sh.what === t.other(kind))) say(`A hit on ${NAME[t.other(kind)].replace('Your', 'your')}!`);
  }
  function land(f) {
    const { shot, b } = f;
    if (shot.what === 'rock') burst(b, '#9a9088', 14, 4);
    else if (shot.what === 'boom') {
      burst(b, shot.boom === 'bounced' ? '#f2e2a0' : '#8a6240', shot.boom === 'bounced' ? 8 : 22, shot.boom === 'bounced' ? 3 : 6);
      if (shot.boom === 'hit') { const L = logs[Math.floor(Math.random() * logs.length)]; L.userData.knock = Math.min(1, L.userData.knock + 0.5); }
      if (shot.boom === 'broken') breakBoom();
    } else if (shot.what) burst(b.clone().setY(2), '#ff9a3a', 20, 5);
    else burst(b.clone().setY(0.1), '#e8f4fa', 16, 4);   // (a splash)
  }
  function breakBoom() {
    brokeAt = 0;
    blast(v3((c0 + c1) / 2, R, 0.6), 1.4, { bits: [{ mat: logM, n: 10, w: 0.25, h: 0.25, d: 1.0 }], ground: () => -0.5 });
    logs.forEach((L, i) => { L.userData.v = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (i % 2 ? 1 : -1) * (1 + Math.random() * 1.5)); });
  }

  let on = false, clock = 0, told = { sloop: false, frigate: false };
  const place = (kind) => {
    const s = t.ships[kind], at = drawnAt(s.h, s.helm.now()), [x, z] = seaXZ(at.c, at.r), m = ships[kind];
    m.position.set(x, Math.sin(clock * (kind === 'sloop' ? 1.1 : 0.8)) * 0.04, z);
    m.rotation.set(0, Math.PI / 2 - at.a * Math.PI / 2, Math.sin(clock * (kind === 'sloop' ? 0.9 : 0.6)) * (kind === 'sloop' ? 0.03 : 0.012));
  };
  const show = (kind) => {
    const s = t.ships[kind], act = kind === t.active, cov = [...s.helm.covers()].map((k) => k.split(',').map(Number));
    marks[kind].forEach((m, i) => { m.visible = i < cov.length; if (m.visible) { m.material = act ? sqMat.on : sqMat.off; m.position.copy(v3(...cov[i], 0.05)); } });
    const p = s.helm.pin; pins[kind].visible = !!p; if (p) pins[kind].position.copy(v3(...p));
  };
  /** Her course ahead, a dot a square (the active ship's). */
  const course = () => {
    const { helm, sea } = t.ships[t.active], out = [];
    let p = helm.after();
    for (const m of helm.course()) { const to = sea.sail(p, m).to; if (to.c === p.c && to.r === p.r) break; p = to; out.push(p); if (out.length >= dots.length) break; }
    dots.forEach((d, i) => { d.visible = i < out.length; if (d.visible) d.position.copy(v3(out[i].c, out[i].r, 0.07)); });
  };

  return {
    t, g,
    on(v) { on = v; g.visible = v; told = { sloop: false, frigate: false }; },
    tick(dt) {
      if (!on) return;
      clock += dt;
      const ev = t.tick(dt);
      for (const k of KINDS) {
        if (ev[k].some((e) => e.kind === 'move' && e.bump) && k === t.active) say(`${NAME[k]} can't go that way: she hasn't room.`, true);
        if (!told[k] && t.through(k)) { told[k] = true; say(`${NAME[k]}'s through the rocks!`); }
        place(k); show(k);
      }
      course();
      flag.rotation.y = Math.sin(clock * 1.3) * 0.3;
      for (const L of logs) {
        const u = L.userData;
        if (u.v) { L.position.addScaledVector(u.v, dt); u.v.multiplyScalar(1 - 0.4 * dt); L.position.y = 0.12 - Math.min(2, brokeAt * 0.25); L.rotation.y += dt * u.v.x * 0.2; continue; }
        L.position.y = 0.12 + Math.sin(clock * 1.2 + u.ph) * 0.06 - u.knock * 0.25;
        L.rotation.set(Math.sin(clock + u.ph) * 0.05, u.knock * 0.5 * (u.ph % 2 ? 1 : -1), u.knock * 0.25);
      }
      if (brokeAt >= 0) brokeAt += dt;
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i];
        f.t += dt;
        if (f.t < 0) continue;
        if (!f.m.visible) { f.m.visible = true; puff(f.a.clone(), { size: 0.7, life: 1.6, rise: 0.6, dark: 0.15 }); }
        const u = Math.min(1, f.t / f.dur);
        f.m.position.lerpVectors(f.a, f.b, u); f.m.position.y += Math.sin(Math.PI * u) * 0.8;
        if (u >= 1) { land(f); g.remove(f.m); flying.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.userData.v.y -= 7 * dt; s.position.addScaledVector(s.userData.v, dt);
        s.rotation.x += dt * 6; s.rotation.y += dt * 4;
        s.userData.life -= dt; s.scale.setScalar(Math.max(0, s.userData.life));
        if (s.userData.life <= 0) { scene.remove(s); sparks.splice(i, 1); }
      }
      blastTick();
    },
    /** Steer the one you're steering by the square you've clicked. */
    click(point) {
      const [c, r] = seaCR(point.x, point.z).map(Math.round), kind = t.active, got = t.drop(c, r);
      if (!got) return say(`${NAME[kind]} can't get anywhere near there.`, true);
      if (got.short) say(kind === 'frigate' && !t.boom.broken()
        ? 'Primates Rule can\'t get through: the gap\'s too narrow for her, and the boom\'s across the channel. Lie broadside to the boom and fire (Q or E).'
        : `${NAME[kind]} can't get there from here, so she'll go as near as she can.`, true);
    },
    key(k) {
      const m = { w: 'F', arrowup: 'F', a: 'L', arrowleft: 'L', d: 'R', arrowright: 'R' }[k];
      if (m) { if (!t.put(m)) say('That\'s a turn\'s worth put in already.', true); return true; }
      if (k === 'q' || k === 'e') { fire(k === 'q' ? 'L' : 'R'); return true; }
      if (k === 'x') { t.ships[t.active].helm.stop(); return true; }
      return false;
    },
    /** Steer the other ship. */
    swap(kind = t.other(t.active)) { t.active = kind; },
    focus() { const s = t.ships[t.active], at = drawnAt(s.h, s.helm.now()); return v3(at.c, at.r); },
    /** What the bar shows: the turn being played (or the next), her moves a turn, which is lit, guns loaded. */
    hud() {
      const s = t.ships[t.active], h = s.helm, moves = h.slot >= 0 ? h.turn : h.next();
      return { kind: t.active, name: NAME[t.active], h: s.h, moves, lit: h.lit(), mine: h.mine.length, guns: { L: s.guns.ready('L'), R: s.guns.ready('R') }, boom: t.boom.hp, through: t.through(t.active) };
    },
  };
}
