/* Creatures that aren't pirates, for any scene (and any portrait): the yeti of Gravee's definitive proof,
   and the vampire, a pirate from the wardrobe made undead. Each returns what a pirate from the wardrobe
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
