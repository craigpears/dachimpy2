// Whoever you marry comes home with you (the user, 11 Nov: "It's got to carry out into the world"): your
// spouse, in their wedding look, aboard her as she sails home off the Wedding Isle, then at the den,
// strolling about its floor and stopping for a word when you come up to them. (The rules:
// src/den-spouse.ts; their lines: src/lines/. wedding.js says when you've married and when you leave.)
import { spouseOf, cleanSpouse, homeLines, homeNews, leaving, settle, reopened, ABOARD, STROLL, Stroll, Chatter } from '../den-spouse.js';
import { scene, keep, toast, burst, V3, bounds, obstacles, pirate, animateWalk, WALL_Z } from './world.js';
import { heightAt } from './land.js';
import { sail, SLOOP_DECK } from './sea.js';
import { bubble, bubbleAt } from './cine.js';
import { figure, dropFigure } from './wedding-scene.js';

const KEY = 'carp.den.spouse';
const kept = () => { try { return cleanSpouse(JSON.parse(localStorage.getItem(KEY))); } catch { return null; } };

/** Your spouse (src/den-spouse.ts's Spouse) and where they are: on the isle with you, aboard her, at the den. */
export const spouse = { who: kept(), where: reopened(), fig: null, stroll: null, chat: null, bub: null, line: null };

export { spouseOf };

/** Their figure, in their wedding look (Barnaby bandaged, a suitor's bouquet), made afresh. */
function makeFig() {
  dropFigure(spouse.fig);
  const s = spouse.who;
  spouse.fig = figure(scene, s.look, { hurt: !!s.hurt, bouquet: s.kind === 'suitor' ? 'rose' : null });
  spouse.fig.g.visible = false;
  spouse.stroll = null;
  spouse.chat = new Chatter(homeLines(s).den);
}
/** A line over their head for a while. */
function say(text, secs = STROLL.SAY) {
  if (!text) return;
  spouse.bub ||= bubble('', document.body, 'wrap spouse');   // (on the page: the den's labels are hidden at sea)
  spouse.bub.textContent = text;
  spouse.line = { until: performance.now() + secs * 1000 };
}

/** Married, the ceremony played through: they're your spouse now (any before them gone), with you on the isle. */
export function spouseMarried(s) {
  if (!s) return;
  spouse.who = s;
  spouse.where = 'isle';
  keep(KEY, s);
  makeFig();
}
/** Leaving the isle: just married, they come with you, aboard her (by sea) or home (by the cheat). */
export function spouseLeaves(bySea) {
  if (!spouse.who || spouse.where !== 'isle') return;
  spouse.where = leaving(bySea);
  toast(homeNews(spouse.who, bySea));
  if (bySea) say(homeLines(spouse.who).aboard, 5.5);
}
/** A starting point (menus.js, "Home, married"): them at the den, by you. Where you stand, and which way you face. */
export function spouseCheat(s) {
  spouseMarried(s);
  spouse.where = 'den';
  spouse.stroll = new Stroll(area(), free, Math.random, pickNear(0, 7));
  // (beside them and a step back, so the camera behind you sees you both)
  return { x: spouse.stroll.x + 1.2, z: spouse.stroll.z + 1.0, yaw: Math.atan2(-1.2, -1.0) };
}

// ---------- at the den ----------
/** Their part of the den floor: clear of the wall's foot, inside its sides and back. */
const area = () => ({ x0: -bounds.x + 0.7, x1: bounds.x - 0.7, z0: WALL_Z + 1.3, z1: bounds.z1 - 0.7 });
/** Whether they could stand at x, z: on the floor itself (not up a stair or the tower), clear of
    anything standing on it. */
function free(x, z) {
  const A = area();
  if (x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) return false;
  if (obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.45)) return false;
  return heightAt(x, z, 0.3) < 0.05;
}
/** A free spot near x, z. */
function pickNear(x, z) {
  for (let r = 0; r < 6; r += 0.5) for (let a = 0; a < 12; a++) {
    const px = x + Math.cos(a * Math.PI / 6) * r, pz = z + Math.sin(a * Math.PI / 6) * r;
    if (free(px, pz)) return { x: px, z: pz };
  }
  return undefined;
}
const turn = (from, to, u) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * u;

export function spouseTick(dt, onIsle) {
  const s = spouse.who;
  if (!s) return;
  if (!spouse.fig) makeFig();
  const was = spouse.where;
  spouse.where = settle(spouse.where, { sailing: sail.on, onIsle });
  const f = spouse.fig, g = f.g;
  if (spouse.where === 'isle') { g.visible = false; showLine(false); return; }
  if (spouse.where === 'aboard') {
    if (was === 'den') spouse.stroll = null;   // (off with you again: a fresh spot when they're home)
    if (!sail.g) { g.visible = false; showLine(false); return; }
    if (g.parent !== sail.g) sail.g.add(g);
    g.visible = true;
    // (stood just aft of her mast, looking ahead, swaying a little with her)
    const t = performance.now() / 1000;
    g.position.set(ABOARD.x, SLOOP_DECK, ABOARD.z);
    g.rotation.set(Math.sin(t * 1.3) * 0.03, Math.PI / 2 + Math.sin(t * 0.4) * 0.25, 0);
    animateWalk(f, false, dt);
    f.arms[0].rotation.x = -0.5 + Math.sin(t * 2) * 0.05;   // (a hand on the rail, the bouquet out)
    showLine(true);
    return;
  }
  // At the den: stepped off her, they're home.
  if (g.parent !== scene) scene.add(g);
  if (!spouse.stroll) {
    spouse.stroll = new Stroll(area(), free);
    if (was === 'aboard') burst(V3(spouse.stroll.x, 0.3, spouse.stroll.z), '#fff3c4', 14, 2.2);
  }
  const S = spouse.stroll, me = !sail.on && !onIsle && pirate.h < 0.5 ? { x: pirate.x, z: pirate.z } : null;
  S.tick(dt, me);
  g.visible = true;
  g.position.x = S.x; g.position.z = S.z;
  g.rotation.y = turn(g.rotation.y, S.yaw, Math.min(1, dt * (S.chatting ? 6 : 8)));
  animateWalk(f, S.walking, dt, 9);
  if (!S.walking && !f.hurt) f.arms.forEach((a) => { a.rotation.x = 0; });
  if (S.chatting) f.arms[1].rotation.set(-2.4 + Math.sin(performance.now() / 160) * 0.25, 0, 0.2);   // (a wave)
  else if (f.hurt) f.arms[1].rotation.set(-1.2, 0, -0.7);   // (Barnaby's arm, back in its sling)
  const line = spouse.chat.tick(dt, S.chatting);
  if (line) say(line);
  showLine(!onIsle);
}
/** Their line, over their head while it lasts. */
function showLine(on) {
  const b = spouse.bub;
  if (!b) return;
  if (!on || !spouse.line || performance.now() > spouse.line.until) { b.style.display = 'none'; if (spouse.line && performance.now() > spouse.line.until) spouse.line = null; return; }
  const p = spouse.fig.g.getWorldPosition(V3(0, 0, 0));
  bubbleAt(b, true, p.x, p.y + 2.35, p.z);
}
