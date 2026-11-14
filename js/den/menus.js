// The menus: decorating the den, dressing your pirate and your den, and the cheats. (Split out
// of den.js.)
import * as THREE from 'three';
import { afterWave } from '../den-raids.js';
import { dressPirate, familiarTick, cleanLook, randomLook, cleanDen, designOf, DYES, SKIN, HAIR, PARTS, EARRINGS, PIRATES, FLAGS, PATTERNS, DECOR, MAX_DECOR, BIOMES, twoColours, paletteOf, HAND_DYED, BODIES } from '../den-look.js';
import { C, mixedTiling, S, CALM_SECS, k, rand, $, keep, myLook, denLook, scene, camera, mat, mesh, woodTex, wearLook, redrawFlag, designMat, flagpole, pirate, carry, bounds, obstacles, G, keys, raiders, wm, ray, burst, toast, worldLets } from './world.js';
import { ramp, frames, openJob, frameState, stepTop, putFramePiece, finishFrame, HOUSE_PART, HOUSE_Z0, houseXF, paintHouse, startHouse, plotShow, applyBiome } from './land.js';
import { wall, rest, ringOf, updateHole, updateStats, putPiece } from './wall.js';
import { paintTower } from './gundeck.js';
import { putBack, exitWall } from './pieces.js';
import { cannon, ship, SHIP_GONE, boats, raiderOut, startWave } from './raids.js';
import { mapWas, phaseWas, mapLets } from './map.js';
import { cine } from './cine.js';
import { dignityScene } from './dignity.js';
import { DIGNITY } from '../den-dignity.js';
import { LAY } from '../den-sail.js';
import { sail } from './sea.js';
import { CRANE } from '../den-crane.js';
import { craneCheat } from './crane.js';
import { umamiCheat } from './capybara.js';
import { kikkitCheat, penguinsCheat } from './whirlpools.js';
import { lodgingsOpen } from './lodgings.js';
import { tzzCheat } from './balloon-isle.js';
import { heliumCheat } from './helium-isle.js';
import { rumCheat } from './rumrun.js';
import { empireCheat } from './imperial-isle.js';
import { smugglersCheat } from './smugglers.js';
import { raceCheat, raceLineCheat, race } from './race.js';
import { doorCheat } from './door.js';
import { watchStart, watchStop } from './race-watch.js';
import { raceOnline, online as racingOnline } from './race-net.js';
import { cp } from './checkpoint.js';
import { board, sailReset } from './sailing.js';
import { rowToggle } from './wind.js';
import { online, guest, myId, send } from './crew.js';
import { wed, weddingEnter, weddingLeave, plannedSpouse } from './wedding.js';
import { spouse, spouseCheat } from './spouse.js';
import { house, houseLeave, houseEnter } from './house.js';
import { LODGINGS, houseById } from '../den-houses.js';
import { newGame } from '../den.js';

// ---------- decorating the den ----------
/* As in a Puzzle Pirates house: pick something (a Jolly Roger, a banner, a lantern, a rum barrel),
   point where it goes, turn it with the wheel or Q/E, click to put it down; right-click one to take
   it away. Flags and banners fly the design you've drawn up in the flag designer at the time. They
   stay where you put them, game after game, and the crew sees them too. Never in front of the wall
   (that's where you mend it and build) nor on a frame or by the crates. */
export const deco = { on: false, tool: 'flag', rot: 0, at: null, ok: false, ghost: null, ring: null, group: new THREE.Group() };
scene.add(deco.group);
const DECO_Z0 = 7.2;   // nothing in front of this: the mending, the walk frame
function decorMesh(it) {
  const g = new THREE.Group();
  if (it.k === 'flag') g.add(flagpole(2.1, designMat(it.d)));
  else if (it.k === 'banner') {
    const post = mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.2, 8), mat('#5b3a20', { map: woodTex }));
    post.position.y = 1.1;
    const bar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), mat('#5b3a20', { map: woodTex }));
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.1, 0.06);
    const cloth = mesh(new THREE.PlaneGeometry(0.66, 1.03), designMat(it.d, true));
    cloth.position.set(0, 1.56, 0.08);
    const knobs = [-1, 1].map((sx) => { const b = mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 })); b.position.set(0.42 * sx, 2.1, 0.06); return b; });
    g.add(post, bar, cloth, ...knobs);
  } else if (it.k === 'lantern') {
    const post = mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.7, 8), mat('#3a2616', { map: woodTex }));
    post.position.y = 0.85;
    const arm = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.42), mat('#3a2616'));
    arm.position.set(0, 1.66, 0.19);
    const glass = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 6), new THREE.MeshStandardMaterial({ color: '#ffcf6a', emissive: '#ffae35', emissiveIntensity: 1.6 }), false);
    glass.position.set(0, 1.45, 0.36);
    const lid = mesh(new THREE.ConeGeometry(0.14, 0.1, 6), mat('#2b2b2b', { metalness: 0.6 }));
    lid.position.set(0, 1.61, 0.36);
    g.add(post, arm, glass, lid);
  } else {
    const b = mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.75, 16), mat('#7a4c28', { map: woodTex }));
    b.position.y = 0.375;
    const hoop = mat('#2b2b2b', { metalness: 0.6 });
    [0.12, 0.63].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 24), hoop); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); });
    const tap = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
    tap.rotation.x = Math.PI / 2;
    tap.position.set(0, 0.2, 0.36);
    g.add(b, tap);
  }
  g.position.set(it.x, 0, it.z);
  g.rotation.y = it.r * Math.PI / 2;
  return g;
}
const decorR = (it) => (it.k === 'barrel' ? 0.38 : 0.18);
export function rebuildDecor() {
  deco.group.clear();
  for (const it of denLook.decor) if (Math.abs(it.x) < bounds.x + 0.3) deco.group.add(decorMesh(it));
  worldLets.obstacles = obstacles.filter((o) => !o.deco).concat(denLook.decor.map((it) => ({ x: it.x, z: it.z, r: decorR(it), deco: true })));
}
// Is this a good spot? In the den, back from the wall, clear of everything else.
function decoFree(x, z, k) {
  if (Math.abs(x) > bounds.x - 0.1 || z < DECO_Z0 || z > bounds.z1) return false;
  const r = k === 'barrel' ? 0.38 : 0.18;
  if (Math.hypot(x - pirate.x, z - pirate.z) < r + 0.35) return false;
  for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + r + 0.15) return false;
  if (ramp && x < houseXF() + 0.2 && z > HOUSE_Z0 - 0.3) return false;
  for (const f of frames()) {
    const l = f.group.worldToLocal(new THREE.Vector3(x, 0, z));
    if (l.x > -0.4 && l.x < f.b.w * S + 0.4 && l.y < 0.4 && l.y > -f.b.h * S - 0.4 && Math.abs(l.z) < 1) return false;
  }
  return true;
}
export function decoMode(on) {
  deco.on = on;
  $('deco').classList.toggle('on', on);
  $('deco-btn').textContent = on ? 'Done decorating' : 'Decorate';
  $('dock').style.display = on ? 'none' : '';
  if (!on) { if (deco.ghost) deco.group.remove(deco.ghost); deco.ghost = null; if (deco.ring) deco.ring.visible = false; deco.at = null; return; }
  if (carry) putBack();
  if (!deco.ring) {
    deco.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.8, depthWrite: false }));
    scene.add(deco.ring);
  }
  decoBar();
}
function decoBar() {
  const box = $('deco-tools');
  box.replaceChildren(...DECOR.map(([id, name]) => {
    const b = el('button', 'tab' + (deco.tool === id ? ' on' : ''), name);
    b.onclick = () => { deco.tool = id; decoGhost(); decoBar(); };
    return b;
  }));
  $('deco-count').textContent = `${denLook.decor.length} of ${MAX_DECOR} put up`;
}
function decoGhost() {
  if (deco.ghost) deco.group.remove(deco.ghost);
  deco.ghost = null;
  if (!deco.at) return;
  deco.ghost = decorMesh({ k: deco.tool, x: deco.at.x, z: deco.at.z, r: deco.rot, d: designOf(denLook) });
  deco.ghost.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  deco.group.add(deco.ghost);
}
function decoPoint(e) {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null;
  // Lined up on half squares, so things stand in neat rows.
  return { x: Math.round(p.x / (S / 2)) * S / 2, z: Math.round(p.z / (S / 2)) * S / 2 };
}
export function decoMove(e) {
  const at = decoPoint(e);
  deco.at = at;
  if (!at) { decoGhost(); deco.ring.visible = false; return; }
  const near = decoNear(at);
  deco.ok = !near && denLook.decor.length < MAX_DECOR && decoFree(at.x, at.z, deco.tool);
  deco.ring.visible = true;
  deco.ring.position.set(near ? near.x : at.x, 0.03, near ? near.z : at.z);
  deco.ring.material.color.set(near ? '#ffb84a' : deco.ok ? '#7dff7a' : '#ff5a4a');
  if (near) { if (deco.ghost) deco.group.remove(deco.ghost); deco.ghost = null; } else decoGhost();
  $('deco-tip').textContent = near ? 'Right-click to take it down' : !deco.ok ? (denLook.decor.length >= MAX_DECOR ? 'That\'s all there\'s room for: take something down first' : 'Not there: keep clear of the wall, the frames and the crates') : 'Click to put it here · wheel or Q/E turns it';
}
const decoNear = (at) => denLook.decor.find((it) => Math.hypot(it.x - at.x, it.z - at.z) < 0.45);
export function decoClick(e) {
  const at = decoPoint(e);
  if (!at) return;
  const near = decoNear(at);
  if (e.button === 2) {
    if (near) { worldLets.denLook = { ...denLook, decor: denLook.decor.filter((it) => it !== near) }; decoSaved(); }
    return;
  }
  if (e.button !== 0 || near || !decoFree(at.x, at.z, deco.tool) || denLook.decor.length >= MAX_DECOR) return;
  const it = { k: deco.tool, x: at.x, z: at.z, r: deco.rot, ...(deco.tool === 'flag' || deco.tool === 'banner' ? { d: designOf(denLook) } : {}) };
  worldLets.denLook = { ...denLook, decor: [...denLook.decor, it] };
  decoSaved();
  burst(new THREE.Vector3(at.x, 0.3, at.z), '#e8c890', 10, 2);
}
export function decoTurn(d) { deco.rot = (deco.rot + d + 4) % 4; decoGhost(); }
function decoSaved() {
  applyDen(denLook, true);
  decoBar();
  deco.ghost = null;
}
$('deco-done').onclick = () => decoMode(false);
$('deco-flag').onclick = () => { decoMode(false); dressPanel(true, 'den', 'flag'); };

// ---------- dressing your pirate, and your den ----------
/* "Your pirate": a turning preview of your pirate, with what to wear chosen from Puzzle Pirates'
   own tailor in its dyes, a familiar for your shoulder, and the den's flag and house paint. Kept
   in this browser; crewmates see your look, and the den's dress is shared by the crew. */
export const dress = { open: false, tab: 'pirate', r: null, scene: null, cam: null, model: null, yaw: 0.6, drag: null, held: false, edit: null };
/* Whose look the Your pirate panel dresses: yours, or anyone else's handed to it (dressLook: your partner
   of your own at Mischievious's wedding). `get` the look, `set` a new one; `name` to give them a name. */
const yours = { title: 'Your pirate', get: () => myLook, set: (L) => { worldLets.myLook = L; lookChanged(); } };
dress.edit = yours;
function setLook(L) {
  dress.edit.set(L);
  if (dress.edit !== yours && dress.open) { dressModel(); dressRows(); }   // (lookChanged does it for yours)
}
/** The Your pirate panel on someone else's look: `look` to start from, `onChange(look)` each change,
    `onClose()` when it's done; `title`, and `name` (their name, kept on the look as `name`). */
export function dressLook({ title, look, onChange, onClose, name = true }) {
  let cur = { ...look };
  const named = (L, n) => { const N = { ...L }; if (n) N.name = n; else delete N.name; return N; };
  dress.edit = {
    title, name, onClose, get: () => cur,
    set: (L) => { cur = named(L, cur.name); onChange(cur); },   // (the wardrobe's own looks have no name: theirs kept)
    rename: (n) => { cur = named(cur, n); onChange(cur); },
  };
  dressPanel(true, 'pirate', 'pirate');
}
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function dressInit() {
  if (dress.r) return;
  const cv = $('dress-cv');
  dress.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  dress.r.setPixelRatio(Math.min(devicePixelRatio, 2));
  dress.r.toneMapping = THREE.ACESFilmicToneMapping;
  dress.scene = new THREE.Scene();
  dress.scene.add(new THREE.HemisphereLight('#ffe6c4', '#3a2616', 1.3));
  const l = new THREE.DirectionalLight('#ffd9a8', 1.9);
  l.position.set(-2, 4, 3);
  dress.scene.add(l);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), mat('#4a3524'));
  ground.rotation.x = -Math.PI / 2;
  const fp = flagpole(2.1);
  fp.position.set(-0.9, 0, -0.9);
  dress.scene.add(ground, fp);
  dress.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  // Dragged round, your pirate stays where you leave them (the user, 10 Nov: "it keeps rotating. I can't
  // make it stay"): the slow turn stops till the wardrobe's next opened.
  cv.addEventListener('pointerdown', (e) => { dress.drag = e.clientX; dress.held = true; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (dress.drag == null) return; dress.yaw += (e.clientX - dress.drag) * 0.012; dress.drag = e.clientX; });
  cv.addEventListener('pointerup', () => { dress.drag = null; });
  cv.addEventListener('pointercancel', () => { dress.drag = null; });
}
function dressModel() {
  if (dress.model) dress.scene.remove(dress.model.g);
  dress.model = dressPirate(dress.edit.get());
  dress.scene.add(dress.model.g);
}
let dressT = 0;
function dressFrame(now) {
  if (!dress.open) return;
  const dt = Math.min(0.05, (now - (dressT || now)) / 1000);
  dressT = now;
  const cv = $('dress-cv'), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dress.r.getPixelRatio())) { dress.r.setSize(w, h, false); dress.cam.aspect = w / h; dress.cam.updateProjectionMatrix(); }
  const fam = dress.edit.get().fam !== 'none', denMode = dress.mode === 'den';
  // Your den: no pirate, a closer look at your flag.
  dress.model.g.visible = !denMode;
  if (denMode) { dress.cam.position.set(-0.1, 1.75, 2.6); dress.cam.lookAt(-0.35, 1.75, -0.9); }
  else { dress.cam.position.set(fam ? 0.2 : 0, 1.4, 4.5); dress.cam.lookAt(fam ? 0.1 : 0, 1.02, 0); }   // (a familiar's on the left shoulder)
  if (!dress.held) dress.yaw += dt * 0.35;
  dress.model.g.rotation.y = dress.yaw;
  familiarTick(dress.model.fam, dt);
  dress.r.render(dress.scene, dress.cam);
  requestAnimationFrame(dressFrame);
}
export function dressPanel(on, mode = 'pirate', tab = null) {
  dress.open = on;
  if (on) dress.held = false;
  $('dress').classList.toggle('on', on);
  palette(null);
  if (!on) { const E = dress.edit; dress.edit = yours; if (E !== yours) E.onClose?.(); return; }
  if (mode === 'den') dress.edit = yours;
  dress.mode = mode;
  if (tab || !dressTabsFor[mode].some(([id]) => id === dress.tab)) dress.tab = tab || dressTabsFor[mode][0][0];
  $('dress-title').textContent = mode === 'den' ? 'Your den' : dress.edit.title;
  $('dress-rand').style.display = mode === 'den' ? 'none' : '';
  $('crew-btn').style.display = mode === 'den' ? '' : 'none';   // (the crew in Your den, off the top panel: 14 Nov)
  keys.clear();
  dressInit();
  dressModel();
  dressRows();
  dressT = 0;
  requestAnimationFrame(dressFrame);
}
// A colour chooser: the dye swatches in a little pop-up by the swatch you clicked.
function palette(btn, pal, cur, set, none) {
  const box = $('palette');
  box.replaceChildren();
  box.classList.toggle('on', !!btn);
  if (!btn) return;
  const opts = (none ? [['none', none]] : []).concat(Object.keys(pal).map((n) => [n, n]));
  for (const [id, name] of opts) {
    const b = el('button', 'sw' + (id === cur ? ' cur' : '') + (id === 'none' ? ' none' : ''));
    b.title = name;
    b.setAttribute('aria-label', name);
    if (id !== 'none') b.style.background = pal[id];
    b.onclick = () => { palette(null); set(id); };
    box.append(b);
  }
  // (Every colour named: the catalogue's colours page, 14 Nov.)
  if (Object.keys(DYES).every((n) => n in pal)) {
    const a = el('a', 'all', 'Every colour, named');
    a.href = 'catalogue-colours.html'; a.target = '_blank'; a.rel = 'noopener';
    box.append(a);
  }
  const r = btn.getBoundingClientRect(), host = $('dress').firstElementChild.getBoundingClientRect();
  box.style.left = `${Math.max(8, Math.min(host.width - 250, r.left - host.left - 100))}px`;
  box.style.top = `${r.bottom - host.top + 6}px`;
}
// Two panels in one box: Your pirate (looks), and Your den (the user: the pirate's no place for the
// den's things), with the flag, the den itself and the shack.
const dressTabsFor = { pirate: [['pirate', 'Pirate'], ['clothes', 'Clothes'], ['familiar', 'Familiar']], den: [['flag', 'Flag'], ['den', 'Den'], ['house', 'Shack']] };
export function dressRows() {
  const tabs = $('dress-tabs');
  tabs.replaceChildren(...dressTabsFor[dress.mode || 'pirate'].map(([id, name]) => { const b = el('button', 'tab' + (dress.tab === id ? ' on' : ''), name); b.onclick = () => { dress.tab = id; palette(null); dressRows(); }; return b; }));
  const box = $('dress-rows');
  box.replaceChildren();
  const L = dress.edit.get();
  const row = (label) => { const r = el('div', 'drow'); r.append(el('span', 'lab', label)); box.append(r); return r; };
  const chooser = (r, list, cur, set) => {
    const i = Math.max(0, list.findIndex(([id]) => id === cur)), w = el('span', 'pick');
    const prev = el('button', 'arr', '‹'), next = el('button', 'arr', '›');
    prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
    prev.onclick = () => set(list[(i - 1 + list.length) % list.length][0]);
    next.onclick = () => set(list[(i + 1) % list.length][0]);
    w.append(prev, el('b', '', list[i][1]), next);
    r.append(w);
  };
  const swatch = (r, pal, cur, set, title, none) => {
    const b = el('button', 'sw' + (cur === 'none' ? ' none' : ''));
    if (cur !== 'none') b.style.background = pal[cur];
    b.title = `${title}: ${cur === 'none' ? none : cur}`;
    b.setAttribute('aria-label', b.title);
    b.onclick = (e) => { e.stopPropagation(); palette(b, pal, cur, set, none); };
    r.append(b);
  };
  const toggle = (r, on, set) => { const b = el('button', 'tog' + (on ? ' on' : ''), on ? 'Yes' : 'No'); b.onclick = () => set(!on); r.append(b); };
  const look = (k) => (v) => setLook(cleanLook({ ...L, [k]: v }));
  const slot = (label, k) => {
    const r = row(label);
    chooser(r, PARTS[k][L.body], L[k], look(k));
    if (L[k] === 'none' || (k === 'hand' && !HAND_DYED.includes(L.hand))) return;   // (nothing to dye; a tankard's pewter; a bouquet's flowers are dyed)
    swatch(r, paletteOf(L, k), L[k + 'Col'], look(k + 'Col'), k === 'hand' ? 'Flowers' : 'Colour');   // (a monkey's or a squirrel's fur: its natural colours first, then any dye)
    if (twoColours(L, k)) swatch(r, DYES, L[k + 'Col2'], look(k + 'Col2'), 'Second colour');
  };
  if (dress.tab === 'pirate') {
    if (dress.edit.name) {
      const inp = el('input');
      inp.placeholder = 'Their name'; inp.maxLength = 18; inp.value = L.name || '';
      inp.oninput = () => dress.edit.rename(inp.value.replace(/[^a-z0-9 '-]/gi, '').slice(0, 18));
      row('Name').append(inp);
    }
    chooser(row('Pirate'), BODIES, L.body, look('body'));
    if (L.body === 'capy') {
      // (Umami's kind, 14 Nov: his fur's his own, so only what a capybara can wear on his face and ears)
      toggle(row('Eyepatch'), L.patch, look('patch'));
      chooser(row('Earrings'), EARRINGS, L.earring, look('earring'));
      return;
    }
    const sk = row('Skin');
    SKIN.forEach((c, i) => { const b = el('button', 'sw' + (i === L.skin ? ' cur' : '')); b.style.background = c; b.title = 'Skin'; b.setAttribute('aria-label', `Skin ${i + 1}`); b.onclick = () => look('skin')(i); sk.append(b); });
    const hr = row('Hair');
    chooser(hr, PARTS.hair[L.body], L.hair, look('hair'));
    swatch(hr, HAIR, L.hairCol, look('hairCol'), 'Hair colour');
    if (L.body === 'm') chooser(row('Beard'), PARTS.beard.m, L.beard, look('beard'));
    toggle(row('Eyepatch'), L.patch, look('patch'));
    toggle(row('Hook'), L.hook, look('hook'));   // (for the left hand, as Mischievious has)
    toggle(row('Peg leg'), L.pegleg, look('pegleg'));   // (for the right leg, as Tzz has)
    toggle(row('Bare legs'), L.bareLegs, look('bareLegs'));   // (no stockings under a kilt or knickers: Dachimpy's)
    chooser(row('Earrings'), EARRINGS, L.earring, look('earring'));
    toggle(row('Smile'), L.smile, look('smile'));
    toggle(row('Grin'), L.grin, look('grin'));   // (the mouth open, laughing: Tzz's)
    toggle(row('Tongue out'), L.tongue, look('tongue'));   // (Kikkit's, as are the tattoos and the wristband)
    toggle(row('Tattoos'), L.tattoos, look('tattoos'));
    toggle(row('Wristband'), L.wristband, look('wristband'));
    toggle(row('Starfish'), L.starfish, look('starfish'));   // (stuck to the cheek: Gravee's)
  } else if (dress.tab === 'clothes') {
    slot('Hat', 'hat'); slot('Top', 'top'); slot('Waist', 'waist');
    if (L.body !== 'capy') { slot('Legs', 'legs'); slot('Feet', 'feet'); slot('In hand', 'hand'); }   // (a capybara: nothing on his legs or in his paws)
    box.append(el('p', 'note', `Clothes and dyes from the Puzzle Pirates tailor, and everything ${Object.keys(PIRATES).join(' and ')} wear.`));
  } else if (dress.tab === 'familiar') {
    slot('Familiar', 'fam');
    box.append(el('p', 'note', 'A familiar rides on your shoulder. In Puzzle Pirates they were rare prizes.'));
  } else {
    const D = denLook, den = (k) => (v) => { worldLets.denLook = cleanDen({ ...denLook, [k]: v }); applyDen(denLook, true); };
    const decorate = () => {
      const dr = row('Decorate');
      const db = el('button', 'mini', 'Put things up round the den');
      db.onclick = () => { dressPanel(false); decoMode(true); };
      dr.append(db);
    };
    if (dress.tab === 'flag') {
    box.append(el('h3', '', 'Your flag'));
    const fr = row('Emblem');
    chooser(fr, FLAGS, D.flag, den('flag'));
    swatch(fr, DYES, D.flagCol2, den('flagCol2'), 'Emblem');
    const pr0 = row('Cloth');
    chooser(pr0, PATTERNS, D.pat, den('pat'));
    swatch(pr0, DYES, D.flagCol, den('flagCol'), 'Cloth');
    if (D.pat !== 'plain') swatch(pr0, DYES, D.flagCol3, den('flagCol3'), 'Pattern');
    box.append(el('p', 'note', 'Flown over the gate, on the gun tower and on your shack. Flags and banners you put up yourself keep the design they had.'));
    decorate();
    } else if (dress.tab === 'den') {
    box.append(el('h3', '', 'Where it is'));
    chooser(row('Landscape'), BIOMES, D.biome, den('biome'));
    box.append(el('h3', '', 'The gun tower'));
    const tw = row('Gun tower');
    swatch(tw, DYES, D.gunwale, den('gunwale'), 'Gunwale', 'Gunnery red');
    swatch(tw, DYES, D.rail, den('rail'), 'Rail', 'Gunnery gold');
    swatch(tw, DYES, D.crates, den('crates'), 'Crates', 'Light wood');
    tw.append(el('small', '', 'gunwale · rail · crates'));
    decorate();
    } else {
    box.append(el('h3', '', 'Your shack'));
    const hs = ramp?.jobs.filter((j) => j.kind === 'house') || [], building = hs.find((j) => j.frame && !j.up);
    const hr = row('Shack');
    if (hs.length && hs.every((j) => j.up)) hr.append(el('b', 'state', 'Built!'));
    else if (building) hr.append(el('b', 'state', `Building the ${HOUSE_PART[building.part]} (${hs.indexOf(building) + 1} of ${hs.length})`));
    else { const b = el('button', 'mini', 'Start building'); b.onclick = () => { startHouse(); dressPanel(false); }; hr.append(b); }
    const pr = row('Paint');
    swatch(pr, DYES, D.paint, den('paint'), 'Walls', 'Bare wood');
    swatch(pr, DYES, D.roof, den('roof'), 'Roof', 'Bare wood');
    pr.append(el('small', '', 'walls · roof'));
    box.append(el('p', 'note', 'Its plot is marked out in the far left corner: walk in to start it, or to dress it once it\'s up. Built from pieces like everything else: each part laid on the floor, filled, and hoisted into place.'));
    decorate();
    }
  }
}
export function lookChanged() {
  keep('carp.den.look', myLook);
  wearLook(pirate, myLook);
  if (dress.open) { dressModel(); dressRows(); }
  if (online()) send('all', { t: 'look', look: myLook });
}
// The den's dress: the flag every pole flies, and the house's paint. `mine`: chosen here, so kept
// and passed to the crew.
export function applyDen(D, mine = false) {
  worldLets.denLook = D;
  redrawFlag();
  paintHouse();
  paintTower();
  applyBiome();
  rebuildDecor();
  if (!mine) return;
  keep('carp.den.den', denLook);
  if (dress.open) dressRows();
  if (online()) send('all', { t: 'den', den: denLook });
}
$('look-btn').onclick = () => dressPanel(true, 'pirate');
$('den-btn').onclick = () => dressPanel(true, 'den');
$('deco-btn').onclick = (e) => { e.currentTarget.blur(); decoMode(!deco.on); };
$('dress-done').onclick = () => dressPanel(false);
$('dress-rand').onclick = () => setLook(randomLook());
$('crew-btn').addEventListener('click', () => dressPanel(false));   // (crew.js opens the crew's panel)
$('dress').addEventListener('click', (e) => { if (e.target === $('dress')) dressPanel(false); else if (!e.target.closest('#palette')) palette(null); });

/* A shortcut for trying things out (den.html?try=gundeck): the whole rampart and the gun deck
   already built, with the pieces a crew might have used, so you can go straight up and play it. */
export function buildAll(upTo = ramp.jobs.length - 1) {
  for (let i = 0; i <= upTo; i++) {
    const f = openJob(i);
    if (!f) continue;
    fillFrame(f);
    finishFrame(f, true);
  }
  ramp.next = upTo + 1;
}
// Pieces that cover these squares, any that'll do: an exact fit if there is one, else hanging over
// onto a few `spare` squares, grown out from the edge.
export function tileFor(cells, spare) {
  const own = new Set(cells.map(([r, c]) => k(r, c)));
  let sol = mixedTiling(cells) || C.solve(cells, 1)[0];
  for (let n = 1; n <= 4 && !sol; n++) for (let t = 0; t < 40 && !sol; t++) {
    const have = new Set(own), add = [];
    for (let m = 0; m < n; m++) {
      const edge = spare.filter(([r, c]) => !have.has(k(r, c)) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => have.has(k(r + a, c + b))));
      if (!edge.length) break;
      const p = edge[rand(edge.length)];
      have.add(k(p[0], p[1]));
      add.push(p);
    }
    if (add.length === n) sol = mixedTiling(cells.concat(add)) || C.solve(cells.concat(add), 1)[0];
  }
  return (sol || []).map((p) => ({ letter: p.letter, shape: C.normalize(p.cells), dr: Math.min(...p.cells.map((x) => x[0])), dc: Math.min(...p.cells.map((x) => x[1])), over: p.cells.filter(([r, c]) => !own.has(k(r, c))).length }));
}
// Fill what's left of a frame (stairs may only stick up a square above the treads, as by hand).
export function fillFrame(f) {
  frameState(f);
  if (!f.open.length) return true;
  const spare = [];
  for (let r = -1; r <= f.b.h; r++) for (let c = -1; c <= f.b.w; c++) {
    const kk = k(r, c);
    if (!f.set.has(kk) && !f.carp.occupied(r, c) && (f.kind !== 'stair' || r >= stepTop(f, c) - 1)) spare.push([r, c]);
  }
  const ps = tileFor(f.open, spare);
  if (!ps.length) return false;
  for (const i of ps) putFramePiece(f, { ...i, by: myId() });
  frameState(f);
  return true;
}

/* The cheat menu (` or the Cheats button), for trying things out: jump to any stage of the den
   without playing the waves before it, or skip what's in front of you. Playing alone only: with a
   crew, everyone's game would have to follow. */
// [name, the last rampart job already built, waves already beaten off]. Each part's timber comes
// after a wave, as in play: the walk (then the stairs) after wave 1, the gun tower after 2. A stage lands you as its timber arrives.
const STAGES = [['The start', -1, 0], ['The walk', -1, 1], ['Gun tower', 1, 2], ['Everything built', 4, 3]];
export const cheats = { open: false };
export function skipTo(s) {
  const [, upTo, wave] = STAGES[s];
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  newGame();
  if (upTo >= 0) buildAll(upTo);
  if (wave) {
    Object.assign(G, { wave, phase: afterWave(wave), phaseT: CALM_SECS });
    if (wave >= 2) cannon.visible = true;
    if (G.phase === 'peace') { ship.visible = cannon.visible = false; ship.position.x = ship.userData.home + SHIP_GONE + 1; }   // long gone
    if (ramp.jobs[upTo + 1]?.kind !== 'house') openJob(upTo + 1);
    $('intro').classList.add('off');
  }
  updateStats();
  toast(wave ? `Skipped to: ${STAGES[s][0]} (after wave ${wave})` : 'A fresh den');
}
function cheatMend() {
  let n = 0;
  for (const h of wall.holes) {
    if (h.busy) continue;
    if (h.status !== 'open') { if (h.hp < h.maxHp) { h.hp = h.maxHp; h.sig = ''; n++; } continue; }
    const ps = tileFor(rest(h), ringOf(h).filter(([r, c]) => !wall.wood.has(k(r, c))));
    if (!ps.length) continue;
    for (const i of ps) putPiece(h, { ...i, patch: false, layer: 0, by: myId() });
    updateHole(h);
    n++;
  }
  toast(n ? 'The wall\'s mended' : 'Nothing to mend', !n);
}
function cheatBeat() {
  if (G.phase !== 'wave') return toast('No wave on just now', true);
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { toSpawn: 0, aim: null, cannonShots: 0 });   // and it's over on the next frame, timber and all
}
// Plays the siege's end again: the cutscene, the map dropped and picked up.
function cheatMapScene() {
  if (guest()) return toast("Only the crew's host can do that", true);
  if (cine) return;
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { phase: 'peace', map: 'none', wave: Math.max(G.wave, 3), toSpawn: 0, aim: null, cannonShots: 0 });
  mapLets.mapWas = 'none'; mapLets.phaseWas = 'wave';   // (as if the last wave had just been beaten)
}
function cheatShack() {
  const hs = ramp.jobs.filter((j) => j.kind === 'house' && !j.up);
  if (!hs.length) return toast('Your shack\'s already built', true);
  for (const j of hs) { const f = openJob(j.i); fillFrame(f); finishFrame(f, true); }
  plotShow();
  toast('Your shack is built!');
}
// The siege over and their ship gone, and you aboard the old sloop.
function cheatSail() {
  if (sail.on) return toast('Already at sea', true);
  if (wm) exitWall();
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { phase: 'peace', wave: Math.max(G.wave, 3), toSpawn: 0, aim: null, cannonShots: 0 });
  mapLets.phaseWas = 'peace';   // (no cutscene)
  ship.visible = cannon.visible = false; ship.position.x = ship.userData.home + SHIP_GONE + 1;
  sail.seen = true;
  sailReset();
  board();
}
/* Out to sea with her oars already out (?at=rowing), so the front page's Rowing goes straight to it (the user,
   14 Nov: "I clicked it, show me something already"). */
function cheatRowing() {
  if (!sail.on) cheatSail();
  if (!sail.helm.oars) rowToggle();
}
/* Dignity's cutscene at the imperial checkpoint, again (js/den/dignity.js): out to sea first if you're
   not, and the sloop put where the trade wind drops her, facing its gate. */
function cheatDignity() {
  if (cine) return;
  if (!sail.on) cheatSail();
  const h = sail.helm, K = LAY.CHECKPOINT;
  h.stop();
  Object.assign(h, { cur: null, rides: [], turn: [], slot: -1, strokes: [], pose: { c: K.GATE, r: K.ROW - DIGNITY.SPOT, d: 0 } });
  sail.riding = false;
  dignityScene();
}
/* Umami's rescue (js/den/capybara.js): out to sea, the crane up the cliff built at once, and her set
   down in the clifftop lagoon and moored by the far bank, beside him. */
function cheatUmami() {
  if (cine) return;
  if (!sail.on) cheatSail();
  const h = sail.helm;
  h.stop();
  Object.assign(h, { cur: null, rides: [], turn: [], slot: -1, strokes: [], pose: { c: CRANE.LEDGE[0], r: CRANE.LEDGE[1], d: 0 } });   // (in the cove below, by the ledge, for when she's lowered)
  sail.riding = false;
  sail.said.cove = true;
  craneCheat((cells) => tileFor(cells, []));
  umamiCheat();
}
/* Kikkit's island (js/den/whirlpools.js): out to sea, off her island (she rambles as you come up). Her
   whirlpools are right beside it, so one cheat does for both (the user, 11 Nov: "they're not really
   that far apart. They're right next to each other"). */
function cheatKikkit() {
  if (cine) return;
  if (!sail.on) cheatSail();
  kikkitCheat();
}
/* Vegas Island and its penguins (js/den/whirlpools.js), past Kikkit's whirlpools: at sea in the
   penguins' water, as if a Vegas had carried her there, the checkpoint told she's beyond it (she's past
   the reef), as for the smugglers' beach. Its own place, not a spot on Kikkit's island: only a Vegas
   gets there. */
function cheatPenguins() {
  if (cine) return;
  if (!sail.on) cheatSail();
  penguinsCheat();
  cp.check.side = 'far';
}
/* Tzz's island (js/den/balloon-isle.js): out to sea, just off it, where her balloon lesson begins. */
function cheatTzz() {
  if (cine) return;
  if (!sail.on) cheatSail();
  tzzCheat();
}
/* Helium's island (js/den/helium-isle.js), past the checkpoint by the smugglers' rocks: at sea, just off
   it, where their Distilling lesson begins; the checkpoint told she's beyond it, as for Port Decorum. */
function cheatHelium() {
  if (cine) return;
  if (!sail.on) cheatSail();
  heliumCheat();
  cp.check.side = 'far';
}
/* Helium's rum run (js/den/rumrun.js): at sea off their island, their lesson seen and a few casks filled, so
   they ask you along; the checkpoint told she's beyond it, as for Helium's still. */
function cheatRumRun() {
  if (cine) return;
  if (!sail.on) cheatSail();
  rumCheat();
  cp.check.side = 'far';
}
/* Port Decorum, the imperial island (js/den/imperial-isle.js), out past the checkpoint: at sea, just off
   its jetty, and the checkpoint told she's beyond it (else, jumped there, she'd seem to have slipped
   round it by the locks, and Dignity would say so). */
function cheatEmpire() {
  if (cine) return;
  if (!sail.on) cheatSail();
  empireCheat();
  cp.check.side = 'far';
}
/* The smugglers' beach (js/den/smugglers.js), behind Port Decorum: at sea, in its cove, the checkpoint
   told she's beyond it, as for Port Decorum. */
function cheatSmugglers() {
  if (cine) return;
  if (!sail.on) cheatSail();
  smugglersCheat();
  cp.check.side = 'far';
}
/* The sloop race (js/den/race.js), out past Primates Rule: at sea, by its starting buoy, the checkpoint
   told she's beyond it, as for Port Decorum. */
/* At sea by the race's buoy (the starlit door's and the watched race's starting point). */
function toRaceBuoy() {
  if (!sail.on) cheatSail();
  raceCheat();
  cp.check.side = 'far';
}
/* The sloop race (?at=race): straight on to its starting line, the plan beside you (14 Nov). */
function cheatRace() {
  if (cine) return;
  toRaceBuoy();
  raceLineCheat();
}
/* The starlit door (js/den/door.js), on the race course off leg 2: by the race's buoy first, as for the
   race, then stopped under the door's crag, Space to look closer at the rock. */
function cheatDoor() {
  if (cine) return;
  toRaceBuoy();
  doorCheat();
}
/* The sloop race watched (js/den/race-watch.js): four racers and no player in it, a free camera and a
   key to jump between them, each one's board as she plays it. At sea by the race's buoy first, as for
   the race. */
function cheatRaceWatch() {
  if (cine) return;
  toRaceBuoy();
  watchStart();
}
/* Mischievious's wedding (js/den/wedding.js): the siege put to rest and their ship gone, and off to
   her island. */
function cheatWedding() {
  if (cine || wed.on) return;
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  if (carry) putBack();
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { phase: 'peace', wave: Math.max(G.wave, 3), toSpawn: 0, aim: null, cannonShots: 0 });
  mapLets.phaseWas = 'peace';   // (no cutscene)
  ship.visible = cannon.visible = false; ship.position.x = ship.userData.home + SHIP_GONE + 1;
  $('intro').classList.add('off');
  if (sail.on) sailReset();
  sail.seen = true;   // (no "their ship's making sail" while you're away)
  weddingEnter();
}
/* Whoever you married on the Wedding Isle, home with you (spouse.js): the siege put to rest, and you in
   the den beside them. Your spouse if you've one; else whoever the wedding you're planning has you
   marrying, or her. */
function cheatMarried() {
  if (cine) return;
  if (wed.on) weddingLeave();
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  if (carry) putBack();
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { phase: 'peace', wave: Math.max(G.wave, 3), toSpawn: 0, aim: null, cannonShots: 0 });
  mapLets.phaseWas = 'peace';   // (no cutscene)
  ship.visible = cannon.visible = false; ship.position.x = ship.userData.home + SHIP_GONE + 1;
  $('intro').classList.add('off');
  if (sail.on) sailReset();
  sail.seen = true;
  const at = spouseCheat(spouse.who || plannedSpouse());
  wed.had = true;
  Object.assign(pirate, { x: at.x, z: at.z, h: 0, hs: 0, hop: null });
  pirate.g.rotation.set(0, at.yaw, 0);
}
/* The housing district (js/den/lodgings.js): the siege put to rest, and you at its door in the den's
   left-hand cliff, the list of houses open (Gravee's house is a click on it: js/den/house.js). */
function toLodgings() {
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  if (carry) putBack();
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  Object.assign(G, { phase: 'peace', wave: Math.max(G.wave, 3), toSpawn: 0, aim: null, cannonShots: 0 });
  mapLets.phaseWas = 'peace';   // (no cutscene)
  ship.visible = cannon.visible = false; ship.position.x = ship.userData.home + SHIP_GONE + 1;
  $('intro').classList.add('off');
  if (sail.on) sailReset();
  sail.seen = true;
  Object.assign(pirate, { x: LODGINGS.x + 1.05 * LODGINGS.face, z: LODGINGS.z, h: 0, hs: 0, hop: null });
  pirate.g.rotation.set(0, -Math.PI / 2 * LODGINGS.face, 0);
}
function cheatLodgings() {
  if (cine || house.on) return;
  toLodgings();
  lodgingsOpen(true);
}
/* Straight into a friend's house (den.html?at= and its id in HOUSES: ?at=roobear, ?at=gravee), to send them:
   the den as for the housing district, and in through its door. A link, not a cheat button: the district's
   is the one per place (RULES.md, "The cheats jump to what's hard to get to, one per place"). */
function toHouse(id) {
  if (cine || house.on) return;
  toLodgings();
  houseEnter(id);
}
/* [name, what it does, its link's name if it's a starting point (den.html?at=...)], in the menu's
   sections (the user, 12 Nov: "all of the cheats ... can be grouped into sections at this point, and
   it's probably quite a long menu"). Only jumps to what's hard to get to, one per place (the user, 11
   Nov: "these are supposed to help jump you to places that are hard to get to"): no Sailing board of
   its own (go sailing, then R), no Gravee's house beside the housing district (its link the one shared),
   no Kikkit's whirlpools beside her island. */
const CHEAT_SECTIONS = [
  ['At the den', [
    ['Beat this wave', cheatBeat],
    ['Next wave now', () => (G.phase === 'wave' ? toast('A wave\'s on: beat it first', true) : startWave())],
    ['Mend every hole', cheatMend],
    ['Build the shack', cheatShack, 'shack'],
    ["The captain's map scene", cheatMapScene, 'map-scene'],
    ['Home, married', cheatMarried, 'married'],
    ['The housing district', cheatLodgings, 'lodgings'],
  ]],
  ['Out to sea', [
    ['Go sailing', cheatSail, 'sea'],
    ['Rowing her', cheatRowing, 'rowing'],
    ["Dignity's scene", cheatDignity, 'dignity'],
    ["Umami's rescue", cheatUmami, 'umami'],
  ]],
  ['The islands', [
    ['The Wedding Isle', cheatWedding, 'wedding'],
    ["Kikkit's island", cheatKikkit, 'kikkit'],
    ["Vegas Island's penguins", cheatPenguins, 'penguins'],
    ["Tzz's balloon lesson", cheatTzz, 'tzz'],
    ["Helium's still (Distilling)", cheatHelium, 'helium'],
    ["Helium's rum run", cheatRumRun, 'rumrun'],
    ['The imperial island', cheatEmpire, 'imperial'],
    ["The smugglers' beach", cheatSmugglers, 'smugglers'],
  ]],
  ['The sloop race', [
    ['The sloop race', cheatRace, 'race'],
    ['The starlit door', cheatDoor, 'door'],
    ['Watch the sloop race', cheatRaceWatch, 'race-watch'],
  ]],
];
const CHEATS = CHEAT_SECTIONS.flatMap(([, list]) => list);
/* Every starting point has a link, to share (the user, 10 Nov: "make it so that each starting point
   is something that I can put into the URL as well, so that I can share that animation with
   somebody"): den.html?at=dignity, say, opens the den straight into Dignity's scene. Choosing one
   from the cheats puts its link in the address bar, ready to copy. */
const STAGE_AT = ['start', 'walk', 'gun-tower', 'built'];
function linkTo(at) {
  try {
    const u = new URL(location.href);
    u.searchParams.set('at', at);
    history.replaceState(history.state, '', u);
  } catch { /* (no address bar to put it in: never mind) */ }
}
/** Opens the den at the starting point a link names (?at=...): false if there's none by that name. */
export function startAt(at) {
  const s = STAGE_AT.indexOf(at), c = CHEATS.find((x) => x[2] === at);
  if (s >= 0) skipTo(s);
  else if (c) c[1]();
  else if (houseById(at)) toHouse(at);
  else return false;
  return true;
}
export function cheatPanel(on) {
  if (on && online()) { toast('Cheats are for playing alone', true); return; }
  if (on && G.over) return;
  cheats.open = on;
  keys.clear();
  $('cheats').classList.toggle('on', on);
}
/* The menu: each section a heading and its buttons ([name, run, link]); a fresh den's stages first. */
function cheatSection(title, list) {
  const sec = document.createElement('section'), h = document.createElement('h3'), grid = document.createElement('div');
  h.textContent = title;
  grid.className = 'grid';
  grid.replaceChildren(...list.map(([name, run, at]) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (at) b.title = `Link: den.html?at=${at}`;
    b.onclick = () => { cheatPanel(false); watchStop(); if (wed.on && at !== 'wedding') weddingLeave(); if (house.on) houseLeave(); run(); if (at) linkTo(at); };
    return b;
  }));
  sec.append(h, grid);
  return sec;
}
$('cheat-groups').replaceChildren(
  cheatSection('A fresh den, built up to', STAGES.map(([name], i) => [name, () => skipTo(i), STAGE_AT[i]])),
  ...CHEAT_SECTIONS.map(([title, list]) => cheatSection(title, list)),
);
$('cheat-btn').onclick = () => cheatPanel(!cheats.open);
/* Racing online (js/den/race-net.js), a plain way in from the den's top panel (the user, 12 Nov: "I eventually
   found the race online thing. That really was not clear"): out to the race's buoy, as its starting point,
   then in to the line with the open races up. Already in a race's room: its lobby. */
$('race-btn').onclick = (e) => {
  e.currentTarget.blur();
  if (!racingOnline() && !(sail.on && race.rules.state !== 'off')) { cheatRace(); linkTo('race'); }
  raceOnline();
};
$('cheats-close').onclick = () => cheatPanel(false);
