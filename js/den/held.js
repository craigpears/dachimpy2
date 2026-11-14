/* Things in hand that a scene needs (the user, 14 Nov: "anything ... that's been in a cutscene should be an item"):
   each one piece, the same in the wardrobe (js/den-look.js draws whichever a look holds: HELD) and in a scene
   (props-people.js's idles hold them, a scene puts one in anyone's hand with inHand). Each piece is built from
   the hand (0, 0 is the fist, the arm hanging down -y, +z ahead), as the wardrobe's own props are. Needing nothing
   of the den, so it stands up anywhere. (Dachimpy's plate of cookies and a cookie, 14 Nov; Gravee's paintbrush,
   from props-people.js, 14 Nov.) */
import * as THREE from 'three';
import { mat, mesh } from './materials.js';
import { cookiePlate } from './furniture.js';
import { BRUSH } from '../den-houses.js';

const doughM = mat('#c98a45', { roughness: 0.85 }), chipM = mat('#3a2216', { roughness: 0.7 });   // (as furniture.js's cookiePlate's)
const handleM = mat('#7a3b1e', { roughness: 0.6 }), ferruleM = mat('#c9a13c', { metalness: 0.7, roughness: 0.3 }), paintM = mat('#b0182a', { roughness: 0.6 });
const TAU = Math.PI * 2, COOKIE_R = 0.048, CHIPS = [[0.3, 0.02], [1.6, 0.03], [2.9, 0.014], [4.1, 0.031], [5.3, 0.022]];

/** A plate of cookies (furniture.js's cookiePlate, the hall table's) on the palm, `n` on it; `take()` lifts one
    off (it's one fewer) and says how many are left. */
function plateOfCookies({ n = 5 } = {}) {
  const g = new THREE.Group();
  let plate = null, left = n;
  const lay = () => {
    if (plate) { plate.removeFromParent(); plate.traverse((m) => m.geometry?.dispose()); }
    plate = cookiePlate({ n: left });
    plate.position.set(0, 0, 0.07);
    g.add(plate);
  };
  lay();
  g.position.y = -0.6;
  g.take = () => { if (left > 0) { left -= 1; lay(); } return left; };
  return g;
}

/** One cookie, chips and all, pinched upright in the fingers (its face ahead); `bite(k)` has `k` of it (0 to 1)
    eaten, a wedge gone from its top edge, chips and all; all of it and it's gone. `faceAs(obj)` turns it to face
    where `obj` (a figure's body) faces, whatever the arm's doing: held up to the mouth, its face out, the bite
    at the top. */
function oneCookie() {
  const g = new THREE.Group(), c = new THREE.Group();
  c.rotation.x = Math.PI / 2;   // (its face ahead, its top edge up)
  c.position.set(0, -0.55, 0);   // (pinched in the fist, its far edge out: the hand up at the mouth has that edge at the lips)
  g.add(c);
  const dough = mesh(new THREE.CylinderGeometry(COOKIE_R, COOKIE_R, 0.013, 16), doughM);
  c.add(dough);
  const chips = CHIPS.map(([a, r]) => {
    const s = mesh(new THREE.SphereGeometry(0.008, 5, 4), chipM);
    s.position.set(Math.sin(a) * r, 0.007, Math.cos(a) * r);
    c.add(s);
    return { s, a };
  });
  // (eaten from its top edge: theta π is up, faced as a body faces)
  const FROM = Math.PI;
  g.eaten = 0;
  g.bite = (k) => {
    k = Math.max(0, Math.min(1, k));
    if (k === g.eaten) return;
    g.eaten = k;
    c.visible = k < 1;
    if (k >= 1) return;
    dough.geometry.dispose();
    dough.geometry = new THREE.CylinderGeometry(COOKIE_R, COOKIE_R, 0.013, 16, 1, false, FROM + (k * TAU) / 2, TAU * (1 - k));
    for (const { s, a } of chips) { const off = (((a - FROM) % TAU) + TAU) % TAU; s.visible = off > (k * TAU) / 2 && off < TAU - (k * TAU) / 2; }
  };
  g.faceAs = (obj) => {
    obj.getWorldQuaternion(qa); c.parent.getWorldQuaternion(qb);
    c.quaternion.copy(qb.invert().multiply(qa).multiply(FACE_OUT));
  };
  return g;
}
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), FACE_OUT = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

/** A paintbrush (Gravee's): a wooden handle, a brass ferrule, bristles dipped in red, its tip BRUSH.tip from the
    shoulder (src/den-houses.ts), down the arm; the 'paint' idle slides it along a touch to dab. */
function paintbrush() {
  // From a little behind the fist (+y, the hand's at 0) out to the tip, down the arm (-y).
  const g = new THREE.Group(), tip = -(BRUSH.tip - 0.5), ferrule = tip + 0.09, bristles = tip + 0.05;
  const piece = (geo, m, y0, y1) => { const x = mesh(geo(Math.abs(y0 - y1)), m); x.position.y = (y0 + y1) / 2; g.add(x); };
  piece((h) => new THREE.CylinderGeometry(0.012, 0.009, h, 8), handleM, 0.06, ferrule);
  piece((h) => new THREE.CylinderGeometry(0.009, 0.013, h, 8), ferruleM, ferrule, bristles);
  piece((h) => new THREE.ConeGeometry(0.014, h, 8).rotateX(Math.PI), paintM, bristles, tip);
  g.position.y = -0.5;
  return g;
}

/** The things in hand, by id: a name for the wardrobe, and `make(opts)` the piece. (The wardrobe's hand slot in
    js/den-look.js lists these ids too; a test checks they're the same.) */
export const HELD = {
  cookies: { name: 'Plate of cookies', make: plateOfCookies },
  cookie: { name: 'Cookie', make: oneCookie },
  brush: { name: 'Paintbrush', make: paintbrush },
};

/** Puts `piece` (a HELD piece, or anything built from the hand) in a figure's right hand (the wardrobe's
    arms[0]), whatever its look holds put away meanwhile; null takes it out again and the look's own is back.
    Returns the piece. */
export function inHand(p, piece) {
  if (p.inHand) { p.inHand.removeFromParent(); p.inHand.traverse((m) => m.geometry?.dispose()); }
  p.inHand = piece || null;
  if (piece) p.arms[0].add(piece);
  if (p.held) p.held.visible = !piece;
  return p.inHand;
}

/** Crumbs falling (a cookie munched): a little pool of them under `parent`; `spill(world)` drops a few from a
    world point, `tick(dt)` lets them fall, settle on the floor (y 0 in `parent`) and go. */
export function crumbs(parent, n = 18) {
  const geo = new THREE.BoxGeometry(0.012, 0.009, 0.012), pool = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, doughM);
    m.visible = false;
    parent.add(m);
    pool.push({ m, v: new THREE.Vector3(), life: 0 });
  }
  const at = new THREE.Vector3();
  let next = 0;
  return {
    spill(world, count = 5, random = Math.random) {
      parent.worldToLocal(at.copy(world));
      for (let i = 0; i < count; i++) {
        const c = pool[next++ % pool.length];
        c.m.position.copy(at);
        c.v.set((random() - 0.5) * 0.5, 0.2 + random() * 0.4, 0.15 + random() * 0.3);
        c.life = 1.6;
        c.m.visible = true;
      }
    },
    tick(dt) {
      for (const c of pool) {
        if (!c.m.visible) continue;
        c.life -= dt;
        if (c.life <= 0) { c.m.visible = false; continue; }
        if (c.m.position.y > 0.005) { c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 9; }
        if (c.m.position.y < 0.005) { c.m.position.y = 0.005; c.v.set(0, 0, 0); }
      }
    },
    dispose() { pool.forEach((c) => c.m.removeFromParent()); geo.dispose(); },
  };
}
