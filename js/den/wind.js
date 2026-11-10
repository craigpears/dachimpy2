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
// Parked (10 Nov, the user: "I think it's the arrows getting in my way"): while WEATHER.parked
// there are no arrows, no streaks and no wind on the bar, nothing's said of it, and her flag and
// sails show a steady fair wind, the flag streaming aft whichever way she heads.
// Wind zones (10 Nov: src/den-wind.ts), a patch of sea with a wind of its own, show it plainly but
// only there ("it should only really apply to this little ... area"): streaks drifting over its
// water, fading out at its edges, and her flag and sails answering it while she's in it (the flag
// streaming downwind, her yards braced round on a reach, flogging in irons). No arrows. The first
// time it heads her off it's said, and never a word of the oars ("they can figure out oars go
// against the wind").
import * as THREE from 'three';
import { STRENGTH, WIND, WEATHER, pointOf, lie } from '../den-wind.js';
import { SAIL } from '../den-sail.js';
import { scene, mesh, mat, woodTex, canvasTex, burst, toast, view, V3 } from './world.js';
import { sail, seaX, seaZ, SLOOP_DECK, SLOOP_BEAM } from './sea.js';

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

// A wind zone's streaks: the same short white dashes, over its water only, running and drifting the
// way it blows, and fading out toward its edges on the open sea so it reads as a patch of wind, not
// a box. Against rock, cliff or the canal (the harbour at the canal's mouth, 10 Nov: "like the wind
// just to expand up to the cliff") they run right up to it.
function zoneStreaks(z) {
  const S = SAIL.CELL, w = (z.c1 - z.c0 + 1) * S, d = (z.r1 - z.r0 + 1) * S, cx = seaX((z.c0 + z.c1) / 2), cz = seaZ((z.r0 + z.r1) / 2);
  const geo = new THREE.PlaneGeometry(w, d, 24, 24).rotateX(-Math.PI / 2), pos = geo.attributes.position, n = pos.count;
  const uv = geo.attributes.uv, col = new Float32Array(n * 4), fx = DC[z.d], fz = -DR[z.d], TILE = 12, EDGE = 5;
  // (open sea beyond this square: not rock, cliff, a lock or the canal's water)
  const sea = sail.sea, open = (c, r) => sea.open(c, r) && !sea.isLock(c, r) && sea.level(c, r) === 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getZ(i);
    // (along the wind is up the texture, where its dashes run, so they drift downwind)
    uv.setXY(i, (x * -fz + y * fx) / TILE, ((cx + x) * fx + (cz + y) * fz) / TILE);
    // Its square on the board, and how far it is from each edge that has open sea beyond it.
    const c = clamp((cx + x - SAIL.X0) / S - 0.5, z.c0, z.c1), r = clamp((SAIL.Z0 - cz - y) / S - 0.5, z.r0, z.r1);
    const gaps = [
      open(z.c0 - 1, r) ? w / 2 + x : Infinity, open(z.c1 + 1, r) ? w / 2 - x : Infinity,
      open(c, z.r0 - 1) ? d / 2 - y : Infinity, open(c, z.r1 + 1) ? d / 2 + y : Infinity,   // (out to sea is -z)
    ];
    const edge = Math.min(...gaps) / EDGE, a = Math.max(0, Math.min(1, edge));
    col.set([1, 1, 1, a * a * (3 - 2 * a)], i * 4);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  // (long, bold dashes: bolder than the sea's own glints, so the patch reads as wind at a glance)
  const tex = canvasTex(256, 256, (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(248,252,255,1)'; g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * cw, y = Math.random() * ch, l = 60 + Math.random() * 70;
      g.lineWidth = 2.6 + Math.random() * 2.4;
      for (const dy of [0, -ch]) { g.beginPath(); g.moveTo(x, y + dy); g.lineTo(x, y + dy + l); g.stroke(); }   // (wrapping round the tile)
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const m = mesh(geo, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }), false);
  m.position.set(cx, 0.07, cz);
  m.renderOrder = 3;   // (over the sea, as the trade winds' lanes are, and over its ruffle)
  // Under them, the water ruffled darker by the wind, as a cat's-paw darkens it, fading out with them.
  const ruffle = mesh(geo, new THREE.MeshBasicMaterial({ color: '#0b4a6e', vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false, fog: false }), false);
  ruffle.position.set(cx, 0.065, cz);
  ruffle.renderOrder = 2;
  scene.add(ruffle, m);
  return { m, tex, z };
}

// One long sweep a side, run out from her gunwales (port's her left, -z), each worked by its own
// rower (js/den/rowing.js seats them by it, the loom in their hands; the user, 10 Nov: "make sure
// the little rowing characters and the oars are actually lined up. Maybe just go back to having two
// little characters and two oars"): each swings fore and aft about its rowlock, dipping its blade
// on the pull. The two sit side by side on one thwart (the user, 10 Nov: "make the ship a little
// wider so the little guys can sit next to each other").
export const SWEEP_X = { port: 0.2, starboard: 0.2 };
// (its rowlock on her gunwale, out from her middle)
export const SWEEP_Z = SLOOP_BEAM / 2 - 0.1;
function sweeps(g) {
  const wood = mat('#7a5634', { map: woodTex }), out = new THREE.Group(), oars = [];
  for (const s of [1, -1]) for (const x of [SWEEP_X[s > 0 ? 'starboard' : 'port']]) {
    const lock = new THREE.Group();
    lock.position.set(x, SLOOP_DECK + 0.12, s * SWEEP_Z);
    lock.rotation.y = s > 0 ? 0 : Math.PI;   // (built for her starboard side, turned round for port)
    const arm = new THREE.Group();
    arm.rotation.order = 'YXZ';
    const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.75, 6).rotateX(Math.PI / 2), wood, false);
    shaft.position.z = 0.725;   // (its loom well inboard, in its rower's hands)
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
  if (WEATHER.parked) return table[w.s];   // (a steady good wind: nothing coming)
  const u = Math.max(0, Math.min(1, 1 - w.left / WIND.WARN));
  return table[w.s] + (table[w.coming.s] - table[w.s]) * u;
}

export function windTick(dt) {
  const h = sail.helm, w = sail.sea.breeze, g = sail.g;
  if (!w || !g) return;
  sail.streaks ||= streaks();
  sail.sweeps ||= sweeps(g);
  sail.arrows ||= arrows();
  // The zones' streaks drift on whatever the weather, quicker the harder it blows there.
  sail.zones ||= sail.sea.zones.map(zoneStreaks);
  for (const Z of sail.zones) Z.tex.offset.y -= dt * [0, 0.08, 0.2][Z.z.s];
  // The wind she feels where she is: a zone's, or the weather's (felt only when it isn't parked).
  const at = h.now(), air = sail.sea.airAt(Math.round(at.c), Math.round(at.r)), felt = !!air?.felt && !h.oars;
  const P = WEATHER.parked, S = sail.streaks, k = Math.min(1, dt * 1.5), t = performance.now() / 1000;
  // The streaks: fainter and slower the lighter it blows, gone in a calm; turning with the wind.
  const want = Math.PI / 2 * -w.d;
  if (S.a === null) S.a = want;
  S.a += (Math.atan2(Math.sin(want - S.a), Math.cos(want - S.a))) * Math.min(1, dt * 1.2);
  S.m.rotation.y = S.a;
  S.op += ((sail.on && !P ? looks(w, OP) : 0) - S.op) * k;
  // The arrows either side of her, under sail (at the oars the wind's nothing to her).
  {
    const A = sail.arrows, wa = Math.atan2(DR[w.d], DC[w.d]);
    if (A.a === null) A.a = wa;
    A.a += Math.atan2(Math.sin(wa - A.a), Math.cos(wa - A.a)) * Math.min(1, dt * 2);
    A.m.opacity += ((sail.on && !h.oars && !P ? looks(w, [0, 0.3, 0.5]) : 0) - A.m.opacity) * k;
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
  const yaw = air?.felt ? Math.atan2(DR[air.d], DC[air.d]) - g.rotation.y : 0;   // (parked, out of a zone, the wind's always behind her)
  fl.userData.yaw = (fl.userData.yaw ?? yaw) + Math.atan2(Math.sin(yaw - (fl.userData.yaw ?? yaw)), Math.cos(yaw - (fl.userData.yaw ?? yaw))) * Math.min(1, dt * 3);
  fl.rotation.y = fl.userData.yaw;
  cloth.rotation.z += (looks(w, FLAG) - cloth.rotation.z) * k;
  // Her sails: full in a good wind, slack in light airs, hanging in a calm; brailed up while she rows;
  // shaking and flogging while she's in irons, her bow into the wind. Where the wind's felt, they
  // answer how she lies to it: square and full with it behind her, braced round and flatter across
  // it, to catch it from the side it's coming from.
  const irons = !h.oars && h.cur?.irons && h.t < h.cur.secs, point = felt ? lie(((Math.round(at.a) % 4) + 4) % 4, air) : 'run';
  let brace = Math.PI / 2 - 0.45;   // (as built: square across her, a little round so they show from the side)
  if (felt && point === 'reach') {
    const across = new THREE.Vector3(DC[air.d], 0, -DR[air.d]).applyAxisAngle(V3(0, 1, 0), -g.rotation.y).z;
    brace = Math.PI / 2 - across * 0.6;
  } else if (felt) brace = Math.PI / 2;
  for (const arm of g.userData.sails) {
    const c = arm.children[0], ht = c.geometry.parameters.height;
    const full = felt ? (point === 'reach' ? 0.75 : 1.25) * [0.1, 0.5, 1][air.s] : [0.12, 0.6, 1.25][w.s];
    const fy = h.oars ? 0.18 : 1, fz = h.oars ? 0.3 : irons ? 0.2 + 0.5 * Math.abs(Math.sin(t * 17 + ht)) : full;
    c.scale.y += (fy - c.scale.y) * k; c.scale.z += (fz - c.scale.z) * (irons ? 1 : k);
    c.position.y = -ht * c.scale.y / 2;
    arm.rotation.z = irons ? Math.sin(t * 13 + ht) * 0.08 : arm.rotation.z * (1 - k);
    arm.rotation.y += (brace - arm.rotation.y) * k;
  }
  // The sweeps: run out (or in) through her sides, stroking while she's under way at the oars, each
  // side as hard as its rower (js/den/rowing.js: going like crazy after a big clear on that side).
  const W = sail.sweeps, moving = h.oars && h.cur && h.cur.m !== 'W' && !h.cur.bump;
  W.out += ((h.oars && sail.rowRate ? 1 : 0) - W.out) * Math.min(1, dt * 2.5);   // (in while her rowers are off them: holed, at the lock)
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
  // Parked, there's no weather to speak of: only a wind zone heads her off, and that's said once,
  // and the pin she can't sail to once for each pin, never with a word of the oars.
  if (WEATHER.parked) {
    if (e.kind === 'headwind') toast('The wind\'s dead against her there: she can\'t sail to the pin', true);
    else if (e.kind === 'move' && e.irons && !sail.said.zoneWind) { sail.said.zoneWind = true; toast('The wind\'s dead against her here', true); }
    return;
  }
  // Said ahead of a change, so it's never a surprise (10 Nov: "it changes quite quickly").
  if (e.kind === 'warn') {
    if (e.s < e.was.s) return toast(e.s ? 'The wind\'s easing: it\'ll drop soon' : 'The wind\'s dying away: a calm\'s coming');
    if (e.s > e.was.s) return toast(e.was.s ? 'The wind\'s freshening' : `A breath of wind's coming, ${windWords(e.d)}`);
    return toast(`The wind's backing round: soon it'll blow ${windWords(e.d)}`);
  }
  if (e.kind === 'wind') {
    if (e.s < e.was.s) return toast(e.s ? 'The wind\'s dropping' : (h.oars ? 'Becalmed!' : 'Becalmed! She\'s dead in the water till the wind picks up'));
    if (e.s > e.was.s) return toast(e.s === 2 ? 'The wind\'s picking up' : `A breath of wind, ${windWords(e.d)}`);
    return toast(`The wind's shifted: it blows ${windWords(e.d)} now`);
  }
  // Only when she really won't (10 Nov: "it's coming up a pop-up saying you can't sail there. Well,
  // it is letting me"): the pilot doesn't row for her any more.
  if (e.kind === 'headwind') return toast('She can\'t sail to the pin: it\'s dead against the wind', true);
  if (e.kind === 'move' && e.irons) {
    const now = performance.now();
    if (!(now < (sail.said.ironsAt ?? 0))) { sail.said.ironsAt = now + 4000; toast(e.m === 'F' ? 'In irons! Her bow\'s into the wind: she makes no way' : 'In irons: she swings her head round, but can\'t make way into the wind', true); }
  }
}

// What the bar's prompt says while she waits on a pin the wind won't let her sail to.
export const headwindPrompt = () => (WEATHER.parked ? 'The wind\'s dead against her there: she can\'t sail to the pin' : 'She can\'t sail to the pin: it\'s dead against the wind · O: out oars and row her there, or wait for it to shift');

// The wind on the sailing bar: an arrow the way it blows (as you're looking), and how strong; and
// the oars, out or in (O, or a click).
const POINT = { run: 'behind her: fastest', reach: 'across her: slower', into: 'dead ahead: in irons' };
const heading = () => ((Math.round(sail.helm.now().a) % 4) + 4) % 4;
export function windHud() {
  const w = sail.sea.breeze;
  if (!w || WEATHER.parked) return '';
  const deg = Math.round(w.d * 90 + view.yaw * 180 / Math.PI);
  const how = sail.helm.oars || !w.s ? '' : `<i>${POINT[pointOf(heading(), w.d)]}</i>`;
  return `<div class="wind s${w.s}" title="The wind: the way it blows, and how strong"><b style="transform:rotate(${deg}deg)">${w.s ? '↑' : '·'}</b><span>${STRENGTH[w.s]}${how}</span></div>`;
}
export const oarsHud = () => `<button class="oars${sail.helm.oars ? ' on' : ''}" id="oars-btn" title="Run out the oars, or ship them (O)"><kbd>O</kbd>${sail.helm.oars ? 'Rowing' : 'Oars'}</button>`;
export const windSig = () => { const w = sail.sea.breeze; return WEATHER.parked ? `${sail.helm.oars}` : w ? `${w.d}${w.s}${Math.round(view.yaw * 36)}${sail.helm.oars}${heading()}` : ''; };
export function rowToggle() {
  const on = sail.helm.row();
  toast(on ? 'Out oars! Clear on both boards to row her ahead: more on one side turns her that way' : (WEATHER.parked ? 'Oars in: she sails on' : 'Oars in: she sails by the wind'));
}
