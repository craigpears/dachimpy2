/* Creatures that aren't pirates, for any scene (and any portrait): the yeti of Gravee's definitive proof,
   and the vampire, a pirate from the wardrobe made undead. And Roobear's: Robert the kangaroo bear, a joey and a bear;
   and a pirate's face roobed (bliss), dressed as a kangaroo bear (rooBear), posed for a portrait (pose). Each returns what a pirate from the wardrobe
   does ({ g, legs, arms, body }), so the coffin, a portrait or a cutscene can pose it the same way. */
import * as THREE from 'three';
import { SKIN, HAIR, cleanLook, familiar, familiarTick } from '../den-look.js';
import { mat, mesh, makePirate } from './world.js';

const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

/** A yeti: big, white and shaggy, a pale blue-grey face, little dark eyes, long arms. About 2.3 m. */
export function yeti() {
  const g = new THREE.Group(), body = new THREE.Group(), fur = mat('#f2f4f8', { roughness: 1, flatShading: true }), face = mat('#9fb2c8', { roughness: 0.8 }), black = mat('#1d1a18');
  body.position.y = 0.9; g.add(body);
  const trunk = mesh(new THREE.IcosahedronGeometry(0.62, 1), fur); trunk.scale.set(1, 1.15, 0.85); trunk.position.y = 0.45; body.add(trunk);
  const head = mesh(new THREE.IcosahedronGeometry(0.36, 1), fur); head.position.set(0, 1.18, 0.05); body.add(head);
  const mug = mesh(new THREE.SphereGeometry(0.23, 14, 10), face); mug.scale.set(1, 0.9, 0.6); mug.position.set(0, 1.12, 0.26); body.add(mug);
  for (const s of [-1, 1]) {
    body.add(at(mesh(new THREE.SphereGeometry(0.035, 8, 6), black), s * 0.08, 1.18, 0.39));
    const brow = mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), mat('#6a7d92')); brow.position.set(s * 0.08, 1.24, 0.38); brow.rotation.z = -s * 0.25; body.add(brow);
  }
  body.add(at(mesh(new THREE.SphereGeometry(0.06, 10, 6), mat('#4a3a44')), 0, 1.04, 0.39));   // (a wide mouth)
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(0.62 * s, 0.85, 0); body.add(sh);
    const a = mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.0, 8), fur); a.position.y = -0.48; sh.add(a);
    sh.add(at(mesh(new THREE.SphereGeometry(0.15, 8, 6), face), 0, -1.0, 0.03));
    sh.rotation.z = s * 0.25;
    return sh;
  });
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group(); hip.position.set(0.27 * s, 0.9, 0); g.add(hip);
    const l = mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 8), fur); l.position.y = -0.45; hip.add(l);
    const foot = mesh(new THREE.BoxGeometry(0.3, 0.12, 0.45), face); foot.position.set(0, -0.86, 0.08); hip.add(foot);
    return hip;
  });
  return { g, body, arms, legs, phase: 0, fam: null };
}

/* Scared to death, for any pirate from the wardrobe (IDEAS.md: "hair on end, mouth open, arms flung
   up"): eyes wide, mouth a big O, hair standing up in spikes (out from under any hat), arms flung up,
   leaning back, legs apart. `on` false puts them back as they were. */
export function fright(p, on = true) {
  const L = p.look || {}, hr = L.body === 'f' ? 0.235 : 0.25;
  if (!p.scared) {
    const grp = new THREE.Group(), white = mat('#ffffff'), black = mat('#1d1a18'), hair = mat(HAIR[L.hairCol] || '#3b2414');
    for (const x of [0.085, -0.085]) {
      const w = at(mesh(new THREE.SphereGeometry(0.055, 10, 8), white), x, 0.955, hr - 0.05); w.scale.z = 0.6; grp.add(w);
      grp.add(at(mesh(new THREE.SphereGeometry(0.022, 8, 6), black), x, 0.955, hr + 0.005));
    }
    const o = at(mesh(new THREE.SphereGeometry(0.055, 12, 8), mat('#3a0e0e')), 0, 0.815, hr - 0.01); o.scale.set(0.85, 1.25, 0.5); grp.add(o);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, spike = mesh(new THREE.ConeGeometry(0.035, 0.24, 6), hair);
      spike.position.set(Math.sin(a) * 0.13, 1.2 + Math.cos(a * 2) * 0.03, Math.cos(a) * 0.1 - 0.04);
      spike.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
      grp.add(spike);
    }
    p.body.add(grp);
    p.scared = grp;
  }
  p.scared.visible = on;
  p.arms.forEach((a, i) => a.rotation.set(on ? -2.85 : 0, 0, on ? (i ? 0.55 : -0.55) : 0));
  p.legs.forEach((l, i) => l.rotation.set(0, 0, on ? (i ? 0.16 : -0.16) : 0));
  p.body.rotation.x = on ? -0.14 : 0;
}

/** The Count: Gravee's vampire, a look from the wardrobe (src/den-gravee.ts's VAMPIRE), deathly pale,
    with fangs. */
export function vampire(look) {
  const L = cleanLook(look);
  const p = makePirate({ look: L });
  const pale = new THREE.Color('#d9dcea'), skin = new THREE.Color(SKIN[L.skin]);
  p.g.traverse((o) => { if (o.isMesh && o.material?.color && !o.material.map && o.material.color.equals(skin)) { o.material = o.material.clone(); o.material.color.copy(pale); } });
  const hr = L.body === 'f' ? 0.235 : 0.25, white = mat('#ffffff');
  for (const s of [-1, 1]) { const f = mesh(new THREE.ConeGeometry(0.014, 0.045, 6), white); f.rotation.x = Math.PI; f.position.set(s * 0.03, 0.8, hr - 0.02); p.body.add(f); }
  // Red eyes, over the wardrobe's black ones.
  for (const x of [0.085, -0.085]) p.body.add(at(mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: '#d0102a' })), x, 0.95, hr - 0.005));
  return p;
}

/* Eyes shut and smiling, for any pirate from the wardrobe: having an ear roobed (Roobear's ROOm, and her
   gallery). Lids over the eyes in the skin's colour, a dark line of lashes along each. `on` false opens them. */
export function bliss(p, on = true) {
  const L = p.look || {}, hr = L.body === 'f' ? 0.235 : 0.25;
  if (!p.blissed) {
    const grp = new THREE.Group(), lid = mat(SKIN[L.skin] || SKIN[1]), lash = mat('#1d1a18');
    for (const x of [0.085, -0.085]) {
      const l = at(mesh(new THREE.SphereGeometry(0.046, 10, 8), lid), x, 0.952, hr - 0.03); l.scale.set(1, 0.9, 0.78); grp.add(l);   // (over the eye, which stands out to the head's radius)
      const c = at(mesh(new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI), lash), x, 0.955, hr + 0.008); c.rotation.z = Math.PI; grp.add(c);
    }
    p.body.add(grp);
    p.blissed = grp;
  }
  p.blissed.visible = on;
}

/* A kangaroo, a bear, and Robert, who's half of each (Roobear's: "Robert the kangaroo bear that roobs
   ears"): one build, its body a kangaroo's (big hind feet, a thick tail to lean on, a pouch, little arms)
   or a bear's (round, on stubby legs), its head a kangaroo's (long ears, a long snout) or a bear's (round
   ears, a short muzzle and a black nose). Our own beasts, never anyone's from a book. Facing +z, standing
   on its origin; `body` is lifted for a hop, `arms` [its right, its left] swing from the shoulder, `ears`
   twitch, `tail` sways. pose(name, t) poses it: 'rub', hopping on the spot with a paw up roobing an ear at
   about a pirate's ear height, at the top of each hop (`t` seconds in); 'hop', hopping along; anything
   else, standing. */
const BEASTS = {
  robert: { body: 'roo', head: 'bear', fur: '#8a5a36', pale: '#e2c29a', size: 1.2 },
  joey: { body: 'roo', head: 'roo', fur: '#a09282', pale: '#e8ddce', size: 0.65 },
  bear: { body: 'bear', head: 'bear', fur: '#4a3020', pale: '#7a5638', size: 1.4 },
};
export function beast(kind = 'robert') {
  const B = BEASTS[kind] || BEASTS.robert, roo = B.body === 'roo';
  const g = new THREE.Group(), body = new THREE.Group(), fur = mat(B.fur, { roughness: 1 }), pale = mat(B.pale, { roughness: 1 }), black = mat('#1d1a18'), white = mat('#ffffff');
  const ball = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = body) => { const b = at(mesh(new THREE.SphereGeometry(r, 12, 10), m), x, y, z); b.scale.set(sx, sy, sz); parent.add(b); return b; };
  g.add(body);
  let tailG;
  // The body: a kangaroo's pear, leaning a little forward, a pouch; or a bear's round barrel.
  if (roo) {
    ball(0.2, fur, 0, 0.62, 0, 1, 1.45, 0.95).rotation.x = 0.15;
    ball(0.13, pale, 0, 0.55, 0.11, 0.95, 1.3, 0.55);
    const pouch = at(mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 14, Math.PI), pale), 0, 0.45, 0.17); pouch.rotation.set(-0.2, 0, Math.PI); body.add(pouch);
    for (const s of [-1, 1]) {
      ball(0.13, fur, 0.12 * s, 0.32, -0.02, 0.85, 1.25, 1.2);   // (the big haunches)
      ball(0.05, fur, 0.12 * s, 0.05, 0.12, 0.9, 0.55, 3.0);     // (the long feet)
    }
    tailG = new THREE.Group(); tailG.position.set(0, 0.3, -0.14); body.add(tailG);
    const t0 = at(mesh(new THREE.ConeGeometry(0.075, 0.6, 10), fur), 0, -0.13, -0.24); t0.rotation.x = -2.1; tailG.add(t0);
  } else {
    ball(0.27, fur, 0, 0.55, 0, 1, 1.2, 0.9);
    ball(0.19, pale, 0, 0.52, 0.1, 0.95, 1.1, 0.6);
    for (const s of [-1, 1]) { ball(0.1, fur, 0.14 * s, 0.17, 0, 1, 1.7, 1); ball(0.09, pale, 0.14 * s, 0.04, 0.06, 1, 0.5, 1.4); }
    tailG = new THREE.Group(); ball(0.05, fur, 0, 0.4, -0.24, 1, 1, 1, tailG); body.add(tailG);
  }
  // The head: up on top, a little forward.
  const head = new THREE.Group(); head.position.set(0, 0.98, roo ? 0.06 : 0.04); body.add(head);
  const ears = [];
  if (B.head === 'bear') {
    ball(0.15, fur, 0, 0, 0, 1, 0.95, 0.95, head);
    ball(0.07, pale, 0, -0.04, 0.12, 1.15, 0.85, 0.9, head);
    ball(0.025, black, 0, -0.01, 0.19, 1.3, 0.9, 1, head);
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(0.11 * s, 0.11, -0.01); head.add(e);
      ball(0.055, fur, 0, 0, 0, 1, 1, 0.55, e); ball(0.032, pale, 0, 0, 0.02, 1, 1, 0.4, e);
      ears.push(e);
    }
  } else {
    ball(0.11, fur, 0, 0, 0, 1, 0.95, 1.05, head);
    ball(0.065, fur, 0, -0.04, 0.1, 0.85, 0.8, 1.3, head);
    ball(0.022, black, 0, -0.03, 0.18, 1.3, 0.8, 1, head);
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(0.055 * s, 0.08, -0.02); head.add(e);
      const c = at(mesh(new THREE.ConeGeometry(0.035, 0.18, 8), fur), 0, 0.08, 0); c.scale.z = 0.5; e.add(c);
      e.rotation.z = -0.25 * s;
      ears.push(e);
    }
  }
  for (const s of [-1, 1]) { ball(0.022, black, 0.055 * s, 0.03, B.head === 'bear' ? 0.12 : 0.085, 1, 1, 1, head); ball(0.007, white, 0.06 * s, 0.038, B.head === 'bear' ? 0.14 : 0.105, 1, 1, 1, head); }
  // Little arms (a bear's thicker), [0] its right, as a pirate's.
  const arms = [-1, 1].map((s) => {
    const a = new THREE.Group(); a.position.set(0.15 * s * (roo ? 1 : 1.5), roo ? 0.8 : 0.72, roo ? 0.1 : 0.06); body.add(a);
    const len = roo ? 0.3 : 0.28, r = roo ? 0.035 : 0.06;
    a.add(at(mesh(new THREE.CapsuleGeometry(r, len - r, 4, 8), fur), 0, -len / 2, 0), at(mesh(new THREE.SphereGeometry(r * 1.25, 8, 6), pale), 0, -len, 0));
    a.rotation.set(-0.5, 0, 0.15 * s);
    return a;
  });
  g.scale.setScalar(B.size);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const F = { g, body, head, arms, ears, tail: tailG, kind, size: B.size };
  /** Posed `name` at `t` seconds: 'rub', 'hop', or standing. */
  F.pose = (name, t = 0) => {
    const hop = name === 'rub' || name === 'hop' ? Math.abs(Math.sin(t * (name === 'rub' ? 6.5 : 8))) : 0;
    body.position.y = hop * (name === 'rub' ? 0.4 : 0.16);   // (a big hop, to reach)
    body.rotation.x = name === 'hop' ? 0.25 : 0;
    if (F.tail) F.tail.rotation.x = -hop * 0.5 + Math.sin(t * 1.3) * 0.05;
    F.ears.forEach((e, i) => { e.rotation.x = Math.max(0, Math.sin(t * 2.1 + i * 2)) ** 12 * 0.6; });
    head.rotation.y = name === 'rub' ? 0 : Math.sin(t * 0.7) * 0.35;
    if (name === 'rub') {
      // The paw up and forward to an ear, roobing round and round; the other at his chest.
      arms[0].rotation.set(-2.35 + Math.sin(t * 11) * 0.12, 0, Math.cos(t * 11) * 0.14);
      arms[1].rotation.set(-0.9, 0, 0.15);
    } else arms.forEach((a, i) => a.rotation.set(-0.5 + (name === 'hop' ? hop * 0.3 : 0), 0, (i ? 1 : -1) * 0.15));
  };
  F.pose('stand');
  return F;
}

/* Dressed up as half a kangaroo and half a bear, any pirate from the wardrobe (Roobear's gallery, "Roo +
   Bear"): a kangaroo's long ear on one side of the head, a bear's round one on the other, and a kangaroo's
   tail, all in Robert's brown. */
export function rooBear(p) {
  const L = p.look || {}, hr = L.body === 'f' ? 0.235 : 0.25, fur = mat(BEASTS.robert.fur, { roughness: 1 }), pale = mat(BEASTS.robert.pale, { roughness: 1 });
  const roo = new THREE.Group(); roo.position.set(-hr * 0.55, 1.12, -0.03); roo.rotation.z = 0.35; p.body.add(roo);
  const c = at(mesh(new THREE.ConeGeometry(0.05, 0.26, 8), fur), 0, 0.12, 0); c.scale.z = 0.5; roo.add(c);
  const ci = at(mesh(new THREE.ConeGeometry(0.03, 0.18, 6), pale), 0, 0.1, 0.012); ci.scale.z = 0.3; roo.add(ci);
  const bear = at(mesh(new THREE.SphereGeometry(0.085, 10, 8), fur), hr * 0.72, 1.16, 0.0); bear.scale.z = 0.5; p.body.add(bear);
  const bi = at(mesh(new THREE.SphereGeometry(0.05, 8, 6), pale), hr * 0.72, 1.16, 0.03); bi.scale.z = 0.3; p.body.add(bi);
  const tail = at(mesh(new THREE.ConeGeometry(0.07, 0.62, 10), fur), 0.36, -0.38, -0.2); tail.rotation.z = -2.0; p.body.add(tail);   // (out to one side, to be seen)
}

/* Posed for a portrait or a scene, any figure (a pirate from the wardrobe, or a beast above): 'rub', a hand
   (or a paw) up at someone's ear beside it; 'bliss', eyes shut, enjoying having theirs roobed. */
export function pose(fig, name) {
  if (fig.pose) { fig.pose(name, 0.24); return; }   // (a beast: at the top of a hop)
  if (name === 'rub') { fig.arms[0].rotation.set(-0.25, 0, -2.25); return; }
  if (name === 'bliss') bliss(fig, true);
}

/** A penguin, standing about (Vegas Island's); `balaclava`: in one, his eyes darting in its slit, a
    bobble on top; `sack`: a sack of swag over his shoulder. About 0.95 tall. Its parts (head, flips, eyes,
    sack) for creature()'s idles to move. */
export function penguin({ balaclava = false, sack = false } = {}) {
  const g = new THREE.Group(), black = mat('#1b1d22'), white = mat('#f4f2ec'), orange = mat('#f0a028');
  const body = mesh(new THREE.SphereGeometry(0.3, 14, 12), black);
  body.scale.set(0.85, 1.25, 0.8); body.position.y = 0.38;
  const belly = mesh(new THREE.SphereGeometry(0.26, 14, 12), white);
  belly.scale.set(0.75, 1.1, 0.6); belly.position.set(0, 0.34, 0.08);
  const head = new THREE.Group();
  head.position.y = 0.8;
  head.add(mesh(new THREE.SphereGeometry(0.17, 14, 12), balaclava ? mat('#3c4a3a', { roughness: 1 }) : black));
  const beak = mesh(new THREE.ConeGeometry(0.045, 0.14, 8), orange);
  beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.02, 0.17);
  head.add(beak);
  let eyes = [];
  if (balaclava) {
    const slit = mesh(new THREE.BoxGeometry(0.2, 0.055, 0.04), white);
    slit.position.set(0, 0.04, 0.145);
    const bobble = mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#3c4a3a'));
    bobble.position.y = 0.17;
    head.add(slit, bobble);
    eyes = [-1, 1].map((s) => { const e = mesh(new THREE.SphereGeometry(0.022, 6, 5), black, false); e.position.set(0.045 * s, 0.04, 0.17); head.add(e); return e; });
  } else for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.022, 6, 5), white, false); e.position.set(0.07 * s, 0.04, 0.14); head.add(e); }
  let bag = null;
  if (sack) {
    bag = mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#a98a5a', { roughness: 1 }));
    bag.scale.set(1, 1.2, 0.9); bag.position.set(-0.22, 0.75, -0.18);
    g.add(bag);
  }
  const flips = [-1, 1].map((s) => { const f = mesh(new THREE.SphereGeometry(0.1, 8, 6), black); f.scale.set(0.25, 1, 0.6); f.position.set(0.25 * s, 0.42, 0); g.add(f); return f; });
  for (const s of [-1, 1]) { const ft = mesh(new THREE.SphereGeometry(0.07, 8, 6), orange); ft.scale.set(1, 0.35, 1.5); ft.position.set(0.1 * s, 0.03, 0.06); g.add(ft); }
  g.add(body, belly, head);
  return { g, head, flips, eyes, sack: bag };
}

/* A creature to place in any scene, like a piece of furniture (the user, 11 Nov: "the pets ... the
   penguins and the creatures, you should be able to add these to your [scenes], similar to the
   furniture"): creature(kind, opts) gives { g, tick(dt), fig }, standing at its origin, opts.scale its
   size. Each does a named behaviour (opts.idle), the same wherever it's placed:
   - 'yeti': opts.idle 'sway' (arms swinging) or 'still'.
   - 'vampire': opts.look (a look from the wardrobe, made undead).
   - 'robert', 'joey', 'bear' (beast() above): its `moving` and `rubbing` set by its scene; opts.idle 'stand'.
   - a familiar on its own ('bat', 'monkey', 'parrot', 'squirrel', 'octopus', 'krakling'), in opts.col (and
     opts.col2, a parrot's second): opts.idle 'perch' (sat where it's put, fidgeting), 'hop' (a hop now
     and then, opts.rate how often, opts.height how high) or 'flutter' (round and round a circle opts.r
     across, opts.h up, opts.speed how fast, bobbing opts.bob: a bat about a room, or about an island).
   - 'penguin' (opts.balaclava, opts.sack: penguin() above): opts.idle 'potter' (looking about, flippers
     going, a little shuffle) or 'sneak' (tiptoeing to and fro opts.span either side, eyes darting, up to
     something). caught() freezes him, caught in the act: he looks round, flippers up, and drops his sack;
     opts.caughtSecs later (6) he's back at it. */
export function creature(kind, o = {}) {
  const g = new THREE.Group();
  if (kind === 'yeti') {
    const y = yeti(); g.add(y.g);
    let t = Math.random() * 9;
    return { g, fig: y, tick(dt) { if (o.idle === 'still') return; t += dt; y.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 1.4 + i * Math.PI) * 0.25; }); y.body.rotation.z = Math.sin(t * 0.9) * 0.04; } };
  }
  if (kind === 'vampire') { const v = vampire(o.look || {}); g.add(v.g); return { g, fig: v, tick() {} }; }
  if (kind === 'penguin') return penguinCreature(g, o);
  if (BEASTS[kind]) {
    // A kangaroo, a bear or Robert (beast() above): `moving` hops it along, `rubbing` roobs an ear (its
    // scene moves it about and says when); else it stands, ears twitching, looking about.
    const b = beast(kind); g.add(b.g);
    let t = Math.random() * 9;
    const C = { g, fig: b, moving: false, rubbing: false, tick(dt) { t += dt; b.pose(C.rubbing ? 'rub' : C.moving ? 'hop' : o.idle || 'stand', t); } };
    return C;
  }
  const f = familiar({ fam: kind, famCol: o.col || 'black', famCol2: o.col2 });
  if (!f) return { g, tick() {} };
  const s = o.scale ?? 1.4, holder = new THREE.Group();
  holder.add(f.g); holder.scale.setScalar(s); g.add(holder);
  let t = Math.random() * 9;
  return {
    g, fig: f,
    tick(dt) {
      t += dt;
      familiarTick(f, dt);
      if (o.idle === 'hop') holder.position.y = Math.max(0, Math.sin(t * 3 * (o.rate ?? 1))) * (o.height ?? 0.2);
      else if (o.idle === 'flutter') {
        const r = o.r ?? 1.2, a = t * (o.speed ?? 1.1);
        holder.position.set(Math.cos(a) * r, (o.h ?? 2.2) + Math.sin(t * 3) * (o.bob ?? 0.15), Math.sin(a) * r);
        holder.rotation.y = -a;
        if (f.wings) f.wings.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.6 + Math.sin(t * 16) * 0.6); });
      }
    },
  };
}

/* A penguin as a creature: see creature(). */
function penguinCreature(g, o) {
  const P = penguin(o), holder = new THREE.Group();
  holder.add(P.g); holder.scale.setScalar(o.scale ?? 1); g.add(holder);
  const sackY = P.sack?.position.y ?? 0, span = o.span ?? 1.2, caughtSecs = o.caughtSecs ?? 6;
  let t = Math.random() * 9, ph = Math.random() * 6, caught = null;
  return {
    g, fig: P,
    /** Caught in the act: he freezes, looks round, flippers up, and drops his sack. */
    caught() { caught = { t: 0 }; },
    tick(dt) {
      t += dt;
      if (caught) {
        const T = (caught.t += dt), k = Math.min(1, T * 3);
        P.head.rotation.y = -1.2 * k;
        P.flips.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * 1.3 * k; });
        if (P.sack) P.sack.position.y = Math.max(0.15, sackY - Math.max(0, T - 0.6) * 3);
        if (T > caughtSecs) { caught = null; if (P.sack) P.sack.position.y = sackY; }
        return;
      }
      if (o.idle === 'sneak') {
        // Up to something: tiptoeing to and fro, facing the way he's going, eyes darting.
        holder.position.x = Math.sin(t * 0.35) * span;
        holder.rotation.y = Math.cos(t * 0.35) > 0 ? Math.PI / 2 : -Math.PI / 2;
        holder.position.y = Math.abs(Math.sin(t * 6)) * 0.06;
        P.head.rotation.y = Math.sin(t * 2.3) * 0.7;
        for (const e of P.eyes) e.position.x = Math.sign(e.position.x) * 0.045 + Math.sin(t * 3.1) * 0.02;
        return;
      }
      // Pottering: looking about, flippers going, a little shuffle.
      P.head.rotation.y = Math.sin(t * 0.8 + ph) * 0.5;
      P.flips.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.15 + Math.max(0, Math.sin(t * 2 + ph)) * 0.3); });
      holder.position.y = Math.abs(Math.sin(t * 3 + ph)) * 0.04;
    },
  };
}
