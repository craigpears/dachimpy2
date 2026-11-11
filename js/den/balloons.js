/* Balloons, blown up in anyone's hands, played onto a real Sailing board (the rules: src/balloons.ts, a
   show of Sailing's pieces as balloons; src/sailing.ts, the puzzle). A piece for any scene,
   like the furniture: give it a talking pirate (props-people.js's person()) and where the board stands,
   and play it a BalloonShow. Knows nothing of who's blowing them up: an island's config says (src/den-tzz.ts:
   Tzz's lesson).

   What's drawn (the user, 11 Nov, of a first go: "it's not really a real looking sailing board, it's
   just things stacked on each other"; "the visual appearance between when it's in her hand and when
   it's on the board is too different"; "it goes really quickly in her hand"):
   - the board: the den's own Sailing board (sail-board.js, drawn off the page onto a picture on a
     stand), its platforms, its balloons, its falling pair steered down by the moves a player makes,
     its pops and the chain's name climbing, exactly as at sea;
   - then the last pair's yours ("she sets up the balloons, you do the pop"): it comes in at the top
     and falls by itself, and you steer and drop it with Sailing's own keys (A D or the arrows move it,
     W Q E turn it, S or Space drops it). Set the chain off and it pops; miss, and the board's put back
     as she left it for another go, while she eggs you on; miss three times and she shows you;
   - in the performer's hands, the very balloons that go on it, the board's own drawing of them, big
     enough to see from the camera, the performer turned to it: one blown up at the mouth in three
     puffs, tied off with a squeak and brought down to the hands; the second the same, squeak; the
     board's brown peg joining them; held up, and tossed in an arc onto the top of the board, shrinking
     to the board's size as it goes, where it comes in as the falling pair. Round balloons only, in the
     board's three colours: nothing long, nothing with knobs on (the user: "be careful about that"). */
import * as THREE from 'three';
import { SailPair } from '../sail-pair.js';
import { SPAWN } from '../sailing.js';
import { layout, setup, SHOW } from '../balloons.js';
import { mat, mesh, woodTex, V3 } from './world.js';
import { balloon, sailBoardCanvas, sailBoardLay, sailBoardDrop, sailBoardTick, sailBoardBusy, sailBoardSnap, SAIL_BOARD } from './sail-board.js';

/** What the performer's doing on each kind of beat (props-people.js's IDLES). */
const IDLE_FOR = { start: 'talk', twist: 'twist', fall: 'talk', pop: 'tada', after: 'clap' };

const texOf = new Map();
const artTex = (c) => {
  if (!texOf.has(c)) { const t = new THREE.CanvasTexture(balloon(c)); t.colorSpace = THREE.SRGBColorSpace; texOf.set(c, t); }
  return texOf.get(c);
};
const ease = (u) => u * u * (3 - 2 * u);
const clamp = (u) => Math.max(0, Math.min(1, u));

/** The board on its stand, and its show: see the top of this file. `performer`: a person() (its p the
    figure, its chatter for lines); `parent`, and where the board stands in it (x, y its ground, z), the
    way it faces (`yaw`: its front), and how tall its picture is (`tall`, metres). */
export function balloonStand({ performer, parent, x = 0, y = 0, z = 0, yaw = 0, tall = 3 }) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = yaw;
  parent.add(g);
  const wood = mat('#6a4428', { map: woodTex }), LIFT = 0.45, wide = tall * SAIL_BOARD.W / SAIL_BOARD.H;
  // The board: the den's Sailing board, drawn off the page, on a picture standing on two legs.
  const B = sailBoardCanvas(1.8), tex = new THREE.CanvasTexture(B.cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const pic = mesh(new THREE.PlaneGeometry(wide, tall), new THREE.MeshBasicMaterial({ map: tex, transparent: true }), false);
  pic.position.set(0, LIFT + tall / 2, 0);
  g.add(pic);
  const back = mesh(new THREE.BoxGeometry(wide + 0.08, tall + 0.08, 0.06), wood);
  back.position.set(0, LIFT + tall / 2, -0.05);
  g.add(back);
  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.09, LIFT + tall * 0.4, 0.09), wood);
    leg.position.set(s * wide * 0.38, (LIFT + tall * 0.4) / 2, -0.1);
    g.add(leg);
    const prop = mesh(new THREE.BoxGeometry(0.07, tall * 0.9, 0.07), wood);
    prop.position.set(s * wide * 0.3, tall * 0.42, -0.5);
    prop.rotation.x = -0.3;
    g.add(prop);
  }
  // A point on the board's picture, in the stand's space: (bx, by) in the board's own pixels.
  const onBoard = (bx, by) => V3((bx / SAIL_BOARD.W - 0.5) * wide, LIFT + tall * (1 - by / SAIL_BOARD.H), 0.04);
  const cellM = (wide * 40) / SAIL_BOARD.W;   // (a square of it, in metres)

  // The pair in hand: the board's own balloons, as sprites, and the board's brown peg. Big enough to
  // read from the lesson's camera, six metres off (the user, 11 Nov: "she kind of twists her hands.
  // Nothing's actually happening": they were 0.42 m, blown up at her fists while she stood side-on to
  // the camera, turned to the sloop, so all you saw was her hands).
  const HAND = 0.56;
  const sprite = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: artTex(0), transparent: true })); s.renderOrder = 4; return s; };
  const held = new THREE.Group(), halves = [sprite(), sprite()], peg = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), mat('#6b4220'), false);
  held.add(...halves, peg);
  held.visible = false;
  g.add(held);
  const squeaks = [];

  const S = { show: null, game: null, pair: null, falling: false, done: 0, fallT: 0, route: null, rest: performer.idle, mine: false, redo: false, help: null, auto: false };
  const v = new THREE.Vector3(), w2 = new THREE.Vector3();
  // The performer's hands, in the stand's own space.
  // (where she holds the pair, in the stand's space: in front of her, at her waist, toward the camera;
  // from where she stands rather than her hands, so it doesn't jig about as her arms move)
  function hands() {
    const P = performer.p;
    P.g.updateMatrixWorld(true);
    P.g.localToWorld(v.set(0, 1.0, 0.45));
    g.updateMatrixWorld(true);
    return g.worldToLocal(v.clone());
  }
  // Her mouth, in the stand's space, where each balloon's blown up.
  function mouth() {
    const P = performer.p;
    P.g.updateMatrixWorld(true);
    P.body.localToWorld(v.set(0, 0.87, 0.3));
    g.updateMatrixWorld(true);
    return g.worldToLocal(v.clone());
  }
  function say(text, secs) {
    const C = performer.chatter;
    C.say(text);
    if (C.line) C.line.secs = secs;
    performer.show();
  }
  // An act: its board laid out, as dealt for it (src/balloons.ts's layout).
  function act(k) {
    const r = S.show.acts[k].routine;
    S.game = layout(r);
    S.game.next = [...(r.twists[1] ?? r.twists[0]).pair];
    S.pair = new SailPair(S.game);
    S.falling = false;
    sailBoardLay(B, S.game);
  }
  // Your pair's landed: on the board, and the show told what it set off.
  function landed(res) {
    S.mine = false;
    if (!res.dropped) return;
    sailBoardDrop(B, res, S.game);
    sailBoardSnap(B);
    const r = S.show.played(res.steps);
    if (!r || r.result === 'hit') return;
    // (a miss: once your drop's played out, the board as she left it, and another go; or she shows you)
    S.redo = true;
    for (const e of r.events) if (e.kind === 'line') say(e.text, e.secs); else if (e.kind === 'fall') S.help = e.route;
  }
  function again() {
    const b = S.show.beat(), r = S.show.acts[b.act].routine, n = r.twists.length - 1, t = r.twists[n];
    S.game = setup(r, n);
    S.game.next = [t.pair[0], t.pair[1]];
    S.pair = new SailPair(S.game);
    sailBoardLay(B, S.game);
    sailBoardSnap(B);
    S.redo = false;
    if (S.help) { Object.assign(S, { falling: true, auto: true, route: S.help, done: 0, fallT: 0, help: null }); return; }
    S.mine = true;
  }
  // The pair steered down its route, a move at a time, up to `n` moves (sail-pair.js's own moves).
  function steer(n) {
    const P = S.pair;
    for (; S.done < Math.min(n, S.route.length); S.done++) {
      const st = S.route[S.done];
      if (st === 'left') P.slide(-1); else if (st === 'right') P.slide(1);
      else if (st === 'turnR') P.turnBy(1); else if (st === 'turnL') P.turnBy(-1);
      else P.row++;
    }
  }
  // Her pair comes to rest at the end of its route, and lands.
  function land() {
    steer(S.route.length);
    const res = S.pair.slam();
    S.falling = false; S.auto = false;
    sailBoardDrop(B, res, S.game);
    sailBoardSnap(B);
  }
  // "Squeak!" over the balloon just twisted off.
  function squeak(half) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    const x2 = cv.getContext('2d');
    x2.font = "700 54px 'Alegreya', serif"; x2.textAlign = 'center'; x2.textBaseline = 'middle';
    x2.lineWidth = 10; x2.strokeStyle = '#2a1608'; x2.strokeText('squeak!', 128, 48);
    x2.fillStyle = '#fff6c8'; x2.fillText('squeak!', 128, 48);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(0.8, 0.3, 1); s.renderOrder = 5;
    const at = mouth();
    s.position.set(at.x + (half ? 0.45 : -0.45), at.y + 0.3, at.z + 0.3);
    g.add(s);
    squeaks.push({ s, t: 0 });
  }
  /* The pair in hand, `u` through it (the user, 11 Nov: "Maybe it would be simpler just to be like,
     they're balloons and she's blowing them up"): each balloon, the board's own drawing of it, blown up
     at her mouth in three puffs from a little limp one to full size, its knot to her lips; tied off
     (squeak) and brought down into her hands, the first to her left; the second blown up the same; the
     board's brown peg joining them; held up, and tossed in an arc onto the top of the board, shrinking
     to the board's size, where it comes in as the falling pair. Round balloons only, in the board's
     three colours ("be careful about that"). */
  function blown(w) {
    // (three puffs, each a quick breath in and a pause; a limp little balloon to start)
    const puffs = clamp((w - 0.06) / 0.76) * 3, n = Math.floor(puffs), f = puffs - n;
    return 0.16 + 0.84 * Math.min(1, (n + ease(clamp(f / 0.6))) / 3);
  }
  function inHand(tw) {
    const u = tw.u, [s0, s1] = SHOW.SQUEAKS, T = SHOW.TOSS, at = hands(), lips = mouth();
    halves[0].material.map = artTex(tw.pair[0]); halves[1].material.map = artTex(tw.pair[1]);
    const now = performance.now() / 1000;
    let size = HAND, cx = at.x, cy = at.y, cz = at.z;
    if (u > T) {
      // Tossed: an arc from the hands to the top of the board, shrinking to the board's own size.
      const f = ease(clamp((u - T) / (1 - T))), to = onBoard(SAIL_BOARD.x(SPAWN[0] + 0.5), SAIL_BOARD.y(0));
      cx += (to.x - at.x) * f; cy += (to.y - at.y) * f + Math.sin(f * Math.PI) * 0.9; cz += (to.z - at.z) * f;
      size = HAND + (cellM - HAND) * f;
    } else if (u > s1) cy += ease(clamp((u - s1) / (T - s1))) * 0.25;
    held.position.set(cx, cy, cz);
    // Each balloon: blown up at her lips over [a, b], then tied off and brought down to its place in
    // her hands (`side`: -1 her left, +1 her right) over the next little while.
    const one = (h, a, b, side) => {
      const s = halves[h], home = V3(side * size * 0.5, 0, 0);
      if (u < a) { s.visible = false; return; }
      s.visible = true;
      s.material.rotation = 0;
      const w = clamp((u - a) / (b - a)), down = ease(clamp((u - b) / 0.08));
      const sq = Math.max(0, 1 - Math.abs(u - b) * 25) * 0.22;   // (a squash as it's tied off)
      if (w < 1 || down < 1) {
        // At her lips: out in front of her face and up a little, its knot to her mouth, swelling.
        const k = blown(w), r = HAND * k * 0.5, wob = Math.sin(now * 13 + h) * 0.04 * (w < 1 ? 1 : 0);
        const d = V3(0.35 * side, 0.45, 0.82).normalize(), c = lips.clone().addScaledVector(d, r * 1.05 + 0.03).sub(held.position);
        s.position.copy(c.lerp(home, down));
        s.scale.set(HAND * k * (1 + wob + sq), HAND * k * (1 - wob - sq), 1);
        s.material.rotation = (1 - down) * Math.atan2(-d.x, d.y);
        return;
      }
      s.position.copy(home);
      s.scale.set(size * (1 + sq), size * (1 - sq), 1);
    };
    one(0, 0.02, s0, -1);
    one(1, s0 + 0.1, s1, 1);
    peg.position.set(0, 0, 0.02);
    peg.visible = u > s1;
    peg.scale.setScalar(size / HAND);
    held.visible = true;
  }

  return {
    g,
    /** Plays a show (src/balloons.ts's BalloonShow) from its start. */
    play(show) {
      S.show = show;
      // (turned to her audience, the way her board faces, the camera's: not to the sloop)
      g.updateMatrixWorld(true);
      const front = g.localToWorld(V3(0, 0, 40));
      performer.lookAt = { x: front.x, z: front.z };
      performer.chatty = false;
      performer.hush();
      act(0);
    },
    /** It's playing. */
    playing: () => !!S.show,
    /** Stops it where it is (or it's done): the performer back to themselves. */
    stop() {
      if (!S.show) return;
      Object.assign(S, { show: null, falling: false, mine: false, redo: false, help: null, auto: false });
      held.visible = false;
      performer.lookAt = null;
      performer.chatty = true;
      performer.setIdle(S.rest);
      performer.hush();
    },
    handle(events) {
      for (const e of events) {
        if (e.kind === 'act') act(e.act);
        else if (e.kind === 'line') say(e.text, e.secs);
        else if (e.kind === 'squeak') squeak(e.half);
        else if (e.kind === 'fall') {
          // In at the top of the middle columns, as on the board at sea, and steered down to rest.
          const r = S.show.acts[e.act].routine, t = r.twists[e.twist], nx = r.twists[e.twist + 1] ?? t;
          S.game.pair = [t.pair[0], t.pair[1]]; S.game.next = [nx.pair[0], nx.pair[1]];
          S.pair.reset(); sailBoardSnap(B);
          Object.assign(S, { falling: true, route: e.route, done: 0, fallT: 0 });
          held.visible = false;
        } else if (e.kind === 'land') land();
        else if (e.kind === 'yours') {
          // Your turn: the last pair in at the top, falling by itself, yours to steer and drop.
          const t = S.show.acts[e.act].routine.twists[e.twist];
          S.game.pair = [t.pair[0], t.pair[1]]; S.game.next = [t.pair[0], t.pair[1]];
          S.pair.reset(); sailBoardSnap(B);
          S.mine = true;
        } else if (e.kind === 'done') this.stop();
      }
    },
    /** Sailing's keys on your turn (true if it took the key); Space before then is on to her next beat. */
    key(k) {
      if (!S.show) return false;
      if (S.mine && S.show.yours) {
        const P = S.pair;
        if (k === 'a' || k === 'arrowleft') P.slide(-1);
        else if (k === 'd' || k === 'arrowright') P.slide(1);
        else if (k === 'w' || k === 'e' || k === 'arrowup') P.turnBy(1);
        else if (k === 'q') P.turnBy(-1);
        else if (k === 's' || k === 'arrowdown' || k === ' ' || k === 'enter') landed(P.slam());
        else return false;
        return true;
      }
      if (k === ' ' || k === 'enter') { if (!S.show.yours && !S.falling) this.handle(S.show.skip()); return true; }
      return false;
    },
    /** What the keys do just now, for the foot of the screen. */
    prompt() {
      if (S.show?.yours && S.mine) return 'Your turn · A D or ← → move · W Q E turn · S or Space drop · Esc: skip the lesson';
      return S.show?.yours ? 'Esc: skip the lesson' : 'Space: next · Esc: skip the lesson';
    },
    /** Each tick: the show's clock (held while the board plays a chain out, and on your turn), the pair
        in hand or falling, yours falling by itself, the board drawn. */
    tick(dt) {
      const sh = S.show;
      if (sh) {
        this.handle(sh.tick(dt, sailBoardBusy(B) || S.falling || S.redo || S.mine));
        if (S.show) {
          const now = sh.now();
          // (blowing them up, both hands at her mouth; then holding the pair)
          const blowing = now.twisting && now.twisting.u < SHOW.SQUEAKS[1];
          performer.setIdle(S.mine ? 'clap' : blowing ? 'blow' : IDLE_FOR[now.beat.kind] ?? 'sway');
          if (now.twisting) inHand(now.twisting); else held.visible = false;
          if (S.falling) {
            S.fallT += dt; steer(Math.floor(S.fallT / SHOW.STEP));
            if (S.auto && S.fallT >= S.route.length * SHOW.STEP + SHOW.LAND) land();
          }
          if (S.mine && !sailBoardBusy(B)) { const res = S.pair.tick(dt); if (res) landed(res); }
          if (S.redo && !sailBoardBusy(B)) again();
        }
      }
      for (const q of squeaks) { q.t += dt; q.s.position.y += dt * 0.5; q.s.material.opacity = Math.max(0, 1 - q.t / 0.9); if (q.t > 0.9) g.remove(q.s); }
      squeaks.splice(0, squeaks.length, ...squeaks.filter((q) => q.t <= 0.9));
      sailBoardTick(B, dt, S.falling || S.mine ? S.pair : null, null);
      tex.needsUpdate = true;
    },
  };
}
