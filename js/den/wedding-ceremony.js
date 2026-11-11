// Mischievious's wedding: the ceremony, a cheesy little cutscene (cine.js) of the plot you chose
// (src/den-wedding.ts: plotScript's beats and lines). Everyone seated, your partner up the aisle, the
// vows begun; then the twist: raiders storm in and the security guards see them off into the sea, a
// guest staggers about with a tankard and topples into the cake, or words are had, then fists, then
// benches. Then "I do", the kiss, hearts and confetti, and everyone gathered for the portrait, the last
// shot held for wedding.js to frame. Skipped (Space), it goes straight to that last shot, the plot's
// aftermath and all.
import { plotScript, plotAt, fill, COUPLE, ALTAR, AISLE_FOOT, GUARDS, PROP_R } from '../den-wedding.js';
import { V3, burst, wearLook } from './world.js';
import { cinePlay, cineEnd, stepTo } from './cine.js';
import { poseFig, restArms, heartsUp, roomy } from './wedding-scene.js';

/** The portrait's shot, and where everyone stands for it (the couple in the middle under the arch). */
export const PORTRAIT_CAM = { look: V3(0, 1.25, -3.7), dist: 8.4, tilt: 0.14, yaw: 0 };
const SPOTS = [[-1.55, -3.0], [1.55, -3.0], [-2.75, -3.1], [2.75, -3.1], [-2.15, -4.2], [2.15, -4.2], [-3.55, -4.0], [3.55, -4.0]];
const ease = (u) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };

/* W (wedding.js's state): its venue root, the set-up (W.w), the pirates (W.fig: you, partner, mis,
   guards, guests, raiders), the props' meshes (W.propG), the names, and W.say(fig, text) for a bubble.
   `done(skipped)` once it's over. */
export function ceremony(W, done) {
  const F = W.fig, herPartner = W.w.partner?.kind === 'her';
  const off = herPartner ? F.guards[0] : F.mis;
  const cakeG = W.propG.find((g) => g.userData.prop.k === 'cake' && !g.userData.prop.w);
  const script = plotScript(W.w.plot, !!cakeG);
  const plot = W.w.plot;
  const drunk = F.guests[2], [g0, g1] = F.guests;
  const who = {
    off, mis: F.mis, you: F.you, partner: F.partner, drunk,
    guest: plot === 'brawl' ? g0 : F.guests[3], guest2: plot === 'brawl' ? g1 : F.guests[4],
    guard: herPartner ? F.guards[1] : F.guards[0], raider: F.raiders[0],
  };
  // (somebody's had a few: a tankard in their hand, if they've not one already)
  if (plot === 'drunk' && drunk && drunk.look.hand !== 'tankard') { wearLook(drunk, { ...drunk.look, hand: 'tankard' }); drunk.g.userData.guest = 2; }
  const names = W.names();
  const seats = W.seats();
  const dyes = W.dyes();
  // Everyone to their places: seated, you at the altar, your partner at the aisle's foot.
  F.guests.forEach((g, i) => Object.assign(g, { x: seats[i].x, z: seats[i].z, yaw: seats[i].yaw, sit: seats[i].sit, y: 0 }));
  Object.assign(F.you, { x: COUPLE.you.x, z: COUPLE.you.z, yaw: Math.PI / 2 });
  Object.assign(F.partner, { x: AISLE_FOOT.x, z: AISLE_FOOT.z, yaw: Math.PI });
  Object.assign(off, { x: ALTAR.x, z: ALTAR.z, yaw: 0 });
  F.guards.forEach((g, i) => { if (g !== off) Object.assign(g, { x: GUARDS[i].x, z: GUARDS[i].z, yaw: i ? -Math.PI / 2 : Math.PI / 2 }); });
  // (the raiders come storming up from the back, wherever it is)
  F.raiders.forEach((r, i) => { Object.assign(r, { x: 1.6 + i * 0.9, z: 9 + i * 0.7, yaw: Math.PI, y: 0, gone: false, fly: null }); r.g.visible = false; r.g.rotation.set(0, Math.PI, 0); });
  [...F.guests, F.you, F.partner, F.mis, ...F.guards].forEach((p) => { p.g.rotation.set(0, p.yaw, 0); p.body.rotation.set(0, 0, 0); });
  const cakeAt = cakeG ? { x: cakeG.position.x, z: cakeG.position.z, y: cakeG.position.y } : null;
  const benches = W.propG.filter((g) => g.userData.prop.k === 'bench' && !g.userData.prop.w);

  const c = { t: 0, beatI: -1, cam: { look: V3(0, 1, -1), dist: 13, tilt: 0.35, yaw: 0 }, fx: 0, flew: new Set(), tick, end };
  const shot = (x, y, z, dist, tilt, yaw) => { c.cam.look.set(x, y, z); W.root.localToWorld(c.cam.look); Object.assign(c.cam, { dist: dist >= 8 ? dist * roomy() : dist, tilt, yaw }); };   // (the wide shots further back on a phone held upright; a close one'd back into the guests)
  const walk = (p, tx, tz, speed, dt) => { const there = stepTo(p, p, tx, tz, speed, dt); p.g.position.x = p.x; p.g.position.z = p.z; p.yaw = p.g.rotation.y; return there; };
  const still = (p, dt) => poseFig(p, dt);
  const turnTo = (p, yaw, dt) => { let d = yaw - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 6); };
  const confetti = (x, y, z, n = 10) => { const v = V3(x, y, z); W.root.localToWorld(v); for (const d of dyes) burst(v, W.hex(d), n, 3.2); };
  W.play = c;
  cinePlay(c);

  function enter(beat) {
    if (beat === 'storm') F.raiders.forEach((r) => { r.g.visible = true; });
    if (beat === 'storm' || beat === 'brawl' || beat === 'cheer') F.guests.forEach((g) => { if (g !== drunk || plot !== 'drunk') g.sit = false; });
    if (beat === 'argue' || beat === 'stagger') { (beat === 'argue' ? [g0, g1] : [drunk]).forEach((g) => { g.sit = false; }); }
    if (beat === 'cleared') F.guests.forEach((g, i) => { Object.assign(g, { x: seats[i].x, z: seats[i].z, yaw: seats[i].yaw, sit: seats[i].sit }); });
    if (beat === 'kiss') c.kissed = false;
  }
  function tick(dt) {
    const t = (c.t += dt), s = plotAt(script, t);
    if (s.done) { cineEnd(false); return; }
    if (s.i !== c.beatI) { c.beatI = s.i; enter(s.beat); }
    const b = s.beat, u = s.u, L = s.local;
    // The line being said, over whoever's saying it.
    if (s.line) W.say(who[s.line.who], fill(s.line.text, names)); else W.say(null);
    const all = [...F.guests, F.you, F.partner, F.mis, ...F.guards];
    all.forEach(restArms);
    const moving = new Set();
    const go = (p, tx, tz, sp) => { moving.add(p); return walk(p, tx, tz, sp, dt); };

    if (b === 'seated') shot(0, 1.1, -0.5, 13.5, 0.36, 0.0);
    else if (b === 'procession') {
      const there = go(F.partner, COUPLE.partner.x, COUPLE.partner.z, 2.1);
      if (there) { moving.delete(F.partner); turnTo(F.partner, -Math.PI / 2, dt); }
      shot(F.partner.x, 1.3, F.partner.z, 5.2, 0.2, Math.PI + 0.3);
    } else if (b === 'vows' || b === 'ido' || b === 'sweet' || b === 'calm') {
      Object.assign(F.partner, { x: COUPLE.partner.x, z: COUPLE.partner.z }); turnTo(F.partner, -Math.PI / 2, dt);
      const sp = s.line && who[s.line.who];
      if (b === 'calm' || (sp && sp !== F.you && sp !== F.partner && sp !== off)) shot(sp ? sp.x : 0, 1.4, sp ? sp.z : -3.7, 4.2, 0.12, 0.3);
      else if (sp === F.you) shot(F.you.x + 0.3, 1.45, F.you.z, 3.3, 0.12, 1.25);
      else if (sp === F.partner) shot(F.partner.x - 0.3, 1.45, F.partner.z, 3.3, 0.12, -1.25);
      else shot(0, 1.4, -3.8, 3.8, 0.2, 0.42);
      if (b === 'sweet') {
        // Holding hands, and the odd heart floating up.
        F.you.arms[0].rotation.set(-0.7, 0, 0.35); F.partner.arms[1].rotation.set(-0.7, 0, -0.35);
        if ((c.fx -= dt) < 0) { c.fx = 1.1; heartsUp(W.root, 0, 1.7, -3.7, 2); }
        const sniff = who.guest; if (s.line?.who === 'guest') { sniff.arms[0].rotation.x = -2.2; sniff.y = Math.abs(Math.sin(t * 9)) * 0.03; }
      }
    } else if (b === 'storm' || b === 'fight' || b === 'cleared') raid(b, u, L, dt, go, moving);
    else if (b === 'stagger' || b === 'topple') tipsy(b, u, L, t, dt, go, moving);
    else if (b === 'argue' || b === 'brawl' || b === 'sorry') brawl(b, u, L, t, dt, go, moving);
    else if (b === 'kiss') {
      const k = ease(u * 2.5);
      F.you.x = COUPLE.you.x + 0.33 * k; F.partner.x = COUPLE.partner.x - 0.33 * k;
      F.you.yaw = Math.PI / 2; F.partner.yaw = -Math.PI / 2;
      const lean = 0.24 * ease((u - 0.25) * 4) * (1 - ease((u - 0.8) * 5));
      F.you.body.rotation.x = lean; F.partner.body.rotation.x = lean;
      if (!c.kissed && u > 0.42) { c.kissed = true; heartsUp(W.root, 0, 1.8, -3.7, 14); confetti(0, 3, -3.7, 14); W.shake?.(); }
      shot(0, 1.5, -3.75, 2.7, 0.2, 0.12);   // (close, over the front row's heads)
    } else if (b === 'cheer' || b === 'portrait') gather(b, u, t, dt, go, moving);
    // Everyone not walking stands (or sits) where they are.
    for (const p of all) if (!moving.has(p)) still(p, dt);
    for (const r of F.raiders) if (r.g.visible && !moving.has(r) && !r.fly) still(r, dt);
    if (b !== 'kiss' && b !== 'portrait') { F.you.body.rotation.x = 0; F.partner.body.rotation.x = 0; }
  }

  // ---- Raiders crash it ----
  function raid(b, u, L, dt, go, moving) {
    const R = F.raiders, G = F.guards;
    if (b === 'storm') {
      R.forEach((r, i) => { if (go(r, 3.4 + i * 0.5, -1.4 + i * 1.3, 4.6)) { moving.delete(r); r.yaw = -Math.PI / 2; } swing(r, L, i); });
      F.guests.forEach((g) => { if (g !== drunk || plot !== 'drunk') g.body.rotation.x = -0.15; });   // (leaning back, aghast)
      shot(2.4, 1.2, -0.2, 7.8, 0.3, 0.3);   // (kept inside the venue: the chapel's walls)
    } else if (b === 'fight') {
      // Each guard takes one on (the first, two), and off they go into the sea, one by one.
      const KO = [2.0, 3.4, 4.8];
      R.forEach((r, i) => {
        const g = G[i === 1 ? 1 : 0], mine = i === 2 ? L > KO[0] : true;
        if (!r.gone && L > KO[i]) { r.gone = true; r.fly = { vx: 5 + i, vy: 6.5, spin: 9 }; burstAt(r.x, 1.2, r.z, '#ffffff'); }
        if (r.fly) {
          r.fly.vy -= 14 * dt; r.x += r.fly.vx * dt; r.y += r.fly.vy * dt;
          r.g.position.set(r.x, r.y, r.z); r.g.rotation.z += r.fly.spin * dt; moving.add(r);
          if (r.y < -4) r.g.visible = false;
        } else swing(r, L, i);
        if (mine && !r.gone) { if (go(g, r.x - 0.95, r.z, 5.5)) { moving.delete(g); g.yaw = Math.PI / 2; } swing(g, L, i + 3); }
      });
      shot(2.6, 1.2, -0.6, 7.6, 0.3, 0.32);
    } else {
      G.forEach((g, i) => {
        const home = g === off ? ALTAR : GUARDS[i];
        if (go(g, home.x, home.z, 4)) { moving.delete(g); g.yaw = g === off ? 0 : i ? -Math.PI / 2 : Math.PI / 2; }
        g.arms[1].rotation.x = 0;
      });
      shot(off.x, 1.4, off.z, 4.6, 0.14, 0.3);
    }
  }
  // A cutlass swinging away.
  function swing(p, L, i) { p.arms[1].rotation.x = -1.5 + Math.sin(L * 13 + i * 2) * 0.9; p.arms[0].rotation.x = -0.4 + Math.sin(L * 9 + i) * 0.3; }
  function burstAt(x, y, z, col, n = 14) { const v = V3(x, y, z); W.root.localToWorld(v); burst(v, col, n, 3); }

  // ---- Somebody's drunk ----
  function tipsy(b, u, L, t, dt, go, moving) {
    const target = cakeAt ? { x: cakeAt.x, z: cakeAt.z + 0.75 } : { x: 1.4, z: -2.0 };
    if (b === 'stagger') {
      // Out into the aisle, then a wobbly way over to the cake, swaying, the tankard going.
      const aisle = Math.abs(drunk.x) > 0.6 && !c.inAisle;
      const tx = aisle ? Math.sign(drunk.x) * 0.3 : target.x, tz = aisle ? drunk.z : target.z;
      if (aisle && Math.abs(drunk.x) < 0.4) c.inAisle = true;
      if (!go(drunk, tx + Math.sin(t * 2.7) * 0.6, tz, 0.95)) { /* still on the way */ } else moving.delete(drunk);
      drunk.body.rotation.z = Math.sin(t * 2.4) * 0.22;
      drunk.arms[0].rotation.x = -1.3 + Math.sin(t * 3.1) * 0.6;
      if (s0(L, 0.3, 1.6)) drunk.y = Math.abs(Math.sin(L * 12)) * 0.07;   // (hic!)
      shot(drunk.x, 1.2, drunk.z, 6.2, 0.25, 0.55);
    } else {
      drunk.keepLegs = true;
      const tip = cakeAt ? (cakeAt.y > 0.3 ? 1.12 : 1.48) : 1.5;
      drunk.x += (target.x - drunk.x) * Math.min(1, dt * 4); drunk.z += (target.z - drunk.z) * Math.min(1, dt * 4);
      drunk.yaw = Math.atan2(cakeAt ? cakeAt.x - drunk.x : 0, cakeAt ? cakeAt.z - drunk.z : -1);
      const k = ease((u - 0.12) / 0.25);
      drunk.g.rotation.x = tip * k;
      drunk.body.rotation.z = (1 - k) * Math.sin(t * 2.4) * 0.22;
      drunk.legs.forEach((l, i) => { l.rotation.x = k * (0.5 + Math.sin(t * 16 + i * 2) * 0.35 * (u > 0.4 && u < 0.75 ? 1 : 0)); });
      if (!c.splat && u > 0.36) {
        c.splat = true;
        if (cakeG?.userData.cake) { cakeG.userData.cake.scale.set(1.35, 0.3, 1.35); burstAt(cakeAt.x, cakeAt.y + 0.3, cakeAt.z, '#fff6e8', 26); burstAt(cakeAt.x, cakeAt.y + 0.3, cakeAt.z, W.hex(cakeG.userData.prop.c), 14); }
        else burstAt(drunk.x, 0.2, drunk.z - 1, '#e8d8b0', 18);
        W.shake?.();
      }
      shot((drunk.x + target.x) / 2, 0.6, target.z - 0.4, 4.8, 0.36, -Math.sign(target.x || -1) * 1.25);   // (from the side, face down in it; from the middle, so no wall's in the way)
    }
  }
  const s0 = (L, a, b) => L > a && L < b;

  // ---- A brawl breaks out ----
  function brawl(b, u, L, t, dt, go, moving) {
    if (b === 'argue') {
      if (go(g0, -0.45, -0.9, 2.2)) { moving.delete(g0); g0.yaw = Math.PI / 2; }
      if (go(g1, 0.45, -0.9, 2.2)) { moving.delete(g1); g1.yaw = -Math.PI / 2; }
      [g0, g1].forEach((g, i) => { g.arms[0].rotation.x = -1.7 + Math.sin(t * 10 + i * 3) * 0.5; g.y = Math.abs(Math.sin(t * 6 + i)) * 0.04; });
      shot(0, 1.35, -0.9, 4.6, 0.15, 0.45);
    } else if (b === 'brawl') {
      // Everyone at it, fists going, and the benches thrown about (they land overturned).
      F.guests.forEach((g, i) => {
        g.yaw += Math.sin(t * 2 + i) * dt * 2;
        g.arms[i % 2].rotation.x = -1.6 + Math.sin(t * 14 + i * 1.7) * 1.0;
        g.arms[(i + 1) % 2].rotation.x = -0.9 + Math.cos(t * 11 + i) * 0.6;
        g.y = Math.abs(Math.sin(t * 7 + i * 1.3)) * 0.12;
        g.x += Math.sin(t * 1.7 + i * 2.1) * dt * 0.8; g.z += Math.cos(t * 1.3 + i) * dt * 0.6;
      });
      benches.forEach((bg, i) => {
        const at = 0.5 + i * 0.55;
        if (L < at) return;
        let f = bg.userData.fly;
        if (!f) {
          const a = i * 2.4;
          f = bg.userData.fly = { vx: Math.cos(a) * 2.6, vz: Math.sin(a) * 2.2, vy: 6 + (i % 3), spin: (i % 2 ? 1 : -1) * 5, y: 0, landed: false };
          burstAt(bg.position.x, 0.4, bg.position.z, '#d8c09a', 10);
        }
        if (f.landed) return;
        f.vy -= 14 * dt; f.y += f.vy * dt;
        bg.position.x = Math.max(-6.5, Math.min(6.5, bg.position.x + f.vx * dt)); bg.position.z = Math.max(-6, Math.min(7, bg.position.z + f.vz * dt));
        bg.rotation.x += f.spin * dt; bg.rotation.z += f.spin * 0.4 * dt;
        bg.position.y = Math.max(0, f.y);
        if (f.y <= 0 && f.vy < 0) { f.landed = true; bg.rotation.set(Math.PI / 2 * (i % 2 ? 1 : -1), bg.rotation.y, 0); bg.position.y = 0.24; burstAt(bg.position.x, 0.2, bg.position.z, '#d8c09a', 8); W.shake?.(); }
      });
      shot(0, 1, -0.2, 12.5, 0.45, 0.45 + L * 0.06);
    } else {
      F.guests.forEach((g) => { g.y = 0; g.body.rotation.x = 0.28; g.arms.forEach((a) => { a.rotation.x = 0; }); });
      shot(g0.x, 1.3, g0.z, 4, 0.14, 0.4);
    }
  }

  // ---- I do, and everyone gathered round for the portrait ----
  function gather(b, u, t, dt, go, moving) {
    const k = b === 'portrait' ? 1 : ease(u * 1.6);
    F.you.x = COUPLE.you.x + 0.2; F.you.z = COUPLE.you.z - 0.2; F.partner.x = COUPLE.partner.x - 0.2; F.partner.z = COUPLE.partner.z - 0.2;
    turnTo(F.you, 0, dt); turnTo(F.partner, 0, dt);
    let n = 0;
    F.guests.forEach((g) => {
      if (plot === 'drunk' && g === drunk) return;   // (they stay in the cake)
      const [x, z] = SPOTS[n++];
      g.body.rotation.x = 0; g.body.rotation.z = 0;
      if (b === 'cheer' && go(g, x, z, 2.6)) moving.delete(g);
      if (!moving.has(g)) { turnTo(g, 0, dt); g.arms.forEach((a, j) => { a.rotation.x = b === 'cheer' ? -2.6 - Math.sin(t * 9 + n + j) * 0.3 : 0; }); g.y = b === 'cheer' ? Math.abs(Math.sin(t * 8 + n)) * 0.18 : 0; }
    });
    if (F.mis !== F.partner && F.mis !== off) { if (b === 'cheer' && go(F.mis, -4.4, -3.4, 2.4)) moving.delete(F.mis); if (!moving.has(F.mis)) turnTo(F.mis, 0, dt); }
    turnTo(off, 0, dt);
    F.guards.forEach((g, i) => { if (g === off) return; if (b === 'cheer' && go(g, i ? 4.6 : -4.6, -4.3, 2.6)) moving.delete(g); if (!moving.has(g)) turnTo(g, 0, dt); });
    if (b === 'cheer' && (c.fx -= dt) < 0) { c.fx = 0.6; confetti((Math.random() - 0.5) * 4, 3.2, -3.4, 5); heartsUp(W.root, (Math.random() - 0.5) * 2, 2, -3.6, 2); }
    const P = PORTRAIT_CAM;
    shot(0, P.look.y, P.look.z, P.dist + (1 - k) * 2, P.tilt, P.yaw);
  }

  /* The last shot: everyone where they'd be for the portrait, and the plot's aftermath (raiders gone,
     benches overturned, a guest face down in the cake). Played out or skipped. */
  function end(skip) {
    W.play = null;
    W.say(null);
    if (skip) {
      F.raiders.forEach((r) => { r.g.visible = false; });
      if (plot === 'brawl') benches.forEach((bg, i) => { bg.position.set(bg.position.x + Math.cos(i * 2.4) * 2.4, 0.24, bg.position.z + Math.sin(i * 2.4) * 2); bg.rotation.set(Math.PI / 2 * (i % 2 ? 1 : -1), bg.rotation.y, 0); });
      if (plot === 'drunk') {
        const target = cakeAt ? { x: cakeAt.x, z: cakeAt.z + 0.75 } : { x: 1.4, z: -2.0 };
        Object.assign(drunk, { x: target.x, z: target.z, sit: false, y: 0, yaw: cakeAt ? Math.atan2(cakeAt.x - target.x, cakeAt.z - target.z) : Math.PI });
        drunk.g.rotation.x = cakeAt ? (cakeAt.y > 0.3 ? 1.12 : 1.48) : 1.5;
        drunk.legs.forEach((l) => { l.rotation.x = 0.5; });
        drunk.keepLegs = true;
        cakeG?.userData.cake?.scale.set(1.35, 0.3, 1.35);
      }
    }
    let n = 0;
    F.guests.forEach((g) => {
      if (plot === 'drunk' && g === drunk) return;
      const [x, z] = SPOTS[n++];
      Object.assign(g, { x, z, yaw: 0, sit: false, y: 0 });
      g.body.rotation.set(0, 0, 0); g.arms.forEach((a) => { a.rotation.x = 0; });
    });
    Object.assign(F.you, { x: COUPLE.you.x + 0.2, z: COUPLE.you.z - 0.2, yaw: 0 }); Object.assign(F.partner, { x: COUPLE.partner.x - 0.2, z: COUPLE.partner.z - 0.2, yaw: 0 });
    F.you.body.rotation.set(0, 0, 0); F.partner.body.rotation.set(0, 0, 0); F.you.arms.forEach((a) => a.rotation.set(0, 0, 0)); F.partner.arms.forEach((a) => a.rotation.set(0, 0, 0));
    Object.assign(off, { x: ALTAR.x, z: ALTAR.z, yaw: 0 });
    if (F.mis !== F.partner && F.mis !== off) Object.assign(F.mis, { x: -4.4, z: -3.4, yaw: 0 });
    F.guards.forEach((g, i) => { if (g !== off) Object.assign(g, { x: i ? 4.6 : -4.6, z: -4.3, yaw: 0 }); g.arms[1].rotation.x = 0; });
    for (const p of [...F.guests, F.you, F.partner, F.mis, ...F.guards]) { restArms(p); poseFig(p, 0.016); }
    done(skip);
  }
  return c;
}
/** How much room a prop needs (for the planner's picking). */
export const propRoom = (p) => PROP_R[p.k] ?? 0.5;
