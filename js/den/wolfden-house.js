/* The wolf den's hut, a first version (14 Nov): its scene in the house shell (house.js), a place of its own, not in
   the housing district's list (den.html?at=wolfden). Its rules (the hut, the table, the moon, the lesson's boards) are
   src/den-wolfden.ts's; the puzzle src/navigation.ts's on a wolf den's board (four rings, wild places), drawn by
   nav-board.js lying on the round star table; the tutorial src/wolf-den-tutorial.ts's, its opening choice drawn by
   js/tutorial-choice.js; Dignity's lines src/lines/dignity.ts's WOLF_DEN and TUTOR.

   Dignity waits at the table. Walk up to it and Space (or the button) to chart: the camera comes over the table, and
   the board's yours, by its keys (Left / Right turn the ring, Up / Down pick one, Space drops) or the buttons along the
   bottom. T for her lessons: pick a part, and she lays its board and plays its moves, then hands it to you. Each
   constellation charted takes its points off the moon in the window; as it wanes, the werewolf's shadow at the window
   turns back to a wolf-kin's, and when it's gone the next pack comes. Esc, or Stop, to step back from the table. */
import * as THREE from 'three';
import { PIRATES } from '../den-look.js';
import { PLAN, WALLS, BACK, ARRIVE, TABLE, atTable, WINDOW, FURNISH, Moon, layBoard, PACE_LESSON } from '../den-wolfden.js';
import { WOLF_DEN_TUTORIAL } from '../wolf-den-tutorial.js';
import { Navigation } from '../navigation.js';
import { blocksOf } from '../den-houses.js';
import { WOLF_DEN, TUTOR } from '../lines/dignity.js';
import { FURNITURE, place } from './furniture.js';
import { navBoard } from './nav-board.js';
import { person } from './props-people.js';
import { camera, mat, mesh, V3 } from './world.js';

const chooser = () => import('../tutorial-choice.js');
const ARROWS = { arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', arrowup: 'ArrowUp', arrowdown: 'ArrowDown' };

// ---------- the buttons along the bottom while you chart (a phone has no keys) ----------
const bar = document.createElement('div');
bar.className = 'wolf-bar'; bar.id = 'wolf-bar';
bar.innerHTML = ['<button data-k="ArrowDown" title="Lower ring (Down)">Ring in</button>', '<button data-k="ArrowLeft" title="Turn anticlockwise (Left)">&#x27F2;</button>',
  '<button data-k=" " class="drop" title="Drop the star (Space)">Drop</button>', '<button data-k="ArrowRight" title="Turn clockwise (Right)">&#x27F3;</button>',
  '<button data-k="ArrowUp" title="Higher ring (Up)">Ring out</button>', '<button data-k="t" title="Dignity\'s lessons (T)">Lessons</button>', '<button data-k="Escape" title="Step back (Esc)">Stop</button>'].join('');
const style = document.createElement('style');
style.textContent = `.wolf-bar { position: fixed; left: 50%; bottom: 64px; transform: translateX(-50%); z-index: 30; display: none; gap: 6px; flex-wrap: wrap; justify-content: center; width: min(620px, calc(100vw - 32px)); }
.wolf-bar.on { display: flex; }
.wolf-bar button { min-width: 44px; min-height: 44px; padding: 0 12px; font: 700 16px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(36, 23, 14, 0.92); border: 1px solid #c8a050; border-radius: 10px; cursor: pointer; }
.wolf-bar button.drop { background: #6a4a14; }
.wolf-score { position: fixed; top: 64px; right: 16px; z-index: 30; display: none; font: 700 15px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: rgba(20, 14, 30, 0.85); border: 1px solid #8a7ab0; border-radius: 10px; padding: 6px 12px; text-align: right; }
.wolf-score.on { display: block; }`;
const scoreEl = document.createElement('div');
scoreEl.className = 'wolf-score'; scoreEl.id = 'wolf-score';
document.head.append(style);
document.body.append(bar, scoreEl);

/** The moon through the window: a night sky, the moon waning by what's left of it, and at the sill the head of a
    werewolf, its eyes red while werewolves are left, a wolf-kin's (smaller, grey) once they've all turned back. */
function moonPainter() {
  const W = 320, H = 260, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return {
    tex,
    paint(share, wolves) {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#060a24'); sky.addColorStop(1, '#1a1f4a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(220,226,255,${0.3 + (i * 37 % 10) / 20})`; g.fillRect((i * 97) % W, (i * 53) % (H * 0.7), 2, 2); }
      // (the moon: full, then shadowed from the right as it wanes)
      const mx = W * 0.62, my = H * 0.34, r = 46;
      const glow = g.createRadialGradient(mx, my, r * 0.8, mx, my, r * 2.4);
      glow.addColorStop(0, `rgba(240,236,200,${0.35 * share + 0.05})`); glow.addColorStop(1, 'rgba(240,236,200,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(mx, my, r * 2.4, 0, Math.PI * 2); g.fill();
      g.save();
      g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#2a2c48'; g.fillRect(mx - r, my - r, 2 * r, 2 * r);
      g.fillStyle = '#f2eccc'; g.beginPath(); g.arc(mx - (1 - share) * 2 * r, my, r, 0, Math.PI * 2); g.fill();
      g.restore();
      // (the head at the sill: ears, snout; a werewolf's bigger and red-eyed)
      const big = wolves > 0, s = big ? 1 : 0.7, hx = W * 0.3, hy = H - 6;
      g.fillStyle = big ? '#0a0a12' : '#3a3a48';
      g.beginPath();
      g.moveTo(hx - 52 * s, hy); g.lineTo(hx - 40 * s, hy - 70 * s); g.lineTo(hx - 30 * s, hy - 112 * s); g.lineTo(hx - 12 * s, hy - 82 * s);
      g.lineTo(hx + 12 * s, hy - 82 * s); g.lineTo(hx + 30 * s, hy - 112 * s); g.lineTo(hx + 40 * s, hy - 70 * s); g.lineTo(hx + 76 * s, hy - 40 * s); g.lineTo(hx + 52 * s, hy);
      g.closePath(); g.fill();
      g.fillStyle = big ? '#ff3030' : '#c8c8a0';
      for (const dx of [-14, 14]) { g.beginPath(); g.arc(hx + dx * s, hy - 62 * s, 4 * s, 0, Math.PI * 2); g.fill(); }
      tex.needsUpdate = true;
    },
  };
}

/** The round star table: a dark top with a gold rim on one stout leg, a navy cloth under the wheel. */
function starTable() {
  const g = new THREE.Group(), wood = mat(0x3a2414), gold = mat(0xb89a3a, { metalness: 0.5, roughness: 0.4 });
  const top = mesh(new THREE.CylinderGeometry(TABLE.r, TABLE.r, 0.08, 40), wood);
  top.position.y = TABLE.top - 0.04; g.add(top);
  const rim = mesh(new THREE.TorusGeometry(TABLE.r, 0.035, 8, 48), gold);
  rim.rotation.x = Math.PI / 2; rim.position.y = TABLE.top; g.add(rim);
  const leg = mesh(new THREE.CylinderGeometry(0.16, 0.26, TABLE.top - 0.08, 16), wood);
  leg.position.y = (TABLE.top - 0.08) / 2; g.add(leg);
  const foot = mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.08, 24), wood);
  foot.position.y = 0.04; g.add(foot);
  const cloth = new THREE.Mesh(new THREE.CircleGeometry(TABLE.r - 0.06, 40), new THREE.MeshBasicMaterial({ color: 0x0a1640, toneMapped: false }));
  cloth.rotation.x = -Math.PI / 2; cloth.position.y = TABLE.top + 0.002; g.add(cloth);
  return g;
}

export const WOLFDEN_HOUSE = {
  id: 'wolfden', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { visited: false, tabled: false, playing: false, lesson: null, choice: null, moon: new Moon(), plainSaid: 0, rising: 0 };
    for (const p of FURNISH) {
      const opts = { col: p.col };
      if (p.kind === 'table') { opts.cookies = true; opts.cup = false; }   // (a plate of chocolate chip cookies)
      if (p.kind === 'candelabra' || p.kind === 'lantern') opts.light = true;
      place(R, FURNITURE[p.kind](opts), p.x, p.z, p.yaw || 0);
    }
    const table = starTable();
    table.position.set(TABLE.x, 0, TABLE.z);
    R.add(table);
    G.blocks = [...blocksOf(FURNISH.filter((p) => p.kind !== 'rug')), { x: TABLE.x, z: TABLE.z, r: TABLE.r + 0.15 }];
    // The table's light: the stars' glow on the room, blue.
    const glow = new THREE.PointLight(0x7aa0ff, 2.2, 6, 1.6);
    glow.position.set(TABLE.x, TABLE.top + 1.1, TABLE.z);
    R.add(glow);
    // The window, the moon through it.
    G.moonArt = moonPainter();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW.w, WINDOW.h), new THREE.MeshBasicMaterial({ map: G.moonArt.tex, toneMapped: false }));
    pane.position.set(WINDOW.x, WINDOW.y, BACK + 0.01);
    R.add(pane);
    const frameMat = mat(0x2a1a0e);
    for (const [w, h, x, y] of [[WINDOW.w + 0.16, 0.08, 0, WINDOW.h / 2], [WINDOW.w + 0.16, 0.08, 0, -WINDOW.h / 2], [0.08, WINDOW.h, -WINDOW.w / 2, 0], [0.08, WINDOW.h, WINDOW.w / 2, 0], [0.05, WINDOW.h, 0, 0]]) {
      const bit = mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat);
      bit.position.set(WINDOW.x + x, WINDOW.y + y, BACK + 0.04); R.add(bit);
    }
    const paintMoon = () => G.moonArt.paint(G.moon.share(), G.moon.werewolves());
    paintMoon();
    // Dignity, at the table's side.
    G.digP = person({ look: PIRATES.Dignity, parent: R, x: ARRIVE.dignity.x, z: ARRIVE.dignity.z, idle: 'sway', say: H.say });
    G.dig = G.digP.p;
    G.dig.g.rotation.y = Math.atan2(TABLE.x - ARRIVE.dignity.x, TABLE.z - ARRIVE.dignity.z);
    const line = (text) => { H.hush(); H.talk(G.dig, [text]); };

    // ---------- the board on the table ----------
    function setBoard(game) {
      G.board?.dispose();
      G.board = navBoard({
        game, sky: false, size: TABLE.board, at: V3(TABLE.x, TABLE.top + 0.012, TABLE.z), lean: Math.PI / 2,
        onConstellation(done) {
          if (G.lesson) return;
          const w = G.moon.chart(done.points);
          paintMoon();
          if (w.last) { line(WOLF_DEN.last); G.rising = 4; }
          else if (w.half) line(WOLF_DEN.half);
          else if (done.step > 1) line(WOLF_DEN.chain);
          else if (G.plainSaid++ % 3 === 0) line(WOLF_DEN.plain);
        },
        onBooch() { if (!G.lesson) line(WOLF_DEN.booch); },
      });
      G.board.idle = !G.playing;
      R.add(G.board.group);
    }
    setBoard(new Navigation(Math.random, { den: true }));

    // ---------- charting at the table, and her lessons ----------
    const showScore = () => {
      if (!G.playing) { scoreEl.classList.remove('on'); return; }
      const g = G.board.game, wolves = G.moon.werewolves();
      scoreEl.innerHTML = `${g.score} points<br>${wolves ? `${wolves} ${wolves > 1 ? 'werewolves' : 'werewolf'} left` : 'All turned back'} · moon ${Math.round(G.moon.share() * 100)}%`;
      scoreEl.classList.add('on');
    };
    function play(on) {
      G.playing = on;
      G.board.idle = !on;
      bar.classList.toggle('on', on);
      if (!on) { G.choice?.close(); G.choice = null; }
      showScore();
    }
    async function lessons() {
      if (G.choice) return;
      const C = await chooser();
      if (!G.playing || G.choice) return;
      G.choice = C.tutorialChoice(WOLF_DEN_TUTORIAL, {
        at: 'bottom',
        onPlay({ part }) { G.choice = null; startLesson(part); },
        onClose() { G.choice = null; },
      });
    }
    function startLesson(part) {
      const b = layBoard(part.shows.ref);
      if (!b) return;
      setBoard(b.game);
      G.board.idle = false;
      G.lesson = { moves: b.moves, t: PACE_LESSON.FIRST, done: false };
      line(TUTOR.show.replace('{title}', part.title));
    }
    function lessonTick(dt) {
      const L = G.lesson;
      if (L.done || G.board.busy()) return;
      if ((L.t -= dt) > 0) return;
      const step = L.moves.shift();
      if (step) {
        if ('drop' in step) G.board.drop();
        else { G.board.game.ring = step.turn; G.board.turn(step.dir); }
        L.t = PACE_LESSON.MOVE;
        return;
      }
      // (the lesson's moves played and shown: the board's yours, as it is)
      L.done = true;
      G.lesson = null;
      line(TUTOR.after);
    }

    const inst = {
      blocks: G.blocks,
      frozen: () => G.playing,
      enter() {
        const again = G.visited;
        G.visited = true;
        line(again ? WOLF_DEN.again : WOLF_DEN.hello);
      },
      leave() {
        play(false);
        G.lesson = null;
        H.hush();
        return `Dignity: "${WOLF_DEN.bye}"`;
      },
      tick(dt) {
        G.board.tick(dt);
        G.digP.tick?.(dt);
        if (G.lesson) lessonTick(dt);
        if (G.rising > 0 && (G.rising -= dt) <= 0) { G.moon.rise(); paintMoon(); line(WOLF_DEN.rise); }
        if (!G.tabled && atTable(H.you) && !H.talking()) { G.tabled = true; line(WOLF_DEN.table); }
        if (G.playing) showScore();
      },
      /** Charting: the camera over the table, looking down on the wheel. */
      cam() {
        if (!G.playing) return null;
        // (far enough back to see the whole wheel, the next star on its handle too, above the bar of buttons)
        const vh = camera.fov * Math.PI / 360, fit = (TABLE.board * 0.74) / Math.tan(vh) / Math.min(1, camera.aspect);
        return { look: V3(TABLE.x, TABLE.top, TABLE.z + 0.2), dist: fit, tilt: 1.38, yaw: 0 };
      },
      key(key, e) {
        if (!G.playing) return false;
        if (key === 'escape') { play(false); return true; }
        if (key === 't') { if (!e.repeat) lessons(); return true; }
        if (G.lesson) return ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' '].includes(key);
        return G.board.key(ARROWS[key] ?? key, e);
      },
      prompt() {
        if (G.playing) return null;
        if (H.talking()) return null;
        return atTable(H.you) ? { text: 'The star table', btn: 'Chart the stars' } : null;
      },
      act() {
        if (G.playing) return true;
        if (atTable(H.you)) { H.hush(); play(true); return true; }
        return false;
      },
      // (the bar's buttons are the keys)
      press(k) {
        if (k === 'Escape') return play(false);
        if (k === 't') return lessons();
        if (!G.lesson) G.board.key(k, {});
      },
    };
    current = inst;
    return inst;
  },
};
// (the bar's buttons, to the wolf den built: there's only the one)
let current = null;
bar.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !current) return;
  b.blur();
  current.press(b.dataset.k);
});
