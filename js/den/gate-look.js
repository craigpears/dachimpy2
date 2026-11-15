// An imperial gate across a wall of rocks, in 3D (its rules src/imperial-gate.ts): the Empire's gatehouse
// (empire.js) over its one-square way, its arch high enough for a war frigate's masts, each tower on its two
// columns of the wall, a plinth of the Empire's stone under it, and its bastion guns (turret.js's look). A tower
// hit shudders and sits a little lower; its last shot brings it down into the sea, its plinth and the arch with it,
// rubble just under the water on its squares (15 Nov: "where the gates get destroyed, the base of them still is there,
// and it looks really weird with the sloops ... going through what looks like a concrete platform"): open water now. The frigate-and-sloop test sea's (two-ships.js) and the blockade's (blockade.js).
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { mat, mesh, burst } from './world.js';
import { blast } from './blast.js';
import { gatehouse, bastionLook } from './empire.js';
import { turretMesh } from './turret.js';

const CELL = SAIL.CELL, stoneGeo = new THREE.DodecahedronGeometry(1, 0);

/** The gate (`gate`, an imperial-gate.ts Gate), its bastion guns (`battery`, den-turret.ts Turrets), laid in
    `parent` by `v3(c, r, y)` (a square's middle in metres). Returns { bastions (turret.js views), knock(i,
    crumbled), tick(dt) }. */
export function gateLook(parent, gate, battery, v3) {
  const [ta, tb] = gate.middles(), R = gate.r0, gz = v3(0, (gate.r0 + gate.r1) / 2).z, stoneM = mat('#d8cdb8', { flatShading: true, roughness: 0.95 });
  const gh = gatehouse({ xa: v3(ta, 0).x, xb: v3(tb, 0).x, z: gz, archY: 11, tw: CELL * 1.7, bannerH: 5 });
  parent.add(gh);
  const { sides, arch } = gh.userData, shake = [0, 0], fall = [-1, -1], hp0 = gate.towers.map((t) => t.hp);
  let archFall = -1, archWay = 1, clock = 0;
  const plinths = [ta, tb].map((c) => { const p = mesh(new THREE.BoxGeometry(CELL * 1.95, 1.2, CELL * (gate.r1 - gate.r0 + 1)), stoneM); p.position.set(v3(c, 0).x, 0.3, gz); parent.add(p); return p; });
  const bastions = battery.map((gun) => { const V = turretMesh(bastionLook()); V.g.position.copy(v3(...gun.at)); parent.add(V.g); return V; });
  return {
    bastions,
    /** Tower `i` knocked by a shot; `crumbled`, its last. */
    knock(i, crumbled) {
      const side = sides[i], at = v3([ta, tb][i], R + 0.5, 4);
      burst(at, '#d8cdb8', 22, 6); burst(at.clone().setY(7), '#9a9088', 12, 4);
      shake[i] = 0.5;
      if (!crumbled) { side.position.y = -1.6 * (1 - gate.towers[i].hp / hp0[i]); return; }
      blast(at.clone().setY(5), 2, { bits: [{ mat: stoneM, n: 18, w: 0.9, h: 0.7, d: 0.9 }], ground: () => 0.2 });
      fall[i] = 0;
      if (archFall < 0) { archFall = 0; archWay = i ? -1 : 1; }
      for (let k = 0; k < 7; k++) {
        const m = mesh(stoneGeo, stoneM), s = 0.6 + Math.random() * 0.5;
        // (under the water but for its tops: ships sail over it now)
        m.scale.set(s, s * 0.5, s); m.position.set(at.x + (Math.random() - 0.5) * CELL * 1.6, -0.45, gz + (Math.random() - 0.5) * CELL * 1.6);
        m.rotation.set(Math.random() * 3, Math.random() * 3, 0); parent.add(m);
      }
    },
    tick(dt) {
      clock += dt;
      sides.forEach((side, i) => {
        if (shake[i] > 0) { shake[i] = Math.max(0, shake[i] - dt); side.position.x = Math.sin(clock * 60) * shake[i] * 0.3; }
        if (fall[i] < 0 || !side.visible) return;
        const u = Math.min(1, (fall[i] += dt) / 1.6);
        side.position.y = -1.6 - 13 * u * u; side.rotation.z = (i ? 1 : -1) * 0.25 * u;
        plinths[i].position.y = 0.3 - 2.5 * u;
        if (u >= 1) side.visible = plinths[i].visible = false;
      });
      if (archFall >= 0 && arch.visible) {
        const u = Math.min(1, (archFall += dt) / 1.1);
        arch.position.y = -12 * u * u; arch.rotation.z = archWay * 0.3 * u;
        if (u >= 1) arch.visible = false;
      }
    },
  };
}
