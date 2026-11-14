/* Candlelight: a tall brass candelabra, and a candle in a bracket for a wall (a sconce). Their flames flicker
   in `tick`. */
import { THREE, mesh, box, cyl, brass, wax, flameM, glowM } from './parts.js';

/** A candle's flame, with a soft glow round it, flickering (in `tick`). */
function flame(parent, x, y, z) {
  const f = mesh(new THREE.ConeGeometry(0.025, 0.08, 8), flameM, false), glow = mesh(new THREE.SphereGeometry(0.07, 8, 6), glowM, false);
  f.position.set(x, y, z); glow.position.set(x, y, z);
  parent.add(f, glow);
  return f;
}
const flicker = (fs, light, base) => {
  let t = Math.random() * 10;
  return (dt) => {
    t += dt;
    const k = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
    for (const f of fs) f.scale.set(1, k + 0.1, 1);
    if (light) light.intensity = base * k;
  };
};
/** A tall brass candelabra, three candles lit. `light`: whether it lights the room (a few, not all). */
export function candelabra({ light = true } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.18, 0.22, 0.04, brass, 0, 0.02, 0, 14), cyl(0.03, 0.04, 1.35, brass, 0, 0.7, 0, 8), box(0.56, 0.03, 0.03, brass, 0, 1.38, 0));
  const fs = [];
  for (const x of [-0.27, 0, 0.27]) {
    const h = x ? 0.16 : 0.22;
    g.add(cyl(0.045, 0.035, 0.04, brass, x, 1.41, 0, 10), cyl(0.024, 0.026, h, wax, x, 1.43 + h / 2, 0, 8));
    fs.push(flame(g, x, 1.47 + h, 0));
  }
  let L = null;
  if (light) { L = new THREE.PointLight('#ffb35a', 6, 7, 1.6); L.position.set(0, 1.8, 0); g.add(L); }
  return { g, tick: flicker(fs, L, 6) };
}
/** A candle in a brass bracket, for a wall (its back to the wall, at its origin; hang it at `y`). */
export function sconce({ y = 1.9 } = {}) {
  const g = new THREE.Group();
  g.add(box(0.08, 0.2, 0.03, brass, 0, y, 0.015), box(0.03, 0.03, 0.16, brass, 0, y - 0.06, 0.09), cyl(0.05, 0.04, 0.03, brass, 0, y - 0.04, 0.17, 10), cyl(0.022, 0.024, 0.12, wax, 0, y + 0.04, 0.17, 8));
  return { g, tick: flicker([flame(g, 0, y + 0.13, 0.17)], null, 0) };
}

export const PIECES = [
  { id: 'candelabra', name: 'Candelabra', group: 'light', make: candelabra, sample: { light: false },
    about: 'A tall brass candelabra, three candles lit, flickering. Options: light (whether it lights the room: give it to a few, not all).',
    where: 'Every house.' },
  { id: 'sconce', name: 'Sconce', group: 'light', make: sconce, onWall: true,
    about: 'A candle in a brass bracket, its back to a wall. Options: y (how high it hangs).',
    where: 'Gravee\'s gallery, Roobear\'s ROOm, Dachimpy\'s museum, the housing district\'s door.' },
];
