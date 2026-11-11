// Primates Rule at anchor on the sloop's sea, still to come (src/den-moored.ts; her squares LAY.PRIMATES
// in src/den-sail.ts). The user (11 Nov): "add that to the scene somewhere so you can just, once you
// start getting out to sea, you just kind of see that out there and put [a mark] on it. [To] make it
// clear, it's kind of a to-do item." Her look is js/den/frigate.js's own, her sails furled, her anchor
// cable down off her bow, riding gently where she lies; a sign over her, "Primates Rule · coming
// soon", that faces you wherever you are; and sailing up near her, you say she's not ready yet. No
// boarding her: nothing to do there yet. sailing.js keeps her going: primatesTick, primatesReset.
import * as THREE from 'three';
import { PRIMATES_RULE } from '../den-frigate.js';
import { MOORED, MOORED_MID, MooredHail, nearMoored } from '../den-moored.js';
import { BY_PRIMATES_RULE } from '../lines/you.js';
import { scene, mat, mesh, canvasTex, toast } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { cine } from './cine.js';
import { frigateMesh } from './frigate.js';

export const moored = { W: null, hail: new MooredHail() };

// The sign: a board in the den's own colours, her name in gold and what's to come under it.
const signTex = () => canvasTex(512, 176, (g, w, h) => {
  g.fillStyle = 'rgba(28, 19, 12, 0.88)';
  g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 26); g.fill();
  g.strokeStyle = '#e0a92a'; g.lineWidth = 6; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f2c14e'; g.font = 'italic 700 64px Alegreya, Georgia, serif';
  g.fillText(MOORED.SIGN.name, w / 2, h * 0.4);
  g.fillStyle = '#f6ead2'; g.font = '700 38px "Alegreya Sans", system-ui, sans-serif';
  g.fillText(`· ${MOORED.SIGN.note} ·`, w / 2, h * 0.75);
});

function build() {
  const her = frigateMesh(PRIMATES_RULE, undefined, { furled: true }), g = her.g, H = her.plan.hull;
  // Her anchor cable, down off her bow into the water ahead of her.
  const tip = H.len / 2 + H.len * 0.04, a = new THREE.Vector3(tip - 0.9, H.deck - 0.2, 0.75), b = new THREE.Vector3(tip + 2.6, -0.2, 1.1);
  const d = b.clone().sub(a), cable = mesh(new THREE.CylinderGeometry(0.05, 0.05, d.length(), 5), mat('#3a2f25', { roughness: 1 }), false);
  cable.position.copy(a).addScaledVector(d, 0.5); cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.add(cable);
  // (low over her, among her rigging, where the sea's camera looking down on the sloop sees it, and
  // always in front of her, never lost behind a mast)
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex(), transparent: true, depthWrite: false, depthTest: false }));
  sign.scale.set(7, 7 * 176 / 512, 1);
  sign.position.set(-2.5, H.deck + 5, 0.5);   // (toward her stern, the lanes' side: seen sooner)
  sign.renderOrder = 5;
  g.add(sign);
  g.position.set(seaX(MOORED_MID.c), 0, seaZ(MOORED_MID.r));
  g.rotation.y = MOORED.HEADING;
  scene.add(g);
  return { her, sign };
}

/** Each tick, at sea or seen from the beach (sailing.js): built the first time, riding at anchor;
    sailing up near her, you say she's not ready yet, once a voyage. */
export function primatesTick(dt) {
  const W = (moored.W ||= build()), t = performance.now() / 1000;
  W.her.g.position.y = Math.sin(t * 0.7) * 0.04;
  W.her.g.rotation.z = Math.sin(t * 0.5) * 0.008;
  W.her.tick(dt);
  if (sail.on && sail.helm) {
    const p = sail.helm.pose;
    if (moored.hail.pass(nearMoored(p.c, p.r), !cine)) toast(BY_PRIMATES_RULE);
  }
}
/** A fresh voyage: she's said of again. */
export function primatesReset() { moored.hail = new MooredHail(); }
