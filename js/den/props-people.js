/* People for any scene, placed and configured like furniture (the user, 11 Nov: "a pirate with a
   configurable loop of text, and obviously animations ... modular as well. So you can choose what
   animation they stand there doing and use that generally everywhere"; and "Kikkit should just be a bit
   of config"). Creatures (a yeti, the vampire, a familiar, a penguin) are in creatures.js, the same way.

   person({ look, parent, x, y, z, yaw, scale, idle, script, lines, loop, random, gap, wait, secs, begun,
   say, bubble, shown, tall, earshot, face }) is a pirate from a look standing in a scene doing an idle
   animation picked by name from IDLES (swaying, a tipsy sway with a swig, talking, waving, clapping,
   painting, giggling, cowering, screaming...), and, if it's given something to say, saying it:
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
import { Chatter } from '../chatter.js';
import { readSecs } from '../den-houses.js';
import { fright } from './creatures.js';
import { bubble as pageBubble, bubbleAt } from './cine.js';

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
  /** At an easel: the brush hand making strokes. */
  paint: (p, t) => { rest(p); p.arms[0].rotation.set(-1.5 + Math.sin(t * 9) * 0.3, 0, Math.cos(t * 7) * 0.3); p.arms[1].rotation.set(-0.6, 0, -0.2); },
  /** A giggle: hands clasped up, bouncing. */
  giggle: (p, t) => { rest(p); p.arms.forEach((a, i) => a.rotation.set(-1.25, 0, (i ? -1 : 1) * 0.45)); p.body.position.y = 0.72 + Math.abs(Math.sin(t * 9)) * 0.035; },
  /** Cowering: hunched, hands up over the face, trembling. */
  cower: (p, t) => { rest(p); p.body.rotation.x = 0.25; p.arms.forEach((a, i) => a.rotation.set(-2.2, 0, (i ? -1 : 1) * 0.6 + Math.sin(t * 40) * 0.03)); },
  /** Scared to death: hair on end, mouth open, arms flung up (creatures.js's fright). */
  scream: (p) => fright(p, true),
};

const v = new THREE.Vector3();

/** A pirate from a look, standing about in a scene: see the top of this file. */
export function person({
  look, parent = null, x = 0, y = 0, z = 0, yaw = 0, scale = 1, idle = 'sway',
  script = null, lines = null, loop = true, random = false, gap = 6, wait = 1.5, secs = readSecs, begun = true,
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
    /** What it says, and when (src/chatter.ts). */
    chatter: null,
    /** Say its lines just now? (A scene can hush it a while.) */
    chatty: true,
    /** The line on show (so a new one's put up once). */
    shown: null,
    /** Its idle animation, by name (IDLES). */
    setIdle(name) {
      if (name === P.idle) return;
      if (P.idle === 'scream') fright(p, false);
      P.idle = IDLES[name] ? name : 'stand';
      rest(p);
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
      if (face) {
        const f = face();
        p.g.getWorldPosition(v);
        const want = f ? Math.atan2(f.x - v.x, f.z - v.z) : yaw;
        P.yaw += (want - P.yaw) * Math.min(1, dt * 2);
        p.g.rotation.y = P.yaw;
      }
      if (moving === 'walked') return;
      if (moving) { animateWalk(p, true, dt); return; }
      p.legs.forEach((l) => l.rotation.set(0, 0, l.rotation.z));
      IDLES[P.idle]?.(p, P.t, !!P.chatter.line);
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
    },
  };
  P.setScript(script || (lines?.length ? scriptOf(lines, {}) : null), { begun });
  return P;
}
