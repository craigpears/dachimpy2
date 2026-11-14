/* A little model of the old Blockade Simulator's board on a stand, for a museum (Dachimpy's: the user, 11 Nov,
   "there was always a fun gamble that ... your ship might randomly spin and jump into the rocks on mine ...
   the bugs are what made it"): a board of blue squares ringed with rocks, a whirlpool in a corner, and a
   little sloop sailing round it a square at a time, who now and then spins round and hops into the rocks,
   sits there a moment, and starts again. The stand and board are baked; the sloop moves (`tick`). */
import { THREE, mat, mesh, woodTex, canvasTex, box, cyl, dark, mid, greyStone } from './parts.js';
import { bake } from '../bake.js';

export function simModel() {
  const g = new THREE.Group(), N = 6, S = 0.95, q = S / N, top = 0.92;
  const stand = new THREE.Group();
  stand.add(cyl(0.16, 0.22, top - 0.06, dark, 0, (top - 0.06) / 2, 0, 12), box(S + 0.08, 0.06, S + 0.08, mid, 0, top - 0.03, 0));
  const face = canvasTex(384, 384, (c, W) => {
    const k = W / N;
    c.fillStyle = '#1f8fe0'; c.fillRect(0, 0, W, W);
    c.strokeStyle = '#0b2a44'; c.lineWidth = 2;
    for (let i = 0; i <= N; i++) { c.beginPath(); c.moveTo(i * k, 0); c.lineTo(i * k, W); c.stroke(); c.beginPath(); c.moveTo(0, i * k); c.lineTo(W, i * k); c.stroke(); }
    // a whirlpool, in the second square in
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4;
    for (let a = 0; a < 3; a++) { c.beginPath(); for (let t = 0; t < 1; t += 0.05) { const r = 4 + t * k * 0.42, th = a * 2.1 + t * 5; c.lineTo(k * 1.5 + Math.cos(th) * r, k * 1.5 + Math.sin(th) * r); } c.stroke(); }
  });
  const board = mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 }), false);
  board.rotation.x = -Math.PI / 2; board.position.y = top + 0.002;
  stand.add(board);
  const cellAt = (i, j) => [(i - (N - 1) / 2) * q, (j - (N - 1) / 2) * q];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i > 0 && i < N - 1 && j > 0 && j < N - 1) continue;
    const [x, z] = cellAt(i, j), rock = mesh(new THREE.DodecahedronGeometry(q * 0.36, 0), greyStone);
    rock.position.set(x, top + q * 0.22, z); rock.rotation.set(i, j, i + j); rock.scale.y = 0.75;
    stand.add(rock);
  }
  bake(stand);
  g.add(stand);
  // Her: a hull, a mast and a sail, small.
  const her = new THREE.Group(), hull = mat('#7a4a28', { map: woodTex });
  her.add(box(q * 0.32, q * 0.14, q * 0.8, hull, 0, q * 0.07, 0), box(q * 0.012 + 0.004, q * 0.7, q * 0.012 + 0.004, dark, 0, q * 0.45, 0));
  const sail = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, q * 0.6), new THREE.Vector2(q * 0.42, 0)])), new THREE.MeshStandardMaterial({ color: '#f4efe2', side: THREE.DoubleSide, roughness: 0.9 }));
  sail.rotation.y = Math.PI / 2; sail.position.set(0, q * 0.16, q * 0.05);
  her.add(sail);
  her.userData.live = true;
  g.add(her);
  // Round the inside of the rocks, a square at a time; now and then, off into them.
  const loop = [];
  for (let i = 1; i <= N - 2; i++) loop.push([i, 1]);
  for (let j = 2; j <= N - 2; j++) loop.push([N - 2, j]);
  for (let i = N - 3; i >= 1; i--) loop.push([i, N - 2]);
  for (let j = N - 3; j >= 2; j--) loop.push([1, j]);
  const st = { k: 0, t: 0, phase: 'sail', steps: 0, from: null, to: null, spin: 0 };
  const put = (x, z, y = 0, yaw = 0, tip = 0) => { her.position.set(x, top + y, z); her.rotation.set(0, yaw, tip); };
  const headOf = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
  const [x0, z0] = cellAt(...loop[0]);
  put(x0, z0, 0, headOf(loop[0], loop[1]));
  let yaw = her.rotation.y;
  return {
    g,
    tick(dt) {
      st.t += dt;
      if (st.phase === 'sail') {
        const a = loop[st.k], b = loop[(st.k + 1) % loop.length], u = Math.min(1, st.t / 0.7);
        const [ax, az] = cellAt(...a), [bx, bz] = cellAt(...b), want = headOf(a, b);
        yaw += Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw)) * Math.min(1, dt * 8);
        put(ax + (bx - ax) * u, az + (bz - az) * u, 0, yaw);
        if (u >= 1) {
          st.k = (st.k + 1) % loop.length; st.t = 0; st.steps++;
          // (a bug: now and then, off she goes, into the rocks outside her square)
          if (st.steps > 5 && Math.random() < 0.18) {
            const [i, j] = loop[st.k], out = [i === 1 ? 0 : i === N - 2 ? N - 1 : i, j === 1 ? 0 : j === N - 2 ? N - 1 : j];
            if (out[0] === i && out[1] === j) out[1] = 0;
            Object.assign(st, { phase: 'bug', from: cellAt(i, j), to: cellAt(...out), spin: yaw, steps: 0 });
          }
        }
      } else if (st.phase === 'bug') {
        const u = Math.min(1, st.t / 1.1), [ax, az] = st.from, [bx, bz] = st.to;
        put(ax + (bx - ax) * u, az + (bz - az) * u, q * 0.25 + 4 * q * 0.9 * u * (1 - u), st.spin + u * Math.PI * 4, u * 0.45);
        if (u >= 1) { st.phase = 'sit'; st.t = 0; }
      } else if (st.phase === 'sit' && st.t > 1.6) {
        st.phase = 'sail'; st.t = 0; st.k = 0;
        yaw = headOf(loop[0], loop[1]);
        put(x0, z0, 0, yaw);
      }
    },
  };
}

export const PIECES = [
  { id: 'simModel', name: 'Blockade sim model', group: 'museum', make: simModel,
    about: 'A little model of the old Blockade Simulator\'s board on a stand: blue squares ringed with rocks, a whirlpool, and a little sloop sailing round who now and then hops into the rocks.',
    where: 'Dachimpy\'s museum.' },
];
