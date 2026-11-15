// A war frigate and a sloop on one small sea, in 3D: the proof of concept on the unlinked frigate-test.html
// (IDEAS.md, "A war frigate and a sloop on one board"; RACE.md §11). Its rules are src/two-ships.ts (the sea,
// its imperial gate, both ships on it) and src/ship-handling.ts (each ship's handling on the squares,
// sailed by the den's own helm); this only draws them: the rocks, the imperial gate over the channel (the
// Empire's gatehouse, empire.js, over its one-square way, its towers crumbling under a war frigate's large shots;
// a bastion gun either side, the den's destructible gun, turret.js), the buoy to make for, the squares each ship covers, her pin and course,
// the shots, and a ship holed by one (holed.js, as the race's sloops are). The ships are the den's own
// (js/den/frigate.js, js/den/sloop.js), handed in.
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { TwoShips, TWO_SEA, KINDS, seaXZ, seaCR } from '../two-ships.js';
import { squares, drawnAt } from '../ship-handling.js';
import { scene, mat, mesh, burst, sparks } from './world.js';
import { blast, puff, blastTick } from './blast.js';
import { gatehouse, bastionLook } from './empire.js';
import { turretMesh, turretView, turretWrecked, turretFire, turretLand, turretShotsTick } from './turret.js';
import { holedLook, holedTick, holedFx } from './holed.js';
import { SLOOP_DECK } from './sloop.js';
import { WAR_FRIGATE_PLAN, deckY } from '../den-frigate.js';

const CELL = SAIL.CELL, NAME = { sloop: 'Your sloop', frigate: 'Primates Rule' };
/** Each ship's deck (where a shot lands on her) and her holed look's place and size (holed.js). */
const DECK = { sloop: SLOOP_DECK + 0.4, frigate: deckY(WAR_FRIGATE_PLAN, 'waist') + 0.4 };
const HOLED = { sloop: { x: -1.15, y: SLOOP_DECK + 2.6, deck: [0.2, SLOOP_DECK + 0.6] }, frigate: { x: -0.5, y: deckY(WAR_FRIGATE_PLAN, 'waist') + 4, size: 2, deck: [0, deckY(WAR_FRIGATE_PLAN, 'waist') + 0.5] } };
const her = (kind) => NAME[kind].replace('Your', 'your');
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
    if (t.towerAt(c, r) >= 0 || t.gunAt(c, r) >= 0) continue;   // (a tower or a bastion stands on its own foot)
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

  // ----- the imperial gate: the Empire's gatehouse over its one-square way, its arch high enough for her masts,
  // each tower on its column of the wall (sitting lower with each large shot, crumbling at the last, the arch
  // coming down with it), and its two bastion guns (src/den-turret.ts's rules, turret.js's look) -----
  const W = TWO_SEA.GATE.WAY, [ta, tb] = TWO_SEA.GATE.TOWERS, R = TWO_SEA.WALL.r0, gz = v3(0, R + 0.5).z, stoneM2 = mat('#d8cdb8', { flatShading: true, roughness: 0.95 });
  const gh = gatehouse({ xa: v3(ta, 0).x, xb: v3(tb, 0).x, z: gz, archY: 11, tw: 3.6, bannerH: 4.5 });
  g.add(gh);
  const { sides, arch } = gh.userData, shake = [0, 0], fall = [-1, -1];
  let archFall = -1, archWay = 1;
  // (a tower's foot: the wall's two squares of it, a plinth of the Empire's stone under it)
  for (const c of TWO_SEA.GATE.TOWERS) { const p = mesh(new THREE.BoxGeometry(CELL * 0.95, 1.2, CELL * 2), stoneM2); p.position.set(v3(c, 0).x, 0.3, gz); g.add(p); }
  const bastions = t.battery.map((gun) => { const V = turretMesh(bastionLook()); V.g.position.copy(v3(...gun.at)); g.add(V.g); return V; });
  /** A tower knocked: it shudders and sits a little lower; its last shot brings it down, and the arch with it. */
  function knock(i, crumbled) {
    const side = sides[i], at = v3(TWO_SEA.GATE.TOWERS[i], R + 0.5, 4);
    burst(at, '#d8cdb8', 22, 6); burst(at.clone().setY(7), '#9a9088', 12, 4);
    shake[i] = 0.5;
    if (!crumbled) { side.position.y = -1.6 * (1 - t.towers[i].hp / TWO_SEA.TOWER_HP); return; }
    blast(at.clone().setY(5), 2, { bits: [{ mat: stoneM2, n: 18, w: 0.9, h: 0.7, d: 0.9 }], ground: () => 0.2 });
    fall[i] = 0;
    if (archFall < 0) { archFall = 0; archWay = i ? -1 : 1; }
    // (rubble heaped low on its squares, open water over them)
    for (let k = 0; k < 5; k++) { const m = mesh(stoneGeo, stoneM2); const s = 0.6 + Math.random() * 0.5; m.scale.set(s, s * 0.5, s); m.position.set(at.x + (Math.random() - 0.5) * 3, -0.1, gz + (Math.random() - 0.5) * 6); m.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(m); }
  }

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
  // (where the one you're steering will lie at her pin, her berth: a block of squares, her size, 15 Nov: "aim you
  // for like a block of squares, not just one")
  const berthM = new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.32, depthWrite: false });
  const berth = pool(8, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 0.6, CELL * 0.6).rotateX(-Math.PI / 2), berthM); m.renderOrder = 2; return m; });
  const dotGeo = new THREE.CircleGeometry(0.4, 14).rotateX(-Math.PI / 2), dotM = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.7, depthWrite: false });
  const dots = pool(24, () => new THREE.Mesh(dotGeo, dotM));
  const pinOf = (col) => {
    const p = new THREE.Group(), m = mat(col, { roughness: 0.6 });
    p.add(mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.7, 12).translate(0, 0.2, 0), m), mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6).translate(0, 1.2, 0), mat('#4a2f1a')));
    const pen = mesh(new THREE.ConeGeometry(0.24, 0.6, 3).rotateZ(-Math.PI / 2), m); pen.scale.set(1, 1, 0.15); pen.position.set(0.3, 1.75, 0); p.add(pen);
    p.visible = false; g.add(p); return p;
  };
  const pins = { sloop: pinOf('#c8372a'), frigate: pinOf('#2a2a2e') };
  // ----- each one holed: stars over her, her smoke, sitting low (holed.js) -----
  const hurt = { sloop: holedLook(ships.sloop, HOLED.sloop), frigate: holedLook(ships.frigate, HOLED.frigate) };

  // ----- shots in flight -----
  const ballGeo = new THREE.SphereGeometry(1, 10, 8), ballM = mat('#1b1a1c', { metalness: 0.5, roughness: 0.4 }), flying = [];
  const hitSay = { hit: (i) => `A hit on the gate's tower! ${t.towers[i].hp} more large shot${t.towers[i].hp === 1 ? '' : 's'} to crumble it.`, bounced: () => 'Your sloop\'s small guns bounce off the gate\'s towers: it would take a war frigate\'s.', crumbled: () => 'The tower\'s crumbled! The gate\'s way is two wide now, for either ship.' };
  const gunSay = { quiet: (n) => `A hit on the gate's gun! It's quiet a while: ${n} more to wreck it.`, wrecked: () => 'The gate\'s gun is wrecked!' };
  function fire(side) {
    const kind = t.active, s = t.ships[kind], wasQuiet = t.battery.every((x) => !x.roused), got = t.fire(side);
    if (!got) { say(`${NAME[kind]}'s ${side === 'L' ? 'port' : 'starboard'} guns are loading.`, true); return; }
    const y = kind === 'frigate' ? 2.2 : 1.1, size = s.h.guns === 'large' ? 0.24 : 0.14;
    got.shots.forEach((shot, i) => {
      const end = shot.hit ?? shot.cells[shot.cells.length - 1], a = v3(...shot.from, y), b = v3(...end, shot.what === 'rock' ? 1.2 : shot.what === 'gun' ? 2.6 : 0.6);
      const m = new THREE.Mesh(ballGeo, ballM); m.scale.setScalar(size); m.position.copy(a); m.visible = false; g.add(m);
      flying.push({ m, a, b, t: -i * 0.12, dur: 0.1 * shot.cells.length + 0.15, shot });
    });
    const tw = got.shots.find((sh) => sh.got === 'crumbled') ?? got.shots.find((sh) => sh.got);
    const gun = got.shots.find((sh) => sh.quieted);
    if (tw) say(hitSay[tw.got](tw.tower) + (wasQuiet ? ' The gate\'s guns are firing back!' : ''), tw.got === 'bounced');
    else if (gun) say(gunSay[gun.quieted](t.battery[gun.gun].left()));
    else if (got.shots.some((sh) => sh.holed)) say(`A hit on ${her(t.other(kind))}! She's holed: her crew are patching her.`);
  }
  function land(f) {
    const { shot, b } = f;
    if (shot.what === 'rock') burst(b, '#9a9088', 14, 4);
    else if (shot.what === 'tower') {
      if (shot.got === 'bounced') burst(b.clone().setY(3), '#f2e2a0', 8, 3);
      else knock(shot.tower, shot.got === 'crumbled');
    } else if (shot.what === 'gun') {
      if (shot.quieted === 'wrecked') turretWrecked(bastions[shot.gun], b);
      else { burst(b.clone().setY(3), '#ffb85a', 14, 4); burst(b.clone().setY(2.5), '#d3c9b2', 12, 3.5); }
    } else if (shot.what === 'sloop' || shot.what === 'frigate') holedFx(ships[shot.what], DECK[shot.what], shot.what === 'frigate' ? 1.8 : 1);
    else burst(b.clone().setY(0.1), '#e8f4fa', 16, 4);   // (a splash)
  }


  let on = false, clock = 0, told = { sloop: false, frigate: false };
  const place = (kind, dt) => {
    const s = t.ships[kind], at = drawnAt(s.h, s.helm.now()), [x, z] = seaXZ(at.c, at.r), m = ships[kind], { low, list } = holedTick(hurt[kind], t.holed(kind), dt);
    m.position.set(x, low + Math.sin(clock * (kind === 'sloop' ? 1.1 : 0.8)) * 0.04, z);
    m.rotation.set(0, Math.PI / 2 - at.a * Math.PI / 2, list + Math.sin(clock * (kind === 'sloop' ? 0.9 : 0.6)) * (kind === 'sloop' ? 0.03 : 0.012));
  };
  /** The gate's guns: their shots fired and coming down (on a ship, holing her). */
  const guns = (evs) => {
    for (const { gun, e, hit } of evs) {
      if (e.kind === 'fire') { turretFire(bastions[gun], e, v3(...e.to)); continue; }
      turretLand(bastions[gun], { ...e, hit: !!hit });
      if (hit) { holedFx(ships[hit], DECK[hit], hit === 'frigate' ? 1.8 : 1); say(`The gate's gun has hit ${her(hit)}! She's holed: her crew are patching her.`, hit === t.active); }
    }
  };
  const show = (kind) => {
    const s = t.ships[kind], act = kind === t.active, cov = [...s.helm.covers()].map((k) => k.split(',').map(Number));
    marks[kind].forEach((m, i) => { m.visible = i < cov.length; if (m.visible) { m.material = act ? sqMat.on : sqMat.off; m.position.copy(v3(...cov[i], 0.05)); } });
    const p = s.helm.pin; pins[kind].visible = !!p; if (p) pins[kind].position.copy(v3(...p));
    if (act) { const b = s.helm.berthSquares(); berth.forEach((m, i) => { m.visible = i < b.length; if (m.visible) m.position.copy(v3(...b[i], 0.06)); }); }
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
        place(k, dt); show(k);
      }
      guns(ev.guns);
      turretShotsTick(dt);
      // (each gun turned to the nearest ship in its reach, else out to sea)
      bastions.forEach((V, i) => {
        const gun = t.battery[i], near = KINDS.map((k) => drawnAt(t.ships[k].h, t.ships[k].helm.now())).filter((p) => gun.reaches(Math.round(p.c), Math.round(p.r)));
        turretView(V, gun, dt, near.length ? v3(near[0].c, near[0].r) : v3(gun.at[0], gun.at[1] - 3));
      });
      course();
      flag.rotation.y = Math.sin(clock * 1.3) * 0.3;
      // (a tower just hit shudders)
      sides.forEach((side, i) => { if (shake[i] > 0) { shake[i] = Math.max(0, shake[i] - dt); side.position.x = Math.sin(clock * 60) * shake[i] * 0.3; } });
      // (a crumbled tower falling into the sea, and the arch with it)
      sides.forEach((side, i) => {
        if (fall[i] < 0 || !side.visible) return;
        const u = Math.min(1, (fall[i] += dt) / 1.6);
        side.position.y = -1.6 - 13 * u * u; side.rotation.z = (i ? 1 : -1) * 0.25 * u;
        if (u >= 1) side.visible = false;
      });
      if (archFall >= 0 && arch.visible) {
        const u = Math.min(1, (archFall += dt) / 1.1);
        arch.position.y = -12 * u * u; arch.rotation.z = archWay * 0.3 * u;
        if (u >= 1) arch.visible = false;
      }
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
      if (got.short) say(kind === 'frigate' && !t.gateOpen()
        ? 'Primates Rule can\'t get through: the imperial gate\'s way is one square wide, and she needs two. Lie broadside to a tower and fire (Q or E) to crumble it.'
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
      return {
        kind: t.active, name: NAME[t.active], h: s.h, moves, lit: h.lit(), mine: h.mine.length, guns: { L: s.guns.ready('L'), R: s.guns.ready('R') },
        load: { L: s.guns.wait.L / s.h.reload, R: s.guns.wait.R / s.h.reload }, holed: t.holed(t.active) ? t.patch[t.active] : 0,
        towers: t.towers.map((x) => x.hp), battery: t.battery.map((x) => (x.wrecked ? 'wrecked' : x.quiet > 0 ? 'quiet' : x.roused ? 'firing' : 'watching')), through: t.through(t.active),
      };
    },
  };
}
