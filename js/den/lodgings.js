/* The housing district's door in the den (src/den-houses.ts): a doorway dug into the den's left-hand cliff,
   "Lodgings" on a sign over it, a lantern by it. Walk up to it and Space (or a click on it) opens the
   list of houses there, by owner, as Puzzle Pirates listed an island's houses; knock on one and its
   owner lets you in (house.js). */
import * as THREE from 'three';
import { LODGINGS, atLodgings, houseList } from '../den-houses.js';
import { $, scene, camera, pirate, canvasTex, mat, mesh, keys, carry, v3 } from './world.js';
import { door, sconce } from './furniture.js';
import { houseEnter, house } from './house.js';

// ---------- the doorway ----------
const g = new THREE.Group();
g.position.set(LODGINGS.x - 0.35 * LODGINGS.face, 0, LODGINGS.z);
g.rotation.y = Math.PI / 2 * LODGINGS.face;
const entry = door({ w: 1.2, h: 2.3, frameCol: '#6b5d52' });
g.add(entry.g);
// (dark rock round it, so it reads as dug into the cliff)
const rockM = mat('#4f443d', { flatShading: true });
for (const [x, y, s] of [[-1.25, 1.2, 0.9], [1.3, 1.0, 0.95], [0, 3.0, 1.1], [-1.1, 2.7, 0.8], [1.2, 2.8, 0.85]]) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); r.position.set(x, y, -0.45); r.scale.z = 0.6; g.add(r);
}
const sign = mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshStandardMaterial({ map: canvasTex(256, 72, (c, W, H) => {
  c.fillStyle = '#6a4424'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#3a2410'; c.lineWidth = 5; c.strokeRect(3, 3, W - 6, H - 6);
  c.fillStyle = '#f2d89a'; c.font = '700 40px Alegreya, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(LODGINGS.name, W / 2, H / 2 + 2);
}), roughness: 0.8 }), false);
sign.position.set(0, 2.78, 0.2);
g.add(sign);
const lamp = sconce({ y: 1.85 });
lamp.g.position.set(0.95, 0, 0.16);
g.add(lamp.g);
const glow = new THREE.PointLight('#ffb35a', 5, 6, 1.6);
glow.position.set(0.95, 2.1, 0.6);
g.add(glow);
scene.add(g);

// ---------- the list of houses ----------
const panel = document.createElement('div');
panel.className = 'crew lodgings'; panel.id = 'lodgings';
panel.innerHTML = '<div><h2>Lodgings</h2><p>Whose house?</p><div class="house-list" id="house-list"></div><button class="link" id="lodgings-close">Not now</button></div>';
document.body.append(panel);
const label = document.createElement('div');
label.className = 'label deck';
label.innerHTML = `${LODGINGS.name}<small>Space or click: whose house?</small>`;
/** Is the list open? */
export const lodgings = { open: false };
export function lodgingsOpen(on = true) {
  lodgings.open = on;
  keys.clear();
  panel.classList.toggle('on', on);
  entry.open(on ? 0.35 : 0);
  if (!on) return;
  $('house-list').replaceChildren(...houseList().map((h) => {
    const b = document.createElement('button');
    b.className = 'house-row';
    b.innerHTML = `<b>${h.owner}</b><span>${h.name} <i>(${h.kind.toLowerCase()})</i></span><small>${h.blurb}</small><em>Knock</em>`;
    b.onclick = () => { lodgingsOpen(false); knock(h.id); };
    return b;
  }));
  $('house-list').querySelector('button')?.focus();
}
$('lodgings-close').onclick = () => lodgingsOpen(false);
/** Knocking: the door opens, and in you go (its owner's always home). */
export function knock(id) {
  entry.open(1);
  setTimeout(() => entry.open(0), 1200);
  houseEnter(id);
}
/** Close enough to knock (on the den's floor, empty-handed). */
export const nearLodgings = () => !carry && pirate.h < 0.3 && !house.on && atLodgings(pirate.x, pirate.z);
/** Keys while the list is open: Esc shuts it. True: it took the key. */
export function lodgingsKey(key) {
  if (!lodgings.open) return false;
  if (key === 'escape') lodgingsOpen(false);
  return true;
}
/** Each tick: the door's swing, its lamp, and its label when you're by it. */
export function lodgingsTick(dt) {
  entry.tick(dt); lamp.tick(dt);
  const near = nearLodgings() && !lodgings.open;
  if (!label.isConnected) $('labels').append(label);
  if (!near) { label.style.display = 'none'; return; }
  v3.set(LODGINGS.x, 3.3, LODGINGS.z).project(camera);
  const half = label.offsetWidth / 2 + 10;
  label.style.left = `${Math.max(half, Math.min(innerWidth - half, (v3.x + 1) / 2 * innerWidth))}px`;
  label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  label.style.display = v3.z > 1 ? 'none' : '';
}
