// The Pirate Den's shared parts: the renderer, scene, camera and lights, materials and little
// helpers, the pirates' figures, your flag, the game state and toasts. (Split out of den.js.)
import * as THREE from 'three';
import { turnWide } from '../den-deal.js';
import { WALK_CADENCE, newGait, gaitStep, gaitPose } from '../walk.js';
import { dressPirate, familiarTick, cleanLook, cleanDen, drawFlag } from '../den-look.js';

// The main puzzle's engine, turned for wide shapes (see turnWide in src/den-deal.ts).
export const C = turnWide(window.Carp);
/* An exact tiling with a mix of pieces, as a crew would really fill it: the solver always reaches
   for the P first, so a frame filled by it (the cheat stages) came out nearly all Ps. Each square
   tries the pieces used least so far first, in a shuffled order. Null if it's taking too long. */
export function mixedTiling(cells) {
  const b = C.bbox(cells), flip = b.w > b.h, T = (cs) => cs.map(([r, c]) => [c, r]);
  const order = (flip ? T(cells) : cells).slice().sort((a, z) => a[0] - z[0] || a[1] - z[1]);
  const free = new Set(order.map(([r, c]) => k(r, c))), used = {}, cur = [];
  let nodes = 0;
  const rec = () => {
    if (++nodes > 20000) return false;
    const f = order.find(([r, c]) => free.has(k(r, c)));
    if (!f) return true;
    const os = window.Carp.ORIENTS.map((o) => [o, (used[o.letter] || 0) + Math.random() * 2]).sort((a, z) => a[1] - z[1]);
    for (const [o] of os) {
      const dr = f[0] - o.cells[0][0], dc = f[1] - o.cells[0][1], placed = o.cells.map(([r, c]) => [r + dr, c + dc]);
      if (!placed.every(([r, c]) => free.has(k(r, c)))) continue;
      placed.forEach(([r, c]) => free.delete(k(r, c)));
      used[o.letter] = (used[o.letter] || 0) + 1;
      cur.push({ letter: o.letter, cells: placed });
      if (rec()) return true;
      cur.pop();
      used[o.letter]--;
      placed.forEach(([r, c]) => free.add(k(r, c)));
      if (nodes > 20000) return false;
    }
    return false;
  };
  if (cells.length % 5 || !rec()) return null;
  return cur.map((p) => ({ letter: p.letter, cells: flip ? T(p.cells) : p.cells }));
}
export const S = 0.55;          // one carpentry square, in metres
export const WOOD_D = 0.5;      // depth of a wooden piece
export const STONE_D = 0.7;
export const REACH = 2.4;       // how far along the wall the pirate can reach
// With the mouse, further: the next hole along, from in front of either one (the user: you
// shouldn't have to walk right up to each). Holes come in pairs about 4 m apart; not across the gate.
export const MREACH = 6;
export const WALL_Z = 2.7;
export const DEN_BACK = 14.5;   // how far back the den goes (10.5 till 9 Nov: deeper, for more to build)      // how close to the wall the pirate must stand to fit a piece
export const SPEED = 5.4;         // (4.6, then 5, now 5.4: the user and a friend wanted the pace a bit quicker)
// Seconds of one raider hacking at it at full speed (piece: each piece in an unfinished hole; patch:
// a board nailed on behind). A piece was 4: a half-mended hole fell in seconds and early waves were
// lost anyway; at 8, every piece you get in counts. (Balance tests in RULES.md.)
export const HP = { master: 45, boarded: 10, piece: 8, patch: 12 };
export const MAX_PATCHES = 3;
// Keeping them out pays well: each raider turned away at the wall, and more for a wave where not
// one got in (the user wanted more of a reward for blocking them off).
export const PAY = { master: 10, boarded: 2, bonk: 3, steal: 10, turned: 5, clean: 10 };
/* The cannon: a few shots a wave (one in wave 2, two in wave 3, three after), each aimed for
   CANNON_AIM seconds first with the spot shown red on the wall, and a fresh breach is choked with
   RUBBLE seconds of hacking before anyone can climb through. (It used to fire every 9-20 seconds,
   straight through, and a raider was in two seconds later: nothing you did kept them out.) */
export const CANNON_AIM = 8, CANNON_GAP = 22, RUBBLE = 10;
/* Raiders walk in, they don't jump in: only a gap two squares wide and three tall, down at the floor,
   lets them through (DOOR_W by DOOR_H). Any smaller or higher empty hole is a weak spot: WEAK seconds
   of hacking at the stone round it and it gives way into a bigger hole they can walk through (still
   whole pieces' worth of squares, so it can be mended). The user: hopping through a five-square gap
   high up the wall was "weird and dumb". */
export const DOOR_W = 2, DOOR_H = 3, WEAK = 8;
/* The calm between waves is long enough to catch up: by wave 8 the user was overwhelmed, with nine
   raiders and the big three-piece holes still open. They wanted the raids kept big and heavy ("I
   like the bigger, heavy raids, and especially the cannon and the chaos") and the holes roomy ("You
   need that for the feel of the puzzle"), so the breather between them got longer instead (it was
   20 seconds). */
export const BUILD_SECS = 75, CALM_SECS = 40, WALL_DONE_SECS = 3;
export const RAIDER_DPS = 1, RAIDER_STAMINA = 16;
/* Getting through costs them: a raider who spent their strength hacking a way in arrives winded.
   They stop just inside to catch their breath (up to WINDED seconds, the more tired the longer) and
   then go for the chest slower (up to TIRED_SLOW slower). The user wanted hacking through to weaken
   the wave, and a window to deal with them when they do get in. */
export const WINDED = 6, TIRED_SLOW = 0.4;
/* A wall giving way hits the ones hacking at it. When the last of a hole's wood or stone goes, the
   raiders at it reel back dazed for DAZE seconds, and stone that gives way chokes the new gap with
   FALLEN seconds of rubble to clear. The user: three raiders burst a hole together and walked straight
   in, barely tired, "there doesn't seem to be any win for it". */
export const DAZE = 3, FALLEN = 5;
/* How fast raiders chop through wood, the main thing to balance. They start slow and build up wave
   by wave (start: the first wave's fraction of full speed; step: how much more each wave). To try
   other speeds without editing: den.html?hack=0.8 (a multiplier on all of it), or in the console
   den.tune.hack / den.tune.start / den.tune.step. */
export const tune = { hack: Number(new URLSearchParams(location.search).get('hack')) || 1, start: 0.55, step: 0.15 };
export const hackRate = () => RAIDER_DPS * tune.hack * Math.min(1, tune.start + tune.step * Math.max(0, G.wave - 1));
export const k = (r, c) => r + ',' + c;
export const rand = (n) => Math.floor(Math.random() * n);
export const $ = (id) => document.getElementById(id);
// Kept in this browser: how your pirate looks, and how your den's dressed.
const saved = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
export const keep = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };
export let myLook = cleanLook(saved('carp.den.look'));
export let denLook = cleanDen(saved('carp.den.den'));

// ---------- renderer, scene, lights ----------
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// (Not asking the driver for each new shader's error log: that alone stalled a frame a tenth of a
// second the first time anything new was drawn, even with its shader built ahead by warm(). The den
// has no shaders of its own, only three.js's.)
renderer.debug.checkShaderErrors = false;
document.body.prepend(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a110b');
scene.fog = new THREE.Fog('#1a110b', 24, 52);   // (far enough to make out the raiders' ship in the cove)
export const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
/* The haze by each thing's true distance from the camera, not its depth along the view (three.js's
   own), so a patch of sea keeps its shade as the view turns and tilts over it (the user, 12 Nov, at
   sea: "the fog of war kind of shading seems to jump about ... like you can't decide where it's going
   to shade"). The distance is taken per pixel, from the position passed along, not per corner: a
   corner's distance doesn't blend across a big plane such as the sea, whose corners are far off.
   Before any shader's built: every material's fog goes through these chunks. */
{
  const C = THREE.ShaderChunk, swap = (k, a, b) => { if (!C[k].includes(a)) throw new Error(`fog chunk ${k} changed`); C[k] = C[k].replace(a, b); };
  swap('fog_pars_vertex', 'varying float vFogDepth;', 'varying vec3 vFogAt;');
  swap('fog_vertex', 'vFogDepth = - mvPosition.z;', 'vFogAt = mvPosition.xyz;');
  swap('fog_pars_fragment', 'varying float vFogDepth;', 'varying vec3 vFogAt;');
  swap('fog_fragment', '#ifdef USE_FOG', '#ifdef USE_FOG\n\tfloat vFogDepth = length( vFogAt );');
}
/** The haze set for a view `d` from what it's looking at: clear to d + 10, gone into the horizon's
    colour by d + 45, and always whole before the camera's far plane, so nothing's cut off at an edge
    showing through. The den's camera passes the distance it's settling to, eased (js/den.js), never
    the camera's lagging distance as it swings round, which dipped the haze in and out as you turned. */
export function hazeAt(d) {
  const far = Math.min(d + 45, camera.far - 2);
  scene.fog.far = far;
  scene.fog.near = Math.min(d + 10, far - 20);
}

export const hemi = new THREE.HemisphereLight('#ffe6c4', '#3a2616', 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffd9a8', 1.6);
sun.position.set(-5, 12, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 45 });
scene.add(sun);
/* Where the sun's shadows fall: on the den (by default), or over somewhere else in the world, at
   (x, y, z) (Mischievious's island: js/den/wedding.js). Same light, same angle, just moved along. */
export function sunOver(x = 0, y = 0, z = 0) {
  sun.position.set(x - 5, y + 12, z + 9);
  sun.target.position.set(x, y, z);
  sun.target.updateMatrixWorld();
}
// Moonlight from outside, so the outer face of the wall shows when you turn the view round.
const moon = new THREE.DirectionalLight('#a9bce0', 1.1);
moon.position.set(4, 10, -14);
scene.add(moon);
/* The night sky over the sea: dark overhead, lighter down to the horizon, with the moon and
   stars. It was a flat near-black, and the sea faded into it (the user, 9 Nov: "I don't feel like
   there's any background to look at. I don't know why it's so black. Rather like there's supposed
   to be a sea over there"). The fog takes the horizon's colour, so the far sea fades into the
   sky's glow. The dome follows the camera. */
export const skyDome = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
skyDome.renderOrder = -2;
scene.add(skyDome);
{
  const dir = moon.position.clone().normalize();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: '#f6f1dc', fog: false, depthWrite: false }));
  const glow = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshBasicMaterial({ color: '#c9d6f0', transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
  for (const [m, d] of [[glow, 86], [disc, 85]]) { m.position.copy(dir).multiplyScalar(d); m.lookAt(0, 0, 0); m.renderOrder = -1; skyDome.add(m); }
  const pts = [];
  for (let i = 0; i < 420; i++) {
    const y = 0.12 + Math.random() * 0.88, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    pts.push(Math.cos(a) * r * 84, y * 84, Math.sin(a) * r * 84);
  }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.PointsMaterial({ color: '#e8ecff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8, depthWrite: false }));
  stars.renderOrder = -1;
  skyDome.add(stars);
}
export function paintSky(zenith, horizon) {
  const geo = skyDome.geometry, pos = geo.attributes.position, top = new THREE.Color(zenith), low = new THREE.Color(horizon), c = new THREE.Color();
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 90;
    if (t >= 0) c.copy(low).lerp(top, Math.pow(t, 0.45));
    else c.copy(low);   // below the horizon, the far sea in the haze: the fog's own colour, so the sea fades into it (it was darker, a dark band beyond the water in a wide shot)
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  scene.background.set(horizon);
  scene.fog.color.set(horizon);
}

// Keep the view wide enough to see a good stretch of wall, whatever shape the window is.
function fitCamera() {
  camera.aspect = innerWidth / innerHeight;
  const hfov = 64 * Math.PI / 180;
  camera.fov = Math.min(80, Math.max(45, 2 * Math.atan(Math.tan(hfov / 2) / camera.aspect) * 180 / Math.PI));
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', fitCamera);
fitCamera();

// ---------- materials and little helpers ----------
export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
export function mesh(geo, m, shadow = true) {
  const x = new THREE.Mesh(geo, m);
  x.castShadow = shadow; x.receiveShadow = true;
  return x;
}
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const stripes = (a, b) => canvasTex(4, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * 8, 4, 8); } });
export const woodTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2dcb8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(110, 66, 30, ${0.12 + Math.random() * 0.22})`;
    g.lineWidth = 1 + Math.random() * 2.5;
    const y = Math.random() * h;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20 + i) * 2.5);
    g.stroke();
  }
});
export const groundTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7a5c3d'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,26,14' : '170,135,95'}, ${Math.random() * 0.25})`;
    const s = 2 + Math.random() * 6;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
});
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(6, 6);

// Each letter gets its own shade of timber, so the piles are easy to tell apart.
export const WOOD = { P: '#c98a45', F: '#b8743c', Y: '#d39a52', T: '#a8683a', N: '#c07a3f', L: '#d8a560', W: '#9c6036', U: '#b98048', V: '#cf9050', Z: '#a5703f', X: '#be8448', I: '#dcae6c' };
const woodMats = {};
export const woodMat = (l) => (woodMats[l] ||= mat(WOOD[l], { map: woodTex, roughness: 0.7 }));
export const cellBox = new THREE.BoxGeometry(S, S, WOOD_D);

/* A piece (or ghost) drawn in "cell space": the top-left corner of cell [0,0] at the origin,
   rows going down, the front face at z = 0. */
export function pieceGroup(cells, m, edge = '#4a2a12') {
  const g = new THREE.Group();
  for (const [r, c] of cells) {
    const b = mesh(cellBox, m);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, -WOOD_D / 2);
    g.add(b);
  }
  g.add(outline(cells, 0.002, edge));
  return g;
}
export function outline(cells, z, color) {
  const set = new Set(cells.map(([r, c]) => k(r, c)));
  const p = [];
  for (const [r, c] of cells) {
    const x0 = c * S, x1 = (c + 1) * S, y0 = -r * S, y1 = -(r + 1) * S;
    if (!set.has(k(r - 1, c))) p.push(x0, y0, z, x1, y0, z);
    if (!set.has(k(r + 1, c))) p.push(x0, y1, z, x1, y1, z);
    if (!set.has(k(r, c - 1))) p.push(x0, y0, z, x0, y1, z);
    if (!set.has(k(r, c + 1))) p.push(x1, y0, z, x1, y1, z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color }));
}
/* A frame's room (CarpentryFrame.room, src/carpentry-frame.ts), chalked round it where it's limited:
   the squares a piece may stick out over faintly tinted, and a dashed chalk line round the edge of
   all a piece may cover, so you can see what room you have to rearrange in (the user, 10 Nov, on the
   stairs: "it should certainly be clearer what the boundary of the stairs are"). In cell space, at
   depth z (the tint at tz); brighter while you've a piece in hand (roomGlow). */
const ROOM_SHAPES = Object.values(C.ORIENTS_BY_LETTER).flat().map((o) => o.cells);
const roomLine = new THREE.LineDashedMaterial({ color: '#efe6cf', dashSize: S * 0.2, gapSize: S * 0.13, transparent: true, opacity: 0.4, depthWrite: false });
const roomTint = new THREE.MeshBasicMaterial({ color: '#efe6cf', transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
const roomSq = new THREE.PlaneGeometry(S, S);
export function roomMarks(carp, z, tz = z) {
  const g = new THREE.Group();
  if (!carp.bounded()) return g;
  const room = carp.room(ROOM_SHAPES);
  for (const [r, c] of room) {
    if (carp.isHole(r, c)) continue;
    const m = new THREE.Mesh(roomSq, roomTint);
    m.position.set((c + 0.5) * S, -(r + 0.5) * S, tz);
    m.renderOrder = 1;
    g.add(m);
  }
  // The line goes round the frame and what's in it too, so it's the outer edge of the room.
  const edge = room.concat(carp.cells, carp.laid.flatMap((p) => p.cells));
  const line = outline(edge, z, '#efe6cf');
  line.material.dispose();
  line.material = roomLine;
  line.computeLineDistances();
  line.renderOrder = 1;
  g.add(line);
  return g;
}
// Swap a frame's chalked room for a fresh one (its pieces moved): `old`'s geometry freed.
export function redrawRoom(parent, old, carp, z, tz) {
  if (old) { old.removeFromParent(); old.traverse((o) => { if (o.isLineSegments) o.geometry.dispose(); }); }
  const g = roomMarks(carp, z, tz);
  parent.add(g);
  return g;
}
// Brighter with a piece in hand, eased.
export function roomGlow(holding, dt) {
  const e = 1 - Math.exp(-dt * 8);
  roomLine.opacity += ((holding ? 0.85 : 0.4) - roomLine.opacity) * e;
  roomTint.opacity += ((holding ? 0.14 : 0.06) - roomTint.opacity) * e;
}
// The same piece, centred on its own origin (for carrying and for the piles), with a bold dark edge
// on both faces, so its shape reads from above on a crate and from behind when held overhead (the
// user, 8 Nov: "you can't see the pieces on the crates or above your head ... so much anymore").
export const PILE_SC = 0.45;   // a piece's size on its crate
export function centred(cells, m) {
  const b = C.bbox(cells);
  const inner = pieceGroup(cells, m);
  inner.add(fatOutline(cells, 0.004, '#2e1808', 0.05), fatOutline(cells, -WOOD_D - 0.004, '#2e1808', 0.05));
  inner.position.set(-b.w * S / 2, b.h * S / 2, WOOD_D / 2);
  const g = new THREE.Group();
  g.add(inner);
  return g;
}
export const rotCW = (cells) => C.normalize(cells.map(([r, c]) => [c, -r]));
export const rotCCW = (cells) => C.normalize(cells.map(([r, c]) => [-c, r]));
export const flip = (cells) => C.normalize(cells.map(([r, c]) => [r, -c]));

// Seen through the wall: raiders behind stone show as a red silhouette, so you always know where they are.
/* Only what's really in the way counts, never the figure's own arms and legs (the user, 9 Nov: "the
   character shouldn't have a yellow silhouette if you can actually see him"). So the silhouette
   is drawn with the solid things, after the den but before the figure itself: it's tested against
   the wall and the towers alone, and the figure then paints over it wherever it's in plain view.
   (Custom blending keeps it see-through while it's drawn in that first, solid pass.) */
export const xrMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: false, opacity, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthFunc: THREE.GreaterDepth, depthWrite: false });
const xrayMat = xrMat('#ff3b2a', 0.6);
export function addXray(group, m = xrayMat) {
  const list = [];
  group.traverse((o) => { if (o.isMesh) list.push(o); });
  const xr = [];
  for (const o of list) { if (!o.renderOrder) o.renderOrder = 6; const s = new THREE.Mesh(o.geometry, m); s.renderOrder = 5; o.add(s); xr.push(s); }
  return xr;
}

// ---------- pirates: ours, and the raiders ----------
/* Ours and our crewmates' wear what they chose (den-look.js). Raiders and the gunner are still
   described the old way, in a few colours. */
export function makePirate(o = {}) {
  if (o.look) return dressPirate(o.look, o);
  const { shirt = ['#f4efe4', '#b8322a'], scarf = '#c0392b', trousers = '#34395a', beard = '#5a3418', patch = true, sword = false } = o;
  return dressPirate({ body: 'm', top: 'striped', topCol: shirt[1], topCol2: shirt[0], hat: 'bandana', hatCol: scarf, legs: 'pants', legsCol: trousers, feetCol: '#2a1b12', hair: 'short', hairCol: beard, beard: 'full', patch, earring: true, fam: 'none' }, { sword });
}
// Change what a pirate already in the den is wearing, keeping where they are.
export function wearLook(p, look) {
  const np = dressPirate(look), old = p.g;
  np.g.position.copy(old.position); np.g.rotation.copy(old.rotation); np.g.scale.copy(old.scale);
  old.parent?.add(np.g);
  old.parent?.remove(old);
  Object.assign(p, { g: np.g, legs: np.legs, arms: np.arms, body: np.body, fam: np.fam, look: np.look, held: np.held });
}
/* A pirate's legs, walking (or running) as far as they've gone since the last call, easing to rest
   once they stop (the rule: src/walk.ts). Where they are is their x, z if they keep one, else their
   figure's. `moving`: whether whoever moves them calls it walking (false: stood, or carried along);
   `pace`, a cadence for walking with no way measured (on the spot, or moved with what they're on).
   Returns the stride's swing (-1..1). */
export function animateWalk(p, moving, dt, pace = WALK_CADENCE) {
  const g = (p.gait ||= newGait());
  const at = typeof p.x === 'number' && typeof p.z === 'number' ? p : p.g.position;
  gaitStep(g, at.x, at.z, !!moving, dt, pace);
  familiarTick(p.fam, dt);
  const { leg, arm, bob, swing } = gaitPose(g);
  p.legs[0].rotation.x = leg;
  p.legs[1].rotation.x = -leg;
  p.arms[0].rotation.x = -arm;
  p.arms[1].rotation.x = arm;
  p.g.position.y = bob;
  return swing;
}
export function faceTo(p, dx, dz, dt) {
  let d = Math.atan2(dx, dz) - p.g.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  p.g.rotation.y += d * Math.min(1, dt * 12);
}
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const basis = (x, y) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y)));

// ---------- Jolly Roger flags ----------
// One flag for the whole den, drawn from your choices; every pole flies it.
const flagCanvas = document.createElement('canvas');
flagCanvas.width = 200; flagCanvas.height = 128;
const flagTex = new THREE.CanvasTexture(flagCanvas);
flagTex.colorSpace = THREE.SRGBColorSpace;
export function redrawFlag() { drawFlag(flagCanvas.getContext('2d'), 200, 128, denLook); flagTex.needsUpdate = true; }
redrawFlag();
export const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.9 });
// A flag or banner you've put up keeps the design it had then.
const designMats = new Map();
export function designMat(D, tall = false) {
  const key = JSON.stringify(D) + tall;
  if (!designMats.has(key)) designMats.set(key, new THREE.MeshStandardMaterial({ map: canvasTex(tall ? 128 : 200, tall ? 200 : 128, (x, w, h) => drawFlag(x, w, h, D)), side: THREE.DoubleSide, roughness: 0.9 }));
  return designMats.get(key);
}
export let flags = [];
export function flagpole(h = 2, m = flagMat) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 8), mat('#5b3a20', { map: woodTex }));
  pole.position.y = h / 2;
  const ball = mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
  ball.position.y = h + 0.05;
  const geo = new THREE.PlaneGeometry(1, 0.64, 14, 2).translate(0.5, 0, 0);
  const cloth = mesh(geo, m);
  cloth.position.y = h - 0.34;
  g.add(pole, ball, cloth);
  flags.push({ g, geo, base: geo.attributes.position.array.slice(), t: Math.random() * 6 });
  return g;
}

// ---------- game state ----------
export const pirate = Object.assign(makePirate({ look: myLook }), { x: 0, z: 8, bonkT: 0, h: 0, hs: 0, hop: null });
export const STEP = 0.62, HOP = 1.2;   // metres: walked up / hopped up (a stair square is about 0.53)
export const view = { yaw: 0, pitch: 0, zoom: 1 };   // the player's own turn, tilt and zoom of the camera
// Pixels along the screen's right-hand edge a panel keeps for itself (the race plan's strip: race-plan.js), which
// the boards put up at sea lay themselves out clear of (the user, 13 Nov: "your plan is covering the right hand row board").
export const edges = { right: 0 };
pirate.g.rotation.y = Math.PI;
scene.add(pirate.g);
export let carry = null;   // { letter, cells, from, group, mat }
export let bounds = { x: 6, z0: 0.55, z1: 10.5 };
export let obstacles = [];
export const G = {};
export const keys = new Set();
export const tweens = [];
export const sparks = [];
export const raiders = [];
export let ghost = null, ghostKey = '', target = null, cycle = 0, shake = 0;
export let mouse = null, mouseMode = false, topView = false;
/* Where the pointer was when you last moved the piece by key in the Carpentry view: the mouse only
   takes over again once it's really moved from there. (The user, 9 Nov: the keys felt
   "inconsistent", the piece seeming blocked; a hand resting on the mouse nudged it, and the piece
   snapped back to the pointer.) */
export let keyAt = null;
/* Puzzle mode at the wall: walk up to it with a piece and the camera pulls back to show the whole
   wall, every hole at once, as near the real puzzle's board as the den gets. WASD moves the piece a
   square at a time, always the way the key points on screen, and the arrows jump it hole to hole;
   the pirate walks along under it by themself. Space or a click fits it, and that's you back to
   walking, as is Esc (the view stays a moment, so taking the next piece with 1 2 3 carries on).
   The user: running the pirate from hole to hole was too much effort, left/right went different
   ways depending on the camera, and in this mode WASD should be "pure" piece moving. */
export let wm = null, wmBlock = null, wallView = 0, wmLinger = 0;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const worldLets = {
  get bounds() { return bounds; }, set bounds(v) { bounds = v; },
  get obstacles() { return obstacles; }, set obstacles(v) { obstacles = v; },
  get carry() { return carry; }, set carry(v) { carry = v; },
  get flags() { return flags; }, set flags(v) { flags = v; },
  get shake() { return shake; }, set shake(v) { shake = v; },
  get ghostKey() { return ghostKey; }, set ghostKey(v) { ghostKey = v; },
  get ghost() { return ghost; }, set ghost(v) { ghost = v; },
  get mouseMode() { return mouseMode; }, set mouseMode(v) { mouseMode = v; },
  get keyAt() { return keyAt; }, set keyAt(v) { keyAt = v; },
  get mouse() { return mouse; }, set mouse(v) { mouse = v; },
  get cycle() { return cycle; }, set cycle(v) { cycle = v; },
  get wm() { return wm; }, set wm(v) { wm = v; },
  get wmLinger() { return wmLinger; }, set wmLinger(v) { wmLinger = v; },
  get wmBlock() { return wmBlock; }, set wmBlock(v) { wmBlock = v; },
  get target() { return target; }, set target(v) { target = v; },
  get denLook() { return denLook; }, set denLook(v) { denLook = v; },
  get myLook() { return myLook; }, set myLook(v) { myLook = v; },
  get topView() { return topView; }, set topView(v) { topView = v; },
  get wallView() { return wallView; }, set wallView(v) { wallView = v; },
};
export const ray = new THREE.Raycaster(), wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const sparkGeo = new THREE.TetrahedronGeometry(0.07);
const sparkMats = {};
export function burst(at, color, n, speed) {
  const m = (sparkMats[color] ||= new THREE.MeshBasicMaterial({ color }));
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(sparkGeo, m);
    s.position.copy(at);
    s.userData.v = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.2) * speed);
    s.userData.life = 0.9 + Math.random() * 0.4;
    scene.add(s);
    sparks.push(s);
  }
}
/* Shaders built ahead, in the background, so nothing drawn for the first time stalls the game while
   its shader's built (the user, 10 Nov: "it goes a bit laggy" running the checkpoint's gauntlet: its
   first shot, the splash and the hit each froze it a tenth of a second or more). `objs`: things made
   but not yet in the scene (a shot, a splash); with none, the whole scene, hidden parts and all (a
   gun's wreck), and the sparks and chalk lines every effect and board uses. */
const probes = [new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial()), outline([[0, 0]], 0, '#ffffff'), outline([[0, 0]], 0, '#ffffff')];
probes[2].material.transparent = true;
export function warm(...objs) {
  if (!renderer.compileAsync) return;
  for (const o of objs.length ? objs : [scene, ...probes]) renderer.compileAsync(o, camera, scene).catch(() => {});
}
let toastTimer;
// A toast stays up long enough to read (longer for longer words: 10 Nov, the checkpoint's message
// "vanished very quickly"), and one that comes while another's still being read waits its turn
// rather than wiping it; only the latest waiting toast is kept, so they never pile up behind.
let toastShown = 0, toastRead = 0, toastWaiting = null, toastWait;
const readMs = (text) => Math.min(4500, Math.max(1200, text.length * 45));
/* Somewhere else for a while (Mischievious's island: js/den/wedding.js), the den's own news is kept
   quiet: only a toast that's `loud` (that place's own) shows. */
export const toastQuiet = { on: false };
export function toast(text, bad = false, warn = false, loud = false) {
  if (toastQuiet.on && !loud) return;
  const now = performance.now();
  const left = toastShown + toastRead - now;
  if (!bad && $('toast').classList.contains('on') && left > 0) {   // bad news (a hit) never waits
    toastWaiting = [text, bad, warn];
    clearTimeout(toastWait);
    toastWait = setTimeout(() => { const w = toastWaiting; toastWaiting = null; if (w) showToast(...w); }, left);
    return;
  }
  showToast(text, bad, warn);
}
/** The den's toast gone at once, and any waiting behind it (off to her island: its news isn't hers). */
export function toastHush() {
  clearTimeout(toastWait); clearTimeout(toastTimer); toastWaiting = null;
  $('toast').classList.remove('on');
}
function showToast(text, bad, warn) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast on' + (bad ? ' bad' : '');
  t.style.color = warn ? '#ffc46b' : '';
  toastShown = performance.now();
  toastRead = readMs(text);
  if (toastWaiting) {   // something still waiting (a hit cut in): it comes once this one's read
    clearTimeout(toastWait);
    toastWait = setTimeout(() => { const w = toastWaiting; toastWaiting = null; if (w) showToast(...w); }, toastRead);
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), Math.min(7000, Math.max(1800, text.length * 70)));
}
export const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
export function tween(dur, step, done) { tweens.push({ t: 0, dur, step, done }); }
// An outline drawn with thin bars rather than a line, so it reads at any distance.
const fatMats = {};
export function fatOutline(cells, z, color, t = 0.045) {
  const set = new Set(cells.map(([r, c]) => k(r, c))), g = new THREE.Group();
  const m = (fatMats[color] ||= new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  const bar = (x0, y0, x1, y1) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) + t, Math.abs(y1 - y0) + t, t), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
    g.add(b);
  };
  for (const [r, c] of cells) {
    const x0 = c * S, x1 = (c + 1) * S, y0 = -r * S, y1 = -(r + 1) * S;
    if (!set.has(k(r - 1, c))) bar(x0, y0, x1, y0);
    if (!set.has(k(r + 1, c))) bar(x0, y1, x1, y1);
    if (!set.has(k(r, c - 1))) bar(x0, y0, x0, y1);
    if (!set.has(k(r, c + 1))) bar(x1, y0, x1, y1);
  }
  return g;
}
export const v3 = new THREE.Vector3(), L0 = new THREE.Vector3(), L1 = new THREE.Vector3(), L2 = new THREE.Vector3();
