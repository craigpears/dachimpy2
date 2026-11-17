// What's drawn on the water for a wind and a whirlpool, the den's one look for each, needing nothing of the den but
// what it's made of (materials.js), so any sea can lay them out at its own squares: the den's sea and race
// (sea.js's windLane, whirlpools.js's pool), and the tabletop blockade (cade.js). Pulled out of sea.js and
// whirlpools.js on 17 Nov so the tabletop blockade shares them rather than copying them.
import * as THREE from 'three';
import { mesh, canvasTex } from './materials.js';

/** A lane of wind `n` squares of `cell` long, blowing toward -z as it lies (turn it by -d quarter turns for the way
 *  `d` it blows, clockwise from north): white streaks over a faint blue band, so it reads from afar. Move `tex.offset.y`
 *  by -2.2 a second to race it along. Returns { g, tex }. */
export function windMarks(cell, n) {
  const g = new THREE.Group();
  const tex = canvasTex(64, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = 'rgba(240,250,252,0.95)'; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const x = 6 + Math.random() * 52, y = Math.random() * h, l = 18 + Math.random() * 30; c.lineWidth = 2 + Math.random() * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + l); c.stroke(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, n * 1.5);
  const L = n * cell;
  const m = mesh(new THREE.PlaneGeometry(cell * 0.85, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false, fog: false }), false);
  m.position.y = 0.07; m.renderOrder = 2;
  const band = mesh(new THREE.PlaneGeometry(cell * 0.95, L).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7fd0ea', transparent: true, opacity: 0.18, depthWrite: false, fog: false }), false);
  band.position.y = 0.065; band.renderOrder = 2;
  g.add(m, band);
  return { g, tex };
}

/* A whirlpool's swirl: spiral arms of foam on a darker eye, turned as it turns. */
const swirlTex = (dark) => canvasTex(128, 128, (g, w) => {
  const c = w / 2, grad = g.createRadialGradient(c, c, 2, c, c, c);
  grad.addColorStop(0, dark ? 'rgba(8,30,40,.95)' : 'rgba(20,60,70,.8)');
  grad.addColorStop(0.55, 'rgba(40,110,120,.45)');
  grad.addColorStop(1, 'rgba(60,140,150,0)');
  g.fillStyle = grad; g.fillRect(0, 0, w, w);
  g.strokeStyle = 'rgba(235,250,250,.85)'; g.lineCap = 'round';
  for (let arm = 0; arm < 4; arm++) {
    g.lineWidth = 3.5 - arm * 0.4;
    g.beginPath();
    for (let t = 0; t <= 40; t++) { const a = arm * Math.PI / 2 + t * 0.12, r = 6 + t * 1.35; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    g.stroke();
  }
});

/** A whirlpool's swirl over its four squares of `cell`, lying flat, turning clockwise seen from above as every
 *  whirlpool does (YPPedia): spin it by `userData.speed` a second (`rotation.z`). */
export function swirlMesh(cell) {
  const m = new THREE.MeshBasicMaterial({ map: swirlTex(true), transparent: true, depthWrite: false });
  const o = mesh(new THREE.CircleGeometry(cell * 1.02, 48), m, false);
  o.rotation.x = -Math.PI / 2;
  o.renderOrder = 2;
  o.userData.speed = -1.6;   // (rotation.z up is anticlockwise seen from above: so, down)
  return o;
}
