/* Portraits: any pirate painted by the pirate maker, from a look (as Puzzle Pirates' portraits were of the
   pirate as they were dressed), for a frame on a wall, an easel or a snapshot to save. A portrait's rules
   (who's in it, its title, what's behind them) are plain data: src/den-gravee.ts's gallery, say. This
   paints them: each sitter drawn in 3D by the wardrobe's own dressPirate, the backdrop behind them, her
   yeti a shaky blur (her famous proof). Off-screen, so the den's view isn't touched:

   - paint(portrait) for a wall: drawn straight into a tile of a big shared picture (an atlas) that stays
     on the graphics card, never read back (reading back stalls a frame: RULES.md, "No stutter"). Gives
     { texture, uv, eyes }: the atlas, where on it this one is, and, for a portrait that watches (the
     Count's; any with `watch`), where its eyes are on the picture (u, v from its bottom left; `eyes.r`
     their size, a share of its height; `eyes.pupil` their colour), for watching().
   - watching(frame, painted, target) for its eyes to follow you: drawn over the picture on its frame,
     a piece with a tick, like any of furniture.js's. Which way they look is src/eyes.ts's.
   - paintYou(look) for yours: read off into a canvas, to finish stroke by stroke on her easel and to save
     as a snapshot. Gives { canvas, texture }. */
import * as THREE from 'three';
import { PIRATES, cleanLook } from '../den-look.js';
import { renderer, makePirate } from './world.js';
import { yeti, vampire, fright, beast, rooBear, pose } from './creatures.js';
import { coffin } from './furniture.js';
import { VAMPIRE } from '../den-gravee.js';
import { eyesToward, pirateEyes } from '../eyes.js';

/** A portrait's size (pixels): upright, as Puzzle Pirates' were (174 by 255, near enough). */
export const PW = 256, PH = 320;

const pScene = new THREE.Scene();
pScene.add(new THREE.HemisphereLight('#fff4e6', '#5a4636', 1.5));
const key = new THREE.DirectionalLight('#fff0dc', 2.3); key.position.set(2.2, 3.2, 4.5); pScene.add(key);
const rim = new THREE.DirectionalLight('#b8ccff', 1.0); rim.position.set(-3, 2.5, -2.5); pScene.add(rim);
const pCam = new THREE.PerspectiveCamera(30, PW / PH, 0.1, 60);
const aim = (px, py, pz, lx, ly, lz) => { pCam.position.set(px, py, pz); pCam.lookAt(lx, ly, lz); pCam.updateMatrixWorld(); };
function drop(o) {
  o.traverse((x) => { if (x.isMesh) { x.geometry.dispose(); (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => m.dispose()); } });
}

// ---------- what's behind them ----------
const fronds = (g, W, H, col, n, seed = 3) => {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647, k = W / 512;
  g.strokeStyle = col; g.lineWidth = 3 * k;
  for (let i = 0; i < n; i++) {
    const x = r() < 0.5 ? r() * W * 0.22 : W - r() * W * 0.22, y = r() * H, len = (80 + r() * 140) * k, a = -1.2 + r() * 2.4;
    for (let j = 0; j < 14; j++) {
      const t = j / 14, cx = x + Math.cos(a) * len * t, cy = y + Math.sin(a) * len * t, l = 26 * k * (1 - t);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a + 1.3) * l, cy + Math.sin(a + 1.3) * l); g.stroke();
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 1.3) * l, cy + Math.sin(a - 1.3) * l); g.stroke();
    }
  }
};
const sky = (g, W, H, top, low) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
const disc = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const BACK = {
  bloodmoon: (g, W, H) => { sky(g, W, H, '#1a0606', '#4a1010'); disc(g, W * 0.78, H * 0.14, W * 0.18, '#c0392b'); g.fillStyle = '#2a0a08'; g.fillRect(0, H * 0.78, W, H); fronds(g, W, H, '#2e5a2a', 9); fronds(g, W, H, '#5a1a14', 6, 11); },
  snow: (g, W, H) => {
    sky(g, W, H, '#b9d4ea', '#eef6fb'); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(W * 0.5, H * 1.02, W * 0.9, H * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#dbe9f4'; const s = W / 15; for (let x = 0; x < W; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + s / 2, s + (x * 7) % (s * 2)); g.lineTo(x + s, 0); g.fill(); }
    for (let i = 0; i < 70; i++) disc(g, (i * 137) % W, (i * 241) % H, (1 + (i % 3)) * W / 512 * 2, '#ffffff');
  },
  beach: (g, W, H) => { sky(g, W, H, '#7fc3ea', '#e8f4fb'); g.fillStyle = '#3a8fc0'; g.fillRect(0, H * 0.55, W, H * 0.12); g.fillStyle = '#ead6a2'; g.fillRect(0, H * 0.66, W, H); },
  crypt: (g, W, H) => {
    sky(g, W, H, '#1c2234', '#2c3448');
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3 * W / 512;
    const bw = W / 6.4, bh = H / 14;
    for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = row % 2 ? 0 : -bw / 2; x < W; x += bw) g.strokeRect(x, y, bw, bh);
    g.fillStyle = '#121624'; g.beginPath(); g.moveTo(W * 0.12, H); g.lineTo(W * 0.12, H * 0.42); g.arc(W * 0.27, H * 0.42, W * 0.15, Math.PI, 0); g.lineTo(W * 0.42, H); g.fill();
  },
  autumn: (g, W, H) => { sky(g, W, H, '#f2a03a', '#c2461c'); for (let i = 0; i < 90; i++) disc(g, (i * 97) % W, (i * 173) % H, (8 + (i % 5) * 3) * W / 512, ['#e8b02a', '#d4581a', '#9a2a12', '#f2c64a'][i % 4]); },
  witch: (g, W, H) => { sky(g, W, H, '#1a0a2e', '#4a1a5a'); disc(g, W * 0.25, H * 0.16, W * 0.14, '#f2a03a'); g.fillStyle = '#120818'; g.fillRect(0, H * 0.8, W, H); },
  sea: (g, W, H) => { sky(g, W, H, '#0e3a52', '#2a7a8a'); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 4 * W / 512; for (let y = H * 0.55; y < H; y += H / 19) { g.beginPath(); for (let x = 0; x <= W; x += W / 25) g.lineTo(x, y + Math.sin(x / (W / 17) + y) * H / 100); g.stroke(); } },
  den: (g, W, H) => { sky(g, W, H, '#3a2414', '#6a4024'); for (const x of [W * 0.12, W * 0.88]) { const gr = g.createRadialGradient(x, H * 0.3, 4, x, H * 0.3, W * 0.24); gr.addColorStop(0, 'rgba(255,190,90,.9)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); } },
  // Roobear's portrait's: a pink sky over a violet sea, sparkling.
  pinksea: (g, W, H) => {
    sky(g, W, H, '#f4a6c8', '#f7d2e2'); g.fillStyle = '#7a4a9e'; g.fillRect(0, H * 0.6, W, H);
    const sea = g.createLinearGradient(0, H * 0.6, 0, H); sea.addColorStop(0, '#9a63c0'); sea.addColorStop(1, '#5a2f7e'); g.fillStyle = sea; g.fillRect(0, H * 0.6, W, H);
    for (let i = 0; i < 46; i++) disc(g, (i * 157) % W, H * 0.62 + ((i * 89) % (H * 0.38)), (1 + (i % 3)) * W / 512 * 2, 'rgba(255,240,255,.85)');
  },
  // A monsieur's: a café's cream wall under a striped awning.
  cafe: (g, W, H) => {
    sky(g, W, H, '#efe2c4', '#d9c49a');
    const n = 8, sw = W / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#f6f2ea' : '#5b2c6f'; g.fillRect(i * sw, 0, sw, H * 0.16); }
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#f6f2ea' : '#5b2c6f'; g.beginPath(); g.arc(i * sw + sw / 2, H * 0.16, sw / 2, 0, Math.PI); g.fill(); }
    g.fillStyle = '#7a5a3a'; g.fillRect(0, H * 0.82, W, H);
  },
  night: (g, W, H) => { sky(g, W, H, '#05070f', '#141c38'); for (let i = 0; i < 60; i++) disc(g, (i * 211) % W, (i * 97) % (H * 0.7), (1.5 + (i % 2)) * W / 512, '#e8ecff'); disc(g, W * 0.8, H * 0.12, W * 0.09, '#e8e4d0'); },
};
const vignette = (g, W, H) => {
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,15,5,.5)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
};
/** A backdrop painted on a canvas of its own (W by H). */
function backdropCanvas(kind, W, H) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  (BACK[kind] || BACK.den)(g, W, H);
  vignette(g, W, H);
  return cv;
}
const backTex = new Map();
/** The backdrop as a plane behind the sitters, filling the camera's view at `far` metres off. */
function backdropPlane(kind, far) {
  if (!backTex.has(kind)) { const t = new THREE.CanvasTexture(backdropCanvas(kind, PW, PH)); t.colorSpace = THREE.SRGBColorSpace; backTex.set(kind, t); }
  const h = 2 * far * Math.tan(pCam.fov * Math.PI / 360), w = h * pCam.aspect;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: backTex.get(kind), depthWrite: false, toneMapped: false }));
  const dir = new THREE.Vector3(); pCam.getWorldDirection(dir);
  m.position.copy(pCam.position).addScaledVector(dir, far);
  m.quaternion.copy(pCam.quaternion);
  m.renderOrder = -1;
  return m;
}

// ---------- who's in it ----------
const lookOf = (name, dress = {}) => cleanLook({ ...(PIRATES[name] || {}), ...dress });
/** A sitter as Puzzle Pirates' portraits stood them: a quarter turn, the hand with something in it up. */
function sitFor(p, yaw = 0.3) {
  p.g.rotation.y = yaw;
  if (p.held) p.arms[0].rotation.set(-0.55, 0, 0.1);
  return p;
}
/** A yeti, shaky: three of him at once, see-through, a little apart (definitive). */
function blurryYeti() {
  const g = new THREE.Group();
  [[-0.07, 0.4], [0.07, 0.4], [0, 0.45]].forEach(([dx, op]) => {
    const y = yeti();
    y.arms[0].rotation.z = -1.1; y.arms[1].rotation.z = 0.6;
    y.g.position.x = dx;
    y.g.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = op; o.material.depthWrite = false; } });
    g.add(y.g);
  });
  return g;
}
/** Where a figure's eyes (points on its body) come out on the picture, as watching() wants them, once the
    camera's aimed: u, v from its bottom left, their size (`r`, a share of its height) and pupils' colour. */
function eyesOn(fig, points, pupil) {
  fig.g.updateMatrixWorld(true);
  const at = (q) => fig.body.localToWorld(new THREE.Vector3(q.x, q.y, q.z)).project(pCam);
  const eyes = points.map((q) => { const p = at(q); return { u: (p.x + 1) / 2, v: (p.y + 1) / 2 }; });
  const a = at(points[0]), b = at({ ...points[0], y: points[0].y + 0.035 });
  eyes.r = Math.max(0.012, Math.abs(b.y - a.y) / 2 * 1.1);
  eyes.pupil = pupil;
  return eyes;
}
/** What's in the picture (and where the camera stands), for a sitter. */
function compose(portrait, you) {
  const s = portrait.sitter, objs = [];
  let eyes = null;
  if (s.who === 'pirate') {
    const look = lookOf(s.name, s.dress), p = sitFor(makePirate({ look }));
    if (s.costume === 'roo-bear') rooBear(p);
    if (s.pose) pose(p, s.pose);
    objs.push(p.g);
    // Whoever's beside them (Robert, a joey, a bear, a pirate), and the camera back to fit them in.
    for (const c of s.company || []) {
      const f = c.kind === 'pirate' ? makePirate({ look: cleanLook(c.look || {}) }) : beast(c.kind);
      f.g.position.set(c.x, 0, c.z); f.g.rotation.y = c.yaw ?? 0;
      if (c.pose) pose(f, c.pose);
      objs.push(f.g);
    }
    if (s.company?.length) { const cx = s.company.reduce((a, c) => a + c.x, 0) / (s.company.length + 1) * 0.8; aim(cx, 1.15, 5.4, cx, 1.0, 0); }
    else if (portrait.watch) {
      // Head and shoulders, close enough to see the eyes move.
      aim(0.25, 1.62, 2.3, 0, 1.5, 0);
      eyes = eyesOn(p, pirateEyes(look), '#1a1208');
    } else aim(0.3, 1.12, 4.4, 0, 1.0, 0);
  } else if (s.who === 'yeti') {
    // Her, sharp, beside him, not.
    const her = sitFor(makePirate({ look: lookOf('Gravee', s.dress) }), 0.45), y = blurryYeti();
    her.g.position.set(-0.5, 0, 0.3); y.position.set(0.6, 0, -0.6); y.rotation.y = -0.3;
    objs.push(y, her.g);
    aim(0, 1.25, 6.0, 0.05, 1.1, 0);
  } else if (s.who === 'vampire') {
    // Head and shoulders, his eyes where a frame can find them.
    const v = vampire(VAMPIRE);
    aim(0, 1.6, 2.05, 0, 1.5, 0);
    eyes = eyesOn(v, [0.085, -0.085].map((x) => ({ x, y: 0.95, z: 0.245 })), '#7a0a14');
    objs.push(v.g);
  } else if (s.who === 'you') {
    // You, frozen mid-scream, the Count sitting bolt upright in his coffin behind you.
    const v = vampire(VAMPIRE), c = coffin({ sitter: v });
    c.set(1, 1);
    c.g.position.set(0.85, 0, -1.3); c.g.rotation.y = -0.5;
    const p = makePirate({ look: cleanLook(you || {}) });
    fright(p, true);
    p.g.rotation.y = 0.35;
    objs.push(c.g, p.g);
    aim(0.1, 1.2, 4.9, 0.25, 1.05, 0);
  }
  return { objs, eyes };
}

// ---------- for a wall: straight into the atlas ----------
const ATLAS_W = 2048, ATLAS_H = 2048, COLS = Math.floor(ATLAS_W / PW), ROWS = Math.floor(ATLAS_H / PH);
const atlases = [];
function nextTile() {
  let A = atlases[atlases.length - 1];
  if (!A || A.used >= COLS * ROWS) {
    const rt = new THREE.WebGLRenderTarget(ATLAS_W, ATLAS_H, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    rt.texture.anisotropy = 4;
    A = { rt, used: 0 };
    atlases.push(A);
  }
  const i = A.used++, c = i % COLS, r = Math.floor(i / COLS);
  return { A, x: c * PW, y: r * PH };
}
/** Paints a portrait for a wall (src/den-gravee.ts's shape: { sitter, backdrop }). */
export function paint(portrait) {
  const { objs, eyes } = compose(portrait);
  const back = backdropPlane(portrait.backdrop, 9);
  pScene.add(back, ...objs);
  const { A, x, y } = nextTile();
  A.rt.viewport.set(x, y, PW, PH); A.rt.scissor.set(x, y, PW, PH); A.rt.scissorTest = true;
  const was = renderer.getRenderTarget(), shadows = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(A.rt);
  renderer.clear();
  renderer.render(pScene, pCam);
  renderer.setRenderTarget(was);
  renderer.shadowMap.enabled = shadows;
  pScene.remove(back, ...objs);
  back.geometry.dispose(); back.material.dispose();
  objs.forEach(drop);
  const e = 1.5;   // (a pixel and a half in, so a neighbour's edge never bleeds in as it shrinks)
  return { texture: A.rt.texture, uv: { u0: (x + e) / ATLAS_W, v0: (y + e) / ATLAS_H, u1: (x + PW - e) / ATLAS_W, v1: (y + PH - e) / ATLAS_H }, eyes };
}

// ---------- eyes that follow you ----------
const WHITE = new THREE.MeshBasicMaterial({ color: '#f4efe4' });
const v4 = new THREE.Vector3();
/* A portrait's eyes, following you about the room (the user, 11 Nov: "The vampire portrait that's
   following you definitely needs to be a normal thing"): over the picture on its `frame` (furniture.js's),
   where paint() found them (`painted.eyes`), each a white with a pupil that looks toward `target()` (a
   point in the world: you), as src/eyes.ts says. A piece: { g, tick(dt) }; null if it has no eyes. */
export function watching(frame, painted, target) {
  if (!painted?.eyes) return null;
  const dark = new THREE.MeshBasicMaterial({ color: painted.eyes.pupil || '#1a1208' });
  const eyes = painted.eyes.map((e) => {
    const r = painted.eyes.r * frame.h, x = (e.u - 0.5) * frame.w, y = frame.y + (e.v - 0.5) * frame.h;
    const ball = new THREE.Mesh(new THREE.CircleGeometry(r, 16), WHITE); ball.position.set(x, y, 0.04);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(r * 0.5, 12), dark); pupil.position.set(x, y, 0.045);
    frame.g.add(ball, pupil);
    return { pupil, x, y, r };
  });
  return {
    g: frame.g,
    tick() {
      const at = target();
      if (!at) return;
      frame.g.worldToLocal(v4.copy(at));
      for (const e of eyes) {
        const [dx, dy] = eyesToward(e.x, e.y, v4.x, v4.z, 0);
        e.pupil.position.set(e.x + dx * e.r * 0.5, e.y + dy * e.r * 0.5, 0.045);
      }
    },
  };
}

// ---------- yours: read off into a canvas ----------
const SC = 2, CW = PW * SC, CH = PH * SC;
let rt1 = null;
/** These things drawn on their own into a canvas, see-through round them. */
function layer(objs) {
  rt1 ||= new THREE.WebGLRenderTarget(CW, CH, { samples: 4 });
  rt1.texture.colorSpace = THREE.SRGBColorSpace;
  const buf = new Uint8Array(CW * CH * 4);
  objs.forEach((o) => pScene.add(o));
  const was = renderer.getRenderTarget(), clear = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha(), shadows = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rt1);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(pScene, pCam);
  renderer.readRenderTargetPixels(rt1, 0, 0, CW, CH, buf);
  renderer.setRenderTarget(was);
  renderer.setClearColor(clear, alpha);
  renderer.shadowMap.enabled = shadows;
  objs.forEach((o) => pScene.remove(o));
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const g = cv.getContext('2d'), img = g.createImageData(CW, CH);
  for (let y = 0; y < CH; y++) {
    const from = (CH - 1 - y) * CW * 4, to = y * CW * 4;
    for (let i = 0; i < CW * 4; i += 4) {
      const a = buf[from + i + 3];
      if (!a) continue;
      const k = 255 / a;   // (its edges were blended with nothing: undone, so they don't go dark)
      img.data[to + i] = Math.min(255, buf[from + i] * k); img.data[to + i + 1] = Math.min(255, buf[from + i + 1] * k); img.data[to + i + 2] = Math.min(255, buf[from + i + 2] * k); img.data[to + i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}
/** Paints any portrait (yours, with your `look`) into a canvas of its own, twice a wall's size: the same
    picture as on the wall, to look at close up, flat (js/den/picture-view.js), or to save. It's read back
    off the graphics card, so one at a time, when it's wanted, not every frame. */
export function paintFlat(portrait, look) {
  const cv = backdropCanvas(portrait.backdrop, CW, CH), g = cv.getContext('2d');
  const { objs } = compose(portrait, look);
  g.drawImage(layer(objs), 0, 0);
  objs.forEach(drop);
  return cv;
}
/** Paints you (`look`), frozen mid-scream, the Count sat up behind you: a canvas, and a texture of it. */
export function paintYou(portrait, look) {
  const cv = paintFlat(portrait, look);
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas: cv, texture };
}

/* A portrait framed for saving (a snapshot: the user, 11 Nov, "the taking a portrait and a snapshot,
   because that's fun"): gilt round it, its title and who painted it on a plaque below. A data URL. */
export function snapshot(canvas, title, sub) {
  const pad = 46, plaque = 96, cv = document.createElement('canvas');
  cv.width = canvas.width + pad * 2; cv.height = canvas.height + pad * 2 + plaque;
  const g = cv.getContext('2d');
  const gold = g.createLinearGradient(0, 0, cv.width, cv.height);
  gold.addColorStop(0, '#7a5216'); gold.addColorStop(0.3, '#f2cf6a'); gold.addColorStop(0.55, '#a8761f'); gold.addColorStop(0.8, '#f6dc86'); gold.addColorStop(1, '#6e4812');
  g.fillStyle = gold; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(60, 35, 8, .7)'; g.lineWidth = 5; g.strokeRect(12, 12, cv.width - 24, cv.height - 24); g.strokeRect(pad - 8, pad - 8, canvas.width + 16, canvas.height + 16);
  g.drawImage(canvas, pad, pad);
  const y = pad * 2 + canvas.height - 18;
  g.fillStyle = '#f6ecd2'; g.fillRect(pad, y, canvas.width, plaque - 4); g.strokeStyle = '#7a5216'; g.lineWidth = 3; g.strokeRect(pad, y, canvas.width, plaque - 4);
  g.fillStyle = '#3a2210'; g.textAlign = 'center';
  const fit = (text, yy, px, style) => { let s = px; do g.font = `${style} ${s}px Alegreya, Georgia, serif`; while (g.measureText(text).width > canvas.width - 30 && --s > 12); g.fillText(text, cv.width / 2, yy); };
  fit(title, y + 40, 34, '700');
  fit(sub, y + 74, 24, 'italic');
  return cv.toDataURL('image/png');
}
