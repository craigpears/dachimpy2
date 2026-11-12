// The sloop race's gambles (12 Nov; rules src/den-gamble.ts, squares LAY.RACE.GAMBLES): the turning pool on
// leg 2, its spiral turning back and forth on the race's clock (its step on her goes the way it's turning:
// sea.js draws her by the helm's whirl), the cleft it throws her down and the lane up spit 1 it throws her
// back onto (a wind like any: race.js draws the course's winds); and the veiled wind through spit 5, a
// shimmer over the water that won't say which way it blows till it has her. When one takes her, the way it
// went is shown for a moment as a wind lane (sea.js, windLane), gold on, red back. Touches the rest only
// through race.js's hooks (gambleWorld, gambleTick, gambleReset) and the helm's `takes`.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { whirlpool } from '../den-whirl.js';
import { GAMBLE, Gambles, turnedAt } from '../den-gamble.js';
import { scene, mesh, canvasTex, toast, burst, V3 } from './world.js';
import { sail, seaX, seaZ, windLane } from './sea.js';
import { pool } from './whirlpools.js';

const RC = LAY.RACE, TN = RC.GAMBLES.TURN, VL = RC.GAMBLES.VEIL, CELL = SAIL.CELL;
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
export const gamble = { k: new Gambles(Math.floor(Math.random() * 2 ** 31)), W: null, shown: [] };
const takes = (p, whirled) => gamble.k.takes(p, whirled);
const way = () => gamble.k.way();

/* The veiled wind's look: a pale shimmer over its squares, glints drifting every which way and a soft band
   under them, so it reads as a wind of some sort from afar but never which way it blows (a trade wind's
   streaks run along it: windLane). */
function veil() {
  const [a, b] = [VL.WAY[0], VL.WAY[VL.WAY.length - 1]], n = VL.WAY.length;
  const g = new THREE.Group(), tex = canvasTex(64, 64 * n, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 26 * n; i++) {
      const px = 4 + Math.random() * (w - 8), py = Math.random() * h, r = 1 + Math.random() * 2.2;
      const glow = x.createRadialGradient(px, py, 0, px, py, r * 3);
      glow.addColorStop(0, 'rgba(255,255,255,0.95)'); glow.addColorStop(1, 'rgba(225,215,255,0)');
      x.fillStyle = glow; x.beginPath(); x.arc(px, py, r * 3, 0, Math.PI * 2); x.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const L = n * CELL, mid = V3(seaX((a[0] + b[0]) / 2), 0.075, seaZ((a[1] + b[1]) / 2));
  const glints = mesh(new THREE.PlaneGeometry(CELL * 0.85, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false, fog: false }), false);
  const band = mesh(new THREE.PlaneGeometry(CELL * 0.95, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#b3a2f2', transparent: true, opacity: 0.3, depthWrite: false, fog: false }), false);
  glints.position.copy(mid); band.position.copy(mid).setY(0.07);
  glints.renderOrder = band.renderOrder = 2;
  g.add(band, glints);
  return { g, tex, glints, band };
}

function build() {
  const W = { g: new THREE.Group(), pool: null, veil: null };
  // The turning pool: a whirlpool's own look, turned by the race's clock.
  W.pool = pool(whirlpool(TN.POOL));
  W.veil = veil();
  W.g.add(W.pool, W.veil.g);
  scene.add(W.g);
  return W;
}
/** Built with the race's course (race.js). */
export function gambleWorld() { gamble.W ||= build(); }

/* The way a gamble took her, as a wind lane for a moment: from where it took her along each straight run of
   its squares, gold if it carried her on, red if back. */
function show(t, from) {
  const pts = [from, ...t.squares], runs = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [p, q] = [pts[i], pts[i + 1]], d = q.r > p.r ? 0 : q.c > p.c ? 1 : q.r < p.r ? 2 : q.c < p.c ? 3 : -1;
    if (d < 0) continue;
    const last = runs[runs.length - 1];
    if (last && last.d === d && last.c + DC[d] * last.n === p.c && last.r + DR[d] * last.n === p.r) last.n++;
    else runs.push({ c: p.c, r: p.r, d, n: 1 });
  }
  for (const r of runs) {
    const l = windLane(r.c, r.r, r.d, r.n);
    l.g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.color?.set(t.on ? '#ffe27a' : '#ff8a78'); } });
    l.g.position.y += 0.01;
    gamble.W.g.add(l.g);
    gamble.shown.push({ g: l.g, tex: l.tex, t: 0 });
  }
  const end = t.squares[t.squares.length - 1];
  burst(V3(seaX(end.c), 1.2, seaZ(end.r)), t.on ? '#ffe27a' : '#ff8a78', 12, 2);
}
const SAYS = {
  veil: ['The veiled wind\'s with her! It carries her on through', 'The veiled wind\'s against her! Blown back along the leg'],
  turn: ['Timed it! The whirlpool flings her on', 'Mistimed! The whirlpool throws her back up the course'],
};

// ---------- the hooks race.js calls ----------
/** Each tick (race.js): the pool's clock (the race's from the gun, or its own between races) and its spin on
    the helm's whirlpool, the veil's shimmer; a gamble that's just taken her shown and said. */
export function gambleTick(dt, R) {
  const W = gamble.W, k = gamble.k;
  if (!W) return;
  k.tick(dt, R.state === 'on' ? R.t : null);
  // (wired to the helm and its sea's turning pool; a new voyage has a new helm)
  if (sail.helm.takes !== takes) sail.helm.takes = takes;
  const w = sail.sea.whirlAt(...TN.POOL.at);
  if (w && w.turns !== way) w.turns = way;
  // (clockwise is down: whirlpools.js)
  W.pool.rotation.z = -GAMBLE.SPEED * turnedAt(k.t);
  const v = W.veil, s = performance.now() / 1000;
  v.tex.offset.set(0.04 * Math.sin(s * 0.7), 0.15 * Math.sin(s * 0.45) + 0.05 * Math.sin(s * 1.3));
  v.glints.material.opacity = 0.55 + 0.25 * Math.sin(s * 2.1);
  v.band.material.opacity = 0.26 + 0.08 * Math.sin(s * 1.4);
  if (k.last && sail.on) {
    const t = k.last;
    k.last = null;
    const from = t.kind === 'veil' ? { c: VL.WAY[0][0], r: VL.WAY[0][1] } : { c: TN.FAR[0], r: TN.FAR[1] };
    show(t, from);
    toast(SAYS[t.kind][t.on ? 0 : 1], !t.on);
  }
  // (each shown lane races its way, then fades)
  for (const x of gamble.shown) {
    x.t += dt;
    x.tex.offset.y -= dt * 3;
    const o = x.t < 2 ? 0.95 : Math.max(0, 0.95 * (1 - (x.t - 2) / 1.5));
    x.g.traverse((m) => { if (m.material) m.material.opacity = m === x.g.children[0] ? o : o * 0.4; });
  }
  for (const x of gamble.shown.filter((y) => y.t > 3.5)) x.g.removeFromParent();
  gamble.shown = gamble.shown.filter((y) => y.t <= 3.5);
}
/** A new race (or voyage): its clock from the gun, a fresh run of tosses, nothing shown. */
export function gambleReset() {
  gamble.k.reset(Math.floor(Math.random() * 2 ** 31));
  for (const x of gamble.shown) x.g.removeFromParent();
  gamble.shown = [];
}
