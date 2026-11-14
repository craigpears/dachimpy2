// Umami the capybara's model, one wherever he's drawn: stuck on his bank (foraging.js's capybaraSkin),
// swimming and living at the den (capybara.js), at a sloop's helm (race-field.js), and played as a pirate
// (den-look.js's dressCapybara, a look whose body is 'capy'). It needs only three.js, so anything can draw him.
import * as THREE from 'three';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
export const capyFur = mat('#c48a52', { roughness: 0.95 }), capyDark = mat('#6a4224', { roughness: 0.95 }), capyNose = mat('#2a1a12', { roughness: 0.6 });
const capyEye = mat('#0e0a08', { roughness: 0.2 }), capyGlint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
/* The capybara himself, side on, facing +x, standing on his feet with y up (his feet about 0.67
   below his middle): a barrel of a body, a big square-ended head, little round ears, short legs, no
   tail to speak of. One model, wherever he's drawn: stuck on his bank, swimming, at the den.
   `userData`: his `head` (it nods) and `legs` (they paddle). */
export function capybaraMesh() {
  const c = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14).scale(1.25, 0.85, 0.8), capyFur);
  body.position.set(-0.12, -0.1, 0);
  const head = new THREE.Group();
  head.position.set(0.52, 0.12, 0);   // (square on his body, so both eyes show: 14 Nov, "why does the capybara look like they've only got one eye?")
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12).scale(1.25, 0.95, 0.85), capyFur);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.36), capyFur);
  snout.position.set(0.26, -0.08, 0);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), capyNose);
  nose.position.set(0.43, -0.03, 0);
  head.add(skull, snout, nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8).scale(1, 1.2, 0.5), capyDark);
    ear.position.set(-0.12, 0.26, s * 0.16);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), capyEye);
    eye.position.set(0.14, 0.1, s * 0.2);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), capyGlint);   // (a bright eye)
    glint.position.set(0.18, 0.125, s * 0.2 + s * 0.022);
    head.add(ear, eye, glint);
  }
  c.add(body, head);
  c.userData.head = head;
  c.userData.legs = [];
  for (const [x, z] of [[-0.48, 0.22], [-0.48, -0.22], [0.22, 0.22], [0.22, -0.22]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8).translate(0, -0.15, 0), capyDark);
    leg.position.set(x, -0.37, z);
    c.add(leg);
    c.userData.legs.push(leg);
  }
  c.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return c;
}
