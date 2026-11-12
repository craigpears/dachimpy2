// The sloop race's bribe at the gate (its rules: src/den-bribe.ts; its squares LAY.RACE.BRIBE; what the guard
// says, src/lines/gate-guard.ts). The user, 12 Nov: "build the bribe gate ... I just want all the ideas in
// there ... to show how many different ways you have of really getting through the course."
// The gun gap on the first spit is an imperial gate: a gatehouse of the Empire's pale stone over its way in,
// crimson banners down its towers and the Empire's flag over its arch (empire.js, as the checkpoint's), its
// two guns on the Empire's bastions (gateGun, for race.js), and a guard at the foot of its left tower, in the
// Empire's uniform, who halts you, grumbles, hints at a wreck, and takes a bribe. Back along leg 1, an old
// wreck run aground at the back of a notch (checkpoint.js's wreck, the same look): lie in the notch and Space
// lays Treasure Haul's board on the water behind her (treasure.js, the one board), the guard's price in coins
// to bring up. With them aboard, Space by the gate pays him: his guns hold their fire on her and his men warp
// her through on the gate's line, out the far side onto leg 2. Touches the rest only through race.js's hooks.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { BRIBE, Bribe, GUARD_SAYS, atWreck, atGate, inEarshot, towPath } from '../den-bribe.js';
import { UNIFORM } from '../den-imperial.js';
import { cleanLook } from '../den-look.js';
import { PACE } from '../chatter.js';
import { G, scene, mat, mesh, V3, burst, toast } from './world.js';
import { sail, seaX, seaZ, voices, SLOOP_DECK } from './sea.js';
import { gatehouse, bastionLook } from './empire.js';
import { turretMesh } from './turret.js';
import { wreckMesh } from './checkpoint.js';
import { person } from './props-people.js';
import { haul, haulOpen } from './treasure.js';

const RB = LAY.RACE.BRIBE, CELL = SAIL.CELL, LAND_H = 0.9;   // (spit 1's height: race.js, LOOK)
export const bribe = { k: new Bribe(), W: null, towing: false, said: false };

/** One of the gun gap's guns, on the Empire's bastion (race.js builds them where they stand). */
export const gateGun = () => turretMesh(bastionLook({ rocks: 2 }));

// ---------- the look of it ----------
function build() {
  const W = { g: new THREE.Group(), guard: null, rope: null, wreck: null };
  // The gatehouse over the gap's way in: its towers on the spit either side, the arch over the water.
  const [[ca, ra], [cb]] = RB.TOWERS, z = seaZ(ra);
  const gh = gatehouse({ xa: seaX(ca), xb: seaX(cb), z, archY: 6.4, tw: 2.6, bannerH: 3 });
  gh.position.y = LAND_H - 0.2;
  W.g.add(gh);
  // A stone step at the foot of the left tower, on the leg's side, where the guard stands.
  const step = mesh(new THREE.BoxGeometry(1.6, 0.4, 1.1), mat('#d3c9b2', { flatShading: true, roughness: 0.9 }));
  step.position.set(seaX(ca) + 0.5, LAND_H + 0.05, z + 1.85);
  W.g.add(step);
  // The guard, in the Empire's uniform, turned to whoever comes up the leg.
  const ship = () => (sail.on ? sail.helm.pose : null);
  W.guard = person({
    look: cleanLook({ ...UNIFORM, body: 'm', skin: 2, hair: 'short', hairCol: 'brown', beard: 'bushy' }),
    parent: W.g, x: seaX(ca) + 0.5, y: LAND_H + 0.25, z: z + 1.85, yaw: Math.PI, idle: 'stand',
    script: GUARD_SAYS, gap: PACE.ASIDE, wait: 0.4, bubble: 'page', shown: () => sail.on,
    earshot: () => { const s = ship(); return !!s && inEarshot(s.c, s.r) && voices.hears('gate', s.c, s.r); },
    face: () => { const s = ship(); return s && inEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
  });
  voices.add('gate', { c: RB.GATE[0], r: RB.GATE[1], earshot: BRIBE.EARSHOT });
  // The wreck at the back of its notch, run aground on the spit, listing, her bow up out of the water.
  const [wc, wr] = RB.WRECK;
  W.wreck = wreckMesh();
  // (lying across the notch's back, so she's seen past her sails from the leg)
  W.wreck.scale.setScalar(0.85);
  W.wreck.position.set(seaX(wc), LAND_H + 0.2, seaZ(wr) - 0.5);
  W.wreck.rotation.y = 0.3;
  W.g.add(W.wreck);
  // The gate's line, from the gatehouse to her bow while she's towed through.
  W.rope = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), mat('#c9ab72', { roughness: 0.95 }), false);
  W.rope.visible = false;
  W.g.add(W.rope);
  scene.add(W.g);
  return W;
}
/** Built the first time the race's course is (race.js). */
export function bribeWorld() { bribe.W ||= build(); }

// ---------- the wreck's coins, by Treasure Haul ----------
// The board on the water behind her as she lies in the notch (her bows to the wreck), its top row toward
// her, the net hung from her stern rail; you look down on it from out on the leg, back toward her and the wreck.
function haulIt() {
  const p = bribe.k.purse, h = sail.helm;
  if (!p.canStart(h)) return false;
  // (said the first time any Treasure Haul's played: here, no chest, only the guard's price)
  if (!G.haulSaid) { G.haulSaid = true; toast(`Treasure Haul: three coins in a row come up. Bring up ${BRIBE.PRICE} of them`); }
  const sq = 0.45, at = V3(seaX(h.pose.c), 0.12, seaZ(h.pose.r) + CELL * 0.5 + 0.5 + 8 * sq / 2);
  haulOpen({
    salvage: p, at, yaw: 0, sq,
    deck: () => sail.g.localToWorld(V3(0.9, SLOOP_DECK + 0.1, 0)),
    rig: { up: SLOOP_DECK + 0.2 - 0.12, out: 0.35 },
    stay: () => sail.on && !sail.helm.dazed() && !sail.helm.held() && atWreck(sail.helm.pose.c, sail.helm.pose.r),
    onDone: (n) => {
      burst(sail.g.localToWorld(V3(0, SLOOP_DECK + 0.4, 0)), '#ffd23a', 18, 2.5);
      toast(`${n} coins up! Enough to grease a guard's palm`);
    },
  });
  return true;
}

// ---------- paying at the gate, and the tow through ----------
function pay() {
  const h = sail.helm, ans = bribe.k.pay(h.pose.c, h.pose.r);
  if (!ans) return false;
  bribe.W?.guard.aside(ans);
  if (ans !== 'paid') return true;
  // Paid: his guns hold their fire on her (race.js asks bribeSpares), and his men warp her through.
  burst(V3(seaX(h.pose.c), SLOOP_DECK + 1, seaZ(h.pose.r)), '#ffd23a', 16, 2);
  h.gust(towPath(h.pose));
  bribe.towing = true;
  toast('Paid! His men warp her through on the gate\'s line');
  return true;
}

// ---------- the hooks race.js calls ----------
/** A key at sea (race.js): Space in the wreck's notch hauls (treasure.js plays the board), and by the gate
    pays. */
export function bribeKey(key) {
  if (haul.on || (key !== ' ' && key !== 'enter')) return false;
  const h = sail.helm;
  if (h.slot >= 0 || h.held()) return false;
  if (atWreck(h.pose.c, h.pose.r)) return haulIt();
  if (atGate(h.pose.c, h.pose.r)) return pay();
  return false;
}
export function bribePrompt() {
  const h = sail.helm, k = bribe.k, p = k.purse;
  if (haul.on || h.slot >= 0) return '';
  if (atWreck(h.pose.c, h.pose.r)) {
    if (p.done) return k.paid ? 'The old wreck, bare' : `The old wreck, bare · ${p.coins()} coins aboard`;
    return p.board ? `The old wreck · Space: back to hauling up her coins (${p.coins()} of ${BRIBE.PRICE} up)` : 'An old wreck · Space: haul up her coins (Treasure Haul)';
  }
  if (atGate(h.pose.c, h.pose.r)) {
    if (k.paid) return 'The gate\'s paid: on through';
    const n = k.carried();
    if (n >= BRIBE.PRICE) return `The imperial gate · Space: pay its guard ${BRIBE.PRICE} coins`;
    if (n > 0) return `The imperial gate · Space: pay its guard (${n} coins aboard, his price ${BRIBE.PRICE})`;
  }
  return '';
}
/** Paid: the gap's guns hold their fire on her (race.js ticks them with no ship). */
export const bribeSpares = () => bribe.k.spares();
/** Each tick (race.js): the guard; the gate's line while she's towed. */
export function bribeTick(dt) {
  const W = bribe.W;
  if (!W) return;
  W.guard.tick(dt);
  const h = sail.helm;
  if (bribe.towing && (!sail.on || !h.gusts.length)) bribe.towing = false;
  W.rope.visible = bribe.towing;
  if (bribe.towing) {
    // (from the arch's foot on the far side, taut to her bow)
    const a = V3(seaX(RB.GATE[0]), LAND_H + 1.2, seaZ(RB.TOWERS[0][1]) - CELL * 0.5), b = sail.g.localToWorld(V3(1.6, SLOOP_DECK + 0.6, 0));
    W.rope.position.copy(a).add(b).multiplyScalar(0.5);
    W.rope.scale.set(1, a.distanceTo(b), 1);
    W.rope.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
  }
}
/** A new race (or a fresh voyage): the wreck's coins back down there, nothing aboard, the gate unpaid, the
    guard to halt you again. */
export function bribeReset() {
  bribe.k = new Bribe();
  bribe.towing = false;
  if (bribe.W) { bribe.W.rope.visible = false; bribe.W.guard.restart(); }
}
