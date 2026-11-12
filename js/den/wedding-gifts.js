// Mischievious's wedding: Showered in gifts, the plot (12 Nov; where everything goes is src/den-wedding.ts's
// giftPile and giftSpill). "Everyone brought a present. Everyone." The guests file up the aisle one after
// another and lay their presents at the couple's feet; then the rest come flying in from the crowd, the
// pile climbing round the couple till they're in it up to their necks; then it tumbles over, presents
// spilling across the front, and the ceremony carries on. The pile's presents are two instanced meshes
// however many there are (each a box in its paper, and its ribbon both ways with a bow on top), so a
// grand wedding's mountain is as cheap to draw as a small one's.
import * as THREE from 'three';
import { giftPile, giftSpill, themeOf } from '../den-wedding.js';
import { dyeHex } from '../den-look.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V3, burst } from './world.js';

// (a present a metre a side, its bottom at 0: each is drawn at its size)
const BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const loop = (d) => new THREE.TorusGeometry(0.13, 0.045, 6, 12).rotateY(Math.PI / 2).rotateX(d * 0.55).translate(d * 0.1, 1.08, 0);
// (its ribbon both ways round it, and a bow: a knot and two loops)
const RIBBON = mergeGeometries([new THREE.BoxGeometry(1.03, 1.012, 0.16).translate(0, 0.5, 0), new THREE.BoxGeometry(0.16, 1.012, 1.03).translate(0, 0.5, 0), new THREE.SphereGeometry(0.09, 8, 6).translate(0, 1.03, 0), loop(-1), loop(1)]);
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), C = new THREE.Color();
const ease = (u) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };

/** A present to carry (for a guest who's not one in hand from the wardrobe): its paper and ribbon. */
export function giftInHand(paper, ribbon = 'white') {
  const g = new THREE.Group();
  const a = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: dyeHex(paper), roughness: 0.6 }));
  const b = new THREE.Mesh(RIBBON, new THREE.MeshStandardMaterial({ color: dyeHex(ribbon), roughness: 0.45 }));
  g.add(a, b);
  g.scale.setScalar(0.22);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/* The plot, played by the ceremony (wedding-ceremony.js) through its beats: bring (they file up), heap (the
   rest come flying in), tumble (over it goes). W: the ceremony's (root, propsG, w, seats(), shake()); F: its
   pirates; `go(p, x, z, speed)` walks one (true once they're there). */
export function giftsPlot(W, F) {
  const pile = giftPile(1 + (W.w.seed % 7)), spill = giftSpill(pile, 1 + (W.w.seed % 7)), n = pile.length;
  // (their colours: the wedding's own, and white; ribbons gold, white, or its main colour)
  const T = themeOf(W.w.theme), dyes = [...(T?.dyes ?? ['rose', 'pink', 'white', 'peach', 'lavender']), 'white'];
  const ribbons = ['gold', 'white', dyes[0]];
  const parent = W.propsG || W.root;
  const mk = (geo, rough) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: rough }), n); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.count = n; parent.add(m); return m; };
  const paper = mk(BOX, 0.62), ribbon = mk(RIBBON, 0.4);
  pile.forEach((g, i) => {
    const pc = dyes[Math.floor(g.paper * dyes.length) % dyes.length];
    let rc = ribbons[Math.floor(g.ribbon * ribbons.length) % ribbons.length];
    if (rc === pc) rc = pc === 'white' ? 'gold' : 'white';
    paper.setColorAt(i, C.set(dyeHex(pc))); ribbon.setColorAt(i, C.set(dyeHex(rc)));
  });
  paper.instanceColor.needsUpdate = true; ribbon.instanceColor.needsUpdate = true;
  /* Each present: hidden till it's laid or thrown; a flight (from a to b, an arc over it, turning as it goes,
     starting at t0 for dur seconds); then where it rests. */
  const gifts = pile.map((g) => ({ shown: false, fly: null, at: { x: g.x, y: g.y, z: g.z, r: g.r, tx: 0, tz: 0 }, s: g.s }));
  const place = (i) => {
    const G = gifts[i], a = G.at;
    E.set(a.tx, a.r, a.tz); Q.setFromEuler(E);
    M4.compose(P3.set(a.x, a.y, a.z), Q, G.shown ? S3.setScalar(G.s) : S3.setScalar(0));
    paper.setMatrixAt(i, M4); ribbon.setMatrixAt(i, M4);
  };
  const flush = () => { paper.instanceMatrix.needsUpdate = true; ribbon.instanceMatrix.needsUpdate = true; };
  for (let i = 0; i < n; i++) place(i);
  flush();
  const launch = (i, from, to, t0, dur, arc, spin = 0) => { gifts[i].fly = { from, to, t0, dur, arc, spin }; };
  const rel = (p, dx, y, dz) => ({ x: p.x + Math.sin(p.yaw) * dz + Math.cos(p.yaw) * dx, y, z: p.z + Math.cos(p.yaw) * dz - Math.sin(p.yaw) * dx });

  // Who files up: the guests drawn whole (a big wedding's crowd throws theirs in after), each with a
  // present in hand (the wardrobe's, or one of the scene's own), taking it up the aisle on their side.
  const seats = W.seats();
  const walkers = F.guests.slice(0, Math.min(12, n)).map((p, j) => {
    const home = seats[p.gi], side = home.x < 0 ? -1 : 1, g = pile[j];
    let held = p.look?.hand === 'gift' ? p.held : null, own = null;
    if (!held) { own = giftInHand(dyes[j % dyes.length], dyes[j % dyes.length] === 'white' ? 'gold' : 'white'); own.position.set(0, -0.62, 0.14); p.arms[0].add(own); held = own; }
    const ax = side * 0.32, drop = { x: Math.max(-1.7, Math.min(1.7, g.x)), z: -1.95 };
    const way = [{ x: ax, z: Math.max(home.z, -0.9) }, { x: ax, z: -1.2 }, drop];
    const back = [{ x: ax, z: -1.2 }, { x: ax, z: Math.max(home.z, -0.9) }, { x: home.x, z: home.z }];
    return { p, j, home, held, own, way, back, leg: 0, state: 'wait', start: 0.3 + j * Math.min(0.85, 6.5 / Math.max(1, F.guests.length)), layT: 0 };
  });
  const k = walkers.length;
  // (where the rest are thrown from: anywhere in the crowd, over their heads)
  const from = (i) => { const s = seats[(i * 7919) % seats.length] || { x: 0, z: 4 }; return { x: s.x, y: 1.6, z: s.z }; };
  const HEAP = 10.5, TUMBLE = 18.1, FLING = 3.4;
  for (let i = k; i < n; i++) launch(i, from(i), pile[i], HEAP + FLING * ((i - k) / Math.max(1, n - k)) ** 0.75, 0.75, 1.6 + (i % 5) * 0.25, ((i % 3) - 1) * 6);
  const S = { t0: null, tumbled: false };

  function fly(i, T) {
    const G = gifts[i], f = G.fly;
    if (!f || T < f.t0) return;
    const u = Math.min(1, (T - f.t0) / f.dur), v = ease(u);
    G.shown = true;
    Object.assign(G.at, { x: f.from.x + (f.to.x - f.from.x) * u, y: f.from.y + (f.to.y - f.from.y) * v + f.arc * 4 * u * (1 - u), z: f.from.z + (f.to.z - f.from.z) * u, r: (f.to.r ?? 0) + f.spin * (1 - u), tx: f.spin * 0.3 * (1 - u), tz: f.spin * 0.2 * (1 - u) });
    if (u >= 1) { G.fly = null; Object.assign(G.at, { x: f.to.x, y: f.to.y, z: f.to.z, r: f.to.r ?? 0, tx: 0, tz: 0 }); }
  }
  function walk(w, T, go, moving, dt) {
    const p = w.p;
    if (w.state === 'wait') { if (T >= w.start) w.state = 'up'; else return; }
    if (w.state === 'up' || w.state === 'back') {
      const path = w.state === 'up' ? w.way : w.back, at = path[w.leg];
      if (go(p, at.x, at.z, 2.8)) { moving.delete(p); if (++w.leg >= path.length) { w.leg = 0; w.state = w.state === 'up' ? 'lay' : 'home'; w.layT = T; } }
      if (w.state === 'up' || w.state === 'lay') { p.arms[0].rotation.x = -0.75; p.arms[1].rotation.set(-0.75, 0, 0.25); }
    }
    if (w.state === 'lay') {
      p.yaw += Math.atan2(Math.sin(Math.PI - p.yaw), Math.cos(Math.PI - p.yaw)) * Math.min(1, dt * 8);
      const u = (T - w.layT) / 0.55;
      p.arms[0].rotation.x = p.arms[1].rotation.x = -0.75 - u * 0.6;
      if (u >= 0.5 && w.held.visible) {
        w.held.visible = false;
        const h = rel(p, 0, 0.75, 0.35);
        launch(w.j, h, pile[w.j], T, 0.45, 0.45, 0.6);
      }
      if (u >= 1) w.state = 'back';
    }
    if (w.state === 'home') { p.yaw += Math.atan2(Math.sin(w.home.yaw - p.yaw), Math.cos(w.home.yaw - p.yaw)) * Math.min(1, dt * 6); }
  }
  const burstAt = (x, y, z, col, m = 12) => { const v = V3(x, y, z); W.root.localToWorld(v); burst(v, col, m, 3); };

  return {
    /** Who says the guests' lines: the first two up the aisle. */
    speakers: [walkers[0]?.p, walkers[1]?.p],
    /** A beat of the plot, `t` seconds into the ceremony. */
    tick(b, u, L, t, dt, go, moving) {
      if (S.t0 === null) S.t0 = t - L;
      const T = t - S.t0;
      for (const w of walkers) walk(w, T, go, moving, dt);
      // (the rest of them, throwing theirs in: arms going)
      if (b === 'heap') F.guests.forEach((g, i) => { if (!walkers.some((w) => w.p === g && w.state !== 'home' && w.state !== 'wait')) { g.arms[0].rotation.x = -2.0 + Math.sin(t * 7 + i) * 0.9; g.y = Math.abs(Math.sin(t * 5 + i)) * 0.06; } });
      if (b === 'tumble' && !S.tumbled && L > 0.5) {
        // Over it goes: the top first, each tumbling down across the front.
        S.tumbled = true;
        const top = Math.max(...pile.map((g) => g.y + g.s));
        pile.forEach((g, i) => { if (!gifts[i].fly) gifts[i].shown = true; launch(i, { x: gifts[i].at.x, y: gifts[i].at.y, z: gifts[i].at.z }, spill[i], T + (top - g.y - g.s) * 0.45 + (i % 4) * 0.04, 0.6 + (i % 3) * 0.12, 0.35 + (g.y * 0.3), ((i % 5) - 2) * 3); });
        // (and everyone home, whoever's still on the way)
        for (const w of walkers) { Object.assign(w.p, { x: w.home.x, z: w.home.z, yaw: w.home.yaw }); w.state = 'home'; w.held.visible = false; }
        W.shake?.();
        for (const d of dyes.slice(0, 4)) burstAt(0, 1.2, -3.4, dyeHex(d), 8);
      }
      // The couple: arms up out of it as it climbs, a wriggle; then out they pop.
      if (b === 'heap' && u > 0.35) for (const [p, d] of [[F.you, 1], [F.partner, -1]]) { p.arms.forEach((a, j) => { a.rotation.set(-2.7 + Math.sin(t * 6 + j + d) * 0.25, 0, (j ? -1 : 1) * 0.2); }); }
      if (b === 'tumble') { const hop = L > 0.5 && L < 1.3 ? Math.sin((L - 0.5) / 0.8 * Math.PI) * 0.35 : 0; F.you.y = hop; F.partner.y = hop; }
      for (let i = 0; i < n; i++) { fly(i, T); place(i); }
      flush();
      // The shots: the queue up the aisle; the pile climbing; over it goes.
      if (b === 'bring') return { look: [0, 0.8, -1.4], dist: 8.6, tilt: 0.58, yaw: 0.42 };
      if (b === 'heap') return { look: [0, 1.0, -3.5], dist: 7.4 - u * 1.2, tilt: 0.42, yaw: 0.3 };
      return { look: [0, 0.8, -2.6], dist: 8, tilt: 0.5, yaw: -0.35 };
    },
    /** Over (played out or skipped): the presents where they spilled, everyone's laid. */
    end() {
      for (let i = 0; i < n; i++) { gifts[i].fly = null; gifts[i].shown = true; Object.assign(gifts[i].at, { x: spill[i].x, y: spill[i].y, z: spill[i].z, r: spill[i].r, tx: 0, tz: 0 }); place(i); }
      flush();
      for (const w of walkers) w.held.visible = false;
      F.you.y = 0; F.partner.y = 0;
    },
  };
}
