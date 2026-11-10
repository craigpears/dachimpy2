// The wind on the sloop's sea, and her oars, in 3D and on the sailing bar (the rules are
// src/den-wind.ts, and the helm's in src/den-sail.ts). A first go of IDEAS.md's "Weather is where
// oars make sense" (the user, 9 Nov: "try it. We'll see how it feels, whether it's overcomplicated
// or not"): the wind's shown as cat's-paw streaks drifting over the water the way it blows (glassy
// in a calm), her flag streaming downwind (hanging limp in a calm), her sails full or slack; and on
// the bar, an arrow the way it blows, turned with the view, and how strong. Rowing, her sails are
// brailed up to their yards and two long sweeps a side stroke from her gunwales.
import * as THREE from 'three';
import { STRENGTH } from '../den-wind.js';
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
    const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.04, 3.1, 6).rotateX(Math.PI / 2), wood, false);
    shaft.position.z = 1.0;
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

export function windTick(dt) {
  const h = sail.helm, w = sail.sea.breeze, g = sail.g;
  if (!w || !g) return;
  sail.streaks ||= streaks();
  sail.sweeps ||= sweeps(g);
  const S = sail.streaks, k = Math.min(1, dt * 1.5);
  // The streaks: fainter and slower the lighter it blows, gone in a calm; turning with the wind.
  const want = Math.PI / 2 * -w.d;
  if (S.a === null) S.a = want;
  S.a += (Math.atan2(Math.sin(want - S.a), Math.cos(want - S.a))) * Math.min(1, dt * 1.2);
  S.m.rotation.y = S.a;
  S.op += ((sail.on ? [0, 0.22, 0.45][w.s] : 0) - S.op) * k;
  S.m.material.opacity = S.op;
  S.m.visible = S.op > 0.005;
  S.tex.offset.y -= dt * [0, 0.06, 0.16][w.s];
  // Her flag streams downwind (limp in a calm): its pole's turned so the cloth points the way the
  // wind blows, in the world, whichever way she's heading.
  const fl = g.userData.rig[1], cloth = fl.children[2];
  const yaw = Math.atan2(DR[w.d], DC[w.d]) - g.rotation.y;
  fl.userData.yaw = (fl.userData.yaw ?? yaw) + Math.atan2(Math.sin(yaw - (fl.userData.yaw ?? yaw)), Math.cos(yaw - (fl.userData.yaw ?? yaw))) * Math.min(1, dt * 3);
  fl.rotation.y = fl.userData.yaw;
  cloth.rotation.z += ((w.s === 0 ? -1.35 : w.s === 1 ? -0.45 : 0) - cloth.rotation.z) * k;
  // Her sails: full in a good wind, slack in light airs, hanging in a calm; brailed up while she rows.
  for (const arm of g.userData.sails) {
    const c = arm.children[0], ht = c.geometry.parameters.height;
    const fy = h.oars ? 0.18 : 1, fz = h.oars ? 0.3 : [0.12, 0.6, 1.25][w.s];
    c.scale.y += (fy - c.scale.y) * k; c.scale.z += (fz - c.scale.z) * k;
    c.position.y = -ht * c.scale.y / 2;
  }
  // The sweeps: run out (or in) through her sides, stroking while she's under way at the oars.
  const W = sail.sweeps, moving = h.oars && h.cur && h.cur.m !== 'W' && !h.cur.bump;
  W.out += ((h.oars ? 1 : 0) - W.out) * Math.min(1, dt * 2.5);
  if (moving) W.ph += dt * Math.PI * 2 * 0.95;
  else W.ph += (Math.round(W.ph / (Math.PI * 2)) * Math.PI * 2 - W.ph) * Math.min(1, dt * 3);   // (resting, held out square)
  W.rest = (W.rest ?? 1) + ((moving ? 0 : 1) - (W.rest ?? 1)) * Math.min(1, dt * 3);
  for (const o of W.oars) {
    o.lock.visible = W.out > 0.02;
    o.lock.scale.z = Math.max(0.02, W.out);
    // (swung aft on the pull, its blade down in the water; forward again on the recovery, lifted
    // clear; at rest, held out just clear of the water)
    o.arm.rotation.y = 0.42 * Math.sin(W.ph) * o.s;
    o.arm.rotation.x = (0.3 - 0.12 * Math.cos(W.ph)) * (1 - W.rest) + 0.24 * W.rest;
  }
  // A splash as the blades bite.
  if (moving && Math.cos(W.ph) < -0.95 && (W.catchT -= dt) < 0) {
    W.catchT = 0.5;
    g.updateMatrixWorld(true);
    for (const o of W.oars) burst(o.blade.localToWorld(new THREE.Vector3()).setY(0.15), '#e6f3f6', 2, 1.4);
  }
}

// What the wind does, said as it happens (the sailing bar shows it all the while).
export function windSay(e) {
  const h = sail.helm;
  if (e.kind === 'wind') {
    if (e.s < e.was.s) return toast(e.s ? 'The wind\'s dropping' : `Becalmed!${h.oars ? '' : ' She\'s dead in the water till the wind picks up: O runs out the oars'}`);
    if (e.s > e.was.s) return toast(e.s === 2 ? 'The wind\'s picking up' : `A breath of wind, ${windWords(e.d)}`);
    return toast(`The wind's shifted: it blows ${windWords(e.d)} now`);
  }
  if (e.kind === 'oars') return toast(e.auto ? (e.out ? 'She can\'t sail there against the wind: out oars!' : 'There: in oars, and she\'s under sail again') : e.out ? 'Out oars! She rows, whatever the wind' : 'Oars in: she sails by the wind');
  if (e.kind === 'move' && e.irons && !sail.said.irons) { sail.said.irons = true; toast('In irons: she can\'t sail into the wind', true); }
}

// The wind on the sailing bar: an arrow the way it blows (as you're looking), and how strong; and
// the oars, out or in (O, or a click).
export function windHud() {
  const w = sail.sea.breeze;
  if (!w) return '';
  const deg = Math.round(w.d * 90 + view.yaw * 180 / Math.PI);
  return `<div class="wind s${w.s}" title="The wind: the way it blows, and how strong"><b style="transform:rotate(${deg}deg)">${w.s ? '↑' : '·'}</b>${STRENGTH[w.s]}</div>`;
}
export const oarsHud = () => `<button class="oars${sail.helm.oars ? ' on' : ''}" id="oars-btn" title="Run out the oars, or ship them (O)"><kbd>O</kbd>${sail.helm.oars ? 'Rowing' : 'Oars'}</button>`;
export const windSig = () => { const w = sail.sea.breeze; return w ? `${w.d}${w.s}${Math.round(view.yaw * 36)}${sail.helm.oars}` : ''; };
export function rowToggle() {
  const on = sail.helm.row();
  toast(on ? 'Out oars! She rows, whatever the wind' : 'Oars in: she sails by the wind');
}
