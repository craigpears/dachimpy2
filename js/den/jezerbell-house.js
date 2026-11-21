/* Jezerbell's house, the Summoning Hall: her scene in the house shell (house.js). Its rules (the plan, her furniture,
   portraits, where her octopuses hide, the tour, the pack and the fray) are src/den-jezerbell.ts's; her lines and
   the pack's src/lines/jezerbell.ts's. This places the shared furniture (furniture.js: her summoning stump, her
   throne with bat wings...), paints her portraits (portraits.js), hides her octopuses (creatures.js's familiars), and
   plays her: she meets you at the door and shows you round; come close to where an octopus is hiding and Space finds
   it, out it comes and sits up; once you've found them all, one's missing, the werewolves have her; Space at the stump
   uses a charm, and in a little cutscene (cine.js) the pack bursts out of it, a werewolf at a time (werewolf.js), each
   with its taunt; then the fray, as Puzzle Pirates': a real Rumble against each wolf in turn (src/rumble.ts, the wolf
   the greedy brawler's Hand at its own pace, both boards drawn by js/rumble-board.js), her fighting her own beside
   you (src/den-jezerbell.ts's Fray); win, and the pack slinks off, the missing octopus comes back, and you're shown a
   Wolf-skull Wayfinder. */
import { PIRATES } from '../den-look.js';
import {
  PLAN, ARRIVE, WALLS, BACK, FURNISH, PORTRAITS, SIGN, OCTOPUSES, MISSING, ALL, octopusAt, TOUR, stopAt,
  STUMP, atStump, PACK, Fray,
} from '../den-jezerbell.js';
import { blocksOf } from '../den-houses.js';
import {
  AT_THE_DOOR, TOUR_LINES, ON_A_PICTURE, FOUND, HUNT, AT_THE_STUMP, IN_THE_FRAY, AFTER, CHATTER, GOODBYE,
  PACK_TAUNTS, PACK_DOWN, PACK_WON,
} from '../lines/jezerbell.js';
import { PACE } from '../chatter.js';
import { Rumble, seeded, WIDTH, CHARGE_TIME } from '../rumble.js';
import { Hand, GREEDY } from '../rumble-bots.js';
import { rumbleBoards, BOARD_H, TARGET, targetAt, angleFor } from '../rumble-board.js';
import { FURNITURE, place } from './furniture.js';
import { creature } from './creatures.js';
import { werewolf } from './werewolf.js';
import { paint, paintFlat } from './portraits.js';
import { person } from './props-people.js';
import { cine, cinePlay, cineEnd } from './cine.js';
import { V3 } from './world.js';

/** Seconds a beaten wolf's board stays up, the wolf going down, before the next wolf's deal (it went straight on,
    "going away too quickly", the user, 21 Nov). */
const NEXT_WOLF = 2.2;
/** Your fists on the keys (Z and X, as the Rumble test page; Space the left too), and aiming (the arrows, A and D). */
const FISTS = { z: 0, ' ': 0, x: 1 }, AIMS = { arrowleft: -1, a: -1, arrowright: 1, d: 1 };

// ---------- the fray's panel: both boards, the pack, and the buttons for a phone ----------
const style = document.createElement('style');
// (a line a rule, joined: the bundle keeps a template's line breaks, and is kept to a few: tests/bundle.test.ts)
style.textContent = [
  `.fray { position: fixed; left: 50%; top: 58px; bottom: 12px; transform: translateX(-50%); z-index: 30; display: none; flex-direction: column; align-items: center; gap: 6px; width: calc(100vw - 16px); pointer-events: none; }`,
  `.fray.on { display: flex; }`,
  `.fray .fray-pack { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; pointer-events: auto; }`,
  `.fray .fray-pack span { font: 700 13px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(30, 18, 30, 0.88); border: 1px solid #8a5a9a; border-radius: 999px; padding: 3px 10px; }`,
  `.fray .fray-pack span.down { opacity: 0.45; text-decoration: line-through; }`,
  `.fray .fray-pack span.you { border-color: #ff7aa8; background: rgba(90, 20, 50, 0.92); }`,
  `.fray .fray-pack span.her { border-color: #8fdc6a; }`,
  `.fray .fray-boards { display: flex; gap: 10px; align-items: flex-end; justify-content: space-between; align-self: stretch; flex: 1; min-height: 0; pointer-events: none; }`,
  `.fray .fray-boards > * { pointer-events: auto; }`,
  `@media (max-width: 760px) { .fray .fray-boards { justify-content: center; } }`,
  `.fray .fray-side { display: flex; flex-direction: column; align-items: center; gap: 2px; background: rgba(24, 14, 24, 0.82); border: 1px solid #6a4a7a; border-radius: 10px; padding: 4px 6px 6px; }`,
  `.fray .fray-side b { font: 700 14px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; }`,
  `.fray .fray-pad { display: flex; gap: 6px; pointer-events: auto; }`,
  `.fray .fray-pad button { min-width: 48px; min-height: 44px; font: 700 18px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(36, 23, 34, 0.92); border: 1px solid #b07ac8; border-radius: 10px; cursor: pointer; }`,
  `.fray .fray-pad button.fist { min-width: 96px; background: #5a2a6a; touch-action: none; }`,
  `.fray .fray-pad button.held { background: #8a4a9a; border-color: #ffd8ff; }`,
  `.fray canvas { touch-action: none; }`,
  `.fray-card { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 31; display: none; text-align: center; font: 16px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(28, 18, 30, 0.95); border: 2px solid #c8a050; border-radius: 14px; padding: 16px 22px; width: min(340px, calc(100vw - 32px)); }`,
  `.fray-card.on { display: block; }`,
  `.fray-card h3 { margin: 6px 0; font-size: 20px; color: #e0a92a; }`,
  `.fray-card button { margin-top: 10px; min-height: 44px; min-width: 120px; font: 700 16px 'Alegreya Sans', system-ui, sans-serif; color: #2a1d13; background: #e0a92a; border: 0; border-radius: 10px; cursor: pointer; }`,
  `.octo-count { position: fixed; top: 64px; right: 16px; z-index: 29; display: none; font: 700 18px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(30, 18, 30, 0.9); border: 2px solid #b07ac8; border-radius: 12px; padding: 8px 14px; transition: transform 0.2s, border-color 0.2s; transform-origin: top right; }`,
  `.octo-count.on { display: block; }`,
  `.octo-count.pop { transform: scale(1.25); border-color: #f0bd44; color: #ffe08a; }`,
].join('\n');
document.head.append(style);
const panel = document.createElement('div');
panel.className = 'fray'; panel.id = 'fray';
panel.innerHTML = `<div class="fray-pack"></div><div class="fray-boards"><div class="fray-side"><b>You</b><canvas></canvas></div><div class="fray-side"><b class="wolf-name"></b><canvas></canvas></div></div><div class="fray-pad"><button data-aim="-1" title="Aim left (Left arrow)">&#x2190;</button><button data-fist="0" class="fist" title="Left fist (Z): hold to charge">Left fist</button><button data-fist="1" class="fist" title="Right fist (X): hold to charge">Right fist</button><button data-aim="1" title="Aim right (Right arrow)">&#x2192;</button></div>`;
const card = document.createElement('div');
card.className = 'fray-card'; card.id = 'fray-card';
const counter = document.createElement('div');
counter.className = 'octo-count'; counter.id = 'octo-count';
document.body.append(panel, card, counter);
const canvases = [...panel.querySelectorAll('canvas')], boards = rumbleBoards(canvases);
const packEl = panel.querySelector('.fray-pack'), wolfName = panel.querySelector('.wolf-name');

/** The Wolf-skull Wayfinder, drawn: a brass compass, a wolf's skull on its face. */
function wayfinderArt() {
  const c = document.createElement('canvas'); c.width = c.height = 120;
  const x = c.getContext('2d');
  x.fillStyle = '#b8892a'; x.beginPath(); x.arc(60, 60, 54, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f2e6c8'; x.beginPath(); x.arc(60, 60, 44, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#6a4a18'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(60 + Math.cos(a) * 36, 60 + Math.sin(a) * 36); x.lineTo(60 + Math.cos(a) * 44, 60 + Math.sin(a) * 44); x.stroke(); }
  // the skull: its crown, its long snout, its ears, two dark sockets
  x.fillStyle = '#ddd2bc'; x.strokeStyle = '#3a2a18'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(42, 44); x.lineTo(46, 28); x.lineTo(52, 40); x.lineTo(68, 40); x.lineTo(74, 28); x.lineTo(78, 44); x.quadraticCurveTo(80, 60, 68, 66); x.lineTo(64, 88); x.lineTo(56, 88); x.lineTo(52, 66); x.quadraticCurveTo(40, 60, 42, 44); x.fill(); x.stroke();
  x.fillStyle = '#c0262e'; for (const sx of [-1, 1]) { x.beginPath(); x.ellipse(60 + sx * 8, 52, 5, 4, 0, 0, Math.PI * 2); x.fill(); }
  return c;
}

export const JEZERBELL_HOUSE = {
  id: 'jezerbell', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { tour: 0, ticks: [], visited: false, found: new Set(), octos: new Map(), hops: [], fray: null, frays: 0, won: 0, missingBack: false, pack: [], after: null };
    // ---------- her furniture, and her sign ----------
    for (const p of FURNISH) {
      const opts = { col: p.col, ...(p.extra || {}) };
      if (p.kind === 'candelabra') opts.light = true;
      if (p.s) opts.s = p.s;
      const piece = place(R, FURNITURE[p.kind](opts), p.x, p.z, p.yaw || 0);
      if (piece.tick) G.ticks.push(piece);
      if (p.kind === 'summoningStump') G.stump = piece;
    }
    G.blocks = blocksOf(FURNISH);
    place(R, FURNITURE.sign({ text: SIGN.text, w: SIGN.w, h: SIGN.h, y: SIGN.y, col: '#3a1f40', ink: '#f2d6ff' }), SIGN.x, BACK, 0);
    // ---------- her portraits ----------
    G.exhibits = [];
    for (const q of PORTRAITS) {
      const f = place(R, FURNITURE.frame({ plaque: q.title, w: q.w, h: q.h, y: q.y, ornate: true }), q.x, BACK, 0);
      const painted = paint(q);
      f.setPicture(painted.texture, painted.uv);
      G.exhibits.push({ id: q.id, x: q.x, y: q.y, z: BACK });
    }
    G.ticks.push(...[-7.2, -4.45, 1.6, 4.8].map((x) => place(R, FURNITURE.sconce({ y: 2.35 }), x, BACK, 0)));
    // ---------- her octopuses, hiding ----------
    for (const o of OCTOPUSES) {
      const c = creature('octopus', { col: o.col, idle: 'perch' });
      c.g.position.set(o.peek.x, o.peek.y, o.peek.z); c.g.rotation.y = o.peek.yaw; c.g.scale.setScalar(0.6);
      R.add(c.g);
      G.ticks.push(c);
      G.octos.set(o.id, c);
    }
    // (the missing one, kept out of sight till the pack's beaten)
    G.missing = creature('octopus', { col: MISSING.col, idle: 'perch' });
    G.missing.g.visible = false;
    R.add(G.missing.g); G.ticks.push(G.missing);
    const count = () => G.found.size + (G.missingBack ? 1 : 0);
    const showCount = () => { counter.textContent = `Octopuses found: ${count()} of ${ALL}`; counter.classList.toggle('on', G.found.size > 0 && !G.fray && !cine); };
    /** Each one found, said plainly in the corner a moment (the user, 21 Nov: "each time you find one, it should say
        found one of X"), then the count again. */
    const popCount = () => {
      showCount();
      counter.textContent = count() === ALL - 1 && !G.missingBack ? `Found one! ${count()} of ${ALL}. One's missing...` : `Found one! ${count()} of ${ALL} octopuses`;
      counter.classList.add('pop');
      clearTimeout(G.popT);
      G.popT = setTimeout(() => { counter.classList.remove('pop'); showCount(); }, 2600);
    };

    // ---------- her ----------
    G.herP = person({
      look: PIRATES.Jezerbell, parent: R, x: ARRIVE.her.x, z: ARRIVE.her.z, idle: 'sway', say: H.say,
      lines: CHATTER, random: true, gap: PACE.ASIDE,
      earshot: () => !cine && !G.fray && !G.after && !H.talking() && (G.herP.talking() || !H.house.lines.has(G.her)) && Math.hypot(G.her.x - H.you.x, G.her.z - H.you.z) < 4.5,
    });
    G.herP.chatty = false;
    G.her = G.herP.p;
    const host = {
      who: G.herP,
      get idle() { return G.fray && !G.fray.rules.over ? 'fight' : 'sway'; },
      still: () => !!G.fray || !!G.after,
      showing() {
        const s = TOUR[G.tour - 1];
        return s && H.house.talk && H.house.talk === G.tourTalk ? { at: s.at, near: s.near, stand: s.her } : null;
      },
    };

    // ---------- finding an octopus: out it hops, and sits up ----------
    function find(o) {
      G.found.add(o.id);
      G.hops.push({ c: G.octos.get(o.id), from: { ...o.peek }, to: { ...o.sit }, t: 0 });
      H.hush(); H.house.to = null;
      const lines = [FOUND[o.id]];
      if (G.found.size === 1) lines.push(HUNT.first);
      if (G.found.size === OCTOPUSES.length && !G.missingBack) lines.push(...HUNT.allButOne);
      H.talk(G.her, lines);
      popCount();
    }
    const HOP = 0.7;
    function hopTick(dt) {
      for (const h of G.hops) {
        h.t += dt;
        const u = Math.min(1, h.t / HOP), e = u * u * (3 - 2 * u);
        h.c.g.position.set(h.from.x + (h.to.x - h.from.x) * e, h.from.y + (h.to.y - h.from.y) * e + Math.sin(u * Math.PI) * 0.45, h.from.z + (h.to.z - h.from.z) * e);
        h.c.g.rotation.y = h.from.yaw + (h.to.yaw - h.from.yaw) * e + u * Math.PI * 2;
        h.c.g.scale.setScalar(0.6 + 0.45 * e);
      }
      G.hops = G.hops.filter((h) => h.t < HOP);
    }

    // ---------- the pack: summoned out of the stump ----------
    /** Where each wolf stands in the fray: a crescent in front of the stump, facing the room. */
    const spot = (i) => ({ x: STUMP.x - 2.6 + i * 1.6, z: STUMP.z + 1.5 + (i % 2) * 0.3 });
    const YOU_AT = { x: STUMP.x - 1.8, z: STUMP.z + 4.0 }, HER_AT = { x: STUMP.x + 1.8, z: STUMP.z + 3.9 };
    const MID = { x: (YOU_AT.x + HER_AT.x) / 2, z: (YOU_AT.z + HER_AT.z) / 2 };
    function packUp() {
      for (const w of G.pack) R.remove(w.g);
      G.pack = PACK.map((wolf, i) => {
        const w = werewolf({ fur: wolf.fur });
        w.tall = 2.35;
        w.g.visible = false;
        R.add(w.g);
        return Object.assign(w, { wolf, i, at: spot(i), out: false });
      });
    }
    const face = (w, x, z) => { w.g.rotation.y = Math.atan2(x - w.g.position.x, z - w.g.position.z); };

    /** The summoning: the stump glowing, the wolves leaping out one by one, each with its taunt, then all howling. */
    function summon() {
      G.frays++;
      H.hush(); H.house.to = null;
      counter.classList.remove('on');
      packUp();
      const you = H.you;
      Object.assign(you, YOU_AT); you.g.position.set(you.x, 0, you.z); you.g.rotation.y = Math.atan2(STUMP.x - you.x, STUMP.z - you.z);
      Object.assign(G.her, HER_AT); G.her.g.position.set(G.her.x, 0, G.her.z); G.her.g.rotation.y = Math.atan2(STUMP.x - G.her.x, STUMP.z - G.her.z);
      H.say(G.her, G.frays > 1 ? AT_THE_STUMP.again : AT_THE_STUMP.summon, 2.6);
      const at = H.at, cam = { look: V3(), dist: 7.0, tilt: 0.5, yaw: -0.3 };
      const LEAP = 2.4, EVERY = 1.0, SECS = LEAP + EVERY * PACK.length + 1.6;
      let t = 0;
      const c = {
        cam,
        tick(dt) {
          t += dt;
          G.stump.glow(Math.min(1, t / 1.2));
          cam.look.set(STUMP.x + 0.2, 0.9, STUMP.z + 2.2).add(at);
          G.pack.forEach((w, i) => {
            const t0 = LEAP + i * EVERY, u = (t - t0) / 0.7;
            if (u < 0) return;
            if (!w.out) { w.out = true; w.g.visible = true; H.say(w, PACK_TAUNTS[w.wolf.id], SECS - t0); }
            const e = Math.min(1, u);
            w.g.position.set(STUMP.x + (w.at.x - STUMP.x) * e, 0.6 * (1 - e) + Math.sin(e * Math.PI) * 1.2, STUMP.z + (w.at.z - STUMP.z) * e);
            w.pose = e < 1 ? 'leap' : t > SECS - 1.4 ? 'howl' : 'prowl';
            face(w, MID.x, MID.z);
          });
          if (t >= SECS) cineEnd(false);
        },
        end() { landed(); },
      };
      cinePlay(c);
    }
    function landed() {
      G.stump.glow(0.25);
      for (const w of G.pack) { w.out = true; w.g.visible = true; w.g.position.set(w.at.x, 0, w.at.z); w.pose = 'prowl'; face(w, MID.x, MID.z); H.say(w, null); }
      startFray();
    }

    // ---------- the fray ----------
    function drawPack() {
      const F = G.fray.rules;
      packEl.innerHTML = PACK.map((w, i) => `<span class="${F.standing[i] ? (i === F.yours ? 'you' : '') : 'down'}">${w.name}</span>`).join('') + '<span class="her">Jezerbell beside you</span>';
    }
    function sizeBoards() {
      const box = panel.querySelector('.fray-boards').getBoundingClientRect();
      const scale = Math.max(12, Math.floor(Math.min((Math.min(innerWidth - 16, 760) - 40) / (2 * WIDTH), (box.height - 30) / BOARD_H, 30)));
      boards.size(scale);
    }
    /** The rumble's clock: seconds since the fray started (a Rumble keeps its own time from what it's handed). */
    const now = () => performance.now() / 1000 - G.fray.t0;
    function startFray() {
      G.fray = { rules: new Fray(), game: null, hand: null, seed: Math.floor(Math.random() * 1e6) + 1, downs: 0, mine: 0, yours: 0, pause: 0, t: 0, t0: performance.now() / 1000, target: TARGET(), aiming: 0, held: null, ending: 0 };
      panel.classList.add('on');
      counter.classList.remove('on');
      sizeBoards();
      for (const e of G.fray.rules.start()) frayEvent(e);
      drawPack();
    }
    /** A wolf turns on you: a fresh rumble, the greedy brawler at its pace. */
    function newDuel(i) {
      const F = G.fray, wolf = PACK[i];
      F.game = new Rumble(seeded(F.seed + i * 101), now());
      F.hand = new Hand({ ...GREEDY, think: wolf.think }, 1, seeded(F.seed * 7 + i));
      F.held = null; F.ending = 0;
      boards.clear();
      wolfName.textContent = wolf.name;
    }
    function frayEvent(e) {
      const F = G.fray;
      if (e.what === 'duel') newDuel(e.wolf);
      else if (e.what === 'down') {
        const w = G.pack[e.wolf];
        w.pose = 'down';
        H.say(w, PACK_DOWN[F.downs++ % PACK_DOWN.length], 2.4);
        if (e.by === 'her') H.say(G.her, IN_THE_FRAY.mine[F.mine++ % IN_THE_FRAY.mine.length], 2.2);
        else H.say(G.her, IN_THE_FRAY.yours[F.yours++ % IN_THE_FRAY.yours.length], 2.2);
      } else if (e.what === 'out') H.say(G.her, IN_THE_FRAY.youOut, 2.6);
      else if (e.what === 'over') {
        F.game = null; F.hand = null;
        F.pause = 1.6;   // (a beat to see the last board, then the pack slinks off)
      }
      drawPack();
    }
    /* Who's fighting whom, in the hall (the user, 21 Nov: "you should kind of see Jezebel kind of interacting with the
       werewolves. But for some reason, they're all staring at you"): your wolf comes up to you, hers to her, each
       lunging now and then; the rest prowl at their spots, eyeing one of you or the other; she and you face your own. */
    function stage(dt) {
      const F = G.fray.rules, mine = F.yours, hers = F.hers(), t = (G.fray.t += dt);
      G.pack.forEach((w, i) => {
        if (!F.standing[i]) return;
        const foe = i === mine ? H.you : i === hers ? G.her : null;
        const to = foe ? { x: foe.x + 0.12, z: foe.z - 1.15 } : w.at;
        const p = w.g.position, dx = to.x - p.x, dz = to.z - p.z, d = Math.hypot(dx, dz);
        if (d > 0.05) { const k = Math.min(d, 2.6 * dt) / d; p.x += dx * k; p.z += dz * k; }
        const look = foe || (i % 2 ? G.her : H.you);
        face(w, look.x, look.z);
        w.pose = d > 0.3 ? 'prowl' : foe && Math.sin(t * 2.3 + i * 1.7) > 0.75 ? 'leap' : 'prowl';
      });
      for (const [who, i] of [[H.you, mine], [G.her, hers]]) {
        if (i < 0 || !F.standing[i]) continue;
        const w = G.pack[i].g.position;
        who.g.rotation.y = Math.atan2(w.x - who.x, w.z - who.z);
      }
    }
    /* The rumble played on: your fists (a held one charging; let go while a ball's in the air, it fires as that lands,
       as on the Rumble test page), the wolf's hand, the game's clock; a knockout a moment on the board before the
       next wolf. */
    function frayTick(dt) {
      const F = G.fray;
      stage(dt);
      const g = F.game;
      if (g) {
        const t = now();
        if (F.aiming) F.target = { ...F.target, x: Math.max(0.2, Math.min(WIDTH - 0.2, F.target.x + F.aiming * dt * 6)) };
        if (!g.over()) {
          if (F.held?.later && g.canFire(0)) { g.fire(0, F.held.fist, angleFor(F.target, F.held.fist), false, t); F.held = null; }
          if (F.held && !F.held.later && !g.canFire(0)) F.held.from = t;
          g.sides[0].aim = angleFor(F.target, 0);   // (the shot clock fires the left fist where you're aiming)
          F.hand.play(g, t);
          g.tick(t);
          boards.take(g.drain(), g);
          for (const e of F.rules.tick(dt)) frayEvent(e);
        } else if ((F.ending += dt) >= NEXT_WOLF) {
          const won = g.winner === 0;
          for (const e of F.rules.duelOver(won)) frayEvent(e);
        }
        boards.prune(t);
        const o = { game: g, hands: [null, F.hand], you: 0, target: F.target, held: F.held };
        boards.draw(0, t, o); boards.draw(1, t, o);
      }
      if (F.rules.over && (F.pause -= dt) <= 0) endFray(F.rules.won);
    }
    /** Your fists: pressed (held, charging) and let go (fired; charged if held long enough). */
    function press(fist) {
      const F = G.fray;
      if (!F?.game || F.game.over() || F.held) return;
      F.held = { fist, from: now() };
      padFist(fist, true);
    }
    function release(fist) {
      const F = G.fray;
      if (!F?.held || F.held.fist !== fist) return;
      const t = now(), charged = t - F.held.from >= CHARGE_TIME;
      if (F.game && !F.game.over() && F.game.canFire(0)) { F.game.fire(0, fist, angleFor(F.target, fist), charged, t); F.held = null; }
      else F.held.later = true;
      padFist(fist, false);
    }
    /** Aiming at a point on your board (a pointer over it): both fists aim there. */
    function aimAt(ev) {
      const F = G.fray;
      if (!F) return;
      F.target = targetAt(canvases[0], ev);
    }
    current = {
      press, release, aimAt,
      aim(dir) { if (G.fray) G.fray.aiming = dir; },
      on: () => !!G.fray?.game,
    };
    addEventListener('resize', () => { if (G.fray) sizeBoards(); });
    /* For checking from the console (as door.js's doorTest): stand somewhere, find every octopus, summon the pack,
       end the duel on now as won or lost. */
    window.jezerbellTest = {
      G,
      stand(x, z) { const y = H.you; Object.assign(y, { x, z }); y.g.position.set(x, 0, z); H.house.to = null; },
      findAll() { for (const o of OCTOPUSES) if (!G.found.has(o.id)) find(o); },
      summon,
      duel(won = true) { if (G.fray?.game) G.fray.game.winner = won ? 0 : 1; },
    };

    /** It's over: the pack slinks off out of the front door; won, her octopus back and the Wayfinder shown. */
    function endFray(won) {
      panel.classList.remove('on');
      G.fray = null;
      G.stump.glow(0);
      G.after = { t: 0, won };
      if (won) G.won++;
      for (const w of G.pack) { w.pose = 'flee'; w.g.visible = true; }
      if (!won) for (const w of G.pack) H.say(w, PACK_WON, 2.4);
      else if (!G.missingBack) {
        G.missingBack = true;
        G.missing.g.visible = true;
        G.hops.push({ c: G.missing, from: { x: STUMP.x, y: 0.7, z: STUMP.z, yaw: 0 }, to: { x: G.her.x + 0.1, y: 1.55, z: G.her.z + 0.15, yaw: 0.4 }, t: 0 });
      }
    }
    function afterTick(dt) {
      const A = G.after;
      A.t += dt;
      const out = PLAN.out;
      for (const w of G.pack) {
        if (!w.g.visible) continue;
        const dx = out.x - w.g.position.x, dz = out.z + 1.5 - w.g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.4) { w.g.visible = false; continue; }
        const s = Math.min(d, 5.5 * dt);
        w.g.position.x += dx / d * s; w.g.position.z += dz / d * s;
        w.g.rotation.y = Math.atan2(dx, dz);
      }
      if (A.t > 2.2 && !A.said) {
        A.said = true;
        if (A.won) {
          H.talk(G.her, G.won === 1 ? [...AFTER.won] : [AFTER.again], () => showCard());
          G.herP.chatty = true;
        } else H.talk(G.her, [AFTER.lost]);
      }
      if (A.t > 2.2 && (!A.won || A.carded) && !H.talking()) { G.after = null; for (const w of G.pack) w.g.visible = false; showCount(); }
    }
    function showCard() {
      G.after && (G.after.carded = true);
      card.innerHTML = '<h3>Wolf-skull Wayfinder</h3><p>Put it on a little ship\'s chart table, and it takes you to the werewolves\' ship. Past her, their den.</p>';
      card.prepend(wayfinderArt());
      const b = document.createElement('button'); b.textContent = 'Lovely'; b.onclick = () => { card.classList.remove('on'); b.blur(); };
      card.append(b);
      card.classList.add('on');
    }

    // (the missing one rides on her shoulder once she's back)
    function missingTick() {
      if (!G.missingBack || G.hops.some((h) => h.c === G.missing)) return;
      G.her.g.updateMatrixWorld();
      const v = V3(-0.28, 1.62, 0.02).applyMatrix4(G.her.g.matrix);
      G.missing.g.position.copy(v); G.missing.g.rotation.y = G.her.g.rotation.y;
    }

    return {
      blocks: G.blocks,
      frozen: () => !!G.fray || !!G.after,
      host,
      exhibits: G.exhibits,
      remark: (id) => ON_A_PICTURE[id] ?? null,
      pictures: {
        name: 'Portraits', who: 'Jezerbell',
        list: () => PORTRAITS.map((q) => ({ id: q.id, title: q.title, x: q.x, z: BACK, portrait: q })),
        art(p) {
          G.flat ||= new Map();
          if (!G.flat.has(p.id)) G.flat.set(p.id, paintFlat(p.portrait));
          return G.flat.get(p.id);
        },
      },
      enter() {
        const again = G.visited;
        G.visited = true;
        Object.assign(G.her, { x: ARRIVE.her.x, z: ARRIVE.her.z }); G.her.g.position.set(G.her.x, 0, G.her.z);
        G.her.g.rotation.y = Math.PI * 0.85;
        if (G.tour < TOUR.length) G.tour = 0;
        H.talk(G.her, [again ? AT_THE_DOOR.again : AT_THE_DOOR.first]);
        showCount();
      },
      leave() {
        if (G.fray) { panel.classList.remove('on'); G.fray = null; G.stump.glow(0); for (const w of G.pack) w.g.visible = false; }
        G.after = null;
        card.classList.remove('on'); counter.classList.remove('on');
        H.hush();
        return `Jezerbell: "${GOODBYE}"`;
      },
      tick(dt) {
        G.ticks.forEach((p) => p.tick(dt));
        for (const w of G.pack) if (w.g.visible) w.tick(dt);
        hopTick(dt);
        missingTick();
        if (G.fray) { frayTick(dt); return; }
        if (G.after) { afterTick(dt); return; }
        if (!cine && !H.talking() && G.tour < TOUR.length) {
          const j = stopAt(G.tour, H.you.x, H.you.z);
          if (j >= 0) {
            G.tour = j + 1;
            H.talk(G.her, [...TOUR_LINES[TOUR[j].id]]);
            G.tourTalk = H.house.talk;
          }
        }
        if (!cine && G.tour >= TOUR.length && G.missingBack) G.herP.chatty = true;
      },
      /** The camera: during the fray, back and high enough to see you, her and the pack above the boards. */
      cam() {
        if (!G.fray && !G.after) return null;
        return { look: V3(STUMP.x + 0.3, 0.9, STUMP.z + 2.9), dist: 7.6, tilt: 0.5, yaw: -0.22 };
      },
      // (in the fray every key is the fray's: Z, X and Space your fists, held to charge; the arrows, A and D, your
      // aim; their letting go is the window's keyup, below)
      key(k, e) {
        if (!G.fray) return false;
        if (k in FISTS) { if (!e.repeat) press(FISTS[k]); }
        else if (k in AIMS) current.aim(AIMS[k]);
        return true;
      },
      prompt() {
        if (G.fray || G.after || H.talking()) return null;
        if (octopusAt(H.you, G.found)) return { text: 'Something wriggled', btn: 'Look' };
        if (atStump(H.you)) return { text: 'The summoning stump', btn: 'Use a werewolf charm' };
        return null;
      },
      act() {
        if (G.fray || G.after) return true;
        if (H.talking()) return false;
        const o = octopusAt(H.you, G.found);
        if (o) { find(o); return true; }
        if (atStump(H.you)) { summon(); return true; }
        return false;
      },
    };
  },
};
// (the pad's buttons, to the house built: there's only the one)
let current = null;
/** A fist's button lit while it's held. */
function padFist(fist, on) { panel.querySelector(`[data-fist="${fist}"]`)?.classList.toggle('held', on); }
// (letting go of a key: a fist fires, the aim stops turning)
addEventListener('keyup', (e) => {
  if (!current?.on()) return;
  const k = e.key.toLowerCase();
  if (k in FISTS) current.release(FISTS[k]);
  else if (k in AIMS) current.aim(0);
});
// (the buttons: a fist held to charge and let go to fire; an arrow held to turn the aim)
for (const b of panel.querySelectorAll('.fray-pad button')) {
  const fist = b.dataset.fist === undefined ? null : Number(b.dataset.fist), dir = Number(b.dataset.aim || 0);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); if (!current) return; if (fist !== null) current.press(fist); else current.aim(dir); });
  const up = () => { if (!current) return; if (fist !== null) current.release(fist); else current.aim(0); };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
// (your board: the pointer aims; a mouse's buttons are the fists, left and right)
canvases[0].addEventListener('pointermove', (e) => current?.aimAt(e));
canvases[0].addEventListener('pointerdown', (e) => {
  if (!current) return;
  current.aimAt(e);
  if (e.pointerType === 'mouse') { canvases[0].setPointerCapture(e.pointerId); current.press(e.button === 2 ? 1 : 0); }
});
canvases[0].addEventListener('pointerup', (e) => { if (current && e.pointerType === 'mouse') current.release(e.button === 2 ? 1 : 0); });
canvases[0].addEventListener('contextmenu', (e) => e.preventDefault());
