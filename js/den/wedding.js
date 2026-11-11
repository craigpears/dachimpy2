/* Mischievious's wedding (IDEAS.md, "A Puzzle Pirates wedding"): a third place, like the sea, on her
   island. weddingEnter() takes you there and weddingLeave() home (the cheat "Mischievious's wedding",
   den.html?at=wedding, and later the sea map, use them). You choose the tone first (Happy and cheesy,
   or Dark humour), and the venue's shown as she left it: pretty, or a wreck from the last one, with
   her welcome. Then the planner down the right, her reacting to everything in a speech bubble: who you
   marry (her, in which of her looks; a line of suitors, blind-date style; or someone of your own), the
   venue, a theme (its layout and its guests' outfits), tuning it all (pick up, move, turn, recolour
   or take away any prop, add more, redress a guest), the plot, and "Start the wedding": the ceremony
   (wedding-ceremony.js), ending on a framed portrait to save or share as a link
   (den.html?at=wedding&w=...), which opens straight into that wedding, ready to play again. The set-up's
   kept in this browser as you go. The rules and words: src/den-wedding.ts. The island and its pirates:
   wedding-scene.js; the props: wedding-props.js. */
import * as THREE from 'three';
import * as LOOK from '../den-look.js';
import {
  TONES, VENUES, THEMES, PLOTS, PROPS, SUGGEST, WELCOME, GUARDS, PROP_R, AREA, MAX_PROPS, DYE_NAMES, SECURITY, RAIDERS,
  Gush, fresh, dressFor, moveTo, clean, encode, decode, seatsFor, suitors, suitorTitle, themeOf, themeLook, caption, readSecs, cleanProp,
} from '../den-wedding.js';
import { $, scene, camera, renderer, hemi, skyDome, paintSky, keep, myLook, V3, toast as denToast, toastQuiet, warm, sunOver, ray, burst, wearLook, worldLets, shake } from './world.js';
import { cine, cinePlay, cineEnd, cineLets, bubble, bubbleAt, stepTo } from './cine.js';
import { ISLE, VENUE_AT, ISLE_SKY, buildIsle, figure, dropFigure, poseFig, restArms, dressable, heartsTick, heartsClear } from './wedding-scene.js';
import { propMesh } from './wedding-props.js';
import { ceremony, PORTRAIT_CAM } from './wedding-ceremony.js';

const KEY = 'carp.den.wedding';
// (the den's own news is kept quiet while you're here: these are the island's)
const toast = (text, bad = false) => denToast(text, bad, false, true);
const STEPS = [['partner', 'Who'], ['venue', 'Where'], ['theme', 'Theme'], ['tune', 'Tune it'], ['plot', 'How it goes']];
const MIS_SPOT = { x: -1.8, z: -2.9 }, YOU_SPOT = { x: -0.55, z: -3.1 }, PARTNER_SPOT = { x: 0.75, z: -3.1 };
/** Her looks to choose from (js/den-look.js), or a stand-in till they're there. */
function versions() {
  const v = LOOK.MISCHIEVIOUS_VERSIONS;
  if (Array.isArray(v) && v.length) return v;
  return [{ title: 'Mischievious', look: LOOK.PIRATES?.Mischievious || { body: 'f', skin: 2, hair: 'long', hairCol: 'black', patch: false, smile: true, hat: 'none', top: 'corset', topCol: 'magenta', topCol2: 'black', legs: 'long', legsCol: 'magenta', feet: 'shoes', feetCol: 'black' } }];
}
const hex = (c) => LOOK.dyeHex(c);
const dyesHere = () => DYE_NAMES.filter((d) => LOOK.DYES[d]);

/** All there is of the wedding just now. */
export const wed = {
  on: false, snap: false, w: null, step: 'tone', pick: null, isle: null, root: null, propsG: null, propG: [], fig: null,
  gush: new Gush(), sel: null, tool: null, drag: null, rdrag: null, yaw: 0, zoom: 1, shot: null, play: null,
  line: null, bub: null, show: null, lineup: null, welcome: null, portrait: null, settle: 0, sky: null, ring: null, mark: null,
};

// ---------- kept as you go ----------
function save() { keep(KEY, encode(wed.w)); }
function kept() { try { const s = JSON.parse(localStorage.getItem(KEY)); return typeof s === 'string' ? decode(s) : null; } catch { return null; } }
function setLink(code) {
  try {
    const u = new URL(location.href);
    u.searchParams.set('at', 'wedding');
    if (code) u.searchParams.set('w', code); else u.searchParams.delete('w');
    history.replaceState(history.state, '', u);
    return u.href;
  } catch { return location.href; }
}

// ---------- names ----------
const yourName = () => { try { return localStorage.getItem('carp.den.name')?.trim() || 'You'; } catch { return 'You'; } };
function partnerName() {
  const p = wed.w?.partner;
  if (!p) return 'your sweetheart';
  if (p.kind === 'her') return 'Mischievious';
  if (p.kind === 'suitor') return suitors(wed.w.tone)[p.i]?.name || 'your sweetheart';
  return String(p.look.name || '').trim() || 'your sweetheart';
}

// ---------- the place and its pirates ----------
function enterSky() {
  wed.sky = { col: skyDome.geometry.attributes.color, bg: scene.background.clone(), fog: scene.fog.color.clone(), hemi: [hemi.color.clone(), hemi.groundColor.clone()] };
  paintSky(ISLE_SKY.zenith, ISLE_SKY.horizon);
  hemi.color.set(ISLE_SKY.hemi[0]); hemi.groundColor.set(ISLE_SKY.hemi[1]);
}
function leaveSky() {
  const s = wed.sky;
  if (!s) return;
  skyDome.geometry.setAttribute('color', s.col);
  scene.background.copy(s.bg); scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hemi[0]); hemi.groundColor.copy(s.hemi[1]);
  sunOver(0, 0, 0);
  wed.sky = null;
}
/** The venue root to where the venue is, and the sun's shadows over it. */
function placeVenue() {
  const at = VENUE_AT[wed.w.venue] || VENUE_AT.beach;
  wed.root.position.copy(at);
  const w = V3(0, 0, 0); wed.isle.updateMatrixWorld(true); wed.root.localToWorld(w);
  sunOver(w.x, w.y, w.z);
}
function buildProps() {
  wed.propsG.clear();
  wed.propG = (wed.step === 'tone' ? [] : wed.w.props).map((p, i) => {
    const g = propMesh(p);
    g.userData.prop = p; g.userData.i = i;
    // (a cake on a table sits on it)
    if (p.k === 'cake' && !p.w && wed.w.props.some((t) => t.k === 'table' && !t.w && Math.hypot(t.x - p.x, t.z - p.z) < 0.5)) g.position.y = 0.78;
    wed.propsG.add(g);
    return g;
  });
}
const seats = () => seatsFor(wed.w.props, wed.w.guests.length || 8);
/** Everyone, afresh: you, Mischievious, your partner, the security, the guests (in their seats), and
    the raiders (hidden till they crash it). */
function buildCast() {
  const F = wed.fig;
  if (F) [F.you, F.mis, F.partner, ...F.guards, ...F.guests, ...F.raiders, ...(wed.lineup?.list || [])].forEach(dropFigure);
  wed.lineup = null;
  const R = wed.root, w = wed.w;
  const mis = figure(R, misLook(), { ...MIS_SPOT });
  const fig = { mis, you: figure(R, myLook, { ...YOU_SPOT }), guards: SECURITY.map((l, i) => figure(R, l, { x: GUARDS[i].x, z: GUARDS[i].z, yaw: i ? -Math.PI / 2 : Math.PI / 2, sword: true })), guests: [], raiders: RAIDERS.map((l) => figure(R, l, { x: 9, z: 0, sword: true })), partner: null };
  fig.raiders.forEach((r) => { r.g.visible = false; });
  wed.fig = fig;
  partnerFigure();
  guestsFigures();
}
function misLook() {
  const p = wed.w?.partner, vs = versions();
  return (p?.kind === 'her' ? vs[p.ver] || vs[0] : vs[wed.show?.i ?? 0] || vs[0]).look;
}
function partnerFigure() {
  const F = wed.fig, p = wed.w.partner;
  if (F.partner && F.partner !== F.mis) dropFigure(F.partner);
  F.partner = null;
  if (!p) return;
  if (p.kind === 'her') { F.partner = F.mis; wearLook(F.mis, dressable(misLook())); return; }
  const s = p.kind === 'suitor' ? suitors(wed.w.tone)[p.i] : null;
  F.partner = figure(wed.root, s ? s.look : p.look, { ...PARTNER_SPOT, hurt: !!s?.hurt, bouquet: s ? 'rose' : null });
}
function guestsFigures() {
  const F = wed.fig;
  F.guests.forEach(dropFigure);
  const st = seats();
  F.guests = wed.w.guests.map((l, i) => {
    const g = figure(wed.root, l, { x: st[i].x, z: st[i].z, yaw: st[i].yaw });
    g.sit = st[i].sit;
    g.g.userData.guest = i;
    return g;
  });
}
function reseat() { const st = seats(); wed.fig.guests.forEach((g, i) => Object.assign(g, { x: st[i].x, z: st[i].z, yaw: st[i].yaw, sit: st[i].sit })); }
const everyone = () => { const F = wed.fig; return F ? [F.you, F.mis, ...(F.partner && F.partner !== F.mis ? [F.partner] : []), ...F.guards, ...F.guests] : []; };

// ---------- her lines ----------
function say(fig, text, secs = null) {
  if (!fig || !text) { wed.line = null; return; }
  if (wed.line?.text !== text) wed.bub.textContent = text;
  wed.line = { fig, text, until: performance.now() + 1000 * (secs ?? readSecs(text) * 1.5 + 1.2), giggle: 0.7 };
}
const gush = (ev) => say(wed.fig.mis, wed.gush.say(ev));

// ---------- entering and leaving ----------
function fade(then) {
  const f = $('wed-fade');
  f.classList.add('on');
  setTimeout(() => { then(); setTimeout(() => f.classList.remove('on'), 120); }, 360);
}
/** Off to her island (from the den, or later the sea map). The set-up from a share link (?w=), else
    the one kept in this browser, else a fresh one: the tone to choose first. */
export function weddingEnter() {
  if (wed.on) return;
  wed.isle ||= buildIsle();
  if (!wed.root) {
    wed.root = new THREE.Group(); wed.propsG = new THREE.Group(); wed.root.add(wed.propsG); wed.isle.add(wed.root);
    wed.bub = bubble('', document.body, 'wrap');
    wed.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.85, depthWrite: false }));
    wed.ring.renderOrder = 3; wed.root.add(wed.ring);
  }
  fade(() => {
    wed.on = true; wed.snap = true; wed.isle.visible = true; toastQuiet.on = true;
    document.body.classList.add('wedding');
    enterSky();
    const code = new URLSearchParams(location.search).get('w'), shared = code ? decode(code) : null, mine = kept();
    let ev = null;
    if (shared) { wed.w = shared; wed.step = 'plot'; ev = 'shared'; }
    else if (mine?.theme && mine.partner) { wed.w = mine; wed.step = 'tune'; ev = 'back'; }
    else { wed.w = fresh('happy'); wed.step = 'tone'; }
    if (code && !shared) toast('That wedding link didn\'t work: a fresh one, then', true);
    wed.gush = new Gush(wed.w.tone);
    Object.assign(wed, { pick: null, sel: null, tool: null, show: null, yaw: 0, zoom: 1, portrait: null });
    placeVenue(); buildProps(); buildCast();
    panel();
    warm(wed.isle);
    if (ev) setTimeout(() => gush(ev), 500);
  });
}
/** Home again: the den (or the sea) as it was. */
export function weddingLeave() {
  if (!wed.on) return;
  fade(() => {
    if (wed.play || wed.welcome) { wed.leaving = true; cineEnd(true); wed.leaving = false; }
    wed.on = false; wed.snap = true; wed.isle.visible = false; toastQuiet.on = false;
    cineLets.cineView = 0;   // (straight back, not easing out of the island's last shot across the sea)
    document.body.classList.remove('wedding');
    $('wed-portrait').classList.remove('on');
    wed.bub.style.display = 'none'; wed.line = null;
    heartsClear();
    leaveSky();
    try { const u = new URL(location.href); u.searchParams.delete('w'); if (u.searchParams.get('at') === 'wedding') u.searchParams.delete('at'); history.replaceState(history.state, '', u); } catch { /* never mind */ }
  });
}

// ---------- the tone, and her welcome ----------
function chooseTone(tone) {
  wed.w = fresh(tone);
  wed.gush = new Gush(tone);
  wed.step = 'welcome';
  placeVenue(); buildProps(); buildCast();
  save();
  welcome();
}
/* As you arrive: a look over the venue (as she left it), you walking up, her coming to meet you, and
   her welcome, each line its own beat; then she asks. */
function welcome() {
  const lines = WELCOME[wed.w.tone], F = wed.fig, dark = wed.w.tone === 'dark';
  const beats = lines.map((text) => readSecs(text) + 0.9);
  const c = { t: 0, cam: { look: V3(), dist: 14, tilt: 0.45, yaw: 0.6 }, tick: wTick, end: wEnd };
  Object.assign(F.you, { x: 0, z: 6.2, yaw: Math.PI });
  Object.assign(F.mis, { x: MIS_SPOT.x, z: MIS_SPOT.z, yaw: 0 });
  wed.welcome = c;
  cinePlay(c);
  panel();
  function wTick(dt) {
    const t = (c.t += dt);
    let i = 0, t0 = 0;
    while (i < beats.length && t > t0 + beats[i]) t0 += beats[i++];
    if (i >= beats.length) { cineEnd(false); return; }
    const L = t - t0;
    // You walk up the aisle; she comes to meet you.
    const moving = new Set();
    if (!stepTo(F.you, F.you, 0, 1.6, 2.2, dt)) moving.add(F.you); else F.you.yaw = Math.PI;
    F.you.g.position.x = F.you.x; F.you.g.position.z = F.you.z;
    if (i >= 1 || t > 1.5) { if (!stepTo(F.mis, F.mis, 0, 0.2, 1.8, dt)) moving.add(F.mis); else F.mis.yaw = 0; F.mis.g.position.x = F.mis.x; F.mis.g.position.z = F.mis.z; }
    everyone().forEach((p) => { restArms(p); if (!moving.has(p)) poseFig(p, dt); else p.yaw = p.g.rotation.y; });
    // (giggly, hands clasped, a little bounce as she talks)
    if (!moving.has(F.mis)) { F.mis.arms.forEach((a, j) => a.rotation.set(-1.1, 0, j ? -0.45 : 0.45)); F.mis.g.position.y = Math.abs(Math.sin(L * 8)) * 0.04; }
    if (L > 0.25) say(F.mis, lines[i], 99); else say(null);
    const C = c.cam;
    if (i === 0) shot(C, 0, 0.6, 0, 13.5 - L * 0.6, 0.5, 0.7 - L * 0.12);
    else if (i === 1 && dark) shot(C, 3.2, 1.1, -3.2, 7.5, 0.22, 0.55);   // (the security)
    else shot(C, (F.mis.x + F.you.x) / 2, 1.4, (F.mis.z + F.you.z) / 2, 4.6, 0.14, 0.95);
  }
  function wEnd() {
    wed.welcome = null;
    Object.assign(F.you, { ...YOU_SPOT, yaw: 0 }); Object.assign(F.mis, { ...MIS_SPOT, yaw: 0 });
    if (wed.leaving) return;
    wed.step = 'partner';
    panel();
    say(F.mis, `${lines.at(-1)} ${wed.gush.say('ask')}`);
  }
}
function shot(C, x, y, z, dist, tilt, yaw) { C.look.set(x, y, z); wed.root.localToWorld(C.look); Object.assign(C, { dist, tilt, yaw }); }

// ---------- who you marry ----------
function pickHer(ver) {
  const first = wed.w.partner?.kind !== 'her';
  wed.show = null;
  wed.w.partner = { kind: 'her', ver };
  partnerFigure();
  twirl(wed.fig.mis);
  save(); panel();
  gush(first ? 'her' : 'version');
}
// She models each of her looks in turn, each by its portrait's title, till you pick one.
function startShow() {
  wed.pick = 'her';
  wed.show = { i: wed.w.partner?.kind === 'her' ? wed.w.partner.ver : 0, t: 0, n: 0 };
  modelLook();
  panel();
}
function modelLook() {
  const v = versions()[wed.show.i];
  wearLook(wed.fig.mis, dressable(v.look));
  twirl(wed.fig.mis);
  say(wed.fig.mis, `"${v.title}"`, 2.8);
  panel();
}
function twirl(p) { p.twirl = 0.8; }
// "Here are your bachelors!" A line of them walks in, bouquets out, and each steps forward in turn.
function startLineup() {
  wed.pick = 'suitors';
  wed.show = null;
  if (wed.fig.partner && wed.fig.partner !== wed.fig.mis) wed.fig.partner.g.visible = false;
  wed.lineup?.list.forEach(dropFigure);
  const list = suitors(wed.w.tone).map((s, i, all) => {
    const x = -3.5 + i * 7 / Math.max(1, all.length - 1);
    const f = figure(wed.root, s.look, { x: 8 + i * 1.2, z: -3.5, yaw: -Math.PI / 2, hurt: !!s.hurt, bouquet: 'rose' });
    f.home = x;
    return f;
  });
  wed.lineup = { list, i: -1, t: 0, phase: 'walk' };
  Object.assign(wed.fig.you, { x: 0, z: -1.2, yaw: Math.PI });   // (watching them, like a game show's contestant)
  wearLook(wed.fig.mis, dressable(misLook()));
  Object.assign(wed.fig.mis, { x: -5, z: -3.0, yaw: 0.5 });
  say(wed.fig.mis, wed.gush.say('bachelors'), 2.5);
  panel();
}
function pickSuitor(i) {
  const L = wed.lineup, f = L && L.phase !== 'off' ? L.list[i] : null;
  wed.w.partner = { kind: 'suitor', i };
  partnerFigure();
  // The one you picked comes over to stand by you; the rest walk off.
  if (f) {
    Object.assign(wed.fig.partner, { x: f.x, z: f.z });
    wed.fig.partner.walkTo = { ...PARTNER_SPOT };
    dropFigure(f);
    L.list.splice(i, 1);
    L.phase = 'off';
  }
  Object.assign(wed.fig.mis, { x: MIS_SPOT.x, z: MIS_SPOT.z, yaw: 0 });
  Object.assign(wed.fig.you, { ...YOU_SPOT, yaw: 0 });
  save(); panel();
  gush(i === 0 ? 'suitorOne' : 'suitor');
}
function pickOwn(body = null) {
  wed.pick = 'own';
  wed.show = null;
  endLineup();
  const old = wed.w.partner?.kind === 'own' ? wed.w.partner.look : null;
  const b = body || (old?.body === 'm' || old?.body === 'f' ? old.body : Math.random() < 0.5 ? 'm' : 'f');
  const look = { ...LOOK.randomLook(b), name: old?.name || '' };
  wed.w.partner = { kind: 'own', look: clean({ partner: { kind: 'own', look } }).partner.look };
  wearLook(wed.fig.mis, dressable(misLook()));
  partnerFigure();
  twirl(wed.fig.partner);
  save(); panel();
  gush('own');
}
function endLineup() {
  const L = wed.lineup;
  if (!L) return;
  L.list.forEach(dropFigure);
  wed.lineup = null;
  if (wed.fig.partner) wed.fig.partner.g.visible = true;
  Object.assign(wed.fig.you, { ...YOU_SPOT, yaw: 0 });
  Object.assign(wed.fig.mis, { x: MIS_SPOT.x, z: MIS_SPOT.z, yaw: 0 });
}

// ---------- where, the theme, and tuning it ----------
function chooseVenue(id) {
  wed.w = moveTo(wed.w, id);
  placeVenue(); buildProps(); reseat();
  save(); panel();
  gush(`venue_${id}`);
}
function chooseTheme(id) {
  wed.w = dressFor(wed.w, id);
  wed.sel = null;
  buildProps(); guestsFigures();
  const v = V3(0, 1.2, 0); wed.root.localToWorld(v);
  for (const d of themeOf(id).dyes.slice(0, 3)) burst(v, hex(d), 12, 4);
  save(); panel();
  gush(`theme_${id}`);
}
const selProp = () => (wed.sel?.kind === 'prop' ? wed.w.props[wed.sel.i] : null);
function propsChanged(ev) {
  buildProps(); reseat(); save(); panel();
  if (ev) gush(ev);
}
function addProp(k, x, z) {
  if (wed.w.props.length >= MAX_PROPS) { say(wed.fig.mis, 'Ooh, it\'s full! Take something away first, and we\'ll squeeze it in.'); return; }
  const T = themeOf(wed.w.theme), c = k === 'splat' ? 'red' : k === 'barrel' ? 'brown' : T ? T.dyes[wed.w.props.length % 3] : 'rose';
  const p = cleanProp({ k, x, z, r: 0, c });
  wed.w.props.push(p);
  wed.sel = { kind: 'prop', i: wed.w.props.length - 1 };
  const v = V3(p.x, 0.4, p.z); wed.root.localToWorld(v); burst(v, '#fff3c4', 10, 2.4);
  propsChanged('add');
}
function turnProp(d) { const p = selProp(); if (!p) return; p.r = (p.r + d + 8) % 8; propsChanged('turn'); }
function colourProp(c) { const p = selProp(); if (!p) return; p.c = c; propsChanged('colour'); }
function removeProp() {
  const p = selProp(); if (!p) return;
  wed.w.props.splice(wed.sel.i, 1);
  wed.sel = null;
  propsChanged('remove');
}
function redress(i) {
  const g = wed.w.guests[i], body = g.body === 'f' ? 'f' : 'm';
  wed.w.guests[i] = themeLook(wed.w.theme || 'rosy', body);
  regDress(i);
  gush('dress');
}
function recolour(i, c) { wed.w.guests[i] = { ...wed.w.guests[i], topCol: c, hatCol: c }; regDress(i); gush('dress'); }
function regDress(i) {
  const f = wed.fig.guests[i];
  wearLook(f, dressable(wed.w.guests[i]));
  f.g.userData.guest = i;
  twirl(f);
  save(); panel();
}

// ---------- the wedding itself, and its portrait ----------
function startWedding() {
  if (!wed.w.partner || !wed.w.theme) return;
  endLineup();
  wed.sel = null; wed.tool = null; wed.show = null;
  say(null);
  save();
  wed.step = 'playing';
  panel();
  ceremony({
    get w() { return wed.w; }, root: wed.root, fig: wed.fig, propG: wed.propG,
    names: () => ({ you: yourName(), partner: partnerName() }), seats, dyes: () => themeOf(wed.w.theme)?.dyes.slice(0, 4) || ['rose', 'pink', 'white'],
    hex, say: (f, text) => say(f, text, 99), shake: () => { worldLets.shake = Math.max(shake, 0.15); }, set play(v) { wed.play = v; },
  }, (skipped) => {
    wed.play = null;
    if (wed.leaving) return;
    wed.step = 'portrait';
    wed.settle = skipped ? 1.3 : 0.7;   // (the camera's still easing in from wherever the cutscene was)
    const P = PORTRAIT_CAM; wed.shot = { look: P.look.clone(), dist: P.dist, tilt: P.tilt, yaw: P.yaw }; wed.root.localToWorld(wed.shot.look);
  });
}
/* The last shot, held: drawn once more just now and read off the canvas (it doesn't keep what it
   drew, so it's read straight after), then framed in gilt with its caption. */
function takePortrait() {
  renderer.render(scene, camera);
  const src = renderer.domElement, sw = src.width, sh = src.height;
  // A 4:3 window on the middle of the view.
  const w = Math.min(sw, sh * 4 / 3), h = w * 3 / 4, sx = (sw - w) / 2, sy = (sh - h) / 2;
  const OUT = 1200, oh = OUT * 3 / 4, pad = 46, cap = 112;
  const cv = document.createElement('canvas');
  cv.width = OUT + pad * 2; cv.height = oh + pad * 2 + cap;
  const g = cv.getContext('2d');
  const gold = g.createLinearGradient(0, 0, cv.width, cv.height);
  gold.addColorStop(0, '#7a5216'); gold.addColorStop(0.3, '#f2cf6a'); gold.addColorStop(0.55, '#a8761f'); gold.addColorStop(0.8, '#f6dc86'); gold.addColorStop(1, '#6e4812');
  g.fillStyle = gold; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(60, 35, 8, .7)'; g.lineWidth = 4; g.strokeRect(12, 12, cv.width - 24, cv.height - 24);
  g.strokeRect(pad - 8, pad - 8, OUT + 16, oh + 16);
  g.drawImage(src, sx, sy, w, h, pad, pad, OUT, oh);
  // A soft vignette, like an old painting.
  const vg = g.createRadialGradient(pad + OUT / 2, pad + oh / 2, oh * 0.45, pad + OUT / 2, pad + oh / 2, OUT * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,5,.45)');
  g.fillStyle = vg; g.fillRect(pad, pad, OUT, oh);
  g.fillStyle = '#f6ecd2'; g.fillRect(pad, pad + oh + 18, OUT, cap - 30);
  g.strokeStyle = '#7a5216'; g.lineWidth = 2; g.strokeRect(pad, pad + oh + 18, OUT, cap - 30);
  g.fillStyle = '#3a2210'; g.textAlign = 'center';
  g.font = '700 36px Alegreya, Georgia, serif';
  g.fillText(caption(wed.w, yourName(), partnerName()), cv.width / 2, pad + oh + 60);
  g.font = 'italic 20px Alegreya, Georgia, serif';
  g.fillText('On Mischievious\'s island, with love', cv.width / 2, pad + oh + 88);
  wed.portrait = cv.toDataURL('image/png');
  $('wed-img').src = wed.portrait;
  $('wed-portrait').classList.add('on');
  panel();
}
function closePortrait(again) {
  $('wed-portrait').classList.remove('on');
  wed.portrait = null;
  heartsClear();
  if (again) {
    wed.w = { ...fresh(wed.w.tone) };
    wed.pick = null;
    setLink(null);
    save();
  }
  wed.step = again ? 'partner' : 'plot';
  wed.shot = null;
  placeVenue(); buildProps(); buildCast();
  panel();
  if (again) gush('again');
}
$('wed-save').onclick = () => {
  if (!wed.portrait) return;
  const a = document.createElement('a');
  a.href = wed.portrait;
  a.download = `wedding-${partnerName().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  document.body.append(a); a.click(); a.remove();
};
$('wed-link').onclick = () => {
  const href = setLink(encode(wed.w));
  const ok = () => toast('Link copied: it opens this wedding, ready to play again');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(href).then(ok, () => toast('The link\'s in the address bar, to copy'));
  else toast('The link\'s in the address bar, to copy');
};
$('wed-again').onclick = () => closePortrait(true);
$('wed-close').onclick = () => closePortrait(false);
$('wed-home').onclick = (e) => { e.currentTarget.blur(); weddingLeave(); };
$('wed-afresh').onclick = (e) => {
  e.currentTarget.blur();
  if (wed.play || wed.welcome) return;
  endLineup();
  wed.w = fresh('happy'); wed.step = 'tone'; wed.sel = null; wed.tool = null; wed.show = null; wed.pick = null;
  setLink(null);
  try { localStorage.removeItem(KEY); } catch { /* never mind */ }
  placeVenue(); buildProps(); buildCast(); panel(); say(null);
};

// ---------- the planner ----------
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function opt(name, blurb, on, click, tag = '') {
  const b = el('button', 'opt' + (on ? ' on' : ''));
  if (tag) b.append(el('em', '', tag));
  b.append(document.createTextNode(name));
  if (blurb) b.append(el('small', '', blurb));
  b.onclick = (e) => { e.currentTarget.blur(); click(); };
  return b;
}
function btn(text, click, cls = '') { const b = el('button', cls, text); b.onclick = (e) => { e.currentTarget.blur(); click(); }; return b; }
function swatches(row, cur, set, list) {
  for (const d of list) {
    const b = el('button', 'sw' + (d === cur ? ' cur' : ''));
    b.style.background = hex(d); b.title = d; b.setAttribute('aria-label', d);
    b.onclick = () => set(d);
    row.append(b);
  }
}
const can = (step) => step === 'partner' || (step === 'venue' || step === 'theme' ? !!wed.w.partner : !!(wed.w.partner && wed.w.theme));
function go(step) {
  if (!can(step)) return;
  if (step !== 'partner') { endLineup(); wed.show = null; if (wed.w.partner?.kind === 'her' || wed.pick === 'her') { wearLook(wed.fig.mis, dressable(misLook())); } }
  if (step !== 'tune') { wed.sel = null; wed.tool = null; }
  wed.step = step;
  panel();
  if (step === 'theme' && !wed.w.theme) say(wed.fig.mis, `Ooh, a theme! Shall we start from ${themeOf(SUGGEST[wed.w.tone].theme).name.toLowerCase()}? Or anything you like!`);
  if (step === 'plot') say(wed.fig.mis, 'And how shall it go? I do love a bit of drama. Or none! Your choice.');
}
function panel() {
  const box = $('wed-body'), steps = $('wed-steps'), w = wed.w;
  $('wed').classList.toggle('off', ['welcome', 'playing', 'portrait'].includes(wed.step));
  steps.replaceChildren(...(wed.step === 'tone' ? [] : STEPS.map(([id, name]) => { const b = btn(name, () => go(id), wed.step === id ? 'on' : ''); b.disabled = !can(id); return b; })));
  box.replaceChildren();
  const h = (t) => box.append(el('h3', '', t)), note = (t) => box.append(el('p', 'note', t));
  const next = (label, step) => { const b = btn(label, () => go(step), 'next'); b.disabled = !can(step); box.append(b); };
  if (wed.step === 'tone') {
    h('What sort of wedding would you like?');
    note('Mischievious is waiting on her island. She does love a wedding.');
    for (const t of TONES) box.append(opt(t.name, t.blurb, false, () => chooseTone(t.id)));
  } else if (wed.step === 'partner') {
    h('Who are you marrying?');
    box.append(opt('Marry Mischievious', 'She\'s free. She\'s nearly always free.', w.partner?.kind === 'her' || wed.pick === 'her', startShow));
    if (wed.pick === 'her') {
      note('She\'ll model each of her looks for you. Which one?');
      const r = el('div', 'row');
      versions().forEach((v, i) => r.append(btn(v.title, () => pickHer(i), (w.partner?.kind === 'her' && w.partner.ver === i && !wed.show) || wed.show?.i === i ? 'on' : '')));
      box.append(r);
    }
    box.append(opt('Here are your bachelors!', 'A line of suitors, bouquets out, blind-date style.', w.partner?.kind === 'suitor' || wed.pick === 'suitors', startLineup));
    if (wed.pick === 'suitors') {
      const r = el('div', 'row');
      suitors(w.tone).forEach((s, i) => r.append(btn(`${suitorTitle(s, i)}: ${s.name}`, () => pickSuitor(i), w.partner?.kind === 'suitor' && w.partner.i === i ? 'on' : '')));
      box.append(r);
    }
    box.append(opt('Someone of your own', 'Anyone you like: a man, a woman, dressed however.', w.partner?.kind === 'own', () => pickOwn()));
    if (w.partner?.kind === 'own') {
      const r = el('div', 'row');
      r.append(btn('Someone else', () => pickOwn()), btn('A man', () => pickOwn('m'), w.partner.look.body === 'm' ? 'on' : ''), btn('A woman', () => pickOwn('f'), w.partner.look.body === 'f' ? 'on' : ''));
      box.append(r);
      const nr = el('div', 'row'), inp = el('input');
      inp.placeholder = 'Their name'; inp.maxLength = 18; inp.value = w.partner.look.name || '';
      inp.oninput = () => { const v = inp.value.replace(/[^a-z0-9 '-]/gi, '').slice(0, 18); w.partner.look.name = v; if (!v) delete w.partner.look.name; save(); };
      inp.onkeydown = (e) => { if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); };
      nr.append(el('span', 'note', 'Name: '), inp);
      box.append(nr);
    }
    next('Next: where?', 'venue');
  } else if (wed.step === 'venue') {
    h('Where shall it be?');
    for (const v of VENUES) box.append(opt(v.name, v.blurb, w.venue === v.id, () => chooseVenue(v.id)));
    next('Next: the theme', 'theme');
  } else if (wed.step === 'theme') {
    h('Pick a theme to start from');
    note('It lays out the venue and dresses the guests. Change anything you like after.');
    const pick = SUGGEST[w.tone].theme;
    for (const t of [...THEMES].sort((a, b) => (b.id === pick) - (a.id === pick))) box.append(opt(t.name, t.blurb, w.theme === t.id, () => chooseTheme(t.id), t.id === pick ? 'her pick ♥' : ''));
    next('Next: tune it', 'tune');
  } else if (wed.step === 'tune') {
    h('Make it yours');
    note('Click a prop to pick it up and drag it about. Click a guest to redress them. Right-drag turns the view; the wheel zooms.');
    box.append(el('p', 'note', 'Add:'));
    const r = el('div', 'row');
    for (const [k, name] of PROPS) r.append(btn(name, () => { wed.tool = wed.tool === k ? null : k; wed.sel = null; panel(); }, wed.tool === k ? 'on' : ''));
    box.append(r);
    if (wed.tool) note(`Click where the ${PROPS.find(([k]) => k === wed.tool)[1].toLowerCase()} goes (Esc: never mind).`);
    const p = selProp();
    if (p) {
      box.append(el('h3', '', PROPS.find(([k]) => k === p.k)[1] + (p.w ? ' (wrecked)' : '')));
      const r1 = el('div', 'row');
      r1.append(btn('⟲ Turn', () => turnProp(1)), btn('Turn ⟳', () => turnProp(-1)));
      if (p.w) r1.append(btn('Mend it', () => { p.w = false; delete p.w; propsChanged('add'); }));
      r1.append(btn('Take it away', removeProp));
      box.append(r1);
      const r2 = el('div', 'row');
      const T = themeOf(w.theme), first = T ? [...T.dyes] : [];
      swatches(r2, p.c, colourProp, [...first, ...dyesHere().filter((d) => !first.includes(d))]);
      box.append(r2);
    } else if (wed.sel?.kind === 'guest') {
      const i = wed.sel.i;
      box.append(el('h3', '', `Guest ${i + 1}`));
      const r1 = el('div', 'row');
      r1.append(btn('Something else to wear', () => redress(i)), btn('Back in their outfit', () => { wed.w.guests[i] = { ...themeOf(w.theme).guests[i] }; regDress(i); }));
      box.append(r1);
      note('Their colours:');
      const r2 = el('div', 'row');
      const T = themeOf(w.theme), first = T ? [...T.dyes] : [];
      swatches(r2, w.guests[i].topCol, (c) => recolour(i, c), [...first, ...dyesHere().filter((d) => !first.includes(d))]);
      box.append(r2);
    }
    note(`${w.props.length} of ${MAX_PROPS} props · Q/E turn · Delete takes it away`);
    next('Next: how it goes', 'plot');
  } else if (wed.step === 'plot') {
    h('How does the wedding go?');
    const sug = SUGGEST[w.tone].plots;
    for (const p of [...PLOTS].sort((a, b) => sug.includes(b.id) - sug.includes(a.id))) box.append(opt(p.name, p.blurb, w.plot === p.id, () => { w.plot = p.id; save(); panel(); gush(`plot_${p.id}`); }, sug[0] === p.id ? 'her pick ♥' : ''));
    const b = btn('Start the wedding!', startWedding, 'go');
    b.disabled = !can('plot');
    box.append(b);
    note(`${yourName()} & ${partnerName()}, ${VENUES.find((v) => v.id === w.venue).where}.`);
  }
}

// ---------- the mouse and keys on her island ----------
function groundAt(e) {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const o = V3(0, 0, 0); wed.root.localToWorld(o);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -o.y), p)) return null;
  return wed.root.worldToLocal(p);
}
function picked(e) {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const hits = ray.intersectObjects([wed.propsG, ...wed.fig.guests.map((g) => g.g)], true);
  for (const h of hits) {
    let o = h.object;
    while (o && o !== wed.root) {
      if (o.userData.guest !== undefined) return { kind: 'guest', i: o.userData.guest };
      if (o.userData.i !== undefined && o.parent === wed.propsG) return { kind: 'prop', i: o.userData.i };
      o = o.parent;
    }
  }
  // (a flat splatter's easy to miss: the nearest prop to where you clicked, if you're right by it)
  const g = groundAt(e);
  if (!g) return null;
  let best = null;
  wed.w.props.forEach((p, i) => { const d = Math.hypot(p.x - g.x, p.z - g.z); if (d < Math.min(0.7, PROP_R[p.k]) && (!best || d < best.d)) best = { kind: 'prop', i, d }; });
  return best;
}
const inArea = (p) => p && Math.abs(p.x) <= AREA.x && p.z >= AREA.z0 && p.z <= AREA.z1;
export function weddingDown(e) {
  if (!wed.on || cine) return;
  if (e.button === 2) { wed.rdrag = { x: e.clientX, y: e.clientY }; return; }
  if (e.button !== 0 || wed.step !== 'tune') return;
  if (wed.tool) {
    const g = groundAt(e);
    if (inArea(g)) { addProp(wed.tool, g.x, g.z); wed.tool = null; panel(); }
    return;
  }
  const hit = picked(e);
  wed.sel = hit ? { kind: hit.kind, i: hit.i } : null;
  if (hit?.kind === 'prop') {
    const g = groundAt(e), p = wed.w.props[hit.i];
    // (a table takes the cake on it along with it)
    const on = p.k === 'table' ? wed.w.props.map((q, j) => j).filter((j) => wed.w.props[j].k === 'cake' && Math.hypot(wed.w.props[j].x - p.x, wed.w.props[j].z - p.z) < 0.5) : [];
    wed.drag = { i: hit.i, moved: false, dx: g ? p.x - g.x : 0, dz: g ? p.z - g.z : 0, on };
  }
  if (hit?.kind === 'guest') twirl(wed.fig.guests[hit.i]);
  panel();
}
export function weddingMove(e) {
  if (!wed.on) return;
  if (wed.rdrag && e.buttons & 2) {
    wed.yaw -= (e.clientX - wed.rdrag.x) * 0.006;
    wed.rdrag.x = e.clientX;
    return;
  }
  if (wed.drag) {
    const g = groundAt(e), p = wed.w.props[wed.drag.i], m = wed.propG[wed.drag.i];
    if (!g || !p || !m) return;
    const q = cleanProp({ ...p, x: g.x + wed.drag.dx, z: g.z + wed.drag.dz });
    if (q.x !== p.x || q.z !== p.z) {
      for (const j of wed.drag.on) { const c = wed.w.props[j]; c.x += q.x - p.x; c.z += q.z - p.z; wed.propG[j].position.x = c.x; wed.propG[j].position.z = c.z; }
      p.x = q.x; p.z = q.z; m.position.x = p.x; m.position.z = p.z; wed.drag.moved = true;
      if (p.k === 'bench') reseat();
    }
    return;
  }
  if (wed.step === 'tune' && !cine) {
    const hit = wed.tool ? null : picked(e);
    renderer.domElement.style.cursor = wed.tool ? 'copy' : hit ? 'pointer' : '';
    const g = wed.tool ? groundAt(e) : null;
    wed.mark = g && inArea(g) ? g : null;
  }
}
export function weddingUp(e) {
  if (!wed.on) return;
  if (e.button === 2) wed.rdrag = null;
  if (e.button === 0 && wed.drag) {
    const moved = wed.drag.moved;
    wed.drag = null;
    if (moved) propsChanged('move');
  }
}
export function weddingWheel(e) {
  if (!wed.on || cine) return;
  wed.zoom = Math.max(0.45, Math.min(1.8, wed.zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
}
/** Keys on her island (Space and Esc skip a cutscene first: den.js). True if it used the key. */
export function weddingKey(key, e) {
  if (!wed.on) return false;
  if (e.target instanceof HTMLInputElement) return true;
  if (wed.step === 'portrait' && key === 'escape') { if (wed.portrait) closePortrait(false); return true; }
  if (wed.step !== 'tune') return true;
  if (key === 'escape') { wed.tool = null; wed.sel = null; panel(); }
  else if ((key === 'q' || key === 'e') && !e.repeat) turnProp(key === 'q' ? 1 : -1);
  else if ((key === 'delete' || key === 'backspace') && !e.repeat) removeProp();
  return true;
}

// ---------- each tick, and the camera ----------
export function weddingTick(dt0) {
  if (!wed.on || !wed.fig) return;
  /* By the clock on the wall, as a cutscene is (cine.js): below 20 frames a second the den's own step
     runs slow, and the suitors crawled in. (A step run by hand, den.step, still counts.) */
  const now = performance.now(), dt = Math.max(dt0, Math.min(0.25, (now - (wed.wall ?? now)) / 1000));
  wed.wall = now;
  heartsTick(dt);
  const F = wed.fig, t = performance.now() / 1000;
  if (!wed.play && !wed.welcome) {
    const moving = new Set();
    // She models her looks, one after another.
    if (wed.show && (wed.show.t += dt) > 2.9) {
      wed.show.t = 0; wed.show.n++;
      if (wed.show.n >= versions().length) { wed.show = null; panel(); } else { wed.show.i = (wed.show.i + 1) % versions().length; modelLook(); }
    }
    // The bachelors: in they walk, then each steps forward in turn with their line.
    const L = wed.lineup;
    if (L) {
      if (L.phase === 'off') {
        L.list.forEach((f) => { if (!stepTo(f, f, 9.5, f.z, 3.2, dt)) moving.add(f); f.g.position.x = f.x; f.g.position.z = f.z; });
        if (L.list.every((f) => f.x > 9.3)) { L.list.forEach(dropFigure); wed.lineup = null; }
      } else {
        let all = true;
        L.list.forEach((f, i) => {
          const fz = L.i === i && L.phase === 'step' ? -2.8 : -3.5;
          if (!stepTo(f, f, f.home, fz, 3, dt)) { moving.add(f); all = false; } else f.yaw = 0;
          f.g.position.x = f.x; f.g.position.z = f.z;
        });
        L.t += dt;
        const title = () => say(F.mis, `${suitorTitle(suitors(wed.w.tone)[L.i], L.i)}!`, 1.7);
        if (all && L.phase === 'walk') { L.phase = 'title'; L.i = 0; L.t = 0; title(); }
        else if (L.phase === 'title' && L.t > 1.5) { L.phase = 'step'; L.t = 0; const s = suitors(wed.w.tone)[L.i]; say(L.list[L.i], `${s.name}: "${s.line}"`, readSecs(s.line) + 0.8); }
        else if (L.phase === 'step' && L.t > readSecs(suitors(wed.w.tone)[L.i].line) + 1.2) {
          L.t = 0;
          if (L.i + 1 < L.list.length) { L.i++; L.phase = 'title'; title(); }
          else { L.phase = 'wait'; L.i = -1; say(F.mis, "Well? Who's it to be?", 99); }
        }
      }
      L?.list.forEach((f) => { restArms(f); f.arms[0].rotation.x = -1.1; if (!moving.has(f)) poseFig(f, dt); });
    }
    // Your partner walking over to stand by you.
    const P = F.partner;
    if (P?.walkTo) { if (stepTo(P, P, P.walkTo.x, P.walkTo.z, 2.4, dt)) { P.walkTo = null; P.yaw = 0; } else moving.add(P); P.g.position.x = P.x; P.g.position.z = P.z; }
    for (const p of everyone()) {
      if (moving.has(p)) { p.yaw = p.g.rotation.y; continue; }
      restArms(p);
      if (p === F.partner && F.partner !== F.mis && !p.hurt) p.arms[0].rotation.x = -0.9;   // (flowers out)
      poseFig(p, dt);
      if (p.twirl > 0) { p.twirl = Math.max(0, p.twirl - dt); p.g.rotation.y = p.yaw + (1 - p.twirl / 0.8) * Math.PI * 2; p.g.position.y += Math.sin(p.twirl / 0.8 * Math.PI) * 0.12; }
    }
    // Her, as she talks: a little bounce, hands clasped, now and then a giggle behind them.
    if (wed.line?.fig === F.mis && !moving.has(F.mis)) {
      const k = Math.max(0, wed.line.giggle -= dt);
      F.mis.arms.forEach((a, j) => a.rotation.set(-1.15 - k * 0.6, 0, j ? -0.45 : 0.45));
      F.mis.g.position.y += Math.abs(Math.sin(t * 9)) * 0.035 * (k > 0 ? 1 : 0.3);
    }
    if (wed.line && performance.now() > wed.line.until) wed.line = null;
    // The portrait: once the camera's settled, framed.
    if (wed.step === 'portrait' && !wed.portrait && (wed.settle -= dt) <= 0) takePortrait();
  }
  // The speech bubble over whoever's speaking.
  const l = wed.line;
  if (l && l.fig?.g.parent) {
    const v = V3(); l.fig.g.getWorldPosition(v); v.y += 2.2;
    bubbleAt(wed.bub, true, v.x, v.y, v.z);
    if (parseFloat(wed.bub.style.top) < 70) wed.bub.style.top = '70px';
    // (kept clear of the planner down the right)
    const r = $('wed').getBoundingClientRect(), bw = wed.bub.offsetWidth / 2;
    let x = parseFloat(wed.bub.style.left);
    if (!$('wed').classList.contains('off') && x + bw > r.left - 10) x = r.left - 10 - bw;
    wed.bub.style.left = `${Math.max(bw + 8, x)}px`;
  } else wed.bub.style.display = 'none';
  // The ring under what you've picked (or where a new prop will go).
  const p = selProp(), gi = wed.sel?.kind === 'guest' ? F.guests[wed.sel.i] : null, mk = wed.tool ? wed.mark : null;
  wed.ring.visible = wed.step === 'tune' && !!(p || gi || mk);
  if (wed.ring.visible) {
    const at = p ? { x: p.x, z: p.z, r: PROP_R[p.k] } : gi ? { x: gi.x, z: gi.z, r: 0.5 } : { x: mk.x, z: mk.z, r: 0.5 };
    wed.ring.position.set(at.x, 0.04, at.z);
    wed.ring.scale.setScalar(at.r);
    wed.ring.material.color.set(mk ? '#7dff7a' : '#ffd23a');
    wed.ring.material.opacity = 0.6 + 0.3 * Math.sin(t * 5);
  }
}
/** The camera on her island (den.js uses it whole while you're here; a cutscene's own shots go over
    it): the whole venue from the foot of the aisle, turned and zoomed as you like; close on her as
    she models her looks or welcomes you; along the line of suitors; the portrait's shot at the end. */
export function weddingCam() {
  const C = planCam();
  if (!C || C === wed.shot) return C;
  // (the venue in the middle of what the planner leaves showing: the look slid right of where it'd be)
  const off = panelOff();
  if (off > 0) {
    const half = Math.tan(camera.fov * Math.PI / 360) * camera.aspect * C.dist * Math.cos(C.tilt * 0.5);
    C.look.x += Math.cos(C.yaw) * half * off; C.look.z -= Math.sin(C.yaw) * half * off;
  }
  return C;
}
/** How much of the screen's width the planner takes, down the right (none when it's out of the way). */
function panelOff() {
  const r = $('wed').getBoundingClientRect(), off = $('wed').classList.contains('off') || r.width < 10 ? 0 : (innerWidth - r.left + 14) / innerWidth;
  return off < 0.6 && innerWidth > 760 ? off : 0;
}
function planCam() {
  if (!wed.on || !wed.root) return null;
  const C = { look: V3(), dist: 15, tilt: 0.6, yaw: wed.yaw };
  const F = wed.fig;
  if (wed.step === 'tone') { shot(C, 4, 2, 10, 46, 0.42, 0.35 + performance.now() / 40000); return C; }
  if ((wed.step === 'portrait' || wed.step === 'playing') && wed.shot) return wed.shot;
  if (wed.step === 'partner' && wed.lineup) {
    const L = wed.lineup, f = L.i >= 0 && L.list[L.i];
    if (f && L.phase === 'step') shot(C, f.x, 1.3, f.z, 3.6, 0.12, 0.05);
    else {
      // (all of them in what the planner leaves showing)
      const hh = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
      shot(C, 0, 1.2, -3.4, Math.max(8.6, 5 / (Math.tan(hh) * (1 - panelOff()))) * wed.zoom, 0.16, 0);
    }
    return C;
  }
  if (wed.step === 'partner' && (wed.show || wed.pick === 'her' || wed.w.partner?.kind === 'own') && F) {
    const f = wed.w.partner?.kind === 'own' && wed.pick !== 'her' ? F.partner : F.mis;
    shot(C, f.x, 1.1, f.z, 4.2 * wed.zoom, 0.26, 0.2 + wed.yaw);
    return C;
  }
  // (the whole venue, in what the planner leaves showing)
  const hh = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
  shot(C, 0, 0.5, -0.4, Math.max(15.5, 6.2 / (Math.tan(hh) * (1 - panelOff()))) * wed.zoom, 0.62, wed.yaw);
  return C;
}
