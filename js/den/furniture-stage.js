/* The catalogue's furniture page's pictures (the user, 14 Nov: "a list of all the furniture and kind of what they
   look like ... a rendering of each"): a still picture of every piece for its card, and a turntable to look one
   over close, drag to turn it round. Each piece the den's own (js/den/furniture/'s registry), so what's seen here
   is what the den draws; its own small renderers, drawing only when something changes (RULES.md, "No looping
   animations": the turntable comes round once when a piece is picked, then stays where it's left).

   pictureOf(entry) → a data URL of the piece, from its front and a little to one side.
   furnitureStage(canvas) → { show(entry) }: the piece on the turntable. */
import * as THREE from 'three';
import { mat } from './materials.js';

const light = (scene) => {
  scene.add(new THREE.HemisphereLight('#ffe6c4', '#3a2616', 1.35));
  const key = new THREE.DirectionalLight('#ffd9a8', 2.0);
  key.position.set(-2.5, 5, 4);
  scene.add(key);
};
/** A piece built with the options the catalogue shows it with. */
const build = (entry) => entry.make({ ...(entry.sample || {}) });
const throwAway = (g) => g.traverse((o) => o.geometry?.dispose());   // (its materials are mostly shared: kept)
/** Puts `cam` to look at all of `g` from (yaw, pitch), filling the view. */
function frameOn(cam, g, yaw, pitch, fill = 1.08) {
  const box = new THREE.Box3().setFromObject(g), sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = THREE.MathUtils.degToRad(cam.fov), r = Math.max(sphere.radius, 0.12);
  const d = (r / Math.sin(Math.min(fov, fov * cam.aspect) / 2)) * fill;
  const c = sphere.center;
  cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * d, c.y + Math.sin(pitch) * d, c.z + Math.cos(yaw) * Math.cos(pitch) * d);
  cam.near = Math.max(0.01, d - r * 2); cam.far = d + r * 4;
  cam.lookAt(c);
  cam.updateProjectionMatrix();
}
/** Which way to look at a piece: a wall's head on, a rug from above, the rest from the front and to one side. */
const viewOf = (entry, g) => {
  if (entry.onWall) return { yaw: 0.35, pitch: 0.12 };
  const s = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  return s.y < 0.1 ? { yaw: 0.5, pitch: 0.85 } : { yaw: 0.6, pitch: 0.32 };
};

let shot = null;
/** A still picture of the piece, `px` square: a data URL. */
export function pictureOf(entry, px = 320) {
  if (!shot) {
    const canvas = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    light(scene);
    shot = { r, scene, cam: new THREE.PerspectiveCamera(30, 1, 0.1, 50) };
  }
  const { r, scene, cam } = shot;
  r.setSize(px, px, false);
  const piece = build(entry);
  scene.add(piece.g);
  const v = viewOf(entry, piece.g);
  frameOn(cam, piece.g, v.yaw, v.pitch);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(piece.g);
  throwAway(piece.g);
  return url;
}

const TURN = { SECS: 2.2, BY: Math.PI * 2 };
export function furnitureStage(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  light(scene);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
  const deck = new THREE.Group();          // the turntable, and the piece on it
  scene.add(deck);
  let piece = null, entry = null, disc = null, wall = null;

  let yaw = 0, from = 0, to = 0, turnT = 1, running = false, last = 0, dragging = false, dragX = 0;
  const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let busy = dragging;
    if (turnT < 1) { turnT = Math.min(1, turnT + dt / TURN.SECS); const e = 1 - Math.pow(1 - turnT, 3); yaw = from + (to - from) * e; busy = true; }
    deck.rotation.y = yaw;
    if (busy) piece?.tick?.(dt);   // (its candles flicker, its sloop sails, only while it's turning)
    fit();
    r.render(scene, cam);
    running = busy;
    if (running) requestAnimationFrame(frame);
  }
  let fitted = '';
  function fit() {
    const w = canvas.clientWidth, h = canvas.clientHeight, key = `${w}x${h}|${entry?.id}`;
    if (!w || !h || !piece || key === fitted) return;
    fitted = key;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    // (framed with the turntable still, from its front: all of it in view as it turns)
    const y0 = deck.rotation.y;
    deck.rotation.y = 0; deck.updateMatrixWorld(true);
    const v = viewOf(entry, piece.g), round = new THREE.Group();
    const box = new THREE.Box3().setFromObject(deck), s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const reach = Math.hypot(s.x, s.z) / 2;   // (as far as it reaches, any way round)
    round.add(new THREE.Mesh(new THREE.BoxGeometry(reach * 2, s.y, reach * 2)));
    round.position.copy(c);
    frameOn(cam, round, entry.onWall ? 0.2 : 0.45, entry.onWall ? 0.1 : Math.max(0.25, v.pitch * 0.8), 1.0);
    round.children[0].geometry.dispose();
    deck.rotation.y = y0;
  }
  new ResizeObserver(() => { fitted = ''; kick(); }).observe(canvas);

  canvas.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX; turnT = 1; canvas.setPointerCapture(e.pointerId); kick(); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; yaw += (e.clientX - dragX) * 0.012; dragX = e.clientX; });
  const drop = () => { dragging = false; };
  canvas.addEventListener('pointerup', drop);
  canvas.addEventListener('pointercancel', drop);

  return {
    /** `e` (a registry entry) on the turntable, coming round once. */
    show(e, { first = false } = {}) {
      if (piece) { deck.remove(piece.g); throwAway(piece.g); }
      if (disc) { deck.remove(disc); disc.geometry.dispose(); disc = null; }
      if (wall) { deck.remove(wall); wall.geometry.dispose(); wall = null; }
      entry = e; piece = build(e);
      deck.add(piece.g);
      const b = new THREE.Box3().setFromObject(piece.g), s = b.getSize(new THREE.Vector3());
      if (e.onWall) {
        // A bit of wall behind it, to hang on.
        wall = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1.2, s.x + 0.6), Math.max(1, b.max.y + 0.3), 0.06), mat('#3a2a1e'));
        wall.position.set(0, wall.geometry.parameters.height / 2, -0.031);
        deck.add(wall);
      } else {
        const rr = Math.max(0.35, Math.hypot(s.x, s.z) / 2 + 0.12);
        disc = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr * 1.03, 0.05, 48), mat('#6b4528'));
        disc.position.y = -0.026;
        deck.add(disc);
      }
      fitted = '';
      if (!first) { from = yaw % (Math.PI * 2); yaw = from; to = from + TURN.BY; turnT = 0; }
      kick();
    },
  };
}
