// Mischievious's wedding: the crowd. A big wedding's guests beyond the few drawn whole (wedding.js keeps
// those as full pirates: the theme's own, and anyone you've dressed, moved or picked) are a cheap figure
// each, all of them in a handful of instanced meshes, so half the Ocean turning up keeps a phone's frame
// rate (the user, 11 Nov: "Do you want the grand wedding where half the ocean turns up?"). Each dressed
// in their look's colours (legs or a skirt, boots, the top and its sleeves, the head, hair, a hat) and
// turned the way they stand. Click one and wedding.js draws them whole.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as LOOK from '../den-look.js';

const two = (make, dx) => mergeGeometries([make().translate(-dx, 0, 0), make().translate(dx, 0, 0)]);
const SKIRTS = new Set(['gown', 'long', 'short', 'bloomers']);
const col = (c) => LOOK.DYES[c] || LOOK.HAIR[c] || '#888888';
/* Each part: its shape (standing at 0, facing +z, as the pirates do), its colour from a look, and whether
   a look has it at all (one that hasn't is shrunk away). The torso and head are always there: they're
   what a click finds. */
const PARTS = [
  { id: 'legs', geo: () => two(() => new THREE.CylinderGeometry(0.09, 0.08, 0.62, 8).translate(0, 0.38, 0), 0.12), col: (L) => col(L.legsCol), has: (L) => !SKIRTS.has(L.legs) },
  { id: 'skirt', geo: () => new THREE.CylinderGeometry(0.25, 0.36, 0.66, 12).translate(0, 0.39, 0), col: (L) => col(L.legsCol), has: (L) => SKIRTS.has(L.legs) },
  { id: 'feet', geo: () => two(() => new THREE.BoxGeometry(0.16, 0.12, 0.28).translate(0, 0.06, 0.05), 0.12), col: (L) => col(L.feetCol) },
  { id: 'torso', geo: () => new THREE.CylinderGeometry(0.19, 0.27, 0.66, 12).translate(0, 1.05, 0), col: (L) => col(L.topCol), pick: true },
  { id: 'arms', geo: () => mergeGeometries([new THREE.CylinderGeometry(0.065, 0.06, 0.58, 8).rotateZ(0.12).translate(-0.31, 1.06, 0), new THREE.CylinderGeometry(0.065, 0.06, 0.58, 8).rotateZ(-0.12).translate(0.31, 1.06, 0)]), col: (L) => col(L.topCol) },
  { id: 'head', geo: () => new THREE.SphereGeometry(0.2, 12, 9).translate(0, 1.56, 0), col: (L) => LOOK.SKIN[L.skin] || LOOK.SKIN[1], pick: true },
  { id: 'hair', geo: () => new THREE.SphereGeometry(0.215, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).rotateX(-0.35).translate(0, 1.58, -0.02), col: (L) => LOOK.HAIR[L.hairCol] || '#3b2414', has: (L) => L.hair !== 'bald' },
  { id: 'hat', geo: () => mergeGeometries([new THREE.CylinderGeometry(0.3, 0.3, 0.04, 14).translate(0, 1.74, 0), new THREE.CylinderGeometry(0.15, 0.18, 0.18, 12).translate(0, 1.84, 0)]), col: (L) => col(L.hatCol), has: (L) => L.hat && L.hat !== 'none' },
  { id: 'eyes', geo: () => two(() => new THREE.SphereGeometry(0.028, 6, 5).translate(0, 1.6, 0.18), 0.07), col: () => '#1d1a18' },
  // (a present held out in front, Showered in gifts: its paper, and its ribbon and bow)
  { id: 'gift', geo: () => new THREE.BoxGeometry(0.24, 0.2, 0.22).translate(0, 0.86, 0.3), col: (L) => col(L.handCol), has: (L) => L.hand === 'gift' },
  { id: 'giftRibbon', geo: () => mergeGeometries([new THREE.BoxGeometry(0.25, 0.205, 0.045), new THREE.BoxGeometry(0.045, 0.205, 0.23), new THREE.SphereGeometry(0.05, 8, 6).translate(0, 0.11, 0)]).translate(0, 0.86, 0.3), col: (L) => (L.handCol === 'white' ? '#e8b23a' : '#f6f2ea'), has: (L) => L.hand === 'gift' },
];
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P3 = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), NONE = new THREE.Vector3(0, 0, 0), UP = new THREE.Vector3(0, 1, 0), C = new THREE.Color();

/** The crowd's meshes, under `parent`, room for `max` of them. */
export function crowdMake(parent, max) {
  const g = new THREE.Group();
  const meshes = PARTS.map((p) => {
    const m = new THREE.InstancedMesh(p.geo(), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), max);
    m.castShadow = true; m.receiveShadow = true; m.count = 0; m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.userData.part = p;
    g.add(m);
    return m;
  });
  parent.add(g);
  return { g, meshes, list: [] };
}
/** Who's in the crowd now: [{ i (their guest number), look, x, z, yaw }], dressed and stood there. */
export function crowdSet(cr, list) {
  cr.list = list;
  cr.meshes.forEach((m) => {
    const p = m.userData.part;
    m.count = list.length;
    list.forEach((f, k) => m.setColorAt(k, C.set(p.col(f.look))));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  crowdPose(cr);
}
/** Each where they stand (a little bob up, `bob(k)`, as they cheer; all turned `yaw`, for the portrait). */
export function crowdPose(cr, bob = null, yaw = null) {
  cr.meshes.forEach((m) => {
    const p = m.userData.part;
    cr.list.forEach((f, k) => {
      Q.setFromAxisAngle(UP, yaw ?? f.yaw);
      P3.set(f.x, bob ? bob(k) : 0, f.z);
      M4.compose(P3, Q, !p.has || p.has(f.look) ? ONE : NONE);
      m.setMatrixAt(k, M4);
    });
    m.instanceMatrix.needsUpdate = true;
    m.boundingSphere = null;
  });
}
/** Whose figure the ray hits first (their guest number), and how far, or null. */
export function crowdPick(cr, ray) {
  if (!cr.list.length) return null;
  const hits = ray.intersectObjects(cr.meshes.filter((m) => m.userData.part.pick), false);
  const h = hits.find((x) => x.instanceId !== undefined && cr.list[x.instanceId]);
  return h ? { i: cr.list[h.instanceId].i, d: h.distance } : null;
}
