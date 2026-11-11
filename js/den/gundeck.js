// The gun tower, and Gunnery on it; and Gunnery's look, for any board that plays it (the sloop's deck
// at sea too: js/den/sea-guns.js). The puzzle itself, its rules, is src/gunnery.ts: one copy of it
// (the user, 10 Nov: "there should be one copy of the gunning puzzle ... there can be a few wrappers
// with some of the different visual elements around it"). (Split out of den.js.)
import * as THREE from 'three';
import { GUNNERY, Gunnery, KINDS, DR, DC, gunSq } from '../gunnery.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { dyeHex } from '../den-look.js';
import { C, S, k, rand, $, denLook, scene, camera, mat, mesh, canvasTex, woodTex, WOOD, outline, flagpole, pirate, carry, G, raiders, shake, burst, tween, v3, worldLets } from './world.js';
import { den, ramp, frameMat, heightAt, onRampart } from './land.js';
import { wall, X, holeX } from './wall.js';
import { cannon, hit } from './raids.js';
import { CREW_COLOURS, net, online, guest, isHost, myId, send, say, r2 } from './crew.js';

// ---------- the gun tower (after Gunnery) ----------
/* The rampart's last job: a gun tower, a big square platform jutting out from the wall over the
   gate, like a bastion, as big as a Gunnery board: one square of a carpentry piece is one square of
   the board. It's built in three frames laid on the den floor and hauled up and out over the wall
   one after another; you walk out onto it from the wall-walk. On it, Gunnery, kept as close to the
   puzzle as we can, so a Puzzle Pirates hand knows it at a glance.
   The rules (src/gunnery.ts):
   - A powder barrel in the middle rolls out the stores (powder, wad, shot and buckets), each way
     round in turn, till there are two of each on deck. Use one and another comes out.
   - A store rolls straight on. Blocked (a crate, a gun, the barrel, the gunwale, a pirate standing
     there), it turns right; left if it can't; back if neither. Two that meet both turn back.
   - Chalk arrows steer them: a store rolling onto one turns the way it points. Three each; chalk a
     fourth and your oldest is rubbed out.
   - Four guns lie across the deck as in Gunnery, two down each side, muzzle out, with a lane between
     the muzzle and the gunwale. Stores go in at the muzzle, and only off an arrow in the lane
     pointing into it; otherwise the gun's just in the way. Powder, wad, then shot. Loaded, it's run
     out over the lane through its port and swung round on it to aim, forwards at the raiders coming
     in and their cannon, or back along the wall at those hacking at it; it fires and the recoil
     brings it back in. Then it wants a bucket to swab it; the wrong store fouls it, and a bucket
     cleans that too.
   - Crates lashed about the deck make the board: the middle round the barrel kept clear, more out
     towards the edges, making pockets to trap a store in and loops that bring stores back past a
     gun. Each new board is tried out (stores rolling with no arrows) so a couple of guns sit on a
     loop of their own and the rest take more work, as on a good Gunnery board. */
export const GD = {
  // Gunnery's board (src/gunnery.ts): 13 by 13, the barrel in the middle; its beat, stores, arrows,
  // crates and guns.
  cols: GUNNERY.COLS, rows: GUNNERY.ROWS, tick: GUNNERY.TICK, each: GUNNERY.EACH, emit: GUNNERY.EMIT, arrows: GUNNERY.ARROWS, crates: GUNNERY.CRATES,
  guns: GUNNERY.GUNS,
  parts: [4, 5, 4],   // the tower's frames, rows in each, from the wall out (more or less: see gunShape)
};
export const GUN_FRAME_Z = 0.6;   // the tower's frames are laid on the floor right up against the gate
export { gunSq };
// What each gun shows: its look, the words, and the store it wants next.
const GUN_SAYS = {
  empty: ['', 'Powder', 'powder'], powder: ['', 'Wad', 'wad'], wad: ['', 'Shot', 'shot'], loaded: ['done', 'Loaded!', ''],
  dirty: ['weak', 'Swab it', 'bucket'], fouled: ['bad', 'Fouled!', 'bucket'],
};
// Little pictures of the stores, for the labels and the key.
const STORE_ICON = {
  powder: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10.5" r="7.5" fill="#c42d1f" stroke="#5a0f08" stroke-width=".8"/><path d="M10 4.5c2.5 3 3.5 4.5 2 7.5 1.5-.5 2-1.5 2-2.5 1 2.5-.5 5.5-4 5.5s-5-3-3.5-6c0 1.5.8 2.3 1.6 2.5-1.2-2.6.6-4.8 1.9-7z" fill="#ffb21a"/></svg>',
  wad: '<svg viewBox="0 0 20 20"><g fill="#f1ede4" stroke="#8a8478" stroke-width=".8"><circle cx="7" cy="12" r="4.5"/><circle cx="13" cy="12" r="4.5"/><circle cx="10" cy="7.5" r="4.5"/></g></svg>',
  shot: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="#6b7178" stroke="#30343a" stroke-width=".8"/><circle cx="7.5" cy="7.5" r="2.2" fill="#d6dbe0"/></svg>',
  bucket: '<svg viewBox="0 0 20 20"><path d="M4 7.5C4 1 16 1 16 7.5" fill="none" stroke="#1a1208" stroke-width="1.3"/><path d="M11.5 7.5l5-6" stroke="#1a1208" stroke-width="2.2" stroke-linecap="round"/><path d="M11.5 7.5l5-6" stroke="#a86c32" stroke-width="1" stroke-linecap="round"/><path d="M3 7.5h14l-2 10.5H5z" fill="#dfe5e9" stroke="#1a1208" stroke-width=".9" stroke-linejoin="round"/><ellipse cx="10" cy="7.5" rx="7" ry="2" fill="#2f86d6" stroke="#1a1208" stroke-width=".8"/></svg>',
};
const STORE_NAME = { powder: 'Powder', wad: 'Wad', shot: 'Shot', bucket: 'Bucket' };
$('gunhelp').innerHTML = `<h3>Load each gun</h3>${['powder', 'wad', 'shot'].map((kd, i) => `${i + 1}. ${STORE_ICON[kd]}${STORE_NAME[kd]}<br>`).join('')}Fired or fouled? ${STORE_ICON.bucket}Bucket<small>Stores go in at a gun's muzzle, off an arrow in front of it pointing in.</small>`;
export let gd = null;
// The tower, centred on the gate and jutting out from the wall's face.
export const gunX0 = () => X(wall.gateCols.c0) + ((wall.gateCols.c1 - wall.gateCols.c0 + 1) - GD.cols) * S / 2;
export const gunZ0 = () => -0.85 - GD.rows * S;
// Its frames, from the wall out: the first row of each, on the board.
export const partR0 = (part) => GD.rows - GD.parts.slice(0, part + 1).reduce((a, b) => a + b, 0);
/* Each part of the tower must fill exactly, with room for the rare pieces. The whole board is 169
   squares, not a whole number of pieces, so two squares come off each back corner, against the wall
   (165). And where two parts meet, the one nearer the wall gives three single squares of its edge
   row to the next: that makes each part whole pieces, and the frames lock together with squares
   jutting out, where an X or a W fits. (Square 13-wide strips, the front one 3 rows of 39 squares,
   could never be filled exactly at all.) `give[i]`: the columns part i hands on. Read back from the
   parts already laid, for a pirate who took over running the den partway. */
const GUN_NOTCH = new Set(['12,0', '12,1', '12,11', '12,12']);
function gunPlan() {
  if (ramp.gunPlan) return ramp.gunPlan;
  const laid = (p) => ramp.jobs.find((j) => j.kind === 'gun' && j.part === p)?.frame;
  const seen = [0, 1].map((p) => laid(p) && new Set([...Array(GD.cols).keys()].filter((c) => !laid(p).set.has(k(0, c)))));
  const singles = () => { const out = new Set(); while (out.size < 3) { const c = 1 + rand(GD.cols - 2); if (!out.has(c - 1) && !out.has(c + 1)) out.add(c); } return out; };
  for (let t = 0; t < 60; t++) {
    const give = [seen[0] || singles(), seen[1] || singles()];
    if ([0, 1, 2].every((p) => C.solve(partCells(p, give), 1).length)) return (ramp.gunPlan = give);
  }
  return (ramp.gunPlan = [seen[0] || new Set([2, 6, 10]), seen[1] || new Set([2, 6, 10])]);
}
// Part p's squares, its rows counted from its own first row on the board.
function partCells(p, give) {
  const r0 = partR0(p), r1 = r0 + GD.parts[p] - 1, cells = [];
  for (let r = r0; r <= r1 + 1; r++) for (let c = 0; c < GD.cols; c++) {
    if (GUN_NOTCH.has(k(r, c))) continue;
    const mine = r === r0 ? !(p < 2 && give[p].has(c)) : r <= r1 ? true : p > 0 && give[p - 1].has(c);
    if (mine) cells.push([r - r0, c]);
  }
  return cells;
}
export const gunShape = (part) => partCells(part, gunPlan());
export const gdCell = (x, z) => {
  if (!gd) return null;
  const c = Math.floor((x - gd.x0) / S), r = Math.floor((z - gd.z0) / S);
  return gd.cells.has(k(r, c)) ? [r, c] : null;
};
// (The planks' top is 5cm above the height you walk at.)
const gdAt = (r, c, y = 0) => gd.at(r, c, y);
/* A board's look goes on the puzzle (a Gunnery from src/gunnery.ts) as it's played: each board has a
   `group` it's drawn in and `at(r, c, y)`, the middle of a square in that group. The gun tower's is
   `gd`; the sloop's deck has another (js/den/sea-guns.js). */
const bWorld = (b, r, c, y = 0) => b.group.localToWorld(b.at(r, c, y));
/* Standing on the gun tower, and playing it: walking across it doesn't start Gunnery (the user, 9
   Nov: "you get dragged into puzzles far too easily ... you should have to actively interact with
   something"). Space takes charge of the guns, and then WASD points your chalk instead of walking
   you about (pointChalk); Esc steps back. */
export const atGunDeck = () => !!gd && onRampart() && !!gdCell(pirate.x, pirate.z);
export let gunOn = false;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const gundeckLets = {
  get gd() { return gd; }, set gd(v) { gd = v; },
  get gunOn() { return gunOn; }, set gunOn(v) { gunOn = v; },
};
export const onGunDeck = () => gunOn && atGunDeck();
// Where a gun's carriage sits: run in on its squares, or run out over the lane, its muzzle through
// the port, swung on the port to aim.
function gunPos(g) {
  const yaw = gunBase(g) + g.aim, fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const pivot = gdAt(...g.port).add(new THREE.Vector3(DC[g.d], 0, DR[g.d]).multiplyScalar(S * 0.4));
  return gdAt(...gunSq(g, 2)).lerp(pivot.sub(fwd.multiplyScalar(0.3)), g.slide);
}
// Where you can't walk or chalk: a crate, the barrel, a gun.
const gdSolid = (r, c) => gd.solid(r, c);
export function deckBlocks(x, z) {
  if (!gd) return false;
  return [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].some(([a, b]) => { const cell = gdCell(x + a * 0.17, z + b * 0.17); return cell && gdSolid(...cell); });
}

// ----- the look of it: Gunnery's, in the round -----
// Bold black outlines round everything on the board, as Gunnery draws it: readable before pretty.
const inkMat = new THREE.MeshBasicMaterial({ color: '#160d06', side: THREE.BackSide });
function ink(g, t = 0.022) {
  const list = [];
  g.traverse((m) => { if (m.isMesh && !m.userData.ink && m.geometry.type !== 'CircleGeometry') list.push(m); });
  for (const m of list) {
    m.geometry.computeBoundingSphere();
    const { radius, center } = m.geometry.boundingSphere, f = t / radius, h = new THREE.Mesh(m.geometry, inkMat);
    h.userData.ink = true;
    h.scale.setScalar(1 + f);
    h.position.copy(center).multiplyScalar(-f);
    m.add(h);
  }
  return g;
}
// The tower's deck once it's up: still the pieces you laid, each its own shade of timber, but all
// toned down close to Gunnery's deck brown, so the stores, crates and arrows stand out on it.
const DECK_BROWN = '#94704f';
const deckMats = {};
const deckMat = (l) => (deckMats[l] ||= mat(new THREE.Color(WOOD[l] || DECK_BROWN).lerp(new THREE.Color(DECK_BROWN), 0.72), { map: woodTex, roughness: 0.9 }));
const powderTex = (() => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const x = cv.getContext('2d');
  x.fillStyle = '#c42d1f';
  x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#ffb21a';
  x.beginPath();
  x.moveTo(32, 8); x.bezierCurveTo(44, 22, 48, 30, 41, 44); x.bezierCurveTo(47, 42, 49, 37, 49, 32); x.bezierCurveTo(55, 44, 47, 58, 32, 58);
  x.bezierCurveTo(17, 58, 10, 45, 17, 33); x.bezierCurveTo(17, 40, 21, 44, 25, 45); x.bezierCurveTo(19, 33, 26, 20, 32, 8);
  x.fill();
  x.fillStyle = '#ffe36b';
  x.beginPath(); x.ellipse(32, 46, 6, 9, 0, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
// Gunnery's bucket, drawn flat: a tin pail seen from a little above, blue water in it, its handle
// up and the swab standing in it, all with a bold dark outline.
const bucketTex = canvasTex(128, 128, (x) => {
  const ink = '#1a1208';
  x.lineCap = x.lineJoin = 'round';
  const line = (w, c, f) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); f(); x.stroke(); };
  // The handle, behind.
  const handle = () => { x.moveTo(24, 46); x.bezierCurveTo(26, 2, 102, 2, 104, 46); };
  line(9, ink, handle); line(4, '#8d99a3', handle);
  // The swab's staff, standing up out of it.
  const staff = () => { x.moveTo(74, 46); x.lineTo(108, 6); };
  line(14, ink, staff); line(7, '#a86c32', staff);
  // The pail.
  const body = () => { x.moveTo(20, 46); x.lineTo(34, 116); x.quadraticCurveTo(64, 126, 94, 116); x.lineTo(108, 46); x.closePath(); };
  const tin = x.createLinearGradient(20, 0, 108, 0);
  tin.addColorStop(0, '#8a96a0'); tin.addColorStop(0.3, '#ffffff'); tin.addColorStop(0.65, '#d3dae0'); tin.addColorStop(1, '#78838d');
  x.beginPath(); body(); x.fillStyle = tin; x.fill();
  line(6, ink, body);
  for (const y of [72, 100]) line(4, '#4b5560', () => { x.moveTo(24 + (y - 46) * 0.2, y); x.quadraticCurveTo(64, y + 9, 104 - (y - 46) * 0.2, y); });
  // Its rim and the water in it.
  const ell = (rx, ry, fill) => { x.beginPath(); x.ellipse(64, 46, rx, ry, 0, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
  ell(47, 15, ink); ell(42, 11.5, '#eef2f5');
  const water = x.createLinearGradient(0, 38, 0, 54);
  water.addColorStop(0, '#2f86d6'); water.addColorStop(1, '#8fd0f6');
  ell(35, 8, water);
  line(3, 'rgba(255,255,255,0.85)', () => x.ellipse(56, 46, 18, 3.5, 0, Math.PI * 1.1, Math.PI * 1.7));
  // The staff where it goes into the water, in front.
  const dip = () => { x.moveTo(74, 46); x.lineTo(84, 34); };
  line(14, ink, dip); line(7, '#a86c32', dip);
});
// A soft glow under each store, so it shines out from the deck.
const glowTex = canvasTex(64, 64, (x) => {
  const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.55, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
});
const glowGeo = new THREE.PlaneGeometry(S * 1.05, S * 1.05).rotateX(-Math.PI / 2);
const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, toneMapped: false, fog: false });
function storeMesh(kind) {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  g.userData.body = body;
  if (kind === 'shot') {
    body.add(mesh(new THREE.SphereGeometry(0.2, 20, 14), mat('#8d969f', { metalness: 0.55, roughness: 0.3 })));
    body.position.y = 0.2;
  } else if (kind === 'powder') {
    // A round red bag of powder, with the flame on it.
    const bag = mesh(new THREE.SphereGeometry(0.2, 18, 12), mat('#c42d1f', { roughness: 0.8 }));
    bag.scale.y = 0.72;
    const badge = mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshStandardMaterial({ map: powderTex, roughness: 0.8 }));
    badge.rotation.x = -Math.PI / 2;
    badge.position.y = 0.146;
    const neck = mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 14), mat('#5a0f08'));
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, 0.11, 0.13);
    body.add(bag, badge);
    body.position.y = 0.145;
  } else if (kind === 'wad') {
    // A puff of old rag and oakum.
    const wm = mat('#f1ede4', { roughness: 1 });
    for (const [x, y, z, r] of [[0, 0.12, 0, 0.14], [0.11, 0.1, 0.05, 0.11], [-0.11, 0.1, 0.05, 0.11], [0.02, 0.1, -0.12, 0.11], [0, 0.22, 0.02, 0.1], [-0.07, 0.09, -0.09, 0.1], [0.08, 0.09, -0.07, 0.09]]) {
      const s = mesh(new THREE.IcosahedronGeometry(r, 1), wm);
      s.position.set(x, y, z);
      body.add(s);
    }
  } else {
    // A bucket of water and a swab to clean the gun out, drawn flat as in Gunnery.
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bucketTex, toneMapped: false, fog: false }));
    sp.scale.set(0.5, 0.5, 1);
    sp.position.y = 0.23;
    body.add(sp);
  }
  // Lit from within a little, so the colours stay bold whatever the light.
  body.traverse((m) => {
    if (!m.isMesh || !m.material.isMeshStandardMaterial) return;
    m.material.emissive.copy(m.material.color);
    m.material.emissiveIntensity = 0.35;
    if (m.material.map) m.material.emissiveMap = m.material.map;
  });
  body.scale.setScalar(1.15);
  body.position.y *= 1.15;
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.userData.ink = true;
  glow.position.y = 0.006;
  g.add(glow);
  return ink(g, 0.03);
}
const arrowGeo = (pts) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  geo.rotateX(-Math.PI / 2);   // lying on the planks, pointing north (-z)
  return geo;
};
const arrowOut = arrowGeo([[-0.1, -0.245], [0.1, -0.245], [0.1, 0], [0.245, 0], [0, 0.265], [-0.245, 0], [-0.1, 0]]);
const arrowIn = arrowGeo([[-0.055, -0.2], [0.055, -0.2], [0.055, 0.045], [0.15, 0.045], [0, 0.2], [-0.15, 0.045], [-0.055, 0.045]]);
// As in Gunnery: a bold yellow arrow with a dark edge, on a square lit up yellow underneath. A
// crewmate's is in their own colour.
const arrowTile = new THREE.PlaneGeometry(S * 0.94, S * 0.94).rotateX(-Math.PI / 2);
function arrowMesh(col = '#ffd23a', opacity = 1) {
  const g = new THREE.Group(), o = { transparent: true, depthWrite: false, toneMapped: false, fog: false };   // (true colours, not washed out by the light or the haze)
  const tile = new THREE.Mesh(arrowTile, new THREE.MeshBasicMaterial({ color: col, opacity: 0.55 * opacity, ...o }));
  const out = new THREE.Mesh(arrowOut, new THREE.MeshBasicMaterial({ color: '#2a1a06', opacity, ...o }));
  const inn = new THREE.Mesh(arrowIn, new THREE.MeshBasicMaterial({ color: col, opacity, ...o }));
  out.position.y = 0.004;
  inn.position.y = 0.008;
  out.renderOrder = 1; inn.renderOrder = 2;
  g.add(tile, out, inn);
  return g;
}
// A gun as Gunnery draws it: a long bright iron barrel lying on the deck, three squares long, on a
// low carriage. Muzzle to the north; centred on its middle square.
export function gunMesh() {
  const g = new THREE.Group();
  const iron = mat('#b4bcc4', { metalness: 0.65, roughness: 0.3 }), dark = mat('#3a3f45', { metalness: 0.6, roughness: 0.4 });
  const wood = mat('#5b3a20', { map: woodTex });
  const bed = mesh(new RoundedBoxGeometry(0.44, 0.1, 1.2, 2, 0.03), wood);
  bed.position.set(0, 0.06, 0.1);
  g.add(bed);
  [-1, 1].forEach((sx) => [-0.35, 0.5].forEach((z) => { const w = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), wood); w.rotation.z = Math.PI / 2; w.position.set(0.24 * sx, 0.09, z); g.add(w); }));
  const tube = mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.5, 22), iron);
  tube.rotation.x = -Math.PI / 2;   // its narrow end, the muzzle, to the north
  tube.position.set(0, 0.3, 0);
  g.add(tube);
  // Reinforcing rings, the muzzle's swell, and the breech knob at the inner end.
  [[-0.72, 0.19, 0.035], [-0.2, 0.2, 0.025], [0.3, 0.215, 0.03], [0.72, 0.225, 0.04]].forEach(([z, r, t]) => { const ring = mesh(new THREE.TorusGeometry(r, t, 8, 24), iron); ring.position.set(0, 0.3, z); g.add(ring); });
  const mouth = mesh(new THREE.CircleGeometry(0.11, 16), mat('#0a0a0a'));
  mouth.position.set(0, 0.3, -0.756);
  mouth.rotation.y = Math.PI;
  const cap = mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), iron);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0.3, 0.75);
  const knob = mesh(new THREE.SphereGeometry(0.075, 10, 8), dark);
  knob.position.set(0, 0.3, 0.98);
  g.add(mouth, cap, knob);
  // An open trough along the top, where you see what's been rammed in (gunLoad).
  const trough = mesh(new RoundedBoxGeometry(0.22, 0.04, 1.3, 2, 0.015), mat('#161210', { roughness: 1 }));
  trough.position.set(0, 0.5, 0);
  g.userData.trough = trough;
  g.add(trough);
  return ink(g, 0.018);
}
/* What's in a gun, there to see as on the Gunnery board: powder rammed in deepest, by the breech,
   then the wad, then the shot by the muzzle, each a little copy of the store that went in. The
   trough goes red when the gun's fouled, and a fired gun smokes until it's swabbed out. */
const LOAD_AT = { powder: 0.46, wad: 0.02, shot: -0.46 }, LOAD_S = 0.72;
const LOADS = { empty: [], dirty: [], powder: ['powder'], wad: ['powder', 'wad'], loaded: ['powder', 'wad', 'shot'] };
function gunLoad(g, dt) {
  if (g.state === 'dirty' && (g.smokeT = (g.smokeT ?? 0) - dt) < 0) {
    g.smokeT = 0.45;
    burst(g.g.localToWorld(new THREE.Vector3(0, 0.32, -0.8)), '#7d7873', 2, 0.5);
  }
  if (g.shown === g.state) return;
  const first = g.shown === undefined;
  g.shown = g.state;
  g.load ||= {};
  const want = LOADS[g.state] ?? Object.keys(g.load);   // fouled: what was in stays in
  for (const kind of ['powder', 'wad', 'shot']) {
    const m = g.load[kind], on = want.includes(kind);
    if (m && !on) { g.g.remove(m); delete g.load[kind]; }
    if (!m && on) {
      const it = storeMesh(kind);
      it.children.filter((o) => o.material === glowMat).forEach((o) => it.remove(o));
      it.position.set(0, 0.47, LOAD_AT[kind]);
      g.g.add(it);
      g.load[kind] = it;
      if (first) it.scale.setScalar(LOAD_S);
      else tween(0.35, (u) => it.scale.setScalar(LOAD_S * (u < 0.7 ? u / 0.7 * 1.25 : 1.25 - (u - 0.7) / 0.3 * 0.25)));
    }
  }
  const tm = g.g.userData.trough.material;
  tm.color.set({ fouled: '#8a1c12', dirty: '#3c3936' }[g.state] || '#161210');
  tm.emissive.set(g.state === 'fouled' ? '#5a0d06' : g.state === 'loaded' ? '#4a3208' : '#000000');
}
// A light-wood crate, as on the Gunnery board, open and full of shot or bundled red stores, or shut.
// The gun tower's paint, shared so it can be changed (paintTower): gunwale, rail, crates.
const towerMat = { gunwale: mat('#a3271c', { roughness: 0.7 }), rail: mat('#d9b23a', { metalness: 0.4, roughness: 0.4 }), crates: mat('#c9a06a', { map: woodTex }) };
const TOWER_OWN = { gunwale: '#a3271c', rail: '#d9b23a', crates: '#c9a06a' };
export function paintTower() {
  for (const kk of ['gunwale', 'rail', 'crates']) {
    const dye = denLook[kk], c = new THREE.Color(TOWER_OWN[kk]);
    // Painted crates keep a little of their wood; the gunwale and rail take the dye as it is.
    if (dye !== 'none') c.set(kk === 'crates' ? c.lerp(new THREE.Color(dyeHex(dye)), 0.75) : dyeHex(dye));
    towerMat[kk].color.copy(c);
  }
}
paintTower();
function crateMesh(i) {
  const g = new THREE.Group();
  const light = towerMat.crates, edge = mat('#6b4426');
  const box = mesh(new THREE.BoxGeometry(0.5, 0.26, 0.5), light);
  box.position.y = 0.13;
  g.add(box);
  // Dark frame round the top, like the board's outlines.
  [[0, 0.24, 0.5, 0.06], [0, -0.24, 0.5, 0.06], [0.24, 0, 0.06, 0.5], [-0.24, 0, 0.06, 0.5]].forEach(([x, z, w, d]) => { const b = mesh(new THREE.BoxGeometry(w, 0.04, d), edge); b.position.set(x, 0.27, z); g.add(b); });
  const fill = i % 3;
  if (fill === 0) {
    const ball = new THREE.SphereGeometry(0.085, 10, 8), m = mat('#8a9097', { metalness: 0.6, roughness: 0.35 });
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) { const b = mesh(ball, m); b.position.set(x, 0.27, z); g.add(b); }
    const top = mesh(ball, m); top.position.set(0, 0.38, 0); g.add(top);
  } else if (fill === 1) {
    // Bottles of rum, red wax on the corks.
    const glass = mat('#2f6b3a', { roughness: 0.2, metalness: 0.1 }), wax = mat('#c42d1f');
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) {
      const b = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), glass); b.position.set(x, 0.3, z);
      const top = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.07, 8), wax); top.position.set(x, 0.41, z);
      g.add(b, top);
    }
  } else {
    [-0.12, 0, 0.12].forEach((x) => { const s = mesh(new THREE.BoxGeometry(0.11, 0.02, 0.44), light); s.position.set(x, 0.265, 0); g.add(s); });
  }
  return ink(g, 0.018);
}
// The powder barrel, on its side in the middle, as on the Gunnery board.
function barrelMesh() {
  const bg = new THREE.Group();
  const keg = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 18), mat('#7a4c28', { map: woodTex }));
  const bulge = mesh(new THREE.SphereGeometry(0.25, 18, 12), mat('#7a4c28', { map: woodTex }));
  bulge.scale.set(1, 0.95, 1);
  [-0.17, 0.17].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.235, 0.02, 6, 24), mat('#2b2b2b', { metalness: 0.6 })); h.rotation.x = Math.PI / 2; h.position.y = y; keg.add(h); });
  const ends = mat('#a3743f', { map: woodTex });
  [-0.25, 0.25].forEach((y) => { const e = mesh(new THREE.CircleGeometry(0.2, 18), ends); e.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; e.position.y = y + Math.sign(y) * 0.002; keg.add(e); });
  keg.add(bulge);
  keg.rotation.set(0, 0, Math.PI / 2);
  const tilt = new THREE.Group();
  tilt.add(keg);
  tilt.rotation.y = 0.5;
  tilt.position.y = 0.24;
  bg.add(ink(tilt, 0.02));
  return bg;
}
/* Gunnery's look on a board (a Gunnery from src/gunnery.ts, with its `group` and `at`): the barrel,
   the guns lying across the deck (a label over each, in `labels`), the cursor and the ghost arrow,
   and the crates once they're set. The gun tower's and her deck's alike. */
export function dressBoard(b, labels = $('labels')) {
  Object.assign(b, { tickT: 0, hover: null, pen: 0, press: null, crateMeshes: [], crateSig: '', arrowMeshes: new Map() });
  const bg = barrelMesh();
  bg.position.copy(b.at(...b.barrel));
  b.group.add(bg);
  for (const g of b.guns) {
    Object.assign(g, { out: false, slide: 0, aim: 0, want: 0, g: gunMesh(), label: document.createElement('div'), sig: '', waitT: 0 });
    g.g.rotation.y = gunBase(g);
    g.g.position.copy(b.at(...gunSq(g, 2)));   // (run in: see gunPos)
    b.group.add(g.g);
    labels.append(g.label);
  }
  // Where the pointer is on the deck: a ring, and a ghost of the arrow a click would chalk.
  b.cursor = outline([[0, 0]], 0, '#ffffff');
  b.cursor.material = new THREE.LineBasicMaterial({ color: '#ffffff' });
  b.cursor.rotation.x = -Math.PI / 2;
  b.cursor.visible = false;
  b.ghost = arrowMesh('#ffd23a', 0.5);
  b.ghost.visible = false;
  b.group.add(b.cursor, b.ghost);
  return b;
}
// The gunwale round a board, red with a gold rail as on a Puzzle Pirates ship, open at the gunports;
// on the side `sill` faces (the tower's back, where it meets the wall-walk) only a low gold sill.
export function gunwale(b, sill = -1) {
  const red = towerMat.gunwale, gold = towerMat.rail;
  const isPort = (r, c, d) => b.guns.some((o) => o.port[0] === r && o.port[1] === c && o.d === d);
  for (let r = 0; r < GD.rows; r++) for (let c = 0; c < GD.cols; c++) for (let d = 0; d < 4; d++) {
    if (!b.cells.has(k(r, c)) || b.cells.has(k(r + DR[d], c + DC[d]))) continue;
    const along = d % 2 === 0, at = b.at(r, c).add(new THREE.Vector3(DC[d] * (S / 2 - 0.05), 0, DR[d] * (S / 2 - 0.05)));
    const piece = (h, y, m, t) => { const bx = mesh(new THREE.BoxGeometry(along ? S + 0.001 : t, h, along ? t : S + 0.001), m); bx.position.copy(at); bx.position.y += y; b.group.add(bx); };
    if (d === sill) { piece(0.05, 0.025, gold, 0.1); continue; }
    if (isPort(r, c, d)) { piece(0.08, 0.04, red, 0.1); continue; }
    piece(0.34, 0.17, red, 0.1);
    piece(0.04, 0.36, gold, 0.13);
  }
}
export function makeGunDeck() {
  if (gd || !ramp) return;
  const x0 = gunX0(), z0 = gunZ0(), cells = new Set();
  for (let r = 0; r < GD.rows; r++) for (let c = 0; c < GD.cols; c++) if (heightAt(x0 + (c + 0.5) * S, z0 + (r + 0.5) * S) > ramp.T - 0.1) cells.add(k(r, c));
  const group = new THREE.Group();
  group.userData.scenery = true;
  den.add(group);
  // The puzzle (src/gunnery.ts), dressed as the tower.
  gd = Object.assign(new Gunnery(cells), {
    x0, z0, group,
    at: (r, c, y = 0) => new THREE.Vector3(x0 + (c + 0.5) * S, ramp.T + 0.05 + y, z0 + (r + 0.5) * S),
    bodies: () => gdBodies(),
    said: towerSaid,
  });
  // The deck's pieces, all one Gunnery brown.
  for (const j of ramp.jobs) {
    if (j.kind !== 'gun') continue;
    j.frame.group.traverse((m) => { if (m.isMesh && m.material !== frameMat) m.material = deckMat(''); });
    for (const pc of j.frame.pieces) pc.group.traverse((m) => { if (m.isMesh) m.material = deckMat(pc.info.letter); });
  }
  dressBoard(gd);
  for (const g of gd.guns) g.g.position.copy(gunPos(g));
  // Legs down to the ground outside, under the tower's front and sides, braced across.
  const legM = mat('#4f321b', { map: woodTex }), w = GD.cols * S, dz = GD.rows * S;
  for (const [x, z] of [[0.2, 0.2], [w / 2, 0.2], [w - 0.2, 0.2], [0.2, dz / 2], [w - 0.2, dz / 2]]) {
    const leg = mesh(new THREE.BoxGeometry(0.26, ramp.T, 0.26), legM);
    leg.position.set(x0 + x, ramp.T / 2, z0 + z);
    group.add(leg);
  }
  for (const [ax, bx] of [[0.2, w / 2], [w / 2, w - 0.2]]) {
    const brace = mesh(new THREE.BoxGeometry(Math.hypot(bx - ax, ramp.T * 0.6), 0.12, 0.1), legM);
    brace.position.set(x0 + (ax + bx) / 2, ramp.T * 0.5, z0 + 0.2);
    brace.rotation.z = Math.atan2(ramp.T * 0.6, bx - ax);
    group.add(brace);
  }
  // The gunwale round the three open sides; a low sill along the back where it meets the wall-walk.
  gunwale(gd, 2);
  // Your Jolly Rogers on its two outer corners.
  for (const x of [x0 + 0.12, x0 + w - 0.12]) {
    const fp = flagpole(2.2);
    fp.position.set(x, ramp.T + 0.05, z0 + 0.12);
    group.add(fp);
  }
  if (!guest()) setCrates(gd, gd.pickCrates());
}
// How stores roll on the tower with no arrows (src/gunnery.ts, Gunnery.loopsOf).
export const loopsOf = (blocked) => gd.loopsOf(blocked);
export function setCrates(b, list) {
  b.crateMeshes.forEach((m) => b.group.remove(m));
  b.setCrates(list);
  b.crateSig = JSON.stringify(list);
  b.crateMeshes = list.map(([r, c], i) => { const m = crateMesh(i); m.position.copy(b.at(r, c)); b.group.add(m); return m; });
}
// Squares with a pirate standing on them: a body's an obstacle too.
function gdBodies() {
  const out = new Set(), add = (x, z, h) => { if (h > ramp.T - 0.3) { const cell = gdCell(x, z); if (cell) out.add(k(...cell)); } };
  add(pirate.x, pirate.z, pirate.h);
  if (online()) for (const mt of net.crew.values()) add(mt.tx ?? 0, mt.tz ?? 0, mt.th ?? 0);
  return out;
}
const storeAt = (r, c) => gd.storeAt(r, c);
// A beat of the puzzle on a board (src/gunnery.ts, Gunnery.tick), and what it looks like: stores
// rolled into a gun go in at its muzzle, it shows what's in it, new ones roll out of the barrel.
export function gunTick(b = gd) {
  for (const g of b.guns) g.inLane = g.slide > 0.05;   // (a gun run out lies across its lane)
  const beat = b.tick(b.bodies?.());
  for (const { gun, was } of beat.loads) {
    burst(bWorld(b, ...gunSq(gun, 1), 0.45), gun.state === 'empty' ? '#9fd0ff' : gun.state === 'fouled' ? '#ff7a5c' : '#f0d9a8', 8, 2);
    b.said?.(gun, was);
  }
  for (const s of beat.gone) dropStore(b, s, true);
  for (const s of beat.added) showStore(b, s);
}
// What the tower says as a gun's loaded or fouled (to the crew too).
function towerSaid(g, was) {
  if (g.state === 'fouled' && was !== 'fouled') say('A gun\'s fouled! Roll a bucket into it', false, true);
  if (g.state === 'loaded') { g.waitT = 0.9; say('Loaded!'); }
}
// A store on the tower's board (a crewmate's game, say: gunIn), and its look.
export function addStore(id, kind, r, c, dir, pr = r, pc = c) { return showStore(gd, gd.addStore(id, kind, r, c, dir, pr, pc)); }
function showStore(b, s) {
  const m = storeMesh(s.kind);
  m.position.copy(b.at(s.pr, s.pc));
  b.group.add(m);
  return Object.assign(s, { m, spin: 0 });
}
function dropStore(b, s, roll = false) {
  const i = b.stores.indexOf(s);
  if (i >= 0) b.stores.splice(i, 1);
  if (!roll) { b.group.remove(s.m); return; }
  // Roll on into the gun's muzzle before it goes.
  const from = b.at(s.pr, s.pc), to = b.at(s.r, s.c, 0.2), grp = b.group;
  tween(GD.tick, (u) => { s.m.position.lerpVectors(from, to, u); s.m.scale.setScalar(1 - 0.7 * u); }, () => grp.remove(s.m));
}
// A loaded gun swings on its carriage to aim, anywhere in an arc round the way it faces, and
// fires by itself: at the raiders at the wall first, then those coming in, then their cannon.
const GUN_ARC = 1.62;   // radians either side of straight out: enough to fire straight ahead
const gunBase = (g) => -g.d * Math.PI / 2;
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// The swing that points gun g at (x, z), or null if that's out of its arc.
function gunSwing(g, x, z) {
  const from = gdAt(...g.port), a = wrapA(Math.atan2(-(x - from.x), -(z - from.z)) - gunBase(g));
  return Math.abs(a) <= GUN_ARC ? a : null;
}
function gunTarget(g, taken = new Set()) {
  const from = gdAt(...g.port);
  let best = null, bd = Infinity;
  for (const r of raiders) {
    if (r.inside || r.gone || r.state === 'down' || !['approach', 'ladder', 'attack', 'hackOut', 'dazed'].includes(r.state) || r.z > -0.9 || r.z < -11) continue;
    if (gunSwing(g, r.x, r.z) === null || r.shotT > performance.now()) continue;   // (another gun's shot is on its way)
    if (taken.has(r) && g.tgt !== r) continue;   // another gun's swinging onto them
    // (Sticking with the one it's already swinging onto, rather than lurching between two.)
    const d = Math.hypot(r.x - from.x, r.z - from.z) + (r.state === 'approach' ? 6 : 0) - (g.tgt === r ? 4 : 0);
    if (d < bd && d < 22) { bd = d; best = r; }
  }
  if (best) {
    // Lead a raider still on the way in: aim where they'll be when the ball comes down.
    let x = best.x, z = best.z;
    if (best.state === 'approach' && best.hole) {
      const dur = 0.5 + Math.hypot(x - from.x, z - from.z) * 0.035, tx = holeX(best.hole) + best.slot - x, tz = -1.15 - z, n = Math.hypot(tx, tz);
      if (n > 0) { const step = Math.min(n, 2.2 * dur); x += tx / n * step; z += tz / n * step; }
    }
    return { x, z, r: best };
  }
  if (cannon.visible && G.phase === 'wave' && (G.aim || (G.cannonShots > 0 && G.cannonT < 12)) && gunSwing(g, cannon.position.x, cannon.position.z) !== null) return { x: cannon.position.x, z: cannon.position.z, cannon: true };
  return null;
}
export function fireGun(i, tx, tz, atCannon) {
  const g = gd.guns[i];
  if (isHost()) send('all', { t: 'gfire', i, x: r2(tx), z: r2(tz), cn: atCannon ? 1 : 0 });
  gd.fired(g);
  // Out of its own muzzle, pointed at the target; the recoil brings it back in.
  g.aim = gunSwing(g, tx, tz) ?? g.aim;
  g.slide = 1;
  g.g.rotation.y = gunBase(g) + g.aim;
  g.g.position.copy(gunPos(g));
  g.g.updateMatrixWorld(true);
  g.out = false;
  const from = g.g.localToWorld(new THREE.Vector3(0, 0.3, -0.85)), to = new THREE.Vector3(tx, 0.4, tz);
  burst(from, '#ffcf6a', 14, 3);
  burst(from, '#cfc6b8', 10, 1.5);
  worldLets.shake = Math.max(shake, 0.25);
  const ball = mesh(new THREE.SphereGeometry(0.17, 12, 10), mat('#3a3f45', { metalness: 0.6 }));
  scene.add(ball);
  const d = from.distanceTo(to), dur = 0.5 + d * 0.035;
  tween(dur, (s) => {
    ball.position.lerpVectors(from, to, s);
    ball.position.y += Math.sin(s * Math.PI) * (1.5 + d * 0.12);
  }, () => {
    scene.remove(ball);
    burst(to, '#ffb85a', 26, 5);
    burst(to, '#7a6a5a', 16, 3.5);
    if (guest()) return;
    if (atCannon) { const spoilt = !!G.aim; G.aim = null; G.cannonT = Math.max(G.cannonT, 25); say(spoilt ? 'A hit on their cannon! Its aim\'s spoilt' : 'A hit on their cannon! It\'s quiet for a while'); return; }
    let n = 0;
    for (const r of raiders) if (!r.inside && r.state !== 'down' && !r.gone && Math.hypot(r.x - tx, r.z - tz) < 1.8) { hit(r, from, '#3a3a3a'); n++; }
    if (n > 1) say(`Broadside! ${n} Vikings bowled over`);
  });
}
export function updateGunDeck(dt) {
  if (!gd) return;
  if (!guest()) {
    gd.tickT += dt / GD.tick;
    if (gd.tickT >= 1) { gd.tickT = Math.min(gd.tickT - 1, 0.5); gunTick(); }
    // A loaded gun with something to fire at is run out over its lane (once the lane's clear) and
    // swung onto the target; it fires once it's on.
    // Guns already onto a raider keep them; the rest pick from who's left, so two guns don't both
    // run out at one raider and one then haul back in.
    const taken = new Set();
    gd.guns.forEach((g) => { if (g.state !== 'loaded') g.tgt = null; else if (g.tgt) taken.add(g.tgt); });
    const order = gd.guns.map((g, i) => i).sort((a, b) => !!gd.guns[b].tgt - !!gd.guns[a].tgt);
    order.forEach((i) => {
      const g = gd.guns[i];
      if (g.state !== 'loaded') return;
      if (g.tgt) taken.delete(g.tgt);
      const t = gunTarget(g, taken);
      g.tgt = t?.r || null;
      if (g.tgt) taken.add(g.tgt);
      g.out = !!t && (g.out || !storeAt(...g.port));
      g.want = t ? gunSwing(g, t.x, t.z) : 0;
      if ((g.waitT -= dt) > 0 || !t || Math.abs(g.aim - g.want) > 0.06 || g.slide < 1) return;
      if (t.r) t.r.shotT = performance.now() + 2500;
      g.tgt = null;
      fireGun(i, t.x, t.z, t.cannon);
    });
  } else gd.tickT = Math.min(1, gd.tickT + dt / GD.tick);
  drawBoard(gd, dt, gd.hover && onGunDeck() && !carry);
  for (const g of gd.guns) {
    // Hauled out slowly by the crew, then swung onto its target; the recoil throws it back in fast,
    // and it's swung back square to be loaded again.
    g.slide = g.out ? Math.min(1, g.slide + dt * 1.6) : Math.max(0, g.slide - dt * 5);
    const want = !g.out ? 0 : g.slide > 0.95 ? g.want ?? 0 : g.aim, rate = g.out ? 1.6 : 3;
    g.aim += Math.max(-dt * rate, Math.min(dt * rate, want - g.aim));
    g.g.rotation.y = gunBase(g) + g.aim;
    g.g.position.copy(gunPos(g));
  }
}
// A board's stores rolling between beats, what's in its guns, and the cursor where you point.
export function drawBoard(b, dt, pointing) {
  const u = Math.min(1, b.tickT);
  for (const s of b.stores) {
    const was = s.m.position.clone();
    s.m.position.lerpVectors(b.at(s.pr, s.pc), b.at(s.r, s.c), u);
    // A bump: up against the store in the way, and back.
    if (s.bump != null) { const bb = Math.sin(u * Math.PI) * (s.bumpA ?? 0.2) * S; s.m.position.x += DC[s.bump] * bb; s.m.position.z += DR[s.bump] * bb; }
    // It swings round to its new way smoothly, not in a snap.
    const face = s.bump != null && u < 0.5 ? s.bump : s.dir;
    s.yaw = s.yaw == null ? -face * Math.PI / 2 : s.yaw + wrapA(-face * Math.PI / 2 - s.yaw) * Math.min(1, dt * 14);
    s.m.rotation.y = s.yaw;
    // Shot rolls; the rest slide with a little jostle.
    const moved = was.distanceTo(s.m.position), body = s.m.userData.body;
    if (s.kind === 'shot') body.rotation.x -= moved / 0.2;
    else body.rotation.z = Math.sin((s.spin += moved * 9)) * 0.08;
  }
  for (const g of b.guns) gunLoad(g, dt);
  b.cursor.visible = b.ghost.visible = false;
  if (pointing && b.hover) {
    const [r, c] = b.hover, at = b.at(r, c, 0.03), a = b.arrows.get(k(r, c));
    if (b.canChalk(r, c)) {
      b.cursor.position.set(at.x - S / 2, at.y, at.z - S / 2);
      b.cursor.visible = true;
      if (!a) { b.ghost.position.copy(at); b.ghost.rotation.y = -b.pen * Math.PI / 2; b.ghost.visible = true; }
    }
  }
}
// What a gun's label says: what it wants next ([class, html]).
export function gunSays(g) {
  const [cls, text, want] = GUN_SAYS[g.state];
  return [`label gun ${cls}`, want ? `<small>${g.state === 'fouled' ? 'Fouled! needs' : g.state === 'dirty' ? 'Fired: needs' : 'needs'}</small>${STORE_ICON[want]}${STORE_NAME[want]}` : text];
}
// Labels over the guns: what each wants next.
export function gunLabels() {
  if (!gd) return;
  for (const g of gd.guns) {
    const [cls, html] = gunSays(g), sig = cls + html;
    if (g.sig !== sig) { g.sig = sig; g.label.className = cls; g.label.innerHTML = html; }
    // Out over its gunport, so it doesn't hide what's in the barrel.
    v3.copy(gdAt(...g.port, 0.5));
    v3.x += DC[g.d] * S * 1.1; v3.z += DR[g.d] * S * 1.1;
    v3.project(camera);
    g.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    g.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    g.label.style.display = v3.z > 1 || pirate.h < 1 ? 'none' : '';   // only once you're up on the wall
  }
}
// Chalking: an arrow on a plank, pointing one of the four ways (src/gunnery.ts, Gunnery.chalk).
export const myArrows = (by = myId(), b = gd) => b.myArrows(by);
export function chalk(r, c, dir, by = myId()) {
  if (!gd || !gd.canChalk(r, c)) return false;
  if (guest() && by === myId()) { send('host', { t: 'chalk', r, c, dir }); return true; }
  gd.chalk(r, c, dir, by, performance.now());
  syncArrows(gd);
  return true;
}
// Chalking on any board: the tower's goes by chalk (it's shared with the crew).
export function chalkOn(b, r, c, dir) {
  if (b === gd) return chalk(r, c, dir);
  if (!b.chalk(r, c, dir, myId(), performance.now())) return false;
  syncArrows(b);
  return true;
}
// A board's arrows drawn as they are in its puzzle.
function syncArrows(b) {
  for (const [kk, v] of b.arrowMeshes) {
    const a = b.arrows.get(kk);
    if (!a || a.dir !== v.dir || a.by !== v.by) { b.group.remove(v.m); b.arrowMeshes.delete(kk); }
  }
  for (const [kk, a] of b.arrows) if (!b.arrowMeshes.has(kk)) putArrow(b, a.r, a.c, a.dir, a.by);
}
function putArrow(b, r, c, dir, by) {
  const ci = by === myId() ? -1 : net.crew.get(by)?.ci ?? -1;
  const m = arrowMesh(ci >= 0 ? CREW_COLOURS[ci] : '#ffd23a');
  m.position.copy(b.at(r, c, 0.02));
  m.rotation.y = -dir * Math.PI / 2;
  b.group.add(m);
  b.arrowMeshes.set(k(r, c), { dir, by, m });
}
const facing = () => {
  const ry = pirate.g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
  return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz < 0 ? 0 : 2);
};
// Space on the deck: an arrow on the plank in front of you, pointing the way you face.
export function chalkAhead() {
  const me = gdCell(pirate.x, pirate.z), d = facing();
  if (!me) return;
  if (!chalk(me[0] + DR[d], me[1] + DC[d], d)) worldLets.shake = 0.15;
}
// Q/E on the deck: turn the arrow in front of you.
export function turnArrowAhead(t) {
  const me = gdCell(pirate.x, pirate.z), d = facing();
  const a = me && gd.arrows.get(k(me[0] + DR[d], me[1] + DC[d]));
  if (a) chalk(a.r, a.c, (a.dir + t) % 4);
}
/* The mouse, as in Gunnery: click a plank to chalk an arrow pointing the way the ghost arrow shows
   (the wheel turns it), or drag from the plank the way you want it to point. Click an arrow to turn
   it a quarter clockwise; the wheel over one turns it too. Right-click rubs one out. */
function screenDir(b, r, c, dx, dy) {
  const p0 = bWorld(b, r, c).project(camera);
  let best = 0, bd = -Infinity;
  for (let d = 0; d < 4; d++) {
    const p = bWorld(b, r + DR[d], c + DC[d]).project(camera), sx = p.x - p0.x, sy = p0.y - p.y, n = Math.hypot(sx, sy) || 1;
    const dot = (sx * dx + sy * dy) / n;
    if (dot > bd) { bd = dot; best = d; }
  }
  return best;
}
export function chalkRelease(x, y, b = gd) {
  const pr = b.press;
  b.press = null;
  if (!pr) return;
  const dx = x - pr.x, dy = y - pr.y, old = b.arrows.get(k(pr.r, pr.c));
  let dir;
  if (Math.hypot(dx, dy) > 14) dir = screenDir(b, pr.r, pr.c, dx, dy);
  else dir = old ? (old.dir + 1) % 4 : b.pen;
  if (old && old.dir === dir) return;
  b.pen = dir;
  if (!chalkOn(b, pr.r, pr.c, dir)) worldLets.shake = 0.15;
}
/* WASD (or the arrows), once you've taken charge of the guns: your pirate stays put and the keys
   point your chalk the way they go on screen (the user, 8 Nov: "WASD should change the direction
   of the arrows, not move the character"). The arrow under the pointer turns, or else the one in
   front of you, and the next one you chalk points that way too. Esc steps back. */
export function pointChalk(dx, dy, b = gd) {
  const me = gdCell(pirate.x, pirate.z), d = facing();
  const at = b.hover || (me && [me[0] + DR[d], me[1] + DC[d]]);
  if (!at) return;
  const dir = screenDir(b, at[0], at[1], dx, dy), a = b.arrows.get(k(...at));
  b.pen = dir;
  if (a && a.dir !== dir && !chalkOn(b, a.r, a.c, dir)) worldLets.shake = 0.15;
}
export function wheelDeck(step, b = gd) {
  b.pen = (b.pen + step + 4) % 4;
  const a = b.hover && b.arrows.get(k(...b.hover));
  if (a) { chalkOn(b, a.r, a.c, (a.dir + step + 4) % 4); b.pen = (a.dir + step + 4) % 4; }
}
export const gunOut = () => gd && {
  s: gd.stores.map((s) => [s.id, KINDS.indexOf(s.kind), s.r, s.c, s.dir]),
  g: gd.guns.map((g) => [g.state, g.out ? 1 : 0, r2(g.want || 0)]),
  a: [...gd.arrows.values()].map((a) => [a.r, a.c, a.dir, a.by]),
  cr: gd.crates,
};
export function gunIn(d) {
  if (!d || !gd) return;
  if (d.cr && JSON.stringify(d.cr) !== gd.crateSig) setCrates(gd, d.cr);
  const seen = new Set(), stepped = new Set();
  for (const [id, ki, r, c, dir] of d.s) {
    seen.add(id);
    const s = gd.stores.find((o) => o.id === id);
    if (!s) { addStore(id, KINDS[ki], r, c, dir); continue; }
    if (s.r !== r || s.c !== c) { s.pr = s.r; s.pc = s.c; s.r = r; s.c = c; s.bump = null; stepped.add(s); }
    else if (dir === (s.dir + 2) % 4) { s.bump = s.dir; stepped.add(s); }
    s.dir = dir;
  }
  // A new beat. The ones that didn't move stay where they are, not jumping back to where they last
  // came from to roll in again.
  if (stepped.size) {
    gd.tickT = 0;
    for (const s of gd.stores) if (!stepped.has(s)) { s.pr = s.r; s.pc = s.c; s.bump = null; }
  }
  for (const s of gd.stores.slice()) if (!seen.has(s.id)) { s.pr = s.r; s.pc = s.c; dropStore(gd, s, true); }
  d.g.forEach(([st, out, want], i) => { const g = gd.guns[i]; if (g) { g.state = st; g.out = !!out; g.want = want || 0; } });
  const was = gd.arrows;
  gd.arrows = new Map(d.a.map(([r, c, dir, by]) => [k(r, c), { r, c, dir, by, t: was.get(k(r, c))?.t ?? performance.now() }]));
  syncArrows(gd);
}
