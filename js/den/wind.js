// The wind on the sloop's sea, and her oars, in 3D and on the sailing bar (the rules are
// src/den-wind.ts, and the helm's in src/den-sail.ts). A first go of IDEAS.md's "Weather is where
// oars make sense" (the user, 9 Nov: "try it. We'll see how it feels, whether it's overcomplicated
// or not"): the wind's shown as cat's-paw streaks drifting over the water the way it blows (glassy
// in a calm), her flag streaming downwind (hanging limp in a calm), her sails full or slack; and on
// the bar, an arrow the way it blows, turned with the view, and how strong. Rowing, her sails are
// brailed up to their yards and two long sweeps a side stroke from her gunwales (rowed by the
// port-and-starboard board: js/den/rowing.js sets each side's stroke, sail.rowRate).
// Made plainer (10 Nov, the user: "it's very confusing"): big white arrows on the water either side
// of her, drifting downwind, so the way it blows reads at a glance; on the bar, how she lies to it
// (behind her, across, dead ahead); her sails shaking and flogging while she's in irons; and the
// streaks and flag easing toward what's coming in the WARN seconds before a change.
import * as THREE from 'three';
import { STRENGTH, WIND, pointOf } from '../den-wind.js';
import { SAIL } from '../den-sail.js';
import { scene, mesh, mat, woodTex, canvasTex, burst, toast, view } from './world.js';
import { sail, seaX, seaZ, SLOOP_DECK } from './sea.js';

const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
// The way it blows, as you'd say it from the den: from the left, from the sea, and so on.
const FROM = ['offshore, out to sea', 'from the left', 'onshore, in to the cove', 'from the right'];
export const windWords = (d) => FROM[((d % 4) + 4) % 4];

// The streaks: a field of short white dashes over the board, drifting downwind.
function streaks() {
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(240,250,252,0.9)'; g.lineCap = 'round';
    for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h, l = 22 + Math.random() * 34; g.lineWidth = 1.5 + Math.random() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  const m = mesh(new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }), false);
  m.position.set(seaX((SAIL.COLS - 1) / 2), 0.055, seaZ((SAIL.ROWS - 1) / 2));
  m.renderOrder = 1;
  scene.add(m);
  return { m, tex, a: null, op: 0 };
}

// Two long sweeps a side, run out from her gunwales (port's her left, -z): each swings fore and aft
// about its rowlock, dipping its blade on the pull.
function sweeps(g) {
  const wood = mat('#7a5634', { map: woodTex }), out = new THREE.Group(), oars = [];
  for (const s of [1, -1]) for (const x of [1.2, -1.1]) {
    const lock = new THREE.Group();
    lock.position.set(x, SLOOP_DECK + 0.12, s * 0.8);
    lock.rotation.y = s > 0 ? 0 : Math.PI;   // (built for her starboard side, turned round for port)
    const arm = new THREE.Group();
    arm.rotation.order = 'YXZ';
    const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.75, 6).rotateX(Math.PI / 2), wood, false);
    shaft.position.z = 1.2;   // (its loom only just inboard, clear of a board on her deck)
    const blade = mesh(new THREE.BoxGeometry(0.26, 0.03, 0.62), wood, false);
    blade.position.z = 2.3;
    arm.add(shaft, blade);
    lock.add(arm);
    out.add(lock);
    oars.push({ lock, arm, blade, s });
  }
  g.add(out);
  return { oars, out: 0, ph: 0, catchT: 0 };
}

// The wind's arrows: two big white chevron arrows on the water either side of her, pointing the
// way it blows and drifting that way, fading in light airs, gone in a calm.
function arrows() {
  const shape = new THREE.Shape();
  shape.moveTo(1.6, 0); shape.lineTo(-0.2, 1.1); shape.lineTo(-0.2, 0.5); shape.lineTo(-1.6, 0.5); shape.lineTo(-1.6, -0.5); shape.lineTo(-0.2, -0.5); shape.lineTo(-0.2, -1.1); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), m = new THREE.MeshBasicMaterial({ color: '#f4fbfd', transparent: true, opacity: 0, depthWrite: false, fog: false });
  const g = new THREE.Group(), list = [];
  for (const s of [-1, 1]) { const a = new THREE.Mesh(geo, m); a.renderOrder = 2; a.userData.s = s; g.add(a); list.push(a); }
  scene.add(g);
  return { g, m, list, a: null, t: 0 };
}
// How strong it looks: what it is, easing toward what's coming over the warning before a change.
const OP = [0, 0.22, 0.45], FLAG = [-1.35, -0.45, 0];
function looks(w, table) {
  const u = Math.max(0, Math.min(1, 1 - w.left / WIND.WARN));
  return table[w.s] + (table[w.coming.s] - table[w.s]) * u;
}

export function windTick(dt) {
  const h = sail.helm, w = sail.sea.breeze, g = sail.g;
  if (!w || !g) return;
  sail.streaks ||= streaks();
  sail.sweeps ||= sweeps(g);
  sail.arrows ||= arrows();
  const S = sail.streaks, k = Math.min(1, dt * 1.5), t = performance.now() / 1000;
  // The streaks: fainter and slower the lighter it blows, gone in a calm; turning with the wind.
  const want = Math.PI / 2 * -w.d;
  if (S.a === null) S.a = want;
  S.a += (Math.atan2(Math.sin(want - S.a), Math.cos(want - S.a))) * Math.min(1, dt * 1.2);
  S.m.rotation.y = S.a;
  S.op += ((sail.on ? looks(w, OP) : 0) - S.op) * k;
  // The arrows either side of her, under sail (at the oars the wind's nothing to her).
  {
    const A = sail.arrows, wa = Math.atan2(DR[w.d], DC[w.d]);
    if (A.a === null) A.a = wa;
    A.a += Math.atan2(Math.sin(wa - A.a), Math.cos(wa - A.a)) * Math.min(1, dt * 2);
    A.m.opacity += ((sail.on && !h.oars ? looks(w, [0, 0.3, 0.5]) : 0) - A.m.opacity) * k;
    A.g.visible = A.m.opacity > 0.01;
    A.t = (A.t + dt * [0, 0.5, 1.3][w.s]) % 1;
    const fx = Math.cos(A.a), fz = -Math.sin(A.a), drift = (A.t - 0.5) * 3;
    for (const a of A.list) {
      a.rotation.y = A.a;
      a.position.set(g.position.x + fx * drift - fz * a.userData.s * 3.6, 0.07, g.position.z + fz * drift + fx * a.userData.s * 3.6);
    }
  }
  S.m.material.opacity = S.op;
  S.m.visible = S.op > 0.005;
  S.tex.offset.y -= dt * [0, 0.06, 0.16][w.s];
  // Her flag streams downwind (limp in a calm): its pole's turned so the cloth points the way the
  // wind blows, in the world, whichever way she's heading.
  const fl = g.userData.rig[1], cloth = fl.children[2];
  const yaw = Math.atan2(DR[w.d], DC[w.d]) - g.rotation.y;
  fl.userData.yaw = (fl.userData.yaw ?? yaw) + Math.atan2(Math.sin(yaw - (fl.userData.yaw ?? yaw)), Math.cos(yaw - (fl.userData.yaw ?? yaw))) * Math.min(1, dt * 3);
  fl.rotation.y = fl.userData.yaw;
  cloth.rotation.z += (looks(w, FLAG) - cloth.rotation.z) * k;
  // Her sails: full in a good wind, slack in light airs, hanging in a calm; brailed up while she rows;
  // shaking and flogging while she's in irons, her bow into the wind.
  const irons = !h.oars && h.cur?.irons && h.t < h.cur.secs;
  for (const arm of g.userData.sails) {
    const c = arm.children[0], ht = c.geometry.parameters.height;
    const fy = h.oars ? 0.18 : 1, fz = h.oars ? 0.3 : irons ? 0.2 + 0.5 * Math.abs(Math.sin(t * 17 + ht)) : [0.12, 0.6, 1.25][w.s];
    c.scale.y += (fy - c.scale.y) * k; c.scale.z += (fz - c.scale.z) * (irons ? 1 : k);
    c.position.y = -ht * c.scale.y / 2;
    arm.rotation.z = irons ? Math.sin(t * 13 + ht) * 0.08 : arm.rotation.z * (1 - k);
  }
  // The sweeps: run out (or in) through her sides, stroking while she's under way at the oars, each
  // side as hard as its rower (js/den/rowing.js: going like crazy after a big clear on that side).
  const W = sail.sweeps, moving = h.oars && h.cur && h.cur.m !== 'W' && !h.cur.bump;
  W.out += ((h.oars ? 1 : 0) - W.out) * Math.min(1, dt * 2.5);
  W.ph ||= { port: 0, starboard: 0 };
  W.rest ||= { port: 1, starboard: 1 };
  W.catchT ||= { port: 0, starboard: 0 };
  g.updateMatrixWorld(true);
  for (const side of ['port', 'starboard']) {
    const rate = sail.rowRate ? sail.rowRate(side, !!moving) : moving ? 0.95 : 0, TAU = Math.PI * 2;
    if (rate > 0) W.ph[side] += dt * TAU * rate;
    else W.ph[side] += (Math.round(W.ph[side] / TAU) * TAU - W.ph[side]) * Math.min(1, dt * 3);   // (resting, held out square)
    W.rest[side] += ((rate > 0 ? 0 : 1) - W.rest[side]) * Math.min(1, dt * 3);
    // A splash as the blades bite.
    if (rate > 0 && Math.cos(W.ph[side]) < -0.9 && (W.catchT[side] -= dt) < 0) {
      W.catchT[side] = Math.min(0.5, 0.45 / rate);
      for (const o of W.oars) if ((o.s > 0) === (side === 'starboard')) burst(o.blade.localToWorld(new THREE.Vector3()).setY(0.15), '#e6f3f6', rate > 3 ? 4 : 2, rate > 3 ? 2.2 : 1.4);
    }
  }
  for (const o of W.oars) {
    const side = o.s > 0 ? 'starboard' : 'port', ph = W.ph[side], rest = W.rest[side];
    o.lock.visible = W.out > 0.02;
    o.lock.scale.z = Math.max(0.02, W.out);
    // (swung aft on the pull, its blade down in the water; forward again on the recovery, lifted
    // clear; at rest, held out just clear of the water)
    o.arm.rotation.y = 0.42 * Math.sin(ph) * o.s;
    o.arm.rotation.x = (0.3 - 0.12 * Math.cos(ph)) * (1 - rest) + 0.24 * rest;
  }
}

// What the wind does, said as it happens (the sailing bar shows it all the while).
export function windSay(e) {
  const h = sail.helm;
  // Said ahead of a change, so it's never a surprise (10 Nov: "it changes quite quickly").
  if (e.kind === 'warn') {
    if (e.s < e.was.s) return toast(e.s ? 'The wind\'s easing: it\'ll drop soon' : 'The wind\'s dying away: a calm\'s coming');
    if (e.s > e.was.s) return toast(e.was.s ? 'The wind\'s freshening' : `A breath of wind's coming, ${windWords(e.d)}`);
    return toast(`The wind's backing round: soon it'll blow ${windWords(e.d)}`);
  }
  if (e.kind === 'wind') {
    if (e.s < e.was.s) return toast(e.s ? 'The wind\'s dropping' : `Becalmed!${h.oars ? '' : ' She\'s dead in the water till the wind picks up: O runs out the oars'}`);
    if (e.s > e.was.s) return toast(e.s === 2 ? 'The wind\'s picking up' : `A breath of wind, ${windWords(e.d)}`);
    return toast(`The wind's shifted: it blows ${windWords(e.d)} now`);
  }
  // Only when she really won't (10 Nov: "it's coming up a pop-up saying you can't sail there. Well,
  // it is letting me"): the pilot doesn't row for her any more.
  if (e.kind === 'headwind') return toast('She can\'t sail to the pin: it\'s dead against the wind. O: out oars and row her there, or wait for it to shift', true);
  if (e.kind === 'move' && e.irons) {
    const now = performance.now();
    if (!(now < (sail.said.ironsAt ?? 0))) { sail.said.ironsAt = now + 4000; toast(e.m === 'F' ? 'In irons! Her bow\'s into the wind: she makes no way' : 'In irons: she swings her head round, but can\'t make way into the wind', true); }
  }
}

// The wind on the sailing bar: an arrow the way it blows (as you're looking), and how strong; and
// the oars, out or in (O, or a click).
const POINT = { run: 'behind her: fastest', reach: 'across her: slower', into: 'dead ahead: in irons' };
const heading = () => ((Math.round(sail.helm.now().a) % 4) + 4) % 4;
export function windHud() {
  const w = sail.sea.breeze;
  if (!w) return '';
  const deg = Math.round(w.d * 90 + view.yaw * 180 / Math.PI);
  const how = sail.helm.oars || !w.s ? '' : `<i>${POINT[pointOf(heading(), w.d)]}</i>`;
  return `<div class="wind s${w.s}" title="The wind: the way it blows, and how strong"><b style="transform:rotate(${deg}deg)">${w.s ? '↑' : '·'}</b><span>${STRENGTH[w.s]}${how}</span></div>`;
}
export const oarsHud = () => `<button class="oars${sail.helm.oars ? ' on' : ''}" id="oars-btn" title="Run out the oars, or ship them (O)"><kbd>O</kbd>${sail.helm.oars ? 'Rowing' : 'Oars'}</button>`;
export const windSig = () => { const w = sail.sea.breeze; return w ? `${w.d}${w.s}${Math.round(view.yaw * 36)}${sail.helm.oars}${heading()}` : ''; };
export function rowToggle() {
  const on = sail.helm.row();
  toast(on ? 'Out oars! Bilge the board to row her: the left half pulls her port oars, the right half starboard' : 'Oars in: she sails by the wind');
}
