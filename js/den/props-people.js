/* People for any scene, placed and configured like furniture (the user, 11 Nov: "a pirate with a
   configurable loop of text, and obviously animations ... modular as well. So you can choose what
   animation they stand there doing and use that generally everywhere"). Creatures (a yeti, the vampire,
   a familiar on its own) are in creatures.js, the same way.

   person({ look, parent, x, z, yaw, idle, lines, loop, random, gap, say, earshot }) is a pirate from a
   look standing in a scene doing an idle animation picked by name from IDLES (swaying, talking, waving,
   clapping, painting, giggling, cowering, screaming...), and, if it's given lines, saying them in its
   scene's speech bubbles (`say(figure, text)`) one after another, once or round and round, a pause
   between (`gap`, seconds, or [least, most]), only while `earshot()` says you're near enough to hear.
   Its `p` is the figure (g, arms, legs, body, x, z), for walking about; each tick, tick(dt, moving)
   animates it (moving: legs going, else its idle). */
import { makePirate, animateWalk } from './world.js';
import { familiarTick } from '../den-look.js';
import { fright } from './creatures.js';

const rest = (p) => {
  p.arms.forEach((a) => a.rotation.set(0, 0, 0));
  p.body.rotation.set(0, 0, 0);
  p.body.position.y = 0.72;
};
/** The idle animations, by name: each poses a figure (p) at time t (seconds). Any figure from the
    wardrobe (or with the same parts: arms, legs, body) can do any of them. */
export const IDLES = {
  /** Just standing. */
  stand: (p) => rest(p),
  /** Standing, swaying gently from foot to foot. */
  sway: (p, t) => { rest(p); p.body.rotation.z = Math.sin(t * 1.3) * 0.035; p.arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.06; }); },
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

/** A pirate from a look, standing about in a scene: see the top of this file. */
export function person({ look, parent = null, x = 0, z = 0, yaw = 0, idle = 'sway', lines = null, loop = true, random = false, gap = 6, say = null, earshot = null } = {}) {
  const p = Object.assign(makePirate({ look }), { x, z, phase: 0 });
  p.g.position.set(x, 0, z); p.g.rotation.y = yaw;
  parent?.add(p.g);
  const P = {
    p, idle, t: Math.random() * 10,
    /** Say its lines just now? (A scene can hush it a while.) */
    chatty: !!lines,
    list: lines ? [...lines] : [], i: -1, loop, random, gap, wait: 1.5,
    /** Its idle animation, by name (IDLES). */
    setIdle(name) {
      if (name === P.idle) return;
      if (P.idle === 'scream') fright(p, false);
      P.idle = IDLES[name] ? name : 'stand';
      rest(p);
    },
    /** New lines to say (once, or round and round), from the first. */
    setLines(list, o = {}) { P.list = [...(list || [])]; P.i = -1; P.loop = o.loop ?? P.loop; P.random = o.random ?? P.random; P.gap = o.gap ?? P.gap; P.wait = o.wait ?? 0.8; P.chatty = !!P.list.length; },
    /** Says one thing now. */
    say(text, secs) { say?.(p, text, secs); },
    /** Each tick: its legs going if it's `moving` (where to is the scene's business), else its idle; and
        its lines. */
    tick(dt, moving = false) { P.pose(dt, moving); P.talk(dt); },
    /** Just its pose: walking (`moving`), already walked by the scene (`'walked'`), or its idle. */
    pose(dt, moving = false) {
      P.t += dt;
      if (moving === 'walked') return;
      if (moving) { animateWalk(p, true, dt); return; }
      p.legs.forEach((l) => l.rotation.set(0, 0, l.rotation.z));
      IDLES[P.idle]?.(p, P.t);
      familiarTick(p.fam, dt);
    },
    /** Just its lines, a pause between, while you're near enough to hear. */
    talk(dt) {
      if (!P.chatty || !P.list.length || (earshot && !earshot())) return;
      if ((P.wait -= dt) > 0) return;
      if (!P.loop && P.i >= P.list.length - 1) { P.chatty = false; return; }
      P.i = P.random ? Math.floor(Math.random() * P.list.length) : (P.i + 1) % P.list.length;
      const text = P.list[P.i];
      say?.(p, text);
      const g = Array.isArray(P.gap) ? P.gap[0] + Math.random() * (P.gap[1] - P.gap[0]) : P.gap;
      P.wait = g + Math.max(1.8, text.split(/\s+/).length * 0.33 + 1);
    },
  };
  return P;
}
