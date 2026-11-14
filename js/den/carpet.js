// Jazzmy's magic carpet ride (src/den-carpet.ts, its steps and the ride down the wind; src/den-carpet-flight.ts, the
// flight and where she comes down; her lines src/lines/jazzmy.ts): a little adventure on the real sea, from her own
// island (jazzmy-isle.js; den.html?at=carpet). carpetEnter() starts it there and carpetLeave() puts you back aboard;
// den.js hands it the keys, each tick and the camera while it's on.
//
// The sloop comes alongside her jetty. She asks for an Aladdin-style adventure, and a lift to Helium's for rum she's
// running to a blockade; you change into the part for this adventure only (a twirl: a fez, a vest, a sash, patched
// trousers, bare feet, a monkey); a carpet's lashed on crates on the foredeck, "JASMINE" embroidered on it, crossed
// out, "Jazzmy" stitched over; she climbs on. Then the trade wind, a lane of streaks straight down the sea past Tzz's
// and Kikkit's islands (each calling out) to just short of the reef: Space (or the held button on a phone) leans into
// it, the meter showing where that launch alone would take her. Where the wind runs out the sloop stops dead and the
// carpet flies on: steer it (A, D or the arrows; the buttons on a phone) through the gusts hanging over the sea, which
// lift her again, and hold Space (the dive button on a phone) to bring her down where you want her. Where she comes down is the ending: short of the reef, afloat, a seagull landing on her head; into
// rocks, her in a seagulls' nest, the carpet draped over them; the open sea; Helium's island, rum; Port Decorum; another
// island; the race course past the far reef; or off the edge of the sea, a twinkle. Then her word on it (or yours,
// she gone), and the card: Again, or back aboard, and how many endings you've found.
//
// Its frame: one group, `root`, at the trade wind's first square, turned so its +x runs down the sea (the way the wind
// runs) and its +z across it, columns increasing: the flight's own frame (src/den-carpet-flight.ts's pointAt).
import * as THREE from 'three';
import { Ride, CARPET, LAUNCH_X, METER, moodAt, meterAt, ENDINGS, SECS, dressedForIt } from '../den-carpet.js';
import { GUSTS, FLIGHT, groundOf, pointAt } from '../den-carpet-flight.js';
import { LAY } from '../den-sail.js';
import { puff, blastTick } from './blast.js';
import * as LOOK from '../den-look.js';
import { $, scene, hemi, skyDome, paintSky, myLook, V3, toast as denToast, toastQuiet, toastHush, sunOver, makePirate, wearLook, keys, mat, mesh, canvasTex, warm, worldLets, pirate } from './world.js';
import { bubble, bubbleAt } from './cine.js';
import { sloopMesh, SLOOP_DECK } from './sloop.js';
import { sail, seaX, seaZ } from './sea.js';
import { twirl, twirlTick } from './showcase.js';
import { IDLES } from './props-people.js';

const RUN = LAY.JAZZMY.RUN;
const FOUND = 'den.carpet.found';
const toast = (text, bad = false) => denToast(text, bad, false, true);
const touch = matchMedia('(pointer: coarse)').matches;
/** Her jetty's end (jazzmy-isle.js's jetty), where she waits: a sea square, fractional. */
export const JETTY_END = { c: 22.85, r: 4.2 };
/** Her turn on it, in the ride's frame: towards the sloop coming alongside, and the camera. */
const JETTY_YAW = -2.2;

/** All there is of the ride. */
export const carpet = {
  on: false, snap: false, built: false, root: null, ride: null, leaning: false, held: { key: false, btn: false, left: false, right: false },
  sloop: null, you: null, jazz: null, rug: null, ropes: null, crates: null, lane: null, splashes: [], sky: null,
  lines: new Map(), t: 0, found: new Set(), gulls: [], twinkle: null, nest: null, gusts: [], hidden: [], landed: false,
};

// ---------- the page's parts: the bar, the meter, the lean button, the steering, the skip, the card ----------
const hud = document.createElement('div');
hud.className = 'carpet-hud';
hud.innerHTML = '<div class="house-name"><b>Jazzmy\'s carpet ride</b><small>A little adventure</small></div><button class="mini" id="carpet-leave">Back to the den</button>';
const meter = document.createElement('div');
meter.className = 'carpet-meter';
{
  // (each zone as wide as its run of speeds, from the wind's own pace to the most she'll do; a sliver unlabelled)
  const span = CARPET.MAX - CARPET.CRUISE;
  const zones = METER.map((z) => `<span class="cm-${z.id}" style="flex:${z.to - z.from}">${(z.to - z.from) / span > 0.1 ? z.label : ''}</span>`).join('');
  meter.innerHTML = `<div class="cm-zones">${zones}<i id="carpet-needle"></i></div><small id="carpet-left"></small>`;
}
const leanBtn = document.createElement('button');
leanBtn.className = 'carpet-lean'; leanBtn.id = 'carpet-lean';
leanBtn.textContent = touch ? 'Hold to lean into the wind' : 'Hold Space: lean into the wind';
const steerBar = document.createElement('div');
steerBar.className = 'carpet-steer';
// (arrows drawn, not characters: a font's arrow glyphs can't be counted on)
const arrow = (d) => `<svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
steerBar.innerHTML = `<button id="carpet-left-btn" aria-label="Steer left">${arrow('M14 3 L4 10 L14 17 Z')}</button><button class="dive" id="carpet-dive-btn">${touch ? 'Hold to dive' : 'A, D: steer · hold Space: dive'}</button><button id="carpet-right-btn" aria-label="Steer right">${arrow('M6 3 L16 10 L6 17 Z')}</button>`;
const skipBtn = document.createElement('button');
skipBtn.className = 'mini carpet-skip'; skipBtn.id = 'carpet-skip';
skipBtn.textContent = touch ? 'Next' : 'Next (Space)';
const card = document.createElement('div');
card.className = 'carpet-card';
card.innerHTML = '<div><h2 id="carpet-title"></h2><p id="carpet-blurb"></p><p class="cc-far" id="carpet-far"></p><div class="row"><button id="carpet-again">Again</button><button class="link" id="carpet-back">Back to the den</button></div></div>';
const fadeEl = document.createElement('div');
fadeEl.className = 'wed-fade';
document.body.append(hud, meter, leanBtn, steerBar, skipBtn, card, fadeEl);
$('carpet-leave').onclick = (e) => { e.currentTarget.blur(); carpetLeave(); };
$('carpet-back').onclick = () => carpetLeave();
$('carpet-again').onclick = (e) => { e.currentTarget.blur(); again(); };
skipBtn.onclick = (e) => { e.currentTarget.blur(); skip(); };
// The lean button and the steering: held down, not clicked (a phone has no keys).
const hold = (el, k) => {
  const on = (v) => (e) => { e.preventDefault(); carpet.held[k] = v; if (v) try { el.setPointerCapture(e.pointerId); } catch { /* never mind */ } };
  el.addEventListener('pointerdown', on(true));
  el.addEventListener('pointerup', on(false));
  el.addEventListener('pointercancel', on(false));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
};
hold(leanBtn, 'btn');
hold($('carpet-left-btn'), 'left');
hold($('carpet-right-btn'), 'right');
// (diving: Space again in the air, or on a phone this held)
hold($('carpet-dive-btn'), 'btn');
const STEER_KEYS = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
addEventListener('keyup', (e) => {
  if (e.key === ' ') carpet.held.key = false;
  const k = STEER_KEYS[e.key.toLowerCase()];
  if (k) carpet.held[k] = false;
});
addEventListener('blur', () => { Object.keys(carpet.held).forEach((k) => { carpet.held[k] = false; }); });

function fade(then) {
  fadeEl.classList.add('on');
  setTimeout(() => { then(); setTimeout(() => fadeEl.classList.remove('on'), 120); }, 360);
}

// ---------- its frame ----------
const root = () => carpet.root;
/** A point in the ride's frame, in the world. */
const toWorld = (x, y, z) => carpet.root.localToWorld(V3(x, y, z));
/** Where something is, in the ride's frame. */
const local = (o) => carpet.root.worldToLocal(o.getWorldPosition(V3()));
/** A camera's yaw in the ride's frame, as the world's (the frame's turned a quarter). */
const YAW = Math.PI / 2;

// ---------- building it ----------
/** The carpet's own cloth: deep red, a gold border and diamonds, "JASMINE" in gold capitals crossed out with a dark
    thread, "Jazzmy" stitched over it in a wobbly white hand. */
function rugTex() {
  return canvasTex(512, 352, (g, w, h) => {
    g.fillStyle = '#8e1c22'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9a63a'; g.lineWidth = 14; g.strokeRect(12, 12, w - 24, h - 24);
    g.strokeStyle = '#2c4d7a'; g.lineWidth = 6; g.strokeRect(30, 30, w - 60, h - 60);
    g.fillStyle = '#d9a63a';
    for (let i = 0; i < 9; i++) for (const y of [52, h - 52]) { const x = 60 + i * 49; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.closePath(); g.fill(); }
    g.font = 'bold 66px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#e8bb4c'; g.fillText('JASMINE', w / 2, h / 2 + 30);
    // (crossed out, twice over, in a dark thread)
    g.strokeStyle = '#1d0d0b'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w / 2 - 150, h / 2 + 36); g.lineTo(w / 2 + 152, h / 2 + 18); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 146, h / 2 + 22); g.lineTo(w / 2 + 148, h / 2 + 40); g.stroke();
    // (stitched over, by hand: a wobbly running stitch)
    g.font = 'italic bold 58px "Comic Sans MS", "Segoe Print", cursive'; g.fillStyle = '#f4efe2';
    g.save(); g.translate(w / 2 + 10, h / 2 - 48); g.rotate(-0.08); g.fillText('Jazzmy', 0, 0);
    g.setLineDash([7, 6]); g.strokeStyle = '#f4efe2'; g.lineWidth = 3; g.beginPath(); g.moveTo(-110, 34); g.quadraticCurveTo(0, 46, 112, 30); g.stroke();
    g.restore();
  });
}
const RUG = { L: 1.5, W: 1.02 };
/** The carpet: a cloth that can ripple, tassels at each end. */
function makeRug() {
  const geo = new THREE.PlaneGeometry(RUG.L, RUG.W, 24, 6).rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 0.95, side: THREE.DoubleSide });
  const cloth = mesh(geo, m);
  const g = new THREE.Group();
  g.add(cloth);
  const gold = mat('#d9a63a');
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
    const t = mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 4), gold, false);
    t.rotation.z = Math.PI / 2; t.position.set(sx * (RUG.L / 2 + 0.05), 0, -RUG.W / 2 + 0.08 + i * (RUG.W - 0.16) / 6);
    g.add(t);
  }
  g.userData.cloth = cloth;
  g.userData.base = Float32Array.from(geo.attributes.position.array);
  return g;
}
/** Its cloth rippling: `amp` metres, faster with `speed`; flat at 0. */
function ripple(rug, amp, t, speed = 1) {
  const cloth = rug.userData.cloth, pos = cloth.geometry.attributes.position, base = rug.userData.base;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2], back = (RUG.L / 2 - x) / RUG.L;   // (more at its trailing end)
    pos.setY(i, amp * back * Math.sin(x * 5 + t * 9 * speed) + amp * 0.3 * Math.sin(z * 7 + t * 6));
  }
  pos.needsUpdate = true;
  cloth.geometry.computeVertexNormals();
}
/** A seagull: white, grey wings that flap, an orange beak; facing +x. */
function gull() {
  const g = new THREE.Group(), white = mat('#f6f4ee'), grey = mat('#9aa3aa', { side: THREE.DoubleSide });
  const b = mesh(new THREE.SphereGeometry(0.13, 10, 8), white, false); b.scale.set(1.6, 0.9, 0.9); g.add(b);
  const head = mesh(new THREE.SphereGeometry(0.08, 10, 8), white, false); head.position.set(0.19, 0.08, 0); g.add(head);
  const beak = mesh(new THREE.ConeGeometry(0.025, 0.1, 6), mat('#e8a23a'), false); beak.rotation.z = -Math.PI / 2; beak.position.set(0.29, 0.07, 0); g.add(beak);
  for (const z of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.015, 6, 4), mat('#111'), false); e.position.set(0.24, 0.11, z * 0.05); g.add(e); }
  const wings = [-1, 1].map((z) => { const w = new THREE.Group(), p = mesh(new THREE.PlaneGeometry(0.22, 0.42).rotateX(-Math.PI / 2), grey, false); p.position.set(-0.02, 0, z * 0.23); w.add(p); w.position.set(0, 0.04, z * 0.06); g.add(w); return w; });
  g.userData.wings = wings;
  return g;
}
/** A seagull's wings: flapping, or folded. */
function flap(gl, t, on) { gl.userData.wings.forEach((w, i) => { w.rotation.x = on ? (i ? -1 : 1) * Math.sin(t * 14) * 0.8 : 0; }); }
/** A buoy marking the lane, `col` its stripe. */
function buoy(col) {
  const g = new THREE.Group();
  const b = mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 10), mat('#f2eee6'), false); b.position.y = 0.2; g.add(b);
  const s = mesh(new THREE.CylinderGeometry(0.25, 0.285, 0.24, 10), mat(col), false); s.position.y = 0.3; g.add(s);
  const pole = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), mat('#3a2a1a'), false); pole.position.y = 0.95; g.add(pole);
  return g;
}
/** A gust hanging over the sea: rings of white wind turning round a faint column, at the heights she flies. */
function gustMesh() {
  const g = new THREE.Group();
  const swirl = canvasTex(128, 16, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { c.lineWidth = 3; c.beginPath(); c.moveTo(i * 26 + 4, h / 2); c.lineTo(i * 26 + 18, h / 2); c.stroke(); } });
  swirl.wrapS = THREE.RepeatWrapping; swirl.repeat.set(3, 1);
  const m = new THREE.MeshBasicMaterial({ map: swirl, color: '#f4fdff', transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const rings = [1.2, 2.6, 4.0, 5.4].map((y, i) => { const r = mesh(new THREE.TorusGeometry(FLIGHT.GUST_R * (0.75 + i * 0.08), 0.11, 5, 40), m, false); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); return r; });
  const col = mesh(new THREE.CylinderGeometry(FLIGHT.GUST_R * 0.8, FLIGHT.GUST_R * 0.8, 5.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#bfefff', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false }), false);
  col.position.y = 2.7; g.add(col);
  g.userData = { rings, m, col, taken: -1 };
  return g;
}

function build() {
  const r = new THREE.Group();
  r.position.set(seaX(RUN.c), 0, seaZ(RUN.r0));
  r.rotation.y = YAW;
  scene.add(r);
  carpet.root = r;
  const L = CARPET.LANE;
  // The trade wind: a lane of streaks running down the sea, fading out where it ends.
  const streaks = canvasTex(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(245,252,255,0.95)'; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const y = 4 + Math.random() * (h - 8), x = Math.random() * w, l = 30 + Math.random() * 60; g.lineWidth = 1.5 + Math.random() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  });
  streaks.wrapS = streaks.wrapT = THREE.RepeatWrapping; streaks.repeat.set(L / 9, 1);
  const fadeOut = canvasTex(256, 4, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.05, '#fff'); gr.addColorStop(0.9, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const lane = mesh(new THREE.PlaneGeometry(L + 6, 3.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: streaks, alphaMap: fadeOut, transparent: true, opacity: 0.75, depthWrite: false }), false);
  lane.position.set(L / 2, 0.06, 0); lane.renderOrder = 2; r.add(lane);
  const band = mesh(new THREE.PlaneGeometry(L + 6, 3.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#8fe0f2', alphaMap: fadeOut, transparent: true, opacity: 0.22, depthWrite: false }), false);
  band.position.set(L / 2, 0.05, 0); band.renderOrder = 2; r.add(band);
  carpet.lane = streaks;
  for (let x = 8; x < L; x += 8) for (const z of [-2.4, 2.4]) { const b = buoy('#2f7fc0'); b.position.set(x, 0, z); r.add(b); }
  // Where the wind runs out: red buoys, a pennant each.
  const pennant = new THREE.MeshStandardMaterial({ color: '#d0302a', side: THREE.DoubleSide });
  for (const z of [-2.4, 2.4]) {
    const b = buoy('#d0302a'); b.position.set(L + 2.6, 0, z); r.add(b);
    const f = mesh(new THREE.PlaneGeometry(0.6, 0.35), pennant, false); f.position.set(L + 2.9, 1.25, z); r.add(f);
  }
  // The gusts over the sea past the reef.
  carpet.gusts = GUSTS.map((q) => { const g = gustMesh(); g.position.set(q.x, 0, q.z); r.add(g); return g; });
  // A seagulls' nest, put on the rocks she lands on; the seagulls: one for her head, three round the nest.
  const nest = new THREE.Group(), twig = mat('#8a6a3e', { roughness: 1 });
  for (let i = 0; i < 26; i++) { const t = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 4), twig, false); const a = i * 2.4; t.rotation.order = 'YXZ'; t.position.set(Math.cos(a) * 0.42, 0.1 + (i % 3) * 0.06, Math.sin(a) * 0.42); t.rotation.set(Math.PI / 2, 0, a + 1.3); nest.add(t); }
  const bowl = mesh(new THREE.SphereGeometry(0.5, 14, 6, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), twig); bowl.position.y = 0.38; nest.add(bowl);
  for (const [x, z] of [[0.12, 0.05], [-0.1, 0.1], [0, -0.12]]) { const e = mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#f1ead8')); e.scale.y = 1.3; e.position.set(x, 0.05, z); nest.add(e); }
  nest.visible = false; r.add(nest);
  carpet.nest = nest;
  for (let i = 0; i < 3; i++) { const gl = gull(); gl.visible = false; r.add(gl); carpet.gulls.push(gl); }
  // A twinkle, where she goes off the edge of the sea.
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,248,210,0.8)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
    for (const [dx, dy] of [[1, 0], [0, 1]]) { g.beginPath(); g.moveTo(w / 2 - dx * 30 - dy * 3, h / 2 - dy * 30 - dx * 3); g.lineTo(w / 2 + dx * 30 + dy * 3, h / 2 + dy * 30 + dx * 3); g.lineTo(w / 2 + dx * 30 - dy * 3, h / 2 + dy * 30 - dx * 3); g.lineTo(w / 2 - dx * 30 + dy * 3, h / 2 - dy * 30 + dx * 3); g.fill(); }
  }), transparent: true, depthWrite: false, fog: false }));
  star.visible = false; r.add(star);
  carpet.twinkle = star;
  // The sloop, her bow down the wind (+x).
  const s = sloopMesh();
  r.add(s);
  carpet.sloop = s;
  // Two crates on her foredeck, the carpet lashed over them: "on the roof".
  const crateM = mat('#9a7448'), top = CARPET.DECK_H;
  const crates = new THREE.Group();
  for (const dx of [-0.42, 0.42]) { const c = mesh(new THREE.BoxGeometry(0.66, top - SLOOP_DECK - 0.04, 0.9), crateM); c.position.set(CARPET.RUG_X + dx, SLOOP_DECK + (top - SLOOP_DECK - 0.04) / 2, 0); crates.add(c); }
  s.add(crates);
  carpet.crates = crates;
  const ropes = new THREE.Group(), rope = mat('#c9b48a');
  for (const dx of [-0.42, 0.42]) {
    const k = mesh(new THREE.CylinderGeometry(0.018, 0.018, RUG.W + 0.1, 5), rope, false); k.rotation.x = Math.PI / 2; k.position.set(CARPET.RUG_X + dx, top + 0.03, 0); ropes.add(k);
    for (const z of [-1, 1]) { const d = mesh(new THREE.CylinderGeometry(0.018, 0.018, top - SLOOP_DECK, 5), rope, false); d.position.set(CARPET.RUG_X + dx, SLOOP_DECK + (top - SLOOP_DECK) / 2, z * (RUG.W / 2 + 0.05)); ropes.add(d); }
  }
  s.add(ropes);
  carpet.ropes = ropes;
  carpet.rug = makeRug();
  // You, at her tiller on the raised stern; Jazzmy on her jetty.
  carpet.you = makePirate({ look: myLook });
  s.add(carpet.you.g);
  carpet.jazz = makePirate({ look: LOOK.PIRATES.Jazzmy });
  r.add(carpet.jazz.g);
  carpet.built = true;
  warm(r);
}
/** Puts everything back where a ride starts: the sloop off her jetty, the carpet lashed on, Jazzmy on the jetty (or,
    `aboard`, already on the carpet). */
function setUp(aboard) {
  const s = carpet.sloop;
  s.position.set(0, 0, 0); s.rotation.set(0, 0, 0);
  carpet.rug.position.set(CARPET.RUG_X, CARPET.DECK_H + 0.04, 0); carpet.rug.rotation.set(0, 0, 0);
  s.add(carpet.rug);
  ripple(carpet.rug, 0, 0);
  carpet.rug.visible = !!aboard;
  carpet.crates.visible = !!aboard;
  carpet.ropes.visible = !!aboard;
  const J = carpet.jazz;
  wearLook(J, LOOK.PIRATES.Jazzmy);
  J.g.visible = true; J.at = null; J.lift = null; J.hop = null; J.body.rotation.x = 0;
  if (aboard) seat(J);
  else { root().add(J.g); const p = pointAt(JETTY_END.c, JETTY_END.r); J.g.position.set(p.x, 0.51, p.z); J.g.rotation.set(0, JETTY_YAW, 0); J.seated = false; }
  const Y = carpet.you;
  Y.g.position.set(-1.45, SLOOP_DECK + 0.35, 0); Y.g.rotation.set(0, Math.PI / 2, 0);
  for (const sp of carpet.splashes) sp.removeFromParent();
  carpet.splashes = [];
  carpet.landed = false;
  for (const gl of carpet.gulls) { gl.removeFromParent(); root().add(gl); gl.visible = false; gl.scale.setScalar(1); gl.userData.on = null; }
  carpet.twinkle.visible = false;
  carpet.nest.visible = false;
  for (const g of carpet.gusts) { g.visible = true; g.userData.taken = -1; g.userData.m.opacity = 1; g.userData.col.material.opacity = 0.22; g.scale.setScalar(1); }
}
/** Jazzmy sat on the carpet, cross-legged, facing down the wind. */
function seat(J) {
  carpet.rug.add(J.g);
  J.g.position.set(-0.1, 0, 0); J.g.rotation.set(0, Math.PI / 2, 0);
  J.seated = true;
}
/** Legs folded under her, sat on whatever she's on. */
function sitPose(J) {
  J.legs[0].rotation.set(-1.45, 0, 0.35); J.legs[1].rotation.set(-1.45, 0, -0.35);
  J.g.position.y = -0.38;
}

// ---------- in and out ----------
/** Off to the carpet ride, at her island on the sea; `bySea`, picked up off it (jazzmy-isle.js), back aboard the sloop
    moored there after; `hide`, things that are the ride's own while it's on (her, waiting on the jetty). */
export function carpetEnter({ bySea = false, hide = [] } = {}) {
  if (carpet.on) return false;
  const back = bySea ? 'Back aboard' : 'Back to the den';
  $('carpet-leave').textContent = back; $('carpet-back').textContent = back;
  fade(() => {
    if (!carpet.built) build();
    carpet.found = new Set((safeGet(FOUND) || '').split(',').filter((e) => e in ENDINGS));
    carpet.ride = new Ride(groundOf(sail.sea));
    setUp(false);
    wearLook(carpet.you, myLook);
    // (the real sloop moored at her island, you aboard her, and her waiting on her jetty: the ride's own while it's on)
    carpet.hidden = [sail.g, pirate.g, ...hide].filter(Boolean).map((o) => [o, o.visible]);
    for (const [o] of carpet.hidden) o.visible = false;
    Object.assign(carpet, { on: true, snap: true, t: 0, leaning: false });
    Object.keys(carpet.held).forEach((k) => { carpet.held[k] = false; });
    carpet.root.visible = true;
    enterSky();
    toastQuiet.on = true; toastHush();
    document.body.classList.add('carpeting');
    keys.clear();
    hush();
    card.classList.remove('on');
    happen(carpet.ride.opening());
  });
  return true;
}
/** Back to where you were (her deck at sea, moored off her island, or the den): as it was when you left. */
export function carpetLeave() {
  if (!carpet.on) return;
  fade(() => {
    carpet.on = false; carpet.snap = true;
    carpet.root.visible = false;
    for (const [o, v] of carpet.hidden) o.visible = v;
    carpet.hidden = [];
    hush();
    card.classList.remove('on');
    document.body.classList.remove('carpeting');
    toastQuiet.on = false;
    leaveSky();
    keys.clear();
    try { const u = new URL(location.href); if (u.searchParams.get('at') === 'carpet') { u.searchParams.delete('at'); history.replaceState(history.state, '', u); } } catch { /* never mind */ }
  });
}
function again() {
  card.classList.remove('on');
  hush();
  setUp(true);
  happen(carpet.ride.again());
}
function skip() {
  if (!carpet.on) return;
  happen(carpet.ride.skip());
}
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* never mind */ } };

function enterSky() {
  carpet.sky = { col: skyDome.geometry.attributes.color, bg: scene.background.clone(), fog: scene.fog.color.clone(), hemi: [hemi.color.clone(), hemi.groundColor.clone(), hemi.intensity] };
  paintSky('#3f8fd8', '#cfe8f3');
  scene.fog.color.set('#cfe8f3');
  hemi.color.set('#fff3dc'); hemi.groundColor.set('#3d7590'); hemi.intensity = 1.25;
}
function leaveSky() {
  const s = carpet.sky;
  if (!s) return;
  skyDome.geometry.setAttribute('color', s.col);
  scene.background.copy(s.bg); scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hemi[0]); hemi.groundColor.copy(s.hemi[1]); hemi.intensity = s.hemi[2];
  sunOver(0, 0, 0);
  carpet.sky = null;
}

// ---------- what happens ----------
/** Someone says something: a bubble over them a while (Jazzmy, you; or someone on their island, `at` a sea square). */
function say(who, text, at) {
  let L = carpet.lines.get(who);
  if (!L) { L = { el: bubble('', document.body, 'wrap carpet-say') }; carpet.lines.set(who, L); }
  L.fig = who === 'you' ? carpet.you : who === 'jazzmy' ? carpet.jazz : null;
  L.at = at ? V3(seaX(at[0]), 3.1, seaZ(at[1])) : L.at;
  L.el.textContent = text;
  L.until = performance.now() + Math.max(2200, 900 + text.length * 70);
}
function hush() { for (const L of carpet.lines.values()) L.until = 0; }
/** Where someone who isn't aboard stands, for their line when she lands: Helium by their still, the jetty's guard. */
const HOSTS = { helium: [22.6, 27.4], guard: [12.5, 28.5] };
/** The ride's events, drawn. */
function happen(events) {
  for (const e of events) {
    if (e.kind === 'say') say(e.who, e.text, e.at ?? HOSTS[e.who]);
    else if (e.kind === 'launch') launch();
    else if (e.kind === 'gust') gusted(e.i);
    else if (e.kind === 'land') landed(e.landed);
    else if (e.kind === 'phase') phase(e.phase);
  }
}
function phase(p) {
  const J = carpet.jazz;
  if (p === 'dress') { wearLook(carpet.you, LOOK.cleanLook(dressedForIt(myLook))); twirl(carpet.you); }
  else if (p === 'lash') { carpet.crates.visible = true; carpet.ropes.visible = true; carpet.rug.visible = true; }
  else if (p === 'board') { J.hop = { t: 0, from: local(J.g) }; }
  else if (p === 'down') afterwards(carpet.ride.result);
  else if (p === 'card') showCard();
}
/** The wind's run out: the carpet's off the sloop, into the flight's hands. */
function launch() {
  const rug = carpet.rug, from = local(rug);
  root().add(rug);
  rug.position.copy(from); rug.rotation.set(0, 0, 0);
  carpet.ropes.visible = false;
}
/** Through a gust: its rings flare and it's spent. */
function gusted(i) {
  const g = carpet.gusts[i];
  if (g) g.userData.taken = 0;
}
/** Once she's down: a seagull coming down onto her head (short of the reef), seagulls round the nest (rocks), a
    twinkle where she went off the edge of the sea. */
function afterwards(L) {
  if (!L) return;
  const J = carpet.jazz, w = local(J.g);
  if (L.where === 'short') {
    const gl = carpet.gulls[0];
    gl.visible = true;
    gl.userData.on = { kind: 'land', t: 0, from: V3(w.x + 4, 5, w.z - 3) };
  } else if (L.where === 'rocks') {
    carpet.gulls.forEach((gl, i) => { gl.visible = true; gl.userData.on = { kind: 'circle', t: i * 2.1, at: carpet.nest.position.clone() }; });
  }
}
function landed(L) {
  const J = carpet.jazz, rug = carpet.rug, at = rug.position, e = L.where;
  carpet.landed = true;
  ripple(rug, 0, 0);
  rug.rotation.set(0, 0, 0);
  at.set(L.x, L.h + 0.04, L.z);
  // (into the water: short of the reef, the open sea, the race course, or a harbour, Helium's or Port Decorum's)
  if (e === 'short' || e === 'sea' || e === 'race' || L.h <= 0) { splash(at.x, at.z, e === 'short' ? 0.5 : 1); at.y = 0.03; J.at = 'afloat'; }
  else if (e === 'rocks') {
    // Smack into the rocks: dust, the carpet left draped over them, her flung up into a seagulls' nest on top.
    worldLets.shake = 0.6;
    const hit = toWorld(at.x, at.y + 0.3, at.z);
    for (let i = 0; i < 6; i++) puff(hit.clone().add(V3((Math.random() - 0.5) * 0.8, Math.random() * 0.6, (Math.random() - 0.5) * 1.2)), { size: 1.1, life: 2.5, rise: 0.5, dark: 0.1, delay: i * 0.05, drift: 0.6 });
    carpet.nest.position.set(at.x + 0.9, FLIGHT.ROCK_TOP + 0.35, at.z);
    carpet.nest.visible = true;
    const w = local(J.g);
    root().add(J.g); J.g.position.copy(w); J.g.rotation.set(0, -Math.PI / 2, 0); J.seated = false;
    J.lift = { t: 0, from: w, to: V3(at.x + 0.9, FLIGHT.ROCK_TOP + 0.63, at.z) };
    at.set(at.x - 0.2, FLIGHT.ROCK_TOP - 0.2, at.z); rug.rotation.set(0, 0, 1.0);
    J.at = 'nest';
  } else if (e === 'over') {
    J.at = 'gone'; rug.visible = false; J.g.visible = false;
    carpet.twinkle.position.set(at.x, at.y + 0.5, at.z);
    carpet.twinkle.visible = true; carpet.twinkle.userData.t = 0;
  } else {
    // (down on an island: Helium's, Port Decorum, another; stood up on it)
    const w = local(J.g);
    root().add(J.g); J.g.position.set(w.x, FLIGHT.LAND_H, w.z + 0.6); J.g.rotation.set(0, 0, 0); J.seated = false;
    at.y = FLIGHT.LAND_H + 0.02;
    J.at = 'ashore';
  }
  carpet.found.add(e);
  safeSet(FOUND, [...carpet.found].join(','));
}
/** White water thrown up where something lands, and a ring spreading out. */
function splash(x, z, size) {
  const drop = mat('#ffffff', { transparent: true, opacity: 0.9, roughness: 0.2 });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.userData.bits = [];
  for (let i = 0; i < 26; i++) {
    const b = mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 6, 4), drop, false);
    const a = Math.random() * Math.PI * 2, out = (0.6 + Math.random() * 1.6) * size;
    g.add(b);
    g.userData.bits.push({ b, vx: Math.cos(a) * out, vz: Math.sin(a) * out, vy: (3 + Math.random() * 4) * size });
  }
  const ring = mesh(new THREE.RingGeometry(0.3, 0.55, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }), false);
  ring.position.y = 0.05; g.add(ring);
  g.userData.ring = ring; g.userData.t = 0; g.userData.drop = drop;
  root().add(g);
  carpet.splashes.push(g);
}
function splashTick(dt) {
  for (const g of carpet.splashes) {
    const u = g.userData;
    u.t += dt;
    for (const s of u.bits) { s.vy -= 9.8 * dt; s.b.position.x += s.vx * dt; s.b.position.z += s.vz * dt; s.b.position.y = Math.max(-0.2, s.b.position.y + s.vy * dt); }
    u.ring.scale.setScalar(1 + u.t * 5);
    u.ring.material.opacity = Math.max(0, 0.8 - u.t * 0.4);
    u.drop.opacity = Math.max(0, 0.9 - u.t * 0.5);
  }
}
function showCard() {
  const L = carpet.ride.result;
  if (!L) return;
  const E = ENDINGS[L.where], n = carpet.found.size, all = Object.keys(ENDINGS).length;
  $('carpet-title').textContent = E.title;
  $('carpet-blurb').textContent = E.blurb;
  $('carpet-far').textContent = n >= all ? 'Every ending found.' : `Endings found: ${n} of ${all}.`;
  card.classList.add('on');
}

// ---------- keys, each tick, the camera ----------
/** Keys while you're on the ride (den.js hands them all over). */
export function carpetKey(key, e) {
  if (!carpet.on) return false;
  e.preventDefault?.();
  if (key === ' ' || key === 'enter') {
    if (card.classList.contains('on')) { if (!e.repeat) again(); return true; }
    carpet.held.key = true;
    if (!e.repeat && carpet.ride.phase !== 'ride') skip();
    return true;
  }
  const k = STEER_KEYS[key];
  if (k) { carpet.held[k] = true; return true; }
  if (key === 'escape' && !e.repeat) carpetLeave();
  return true;
}
const camK = { look: V3(), dist: 10, tilt: 0.3, yaw: 0 };
export function carpetTick(dt) {
  if (!carpet.on || !carpet.ride) return;
  const R = carpet.ride, P = R.phase, H = carpet.held;
  carpet.t += dt;
  const leaning = H.key || H.btn;
  carpet.leaning = leaning && (P === 'ride' || P === 'ready');
  const steer = (H.right ? 1 : 0) - (H.left ? 1 : 0);
  happen(R.tick(dt, (P === 'ride' || P === 'ready') && leaning, steer, P === 'fly' && leaning));
  const t = carpet.t, s = carpet.sloop, J = carpet.jazz, Y = carpet.you;
  // Her: in to her jetty at the start; down the wind; stopping dead where it runs out.
  const arrive = P === 'arrive' ? Math.min(1, R.t / SECS.arrive) : 1;
  s.position.x = P === 'arrive' ? -12 * (1 - arrive) ** 2 : R.x;
  const v = R.v;
  s.position.y = Math.sin(t * 1.7) * 0.05 * (1 + v / 8);
  s.rotation.x = Math.sin(t * 1.3) * 0.02 * (1 + v / 6);
  s.rotation.z = P === 'stop' ? -0.16 * Math.sin(Math.PI * Math.min(1, R.t / SECS.stop)) : -v * 0.005;
  carpet.lane.offset.x -= dt * (P === 'ride' ? 1.2 + v * 0.1 : 0.5);
  // The carpet: rippling on her, then in flight, banking as you steer and tipping as she climbs or drops.
  const F = R.flight;
  if (F && !carpet.landed) {
    const rug = carpet.rug;
    rug.position.set(F.x, F.h + 0.04, F.z);
    rug.rotation.x += (-F.s * 0.07 - rug.rotation.x) * Math.min(1, dt * 6);
    rug.rotation.z = Math.max(-0.4, Math.min(0.4, F.w * 0.05));
    ripple(rug, 0.07, t, 1.4);
  } else if (!F) ripple(carpet.rug, 0.015 + v * 0.005, t, 0.4 + v / 8);
  // Afloat, she drifts on it, bobbing.
  if (carpet.landed && J.at === 'afloat') { const rug = carpet.rug; rug.position.x += dt * 0.3; rug.position.y = 0.03 + Math.sin(t * 2) * 0.04; rug.rotation.z = Math.sin(t * 1.6) * 0.04; }
  // The gusts turning; one she's flown through flaring and fading.
  for (const g of carpet.gusts) {
    const u = g.userData;
    u.rings.forEach((rg, i) => { rg.rotation.z += dt * (1.6 + i * 0.5); });
    u.m.map.offset.x -= dt * 0.8;
    if (u.taken >= 0) { u.taken += dt; g.scale.setScalar(1 + u.taken * 1.5); u.m.opacity = Math.max(0, 1 - u.taken * 1.3); u.col.material.opacity = Math.max(0, 0.22 - u.taken * 0.3); if (u.taken > 0.8) g.visible = false; }
  }
  // You at the tiller, your hand on it; dressing with a twirl.
  IDLES.stand(Y, t, false);
  Y.g.position.y = SLOOP_DECK + 0.35;   // (the twirl's hop is added on each tick: from here)
  Y.arms[1].rotation.set(-0.8, 0, 0);
  if (P === 'stop') Y.body.rotation.x = 0.35; else Y.body.rotation.x = 0;
  twirlTick(Y, dt, Math.PI / 2);
  poseJazz(J, P, R, dt, t);
  gullsTick(dt, t);
  splashTick(dt);
  blastTick();
  const tw = carpet.twinkle;
  if (tw.visible) { tw.userData.t += dt; const k = tw.userData.t; tw.scale.setScalar(k < 0.25 ? k * 24 : Math.max(0.001, 6 * (1 - (k - 0.25) / 1.4))); tw.material.rotation = k * 3; if (k > 1.65) tw.visible = false; }
  // The bubbles over whoever's talking.
  const now = performance.now();
  for (const L of carpet.lines.values()) {
    if (now >= L.until) { L.el.style.display = 'none'; continue; }
    const w = L.fig ? L.fig.g.getWorldPosition(V3()) : L.at;
    if (!w) { L.el.style.display = 'none'; continue; }
    bubbleAt(L.el, true, w.x, w.y + (L.fig ? 2.3 : 0), w.z);
  }
  // The page: the meter and the lean button while she can sail, the steering while she flies, the skip while her lines
  // are going.
  const sailing = P === 'ready' || P === 'ride', flying = (P === 'stop' || P === 'fly') && !carpet.landed;
  meter.classList.toggle('on', sailing);
  leanBtn.classList.toggle('on', sailing);
  leanBtn.classList.toggle('held', carpet.leaning);
  $('carpet-dive-btn').classList.toggle('held', P === 'fly' && leaning);
  steerBar.classList.toggle('on', flying);
  skipBtn.classList.toggle('on', ['hello', 'ask', 'where', 'plan', 'dress', 'lash', 'board', 'down', 'punch'].includes(P));
  if (sailing) {
    $('carpet-needle').style.left = `${meterAt(v) * 100}%`;
    $('carpet-left').textContent = P === 'ready' ? 'The wind runs out at the red buoys, just short of the reef.' : `The wind runs out in ${Math.ceil(R.left)} m`;
    meter.dataset.mood = moodAt(v);
  }
  const sw = toWorld(F && !carpet.landed ? F.x : s.position.x, 0, F && !carpet.landed ? F.z : 0);
  sunOver(sw.x, 0, sw.z);
}
/** The seagulls: one gliding down to land on her head and staying there; three circling the nest, crying. */
function gullsTick(dt, t) {
  const J = carpet.jazz;
  for (const gl of carpet.gulls) {
    const on = gl.userData.on;
    if (!on || !gl.visible) continue;
    on.t += dt;
    if (on.kind === 'land') {
      const k = Math.min(1, on.t / 2.2), to = root().worldToLocal(J.body.localToWorld(V3(0, 1.24, 0)));
      if (k < 1) {
        gl.position.set(on.from.x + (to.x - on.from.x) * k, on.from.y + (to.y - on.from.y) * k + Math.sin(Math.PI * k) * 0.8, on.from.z + (to.z - on.from.z) * k);
        gl.rotation.y = Math.atan2(-(to.z - on.from.z), to.x - on.from.x);
        flap(gl, t, true);
      } else {
        if (gl.parent !== J.body) { J.body.add(gl); gl.position.set(0, 1.24, 0); gl.rotation.set(0, Math.PI / 2, 0); gl.scale.setScalar(0.85); }
        flap(gl, t, (t % 3) < 0.3);
      }
    } else {
      const a = on.t * 0.9, r = 1.6 + 0.3 * Math.sin(on.t * 0.7);
      gl.position.set(on.at.x + Math.cos(a) * r, on.at.y + 1.5 + Math.sin(on.t * 1.3) * 0.3, on.at.z + Math.sin(a) * r);
      gl.rotation.y = -a - Math.PI;   // (along its circle)
      gl.rotation.z = 0.25;
      flap(gl, t + on.t, true);
    }
  }
}
/** Jazzmy, by the step: waving on her jetty, hopping onto the carpet, sat on it down the wind (arms up the faster she
    goes), flying, then wherever she came down. */
function poseJazz(J, P, R, dt, t) {
  J.body.rotation.x = 0;
  if (J.hop) {
    J.hop.t += dt;
    const k = Math.min(1, J.hop.t / 0.9), to = local(carpet.rug), from = J.hop.from;
    J.g.position.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(Math.PI * k) * 1.4, from.z + (to.z - from.z) * k);
    J.g.rotation.y = Math.PI / 2;
    IDLES.tada(J, t, false);
    if (k >= 1) { J.hop = null; seat(J); }
    return;
  }
  if (J.lift) {
    // (flung up off the rocks into the nest on top)
    J.lift.t += dt;
    const k = Math.min(1, J.lift.t / 0.8), a = J.lift.from, b = J.lift.to;
    J.g.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(Math.PI * k) * 1.4, a.z + (b.z - a.z) * k);
    J.g.rotation.x = k < 1 ? k * Math.PI * 2 : 0;
    IDLES.scream(J, t, false);
    if (k >= 1) { J.lift = null; J.g.rotation.x = 0; }
    return;
  }
  if (J.at === 'nest') { IDLES[P === 'punch' || P === 'card' ? 'shrug' : 'cower'](J, t, P === 'punch'); sitPose(J); J.g.position.y = FLIGHT.ROCK_TOP + 0.25; faceCam(J, dt); return; }
  if (J.at === 'ashore') { J.legs.forEach((l) => l.rotation.set(0, 0, 0)); IDLES[P === 'punch' ? 'talk' : 'tada'](J, t, P === 'punch'); J.g.position.y = FLIGHT.LAND_H; faceCam(J, dt); return; }
  if (J.seated) {
    const m = moodAt(R.v), F = R.flight;
    const idle = carpet.landed ? (P === 'punch' ? 'talk' : 'stand')
      : F ? (F.h < 1.4 && F.w < 0 ? 'cower' : 'tada') : P === 'ride' ? { bored: 'stand', happy: 'clap', thrilled: 'tada', scared: 'cower' }[m] : 'sway';
    (IDLES[idle] || IDLES.stand)(J, t, carpet.landed && P === 'punch');
    sitPose(J);
    if (carpet.landed && J.at === 'afloat') {
      // (paddling with her goblet, one side then the other)
      const sw = Math.sin(t * 2.4);
      J.arms[0].rotation.set(-0.9 + sw * 0.5, 0, 0.5); J.arms[1].rotation.set(-0.9 - sw * 0.5, 0, -0.5);
    }
    return;
  }
  // On her jetty: waving as you come alongside, talking as she asks.
  J.g.position.y = 0.51;
  IDLES[P === 'hello' || P === 'arrive' ? 'wave' : P === 'ask' || P === 'where' ? 'talk' : 'sway'](J, t, P === 'ask' || P === 'where');
  J.g.rotation.y = JETTY_YAW;
}
/** Turned to the camera (her face, to you). */
function faceCam(J, dt) {
  const want = camK.yaw - YAW;
  let d = want - J.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
  J.g.rotation.y += d * Math.min(1, dt * 3);
}
/** The camera on the ride (den.js uses it whole while it's on): a shot for each step, chasing her down the wind and
    behind the carpet in the air. Yaws in the ride's frame. */
export function carpetCam() {
  if (!carpet.on || !carpet.ride) return null;
  const R = carpet.ride, P = R.phase, s = carpet.sloop.position, J = local(carpet.jazz.g), F = R.flight;
  const tall = innerWidth < innerHeight;
  let C;
  if (P === 'arrive') C = { look: [s.x - 0.5, 1.2, 1.4], dist: 15, tilt: 0.32, yaw: 2.5 };
  else if (P === 'hello' || P === 'ask' || P === 'where') C = { look: [J.x, 2.0, J.z], dist: 5.2, tilt: 0.25, yaw: -2.2 };
  else if (P === 'plan' || P === 'dress') C = { look: [s.x - 1.45, 2.3, 0.6], dist: tall ? 7 : 5.2, tilt: 0.14, yaw: 2.8 };
  else if (P === 'lash') C = { look: [s.x + CARPET.RUG_X, CARPET.DECK_H, 0], dist: 3.1, tilt: 1.05, yaw: -0.05 };
  else if (P === 'board') C = { look: [s.x + 0.4, 1.6, 0.8], dist: 8.5, tilt: 0.3, yaw: 2.6 };
  else if (P === 'ready' || P === 'ride') { const v = R.v; C = { look: [s.x + 4 + v * 0.3, 1.3, 0], dist: (tall ? 15 : 11) + v * 0.3, tilt: 0.3, yaw: -2.14 + Math.sin(carpet.t * 0.2) * 0.05 }; }
  else if ((P === 'stop' || P === 'fly') && F && !carpet.landed) C = { look: [F.x + 3, F.h + 0.4, F.z], dist: tall ? 14 : 10, tilt: 0.34, yaw: -1.45 - F.s * 0.03 };
  else if ((P === 'down' || P === 'punch' || P === 'card' || P === 'fly') && carpet.jazz.at === 'gone') { const tw = carpet.twinkle.position; C = { look: [tw.x, tw.y * 0.5, tw.z], dist: tall ? 30 : 24, tilt: 0.12, yaw: -1.35 }; }
  else if (P === 'down' || P === 'punch' || P === 'fly') {
    // (down on an island, from the way she came in, over the water: whatever's on it behind her, not in the way)
    const at = carpet.jazz.at, far = { nest: 6.5, ashore: 6.5 }[at] ?? 4.8;
    C = { look: [J.x, J.y + 0.9, J.z], dist: tall ? far * 1.35 : far, tilt: at === 'nest' ? 0.2 : 0.16, yaw: at === 'ashore' ? -1.3 : -0.55 };
  }
  else C = { look: [J.x - 3, 1.2, J.z], dist: 13, tilt: 0.35, yaw: -0.8 };
  camK.yaw = C.yaw + YAW;
  const snap = carpet.snap;
  carpet.snap = false;
  return { look: toWorld(...C.look), dist: C.dist, tilt: C.tilt, yaw: C.yaw + YAW, cut: snap };
}
