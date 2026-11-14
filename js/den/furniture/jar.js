/* A big glass jar with something in it looking out: a creature of colour `creature`. */
import { THREE, mat, cyl, rod, ball, dark, glass, straw, ivory, socket } from './parts.js';

const creatureMats = {}, creatureMat = (c) => (creatureMats[c] ||= mat(c, { emissive: c, emissiveIntensity: 0.25, roughness: 0.5 }));
export function jar({ creature = '#8a5cd8' } = {}) {
  const g = new THREE.Group(), c = creatureMat(creature);
  g.add(cyl(0.23, 0.24, 0.05, dark, 0, 0.025, 0, 14), cyl(0.22, 0.22, 0.66, glass, 0, 0.38, 0, 14), cyl(0.245, 0.245, 0.06, straw, 0, 0.74, 0, 14), ball(0.05, straw, 0, 0.79, 0));
  const blob = ball(0.13, c, 0, 0.3, 0, 10); blob.scale.set(1, 1.2, 0.9); g.add(blob);
  for (const sx of [-1, 1]) g.add(ball(0.04, ivory, sx * 0.05, 0.38, 0.1, 6), ball(0.018, socket, sx * 0.05, 0.38, 0.135, 4));
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; g.add(rod([Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08], [Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17], 0.025, c, 5)); }
  return { g };
}

export const PIECES = [
  { id: 'jar', name: 'Specimen jar', group: 'skeleton', make: jar,
    about: 'A big glass jar with a little creature in it looking out. Options: creature (its colour).',
    where: 'Primates Rule\'s deck.' },
];
