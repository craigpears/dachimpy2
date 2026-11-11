// The sloop race's marks: the numbered buoys round the long way, the next one lit, and the finish line
// (its rules: src/den-race.ts, nextBuoy and atFinish; their squares LAY.RACE.BUOYS and FINISH). The user,
// 11 Nov, on a first go: "I've not got a clue where I'm going", and of the little flags there were: "they
// don't look like they're in the actual proper direction at all"; so, "clearer [buoys] for the main route":
// a tall buoy at each bend, its number on a board above it, round it the long way; the one you're sailing for
// lit, a lamp on top and its number bright. And "a more ceremonious finish goal line for sure": two striped
// towers either side of the run home, a chequered banner strung between them over the water and a chequered
// line on it; crossing it, a burst of colour, a cheer of a card with your time and place. The shortcuts are
// never marked. Touches the rest only through race.js.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { scene, mat, mesh, canvasTex, V3, burst } from './world.js';
import { seaX, seaZ } from './sea.js';

const RC = LAY.RACE, CELL = SAIL.CELL;
export const marks = { buoys: [], banner: null, card: null, cardT: 0, lit: -1 };

/** A number on a board, for a buoy: white on red, or lit gold. */
function numberTex(n, lit) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = lit ? '#ffd54a' : '#c8372a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = lit ? '#7a4b00' : '#f4f1e8'; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = lit ? '#3a2200' : '#f4f1e8'; g.font = 'bold 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(n), w / 2, h / 2 + 6);
  });
}
/** A bend's buoy: a tall can, red and white bands, a pole with its number on a board (seen from anywhere:
    a sprite), a lamp on top lit when it's the next. Placed at the corner of its square toward the spit's
    tip, so she rounds it on the outside. */
function buoy(b) {
  const g = new THREE.Group(), red = mat('#c8372a', { roughness: 0.6 }), white = mat('#f4f1e8', { roughness: 0.6 });
  for (let i = 0; i < 3; i++) { const band = mesh(new THREE.CylinderGeometry(0.62 - i * 0.08, 0.7 - i * 0.08, 0.5, 14), i % 2 ? white : red); band.position.y = 0.2 + i * 0.5; g.add(band); }
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6), mat('#3a3330')); pole.position.y = 2.9; g.add(pole);
  const sm = [numberTex(b.n, false), numberTex(b.n, true)].map((t) => new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  const sign = new THREE.Sprite(sm[0]); sign.scale.set(2.4, 2.4, 1); sign.position.y = 4.2; g.add(sign);
  const lamp = mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffe9a0', emissive: '#ffcc33', emissiveIntensity: 0 })); lamp.position.y = 5.7; g.add(lamp);
  const [c, r] = b.at, toTip = b.bend === 'R' ? -1 : 1;
  g.position.set(seaX(c) + toTip * CELL * 0.35, 0, seaZ(r));
  scene.add(g);
  return { g, sign, sm, lamp, n: b.n };
}
/** Chequered cloth. */
const chequer = (cols, rows) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(cols * 8, rows * 8, (x) => { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f1e8'; x.fillRect(i * 8, j * 8, 8, 8); } }) });
/** A finish tower: a striped post on a stone foot, a gold ball on top, a pennant. */
function tower(x, y, z) {
  const g = new THREE.Group(), stone = mat('#9a948a', { roughness: 1 }), red = mat('#c8372a'), white = mat('#f4f1e8');
  const foot = mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.2, 10), stone); foot.position.y = 0.4; g.add(foot);
  for (let i = 0; i < 6; i++) { const s = mesh(new THREE.CylinderGeometry(0.28, 0.32, 1, 10), i % 2 ? white : red); s.position.y = 1.5 + i; g.add(s); }
  const ball = mesh(new THREE.SphereGeometry(0.4, 12, 10), mat('#e8b52a', { metalness: 0.4, roughness: 0.4 })); ball.position.y = 7.3; g.add(ball);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
/** The finish: its towers either side of the run home (one on the last spit, one out past the left-hand
    trade wind), the banner strung between them, and the line on the water. */
function finish() {
  const x = (seaX(RC.FINISH[0]) + seaX(RC.FINISH[0] + 1)) / 2, run = RC.FINISH[1];
  const zA = seaZ(run - 1), zB = seaZ(run + 2) - 0.6;
  tower(x, 0.9, zA); tower(x, -0.4, zB);
  const len = Math.abs(zA - zB);
  const banner = mesh(new THREE.PlaneGeometry(len, 1.4, 24, 1), chequer(24, 2));
  banner.rotation.y = Math.PI / 2; banner.position.set(x, 6.3, (zA + zB) / 2);
  banner.userData.base = banner.geometry.attributes.position.array.slice();
  scene.add(banner);
  const line = mesh(new THREE.PlaneGeometry(0.6, CELL * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: chequer(2, 12).map, transparent: true, opacity: 0.85, depthWrite: false }), false);
  line.position.set(x, 0.08, seaZ(run + 0.5)); line.renderOrder = 3;
  scene.add(line);
  return banner;
}

/** Built with the race's course (race.js). */
export function marksWorld() {
  if (marks.buoys.length) return;
  marks.buoys = RC.BUOYS.map(buoy);
  marks.banner = finish();
}

/** The moment she crosses the line: a burst of colour over it, and a card with her time and place. */
export function crossed(time, place) {
  const x = (seaX(RC.FINISH[0]) + seaX(RC.FINISH[0] + 1)) / 2, z = seaZ(RC.FINISH[1]);
  for (const col of ['#ffd54a', '#c8372a', '#f4f1e8', '#5aa0e0']) burst(V3(x, 6, z), col, 26, 5);
  if (!marks.card) {
    const el = marks.card = document.createElement('div');
    Object.assign(el.style, { position: 'fixed', top: '28%', left: '50%', transform: 'translate(-50%, -50%)', padding: '18px 34px', borderRadius: '12px', background: 'rgba(20,14,9,.86)', color: '#f4e9cf', font: '700 30px/1.25 Georgia, serif', textAlign: 'center', zIndex: 25, pointerEvents: 'none', display: 'none', border: '3px solid #e8b52a', boxShadow: '0 8px 30px rgba(0,0,0,.45)' });
    document.body.appendChild(el);
  }
  const nth = place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;
  marks.card.innerHTML = `<div style="font-size:15px;letter-spacing:4px;color:#e8b52a">OVER THE LINE</div><div>${time}</div><div style="font-size:22px">${nth}${place === 1 ? ' · home first!' : ''}</div>`;
  marks.card.style.display = 'block';
  marks.cardT = 5;
}

/** Each tick: the next buoy lit (`next`, 1 to 5; anything else none), the banner flapping, the card. */
export function marksTick(dt, next) {
  const t = performance.now() / 1000;
  marks.buoys.forEach((b, i) => {
    const on = b.n === next;
    if (on !== (marks.lit === b.n)) b.sign.material = b.sm[on ? 1 : 0];
    b.lamp.material.emissiveIntensity = on ? 1.4 + Math.sin(t * 5) * 0.6 : 0;
    b.sign.scale.setScalar(on ? 3 + Math.sin(t * 3) * 0.15 : 2.4);
    b.g.position.y = Math.sin(t * 1.3 + i) * 0.08;
    b.g.rotation.z = Math.sin(t * 0.9 + i) * 0.04;
  });
  marks.lit = next;
  const B = marks.banner;
  if (B) {
    const p = B.geometry.attributes.position, base = B.userData.base;
    for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + Math.sin(t * 3 + base[i * 3] * 0.8) * 0.15);
    p.needsUpdate = true;
  }
  if (marks.card && marks.cardT > 0 && (marks.cardT -= dt) <= 0) marks.card.style.display = 'none';
}
