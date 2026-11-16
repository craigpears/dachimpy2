/* A ghost, floating, a sheet with dark eyes, see-through and glowing faintly green, bobbing and swaying: the one
   aboard a Phantom class war frigate for good, as YPPedia has it (src/den-frigate.ts, ELDRITCH_WAIL). */
import { THREE, mesh } from './parts.js';

/** A ghost. `col`: its glow. */
export function ghost({ col = '#c9ffe8' } = {}) {
  const g = new THREE.Group(), body = new THREE.Group();
  const sheet = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  // (a sheet: a dome over a skirt, its hem waving)
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(t < 0.35 ? Math.sin(t / 0.35 * Math.PI / 2) * 0.38 : 0.38 + (t - 0.35) * 0.18, 1.6 - t * 1.25)); }
  const geo = new THREE.LatheGeometry(pts, 18), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.6) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) + Math.sin(a * 6) * 0.06); }
  geo.computeVertexNormals();
  body.add(mesh(geo, sheet, false));
  const eye = new THREE.MeshBasicMaterial({ color: '#0d1a14' });
  for (const x of [-0.12, 0.12]) { const e = mesh(new THREE.SphereGeometry(0.06, 8, 6), eye, false); e.scale.set(0.8, 1.3, 0.5); e.position.set(x, 1.38, 0.33); body.add(e); }
  g.add(body);
  let t = Math.random() * 6;
  return { g, tick(dt) { t += dt; body.position.y = 0.25 + Math.sin(t * 1.4) * 0.12; body.rotation.y = Math.sin(t * 0.5) * 0.4; sheet.opacity = 0.45 + Math.sin(t * 2.3) * 0.1; } };
}

export const PIECES = [
  { id: 'ghost', name: 'Ghost', group: 'styles', make: ghost,
    about: 'A ghost floating in a sheet, see-through, glowing faintly, bobbing and swaying. Options: col (its glow).',
    where: 'Aboard the Phantom class war frigate, for good.' },
];
