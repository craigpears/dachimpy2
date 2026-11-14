/* People for any scene, placed and configured like furniture (the user, 11 Nov: "a pirate with a
   configurable loop of text, and obviously animations ... modular as well. So you can choose what
   animation they stand there doing and use that generally everywhere"; and "Kikkit should just be a bit
   of config"). Creatures (a yeti, the vampire, a familiar, a penguin) are in creatures.js, the same way.

   person({ look, parent, x, y, z, yaw, scale, idle, script, lines, loop, random, gap, wait, secs, begun,
   say, bubble, shown, tall, earshot, face }) is a pirate from a look standing in a scene doing an idle
   animation picked by name from IDLES (swaying, a tipsy sway with a swig, talking, waving, clapping,
   painting, giggling, cowering, screaming, twisting a balloon, ta-da, a hug, holding something out...),
   holding what that idle holds (HOLDS: a brush to paint, a plate of cookies to offer, held.js's pieces, the
   wardrobe's too; nothing, its own put away, to hug), and, if it's given
   something to say, saying it:
   - what, and in what order: `script` (src/chatter.ts's Script: an intro once, then a loop for ever, the
     intro retold after each time round if it says, asides by name), or just `lines`, round and round
     (`loop`, in turn or `random`) or once; a pause between (`gap`, seconds, or [least, most]), `wait`
     before the first, each line up for `secs(text)` (as long as it takes to read); `begun` false and it
     waits for start() (Kikkit, till you first sail up);
   - where: in its scene's speech bubbles (`say(figure, text)`: a house's), or (`bubble: 'page'`) its own
     bubble on the page over its head (`tall` up, times its scale), shown while `shown()` says (at sea);
   - only while `earshot()` says you're near enough to hear (out of it, it finishes its line and stops);
   - and, with `face()` (where whoever's near is, { x, z } in the world, or null), turned to them, else
     back to its `yaw`.
   Its `p` is the figure (g, arms, legs, body, x, z), for walking about; each tick, tick(dt, moving)
   animates it (moving: legs going, else its idle, gesturing as it talks if its idle does). */
import * as THREE from 'three';
import { makePirate, animateWalk } from './world.js';
import { familiarTick } from '../den-look.js';
import { Chatter, PACE } from '../chatter.js';
import { readSecs, CANVAS, brushReach } from '../den-houses.js';
import { fright } from './creatures.js';
import { bubble as pageBubble, bubbleAt } from './cine.js';
import { HELD, inHand } from './held.js';

const rest = (p) => {
  p.arms.forEach((a) => a.rotation.set(0, 0, 0));
  p.body.rotation.set(0, 0, 0);
  p.body.position.y = 0.72;
};
/** Hands going as it talks (`k`, 0 to 1, how much): over whatever its arms were doing. */
const gesture = (p, t, k) => {
  const [a, b] = p.arms;
  a.rotation.x -= k * 0.8; a.rotation.z -= k * 0.4;
  b.rotation.x -= k * 1.2; b.rotation.z += k * 0.6 * Math.sin(t * 5);
};
/** The idle animations, by name: each poses a figure (p) at time t (seconds), `talking` or not. Any figure
    from the wardrobe (or with the same parts: arms, legs, body) can do any of them. */
export const IDLES = {
  /** Just standing. */
  stand: (p) => rest(p),
  /** Standing, swaying gently from foot to foot. */
  sway: (p, t) => { rest(p); p.body.rotation.z = Math.sin(t * 1.3) * 0.035; p.arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.06; }); },
  /** A bit drunk: swaying right over, a long swig from whatever's in its hand now and then, and its hands
      going as it talks (Kikkit and her jug). */
  tipsy: (p, t, talking) => {
    rest(p);
    p.body.rotation.z = Math.sin(t * 1.1) * 0.12;
    p.arms[0].rotation.x = -(Math.max(0, Math.sin(t * 0.5)) ** 8) * 2.4;
    if (talking) gesture(p, t, Math.abs(Math.sin(t * 7)));
  },
  /** Talking: a hand out, gesturing, the head bobbing a little. */
  talk: (p, t) => {
    rest(p);
    p.arms[0].rotation.set(-0.7 - Math.sin(t * 3.1) * 0.35, 0, 0.25 + Math.sin(t * 2.3) * 0.15);
    p.arms[1].rotation.set(-0.25 - Math.max(0, Math.sin(t * 2.1)) * 0.3, 0, -0.1);
    p.body.rotation.x = Math.sin(t * 4.2) * 0.03;
  },
  /** Waving hello. */
  wave: (p, t) => { rest(p); p.arms[0].rotation.set(-2.7, 0, 0.35 + Math.sin(t * 9) * 0.35); },
  /** Clapping, delighted. */
  clap: (p, t) => { rest(p); const k = Math.abs(Math.sin(t * 12)); p.arms.forEach((a, i) => a.rotation.set(-1.35, 0, (i ? -1 : 1) * (0.25 + k * 0.3))); p.body.position.y = 0.72 + k * 0.02; },
  /** At an easel, a brush in hand (HOLDS): the arm out to the canvas, its tip on it a brush's reach
      straight ahead (src/den-houses.ts's toPaint stands a painter there), dabbing little strokes about. */
  paint: (p, t, talking, brush) => {
    rest(p);
    const sh = p.arms[0].position, up = p.body.position.y + sh.y;
    aim(p.arms[0], -sh.x + Math.sin(t * 2.3) * 0.05 + Math.sin(t * 5.3) * 0.025, CANVAS.y - up + Math.sin(t * 3.1) * 0.07, brushReach());
    // (a dab: the brush drawn back a touch in the hand and put to the canvas again)
    if (brush) brush.position.y = -0.5 + 0.045 * Math.max(0, Math.sin(t * 7.5)) ** 2;
    p.arms[1].rotation.set(-0.6, 0, -0.2);
  },
  /** A giggle: hands clasped up, bouncing. */
  giggle: (p, t) => { rest(p); p.arms.forEach((a, i) => a.rotation.set(-1.25, 0, (i ? -1 : 1) * 0.45)); p.body.position.y = 0.72 + Math.abs(Math.sin(t * 9)) * 0.035; },
  /** Cowering: hunched, hands up over the face, trembling. */
  cower: (p, t) => { rest(p); p.body.rotation.x = 0.25; p.arms.forEach((a, i) => a.rotation.set(-2.2, 0, (i ? -1 : 1) * 0.6 + Math.sin(t * 40) * 0.03)); },
  /** A shrug: hands out, palms up, shoulders up and down: "happens" (Helium after a bang). */
  shrug: (p, t) => { rest(p); const k = Math.max(0, Math.sin(t * 3)); p.arms.forEach((a, i) => a.rotation.set(-0.75, 0, (i ? -1 : 1) * (0.75 + k * 0.15))); p.body.position.y = 0.72 + k * 0.03; },
  /** Busy at something in front: both hands working at it, turning a tap, knocking a bung in (Helium at
      their cask). */
  tend: (p, t) => { rest(p); p.arms.forEach((a, i) => a.rotation.set(-1.0 + Math.sin(t * 6 + i * 2) * 0.25, 0, (i ? -1 : 1) * 0.2)); p.body.rotation.x = 0.12; },
  /** Twisting a balloon: both hands together in front, wrists turning against each other (balloons.js). */
  twist: (p, t) => {
    rest(p);
    p.arms.forEach((a, i) => a.rotation.set(-1.15 + Math.sin(t * 9 + i * Math.PI) * 0.12, (i ? 1 : -1) * Math.sin(t * 11) * 0.35, (i ? -1 : 1) * 0.42));
    p.body.rotation.x = 0.05;
  },
  /** Blowing up a balloon: both hands up at the mouth, holding its neck, a little heave with each puff
      (balloons.js). */
  blow: (p, t) => {
    rest(p);
    const puff = Math.max(0, Math.sin(t * 7)) ** 2;
    p.arms.forEach((a, i) => a.rotation.set(-2.45 - puff * 0.08, 0, (i ? -1 : 1) * 0.62));
    p.body.rotation.x = -0.06 - puff * 0.05;
  },
  /** Ta-da: arms flung up and out, presenting something, a little bounce. */
  tada: (p, t) => { rest(p); p.arms.forEach((a, i) => a.rotation.set(-2.25, 0, (i ? 1 : -1) * 0.55)); p.body.position.y = 0.72 + Math.abs(Math.sin(t * 5)) * 0.02; },
  /** Scared to death: hair on end, mouth open, arms flung up (creatures.js's fright). */
  scream: (p) => fright(p, true),
  /** A hug: both arms out round whoever's in front, a gentle squeeze, rocking a little side to side
      (Dachimpy's, at their door). */
  hug: (p, t) => {
    rest(p);
    const squeeze = Math.max(0, Math.sin(t * 2.2)) * 0.08;
    p.arms.forEach((a, i) => a.rotation.set(-1.25 - squeeze, (i ? 1 : -1) * 0.25, (i ? 1 : -1) * (0.42 + squeeze)));
    p.body.rotation.z = Math.sin(t * 1.6) * 0.05;
    p.body.rotation.x = 0.06;
  },
  /** Holding something out to you in the right hand (HOLDS: a plate of cookies), the other hand open. */
  offer: (p, t, talking, plate) => {
    rest(p);
    // (held out in front, in towards the middle, between the two of you)
    p.arms[0].rotation.set(-1.15 + Math.sin(t * 2) * 0.03, 0, 0.3);
    if (plate) { const a = p.arms[0].rotation; plate.rotation.order = 'ZYX'; plate.rotation.set(-a.x, 0, -a.z); }   // (kept level, whatever the arm's doing)
    p.arms[1].rotation.set(-0.45, 0, -0.3);
    if (talking) p.body.rotation.x = Math.sin(t * 4.2) * 0.03;
  },
  /** Munching something in the right hand (a cookie: held.js's): the hand up at the mouth, the head bobbing with
      each chew, the other hand under it for the crumbs. */
  munch: (p, t) => {
    rest(p);
    toMouth(p, 1);
    p.arms[0].rotation.x += Math.sin(t * 9) * 0.04;
    p.arms[1].rotation.set(-0.9, 0, -0.35);
    p.body.rotation.x = -0.03 + Math.abs(Math.sin(t * 9)) * 0.03;
  },
};

/** Where a hand holds something up to a figure's mouth, on its body (the wardrobe's: its eyes are at 0.952,
    src/eyes.ts): a cookie's top edge at the lips. */
export const MOUTH = { y: 0.8, z: 0.33 };
const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), clamp01 = (k) => Math.max(0, Math.min(1, k));
/** The right arm reaching: `k` (0 to 1) of the way from hanging down to its hand at a point in the world
    (`world`, a Vector3, or null: something held out, Dachimpy's plate), then `mouth` (0 to 1) of the way on from
    there to its hand at its mouth (a cookie, munched). Any figure from the wardrobe. */
export function reachTo(p, world, k, mouth = 0) {
  const sh = p.arms[0].position;
  v0.set(0, -1, 0);
  if (world && k > 0) { p.body.worldToLocal(v1.copy(world)).sub(sh).normalize(); v0.lerp(v1, clamp01(k)); }
  if (mouth > 0) { v1.set(-sh.x, MOUTH.y - sh.y, MOUTH.z).normalize(); v0.lerp(v1, clamp01(mouth)); }
  aim(p.arms[0], v0.x, v0.y, v0.z);
}
/** The right arm `k` (0 to 1) of the way from hanging down to its hand at its mouth. */
export const toMouth = (p, k) => reachTo(p, null, 0, k);

/** Points an arm (hanging down from its shoulder, as the wardrobe's do) along (dx, dy, dz), in its
    figure's own frame (+z ahead). */
function aim(arm, dx, dy, dz) {
  const n = Math.hypot(dx, dy, dz) || 1;
  arm.rotation.set(Math.atan2(-dz, -dy), 0, Math.asin(Math.max(-1, Math.min(1, dx / n))));
}

/* What an idle holds in its right hand while it's on (whatever the look holds, a candle, a tankard, is
   put away meanwhile): any figure doing it gets one. Each one of held.js's pieces, the wardrobe's too (a
   look can hold one all the time); null, nothing: its own put away (a hug's both arms round you). */
export const HOLDS = { paint: 'brush', offer: 'cookies', hug: null };
const v = new THREE.Vector3();

/** A pirate from a look, standing about in a scene: see the top of this file. */
export function person({
  look, parent = null, x = 0, y = 0, z = 0, yaw = 0, scale = 1, idle = 'sway',
  script = null, lines = null, loop = true, random = false, gap = PACE.ASIDE, wait = 1.5, secs = readSecs, begun = true,
  say = null, bubble = null, shown = () => true, tall = 2.4, earshot = null, face = null,
} = {}) {
  const p = Object.assign(makePirate({ look }), { x, z, phase: 0 });
  p.g.position.set(x, y, z); p.g.rotation.y = yaw;
  if (scale !== 1) p.g.scale.setScalar(scale);
  parent?.add(p.g);
  const el = bubble === 'page' ? pageBubble('', document.body, 'wrap') : null;   // (on the page: at sea the den's labels are hidden)
  const scriptOf = (list, o) => (o.loop ?? loop ? { loop: list, random: o.random ?? random } : { intro: list });
  let pace = { secs, gap, wait };
  const P = {
    p, idle, t: Math.random() * 10, yaw,
    /** Its own bubble on the page (`bubble: 'page'`), for a scene that places it itself after show(). */
    el,
    /** What it says, and when (src/chatter.ts). */
    chatter: null,
    /** Say its lines just now? (A scene can hush it a while.) */
    chatty: true,
    /** The line on show (so a new one's put up once). */
    shown: null,
    /** What its idle has in its hand (HOLDS), if anything (its figure's `inHand`, held.js's). */
    prop: null,
    /** A scene's say in which way it faces, over `face` (a world point { x, z }, or null): a performer
        turned to its audience (balloons.js). */
    lookAt: null,
    /** Its idle animation, by name (IDLES). */
    setIdle(name) {
      if (name === P.idle) return;
      if (P.idle === 'scream') fright(p, false);
      P.idle = IDLES[name] ? name : 'stand';
      rest(p);
      hold(HOLDS[P.idle]);
    },
    /** Something new to say (src/chatter.ts's Script), from the start; `o` its pace (gap, wait, secs). */
    setScript(s, { begun: b = true, ...o } = {}) {
      pace = { ...pace, ...o };
      P.chatter = new Chatter(s || {}, pace);
      if (s && b) P.chatter.start();
      P.chatty = !!s;
      P.show();
    },
    /** New lines to say (once, or round and round), from the first. */
    setLines(list, o = {}) { P.setScript(list?.length ? scriptOf(list, o) : null, { wait: 0.8, ...o }); },
    /** Its script from the start again, as if it had never spoken (not begun, if it wasn't to begin with). */
    restart() { P.setScript(P.chatter.script, { begun }); },
    /** Begins its script, if it hadn't. */
    start() { P.chatter.start(); },
    /** Space: on to its next line now, or, not talking, its next (its first, if it hasn't begun). */
    hail() { P.chatter.hail(); P.show(); },
    /** Something's happened: its line for it (Script.asides), over whatever it was saying. */
    aside(name) { P.chatter.aside(name); P.show(); },
    /** Stops talking just now. */
    hush() { P.chatter.hush(); P.show(); },
    /** Saying something just now? */
    talking: () => !!P.chatter.line,
    /** Says one thing now, in its scene's bubbles (not its script). */
    say(text, secs) { say?.(p, text, secs); },
    /** Each tick: its legs going if it's `moving` (where to is the scene's business), else its idle; and
        its lines. */
    tick(dt, moving = false) { P.pose(dt, moving); P.talk(dt); },
    /** Just its pose: walking (`moving`), already walked by the scene (`'walked'`), or its idle; turned to
        whoever's near (`face`). */
    pose(dt, moving = false) {
      P.t += dt;
      if (face || P.lookAt) {
        const f = P.lookAt ?? face?.();
        p.g.getWorldPosition(v);
        const want = f ? Math.atan2(f.x - v.x, f.z - v.z) : yaw;
        P.yaw += (want - P.yaw) * Math.min(1, dt * 2);
        p.g.rotation.y = P.yaw;
      }
      if (moving === 'walked') return;
      if (moving) { animateWalk(p, true, dt); return; }
      p.legs.forEach((l) => l.rotation.set(0, 0, l.rotation.z));
      IDLES[P.idle]?.(p, P.t, !!P.chatter.line, P.prop);
      familiarTick(p.fam, dt);
    },
    /** Just its lines, a pause between, while you're near enough to hear. */
    talk(dt) {
      P.chatter.tick(dt, P.chatty && (!earshot || earshot()));
      P.show();
    },
    /** Puts its line up, if it's a new one; and its own bubble over its head. */
    show() {
      const L = P.chatter.line;
      if (L !== P.shown) {
        P.shown = L;
        if (L) { if (el) el.textContent = L.text; else say?.(p, L.text); }
      }
      if (!el) return;
      p.g.getWorldPosition(v);
      bubbleAt(el, !!L && shown(), v.x, v.y + tall * scale, v.z);
      if (L && parseFloat(el.style.top) < 90) el.style.top = '90px';
      // (kept whole on the screen, side to side: its middle is at `left`; the user, 13 Nov, of Helium's: "really
      // off the edge of the screen ... two-thirds of them are on the screen, half")
      if (L && el.style.display !== 'none') {
        const half = el.offsetWidth / 2, x = parseFloat(el.style.left);
        if (Number.isFinite(x)) el.style.left = `${Math.max(half + 8, Math.min(innerWidth - half - 8, x))}px`;
      }
    },
  };
  /** Puts what an idle holds in its right hand (HOLDS: held.js's, by name), its own put away meanwhile; or none. */
  function hold(name) {
    P.prop = inHand(p, name && HELD[name] ? HELD[name].make() : null);
    if (p.held && name === null) p.held.visible = false;   // (empty-handed: its own put away too)
  }
  hold(HOLDS[P.idle]);
  P.setScript(script || (lines?.length ? scriptOf(lines, {}) : null), { begun });
  return P;
}
