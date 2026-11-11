// Baking something that stands still into a few meshes, one for each material it's made of, so a
// big thing of many parts (a war frigate and all her furniture) costs a handful of draws, not
// hundreds. Any part marked `userData.live` (a gibbet's swinging cage, her sails) is left as it is,
// to move.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const KEEP = ['position', 'normal', 'uv'];
/** Bakes `root`'s still meshes into one mesh a material (and whether it casts a shadow), in `root`'s
    own frame. Returns `root`. */
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), found = [];
  (function walk(o) {
    for (const c of o.children) {
      if (c.userData.live) continue;
      if (c.isMesh && !Array.isArray(c.material)) found.push(c);
      walk(c);
    }
  })(root);
  const buckets = new Map(), m = new THREE.Matrix4();
  for (const o of found) {
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!KEEP.includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.clearGroups();
    geo.applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld));
    const key = `${o.material.uuid}|${o.castShadow}`;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
    buckets.get(key).geos.push(geo);
    o.removeFromParent();
  }
  for (const { mat, cast, geos } of buckets.values()) {
    const merged = new THREE.Mesh(mergeGeometries(geos), mat);
    merged.castShadow = cast; merged.receiveShadow = true;
    root.add(merged);
    for (const g of geos) g.dispose();
  }
  return root;
}
