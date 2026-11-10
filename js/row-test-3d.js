/* Mirror strokes' 3D view, for row-test.html only (TODO.md, "Mirror strokes, closer to the real
   thing", 10 Nov: "the actual 3D thing"). Hand-written, like js/den/*: the rules are in
   src/mirror-row.ts, and this only draws what they say.

   The den's sloop and its sea, built again here in the same style rather than imported:
   js/den/sea.js builds them out of the den's own parts (world.js's scene and state, land.js,
   gundeck.js, raids.js), and importing it would start the whole den. So this is a small copy:
   sloopMesh (her hull, deck, stripe, stern, tiller, bowsprit, mast, flag), her sails brailed up
   to their yards as they are at the oars, the two long sweeps a side from js/den/wind.js, a rower
   on each gunwale as js/den/rowing.js seats them, and the den's sea (land.js's seaTex) under the
   seaside den's sky.

   What it shows, as she's rowed:
   - Between squares she creeps ahead as forward pull builds, swings her bows toward the turn
     that's building and heels into it (src/den-row.ts's LEAN, the den's numbers); when a square's
     handed out she makes Battle Navigation's move from where she'd crept to: forward a square, or
     forward and round a quarter turn into the next.
   - The sweeps stroke on the side that pulled, as hard as it pulled (CREW, as the den's rowers);
     a big clear on a side and its rower goes like crazy. A double Vegas hands out five squares at
     once: she zooms through them, both rowers thrashing, spray flying, the view shaking.
   - The course: up the sea from where she started, a buoyed channel (a red buoy to port and a
     green one to starboard every few squares; through one and it lights gold), rocks lining it
     further out, and her course dotted on the water behind her. */
import * as THREE from 'three';

/** A square on the sea, in metres (the den's SAIL.CELL: she's about one long). */
const CELL = 4;
/** Her deck's height (sea.js's SLOOP_DECK). */
const DECK = 0.75;
/** src/den-row.ts's LEAN and CREW, the den's own numbers. */
const LEAN = { CREEP: 0.3, YAW: 0.35, HEEL: 0.1 };
const CREW = { STEADY: 0.9, PER: 0.3, FADE: 1.6, CRAZY: 4, FLYING: 4 };
/** The channel: a pair of buoys every GATE squares up the course, HALF squares either side of it. */
const GATE = 4, HALF = 1.5;
const DX = [0, 1, 0, -1], DY = [1, 0, -1, 0];

// ---------- little helpers, as js/den/world.js has them ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, m, shadow = true) { const x = new THREE.Mesh(geo, m); x.castShadow = shadow; x.receiveShadow = true; return x; }
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const woodTex = canvasTex(128, 128, (g, w, h) => {
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
/** A seeded source of numbers, so the rocks lie the same for a seed. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- the sloop (js/den/sea.js's sloopMesh, and raids.js's hullGeo) ----------
function hullGeo(len, beam, deep, bow = 0.22) {
  const sh = new THREE.Shape(), l = len / 2, b = beam / 2;
  sh.moveTo(-l, -b * 0.85); sh.lineTo(l - len * bow, -b);
  sh.quadraticCurveTo(l, -b * 0.6, l + len * 0.04, 0);
  sh.quadraticCurveTo(l, b * 0.6, l - len * bow, b);
  sh.lineTo(-l, b * 0.85); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: deep, bevelEnabled: false }).rotateX(-Math.PI / 2);
}
// The den flies your own Jolly Roger; here a plain one, a skull on black.
const flagMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(200, 128, (g, w, h) => {
  g.fillStyle = '#16120f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#efe6d2';
  g.beginPath(); g.arc(w / 2, 54, 26, 0, Math.PI * 2); g.fill();
  g.fillRect(w / 2 - 16, 68, 32, 18);
  g.fillStyle = '#16120f';
  for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * 10, 52, 7, 0, Math.PI * 2); g.fill(); }
  g.fillRect(w / 2 - 2, 62, 4, 8);
  g.strokeStyle = '#efe6d2'; g.lineWidth = 9; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 - 44, 96 + s * 14); g.lineTo(w / 2 + 44, 96 - s * 14); g.stroke(); }
}) });
function flagpole(h, m) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 8), mat('#5b3a20', { map: woodTex }));
  pole.position.y = h / 2;
  const ball = mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
  ball.position.y = h + 0.05;
  const geo = new THREE.PlaneGeometry(1, 0.64, 14, 2).translate(0.5, 0, 0);
  const cloth = mesh(geo, m);
  cloth.position.y = h - 0.34;
  g.add(pole, ball, cloth);
  g.userData.cloth = { geo, base: geo.attributes.position.array.slice() };
  return g;
}
function sloopMesh() {
  const g = new THREE.Group(), hullM = mat('#5e4128', { map: woodTex }), deckM = mat('#9a7a55', { map: woodTex }), spar = mat('#4a2f1a', { map: woodTex });
  const hull = mesh(hullGeo(4.4, 1.7, 1.3), hullM);
  hull.position.y = DECK - 1.3;
  const deck = mesh(hullGeo(4.25, 1.55, 0.05), deckM);
  deck.position.y = DECK - 0.02;
  const stripe = mesh(hullGeo(4.46, 1.74, 0.1), mat('#d8c9a0'));
  stripe.position.y = DECK - 0.32;
  g.add(hull, deck, stripe);
  const stern = mesh(new THREE.BoxGeometry(0.9, 0.35, 1.45), hullM);
  stern.position.set(-1.65, DECK + 0.17, 0);
  const tiller = mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), spar);
  tiller.position.set(-1.6, DECK + 0.5, 0);
  const sprit = mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.4, 6), spar);
  sprit.rotation.z = -Math.PI / 2 + 0.25; sprit.position.set(2.6, DECK + 0.2, 0);
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), spar);
  mast.position.set(0.35, DECK + 2.1, 0);
  g.add(stern, tiller, sprit, mast);
  // Her square sail and topsail, brailed up to their yards while she rows (as wind.js has them).
  const sailM = mat('#e9dfc8', { roughness: 0.95 });
  for (const [y, w, ht] of [[1.45, 2, 1.6], [3.1, 1.4, 0.9]]) {
    const arm = new THREE.Group();
    const yard = mesh(new THREE.CylinderGeometry(0.035, 0.035, w + 0.25, 6), spar, false);
    yard.rotation.z = Math.PI / 2;
    const furl = mesh(new THREE.CylinderGeometry(0.09, 0.09, w, 8), sailM, false);
    furl.rotation.z = Math.PI / 2; furl.position.y = -0.1;
    arm.add(yard, furl);
    arm.position.set(0.35, DECK + y + ht / 2, 0);
    arm.rotation.y = Math.PI / 2 - 0.45;
    g.add(arm);
  }
  const fl = flagpole(0.6, flagMat);
  fl.position.set(0.35, DECK + 4.15, 0);
  fl.rotation.y = Math.PI;   // (streaming aft as she goes)
  g.add(fl);
  g.userData.flag = fl;
  g.rotation.order = 'YXZ';   // (turned to her heading, then heeled over about her own length)
  return g;
}
// Two long sweeps a side, run out from her gunwales (port's her left, -z), as js/den/wind.js has them.
function sweepsMake(g) {
  const wood = mat('#7a5634', { map: woodTex }), oars = [];
  for (const s of [1, -1]) for (const x of [1.2, -1.1]) {
    const lock = new THREE.Group();
    lock.position.set(x, DECK + 0.12, s * 0.8);
    lock.rotation.y = s > 0 ? 0 : Math.PI;
    const arm = new THREE.Group();
    arm.rotation.order = 'YXZ';
    const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.75, 6).rotateX(Math.PI / 2), wood, false);
    shaft.position.z = 1.2;
    const blade = mesh(new THREE.BoxGeometry(0.26, 0.03, 0.62), wood, false);
    blade.position.z = 2.3;
    arm.add(shaft, blade);
    lock.add(arm);
    g.add(lock);
    oars.push({ lock, arm, blade, side: s > 0 ? 'starboard' : 'port' });
  }
  return oars;
}
// A rower on each gunwale amidships, facing aft (js/den/rowing.js's, in their side's colours): a
// plainer pirate than the den's, striped shirt, bandana and beard.
const CREW_LOOK = { port: { shirt: '#b8322a', scarf: '#7a1e1e', trousers: '#3a2b22', beard: '#2a1a10' }, starboard: { shirt: '#2a8a4a', scarf: '#1f5a32', trousers: '#34395a', beard: '#8a5a2a' } };
function rowerMake(side) {
  const L = CREW_LOOK[side], g = new THREE.Group(), skin = mat('#d9a47a');
  const shirtTex = canvasTex(8, 32, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? L.shirt : '#f4efe4'; c.fillRect(0, i * 4, 8, 4); } });
  const body = mesh(new THREE.BoxGeometry(0.5, 0.62, 0.32), mat('#ffffff', { map: shirtTex }));
  body.position.y = 0.62;
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), skin);
  head.position.y = 1.12;
  const scarf = mesh(new THREE.SphereGeometry(0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(L.scarf));
  scarf.position.y = 1.15;
  const beard = mesh(new THREE.BoxGeometry(0.26, 0.16, 0.12), mat(L.beard));
  beard.position.set(0, 1.0, 0.15);
  g.add(body, head, scarf, beard);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.32, 0);
    const leg = mesh(new THREE.BoxGeometry(0.17, 0.55, 0.18), mat(L.trousers)); leg.position.y = -0.27;
    hip.add(leg); hip.rotation.x = -1.45; g.add(hip); legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(s * 0.32, 0.88, 0);
    const arm = mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), mat(L.shirt)); arm.position.y = -0.24;
    const hand = mesh(new THREE.SphereGeometry(0.07, 8, 6), skin); hand.position.y = -0.5;
    sh.add(arm, hand); g.add(sh); arms.push(sh);
  }
  g.scale.setScalar(0.42);
  const seat = new THREE.Group();
  seat.position.set(0.15, DECK - 0.08, (side === 'port' ? -1 : 1) * 0.55);
  seat.rotation.y = -Math.PI / 2;   // (facing aft, her stern)
  seat.add(g);
  return { side, g, arms, seat };
}

// ---------- the buoys (sea.js's pinMesh, red to port and green to starboard) and rocks ----------
const buoyM = { port: mat('#c8372a', { roughness: 0.6 }), starboard: mat('#2f9a4e', { roughness: 0.6 }), white: mat('#f3ecdc'), staff: mat('#4a2f1a'), gold: mat('#ffd23a', { emissive: '#7a5a00', roughness: 0.4 }) };
function buoyMesh(side) {
  const g = new THREE.Group(), m = buoyM[side];
  const buoy = mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.7, 12), m); buoy.position.y = 0.2;
  const band = mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.16, 12), buoyM.white); band.position.y = 0.25;
  const staff = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), buoyM.staff); staff.position.y = 1.15;
  const pennant = mesh(new THREE.ConeGeometry(0.22, 0.6, 3).rotateZ(-Math.PI / 2), m);
  pennant.scale.set(1, 1, 0.15); pennant.position.set(0.3, 1.6, 0);
  g.add(buoy, band, staff, pennant);
  g.scale.setScalar(1.5);
  g.userData = { buoy, pennant, side };
  return g;
}
const rockMats = ['#9c8566', '#b09878', '#85704f', '#bfa886'].map((c) => mat(c, { flatShading: true }));
function rockMesh(rnd, x, y, z, s) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMats[Math.floor(rnd() * rockMats.length)]);
  r.position.set(x, y, z);
  r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  r.scale.y = 0.7 + rnd() * 0.5;
  return r;
}

// ---------- the view ----------
/** A 3D view of her, in `el` (sized by its CSS). */
export function seaView(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
  // The seaside den's sky (land.js's seaside palette): dark blue overhead, lighter to the horizon.
  const SKY = '#1b3348', HORIZON = '#6f9cb8';
  scene.background = new THREE.Color(HORIZON);
  scene.fog = new THREE.Fog(HORIZON, 45, 140);
  {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    const pos = dome.geometry.attributes.position, top = new THREE.Color(SKY), low = new THREE.Color(HORIZON), c = new THREE.Color(), cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const t = pos.getY(i) / 200; if (t >= 0) c.copy(low).lerp(top, Math.pow(t, 0.45)); else c.copy(low).multiplyScalar(Math.max(0.4, 1 + t * 2)); cols.set([c.r, c.g, c.b], i * 3); }
    dome.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    dome.renderOrder = -2;
    scene.add(dome);
    scene.userData.dome = dome;
  }
  scene.add(new THREE.HemisphereLight('#fff0dc', '#5e5038', 1.0));
  const sun = new THREE.DirectionalLight('#ffd9a8', 1.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight('#a9bce0', 0.6);
  moon.position.set(4, 10, -14);
  scene.add(moon);

  // The sea: land.js's seaTex, held still on the water as the plane follows her about.
  const seaTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2f7896'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,235,245,${0.1 + Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 22, 2); }
  });
  seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
  const SEA = 420, TILE = 14;
  seaTex.repeat.set(SEA / TILE, SEA / TILE);
  const sea = mesh(new THREE.PlaneGeometry(SEA, SEA).rotateX(-Math.PI / 2), mat('#ffffff', { map: seaTex, roughness: 0.45, metalness: 0, emissive: '#1f6c9e', emissiveIntensity: 0.55 }), false);
  sea.receiveShadow = true;
  scene.add(sea);
  // The squares, faint on the water (the den keeps them hidden; here they help read her moves).
  const gridTex = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(230,246,250,0.55)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  const GRID = 160;
  gridTex.repeat.set(GRID / CELL, GRID / CELL);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(GRID, GRID).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.18, depthWrite: false }));
  grid.position.y = 0.04;
  grid.renderOrder = 1;
  scene.add(grid);

  const boat = sloopMesh(), oars = sweepsMake(boat), rowers = ['port', 'starboard'].map(rowerMake);
  for (const r of rowers) boat.add(r.seat);
  scene.add(boat);

  // Her course, dotted on the water (sea.js's dots), and the channel's buoys and the rocks, laid
  // out up ahead as she goes.
  const dotGeo = new THREE.CircleGeometry(0.32, 14).rotateX(-Math.PI / 2);
  const dotMat = new THREE.MeshBasicMaterial({ color: '#f3ecdc', transparent: true, opacity: 0.7, depthWrite: false });
  const course = new THREE.Group(), marks = new THREE.Group();
  scene.add(course, marks);

  // Spray and splashes (world.js's burst).
  const sparkGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09), sparkMats = {}, sparks = [];
  function burst(at, color, n, speed) {
    const m = (sparkMats[color] ||= new THREE.MeshBasicMaterial({ color }));
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(sparkGeo, m);
      s.position.copy(at);
      s.userData.v = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed);
      s.userData.life = 0.7 + Math.random() * 0.4;
      scene.add(s);
      sparks.push(s);
    }
  }

  const S = {
    pose: { x: 0, y: 0, h: 0, turned: 0 },   // where she is, square on (as Course has her)
    queue: [], cur: null,                    // squares to make, and the one she's making
    lead: { f: 0, y: 0, heel: 0 }, want: { f: 0, y: 0, heel: 0 },
    lately: { port: 0, starboard: 0 }, ph: { port: 0, starboard: 0 }, rest: { port: 1, starboard: 1 }, catchT: { port: 0, starboard: 0 },
    camYaw: Math.PI / 2, camAt: new THREE.Vector3(), shake: 0, gates: new Map(), laidTo: 0, rnd: seeded(1), made: 0, flying: 0, t: 0,
  };

  // Where a pose is in the world: the course's x to starboard (+x), its y up the sea (-z).
  const wx = (x) => x * CELL, wz = (y) => -y * CELL;
  const yawOf = (turned) => Math.PI / 2 - turned * Math.PI / 2;

  function layAhead(upTo) {
    while (S.laidTo < upTo) {
      const y = ++S.laidTo;
      if (y % GATE === 0) {
        const pair = ['port', 'starboard'].map((side) => {
          const b = buoyMesh(side);
          b.position.set(wx((side === 'port' ? -1 : 1) * HALF), 0, wz(y));
          b.userData.phase = y * 1.7 + (side === 'port' ? 0 : 1);
          marks.add(b);
          return b;
        });
        S.gates.set(y, { pair, made: false });
      }
      // Rocks either side of the channel, a few squares out, a clump now and then.
      for (const s of [-1, 1]) if (S.rnd() < 0.45) {
        const x = s * (3 + S.rnd() * 6), n = 1 + Math.floor(S.rnd() * 3);
        for (let i = 0; i < n; i++) marks.add(rockMesh(S.rnd, wx(x) + (S.rnd() - 0.5) * 2.2, 0.2 + S.rnd() * 0.4, wz(y) + (S.rnd() - 0.5) * 2.2, 0.9 + S.rnd() * 0.9));
      }
    }
  }

  function dot(x, y) {
    const d = new THREE.Mesh(dotGeo, dotMat);
    d.position.set(wx(x), 0.06, wz(y));
    d.renderOrder = 2;
    course.add(d);
  }

  /** A new game: back to the start, the sea laid afresh. */
  function reset(seed = 1) {
    Object.assign(S, { pose: { x: 0, y: 0, h: 0, turned: 0 }, queue: [], cur: null, lead: { f: 0, y: 0, heel: 0 }, want: { f: 0, y: 0, heel: 0 }, lately: { port: 0, starboard: 0 }, laidTo: -6, rnd: seeded(seed), made: 0, flying: 0 });
    course.clear(); marks.clear(); S.gates.clear();
    layAhead(14);
    dot(0, 0);
    S.camYaw = yawOf(0);
  }

  /** A move rowed: what each side pulled, and the squares it handed out. */
  function row(pull, steps) {
    for (const side of ['port', 'starboard']) S.lately[side] += pull[side] || 0;
    for (const s of steps) S.queue.push(s);
    if (steps.length >= CREW.FLYING) { S.flying = 2.2; S.shake = Math.max(S.shake, 0.35); }
  }

  /** The square building: `ahead` squares' worth of forward pull (0 to 1), `turn` quarter turns'
      worth (more than nothing to starboard). */
  function build(b) {
    const t = Math.max(-1, Math.min(1, b.turn));
    S.want = { f: LEAN.CREEP * Math.max(0, Math.min(1, b.ahead)), y: LEAN.YAW * t, heel: LEAN.HEEL * t };
  }

  // A square's move: forward along her heading, or forward and round a quarter turn into the next
  // (a quarter circle about the corner, as Battle Navigation draws it).
  function startStep(m) {
    const p = S.pose, t = m === 'F' ? 0 : m === 'R' ? 1 : -1;
    const h1 = (p.h + t + 4) % 4;
    const to = { x: p.x + DX[p.h] + (t ? DX[h1] : 0), y: p.y + DY[p.h] + (t ? DY[h1] : 0), h: h1, turned: p.turned + t };
    const fast = S.queue.length >= 2 || S.flying > 0;
    S.cur = { m, from: { ...p }, to, t: 0, secs: m === 'F' ? (fast ? 0.32 : 0.75) : (fast ? 0.45 : 1.0), lead0: { ...S.lead } };
    S.lead = { f: 0, y: 0, heel: 0 };
  }
  function poseAlong(c, u) {
    const e = u * u * (3 - 2 * u), f = c.from, L = c.lead0;
    let x, y, a;
    if (c.m === 'F') { x = f.x + DX[f.h] * e; y = f.y + DY[f.h] * e; a = f.turned; }
    else {
      // About the corner: the centre's a square across from where she starts, the way she turns.
      const cx = f.x + DX[c.to.h], cy = f.y + DY[c.to.h], th = e * Math.PI / 2;
      x = cx - DX[c.to.h] * Math.cos(th) + DX[f.h] * Math.sin(th);
      y = cy - DY[c.to.h] * Math.cos(th) + DY[f.h] * Math.sin(th);
      a = f.turned + (c.to.turned - f.turned) * e;
    }
    // What she'd leaned goes into it, fading as the move goes.
    const k = 1 - e;
    return { x: x + DX[f.h] * L.f * k, y: y + DY[f.h] * L.f * k, a: a + L.y * k, heel: L.heel * k + (c.m === 'F' ? 0 : (c.to.turned - f.turned) * 0.08 * Math.sin(e * Math.PI)) };
  }

  function gateCheck(p) {
    const g = S.gates.get(p.y);
    if (g && !g.made && Math.abs(p.x) <= 1) {
      g.made = true; S.made++;
      for (const b of g.pair) { b.userData.pennant.material = buoyM.gold; b.userData.buoy.material = buoyM.gold; b.userData.pop = 1; burst(b.position.clone().setY(1.5), '#ffd23a', 10, 3); }
    }
  }

  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el);
  resize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.t += dt;
    // Her move, a square at a time.
    if (!S.cur && S.queue.length) startStep(S.queue.shift());
    let shown;
    if (S.cur) {
      const c = S.cur;
      c.t += dt;
      const u = Math.min(1, c.t / c.secs);
      shown = poseAlong(c, u);
      if (u >= 1) { S.pose = c.to; S.cur = null; dot(c.to.x, c.to.y); gateCheck(c.to); layAhead(c.to.y + 14); }
    } else {
      // Between squares she leans into what's building.
      const k = Math.min(1, dt * 5);
      for (const x of ['f', 'y', 'heel']) S.lead[x] += (S.want[x] - S.lead[x]) * k;
      const p = S.pose;
      shown = { x: p.x + DX[p.h] * S.lead.f, y: p.y + DY[p.h] * S.lead.f, a: p.turned + S.lead.y, heel: S.lead.heel };
    }
    const moving = !!S.cur;
    S.flying = Math.max(0, S.flying - dt);
    const bob = Math.sin(S.t * 1.3) * 0.05;
    boat.position.set(wx(shown.x), bob, wz(shown.y));
    boat.rotation.y = yawOf(shown.a);
    boat.rotation.x = shown.heel + Math.sin(S.t * 0.9) * 0.02;
    boat.rotation.z = Math.sin(S.t * 1.1) * 0.015 + (moving ? -0.03 : 0);
    // A wake off her stern while she's under way.
    if (moving && Math.random() < dt * (S.flying > 0 ? 40 : 14)) {
      const stern = new THREE.Vector3(-2.3, 0.1, (Math.random() - 0.5) * 1.2).applyEuler(new THREE.Euler(0, boat.rotation.y, 0)).add(boat.position);
      burst(stern, '#e6f3f6', S.flying > 0 ? 3 : 1, S.flying > 0 ? 2.2 : 1);
    }
    // The sweeps and the rowers: each side as hard as it's pulled lately; going like crazy after a
    // big clear on that side.
    const TAU = Math.PI * 2;
    for (const side of ['port', 'starboard']) {
      S.lately[side] *= Math.exp(-dt / CREW.FADE);
      const l = S.lately[side] + (S.flying > 0 ? 15 : 0);
      const rate = (moving || l > 0.05 ? CREW.STEADY : 0) + CREW.PER * l;
      if (rate > 0.02) S.ph[side] += dt * TAU * rate;
      else S.ph[side] += (Math.round(S.ph[side] / TAU) * TAU - S.ph[side]) * Math.min(1, dt * 3);
      S.rest[side] += ((rate > 0.02 ? 0 : 1) - S.rest[side]) * Math.min(1, dt * 3);
      if (rate > 0.02 && Math.cos(S.ph[side]) < -0.9 && (S.catchT[side] -= dt) < 0) {
        S.catchT[side] = Math.min(0.5, 0.45 / rate);
        boat.updateMatrixWorld(true);
        for (const o of oars) if (o.side === side) burst(o.blade.localToWorld(new THREE.Vector3()).setY(0.15), '#e6f3f6', rate > 3 ? 4 : 2, rate > 3 ? 2.2 : 1.4);
      }
    }
    for (const o of oars) {
      const ph = S.ph[o.side], rest = S.rest[o.side], s = o.side === 'starboard' ? 1 : -1;
      o.arm.rotation.y = 0.42 * Math.sin(ph) * s;
      o.arm.rotation.x = (0.3 - 0.12 * Math.cos(ph)) * (1 - rest) + 0.24 * rest;
    }
    for (const r of rowers) {
      const ph = S.ph[r.side], crazy = S.lately[r.side] >= CREW.CRAZY || S.flying > 0;
      r.g.rotation.x = -0.35 * Math.cos(ph);
      for (const a of r.arms) a.rotation.x = -1.2 - 0.55 * Math.cos(ph);
      r.g.position.y = crazy ? Math.abs(Math.sin(ph)) * 0.12 : 0;
      r.g.rotation.z = crazy ? Math.sin(S.t * 23) * 0.12 : 0;
      if (crazy && Math.random() < dt * 6) { r.seat.updateMatrixWorld(true); burst(r.seat.localToWorld(new THREE.Vector3(0, 0.6, 0)), '#e6f3f6', 2, 1.2); }
    }
    // Her flag rippling.
    { const F = boat.userData.flag.userData.cloth, pos = F.geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = F.base[i * 3]; pos.setZ(i, Math.sin(x * 5 - S.t * 6) * 0.08 * x); } pos.needsUpdate = true; }
    // The buoys ride the swell; one she's been through gives a little hop.
    for (const b of marks.children) if (b.userData.buoy) {
      b.userData.pop = Math.max(0, (b.userData.pop || 0) - dt);
      b.position.y = Math.sin(S.t * 1.6 + b.userData.phase) * 0.12 + Math.sin(b.userData.pop * Math.PI) * 0.6;
      b.rotation.z = Math.sin(S.t * 1.2 + b.userData.phase) * 0.08;
    }
    // Spray.
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.userData.life -= dt;
      s.userData.v.y -= 9 * dt;
      s.position.addScaledVector(s.userData.v, dt);
      if (s.userData.life <= 0 || s.position.y < -0.2) { scene.remove(s); sparks.splice(i, 1); }
    }
    // The sea and its squares, held still in the world while the planes follow her.
    const bx = boat.position.x, bz = boat.position.z;
    sea.position.set(Math.round(bx / TILE) * TILE, 0, Math.round(bz / TILE) * TILE);
    seaTex.offset.set(sea.position.x / TILE + S.t * 0.004, -sea.position.z / TILE + Math.sin(S.t / 2.4) * 0.01);
    grid.position.x = Math.round(bx / CELL) * CELL + CELL / 2; grid.position.z = Math.round(bz / CELL) * CELL + CELL / 2;
    scene.userData.dome.position.set(bx, 0, bz);
    sun.position.set(bx - 6, 14, bz + 10); sun.target.position.set(bx, 0, bz);
    // The view: from behind her and above, turned with her, looking up the sea ahead.
    const want = boat.rotation.y;
    S.camYaw += Math.atan2(Math.sin(want - S.camYaw), Math.cos(want - S.camYaw)) * Math.min(1, dt * 2.2);
    const fwd = new THREE.Vector3(Math.cos(S.camYaw), 0, -Math.sin(S.camYaw));
    const back = S.flying > 0 ? 10.5 : 8.5;
    S.camAt.lerp(boat.position, Math.min(1, dt * 4));
    camera.position.copy(S.camAt).addScaledVector(fwd, -back).setY(5.5);
    S.shake = Math.max(0, S.shake - dt * 0.4);
    if (S.shake > 0) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake));
    camera.lookAt(S.camAt.clone().addScaledVector(fwd, 8).setY(0.8));
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  reset();
  requestAnimationFrame(frame);
  return { reset, row, build, get busy() { return !!S.cur || S.queue.length > 0; }, get gates() { return S.made; } };
}
