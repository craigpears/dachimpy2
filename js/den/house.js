/* The house shell: what every house in the district (src/den-houses.ts) is played in. A place of its own,
   like the Wedding Isle: houseEnter(id) takes you in (from the district's door: lodgings.js, or the
   cheats), houseLeave() back out to the den, in front of its door. The shell builds the rooms from the
   house's floor plan (floors, papered walls, the front walls cut low so the camera looks in as at a
   doll's house), walks you about them (WASD or the arrows; or click or tap where to go), lets you out at
   the front door (Space there, or the Leave button), shows who's talking in speech bubbles, and holds the
   camera. Everything inside is the house's own scene module (SCENES), which furnishes it from the shared
   furniture (furniture.js) and plays its owner's part. A friend's house: an entry in HOUSES, a scene
   module, one line in SCENES.

   A scene module: { plan, arrive, build(H) } where build returns { blocks, tick(dt), act(), prompt(),
   enter(), leave(), cam() }; H is the shell's side: the root to build in, you, figures, say and talk,
   showing a portrait. */
import * as THREE from 'three';
import { step, walkable, atWayOut, houseById, readSecs, LODGINGS } from '../den-houses.js';
import { $, scene, camera, renderer, hemi, skyDome, paintSky, myLook, V3, toast as denToast, toastQuiet, toastHush, warm, sunOver, makePirate, animateWalk, faceTo, keys, mat, mesh, woodTex, ray, pirate } from './world.js';
import { cine, cineEnd, cineLets, bubble, bubbleAt, stepTo } from './cine.js';
import { GRAVEE_HOUSE } from './gravee-house.js';

/** Where the houses are: well out of sight of the den, the sea and the Wedding Isle (at +400). */
export const HOUSE_AT = V3(-400, 0, 0);
/** Each house's scene, by its id in HOUSES. */
const SCENES = { gravee: GRAVEE_HOUSE };

const toast = (text, bad = false) => denToast(text, bad, false, true);
/** All there is of the house you're in. */
export const house = {
  on: false, snap: false, id: null, cur: null, root: null, you: null, to: null, built: {}, sky: null,
  /** Who's saying what: a bubble each. */
  lines: new Map(), talk: null, view: null, touch: matchMedia('(pointer: coarse)').matches,
};

// ---------- the page's parts: the bar along the top, the prompt, the portrait viewer ----------
const hud = document.createElement('div');
hud.className = 'house-hud'; hud.id = 'house-hud';
hud.innerHTML = '<div class="house-name"><b id="house-name"></b><small id="house-owner"></small></div><button class="mini" id="house-pic" hidden>Your portrait</button><button class="mini" id="house-leave">Leave</button>';
const promptEl = document.createElement('div');
promptEl.className = 'house-prompt'; promptEl.id = 'house-prompt';
promptEl.innerHTML = '<span></span><button class="mini"></button>';
const viewer = document.createElement('div');
viewer.className = 'wed-portrait house-view'; viewer.id = 'house-view';
viewer.innerHTML = '<div><img id="house-img" alt="Your portrait"><div class="row"><button id="house-save">Save the picture</button></div><button class="link" id="house-close">Close</button></div>';
const capEl = document.createElement('div');
capEl.className = 'house-cap'; capEl.id = 'house-cap';
const fadeEl = document.createElement('div');
fadeEl.className = 'wed-fade'; fadeEl.id = 'house-fade';
document.body.append(hud, promptEl, viewer, capEl, fadeEl);
$('house-leave').onclick = (e) => { e.currentTarget.blur(); houseLeave(); };
$('house-close').onclick = () => showPortrait(null);
$('house-save').onclick = () => {
  if (!house.view) return;
  const a = document.createElement('a');
  a.href = house.view.url; a.download = house.view.file;
  document.body.append(a); a.click(); a.remove();
};
promptEl.querySelector('button').onclick = (e) => { e.currentTarget.blur(); act(); };

/** The portrait viewer: a picture (a data URL) to look at and save, or null to shut it. */
export function showPortrait(url, file = 'portrait.png') {
  house.view = url ? { url, file } : null;
  if (url) $('house-img').src = url;
  viewer.classList.toggle('on', !!url);
}

// ---------- the rooms ----------
const WALL_T = 0.2;
const paperTex = (col) => {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255, 230, 170, .12)';
  for (const [x, y] of [[16, 16], [48, 48]]) { g.beginPath(); g.moveTo(x, y - 10); g.quadraticCurveTo(x + 9, y, x, y + 10); g.quadraticCurveTo(x - 9, y, x, y - 10); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, 2, 64);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
/* A room's walls: the back and sides full height, papered inside, wainscoted along the bottom; the front
   cut low; a gap wherever a doorway goes through, with a lintel over it. */
function buildRooms(root, S) {
  const { plan } = S, high = S.walls?.high ?? 3.2, low = S.walls?.low ?? 0.45;
  const floorM = mat('#9c6c42', { map: woodTex, roughness: 0.8 }), trim = mat('#3a2416', { map: woodTex }), outside = mat('#3b2c22');
  for (const r of plan.rooms) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const fl = mesh(new THREE.PlaneGeometry(w, d), floorM, false);
    fl.rotation.x = -Math.PI / 2; fl.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
    fl.material = floorM.clone(); fl.material.map = woodTex.clone(); fl.material.map.wrapS = fl.material.map.wrapT = THREE.RepeatWrapping; fl.material.map.repeat.set(w / 2, d / 2); fl.material.map.needsUpdate = true;
    root.add(fl);
    const tex = paperTex(r.paper || '#4a3a2a'), paperM = mat('#ffffff', { map: tex, roughness: 0.95 });
    // Each wall: along x (z fixed) or along z (x fixed), from a to b, its inside facing `n`.
    const walls = [
      { along: 'x', at: r.z0 + WALL_T / 2, a: r.x0, b: r.x1, h: high },
      { along: 'x', at: r.z1 - WALL_T / 2, a: r.x0, b: r.x1, h: low },
      { along: 'z', at: r.x0 + WALL_T / 2, a: r.z0, b: r.z1, h: high },
      { along: 'z', at: r.x1 - WALL_T / 2, a: r.z0, b: r.z1, h: high },
    ];
    for (const wl of walls) {
      // (the doorways through it: where a door's rectangle crosses it)
      const gaps = plan.doors.filter((g) => (wl.along === 'x' ? g.z0 < wl.at && g.z1 > wl.at && g.x1 > wl.a && g.x0 < wl.b : g.x0 < wl.at && g.x1 > wl.at && g.z1 > wl.a && g.z0 < wl.b))
        .map((g) => (wl.along === 'x' ? [g.x0, g.x1] : [g.z0, g.z1])).sort((p, q) => p[0] - q[0]);
      if (wl === walls[1] && plan.out) gaps.push([plan.out.x - 0.6, plan.out.x + 0.6]);   // (the front door, in the low front wall)
      gaps.sort((p, q) => p[0] - q[0]);
      let from = wl.a;
      const seg = (s0, s1, y0, y1) => {
        if (s1 - s0 < 0.01) return;
        const len = s1 - s0, hh = y1 - y0;
        const geo = wl.along === 'x' ? new THREE.BoxGeometry(len, hh, WALL_T) : new THREE.BoxGeometry(WALL_T, hh, len);
        const m = mesh(geo, [paperM, paperM, outside, outside, paperM, paperM]);
        const mid = (s0 + s1) / 2;
        if (wl.along === 'x') m.position.set(mid, (y0 + y1) / 2, wl.at); else m.position.set(wl.at, (y0 + y1) / 2, mid);
        root.add(m);
        // A dado rail and wainscot along its foot.
        if (wl.h > 1 && y0 === 0) {
          const ws = wl.along === 'x' ? new THREE.BoxGeometry(len, 0.9, WALL_T + 0.04) : new THREE.BoxGeometry(WALL_T + 0.04, 0.9, len);
          const wn = mesh(ws, trim); wn.position.copy(m.position); wn.position.y = 0.45; root.add(wn);
        }
      };
      // (a side wall full height at the back, stepping down to the front's low wall for the front half, so
      // it never stands between the camera and the room)
      const zm = r.z0 + (r.z1 - r.z0) * 0.45;
      const part = (s0, s1, y0, y1) => {
        if (wl.along !== 'z' || wl.h <= low) { seg(s0, s1, y0, y1); return; }
        if (s0 < zm) seg(s0, Math.min(s1, zm), y0, y1);
        if (s1 > zm && y0 < low) seg(Math.max(s0, zm), s1, y0, Math.min(y1, low));
      };
      for (const [g0, g1] of gaps) {
        part(from, Math.max(from, g0), 0, wl.h);
        if (wl.h > 2.4) part(Math.max(from, g0), g1, 2.35, wl.h);   // (a lintel over a doorway)
        from = Math.max(from, g1);
      }
      part(from, wl.b, 0, wl.h);
    }
  }
}

// ---------- the people in it ----------
/** A figure from a look, in the house, at (x, z). */
function figure(look, x = 0, z = 0, yaw = 0) {
  const p = Object.assign(makePirate({ look }), { x, z, yaw, phase: 0 });
  p.g.position.set(x, 0, z); p.g.rotation.y = yaw;
  house.root.add(p.g);
  return p;
}
/** `fig` says `text` in a bubble over them for a while (`secs`, or as long as it takes to read), or, with
    no text, stops. Each speaker has their own bubble, so two can scream at once. */
function say(fig, text, secs = null) {
  if (!fig) return;
  if (!text) { house.lines.delete(fig); return; }
  let L = house.lines.get(fig);
  if (!L) { L = { el: house.bubbles.pop() || bubble('', document.body, 'wrap house-say') }; house.lines.set(fig, L); }
  L.el.textContent = text;
  L.until = performance.now() + 1000 * (secs ?? readSecs(text));
  L.fig = fig;
}
/** A run of lines from `fig`, one after another, then `done`. Space (or a tap on the prompt) moves it on. */
function talk(fig, lines, done = null) {
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  house.talk = { fig, list, i: -1, done, t: 0 };
  nextLine();
}
function nextLine() {
  const T = house.talk;
  if (!T) return;
  T.i++;
  if (T.i >= T.list.length) { house.talk = null; say(T.fig, null); T.done?.(); return; }
  T.t = readSecs(T.list[T.i]) + 0.3;
  say(T.fig, T.list[T.i], T.t + 0.2);
}
const talking = () => !!house.talk;
/** Walks a figure toward (x, z), round the furniture; true once there. */
function walkTo(p, x, z, speed, dt) {
  const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
  if (d < 0.08) { animateWalk(p, false, dt); return true; }
  const s = Math.min(d, speed * dt);
  const [nx, nz] = step(house.cur.plan, p.x, p.z, p.x + dx / d * s, p.z + dz / d * s, house.inst?.blocks || []);
  const moved = Math.hypot(nx - p.x, nz - p.z) > 1e-4;
  p.x = nx; p.z = nz;
  faceTo(p, dx, dz, dt);
  animateWalk(p, moved, dt, speed * 3.4);
  if (!moved) return true;   // (stuck: as near as it gets)
  return false;
}

// ---------- in and out ----------
function fade(then) {
  fadeEl.classList.add('on');
  setTimeout(() => { then(); setTimeout(() => fadeEl.classList.remove('on'), 120); }, 360);
}
function enterSky() {
  house.sky = { col: skyDome.geometry.attributes.color, bg: scene.background.clone(), fog: scene.fog.color.clone(), near: scene.fog.near, far: scene.fog.far, hemi: [hemi.color.clone(), hemi.groundColor.clone(), hemi.intensity] };
  paintSky('#0c0806', '#1a110b');
  hemi.color.set('#ffe0b8'); hemi.groundColor.set('#4a3020'); hemi.intensity = 1.25;
  sunOver(HOUSE_AT.x, 0, HOUSE_AT.z);
}
function leaveSky() {
  const s = house.sky;
  if (!s) return;
  skyDome.geometry.setAttribute('color', s.col);
  scene.background.copy(s.bg); scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hemi[0]); hemi.groundColor.copy(s.hemi[1]); hemi.intensity = s.hemi[2];
  sunOver(0, 0, 0);
  house.sky = null;
}
/** Into a house in the district (by its id in HOUSES). */
export function houseEnter(id) {
  const H0 = houseById(id), S = SCENES[id];
  if (!H0 || !S || house.on) return false;
  fade(() => {
    if (!house.built[id]) {
      const root = new THREE.Group();
      root.position.copy(HOUSE_AT);
      scene.add(root);
      house.root = root;
      buildRooms(root, S);
      house.bubbles ||= [];
      const you = figure(myLook, S.arrive.you.x, S.arrive.you.z, Math.PI);
      house.you = you;
      house.built[id] = { root, inst: null, you };
      house.cur = S;
      house.built[id].inst = S.build(shell);
      warm(root);
    }
    const B = house.built[id];
    Object.assign(house, { on: true, snap: true, id, cur: S, root: B.root, inst: B.inst, you: B.you, to: null });
    B.root.visible = true;
    // (dressed as you are now)
    swapLook(house.you, myLook);
    Object.assign(house.you, { x: S.arrive.you.x, z: S.arrive.you.z });
    house.you.g.rotation.y = Math.PI;
    toastQuiet.on = true; toastHush();
    document.body.classList.add('housing');
    $('house-name').textContent = H0.name;
    $('house-owner').textContent = `${H0.owner}'s ${H0.kind.toLowerCase()}`;
    enterSky();
    keys.clear();
    house.inst.enter?.();
  });
  return true;
}
function swapLook(p, look) {
  const np = makePirate({ look });
  np.g.position.copy(p.g.position); np.g.rotation.copy(p.g.rotation);
  p.g.parent?.add(np.g); p.g.removeFromParent();
  Object.assign(p, { g: np.g, legs: np.legs, arms: np.arms, body: np.body, fam: np.fam, look: np.look, held: np.held, scared: null });
}
/** Back out to the den, in front of the district's door. */
export function houseLeave() {
  if (!house.on) return;
  fade(() => {
    if (cine) cineEnd(true);
    const bye = house.inst?.leave?.();
    house.on = false; house.snap = true;
    house.root.visible = false;
    cineLets.cineView = 0;
    house.lines.forEach((L) => { L.el.style.display = 'none'; house.bubbles.push(L.el); });
    house.lines.clear(); house.talk = null;
    showPortrait(null);
    promptEl.classList.remove('on');
    document.body.classList.remove('housing');
    toastQuiet.on = false;
    leaveSky();
    Object.assign(pirate, { x: LODGINGS.x + 1.05 * LODGINGS.face, z: LODGINGS.z, h: 0, hs: 0, hop: null });
    pirate.g.rotation.set(0, Math.PI / 2 * LODGINGS.face, 0);
    keys.clear();
    capEl.classList.remove('on');
    if (bye) setTimeout(() => denToast(bye), 500);
    try { const u = new URL(location.href); if (['gravee', 'lodgings'].includes(u.searchParams.get('at')) || u.searchParams.get('at') === house.id) { u.searchParams.delete('at'); history.replaceState(history.state, '', u); } } catch { /* never mind */ }
  });
}

// ---------- the shell's side, for a house's scene ----------
const shell = {
  get root() { return house.root; },
  get you() { return house.you; },
  get house() { return house; },
  figure, say, talk, talking, walkTo, toast, showPortrait, stepTo,
  /** Where the house is in the world (a cutscene's camera is in the world's terms). */
  at: HOUSE_AT,
  /** A caption across the top (a picture's title as it whizzes past), or none. */
  caption(text) { capEl.textContent = text || ''; capEl.classList.toggle('on', !!text); },
  /** The "Your portrait" button in the bar: shown with what it opens, or hidden. */
  portraitButton(open) { $('house-pic').hidden = !open; $('house-pic').onclick = open ? (e) => { e.currentTarget.blur(); open(); } : null; },
  /** Skips on to the next line of whoever's talking (true if there was one). */
  skipLine() { if (!house.talk) return false; nextLine(); return true; },
  /** Stops all talk. */
  hush() { house.talk = null; house.lines.forEach((L) => { L.el.style.display = 'none'; house.bubbles.push(L.el); }); house.lines.clear(); },
};

// ---------- your keys, clicks and taps ----------
/** Space (or the prompt's button, or a click on what's prompted): the house's own thing first, then the
    way out; otherwise it moves the talk on. */
function act() {
  if (!house.on || cine) return;
  if (house.view) { showPortrait(null); return; }
  if (house.inst?.act?.()) return;
  if (atWayOut(house.cur.plan, house.you.x, house.you.z)) { houseLeave(); return; }
  shell.skipLine();
}
/** Keys in a house (Space and Esc skip a cutscene first: den.js). True: it used the key. */
export function houseKey(key, e) {
  if (!house.on) return false;
  if (e.target instanceof HTMLInputElement) return true;
  if (house.view) { if (['escape', ' ', 'enter'].includes(key)) { e.preventDefault?.(); showPortrait(null); } return true; }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { e.preventDefault?.(); keys.add(key); house.to = null; return true; }
  if ((key === ' ' || key === 'enter') && !e.repeat) { e.preventDefault?.(); act(); return true; }
  if (key === 'escape' && !e.repeat) { if (!shell.skipLine()) houseLeave(); return true; }
  return true;
}
/* A click or a tap on the floor: walk there (the way to get about on a phone). On something the house
   prompts for (the coffin, the door), you walk to it and it's done when you're there. */
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!house.on || cine || house.view || e.button !== 0) return;
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return;
  p.sub(HOUSE_AT);
  house.to = { x: p.x, z: p.z };
  if (talking()) shell.skipLine();
});

// ---------- each tick, and the camera ----------
export function houseTick(dt) {
  if (!house.on || !house.inst) return;
  const Y = house.you, plan = house.cur.plan;
  // Walking: the keys (the camera faces in, -z: up is away from you), or to where you clicked.
  let mx = 0, mz = 0;
  if (!cine && !house.inst.frozen?.()) {
    if (keys.has('a') || keys.has('arrowleft')) mx--;
    if (keys.has('d') || keys.has('arrowright')) mx++;
    if (keys.has('w') || keys.has('arrowup')) mz--;
    if (keys.has('s') || keys.has('arrowdown')) mz++;
  }
  const ox = Y.x, oz = Y.z;
  if (mx || mz) {
    const n = Math.hypot(mx, mz), sp = 4.2 * dt;
    [Y.x, Y.z] = step(plan, Y.x, Y.z, Y.x + mx / n * sp, Y.z + mz / n * sp, house.inst.blocks || []);
    faceTo(Y, mx, mz, dt);
    animateWalk(Y, true, dt);
  } else if (house.to && !cine && !house.inst.frozen?.()) {
    if (walkTo(Y, house.to.x, house.to.z, 4.2, dt)) house.to = null;
  } else if (!house.inst.frozen?.()) animateWalk(Y, false, dt);
  Y.g.position.set(Y.x, Y.g.position.y, Y.z);
  if (!walkable(plan, Y.x, Y.z)) { Y.x = ox; Y.z = oz; }
  // The talk moves on by itself, a line at a time.
  if (house.talk && (house.talk.t -= dt) <= 0) nextLine();
  house.inst.tick?.(dt, { ox, oz });
  // The bubbles over whoever's talking.
  const now = performance.now();
  for (const [fig, L] of house.lines) {
    if (now > L.until || !fig.g.parent) { L.el.style.display = 'none'; house.bubbles.push(L.el); house.lines.delete(fig); continue; }
    const v = V3(); fig.g.getWorldPosition(v); v.y += fig.tall ?? 2.15;
    bubbleAt(L.el, true, v.x, v.y, v.z);
    const bw = L.el.offsetWidth / 2;
    L.el.style.left = `${Math.max(bw + 8, Math.min(innerWidth - bw - 8, parseFloat(L.el.style.left)))}px`;
    L.el.style.top = `${Math.max(L.el.offsetHeight + 60, parseFloat(L.el.style.top))}px`;
  }
  // What Space does here, along the bottom, with a button for it (a phone has no Space).
  const pr = cine ? null : house.inst.prompt?.() || (atWayOut(plan, Y.x, Y.z) ? { text: 'The front door', btn: 'Go out' } : talking() ? { text: '', btn: 'Next' } : null);
  promptEl.classList.toggle('on', !!pr && !house.view);
  if (pr) {
    const [span, b] = promptEl.children;
    if (span.textContent !== pr.text) span.textContent = pr.text;
    if (b.textContent !== pr.btn) b.textContent = pr.btn;
    span.hidden = !pr.text;
  }
}
/** How far back the camera stands to see `across` metres side to side (more on a phone held upright). */
function across(m) {
  const hh = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
  return m / (2 * Math.tan(hh));
}
/** The camera in a house (den.js uses it whole while you're in one; a cutscene's own shots go over it):
    looking in from the front and above, a doll's house, following you; the house's scene may frame
    something itself. */
export function houseCam() {
  if (!house.on || !house.you) return null;
  const own = house.inst?.cam?.();
  const tall = camera.aspect < 1;   // (a phone held upright: closer in, and more from above, to fill the height)
  const C = own || { look: V3(house.you.x, 0.8, house.you.z - (tall ? 2.0 : 1.3)), dist: tall ? Math.max(7, across(5.4)) : Math.max(8.5, across(8.5)), tilt: tall ? 1.12 : 0.82, yaw: 0 };
  return { look: C.look.clone().add(HOUSE_AT), dist: C.dist, tilt: C.tilt, yaw: C.yaw, cut: C.cut };
}
