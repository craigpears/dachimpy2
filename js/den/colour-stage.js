/* The catalogue's colours page's little stage (the user, 14 Nov: "some test scene on the right ... a selection of
   distinct furniture and a few pirates that are kind of spinning around, maybe through different outfits that end
   up being dressed in the colour that you've selected"). Three pirates on a turntable on a rug, an armchair, a
   table and a candelabra round them. Pick a colour and each pirate twirls into their next outfit in it (the
   showcase's twirl, src/showcase.ts), the armchair and the rug take it too, and the turntable comes round a third,
   easing to a stop: it moves only when you pick or drag it (RULES.md, "No looping animations").

   The pirates are the wardrobe's (js/den-look.js's dressPirate), the furniture furniture.js's, so what's seen here
   is what the den draws. Its own small renderer on the page's canvas, drawing only while something moves; it
   needs nothing of the den's (its materials are materials.js's).

   colourStage(canvas) → { wear(name), next() }: wear a colour by its name (the palette's, src/palette.ts), or
   change into the next outfits in the same one. */
import * as THREE from 'three';
import { dressPirate } from '../den-look.js';
import { DYES } from '../palette.js';
import { TWIRL, twirlAt } from '../showcase.js';
import { armchair, rug, table, candelabra, barrel, place } from './furniture.js';
import { mat } from './materials.js';

/** The second colour beside the picked one: white beside a dark colour, black beside a light one. */
const against = (hex) => {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? 'black' : 'white';
};
/* Who's on the turntable, and their outfits, each with the picked colour `c` and its contrast `k` worn. Every
   piece is the wardrobe's own. */
const CAST = [
  {
    base: { body: 'f', skin: 1, hair: 'long', hairCol: 'blonde', patch: false, smile: true, earring: 'both' },
    outfits: [
      (c, k) => ({ hat: 'wide', hatCol: c, hatCol2: k, top: 'corset', topCol: c, topCol2: k, waist: 'none', legs: 'gown', legsCol: c, legsCol2: k, feet: 'shoes', feetCol: 'black' }),
      (c, k) => ({ hat: 'bandana', hatCol: c, top: 'buccaneer', topCol: c, topCol2: k, waist: 'sash', waistCol: 'black', legs: 'flare', legsCol: c, feet: 'boots', feetCol: 'black' }),
      (c, k) => ({ hat: 'tiara', hatCol: 'gold', hatCol2: c, top: 'dresstop', topCol: c, topCol2: k, waist: 'none', legs: 'long', legsCol: c, feet: 'fancy', feetCol: c, feetCol2: k }),
    ],
  },
  {
    base: { body: 'm', skin: 4, hair: 'short', hairCol: 'black', beard: 'goatee', patch: true, earring: true },
    outfits: [
      (c, k) => ({ hat: 'tricorne', hatCol: c, top: 'captain', topCol: c, topCol2: 'gold', waist: 'belt', waistCol: 'black', legs: 'pants', legsCol: c, feet: 'boots', feetCol: 'black' }),
      (c, k) => ({ hat: 'bandana', hatCol: c, top: 'striped', topCol: c, topCol2: k, waist: 'sash', waistCol: k, legs: 'pantaloons', legsCol: c, feet: 'boots', feetCol: 'black' }),
      (c, k) => ({ hat: 'feathered', hatCol: c, hatCol2: k, top: 'swashbuckler', topCol: c, topCol2: k, waist: 'belt', waistCol: 'black', legs: 'kilt', legsCol: c, legsCol2: k, feet: 'fancy', feetCol: 'black', feetCol2: c }),
    ],
  },
  {
    base: { body: 'f', skin: 2, hair: 'curly', hairCol: 'red', patch: false, grin: true, earring: true, fam: 'parrot' },
    outfits: [
      (c, k) => ({ hat: 'feathered', hatCol: c, hatCol2: k, top: 'frilly', topCol: c, topCol2: k, waist: 'none', legs: 'patched', legsCol: c, legsCol2: k, feet: 'boots', feetCol: 'brown', famCol: c, famCol2: k }),
      (c, k) => ({ hat: 'captain', hatCol: c, hatCol2: 'gold', top: 'captain', topCol: c, topCol2: 'gold', waist: 'belt', waistCol: 'black', legs: 'pants', legsCol: c, feet: 'boots', feetCol: 'black', famCol: c, famCol2: 'gold' }),
      (c, k) => ({ hat: 'none', top: 'midriff', topCol: c, topCol2: k, waist: 'sash', waistCol: c, legs: 'short', legsCol: c, feet: 'bare', famCol: k, famCol2: c }),
    ],
  },
];
const R = 0.72;                          // (how far out from the turntable's middle each stands: two in front, one behind, facing out)
const TURN = { SECS: 2.6, BY: (Math.PI * 2) / 3 };

export function colourStage(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffe6c4', '#3a2616', 1.25));
  const key = new THREE.DirectionalLight('#ffd9a8', 1.9);
  key.position.set(-2.5, 5, 4);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 40);

  // The room: a floor, a wall behind, the furniture round the turntable.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), mat('#4a3524'));
  floor.rotation.x = -Math.PI / 2;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), mat('#2c1e14'));
  wall.position.set(0, 2, -2.4);
  scene.add(floor, wall);
  place(scene, table(), 1.75, -0.5, -0.4);
  place(scene, candelabra({ light: false }), 2.05, -1.55);
  place(scene, barrel(), -1.35, -1.75);
  let chair = null, mat_ = null;
  const deck = new THREE.Group();          // the turntable, and everyone on it
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.22, 0.08, 40), mat('#6b4528'));
  disc.position.y = 0.04;
  deck.add(disc);
  scene.add(deck);

  const throwAway = (g) => g.traverse((o) => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose()); });
  const people = CAST.map((who, i) => ({ who, i: 0, a: Math.PI / 3 + (i * Math.PI * 2) / 3, fig: null, twirl: 0, wait: 0 }));
  const dress = (p, name) => {
    const look = { ...p.who.base, ...p.who.outfits[p.i % p.who.outfits.length](name, against(DYES[name] || '#888888')) };
    if (p.fig) { deck.remove(p.fig.g); throwAway(p.fig.g); }
    p.fig = dressPirate(look);
    p.fig.g.position.set(Math.sin(p.a) * R, 0.08, Math.cos(p.a) * R);
    p.fig.g.rotation.y = p.a;
    deck.add(p.fig.g);
  };

  let colour = null, yaw = 0, from = 0, to = 0, turnT = 1, running = false, last = 0;
  const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let busy = false;
    // The turntable easing round to where it's going.
    if (turnT < 1) { turnT = Math.min(1, turnT + dt / TURN.SECS); const e = 1 - Math.pow(1 - turnT, 3); yaw = from + (to - from) * e; busy = true; }
    deck.rotation.y = yaw;
    // Each pirate twirling into their outfit (a little after the one before), with a hop.
    for (const p of people) {
      if (!p.fig) continue;
      if (p.wait > 0) { p.wait -= dt; busy = true; if (p.wait <= 0) { dress(p, colour); p.twirl = TWIRL.SECS; } continue; }
      if (p.twirl > 0) { p.twirl = Math.max(0, p.twirl - dt); busy = true; }
      const { turn, hop } = twirlAt(p.twirl);
      p.fig.g.rotation.y = p.a + turn;
      p.fig.g.position.y = 0.08 + hop;
    }
    fit();
    r.render(scene, cam);
    running = busy || dragging;
    if (running) requestAnimationFrame(frame);
  }
  function fit() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || canvas.width === Math.round(w * r.getPixelRatio())) return;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    // (Narrow or wide, the turntable and the pieces round it stay in view.)
    const d = cam.aspect < 1.1 ? 6.4 / Math.max(0.6, cam.aspect / 1.1) : 6.4;
    cam.position.set(0, 2.5, d);
    cam.lookAt(0, 0.8, -0.1);
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(() => { canvas.width = 0; kick(); }).observe(canvas);

  // Dragged round, it stays where you leave it.
  let dragging = false, dragX = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX; turnT = 1; canvas.setPointerCapture(e.pointerId); kick(); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; yaw += (e.clientX - dragX) * 0.012; dragX = e.clientX; });
  const drop = () => { dragging = false; };
  canvas.addEventListener('pointerup', drop);
  canvas.addEventListener('pointercancel', drop);

  const S = {
    /** Everyone into the next of their outfits, in `name`; the chair and the rug in it; the turntable round a third. */
    wear(name, { first = false } = {}) {
      if (!DYES[name]) return;
      colour = name;
      const hex = DYES[name];
      if (chair) { scene.remove(chair.g); throwAway(chair.g); }
      if (mat_) { scene.remove(mat_.g); mat_.g.traverse((o) => o.material?.map?.dispose()); throwAway(mat_.g); }   // (the rug's pattern is painted afresh in each colour)
      chair = place(scene, armchair({ col: hex }), -1.8, -0.35, 0.55);
      mat_ = place(scene, rug({ col: hex, w: 3.4, d: 2.6 }), 0, 0.2);
      people.forEach((p, i) => {
        if (first) { dress(p, name); return; }
        p.i++;
        p.wait = 0.05 + i * 0.22;
      });
      if (!first) { from = yaw; to = yaw + TURN.BY; turnT = 0; }
      kick();
    },
    /** Their next outfits, in the same colour. */
    next() { if (colour) S.wear(colour); },
  };
  return S;
}
