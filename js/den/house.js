/* The house shell: what every house in the district (src/den-houses.ts) is played in. A place of its own,
   like the Wedding Isle: houseEnter(id) takes you in (from the district's door: lodgings.js, or the
   cheats), houseLeave() back out to the den, in front of its door. The shell builds the rooms from the
   house's floor plan (floors, papered walls, the front walls cut low so the camera looks in as at a
   doll's house), walks you about them (WASD or the arrows; or click or tap where to go), lets you out at
   the front door (Space there, or the Leave button), shows who's talking in speech bubbles, and holds the
   camera, which you can turn round you and zoom right in (a drag, the wheel or a pinch: src/den-houses.ts's
   Look), the house's own view easing back once you walk on. Everything inside is the house's own scene module (SCENES), which furnishes it from the shared
   furniture (furniture.js) and plays its owner's part. A friend's house: an entry in HOUSES, a scene
   module, one line in SCENES.

   What any house has, the shell does: its host walks with you (src/den-houses.ts's hostTarget: at your
   side at your pace, by whatever they're showing you while they talk about it), and a long stretch of
   it you can skip along at a run (a Stretch: a button and Q), the camera alongside.

   And its host talks about what you're looking at (src/den-houses.ts's lookingAt and remark): stop by a
   portrait, or turn the camera onto one, and they tell you about it, once a visit each.

   A scene module: { plan, arrive, build(H) } where build returns { blocks, tick(dt), act(), prompt(),
   enter(), leave(), cam(), frozen(), host, stretch, exhibits, remark(id) }: `exhibits` what's on its
   walls ({ id, x, y, z }: src/den-houses.ts's Exhibit), `remark(id)` what the host says of one;
   `pictures` its pictures to look through close up, flat (picture-view.js: Tab, or the button), as
   { name, who (says what's said of them), list() ({ id, title, x, z }, in the order they hang), art(picture)
   (a canvas, or an image), note(picture) (its plaque, if any) }; `host` { who (a person(): props-people.js), idle,
   showing() (a ShowSpot, or null), still() (true: the scene has them just now) }; `stretch` a Stretch
   with `titles` ({ x, title }: shown as they go by) and `lines` ({ ask: yours the first time, answer:
   the host's then, back: theirs coming back }). H is the shell's side: the root to build in, you,
   figures, say and talk, showing a portrait, the house's own view of you (home). */
import * as THREE from 'three';
import { step, walkable, atWayOut, houseById, readSecs, LODGINGS, YOUR_PACE, hostTarget, skipTo, skipSecs, roomAt, WALL_BACK, LOOK_HOME, lookTurn, lookZoom, lookWheel, lookEase, lookView, isDrag, walkDir, lookingAt, remark, REMARK, GAZE_START } from '../den-houses.js';
import { $, scene, camera, renderer, hemi, skyDome, paintSky, myLook, V3, toast as denToast, toastQuiet, toastHush, warm, sunOver, makePirate, animateWalk, faceTo, keys, mat, mesh, woodTex, ray, pirate } from './world.js';
import { cine, cinePlay, cineEnd, cineLets, bubble, bubbleAt, stepTo } from './cine.js';
import { GRAVEE_HOUSE } from './gravee-house.js';
import { ROOBEAR_HOUSE } from './roobear-house.js';
import { DACHIMPY_HOUSE } from './dachimpy-house.js';
import { AFFAME_HOUSE } from './affame-house.js';
import { WOLFDEN_HOUSE } from './wolfden-house.js';
import { pictures, picturesOpen, picturesClose, picturesKey } from './picture-view.js';
import { startAt } from '../picture-view.js';

/** Where the houses are: well out of sight of the den, the sea and the Wedding Isle (at +400). */
export const HOUSE_AT = V3(-400, 0, 0);
/** Each house's scene, by its id in HOUSES. */
const SCENES = { gravee: GRAVEE_HOUSE, roobear: ROOBEAR_HOUSE, dachimpy: DACHIMPY_HOUSE, affame: AFFAME_HOUSE, wolfden: WOLFDEN_HOUSE };

const toast = (text, bad = false) => denToast(text, bad, false, true);
/** All there is of the house you're in. */
export const house = {
  on: false, snap: false, id: null, cur: null, root: null, you: null, to: null, built: {}, sky: null,
  /** Who's saying what: a bubble each. */
  lines: new Map(), talk: null, view: null, touch: matchMedia('(pointer: coarse)').matches,
  /** How you're looking round, over the house's own view (src/den-houses.ts's Look); the way the keys
      walk you while you hold them (`walkYaw`); the camera's turn as last drawn (`camYaw`). */
  look: { ...LOOK_HOME }, walkYaw: null, camYaw: 0,
  /** What you're looking at on the walls, and what's been said of them this visit (src/den-houses.ts's Gaze). */
  gaze: GAZE_START,
};

// ---------- the page's parts: the bar along the top, the prompt, the portrait viewer ----------
const hud = document.createElement('div');
hud.className = 'house-hud'; hud.id = 'house-hud';
hud.innerHTML = '<div class="house-name"><b id="house-name"></b><small id="house-owner"></small></div><button class="mini" id="house-skip" hidden>Whiz along</button><button class="mini" id="house-pics" hidden>Pictures</button><button class="mini" id="house-pic" hidden>Your portrait</button><button class="mini" id="house-leave">Leave</button>';
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
$('house-skip').onclick = (e) => { e.currentTarget.blur(); skipAlong(); };
$('house-pics').onclick = (e) => { e.currentTarget.blur(); openPictures(); };
if (!house.touch) $('house-skip').textContent = 'Whiz along (Q)';
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
      const zm = r.z0 + (r.z1 - r.z0) * WALL_BACK;
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
/** Takes `fig`'s bubble down (back in the pile for the next line). */
function unsay(fig) {
  const L = house.lines.get(fig);
  if (!L) return;
  L.el.style.display = 'none';
  house.bubbles.push(L.el);
  house.lines.delete(fig);
}
/** `fig` says `text` in a bubble over them for a while (`secs`, or as long as it takes to read), or, with
    no text, stops. Each speaker has one bubble, so two can scream at once but no one says two things.
    (Stopping used to take them off the list and leave the bubble up where it was, so every run of lines
    that ended left one stuck on the screen: the user, 11 Nov, "I see 4 of them open there at the moment".) */
function say(fig, text, secs = null) {
  if (!fig) return;
  if (!text) { unsay(fig); return; }
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
  animateWalk(p, moved, dt);
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
/** Into a house in the district (by its id in HOUSES); `bySea`, ashore off an island (the wolf den's hut, off
    Multibella's: multibella-isle.js), so leaving puts you back aboard her, not at the district's door. */
export function houseEnter(id, { bySea = false } = {}) {
  const H0 = houseById(id), S = SCENES[id];
  if (!H0 || !S || house.on) return false;
  house.bySea = bySea;
  $('house-leave').textContent = bySea ? 'Back aboard' : 'Leave';
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
    Object.assign(house, { on: true, snap: true, id, cur: S, root: B.root, inst: B.inst, you: B.you, to: null, look: { ...LOOK_HOME }, walkYaw: null, gaze: GAZE_START });
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
    shell.hush();
    showPortrait(null);
    picturesClose();
    promptEl.classList.remove('on');
    document.body.classList.remove('housing');
    toastQuiet.on = false;
    leaveSky();
    // (back aboard her, moored off the island she came ashore at, the sea as it was; else out of the district's door)
    if (!house.bySea) {
      Object.assign(pirate, { x: LODGINGS.x + 1.05 * LODGINGS.face, z: LODGINGS.z, h: 0, hs: 0, hop: null });
      pirate.g.rotation.set(0, Math.PI / 2 * LODGINGS.face, 0);
    }
    house.bySea = false;
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
  hush() { house.talk = null; [...house.lines.keys()].forEach(unsay); },
  /** The house's own view of you (house-local: { look: { x, y, z }, dist, tilt, yaw }), for a cutscene
      to ease from and back to. */
  home,
};

// ---------- a long stretch, skipped along ----------
const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const facing = (p) => (Math.sin(p.g.rotation.y) >= 0 ? 1 : -1);
/* Skipping along the house's long stretch, if you're in it (src/den-houses.ts's skipTo: the way you're
   facing): you and your host off down it at a run, the camera easing round alongside and back, the
   titles of what's on the walls going by, each up long enough to read. */
function skipAlong() {
  const S = house.inst?.stretch, Y = house.you;
  if (!house.on || !S || cine || house.inst.frozen?.()) return false;
  const to = skipTo(house.cur.plan, S, Y.x, Y.z, facing(Y));
  if (to === null) return false;
  const from = Y.x, dir = Math.sign(to - from), first = !house.skips, secs = skipSecs(to - from, house.skips || 0);
  const host = house.inst.host?.who.p, room = roomAt(house.cur.plan, Y.x, Y.z), zm = room ? (room.z0 + room.z1) / 2 : Y.z;
  house.skips = (house.skips || 0) + 1;
  shell.hush(); house.to = null;
  if (first && S.lines?.ask) say(Y, S.lines.ask, secs * 0.45);
  const cap = { title: null, t: 1 };
  const c = {
    t: 0, cam: { look: V3(), dist: 0, tilt: 0, yaw: 0 },
    tick(dt) {
      c.t += dt;
      const u = Math.min(1, c.t / secs), x = from + (to - from) * smooth(u);
      Y.x = x; Y.z = zm + 0.2;
      if (host) { host.x = x + dir * 0.9; host.z = zm - 0.45; }
      for (const p of host ? [Y, host] : [Y]) { faceTo(p, dir, 0, dt); animateWalk(p, true, dt); p.g.position.set(p.x, p.g.position.y, p.z); }
      // The camera: from the house's view of you, round alongside, and back again at the end.
      const H0 = home(), k = smooth(Math.min(c.t, secs - c.t) / 0.8);
      const run = { x: x + dir * 1.2, y: 1.35, z: zm, dist: 6.2 - Math.sin(Math.PI * u) * 1.2, tilt: 0.22 };
      c.cam.look.set(H0.look.x + (run.x - H0.look.x) * k, H0.look.y + (run.y - H0.look.y) * k, H0.look.z + (run.z - H0.look.z) * k).add(HOUSE_AT);
      c.cam.dist = H0.dist + (run.dist - H0.dist) * k; c.cam.tilt = H0.tilt + (run.tilt - H0.tilt) * k; c.cam.yaw = 0;
      // What's going by: the nearest title, each kept up a moment to read.
      cap.t += dt;
      if (S.titles?.length && cap.t > 0.75) {
        const near = S.titles.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
        const t = Math.abs(near.x - x) < 1.2 && u > 0.03 && u < 0.97 ? near.title : null;
        if (t !== cap.title) { cap.title = t; cap.t = 0; shell.caption(t); }
      }
      if (first && u > 0.5 && !c.said && S.lines?.answer) { c.said = true; say(host, S.lines.answer, secs * 0.45); }
      if (!first && dir < 0 && u > 0.3 && !c.said && S.lines?.back) { c.said = true; say(host, S.lines.back, 1.6); }
      if (u >= 1) cineEnd(false);
    },
    end() {
      shell.caption(null);
      Y.x = to; Y.z = zm + 0.2;
      if (host) { host.x = to + dir * 1.1; host.z = zm - 0.5; }
      for (const p of host ? [Y, host] : [Y]) p.g.position.set(p.x, p.g.position.y, p.z);
      house.to = null;
    },
  };
  cinePlay(c);
  return true;
}

// ---------- the house's pictures, close up ----------
/* Its pictures one at a time, flat and big (picture-view.js; the user, 11 Nov: "a 2D version similar to the
   puzzles, so you can go through the portraits easily with keyboard controls"): Tab or the button, as Tab
   opens a puzzle's 2D view in the den; opening on the one you're looking at, or else the one you're
   nearest (src/picture-view.ts's startAt), each with what the host says of it; Esc back. */
function openPictures() {
  const I = house.inst, P = I?.pictures;
  if (!house.on || !P || cine || I.frozen?.() || house.view || pictures.on) return false;
  const list = P.list(), Y = house.you, c = camera.position, d = camera.getWorldDirection(V3());
  const seen = I.exhibits ? lookingAt(I.exhibits, Y, { x: c.x - HOUSE_AT.x, y: c.y - HOUSE_AT.y, z: c.z - HOUSE_AT.z }, d) : null;
  keys.clear(); house.to = null;
  return picturesOpen({ list, at: startAt(list, seen?.id ?? null, Y), art: P.art, note: P.note || null, line: I.remark ? (p) => I.remark(p.id) : null, who: P.who || '', done: () => keys.clear() });
}

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
  if (pictures.on) return picturesKey(key, e);
  // (a scene playing a puzzle of its own takes the keys it wants first: the wolf den's star table)
  if (!cine && house.inst?.key?.(key, e)) { e.preventDefault?.(); return true; }
  if (key === 'tab') { e.preventDefault?.(); if (!e.repeat && !cine) openPictures(); return true; }
  if (house.view) { if (['escape', ' ', 'enter'].includes(key)) { e.preventDefault?.(); showPortrait(null); } return true; }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { e.preventDefault?.(); keys.add(key); house.to = null; return true; }
  if ((key === ' ' || key === 'enter') && !e.repeat) { e.preventDefault?.(); act(); return true; }
  if (key === 'q' && !e.repeat) { if (!cine) skipAlong(); return true; }
  // Looking round, as in the den: Z and C turn, - and = zoom, V puts the house's view back.
  if (key === 'z' || key === 'c') { keys.add(key); return true; }
  if (!cine && (key === '-' || key === '_')) { house.look = lookZoom(house.look, 1.15); return true; }
  if (!cine && (key === '=' || key === '+')) { house.look = lookZoom(house.look, 1 / 1.15); return true; }
  if (key === 'v') { house.look = { ...LOOK_HOME }; return true; }
  if (key === 'escape' && !e.repeat) { if (!shell.skipLine()) houseLeave(); return true; }
  return true;
}
/* A click or a tap on the floor: walk there (the way to get about on a phone). On something the house
   prompts for (the coffin, the door), you walk to it and it's done when you're there. A press that moves
   is a drag instead (src/den-houses.ts's isDrag): it turns the camera round you (either mouse button, or a
   finger), as the den's right-drag does; two fingers pinch to zoom, as the wheel does. Walking happens on
   letting go, so a drag never walks you. */
const cv = renderer.domElement, presses = new Map();
let grab = null, pinch = null;
const apart = () => { const [a, b] = [...presses.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
const looking = () => house.on && !cine && !house.view && !pictures.on;
cv.addEventListener('pointerdown', (e) => {
  if (!looking() || (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2)) return;
  presses.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { cv.setPointerCapture(e.pointerId); } catch { /* never mind */ }
  if (presses.size === 2) { pinch = { d: Math.max(1, apart()), zoom: house.look.zoom }; if (grab) grab.moved = true; return; }
  if (presses.size === 1) grab = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, button: e.button, touch: e.pointerType === 'touch' };
});
cv.addEventListener('pointermove', (e) => {
  const P = presses.get(e.pointerId);
  if (!P) return;
  P.x = e.clientX; P.y = e.clientY;
  if (!looking()) return;
  if (pinch && presses.size >= 2) { house.look = lookZoom({ ...house.look, zoom: pinch.zoom }, pinch.d / Math.max(1, apart())); return; }
  if (!grab || grab.id !== e.pointerId) return;
  if (!grab.moved && !isDrag(e.clientX - grab.sx, e.clientY - grab.sy, grab.touch)) return;
  if (!grab.moved) { grab.moved = true; grab.x = grab.sx; grab.y = grab.sy; }
  house.look = lookTurn(house.look, e.clientX - grab.x, e.clientY - grab.y, grab.touch);
  grab.x = e.clientX; grab.y = e.clientY;
});
function letGo(e, cancel = false) {
  if (!presses.delete(e.pointerId)) return;
  if (pinch) {
    if (presses.size < 2) pinch = null;
    // (a finger left on: it carries on turning, never a tap)
    if (presses.size === 1) { const [[id, p]] = [...presses]; grab = { id, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: true, touch: true }; } else grab = null;
    return;
  }
  const G = grab;
  if (!G || G.id !== e.pointerId) return;
  grab = null;
  if (cancel || G.moved || G.button !== 0 || !looking()) return;
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return;
  p.sub(HOUSE_AT);
  house.to = { x: p.x, z: p.z };
  if (talking()) shell.skipLine();
}
cv.addEventListener('pointerup', (e) => letGo(e));
cv.addEventListener('pointercancel', (e) => letGo(e, true));
// The wheel zooms, in toward what's ahead of you at a portrait's height (den.js leaves it to a house).
cv.addEventListener('wheel', (e) => { if (looking()) house.look = lookWheel(house.look, e.deltaY * (e.deltaMode ? 33 : 1)); }, { passive: true });

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
  // (the way the camera faces as you set off, kept while you hold the keys, so the view easing back as
  // you walk on doesn't curve your path)
  if (!mx && !mz) house.walkYaw = null;
  else house.walkYaw ??= house.camYaw;
  if (mx || mz) {
    const [wx, wz] = walkDir(mx, mz, house.walkYaw), sp = YOUR_PACE * dt;
    [Y.x, Y.z] = step(plan, Y.x, Y.z, Y.x + wx * sp, Y.z + wz * sp, house.inst.blocks || []);
    faceTo(Y, wx, wz, dt);
    animateWalk(Y, true, dt);
  } else if (house.to && !cine && !house.inst.frozen?.()) {
    if (walkTo(Y, house.to.x, house.to.z, YOUR_PACE, dt)) house.to = null;
  } else if (!house.inst.frozen?.()) animateWalk(Y, false, dt);
  Y.g.position.set(Y.x, Y.g.position.y, Y.z);
  if (!walkable(plan, Y.x, Y.z)) { Y.x = ox; Y.z = oz; }
  const moved = Math.hypot(Y.x - ox, Y.z - oz);
  lookTick(dt, moved);
  // The talk moves on by itself, a line at a time.
  if (house.talk && (house.talk.t -= dt) <= 0) nextLine();
  house.inst.tick?.(dt, { ox, oz });
  hostTick(dt);
  remarkTick(dt, moved);
  // The bubbles over whoever's talking.
  const now = performance.now();
  for (const [fig, L] of house.lines) {
    if (now > L.until || !fig.g.parent) { unsay(fig); continue; }
    const v = V3(); fig.g.getWorldPosition(v); v.y += fig.tall ?? 2.15;
    bubbleAt(L.el, true, v.x, v.y, v.z);
    const bw = L.el.offsetWidth / 2;
    L.el.style.left = `${Math.max(bw + 8, Math.min(innerWidth - bw - 8, parseFloat(L.el.style.left)))}px`;
    L.el.style.top = `${Math.max(L.el.offsetHeight + 60, parseFloat(L.el.style.top))}px`;
  }
  // What Space does here, along the bottom, with a button for it (a phone has no Space).
  const pr = cine ? null : house.inst.prompt?.() || (atWayOut(plan, Y.x, Y.z) ? { text: 'The front door', btn: 'Go out' } : talking() ? { text: '', btn: 'Next' } : null);
  promptEl.classList.toggle('on', !!pr && !house.view && !pictures.on);
  // The long stretch's skip, while you're in it.
  const S = house.inst.stretch, skip = !cine && !!S && !house.inst.frozen?.() && skipTo(plan, S, Y.x, Y.z, facing(Y)) !== null;
  if ($('house-skip').hidden === skip) $('house-skip').hidden = !skip;
  const pics = !cine && !!house.inst.pictures && !house.inst.frozen?.();
  if ($('house-pics').hidden === pics) { $('house-pics').hidden = !pics; $('house-pics').textContent = `${house.inst.pictures?.name || 'Pictures'}${house.touch ? '' : ' (Tab)'}`; }
  if (pr) {
    const [span, b] = promptEl.children;
    if (span.textContent !== pr.text) span.textContent = pr.text;
    if (b.textContent !== pr.btn) b.textContent = pr.btn;
    span.hidden = !pr.text;
  }
}
/* The house's host (the scene's `host`), walking with you: at your side at your pace, hurrying if you've
   got ahead, by what they're showing you while they talk about it; turned to you when stood; their hands
   going while they talk (src/den-houses.ts's hostTarget). Not while a cutscene or the scene has them. */
function hostTick(dt) {
  const h = house.inst.host;
  if (!h) return;
  const P = h.who, p = P.p, Y = house.you;
  let walked = false;
  if (!cine && !h.still?.()) {
    const t = hostTarget(p, Y, h.showing?.() || null, house.hostWalking);
    walked = !!t && !walkTo(p, t.x, t.z, t.speed, dt);
    if (!walked) faceTo(p, Y.x - p.x, Y.z - p.z, dt * 0.6);
    p.g.position.set(p.x, p.g.position.y, p.z);
    P.setIdle(house.talk?.fig === p || house.lines.has(p) ? 'talk' : h.idle || 'sway');
  }
  house.hostWalking = walked;
  P.pose(dt, walked ? 'walked' : false);
  P.talk(dt);
}
/* The host on what you're looking at (the scene's `exhibits`, and its `remark` for each): stand looking
   at one a moment, stopped by it or the camera turned onto it, and they say their line about it, when
   nothing else is being said and they're by you; once a visit each (src/den-houses.ts's remark). */
function remarkTick(dt, moved) {
  const I = house.inst, h = I.host;
  if (!h || !I.exhibits?.length || !I.remark) return;
  const p = h.who.p, Y = house.you, c = camera.position, d = camera.getWorldDirection(V3());
  const seen = cine ? null : lookingAt(I.exhibits, Y, { x: c.x - HOUSE_AT.x, y: c.y - HOUSE_AT.y, z: c.z - HOUSE_AT.z }, d);
  const quiet = !cine && !pictures.on && !I.frozen?.() && !talking() && !house.lines.has(p) && Math.hypot(p.x - Y.x, p.z - Y.z) < REMARK.near;
  const r = remark(house.gaze, seen?.id ?? null, dt, moved < 1e-3 && !house.to, quiet, I.remark);
  house.gaze = r.gaze;
  if (r.say) talk(p, [r.say]);
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
  const own = house.inst?.cam?.(), H0 = home(), Y = house.you;
  const C = own || { look: V3(H0.look.x, H0.look.y, H0.look.z), dist: H0.dist, tilt: H0.tilt, yaw: H0.yaw };
  // (your look round over it: src/den-houses.ts's lookView, kept out of the room's walls)
  const v = lookView({ look: { x: C.look.x, y: C.look.y, z: C.look.z }, dist: C.dist, tilt: C.tilt, yaw: C.yaw }, Y, house.look, roomAt(house.cur.plan, Y.x, Y.z), house.cur.walls?.high);
  house.camYaw = v.yaw;
  return { look: V3(v.look.x, v.look.y, v.look.z).add(HOUSE_AT), dist: v.dist, tilt: v.tilt, yaw: v.yaw, cut: C.cut };
}
/* Your look round, each tick: Z and C turn it (as in the den); a cutscene takes the camera and, when it
   hands back, it's the house's own view again; walk on and it eases back (stood still, it stays). Zoomed
   well in, the camera's close behind your head: you're out of the way while it is. */
function lookTick(dt, moved) {
  if (cine || house.inst.frozen?.()) house.look = { ...LOOK_HOME };
  else {
    const turn = (keys.has('z') ? 1 : 0) - (keys.has('c') ? 1 : 0);
    if (turn) house.look = lookTurn(house.look, -turn * dt * 1.4 / 0.006, 0);
    house.look = lookEase(house.look, dt, moved);
  }
  const Y = house.you, w = Y.g.getWorldPosition(V3()), c = camera.position;
  Y.g.visible = !!cine || Math.hypot(c.x - w.x, c.z - w.z) > 1.5 || c.y > w.y + 2.8;
}
/** The house's own view of you, house-local: looking in from the front and a little above (not so steeply
    you see only the tops of hats: the user, 11 Nov, of Gravee in her pelt, "you really can't see her"). */
function home() {
  const tall = camera.aspect < 1;   // (a phone held upright: closer in, and more from above, to fill the height)
  return { look: { x: house.you.x, y: 0.85, z: house.you.z - (tall ? 1.9 : 1.2) }, dist: tall ? Math.max(7, across(5.4)) : Math.max(8.5, across(8.5)), tilt: tall ? 1.05 : 0.7, yaw: 0 };
}
