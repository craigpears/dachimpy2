// A ship's damage, drawn on any ship (its rules src/ship-damage.ts): each hole where it struck, in her side or
// her deck, a dark splintered hole made with a bang, patched over with a fresh plank when her carpenters have
// done with it and then gone; her crew at work, carpenters hammering at her holes and bilgers at the pumps, a
// spout of water over her side as they pump; her sitting lower and listing as she fills; and knocked out, dead
// in the water: listing hard, low, smoking, turning slowly where she lies. The user (15 Nov): "I want the war frig
// to feel alive and look alive ... a ship full of people puzzling ... see a hole and see an explode or bang and a
// hole appear in the side of the war frigate as I shoot it, and for it to appear where I've shot it." The
// blockade's ships (blockade.js).
import * as THREE from 'three';
import { widthAt } from '../ships.js';
import { mat, mesh, burst, makePirate, animateWalk } from './world.js';
import { blast, puff } from './blast.js';

const holeM = mat('#0d0805', { roughness: 1 }), rawM = mat('#a87a45', { roughness: 1 }), splM = mat('#d4ab72', { roughness: 0.9 }), plankM = mat('#e3c08a', { roughness: 0.8 });
const SIZE = { small: 0.24, medium: 0.32, large: 0.42 };

/** Her damage drawn on `g` (her group: bow toward +x, port toward -z, the waterline at y 0), her hull `hull`
    (src/ships.ts), her deck's height `deck`, her crew's places `crew` ([{ x, z, job: 'carp' | 'bilge' }], on her
    deck), dressed as `dress` (makePirate's options). Returns { tick(dt, dmg, { pending }) → { low, list, turn } }:
    what to add to where she's drawn. `pending`, holes whose shot hasn't come down yet (drawn when it does). */
export function damageLook(g, hull, { deck, crew = [], dress = {} }) {
  const drawn = new Map(), big = hull.len > 8;
  const hands = crew.map((c, i) => {
    const p = makePirate({ ...dress, patch: i % 3 === 0 });
    p.g.position.set(c.x, deck, c.z); p.g.rotation.y = c.z > 0 ? 0 : Math.PI; p.g.scale.setScalar(big ? 1 : 0.9);
    g.add(p.g);
    return { ...c, p, ph: i * 1.7 };
  });
  let t = 0, smokeT = 0, sprayT = 0, turn = 0;

  function add(h, fx) {
    // (anywhere along the square it struck, not its middle: two ships lying still and pounding each other put every
    // ball on the same squares, and the holes would all be drawn on top of each other)
    const s = SIZE[h.gun] * (big ? 2 : 1), lim = hull.len * 0.45;
    const x = Math.max(-lim, Math.min(lim, h.along * hull.len * 0.9 + (Math.random() - 0.5) * Math.min(4, hull.len * 0.5) * 0.85));
    const o = new THREE.Group();
    if (h.side === 'deck') { o.position.set(x, deck + 0.02, (Math.random() - 0.5) * hull.beam * 0.5); o.rotation.x = -Math.PI / 2; }
    else {
      // (each a hair further out than the last, so overlapping holes never flicker through each other)
      const y = hull.deck * (0.6 + Math.random() * 0.28), side = h.side === 'R' ? 1 : -1;
      o.position.set(x, y, side * (widthAt(hull, x, y) + 0.06 + (h.id % 16) * 0.004)); o.rotation.y = side > 0 ? 0 : Math.PI;
    }
    // (raw splintered wood round it, so it shows on any paint: Primates Rule's black, Iron Pride's crimson)
    const raw = mesh(new THREE.CircleGeometry(s * 1.45, 9), rawM, false); raw.rotation.z = Math.random() * 3; o.add(raw);
    const dark = mesh(new THREE.CircleGeometry(s, 7), holeM, false); dark.rotation.z = Math.random() * 3; dark.position.z = 0.015; o.add(dark);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + Math.random() * 0.5, p = mesh(new THREE.BoxGeometry(s * (0.6 + Math.random() * 0.8), 0.09, 0.06), splM, false);
      p.position.set(Math.cos(a) * s * 1.05, Math.sin(a) * s * 1.05, 0.04); p.rotation.z = a + Math.PI / 2 + (Math.random() - 0.5) * 0.9; o.add(p);
    }
    g.add(o);
    drawn.set(h.id, { o, h });
    if (fx) {
      g.updateMatrixWorld(true);
      const w = o.getWorldPosition(new THREE.Vector3());
      blast(w, big ? 0.9 : 0.6, { bits: [{ mat: splM, n: 8, w: 0.12, h: 0.05, d: 0.5 }], ground: () => 0 });
      burst(w, '#ffb85a', 12, 4);
    }
  }
  function patch(id) {
    const d = drawn.get(id);
    drawn.delete(id);
    // (a fresh plank nailed over it, a puff of sawdust, then it weathers in)
    d.o.clear();
    const s = SIZE[d.h.gun] * (big ? 2 : 1), pl = mesh(new THREE.PlaneGeometry(s * 2.2, s * 1.1), plankM, false);
    pl.position.z = 0.02; d.o.add(pl);
    g.updateMatrixWorld(true);
    burst(d.o.getWorldPosition(new THREE.Vector3()), '#f2dcae', 8, 1.6);
    d.o.userData.fade = 6;
    patched.push(d.o);
  }
  const patched = [];

  return {
    /** Refitted (back after she sank): her holes and patches gone at once, no planks nailed over them. */
    reset() {
      for (const { o } of drawn.values()) g.remove(o);
      drawn.clear();
      for (const o of patched) g.remove(o);
      patched.length = 0;
      turn = 0;
    },
    tick(dt, dmg, { pending = new Set() } = {}) {
      t += dt;
      const ids = new Set(dmg.holes.map((h) => h.id));
      for (const id of [...drawn.keys()]) if (!ids.has(id)) patch(id);
      for (const h of dmg.holes) if (!drawn.has(h.id) && !pending.has(h.id)) add(h, true);
      for (let i = patched.length - 1; i >= 0; i--) {
        const o = patched[i];
        if ((o.userData.fade -= dt) > 0) continue;
        g.remove(o); patched.splice(i, 1);
      }
      // Her crew at work: carpenters hammering while there's a hole, bilgers pumping while there's water.
      const work = { carp: dmg.holes.length > 0, bilge: dmg.water > 0.02 };
      for (const c of hands) {
        const busy = work[c.job], k = busy ? Math.abs(Math.sin(t * (c.job === 'carp' ? 9 : 4) + c.ph)) : 0;
        c.p.g.position.y = deck + (c.job === 'bilge' ? 0.12 * k : 0);
        c.p.g.rotation.x = c.job === 'carp' ? 0.35 * k : 0;
        animateWalk(c.p, false, dt);
        if (busy && c.job === 'carp' && Math.random() < dt * 1.5) { g.updateMatrixWorld(true); burst(c.p.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.45, 0)), '#f6e2b0', 3, 1.2); }
      }
      // Water pumped over her side.
      if (work.bilge && (sprayT -= dt) < 0) {
        sprayT = 0.5 - dmg.water * 0.3;
        g.updateMatrixWorld(true);
        const side = Math.random() < 0.5 ? -1 : 1, w = g.localToWorld(new THREE.Vector3((Math.random() - 0.5) * hull.len * 0.3, deck, side * (hull.beam / 2 + 0.1)));
        burst(w, '#cfe8f2', 6, 1.8);
      }
      // Smoke off her as she's badly hurt, a wisp here and there; knocked out, a thick black column rising high off
      // her middle, to be seen across the board (the user, 15 Nov: "I like the smoke, little smoke showing someone's
      // been knocked out. I think it needs to be maybe a tiny bit clearer").
      const share = dmg.share();
      if ((share > 0.5 || dmg.out) && (smokeT -= dt) < 0) {
        g.updateMatrixWorld(true);
        if (dmg.out) {
          smokeT = 0.3;   // (few and big: the smoke's pool is shared by everything on the board)
          puff(g.localToWorld(new THREE.Vector3((Math.random() - 0.5) * hull.len * 0.25, deck + 0.6, (Math.random() - 0.5) * hull.beam * 0.3)), { size: big ? 3.2 : 1.8, life: 5.5, rise: big ? 2.2 : 1.6, dark: 0.97, drift: 0.15 });
        } else {
          smokeT = 0.7;
          puff(g.localToWorld(new THREE.Vector3((Math.random() - 0.5) * hull.len * 0.6, deck + 0.4, (Math.random() - 0.5) * hull.beam * 0.5)), { size: big ? 1.4 : 0.8, life: 3.5, dark: 0.5 });
        }
      }
      // Dead in the water, she turns slowly where she lies.
      turn = dmg.out ? turn + dt * 0.12 : turn * Math.max(0, 1 - dt * 0.8);
      const depth = big ? 0.5 : 0.3;   // (low, but her holes still above the water)
      return { low: -depth * (dmg.water * 0.7 + share * 0.3) - (dmg.out ? depth * 0.5 : 0), list: (dmg.out ? 0.22 : 0.08 * dmg.water) * (dmg.holes[0]?.side === 'R' ? 1 : -1), turn: Math.sin(turn) * 0.5 };
    },
  };
}
